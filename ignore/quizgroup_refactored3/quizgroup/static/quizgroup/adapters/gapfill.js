QuizGroup.register(
    QuizGroup.createFieldAdapter({
        name: "gapfill",
        label: "GapFill",
        selector: ".gapfill-block",
        panelSelector: ".gapfill-global-panel",
        fieldSelector: ".gapfill-dropdown, .gapfill-input",
        badgeClass: "gapfill-inline-feedback",
        commitSelector: ".gapfill-input", // typed gaps are marked on blur / Enter; dropdowns on change
    })
);
