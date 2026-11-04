/* ============================================================
   flashquiz – timed question / answer slideshow
   Question shows for questionTime s, answer is revealed for
   answerTime s, then the next question appears.
   ============================================================ */
(function () {
  "use strict";

  var PALETTE = ["#FFC93C", "#F26B38", "#E84A5F", "#7BC67E", "#3FA7D6", "#9B8AE6"];
  var IDLE_MS = 2500;

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

    this.stage = root.querySelector(".fq-stage");
    this.bar = root.querySelector(".fq-timer-bar");
    this.progress = root.querySelector(".fq-progress");
    this.playBtn = root.querySelector(".fq-play");
    this.settings = root.querySelector(".fq-settings");

    this.deck = [];
    this.index = -1;          // -1 = start screen, deck.length = end screen
    this.phase = "start";     // start | section | question | answer | end
    this.playing = false;
    this.phaseMs = 0;         // length of the current phase
    this.elapsed = 0;         // ms already spent in this phase
    this.lastTick = 0;
    this.raf = null;
    this.idleTimer = null;

    this.buildDeck();
    this.buildSettings();
    this.buildPrintList();
    this.bindControls();
    this.updateProgress();

    if (cfg.autostart) this.start();
  }

  /* ---------- Deck ---------- */

  FlashQuiz.prototype.buildDeck = function () {
    var self = this;
    var deck = [];
    var total = 0;
    this.sections.forEach(function (sec, si) {
      if (!self.enabled[si]) return;
      var qs = sec.questions.map(function (qa, qi) {
        return { type: "q", si: si, num: qi + 1, q: qa[0], a: qa[1] };
      });
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
    this.deck = deck;
    this.totalQuestions = total;
  };

  FlashQuiz.prototype.colour = function (si) {
    return PALETTE[si % PALETTE.length];
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
        '<button type="button" class="fq-btn fq-btn-big fq-start-btn">&#9654; Start</button>' +
        "</div>";
      this.bindStartBtn();
      return;
    }

    if (this.phase === "end") {
      st.classList.add("fq-is-section");
      st.innerHTML =
        '<div class="fq-start fq-slide">' +
        '<div class="fq-start-title">Well done!</div>' +
        '<div class="fq-start-sub">' + this.totalQuestions + " questions completed</div>" +
        '<button type="button" class="fq-btn fq-btn-big fq-start-btn">&#8635; Go again</button>' +
        "</div>";
      this.bindStartBtn();
      return;
    }

    var item = this.deck[this.index];
    var sec = this.sections[item.si];
    var col = this.colour(item.si);
    this.root.style.setProperty("--fq-accent", col);

    if (item.type === "section") {
      st.classList.add("fq-is-section");
      st.innerHTML =
        '<div class="fq-slide">' +
        '<div class="fq-section-title">' + esc(sec.title) + "</div>" +
        '<div class="fq-section-sub">' + item.count + " question" + (item.count === 1 ? "" : "s") + "</div>" +
        "</div>";
      return;
    }

    // Question slide: only rebuild when the slide changes, so the answer
    // can fade in on the same slide.
    if (this.renderedIndex !== this.index || !st.querySelector(".fq-answer")) {
      st.innerHTML =
        (sec.title ? '<div class="fq-unit">' + esc(sec.title) + "</div>" : "") +
        '<div class="fq-num">' + item.pos + "</div>" +
        '<div class="fq-slide">' +
        '<div class="fq-question">' + esc(item.q) + "</div>" +
        '<div class="fq-answer" role="button" tabindex="-1" title="Show answer">' + esc(item.a) + "</div>" +
        "</div>";
      var self = this;
      st.querySelector(".fq-answer").addEventListener("click", function () {
        if (self.phase === "question") self.showAnswer();
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
  };

  FlashQuiz.prototype.bindStartBtn = function () {
    var self = this;
    var btn = this.stage.querySelector(".fq-start-btn");
    if (btn) btn.addEventListener("click", function () { self.start(); });
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
    this.progress.textContent = done + " / " + this.totalQuestions;
    this.playBtn.innerHTML = this.playing ? "&#10074;&#10074;" : "&#9654;";
    this.playBtn.setAttribute("aria-label", this.playing ? "Pause" : "Play");
  };

  FlashQuiz.prototype.setBar = function () {
    var frac = this.phaseMs > 0 ? Math.max(0, 1 - this.elapsed / this.phaseMs) : 0;
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
    this.setBar();
  };

  FlashQuiz.prototype.phaseLength = function () {
    switch (this.phase) {
      case "section":  return this.sTime * 1000;
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
    var nextIndex = this.index + 1;
    if (nextIndex >= this.deck.length) {
      if (this.loop && this.deck.length) {
        if (this.shuffle) this.buildDeck();
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

  FlashQuiz.prototype.start = function () {
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

  FlashQuiz.prototype.restart = function () {
    this.playing = false;
    this.stopLoop();
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

  FlashQuiz.prototype.buildPrintList = function () {
    var div = document.createElement("div");
    div.className = "fq-print";
    var htmlOut = this.cfg.title ? "<h3>" + esc(this.cfg.title) + "</h3>" : "";
    this.sections.forEach(function (sec) {
      if (sec.title) htmlOut += "<h4>" + esc(sec.title) + "</h4>";
      htmlOut += "<ol>" + sec.questions.map(function (qa) {
        return "<li>" + esc(qa[0]) + ' <span class="fq-print-answer">' + esc(qa[1]) + "</span></li>";
      }).join("") + "</ol>";
    });
    div.innerHTML = htmlOut;
    this.root.appendChild(div);
  };

  /* ---------- Controls ---------- */

  FlashQuiz.prototype.bindControls = function () {
    var self = this;
    var r = this.root;

    this.bindStartBtn();
    r.querySelector(".fq-play").addEventListener("click", function () { self.togglePlay(); });
    r.querySelector(".fq-next").addEventListener("click", function () { self.next(); });
    r.querySelector(".fq-prev").addEventListener("click", function () { self.prev(); });
    r.querySelector(".fq-restart").addEventListener("click", function () { self.restart(); });
    r.querySelector(".fq-fullscreen").addEventListener("click", function () { self.toggleFullscreen(); });

    r.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      switch (e.key) {
        case " ":
        case "k":
        case "K":
          if (tag === "button" && e.key === " ") return; // let buttons click
          e.preventDefault(); self.togglePlay(); break;
        case "ArrowRight":
        case "PageDown":
          e.preventDefault(); self.next(); break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault(); self.prev(); break;
        case "f":
        case "F":
          e.preventDefault(); self.toggleFullscreen(); break;
        case "r":
        case "R":
          e.preventDefault(); self.restart(); break;
      }
    });

    // Clicking the slide (not the answer) also moves on / reveals.
    this.stage.addEventListener("click", function (e) {
      if (e.target.closest(".fq-start-btn, .fq-answer")) return;
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
        if (!r.querySelector(".fq-settings:not([hidden])")) r.classList.add("fq-idle");
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
      if (!quizzes[i].fqInstance) quizzes[i].fqInstance = new FlashQuiz(quizzes[i]);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
