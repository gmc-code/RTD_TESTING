import html
import random
from pathlib import Path

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.directives.code import CodeBlock
from sphinx.util.docutils import SphinxDirective


class ordering_node(nodes.General, nodes.Element):
    pass


def visit_ordering_html(self, node):
    pass


def depart_ordering_html(self, node):
    pass


class OrderingDirective(SphinxDirective):
    has_content = True
    optional_arguments = 1  # Optional language parameter, e.g., .. ordering:: python

    option_spec = {
        'theme': directives.unchanged,
        'no-solution': directives.flag,
        'no-padding': directives.flag,
        'no-reorder': directives.flag,
        'show-code': directives.flag,
    }

    def run(self):
        raw_lines = list(self.content)

        if not raw_lines:
            return []

        language = self.arguments[0] if self.arguments else "python"
        chosen_theme = self.options.get('theme', 'light').strip().lower()
        if chosen_theme not in ['light', 'dark']:
            chosen_theme = 'light'

        hide_solution = 'no-solution' in self.options
        use_no_padding = 'no-padding' in self.options
        no_reorder = 'no-reorder' in self.options
        show_code = 'show-code' in self.options

        solution_btn_style = 'style="display: none !important;"' if hide_solution else ''
        padding_class = ' ordering-no-padding' if use_no_padding else ''

        line_items = []
        for index, line in enumerate(raw_lines):
            is_blank = not line.strip()
            leading_spaces = len(line) - len(line.lstrip())
            indent_level = 0 if is_blank else (leading_spaces // 4)

            line_items.append({
                'correct_idx': index,
                'text': line.strip() if not is_blank else "",
                'indent': indent_level,
                'is_blank': is_blank
            })

        processed_items = line_items.copy()
        if not no_reorder:
            random.shuffle(processed_items)

        # Container wrapper holding everything for this directive instance
        main_block_node = nodes.container(
            classes=[f'ordering-block{padding_class}'.strip()])

        if no_reorder:
            base_instruction = 'Click to adjust indentation:'
        else:
            base_instruction = 'Drag and drop lines into the correct order and click to adjust indentation:'

        if show_code:
            instructions = f'{base_instruction} Get 100% to reveal the code for copying.'
        else:
            instructions = base_instruction

        html_output = f'<div class="ordering-instructions">{instructions}</div>'

        no_reorder_attr = ' data-no-reorder="true"' if no_reorder else ''
        html_output += f'<div class="ordering-container theme-{chosen_theme}"{no_reorder_attr}>'

        for item in processed_items:
            if item['is_blank']:
                display_text = " "
                extra_class = " blank-line-placeholder"
            else:
                display_text = html.escape(item['text'])
                extra_class = ""

            is_draggable = "false" if no_reorder else "true"

            html_output += f'''
            <div class="ordering-line{extra_class}"
                 draggable="{is_draggable}"
                 data-correct-idx="{item['correct_idx']}"
                 data-correct-indent="{item['indent']}"
                 data-current-indent="0"
                 style="--indent-level: 0;">
                <span class="ordering-handle">☰</span>
                <code class="ordering-code">{display_text}</code>
                <div class="ordering-indent-controls">
                    <button type="button" class="indent-btn decrease" title="Decrease Indent">«</button>
                    <button type="button" class="indent-btn increase" title="Increase Indent">»</button>
                </div>
            </div>
            '''
        html_output += '</div>'

        html_output += f'''
        <div class="ordering-controls">
            <button type="button" class="ordering-btn-score">Check Order</button>
            <button type="button" class="ordering-btn-continue" style="display: none;">Continue</button>
            <button type="button" class="ordering-btn-solution" {solution_btn_style}>Show Solution</button>
            <button type="button" class="ordering-btn-reset">Reset</button>
            <span class="ordering-feedback-badge"></span>
        </div>
        '''

        raw_interactive_node = nodes.raw("", html_output, format="html")
        main_block_node += raw_interactive_node

        # Generate hidden native Sphinx CodeBlock node if :show-code: flag is set
        if show_code:
            code_block_dir = CodeBlock(name='code-block',
                                       arguments=[language],
                                       options={},
                                       content=raw_lines,
                                       lineno=self.lineno,
                                       content_offset=self.content_offset,
                                       block_text=self.block_text,
                                       state=self.state,
                                       state_machine=self.state_machine)

            code_nodes = code_block_dir.run()

            completed_container = nodes.container(
                classes=['ordering-completed-code'])
            completed_container['style'] = 'display: none;'

            heading = nodes.rubric(text="Complete code for copying",
                                   classes=['ordering-code-heading'])
            completed_container += heading
            completed_container.extend(code_nodes)

            # Add directly inside main_block_node
            main_block_node += completed_container

        return [main_block_node]



def setup(app):
    app.add_node(ordering_node,
                 html=(visit_ordering_html, depart_ordering_html))
    app.add_directive("ordering", OrderingDirective)

    static_path = Path(__file__).parent / "_static"
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file("ordering.js")
    app.add_css_file("ordering.css")
    return {
        "version": "2.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True
    }
