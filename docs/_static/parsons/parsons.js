/* global Sortable */
document.addEventListener("DOMContentLoaded", () => {
  const puzzles = document.querySelectorAll(".parsons-container");
  puzzles.forEach(initParsons);
});


function initParsons(container) {
  const source = container.querySelector(".parsons-source");
  const targetCols = container.querySelectorAll(".parsons-target-list");
  const btnCheck = container.querySelector(".parsons-check");
  const btnReset = container.querySelector(".parsons-reset");
  const btnSolution = container.querySelector(".parsons-show-solution");

  // Each puzzle keeps a deep copy of the original DOM for reset
  const originalHTML = {
    source: source.innerHTML,
    targets: Array.from(targetCols).map(col => col.innerHTML)
  };

  // Load expected solution from JSON
  let expected = [];
  try {
    expected = JSON.parse(container.dataset.expected);
  } catch (e) {
    console.error("Invalid Parsons JSON:", container.dataset.expected);
  }

  const shuffleJS = container.dataset.shuffleJs === "true";

  // If JS shuffle enabled, shuffle source items
  if (shuffleJS) {
    shuffleChildren(source);
  }

  // Setup drag-drop using SortableJS
  makeSortable(source, "shared-" + Math.random());
  targetCols.forEach(col => makeSortable(col, "shared-" + Math.random()));

  // Button: Check answer
  if (btnCheck) {
    btnCheck.addEventListener("click", () => {
      const user = readUserAnswer(targetCols);
      const ok = compareUserSolution(user, expected);
      alert(ok ? "✓ Correct!" : "✗ Incorrect. Try again.");
    });
  }

  // Button: Reset
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      // restore source
      source.innerHTML = originalHTML.source;
      // restore target columns
      targetCols.forEach((col, i) => {
        col.innerHTML = originalHTML.targets[i];
      });

      // re-bind Sortable after DOM reset
      makeSortable(source, "shared-" + Math.random());
      targetCols.forEach(col => makeSortable(col, "shared-" + Math.random()));
    });
  }

  // Button: Show solution
  if (btnSolution) {
    btnSolution.addEventListener("click", () => {
      showSolution(container, expected);
    });
  }
}


/* -------------------------------
   Drag-drop setup
--------------------------------*/

function makeSortable(element, groupName) {
  Sortable.create(element, {
    group: groupName,
    animation: 150,
    ghostClass: "parsons-ghost",
    dragClass: "parsons-drag",
    fallbackOnBody: true,
    swapThreshold: 0.65
  });
}


/* --------------------------------
   Shuffle helper
----------------------------------*/
function shuffleChildren(parent) {
  const nodes = Array.from(parent.children);
  for (let i = nodes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    parent.appendChild(nodes[j]);
  }
}


/* --------------------------------
   Read user solution
----------------------------------*/

function readUserAnswer(targetCols) {
  const result = [];

  targetCols.forEach((col, colIndex) => {
    Array.from(col.children).forEach(li => {
      const codeBlock = li.querySelector("pre, code");
      if (!codeBlock) return;

      const code = codeBlock.innerText.trim();
      // User indent = target column index OR allow parsing embedded indent?
      const indent = parseInt(col.dataset.indent) * 4 || 0;
      result.push({ indent, code });
    });
  });

  return result;
}


/* ---------------------------------------
   Compare user solution with expected
----------------------------------------*/

function compareUserSolution(user, expected) {
  if (user.length !== expected.length) return false;

  for (let i = 0; i < user.length; i++) {
    if (user[i].indent !== expected[i].indent) return false;
    if (user[i].code !== expected[i].code) return false;
  }

  return true;
}


/* ---------------------------------------
   Show solution inside the container
----------------------------------------*/

function showSolution(container, expected) {
  const source = container.querySelector(".parsons-source");
  const targetCols = container.querySelectorAll(".parsons-target-list");

  // Clear everything
  source.innerHTML = "";
  targetCols.forEach(col => (col.innerHTML = ""));

  // Reconstruct solution
  expected.forEach(item => {
    const li = document.createElement("li");
    li.className = "parsons-line draggable";

    const pre = document.createElement("pre");
    pre.className = "no-copybutton language-python";
    pre.textContent = item.code;

    li.appendChild(pre);

    // Put into correct column by indent level
    // indent = indent/4, so indent 8 → col 2
    const targetIndex = item.indent / 4;
    const col = targetCols[targetIndex] ?? targetCols[0];
    col.appendChild(li);
  });
}
