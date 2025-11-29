# Build expected order with consistent indent
expected_order = []
for i, line in enumerate(self.content, start=1):
    if not line.strip():
        continue
    expanded = line.expandtabs(4)
    indent = len(expanded) - len(expanded.lstrip())
    raw = expanded.strip()
    expected_order.append({
        "line_number": i,
        "indent": indent,
        "code_text": raw,
        "correction": ""  # placeholder for correction output
    })
