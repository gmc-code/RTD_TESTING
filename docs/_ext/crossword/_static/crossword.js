/* crossword.js — interactive, printable crosswords for the Sphinx `crossword` directive.
 *
 * The grid is laid out here in the browser from a seed: everyone starts with the
 * same puzzle, and "New" redraws a different pattern (and, when the directive
 * uses :words:, a different selection from the word list).
 */
(function () {
  "use strict";

  const ACROSS = "across", DOWN = "down";
  const other = (d) => (d === ACROSS ? DOWN : ACROSS);
  const key = (r, c) => r + "," + c;

  /* ====================================================================== */
  /* Helpers                                                                 */
  /* ====================================================================== */

  function decode(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder("utf-8").decode(bytes));
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* Small seeded random number generator (mulberry32). */
  function seededRandom(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(a, rand) {
    rand = rand || Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function storeGet(k) {
    try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; }
  }
  function storeSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ }
  }
  function storeDel(k) {
    try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
  }

  /* ====================================================================== */
  /* Layout generator (free-form grid, no black squares)                      */
  /* ====================================================================== */

  const STEP = { a: [0, 1], d: [1, 0] };

  class Grid {
    constructor() {
      this.cells = new Map();   // "r,c" -> letter
      this.dirs = new Map();    // "r,c" -> "a" | "d" | "ad"
      this.placed = [];         // {idx, r, c, d}
      this.crossings = 0;
      this.r0 = this.c0 = this.r1 = this.c1 = 0;
    }

    fits(word, r, c, d) {
      const [dr, dc] = STEP[d], n = word.length;
      if (this.cells.has(key(r - dr, c - dc)) || this.cells.has(key(r + dr * n, c + dc * n))) return -1;
      let crosses = 0;
      for (let i = 0; i < n; i++) {
        const pr = r + dr * i, pc = c + dc * i, k = key(pr, pc);
        const here = this.cells.get(k);
        if (here !== undefined) {
          if (here !== word[i] || this.dirs.get(k).includes(d)) return -1;
          crosses++;
        } else if (this.cells.has(key(pr + dc, pc + dr)) || this.cells.has(key(pr - dc, pc - dr))) {
          return -1;  // would sit side by side with another word
        }
      }
      return crosses;
    }

    place(idx, word, r, c, d, crosses) {
      const [dr, dc] = STEP[d];
      if (!this.placed.length) { this.r0 = this.r1 = r; this.c0 = this.c1 = c; }
      for (let i = 0; i < word.length; i++) {
        const pr = r + dr * i, pc = c + dc * i, k = key(pr, pc);
        this.cells.set(k, word[i]);
        this.dirs.set(k, (this.dirs.get(k) || "") + d);
        this.r0 = Math.min(this.r0, pr); this.r1 = Math.max(this.r1, pr);
        this.c0 = Math.min(this.c0, pc); this.c1 = Math.max(this.c1, pc);
      }
      this.placed.push({ idx, r, c, d });
      this.crossings += crosses;
    }

    *candidates(word) {
      const seen = new Set();
      for (const [k, letter] of this.cells) {
        const [pr, pc] = k.split(",").map(Number);
        for (let i = 0; i < word.length; i++) {
          if (word[i] !== letter) continue;
          for (const d of ["a", "d"]) {
            if (this.dirs.get(k).includes(d)) continue;
            const [dr, dc] = STEP[d];
            const r = pr - dr * i, c = pc - dc * i, sk = r + "," + c + d;
            if (seen.has(sk)) continue;
            seen.add(sk);
            const crosses = this.fits(word, r, c, d);
            if (crosses > 0) yield [r, c, d, crosses];
          }
        }
      }
    }
  }

  function attempt(words, order, rand) {
    const g = new Grid();
    g.place(order[0], words[order[0]], 0, 0, rand() < 0.5 ? "a" : "d", 0);
    let pending = order.slice(1), progress = true;
    while (pending.length && progress) {
      progress = false;
      for (const idx of pending.slice()) {
        const word = words[idx];
        let best = null, bestScore = -Infinity;
        for (const [r, c, d, crosses] of g.candidates(word)) {
          const [dr, dc] = STEP[d];
          const er = r + dr * (word.length - 1), ec = c + dc * (word.length - 1);
          const h = Math.max(g.r1, er) - Math.min(g.r0, r) + 1;
          const w = Math.max(g.c1, ec) - Math.min(g.c0, c) + 1;
          const score = crosses * 8 - h * w * 0.15 - Math.abs(h - w) * 1.5 + rand();
          if (score > bestScore) { best = [r, c, d, crosses]; bestScore = score; }
        }
        if (best) {
          g.place(idx, word, ...best);
          pending.splice(pending.indexOf(idx), 1);
          progress = true;
        }
      }
    }
    return g;
  }

  function generate(words, rand, attempts) {
    let best = null, bestKey = null;
    for (let n = 0; n < attempts; n++) {
      const order = words.map((_, i) => i);
      const jitter = order.map(() => rand() * 6);
      order.sort((a, b) => (words[b].length + jitter[b]) - (words[a].length + jitter[a]));
      const g = attempt(words, order, rand);
      const h = g.r1 - g.r0 + 1, w = g.c1 - g.c0 + 1;
      const k = [g.placed.length, g.crossings * 3 - h * w * 0.1 - Math.abs(h - w) * 2];
      if (!bestKey || k[0] > bestKey[0] || (k[0] === bestKey[0] && k[1] > bestKey[1])) {
        best = g; bestKey = k;
      }
    }
    return best;
  }

  /* Choose `pick` entries (0 = all), lay them out, and swap in spare words for
     any that won't link. Returns {rows, cols, words:[...]} with clue numbers. */
  function buildLayout(entries, pick, seed) {
    const rand = seededRandom(seed);
    const pool = shuffle(entries.map((_, i) => i), rand);
    const n = pick && pick < entries.length ? pick : entries.length;
    let chosen = pool.slice(0, n);
    const spare = pool.slice(n);
    const attempts = Math.max(40, Math.min(150, Math.round(3000 / n)));
    let best = null;
    for (let round = 0; round < 6; round++) {
      const g = generate(chosen.map((i) => entries[i].answer), rand, attempts);
      if (!best || g.placed.length > best.g.placed.length) best = { g, chosen: chosen.slice() };
      if (g.placed.length === chosen.length || !spare.length) break;
      const placed = new Set(g.placed.map((p) => p.idx));
      chosen = chosen.map((e, i) => (placed.has(i) || !spare.length ? e : spare.shift()));
    }

    const { g } = best;
    const starts = [...new Set(g.placed.map((p) => key(p.r - g.r0, p.c - g.c0)))]
      .map((k) => k.split(",").map(Number))
      .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const number = new Map(starts.map((p, i) => [key(p[0], p[1]), i + 1]));
    const words = g.placed.map((p) => {
      const e = entries[best.chosen[p.idx]];
      const r = p.r - g.r0, c = p.c - g.c0;
      return Object.assign({}, e, { n: number.get(key(r, c)), dir: p.d === "a" ? ACROSS : DOWN, r, c });
    });
    words.sort((a, b) => (a.dir !== b.dir ? (a.dir === ACROSS ? -1 : 1) : a.n - b.n));
    return { rows: g.r1 - g.r0 + 1, cols: g.c1 - g.c0 + 1, words };
  }

  const THEMES = [
    ["classic", "Light"], ["dark", "Dark"], ["auto", "Auto"],
    ["ocean", "Ocean"], ["forest", "Forest"], ["sunset", "Sunset"],
    ["contrast", "High contrast"],
  ];

  /* ====================================================================== */
  /* The puzzle                                                              */
  /* ====================================================================== */

  class Crossword {
    constructor(root) {
      this.root = root;
      this.data = decode(root.dataset.xw);
      const base = location.pathname + ":" + root.id + ":" + this.data.key;
      this.storeKey = "crossword:" + base;
      this.settingsKey = "crossword-settings:" + base;
      this.settings = this.loadSettings();

      const state = this.data.save ? storeGet(this.storeKey) : null;
      const usable = state && typeof state.seed === "number" && state.pick === this.pickCount();
      this.setup(usable ? state.seed : this.data.seed);
      if (!(usable && this.restore(state))) this.pickHints(this.settings.hints);
      this.updateStatus();

      window.addEventListener("resize", () => this.resize());
      document.addEventListener("click", (e) => {
        if (!e.target.closest || !this.root.contains(e.target) || !e.target.closest(".xw-menu-wrap")) this.closeMenus();
      });
    }

    pickCount() {
      const total = this.data.entries.length;
      const n = this.settings.words || this.data.pick || 0;
      return n && n < total ? n : 0;
    }

    /* Lay out a puzzle for `seed` and draw it. */
    setup(seed) {
      this.seed = seed;
      this.layout = buildLayout(this.data.entries, this.pickCount(), seed);
      this.dir = ACROSS;
      this.active = null;
      this.buildModel();
      this.render();
      this.applySettings();
    }

    newPuzzle() {
      this.setup(Math.floor(Math.random() * 2147483647));
      this.pickHints(this.settings.hints);
      this.save();
      this.updateStatus();
    }

    /* ---------- model ---------- */
    buildModel() {
      this.cells = new Map();
      this.words = this.layout.words.map((w, i) => Object.assign({ idx: i, cells: [] }, w));
      for (const w of this.words) {
        const [dr, dc] = w.dir === ACROSS ? [0, 1] : [1, 0];
        for (let i = 0; i < w.answer.length; i++) {
          const r = w.r + dr * i, c = w.c + dc * i, k = key(r, c);
          let cell = this.cells.get(k);
          if (!cell) {
            cell = { k, r, c, sol: w.answer[i], num: null, words: {}, hint: false };
            this.cells.set(k, cell);
          }
          cell.words[w.dir] = w;
          w.cells.push(cell);
        }
        w.cells[0].num = w.n;
      }
    }

    /* ---------- settings ---------- */
    hintTarget() {
      const h = this.data.hints || {};
      if (h.percent) return Math.round((this.cells.size * h.percent) / 100);
      return h.count || 0;
    }

    maxHints() {
      return Math.floor(this.cells.size / 2);  // never more than half the squares
    }

    loadSettings() {
      const s = {
        scale: this.data.letterScale || 100, hints: null, border: !!this.data.border,
        words: 0, theme: this.data.theme || "classic", fill: !!this.data.fill,
      };
      const saved = storeGet(this.settingsKey);
      if (saved) Object.assign(s, saved);
      return s;
    }

    saveSettings() {
      storeSet(this.settingsKey, this.settings);
    }

    hintCount() {
      const n = this.settings.hints === null || this.settings.hints === undefined ? this.hintTarget() : this.settings.hints;
      return Math.min(n, this.maxHints());
    }

    applySettings() {
      const s = this.settings;
      this.root.classList.toggle("xw-bordered", !!s.border);
      this.applyTheme();
      if (this.ui) {
        this.ui.theme.value = s.theme;
        this.ui.scale.value = s.scale;
        this.ui.scaleOut.textContent = s.scale + "%";
        this.ui.hints.value = this.hintCount();
        this.ui.border.checked = !!s.border;
        this.ui.fill.checked = !!s.fill;
        this.ui.scale.disabled = !!s.fill;
        if (this.ui.words) this.ui.words.value = this.pickCount() || this.data.entries.length;
      }
      this.resize();
    }

    applyTheme() {
      const theme = THEMES.some((t) => t[0] === this.settings.theme) ? this.settings.theme : "classic";
      THEMES.forEach(([name]) => this.root.classList.remove("xw-theme-" + name));
      this.root.classList.add("xw-theme-" + theme);
      this.root.classList.toggle("xw-themed", theme !== "classic");
    }

    /* ---------- DOM ---------- */
    render() {
      const d = this.data, L = this.layout, root = this.root;
      const settingsOpen = this.settingsPanel && !this.settingsPanel.hidden;
      root.innerHTML = "";

      const ph = el("div", "xw-print-header");
      ["Name", "Class", "Date"].forEach((label) => {
        const s = el("span", "xw-field");
        s.append(el("span", "", label + ":"), el("span", "xw-line"));
        ph.append(s);
      });
      root.append(ph);
      if (d.title) root.append(el("div", "xw-title", d.title));

      root.append(this.renderToolbar());
      root.append(this.renderSettings());
      if (settingsOpen) this.toggleSettings(true);

      const body = el("div", "xw-body");
      const board = el("div", "xw-board");

      this.current = el("div", "xw-current");
      this.current.setAttribute("aria-live", "polite");
      board.append(this.current);

      const scroller = el("div", "xw-grid-wrap");
      const grid = el("div", "xw-grid");
      grid.style.gridTemplateColumns = "repeat(" + L.cols + ", calc(var(--xw-cell) - var(--xw-border)))";
      grid.style.gridTemplateRows = "repeat(" + L.rows + ", calc(var(--xw-cell) - var(--xw-border)))";
      grid.setAttribute("role", "grid");
      for (let r = 0; r < L.rows; r++) {
        for (let c = 0; c < L.cols; c++) {
          const cell = this.cells.get(key(r, c));
          if (!cell) { grid.append(el("div", "xw-empty")); continue; }
          const box = el("div", "xw-cell");
          if (cell.words[ACROSS] && cell.words[DOWN]) box.classList.add("xw-cross");
          if (cell.num) box.append(el("span", "xw-num", String(cell.num)));
          const input = el("input", "xw-input");
          input.type = "text";
          input.maxLength = 2;
          input.autocomplete = "off";
          input.spellcheck = false;
          input.setAttribute("autocapitalize", "characters");
          input.setAttribute("aria-label", this.ariaLabel(cell));
          box.append(input, el("span", "xw-sol", cell.sol));
          cell.box = box;
          cell.input = input;
          this.wireCell(cell);
          grid.append(box);
        }
      }
      scroller.append(grid);
      board.append(scroller);

      this.status = el("div", "xw-status");
      this.status.setAttribute("aria-live", "polite");
      board.append(this.status);
      body.append(board);

      const clues = el("div", "xw-clues");
      for (const dir of [ACROSS, DOWN]) {
        const list = this.words.filter((w) => w.dir === dir);
        if (!list.length) continue;
        const group = el("div", "xw-clue-group");
        group.append(el("h4", "xw-clue-heading", dir === ACROSS ? "Across" : "Down"));
        const ul = el("ul", "xw-clue-list");
        for (const w of list) {
          const li = el("li", "xw-clue");
          const bodyEl = el("span", "xw-clue-body");
          bodyEl.append(el("span", "xw-clue-text", w.clue));
          if (d.lengths) bodyEl.append(el("span", "xw-enum", " (" + w.enum + ")"));
          li.append(el("span", "xw-clue-num", String(w.n)), bodyEl);
          li.addEventListener("click", () => this.focusWord(w));
          w.li = li;
          ul.append(li);
        }
        group.append(ul);
        clues.append(group);
      }
      this.cluesEl = clues;
      body.append(clues);
      root.append(body);

      if (d.wordbank) {
        const bank = el("div", "xw-wordbank");
        bank.append(el("div", "xw-wordbank-title", "Word bank"));
        const ul = el("ul");
        [...this.words]
          .sort((a, b) => a.label.localeCompare(b.label))
          .forEach((w) => { w.bankEl = el("li", "", w.label); ul.append(w.bankEl); });
        bank.append(ul);
        root.append(bank);
      }
    }

    renderToolbar() {
      const bar = el("div", "xw-toolbar");
      const button = (label, title, fn, extra) => {
        const b = el("button", "xw-btn" + (extra ? " " + extra : ""), label);
        b.type = "button";
        b.title = title;
        if (fn) b.addEventListener("click", fn);
        return b;
      };
      const menu = (label, title, items, extra, main) => {
        const wrap = el("div", "xw-menu-wrap" + (main ? " xw-split" : ""));
        if (main) wrap.append(button(main[0], main[1], main[2], "xw-split-main" + (extra ? " " + extra : "")));
        const b = button(main ? "▾" : label + " ▾", title, null, (main ? "xw-split-arrow" : "") + (extra ? " " + extra : ""));
        b.setAttribute("aria-haspopup", "true");
        b.setAttribute("aria-expanded", "false");
        const list = el("div", "xw-menu");
        list.hidden = true;
        list.setAttribute("role", "menu");
        for (const [text, hint, fn] of items) {
          const item = button(text, hint, () => { this.closeMenus(); fn(); }, "xw-menu-item");
          item.setAttribute("role", "menuitem");
          list.append(item);
        }
        b.addEventListener("click", () => {
          const open = list.hidden;
          this.closeMenus();
          list.hidden = !open;
          b.setAttribute("aria-expanded", String(open));
          if (open) list.querySelector("button").focus();
        });
        list.addEventListener("keydown", (e) => { if (e.key === "Escape") { this.closeMenus(); b.focus(); } });
        wrap.append(b, list);
        return wrap;
      };

      bar.append(
        button("✓ Check", "Mark letters that are wrong", () => this.check()),
        menu("Reveal", "More reveal options", [
          ["Reveal word", "Show the selected word", () => this.reveal("word")],
          ["Reveal whole puzzle", "Show the full solution", () => this.reveal("all")],
        ], "", ["💡 Reveal letter", "Show the selected letter (or press ? in a square)", () => this.reveal("letter")]),
        button("Clear", "Remove all your answers", () => this.clear())
      );

      const pool = this.data.entries.length, used = this.words.length;
      const fresh = button("↻ New", used < pool
        ? "New puzzle: different words and a new pattern"
        : "New puzzle: same words in a new pattern", () => this.confirmNew(fresh));
      bar.append(fresh);

      const spacer = el("span", "xw-spacer");
      bar.append(spacer,
        menu("🖨 Print", "Print this crossword", [
          ["Blank copy", "Print a copy for students to fill in", () => this.print(false)],
          ["Answer key", "Print the solution", () => this.print(true)],
        ], "xw-btn-quiet"));

      const gear = button("⚙", "Settings: letter size, hints, words, border", () => this.toggleSettings(), "xw-btn-quiet xw-btn-icon");
      gear.setAttribute("aria-label", "Settings");
      gear.setAttribute("aria-expanded", "false");
      this.gear = gear;
      bar.append(gear);
      return bar;
    }

    /* Ask once before throwing away work: the button turns into "Sure?" for a few seconds. */
    confirmNew(btn) {
      const typed = [...this.cells.values()].some((c) => c.input.value && !c.hint);
      if (!typed || btn.classList.contains("xw-btn-confirm")) { this.newPuzzle(); return; }
      btn.classList.add("xw-btn-confirm");
      const label = btn.textContent;
      btn.textContent = "Sure? Click again";
      setTimeout(() => {
        if (btn.isConnected) { btn.classList.remove("xw-btn-confirm"); btn.textContent = label; }
      }, 3000);
    }

    closeMenus() {
      this.root.querySelectorAll(".xw-menu").forEach((m) => { m.hidden = true; });
      this.root.querySelectorAll("[aria-haspopup]").forEach((b) => b.setAttribute("aria-expanded", "false"));
    }

    renderSettings() {
      const panel = el("div", "xw-settings");
      panel.hidden = true;
      const ui = {};

      // letter size
      const sizeRow = el("label", "xw-set-row");
      sizeRow.append(el("span", "xw-set-label", "Letter size"));
      ui.scale = el("input");
      ui.scale.type = "range";
      ui.scale.min = 70; ui.scale.max = 170; ui.scale.step = 10;
      ui.scaleOut = el("span", "xw-set-value");
      ui.scale.addEventListener("input", () => {
        this.settings.scale = +ui.scale.value;
        ui.scaleOut.textContent = ui.scale.value + "%";
        this.resize();
        this.saveSettings();
      });
      sizeRow.append(ui.scale, ui.scaleOut);

      const fillRow = el("label", "xw-set-row");
      ui.fill = el("input");
      ui.fill.type = "checkbox";
      ui.fill.addEventListener("change", () => {
        this.settings.fill = ui.fill.checked;
        ui.scale.disabled = ui.fill.checked;
        this.saveSettings();
        this.resize();
      });
      fillRow.append(el("span", "xw-set-label", "Fill width"), ui.fill);

      // hint letters
      const hintRow = el("div", "xw-set-row");
      const hl = el("label", "xw-set-label", "Hint letters");
      ui.hints = el("input", "xw-set-number");
      ui.hints.type = "number";
      ui.hints.min = 0;
      ui.hints.max = this.maxHints();
      ui.hints.id = this.root.id + "-hints";
      hl.htmlFor = ui.hints.id;
      const applyHints = () => {
        let n = parseInt(ui.hints.value, 10);
        if (isNaN(n) || n < 0) n = 0;
        n = Math.min(n, this.maxHints());
        ui.hints.value = n;
        this.settings.hints = n;
        this.saveSettings();
        this.pickHints(n);
        this.save();
        this.updateStatus();
      };
      ui.hints.addEventListener("change", applyHints);
      const again = el("button", "xw-btn xw-btn-small", "New hints");
      again.type = "button";
      again.title = "Show a different set of hint letters";
      again.addEventListener("click", applyHints);
      hintRow.append(hl, ui.hints, el("span", "xw-set-note", "of " + this.cells.size), again);

      let wordRow = null;

      // words per puzzle (only useful with a longer list)
      const total = this.data.entries.length;
      if (total > 4) {
        wordRow = el("div", "xw-set-row");
        const wl = el("label", "xw-set-label", "Words");
        ui.words = el("input", "xw-set-number");
        ui.words.type = "number";
        ui.words.min = 2;
        ui.words.max = total;
        ui.words.id = this.root.id + "-words";
        wl.htmlFor = ui.words.id;
        ui.words.addEventListener("change", () => {
          let n = parseInt(ui.words.value, 10);
          if (isNaN(n)) n = total;
          n = Math.max(2, Math.min(total, n));
          this.settings.words = n >= total ? total : n;
          this.saveSettings();
          this.newPuzzle();
        });
        wordRow.append(wl, ui.words, el("span", "xw-set-note", "of " + total));
      }

      // colour theme
      const themeRow = el("label", "xw-set-row");
      ui.theme = el("select", "xw-set-select");
      THEMES.forEach(([value, label]) => {
        const o = el("option", "", label);
        o.value = value;
        ui.theme.append(o);
      });
      ui.theme.addEventListener("change", () => {
        this.settings.theme = ui.theme.value;
        this.applyTheme();
        this.saveSettings();
        this.resize();
      });
      themeRow.append(el("span", "xw-set-label", "Theme"), ui.theme);

      // border
      const borderRow = el("label", "xw-set-row");
      ui.border = el("input");
      ui.border.type = "checkbox";
      ui.border.addEventListener("change", () => {
        this.settings.border = ui.border.checked;
        this.root.classList.toggle("xw-bordered", ui.border.checked);
        this.saveSettings();
        this.resize();
      });
      borderRow.append(el("span", "xw-set-label", "Border"), ui.border);

      const reset = el("button", "xw-btn xw-btn-small", "Reset settings");
      reset.type = "button";
      reset.addEventListener("click", () => {
        const before = this.pickCount();
        storeDel(this.settingsKey);
        this.settings = this.loadSettings();
        if (this.pickCount() !== before) { this.newPuzzle(); return; }
        this.applySettings();
        this.pickHints(this.hintCount());
        this.save();
        this.updateStatus();
      });

      // Two rows: how it looks, then what's in the puzzle.
      const line1 = el("div", "xw-set-line");
      line1.append(sizeRow, fillRow, themeRow, borderRow);
      const line2 = el("div", "xw-set-line");
      line2.append(hintRow);
      if (wordRow) line2.append(wordRow);
      line2.append(el("span", "xw-spacer"), reset);
      panel.append(line1, line2);
      this.ui = ui;
      this.settingsPanel = panel;
      return panel;
    }

    toggleSettings(force) {
      const open = force === undefined ? this.settingsPanel.hidden : force;
      this.settingsPanel.hidden = !open;
      this.gear.setAttribute("aria-expanded", String(open));
      this.gear.classList.toggle("xw-btn-on", open);
    }

    ariaLabel(cell) {
      const parts = [];
      for (const dir of [ACROSS, DOWN]) {
        const w = cell.words[dir];
        if (w) parts.push(w.n + " " + dir + ", letter " + (w.cells.indexOf(cell) + 1) + " of " + w.cells.length);
      }
      return parts.join("; ");
    }

    /* Squares and lines are sized in whole pixels so every grid line comes
       out the same thickness (browsers round border widths). */
    resize() {
      const L = this.layout;
      const want = parseFloat(getComputedStyle(this.root).getPropertyValue("--xw-line-width")) || 2;
      const line = Math.max(1, Math.round(want));
      const fill = !!this.settings.fill;
      this.root.classList.toggle("xw-fill", fill);
      const cs = getComputedStyle(this.root);
      const inner = (this.root.clientWidth || 600) - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      let cell;
      if (fill) {
        // Fill the width of the page: squares grow until the grid spans it.
        cell = Math.max(16, Math.min(110, Math.floor((inner - line - 2) / L.cols) + line));
      } else {
        const avail = Math.min(inner, 640);
        const fit = Math.max(22, Math.min(40, Math.floor((avail - 6) / L.cols)));
        cell = Math.max(16, Math.round((fit * (this.settings.scale || 100)) / 100));
      }
      // At 125% / 150% zoom, make the square-to-square step a whole number of
      // screen pixels so every line lands on the same pixel pattern.
      const dprNow = window.devicePixelRatio || 1;
      let m = 1;
      while (m < 8 && Math.abs(m * dprNow - Math.round(m * dprNow)) > 0.01) m++;
      cell = line + Math.max(m, (fill ? Math.floor : Math.round)((cell - line) / m) * m);
      this.root.style.setProperty("--xw-border", line + "px");
      this.root.style.setProperty("--xw-cell", cell + "px");
      // Start the grid on a whole screen pixel so lines aren't blurred.
      const grid = this.root.querySelector(".xw-grid");
      if (grid) {
        const dpr = window.devicePixelRatio || 1;
        grid.style.left = grid.style.top = "0px";
        const r = grid.getBoundingClientRect();
        const fx = (r.left + window.scrollX) * dpr, fy = (r.top + window.scrollY) * dpr;
        grid.style.left = (Math.round(fx) - fx) / dpr + "px";
        grid.style.top = (Math.round(fy) - fy) / dpr + "px";
      }
    }

    /* ---------- hints ---------- */
    setHint(cell, on) {
      cell.hint = on;
      cell.input.readOnly = on;
      cell.box.classList.toggle("xw-hint", on);
      if (on) {
        cell.input.value = cell.sol;
        cell.box.classList.remove("xw-wrong", "xw-right", "xw-revealed");
      }
    }

    clearHints() {
      for (const c of this.cells.values()) {
        if (c.hint) { this.setHint(c, false); c.input.value = ""; }
      }
    }

    /* Spread n hint letters across the words, never filling a whole word. */
    pickHints(n) {
      this.clearHints();
      n = Math.min(n === null || n === undefined ? this.hintCount() : n, this.maxHints());
      if (!n) return;
      const order = shuffle([...this.words]);
      let given = 0, guard = 0;
      while (given < n && guard++ < 50) {
        let progress = false;
        for (const w of order) {
          if (given >= n) break;
          const shown = w.cells.filter((c) => c.hint).length;
          if (shown >= w.cells.length - 1) continue;  // always leave something to solve
          const free = w.cells.filter((c) => !c.hint && !(c.input.value && c.input.value === c.sol));
          if (!free.length) continue;
          this.setHint(free[Math.floor(Math.random() * free.length)], true);
          given++;
          progress = true;
        }
        if (!progress) break;
      }
    }

    /* ---------- events ---------- */
    wireCell(cell) {
      const input = cell.input;
      let wasActive = false;
      input.addEventListener("pointerdown", () => { wasActive = this.active === cell; });
      input.addEventListener("click", () => {
        if (wasActive && cell.words[ACROSS] && cell.words[DOWN]) {
          this.dir = other(this.dir);
          this.setActive(cell);
        }
        wasActive = false;
      });
      input.addEventListener("focus", () => {
        this.setActive(cell);
        setTimeout(() => { if (document.activeElement === input && !cell.hint) input.select(); }, 0);
      });
      input.addEventListener("keydown", (e) => this.onKey(e, cell));
      // Fallback for phone keyboards that don't report letters in keydown.
      input.addEventListener("input", () => {
        if (cell.hint) { input.value = cell.sol; return; }
        const m = input.value.toUpperCase().match(/[A-Z0-9]/g);
        if (m) this.enter(cell, m[m.length - 1]);
        else input.value = "";
      });
    }

    onKey(e, cell) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key;
      if (/^[a-z0-9]$/i.test(k)) {
        e.preventDefault();
        this.enter(cell, k.toUpperCase());
        return;
      }
      const moves = { ArrowLeft: [0, -1, ACROSS], ArrowRight: [0, 1, ACROSS], ArrowUp: [-1, 0, DOWN], ArrowDown: [1, 0, DOWN] };
      if (moves[k]) {
        e.preventDefault();
        const [dr, dc, dir] = moves[k];
        if (this.dir !== dir && cell.words[dir]) {
          this.dir = dir;          // first press just turns to that direction
          this.setActive(cell);
          return;
        }
        const next = this.scan(cell, dr, dc);
        if (next) {
          if (next.words[dir]) this.dir = dir;
          this.focusCell(next);
        }
        return;
      }
      switch (k) {
        case "?":
          e.preventDefault();
          this.reveal("letter");
          break;
        case "Backspace": {
          e.preventDefault();
          if (cell.input.value && !cell.hint) { this.setValue(cell, ""); }
          else {
            const prev = this.step(cell, -1, true);
            if (prev) { this.setValue(prev, ""); this.focusCell(prev); }
          }
          this.save(); this.updateStatus();
          break;
        }
        case "Delete":
          e.preventDefault();
          if (!cell.hint) { this.setValue(cell, ""); this.save(); this.updateStatus(); }
          break;
        case " ":
        case "Enter":
          e.preventDefault();
          if (cell.words[other(this.dir)]) { this.dir = other(this.dir); this.setActive(cell); }
          break;
        case "Tab": {
          e.preventDefault();
          const w = this.currentWord();
          const next = this.words[(w.idx + (e.shiftKey ? -1 : 1) + this.words.length) % this.words.length];
          this.focusWord(next);
          break;
        }
        case "Escape":
          cell.input.blur();
          break;
      }
    }

    /* ---------- navigation ---------- */
    currentWord() {
      return this.active && (this.active.words[this.dir] || this.active.words[other(this.dir)]);
    }

    scan(cell, dr, dc) {
      let r = cell.r + dr, c = cell.c + dc;
      while (r >= 0 && c >= 0 && r < this.layout.rows && c < this.layout.cols) {
        const n = this.cells.get(key(r, c));
        if (n) return n;
        r += dr; c += dc;
      }
      return null;
    }

    /* Next/previous square in the current word; optionally skip hint squares. */
    step(cell, delta, skipHints) {
      const w = cell.words[this.dir] || cell.words[other(this.dir)];
      let i = w.cells.indexOf(cell) + delta;
      while (skipHints && w.cells[i] && w.cells[i].hint) i += delta;
      return w.cells[i] || null;
    }

    focusCell(cell) {
      cell.input.focus({ preventScroll: true });
      this.setActive(cell);
    }

    focusWord(w) {
      this.dir = w.dir;
      const target = w.cells.find((c) => !c.input.value) || w.cells.find((c) => !c.hint) || w.cells[0];
      this.focusCell(target);
    }

    setActive(cell) {
      if (!cell.words[this.dir]) this.dir = other(this.dir);
      this.active = cell;
      const w = cell.words[this.dir];
      for (const c of this.cells.values()) c.box.classList.remove("xw-hl", "xw-active");
      for (const x of this.words) x.li.classList.remove("xw-clue-active", "xw-clue-cross");
      w.cells.forEach((c) => c.box.classList.add("xw-hl"));
      cell.box.classList.add("xw-active");
      w.li.classList.add("xw-clue-active");
      const cross = cell.words[other(this.dir)];
      if (cross) cross.li.classList.add("xw-clue-cross");

      this.current.innerHTML = "";
      this.current.append(
        el("span", "xw-current-label", w.n + " " + (w.dir === ACROSS ? "Across" : "Down")),
        el("span", "xw-current-text", w.clue + (this.data.lengths ? " (" + w.enum + ")" : ""))
      );
      // keep the active clue visible inside the clue panel without scrolling the page
      const box = this.cluesEl, li = w.li;
      if (box.scrollHeight > box.clientHeight) {
        const top = li.offsetTop - box.offsetTop;
        if (top < box.scrollTop || top + li.offsetHeight > box.scrollTop + box.clientHeight) {
          box.scrollTop = top - box.clientHeight / 2;
        }
      }
    }

    /* ---------- entering letters ---------- */
    setValue(cell, v) {
      if (cell.hint) return;
      cell.input.value = v;
      cell.box.classList.remove("xw-wrong", "xw-right");
      if (!v) cell.box.classList.remove("xw-revealed");
    }

    enter(cell, ch) {
      if (cell.hint) {
        // Typing the hint letter just moves on; any other letter goes into
        // the next square the student can fill, so both typing styles work.
        if (ch === cell.sol) {
          const next = this.step(cell, 1, false);
          if (next) this.focusCell(next);
        } else {
          const next = this.step(cell, 1, true);
          if (next) this.enter(next, ch);
        }
        return;
      }
      this.setValue(cell, ch);
      const next = this.step(cell, 1, false);
      if (next) this.focusCell(next);
      else cell.input.select();
      this.save();
      this.updateStatus();
    }

    /* ---------- buttons ---------- */
    check() {
      let wrong = 0, filled = 0;
      for (const c of this.cells.values()) {
        c.box.classList.remove("xw-wrong", "xw-right");
        if (!c.input.value || c.hint) continue;
        filled++;
        if (c.input.value !== c.sol) { c.box.classList.add("xw-wrong"); wrong++; }
        else c.box.classList.add("xw-right");
      }
      if (!filled) this.flash("Type some answers first, then check.");
      else if (wrong) this.flash(wrong + (wrong === 1 ? " letter is" : " letters are") + " wrong — they're marked in red.");
      else this.updateStatus();
    }

    reveal(scope) {
      let targets;
      if (scope === "all") targets = [...this.cells.values()];
      else if (!this.active) { this.flash("Click a square first."); return; }
      else if (scope === "word") targets = this.currentWord().cells;
      else targets = [this.active];
      for (const c of targets) {
        if (!c.hint && c.input.value !== c.sol) {
          this.setValue(c, c.sol);
          c.box.classList.add("xw-revealed");
        }
      }
      this.save();
      this.updateStatus();
      if (scope === "letter") {
        // carry straight on to the next square, as if the letter had been typed
        const next = this.step(this.active, 1, true);
        this.focusCell(next || this.active);
      } else if (scope === "word") {
        this.focusCell(this.active);
      }
    }

    clear() {
      for (const c of this.cells.values()) {
        this.setValue(c, "");
        c.box.classList.remove("xw-revealed");
      }
      this.root.classList.remove("xw-solved");
      this.save();
      this.updateStatus();
    }

    flash(msg) {
      this.status.textContent = msg;
      this.status.classList.add("xw-status-note");
      clearTimeout(this._flashTimer);
      this._flashTimer = setTimeout(() => this.updateStatus(), 4000);
    }

    updateStatus() {
      clearTimeout(this._flashTimer);
      this.status.classList.remove("xw-status-note");
      let done = 0;
      for (const w of this.words) {
        const full = w.cells.every((c) => c.input.value);
        w.li.classList.toggle("xw-clue-filled", full);
        if (w.bankEl) w.bankEl.classList.toggle("xw-used", full && w.cells.every((c) => c.input.value === c.sol));
        if (full) done++;
      }
      const all = [...this.cells.values()];
      const complete = all.every((c) => c.input.value === c.sol);
      const revealed = all.filter((c) => c.box.classList.contains("xw-revealed")).length;
      const toSolve = all.filter((c) => !c.hint).length;
      // Only celebrate if the student solved it themselves.
      this.root.classList.toggle("xw-solved", complete && !revealed);
      if (complete && !revealed) this.status.textContent = "🎉 Solved! Well done.";
      else if (complete && revealed >= toSolve) this.status.textContent = "Answers shown. Press ↻ New for another puzzle.";
      else if (complete) this.status.textContent = "Complete, with " + revealed + (revealed === 1 ? " letter" : " letters") + " revealed.";
      else if (done === this.words.length) this.status.textContent = "Every square is filled, but something isn't right yet — try Check.";
      else this.status.textContent = done + " of " + this.words.length + " words filled in";
    }

    /* ---------- saving progress ---------- */
    save() {
      if (!this.data.save) return;
      const v = {}, h = [];
      for (const [k, c] of this.cells) {
        if (c.hint) { h.push(k); continue; }
        if (c.input.value) v[k] = c.input.value + (c.box.classList.contains("xw-revealed") ? "!" : "");
      }
      storeSet(this.storeKey, { seed: this.seed, pick: this.pickCount(), v, h });
    }

    /* Put back saved letters; returns true if the saved hint letters were used. */
    restore(state) {
      for (const [k, val] of Object.entries(state.v || {})) {
        const c = this.cells.get(k);
        if (!c || typeof val !== "string") continue;
        c.input.value = val[0];
        if (val[1] === "!") c.box.classList.add("xw-revealed");
      }
      if (!Array.isArray(state.h) || state.h.length !== this.hintCount()) return false;
      state.h.forEach((k) => { const c = this.cells.get(k); if (c) this.setHint(c, true); });
      return true;
    }

    /* ---------- printing ---------- */
    print(withAnswers) {
      const d = this.data, L = this.layout;
      document.querySelectorAll(".xw-print-root").forEach((n) => n.remove());
      const holder = el("div", "xw-print-root");
      const copy = this.root.cloneNode(true);
      copy.removeAttribute("id");
      copy.classList.add("xw-print-copy");
      if (withAnswers) copy.classList.add("xw-print-answers");
      THEMES.forEach(([name]) => copy.classList.remove("xw-theme-" + name));
      copy.classList.remove("xw-themed", "xw-solved");
      copy.querySelectorAll("input").forEach((i) => { i.value = ""; i.removeAttribute("value"); });
      copy.querySelectorAll(".xw-wrong,.xw-right,.xw-hl,.xw-active,.xw-revealed")
        .forEach((n) => n.classList.remove("xw-wrong", "xw-right", "xw-hl", "xw-active", "xw-revealed"));
      copy.querySelectorAll(".xw-clue-active,.xw-clue-cross,.xw-clue-filled,.xw-used")
        .forEach((n) => n.classList.remove("xw-clue-active", "xw-clue-cross", "xw-clue-filled", "xw-used"));
      // fit an A4 page: about 180mm wide, leave ~130mm height for the grid
      const fit = Math.min(180 / L.cols, 130 / L.rows);
      const mm = Math.max(5, Math.min(10 * (this.settings.scale / 100), fit));
      copy.style.setProperty("--xw-cell", (Math.floor(mm * 10) / 10) + "mm");
      copy.style.setProperty("--xw-border", "0.35mm");
      if (withAnswers && d.title) copy.querySelector(".xw-title").textContent = d.title + " — answers";
      holder.append(copy);
      document.body.append(holder);
      document.body.classList.add("xw-printing");
      const done = () => {
        document.body.classList.remove("xw-printing");
        holder.remove();
        window.removeEventListener("afterprint", done);
      };
      window.addEventListener("afterprint", done);
      window.print();
    }
  }

  function init() {
    document.querySelectorAll(".crossword[data-xw]").forEach((root) => {
      if (root.dataset.xwReady) return;
      root.dataset.xwReady = "1";
      try { new Crossword(root); }
      catch (err) { root.textContent = "Crossword failed to load: " + err.message; }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
