QuizGroup.register(
    QuizGroup.createFieldAdapter({
        name: "fillin",
        label: "Fill-In",
        selector: ".fillin-block",
        panelSelector: ".fillin-global-panel",
        fieldSelector: ".fillin-input",
        badgeClass: "fillin-inline-feedback",
        commitSelector: ".fillin-input", // mark on blur / Enter, not while typing

        // Case-insensitive unless the field opts in with data-case-sensitive="true".
        isCorrect: (value, expected, field) =>
            field.dataset.caseSensitive === "true"
                ? value === expected
                : value.toLowerCase() === expected.toLowerCase(),

        // On blur / Enter, mark the fields that are filled even if others are empty.
        allowPartialInstant: (block, ctx) =>
            ctx.trigger === "commit" || block.dataset.checked === "true",
    })
);
