document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll(".label-container");

  containers.forEach(container => {
    const draggables = container.querySelectorAll(".label-draggable");
    const dropzones = container.querySelectorAll(".label-dropzone");

    draggables.forEach(draggable => {
      draggable.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", draggable.dataset.word);
        draggable.classList.add("dragging");
      });
      draggable.addEventListener("dragend", () => draggable.classList.remove("dragging"));
    });

    dropzones.forEach(zone => {
      zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("hovered"); });
      zone.addEventListener("dragleave", () => zone.classList.remove("hovered"));
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("hovered");
        const word = e.dataTransfer.getData("text/plain");
        zone.innerHTML = `<span class="label-dropped-token" data-word="${word}">${word}</span>`;
      });
    });
  });
});

function scoreLabels() {
  document.querySelectorAll(".label-dropzone").forEach(zone => {
    const token = zone.querySelector(".label-dropped-token");
    const val = token ? token.dataset.word : "";
    const expected = zone.dataset.correct;

    if (val === expected) {
      zone.classList.add("correct");
    } else {
      zone.classList.add("incorrect");
    }
  });
}