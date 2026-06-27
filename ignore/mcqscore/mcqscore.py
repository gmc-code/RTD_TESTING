# mcq.py
import html
import os
import random
import re
from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective

# ─────────────────────────────────────
# Start/End markers
# ─────────────────────────────────────
class MCQScoreStart(SphinxDirective):
    has_content = False
    def run(self):
        return [nodes.raw('', '<span class="mcqscore-start" style="display:none"></span>', format='html')]

class MCQScoreEnd(SphinxDirective):
    has_content = False
    def run(self):
        return [nodes.raw('', '<span class="mcqscore-end" style="display:none"></span>', format='html')]

# ─────────────────────────────────────
# Node
# ─────────────────────────────────────
class mcqscore_node(nodes.General, nodes.Element):
    pass

# ─────────────────────────────────────
# HTML Visitors
# ─────────────────────────────────────
def visit_mcqscore_html(self, node):
    shuffle_attr = str(node.get("shuffle", False)).lower()
    self.body.append(
        f'<div class="mcqscore-block" '
        f'data-mcqscore-single="{str(node.get("single_correct", False)).lower()}" '
        f'data-shuffle="{shuffle_attr}">'
    )
    self.body.append('<div class="mcqscore-question-block">')
    self.body.append(f'<p class="mcqscore-question">{html.escape(node.get("question", ""))}</p>')
    self.body.append('</div>')
    self.body.append('<div class="mcqscore-choices">')

def depart_mcqscore_html(self, node):
    self.body.append('</div>')  # mcqscore-choices
    self.body.append('</div>')  # mcqscore-block

# ─────────────────────────────────────
# Directive
# ─────────────────────────────────────
class MCQScoreDirective(SphinxDirective):
    has_content = True
    option_spec = {
        "question": directives.unchanged_required,
        "shuffle": directives.flag,
        "letters": directives.flag,
    }

    def run(self):
        node = mcqscore_node()
        node["question"] = self.options.get("question", "")
        node["letters"] = "letters" in self.options
        node["shuffle"] = "shuffle" in self.options

        # Extract choices
        choices = [line.rstrip() for line in self.content if line.rstrip().startswith("[") and "]" in line]

        # Shuffle if requested
        if node["shuffle"]:
            random.shuffle(choices)

        # Parse choices
        parsed = []
        for ch in choices:
            m = re.match(r"^\[\s*([^\]])\s*\]\s*(.*)$", ch)
            if not m:
                continue
            marker, remainder = m.groups()
            is_correct = marker.lower() == "x"
            if "|" in remainder:
                text, explanation = remainder.split("|", 1)
                text, explanation = text.strip(), explanation.strip()
            else:
                text, explanation = remainder.strip(), None
            parsed.append({
                "text": text,
                "correct": is_correct,
                "explanation": explanation
            })

        # Determine if single or multiple correct
        node["single_correct"] = sum(c["correct"] for c in parsed) == 1

        # Radio group name (for single-choice)
        if not hasattr(self.env, "mcqscore_counter"):
            self.env.mcqscore_counter = 0
        self.env.mcqscore_counter += 1
        group_name = f"mcqscore-{self.env.mcqscore_counter}"

        # Build HTML
        for i, ch in enumerate(parsed):
            letter = chr(ord("A") + i) if node["letters"] else ""
            explanation_id = f"exp-{self.env.mcqscore_counter}-{i}"

            input_type = "radio" if node["single_correct"] else "checkbox"
            input_html = f'<input type="{input_type}" name="{group_name}" class="mcqscore-single">'

            html_str = f'''
<div class="mcqscore-choice" data-correct="{str(ch["correct"]).lower()}" data-explanation-id="{explanation_id}">
  <label>
    {input_html}
    <span class="mcqscore-letter">{letter}</span>
    <span class="mcqscore-choice-label">{html.escape(ch["text"])}</span>
  </label>
'''
            if ch["explanation"]:
                html_str += (
                    f'<div id="{explanation_id}" class="mcqscore-explanation hidden-explanation">'
                    f'{html.escape(ch["explanation"])}'
                    f'</div>'
                )
            html_str += "</div>"

            node += nodes.raw("", html_str, format="html")

        return [node]

# ─────────────────────────────────────
# Setup
# ─────────────────────────────────────
def on_config_inited(app, config):
    ext_static = os.path.join(os.path.dirname(__file__), "_static")
    if ext_static not in config.html_static_path:
        config.html_static_path.append(ext_static)

def setup(app):
    app.add_node(mcqscore_node, html=(visit_mcqscore_html, depart_mcqscore_html))
    app.add_directive("mcqscore", MCQScoreDirective)
    app.add_directive("mcqscore-start", MCQScoreStart)
    app.add_directive("mcqscore-end", MCQScoreEnd)

    static_path = os.path.join(os.path.dirname(__file__), "_static")
    if static_path not in app.config.html_static_path:
        app.config.html_static_path.append(static_path)

    app.connect("config-inited", on_config_inited)

    app.add_js_file("mcqscore.js")
    app.add_css_file("mcqscore.css")

    return {
        "version": "2.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True
    }
