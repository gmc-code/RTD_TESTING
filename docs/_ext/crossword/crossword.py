"""
crossword — a Sphinx directive for interactive, printable classroom crosswords.

The browser (crossword.js) lays out the grid from a seed, so every student
starts with the same puzzle, and "New" redraws a different pattern (and, with
:words:, a different selection of words). The Python side parses the word
list and, when the whole list is used, checks at build time that every word
can be linked into a grid.

Usage::

    .. crossword:: Cells and organelles
       :wordbank:

       NUCLEUS      | Controls the activities of the cell
       CELL WALL    | Rigid layer that supports a plant cell
       MITOCHONDRIA | Where aerobic respiration happens

Each content line is ``ANSWER | clue``. Spaces and hyphens in an answer are
removed from the grid but shown in the clue's letter count, e.g. (4,4).
Blank lines and lines starting with ``#`` are ignored.

Options
-------
:id:            HTML id for the puzzle (default: auto)
:seed:          integer — change it to get a different starting layout
:words:         number of words to use from the list; a different selection
                (and pattern) is drawn each time a student presses "New"
:wordbank:      flag — show the answers as a word bank (differentiation)
:no-lengths:    flag — hide the (n) letter counts after each clue
:no-save:       flag — don't remember students' answers in the browser
:letter-size:   small | medium | large | x-large, or a percentage such as 130
:hints:         hint letters filled in at random when the page opens: a number
                (e.g. 5) or a percentage of the squares (e.g. 20%)
:first-letters: flag — show the first letter of every word as a hint
:border:        flag — draw a border around the whole puzzle
:full-width:    flag — make the grid fill the width of the page (good on a projector)
:theme:         classic (default), ocean, forest, sunset, contrast or dark
:class:         extra CSS class(es) on the outer element

Enable it in conf.py (with docs/_ext on sys.path)::

    extensions = [..., "crossword.crossword"]
"""

from __future__ import annotations

import base64
import hashlib
import html
import json
import random
import re
from pathlib import Path

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util import logging
from sphinx.util.docutils import SphinxDirective

__version__ = "1.0.0"

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------
# Answer helpers
# --------------------------------------------------------------------------

def clean_answer(answer: str) -> str:
    """Letters/digits only, upper-case: 'Cell wall' -> 'CELLWALL'."""
    return re.sub(r"[^A-Z0-9]", "", answer.upper())


def enumeration(answer: str) -> str:
    """Letter count shown after a clue: 'cell wall' -> '4,4', 'X-ray' -> '1-3'."""
    out = []
    for part in re.split(r"(\s+|-)", answer.strip()):
        if not part:
            continue
        if part == "-":
            out.append("-")
        elif part.isspace():
            out.append(",")
        else:
            n = len(clean_answer(part))
            if n:
                out.append(str(n))
    text = "".join(out)
    text = re.sub(r"[,-]+$", "", re.sub(r"^[,-]+", "", text))
    return text or str(len(clean_answer(answer)))


# --------------------------------------------------------------------------
# Layout generator
# --------------------------------------------------------------------------

ACROSS, DOWN = "a", "d"
STEP = {ACROSS: (0, 1), DOWN: (1, 0)}


class _Grid:
    """A free-form (no black squares) crossword under construction."""

    def __init__(self) -> None:
        self.cells: dict[tuple[int, int], str] = {}
        self.dirs: dict[tuple[int, int], set[str]] = {}
        self.placed: list[tuple[int, int, int, str]] = []  # (word idx, r, c, dir)
        self.crossings = 0

    def bounds(self):
        rs = [r for r, _ in self.cells]
        cs = [c for _, c in self.cells]
        return min(rs), min(cs), max(rs), max(cs)

    def fits(self, word: str, r: int, c: int, d: str) -> int:
        """Number of crossings if `word` can go at (r, c, d), else -1."""
        dr, dc = STEP[d]
        n = len(word)
        if (r - dr, c - dc) in self.cells or (r + dr * n, c + dc * n) in self.cells:
            return -1
        crosses = 0
        for i, ch in enumerate(word):
            p = (r + dr * i, c + dc * i)
            if p in self.cells:
                if self.cells[p] != ch or d in self.dirs[p]:
                    return -1
                crosses += 1
            elif (p[0] + dc, p[1] + dr) in self.cells or (p[0] - dc, p[1] - dr) in self.cells:
                return -1  # would sit side-by-side with another word
        return crosses

    def place(self, idx: int, word: str, r: int, c: int, d: str, crosses: int) -> None:
        dr, dc = STEP[d]
        for i, ch in enumerate(word):
            p = (r + dr * i, c + dc * i)
            self.cells[p] = ch
            self.dirs.setdefault(p, set()).add(d)
        self.placed.append((idx, r, c, d))
        self.crossings += crosses

    def candidates(self, word: str):
        """Every legal position that crosses at least one placed letter."""
        seen = set()
        for (pr, pc), letter in self.cells.items():
            for i, ch in enumerate(word):
                if ch != letter:
                    continue
                for d in (ACROSS, DOWN):
                    if d in self.dirs[(pr, pc)]:
                        continue
                    dr, dc = STEP[d]
                    key = (pr - dr * i, pc - dc * i, d)
                    if key in seen:
                        continue
                    seen.add(key)
                    crosses = self.fits(word, *key)
                    if crosses > 0:
                        yield key, crosses


def _attempt(words: list[str], order: list[int], rng: random.Random) -> _Grid:
    grid = _Grid()
    first = order[0]
    grid.place(first, words[first], 0, 0, rng.choice((ACROSS, DOWN)), 0)
    pending = list(order[1:])
    progress = True
    while pending and progress:
        progress = False
        for idx in list(pending):
            word = words[idx]
            r0, c0, r1, c1 = grid.bounds()
            best, best_score = None, None
            for (r, c, d), crosses in grid.candidates(word):
                dr, dc = STEP[d]
                er, ec = r + dr * (len(word) - 1), c + dc * (len(word) - 1)
                h = max(r1, er) - min(r0, r) + 1
                w = max(c1, ec) - min(c0, c) + 1
                score = crosses * 8 - h * w * 0.15 - abs(h - w) * 1.5 + rng.random()
                if best_score is None or score > best_score:
                    best, best_score = (r, c, d, crosses), score
            if best:
                grid.place(idx, word, *best)
                pending.remove(idx)
                progress = True
    return grid


def generate_layout(words: list[str], seed: int, attempts: int = 250) -> _Grid:
    """Try many orderings and keep the most complete, compact, connected grid."""
    rng = random.Random(seed)
    best, best_key = None, None
    for n in range(attempts):
        if n == 0:
            order = sorted(range(len(words)), key=lambda i: -len(words[i]))
        else:
            order = sorted(range(len(words)), key=lambda i: -len(words[i]) - rng.random() * 6)
        grid = _attempt(words, order, rng)
        r0, c0, r1, c1 = grid.bounds()
        h, w = r1 - r0 + 1, c1 - c0 + 1
        key = (len(grid.placed), grid.crossings * 3 - h * w * 0.1 - abs(h - w) * 2)
        if best_key is None or key > best_key:
            best, best_key = grid, key
    return best


def build_puzzle(entries: list[dict], seed: int) -> dict:
    """Turn [{'answer','clue','enum'}...] into the JSON the browser renders."""
    words = [e["answer"] for e in entries]
    grid = generate_layout(words, seed)
    r0, c0, r1, c1 = grid.bounds()

    starts = sorted({(r - r0, c - c0) for _, r, c, _ in grid.placed})
    numbers = {pos: i + 1 for i, pos in enumerate(starts)}

    placed_words = []
    for idx, r, c, d in grid.placed:
        pos = (r - r0, c - c0)
        e = entries[idx]
        placed_words.append({
            "n": numbers[pos],
            "dir": "across" if d == ACROSS else "down",
            "r": pos[0],
            "c": pos[1],
            "answer": e["answer"],
            "label": re.sub(r"\s+", " ", e["raw"].upper()),
            "clue": e["clue"],
            "enum": e["enum"],
        })
    placed_words.sort(key=lambda w: (w["dir"] != "across", w["n"]))

    placed_idx = {idx for idx, *_ in grid.placed}
    unplaced = [entries[i]["raw"] for i in range(len(entries)) if i not in placed_idx]
    return {
        "rows": r1 - r0 + 1,
        "cols": c1 - c0 + 1,
        "words": placed_words,
        "unplaced": unplaced,
    }


# --------------------------------------------------------------------------
# Option parsers
# --------------------------------------------------------------------------

THEMES = ("classic", "ocean", "forest", "sunset", "contrast", "dark")

LETTER_SIZES = {"small": 85, "medium": 100, "large": 125, "x-large": 150, "xlarge": 150}


def letter_size(value):
    """'large' -> 125, '130' / '130%' -> 130 (limited to 70-170)."""
    text = (value or "").strip().lower()
    if text in LETTER_SIZES:
        return LETTER_SIZES[text]
    try:
        n = int(text.rstrip("%"))
    except ValueError:
        raise ValueError("use small, medium, large, x-large or a percentage like 130")
    return max(70, min(170, n))


def hint_amount(value):
    """'5' -> {'count': 5}; '20%' -> {'percent': 20}."""
    text = (value or "").strip()
    try:
        if text.endswith("%"):
            return {"percent": max(0, min(50, int(text[:-1])))}
        return {"count": max(0, int(text))}
    except ValueError:
        raise ValueError("use a number of letters (e.g. 5) or a percentage (e.g. 20%)")


# --------------------------------------------------------------------------
# Docutils node + directive
# --------------------------------------------------------------------------

class crossword_node(nodes.General, nodes.Element):
    pass


def visit_crossword_html(self, node):
    classes = " ".join(["crossword"] + node["classes"])
    payload = base64.b64encode(json.dumps(node["data"]).encode("utf-8")).decode("ascii")
    self.body.append(
        f'<div class="{html.escape(classes)}" id="{html.escape(node["xw_id"])}" '
        f'data-xw="{payload}">'
        '<noscript><p class="xw-noscript">This crossword needs JavaScript.</p></noscript>'
        "</div>\n"
    )
    raise nodes.SkipNode


def skip_node(self, node):
    raise nodes.SkipNode


class CrosswordDirective(SphinxDirective):
    has_content = True
    optional_arguments = 1
    final_argument_whitespace = True
    option_spec = {
        "id": directives.unchanged,
        "seed": directives.nonnegative_int,
        "wordbank": directives.flag,
        "no-lengths": directives.flag,
        "no-save": directives.flag,
        "words": directives.positive_int,
        "letter-size": letter_size,
        "hints": hint_amount,
        "border": directives.flag,
        "full-width": directives.flag,
        "first-letters": directives.flag,
        "theme": lambda v: directives.choice(v, THEMES),
        "class": directives.class_option,
    }

    def run(self):
        entries, seen = [], set()
        for offset, line in enumerate(self.content):
            text = line.strip()
            if not text or text.startswith("#"):
                continue
            if "|" not in text:
                logger.warning(
                    "crossword: expected 'ANSWER | clue', got %r", text,
                    location=(self.env.docname, self.content_offset + offset + 1),
                )
                continue
            raw, clue = (part.strip() for part in text.split("|", 1))
            answer = clean_answer(raw)
            if len(answer) < 2 or not clue:
                logger.warning("crossword: skipping %r (answer too short or no clue)", text,
                               location=(self.env.docname, self.content_offset + offset + 1))
                continue
            if answer in seen:
                logger.warning("crossword: duplicate answer %r skipped", raw,
                               location=(self.env.docname, self.content_offset + offset + 1))
                continue
            seen.add(answer)
            entries.append({"raw": raw, "answer": answer, "clue": clue, "enum": enumeration(raw)})

        if len(entries) < 2:
            return [self.state_machine.reporter.warning(
                "crossword needs at least two 'ANSWER | clue' lines.", line=self.lineno)]

        if "seed" in self.options:
            seed = self.options["seed"]
        else:  # stable across builds (unlike Python's hash())
            digest = hashlib.md5("|".join(e["answer"] for e in entries).encode()).hexdigest()
            seed = int(digest[:8], 16)

        pick = self.options.get("words", 0)
        if pick and pick >= len(entries):
            pick = 0
        if not pick:
            # Whole list is used: check at build time that every word links in.
            layout = build_puzzle(entries, seed)
            if layout["unplaced"]:
                logger.warning(
                    "crossword: couldn't link %s into the grid — add words that share "
                    "letters with them.",
                    ", ".join(layout["unplaced"]), location=(self.env.docname, self.lineno),
                )

        serial = self.env.new_serialno("crossword")
        xw_id = self.options.get("id") or f"crossword-{self.env.docname.replace('/', '-')}-{serial}"
        # The browser lays out the grid (crossword.js), so it can redraw a new
        # pattern or a new selection of words when a student presses "New".
        words = [
            {"answer": e["answer"], "label": re.sub(r"\s+", " ", e["raw"].upper()),
             "clue": e["clue"], "enum": e["enum"]}
            for e in entries
        ]
        data = {
            "entries": words,
            "seed": seed,
            "pick": pick,
            "title": self.arguments[0] if self.arguments else "",
            "wordbank": "wordbank" in self.options,
            "lengths": "no-lengths" not in self.options,
            "save": "no-save" not in self.options,
            "letterScale": self.options.get("letter-size", 100),
            "hints": self.options.get("hints", {"count": 0}),
            "border": "border" in self.options,
            "theme": self.options.get("theme", "classic"),
            "fill": "full-width" in self.options,
            "firstLetters": "first-letters" in self.options,
            "key": hashlib.md5(json.dumps(words).encode()).hexdigest()[:10],
        }

        node = crossword_node()
        node["data"] = data
        node["xw_id"] = xw_id
        node["classes"] = self.options.get("class", [])
        self.set_source_info(node)
        return [node]


# --------------------------------------------------------------------------
# Setup
# --------------------------------------------------------------------------

def setup(app):
    app.add_node(
        crossword_node,
        html=(visit_crossword_html, None),
        latex=(skip_node, None),
        text=(skip_node, None),
        man=(skip_node, None),
        texinfo=(skip_node, None),
    )
    app.add_directive("crossword", CrosswordDirective)

    static_path = Path(__file__).parent / "_static"
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file("crossword.js", defer="defer")
    app.add_css_file("crossword.css")
    return {"version": __version__, "parallel_read_safe": True, "parallel_write_safe": True}
