document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll(".ordering-container");

  containers.forEach(container => {
    const block = container.closest(".ordering-block");
    const completedCodeBlock = block.querySelector(".ordering-completed-code");

    const btnScore = block.querySelector(".ordering-btn-score");
    const btnContinue = block.querySelector(".ordering-btn-continue");
    const btnSolution = block.querySelector(".ordering-btn-solution");
    const btnReset = block.querySelector(".ordering-btn-reset");
    const feedbackBadge = block.querySelector(".ordering-feedback-badge");
    const initialHTML = container.innerHTML;

    const noReorder = container.dataset.noReorder === "true";

    const isFixed = line => line.classList.contains("ordering-fixed");
    const correctIdxOf = line => parseInt(line.dataset.correctIdx, 10);

    // Places the movable lines (in the order given) around the fixed lines,
    // which always stay in their correct slots. Only touches the DOM if the
    // resulting order differs from what is already displayed.
    function applyLayout(movableOrder) {
      const current = Array.from(container.querySelectorAll(".ordering-line"));
      const slots = new Array(current.length).fill(null);

      current.filter(isFixed).forEach(line => {
        const idx = correctIdxOf(line);
        if (idx >= 0 && idx < slots.length && !slots[idx]) slots[idx] = line;
      });

      let next = 0;
      for (let i = 0; i < slots.length; i++) {
        if (!slots[i]) slots[i] = movableOrder[next++];
      }

      const changed = slots.some((line, i) => line !== current[i]);
      if (changed) slots.forEach(line => container.appendChild(line));
    }

    // Helper to dynamically shuffle the movable lines and ensure the result
    // is not identical to the correct order (fixed lines stay where they are)
    function shuffleLines() {
      if (noReorder) return;

      const lines = Array.from(container.querySelectorAll(".ordering-line"))
        .filter(line => !isFixed(line));
      if (lines.length <= 1) return;

      let isIdentical = true;
      let attempts = 0;

      while (isIdentical && attempts < 50) {
        // Perform Fisher-Yates Shuffle
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const temp = lines[i];
          lines[i] = lines[j];
          lines[j] = temp;
        }

        // Movable lines are in the correct order when their correct_idx ascends
        isIdentical = lines.every((line, index) => {
          return index === 0 || correctIdxOf(lines[index - 1]) < correctIdxOf(line);
        });

        attempts++;
      }

      applyLayout(lines);
    }

    // Helper to clear evaluation styles and feedback
    function clearFeedback() {
      feedbackBadge.style.display = "none";
      feedbackBadge.textContent = "";
      if (btnContinue) btnContinue.style.display = "none";
      const lines = container.querySelectorAll(".ordering-line");
      lines.forEach(line => {
        line.classList.remove("correct-line", "incorrect-line");
      });

      // Ensure completed code block is hidden during active user attempts
      if (completedCodeBlock) {
        completedCodeBlock.style.display = "none";
      }
    }

    // Initializes dragging mechanics and click-to-indent listeners on the lines
    function initPuzzleEvents() {
      const lines = container.querySelectorAll(".ordering-line");

      lines.forEach(line => {
        // Fixed lines cannot be dragged or re-indented
        if (isFixed(line)) return;

        // Drag Handling Events
        line.addEventListener("dragstart", (e) => {
          if (line.classList.contains("disabled")) return;
          clearFeedback();
          line.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
        });

        line.addEventListener("dragend", () => {
          line.classList.remove("dragging");
        });

        // Indentation Control Events
        const btnIncrease = line.querySelector(".indent-btn.increase");
        const btnDecrease = line.querySelector(".indent-btn.decrease");

        if (btnIncrease) {
          btnIncrease.addEventListener("click", () => {
            if (line.classList.contains("disabled")) return;
            clearFeedback();
            let currentIndent = parseInt(line.dataset.currentIndent || "0", 10);
            currentIndent++;
            line.dataset.currentIndent = currentIndent;
            line.style.setProperty("--indent-level", currentIndent);
          });
        }

        if (btnDecrease) {
          btnDecrease.addEventListener("click", () => {
            if (line.classList.contains("disabled")) return;
            clearFeedback();
            let currentIndent = parseInt(line.dataset.currentIndent || "0", 10);
            if (currentIndent > 0) {
              currentIndent--;
              line.dataset.currentIndent = currentIndent;
              line.style.setProperty("--indent-level", currentIndent);
            }
          });
        }
      });
    }

    // Drag Sorting Over Container Area (registered once; survives Reset).
    // The dragged line is slotted among the other movable lines, then the
    // fixed lines are kept pinned to their own positions.
    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingItem = container.querySelector(".dragging");
      if (!draggingItem) return;

      const movable = Array.from(
        container.querySelectorAll(".ordering-line:not(.dragging)")
      ).filter(line => !isFixed(line));

      const nextIndex = movable.findIndex(sibling => {
        const box = sibling.getBoundingClientRect();
        return e.clientY <= box.top + box.height / 2;
      });

      if (nextIndex === -1) {
        movable.push(draggingItem);
      } else {
        movable.splice(nextIndex, 0, draggingItem);
      }

      applyLayout(movable);
    });

    // 1. Scoring Engine Mechanics
    if (btnScore) {
      btnScore.addEventListener("click", () => {
        // Disable Check button immediately upon score calculation
        btnScore.disabled = true;

        const currentLines = Array.from(container.querySelectorAll(".ordering-line"));
        let totalLines = 0;
        let correctCount = 0;

        currentLines.forEach((line, index) => {
          // Fixed lines are given, so they are not marked or scored
          if (isFixed(line)) return;
          totalLines++;

          const correctIdx = parseInt(line.dataset.correctIdx, 10);
          const correctIndent = parseInt(line.dataset.correctIndent, 10);
          const currentIndent = parseInt(line.dataset.currentIndent, 10);

          line.classList.remove("correct-line", "incorrect-line");
          if (correctIdx === index && correctIndent === currentIndent) {
            line.classList.add("correct-line");
            correctCount++;
          } else {
            line.classList.add("incorrect-line");
          }
        });

        const finalPercentage = totalLines === 0
          ? 100
          : Math.round((correctCount / totalLines) * 100);
        feedbackBadge.style.display = "inline-flex";
        feedbackBadge.className = "ordering-feedback-badge";

        if (finalPercentage === 100) {
          feedbackBadge.textContent = `✓ Perfect! ${correctCount}/${totalLines} (${finalPercentage}%)`;
          feedbackBadge.classList.add("high");
          if (btnContinue) btnContinue.style.display = "none";

          // Show completed code block ONLY when student gets 100% on their own
          if (completedCodeBlock) {
            completedCodeBlock.style.display = "block";
          }
        } else {
          if (btnContinue) btnContinue.style.display = "inline-flex";

          if (completedCodeBlock) {
            completedCodeBlock.style.display = "none";
          }

          if (finalPercentage >= 50) {
            feedbackBadge.textContent = `⚠ Getting Close! ${correctCount}/${totalLines} (${finalPercentage}%)`;
            feedbackBadge.classList.add("medium");
          } else {
            feedbackBadge.textContent = `✕ Keep Trying! ${correctCount}/${totalLines} (${finalPercentage}%)`;
            feedbackBadge.classList.add("low");
          }
        }
      });
    }

    // 2. Continue Engine Mechanics
    if (btnContinue) {
      btnContinue.addEventListener("click", () => {
        clearFeedback();
        if (btnScore) btnScore.disabled = false;
        if (btnSolution) btnSolution.disabled = false; // Re-enable solution button on Continue
      });
    }

    // 3. Solution Engine Mechanics
    if (btnSolution) {
      btnSolution.addEventListener("click", () => {
        const currentLines = Array.from(container.querySelectorAll(".ordering-line"));

        currentLines.sort((a, b) => {
          return parseInt(a.dataset.correctIdx, 10) - parseInt(b.dataset.correctIdx, 10);
        });

        currentLines.forEach(line => {
          container.appendChild(line);

          const targetIndent = line.dataset.correctIndent;
          line.dataset.currentIndent = targetIndent;
          line.style.setProperty("--indent-level", targetIndent);

          line.classList.add("disabled");
          line.classList.remove("incorrect-line");
          // Fixed lines keep their own colour rather than turning green
          if (!isFixed(line)) line.classList.add("correct-line");
          line.setAttribute("draggable", "false");
        });

        // Disable Check and Solution buttons after displaying solution
        if (btnScore) btnScore.disabled = true;
        btnSolution.disabled = true;

        if (btnContinue) btnContinue.style.display = "none";

        feedbackBadge.style.display = "inline-flex";
        feedbackBadge.textContent = "ℹ Solution Displayed";
        feedbackBadge.className = "ordering-feedback-badge medium";

        if (completedCodeBlock) {
          completedCodeBlock.style.display = "none";
        }
      });
    }

    // 4. Reset Engine Mechanics
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        container.innerHTML = initialHTML;
        feedbackBadge.style.display = "none";
        feedbackBadge.textContent = "";
        if (btnContinue) btnContinue.style.display = "none";

        // Re-enable Check and Solution buttons on Reset
        if (btnScore) btnScore.disabled = false;
        if (btnSolution) btnSolution.disabled = false;

        if (completedCodeBlock) {
          completedCodeBlock.style.display = "none";
        }

        shuffleLines();
        initPuzzleEvents();
      });
    }

    shuffleLines();
    initPuzzleEvents();
  });
});
