/* circuit directive - build series and parallel circuits on a grid with a
   12 V powerpack, ohmic resistors, globes, switches, ammeters and voltmeters.

   The board is a grid of points.  Every component (and every piece of wire)
   sits on one edge between two neighbouring points.  Edges are stored by key:
     "h:c:r"  the edge from point (c, r) to (c + 1, r)
     "v:c:r"  the edge from point (c, r) to (c, r + 1)

   The circuit is solved every time it changes:
     1. wires, ammeters and closed switches have no resistance, so the points
        they join are merged into one "supernode";
     2. the voltages of the supernodes are found by nodal analysis using the
        resistors, globes and voltmeters (a voltmeter is a 10 M-ohm resistor);
     3. the current in each wire / ammeter is found by sharing the currents
        that enter and leave each supernode along its wires. */
(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";

  // drawing sizes, in SVG user units
  const CELL = 96;
  const MARGIN_LEFT = 84, MARGIN_RIGHT = 84, MARGIN_TOP = 46, MARGIN_BOTTOM = 46;
  const DEFAULT_COLS = 7, DEFAULT_ROWS = 5;

  const VOLTMETER_R = 1e7;
  const FLOWING = 1e-4;           // amps: less than this is "no current"

  const TOOL_NAMES = {
    wire: "Wire", resistor: "Resistor", globe: "Globe", ammeter: "Ammeter",
    voltmeter: "Voltmeter", "switch": "Switch", erase: "Erase",
  };
  const WIRE_COLOURS = ["black", "red", "blue"];
  const WIRE_COLOUR_NAMES = { black: "Black", red: "Red", blue: "Blue" };
  const PREFIX = { resistor: "R", globe: "L", ammeter: "A", voltmeter: "V", "switch": "S" };
  const PLURAL = {
    resistor: "resistors", globe: "globes", ammeter: "ammeters",
    voltmeter: "voltmeters", "switch": "switches",
  };

  /* ---------- small helpers ---------- */

  function svgEl(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const key in attrs) node.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function htmlEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function eKey(o, c, r) { return o + ":" + c + ":" + r; }

  function parseKey(key) {
    const parts = key.split(":");
    return { o: parts[0], c: +parts[1], r: +parts[2] };
  }

  // the two grid points of an edge, as point numbers
  function endsOf(key, cols) {
    const e = parseKey(key);
    const a = e.r * cols + e.c;
    return { a: a, b: e.o === "h" ? a + 1 : a + cols };
  }

  function isIdeal(el) {
    return el.kind === "wire" || el.kind === "ammeter" || (el.kind === "switch" && !el.open);
  }

  function resistanceOf(el) {
    if (el.kind === "resistor" || el.kind === "globe") return el.r;
    if (el.kind === "voltmeter") return VOLTMETER_R;
    return null;
  }

  function isLoad(el) { return el.kind === "resistor" || el.kind === "globe"; }

  /* ---------- solving ---------- */

  // Gaussian elimination with partial pivoting; A is changed.
  function gauss(A, b) {
    const n = b.length;
    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(A[row][col]) > Math.abs(A[pivot][col])) pivot = row;
      }
      if (Math.abs(A[pivot][col]) < 1e-14) continue;
      if (pivot !== col) {
        const t = A[pivot]; A[pivot] = A[col]; A[col] = t;
        const u = b[pivot]; b[pivot] = b[col]; b[col] = u;
      }
      for (let row = col + 1; row < n; row++) {
        const factor = A[row][col] / A[col][col];
        if (!factor) continue;
        for (let k = col; k < n; k++) A[row][k] -= factor * A[col][k];
        b[row] -= factor * b[col];
      }
    }
    const x = new Array(n).fill(0);
    for (let row = n - 1; row >= 0; row--) {
      if (Math.abs(A[row][row]) < 1e-14) continue;
      let sum = b[row];
      for (let k = row + 1; k < n; k++) sum -= A[row][k] * x[k];
      x[row] = sum / A[row][row];
    }
    return x;
  }

  /* -> { short, supply, values: { key: { v, i } } }
     v = voltage of end a minus end b;  i = current from end a to end b. */
  function solve(cols, rows, edges, voltage) {
    const n = cols * rows;
    const parent = [];
    for (let i = 0; i < n; i++) parent.push(i);
    function find(x) {
      while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
      return x;
    }

    const result = { short: false, supply: 0, values: {} };
    const list = [];
    let pack = null;
    Object.keys(edges).forEach(key => {
      const ends = endsOf(key, cols);
      const item = { key: key, el: edges[key], a: ends.a, b: ends.b };
      if (item.el.kind === "pack") pack = item;
      else { list.push(item); result.values[key] = { v: 0, i: 0 }; }
    });
    if (!pack) return result;

    const ideal = list.filter(item => isIdeal(item.el));
    ideal.forEach(item => { parent[find(item.a)] = find(item.b); });

    const P = find(pack.a), M = find(pack.b);
    if (P === M) { result.short = true; return result; }

    // resistive parts that are not bypassed by a wire
    const res = list.filter(item => resistanceOf(item.el) !== null && find(item.a) !== find(item.b));

    // supernodes joined to the powerpack through resistive parts
    const next = {};
    res.forEach(item => {
      const sa = find(item.a), sb = find(item.b);
      (next[sa] = next[sa] || []).push(sb);
      (next[sb] = next[sb] || []).push(sa);
    });
    const volts = {};
    volts[P] = voltage; volts[M] = 0;
    const index = {};
    const unknown = [];
    const queue = [P, M];
    while (queue.length) {
      const s = queue.pop();
      (next[s] || []).forEach(t => {
        if (t in volts || t in index) return;
        index[t] = unknown.length; unknown.push(t); queue.push(t);
      });
    }

    const size = unknown.length;
    const G = [];
    for (let i = 0; i < size; i++) G.push(new Array(size).fill(0));
    const rhs = new Array(size).fill(0);
    const live = res.filter(item => (find(item.a) in index) || (find(item.a) in volts));
    live.forEach(item => {
      const g = 1 / resistanceOf(item.el);
      const sa = find(item.a), sb = find(item.b);
      [[sa, sb], [sb, sa]].forEach(pair => {
        if (!(pair[0] in index)) return;
        const row = index[pair[0]];
        G[row][row] += g;
        if (pair[1] in index) G[row][index[pair[1]]] -= g;
        else rhs[row] += g * volts[pair[1]];
      });
    });
    const x = gauss(G, rhs);
    unknown.forEach((s, i) => { volts[s] = x[i]; });

    const inject = new Array(n).fill(0);      // current arriving at each point
    let supply = 0;
    live.forEach(item => {
      const v = volts[find(item.a)] - volts[find(item.b)];
      const i = v / resistanceOf(item.el);
      result.values[item.key] = { v: v, i: i };
      inject[item.a] -= i;
      inject[item.b] += i;
      if (find(item.a) === P) supply += i;
      if (find(item.b) === P) supply -= i;
    });
    result.supply = supply;
    inject[pack.a] += supply;
    inject[pack.b] -= supply;

    // currents in the wires, ammeters and closed switches: every one is
    // treated as the same tiny resistance, so current shares between them
    if (ideal.length) {
      const where = {};
      const points = [];
      ideal.forEach(item => {
        [item.a, item.b].forEach(p => {
          if (p in where || find(p) === p) return;      // the root is the 0 reference
          where[p] = points.length; points.push(p);
        });
      });
      const m = points.length;
      const L = [];
      for (let i = 0; i < m; i++) L.push(new Array(m).fill(0));
      const b = points.map(p => inject[p]);
      ideal.forEach(item => {
        [[item.a, item.b], [item.b, item.a]].forEach(pair => {
          if (!(pair[0] in where)) return;
          const row = where[pair[0]];
          L[row][row] += 1;
          if (pair[1] in where) L[row][where[pair[1]]] -= 1;
        });
      });
      const phi = gauss(L, b);
      const potential = p => (p in where ? phi[where[p]] : 0);
      ideal.forEach(item => {
        result.values[item.key] = { v: 0, i: potential(item.a) - potential(item.b) };
      });
    }
    return result;
  }

  /* ---------- automatic layout of a set circuit ---------- */

  /* preset = { items: [ {type: "series", comps: [...]},
                         {type: "parallel", branches: [[...], [...]]} ],
                supplyVm: label or null }
     -> { edges, cols, rows }.  The powerpack is on the left, series
     components run along the top, and the branches of a parallel section are
     stacked under one another.  A voltmeter sits in the row above the
     component it is across.  opts.spaced leaves a free row above every
     branch so that students have room to add their own voltmeters. */
  function layoutPreset(preset, opts) {
    const edges = {};
    const lockWires = !!opts.lockWires;

    function wire(o, c, r) {
      const key = eKey(o, c, r);
      if (!edges[key]) edges[key] = { kind: "wire", locked: lockWires };
    }

    function element(comp) {
      const el = { kind: comp.kind, label: comp.label || "", locked: true };
      if (comp.kind === "resistor") el.r = comp.r;
      if (comp.kind === "globe") el.r = comp.r || opts.globeR;
      if (comp.hidden) el.hidden = true;
      if (comp.kind === "switch") el.open = !!comp.open;
      return el;
    }

    function place(c, r, comp) {
      if (!comp || comp.kind === "wire") { wire("h", c, r); return; }
      edges[eKey("h", c, r)] = element(comp);
      if (comp.vm) {
        edges[eKey("h", c, r - 1)] = { kind: "voltmeter", label: comp.vm, locked: true };
        wire("v", c, r - 1);
        wire("v", c + 1, r - 1);
      }
    }

    const hasVm = comps => comps.some(comp => comp.vm);
    const x0 = preset.supplyVm ? 1 : 0;
    const topVm = preset.items.some(item =>
      item.type === "series" ? hasVm(item.comps) : hasVm(item.branches[0]));
    const top = (topVm || opts.spaced) ? 1 : 0;

    let c = x0;
    let lowest = top;
    preset.items.forEach(item => {
      if (item.type === "series") {
        item.comps.forEach(comp => { place(c, top, comp); c++; });
        return;
      }
      const width = Math.max.apply(null, item.branches.map(branch => branch.length));
      let r = top;
      item.branches.forEach((branch, i) => {
        if (i > 0) r += (hasVm(branch) || opts.spaced) ? 2 : 1;
        for (let j = 0; j < width; j++) place(c + j, r, branch[j]);
      });
      for (let k = top; k < r; k++) { wire("v", c, k); wire("v", c + width, k); }
      c += width;
      lowest = Math.max(lowest, r);
    });
    while (c - x0 < 2) { wire("h", c, top); c++; }

    const bottom = Math.max(lowest + 1, top + 2);
    for (let k = top; k < bottom; k++) wire("v", c, k);
    for (let k = x0; k < c; k++) wire("h", k, bottom);
    edges[eKey("v", x0, top)] = { kind: "pack", locked: true };
    for (let k = top + 1; k < bottom; k++) wire("v", x0, k);
    if (preset.supplyVm) {
      edges[eKey("v", 0, top)] = { kind: "voltmeter", label: preset.supplyVm, locked: true };
      wire("h", 0, top);
      wire("h", 0, top + 1);
    }
    return { edges: edges, cols: c + 1, rows: bottom + 1 };
  }

  // ":colour-wires:" - the wires joined to the + terminal of the powerpack
  // (through other wires, ammeters and switches) are made red
  function colourPositive(layout) {
    const cols = layout.cols, edges = layout.edges;
    const parent = [];
    for (let i = 0; i < cols * layout.rows; i++) parent.push(i);
    function find(x) {
      while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
      return x;
    }
    let plus = null;
    Object.keys(edges).forEach(key => {
      const kind = edges[key].kind;
      const ends = endsOf(key, cols);
      if (kind === "pack") plus = ends.a;
      if (kind === "wire" || kind === "ammeter" || kind === "switch") parent[find(ends.a)] = find(ends.b);
    });
    if (plus === null) return layout;
    Object.keys(edges).forEach(key => {
      const el = edges[key];
      const ends = endsOf(key, cols);
      const positive = point => find(point) === find(plus);
      if (el.kind === "wire") {
        if (positive(ends.a)) el.colour = "red";
      } else if (el.kind === "pack") {
        el.leadA = "red";
      } else {
        // the lead on the + side of a component is red as well
        if (positive(ends.a)) el.leadA = "red";
        if (positive(ends.b)) el.leadB = "red";
      }
    });
    return layout;
  }

  // a circuit that satisfies a ":build:" task, for "Show answer"
  function answerPreset(build, config) {
    const counts = build.counts;
    const number = {};
    const label = kind => PREFIX[kind] + (number[kind] = (number[kind] || 0) + 1);

    const loads = [];
    for (let i = 0; i < (counts.resistor || 0); i++) {
      loads.push({ kind: "resistor", r: config.resistors[i % config.resistors.length], label: label("resistor") });
    }
    for (let i = 0; i < (counts.globe || 0); i++) loads.push({ kind: "globe", label: label("globe") });
    if (!loads.length) loads.push({ kind: "globe", label: label("globe") });

    const lead = [];
    for (let i = 0; i < (counts.ammeter || 0); i++) lead.push({ kind: "ammeter", label: label("ammeter") });
    for (let i = 0; i < (counts["switch"] || 0); i++) lead.push({ kind: "switch", open: false, label: label("switch") });

    let supplyVm = null;
    let voltmeters = counts.voltmeter || 0;
    loads.forEach(load => {
      if (voltmeters > 0) { load.vm = label("voltmeter"); voltmeters--; }
    });
    if (voltmeters > 0) supplyVm = label("voltmeter");

    const items = [];
    if (build.topology === "parallel" && loads.length >= 2) {
      if (lead.length) items.push({ type: "series", comps: lead });
      items.push({ type: "parallel", branches: loads.map(load => [load]) });
    } else {
      items.push({ type: "series", comps: lead.concat(loads) });
    }
    return { items: items, supplyVm: supplyVm };
  }

  /* ---------- drawing one symbol ----------
     Drawn along the x axis, centred on (0, 0), from x = -48 to x = 48. */
  function drawSymbol(g, el, upright) {
    const HALF = CELL / 2;
    function line(x1, y1, x2, y2, cls) {
      return svgEl("line", { x1: x1, y1: y1, x2: x2, y2: y2, "class": cls || "circuit-wire" }, g);
    }
    // the two leads of a component can be coloured like the wire they join
    function leads(half) {
      line(-HALF, 0, -half, 0, "circuit-wire circuit-wire-" + (el.leadA || "black"));
      line(half, 0, HALF, 0, "circuit-wire circuit-wire-" + (el.leadB || "black"));
    }
    // text stays the right way up on a vertical edge
    function text(x, y, cls, content) {
      const node = svgEl("text", { x: 0, y: 0, "class": cls,
        transform: "translate(" + x + " " + y + ")" + (upright ? " rotate(-90)" : "") }, g);
      node.textContent = content;
      return node;
    }

    switch (el.kind) {
      case "wire":
        line(-HALF, 0, HALF, 0, "circuit-wire circuit-wire-" + (el.colour || "black"));
        break;
      case "resistor":
        leads(24);
        svgEl("rect", { x: -24, y: -9, width: 48, height: 18, "class": "circuit-resistor" }, g);
        break;
      case "globe":
        leads(15);
        if (el.glow > 0.02) {
          svgEl("circle", { cx: 0, cy: 0, r: 15 + 12 * el.glow, "class": "circuit-halo",
            opacity: (0.55 * el.glow).toFixed(3) }, g);
        }
        svgEl("circle", { cx: 0, cy: 0, r: 15, "class": "circuit-globe" }, g);
        if (el.glow > 0.02) {
          svgEl("circle", { cx: 0, cy: 0, r: 15, "class": "circuit-globe-lit",
            opacity: Math.min(1, 0.15 + 0.85 * el.glow).toFixed(3) }, g);
        }
        line(-10.6, -10.6, 10.6, 10.6, "circuit-globe-cross");
        line(-10.6, 10.6, 10.6, -10.6, "circuit-globe-cross");
        break;
      case "ammeter":
      case "voltmeter":
        leads(16);
        svgEl("circle", { cx: 0, cy: 0, r: 16, "class": "circuit-meter circuit-" + el.kind }, g);
        text(0, 0, "circuit-meter-letter circuit-" + el.kind + "-text", el.kind === "ammeter" ? "A" : "V");
        break;
      case "switch":
        leads(16);
        if (el.open) line(-16, 0, 13, -15, "circuit-switch-arm");
        else line(-16, 0, 16, 0, "circuit-switch-arm");
        svgEl("circle", { cx: -16, cy: 0, r: 3.5, "class": "circuit-switch-dot" }, g);
        svgEl("circle", { cx: 16, cy: 0, r: 3.5, "class": "circuit-switch-dot" }, g);
        break;
      case "pack":
        leads(30);
        svgEl("rect", { x: -30, y: -20, width: 60, height: 40, rx: 5, "class": "circuit-pack" }, g);
        text(0, 0, "circuit-pack-text", el.text || "");
        text(-40, -12, "circuit-pack-sign circuit-pack-plus", "+");
        text(40, -12, "circuit-pack-sign circuit-pack-minus", "−");
        break;
    }
  }

  /* ---------- one circuit block ---------- */

  function initBlock(root, blockIndex) {
    let config;
    try {
      config = JSON.parse(root.dataset.config);
    } catch (error) {
      root.textContent = "circuit: could not read the directive settings.";
      return;
    }
    root.textContent = "";

    const tools = config.tools || [];
    const canEdit = tools.length > 0;
    const build = config.build;
    const voltage = config.voltage;
    const dp = config.decimals;

    /* ----- the starting circuit and the size of the board ----- */

    let cols = canEdit ? (config.cols || DEFAULT_COLS) : 0;
    let rows = canEdit ? (config.rows || DEFAULT_ROWS) : 0;
    let presetLayout = null;
    if (config.preset) {
      presetLayout = layoutPreset(config.preset, {
        globeR: config.globeR,
        spaced: tools.indexOf("voltmeter") !== -1,
        lockWires: !canEdit,
      });
      if (config.colourWires) colourPositive(presetLayout);
      cols = Math.max(cols, presetLayout.cols, config.cols || 0);
      rows = Math.max(rows, presetLayout.rows, config.rows || 0);
    }
    let answerLayout = null;
    if (build && !config.preset && !config.noSolution) {
      answerLayout = layoutPreset(answerPreset(build, config), { globeR: config.globeR, lockWires: true });
      if (config.colourWires) colourPositive(answerLayout);
      cols = Math.max(cols, answerLayout.cols);
      rows = Math.max(rows, answerLayout.rows);
    }

    function startingEdges() {
      if (presetLayout) return JSON.parse(JSON.stringify(presetLayout.edges));
      const edges = {};
      edges[eKey("v", 0, Math.floor((rows - 2) / 2))] = { kind: "pack", locked: true };
      return edges;
    }

    const state = {
      edges: startingEdges(),
      tool: tools.indexOf("wire") !== -1 ? "wire" : (tools[0] || null),
      rValue: config.resistors[0],
      wireColour: "black",
      answerShown: false,
    };
    let solution = null;

    /* ----- keeping the student's circuit when the page is refreshed ----- */

    const store = (function () {
      const text = root.dataset.config;
      let h = 0;
      for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
      const key = "circuit:" + window.location.pathname + ":" + blockIndex + ":" + (h >>> 0).toString(36);
      return {
        load: function () { try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
        save: function (data) { try { window.localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* storage not available */ } },
        clear: function () { try { window.localStorage.removeItem(key); } catch (e) { /* storage not available */ } },
      };
    })();

    function save() {
      store.save({ edges: state.edges, answerShown: state.answerShown });
    }

    (function restore() {
      const saved = store.load();
      if (!saved || !saved.edges) return;
      const edges = {};
      let pack = false;
      for (const key in saved.edges) {
        const e = parseKey(key);
        const el = saved.edges[key];
        const inside = e.o === "h" ? (e.c < cols - 1 && e.r < rows) : (e.c < cols && e.r < rows - 1);
        if (!inside || !el || !el.kind) continue;
        if (el.kind === "pack") pack = true;
        edges[key] = el;
      }
      if (!pack) return;
      state.edges = edges;
      state.answerShown = !!saved.answerShown;
    })();

    /* ----- page structure ----- */

    if (config.title) root.appendChild(htmlEl("div", "circuit-title", config.title));

    const palette = htmlEl("div", "circuit-palette circuit-noprint");
    palette.setAttribute("role", "group");
    palette.setAttribute("aria-label", "Components");
    const toolButtons = {};
    const swatches = {};
    let resistorSelect = null;

    function toolIcon(kind) {
      const svg = svgEl("svg", { viewBox: "-50 -22 100 44", "class": "circuit-tool-icon", "aria-hidden": "true" });
      if (kind === "erase") {
        svgEl("line", { x1: -14, y1: -14, x2: 14, y2: 14, "class": "circuit-erase-icon" }, svg);
        svgEl("line", { x1: -14, y1: 14, x2: 14, y2: -14, "class": "circuit-erase-icon" }, svg);
      } else {
        drawSymbol(svg, { kind: kind, open: true, glow: 0 }, false);
      }
      return svg;
    }

    if (canEdit) {
      tools.concat(["erase"]).forEach(kind => {
        const button = htmlEl("button", "circuit-btn circuit-tool");
        button.type = "button";
        button.appendChild(toolIcon(kind));
        button.appendChild(htmlEl("span", "", TOOL_NAMES[kind]));
        button.addEventListener("click", () => { state.tool = kind; updatePalette(); });
        toolButtons[kind] = button;
        if (kind === "resistor") {
          const wrap = htmlEl("span", "circuit-tool-group");
          wrap.appendChild(button);
          resistorSelect = htmlEl("select", "circuit-select");
          resistorSelect.setAttribute("aria-label", "Resistance of the resistor");
          config.resistors.forEach(value => {
            const option = htmlEl("option", "", value + " Ω");
            option.value = value;
            resistorSelect.appendChild(option);
          });
          resistorSelect.addEventListener("change", () => {
            state.rValue = parseFloat(resistorSelect.value);
            state.tool = "resistor";
            updatePalette();
          });
          wrap.appendChild(resistorSelect);
          palette.appendChild(wrap);
        } else if (kind === "wire") {
          // the wire button is followed by a dot for each colour of wire
          const wrap = htmlEl("span", "circuit-tool-group");
          wrap.appendChild(button);
          const dots = htmlEl("span", "circuit-swatches");
          dots.setAttribute("role", "group");
          dots.setAttribute("aria-label", "Colour of the wire");
          WIRE_COLOURS.forEach(colour => {
            const dot = htmlEl("button", "circuit-swatch circuit-swatch-" + colour);
            dot.type = "button";
            dot.title = WIRE_COLOUR_NAMES[colour] + " wire";
            dot.setAttribute("aria-label", WIRE_COLOUR_NAMES[colour] + " wire");
            dot.addEventListener("click", () => {
              state.wireColour = colour;
              state.tool = "wire";
              updatePalette();
            });
            swatches[colour] = dot;
            dots.appendChild(dot);
          });
          wrap.appendChild(dots);
          palette.appendChild(wrap);
        } else {
          palette.appendChild(button);
        }
      });
      root.appendChild(palette);
    }

    const VIEW_W = MARGIN_LEFT + (cols - 1) * CELL + MARGIN_RIGHT;
    const VIEW_H = MARGIN_TOP + (rows - 1) * CELL + MARGIN_BOTTOM;

    const svgWrap = htmlEl("div", "circuit-svg-wrap");
    svgWrap.style.maxWidth = VIEW_W + "px";
    root.appendChild(svgWrap);
    const svg = svgEl("svg", {
      "class": "circuit-svg" + (canEdit ? " circuit-editable" : ""),
      viewBox: "0 0 " + VIEW_W + " " + VIEW_H,
      role: "img",
      "aria-label": "Circuit diagram",
    }, svgWrap);
    const gGrid = svgEl("g", { "class": "circuit-grid" }, svg);
    const gDraw = svgEl("g", {}, svg);
    const gText = svgEl("g", {}, svg);
    const gHit = svgEl("g", {}, svg);

    const status = htmlEl("div", "circuit-status");
    status.setAttribute("aria-live", "polite");
    root.appendChild(status);

    const readings = htmlEl("div", "circuit-readings");
    root.appendChild(readings);

    const controls = htmlEl("div", "circuit-controls circuit-noprint");
    const btnCheck = htmlEl("button", "circuit-btn circuit-btn-primary", "Check");
    const btnAnswer = htmlEl("button", "circuit-btn", "Show answer");
    const btnReset = htmlEl("button", "circuit-btn", "Start again");
    const btnPrint = htmlEl("button", "circuit-btn", "Print");
    [btnCheck, btnAnswer, btnReset, btnPrint].forEach(button => { button.type = "button"; });
    if (build) controls.append(btnCheck);
    if (answerLayout) controls.append(btnAnswer);
    // "Start again" is only needed when something can be changed
    const presetSwitch = !!presetLayout && Object.keys(presetLayout.edges)
      .some(key => presetLayout.edges[key].kind === "switch");
    if (canEdit || presetSwitch) controls.append(btnReset);
    controls.append(btnPrint);
    root.appendChild(controls);

    const feedback = htmlEl("div", "circuit-feedback circuit-noprint");
    feedback.setAttribute("aria-live", "polite");
    root.appendChild(feedback);

    const valuesWrap = htmlEl("div", "circuit-values-wrap");
    if (config.showValues) root.appendChild(valuesWrap);

    const instructions = htmlEl("div", "circuit-instructions circuit-noprint");
    root.appendChild(instructions);

    /* ----- geometry ----- */

    function px(c) { return MARGIN_LEFT + c * CELL; }
    function py(r) { return MARGIN_TOP + r * CELL; }

    function edgeMid(key) {
      const e = parseKey(key);
      return e.o === "h"
        ? { x: px(e.c) + CELL / 2, y: py(e.r), o: "h", c: e.c }
        : { x: px(e.c), y: py(e.r) + CELL / 2, o: "v", c: e.c };
    }

    // grid dots and the (invisible) lines that are clicked: made once
    (function buildGrid() {
      if (canEdit) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            svgEl("circle", { cx: px(c), cy: py(r), r: 2.5, "class": "circuit-griddot" }, gGrid);
          }
        }
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c < cols - 1) {
            svgEl("line", { x1: px(c) + 16, y1: py(r), x2: px(c + 1) - 16, y2: py(r),
              "class": "circuit-hit", "data-edge": eKey("h", c, r) }, gHit);
          }
          if (r < rows - 1) {
            svgEl("line", { x1: px(c), y1: py(r) + 16, x2: px(c), y2: py(r + 1) - 16,
              "class": "circuit-hit", "data-edge": eKey("v", c, r) }, gHit);
          }
        }
      }
    })();

    /* ----- formatting ----- */

    function fmt(value) {
      const text = Math.abs(value).toFixed(dp);
      return text;
    }

    function sortedKeys(kinds) {
      return Object.keys(state.edges)
        .filter(key => kinds.indexOf(state.edges[key].kind) !== -1)
        .sort((k1, k2) => {
          const l1 = state.edges[k1].label || "", l2 = state.edges[k2].label || "";
          return l1.localeCompare(l2, undefined, { numeric: true });
        });
    }

    function nextLabel(kind) {
      const used = {};
      for (const key in state.edges) used[(state.edges[key].label || "").toLowerCase()] = true;
      let number = 1;
      while (used[(PREFIX[kind] + number).toLowerCase()]) number++;
      return PREFIX[kind] + number;
    }

    /* ----- drawing ----- */

    function render() {
      solution = solve(cols, rows, state.edges, voltage);
      gDraw.textContent = "";
      gText.textContent = "";

      // a lead takes the colour of the wire joined to it (when all of the
      // wire at that point is the one colour)
      const wireAt = {};
      Object.keys(state.edges).forEach(key => {
        const el = state.edges[key];
        if (el.kind !== "wire") return;
        const ends = endsOf(key, cols);
        [ends.a, ends.b].forEach(point => {
          const colour = el.colour || "black";
          wireAt[point] = (point in wireAt && wireAt[point] !== colour) ? "black" : colour;
        });
      });

      const degree = {};
      Object.keys(state.edges).forEach(key => {
        const el = state.edges[key];
        const value = solution.values[key] || { v: 0, i: 0 };
        const mid = edgeMid(key);
        const ends = endsOf(key, cols);
        degree[ends.a] = (degree[ends.a] || 0) + 1;
        degree[ends.b] = (degree[ends.b] || 0) + 1;

        const vertical = mid.o === "v";
        const g = svgEl("g", {
          "class": "circuit-part circuit-part-" + el.kind + (el.locked || !canEdit ? "" : " circuit-part-free"),
          transform: "translate(" + mid.x + " " + mid.y + ")" + (vertical ? " rotate(90)" : ""),
        }, gDraw);
        const shown = Object.assign({}, el);
        shown.leadA = wireAt[ends.a] || el.leadA;
        shown.leadB = wireAt[ends.b] || el.leadB;
        if (el.kind === "globe") shown.glow = Math.min(1, Math.abs(value.v) / voltage);
        if (el.kind === "pack") shown.text = voltage + " V";
        drawSymbol(g, shown, vertical);

        // an arrow on a wire shows the direction of the (conventional) current
        if (config.showCurrent && el.kind === "wire" && Math.abs(value.i) > FLOWING) {
          const turn = value.i > 0 ? 0 : 180;
          svgEl("path", { d: "M 7 0 L -5 -6 L -5 6 Z",
            "class": "circuit-arrow" + (el.colour === "red" ? " circuit-arrow-dark" : ""),
            transform: "rotate(" + turn + ")" }, g);
        }

        // name on the first line, value or reading on the second
        let line1 = el.label || "";
        let line2 = "";
        let cls2 = "circuit-value";
        if (el.kind === "resistor") line2 = (el.hidden ? "?" : el.r) + " Ω";
        if (el.kind === "ammeter") { line2 = fmt(value.i) + " A"; cls2 = "circuit-reading circuit-ammeter-text"; }
        if (el.kind === "voltmeter") { line2 = fmt(value.v) + " V"; cls2 = "circuit-reading circuit-voltmeter-text"; }
        if (el.kind === "pack" || el.kind === "wire") line1 = "";

        function label(content, cls, x, y, anchor) {
          const node = svgEl("text", { x: x, y: y, "class": cls, "text-anchor": anchor }, gText);
          node.textContent = content;
        }
        if (vertical) {
          const side = mid.c === 0 ? -1 : 1;
          const anchor = side < 0 ? "end" : "start";
          const x = mid.x + side * 24;
          if (line1) label(line1, "circuit-name", x, mid.y + (line2 ? -4 : 5), anchor);
          if (line2) label(line2, cls2, x, mid.y + (line1 ? 13 : 5), anchor);
        } else {
          if (line1) label(line1, "circuit-name", mid.x, mid.y - 24, "middle");
          if (line2) label(line2, cls2, mid.x, mid.y + 33, "middle");
        }
      });

      // a dot where three or more wires meet
      for (const point in degree) {
        if (degree[point] < 3) continue;
        const c = point % cols, r = Math.floor(point / cols);
        svgEl("circle", { cx: px(c), cy: py(r), r: 4.5, "class": "circuit-junction" }, gDraw);
      }

      updateStatus();
      updateReadings();
      updateValues();
    }

    function isComplete() {
      return !solution.short && Math.abs(solution.supply) > FLOWING;
    }

    function updateStatus() {
      let text, kind;
      if (solution.short) {
        text = "Short circuit! The powerpack has switched off.";
        kind = "short";
      } else if (isComplete()) {
        text = "Current is flowing.";
        kind = "on";
      } else {
        text = "No current is flowing - the circuit is not complete.";
        kind = "off";
      }
      status.textContent = text;
      status.className = "circuit-status circuit-status-" + kind;
    }

    function updateReadings() {
      const parts = sortedKeys(["ammeter", "voltmeter"]).map(key => {
        const el = state.edges[key];
        const value = solution.values[key];
        return el.kind === "ammeter"
          ? el.label + " = " + fmt(value.i) + " A"
          : el.label + " = " + fmt(value.v) + " V";
      });
      readings.textContent = parts.length ? "Readings:  " + parts.join("   •   ") : "";
    }

    function updateValues() {
      if (!config.showValues) return;
      valuesWrap.textContent = "";
      const keys = sortedKeys(["resistor", "globe"]);
      if (!keys.length) return;
      const table = htmlEl("table", "circuit-values");
      const head = table.createTHead().insertRow();
      ["Component", "Voltage (V)", "Current (A)", "Resistance (Ω)"].forEach(text => {
        head.appendChild(htmlEl("th", "", text));
      });
      const body = table.createTBody();
      keys.forEach(key => {
        const el = state.edges[key];
        const value = solution.values[key];
        const row = body.insertRow();
        row.insertCell().textContent = el.label;
        row.insertCell().textContent = fmt(value.v);
        row.insertCell().textContent = fmt(value.i);
        row.insertCell().textContent = el.hidden ? "?" : String(el.r);
      });
      valuesWrap.appendChild(table);
    }

    function updatePalette() {
      for (const kind in toolButtons) {
        const on = kind === state.tool;
        toolButtons[kind].classList.toggle("circuit-btn-on", on);
        toolButtons[kind].setAttribute("aria-pressed", on ? "true" : "false");
        toolButtons[kind].disabled = state.answerShown;
      }
      for (const colour in swatches) {
        const on = colour === state.wireColour;
        swatches[colour].classList.toggle("circuit-swatch-on", on);
        swatches[colour].setAttribute("aria-pressed", on ? "true" : "false");
        swatches[colour].disabled = state.answerShown;
      }
      if (resistorSelect) {
        resistorSelect.value = String(state.rValue);
        resistorSelect.disabled = state.answerShown;
      }
      btnCheck.disabled = state.answerShown;
      btnAnswer.disabled = state.answerShown;
      svg.classList.toggle("circuit-editable", canEdit && !state.answerShown);
      svg.classList.toggle("circuit-erasing", state.tool === "erase");
    }

    function setFeedback(text, kind) {
      feedback.textContent = text;
      feedback.className = "circuit-feedback circuit-noprint" + (kind ? " circuit-feedback-" + kind : "");
    }

    // Tells an enclosing activitygroup that the building task is done, so it
    // can unlock its questions. how = "check" (correct) or "answer" (shown).
    function announceComplete(how) {
      root.dispatchEvent(new CustomEvent("activitygroup:complete",
        { bubbles: true, detail: { how: how, activity: "circuit" } }));
    }

    /* ----- changing the circuit ----- */

    function changed() {
      setFeedback("", null);
      save();
      render();
    }

    // dragging = true when the pointer is being dragged across the board
    function applyTool(key, dragging) {
      const el = state.edges[key];

      // a switch is opened and closed by clicking it
      if (el && el.kind === "switch" && !dragging &&
          !(canEdit && !state.answerShown && state.tool === "erase" && !el.locked)) {
        el.open = !el.open;
        changed();
        return;
      }
      if (!canEdit || state.answerShown || !state.tool) return;
      if (el && el.locked) {
        if (!dragging) setFeedback(el.kind === "pack"
          ? "The powerpack stays where it is."
          : "This component is part of the circuit you were given and cannot be changed.", "info");
        return;
      }

      const tool = state.tool;
      if (tool === "erase") {
        if (!el) return;
        delete state.edges[key];
      } else if (tool === "wire") {
        // dragging lays wire in the gaps and recolours wire, but does not
        // replace components
        if (el && el.kind !== "wire" && dragging) return;
        if (el && el.kind === "wire" && (el.colour || "black") === state.wireColour) return;
        state.edges[key] = { kind: "wire" };
        if (state.wireColour !== "black") state.edges[key].colour = state.wireColour;
      } else {
        if (dragging) return;
        if (el && el.kind === tool && (tool !== "resistor" || el.r === state.rValue)) return;
        const fresh = { kind: tool, label: el && el.kind === tool ? el.label : null };
        if (tool === "resistor") fresh.r = state.rValue;
        if (tool === "globe") fresh.r = config.globeR;
        if (tool === "switch") fresh.open = true;
        delete state.edges[key];
        if (!fresh.label) fresh.label = nextLabel(tool);
        state.edges[key] = fresh;
      }
      changed();
    }

    let dragKey = null;       // the last edge visited while dragging
    let dragOn = false;

    svg.addEventListener("pointerdown", event => {
      const key = event.target && event.target.getAttribute && event.target.getAttribute("data-edge");
      if (!key || (event.button !== undefined && event.button > 0)) return;
      event.preventDefault();
      applyTool(key, false);
      dragOn = canEdit && (state.tool === "wire" || state.tool === "erase");
      dragKey = key;
    });

    document.addEventListener("pointermove", event => {
      if (!dragOn) return;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (!target || !gHit.contains(target)) return;
      const key = target.getAttribute("data-edge");
      if (!key || key === dragKey) return;
      dragKey = key;
      applyTool(key, true);
    });

    ["pointerup", "pointercancel"].forEach(type => {
      document.addEventListener(type, () => { dragOn = false; dragKey = null; });
    });

    /* ----- checking a building task ----- */

    function count(n, kind) {
      return n + " " + (n === 1 ? kind : PLURAL[kind]);
    }

    function check() {
      if (!build) return;
      const edges = state.edges;
      const value = key => solution.values[key] || { v: 0, i: 0 };
      const keysOf = kind => Object.keys(edges).filter(key => edges[key].kind === kind);

      if (solution.short) {
        setFeedback("There is a short circuit: a path of wire goes from + to − without " +
          "passing through a resistor or globe. An ammeter connected across a component " +
          "can cause this.", "bad");
        return;
      }
      if (!isComplete()) {
        const seriesVoltmeter = keysOf("voltmeter").some(key => Math.abs(value(key).v) > 0.9 * voltage);
        const openSwitch = keysOf("switch").some(key => edges[key].open);
        setFeedback("No current is flowing. Make a complete loop from + to −." +
          (openSwitch ? " Is the switch closed?" : "") +
          (seriesVoltmeter ? " A voltmeter is connected in series; it needs to go across a component." : ""),
          "bad");
        return;
      }

      const counts = build.counts;
      const working = kind => keysOf(kind).filter(key => Math.abs(value(key).i) > FLOWING);

      // resistors and globes: only the ones with current in them count
      if ("resistor" in counts || "globe" in counts) {
        for (const kind of ["resistor", "globe"]) {
          const need = counts[kind] || 0;
          const placed = keysOf(kind).length;
          const have = working(kind).length;
          if (have === need && placed === need) continue;
          let text;
          if (placed !== need) {
            text = "This circuit needs " + count(need, kind) + "; yours has " + placed + ".";
          } else {
            text = "Only " + have + " of your " + PLURAL[kind] + " " + (have === 1 ? "has" : "have") +
              " current in " + (have === 1 ? "it" : "them") + ". Check that a wire or an ammeter " +
              "is not connected across a component, and that every branch is complete.";
          }
          setFeedback(text, "bad");
          return;
        }
      }

      const loads = working("resistor").concat(working("globe"));
      const supply = Math.abs(solution.supply);
      if (build.topology === "series" && loads.length >= 2) {
        const same = loads.every(key => Math.abs(Math.abs(value(key).i) - supply) < 1e-3 * supply);
        if (!same) {
          setFeedback("These components are not all in series. In a series circuit there is " +
            "only one path, so the same current goes through every component.", "bad");
          return;
        }
      }
      if (build.topology === "parallel" && loads.length >= 2) {
        const across = loads.every(key => Math.abs(Math.abs(value(key).v) - voltage) < 1e-3 * voltage);
        if (!across) {
          setFeedback("These components are not all in parallel. In a parallel circuit each " +
            "component is on its own branch, connected straight across the powerpack.", "bad");
          return;
        }
      }
      if (build.topology && loads.length < 2) {
        setFeedback("A " + build.topology + " circuit needs two or more resistors or globes.", "bad");
        return;
      }

      if (counts.ammeter) {
        const placed = keysOf("ammeter").length;
        if (placed < counts.ammeter) {
          setFeedback("Add " + count(counts.ammeter - placed, "ammeter") + " to measure the current.", "bad");
          return;
        }
        if (working("ammeter").length < counts.ammeter) {
          setFeedback("An ammeter reads 0 A. Connect it in series, so that the current " +
            "goes through it.", "bad");
          return;
        }
      }
      if (counts.voltmeter) {
        const keys = keysOf("voltmeter");
        if (keys.length < counts.voltmeter) {
          setFeedback("Add " + count(counts.voltmeter - keys.length, "voltmeter") + " to measure the voltage.", "bad");
          return;
        }
        const reading = keys.filter(key => Math.abs(value(key).v) > 0.005).length;
        if (reading < counts.voltmeter) {
          setFeedback("A voltmeter reads 0 V. Connect it in parallel, with one lead on each " +
            "side of a component.", "bad");
          return;
        }
      }
      if (counts["switch"] && keysOf("switch").length < counts["switch"]) {
        setFeedback("Add a switch to the circuit.", "bad");
        return;
      }

      setFeedback("Correct - the circuit is built as asked. Read the meters.", "good");
      announceComplete("check");
    }

    function showAnswer() {
      if (!answerLayout) return;
      state.edges = JSON.parse(JSON.stringify(answerLayout.edges));
      state.answerShown = true;
      save();
      render();
      updatePalette();
      setFeedback("This is one way to build the circuit. Press “Start again” to build your own.", "info");
      announceComplete("answer");
    }

    function reset() {
      state.edges = startingEdges();
      state.answerShown = false;
      store.clear();
      setFeedback("", null);
      render();
      updatePalette();
    }

    btnCheck.addEventListener("click", check);
    btnAnswer.addEventListener("click", showAnswer);
    btnReset.addEventListener("click", reset);

    // Print just this circuit: the block is moved into a temporary host at
    // the top of <body> (everything else is hidden by CSS) and moved back.
    function startPrintMode() {
      if (document.body.classList.contains("circuit-printing")) return;
      const marker = document.createComment("circuit");
      root.parentNode.insertBefore(marker, root);
      const host = htmlEl("div", "circuit-print-host");
      document.body.appendChild(host);
      host.appendChild(root);
      document.body.classList.add("circuit-printing");
      root._circuitEndPrint = () => {
        marker.parentNode.insertBefore(root, marker);
        marker.remove();
        host.remove();
        document.body.classList.remove("circuit-printing");
        window.removeEventListener("afterprint", root._circuitEndPrint);
      };
      window.addEventListener("afterprint", root._circuitEndPrint);
    }
    root._circuitStartPrint = startPrintMode;      // used by tests

    btnPrint.addEventListener("click", () => {
      startPrintMode();
      window.print();
    });

    /* ----- start ----- */

    const hasSwitch = Object.keys(state.edges).some(key => state.edges[key].kind === "switch") ||
      tools.indexOf("switch") !== -1;
    const parts = [];
    if (canEdit) {
      parts.push("Choose a component, then click between two dots to place it.");
      if (tools.indexOf("wire") !== -1) {
        parts.push("Drag along the dots to lay wire quickly. Pick a colour for the wire with the " +
          "dots beside \u201CWire\u201D, e.g. red for the positive side.");
      }
      parts.push("An ammeter goes in series; a voltmeter goes in parallel, across a component.");
    }
    if (hasSwitch) parts.push("Click a switch to open or close it.");
    if (build) parts.push("Press “Check” when the circuit is built.");
    instructions.textContent = parts.join(" ");

    render();
    updatePalette();
  }

  function initAll() {
    document.querySelectorAll(".circuit-block").forEach((root, index) => {
      if (root.dataset.circuitReady) return;
      root.dataset.circuitReady = "true";
      initBlock(root, index);
    });
  }

  // for tests run outside a browser
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { solve: solve, layoutPreset: layoutPreset, answerPreset: answerPreset, eKey: eKey };
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
