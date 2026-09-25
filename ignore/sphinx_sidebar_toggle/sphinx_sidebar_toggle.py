

from pathlib import Path
from sphinx.application import Sphinx

def setup(app: Sphinx):
    # Register the extension's _static directory
    static_path = Path(__file__).parent / "_static"

    # Initialize list if conf.py hasn't yet, or append if present
    if not hasattr(app.config, 'html_static_path'):
        app.config.html_static_path = []
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    # Register JS and CSS files relative to _static/
    app.add_css_file('sphinx_sidebar_toggle.css')
    app.add_js_file('sphinx_sidebar_toggle.js')

    return {
        'version': '0.1',
        'parallel_read_safe': True,
        'parallel_write_safe': True,
    }