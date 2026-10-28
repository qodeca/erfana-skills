# Parallel review protocol

Defines how to dispatch multiple review agents simultaneously and consolidate findings into a unified action plan. Used by the embedded review-and-fix protocol ([embedded-review-and-fix.md](embedded-review-and-fix.md)) at Phase 4 (QG-4a design review), Phase 8 (QG-8 quality review-and-fix) and Phase 11 (QG-11a pre-UAT review-and-fix).

---

## When to use

- At QG-4a (Phase 4) for the embedded design review fan-out
- At QG-8 (Phase 8) for the embedded implementation review-and-fix
- At QG-11a (Phase 11) for the embedded pre-UAT review-and-fix
- Autonomously (no user opt-in) – the embedded protocol runs these on every applicable `review_level`

---

## Reviewer roles

| Reviewer | Focus area | NOT responsible for |
|----------|-----------|---------------------|
| code-reviewer | Code quality, smells, complexity, naming | Architecture, security |
| architecture-reviewer | SOLID, coupling, patterns, design | Code style, security |
| security-auditor | Vulnerabilities, secrets, injection, OWASP | Code quality, architecture |
| test-writer | Coverage gaps, test quality, missing scenarios | Code implementation |

---

## Dispatch protocol

1. **Identify scope:** list the working-tree change set – `{ git diff --name-only; git diff --cached --name-only; git ls-files --others --exclude-standard; } | sort -u`. During an implement run nothing is committed before Phase 12, so a `<base>...HEAD` range would return nothing ([../operations/implement.md](../operations/implement.md))
2. **Dispatch reviewers in parallel, respecting the concurrency cap.** The Task platform runs at most ~10 concurrent agents; keep an effective fan-out of **3–5 reviewers per batch**. If more reviewers are warranted than the cap allows, dispatch in batches and consolidate per batch — never assume an unbounded simultaneous fan-out.
3. **Each reviewer receives a complete, self-contained payload** (subagents have no memory of the orchestrator's context — anything omitted is invisible to them). The mandatory dispatch payload is:
   - `changed_files`: explicit list of paths to review
   - `issue` : number, title, and the acceptance criteria
   - `approved_plan`: the QG-4 design/plan contents (or a path the reviewer can Read)
   - `prior_findings`: relevant prior gate artifacts, if any
   - `lens`: the reviewer's focus area and what it is NOT responsible for
   Assert this payload is populated before each `Task` call.
4. Each reviewer produces findings in standard format (see below)
5. **Barrier + timeout:** wait for all reviewers in the batch, but bound the wait — apply a per-agent timeout and, per the Review error-handling table (`operations/review.md` "Agent timeout → retry once"), retry a stalled reviewer once, then **proceed with partial findings and flag the missing reviewer** in the consolidated output rather than blocking indefinitely.

---

## Finding format

Each reviewer returns findings as:

```
{
  id: "R<reviewer_initial><N>",  // e.g., "RC1" for code-reviewer finding 1
  severity: "critical" | "high" | "medium" | "low",
  category: "bug" | "security" | "architecture" | "quality" | "test" | "accessibility",
  file: "path/to/file.ts",
  line: 42,
  description: "What the issue is",
  recommendation: "How to fix it",
  reviewer: "code-reviewer" | "architecture-reviewer" | "security-auditor" | "test-writer" | "solution-reviewer" | "ux-reviewer" | "refactor-advisor"  // non-exhaustive
}
```

---

## Fix authority for the embedded reviews (QG-4a, QG-8, QG-11a)

The embedded reviews fan out the operation's own reviewer agents (not `/erfana:lens-review`), which already return the ladder severities above. Once consolidated, the fix authority in [embedded-review-and-fix.md](embedded-review-and-fix.md) applies:

| Ladder severity | Action class | Authority |
|---|---|---|
| critical / high | MUST FIX | Auto-fixed and re-verified inline |
| medium / low | JUDGE | Routed to `mi-solution-designer`: fix / accept-as-tech-debt / not-worth-it |

Every CRITICAL/HIGH finding is resolved (or escalated after the `embedded_loop_iter` cap of 3 rounds — never recorded as tech debt) before the gate passes; MEDIUM/LOW are decided by the judge, never gold-plated.

---

## Consolidation rules

1. **Deduplicate:** Same finding from multiple reviewers --> keep highest severity, note all reviewers
2. **Normalize severity (fail-safe – never drop a finding):** map each finding's severity to exactly one of `{critical, high, medium, low}` (case-insensitive). **Any severity that is missing, empty, or off-vocabulary (`severe`, `warning`, `blocker`, `nit`, a number, …) becomes `critical`.** A finding with an unrecognized severity is never silently dropped and never falls through the fix-authority routing — it is escalated to the safest bucket. Run this before prioritization and before any fix-authority routing.
3. **Renumber:** Assign unified IDs F1-FN after deduplication
4. **Contradictions:** Reviewers cannot call AskUserQuestion, so a reviewer that hits a genuine contradiction (not a technical choice it can make itself) returns `needs_user_input` (per SKILL.md rule 7) rather than resolving it internally. The orchestrator consolidates those, presents both sides with context via AskUserQuestion, and the user decides — the reviewer never silently picks a side, and never raises a technical/architecture question this way.
5. **Prioritize:** Sort by normalized severity (critical --> high --> medium --> low)
6. **Categorize actions:**
   - **MUST FIX:** Critical and high findings --> auto-fixed and re-verified inline; never routed to the judge
   - **JUDGE:** Medium and low findings --> routed to the `mi-solution-designer` judge (fix / accept-as-tech-debt / not-worth-it)

---

## Presenting results

Present a consolidated table to the user:

```
| # | Severity | Category | File | Description | Action |
|---|----------|----------|------|-------------|--------|
| F1 | critical | bug | ... | ... | MUST FIX |
| F2 | high | security | ... | ... | MUST FIX |
| F3 | medium | quality | ... | ... | SHOULD FIX |
```

---

## Post-consolidation workflow (autonomous)

1. Record the unified findings and emit a one-line summary (no user prompt)
2. Normalize severities (rule 2 above), then auto-fix all CRITICAL/HIGH items via the implementation agents and re-verify
3. Route MEDIUM/LOW items to the judge (`mi-solution-designer` JUDGE mode): fix / accept-as-tech-debt / not-worth-it. Skip any finding already ruled `not-worth-it` / `accept-as-tech-debt` this run (sticky verdicts)
4. After fixes: re-run affected reviewers on changed files only (delta review). Each fix-application round increments `embedded_loop_iter`, bounded at 3 rounds ([embedded-review-and-fix.md](embedded-review-and-fix.md) Step 6)
5. At convergence (no unresolved CRITICAL/HIGH, every MEDIUM/LOW judged) the gate passes; at the cap, unresolved CRITICAL/HIGH escalates (never tech debt), unresolved MEDIUM/LOW is recorded as tech debt

---

## Metrics

Track for continuous improvement:

- Total findings per reviewer
- Overlap rate (findings caught by multiple reviewers)
- Unique findings per reviewer (value of parallel review)
- False positive rate (findings user rejected)
