document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".quizgroup-block").forEach((root) => {
        if (root.dataset.quizgroupReady === "true") return; // never initialise twice
        root.dataset.quizgroupReady = "true";
        new QuizGroup.Controller(root);
    });
});
