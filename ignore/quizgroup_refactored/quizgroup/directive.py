from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective

from .nodes import quizgroup_node

_NAV_POSITIONS = ("top", "bottom", "both")

# Canonical (underscore) option names. Hyphenated aliases are generated below.
_OPTIONS = {
    "shuffle_questions": directives.flag,
    "num_questions": directives.positive_int,
    "nav_position": lambda arg: directives.choice(arg, _NAV_POSITIONS),
    "show_instant_feedback": directives.flag,
    "enable_instant_feedback": directives.flag,
}


def _with_hyphen_aliases(spec):
    out = {}
    for key, conv in spec.items():
        out[key] = conv
        out[key.replace("_", "-")] = conv
    return out


class QuizGroupDirective(SphinxDirective):
    has_content = True
    option_spec = _with_hyphen_aliases(_OPTIONS)

    def _get(self, name, default=None):
        """Read an option by its underscore or hyphenated spelling."""
        for key in (name, name.replace("_", "-")):
            if key in self.options:
                return self.options[key]
        return default

    def _flag(self, name):
        return name in self.options or name.replace("_", "-") in self.options

    def run(self):
        node = quizgroup_node()

        enable_feedback = self._flag("enable_instant_feedback")
        node["shuffle_questions"] = self._flag("shuffle_questions")
        node["num_questions"] = self._get("num_questions")
        node["nav_position"] = self._get("nav_position", "bottom")
        # Enabling instant feedback implies the checkbox must be shown.
        node["show_instant_feedback"] = self._flag("show_instant_feedback") or enable_feedback
        node["enable_instant_feedback"] = enable_feedback

        self.state.nested_parse(self.content, self.content_offset, node)
        return [node]
