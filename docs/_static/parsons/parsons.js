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
        });
      });

    // Make lines draggable and assign ids
    items.forEach((li, idx) => {
      const uid = `parsons-${Math.random().toString(36).slice(2)}`;
      li.id = uid;
      li.setAttribute("draggable", "true");
      li.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", uid);
      });
    });

    // Check logic: concatenates all target columns in left-to-right order
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
      // Simple visual feedback
      container.classList.toggle("parsons-correct", correct);
      container.classList.toggle("parsons-incorrect", !correct);
    }

    // Reset logic: move items back to source, remove feedback
    function reset() {
      Array.from(targetWrapper.querySelectorAll(".parsons-line")).forEach(li => {
        source.appendChild(li);
      });
      container.classList.remove("parsons-correct", "parsons-incorrect");
    }

    checkBtn && checkBtn.addEventListener("click", checkSolution);
    resetBtn && resetBtn.addEventListener("click", reset);
  }

  document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".parsons-container").forEach(initParsons);
  });
})();
