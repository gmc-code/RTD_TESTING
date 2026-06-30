import html
import random
import re
from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective

class ordering_node(nodes.General, nodes.Element):
    pass

def visit_ordering_html(self, node):
    self.body.append('<div class="ordering-block">')

def depart_ordering_html(self, node):
    self.body.append('</div>')

class OrderingDirective(SphinxDirective):
    has_content = True

    option_spec = {
        'theme': directives.unchanged,
    }

    def run(self):
        node = ordering_node()
        raw_lines = [line for line in self.content if line.strip()]

        if not raw_lines:
            return []

        chosen_theme = self.options.get('theme', 'light').strip().lower()
        if chosen_theme not in ['light', 'dark']:
            chosen_theme = 'light'

        line_items = []
        for index, line in enumerate(raw_lines):
            leading_spaces = len(line) - len(line.lstrip())
            indent_level = leading_spaces // 4

            line_items.append({
                'correct_idx': index,
                'text': line.strip(),
                'indent': indent_level
            })

        shuffled_items = line_items.copy()
        random.shuffle(shuffled_items)

        html_output = '<div class="ordering-instructions">Drag and drop lines into the correct order and click to adjust indentation:</div>'
        html_output += f'<div class="ordering-container theme-{chosen_theme}">'

        for item in shuffled_items:
            escaped_text = html.escape(item['text'])
            html_output += f'''
            <div class="ordering-line"
                 draggable="true"
                 data-correct-idx="{item['correct_idx']}"
                 data-correct-indent="{item['indent']}"
                 data-current-indent="0"
                 style="--indent-level: 0;">
                <span class="ordering-handle">☰</span>
                <code class="ordering-code">{escaped_text}</code>
                <div class="ordering-indent-controls">
                    <button type="button" class="indent-btn decrease" title="Decrease Indent">«</button>
                    <button type="button" class="indent-btn increase" title="Increase Indent">»</button>
                </div>
            </div>
            '''
        html_output += '</div>'

        html_output += '''
        <div class="ordering-controls">
            <button type="button" class="ordering-btn-score">Check Order</button>
            <button type="button" class="ordering-btn-reset">Reset</button>
            <span class="ordering-feedback-badge"></span>
        </div>
        '''

        node += nodes.raw("", html_output, format="html")
        return [node]

def setup(app):
    app.add_node(ordering_node, html=(visit_ordering_html, depart_ordering_html))
    # UPDATED REGISTERED DIRECTIVE NAME HERE
    app.add_directive("ordering", OrderingDirective)
    app.add_js_file("ordering.js")
    app.add_css_file("ordering.css")
    return {"version": "1.4", "parallel_read_safe": True, "parallel_write_safe": True}