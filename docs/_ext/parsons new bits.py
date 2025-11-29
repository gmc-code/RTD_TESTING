expected_json_node = nodes.raw(
    "",
    f'<script type="application/json" id="{widget_id}-expected">{json.dumps(expected_order, separators=(",", ":"))}</script>',
    format="html")
