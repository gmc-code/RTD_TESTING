import html
from pathlib import Path
from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective

class label_node(nodes.General, nodes.Element):
    pass

def visit_label_html(self, node):
    self.body.append('<div class="label-block">')

def depart_label_html(self, node):
    self.body.append('</div>')

class LabelDirective(SphinxDirective):
    has_content = False
    required_arguments = 1
    option_spec = {'image': directives.unchanged_required}

    def run(self):
        data_path = self.env.relfn2path(self.arguments[0])[1]

        # Detect encoding from the BOM rather than assuming UTF-8.
        # Files exported from Excel ("Save As > Unicode Text") are UTF-16
        # (LE or BE) and will raise UnicodeDecodeError if forced through
        # utf-8-sig, since a UTF-16 BOM (FF FE / FE FF) is not valid UTF-8.
        with open(data_path, 'rb') as f:
            raw = f.read()

        if raw.startswith(b'\xff\xfe'):
            encoding = 'utf-16-le'
        elif raw.startswith(b'\xfe\xff'):
            encoding = 'utf-16-be'
        elif raw.startswith(b'\xef\xbb\xbf'):
            encoding = 'utf-8-sig'
        else:
            encoding = 'utf-8'

        try:
            text = raw.decode(encoding)
        except UnicodeDecodeError as e:
            raise self.error(
                f"File {self.arguments[0]} could not be decoded as {encoding}: {e}"
            )

        lines = text.replace('\r\n', '\n').replace('\r', '\n').split('\n')

        # The file is structured as three blank-line-separated blocks:
        #   1. labels (one per line)
        #   2. positions (x1,y1,x2,y2,align  -- one per line, same order as labels)
        #   3. metadata (year_level, strand, name, source -- exactly 4 lines)
        # Blank-line runs of varying length separate the blocks, so split on
        # them instead of assuming a fixed 20-label/20-position layout.
        blocks = []
        current = []
        for line in lines:
            if line.strip():
                current.append(line)
            elif current:
                blocks.append(current)
                current = []
        if current:
            blocks.append(current)

        if len(blocks) < 3:
            raise self.error(
                f"File {self.arguments[0]} does not have the expected label/position/metadata "
                f"sections (found {len(blocks)} non-blank block(s))."
            )

        labels, position_lines, metadata_lines = blocks[0], blocks[1], blocks[-1]

        if len(position_lines) != len(labels):
            raise self.error(
                f"File {self.arguments[0]} has {len(labels)} labels but "
                f"{len(position_lines)} position rows; they must match 1-to-1."
            )
        if len(metadata_lines) < 4:
            raise self.error(
                f"File {self.arguments[0]} metadata block must have 4 lines "
                f"(year_level, strand, name, source); found {len(metadata_lines)}."
            )

        positions = [l.split(',') for l in position_lines]

        # Metadata extraction
        metadata = {
            "year_level": metadata_lines[0],
            "strand": metadata_lines[1],
            "name": metadata_lines[2],
            "source": metadata_lines[3]
        }

        node = label_node()
        # Header displaying metadata
        html_out = f'<div class="label-info"><strong>{metadata["name"]}</strong> | {metadata["year_level"]} - {metadata["strand"]}</div>'
        html_out += f'<div class="label-container" style="position:relative; width:560px; height:500px; background-image:url({self.options["image"]});">'

        # Word Bank
        html_out += '<div class="label-wordbank-tray">'
        for label in labels:
            html_out += f'<div class="label-draggable" draggable="true" data-word="{label.lower()}">{label}</div>'
        html_out += '</div>'

        # Drop Zones (position row i corresponds to label i, in file order)
        for label_idx, pos in enumerate(positions):
            x1, y1, x2, y2, align = pos
            style = f"position:absolute; left:{x1}px; top:{y1}px; width:{int(x2)-int(x1)}px; height:{int(y2)-int(y1)}px;"
            correct = labels[label_idx].lower()
            html_out += f'''<div class="label-wrapper"><div class="label-dropzone" style="{style}" data-correct="{correct}"></div><span class="label-inline-feedback"></span></div>'''

        html_out += '</div>'
        node += nodes.raw("", html_out, format="html")
        return [node]

def setup(app):
    app.add_node(label_node, html=(visit_label_html, depart_label_html))
    app.add_directive("label-diagram", LabelDirective)

    static_path = Path(__file__).parent / "_static"
    # Ensure the path exists before adding to config
    if static_path.exists():
        if str(static_path) not in app.config.html_static_path:
            app.config.html_static_path.append(str(static_path))

    app.add_js_file("labels.js")
    app.add_css_file("labels.css")

    return {
        "version": "1.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True
    }