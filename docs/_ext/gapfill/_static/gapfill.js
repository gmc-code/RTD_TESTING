document.addEventListener("DOMContentLoaded", () => {
  const blocks = Array.from(document.querySelectorAll(".gapfill-block"))
  if (blocks.length === 0) return

  // MD5 utility for parsing free text inputs securely
  function md5(str) {
    let k = [], i = 0
    for (; i < 64; ) k[i] = 0 | (Math.sin(++i) * 4294967296)
    let s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]
    let b = [1732584193, 4023233417, 2562383102, 271733878], a = [b[0], b[1], b[2], b[3]], x = [], h = str + "\x80"
    let d = h.length, m = (d + 8) >> 6, g = (m + 1) << 4
    for (i = 0; i < g; i++) x[i] = 0
    for (i = 0; i < d; i++) x[i >> 2] |= h.charCodeAt(i) << ((i % 4) << 3)
    x[((d) >> 2)] |= 0x80 << (((d) % 4) << 3)
    x[g - 2] = d * 8
    for (i = 0; i < g; i += 16) {
      let o = a.slice(0)
      for (let j = 0; j < 64; j++) {
        let f, p
        if (j < 16) { f = (a[1] & a[2]) | (~a[1] & a[3]); p = j }
        else if (j < 32) { f = (a[3] & a[1]) | (~a[3] & a[2]); p = (5 * j + 1) % 16 }
        else if (j < 48) { f = a[1] ^ a[2] ^ a[3]; p = (3 * j + 5) % 16 }
        else { f = a[2] ^ (a[1] | ~a[3]); p = (7 * j) % 16 }
        let t = a[3]
        a[3] = a[2]; a[2] = a[1]
        a[1] = (a[1] + ((a[0] + f + k[j] + x[i + p]) << s[j] | (a[0] + f + k[j] + x[i + p]) >>> (32 - s[j]))) | 0
        a[0] = t
      }
      for (let j = 0; j < 4; j++) a[j] = (a[j] + o[j]) | 0
    }
    let r = ""
    for (i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) r += "0123456789abcdef".charAt((a[i] >> (j * 8 + 4)) & 0xf) + "0123456789abcdef".charAt((a[i] >> (j * 8)) & 0xf)
    }
    return r
  }

  // ─────────────────────────────────────
  // Initialise Blocks & Shuffle Dropdowns
  // ─────────────────────────────────────
  function initBlock(block) {
    block.querySelectorAll(".gapfill-dropdown").forEach(select => {
      const options = Array.from(select.options)
      const placeholder = options.shift()

      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]]
      }

      select.innerHTML = ""
      select.add(placeholder)
      options.forEach(opt => select.add(opt))
    })

    block.querySelectorAll(".gapfill-input").forEach(input => {
      input.value = ""
      input.disabled = false
      input.classList.remove("correct", "incorrect")
    })
  }

  // Run initial shuffle setup across exercises
  blocks.forEach(b => initBlock(b))

  // ─────────────────────────────────────
  // Build Global Control Panel (Like MCQ)
  // ─────────────────────────────────────
  const panel = document.createElement("div")
  panel.className = "gapfill-global-panel"

  const btnScore = document.createElement("button")
  btnScore.type = "button"
  btnScore.className = "gapfill-btn-score"
  btnScore.textContent = "Score Page"

  const btnReset = document.createElement("button")
  btnReset.type = "button"
  btnReset.className = "gapfill-btn-reset"
  btnReset.textContent = "Reset Page"

  const scoreBadge = document.createElement("span")
  scoreBadge.className = "gapfill-output"

  panel.append(btnScore, btnReset, scoreBadge)

  // Append control array immediately below the final exercise block
  const lastBlock = blocks[blocks.length - 1]
  lastBlock.parentNode.insertBefore(panel, lastBlock.nextSibling)

  // ─────────────────────────────────────
  // Scoring Engine Logic
  // ─────────────────────────────────────
  function doScore() {
    let totalGaps = 0
    let correctGaps = 0

    blocks.forEach(block => {
      const inputs = block.querySelectorAll(".gapfill-input")

      inputs.forEach(input => {
        totalGaps++
        input.classList.remove("correct", "incorrect")
        const val = input.value.trim().toLowerCase()

        let isCorrect = false
        if (input.classList.contains("gapfill-text")) {
          const expectedHash = input.dataset.hash
          if (val && md5(val) === expectedHash) isCorrect = true
        } else {
          const expectedValue = input.dataset.correct
          if (val && val === expectedValue) isCorrect = true
        }

        if (isCorrect) {
          input.classList.add("correct")
          correctGaps++
        } else {
          input.classList.add("incorrect")
        }
        input.disabled = true
      })
    })

    // Update global score metrics
    scoreBadge.textContent = `Score: ${correctGaps} / ${totalGaps}`
    scoreBadge.style.display = "inline-block"
    scoreBadge.classList.remove("high", "medium", "low")

    const percent = totalGaps === 0 ? 0 : correctGaps / totalGaps
    if (percent >= 0.8) {
      scoreBadge.classList.add("high")
    } else if (percent >= 0.5) {
      scoreBadge.classList.add("medium")
    } else {
      scoreBadge.classList.add("low")
    }
  }

  function doReset() {
    scoreBadge.style.display = "none"
    scoreBadge.classList.remove("high", "medium", "low")
    blocks.forEach(b => initBlock(b))
  }

  btnScore.onclick = doScore
  btnReset.onclick = doReset
})