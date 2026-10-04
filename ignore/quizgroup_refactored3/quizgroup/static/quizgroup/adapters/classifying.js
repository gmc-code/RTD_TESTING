QuizGroup.register(
    QuizGroup.createFieldAdapter({
        name: "classifying",
        label: "Classifying",
        selector: ".classifying-block",
        panelSelector: ".classifying-controls",
        fieldSelector: ".sorting-select, .classifying-dropdown, .classifying-input",
        rowSelector: ".classifying-line",
        normalise: (s) => s, // option values are compared exactly
        expected: (f) => f.getAttribute("data-correct-bin") || f.getAttribute("data-correct") || "",
    })
);
