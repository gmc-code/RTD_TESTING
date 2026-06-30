document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll(".ordering-container");

  containers.forEach(container => {
    const block = container.closest(".ordering-block");
    const btnScore = block.querySelector(".ordering-btn-score");
    const btnReset = block.querySelector(".ordering-btn-reset");
    const feedbackBadge = block.querySelector(".ordering-feedback-badge");
    const initialHTML = container.innerHTML;

    function initPuzzleEvents() {
      const lines = container.querySelectorAll(".ordering-line");

      lines.forEach(line => {
        line.addEventListener("dragstart", (e) => {
          line.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
        });

        line.addEventListener("dragend", () => {
          line.classList.remove("dragging");
        });

        const btnIncrease = line.querySelector(".indent-btn.increase");
        const btnDecrease = line.querySelector(".indent-btn.decrease");

        btnIncrease.addEventListener("click", () => {
          if (line.classList.contains("disabled")) return;
          let currentIndent = parseInt(line.dataset.currentIndent || "0", 10);
          currentIndent++;
          line.dataset.currentIndent = currentIndent;
          line.style.setProperty("--indent-level", currentIndent);
        });

        btnDecrease.addEventListener("click", () => {
          if (line.classList.contains("disabled")) return;
          let currentIndent = parseInt(line.dataset.currentIndent || "0", 10);
          if (currentIndent > 0) {
            currentIndent--;
            line.dataset.currentIndent = currentIndent;
            line.style.setProperty("--indent-level", currentIndent);
          }
        });
      });

      container.addEventListener("dragover", (e) => {
        e.preventDefault();
        const draggingItem = container.querySelector(".dragging");
        if (!draggingItem) return;

        const siblings = Array.from(container.querySelectorAll(".ordering-line:not(.dragging)"));
        const nextSibling = siblings.find(sibling => {
          const box = sibling.getBoundingClientRect();
          return e.clientY <= box.top + box.height / 2;
        });

        if (nextSibling) {
          container.insertBefore(draggingItem, nextSibling);
        } else {
          container.appendChild(draggingItem);
        }
      });
    }

    btnScore.addEventListener("click", () => {
      const currentLines = Array.from(container.querySelectorAll(".ordering-line"));
      let allCorrect = true;

      currentLines.forEach((line, index) => {
        line.classList.add("disabled");
        line.setAttribute("draggable", "false");

        const correctIdx = parseInt(line.dataset.correctIdx, 10);
        const correctIndent = parseInt(line.dataset.correctIndent, 10);
        const currentIndent = parseInt(line.dataset.currentIndent, 10);

        line.classList.remove("correct-line", "incorrect-line");
        if (correctIdx === index && correctIndent === currentIndent) {
          line.classList.add("correct-line");
        } else {
          line.classList.add("incorrect-line");
          allCorrect = false;
        }
      });

      feedbackBadge.style.display = "inline-block";
      if (allCorrect) {
        feedbackBadge.textContent = "✓ Perfect Order & Indentation!";
        feedbackBadge.className = "ordering-feedback-badge high";
      } else {
        feedbackBadge.textContent = "✕ Some lines are out of order or wrongly indented.";
        feedbackBadge.className = "ordering-feedback-badge low";
      }
    });

    btnReset.addEventListener("click", () => {
      container.innerHTML = initialHTML;
      feedbackBadge.style.display = "none";
      feedbackBadge.textContent = "";
      initPuzzleEvents();
    });

    initPuzzleEvents();
  });
});