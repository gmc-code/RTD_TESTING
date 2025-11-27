from docutils import nodes
from docutils.parsers.rst import Directive
from docutils.parsers.rst import directives


class ParsonsDirective(Directive):
    has_content = True
    optional_arguments = 0
    option_spec = {
        "title": directives.unchanged,
        "shuffle": directives.flag,
        "columns": directives.positive_int,
    }

    def run(self):
        title = self.options.get("title", "Parsons Puzzle")
        shuffle = "shuffle" in self.options
        columns = int(self.options.get("columns", 2))

        # Parse content: strip leading "- " markers
        raw_lines = [
            line[2:] if line.strip().startswith("- ") else line
            for line in self.content if line.strip()
        ]

        # Main container
        container = nodes.container(
            classes=["parsons-container", f"parsons-cols-{columns}"])

        # Title
        title_para = nodes.paragraph()
        title_para += nodes.strong(text=title)
        container += title_para

        # Source list with puzzle lines
        source_ul = nodes.bullet_list(classes=["parsons-source"])
        for i, line in enumerate(raw_lines):
            li = nodes.list_item(classes=["parsons-line"])
            li["data-index"] = str(i)
            li["classes"].append("draggable")  # mark as draggable

            # Literal block with no-copybutton class
            code = nodes.literal_block(line, line)
            code['language'] = 'python'
            code['classes'].append('no-copybutton')
            li += code
            source_ul += li

        container += source_ul

        # Target columns with labels
        target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
        for c in range(columns):
            col = nodes.container(
                classes=["parsons-target", f"parsons-col-{c+1}"])
            # Add a label above each column
            label = nodes.paragraph(text=f"Column {c+1}")
            label['classes'].append("parsons-target-label")
            col += label

            target_ul = nodes.bullet_list(classes=["parsons-target-list"])
            col += target_ul
            target_wrapper += col
        container += target_wrapper

        # Controls (raw HTML buttons)
        controls = nodes.raw(
            "",
            '<div class="parsons-controls">'
            '<button class="parsons-check">Check</button>'
            '<button class="parsons-reset">Reset</button>'
            '</div>',
            format="html"
        )
        container += controls

        # Shuffle flag for JS
        container["data-shuffle"] = "true" if shuffle else "false"

        return [container]


def setup(app):
    app.add_directive("parsons", ParsonsDirective)
    app.add_js_file("parsons.js")
    app.add_css_file("parsons.css")
    return {
        "version": "0.1",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
