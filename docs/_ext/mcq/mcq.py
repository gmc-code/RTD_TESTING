from docutils import nodes
from docutils.parsers.rst import Directive, directives
from sphinx.util.docutils import SphinxDirective
import random

class mcq_node(nodes.General, nodes.Element):
    pass

def visit_mcq_html(self, node):
    self.body.append(self.starttag(node, 'div', CLASS='mcq'))

def depart_mcq_html(self, node):
    self.body.append('</div>')

class Choice:
    def __init__(self, text, correct=False, explain=None):
        self.text = text
        self.correct = correct
        self.explain = explain

class MCQDirective(SphinxDirective):
    has_content = True
    optional_arguments = 0
    final_argument_whitespace = False
    option_spec = {
        'question': directives.unchanged_required,
        'shuffle': directives.flag,
    }

    def run(self):
        env = self.env
        question = self.options.get('question', '').strip()
        if not question:
            raise self.error('The :question: option is required.')

        # Parse nested choices
        # Syntax:
        # .. choice:: Text of choice
        #    :correct:
        #    :explain: Reason...
        choices = []
        state_machine = self.state_machine
        content = '\n'.join(self.content)

        # Simple parser: scan for '.. choice::' blocks.
        # Keeps this extension dependency-free; robust enough for typical docs.
        lines = content.splitlines()
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if line.startswith('.. choice::'):
                text = line[len('.. choice::'):].strip()
                correct = False
                explain = None
                i += 1
                # Read options indented under the choice
                while i < len(lines) and (lines[i].startswith('   ') or lines[i].strip() == ''):
                    opt = lines[i].strip()
                    if opt.startswith(':correct:'):
                        correct = True
                    elif opt.startswith(':explain:'):
                        explain = opt[len(':explain:'):].strip()
                    i += 1
                choices.append(Choice(text=text, correct=correct, explain=explain))
            else:
                i += 1

        if not choices:
            raise self.error('At least one .. choice:: is required.')
        if not any(c.correct for c in choices):
            self.logger.warning('MCQ without a correct answer at %s', self.get_source_info())

        if 'shuffle' in self.options:
            random.shuffle(choices)

        # Build HTML structure via nodes
        container = mcq_node()
        container['question'] = question

        # Question header
        header = nodes.container(classes=['mcq-header'])
        header += nodes.paragraph(text=question)
        container += header

        # Choices list
        list_node = nodes.container(classes=['mcq-choices'])
        for idx, c in enumerate(choices):
            choice_id = f"c{idx}"
            item = nodes.container(classes=['mcq-choice'])
            # Radio input
            input_html = f'<input type="radio" name="mcq-{container.asdom().getAttribute("ids")}" data-correct="{str(c.correct).lower()}" id="{choice_id}">'
            label_html = f'<label for="{choice_id}">{nodes.escape(c.text)}</label>'
            # Inline raw HTML for simplicity
            item += nodes.raw('', input_html, format='html')
            item += nodes.raw('', label_html, format='html')
            if c.explain:
                # Hidden explanation block
                exp = nodes.container(classes=['mcq-explain'])
                exp += nodes.paragraph(text=c.explain)
                item += exp
            list_node += item
        container += list_node

        # Action buttons & feedback
        btn_html = '<button class="mcq-check">Check</button><div class="mcq-feedback" aria-live="polite"></div>'
        container += nodes.raw('', btn_html, format='html')

        # Ensure assets
        if not hasattr(env, 'mcq_assets_added'):
            env.mcq_assets_added = True
            self.app.add_js_file('mcq.js')
            self.app.add_css_file('mcq.css')

        return [container]

def setup(app):
    app.add_node(mcq_node, html=(visit_mcq_html, depart_mcq_html))
    app.add_directive('mcq', MCQDirective)
    # Static assets served from _static
    app.connect('builder-inited', lambda app: app.config.html_static_path.append('_ext/mcq/_static'))
    return {
        'version': '0.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
