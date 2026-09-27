import html
import random
from pathlib import Path

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective

class sorting_node(nodes.General, nodes.Element):
    pass

def visit_sorting_html(self, node):
    pass

def depart_sorting_html(self, node):
    pass

class classifyingDirective(SphinxDirective):
    has_content = True

    option_spec = {
        'theme': directives.unchanged,
        'bins': directives.unchanged,         # Explicit comma-separated list of categories
        'instructions': directives.unchanged, # Custom instruction text override
        'shuffle': directives.flag,
        'nosort': directives.flag,
        'sort': directives.unchanged,
        'solution': directives.unchanged,     # Accepts "true"/"false" or can be used as flag
    }

    def run(self):
        node = sorting_node()
        raw_lines = [line.strip() for line in self.content if line.strip()]

        if not raw_lines:
            return []

        # 1. Parse Items and Categories (Key: Value)
        parsed_items = []
        collected_categories = []

        for line in raw_lines:
            if ":" in line:
                item_text, category = line.split(":", 1)
                item_text = item_text.strip()
                category = category.strip()

                parsed_items.append({
                    'text': item_text,
                    'category': category
                })

                if category not in collected_categories:
                    collected_categories.append(category)

        # 2. Resolve Bin Names
        bin_option = self.options.get('bins', '')
        if bin_option:
            # Explicit :bins: option overrides everything
            bin_names = [b.strip() for b in bin_option.split(',')]
        else:
            # Collect unique categories maintaining case-insensitive alphabetical order (A-Z)
            bin_names = sorted(collected_categories, key=lambda s: s.lower())

        # Map categories to their bin indices
        items = []
        for item in parsed_items:
            category = item['category']
            bin_idx = bin_names.index(category) if category in bin_names else 0
            items.append({
                'text': item['text'],
                'correct_bin': bin_idx
            })

        # 3. Handle Sorting / Shuffling & Options
        chosen_theme = self.options.get('theme', 'white').strip().lower()
        if chosen_theme not in ['light', 'white']:
            chosen_theme = 'white'

        instructions_text = self.options.get(
            'instructions',
            'Classify each item into its correct category:'
        ).strip()

        sort_opt = self.options.get('sort', '').strip().lower()
        if 'nosort' in self.options or sort_opt in ['false', 'no', '0']:
            should_shuffle = False
        else:
            should_shuffle = True

        if should_shuffle:
            random.shuffle(items)

        shuffle_attr = "true" if should_shuffle else "false"

        # Check solution option
        solution_opt = self.options.get('solution', '').strip().lower()
        show_solution = 'solution' in self.options or solution_opt in ['true', 'yes', '1']

        # 4. Generate HTML Output
        html_output = f'<div class="classifying-block {chosen_theme}">'
        html_output += f'<div class="classifying-instructions">{html.escape(instructions_text)}</div>'
        html_output += f'<div class="classifying-container" data-shuffle="{shuffle_attr}">'

        for item in items:
            html_output += f'''
            <div class="classifying-line">
                <span class="classifying-code">{html.escape(item['text'])}</span>
                <div class="classifying-indent-controls" style="margin-left: auto;">
                    <select class="sorting-select" data-correct-bin="{item['correct_bin']}">
                        <option value="">-- Select Bin --</option>
            '''

            for idx, bin_name in enumerate(bin_names):
                html_output += f'<option value="{idx}">{html.escape(bin_name)}</option>'

            html_output += f'''
                    </select>
                </div>
            </div>
            '''
        html_output += '</div>'

        # Control panel
        solution_btn_html = '<button type="button" class="classifying-btn-solution">Solution</button>' if show_solution else ''

        html_output += f'''
        <div class="classifying-controls">
            <button type="button" class="classifying-btn-score">Check</button>
            {solution_btn_html}
            <button type="button" class="classifying-btn-reset">Reset</button>
            <span class="classifying-feedback-badge"></span>
        </div>
        </div>
        '''

        node += nodes.raw("", html_output, format="html")
        return [node]


def setup(app):
    app.add_node(sorting_node, html=(visit_sorting_html, depart_sorting_html))
    app.add_directive("classifying", classifyingDirective)

    static_path = Path(__file__).parent / "_static"
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file("classifying.js")
    app.add_css_file("classifying.css")

    return {"version": "1.0", "parallel_read_safe": True, "parallel_write_safe": True}