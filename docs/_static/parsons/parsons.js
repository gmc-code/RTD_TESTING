document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-container").forEach(initParsons);
});

/* --------------------------------------------------------
   INITIALISATION
---------------------------------------------------------*/

function initParsons(container) {
  const source   = container.querySelector(".parsons-source");
  const targets  = container.querySelectorAll(".parsons-target-list");
  const controls = container.querySelector(".parsons-controls");

  const resetBtn = controls.querySelector(".parsons-reset");
  const checkBtn = controls.querySelector(".parsons-check");

  // Auto-add solution button
  let solutionBtn = controls.querySelector(".parsons-solution");
  if (!solutionBtn) {
    solutionBtn = createButton("parsons-solution", "Show Solution");
    controls.appendChild(solutionBtn);
  }

  // Prepare lines
  const original = normalizeSourceLines(source);
  container.__originalLines = original;
  container.__expected      = parseExpected(container, original);

  // Bind events
  resetBtn.addEventListener("click", () =>
    reset(container, source, targets)
  );
  checkBtn.addEventListener("click", () =>
    check(container)
  );
  solutionBtn.addEventListener("click", () =>
    showSolution(container)
  );

  // Enable drag/drop
  source.querySelectorAll(".parsons-line").forEach(makeDraggable(container));
  targets.forEach(enableDrop(container));
}

/* --------------------------------------------------------
   HELPERS
---------------------------------------------------------*/

function createButton(className, text) {
  const btn = document.createElement("button");
  btn.className = className;
  btn.textContent = text;
  return btn;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* Convert source <li> nodes into a clean, labelled, shuffled list */
function normalizeSourceLines(source) {
  let lines = Array.from(source.querySelectorAll("li"));
  shuffle(lines);

  lines.forEach((li, idx) => {
    li.classList.add("parsons-line");
    li.dataset.line = String(idx + 1);

    // Clean text
    let text = li.textContent.replace(/^(\d+)\s*\|/, "");
    text = text.replace(/Copy to clipboard/i, "").trim();

    // Rebuild structure
    li.innerHTML = "";
    li.append(makeSpan("line-label", `${li.dataset.line} |`));
    li.append(makePre(text));
  });

  source.innerHTML = "";
  lines.forEach(li => source.appendChild(li));

  return lines;
}

const makePre  = txt => Object.assign(document.createElement("pre"),  { textContent: txt });
const makeSpan = (cls, txt) => Object.assign(document.createElement("span"), { className: cls, textContent: txt });

/* Parse expected solution mapping */
function parseExpected(container, originalLines) {
  const raw = container.dataset.expected;
  if (!raw) {
    return originalLines.map(li => ({
      text: li.querySelector("pre").textContent.trim(),
      indent: 0,
      number: Number(li.dataset.line)
    }));
  }

  return raw.split("|").map((entry, i) => {
    const parts = entry.split("::");

    if (parts.length === 3) {
      return {
        number: Number(parts[0]),
        indent: Number(parts[1]),
        text: parts[2].trim()
      };
    }

    if (parts.length === 2) {
      return {
        number: Number(originalLines[i]?.dataset.line) || i + 1,
        indent: Number(parts[0]),
        text: parts[1].trim()
      };
    }

    throw new Error(`Invalid expected entry: ${entry}`);
  });
}

/* --------------------------------------------------------
   DRAG + DROP
---------------------------------------------------------*/

function makeDraggable(container) {
  return li => {
    li.draggable = true;

    li.addEventListener("dragstart", e => {
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

    target.addEventListener("dragleave", () =>
      target.classList.remove("parsons-drop-hover")
    );

    target.addEventListener("drop", e => {
      e.preventDefault();
      target.classList.remove("parsons-drop-hover");

      const li = container.__dragging;
      if (li) target.appendChild(li);

      log(container);
    });
  };
}

/* --------------------------------------------------------
   CORE LOGIC
---------------------------------------------------------*/

function collect(container) {
  const out = [];

  container.querySelectorAll(".parsons-target-list").forEach(ul => {
    const indent = Number(ul.dataset.indent || 0);

    ul.querySelectorAll(".parsons-line").forEach(li => {
      out.push({
        text: li.querySelector("pre").textContent.trim(),
        indent,
        number: Number(li.dataset.line)
      });
    });
  });

  return out;
}

/* Highlight lines */
function highlight(container, expected, current) {
  container.querySelectorAll(".parsons-line").forEach(li => {
    li.classList.remove("line-correct", "line-incorrect");
  });

  current.forEach((cur, i) => {
    const li = container.querySelector(
      `.parsons-line[data-line="${cur.number}"]`
    );
    if (!li) return;

    const e = expected[i];
    const correct =
      e &&
      e.text === cur.text &&
      e.indent === cur.indent &&
      e.number === cur.number;

    li.classList.add(correct ? "line-correct" : "line-incorrect");
  });
}

function check(container) {
  const expected = container.__expected;
  const current  = collect(container);
  const source   = container.querySelector(".parsons-source");

  if (source.querySelector(".parsons-line")) {
    return message(container, "✖ Move all lines before checking.", false);
  }

  const ok =
    expected.length === current.length &&
    expected.every((e, i) =>
      current[i] &&
      e.text === current[i].text &&
      e.indent === current[i].indent &&
      e.number === current[i].number
    );

  highlight(container, expected, current);
  message(container, ok ? "✅ Correct!" : "✖ Try again", ok);
}

function reset(container, source, targets) {
  targets.forEach(t => (t.innerHTML = ""));
  source.innerHTML = "";

  const fresh = normalizeSourceLines(source);
  container.__originalLines = fresh;

  fresh.forEach(li => makeDraggable(container)(li));
  message(container, "", true);
}

function showSolution(container) {
  const expected = container.__expected;
  const targets  = container.querySelectorAll(".parsons-target-list");
  const source   = container.querySelector(".parsons-source");

  targets.forEach(t => (t.innerHTML = ""));
  source.innerHTML = "";

  expected.forEach(e => {
    const li = document.createElement("li");
    li.className = "parsons-line line-correct";
    li.dataset.line = e.number;
    li.append(makeSpan("line-label", `${e.number} |`));
    li.append(makePre(e.text));

    const target = targets[e.indent] || targets[0];
    target.appendChild(li);
  });

  message(container, "✨ Solution revealed", true);
}

/* --------------------------------------------------------
   UTILITIES
---------------------------------------------------------*/

function message(container, text, ok) {
  let msg = container.querySelector(".parsons-message");
  if (!msg) {
    msg = document.createElement("div");
    msg.className = "parsons-message";
    container.appendChild(msg);
  }
  msg.textContent = text;
  msg.style.color = ok ? "#22c55e" : "#e74c3c";
}

const log = c => console.log("State:", collect(c));
