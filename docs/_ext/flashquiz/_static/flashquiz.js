/* ============================================================
   flashquiz – timed question / answer slideshow
   Question shows for questionTime s, answer is revealed for
   answerTime s, then the next question appears.
   ============================================================ */
(function () {
  "use strict";

  var PALETTE = ["#FFC93C", "#F26B38", "#E84A5F", "#7BC67E", "#3FA7D6", "#9B8AE6"];
  var IDLE_MS = 2500;
  var LONG_PRESS_MS = 550;
  var THEMES = ["dark", "light", "auto", "ocean", "forest", "sunset", "contrast"];
  var THEME_KEY = "flashquiz-theme";

  function esc(text) {
    var d = document.createElement("div");
    d.textContent = text;
    return d.innerHTML;
  }

  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function FlashQuiz(root) {
    var dataEl = root.querySelector(".fq-data");
    if (!dataEl) return;
    var cfg;
    try {
      cfg = JSON.parse(dataEl.textContent);
    } catch (e) {
      root.querySelector(".fq-stage").textContent = "flashquiz: could not read quiz data.";
      return;
    }

    this.root = root;
    this.cfg = cfg;
    this.sections = cfg.sections;
    this.enabled = cfg.sections.map(function () { return true; });
    this.qTime = cfg.questionTime;
    this.aTime = cfg.answerTime;
    this.sTime = cfg.sectionTime;
    this.loop = !!cfg.loop;
    this.shuffle = !!cfg.shuffle;
    this.showBar = cfg.timerBar !== false;
    var savedTheme = null;
    try { savedTheme = window.localStorage.getItem(THEME_KEY); } catch (e) { /* ignore */ }
    this.setTheme(THEMES.indexOf(savedTheme) >= 0 ? savedTheme : (cfg.theme || "dark"));
    this.reviewNext = cfg.review !== false;  // next loop = tagged questions only
    this.tags = {};           // question key -> true (see buildDeck)
    this.reviewOnly = false;  // true while a review round is playing

    this.stage = root.querySelector(".fq-stage");
    this.bar = root.querySelector(".fq-timer-bar");
    this.progress = root.querySelector(".fq-progress");
    this.jumpPanel = root.querySelector(".fq-jump");
    this.jumpGrid = root.querySelector(".fq-jump-grid");
    this.playBtn = root.querySelector(".fq-play");
    this.settings = root.querySelector(".fq-settings");
    this.tagBtn = root.querySelector(".fq-tag");
    this.tagCountEl = root.querySelector(".fq-tag-count");

    this.deck = [];
    this.index = -1;          // -1 = start screen, deck.length = end screen
    this.phase = "start";     // start | section | question | answer | end
    this.playing = false;
    this.phaseMs = 0;         // length of the current phase
    this.elapsed = 0;         // ms already spent in this phase
    this.lastTick = 0;
    this.raf = null;
    this.idleTimer = null;

    this.storeKey = "flashquiz-tags:" + location.pathname + ":" +
      (root.dataset.fqIndex || "0") + ":" + (cfg.title || "");
    this.loadTags();

    this.buildDeck();
    this.buildSettings();
    this.buildPrintList();
    this.bindControls();
    this.updateProgress();
    // Redraw the start screen so saved tags show a "Review … tagged" button.
    if (this.tagCount()) this.render();

    if (cfg.autostart) this.start();
  }

  /* ---------- Deck ---------- */

  FlashQuiz.prototype.buildDeck = function () {
    var self = this;
    var deck = [];
    var total = 0;
    var origCount = 0;   // numbering of the full quiz, before review/shuffle
    this.sections.forEach(function (sec, si) {
      if (!self.enabled[si]) return;
      var base = origCount;
      origCount += sec.questions.length;
      var qs = sec.questions.map(function (qa, qi) {
        return {
          type: "q", si: si, num: qi + 1, orig: base + qi + 1,
          // Keyed by section title + question text, so saved tags still
          // match if questions are added or reordered later.
          key: (sec.title || "") + "\u241F" + qa[0],
          q: qa[0], a: qa[1]
        };
      });
      if (self.reviewOnly) {
        qs = qs.filter(function (item) { return self.tags[item.key]; });
      }
      if (!qs.length) return;
      if (self.shuffle) qs = shuffled(qs);
      if (self.sTime > 0 && sec.title) {
        deck.push({ type: "section", si: si, count: qs.length });
      }
      qs.forEach(function (item, k) {
        item.pos = k + 1;            // position within this run of the section
        item.of = qs.length;
        total += 1;
        item.overall = total;
        deck.push(item);
      });
    });
    if (this.reviewOnly && deck.length) {
      // Opening "Review round" slide, coloured like the first section.
      deck.unshift({ type: "section", banner: true, si: deck[0].si, count: total });
    }
    this.deck = deck;
    this.totalQuestions = total;
    if (this.jumpGrid) this.buildJumpGrid();
  };

  FlashQuiz.prototype.colour = function (si) {
    return PALETTE[si % PALETTE.length];
  };

  /* ---------- Theme ---------- */

  FlashQuiz.prototype.setTheme = function (theme) {
    if (THEMES.indexOf(theme) < 0) theme = "dark";
    this.theme = theme;
    var root = this.root;
    THEMES.forEach(function (t) { root.classList.toggle("fq-theme-" + t, t === theme); });
  };

  /* ---------- Tagging for review ---------- */

  FlashQuiz.prototype.tagCount = function () {
    var n = 0;
    for (var k in this.tags) if (this.tags[k]) n++;
    return n;
  };

  // T key, the toolbar flag or the flag on the slide: tag / untag the
  // question on screen. Tagged questions make up the next review round.
  FlashQuiz.prototype.toggleTag = function () {
    var item = this.deck[this.index];
    if (!item || item.type !== "q") return;
    if (this.tags[item.key]) delete this.tags[item.key];
    else this.tags[item.key] = true;
    this.saveTags();
    this.updateTagUI();
  };

  FlashQuiz.prototype.clearTags = function () {
    this.tags = {};
    this.saveTags();
    this.updateTagUI();
    if (this.phase === "start" || this.phase === "end") this.render();
  };

  // Tags are remembered in this browser (per page and per quiz), so you
  // can tag in one lesson and review in the next. Storage can be blocked
  // (private windows etc.), in which case tags just last until reload.
  FlashQuiz.prototype.loadTags = function () {
    try {
      var raw = window.localStorage.getItem(this.storeKey);
      var list = raw ? JSON.parse(raw) : [];
      var self = this;
      if (Array.isArray(list)) list.forEach(function (k) { self.tags[k] = true; });
    } catch (e) { /* ignore */ }
  };

  FlashQuiz.prototype.saveTags = function () {
    try {
      var list = Object.keys(this.tags).filter(function (k) { return this.tags[k]; }, this);
      if (list.length) window.localStorage.setItem(this.storeKey, JSON.stringify(list));
      else window.localStorage.removeItem(this.storeKey);
    } catch (e) { /* ignore */ }
  };

  FlashQuiz.prototype.updateTagUI = function () {
    var self = this;
    var item = this.deck[this.index];
    var on = !!(item && item.type === "q" && this.tags[item.key]);
    this.stage.classList.toggle("fq-tagged", on);
    this.tagBtn.classList.toggle("fq-on", on);
    this.tagBtn.setAttribute("aria-pressed", String(on));
    this.tagBtn.disabled = !(item && item.type === "q");
    var n = this.tagCount();
    this.tagCountEl.textContent = n ? n + " tagged" : "None tagged";
    var grid = this.jumpGrid;
    if (grid) {
      var btns = grid.querySelectorAll(".fq-jump-num");
      for (var i = 0; i < btns.length; i++) {
        btns[i].classList.toggle("fq-jump-tagged", !!self.tags[btns[i].dataset.key]);
      }
    }
  };

  /* ---------- Rendering ---------- */

  FlashQuiz.prototype.render = function () {
    var st = this.stage;
    st.classList.remove("fq-is-section");

    if (this.phase === "start") {
      st.innerHTML =
        '<div class="fq-start fq-slide">' +
        '<div class="fq-start-title">' + esc(this.cfg.title || "Flash Quiz") + "</div>" +
        '<div class="fq-start-sub">' + this.totalQuestions + " questions</div>" +
        '<div class="fq-start-btns">' +
        '<button type="button" class="fq-btn fq-btn-big fq-start-btn">&#9654; Start</button>' +
        this.reviewBtnHtml() +
        "</div></div>";
      this.bindStartBtn();
      return;
    }

    if (this.phase === "end") {
      st.classList.add("fq-is-section");
      st.innerHTML =
        '<div class="fq-start fq-slide">' +
        '<div class="fq-start-title">Well done!</div>' +
        '<div class="fq-start-sub">' + this.totalQuestions + " questions completed</div>" +
        '<div class="fq-start-btns">' +
        '<button type="button" class="fq-btn fq-btn-big fq-start-btn">&#8635; Go again</button>' +
        this.reviewBtnHtml() +
        "</div></div>";
      this.bindStartBtn();
      return;
    }

    var item = this.deck[this.index];
    var sec = this.sections[item.si];
    var col = this.colour(item.si);
    this.root.style.setProperty("--fq-accent", col);

    if (item.type === "section" && item.banner) {
      st.classList.add("fq-is-section");
      st.innerHTML =
        '<div class="fq-slide">' +
        '<div class="fq-section-title">&#9873; Review round</div>' +
        '<div class="fq-section-sub">' + item.count + " tagged question" + (item.count === 1 ? "" : "s") + "</div>" +
        "</div>";
      this.updateTagUI();
      return;
    }

    if (item.type === "section") {
      st.classList.add("fq-is-section");
      st.innerHTML =
        '<div class="fq-slide">' +
        '<div class="fq-section-title">' + esc(sec.title) + "</div>" +
        '<div class="fq-section-sub">' + item.count + " question" + (item.count === 1 ? "" : "s") + "</div>" +
        "</div>";
      this.updateTagUI();
      return;
    }

    // Question slide: only rebuild when the slide changes, so the answer
    // can fade in on the same slide.
    if (this.renderedIndex !== this.index || !st.querySelector(".fq-answer")) {
      st.innerHTML =
        '<div class="fq-unit">' + (this.reviewOnly ? "&#9873; Review" + (sec.title ? " &middot; " : "") : "") + esc(sec.title || "") + "</div>" +
        '<button type="button" class="fq-tag-badge" title="Tag for review (T)" aria-label="Tag for review">&#9873;</button>' +
        '<div class="fq-num">' + (this.reviewOnly ? item.orig : item.overall) + "</div>" +
        '<div class="fq-slide">' +
        '<div class="fq-question">' + esc(item.q) + "</div>" +
        '<div class="fq-answer" role="button" tabindex="-1" title="Show answer">' + esc(item.a) + "</div>" +
        "</div>";
      var self = this;
      st.querySelector(".fq-answer").addEventListener("click", function () {
        if (self.phase === "question") self.showAnswer();
      });
      st.querySelector(".fq-tag-badge").addEventListener("click", function () {
        self.toggleTag();
      });
    }
    var ans = st.querySelector(".fq-answer");
    if (this.phase === "answer") {
      // Force a reflow so the fade-in transition runs.
      void ans.offsetWidth;
      ans.classList.add("fq-shown");
      ans.setAttribute("aria-hidden", "false");
    } else {
      ans.classList.remove("fq-shown");
      ans.setAttribute("aria-hidden", "true");
    }
    this.renderedIndex = this.index;
    this.updateTagUI();
  };

  FlashQuiz.prototype.reviewBtnHtml = function () {
    var n = this.tagCount();
    if (!n) return "";
    return '<button type="button" class="fq-btn fq-btn-big fq-review-btn">&#9873; Review ' +
      n + " tagged</button>";
  };

  FlashQuiz.prototype.bindStartBtn = function () {
    var self = this;
    var btn = this.stage.querySelector(".fq-start-btn");
    if (btn) btn.addEventListener("click", function () { self.start(); });
    var rbtn = this.stage.querySelector(".fq-review-btn");
    if (rbtn) rbtn.addEventListener("click", function () { self.start(true); });
    this.renderedIndex = null;
  };

  FlashQuiz.prototype.updateProgress = function () {
    var done = 0;
    if (this.phase === "end") {
      done = this.totalQuestions;
    } else if (this.index >= 0 && this.index < this.deck.length) {
      for (var i = this.index; i >= 0; i--) {
        if (this.deck[i].type === "q") { done = this.deck[i].overall; break; }
      }
    }
    this.progress.textContent = done + " / " + this.totalQuestions + (this.reviewOnly ? " \u2691" : "");
    this.markCurrent(done);
    this.playBtn.innerHTML = this.playing ? "&#10074;&#10074;" : "&#9654;";
    this.playBtn.setAttribute("aria-label", this.playing ? "Pause" : "Play");
  };

  FlashQuiz.prototype.setBar = function () {
    // Bar fills up from left to right as the time runs out.
    var frac = this.phaseMs > 0 ? Math.min(1, this.elapsed / this.phaseMs) : 0;
    if (this.phase === "start" || this.phase === "end") frac = 0;
    this.bar.style.width = (frac * 100).toFixed(2) + "%";
  };

  /* ---------- Phases & timing ---------- */

  FlashQuiz.prototype.enterItem = function (index, phase) {
    this.index = index;
    if (index < 0) {
      this.phase = "start";
    } else if (index >= this.deck.length) {
      this.phase = "end";
    } else if (this.deck[index].type === "section") {
      this.phase = "section";
    } else {
      this.phase = phase || "question";
    }
    this.elapsed = 0;
    this.phaseMs = this.phaseLength();
    this.render();
    this.updateProgress();
    this.updateTagUI();
    this.setBar();
  };

  FlashQuiz.prototype.phaseLength = function () {
    switch (this.phase) {
      case "section":
        var it = this.deck[this.index];
        return (it && it.banner ? Math.max(this.sTime, 3) : this.sTime) * 1000;
      case "question": return this.qTime * 1000;
      case "answer":   return this.aTime * 1000;
      default:         return 0;
    }
  };

  FlashQuiz.prototype.showAnswer = function () {
    this.phase = "answer";
    this.elapsed = 0;
    this.phaseMs = this.phaseLength();
    this.render();
    this.setBar();
  };

  FlashQuiz.prototype.advance = function () {
    if (this.phase === "question") {
      this.showAnswer();
      return;
    }
    this.goToIndex(this.index + 1);
  };

  // Go to deck position nextIndex, wrapping (loop) or ending past the end.
  FlashQuiz.prototype.goToIndex = function (nextIndex) {
    if (nextIndex >= this.deck.length) {
      if (this.loop && this.deck.length) {
        // Next round: only the tagged questions, if there are any
        // (and the "Next loop: tagged only" setting is on).
        this.reviewOnly = this.reviewNext && this.tagCount() > 0;
        this.buildDeck();
        this.enterItem(0);
        return;
      }
      this.playing = false;
      this.stopLoop();
      this.enterItem(this.deck.length);
      return;
    }
    this.enterItem(nextIndex);
  };

  FlashQuiz.prototype.back = function () {
    // From an answer, go back to the same question; otherwise to the
    // previous question (skipping section title slides).
    if (this.phase === "answer") {
      this.enterItem(this.index, "question");
      return;
    }
    var i = Math.min(this.index, this.deck.length) - 1;
    while (i >= 0 && this.deck[i].type !== "q") i--;
    if (i < 0) i = 0;
    if (this.deck.length) this.enterItem(i, "question");
  };

  FlashQuiz.prototype.tick = function (now) {
    if (!this.playing) return;
    var dt = now - this.lastTick;
    this.lastTick = now;
    this.elapsed += dt;
    if (this.phaseMs > 0 && this.elapsed >= this.phaseMs) {
      this.advance();
    }
    this.setBar();
    if (this.playing) this.raf = requestAnimationFrame(this.tick.bind(this));
  };

  FlashQuiz.prototype.startLoop = function () {
    this.stopLoop();
    this.lastTick = performance.now();
    this.raf = requestAnimationFrame(this.tick.bind(this));
  };

  FlashQuiz.prototype.stopLoop = function () {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  };

  FlashQuiz.prototype.start = function (review) {
    this.reviewOnly = !!review && this.tagCount() > 0;
    this.buildDeck();
    if (!this.deck.length) {
      this.stage.innerHTML = '<div class="fq-start"><div class="fq-start-sub">Choose at least one section in Settings &#9881;</div></div>';
      return;
    }
    this.playing = true;
    this.enterItem(0);
    this.startLoop();
    this.root.focus({ preventScroll: true });
  };

  FlashQuiz.prototype.togglePlay = function () {
    if (this.phase === "start" || this.phase === "end") {
      this.start();
      return;
    }
    this.playing = !this.playing;
    if (this.playing) this.startLoop(); else this.stopLoop();
    this.updateProgress();
  };

  FlashQuiz.prototype.next = function () {
    if (this.phase === "start") { this.start(); return; }
    if (this.phase === "end") return;
    this.advance();
    if (this.playing) this.startLoop();
  };

  FlashQuiz.prototype.prev = function () {
    if (this.phase === "start") return;
    this.back();
    if (this.playing) this.startLoop();
  };

  /* ---------- Modifier actions on the arrow buttons ----------
     Shift / long-press : whole section
     Alt                : skip without the answer / replay this question
     Ctrl               : first / last question                          */

  FlashQuiz.prototype.curSection = function () {
    var item = this.deck[this.index];
    return item ? item.si : null;
  };

  // First deck position of section si (its title slide if it has one).
  FlashQuiz.prototype.sectionStart = function (si, questionOnly) {
    for (var i = 0; i < this.deck.length; i++) {
      if (this.deck[i].si === si && (!questionOnly || this.deck[i].type === "q")) return i;
    }
    return -1;
  };

  // Shift + ▶▶ : jump to the next section (its title slide).
  FlashQuiz.prototype.nextSection = function () {
    if (this.phase === "start") { this.start(); return; }
    if (this.phase === "end" || !this.deck.length) return;
    var si = this.curSection();
    var i = this.index + 1;
    while (i < this.deck.length && this.deck[i].si === si) i++;
    this.goToIndex(i);           // past the end -> loop or end screen
    if (this.playing) this.startLoop();
  };

  // Shift + ◀◀ : back to the first question of this section; if already
  // there (or on its title slide), go to the start of the previous section.
  FlashQuiz.prototype.prevSection = function () {
    if (this.phase === "start" || !this.deck.length) return;
    if (this.phase === "end") {
      var lastSi = this.deck[this.deck.length - 1].si;
      this.enterItem(this.sectionStart(lastSi, true), "question");
    } else {
      var si = this.curSection();
      var first = this.sectionStart(si, true);
      var atStart = this.index <= first && this.phase !== "answer";
      if (atStart) {
        // Find the section before this one in deck order.
        var j = this.sectionStart(si, false) - 1;
        if (j >= 0) first = this.sectionStart(this.deck[j].si, true);
      }
      this.enterItem(first, "question");
    }
    if (this.playing) this.startLoop();
  };

  // Alt + ▶▶ : next question straight away, without showing this answer.
  FlashQuiz.prototype.skipNoReveal = function () {
    if (this.phase === "start") { this.start(); return; }
    if (this.phase === "end") return;
    this.goToIndex(this.index + 1);
    if (this.playing) this.startLoop();
  };

  // Alt + ◀◀ : replay this question from the start of its timer.
  FlashQuiz.prototype.replay = function () {
    if (this.phase === "start" || this.phase === "end") return;
    this.enterItem(this.index, this.phase === "section" ? undefined : "question");
    if (this.playing) this.startLoop();
  };

  // Ctrl + ▶▶ / ◀◀ : last / first question.
  FlashQuiz.prototype.goEnd = function (last) {
    if (!this.deck.length) this.buildDeck();
    this.goTo(last ? this.totalQuestions : 1);
  };

  // Work out which action a click or key press with modifiers means.
  FlashQuiz.prototype.arrow = function (dir, e) {
    var fwd = dir > 0;
    if (e && e.shiftKey) { fwd ? this.nextSection() : this.prevSection(); }
    else if (e && e.altKey) { fwd ? this.skipNoReveal() : this.replay(); }
    else if (e && (e.ctrlKey || e.metaKey)) { this.goEnd(fwd); }
    else { fwd ? this.next() : this.prev(); }
  };

  // Jump to question number n (as shown in the circle and the toolbar).
  FlashQuiz.prototype.goTo = function (n) {
    if (!this.deck.length) return;
    n = Math.round(n);
    if (isNaN(n)) { this.updateProgress(); return; }
    n = Math.max(1, Math.min(this.totalQuestions, n));
    var idx = -1;
    for (var i = 0; i < this.deck.length; i++) {
      if (this.deck[i].type === "q" && this.deck[i].overall === n) { idx = i; break; }
    }
    if (idx < 0) return;
    if (this.phase === "start" || this.phase === "end") this.playing = true;
    this.enterItem(idx, "question");
    if (this.playing) this.startLoop();
  };

  /* ---------- Numbered-question grid ---------- */

  // One button per question, grouped under its section title and
  // coloured to match. Rebuilt whenever the deck changes.
  FlashQuiz.prototype.buildJumpGrid = function () {
    var self = this;
    var grid = this.jumpGrid;
    grid.innerHTML = "";
    var group = null, lastSi = null;
    this.deck.forEach(function (item) {
      if (item.type !== "q") return;
      if (item.si !== lastSi) {
        lastSi = item.si;
        var title = self.sections[item.si].title;
        if (title) {
          var h = document.createElement("div");
          h.className = "fq-jump-sec";
          h.textContent = title;
          grid.appendChild(h);
        }
        group = document.createElement("div");
        group.className = "fq-jump-nums";
        grid.appendChild(group);
      }
      var b = document.createElement("button");
      b.type = "button";
      b.className = "fq-jump-num";
      b.textContent = self.reviewOnly ? item.orig : item.overall;
      b.title = item.q;
      b.style.setProperty("--fq-num-col", self.colour(item.si));
      b.dataset.n = item.overall;
      b.dataset.key = item.key;
      b.addEventListener("click", function () {
        self.goTo(item.overall);
        self.toggleJump(false);
        self.root.focus({ preventScroll: true });
      });
      group.appendChild(b);
    });
    this.markCurrent();
    if (this.tagCountEl) this.updateTagUI();
  };

  FlashQuiz.prototype.markCurrent = function (n) {
    if (!this.jumpGrid) return;
    if (n === undefined) {
      var t = this.progress.textContent.split("/")[0];
      n = parseInt(t, 10) || 0;
    }
    var prev = this.jumpGrid.querySelector(".fq-jump-current");
    if (prev) prev.classList.remove("fq-jump-current");
    var cur = this.jumpGrid.querySelector('.fq-jump-num[data-n="' + n + '"]');
    if (cur) cur.classList.add("fq-jump-current");
  };

  FlashQuiz.prototype.toggleJump = function (open) {
    var panel = this.jumpPanel;
    var btn = this.root.querySelector(".fq-jump-toggle");
    if (open === undefined) open = panel.hidden;
    panel.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    if (open) {
      // Close settings so only one panel shows at a time.
      this.settings.hidden = true;
      this.root.querySelector(".fq-settings-toggle").setAttribute("aria-expanded", "false");
      var cur = this.jumpGrid.querySelector(".fq-jump-current");
      if (cur) cur.scrollIntoView({ block: "nearest" });
    }
  };

  FlashQuiz.prototype.restart = function () {
    this.playing = false;
    this.stopLoop();
    this.reviewOnly = false;
    this.buildDeck();
    this.enterItem(-1);
  };

  /* ---------- Settings ---------- */

  FlashQuiz.prototype.buildSettings = function () {
    var self = this;
    var r = this.root;

    function slider(cls, valCls, key) {
      var input = r.querySelector(cls);
      var out = r.querySelector(valCls);
      input.value = self[key];
      out.textContent = self[key];
      input.addEventListener("input", function () {
        self[key] = parseFloat(input.value);
        out.textContent = self[key];
        // Apply straight away to the phase that is running.
        self.phaseMs = self.phaseLength();
        if (key === "sTime") self.rebuildKeepingPlace();
      });
    }
    slider(".fq-in-q", ".fq-val-q", "qTime");
    slider(".fq-in-a", ".fq-val-a", "aTime");
    slider(".fq-in-s", ".fq-val-s", "sTime");

    var loopIn = r.querySelector(".fq-in-loop");
    loopIn.checked = this.loop;
    loopIn.addEventListener("change", function () { self.loop = loopIn.checked; });

    var barIn = r.querySelector(".fq-in-bar");
    var timerEl = r.querySelector(".fq-timer");
    barIn.checked = this.showBar;
    timerEl.hidden = !this.showBar;
    barIn.addEventListener("change", function () {
      self.showBar = barIn.checked;
      timerEl.hidden = !self.showBar;
    });

    var revIn = r.querySelector(".fq-in-review");
    revIn.checked = this.reviewNext;
    revIn.addEventListener("change", function () { self.reviewNext = revIn.checked; });
    r.querySelector(".fq-tag-clear").addEventListener("click", function () { self.clearTags(); });

    // Theme: the directive's :theme: is the default; a viewer's own pick
    // (remembered in this browser for every quiz) takes over from it.
    var themeIn = r.querySelector(".fq-in-theme");
    themeIn.value = this.theme;
    themeIn.addEventListener("change", function () {
      self.setTheme(themeIn.value);
      try { window.localStorage.setItem(THEME_KEY, themeIn.value); } catch (e) { /* ignore */ }
    });

    var shufIn = r.querySelector(".fq-in-shuffle");
    shufIn.checked = this.shuffle;
    shufIn.addEventListener("change", function () {
      self.shuffle = shufIn.checked;
      self.restart();
    });

    var box = r.querySelector(".fq-sections");
    var boxes = [];
    this.sections.forEach(function (sec, si) {
      var label = document.createElement("label");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = true;
      cb.addEventListener("change", function () {
        self.enabled[si] = cb.checked;
        self.restart();
      });
      var sw = document.createElement("span");
      sw.className = "fq-swatch";
      sw.style.background = self.colour(si);
      label.appendChild(cb);
      label.appendChild(sw);
      label.appendChild(document.createTextNode(
        (sec.title || "Questions") + " (" + sec.questions.length + ")"
      ));
      box.appendChild(label);
      boxes.push(cb);
    });
    if (this.sections.length < 2) {
      r.querySelector(".fq-sections-head").hidden = true;
      box.hidden = true;
    }

    function setAll(on) {
      boxes.forEach(function (cb, si) { cb.checked = on; self.enabled[si] = on; });
      self.restart();
    }
    r.querySelector(".fq-all").addEventListener("click", function () { setAll(true); });
    r.querySelector(".fq-none").addEventListener("click", function () { setAll(false); });

    var toggle = r.querySelector(".fq-settings-toggle");
    toggle.addEventListener("click", function () {
      var open = self.settings.hidden;
      self.settings.hidden = !open;
      if (open) self.toggleJump(false);
      toggle.setAttribute("aria-expanded", String(open));
    });
  };

  // Section-title time changed: rebuild without losing the current question.
  FlashQuiz.prototype.rebuildKeepingPlace = function () {
    if (this.phase === "start" || this.phase === "end") {
      this.buildDeck();
      this.updateProgress();
      return;
    }
    var cur = this.deck[this.index];
    var order = this.deck.filter(function (d) { return d.type === "q"; });
    var deck = [];
    var self = this;
    var lastSi = null;
    order.forEach(function (item) {
      if (item.si !== lastSi) {
        if (self.sTime > 0 && self.sections[item.si].title) {
          deck.push({ type: "section", si: item.si, count: item.of });
        }
        lastSi = item.si;
      }
      deck.push(item);
    });
    this.deck = deck;
    var idx = deck.indexOf(cur);
    if (idx < 0) {
      // Was on a section slide that no longer exists: jump to its first question.
      idx = deck.findIndex(function (d) { return d.si === cur.si; });
      this.enterItem(Math.max(0, idx));
    } else {
      this.index = idx;
    }
  };

  /* ---------- Print list ---------- */

  /* Fold-and-cut sheet, the same as flashcards: questions on the left,
     answers on the right, fold down the middle line to test yourself. */
  FlashQuiz.prototype.buildPrintList = function () {
    var div = document.createElement("div");
    div.className = "fq-print";
    var rows = "";
    this.sections.forEach(function (sec) {
      if (sec.title) rows += '<tr class="fq-print-sec"><th colspan="2">' + esc(sec.title) + "</th></tr>";
      sec.questions.forEach(function (qa) {
        rows += "<tr><td>" + esc(qa[0]).replace(/\n/g, "<br>") + "</td><td>" + esc(qa[1]).replace(/\n/g, "<br>") + "</td></tr>";
      });
    });
    div.innerHTML =
      '<div class="fq-print-title">' + esc(this.cfg.title || "Flash Quiz") + "</div>" +
      '<div class="fq-print-help">Cut along the rows, fold down the middle line, and test yourself.</div>' +
      '<table class="fq-print-table">' + rows + "</table>";
    this.root.appendChild(div);
  };

  /* Print button: print a copy of the sheet on its own, with the rest of
     the page taken out of the layout so there are no blank pages. */
  FlashQuiz.prototype.print = function () {
    var html = document.documentElement;
    Array.prototype.forEach.call(document.querySelectorAll(".fq-print-host"), function (n) {
      n.parentNode.removeChild(n);
    });
    var host = document.createElement("div");
    host.className = "flashquiz fq-print-host";
    host.appendChild(this.root.querySelector(".fq-print").cloneNode(true));
    document.body.appendChild(host);
    html.classList.add("fq-printing");
    var cleanup = function () {
      html.classList.remove("fq-printing");
      if (host.parentNode) host.parentNode.removeChild(host);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1000);
  };

  /* ---------- Controls ---------- */

  FlashQuiz.prototype.bindControls = function () {
    var self = this;
    var r = this.root;

    this.bindStartBtn();
    r.querySelector(".fq-play").addEventListener("click", function () { self.togglePlay(); });
    // ◀◀ / ▶▶ : plain click, Shift/Alt/Ctrl + click, or long-press
    // (long-press = Shift, for touchscreens and whiteboards).
    [[".fq-next", 1], [".fq-prev", -1]].forEach(function (pair) {
      var btn = r.querySelector(pair[0]);
      var dir = pair[1];
      var pressTimer = null;
      var longPressed = false;

      btn.addEventListener("pointerdown", function (e) {
        if (e.button !== 0) return;
        longPressed = false;
        clearTimeout(pressTimer);
        pressTimer = setTimeout(function () {
          longPressed = true;
          btn.classList.add("fq-long");
          setTimeout(function () { btn.classList.remove("fq-long"); }, 250);
          self.arrow(dir, { shiftKey: true });
        }, LONG_PRESS_MS);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) {
        btn.addEventListener(ev, function () { clearTimeout(pressTimer); });
      });
      // No right-click/press-and-hold menu on touch screens.
      btn.addEventListener("contextmenu", function (e) { e.preventDefault(); });

      btn.addEventListener("click", function (e) {
        if (longPressed) { longPressed = false; return; }   // already acted
        self.arrow(dir, e);
      });
    });
    r.querySelector(".fq-restart").addEventListener("click", function () { self.restart(); });
    r.querySelector(".fq-fullscreen").addEventListener("click", function () { self.toggleFullscreen(); });
    var printBtn = r.querySelector(".fq-print-btn");
    if (printBtn) printBtn.addEventListener("click", function () { self.print(); });

    // ⚑ button tags the question on screen for review.
    this.tagBtn.addEventListener("click", function () {
      self.toggleTag();
      r.focus({ preventScroll: true });
    });

    // "#" button opens the numbered-question grid.
    var jt = r.querySelector(".fq-jump-toggle");
    jt.addEventListener("click", function () { self.toggleJump(); });

    r.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        // Shift / Alt / Ctrl + arrow keys match the button clicks.
        e.preventDefault();
        self.arrow(e.key === "ArrowRight" ? 1 : -1, e);
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          if (tag === "button" && e.key === " ") return; // let buttons click
          e.preventDefault(); self.togglePlay(); break;
        case "PageDown":
          e.preventDefault(); self.next(); break;
        case "PageUp":
          e.preventDefault(); self.prev(); break;
        case "f":
        case "F":
          e.preventDefault(); self.toggleFullscreen(); break;
        case "r":
        case "R":
          e.preventDefault(); self.restart(); break;
        case "t":
        case "T":
          e.preventDefault(); self.toggleTag(); break;
      }
    });

    // Clicking the slide (not the answer) also moves on / reveals.
    this.stage.addEventListener("click", function (e) {
      if (e.target.closest(".fq-start-btn, .fq-review-btn, .fq-answer, .fq-tag-badge")) return;
      if (self.phase === "question" || self.phase === "answer" || self.phase === "section") {
        self.next();
      }
      r.focus({ preventScroll: true });
    });

    // Hide toolbar & cursor in full screen when the mouse is still.
    r.addEventListener("mousemove", function () { self.wake(); });
    document.addEventListener("fullscreenchange", function () {
      if (document.fullscreenElement === r) {
        self.wake();
      } else {
        r.classList.remove("fq-idle");
        clearTimeout(self.idleTimer);
      }
    });

    // Pause when the tab is hidden so it doesn't race ahead.
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && self.playing) self.togglePlay();
    });
  };

  FlashQuiz.prototype.wake = function () {
    var r = this.root;
    r.classList.remove("fq-idle");
    clearTimeout(this.idleTimer);
    if (document.fullscreenElement === r) {
      this.idleTimer = setTimeout(function () {
        if (!r.querySelector(".fq-settings:not([hidden]), .fq-jump:not([hidden])")) r.classList.add("fq-idle");
      }, IDLE_MS);
    }
  };

  FlashQuiz.prototype.toggleFullscreen = function () {
    var r = this.root;
    if (document.fullscreenElement === r) {
      document.exitFullscreen();
    } else if (r.requestFullscreen) {
      r.requestFullscreen().then(function () { r.focus({ preventScroll: true }); })
        .catch(function () {});
    }
  };

  /* ---------- Boot ---------- */

  function init() {
    var quizzes = document.querySelectorAll(".flashquiz");
    for (var i = 0; i < quizzes.length; i++) {
      quizzes[i].dataset.fqIndex = String(i);
      if (!quizzes[i].fqInstance) quizzes[i].fqInstance = new FlashQuiz(quizzes[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
