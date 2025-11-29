//for py v 0.6
//
document.addEventListener("DOMContentLoaded", () => {
  const containers = document.querySelectorAll(".parsons-container");
  containers.forEach(initParsons);
});

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

  // Make lines focusable and initialize indent
  container.querySelectorAll(".parsons-line").forEach(line => {
    line.setAttribute("tabindex", "0");
    line.dataset.indentLevel = "0";
    line.style.setProperty("--indent", 0);
  });

  // Shuffle source lines if requested
  if (shuffleJs) {
    const source = container.querySelector(".parsons-source");
    const items = Array.from(source.children);
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      source.insertBefore(items[j], items[i]);
    }
  }

  // Drag and drop
  container.querySelectorAll(".parsons-line").forEach(line => {
    line.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", line.dataset.index);
      line.classList.add("dragging");
    });
    line.addEventListener("dragend", () => {
      line.classList.remove("dragging");
    });
  });

  container.querySelectorAll(".parsons-target-list, .parsons-source").forEach(list => {
    list.addEventListener("dragover", e => {
      e.preventDefault();
      const dragging = container.querySelector(".dragging");
      if (!dragging) return;
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        list.appendChild(dragging);
      } else {
        list.insertBefore(dragging, afterElement);
      }
    });
  });

  function getDragAfterElement(list, y) {
    const elements = [...list.querySelectorAll(".parsons-line:not(.dragging)")];
    return elements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // Keyboard navigation
  container.addEventListener("keydown", e => {
    const line = document.activeElement.closest(".parsons-line");
    if (!line) return;
    const parentList = line.parentElement;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = line.previousElementSibling;
      if (prev) parentList.insertBefore(line, prev);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = line.nextElementSibling;
      if (next) parentList.insertBefore(next, line);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      let cur = parseInt(line.dataset.indentLevel || "0", 10);
      cur += 1;
      line.dataset.indentLevel = cur;
      line.style.setProperty("--indent", cur);
      line.style.marginLeft = `${cur * indentStep}px`;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      let cur = parseInt(line.dataset.indentLevel || "0", 10);
      cur = Math.max(0, cur - 1);
      line.dataset.indentLevel = cur;
      line.style.setProperty("--indent", cur);
      line.style.marginLeft = `${cur * indentStep}px`;
    }
  });

  // Controls
  container.querySelector(".parsons-check")?.addEventListener("click", () => {
    const current = getCurrentSolution(container);
    const feedback = checkSolution(current, expected, checkMode);
    console.table(feedback);
    // Apply feedback visually
    applyFeedback(container, feedback);
  });

  container.querySelector(".parsons-reset")?.addEventListener("click", () => {
    const source = container.querySelector(".parsons-source");
    container.querySelectorAll(".parsons-target-list .parsons-line").forEach(li => {
      li.dataset.indentLevel = "0";
      li.style.marginLeft = "0px";
      source.appendChild(li);
    });
    if (shuffleJs) {
      const items = Array.from(source.children);
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        source.insertBefore(items[j], items[i]);
      }
    }
  });

  container.querySelector(".parsons-show-solution")?.addEventListener("click", () => {
    const targets = container.querySelectorAll(".parsons-target-list");
    let tIndex = 0;
    expected.forEach(exp => {
      const srcLine = container.querySelector(
        `.parsons-source .parsons-line pre[data-index="${exp.line_number}"]`
      )?.closest(".parsons-line");
      if (!srcLine) return;
      const targetList = targets[tIndex] || targets[targets.length - 1];
      targetList.appendChild(srcLine);
      srcLine.dataset.indentLevel = exp.indent_level;
      srcLine.style.marginLeft = `${exp.indent_level * indentStep}px`;
    });
  });
}

function getCurrentSolution(container) {
  const targets = Array.from(container.querySelectorAll(".parsons-target-list"));
  const current = [];
  for (const list of targets) {
    for (const li of list.querySelectorAll(".parsons-line")) {
      const pre = li.querySelector("pre");
      current.push({
        line_number: Number(pre.dataset.index),
        code_text: pre.textContent.trim(),
        indent_level: Number(li.dataset.indentLevel || "0"),
        correction: ""
      });
    }
  }
  return current;
}

function checkSolution(current, expected, mode) {
  const feedback = [];
  for (let i = 0; i < current.length; i++) {
    const cur = current[i];
    const exp = expected[i];
    if (!exp) {
      cur.correction = "extra line";
      feedback.push(cur);
      continue;
    }
    const posOk = cur.code_text === exp.code_text || cur.line_number === exp.line_number;
    const indentOk = cur.indent_level === exp.indent_level;
    if (mode === "strict") {
      cur.correction = posOk && indentOk ? "✔" : "✘";
    } else if (mode === "order-only") {
      cur.correction = posOk ? "✔" : "✘";
    } else if (mode === "indent-only") {
      cur.correction = indentOk ? "✔" : "✘";
    }
    feedback.push(cur);
  }
  return feedback;
}

function applyFeedback(container, feedback) {
  feedback.forEach(item => {
    const line = container.querySelector(`.parsons-line pre[data-index="${item.line_number}"]`)?.closest(".parsons-line");
    if (!line) return;
    line.classList.remove("is-correct", "is-incorrect");
    if (item.correction === "✔") {
      line.classList.add("is-correct");
    } else if (item.correction !== "") {
      line.classList.add("is-incorrect");
    }
  });
}
function enableNativeDrag(container) {
  container.querySelectorAll(".parsons-line").forEach(line => {
    line.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", line.dataset.index);
      line.classList.add("dragging");
    });
    line.addEventListener("dragend", () => {
      line.classList.remove("dragging");
    });
  });

  container.querySelectorAll(".parsons-target-list, .parsons-source").forEach(list => {
    list.addEventListener("dragover", e => {
      e.preventDefault();
      const dragging = container.querySelector(".dragging");
      if (!dragging) return;
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        list.appendChild(dragging);
      } else {
        list.insertBefore(dragging, afterElement);
      }
    });
  });
}

function getDragAfterElement(list, y) {
  const elements = [...list.querySelectorAll(".parsons-line:not(.dragging)")];
  return elements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
