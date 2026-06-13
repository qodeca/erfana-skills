# Phase 12: Finalization

**Goal:** Pass final quality gates, create commit, manage branch.
**Agent:** `commit-writer`
**Quality Gate:** QG-12 (User-Approval - FINAL GATE)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-11 = PASS (UAT completed)
- [ ] All acceptance criteria verified
- [ ] Documentation updated
- [ ] All previous quality gates passed

---

## PRE-STEP VALIDATION

VERIFY: QG-11 = PASS. STOP if UAT not complete.

### Pre-Commit Review Gate (MANDATORY)

**Reference:** [Post-Review Change Tracking](../reference/post-review-tracking.md)

Before committing, verify no unreviewed changes exist. This gate prevents the Issue #68 scenario where unreviewed changes were committed.

**Quick check:**
```bash
git diff --stat <last_review_commit>..HEAD
```

If changes detected → Apply re-review matrix from reference doc.

STOP if changes detected after last review → Must re-review before commit.

---

## EXECUTION

### Step 1: Run Final Quality Gates (stack-detected)

Reuse the `TEST_CMD` / `TYPECHECK_CMD` / `LINT_CMD` detected at QG-0 — never assume npm:

```bash
[ -n "$TEST_CMD" ]      && eval "$TEST_CMD"        # all tests must pass
[ -n "$TYPECHECK_CMD" ] && eval "$TYPECHECK_CMD"   # no type errors
[ -n "$LINT_CMD" ]      && eval "$LINT_CMD"        # no lint errors
```

**Every detected check must pass. No exceptions.** If a check has no detected command, record that and continue.

### Step 2: Generate Commit Summary

Use `commit-writer` agent to:
1. Analyze all changes
2. Generate commit message
3. Summarize for user review

### Step 3: Create Commit

Format:
```bash
git add -A
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

<body explaining what and why>

Closes #<number>
EOF
)"
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Step 4: Branch Management

Present options to user (`$BASE_BRANCH` is the default branch detected at QG-0):
1. **Merge to `$BASE_BRANCH` and delete branch** (Recommended)
2. **Merge to `$BASE_BRANCH` and keep branch**
3. **Push to remote only**
4. **Local only**

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Quality Gate Results | test, typecheck, lint results |
| Commit | Created commit with proper message |
| Branch State | Merged/pushed per user choice |

---

## POST-STEP VALIDATION

**ALL must be checked to complete implementation.**

- [ ] Detected test command passes (or none detected)
- [ ] Detected typecheck command passes (or none detected)
- [ ] Detected lint command passes (or none detected)
- [ ] Commit created with proper conventional commit format
- [ ] Commit message includes `Closes #<number>`
- [ ] Branch management completed per user choice

### Commit Message Requirements
- [ ] Includes "Closes #N" or "Fixes #N" for issue linkage
- [ ] Follows conventional commits format (feat/fix/docs/refactor/test/chore)
- [ ] Summarizes what changed and why (not just what files)
- [ ] References all acceptance criteria addressed

---

## QUALITY GATE: QG-12

**Gate Type:** User-Approval (ALL tiers - FINAL GATE)
**Gate ID:** QG-12

### Pass Criteria

| Criterion | Required |
|-----------|----------|
| Tests pass | detected `TEST_CMD` exits 0 (or none detected) |
| Types pass | detected `TYPECHECK_CMD` exits 0 (or none detected) |
| Lint pass | detected `LINT_CMD` exits 0 (or none detected) |
| Commit approved | User approved message |
| Branch managed | User selected option completed |

### Final Checkpoint

Present to user:

```markdown
## Ready to Commit

**Issue:** #<number> - <title>

### Quality Gates
| Gate | Status |
|------|--------|
| Tests | ✅ PASS (<count> tests) |
| Typecheck | ✅ PASS |
| Lint | ✅ PASS |

### Changes Summary
- <count> files changed
- <insertions> insertions, <deletions> deletions

### Commit Message
```
<type>(<scope>): <description>

<body>

Closes #<number>
```

**Create commit?** [Approve / Adjust Message / Abort]
```

### Branch Management Checkpoint

After commit approved:

```markdown
## Branch Management

Commit created successfully.

**Current branch:** <branch-name>

**Options:**
- **Merge and delete** - Merge to `$BASE_BRANCH`, delete feature branch (recommended)
- **Merge and keep** - Merge to `$BASE_BRANCH`, keep branch for follow-up
- **Push only** - Push to remote, create PR later
- **Local only** - No push or merge (manual handling)

**Select option:** [Merge+Delete / Merge+Keep / Push / Local]
```

### Result

**QG-12 Result:** [PASS | FAIL]

### On FAIL

If quality gates fail:
1. **Tests fail:** Fix failing tests
2. **Typecheck fails:** Fix type errors
3. **Lint fails:** Run the project's lint autofix, fix remaining

Re-run quality gates. Max 3 retries, then ESCALATE to user.

### Branch Management Actions

`$RUN_BRANCH` is the feature branch created at QG-0; `$BASE_BRANCH` is the detected default branch. **Branch deletion and remote-delete are irreversible** — before running the delete commands, echo the exact resolved branch name and require explicit user confirmation of that literal value:

```bash
echo "About to merge '$RUN_BRANCH' into '$BASE_BRANCH' and delete it (local + remote)."
# → require explicit user confirmation of the branch name above before the delete steps ↓
```

**Merge and delete:**
```bash
git checkout "$BASE_BRANCH"
git merge "$RUN_BRANCH"
git push origin "$BASE_BRANCH"
git branch -d "$RUN_BRANCH"            # destructive — confirmed above
git push origin --delete "$RUN_BRANCH" # destructive — confirmed above
```

**Merge and keep:**
```bash
git checkout "$BASE_BRANCH"
git merge "$RUN_BRANCH"
git push origin "$BASE_BRANCH"
git checkout "$RUN_BRANCH"
```

**Push only:**
```bash
git push -u origin "$RUN_BRANCH"
```

**Local only:**
No actions performed.

---

## IMPLEMENTATION COMPLETE

**QG-12 = PASS marks successful implementation.**

### Summary

All phases completed:
- [x] Phase 0: Pre-flight
- [x] Phase 1: Agent Selection
- [x] Phase 2: Business Analysis
- [x] Phase 3: Discovery
- [x] Phase 4: Architecture
- [x] Phase 5: Implementation
- [x] Phase 6: Architectural Review
- [x] Phase 7: Security
- [x] Phase 8: Quality Review
- [x] Phase 9: Verification
- [x] Phase 10: Documentation
- [x] Phase 11: UAT
- [x] Phase 12: Finalization

**Issue #<number> implementation complete.**
