import html
import hashlib
from pathlib import Path
from docutils import nodes
from docutils.parsers.rst import directives, DirectiveError
from sphinx.util.docutils import SphinxDirective

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
    letters_attr = str(node.get("letters", False)).lower()
    single_attr = str(node.get("single_correct", False)).lower()

    self.body.append(
        f'<div class="mcqscore-block" '
        f'data-mcqscore-single="{single_attr}" '
        f'data-mcqscore-shuffle="{shuffle_attr}" '
        f'data-mcqscore-letters="{letters_attr}">'
    )

    question = html.escape(node.get("question", ""))
    self.body.append(f'<p class="mcqscore-question">{question}</p>')


def depart_mcqscore_html(self, node):
    self.body.append("</div>")


# ─────────────────────────────────────
# Directive
# ─────────────────────────────────────
class MCQScoreDirective(SphinxDirective):
    has_content = True

    option_spec = {
        "question": directives.unchanged_required,
        "no-shuffle": directives.flag,
        "no-letters": directives.flag,
        "multi": directives.flag,
    }

    def run(self):
        node = mcqscore_node()

        # Core options
        node["question"] = self.options.get("question", "")
        node["shuffle"] = self.options.get("no-shuffle", None) is None
        node["letters"] = self.options.get("no-letters", None) is None

        # Mode: explicit
        is_multi = "multi" in self.options
        node["single_correct"] = not is_multi

        # ─────────────────────────────────────
        # Parse choices
        # ─────────────────────────────────────
        choices = []

        for line in self.content:
            stripped = line.strip()

            if stripped.startswith("[") and "]" in stripped:
                marker = stripped[1].lower()
                is_correct = marker == "x"

                text = stripped[stripped.index("]") + 1:].strip()

                if "|" in text:
                    text, explanation = text.split("|", 1)
                    text = text.strip()
                    explanation = explanation.strip()
                else:
                    explanation = None

                choices.append({
                    "text": text,
                    "correct": is_correct,
                    "explanation": explanation
                })

        # ─────────────────────────────────────
        # Validation
        # ─────────────────────────────────────
        if not choices:
            raise DirectiveError(
                3,
                f"MCQ error: '{node['question']}' has no answer choices."
            )

        correct_count = sum(c["correct"] for c in choices)

        if not is_multi and correct_count != 1:
            raise DirectiveError(
                3,
                f"MCQ error: '{node['question']}' must have exactly ONE correct answer (add :multi: for multiple)."
            )

        if is_multi and correct_count == 0:
            raise DirectiveError(
                3,
                f"MCQ error: '{node['question']}' must have at least one correct answer."
            )

        # ─────────────────────────────────────
        # Input type
        # ─────────────────────────────────────
        input_type = "checkbox" if is_multi else "radio"

        group_name = hashlib.md5(
            node["question"].encode("utf-8")
        ).hexdigest()

        # ─────────────────────────────────────
        # Generate HTML
        # ─────────────────────────────────────
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

            if ch["explanation"]:
                html_str += (
                    f'<div class="mcqscore-explanation">'
                    f'{html.escape(ch["explanation"])}'
                    f'</div>'
                )

            html_str += "</div>"

            node += nodes.raw("", html_str, format="html")

        return [node]


# ─────────────────────────────────────
# Setup
# ─────────────────────────────────────
def setup(app):
    app.add_node(
        mcqscore_node,
        html=(visit_mcqscore_html, depart_mcqscore_html)
    )

    app.add_directive("mcqscore", MCQScoreDirective)

    static_path = Path(__file__).parent / "_static"

    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file("mcqscore.js")
    app.add_css_file("mcqscore.css")

    return {
        "version": "4.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }