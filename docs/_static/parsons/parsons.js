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

function initParsons(container) {
  const source = container.querySelector(".parsons-source");
  const targets = container.querySelectorAll(".parsons-target-list");
  const controls = container.querySelector(".parsons-controls");

  const resetBtn = controls.querySelector(".parsons-reset");
  const checkBtn = controls.querySelector(".parsons-check");
  let solutionBtn = controls.querySelector(".parsons-solution");

  if (!solutionBtn) {
    solutionBtn = createButton("parsons-solution", "Show Solution");
    controls.appendChild(solutionBtn);
  }

  // --- State ---
  const originalLines = normalizeSourceLines(source);
  const expected = parseExpected(container, originalLines);

  // --- Event bindings ---
  resetBtn?.addEventListener("click", () => reset(container, source, targets, originalLines));
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
    li.classList.add("parsons-line");
    if (!li.dataset.line) {
      li.dataset.line = idx + 1;
    }

    // Use the clean code from data-text (set by directive)
    // const cleanText = li.dataset.text || "";
    const cleanText = li.dataset.text || norm(li.querySelector("pre")?.textContent || "");

    // Clear existing content
    li.textContent = "";

    // Add label span
    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${li.dataset.line} |`;

    // Add clean code in <pre>
    const pre = document.createElement("pre");
    pre.textContent = cleanText;

    li.appendChild(label);
    li.appendChild(pre);
  });
  return lines;
}



function parseExpected(container, originalLines) {
  if (!container.dataset.expected) {
    return originalLines.map(li => ({
      text: li.querySelector("pre")?.textContent.trim(),
      indent: 0,
      line: parseInt(li.dataset.line, 10)
    }));
  }
  return container.dataset.expected.split("|").map((seg, idx) => {
    const [indent, code] = seg.split("::");
    return {
      text: code.trim(),
      indent: parseInt(indent, 10),
      line: idx + 1
    };
  });
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

function norm(s) {
  return s.replace(/\u00A0/g, " ")
    .replace(/\t/g, "    ")
    .replace(/[ \f\r\v]+/g, " ")
    .trim();
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

function check(container, source, targets, expected) {
  const current = [];

  // Collect current state from target lists
  targets.forEach(ul => {
    const indent = parseInt(ul.dataset.indent, 10) || 0;
    ul.querySelectorAll(".parsons-line").forEach(li => {
      current.push({
        text: li.dataset.text || norm(li.querySelector("pre")?.textContent || ""),
        indent,
        line: parseInt(li.dataset.line, 10)
      });
    });
  });

  // If any lines are still in the source list, fail immediately
  if (source.querySelectorAll(".parsons-line").length > 0) {
    container.classList.add("parsons-incorrect");
    showMessage(container, "✖ Move all lines into the target area before checking.", false);
    return;
  }

  // Compare current vs expected by original line id and text
  const ok = current.length === expected.length &&
             current.every((line, i) =>
               norm(line.text) === norm(expected[i].text) &&
               line.indent === expected[i].indent &&
               line.line === expected[i].line
             );

  container.classList.toggle("parsons-correct", ok);
  container.classList.toggle("parsons-incorrect", !ok);
  showMessage(container, ok ? "✅ Correct!" : "✖ Try again", ok);
  highlightLines(container, expected, current);

  console.log("Check result:", { ok, expected, current });
}


function reset(container, source, targets, originalLines) {
  targets.forEach(ul => ul.innerHTML = "");
  source.innerHTML = "";
  originalLines.forEach(li => {
    const clone = li.cloneNode(true);
    makeDraggable(container)(clone);
    source.appendChild(clone);
  });
  container.classList.remove("parsons-correct", "parsons-incorrect");
  const msg = container.querySelector(".parsons-message");
  if (msg) msg.textContent = "";
  logCurrentState(container);
}



function showSolution(container, source, targets, expected) {
  targets.forEach(ul => ul.innerHTML = "");
  source.innerHTML = "";
  expected.forEach(exp => {
    const li = document.createElement("li");
    li.className = "parsons-line line-correct";
    li.dataset.line = exp.line;
    li.dataset.text = exp.text;
    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${li.dataset.line} |`;
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
        line: parseInt(li.dataset.line, 10)
      });
    });
  });
  console.log("Current state:", current);
}