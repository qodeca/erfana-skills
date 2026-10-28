# Implement operation – enforcement rules

These rules are extracted from the main implement operation for reference. See [implement.md](implement.md) for the full workflow.

---

## CRITICAL ENFORCEMENT RULES

**These rules are NON-NEGOTIABLE. Violations are automatic failures.**

1. **NO PHASE SKIPPING** - ALL phases MUST execute (Tier determines depth, not skip)
2. **QUALITY GATES MANDATORY** - Every phase ends with a Quality Gate. Phases 4 and 11 additionally carry lettered sub-gates (QG-4a, QG-4b, QG-11a) that run inside the phase; the phase is complete only when all of its gates have passed
3. **SEQUENTIAL EXECUTION** - Phase N cannot start until QG-(N-1) = PASS
4. **INPUT CONDITIONS REQUIRED** - Phase CANNOT start if any input condition unchecked
5. **OUTPUT CONDITIONS REQUIRED** - Phase CANNOT complete if any output condition unchecked
6. **3-RETRY LIMIT** - Max 3 retries per phase, then ESCALATE to user
7. **STOP ON FAIL** - If Quality Gate = FAIL after 3 retries, STOP workflow
8. **SOURCE BRANCH REQUIRED** - Implementation MUST start from the repo's default branch (`BASE_BRANCH`, detected at QG-0); the same branch is the diff base, merge target, and abort-cleanup target
9. **CODE REVIEW MANDATORY** - ALL file modifications MUST pass review (Phase 8)
10. **SPEC-READY MODE** - When `spec_maturity >= complete`, phases 1-4 execute in validation mode (reduced depth, same gates). Spec-maturity determines discovery vs validation; tier determines checkpoint frequency.
11. **QG-8/QG-9 SEPARATION** - QG-8 owns code quality exclusively. QG-9 owns plan conformance and acceptance criteria exclusively. Neither re-checks the other's domain.
12. **NEVER INVOKE `/erfana:lens-review` OR ANY SKILL/SLASH COMMAND** - the embedded reviews are agent fan-outs. See below.
13. **AUTONOMOUS UNTIL UAT** - no blocking `AskUserQuestion` between run start and Phase 11. See below.
14. **JUDGE + HARD ITERATION CAP** - the review→fix loop is bounded by the good-enough judge and `embedded_loop_iter` (3 rounds). See below. (14a distinguishes the three counters.)

---

## EMBEDDED REVIEWS ARE AGENT FAN-OUTS, NEVER A LENS-REVIEW INVOCATION (Rule 12)

QG-4a and QG-11a review the design and the change set. They do so by **fanning out the operation's own reviewer agents in parallel** – they do **not** depend on a `/erfana:lens-review` report. **The orchestrator never invokes that command, or any other skill or slash command – not via the Skill tool, not via `SlashCommand`, not via `Task` targeting a skill, not by inlining its protocol.**

**Why, not just what.** `lens-review` is invocable as a skill. This skill invoking another skill violates Rule 1 (the orchestrator delegates to *agents*, and does not execute or re-enter skill-level work) and is a recursion hazard: `lens-review` fans out up to ten reviewer agents into the caller's context, which would blow this run's context budget mid-phase. It is an automatic-fail anti-pattern at validation.

**The mechanism instead.** Each embedded review runs the protocol in [../reference/embedded-review-and-fix.md](../reference/embedded-review-and-fix.md): select the relevant shared reviewer agents (`architecture-reviewer`, `solution-reviewer`, `security-auditor`, `code-reviewer`, `test-writer`, `ux-reviewer`), dispatch them in parallel under the concurrency cap in [../reference/parallel-review.md](../reference/parallel-review.md), aggregate severity-ranked findings, and let the judgment step (`mi-solution-designer`) triage them. No turn ends, no user hand-off, no report path is pasted.

Canonical gate text: [../phases/4-architecture.md](../phases/4-architecture.md) (QG-4a, QG-4b) and [../phases/11-uat.md](../phases/11-uat.md) (QG-11a).

---

## NO TECHNICAL PROMPTS; REQUIREMENTS ARE CLARIFIED (Rule 13)

**The operation issues no blocking architecture/technical `AskUserQuestion`.** Every design, pattern, data-model, API, library, file-layout, test-strategy and process decision is resolved autonomously by best practice + conditional web research + judgment, recorded, and summarised. But it **does** clarify requirements: *what* the change should do is a human decision, *how* to build it is not.

- Every pre-UAT **technical** gate – **QG-3, QG-4, QG-4b, QG-6, QG-8, and QG-9's Definition-of-Done confirmation** – is a **non-blocking judgment gate**: evaluate its pass predicate against agent output, record the result, emit a one-line status summary, and proceed. The plan and the architecture are produced and recorded; the run does not wait for a reply.
- The **allowed human interactions** are exactly six: (a) **requirements clarification in Phase 2 Step 3** — product/scope/acceptance-criteria ambiguities only, never technical; (b) **UAT (QG-11)**; (c) the **QG-12** git-action confirmation (commit, push, merge, branch deletion); (d) the **QG-0 public-repo run-state consent**; (e) a reviewer **`needs_user_input`** on a genuine contradiction (Rule 7); (f) the **resume-point confirmation**. QG-0 does **not** prompt for task-type or review-level — both are auto-inferred and recorded.
- **Failure in the non-blocking stretch (QG-5 through QG-9, and the judgment gates):** auto-retry up to the per-gate retry cap (Rule 6), **then** surface to the user. Never escalate on first failure.
- **Visibility:** emit a one-line summary at each phase/gate boundary (the task-list advance already required). It is a status line, not a prompt.
- Autonomous technical decisions are made on the record: Phase 4 Step 2a's missing-test-harness choice defaults to **building the harness** when feasible, else **accept-as-gap** with a written justification – never a silent descope – and the choice is surfaced in the phase summary.

---

## GOOD-ENOUGH JUDGE + HARD ITERATION CAP (Rule 14)

The embedded reviews (QG-4a, QG-8, QG-11a) auto-fix **CRITICAL/HIGH** findings inline and route **MEDIUM/LOW** findings to **`mi-solution-designer` in a cost/benefit triage capacity** (its JUDGE mode — see [../../../agents/mi-solution-designer.md](../../../agents/mi-solution-designer.md)), which rules on each finding: **fix / accept-as-tech-debt / not-worth-it**. Only `fix` verdicts create more work – this is the anti-overengineering mechanism.

**The loop counter is `embedded_loop_iter`, a distinct counter (see "Three counters" below).** It initialises at 0 at gate entry and **increments once per fix-application round** — a full fan-out re-review *and* an inline re-verify that surfaces a new finding each count as a round. At **`embedded_loop_iter >= 3` the loop stops**:

- **Unresolved CRITICAL/HIGH → ESCALATE to the user or run the abort procedure. Never recorded as tech debt** — a live CRITICAL must not pass.
- **Unresolved MEDIUM/LOW → recorded as accepted tech debt** and carried to the Phase 12 / PR summary.

Judge verdicts are **sticky within a run**: a finding already ruled `not-worth-it` or `accept-as-tech-debt` (dedupe key = file + category + description) is not re-judged if a later delta review re-emits it. Protocol: [../reference/embedded-review-and-fix.md](../reference/embedded-review-and-fix.md).

---

## THREE DISTINCT ITERATION COUNTERS (Rule 14a)

Three caps exist; they are **independent counters**, not one shared budget. All use the same "3" magnitude but count different events:

| Counter | Scope | Convention | At limit |
|---|---|---|---|
| **Per-gate retry cap** (Rule 6) | one quality gate failing its predicate | max **3 retries** = 4 attempts | escalate to user |
| **`embedded_loop_iter`** (Rule 14) | one embedded review gate's review→fix→judge loop (QG-4a / QG-8 / QG-11a) | max **3 fix-application rounds** | escalate CRIT/HIGH, tech-debt MED/LOW |
| **`re_review_iterations`** ([../reference/post-review-tracking.md](../reference/post-review-tracking.md)) | Phase 12 pre-commit re-review of post-UAT changes | max **3 iterations** | escalate to user (loop not converging) |

They **nest, they do not share**: a single embedded-review gate may exhaust `embedded_loop_iter` (its own loop), and that gate as a whole may then be retried under the per-gate retry cap; the Phase-12 counter is a separate, later mechanism. "Retries" (Rule 6, additional attempts after the first) and "iterations" (Rules 14/12, total rounds counted from 1) are deliberately different conventions and are not interchanged.

---

## CODE REVIEW ENFORCEMENT (Rule 9)

**Reference:** `../reference/code-review-standards-2025.md`

**ALL file-modifying operations MUST complete Phase 8 (Quality Review) using agents with:**
- `code-reviewer` capability (primary)
- `architecture-reviewer` capability (Tier 2)
- `code-reviewer` capability (legacy support)

**Review Dimensions (MANDATORY):** stack-conditional dimensions apply only when the project uses that stack (detected at QG-0 / Phase 3); they are skipped, not failed, on other stacks.

| Dimension | Tier 1 | Tier 2 | Blocking | Applies when |
|-----------|:------:|:------:|:--------:|--------------|
| General Security | ✅ | ✅ | YES | always |
| Type Safety | ✅ | ✅ | YES | typed language detected (TypeScript, etc.) |
| Electron/desktop Security | ✅ | ✅ | YES | Electron/desktop project detected |
| Web/frontend Security (XSS, CSP) | ✅ | ✅ | YES | web frontend detected |
| SOLID Principles | Basic | Full | Tier 2 | always |
| Code Smells | Critical | All | Tier 2 | always |
| Complexity | <20 | <15 | YES when measured | a complexity analyser is present |
| Test Coverage | ≥70% | ≥80% | YES when measured | a coverage reporter is present |

**Measure-or-declare rule (applies to both metric rows above).** No phase in this workflow runs a coverage or complexity tool on the orchestrator's behalf, so the thresholds bind only on a real number:

- **Tooling present** → run it, read the reported figure, and gate on it. Below threshold = blocking failure at QG-8.
- **Tooling absent** → record `not measured` for that metric and proceed. Do **not** assert the threshold was met, and do not fail the gate for the absence.

The threshold values themselves are unchanged; what is stated here is when they are enforceable. Same rule at every site that repeats these numbers ([phases/8-quality-review.md](../phases/8-quality-review.md) Steps 5-6 and QG-8, [reference/code-review-standards-2025-dimensions.md](../reference/code-review-standards-2025-dimensions.md) sections 8-9).

**NO file can be committed without passing Phase 8 review.**

**CRITICAL issues block all progress. No override allowed.**
