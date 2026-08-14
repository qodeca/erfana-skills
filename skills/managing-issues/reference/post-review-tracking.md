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
| `BASE_BRANCH` | QG-0 (Step 1) | Detected default branch (diff base, merge target). **Re-detected on every resume**, and a recorded value that differs rejects the block – it decides the pre-commit diff base and Phase 12's merge and push targets |
| `RUN_BRANCH` | QG-0 | Feature branch created for this run |
| `review_level` | QG-0 (Step 5d) | `full` / `design` / `none`. QG-4a and QG-4b run above `none` (the derived `deep_review_gates = true`); QG-11a runs at `full` only. Fixed at QG-0, never relaxed mid-run, and re-derived rather than read back on a resume |
| `LENS_DIR` | QG-0 (Step 5e) | Untracked scratch directory for the run (UAT dev-server logs, review scratch) |
| `embedded_loop_iter` | each embedded-review gate (QG-4a / QG-8 / QG-11a) | Fix-application round counter for that gate's review→fix→judge loop; init 0 at gate entry, `>= 3` stops the loop (Rule 14). **Session-local; never read back on a resume** – a resumed gate restarts its loop at 0 and re-reviews the working tree from scratch |
| `judged_findings` | each embedded-review gate, during Step 5 | Set of finding keys (**file + category + description**) already ruled `not-worth-it` / `accept-as-tech-debt`; a re-emitted match is skipped, not re-judged (sticky verdicts, B5). **Session-local; never read back on a resume** |
| `last_review_tree` | QG-8 (Quality Review) passes | **Tree** SHA snapshotting the working tree as reviewed. Session-local; **never read back on a resume** |
| `uat_approved_tree` | QG-11 (UAT) passes | Tree SHA snapshotting what the user accepted. Session-local; **never read back on a resume** |
| `changes_after_review` | Computed before Phase 12 | Boolean: the current working-tree snapshot differs from `uat_approved_tree` |
| `run_id` | QG-0 | `<RUN_BRANCH>@<ISO-8601 start>` – distinguishes concurrent and abandoned runs |
| `state_persistence` | QG-0 (probe, plus consent on a public repo only) | `enabled` or `unavailable`; `unavailable` means no resume for this run |
| `STATE_COMMENT_ID` | QG-0 (comment created) | Id of the single run-state comment, edited in place thereafter |
| `design_path` | QG-4a (Step 1) | Approved plan on disk – the input that decides how far back a resume must step |
| `PLANNED_FILES` | QG-4, then extended at QG-5 / QG-10 / QG-11a | The run's changed-file list: every **file** path (never a directory) the plan named plus every path the implementation, test and documentation agents reported writing. Phase 12 stages exactly this list |
| `awaiting` | (obsolete) | Always `none` – the embedded reviews run inline and create no mid-phase pause. Retained as a written key for backward-compatible parsing |

Every variable above is persisted to the run-state comment described below, plus `tier`, `task_type`, `spec_maturity`, `has_ui_impact`, the three test-category commands, `test_harness_decisions` (Phase 4 Step 2a; **re-decided, not read back, on any resume into Phase 5 or later**) and a task-list snapshot. **Exceptions — session-local, never written to the comment (or written only as `-`):** `last_review_tree`, `uat_approved_tree`, `embedded_loop_iter`, and `judged_findings`. They belong to the session that created them and are re-derived from scratch on a resume.

### They are recorded values, not live shell variables

`BASE_BRANCH`, `RUN_BRANCH`, `NUMBER`, `PLANNED_FILES`, `LENS_DIR`, the detected commands and every SHA above are **run-state values the orchestrator holds and emits as literal assignments at the top of each snippet that reads them**, followed by a `: "${NAME:?not substituted}"` guard. Each Bash tool call is a fresh process – nothing assigned in one snippet survives into the next – so a snippet that merely *references* one of these names gets the empty string, and an empty value is silently wrong rather than loudly broken (`git diff --name-only ""...HEAD` prints nothing and exits 0; `git checkout ""` and `git branch -d ""` are no-ops or worse). The required snippet shape, and the reason a *list* of values is emitted as literal lines rather than as variable names to dereference, are specified once in [../operations/implement.md](../operations/implement.md) – "The substitution preamble".

**Nothing is committed before Phase 12.** Every baseline in this file is therefore a **working-tree tree snapshot**, not a commit SHA; a `<sha>..HEAD` range on this run's branch is empty by construction and would make each gate below a no-op. The snapshot recipe is in [../operations/implement.md](../operations/implement.md) – "The change set before the commit exists".

---

## Persisting the run state (resumability)

These variables live in the orchestrator's context, which a long 13-phase run can exhaust or a restart can lose – and losing the run state silently degrades the very pre-commit gate this file exists to enforce (the Issue #68 fix). The run state is therefore persisted to **one comment on the issue being implemented**, created once at pre-flight and updated in place.

Do **not** write this to a file inside the working tree – an in-repo state file would trip the clean-tree check in QG-0 and could be committed. That option was considered and rejected; do not reintroduce it.

This section is the **spec of record**. The phase files call into it; they do not restate the mechanics.

### Rule 11 carve-out (narrow, documented)

SKILL.md rule 11 forbids creating or modifying issues without explicit user approval. The run-state comment is a **narrowly scoped exception**: exactly **one** comment per run, on the issue the run already owns, created only after the consent prompt below, and thereafter only edited in place – never a second comment, never an edit to the issue body, title, labels, or state. Any other write still requires explicit approval. This carve-out does not derive from the abort-path precedent, which covers a user-visible terminal event, not routine unattended writes.

### Block format

The comment body is a collapsed `<details>` block wrapping the sentinel-delimited state. Substitute every `<...>`; omit no key (use `-` for a value not yet set).

```markdown
<details><summary>managing-issues run state (issue #<number>) - do not edit</summary>

<!-- managing-issues:run-state v2 -->
run_id: <RUN_BRANCH>@<ISO-8601 UTC start timestamp>
state_comment_id: <numeric id of this comment - informational, never a patch target>
updated_at: <ISO-8601 UTC>
head_sha: <full SHA of HEAD at this update>
state_persistence: <enabled|unavailable>
issue: <number>
base_branch: <BASE_BRANCH>
run_branch: <RUN_BRANCH>
tier: <1|2>
task_type: <docs|bug|feature|refactor>
spec_maturity: <none|partial|complete|complete_with_design>
has_ui_impact: <true|false>
review_level: <full|design|none>
lens_dir: <LENS_DIR|->
design_path: <path to the approved plan on disk|->
planned_files:
  - <one repo-relative file path per line; never a directory>
unit_test_cmd: <command|absent>
integration_test_cmd: <command|absent>
e2e_test_cmd: <command|absent>
test_harness_decisions: <none required | unit=<build|descope|accept:"<justification>">; integration=...; e2e=...>
last_passed_gate: <QG-N|QG-Na|none>
awaiting: none
awaiting_target: <->
awaiting_out: <->
last_review_tree: <always `-` - the snapshot is a session-local git object, never persisted>
uat_approved_tree: <always `-` - same>
gate_results: QG-0=<PASS|skipped|-> QG-1=... QG-2=... QG-3=... QG-4=... QG-4a=... QG-4b=... QG-5=... QG-6=... QG-7=... QG-8=... QG-9=... QG-10=... QG-11a=... QG-11=... QG-12=...
task_list_snapshot:
  - <todo item content> | <pending|in_progress|completed>
<!-- /managing-issues:run-state -->

</details>
```

**`gate_results` is written in full, and read as display only.** All sixteen gate keys are listed on every write; never compress the line by dropping unset keys. Within a single uninterrupted session it is the orchestrator's own record. **Read back on a resume it is untrusted and advisory** – it is displayed in the resume confirmation, never accepted as evidence a gate ran. Either way, a gate with no recorded state, or recorded as `-`, counts as **NOT passed**: an absent record is never an implicit pass.

**No secrets.** The block carries branch names, paths and SHAs only. Never write tokens, credentials, file contents, or user-supplied prose into it.

### Pre-flight: probe, consent, create

Run these three steps once, at QG-0, in order.

**1. Capability probe.** Not every run can write to the issue. Fork contributors, read-only tokens, archived repos and repos with issues disabled all fail.

```bash
gh repo view --json visibility,isArchived,hasIssuesEnabled,viewerPermission
```

`state_persistence = enabled` requires `isArchived=false`, `hasIssuesEnabled=true`, and `viewerPermission` in `ADMIN` / `MAINTAIN` / `WRITE`. Anything else, or a failing call, records `state_persistence = unavailable`.

**2. Public-repo consent.** The block is permanently and publicly visible on a public repo: it exposes branch names, tier, spec paths, gate-by-gate progress and unpushed commit SHAs. When `visibility != PRIVATE` and the probe said `enabled`, take an explicit opt-in **before writing anything**:

```
AskUserQuestion({
  questions: [{
    question: "This run can save its progress as a comment on issue #<number> so an interrupted run resumes instead of starting over. This repository is public, so that comment - branch names, which gates passed, and commit IDs that are not pushed yet - stays visible to anyone, permanently. Save it?",
    header: "Save progress",
    options: [
      { label: "Save progress", description: "Post one comment on the issue and keep it updated. If this run is interrupted it can pick up where it stopped" },
      { label: "Do not save", description: "Nothing is written to the issue. Nothing about this run becomes public, and an interrupted run has to start again from the beginning" }
    ],
    multiSelect: false
  }]
})
```

`Do not save` → `state_persistence = unavailable`. **On a private repo, do not ask** – the comment is written without a prompt, because its audience is already the repo's collaborators and a blocking stop buys nothing. Either way the comment is announced in one line when it is created, and it is never deleted afterwards: it stays on the issue as the run's audit trail.

**3. Create the comment.** Only when `state_persistence = enabled`. Capture the id it returns – every later write is an edit of that id.

```bash
NUMBER=42   # emitted as a literal; an empty one would POST to repos/{owner}/{repo}/issues//comments
[[ "$NUMBER" =~ ^[0-9]+$ ]] || { echo "refusing: issue number not numeric"; exit 1; }
STATE_COMMENT_ID=$(gh api "repos/{owner}/{repo}/issues/$NUMBER/comments" -f body="$BLOCK" --jq '.id')
```

`{owner}` and `{repo}` are **gh's own placeholders**, expanded by `gh api` from the current repository. They are deliberately not shell variables – there is no `OWNER` / `REPO` to assign, and introducing one would give an unassigned-variable URL (`repos///issues/...`) that 404s silently. Every `gh api` call in this skill uses the placeholder form.

Then rewrite the block with `state_comment_id` filled in and PATCH it once, so a human reading the issue can tell which comment the run owns.

**The in-body `state_comment_id` is informational only – never a patch target.** The authoritative id is the one the create call returned, and on a resume it is the `id` of the comment the accepted block was actually fetched from. The PATCH endpoint is repo-scoped, not issue-scoped, so a planted id would make every gate-boundary write overwrite an unrelated comment anywhere in the repository, sixteen times over. Never PATCH an id parsed out of a comment body.

### Updating in place (one comment per run)

At every gate boundary – gate PASS and gate skip – refresh `updated_at`, `head_sha`, the changed fields, `gate_results` and `task_list_snapshot`, then:

```bash
gh api --method PATCH "repos/{owner}/{repo}/issues/comments/$STATE_COMMENT_ID" -f body="$BLOCK"
```

**Never post a second comment.** A comment per gate would be 16+ notifications to every subscriber on the thread.

### A failed state write is never a gate failure

Persistence is a convenience, not a gate. If the create or any PATCH fails, set `state_persistence = unavailable`, tell the user in one line – "Progress could not be saved to issue #N (<reason>); if this run is interrupted it will have to start over" – and **continue the run unchanged**. No quality gate PASSes or FAILs on the outcome of a state write, and no gate waits on one.

### Degraded path

When `state_persistence = unavailable` for any reason (probe failed, consent declined, write failed), say so once, keep the state variables in context as before, and do not offer resume for this run.

---

## Resuming an interrupted run

An interrupted run is picked up by reading this block back from the issue. That read is a **security boundary** – the comment is writable by anyone on a public repo and editable in place by any collaborator – so it has its own spec of record: [run-state-resume.md](run-state-resume.md). It covers the fetch query and its author filter, the field shapes, the six acceptance rules, which fields are re-derived rather than read back, which resume points are reconstructible, the mid-phase `awaiting` pause, and the resume confirmation.

Two consequences bind the write side documented above:

- Every value written here must be one this file's block format can express **and** [run-state-resume.md](run-state-resume.md) can shape-validate. Adding a key to the block without adding its shape there makes the key unreadable – it is discarded unread on resume.
- Fields that decide a gate are **re-derived on resume, never read back**: `base_branch`, `review_level`, `test_harness_decisions`, the three test commands, `awaiting_target` / `awaiting_out`, and both tree snapshots. They are still written, because the run's audit trail is the point, but nothing downstream trusts them.


---

## Tracking Rules

1. **After QG-8 passes**: Record `last_review_tree` = a fresh working-tree snapshot
1b. **After QG-11a fixes pass their re-review**: Record `last_review_tree` again. QG-11a lands after QG-6/7/8/9 have already passed, so its fixes are post-review changes by definition – they run the decision matrix below at Phase 11, not silently at Phase 12.
2. **After QG-11 passes**: Record `uat_approved_tree` = a fresh working-tree snapshot
3. **Before Phase 12**: Snapshot again and check whether it differs from `uat_approved_tree`
4. **If different**: Trigger appropriate re-review level per decision matrix

---

## Pre-Commit Review Gate

Before committing in Phase 12, verify no unreviewed changes exist:

### 1. Check for Post-Review Changes

```bash
# Snapshot the working tree now, then compare it to the tree recorded at the last review.
TMP_INDEX=$(mktemp -t mi-index.XXXXXX)
GIT_INDEX_FILE="$TMP_INDEX" git read-tree HEAD
GIT_INDEX_FILE="$TMP_INDEX" git add -A
NOW_TREE=$(GIT_INDEX_FILE="$TMP_INDEX" git write-tree)
rm -f "$TMP_INDEX"
git diff --numstat "<last_review_tree>" "$NOW_TREE"   # change size for the matrix below
```

`git diff --stat <sha>..HEAD` is **not** usable here: no phase commits, so that range is empty on every standard run and would clear this gate unconditionally.

**On a resumed run `last_review_tree` is unset** (it is never persisted or read back – see [run-state-resume.md](run-state-resume.md), "Fields that decide nothing"), and the same holds if the snapshot object was garbage-collected. There is then no baseline, so the matrix below runs against the whole working-tree change set and lands on Full Review for anything non-trivial. That cost is the point: it is the only way the gate stays meaningful without a trustworthy baseline.

**The fallback base is the `BASE_BRANCH` this session detected, never one read out of the block.** QG-0 Step 1 re-detects it on every resume and a recorded value that differs rejects the block outright ([run-state-resume.md](run-state-resume.md), rule 2). A block naming the run's own branch here would make the fallback diff a branch against itself – empty output, "no unreviewed changes", and every post-review change waved through, which is precisely the Issue #68 regression this file exists to prevent.

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

- Re-snapshot the working tree into `last_review_tree`
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
        last_review_tree = snapshot_working_tree()
        re_review_iterations += 1
        IF re_review_iterations >= 3:
            → ESCALATE to user (re-review loop not converging; fixes keep introducing changes)
        ELSE:
            GOTO Phase 12 Entry Check
```

**`re_review_iterations` is one of three distinct iteration counters** (Rule 14a in [../operations/implement-rules.md](../operations/implement-rules.md)); it is **not** the same counter as an embedded-review gate's `embedded_loop_iter` or a gate's per-attempt retry cap. It counts **whole Phase-12 pre-commit re-review passes** (from 1) and caps at **3 iterations**; when a Phase-12 re-review invokes Phase 8, that Phase-8 run has its own `embedded_loop_iter` nested inside this pass. Without this cap, post-UAT fixes that themselves introduce changes could loop indefinitely.

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
- [Phase 8: Quality Review](../phases/8-quality-review.md) - Records the `last_review_tree` snapshot
- [Delta Review](delta-review.md) - Lightweight re-review process
- [Run-state resume](run-state-resume.md) - the read side of the block written here: fetch query, field shapes, acceptance rules, and what a resume does not guarantee
