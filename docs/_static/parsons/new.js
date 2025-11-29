code = nodes.literal_block(code_line, code_line)
code["language"] = lang
code["classes"].append("no-copybutton")  # ensures <pre class="no-copybutton">
code["data-index"] = str(line_number)
