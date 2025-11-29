"""
Enhanced Parsons Sphinx directive
- Normalizes indentation with textwrap.dedent
- Stable widget id via md5 hash of content (deterministic)
- Optional prefix numbering (pipe/bracket/custom)
- Per-line `:lock:` flag support
- Deterministic shuffle support (server-side seed exported to JS)
- Debugging output with PARSONS_DEBUG env var
- Improved ARIA roles + attributes
- RTD-friendly static registration hints in setup()

Drop accompanying static files into: _static/parsons/
  - parsons.css
  - Sortable.min.js
  - parsons.js

Usage in rst:
.. parsons::
   :title: Example
   :shuffle:
   :prefix: pipe
   :columns: 2

   print('Hello')
   \tif True:    :lock:
   print('Done')

"""

from docutils import nodes
from docutils.parsers.rst import Directive, directives
import textwrap
import random
import json
import html
import csv
import hashlib
import os
import logging

logger = logging.getLogger(__name__)


def _parse_buttons(btn_csv: str):
    labels = next(csv.reader([btn_csv]))
    while len(labels) < 3:
        labels.append("")
    return [html.escape(lbl) for lbl in labels[:3]]


class ParsonsDirective(Directive):
    has_content = True
    option_spec = {
        "title": directives.unchanged,
        "shuffle": directives.flag,
        "shuffle-js": directives.flag,
        "columns": directives.positive_int,
        "labels": directives.unchanged,
        "language": directives.unchanged,
        "seed": directives.nonnegative_int,
        "buttons": directives.unchanged,
        "indent-step": directives.nonnegative_int,
        "check-mode": directives.unchanged,  # strict, order-only, indent-only
        "auto-format": directives.flag,
        # NEW options
        "prefix": directives.unchanged,  # none | pipe | bracket | custom
        "hide-source": directives.flag,
        "max-height": directives.unchanged,  # e.g. 300px
        "debug": directives.flag,
    }

    def run(self):
        # ---------- Basic options and normalization ----------
        raw = "\n".join(self.content)
        # Dedent content so `.rst` indentation doesn't affect code
        raw = textwrap.dedent(raw)
        lines = raw.splitlines()

        title = html.escape(self.options.get("title", "Parsons Puzzle"))
        shuffle = "shuffle" in self.options
        shuffle_js = "shuffle-js" in self.options
        columns = int(self.options.get("columns", 1) or 1)
        columns = max(1, columns)
        lang = html.escape(self.options.get("language", "python"))
        indent_step = int(self.options.get("indent-step", 4) or 4)
        indent_step = max(1, indent_step)

        seed_opt = self.options.get("seed")
        seed = int(seed_opt) if seed_opt is not None else None
        if seed is not None:
            random.seed(seed)

        btn_check, btn_reset, btn_solution = _parse_buttons(self.options.get("buttons", "Check,Reset,Solution"))

        labels_opt = self.options.get("labels")
        labels = next(csv.reader([labels_opt])) if labels_opt else []
        labels = [html.escape(lbl) for lbl in labels]

        check_mode = self.options.get("check-mode", "strict").lower()
        if check_mode not in ("strict", "order-only", "indent-only"):
            check_mode = "strict"

        prefix_mode = (self.options.get("prefix", "none") or "none").lower()
        max_height = self.options.get("max-height")
        hide_source = "hide-source" in self.options

        # ---------- Parse lines, support per-line :lock: suffix ----------
        expected_order = []
        seen_texts = {}
        for i, raw_line in enumerate(lines, start=1):
            line = raw_line.rstrip("\n\r")
            if not line.strip():
                # preserve empty lines in ordering (they may be significant)
                # but skip purely blank lines for UI
                continue

            # detect per-line flags by splitting on an unambiguous marker
            # simple DSL: add "    :lock:" at end of the line to lock it
            locked = False
            if line.endswith(":lock:"):
                locked = True
                line = line[: -len(":lock:")].rstrip()

            # Expand tabs and compute indent
            expanded = line.expandtabs(4)
            indent_spaces = len(expanded) - len(expanded.lstrip())
            code_text = expanded.strip()
            indent_level = indent_spaces // indent_step

            # duplicate detection
            key = code_text
            if key in seen_texts:
                # store duplicates but warn — duplicates make automatic checking ambiguous
                logger.warning("Parsons puzzle duplicate line text detected (line %s): %s", i, code_text)
            seen_texts[key] = seen_texts.get(key, 0) + 1

            expected_order.append({
                "line_number": i,
                "indent": indent_spaces,
                "indent_level": indent_level,
                "code_text": code_text,
                "locked": locked,
                "correction": "",
            })

        if not expected_order:
            return [nodes.paragraph(text="(No lines provided for this Parsons puzzle.)")]

        # ---------- Stable widget id ----------
        content_hash = hashlib.md5("\n".join(lines).encode("utf-8")).hexdigest()[:10]
        widget_id = f"parsons-{content_hash}"

        # ---------- Prepare raw lines for display (server-side shuffle optional) ----------
        raw_lines = [(item["line_number"], item["code_text"], item.get("locked", False)) for item in expected_order]

        # deterministic shuffle server-side if requested
        if shuffle and not shuffle_js:
            # use seed if provided, otherwise seed from content_hash to be deterministic across builds
            shuffle_seed = seed if seed is not None else int(content_hash[:8], 16)
            rnd = random.Random(shuffle_seed)
            rnd.shuffle(raw_lines)

        # Also create a stable "random order" array for JS so client and server agree
        random_order = [ln for ln, *_ in raw_lines]

        # ---------- Build container attributes and HTML fragments ----------
        shuffle_attr = "true" if shuffle_js else "false"
        data_seed = html.escape(str(seed)) if seed is not None else ""

        container_attrs = (
            f' id="{widget_id}"'
            f' class="parsons-container parsons-cols-{columns}"'
            f' role="application"'
            f' data-shuffle-js="{shuffle_attr}"'
            f' data-indent-step="{indent_step}"'
            f' data-columns="{columns}"'
            f' data-seed="{data_seed}"'
            f' data-check-mode="{check_mode}"'
            f' data-prefix="{html.escape(prefix_mode)}"'
            f' data-random-order="{html.escape(json.dumps(random_order))}"'
        )

        open_div = nodes.raw("", f"<div{container_attrs}>", format="html")

        # Title
        title_para = nodes.paragraph()
        title_para += nodes.strong(text=title)

        # Source lines (if not hidden)
        source_nodes = []
                # Source lines (if not hidden)
        if not hide_source:
            source_ul = nodes.bullet_list(classes=["parsons-source"])
            source_ul["role"] = "list"
            source_ul["aria-label"] = "Source lines"

            for line_number, code_line, locked in raw_lines:
                li = nodes.list_item(classes=["parsons-line"])
                li["role"] = "listitem"
                li["tabindex"] = "0"
                li["draggable"] = "true"

                if locked:
                    li["class"].append("parsons-locked")

                # ✔ FIX: proper Docutils attribute assignment
                li["data-line"] = str(line_number)
                li["data-line-number"] = str(line_number)
                li["data-locked"] = "true" if locked else "false"

                code_node = nodes.literal_block(code_line, code_line)
                code_node["language"] = lang
                code_node["classes"].append("no-copybutton")

                if prefix_mode != "none":
                    prefix_text = self._format_prefix(prefix_mode, line_number)
                    raw_html = (
                        f"<pre><code class='parsons-code'>"
                        f"<span class='parsons-prefix'>{html.escape(prefix_text)}</span>"
                        f"{html.escape(code_line)}</code></pre>"
                    )
                    li += nodes.raw('', raw_html, format='html')
                else:
                    li += code_node

                source_ul += li

        source_nodes = [source_ul]


        # Target columns
        target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
        for c in range(columns):
            col = nodes.container(classes=["parsons-target", f"parsons-col-{c+1}"])
            label_text = labels[c] if c < len(labels) else f"Column {c+1}"
            col += nodes.paragraph(text=label_text, classes=["parsons-target-label"])  # header for column
            ul = nodes.bullet_list(classes=["parsons-target-list"])  # will receive dropped items
            ul["attributes"] = {"role": "list", "aria-label": f"Target {c+1}: {label_text}"}
            ul["data-col-index"] = str(c)
            col += ul
            target_wrapper += col

        # Controls (buttons) — include role and aria labels explicitly
        controls_html = (
            '<div class="parsons-controls" role="toolbar" aria-label="Parsons controls">'
            f'<button type="button" class="parsons-check" role="button" aria-label="Check solution">{btn_check}</button>'
            f'<button type="button" class="parsons-reset" role="button" aria-label="Reset puzzle">{btn_reset}</button>'
            f'<button type="button" class="parsons-show-solution" role="button" aria-label="Show solution">{btn_solution}</button>'
            '</div>'
        )
        controls = nodes.raw("", controls_html, format="html")

        # Embedded expected JSON for checking — do not escape, JS will read it
        expected_payload = {
            "expected": expected_order,
            "config": {
                "indent_step": indent_step,
                "check_mode": check_mode,
                "columns": columns,
                "prefix": prefix_mode,
            }
        }
        expected_json_node = nodes.raw(
            "",
            f'<script type="application/json" id="{widget_id}-expected">{json.dumps(expected_payload, separators=(',', ':'))}</script>',
            format="html",
        )

        # noscript fallback
        noscript = nodes.raw("", '<noscript><p>This puzzle requires JavaScript to interact.</p></noscript>', format="html")

        # close container
        close_div = nodes.raw("", "</div>", format="html")

        # Debug output if requested
        if "debug" in self.options or os.getenv("PARSONS_DEBUG"):
            logger.debug("Parsons directive parsed: %s", json.dumps(expected_payload, indent=2))

        # Assemble final nodes list
        nodes_out = [open_div, title_para] + source_nodes + [target_wrapper, controls, expected_json_node, noscript, close_div]
        return nodes_out

    def _format_prefix(self, mode: str, n: int) -> str:
        if mode == "pipe":
            return f"{n} | "
        if mode == "bracket":
            return f"[{n}] "
        if mode.startswith("custom="):
            # user-supplied format: custom={n} -> replace {n}
            fmt = mode.split("=", 1)[1]
            return fmt.replace("{n}", str(n))
        # default: number and space
        return f"{n} "


def setup(app):
    app.add_directive("parsons", ParsonsDirective)
    # register static files that should be copied to _static during build
    # Put parsons.css, Sortable.min.js and parsons.js under _static/parsons/
    app.add_css_file("parsons/parsons.css")
    # Sortable should be loaded prior to the parsons runtime; include both
    app.add_js_file("parsons/Sortable.min.js")
    app.add_js_file("parsons/parsons.js")

    # Expose configuration metadata
    return {
        "version": "0.9",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }


# EOF
