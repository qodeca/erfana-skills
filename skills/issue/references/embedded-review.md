# Embedded review and fix (QG-4a, QG-8, QG-11a)

Implement reviews its own work without stopping for the user: it fans out reviewer agents in parallel, has a separate checker test the serious findings, fixes what holds up, and lets a separate judge decide when the rest is good enough. It runs three times:

- **QG-4a** reviews the design; **QG-4b** is the judge's ruling on those findings, and the design is revised before any code is written.
- **QG-8** reviews and fixes the implementation.
- **QG-11a** reviews and fixes the whole change set just before UAT.

Tier 1 runs only QG-8. The embedded reviews are agent fan-outs started from this skill – never `/erfana:lens-review` or any other skill or command, which would re-enter skill-level work and pour a second fan-out into this conversation.

## 1. Pick the lenses

| Reviewer | Include when |
|---|---|
| `architecture-reviewer` | Always; with the `refactor` label, or when a reviewer flags structural debt, also ask it for a refactoring plan |
| `solution-reviewer` | Always |
| `security-auditor` | Always – security is never dropped from a review |
| `code-reviewer` | Implementation reviews (not the design-only QG-4a) |
| `code-reviewer` (coverage lens) | Implementation reviews – a second brief for missing scenarios and coverage gaps; `test-writer` writes the tests, so it does not review them |
| `ux-reviewer` | The change touches the UI |

Start three to five reviewers in one message, in parallel; batch beyond that. A reviewer that stalls is recorded as "not reviewed" and the run continues with the others' findings – except `security-auditor`: start it once more, and if it stalls again the gate fails and goes to the user.

## 2. Brief each reviewer

Each reviewer gets a self-contained brief: the target (the plan, or the change-set file list), the issue and its acceptance criteria, the plan, its lens, and what it is not responsible for. It does not get the builder's reasoning or what the gate decides – a reviewer that knows the stakes judges less independently. It returns findings with severity (`critical`, `high`, `medium`, `low`), file, line, quoted text, the problem, and a fix. It looks something up on the web only when it meets a genuine unknown.

## 3. Consolidate

Merge duplicates, number the findings F1…Fn, and map every severity onto the four levels. A missing or unknown severity counts as `critical` – a finding is never dropped because its label was odd.

## 4. Check the critical and high findings

A reviewer asked to look for problems reports some that are not real, and a fix for a problem that is not there adds code and risk. Before anything is fixed, send the critical and high findings to `finding-verifier` in batches of at most eight, the batches in parallel, each with the target, the issue and its acceptance criteria, and the plan – not the reviewers' reasoning or the builder's. It rules each finding **confirmed**, **rejected**, or **not proven**, with the text that shows it.

| Ruling | What happens |
|---|---|
| Confirmed | Fixed now (step 5) |
| Not proven | Fixed now (step 5) – a serious finding nobody could disprove is treated as real |
| Rejected | Not fixed; listed in the final account with the ruling's reason and quote |
| Rejected, from `security-auditor` | Not fixed and not closed: shown to the user at UAT with the ruling, who decides |

A batch that fails twice leaves its findings unchecked, and they are fixed as if confirmed. A ruling sticks for the run, the same way a judge's verdict does: a rejected finding that a later round re-reports (same file, category, and description) is not checked again. Medium and low findings skip this step – the judge already rules on them.

## 5. Fix by severity

| Severity | Action |
|---|---|
| Critical, high (confirmed or not proven in step 4) | Fixed now by the builder that owns the artifact (`issue-solution-designer` for the design, `software-developer` / `test-writer` for code), then re-checked |
| Medium, low | Sent to the judge |

## 6. The judge

`issue-solution-designer` in JUDGE mode receives the medium and low findings with the diff so far, and rules on each: **fix** (the benefit clearly outweighs the effort – it goes back to the builder), **accept as tech debt** (real, not worth blocking on – listed in the final account and the pull request), or **not worth it** (speculative or gold-plating – dropped with a one-line reason). Verdicts stick for the run: a finding already ruled "not worth it" or "tech debt" is not judged again when a later round re-reports it (same file, category, and description).

## 7. Stop

Each round of fixes counts once. The loop stops when no critical or high finding is open – a rejected one is not open, except a security finding waiting for the user – and the judge has ruled on every medium and low one – or after **three rounds**. At the cap, an open critical or high finding is escalated to the user or ends the run; it is never accepted as tech debt.

Fixes made in QG-11a come after QG-7 and QG-9 passed, so they count as post-review changes: re-run QG-7 when they touch security-relevant code, and take a fresh review snapshot when they pass.
