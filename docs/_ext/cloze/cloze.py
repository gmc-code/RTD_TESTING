import html
import random
import re
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

    # Configure Sphinx option spec parser correctly
    option_spec = {
        'auto-distract': directives.flag,
    }

    def run(self):
        # Join lines safely filtering out pure blank lines at the start
        full_text = "\n".join(self.content).strip()
        node = cloze_node()

        # Check if the flag is present in user options
        auto_distract = 'auto-distract' in self.options

        # Regex pattern to find all *[content]* components safely
        gap_pattern = re.compile(r'\*\[(.*?)\]\*')

        # FIRST PASS: Cleanly extract ONLY the genuine correct answers for the distractor pool
        all_real_words = []
        for match in gap_pattern.finditer(full_text):
            content = match.group(1).strip()
            # Extract only the true target answer (the text before a '/')
            real_word = content.split("/")[0].strip()
            if real_word and real_word not in all_real_words:
                all_real_words.append(real_word)

        # Emergency natural word list if there aren't enough sentences/gaps to borrow from
        fallback_pool = ["entity", "element", "instance", "item", "object", "thing", "value"]

        word_bank_items = []
        gap_counter = 0

        # SECOND PASS: Replace gaps with HTML structures cleanly using a callback handler
        def replace_gap(match):
            nonlocal gap_counter
            gap_counter += 1
            gap_content = match.group(1).strip()

            if "/" not in gap_content:
                correct_answer = gap_content
                if auto_distract:
                    # Isolate words that do not match the current blank space
                    pool = [w for w in all_real_words if w.lower() != correct_answer.lower()]
                    if not pool:
                        pool = [w for w in fallback_pool if w.lower() != correct_answer.lower()]

                    random_distractor = random.choice(pool)
                    options = [correct_answer, random_distractor]
                else:
                    options = [correct_answer]
            else:
                options = [opt.strip() for opt in gap_content.split("/")]

            final_correct = options[0]
            word_bank_items.extend(options)

            drop_zone_html = f'''<span class="cloze-wrapper">
                <span class="cloze-dropzone" data-gap-id="{gap_counter}" data-correct="{html.escape(final_correct.lower())}">Drop here</span>
                <span class="cloze-inline-feedback"></span>
            </span>'''
            return drop_zone_html

        # Escape standard HTML characters first, then insert our dropzone markup templates safely
        escaped_text = html.escape(full_text)

        # We unescape the specific markup tokens back so regex matching finds them cleanly
        escaped_text = escaped_text.replace(html.escape("*["), "*[").replace(html.escape("]*"), "]*")

        # Sub-process all matches safely without brittle slice indices breaking down
        combined_text_html = gap_pattern.sub(replace_gap, escaped_text)
        combined_text_html = combined_text_html.replace("\n", "<br>")

        # Deduplicate final tray options and randomize display sorting order
        word_bank_items = list(set(word_bank_items))
        random.shuffle(word_bank_items)

        bank_html = '<div class="cloze-wordbank-title">Word Bank (Drag items below):</div>'
        bank_html += '<div class="cloze-wordbank-tray">'
        for word in word_bank_items:
            bank_html += f'<div class="cloze-draggable" draggable="true" data-word="{html.escape(word.lower())}">{html.escape(word)}</div>'
        bank_html += '</div><hr class="cloze-divider">'

        final_html = f'{bank_html}<p class="cloze-content">{combined_text_html}</p>'
        node += nodes.raw("", final_html, format="html")

        return [node]

def setup(app):
    app.add_node(cloze_node, html=(visit_cloze_html, depart_cloze_html))
    app.add_directive("cloze", ClozeDirective)
    app.add_js_file("cloze.js")
    app.add_css_file("cloze.css")

    return {"version": "3.6", "parallel_read_safe": True, "parallel_write_safe": True}