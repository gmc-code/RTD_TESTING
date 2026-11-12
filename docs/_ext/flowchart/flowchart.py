"""
flowchart -- a Sphinx directive that turns pseudocode into an interactive flowchart.

    .. flowchart::
        :mode: step
        :title: Positive or not?

        BEGIN
            INPUT number
            IF number > 0 THEN
                PRINT number + " is positive."
            ELSE
                PRINT number + " is not positive."
            ENDIF
        END

Modes
    step    (default) step through the algorithm: type inputs, watch the current
            shape and pseudocode line light up, with a variable table and output.
            Falls back to "view" if the pseudocode has lines that cannot be run.
    view    chart + pseudocode, with line <-> shape linking only.
    blanks  the text in the shapes is hidden for students to drag (or type) in.
    draw    students build the chart themselves from a palette of shapes, add the
            text, join the shapes with arrows, then check it. The pseudocode is the
            answer and stays hidden until the chart is correct.

Options
    :mode:      step | view | blanks | draw
    :title:     caption shown above the chart
    :blank:     (blanks mode) which shapes to empty: all (default), or any of
                decisions, io, process, and/or pseudocode line numbers, e.g.
                ``:blank: decisions`` or ``:blank: 3, 5``
    :entry:     (blanks and draw modes) drag (default, word bank) | type
    :answers:   (blanks and draw modes) flag; adds a "Show answers" button
    :show-code: (draw mode) flag; show the pseudocode beside the drawing area
    :height:    (draw mode) height of the drawing area in pixels
    :inputs:    comma separated values pre-filled into the INPUT boxes, in order
    :layout:    auto (default) | side | stacked
    :hide-code: flag; do not show the pseudocode panel
    :class:     extra CSS class(es)

A line can be given its own shape text with a trailing ``// text`` comment:

        A <- l * w      // Calculate A = l x w
"""

import json
import re
from html import escape
from pathlib import Path

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.highlighting import lexers
from sphinx.util import logging
from sphinx.util.docutils import SphinxDirective

__version__ = "1.1.0"

logger = logging.getLogger(__name__)
STATIC_DIR = Path(__file__).parent / "_static"

_KEYWORD_START = re.compile(
    r"^(IF|ELSEIF|ELSE|ELIF|WHILE|UNTIL|FOR|CASE|PRINT|OUTPUT|DISPLAY|INPUT|GET)\b"
)
_EQUALS_ASSIGN = re.compile(r"^[A-Za-z_]\w*\s*=(?!=)")


class flowchart_node(nodes.General, nodes.Element):
    """Holds the widget HTML; its literal_block child is the non-HTML fallback."""


def visit_flowchart_html(self, node):
    self.body.append(node["html"])
    raise nodes.SkipNode


def visit_flowchart_other(self, node):
    pass


def depart_flowchart_other(self, node):
    pass


def _choice(allowed):
    def conv(arg):
        return directives.choice(arg, allowed)
    return conv


class FlowchartDirective(SphinxDirective):
    has_content = True
    required_arguments = 0
    optional_arguments = 0
    option_spec = {
        "mode": _choice(("step", "view", "blanks", "draw")),
        "title": directives.unchanged,
        "blank": directives.unchanged,
        "entry": _choice(("drag", "type")),
        "answers": directives.flag,
        "inputs": directives.unchanged,
        "layout": _choice(("auto", "side", "stacked")),
        "hide-code": directives.flag,
        "show-code": directives.flag,
        "height": directives.positive_int,
        "class": directives.class_option,
    }

    def run(self):
        self.assert_has_content()
        source = "\n".join(self.content)

        for offset, line in enumerate(self.content):
            code = line.split("//")[0].strip()
            if _EQUALS_ASSIGN.match(code) and not _KEYWORD_START.match(code):
                logger.warning(
                    "flowchart: '%s' uses = for assignment; pseudocode normally "
                    "uses ← (it is still treated as an assignment)",
                    code,
                    location=(self.env.docname, self.content_offset + offset + 1),
                )

        config = {
            "mode": self.options.get("mode", "step"),
            "title": self.options.get("title", ""),
            "blank": self.options.get("blank", "all"),
            "entry": self.options.get("entry", "drag"),
            "answers": "answers" in self.options,
            "inputs": self.options.get("inputs", ""),
            "layout": self.options.get("layout", "auto"),
            "hideCode": "hide-code" in self.options,
            "showCode": "show-code" in self.options,
            "height": self.options.get("height", 0),
        }
        classes = ["fc-widget"] + list(self.options.get("class", []))
        html = (
            '<div class="%s" data-fc="%s">'
            '<pre class="fc-source">%s</pre>'
            "</div>\n"
        ) % (
            " ".join(classes),
            escape(json.dumps(config), quote=True),
            escape(source),
        )

        node = flowchart_node()
        node["html"] = html
        fallback = nodes.literal_block(source, source)
        fallback["language"] = "pseudocode" if "pseudocode" in lexers else "text"
        node += fallback
        self.add_name(node)
        return [node]


def setup(app):
    app.add_node(
        flowchart_node,
        html=(visit_flowchart_html, None),
        latex=(visit_flowchart_other, depart_flowchart_other),
        text=(visit_flowchart_other, depart_flowchart_other),
        man=(visit_flowchart_other, depart_flowchart_other),
        texinfo=(visit_flowchart_other, depart_flowchart_other),
    )
    app.add_directive("flowchart", FlowchartDirective)

    static_path = str(STATIC_DIR)
    if static_path not in app.config.html_static_path:
        app.config.html_static_path.append(static_path)

    app.add_js_file("flowchart.js")
    app.add_css_file("flowchart.css")
    return {
        "version": __version__,
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
