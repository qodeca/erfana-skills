# Parallel review protocol

Defines how to dispatch multiple review agents simultaneously and consolidate findings into a unified action plan. Used by Phase 11 (UAT) multi-agent review and optionally by Phase 8 (Quality Review).

---

## When to use

- At UAT (Phase 11) when user requests a multi-agent review
- At Quality Review (Phase 8) for complex implementations (user opt-in)
- When 5+ files changed or 3+ acceptance criteria in Tier 2

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

1. **Identify scope:** `git diff --stat` to list all changed files
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
  reviewer: "code-reviewer" | "architecture-reviewer" | "security-auditor" | "test-writer"
}
```

---

## Consolidation rules

1. **Deduplicate:** Same finding from multiple reviewers --> keep highest severity, note all reviewers
2. **Renumber:** Assign unified IDs F1-FN after deduplication
3. **Contradictions:** Reviewers cannot call AskUserQuestion, so a reviewer that hits a contradiction or an ambiguous call returns `needs_user_input` (per SKILL.md rule 7) rather than resolving it internally. The orchestrator consolidates those, presents both sides with context via AskUserQuestion, and the user decides — the reviewer never silently picks a side.
4. **Prioritize:** Sort by severity (critical --> high --> medium --> low)
5. **Categorize actions:**
   - **MUST FIX:** Critical and high findings --> address before proceeding
   - **SHOULD FIX:** Medium findings --> address if time permits, otherwise document as tech debt
   - **TECH DEBT:** Low findings --> document for future improvement

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

## Post-consolidation workflow

1. User reviews unified findings
2. Address all MUST FIX items (create implementation plan if needed)
3. After fixes: re-run affected reviewers on changed files only (delta review)
4. When all MUST FIX resolved --> proceed to manual UAT testing
5. SHOULD FIX items --> address or document as tech debt

---

## Metrics

Track for continuous improvement:

- Total findings per reviewer
- Overlap rate (findings caught by multiple reviewers)
- Unique findings per reviewer (value of parallel review)
- False positive rate (findings user rejected)
