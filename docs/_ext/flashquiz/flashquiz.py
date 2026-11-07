"""
flashquiz directive
===================

A timed, auto-advancing question-and-answer slideshow for the classroom.
Each question shows for ``question-time`` seconds, then the answer is
revealed for ``answer-time`` seconds, then the next question appears.

Usage::

    .. flashquiz:: Living Things & Ecosystems
       :question-time: 8
       :answer-time: 4
       :section-time: 3
       :loop:
       :shuffle:
       :timer-bar: off
       :review: on
       :theme: dark

       # 2A Introduction to Classification
       Sorting organisms into groups is called what? | Classification
       Groups are based on shared what? | Features

       # 2B How Biologists Classify Organisms
       What is the broadest classification level? | Kingdom

Content rules:

* ``# Heading`` starts a new section (shown as a title slide and used for
  the section filter and the colour of the answer box).
* ``Question | Answer`` is one question. Only the first ``|`` splits the
  line, so answers can't contain ``|`` but questions can't either.
* Blank lines and lines starting with ``..`` (RST comments) are ignored.
"""

import html
import json
from pathlib import Path

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective
from sphinx.util.fileutil import copy_asset


# Colour themes shared by flashquiz, flashcards, crossword, wordsearch and
# guessword.
THEMES = ("dark", "light", "auto", "ocean", "forest", "sunset", "contrast")


class flashquiz_node(nodes.General, nodes.Element):
    pass


def _seconds(argument):
    """Accept a positive number of seconds, e.g. 5 or 2.5."""
    try:
        value = float(argument)
    except (TypeError, ValueError):
        raise ValueError("must be a number of seconds, e.g. 5 or 2.5")
    if value <= 0:
        raise ValueError("must be greater than 0")
    return value


def _section_seconds(argument):
    """Like _seconds, but 0 is allowed (0 = skip section title slides)."""
    try:
        value = float(argument)
    except (TypeError, ValueError):
        raise ValueError("must be a number of seconds, e.g. 3")
    if value < 0:
        raise ValueError("must be 0 or more")
    return value


def visit_flashquiz_html(self, node):
    title = html.escape(node.get("title", ""))
    data = {
        "title": node.get("title", ""),
        "questionTime": node["question_time"],
        "answerTime": node["answer_time"],
        "sectionTime": node["section_time"],
        "loop": node["loop"],
        "shuffle": node["shuffle"],
        "autostart": node["autostart"],
        "timerBar": node["timer_bar"],
        "review": node["review"],
        "theme": node["theme"],
        "sections": node["sections"],
    }
    # </ is escaped so a question can never close the <script> tag early.
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    total = sum(len(s["questions"]) for s in node["sections"])
    hidden_bar = "" if node["timer_bar"] else " hidden"

    self.body.append(f"""
<div class="flashquiz fq-theme-{node["theme"]}" tabindex="0" aria-label="Flash quiz: {title}">
  <script type="application/json" class="fq-data">{payload}</script>
  <div class="fq-stage" aria-live="polite">
    <div class="fq-start">
      <div class="fq-start-title">{title or "Flash Quiz"}</div>
      <div class="fq-start-sub">{total} questions</div>
      <button type="button" class="fq-btn fq-btn-big fq-start-btn">&#9654; Start</button>
    </div>
  </div>
  <div class="fq-timer"{hidden_bar}><div class="fq-timer-bar"></div></div>
  <div class="fq-toolbar">
    <button type="button" class="fq-btn fq-prev" aria-label="Previous"
            title="Back (Left arrow)&#10;Shift+click or long-press: start of section / previous section&#10;Alt+click: replay this question&#10;Ctrl+click: first question">&#9664;&#9664;</button>
    <button type="button" class="fq-btn fq-play" title="Play / pause (Space)" aria-label="Play or pause">&#9654;</button>
    <button type="button" class="fq-btn fq-next" aria-label="Next"
            title="Next (Right arrow)&#10;Shift+click or long-press: next section&#10;Alt+click: next question without showing the answer&#10;Ctrl+click: last question">&#9654;&#9654;</button>
    <span class="fq-progress">0 / {total}</span>
    <span class="fq-spacer"></span>
    <button type="button" class="fq-btn fq-tag" title="Tag this question for review (T)" aria-label="Tag for review" aria-pressed="false" disabled>&#9873;</button>
    <button type="button" class="fq-btn fq-restart" title="Restart (R)" aria-label="Restart">&#8635;</button>
    <button type="button" class="fq-btn fq-jump-toggle" title="Go to a question" aria-label="Go to a question" aria-expanded="false">#</button>
    <button type="button" class="fq-btn fq-settings-toggle" title="Settings" aria-label="Settings" aria-expanded="false">&#9881;</button>
    <button type="button" class="fq-btn fq-fullscreen" title="Full screen (F)" aria-label="Full screen">&#x26F6;</button>
  </div>
  <div class="fq-jump" hidden>
    <div class="fq-jump-head"><strong>Go to question</strong></div>
    <div class="fq-jump-grid"></div>
  </div>
  <div class="fq-settings" hidden>
    <div class="fq-set-row">
      <label title="How long each question shows"><span>Question <span class="fq-val-q"></span> s</span>
        <input type="range" class="fq-in-q" min="1" max="30" step="0.5">
      </label>
      <label title="How long each answer shows"><span>Answer <span class="fq-val-a"></span> s</span>
        <input type="range" class="fq-in-a" min="1" max="30" step="0.5">
      </label>
      <label title="How long each section title shows (0 skips them)"><span>Section title <span class="fq-val-s"></span> s</span>
        <input type="range" class="fq-in-s" min="0" max="10" step="0.5">
      </label>
    </div>
    <div class="fq-set-row">
      <label><input type="checkbox" class="fq-in-loop"> Loop</label>
      <label title="Shuffle questions"><input type="checkbox" class="fq-in-shuffle"> Shuffle</label>
      <label title="Show timer bar"><input type="checkbox" class="fq-in-bar"> Timer bar</label>
      <label title="Next loop: only tagged questions"><input type="checkbox" class="fq-in-review"> Next loop: tagged only</label>
      <label class="fq-theme-line">Theme
        <select class="fq-in-theme">
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="auto" title="Match the computer's light or dark setting">Auto</option>
          <option value="ocean">Ocean</option>
          <option value="forest">Forest</option>
          <option value="sunset">Sunset</option>
          <option value="contrast">High contrast</option>
        </select></label>
    </div>
    <div class="fq-set-row fq-set-row3">
      <span class="fq-tag-line">&#9873; <span class="fq-tag-count">None tagged</span>
        <button type="button" class="fq-link fq-tag-clear">Clear tags</button></span>
      <span class="fq-sections-head">
        <strong>Sections</strong>
        <button type="button" class="fq-link fq-all">All</button>
        <button type="button" class="fq-link fq-none">None</button>
      </span>
      <span class="fq-sections"></span>
    </div>
  </div>
</div>
""")


def depart_flashquiz_html(self, node):
    pass


def skip_node(self, node):
    raise nodes.SkipNode


class FlashQuizDirective(SphinxDirective):
    has_content = True
    required_arguments = 0
    optional_arguments = 1
    final_argument_whitespace = True

    option_spec = {
        "question-time": _seconds,
        "answer-time": _seconds,
        "section-time": _section_seconds,
        "loop": directives.flag,
        "shuffle": directives.flag,
        "autostart": directives.flag,
        "timer-bar": lambda arg: directives.choice(arg, ("on", "off")),
        "review": lambda arg: directives.choice(arg, ("on", "off")),
        "theme": lambda arg: directives.choice(arg, THEMES),
    }

    def run(self):
        sections = []
        current = None

        for offset, raw in enumerate(self.content):
            line = raw.strip()
            if not line or line.startswith(".."):
                continue

            if line.startswith("#"):
                current = {"title": line.lstrip("#").strip(), "questions": []}
                sections.append(current)
                continue

            if "|" not in line:
                self.state_machine.reporter.warning(
                    f"flashquiz: line has no '|' separating question and "
                    f"answer, skipped: {line!r}",
                    line=self.content_offset + offset + 1,
                )
                continue

            question, answer = (part.strip() for part in line.split("|", 1))
            if not question or not answer:
                self.state_machine.reporter.warning(
                    f"flashquiz: empty question or answer, skipped: {line!r}",
                    line=self.content_offset + offset + 1,
                )
                continue

            if current is None:
                current = {"title": "", "questions": []}
                sections.append(current)
            current["questions"].append([question, answer])

        sections = [s for s in sections if s["questions"]]
        if not sections:
            return [
                self.state_machine.reporter.warning(
                    "flashquiz: no questions found.", line=self.lineno
                )
            ]

        node = flashquiz_node()
        node["title"] = self.arguments[0] if self.arguments else ""
        node["question_time"] = self.options.get("question-time", 8)
        node["answer_time"] = self.options.get("answer-time", 4)
        node["section_time"] = self.options.get("section-time", 3)
        node["loop"] = "loop" in self.options
        node["shuffle"] = "shuffle" in self.options
        node["autostart"] = "autostart" in self.options
        node["timer_bar"] = self.options.get("timer-bar", "on") == "on"
        node["review"] = self.options.get("review", "on") == "on"
        node["theme"] = self.options.get("theme", "dark")
        node["sections"] = sections
        return [node]


def copy_static_assets(app, exception):
    """Copies static assets to the build output directory."""
    if app.builder.name == "html" and exception is None:
        ext_static = Path(__file__).parent / "_static"
        out_static = Path(app.outdir) / "_static"

        if ext_static.exists():
            try:
                # Sphinx 8.1+ won't overwrite existing files unless forced,
                # so edited CSS/JS would otherwise not update on rebuild.
                copy_asset(str(ext_static), str(out_static), force=True)
            except TypeError:
                # Older Sphinx: no 'force' argument, and it always overwrites.
                copy_asset(str(ext_static), str(out_static))


def setup(app):
    app.add_node(
        flashquiz_node,
        html=(visit_flashquiz_html, depart_flashquiz_html),
        latex=(skip_node, None),
        text=(skip_node, None),
    )
    app.add_directive("flashquiz", FlashQuizDirective)

    app.add_js_file("flashquiz.js")
    app.add_css_file("flashquiz.css")

    app.connect("build-finished", copy_static_assets)

    return {
        "version": "1.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
