"""graphing - a Sphinx directive for plotting a line graph from a results table.

The student (or the teacher, in the directive) supplies the independent and
dependent variables, their units and the rows of results.  Graph paper is
drawn at true size (default 12 cm x 12 cm, 5 divisions per cm) with the axis
scales chosen automatically.  The student plots the points by clicking, can
check them, and a button draws the correct points and line.

All of the interactive work is done by _static/graphing.js; this module only
validates the options / data and passes them to the page as JSON.
"""

import html
import json
import re
from pathlib import Path

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util import logging
from sphinx.util.docutils import SphinxDirective

logger = logging.getLogger(__name__)

MAX_ROWS = 12
MAX_TRIALS = 3
NUMBER_RE = re.compile(r'^[-+]?(\d+\.?\d*|\.\d+)$')


def size_cm_option(argument):
    """Width / height of the grid in whole centimetres (4 to 25)."""
    value = directives.positive_int(argument)
    if not 4 <= value <= 25:
        raise ValueError('expected a whole number of cm from 4 to 25')
    return value


def divisions_option(argument):
    """Small divisions per centimetre."""
    value = directives.positive_int(argument)
    if value not in (1, 2, 4, 5, 10):
        raise ValueError('expected 1, 2, 4, 5 or 10 divisions per cm')
    return value


def rows_option(argument):
    value = directives.positive_int(argument)
    if not 2 <= value <= MAX_ROWS:
        raise ValueError(f'expected 2 to {MAX_ROWS} rows')
    return value


def trials_option(argument):
    """0 (or 'averages') = one column of averages; 1-3 = trial columns."""
    text = (argument or '').strip().lower()
    if text in ('averages', 'average', 'none'):
        return 0
    try:
        value = int(text)
    except ValueError:
        raise ValueError('expected 0, 1, 2, 3 or "averages"')
    if not 0 <= value <= MAX_TRIALS:
        raise ValueError('expected 0, 1, 2, 3 or "averages"')
    return value


def line_option(argument):
    return directives.choice(argument, ('points', 'bestfit', 'none'))


def title_form_option(argument):
    return directives.choice(argument, ('effect', 'vs', 'none'))


def zero_option(argument):
    return directives.choice(argument, ('both', 'x', 'y', 'none'))


def tolerance_option(argument):
    try:
        value = float(argument)
    except (TypeError, ValueError):
        raise ValueError('expected a number of small divisions, e.g. 0.5')
    if not 0 < value <= 5:
        raise ValueError('expected a tolerance between 0 and 5 divisions')
    return value


def dp_option(argument):
    value = directives.nonnegative_int(argument)
    if value > 6:
        raise ValueError('expected 0 to 6 decimal places')
    return value


class GraphingDirective(SphinxDirective):
    has_content = True
    optional_arguments = 0

    option_spec = {
        'title': directives.unchanged,
        'title-form': title_form_option,
        'iv': directives.unchanged,
        'iv-unit': directives.unchanged,
        'dv': directives.unchanged,
        'dv-unit': directives.unchanged,
        'rows': rows_option,
        'trials': trials_option,
        'width': size_cm_option,
        'height': size_cm_option,
        'divisions': divisions_option,
        'line': line_option,
        'zero': zero_option,
        'tolerance': tolerance_option,
        'average-dp': dp_option,
        'editable': directives.flag,
        'show-coordinates': directives.flag,
        'no-solution': directives.flag,
        'no-settings': directives.flag,
    }

    def _parse_data(self):
        """Content lines -> list of rows of number strings.

        Each line is ``IV, value`` (averages only) or ``IV, trial 1, trial 2,
        trial 3``.  Values are kept as the strings the teacher typed so that
        the table shows them with the same number of decimal places.
        """
        rows = []
        for offset, line in enumerate(self.content):
            text = line.strip()
            if not text:
                continue
            cells = [c for c in re.split(r'[,;\t]+|\s{1,}', text) if c != '']
            bad = [c for c in cells if not NUMBER_RE.match(c)]
            if bad:
                logger.warning(
                    'graphing: "%s" is not a number - data line ignored: %s',
                    bad[0], text, location=self.get_location())
                continue
            if len(cells) < 2:
                logger.warning(
                    'graphing: data line needs an IV value and at least one '
                    'DV value - ignored: %s', text,
                    location=self.get_location())
                continue
            if len(cells) > MAX_TRIALS + 1:
                logger.warning(
                    'graphing: only %d trials are supported - extra values '
                    'ignored: %s', MAX_TRIALS, text,
                    location=self.get_location())
                cells = cells[:MAX_TRIALS + 1]
            rows.append(cells)

        if len(rows) > MAX_ROWS:
            logger.warning('graphing: only the first %d data rows are used.',
                           MAX_ROWS, location=self.get_location())
            rows = rows[:MAX_ROWS]
        return rows

    def run(self):
        data = self._parse_data()
        value_columns = max((len(r) - 1 for r in data), default=0)

        if 'trials' in self.options:
            trials = self.options['trials']
            needed = max(trials, 1)
            if data and value_columns > needed:
                logger.warning(
                    'graphing: the data has %d value columns but ":trials:" '
                    'allows %d - extra values ignored.', value_columns, needed,
                    location=self.get_location())
                data = [r[:needed + 1] for r in data]
        else:
            # one value column = averages only; more = that many trials
            trials = 0 if value_columns <= 1 else value_columns

        if data and len(data) < 2:
            logger.warning('graphing: at least 2 data rows are needed to draw '
                           'a graph.', location=self.get_location())

        zero = self.options.get('zero', 'both')
        config = {
            'title': self.options.get('title', '').strip(),
            'titleForm': self.options.get('title-form', 'effect'),
            'iv': self.options.get('iv', '').strip(),
            'ivUnit': self.options.get('iv-unit', '').strip(),
            'dv': self.options.get('dv', '').strip(),
            'dvUnit': self.options.get('dv-unit', '').strip(),
            'rows': max(self.options.get('rows', 3), len(data)) if data
                    else self.options.get('rows', 3),
            'trials': trials,
            'data': data,
            'width': self.options.get('width', 12),
            'height': self.options.get('height', 12),
            'divisions': self.options.get('divisions', 5),
            'line': self.options.get('line', 'points'),
            'zeroX': zero in ('both', 'x'),
            'zeroY': zero in ('both', 'y'),
            'tolerance': self.options.get('tolerance', 0.5),
            'averageDp': self.options.get('average-dp'),
            'editable': 'editable' in self.options,
            'showCoordinates': 'show-coordinates' in self.options,
            'noSolution': 'no-solution' in self.options,
            'noSettings': 'no-settings' in self.options,
        }

        config_attr = html.escape(json.dumps(config), quote=True)
        html_output = (
            f'<div class="graphing-block" data-config="{config_attr}">'
            '<noscript>The graphing activity needs JavaScript.</noscript>'
            '</div>'
        )
        return [nodes.raw('', html_output, format='html')]


def setup(app):
    app.add_directive('graphing', GraphingDirective)

    static_path = Path(__file__).parent / '_static'
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file('graphing.js')
    app.add_css_file('graphing.css')
    return {
        'version': '1.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
