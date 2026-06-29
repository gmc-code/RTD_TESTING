=============================
MCQ Score Directive Reference
=============================

The ``.. mcqscore::`` directive creates interactive, auto-scoring multiple-choice questions natively within your documentation. It automatically switches between single-select (radio buttons) and multiple-select (checkboxes) depending on how many correct answers you flag.

Directive Structure
===================

.. code-block:: rst

    .. mcqscore::
        :no-shuffle:
        :no-letters:

        [Question block: supports text, lists, and nested directives like code-blocks]

        [x] Choice 1 | Optional inline explanation text
        [ ] Choice 2 | Another explanation
        [ ] Choice 3

Configuration Options
=====================

* **No options specified (Default):** Shuffles the choices at runtime and assigns option letters (A, B, C, D) dynamically via CSS/JS.
* ``:no-shuffle:``: Forces the choices to remain exactly in the order written in the source file.
* ``:no-letters:``: Suppresses option lettering (ideal for numeric or true/false options).

Syntax Writing Rules
====================

1. **Question Block:**
   The block starts immediately below the directive declaration. It supports any valid reStructuredText syntax, meaning you can include bold text, inline code literals, or nested code blocks.

2. **Divider Gap:**
   Always leave a blank newline between the end of your question body and the start of your answer choices.

3. **Choices Marker Syntax:**
   * Use ``[ ]`` (with a space inside) to mark an **incorrect** choice.
   * Use ``[x]`` or ``[X]`` to mark a **correct** choice.

4. **Explanations:**
   You can provide inline answer feedback by appending a pipe character (``|``) right after the choice text. Everything following the pipe will be treated as an explanation string, wrapped in an HTML class container, and safely displayed to users upon submission.

Syntax Examples
===============

Single-Choice with Code Block
-----------------------------

.. code-block:: rst

    .. mcqscore::

        What does the following Python expression output?

        .. code-block:: python

            print(10 // 3)

        [ ] 3.3333 | Incorrect: This would be the result of a single slash (/) operator.
        [x] 3      | Correct: The double slash (//) executes floor division.
        [ ] 1      | Incorrect: This would be the result of the modulo (%) operator.

Multiple-Choice Shuffled
------------------------

.. code-block:: rst

    .. mcqscore::

        Which of the following are valid Python data types?

        [x] int   | Correct: Standard integer.
        [x] dict  | Correct: Dictionary structure mapping keys to values.
        [ ] html  | Incorrect: HTML is a markup language, not a Python data type.
        [x] list  | Correct: Mutable sequence array type.