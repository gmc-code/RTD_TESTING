document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-container").forEach(initParsons);
});

function initParsons(container) {
  const source = container.querySelector(".parsons-source");
  const targets = Array.from(container.querySelectorAll(".parsons-target-list"));

  // Line numbers
  Array.from(source.querySelectorAll("li")).forEach((li, idx) => {
    li.classList.add("parsons-line");
    const numSpan = document.createElement("span");
    numSpan.className = "parsons-line-number";
    numSpan.textContent = idx + 1 + " |";
    const pre = document.createElement("pre");
    pre.textContent = li.textContent;
    li.textContent = "";
    li.appendChild(numSpan);
    li.appendChild(pre);
  });

  // Save original lines
  const originalLines = Array.from(source.children).map(li => li.cloneNode(true));
  container.__originalLines = originalLines;

  // Buttons
  const resetBtn = container.querySelector(".parsons-reset");
  const checkBtn = container.querySelector(".parsons-check");
  const solutionBtn = container.querySelector(".parsons-solution");
  const messageDiv = container.querySelector(".parsons-message");

  // Setup drag-and-drop with Sortable.js
  if (typeof Sortable !== "undefined") {
    new Sortable(source, { group: "parsons", animation: 150 });
    targets.forEach(t => new Sortable(t, { group: "parsons", animation: 150 }));
  }

  resetBtn.addEventListener("click", () => {
    source.innerHTML = "";
    targets.forEach(t => t.innerHTML = "");
    originalLines.forEach(li => source.appendChild(li.cloneNode(true)));
    messageDiv.textContent = "";
  });

  checkBtn.addEventListener("click", () => {
    // Check if current lines match original order
    const current = [];
    targets.forEach(t => {
      Array.from(t.children).forEach(li => current.push(li.querySelector("pre").textContent));
    });
    let correct = true;
    originalLines.forEach((li, idx) => {
      if (li.querySelector("pre").textContent !== current[idx]) correct = false;
    });
    messageDiv.textContent = correct ? "✅ Correct!" : "✖ Try again";
  });

  solutionBtn.addEventListener("click", () => {
    source.innerHTML = "";
    targets.forEach(t => t.innerHTML = "");
    originalLines.forEach(li => {
      targets[0].appendChild(li.cloneNode(true));
    });
    messageDiv.textContent = "Solution shown";
  });
}
