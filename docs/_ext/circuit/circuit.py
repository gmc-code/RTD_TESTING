"""circuit - a Sphinx directive for building and measuring electric circuits.

Students build series and parallel circuits on a grid using wires, ohmic
resistors, globes, switches, ammeters and voltmeters, powered by a 12 V
powerpack.  The meters show the current (I) and voltage (V) as the circuit is
built.

    .. circuit::

With no content the circuit is a blank board to build on.  With content, the
teacher sets the circuit and it is drawn automatically:

    .. circuit::

        ammeter, resistor 4 "R1"
        branch: globe
        branch: resistor 6
        voltmeter across R1

Each plain line is one or more components in series (separated by commas).
Consecutive ``branch:`` lines are the branches of a parallel section.
``voltmeter across <label>`` connects a voltmeter in parallel with a component
(or ``across supply`` for the powerpack).

``:build:`` sets a building task that the Check button marks, e.g.
``:build: series, 2 globes, 1 ammeter``.

All of the interactive work (layout, circuit solving, drawing) is done by
_static/circuit.js; this module only validates the options / components and
passes them to the page as JSON.
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

TOOLS = ('wire', 'resistor', 'globe', 'ammeter', 'voltmeter', 'switch')
KIND_WORDS = {
    'resistor': 'resistor', 'resistors': 'resistor',
    'globe': 'globe', 'globes': 'globe',
    'lamp': 'globe', 'lamps': 'globe', 'bulb': 'globe', 'bulbs': 'globe',
    'ammeter': 'ammeter', 'ammeters': 'ammeter',
    'voltmeter': 'voltmeter', 'voltmeters': 'voltmeter',
    'switch': 'switch', 'switches': 'switch',
    'wire': 'wire', 'wires': 'wire',
}
PREFIX = {'resistor': 'R', 'globe': 'L', 'ammeter': 'A', 'voltmeter': 'V', 'switch': 'S'}
SUPPLY_WORDS = ('supply', 'powerpack', 'power pack', 'pack', 'battery')
UNIT_WORDS = ('ohm', 'ohms', 'Ω', 'ω')
LABEL_RE = re.compile(r'"([^"]*)"')
MAX_SERIES = 8        # components along one line / branch
MAX_BRANCHES = 4
DEFAULT_RESISTORS = [2, 3, 4, 6, 12, 24]


def _number(text):
    value = float(text)
    return int(value) if value == int(value) else value


def positive_number(argument):
    try:
        value = float(argument)
    except (TypeError, ValueError):
        raise ValueError('expected a number')
    if value <= 0:
        raise ValueError('expected a number greater than 0')
    return int(value) if value == int(value) else value


def cols_option(argument):
    value = directives.positive_int(argument)
    if not 4 <= value <= 12:
        raise ValueError('expected 4 to 12 columns')
    return value


def rows_option(argument):
    value = directives.positive_int(argument)
    if not 3 <= value <= 10:
        raise ValueError('expected 3 to 10 rows')
    return value


def decimals_option(argument):
    value = directives.nonnegative_int(argument)
    if value > 3:
        raise ValueError('expected 0 to 3 decimal places')
    return value


def resistors_option(argument):
    """A list of resistor values for the student to choose from."""
    values = []
    for part in re.split(r'[,\s]+', (argument or '').strip()):
        if not part:
            continue
        value = positive_number(part)
        if value not in values:
            values.append(value)
    if not values:
        raise ValueError('expected one or more resistances, e.g. 2, 4, 6, 12')
    return values[:12]


def tools_option(argument):
    """all, none, or some of: wire resistor globe ammeter voltmeter switch."""
    words = [w for w in re.split(r'[,\s]+', (argument or '').strip().lower()) if w]
    if not words or words == ['none']:
        return []
    if words == ['all']:
        return list(TOOLS)
    tools = []
    for word in words:
        kind = KIND_WORDS.get(word)
        if kind is None:
            raise ValueError('"%s" is not a tool; use all, none or some of: %s'
                             % (word, ' '.join(TOOLS)))
        if kind not in tools:
            tools.append(kind)
    # the order of the palette is always the same
    return [tool for tool in TOOLS if tool in tools]


class CircuitDirective(SphinxDirective):
    has_content = True
    optional_arguments = 0

    option_spec = {
        'title': directives.unchanged,
        'voltage': positive_number,
        'cols': cols_option,
        'rows': rows_option,
        'globe-resistance': positive_number,
        'resistors': resistors_option,
        'tools': tools_option,
        'build': directives.unchanged,
        'show-current': directives.flag,
        'show-values': directives.flag,
        'decimals': decimals_option,
        'no-solution': directives.flag,
    }

    def _warn(self, message, *args):
        logger.warning('circuit: ' + message, *args, location=self.get_location())

    # ----- content -----

    def _parse_component(self, text, line):
        """'resistor 4 hidden "R1"' -> component dictionary, or None."""
        label = ''
        match = LABEL_RE.search(text)
        if match:
            label = match.group(1).strip()
            text = text[:match.start()] + ' ' + text[match.end():]
        tokens = text.split()
        if not tokens:
            return None
        kind = KIND_WORDS.get(tokens[0].lower())
        if kind is None:
            self._warn('"%s" is not a component (use resistor, globe, ammeter, '
                       'switch or wire) - ignored in: %s', tokens[0], line)
            return None
        if kind == 'voltmeter':
            self._warn('a voltmeter is connected with its own line, '
                       '"voltmeter across <label>" - ignored in: %s', line)
            return None

        comp = {'kind': kind, 'label': label}
        value = None
        for token in tokens[1:]:
            word = token.lower()
            if word in UNIT_WORDS:
                continue
            if word == 'hidden' and kind in ('resistor', 'globe'):
                comp['hidden'] = True
            elif word in ('open', 'closed') and kind == 'switch':
                comp['open'] = word == 'open'
            else:
                try:
                    value = _number(re.sub(r'(ohms?|Ω)$', '', token, flags=re.I))
                except ValueError:
                    self._warn('"%s" is not understood - ignored in: %s', token, line)
        if kind == 'resistor':
            if value is None or value <= 0:
                self._warn('a resistor needs a resistance greater than 0, '
                           'e.g. "resistor 6" - ignored in: %s', line)
                return None
            comp['r'] = value
        elif kind == 'globe':
            if value is not None and value <= 0:
                self._warn('the resistance of a globe must be greater than 0; '
                           'the default is used: %s', line)
            elif value is not None:
                comp['r'] = value
        elif value is not None:
            self._warn('a %s does not have a value; "%s" ignored in: %s',
                       kind, value, line)
        if kind == 'switch':
            comp.setdefault('open', False)
        return comp

    def _parse_components(self, text, line):
        comps = []
        # split on commas that are not inside a "label"
        for part in re.split(r',(?=(?:[^"]*"[^"]*")*[^"]*$)', text):
            if part.strip():
                comp = self._parse_component(part.strip(), line)
                if comp:
                    comps.append(comp)
        if len(comps) > MAX_SERIES:
            self._warn('only the first %d components are used in: %s', MAX_SERIES, line)
            comps = comps[:MAX_SERIES]
        return comps

    def _parse_content(self):
        """-> (items, supply voltmeter label or None).

        items is a list of {'type': 'series', 'comps': [...]} and
        {'type': 'parallel', 'branches': [[...], [...]]}.
        """
        items = []
        voltmeters = []         # (target text, label, line)
        for raw in self.content:
            line = raw.strip()
            if not line or line.startswith('#'):
                continue
            lowered = line.lower()

            if lowered.startswith('voltmeter'):
                match = re.match(r'voltmeters?\s+across\s+(.+)$', line, flags=re.I)
                if not match:
                    self._warn('expected "voltmeter across <label>" or "voltmeter '
                               'across supply" - line ignored: %s', line)
                    continue
                rest = match.group(1).strip()
                label = ''
                label_match = LABEL_RE.search(rest)
                if label_match:
                    label = label_match.group(1).strip()
                    rest = rest[:label_match.start()].strip()
                voltmeters.append((rest, label, line))
                continue

            if lowered.startswith('branch'):
                match = re.match(r'branch\s*:?\s*(.*)$', line, flags=re.I)
                comps = self._parse_components(match.group(1), line)
                if not comps:
                    comps = [{'kind': 'wire', 'label': ''}]
                if items and items[-1]['type'] == 'parallel' and not items[-1].get('closed'):
                    if len(items[-1]['branches']) >= MAX_BRANCHES:
                        self._warn('a parallel section has at most %d branches - '
                                   'line ignored: %s', MAX_BRANCHES, line)
                    else:
                        items[-1]['branches'].append(comps)
                else:
                    items.append({'type': 'parallel', 'branches': [comps]})
                continue

            comps = self._parse_components(line, line)
            if comps:
                if items and items[-1]['type'] == 'parallel':
                    items[-1]['closed'] = True
                if items and items[-1]['type'] == 'series':
                    items[-1]['comps'].extend(comps)
                else:
                    items.append({'type': 'series', 'comps': comps})

        for item in items:
            item.pop('closed', None)
            if item['type'] == 'parallel' and len(item['branches']) == 1:
                self._warn('a parallel section needs two or more "branch:" lines; '
                           'the single branch is drawn in series.')
                item['type'] = 'series'
                item['comps'] = item.pop('branches')[0]

        # labels: the teacher's own, then R1, R2 ... for the rest
        every = []
        for item in items:
            if item['type'] == 'series':
                every.extend(item['comps'])
            else:
                for branch in item['branches']:
                    every.extend(branch)
        used = {comp['label'].lower() for comp in every if comp['label']}
        used.update(label.lower() for _, label, _ in voltmeters if label)

        def auto_label(kind):
            number = 1
            while (PREFIX[kind] + str(number)).lower() in used:
                number += 1
            label = PREFIX[kind] + str(number)
            used.add(label.lower())
            return label

        for comp in every:
            if comp['kind'] != 'wire' and not comp['label']:
                comp['label'] = auto_label(comp['kind'])

        supply_vm = None
        for target, label, line in voltmeters:
            if target.lower() in SUPPLY_WORDS:
                if supply_vm is not None:
                    self._warn('there is already a voltmeter across the supply - '
                               'line ignored: %s', line)
                else:
                    supply_vm = label or auto_label('voltmeter')
                continue
            found = [comp for comp in every
                     if comp['kind'] != 'wire' and comp['label'].lower() == target.lower()]
            if not found:
                self._warn('there is no component labelled "%s" - line ignored: %s',
                           target, line)
            elif 'vm' in found[0]:
                self._warn('"%s" already has a voltmeter across it - line ignored: %s',
                           target, line)
            else:
                found[0]['vm'] = label or auto_label('voltmeter')
        return items, supply_vm

    # ----- options -----

    def _parse_build(self, text):
        """'series, 2 globes, 1 ammeter' -> {'topology': ..., 'counts': {...}}."""
        build = {'topology': None, 'counts': {}}
        count = None
        for word in re.split(r'[,;\s]+', text.strip().lower()):
            if not word or word in ('and', 'with', 'a', 'an', 'circuit', 'in', 'x'):
                continue
            if word in ('series', 'parallel'):
                build['topology'] = word
            elif word.isdigit():
                count = int(word)
            elif word in KIND_WORDS and KIND_WORDS[word] != 'wire':
                kind = KIND_WORDS[word]
                build['counts'][kind] = build['counts'].get(kind, 0) + (1 if count is None else count)
                count = None
            else:
                self._warn('":build:" does not understand "%s"; it is ignored.', word)
        counts = build['counts']
        for kind, limit in (('resistor', 4), ('globe', 4), ('ammeter', 4),
                            ('voltmeter', 4), ('switch', 2)):
            if counts.get(kind, 0) > limit:
                self._warn('":build:" allows at most %d %ss.', limit, kind)
                counts[kind] = limit
        loads = counts.get('resistor', 0) + counts.get('globe', 0)
        if build['topology'] and ('resistor' in counts or 'globe' in counts) and loads < 2:
            self._warn('a %s circuit needs two or more resistors or globes; the '
                       'arrangement is not checked.', build['topology'])
            build['topology'] = None
        if loads > 4:
            self._warn('":build:" allows at most 4 resistors and globes altogether.')
            counts['globe'] = max(0, 4 - counts.get('resistor', 0))
        if not build['topology'] and not counts:
            return None
        return build

    def run(self):
        items, supply_vm = self._parse_content()
        has_preset = bool(items)

        build = None
        if self.options.get('build', '').strip():
            build = self._parse_build(self.options['build'])

        if 'tools' in self.options:
            tools = self.options['tools']
        else:
            # a set circuit is for measuring unless tools are asked for
            tools = [] if (has_preset and not build) else list(TOOLS)
        if build and not tools:
            self._warn('":build:" needs some tools; all of the tools are given.')
            tools = list(TOOLS)

        resistors = self.options.get('resistors', DEFAULT_RESISTORS)
        globe_r = self.options.get('globe-resistance', 12)

        config = {
            'title': self.options.get('title', '').strip(),
            'voltage': self.options.get('voltage', 12),
            'cols': self.options.get('cols'),
            'rows': self.options.get('rows'),
            'globeR': globe_r,
            'resistors': resistors,
            'tools': tools,
            'build': build,
            'showCurrent': 'show-current' in self.options,
            'showValues': 'show-values' in self.options,
            'decimals': self.options.get('decimals', 2),
            'noSolution': 'no-solution' in self.options,
            'preset': {'items': items, 'supplyVm': supply_vm} if has_preset else None,
        }

        config_attr = html.escape(json.dumps(config), quote=True)
        # data-activitygroup-events: with a building task this block tells an
        # enclosing activitygroup when the task is done (see circuit.js)
        events = ' data-activitygroup-events="check answer"' if build else ''
        html_output = (
            f'<div class="circuit-block"{events} data-config="{config_attr}">'
            '<noscript>The circuit activity needs JavaScript.</noscript>'
            '</div>'
        )
        return [nodes.raw('', html_output, format='html')]


def setup(app):
    app.add_directive('circuit', CircuitDirective)

    static_path = Path(__file__).parent / '_static'
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file('circuit.js')
    app.add_css_file('circuit.css')
    return {
        'version': '1.0',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }
