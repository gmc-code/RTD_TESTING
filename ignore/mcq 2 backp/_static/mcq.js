document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".mcq-block").forEach(block => {
    const isRadio = block.dataset.mcqRadio === "true";
    const isSingle = block.dataset.mcqSingle === "true";

    const choices = block.querySelectorAll(".mcq-choice");

    choices.forEach(choice => {
      const input = choice.querySelector("input");

      // Function to update coloring based on correctness
      function updateColor(c) {
        if (c.classList.contains("selected")) {
          if (c.dataset.correct === "true") {
            c.classList.add("mcq-correct");
            c.classList.remove("mcq-incorrect");
          } else {
            c.classList.add("mcq-incorrect");
            c.classList.remove("mcq-correct");
          }
        } else {
          // Reset colors if deselected
          c.classList.remove("mcq-correct", "mcq-incorrect");
        }
      }

      // SINGLE MODE (no checkboxes)
      if (isSingle) {
        input.style.display = "none";

        choice.addEventListener("click", () => {
          // Unselect all
          choices.forEach(c => {
            c.classList.remove("selected");
            updateColor(c);
          });
          // Select this one
          choice.classList.add("selected");
          updateColor(choice);

          showExplanation(choice);
        });

        return;
      }

      // RADIO MODE
      if (isRadio) {
        input.type = "radio";

        input.addEventListener("change", () => {
          choices.forEach(c => {
            c.classList.remove("selected");
            updateColor(c);
          });
          choice.classList.add("selected");
          updateColor(choice);

          showExplanation(choice);
        });

        return;
      }

      // MULTI-CHECK MODE
      input.type = "checkbox";

      input.addEventListener("change", () => {
        if (input.checked) {
          choice.classList.add("selected");
        } else {
          choice.classList.remove("selected");
        }
        updateColor(choice);
        showExplanation(choice);
      });
    });

    // Hide explanations initially
    block.querySelectorAll(".mcq-explanation").forEach(exp => exp.style.display = "none");
  });

  function showExplanation(choice) {
    const exp = choice.querySelector(".mcq-explanation");
    if (exp) exp.style.display = "block";
  }
});
