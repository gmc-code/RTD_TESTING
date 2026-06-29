============================================
MCQ Score Plugin: Technical Implementation
============================================

This document provides a deep-dive breakdown of how the Python extension code for the ``mcqscore`` directive functions within the Sphinx ecosystem.

Architecture Overview
=====================

The plugin is split into three main structural systems:

1. **The Custom AST Node:** Inherits from Docutils classes to allow the quiz to sit within Sphinx's Abstract Syntax Tree.
2. **The HTML Visitor Callbacks:** Handles compiling the opening and closing wrapper tags for the quiz block during rendering.
3. **The Directive Parser Core:** Slices content text safely, hands formatting work back to Sphinx natively, validates author states, and outputs structured HTML choices.

---

Detailed Code Breakdown
=======================

1. Custom Abstract Syntax Tree Node
-----------------------------------

.. code-block:: python

   class mcqscore_node(nodes.General, nodes.Element):
       pass

Docutils processes documentation by building a tree structural graph. We declare an empty subclass ``mcqscore_node`` which serves as our anchor token in the graph. This allows us to hold the question states, parsed child components, and configuration attributes in a single container.


2. HTML Translators (Visitors)
------------------------------

.. code-block:: python

   def visit_mcqscore_html(self, node):
       shuffle_attr = str(node.get("shuffle", False)).lower()
       letters_attr = str(node.get("letters", False)).lower()
       single_attr = str(node.get("single_correct", False)).lower()

       self.body.append(
           f'<div class="mcqscore-block" '
           f'data-mcqscore-single="{single_attr}" '
           f'data-mcqscore-shuffle="{shuffle_attr}" '
           f'data-mcqscore-letters="{letters_attr}">'
       )

   def depart_mcqscore_html(self, node):
       self.body.append("</div>")

When Sphinx's HTML builder compiles the document tree, it invokes these translator endpoints:
* **``visit_mcqscore_html``**: Prepends the global wrapping layout division and serializes configuration states natively into HTML ``data-*`` parameters. The client-side Javascript (``mcqscore.js``) targets these hooks to handle randomized option shuffling and letter rendering.
* **``depart_mcqscore_html``**: Seamlessly appends the matching closing division tag.


3. Content Splitting & Structural Slicing
-----------------------------------------

.. code-block:: python

   choice_start_idx = None
   for idx, line in enumerate(self.content):
       stripped = line.strip()
       if stripped.startswith("[") and "]" in stripped:
           choice_start_idx = idx
           break

   question_lines = self.content[:choice_start_idx]
   choice_lines = self.content[choice_start_idx:]

To allow complex syntax (like nested lists, code-blocks, or mathematical expressions) inside the question body, the content lines are divided:
* The algorithm searches for the exact line index representing the first answer box option pattern (``[...]``).
* Rather than mapping strings into a primitive list type, it creates a fast index slice directly against ``self.content``. This retains Docutils' native ``StringList`` instance metadata wrapper, preventing compilation crashes during layout validation.


4. Nested Parsing Core
----------------------

.. code-block:: python

   question_container = nodes.container(classes=["mcqscore-question"])
   self.state.nested_parse(question_lines, self.content_offset, question_container)
   node += question_container

Instead of interpreting the question lines as dumb text strings, ``self.state.nested_parse()`` injects the ``StringList`` back into Sphinx's master compilation loop. This allows all standard reStructuredText elements, block highlights, or sub-directives inside your question text to render flawlessly. It encapsulates the outcome directly inside a ``<div class="mcqscore-question">`` element container.


5. Choice Parsing & Dynamic UI Selection
----------------------------------------

.. code-block:: python

   if stripped.startswith("[") and "]" in stripped:
       marker = stripped[1].lower()
       is_correct = marker == "x"
       text = stripped[stripped.index("]") + 1:].strip()

       if "|" in text:
           text, explanation = text.split("|", 1)
       ...

The choice parser isolates selection configurations manually:
* **Correctness**: Checks if an ``x`` or ``X`` character is populated inside the brackets.
* **Explanations**: Scans for a pipe separator symbol (``|``). If matched, it slices the content line into an isolated answer block and an embedded explanation layout.


6. Automated Selector Logic & Group Validation
-----------------------------------------------

.. code-block:: python

   correct_count = sum(c["correct"] for c in choices)

   is_multi = correct_count > 1
   node["single_correct"] = not is_multi

   seed_string = "".join(c["text"] for c in choices)
   group_name = hashlib.md5(seed_string.encode("utf-8")).hexdigest()

* **Type Inversion Automation**: Eliminates configuration overhead. If the program totals more than one correct target flagged with ``[x]``, it dynamically maps the underlying input engine properties to a multi-select interface (``checkbox``). If only one is marked, it creates a single-choice environment (``radio``).
* **Cryptographic Form Grouping**: In order for browser radio elements to operate in groups, they must share matching unique names. The plugin generates an MD5 string hash derived from your answer content text. This ensures that independent question widgets deployed throughout the exact same documentation page do not collision-clash.


7. HTML Construction Loop
-------------------------

.. code-block:: python

   for ch in choices:
       input_html = f'<input type="{input_type}" name="mcqscore-{group_name}">'
       html_str = f'''
   <div class="mcqscore-choice" data-correct="{str(ch["correct"]).lower()}">
     <label>
       {input_html}
       <span class="mcqscore-letter"></span>
       <span class="mcqscore-choice-label">{html.escape(ch["text"])}</span>
     </label>
   '''
       ...
       node += nodes.raw("", html_str, format="html")

The data layout converts options directly into inline HTML entities. String expressions utilize ``html.escape()`` to completely protect the underlying DOM layout context from user markup formatting vulnerabilities. Every item logs its own correctness attribute via ``data-correct="..."`` to allow frontend JavaScript frameworks to safely run scoring matrices.


8. Extension Registration Environment
-------------------------------------

.. code-block:: python

   def setup(app):
       app.add_node(mcqscore_node, html=(visit_mcqscore_html, depart_mcqscore_html))
       app.add_directive("mcqscore", MCQScoreDirective)
       ...
       app.add_js_file("mcqscore.js")
       app.add_css_file("mcqscore.css")

The plugin hooks directly into Sphinx's backend platform using the framework's standard core API, mapping the custom directive identifiers and appending assets automatically to the generated HTML build assets directory output pipeline.

