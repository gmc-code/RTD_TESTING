// Parsons puzzle logic
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-container").forEach(container => {
    const source = container.querySelector(".parsons-source");
    const targets = container.querySelectorAll(".parsons-target-list");
    const resetBtn = container.querySelector(".parsons-reset");
    const checkBtn = container.querySelector(".parsons-check");

    // --- Remove copy buttons inside Parsons ---
    container.querySelectorAll(".copybtn").forEach(btn => btn.remove());
    container.querySelectorAll("div.highlight").forEach(div => {
      div.classList.add("no-copybutton");
    });

    // --- Make puzzle lines draggable ---
    container.querySelectorAll(".parsons-line").forEach(li => {
      li.setAttribute("draggable", "true");
      li.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", li.id || "");
        container.__dragging = li;
      });
    });

    // --- Allow drop on source and target lists ---
    [...targets, source].forEach(ul => {
      ul.addEventListener("dragover", e => e.preventDefault());
      ul.addEventListener("drop", e => {
        e.preventDefault();
        const li = container.__dragging;
        if (li) ul.appendChild(li);
        container.__dragging = null;
      });
    });

    // --- Reset button ---
    function reset() {
      console.log("Parsons reset");
      targets.forEach(ul => {
        ul.querySelectorAll(".parsons-line").forEach(li => {
          source.appendChild(li);
        });
      });
      container.classList.remove("parsons-correct", "parsons-incorrect");
      const msg = container.querySelector(".parsons-message");
      if (msg) msg.textContent = "";
    }

    // --- Check button ---
    function check() {
      console.log("Parsons check");
      const current = [];
      targets.forEach(ul => {
        ul.querySelectorAll(".parsons-line pre").forEach(pre => {
          current.push(pre.textContent.trim());
        });
      });
      const expected = Array.from(source.querySelectorAll(".parsons-line pre"))
        .map(pre => pre.textContent.trim());

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
