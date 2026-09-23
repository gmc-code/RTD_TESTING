import html
import hashlib
from pathlib import Path
from docutils import nodes
from docutils.parsers.rst import directives, DirectiveError
from sphinx.util.docutils import SphinxDirective
from docutils.statemachine import StringList


# ─────────────────────────────────────
# Nodes
# ─────────────────────────────────────
class trueorfalse_node(nodes.General, nodes.Element):
    pass

class tf_choice_container_node(nodes.General, nodes.Element):
    pass

class tf_choice_label_node(nodes.General, nodes.Element):
    pass


# ─────────────────────────────────────
# HTML Visitors
# ─────────────────────────────────────
def visit_trueorfalse_html(self, node):
    theme_attr = node.get("theme", "white")
    show_feedback_default = "true" if node.get("show_feedback", False) else "false"
    self.body.append(
        f'<div class="tf-block theme-{theme_attr}" data-show-feedback="{show_feedback_default}">'
    )

def depart_trueorfalse_html(self, node):
    show_fb_checked = ' checked' if node.get("show_feedback", False) else ''
    self.body.append(
        '<div class="tf-controls">'
        '  <button type="button" class="tf-btn-check">Check</button>'
        '  <button type="button" class="tf-btn-reset">Reset</button>'
        '  <label class="tf-toggle-feedback-label">'
        f'   <input type="checkbox" class="tf-toggle-feedback"{show_fb_checked}> Show Feedback'
        '  </label>'
        '  <span class="tf-feedback"></span>'
        '</div>'
    )
    self.body.append("</div>")

def visit_tf_choice_container_html(self, node):
    is_correct = str(node.get("correct", False)).lower()
    self.body.append(f'<div class="tf-choice" data-correct="{is_correct}">')

def depart_tf_choice_container_html(self, node):
    self.body.append("</div>")

def visit_tf_choice_label_html(self, node):
    group_name = node.get("group_name", "")
    self.body.append('<label>')
    self.body.append(f'<input type="radio" name="tf-{group_name}">')
    self.body.append('<div class="tf-choice-label">')

def depart_tf_choice_label_html(self, node):
    self.body.append('</div>')
    self.body.append('</label>')


# ─────────────────────────────────────
# Directive Implementation
# ─────────────────────────────────────
class trueorfalseDirective(SphinxDirective):
    has_content = True

    option_spec = {
        "theme": lambda argument: directives.choice(argument, ("white", "light")),
        "delimiter": directives.unchanged,
        "show-feedback": directives.flag,
    }

    def run(self):
        node = trueorfalse_node()

        chosen_theme = self.options.get("theme", "white").strip().lower()
        if chosen_theme not in ["white", "light"]:
            chosen_theme = "white"
        node["theme"] = chosen_theme

        # Setting :show-feedback: in rst makes the UI checkbox checked by default
        node["show_feedback"] = "show-feedback" in self.options

        delimiter = self.options.get("delimiter", "|")

        # ─────────────────────────────────────
        # Separate Question Block from Choice Block
        # ─────────────────────────────────────
        choice_start_idx = None
        for idx, line in enumerate(self.content):
            stripped = line.strip()
            if stripped.startswith("[") and "]" in stripped:
                choice_start_idx = idx
                break

        if choice_start_idx is None:
            question_lines = self.content
            choice_lines = ["[x] True", "[ ] False"]
        else:
            question_lines = self.content[:choice_start_idx]
            choice_lines = self.content[choice_start_idx:]

        # ─────────────────────────────────────
        # Parse Question Body Natively
        # ─────────────────────────────────────
        question_container = nodes.container(classes=["tf-question"])
        question_container.document = self.state.document
        self.state.nested_parse(question_lines, self.content_offset, question_container)
        node += question_container

        # ─────────────────────────────────────
        # Parse Choice Options
        # ─────────────────────────────────────
        raw_choices = []
        current_choice = None

        for line in choice_lines:
            stripped = line.strip()

            if stripped.startswith("[") and "]" in stripped:
                marker = stripped[1].lower()
                is_correct = marker == "x"

                right_bracket_idx = line.find("]")
                content_start = line[right_bracket_idx + 1:]

                current_choice = {
                    "correct": is_correct,
                    "text_lines": [],
                    "explanation_lines": [],
                    "in_explanation": False
                }
                raw_choices.append(current_choice)

                if delimiter in content_start:
                    txt, exp = content_start.split(delimiter, 1)
                    if txt.strip():
                        current_choice["text_lines"].append(txt)
                    if exp.strip():
                        current_choice["explanation_lines"].append(exp)
                    current_choice["in_explanation"] = True
                else:
                    if content_start.strip():
                        current_choice["text_lines"].append(content_start)

            elif current_choice is not None:
                if delimiter in line:
                    txt, exp = line.split(delimiter, 1)
                    if txt.strip():
                        current_choice["text_lines"].append(txt)
                    if exp.strip():
                        current_choice["explanation_lines"].append(exp)
                    current_choice["in_explanation"] = True
                else:
                    if current_choice["in_explanation"]:
                        current_choice["explanation_lines"].append(line)
                    else:
                        current_choice["text_lines"].append(line)

        if len(raw_choices) < 2:
            raise DirectiveError(3, "True/False error: Must specify two options (True and False).")

        seed_string = "".join("".join(c["text_lines"]) for c in raw_choices)
        group_name = hashlib.md5(seed_string.encode("utf-8")).hexdigest()

        def normalize_line_blocks(lines):
            cleaned = []
            for l in lines:
                stripped = l.strip()
                if stripped.startswith("|"):
                    cleaned.append(f"| {stripped[1:].strip()}")
                else:
                    cleaned.append(l)
            return cleaned

        # ─────────────────────────────────────
        # Convert Choices into Structural Node Trees
        # ─────────────────────────────────────
        source_file = self.content.source(0) if len(self.content) > 0 else "trueorfalse"

        for ch in raw_choices:
            choice_wrap = tf_choice_container_node(correct=ch["correct"])
            label_element = tf_choice_label_node(group_name=group_name)

            # Parse Choice Label Text
            text_lines = normalize_line_blocks(ch["text_lines"])
            text_container = nodes.container()
            text_container.document = self.state.document

            choice_text_sl = StringList(text_lines, source=source_file)
            self.state.nested_parse(choice_text_sl, self.content_offset, text_container)
            label_element.extend(text_container.children)
            choice_wrap += label_element

            # Parse Explanation Text
            if ch["explanation_lines"]:
                exp_container = nodes.container(classes=["tf-explanation"])
                exp_container.document = self.state.document

                exp_lines = normalize_line_blocks(ch["explanation_lines"])
                explanation_sl = StringList(exp_lines, source=source_file)
                self.state.nested_parse(explanation_sl, self.content_offset, exp_container)
                choice_wrap += exp_container

            node += choice_wrap

        return [node]


# ─────────────────────────────────────
# Setup Hook
# ─────────────────────────────────────
def setup(app):
    app.add_node(
        trueorfalse_node,
        html=(visit_trueorfalse_html, depart_trueorfalse_html)
    )
    app.add_node(
        tf_choice_container_node,
        html=(visit_tf_choice_container_html, depart_tf_choice_container_html)
    )
    app.add_node(
        tf_choice_label_node,
        html=(visit_tf_choice_label_html, depart_tf_choice_label_html)
    )

    app.add_directive("trueorfalse", trueorfalseDirective)

    static_path = str(Path(__file__).parent / "_static")
    if static_path not in app.config.html_static_path:
        app.config.html_static_path.append(static_path)

    app.add_js_file("trueorfalse.js")
    app.add_css_file("trueorfalse.css")

    return {
        "version": "1.3",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }