/* ============================================================
   flashcards – flip cards with spaced repetition (Leitner boxes)
   Progress is saved per deck in the browser's localStorage.
   ============================================================ */
(function () {
  "use strict";

  var DAY = 86400000;
  var THEMES = ["dark", "light", "auto", "ocean", "forest", "sunset", "contrast"];
  var STORE_PREFIX = "flashcards:v1:";
  var memoryStore = {}; // used if localStorage is blocked

  function load(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return memoryStore[key] || null;
    }
  }

  function save(key, value) {
    memoryStore[key] = value;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* private mode etc. – memory copy is kept */ }
  }

  function remove(key) {
    delete memoryStore[key];
    try { window.localStorage.removeItem(key); } catch (e) { /* ignore */ }
  }

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
    return list;
  }

  function startOfToday() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /* Whole days are counted from midnight, so a card reviewed in the
     afternoon is due first thing the next day, not at the same time. */
  function dueAfter(days) {
    if (days <= 0) return Date.now();
    if (days < 1) return Date.now() + days * DAY;
    return startOfToday() + Math.round(days) * DAY;
  }

  function whenText(ms) {
    var today = startOfToday();
    if (ms <= Date.now()) return "now";
    var dayDiff = Math.round((new Date(ms).setHours(0, 0, 0, 0) - today) / DAY);
    if (dayDiff <= 0) return "later today";
    if (dayDiff === 1) return "tomorrow";
    if (dayDiff < 7) return "in " + dayDiff + " days";
    return new Date(ms).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  /* Card text: plain text with \n line breaks, never HTML. */
  function setText(node, text) {
    node.textContent = "";
    String(text).split("\n").forEach(function (line, i) {
      if (i) node.appendChild(document.createElement("br"));
      node.appendChild(document.createTextNode(line));
    });
    var len = String(text).length;
    node.classList.toggle("fc-long", len > 60);
    node.classList.toggle("fc-xlong", len > 140);
  }

  function Deck(root) {
    var dataNode = root.querySelector(".fc-data");
    this.root = root;
    this.cfg = JSON.parse(dataNode.textContent);
    this.key = STORE_PREFIX + this.cfg.deckId;
    this.cards = [];
    var self = this;
    this.cfg.sections.forEach(function (s, si) {
      s.cards.forEach(function (c) {
        self.cards.push({ id: c.id, f: c.f, b: c.b, sec: si });
      });
    });

    var stored = load(this.key) || {};
    this.progress = stored.cards || {};
    var st = stored.settings || {};
    // If the teacher changes :sections:, use the new default rather than
    // the student's old choice.
    var secDefault = JSON.stringify(this.cfg.offSections || []);
    if (st.secDefault !== secDefault) { delete st.offSections; }
    this.settings = {
      newPerSession: st.newPerSession != null ? st.newPerSession : this.cfg.newPerSession,
      reverse: st.reverse != null ? st.reverse : this.cfg.reverse,
      shuffle: st.shuffle != null ? st.shuffle : this.cfg.shuffle,
      theme: st.theme || this.cfg.theme,
      offSections: st.offSections || (this.cfg.offSections || []).slice(),
      secDefault: secDefault
    };

    this.queue = [];
    this.pos = 0;
    this.flipped = false;
    this.mode = "home";
    this.tally = { 1: 0, 2: 0, 3: 0 };
    this.relearn = {};
    this.confirmTimer = null;

    this.q = function (sel) { return root.querySelector(sel); };
    this.build();
    this.applyTheme();
    this.showHome();
  }

  Deck.prototype.persist = function () {
    save(this.key, { cards: this.progress, settings: this.settings });
  };

  Deck.prototype.applyTheme = function () {
    var r = this.root;
    THEMES.forEach(function (t) { r.classList.remove("fc-theme-" + t); });
    r.classList.add("fc-theme-" + this.settings.theme);
  };

  Deck.prototype.activeCards = function () {
    var off = this.settings.offSections;
    return this.cards.filter(function (c) { return off.indexOf(c.sec) === -1; });
  };

  Deck.prototype.counts = function () {
    var now = Date.now();
    var self = this;
    var res = { boxes: [0, 0, 0, 0, 0], fresh: 0, due: 0, next: null };
    this.activeCards().forEach(function (c) {
      var p = self.progress[c.id];
      if (!p) { res.fresh++; return; }
      res.boxes[p.box - 1]++;
      if (p.due <= now) res.due++;
      else if (res.next === null || p.due < res.next) res.next = p.due;
    });
    return res;
  };

  /* ---------- building the UI ---------- */

  Deck.prototype.build = function () {
    var self = this;
    var root = this.root;

    // Leitner box bars in the header.
    var boxes = this.q(".fc-boxes");
    this.boxEls = [];
    ["New", "1", "2", "3", "4", "5"].forEach(function (label, i) {
      var b = el("div", "fc-box fc-box-" + i);
      b.title = i === 0 ? "New cards (not seen yet)" : "Box " + label;
      var bar = el("div", "fc-box-bar");
      var fill = el("div", "fc-box-fill");
      bar.appendChild(fill);
      var n = el("div", "fc-box-n", "0");
      b.appendChild(n);
      b.appendChild(bar);
      b.appendChild(el("div", "fc-box-label", label));
      boxes.appendChild(b);
      self.boxEls.push({ n: n, fill: fill });
    });

    // The card itself.
    var stage = this.q(".fc-stage");
    var card = el("div", "fc-card");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Flashcard. Press to flip.");
    card.hidden = true;
    var inner = el("div", "fc-inner");
    var front = el("div", "fc-face fc-front");
    var back = el("div", "fc-face fc-back");
    this.frontTag = el("div", "fc-face-tag");
    this.backTag = el("div", "fc-face-tag");
    this.frontText = el("div", "fc-text");
    this.backText = el("div", "fc-text");
    front.appendChild(this.frontTag); front.appendChild(this.frontText);
    back.appendChild(this.backTag); back.appendChild(this.backText);
    front.appendChild(el("div", "fc-hint", "Tap or press Space to flip"));
    inner.appendChild(front); inner.appendChild(back);
    card.appendChild(inner);
    stage.appendChild(card);
    this.cardEl = card;

    var done = el("div", "fc-done");
    done.hidden = true;
    stage.appendChild(done);
    this.doneEl = done;

    card.addEventListener("click", function () { self.flip(); });

    this.q(".fc-start").addEventListener("click", function () { self.start("review"); });
    this.q(".fc-practise").addEventListener("click", function () { self.start("practise"); });
    this.q(".fc-home-btn").addEventListener("click", function () {
      self.showHome(); self.root.focus({ preventScroll: true });
    });

    Array.prototype.forEach.call(root.querySelectorAll(".fc-r"), function (btn) {
      btn.addEventListener("click", function () { self.rate(+btn.getAttribute("data-r")); });
    });

    // Settings panel.
    var panel = this.q(".fc-settings");
    var toggle = this.q(".fc-settings-toggle");
    toggle.addEventListener("click", function () {
      panel.hidden = !panel.hidden;
      toggle.setAttribute("aria-expanded", String(!panel.hidden));
    });
    this.openSettings = function () {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      var secHead = self.q(".fc-sections-head");
      (secHead.hidden ? panel : secHead).scrollIntoView({ block: "nearest", behavior: "smooth" });
    };

    var inNew = this.q(".fc-in-new");
    var valNew = this.q(".fc-val-new");
    inNew.value = this.settings.newPerSession;
    valNew.textContent = this.settings.newPerSession;
    inNew.addEventListener("input", function () {
      self.settings.newPerSession = +inNew.value;
      valNew.textContent = inNew.value;
      self.persist();
      if (self.mode === "home") self.showHome();
    });

    var inRev = this.q(".fc-in-reverse");
    inRev.checked = this.settings.reverse;
    inRev.addEventListener("change", function () {
      self.settings.reverse = inRev.checked; self.persist();
      if (self.mode !== "home" && self.mode !== "done") self.showCard();
    });

    var inShuf = this.q(".fc-in-shuffle");
    inShuf.checked = this.settings.shuffle;
    inShuf.addEventListener("change", function () {
      self.settings.shuffle = inShuf.checked; self.persist();
    });

    var inTheme = this.q(".fc-in-theme");
    inTheme.value = this.settings.theme;
    inTheme.addEventListener("change", function () {
      self.settings.theme = inTheme.value; self.persist(); self.applyTheme();
    });

    // Section checkboxes (only shown when there's more than one section).
    var secBox = this.q(".fc-sections");
    var secHead = this.q(".fc-sections-head");
    var named = this.cfg.sections.filter(function (s) { return s.title; }).length;
    if (this.cfg.sections.length < 2 || !named) {
      secBox.hidden = true; secHead.hidden = true;
      // No sections to choose, so the settings fit on one row.
      this.q(".fc-set-row2").hidden = true;
    }
    this.secInputs = [];
    this.cfg.sections.forEach(function (s, i) {
      var lab = el("label", "fc-sec");
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = self.settings.offSections.indexOf(i) === -1;
      cb.addEventListener("change", function () { self.setSection(i, cb.checked); });
      lab.appendChild(cb);
      lab.appendChild(document.createTextNode(" " + (s.title || "Untitled") + " (" + s.cards.length + ")"));
      secBox.appendChild(lab);
      self.secInputs.push(cb);
    });
    this.q(".fc-all").addEventListener("click", function () { self.setAllSections(true); });
    this.q(".fc-none").addEventListener("click", function () { self.setAllSections(false); });

    // Reset with an inline "are you sure?" (no browser dialogs).
    var resetBtn = this.q(".fc-reset");
    var confirm = this.q(".fc-reset-confirm");
    resetBtn.addEventListener("click", function () {
      resetBtn.hidden = true; confirm.hidden = false;
      clearTimeout(self.confirmTimer);
      self.confirmTimer = setTimeout(function () { resetBtn.hidden = false; confirm.hidden = true; }, 6000);
    });
    this.q(".fc-reset-no").addEventListener("click", function () {
      resetBtn.hidden = false; confirm.hidden = true;
    });
    this.q(".fc-reset-yes").addEventListener("click", function () {
      self.progress = {};
      self.persist();
      resetBtn.hidden = false; confirm.hidden = true;
      self.showHome();
    });

    this.q(".fc-print").addEventListener("click", function () { self.print(); });

    var fs = this.q(".fc-fullscreen");
    fs.addEventListener("click", function () { self.toggleFullscreen(); });

    root.addEventListener("keydown", function (e) { self.onKey(e); });
  };

  Deck.prototype.setSection = function (i, on) {
    var off = this.settings.offSections;
    var at = off.indexOf(i);
    if (on && at !== -1) off.splice(at, 1);
    if (!on && at === -1) off.push(i);
    this.persist();
    if (this.mode === "home") this.showHome();
    else this.updateBoxes();
  };

  Deck.prototype.setAllSections = function (on) {
    var self = this;
    this.settings.offSections = on ? [] : this.cfg.sections.map(function (s, i) { return i; });
    this.secInputs.forEach(function (cb) { cb.checked = on; });
    this.persist();
    if (this.mode === "home") this.showHome();
    else self.updateBoxes();
  };

  /* ---------- screens ---------- */

  Deck.prototype.updateBoxes = function () {
    var c = this.counts();
    var values = [c.fresh].concat(c.boxes);
    var max = Math.max.apply(null, values.concat([1]));
    this.boxEls.forEach(function (b, i) {
      b.n.textContent = values[i];
      b.fill.style.height = Math.round((values[i] / max) * 100) + "%";
    });
    return c;
  };

  Deck.prototype.setMode = function (mode) {
    this.mode = mode;
    this.root.setAttribute("data-mode", mode);
    var inSession = mode === "review" || mode === "practise";
    this.q(".fc-home").hidden = mode !== "home";
    this.cardEl.hidden = !inSession;
    this.doneEl.hidden = mode !== "done";
    this.q(".fc-home-btn").hidden = mode === "home";
    this.q(".fc-rate").hidden = !inSession;
    if (!inSession) this.q(".fc-progress").textContent = "";
  };

  Deck.prototype.showHome = function () {
    this.setMode("home");
    var c = this.updateBoxes();
    var active = this.activeCards().length;
    var newToday = Math.min(c.fresh, this.settings.newPerSession);
    var stats = this.q(".fc-home-stats");
    stats.textContent = "";
    function stat(n, label, cls) {
      var s = el("div", "fc-stat " + cls);
      s.appendChild(el("div", "fc-stat-n", String(n)));
      s.appendChild(el("div", "fc-stat-l", label));
      stats.appendChild(s);
    }
    stat(c.due, "due for review", "fc-stat-due");
    stat(newToday, newToday === 1 ? "new card" : "new cards", "fc-stat-new");
    stat(c.boxes[4], "in box 5", "fc-stat-top");

    // Which sections are being studied, with a shortcut to Settings.
    var secs = this.q(".fc-home-secs");
    secs.textContent = "";
    var named = this.cfg.sections.filter(function (s) { return s.title; }).length;
    if (this.cfg.sections.length > 1 && named) {
      var off = this.settings.offSections;
      var onNames = this.cfg.sections
        .filter(function (s, i) { return off.indexOf(i) === -1; })
        .map(function (s) { return s.title || "Untitled"; });
      secs.appendChild(document.createTextNode(
        onNames.length === this.cfg.sections.length ? "All sections" :
        onNames.length ? "Sections: " + onNames.join(" \u00B7 ") : "No sections chosen"));
      var change = el("button", "fc-link fc-secs-change", "change");
      change.type = "button";
      var self = this;
      change.addEventListener("click", function () { self.openSettings(); });
      secs.appendChild(document.createTextNode(" "));
      secs.appendChild(change);
    }

    var startBtn = this.q(".fc-start");
    var toDo = c.due + newToday;
    startBtn.disabled = toDo === 0;
    startBtn.textContent = toDo ? "▶ Start review (" + toDo + ")" : "Nothing due";
    this.q(".fc-practise").disabled = active === 0;

    var note = this.q(".fc-home-note");
    if (!active) note.textContent = "No sections chosen. Open ⚙ Settings to choose some.";
    else if (!toDo && c.next) note.textContent = "All caught up! Next cards are due " + whenText(c.next) + ". You can still practise all the cards.";
    else if (!toDo && c.fresh) note.textContent = "New cards is set to 0 in ⚙ Settings.";
    else note.textContent = "Your progress is saved in this browser.";
  };

  Deck.prototype.start = function (mode) {
    var now = Date.now();
    var self = this;
    var active = this.activeCards();
    var queue;
    if (mode === "practise") {
      queue = active.slice();
      if (this.settings.shuffle) shuffle(queue);
    } else {
      var due = active.filter(function (c) {
        var p = self.progress[c.id];
        return p && p.due <= now;
      });
      // Weakest cards first, then by how overdue they are.
      due.sort(function (a, b) {
        var pa = self.progress[a.id], pb = self.progress[b.id];
        return (pa.box - pb.box) || (pa.due - pb.due);
      });
      var fresh = active.filter(function (c) { return !self.progress[c.id]; })
        .slice(0, this.settings.newPerSession);
      if (this.settings.shuffle) { shuffle(due); shuffle(fresh); }
      queue = due.concat(fresh);
    }
    if (!queue.length) { this.showHome(); return; }
    this.queue = queue;
    this.pos = 0;
    this.tally = { 1: 0, 2: 0, 3: 0 };
    this.relearn = {};
    this.moved = { up: 0, down: 0 };
    this.setMode(mode);
    this.showCard();
    this.root.focus({ preventScroll: true });
  };

  Deck.prototype.showCard = function () {
    var c = this.queue[this.pos];
    var rev = this.settings.reverse;
    this.flipped = false;
    this.cardEl.classList.remove("fc-flipped");
    this.cardEl.classList.add("fc-noanim");
    // force reflow so the un-flip doesn't animate between cards
    void this.cardEl.offsetWidth;
    this.cardEl.classList.remove("fc-noanim");

    setText(this.frontText, rev ? c.b : c.f);
    setText(this.backText, rev ? c.f : c.b);

    var p = this.progress[c.id];
    var sec = this.cfg.sections[c.sec].title;
    var tag = (p ? "Box " + p.box : "New") + (sec ? " · " + sec : "");
    this.frontTag.textContent = tag;
    this.backTag.textContent = tag;
    this.cardEl.classList.toggle("fc-is-new", !p);

    this.setRateEnabled(false);
    var label = this.mode === "practise" ? "Practise " : "";
    this.q(".fc-progress").textContent = label + (this.pos + 1) + " / " + this.queue.length;
  };

  Deck.prototype.setRateEnabled = function (on) {
    var rate = this.q(".fc-rate");
    rate.classList.toggle("fc-rate-on", on);
    Array.prototype.forEach.call(rate.querySelectorAll("button"), function (b) { b.disabled = !on; });
  };

  Deck.prototype.flip = function () {
    if (this.mode !== "review" && this.mode !== "practise") return;
    this.flipped = !this.flipped;
    this.cardEl.classList.toggle("fc-flipped", this.flipped);
    if (this.flipped) this.setRateEnabled(true);
  };

  /* ---------- spaced repetition ---------- */

  Deck.prototype.rate = function (r) {
    if (!this.flipped) return;
    var c = this.queue[this.pos];
    this.tally[r]++;

    if (this.mode === "review") {
      var iv = this.cfg.intervals;
      var p = this.progress[c.id] || { box: 1, due: 0, seen: 0, right: 0 };
      var before = p.box;
      p.seen++;
      if (r === 3) {
        p.right++;
        p.box = Math.min(5, p.box + 1);
        p.due = dueAfter(iv[p.box - 1]);
      } else if (r === 2) {
        // Stay in the same box; come back in half the usual wait.
        p.due = dueAfter(iv[p.box - 1] / 2);
      } else {
        p.box = 1;
        p.due = dueAfter(0);
      }
      p.last = Date.now();
      this.progress[c.id] = p;
      if (p.box > before) this.moved.up++;
      if (p.box < before) this.moved.down++;
      this.persist();
      this.updateBoxes();
    }

    // "Didn't know" cards come back a few cards later (max 3 times).
    if (r === 1) {
      var n = (this.relearn[c.id] || 0) + 1;
      this.relearn[c.id] = n;
      if (n <= 3) {
        var at = Math.min(this.queue.length, this.pos + 4);
        this.queue.splice(at, 0, c);
      }
    }

    this.pos++;
    if (this.pos >= this.queue.length) this.finish();
    else this.showCard();
    // The clicked button is now disabled, which would drop keyboard
    // focus out of the deck, so keep focus on the deck itself.
    this.root.focus({ preventScroll: true });
  };

  Deck.prototype.finish = function () {
    var mode = this.mode;
    this.setMode("done");
    var c = this.updateBoxes();
    var d = this.doneEl;
    d.textContent = "";
    d.appendChild(el("div", "fc-done-title", mode === "practise" ? "Practice finished" : "Review finished"));
    var row = el("div", "fc-done-row");
    [[3, "Knew it", "fc-k3"], [2, "Unsure", "fc-k2"], [1, "Didn't know", "fc-k1"]].forEach(function (t) {
      var s = el("div", "fc-stat " + t[2]);
      s.appendChild(el("div", "fc-stat-n", String(this.tally[t[0]])));
      s.appendChild(el("div", "fc-stat-l", t[1]));
      row.appendChild(s);
    }, this);
    d.appendChild(row);
    var msg;
    if (mode === "practise") msg = "Practice doesn't change when cards are due.";
    else {
      msg = this.moved.up + " card" + (this.moved.up === 1 ? "" : "s") + " moved up a box.";
      if (c.due) msg += " " + c.due + " still due now.";
      else if (c.next) msg += " Come back " + whenText(c.next) + " for the next review.";
    }
    d.appendChild(el("div", "fc-done-msg", msg));
    var self = this;
    var btns = el("div", "fc-home-btns");
    var again = el("button", "fc-btn fc-btn-big", c.due ? "▶ Keep going" : "Done");
    again.type = "button";
    again.addEventListener("click", function () {
      if (c.due && mode === "review") self.start("review"); else self.showHome();
    });
    btns.appendChild(again);
    d.appendChild(btns);
    again.focus({ preventScroll: true });
  };

  /* ---------- keyboard, full screen, print ---------- */

  Deck.prototype.onKey = function (e) {
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "SELECT")) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var inSession = this.mode === "review" || this.mode === "practise";
    var k = e.key;
    if (inSession && (k === " " || k === "Enter" || k === "ArrowUp" || k === "ArrowDown")) {
      if (t && t.tagName === "BUTTON" && k === "Enter") return;
      e.preventDefault(); this.flip();
    } else if (inSession && (k === "1" || k === "2" || k === "3")) {
      e.preventDefault(); this.rate(+k);
    } else if (k === "Escape" && this.mode !== "home") {
      e.preventDefault(); this.showHome();
    } else if (k === "f" || k === "F") {
      e.preventDefault(); this.toggleFullscreen();
    } else if (this.mode === "home" && k === "Enter" && t === this.root) {
      e.preventDefault(); if (!this.q(".fc-start").disabled) this.start("review");
    }
  };

  Deck.prototype.toggleFullscreen = function () {
    var r = this.root;
    var doc = document;
    if (doc.fullscreenElement === r || doc.webkitFullscreenElement === r) {
      (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
    } else if (r.requestFullscreen) {
      r.requestFullscreen().catch(function () {});
    } else if (r.webkitRequestFullscreen) {
      r.webkitRequestFullscreen();
    }
  };

  /* Print a copy of this deck's sheet on its own. Hiding the rest of the
     page with visibility left it taking up space, which printed blank
     pages, so everything else is taken out of the layout instead. */
  Deck.prototype.print = function () {
    var html = document.documentElement;
    document.querySelectorAll(".fc-print-host").forEach(function (n) { n.remove(); });
    var host = document.createElement("div");
    host.className = "flashcards fc-print-host";
    host.appendChild(this.root.querySelector(".fc-printsheet").cloneNode(true));
    document.body.appendChild(host);
    html.classList.add("fc-printing");
    var cleanup = function () {
      html.classList.remove("fc-printing");
      if (host.parentNode) host.parentNode.removeChild(host);
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
    setTimeout(cleanup, 1000);
  };

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll(".flashcards"), function (root) {
      if (root.getAttribute("data-fc-ready")) return;
      root.setAttribute("data-fc-ready", "1");
      try { new Deck(root); } catch (err) {
        if (window.console) console.error("flashcards:", err);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
