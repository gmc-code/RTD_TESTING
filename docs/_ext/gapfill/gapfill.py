import html
import random
import re
from pathlib import Path
from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective

class gapfill_node(nodes.General, nodes.Element):
    pass

def visit_gapfill_html(self, node):
    chosen_theme = node.get('theme', 'light')
    theme_class = "gapfill-block theme-dark" if chosen_theme == "dark" else "gapfill-block theme-light"

    self.body.append(f'<div class="{theme_class}">')
    self.body.append(f'<pre class="gapfill-content">{node.get("html_content", "")}</pre>')
    self.body.append('</div>')
    raise nodes.SkipNode

def depart_gapfill_html(self, node):
    pass


class GapFillDirective(SphinxDirective):
    has_content = True

    option_spec = {
        'theme': directives.unchanged,
    }

    def run(self):
        full_text = "\n".join(self.content)
        node = gapfill_node()

        chosen_theme = self.options.get('theme', 'light').strip().lower()
        if chosen_theme not in ['light', 'dark']:
            chosen_theme = 'light'
        node['theme'] = chosen_theme

        # Define default dummy filler items used ONLY when a single choice is given
        default_alternatives = ["True", "False", "while", "for", "if", "else", "elif", "import", "from", "print", "pin0", "pin1", "pin2", "read_analog", "write_digital", "sleep"]

        # This pattern catches optional outside asterisks, the brackets, and optional inner asterisks
        pattern = re.compile(r'\*?(\*?)\[([^\]]+)\]\1\*?')
        parsed_html_parts = []
        remaining_text = full_text

        while True:
            match = pattern.search(remaining_text)
            if not match:
                break

            start_idx, end_idx = match.span()
            parsed_html_parts.append(html.escape(remaining_text[:start_idx]))

            # Isolate the choices string inside the brackets and strip inner decoration asterisks
            raw_choices_str = match.group(2).strip('*')

            # Splits options cleanly on \, /, |, or , characters
            raw_options = [opt.strip() for opt in re.split(r'[\\/|,]', raw_choices_str) if opt.strip()]

            if not raw_options:
                parsed_html_parts.append(html.escape(match.group(0)))
                remaining_text = remaining_text[end_idx:]
                continue

            correct_answer = raw_options[0]
            options = set(raw_options)

            # Only inject dummy alternatives if exactly 1 answer option was specified
            if len(raw_options) == 1:
                shuffled_defaults = default_alternatives.copy()
                random.shuffle(shuffled_defaults)
                for alt in shuffled_defaults:
                    if len(options) >= 4:
                        break
                    if alt not in options:
                        options.add(alt)

            # Build dropdown markup container node
            dropdown_html = f'<span class="gapfill-wrapper">'
            dropdown_html += f'<select class="gapfill-dropdown gapfill-input" data-correct="{html.escape(correct_answer)}">'
            dropdown_html += '<option value="">-- Choose --</option>'

            # Sort items in their exact specified casing styles cleanly
            for opt in sorted(options, key=str.lower):
                dropdown_html += f'<option value="{html.escape(opt)}">{html.escape(opt)}</option>'
            dropdown_html += '</select>'

            dropdown_html += '<span class="gapfill-inline-feedback"></span>'
            dropdown_html += '</span>'

            parsed_html_parts.append(dropdown_html)
            remaining_text = remaining_text[end_idx:]

        parsed_html_parts.append(html.escape(remaining_text))
        combined_html = "".join(parsed_html_parts).replace("\n", "<br>")
        node['html_content'] = combined_html

        return [node]


def setup(app):
    app.add_node(gapfill_node, html=(visit_gapfill_html, depart_gapfill_html))
    app.add_directive("gapfill", GapFillDirective)

    static_path = Path(__file__).parent / "_static"
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file("gapfill.js")
    app.add_css_file("gapfill.css")
    return {
        "version": "2.6",
        "parallel_read_safe": True,
        "parallel_write_safe": True
    }