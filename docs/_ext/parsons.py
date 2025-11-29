from docutils import nodes
from docutils.parsers.rst import Directive, directives
import random
import json
import html
import csv


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
        "check-mode":
        directives.unchanged,  # NEW: strict, order-only, indent-only
        "auto-format": directives.flag,
    }

    def run(self):
        # Title
        title = html.escape(self.options.get("title", "Parsons Puzzle"))

        # Shuffle options
        shuffle = "shuffle" in self.options
        shuffle_js = "shuffle-js" in self.options

        # Columns validation
        columns = int(self.options.get("columns", 1))
        if columns < 1:
            columns = 1

        # Language
        lang = html.escape(self.options.get("language", "python"))

        # Indent step
        indent_step = int(self.options.get("indent-step", 4))
        if indent_step <= 0:
            indent_step = 4

        # Seed
        seed = self.options.get("seed")
        if seed is not None:
            random.seed(int(seed))

        # Button labels
        btn_csv = self.options.get("buttons", "Check,Reset,Solution")
        btn_labels = next(csv.reader([btn_csv]))
        while len(btn_labels) < 3:
            btn_labels.append("")
        btn_check, btn_reset, btn_solution = [
            html.escape(lbl) for lbl in btn_labels[:3]
        ]

        # Labels for columns
        labels_opt = self.options.get("labels")
        labels = next(csv.reader([labels_opt])) if labels_opt else []
        labels = [html.escape(lbl) for lbl in labels]

        # Check mode validation
        check_mode = self.options.get("check-mode", "strict").lower()
        if check_mode not in ("strict", "order-only", "indent-only"):
            check_mode = "strict"

        # Build expected order
        expected_order = []
        for i, line in enumerate(self.content, start=1):
            if not line.strip():
                continue
            expanded = line.expandtabs(4)
            indent_spaces = len(expanded) - len(expanded.lstrip())
            code_text = expanded.strip()
            indent_level = indent_spaces // indent_step
            expected_order.append({
                "line_number": i,
                "indent": indent_spaces,
                "indent_level": indent_level,
                "code_text": code_text,
                "correction": ""
            })

        if not expected_order:
            return [
                nodes.paragraph(
                    text="(No lines provided for this Parsons puzzle.)")
            ]

        raw_lines = [(item["line_number"], item["code_text"])
                     for item in expected_order]

        if shuffle and not shuffle_js:
            random.shuffle(raw_lines)

        widget_id = f"parsons-{random.randint(10000, 99999)}"
        shuffle_attr = "true" if shuffle_js else "false"

        container_attrs = (
            f' id="{widget_id}"'
            f' class="parsons-container parsons-cols-{columns}"'
            f' data-shuffle-js="{shuffle_attr}"'
            f' data-indent-step="{indent_step}"'
            f' data-columns="{columns}"'
            f' data-seed="{html.escape(str(seed)) if seed is not None else ""}"'
            f' data-check-mode="{check_mode}"')

        open_div = nodes.raw("", f"<div{container_attrs}>", format="html")

        title_para = nodes.paragraph()
        title_para += nodes.strong(text=title)

        source_ul = nodes.bullet_list(classes=["parsons-source"])
        source_ul["attributes"] = {
            "role": "list",
            "aria-label": "Source lines"
        }
        for line_number, code_line in raw_lines:
            li = nodes.list_item(classes=["parsons-line", "no-copybutton"])
            li["attributes"] = {
                "role": "listitem",
                "tabindex": "0",
                "draggable": "true"
            }
            code = nodes.literal_block(code_line, code_line)
            code["language"] = lang
            code["classes"].append("no-copybutton")
            code["data-index"] = str(line_number)
            li += code
            source_ul += li

        target_wrapper = nodes.container(classes=["parsons-target-wrapper"])
        for c in range(columns):
            col = nodes.container(
                classes=["parsons-target", f"parsons-col-{c+1}"])
            label_text = labels[c] if c < len(labels) else f"Column {c+1}"
            col += nodes.paragraph(text=label_text,
                                   classes=["parsons-target-label"])
            ul = nodes.bullet_list(classes=["parsons-target-list"])
            ul["attributes"] = {
                "role": "list",
                "aria-label": f"Target {c+1}: {label_text}"
            }
            ul["data-col-index"] = str(c)
            col += ul
            target_wrapper += col

        controls_html = (
            '<div class="parsons-controls">'
            f'<button type="button" class="parsons-check" aria-label="Check solution">{btn_check}</button>'
            f'<button type="button" class="parsons-reset" aria-label="Reset puzzle">{btn_reset}</button>'
            f'<button type="button" class="parsons-show-solution" aria-label="Show solution">{btn_solution}</button>'
            '</div>')
        controls = nodes.raw("", controls_html, format="html")

        # dont escape json
        expected_json_node = nodes.raw(
            "",
            f'<script type="application/json" id="{widget_id}-expected">{json.dumps(expected_order, separators=(",", ":"))}</script>',
            format="html")

            noscript = nodes.raw(
            "",
            '<noscript><p>This puzzle requires JavaScript to interact.</p></noscript>',
            format="html")

        close_div = nodes.raw("", "</div>", format="html")

        return [
            open_div, title_para, source_ul, target_wrapper, controls,
            expected_json_node, noscript, close_div
        ]


def setup(app):
    app.add_directive("parsons", ParsonsDirective)
    app.add_css_file("parsons/parsons.css")
    app.add_js_file("parsons/parsons.js")
    return {
        "version": "0.7",
        "parallel_read_safe": True,
        "parallel_write_safe": True,
    }
