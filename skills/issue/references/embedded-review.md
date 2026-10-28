# Embedded review and fix (QG-4a, QG-8, QG-11a)

Implement reviews its own work without stopping for the user: it fans out reviewer agents in parallel, fixes what matters, and lets a separate judge decide when the rest is good enough. It runs three times:

- **QG-4a** reviews the design; **QG-4b** is the judge's ruling on those findings, and the design is revised before any code is written.
- **QG-8** reviews and fixes the implementation.
- **QG-11a** reviews and fixes the whole change set just before UAT.

Tier 1 runs only QG-8. The embedded reviews are agent fan-outs started from this skill – never `/erfana:lens-review` or any other skill or command, which would re-enter skill-level work and pour a second fan-out into this conversation.

## 1. Pick the lenses

| Reviewer | Include when |
|---|---|
| `architecture-reviewer` | Always |
| `solution-reviewer` | Always |
| `security-auditor` | Always – security is never dropped from a review |
| `code-reviewer` | Implementation reviews (not the design-only QG-4a) |
| `test-writer` | Implementation reviews – missing scenarios and coverage gaps |
| `ux-reviewer` | The change touches the UI |
| `refactor-advisor` | `refactor` label, or a reviewer flags structural debt |

Start three to five reviewers in one message, in parallel; batch beyond that. A reviewer that stalls is recorded as "not reviewed" and the run continues with the others' findings.

## 2. Brief each reviewer

Each reviewer gets a self-contained brief: the target (the plan, or the change-set file list), the issue and its acceptance criteria, the plan, its lens, and what it is not responsible for. It does not get the builder's reasoning or what the gate decides – a reviewer that knows the stakes judges less independently. It returns findings with severity (`critical`, `high`, `medium`, `low`), file, line, quoted text, the problem, and a fix. It looks something up on the web only when it meets a genuine unknown.

## 3. Consolidate

Merge duplicates, number the findings F1…Fn, and map every severity onto the four levels. A missing or unknown severity counts as `critical` – a finding is never dropped because its label was odd.

## 4. Fix by severity

| Severity | Action |
|---|---|
| Critical, high | Fixed now by the builder that owns the artifact (`mi-solution-designer` for the design, `software-developer` / `test-writer` for code), then re-checked |
| Medium, low | Sent to the judge |

## 5. The judge

`mi-solution-designer` in JUDGE mode receives the medium and low findings with the diff so far, and rules on each: **fix** (the benefit clearly outweighs the effort – it goes back to the builder), **accept as tech debt** (real, not worth blocking on – listed in the final account and the pull request), or **not worth it** (speculative or gold-plating – dropped with a one-line reason). Verdicts stick for the run: a finding already ruled "not worth it" or "tech debt" is not judged again when a later round re-reports it (same file, category, and description).

## 6. Stop

Each round of fixes counts once. The loop stops when no critical or high finding is open and the judge has ruled on every medium and low one – or after **three rounds**. At the cap, an open critical or high finding is escalated to the user or ends the run; it is never accepted as tech debt.

Fixes made in QG-11a come after QG-7 and QG-9 passed, so they count as post-review changes: re-run QG-7 when they touch security-relevant code, and take a fresh review snapshot when they pass.
