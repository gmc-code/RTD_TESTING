(function () {
  const STORAGE_PREFIX = "sphinx_parsons_v1:";

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".parsons-container").forEach(initParsons);
  });

  /*******************
   * Helpers for line labels
   *******************/
  function addLineLabels(li) {
    if (!li.querySelector(".line-label")) {
      const lineNum = li.dataset.line || "1";
      const span = document.createElement("span");
      span.className = "line-label";
      span.textContent = lineNum + " |";
      li.prepend(span);
    }
  }

  function norm(s) {
    if (!s && s !== "") return "";
    return s.replace(/\u00A0/g, " ").replace(/\t/g, "    ").replace(/[ \f\r\v]+/g, " ").trim();
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /*******************
   * Init Parsons
   *******************/
  function initParsons(container) {
    if (!container.id) container.id = `parsons-${Date.now()}`;

    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    const controls = container.querySelector(".parsons-controls");

    const resetBtn = controls?.querySelector(".parsons-reset");
    const checkBtn = controls?.querySelector(".parsons-check");
    let solutionBtn = controls?.querySelector(".parsons-solution");
    if (!solutionBtn && controls) {
      solutionBtn = document.createElement("button");
      solutionBtn.type = "button";
      solutionBtn.textContent = "Show Solution";
      solutionBtn.className = "parsons-show-solution";
      controls.appendChild(solutionBtn);
    }

    const expected = parseExpected(container, source, targets);

    const originalLines = normalizeSourceLines(source);
    container.__originalLines = originalLines;

    const saved = loadSavedState(container.id);
    if (saved) restoreStateFromSave(container, saved);

    makeAccessible(container);

    const useSortable = typeof Sortable !== "undefined";
    if (useSortable) setupSortable(container, source, targets);
    else {
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
    logCurrentState(container);
  }

  /*******************
   * Normalize source lines
   *******************/
  function normalizeSourceLines(source) {
    let lines = Array.from(source.querySelectorAll("li"));
    if (!lines.length) {
      Array.from(source.children).forEach((node, i) => {
        const li = document.createElement("li");
        li.className = "parsons-line";
        li.dataset.line = (i + 1).toString();
        const pre = (node.tagName && (node.tagName.toLowerCase() === "pre" || node.tagName.toLowerCase() === "code"))
          ? node.cloneNode(true)
          : (() => { const p = document.createElement("pre"); p.textContent = node.textContent; return p; })();
        li.appendChild(pre);
        source.appendChild(li);
      });
      lines = Array.from(source.querySelectorAll("li"));
    }

    lines.forEach(li => addLineLabels(li));

    const shuffleJS = source.closest(".parsons-container")?.dataset.shuffleJs === "true";
    if (shuffleJS) shuffleArray(lines);

    lines.forEach((li, idx) => {
      li.classList.add("parsons-line");
      li.dataset.line = li.dataset.line || String(idx + 1);
      const pre = li.querySelector("pre");
      if (!pre) {
        const p = document.createElement("pre");
        p.textContent = li.textContent.trim();
        li.innerHTML = "";
        li.appendChild(p);
      } else pre.textContent = pre.textContent.trim();
      addLineLabels(li);
    });

    source.innerHTML = "";
    lines.forEach(li => source.appendChild(li));
    return lines;
  }

  /*******************
   * Parsing expected
   *******************/
  function parseExpected(container, source, targets) {
    const raw = container.dataset.expected;
    if (!raw) return Array.from(source.querySelectorAll("li")).map((li, idx) => ({
      number: parseInt(li.dataset.line, 10) || idx + 1,
      indent: 0,
      text: norm(li.querySelector("pre")?.textContent || li.textContent)
    }));

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((it, idx) => ({
        number: it.number ?? idx + 1,
        indent: parseInt(it.indent || 0, 10),
        text: norm(it.code ?? it.text ?? "")
      }));
    } catch (e) {
      const segments = raw.split("|").map(s => s.trim()).filter(Boolean);
      const result = [];
      const shuffledLines = Array.from(source.querySelectorAll("li"));
      segments.forEach((seg, idx) => {
        const parts = seg.includes("::") ? seg.split("::") : seg.split(/\s*\|\s*/);
        if (parts.length === 3) {
          const [num, indent, code] = parts;
          result.push({
            number: parseInt(num, 10) || (idx + 1),
            indent: parseInt(indent, 10) || 0,
            text: norm(code)
          });
        } else if (parts.length === 2) {
          const [indent, code] = parts;
          result.push({
            number: parseInt(shuffledLines[idx]?.dataset.line, 10) || (idx + 1),
            indent: parseInt(indent, 10) || 0,
            text: norm(code)
          });
        } else {
          result.push({
            number: parseInt(shuffledLines[idx]?.dataset.line, 10) || (idx + 1),
            indent: 0,
            text: norm(seg)
          });
        }
      });
      return result;
    }
  }

  /*******************
   * Render saved line
   *******************/
  function renderLineFromSaved(item) {
    const li = document.createElement("li");
    li.className = "parsons-line";
    if (item.number) li.dataset.line = item.number;
    const pre = document.createElement("pre");
    pre.textContent = item.text;
    li.appendChild(pre);
    addLineLabels(li);
    return li;
  }

  /*******************
   * Reset / Solution
   *******************/
  function reset(container) {
    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    targets.forEach(ul => ul.innerHTML = "");
    source.innerHTML = "";

    const original = container.__originalLines || [];
    original.forEach(li => {
      const clone = li.cloneNode(true);
      addLineLabels(clone);
      source.appendChild(clone);
    });

    attachKeyboardToLines(container);
    saveState(container);
    container.classList.remove("parsons-correct", "parsons-incorrect");
  }

  function showSolution(container, expected) {
    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    source.innerHTML = "";
    targets.forEach(ul => ul.innerHTML = "");

    expected.forEach(item => {
      const li = document.createElement("li");
      li.className = "parsons-line line-correct";
      if (item.number) li.dataset.line = item.number;
      const pre = document.createElement("pre");
      pre.textContent = item.text;
      li.appendChild(pre);
      addLineLabels(li);
      const target = targets[item.indent] || targets[0] || source;
      target.appendChild(li);
    });

    attachKeyboardToLines(container);
    saveState(container);
  }

  /*******************
   * Autosave
   *******************/
  function saveState(container) {
    try {
      const key = STORAGE_PREFIX + container.id;
      const payload = {
        columns: Array.from(container.querySelectorAll(".parsons-target-list")).map(ul =>
          Array.from(ul.querySelectorAll(".parsons-line")).map(li => ({
            line: li.dataset.line || null,
            text: li.querySelector("pre")?.textContent || li.textContent
          }))
        ),
        source: Array.from(container.querySelectorAll(".parsons-source .parsons-line")).map(li => ({
          line: li.dataset.line || null,
          text: li.querySelector("pre")?.textContent || li.textContent
        }))
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) { console.warn("Parsons save error:", err); }
  }

  function loadSavedState(containerId) {
    try {
      const key = STORAGE_PREFIX + containerId;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) { console.warn("Parsons load error:", err); return null; }
  }

  function restoreStateFromSave(container, saved) {
    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    source.innerHTML = "";
    targets.forEach(ul => ul.innerHTML = "");

    (saved.source || []).forEach(item => source.appendChild(renderLineFromSaved(item)));
    (saved.columns || []).forEach((col, idx) => {
      const ul = targets[idx] || targets[0];
      col.forEach(item => ul.appendChild(renderLineFromSaved(item)));
    });

    attachKeyboardToLines(container);
  }

  /*******************
   * Accessibility
   *******************/
  function makeAccessible(container) {
    const source = container.querySelector(".parsons-source");
    if (source) source.setAttribute("role", "list");

    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    targets.forEach(ul => ul.setAttribute("role", "list"));

    container.querySelectorAll(".parsons-line").forEach(li => {
      li.setAttribute("role", "listitem");
      li.setAttribute("aria-grabbed", "false");
      li.setAttribute("tabindex", "0");
    });
  }

  function attachKeyboardToLines(container) {
    container.querySelectorAll(".parsons-line").forEach(li => {
      li.setAttribute("draggable", "true");
      li.setAttribute("role", "listitem");
      li.setAttribute("tabindex", "0");
    });
  }

  function observeMutations(elem, cb) {
    const observer = new MutationObserver(() => cb());
    observer.observe(elem, { childList: true, subtree: true });
    elem.__parsonsObserver = observer;
  }

  function logCurrentState(container) {
    const current = Array.from(container.querySelectorAll(".parsons-target-list .parsons-line")).map(li => ({
      line: li.dataset.line,
      text: li.querySelector("pre")?.textContent || li.textContent
    }));
    console.debug("Parsons state:", current);
  }

})();
