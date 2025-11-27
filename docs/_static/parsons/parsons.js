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

    // Shuffle client-side if requested
    if (container.dataset.shuffleJs === "true") {
      const items = Array.from(source.children);
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      items.forEach(li => source.appendChild(li));
    }

    // Make lines draggable
    function makeDraggable(li) {
      li.setAttribute("draggable", "true");
      li.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", li.id || "");
        container.__dragging = li;
      });
    }
    container.querySelectorAll(".parsons-line").forEach(makeDraggable);

    // Allow drop and highlighting
    [...targets, source].forEach(ul => {
      ul.addEventListener("dragover", e => e.preventDefault());

      ul.addEventListener("dragenter", e => {
        e.preventDefault();
        ul.classList.add("parsons-drop-hover");
      });

      ul.addEventListener("dragleave", e => {
        ul.classList.remove("parsons-drop-hover");
      });

      ul.addEventListener("drop", e => {
        e.preventDefault();
        ul.classList.remove("parsons-drop-hover");
        const li = container.__dragging;
        if (li) ul.appendChild(li);
        container.__dragging = null;
      });
    });
    // line highoighting

    container.querySelectorAll(".parsons-line").forEach(li => {
      li.addEventListener("dragenter", e => {
        e.preventDefault();
        li.classList.add("parsons-drop-hover");
      });
      li.addEventListener("dragleave", e => {
        li.classList.remove("parsons-drop-hover");
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
        ul.querySelectorAll(".parsons-line pre").forEach(pre => {
          current.push(pre.textContent.trim());
        });
      });

      const expected = container._expected;
      const ok = current.length === expected.length &&
                 current.every((line, i) => line === expected[i]);

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
