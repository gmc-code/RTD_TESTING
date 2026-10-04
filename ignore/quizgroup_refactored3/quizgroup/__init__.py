"""quizgroup - a Sphinx extension that wraps question directives in a quiz.

Layout
------
__init__.py     setup(): registers the node/directive and discovers static assets
directive.py    the ``.. quizgroup::`` directive (option parsing only)
nodes.py        the docutils node and its HTML output
static/quizgroup/
    core.js           namespace + adapter registry + shared utilities
    field-adapter.js  factory for "a set of input fields" question types
    adapters/*.js     ONE FILE PER QUESTION TYPE (auto-discovered)
    adapters/*.css    optional styles for that question type (auto-discovered)
    group.js          the quiz controller (wizard view, score, start/check/reset)
    init.js           DOMContentLoaded bootstrap
    quizgroup.css     styles for the quiz chrome only

Adding a question type = drop ``adapters/<name>.js`` (and optionally
``<name>.css``) into the static folder.  No Python or controller change.
"""
from pathlib import Path

from .directive import QuizGroupDirective
from .nodes import quizgroup_node, visit_quizgroup_html, depart_quizgroup_html

__version__ = "2.0"

_STATIC_ROOT = Path(__file__).parent / "static"
_ASSET_DIR = "quizgroup"  # sub-folder inside _static/ in the built site

# Order matters only for these: core must be defined before anything uses it.
_CORE_JS = ["core.js", "field-adapter.js"]
_TAIL_JS = ["group.js", "init.js"]


def _discover(pattern):
    """Return adapter asset paths (relative to _static/) matching ``pattern``."""
    adapters_dir = _STATIC_ROOT / _ASSET_DIR / "adapters"
    return [
        f"{_ASSET_DIR}/adapters/{p.name}"
        for p in sorted(adapters_dir.glob(pattern))
        if not p.name.startswith("_")  # files starting with _ are ignored
    ]


def setup(app):
    app.add_node(
        quizgroup_node,
        html=(visit_quizgroup_html, depart_quizgroup_html),
    )
    app.add_directive("quizgroup", QuizGroupDirective)

    static = str(_STATIC_ROOT)
    if static not in app.config.html_static_path:
        app.config.html_static_path.append(static)

    app.add_css_file(f"{_ASSET_DIR}/quizgroup.css")
    for css in _discover("*.css"):
        app.add_css_file(css)

    for name in _CORE_JS:
        app.add_js_file(f"{_ASSET_DIR}/{name}")
    for js in _discover("*.js"):
        app.add_js_file(js)
    for name in _TAIL_JS:
        app.add_js_file(f"{_ASSET_DIR}/{name}")

    return {
        "version": __version__,
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
