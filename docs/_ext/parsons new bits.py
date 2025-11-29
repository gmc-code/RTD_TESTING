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
