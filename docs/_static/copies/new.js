from docutils import nodes

# inside your loop
code_html = f'<pre class="no-copybutton">{line}</pre>'
code = nodes.raw('', code_html, format='html')
li += code
