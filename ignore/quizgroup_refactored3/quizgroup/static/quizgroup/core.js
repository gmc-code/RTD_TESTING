/*
 * QuizGroup core: namespace, adapter registry and shared utilities.
 *
 * An ADAPTER teaches the quiz controller how to handle one kind of question
 * block. Each question type lives in its own file under adapters/ and calls
 * QuizGroup.register({...}). The controller (group.js) never mentions a
 * specific question type, so adding one never touches the controller.
 *
 * Adapter contract
 * ----------------
 * Required:
 *   name              unique id, e.g. "gapfill"
 *   label             shown in "All Q" mode headers, e.g. "GapFill"
 *   selector          CSS selector that matches the question's root element
 *   points(block)             -> number   max score for this question
 *   isAnswered(block)         -> boolean  any input given (drives progress %)
 *   setLocked(block, locked)  disable / enable user interaction
 *   clearValidation(block)    remove correct/incorrect marking
 *   reset(block)              return the question to its pristine state
 *   evaluate(block, ctx)      -> { score, maxScore, settled }
 *       ctx.instant  true when marking live (instant feedback), false on "Check"
 *       ctx.trigger  "input" | "change" | "commit" | "poll" | "check" | "reset"
 *       settled      true once the question should be locked (instant mode only)
 * Optional:
 *   isFullyAnswered(block)    defaults to isAnswered
 *   panelSelector             the question's own Check/Reset panel; the quiz
 *                             removes it because the quiz has global controls
 *   commitSelector            inputs whose blur / Enter key fires a "commit"
 *                             evaluation (e.g. free-text fields)
 *   observe(block, notify)    watch the DOM for changes the quiz can't see via
 *                             events; call notify() when something changed
 *   needsPolling              true if state changes after click/drag without
 *                             a DOM event the quiz can listen to
 */
(function (global) {
    "use strict";

    const adapters = [];
    const REQUIRED = [
        "name", "label", "selector", "points", "isAnswered",
        "setLocked", "clearValidation", "reset", "evaluate",
    ];

    const QuizGroup = {
        adapters,

        register(adapter) {
            const missing = REQUIRED.filter((key) => !(key in adapter));
            if (missing.length) {
                console.error(`[quizgroup] adapter "${adapter.name || "?"}" is missing: ${missing.join(", ")}`);
                return;
            }
            const full = Object.assign(
                { panelSelector: "", needsPolling: false, isFullyAnswered: adapter.isAnswered },
                adapter
            );
            const existing = adapters.findIndex((a) => a.name === full.name);
            if (existing >= 0) adapters[existing] = full; // allows a project to override a built-in
            else adapters.push(full);
        },

        adapterFor(block) {
            return adapters.find((a) => block.matches(a.selector)) || null;
        },

        blockSelector() {
            return adapters.map((a) => a.selector).join(", ");
        },

        panelSelector() {
            return adapters.map((a) => a.panelSelector).filter(Boolean).join(", ");
        },

        util: {
            shuffle(arr) {
                for (let i = arr.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                }
                return arr;
            },
        },
    };

    global.QuizGroup = QuizGroup;
})(window);
