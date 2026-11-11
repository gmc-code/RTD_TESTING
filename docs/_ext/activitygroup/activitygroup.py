"""activitygroup - groups one activity directive with questions about it.

The first directive in the content is the activity (for example ``graphing``);
every directive after it is a question about the activity (``gapfill``,
``multichoice``, ``structuredquestion`` ...).  The group shows them in one
block, prints them together, and can keep the questions locked until the
activity is finished.

Unlocking protocol (so any activity directive can take part): the activity's
root element carries the attribute ``data-activitygroup-events`` and
dispatches a bubbling ``activitygroup:complete`` CustomEvent with
``detail.how`` set to ``"check"`` (completed correctly) or ``"answer"``
(the answer was shown).
"""

import html
import re
from pathlib import Path

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util import logging
from sphinx.util.docutils import SphinxDirective

logger = logging.getLogger(__name__)

DIRECTIVE_START_RE = re.compile(r'^\.\. [A-Za-z][\w:+-]*::')

DEFAULT_LOCKED_MESSAGES = {
    'check': 'Complete the activity above and check that it is correct to unlock the questions.',
    'answer': 'Complete the activity above (or show its answer) to unlock the questions.',
}


class activitygroup_node(nodes.General, nodes.Element):
    pass


class activitygroup_part(nodes.General, nodes.Element):
    pass


def visit_activitygroup_html(self, node):
    self.body.append(
        f'<div class="activitygroup-block" data-reveal="{node["reveal"]}">')
    if node['title']:
        self.body.append(
            f'<div class="activitygroup-title">{html.escape(node["title"])}</div>')


def depart_activitygroup_html(self, node):
    if not node['no_print']:
        self.body.append(
            '<div class="activitygroup-controls">'
            '<button type="button" class="activitygroup-btn-print">'
            'Print activity and questions</button></div>')
    self.body.append('</div>')


def visit_activitygroup_part_html(self, node):
    if node['part'] == 'activity':
        self.body.append('<div class="activitygroup-activity">')
        return

    if node['locked_message']:
        self.body.append(
            '<div class="activitygroup-lock-notice" aria-live="polite">'
            '<span class="activitygroup-lock-icon">\U0001F512</span> '
            f'{html.escape(node["locked_message"])}</div>')
    self.body.append('<div class="activitygroup-questions">')
    if node['heading']:
        self.body.append(
            f'<div class="activitygroup-questions-title">{html.escape(node["heading"])}</div>')


def depart_activitygroup_part_html(self, node):
    self.body.append('</div>')


def reveal_option(argument):
    return directives.choice(argument, ('always', 'check', 'answer'))


class ActivityGroupDirective(SphinxDirective):
    has_content = True

    option_spec = {
        'title': directives.unchanged,
        'reveal': reveal_option,
        'questions-title': directives.unchanged,
        'locked-message': directives.unchanged,
        'no-print': directives.flag,
    }

    def _split_index(self):
        """Index of the first line after the first top-level directive, i.e.
        where the questions start.  None if there is no directive at all."""
        lines = list(self.content)
        start = next((i for i, line in enumerate(lines)
                      if DIRECTIVE_START_RE.match(line)), None)
        if start is None:
            return None
        for i in range(start + 1, len(lines)):
            if lines[i].strip() and not lines[i][0].isspace():
                return i
        return len(lines)

    def run(self):
        self.assert_has_content()
        reveal = self.options.get('reveal', 'always')

        split = self._split_index()
        if split is None:
            logger.warning(
                'activitygroup: no directive found in the content - expected '
                'an activity directive followed by question directives.',
                location=self.get_location())
            split = len(self.content)

        group = activitygroup_node()
        group['reveal'] = reveal
        group['title'] = self.options.get('title', '').strip()
        group['no_print'] = 'no-print' in self.options

        activity = activitygroup_part()
        activity['part'] = 'activity'
        self.state.nested_parse(self.content[:split], self.content_offset, activity)
        group += activity

        question_lines = self.content[split:]
        if any(line.strip() for line in question_lines):
            questions = activitygroup_part()
            questions['part'] = 'questions'
            questions['heading'] = self.options.get('questions-title', 'Questions').strip()
            questions['locked_message'] = '' if reveal == 'always' else (
                self.options.get('locked-message', '').strip()
                or DEFAULT_LOCKED_MESSAGES[reveal])
            self.state.nested_parse(question_lines, self.content_offset + split, questions)
            group += questions
        elif reveal != 'always':
            logger.warning(
                'activitygroup: ":reveal:" has no effect because there are no '
                'questions after the activity.', location=self.get_location())

        return [group]


def setup(app):
    app.add_node(activitygroup_node,
                 html=(visit_activitygroup_html, depart_activitygroup_html))
    app.add_node(activitygroup_part,
                 html=(visit_activitygroup_part_html, depart_activitygroup_part_html))
    app.add_directive('activitygroup', ActivityGroupDirective)

    static_path = Path(__file__).parent / '_static'
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file('activitygroup.js')
    app.add_css_file('activitygroup.css')
    return {
        'version': '1.0',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
