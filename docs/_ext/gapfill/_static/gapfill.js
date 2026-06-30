document.addEventListener("DOMContentLoaded", () => {
  const blocks = Array.from(document.querySelectorAll(".gapfill-block"))
  if (blocks.length === 0) return

  // Shuffles options and resets validation text spans
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

    // Wipe inline feedback targets clean
    block.querySelectorAll(".gapfill-inline-feedback").forEach(badge => {
      badge.textContent = ""
      badge.className = "gapfill-inline-feedback"
    })

    block.querySelectorAll(".gapfill-input").forEach(input => {
      input.value = ""
      input.disabled = false
      input.classList.remove("correct", "incorrect")
    })
  }

  // Initial Run
  blocks.forEach(b => initBlock(b))

  // Build Unified Control Panel Toolbar
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
  const lastBlock = blocks[blocks.length - 1]
  lastBlock.parentNode.insertBefore(panel, lastBlock.nextSibling)

  // Evaluation Routine
  function doScore() {
    let totalGaps = 0
    let correctGaps = 0

    blocks.forEach(block => {
      block.querySelectorAll(".gapfill-input").forEach(input => {
        totalGaps++
        const val = input.value.trim().toLowerCase()
        const expectedValue = input.dataset.correct

        // Find the specific inline text span container companion sitting directly next to this dropdown box
        const feedbackBadge = input.nextElementSibling
        let isCorrect = (val && val === expectedValue)

        if (isCorrect) {
          input.classList.add("correct")
          feedbackBadge.textContent = " ✓"
          feedbackBadge.classList.add("text-correct")
          correctGaps++
        } else {
          input.classList.add("incorrect")
          // Reveal both cross icon AND correct missing string solution text
          feedbackBadge.textContent = ` ✕ (Ans: ${expectedValue})`
          feedbackBadge.classList.add("text-incorrect")
        }
        input.disabled = true
      })
    })

    // Render Bottom Score Box
    scoreBadge.textContent = `Score: ${correctGaps} / ${totalGaps}`
    scoreBadge.style.display = "inline-block"
    scoreBadge.classList.remove("high", "medium", "low")

    const percent = totalGaps === 0 ? 0 : correctGaps / totalGaps
    if (percent >= 0.8) scoreBadge.classList.add("high")
    else if (percent >= 0.5) scoreBadge.classList.add("medium")
    else scoreBadge.classList.add("low")
  }

  function doReset() {
    scoreBadge.style.display = "none"
    blocks.forEach(b => initBlock(b))
  }

  btnScore.onclick = doScore
  btnReset.onclick = doReset
})