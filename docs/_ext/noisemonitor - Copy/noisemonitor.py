from pathlib import Path
from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective
from sphinx.util.fileutil import copy_asset
from sphinx.util.osutil import relative_uri


class noisemonitor_node(nodes.General, nodes.Element):
    pass


def visit_noisemonitor_html(self, node):
    threshold = node.get('threshold', 60)
    image_min = node.get('image_min', 0)
    image_max = node.get('image_max', 100)

    # Resolve the images relative to the current page, wherever it
    # sits in the doc tree. `pathto` is only exposed inside Jinja
    # templates, not as a real method on the builder, so we
    # replicate what it does: compute the built page's own output
    # URI, then get a relative URI from there to each static image.
    docname = self.builder.current_docname
    base_uri = self.builder.get_target_uri(docname)
    noise_images = [
        relative_uri(base_uri, f'_static/noise{i}.png')
        for i in range(6)
    ]

    image_data_attrs = " ".join(
        f'data-img{i}="{src}"' for i, src in enumerate(noise_images)
    )

    html_out = f'''
    <div class="noise-monitor-card" data-threshold="{threshold}" data-image-min="{image_min}" data-image-max="{image_max}" {image_data_attrs}>
        <div class="noise-monitor-header">
            <h3>🔊 Noise Level Monitor</h3>
        </div>
        <div class="noise-monitor-body">
            <div class="noise-visualizer">
                <img class="noise-image" src="{noise_images[0]}" alt="Noise level indicator">
                <p class="noise-status-text">Monitoring ambient sound...</p>
            </div>

            <div class="noise-meter-container">
                <div class="noise-meter-bar"></div>
            </div>
            <div class="noise-readout"><span class="noise-db-value">0</span> dB</div>
        </div>
        <div class="noise-monitor-controls">
            <button type="button" class="noise-btn-toggle">Start Mic Monitor</button>
        </div>
    </div>
    '''
    self.body.append(html_out)


def depart_noisemonitor_html(self, node):
    pass


class NoiseMonitorDirective(SphinxDirective):
    has_content = False

    option_spec = {
        'threshold': directives.nonnegative_int,
        'image-min': directives.nonnegative_int,
        'image-max': directives.nonnegative_int,
    }

    def run(self):
        node = noisemonitor_node()
        node['threshold'] = self.options.get('threshold', 60)

        image_min = self.options.get('image-min', 0)
        image_max = self.options.get('image-max', 100)

        if image_max <= image_min:
            self.state_machine.reporter.warning(
                f'noisemonitor: image-max ({image_max}) must be greater '
                f'than image-min ({image_min}); falling back to 0-100.',
                line=self.lineno,
            )
            image_min, image_max = 0, 100

        node['image_min'] = image_min
        node['image_max'] = image_max

        return [node]


def copy_static_assets(app, exception):
    """Copies static assets to the build output directory."""
    if app.builder.name == 'html' and exception is None:
        ext_static = Path(__file__).parent / "_static"
        out_static = Path(app.outdir) / "_static"

        if ext_static.exists():
            copy_asset(str(ext_static), str(out_static))


def setup(app):
    app.add_node(
        noisemonitor_node,
        html=(visit_noisemonitor_html, depart_noisemonitor_html),
    )
    app.add_directive("noisemonitor", NoiseMonitorDirective)

    app.add_js_file("noisemonitor.js")
    app.add_css_file("noisemonitor.css")

    app.connect('build-finished', copy_static_assets)

    return {
        "version": "1.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }