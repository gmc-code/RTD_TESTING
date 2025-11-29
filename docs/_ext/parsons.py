from docutils import nodes
from docutils.parsers.rst import Directive, directives
import random
import json
import html
import csv


# ... keep your imports and class definition ...

class ParsonsDirective(Directive):
    has_content = True
    option_spec = {
        "title": directives.unchanged,
        "shuffle": directives.flag,
        "shuffle-js": directives.flag,
        "columns": directives.positive_int,
        "labels": directives.unchanged,
        "auto-format": directives.flag,
    }

    def run(self):
        title = self.options.get("title", "Parsons Puzzle")
        shuffle = "shuffle" in self.options
        shuffle_js = "shuffle-js" in self.options
        columns = int(self.options.get("columns", 1))

        # Parse labels (CSV-safe)
        labels_opt = self.options.get("labels")
        labels = next(csv.reader([labels_opt])) if labels_opt else []

        # Build expected order with consistent indent
        expected_order = []
        for line in self.content:
            if not line.strip():
                continue
            expanded = line.expandtabs(4)
            indent = len(expanded) - len(expanded.lstrip())
            raw = expanded.strip()
            expected_order.append({"indent": indent, "code": raw})

        raw_lines = [item["code"] for item in expected_order]

        # shuffle in Python only if JS won't do it
        if shuffle and not shuffle_js:
            random.shuffle(raw_lines)

        # embed JSON safely
        expected_json = html.escape(json.dumps(expected_order))
        shuffle_attr = "true" if shuffle_js else "false"

        # open wrapper
        open_div = nodes.raw(
            "",
            f'<div class="parsons-container parsons-cols-{columns}" '
            f'data-expected="{expected_json}" data-shuffle-js="{shuffle_attr}">',
            format="html",
        )

        # title
        title_para = nodes.paragraph()
        title_para += nodes.strong(text=title)

        # source list
        source_ul = nodes.bullet_list(classes=["parsons-source"])
        for i, code_line in enumerate(raw_lines):
            li = nodes.list_item(classes=["parsons-line", "draggable"])

            code = nodes.literal_block(code_line, code_line)
            code["language"] = "python"
            code["classes"].append("no-copybutton")

            # store original line number on <pre>
            code["data-index"] = str(i + 1)  # +1 so numbering starts at 1

            li += code
            source_ul += li

        # target columns
        target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
        for c in range(columns):
            col = nodes.container(classes=["parsons-target", f"parsons-col-{c+1}"])
            label_text = labels[c] if c < len(labels) else f"Column {c+1}"
            col += nodes.paragraph(text=label_text, classes=["parsons-target-label"])

            ul = nodes.bullet_list(classes=["parsons-target-list"])
            ul["data-indent"] = str(c)
            col += ul
            target_wrapper += col

        # controls
        controls_html = (
            '<div class="parsons-controls">'
            '<button class="parsons-check">Check</button>'
            '<button class="parsons-reset">Reset</button>'
            '<button class="parsons-show-solution">Solution</button>'
            '</div>'
        )
        controls = nodes.raw("", controls_html, format="html")
        close_div = nodes.raw("", "</div>", format="html")

        return [open_div, title_para, source_ul, target_wrapper, controls, close_div]


def setup(app):
    app.add_directive("parsons", ParsonsDirective)
    app.add_css_file("parsons/parsons.css")
    app.add_js_file("parsons/parsons.js")
    return {
        "version": "0.4",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
