(function() {
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function initParsons(container) {
    const source = container.querySelector(".parsons-source");
    const targetWrapper = container.querySelector(".parsons-target-wrapper");
    const checkBtn = container.querySelector(".parsons-check");
    const resetBtn = container.querySelector(".parsons-reset");
    const shuffleEnabled = container.dataset.shuffle === "true";

    // Initialize source lines
    let items = Array.from(source.querySelectorAll(".parsons-line"));
    if (shuffleEnabled) {
      items = shuffle(items);
      source.innerHTML = "";
      items.forEach(li => source.appendChild(li));
    }

    // Enable drag-and-drop
    [source, ...Array.from(targetWrapper.querySelectorAll(".parsons-target-list"))]
      .forEach(list => {
        list.addEventListener("dragover", e => {
          e.preventDefault();
        });
        list.addEventListener("drop", e => {
          e.preventDefault();
          const id = e.dataTransfer.getData("text/plain");
          const el = container.querySelector(`#${CSS.escape(id)}`);
          if (el) {
            list.appendChild(el);
          }
          list.classList.remove("parsons-hover");
        });
        list.addEventListener("dragenter", () => list.classList.add("parsons-hover"));
        list.addEventListener("dragleave", () => list.classList.remove("parsons-hover"));
      });

    // Make lines draggable and assign ids
    items.forEach((li) => {
      const uid = `parsons-${Math.random().toString(36).slice(2)}`;
      li.id = uid;
      li.setAttribute("draggable", "true");
      li.classList.add("no-copybutton"); // prevent copy-button overlay
      li.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", uid);
      });
    });

    // Feedback message element
    const msg = document.createElement("div");
    msg.className = "parsons-message";
    container.appendChild(msg);

    // Check logic
    function checkSolution() {
      const cols = Array.from(targetWrapper.querySelectorAll(".parsons-target-list"));
      const assembled = [];
      cols.forEach(col => {
        Array.from(col.querySelectorAll(".parsons-line")).forEach(li => {
          assembled.push(parseInt(li.dataset.index, 10));
        });
      });
      const correct = assembled.length === items.length &&
        assembled.every((val, i) => val === i);

      if (correct) {
        container.classList.add("parsons-correct");
        container.classList.remove("parsons-incorrect");
        msg.textContent = "✅ Correct!";
      } else {
        container.classList.add("parsons-incorrect");
        container.classList.remove("parsons-correct");
        msg.textContent = "❌ Try again";
      }
    }

    // Reset logic
    function reset() {
      Array.from(targetWrapper.querySelectorAll(".parsons-line")).forEach(li => {
        source.appendChild(li);
      });
      container.classList.remove("parsons-correct", "parsons-incorrect");
      msg.textContent = "";
    }

    checkBtn && checkBtn.addEventListener("click", checkSolution);
    resetBtn && resetBtn.addEventListener("click", reset);
  }

  document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".parsons-container").forEach(initParsons);
  });
})();
