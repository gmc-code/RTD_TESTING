document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-container").forEach(initParsons);
});

function initParsons(container) {
  const source   = container.querySelector(".parsons-source");
  const targets  = container.querySelectorAll(".parsons-target-list");
  const controls = container.querySelector(".parsons-controls");

  const resetBtn    = controls.querySelector(".parsons-reset");
  const checkBtn    = controls.querySelector(".parsons-check");
  let solutionBtn   = controls.querySelector(".parsons-solution");

  if (!solutionBtn) {
    solutionBtn = createButton("parsons-solution", "Show Solution");
    controls.appendChild(solutionBtn);
  }

  // --- State ---
  // Keep a copy of the *raw* original lines before shuffling
  const rawLines = Array.from(source.querySelectorAll("li"));
  container.__rawLines = rawLines;

  // Shuffle once at init
  const originalLines = normalizeSourceLines(source, rawLines);
  container.__originalLines = originalLines;
  const expected = parseExpected(container, originalLines);

  // --- Event bindings ---
  resetBtn?.addEventListener("click", () => reset(container, source, targets));
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

// Fisher–Yates shuffle
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Normalize source: shuffle, renumber, clean text, rebuild label + pre
function normalizeSourceLines(source, rawLines) {
  let lines = shuffleArray(rawLines.map(li => li.cloneNode(true)));

  lines.forEach((li, idx) => {
    li.classList.add("parsons-line");
    li.dataset.line = idx + 1;

    let codeText = li.textContent.trim();
    codeText = codeText.replace(/^\d+\s*\|/, "");
    codeText = codeText.replace(/Copy to clipboard/i, "").trim();

    li.textContent = "";
    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${li.dataset.line} |`;
    const pre = document.createElement("pre");
    pre.textContent = codeText;
    li.appendChild(label);
    li.appendChild(pre);
  });

  source.innerHTML = "";
  lines.forEach(li => source.appendChild(li));
  return lines;
}

/*
Expected parsing:
- If container.dataset.expected is absent: build expected from shuffled source (indent = 0, number = shuffled badge).
- If present:
  - Supports "number::indent::code" (explicit mapping).
  - Or "indent::code" (numbers taken from shuffled source by index).
Segments separated by "|".
*/
function parseExpected(container, originalLines) {
  const raw = container.dataset.expected;
  if (!raw) {
    return originalLines.map(li => ({
      text: li.querySelector("pre")?.textContent.trim(),
      indent: 0,
      number: parseInt(li.dataset.line, 10)
    }));
  }

  return raw.split("|").map((seg, idx) => {
    const parts = seg.split("::");
    let number, indent, code;

    if (parts.length === 3) {
      // number::indent::code
      number = parseInt(parts[0], 10);
      indent = parseInt(parts[1], 10);
      code   = parts[2];
    } else if (parts.length === 2) {
      // indent::code, number taken from shuffled source by index
      number = parseInt(originalLines[idx]?.dataset.line, 10) || (idx + 1);
      indent = parseInt(parts[0], 10);
      code   = parts[1];
    } else {
      throw new Error("Invalid expected format. Use 'number::indent::code' or 'indent::code'.");
    }

    return {
      text: (code || "").trim(),
      indent: isFinite(indent) ? indent : 0,
      number: isFinite(number) ? number : (idx + 1)
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

/* ---------- Collection, check, and highlight ---------- */

function collectCurrent(container) {
  const current = [];
  container.querySelectorAll(".parsons-target-list").forEach(ul => {
    const indent = parseInt(ul.dataset.indent, 10) || 0;
    ul.querySelectorAll(".parsons-line").forEach(li => {
      const pre = li.querySelector("pre");
      current.push({
        text: norm(pre.textContent),
        indent,
        number: parseInt(li.dataset.line, 10)
      });
    });
  });
  return current;
}

function highlightLines(container, expected, current) {
  container.querySelectorAll(".parsons-line").forEach(li => {
    li.classList.remove("line-correct", "line-incorrect");
  });
  const placed = Array.from(container.querySelectorAll(".parsons-target-list .parsons-line"));
  placed.forEach((li, i) => {
    const e = expected[i], c = current[i];
    if (!c || !e) return;
    const isCorrect =
      c.text === e.text &&
      c.indent === e.indent &&
      c.number === e.number;
    li.classList.add(isCorrect ? "line-correct" : "line-incorrect");
  });
}

function check(container, source, targets, expected) {
  const current = collectCurrent(container);

  // Must place all lines
  if (source.querySelectorAll(".parsons-line").length > 0) {
    container.classList.add("parsons-incorrect");
    showMessage(container, "✖ Move all lines into the target area before checking.", false);
    return;
  }

  const sameLength = current.length === expected.length;
  const ok = sameLength && current.every((line, i) =>
    line.text === norm(expected[i].text) &&
    line.indent === expected[i].indent &&
    line.number === expected[i].number
  );

  container.classList.toggle("parsons-correct", ok);
  container.classList.toggle("parsons-incorrect", !ok);
  showMessage(container, ok ? "✅ Correct!" : "✖ Try again", ok);
  highlightLines(container, expected, current);

  console.log("Check result:", { ok, expected, current });
}

/* ---------- Reset and solution ---------- */

function reset(container, source, targets) {
  targets.forEach(ul => ul.innerHTML = "");
  source.innerHTML = "";

  // reshuffle from rawLines every reset
  const reshuffled = normalizeSourceLines(source, container.__rawLines);
  container.__originalLines = reshuffled;

  reshuffled.forEach(li => {
    makeDraggable(container)(li);
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
    li.dataset.line = exp.number;

    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${exp.number} |`;

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
  const current = collectCurrent(container);
  console.log("Current state:", current);
}
