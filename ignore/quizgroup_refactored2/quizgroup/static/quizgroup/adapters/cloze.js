(function (QG) {
    "use strict";

    const zones = (block) => Array.from(block.querySelectorAll(".cloze-dropzone"));

    function isZoneFilled(zone) {
        const text = zone.textContent.trim().replace(/^Drop here$/i, "");
        const hasChild = zone.children.length > 0;
        const hasWord = !!(zone.dataset && zone.dataset.word && zone.dataset.word.trim());
        return hasChild || text.length > 0 || hasWord;
    }

    function feedbackFor(zone) {
        const wrapper = zone.closest(".cloze-wrapper");
        return wrapper ? wrapper.querySelector(".cloze-inline-feedback") : null;
    }

    function setFeedback(zone, text, state) {
        const fb = feedbackFor(zone);
        if (!fb) return;
        fb.textContent = text;
        fb.className = "cloze-inline-feedback" + (state ? ` text-${state}` : "");
    }

    function showCompletedCode(block, visible) {
        const el = block.querySelector(".cloze-completed-code");
        if (el) el.style.display = visible ? "block" : "none";
    }

    function droppedWord(zone) {
        const token = zone.querySelector(".cloze-dropped-token, .cloze-draggable") || zone.firstElementChild;
        if (token && token.dataset && token.dataset.word) return token.dataset.word.trim();
        if (token) return token.textContent.trim();
        return zone.textContent.trim().replace(/^Drop here$/i, "");
    }

    QG.register({
        name: "cloze",
        label: "Cloze",
        selector: ".cloze-block",
        panelSelector: ".cloze-global-panel",

        // Drag/drop and tap-to-place change the DOM without a form event.
        needsPolling: true,
        observe(block, notify) {
            zones(block).forEach((zone) => {
                new MutationObserver(notify).observe(zone, { childList: true, subtree: true });
            });
        },

        points: (block) => zones(block).length,
        isAnswered: (block) => zones(block).some(isZoneFilled),
        isFullyAnswered: (block) => zones(block).length > 0 && zones(block).every(isZoneFilled),

        setLocked: (block, locked) =>
            zones(block).forEach((z) => z.classList.toggle("disabled", locked)),

        clearValidation(block) {
            zones(block).forEach((zone) => {
                zone.classList.remove("correct", "incorrect");
                setFeedback(zone, "", null);
            });
            showCompletedCode(block, false);
        },

        reset(block) {
            zones(block).forEach((zone) => {
                zone.innerHTML = "Drop here";
                zone.className = "cloze-dropzone";
                setFeedback(zone, "", null);
            });
            block.querySelectorAll(".cloze-draggable").forEach((d) => {
                d.style.display = "inline-block";
                d.classList.remove("selected");
            });
            showCompletedCode(block, false);
        },

        evaluate(block, ctx) {
            const list = zones(block);
            const full = this.isFullyAnswered(block);
            if (ctx.instant && !full) {
                this.clearValidation(block);
                return { score: 0, maxScore: list.length, settled: false };
            }

            let score = 0;
            list.forEach((zone) => {
                const expected = zone.dataset.correct ? zone.dataset.correct.trim() : "";
                const actual = droppedWord(zone);
                zone.classList.remove("correct", "incorrect");

                if (actual && actual === expected) {
                    zone.classList.add("correct");
                    score++;
                    setFeedback(zone, " ✓ Correct!", "correct");
                } else if (actual) {
                    zone.classList.add("incorrect");
                    setFeedback(zone, ` ✕ (Ans: ${zone.dataset.correct})`, "incorrect");
                }
            });

            showCompletedCode(block, list.length > 0 && score === list.length);
            return { score, maxScore: list.length, settled: ctx.instant && full };
        },
    });
})(window.QuizGroup);
