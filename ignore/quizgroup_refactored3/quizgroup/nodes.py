from docutils import nodes


class quizgroup_node(nodes.General, nodes.Element):
    pass


def _nav_bar():
    return (
        '    <div class="quizgroup-nav-bar">\n'
        '      <div class="quizgroup-nav-left">\n'
        '        <button class="quizgroup-btn-first" type="button" title="First Question">&laquo; First</button>\n'
        '        <button class="quizgroup-btn-prev" type="button" title="Previous Question">&lsaquo; Prev</button>\n'
        '      </div>\n'
        '      <span class="quizgroup-nav-status">Question <span class="quizgroup-current-idx">1</span> of <span class="quizgroup-total-idx">0</span></span>\n'
        '      <div class="quizgroup-nav-right">\n'
        '        <button class="quizgroup-btn-next" type="button" title="Next Question">Next &rsaquo;</button>\n'
        '        <button class="quizgroup-btn-last" type="button" title="Last Question">Last &raquo;</button>\n'
        '      </div>\n'
        '    </div>\n'
    )


def _data_attrs(node):
    attrs = ['data-view-mode="wizard"', f'data-nav-position="{node.get("nav_position", "bottom")}"']
    if node.get("shuffle_questions"):
        attrs.append('data-shuffle-questions="true"')
    if node.get("num_questions") is not None:
        attrs.append(f'data-num-questions="{node["num_questions"]}"')
    if node.get("show_instant_feedback"):
        attrs.append('data-show-instant-feedback="true"')
    if node.get("enable_instant_feedback"):
        attrs.append('data-enable-instant-feedback="true"')
    return " ".join(attrs)


def visit_quizgroup_html(self, node):
    nav_pos = node.get("nav_position", "bottom")
    show_feedback = node.get("show_instant_feedback", False)
    enable_feedback = node.get("enable_instant_feedback", False)

    out = self.body.append
    out(f'<div class="quizgroup-block" {_data_attrs(node)}>')
    out('  <div class="quizgroup-header">')
    out('    <div class="quizgroup-top-row">')
    out('      <div class="quizgroup-progress-container">')
    out('        <div class="quizgroup-progress-text">Progress: <span class="quizgroup-progress-count">0%</span></div>')
    out('        <div class="quizgroup-progress-bar-bg"><div class="quizgroup-progress-bar-fill" style="width: 0%;"></div></div>')
    out('      </div>')
    out('      <div class="quizgroup-header-right">')
    out('        <div class="quizgroup-score-badge">Score: <span class="quizgroup-score-value">0</span> / <span class="quizgroup-total-value">0</span></div>')
    out('        <button class="quizgroup-btn-toggle" type="button">All Q Mode</button>')
    out('      </div>')
    out('    </div>')
    out('    <div class="quizgroup-action-bar">')
    out('      <button class="quizgroup-btn-start" type="button">Start Quiz</button>')
    out('      <button class="quizgroup-btn-check" type="button">Check Quiz Answers</button>')
    out('      <button class="quizgroup-btn-reset" type="button">Reset Quiz</button>')

    if show_feedback:
        checked = ' checked="checked"' if enable_feedback else ""
        out('      <label class="quizgroup-instant-feedback-label">')
        out(f'        <input type="checkbox" class="quizgroup-toggle-instant-feedback"{checked}> Instant Feedback')
        out('      </label>')

    out('    </div>')
    if nav_pos in ("top", "both"):
        out(_nav_bar())
    out('  </div>')
    out('  <div class="quizgroup-questions-container">')


def depart_quizgroup_html(self, node):
    nav_pos = node.get("nav_position", "bottom")
    out = self.body.append
    out('  </div>')
    if nav_pos in ("bottom", "both"):
        out(_nav_bar())
    out('  <div class="quizgroup-bottom-bar" style="display: none;">')
    out('    <button class="quizgroup-btn-scroll-top" type="button" title="Scroll to Top">&uarr; Back to Top</button>')
    out('  </div>')
    out('</div>')
