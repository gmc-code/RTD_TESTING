for i, line in enumerate(raw_lines):
    # Strip any accidental number prefixes
    clean = line.strip()
    if "|" in clean:
        left, right = clean.split("|", 1)
        if left.strip().isdigit():
            clean = right.strip()

    # Build raw HTML for the list item
    li_html = (
        f'<li class="parsons-line draggable" '
        f'data-line="{i+1}" '
        f'data-text="{clean}">'
        f'<span class="line-label">{i+1} |</span>'
        f'<pre class="no-copybutton no-lineno">{clean}</pre>'
        f'</li>'
    )

    li = nodes.raw("", li_html, format="html")
    source_ul += li
