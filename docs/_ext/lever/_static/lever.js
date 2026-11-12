/* lever directive - balance class 1, 2 and 3 levers with weights (downward
   forces) and upward forces.

   The beam is drawn in SVG and turns about the fulcrum.  A force's turning
   effect is  force x distance from the fulcrum;  the lever balances when the
   clockwise and anticlockwise turning effects are equal.

   Positions are stored as a signed number of marks from the fulcrum
   (negative = left, positive = right). */
(function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";

  // drawing sizes, in SVG user units
  const VIEW_W = 760, VIEW_H = 384;
  const BEAM_X0 = 60, BEAM_LEN = 640, BEAM_T = 16, BEAM_OVERHANG = 30;
  const PIVOT_Y = 215;
  const END_TRAVEL = 58;          // how far the end of the longest arm moves
  const MAX_TILT = 12;            // degrees
  const MAX_FORCES = 8;

  const ROLE_NAMES = { load: "Load", effort: "Effort", weight: "Weight", up: "Upward force" };

  const CLASS_TEXT = {
    1: "Class 1 lever: the fulcrum is between the load and the effort.",
    2: "Class 2 lever: the load is between the fulcrum and the effort.",
    3: "Class 3 lever: the effort is between the fulcrum and the load.",
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

  // remove floating point noise such as 0.30000000000000004
  function tidy(value) {
    return parseFloat(value.toPrecision(10));
  }

  function fmt(value) {
    return String(tidy(value));
  }

  function isMultiple(value, step) {
    return Math.abs(value / step - Math.round(value / step)) < 1e-6;
  }

  /* ---------- one lever block ---------- */

  function initBlock(root) {
    let config;
    try {
      config = JSON.parse(root.dataset.config);
    } catch (error) {
      root.textContent = "lever: could not read the directive settings.";
      return;
    }
    root.textContent = "";

    const divisions = config.divisions;
    const divPx = BEAM_LEN / divisions;
    const reduceMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const chooseClass = config.sandbox && !config.cls;   // show the class tabs

    const state = {
      cls: config.cls || (chooseClass ? 1 : null),
      fulcrum: 0,            // mark number of the fulcrum, from the left end
      forces: [],
      released: !config.hold,
      answerShown: false,
      angle: 0,              // current tilt in degrees, clockwise positive
      nextId: 1,
    };
    let frameRequest = null;

    /* ----- page structure ----- */

    if (config.title) root.appendChild(htmlEl("div", "lever-title", config.title));

    const tabs = htmlEl("div", "lever-tabs lever-noprint");
    tabs.setAttribute("role", "group");
    tabs.setAttribute("aria-label", "Lever class");
    const tabButtons = [1, 2, 3].map(number => {
      const button = htmlEl("button", "lever-btn lever-tab", "Class " + number);
      button.type = "button";
      button.addEventListener("click", () => loadClass(number));
      tabs.appendChild(button);
      return button;
    });
    if (chooseClass) root.appendChild(tabs);

    const classLabel = htmlEl("div", "lever-class-label");
    classLabel.setAttribute("aria-live", "polite");
    if (!config.noClassLabel) root.appendChild(classLabel);

    const svgWrap = htmlEl("div", "lever-svg-wrap");
    root.appendChild(svgWrap);
    const svg = svgEl("svg", {
      "class": "lever-svg",
      viewBox: "0 0 " + VIEW_W + " " + VIEW_H,
      role: "img",
      "aria-label": "Lever diagram",
    }, svgWrap);
    const gStand = svgEl("g", {}, svg);
    const gProps = svgEl("g", { "class": "lever-props" }, svg);
    const gBeam = svgEl("g", {}, svg);
    const gForces = svgEl("g", {}, svg);

    const scaleNote = htmlEl("div", "lever-scale-note");
    root.appendChild(scaleNote);

    const status = htmlEl("div", "lever-status");
    status.setAttribute("aria-live", "polite");
    root.appendChild(status);

    const panel = htmlEl("div", "lever-panel lever-noprint");
    root.appendChild(panel);

    const addRow = htmlEl("div", "lever-add-row lever-noprint");
    const btnAddWeight = htmlEl("button", "lever-btn lever-btn-small", "+ Weight");
    const btnAddUp = htmlEl("button", "lever-btn lever-btn-small", "+ Upward force");
    btnAddWeight.type = btnAddUp.type = "button";
    addRow.append(btnAddWeight, btnAddUp);
    const canAdd = config.sandbox || config.allowAdd;
    if (canAdd) root.appendChild(addRow);

    const controls = htmlEl("div", "lever-controls lever-noprint");
    const btnCheck = htmlEl("button", "lever-btn lever-btn-primary",
      config.hold ? "Release lever" : "Check");
    const btnAnswer = htmlEl("button", "lever-btn", "Show answer");
    const btnReset = htmlEl("button", "lever-btn", "Start again");
    const btnPrint = htmlEl("button", "lever-btn", "Print");
    [btnCheck, btnAnswer, btnReset, btnPrint].forEach(button => { button.type = "button"; });
    controls.append(btnCheck);
    if (!config.noSolution) controls.append(btnAnswer);
    controls.append(btnReset, btnPrint);
    root.appendChild(controls);

    const feedback = htmlEl("div", "lever-feedback lever-noprint");
    feedback.setAttribute("aria-live", "polite");
    root.appendChild(feedback);

    const momentsWrap = htmlEl("div", "lever-moments-wrap");
    if (config.showMoments) root.appendChild(momentsWrap);

    const instructions = htmlEl("div", "lever-instructions lever-noprint");
    root.appendChild(instructions);

    /* ----- geometry ----- */

    function pivotX() { return BEAM_X0 + state.fulcrum * divPx; }
    function leftArm() { return state.fulcrum; }
    function rightArm() { return divisions - state.fulcrum; }

    function maxAngle() {
      const arm = Math.max(leftArm(), rightArm()) * divPx;
      const degrees = Math.asin(Math.min(1, END_TRAVEL / arm)) * 180 / Math.PI;
      return Math.min(MAX_TILT, degrees);
    }

    // a point given in beam coordinates (x along the beam from the fulcrum,
    // y down from the bottom edge) -> its place in the drawing at this tilt
    function beamPoint(x, y) {
      const a = state.angle * Math.PI / 180;
      return {
        x: pivotX() + x * Math.cos(a) - y * Math.sin(a),
        y: PIVOT_Y + x * Math.sin(a) + y * Math.cos(a),
      };
    }

    /* ----- the physics ----- */

    // clockwise turning effect of one force, in force x marks
    function turning(force) {
      return force.magKnown ? force.dir * force.mag * force.idx : 0;
    }

    function netTurning(except) {
      return state.forces.reduce((sum, f) => sum + (f === except ? 0 : turning(f)), 0);
    }

    function isBalanced() {
      return Math.abs(netTurning()) < 1e-6;
    }

    function unknownCount() {
      return state.forces.filter(f => !f.magKnown).length;
    }

    /* ----- forces ----- */

    function isFree(idx, dir, except) {
      return !state.forces.some(f => f !== except && f.dir === dir && Math.abs(f.idx - idx) < 1e-6);
    }

    // marks a force may be moved to
    function allowedMarks(force) {
      const marks = [];
      for (let i = -leftArm(); i <= rightArm(); i++) {
        if (i === 0) continue;
        if (force.sideFixed && (i < 0) !== (force.side === "left")) continue;
        marks.push(i);
      }
      return marks;
    }

    function makeForce(spec) {
      const force = {
        id: state.nextId++,
        role: spec.role,
        dir: spec.dir === "up" ? -1 : 1,        // +1 pushes the beam down
        mag: spec.mag === null ? 0 : spec.mag,
        magKnown: spec.mag !== null,
        magAdj: spec.magAdj,
        idx: null,
        posAdj: spec.posAdj,
        side: spec.side,
        sideFixed: spec.sideFixed,
        label: spec.label || "",
        removable: !!spec.removable,
        group: null,
      };
      if (spec.dist !== null) {
        force.idx = tidy(spec.dist / config.spacing) * (spec.side === "left" ? -1 : 1);
      }
      return force;
    }

    // a force whose position is "?" starts at the far end of the beam, or
    // wherever is free and does not happen to balance the lever
    function placeUnplaced() {
      state.forces.filter(f => f.idx === null).forEach(force => {
        const marks = allowedMarks(force).sort((a, b) => Math.abs(b) - Math.abs(a) || b - a);
        const free = marks.filter(i => isFree(i, force.dir, force));
        force.idx = free.find(i => {
          force.idx = i;
          const balanced = isBalanced();
          force.idx = null;
          return !balanced || !force.magKnown;
        });
        if (force.idx === undefined) force.idx = free.length ? free[0] : (marks[0] || 1);
      });
    }

    function presetFor(cls) {
      const far = side => Math.max(1, Math.min(side === "left" ? leftArm() : rightArm(), 8));
      const adj = (role, dir, mag, dist, side) => ({
        role: role, dir: dir, mag: mag, magAdj: true, dist: dist * config.spacing,
        posAdj: true, side: side, sideFixed: false, label: "", removable: true,
      });
      if (cls === 1 && leftArm() && rightArm()) {
        return [adj("load", "down", 6, Math.min(2, leftArm()), "left"),
                adj("effort", "down", 2, Math.min(4, rightArm()), "right")];
      }
      const side = rightArm() ? "right" : "left";
      const near = Math.min(2, far(side)), end = far(side);
      if (cls === 3) {
        return [adj("effort", "up", 6, near, side), adj("load", "down", 2, end, side)];
      }
      return [adj("load", "down", 6, near, side), adj("effort", "up", 2, end, side)];
    }

    function loadForces() {
      state.forces = [];
      state.nextId = 1;
      if (config.fulcrum !== null) state.fulcrum = config.fulcrum;
      else state.fulcrum = state.cls === 1 ? Math.floor(divisions / 2) : 0;

      const specs = config.sandbox ? presetFor(state.cls || 1) : config.forces;
      state.forces = specs.map(makeForce);
      placeUnplaced();
      state.released = !config.hold;
      state.answerShown = false;
      state.angle = 0;
    }

    function displayName(force) {
      const base = force.label || ROLE_NAMES[force.role];
      const same = state.forces.filter(f => (f.label || ROLE_NAMES[f.role]) === base);
      return same.length > 1 ? base + " " + (same.indexOf(force) + 1) : base;
    }

    function sizeText(force) {
      return (force.magKnown ? fmt(force.mag) : "?") + " " + config.forceUnit;
    }

    function distanceText(force, withSide) {
      let text = fmt(Math.abs(force.idx) * config.spacing);
      if (config.distanceUnit) text += " " + config.distanceUnit;
      if (withSide && leftArm() && rightArm()) text += force.idx < 0 ? " left" : " right";
      return text;
    }

    function turningUnit() {
      return config.distanceUnit ? " " + config.forceUnit + " " + config.distanceUnit : "";
    }

    /* ----- drawing ----- */

    function drawStand() {
      gStand.textContent = "";
      const x = pivotX(), base = VIEW_H - 16;
      svgEl("polygon", {
        "class": "lever-fulcrum",
        points: [x, PIVOT_Y, x + 30, base, x - 30, base].join(" "),
      }, gStand);
      svgEl("rect", { "class": "lever-base", x: x - 46, y: base, width: 92, height: 8, rx: 2 }, gStand);
      const text = svgEl("text", { "class": "lever-fulcrum-text", x: x, y: base - 8 }, gStand);
      text.textContent = "fulcrum";
    }

    function drawBeam() {
      gBeam.textContent = "";
      const x0 = -leftArm() * divPx - BEAM_OVERHANG;
      svgEl("rect", {
        "class": "lever-beam", x: x0, y: -BEAM_T,
        width: BEAM_LEN + 2 * BEAM_OVERHANG, height: BEAM_T, rx: 2,
      }, gBeam);
      const small = divPx < 50;
      for (let i = -leftArm(); i <= rightArm(); i++) {
        const x = i * divPx;
        svgEl("line", { "class": "lever-tick", x1: x, y1: -BEAM_T, x2: x, y2: -BEAM_T + 3.5 }, gBeam);
        svgEl("line", { "class": "lever-tick", x1: x, y1: 0, x2: x, y2: -3.5 }, gBeam);
        if (i === 0) continue;
        const label = svgEl("text", {
          "class": "lever-tick-text" + (small ? " lever-tick-text-small" : ""),
          x: x, y: -BEAM_T / 2,
        }, gBeam);
        label.textContent = fmt(Math.abs(i) * config.spacing);
      }
      svgEl("circle", { "class": "lever-pivot-dot", cx: 0, cy: -BEAM_T / 2, r: 3 }, gBeam);

      scaleNote.textContent = "Numbers on the beam: distance from the fulcrum" +
        (config.distanceUnit ? " (" + config.distanceUnit + ")" : "");
    }

    // props hold the beam level until "Release lever" is pressed
    function drawProps() {
      gProps.textContent = "";
      if (state.released) return;
      const ends = [];
      if (leftArm()) ends.push(pivotX() - leftArm() * divPx - BEAM_OVERHANG + 7);
      if (rightArm()) ends.push(pivotX() + rightArm() * divPx + BEAM_OVERHANG - 7);
      ends.forEach(x => {
        svgEl("rect", { "class": "lever-prop", x: x - 4, y: PIVOT_Y, width: 8, height: VIEW_H - 16 - PIVOT_Y }, gProps);
        svgEl("rect", { "class": "lever-prop", x: x - 9, y: PIVOT_Y, width: 18, height: 5, rx: 1 }, gProps);
        svgEl("rect", { "class": "lever-base", x: x - 16, y: VIEW_H - 16, width: 32, height: 8, rx: 2 }, gProps);
      });
    }

    function sizeFraction(force) {
      if (!force.magKnown) return 0;
      return Math.sqrt(Math.min(1, force.mag / config.maxForce));
    }

    function drawForce(force) {
      const g = force.group;
      g.textContent = "";
      const adjustable = (force.magAdj || force.posAdj) && !state.answerShown;
      g.setAttribute("class", "lever-force lever-role-" + force.role +
        (force.dir < 0 ? " lever-dir-up" : " lever-dir-down") +
        (adjustable ? " lever-adjustable" : "") +
        (force.posAdj && !state.answerShown ? " lever-draggable" : "") +
        (force.magKnown ? "" : " lever-unknown"));
      const fraction = sizeFraction(force);
      const name = displayName(force);
      const title = svgEl("title", {}, g);
      title.textContent = name + ": " + sizeText(force) + (force.dir < 0 ? " upwards, " : " downwards, ") +
        distanceText(force, true) + " from the fulcrum";

      if (force.dir > 0) {
        // a weight hanging from the beam
        const width = Math.min(40, Math.max(30, divPx * 0.8));
        const height = 20 + 40 * fraction;
        svgEl("rect", { "class": "lever-hit", x: -width / 2 - 4, y: 0, width: width + 8, height: 16 + height + 18 }, g);
        svgEl("line", { "class": "lever-string", x1: 0, y1: 0, x2: 0, y2: 16 }, g);
        svgEl("rect", { "class": "lever-weight", x: -width / 2, y: 16, width: width, height: height, rx: 4 }, g);
        const size = svgEl("text", { "class": "lever-size lever-size-inside", x: 0, y: 16 + height / 2 }, g);
        size.textContent = sizeText(force);
        const label = svgEl("text", { "class": "lever-name", x: 0, y: 16 + height + 13 }, g);
        label.textContent = name;
      } else {
        // an upward force pulling on a ring
        const length = 32 + 58 * fraction;
        svgEl("rect", { "class": "lever-hit", x: -22, y: -length - 46, width: 44, height: length + 46 }, g);
        svgEl("line", { "class": "lever-arrow-shaft", x1: 0, y1: -6, x2: 0, y2: -length }, g);
        svgEl("polygon", {
          "class": "lever-arrow-head",
          points: [0, -length - 13, -9, -length + 1, 9, -length + 1].join(" "),
        }, g);
        svgEl("circle", { "class": "lever-ring", cx: 0, cy: -3, r: 3.5 }, g);
        const size = svgEl("text", { "class": "lever-size", x: 0, y: -length - 19 }, g);
        size.textContent = sizeText(force);
        const label = svgEl("text", { "class": "lever-name", x: 0, y: -length - 33 }, g);
        label.textContent = name;
      }
    }

    function buildForces() {
      gForces.textContent = "";
      state.forces.forEach(force => {
        force.group = svgEl("g", {}, gForces);
        attachDrag(force);
        drawForce(force);
      });
    }

    // place everything for the current tilt
    function positionFrame() {
      gBeam.setAttribute("transform",
        "translate(" + pivotX() + " " + PIVOT_Y + ") rotate(" + state.angle + ")");
      state.forces.forEach(force => {
        const p = beamPoint(force.idx * divPx, force.dir > 0 ? 0 : -BEAM_T);
        force.group.setAttribute("transform", "translate(" + p.x.toFixed(2) + " " + p.y.toFixed(2) + ")");
      });
    }

    function targetAngle() {
      if (!state.released || isBalanced()) return 0;
      return netTurning() > 0 ? maxAngle() : -maxAngle();
    }

    function animate() {
      if (frameRequest) cancelAnimationFrame(frameRequest);
      const target = targetAngle();
      if (reduceMotion) {
        state.angle = target;
        positionFrame();
        return;
      }
      const stepFrame = () => {
        const gap = target - state.angle;
        if (Math.abs(gap) < 0.02) {
          state.angle = target;
          positionFrame();
          frameRequest = null;
          return;
        }
        state.angle += gap * 0.16;
        positionFrame();
        frameRequest = requestAnimationFrame(stepFrame);
      };
      frameRequest = requestAnimationFrame(stepFrame);
    }

    /* ----- lever class, status and turning effects ----- */

    function detectClass() {
      const loads = state.forces.filter(f => f.role === "load");
      const efforts = state.forces.filter(f => f.role === "effort");
      if (loads.length !== 1 || efforts.length !== 1) return null;
      const load = loads[0].idx, effort = efforts[0].idx;
      if (load * effort < 0) return 1;
      if (Math.abs(load) < Math.abs(effort)) return 2;
      if (Math.abs(load) > Math.abs(effort)) return 3;
      return null;
    }

    function updateClassLabel() {
      const detected = detectClass();
      const shown = detected || (state.forces.some(f => f.role === "load" || f.role === "effort") ? null : state.cls);
      classLabel.textContent = shown ? CLASS_TEXT[shown] : "";
      tabButtons.forEach((button, index) => {
        button.classList.toggle("lever-btn-on", state.cls === index + 1);
        button.setAttribute("aria-pressed", state.cls === index + 1 ? "true" : "false");
      });
    }

    function tipText(net) {
      if (net > 0) {
        return "The lever turns clockwise: the " +
          (rightArm() ? "right-hand end goes down." : "left-hand end goes up.");
      }
      return "The lever turns anticlockwise: the " +
        (leftArm() ? "left-hand end goes down." : "right-hand end goes up.");
    }

    function updateStatus() {
      status.className = "lever-status";
      if (!state.released) {
        status.textContent = "The lever is held level by the supports.";
        status.classList.add("lever-status-held");
      } else if (unknownCount()) {
        status.textContent = "";
      } else if (!state.forces.length) {
        status.textContent = "";
      } else if (isBalanced()) {
        status.textContent = "Balanced";
        status.classList.add("lever-status-balanced");
      } else {
        status.textContent = "Not balanced";
        status.classList.add("lever-status-unbalanced");
      }
    }

    function updateMoments() {
      if (!config.showMoments) return;
      momentsWrap.textContent = "";
      const table = htmlEl("table", "lever-moments");
      const head = table.createTHead().insertRow();
      ["Force", "Size", "Distance", "Turning effect", "Direction"]
        .forEach(text => head.appendChild(htmlEl("th", "", text)));
      const body = table.createTBody();
      let clockwise = 0, anticlockwise = 0;
      state.forces.forEach(force => {
        const row = body.insertRow();
        const value = turning(force) * config.spacing;
        const isClockwise = force.dir * force.idx > 0;
        if (isClockwise) clockwise += Math.abs(value); else anticlockwise += Math.abs(value);
        row.insertCell().textContent = displayName(force) + (force.dir < 0 ? " ↑" : " ↓");
        row.insertCell().textContent = sizeText(force);
        row.insertCell().textContent = distanceText(force, true);
        row.insertCell().textContent = force.magKnown
          ? fmt(force.mag) + " × " + fmt(Math.abs(force.idx) * config.spacing) + " = " +
            fmt(Math.abs(value)) + turningUnit()
          : "? × " + fmt(Math.abs(force.idx) * config.spacing);
        const direction = row.insertCell();
        direction.textContent = isClockwise ? "↻ clockwise" : "↺ anticlockwise";
        direction.className = isClockwise ? "lever-cw" : "lever-acw";
      });
      const foot = table.createTFoot().insertRow();
      const cell = foot.insertCell();
      cell.colSpan = 5;
      const pending = unknownCount() ? " (not counting ? forces)" : "";
      cell.textContent = "Total anticlockwise ↺ = " + fmt(anticlockwise) + turningUnit() +
        "   |   Total clockwise ↻ = " + fmt(clockwise) + turningUnit() + pending;
      momentsWrap.appendChild(table);
    }

    /* ----- controls for the forces the student can change ----- */

    function buildPanel() {
      panel.textContent = "";
      const editable = state.forces.filter(f => f.magAdj || f.posAdj || f.removable);
      editable.forEach(force => {
        const row = htmlEl("div", "lever-row lever-row-" + force.role);
        const name = displayName(force);
        row.appendChild(htmlEl("span", "lever-row-name", name + (force.dir < 0 ? " ↑" : " ↓")));

        const sizeWrap = htmlEl("label", "lever-row-field");
        sizeWrap.appendChild(htmlEl("span", "", "Size"));
        if (force.magAdj) {
          const input = htmlEl("input", "lever-input");
          input.type = "number";
          input.min = config.step;
          input.max = config.maxForce;
          input.step = config.step;
          input.placeholder = "?";
          input.value = force.magKnown ? fmt(force.mag) : "";
          input.disabled = state.answerShown;
          input.setAttribute("aria-label", name + " size in " + config.forceUnit);
          input.addEventListener("input", () => {
            const value = parseFloat(input.value);
            if (!isFinite(value) || value <= 0) {
              force.magKnown = false;
              force.mag = 0;
            } else {
              force.mag = Math.min(value, config.maxForce);
              force.magKnown = true;
            }
            changed(force, false);
          });
          input.addEventListener("change", () => {
            if (force.magKnown) input.value = fmt(force.mag);
          });
          sizeWrap.append(input, htmlEl("span", "", config.forceUnit));
        } else {
          sizeWrap.appendChild(htmlEl("strong", "", sizeText(force)));
        }
        row.appendChild(sizeWrap);

        const placeWrap = htmlEl("label", "lever-row-field");
        placeWrap.appendChild(htmlEl("span", "", "Distance"));
        if (force.posAdj) {
          const select = htmlEl("select", "lever-select");
          select.disabled = state.answerShown;
          select.setAttribute("aria-label", name + " distance from the fulcrum");
          allowedMarks(force).forEach(mark => {
            const option = htmlEl("option");
            option.value = mark;
            const saved = force.idx;
            force.idx = mark;
            option.textContent = distanceText(force, true);
            force.idx = saved;
            option.disabled = !isFree(mark, force.dir, force);
            option.selected = mark === force.idx;
            select.appendChild(option);
          });
          select.addEventListener("change", () => {
            force.idx = parseInt(select.value, 10);
            changed(force, true);
          });
          placeWrap.appendChild(select);
        } else {
          placeWrap.appendChild(htmlEl("strong", "", distanceText(force, true)));
        }
        row.appendChild(placeWrap);

        if (force.removable) {
          const remove = htmlEl("button", "lever-btn lever-btn-small lever-remove", "✕");
          remove.type = "button";
          remove.disabled = state.answerShown;
          remove.setAttribute("aria-label", "Remove " + name);
          remove.addEventListener("click", () => {
            state.forces = state.forces.filter(f => f !== force);
            rebuild();
          });
          row.appendChild(remove);
        }
        panel.appendChild(row);
      });
      const full = state.forces.length >= MAX_FORCES;
      btnAddWeight.disabled = btnAddUp.disabled = full || state.answerShown;
    }

    /* ----- dragging a force along the beam ----- */

    function attachDrag(force) {
      const g = force.group;
      let dragging = false;

      function markAt(event) {
        const point = svg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        const local = point.matrixTransform(svg.getScreenCTM().inverse());
        const wanted = (local.x - pivotX()) / divPx;
        // nearest mark that is allowed and free
        let best = null;
        allowedMarks(force).forEach(mark => {
          if (!isFree(mark, force.dir, force)) return;
          if (best === null || Math.abs(mark - wanted) < Math.abs(best - wanted)) best = mark;
        });
        return best;
      }

      g.addEventListener("pointerdown", event => {
        if (!force.posAdj || state.answerShown) return;
        dragging = true;
        g.setPointerCapture(event.pointerId);
        g.classList.add("lever-dragging");
        event.preventDefault();
      });
      g.addEventListener("pointermove", event => {
        if (!dragging) return;
        const mark = markAt(event);
        if (mark === null || mark === force.idx) return;
        force.idx = mark;
        changed(force, false, true);
      });
      const end = () => {
        if (!dragging) return;
        dragging = false;
        g.classList.remove("lever-dragging");
        buildPanel();
      };
      g.addEventListener("pointerup", end);
      g.addEventListener("pointercancel", end);
    }

    /* ----- updates ----- */

    function setFeedback(text, kind) {
      feedback.textContent = text;
      feedback.className = "lever-feedback lever-noprint" + (kind ? " lever-feedback-" + kind : "");
    }

    // Tells an enclosing activitygroup that the lever is balanced, so it can
    // unlock its questions. how = "check" (balanced) or "answer" (shown).
    function announceComplete(how) {
      root.dispatchEvent(new CustomEvent("activitygroup:complete",
        { bubbles: true, detail: { how: how, activity: "lever" } }));
    }

    function refresh() {
      drawProps();
      updateClassLabel();
      updateStatus();
      updateMoments();
      btnCheck.disabled = state.answerShown;
      btnAnswer.disabled = state.answerShown;
      animate();
    }

    // a force was changed by the student
    function changed(force, panelToo, duringDrag) {
      if (config.hold) state.released = false;      // supports go back in
      setFeedback("", "");
      drawForce(force);
      if (panelToo && !duringDrag) buildPanel();
      if (duringDrag) positionFrame();
      refresh();
    }

    // forces were added, removed or reloaded
    function rebuild() {
      setFeedback("", "");
      if (config.hold) state.released = false;
      // no upward forces: leave out the empty space above the beam
      const needTop = canAdd || state.forces.some(f => f.dir < 0);
      const top = needTop ? 0 : PIVOT_Y - BEAM_T - END_TRAVEL - 34;
      svg.setAttribute("viewBox", "0 " + top + " " + VIEW_W + " " + (VIEW_H - top));
      drawStand();
      drawBeam();
      buildForces();
      buildPanel();
      positionFrame();
      refresh();
    }

    function loadClass(cls) {
      state.cls = cls;
      loadForces();
      rebuild();
    }

    function addForce(role, dir) {
      if (state.forces.length >= MAX_FORCES) return;
      const force = makeForce({
        role: role, dir: dir, mag: config.step, magAdj: true, dist: null, posAdj: true,
        side: "any", sideFixed: false, label: "", removable: true,
      });
      const free = allowedMarks(force).filter(i => isFree(i, force.dir, force))
        .sort((a, b) => Math.abs(a) - Math.abs(b) || b - a);
      if (!free.length) {
        setFeedback("There is no free mark left for another " + (dir === "up" ? "upward force." : "weight."), "info");
        return;
      }
      force.idx = free[0];
      state.forces.push(force);
      rebuild();
    }

    /* ----- check / answer ----- */

    function check() {
      if (!state.forces.length) {
        setFeedback("Add some forces first.", "info");
        return;
      }
      if (unknownCount()) {
        setFeedback("Give every “?” force a size first.", "info");
        return;
      }
      if (config.hold) {
        state.released = true;
        refresh();
      }
      const net = netTurning();
      if (isBalanced()) {
        const total = state.forces.reduce((sum, f) => sum + Math.abs(turning(f)), 0) / 2 * config.spacing;
        setFeedback("Balanced! The anticlockwise and clockwise turning effects are equal (" +
          fmt(total) + turningUnit() + " each way).", "good");
        announceComplete("check");
      } else {
        setFeedback("Not balanced. " + tipText(net), "bad");
      }
    }

    function validSize(value) {
      return value > 0 && value <= config.maxForce + 1e-9 && isMultiple(value, config.step);
    }

    // Find a change to ONE force that balances the lever: a new size where it
    // is, a new place at its size, or both.  Returns true if one was found.
    function solve() {
      const candidates = state.forces.filter(f => f.magAdj || f.posAdj)
        .sort((a, b) => (a.magKnown ? 1 : 0) - (b.magKnown ? 1 : 0));

      for (const force of candidates) {
        const others = netTurning(force);
        if (force.magAdj) {
          const size = -others / (force.dir * force.idx);
          if (validSize(tidy(size))) {
            force.mag = tidy(size);
            force.magKnown = true;
            return true;
          }
        }
      }
      for (const force of candidates) {
        if (!force.posAdj) continue;
        const others = netTurning(force);
        const marks = allowedMarks(force).filter(i => isFree(i, force.dir, force));
        if (force.magKnown) {
          const mark = marks.find(i => Math.abs(others + force.dir * force.mag * i) < 1e-6);
          if (mark !== undefined) {
            force.idx = mark;
            return true;
          }
        }
        if (force.magAdj) {
          for (const mark of marks) {
            const size = tidy(-others / (force.dir * mark));
            if (validSize(size)) {
              force.idx = mark;
              force.mag = size;
              force.magKnown = true;
              return true;
            }
          }
        }
      }
      return false;
    }

    function showAnswer() {
      if (state.answerShown) return;
      if (!unknownCount() && isBalanced() && state.forces.length) {
        state.released = true;
        refresh();
        setFeedback("The lever is already balanced.", "info");
        return;
      }
      if (!solve()) {
        setFeedback("This lever cannot be balanced by changing just one force. " +
          "Try moving or changing another force.", "info");
        return;
      }
      state.answerShown = true;
      state.released = true;
      buildForces();
      buildPanel();
      positionFrame();
      refresh();
      setFeedback("This is one way to balance the lever. Press “Start again” to have another go.", "info");
      announceComplete("answer");
    }

    btnCheck.addEventListener("click", check);
    btnAnswer.addEventListener("click", showAnswer);
    btnReset.addEventListener("click", () => loadClass(state.cls));
    btnAddWeight.addEventListener("click", () => addForce("weight", "down"));
    btnAddUp.addEventListener("click", () => addForce("up", "up"));

    // Print just this lever: the block is moved into a temporary host at the
    // top of <body> (everything else is hidden by CSS) and moved back after.
    function startPrintMode() {
      if (document.body.classList.contains("lever-printing")) return;
      const marker = document.createComment("lever");
      root.parentNode.insertBefore(marker, root);
      const host = htmlEl("div", "lever-print-host");
      document.body.appendChild(host);
      host.appendChild(root);
      document.body.classList.add("lever-printing");
      root._leverEndPrint = () => {
        marker.parentNode.insertBefore(root, marker);
        marker.remove();
        host.remove();
        document.body.classList.remove("lever-printing");
        window.removeEventListener("afterprint", root._leverEndPrint);
      };
      window.addEventListener("afterprint", root._leverEndPrint);
    }

    btnPrint.addEventListener("click", () => {
      startPrintMode();
      window.print();
    });
    root._leverStartPrint = startPrintMode;     // used by tests
    root._leverState = state;                   // used by tests

    /* ----- start ----- */
    const canDrag = config.sandbox || config.allowAdd || config.forces.some(f => f.posAdj);
    const canSize = config.sandbox || config.allowAdd || config.forces.some(f => f.magAdj);
    const parts = [];
    if (canSize || canDrag) parts.push("Forces with an orange outline can be changed.");
    if (canSize) parts.push("Type a size in the box.");
    if (canDrag) parts.push("Drag a force along the beam, or choose its distance, to move it.");
    parts.push(config.hold
      ? "Press “Release lever” to take the supports away and see if it balances."
      : "The lever balances when the turning effects each way are equal.");
    instructions.textContent = parts.join(" ");

    loadForces();
    rebuild();
  }

  function initAll() {
    document.querySelectorAll(".lever-block").forEach(root => {
      if (root.dataset.leverReady) return;
      root.dataset.leverReady = "true";
      initBlock(root);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
