document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-container").forEach(initParsons);
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-line pre").forEach(pre => {
    // Remove any injected copy text
    pre.innerHTML = pre.innerHTML.replace(/Copy to clipboard/g, "");
  });
});



function normalizeLineText(text) {
  return text.replace(/^\s*\d+\s*\|\s*/, "").trim();
}


function getCurrentLines() {
  return Array.from(document.querySelectorAll(".parsons-source .parsons-line")).map((li, idx) => {
    // Prefer the clean data-text set by the directive
    const clean = li.dataset.text ?? normalizeLineText(li.querySelector("pre")?.innerText || "");

    return {
      text: clean,
      indent: 0, // your logic here if indent is tracked
      line: idx + 1
    };
  });
}


// --------------------------------------------------------------------------

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

  const expected = parseExpected(container);
  let lines = normalizeSourceLines(source);

  if (container.dataset.shuffleJs === "true") {
    const canonicalOrder = expected.map(e => e.text);
    const canonicalNodes = canonicalOrder.map(text => lines.find(li => norm(li.dataset.text) === norm(text))).filter(Boolean);

    let shuffled = shuffleArray(lines);
    // Avoid identity and canonical order
    while (isSameOrderByText(shuffled, lines) || isSameOrderByText(shuffled, canonicalNodes)) {
      shuffled = shuffleArray(lines);
    }

    source.innerHTML = "";
    shuffled.forEach((li, idx) => {
      const clone = li.cloneNode(true);
      clone.dataset.text = li.dataset.text;
      clone.dataset.solutionLine = li.dataset.solutionLine;
      clone.dataset.puzzleLine = idx + 1;

      clone.innerHTML = "";
      const label = document.createElement("span");
      label.className = "line-label";
      label.textContent = `${clone.dataset.puzzleLine} |`;
      const pre = document.createElement("pre");
      pre.textContent = clone.dataset.text;
      clone.appendChild(label);
      clone.appendChild(pre);

      makeDraggable(container)(clone);
      source.appendChild(clone);
    });
  }

  // Bind actions
  resetBtn?.addEventListener("click", () => reset(container, source, targets, expected));
  checkBtn?.addEventListener("click", () => check(container, source, targets, expected));
  solutionBtn?.addEventListener("click", () => showSolution(container, source, targets, expected));

  // Enable drag/drop
  container.querySelectorAll(".parsons-line").forEach(makeDraggable(container));
  targets.forEach(enableDrop(container));
}



/* ---------- Helpers ---------- */

function createButton(className, text) {
  const btn = document.createElement("button");
  btn.className = className;
  btn.textContent = text;
  return btn;
}



function normalizeSourceLines(source) {
  const lines = Array.from(source.querySelectorAll("li"));
  lines.forEach((li, idx) => {
    const text = li.dataset.text || norm(li.querySelector("pre")?.textContent || "");
    li.dataset.text = text;

    // Canonical solution ID (keep from directive if present, else idx+1)
    const solId = parseInt(li.dataset.solutionLine || li.dataset.line || (idx + 1), 10);
    li.dataset.solutionLine = solId;

    // Initial cosmetic puzzle label (sequential; will be reassigned on shuffle/reset)
    li.dataset.puzzleLine = idx + 1;

    // Render label from puzzle ID for puzzle view
    li.classList.add("parsons-line");
    li.innerHTML = "";
    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${li.dataset.puzzleLine} |`;
    const pre = document.createElement("pre");
    pre.textContent = text;
    li.appendChild(label);
    li.appendChild(pre);
  });
  return lines;
}





function norm(s) {
  return (s || "")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, "    ")
    .replace(/[ \f\r\v]+/g, " ")
    .trim();
}



function parseExpected(container) {
  const segs = (container.dataset.expected || "").split("|");
  return segs.map((seg, idx) => {
    const [indent, code] = seg.split("::");
    return {
      text: norm(code || ""),
      indent: parseInt(indent || "0", 10),
      solutionLine: idx + 1 // canonical 1..N
    };
  });
}



// Map canonical solution IDs by text (normalised)
function buildSolutionIndex(expected) {
  const index = new Map();
  expected.forEach(e => index.set(norm(e.text), e.solutionLine));
  return index;
}




function shuffleArrayAvoidOrders(arr, avoidOrders) {
  let shuffled;
  let tries = 0;
  do {
    shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    tries++;
    // Stop pathological loops after some attempts
    if (tries > 20) break;
  } while (avoidOrders.some(order => isSameOrderByText(shuffled, order)));
  return shuffled;
}



function makeDraggable(container) {
  return li => {
    li.setAttribute("draggable", "true");
    li.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", li.id || "dragging");
      container.__dragging = li;
      li.classList.add("dragging");
    });
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      container.__dragging = null;
    });
  };
}



function enableDrop(container) {
  return target => {
    target.addEventListener("dragover", e => {
      e.preventDefault();
      target.classList.add("parsons-drop-hover");
    });
    target.addEventListener("dragleave", () => {
      target.classList.remove("parsons-drop-hover");
    });
    target.addEventListener("drop", e => {
      e.preventDefault();
      target.classList.remove("parsons-drop-hover");
      const li = container.__dragging;
      if (li) {
        target.appendChild(li);
        logCurrentState(container);
      }
    });
  };
}




function showMessage(container, text, ok) {
  let msg = container.querySelector(".parsons-message");
  if (!msg) {
    msg = document.createElement("div");
    msg.className = "parsons-message";
    msg.setAttribute("aria-live", "polite");
    container.appendChild(msg);
  }
  msg.textContent = text;
  msg.style.color = ok ? "#22c55e" : "#e74c3c";
}



function highlightLines(container, expected, current) {
  container.querySelectorAll(".parsons-line").forEach(li => {
    li.classList.remove("line-correct", "line-incorrect");
  });
  const placed = Array.from(container.querySelectorAll(".parsons-target-list .parsons-line"));
  placed.forEach((li, i) => {
    const e = expected[i], c = current[i];
    if (!c) return;
    li.classList.add(
      c.text === e.text && c.indent === e.indent && c.line === e.line
        ? "line-correct"
        : "line-incorrect"
    );
  });
}

/* ---------- Actions ---------- */

// function shuffleArray(arr) {
//   let shuffled;
//   do {
//     shuffled = [...arr];
//     for (let i = shuffled.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
//     }
//   } while (shuffled.every((li, idx) => li.dataset.puzzleLine == arr[idx].dataset.puzzleLine));
//   return shuffled;
// }

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}



function isSameOrderByText(a, b) {
  if (a.length !== b.length) return false;
  return a.every((li, i) => norm(a[i].dataset.text) === norm(b[i].dataset.text));
}

function reset(container, source, targets, expected) {
  targets.forEach(ul => ul.innerHTML = "");
  source.innerHTML = "";

  // Build canonical working set from expected
  const canonical = expected.map(e => {
    const li = document.createElement("li");
    li.className = "parsons-line";
    li.dataset.text = e.text;
    li.dataset.solutionLine = e.solutionLine;
    return li;
  });

  let shuffled = shuffleArray(canonical);
  // Avoid canonical order
  while (isSameOrderByText(shuffled, canonical)) {
    shuffled = shuffleArray(canonical);
  }

  shuffled.forEach((li, idx) => {
    li.dataset.puzzleLine = idx + 1;
    li.innerHTML = "";
    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${li.dataset.puzzleLine} |`;
    const pre = document.createElement("pre");
    pre.textContent = li.dataset.text;
    li.appendChild(label);
    li.appendChild(pre);
    makeDraggable(container)(li);
    source.appendChild(li);
  });

  container.classList.remove("parsons-correct", "parsons-incorrect");
  const msg = container.querySelector(".parsons-message");
  if (msg) msg.textContent = "";

  logCurrentState(container);
}



// ---------------------------------------------------------------------
function check(container, source, targets, expected) {
  const current = [];

  targets.forEach(ul => {
    const indent = parseInt(ul.dataset.indent, 10) || 0;
    ul.querySelectorAll(".parsons-line").forEach(li => {
      current.push({
        text: li.dataset.text || norm(li.querySelector("pre")?.textContent || ""),
        indent,
        solutionLine: parseInt(li.dataset.solutionLine, 10)
      });
    });
  });

  if (source.querySelectorAll(".parsons-line").length > 0) {
    container.classList.add("parsons-incorrect");
    showMessage(container, "✖ Move all lines into the target area before checking.", false);
    return;
  }

  const ok = current.length === expected.length &&
             current.every((line, i) =>
               norm(line.text) === norm(expected[i].text) &&
               line.indent === expected[i].indent &&
               line.solutionLine === expected[i].solutionLine
             );

  container.classList.toggle("parsons-correct", ok);
  container.classList.toggle("parsons-incorrect", !ok);
  showMessage(container, ok ? "✅ Correct!" : "✖ Try again", ok);
  highlightLines(container, expected, current);

  console.log("Check result:", { ok, expected, current });
}




// -----------------------------------------------------------------
function showSolution(container, source, targets, expected) {
  targets.forEach(ul => ul.innerHTML = "");
  source.innerHTML = "";

  expected.forEach(exp => {
    const li = document.createElement("li");
    li.className = "parsons-line line-correct";
    li.dataset.solutionLine = exp.solutionLine;
    li.dataset.text = exp.text;

    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${exp.solutionLine} |`; // canonical 1..N
    const pre = document.createElement("pre");
    pre.textContent = exp.text;

    li.appendChild(label);
    li.appendChild(pre);

    const target = targets[exp.indent] || targets[0];
    target.appendChild(li);
  });

  showMessage(container, "✨ Solution revealed", true);
  logCurrentState(container);
}





/* ---------- Debug ---------- */

function logCurrentState(container) {
  const current = [];
  container.querySelectorAll(".parsons-target-list").forEach(ul => {
    const indent = parseInt(ul.dataset.indent, 10) || 0;
    ul.querySelectorAll(".parsons-line").forEach(li => {
      const pre = li.querySelector("pre");
      current.push({
        text: norm(pre.textContent),
        indent,
        line: parseInt(li.dataset.solutionLine, 10) // canonical ID
      });
    });
  });
  console.log("Current state:", current);
}
