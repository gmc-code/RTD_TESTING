/*
Patched Parsons Puzzle Runtime for Sphinx/RTD
Works with SortableJS
Fixes:
- Draggable items with nested <pre> + copy button
- Compute correct indent ignoring prefix span
- Buttons Check/Reset/Solution now functional
- Drag handle set to <pre> to prevent losing lines
*/

(function () {
  document.addEventListener("DOMContentLoaded", initAllParsons);

  function initAllParsons() {
    document.querySelectorAll(".parsons-container").forEach(initParsons);
  }

  function initParsons(container) {
    const widgetId = container.id;
    if (!widgetId) return;

    const expectedScript = document.getElementById(`${widgetId}-expected`);
    if (!expectedScript) return;

    const payload = JSON.parse(expectedScript.textContent);
    const expected = payload.expected;
    const cfg = payload.config;

    const checkMode = container.dataset.checkMode || cfg.check_mode;
    const indentStep = parseInt(container.dataset.indentStep || cfg.indent_step, 10);
    const columns = parseInt(container.dataset.columns || cfg.columns, 10);
    const prefixMode = container.dataset.prefix || cfg.prefix || "none";

    const shuffleJS = container.dataset.shuffleJs === "true";
    let randomOrder = [];
    if (container.dataset.randomOrder) {
      try { randomOrder = JSON.parse(container.dataset.randomOrder); } catch (_) {}
    }

    const sourceList = container.querySelector(".parsons-source");
    const targetLists = [...container.querySelectorAll(".parsons-target-list")];

    // ---------- APPLY JS SHUFFLE IF ENABLED ----------
    if (shuffleJS && randomOrder.length > 0 && sourceList) {
      const items = [...sourceList.children];
      items.sort((a, b) => {
        const lnA = parseInt(a.dataset.lineNumber, 10);
        const lnB = parseInt(b.dataset.lineNumber, 10);
        return randomOrder.indexOf(lnA) - randomOrder.indexOf(lnB);
      });
      items.forEach(li => sourceList.appendChild(li));
    }

    // ---------- MAKE DRAGGABLE WITH SORTABLE ----------
    const sortableOpts = {
      group: widgetId,
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      handle: "pre", // drag only via <pre> block
      onMove(evt) {
        return !evt.dragged.classList.contains("parsons-locked");
      },
    };

    // Set draggable correctly on each <li>
    const allItems = [...sourceList.children];
    allItems.forEach(li => {
      li.draggable = !li.classList.contains("parsons-locked");
    });

    if (sourceList) Sortable.create(sourceList, sortableOpts);
    targetLists.forEach(ul => Sortable.create(ul, sortableOpts));

    // ---------- BUTTONS ----------
    const btnCheck = container.querySelector(".parsons-check");
    const btnReset = container.querySelector(".parsons-reset");
    const btnSolution = container.querySelector(".parsons-show-solution");

    if (btnCheck) btnCheck.addEventListener("click", () => checkSolution(container, expected, checkMode, indentStep));
    if (btnReset) btnReset.addEventListener("click", () => resetPuzzle(container, expected));
    if (btnSolution) btnSolution.addEventListener("click", () => showSolution(container, expected));
  }

  // ------------------------------------------------------------
  // CHECK SOLUTION
  // ------------------------------------------------------------
  function checkSolution(container, expected, checkMode, indentStep) {
    const userOrder = getUserState(container);
    clearHighlights(container);

    let allCorrect = true;

    expected.forEach((exp, idx) => {
      const usr = userOrder[idx];
      if (!usr) { allCorrect = false; return; }

      let correct = true;

      // ORDER CHECK
      if (checkMode !== "indent-only") {
        if (usr.line_number !== exp.line_number) correct = false;
      }

      // INDENT CHECK
      if (checkMode !== "order-only") {
        if (usr.indent !== exp.indent) correct = false;
      }

      const li = usr.element;
      if (correct) li.classList.add("parsons-correct");
      else { li.classList.add("parsons-wrong"); allCorrect = false; }
    });

    if (allCorrect) container.classList.add("parsons-solved");
    else container.classList.remove("parsons-solved");
  }

  // ------------------------------------------------------------
  // GET USER STATE: returns ordered list of { line_number, indent, element }
  // ------------------------------------------------------------
  function getUserState(container) {
    const cols = [...container.querySelectorAll(".parsons-target-list")];
    let collected = [];

    cols.forEach(ul => {
      [...ul.children].forEach(li => {
        const ln = parseInt(li.dataset.lineNumber, 10);
        const indent = computeIndentFromDOM(li);
        collected.push({ line_number: ln, indent, element: li });
      });
    });

    return collected;
  }

  // ------------------------------------------------------------
  // Compute indent ignoring prefix span
  // ------------------------------------------------------------
  function computeIndentFromDOM(li) {
    const pre = li.querySelector("pre.parsons-code");
    if (!pre) return 0;

    let txt = pre.textContent || "";

    const prefix = pre.querySelector(".parsons-prefix");
    if (prefix) txt = txt.replace(prefix.textContent, "");

    return txt.length - txt.trimStart().length;
  }

  // ------------------------------------------------------------
  // CLEAR HIGHLIGHTS
  // ------------------------------------------------------------
  function clearHighlights(container) {
    container.querySelectorAll(".parsons-correct, .parsons-wrong").forEach(el => {
      el.classList.remove("parsons-correct", "parsons-wrong");
    });
  }

  // ------------------------------------------------------------
  // RESET PUZZLE
  // ------------------------------------------------------------
  function resetPuzzle(container, expected) {
    clearHighlights(container);
    container.classList.remove("parsons-solved");

    const source = container.querySelector(".parsons-source");
    if (!source) return;

    const items = [...container.querySelectorAll(".parsons-line")];
    items.sort((a, b) => parseInt(a.dataset.lineNumber) - parseInt(b.dataset.lineNumber));
    items.forEach(li => source.appendChild(li));
  }

  // ------------------------------------------------------------
  // SHOW SOLUTION
  // ------------------------------------------------------------
  function showSolution(container, expected) {
    clearHighlights(container);
    container.classList.remove("parsons-solved");

    const cols = [...container.querySelectorAll(".parsons-target-list")];
    if (cols.length === 0) return;

    cols.forEach(ul => ul.innerHTML = "");

    expected.forEach(exp => {
      const li = container.querySelector(`.parsons-line[data-line-number='${exp.line_number}']`);
      if (li) cols[0].appendChild(li);
    });
  }

})();
