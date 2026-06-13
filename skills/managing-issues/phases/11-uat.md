# Phase 11: User Acceptance Testing (UAT)

**Goal:** Verify changes work correctly in running application.
**Agent:** None (manual testing)
**Quality Gate:** QG-11 (User-Approval for T2, Automated for T1)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-10 = PASS (Documentation completed)
- [ ] All documentation updated
- [ ] All tests passing
- [ ] Typecheck passing

---

## EXECUTION

### Step 1: Build the Project

Run the detected build command (`BUILD_CMD`; `npm run build` shown as the Node example). Skip if the project has no build step (e.g. an interpreted library).

```bash
[ -n "$BUILD_CMD" ] && eval "$BUILD_CMD"
```

**Verify:** Build completes without errors (or no build step applies).

### Step 2: Start Development Server / run the app

Run the detected dev/run command (`DEV_CMD`; `npm run dev` shown as the Node example). For projects with no long-running server (a library/CLI), substitute the appropriate smoke-run or skip.

```bash
[ -n "$DEV_CMD" ] && eval "$DEV_CMD"
```

**Verify:** Application launches without crashes (or smoke-run succeeds).

### Step 3: Prepare Test Instructions

Create testing checklist based on acceptance criteria:

```markdown
## Testing Checklist

**Feature:** <feature name>

### Test Steps
1. <step 1>
2. <step 2>
3. <step 3>

### Expected Results
- [ ] <expected result 1>
- [ ] <expected result 2>

### Edge Cases to Test
- [ ] <edge case 1>
- [ ] <edge case 2>
```

### Step 3b: Multi-agent parallel review (optional)

Before manual testing, offer a parallel multi-agent review:

"Would you like a multi-agent review before manual testing?"

**Recommended when:**
- 5+ files changed in the implementation
- Tier 2 with 3+ acceptance criteria
- User explicitly requests it

**If user accepts:**

Dispatch four review agents in parallel (see `reference/parallel-review.md`):

| Agent | Focus |
|-------|-------|
| code-reviewer | Code quality, smells, complexity |
| architecture-reviewer | SOLID, coupling, patterns |
| security-auditor | Vulnerabilities, secrets, injection |
| test-writer | Coverage gaps, test quality, missing scenarios |

**Consolidation protocol:**
1. Collect all findings from parallel agents
2. Deduplicate overlapping findings (highest severity wins)
3. Number findings F1-FN for tracking
4. Present unified action plan to user
5. Address all MUST FIX findings before proceeding to manual testing

**If user declines:** Proceed directly to manual testing (Step 4).

### Early UAT option

When all acceptance criteria have corresponding automated tests (E2E or integration), offer the user three options:

1. **Full manual UAT** – standard manual testing of all acceptance criteria
2. **Abbreviated UAT** – verify key flows only, rely on automated test coverage
3. **Skip manual UAT** – automated tests are sufficient (build verification still runs)

Note: Build verification (`npm run build` + `npm run dev`) always runs regardless of UAT option.

### Step 4: Request Manual Testing

Present to user for testing (Tier 2) or verify programmatically (Tier 1).

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Build Output | Successful build |
| Running Application | App starts without errors |
| Test Results | User verification of acceptance criteria |
| Issue List | Any bugs found during testing |

---

## Quality Gate

**Success criterion:** Build passes, app launches, user approves acceptance criteria (T2) or automated verification passes (T1); `uat_approved_commit` SHA recorded for Phase 12 re-review check. PRE/POST-STEP scaffolding stripped per v4.2.0 patterns — UAT gate is the user-approval below.

---

## QUALITY GATE: QG-11

**Gate Type:** User-Approval (T2) | Automated (T1)
**Gate ID:** QG-11

### Pass Criteria

| Criterion | Tier 1 | Tier 2 |
|-----------|--------|--------|
| Build passes | Required | Required |
| App starts | Required | Required |
| Acceptance criteria | Auto-check | Manual verify |
| Edge cases | Not required | Required |
| User approval | Not required | Required |

### Tier 1: Automated Verification

```bash
npm run build && npm run dev &
# Wait for app to start
# Kill dev server
```

If build succeeds and app starts: QG-11 = PASS

### Tier 2: User Checkpoint

Present to user:

```markdown
## User Acceptance Testing

The application is running. Please manually test the changes.

**Issue:** #<number> - <title>

### Acceptance Criteria to Verify
- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] <criterion 3>

### How to Test
1. <step-by-step instructions>
2. <what to look for>
3. <expected behavior>

### Edge Cases
- [ ] <edge case 1>
- [ ] <edge case 2>

---

**Select an option:**
- **UAT Passed** - All acceptance criteria verified
- **Found Issues** - Problems discovered (please describe)
- **Need Help** - Require assistance with testing
```

### Result

**QG-11 Result:** [PASS | FAIL]

### On FAIL (Issues Found)

1. Stop the dev server
2. Document reported issues
3. Return to Phase 5 (Implementation) to fix
4. Re-run phases 5-11
5. Max 3 retries, then ESCALATE to user

### Common Issues

| Issue | Resolution |
|-------|------------|
| Build fails | Fix build errors, re-run |
| App crashes | Debug, fix, restart |
| Criteria not met | Fix implementation |
| Edge case failure | Add handling |

---

## UAT Feedback Loop

When user requests changes during UAT, follow this process:

### 1. Classify Change Severity

| Severity | Criteria | Action |
|----------|----------|--------|
| **Minor** | < 10 lines, cosmetic only | Note for Phase 12, continue UAT |
| **Moderate** | 10-50 lines, no architecture change | Go to Moderate Change Path |
| **Major** | > 50 lines OR architecture change | Go to Major Change Path |

### 2. Moderate Change Path
```
Phase 11 (UAT)
    ↓ User requests moderate changes
Phase 5 (Implementation)
    ↓ Apply fixes
Phase 8 (Quality Review) ← Delta Review only
    ↓ QG-8 PASS
Phase 11 (UAT) ← Resume
```

### 3. Major Change Path
```
Phase 11 (UAT)
    ↓ User requests major changes
Phase 5 (Implementation)
    ↓ Apply fixes
Phase 6 (Architectural Review)
    ↓ QG-6 PASS
Phase 7 (Security)
    ↓ QG-7 PASS
Phase 8 (Quality Review)
    ↓ QG-8 PASS
Phase 11 (UAT) ← Resume
```

### 4. State Tracking
After UAT approval, record:
- `uat_approved_commit`: Current HEAD SHA
- This is used by Phase 12 to detect post-UAT changes

---

## NEXT PHASE

**QG-11 = PASS required to proceed to Phase 12: Finalization**

**STOP if QG-11 ≠ PASS. Do not proceed.**
