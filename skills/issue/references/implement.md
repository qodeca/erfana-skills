# Implement – how a run works

Work an existing issue the way an experienced developer would: understand what it asks, design the change, build it with tests, have it reviewed, and let the user accept it before anything is committed. This file holds the judgment and the recipes; the ground rules in `SKILL.md` always apply.

## The shape of a run

Thirteen phases, each closed by a quality gate (QG-0 … QG-12), plus three embedded review sub-gates (QG-4a, QG-4b, QG-11a). The phases are outcomes, not ceremonies: do each one at the depth the issue needs, record the gate result in one line so the user can follow, and move on.

| Phase | The result | Gate |
|---|---|---|
| 0 Pre-flight | The issue is readable and open with acceptance criteria; the tree is clean; the run starts from the default branch on a new branch; the baseline checks pass; tier, task type, UI impact, and toolchain commands are recorded | QG-0 – **never skipped** |
| 1 Team | The agents for this run are chosen (table below) | QG-1 |
| 2 Requirements | Every acceptance criterion is understood and testable; genuine product ambiguities are asked, technical ones are not | QG-2 |
| 3 Discovery | The files the change touches, their dependencies, and the patterns to follow (`issue-codebase-explorer`) | QG-3 |
| 4 Design | A plan on disk that meets every criterion (`issue-solution-designer`), reviewed by QG-4a and judged by QG-4b | QG-4, QG-4a, QG-4b |
| 5 Build | Code and tests written (`software-developer`, `test-writer`, `e2e-test-writer` for UI flows); the detected typecheck and test commands exit 0 | QG-5 |
| 6 Architecture | No critical structural problem (`architecture-reviewer`) | QG-6 |
| 7 Security | The secret scan below finds nothing and the dependency audit reports no high or critical issue (`security-auditor` for the deeper review) | QG-7 – **never skipped** |
| 8 Quality | The change set reviewed and fixed per [embedded-review.md](embedded-review.md); tests and typecheck pass | QG-8 |
| 9 Verification | Every acceptance criterion is met and the change matches the plan (`issue-spec-compliance-checker` when a spec exists, else `issue-solution-designer` verification mode) | QG-9 – **never skipped** |
| 10 Documentation | Docs, changelog, and agent-instruction files that the change affects are updated; every new relative link resolves | QG-10 |
| 11 Acceptance | QG-11a reviews and fixes the whole change set, then the user tries the result and accepts it (UAT) | QG-11a, QG-11 |
| 12 Finalize | The re-review gate passes, the user confirms the commit and the branch action, and the commit holds exactly the planned files | QG-12 |

**Tiers set depth, not which phases run.** Tier 1 (labels `documentation`, `typo`, `chore`, `good first issue`) runs every phase lightly and skips the three sub-gates; Tier 2 (everything else, the default) runs everything fully. A Tier 1 UAT may be an automated check (the build succeeds and the dev server starts) when the user did not ask to try it.

**A spec changes discovery into validation.** When the repository holds a complete spec for the issue, phases 2–4 check the spec against the code instead of rediscovering it, and fall back to discovery if the spec turns out to be stale.

## Who decides what

The run makes every technical decision itself – design, patterns, data model, libraries, file layout, test strategy – by current best practice, a targeted web lookup when it meets a genuine unknown, and judgment. It records each decision in one line. It does not ask the user how to build something.

The user is asked only:

1. a genuine requirements ambiguity in phase 2 (what the change should do, never how);
2. UAT at QG-11;
3. the commit, and then the branch action (push, merge, delete), at QG-12;
4. a contradiction a reviewer cannot resolve (two acceptance criteria that cannot both hold);
5. a gate that still fails after three attempts – escalate with what was tried.

**A headless run cannot finish.** UAT and the git confirmation need a person. Without one, stop before creating a branch, say so, and leave nothing behind. In CI (`$CI` or `$GITHUB_ACTIONS` set), refuse at QG-0.

## Agents

| Need | Agent |
|---|---|
| Codebase discovery | `issue-codebase-explorer` |
| Design, verification, and the review judge | `issue-solution-designer` (planning, verification, and JUDGE modes) |
| Build | `software-developer` (or `react-developer` / `nest-developer` for those stacks), `test-writer`, `e2e-test-writer` |
| Review lenses | `architecture-reviewer`, `solution-reviewer`, `code-reviewer`, `security-auditor`, `ux-reviewer` (UI changes), `refactor-advisor` (`refactor` label) |
| Spec conformance | `issue-spec-compliance-checker` |
| UI design | `ux-designer`, `ui-designer` |
| Root cause for a `bug` label | `bug-investigator` |
| Commit message | `commit-writer` |

Each agent gets a self-contained brief – it has no memory of this conversation: the issue and its acceptance criteria, the plan, the files in scope, its job, and what it is not responsible for. An agent that needs a decision returns the question; ask it here.

## Recipes

### Values are literals, not shell variables

Every shell call runs in a fresh process, so nothing a previous call assigned survives. A snippet that needs a run value (the base branch, the issue number, the planned files) writes it as a literal at the top and guards it, so a missed substitution fails loudly instead of silently doing nothing:

```bash
BASE_BRANCH=main
NUMBER=42
: "${BASE_BRANCH:?not substituted - refusing to run}" "${NUMBER:?not substituted - refusing to run}"
[[ "$NUMBER" =~ ^[0-9]+$ ]] || { echo "refusing: issue number not numeric"; exit 1; }
```

### Pre-flight

```bash
BASE_BRANCH=$(gh repo view --json defaultBranchRef --jq .defaultBranchRef.name)   # the default branch
git status --porcelain                                                         # must print nothing
gh issue view "$NUMBER" --json state,title,body,labels,assignees               # open, with acceptance criteria
```

Detect the toolchain from the manifest (`package.json` scripts, `pyproject.toml`, `Makefile`, `Cargo.toml`, `go.mod`) and record the test, typecheck, lint, build, and dev commands, or `absent`. Run the baseline checks; failing baseline tests stop the run – fixing someone else's failures is not this issue. Then branch: `git switch -c issue-<NUMBER>-<slug> "$BASE_BRANCH"`.

### The change set exists before any commit

Nothing is committed before phase 12, so a commit range (`<base>...HEAD`) is empty for the whole run. The change set is the working tree:

```bash
{ git diff --name-only; git diff --cached --name-only; git ls-files --others --exclude-standard; } | sort -u
```

To remember what a review saw, snapshot the working tree as a tree object (no commit, index untouched):

```bash
TMP_INDEX=$(mktemp -t issue-index.XXXXXX)
GIT_INDEX_FILE="$TMP_INDEX" git read-tree HEAD
GIT_INDEX_FILE="$TMP_INDEX" git add -A
GIT_INDEX_FILE="$TMP_INDEX" git write-tree     # prints the tree SHA
rm -f "$TMP_INDEX"
```

Compare two snapshots with `git diff --stat <tree-a> <tree-b>`.

### QG-7 secret scan (fail-closed)

Any hit fails QG-7, whatever an agent concludes. An empty file list is a failure too – it means the change set was resolved wrongly, not that the run wrote nothing.

```bash
secret_hits=$({ git diff --name-only; git diff --cached --name-only;
                git ls-files --others --exclude-standard; } 2>/dev/null | sort -u \
  | xargs -r grep -InEH \
      -e 'AKIA[0-9A-Z]{16}' \
      -e '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]{20,}|rk_live_[a-zA-Z0-9]{20,})' \
      -e 'sk-ant-(api|admin|sid)[0-9]{2}-[A-Za-z0-9_-]{32,}' \
      -e '(ghp_|gho_|ghs_|ghu_)[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}|glpat-[0-9A-Za-z_-]{20,}' \
      -e 'hf_[A-Za-z]{34}|api_org_[A-Za-z]{34}|npm_[a-zA-Z0-9]{36}|xox[bpas]-[0-9a-zA-Z-]{10,}|AIza[0-9A-Za-z_-]{35}' \
      -e -- '-----BEGIN[ A-Z]*PRIVATE KEY-----' \
      -e 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' \
      -e '(API_KEY|API_SECRET|SECRET_KEY|ACCESS_TOKEN|AUTH_TOKEN|PRIVATE_KEY|PASSWORD)[[:space:]]*[=:][[:space:]]*["'"'"'][A-Za-z0-9_/.+-]{12,}' \
  || true)
if [ -n "$secret_hits" ]; then echo "QG-7 FAIL: potential secret(s):"; echo "$secret_hits"; exit 1; fi
```

Run the project's own dependency auditor (`npm audit --json`, `pip-audit`, `cargo audit`) and read its severity counts: high or critical fails QG-7; moderate and low are recorded. The raw exit code is not the verdict – most auditors exit non-zero on any severity.

### Before the commit: nothing unreviewed

Snapshot the tree after QG-8 passes (`last_review_tree`) and again after the user accepts at UAT (`uat_approved_tree`). Before committing, snapshot once more. If it differs from the UAT snapshot, the difference is unreviewed: review it with the lenses it touches (any change to auth, input handling, secrets, or dependencies also re-runs QG-7), then show the user what changed since they accepted it. Never commit a change the user has not seen.

### Finalize (QG-12)

1. Re-run the detected test, typecheck, and lint commands.
2. Have `commit-writer` draft a Conventional Commit message that references the issue (`Closes #<NUMBER>` when it fully resolves it).
3. Ask the user to confirm the commit – show the message and the exact file list.
4. Stage exactly the planned files: one quoted path per entry, each checked to exist; then confirm that nothing unplanned is staged and nothing the run changed is missing (`git diff --cached --name-only` against the change set above). Never `git add -A`.
5. Commit, then ask what to do with the branch – push and open a pull request (the default; body from [../templates/implement/pr-description.md](../templates/implement/pr-description.md)), merge locally, or leave it – and do only that.

Close with a full account: the gate results, every technical decision made, accepted tech debt, anything requested but not done and why, and what the user should do next.

### Abort

On the user's request or an escalation the user does not resolve: leave the working tree as it is so nothing is lost, report the branch name and what was done, and do not delete anything.
