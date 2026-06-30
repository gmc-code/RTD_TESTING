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

    # Register the auto-distract option flag
    option_spec = {
        'auto-distract': directives.flag,
    }

    def run(self):
        full_text = "\n".join(self.content)
        node = cloze_node()

        auto_distract = 'auto-distract' in self.options

        # FIRST PASS: Extract all actual words from the text to build a dynamic distractor pool
        all_real_words = []
        temp_text = full_text
        while "*[" in temp_text and "]*" in temp_text:
            s_idx = temp_text.index("*[")
            e_idx = temp_text.index("]*")
            content = temp_text[s_idx + 2:e_idx].strip()
            real_word = content.split("/")[0].strip()
            if real_word:
                all_real_words.append(real_word)
            temp_text = temp_text[e_idx + 2:]

        # Safe grammatical fallback terms if there aren't enough other gaps in the document
        fallback_pool = ["people", "items", "stuff", "place", "something", "group", "object"]

        remaining_text = full_text
        parsed_html_parts = []
        word_bank_items = []
        gap_counter = 0

        # SECOND PASS: Generate output nodes and match strings safely
        while "*[" in remaining_text and "]*" in remaining_text:
            gap_counter += 1
            start_idx = remaining_text.index("*[")
            end_idx = remaining_text.index("]*")

            parsed_html_parts.append(html.escape(remaining_text[:start_idx]))
            gap_content = remaining_text[start_idx + 2:end_idx].strip()

            if "/" not in gap_content:
                correct_answer = gap_content
                if auto_distract:
                    # Filter out current answer to ensure the option is an actual incorrect choice
                    pool = [w for w in all_real_words if w.lower() != correct_answer.lower()]
                    if not pool:
                        pool = [w for w in fallback_pool if w.lower() != correct_answer.lower()]

                    random_distractor = random.choice(pool)
                    options = [correct_answer, random_distractor]
                else:
                    options = [correct_answer]
            else:
                options = [opt.strip() for opt in gap_content.split("/")]

            correct_answer = options[0]
            word_bank_items.extend(options)

            drop_zone_html = f'''<span class="cloze-wrapper">
                <span class="cloze-dropzone" data-gap-id="{gap_counter}" data-correct="{html.escape(correct_answer.lower())}">Drop here</span>
                <span class="cloze-inline-feedback"></span>
            </span>'''

            parsed_html_parts.append(drop_zone_html)
            remaining_text = remaining_text[end_idx + 2:]

        parsed_html_parts.append(html.escape(remaining_text))

        # Deduplicate tray words and randomize sorting order
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

    return {"version": "3.4", "parallel_read_safe": True, "parallel_write_safe": True}