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

        # Copy for rendering
        raw_lines = expected_order[:]

        # Shuffle immediately if :shuffle: is set
        if shuffle:
            random.shuffle(raw_lines)

        container = nodes.container(
            classes=["parsons-container", f"parsons-cols-{columns}"]
        )

        container["data-expected"] = "|".join(l.strip() for l in expected_order)
        container["data-shuffle-js"] = "true" if shuffle_js else "false"

        # Title
        title_para = nodes.paragraph()
        title_para += nodes.strong(text=title)
        container += title_para

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
        container += source_ul

        # Target columns
        target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
        for c in range(columns):
            col = nodes.container(
                classes=["parsons-target", f"parsons-col-{c+1}"]
            )
            # Use provided label if available, else default
            label_text = labels[c] if c < len(labels) else f"Column {c+1}"
            label = nodes.paragraph(text=label_text, classes=["parsons-target-label"])
            col += label
            target_ul = nodes.bullet_list(classes=["parsons-target-list"])
            col += target_ul
            target_wrapper += col
        container += target_wrapper

        # Controls
        controls = nodes.raw(
            "",
            '<div class="parsons-controls">'
            '<button class="parsons-check">Check</button>'
            '<button class="parsons-reset">Reset</button>'
            "</div>",
            format="html",
        )
        container += controls

        return [container]


def setup(app):
    app.add_directive("parsons", ParsonsDirective)
    app.add_css_file("parsons/parsons.css")
    app.add_js_file("parsons/parsons.js")
    return {
        "version": "0.1",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
