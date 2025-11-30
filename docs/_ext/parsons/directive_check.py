        # Source list
        source_ul = nodes.bullet_list(classes=["parsons-source"])

        def strip_number_prefix(s: str) -> str:
            # Remove leading "N |" if present; also guard against accidental "NNcode"
            s = s.strip()
            # Pattern: digits optional spaces then pipe
            if "|" in s:
                left, right = s.split("|", 1)
                if left.strip().isdigit():
                    return right.strip()
            # If someone concatenated digits with code (e.g., "11nums"), keep original
            return s

        for i, line in enumerate(raw_lines):
            # Ensure code text is clean (no prefixed numbers)
            clean = strip_number_prefix(line)

            li = nodes.list_item(classes=["parsons-line", "draggable"])
            li["data-line"] = str(i + 1)
            li["data-text"] = clean  # used by JS checker; avoids reading mutated DOM

            # Line number label only (no pipe in code)
            label = nodes.raw("", f'<span class="line-label">{i + 1}</span>', format="html")
            li += label

            # Raw <pre> prevents copybutton/lineno hooks from modifying content
            # Also add a defensive class for CSS-based hiding if needed
            pre_html = f'<pre class="no-copybutton no-lineno">{clean}</pre>'
            pre = nodes.raw("", pre_html, format="html")
            li += pre

            source_ul += li
