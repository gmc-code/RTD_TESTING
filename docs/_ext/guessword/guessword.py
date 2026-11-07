"""
guessword - a classroom word-guessing game directive for Sphinx.

A school-friendly replacement for hangman. Wrong guesses advance a themed
picture (melting snowman, overflowing beaker, popping balloons, wilting
flower, draining battery, rising thermometer, a Rube Goldberg machine or a rocket
countdown) instead of a gallows.

Single word::

    .. guessword:: photosynthesis
       :image: beaker
       :hint: How plants make glucose

Several words in one game (one per line, optional hint after a ``|``)::

    .. guessword::
       :image: balloons
       :theme: ocean
       :lives: 8
       :shuffle:

       photosynthesis | How plants make glucose
       chlorophyll | The green pigment in leaves
       stomata

Options
    :image:   snowman (default) | beaker | balloons | flower | battery |
              thermometer | machine (also accepts rubegoldberg) | rocket |
              circuit | pendulum | daynight | moon | fuse | volcano
              random = a random picture for each word; a comma-separated
              list (e.g. rocket, fuse, machine) picks randomly from those
    :theme:   colour theme shared with flashquiz, flashcards, crossword and
              wordsearch: light (default) | dark | auto | ocean | forest |
              sunset | contrast. (Older pages used :theme: for the picture;
              a picture name there still works, with a build warning.)
    :hint:    hint for the single-word form
    :lives:   wrong guesses allowed, 3-12 (default 6)
    :title:   heading shown above the game (default "Guess the word")
    :shuffle: flag - randomise the order of the words
    :answers: none (default) | print - print an answer key on a second page
    :hemisphere: south (default) | north - which way the sun crosses the
              sky (daynight) and which side a waning moon is lit (moon)
    :no-settings: flag - hide the settings button (students can't change
              the picture, wrong guesses allowed, colour theme or hint button)
    :class:   extra CSS classes

Every game has a Print button that prints it as a blank worksheet.

conf.py::

    import os, sys
    sys.path.append(os.path.abspath("_ext/guessword"))
    extensions = [..., "guessword"]
"""
import base64
import json
import os

from docutils import nodes
from docutils.parsers.rst import Directive, directives

THEMES = ("snowman", "beaker", "balloons", "flower", "battery", "thermometer",
          "machine", "rocket", "circuit", "pendulum", "daynight", "moon", "fuse",
          "volcano")
THEME_ALIASES = {"rubegoldberg": "machine", "goldberg": "machine"}
ANSWERS = ("none", "print")
HEMISPHERES = ("south", "north")
# Colour themes shared by flashquiz, flashcards, crossword and wordsearch.
COLOUR_THEMES = ("light", "dark", "auto", "ocean", "forest", "sunset", "contrast")


class guessword_node(nodes.General, nodes.Element):
    """Placeholder node; the game itself is built by guessword.js."""


def _image(argument):
    """One picture, ``random`` (any picture), or a comma-separated shortlist.

    Always returns a list; with more than one picture each word gets a
    random one."""
    names = []
    for part in (argument or "").split(","):
        value = part.strip().lower().replace(" ", "").replace("-", "")
        if not value:
            continue
        if value == "random":
            return list(THEMES)
        names.append(directives.choice(THEME_ALIASES.get(value, value), THEMES))
    if not names:
        raise ValueError("no picture given")
    return list(dict.fromkeys(names))


def _hemisphere(argument):
    return directives.choice(argument.strip().lower(), HEMISPHERES)


def _answers(argument):
    return directives.choice(argument.strip().lower(), ANSWERS)


def _lives(argument):
    value = directives.positive_int(argument)
    if not 3 <= value <= 12:
        raise ValueError("lives must be between 3 and 12")
    return value


class GuessWordDirective(Directive):
    optional_arguments = 1
    final_argument_whitespace = True
    has_content = True
    option_spec = {
        "image": _image,
        "theme": directives.unchanged_required,
        "hint": directives.unchanged,
        "lives": _lives,
        "title": directives.unchanged,
        "shuffle": directives.flag,
        "answers": _answers,
        "hemisphere": _hemisphere,
        "no-settings": directives.flag,
        "class": directives.class_option,
    }

    def run(self):
        words = []
        if self.arguments:
            words.append({"w": self.arguments[0].strip(),
                          "h": self.options.get("hint", "").strip()})

        for line in self.content:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            word, _, hint = line.partition("|")
            words.append({"w": word.strip(), "h": hint.strip()})

        words = [w for w in words if w["w"]]
        if not words:
            raise self.error(
                "guessword needs a word as its argument, "
                "or one word per line in its content."
            )
        for w in words:
            if not any(c.isalpha() for c in w["w"]):
                raise self.error(f"guessword: '{w['w']}' has no letters to guess.")

        messages = []
        images = self.options.get("image")
        colour = "light"
        theme = (self.options.get("theme") or "").strip().lower()
        if theme in COLOUR_THEMES:
            colour = theme
        elif theme:
            # Older pages used :theme: for the picture.
            try:
                old_images = _image(theme)
            except ValueError:
                messages.append(self.state.document.reporter.warning(
                    f"guessword: unknown :theme: {theme!r}. Colour themes are "
                    f"{', '.join(COLOUR_THEMES)}; pictures now go in :image:.",
                    line=self.lineno))
            else:
                messages.append(self.state.document.reporter.warning(
                    f"guessword: ':theme: {theme}' is a picture - please change "
                    f"it to ':image: {theme}'. :theme: is now the colour theme.",
                    line=self.lineno))
                if images is None:
                    images = old_images

        node = guessword_node()
        node["data"] = {
            "words": words,
            # "theme" here is the picture list (guessword.js reads it).
            "theme": images or ["snowman"],
            "lives": self.options.get("lives", 6),
            "title": self.options.get("title", "Guess the word"),
            "shuffle": "shuffle" in self.options,
            "answers": self.options.get("answers", "none"),
            "hemisphere": self.options.get("hemisphere", "south"),
            "look": colour,
            "settings": "no-settings" not in self.options,
        }
        node["classes"] += ["gw-look-" + colour] + self.options.get("class", [])
        return [node] + messages


def visit_guessword_html(self, node):
    # Base64 so the answers aren't sitting in plain text in the page source.
    payload = json.dumps(node["data"], ensure_ascii=False).encode("utf-8")
    encoded = base64.b64encode(payload).decode("ascii")
    classes = " ".join(["guessword"] + node.get("classes", []))
    self.body.append(
        f'<div class="{classes}" data-gw="{encoded}" tabindex="0">'
        '<noscript>This word game needs JavaScript.</noscript></div>\n'
    )
    raise nodes.SkipNode


def skip_node(self, node):
    raise nodes.SkipNode


def _add_static_path(app):
    static = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    if static not in app.config.html_static_path:
        app.config.html_static_path.append(static)


def setup(app):
    app.add_node(
        guessword_node,
        html=(visit_guessword_html, None),
        latex=(skip_node, None),
        text=(skip_node, None),
        man=(skip_node, None),
        texinfo=(skip_node, None),
    )
    app.add_directive("guessword", GuessWordDirective)
    # Legacy alias so old pages keep working. Only enable once the old
    # hangman extension is removed from conf.py, or the two will clash.
    # app.add_directive("hangman", GuessWordDirective)

    app.connect("builder-inited", _add_static_path)
    app.add_css_file("guessword.css")
    app.add_js_file("guessword.js", defer="defer")
    return {"version": "1.6", "parallel_read_safe": True, "parallel_write_safe": True}
