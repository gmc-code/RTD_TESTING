document.addEventListener("DOMContentLoaded", () => {
  const blocks = Array.from(document.querySelectorAll(".multichoice-block"));
  if (blocks.length === 0) return;

  // Remove any pre-existing control panels to prevent duplicate button sets
  document.querySelectorAll(".multichoice-global-panel, .multichoice-control-panel").forEach(p => p.remove());

  // ─────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function assignLetters(choices) {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    choices.forEach((c, i) => {
      const span = c.querySelector(".multichoice-letter");
      if (span) span.textContent = letters[i] || "";
    });
  }

  // Preserve original HTML structure for resets
  blocks.forEach((block) => {
    if (!block.dataset.originalChoicesHTML) {
      block.dataset.originalChoicesHTML = Array.from(
        block.querySelectorAll(".multichoice-choice")
      )
        .map(c => c.outerHTML)
        .join("");
    }

    block.dataset.multichoiceShuffle = block.dataset.multichoiceShuffle === "false" ? "false" : "true";
    block.dataset.multichoiceLetters = block.dataset.multichoiceLetters === "false" ? "false" : "true";
    block.dataset.multichoiceSingle = block.dataset.multichoiceSingle === "false" ? "false" : "true";
  });

  // ─────────────────────────────────────
  // Build and score each question independently
  // ─────────────────────────────────────
  blocks.forEach((block, blockIndex) => {

    // Function to re-initialize an individual question block
    function initBlock() {
      // Remove choices and old panels inside this block
      block.querySelectorAll(".multichoice-choice, .multichoice-control-panel").forEach(n => n.remove());

      const container = document.createElement("div");
      container.innerHTML = block.dataset.originalChoicesHTML;

      let choices = Array.from(container.children);

      if (block.dataset.multichoiceShuffle === "true") {
        shuffleArray(choices);
      }

      choices.forEach(c => block.appendChild(c));

      if (block.dataset.multichoiceLetters === "true") {
        assignLetters(choices);
      }

      const isSingle = block.dataset.multichoiceSingle === "true";
      const uniqueGroupToken = "mcq_" + blockIndex + "_" + Date.now();

      choices.forEach(choice => {
        choice.classList.remove(
          "multichoice-correct",
          "multichoice-incorrect",
          "multichoice-answer",
          "selected"
        );

        const input = choice.querySelector("input");
        if (input) {
          input.checked = false;
          input.disabled = false;
          if (isSingle) input.name = uniqueGroupToken;
        }

        const exp = choice.querySelector(".multichoice-explanation");
        if (exp) exp.style.display = "none";
      });

      // Selection Interaction Event Handlers
      choices.forEach(choice => {
        const input = choice.querySelector("input");
        if (!input) return;

        choice.style.cursor = "pointer";

        input.addEventListener("change", () => {
          if (isSingle) {
            choices.forEach(c => c.classList.remove("selected"));
            if (input.checked) choice.classList.add("selected");
          } else {
            choice.classList.toggle("selected", input.checked);
          }
        });

        choice.addEventListener("click", (e) => {
          if (input.disabled) return;
          if (e.target.closest("label")) return;

          input.checked = isSingle ? true : !input.checked;
          input.dispatchEvent(new Event("change"));
        });
      });

      // Build Per-Question Control Panel
      buildPanelForBlock();
    }

    // Function to assemble the control panel for this block
    function buildPanelForBlock() {
      const panel = document.createElement("div");
      panel.className = "multichoice-control-panel";
      panel.style.display = "flex";
      panel.style.alignItems = "center";
      panel.style.gap = "0.8rem";

      const btnScore = document.createElement("button");
      btnScore.type = "button";
      btnScore.className = "multichoice-btn-score";
      btnScore.textContent = "Check Answer";

      const btnReset = document.createElement("button");
      btnReset.type = "button";
      btnReset.className = "multichoice-btn-reset";
      btnReset.textContent = "Reset";

      const toggleWrapper = document.createElement("label");
      toggleWrapper.className = "multichoice-toggle-wrapper";
      toggleWrapper.style.display = "flex";
      toggleWrapper.style.alignItems = "center";
      toggleWrapper.style.gap = "0.4rem";
      toggleWrapper.style.cursor = "pointer";
      toggleWrapper.style.fontSize = "0.9em";
      toggleWrapper.style.userSelect = "none";

      const chkShowFeedback = document.createElement("input");
      chkShowFeedback.type = "checkbox";
      chkShowFeedback.checked = false; // Default to not showing detailed feedback on check

      const toggleLabel = document.createElement("span");
      toggleLabel.textContent = "Show feedback";

      toggleWrapper.append(chkShowFeedback, toggleLabel);

      const scoreBadge = document.createElement("span");
      scoreBadge.className = "multichoice-output";

      panel.append(btnScore, btnReset, toggleWrapper, scoreBadge);
      block.appendChild(panel);

      // Score Action for this specific question block
      btnScore.onclick = () => {
        const choices = Array.from(block.querySelectorAll(".multichoice-choice"));
        const displayFeedback = chkShowFeedback.checked;
        let blockIsFullyCorrect = true;

        choices.forEach(c => {
          c.classList.remove("multichoice-correct", "multichoice-incorrect", "multichoice-answer");
          const isChecked = c.querySelector("input")?.checked || false;
          const isAnswerCorrect = c.dataset.correct === "true";

          if (isAnswerCorrect) {
            c.classList.add("multichoice-answer");
          }

          if (isChecked) {
            if (isAnswerCorrect) {
              c.classList.add("multichoice-correct");
            } else {
              c.classList.add("multichoice-incorrect");
              blockIsFullyCorrect = false;
            }
          } else {
            if (isAnswerCorrect) {
              blockIsFullyCorrect = false;
            }
          }
        });

        // Toggle explanations based on checkbox
        block.querySelectorAll(".multichoice-explanation").forEach(e => {
          e.style.display = displayFeedback ? "block" : "none";
        });

        // Disable input selections
        block.querySelectorAll("input").forEach(i => {
          i.disabled = true;
        });

        // Lock button controls for this card
        btnScore.disabled = true;
        chkShowFeedback.disabled = true;
        toggleWrapper.style.opacity = "0.5";
        toggleWrapper.style.cursor = "not-allowed";

        // Display performance badge
        scoreBadge.style.display = "inline-block";
        scoreBadge.classList.remove("high", "medium", "low");

        if (blockIsFullyCorrect) {
          scoreBadge.textContent = "Correct!";
          scoreBadge.classList.add("high");
        } else {
          scoreBadge.textContent = "Incorrect";
          scoreBadge.classList.add("low");
        }
      };

      // Reset Action for this specific question block
      btnReset.onclick = () => {
        initBlock();
      };
    }

    // Initialize block on startup
    initBlock();
  });
});