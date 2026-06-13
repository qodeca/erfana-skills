# Post-Review Change Tracking

Mechanism to ensure no code is committed without proper review. This prevents unreviewed changes from being merged, as discovered in Issue #68.

---

## Why This Matters

Without tracking, it's possible to:
1. Complete all reviews (Phases 6-8)
2. Make "minor fixes" based on UAT feedback
3. Commit without re-reviewing those fixes

This led to design token violations being committed in Issue #68. The pre-commit gate catches this.

---

## State Variables

The orchestrator MUST track these variables throughout the implementation:

| Variable | Set After | Purpose |
|----------|-----------|---------|
| `BASE_BRANCH` | QG-0 | Detected default branch (diff base, merge target) |
| `RUN_BRANCH` | QG-0 | Feature branch created for this run |
| `last_review_commit` | QG-8 (Quality Review) passes | SHA of last reviewed code |
| `uat_approved_commit` | QG-11 (UAT) passes | SHA approved by user |
| `changes_after_review` | Computed before Phase 12 | Boolean: HEAD ≠ uat_approved_commit |

### Persisting state (resumability)

These variables live in the orchestrator's context, which a long 13-phase run can exhaust or a restart can lose — and losing `last_review_commit` silently degrades the very pre-commit gate this file exists to enforce (the Issue #68 fix). **Persist the run state to a collapsed `<details>` block in a comment on the issue being implemented** (keyed to the issue number the run already owns), updating it as each gate passes:

```
<!-- managing-issues:run-state -->
base_branch: <BASE_BRANCH>
run_branch: <RUN_BRANCH>
tier: <1|2>
spec_maturity: <none|partial|complete|complete_with_design>
last_passed_gate: QG-<N>
last_review_commit: <sha>
uat_approved_commit: <sha>
```

Do **not** write this to a file inside the working tree — an in-repo state file would trip the clean-tree check in QG-0 and could be committed. On resume, read the issue comment and continue **from the gate after `last_passed_gate`** rather than restarting at QG-0.

---

## Tracking Rules

1. **After QG-8 passes**: Record `last_review_commit = HEAD`
2. **After QG-11 passes**: Record `uat_approved_commit = HEAD`
3. **Before Phase 12**: Check if `HEAD ≠ uat_approved_commit`
4. **If different**: Trigger appropriate re-review level per decision matrix

---

## Pre-Commit Review Gate

Before committing in Phase 12, verify no unreviewed changes exist:

### 1. Check for Post-Review Changes

```bash
# Compare current HEAD to last reviewed commit
git diff --stat <last_review_commit>..HEAD
```

### 2. Re-Review Decision Matrix

| Change Size | Security Impact | Required Action |
|-------------|-----------------|-----------------|
| 0 lines | N/A | ✅ Proceed to commit |
| 1-20 lines | None | Delta Review: Re-run Phase 8 only |
| 1-20 lines | Yes | Full Review: Re-run Phases 6, 7, 8 |
| 21-50 lines | None | Moderate Review: Re-run Phases 7, 8 |
| 21-50 lines | Yes | Full Review: Re-run Phases 6, 7, 8 |
| > 50 lines | Any | Full Review: Re-run Phases 6, 7, 8 |

### 3. After Re-Review

- Update `last_review_commit` to current HEAD
- Proceed with commit

---

## Re-Review Enforcement Logic

```
Phase 12 Entry Check:
re_review_iterations = 0
IF changes_after_review == true:
    size = count_changed_lines()
    security = has_security_impact()

    IF size == 0:
        → Proceed to commit
    ELIF size <= 20 AND NOT security:
        → Delta Review (Phase 8 only)
    ELIF size <= 50 AND NOT security:
        → Moderate Review (Phases 7, 8)
    ELSE:
        → Full Review (Phases 6, 7, 8)

    AFTER re-review passes:
        last_review_commit = HEAD
        re_review_iterations += 1
        IF re_review_iterations >= 3:
            → ESCALATE to user (re-review loop not converging; fixes keep introducing changes)
        ELSE:
            GOTO Phase 12 Entry Check
```

The 3-iteration cap matches the skill-wide "max 3 retries per phase, then escalate" invariant — without it, fixes that themselves introduce changes could loop indefinitely.

---

## Security Impact Detection

A change has **security impact** if it modifies (adapt the path examples to the project's stack):

- Process/privilege boundaries (e.g. Electron IPC handlers, preload scripts, main-process security; server auth middleware)
- Authentication, authorization, or session handling
- File system operations
- External command execution
- Network requests
- User input handling without validation
- Secrets, crypto, or credential handling

---

## Related Documentation

- [Phase 12: Finalization](../phases/12-finalization.md) - Uses this gate before commit
- [Phase 8: Quality Review](../phases/8-quality-review.md) - Sets `last_review_commit`
- [Delta Review](delta-review.md) - Lightweight re-review process
