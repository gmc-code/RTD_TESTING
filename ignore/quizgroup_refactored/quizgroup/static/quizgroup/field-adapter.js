/*
 * QuizGroup.createFieldAdapter(config)
 *
 * Many question types are "a set of input/select fields, each with one
 * correct value" (gap fill, fill-in, classifying...). This factory builds a
 * complete adapter for them so each type only declares what is different.
 *
 * config:
 *   name, label, selector, panelSelector   as per the adapter contract
 *   fieldSelector     selector for the answer fields inside the block
 *   expected(field)   -> correct value (default: field.dataset.correct)
 *   normalise(str)    applied to value and expected (default: trim)
 *   isCorrect(value, expected, field)      (default: strict equality)
 *   badgeClass        class of the sibling element showing a tick / answer
 *   rowSelector       per-field row to colour (matched to fields by index)
 *   rowCorrect / rowIncorrect              row classes
 *   defer(block, ctx)                      true => skip evaluating this time
 *   allowPartialInstant(block, ctx)        true => mark filled fields even
 *                                          when some are still empty
 *   commitSelector    see adapter contract
 */
(function (QG) {
    "use strict";

    QG.createFieldAdapter = function (config) {
        const c = Object.assign(
            {
                panelSelector: "",
                badgeClass: null,
                rowSelector: null,
                rowCorrect: "correct-line",
                rowIncorrect: "incorrect-line",
                expected: (f) => f.dataset.correct || "",
                normalise: (s) => s.trim(),
                isCorrect: (value, expected) => value === expected,
                defer: () => false,
                allowPartialInstant: () => false,
            },
            config
        );

        const fields = (block) => Array.from(block.querySelectorAll(c.fieldSelector));
        const rows = (block) => (c.rowSelector ? Array.from(block.querySelectorAll(c.rowSelector)) : []);
        const valueOf = (f) => c.normalise(f.value);

        function badgeOf(f) {
            const el = f.nextElementSibling;
            return c.badgeClass && el && el.classList.contains(c.badgeClass) ? el : null;
        }

        function setBadge(f, text, state) {
            const badge = badgeOf(f);
            if (!badge) return;
            badge.textContent = text;
            badge.className = c.badgeClass + (state ? ` text-${state}` : "");
        }

        function clearField(f) {
            f.classList.remove("correct", "incorrect");
            setBadge(f, "", null);
        }

        function clearRows(block) {
            rows(block).forEach((r) => r.classList.remove(c.rowCorrect, c.rowIncorrect));
        }

        const isFull = (block) => {
            const fs = fields(block);
            return fs.length > 0 && fs.every((f) => valueOf(f) !== "");
        };

        const adapter = {
            name: c.name,
            label: c.label,
            selector: c.selector,
            panelSelector: c.panelSelector,
            commitSelector: c.commitSelector,

            points: (block) => fields(block).length,
            isAnswered: (block) => fields(block).some((f) => valueOf(f) !== ""),
            isFullyAnswered: isFull,

            setLocked: (block, locked) => fields(block).forEach((f) => (f.disabled = locked)),

            clearValidation(block) {
                fields(block).forEach(clearField);
                clearRows(block);
            },

            reset(block) {
                fields(block).forEach((f) => {
                    f.value = "";
                    clearField(f);
                });
                clearRows(block);
            },

            evaluate(block, ctx) {
                const fs = fields(block);
                const max = fs.length;
                const none = { score: 0, maxScore: max, settled: false };

                if (c.defer(block, ctx)) return none;

                const full = isFull(block);
                if (ctx.instant && !full && !c.allowPartialInstant(block, ctx)) {
                    adapter.clearValidation(block);
                    return none;
                }

                const rowEls = rows(block);
                let score = 0;

                fs.forEach((f, i) => {
                    const row = rowEls[i];
                    clearField(f);
                    if (row) row.classList.remove(c.rowCorrect, c.rowIncorrect);

                    const value = valueOf(f);
                    if (ctx.instant && value === "") return; // don't mark untouched fields live

                    const expected = c.normalise(c.expected(f));
                    if (value !== "" && c.isCorrect(value, expected, f)) {
                        score++;
                        f.classList.add("correct");
                        setBadge(f, " ✓", "correct");
                        if (row) row.classList.add(c.rowCorrect);
                    } else {
                        f.classList.add("incorrect");
                        setBadge(f, ` ✕ (Ans: ${expected})`, "incorrect");
                        if (row) row.classList.add(c.rowIncorrect);
                    }
                });

                return { score, maxScore: max, settled: ctx.instant && full };
            },
        };

        return adapter;
    };
})(window.QuizGroup);
