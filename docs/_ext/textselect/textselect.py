import html
import json
import re
from pathlib import Path
from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective


class textselect_node(nodes.General, nodes.Element):
    pass


def visit_textselect_html(self, node):
    chosen_theme = node.get("theme", "")
    chosen_color = node.get("color", "blue")
    chosen_style = node.get("style", "filled")

    theme_class = f"theme-{chosen_theme}" if chosen_theme else ""
    color_class = f"ts-color-{chosen_color}"
    style_class = f"ts-style-{chosen_style}"

    classes = " ".join(filter(None, ["textselect-block", theme_class, color_class, style_class]))

    self.body.append(f'<div class="{classes}">')
    self.body.append(
        f'<div class="textselect-instructions">{node.get("instructions", "")}</div>'
    )
    self.body.append(
        f'<pre class="textselect-content" data-targets=\'{node.get("target_json", "[]")}\'>'
    )
    self.body.append(node.get("html_content", ""))
    self.body.append("</pre></div>")
    raise nodes.SkipNode


def depart_textselect_html(self, node):
    pass


class TextSelectDirective(SphinxDirective):
    has_content = True

    option_spec = {
        "theme": directives.unchanged,
        "instructions": directives.unchanged,
        "color": directives.unchanged,
        "style": directives.unchanged,  # Accepts: 'plain', 'border', or 'filled'
    }

    def run(self):
        full_text = "\n".join(self.content)
        node = textselect_node()

        # 1. Themes: White (default) and Light
        VALID_THEMES = ["white", "light"]
        chosen_theme = self.options.get("theme", "white").strip().lower()
        if chosen_theme not in VALID_THEMES:
            chosen_theme = "white"
        node["theme"] = chosen_theme

        # 2. Expanded Color Options
        chosen_color = self.options.get("color", "blue").strip().lower()
        valid_colors = [
            "red", "participant",
            "green", "process",
            "blue", "circ",
            "conj", "part",
            "theme", "rheme",
            "depclause", "embedded", "relative", "projected"
        ]
        if chosen_color not in valid_colors:
            chosen_color = "blue"
        node["color"] = chosen_color

        # 3. Style Option
        chosen_style = self.options.get("style", "filled").strip().lower()
        if chosen_style not in ["plain", "border", "filled"]:
            chosen_style = "filled"
        node["style"] = chosen_style

        node["instructions"] = html.escape(
            self.options.get(
                "instructions", "Click or drag to highlight the target words."
            )
        )

        target_pattern = re.compile(r"\{\{([^}]+)\}\}")
        target_indices = set()
        word_token_index = 0
        html_tokens = []

        raw_token_pattern = re.compile(r"\{\{([^}]+)\}\}|(\w+)|([^\w\s]+|\s+)")

        for match in raw_token_pattern.finditer(full_text):
            target_group, word_group, symbol_group = match.groups()

            if target_group:
                words = re.finditer(r"\w+|[^\w\s]+|\s+", target_group)
                for w in words:
                    val = w.group(0)
                    if re.match(r"^\w+$", val):
                        target_indices.add(word_token_index)
                        html_tokens.append(
                            f'<span class="ts-word" data-idx="{word_token_index}">{html.escape(val)}</span>'
                        )
                        word_token_index += 1
                    elif val.isspace():
                        html_tokens.append(
                            '<span class="ts-space"> </span>' * len(val)
                        )
                    else:
                        html_tokens.append(html.escape(val))
            elif word_group:
                html_tokens.append(
                    f'<span class="ts-word" data-idx="{word_token_index}">{html.escape(word_group)}</span>'
                )
                word_token_index += 1
            elif symbol_group:
                if symbol_group.isspace():
                    html_tokens.append(
                        symbol_group.replace("\n", "<br>").replace(
                            " ", '<span class="ts-space"> </span>'
                        )
                    )
                else:
                    html_tokens.append(html.escape(symbol_group))

        node["html_content"] = "".join(html_tokens)
        node["target_json"] = json.dumps(sorted(list(target_indices)))

        return [node]


def setup(app):
    app.add_node(
        textselect_node, html=(visit_textselect_html, depart_textselect_html)
    )
    app.add_directive("textselect", TextSelectDirective)

    static_path = Path(__file__).parent / "_static"
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file("textselect.js")
    app.add_css_file("textselect.css")

    return {
        "version": "1.1",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }