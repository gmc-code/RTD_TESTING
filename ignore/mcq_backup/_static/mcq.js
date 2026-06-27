document.addEventListener("DOMContentLoaded", () => {
  const mcqBlocks = document.querySelectorAll(".mcq-block");

  mcqBlocks.forEach(block => {
    const inputs = block.querySelectorAll(".mcq-choice input");

    inputs.forEach(input => {
      input.addEventListener("change", () => {
        const parentDiv = input.closest(".mcq-choice");
        if (input.type === "radio") {
          // Remove .selected from siblings
          inputs.forEach(i => i.closest(".mcq-choice").classList.remove("selected"));
          parentDiv.classList.add("selected");
        } else {
          // Toggle .selected for checkboxes
          parentDiv.classList.toggle("selected");
        }

        // Show explanation
        const explanation = parentDiv.querySelector(".mcq-explanation");
        if (explanation) {
          explanation.style.display = "block";
        }
      });
    });

    // Hide all explanations initially
    block.querySelectorAll(".mcq-explanation").forEach(exp => exp.style.display = "none");
  });
});
