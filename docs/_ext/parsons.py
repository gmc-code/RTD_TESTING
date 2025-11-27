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
        env = self.state.document.settings.env
        title = self.options.get("title", "Parsons Puzzle")
        shuffle = "shuffle" in self.options
        columns = int(self.options.get("columns", 2))

        # Parse content
        raw_lines = [
            line[2:] if line.strip().startswith("- ") else line
            for line in self.content if line.strip()
        ]

        # Container
        container = nodes.container(classes=["parsons-container", f"parsons-cols-{columns}"])

        # Title
        title_para = nodes.paragraph()
        title_para += nodes.strong(text=title)
        container += title_para

        # Source list
        source_ul = nodes.bullet_list(classes=["parsons-source"])
        for i, line in enumerate(raw_lines):
            li = nodes.list_item(classes=["parsons-line"])
            li["data-index"] = str(i)

            code = nodes.literal_block(line, line)
            code["language"] = "python"
            code["classes"].append("no-copybutton")  # prevent copybutton
            li += code
            source_ul += li

        container += source_ul

        # Target columns
        target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
        for c in range(columns):
            col = nodes.container(classes=["parsons-target", f"parsons-col-{c+1}"])
            target_ul = nodes.bullet_list(classes=["parsons-target-list"])
            col += target_ul
            target_wrapper += col
        container += target_wrapper

        # Controls (raw HTML only)
        controls = nodes.raw(
            "",
            '<div class="parsons-controls">'
            '<button class="parsons-check">Check</button>'
            '<button class="parsons-reset">Reset</button>'
            '</div>',
            format="html"
        )
        container += controls

        # Assets
        app = env.app
        app.add_js_file("parsons.js")
        app.add_css_file("parsons.css")

        # Shuffle flag
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
