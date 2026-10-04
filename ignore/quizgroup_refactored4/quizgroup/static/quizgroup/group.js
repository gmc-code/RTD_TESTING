/*
 * QuizGroup.Controller - one instance per .quizgroup-block.
 *
 * Owns everything that is about the QUIZ (wizard navigation, progress, score,
 * start / check / reset, instant feedback). It knows nothing about individual
 * question types: all of that goes through the adapter registry in core.js.
 */
(function (QG) {
    "use strict";

    class Controller {
        constructor(root) {
            this.root = root;

            // The quiz has its own global controls; drop each question's panel.
            const panels = QG.panelSelector();
            if (panels) root.querySelectorAll(panels).forEach((p) => p.remove());

            const selector = QG.blockSelector();
            this.allBlocks = selector ? Array.from(root.querySelectorAll(selector)) : [];
            if (this.allBlocks.length === 0) return;

            const numAttr = root.dataset.numQuestions;
            this.numTarget = numAttr ? parseInt(numAttr, 10) : null;
            this.shuffle = root.dataset.shuffleQuestions === "true";

            this.active = [];
            this.index = 0;
            this.wizard = true;
            this.started = false;
            this.pollTimer = null;
            this.usesPolling = this.allBlocks.some((b) => {
                const a = QG.adapterFor(b);
                return a && a.needsPolling;
            });

            this.cacheElements();
            this.installInteractionGuard();

            this.setInstantLocked(false);
            this.resetState();
            this.observeBlocks();
            this.bindEvents();
        }

        // ---------- setup ----------

        cacheElements() {
            const q = (s) => this.root.querySelector(s);
            const qa = (s) => Array.from(this.root.querySelectorAll(s));
            this.ui = {
                progressCount: q(".quizgroup-progress-count"),
                progressFill: q(".quizgroup-progress-bar-fill"),
                score: q(".quizgroup-score-value"),
                total: q(".quizgroup-total-value"),
                start: q(".quizgroup-btn-start"),
                toggle: q(".quizgroup-btn-toggle"),
                check: q(".quizgroup-btn-check"),
                reset: q(".quizgroup-btn-reset"),
                instant: q(".quizgroup-toggle-instant-feedback"),
                navBars: qa(".quizgroup-nav-bar"),
                bottomBar: q(".quizgroup-bottom-bar"),
                scrollTop: q(".quizgroup-btn-scroll-top"),
                first: qa(".quizgroup-btn-first"),
                prev: qa(".quizgroup-btn-prev"),
                next: qa(".quizgroup-btn-next"),
                last: qa(".quizgroup-btn-last"),
                currentIdx: qa(".quizgroup-current-idx"),
                totalIdx: qa(".quizgroup-total-idx"),
            };
        }

        /** Before Start, swallow clicks/focus on the questions (controls still work). */
        installInteractionGuard() {
            ["click", "mousedown", "pointerdown", "focusin"].forEach((type) => {
                this.root.addEventListener(
                    type,
                    (e) => {
                        if (this.started) return;
                        const isControl = e.target.closest(
                            ".quizgroup-action-bar, .quizgroup-nav-bar, .quizgroup-bottom-bar, .quizgroup-btn-toggle"
                        );
                        if (isControl) return;
                        e.preventDefault();
                        e.stopPropagation();
                        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                    },
                    true
                );
            });
        }

        observeBlocks() {
            const notify = () => this.updateStats("change");
            this.allBlocks.forEach((block) => {
                const a = QG.adapterFor(block);
                if (a && a.observe) a.observe(block, notify);
            });
        }

        bindEvents() {
            const { ui, root } = this;
            const on = (els, handler) => els.forEach((el) => el.addEventListener("click", handler));

            if (ui.instant) ui.instant.addEventListener("change", () => this.updateStats("change"));
            if (ui.scrollTop) ui.scrollTop.addEventListener("click", () => root.scrollIntoView({ behavior: "smooth", block: "start" }));
            if (ui.start) ui.start.addEventListener("click", () => this.start());
            if (ui.check) ui.check.addEventListener("click", () => this.check());
            if (ui.reset) ui.reset.addEventListener("click", () => this.reset());
            if (ui.toggle) ui.toggle.addEventListener("click", () => { this.wizard = !this.wizard; this.renderView(); });

            on(ui.first, () => this.goTo(0));
            on(ui.prev, () => this.goTo(this.index - 1));
            on(ui.next, () => this.goTo(this.index + 1));
            on(ui.last, () => this.goTo(this.active.length - 1));

            root.addEventListener("input", () => this.updateStats("input"));
            root.addEventListener("change", () => this.updateStats("change"));

            // Free-text style questions: evaluate when the student commits (blur / Enter).
            const commit = (e) => {
                const block = e.target.closest && e.target.closest(QG.blockSelector());
                const a = block && QG.adapterFor(block);
                if (a && a.commitSelector && e.target.matches(a.commitSelector)) this.updateStats("commit");
            };
            root.addEventListener("focusout", commit);
            root.addEventListener("keydown", (e) => { if (e.key === "Enter") commit(e); });

            if (this.usesPolling) {
                ["click", "drop", "dragend", "touchend"].forEach((type) =>
                    root.addEventListener(type, () => this.pollBriefly())
                );
            }
        }

        // ---------- helpers ----------

        /** Run fn(block, adapter, index) for every active question that has an adapter. */
        each(fn) {
            this.active.forEach((block, i) => {
                const adapter = QG.adapterFor(block);
                if (adapter) fn(block, adapter, i);
            });
        }

        setInstantLocked(locked) {
            if (this.ui.instant) this.ui.instant.disabled = locked;
        }

        lockAll() {
            this.each((block, a) => a.setLocked(block, true));
        }

        unlockAll() {
            this.each((block, a) => {
                if (this.started && block.dataset.checked !== "true") a.setLocked(block, false);
            });
        }

        pollBriefly() {
            if (this.pollTimer) clearInterval(this.pollTimer);
            let ticks = 0;
            this.pollTimer = setInterval(() => {
                this.updateStats("poll");
                if (++ticks > 50) {
                    clearInterval(this.pollTimer);
                    this.pollTimer = null;
                }
            }, 50);
        }

        // ---------- question set & view ----------

        refreshQuestionSet() {
            if (this.shuffle || this.numTarget) {
                const container = this.root.querySelector(".quizgroup-questions-container");
                if (container) {
                    const blocks = Array.from(container.querySelectorAll(QG.blockSelector()));
                    if (blocks.length > 1) QG.util.shuffle(blocks).forEach((b) => container.appendChild(b));
                }
            }

            const current = Array.from(this.root.querySelectorAll(QG.blockSelector()));
            if (this.numTarget && this.numTarget < current.length) {
                this.active = current.slice(0, this.numTarget);
                current.slice(this.numTarget).forEach((b) => {
                    delete b.dataset.activeQuestion;
                    b.style.display = "none";
                });
            } else {
                this.active = current;
            }
            this.active.forEach((b) => (b.dataset.activeQuestion = "true"));

            let maxScore = 0;
            this.each((block, a, i) => {
                maxScore += a.points(block);
                let header = block.querySelector(".quizgroup-question-header");
                if (!header) {
                    header = document.createElement("div");
                    header.className = "quizgroup-question-header";
                    block.prepend(header);
                }
                header.textContent = `${a.label} ${i + 1}`;
            });

            if (this.ui.total) this.ui.total.textContent = maxScore;
            this.ui.totalIdx.forEach((s) => (s.textContent = this.active.length));
        }

        goTo(i) {
            this.index = Math.max(0, Math.min(i, this.active.length - 1));
            this.renderView();
        }

        renderView() {
            const { ui, active } = this;
            if (this.wizard) {
                this.root.setAttribute("data-view-mode", "wizard");
                active.forEach((b, i) => (b.style.display = i === this.index ? "block" : "none"));
                ui.navBars.forEach((bar) => (bar.style.display = "flex"));
                if (ui.bottomBar) ui.bottomBar.style.display = "none";
                ui.currentIdx.forEach((s) => (s.textContent = this.index + 1));

                const atStart = this.index === 0;
                const atEnd = this.index === active.length - 1;
                ui.first.forEach((b) => (b.disabled = atStart));
                ui.prev.forEach((b) => (b.disabled = atStart));
                ui.next.forEach((b) => (b.disabled = atEnd));
                ui.last.forEach((b) => (b.disabled = atEnd));
                if (ui.toggle) ui.toggle.textContent = "All Q Mode";
            } else {
                this.root.setAttribute("data-view-mode", "all");
                active.forEach((b) => (b.style.display = "block"));
                ui.navBars.forEach((bar) => (bar.style.display = "none"));
                if (ui.bottomBar) ui.bottomBar.style.display = "flex";
                if (ui.toggle) ui.toggle.textContent = "1 Q Mode";
            }
        }

        // ---------- scoring ----------

        updateStats(trigger = "input") {
            const { ui } = this;
            const checked = this.root.dataset.groupChecked === "true";
            const instantOn = !!(ui.instant && ui.instant.checked);

            if (!this.started && !checked) {
                this.each((block, a) => a.clearValidation(block));
                if (ui.progressCount) ui.progressCount.textContent = "0%";
                if (ui.progressFill) ui.progressFill.style.width = "0%";
                if (ui.score) ui.score.textContent = "0";
                return;
            }

            let answered = 0;
            let earned = 0;

            this.each((block, a) => {
                if (a.isAnswered(block)) answered++;

                if (checked || instantOn) {
                    const res = a.evaluate(block, { instant: !checked, trigger });
                    earned += res.score;
                    if (!checked && res.settled) {
                        block.dataset.checked = "true";
                        a.setLocked(block, true);
                    }
                } else {
                    a.clearValidation(block);
                }
            });

            const total = this.active.length;
            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
            if (ui.progressCount) ui.progressCount.textContent = `${pct}%`;
            if (ui.progressFill) ui.progressFill.style.width = `${pct}%`;
            if (ui.score) ui.score.textContent = checked || instantOn ? earned : "0";
        }

        // ---------- lifecycle ----------

        /**
         * Return the quiz to its pre-start state. The Instant Feedback checkbox is
         * deliberately left alone: it starts at its authored default on page load
         * and after that only the student changes it.
         */
        resetState() {
            this.started = false;
            delete this.root.dataset.groupChecked;
            if (this.pollTimer) clearInterval(this.pollTimer);

            this.refreshQuestionSet();
            this.each((block, a) => {
                delete block.dataset.checked;
                a.reset(block);
            });

            if (this.ui.check) this.ui.check.disabled = true;
            if (this.ui.start) this.ui.start.disabled = false;
            if (this.ui.score) this.ui.score.textContent = "0";

            this.index = 0;
            this.renderView();
            this.updateStats("reset");
            this.lockAll();
        }

        start() {
            this.resetState();
            this.started = true;
            this.each((block, a) => a.clearValidation(block));
            this.unlockAll();
            this.setInstantLocked(true);
            if (this.ui.start) this.ui.start.disabled = true;
            if (this.ui.check) this.ui.check.disabled = false;
        }

        check() {
            if (!this.started) return;
            this.root.dataset.groupChecked = "true";
            this.setInstantLocked(false);
            if (this.ui.start) this.ui.start.disabled = false;
            this.ui.check.disabled = true;
            this.lockAll();
            this.updateStats("check");
        }

        reset() {
            this.setInstantLocked(false);
            this.resetState();
        }
    }

    QG.Controller = Controller;
})(window.QuizGroup);
