function initParsons(container) {
  const widgetId = container.id;
  const expectedScript = document.getElementById(`${widgetId}-expected`);
  if (!expectedScript) return;
  const expected = JSON.parse(expectedScript.textContent);

  const indentStep = parseInt(container.dataset.indentStep || "4", 10);
  const shuffleJs = container.dataset.shuffleJs === "true";
  const checkMode = container.dataset.checkMode || "strict";

  // If Sortable.js is available, use it
  if (window.Sortable) {
    Sortable.create(container.querySelector(".parsons-source"), {
      group: "parsons",
      animation: 150,
      fallbackOnBody: true,
      swapThreshold: 0.65
    });
    container.querySelectorAll(".parsons-target-list").forEach(list => {
      Sortable.create(list, {
        group: "parsons",
        animation: 150,
        fallbackOnBody: true,
        swapThreshold: 0.65
      });
    });
  } else {
    // Fallback: use native drag/drop
    enableNativeDrag(container);
  }

  // …rest of your initialization (keyboard, controls, etc.)
}








