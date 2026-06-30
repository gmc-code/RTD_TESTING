document.addEventListener("DOMContentLoaded", function () {
    const classificationBlocks = document.querySelectorAll(".classifying-block");

    classificationBlocks.forEach((block) => {
        const scoreBtn = block.querySelector(".classifying-btn-score");
        const resetBtn = block.querySelector(".classifying-btn-reset");
        const feedbackBadge = block.querySelector(".classifying-feedback-badge");
        const selects = block.querySelectorAll(".sorting-select");
        const rows = block.querySelectorAll(".classifying-line");

        if (!scoreBtn || !resetBtn) return;

        // 1. Check Evaluation Logic
        scoreBtn.addEventListener("click", function () {
            let totalItems = selects.length;
            let correctCount = 0;
            let allAnswered = true;

            selects.forEach((select, idx) => {
                const parentRow = rows[idx];
                const selectedValue = select.value;
                const correctValue = select.getAttribute("data-correct-bin");

                if (selectedValue === "") {
                    allAnswered = false;
                }

                // Lock dropdown so they can review their submitted answers safely
                select.disabled = true;

                if (selectedValue === correctValue) {
                    correctCount++;
                    parentRow.classList.remove("incorrect-line");
                    parentRow.classList.add("correct-line");
                } else {
                    parentRow.classList.remove("correct-line");
                    parentRow.classList.add("incorrect-line");
                }
            });

            const scorePercentage = totalItems > 0 ? (correctCount / totalItems) * 100 : 0;

            feedbackBadge.classList.remove("high", "medium", "low");
            feedbackBadge.style.display = "inline-block";

            if (scorePercentage === 100) {
                feedbackBadge.textContent = `Perfect! ${correctCount}/${totalItems} Correct`;
                feedbackBadge.classList.add("high");
            } else if (scorePercentage >= 50) {
                feedbackBadge.textContent = `Getting Close! ${correctCount}/${totalItems} Correct`;
                feedbackBadge.classList.add("medium");
            } else {
                feedbackBadge.textContent = `Try Again! ${correctCount}/${totalItems} Correct`;
                feedbackBadge.classList.add("low");
            }

            if (!allAnswered) {
                feedbackBadge.textContent += " (Incomplete)";
            }
        });

        // 2. Reset Layout Logic
        resetBtn.addEventListener("click", function () {
            selects.forEach((select) => {
                select.value = "";
                select.disabled = false; // Unlock dropdowns for another attempt
            });

            rows.forEach((row) => {
                row.classList.remove("correct-line", "incorrect-line");
            });

            feedbackBadge.style.display = "none";
            feedbackBadge.textContent = "";
            feedbackBadge.classList.remove("high", "medium", "low");
        });
    });
});