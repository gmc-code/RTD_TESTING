// mcqscore.js

document.addEventListener("DOMContentLoaded", () => {

  // Shuffle array utility
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Score MCQ blocks
  function scoreMCQBlocks(mcqBlocks, container) {
    let total = 0, correctCount = 0;

    mcqBlocks.forEach(block => {
      block.querySelectorAll(".mcqscore-choice").forEach(choice => {
        const input = choice.querySelector("input");
        const isCorrect = choice.dataset.correct === "true";

        if (input.checked) {
          total++;
          if (isCorrect) {
            correctCount++;
            choice.classList.add("mcqscore-correct");
          } else {
            choice.classList.add("mcqscore-wrong");
          }
        }

        input.disabled = true;

        // Show explanation
        const expId = choice.dataset.explanationId;
        if (expId) {
          const expDiv = document.getElementById(expId);
          if (expDiv) expDiv.style.display = "block";
        }
      });
    });

    let scoreDisplay = container.querySelector(".mcqscore-output");
    if (!scoreDisplay) {
      scoreDisplay = document.createElement("div");
      scoreDisplay.className = "mcqscore-output";
      scoreDisplay.style.fontWeight = "bold";
      scoreDisplay.style.marginTop = "0.5em";
      container.appendChild(scoreDisplay);
    }
    scoreDisplay.textContent = `Score: ${correctCount} / ${total}`;
  }

  // Reset MCQ blocks
  function resetMCQBlocks(mcqBlocks, container) {
    mcqBlocks.forEach(block => {
      const choicesContainer = block.querySelector(".mcqscore-choices");
      const choices = Array.from(block.querySelectorAll(".mcqscore-choice"));

      choices.forEach(choice => {
        choice.classList.remove("mcqscore-correct", "mcqscore-wrong", "selected");
        const input = choice.querySelector("input");
        input.checked = false;
        input.disabled = false;

        const expId = choice.dataset.explanationId;
        if (expId) {
          const expDiv = document.getElementById(expId);
          if (expDiv) expDiv.style.display = "none";
        }
      });

      // Reshuffle if needed
      if (block.dataset.shuffle === "true") {
        shuffleArray(choices);
        choices.forEach(c => choicesContainer.appendChild(c));
      }
    });

    const scoreDisplay = container.querySelector(".mcqscore-output");
    if (scoreDisplay) scoreDisplay.textContent = "";
  }

  // Process each MCQ score section
  const mcqScoreStarts = document.querySelectorAll(".mcqscore-start");

  mcqScoreStarts.forEach(mcqScoreStart => {

    // Find matching mcqscore-end
    let cursor = mcqScoreStart.nextElementSibling;
    let mcqScoreEnd = null;
    while (cursor) {
      if (cursor.classList && cursor.classList.contains("mcqscore-end")) {
        mcqScoreEnd = cursor;
        break;
      }
      cursor = cursor.nextElementSibling;
    }
    if (!mcqScoreEnd) return;

    // Wrap content between start and end
    const wrapper = document.createElement("div");
    wrapper.className = "mcqscore-wrapper";
    let sibling = mcqScoreStart.nextElementSibling;
    const nodesToWrap = [];
    while (sibling && sibling !== mcqScoreEnd) {
      nodesToWrap.push(sibling);
      sibling = sibling.nextElementSibling;
    }
    nodesToWrap.forEach(n => wrapper.appendChild(n));
    mcqScoreEnd.parentNode.insertBefore(wrapper, mcqScoreEnd);

    // Buttons container
    const btnContainer = document.createElement("div");
    btnContainer.className = "mcqscore-buttons mcqscore-buttons-sticky";

    const scoreBtn = document.createElement("button");
    scoreBtn.textContent = "Score this section";
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset section";

    btnContainer.append(scoreBtn, resetBtn);
    wrapper.appendChild(btnContainer);

    // MCQ blocks in wrapper
    const mcqBlocks = wrapper.querySelectorAll(".mcqscore-block");

    // Hook up buttons
    scoreBtn.addEventListener("click", () => scoreMCQBlocks(mcqBlocks, btnContainer));
    resetBtn.addEventListener("click", () => resetMCQBlocks(mcqBlocks, btnContainer));

    // Initial shuffle
    mcqBlocks.forEach(block => {
      if (block.dataset.shuffle === "true") {
        const choicesContainer = block.querySelector(".mcqscore-choices");
        const choices = Array.from(block.querySelectorAll(".mcqscore-choice"));
        shuffleArray(choices);
        choices.forEach(c => choicesContainer.appendChild(c));
      }
    });

    // Click handler for choices
    mcqBlocks.forEach(block => {
      const singleCorrect = block.dataset.mcqSingle === "true";
      block.addEventListener("click", e => {
        const choice = e.target.closest(".mcqscore-choice");
        if (!choice) return;

        const input = choice.querySelector("input");

        if (singleCorrect) {
          // Single choice (radio behavior)
          block.querySelectorAll(".mcqscore-choice").forEach(c => {
            c.classList.remove("selected");
            c.querySelector("input").checked = false;
          });
          choice.classList.add("selected");
          input.checked = true;
        } else {
          // Multiple choice (checkbox behavior)
          choice.classList.toggle("selected");
          input.checked = choice.classList.contains("selected");
        }
      });
    });

  });

});
