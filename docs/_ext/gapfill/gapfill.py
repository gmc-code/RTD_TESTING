import html
from docutils import nodes
from docutils.parsers.rst import Directive
from sphinx.util.docutils import SphinxDirective

class gapfill_node(nodes.General, nodes.Element):
    pass

def visit_gapfill_html(self, node):
    self.body.append('<div class="gapfill-block">')

def depart_gapfill_html(self, node):
    self.body.append('</div>')


class GapFillDirective(SphinxDirective):
    has_content = True

    def run(self):
        full_text = "\n".join(self.content)
        node = gapfill_node()

        remaining_text = full_text
        parsed_html_parts = []

        # Loop while our new custom starting string sequence is found
        while "*[" in remaining_text and "]*" in remaining_text:
            start_idx = remaining_text.index("*[")
            end_idx = remaining_text.index("]*")

            # Append plain text leading up to the target indicator block
            parsed_html_parts.append(html.escape(remaining_text[:start_idx]))

            # Extract the content inside (skipping the 2 characters of '*[')
            gap_content = remaining_text[start_idx + 2:end_idx].strip()

            # Handle choices splitting
            if "/" not in gap_content:
                options = [gap_content, "incorrect_option"]
            else:
                options = [opt.strip() for opt in gap_content.split("/")]

            correct_answer = options[0]  # First element represents the correct target key

            # Wrap everything inside an inline block element row container wrapper
            dropdown_html = '<span class="gapfill-wrapper">'
            dropdown_html += f'<select class="gapfill-input gapfill-dropdown" data-correct="{html.escape(correct_answer.lower())}">'
            dropdown_html += '<option value="">-- Choose --</option>'

            for opt in sorted(options, key=str.lower):
                dropdown_html += f'<option value="{html.escape(opt.lower())}">{html.escape(opt)}</option>'
            dropdown_html += '</select>'

            # Match badge placeholders alongside select dropdown nodes for script injecting
            dropdown_html += '<span class="gapfill-inline-feedback"></span>'
            dropdown_html += '</span>'

            parsed_html_parts.append(dropdown_html)

            # Shift the cursor parsing lookup reference index frame past the closing target ']*'
            remaining_text = remaining_text[end_idx + 2:]

        parsed_html_parts.append(html.escape(remaining_text))

        combined_html = "".join(parsed_html_parts).replace("\n", "<br>")
        node += nodes.raw("", f'<p class="gapfill-content">{combined_html}</p>', format="html")

        return [node]

def setup(app):
    app.add_node(gapfill_node, html=(visit_gapfill_html, depart_gapfill_html))
    app.add_directive("gapfill", GapFillDirective)
    app.add_js_file("gapfill.js")
    app.add_css_file("gapfill.css")

    return {"version": "2.1", "parallel_read_safe": True, "parallel_write_safe": True}