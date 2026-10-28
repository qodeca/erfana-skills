# Claims on GitHub

How a session marks a GitHub issue as taken, so parallel sessions – other clones of the same repository, other machines – do not start the same work. GitHub is the board because it is the one place every clone and machine can read and write; a local file or a message between sessions on one machine does not reach a session on another computer.

## The claim

A claim is two things on the issue, both required:

1. The label `claimed`.
2. One comment whose first line is the marker, followed by who holds it:

   ```text
   <!-- erfana:claim -->
   Claimed by <session tag> on <YYYY-MM-DD HH:MM UTC>. Working on: <one line>.
   ```

The **session tag** is `<folder>@<host>` – the working folder's name and the short host name (`cmplus-2@macbook`). Get them with `basename "$PWD"` and `hostname -s`. It is how a person, and the next session, tell parallel sessions apart. It assumes one working session per folder per host – two sessions in one folder edit the same files, which no claim can make safe; if you see that, tell the user.

Claim commands, with the issue number validated as digits only and written as a literal:

```bash
gh label list --search claimed --json name   # create the label only if this prints no "claimed"
gh label create claimed --color FBCA04 --description "Taken by a working session"
gh issue comment 42 --body-file '<mktemp path>'
gh issue edit 42 --add-label claimed
```

Write the comment body to a fresh `mktemp` file with the file-write tool, never through the shell; the system cleans its temp folder. Create the label only when the list shows it missing – it is the one change to the repository's settings that claiming makes – and stop on any error from these commands rather than hiding it. The comment goes first, so a failure leaves no bare label; if the label step fails after the comment, post a released comment and report the failure, so no half-made claim of yours blocks other sessions.

**Two sessions at once.** Check-then-claim is not atomic, so after claiming, read the issue's comments again. If another session holds an older active claim (below), it wins: post a released-marker comment with the reason "claimed first by <tag>", leave the label in place because it still marks the winner's claim, and report it.

**On a public repository** – check with `gh repo view --json visibility`, and treat the repository as public if the check fails – the session tag shows folder and host names to everyone: ask the user before the first claim there, and in an unattended run claim nothing on a public repository – report it instead. The full account lists a created label as a repository change.

## Is an issue free?

Skip closed issues. An issue is **held by this session** when it has the label and a claim comment carrying this session's tag – claiming it again changes nothing. A label with no claim comment is a half-made claim: report it and leave it. A claim comment is **active** until a later `<!-- erfana:claim-released -->` comment from the same session tag follows it. With several active claim comments, the oldest is the holder; on equal timestamps, the comment with the lower id (earlier in the list GitHub returns) wins.

Otherwise an issue is **taken** when any of these holds:

- it has the `claimed` label;
- it has an assignee other than the current GitHub user;
- an open pull request links it (`gh pr list --state open --search "<number> in:body"` or a branch named `issue-<number>-…`).

Otherwise it is free. Before claiming, read the issue again – another session may have claimed it a minute ago. If it is now taken, skip it and say by whom.

## Release

When the work is merged, abandoned, or handed back: add a comment – written to a `mktemp` file like the claim – with the marker `<!-- erfana:claim-released -->` and one line saying why, and remove the label (`gh issue edit 42 --remove-label claimed`) only when no other active claim remains on the issue. A merged pull request with `Closes #42` closes the issue; still remove the label so the board stays true.

## Stale claims

A claim is **stale** when the newest of these is more than 24 hours old: the claim comment, the latest comment on the issue, and the last update of a pull request that links the issue (`gh pr list --state open --search "<number> in:body" --json updatedAt`). Report stale claims and leave them; releasing another session's claim follows the rule in `SKILL.md`.
