/* wordsearch directive — interactive behaviour */
document.addEventListener("DOMContentLoaded", () => {
  const SVGNS = "http://www.w3.org/2000/svg";
  const COLOURS = [
    "#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#ef4444",
    "#14b8a6", "#f97316", "#84cc16", "#06b6d4", "#d946ef", "#eab308",
  ];

  document.querySelectorAll(".wordsearch-block").forEach((block) => {
    let puzzle;
    try {
      puzzle = JSON.parse(block.dataset.puzzle || "{}");
    } catch (e) {
      return;
    }
    const rows = puzzle.rows || puzzle.size;
    const cols = puzzle.cols || puzzle.size;
    let words = puzzle.words || [];
    const grid = block.querySelector(".ws-grid:not(.ws-grid-key)");
    const overlay = block.querySelector(".ws-overlay:not(.ws-overlay-key)");
    const toolbar = block.querySelector(".ws-toolbar");
    const status = block.querySelector(".ws-status");
    const countEl = block.querySelector(".ws-count");
    const answersMode = block.dataset.answers || "button";
    const timerMode = block.dataset.timer || "";

    // Keys for both directions of each word
    const keyOf = (a, b) => `${a[0]},${a[1]}-${b[0]},${b[1]}`;
    const lookup = new Map();
    const buildLookup = () => {
      lookup.clear();
      words.forEach((w) => {
        const first = w.cells[0];
        const last = w.cells[w.cells.length - 1];
        lookup.set(keyOf(first, last), w);
        lookup.set(keyOf(last, first), w);
      });
    };
    buildLookup();

    // ---------------- New puzzle (for :seed: random) ----------------
    // Same placement rules as the Python builder: longest words first,
    // words may cross on matching letters unless noOverlap is set.
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    const tryPlace = (letters, vectors, noOverlap) => {
      const g = Array.from({ length: rows }, () => Array(cols).fill(null));
      const placed = [];
      const order = letters.map((_, i) => i).sort((a, b) => letters[b].length - letters[a].length);
      for (const i of order) {
        const w = letters[i];
        const opts = [];
        for (const [dr, dc] of vectors) {
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              const er = r + dr * (w.length - 1);
              const ec = c + dc * (w.length - 1);
              if (er < 0 || er >= rows || ec < 0 || ec >= cols) continue;
              let ok = true;
              let overlap = 0;
              for (let k = 0; k < w.length; k++) {
                const cur = g[r + dr * k][c + dc * k];
                if (cur === null) continue;
                if (noOverlap || cur !== w[k]) { ok = false; break; }
                overlap++;
              }
              if (ok && overlap < w.length) opts.push([overlap, r, c, dr, dc]);
            }
          }
        }
        if (!opts.length) return null;
        shuffle(opts);
        if (!noOverlap && Math.random() < 0.35) opts.sort((a, b) => b[0] - a[0]);
        const [, r, c, dr, dc] = opts[0];
        const cells = [];
        for (let k = 0; k < w.length; k++) {
          g[r + dr * k][c + dc * k] = w[k];
          cells.push([r + dr * k, c + dc * k]);
        }
        placed[i] = { id: i, cells };
      }
      return { g, placed };
    };
    const newPuzzle = () => {
      const rg = puzzle.regen;
      if (!rg) return;
      let result = null;
      for (let t = 0; t < 200 && !result; t++) {
        result = tryPlace(rg.letters, rg.vectors, rg.noOverlap);
      }
      if (!result) return; // keep the current puzzle if no layout fits
      const pool = rg.fill === "words" ? rg.letters.join("") : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const { g, placed } = result;
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (g[r][c] === null) g[r][c] = pool[Math.floor(Math.random() * pool.length)];
      // Update the live grid and the printed answer key
      block.querySelectorAll(".ws-cell").forEach((el) => {
        const ch = g[+el.dataset.r][+el.dataset.c];
        el.textContent = rg.lower ? ch.toLowerCase() : ch;
      });
      const keySvg = block.querySelector(".ws-overlay-key");
      if (keySvg) {
        keySvg.innerHTML = placed
          .map((w) => {
            const a = w.cells[0];
            const b = w.cells[w.cells.length - 1];
            return `<line class="ws-key-line" x1="${a[1] + 0.5}" y1="${a[0] + 0.5}" x2="${b[1] + 0.5}" y2="${b[0] + 0.5}" />`;
          })
          .join("");
      }
      words = placed;
      buildLookup();
    };
    // :seed: random — every page load gets its own puzzle
    if (puzzle.regen) newPuzzle();

    // :sort: random — shuffle the word/clue list on load and on Reset
    const shuffleList = () => {
      const list = block.querySelector(".ws-list");
      if (!list || !puzzle.shuffleList) return;
      shuffle([...list.children]).forEach((li) => list.appendChild(li));
    };
    shuffleList();

    const found = new Set();
    let revealed = false;

    // ---------------- Toolbar ----------------
    const mkBtn = (text, cls) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = `ws-btn ${cls}`;
      b.textContent = text;
      toolbar.appendChild(b);
      return b;
    };

    let timerEl = null;
    if (timerMode) {
      timerEl = document.createElement("span");
      timerEl.className = "ws-timer";
      toolbar.appendChild(timerEl);
    }
    const btnReveal =
      answersMode === "hidden" ? null : mkBtn("Show answers", "ws-btn-reveal");
    const btnReset = mkBtn("Reset", "ws-btn-reset");
    const btnPrint = mkBtn("🖨 Print", "ws-btn-print");
    btnPrint.title = "Print this word search";

    // Print just this puzzle (plus its answer key page, if it has one).
    // The puzzle is copied into a hidden frame so the rest of the page
    // isn't printed and page breaks still work.
    btnPrint.addEventListener("click", () => {
      const cssLink = document.querySelector('link[href*="wordsearch.css"]');
      const cssHref = cssLink ? cssLink.href : "";
      const title = (block.querySelector(".ws-title") || {}).textContent || "Word search";
      const frame = document.createElement("iframe");
      frame.setAttribute("aria-hidden", "true");
      frame.style.cssText =
        "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
      document.body.appendChild(frame);
      const doc = frame.contentDocument;
      doc.open();
      doc.write(
        `<!doctype html><html><head><meta charset="utf-8"><title>${title.replace(/</g, "&lt;")}</title>` +
          (cssHref ? `<link rel="stylesheet" href="${cssHref}">` : "") +
          `<style>body{margin:1.2cm;font-family:"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#000;}` +
          `@page{margin:1.2cm;} @media print{body{margin:0;}}</style>` +
          `</head><body>${block.outerHTML}</body></html>`
      );
      doc.close();
      let printed = false;
      const go = () => {
        if (printed) return;
        printed = true;
        frame.contentWindow.focus();
        frame.contentWindow.print();
        setTimeout(() => frame.remove(), 1000);
      };
      frame.addEventListener("load", go);
      setTimeout(go, 1500); // in case the load event already fired
    });

    // ---------------- Timer ----------------
    let startTime = null;
    let timerId = null;
    let timeUp = false;
    const countdown = timerMode && timerMode !== "up" ? parseInt(timerMode, 10) : 0;
    const fmt = (s) => {
      s = Math.max(0, Math.round(s));
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    };
    const elapsed = () => (startTime ? (Date.now() - startTime) / 1000 : 0);
    const drawTimer = () => {
      if (!timerEl) return;
      if (countdown) {
        const left = countdown - elapsed();
        timerEl.textContent = `⏱ ${fmt(left)}`;
        timerEl.classList.toggle("ws-timer-low", left <= 30 && left > 0);
        if (left <= 0 && !timeUp) {
          timeUp = true;
          stopTimer();
          timerEl.classList.add("ws-timer-up");
          setStatus(`Time's up! You found ${found.size} of ${words.length}.`, "low");
        }
      } else {
        timerEl.textContent = `⏱ ${fmt(elapsed())}`;
      }
    };
    const startTimer = () => {
      if (!timerMode || startTime || revealed) return;
      startTime = Date.now();
      timerId = setInterval(drawTimer, 250);
    };
    const stopTimer = () => {
      clearInterval(timerId);
      timerId = null;
    };
    drawTimer();

    // ---------------- Helpers ----------------
    const setStatus = (text, level) => {
      status.textContent = text;
      status.className = "ws-status" + (level ? ` ws-status-${level}` : "");
    };
    const updateCount = () => {
      if (countEl) countEl.textContent = `(${found.size} / ${words.length})`;
    };
    const cellFromPoint = (x, y) => {
      const el = document.elementFromPoint(x, y);
      if (!el || !el.classList.contains("ws-cell") || !grid.contains(el)) return null;
      return [parseInt(el.dataset.r, 10), parseInt(el.dataset.c, 10)];
    };
    const makeLine = (a, b, cls, colour) => {
      const ln = document.createElementNS(SVGNS, "line");
      ln.setAttribute("x1", a[1] + 0.5);
      ln.setAttribute("y1", a[0] + 0.5);
      ln.setAttribute("x2", b[1] + 0.5);
      ln.setAttribute("y2", b[0] + 0.5);
      ln.setAttribute("class", cls);
      if (colour) ln.style.stroke = colour;
      overlay.appendChild(ln);
      return ln;
    };
    // Snap the end cell onto one of the 8 straight-line directions
    const snap = (a, b) => {
      const dr = b[0] - a[0];
      const dc = b[1] - a[1];
      if (dr === 0 && dc === 0) return b;
      const ang = Math.atan2(dr, dc);
      const oct = Math.round(ang / (Math.PI / 4));
      const ur = Math.round(Math.sin((oct * Math.PI) / 4));
      const uc = Math.round(Math.cos((oct * Math.PI) / 4));
      let len = Math.max(Math.abs(dr), Math.abs(dc));
      // keep within grid
      while (len > 0) {
        const r = a[0] + ur * len;
        const c = a[1] + uc * len;
        if (r >= 0 && r < rows && c >= 0 && c < cols) break;
        len--;
      }
      return [a[0] + ur * len, a[1] + uc * len];
    };
    const markCells = (cells, on) => {
      cells.forEach(([r, c]) => {
        const el = grid.querySelector(`.ws-cell[data-r="${r}"][data-c="${c}"]`);
        if (el) el.classList.toggle("ws-cell-found", on);
      });
    };

    const markFound = (w, byReveal) => {
      if (found.has(w.id)) return;
      found.add(w.id);
      const colour = COLOURS[found.size % COLOURS.length];
      makeLine(
        w.cells[0],
        w.cells[w.cells.length - 1],
        byReveal ? "ws-line ws-line-revealed" : "ws-line ws-line-found",
        byReveal ? null : colour
      );
      markCells(w.cells, true);
      const li = block.querySelector(`.ws-item[data-id="${w.id}"]`);
      if (li) {
        li.classList.add(byReveal ? "ws-item-revealed" : "ws-item-found");
        if (!byReveal) li.style.setProperty("--ws-found", colour);
      }
      updateCount();
    };

    // ---------------- Selection ----------------
    let anchor = null; // start cell
    let dragging = false;
    let moved = false;
    let tapAnchor = null; // for tap-tap selection
    let tempLine = null;

    const clearTemp = () => {
      if (tempLine) tempLine.remove();
      tempLine = null;
      grid.querySelectorAll(".ws-cell-anchor").forEach((c) => c.classList.remove("ws-cell-anchor"));
    };
    const showTemp = (a, b) => {
      if (!tempLine) tempLine = makeLine(a, b, "ws-line ws-line-temp");
      tempLine.setAttribute("x1", a[1] + 0.5);
      tempLine.setAttribute("y1", a[0] + 0.5);
      tempLine.setAttribute("x2", b[1] + 0.5);
      tempLine.setAttribute("y2", b[0] + 0.5);
    };
    const tryWord = (a, b) => {
      const w = lookup.get(keyOf(a, b));
      if (w && !found.has(w.id)) {
        markFound(w, false);
        if (found.size === words.length) finish();
        else setStatus("");
        return true;
      }
      if (w && found.has(w.id)) setStatus("Already found!", "medium");
      else {
        setStatus("Not a word in the list — try again.", "low");
        grid.classList.add("ws-shake");
        setTimeout(() => grid.classList.remove("ws-shake"), 350);
      }
      return false;
    };

    const finish = () => {
      stopTimer();
      let msg = `🎉 All ${words.length} words found!`;
      if (timerMode) {
        msg += countdown
          ? ` ${fmt(countdown - elapsed())} to spare.`
          : ` Time: ${fmt(elapsed())}.`;
      }
      setStatus(msg, "high");
      block.classList.add("ws-complete");
      if (btnReveal) btnReveal.disabled = true;
    };

    const locked = () => revealed || found.size === words.length;

    grid.addEventListener("pointerdown", (e) => {
      if (locked()) return;
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      e.preventDefault();
      startTimer();
      anchor = tapAnchor || cell;
      dragging = true;
      moved = false;
      if (!tapAnchor) {
        clearTemp();
        showTemp(anchor, anchor);
      }
    });

    window.addEventListener("pointermove", (e) => {
      if (!dragging || !anchor) return;
      const cell = cellFromPoint(e.clientX, e.clientY);
      if (!cell) return;
      const end = snap(anchor, cell);
      if (end[0] !== anchor[0] || end[1] !== anchor[1]) moved = true;
      showTemp(anchor, end);
    });

    window.addEventListener("pointerup", (e) => {
      if (!dragging) return;
      dragging = false;
      const cell = cellFromPoint(e.clientX, e.clientY);
      const end = cell ? snap(anchor, cell) : null;

      if (tapAnchor) {
        // second tap of a tap-tap selection
        const a = tapAnchor;
        tapAnchor = null;
        clearTemp();
        if (end && (end[0] !== a[0] || end[1] !== a[1])) tryWord(a, end);
        anchor = null;
        return;
      }
      if (!moved || !end || (end[0] === anchor[0] && end[1] === anchor[1])) {
        // first tap — remember it and wait for the second tap
        tapAnchor = anchor;
        clearTemp();
        const el = grid.querySelector(
          `.ws-cell[data-r="${anchor[0]}"][data-c="${anchor[1]}"]`
        );
        if (el) el.classList.add("ws-cell-anchor");
        anchor = null;
        return;
      }
      clearTemp();
      tryWord(anchor, end);
      anchor = null;
    });

    // Escape cancels a pending tap
    block.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        tapAnchor = null;
        clearTemp();
      }
    });

    // ---------------- Buttons ----------------
    const reveal = () => {
      revealed = true;
      stopTimer();
      const before = found.size;
      words.forEach((w) => markFound(w, true));
      setStatus(`Answers shown. You found ${before} of ${words.length}.`, "medium");
      if (btnReveal) btnReveal.disabled = true;
    };
    if (btnReveal) btnReveal.addEventListener("click", reveal);

    btnReset.addEventListener("click", () => {
      found.clear();
      revealed = false;
      timeUp = false;
      tapAnchor = null;
      overlay.innerHTML = "";
      tempLine = null;
      grid.querySelectorAll(".ws-cell").forEach((c) =>
        c.classList.remove("ws-cell-found", "ws-cell-anchor")
      );
      block.querySelectorAll(".ws-item").forEach((li) => {
        li.classList.remove("ws-item-found", "ws-item-revealed");
        li.style.removeProperty("--ws-found");
      });
      block.classList.remove("ws-complete");
      if (btnReveal) btnReveal.disabled = false;
      stopTimer();
      startTime = null;
      if (timerEl) timerEl.classList.remove("ws-timer-up", "ws-timer-low");
      drawTimer();
      newPuzzle();
      shuffleList();
      updateCount();
      setStatus(puzzle.regen ? "New puzzle!" : "");
    });

    if (answersMode === "shown") reveal();
  });
});
