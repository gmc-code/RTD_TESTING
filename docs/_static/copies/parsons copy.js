/* Parsons.js - Optimized for Sphinx/RTD */
(function () {
  const STORAGE_PREFIX = "sphinx_parsons_v1:";

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".parsons-container").forEach(initParsons);
  });

  function initParsons(container, idx) {
    if (!container.id) container.id = `parsons-${Date.now()}-${idx}`;

    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    const controls = container.querySelector(".parsons-controls");

    const resetBtn = controls?.querySelector(".parsons-reset");
    const checkBtn = controls?.querySelector(".parsons-check");
    let solutionBtn = controls?.querySelector(".parsons-solution");
    if (!solutionBtn && controls) {
      solutionBtn = createButton("parsons-solution", "Show Solution");
      controls.appendChild(solutionBtn);
    }

    const expected = parseExpected(container, source);
    const originalLines = normalizeSourceLines(container, source);
    container.__originalLines = originalLines;

    // Restore saved state if present
    const saved = loadSavedState(container.id);
    if (saved) restoreStateFromSave(container, saved);

    makeAccessible(container);
    setupDnD(container, source, targets);
    attachKeyboard(container);

    // Hook buttons
    resetBtn?.addEventListener("click", () => reset(container));
    checkBtn?.addEventListener("click", () => check(container, expected));
    solutionBtn?.addEventListener("click", () => showSolution(container, expected));

    // Autosave
    observeMutations(container, () => saveState(container));

    logState(container);
  }

  /* ---------------- Helpers ---------------- */
  function createButton(cls, text) {
    const btn = document.createElement("button");
    btn.className = cls;
    btn.type = "button";
    btn.textContent = text;
    return btn;
  }

  function norm(s) {
    return (s || "")
      .replace(/\u00A0/g, " ")
      .replace(/\t/g, "    ")
      .replace(/[ \f\r\v]+/g, " ")
      .trim();
  }

  /* ---------------- Parsing Expected ---------------- */
  function parseExpected(container, source) {
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
      // fallback to pipe/:: format
    }

    const segments = raw.split("|").map(s => s.trim()).filter(Boolean);
    const lines = Array.from(source.querySelectorAll("li"));
    return segments.map((seg, idx) => {
      const parts = seg.includes("::") ? seg.split("::") : seg.split(/\s*\|\s*/);
      if (parts.length === 3) return { number: parseInt(parts[0]) || idx + 1, indent: parseInt(parts[1]) || 0, text: norm(parts[2]) };
      if (parts.length === 2) return { number: parseInt(lines[idx]?.dataset.line) || idx + 1, indent: parseInt(parts[0]) || 0, text: norm(parts[1]) };
      return { number: parseInt(lines[idx]?.dataset.line) || idx + 1, indent: 0, text: norm(seg) };
    });
  }

  /* ---------------- Source Normalization ---------------- */
  function normalizeSourceLines(container, source) {
    let lines = Array.from(source.querySelectorAll("li"));
    if (!lines.length) {
      const frag = document.createDocumentFragment();
      Array.from(source.children).forEach((node, i) => {
        const li = document.createElement("li");
        li.className = "parsons-line";
        li.dataset.line = i + 1;
        const pre = document.createElement("pre");
        pre.textContent = node.textContent.trim();
        li.appendChild(pre);
        frag.appendChild(li);
      });
      source.innerHTML = "";
      source.appendChild(frag);
      lines = Array.from(source.querySelectorAll("li"));
    }

    // Shuffle if data-shuffle-js
    if (container.dataset.shuffleJs === "true") shuffleArray(lines);

    // Normalize
    lines.forEach((li, idx) => {
      li.classList.add("parsons-line");
      li.dataset.line = li.dataset.line || idx + 1;
      let pre = li.querySelector("pre");
      if (!pre) {
        pre = document.createElement("pre");
        pre.textContent = li.textContent.trim();
        li.innerHTML = "";
        li.appendChild(pre);
      } else pre.textContent = pre.textContent.trim();
    });

    // rebuild source
    const frag = document.createDocumentFragment();
    lines.forEach(li => frag.appendChild(li));
    source.innerHTML = "";
    source.appendChild(frag);
    return lines;
  }

  /* ---------------- Drag & Drop ---------------- */
  function setupDnD(container, source, targets) {
    const useSortable = typeof Sortable !== "undefined";
    if (useSortable) {
      const group = `parsons-${container.id}`;
      const createSortable = el => Sortable.create(el, { group, animation: 150, ghostClass: "parsons-ghost", fallbackOnBody: true, swapThreshold: 0.65, onEnd: () => { attachKeyboard(container); saveState(container); }});
      createSortable(source);
      targets.forEach(createSortable);
    } else {
      source.querySelectorAll(".parsons-line").forEach(makeDraggable(container));
      targets.forEach(enableDrop(container));
    }
  }

  function makeDraggable(container) {
    return li => {
      li.setAttribute("draggable", "true");
      li.addEventListener("dragstart", e => { e.dataTransfer.setData("text/plain", li.dataset.line || "drag"); container.__dragging = li; li.classList.add("dragging"); li.setAttribute("aria-grabbed", "true"); });
      li.addEventListener("dragend", () => { li.classList.remove("dragging"); li.setAttribute("aria-grabbed", "false"); container.__dragging = null; saveState(container); });
    };
  }

  function enableDrop(container) {
    return target => {
      target.addEventListener("dragover", e => { e.preventDefault(); target.classList.add("parsons-drop-hover"); });
      target.addEventListener("dragleave", () => target.classList.remove("parsons-drop-hover"));
      target.addEventListener("drop", e => { e.preventDefault(); target.classList.remove("parsons-drop-hover"); const li = container.__dragging; if (li) { target.appendChild(li); li.setAttribute("aria-grabbed", "false"); saveState(container); attachKeyboard(container); } });
    };
  }

  /* ---------------- Keyboard ---------------- */
  function attachKeyboard(container) {
    container.querySelectorAll(".parsons-line").forEach(li => {
      li.setAttribute("tabindex", "0");
      li.setAttribute("role", "listitem");
      if (!li._bound) { li.addEventListener("keydown", e => keyboardHandler(e, li, container)); li._bound = true; }
    });
  }

  function keyboardHandler(e, li, container) {
    const key = e.key, shift = e.shiftKey;
    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    if (key === "ArrowUp" || key === "ArrowDown") { e.preventDefault(); moveWithinList(li, key === "ArrowUp" ? -1 : 1); saveState(container); }
    if (shift && (key === "ArrowLeft" || key === "ArrowRight")) { e.preventDefault(); moveBetweenColumns(li, key === "ArrowLeft" ? -1 : 1, container); saveState(container); }
    if (key === "Enter") { e.preventDefault(); li.focus(); }
  }

  function moveWithinList(li, delta) {
    const parent = li.parentElement;
    if (!parent) return;
    const items = Array.from(parent.querySelectorAll(".parsons-line"));
    const idx = items.indexOf(li);
    if (idx === -1) return;
    const newIndex = Math.max(0, Math.min(items.length - 1, idx + delta));
    if (newIndex === idx) return;
    parent.insertBefore(li, items[newIndex + (delta > 0 ? 1 : 0)]);
    li.focus();
  }

  function moveBetweenColumns(li, dir, container) {
    const columns = [container.querySelector(".parsons-source")].concat(Array.from(container.querySelectorAll(".parsons-target-list")));
    const idx = columns.indexOf(li.parentElement);
    if (idx === -1) return;
    const targetIdx = (idx + dir + columns.length) % columns.length;
    columns[targetIdx].appendChild(li);
    li.focus();
  }

  /* ---------------- Check / Reset / Solution ---------------- */
  function collectCurrent(container) {
    return Array.from(container.querySelectorAll(".parsons-target-list")).flatMap((ul, idx) =>
      Array.from(ul.querySelectorAll(".parsons-line")).map(li => ({
        text: norm(li.querySelector("pre")?.textContent || li.textContent),
        indent: parseInt(ul.dataset.indent, 10) || idx,
        number: parseInt(li.dataset.line, 10) || null,
        element: li
      }))
    );
  }

  function highlightLines(container, expected, current) {
    container.querySelectorAll(".parsons-line").forEach(li => li.classList.remove("line-correct", "line-incorrect"));
    current.forEach((c, i) => { const e = expected[i]; if (!e) return; c.element.classList.add(c.text === norm(e.text) && c.indent === e.indent && (e.number == null || c.number === e.number) ? "line-correct" : "line-incorrect"); });
  }

  function check(container, expected) {
    if (container.querySelectorAll(".parsons-source .parsons-line").length) { showMessage(container, "Move all lines into targets before checking.", false); container.classList.add("parsons-incorrect"); return; }
    const current = collectCurrent(container);
    const ok = current.length === expected.length && current.every((c,i) => c.text === norm(expected[i].text) && c.indent === expected[i].indent && (expected[i].number == null || c.number === expected[i].number));
    container.classList.toggle("parsons-correct", ok);
    container.classList.toggle("parsons-incorrect", !ok);
    showMessage(container, ok ? "✅ Correct!" : "✖ Try again", ok);
    highlightLines(container, expected, current);
  }

  function reset(container) {
    const source = container.querySelector(".parsons-source");
    const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
    targets.forEach(ul => ul.innerHTML = "");
    source.innerHTML = "";
    (container.__originalLines || []).forEach(li => source.appendChild(li.cloneNode(true)));
    attachKeyboard(container);
    saveState(container);
    container.classList.remove("parsons-correct","parsons-incorrect");
    showMessage(container,"Reset done",true);
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
      const target = targets[item.indent] || targets[0] || source;
      target.appendChild(li);
    });
    attachKeyboard(container);
    saveState(container);
    showMessage(container,"Solution shown",true);
  }

  /* ---------------- Utilities ---------------- */
  function shuffleArray(arr) { for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }
  function observeMutations(elem, cb) { const obs=new MutationObserver(()=>cb()); obs.observe(elem,{childList:true,subtree:true}); elem.__parsonsObserver=obs; }
  function logState(container) { console.debug("Parsons state:",collectCurrent(container)); }

  /* ---------------- Accessibility ---------------- */
  function makeAccessible(container) {
    const source = container.querySelector(".parsons-source");
    if (source) { source.setAttribute("role","list"); source.classList.add("parsons-role-list"); }
    Array.from(container.querySelectorAll(".parsons-target-list")).forEach(ul=>ul.setAttribute("role","list"));
    container.querySelectorAll(".parsons-line").forEach(li=>{li.setAttribute("role","listitem"); li.setAttribute("aria-grabbed","false"); li.setAttribute("tabindex","0"); });
    if (!container.querySelector(".parsons-instructions")) {
      const instr=document.createElement("div");
      instr.className="parsons-instructions";
      instr.innerHTML="Drag lines into the target columns. Keyboard: ↑/↓ move within list. Shift+←/→ move between columns.";
      container.insertBefore(instr, container.querySelector(".parsons-source"));
    }
  }

  /* ---------------- LocalStorage ---------------- */
  function saveState(container) {
    try {
      const key = STORAGE_PREFIX + container.id;
      const payload = {
        columns: Array.from(container.querySelectorAll(".parsons-target-list")).map(ul => Array.from(ul.querySelectorAll(".parsons-line")).map(li => ({line: li.dataset.line, text: li.querySelector("pre")?.textContent||li.textContent}))),
        source: Array.from(container.querySelectorAll(".parsons-source .parsons-line")).map(li => ({line: li.dataset.line, text: li.querySelector("pre")?.textContent||li.textContent}))
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch(e){console.warn("Parsons save error:",e);}
  }

  function loadSavedState(id) {
    try { const raw = localStorage.getItem(STORAGE_PREFIX + id); return raw?JSON.parse(raw):null; } catch(e){console.warn("Parsons load error:",e);return null;}
  }

  function restoreStateFromSave(container,saved){
    const source=container.querySelector(".parsons-source");
    const targets=Array.from(container.querySelectorAll(".parsons-target-list"));
    source.innerHTML="";
    targets.forEach(ul=>ul.innerHTML="");
    (saved.source||[]).forEach(item=>source.appendChild(renderSavedLine(item)));
    (saved.columns||[]).forEach((col,idx)=>{const ul=targets[idx]||targets[0]; col.forEach(item=>ul.appendChild(renderSavedLine(item)));});
    attachKeyboard(container);
  }

  function renderSavedLine(item){const li=document.createElement("li");li.className="parsons-line";if(item.line) li.dataset.line=item.line;const pre=document.createElement("pre");pre.textContent=(item.text||"").trim();li.appendChild(pre);return li;}
})();
