(function () {
  const STORAGE_PREFIX = "sphinx_parsons_v2:";

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".parsons-container").forEach(initParsons);
  });

  function initParsons(container) {
    if (!container.id) container.id = `parsons-${Date.now()}`;

    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    const controls = container.querySelector(".parsons-controls");

    const resetBtn = controls?.querySelector(".parsons-reset");
    const checkBtn = controls?.querySelector(".parsons-check");
    const solutionBtn = controls?.querySelector(".parsons-solution");

    const originalLines = normalizeSourceLines(source);
    container.__originalLines = originalLines;

    const expected = parseExpected(container, source, targets);

    const saved = loadSavedState(container.id);
    if (saved) restoreStateFromSave(container, saved);

    makeAccessible(container);

    const useSortable = typeof Sortable !== "undefined";
    if (useSortable) {
      setupSortable(container, source, targets);
    } else {
      source.querySelectorAll(".parsons-line").forEach(makeDraggable(container));
      targets.forEach(enableDrop(container));
    }

    container.querySelectorAll(".parsons-line").forEach(li => {
      li.setAttribute("tabindex", "0");
      li.addEventListener("keydown", e => keyboardHandler(e, li, container));
    });

    resetBtn?.addEventListener("click", () => reset(container));
    checkBtn?.addEventListener("click", () => check(container, expected));
    solutionBtn?.addEventListener("click", () => showSolution(container, expected));

    observeMutations(container, () => saveState(container));
  }

  // -------------------------
  // Line numbering
  // -------------------------
  function addLineNumbers(source) {
    const lines = Array.from(source.querySelectorAll(".parsons-line"));
    lines.forEach((li, idx) => {
      li.dataset.line = li.dataset.line || (idx + 1);
      const pre = li.querySelector("pre");
      if (pre && !pre.textContent.startsWith(li.dataset.line + " | ")) {
        pre.textContent = li.dataset.line + " | " + pre.textContent;
      }
    });
  }

  function getLineText(li) {
    const pre = li.querySelector("pre");
    return pre ? pre.textContent.replace(/^\d+\s\|\s/, "").trim() : li.textContent.trim();
  }

  function normalizeSourceLines(source) {
    const lines = Array.from(source.querySelectorAll("li"));
    lines.forEach(li => li.classList.add("parsons-line"));
    addLineNumbers(source);
    return lines;
  }

  function parseExpected(container, source, targets) {
    const raw = container.dataset.expected;
    const lines = Array.from(source.querySelectorAll(".parsons-line"));
    if (!raw) {
      return lines.map((li, idx) => ({
        number: parseInt(li.dataset.line, 10) || idx + 1,
        indent: 0,
        text: getLineText(li)
      }));
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        return parsed.map((it, idx) => ({
          number: it.number ?? idx + 1,
          indent: parseInt(it.indent || 0, 10),
          text: it.text ?? ""
        }));
    } catch (e) {}
    return lines.map((li, idx) => ({
      number: parseInt(li.dataset.line, 10) || idx + 1,
      indent: 0,
      text: getLineText(li)
    }));
  }

  function saveState(container) {
    try {
      const key = STORAGE_PREFIX + container.id;
      const payload = {
        columns: Array.from(container.querySelectorAll(".parsons-target-list")).map(ul =>
          Array.from(ul.querySelectorAll(".parsons-line")).map(li => ({
            line: li.dataset.line,
            text: getLineText(li)
          }))
        ),
        source: Array.from(container.querySelectorAll(".parsons-source .parsons-line")).map(li => ({
          line: li.dataset.line,
          text: getLineText(li)
        }))
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
      console.warn("Parsons save error:", err);
    }
  }

  function loadSavedState(containerId) {
    try {
      const key = STORAGE_PREFIX + containerId;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn("Parsons load error:", err);
      return null;
    }
  }

  function restoreStateFromSave(container, saved) {
    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    source.innerHTML = "";
    targets.forEach(ul => (ul.innerHTML = ""));
    (saved.source || []).forEach(item => source.appendChild(renderLine(item)));
    (saved.columns || []).forEach((col, idx) => {
      const ul = targets[idx] || targets[0];
      col.forEach(item => ul.appendChild(renderLine(item)));
    });
  }

  function renderLine(item) {
    const li = document.createElement("li");
    li.className = "parsons-line";
    li.dataset.line = item.line;
    const pre = document.createElement("pre");
    pre.textContent = item.line + " | " + item.text;
    li.appendChild(pre);
    return li;
  }

  // -------------------------
  // Accessibility + drag/keyboard
  // -------------------------
  function makeAccessible(container) {
    const source = container.querySelector(".parsons-source");
    source.setAttribute("role", "list");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    targets.forEach(ul => ul.setAttribute("role", "list"));
    container.querySelectorAll(".parsons-line").forEach(li => {
      li.setAttribute("role", "listitem");
      li.setAttribute("aria-grabbed", "false");
      li.setAttribute("tabindex", "0");
    });
  }

  function makeDraggable(container) {
    return li => {
      li.setAttribute("draggable", "true");
      li.addEventListener("dragstart", e => {
        container.__dragging = li;
        li.classList.add("dragging");
        li.setAttribute("aria-grabbed", "true");
      });
      li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        li.setAttribute("aria-grabbed", "false");
        container.__dragging = null;
        saveState(container);
      });
    };
  }

  function enableDrop(container) {
    return target => {
      target.addEventListener("dragover", e => e.preventDefault());
      target.addEventListener("drop", e => {
        e.preventDefault();
        const li = container.__dragging;
        if (li) target.appendChild(li);
        saveState(container);
      });
    };
  }

  // -------------------------
  // Check / reset / solution
  // -------------------------
  function collectCurrent(container) {
    const out = [];
    const columns = Array.from(container.querySelectorAll(".parsons-target-list"));
    columns.forEach((ul, colIdx) => {
      ul.querySelectorAll(".parsons-line").forEach(li =>
        out.push({text: getLineText(li), indent: colIdx, number: parseInt(li.dataset.line,10), element: li})
      );
    });
    return out;
  }

  function check(container, expected) {
    const current = collectCurrent(container);
    const ok = current.length === expected.length &&
      current.every((c, i) => c.text === expected[i].text && c.indent === expected[i].indent && c.number === expected[i].number);
    showMessage(container, ok ? "✅ Correct!" : "✖ Try again", ok);
    current.forEach(c => c.element.classList.toggle("line-correct", ok));
    current.forEach(c => c.element.classList.toggle("line-incorrect", !ok));
  }

  function reset(container) {
    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    source.innerHTML = "";
    targets.forEach(ul => ul.innerHTML = "");
    (container.__originalLines || []).forEach(li => source.appendChild(li.cloneNode(true)));
  }

  function showSolution(container, expected) {
    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    source.innerHTML = "";
    targets.forEach(ul => ul.innerHTML = "");
    expected.forEach(item => {
      const li = renderLine(item);
      const target = targets[item.indent] || targets[0];
      target.appendChild(li);
    });
  }

  function showMessage(container, text, ok) {
    let msg = container.querySelector(".parsons-message");
    if (!msg) {
      msg = document.createElement("div");
      msg.className = "parsons-message";
      container.appendChild(msg);
    }
    msg.textContent = text;
  }

  function observeMutations(elem, cb) {
    const observer = new MutationObserver(cb);
    observer.observe(elem, {childList: true, subtree: true});
  }

})();
