"""
wordsearch — a Sphinx directive for interactive, printable word search puzzles.

Usage
-----
.. wordsearch:: Cells and Organelles
   :size: 12
   :directions: across, down, diagonal
   :seed: 42
   :answers: print
   :timer: up
   :clues:

   NUCLEUS        : Control centre of the cell
   MITOCHONDRIA   : Powerhouse of the cell
   CELL WALL      : Rigid outer layer of a plant cell

Each content line is a word (or multi-word term), optionally followed by
" : clue". Spaces, hyphens and other punctuation are removed in the grid but
kept in the word list.

Options
-------
:size:        Grid size. N gives an N x N square; WxH gives a rectangle W columns
              wide and H rows tall (e.g. 15x10). Default: chosen automatically.
              If a word will not fit, the grid grows and a warning is logged.
:directions:  Comma-separated list from: across, down, diagonal, backwards, all.
              Presets: easy (across, down), medium (across, down, diagonal),
              hard (all). Default: medium.
:seed:        Any text/number. Same seed + same words = same puzzle every build.
              Default: derived from the words (stable). Use "random" for a new
              puzzle on every page load and each time Reset is pressed.
:answers:     button (default) - "Show answers" button on the page
              hidden           - no Show answers button
              print            - button, plus an answer key printed on a
                                 separate page
:timer:       up       - count-up stopwatch
              <minutes> - countdown, e.g. 5 or 2.5
              Omit for no timer.
:clues:       Flag. Show the clues instead of the words; the word is revealed
              next to its clue when found.
:no-letter-highlight:
              Flag. Turns off letter highlighting. (Default: pressing a
              letter key highlights every cell with that letter; the same
              key again or Esc clears it.)
:no-overlap:  Flag. Words never cross or share letters. (Default: words may
              cross where their letters match.) The grid grows if needed.
:fill:        random (default) - random A-Z filler letters
              words            - filler letters drawn from the puzzle words
                                 (harder: decoys look like real fragments)
:sort:        Order of the word/clue list:
              none (default) - the order you wrote them
              alpha          - alphabetical
              shortest       - by length, shortest first (alias: length)
              longest        - by length, longest first
              random         - shuffled; reshuffled on each page load
                               and each time Reset is pressed
:case:        upper (default) | lower
:instructions: Text shown above the puzzle.
:theme:       white (default) | light
:color:       Instruction colour (same names as wordjumble).
:style:       filled (default) | border | plain
"""

import hashlib
import html
import json
import random
import re
import string
from pathlib import Path

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util import logging
from sphinx.util.docutils import SphinxDirective

logger = logging.getLogger(__name__)

DIR_VECTORS = {
    "across": [(0, 1)],
    "down": [(1, 0)],
    "diagonal": [(1, 1), (-1, 1)],
}
PRESETS = {
    "easy": "across, down",
    "medium": "across, down, diagonal",
    "hard": "all",
}
VALID_COLORS = [
    "red", "participant", "green", "process", "blue", "circumstance",
    "conj", "part", "theme", "rheme", "dependent", "embedded",
    "relative", "projected",
]


class wordsearch_node(nodes.General, nodes.Element):
    pass


def visit_wordsearch_html(self, node):
    self.body.append(node["html"])
    raise nodes.SkipNode


def depart_wordsearch_html(self, node):
    pass


def _skip(self, node):
    raise nodes.SkipNode


# --------------------------------------------------------------------------
# Puzzle generation
# --------------------------------------------------------------------------
def parse_directions(text):
    text = (text or "medium").strip().lower()
    text = PRESETS.get(text, text)
    parts = {p.strip() for p in re.split(r"[,\s]+", text) if p.strip()}
    if "all" in parts:
        parts = {"across", "down", "diagonal", "backwards"}
    vectors = []
    for name in ("across", "down", "diagonal"):
        if name in parts:
            vectors.extend(DIR_VECTORS[name])
    if not vectors:
        vectors = DIR_VECTORS["across"] + DIR_VECTORS["down"]
    if "backwards" in parts:
        vectors += [(-dr, -dc) for dr, dc in vectors]
    return vectors, sorted(parts)


def try_place(words, rows, cols, vectors, rng, no_overlap=False):
    """Place all words in a rows x cols grid. Returns (grid, placements) or None.

    With no_overlap=True, no grid cell is shared by two words.
    """
    grid = [[None] * cols for _ in range(rows)]
    placements = {}
    order = sorted(range(len(words)), key=lambda i: -len(words[i]))
    for i in order:
        w = words[i]
        options = []
        for dr, dc in vectors:
            for r in range(rows):
                for c in range(cols):
                    er, ec = r + dr * (len(w) - 1), c + dc * (len(w) - 1)
                    if not (0 <= er < rows and 0 <= ec < cols):
                        continue
                    overlap = 0
                    ok = True
                    for k, ch in enumerate(w):
                        cur = grid[r + dr * k][c + dc * k]
                        if cur is None:
                            continue
                        if no_overlap or cur != ch:
                            ok = False
                            break
                        overlap += 1
                    if ok and overlap < len(w):
                        options.append((overlap, rng.random(), r, c, dr, dc))
        if not options:
            return None
        # Mostly random, with a mild preference for crossings.
        rng.shuffle(options)
        if not no_overlap and rng.random() < 0.35:
            options.sort(key=lambda o: -o[0])
        _, _, r, c, dr, dc = options[0]
        cells = []
        for k, ch in enumerate(w):
            rr, cc = r + dr * k, c + dc * k
            grid[rr][cc] = ch
            cells.append([rr, cc])
        placements[i] = cells
    return grid, placements


def parse_size(arg):
    """'12' -> (12, 12); '15x10' -> (10 rows, 15 cols)."""
    text = (arg or "").strip().lower().replace("\u00d7", "x").replace("*", "x")
    m = re.fullmatch(r"(\d+)\s*(?:x\s*(\d+))?", text)
    if not m:
        raise ValueError(
            "size must be a number (e.g. 12) or columns x rows (e.g. 15x10)")
    cols = int(m.group(1))
    rows = int(m.group(2)) if m.group(2) else cols
    if rows < 2 or cols < 2:
        raise ValueError("size must be at least 2")
    return rows, cols


def build_puzzle(words, req, vectors, rng, no_overlap=False):
    """req is None (automatic square) or (rows, cols).
    Returns (rows, cols, grid, placements)."""
    longest = max(len(w) for w in words)
    total = sum(len(w) for w in words)
    if req is None:
        factor = 2.8 if no_overlap else 2.2
        n = max(longest, 8, int((total * factor) ** 0.5 + 0.999))
        rows = cols = n
    else:
        rows, cols = req
    # The longest word must fit along the longer side at least.
    # Grow only the long side so a wide grid stays wide (a tall one stays tall).
    if max(rows, cols) < longest:
        if cols >= rows:
            cols = longest
        else:
            rows = longest
    if no_overlap:
        # Every letter needs its own cell.
        while rows * cols < total:
            rows, cols = rows + 1, cols + 1
    while True:
        for _ in range(40):
            result = try_place(words, rows, cols, vectors, rng, no_overlap)
            if result:
                return rows, cols, result[0], result[1]
        rows, cols = rows + 1, cols + 1
        if max(rows, cols) > 40:
            raise ValueError("Could not fit the words into a grid up to 40 wide.")


# --------------------------------------------------------------------------
# Directive
# --------------------------------------------------------------------------
def choice(values):
    def check(arg):
        return directives.choice((arg or "").strip().lower(), values)
    return check


SORT_ALIASES = {
    "none": "none",
    "alpha": "alpha", "alphabetical": "alpha",
    "shortest": "shortest", "length": "shortest", "length-asc": "shortest",
    "ascending": "shortest",
    "longest": "longest", "length-desc": "longest", "descending": "longest",
    "random": "random", "shuffle": "random",
}


def sort_choice(arg):
    key = (arg or "").strip().lower()
    if key not in SORT_ALIASES:
        raise ValueError(
            "sort must be one of: none, alpha, shortest, longest, random")
    return SORT_ALIASES[key]


class WordSearchDirective(SphinxDirective):
    has_content = True
    required_arguments = 0
    optional_arguments = 1
    final_argument_whitespace = True

    option_spec = {
        "size": directives.unchanged,
        "directions": directives.unchanged,
        "seed": directives.unchanged,
        "answers": choice(("button", "hidden", "print", "shown")),
        "timer": directives.unchanged,
        "clues": directives.flag,
        "no-overlap": directives.flag,
        "no-letter-highlight": directives.flag,
        "fill": choice(("random", "words")),
        "sort": sort_choice,
        "case": choice(("upper", "lower")),
        "instructions": directives.unchanged,
        "theme": directives.unchanged,
        "color": directives.unchanged,
        "style": directives.unchanged,
    }

    def run(self):
        title = self.arguments[0] if self.arguments else ""
        entries = []
        for raw in self.content:
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if ":" in line:
                word, clue = line.split(":", 1)
            else:
                word, clue = line, ""
            word, clue = word.strip(), clue.strip()
            grid_form = re.sub(r"[^A-Za-z0-9]", "", word).upper()
            if not grid_form:
                continue
            entries.append({"display": word, "clue": clue, "grid": grid_form})

        if not entries:
            return [self.state_machine.reporter.warning(
                "wordsearch: no words given.", line=self.lineno)]

        use_clues = "clues" in self.options
        if use_clues:
            missing = [e["display"] for e in entries if not e["clue"]]
            if missing:
                logger.warning(
                    "wordsearch: :clues: is set but these words have no clue: %s",
                    ", ".join(missing), location=(self.env.docname, self.lineno))

        vectors, dir_names = parse_directions(self.options.get("directions"))

        seed_opt = (self.options.get("seed") or "").strip()
        if seed_opt.lower() == "random":
            rng = random.Random()
        else:
            seed_src = seed_opt or "|".join(e["grid"] for e in entries) + "|" + ",".join(dir_names)
            rng = random.Random(int(hashlib.md5(seed_src.encode()).hexdigest(), 16))

        words = [e["grid"] for e in entries]
        try:
            req_size = parse_size(self.options["size"]) if "size" in self.options else None
            rows, cols, grid, placements = build_puzzle(
                words, req_size, vectors, rng, "no-overlap" in self.options)
        except ValueError as exc:
            return [self.state_machine.reporter.error(
                f"wordsearch: {exc}", line=self.lineno)]
        if req_size and (rows, cols) != req_size:
            logger.warning(
                "wordsearch: grid grown from %dx%d to %dx%d so every word fits.",
                req_size[1], req_size[0], cols, rows,
                location=(self.env.docname, self.lineno))

        if self.options.get("fill", "random") == "words":
            pool = "".join(words)
        else:
            pool = string.ascii_uppercase
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] is None:
                    grid[r][c] = rng.choice(pool)

        lower = self.options.get("case", "upper") == "lower"

        # Timer
        timer_opt = (self.options.get("timer") or "").strip().lower()
        timer_attr = ""
        if timer_opt:
            if timer_opt in ("up", "stopwatch", "count-up"):
                timer_attr = "up"
            else:
                try:
                    secs = int(round(float(timer_opt) * 60))
                    timer_attr = str(max(secs, 1))
                except ValueError:
                    logger.warning(
                        "wordsearch: :timer: should be 'up' or minutes; got %r",
                        timer_opt, location=(self.env.docname, self.lineno))

        answers = self.options.get("answers", "button")

        # Styling (matches wordjumble conventions)
        theme = (self.options.get("theme") or "white").strip().lower()
        theme = theme if theme in ("white", "light") else "white"
        color = (self.options.get("color") or "blue").strip().lower()
        color = color if color in VALID_COLORS else "blue"
        style = (self.options.get("style") or "filled").strip().lower()
        style = style if style in ("plain", "border", "filled") else "filled"

        default_instr = (
            "Find each word described by the clues. Drag across the letters, "
            "or tap the first and last letter."
            if use_clues else
            "Find the hidden words. Drag across the letters, or tap the first "
            "and last letter."
        )
        instructions = self.options.get("instructions")
        print_instr = None
        if instructions is None:
            instructions = default_instr
            print_instr = (
                "Answer each clue, then find and circle the word in the grid."
                if use_clues else
                "Find and circle each word in the grid."
            )

        # Word list order
        idx_order = list(range(len(entries)))
        sort_mode = self.options.get("sort", "none")
        alpha_key = lambda i: entries[i]["display"].lower()
        if sort_mode == "alpha":
            idx_order.sort(key=alpha_key)
        elif sort_mode in ("shortest", "longest"):
            # Length = letters in the grid (spaces/punctuation not counted);
            # equal lengths are listed alphabetically.
            sign = 1 if sort_mode == "shortest" else -1
            idx_order.sort(key=lambda i: (sign * len(entries[i]["grid"]), alpha_key(i)))
        elif sort_mode == "random":
            # Build-time shuffle; the browser reshuffles on load and on Reset.
            rng.shuffle(idx_order)

        data = {
            "rows": rows,
            "cols": cols,
            "shuffleList": sort_mode == "random",
            "keyHints": "no-letter-highlight" not in self.options,
            "words": [
                {"id": i, "cells": placements[i]} for i in range(len(entries))
            ],
        }
        if seed_opt.lower() == "random":
            # Everything the browser needs to build a fresh puzzle on Reset.
            data["regen"] = {
                "letters": words,
                "vectors": [list(v) for v in vectors],
                "noOverlap": "no-overlap" in self.options,
                "fill": self.options.get("fill", "random"),
                "lower": lower,
            }

        node = wordsearch_node()
        node["html"] = self.render_html(
            title, instructions, entries, idx_order, grid, rows, cols, placements,
            lower, use_clues, answers, timer_attr, theme, color, style, data,
            dir_names, print_instr,
        )
        return [node]

    # ------------------------------------------------------------------
    def render_grid(self, grid, lower, extra_class=""):
        rows, cols = len(grid), len(grid[0])
        out = [f'<div class="ws-grid {extra_class}" style="--ws-cols:{cols};--ws-rows:{rows}">']
        for r in range(rows):
            for c in range(cols):
                ch = grid[r][c].lower() if lower else grid[r][c]
                out.append(
                    f'<span class="ws-cell" data-r="{r}" data-c="{c}">{ch}</span>')
        out.append("</div>")
        return "".join(out)

    @staticmethod
    def svg_line(cells, cls, extra=""):
        (r0, c0), (r1, c1) = cells[0], cells[-1]
        return (f'<line class="{cls}" {extra} x1="{c0 + 0.5}" y1="{r0 + 0.5}" '
                f'x2="{c1 + 0.5}" y2="{r1 + 0.5}" />')

    def render_html(self, title, instructions, entries, idx_order, grid, rows, cols,
                    placements, lower, use_clues, answers, timer_attr, theme,
                    color, style, data, dir_names, print_instr=None):
        esc = html.escape
        classes = " ".join([
            "wordsearch-block", f"theme-{theme}", f"ws-color-{color}",
            f"ws-style-{style}", "ws-mode-clues" if use_clues else "ws-mode-words",
        ])
        attrs = (f' data-answers="{answers}"'
                 f' data-timer="{esc(timer_attr)}"'
                 f' data-puzzle="{esc(json.dumps(data, separators=(",", ":")))}"')
        out = [f'<div class="{classes}"{attrs}>']
        if title:
            out.append(f'<div class="ws-title">{esc(title)}</div>')
        if print_instr:
            out.append(
                f'<div class="ws-instructions"><span class="ws-screen-only">{esc(instructions)}</span>'
                f'<span class="ws-print-only">{esc(print_instr)}</span></div>')
        else:
            out.append(f'<div class="ws-instructions">{esc(instructions)}</div>')
        out.append('<div class="ws-toolbar"></div>')

        out.append('<div class="ws-body">')
        # Grid + live overlay
        out.append(f'<div class="ws-grid-wrap" style="--ws-cols:{cols};--ws-rows:{rows}">')
        out.append(self.render_grid(grid, lower))
        out.append(
            f'<svg class="ws-overlay" viewBox="0 0 {cols} {rows}" '
            f'preserveAspectRatio="none" aria-hidden="true"></svg>')
        out.append("</div>")

        # Word / clue list
        list_label = "Clues" if use_clues else "Words to find"
        out.append(f'<div class="ws-list-wrap"><div class="ws-list-title">{list_label}'
                   f' <span class="ws-count">(0 / {len(entries)})</span></div>')
        out.append('<ol class="ws-list">' if use_clues else '<ul class="ws-list">')
        for n, i in enumerate(idx_order):
            e = entries[i]
            letters = len(e["grid"])
            if use_clues:
                clue = e["clue"] or "(no clue)"
                out.append(
                    f'<li class="ws-item" data-id="{i}">'
                    f'<span class="ws-clue">{esc(clue)}</span> '
                    f'<span class="ws-len">({letters})</span>'
                    f'<span class="ws-reveal">{esc(e["display"])}</span>'
                    f'<span class="ws-blank"></span></li>')
            else:
                out.append(
                    f'<li class="ws-item" data-id="{i}">'
                    f'<span class="ws-word">{esc(e["display"])}</span></li>')
        out.append("</ol>" if use_clues else "</ul>")
        out.append("</div>")  # list-wrap
        out.append("</div>")  # body

        out.append('<div class="ws-status" role="status" aria-live="polite"></div>')

        # Printed answer key (separate page)
        if answers == "print":
            out.append('<div class="ws-key">')
            out.append(f'<div class="ws-title">{esc(title or "Word search")} — Answers</div>')
            out.append(f'<div class="ws-grid-wrap" style="--ws-cols:{cols};--ws-rows:{rows}">')
            out.append(self.render_grid(grid, lower, "ws-grid-key"))
            lines = "".join(self.svg_line(placements[i], "ws-key-line")
                            for i in range(len(entries)))
            out.append(
                f'<svg class="ws-overlay ws-overlay-key" viewBox="0 0 {cols} {rows}" '
                f'preserveAspectRatio="none" aria-hidden="true">{lines}</svg>')
            out.append("</div>")
            if use_clues:
                out.append('<ol class="ws-key-list">')
                for i in idx_order:
                    e = entries[i]
                    out.append(f'<li>{esc(e["clue"])} — <strong>{esc(e["display"])}</strong></li>')
                out.append("</ol>")
            out.append("</div>")

        out.append("</div>")
        return "".join(out)


def setup(app):
    app.add_node(
        wordsearch_node,
        html=(visit_wordsearch_html, depart_wordsearch_html),
        latex=(_skip, None), text=(_skip, None), man=(_skip, None),
        texinfo=(_skip, None),
    )
    app.add_directive("wordsearch", WordSearchDirective)

    static_path = Path(__file__).parent / "_static"
    if str(static_path) not in app.config.html_static_path:
        app.config.html_static_path.append(str(static_path))

    app.add_js_file("wordsearch.js")
    app.add_css_file("wordsearch.css")

    return {
        "version": "1.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
