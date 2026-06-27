# mcq.py
import html
import os
import random
import hashlib
from docutils import nodes
from docutils.parsers.rst import directives
from docutils.statemachine import ViewList
from sphinx.util.docutils import SphinxDirective

# ─────────────────────────────────────
# Nodes
# ─────────────────────────────────────
class mcq_node(nodes.General, nodes.Element):
    """MCQ container"""
    pass

# ─────────────────────────────────────
# HTML Visitors
# ─────────────────────────────────────
def visit_mcq_html(self, node):
    self.body.append(f'<div class="mcq-block" data-mcq-radio="{str(node.get("radio", False)).lower()}">')
    question = html.escape(node.get("question", ""))
    self.body.append(f'<p class="mcq-question">{question}</p>')

def depart_mcq_html(self, node):
    self.body.append('</div>')

# ─────────────────────────────────────
# Directive
# ─────────────────────────────────────
class MCQDirective(SphinxDirective):
    has_content = True
    option_spec = {
        "question": directives.unchanged_required,
        "letters": directives.flag,
        "radio": directives.flag,
        "shuffle": directives.flag,
    }

    def run(self):
        node = mcq_node()
        # parse options robustly
        node["question"] = self.options.get("question", "")
        node["radio"] = any(opt.strip().lower() == "radio" for opt in self.options)
        node["letters"] = any(opt.strip().lower() == "letters" for opt in self.options)

        choices = []
        other_lines = []
        inside_code = False
        code_lines = []

        for line in self.content:
            stripped = line.rstrip()

            # Detect code blocks (.. code-block:: or literal ::)
            if stripped.startswith(".. code-block::") or stripped.endswith("::"):
                inside_code = True
                code_lines.append(line)
                continue

            if inside_code:
                if line.startswith("   ") or line.startswith("\t") or not line.strip():
                    code_lines.append(line)
                    continue
                else:
                    inside_code = False

            # Detect choices outside code
            if not inside_code and stripped.startswith("[") and "]" in stripped:
                choices.append(stripped)
            else:
                other_lines.append(line)

        # Nested parsing for other lines including code
        if other_lines or code_lines:
            all_lines = other_lines + code_lines
            vl = ViewList()
            for i, line in enumerate(all_lines, start=self.content_offset):
                vl.append(line, self.state.document.current_source, i)
            container = nodes.container()
            self.state.nested_parse(vl, self.content_offset, container)
            node += container

        # Shuffle choices if requested
        if "shuffle" in self.options:
            random.shuffle(choices)

        # Parse choices into structured list
        choices_data = []
        for line in choices:
            marker = line[1].lower()
            correct = marker == "x"
            after = line[line.index("]") + 1 :].strip()
            if "|" in after:
                text, explain = after.split("|", 1)
                text = text.strip()
                explain = explain.strip()
            else:
                text = after
                explain = None
            choices_data.append({"text": text, "correct": correct, "explanation": explain})

        # Detect if multiple correct options exist
        multiple_correct = sum(c["correct"] for c in choices_data) > 1
        input_type = "checkbox" if multiple_correct else ("radio" if node["radio"] else "checkbox")

        # Generate reproducible radio group name
        radio_group_name = hashlib.md5(node["question"].encode("utf-8")).hexdigest()

        # Render HTML
        for idx, choice in enumerate(choices_data):
            letter = chr(ord("A") + idx) if node["letters"] else ""
            html_str = f'''
<div class="mcq-choice {'mcq-correct' if choice['correct'] else 'mcq-incorrect'}" data-correct="{str(choice['correct']).lower()}">
  <label>
    <input type="{input_type}" name="mcq-{radio_group_name}">
    <span class="mcq-letter">{letter} </span>
    <span class="mcq-choice-label">{html.escape(choice['text'])}</span>
  </label>'''
            if choice["explanation"]:
                html_str += f'<div class="mcq-explanation">{html.escape(choice["explanation"])}</div>'
            html_str += '</div>'
            node += nodes.raw("", html_str, format="html")

        return [node]

# ─────────────────────────────────────
# Setup
# ─────────────────────────────────────
def setup(app):
    app.add_node(mcq_node, html=(visit_mcq_html, depart_mcq_html))
    app.add_directive("mcq", MCQDirective)

    # Add static files
    static_path = os.path.join(os.path.dirname(__file__), "_static")
    if static_path not in app.config.html_static_path:
        app.config.html_static_path.append(static_path)

    app.add_css_file("mcq.css")
    app.add_js_file("mcq.js")

    return {"version": "1.2", "parallel_read_safe": True, "parallel_write_safe": True}
