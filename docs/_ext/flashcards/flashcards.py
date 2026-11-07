"""
flashcards directive
====================

Flip-card revision with spaced repetition (a Leitner box system). Each
student's progress is saved in their own browser, so cards they know well
come back less often and cards they get wrong come back soon.

Usage::

    .. flashcards:: Cells and Organelles
       :new-per-session: 10
       :intervals: 0, 1, 3, 7, 14
       :reverse:
       :shuffle:
       :theme: dark
       :id: cells-y8
       :sections: Organelles

       # Organelles
       Nucleus | Controls the cell and contains DNA
       Mitochondria | Site of respiration, releases energy
       Ribosome | Makes proteins

       # Plant cells
       Cell wall | Made of cellulose; supports the cell
       Chloroplast | Site of photosynthesis

Content rules:

* ``# Heading`` starts a new section. Students can switch sections on and
  off in Settings; ``:sections:`` (names or numbers, comma-separated) sets
  which ones start switched on.
* ``Front | Back`` is one card. Only the first ``|`` splits the line.
* ``\\n`` inside a side starts a new line on the card.
* Blank lines and lines starting with ``..`` (RST comments) are ignored.

How the spaced repetition works
-------------------------------

Every card sits in one of five boxes. New cards start in box 1.

* **Knew it** moves the card up one box.
* **Unsure** keeps the card in its box (it comes back sooner than "Knew it").
* **Didn't know** sends the card back to box 1 and it comes back again in
  the same session, a few cards later.

``:intervals:`` gives the wait, in days, before a card in each box is due
again (default ``0, 1, 3, 7, 14``: box 1 is due every session).
"""

import hashlib
import html
import json
from pathlib import Path

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective
from sphinx.util.fileutil import copy_asset


THEMES = ("dark", "light", "auto", "ocean", "forest", "sunset", "contrast")


class flashcards_node(nodes.General, nodes.Element):
    pass


def _short_hash(text, length=10):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:length]


def _positive_int(argument):
    try:
        value = int(argument)
    except (TypeError, ValueError):
        raise ValueError("must be a whole number, e.g. 10")
    if value < 0:
        raise ValueError("must be 0 or more")
    return value


def _intervals(argument):
    """Five comma-separated day counts, e.g. '0, 1, 3, 7, 14'."""
    try:
        values = [float(v) for v in str(argument).replace(";", ",").split(",") if v.strip()]
    except ValueError:
        raise ValueError("must be numbers of days separated by commas, e.g. 0, 1, 3, 7, 14")
    if len(values) != 5:
        raise ValueError("needs exactly five values (one for each box)")
    if any(v < 0 for v in values):
        raise ValueError("days can't be negative")
    return values


def _ident(argument):
    value = directives.unchanged_required(argument).strip()
    if not value:
        raise ValueError("needs a value, e.g. cells-y8")
    return value


def visit_flashcards_html(self, node):
    title = node.get("title", "")
    esc_title = html.escape(title)
    data = {
        "title": title,
        "deckId": node["deck_id"],
        "newPerSession": node["new_per_session"],
        "intervals": node["intervals"],
        "reverse": node["reverse"],
        "shuffle": node["shuffle"],
        "theme": node["theme"],
        "sections": node["sections"],
        "offSections": node["off_sections"],
    }
    # </ is escaped so a card can never close the <script> tag early.
    payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    total = sum(len(s["cards"]) for s in node["sections"])

    # Printable fold-and-cut sheet, built at build time so it works even
    # if JavaScript is off.
    rows = []
    for section in node["sections"]:
        if section["title"]:
            rows.append(
                f'<tr class="fc-print-sec"><th colspan="2">{html.escape(section["title"])}</th></tr>'
            )
        for card in section["cards"]:
            front = html.escape(card["f"]).replace("\n", "<br>")
            back = html.escape(card["b"]).replace("\n", "<br>")
            rows.append(f"<tr><td>{front}</td><td>{back}</td></tr>")
    print_table = "".join(rows)

    self.body.append(f"""
<div class="flashcards fc-theme-{node["theme"]}" tabindex="0" aria-label="Flashcards: {esc_title}">
  <script type="application/json" class="fc-data">{payload}</script>
  <div class="fc-head">
    <div class="fc-title">{esc_title or "Flashcards"}</div>
    <div class="fc-boxes" aria-label="Cards in each box"></div>
  </div>
  <div class="fc-stage" aria-live="polite">
    <div class="fc-home">
      <div class="fc-home-sub">{total} cards</div>
      <div class="fc-home-stats"></div>
      <div class="fc-home-secs"></div>
      <div class="fc-home-btns">
        <button type="button" class="fc-btn fc-btn-big fc-start">&#9654; Start review</button>
        <button type="button" class="fc-btn fc-practise">Practise all</button>
      </div>
      <div class="fc-home-note"></div>
    </div>
  </div>
  <div class="fc-rate" hidden>
    <button type="button" class="fc-btn fc-r fc-r1" data-r="1" title="Didn't know (key 1)"><kbd class="fc-key">1</kbd> &#10007; Didn't know</button>
    <button type="button" class="fc-btn fc-r fc-r2" data-r="2" title="Unsure (key 2)"><kbd class="fc-key">2</kbd> ~ Unsure</button>
    <button type="button" class="fc-btn fc-r fc-r3" data-r="3" title="Knew it (key 3)"><kbd class="fc-key">3</kbd> &#10003; Knew it</button>
  </div>
  <div class="fc-toolbar">
    <span class="fc-progress"></span>
    <span class="fc-spacer"></span>
    <button type="button" class="fc-btn fc-home-btn" title="Back to start (Esc)" aria-label="Back to start" hidden>&#8962;</button>
    <button type="button" class="fc-btn fc-settings-toggle" title="Settings" aria-label="Settings" aria-expanded="false">&#9881;</button>
    <button type="button" class="fc-btn fc-print" title="Print cards" aria-label="Print cards">&#128424;</button>
    <button type="button" class="fc-btn fc-fullscreen" title="Full screen (F)" aria-label="Full screen">&#x26F6;</button>
  </div>
  <div class="fc-settings" hidden>
    <div class="fc-set-row">
      <label class="fc-set-new" title="New cards added to each review"><span>New cards: <span class="fc-val-new"></span></span>
        <input type="range" class="fc-in-new" min="0" max="{max(total, 1)}" step="1">
      </label>
        <label title="Show the back of each card first"><input type="checkbox" class="fc-in-reverse"> Back first</label>
        <label><input type="checkbox" class="fc-in-shuffle"> Shuffle</label>
        <label class="fc-theme-line">Theme:
          <select class="fc-in-theme">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="auto" title="Match the computer's light or dark setting">Auto</option>
            <option value="ocean">Ocean</option>
            <option value="forest">Forest</option>
            <option value="sunset">Sunset</option>
            <option value="contrast">High contrast</option>
          </select></label>
      <span class="fc-reset-line">
        <button type="button" class="fc-link fc-reset">Reset progress</button>
        <span class="fc-reset-confirm" hidden title="This can't be undone">Reset?
          <button type="button" class="fc-link fc-reset-yes">Yes</button>
          <button type="button" class="fc-link fc-reset-no">No</button></span>
      </span>
    </div>
    <div class="fc-set-row fc-set-row2">
      <span class="fc-sections-head">
        <strong>Sections</strong>
        <button type="button" class="fc-link fc-all">All</button>
        <button type="button" class="fc-link fc-none">None</button>
      </span>
      <span class="fc-sections"></span>
    </div>
  </div>
  <div class="fc-printsheet">
    <div class="fc-print-title">{esc_title or "Flashcards"}</div>
    <div class="fc-print-help">Cut along the rows, fold down the middle line, and test yourself.</div>
    <table class="fc-print-table">{print_table}</table>
  </div>
</div>
""")


def depart_flashcards_html(self, node):
    pass


def skip_node(self, node):
    raise nodes.SkipNode


class FlashcardsDirective(SphinxDirective):
    has_content = True
    required_arguments = 0
    optional_arguments = 1
    final_argument_whitespace = True

    option_spec = {
        "new-per-session": _positive_int,
        "intervals": _intervals,
        "reverse": directives.flag,
        "shuffle": directives.flag,
        "theme": lambda arg: directives.choice(arg, THEMES),
        "id": _ident,
        "sections": directives.unchanged_required,
    }

    def run(self):
        sections = []
        current = None
        seen = set()

        for offset, raw in enumerate(self.content):
            line = raw.strip()
            if not line or line.startswith(".."):
                continue

            if line.startswith("#"):
                current = {"title": line.lstrip("#").strip(), "cards": []}
                sections.append(current)
                continue

            if "|" not in line:
                self.state_machine.reporter.warning(
                    f"flashcards: line has no '|' separating front and back, "
                    f"skipped: {line!r}",
                    line=self.content_offset + offset + 1,
                )
                continue

            front, back = (part.strip() for part in line.split("|", 1))
            if not front or not back:
                self.state_machine.reporter.warning(
                    f"flashcards: empty front or back, skipped: {line!r}",
                    line=self.content_offset + offset + 1,
                )
                continue

            front = front.replace("\\n", "\n")
            back = back.replace("\\n", "\n")

            # The card id comes from the front only, so fixing a typo in
            # an answer doesn't wipe a student's progress on that card.
            card_id = _short_hash(front)
            if card_id in seen:
                self.state_machine.reporter.warning(
                    f"flashcards: duplicate card front, skipped: {front!r}",
                    line=self.content_offset + offset + 1,
                )
                continue
            seen.add(card_id)

            if current is None:
                current = {"title": "", "cards": []}
                sections.append(current)
            current["cards"].append({"id": card_id, "f": front, "b": back})

        sections = [s for s in sections if s["cards"]]
        if not sections:
            return [
                self.state_machine.reporter.warning(
                    "flashcards: no cards found.", line=self.lineno
                )
            ]

        title = self.arguments[0] if self.arguments else ""
        deck_id = self.options.get("id") or _short_hash(f"{self.env.docname}::{title}", 12)

        node = flashcards_node()
        node["title"] = title
        node["deck_id"] = deck_id
        node["new_per_session"] = self.options.get("new-per-session", 10)
        node["intervals"] = self.options.get("intervals", [0, 1, 3, 7, 14])
        node["reverse"] = "reverse" in self.options
        node["shuffle"] = "shuffle" in self.options
        node["theme"] = self.options.get("theme", "dark")
        node["sections"] = sections
        node["off_sections"] = self._off_sections(sections)
        return [node]

    def _off_sections(self, sections):
        """Turn :sections: (numbers and/or names) into the list of
        section indexes that start switched OFF."""
        wanted = self.options.get("sections")
        if not wanted:
            return []
        on = set()
        for item in (w.strip() for w in wanted.split(",")):
            if not item:
                continue
            if item.isdigit() and 1 <= int(item) <= len(sections):
                on.add(int(item) - 1)
                continue
            match = [i for i, s in enumerate(sections) if s["title"].lower() == item.lower()]
            if match:
                on.update(match)
            else:
                self.state_machine.reporter.warning(
                    f"flashcards: :sections: has no section called {item!r} "
                    f"(use a section name or its number, 1 to {len(sections)})",
                    line=self.lineno,
                )
        if not on:
            return []
        return [i for i in range(len(sections)) if i not in on]


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
        flashcards_node,
        html=(visit_flashcards_html, depart_flashcards_html),
        latex=(skip_node, None),
        text=(skip_node, None),
    )
    app.add_directive("flashcards", FlashcardsDirective)

    app.add_js_file("flashcards.js")
    app.add_css_file("flashcards.css")

    app.connect("build-finished", copy_static_assets)

    return {
        "version": "1.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
