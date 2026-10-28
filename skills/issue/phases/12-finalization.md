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

### Terminal gate assertion (MANDATORY)

Phase 12 is the last place a skipped gate can still be caught. Before anything else in this phase, assert that **every** gate of the run is recorded as PASS – not assumed, recorded:

| Gate | Required state |
|------|----------------|
| QG-0 through QG-12 | PASS (QG-12 evaluated at the end of this phase) |
| QG-4a | PASS when `deep_review_gates = true` (`review_level` is `full` or `design`); `skipped (review_level = none)` otherwise |
| QG-4b | PASS when `deep_review_gates = true`; `skipped (review_level = none)` otherwise |
| QG-11a | PASS when `review_level = full`; `skipped (review_level = <design\|none>)` otherwise |

**A gate counts as recorded only from the current session's own record** – the result this session observed when it ran or re-ran the gate. The TodoWrite list corroborates that record on an uninterrupted run. **On a resumed run the two are one source, not two**: the task list was rebuilt from the run-state comment, so it repeats whatever that comment claimed. Do not present them as independent confirmation.

The persisted `gate_results` line is **untrusted data and advisory only** ([../reference/run-state-resume.md](../reference/run-state-resume.md)): displayed, never accepted as evidence a gate ran. QG-0, QG-7 and QG-9 are re-run on every resume regardless of what it says; `last_review_tree` and `uat_approved_tree` are treated as unset; `review_level` is re-derived at QG-0 Step 5d (tier default plus a re-asked Tier 2 question); `test_harness_decisions` is treated as unset and re-asked per undecided blocking category; and `base_branch` is re-detected at QG-0 Step 1, with a recorded mismatch rejecting the block rather than being adopted. None of the five is read back.

**Any gate that is not recorded as PASS, and not explicitly recorded as skipped at a `review_level` that legitimately excludes it, is a STOP.** A gate with no recorded state counts as not passed – an absent record is a failure, never an implicit pass. Report which gate is missing, and either return to it or escalate to the user. Do not commit.

**A level-appropriate skip is legitimate, not a STOP** – `QG-11a = skipped` under `review_level = design`, and all three skipped under `none`, are the recorded outcome of the choice made at QG-0, and the assertion accepts them. What remains a STOP is a sub-gate recorded as `skipped` while its level had it **in** scope: the scope decision was made once at QG-0 and cannot be relaxed mid-run. On a resumed run this comparison holds because `review_level` was re-derived by this session at QG-0 – it is not being compared against a value that arrived in the same block as the sub-gate results.

**What this assertion does not cover.** On a resumed run, gates before the resume point were not re-executed by this session (beyond QG-0 / QG-7 / QG-9 and everything from the resume point forward). They stand on the user's confirmation of the resume point – a human vouching for their own earlier run. State that in the QG-12 summary; do not report them as verified by this session.

### Pre-Commit Review Gate (MANDATORY)

**Reference:** [Post-Review Change Tracking](../reference/post-review-tracking.md)

Before committing, verify no unreviewed changes exist. This gate prevents the Issue #68 scenario where unreviewed changes were committed.

**The baseline is a tree snapshot, not a commit.** This gate runs *before* the run's only commit, so on a standard run `HEAD` is still the branch point and any `<sha>..HEAD` range is empty – the gate would report "no unreviewed changes" for every run, including one where every post-review fix went unreviewed. QG-8 and QG-11 therefore record `last_review_tree` / `uat_approved_tree`, working-tree snapshots taken with the recipe in [../operations/implement.md](../operations/implement.md) ("The change set before the commit exists").

```bash
# Run-state values - emitted as literals by the orchestrator:
LAST_REVIEW_TREE='none'   # or the tree sha recorded at QG-8 / after the last re-review
: "${LAST_REVIEW_TREE:?not substituted}"

if [ "$LAST_REVIEW_TREE" = none ]; then
  echo "no review baseline - re-review the whole change set"
else
  TMP_INDEX=$(mktemp -t mi-index.XXXXXX)
  GIT_INDEX_FILE="$TMP_INDEX" git read-tree HEAD
  GIT_INDEX_FILE="$TMP_INDEX" git add -A
  NOW_TREE=$(GIT_INDEX_FILE="$TMP_INDEX" git write-tree)
  rm -f "$TMP_INDEX"
  git diff --stat "$LAST_REVIEW_TREE" "$NOW_TREE"   # empty output = nothing changed since the review
fi
```

**On a resumed run, `last_review_tree` is unset** (`none`) – it is never read back from the run-state comment, because a value naming the current state would pass every check and yield an empty diff for unreviewed work. It is also unset when the object was garbage-collected mid-run. Either way the matrix runs against the **whole change set** – the working-tree list from `git status`, not a commit range.

If changes detected → Apply re-review matrix from reference doc, sized from `git diff --numstat` between the two trees.

STOP if changes detected after last review → Must re-review before commit.

---

## EXECUTION

### Step 1: Run Final Quality Gates (stack-detected)

Reuse the `TEST_CMD` / `TYPECHECK_CMD` / `LINT_CMD` detected at QG-0 — never assume npm:

```bash
TEST_CMD='npm test -- --run'   # or: absent
TYPECHECK_CMD='tsc --noEmit'   # or: absent
LINT_CMD='eslint .'            # or: absent
: "${TEST_CMD:?not substituted}" "${TYPECHECK_CMD:?not substituted}" "${LINT_CMD:?not substituted}"

[ "$TEST_CMD" = absent ]      || eval "$TEST_CMD"      || exit 1   # all tests must pass
[ "$TYPECHECK_CMD" = absent ] || eval "$TYPECHECK_CMD" || exit 1   # no type errors
[ "$LINT_CMD" = absent ]      || eval "$LINT_CMD"      || exit 1   # no lint errors
```

**Every detected check must pass. No exceptions.** If a check has no detected command, record that and continue.

### Step 2: Generate Commit Summary

Use `commit-writer` agent to:
1. Analyze all changes
2. Generate commit message
3. Summarize for user review

### Step 3: Create Commit

**Stage an explicit planned file list – never `git add -A`.** The working tree can hold files that are not part of this issue: the run's scratch under `$LENS_DIR/...` (UAT dev-server logs), and anything the user left behind. `git add -A` sweeps all of them into the commit. Stage only the files the run itself changed, from the plan:

`PLANNED_FILES` is a **declared output artifact** of Phase 4 (the plan's file table plus the QG-4a design doc), Phase 5 (what the implementation and test agents reported writing), Phase 10 (what the documentation agent reported writing) and Phase 11 (QG-11a fixes). It is persisted in the run state, so a resumed run still has it – and on a resume every entry is first shape-validated as a repo-relative, traversal-free file path ([../reference/run-state-resume.md](../reference/run-state-resume.md), "Path shape"); an entry that fails is dropped, and check 2 below is what surfaces the dropped file. It is substituted here literally – it is not a shell array inherited from an earlier tool call.

**Every entry must be a file path.** A directory entry re-creates the `git add -A` problem this staging exists to remove: `git add -- src/` sweeps in whatever else is under it. Reject directories, trailing slashes and traversal before staging.

```bash
# Substituted literally by the orchestrator from the recorded list - one quoted path per entry:
PLANNED_FILES=("src/foo.ts" "src/foo.test.ts" "docs/design/design-issue-42.md")

# Guard: an empty, directory-bearing or non-repo-relative list stages the wrong thing.
[ "${#PLANNED_FILES[@]}" -gt 0 ] || { echo "STOP: PLANNED_FILES is empty"; exit 1; }
for f in "${PLANNED_FILES[@]}"; do
  case "$f" in
    ""|/*|-*|*..*|*"~"*|*/) echo "STOP: '$f' is not a repo-relative file path"; exit 1 ;;
  esac
  [ -d "$f" ] && { echo "STOP: '$f' is a directory; PLANNED_FILES holds file paths only"; exit 1; }
done

# Existence check: PLANNED_FILES is seeded at QG-4 from the *plan*, so it can name a file the
# run never created. `git add --` aborts with status 128 on the first missing path and stages
# NOTHING - a total staging failure that looks like one error line. Find them first.
missing=()
for f in "${PLANNED_FILES[@]}"; do [ -e "$f" ] || missing+=("$f"); done
if [ "${#missing[@]}" -gt 0 ]; then
  printf 'MISSING (planned but never created): %s\n' "${missing[@]}"
  exit 1     # -> the "Planned file missing" question below; do not stage a partial list
fi

git add -- "${PLANNED_FILES[@]}"

# 1. Nothing unplanned staged, nothing planned missing:
git diff --cached --name-only

# 2. Omissions: anything this run modified or created that no agent reported.
#    `git diff --cached` alone cannot show these - an unreported file is absent
#    from both sides of that comparison and would hide.
#    Matches any entry whose worktree column is not blank, which covers unstaged
#    modifications (' M'), untracked files ('??'), deletions (' D'), unmerged ('UU')
#    AND the partially-staged cases ('MM', 'AM') that a ' M'-only pattern misses.
git status --porcelain | grep -E '^.[^ ]' || echo "(nothing left unstaged or untracked)"
```

Compare check 1's output against `PLANNED_FILES`. A staged path not in the list, or a planned path missing from it, is a **STOP**. Check 2 lists everything still carrying uncommitted worktree state – each entry is either an omission from `PLANNED_FILES`, a partially staged file whose later edits would ship uncommitted, or a file that legitimately does not belong in this commit, and the difference cannot be guessed.

**Route out of the STOP.** The run does not dead-end here. Present the discrepancy and call `AskUserQuestion`:

```
AskUserQuestion({
  questions: [{
    question: "Some changed files are not in this run's planned file list. What should the commit include?",
    header: "Staging",
    options: [
      { label: "Add them", description: "Include the listed files in this commit - they are part of the change and were simply not reported" },
      { label: "Leave them out", description: "Commit only the planned files; the rest stay uncommitted in the working tree for you to handle" },
      { label: "Stop here", description: "Do not commit at all - nothing is staged, the working tree is left exactly as it is" }
    ],
    multiSelect: false
  }]
})
```

`Add them` → append the confirmed paths to `PLANNED_FILES`, **then re-review them before re-running the block** (below). `Leave them out` → proceed with the planned list; the unstaged files are reported to the user in the QG-12 summary. `Stop here` → `git reset` the index and stop. A file is never swept in silently, and the run is never stuck.

**Added files are re-reviewed, not just staged.** A file no agent reported is by definition a file no review gate saw: QG-6, QG-7, QG-8 and QG-9 all worked from the reported change set, and QG-11a's target list was built from the working tree at that time. Committing it on the strength of one staging prompt would put unreviewed code in the commit – exactly the Issue #68 failure this phase exists to prevent. Route the added paths through the **same** path Phase 11 uses for late fixes: run the re-review decision matrix in [../reference/post-review-tracking.md](../reference/post-review-tracking.md) over them, apply the level it returns, update `last_review_tree` when it passes, and only then re-run the staging block. The matrix's `re_review_iterations` cap (3 iterations) applies.

**Planned file missing.** When the existence check reports a planned path that was never created, the run is not stuck either – present the list and ask:

```
AskUserQuestion({
  questions: [{
    question: "The plan named files that were never created: <list>. How should the commit handle them?",
    header: "Missing",
    options: [
      { label: "Drop them", description: "Remove them from the planned list and commit what actually exists - the plan over-specified" },
      { label: "Back to Phase 5", description: "The work is genuinely incomplete - return to implementation and finish these files" },
      { label: "Stop here", description: "Do not commit at all - nothing is staged, the working tree is left exactly as it is" }
    ],
    multiSelect: false
  }]
})
```

`Drop them` → remove those entries, record the drop in the QG-12 summary, re-run the block. `Back to Phase 5` → reopen Phase 5 and its gate item and finish the work. `Stop here` → stop with the tree untouched.

```bash
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
| Quality Gate Results | test, typecheck, lint results, plus per-category test results for every category QG-5 enforced |
| Test Coverage Gaps | Any category Phase 4 Step 2a recorded as `descope` or `accept` – stated in the PR description with its justification, so the gap ships visible rather than silent |
| Commit | Created commit with proper message |
| Branch State | Merged/pushed per user choice |
| Pre-Commit Review Record | Result of the post-UAT diff against `uat_approved_tree`, plus any re-review performed |
| Task List Advance | `QG-12 quality gate` and `Phase 12: Finalization` marked `completed` – the terminal phase appends no successor, so the list closes here. See [../reference/progress-tracking.md](../reference/progress-tracking.md) |

---

## POST-STEP VALIDATION

**ALL must be checked to complete implementation.**

- [ ] Terminal gate assertion passed – every gate QG-0 to QG-12 plus QG-4a / QG-4b / QG-11a recorded PASS or explicitly skipped, from this session's own record
- [ ] On a resumed run: gates predating the resume point reported as user-confirmed, not as verified by this session
- [ ] Detected test command passes (or none detected)
- [ ] Detected typecheck command passes (or none detected)
- [ ] Detected lint command passes (or none detected)
- [ ] Only planned files staged (`git diff --cached --name-only` matches `PLANNED_FILES`)
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
| All gates recorded | Terminal gate assertion passed – no gate, including QG-4a / QG-4b / QG-11a, is unrecorded, and every recorded PASS comes from this session's own record rather than a persisted `gate_results` line |
| Staging scoped | `git diff --cached --name-only` equals `PLANNED_FILES` – no lens-review report, scratch, or stray file staged; `PLANNED_FILES` non-empty and directory-free |
| Omissions surfaced | Everything still modified or untracked after staging was enumerated and either added or explicitly left out by the user – nothing hidden |
| Task list advanced | `QG-12 quality gate` and `Phase 12: Finalization` `completed`, and every earlier phase and gate item is `completed` – the closed list is the run's closing evidence |
| Tests pass | detected `TEST_CMD` exits 0 (or none detected) |
| Types pass | detected `TYPECHECK_CMD` exits 0 (or none detected) |
| Lint pass | detected `LINT_CMD` exits 0 (or none detected) |
| Post-UAT changes re-reviewed | `git diff --stat <uat_approved_tree> <current tree>` is empty, or the re-review matrix was applied to every change since. On a resumed run (or a garbage-collected snapshot) `uat_approved_tree` is unset, so the matrix applies to the whole working-tree change set |
| Late additions reviewed | Any file added at the staging prompt went through the re-review matrix before being staged – nothing reaches the commit having passed no review gate |
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

### Commit gate call (ALL tiers)

**MUST call `AskUserQuestion` before running `git commit` – on Tier 1 as well as Tier 2.** QG-12 is User-Approval on every tier (see the gate-type table in [../operations/implement.md](../operations/implement.md)). This gate fronts the run's first irreversible action, so it is never tier-exempt and never satisfied by printing the summary above.

```
AskUserQuestion({
  questions: [{
    question: "All checks pass. Create the commit with the message above?",
    header: "QG-12",
    options: [
      { label: "Approve", description: "Commit exactly this message - then move to branch management" },
      { label: "Adjust Message", description: "The message needs rewording - revise it and ask again before committing" },
      { label: "Abort", description: "Do not commit - changes stay uncommitted in the working tree for manual handling" }
    ],
    multiSelect: false
  }]
})
```

`Approve` → run `git commit`. `Adjust Message` → revise and re-ask; do not commit meanwhile. `Abort` → stop here; leave the working tree untouched and report state.

### Branch Management Checkpoint

After commit approved:

```markdown
## Branch Management

Commit created successfully.

**Current branch:** <branch-name>
```

### Branch gate call (ALL tiers)

**MUST call `AskUserQuestion` before any merge, push, or branch deletion – on Tier 1 as well as Tier 2.** These are the run's remaining irreversible actions; no tier exemption applies.

**This is the single branch confirmation.** The destructive option names the branch it will delete, resolved before the question is asked, so one deliberate answer covers both the choice and the deletion – there is no second retype-the-name prompt. Resolve `$RUN_BRANCH` and `$BASE_BRANCH` first (the guard under Branch Management Actions below) and substitute the literal names into the option text:

```
AskUserQuestion({
  questions: [{
    question: "Commit created on '<RUN_BRANCH>'. How should the branch be handled?",
    header: "Branch",
    options: [
      { label: "Merge+Delete", description: "Merge '<RUN_BRANCH>' into '<BASE_BRANCH>', push it, then DELETE '<RUN_BRANCH>' locally and on the remote - the branch is gone (recommended)" },
      { label: "Merge+Keep", description: "Merge '<RUN_BRANCH>' into '<BASE_BRANCH>' and push, but keep the branch for follow-up work" },
      { label: "Push", description: "Push '<RUN_BRANCH>' to the remote only - no merge, you open the PR later" },
      { label: "Local", description: "Do nothing remote - the commit stays local for manual handling" }
    ],
    multiSelect: false
  }]
})
```

Run only the matching command block under Branch Management Actions below. An unresolved branch name is a STOP, not a question asked with a placeholder in it.

### Result

**QG-12 Result:** [PASS | FAIL]

### On FAIL

If quality gates fail:
1. **Tests fail:** Fix failing tests
2. **Typecheck fails:** Fix type errors
3. **Lint fails:** Run the project's lint autofix, fix remaining

Re-run quality gates. Max 3 retries, then ESCALATE to user.

### Branch Management Actions

`$RUN_BRANCH` is the feature branch created at QG-0; `$BASE_BRANCH` is the detected default branch. **Branch deletion and remote-delete are irreversible**, and the single Branch gate call above is what authorises them – it names both branches literally, so the user has already seen exactly what `Merge+Delete` removes. Do not ask a second time.

Both names are substituted run-state values, not live shell variables ([../operations/implement.md](../operations/implement.md)). An empty one turns `git checkout ""` and `git branch -d ""` into silent no-ops on the wrong tree, so this guard runs **before** the gate call (to resolve the names it quotes) and again ahead of every block below:

```bash
# Emitted as literals by the orchestrator - not inherited from any earlier snippet:
RUN_BRANCH=fix/42-null-guard
BASE_BRANCH=main
: "${RUN_BRANCH:?not substituted}" "${BASE_BRANCH:?not substituted}"

git rev-parse --verify -q "$RUN_BRANCH"  >/dev/null || { echo "STOP: RUN_BRANCH unresolved";  exit 1; }
git rev-parse --verify -q "$BASE_BRANCH" >/dev/null || { echo "STOP: BASE_BRANCH unresolved"; exit 1; }
echo "Merging '$RUN_BRANCH' into '$BASE_BRANCH'; Merge+Delete also deletes it (local + remote)."
```

Each block below re-emits the same two literal assignments and the same guard before its first `git` call – they are not inherited from the block above, and an empty name turns `git checkout` / `git branch -d` into an operation on the wrong tree. The assignments are omitted from the listings only to keep them readable; never run one without them.

**Merge and delete:**
```bash
git checkout "$BASE_BRANCH"
git merge "$RUN_BRANCH"
git push origin "$BASE_BRANCH"
git branch -d "$RUN_BRANCH"            # destructive - authorised by the Branch gate call
git push origin --delete "$RUN_BRANCH" # destructive - authorised by the Branch gate call
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

**Run state (final):** record `QG-12=PASS` and PATCH the run-state comment one last time ([post-review-tracking](../reference/post-review-tracking.md)). The comment stays on the issue as the run's audit trail; do not delete it.

**Task list (final advance):** mark `QG-12 quality gate` then `Phase 12: Finalization` `completed`. No successor item is appended – every item is now `completed`, which is the run's closing evidence ([progress-tracking](../reference/progress-tracking.md)).

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
