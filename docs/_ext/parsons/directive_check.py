        for i, line in enumerate(raw_lines):
            li = nodes.list_item(classes=["parsons-line"])
            li["data-index"] = str(i)
            li["classes"].append("draggable")

            # strip any leading "N |" prefix
            clean_line = line
            if "|" in line and line.split("|", 1)[0].strip().isdigit():
                clean_line = line.split("|", 1)[1].strip()

            code = nodes.literal_block(clean_line, clean_line)
            code["language"] = "python"
            code["classes"].append("no-copybutton")
            code_html = f'<pre class="no-copybutton">{line}</pre>'
            code = nodes.raw('', code_html, format='html')
            li += code

            # add a separate label span for the number
            label = nodes.raw("", f'<span class="line-label">{i+1}</span>', format="html")
            li.insert(0, label)

            source_ul += li



