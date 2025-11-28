function showSolution(container, source, targets, expected) {
  targets.forEach(ul => ul.innerHTML = "");
  source.innerHTML = "";

  expected.forEach(exp => {
    const li = document.createElement("li");
    li.className = "parsons-line line-correct";
    li.dataset.line = exp.number; // keep shuffled badge number

    const label = document.createElement("span");
    label.className = "line-label";
    label.textContent = `${exp.number} |`;

    const pre = document.createElement("pre");
    pre.textContent = exp.text;

    li.appendChild(label);
    li.appendChild(pre);

    const target = targets[exp.indent] || targets[0];
    target.appendChild(li);
  });

  showMessage(container, "✨ Solution revealed", true);
  logCurrentState(container);
}

/* ---------- Debug ---------- */

function logCurrentState(container) {
  const current = collectCurrent(container);
  console.log("Current state:", current);
}
