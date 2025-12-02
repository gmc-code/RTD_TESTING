document.addEventListener("DOMContentLoaded", () => {

  document.querySelectorAll(".mcq-block").forEach(block => {
    const isRadio = block.dataset.mcqRadio === "true";
    const isSingle = block.dataset.mcqSingle === "true";
    const choices = block.querySelectorAll(".mcq-choice");

    // Hide all explanations initially
    block.querySelectorAll(".mcq-explanation").forEach(exp => exp.style.display = "none");

    // Update choice appearance based on selection
    function updateChoiceState(choice, selected) {
      const input = choice.querySelector("input");
      const exp = choice.querySelector(".mcq-explanation");

      if (selected) {
        choice.classList.add("selected");
        if (choice.dataset.correct === "true") {
          choice.classList.add("mcq-correct");
          choice.classList.remove("mcq-incorrect");
        } else {
          choice.classList.add("mcq-incorrect");
          choice.classList.remove("mcq-correct");
        }
        if (exp) exp.style.display = "block";
        if (input) input.checked = true;
      } else {
        choice.classList.remove("selected", "mcq-correct", "mcq-incorrect");
        if (exp) exp.style.display = "none";
        if (input) input.checked = false;
      }
    }

    // Set up each choice
    choices.forEach(choice => {
      const input = choice.querySelector("input");

      if (isSingle) input.style.display = "none";
      if (isRadio) input.type = "radio";
      else if (!isSingle) input.type = "checkbox";

      choice.addEventListener("click", e => {
        if (isSingle || isRadio) {
          // Deselect all choices
          choices.forEach(c => updateChoiceState(c, false));
          // Select this one
          updateChoiceState(choice, true);
        } else {
          // Multi-select: toggle based on actual checkbox state
          const selected = input.checked ? false : true;
          updateChoiceState(choice, selected);
        }
        e.preventDefault(); // prevent label auto-toggle issues
      });
    });
  });

});
