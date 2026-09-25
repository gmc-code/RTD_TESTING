document.addEventListener("DOMContentLoaded", () => {
  const blocks = Array.from(document.querySelectorAll(".textselect-block"));
  if (blocks.length === 0) return;

  blocks.forEach((block) => {
    const contentPre = block.querySelector(".textselect-content");
    const targetIndices = new Set(JSON.parse(contentPre.dataset.targets || "[]"));
    const words = Array.from(block.querySelectorAll(".ts-word"));

    let isMouseDown = false;
    let lastClickedIdx = null;

    // Prevent native browser text selection while dragging over words
    contentPre.addEventListener("selectstart", (e) => {
      if (isMouseDown) e.preventDefault();
    });

    // 1. Interactive Selection Listeners
    words.forEach((word) => {
      const idx = parseInt(word.dataset.idx, 10);

      word.addEventListener("mousedown", (e) => {
        if (block.dataset.disabled === "true") return;
        isMouseDown = true;

        if (e.shiftKey && lastClickedIdx !== null) {
          const start = Math.min(lastClickedIdx, idx);
          const end = Math.max(lastClickedIdx, idx);
          for (let i = start; i <= end; i++) {
            words[i].classList.add("selected");
          }
        } else {
          word.classList.toggle("selected");
          lastClickedIdx = idx;
        }
      });

      word.addEventListener("mouseenter", () => {
        if (isMouseDown && block.dataset.disabled !== "true") {
          word.classList.add("selected");
        }
      });
    });

    window.addEventListener("mouseup", () => {
      isMouseDown = false;
    });

    // 2. Control Panel UI
    const panel = document.createElement("div");
    panel.className = "textselect-global-panel";

    const btnScore = document.createElement("button");
    btnScore.type = "button";
    btnScore.className = "textselect-btn-score";
    btnScore.textContent = "Check";

    const btnReset = document.createElement("button");
    btnReset.type = "button";
    btnReset.className = "textselect-btn-reset";
    btnReset.textContent = "Reset";

    const scoreBadge = document.createElement("span");
    scoreBadge.className = "textselect-output";
    scoreBadge.style.display = "none";

    panel.appendChild(btnScore);
    panel.appendChild(btnReset);
    panel.appendChild(scoreBadge);
    block.appendChild(panel);

    // 3. Scoring Engine & Phrase Wrapper Construction
    btnScore.addEventListener("click", () => {
      // Disable block and Check button
      block.dataset.disabled = "true";
      btnScore.disabled = true;

      let correctCount = 0;
      let totalTargets = targetIndices.size;
      let falsePositives = 0;

      const colorClassMatch = Array.from(block.classList).find((c) =>
        c.startsWith("ts-color-")
      );
      const activeColor = colorClassMatch
        ? colorClassMatch.replace("ts-color-", "")
        : "blue";

      words.forEach((word) => {
        const idx = parseInt(word.dataset.idx, 10);
        const isSelected = word.classList.contains("selected");
        const isTarget = targetIndices.has(idx);

        // Remove active drag/click selection background highlight
        word.classList.remove("selected");

        if (isSelected && isTarget) {
          word.classList.add("ts-correct-token");
          correctCount++;
        } else if (isSelected && !isTarget) {
          word.classList.add("ts-incorrect-token");
          falsePositives++;
        } else if (!isSelected && isTarget) {
          word.classList.add("ts-missed-token");
        }
      });

      // Group adjacent tokens into phrase wrappers
      groupTokens("ts-correct-token", `ts-correct-phrase ts-keep-${activeColor}`);
      groupTokens("ts-incorrect-token", "ts-incorrect-phrase");
      groupTokens("ts-missed-token", `ts-missed-phrase ts-keep-${activeColor}`);

      function groupTokens(tokenClass, wrapperClass) {
        const nodes = Array.from(contentPre.childNodes);
        let currentGroup = [];

        nodes.forEach((node, i) => {
          const isTargetToken =
            node.nodeType === 1 && node.classList.contains(tokenClass);

          // Check if this space is followed by another target token of the SAME class
          let isInternalSpace = false;
          if (
            node.nodeType === 1 &&
            node.classList.contains("ts-space") &&
            currentGroup.length > 0
          ) {
            const nextNode = nodes[i + 1];
            if (
              nextNode &&
              nextNode.nodeType === 1 &&
              nextNode.classList.contains(tokenClass)
            ) {
              isInternalSpace = true;
            }
          }

          if (isTargetToken || isInternalSpace) {
            currentGroup.push(node);
          } else {
            finalizeGroup();
          }
        });

        finalizeGroup();

        function finalizeGroup() {
          if (currentGroup.length > 0) {
            const wrapper = document.createElement("span");
            wrapper.className = wrapperClass;

            currentGroup[0].parentNode.insertBefore(wrapper, currentGroup[0]);
            currentGroup.forEach((node) => wrapper.appendChild(node));
            currentGroup = [];
          }
        }
      }

      // Output Score Badge
      scoreBadge.textContent = `Found: ${correctCount} / ${totalTargets} (Extra: ${falsePositives})`;
      scoreBadge.style.display = "inline-block";
      scoreBadge.className = "textselect-output";

      const accuracy = totalTargets === 0 ? 0 : correctCount / totalTargets;
      if (accuracy >= 0.8 && falsePositives === 0) scoreBadge.classList.add("high");
      else if (accuracy >= 0.5) scoreBadge.classList.add("medium");
      else scoreBadge.classList.add("low");
    });

    // 4. Reset Listener
    btnReset.addEventListener("click", () => {
      block.dataset.disabled = "false";

      // Re-enable the Check button
      btnScore.disabled = false;

      // Unwrap all phrase wrappers
      const wrappers = Array.from(
        block.querySelectorAll(".ts-correct-phrase, .ts-incorrect-phrase, .ts-missed-phrase")
      );
      wrappers.forEach((wrapper) => {
        while (wrapper.firstChild) {
          wrapper.parentNode.insertBefore(wrapper.firstChild, wrapper);
        }
        wrapper.remove();
      });

      words.forEach((word) => {
        word.className = "ts-word";
      });

      scoreBadge.style.display = "none";
      lastClickedIdx = null;
    });
  });
});