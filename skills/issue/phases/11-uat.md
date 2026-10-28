# Phase 11: User Acceptance Testing (UAT)

**Goal:** Verify changes work correctly in running application.
**Agent:** None (manual testing)
**Quality Gates:** QG-11a (embedded review-and-fix of the whole change set, pre-step; `review_level = full` only) then QG-11 (User-Approval for T2, Automated for T1) – **QG-11 is the UAT acceptance gate** (the full list of the run's human interactions is in operations/implement.md)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-10 = PASS (Documentation completed) – and every prior gate QG-0 through QG-9 recorded as PASS
- [ ] All documentation updated
- [ ] All tests passing
- [ ] Typecheck passing

---

## PRE-STEP: QUALITY GATE QG-11a (embedded review-and-fix of the implementation)

**Gate Type:** Embedded Review-and-Fix (runs when `review_level = full`; skipped at `design` and `none`, and on Tier 1 unless the user asked for the full review when starting the run)
**Gate ID:** QG-11a
**Entry condition:** QG-10 = PASS – so every other gate in the run (QG-0 through QG-10, including the mandatory QG-7 and QG-9) has already passed. QG-11a is deliberately the last check before a human touches the application.

**Autonomous, no user hand-off.** The orchestrator **MUST NOT invoke `/erfana:lens-review` or any skill/slash command** (SKILL.md rule 15; implement-rules Rule 12). QG-11a runs the embedded review-**and-fix** protocol in [../reference/embedded-review-and-fix.md](../reference/embedded-review-and-fix.md) over the whole change set, using the standard 4-agent parallel fan-out ([../reference/parallel-review.md](../reference/parallel-review.md)). It does not end the turn and does not ask the user anything.

### Step 1: Resolve the change-set target

Read the change set from the working tree – nothing is committed before Phase 12, so a `<base>...HEAD` range is empty on every standard run ([../operations/implement.md](../operations/implement.md) – "The change set before the commit exists"):

```bash
{ git diff --name-only; git diff --cached --name-only; git ls-files --others --exclude-standard; } \
  | sort -u
```

An empty list at Phase 11 means the run wrote nothing to the working tree, which cannot be true here. Treat it as a resolution failure: on a resumed run committed by hand, union in `git diff --name-only "$BASE_BRANCH"...HEAD` **only when** `git rev-list -n1 "$BASE_BRANCH"..HEAD` is non-empty; if still empty, STOP and report to the user (no change set = nothing to review).

### Step 2: Fan out the reviewers and fix

Dispatch the reviewer fan-out **in parallel** (single message, multiple `Task` calls) over the change-set file list – `code-reviewer`, `architecture-reviewer`, `security-auditor`, `test-writer`, plus `ux-reviewer` when `has_ui_impact = true` – under the concurrency cap in [../reference/parallel-review.md](../reference/parallel-review.md). Each reviewer gets the self-contained payload (changed files, issue + acceptance criteria, approved plan, its focus lens) and returns severity-ranked findings; a reviewer runs a web best-practices lookup only on a genuine unknown ([../reference/embedded-review-and-fix.md](../reference/embedded-review-and-fix.md) Step 2b). Because `security` is always in the lens set, QG-7's concern is never dropped from this final review.

### Step 3: Consolidate, fix, judge

Consolidate per [../reference/parallel-review.md](../reference/parallel-review.md) (normalize severities first — off-vocabulary → CRITICAL, fail-safe), then apply the fix authority:

- **CRITICAL/HIGH → auto-fixed and re-verified inline.** Fixes are applied by the implementation agents, never by the orchestrator. Never routed to the judge.
- **MEDIUM/LOW → the judge** (`mi-solution-designer` JUDGE mode): fix / accept-as-tech-debt / not-worth-it; skip any finding already ruled `not-worth-it` / `accept-as-tech-debt` this run (sticky).

Fixes here land **after** QG-6/7/8/9 have already passed, so they are post-review changes by definition. Route them through the re-review decision matrix in [../reference/post-review-tracking.md](../reference/post-review-tracking.md) against `last_review_tree` (use [../reference/delta-review.md](../reference/delta-review.md) for the delta case), re-snapshot `last_review_tree` once the required re-review passes, and record every file a fix touched in `PLANNED_FILES`. The whole loop is bounded by **`embedded_loop_iter`** (max 3 fix-application rounds; [../reference/embedded-review-and-fix.md](../reference/embedded-review-and-fix.md) Step 6). At the cap: unresolved CRITICAL/HIGH → ESCALATE or abort (never tech debt); unresolved MEDIUM/LOW → recorded as accepted tech debt. Emit a one-line summary.

### Result

**QG-11a Result:** [PASS | FAIL]

PASS requires: the reviewers ran, every CRITICAL/HIGH finding is resolved (or escalated after the cap), the judge ruled on every remaining finding, the required re-review ran on the fixes, and `last_review_tree` was re-snapshotted. QG-11a produces no user prompt. **STOP if QG-11a ≠ PASS – manual UAT does not start.**
---

## EXECUTION

### Step 1: Build the Project

Run the build command detected at QG-0 Step 4 (`BUILD_CMD`; `npm run build` shown as the Node example). A project with no build step records `absent` there, and this step is then skipped – not a failure.

```bash
BUILD_CMD='npm run build'   # or: absent
: "${BUILD_CMD:?not substituted}"
[ "$BUILD_CMD" = absent ] || eval "$BUILD_CMD"
```

**Verify:** Build completes without errors (or no build step applies).

### Step 2: Start Development Server / run the app

Run the dev/run command detected at QG-0 Step 4 (`DEV_CMD`; `npm run dev` shown as the Node example). A project with no long-running entry point records `absent` and this step is skipped.

**Always background it.** A dev server started in the foreground never returns and the run hangs there permanently – there is no timeout that rescues it.

**The PID cannot be carried in a variable.** The process that starts the server is gone by the next tool call, so `$DEV_PID` is empty there and `kill ""` stops nothing. Write the PID and the log to **per-run files under `$LENS_DIR`** (untracked, and already unique per run) and look them up later. A fixed `/tmp/uat-dev-server.log` is shared by every concurrent run on the machine and interleaves their output.

```bash
DEV_CMD='npm run dev'                              # or: absent
LENS_DIR='.git/erfana-lens-reports/issue-42'       # resolved at QG-0 Step 5e
: "${DEV_CMD:?not substituted}" "${LENS_DIR:?not substituted}"

if [ "$DEV_CMD" != absent ]; then
  mkdir -p "$LENS_DIR"
  ( eval "$DEV_CMD" ) >"$LENS_DIR/uat-dev-server.log" 2>&1 &
  echo $! > "$LENS_DIR/uat-dev-server.pid"
  sleep 10                                          # grace period before the liveness check
  if kill -0 "$(cat "$LENS_DIR/uat-dev-server.pid")" 2>/dev/null; then
    echo "dev server still running after the grace period; log: $LENS_DIR/uat-dev-server.log"
  else
    echo "QG-11 FAIL: dev server exited during startup"
    tail -20 "$LENS_DIR/uat-dev-server.log"
    exit 1
  fi
fi
```

**What this asserts, exactly:** the process is **still alive after a grace period** and its log is available. It does **not** assert that a port is listening – the port is project-specific and QG-0 detects no port, so claiming a readiness probe would be claiming a check that is not run. On Tier 2 the user's own testing is what confirms the app is reachable; on Tier 1 the liveness predicate is the whole check and is stated as such below.

**Teardown is a lookup, not a carried value.** Step 4 / the On FAIL path stops it with `kill "$(cat "$LENS_DIR/uat-dev-server.pid")" 2>/dev/null; rm -f "$LENS_DIR/uat-dev-server.pid"`, using the same substituted `LENS_DIR`. Leaving it running after the phase is a leaked process, not a passing gate.

**Verify:** Application launches and stays up (or smoke-run succeeds).

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

### Step 3b: Multi-agent review already ran (QG-11a)

The autonomous 4-agent review-and-fix over the whole change set is **QG-11a**, the pre-step above, which runs on every `review_level = full` run without asking. There is **no separate optional prompt** here (autonomy – SKILL.md rule 16). When `review_level` is `design` or `none` and no embedded implementation review ran, the run proceeds straight to manual testing; the change set was still covered by QG-6/7/8. The reviewer fan-out and consolidation protocol are in [../reference/embedded-review-and-fix.md](../reference/embedded-review-and-fix.md) and [../reference/parallel-review.md](../reference/parallel-review.md).

### Early UAT option

When all acceptance criteria have corresponding automated tests (E2E or integration), offer the user three options:

1. **Full manual UAT** – standard manual testing of all acceptance criteria
2. **Abbreviated UAT** – verify key flows only, rely on automated test coverage
3. **Skip manual UAT** – automated tests are sufficient (build verification still runs)

Note: Build verification (`BUILD_CMD` + `DEV_CMD`, Steps 1-2) always runs regardless of UAT option.

### Step 4: Request Manual Testing

Present to user for testing (Tier 2) or verify programmatically (Tier 1).

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Embedded Review Findings | Aggregated severity-ranked findings from the QG-11a reviewer fan-out when `review_level = full` |
| Finding Resolution Record | Every QG-11a CRITICAL/HIGH finding auto-fixed, the judge verdict on each MED/LOW finding, and the re-review level each fix triggered |
| Changed File List | Every file a QG-11a fix touched, appended to `PLANNED_FILES` (files only, never a directory) – Phase 12 stages exactly this list |
| Build Output | Successful build |
| Running Application | App starts without errors |
| Test Results | User verification of acceptance criteria |
| Issue List | Any bugs found during testing (informational on PASS – not gated by QG-11) |
| UAT Approved Tree | `uat_approved_tree` working-tree snapshot recorded on PASS – Phase 12's pre-commit review gate diffs against it |
| Task List Advance | Phase 11 and `QG-11 quality gate` marked `completed`; Phase 12 `in_progress` with `QG-12 quality gate` appended – see [../reference/progress-tracking.md](../reference/progress-tracking.md) |

---

## Quality Gate

**Success criterion:** QG-11a passed (the autonomous embedded review-and-fix, when `review_level = full`), build passes, app launches, user approves acceptance criteria (T2) or automated verification passes (T1); `uat_approved_tree` snapshot recorded for the Phase 12 re-review check. QG-11a is an embedded agent fan-out that must sit ahead of manual testing – it is not a checklist ritual. **QG-11 (the user-approval below) is the UAT acceptance gate; QG-12 then confirms the git actions, and Phase 2 may have asked a requirements question. Full interaction list: operations/implement.md.**

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
| UAT tree recorded | `uat_approved_tree` = a fresh working-tree snapshot (not `git rev-parse HEAD`, which is still the branch point) | Same |
| QG-11a fixes recorded | Any file a QG-11a fix touched is in `PLANNED_FILES` | Same |
| Task list advanced | `QG-11a quality gate` (when it ran) and `QG-11 quality gate` `completed`, `Phase 11: UAT` `completed`, `Phase 12: Finalization` `in_progress`, `QG-12 quality gate` appended as `pending` | Same |

**UAT tree recorded** applies on both tiers: without the snapshot, Phase 12's pre-commit review gate has no baseline to diff against and post-UAT changes reach the commit unreviewed.

### Tier 1: Automated Verification

Tier 1 needs no running app afterwards, so this snippet starts **and stops** the server itself – one process, no PID carried across tool calls:

```bash
BUILD_CMD='npm run build'   # or: absent
DEV_CMD='npm run dev'       # or: absent
: "${BUILD_CMD:?not substituted}" "${DEV_CMD:?not substituted}"

[ "$BUILD_CMD" = absent ] || eval "$BUILD_CMD" || exit 1
if [ "$DEV_CMD" != absent ]; then
  log=$(mktemp -t mi-uat-dev.XXXXXX)
  ( eval "$DEV_CMD" ) >"$log" 2>&1 &
  pid=$!
  sleep 10
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null; rm -f "$log"
  else
    echo "QG-11 FAIL: dev server exited during startup"; tail -20 "$log"; rm -f "$log"; exit 1
  fi
fi
```

**Tier 1 predicate (no user call):** `BUILD_CMD` exits 0 **and** `DEV_CMD` is still running at the end of the grace period without having exited – each skipped when recorded `absent`. That liveness check is the predicate in full; no port or readiness probe is performed, and the phase text above says so rather than implying a stronger check. Pass when both detected commands hold. If **both** were recorded `absent` at QG-0 (a project with neither a build nor a runnable entry point), QG-11 cannot be automated – escalate to the Tier 2 user call below rather than passing by default. Both commands are detected at QG-0 Step 4, so this escalation is the genuinely-nothing-to-run case, not the default. **Advisory on Tier 1 (non-blocking, document only):** acceptance-criteria spot-checks and edge cases, which the Tier 1 pass criteria already mark "Not required".

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
```

**Tier 2 – MUST call `AskUserQuestion` after presenting the test instructions.** Printing the checklist is not the gate; the gate is this call, and only the user can answer it.

```
AskUserQuestion({
  questions: [{
    question: "The app is running. What did your testing show?",
    header: "QG-11",
    options: [
      { label: "UAT Passed", description: "All acceptance criteria verified by hand - continue to Phase 12 (Finalization)" },
      { label: "Found Issues", description: "Something is broken or wrong - describe it and the run returns to Phase 5 (Implementation)" },
      { label: "Need Help", description: "You need assistance running the tests - the run pauses for guidance, not a verdict" }
    ],
    multiSelect: false
  }]
})
```

`UAT Passed` → QG-11 = PASS; record `uat_approved_tree`. `Found Issues` → QG-11 = FAIL; follow On FAIL below. `Need Help` → give testing guidance and re-ask; do not treat it as a pass.

### Result

**QG-11 Result:** [PASS | FAIL]

### On FAIL (Issues Found)

1. Stop the dev server: `kill "$(cat "$LENS_DIR/uat-dev-server.pid")" 2>/dev/null; rm -f "$LENS_DIR/uat-dev-server.pid"` (`LENS_DIR` substituted as a literal, as in Step 2)
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
- `uat_approved_tree`: a fresh working-tree snapshot (see [../operations/implement.md](../operations/implement.md))
- This is used by Phase 12 to detect post-UAT changes; a HEAD SHA would not, since nothing is committed until Phase 12

---

## NEXT PHASE

**QG-11 = PASS required to proceed to Phase 12: Finalization**

**Task list:** on PASS, mark `QG-11a quality gate` (when it ran) and `QG-11 quality gate` then `Phase 11: UAT` `completed`, set `Phase 12: Finalization` `in_progress`, and append `QG-12 quality gate` as `pending`. On `Found Issues` the run returns to Phase 5 – reopen `Phase 5: Implementation` and its gate item rather than editing the completed history ([progress-tracking](../reference/progress-tracking.md)).

**Run state:** record `QG-11a=PASS|skipped`, `QG-11=PASS`, `awaiting: none`, and take the `uat_approved_tree` snapshot (session-local, written to the comment as `-`), then PATCH the run-state comment ([post-review-tracking](../reference/post-review-tracking.md) – "Updating in place"). A failed write never fails the gate.

**STOP if QG-11 ≠ PASS. Do not proceed.**
