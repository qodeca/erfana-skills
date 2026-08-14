# Embedded review-and-fix protocol (autonomous)

The Implement operation reviews its own work **autonomously**: it fans out reviewer
**agents** in parallel, fixes what should be fixed, and a judgment step decides when the
work is good enough to stop. This protocol replaces the former user-run `/erfana:lens-review`
sub-gates (QG-4a, QG-11a) and the report-only Phase 8 fan-out. It is invoked by:

- **Phase 4 (QG-4a):** review of the **design** – findings drive automatic design revision.
- **Phase 8 (QG-8):** review-**and-fix** of the **implementation**.
- **Phase 11 (QG-11a):** the same review-and-fix of the whole change set, immediately before UAT.

---

## Hard constraint (never violated)

**The skill fans out agents directly. It MUST NOT invoke `/erfana:lens-review`, the Skill
tool, `SlashCommand`, or any other skill or slash command** – by any tool, at any step. A skill
invoking another skill violates the orchestrator-delegates-to-agents rule (SKILL.md rule 1),
re-enters skill-level work, and fans reviewers into the caller's context uncontrolled. This is
the central mechanism of the autonomous review: the embedded reviews are **agent fan-outs**, never
a lens-review invocation. Full reasoning: Rule 12 in [../operations/implement-rules.md](../operations/implement-rules.md).

---

## Step 1: Select the lenses (existing shared agents)

Reviewers are the plugin-root shared agents the operation already uses. Pick the set relevant to
the target; do **not** create new agents.

| Lens agent | Include when |
|------------|--------------|
| `architecture-reviewer` | Always |
| `solution-reviewer` | Always |
| `code-reviewer` | Always (implementation reviews; skip for a pure design review) |
| `security-auditor` | Always – QG-7 is mandatory on every tier, so the review never drops security |
| `test-writer` | Implementation reviews – coverage gaps, missing scenarios |
| `ux-reviewer` | `has_ui_impact = true` |
| `refactor-advisor` | `refactor` label, or a reviewer flags structural debt |

Respect the concurrency cap in [parallel-review.md](parallel-review.md): effective fan-out of
**3–5 reviewers per batch**, never more than ~10 concurrent. If more lenses are warranted than the
cap allows, dispatch in batches and consolidate per batch.

## Step 2: Dispatch reviewers in parallel

Spawn the batch in a **single message with multiple `Task` calls** (true parallel fan-out). Each
reviewer gets a **complete, self-contained payload** – subagents have no memory of orchestrator
context (the mandatory payload shape is in [parallel-review.md](parallel-review.md) "Dispatch
protocol"): the target (design doc, or the working-tree change-set file list), the issue and its
acceptance criteria, the approved plan, the reviewer's focus lens, and what it is NOT responsible
for. Each returns **severity-ranked findings** in the standard finding format of
[parallel-review.md](parallel-review.md) – reviewers request evidence via that structured output;
they are never asked to narrate internal reasoning.

### Step 2b: Conditional web research (not always-on)

A reviewer runs a **current-best-practices web lookup only when it hits a genuine unknown** – an
unfamiliar library, or an ambiguous / fast-moving API or pattern it cannot judge from the codebase
alone. It is a targeted lookup, not a default step: a reviewer that can judge the change from the
code and the plan does no web call. Reviewers without web tools skip it and flag the unknown as a
finding instead.

## Step 3: Consolidate

Deduplicate, renumber `F1-FN`, prioritise, and normalize/map severities onto the single finding
ladder per [parallel-review.md](parallel-review.md) "Consolidation rules" (off-vocabulary severity →
CRITICAL, fail-safe). Do not invent a parallel scheme. A reviewer that hits a genuine **contradiction**
(not a technical choice it can make itself) returns `needs_user_input` (SKILL.md rule 7) rather than
guessing – within an embedded review this is the only path back to the user, and only for a genuine
ambiguity, never a routine approval and never a technical/architecture question.

---

## Step 4: Fix authority by severity

**Severity normalization first (fail-safe – never drop a finding).** Before routing, normalize each
finding's severity to exactly one of `{critical, high, medium, low}` (case-insensitive). **Any
severity that is missing, empty, or off-vocabulary (`severe`, `warning`, `blocker`, `nit`, a number,
…) is treated as `critical`** — a finding never falls through the table below and is never silently
dropped. This is the same rule stated in [parallel-review.md](parallel-review.md) "Consolidation
rules"; apply it identically.

| Normalized severity | Action |
|----------|--------|
| **CRITICAL / HIGH** | **Auto-fixed and re-verified inline.** The implementation agents (design review: `mi-solution-designer` revising the design; implementation review: `software-developer` / `test-writer`) apply the fix; the orchestrator never edits. Re-verify the fix (re-run the relevant check) before the finding is marked resolved. **A CRITICAL/HIGH finding is never routed to the judge** — it is fixed or, at cap exhaustion, escalated (Step 6) |
| **MEDIUM / LOW** | **NOT auto-applied.** Routed to the judgment step (Step 5), which rules on each one |

**Every fix round is a loop iteration (Step 6).** Applying a fix and re-verifying it — whether the
re-verify is a full fan-out re-review or an inline check — is **one fix-application round** and
increments `embedded_loop_iter`. If an inline re-verify surfaces a *new* finding, resolving it is
the next round, not a free uncapped inner cycle. There is no unbounded fix→check→fix loop.

Fixes made during an implementation review land **after** QG-6/7/8/9 have already run, so they are
post-review changes by definition. Route them through the re-review decision matrix in
[post-review-tracking.md](post-review-tracking.md) against `last_review_tree`, then re-snapshot
`last_review_tree` once the required re-review passes.

## Step 5: The "good-enough" judge (anti-overengineering)

Delegate the triage to **`mi-solution-designer` in its JUDGE mode** — a second, guarded mode
documented in [../../../agents/mi-solution-designer.md](../../../agents/mi-solution-designer.md) alongside its
planning/verification mode (no new plugin-root agent). Give it `{findings[], diff}`: the **MEDIUM/LOW
findings together with the diff-so-far**. Its JUDGE-mode input contract accepts findings without
requiring `acceptance_criteria` / `affected_files`, and it returns a verdict table. It rules on
**each** finding by the cost/benefit rubric (effort to fix vs. risk/benefit of leaving it, anchored
on "good enough — do not overengineer"):

| Verdict | Meaning |
|---------|---------|
| **fix** | Benefit clearly outweighs effort – hand back to the implementation agent (a new fix round, Step 6), then re-verify |
| **accept-as-tech-debt** | Real but not worth blocking on – record it (carried to the Phase 12 / PR summary) |
| **not-worth-it** | Cost exceeds benefit, or speculative gold-plating – dropped with a one-line reason |

Only findings it rules `fix` cause more work — this is what stops gold-plating.

**Verdicts are sticky within the run.** Record every ruled-on finding's identity in run-state
(`judged_findings`, dedupe key = **file + category + description**). When a later delta review
re-emits a finding whose key is already recorded as `not-worth-it` or `accept-as-tech-debt`, **skip
it — do not re-judge it**. This prevents a dropped finding from being re-surfaced and re-litigated
each round. A finding previously ruled `fix` may re-appear only if its fix did not hold, in which
case it is a genuine unresolved finding, not a re-judge.

## Step 6: Hard iteration cap (anti-infinite-loop)

The review → fix → judge loop is bounded by its **own** counter, `embedded_loop_iter`, distinct from
the per-gate retry cap (Rule 6) and the Phase-12 `re_review_iterations` cap — see "Three distinct
iteration counters" (Rule 14a) in [../operations/implement-rules.md](../operations/implement-rules.md).

```
# Per embedded-review gate (QG-4a / QG-8 / QG-11a):
embedded_loop_iter = 0                      # init at gate entry
loop:
    findings = fan_out_and_consolidate()    # Steps 1-3 (normalize severities, Step 4)
    crit_high = [f for f in findings if f.sev in (critical, high) and not f.resolved]
    med_low   = [f for f in findings if f.sev in (medium, low)
                   and f.key not in judged_findings]   # sticky: skip already-ruled (Step 5)
    if not crit_high and not med_low:
        break                               # converged
    apply_fixes(crit_high)                  # auto-fix CRITICAL/HIGH
    verdicts = judge(med_low, diff)         # Step 5; record keys in judged_findings
    apply_fixes([f for f in verdicts if f.verdict == "fix"])
    embedded_loop_iter += 1                 # one fix-application round
    if embedded_loop_iter >= 3:
        break                               # cap reached
```

**At the cap (`embedded_loop_iter >= 3`), the split is mandatory:**

- **Unresolved CRITICAL/HIGH → ESCALATE to the user with the outstanding findings, or run the abort
  procedure ([../operations/implement-procedures.md](../operations/implement-procedures.md)). NEVER
  recorded as tech debt** — a live CRITICAL/HIGH must not pass a gate.
- **Unresolved MEDIUM/LOW → recorded as accepted tech debt**, surfaced in the phase summary and
  carried to the Phase 12 / PR summary.

**Resume behaviour:** `embedded_loop_iter` is session-local and **not read back on a resume** — a
resume that re-enters an embedded-review gate restarts that gate's loop at 0 (the working tree is
re-reviewed from scratch, so a persisted counter would be meaningless). `judged_findings` is likewise
re-derived within the resumed gate, not trusted from the block. Documented in
[post-review-tracking.md](post-review-tracking.md) and [run-state-resume.md](run-state-resume.md).

---

## Visibility (one-line summary, not a prompt)

On completion the gate emits a **single status line** – reviewers run, findings by severity,
auto-fixed count, judge verdicts (fixed / tech-debt / dropped), iterations used. It is a status
line the user can watch, **not** a blocking prompt: the autonomous stretch has no user gate before
UAT (QG-11).

## Result

The gate PASSes when: the reviewers ran, every CRITICAL/HIGH finding is resolved (or escalated),
the judge ruled on every remaining finding, any `fix` verdict was applied and re-verified, and –
for implementation reviews – the required re-review ran and `last_review_tree` was re-snapshotted.

---

## Related documentation

- [parallel-review.md](parallel-review.md) – fan-out payload, concurrency cap, finding format, severity normalization, consolidation
- [post-review-tracking.md](post-review-tracking.md) – the re-review decision matrix, `re_review_iterations`, and the run-state fields (`embedded_loop_iter`, `judged_findings`)
- [../operations/implement-rules.md](../operations/implement-rules.md) – Rule 12 (no skill invocation), Rule 13 (no technical prompts), Rule 14 (judge + `embedded_loop_iter` cap), Rule 14a (three distinct counters)
- [../../../agents/mi-solution-designer.md](../../../agents/mi-solution-designer.md) – the JUDGE mode input contract and verdict schema
