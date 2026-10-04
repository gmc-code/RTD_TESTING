# quizgroup 2.0

Sphinx extension providing `.. quizgroup::`, which wraps your question directives
(multichoice, cloze, gapfill, classifying, fill-in, ...) in one quiz with a wizard
view, progress bar, score, Start / Check / Reset and optional instant feedback.

## Install (replaces the old single-file version)

1. **Delete** the old `quizgroup.py`, and `quizgroup.js` / `quizgroup.css` from your `_static`.
2. Put the `quizgroup/` folder where `quizgroup.py` used to live (anywhere on `sys.path`,
   e.g. next to `conf.py` or in your `extensions/` folder).
3. `conf.py` is unchanged: `extensions = [..., "quizgroup"]`.

RST usage and all options (`:shuffle-questions:`, `:num-questions:`, `:nav-position:`,
`:show-instant-feedback:`, `:enable-instant-feedback:`, underscore spellings too) are unchanged.
Generated HTML is identical, so existing pages and CSS keep working.

Needs Sphinx >= 3.0. Output goes to `_static/quizgroup/`.

## Layout

```
quizgroup/
  __init__.py      setup() + auto-discovery of adapters
  directive.py     the directive (options only)
  nodes.py         docutils node + HTML output
  static/quizgroup/
    core.js            registry + shared utilities + the adapter contract (read this first)
    field-adapter.js   factory for "set of inputs" question types
    adapters/          ONE .js (+ optional .css) PER QUESTION TYPE
      multichoice  cloze  gapfill  classifying  fillin
    group.js           quiz controller: knows nothing about question types
    init.js            bootstrap (idempotent)
    quizgroup.css      quiz chrome only (buttons, progress, nav)
```

Why this stays maintainable: the controller talks only to the adapter registry, so a
question type's logic, its styling and its quirks live in one small file. A bug in
fill-in can't be hiding in cloze code, and the controller never grows.

## Adding a new question type

1. Copy `docs/adapter-template.js` to `static/quizgroup/adapters/<name>.js`.
2. Fill in the adapter (use `createFieldAdapter` if it's "inputs with a correct value",
   otherwise implement the contract in `core.js`).
3. Optional: add `<name>.css` beside it for locked/correct/incorrect styling.
4. Rebuild the docs. No Python or controller edits.

To add a type from your own project instead (without touching this package), call
`app.add_js_file("my-adapter.js")` in your `conf.py` `setup(app)`; it just has to register
before the page finishes loading. Registering an adapter with an existing `name` replaces the
built-in one, which is how you override behaviour per project.

## Behaviour changes vs 1.x (all internal)

* Per-type logic moved to `adapters/*.js`; duplicated gapfill/fill-in/classifying logic is now one factory.
* Lock/"checked" bookkeeping happens once in the controller; adapters just report `settled`.
* Fill-in's "evaluate on blur/Enter" is now a generic `commitSelector` instead of a hard-coded class.
* The 50 ms polling after clicks only runs when the quiz contains a type that declares `needsPolling` (cloze).
* `init.js` ignores blocks that are already initialised.
