# Phase 3: Discovery

**Goal:** Understand affected codebase areas and existing patterns.
**Agent tool:** subagent_type: `<selected-agent>` (from Phase 1 selection plan)
**Quality Gate:** QG-3 (Checkpoint for T2, Automated for T1)

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

**Output deliverable:** fill in the Research Summary template at [`templates/implement/research-summary.md`](../templates/implement/research-summary.md), capturing related issues discovered, prior art / pattern references, technical references found in the codebase, and the dependency map from Step 4. The completed template carries forward as input to Phase 4 (Architecture).

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Affected Files List | All files that will be modified/created |
| Dependency Map | How affected files relate to each other |
| Pattern Inventory | Existing patterns to follow |
| Complexity Assessment | Final tier confirmation |

---

## Quality Gate

**Success criterion:** Affected files identified, dependency map produced, complexity tier confirmed. Phase 3 explores read-only and produces a discovery report (no file writes), so post-step validation is bounded by the Tier 2 user checkpoint at QG-3 below.

---

## QUALITY GATE: QG-3

**Gate Type:** Checkpoint (T2) | Automated (T1)
**Gate ID:** QG-3

### Pass Criteria

| Criterion | Tier 1 | Tier 2 |
|-----------|--------|--------|
| Files identified | 1-3 files | All affected files |
| Patterns reviewed | Basic | Comprehensive |
| Dependencies mapped | Direct only | Full dependency tree |
| User checkpoint | Not required | Required |

### Tier 2 Checkpoint

Present to user:

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

**Proceed to Architecture?** [Approve / Clarify / Re-analyze]
```

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

**STOP if QG-3 ≠ PASS. Do not proceed.**
