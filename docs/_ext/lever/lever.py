"""lever - a Sphinx directive for balancing class 1, 2 and 3 levers.

A beam is drawn on a fulcrum with numbered marks.  Weights hang from the beam
(downward forces) and upward forces pull it up.  The teacher sets some of the
forces and marks the size and/or position of others with "?" for the student
to work out.  The lever tips or balances according to the turning effects
(force x distance from the fulcrum).

    .. lever:: 2
        :distance-unit: cm
        :spacing: 10

        load 60 at 20 "Soil"
        effort ? at 80

With no content the lever is a sandbox; with no class as well, the student can
swap between the three classes.

All of the interactive work is done by _static/lever.js; this module only
validates the options / forces and passes them to the page as JSON.
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

MAX_FORCES = 8
KINDS = ('load', 'effort', 'weight', 'up')
# "6" = fixed, "?" = student sets it, "6?" = student can change it from 6
VALUE_RE = re.compile(r'^(\d+\.?\d*|\.\d+)?(\?)?$')
LABEL_RE = re.compile(r'"([^"]*)"\s*$')


def divisions_option(argument):
    value = directives.positive_int(argument)
    if not 4 <= value <= 16:
        raise ValueError('expected 4 to 16 divisions along the beam')
    return value


def fulcrum_option(argument):
    """centre / left / right, or the mark number counted from the left end."""
    text = (argument or '').strip().lower()
    if text in ('centre', 'center', 'middle'):
        return 'centre'
    if text in ('left', 'right'):
        return text
    try:
        value = int(text)
    except ValueError:
        raise ValueError('expected centre, left, right or a whole number of '
                         'divisions from the left end')
    if value < 0:
        raise ValueError('expected 0 or more divisions from the left end')
    return value


def positive_number(argument):
    try:
        value = float(argument)
    except (TypeError, ValueError):
        raise ValueError('expected a number')
    if value <= 0:
        raise ValueError('expected a number greater than 0')
    return int(value) if value == int(value) else value


def _number(text):
    value = float(text)
    return int(value) if value == int(value) else value


class LeverDirective(SphinxDirective):
    has_content = True
    optional_arguments = 1
    final_argument_whitespace = False

    option_spec = {
        'title': directives.unchanged,
        'divisions': divisions_option,
        'fulcrum': fulcrum_option,
        'spacing': positive_number,
        'distance-unit': directives.unchanged,
        'force-unit': directives.unchanged,
        'max-force': positive_number,
        'step': positive_number,
        'hold': directives.flag,
        'show-moments': directives.flag,
        'no-class-label': directives.flag,
        'allow-add': directives.flag,
        'no-solution': directives.flag,
    }

    def _warn(self, message, *args):
        logger.warning('lever: ' + message, *args, location=self.get_location())

    def _parse_value(self, token, what, line):
        """-> (number or None, adjustable) or None if the token is not valid."""
        match = VALUE_RE.match(token)
        if not match or (match.group(1) is None and match.group(2) is None):
            self._warn('"%s" is not a %s (use a number, ? or a number followed '
                       'by ?) - line ignored: %s', token, what, line)
            return None
        value = _number(match.group(1)) if match.group(1) is not None else None
        if value is not None and value <= 0:
            self._warn('the %s must be greater than 0 - line ignored: %s',
                       what, line)
            return None
        return value, match.group(2) is not None

    def _parse_forces(self, lever_class, left_arm, right_arm, spacing):
        """Content lines -> list of force dictionaries.

        Each line is ``kind size [up|down] at distance [left|right] ["label"]``
        where kind is load, effort, weight or up.  Unit words such as N or cm
        may follow the numbers and are ignored.
        """
        forces = []
        for raw in self.content:
            line = raw.strip()
            if not line or line.startswith('#'):
                continue

            label = ''
            label_match = LABEL_RE.search(line)
            text = line
            if label_match:
                label = label_match.group(1).strip()
                text = line[:label_match.start()]
            tokens = text.split()
            lowered = [t.lower() for t in tokens]

            if not tokens or lowered[0] not in KINDS:
                self._warn('a line must start with load, effort, weight or up '
                           '- line ignored: %s', line)
                continue
            if 'at' not in lowered or lowered.index('at') < 2 \
                    or lowered.index('at') == len(tokens) - 1:
                self._warn('expected "<kind> <size> at <distance>" - line '
                           'ignored: %s', line)
                continue

            kind = lowered[0]
            at = lowered.index('at')
            size = self._parse_value(tokens[1], 'force size', line)
            place = self._parse_value(tokens[at + 1], 'distance', line)
            if size is None or place is None:
                continue

            # direction: weights hang down, "up" pulls up, an effort pushes
            # down on a class 1 lever and pulls up on class 2 and 3 levers
            if kind == 'up':
                direction = 'up'
            elif kind == 'effort' and lever_class in (2, 3):
                direction = 'up'
            else:
                direction = 'down'
            for word in lowered[2:at]:
                if word in ('up', 'down'):
                    if kind in ('load', 'weight') and word == 'up':
                        self._warn('a %s always acts downwards; use "up" or '
                                   '"effort ... up" for an upward force: %s',
                                   kind, line)
                    else:
                        direction = word

            side = 'any'
            for word in lowered[at + 2:]:
                if word in ('left', 'right'):
                    side = word

            distance, distance_adjustable = place
            if side == 'left' and left_arm == 0 or side == 'right' and right_arm == 0:
                self._warn('there is no beam on the %s of the fulcrum - line '
                           'ignored: %s', side, line)
                continue
            if distance is not None:
                if side == 'any':
                    fits_right = distance <= right_arm * spacing + 1e-9
                    side = 'right' if (fits_right and right_arm) or not left_arm else 'left'
                    fixed_side = False
                else:
                    fixed_side = True
                arm = (right_arm if side == 'right' else left_arm) * spacing
                if distance > arm + 1e-9:
                    self._warn('%s is past the end of the beam (%s on the %s) '
                               '- line ignored: %s', distance, arm, side, line)
                    continue
            else:
                fixed_side = side != 'any'

            forces.append({
                'role': kind,
                'dir': direction,
                'mag': size[0],
                'magAdj': size[1],
                'dist': distance,
                'posAdj': distance_adjustable,
                'side': side,
                # may the student drag it to the other side of the fulcrum?
                'sideFixed': fixed_side,
                'label': label,
            })

        if len(forces) > MAX_FORCES:
            self._warn('only the first %d forces are used.', MAX_FORCES)
            forces = forces[:MAX_FORCES]
        return forces

    def run(self):
        lever_class = None
        if self.arguments:
            text = self.arguments[0].strip().lower().replace('class', '')
            if text in ('1', '2', '3'):
                lever_class = int(text)
            else:
                self._warn('the lever class must be 1, 2 or 3, not "%s".',
                           self.arguments[0])

        divisions = self.options.get('divisions', 10)
        spacing = self.options.get('spacing', 1)

        fulcrum = self.options.get('fulcrum')
        explicit_fulcrum = fulcrum is not None
        if fulcrum is None:
            fulcrum = 'centre' if lever_class in (None, 1) else 'left'
        if fulcrum == 'centre':
            fulcrum = divisions // 2
        elif fulcrum == 'left':
            fulcrum = 0
        elif fulcrum == 'right':
            fulcrum = divisions
        if fulcrum > divisions:
            self._warn('":fulcrum: %d" is past the end of a beam with %d '
                       'divisions; the right-hand end is used.', fulcrum, divisions)
            fulcrum = divisions

        forces = self._parse_forces(lever_class, fulcrum, divisions - fulcrum, spacing)
        has_content = any(line.strip() for line in self.content)

        step = self.options.get('step', 1)
        max_force = self.options.get('max-force', 20)
        biggest = max((f['mag'] for f in forces if f['mag'] is not None), default=0)
        if biggest > max_force:
            max_force = biggest
        if step > max_force:
            self._warn('":step:" is bigger than ":max-force:"; a step of 1 is used.')
            step = 1

        config = {
            'cls': lever_class,
            'title': self.options.get('title', '').strip(),
            'divisions': divisions,
            # None lets the page choose (centre for class 1, left end for 2, 3)
            'fulcrum': fulcrum if (explicit_fulcrum or has_content or lever_class) else None,
            'spacing': spacing,
            'distanceUnit': self.options.get('distance-unit', '').strip(),
            'forceUnit': self.options.get('force-unit', 'N').strip() or 'N',
            'maxForce': max_force,
            'step': step,
            'hold': 'hold' in self.options,
            'showMoments': 'show-moments' in self.options,
            'noClassLabel': 'no-class-label' in self.options,
            'allowAdd': 'allow-add' in self.options,
            'noSolution': 'no-solution' in self.options,
            'sandbox': not forces,
            'forces': forces,
        }

        config_attr = html.escape(json.dumps(config), quote=True)
        html_output = (
            # data-activitygroup-events: this block tells an enclosing
            # activitygroup when the lever is balanced (see lever.js)
            f'<div class="lever-block" data-activitygroup-events="check answer" '
            f'data-config="{config_attr}">'
            '<noscript>The lever activity needs JavaScript.</noscript>'
            '</div>'
        )
        return [nodes.raw('', html_output, format='html')]


def setup(app):
    app.add_directive('lever', LeverDirective)

    static_path = Path(__file__).parent / '_static'
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file('lever.js')
    app.add_css_file('lever.css')
    return {
        'version': '1.0',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
