document.addEventListener("DOMContentLoaded", () => {
  const blocks = Array.from(document.querySelectorAll(".mcqscore-block"));
  if (blocks.length === 0) return;

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
      const span = c.querySelector(".mcqscore-letter");
      if (span) span.textContent = letters[i] || "";
    });
  }

  // ─────────────────────────────────────
  // Initialise block metadata
  // ─────────────────────────────────────
  blocks.forEach((block) => {
    if (!block.dataset.originalChoicesHTML) {
      block.dataset.originalChoicesHTML = Array.from(
        block.querySelectorAll(".mcqscore-choice")
      )
        .map(c => c.outerHTML)
        .join("");
    }

    // defaults = TRUE unless explicitly "false"
    block.dataset.mcqscoreShuffle =
      block.dataset.mcqscoreShuffle === "false" ? "false" : "true";

    block.dataset.mcqscoreLetters =
      block.dataset.mcqscoreLetters === "false" ? "false" : "true";

    block.dataset.mcqscoreSingle =
      block.dataset.mcqscoreSingle === "false" ? "false" : "true";
  });

  // ─────────────────────────────────────
  // Build / reset a block
  // ─────────────────────────────────────
  function initBlock(block, blockIndex) {
    // clear existing
    block.querySelectorAll(".mcqscore-choice").forEach(n => n.remove());

    const container = document.createElement("div");
    container.innerHTML = block.dataset.originalChoicesHTML;

    let choices = Array.from(container.children);

    // shuffle
    if (block.dataset.mcqscoreShuffle === "true") {
      shuffleArray(choices);
    }

    // append
    choices.forEach(c => block.appendChild(c));

    // letters
    if (block.dataset.mcqscoreLetters === "true") {
      assignLetters(choices);
    }

    const isSingle = block.dataset.mcqscoreSingle === "true";

    // unique radio group
    if (isSingle) {
      const name = "mcq_" + blockIndex + "_" + Date.now();
      choices.forEach(c => {
        const r = c.querySelector("input[type='radio']");
        if (r) r.name = name;
      });
    }

    // reset state
    choices.forEach(choice => {
      choice.classList.remove(
        "mcqscore-correct",
        "mcqscore-incorrect",
        "mcqscore-answer",   // ←reset
        "selected"
      );

      const input = choice.querySelector("input");
      if (input) {
        input.checked = false;
        input.disabled = false;
      }

      const exp = choice.querySelector(".mcqscore-explanation");
      if (exp) exp.style.display = "none";
    });

    // ─────────────────────────────────────
    // CLICK HANDLING (clean + reliable)
    // ─────────────────────────────────────
    choices.forEach(choice => {
      choice.addEventListener("click", (e) => {
        if (e.target.tagName === "INPUT") return; // avoid double-trigger
        const input = choice.querySelector("input");
        if (!input || input.disabled) return;

        if (isSingle) {
          // clear others
          choices.forEach(c => {
            c.classList.remove("selected");
            const i = c.querySelector("input");
            if (i) i.checked = false;
          });

          input.checked = true;
          choice.classList.add("selected");
        } else {
          // toggle
          input.checked = !input.checked;
          choice.classList.toggle("selected", input.checked);
        }
      });
    });
  }

  // initial build
  blocks.forEach((b, i) => initBlock(b, i));

  // ─────────────────────────────────────
  // Control panel
  // ─────────────────────────────────────
  const panel = document.createElement("div");
  panel.className = "mcqscore-global-panel";
  panel.style.display = "flex";
  panel.style.gap = "0.6rem";
  panel.style.marginTop = "1rem";
  panel.style.paddingTop = "0.6rem";
  panel.style.borderTop = "1px solid #ddd";

  const btnScore = document.createElement("button");
  btnScore.type = "button";
  btnScore.className = "mcqscore-btn-score";
  btnScore.textContent = "Score Page";

  const btnReset = document.createElement("button");
  btnReset.type = "button";
  btnReset.className = "mcqscore-btn-reset";
  btnReset.textContent = "Reset Page";

  const btnShow = document.createElement("button");
  btnShow.type = "button";
  btnShow.className = "mcqscore-btn-show";
  btnShow.textContent = "Show Solution";

  const scoreBadge = document.createElement("span");
  scoreBadge.style.display = "none";
  scoreBadge.style.marginLeft = "auto";
  scoreBadge.style.fontWeight = "600";

  panel.append(btnScore, btnReset, btnShow, scoreBadge);

  const lastBlock = blocks[blocks.length - 1];
  lastBlock.parentNode.insertBefore(panel, lastBlock.nextSibling);

  // ─────────────────────────────────────
  // Scoring
  // ─────────────────────────────────────

  function doScore() {
    let total = 0;
    let correct = 0;

    blocks.forEach(block => {
        total++;

        const isSingle = block.dataset.mcqscoreSingle === "true";
        const choices = Array.from(block.querySelectorAll(".mcqscore-choice"));

        // ── RESET ──
        choices.forEach(c => {
        c.classList.remove(
            "mcqscore-correct",
            "mcqscore-incorrect",
            "mcqscore-answer"
        );
        });

        // ── LAYER 1: SHOW CORRECT ANSWERS (NEUTRAL) ──
        choices.forEach(c => {
        if (c.dataset.correct === "true") {
            c.classList.add("mcqscore-answer");
        }
        });

        if (isSingle) {
        // ── SINGLE ──
        const selected = choices.find(c => c.querySelector("input")?.checked);

        if (selected) {
            if (selected.dataset.correct === "true") {
            selected.classList.add("mcqscore-correct"); // user correct
            correct++;
            } else {
            selected.classList.add("mcqscore-incorrect"); // user wrong
            }
        }

        } else {
        // ── MULTI ──
        const selected = choices.filter(c => c.querySelector("input")?.checked);
        const correctChoices = choices.filter(c => c.dataset.correct === "true");

        const allSelectedAreCorrect = selected.every(c => c.dataset.correct === "true");
        const allCorrectAreSelected = correctChoices.every(c => c.querySelector("input")?.checked);

        const isFullyCorrect =
            selected.length > 0 &&
            allSelectedAreCorrect &&
            allCorrectAreSelected;

        // mark USER selections only
        selected.forEach(c => {
            if (c.dataset.correct === "true") {
            c.classList.add("mcqscore-correct");
            } else {
            c.classList.add("mcqscore-incorrect");
            }
        });

        if (isFullyCorrect) correct++;
        }

        // ── SHOW EXPLANATIONS ──
        block.querySelectorAll(".mcqscore-explanation").forEach(e => {
        e.style.display = "block";
        });

        // ── DISABLE INPUTS ──
        block.querySelectorAll("input").forEach(i => {
        i.disabled = true;
        });
    });

    // ── SCORE BADGE ──
    scoreBadge.textContent = `Score: ${correct} / ${total}`;
    scoreBadge.style.display = "inline-block";
    scoreBadge.classList.add("mcqscore-output");

    const percent = total === 0 ? 0 : correct / total;

    scoreBadge.classList.remove("high", "medium", "low");

    if (percent >= 0.8) {
        scoreBadge.classList.add("high");
    } else if (percent >= 0.5) {
        scoreBadge.classList.add("medium");
    } else {
        scoreBadge.classList.add("low");
    }
  }

  function doReset() {
    scoreBadge.style.display = "none";
    scoreBadge.classList.remove("high", "medium", "low");
    blocks.forEach((b, i) => initBlock(b, i));
  }

  let show = false;
  function toggleSolutions() {
    show = !show;
    blocks.forEach(b => {
      b.querySelectorAll(".mcqscore-explanation").forEach(e => {
        e.style.display = show ? "block" : "none";
      });
    });
    btnShow.textContent = show ? "Hide Solution" : "Show Solution";
  }

  btnScore.onclick = doScore;
  btnReset.onclick = doReset;
  btnShow.onclick = toggleSolutions;
});