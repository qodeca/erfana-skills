# Gate 20 – design checker

**Type**: hard. **Runner order**: last, after Gate 19.

## What it enforces

The `design` skill's promises rest on `skills/design/scripts/check-design.mjs`, `build-tokens.mjs`, and `build-index.mjs`. This gate runs `tests/design/run-fixtures.mjs`, with `fixtures-pages.mjs`, `fixtures-bypass.mjs`, `fixtures-cli.mjs`, and `csp-browser.mjs`, which check that:

- Every template page passes.
- Each rule catches a page that breaks it. The fixtures mutate the template, one rule at a time, and the newer ones also name the expected message.
- Every payload from the PR 86 review of the checker fails, each named by its finding: pages built to reach a browser while the checker reads something else. Ordinary work that a narrow form could break, such as a word in quotes that looks like a colour, must pass.
- The real commands run as processes, with exit codes asserted: 0 clean, 1 on a problem, 2 on bad arguments, including a baseline flag with no value. They also run through a symbolic link, because that once meant a silent pass.
- A temporary git repository proves that a later commit and a saved comment do not fail a page, that a real design change still does, that a large page is compared rather than treated as new, that line endings alone change nothing, and that a config planted in a page folder runs nothing.
- The page policy works in a real browser: a local stylesheet, an import, a font, and images load on `file://` and on a sandboxed local page, and a remote image does not. A control run with the old, weaker policy must fail. With no Chrome or Chromium, or no way to start one, this step prints `SKIP:` and the gate goes on. It does not test `erfana-preview://`, which only the app serves.
- Comment blocks changed against a baseline fail, and so does a ready state that changed.
- The date rule holds: a page whose newest date is stale fails, and so does a changed state that kept an old date, while a saved comment and a generated index do not.
- A state with no rectangle, or a rectangle after its frame, fails.
- An unclosed tag or a stray closing tag fails [balance], and so does a fixed-width frame inside the `.ds-frames` grid [frames].
- A stale index fails, and the builder refuses a comment block inside a generated region and leaves the file as it was.
- The system index builds "Start here by task" from each page's `<meta name="design-tasks">`, and "Which card owns this token" from each `#tokens` table.
- A `docs.css`, `docs-tokens.css`, or `fonts.css` in `design-system/` that differs from the skill's template fails [copies].
- An area's `index.html` of kind `index` is listed as the area's overview, not as a screen.
- Templates carry nothing that must not ship, and each font has its licence sidecar.
- Token levels and token drift are caught.
- The shipped sample in `skills/design/examples/web-sample/` still passes.

The last check keeps the sample current: a rule change that leaves it behind fails here.

A pass does not prove a page is visible as drawn. The fixtures read files, so a browser look stays part of the review.

Gate 20 also runs in the `windows-latest` CI job, because line endings and paths behave differently there. A step that needs a symbolic link prints `SKIP:` if Windows refuses one with `EPERM`.

## Fix

Fix the rule or the sample. When a new rule ships, add a mutation for it, because a rule without one is unproved.

## Run standalone

```bash
bash scripts/gate-20-design-checker.sh
```
