# Gate 20 – design checker

**Type**: hard. **Runner order**: last, after Gate 19.

## What it enforces

The `design` skill's promises rest on `skills/design/scripts/check-design.mjs`, `build-tokens.mjs`, and `build-index.mjs`. This gate runs `tests/design/run-fixtures.mjs` and `fixtures-pages.mjs`, which check that:

- Every template page passes.
- Each rule catches a page that breaks it. The fixtures mutate the template, one rule at a time, and the newer ones also name the expected message.
- Comment blocks changed against a baseline fail, and so does a ready state that changed.
- The date rule holds: a page whose newest date is stale fails, and so does a changed state that kept an old date.
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

## Fix

Fix the rule or the sample. When a new rule ships, add a mutation for it, because a rule without one is unproved.

## Run standalone

```bash
bash scripts/gate-20-design-checker.sh
```
