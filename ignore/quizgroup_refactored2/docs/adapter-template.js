/*
 * TEMPLATE: copy to quizgroup/static/quizgroup/adapters/<yourtype>.js
 * (and optionally <yourtype>.css beside it). Nothing else needs to change:
 * the Python extension auto-discovers every adapters/*.js and *.css file.
 * Files whose names start with "_" are ignored.
 */

/* ---------------------------------------------------------------------
 * OPTION A - your question is "a set of inputs/selects with one correct
 * value each". Declare only what differs; the factory does the rest.
 * ------------------------------------------------------------------- */
QuizGroup.register(
    QuizGroup.createFieldAdapter({
        name: "numeric",
        label: "Numeric",
        selector: ".numeric-block",                 // root element of the question
        panelSelector: ".numeric-global-panel",     // its own Check/Reset panel (removed inside a quiz)
        fieldSelector: ".numeric-input",
        badgeClass: "numeric-inline-feedback",      // sibling span for the tick / answer
        commitSelector: ".numeric-input",           // evaluate on blur / Enter instead of every keystroke
        // Optional hooks (all have sensible defaults):
        isCorrect: (value, expected) => Math.abs(parseFloat(value) - parseFloat(expected)) < 0.01,
        defer: (block, ctx) => ctx.instant && ctx.trigger === "input" && block.dataset.checked !== "true",
        allowPartialInstant: (block, ctx) => ctx.trigger === "commit",
    })
);

/* ---------------------------------------------------------------------
 * OPTION B - anything else (drag/drop, ordering, labelled diagrams...).
 * Implement the full adapter contract documented in core.js.
 * ------------------------------------------------------------------- */
/*
QuizGroup.register({
    name: "ordering",
    label: "Ordering",
    selector: ".ordering-block",
    panelSelector: ".ordering-global-panel",

    points: (block) => block.querySelectorAll(".ordering-item").length,
    isAnswered: (block) => block.querySelector(".ordering-list").dataset.touched === "true",
    isFullyAnswered: (block) => true,

    setLocked: (block, locked) => block.classList.toggle("ordering-locked", locked),
    clearValidation: (block) => block.querySelectorAll(".ordering-item").forEach((i) => i.classList.remove("correct", "incorrect")),
    reset: (block) => { ... put items back in their starting order ... },

    evaluate(block, ctx) {
        let score = 0;
        const items = Array.from(block.querySelectorAll(".ordering-item"));
        items.forEach((item, i) => {
            const ok = Number(item.dataset.position) === i;
            item.classList.toggle("correct", ok);
            item.classList.toggle("incorrect", !ok);
            if (ok) score++;
        });
        return { score, maxScore: items.length, settled: ctx.instant };
    },

    // Only if the DOM changes without click/input/change events:
    // needsPolling: true,
    // observe(block, notify) { new MutationObserver(notify).observe(block, { childList: true, subtree: true }); },
});
*/
