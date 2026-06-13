# Security checklist – managing-issues

Validate security posture of skill operations. Score threshold: **10/12 items**.

---

## Section 1: Command injection prevention

- [ ] No raw user/issue input passed to `gh`/`git` without validation, sanitization, and a `--` operand separator (quoting alone does not stop flag injection)
- [ ] Untrusted free-text (issue/PR bodies, `<reason>`) written via `--body-file`, never inlined into a shell command
- [ ] Identifiers validated before shell use: issue/PR numbers digit-only, `owner/repo` format-checked, branch slug constrained to `[a-z0-9-]`

## Section 2: Agent isolation

- [ ] No agent spawns other agents (Task tool filtered for subagents)
- [ ] All agents have restricted `tools` in frontmatter (principle of least privilege)
- [ ] No agent has `Write` + `Bash` unless explicitly justified

## Section 3: Credential safety

- [ ] QG-7 secret scan is fail-closed across all text types (not `.ts`-only); any match is an automatic gate failure
- [ ] No credentials passed as agent prompt parameters
- [ ] `.env` files excluded from any file reading operations

## Section 4: Operation safety

- [ ] Destructive git operations (reset, force-push) require user confirmation
- [ ] Issue creation/modification requires explicit user approval
- [ ] Abort procedure does not delete branches without user confirmation

---

## Scoring

- Items checked: __ / 12
- **PASS** if ≥ 10/12
- **FAIL** if < 10/12
- Section 1 items are **blocking** – any failure is an automatic FAIL
