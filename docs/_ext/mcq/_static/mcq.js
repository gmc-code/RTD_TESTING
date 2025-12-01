(function() {
  function onCheck(container) {
    const choices = container.querySelectorAll('.mcq-choice input[type="radio"]');
    const feedback = container.querySelector('.mcq-feedback');
    let selected = null;
    choices.forEach(c => { if (c.checked) selected = c; });

    // Reset state
    container.querySelectorAll('.mcq-choice').forEach(el => {
      el.classList.remove('mcq-correct', 'mcq-incorrect');
    });

    if (!selected) {
      feedback.textContent = 'Please select an option.';
      return;
    }

    const isCorrect = selected.getAttribute('data-correct') === 'true';
    const choiceContainer = selected.closest('.mcq-choice');
    choiceContainer.classList.add(isCorrect ? 'mcq-correct' : 'mcq-incorrect');
    feedback.textContent = isCorrect ? 'Correct!' : 'Not quite. Check the explanation.';
  }

  document.addEventListener('click', function(e) {
    if (e.target.classList && e.target.classList.contains('mcq-check')) {
      const container = e.target.closest('.mcq');
      if (container) onCheck(container);
    }
  });
})();
