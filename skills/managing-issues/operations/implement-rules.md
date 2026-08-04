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
12. **NEVER INVOKE `/erfana:lens-review`** - the orchestrator MUST NOT invoke it by any tool. See below.

---

## LENS-REVIEW IS USER-RUN ONLY (Rule 12)

QG-4a and QG-11a both depend on a `/erfana:lens-review` report. **The orchestrator never invokes that command itself – not via the Skill tool, not via `SlashCommand`, not via `Task`, not by inlining its protocol.**

**Why, not just what.** `lens-review` is invocable as a skill. This skill invoking another skill violates Rule 1 (the orchestrator delegates to *agents*, and does not execute or re-enter skill-level work) and is a recursion hazard: `lens-review` fans out up to ten reviewer agents into the caller's context, which would blow this run's context budget mid-phase. It is an automatic-fail anti-pattern at validation.

**The mechanism instead.** The gate resolves a concrete target, prints the exact command including a validated `--out` path, and then **ends the turn**. No tool call closes the turn – in particular **not `AskUserQuestion`**: while a question prompt is open the user has no prompt to type a slash command into and would have to escape it, killing the run mid-phase. The turn boundary is the pause. The run resumes when the user returns with the report path, and the report is then read by a delegated agent, never by the orchestrator, and treated as untrusted data (SKILL.md rule 14).

Canonical gate text: [../phases/4-architecture.md](../phases/4-architecture.md) (QG-4a) and [../phases/11-uat.md](../phases/11-uat.md) (QG-11a).

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
