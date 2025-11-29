prefix_text = self._format_prefix(prefix_mode, line_number)
raw_html = (
    f"<pre class='parsons-code'><span class='parsons-prefix'>{html.escape(prefix_text)}</span>"
    f"{html.escape(code_line)}</pre>"
)
li += nodes.raw('', raw_html, format='html')
