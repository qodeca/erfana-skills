# Gate 20 – design checker

**Type**: hard. **Runner order**: last, after Gate 19.

## What it enforces

The `design` skill's promises rest on `skills/design/scripts/check-design.mjs` and `build-tokens.mjs`. This gate runs `tests/design/run-fixtures.mjs`, which checks that:

- The template page passes.
- Each rule catches a page that breaks it. The fixtures mutate the template, one rule at a time.
- Comment blocks changed against a baseline fail, and so does a ready page that changed.
- Token levels and token drift are caught.
- The shipped sample in `skills/design/examples/web-sample/` still passes.

The last check keeps the sample current: a rule change that leaves it behind fails here.

## Fix

Fix the rule or the sample. When a new rule ships, add a mutation for it, because a rule without one is unproved.

## Run standalone

```bash
bash scripts/gate-20-design-checker.sh
```
