# tests/

Scratch space for skill outputs and gate fixtures produced while testing the erfana plugin locally.

## Layout

```
tests/
├── gate-02-fixtures/    – frontmatter-detector fixtures replayed by Gate 2
├── hooks/               – verify-completion + guard fixtures replayed by Gate 16
└── managing-skills/     – pilot notes and manual run records
```

## Convention

- One subfolder per skill or gate. Drop your run outputs anywhere underneath.
- Naming inside a subfolder is freeform – use `YYYY-MM-DD-<slug>/` if you want to keep parallel runs side by side.
- Treat the entire tree as ephemeral. Anything here can be deleted at any time.

## Git policy

Nothing here is locally ignored – every artifact you produce is visible to `git status` and can be committed. The repo-root `.gitignore` still applies (`.DS_Store`, editor cruft), but no `tests/`-specific exclusions are in effect.

## Not for

- Automated test suites of the plugin's behaviour – there are none (verification is done via `scripts/run-all-gates.sh` against source; the fixtures below are inputs to those gates, not a test suite of their own).
- Anything that should be reviewed in a PR – gate fixtures are the exception: `tests/gate-02-fixtures/` and `tests/hooks/` are read by CI and must be committed.
