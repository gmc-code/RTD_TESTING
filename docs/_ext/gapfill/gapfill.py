import html
import hashlib
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
        # Join all lines of content into a single block of raw text
        full_text = "\n".join(self.content)

        node = gapfill_node()

        # We will parse the text and replace [answers] with raw HTML inline
        remaining_text = full_text
        parsed_html_parts = []

        while "[" in remaining_text and "]" in remaining_text:
            start_idx = remaining_text.index("[")
            end_idx = remaining_text.index("]")

            # Append standard text leading up to the bracket segment
            parsed_html_parts.append(html.escape(remaining_text[:start_idx]))

            # Extract out the contents within the bracket
            gap_content = remaining_text[start_idx + 1:end_idx].strip()

            # Case A: Dropdown Mode -> Detect choices separated by forward slashes
            if "/" in gap_content:
                options = [opt.strip() for opt in gap_content.split("/")]
                correct_answer = options[0]  # The first element is always the true key

                dropdown_html = f'<select class="gapfill-input gapfill-dropdown" data-correct="{html.escape(correct_answer.lower())}">'
                dropdown_html += '<option value="">-- Choose --</option>'

                # Sort them alphabetically for display
                for opt in sorted(options, key=str.lower):
                    dropdown_html += f'<option value="{html.escape(opt.lower())}">{html.escape(opt)}</option>'
                dropdown_html += '</select>'

                parsed_html_parts.append(dropdown_html)

            # Case B: Free Text Entry Input Mode
            else:
                # Use a clean md5 hash so the answer isn't plainly visible in inspection
                answer_hash = hashlib.md5(gap_content.lower().encode("utf-8")).hexdigest()
                input_html = f'<input type="text" class="gapfill-input gapfill-text" data-hash="{answer_hash}" placeholder="..."> '
                parsed_html_parts.append(input_html)

            remaining_text = remaining_text[end_idx + 1:]

        # Append any leftover trailing text strings
        parsed_html_parts.append(html.escape(remaining_text))

        # Reassemble parsed elements inside a raw HTML block node
        combined_html = "".join(parsed_html_parts).replace("\n", "<br>")
        node += nodes.raw("", f'<p class="gapfill-content">{combined_html}</p>', format="html")

        return [node]

def setup(app):
    app.add_node(gapfill_node, html=(visit_gapfill_html, depart_gapfill_html))
    app.add_directive("gapfill", GapFillDirective)

    # Added asset configurations explicitly
    app.add_js_file("gapfill.js")
    app.add_css_file("gapfill.css")

    return {
        "version": "1.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True
    }