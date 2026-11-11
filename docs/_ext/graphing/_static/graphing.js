/* graphing directive - results table + true-size graph paper for plotting.
   All drawing is in SVG with 1 user unit = 1 mm, so the grid prints at
   real size (e.g. 12 cm x 12 cm with 5 divisions per cm). */
(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const MAX_ROWS = 12;

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

  // remove floating point noise such as 0.30000000000000004
  function tidy(value) {
    return parseFloat(value.toPrecision(12));
  }

  // "3,5" is accepted as 3.5; returns null if the text is not a number
  function parseNumber(text) {
    const cleaned = String(text).trim().replace(",", ".");
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
    return parseFloat(cleaned);
  }

  function decimalsOf(text) {
    const match = String(text).trim().replace(",", ".").match(/\.(\d+)$/);
    return match ? match[1].length : 0;
  }

  /* Choose the scale for one axis: the smallest "nice" value per cm
     (1, 2 or 5 x a power of ten) that fits the data into `cm` centimetres.
     Returns { lo, step, cm } where step is the value per cm. */
  function chooseScale(min, max, cm, fromZero) {
    if (fromZero) {
      if (min > 0) min = 0;
      if (max < 0) max = 0;
    }
    const span = max - min;
    const reference = span > 0 ? span / cm : (Math.abs(max) || 1) / cm;
    const startExp = Math.floor(Math.log10(reference)) - 1;

    for (let exp = startExp; exp < startExp + 8; exp++) {
      for (const mult of [1, 2, 5]) {
        const step = tidy(mult * Math.pow(10, exp));
        const lo = tidy(Math.floor(min / step + 1e-9) * step);
        if (lo + cm * step >= max - step * 1e-9) {
          return { lo: lo, step: step, cm: cm };
        }
      }
    }
    return { lo: min, step: tidy(span / cm) || 1, cm: cm };
  }

  function tickDecimals(step) {
    return Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  }

  function tickLabel(scale, index) {
    let value = tidy(scale.lo + index * scale.step);
    if (Math.abs(value) < scale.step * 1e-9) value = 0;
    return value.toFixed(tickDecimals(scale.step));
  }

  // least squares straight line through points [{x, y}]; null if vertical
  function bestFit(points) {
    const n = points.length;
    if (n < 2) return null;
    let sx = 0, sy = 0, sxx = 0, sxy = 0;
    points.forEach(p => { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
    const denominator = n * sxx - sx * sx;
    if (Math.abs(denominator) < 1e-12) return null;
    const slope = (n * sxy - sx * sy) / denominator;
    return { slope: slope, intercept: (sy - slope * sx) / n };
  }

  /* ---------- one graphing block ---------- */

  function initBlock(root, blockIndex) {
    let config;
    try {
      config = JSON.parse(root.dataset.config);
    } catch (error) {
      root.textContent = "graphing: could not read the directive settings.";
      return;
    }
    root.textContent = "";

    const hasTeacherData = config.data.length > 0;
    const tableLocked = hasTeacherData && !config.editable;
    const lockName = text => text !== "" && !config.editable;

    const state = {
      rows: config.rows,
      width: config.width,
      height: config.height,
      divisions: config.divisions,
      line: config.line,
      titleForm: config.titleForm,
      zeroX: config.zeroX,
      zeroY: config.zeroY,
      drawn: false,          // has the grid been drawn?
      points: [],            // student points, in data values {x, y, mark}
      answer: [],            // correct points {x, y}
      scaleX: null,
      scaleY: null,
      answerShown: false,
      myLine: false,
    };

    const layout = htmlEl("div", "graphing-layout");
    root.appendChild(layout);

    /* ----- results table ----- */
    const tablePanel = htmlEl("div", "graphing-table-panel");
    layout.appendChild(tablePanel);
    tablePanel.appendChild(htmlEl("div", "graphing-heading", "Results table"));

    const table = htmlEl("table", "graphing-table");
    tablePanel.appendChild(table);
    const thead = table.createTHead();
    const tbody = table.createTBody();

    const trials = config.trials;            // 0 = averages only
    const valueColumns = Math.max(trials, 1);

    function headingCell(labelText, name, unit, nameHint, colSpan, rowSpan) {
      const th = htmlEl("th", "graphing-var-head");
      th.colSpan = colSpan;
      th.rowSpan = rowSpan;
      th.appendChild(htmlEl("div", "graphing-var-kind", labelText));

      const nameInput = htmlEl("input", "graphing-name");
      nameInput.type = "text";
      nameInput.placeholder = nameHint;
      nameInput.value = name;
      nameInput.setAttribute("aria-label", labelText + " name");
      if (lockName(name)) nameInput.readOnly = true;

      const unitInput = htmlEl("input", "graphing-unit");
      unitInput.type = "text";
      unitInput.placeholder = "unit";
      unitInput.value = unit;
      unitInput.setAttribute("aria-label", labelText + " unit");
      if (lockName(unit) || (lockName(name) && unit === "")) unitInput.readOnly = true;

      // teacher-set (locked) text is sized to fit so nothing is cut off
      [nameInput, unitInput].forEach(input => {
        if (input.readOnly && input.value) input.style.width = (input.value.length + 2) + "ch";
      });

      const unitWrap = htmlEl("span", "graphing-unit-wrap");
      unitWrap.append("(", unitInput, ")");
      // a teacher-set name with no unit: hide the empty brackets
      if (unitInput.readOnly && unit === "") unitWrap.style.display = "none";

      th.append(nameInput, unitWrap);
      return { th: th, nameInput: nameInput, unitInput: unitInput };
    }

    const headRow1 = thead.insertRow();
    const ivHead = headingCell("Independent variable", config.iv, config.ivUnit,
      "e.g. Length", 1, trials > 0 ? 2 : 1);
    const dvHead = headingCell("Dependent variable", config.dv, config.dvUnit,
      "e.g. Time", trials > 0 ? trials + 1 : 1, 1);
    headRow1.append(ivHead.th, dvHead.th);

    if (trials > 0) {
      const headRow2 = thead.insertRow();
      for (let t = 1; t <= trials; t++) {
        headRow2.appendChild(htmlEl("th", "graphing-sub-head", "Trial " + t));
      }
      headRow2.appendChild(htmlEl("th", "graphing-sub-head graphing-avg-head", "Average"));
    }

    function numberInput(value, label) {
      const input = htmlEl("input", "graphing-cell");
      input.type = "text";
      input.inputMode = "decimal";
      input.autocomplete = "off";
      input.value = value || "";
      input.setAttribute("aria-label", label);
      if (tableLocked) input.readOnly = true;
      return input;
    }

    function addRow(values) {
      const row = tbody.insertRow();
      const number = tbody.rows.length;
      row.insertCell().appendChild(numberInput(values && values[0], "Row " + number + " independent variable"));
      for (let c = 1; c <= valueColumns; c++) {
        row.insertCell().appendChild(numberInput(values && values[c],
          "Row " + number + (trials > 0 ? " trial " + c : " dependent variable")));
      }
      if (trials > 0) {
        const avgCell = row.insertCell();
        avgCell.className = "graphing-avg";
        avgCell.textContent = "";
      }
    }

    for (let r = 0; r < state.rows; r++) addRow(config.data[r]);

    const rowButtons = htmlEl("div", "graphing-row-buttons graphing-noprint");
    const btnAddRow = htmlEl("button", "graphing-btn graphing-btn-small", "+ Row");
    const btnDelRow = htmlEl("button", "graphing-btn graphing-btn-small", "− Row");
    btnAddRow.type = btnDelRow.type = "button";
    rowButtons.append(btnAddRow, btnDelRow);
    if (!tableLocked) tablePanel.appendChild(rowButtons);

    const tableMessage = htmlEl("div", "graphing-message");
    tableMessage.setAttribute("aria-live", "polite");
    tablePanel.appendChild(tableMessage);

    const btnDraw = htmlEl("button", "graphing-btn graphing-btn-primary graphing-noprint", "Draw graph paper");
    btnDraw.type = "button";
    if (!tableLocked) tablePanel.appendChild(btnDraw);   // locked data is drawn straight away

    /* ----- settings ----- */
    const settings = htmlEl("details", "graphing-settings graphing-noprint");
    settings.appendChild(htmlEl("summary", "", "⚙ Graph settings"));
    const settingsBody = htmlEl("div", "graphing-settings-body");
    settings.appendChild(settingsBody);
    if (!config.noSettings) tablePanel.appendChild(settings);

    function settingRow(labelText, control) {
      const label = htmlEl("label", "graphing-setting");
      label.append(htmlEl("span", "", labelText), control);
      settingsBody.appendChild(label);
      return control;
    }

    function sizeInput(value) {
      const input = htmlEl("input");
      input.type = "number";
      input.min = 4; input.max = 25; input.step = 1;
      input.value = value;
      return input;
    }

    function selectOf(options, value) {
      const select = htmlEl("select");
      options.forEach(([optionValue, text]) => {
        const option = htmlEl("option", "", text);
        option.value = optionValue;
        select.appendChild(option);
      });
      select.value = String(value);
      return select;
    }

    function checkbox(checked) {
      const input = htmlEl("input");
      input.type = "checkbox";
      input.checked = checked;
      return input;
    }

    const setWidth = settingRow("Width (cm)", sizeInput(state.width));
    const setHeight = settingRow("Height (cm)", sizeInput(state.height));
    const setDivisions = settingRow("Divisions per cm",
      selectOf([[1, "1"], [2, "2"], [4, "4"], [5, "5"], [10, "10"]], state.divisions));
    const setLine = settingRow("Line",
      selectOf([["points", "Point to point"], ["bestfit", "Straight line of best fit"],
        ["none", "No line"]], state.line));
    // a title set by the teacher is fixed, so there is nothing to choose
    const setTitleForm = config.title ? null : settingRow("Graph title",
      selectOf([["effect", "The effect of IV on DV"], ["vs", "DV vs IV"], ["none", "No title"]],
        state.titleForm));
    const setZeroX = settingRow("Horizontal axis starts at 0", checkbox(state.zeroX));
    const setZeroY = settingRow("Vertical axis starts at 0", checkbox(state.zeroY));

    /* ----- graph ----- */
    const graphPanel = htmlEl("div", "graphing-graph-panel");
    layout.appendChild(graphPanel);

    const placeholder = htmlEl("div", "graphing-placeholder graphing-noprint",
      tableLocked ? "" : "Fill in the results table, then press “Draw graph paper”.");
    graphPanel.appendChild(placeholder);

    const svgWrap = htmlEl("div", "graphing-svg-wrap");
    graphPanel.appendChild(svgWrap);

    const coordinates = htmlEl("div", "graphing-coordinates graphing-noprint");
    if (config.showCoordinates) graphPanel.appendChild(coordinates);

    const controls = htmlEl("div", "graphing-controls graphing-noprint");
    graphPanel.appendChild(controls);

    function controlButton(text, extraClass) {
      const button = htmlEl("button", "graphing-btn " + (extraClass || ""), text);
      button.type = "button";
      controls.appendChild(button);
      return button;
    }

    const btnCheck = controlButton("Check points", "graphing-btn-primary");
    const btnMyLine = controlButton("Draw my line");
    const btnAnswer = controlButton("Show answer");
    const btnClear = controlButton("Clear points");
    const btnPrint = controlButton("Print");
    if (config.noSolution) btnAnswer.style.display = "none";

    const feedback = htmlEl("div", "graphing-feedback graphing-noprint");
    feedback.setAttribute("aria-live", "polite");
    graphPanel.appendChild(feedback);

    const instructions = htmlEl("div", "graphing-instructions graphing-noprint",
      "Click on the graph paper to plot a point (×). Drag a point to move it. " +
      "Click a point to remove it.");
    graphPanel.appendChild(instructions);

    controls.style.display = "none";
    instructions.style.display = "none";

    /* ----- reading the table ----- */

    // Fills in the Average column and returns
    // { points: [{x, y}], error: "..." | null, started: bool }
    function readTable() {
      const points = [];
      let error = null;
      let started = false;

      // decimal places for averages: as given, else the most used in the trials
      let averageDp = config.averageDp;
      if (averageDp === null || averageDp === undefined) {
        averageDp = 0;
        Array.from(tbody.rows).forEach(row => {
          const inputs = row.querySelectorAll("input");
          for (let c = 1; c < inputs.length; c++) {
            if (parseNumber(inputs[c].value) !== null) {
              averageDp = Math.max(averageDp, decimalsOf(inputs[c].value));
            }
          }
        });
      }

      Array.from(tbody.rows).forEach((row, index) => {
        const inputs = Array.from(row.querySelectorAll("input"));
        const avgCell = row.querySelector(".graphing-avg");
        const texts = inputs.map(input => input.value.trim());
        inputs.forEach(input => input.classList.remove("graphing-cell-bad"));
        if (avgCell) avgCell.textContent = "";

        if (texts.every(text => text === "")) return;      // unused row
        started = true;

        const numbers = texts.map(text => (text === "" ? undefined : parseNumber(text)));
        numbers.forEach((number, c) => {
          if (number === null) {
            inputs[c].classList.add("graphing-cell-bad");
            error = error || "Row " + (index + 1) + ": “" + texts[c] + "” is not a number.";
          }
        });
        if (numbers.includes(null)) return;

        const values = numbers.slice(1).filter(number => number !== undefined);
        let y = null;
        if (values.length) {
          y = values.reduce((sum, value) => sum + value, 0) / values.length;
          if (trials > 0) {
            y = parseFloat(y.toFixed(averageDp));
            avgCell.textContent = y.toFixed(averageDp);
          }
        }

        if (numbers[0] === undefined) {
          inputs[0].classList.add("graphing-cell-bad");
          error = error || "Row " + (index + 1) + ": the independent variable value is missing.";
        } else if (y === null) {
          inputs[1].classList.add("graphing-cell-bad");
          error = error || "Row " + (index + 1) + ": the dependent variable value is missing.";
        } else {
          points.push({ x: numbers[0], y: y });
        }
      });

      if (!error && points.length < 2) {
        error = "Enter at least 2 rows of results to draw a graph.";
      }
      return { points: points, error: error, started: started };
    }

    function axisTitle(nameInput, unitInput, fallback) {
      const name = nameInput.value.trim() || fallback;
      const unit = unitInput.value.trim();
      return unit ? name + " (" + unit + ")" : name;
    }

    // "Length of pendulum" -> "length of pendulum" for use mid-sentence;
    // names such as "pH" or "DNA" are left alone
    function midSentence(name) {
      return /^[A-Z][a-z]/.test(name) || /^[A-Z]( |$)/.test(name)
        ? name.charAt(0).toLowerCase() + name.slice(1) : name;
    }

    function startOfSentence(name) {
      return /^[a-z][a-z ]/.test(name) || /^[a-z]$/.test(name)
        ? name.charAt(0).toUpperCase() + name.slice(1) : name;
    }

    // The graph title: the teacher's own, or built from the variable names
    // as "The effect of IV on DV" or "DV vs IV"
    function graphTitle() {
      if (config.title) return config.title;
      if (state.titleForm === "none") return "";
      const iv = ivHead.nameInput.value.trim() || "independent variable";
      const dv = dvHead.nameInput.value.trim() || "dependent variable";
      if (state.titleForm === "vs") return startOfSentence(dv) + " vs " + midSentence(iv);
      return "The effect of " + midSentence(iv) + " on " + midSentence(dv);
    }

    /* ----- drawing ----- */

    let svg = null;
    let layerLines = null, layerAnswer = null, layerPoints = null;
    let geometry = null;       // margins etc. in mm

    const toX = x => geometry.left + ((x - state.scaleX.lo) / state.scaleX.step) * 10;
    const toY = y => geometry.top + geometry.plotH - ((y - state.scaleY.lo) / state.scaleY.step) * 10;

    function buildGraph() {
      const scaleX = state.scaleX, scaleY = state.scaleY;
      const plotW = state.width * 10, plotH = state.height * 10;
      const minor = 10 / state.divisions;

      const xLabels = [], yLabels = [];
      for (let i = 0; i <= scaleX.cm; i++) xLabels.push(tickLabel(scaleX, i));
      for (let i = 0; i <= scaleY.cm; i++) yLabels.push(tickLabel(scaleY, i));
      const longestX = Math.max.apply(null, xLabels.map(label => label.length));
      const longestY = Math.max.apply(null, yLabels.map(label => label.length));

      const title = graphTitle();
      geometry = {
        left: 11 + longestY * 1.9,
        right: 4 + longestX * 0.9,
        top: 5,
        bottom: 15,
        plotW: plotW,
        plotH: plotH,
      };
      const totalW = geometry.left + plotW + geometry.right;
      const totalH = geometry.top + plotH + geometry.bottom;
      const left = geometry.left, top = geometry.top;

      svgWrap.textContent = "";

      // title sits immediately above the graph paper, centred on the grid
      if (title) {
        const titleEl = htmlEl("div", "graphing-graph-title", title);
        titleEl.style.width = totalW + "mm";
        titleEl.style.paddingLeft = geometry.left + "mm";
        titleEl.style.paddingRight = geometry.right + "mm";
        svgWrap.appendChild(titleEl);
      }
      svg = svgEl("svg", {
        viewBox: "0 0 " + totalW + " " + totalH,
        class: "graphing-svg",
        role: "img",
        "aria-label": "Graph paper" + (title ? ": " + title : ""),
      }, svgWrap);
      svg.style.width = totalW + "mm";
      svg.style.height = totalH + "mm";

      svgEl("rect", { x: 0, y: 0, width: totalW, height: totalH, class: "graphing-bg" }, svg);

      // grid: small divisions, then (for 10 per cm) half-cm lines, then cm lines
      const grid = svgEl("g", {}, svg);
      const countX = Math.round(plotW / minor), countY = Math.round(plotH / minor);
      for (let i = 0; i <= countX; i++) {
        const major = i % state.divisions === 0;
        const half = !major && state.divisions === 10 && i % 5 === 0;
        const x = left + i * minor;
        svgEl("line", { x1: x, y1: top, x2: x, y2: top + plotH,
          class: major ? "graphing-major" : half ? "graphing-half" : "graphing-minor" }, grid);
      }
      for (let i = 0; i <= countY; i++) {
        const major = i % state.divisions === 0;
        const half = !major && state.divisions === 10 && i % 5 === 0;
        const y = top + i * minor;
        svgEl("line", { x1: left, y1: y, x2: left + plotW, y2: y,
          class: major ? "graphing-major" : half ? "graphing-half" : "graphing-minor" }, grid);
      }

      // axes
      svgEl("line", { x1: left, y1: top, x2: left, y2: top + plotH, class: "graphing-axis" }, svg);
      svgEl("line", { x1: left, y1: top + plotH, x2: left + plotW, y2: top + plotH, class: "graphing-axis" }, svg);

      // scale numbers - skip every second one if they would collide
      const skipX = longestX > 4 ? 2 : 1;
      xLabels.forEach((label, i) => {
        const x = left + i * 10;
        svgEl("line", { x1: x, y1: top + plotH, x2: x, y2: top + plotH + 1.2, class: "graphing-axis" }, svg);
        if (i % skipX === 0) {
          svgEl("text", { x: x, y: top + plotH + 4.6, class: "graphing-tick", "text-anchor": "middle" }, svg)
            .textContent = label;
        }
      });
      yLabels.forEach((label, i) => {
        const y = top + plotH - i * 10;
        svgEl("line", { x1: left - 1.2, y1: y, x2: left, y2: y, class: "graphing-axis" }, svg);
        svgEl("text", { x: left - 2, y: y + 1.1, class: "graphing-tick", "text-anchor": "end" }, svg)
          .textContent = label;
      });

      // axis titles
      svgEl("text", { x: left + plotW / 2, y: top + plotH + 11.5, class: "graphing-axis-title",
        "text-anchor": "middle" }, svg)
        .textContent = axisTitle(ivHead.nameInput, ivHead.unitInput, "Independent variable");
      const yTitleX = 4.5;
      svgEl("text", { x: yTitleX, y: top + plotH / 2, class: "graphing-axis-title", "text-anchor": "middle",
        transform: "rotate(-90 " + yTitleX + " " + (top + plotH / 2) + ")" }, svg)
        .textContent = axisTitle(dvHead.nameInput, dvHead.unitInput, "Dependent variable");

      // lines are clipped to the grid
      const clipId = "graphing-clip-" + blockIndex;
      const clip = svgEl("clipPath", { id: clipId }, svgEl("defs", {}, svg));
      svgEl("rect", { x: left, y: top, width: plotW, height: plotH }, clip);

      layerLines = svgEl("g", { "clip-path": "url(#" + clipId + ")" }, svg);
      layerAnswer = svgEl("g", {}, svg);
      layerPoints = svgEl("g", {}, svg);

      // transparent layer that takes the clicks (a little bigger than the grid)
      const overlay = svgEl("rect", { x: left - 2, y: top - 2, width: plotW + 4, height: plotH + 4,
        class: "graphing-overlay" }, svg);
      attachPointer(overlay);

      renderMarks();
    }

    function drawLine(points, kind, className) {
      if (kind === "none" || points.length < 2) return;
      const sorted = points.slice().sort((a, b) => a.x - b.x || a.y - b.y);
      if (kind === "bestfit") {
        const fit = bestFit(sorted);
        if (!fit) return;
        const x1 = sorted[0].x, x2 = sorted[sorted.length - 1].x;
        svgEl("line", { x1: toX(x1), y1: toY(fit.slope * x1 + fit.intercept),
          x2: toX(x2), y2: toY(fit.slope * x2 + fit.intercept), class: className }, layerLines);
      } else {
        svgEl("polyline", { points: sorted.map(p => toX(p.x) + "," + toY(p.y)).join(" "),
          class: className }, layerLines);
      }
    }

    function renderMarks() {
      if (!svg) return;
      layerLines.textContent = "";
      layerAnswer.textContent = "";
      layerPoints.textContent = "";

      if (state.myLine) drawLine(state.points, state.line, "graphing-line-mine");

      if (state.answerShown) {
        drawLine(state.answer, state.line, "graphing-line-answer");
        state.answer.forEach(point => {
          svgEl("circle", { cx: toX(point.x), cy: toY(point.y), r: 1.3, class: "graphing-answer-point" }, layerAnswer);
          svgEl("circle", { cx: toX(point.x), cy: toY(point.y), r: 0.3, class: "graphing-answer-dot" }, layerAnswer);
        });
      }

      // student points are crosses
      const arm = 1.1;
      state.points.forEach(point => {
        const x = toX(point.x), y = toY(point.y);
        const cls = "graphing-point" + (point.mark ? " graphing-point-" + point.mark : "");
        svgEl("path", { d: "M" + (x - arm) + " " + (y - arm) + "L" + (x + arm) + " " + (y + arm) +
          "M" + (x - arm) + " " + (y + arm) + "L" + (x + arm) + " " + (y - arm), class: cls }, layerPoints);
      });
    }

    /* ----- plotting with the mouse / touch ----- */

    function eventToMm(event) {
      const point = new DOMPoint(event.clientX, event.clientY)
        .matrixTransform(svg.getScreenCTM().inverse());
      return { x: point.x, y: point.y };
    }

    // snap to the nearest half small division and convert to data values
    function mmToData(mm) {
      const snap = 10 / state.divisions / 2;
      let gx = Math.round((mm.x - geometry.left) / snap) * snap;
      let gy = Math.round((geometry.top + geometry.plotH - mm.y) / snap) * snap;
      gx = Math.min(Math.max(gx, 0), geometry.plotW);
      gy = Math.min(Math.max(gy, 0), geometry.plotH);
      return {
        x: tidy(state.scaleX.lo + (gx / 10) * state.scaleX.step),
        y: tidy(state.scaleY.lo + (gy / 10) * state.scaleY.step),
      };
    }

    function pointNear(mm) {
      let best = -1, bestDistance = 2.2;     // mm
      state.points.forEach((point, index) => {
        const distance = Math.hypot(toX(point.x) - mm.x, toY(point.y) - mm.y);
        if (distance < bestDistance) { best = index; bestDistance = distance; }
      });
      return best;
    }

    function clearMarks() {
      state.points.forEach(point => { delete point.mark; });
      feedback.textContent = "";
      feedback.className = "graphing-feedback graphing-noprint";
    }

    function attachPointer(overlay) {
      let drag = null;

      overlay.addEventListener("pointerdown", event => {
        if (state.answerShown || event.button > 0) return;
        event.preventDefault();
        const mm = eventToMm(event);
        const hit = pointNear(mm);
        if (hit >= 0) {
          drag = { index: hit, moved: false };
        } else {
          state.points.push(mmToData(mm));
          drag = { index: state.points.length - 1, moved: true };
          clearMarks();
          renderMarks();
        }
        overlay.setPointerCapture(event.pointerId);
      });

      overlay.addEventListener("pointermove", event => {
        if (config.showCoordinates && state.drawn && !state.answerShown) {
          const here = mmToData(eventToMm(event));
          coordinates.textContent = "(" + here.x + ", " + here.y + ")";
        }
        if (!drag) return;
        const next = mmToData(eventToMm(event));
        const point = state.points[drag.index];
        if (next.x !== point.x || next.y !== point.y) {
          point.x = next.x;
          point.y = next.y;
          drag.moved = true;
          clearMarks();
          renderMarks();
        }
      });

      function endDrag() {
        if (drag && !drag.moved) {          // a plain click on a point removes it
          state.points.splice(drag.index, 1);
          clearMarks();
          renderMarks();
        }
        drag = null;
      }
      overlay.addEventListener("pointerup", endDrag);
      overlay.addEventListener("pointercancel", () => { drag = null; });
      overlay.addEventListener("pointerleave", () => { coordinates.textContent = ""; });
    }

    /* ----- buttons ----- */

    function setFeedback(text, kind) {
      feedback.textContent = text;
      feedback.className = "graphing-feedback graphing-noprint graphing-feedback-" + kind;
    }

    function refreshButtons() {
      btnCheck.disabled = state.answerShown;
      btnMyLine.classList.toggle("graphing-btn-on", state.myLine);
      btnMyLine.textContent = state.myLine ? "Hide my line" : "Draw my line";
      btnMyLine.style.display = state.line === "none" ? "none" : "";
      btnAnswer.disabled = state.answerShown;
      btnClear.textContent = state.answerShown ? "Start again" : "Clear points";
    }

    // (re)draws the graph paper from the table; `quiet` = no error messages
    function drawFromTable(quiet) {
      const result = readTable();
      if (result.error) {
        if (!quiet || state.drawn) tableMessage.textContent = result.error;
        if (!quiet) tableMessage.classList.add("graphing-message-bad");
        return false;
      }
      tableMessage.textContent = "";
      tableMessage.classList.remove("graphing-message-bad");

      state.answer = result.points;
      const xs = result.points.map(p => p.x), ys = result.points.map(p => p.y);
      state.scaleX = chooseScale(Math.min.apply(null, xs), Math.max.apply(null, xs), state.width, state.zeroX);
      state.scaleY = chooseScale(Math.min.apply(null, ys), Math.max.apply(null, ys), state.height, state.zeroY);
      state.drawn = true;

      placeholder.style.display = "none";
      controls.style.display = "";
      instructions.style.display = "";
      btnDraw.textContent = "Redraw graph paper";
      clearMarks();
      buildGraph();
      refreshButtons();
      return true;
    }

    btnDraw.addEventListener("click", () => drawFromTable(false));

    // typing in the table: keep averages up to date, and the graph if drawn
    table.addEventListener("input", () => {
      if (state.drawn) drawFromTable(true);
      else {
        readTable();
        tableMessage.textContent = "";
        tableMessage.classList.remove("graphing-message-bad");
      }
    });

    btnAddRow.addEventListener("click", () => {
      if (tbody.rows.length < MAX_ROWS) addRow();
    });
    btnDelRow.addEventListener("click", () => {
      if (tbody.rows.length > 2) {
        tbody.deleteRow(-1);
        if (state.drawn) drawFromTable(true);
      }
    });

    btnCheck.addEventListener("click", () => {
      if (!state.points.length) {
        setFeedback("Plot your points on the graph paper first.", "info");
        return;
      }
      const tolerance = config.tolerance * (10 / state.divisions) + 1e-6;   // mm
      state.points.forEach(point => { point.mark = "wrong"; });

      let correct = 0;
      state.answer.forEach(target => {
        let best = null, bestDistance = Infinity;
        state.points.forEach(point => {
          if (point.mark === "right") return;
          const dx = Math.abs(toX(point.x) - toX(target.x));
          const dy = Math.abs(toY(point.y) - toY(target.y));
          if (dx <= tolerance && dy <= tolerance && dx + dy < bestDistance) {
            best = point;
            bestDistance = dx + dy;
          }
        });
        if (best) { best.mark = "right"; correct++; }
      });

      const total = state.answer.length;
      const wrong = state.points.length - correct;
      const missing = total - correct - Math.min(wrong, total - correct);
      if (correct === total && wrong === 0) {
        setFeedback("✓ All " + total + " points are plotted correctly.", "good");
      } else {
        let text = correct + " of " + total + " points correct.";
        if (wrong) text += " " + wrong + (wrong === 1 ? " point is" : " points are") + " in the wrong place (red).";
        if (missing > 0) text += " " + missing + (missing === 1 ? " point is" : " points are") + " missing.";
        setFeedback(text, correct ? "partial" : "bad");
      }
      renderMarks();
    });

    btnMyLine.addEventListener("click", () => {
      state.myLine = !state.myLine;
      refreshButtons();
      renderMarks();
    });

    // Once the answer is shown, Check and plotting stay off until "Start again"
    btnAnswer.addEventListener("click", () => {
      if (state.answerShown) return;
      state.answerShown = true;
      clearMarks();
      setFeedback("The correct points are the blue circles. Press \u201cStart again\u201d to have another go.", "info");
      refreshButtons();
      renderMarks();
    });

    btnClear.addEventListener("click", () => {
      state.points = [];
      state.answerShown = false;
      state.myLine = false;
      clearMarks();
      refreshButtons();
      renderMarks();
    });

    // Print just this graph: the block is moved into a temporary host at the
    // top of <body> (everything else is hidden by CSS) and moved back after.
    function startPrintMode() {
      if (document.body.classList.contains("graphing-printing")) return;
      const marker = document.createComment("graphing");
      root.parentNode.insertBefore(marker, root);
      const host = htmlEl("div", "graphing-print-host");
      document.body.appendChild(host);
      host.appendChild(root);
      document.body.classList.add("graphing-printing");
      root._graphingEndPrint = () => {
        marker.parentNode.insertBefore(root, marker);
        marker.remove();
        host.remove();
        document.body.classList.remove("graphing-printing");
        window.removeEventListener("afterprint", root._graphingEndPrint);
      };
      window.addEventListener("afterprint", root._graphingEndPrint);
    }

    btnPrint.addEventListener("click", () => {
      startPrintMode();
      window.print();
    });
    root._graphingStartPrint = startPrintMode;     // used by tests

    /* ----- settings ----- */

    function applySettings() {
      const clamp = (input, fallback) => {
        const value = Math.round(parseFloat(input.value));
        return isFinite(value) ? Math.min(Math.max(value, 4), 25) : fallback;
      };
      state.width = clamp(setWidth, state.width);
      state.height = clamp(setHeight, state.height);
      state.divisions = parseInt(setDivisions.value, 10);
      state.line = setLine.value;
      if (setTitleForm) state.titleForm = setTitleForm.value;
      state.zeroX = setZeroX.checked;
      state.zeroY = setZeroY.checked;
      if (state.drawn) drawFromTable(true);
    }
    [setWidth, setHeight, setDivisions, setLine, setTitleForm, setZeroX, setZeroY].forEach(control => {
      if (!control) return;
      control.addEventListener("change", applySettings);
    });

    /* ----- start ----- */
    if (hasTeacherData) drawFromTable(true);
    else readTable();
  }

  function initAll() {
    document.querySelectorAll(".graphing-block").forEach((root, index) => {
      if (root.dataset.graphingReady) return;
      root.dataset.graphingReady = "true";
      initBlock(root, index);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
