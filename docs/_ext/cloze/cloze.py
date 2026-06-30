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

    option_spec = {
        'auto-distract': directives.flag,
    }

    def run(self):
        full_text = "\n".join(self.content).strip()
        node = cloze_node()

        auto_distract = 'auto-distract' in self.options
        gap_pattern = re.compile(r'\*\[(.*?)\]\*')

        # 1. FIRST PASS: Extract all actual answers inside *[...]* gaps
        all_real_answers = []
        for match in gap_pattern.finditer(full_text):
            content = match.group(1).strip()
            real_word = content.split("/")[0].strip()
            if real_word and real_word not in all_real_answers:
                all_real_answers.append(real_word)

        # 2. HARVEST POOL: Extract words from the actual text surrounding the gaps
        # Remove markdown gap brackets so we can read the raw sentence words safely
        clean_passage = gap_pattern.sub(r'\1', full_text)
        # Find all alpha-numeric words (3+ letters long) to filter out commas, periods, short filler tokens
        raw_words = re.findall(r'\b[a-zA-Z]{3,}\b', clean_passage)

        # Filter out common stop words to ensure high-quality distractors
        stop_words = {
            "the", "and", "this", "that", "with", "from", "into", "called", "known",
            "a", "an", "of", "to", "in", "is", "for", "on", "but", "by", "as",
            "at", "are", "be", "it", "its", "or", "was", "not", "your", "my"
        }

        harvested_pool = []
        for w in raw_words:
            w_clean = w.strip()
            w_lower = w_clean.lower()
            if (w_lower not in stop_words and
                w_lower not in [ans.lower() for ans in all_real_answers] and
                w_clean not in harvested_pool):
                harvested_pool.append(w_clean)

        word_bank_items = []
        gap_counter = 0

        # 3. SECOND PASS: Construct individual gap elements
        def replace_gap(match):
            nonlocal gap_counter
            gap_counter += 1
            gap_content = match.group(1).strip()

            if "/" not in gap_content:
                correct_answer = gap_content
                options = [correct_answer]

                if auto_distract:
                    # Prefer answers from other gaps first as the primary distractors
                    other_gap_answers = [w for w in all_real_answers if w.lower() != correct_answer.lower()]
                    random.shuffle(other_gap_answers)
                    options.extend(other_gap_answers)

                    # Supplement with extra unique harvested text words until there are at least 3 options
                    scrambled_harvest = harvested_pool.copy()
                    random.shuffle(scrambled_harvest)

                    for text_word in scrambled_harvest:
                        if len(options) >= 3: # Sets a standard target option length per gap
                            break
                        if text_word.lower() not in [o.lower() for o in options]:
                            options.append(text_word)
            else:
                options = [opt.strip() for opt in gap_content.split("/")]

            final_correct = options[0]
            word_bank_items.extend(options)

            drop_zone_html = f'''<span class="cloze-wrapper">
                <span class="cloze-dropzone" data-gap-id="{gap_counter}" data-correct="{html.escape(final_correct.lower())}">Drop here</span>
                <span class="cloze-inline-feedback"></span>
            </span>'''
            return drop_zone_html

        escaped_text = html.escape(full_text)
        escaped_text = escaped_text.replace(html.escape("*["), "*[").replace(html.escape("]*"), "]*")

        combined_text_html = gap_pattern.sub(replace_gap, escaped_text)
        combined_text_html = combined_text_html.replace("\n", "<br>")

        # Deduplicate and mix final items together
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

    return {"version": "3.8", "parallel_read_safe": True, "parallel_write_safe": True}