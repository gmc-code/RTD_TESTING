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
# Node
# ─────────────────────────────────────
class mcq_node(nodes.General, nodes.Element):
    pass

# ─────────────────────────────────────
# HTML Visitors
# ─────────────────────────────────────
def visit_mcq_html(self, node):
    self.body.append(
        f'<div class="mcq-block" '
        f'data-mcq-radio="{str(node.get("force_radio", False)).lower()}" '
        f'data-mcq-single="{str(node.get("single_correct", False)).lower()}">'
    )
    question = html.escape(node.get("question", ""))
    self.body.append(f'<p class="mcq-question">{question}</p>')

def depart_mcq_html(self, node):
    self.body.append("</div>")

# ─────────────────────────────────────
# Directive
# ─────────────────────────────────────
class MCQDirective(SphinxDirective):
    has_content = True
    option_spec = {
        "question": directives.unchanged_required,
        "shuffle": directives.flag,
        "letters": directives.flag,
        "radio": directives.flag,
    }

    def run(self):
        node = mcq_node()

        # Options
        node["question"] = self.options.get("question", "")
        node["force_radio"] = "radio" in self.options
        node["letters"] = "letters" in self.options

        # Extract content
        choices = []
        non_choice_lines = []
        inside_code = False
        code_lines = []

        for line in self.content:
            stripped = line.rstrip()

            # Handle code blocks
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

            # Choice parsing
            if not inside_code and stripped.startswith("[") and "]" in stripped:
                choices.append(stripped)
            else:
                non_choice_lines.append(line)

        # Insert non-choice content (e.g., code)
        if non_choice_lines or code_lines:
            vl = ViewList()
            for i, l in enumerate(non_choice_lines + code_lines, start=self.content_offset):
                vl.append(l, self.state.document.current_source, i)

            container = nodes.container()
            self.state.nested_parse(vl, self.content_offset, container)
            node += container

        # Shuffle choices
        if "shuffle" in self.options:
            random.shuffle(choices)

        # Parse choices
        parsed = []
        for ch in choices:
            marker = ch[1].lower()
            is_correct = marker == "x"
            remainder = ch[ch.index("]") + 1:].strip()

            if "|" in remainder:
                text, explanation = remainder.split("|", 1)
                text, explanation = text.strip(), explanation.strip()
            else:
                text, explanation = remainder, None

            parsed.append({
                "text": text,
                "correct": is_correct,
                "explanation": explanation
            })

        # Determine answer mode
        correct_count = sum(c["correct"] for c in parsed)
        node["single_correct"] = (correct_count == 1) and not node["force_radio"]

        # Determine input type
        if node["force_radio"]:
            input_type = "radio"
        else:
            if correct_count == 1:
                input_type = "single"  # our custom "single-select" mode (no checkbox)
            else:
                input_type = "checkbox"

        # Radio group name
        radio_group = hashlib.md5(node["question"].encode("utf-8")).hexdigest()

        # Generate HTML
        for i, ch in enumerate(parsed):
            letter = chr(ord("A") + i) if node["letters"] else ""

            # SINGLE MODE → hidden input
            if input_type == "single":
                input_html = (
                    '<input type="checkbox" class="mcq-single" style="display:none">'
                )
            else:
                input_html = (
                    f'<input type="{input_type}" name="mcq-{radio_group}">'
                )

            html_str = f'''
<div class="mcq-choice" data-correct="{str(ch["correct"]).lower()}">
  <label>
    {input_html}
    <span class="mcq-letter">{letter}</span>
    <span class="mcq-choice-label">{html.escape(ch["text"])}</span>
  </label>
'''
            if ch["explanation"]:
                html_str += (
                    f'<div class="mcq-explanation">{html.escape(ch["explanation"])}</div>'
                )

            html_str += "</div>"
            node += nodes.raw("", html_str, format="html")

        return [node]


# ─────────────────────────────────────
# Setup
# ─────────────────────────────────────
def setup(app):
    app.add_node(mcq_node, html=(visit_mcq_html, depart_mcq_html))
    app.add_directive("mcq", MCQDirective)

    static_path = os.path.join(os.path.dirname(__file__), "_static")
    if static_path not in app.config.html_static_path:
        app.config.html_static_path.append(static_path)

    app.add_js_file("mcq.js")
    app.add_css_file("mcq.css")

    return {"version": "2.0", "parallel_read_safe": True, "parallel_write_safe": True}
