"""
imagesequence directive
=======================

Students put a set of pictures (e.g. the steps of a science prac) into the
right order by dragging them into numbered boxes joined by arrows.

Usage::

    .. imagesequence:: Yeast and temperature
       :arrows: snake
       :numbering: numbers
       :captions: below
       :columns: 3
       :fullscreen-columns: 5
       :tray-columns: 4
       :fullscreen-tray-columns: 2
       :fullscreen-tray-width: 30
       :feedback: marks
       :fixed: 1
       :theme: light
       :print: worksheet
       :answer-key:
       :start: tray

       .. step:: /_static/images/yeast/step1.png

          Mark a line 4 cm from the bottom of each tube

       .. step:: /_static/images/yeast/step2.png
          :label: Day 1

          Label the tubes RT and P

       .. step:: /_static/images/extra.png
          :distractor:

          Heat the tube over a Bunsen burner

Write the steps in the correct order: the directive shuffles them.

``:columns:`` is the number of boxes in a row on the page (1 to 6).
``:fullscreen-columns:`` (1 to 8) is the number in a row in full screen,
where there is more room. Without it, full screen uses ``:columns:``.

The pictures still to place (the tray) normally fit as many in a row as
there is room for. To make them bigger or smaller, set the number in a
row: ``:tray-columns:`` (1 to 8) on the page and
``:fullscreen-tray-columns:`` (1 to 6) in full screen, where the tray is
a strip down the right. ``:fullscreen-tray-width:`` (15 to 50) is how
much of the screen's width that strip takes, as a percentage (normally
24).

``step`` options:

* ``:label:`` text shown on that step's box instead of its number.
* ``:alt:`` alt text for the image (defaults to the caption).
* ``:distractor:`` a picture that doesn't belong in the sequence. It is
  mixed in with the others and the right answer is to leave it out.

The caption is the step's content (any inline RST works).

Several sequences, one picked at random
---------------------------------------

Put each sequence in a ``.. chain::`` group. One is shown at a time, and
the New chain button picks another::

    .. imagesequence:: Food chains
       :pick: random

       .. chain:: Optional name

          .. step:: pics/grass.png
          .. step:: pics/snail.png

       .. chain::

          .. step:: ...

For food chains, write one chain per line instead. Each name is turned
into a picture path with ``:images:`` ({name} is the name with spaces
changed to underscores), and the name becomes the caption::

    .. imagesequence:: Random food chain
       :images: Stringybark_forest/{name}.png
       :distractors: 1

       .. chains::

          Native grass → Snail → Magpie → Quoll
          Native cherry → Honeyeater → Quoll

Options for several sequences:

* ``:pick:`` ``random`` (default, every chain is used before any repeats)
  or ``order`` (in the order written).
* ``:distractors:`` add this many pictures that don't belong. They come
  from ``:extras:`` if it is set, otherwise from the other chains.
* ``:extras:`` names (comma separated, pictures from ``:images:``) that
  are never in a chain, e.g. ``Fungus, Bacteria, Tick``. Safer than
  pictures from other chains, which can sometimes fit.
* ``:print-chains:`` ``shown`` (default, the chain on screen) or ``all``.
* ``:next-label:`` text on the button (default "New chain").

Box labels by position (any imagesequence)::

    :labels: trophic                      (Producer, 1st consumer, 2nd consumer, ...)
    :labels: Producer, Herbivore, Carnivore

A step's own ``:label:`` still wins. Boxes past the end of the list use
the normal numbering.

Clues: ``:clues: selected`` shows a box above the pictures. Tapping,
dragging or pointing at a picture shows its caption there (with its name,
for pictures made from names). Good with ``:captions: hidden`` and a
``.. captions::`` block saying what each organism eats. ``:clue-prompt:``
is the text shown before a picture is picked.

Captions for named pictures (``.. chains::`` and ``:extras:``). Without
this the caption is just the name. Inline RST works::

    .. captions::

       Native grass: **Native grass** makes its own food from sunlight
       Snail: **Snail** eats grass
"""

import hashlib
import html
import json
import random
import re
from pathlib import Path

from docutils import nodes
from docutils.parsers.rst import directives
from sphinx.util.docutils import SphinxDirective
from sphinx.util.fileutil import copy_asset


THEMES = ("dark", "light", "auto", "ocean", "forest", "sunset", "contrast")
ARROWS = ("snake", "snake-up", "right", "down", "up", "none")
NUMBERING = ("numbers", "letters", "none")
CAPTIONS = ("below", "overlay", "hidden", "reveal", "slot")
FEEDBACK = ("marks", "count")
PRINT = ("worksheet", "cards", "none")
PICK = ("random", "order")
PRINT_CHAINS = ("shown", "all")
START = ("tray", "boxes")
CLUES = ("none", "selected")


# ---------------------------------------------------------------- nodes

class imagesequence_node(nodes.General, nodes.Element):
    pass


class isq_step_node(nodes.General, nodes.Element):
    pass


class isq_caption_node(nodes.General, nodes.Element):
    pass


class isq_chain_node(nodes.General, nodes.Element):
    pass


class isq_captions_node(nodes.General, nodes.Element):
    """Holds name -> caption lines until the imagesequence uses them."""
    pass


def _short_hash(text, length=10):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:length]


def _columns(argument):
    try:
        value = int(argument)
    except (TypeError, ValueError):
        raise ValueError("must be a whole number from 1 to 6")
    if not 1 <= value <= 6:
        raise ValueError("must be from 1 to 6")
    return value


def _full_columns(argument):
    try:
        value = int(argument)
    except (TypeError, ValueError):
        raise ValueError("must be a whole number from 1 to 8")
    if not 1 <= value <= 8:
        raise ValueError("must be from 1 to 8")
    return value


def _whole(low, high):
    """Option converter: a whole number from low to high."""
    def convert(argument):
        try:
            value = int(str(argument).strip().rstrip("%"))
        except (TypeError, ValueError):
            raise ValueError(f"must be a whole number from {low} to {high}")
        if not low <= value <= high:
            raise ValueError(f"must be from {low} to {high}")
        return value
    return convert


def _ordinal(k):
    suffix = "th" if 10 <= k % 100 <= 20 else {1: "st", 2: "nd", 3: "rd"}.get(k % 10, "th")
    return f"{k}{suffix}"


def _labels(argument):
    text = (argument or "").strip()
    if text.lower() == "trophic":
        return ["Producer"] + [f"{_ordinal(k)} consumer" for k in range(1, 20)]
    return [v.strip() for v in text.split(",")]


def _int_list(argument):
    try:
        return [int(v) for v in str(argument).replace(";", ",").split(",") if v.strip()]
    except ValueError:
        raise ValueError("must be step numbers separated by commas, e.g. 1 or 1, 9")


# ---------------------------------------------------------------- HTML

def visit_imagesequence_html(self, node):
    title = node.get("title", "")
    esc_title = html.escape(title)
    payload = json.dumps(node["config"], ensure_ascii=False).replace("</", "<\\/")
    self.body.append(f"""
<div class="imagesequence isq-theme-{node["config"]["theme"]}" aria-label="Sequencing activity: {esc_title}">
  <script type="application/json" class="isq-data">{payload}</script>
  <div class="isq-head">
    <div class="isq-title">{esc_title or "Put the steps in order"}</div>
    <div class="isq-sub">Drag each picture into its box, or tap a picture and then tap a box.</div>
  </div>
  <noscript><p class="isq-noscript">This activity needs JavaScript. The steps are shown below in order.</p></noscript>
  <div class="isq-source">""")


def depart_imagesequence_html(self, node):
    self.body.append("""</div>
</div>
""")


def visit_step_html(self, node):
    label = html.escape(node.get("label", ""), quote=True)
    name = html.escape(node.get("name", "") or "", quote=True)
    self.body.append(
        f'<div class="isq-step" data-id="{node["id"]}" data-answer="{node["answer"]}" '
        f'data-label="{label}" data-name="{name}">'
    )


def depart_step_html(self, node):
    self.body.append("</div>\n")


def visit_chain_html(self, node):
    title = html.escape(node.get("title", ""), quote=True)
    order = ",".join(str(i) for i in node.get("print_order", []))
    cls = "isq-pool" if node.get("pool") else "isq-chain"
    self.body.append(f'<div class="{cls}" data-title="{title}" data-print-order="{order}">')


def depart_chain_html(self, node):
    self.body.append("</div>\n")


def visit_caption_html(self, node):
    self.body.append('<div class="isq-caption">')


def depart_caption_html(self, node):
    self.body.append("</div>")


def skip_node(self, node):
    raise nodes.SkipNode


# ---------------------------------------------------------------- directives

class StepDirective(SphinxDirective):
    """One picture in an imagesequence. Only meaningful inside one."""

    has_content = True
    required_arguments = 1
    optional_arguments = 0
    final_argument_whitespace = True
    option_spec = {
        "label": directives.unchanged,
        "alt": directives.unchanged,
        "distractor": directives.flag,
    }

    def run(self):
        node = isq_step_node()
        node["label"] = self.options.get("label", "").strip()
        node["distractor"] = "distractor" in self.options
        node.source, node.line = self.get_source_info()

        caption = isq_caption_node()
        if self.content:
            self.state.nested_parse(self.content, self.content_offset, caption)
        caption_text = caption.astext().strip()

        uri = directives.uri(self.arguments[0])
        alt = self.options.get("alt") or caption_text or "Step picture"
        image = nodes.image(uri=uri, alt=alt)
        image.source, image.line = node.source, node.line

        node += image
        node += caption
        return [node]


class ChainDirective(SphinxDirective):
    """One sequence among several in an imagesequence. Holds steps."""

    has_content = True
    required_arguments = 0
    optional_arguments = 1
    final_argument_whitespace = True

    def run(self):
        node = isq_chain_node()
        node["title"] = self.arguments[0].strip() if self.arguments else ""
        node.source, node.line = self.get_source_info()
        self.state.nested_parse(self.content, self.content_offset, node)
        return [node]


def _named_step(env, pattern, name, source, line, missing, distractor=False):
    """A step whose picture path comes from a {name} pattern; the name is its caption."""
    uri = pattern.replace("{name}", name.replace(" ", "_"))
    _rel, abspath = env.relfn2path(uri, env.docname)
    if not Path(abspath).exists():
        missing.add(f"{name} ({uri})")
    step = isq_step_node()
    step["label"] = ""
    step["distractor"] = distractor
    step["name"] = name
    step.source, step.line = source, line
    image = nodes.image(uri=uri, alt=name)
    image.source, image.line = source, line
    caption = isq_caption_node()
    caption += nodes.Text(name)
    step += image
    step += caption
    return step


ARROW_SPLIT = re.compile(r"\s*(?:→|->|=>)\s*")


class ChainsDirective(SphinxDirective):
    """Many sequences, one per line: ``Native grass → Snail → Magpie``.

    Pictures come from the imagesequence's ``:images:`` pattern (or this
    directive's own), with {name} replaced by the name with spaces changed
    to underscores. The name is the caption.
    """

    has_content = True
    required_arguments = 0
    optional_arguments = 0
    option_spec = {"images": directives.unchanged}

    def run(self):
        pattern = (self.options.get("images")
                   or self.env.temp_data.get("isq_images") or "").strip()
        if "{name}" not in pattern:
            return [self.state_machine.reporter.warning(
                "imagesequence chains: set :images: to a picture path with {name} in it, "
                "e.g. :images: pics/{name}.png",
                line=self.lineno)]
        source, _ = self.get_source_info()
        out = []
        missing = set()
        for offset, raw in enumerate(self.content):
            line = raw.strip()
            if not line or line.startswith(".."):
                continue
            line = re.sub(r"^(#\.|\d+[.)]|[-*])\s+", "", line)   # allow list markers
            names = [n.strip() for n in ARROW_SPLIT.split(line) if n.strip()]
            if len(names) < 2:
                self.state_machine.reporter.warning(
                    f"imagesequence chains: '{line}' needs at least two names joined by →",
                    line=self.content_offset + offset + 1)
                continue
            chain = isq_chain_node()
            chain["title"] = ""
            chain.source, chain.line = source, self.content_offset + offset + 1
            for name in names:
                chain += _named_step(self.env, pattern, name, chain.source, chain.line, missing)
            out.append(chain)
        for m in sorted(missing):
            self.state_machine.reporter.warning(
                f"imagesequence chains: no picture for {m}", line=self.lineno)
        return out


class CaptionsDirective(SphinxDirective):
    """``Name: caption`` lines for the pictures made from names."""

    has_content = True

    def run(self):
        node = isq_captions_node()
        node["map"] = {}
        for offset, raw in enumerate(self.content):
            line = raw.strip()
            if not line:
                continue
            lineno = self.content_offset + offset + 1
            if ":" not in line:
                self.state_machine.reporter.warning(
                    f"imagesequence captions: '{line}' should be Name: caption", line=lineno)
                continue
            name, text = line.split(":", 1)
            node["map"][name.strip().lower()] = (name.strip(), text.strip(), lineno)
        return [node]


def _number_steps(steps):
    """Give each step its id (position) and answer (-1 for distractors)."""
    answer = 0
    for i, step in enumerate(steps):
        step["id"] = i
        if step["distractor"]:
            step["answer"] = -1
        else:
            step["answer"] = answer
            answer += 1
    return answer


def _print_order(seed, count):
    """A fixed shuffle (the same every build) that isn't already in order."""
    order = list(range(count))
    rng = random.Random(_short_hash(seed))
    for _ in range(10):
        rng.shuffle(order)
        if order != sorted(order):
            break
    return order


class ImageSequenceDirective(SphinxDirective):
    has_content = True
    required_arguments = 0
    optional_arguments = 1
    final_argument_whitespace = True

    option_spec = {
        "arrows": lambda a: directives.choice(a, ARROWS),
        "numbering": lambda a: directives.choice(a, NUMBERING),
        "captions": lambda a: directives.choice(a, CAPTIONS),
        "columns": _columns,
        "fullscreen-columns": _full_columns,
        "tray-columns": _whole(1, 8),
        "fullscreen-tray-columns": _whole(1, 6),
        "fullscreen-tray-width": _whole(15, 50),
        "feedback": lambda a: directives.choice(a, FEEDBACK),
        "fixed": _int_list,
        "theme": lambda a: directives.choice(a, THEMES),
        "print": lambda a: directives.choice(a, PRINT),
        "answer-key": directives.flag,
        "start": lambda a: directives.choice(a, START),
        "pick": lambda a: directives.choice(a, PICK),
        "images": directives.unchanged,
        "distractors": directives.nonnegative_int,
        "print-chains": lambda a: directives.choice(a, PRINT_CHAINS),
        "next-label": directives.unchanged,
        "extras": directives.unchanged,
        "labels": _labels,
        "clues": lambda a: directives.choice(a, CLUES),
        "clue-prompt": directives.unchanged,
    }

    def run(self):
        node = imagesequence_node()
        node.source, node.line = self.get_source_info()
        # Let a nested ``.. chains::`` see this directive's :images:.
        had = "isq_images" in self.env.temp_data
        saved = self.env.temp_data.get("isq_images")
        self.env.temp_data["isq_images"] = self.options.get("images", "")
        try:
            self.state.nested_parse(self.content, self.content_offset, node)
        finally:
            if had:
                self.env.temp_data["isq_images"] = saved
            else:
                self.env.temp_data.pop("isq_images", None)

        self.caption_map = {}
        self.caption_used = set()
        for child in list(node.children):
            if isinstance(child, isq_captions_node):
                self.caption_map.update(child["map"])
                node.remove(child)

        title = self.arguments[0] if self.arguments else ""
        chains = [c for c in node.children if isinstance(c, isq_chain_node)]
        if chains:
            return self.run_chains(node, chains, title)

        # Keep only the steps; warn about anything else.
        steps = []
        for child in list(node.children):
            if isinstance(child, isq_step_node):
                steps.append(child)
            else:
                node.remove(child)
                if not isinstance(child, nodes.comment):
                    self.state_machine.reporter.warning(
                        "imagesequence: only '.. step::' items are allowed inside, "
                        "something else was skipped.",
                        line=self.lineno,
                    )

        real = [s for s in steps if not s["distractor"]]
        if len(real) < 2:
            return [
                self.state_machine.reporter.warning(
                    "imagesequence: needs at least two steps (not counting distractors).",
                    line=self.lineno,
                )
            ]

        _number_steps(steps)
        self.apply_labels(steps)
        n = len(real)
        if self.caption_map:
            self.state_machine.reporter.warning(
                "imagesequence: '.. captions::' is only for '.. chains::' and :extras:. "
                "Write a step's caption under the step instead.", line=self.lineno)

        fixed = []
        for f in self.options.get("fixed", []):
            if 1 <= f <= n:
                fixed.append(f - 1)
            else:
                self.state_machine.reporter.warning(
                    f"imagesequence: :fixed: step {f} doesn't exist (use 1 to {n}).",
                    line=self.lineno,
                )

        # The printed worksheet uses one fixed shuffle (the same every build)
        # so the answer key matches the sheet.
        order = _print_order(f"{self.env.docname}::{title}::{len(steps)}", len(steps))

        node["title"] = title
        node["config"] = self.base_config(title, n, fixed)
        node["config"]["printOrder"] = order
        return [node]

    def apply_labels(self, steps):
        """Box labels by position, for steps without their own :label:."""
        labels = self.options.get("labels") or []
        for step in steps:
            a = step["answer"]
            if a >= 0 and not step["label"] and a < len(labels) and labels[a]:
                step["label"] = labels[a]

    def apply_captions(self, steps):
        """Swap the name caption of named pictures for the one in .. captions::."""
        used = set()
        for step in steps:
            name = step.get("name")
            if not name or name.lower() not in self.caption_map:
                continue
            _n, text, lineno = self.caption_map[name.lower()]
            used.add(name.lower())
            inline, messages = self.state.inline_text(text, lineno)
            plain = "".join(n.astext() for n in inline)
            for child in step.children:
                if isinstance(child, isq_caption_node):
                    child.children = []
                    child += inline
                elif isinstance(child, nodes.image):
                    child["alt"] = plain
            for m in messages:
                step += m
        return used

    def base_config(self, title, n, fixed):
        return {
            "title": title,
            "n": n,
            "arrows": self.options.get("arrows", "snake"),
            "numbering": self.options.get("numbering", "numbers"),
            "captions": self.options.get("captions", "below"),
            "columns": self.options.get("columns", 3),
            # 0 = same as :columns: in full screen.
            "fullColumns": self.options.get("fullscreen-columns", 0),
            # Pictures still to place: 0 = as many in a row as fit.
            "trayColumns": self.options.get("tray-columns", 0),
            "fullTrayColumns": self.options.get("fullscreen-tray-columns", 0),
            "fullTrayWidth": self.options.get("fullscreen-tray-width", 0),
            "feedback": self.options.get("feedback", "marks"),
            "fixed": sorted(set(fixed)),
            "theme": self.options.get("theme", "light"),
            "print": self.options.get("print", "worksheet"),
            "answerKey": "answer-key" in self.options,
            "start": self.options.get("start", "tray"),
            "clues": self.options.get("clues", "none"),
            "cluePrompt": (self.options.get("clue-prompt") or "").strip()
            or "Tap or point at a picture to read about it.",
        }

    def run_chains(self, node, chains, title):
        """Several sequences: the page shows one at a time."""
        warn = self.state_machine.reporter.warning
        for child in list(node.children):
            if not isinstance(child, isq_chain_node):
                node.remove(child)
                if not isinstance(child, nodes.comment):
                    warn("imagesequence: with '.. chain::' or '.. chains::', put every "
                         "'.. step::' inside a chain. Something else was skipped.",
                         line=self.lineno)

        kept = []
        for k, chain in enumerate(chains):
            steps = []
            for child in list(chain.children):
                if isinstance(child, isq_step_node):
                    steps.append(child)
                else:
                    chain.remove(child)
                    if not isinstance(child, nodes.comment):
                        warn("imagesequence: only '.. step::' items are allowed in a chain.",
                             line=chain.line or self.lineno)
            real = _number_steps(steps)
            self.apply_labels(steps)
            if real < 2:
                node.remove(chain)
                warn("imagesequence: a chain needs at least two steps (not counting "
                     "distractors), so it was skipped.", line=chain.line or self.lineno)
                continue
            chain["n"] = real
            chain["print_order"] = _print_order(
                f"{self.env.docname}::{title}::{k}::{len(steps)}", len(steps))
            kept.append(chain)

        if not kept:
            return [warn("imagesequence: no usable chains.", line=self.lineno)]

        shortest = min(c["n"] for c in kept)
        fixed = []
        for f in self.options.get("fixed", []):
            if 1 <= f <= shortest:
                fixed.append(f - 1)
            else:
                warn(f"imagesequence: :fixed: step {f} is longer than the shortest "
                     f"chain (use 1 to {shortest}).", line=self.lineno)

        extras = [x.strip() for x in self.options.get("extras", "").split(",") if x.strip()]
        if extras:
            pattern = self.options.get("images", "").strip()
            if "{name}" not in pattern:
                warn("imagesequence: :extras: needs :images: with {name} in it.", line=self.lineno)
            else:
                pool = isq_chain_node()
                pool["pool"] = True
                pool.source, pool.line = node.source, self.lineno
                missing = set()
                for name in extras:
                    pool += _named_step(self.env, pattern, name, node.source, self.lineno,
                                        missing, distractor=True)
                _number_steps(pool.children)
                self.caption_used = self.apply_captions(list(pool.children))
                for m in sorted(missing):
                    warn(f"imagesequence: no picture for extra {m}", line=self.lineno)
                node += pool

        used = set(self.caption_used)
        for chain in kept:
            used |= self.apply_captions([c for c in chain.children if isinstance(c, isq_step_node)])
        for key, (name, _t, lineno) in self.caption_map.items():
            if key not in used:
                warn(f"imagesequence captions: '{name}' isn't in any chain or extras.", line=lineno)

        node["title"] = title
        cfg = self.base_config(title, kept[0]["n"], fixed)
        cfg.update({
            "chains": len(kept),
            "pick": self.options.get("pick", "random"),
            "autoDistractors": self.options.get("distractors", 0),
            "printChains": self.options.get("print-chains", "shown"),
            "nextLabel": self.options.get("next-label", "New chain"),
        })
        node["config"] = cfg
        return [node]


# ---------------------------------------------------------------- setup

def copy_static_assets(app, exception):
    """Copies static assets to the build output directory."""
    if app.builder.name == "html" and exception is None:
        ext_static = Path(__file__).parent / "_static"
        out_static = Path(app.outdir) / "_static"
        if ext_static.exists():
            try:
                # Sphinx 8.1+ won't overwrite existing files unless forced.
                copy_asset(str(ext_static), str(out_static), force=True)
            except TypeError:
                copy_asset(str(ext_static), str(out_static))


def setup(app):
    app.add_node(
        imagesequence_node,
        html=(visit_imagesequence_html, depart_imagesequence_html),
        latex=(skip_node, None),
        text=(skip_node, None),
    )
    app.add_node(
        isq_step_node,
        html=(visit_step_html, depart_step_html),
        latex=(skip_node, None),
        text=(skip_node, None),
    )
    app.add_node(
        isq_caption_node,
        html=(visit_caption_html, depart_caption_html),
        latex=(skip_node, None),
        text=(skip_node, None),
    )
    app.add_node(
        isq_captions_node,
        html=(skip_node, None),
        latex=(skip_node, None),
        text=(skip_node, None),
    )
    app.add_node(
        isq_chain_node,
        html=(visit_chain_html, depart_chain_html),
        latex=(skip_node, None),
        text=(skip_node, None),
    )
    app.add_directive("imagesequence", ImageSequenceDirective)
    app.add_directive("step", StepDirective)
    app.add_directive("chain", ChainDirective)
    app.add_directive("chains", ChainsDirective)
    app.add_directive("captions", CaptionsDirective)

    app.add_js_file("imagesequence.js")
    app.add_css_file("imagesequence.css")

    app.connect("build-finished", copy_static_assets)

    return {
        "version": "1.3",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
