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

    // Store originals for reset
    container._original = Array.from(source.children);

    // Expected solution from data attribute
    container._expected = container.dataset.expected
      ? container.dataset.expected.split("|")
      : container._original.map(li => li.querySelector("pre").textContent.trim());

    // Make a line draggable + highlightable + droppable
    function makeDraggable(li) {
      li.setAttribute("draggable", "true");

      li.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", li.dataset.line || "dragging");
        container.__dragging = li;
      });

      li.addEventListener("dragenter", e => {
        e.preventDefault();
        const pre = li.querySelector("pre");
        if (pre) pre.classList.add("parsons-drop-hover");
      });

      li.addEventListener("dragleave", () => {
        const pre = li.querySelector("pre");
        if (pre) pre.classList.remove("parsons-drop-hover");
      });

      li.addEventListener("drop", e => {
        e.preventDefault();
        const pre = li.querySelector("pre");
        if (pre) pre.classList.remove("parsons-drop-hover");
        const dragged = container.__dragging;
        if (dragged && dragged !== li) {
          li.parentNode.insertBefore(dragged, li);
        }
        container.__dragging = null;
      });
    }

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

    // Shuffle helper (ensures not same as original)
    function shuffleArray(arr) {
      let shuffled;
      do {
        shuffled = arr.slice().sort(() => Math.random() - 0.5);
      } while (shuffled.every((el, i) => el === arr[i]));
      return shuffled;
    }

    // Reset
    function reset() {
      targets.forEach(ul => ul.innerHTML = "");
      source.innerHTML = "";
      const clones = container._original.map((li, idx) => {
        const clone = li.cloneNode(true);
        clone.dataset.line = idx + 1; // fixed line number
        makeDraggable(clone);
        return clone;
      });
      shuffleArray(clones).forEach(clone => source.appendChild(clone));
      container.classList.remove("parsons-correct", "parsons-incorrect");
      const msg = container.querySelector(".parsons-message");
      if (msg) msg.textContent = "";
    }

    // Check
    function check() {
      const current = [];
      targets.forEach(ul => {
        const indent = parseInt(ul.dataset.indent);
        ul.querySelectorAll(".parsons-line pre").forEach(pre => {
          current.push({ text: pre.textContent.trim(), indent });
        });
      });

      const expected = container.dataset.expected.split("|").map(line => {
        const [indent, code] = line.split("::");
        return { text: code, indent: parseInt(indent) };
      });

      const ok = current.length === expected.length &&
                 current.every((line, i) =>
                   line.text === expected[i].text && line.indent === expected[i].indent);

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

    // Initial shuffle
    reset();
  });
});
