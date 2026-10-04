(function (QG) {
    "use strict";

    const INPUTS = "input[type='radio'], input[type='checkbox']";
    const MARKS = ["multichoice-correct", "multichoice-incorrect", "multichoice-answer"];

    const inputs = (block) => Array.from(block.querySelectorAll(INPUTS));
    const choices = (block) => Array.from(block.querySelectorAll(".multichoice-choice"));

    function hideExplanation(choice) {
        const exp = choice.querySelector(".multichoice-explanation");
        if (exp) exp.style.display = "none";
    }

    function assignLetters(list) {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        list.forEach((c, i) => {
            const span = c.querySelector(".multichoice-letter");
            if (span) span.textContent = letters[i] || "";
        });
    }

    function shuffleChoices(block) {
        const list = choices(block);
        if (list.length <= 1 || !list[0].parentNode) return;
        const container = list[0].parentNode;
        QG.util.shuffle(list).forEach((c) => container.appendChild(c));
        if (block.dataset.multichoiceLetters !== "false") assignLetters(list);
    }

    QG.register({
        name: "multichoice",
        label: "MCQ",
        selector: ".multichoice-block",
        panelSelector: ".multichoice-control-panel, .mcq-global-panel",

        points: () => 1,
        isAnswered: (block) => inputs(block).some((i) => i.checked),
        setLocked: (block, locked) => inputs(block).forEach((i) => (i.disabled = locked)),

        clearValidation(block) {
            choices(block).forEach((choice) => {
                choice.classList.remove(...MARKS);
                hideExplanation(choice);
            });
        },

        reset(block) {
            choices(block).forEach((choice) => {
                const input = choice.querySelector("input");
                if (input) input.checked = false;
                choice.classList.remove(...MARKS, "selected");
                hideExplanation(choice);
            });
            const shuffle =
                block.dataset.multichoiceShuffle === "true" ||
                block.dataset.shuffle === "true" ||
                block.classList.contains("multichoice-shuffle");
            if (shuffle) shuffleChoices(block);
        },

        evaluate(block, ctx) {
            const list = choices(block);
            if (list.length === 0) return { score: 0, maxScore: 1, settled: false };

            const answered = this.isAnswered(block);
            if (ctx.instant && !answered) {
                this.clearValidation(block);
                return { score: 0, maxScore: 1, settled: false };
            }

            let allCorrect = true;
            let selected = 0;

            list.forEach((choice) => {
                const input = choice.querySelector(INPUTS);
                const checked = input ? input.checked : false;
                const isAnswer = choice.dataset.correct === "true";
                const exp = choice.querySelector(".multichoice-explanation");

                choice.classList.remove(...MARKS);
                if (exp) exp.style.display = "none";

                if (checked) {
                    selected++;
                    if (isAnswer) {
                        choice.classList.add("multichoice-correct");
                    } else {
                        choice.classList.add("multichoice-incorrect");
                        allCorrect = false;
                    }
                    if (exp) exp.style.display = "block";
                } else if (isAnswer) {
                    allCorrect = false;
                }
            });

            return {
                score: selected > 0 && allCorrect ? 1 : 0,
                maxScore: 1,
                settled: ctx.instant && answered,
            };
        },
    });
})(window.QuizGroup);
