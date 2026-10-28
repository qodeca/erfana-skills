# Phase 3: Discovery

**Goal:** Understand affected codebase areas and existing patterns.
**Agent tool:** subagent_type: `<selected-agent>` (from Phase 1 selection plan)
**Quality Gate:** QG-3 (Judgment – non-blocking, ALL tiers)

**Autonomous phase.** QG-3 issues no blocking `AskUserQuestion` (SKILL.md rule 16; implement-rules Rule 13): it is evaluated on a structural predicate and recorded.

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-2 = PASS (Business Analysis completed)
- [ ] Research summary available
- [ ] Requirements document available
- [ ] Acceptance criteria validated

---

## EXECUTION

### Spec-ready shortcut (if spec_maturity >= "complete")

When Phase 0 reports `spec_maturity` of `complete` or `complete_with_design`, execute this compressed path instead of full exploration:

1. Read spec files for affected-files list and pattern inventory
2. Spot-check 2-3 key files to verify spec accuracy (files still exist, imports haven't changed)
3. Verify dependency map is current (check import statements in key files)
4. Confirm complexity estimate from spec matches current codebase state
5. IF spec is stale (files moved, patterns changed) → fall back to full Phase 3 execution below
6. IF spec is current → produce validation summary and proceed to QG-3

**Skipped in spec-ready mode:** Full codebase exploration, pattern catalogue
**Preserved in spec-ready mode:** Dependency validation, complexity confirmation, file existence check

### Step 1: Extract Issue Details

Review issue metadata:
- Title and description
- Acceptance criteria
- Labels and priority

### Step 2: Identify Affected Areas

Using Glob and Grep, search for:
- Files related to feature/bug
- Components that will be modified
- Shared utilities that might be affected

```
Search patterns:
- Feature keywords in filenames
- Related imports and dependencies
- Test files for affected components
```

### Step 3: Review Existing Patterns

Read affected files to understand:
- Code style and conventions
- Existing patterns (hooks, utilities)
- Test patterns used
- Error handling approaches

### Step 4: Map Dependencies

Identify:
- Direct dependencies of affected files
- Shared state/stores
- IPC channels (if main/renderer)
- External library usage

### Step 4b: Upgrade UI impact flag

If `has_ui_impact = false` (from Phase 0), check if affected files suggest UI work:

- Affected files include `.tsx`, `.css`, `.scss`, `.html` extensions → upgrade `has_ui_impact = true`
- Affected paths match `components/`, `renderer/`, `pages/`, `views/`, `layouts/` → upgrade `has_ui_impact = true`

**Note:** This upgrade ensures issues that lack UI-related labels but touch UI files still get UX review in Phases 4 and 8.

### Step 5: Estimate Complexity

| Factor | Low | Medium | High |
|--------|-----|--------|------|
| Files affected | 1-3 | 4-8 | 9+ |
| Cross-cutting | None | Some | Major |
| Breaking changes | No | Possible | Likely |
| Test coverage | Good | Partial | Missing |

### Step 6: Capture research summary

**Output deliverable:** produce the Research Summary artifact in the shape of [`templates/implement/research-summary.md`](../templates/implement/research-summary.md), capturing related issues discovered, prior art / pattern references, technical references found in the codebase, and the dependency map from Step 4.

**The template file is a shape, not a destination.** It ships inside the installed skill directory; writing into it would modify the installed skill and leak one run's findings into the next. The filled artifact is **context-only** – it carries forward to Phase 4 (Architecture) as an artifact of this phase, and Phase 3 writes nothing to the working tree (this phase is read-only by design).

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Affected Files List | All files that will be modified/created |
| Dependency Map | How affected files relate to each other |
| Pattern Inventory | Existing patterns to follow |
| Complexity Assessment | Final tier confirmation |
| UI Impact Flag | `has_ui_impact` confirmed or upgraded to true (Step 4b) – drives Phases 4 and 8 |
| Research Summary Artifact | Step 6 deliverable in the shape of [`templates/implement/research-summary.md`](../templates/implement/research-summary.md) – context-only, input to Phase 4 |
| Task List Advance | Phase 3 and `QG-3 quality gate` marked `completed`; Phase 4 `in_progress` with `QG-4 quality gate` appended, plus `QG-4a quality gate (embedded design review)` and `QG-4b quality gate (architecture judgment)` when `deep_review_gates = true` – see [../reference/progress-tracking.md](../reference/progress-tracking.md) |

---

## Quality Gate

**Success criterion:** Affected files identified, dependency map produced, complexity tier confirmed. Phase 3 explores read-only and produces a discovery report (no file writes); QG-3 is the non-blocking predicate below.

---

## QUALITY GATE: QG-3

**Gate Type:** Judgment (non-blocking, ALL tiers)
**Gate ID:** QG-3

### Pass Criteria

| Criterion | Tier 1 | Tier 2 |
|-----------|--------|--------|
| Files identified | 1-3 files | All affected files |
| Patterns reviewed | Basic | Comprehensive |
| Dependencies mapped | Direct only | Full dependency tree |
| Complexity confirmed | Tier reconfirmed or revised | Tier reconfirmed or revised |
| UI impact re-evaluated | Step 4b applied to the affected-files list | Step 4b applied to the affected-files list |
| Research summary artifact | Produced, every section non-empty (context-only) | Same |
| User checkpoint | None (non-blocking) | None (non-blocking) |
| Task list advanced | `QG-3 quality gate` and `Phase 3: Discovery` `completed`, `Phase 4: Architecture` `in_progress`, `QG-4` (plus `QG-4a` / `QG-4b` when `deep_review_gates = true`) appended as `pending` | Same |

**Research summary artifact** is the Step 6 deliverable, shaped by [`templates/implement/research-summary.md`](../templates/implement/research-summary.md); Phase 4 consumes it, so a missing or half-filled artifact fails QG-3 on both tiers. **UI impact re-evaluated** means the Step 4b check ran against the discovered files – a `has_ui_impact` left at `false` without that check is a QG-3 failure, because Phases 4 and 8 silently drop the UX track on a false flag.

### Phase summary (recorded, not a prompt)

Record the discovery and emit a one-line summary:

```markdown
## Discovery Complete

**Issue:** #<number> - <title>
**Tier:** <tier> (confirmed)

### Acceptance Criteria
- [ ] <criterion 1>
- [ ] <criterion 2>

### Affected Areas
| File | Change Type | Reason |
|------|-------------|--------|
| <file1> | Modify | <reason> |
| <file2> | Create | <reason> |

### Existing Patterns Found
- <pattern 1>: <where used>
- <pattern 2>: <where used>

### Dependencies
```
<file1>
  └── imports: <dep1>, <dep2>
  └── used by: <consumer1>
```

### Complexity Assessment
- Files: <count>
- Cross-cutting: <yes/no>
- Breaking changes: <risk level>
```

### Gate evaluation (non-blocking, ALL tiers)

**QG-3 does NOT call `AskUserQuestion` (SKILL.md rule 16; implement-rules Rule 13).** Evaluate this predicate on both tiers:

- The affected-files list is non-empty, and
- every path in it exists on disk (`test -e` on each, all exit 0), and
- every listed file has a direct-dependency entry (count of files with no dependency line is 0), and
- the research-summary artifact this phase produced carries every section non-empty – a check on **this run's artifact**, never a `test -s` against the shipped template file, which always exists and is never empty and would make the clause vacuously true – and
- the Step 4b UI-impact re-evaluation ran against the affected-files list and `has_ui_impact` carries an explicit value.

Pass only when all five hold; otherwise QG-3 = FAIL. **Advisory on Tier 1 (non-blocking, document only):** the existing-patterns catalogue – pattern recognition has no exit-code predicate, so it is recorded, not enforced.

### Result

**QG-3 Result:** [PASS | FAIL]

### On FAIL

1. Review search results
2. Expand search patterns
3. Re-analyze dependencies
4. Max 3 retries, then ESCALATE to user

---

## NEXT PHASE

**QG-3 = PASS required to proceed to Phase 4: Architecture**

**Task list:** on PASS, mark `QG-3 quality gate` then `Phase 3: Discovery` `completed`, set `Phase 4: Architecture` `in_progress`, and append Phase 4's gate items as `pending` – `QG-4 quality gate`, and **when `deep_review_gates = true` also `QG-4a quality gate (embedded design review)` then `QG-4b quality gate (architecture judgment)`, in that order**. When `deep_review_gates = false`, append `QG-4 quality gate` alone ([progress-tracking](../reference/progress-tracking.md)).

**Run state:** record `QG-3=PASS`, refresh `head_sha` / `updated_at` / the task-list snapshot, and PATCH the run-state comment ([post-review-tracking](../reference/post-review-tracking.md) – "Updating in place"). A failed write never fails the gate.

**STOP if QG-3 ≠ PASS. Do not proceed.**
