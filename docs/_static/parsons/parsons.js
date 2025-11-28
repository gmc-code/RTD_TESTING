document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".parsons-container").forEach(container => {
    const source   = container.querySelector(".parsons-source");
    const targets  = container.querySelectorAll(".parsons-target-list");
    const resetBtn = container.querySelector(".parsons-reset");
    const checkBtn = container.querySelector(".parsons-check");

    // Add Show Solution button dynamically
    let solutionBtn = container.querySelector(".parsons-solution");
    if (!solutionBtn) {
      solutionBtn = document.createElement("button");
      solutionBtn.className = "parsons-solution";
      solutionBtn.textContent = "Show Solution";
      container.querySelector(".parsons-controls").appendChild(solutionBtn);
    }

    // Normalize lines: wrap text in <pre> if missing
    source.querySelectorAll("li").forEach(li => {
      if (!li.classList.contains("parsons-line")) {
        li.classList.add("parsons-line");
      }
      if (!li.querySelector("pre")) {
        const pre = document.createElement("pre");
        pre.textContent = li.textContent.trim();
        li.textContent = "";
        li.appendChild(pre);
      }
    });

    // Store originals for reset
    container._original = Array.from(source.querySelectorAll(".parsons-line"));

    // Expected solution from data attribute (indent::code segments)
    container._expected = container.dataset.expected
      ? container.dataset.expected.split("|").map(seg => {
          const [indent, code] = seg.split("::");
          return { text: code.trim(), indent: parseInt(indent, 10) };
        })
      : container._original.map(li => ({
          text: (li.querySelector("pre")?.textContent || li.textContent).trim(),
          indent: 0
        }));

    // Shuffle client-side if requested
    if (container.dataset.shuffleJs === "true") {
      const items = Array.from(source.children);
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      items.forEach(li => source.appendChild(li));
    }

    // Make a line draggable
    function makeDraggable(li) {
      li.setAttribute("draggable", "true");
      li.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", li.id || "dragging");
        container.__dragging = li;
        li.classList.add("dragging");
      });
      li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
        container.__dragging = null;
      });
    }

    container.querySelectorAll(".parsons-line").forEach(makeDraggable);

    // Normalize text
    function norm(s) {
      return s.replace(/\u00A0/g, " ")
              .replace(/\t/g, "    ")
              .replace(/[ \f\r\v]+/g, " ")
              .trim();
    }

    // Show feedback message
    function showMessage(text, ok) {
      let msg = container.querySelector(".parsons-message");
      if (!msg) {
        msg = document.createElement("div");
        msg.className = "parsons-message";
        container.appendChild(msg);
      }
      msg.textContent = text;
      msg.style.color = ok ? "#22c55e" : "#e74c3c";
    }

    // Highlight lines
    function highlightLines(expected, current) {
      container.querySelectorAll(".parsons-line").forEach(li => {
        li.classList.remove("line-correct", "line-incorrect");
      });
      const placed = Array.from(container.querySelectorAll(".parsons-target-list .parsons-line"));
      for (let i = 0; i < expected.length; i++) {
        const e = expected[i];
        const c = current[i];
        const li = placed[i];
        if (!li) continue;
        if (c && c.text === e.text && c.indent === e.indent) {
          li.classList.add("line-correct");
        } else {
          li.classList.add("line-incorrect");
        }
      }
    }

    // Check
    function check() {
      const current = [];
      targets.forEach(ul => {
        const indent = parseInt(ul.dataset.indent, 10);
        ul.querySelectorAll(".parsons-line pre").forEach(pre => {
          current.push({ text: norm(pre.textContent), indent: isNaN(indent) ? 0 : indent });
        });
      });

      if (source.querySelectorAll(".parsons-line").length > 0) {
        container.classList.remove("parsons-correct", "parsons-incorrect");
        container.classList.add("parsons-incorrect");
        showMessage("✖ Move all lines into the target area before checking.", false);
        return;
      }

      const expected = container._expected.map(e => ({
        text: norm(e.text),
        indent: e.indent
      }));

      const ok = current.length === expected.length &&
                 current.every((line, i) =>
                   line.text === expected[i].text && line.indent === expected[i].indent
                 );

      container.classList.remove("parsons-correct", "parsons-incorrect");

      if (ok) {
        container.classList.add("parsons-correct");
        showMessage("✅ Correct!", true);
      } else {
        container.classList.add("parsons-incorrect");
        showMessage("✖ Try again", false);
      }

      highlightLines(expected, current);
      console.log({ ok, expected, current });
    }

    // Reset
    function reset() {
      targets.forEach(ul => ul.innerHTML = "");
      source.innerHTML = "";
      container._original.forEach(li => {
        const clone = li.cloneNode(true);
        makeDraggable(clone);
        source.appendChild(clone);
      });
      container.classList.remove("parsons-correct", "parsons-incorrect");
      const msg = container.querySelector(".parsons-message");
      if (msg) msg.textContent = "";
    }

    // Show Solution
    function showSolution() {
      targets.forEach(ul => ul.innerHTML = "");
      source.innerHTML = "";
      container._expected.forEach(exp => {
        const li = document.createElement("li");
        li.className = "parsons-line line-correct";
        const pre = document.createElement("pre");
        pre.textContent = exp.text;
        li.appendChild(pre);
        const target = targets[exp.indent] || targets[0];
        target.appendChild(li);
      });
      showMessage("✨ Solution revealed", true);
    }

    resetBtn && resetBtn.addEventListener("click", reset);
    checkBtn && checkBtn.addEventListener("click", check);
    solutionBtn && solutionBtn.addEventListener("click", showSolution);
  });
});
