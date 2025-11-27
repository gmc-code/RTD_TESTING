from docutils import nodes
from docutils.parsers.rst import Directive
from docutils.parsers.rst import directives

class ParsonsDirective(Directive):
    """
    Usage in RST:

    .. parsons::
       :title: Reverse a list
       :shuffle: true

       - result = []
       - for x in reversed(xs):
       -     result.append(x)
       - print(result)
    """

    has_content = True
    optional_arguments = 0
    option_spec = {
        "title": directives.unchanged,
        "shuffle": directives.flag,  # presence enables shuffling
        "columns": directives.positive_int,  # for 2D layout, default 2
    }

    def run(self):
        env = self.state.document.settings.env
        title = self.options.get("title", "Parsons Puzzle")
        shuffle = "shuffle" in self.options
        columns = int(self.options.get("columns", 2))

        # Parse content: lines starting with "- " are puzzle lines
        raw_lines = [
            line[2:] if line.strip().startswith("- ") else line
            for line in self.content if line.strip()
        ]

        # Create container
        container = nodes.container(classes=["parsons-container"])
        container["classes"].append(f"parsons-cols-{columns}")

        # Title
        title_node = nodes.strong(text=title)
        title_para = nodes.paragraph()
        title_para += title_node
        container += title_para

        # Source list (scrambled)
        source_ul = nodes.bullet_list(classes=["parsons-source"])
        for i, line in enumerate(raw_lines):
            li = nodes.list_item(classes=["parsons-line"])
            # Store the original index so we can check correctness later
            li["data-index"] = str(i)
            code = nodes.literal_block(line, line)
            code["language"] = "python"
            li += code
            source_ul += li

        # Target area(s) for 2D layout
        # Create N columns for assembly
        target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
        for c in range(columns):
            col = nodes.container(classes=["parsons-target", f"parsons-col-{c+1}"])
            # Empty list in each column for drop targets
            target_ul = nodes.bullet_list(classes=["parsons-target-list"])
            col += target_ul
            target_wrapper += col

        container += source_ul
        container += target_wrapper

        # Controls
        controls = nodes.container(classes=["parsons-controls"])
        check_button = nodes.literal(text="[Check]")
        reset_button = nodes.literal(text="[Reset]")
        controls += nodes.paragraph(text="")  # spacer
        controls += nodes.paragraph("", check_button, classes=["parsons-check"])
        controls += nodes.paragraph("", reset_button, classes=["parsons-reset"])
        container += controls

        # Add script/css once per page
        app = env.app
        app.add_js_file("parsons.js")
        app.add_css_file("parsons.css")

        # Data attributes on container
        container["data-shuffle"] = "true" if shuffle else "false"

        return [container]

def setup(app):
    app.add_directive("parsons", ParsonsDirective)
    # Ensure assets can be found
    app.add_js_file("parsons.js")
    app.add_css_file("parsons.css")
    return {
        "version": "0.1",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
