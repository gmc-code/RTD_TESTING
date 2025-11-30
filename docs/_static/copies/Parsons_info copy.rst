=======================================
Parsons directive: detailed walkthrough
=======================================

This document explains, end - to - end, how the provided ``ParsonsDirective`` builds a 2D Parsons puzzle in Sphinx. It covers option parsing, content processing, HTML node construction, data attributes for the front end, and how to wire up drag - and - drop and keyboard interactions (including indentation) in your ``parsons.js``. It also highlights a small fix you'll need for the line array to match the requested structure (line number, code text, correction field) and points out where your front end should compute and store correction results.

.. code-block:: python

   from docutils import nodes
   from docutils.parsers.rst import Directive, directives
   import random
   import json
   import html
   import csv


   # ... keep your imports and class definition ...


   class ParsonsDirective(Directive):
      has_content = True
      option_spec = {
         "title": directives.unchanged,
         "shuffle": directives.flag,
         "shuffle-js": directives.flag,
         "columns": directives.positive_int,
         "labels": directives.unchanged,
         "auto-format": directives.flag,
      }

      def run(self):
         title = self.options.get("title", "Parsons Puzzle")
         shuffle = "shuffle" in self.options
         shuffle_js = "shuffle-js" in self.options
         columns = int(self.options.get("columns", 1))

         # Parse labels (CSV-safe)
         labels_opt = self.options.get("labels")
         labels = next(csv.reader([labels_opt])) if labels_opt else []

         # Build expected order with consistent indent
         expected_order = []
         for i, line in enumerate(self.content, start=1):
               if not line.strip():
                  continue
               expanded = line.expandtabs(4)
               indent = len(expanded) - len(expanded.lstrip())
               raw = expanded.strip()
               expected_order.append({
                  "line_number": i,
                  "indent": indent,
                  "code_text": raw,
                  "correction": ""  # placeholder for correction output
               })

         raw_lines = [item["code_text"] for item in expected_order]



               # shuffle in Python only if JS won't do it
         if shuffle and not shuffle_js:
               random.shuffle(raw_lines)

         # embed JSON safely
         expected_json = html.escape(json.dumps(expected_order))
         shuffle_attr = "true" if shuffle_js else "false"

         # open wrapper
         open_div = nodes.raw(
               "",
               f'<div class="parsons-container parsons-cols-{columns}" '
               f'data-expected="{expected_json}" data-shuffle-js="{shuffle_attr}">',
               format="html",
         )

         # title
         title_para = nodes.paragraph()
         title_para += nodes.strong(text=title)

         # source list
         source_ul = nodes.bullet_list(classes=["parsons-source"])
         for i, code_line in enumerate(raw_lines):
               li = nodes.list_item(classes=["parsons-line", "draggable"])

               code = nodes.literal_block(code_line, code_line)
               code["language"] = "python"
               code["classes"].append("no-copybutton")

               # store original line number on <pre>
               code["data-index"] = str(i + 1)  # +1 so numbering starts at 1

               li += code
               source_ul += li

         # target columns
         target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
         for c in range(columns):
               col = nodes.container(
                  classes=["parsons-target", f"parsons-col-{c+1}"])
               label_text = labels[c] if c < len(labels) else f"Column {c+1}"
               col += nodes.paragraph(text=label_text,
                                    classes=["parsons-target-label"])

               ul = nodes.bullet_list(classes=["parsons-target-list"])
               ul["data-indent"] = str(c)
               col += ul
               target_wrapper += col

         # controls
         controls_html = (
               '<div class="parsons-controls">'
               '<button class="parsons-check">Check</button>'
               '<button class="parsons-reset">Reset</button>'
               '<button class="parsons-show-solution">Solution</button>'
               '</div>')
         controls = nodes.raw("", controls_html, format="html")
         close_div = nodes.raw("", "</div>", format="html")

         return [
               open_div, title_para, source_ul, target_wrapper, controls,
               close_div
         ]


   def setup(app):
      app.add_directive("parsons", ParsonsDirective)
      app.add_css_file("parsons/parsons.css")
      app.add_js_file("parsons/parsons.js")
      return {
         "version": "0.4",
         "parallel_read_safe": True,
         "parallel_write_safe": True,
      }


Overview
--------

A Parsons puzzle presents shuffled code lines that learners must reorder and indent to reconstruct the correct program. This directive:

- Reads a code block from the directive body and computes an expected line array with indentation.
- Emits a source list of draggable code lines and an empty “target” area arranged in columns (2D layout).
- Stores the expected solution as JSON in a data attribute, safely HTML - escaped.
- Provides UI controls (Check, Reset, Solution) for front - end logic to evaluate and assist learners.

The Python side is responsible for building document nodes and embedding metadata; the JavaScript side handles drag - and - drop, keyboard movement, indentation management, and correctness checks.

Directive registration and assets
---------------------------------

The ``setup`` function registers the directive under the name ``parsons`` and ensures the necessary assets are loaded:

- ``parsons/parsons.css`` for visual layout and affordances.
- ``parsons/parsons.js`` for behavior (drag, keyboard, indent, checking).

Sphinx will include these once per build, making the widget available anywhere you use ``.. parsons::`` in your documentation.

Options and their meaning
-------------------------

The directive supports these options:

- ``title`` (text): The heading shown above the puzzle (defaults to ``"Parsons Puzzle"``).
- ``shuffle`` (flag): Shuffle lines on the Python side.
- ``shuffle-js`` (flag): Shuffle lines via your JavaScript (if set, Python will not shuffle).
- ``columns`` (positive int): Number of target columns to render (for 2D layout).
- ``labels`` (CSV string): Column labels, parsed safely via ``csv.reader``.
- ``auto-format`` (flag): Reserved for future use (e.g., auto style/format), currently passed through.

You can combine ``shuffle`` and ``shuffle-js``, but only one will take effect at runtime. If ``shuffle-js`` is present, the Python side keeps the original order and expects the front end to shuffle.

Parsing content into an expected array
--------------------------------------

The directive reads each non - blank line from the directive's body and computes:

- ``line_number``: The 1 - based index of the original line.
- ``indent``: The indentation width in spaces after expanding tabs to 4 spaces.
- ``code_text``: The trimmed source code for that line.
- ``correction``: A placeholder string to store correctness/feedback later (initially ``""``).

This produces a list of dicts (the “expected order”) that represents the ground truth solution. It is then JSON - encoded and safely embedded as an HTML data attribute on the outer container. Your front end reads it to know the target order and indentation for checking.

Important: source list construction
-----------------------------------

The source (“palette”) the learner drags from is created as a bullet list. Each list item contains a ``<pre>`` (Docutils literal block) with these attributes:

- ``language="python"`` for syntax highlighting.
- ``class="no-copybutton"`` to avoid extra toolbar clutter if using copy buttons.
- ``data-index`` storing the 1 - based line number. This preserves the original line numbers even if the display order changes.

Target columns and 2D layout
----------------------------

To support multi - column puzzles, the directive creates a wrapper (``parsons-target-wrapper``) and a number of target column containers equal to ``columns``. Each column contains:

- A label paragraph (class ``parsons-target-label``) for the column's title.
- An empty bullet list (class ``parsons-target-list``) where learners drop lines.

Columns are given CSS classes like ``parsons-col-1``, ``parsons-col-2``, etc. The lists carry a ``data-indent`` attribute initialized to their column index. You can use this attribute for column - level indentation rules or alternate semantics (e.g., grouping by stages or blocks).

Metadata: embedding the expected solution
-----------------------------------------

The outer ``div`` gets:

- ``class="parsons-container parsons-cols-{columns}"`` to indicate a Parsons widget and number of columns.
- ``data-expected="{...}"`` containing the JSON - encoded expected array with each item like:

  ::

    {
      "line_number": 1,
      "indent": 8,
      "code_text": "for i in range(n):",
      "correction": ""
    }

- ``data-shuffle-js="true|false"`` to indicate whether front - end shuffling should occur.

The expected JSON is HTML - escaped via ``html.escape`` so it survives inside attributes cleanly.

Shuffling behavior
------------------

If ``shuffle`` is provided and ``shuffle-js`` is not, the directive will shuffle the ``raw_lines`` array in Python before rendering. That means the source list is output in randomized order.

If ``shuffle-js`` is provided, the directive keeps the original order and sets ``data-shuffle-js="true"``; your front end script should then randomize the source list on page load. This split helps avoid double shuffles and keeps the behavior deterministic when needed.

Controls
--------

The directive injects three buttons inside a controls container:

- ``Check`` (class ``parsons-check``): Trigger a correctness check.
- ``Reset`` (class ``parsons-reset``): Return the puzzle to initial state (shuffled source, empty targets, baseline indentation).
- ``Solution`` (class ``parsons-show-solution``): Reveal or move the expected solution into the targets.

The Python side only renders these buttons. You wire up click handlers in ``parsons.js``.

Keyboard interaction and indentation (front - end responsibilities)
-----------------------------------------------------------------

To meet the requirement of keyboard navigation and indentation control, extend your ``parsons.js`` with:

- **Focus management:**
  - Make each ``.parsons-line`` focusable (e.g., add ``tabindex="0"``).
  - On click or drag start, move focus to the active line.

- **Arrow keys:**
  - ``ArrowUp``: Move line up within its current list (source or target).
  - ``ArrowDown``: Move line down within its current list.
  - ``ArrowLeft`` / ``ArrowRight``: Adjust indentation one step per press.
    - Store the current indent in a data attribute (e.g., ``data-indent-level``), and optionally reflect visually (e.g., left margin).
    - Define a consistent indent step (e.g., 2 or 4 spaces) so this matches the ``expected_order``.

- **Column navigation:**
  - Optional: Use ``Ctrl+ArrowLeft`` / ``Ctrl+ArrowRight`` (or ``Shift+Arrow...``) to move a focused line between columns (source → target or between target columns). When moving into a target list, append at the current position and retain indent level.

- **Drag - and - drop:**
  - Mark ``.parsons-line`` as draggable and wire up native DnD (``dragstart``, ``dragover``, ``drop``) or a library.
  - On drop, insert into the target list at nearest position, preserve ``data-index`` and current indentation.

The front end should unify keyboard and mouse behavior: a line's “position” is defined by its list (source vs. particular target column), index within the list, and current indent level.

Checking correctness
--------------------

On ``Check``:

1. Read the expected array from ``data-expected`` (JSON parse).
2. Construct the current solution by iterating over the target lists, top to bottom, left to right (or a clearly defined traversal order), capturing for each ``.parsons-line``:
   - ``line_number`` from its ``<pre data-index>``.
   - ``code_text`` from the trimmed text content.
   - ``indent`` from its ``data-indent-level`` (or computed from applied style if you choose to reflect indent in CSS).
3. Compare element - wise with the expected array:
   - **Order check:** The ``code_text`` or ``line_number`` must match the expected sequence position.
   - **Indent check:** The current ``indent`` must equal the expected ``indent`` for that line.
4. Populate the per - line ``correction`` field with feedback:
   - Examples: ``"✔"`` for exact match; ``"wrong position"``, ``"wrong indent"``, or ``"wrong column"`` for specific mismatches.
   - You can attach this feedback back to DOM elements (e.g., set ``data-correction``) and render a badge next to the line.

If you want the full “array storing line number, code text, and correction output,” emit it as a JSON object to the console, display it in a collapsible panel, or serialize it to a hidden ``<input>`` if integrating with a form.

Reset and solution
------------------

- **Reset:** Clear all target lists, restore the source list to initial state (shuffled if applicable), and reset each line's ``data-indent-level`` to 0. Also clear any ``correction`` badges or classes.
- **Solution:** Move lines into targets in expected order, set each line's indent to the expected value, and apply a “solution” visual state. Optionally disable further edits until ``Reset`` is pressed.

Accessibility and semantics
---------------------------

To keep the interaction accessible:

- Ensure keyboard parity with drag - and - drop.
- Provide visible focus rings on ``.parsons-line``.
- Use ARIA roles for lists (e.g., ``role="list"`` / ``role="listitem"``) if appropriate.
- Announce feedback (correction) via live regions or concise inline text, not only color.

Styling hooks (CSS)
-------------------

Typical CSS hooks you'll want in ``parsons/parsons.css``:

- ``.parsons-container``: Overall layout.
- ``.parsons-source`` and ``.parsons-target-list``: Display as vertical stacks; add spacing.
- ``.parsons-target-wrapper``: Grid or flex to lay out columns (e.g., ``display: grid; grid-template-columns: repeat(n, 1fr);``).
- ``.parsons-line``: Make draggable affordances visible; apply indentation via left margin or padding (computed from ``data-indent-level``).
- State classes such as ``.is-correct``, ``.is-incorrect``, ``.is-solution``.

Putting it all together: data flow
----------------------------------

- Sphinx parses directive content → Python computes ``expected_order`` with ``line_number``, ``indent``, ``code_text``, and blank ``correction``.
- Python renders the source list (draggable lines) and empty target columns; embeds ``data-expected`` and ``data-shuffle-js`` on the container.
- Front end initializes:
  - If ``data-shuffle-js="true"``, shuffle source lines on load.
  - Make lines focusable, attach DnD and keyboard handlers.
- User arranges lines across columns, moves them up/down, and adjusts indent via arrows.
- On ``Check``, front end builds the current state and compares with expected; fills ``correction`` for each line and shows feedback.
- On ``Reset`` or ``Solution``, front end resets or applies expected arrangement and indentation.

Common pitfalls and fixes
-------------------------

- **Indent representation:** Keep a single source of truth (``data-indent-level``). If you mirror indent visually via CSS margin/padding, ensure the numeric level equals the expected ``indent`` units (decide on “spaces per level” and be consistent).
- **Traversal order for checking:** Define and document the order in which target columns and lists are read during comparison to avoid ambiguity. A simple left - to - right columns, then top - to - bottom within each list, works well.

Minimal front - end sketch (for reference)
----------------------------------------

Below is a conceptual outline you can adapt in ``parsons/parsons.js``. It's not a complete implementation, but it shows where key responsibilities sit:

::

  document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.parsons-container');
    if (!container) return;

    const expected = JSON.parse(container.dataset.expected);
    const useJsShuffle = container.dataset.shuffleJs === 'true';

    // Make lines focusable and initialize indent
    document.querySelectorAll('.parsons-line').forEach(line => {
      line.setAttribute('tabindex', '0');
      line.dataset.indentLevel = '0';
    });

    // Optional: shuffle source in JS
    if (useJsShuffle) {
      const source = container.querySelector('.parsons-source');
      const items = Array.from(source.children);
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        source.insertBefore(items[j], items[i]);
      }
    }

    // Keyboard handlers
    container.addEventListener('keydown', (e) => {
      const line = document.activeElement.closest('.parsons-line');
      if (!line) return;

      const parentList = line.parentElement;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = line.previousElementSibling;
        if (prev) parentList.insertBefore(line, prev);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = line.nextElementSibling;
        if (next) parentList.insertBefore(next, line);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        line.dataset.indentLevel = String(Number(line.dataset.indentLevel || '0') + 4);
        line.style.marginLeft = `${line.dataset.indentLevel}px`;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const cur = Math.max(0, Number(line.dataset.indentLevel || '0') - 4);
        line.dataset.indentLevel = String(cur);
        line.style.marginLeft = `${cur}px`;
      }
    });

    // Check
    container.querySelector('.parsons-check')?.addEventListener('click', () => {
      const targets = Array.from(container.querySelectorAll('.parsons-target-list'));
      const current = [];
      for (const list of targets) {
        for (const li of list.querySelectorAll('.parsons-line')) {
          const pre = li.querySelector('pre');
          current.push({
            line_number: Number(pre.dataset.index),
            code_text: pre.textContent.trim(),
            indent: Number(li.dataset.indentLevel || '0'),
            correction: ''
          });
        }
      }
      // Compare with expected and fill correction
      for (let i = 0; i < current.length; i++) {
        const cur = current[i];
        const exp = expected[i];
        if (!exp) { cur.correction = 'extra line'; continue; }
        const posOk = cur.code_text === exp.code_text || cur.line_number === exp.line_number;
        const indentOk = cur.indent === exp.indent;
        if (posOk && indentOk) cur.correction = '✔';
        else if (!posOk && indentOk) cur.correction = 'wrong position';
        else if (posOk && !indentOk) cur.correction = 'wrong indent';
        else cur.correction = 'wrong position & indent';
      }
      // Example: mark DOM and log array
      console.table(current);
    });

    // Reset
    container.querySelector('.parsons-reset')?.addEventListener('click', () => {
      // Clear targets, move lines back to source, reset indent and visual state
      const source = container.querySelector('.parsons-source');
      container.querySelectorAll('.parsons-target-list .parsons-line').forEach(li => {
        li.dataset.indentLevel = '0';
        li.style.marginLeft = '0px';
        source.appendChild(li);
      });
      // Optionally reshuffle if useJsShuffle
      if (useJsShuffle) {
        const items = Array.from(source.children);
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          source.insertBefore(items[j], items[i]);
        }
      }
    });

    // Solution
    container.querySelector('.parsons-show-solution')?.addEventListener('click', () => {
      const targets = container.querySelectorAll('.parsons-target-list');
      let tIndex = 0;
      expected.forEach(exp => {
        // Find the matching source line by line_number
        const srcLine = container.querySelector(
          `.parsons-source .parsons-line pre[data-index="${exp.line_number}"]`
        )?.closest('.parsons-line');
        if (!srcLine) return;
        const targetList = targets[tIndex] || targets[targets.length - 1];
        targetList.appendChild(srcLine);
        srcLine.dataset.indentLevel = String(exp.indent);
        srcLine.style.marginLeft = `${exp.indent}px`;
        // Optionally advance target list as needed
        // (Keep simple: all lines to first list unless you map columns explicitly)
      });
    });
  });

This sketch shows where to wire your logic; you can refine indentation units, column mapping, and feedback presentation.

Usage example in Sphinx
-----------------------

A typical invocation in your ``.rst`` file might look like:

::

  .. parsons::
     :title: Reconstruct the loop
     :columns: 2
     :labels: Setup, Body
     :shuffle-js:

     for i in range(3):
         print(i)
     print("done")

This renders the widget with two target columns labeled “Setup” and “Body,” uses JavaScript shuffling, and embeds the expected order (with indentation measured from the input).

Summary
-------

- The Python directive constructs a complete widget skeleton and embeds the expected solution, including line numbers, indentation, and code text.
- Your front end handles shuffling (if chosen), drag - and - drop, keyboard navigation, indentation changes, and correctness checks.
- Fix the ``raw_lines`` key to ``code_text`` and keep indentation units consistent between expected and current states.
- The correction field is designed for front - end evaluation results; store it per line and present feedback clearly to learners.