lines = [(indent, code, idx+1) for idx, (indent, code) in enumerate(expected_order)]

if shuffle:
    random.shuffle(lines)

for indent, code, orig_line in lines:
    clean = strip_number_prefix(code)
    li_html = (
        f'<li class="parsons-line draggable" data-line="{orig_line}" data-text="{clean}">'
        f'<span class="line-label">{orig_line} |</span>'
        f'<pre class="no-copybutton no-lineno">{clean}</pre>'
        f'</li>'
    )
    source_ul += nodes.raw("", li_html, format="html")
