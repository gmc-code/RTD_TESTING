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
        "prefix": directives.unchanged,  # none | pipe | bracket | custom
        "hide-source": directives.flag,
        "max-height": directives.unchanged,  # e.g. 300px
        "debug": directives.flag,
    }

    def run(self):
        import textwrap, html, random, hashlib, json, csv, os, logging
        logger = logging.getLogger(__name__)

        raw = "\n".join(self.content)
        raw = textwrap.dedent(raw)
        lines = raw.splitlines()

        title = html.escape(self.options.get("title", "Parsons Puzzle"))
        shuffle = "shuffle" in self.options
        shuffle_js = "shuffle-js" in self.options
        columns = max(1, int(self.options.get("columns", 1)))
        lang = html.escape(self.options.get("language", "python"))
        indent_step = max(1, int(self.options.get("indent-step", 4)))

        seed_opt = self.options.get("seed")
        seed = int(seed_opt) if seed_opt is not None else None
        if seed is not None:
            random.seed(seed)

        # Parse buttons
        btn_check, btn_reset, btn_solution = _parse_buttons(
            self.options.get("buttons", "Check,Reset,Solution")
        )

        labels_opt = self.options.get("labels")
        labels = [html.escape(lbl) for lbl in next(csv.reader([labels_opt]))] if labels_opt else []

        check_mode = self.options.get("check-mode", "strict").lower()
        if check_mode not in ("strict", "order-only", "indent-only"):
            check_mode = "strict"

        prefix_mode = (self.options.get("prefix", "none") or "none").lower()
        hide_source = "hide-source" in self.options

        # ---------- Parse lines ----------
        expected_order = []
        seen_texts = {}
        for i, raw_line in enumerate(lines, start=1):
            line = raw_line.rstrip()
            if not line.strip():
                continue

            locked = False
            if line.endswith(":lock:"):
                locked = True
                line = line[: -len(":lock:")].rstrip()

            expanded = line.expandtabs(4)
            indent_spaces = len(expanded) - len(expanded.lstrip())
            code_text = expanded.strip()
            indent_level = indent_spaces // indent_step

            key = code_text
            if key in seen_texts:
                logger.warning("Duplicate line detected (line %s): %s", i, code_text)
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

        # ---------- Widget ID ----------
        content_hash = hashlib.md5("\n".join(lines).encode("utf-8")).hexdigest()[:10]
        widget_id = f"parsons-{content_hash}"

        # ---------- Prepare raw lines ----------
        raw_lines = [(item["line_number"], item["code_text"], item.get("locked", False)) for item in expected_order]

        if shuffle and not shuffle_js:
            shuffle_seed = seed if seed is not None else int(content_hash[:8], 16)
            rnd = random.Random(shuffle_seed)
            rnd.shuffle(raw_lines)

        random_order = [ln for ln, *_ in raw_lines]

        shuffle_attr = "true" if shuffle_js else "false"
        data_seed = html.escape(str(seed)) if seed is not None else ""

        # ---------- Open container ----------
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

        # ---------- Title ----------
        title_para = nodes.paragraph()
        title_para += nodes.strong(text=title)

        # ---------- Source lines ----------
        source_nodes = []
        if not hide_source:
            source_ul = nodes.raw('', '<ul class="parsons-source" role="list" aria-label="Source lines">', format='html')
            for line_number, code_line, locked in raw_lines:
                classes = ["parsons-line"]
                if locked:
                    classes.append("parsons-locked")
                prefix_html = ""
                if prefix_mode != "none":
                    prefix_html = f'<span class="parsons-prefix">{html.escape(self._format_prefix(prefix_mode, line_number))}</span>'
                line_html = (
                    f'<li class="{" ".join(classes)}" data-line-number="{line_number}" data-locked="{str(locked).lower()}" '
                    f'draggable="true" tabindex="0">'
                    f'<pre class="parsons-code">{prefix_html}{html.escape(code_line)}</pre></li>'
                )
                source_ul += nodes.raw('', line_html, format='html')
            source_ul += nodes.raw('', '</ul>', format='html')
            source_nodes = [source_ul]

        # ---------- Target columns ----------
        target_wrapper = nodes.raw('', f'<div class="parsons-target-wrapper">', format='html')
        for c in range(columns):
            label_text = labels[c] if c < len(labels) else f"Column {c+1}"
            col_html = (
                f'<div class="parsons-target parsons-col-{c+1}">'
                f'<p class="parsons-target-label">{label_text}</p>'
                f'<ul class="parsons-target-list" role="list" aria-label="Target {c+1}: {label_text}" data-col-index="{c}"></ul>'
                '</div>'
            )
            target_wrapper += nodes.raw('', col_html, format='html')
        target_wrapper += nodes.raw('', '</div>', format='html')

        # ---------- Controls ----------
        controls_html = (
            '<div class="parsons-controls" role="toolbar" aria-label="Parsons controls">'
            f'<button type="button" class="parsons-check">{btn_check}</button>'
            f'<button type="button" class="parsons-reset">{btn_reset}</button>'
            f'<button type="button" class="parsons-show-solution">{btn_solution}</button>'
            '</div>'
        )
        controls = nodes.raw('', controls_html, format='html')

        # ---------- Expected JSON ----------
        expected_json_node = nodes.raw(
            "",
            f'<script type="application/json" id="{widget_id}-expected">{json.dumps({"expected": expected_order,"config":{"indent_step": indent_step,"check_mode": check_mode,"columns": columns,"prefix": prefix_mode}}, separators=(",", ":"))}</script>',
            format="html",
        )

        # ---------- Noscript fallback ----------
        noscript = nodes.raw("", '<noscript><p>This puzzle requires JavaScript to interact.</p></noscript>', format="html")
        close_div = nodes.raw("", "</div>", format="html")

        # Debug
        if "debug" in self.options or os.getenv("PARSONS_DEBUG"):
            logger.debug("Parsons directive parsed: %s", json.dumps(expected_order, indent=2))

        # ---------- Assemble ----------
        nodes_out = [open_div, title_para] + source_nodes + [target_wrapper, controls, expected_json_node, noscript, close_div]
        return nodes_out

    def _format_prefix(self, mode: str, n: int) -> str:
        if mode == "pipe":
            return f"{n} | "
        if mode == "bracket":
            return f"[{n}] "
        if mode.startswith("custom="):
            fmt = mode.split("=", 1)[1]
            return fmt.replace("{n}", str(n))
        return f"{n} "
