/* ============================================================
   Parsons Puzzle – Fixed Version
   Behaviour:
   - Puzzle labels 1..N assigned after shuffle (canonical)
   - Labels stay attached to lines in Puzzle, Check, Solution
   - Reset → New shuffle + new 1..N labels
   - No original directive numbering used anywhere
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-container").forEach(initParsons);
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-line pre").forEach(pre => {
    pre.innerHTML = pre.innerHTML.replace(/Copy to clipboard/g, "");
  });
});

function norm(s) {
  return (s || "")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, "    ")
    .replace(/[ \f\r\v]+/g, " ")
    .trim();
}

/* ============================================================
   INITIALISATION
   ============================================================ */
function initParsons(container) {
  const source   = container.querySelector(".parsons-source");
  const targets  = container.querySelectorAll(".parsons-target-list");
  const controls = container.querySelector(".parsons-controls");

  const resetBtn  = controls.querySelector(".parsons-reset");
  const checkBtn  = controls.querySelector(".parsons-check");
  let solutionBtn = controls.querySelector(".parsons-solution");

  if (!solutionBtn) {
    solutionBtn = createButton("parsons-solution", "Show Solution");
    controls.appendChild(solutionBtn);
  }

  // Normalise initial lines (no original numbering kept)
  const originalLines = normalizeSourceLines(source);

  // Parse expected order/layout
  const expected = parseExpected(container, originalLines);

  // Shuffle (if enabled)
  if (container.dataset.shuffleJs === "true") {
    shuffleAndRender(source, originalLines, container);
  }

  // Populate puzzle label map after first render
  container._puzzleLabelMap = new Map();
  source.querySelectorAll(".parsons-line").forEach(li => {
    container._puzzleLabelMap.set(norm(li.dataset.text), li.dataset.puzzleLabel);
  });


  // Bind
  resetBtn?.addEventListener("click", () => reset(container, source, targets, expected));
  checkBtn?.addEventListener("click", () => check(container, source, targets, expected));
  solutionBtn?.addEventListener("click", () => showSolution(container, source, targets, expected));

  // Enable drag/drop
  container.querySelectorAll(".parsons-line").forEach(makeDraggable(container));
  targets.forEach(enableDrop(container));
}

/* ============================================================
   NORMALISATION
   ============================================================ */
function normalizeSourceLines(source) {
  const lines = Array.from(source.querySelectorAll("li"));

  lines.forEach((li, idx) => {
    const text = li.dataset.text || norm(li.querySelector("pre")?.textContent || "");
    li.dataset.text = text;

    li.dataset.solutionLine = idx + 1;     // canonical real position
    li.dataset.puzzleLabel  = idx + 1;     // initial label (will change if shuffled)

    li.classList.add("parsons-line");

    li.innerHTML = "";
    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${li.dataset.puzzleLabel} |`;

    const pre = document.createElement("pre");
    pre.textContent = text;

    li.appendChild(label);
    li.appendChild(pre);
  });

  return lines;
}

/* ============================================================
   SHUFFLE AND RENDER
   ============================================================ */
function shuffleAndRender(source, originalLines, container) {
  const shuffled = shuffleArray([...originalLines]);

  source.innerHTML = "";

  shuffled.forEach((li, idx) => {
    const clone = li.cloneNode(true);

    clone.dataset.text = li.dataset.text;
    clone.dataset.solutionLine = li.dataset.solutionLine;
    clone.dataset.puzzleLabel = idx + 1;

    clone.innerHTML = "";
    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${clone.dataset.puzzleLabel} |`;

    const pre = document.createElement("pre");
    pre.textContent = clone.dataset.text;

    clone.appendChild(label);
    clone.appendChild(pre);

    makeDraggable(container)(clone);
    source.appendChild(clone);
  });
}

/* ============================================================
   EXPECTED PARSER
   ============================================================ */
function parseExpected(container, originalLines) {
  const segs = container.dataset.expected.split("|");

  return segs.map((seg, idx) => {
    const [indent, code] = seg.split("::");
    const clean = code.trim();

    return {
      text: clean,
      indent: parseInt(indent, 10),
      solutionLine: idx + 1
    };
  });
}

/* ============================================================
   UTILS
   ============================================================ */
function createButton(className, text) {
  const btn = document.createElement("button");
  btn.className = className;
  btn.textContent = text;
  return btn;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ============================================================
   DRAG AND DROP
   ============================================================ */

function makeDraggable(container) {
  return li => {
    li.setAttribute("draggable", "true");

    li.addEventListener("dragstart", e => {
      container.__dragging = li;
      li.classList.add("dragging");
      li.style.opacity = "0.6";
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "dragging"); // required for Firefox
    });

    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      li.style.opacity = "1";
      container.__dragging = null;
    });
  };
}



function enableDrop(container) {
  return target => {
    target.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      target.classList.add("parsons-drop-hover");
    });

    target.addEventListener("dragleave", () => {
      target.classList.remove("parsons-drop-hover");
    });

    target.addEventListener("drop", e => {
      e.preventDefault();
      target.classList.remove("parsons-drop-hover");

      const li = container.__dragging;
      if (!li) return;

      // Insert at the correct position based on cursor
      const afterElement = Array.from(target.children)
        .reverse()
        .find(child => {
          if (child === li) return false; // skip the dragged element itself
          const rect = child.getBoundingClientRect();
          return e.clientY > rect.top + rect.height / 2;
        });

      if (afterElement) {
        target.insertBefore(li, afterElement.nextSibling);
      } else {
        target.prepend(li);
      }
    });
  };
}

/* ============================================================
   RESET
   ============================================================ */
function reset(container, source, targets, expected) {
  targets.forEach(ul => ul.innerHTML = "");
  source.innerHTML = "";

  // Build working set (fresh clone)
  const canonical = expected.map(e => {
    const li = document.createElement("li");
    li.className = "parsons-line";
    li.dataset.text = e.text;
    li.dataset.solutionLine = e.solutionLine;
    return li;
  });

  const shuffled = shuffleArray(canonical);

  shuffled.forEach((li, idx) => {
    li.dataset.puzzleLabel = idx + 1;

    li.innerHTML = "";
    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${li.dataset.puzzleLabel} |`;

    const pre = document.createElement("pre");
    pre.textContent = li.dataset.text;

    li.appendChild(label);
    li.appendChild(pre);

    // If this signature works for you, keep it
    makeDraggable(container)(li);

    source.appendChild(li);
  });

  // Store puzzle labels mapped by NORMALIZED text
  container._puzzleLabelMap = new Map();
  source.querySelectorAll(".parsons-line").forEach(li => {
    container._puzzleLabelMap.set(norm(li.dataset.text), li.dataset.puzzleLabel);
  });

  const msg = container.querySelector(".parsons-message");
  if (msg) msg.textContent = "";

  container.classList.remove("parsons-correct", "parsons-incorrect");
}


/* ============================================================
   CHECK
   ============================================================ */

   function check(container, source, targets, expected) {
  const current = [];

  targets.forEach(ul => {
    const indent = parseInt(ul.dataset.indent, 10) || 0;
    ul.querySelectorAll(".parsons-line").forEach(li => {
      current.push({
        li,
        text: li.dataset.text,
        indent,
        solutionLine: parseInt(li.dataset.solutionLine),
      });
    });
  });

  if (source.querySelectorAll(".parsons-line").length > 0) {
    showMessage(container, "✖ Move all lines into the target area before checking.", false);
    return;
  }

  let allCorrect = true;

  current.forEach((line, i) => {
    // Remove old classes
    line.li.classList.remove("line-correct", "line-incorrect");

    // Compare with expected
    const correct =
      norm(line.text) === norm(expected[i].text) &&
      line.indent === expected[i].indent &&
      line.solutionLine === expected[i].solutionLine;

    if (correct) {
      line.li.classList.add("line-correct");
    } else {
      line.li.classList.add("line-incorrect");
      allCorrect = false;
    }
  });

  showMessage(container, allCorrect ? "✅ Correct!" : "✖ Try again", allCorrect);
  container.classList.toggle("parsons-correct", allCorrect);
  container.classList.toggle("parsons-incorrect", !allCorrect);
}



// function check(container, source, targets, expected) {
//   const current = [];

//   targets.forEach(ul => {
//     const indent = parseInt(ul.dataset.indent, 10) || 0;
//     ul.querySelectorAll(".parsons-line").forEach(li => {
//       current.push({
//         text: li.dataset.text,
//         indent,
//         solutionLine: parseInt(li.dataset.solutionLine),
//         puzzleLabel: li.dataset.puzzleLabel
//       });
//     });
//   });

//   if (source.querySelectorAll(".parsons-line").length > 0) {
//     showMessage(container, "✖ Move all lines into the target area before checking.", false);
//     return;
//   }

//   const ok =
//     current.length === expected.length &&
//     current.every((line, i) =>
//       norm(line.text) === norm(expected[i].text) &&
//       line.indent === expected[i].indent &&
//       line.solutionLine === expected[i].solutionLine
//     );

//   showMessage(container, ok ? "✅ Correct!" : "✖ Try again", ok);
//   container.classList.toggle("parsons-correct", ok);
//   container.classList.toggle("parsons-incorrect", !ok);
// }

/* ============================================================
   SOLUTION
   ============================================================ */

function showSolution(container, source, targets, expected) {
  targets.forEach(ul => ul.innerHTML = "");
  source.innerHTML = "";

  // Sort expected by indent & solution order
  expected.forEach(exp => {
    const li = document.createElement("li");
    li.className = "parsons-line line-correct line-solution"; // <-- add line-solution

    // Puzzle label must remain the SAME label
    // We find the actual puzzle label by matching text
    const puz = findPuzzleLabel(container, exp.text);
    li.dataset.puzzleLabel = puz;

    li.dataset.solutionLine = exp.solutionLine;
    li.dataset.text = exp.text;

    li.innerHTML = "";
    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${li.dataset.puzzleLabel} |`;

    const pre = document.createElement("pre");
    pre.textContent = exp.text;

    li.appendChild(label);
    li.appendChild(pre);

    const target = targets[exp.indent] || targets[0];
    target.appendChild(li);
  });

  showMessage(container, "✨ Solution revealed", true);
}


/* ============================================================
   PUZZLE LABEL LOOKUP
   ============================================================ */

// function findPuzzleLabel(container, text) {
//   if (!container._puzzleLabelMap) return "?";
//   return container._puzzleLabelMap.get(text) || "?";
// }

function findPuzzleLabel(container, text) {
  if (!container._puzzleLabelMap) return "?";
  const key = norm(text);  // normalise
  return container._puzzleLabelMap.get(key) || "?";
}


/* ============================================================
   MESSAGE
   ============================================================ */
function showMessage(container, text, ok) {
  let msg = container.querySelector(".parsons-message");
  if (!msg) {
    msg = document.createElement("div");
    msg.className = "parsons-message";
    container.appendChild(msg);
  }
  msg.textContent = text;
  msg.style.color = ok ? "#22c55e" : "#e74c3c";
}
