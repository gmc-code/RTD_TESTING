/* ============================================================
   imagesequence – put pictures into order (numbered boxes + arrows)
   ============================================================ */
(function () {
  "use strict";

  var ARROW_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M2.5 12h16.5M13 5.5l6.5 6.5-6.5 6.5" fill="none" stroke="currentColor" ' +
    'stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function letter(i) {
    var s = "";
    i += 1;
    while (i > 0) {
      var m = (i - 1) % 26;
      s = String.fromCharCode(65 + m) + s;
      i = Math.floor((i - 1) / 26);
    }
    return s;
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* Places slots (and arrows between them) on a CSS grid.
     mode: snake | snake-up | right | down | up | none. "up" is one column
     with the first step at the bottom (e.g. a food chain, plant at the
     bottom); "snake-up" zig-zags from the bottom row to the top. Returns nothing; slots are reused. */
  function layoutGrid(grid, slotEls, cols, mode) {
    var n = slotEls.length;
    var vertical = mode === "down" || mode === "up";
    if (vertical) cols = 1;
    cols = Math.max(1, Math.min(cols, n));
    var rows = Math.ceil(n / cols);
    var arrowW = mode === "none" ? "0.8rem" : "2.4rem";
    var off = mode === "right" ? 1 : 0;

    while (grid.firstChild) grid.removeChild(grid.firstChild);
    grid.className = "isq-grid isq-arrows-" + mode;

    var colsT = [];
    if (off) colsT.push("1.6rem");
    for (var c = 0; c < cols; c++) {
      if (c) colsT.push(arrowW);
      colsT.push("minmax(0, 1fr)");
    }
    if (off) colsT.push("1.6rem");
    if (vertical) colsT = ["minmax(0, 26rem)"];
    var snake = mode === "snake" || mode === "snake-up";
    var vGap = (snake || vertical) ? "2.2rem" : "0.9rem";
    var rowsT = [];
    for (var r = 0; r < rows; r++) {
      if (r) rowsT.push(vGap);
      rowsT.push("auto");
    }
    grid.style.gridTemplateColumns = colsT.join(" ");
    grid.style.gridTemplateRows = rowsT.join(" ");

    function pos(i) {
      var r = Math.floor(i / cols), c = i % cols;
      if (snake && r % 2) c = cols - 1 - c;
      if (mode === "snake-up") r = rows - 1 - r;
      if (mode === "up") r = n - 1 - i;
      return { r: r, gr: 2 * r + 1, gc: 2 * c + 1 + off };
    }
    function arrow(row, col, dir, extra) {
      var a = el("div", "isq-arrow isq-arrow-" + dir + (extra ? " " + extra : ""), ARROW_SVG);
      a.style.gridRow = row;
      a.style.gridColumn = col;
      grid.appendChild(a);
    }

    for (var i = 0; i < n; i++) {
      var p = pos(i);
      slotEls[i].style.gridRow = p.gr;
      slotEls[i].style.gridColumn = p.gc;
      grid.appendChild(slotEls[i]);
    }
    if (mode === "none") return;
    for (i = 0; i < n - 1; i++) {
      var a = pos(i), b = pos(i + 1);
      if (a.r === b.r) {
        arrow(a.gr, Math.min(a.gc, b.gc) + 1, b.gc > a.gc ? "right" : "left");
      } else if (a.gc === b.gc) {
        arrow(Math.min(a.gr, b.gr) + 1, a.gc, b.gr > a.gr ? "down" : "up");
      } else {
        // "right" mode: the row wraps, so show an arrow leaving the end of
        // this row and one coming into the start of the next.
        arrow(a.gr, 2 * cols + 1, "right", "isq-arrow-wrap");
        arrow(b.gr, 1, "right", "isq-arrow-wrap");
      }
    }
  }

  /* ------------------------------------------------------------ widget */

  var COLUMN_KEYS = ["columns", "fullColumns", "trayColumns", "fullTrayColumns", "fullTrayWidth"];

  /* <option>s for the width of the full screen strip of pictures to
     place, as a percentage. extra: the directive's own value, added if
     it isn't one of the steps of 5. */
  function widthOptions(extra) {
    var vals = [15, 20, 25, 30, 35, 40, 45, 50];
    if (extra && vals.indexOf(extra) < 0) { vals.push(extra); vals.sort(function (a, b) { return a - b; }); }
    return '<option value="0">Auto</option>' + vals.map(function (v) {
      return '<option value="' + v + '">' + v + '%</option>';
    }).join("");
  }

  /* <option>s for a number select; zeroText adds a first option worth 0. */
  function numOptions(low, high, zeroText) {
    var out = zeroText ? '<option value="0">' + zeroText + '</option>' : "";
    for (var i = low; i <= high; i++) out += '<option value="' + i + '">' + i + '</option>';
    return out;
  }

  function Sequence(root) {
    this.root = root;
    this.cfg = JSON.parse(root.querySelector(".isq-data").textContent);
    this.selected = null;
    this.revealed = false;
    this.settings = {
      theme: this.cfg.theme,
      captions: this.cfg.captions,
      arrows: this.cfg.arrows,
      numbering: this.cfg.numbering,
      // Boxes in a row, and pictures still to place in a row. For the
      // last three, 0 means "same as the page" / "as many as fit".
      columns: this.cfg.columns,
      fullColumns: this.cfg.fullColumns || 0,
      trayColumns: this.cfg.trayColumns || 0,
      fullTrayColumns: this.cfg.fullTrayColumns || 0,
      // Width of the full screen strip of pictures to place (%); 0 = 24%.
      fullTrayWidth: this.cfg.fullTrayWidth || 0,
      // Size of the boxes in full screen: auto | screen | large (see fitFull).
      fullFit: this.cfg.fullFit || "auto"
    };
    this.readSteps();
    this.build();
    this.loadSet(this.firstSet());
    this.bind();
  }

  Sequence.prototype.q = function (s) { return this.root.querySelector(s); };

  function readStepEls(list) {
    return Array.prototype.map.call(list, function (s) {
      var img = s.querySelector("img");
      var cap = s.querySelector(".isq-caption");
      return {
        answer: +s.dataset.answer,
        label: s.dataset.label || "",
        img: img,
        src: img ? img.getAttribute("src") : "",
        alt: img ? img.getAttribute("alt") || "" : "",
        name: s.dataset.name || "",
        captionHtml: cap ? cap.innerHTML.trim() : ""
      };
    });
  }

  /* Each set is one sequence. A page without chains has one set. */
  Sequence.prototype.readSteps = function () {
    var src = this.root.querySelector(".isq-source");
    var cfg = this.cfg;
    var chainEls = src.querySelectorAll(".isq-chain");
    this.sets = [];
    if (chainEls.length) {
      this.sets = Array.prototype.map.call(chainEls, function (c) {
        var order = (c.dataset.printOrder || "").split(",").filter(function (v) { return v !== ""; })
          .map(Number);
        return { title: c.dataset.title || "", steps: readStepEls(c.querySelectorAll(".isq-step")), printOrder: order };
      });
    } else {
      this.sets.push({ title: "", steps: readStepEls(src.querySelectorAll(".isq-step")), printOrder: cfg.printOrder });
    }
    var poolEl = src.querySelector(".isq-pool");
    this.extras = poolEl ? readStepEls(poolEl.querySelectorAll(".isq-step")) : [];
    src.parentNode.removeChild(src);
    this.multi = this.sets.length > 1;
    this.bag = [];
  };

  /* Everything about one sequence, without building anything on screen:
     its cards (with any extra distractors from the other chains), the
     right order and the printed order. */
  Sequence.prototype.makeView = function (k) {
    var self = this, set = this.sets[k], cfg = this.cfg;
    var steps = set.steps.slice();
    var extra = (this.multi || this.extras.length) ? (cfg.autoDistractors || 0) : 0;
    if (extra) {
      var used = {}, seen = {}, pool = [];
      steps.forEach(function (st) { used[st.src] = true; });
      // Named extras (never in a chain) if there are any, otherwise
      // pictures from the other chains.
      if (this.extras.length) pool = this.extras.slice();
      else this.sets.forEach(function (o, j) {
        if (j === k) return;
        o.steps.forEach(function (st) {
          if (st.answer < 0 || !st.src || used[st.src] || seen[st.src]) return;
          seen[st.src] = true;
          pool.push(st);
        });
      });
      shuffle(pool).slice(0, extra).forEach(function (st) {
        steps.push({
          answer: -1, label: "", img: st.img ? st.img.cloneNode(true) : null,
          src: st.src, alt: st.alt, name: st.name, captionHtml: st.captionHtml
        });
      });
    }
    var cards = steps.map(function (st, i) {
      return {
        id: i, answer: st.answer, label: st.label, img: st.img,
        src: st.src, alt: st.alt, name: st.name, captionHtml: st.captionHtml
      };
    });
    var byAnswer = [];
    cards.forEach(function (c) { if (c.answer >= 0) byAnswer[c.answer] = c; });
    var n = byAnswer.length;
    var fixed = {};
    (cfg.fixed || []).forEach(function (f) { if (f < n) fixed[f] = true; });
    var printOrder = set.printOrder;
    if (!printOrder || printOrder.length !== cards.length) {
      var ids = cards.map(function (c) { return c.id; });
      printOrder = ids.slice();
      for (var t = 0; t < 10; t++) {
        shuffle(printOrder);
        if (printOrder.join() !== ids.join() || ids.length < 2) break;
      }
    }
    var title = cfg.title || "Put the steps in order";
    var subtitle = this.multi ? (set.title || "Chain " + (k + 1)) : "";
    return {
      index: k, cards: cards, byAnswer: byAnswer, n: n, fixed: fixed,
      distractors: cards.filter(function (c) { return c.answer < 0; }).length,
      printOrder: printOrder, title: title, subtitle: subtitle
    };
  };

  /* Which chain comes next. Random: every chain is used once before any
     repeat, and never the same one twice in a row. */
  Sequence.prototype.firstSet = function () {
    return this.multi ? this.nextIndex() : 0;
  };

  Sequence.prototype.nextIndex = function () {
    var count = this.sets.length, cur = this.setIndex;
    if (this.cfg.pick === "order") return cur == null ? 0 : (cur + 1) % count;
    if (!this.bag.length) {
      for (var i = 0; i < count; i++) this.bag.push(i);
      shuffle(this.bag);
      if (count > 1 && this.bag[this.bag.length - 1] === cur) {
        var t = this.bag[0]; this.bag[0] = this.bag[this.bag.length - 1]; this.bag[this.bag.length - 1] = t;
      }
    }
    return this.bag.pop();
  };

  Sequence.prototype.loadSet = function (k) {
    var v = this.makeView(k);
    this.setIndex = k;
    this.view = v;
    this.cards = v.cards;
    this.byAnswer = v.byAnswer;
    this.n = v.n;
    this.fixed = v.fixed;
    this.distractors = v.distractors;
    this.buildSet();
    this.applySettings();
    this.reset();
  };

  Sequence.prototype.nextSet = function () {
    this.closeZoom();
    this.loadSet(this.nextIndex());
  };

  Sequence.prototype.slotLabel = function (i, numbering, byAnswer) {
    var card = (byAnswer || this.byAnswer)[i];
    if (card && card.label) return card.label;
    if (numbering === "letters") return letter(i);
    if (numbering === "none") return "";
    return String(i + 1);
  };

  Sequence.prototype.build = function () {
    var self = this, root = this.root;

    this.board = el("div", "isq-board");
    this.grid = el("div", "isq-grid");
    this.board.appendChild(this.grid);

    this.trayWrap = el("div", "isq-traywrap");
    this.trayHead = el("div", "isq-trayhead");
    this.tray = el("div", "isq-tray");
    this.tray.setAttribute("aria-label", "Pictures to place");
    this.trayWrap.appendChild(this.trayHead);
    // Clue box: what the picked (or pointed at) picture is, above the pictures.
    this.clueBox = el("div", "isq-clue");
    this.clueBox.setAttribute("aria-live", "polite");
    this.clueBox.hidden = this.cfg.clues !== "selected";
    this.trayWrap.appendChild(this.clueBox);
    this.trayWrap.appendChild(this.tray);

    this.status = el("div", "isq-status");
    this.status.setAttribute("aria-live", "polite");

    var bar = el("div", "isq-toolbar");
    bar.innerHTML =
      '<button type="button" class="isq-btn isq-btn-main isq-check">&#10003; Check</button>' +
      '<button type="button" class="isq-btn isq-show">Show answer</button>' +
      '<button type="button" class="isq-btn isq-scatter" title="Put every picture in a box in a random order, then swap them into the right order">&#128256; Fill boxes randomly</button>' +
      '<button type="button" class="isq-btn isq-reset">&#8635; Start again</button>' +
      (this.multi ? '<button type="button" class="isq-btn isq-next">&#127922; ' +
        String(this.cfg.nextLabel || "New chain").replace(/&/g, "&amp;").replace(/</g, "&lt;") + '</button>' : '') +
      '<span class="isq-spacer"></span>' +
      '<button type="button" class="isq-btn isq-icon isq-settings-toggle" title="Settings" aria-label="Settings" aria-expanded="false">&#9881;</button>' +
      '<button type="button" class="isq-btn isq-icon isq-print" title="Print" aria-label="Print">&#128424;</button>' +
      '<button type="button" class="isq-btn isq-icon isq-fullscreen" title="Full screen (F)" aria-label="Full screen">' +
      '<svg class="isq-full-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';

    var set = el("div", "isq-settings");
    set.hidden = true;
    set.innerHTML =
      '<label>Captions: <select class="isq-in-captions">' +
      '<option value="below">Under pictures</option>' +
      '<option value="overlay">On the pictures</option>' +
      '<option value="hidden">Hidden</option>' +
      '<option value="reveal">Show after checking</option>' +
      '<option value="slot">On the boxes</option></select></label>' +
      '<label>Arrows: <select class="isq-in-arrows">' +
      '<option value="snake">Snake</option>' +
      '<option value="snake-up">Snake up</option>' +
      '<option value="right">Rows</option>' +
      '<option value="down">Down</option>' +
      '<option value="up">Up</option>' +
      '<option value="none">None</option></select></label>' +
      '<label>Boxes: <select class="isq-in-numbering">' +
      '<option value="numbers">1, 2, 3</option>' +
      '<option value="letters">A, B, C</option>' +
      '<option value="none">No labels</option></select></label>' +
      '<label>Theme: <select class="isq-in-theme">' +
      '<option value="dark">Dark</option>' +
      '<option value="light">Light</option>' +
      '<option value="auto">Auto</option>' +
      '<option value="ocean">Ocean</option>' +
      '<option value="forest">Forest</option>' +
      '<option value="sunset">Sunset</option>' +
      '<option value="contrast">High contrast</option></select></label>' +
      '<span class="isq-set-break"></span>' +
      '<label>Boxes in a row: <select class="isq-in-columns">' + numOptions(1, 6) + '</select></label>' +
      '<label>in full screen: <select class="isq-in-fullColumns" aria-label="Boxes in a row in full screen">' +
      numOptions(1, 8, "Same") + '</select></label>' +
      '<label>Pictures to place in a row: <select class="isq-in-trayColumns">' +
      numOptions(1, 8, "Auto") + '</select></label>' +
      '<label>in full screen: <select class="isq-in-fullTrayColumns" aria-label="Pictures to place in a row in full screen">' +
      numOptions(1, 6, "Auto") + '</select></label>' +
      '<label>Pictures to place, width in full screen: <select class="isq-in-fullTrayWidth">' +
      widthOptions(this.cfg.fullTrayWidth) + '</select></label>' +
      '<label>Box size in full screen: <select class="isq-in-fullFit">' +
      '<option value="auto">Auto</option>' +
      '<option value="screen">Fit all on screen</option>' +
      '<option value="large">Large (scroll)</option></select></label>';

    this.lightbox = el("div", "isq-lightbox");
    this.lightbox.hidden = true;
    this.lightbox.innerHTML =
      '<div class="isq-lb-inner"><img class="isq-lb-img" alt=""><div class="isq-lb-cap"></div>' +
      '<button type="button" class="isq-btn isq-lb-close" aria-label="Close">&#10005; Close</button></div>';

    this.printSheet = el("div", "isq-printsheet");

    var head = root.querySelector(".isq-head");
    if (this.multi) {
      this.chainInfo = el("div", "isq-chaininfo");
      this.chainInfo.setAttribute("aria-live", "polite");
      head.appendChild(this.chainInfo);
    }
    head.parentNode.insertBefore(this.board, head.nextSibling);
    root.appendChild(this.status);
    root.appendChild(this.trayWrap);
    root.appendChild(bar);
    root.appendChild(set);
    root.appendChild(this.lightbox);
    root.appendChild(this.printSheet);
    this.settingsPanel = set;

    this.q(".isq-in-captions").value = this.settings.captions;
    this.q(".isq-in-arrows").value = this.settings.arrows;
    this.q(".isq-in-numbering").value = this.settings.numbering;
    this.q(".isq-in-theme").value = this.settings.theme;
    this.q(".isq-in-fullFit").value = this.settings.fullFit;
    COLUMN_KEYS.forEach(function (k) {
      this.q(".isq-in-" + k).value = String(this.settings[k]);
    }, this);
  };

  /* The boxes and picture cards for the sequence being shown. */
  Sequence.prototype.buildSet = function () {
    var self = this, root = this.root;
    this.selected = null;
    this.tray.innerHTML = "";

    this.slotEls = [];
    for (var i = 0; i < this.n; i++) {
      var s = el("div", "isq-slot");
      s.dataset.slot = i;
      s.tabIndex = 0;
      s.setAttribute("role", "button");
      s.appendChild(el("div", "isq-slot-label"));
      var body = el("div", "isq-slot-body");
      body.appendChild(el("div", "isq-slot-hint", "<span>Drop here</span>"));
      s.appendChild(body);
      var sc = el("div", "isq-slot-cap", this.byAnswer[i].captionHtml);
      s.appendChild(sc);
      this.slotEls.push(s);
    }

    // Cards (reuse the <img> Sphinx rendered, so its path is right).
    this.cards.forEach(function (c) {
      var card = el("div", "isq-card");
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.dataset.id = c.id;
      var wrap = el("div", "isq-imgwrap");
      if (c.img) {
        c.img.removeAttribute("width");
        c.img.removeAttribute("height");
        c.img.className = "isq-img";
        c.img.draggable = false;
        wrap.appendChild(c.img);
      }
      card.appendChild(wrap);
      card.appendChild(el("div", "isq-cap", c.captionHtml));
      var z = el("button", "isq-zoom", "&#128269;");
      z.type = "button";
      z.title = "Enlarge";
      z.setAttribute("aria-label", "Enlarge picture");
      card.appendChild(z);
      card.appendChild(el("span", "isq-mark"));
      c.el = card;
    });

    // Picture shape for empty boxes.
    var first = this.cards[0] && this.cards[0].img;
    function setRatio() {
      if (first && first.naturalWidth) {
        root.style.setProperty("--isq-ratio", first.naturalWidth + " / " + first.naturalHeight);
      }
    }
    if (first) {
      if (first.complete) setRatio(); else first.addEventListener("load", setRatio);
    }

    if (this.chainInfo) {
      var v = this.view;
      var set = this.sets[v.index], count = (v.index + 1) + " of " + this.sets.length;
      this.chainInfo.textContent = set.title ? set.title + "  \u00b7  " + count : "Chain " + count;
    }
    this.cards.forEach(function (c) {
      if (c.img && !c.img.complete) c.img.addEventListener("load", function () { if (self.isFull()) self.fitFull(); });
    });
  };

  /* Boxes in a row: the number asked for (Settings or :columns: /
     :fullscreen-columns:), unless the boxes would be too small to use.
     On a phone that means two in a row; on a wider page the number asked
     for is kept down to quite small boxes. */
  Sequence.prototype.effectiveCols = function () {
    var cs = getComputedStyle(this.board);
    var w = (this.board.clientWidth || 800) -
      (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    // Full screen (wide enough for the side-by-side layout) can have its
    // own number of columns (:fullscreen-columns:).
    var full = this.isFull() && window.innerWidth >= 800;
    var want = (full && this.settings.fullColumns) || this.settings.columns;
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var mode = this.settings.arrows;
    var gap = (mode === "none" ? 0.8 : 2.4) * rem;      // as in layoutGrid
    var edge = mode === "right" ? 3.2 * rem : 0;
    var min = window.innerWidth <= 560 ? 130 : 70;
    var cols = Math.max(1, want);
    while (cols > 1 && (w - edge - (cols - 1) * gap) / cols < min) cols--;
    return cols;
  };

  Sequence.prototype.applySettings = function () {
    var s = this.settings, root = this.root;
    root.className = root.className
      .replace(/\bisq-theme-\S+/g, "")
      .replace(/\bisq-cap-\S+/g, "")
      .trim() + " isq-theme-" + s.theme + " isq-cap-" + s.captions;
    // Size of the pictures still to place (see imagesequence.css).
    var cfg = this.cfg;
    root.classList.toggle("isq-tray-set", !!s.trayColumns);
    if (s.trayColumns) root.style.setProperty("--isq-tray-cols", s.trayColumns);
    root.classList.toggle("isq-tray-set-full", !!s.fullTrayColumns);
    if (s.fullTrayColumns) root.style.setProperty("--isq-tray-cols-full", s.fullTrayColumns);
    if (s.fullTrayWidth) root.style.setProperty("--isq-tray-w", s.fullTrayWidth + "%");
    else root.style.removeProperty("--isq-tray-w");
    for (var i = 0; i < this.n; i++) {
      var lab = this.slotLabel(i, s.numbering);
      var le = this.slotEls[i].querySelector(".isq-slot-label");
      le.textContent = lab;
      le.hidden = !lab;
      var lc = this.byAnswer[i];
      le.classList.toggle("isq-slot-label-text", !!(lc && lc.label));
      this.slotEls[i].setAttribute("aria-label", "Box " + (lab || i + 1));
    }
    this.cols = this.effectiveCols();
    layoutGrid(this.grid, this.slotEls, this.cols, s.arrows);
    this.buildPrint();
    if (this.isFull) this.fitFull();
  };

  /* ---------- state ---------- */

  Sequence.prototype.reset = function () {
    var self = this;
    this.slots = [];
    for (var i = 0; i < this.n; i++) this.slots.push(this.fixed[i] ? this.byAnswer[i].id : null);
    var loose = this.cards.filter(function (c) { return !(c.answer >= 0 && self.fixed[c.answer]); })
      .map(function (c) { return c.id; });
    var sorted = loose.slice();
    for (var t = 0; t < 10; t++) {
      shuffle(loose);
      if (loose.join() !== sorted.join() || loose.length < 2) break;
    }
    this.trayIds = loose;
    if (this.cfg.start === "boxes") { this.scatter(); return; }
    this.selected = null;
    this.revealed = false;
    this.root.classList.remove("isq-revealed", "isq-solved");
    this.clearMarks();
    this.setStatus("");
    this.setCheckable(true);
    this.render();
  };

  /* Put a picture in every free box, in a random order. Students then swap
     pictures between boxes. Any pictures left over (distractors) go to the
     tray. Never puts everything in the right place. */
  Sequence.prototype.scatter = function () {
    var self = this, free = [];
    for (var i = 0; i < this.n; i++) {
      if (this.fixed[i]) this.slots[i] = this.byAnswer[i].id;
      else free.push(i);
    }
    var loose = this.cards.filter(function (c) { return !self.isLockedAnswer(c); })
      .map(function (c) { return c.id; });
    for (var t = 0; t < 20; t++) {
      shuffle(loose);
      var allRight = free.every(function (s, k) { return self.cards[loose[k]].answer === s; });
      if (!allRight || free.length < 2) break;
    }
    free.forEach(function (s, k) { self.slots[s] = loose[k]; });
    this.trayIds = loose.slice(free.length);
    this.selected = null;
    this.revealed = false;
    this.root.classList.remove("isq-revealed", "isq-solved");
    this.clearMarks();
    this.setStatus("");
    this.setCheckable(true);
    this.render();
  };

  Sequence.prototype.isLockedAnswer = function (c) {
    return c.answer >= 0 && !!this.fixed[c.answer];
  };

  Sequence.prototype.where = function (id) {
    var i = this.slots.indexOf(id);
    if (i >= 0) return { slot: i };
    return { tray: this.trayIds.indexOf(id) };
  };

  Sequence.prototype.isLocked = function (id) {
    var c = this.cards[id];
    return !!(c.answer >= 0 && this.fixed[c.answer] && this.slots[c.answer] === id);
  };

  Sequence.prototype.place = function (id, slot) {
    if (this.fixed[slot]) return false;
    if (this.isLocked(id)) return false;
    var from = this.where(id);
    var occupant = this.slots[slot];
    if (occupant === id) return false;
    this.slots[slot] = id;
    if (from.slot != null) {
      this.slots[from.slot] = occupant;
    } else {
      this.trayIds.splice(from.tray, 1);
      if (occupant != null) this.trayIds.splice(from.tray, 0, occupant);
    }
    this.afterMove();
    return true;
  };

  Sequence.prototype.toTray = function (id) {
    if (this.isLocked(id)) return false;
    var from = this.where(id);
    if (from.slot == null) return false;
    this.slots[from.slot] = null;
    this.trayIds.push(id);
    this.afterMove();
    return true;
  };

  Sequence.prototype.afterMove = function () {
    this.selected = null;
    this.clearMarks();
    this.root.classList.remove("isq-solved");
    this.setStatus("");
    this.render();
  };

  Sequence.prototype.render = function () {
    var self = this;
    this.slotEls.forEach(function (s, i) {
      var body = s.querySelector(".isq-slot-body");
      var id = self.slots[i];
      Array.prototype.forEach.call(body.querySelectorAll(".isq-card"), function (c) {
        if (+c.dataset.id !== id) body.removeChild(c);
      });
      if (id != null && self.cards[id].el.parentNode !== body) body.appendChild(self.cards[id].el);
      s.classList.toggle("isq-filled", id != null);
      s.classList.toggle("isq-fixed", !!self.fixed[i]);
    });
    this.trayIds.forEach(function (id) { self.tray.appendChild(self.cards[id].el); });
    this.cards.forEach(function (c) {
      c.el.classList.toggle("isq-locked", self.isLocked(c.id));
      c.el.classList.toggle("isq-selected", self.selected === c.id);
      c.el.classList.toggle("isq-intray", self.trayIds.indexOf(c.id) >= 0);
    });
    this.root.classList.toggle("isq-has-selection", this.selected != null);

    var left = this.trayIds.length;
    var txt;
    if (!left) txt = "All pictures placed. Press <strong>Check</strong> when you're ready.";
    else txt = "Pictures to place (" + left + ")";
    if (this.distractors) {
      txt += ' <span class="isq-distract-note">' +
        (this.distractors === 1 ? "One picture doesn't belong: leave it here."
          : this.distractors + " pictures don't belong: leave them here.") + "</span>";
    }
    this.trayHead.innerHTML = txt;
    this.trayWrap.classList.toggle("isq-tray-empty", !left);
    this.updateClue();
    if (this.isFull && this.isFull()) this.fitFull(true);
  };

  /* Clue box: the caption of the picture that is picked up, being
     dragged or pointed at. */
  Sequence.prototype.updateClue = function () {
    if (!this.clueBox || this.clueBox.hidden) return;
    var id = this.hoverId != null ? this.hoverId : this.selected;
    var c = id != null ? this.cards[id] : null;
    if (!c) {
      this.clueBox.classList.add("isq-clue-idle");
      this.clueBox.textContent = this.cfg.cluePrompt || "Tap or point at a picture to read about it.";
      return;
    }
    this.clueBox.classList.remove("isq-clue-idle");
    var tmp = el("div", null, c.captionHtml || "");
    var capText = tmp.textContent.trim();
    var name = c.name || "";
    var html;
    if (name && capText && capText.toLowerCase() !== name.toLowerCase()) {
      html = "<strong>" + name.replace(/&/g, "&amp;").replace(/</g, "&lt;") + ":</strong> " + c.captionHtml;
    } else {
      html = c.captionHtml || (name ? "<strong>" + name.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</strong>" : c.alt);
    }
    this.clueBox.innerHTML = html;
  };

  Sequence.prototype.clearMarks = function () {
    this.cards.forEach(function (c) {
      c.el.classList.remove("isq-right", "isq-wrong", "isq-shown");
      c.el.querySelector(".isq-mark").textContent = "";
    });
  };

  /* After Show answer, Check is turned off (the answer is on screen) until
     Start again, Fill boxes randomly or New chain. Moving pictures doesn't
     turn it back on: two could be swapped and swapped back. */
  Sequence.prototype.setCheckable = function (on) {
    var b = this.q(".isq-check");
    if (!b) return;
    b.disabled = !on;
    b.title = on ? "" : "Press Start again to check again";
  };

  Sequence.prototype.setStatus = function (html, kind) {
    this.status.innerHTML = html;
    this.status.className = "isq-status" + (kind ? " isq-status-" + kind : "");
  };

  Sequence.prototype.check = function () {
    var self = this, right = 0, placed = 0;
    if (this.q(".isq-check").disabled) return;
    this.clearMarks();
    this.slots.forEach(function (id, i) {
      if (id == null) return;
      placed++;
      var ok = self.cards[id].answer === i;
      if (ok) right++;
      if (self.cfg.feedback === "marks" && !self.fixed[i]) {
        var c = self.cards[id].el;
        c.classList.add(ok ? "isq-right" : "isq-wrong");
        c.querySelector(".isq-mark").textContent = ok ? "✓" : "✗";
      }
    });
    if (this.settings.captions === "reveal") {
      this.revealed = true;
      this.root.classList.add("isq-revealed");
    }
    if (right === this.n) {
      this.root.classList.add("isq-solved");
      this.setStatus("&#127881; All in the right order. Well done!", "good");
      return;
    }
    var msg = right + " of " + this.n + " in the right place.";
    if (placed < this.n) msg += " " + (this.n - placed) + " box" + (this.n - placed === 1 ? "" : "es") + " still empty.";
    this.setStatus(msg, right ? "part" : "bad");
  };

  Sequence.prototype.showAnswer = function () {
    var self = this;
    this.slots = this.byAnswer.map(function (c) { return c.id; });
    this.trayIds = this.cards.filter(function (c) { return c.answer < 0; }).map(function (c) { return c.id; });
    this.selected = null;
    this.render();
    this.clearMarks();
    this.slots.forEach(function (id) { self.cards[id].el.classList.add("isq-shown"); });
    this.revealed = true;
    this.root.classList.add("isq-revealed");
    this.setCheckable(false);
    this.setStatus("Here is the right order." +
      (this.distractors ? " The picture" + (this.distractors === 1 ? " left below doesn't" : "s left below don't") + " belong." : ""), "part");
  };

  /* ---------- tap / click selection ---------- */

  Sequence.prototype.tapCard = function (id) {
    var where = this.where(id);
    if (this.selected != null && this.selected !== id) {
      if (where.slot != null) {
        if (this.place(this.selected, where.slot)) return;
      } else if (this.where(this.selected).slot != null) {
        // Selected card is in a box and a tray card was tapped: swap them.
        var s = this.where(this.selected).slot;
        if (this.place(id, s)) return;
      }
    }
    if (this.isLocked(id)) return;
    this.selected = this.selected === id ? null : id;
    this.render();
  };

  Sequence.prototype.tapSlot = function (i) {
    if (this.selected == null) return;
    this.place(this.selected, i);
  };

  Sequence.prototype.tapTray = function () {
    if (this.selected == null) return;
    if (!this.toTray(this.selected)) { this.selected = null; this.render(); }
  };

  /* ---------- drag (mouse, touch and pen) ---------- */

  Sequence.prototype.startPointer = function (e, card) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    var self = this, id = +card.dataset.id;
    var sx = e.clientX, sy = e.clientY, ghost = null, over = null, dragging = false;
    var locked = this.isLocked(id);

    function target(x, y) {
      var t = document.elementFromPoint(x, y);
      if (!t || !self.root.contains(t)) return null;
      var slot = t.closest(".isq-slot");
      if (slot) return slot;
      if (t.closest(".isq-traywrap")) return self.trayWrap;
      return null;
    }
    var lastX = sx, lastY = sy, raf = null;
    function setOver(t) {
      if (t !== over) {
        if (over) over.classList.remove("isq-over");
        over = t;
        if (over) over.classList.add("isq-over");
      }
    }
    // Scroll the page while dragging near the top or bottom edge, so a
    // picture in the tray can reach boxes that are off screen.
    function autoScroll() {
      raf = null;
      if (!dragging) return;
      var edge = 80, top = 0, bottom = window.innerHeight, dy = 0;
      var full = self.isFull();
      // Full screen, side by side: the boxes area is what scrolls.
      var boxes = full && window.innerWidth >= 800;
      if (boxes) {
        var br = self.board.getBoundingClientRect();
        top = br.top; bottom = br.bottom;
      }
      if (lastY < top + edge) dy = -Math.ceil((top + edge - lastY) / 5);
      else if (lastY > bottom - edge) dy = Math.ceil((lastY - (bottom - edge)) / 5);
      if (dy) {
        if (boxes) self.board.scrollTop += dy;
        else if (full) self.root.scrollTop += dy;
        else window.scrollBy(0, dy);
        setOver(target(lastX, lastY));
        raf = requestAnimationFrame(autoScroll);
      }
    }
    function move(ev) {
      lastX = ev.clientX; lastY = ev.clientY;
      if (!dragging) {
        if (locked || Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 7) return;
        dragging = true;
        var r = card.getBoundingClientRect();
        var w = Math.min(r.width, 240);
        ghost = card.cloneNode(true);
        ghost.classList.add("isq-ghost");
        ghost.classList.remove("isq-selected");
        ghost.style.width = w + "px";
        (document.fullscreenElement === self.root ? self.root : document.body).appendChild(ghost);
        self.ghostOffset = { x: w / 2, y: Math.min(r.height, w * 0.8) / 2 };
        card.classList.add("isq-dragging");
        self.root.classList.add("isq-is-dragging");
        self.hoverId = id;
        self.updateClue();
      }
      ev.preventDefault();
      ghost.style.left = (ev.clientX - self.ghostOffset.x) + "px";
      ghost.style.top = (ev.clientY - self.ghostOffset.y) + "px";
      setOver(target(ev.clientX, ev.clientY));
      if (!raf) raf = requestAnimationFrame(autoScroll);
    }
    function up(ev) {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
      if (over) over.classList.remove("isq-over");
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (!dragging) {
        if (ev.type === "pointerup") self.tapCard(id);
        return;
      }
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      card.classList.remove("isq-dragging");
      self.root.classList.remove("isq-is-dragging");
      if (ev.type !== "pointerup") return;
      var t = target(ev.clientX, ev.clientY);
      if (t && t.classList.contains("isq-slot")) self.place(id, +t.dataset.slot);
      else if (t === self.trayWrap) self.toTray(id);
    }
    document.addEventListener("pointermove", move, { passive: false });
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
  };

  /* ---------- events ---------- */

  Sequence.prototype.bind = function () {
    var self = this, root = this.root;

    root.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".isq-zoom")) return;
      var card = e.target.closest(".isq-card");
      if (card && !card.classList.contains("isq-ghost") && root.contains(card)) {
        e.preventDefault();
        card.focus({ preventScroll: true });
        self.startPointer(e, card);
      }
    });

    root.addEventListener("mouseover", function (e) {
      var card = e.target.closest && e.target.closest(".isq-card");
      if (!card || card.classList.contains("isq-ghost") || !root.contains(card)) return;
      var id = +card.dataset.id;
      if (self.hoverId !== id) { self.hoverId = id; self.updateClue(); }
    });
    root.addEventListener("mouseout", function (e) {
      var card = e.target.closest && e.target.closest(".isq-card");
      if (!card) return;
      if (e.relatedTarget && card.contains(e.relatedTarget)) return;
      if (self.root.classList.contains("isq-is-dragging")) return;
      self.hoverId = null;
      self.updateClue();
    });

    root.addEventListener("click", function (e) {
      var z = e.target.closest(".isq-zoom");
      if (z) { self.zoom(+z.closest(".isq-card").dataset.id); return; }
      if (e.target.closest(".isq-card")) return;
      var slot = e.target.closest(".isq-slot");
      if (slot) { self.tapSlot(+slot.dataset.slot); return; }
      if (e.target.closest(".isq-traywrap")) self.tapTray();
    });

    root.addEventListener("keydown", function (e) {
      if (!self.lightbox.hidden && e.key === "Escape") { self.closeZoom(); return; }
      var t = e.target;
      if (e.key === "Enter" || e.key === " ") {
        if (t.classList.contains("isq-card")) { e.preventDefault(); self.tapCard(+t.dataset.id); }
        else if (t.classList.contains("isq-slot")) { e.preventDefault(); self.tapSlot(+t.dataset.slot); }
      } else if (e.key === "Escape" && self.selected != null) {
        self.selected = null; self.render();
      } else if ((e.key === "f" || e.key === "F") && !/INPUT|SELECT|TEXTAREA/.test(t.tagName)) {
        self.toggleFullscreen();
      }
    });

    this.q(".isq-check").addEventListener("click", function () { self.check(); });
    this.q(".isq-show").addEventListener("click", function () { self.showAnswer(); });
    this.q(".isq-reset").addEventListener("click", function () { self.reset(); });
    this.q(".isq-scatter").addEventListener("click", function () { self.scatter(); });
    if (this.multi) this.q(".isq-next").addEventListener("click", function () { self.nextSet(); });
    this.q(".isq-print").addEventListener("click", function () { self.print(); });
    this.q(".isq-fullscreen").addEventListener("click", function () { self.toggleFullscreen(); });

    var tog = this.q(".isq-settings-toggle");
    tog.addEventListener("click", function () {
      var open = self.settingsPanel.hidden;
      self.settingsPanel.hidden = !open;
      tog.setAttribute("aria-expanded", String(open));
    });

    ["captions", "arrows", "numbering", "theme", "fullFit"].forEach(function (k) {
      self.q(".isq-in-" + k).addEventListener("change", function (e) {
        self.settings[k] = e.target.value;
        self.applySettings();
      });
    });

    COLUMN_KEYS.forEach(function (k) {
      self.q(".isq-in-" + k).addEventListener("change", function (e) {
        self.settings[k] = parseInt(e.target.value, 10) || 0;
        self.applySettings();
      });
    });

    this.lightbox.addEventListener("click", function () { self.closeZoom(); });

    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        var c = self.effectiveCols();
        if (c !== self.cols) {
          self.cols = c;
          layoutGrid(self.grid, self.slotEls, c, self.settings.arrows);
        }
        if (self.isFull()) self.fitFull();
      }).observe(this.board);
    }
    var onFull = function () { self.onFullChange(); };
    document.addEventListener("fullscreenchange", onFull);
    document.addEventListener("webkitfullscreenchange", onFull);
  };

  Sequence.prototype.zoom = function (id) {
    var c = this.cards[id];
    var img = this.lightbox.querySelector(".isq-lb-img");
    img.src = c.src;
    img.alt = c.alt;
    var capShown = this.settings.captions === "below" || this.settings.captions === "overlay" ||
      (this.settings.captions === "reveal" && this.revealed);
    var cap = this.lightbox.querySelector(".isq-lb-cap");
    cap.innerHTML = capShown ? c.captionHtml : "";
    cap.hidden = !capShown || !c.captionHtml;
    this.lightbox.hidden = false;
    this.lightbox.querySelector(".isq-lb-close").focus();
  };

  Sequence.prototype.closeZoom = function () {
    this.lightbox.hidden = true;
  };

  Sequence.prototype.isFull = function () {
    return document.fullscreenElement === this.root || document.webkitFullscreenElement === this.root;
  };

  /* Full screen: the tray sits in a column on the right, and the boxes are
     sized to the screen. settings.fullFit says how:
       screen - as wide as they can be while every box still fits on the
                screen (more rows = smaller boxes);
       large  - as wide as they can be while one row of boxes fits on the
                screen; the boxes scroll if there are more rows than fit;
       auto   - "screen", unless that would make the boxes much smaller
                than "large" (e.g. 1 or 2 in a row with many steps), when
                it is "large". One-column arrows (down / up) stay "screen".
     onlyShrink: after a move, only make the boxes smaller if something
     no longer fits, so they don't jump about while students work. */
  Sequence.prototype.fitFull = function (onlyShrink) {
    var g = this.grid, b = this.board, slots = this.slotEls;
    if (!this.isFull() || window.innerWidth < 800) { g.style.maxWidth = ""; return; }
    var cs = getComputedStyle(b);
    var availH = b.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var maxW = Math.floor(b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    var mode = this.settings.fullFit || "auto";
    var arrows = this.settings.arrows;
    if (mode === "auto" && (arrows === "down" || arrows === "up")) mode = "screen";

    function allH(w) { g.style.maxWidth = w + "px"; return g.offsetHeight; }
    function rowH(w) {
      g.style.maxWidth = w + "px";
      var m = 0;
      slots.forEach(function (s) { if (s.offsetHeight > m) m = s.offsetHeight; });
      return m;
    }
    // Narrower boxes make captions wrap onto more lines, so height doesn't
    // always go down as the width does. Scan for the widest size that fits,
    // then home in on it; if nothing fits, use the shortest layout (the
    // boxes area scrolls in that case).
    function widest(height) {
      if (height(maxW) <= availH) return { w: maxW, fits: true };
      var minW = Math.min(200, maxW), steps = 24, best = null, shortest = { w: maxW, h: Infinity };
      for (var i = 0; i <= steps; i++) {
        var w = Math.round(maxW - (maxW - minW) * i / steps);
        var h = height(w);
        if (h < shortest.h - 2) shortest = { w: w, h: h };
        if (h <= availH) { best = w; break; }
      }
      if (best == null) return { w: shortest.w, fits: false };
      var lo = best, hi = Math.min(maxW, best + (maxW - minW) / steps);
      for (var k = 0; k < 8 && hi - lo > 3; k++) {
        var mid = (lo + hi) / 2;
        if (height(mid) <= availH) lo = mid; else hi = mid;
      }
      return { w: Math.floor(lo), fits: true };
    }

    var cur = parseFloat(g.style.maxWidth) || maxW;
    var target;
    if (mode === "screen") {
      if (onlyShrink && allH(cur) <= availH) return;
      target = widest(allH).w;
    } else {
      target = widest(rowH).w;
      if (mode === "auto") {
        var all = widest(allH);
        if (all.fits && all.w >= 0.6 * target) target = all.w;
      }
      if (onlyShrink && target > cur) target = cur;
    }
    g.style.maxWidth = target + "px";
  };

  Sequence.prototype.onFullChange = function () {
    var self = this, on = this.isFull();
    this.root.classList.toggle("isq-full", on);
    var btn = this.q(".isq-fullscreen");
    btn.title = on ? "Exit full screen (Esc)" : "Full screen (F)";
    btn.setAttribute("aria-label", btn.title);
    requestAnimationFrame(function () {
      self.cols = self.effectiveCols();
      layoutGrid(self.grid, self.slotEls, self.cols, self.settings.arrows);
      self.fitFull();
    });
  };

  Sequence.prototype.toggleFullscreen = function () {
    var r = this.root, doc = document;
    if (doc.fullscreenElement === r || doc.webkitFullscreenElement === r) {
      (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
    } else if (r.requestFullscreen) {
      r.requestFullscreen().catch(function () {});
    } else if (r.webkitRequestFullscreen) {
      r.webkitRequestFullscreen();
    }
  };

  /* ---------- print ---------- */

  Sequence.prototype.buildPrint = function () {
    var self = this, cfg = this.cfg, sheet = this.printSheet;
    sheet.innerHTML = "";
    if (cfg.print === "none" || !this.view) return;
    var views = [this.view];
    if (this.multi && cfg.printChains === "all") {
      views = this.sets.map(function (s, k) { return k === self.setIndex ? self.view : self.makeView(k); });
    }
    var keys = [];
    views.forEach(function (v) {
      var out = self.printView(v);
      out.pages.forEach(function (p) { sheet.appendChild(p); });
      if (out.key) keys.push(out.key);
    });
    keys.forEach(function (k) { sheet.appendChild(k); });
    // Every sheet after the first starts on a new page.
    Array.prototype.forEach.call(sheet.children, function (p, i) { if (i) p.classList.add("isq-pbreak"); });
  };

  /* Printed pages for one sequence: the worksheet (plus a cut-out page for
     cards) and, if wanted, its answer page. */
  Sequence.prototype.printView = function (v) {
    var self = this, cfg = this.cfg, s = this.settings;
    var cols = Math.min(cfg.columns, 4);
    var cards = cfg.print === "cards";
    // Picture labels: letters, unless the boxes already use letters.
    var picLabel = s.numbering === "letters" ? function (i) { return String(i + 1); } : letter;
    var pos = {};
    v.printOrder.forEach(function (id, i) { pos[id] = i; });
    var showCap = s.captions === "below" || s.captions === "overlay";  // printed under the picture
    var pages = [];

    function slotsGrid(filled) {
      var els = [];
      for (var i = 0; i < v.n; i++) {
        var sl = el("div", "isq-pslot");
        var lab = self.slotLabel(i, s.numbering, v.byAnswer);
        if (lab) sl.appendChild(el("div", "isq-pslot-label", lab));
        var box = el("div", "isq-pslot-box");
        var c = v.byAnswer[i];
        if (filled) {
          box.appendChild(el("img", "isq-pimg")).src = c.src;
          box.appendChild(el("div", "isq-pkey", picLabel(pos[c.id])));
        } else if (v.fixed[i]) {
          // Given as a starting point, so print the picture itself.
          box.appendChild(el("img", "isq-pimg")).src = c.src;
          box.classList.add("isq-pslot-fixed");
        }
        sl.appendChild(box);
        if (s.captions === "slot" || filled) sl.appendChild(el("div", "isq-pslot-cap", c.captionHtml));
        els.push(sl);
      }
      var g = el("div", "isq-pgrid");
      layoutGrid(g, els, cols, s.arrows);
      // layoutGrid resets the class list, so add the print classes after it.
      g.classList.add("isq-pgrid", filled || cards ? "isq-pgrid-pics" : "isq-pgrid-write");
      return g;
    }

    var title = v.title + (v.subtitle ? ": " + v.subtitle : "");
    var page = el("div", "isq-ppage");
    page.appendChild(el("div", "isq-ptitle", title));
    page.appendChild(el("div", "isq-phelp", cards
      ? "Cut out the pictures. Stick each one into the right box so the steps are in order." +
        (v.distractors ? " One or more pictures don't belong: leave them out." : "")
      : "Write the letter of each picture in the right box so the steps are in order." +
        (v.distractors ? " One or more pictures don't belong: leave them out." : "")));
    page.appendChild(slotsGrid(false));

    var pics = el("div", "isq-ppics" + (cards ? " isq-ppics-cut" : ""));
    pics.style.gridTemplateColumns = "repeat(" + cols + ", minmax(0, 1fr))";
    v.printOrder.forEach(function (id) {
      var c = v.cards[id];
      if (c.answer >= 0 && v.fixed[c.answer]) return;
      var p = el("div", "isq-ppic");
      p.appendChild(el("div", "isq-ppic-label", picLabel(pos[id])));
      p.appendChild(el("img", "isq-pimg")).src = c.src;
      if (showCap && c.captionHtml) p.appendChild(el("div", "isq-ppic-cap", c.captionHtml));
      pics.appendChild(p);
    });
    pages.push(page);
    if (cards) {
      var cutPage = el("div", "isq-ppage isq-pbreak");
      cutPage.appendChild(el("div", "isq-phelp", "&#9986; Cut along the dashed lines." +
        (v.subtitle ? " (" + v.subtitle + ")" : "")));
      cutPage.appendChild(pics);
      pages.push(cutPage);
    } else {
      page.appendChild(pics);
    }

    var key = null;
    if (cfg.answerKey) {
      key = el("div", "isq-ppage isq-pbreak");
      key.appendChild(el("div", "isq-ptitle", title + ": answers"));
      var order = v.byAnswer.map(function (c) { return picLabel(pos[c.id]); });
      key.appendChild(el("div", "isq-phelp", "Order: " + order.join(" &rarr; ")));
      key.appendChild(slotsGrid(true));
    }
    return { pages: pages, key: key };
  };

  /* The Print button prints a copy of this sheet on its own. Hiding the
     rest of the page with visibility left it taking up space, which gave
     blank pages, so everything else is taken out of the layout instead. */
  Sequence.prototype.preparePrint = function () {
    this.cleanupPrint();
    var host = el("div", "imagesequence isq-print-host");
    var ratio = this.root.style.getPropertyValue("--isq-ratio");
    if (ratio) host.style.setProperty("--isq-ratio", ratio);
    host.appendChild(this.printSheet.cloneNode(true));
    document.body.appendChild(host);
    document.documentElement.classList.add("isq-printing");
    this.printHost = host;
  };

  Sequence.prototype.cleanupPrint = function () {
    document.documentElement.classList.remove("isq-printing");
    if (this.printHost && this.printHost.parentNode) this.printHost.parentNode.removeChild(this.printHost);
    this.printHost = null;
  };

  Sequence.prototype.print = function () {
    var self = this;
    this.preparePrint();
    function cleanup() {
      window.removeEventListener("afterprint", cleanup);
      self.cleanupPrint();
    }
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  function initAll() {
    Array.prototype.forEach.call(document.querySelectorAll(".imagesequence"), function (r) {
      if (r.dataset.isqReady) return;
      r.dataset.isqReady = "1";
      try { r._isq = new Sequence(r); } catch (err) { if (window.console) console.error("imagesequence:", err); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll);
  else initAll();
})();
