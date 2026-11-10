import html
import random
import re
from pathlib import Path

from docutils import nodes
from docutils.core import publish_parts
from docutils.parsers.rst import directives
from sphinx.directives.code import CodeBlock
from sphinx.util import logging
from sphinx.util.docutils import SphinxDirective

logger = logging.getLogger(__name__)


def fixed_lines_option(argument):
    """Parse ':fixed: 1, 4-6' into a sorted list of 1-based item numbers."""
    if argument is None or not argument.strip():
        raise ValueError('expected line numbers, e.g. "1, 4-6"')

    numbers = set()
    cleaned = re.sub(r'\s*-\s*', '-', argument.strip())
    for part in re.split(r'[,\s]+', cleaned):
        if not part:
            continue
        match = re.fullmatch(r'(\d+)(?:-(\d+))?', part)
        if not match:
            raise ValueError(
                f'"{part}" is not a line number or range (use e.g. "1, 4-6")')
        start = int(match.group(1))
        end = int(match.group(2)) if match.group(2) else start
        if start < 1 or end < start:
            raise ValueError(f'"{part}" is not a valid line number or range')
        numbers.update(range(start, end + 1))
    return sorted(numbers)


class ordering_node(nodes.General, nodes.Element):
    pass


def visit_ordering_html(self, node):
    pass


def depart_ordering_html(self, node):
    pass


class OrderingDirective(SphinxDirective):
    has_content = True
    optional_arguments = 1  # Optional language/type parameter

    option_spec = {
        'theme': directives.unchanged,
        'no-solution': directives.flag,
        'no-padding': directives.flag,
        'no-reorder': directives.flag,
        'no-indent': directives.flag,
        'paragraph': directives.flag,          # Reorders sentences inside paragraphs
        'paragraphblocks': directives.flag,    # Reorders whole paragraph blocks
        'show-code': directives.flag,
        'keeprst': directives.flag,            # Enable inline RST formatting render
        'fixed': fixed_lines_option,           # Lines locked in place, e.g. 1, 4-6
    }

    def render_rst_to_html(self, text_block):
        """Helper to parse RST inline formatting into rendered HTML."""
        if not text_block.strip():
            return "&nbsp;"

        parts = publish_parts(
            source=text_block,
            writer_name='html5',
            settings_spec=None,
            settings_overrides=self.state.document.settings.__dict__
        )

        rendered_html = parts['fragment'].strip()

        if rendered_html.startswith("<p>") and rendered_html.endswith("</p>"):
            rendered_html = rendered_html[3:-4]

        return rendered_html

    def _shuffle_guaranteed(self, items):
        """Ensures items are shuffled into an order that differs from the correct order."""
        if len(items) <= 1:
            return items

        original_indices = [item['correct_idx'] for item in items]
        shuffled = items.copy()

        # Maximum 50 attempts to find a non-identical permutation
        for _ in range(50):
            random.shuffle(shuffled)
            current_indices = [item['correct_idx'] for item in shuffled]
            if current_indices != original_indices:
                break

        return shuffled

    def _arrange(self, items, shuffle):
        """Keeps fixed items in their correct slots; fills the other slots
        with the movable items (shuffled if requested)."""
        movable = [item for item in items if not item['is_fixed']]
        if shuffle:
            movable = self._shuffle_guaranteed(movable)

        arranged = [None] * len(items)
        for item in items:
            if item['is_fixed']:
                arranged[item['correct_idx']] = item

        remaining = iter(movable)
        return [slot if slot is not None else next(remaining)
                for slot in arranged]

    def run(self):
        raw_lines = list(self.content)

        if not raw_lines:
            return []

        language = self.arguments[0] if self.arguments else "python"
        chosen_theme = self.options.get('theme', 'white').strip().lower()
        if chosen_theme not in ['white', 'light']:
            chosen_theme = 'white'

        hide_solution = 'no-solution' in self.options
        use_no_padding = 'no-padding' in self.options
        no_reorder = 'no-reorder' in self.options
        parse_rst = 'keeprst' in self.options
        show_code = 'show-code' in self.options

        # Check options for paragraph/sentence handling
        is_paragraph_blocks = 'paragraphblocks' in self.options
        is_sentence_mode = 'paragraph' in self.options
        is_paragraph_mode = is_paragraph_blocks or is_sentence_mode or ('no-indent' in self.options)

        padding_class = ' ordering-no-padding' if use_no_padding else ''
        line_items = []

        # --- 1. PARAGRAPH BLOCKS MODE (:paragraphblocks:) ---
        if is_paragraph_blocks:
            paragraphs = []
            current_paragraph = []

            for line in raw_lines:
                if not line.strip():
                    if current_paragraph:
                        paragraphs.append("\n".join(current_paragraph))
                        current_paragraph = []
                else:
                    current_paragraph.append(line)

            if current_paragraph:
                paragraphs.append("\n".join(current_paragraph))

            for index, block_text in enumerate(paragraphs):
                line_items.append({
                    'correct_idx': index,
                    'text': block_text.strip(),
                    'indent': 0,
                    'is_blank': False,
                    'is_paragraph': True
                })

        # --- 2. SENTENCE MODE (:paragraph:) ---
        elif is_sentence_mode:
            paragraphs = []
            current_paragraph = []

            for line in raw_lines:
                if not line.strip():
                    if current_paragraph:
                        paragraphs.append(" ".join([l.strip() for l in current_paragraph]))
                        current_paragraph = []
                else:
                    current_paragraph.append(line)

            if current_paragraph:
                paragraphs.append(" ".join([l.strip() for l in current_paragraph]))

            item_counter = 0
            for paragraph in paragraphs:
                sentences = re.split(r'(?<=[.!?])\s+', paragraph.strip())
                for sentence in sentences:
                    sentence_text = sentence.strip()
                    if sentence_text:
                        line_items.append({
                            'correct_idx': item_counter,
                            'text': sentence_text,
                            'indent': 0,
                            'is_blank': False,
                            'is_paragraph': True
                        })
                        item_counter += 1

        # --- 3. STANDARD LINE-BY-LINE MODE (FALLBACK) ---
        else:
            for index, line in enumerate(raw_lines):
                is_blank = not line.strip()
                leading_spaces = len(line) - len(line.lstrip())
                indent_level = 0 if is_blank else (leading_spaces // 4)

                line_items.append({
                    'correct_idx': index,
                    'text': line.strip() if not is_blank else "",
                    'indent': indent_level,
                    'is_blank': is_blank,
                    'is_paragraph': False
                })

        # Mark the lines locked in place by :fixed: (1-based numbers)
        fixed_indices = set()
        for number in self.options.get('fixed', []):
            if number > len(line_items):
                logger.warning(
                    'ordering: ":fixed:" number %d ignored - there are only '
                    '%d items to order.', number, len(line_items),
                    location=self.get_location())
            else:
                fixed_indices.add(number - 1)

        for item in line_items:
            item['is_fixed'] = item['correct_idx'] in fixed_indices

        has_fixed = bool(fixed_indices)

        # Apply non-matching shuffle guarantee (fixed lines keep their place)
        processed_items = self._arrange(line_items, shuffle=not no_reorder)

        # Container wrapper
        main_block_node = nodes.container(
            classes=[f'ordering-block{padding_class}'.strip()])

        if no_reorder:
            base_instruction = 'Review ordering:' if is_paragraph_mode else 'Click to adjust indentation:'
        elif is_paragraph_mode:
            base_instruction = 'Drag and drop the text elements into the correct logical order:'
        else:
            base_instruction = 'Drag and drop lines into the correct order and click to adjust indentation:'

        if has_fixed:
            base_instruction += ' Shaded lines marked \U0001F512 are fixed in place.'

        if show_code:
            instructions = f'{base_instruction} Get 100% to reveal the code for copying.'
        else:
            instructions = base_instruction

        html_output = f'<div class="ordering-instructions">{instructions}</div>'

        no_reorder_attr = ' data-no-reorder="true"' if no_reorder else ''
        html_output += f'<div class="ordering-container theme-{chosen_theme}"{no_reorder_attr}>'

        for item in processed_items:
            if item['is_blank']:
                display_html = "&nbsp;"
                extra_class = " blank-line-placeholder"
            else:
                if parse_rst:
                    display_html = self.render_rst_to_html(item['text'])
                else:
                    display_html = html.escape(item['text'])

                extra_class = " ordering-paragraph" if item['is_paragraph'] else ""

            is_fixed = item['is_fixed']
            is_draggable = "false" if (no_reorder or is_fixed) else "true"

            # Fixed lines are shown already at their correct indentation
            start_indent = item['indent'] if is_fixed else 0
            fixed_attr = ' data-fixed="true"' if is_fixed else ''
            handle_html = (
                '<span class="ordering-handle ordering-lock" '
                'title="Fixed line - cannot be moved">\U0001F512</span>'
                if is_fixed else '<span class="ordering-handle">\u2630</span>')
            if is_fixed:
                extra_class += " ordering-fixed"

            indent_controls_html = "" if (is_paragraph_mode or is_fixed) else '''
                <div class="ordering-indent-controls">
                    <button type="button" class="indent-btn decrease" title="Decrease Indent">«</button>
                    <button type="button" class="indent-btn increase" title="Increase Indent">»</button>
                </div>
            '''

            html_output += f'''
            <div class="ordering-line{extra_class}"
                 draggable="{is_draggable}"{fixed_attr}
                 data-correct-idx="{item['correct_idx']}"
                 data-correct-indent="{item['indent']}"
                 data-current-indent="{start_indent}"
                 style="--indent-level: {start_indent};">
                {handle_html}
                <div class="ordering-code">{display_html}</div>
                {indent_controls_html}
            </div>
            '''
        html_output += '</div>'

        solution_btn_style = 'style="display: none !important;"' if hide_solution else ''
        html_output += f'''
        <div class="ordering-controls">
            <button type="button" class="ordering-btn-score">Check</button>
            <button type="button" class="ordering-btn-continue" style="display: none;">Continue</button>
            <button type="button" class="ordering-btn-solution" {solution_btn_style}>Show Solution</button>
            <button type="button" class="ordering-btn-reset">Reset</button>
            <span class="ordering-feedback-badge"></span>
        </div>
        '''

        raw_interactive_node = nodes.raw("", html_output, format="html")
        main_block_node += raw_interactive_node

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

            heading = nodes.rubric(text="Complete text for copying",
                                   classes=['ordering-code-heading'])
            completed_container += heading
            completed_container.extend(code_nodes)

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
        "version": "2.8",
        "parallel_read_safe": True,
        "parallel_write_safe": True
    }