=====================
MCQ Extension Guide
=====================

Purpose
-------
The MCQ extension allows you to create **interactive multiple-choice questions** in your Sphinx documentation.
It supports:

- Single-click selection (click anywhere on the choice)
- Radio-style single-selection questions
- Multi-select checkbox questions
- Automatic coloring for correct/incorrect choices
- Toggleable explanations (“hint” text)

----

MCQ Directive in RST
====================

Purpose
-------
The ``.. mcq::`` directive allows you to define multiple-choice questions directly in reStructuredText, without writing raw HTML.
It supports **single-selection**, **multi-selection**, and **radio button** questions, with optional explanations.

Basic Syntax
------------

.. code-block:: rest

   .. mcq::
      :question: What is the correct way to print "Hello, World" in Python?

      [ ] echo "Hello, World"
      [x] print("Hello, World") | Correct! print() is used to output text in Python.
      [ ] printf("Hello, World")
      [ ] echo(Hello, World)


Directive Options
-----------------
+-----------+------------------------------------------------------+
| Option    | Description                                          |
+===========+======================================================+
|`:shuffle:`| If present, shuffles the choices randomly each time  |
+-----------+------------------------------------------------------+
|`:letters:`| If present, adds letters (A, B, C, …) to each choice |
+-----------+------------------------------------------------------+
|`:radio:`  | If present , uses radio button behavior              |
|           | (only one choice can be selected)                    |
+-----------+------------------------------------------------------+


Choices
-------
- Each choice is defined using the `[ ]` or `[x]` syntax.
  - `[x]` marks the correct choice.
  - `[ ]` marks incorrect choices.
- Use `|` followed by text to provide a hint or feedback explanation.
- Works for single-selection and multi-selection questions.

Example - Single-selection Question
-----------------------------------

.. code-block:: rest

   .. mcq::
      :question: Which of these are valid variable names in Python?
      :shuffle:
      :letters:
      :radio:

      [x] my_var | Valid variable name
      [ ] 2var | Cannot start with a number
      [ ] @var | Cannot start with a symbol
      [ ] my-var | Hyphens are not allowed

Example - Multi-selection Question
----------------------------------

.. code-block:: rest

   .. mcq::
      :question: Which of the following are Python data types?
      :shuffle:
      :letters:

      [x] int | Integer type
      [x] str | String type
      [x] list | List type
      [ ] integer | Not a Python type
      [ ] character | Not a Python type


----

Basic HTML Structure
---------------------
When rendered by the MCQ extension, each question becomes a `.mcq-block` in the HTML:

.. code-block:: html

    <div class="mcq-block" data-mcq-radio="false" data-mcq-single="true">
      <p class="mcq-question">What is the correct way to print "Hello, World" in Python?</p>

      <div class="mcq-choice" data-correct="false">
        <label>
          <input type="checkbox" name="mcq1">
          <span class="mcq-letter">A</span>
          <span class="mcq-choice-label">echo "Hello, World"</span>
        </label>
        <div class="mcq-explanation">Incorrect: echo is not Python syntax</div>
      </div>

      <div class="mcq-choice" data-correct="true">
        <label>
          <input type="checkbox" name="mcq1">
          <span class="mcq-letter">B</span>
          <span class="mcq-choice-label">print("Hello, World")</span>
        </label>
        <div class="mcq-explanation">Correct! print() outputs text in Python.</div>
      </div>
    </div>

Key Attributes
--------------
+-------------------+-------------------------------------------------------------+
| Attribute         | Purpose                                                     |
+===================+=============================================================+
| data-mcq-radio    | "true" for radio-style single-selection (`:radio:` option)  |
|                   | "false" for normal checkbox/multi-select                    |
+-------------------+-------------------------------------------------------------+
| data-mcq-single   | "true" to allow single-click selection on the entire choice |
|                   | (used for single-selection behavior)                        |
+-------------------+-------------------------------------------------------------+
| data-correct      | "true" for correct choices, "false" for incorrect           |
+-------------------+-------------------------------------------------------------+
| .mcq-letter       | Optional: letter label (A, B, C, …) added via `:letters:`   |
+-------------------+-------------------------------------------------------------+
| .mcq-explanation  | Hint or feedback text that appears when a choice is selected|
+-------------------+-------------------------------------------------------------+

JavaScript Behavior
-------------------
- **Single-click mode (`data-mcq-single="true"`)**:
  Click anywhere on a choice to select it. Only one choice is selected at a time. Explanation is shown immediately if present.

- **Radio mode (`data-mcq-radio="true"`)**:
  Behaves like standard radio buttons. Selecting one choice deselects others. Explanations appear on selection.

- **Multi-select mode (`data-mcq-single="false"` and `data-mcq-radio="false"`)**:
  Each choice can be selected independently. Correct/incorrect coloring applies immediately. Explanations toggle on click.

CSS Styling
-----------
You can adjust styles for readability and alignment:

.. code-block:: css

    /* Container for the MCQ question */
    .mcq-block {
      border: 1px solid #e5e7eb;
      padding: 1.2em;
      margin-bottom: 1.5em;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }

    /* Individual choice */
    .mcq-choice {
      cursor: pointer;
      padding: 0.3em 0.5em;
      display: flex;
      align-items: flex-start;
      margin-bottom: 0.2em;
    }

    .mcq-choice:hover {
      background-color: #f0f0f0;
    }

    /* Letter labels (A, B, C, …) */
    .mcq-letter {
      font-weight: bold;
      margin-right: 0.5em;
    }

    /* Choice text */
    .mcq-choice-label {
      flex: 1;
    }

    /* Explanation / hint text */
    .mcq-explanation {
      margin-left: 2.5em;  /* aligns under choice label */
      margin-top: 0.2em;
      font-size: 0.9em;
      color: #555;
    }

    /* Selected correct/incorrect coloring */
    .mcq-choice.selected.mcq-correct {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
    }

    .mcq-choice.selected.mcq-incorrect {
      background-color: #f8d7da;
      border-left: 4px solid #dc3545;
    }


Summary of Workflow
-------------------
1. Define the question using `.. mcq::` with `:question:`, `:shuffle:`, `:letters:`, or `:radio:` options as needed.
2. Use `[ ]` for incorrect or `[x]` for correct choices.
3. Add explanations after `|`.
4. JS handles selection behavior, coloring, and toggling hints.
5. CSS controls appearance, alignment, and spacing.
