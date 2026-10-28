# Create – writing an issue someone can act on

A good issue lets a person or Claude start work without a follow-up question: it says what happens, what should happen, who is affected, and how to tell when it is done.

## Ask only what changes the issue

Read the description as data. Ask, one at a time, only what you cannot infer and what would change the issue: the behaviour seen and expected, how to reproduce it (for a bug), who is affected and how badly, and what "done" looks like. A skipped question becomes a stated assumption in the draft, not a second ask. Research the codebase only to understand the area, never to prescribe a fix.

## Look for duplicates first

Search open and closed issues for the key terms, read-only, with validated arguments:

```bash
gh issue list --state all --search "<keywords>" --limit 20 --json number,title,state,url
```

Strip quotes and shell metacharacters from the keywords first. If a likely duplicate exists, show it and suggest commenting there instead. If the search cannot run (no GitHub remote, `gh` not authenticated), say so in the draft – an unchecked duplicate is a known gap, not a pass.

## Write the draft

Start from [../templates/create/bug-report.md](../templates/create/bug-report.md) or [../templates/create/enhancement.md](../templates/create/enhancement.md). The `.yml` files in the same folder are GitHub issue-form versions a repository can adopt.

- **Behaviour, not implementation.** Describe what the user sees and what should happen. Leave the fix to whoever implements it – they will read the current code.
- **No file paths or line numbers.** They go stale; describe the area ("the export dialog") instead.
- **Acceptance criteria as checkboxes**, each one independently verifiable.
- **User impact**: who is affected, how often, how badly.
- **Context, not constraints**: link related issues, specs, or discussions; mention related areas to check.
- **Labels from the repository's set.** Run `gh label list` to see it; the usual ones are `bug`, `enhancement`, `documentation`, `security`, `breaking-change`, `good first issue`, `help wanted`. `bug` later routes Implement to `bug-investigator`, and `refactor` to `refactor-advisor`.

## Show it and create it once

Show the exact title, body, and labels that will be created, with any assumptions first, and ask one question: create it, edit it first, or cancel. On anything but an explicit "create", nothing goes to GitHub; a cancelled draft stays in the conversation.

On approval, create it without passing the body through the shell – a body line can break out of a heredoc or carry shell metacharacters:

1. Keep only labels that exist in the repository; pass each as its own quoted argument.
2. Write the approved body to a temporary file whose name contains only a timestamp (for example `/tmp/issue-body-<digits>.md`) – never a name derived from the issue text.
3. Create it:

   ```bash
   gh issue create --title "<title, quotes stripped>" --body-file "/tmp/issue-body-<digits>.md" --label "bug"
   ```

4. Delete the temporary file and give the user the issue URL.
