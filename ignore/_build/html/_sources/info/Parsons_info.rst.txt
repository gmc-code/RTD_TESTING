=============================
ParsonsDirective Walkthrough
=============================

This document explains how the custom ``ParsonsDirective`` works in Sphinx/Docutils.

Directive Definition
--------------------

.. code-block:: python

   class ParsonsDirective(Directive):
       has_content = True
       optional_arguments = 0
       option_spec = {
           "title": directives.unchanged,
           "shuffle": directives.flag,
           "shuffle-js": directives.flag,
           "columns": directives.positive_int,
           "labels": directives.unchanged,
       }

Options
-------

- ``title``: Custom puzzle title (string).
- ``shuffle``: Shuffle lines server-side (Python).
- ``shuffle-js``: Shuffle lines client-side (JavaScript).
- ``columns``: Number of target columns (integer).
- ``labels``: Comma-separated labels for columns.

Input Handling
--------------

1. **Options Parsing**

   .. code-block:: python

      title = self.options.get("title", "Parsons Puzzle")
      shuffle = "shuffle" in self.options
      shuffle_js = "shuffle-js" in self.options
      columns = int(self.options.get("columns", 1))

2. **Labels**

   .. code-block:: python

      labels_opt = self.options.get("labels")
      labels = [lbl.strip() for lbl in labels_opt.split(",")] if labels_opt else []

3. **Expected Order**

   .. code-block:: python

      expected_order = []
      for line in self.content:
          if not line.strip():
              continue
          if line.strip().startswith("- "):
              raw = line.strip()[2:]
          else:
              raw = line.strip()
          indent = len(line) - len(line.lstrip(" "))
          expected_order.append((indent, raw))

4. **Line Metadata**

   .. code-block:: python

      lines = [(indent, code, idx+1) for idx, (indent, code) in enumerate(expected_order)]

5. **Shuffle Option**

   .. code-block:: python

      if shuffle:
          random.shuffle(lines)

Data Attributes for JS
----------------------

- **Expected Solution**

  .. code-block:: python

     expected_attr = "|".join(f"{indent}::{code}" for indent, code in expected_order)

- **Shuffle Flag**

  .. code-block:: python

     shuffle_attr = "true" if shuffle_js else "false"

HTML Node Construction
----------------------

1. **Container ``<div>``**

   .. code-block:: python

      open_div = nodes.raw(
          "",
          f'<div class="parsons-container parsons-cols-{columns}" '
          f'data-expected="{expected_attr}" data-shuffle-js="{shuffle_attr}">',
          format="html",
      )

2. **Title**

   .. code-block:: python

      title_para = nodes.paragraph()
      title_para += nodes.strong(text=title)

3. **Source List (draggable lines)**

   .. code-block:: python

      source_ul = nodes.bullet_list(classes=["parsons-source"])

   Each line becomes an ``<li>`` with:

   - ``data-line`` (original line number)
   - ``data-text`` (cleaned code)
   - A visible label and ``<pre>`` block

   Helper function:

   .. code-block:: python

      def strip_number_prefix(s: str) -> str:
          if "|" in s:
              left, right = s.split("|", 1)
              if left.strip().isdigit():
                  return right.strip()
          return s

   Example HTML:

   .. code-block:: html

      <li class="parsons-line draggable" data-line="3" data-text="print('Hello')">
        <span class="line-label">3 |</span>
        <pre class="no-copybutton no-lineno">print('Hello')</pre>
      </li>

4. **Target Columns**

   .. code-block:: python

      target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
      for c in range(columns):
          col = nodes.container(classes=["parsons-target", f"parsons-col-{c+1}"])
          label_text = labels[c] if c < len(labels) else f"Column {c+1}"
          label = nodes.paragraph(text=label_text, classes=["parsons-target-label"])
          target_ul = nodes.bullet_list(classes=["parsons-target-list"])
          target_ul["data-indent"] = str(c)
          col += label
          col += target_ul
          target_wrapper += col

5. **Controls**

   .. code-block:: python

      controls = nodes.raw(
          "",
          '<div class="parsons-controls">'
          '<button class="parsons-check">Check</button>'
          '<button class="parsons-reset">Reset</button>'
          '</div>',
          format="html",
      )

6. **Closing Div**

   .. code-block:: python

      close_div = nodes.raw("", "</div>", format="html")

Return Value
------------

.. code-block:: python

   return [open_div, title_para, source_ul, target_wrapper, controls, close_div]

Setup Function
--------------

.. code-block:: python

   def setup(app):
       app.add_directive("parsons", ParsonsDirective)
       app.add_css_file("parsons/parsons.css")
       app.add_js_file("parsons/parsons.js")
       return {
           "version": "0.3",
           "parallel_read_safe": True,
           "parallel_write_safe": True,
       }

Summary of Flow
---------------

1. User writes:

   .. code-block:: rst

      .. parsons::
         :title: Example Puzzle
         :shuffle:
         :columns: 2
         :labels: Left, Right

         - print("Hello")
         - x = 5
         - if x > 3:
         -     print("Big")

2. Directive parses options and content.
3. Builds HTML with draggable ``<li>`` items.
4. Encodes correct solution in ``data-expected``.
5. Provides target columns and control buttons.
6. JavaScript handles drag/drop, checking, and resetting.

