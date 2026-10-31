# Your first erfana session

*This page describes erfana v9.3.0. See the [changelog](../CHANGELOG.md) for what changed since.*

In this tutorial you install erfana, make a small practice project, and use the `erfana:draft-goal` skill to write a finished `/goal` condition for it. A `/goal` condition is a short text that tells Claude Code what "done" means, so it can keep working, turn after turn, until every check passes.

Everything happens on your own computer, in a folder you create and delete at the end. Nothing is pushed, published, or sent anywhere.

It takes about 15 minutes, or 25 with the optional spec step. The steps use Claude Code; if you use Qwen Code, see the note at the end of each step.

## What you need

- Claude Code, signed in and working.
- `git` and a terminal with `bash`. On Windows, use Git Bash.
- On macOS and Linux, `jq` on your `PATH`, so the safety hooks work (macOS: `brew install jq`). On Windows, Git Bash with `powershell.exe` on `PATH` instead; `jq` is not needed there. The tutorial still works without them, but the hooks then protect nothing.

## Step 1 – install erfana

Start Claude Code in any folder:

```bash
claude
```

Inside the session, add the erfana marketplace and install the plugin:

```text
/plugin marketplace add qodeca/erfana-skills
/plugin install erfana@erfana-skills
```

Quit Claude Code (type `/exit`) so the skills and hooks load fresh next time. From your shell, run `claude plugin list` and look for `erfana@erfana-skills` with `Status: ✔ enabled`. To confirm the safety hooks are on, ask Claude to run `sudo -n true` in the next session: it should be blocked. The other checks are in [check the install](how-to.md#check-the-install).

On Qwen Code, run `qwen extensions install qodeca/erfana-skills:erfana` in a shell instead, and accept the prompt it shows. If `qwen extensions list` already shows `✓ erfana (x.y.z)`, [update it](how-to.md#update-on-qwen-code) instead, because `install` refuses when erfana is present.

## Step 2 – make a practice project

In your terminal, create a new folder with a tiny script and a test for it:

```bash
mkdir ~/erfana-tutorial
cd ~/erfana-tutorial
git init
printf '#!/usr/bin/env bash\necho "Hello, $1!"\n' > greet.sh
printf '#!/usr/bin/env bash\nout=$(bash greet.sh Ada)\nif [ "$out" = "Hello, Ada!" ]; then echo PASS; else echo "FAIL: $out"; exit 1; fi\n' > test.sh
bash test.sh
```

The last command prints:

```text
PASS
```

You now have a git repository with two files. `greet.sh` greets a name, and `test.sh` checks that it does. One thing is missing: run `bash greet.sh` with no name and it prints `Hello, !`. That is the task you will describe in a goal.

## Step 3 – start Claude Code in the project

From the same folder, start Claude Code:

```bash
claude
```

If Claude Code asks whether you trust the files in this folder, say yes – you created them a moment ago.

Check that erfana loaded: type `/erfana:` and look at the autocomplete list. It shows the erfana skills and commands, including `/erfana:draft-goal`. If the list is empty, see the [install how-to](how-to.md#install-on-claude-code).

On Qwen Code, run `qwen` instead and look for `/draft-goal` – on Qwen Code, skills use their bare names.

## Step 4 – ask for a goal

Type this as your message and press Enter:

```text
/erfana:draft-goal make greet.sh print a usage message and exit with status 1 when it gets no name, and keep test.sh passing
```

The skill reads `greet.sh` and `test.sh` to find a real command that proves the work is done. It does not change any files.

This example works only inside the practice folder from Step 2, because the skill needs `test.sh` as its check. In any other folder, describe a task about your own files instead; if the skill cannot find a command that proves the work is done, it may print **Needs clarification**.

It may then ask you one to three short questions, such as which check proves the work is done or how many turns to allow. Each question comes with options, and the recommended one is listed first. Pick the recommended option each time.

On Qwen Code, type the same message with `/draft-goal` at the start.

## Step 5 – read your goal

The skill ends its reply with your goal. The exact wording differs from run to run, but the shape is always the same:

- One or two sentences saying what the goal will make Claude do and which choices it made for you. Because this task is so small, it may also say it could make the change directly – that is expected.
- A line `===== GOAL – START (copy the /goal line below) =====`.
- A code block with one line that starts with `/goal Outcome:` and then lists `Done when:` checks, `Owner decisions:`, `Not in scope:`, and a `Bound:` (a turn limit).
- A line `===== GOAL – END =====`.
- A short "How to use it" list, and sometimes an "Assumptions" list.

Look at the `Done when:` part. At least one check names a command, such as `bash test.sh`, and asks for its result to be shown. That is what makes the goal finishable: Claude Code's goal checker reads only the conversation, so it can only count what Claude shows there.

You have finished the task: you have a `/goal` condition you can paste. If the skill printed **Needs clarification** instead, it is telling you something was missing. Answer what it lists, then run Step 4 again.

## Step 6 – run the goal (optional)

If you want to watch the goal work, type `/copy` and pick the code block, or select the single `/goal` line inside it (not the marker lines). Paste it as your next message and press Enter. Claude edits `greet.sh`, runs the checks, and shows the results until every check passes. If Claude Code asks for permission to edit the file or run a command, allow it.

This is safe to try: the practice repository has no remote, so nothing can be pushed, and the goal's `Not in scope:` part rules out actions you cannot undo.

Type `/goal` alone to see progress, or `/goal clear` to stop early.

## Step 7 – write a spec for the same change (optional)

A goal says when work is done. A spec says what to build. Try the `erfana:spec` skill on the same small change, still inside `~/erfana-tutorial`:

```text
/erfana:spec create a spec: greet.sh prints a usage message and exits with status 1 when it gets no name
```

What happens:

1. The skill recommends a tier – for a change this small, T1 – and says why. Accept it.
2. It may ask one or two questions, such as what the usage message should say. Answer in a few words.
3. It shows the requirement it will write, with an ID such as `001-FR-001` and its acceptance criterion `001-AC-001`. Say yes.
4. Because the project has no specs yet, it creates `specs/registry.json` and tells you so. It then writes the spec folder `specs/spec-t1-001-<slug>/` with `manifest.json` and `spec.md`; the skill picks the `<slug>` from your words.
5. A separate checker agent reviews the spec and the skill reports what it found.

Check the result in your terminal:

```bash
ls specs
```

The output lists `registry.json` and the new `spec-t1-001-…` folder. The skill wrote files only under `specs/`; it committed nothing. On Qwen Code, type the same message with `/spec` at the start.

## Step 8 – clean up

Quit Claude Code with `/exit`, then delete the practice folder:

```bash
cd ~
rm -rf ~/erfana-tutorial
```

erfana stays installed for your real projects.

## What you learned

- How to install erfana and check that its skills loaded.
- How to start a skill by name with `/erfana:<name>`.
- How an erfana skill reads your project first, asks only what it cannot find out, and recommends an answer.
- What a good `/goal` condition contains: one outcome, checks with visible proof, and a turn limit.
- How a spec turns one change into numbered requirements with acceptance criteria.

## Next steps

- Use a goal on real work, or let erfana set up a longer run: [run an unattended session](how-to.md#run-an-unattended-session).
- Write requirements before you build: [write a requirements spec](how-to.md#write-a-requirements-spec).
- Find the skill for your next job: [pick the right skill](how-to.md#pick-the-right-skill).
- Look up every skill and its options in the [reference](reference.md), or read [how erfana is built](explanation.md#how-erfana-is-built).
