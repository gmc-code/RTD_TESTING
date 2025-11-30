function normalizeLineText(text) {
  return text.replace(/^\s*\d+\s*\|\s*/, "").trim();
}

function getCurrentLines() {
  return Array.from(document.querySelectorAll(".parsons-source .parsons-line")).map((li, idx) => {
    // Prefer the clean data-text set by the directive
    const clean = li.dataset.text ?? normalizeLineText(li.querySelector("pre")?.innerText || "");
    return {
      text: clean,
      indent: 0, // your logic here if indent is tracked
      line: idx + 1
    };
  });
}
