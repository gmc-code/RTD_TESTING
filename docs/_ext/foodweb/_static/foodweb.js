/* foodweb – highlight what each organism eats and what eats it, and build
   food chains by clicking. The web itself is drawn at build time. */
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function listText(names) {
    if (!names.length) return "";
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }

  function article(name) {
    return (/^[aeiou]/i.test(name) ? "an " : "a ") + name.toLowerCase();
  }

  var THEMES = [["dark", "Dark"], ["light", "Light"], ["auto", "Auto"], ["ocean", "Ocean"],
    ["forest", "Forest"], ["sunset", "Sunset"], ["contrast", "High contrast"]];

  function FoodWeb(root) {
    this.root = root;
    var data = root.querySelector(".fw-data");
    this.cfg = JSON.parse(data ? data.textContent : "{}");
    this.names = this.cfg.organisms || [];
    var n = this.names.length;
    this.food = [];
    this.eaters = [];
    for (var i = 0; i < n; i++) { this.food.push([]); this.eaters.push([]); }
    var self = this;
    (this.cfg.links || []).forEach(function (l) {
      self.eaters[l[0]].push(l[1]);
      self.food[l[1]].push(l[0]);
    });
    this.svg = root.querySelector(".fw-svg");
    this.nodes = Array.prototype.slice.call(root.querySelectorAll(".fw-node"));
    this.edges = Array.prototype.slice.call(root.querySelectorAll(".fw-edge"));
    this.edgeGroup = root.querySelector(".fw-edges");
    this.mode = ["place", "explore", "trace"].indexOf(this.cfg.mode) >= 0 ? this.cfg.mode : "place";
    this.locked = null;
    this.chain = [];
    this.build();
    this.initDrag();
    this.initPlace();
    this.bind();
    this.setMode(this.mode);
  }

  FoodWeb.prototype.q = function (s) { return this.root.querySelector(s); };

  FoodWeb.prototype.build = function () {
    var root = this.root;
    var bar = el("div", "fw-toolbar");
    bar.innerHTML =
      '<span class="fw-group" role="group" aria-label="Mode">' +
      '<button type="button" class="fw-btn fw-m-place" aria-pressed="false" title="Drag each picture into its box">&#129513; Place</button>' +
      '<button type="button" class="fw-btn fw-m-explore" aria-pressed="false" title="Tap an organism to see what it eats and what eats it">&#128269; Explore</button>' +
      '<button type="button" class="fw-btn fw-m-trace" aria-pressed="false" title="Build a food chain by tapping organisms in order">&#128279; Trace a chain</button>' +
      '</span>' +
      '<button type="button" class="fw-btn fw-btn-main fw-p-check" hidden>&#10003; Check</button>' +
      '<button type="button" class="fw-btn fw-p-show" hidden>Show answer</button>' +
      '<button type="button" class="fw-btn fw-p-reset" hidden>&#8635; Start again</button>' +
      '<button type="button" class="fw-btn fw-undo" hidden>&#8630; Undo</button>' +
      '<button type="button" class="fw-btn fw-hintbtn" hidden title="Show what could eat the last organism">&#128161; Hint</button>' +
      '<button type="button" class="fw-btn fw-clear" hidden>&#8635; Start again</button>' +
      '<span class="fw-spacer"></span>' +
      '<button type="button" class="fw-btn fw-resetlayout" title="Put the pictures back where they started">&#8634; Reset layout</button>' +
      '<button type="button" class="fw-btn fw-copylayout" title="Copy the positions of the pictures, to paste into the foodweb directive">&#128203; Copy layout</button>' +
      '<button type="button" class="fw-btn fw-t-arrows" aria-pressed="true">Arrows</button>' +
      '<button type="button" class="fw-btn fw-t-names" aria-pressed="true">Names</button>' +
      '<button type="button" class="fw-btn fw-icon fw-settings-toggle" title="Settings" aria-label="Settings" aria-expanded="false">&#9881;</button>' +
      '<button type="button" class="fw-btn fw-icon fw-print" title="Print" aria-label="Print">&#128424;</button>' +
      '<button type="button" class="fw-btn fw-icon fw-fullscreen" title="Full screen (F)" aria-label="Full screen">' +
      '<svg class="fw-full-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';

    var set = el("div", "fw-settings");
    set.hidden = true;
    set.innerHTML = '<label>Clues: <select class="fw-in-clues">' +
      '<option value="both">Table and picked-up picture</option>' +
      '<option value="table">Table of what each eats</option>' +
      '<option value="selected">Picked-up picture only</option>' +
      '<option value="none">No clues</option></select></label>' +
      '<label>Theme: <select class="fw-in-theme">' +
      THEMES.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + "</option>"; }).join("") +
      "</select></label>";

    var lay = el("div", "fw-layoutbox");
    lay.hidden = true;
    lay.innerHTML = '<div class="fw-layoutbox-head">Paste this into the foodweb directive, ' +
      'in place of its <code>.. levels::</code> (and any <code>.. positions::</code>) block:</div>' +
      '<textarea class="fw-layout-text" rows="12" spellcheck="false" readonly></textarea>' +
      '<div class="fw-layoutbox-foot"><span class="fw-layout-msg"></span>' +
      '<button type="button" class="fw-btn fw-layout-close">Close</button></div>';
    this.layoutBox = lay;

    this.info = el("div", "fw-info");
    this.info.setAttribute("aria-live", "polite");

    // Enlarged picture (the magnifier on each card), as in imagesequence.
    this.lightbox = el("div", "fw-lightbox");
    this.lightbox.hidden = true;
    this.lightbox.innerHTML =
      '<div class="fw-lb-inner"><img class="fw-lb-img" alt=""><div class="fw-lb-cap"></div>' +
      '<button type="button" class="fw-btn fw-lb-close" aria-label="Close">&#10005; Close</button></div>';

    var head = this.q(".fw-head");
    head.parentNode.insertBefore(bar, head.nextSibling);
    bar.parentNode.insertBefore(set, bar.nextSibling);
    set.parentNode.insertBefore(lay, set.nextSibling);
    this.cluePanel = el("div", "fw-clues");
    root.appendChild(this.cluePanel);
    root.appendChild(this.info);
    root.appendChild(this.lightbox);

    this.badges = document.createElementNS(SVGNS, "g");
    this.badges.setAttribute("class", "fw-badges");
    this.svg.appendChild(this.badges);

    this.q(".fw-in-theme").value = this.cfg.theme || "light";
    this.clues = ["both", "table", "selected", "none"].indexOf(this.cfg.clues) >= 0 ? this.cfg.clues : "both";
    this.q(".fw-in-clues").value = this.clues;
    this.setToggle(".fw-t-arrows", !root.classList.contains("fw-no-arrows"));
    this.setToggle(".fw-t-names", !root.classList.contains("fw-no-names"));
  };

  // The picture for organism i ("" if it has none).
  FoodWeb.prototype.picSrc = function (i) {
    var img = this.cards[i] && this.cards[i].mv.querySelector("image");
    return img ? (img.getAttribute("href") || img.getAttribute("xlink:href") || "") : "";
  };

  // A magnifier button (HTML) for organism i, or "" if it has no picture.
  FoodWeb.prototype.zoomBtn = function (i) {
    if (!this.picSrc(i)) return "";
    return '<button type="button" class="fw-zoombtn" data-i="' + i + '" title="Enlarge" ' +
      'aria-label="Enlarge picture of ' + esc(this.names[i]) + '">&#128269;</button>';
  };

  // Scale each magnifier in the web about its corner so it is 1.7rem on
  // screen, however much the web has been shrunk or stretched to fit.
  FoodWeb.prototype.sizeZooms = function () {
    var r = this.svg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var vb = this.svg.viewBox.baseVal;
    var k = Math.max(vb.width / r.width, vb.height / r.height);
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    k *= rem / 16;
    if (!isFinite(k) || k <= 0) return;
    Array.prototype.forEach.call(this.svg.querySelectorAll(".fw-zoom"), function (z) {
      var ax = z.getAttribute("data-ax"), ay = z.getAttribute("data-ay");
      z.setAttribute("transform", "translate(" + ax + " " + ay + ") scale(" + k.toFixed(3) + ") translate(" +
        (-ax) + " " + (-ay) + ")");
    });
  };

  FoodWeb.prototype.zoom = function (i) {
    var src = this.picSrc(i);
    if (!src) return;
    this.lastFocus = document.activeElement;
    var img = this.lightbox.querySelector(".fw-lb-img");
    img.src = src;
    img.alt = this.names[i];
    this.lightbox.querySelector(".fw-lb-cap").textContent = this.names[i];
    this.lightbox.hidden = false;
    this.lightbox.querySelector(".fw-lb-close").focus();
  };

  FoodWeb.prototype.closeZoom = function () {
    this.lightbox.hidden = true;
    if (this.lastFocus && this.lastFocus.focus) {
      try { this.lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  };

  FoodWeb.prototype.setToggle = function (sel, on) {
    this.q(sel).setAttribute("aria-pressed", on ? "true" : "false");
  };

  FoodWeb.prototype.bind = function () {
    var self = this;
    // The magnifier is caught on the way down (capture), so it never starts
    // a drag, picks a picture or fills a box.
    this.root.addEventListener("pointerdown", function (ev) {
      if (ev.target.closest && ev.target.closest(".fw-zoom, .fw-zoombtn")) ev.stopPropagation();
    }, true);
    this.root.addEventListener("click", function (ev) {
      var z = ev.target.closest && ev.target.closest(".fw-zoom, .fw-zoombtn");
      if (!z) return;
      ev.stopPropagation();
      ev.preventDefault();
      var i = z.hasAttribute("data-i") ? +z.getAttribute("data-i")
        : +z.closest(".fw-node, .fw-piece").getAttribute("data-i");
      self.zoom(i);
    }, true);
    // Keep the web's magnifiers the same size on screen as imagesequence's.
    this.sizeZooms();
    if (window.ResizeObserver) {
      new ResizeObserver(function () { self.sizeZooms(); }).observe(this.svg);
    }
    document.addEventListener("fullscreenchange", function () { self.sizeZooms(); });
    this.lightbox.addEventListener("click", function () { self.closeZoom(); });
    this.root.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !self.lightbox.hidden) { ev.stopPropagation(); self.closeZoom(); }
    }, true);
    this.nodes.forEach(function (g) {
      var i = +g.getAttribute("data-i");
      g.addEventListener("mouseenter", function () {
        if (self.mode === "explore" && self.locked === null) self.focus(i);
        // Place mode, picture tapped: light up this box's arrows.
        if (self.mode === "place" && self.picked != null && !self.pdrag) self.dropTarget(i);
      });
      g.addEventListener("mouseleave", function () {
        if (self.mode === "explore" && self.locked === null) self.unfocus();
        if (self.mode === "place" && !self.pdrag) self.dropTarget(-1);
      });
      g.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (self.justDragged) { self.justDragged = false; return; }
        self.pick(i);
      });
      g.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          self.pick(i);
        } else if (/^Arrow/.test(ev.key) && self.mode !== "place") {
          ev.preventDefault();
          ev.stopPropagation();
          self.keyMove(i, ev.key, ev.shiftKey);
        }
      });
    });
    this.svg.addEventListener("click", function () {
      if (self.mode === "explore") { self.locked = null; self.unfocus(); }
    });

    this.q(".fw-m-place").addEventListener("click", function () { self.setMode("place"); });
    this.q(".fw-p-check").addEventListener("click", function () { self.checkPlace(); });
    this.q(".fw-p-show").addEventListener("click", function () { self.showAnswer(); });
    this.q(".fw-p-reset").addEventListener("click", function () { self.resetPlace(); });
    this.q(".fw-m-explore").addEventListener("click", function () { self.setMode("explore"); });
    this.q(".fw-m-trace").addEventListener("click", function () { self.setMode("trace"); });
    this.q(".fw-undo").addEventListener("click", function () { self.undo(); });
    this.q(".fw-clear").addEventListener("click", function () { self.clearChain(); });
    this.q(".fw-hintbtn").addEventListener("click", function () { self.hint(); });
    this.q(".fw-t-arrows").addEventListener("click", function () {
      var on = self.root.classList.toggle("fw-no-arrows");
      self.setToggle(".fw-t-arrows", !on);
    });
    this.q(".fw-t-names").addEventListener("click", function () {
      var on = self.root.classList.toggle("fw-no-names");
      self.setToggle(".fw-t-names", !on);
    });
    var setBtn = this.q(".fw-settings-toggle");
    setBtn.addEventListener("click", function () {
      var panel = self.q(".fw-settings");
      panel.hidden = !panel.hidden;
      setBtn.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
    });
    this.q(".fw-in-clues").addEventListener("change", function (ev) {
      self.clues = ev.target.value;
      self.showClueTable();
    });
    this.q(".fw-in-theme").addEventListener("change", function (ev) {
      var r = self.root;
      THEMES.forEach(function (t) { r.classList.remove("fw-theme-" + t[0]); });
      r.classList.add("fw-theme-" + ev.target.value);
    });
    this.q(".fw-print").addEventListener("click", function () { self.print(); });
    this.q(".fw-resetlayout").addEventListener("click", function () { self.resetLayout(); });
    this.q(".fw-copylayout").addEventListener("click", function () { self.copyLayout(); });
    this.q(".fw-layout-close").addEventListener("click", function () { self.layoutBox.hidden = true; });
    this.q(".fw-fullscreen").addEventListener("click", function () { self.toggleFullscreen(); });
    this.root.addEventListener("keydown", function (ev) {
      if (ev.target.tagName === "SELECT") return;
      if (ev.key === "f" || ev.key === "F") { self.toggleFullscreen(); }
      else if (ev.key === "Escape" && self.mode === "explore") { self.locked = null; self.unfocus(); }
    });
  };

  /* ---------- explore ---------- */

  FoodWeb.prototype.clearMarks = function () {
    this.nodes.forEach(function (g) {
      g.classList.remove("fw-sel", "fw-food", "fw-eater", "fw-hint", "fw-wrong", "fw-inchain");
    });
    this.edges.forEach(function (g) { g.classList.remove("fw-in", "fw-out", "fw-chainlink"); });
  };

  FoodWeb.prototype.focus = function (i) {
    var self = this;
    this.clearMarks();
    this.root.classList.add("fw-focus");
    this.nodes[i].classList.add("fw-sel");
    this.food[i].forEach(function (a) { self.nodes[a].classList.add("fw-food"); });
    this.eaters[i].forEach(function (b) { self.nodes[b].classList.add("fw-eater"); });
    var raise = [];
    this.edges.forEach(function (g) {
      var a = +g.getAttribute("data-a"), b = +g.getAttribute("data-b");
      if (b === i) { g.classList.add("fw-in"); raise.push(g); }
      else if (a === i) { g.classList.add("fw-out"); raise.push(g); }
    });
    raise.forEach(function (g) { self.edgeGroup.appendChild(g); });
    this.describe(i);
  };

  FoodWeb.prototype.unfocus = function () {
    this.root.classList.remove("fw-focus");
    this.clearMarks();
    this.info.innerHTML = this.idleText();
  };

  FoodWeb.prototype.names_ = function (ids) {
    var self = this;
    return ids.map(function (k) { return self.names[k]; });
  };

  FoodWeb.prototype.describe = function (i) {
    var name = esc(this.names[i]);
    var food = this.names_(this.food[i]).map(esc);
    var eaters = this.names_(this.eaters[i]).map(esc);
    var parts = ["<strong>" + name + "</strong>" + this.zoomBtn(i)];
    parts.push(food.length
      ? ' <span class="fw-k-in">eats</span> ' + listText(food) + "."
      : " is a <strong>producer</strong> here: it doesn't eat anything in this web.");
    parts.push(eaters.length
      ? ' It is <span class="fw-k-out">eaten by</span> ' + listText(eaters) + "."
      : " Nothing in this web eats it.");
    this.info.innerHTML = parts.join("");
  };

  FoodWeb.prototype.idleText = function () {
    if (this.mode === "place") {
      return "Drag each picture from the tray into a box (or tap a picture, then tap a box). " +
        "An arrow points to what eats it.";
    }
    return this.mode === "explore"
      ? "Point at or tap an organism. <span class=\"fw-k-in\">Green</span> arrows bring its food, " +
        "<span class=\"fw-k-out\">orange</span> arrows go to what eats it. Drag a picture to move it."
      : "Tap a <strong>producer</strong> to start a food chain, then tap what eats it, and so on.";
  };

  FoodWeb.prototype.pick = function (i) {
    if (this.mode === "place") { this.slotTap(i); return; }
    if (this.mode === "trace") { this.traceTap(i); return; }
    if (this.locked === i) { this.locked = null; this.unfocus(); return; }
    this.locked = i;
    this.focus(i);
  };

  /* ---------- trace a chain ---------- */

  FoodWeb.prototype.setMode = function (mode) {
    this.mode = mode;
    this.locked = null;
    this.picked = null;
    this.root.classList.remove("fw-focus", "fw-hinting");
    this.root.classList.toggle("fw-tracing", mode === "trace");
    this.root.classList.toggle("fw-placing", mode === "place");
    ["place", "explore", "trace"].forEach(function (m) {
      this.q(".fw-m-" + m).setAttribute("aria-pressed", mode === m ? "true" : "false");
    }, this);
    ["fw-undo", "fw-clear", "fw-hintbtn"].forEach(function (c) {
      this.q("." + c).hidden = mode !== "trace";
    }, this);
    ["fw-p-check", "fw-p-show", "fw-p-reset"].forEach(function (c) {
      this.q("." + c).hidden = mode !== "place";
    }, this);
    this.q(".fw-resetlayout").hidden = mode === "place";
    this.q(".fw-copylayout").hidden = mode === "place";
    if (mode === "place") this.layoutBox.hidden = true;
    this.setTrayShown(mode === "place");
    this.showClueTable();
    var sub = this.q(".fw-sub");
    if (sub) {
      sub.textContent = mode === "place"
        ? "Drag each picture into a box. Each arrow points from the food to the organism that eats it."
        : "Each arrow points from the food to the organism that eats it.";
    }
    this.chain = [];
    this.drawChain();
    this.info.innerHTML = this.idleText();
  };

  FoodWeb.prototype.traceTap = function (i) {
    var self = this;
    this.root.classList.remove("fw-hinting");
    if (!this.chain.length) {
      this.chain.push(i);
      this.drawChain();
      if (this.food[i].length) {
        this.info.innerHTML = "<strong>" + esc(this.names[i]) + "</strong> eats other organisms, " +
          "so it isn't a producer. Food chains start with a producer (a plant). " +
          "Press <strong>Start again</strong>, or carry on from here.";
      } else {
        this.chainMessage();
      }
      return;
    }
    var last = this.chain[this.chain.length - 1];
    if (i === last) return;
    if (this.eaters[last].indexOf(i) >= 0) {
      this.chain.push(i);
      this.drawChain();
      this.chainMessage();
    } else {
      var g = this.nodes[i];
      g.classList.remove("fw-wrong");
      void g.getBBox();
      g.classList.add("fw-wrong");
      setTimeout(function () { g.classList.remove("fw-wrong"); }, 700);
      var why = this.eaters[i].indexOf(last) >= 0
        ? " It's the other way round: " + article(this.names[last]) + " eats " + article(this.names[i]) + "."
        : "";
      this.info.innerHTML = '<span class="fw-k-wrong">Not quite.</span> ' +
        esc(article(this.names[i]).replace(/^./, function (c) { return c.toUpperCase(); })) +
        " doesn't eat " + esc(article(this.names[last])) + " in this web." + esc(why) +
        " " + this.chainLine();
    }
    void self;
  };

  FoodWeb.prototype.chainLine = function () {
    var self = this;
    return '<span class="fw-chaintext">' +
      this.chain.map(function (k) { return esc(self.names[k]); }).join(" &rarr; ") + "</span>";
  };

  FoodWeb.prototype.chainMessage = function () {
    var last = this.chain[this.chain.length - 1];
    var line = this.chainLine();
    if (this.chain.length > 1 && !this.eaters[last].length) {
      var starts = !this.food[this.chain[0]].length;
      this.info.innerHTML = (starts ? '<span class="fw-k-good">Complete food chain!</span> '
        : '<span class="fw-k-good">Nothing eats ' + esc(this.names[last].toLowerCase()) + ".</span> ") +
        line + " (" + this.chain.length + " organisms)";
      return;
    }
    this.info.innerHTML = line + " &rarr; <em>what eats " + esc(article(this.names[last])) + "?</em>";
  };

  FoodWeb.prototype.drawChain = function () {
    var self = this;
    this.clearMarks();
    while (this.badges.firstChild) this.badges.removeChild(this.badges.firstChild);
    var raise = [];
    this.chain.forEach(function (k, idx) {
      var g = self.nodes[k];
      g.classList.add("fw-inchain");
      var x = self.cards[k].x0 + self.cards[k].dx, y = self.cards[k].y0 + self.cards[k].dy;
      var b = document.createElementNS(SVGNS, "g");
      b.setAttribute("class", "fw-badge");
      var c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", x + 4); c.setAttribute("cy", y + 4); c.setAttribute("r", 11);
      var t = document.createElementNS(SVGNS, "text");
      t.setAttribute("x", x + 4); t.setAttribute("y", y + 4.5);
      t.textContent = String(idx + 1);
      b.appendChild(c); b.appendChild(t);
      self.badges.appendChild(b);
      if (idx > 0) {
        var prev = self.chain[idx - 1];
        self.edges.forEach(function (e) {
          if (+e.getAttribute("data-a") === prev && +e.getAttribute("data-b") === k) {
            e.classList.add("fw-chainlink");
            raise.push(e);
          }
        });
      }
    });
    raise.forEach(function (e) { self.edgeGroup.appendChild(e); });
    this.q(".fw-undo").disabled = !this.chain.length;
    this.q(".fw-clear").disabled = !this.chain.length;
    this.q(".fw-hintbtn").disabled = !this.chain.length ||
      !this.eaters[this.chain[this.chain.length - 1]].length;
  };

  FoodWeb.prototype.undo = function () {
    this.chain.pop();
    this.root.classList.remove("fw-hinting");
    this.drawChain();
    if (this.chain.length) this.chainMessage(); else this.info.innerHTML = this.idleText();
  };

  FoodWeb.prototype.clearChain = function () {
    this.chain = [];
    this.root.classList.remove("fw-hinting");
    this.drawChain();
    this.info.innerHTML = this.idleText();
  };

  FoodWeb.prototype.hint = function () {
    var self = this;
    if (!this.chain.length) return;
    var last = this.chain[this.chain.length - 1];
    this.root.classList.add("fw-hinting");
    this.eaters[last].forEach(function (b) { self.nodes[b].classList.add("fw-hint"); });
    this.edges.forEach(function (e) {
      if (+e.getAttribute("data-a") === last) e.classList.add("fw-out");
    });
    this.info.innerHTML = this.chainLine() + " &rarr; <em>try one of the dashed boxes.</em>";
  };


  /* ---------- dragging ----------
     Pictures can be dragged anywhere. Every arrow is worked out again as
     they move: straight if it misses all the other pictures, otherwise
     curving through the gaps. Let go and the picture settles into the
     nearest level. */

  var CLEAR = 8, HEAD_LEN = 16, HEAD_HALF = 9, HEAD_GAP = 6;  // gap: tip to box

  function f1(v) { return (Math.round(v * 10) / 10).toString(); }

  FoodWeb.prototype.initDrag = function () {
    var self = this;
    this.cards = this.nodes.map(function (g) {
      var r = g.querySelector(".fw-card");
      var mv = document.createElementNS(SVGNS, "g");
      mv.setAttribute("class", "fw-move");
      while (g.firstChild) mv.appendChild(g.firstChild);
      g.appendChild(mv);
      return {
        g: g, mv: mv, dx: 0, dy: 0,
        x0: +r.getAttribute("x"), y0: +r.getAttribute("y"),
        w: +r.getAttribute("width"), h: +r.getAttribute("height")
      };
    });
    var vb = this.svg.viewBox.baseVal;
    this.W = vb.width; this.H = vb.height;
    var ys = {};
    this.cards.forEach(function (c) { ys[c.y0] = true; });
    this.rowYs = Object.keys(ys).map(Number).sort(function (a, b) { return a - b; });
    this.edgeInfo = this.edges.map(function (g) {
      return {
        g: g, a: +g.getAttribute("data-a"), b: +g.getAttribute("data-b"),
        halo: g.querySelector(".fw-halo"), line: g.querySelector(".fw-line"),
        head: g.querySelector(".fw-head"),
        d0: g.querySelector(".fw-line").getAttribute("d"),
        h0: g.querySelector(".fw-head").getAttribute("d"),
        odd0: g.classList.contains("fw-odd")
      };
    });
    this.moved = false;
    this.drag = null;

    this.nodes.forEach(function (g, i) {
      g.addEventListener("pointerdown", function (ev) {
        if (ev.button !== 0 || self.mode === "place") return;
        var p = self.svgPoint(ev);
        self.drag = { i: i, id: ev.pointerId, px: p.x, py: p.y,
          dx: self.cards[i].dx, dy: self.cards[i].dy, moving: false };
        try { g.setPointerCapture(ev.pointerId); } catch (e) { /* old browsers */ }
      });
      g.addEventListener("pointermove", function (ev) {
        var d = self.drag;
        if (!d || d.id !== ev.pointerId || d.i !== i) return;
        var p = self.svgPoint(ev);
        var mx = p.x - d.px, my = p.y - d.py;
        if (!d.moving) {
          if (Math.abs(mx) + Math.abs(my) < 5) return;
          d.moving = true;
          self.root.classList.add("fw-dragging");
          g.parentNode.appendChild(g);       // on top while it moves
          try { g.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
        }
        self.placeCard(i, d.dx + mx, d.dy + my);
        self.route();
      });
      function end(ev) {
        var d = self.drag;
        if (!d || d.id !== ev.pointerId || d.i !== i) return;
        self.drag = null;
        try { g.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
        if (!d.moving) return;
        self.justDragged = true;
        setTimeout(function () { self.justDragged = false; }, 400);
        self.root.classList.remove("fw-dragging");
        self.snapRow(i);
        self.route();
      }
      g.addEventListener("pointerup", end);
      g.addEventListener("pointercancel", end);
    });
  };

  FoodWeb.prototype.svgPoint = function (ev) {
    var m = this.svg.getScreenCTM();
    if (!m) return { x: ev.clientX, y: ev.clientY };
    var pt = this.svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    var r = pt.matrixTransform(m.inverse());
    return { x: r.x, y: r.y };
  };

  FoodWeb.prototype.placeCard = function (i, dx, dy) {
    var c = this.cards[i];
    dx = Math.max(-c.x0 + 2, Math.min(this.W - c.w - 2 - c.x0, dx));
    dy = Math.max(-c.y0 + HEAD_LEN + 4, Math.min(this.H - c.h - 2 - c.y0, dy));
    c.dx = dx; c.dy = dy;
    c.mv.setAttribute("transform", "translate(" + f1(dx) + " " + f1(dy) + ")");
    this.moved = true;
  };

  FoodWeb.prototype.snapRow = function (i) {
    var c = this.cards[i], y = c.y0 + c.dy, best = null;
    this.rowYs.forEach(function (ry) {
      if (best === null || Math.abs(ry - y) < Math.abs(best - y)) best = ry;
    });
    if (best !== null) this.placeCard(i, c.dx, best - c.y0);
  };

  FoodWeb.prototype.keyMove = function (i, key, big) {
    var c = this.cards[i], step = big ? 40 : 10;
    if (key === "ArrowLeft") this.placeCard(i, c.dx - step, c.dy);
    else if (key === "ArrowRight") this.placeCard(i, c.dx + step, c.dy);
    else {
      var y = c.y0 + c.dy, rows = this.rowYs, k = rows.indexOf(y);
      if (k < 0) k = 0;
      k += key === "ArrowUp" ? -1 : 1;
      if (k >= 0 && k < rows.length) this.placeCard(i, c.dx, rows[k] - c.y0);
    }
    this.route();
  };

  FoodWeb.prototype.resetLayout = function () {
    var self = this;
    this.cards.forEach(function (c) {
      c.dx = 0; c.dy = 0;
      c.mv.removeAttribute("transform");
    });
    this.edgeInfo.forEach(function (e) {
      e.line.setAttribute("d", e.d0);
      e.halo.setAttribute("d", e.d0);
      e.head.setAttribute("d", e.h0);
      e.g.classList.toggle("fw-odd", e.odd0);
    });
    this.moved = false;
    if (this.mode === "trace") this.drawChain();
    void self;
  };

  /* ---------- saving a layout ----------
     Writes the rows (as a levels block) and where each picture is (as a
     positions block) so a good layout can be pasted into the page. */

  FoodWeb.prototype.layoutText = function () {
    var names = this.cfg.organisms || [];
    var origin = this.cfg.xOrigin || 0;
    var rows = {};
    this.cards.forEach(function (c, i) {
      var y = Math.round(c.y0 + c.dy);
      (rows[y] = rows[y] || []).push({ i: i, x: c.x0 + c.dx + c.w / 2 - origin });
    });
    var ys = Object.keys(rows).map(Number).sort(function (a, b) { return a - b; });
    var out = ["   .. levels::", ""];
    var pos = ["   .. positions::", ""];
    ys.forEach(function (y) {
      var row = rows[y].sort(function (a, b) { return a.x - b.x; });
      out.push("      " + row.map(function (r) { return names[r.i]; }).join(", "));
      row.forEach(function (r) { pos.push("      " + names[r.i] + ": " + Math.round(r.x)); });
    });
    return out.concat([""], pos).join("\n") + "\n";
  };

  FoodWeb.prototype.copyLayout = function () {
    var box = this.layoutBox, ta = box.querySelector(".fw-layout-text");
    var msg = box.querySelector(".fw-layout-msg");
    ta.value = this.layoutText();
    box.hidden = false;
    ta.focus();
    ta.select();
    msg.textContent = "";
    var done = function () { msg.textContent = "Copied."; };
    var fallback = function () {
      try { msg.textContent = document.execCommand("copy") ? "Copied." : "Select the text and copy it."; }
      catch (e) { msg.textContent = "Select the text and copy it."; }
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(ta.value).then(done, fallback);
    } else {
      fallback();
    }
  };

  FoodWeb.prototype.box = function (i) {
    var c = this.cards[i];
    return { x: c.x0 + c.dx, y: c.y0 + c.dy, w: c.w, h: c.h };
  };

  function hitsBox(x0, y0, x1, y1, b) {
    // Line from (x0,y0) up to (x1,y1), y0 > y1.
    var top = b.y - CLEAR, bot = b.y + b.h + CLEAR;
    if (!(y1 < bot && y0 > top)) return false;
    var ya = Math.min(bot, y0), yb = Math.max(top, y1);
    var xa = x0 + (x1 - x0) * (y0 - ya) / (y0 - y1);
    var xb = x0 + (x1 - x0) * (y0 - yb) / (y0 - y1);
    var lo = Math.min(xa, xb), hi = Math.max(xa, xb);
    return hi > b.x - CLEAR && lo < b.x + b.w + CLEAR;
  }

  function vcurve(x1, y1, x2, y2) {
    var k = (y1 - y2) * 0.5;
    return "C " + f1(x1) + " " + f1(y1 - k) + " " + f1(x2) + " " + f1(y2 + k) + " " + f1(x2) + " " + f1(y2);
  }

  function headAt(x, y, ux, uy) {
    // Tip at (x, y), pointing along the unit vector (ux, uy).
    var bx = x - ux * HEAD_LEN, by = y - uy * HEAD_LEN;
    var px = -uy * HEAD_HALF, py = ux * HEAD_HALF;
    return "M " + f1(x) + " " + f1(y) + " L " + f1(bx + px) + " " + f1(by + py) +
      " L " + f1(bx - px) + " " + f1(by - py) + " Z";
  }

  FoodWeb.prototype.route = function () {
    var self = this, n = this.cards.length;
    var boxes = [];
    for (var i = 0; i < n; i++) boxes.push(this.box(i));
    var outs = {}, ins = {};
    var upward = this.edgeInfo.map(function (e) {
      var A = boxes[e.a], B = boxes[e.b];
      return B.y + B.h < A.y - 2;
    });
    this.edgeInfo.forEach(function (e, k) {
      if (!upward[k]) return;
      (outs[e.a] = outs[e.a] || []).push(k);
      (ins[e.b] = ins[e.b] || []).push(k);
    });
    var port = {};
    function spread(v, list, side, other) {
      var B = boxes[v], m = list.length;
      list.sort(function (p, q) {
        var op = boxes[self.edgeInfo[p][other]], oq = boxes[self.edgeInfo[q][other]];
        return (op.x + op.w / 2) - (oq.x + oq.w / 2) || p - q;
      });
      var span = Math.min(B.w * 0.72, (m - 1) * 15);
      list.forEach(function (k, j) {
        var off = m === 1 ? 0 : -span / 2 + span * j / (m - 1);
        port[k + side] = B.x + B.w / 2 + off;
      });
    }
    Object.keys(outs).forEach(function (v) { spread(+v, outs[v], "o", "b"); });
    Object.keys(ins).forEach(function (v) { spread(+v, ins[v], "i", "a"); });

    var laneUse = {};
    this.edgeInfo.forEach(function (e, k) {
      var A = boxes[e.a], B = boxes[e.b], d, head;
      if (!upward[k]) {
        // Not above: a straight line between the facing sides.
        var ax = A.x + A.w / 2, ay = A.y + A.h / 2, bx = B.x + B.w / 2, by = B.y + B.h / 2;
        var sx, sy, tx, ty;
        if (by > A.y + A.h) { sx = ax; sy = A.y + A.h; tx = bx; ty = B.y; }
        else if (bx >= ax) { sx = A.x + A.w; sy = ay; tx = B.x; ty = by; }
        else { sx = A.x; sy = ay; tx = B.x + B.w; ty = by; }
        var L = Math.hypot(tx - sx, ty - sy) || 1, ux = (tx - sx) / L, uy = (ty - sy) / L;
        tx -= ux * HEAD_GAP; ty -= uy * HEAD_GAP;
        d = "M " + f1(sx) + " " + f1(sy) + " L " + f1(tx - ux * (HEAD_LEN - 1)) + " " + f1(ty - uy * (HEAD_LEN - 1));
        head = headAt(tx, ty, ux, uy);
        e.g.classList.add("fw-odd");
      } else {
        e.g.classList.remove("fw-odd");
        var x0 = port[k + "o"], y0 = A.y, x1 = port[k + "i"], tip = B.y + B.h + HEAD_GAP;
        var obstacles = [];
        for (var v = 0; v < n; v++) {
          if (v === e.a || v === e.b) continue;
          var o = boxes[v];
          if (o.y + o.h + CLEAR > tip && o.y - CLEAR < y0) obstacles.push(o);
        }
        var clear = function (sx, sy, tx, ty) {
          for (var j = 0; j < obstacles.length; j++) {
            if (hitsBox(sx, sy, tx, ty, obstacles[j])) return false;
          }
          return true;
        };
        if (clear(x0, y0, x1, tip)) {
          var L2 = Math.hypot(x1 - x0, tip - y0) || 1, vx = (x1 - x0) / L2, vy = (tip - y0) / L2;
          d = "M " + f1(x0) + " " + f1(y0) + " L " + f1(x1 - vx * (HEAD_LEN - 1)) + " " + f1(tip - vy * (HEAD_LEN - 1));
          head = headAt(x1, tip, vx, vy);
        } else {
          // Bands of pictures in the way, lowest first.
          var sorted = obstacles.slice().sort(function (p, q) { return (q.y + q.h) - (p.y + p.h); });
          var bands = [];
          sorted.forEach(function (o) {
            var last = bands[bands.length - 1];
            if (last && o.y + o.h + CLEAR > last.top - CLEAR) {
              last.top = Math.min(last.top, o.y);
              last.bot = Math.max(last.bot, o.y + o.h);
              last.items.push(o);
            } else {
              bands.push({ top: o.y, bot: o.y + o.h, items: [o] });
            }
          });
          var parts = ["M " + f1(x0) + " " + f1(y0)];
          var cx = x0, cy = y0;
          bands.forEach(function (band, bi) {
            if (band.bot <= tip || band.top >= cy) return;
            // Free gaps across this band.
            var blocks = band.items.map(function (o) { return [o.x - CLEAR - 3, o.x + o.w + CLEAR + 3]; })
              .sort(function (p, q) { return p[0] - q[0]; });
            var gaps = [], at = 4;
            blocks.forEach(function (bl) {
              if (bl[0] > at) gaps.push([at, bl[0]]);
              at = Math.max(at, bl[1]);
            });
            if (self.W - 4 > at) gaps.push([at, self.W - 4]);
            if (!gaps.length) return;
            var midY = (band.top + band.bot) / 2;
            var want = cx + (x1 - cx) * (cy - midY) / (cy - tip);
            var best = null, bestGap = 0;
            gaps.forEach(function (gp, gi) {
              var x = Math.max(gp[0], Math.min(gp[1], want));
              if (best === null || Math.abs(x - want) < Math.abs(best - want)) { best = x; bestGap = gi; }
            });
            var key = bi + ":" + Math.round(gaps[bestGap][0]);
            var used = laneUse[key] = (laneUse[key] || 0) + 1;
            var gp2 = gaps[bestGap];
            var shift = (used - 1) * 9 * (used % 2 ? 1 : -1);
            var x = Math.max(gp2[0], Math.min(gp2[1], best + shift));
            parts.push(vcurve(cx, cy, x, band.bot));
            parts.push("L " + f1(x) + " " + f1(band.top));
            cx = x; cy = band.top;
          });
          parts.push(vcurve(cx, cy, x1, tip + HEAD_LEN - 1));
          d = parts.join(" ");
          head = headAt(x1, tip, 0, -1);
        }
      }
      e.line.setAttribute("d", d);
      e.halo.setAttribute("d", d);
      e.head.setAttribute("d", head);
    });
    if (this.mode === "trace" && this.chain.length) this.drawChain();
  };



  /* ---------- clues: what each organism eats ---------- */

  FoodWeb.prototype.eatsText = function (i) {
    var t = (this.cfg.clueText || [])[i];
    if (t) return t;
    return this.food[i].length ? listText(this.names_(this.food[i])) : "";
  };

  FoodWeb.prototype.clueLine = function (i) {
    var name = "<strong>" + esc(this.names[i]) + "</strong>" + this.zoomBtn(i);
    if (this.clues === "selected" || this.clues === "both") {
      var t = this.eatsText(i);
      return t ? name + ' <span class="fw-k-in">eats</span> ' + esc(t) + "."
        : name + " makes its own food from sunlight: it is a <strong>producer</strong>.";
    }
    return name + " picked up.";
  };

  FoodWeb.prototype.showClueTable = function () {
    var on = this.mode === "place" && (this.clues === "table" || this.clues === "both");
    var panel = this.cluePanel;
    panel.hidden = !on;
    if (!on || panel.dataset.built) return;
    var self = this;
    var order = this.names.map(function (_n, i) { return i; }).sort(function (a, b) {
      return self.names[a].localeCompare(self.names[b]);
    });
    var html = '<div class="fw-clues-title">What each organism eats</div><div class="fw-clues-grid">';
    order.forEach(function (i) {
      var href = self.picSrc(i);
      var t = self.eatsText(i);
      html += '<div class="fw-clue">' +
        (href ? '<span class="fw-thumb"><img src="' + esc(href) + '" alt="" loading="lazy">' +
          self.zoomBtn(i) + '</span>' : "") +
        '<div><strong>' + esc(self.names[i]) + "</strong><br>" +
        (t ? '<span class="fw-k-in">eats</span> ' + esc(t)
          : '<em>makes its own food (producer)</em>') + "</div></div>";
    });
    panel.innerHTML = html + "</div>";
    panel.dataset.built = "1";
  };

  /* ---------- place the pictures ----------
     The web is shown as empty boxes joined by arrows. The pictures start
     in a tray under the web and are dragged (or tapped) into the boxes.
     The tray is part of the same SVG, so it prints with the web. */

  function svgEl(tag, cls) {
    var e = document.createElementNS(SVGNS, tag);
    if (cls) e.setAttribute("class", cls);
    return e;
  }

  function shuffled(list) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  FoodWeb.prototype.initPlace = function () {
    var self = this, n = this.cards.length;
    this.H0 = this.H;
    var cw = this.cards[0].w, chh = this.cards[0].h, gx = 14;
    var cols = Math.max(1, Math.floor((this.W - 24 + gx) / (cw + gx)));
    var nGiven = (this.cfg.given || []).length;
    var rows = Math.max(1, Math.ceil((n - nGiven) / cols));
    this.trayTop = this.H0 + 6;
    this.trayInfoH = 108;                // two lines of 32px info text at the top of the tray
    this.dropSlot = -1;
    this.trayH = this.trayInfoH + 12 + rows * (chh + gx) + 6;

    // Organisms that eat the same things and are eaten by the same things
    // can swap boxes and still be right.
    var key = [];
    for (var i = 0; i < n; i++) {
      key.push(this.food[i].slice().sort().join(",") + "|" + this.eaters[i].slice().sort().join(","));
    }
    this.sameAs = function (a, b) { return a === b || key[a] === key[b]; };

    this.given = {};
    (this.cfg.given || []).forEach(function (g) { self.given[g] = true; });

    // Tray
    var tray = svgEl("g", "fw-tray");
    var bg = svgEl("rect", "fw-tray-bg");
    bg.setAttribute("x", 6); bg.setAttribute("y", this.trayTop);
    bg.setAttribute("width", this.W - 12); bg.setAttribute("height", this.trayH - 6);
    bg.setAttribute("rx", 10);
    tray.appendChild(bg);
    // The info line (clues, Check results) goes here in Place mode, right
    // above the pictures students tap.
    var fo = svgEl("foreignObject", "fw-trayinfo");
    fo.setAttribute("x", 16); fo.setAttribute("y", this.trayTop + 8);
    fo.setAttribute("width", this.W - 32); fo.setAttribute("height", this.trayInfoH);
    var host = document.createElementNS("http://www.w3.org/1999/xhtml", "div");
    host.setAttribute("class", "fw-trayinfo-host");
    fo.appendChild(host);
    tray.appendChild(fo);
    this.trayInfoHost = host;
    this.trayEl = tray;
    this.trayBg = bg;
    this.trayGeom = { cols: cols, cw: cw, chh: chh, gx: gx };
    this.trayPos = {};

    this.spots = [];
    var free = [];
    for (i = 0; i < n; i++) if (!this.given[i]) free.push(i);
    var m = free.length;
    for (var k = 0; k < m; k++) {
      var r = Math.floor(k / cols), c = k % cols;
      var inRow = r < Math.floor(m / cols) ? cols : (m - cols * r);
      var rowW = inRow * cw + (inRow - 1) * gx;
      this.spots.push({ x: (this.W - rowW) / 2 + c * (cw + gx), y: this.trayTop + this.trayInfoH + 14 + r * (chh + gx) });
    }

    // Pieces: a copy of each picture card that can be moved about.
    this.pieces = [];
    var layer = svgEl("g", "fw-pieces");
    this.cards.forEach(function (card, i) {
      var g = svgEl("g", "fw-piece" + (self.given[i] ? " fw-given" : ""));
      g.setAttribute("data-i", i);
      g.setAttribute("tabindex", self.given[i] ? "-1" : "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", self.names[i]);
      Array.prototype.forEach.call(card.mv.children, function (ch) {
        g.appendChild(ch.cloneNode(true));
      });
      layer.appendChild(g);
      self.pieces.push({ g: g, x0: card.x0, y0: card.y0, slot: -1, spot: -1 });
    });
    this.pieceLayer = layer;
    var cardsGroup = this.svg.querySelector(".fw-cards");
    cardsGroup.parentNode.insertBefore(tray, cardsGroup.nextSibling);
    tray.parentNode.insertBefore(layer, tray.nextSibling);

    this.slotHas = [];
    for (i = 0; i < n; i++) this.slotHas.push(-1);
    this.spotOrder = shuffled(free);
    this.resetPlace(true);

    // Dragging pieces
    this.pieces.forEach(function (pc, i) {
      var g = pc.g;
      g.addEventListener("pointerdown", function (ev) {
        if (ev.button !== 0 || self.given[i]) return;
        ev.stopPropagation();
        var p = self.svgPoint(ev), pos = self.piecePos(i);
        self.pdrag = { i: i, id: ev.pointerId, px: p.x, py: p.y, x: pos.x, y: pos.y, moving: false };
        try { g.setPointerCapture(ev.pointerId); } catch (e) { /* old browsers */ }
      });
      g.addEventListener("pointermove", function (ev) {
        var d = self.pdrag;
        if (!d || d.id !== ev.pointerId || d.i !== i) return;
        var p = self.svgPoint(ev);
        if (!d.moving) {
          if (Math.abs(p.x - d.px) + Math.abs(p.y - d.py) < 5) return;
          d.moving = true;
          if (self.clues === "selected" || self.clues === "both") self.info.innerHTML = self.clueLine(i);
          g.classList.add("fw-lifted");
          layer.appendChild(g);
          // Moving it in the page drops the pointer capture, so take it again.
          try { g.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
          self.clearPlaceMarks();
        }
        self.movePiece(i, d.x + p.x - d.px, d.y + p.y - d.py);
        self.dropTarget(self.slotAt(d.x + p.x - d.px + cw / 2, d.y + p.y - d.py + chh / 2));
      });
      function end(ev) {
        var d = self.pdrag;
        if (!d || d.id !== ev.pointerId || d.i !== i) return;
        self.pdrag = null;
        self.dropTarget(-1);
        try { g.releasePointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
        if (!d.moving) { self.pieceTap(i); return; }
        g.classList.remove("fw-lifted");
        var p = self.svgPoint(ev);
        var cx = d.x + p.x - d.px + cw / 2, cy = d.y + p.y - d.py + chh / 2;
        var s = self.slotAt(cx, cy);
        if (s >= 0) self.putInSlot(i, s);
        else if (cy > self.trayTop) self.putInTray(i);
        self.layoutPieces();
        self.updatePlaceInfo();
      }
      g.addEventListener("pointerup", end);
      g.addEventListener("pointercancel", end);
      g.addEventListener("keydown", function (ev) {
        if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); self.pieceTap(i); }
      });
      g.addEventListener("mouseenter", function () {
        if (self.mode !== "place" || self.pdrag) return;
        // A picture is tapped and this one sits in a box: tapping here would
        // swap them, so light up that box's arrows.
        if (self.picked != null) {
          if (self.picked !== i && self.pieces[i].slot >= 0) self.dropTarget(self.pieces[i].slot);
          return;
        }
        if (self.clues === "selected" || self.clues === "both") self.info.innerHTML = self.clueLine(i);
      });
      g.addEventListener("mouseleave", function () {
        if (self.mode !== "place" || self.pdrag) return;
        if (self.picked != null) { self.dropTarget(-1); return; }
        if (self.clues === "selected" || self.clues === "both") self.updatePlaceInfo();
      });
    });
    this.svg.addEventListener("click", function (ev) {
      if (self.mode !== "place" || self.picked == null) return;
      if (ev.target.closest && ev.target.closest(".fw-piece")) return;
      var p = self.svgPoint(ev);
      if (p.y > self.trayTop) {
        self.putInTray(self.picked);
        self.unpick();
        self.layoutPieces();
        self.updatePlaceInfo();
      }
    });
  };

  FoodWeb.prototype.applyHeight = function (h) {
    this.svg.setAttribute("viewBox", "0 0 " + this.W + " " + h);
    this.svg.setAttribute("height", h);
    this.H = h;
  };

  /* The tray is only as tall as the pictures still in it need: the
     pictures left are closed up into full rows and the tray (and the
     whole board) shrinks as pictures are placed, and grows again if one
     is put back. */
  FoodWeb.prototype.layoutTray = function () {
    var self = this, t = this.trayGeom, left = [];
    this.spotOrder.forEach(function (i) { if (self.pieces[i].slot < 0) left.push(i); });
    var m = left.length, rows = Math.ceil(m / t.cols);
    this.trayPos = {};
    left.forEach(function (i, k) {
      var r = Math.floor(k / t.cols), c = k % t.cols;
      var inRow = r < Math.floor(m / t.cols) ? t.cols : (m - t.cols * r);
      var rowW = inRow * t.cw + (inRow - 1) * t.gx;
      self.trayPos[i] = {
        x: (self.W - rowW) / 2 + c * (t.cw + t.gx),
        y: self.trayTop + self.trayInfoH + 14 + r * (t.chh + t.gx)
      };
    });
    var h = this.trayInfoH + 12 + rows * (t.chh + t.gx) + 6;
    if (h === this.trayH) return;
    this.trayH = h;
    this.trayBg.setAttribute("height", h - 6);
    if (this.mode === "place" && this.trayEl.style.display !== "none") this.applyHeight(this.H0 + h);
  };

  FoodWeb.prototype.setTrayShown = function (on) {
    this.applyHeight(on ? this.H0 + this.trayH : this.H0);
    this.trayEl.style.display = on ? "" : "none";
    this.pieceLayer.style.display = on ? "" : "none";
    if (on) this.trayInfoHost.appendChild(this.info);
    else if (this.info.parentNode !== this.root) this.root.appendChild(this.info);
  };

  // While a picture is dragged over a box, light up that box's arrows:
  // green for arrows coming in (its food), orange for arrows going out
  // (what eats it). s = -1 clears the highlight.
  FoodWeb.prototype.dropTarget = function (s) {
    if (s === this.dropSlot) return;
    this.dropSlot = s;
    this.root.classList.toggle("fw-dropping", s >= 0);
    this.edges.forEach(function (e) {
      e.classList.toggle("fw-drop-in", s >= 0 && +e.getAttribute("data-b") === s);
      e.classList.toggle("fw-drop-out", s >= 0 && +e.getAttribute("data-a") === s);
    });
    this.nodes.forEach(function (g, k) { g.classList.toggle("fw-droptarget", k === s); });
  };

  FoodWeb.prototype.slotAt = function (x, y) {
    var best = -1, bd = Infinity;
    for (var s = 0; s < this.cards.length; s++) {
      var b = this.box(s);
      var dx = Math.abs(x - (b.x + b.w / 2)), dy = Math.abs(y - (b.y + b.h / 2));
      if (dx < b.w * 0.75 && dy < b.h * 0.75 && dx + dy < bd) { bd = dx + dy; best = s; }
    }
    return best;
  };

  FoodWeb.prototype.piecePos = function (i) {
    var pc = this.pieces[i];
    if (pc.slot >= 0) { var b = this.box(pc.slot); return { x: b.x, y: b.y }; }
    var sp = this.trayPos[i] || this.spots[pc.spot];
    return { x: sp.x, y: sp.y };
  };

  FoodWeb.prototype.movePiece = function (i, x, y) {
    var pc = this.pieces[i];
    pc.g.style.transform = "translate(" + f1(x - pc.x0) + "px, " + f1(y - pc.y0) + "px)";
  };

  FoodWeb.prototype.layoutPieces = function () {
    this.layoutTray();
    for (var i = 0; i < this.pieces.length; i++) {
      var p = this.piecePos(i);
      this.movePiece(i, p.x, p.y);
    }
  };

  FoodWeb.prototype.putInTray = function (i) {
    var pc = this.pieces[i];
    if (pc.slot >= 0) this.slotHas[pc.slot] = -1;
    pc.slot = -1;
  };

  FoodWeb.prototype.putInSlot = function (i, s) {
    var pc = this.pieces[i], j = this.slotHas[s];
    if (j === i) return;
    if (j >= 0 && this.given[j]) return;            // a given picture stays put
    var from = pc.slot;
    if (from >= 0) this.slotHas[from] = -1;
    this.slotHas[s] = i;
    pc.slot = s;
    if (j >= 0) {                                     // swap the one that was there
      if (from >= 0) { this.slotHas[from] = j; this.pieces[j].slot = from; }
      else { this.pieces[j].slot = -1; }
    }
    this.clearPlaceMarks();
  };

  FoodWeb.prototype.unpick = function () {
    if (this.picked != null) this.pieces[this.picked].g.classList.remove("fw-picked");
    this.picked = null;
    this.dropTarget(-1);
  };

  FoodWeb.prototype.pieceTap = function (i) {
    if (this.given[i]) return;
    var picked = this.picked;
    if (picked === i) { this.unpick(); return; }
    if (picked != null && this.pieces[i].slot >= 0) {
      this.putInSlot(picked, this.pieces[i].slot);
      this.unpick();
      this.layoutPieces();
      this.updatePlaceInfo();
      return;
    }
    this.unpick();
    this.picked = i;
    this.pieces[i].g.classList.add("fw-picked");
    this.info.innerHTML = this.clueLine(i) + " Now tap a box.";
  };

  FoodWeb.prototype.slotTap = function (s) {
    if (this.picked == null) return;
    this.putInSlot(this.picked, s);
    this.unpick();
    this.layoutPieces();
    this.updatePlaceInfo();
  };

  FoodWeb.prototype.clearPlaceMarks = function () {
    this.pieces.forEach(function (pc) { pc.g.classList.remove("fw-right", "fw-wrong"); });
    this.root.classList.remove("fw-allright");
  };

  FoodWeb.prototype.placeCounts = function () {
    var filled = 0, total = 0;
    for (var s = 0; s < this.slotHas.length; s++) {
      if (this.given[s]) continue;
      total++;
      if (this.slotHas[s] >= 0) filled++;
    }
    return { filled: filled, total: total };
  };

  FoodWeb.prototype.updatePlaceInfo = function () {
    if (this.mode !== "place") return;
    var c = this.placeCounts();
    this.info.innerHTML = c.filled === 0 ? this.idleText()
      : c.filled + " of " + c.total + " boxes filled." +
        (c.filled === c.total ? " Press <strong>Check</strong>." : "");
  };

  FoodWeb.prototype.checkPlace = function () {
    var self = this, right = 0, wrong = 0, c = this.placeCounts();
    this.unpick();
    this.slotHas.forEach(function (i, s) {
      if (i < 0 || self.given[s]) return;
      var ok = self.sameAs(i, s);
      self.pieces[i].g.classList.add(ok ? "fw-right" : "fw-wrong");
      if (ok) right++; else wrong++;
    });
    if (right === c.total) {
      this.root.classList.add("fw-allright");
      this.info.innerHTML = '<span class="fw-k-good">All correct!</span> Every organism is in the right place.';
      this.announceComplete("check");
    } else {
      this.info.innerHTML = '<span class="fw-k-good">' + right + " right</span>" +
        (wrong ? ', <span class="fw-k-wrong">' + wrong + " wrong</span>" : "") +
        (c.total - c.filled ? ", " + (c.total - c.filled) + " still in the tray" : "") +
        ". Look at the arrows going in and out of each box.";
    }
  };

  /* Tells an enclosing activitygroup that this activity is finished, so it
     can unlock its questions. how = "check" (all right) or "answer" (shown). */
  FoodWeb.prototype.announceComplete = function (how) {
    try {
      this.root.dispatchEvent(new CustomEvent("activitygroup:complete",
        { bubbles: true, detail: { how: how, activity: "foodweb" } }));
    } catch (e) { /* very old browsers: nothing to unlock */ }
  };

  FoodWeb.prototype.showAnswer = function () {
    var self = this;
    this.announceComplete("answer");
    this.unpick();
    // Keep pictures that are already right (or an equal swap); fill the rest.
    var placed = {};
    this.slotHas.forEach(function (i, s) {
      if (i >= 0 && self.sameAs(i, s)) placed[i] = s;
    });
    this.pieces.forEach(function (pc, i) {
      if (!(i in placed)) pc.slot = -1;
    });
    for (var s = 0; s < this.slotHas.length; s++) this.slotHas[s] = -1;
    Object.keys(placed).forEach(function (i) { self.slotHas[placed[i]] = +i; self.pieces[i].slot = placed[i]; });
    this.pieces.forEach(function (pc, i) {
      if (pc.slot >= 0) return;
      for (var s = 0; s < self.slotHas.length; s++) {
        if (self.slotHas[s] < 0 && self.sameAs(i, s)) { self.slotHas[s] = i; pc.slot = s; break; }
      }
    });
    this.layoutPieces();
    this.clearPlaceMarks();
    this.checkPlace();
    this.info.innerHTML = "Here is the answer. Press <strong>Start again</strong> to try it yourself.";
  };

  FoodWeb.prototype.resetPlace = function (first) {
    var self = this;
    this.unpick && this.picked != null && this.unpick();
    for (var s = 0; s < this.slotHas.length; s++) this.slotHas[s] = -1;
    if (!first) this.spotOrder = shuffled(this.spotOrder);
    this.spotOrder.forEach(function (i, k) { self.pieces[i].spot = k; self.pieces[i].slot = -1; });
    Object.keys(this.given).forEach(function (g) {
      g = +g;
      self.pieces[g].slot = g;
      self.slotHas[g] = g;
    });
    this.clearPlaceMarks();
    this.layoutPieces();
    if (!first) this.info.innerHTML = this.idleText();
  };

  /* ---------- full screen ---------- */

  FoodWeb.prototype.toggleFullscreen = function () {
    var r = this.root, doc = document;
    if (doc.fullscreenElement === r || doc.webkitFullscreenElement === r) {
      (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
    } else if (r.requestFullscreen) {
      r.requestFullscreen();
    } else if (r.webkitRequestFullscreen) {
      r.webkitRequestFullscreen();
    }
  };

  /* ---------- print ----------
     A copy of this web (as it looks now) printed on its own, with the rest
     of the page taken out of the layout so there are no blank pages. */

  FoodWeb.prototype.print = function () {
    var self = this;
    this.cleanupPrint();
    var host = this.root.cloneNode(true);
    host.removeAttribute("id");
    host.classList.add("fw-print-host");
    host.classList.remove("fw-focus", "fw-tracing", "fw-hinting");
    document.body.appendChild(host);
    document.documentElement.classList.add("fw-printing");
    this.printHost = host;
    function cleanup() {
      window.removeEventListener("afterprint", cleanup);
      self.cleanupPrint();
    }
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  FoodWeb.prototype.cleanupPrint = function () {
    document.documentElement.classList.remove("fw-printing");
    if (this.printHost && this.printHost.parentNode) this.printHost.parentNode.removeChild(this.printHost);
    this.printHost = null;
  };

  function initAll() {
    Array.prototype.forEach.call(document.querySelectorAll(".foodweb"), function (r) {
      if (r.dataset.fwReady || r.classList.contains("fw-print-host")) return;
      r.dataset.fwReady = "1";
      try { new FoodWeb(r); } catch (e) { if (window.console) console.error("foodweb:", e); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initAll);
  else initAll();
})();
