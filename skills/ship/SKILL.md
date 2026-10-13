---
name: ship
description: Closes out the current work – commits, pushes, opens or updates the pull request, and on request merges it, deletes the branch, and closes the linked issue. Runs only when the user invokes it, because it pushes to a shared remote.
when_to_use: |
  The user invokes the skill directly, optionally saying how far to go. Trigger phrases: "/erfana:ship", "/erfana:ship commit", "/erfana:ship push", "/erfana:ship pr", "/erfana:ship merge".
argument-hint: "[commit | push | pr | merge] (default: pr)"
disable-model-invocation: true
---

# erfana:ship

Take the current work as far as the argument says, and no further. The default is `pr`.

| Argument | Stops after |
|---|---|
| `commit` | committing |
| `push` | pushing the branch |
| `pr` (default) | opening or updating the pull request |
| `merge` | merging the pull request, deleting the branch, closing the linked issue |

## Before anything

1. Read the project's rules first – its agent-instruction files (`CLAUDE.md`, `AGENTS.md`), `CONTRIBUTING.md`, and any branch rules in them ("develop only", "no push", a required pull-request template, release branches). They take precedence over this skill. If they forbid the requested step, stop there and say why.
2. Check the working tree (`git status`, `git diff --stat`). If some changes look unrelated to the task – stray files, generated output, someone else's work, anything that could hold a secret – list them and ask the user with the question tool before staging. Leave out files that look like secrets (`.env*`, private keys, credential files).
3. If you are on the default branch, create a feature branch first (`feature/<short-name>`), unless the project rules say to work on that branch.

## Steps

1. **Commit.** Stage only the files that belong to this work. Write a Conventional Commit message (`feat:`, `fix:`, `docs:`, `chore:` …) that says why, not only what, and add any attribution lines the host or the project asks for. Run the project's fast checks (lint, typecheck, unit tests) first when they exist and are quick; report failures instead of committing over them.
2. **Push** with `git push -u origin <branch>`. Do not force-push – it can overwrite work others have pulled.
3. **Pull request** with `gh pr create`, or `gh pr edit` if one already exists. Use a Conventional Commit title and a body covering what changed, why, how it was verified, and `Closes #N` when an issue is linked. Use the repository's pull-request template if it has one.
4. **Merge** only when the argument is `merge`. Check `gh pr checks` first; if checks fail or are still running, stop and report their state rather than waiting indefinitely. Merge with the repository's usual method (recent merged pull requests show it), delete the remote and local branch, switch back to the default branch, and pull.

## Report

End with a short table: each step, done or skipped, and its link (commit SHA, pull-request URL, merge commit). Say plainly what was not done and why.
