import html
import random
from docutils import nodes
from docutils.parsers.rst import Directive
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective

class cloze_node(nodes.General, nodes.Element):
    pass

def visit_cloze_html(self, node):
    self.body.append('<div class="cloze-block">')

def depart_cloze_html(self, node):
    self.body.append('</div>')


class ClozeDirective(SphinxDirective):
    has_content = True

    # Define directive options flag configuration
    option_spec = {
        'auto-distract': directives.flag,
    }

    def run(self):
        full_text = "\n".join(self.content)
        node = cloze_node()

        # Check if user added the option flag to their directive stanza instance
        auto_distract = 'auto-distract' in self.options

        remaining_text = full_text
        parsed_html_parts = []
        word_bank_items = []
        gap_counter = 0

        while "*[" in remaining_text and "]*" in remaining_text:
            gap_counter += 1
            start_idx = remaining_text.index("*[")
            end_idx = remaining_text.index("]*")

            parsed_html_parts.append(html.escape(remaining_text[:start_idx]))
            gap_content = remaining_text[start_idx + 2:end_idx].strip()

            if "/" not in gap_content:
                # Conditionally insert alternative based on the directive toggle flag choice
                if auto_distract:
                    options = [gap_content, "incorrect_option"]
                else:
                    options = [gap_content]
            else:
                options = [opt.strip() for opt in gap_content.split("/")]

            correct_answer = options[0]
            word_bank_items.extend(options)

            # Structured wrapper ensuring feedback is tightly bound to its dropzone
            drop_zone_html = f'''<span class="cloze-wrapper">
                <span class="cloze-dropzone" data-gap-id="{gap_counter}" data-correct="{html.escape(correct_answer.lower())}">Drop here</span>
                <span class="cloze-inline-feedback"></span>
            </span>'''

            parsed_html_parts.append(drop_zone_html)
            remaining_text = remaining_text[end_idx + 2:]

        parsed_html_parts.append(html.escape(remaining_text))

        # Deduplicate and shuffle tray items
        word_bank_items = list(set(word_bank_items))
        random.shuffle(word_bank_items)

        bank_html = '<div class="cloze-wordbank-title">Word Bank (Drag items below):</div>'
        bank_html += '<div class="cloze-wordbank-tray">'
        for word in word_bank_items:
            bank_html += f'<div class="cloze-draggable" draggable="true" data-word="{html.escape(word.lower())}">{html.escape(word)}</div>'
        bank_html += '</div><hr class="cloze-divider">'

        combined_text_html = "".join(parsed_html_parts).replace("\n", "<br>")
        final_html = f'{bank_html}<p class="cloze-content">{combined_text_html}</p>'
        node += nodes.raw("", final_html, format="html")

        return [node]

def setup(app):
    app.add_node(cloze_node, html=(visit_cloze_html, depart_cloze_html))
    app.add_directive("cloze", ClozeDirective)
    app.add_js_file("cloze.js")
    app.add_css_file("cloze.css")

    return {"version": "3.2", "parallel_read_safe": True, "parallel_write_safe": True}