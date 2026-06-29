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

def depart_mcqscore_html(self, node):
    self.body.append("</div>")

# ─────────────────────────────────────
# Directive
# ─────────────────────────────────────
class MCQScoreDirective(SphinxDirective):
    has_content = True

    option_spec = {
        "no-shuffle": directives.flag,
        "no-letters": directives.flag,
    }

    def run(self):
        node = mcqscore_node()

        # Core options
        node["shuffle"] = "no-shuffle" not in self.options
        node["letters"] = "no-letters" not in self.options

        # ─────────────────────────────────────
        # Separate Question Block from Choice Block
        # ─────────────────────────────────────
        question_lines = []
        choice_lines = []
        parsing_choices = False

        for line in self.content:
            stripped = line.strip()

            # Detect where choices begin
            if stripped.startswith("[") and "]" in stripped:
                parsing_choices = True

            if parsing_choices:
                choice_lines.append(line)
            else:
                question_lines.append(line)

        # ─────────────────────────────────────
        # Parse the Question Natively (Allows nested code blocks!)
        # ─────────────────────────────────────
        question_container = nodes.container(classes=["mcqscore-question"])
        self.state.nested_parse(question_lines, self.content_offset, question_container)
        node += question_container

        # ─────────────────────────────────────
        # Parse choices
        # ─────────────────────────────────────
        choices = []
        for line in choice_lines:
            stripped = line.strip()
            if not stripped:
                continue

            if stripped.startswith("[") and "]" in stripped:
                marker = stripped[1].lower()
                is_correct = marker == "x"

                text = stripped[stripped.index("]") + 1:].strip()

                # Clean up your experimental tracking numbers (e.g., '1print' -> 'print')
                # if text and text[0].isdigit():
                #     text = text[1:].strip()

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
        # Validation & Auto-Mode Selection
        # ─────────────────────────────────────
        if not choices:
            raise DirectiveError(3, "MCQ error: Missing answer choices block.")

        correct_count = sum(c["correct"] for c in choices)
        if correct_count == 0:
            raise DirectiveError(3, "MCQ error: Must mark at least one option correct [x].")

        is_multi = correct_count > 1
        node["single_correct"] = not is_multi

        # Create a unique group name using hash of choice texts combined
        seed_string = "".join(c["text"] for c in choices)
        group_name = hashlib.md5(seed_string.encode("utf-8")).hexdigest()

        # ─────────────────────────────────────
        # Generate Choice Elements HTML
        # ─────────────────────────────────────
        input_type = "checkbox" if is_multi else "radio"

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
        "version": "4.2",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }

