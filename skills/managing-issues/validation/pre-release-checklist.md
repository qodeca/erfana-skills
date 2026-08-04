# Pre-release checklist – managing-issues

Validate skill integrity before deployment. Score threshold: **18/20 items**.

---

## Section 1: Phase integrity

- [ ] All 13 phases present (0-12) in implement operation – sub-gates add gates, never phases
- [ ] Phase numbering sequential with no gaps
- [ ] Each phase has a corresponding file in `phases/`
- [ ] Phase overview table in implement.md matches phase files, including the sub-gate columns for Phases 4 and 11

## Section 2: Agent delegation compliance

- [ ] No direct file reading/analysis in orchestrator
- [ ] No direct code generation in orchestrator
- [ ] All `allow_direct: false` phases use agent delegation
- [ ] Agent invocations use `Agent tool: subagent_type:` format

## Section 3: Quality gate completeness

- [ ] All 16 gates defined: 13 phase gates (QG-0 through QG-12) plus the 3 sub-gates QG-4a, QG-4b, QG-11a
- [ ] QG-0, QG-7, QG-9 marked as non-overridable; the 3 sub-gates non-skippable once the run's `review_level` puts them in scope
- [ ] Each gate has explicit pass/fail criteria – Automated gates a concrete exit-code predicate, Checkpoint and User-Approval gates an `AskUserQuestion` call, User-Run Review gates a returned report path
- [ ] Retry logic (max 3) present in all phase files

## Section 4: Contract compliance

- [ ] `needs_user_input` contract documented in SKILL.md
- [ ] Agent invocation protocol documented in SKILL.md
- [ ] All agents have `capabilities` in frontmatter

## Section 5: File and structure compliance

- [ ] All files ≤ 500 lines
- [ ] No file reference nesting deeper than one level
- [ ] All referenced files exist
- [ ] No orphan files (every file referenced from at least one other)

---

## Scoring

- Items checked: __ / 20
- **PASS** if ≥ 18/20
- **FAIL** if < 18/20 – fix failing items before release
- Section 1 and Section 2 items are **blocking** – any failure in these sections is an automatic FAIL regardless of total score
