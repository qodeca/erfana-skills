# Rules for bulk work on issues

These rules hold in every run of `erfana:backlog`. Each one says why it exists, so it can be applied sensibly to a case it does not name.

## Contents

1. Preflight
2. The code snapshot
3. Safe commands
4. Labels and types
5. Closing
6. Write pacing
7. Access

## 1. Preflight

Before any analysis, find out and record in the plan header:

- **The repository.** `gh repo view --json nameWithOwner,defaultBranchRef,visibility` in the current clone gives the name, the default branch, and the visibility. Store the name once and pass it with `--repo` on every later `gh` call. A value read from issue text could point the run at another repository.
- **The account.** `gh auth status` shows the active account and its token scopes.
- **Write access.** `gh api "repos/<owner>/<name>" --jq .permissions.push` must print `true`. Closing issues and setting types need it; without it GitHub drops some changes and still reports success. If it is not `true`, stop.
- **Issue types.** They exist only in repositories owned by an organisation that has them. `gh api "orgs/<owner>/issue-types" --jq '.[].name'` lists them. If the call fails or prints nothing, the plan carries no `type` lines and the header says "issue types: not available"; kind labels carry the kind instead. Use only type names from that list.
- **The wording.** Apply the outside-reader test in section 8 of the issue guide and record the decision with its input, for example `Wording: outside readers – collaborators call failed (403)`.

## 2. The code snapshot

Evidence must show what is merged, and the user may be on another branch with uncommitted work. So the run never reads the user's working tree:

```bash
git fetch origin <default>
git worktree add --detach "<run folder>/code" origin/<default>
git -C "<run folder>/code" rev-parse HEAD      # the snapshot commit, recorded in the plan header
```

Remove it with `git worktree remove "<run folder>/code"` when the plan is applied or discarded, and also when a run fails.

## 3. Safe commands

A title such as `--repo other/x` or a label with a quote in it must never become part of a command.

- An issue or pull request number matches `^[0-9]+$` before it reaches a shell.
- A label is used only if `gh label list --repo "<owner>/<name>" --limit 500` prints it.
- A body or a comment is always a file under the run folder's `bodies/`, passed with `--body-file`; it is never inline text. A title is a file too, read into one quoted argument.
- `gh issue close` takes no file, so a closing comment is posted first with `gh issue comment <n> --body-file <file>` and the issue is then closed with no `--comment`.
- One command per issue. Several numbers in one call give one result for all of them, and each plan line needs its own.
- A GraphQL call, if one is needed, takes values only through `-F name=value` variables, never spliced into the query text.

## 4. Labels and types

- **Kind labels only.** The kinds are `bug`, `feature` or `enhancement`, `refactor`, `documentation`, `dependencies`, `design`, and `security`. Add one only when the repository has it and the issue lacks it. Never remove a kind label a person set unless a plan line says so and the user left it ticked.
- **No other label is added or removed** – not priority, status, review, release, or claim labels. Pipelines and people act on them, and their names differ in every repository. If one looks wrong, write a note for the user in the plan.
- **Type and kind go together.** Bug with `bug`; Feature with `feature` or `enhancement`; Task with `refactor`, `documentation`, `dependencies`, `design`, `security`, or chores.
- **Set a type, then read it back.** `gh issue edit <n> --repo "<owner>/<name>" --type <Name>`, then `gh issue view <n> --repo "<owner>/<name>" --json issueType`. If the type is not there, mark the line failed.

## 5. Closing

| Case | Commands, in order |
|---|---|
| Proven done | `gh issue comment <n> --body-file <file>`, then `gh issue close <n> --reason completed` |
| Duplicate | `gh issue comment <n> --body-file <file>`, then `gh issue close <n> --duplicate-of <keeper>` |
| Folded into a checklist issue | `gh issue comment <n> --body-file <file>` (it links the checklist issue), then `gh issue close <n> --reason "not planned"` |

The closing comment for "proven done" lists each criterion with its reference – a commit id, a pull request number, or `path:line` – and ends with "Reopen if something is missing." It cites; it does not quote code, values, or logs. The detailed evidence stays in the run folder.

## 6. Write pacing

- Only the main conversation writes to GitHub, and only during apply. Helper agents hold read and search tools and never write.
- One request at a time, at least one second apart (`sleep 1` between calls). GitHub allows about 80 content-creating requests a minute, and parallel writes trip the limit and leave a run half-applied.
- On a rate-limit answer (HTTP 403 or 429, or a "secondary rate limit" message), wait for the `retry-after` value, or 60 seconds when there is none, then retry and double the wait each time. After three failed attempts on one line, stop the apply, mark the remaining lines `pending` in the report, and tell the user how to resume.

## 7. Access

A token that reaches only this repository limits what a mistake can touch. Suggest one – a fine-grained token with Issues read and write, Contents read, and Metadata read – without requiring it. With a broad token, write "broad token – reaches every repository of this account" in the plan header, so the user sees it before approving.
