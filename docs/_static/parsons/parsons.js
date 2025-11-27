document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-container").forEach(container => {
    // Ensure controls & target wrapper exist (create if missing)
    let source = container.querySelector(".parsons-source");
    let targetWrapper = container.querySelector(".parsons-target-wrapper");
    let resetBtn = container.querySelector(".parsons-reset");
    let checkBtn = container.querySelector(".parsons-check");
    let message = container.querySelector(".parsons-message");

    // Create basic scaffolding if not present
    if (!source) {
      source = document.createElement("ul");
      source.className = "parsons-source";
      container.appendChild(source);
    }
    if (!targetWrapper) {
      targetWrapper = document.createElement("div");
      targetWrapper.className = "parsons-target-wrapper";
      container.appendChild(targetWrapper);
    }
    if (!resetBtn || !checkBtn) {
      const controls = document.createElement("div");
      controls.className = "parsons-controls";
      resetBtn = document.createElement("button");
      resetBtn.className = "parsons-reset";
      resetBtn.textContent = "Reset";
      checkBtn = document.createElement("button");
      checkBtn.className = "parsons-check";
      checkBtn.textContent = "Check";
      controls.append(resetBtn, checkBtn);
      container.appendChild(controls);
    }
    if (!message) {
      message = document.createElement("div");
      message.className = "parsons-message";
      container.appendChild(message);
    }

    // Build 4 indent columns if requested or if none exist
    const existingTargets = container.querySelectorAll(".parsons-target-list");
    if (existingTargets.length === 0 || container.classList.contains("parsons-cols-4") || container.dataset.indentLevels === "4") {
      container.classList.add("parsons-cols-4");
      targetWrapper.innerHTML = "";
      for (let level = 0; level < 4; level++) {
        const col = document.createElement("div");
        const label = document.createElement("div");
        label.className = "parsons-target-label";
        label.textContent = `Indent ${level}`;
        const ul = document.createElement("ul");
        ul.className = "parsons-target-list";
        ul.dataset.indent = String(level);
        col.append(label, ul);
        targetWrapper.appendChild(col);
      }
    }

    const targets = container.querySelectorAll(".parsons-target-list");

    // Remove copy buttons / strip highlight wrappers
    container.querySelectorAll(".copybtn").forEach(btn => btn.remove());
    container.querySelectorAll("div.highlight").forEach(div => div.classList.add("no-copybutton"));

    // Collect original lines (from any .parsons-line inside the container)
    // If the directive already rendered lines inside another UL, move them into source.
    const initialLines = Array.from(container.querySelectorAll(".parsons-line"));
    // If lines are not under .parsons-source yet, append them there
    initialLines.forEach(li => {
      if (li.parentElement !== source) source.appendChild(li);
    });

    // Store originals (clean clones used for each reset)
    container._original = initialLines.map(li => li.cloneNode(true));

    // Expected solution (indent::code segments)
    const expectedAttr = container.dataset.expected || "";
    const expected = expectedAttr
      ? expectedAttr.split("|").map(seg => {
          const [indent, code] = seg.split("::");
          return { text: code.trim(), indent: parseInt(indent, 10) };
        })
      : initialLines.map((li, i) => ({ text: li.querySelector("pre").textContent.trim(), indent: 0 }));

    // Make a line draggable + highlightable + droppable
    function makeDraggable(li) {
      li.setAttribute("draggable", "true");

      li.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", li.dataset.line || "dragging");
        e.dataTransfer.effectAllowed = "move";
        container.__dragging = li;
        li.classList.add("dragging");
      });

      li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        container.__dragging = null;
      });

      li.addEventListener("dragenter", e => {
        e.preventDefault();
        li.classList.add("parsons-drop-hover");
      });

      li.addEventListener("dragleave", () => {
        li.classList.remove("parsons-drop-hover");
      });

      li.addEventListener("drop", e => {
        e.preventDefault();
        li.classList.remove("parsons-drop-hover");
        const dragged = container.__dragging;
        if (dragged && dragged !== li) {
          li.parentNode.insertBefore(dragged, li);
        }
        container.__dragging = null;
      });
    }

    // Lists accept drops (position by pointer Y)
    function setupDropZones() {
      [...targets, source].forEach(ul => {
        ul.addEventListener("dragover", e => {
          e.preventDefault();
          const dragging = container.querySelector(".dragging");
          if (!dragging) return;
          const siblings = Array.from(ul.children).filter(c => c !== dragging);
          const y = e.clientY;
          let insertBeforeNode = null;
          for (const sib of siblings) {
            const rect = sib.getBoundingClientRect();
            const mid = rect.top + rect.height / 2;
            if (y < mid) {
              insertBeforeNode = sib;
              break;
            }
          }
          if (insertBeforeNode) ul.insertBefore(dragging, insertBeforeNode);
          else ul.appendChild(dragging);
        });

        ul.addEventListener("dragenter", e => {
          e.preventDefault();
          ul.classList.add("parsons-drop-hover");
        });
        ul.addEventListener("dragleave", () => {
          ul.classList.remove("parsons-drop-hover");
        });
        ul.addEventListener("drop", e => {
          e.preventDefault();
          ul.classList.remove("parsons-drop-hover");
          const dragged = container.__dragging;
          if (dragged) {
            ul.appendChild(dragged); // ensure drop at end if not over a line
          }
          container.__dragging = null;
        });
      });
    }

    function shuffleArray(arr) {
      // Durstenfeld shuffle
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function notSameAsExpectedOrder(shuffled, expectedTexts) {
      const texts = shuffled.map(li => li.querySelector("pre").textContent.trim());
      return !texts.every((t, i) => t === expectedTexts[i]);
    }

    function reset() {
      // Clear targets and source
      targets.forEach(ul => (ul.innerHTML = ""));
      source.innerHTML = "";

      // Rebuild clones with fixed numbering
      const clones = container._original.map((li, idx) => {
        const c = li.cloneNode(true);
        c.dataset.line = String(idx + 1); // fixed number
        makeDraggable(c);
        return c;
      });

      // Shuffle until not equal to expected order
      const expectedTexts = expected.map(e => e.text);
      let shuffled = shuffleArray(clones);
      if (!notSameAsExpectedOrder(shuffled, expectedTexts)) {
        // Try again to avoid original order
        shuffled = shuffleArray(clones);
      }

      // Put shuffled into source
      shuffled.forEach(c => source.appendChild(c));

      // Clear feedback
      container.classList.remove("parsons-correct", "parsons-incorrect");
      message.textContent = "";
    }

    function check() {
      const current = [];
      targets.forEach(ul => {
        const indent = parseInt(ul.dataset.indent, 10);
        ul.querySelectorAll(".parsons-line pre").forEach(pre => {
          current.push({ text: pre.textContent.trim(), indent });
        });
      });

      const ok =
        current.length === expected.length &&
        current.every((line, i) => line.text === expected[i].text && line.indent === expected[i].indent);

      container.classList.toggle("parsons-correct", ok);
      container.classList.toggle("parsons-incorrect", !ok);
      message.textContent = ok ? "✅ Correct!" : "✖ Try again";
    }

    // Init
    initialLines.forEach(makeDraggable);
    setupDropZones();

    resetBtn.addEventListener("click", reset);
    checkBtn.addEventListener("click", check);

    reset(); // initial shuffle
  });
});
