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

        # Parse labels if provided
        labels_opt = self.options.get("labels")
        labels = []
        if labels_opt:
            labels = [lbl.strip() for lbl in labels_opt.split(",")]

        # Preserve original order for solution
        expected_order = [
            line[2:] if line.strip().startswith("- ") else line
            for line in self.content if line.strip()
        ]
        raw_lines = expected_order[:]

        if shuffle:
            random.shuffle(raw_lines)

        expected_attr = "|".join(l.strip() for l in expected_order)
        shuffle_attr = "true" if shuffle_js else "false"

        # Open container with raw HTML so attributes are preserved
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
        for i, line in enumerate(raw_lines):
            li = nodes.list_item(classes=["parsons-line"])
            li["data-index"] = str(i)
            li["classes"].append("draggable")

            code = nodes.literal_block(line, line)
            code["language"] = "python"
            code["classes"].append("no-copybutton")
            li += code
            source_ul += li

        # Target columns
        target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
        for c in range(columns):
            col = nodes.container(classes=["parsons-target", f"parsons-col-{c+1}"])
            label_text = labels[c] if c < len(labels) else f"Column {c+1}"
            label = nodes.paragraph(text=label_text, classes=["parsons-target-label"])
            col += label
            target_ul = nodes.bullet_list(classes=["parsons-target-list"])
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

        # Close container
        close_div = nodes.raw("", "</div>", format="html")

        return [open_div, title_para, source_ul, target_wrapper, controls, close_div]



def setup(app):
    app.add_directive("parsons", ParsonsDirective)
    app.add_css_file("parsons/parsons.css")
    app.add_js_file("parsons/parsons.js")
    return {
        "version": "0.1",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
