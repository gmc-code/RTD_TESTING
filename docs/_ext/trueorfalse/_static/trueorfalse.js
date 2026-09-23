(function () {
  function initTrueOrFalse() {
    const blocks = Array.from(document.querySelectorAll(".tf-block"));
    if (blocks.length === 0) return;

    blocks.forEach((block, index) => {
      // Preserve original HTML structure on first setup
      if (!block.dataset.originalChoicesHTML) {
        block.dataset.originalChoicesHTML = Array.from(
          block.querySelectorAll(".tf-choice")
        )
          .map((c) => c.outerHTML)
          .join("");
      }

      setupBlock(block, index);
    });
  }

  function setupBlock(block, index) {
    const choicesContainer = block.querySelectorAll(".tf-choice");
    const btnCheck = block.querySelector(".tf-btn-check");
    const btnReset = block.querySelector(".tf-btn-reset");
    const feedbackSpan = block.querySelector(".tf-feedback");
    const toggleCheckbox = block.querySelector(".tf-toggle-feedback");

    const groupToken = "tf_q_" + index + "_" + Date.now();

    // Track evaluated state
    block.dataset.evaluated = "false";

    // Reset controls state
    if (btnCheck) btnCheck.disabled = false;
    if (feedbackSpan) {
      feedbackSpan.textContent = "";
      feedbackSpan.className = "tf-feedback";
    }

    choicesContainer.forEach((choice) => {
      choice.classList.remove("tf-correct", "tf-incorrect", "selected", "tf-disabled");

      const input = choice.querySelector("input");
      if (input) {
        input.checked = false;
        input.disabled = false;
        input.name = groupToken;
      }

      // Hide explanations by default
      const exp = choice.querySelector(".tf-explanation");
      if (exp) exp.style.display = "none";

      input.onchange = () => {
        choicesContainer.forEach((c) => c.classList.remove("selected"));
        if (input.checked) choice.classList.add("selected");
      };

      choice.onclick = (e) => {
        if (input.disabled) return;
        if (e.target.closest("label")) return;
        input.checked = true;
        input.dispatchEvent(new Event("change"));
      };
    });

    // Handle dynamic checkbox toggle
    if (toggleCheckbox) {
      toggleCheckbox.onchange = () => {
        if (block.dataset.evaluated === "true") {
          choicesContainer.forEach((c) => {
            const exp = c.querySelector(".tf-explanation");
            if (exp) {
              exp.style.display = toggleCheckbox.checked ? "block" : "none";
            }
          });
        }
      };
    }

    if (btnCheck) {
      btnCheck.onclick = () => {
        let selectedChoice = null;

        choicesContainer.forEach((c) => {
          const input = c.querySelector("input");
          if (input && input.checked) {
            selectedChoice = c;
          }
        });

        if (!selectedChoice) {
          if (feedbackSpan) {
            feedbackSpan.textContent = "Please select an answer.";
            feedbackSpan.className = "tf-feedback incorrect";
          }
          return;
        }

        block.dataset.evaluated = "true";
        const isCorrect = selectedChoice.dataset.correct === "true";
        const showFeedbackNow = toggleCheckbox ? toggleCheckbox.checked : false;

        choicesContainer.forEach((c) => {
          const input = c.querySelector("input");
          if (input) input.disabled = true;
          c.classList.add("tf-disabled");

          const exp = c.querySelector(".tf-explanation");
          if (exp) {
            exp.style.display = showFeedbackNow ? "block" : "none";
          }
        });

        if (isCorrect) {
          selectedChoice.classList.add("tf-correct");
          if (feedbackSpan) {
            feedbackSpan.textContent = "Correct! ✓";
            feedbackSpan.className = "tf-feedback correct";
          }
        } else {
          selectedChoice.classList.add("tf-incorrect");
          choicesContainer.forEach((c) => {
            if (c.dataset.correct === "true") {
              c.classList.add("tf-correct");
            }
          });

          if (feedbackSpan) {
            feedbackSpan.textContent = "Incorrect ✕";
            feedbackSpan.className = "tf-feedback incorrect";
          }
        }

        btnCheck.disabled = true;
      };
    }

    if (btnReset) {
      btnReset.onclick = () => {
        const choices = Array.from(block.querySelectorAll(".tf-choice"));
        choices.forEach((c) => c.remove());

        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = block.dataset.originalChoicesHTML;

        const controls = block.querySelector(".tf-controls");
        Array.from(tempContainer.children).forEach((child) => {
          block.insertBefore(child, controls);
        });

        setupBlock(block, index);
      };
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTrueOrFalse);
  } else {
    initTrueOrFalse();
  }
})();