document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-container").forEach(container => {
    const source   = container.querySelector(".parsons-source");
    const targets  = container.querySelectorAll(".parsons-target-list");
    const resetBtn = container.querySelector(".parsons-reset");
    const checkBtn = container.querySelector(".parsons-check");

    // Remove copy buttons
    container.querySelectorAll(".copybtn").forEach(btn => btn.remove());
    container.querySelectorAll("div.highlight").forEach(div => {
      div.classList.add("no-copybutton");
    });

    // Normalize lines: wrap text in <pre> if missing
    source.querySelectorAll("li").forEach(li => {
      if (!li.classList.contains("parsons-line")) {
        li.classList.add("parsons-line");
      }
      if (!li.querySelector("pre")) {
        const pre = document.createElement("pre");
        pre.textContent = li.textContent.trim();
        li.textContent = "";
        li.appendChild(pre);
      }
    });

    // Store originals for reset
    container._original = Array.from(source.querySelectorAll(".parsons-line"));

    // Expected solution from data attribute (indent::code segments)
    container._expected = container.dataset.expected
      ? container.dataset.expected.split("|").map(seg => {
          const [indent, code] = seg.split("::");
          return { text: code.trim(), indent: parseInt(indent, 10) };
        })
      : container._original.map(li => ({
          text: (li.querySelector("pre")?.textContent || li.textContent).trim(),
          indent: 0
        }));

    // Shuffle client-side if requested
    if (container.dataset.shuffleJs === "true") {
      const items = Array.from(source.children);
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      items.forEach(li => source.appendChild(li));
    }

    // Make a line draggable + droppable
    function makeDraggable(li) {
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

    // Initialize lines
    container.querySelectorAll(".parsons-line").forEach(makeDraggable);

    // Lists accept drops (drop at end of list)
    [...targets, source].forEach(ul => {
      ul.addEventListener("dragover", e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
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
          ul.appendChild(dragged); // drop to end if not on a line
        }
        container.__dragging = null;
      });
    });

    // Reset
    function reset() {
      targets.forEach(ul => ul.innerHTML = "");
      source.innerHTML = "";
      container._original.forEach(li => {
        const clone = li.cloneNode(true);
        makeDraggable(clone);
        source.appendChild(clone);
      });
      container.classList.remove("parsons-correct", "parsons-incorrect");
      const msg = container.querySelector(".parsons-message");
      if (msg) msg.textContent = "";
    }

    // Check
    function check() {
      const current = [];
      targets.forEach(ul => {
        const indent = parseInt(ul.dataset.indent, 10);
        ul.querySelectorAll(".parsons-line pre").forEach(pre => {
          current.push({ text: pre.textContent.trim(), indent });
        });
      });

      const expected = container._expected;
      const ok = current.length === expected.length &&
                 current.every((line, i) =>
                   line.text === expected[i].text &&
                   line.indent === expected[i].indent
                 );

      container.classList.toggle("parsons-correct", ok);
      container.classList.toggle("parsons-incorrect", !ok);

      let msg = container.querySelector(".parsons-message");
      if (!msg) {
        msg = document.createElement("div");
        msg.className = "parsons-message";
        container.appendChild(msg);
      }
      msg.textContent = ok ? "✅ Correct!" : "✖ Try again";
    }

    resetBtn && resetBtn.addEventListener("click", reset);
    checkBtn && checkBtn.addEventListener("click", check);
  });
});
