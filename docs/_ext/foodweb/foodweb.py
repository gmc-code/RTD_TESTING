"""
foodweb directive
=================

Draws a food web: pictures in levels (producers at the bottom), with an
arrow from each organism to the organism that eats it. Arrows that skip a
level curve through the gaps between the pictures in the levels they pass.

Usage::

    .. foodweb:: Stringybark forest food web
       :images: Stringybark_forest/{name}.png
       :theme: forest

       Click beetle eats Native grass, Native cherry, Brown stringybark
       Quoll eats Dunnart, Ring-tailed possum, Click beetle
       Native grass → Snail → Magpie → Quoll
       Scale insect → Honeyeater, Thornbill

Each line is one of:

* ``Eater eats A, B, C``
* ``A, B → C → D`` a chain. Every name in one group is eaten by every name
  in the next group. ``->`` works too.
* ``A is eaten by B, C``
* a single name (an organism with no links yet)

Names match whatever the case. Anything in brackets is ignored, so
``Native cherry (fruit)`` is ``Native cherry``.

Pictures come from ``:images:``, with {name} replaced by the name with spaces
changed to underscores (the same as imagesequence). Without ``:images:`` the
organisms are drawn as name boxes.

Levels
------

By default each organism goes one level above the highest thing it eats, so
every arrow points up. A level never holds more than ``:max-per-level:``
pictures (default 5): extras are moved up a level.

To choose the levels yourself, list them top to bottom. The order in each
line is the order across the page::

       .. levels::

          Wedge-tailed eagle, Quoll
          Brown snake, Magpie
          ...
          Native grass, Native cherry, Brown stringybark

Options
-------

* ``:images:`` picture path with {name} in it.
* ``:theme:`` dark, light (default), auto, ocean, forest, sunset, contrast.
* ``:width:`` picture box width in px (default 140).
* ``:gap:`` space between levels in cm (default 2).
* ``:max-per-level:`` (default 5, 2 to 8).
* ``:apex:`` ``top`` puts every organism that nothing eats in the top level.
  ``auto`` (default) leaves them one level above their food.
* ``:level-labels:`` comma separated labels, bottom level first, e.g.
  ``Producers, Herbivores, ...`` or ``trophic``.
* ``:arrows:`` ``shown`` (default) or ``hidden`` (e.g. to print a sheet for
  students to draw the arrows on).
* ``:names:`` ``below`` (default, under the picture), ``overlay`` (on a
  band across the bottom of the picture, so the boxes are shorter) or
  ``hidden``.
* ``:mode:`` ``place`` (default: drag the pictures from a tray into the
  boxes of the web), ``explore`` (see what each organism eats) or ``trace``
  (build a food chain by clicking). Students can switch modes.
* ``:given:`` names of pictures that start in their boxes, e.g.
  ``Native grass, Wedge-tailed eagle``.
* ``:clues:`` what students are told about each organism's food while
  placing: ``both`` (default), ``table`` (a table of what each one eats),
  ``selected`` (what the picked-up picture eats) or ``none``. The text
  comes from the links, with any note in brackets, e.g.
  ``Honeyeater eats Native cherry (fruit)``. A ``.. clues::`` block with
  ``Name: text`` lines replaces the text for those organisms.
* ``:straighten:`` ``yes`` (default) slides pictures sideways, swaps
  neighbours and may widen the web a little so that as many arrows as
  possible are straight. ``no`` spaces the pictures evenly.

Saved positions
---------------

The straightening doesn't always find the best layout. Drag the pictures
where you want them (in Explore or Trace mode), press **Copy layout** and
paste the result into the directive. It is a ``.. levels::`` block and a
``.. positions::`` block::

       .. positions::

          Wedge-tailed eagle: 260
          Dingo: 520
          ...

Each number is how far the middle of the picture is from the left edge of
the web, in pixels. Pictures with a saved position stay exactly there;
any others are placed as usual. Saved positions suit the ``:width:`` they
were made with.
"""

import hashlib
import html
import json
import math
import posixpath
import re
from pathlib import Path
from urllib.parse import quote

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective
from sphinx.util.fileutil import copy_asset

try:
    import imagesize          # a Sphinx dependency
except ImportError:           # pragma: no cover
    imagesize = None


THEMES = ("dark", "light", "auto", "ocean", "forest", "sunset", "contrast")
SHOWN = ("shown", "hidden")
NAMES = ("below", "overlay", "hidden", "shown")   # shown = below
APEX = ("auto", "top")
MODES = ("place", "explore", "trace")

PX_PER_CM = 37.8
PAD = 5              # padding inside a card around the picture
NAME_FONT = 26       # px
NAME_LINE = 30       # px per line of name
OVER_FONT = 24       # px, names on a band over the picture (:names: overlay)
OVER_LINE = 27
LANE = 14            # width a passing arrow takes up in a level
MIN_GAP = 22         # smallest space between things in a level
MARGIN = 18
HEAD_LEN = 16
HEAD_HALF = 9
HEAD_GAP = 6         # space between an arrow's tip and the box it points to


# ---------------------------------------------------------------- nodes

class foodweb_node(nodes.General, nodes.Element):
    pass


def _short_hash(text, length=8):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:length]


def _width(argument):
    try:
        value = int(argument)
    except (TypeError, ValueError):
        raise ValueError("must be a whole number of pixels, e.g. 140")
    if not 60 <= value <= 400:
        raise ValueError("must be from 60 to 400")
    return value


def _gap(argument):
    try:
        value = float(argument)
    except (TypeError, ValueError):
        raise ValueError("must be a number of cm, e.g. 2")
    if not 0.8 <= value <= 6:
        raise ValueError("must be from 0.8 to 6 (cm)")
    return value


def _max_per_level(argument):
    try:
        value = int(argument)
    except (TypeError, ValueError):
        raise ValueError("must be a whole number")
    if not 2 <= value <= 8:
        raise ValueError("must be from 2 to 8")
    return value


def _ordinal(k):
    suffix = "th" if 10 <= k % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(k % 10, "th")
    return f"{k}{suffix}"


def _level_labels(argument):
    text = (argument or "").strip()
    if text.lower() == "trophic":
        return ["Producers"] + [f"{_ordinal(k)} consumers" for k in range(1, 20)]
    return [v.strip() for v in text.split(",")]


# ---------------------------------------------------------------- parsing

ARROW_SPLIT = re.compile(r"\s*(?:→|->|=>)\s*")
EATS = re.compile(r"^(.+?)\s+eats\s+(.+)$", re.I)
EATEN_BY = re.compile(r"^(.+?)\s+(?:is\s+|are\s+)?eaten\s+by\s+(.+)$", re.I)
LIST_MARK = re.compile(r"^(#\.|\d+[.)]|[-*])\s+")


def _clean(name):
    name = re.sub(r"\([^)]*\)", "", name)
    name = re.sub(r"\*\*|\*|``", "", name)
    return re.sub(r"\s+", " ", name).strip(" .;")


def _split_notes(text):
    """'A (fruit), B and C' -> [('A', 'fruit'), ('B', ''), ('C', '')].

    Splits on commas and 'and', but not inside brackets.
    """
    parts, depth, cur = [], 0, ""
    tokens = re.split(r"(\(|\)|,|\band\b)", text)
    for t in tokens:
        if t == "(":
            depth += 1
        elif t == ")":
            depth = max(0, depth - 1)
        if depth == 0 and t in (",", "and"):
            parts.append(cur)
            cur = ""
        else:
            cur += t
    parts.append(cur)
    out = []
    for part in parts:
        notes = re.findall(r"\(([^)]*)\)", part)
        name = _clean(part)
        if name:
            out.append((name, "; ".join(n.strip() for n in notes if n.strip())))
    return out


def _split_group(text):
    return [name for name, _note in _split_notes(text)]


class Web:
    """Organisms (in the order first named) and who-eats-whom links."""

    def __init__(self):
        self.names = []
        self.index = {}
        self.edges = []          # (eaten, eater)
        self.edge_set = set()
        self.notes = {}          # (eaten, eater) -> note in brackets, e.g. "fruit"
        self.clues = {}          # organism -> its own "what it eats" text
        self.positions = {}      # organism -> (saved x, lineno)

    def add(self, name):
        key = name.lower()
        if key not in self.index:
            self.index[key] = len(self.names)
            self.names.append(name)
        return self.index[key]

    def link(self, eaten, eater, note=""):
        a, b = self.add(eaten), self.add(eater)
        if a == b:
            return False
        if note and not self.notes.get((a, b)):
            self.notes[(a, b)] = note
        if (a, b) not in self.edge_set:
            self.edge_set.add((a, b))
            self.edges.append((a, b))
        return True


def parse_content(lines, warn):
    """Returns (web, levels or None). ``lines`` is [(text, lineno)]."""
    web = Web()
    levels = None
    in_levels = False
    in_clues = False
    in_pos = False
    levels_indent = None

    for raw, lineno in lines:
        if not raw.strip():
            continue
        stripped = raw.strip()
        indent = len(raw) - len(raw.lstrip())

        if re.match(r"^\.\.\s+levels::\s*$", stripped):
            in_levels, in_clues, in_pos, levels, levels_indent = True, False, False, [], indent
            continue
        if re.match(r"^\.\.\s+clues::\s*$", stripped):
            in_clues, in_levels, in_pos, levels_indent = True, False, False, indent
            continue
        if re.match(r"^\.\.\s+positions::\s*$", stripped):
            in_pos, in_levels, in_clues, levels_indent = True, False, False, indent
            continue
        if in_pos:
            if indent > levels_indent:
                m = re.match(r"^(.+?)\s*:\s*(-?\d+(?:\.\d+)?)\s*$", stripped)
                if m:
                    web.positions[_clean(m.group(1)).lower()] = (float(m.group(2)), lineno)
                else:
                    warn(f"foodweb positions: '{stripped}' should be Name: number", lineno)
                continue
            in_pos = False
        if in_clues:
            if indent > levels_indent:
                if ":" in stripped:
                    name, text = stripped.split(":", 1)
                    web.clues[_clean(name).lower()] = (text.strip(), lineno)
                else:
                    warn(f"foodweb clues: '{stripped}' should be Name: what it eats", lineno)
                continue
            in_clues = False
        if in_levels:
            if indent > levels_indent:
                row = _split_group(LIST_MARK.sub("", stripped))
                if row:
                    levels.append((row, lineno))
                continue
            in_levels = False
        if stripped.startswith(".."):
            continue      # a comment

        line = LIST_MARK.sub("", stripped)
        if ARROW_SPLIT.search(line):
            groups = [_split_notes(g) for g in ARROW_SPLIT.split(line)]
            groups = [g for g in groups if g]
            if len(groups) < 2:
                warn(f"foodweb: '{line}' needs a name on each side of →", lineno)
                continue
            for lower, upper in zip(groups, groups[1:]):
                for a, note in lower:
                    for b, _n in upper:
                        web.link(a, b, note)
            continue
        m = EATEN_BY.match(line)
        if m:
            eaten = _clean(m.group(1))
            for b in _split_group(m.group(2)):
                web.link(eaten, b)
            continue
        m = EATS.match(line)
        if m:
            eater = _clean(m.group(1))
            web.add(eater)
            for a, note in _split_notes(m.group(2)):
                web.link(a, eater, note)
            continue
        name = _clean(line)
        if name:
            web.add(name)
    return web, levels


# ---------------------------------------------------------------- levels

def _longest_path_levels(n, edges, lower_bound):
    """Level of each organism: one above the highest thing it eats.

    Links that would make a loop are left out of the calculation.
    """
    food = [[] for _ in range(n)]
    for a, b in edges:
        food[b].append(a)
    level = [None] * n
    state = [0] * n                       # 0 new, 1 visiting, 2 done
    loops = set()

    def visit(v):
        stack = [(v, iter(food[v]))]
        state[v] = 1
        while stack:
            u, it = stack[-1]
            advanced = False
            for a in it:
                if state[a] == 1:
                    loops.add((a, u))
                    continue
                if state[a] == 0:
                    state[a] = 1
                    stack.append((a, iter(food[a])))
                    advanced = True
                    break
            if advanced:
                continue
            stack.pop()
            state[u] = 2
            best = lower_bound.get(u, 0)
            for a in food[u]:
                if (a, u) in loops or level[a] is None:
                    continue
                best = max(best, level[a] + 1)
            level[u] = best

    for v in range(n):
        if state[v] == 0:
            visit(v)
    return level, loops


def auto_levels(web, max_per, apex):
    n = len(web.names)
    eaters = [[] for _ in range(n)]
    for a, b in web.edges:
        eaters[a].append(b)
    bound = {}
    level, loops = _longest_path_levels(n, web.edges, bound)
    for _ in range(400):
        if apex == "top":
            top = max(level) if level else 0
            for v in range(n):
                if not eaters[v] and web.edges and any(b == v for _a, b in web.edges):
                    if level[v] < top:
                        bound[v] = max(bound.get(v, 0), top)
            level, loops = _longest_path_levels(n, web.edges, bound)
        counts = {}
        for v in range(n):
            counts.setdefault(level[v], []).append(v)
        full = [lv for lv, vs in sorted(counts.items()) if len(vs) > max_per]
        if not full:
            break
        lv = full[0]

        def slack(v):
            ups = [level[b] for b in eaters[v] if (v, b) not in loops]
            return (min(ups) - level[v] - 1) if ups else 99

        # Move the organism with the most room above it (top predators first),
        # then the one with fewest arrows, so the web changes the least.
        candidates = sorted(counts[lv], key=lambda v: (-slack(v), len(eaters[v]), -v))
        v = candidates[0]
        bound[v] = level[v] + 1
        level, loops = _longest_path_levels(n, web.edges, bound)
    return level, loops


# ---------------------------------------------------------------- ordering

def _crossings(upper_pos, segs):
    """Crossings among segments between two levels. segs: [(lowerpos, upperpos)]."""
    count = 0
    s = sorted(segs)
    for i in range(len(s)):
        for j in range(i + 1, len(s)):
            if s[i][0] < s[j][0] and s[i][1] > s[j][1]:
                count += 1
    return count


def order_levels(rows, segs_between, fixed=None, rounds=24):
    """Barycentre ordering to keep crossings down.

    rows: list (bottom first) of lists of item keys.
    segs_between[l]: list of (item at l, item at l+1).
    fixed: {level: [real keys in the order given]} or None.
    """
    nlev = len(rows)
    below = {}
    above = {}
    for l in range(nlev - 1):
        for lo, up in segs_between[l]:
            above.setdefault(lo, []).append(up)
            below.setdefault(up, []).append(lo)

    def positions():
        return {k: i for row in rows for i, k in enumerate(row)}

    def total():
        pos = positions()
        return sum(_crossings(None, [(pos[a], pos[b]) for a, b in segs_between[l]])
                   for l in range(nlev - 1))

    def impose_fixed(l, row):
        if not fixed or l not in fixed:
            return row
        want = [k for k in fixed[l] if k in row]
        it = iter(want)
        return [next(it) if k in fixed[l] else k for k in row]

    def sweep(l, neighbours):
        pos = positions()
        row = rows[l]
        keyed = []
        for i, k in enumerate(row):
            ns = neighbours.get(k, [])
            bc = sum(pos[x] for x in ns) / len(ns) if ns else float(i)
            keyed.append((bc, i, k))
        keyed.sort()
        rows[l] = impose_fixed(l, [k for _b, _i, k in keyed])

    def transpose():
        improved = True
        guard = 0
        while improved and guard < 20:
            improved = False
            guard += 1
            for l in range(nlev):
                row = rows[l]
                for i in range(len(row) - 1):
                    a, b = row[i], row[i + 1]
                    if fixed and l in fixed and a in fixed[l] and b in fixed[l]:
                        continue
                    before = local(l)
                    row[i], row[i + 1] = b, a
                    if local(l) < before:
                        improved = True
                    else:
                        row[i], row[i + 1] = a, b

    def local(l):
        pos = positions()
        c = 0
        if l > 0:
            c += _crossings(None, [(pos[a], pos[b]) for a, b in segs_between[l - 1]])
        if l < nlev - 1:
            c += _crossings(None, [(pos[a], pos[b]) for a, b in segs_between[l]])
        return c

    for l in range(nlev):
        rows[l] = impose_fixed(l, rows[l])
    best = [list(r) for r in rows]
    best_c = total()
    for r in range(rounds):
        if r % 2 == 0:
            for l in range(1, nlev):
                sweep(l, below)
        else:
            for l in range(nlev - 2, -1, -1):
                sweep(l, above)
        transpose()
        c = total()
        if c < best_c:
            best_c, best = c, [list(x) for x in rows]
        if best_c == 0:
            break
    rows[:] = best
    return best_c



# ---------------------------------------------------------------- straightening

CLEAR = 8            # room a straight arrow leaves round a picture


def _port_offsets(m, cw):
    span = min(cw * 0.72, (m - 1) * 15)
    return [0.0] if m == 1 else [-span / 2 + span * i / (m - 1) for i in range(m)]


def _straight_ports(xs, edges):
    """Port x for each edge if every arrow aims straight at the other card."""
    outs, ins = {}, {}
    for k, (a, b) in enumerate(edges):
        outs.setdefault(a, []).append(k)
        ins.setdefault(b, []).append(k)
    return outs, ins


def _seg_hits_card(x0, y0, x1, y1, cx, cy, cw, ch):
    """Does the line (x0,y0)-(x1,y1) (y0 below y1) pass through this card?"""
    top, bot = cy - CLEAR, cy + ch + CLEAR
    if not (y1 < bot and y0 > top):
        return False
    xa = x0 + (x1 - x0) * (y0 - min(bot, y0)) / (y0 - y1)
    xb = x0 + (x1 - x0) * (y0 - max(top, y1)) / (y0 - y1)
    lo, hi = min(xa, xb), max(xa, xb)
    return hi > cx - cw / 2 - CLEAR and lo < cx + cw / 2 + CLEAR


def _segs_cross(p, q):
    (ax, ay, bx, by), (cx, cy, dx, dy) = p, q
    d1 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax)
    d2 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax)
    d3 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx)
    d4 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx)
    return (d1 > 0) != (d2 > 0) and (d3 > 0) != (d4 > 0)


def optimise_positions(xs, real_rows, level, edges, cw, ch, row_top, lo, hi, sep):
    """Slide pictures sideways (keeping their order) so that as many arrows
    as possible can be straight lines, without adding crossings.

    xs: {organism: centre x}, changed in place. real_rows: organisms in each
    level, left to right. edges: upward (eaten, eater) pairs.
    """
    import time
    start = time.time()
    xs0 = dict(xs)
    outs, ins = _straight_ports(xs, edges)
    by_level = {}
    for v in xs:
        by_level.setdefault(level[v], []).append(v)
    skipping = [k for k, (a, b) in enumerate(edges) if level[b] - level[a] > 1]

    def ports():
        px = {}
        for v, ks in outs.items():
            ks = sorted(ks, key=lambda k: (xs[edges[k][1]], k))
            for k, off in zip(ks, _port_offsets(len(ks), cw)):
                px[(k, 0)] = xs[v] + off
        for v, ks in ins.items():
            ks = sorted(ks, key=lambda k: (xs[edges[k][0]], k))
            for k, off in zip(ks, _port_offsets(len(ks), cw)):
                px[(k, 1)] = xs[v] + off
        return px

    def segments(px):
        return [(px[(k, 0)], row_top(level[a]), px[(k, 1)], row_top(level[b]) + ch)
                for k, (a, b) in enumerate(edges)]

    def cost():
        px = ports()
        seg = segments(px)
        curved = 0
        for k in skipping:
            a, b = edges[k]
            x0, y0, x1, y1 = seg[k]
            for l in range(level[a] + 1, level[b]):
                if any(_seg_hits_card(x0, y0, x1, y1, xs[v], row_top(l), cw, ch)
                       for v in by_level.get(l, [])):
                    curved += 1
                    break
        cross = 0
        for i in range(len(seg)):
            ai, bi = edges[i]
            for j in range(i + 1, len(seg)):
                aj, bj = edges[j]
                if ai in (aj, bj) or bi in (aj, bj):
                    continue
                if _segs_cross(seg[i], seg[j]):
                    cross += 1
        disp = sum(abs(xs[v] - xs0[v]) for v in xs)
        return curved * 100 + cross * 4 + disp * 0.02, curved

    def shift(row, i, delta):
        """Move row[i] by delta, pushing neighbours along if they're in the way."""
        new = {row[i]: xs[row[i]] + delta}
        if delta > 0:
            prev = new[row[i]]
            for j in range(i + 1, len(row)):
                want = max(xs[row[j]], prev + sep)
                if want == xs[row[j]]:
                    break
                new[row[j]] = want
                prev = want
        else:
            prev = new[row[i]]
            for j in range(i - 1, -1, -1):
                want = min(xs[row[j]], prev - sep)
                if want == xs[row[j]]:
                    break
                new[row[j]] = want
                prev = want
        if any(x < lo - 0.01 or x > hi + 0.01 for x in new.values()):
            return None
        return new

    best, curved = cost()
    if not skipping:
        return 0, best
    deltas = (-90, -45, -20, -8, 8, 20, 45, 90)
    for _pass in range(14):
        improved = False
        for row in real_rows:
            for i, v in enumerate(row):
                for delta in deltas:
                    new = shift(row, i, delta)
                    if not new:
                        continue
                    old = {u: xs[u] for u in new}
                    xs.update(new)
                    c, cv = cost()
                    if c < best - 1e-6:
                        best, curved, improved = c, cv, True
                    else:
                        xs.update(old)
                if time.time() - start > 20:
                    return curved, best
            # Try swapping each pair of neighbours (a new order can free a line).
            for i in range(len(row) - 1):
                u, w = row[i], row[i + 1]
                xu, xw = xs[u], xs[w]
                row[i], row[i + 1] = w, u
                xs[u], xs[w] = xw, xu
                c, cv = cost()
                if c < best - 1e-6:
                    best, curved, improved = c, cv, True
                else:
                    row[i], row[i + 1] = u, w
                    xs[u], xs[w] = xu, xw
        if not improved or curved == 0 and _pass > 3:
            break
    return curved, best


# ---------------------------------------------------------------- geometry

def _wrap(name, max_chars):
    words = name.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if len(trial) <= max_chars or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def _fmt(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


def build_layout(web, level, loops, opts):
    """Positions of every card and the path of every arrow."""
    n = len(web.names)
    cw = opts["width"]
    ratio = opts["ratio"]
    pic_h = round((cw - 2 * PAD) / ratio) if opts["has_images"] else 0
    overlay = opts.get("names_overlay") and opts["has_images"]
    if overlay:
        max_chars = max(6, int((cw - 2 * PAD - 4) / (OVER_FONT * 0.55)))
    else:
        max_chars = max(6, int((cw - 6) / (NAME_FONT * 0.56)))
    wrapped = [_wrap(nm, max_chars) for nm in web.names]
    name_lines = max(len(w) for w in wrapped) if wrapped else 1
    if not opts["has_images"]:
        name_lines = max(name_lines, 2)
    label_h = name_lines * NAME_LINE + 6
    if overlay:
        # Names sit on a band over the bottom of the picture: no space below.
        ch = PAD + pic_h + PAD
    else:
        ch = PAD + pic_h + label_h if opts["has_images"] else label_h + 2 * PAD
    gap = opts["gap_cm"] * PX_PER_CM

    nlev = max(level) + 1 if level else 1
    up_edges, other_edges = [], []
    for e, (a, b) in enumerate(web.edges):
        if level[b] > level[a] and (a, b) not in loops:
            up_edges.append(e)
        else:
            other_edges.append(e)

    # Items: ("n", v) for organisms, ("d", e, l) for an arrow passing level l.
    rows = [[] for _ in range(nlev)]
    for v in sorted(range(n), key=lambda v: opts["order_hint"].get(v, v)):
        rows[level[v]].append(("n", v))
    chains = {}
    segs = [[] for _ in range(max(nlev - 1, 0))]
    for e in up_edges:
        a, b = web.edges[e]
        chain = [("n", a)]
        for l in range(level[a] + 1, level[b]):
            d = ("d", e, l)
            rows[l].append(d)
            chain.append(d)
        chain.append(("n", b))
        chains[e] = chain
        for k in range(len(chain) - 1):
            lo_level = level[a] + k
            segs[lo_level].append((chain[k], chain[k + 1]))

    fixed = opts.get("fixed")
    crossings = order_levels(rows, segs, fixed=fixed)

    # Width: every level must fit with at least MIN_GAP between things.
    def row_need(row):
        w = sum(cw if k[0] == "n" else LANE for k in row)
        return w + (len(row) + 1) * MIN_GAP

    left = opts["label_margin"]
    inner_w = max([row_need(r) for r in rows] + [opts["max_per"] * cw + (opts["max_per"] + 1) * 34])
    total_w = left + inner_w + 2 * MARGIN

    head_room = HEAD_LEN + 4
    top_y = MARGIN + head_room

    def row_top(l):
        return top_y + (nlev - 1 - l) * (ch + gap)

    # Slide pictures sideways (and swap neighbours) so as many arrows as
    # possible are straight. A slightly wider web is tried too, and kept
    # only if it straightens more arrows.
    def spaced(width):
        xo = {}
        for row in rows:
            used = sum(cw if k[0] == "n" else LANE for k in row)
            g = (width - used) / (len(row) + 1) if row else 0
            x = left + MARGIN + g
            for k in row:
                w = cw if k[0] == "n" else LANE
                xo[k] = x + w / 2
                x += w + g
        return xo

    up_pairs = [web.edges[e] for e in up_edges]
    base_rows = [list(r) for r in rows]
    best_trial = None
    widths = [inner_w]
    if opts.get("straighten", True) and any(len(chains[e]) > 2 for e in up_edges):
        widths += [inner_w + cw * 0.6, inner_w + cw * 1.2]
    import random as _random
    rng = _random.Random(len(web.names) * 1000 + len(web.edges))
    pinned = opts.get("positions") or {}
    all_pinned = n > 0 and all(v in pinned for v in range(n))
    if all_pinned:
        widths = [inner_w]
    restarts = 5 if opts.get("straighten", True) and not all_pinned else 0
    trials = [(w, 0) for w in widths] + [(w, r + 1) for w in widths for r in range(restarts)
                                         if len(widths) > 1]
    t_start = __import__("time").time()
    for width, restart in trials:
        if restart and __import__("time").time() - t_start > 8:
            break
        trial_rows = [list(r) for r in base_rows]
        xo = spaced(width)
        real_rows = [[k[1] for k in row if k[0] == "n"] for row in trial_rows]
        if restart:
            # Start from a shuffled spacing to get out of a rut.
            for row in real_rows:
                if len(row) < 2:
                    continue
                room = width - len(row) * (cw + 2 * CLEAR + 10)
                cuts = sorted(rng.uniform(0, room) for _ in row)
                x = left + MARGIN
                for v, c in zip(row, cuts):
                    xo[("n", v)] = x + c + cw / 2
                    x += cw + 2 * CLEAR + 10
        xs = {v: xo[("n", v)] for v in range(n)}
        if opts.get("straighten", True) and not all_pinned:
            curved_n, score = optimise_positions(
                xs, real_rows, level, up_pairs, cw, ch, row_top,
                left + MARGIN + cw / 2, left + MARGIN + width - cw / 2, cw + 2 * CLEAR + 10)
        else:
            curved_n, score = 0, 0
        key = (curved_n, width, score)
        if best_trial is None or key < best_trial[0]:
            best_trial = (key, width, xs, real_rows, trial_rows)
    _key, inner_w, xs, real_rows, trial_rows = best_trial
    origin = left + MARGIN
    if pinned:
        for v, px in pinned.items():
            xs[v] = origin + px
        # Keep every picture inside the web, and widen it if a saved
        # position is further right than the web is wide.
        lo = min(xs.values()) - cw / 2
        if lo < origin:
            shift = origin - lo
            for v in xs:
                xs[v] += shift
        inner_w = max(inner_w, max(xs.values()) + cw / 2 - origin)
        # Rows in left-to-right order, so arrows that must curve find the gaps.
        real_rows = [sorted(row, key=lambda v: xs[v]) for row in real_rows]
        sp = spaced(inner_w)
        for l, row in enumerate(trial_rows):
            def _k(k):
                return xs[k[1]] if k[0] == "n" else sp.get(k, 0)
            trial_rows[l] = sorted(row, key=_k)
    total_w = left + inner_w + 2 * MARGIN
    # Put swapped organisms back into the rows (passing arrows keep their slots).
    for l, row in enumerate(trial_rows):
        it = iter(real_rows[l])
        rows[l] = [next(it) if k[0] == "n" else k for k in row]
        rows[l] = [("n", k) if isinstance(k, int) else k for k in rows[l]]
    x_of = spaced(inner_w)
    for v in range(n):
        x_of[("n", v)] = xs[v]

    def place_dummies(curved):
        """Arrows that must curve go through the gaps, spread evenly."""
        for row in rows:
            left_edge = left + MARGIN
            waiting = []
            for k in row + [None]:
                if k is not None and k[0] == "d":
                    if k[1] in curved:
                        waiting.append(k)
                    continue
                right_edge = (x_of[k] - cw / 2) if k is not None else left + MARGIN + inner_w
                m = len(waiting)
                for j, d in enumerate(waiting):
                    x_of[d] = left_edge + (right_edge - left_edge) * (j + 1) / (m + 1)
                waiting = []
                if k is not None:
                    left_edge = x_of[k] + cw / 2

    total_h = row_top(0) + ch + MARGIN + 4

    cards = []
    for v in range(n):
        cx = x_of[("n", v)]
        cards.append({
            "i": v,
            "name": web.names[v],
            "lines": wrapped[v],
            "x": cx - cw / 2,
            "y": row_top(level[v]),
            "w": cw,
            "h": ch,
            "level": level[v],
        })

    # Ports: arrows leave the top of the eaten and arrive at the bottom of the
    # eater, spread out and sorted so they don't cross next to the card.
    port_x = {}

    def assign_ports(straight):
        out_ports = {v: [] for v in range(n)}
        in_ports = {v: [] for v in range(n)}
        for e in up_edges:
            ch_ = chains[e]
            a, b = web.edges[e]
            if e in straight:      # aim at the other card
                out_ports[a].append((x_of[ch_[-1]], e))
                in_ports[b].append((x_of[ch_[0]], e))
            else:                  # aim at the first gap it goes through
                out_ports[a].append((x_of[ch_[1]], e))
                in_ports[b].append((x_of[ch_[-2]], e))

        def spread(v, plist, side):
            plist.sort()
            m = len(plist)
            cx = x_of[("n", v)]
            span = min(cw * 0.72, (m - 1) * 15)
            for i, (_x, e) in enumerate(plist):
                off = 0 if m == 1 else -span / 2 + span * i / (m - 1)
                port_x[(e, side)] = cx + off

        for v in range(n):
            spread(v, out_ports[v], "out")
            spread(v, in_ports[v], "in")

    # An arrow that skips levels is straight if a straight line misses every
    # picture in between (with a little room to spare). Otherwise it curves
    # through the gaps.
    def line_is_clear(e):
        a, b = web.edges[e]
        x0, y0 = port_x[(e, "out")], row_top(level[a])
        x1, y1 = port_x[(e, "in")], row_top(level[b]) + ch
        for c in cards:
            if c["i"] in (a, b) or not level[a] < c["level"] < level[b]:
                continue
            if _seg_hits_card(x0, y0, x1, y1, c["x"] + cw / 2, c["y"], cw, ch):
                return False
        return True

    skipping = [e for e in up_edges if len(chains[e]) > 2]
    straight = set(up_edges)
    assign_ports(straight)
    straight = set(e for e in up_edges if len(chains[e]) == 2 or line_is_clear(e))
    for _ in range(4):
        place_dummies(set(up_edges) - straight)
        assign_ports(straight)
        bad = [e for e in skipping if e in straight and not line_is_clear(e)]
        if not bad:
            break
        straight.difference_update(bad)

    def vcurve(x1, y1, x2, y2):
        k = (y1 - y2) * 0.5
        return f"C {_fmt(x1)} {_fmt(y1 - k)} {_fmt(x2)} {_fmt(y2 + k)} {_fmt(x2)} {_fmt(y2)}"

    arrows = []
    for e in up_edges:
        a, b = web.edges[e]
        chain = chains[e]
        x0 = port_x[(e, "out")]
        y0 = row_top(level[a])
        d = [f"M {_fmt(x0)} {_fmt(y0)}"]
        cx_, cy_ = x0, y0
        for k in ([] if e in straight else chain[1:-1]):
            l = k[2]
            dx = x_of[k]
            yb = row_top(l) + ch
            yt = row_top(l)
            d.append(vcurve(cx_, cy_, dx, yb))
            d.append(f"L {_fmt(dx)} {_fmt(yt)}")
            cx_, cy_ = dx, yt
        x1 = port_x[(e, "in")]
        tip = row_top(level[b]) + ch + HEAD_GAP
        if e in straight:
            # A straight arrow, with the head lined up with it.
            dx, dy = x1 - x0, tip - y0
            length = math.hypot(dx, dy) or 1.0
            ux, uy = dx / length, dy / length          # unit vector towards the tip
            bx, by = x1 - ux * HEAD_LEN, tip - uy * HEAD_LEN
            px, py = -uy * HEAD_HALF, ux * HEAD_HALF   # sideways
            d.append(f"L {_fmt(x1 - ux * (HEAD_LEN - 1))} {_fmt(tip - uy * (HEAD_LEN - 1))}")
            head = (f"M {_fmt(x1)} {_fmt(tip)} L {_fmt(bx + px)} {_fmt(by + py)} "
                    f"L {_fmt(bx - px)} {_fmt(by - py)} Z")
            arrows.append({"a": a, "b": b, "d": " ".join(d), "head": head})
            continue
        y1 = tip + HEAD_LEN - 1
        d.append(vcurve(cx_, cy_, x1, y1))
        head = (f"M {_fmt(x1)} {_fmt(tip)} L {_fmt(x1 - HEAD_HALF)} {_fmt(tip + HEAD_LEN)} "
                f"L {_fmt(x1 + HEAD_HALF)} {_fmt(tip + HEAD_LEN)} Z")
        arrows.append({"a": a, "b": b, "d": " ".join(d), "head": head})

    for e in other_edges:
        a, b = web.edges[e]
        A, B = cards[a], cards[b]
        ax, bx = A["x"] + cw / 2, B["x"] + cw / 2
        if level[a] == level[b]:
            y = A["y"]
            lift = min(gap * 0.8, 60)
            tip = y - HEAD_GAP
            y1 = tip - HEAD_LEN + 1
            d = (f"M {_fmt(ax)} {_fmt(y)} C {_fmt(ax)} {_fmt(y - lift)} {_fmt(bx)} "
                 f"{_fmt(y - lift)} {_fmt(bx)} {_fmt(y1)}")
            head = (f"M {_fmt(bx)} {_fmt(tip)} L {_fmt(bx - HEAD_HALF)} {_fmt(tip - HEAD_LEN)} "
                    f"L {_fmt(bx + HEAD_HALF)} {_fmt(tip - HEAD_LEN)} Z")
        else:   # pointing down (levels chosen by hand, or a loop)
            y0 = A["y"] + ch
            tip = B["y"] - HEAD_GAP
            y1 = tip - HEAD_LEN + 1
            k = (y1 - y0) * 0.5
            d = (f"M {_fmt(ax)} {_fmt(y0)} C {_fmt(ax)} {_fmt(y0 + k)} {_fmt(bx)} "
                 f"{_fmt(y1 - k)} {_fmt(bx)} {_fmt(y1)}")
            head = (f"M {_fmt(bx)} {_fmt(tip)} L {_fmt(bx - HEAD_HALF)} {_fmt(tip - HEAD_LEN)} "
                    f"L {_fmt(bx + HEAD_HALF)} {_fmt(tip - HEAD_LEN)} Z")
        arrows.append({"a": a, "b": b, "d": d, "head": head, "odd": True})

    level_rows = [{"level": l, "y": row_top(l), "h": ch} for l in range(nlev)]
    return {
        "w": round(total_w),
        "h": round(total_h),
        "cards": cards,
        "arrows": arrows,
        "rows": level_rows,
        "pic_h": pic_h,
        "overlay": bool(overlay),
        "crossings": crossings,
        "x_origin": left + MARGIN,
    }


# ---------------------------------------------------------------- HTML

def _img_uri(translator, uri):
    images = getattr(translator.builder, "images", {})
    if uri in images:
        return posixpath.join(translator.builder.imgpath, quote(images[uri]))
    return uri


def visit_foodweb_html(self, node):
    lay = node["layout"]
    cfg = node["config"]
    title = node.get("title", "")
    esc_title = html.escape(title)
    uid = node["uid"]

    uris = {}
    for img in node.findall(nodes.image):
        uris[img["fw_index"]] = _img_uri(self, img["uri"])

    out = []
    w, h = lay["w"], lay["h"]
    out.append(
        f'<svg class="fw-svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
        f'style="max-width:{w}px" role="img" aria-labelledby="{uid}-t" '
        f'preserveAspectRatio="xMidYMid meet">'
        f'<title id="{uid}-t">{esc_title or "Food web"}</title>'
    )

    labels = cfg.get("levelLabels") or []
    if labels:
        out.append('<g class="fw-levels">')
        for row in lay["rows"]:
            l = row["level"]
            if l < len(labels) and labels[l]:
                y = row["y"] + row["h"] / 2
                words = _wrap(labels[l], 11)
                y0 = y - (len(words) - 1) * 10.5
                out.append(f'<text class="fw-level-label" x="{MARGIN}" y="{_fmt(y0)}">')
                for i, wd in enumerate(words):
                    dy = "0" if i == 0 else "21"
                    out.append(f'<tspan x="{MARGIN}" dy="{dy}">{html.escape(wd)}</tspan>')
                out.append("</text>")
        out.append("</g>")

    out.append('<g class="fw-edges">')
    for k, ar in enumerate(lay["arrows"]):
        cls = "fw-edge fw-odd" if ar.get("odd") else "fw-edge"
        out.append(
            f'<g class="{cls}" data-a="{ar["a"]}" data-b="{ar["b"]}">'
            f'<path class="fw-halo" d="{ar["d"]}"/>'
            f'<path class="fw-line" d="{ar["d"]}"/>'
            f'<path class="fw-head" d="{ar["head"]}"/></g>'
        )
    out.append("</g>")

    out.append('<g class="fw-cards">')
    pic_h = lay["pic_h"]
    for c in lay["cards"]:
        i = c["i"]
        x, y, cw, chh = c["x"], c["y"], c["w"], c["h"]
        name = html.escape(c["name"])
        out.append(
            f'<g class="fw-node" data-i="{i}" tabindex="0" role="button" '
            f'aria-label="{name}">'
            f'<rect class="fw-card" x="{_fmt(x)}" y="{_fmt(y)}" width="{cw}" height="{_fmt(chh)}" rx="8"/>'
        )
        if i in uris and pic_h:
            out.append(
                f'<image class="fw-pic" href="{html.escape(uris[i], quote=True)}" '
                f'x="{_fmt(x + PAD)}" y="{_fmt(y + PAD)}" width="{cw - 2 * PAD}" height="{pic_h}" '
                f'preserveAspectRatio="xMidYMid meet"/>'
            )
            # Magnifier in the top right corner: shows the picture full size.
            # Same as imagesequence's enlarge button: 1.7rem square, 0.25rem in
            # from the top right corner, 0.8rem emoji (at 16px per rem).
            # foodweb.js scales it about the corner (data-ax/ay) so it stays
            # that size on screen however big the web is drawn.
            zs, zin = 27.2, 4
            ax, ay = x + cw, y
            zx, zy = ax - zin - zs, ay + zin
            out.append(
                f'<g class="fw-zoom" role="button" aria-label="Enlarge picture" '
                f'data-ax="{_fmt(ax)}" data-ay="{_fmt(ay)}">'
                f'<title>Enlarge</title>'
                f'<rect x="{_fmt(zx)}" y="{_fmt(zy)}" width="{zs}" height="{zs}" rx="6"/>'
                f'<text x="{_fmt(zx + zs / 2)}" y="{_fmt(zy + zs / 2 + 0.5)}">&#128269;</text>'
                f'</g>'
            )
            if lay.get("overlay"):
                nl = len(c["lines"])
                band = nl * OVER_LINE + 5
                by = y + PAD + pic_h - band
                out.append(
                    f'<rect class="fw-nameband" x="{_fmt(x + PAD)}" y="{_fmt(by)}" '
                    f'width="{cw - 2 * PAD}" height="{band}"/>'
                )
                ty = by + OVER_LINE - 2
            else:
                ty = y + PAD + pic_h + NAME_LINE - 1
        else:
            nl = len(c["lines"])
            ty = y + chh / 2 - (nl - 1) * NAME_LINE / 2 + NAME_FONT * 0.35
        on_pic = lay.get("overlay") and i in uris and pic_h
        line_h = OVER_LINE if on_pic else NAME_LINE
        cls = "fw-name fw-name-on" if on_pic else "fw-name"
        out.append(f'<text class="{cls}" x="{_fmt(x + cw / 2)}" y="{_fmt(ty)}">')
        font = OVER_FONT if on_pic else NAME_FONT
        room = cw - 2 * PAD - 4
        for k, line in enumerate(c["lines"]):
            dy = "0" if k == 0 else str(line_h)
            # A single long word that can't wrap is squeezed to fit the box.
            fit = ""
            if len(line) * font * 0.56 > room:
                fit = f' textLength="{_fmt(room)}" lengthAdjust="spacingAndGlyphs"'
            out.append(f'<tspan x="{_fmt(x + cw / 2)}" dy="{dy}"{fit}>{html.escape(line)}</tspan>')
        out.append("</text></g>")
    out.append("</g></svg>")

    payload = json.dumps(cfg, ensure_ascii=False).replace("</", "<\\/")
    classes = [f"foodweb fw-theme-{cfg['theme']}"]
    if cfg["arrows"] == "hidden":
        classes.append("fw-no-arrows")
    if cfg["names"] == "hidden":
        classes.append("fw-no-names")
    self.body.append(f"""
<div class="{' '.join(classes)}" id="{uid}" aria-label="Food web: {esc_title}">
  <script type="application/json" class="fw-data">{payload}</script>
  <div class="fw-head">
    <div class="fw-title">{esc_title or "Food web"}</div>
    <div class="fw-sub">Each arrow points from the food to the organism that eats it.</div>
  </div>
  <div class="fw-board">{''.join(out)}</div>
</div>
""")
    raise nodes.SkipNode


def skip_node(self, node):
    raise nodes.SkipNode


# ---------------------------------------------------------------- directive

class FoodWebDirective(SphinxDirective):
    has_content = True
    required_arguments = 0
    optional_arguments = 1
    final_argument_whitespace = True

    option_spec = {
        "images": directives.unchanged,
        "theme": lambda a: directives.choice(a, THEMES),
        "width": _width,
        "gap": _gap,
        "max-per-level": _max_per_level,
        "apex": lambda a: directives.choice(a, APEX),
        "level-labels": _level_labels,
        "arrows": lambda a: directives.choice(a, SHOWN),
        "names": lambda a: directives.choice(a, NAMES),
        "mode": lambda a: directives.choice(a, MODES),
        "straighten": lambda a: directives.choice(a, ("yes", "no")),
        "given": directives.unchanged,
        "clues": lambda a: directives.choice(a, ("both", "table", "selected", "none")),
    }

    def warn(self, msg, line=None):
        self.state_machine.reporter.warning(msg, line=line or self.lineno)

    def run(self):
        node = foodweb_node()
        node.source, node.line = self.get_source_info()
        title = self.arguments[0] if self.arguments else ""
        lines = [(text, self.content_offset + i + 1) for i, text in enumerate(self.content)]
        web, levels_spec = parse_content(lines, self.warn)

        if len(web.names) < 2 or not web.edges:
            return [self.state_machine.reporter.warning(
                "foodweb: needs at least one link, e.g. 'Snail eats Native grass' "
                "or 'Native grass → Snail'.", line=self.lineno)]

        max_per = self.options.get("max-per-level", 5)
        apex = self.options.get("apex", "auto")
        fixed = None
        order_hint = {}

        if levels_spec:
            n = len(web.names)
            level = [None] * n
            fixed = {}
            nrows = len(levels_spec)
            for r, (row, lineno) in enumerate(levels_spec):
                lv = nrows - 1 - r          # written top to bottom
                keys = []
                for name in row:
                    key = name.lower()
                    if key not in web.index:
                        self.warn(f"foodweb levels: '{name}' isn't in any link, so it was added "
                                  "on its own.", lineno)
                        web.add(name)
                        level.append(None)
                    v = web.index[key]
                    if level[v] is not None:
                        self.warn(f"foodweb levels: '{name}' is in more than one level.", lineno)
                        continue
                    level[v] = lv
                    keys.append(("n", v))
                fixed[lv] = keys
                if len(keys) > 8:
                    self.warn(f"foodweb levels: {len(keys)} organisms in one level is a lot; "
                              "they may be squashed.", lineno)
            missing = [web.names[v] for v in range(len(web.names)) if level[v] is None]
            if missing:
                self.warn("foodweb levels: not in any level, so put in the bottom one: "
                          + ", ".join(missing))
                for v in range(len(web.names)):
                    if level[v] is None:
                        level[v] = 0
                        fixed.setdefault(0, []).append(("n", v))
            loops = set()
            for v in range(len(web.names)):
                order_hint[v] = v
        else:
            level, loops = auto_levels(web, max_per, apex)
            for a, b in loops:
                self.warn(f"foodweb: {web.names[a]} → {web.names[b]} makes a loop, so that "
                          "arrow points down.")
            # Push levels down so the lowest one is 0.
            low = min(level)
            level = [l - low for l in level]

        # Pictures
        pattern = (self.options.get("images") or "").strip()
        if pattern and "{name}" not in pattern:
            self.warn("foodweb: :images: needs {name} in it, e.g. :images: pics/{name}.png")
            pattern = ""
        ratios = []
        has_images = bool(pattern)
        missing = []
        for v, name in enumerate(web.names):
            if not pattern:
                break
            uri = pattern.replace("{name}", name.replace(" ", "_"))
            _rel, abspath = self.env.relfn2path(uri, self.env.docname)
            if not Path(abspath).exists():
                missing.append(f"{name} ({uri})")
                continue
            if imagesize is not None:
                try:
                    iw, ih = imagesize.get(abspath)
                    if iw > 0 and ih > 0:
                        ratios.append(iw / ih)
                except Exception:
                    pass
            img = nodes.image(uri=uri, alt=name)
            img["fw_index"] = v
            img.source, img.line = node.source, self.lineno
            node += img
        for m in missing:
            self.warn(f"foodweb: no picture for {m}")
        ratios.sort()
        ratio = ratios[len(ratios) // 2] if ratios else 4 / 3
        ratio = min(max(ratio, 0.6), 3.2)

        labels = self.options.get("level-labels") or []
        opts = {
            "width": self.options.get("width", 140),
            "ratio": ratio,
            "has_images": has_images,
            "gap_cm": self.options.get("gap", 2.0),
            "max_per": max_per,
            "fixed": fixed,
            "order_hint": order_hint,
            "label_margin": 124 if labels else 0,
            "straighten": self.options.get("straighten", "yes") == "yes",
            "names_overlay": self.options.get("names") == "overlay",
            "positions": {},
        }
        for key, (px, lineno) in web.positions.items():
            if key in web.index:
                opts["positions"][web.index[key]] = px
            else:
                self.warn(f"foodweb positions: '{key}' isn't in the web.", lineno)
        layout = build_layout(web, level, loops, opts)

        # What each organism eats, for the clues.
        clue_text = []
        food_of = {v: [] for v in range(len(web.names))}
        for a, b in web.edges:
            food_of[b].append(a)
        for v, name in enumerate(web.names):
            own = web.clues.pop(name.lower(), None)
            if own:
                clue_text.append(own[0])
            elif food_of[v]:
                parts = []
                for a in food_of[v]:
                    note = web.notes.get((a, v), "")
                    parts.append(web.names[a] + (f" ({note})" if note else ""))
                clue_text.append(", ".join(parts[:-1]) + (" and " if len(parts) > 1 else "") + parts[-1])
            else:
                clue_text.append("")
        for key, (_t, lineno) in web.clues.items():
            self.warn(f"foodweb clues: '{key}' isn't in the web.", lineno)

        given = []
        for name in _split_group(self.options.get("given", "")):
            key = name.lower()
            if key in web.index:
                given.append(web.index[key])
            else:
                self.warn(f"foodweb: :given: '{name}' isn't in the web.")

        uid = "fw-" + _short_hash(f"{self.env.docname}::{title}::{self.lineno}")
        node["uid"] = uid
        node["title"] = title
        node["layout"] = layout
        node["config"] = {
            "title": title,
            "names": self.options.get("names", "shown"),
            "arrows": self.options.get("arrows", "shown"),
            "theme": self.options.get("theme", "light"),
            "mode": self.options.get("mode", "place"),
            "given": given,
            "clues": self.options.get("clues", "both"),
            "clueText": clue_text,
            "levelLabels": labels,
            "organisms": web.names,
            "links": [list(e) for e in web.edges],
            "levels": level,
            "xOrigin": layout["x_origin"],
        }
        return [node]


# ---------------------------------------------------------------- setup

def copy_static_assets(app, exception):
    """Copies static assets to the build output directory."""
    if app.builder.name in ("html", "dirhtml", "singlehtml") and exception is None:
        ext_static = Path(__file__).parent / "_static"
        out_static = Path(app.outdir) / "_static"
        if ext_static.exists():
            try:
                copy_asset(str(ext_static), str(out_static), force=True)
            except TypeError:
                copy_asset(str(ext_static), str(out_static))


def setup(app):
    app.add_node(
        foodweb_node,
        html=(visit_foodweb_html, None),
        latex=(skip_node, None),
        text=(skip_node, None),
        man=(skip_node, None),
        texinfo=(skip_node, None),
    )
    app.add_directive("foodweb", FoodWebDirective)
    app.add_js_file("foodweb.js")
    app.add_css_file("foodweb.css")
    app.connect("build-finished", copy_static_assets)
    return {
        "version": "1.0",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
