from docutils import nodes
from docutils.parsers.rst import Directive, directives
import random


class ParsonsDirective(Directive):
    has_content = True
    optional_arguments = 0
    option_spec = {
        "title": directives.unchanged,
        "shuffle": directives.flag,
        "shuffle-js": directives.flag,
        "columns": directives.positive_int,
        "labels": directives.unchanged,
    }

    def run(self):
        title = self.options.get("title", "Parsons Puzzle")
        shuffle = "shuffle" in self.options
        shuffle_js = "shuffle-js" in self.options
        columns = int(self.options.get("columns", 1))

        # print("Directive content:", self.content)
        # print to  python terminal on build for checking

        # Parse labels if provided
        labels_opt = self.options.get("labels")
        labels = []
        if labels_opt:
            labels = [lbl.strip() for lbl in labels_opt.split(",")]

        # Preserve original order for solution
        expected_order = []
        for line in self.content:
            if not line.strip():
                continue
            if line.strip().startswith("- "):
                raw = line.strip()[2:]
            else:
                raw = line.strip()
            indent = len(line) - len(line.lstrip(" "))
            expected_order.append((indent, raw))

        lines = [(indent, code, idx+1) for idx, (indent, code) in enumerate(expected_order)]

        if shuffle:
            random.shuffle(lines)

        expected_attr = "|".join(f"{indent}::{code}" for indent, code in expected_order)
        shuffle_attr = "true" if shuffle_js else "false"

        # Open container
        open_div = nodes.raw(
            "",
            f'<div class="parsons-container parsons-cols-{columns}" '
            f'data-expected="{expected_attr}" data-shuffle-js="{shuffle_attr}">',
            format="html",
        )

        # Title
        title_para = nodes.paragraph()
        title_para += nodes.strong(text=title)

        # Source list
        source_ul = nodes.bullet_list(classes=["parsons-source"])


        # ----------------------------------------------------------------------------------------

        def strip_number_prefix(s: str) -> str:
            # Remove leading "N |" if present; also guard against accidental "NNcode"
            s = s.strip()
            # Pattern: digits optional spaces then pipe
            if "|" in s:
                left, right = s.split("|", 1)
                if left.strip().isdigit():
                    return right.strip()
            # If someone concatenated digits with code (e.g., "11nums"), keep original
            return s

        # ----------------------------------------------------------------------------------------


        for indent, code, orig_line in lines:
            clean = strip_number_prefix(code)
            li_html = (
                f'<li class="parsons-line draggable" data-line="{orig_line}" data-text="{clean}">'
                f'<span class="line-label">{orig_line} |</span>'
                f'<pre class="no-copybutton no-lineno">{clean}</pre>'
                f'</li>'
            )
            source_ul += nodes.raw("", li_html, format="html")



        # Target columns
        target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
        for c in range(columns):
            col = nodes.container(classes=["parsons-target", f"parsons-col-{c+1}"])
            label_text = labels[c] if c < len(labels) else f"Column {c+1}"
            label = nodes.paragraph(text=label_text, classes=["parsons-target-label"])
            col += label
            target_ul = nodes.bullet_list(classes=["parsons-target-list"])
            target_ul["data-indent"] = str(c)  # ensure indent is always set
            col += target_ul
            target_wrapper += col

        # Controls
        controls = nodes.raw(
            "",
            '<div class="parsons-controls">'
            '<button class="parsons-check">Check</button>'
            '<button class="parsons-reset">Reset</button>'
            '</div>',
            format="html",
        )

        close_div = nodes.raw("", "</div>", format="html")

        return [open_div, title_para, source_ul, target_wrapper, controls, close_div]


def setup(app):
    app.add_directive("parsons", ParsonsDirective)
    app.add_css_file("parsons/parsons.css")
    app.add_js_file("parsons/parsons.js")
    return {
        "version": "0.3",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }