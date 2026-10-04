QuizGroup.register(
    QuizGroup.createFieldAdapter({
        name: "fillin",
        label: "Fill-In",
        selector: ".fillin-block",
        panelSelector: ".fillin-global-panel",
        fieldSelector: ".fillin-input",
        badgeClass: "fillin-inline-feedback",
        commitSelector: ".fillin-input", // mark on blur / Enter, not on every keystroke

        // Case-insensitive unless the field opts in with data-case-sensitive="true".
        isCorrect: (value, expected, field) =>
            field.dataset.caseSensitive === "true"
                ? value === expected
                : value.toLowerCase() === expected.toLowerCase(),

        // Don't mark while the student is still typing in instant-feedback mode.
        defer: (block, ctx) =>
            ctx.instant && ctx.trigger === "input" && block.dataset.checked !== "true",

        // On blur / Enter, mark the fields that are filled even if others are empty.
        allowPartialInstant: (block, ctx) =>
            ctx.trigger === "commit" || block.dataset.checked === "true",
    })
);
