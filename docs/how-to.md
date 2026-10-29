# How-to guides

*This page describes erfana v9.2.1. See the [changelog](../CHANGELOG.md) for what changed since.*

Each section below is a recipe for one goal. It assumes you know what you want to do and need the steps. If you are new to erfana, start with the [tutorial](tutorial.md). For every skill, agent, command, and hook in one list, see the [reference](reference.md). For why erfana works the way it does, see the [explanation](explanation.md).

## Install on Claude Code

Before you start, check what erfana needs on your machine:

| Need | Why |
|---|---|
| On macOS and Linux: [`jq`](https://jqlang.github.io/jq/) on your `PATH` (macOS: `brew install jq`) | Without it, five of the six [safety hooks](explanation.md#safety-hooks-and-why-they-fail-open) skip themselves and protect nothing. |
| The GitHub CLI (`gh`), logged in | The skills `erfana:issue`, `erfana:next-batch`, `erfana:coordinate`, and `erfana:ship` use it, and so do the slash commands `/erfana:explain-issue`, `/erfana:project-status`, and `/erfana:lens-review` on a pull request. |
| On Windows: Git Bash, with `powershell.exe` on `PATH` | The hooks start through Git Bash and run their PowerShell versions; a Windows machine with no Git Bash runs no hooks. |

The marketplace is public, so you need no GitHub token. Inside Claude Code, run:

```text
/plugin marketplace add qodeca/erfana-skills
/plugin install erfana@erfana-skills
```

The first line registers the marketplace under the name `erfana-skills` (the name in its `marketplace.json`). The second installs the plugin: `erfana` is the plugin name, and the part after `@` is the marketplace name. Each command should finish without an error. erfana promises no exact success text for these two commands, because Claude Code's own wording can change; `claude plugin list` in [check the install](#check-the-install) is the real confirmation. If Claude Code does not know the `/plugin` command, update Claude Code first.

Restart Claude Code: type `/exit` (or close the session), then run `claude` again. Skills, agents, and hooks load when a session starts, so the hooks are active only from the next session.

### Check the install

1. **The plugin is listed.** From a shell, run:

   ```bash
   claude plugin list
   ```

   The erfana entry looks like this, with the version of the latest release:

   ```text
     ❯ erfana@erfana-skills
       Version: 9.2.1
       Scope: user
       Status: ✔ enabled
   ```

   The latest release number is the newest entry in [`CHANGELOG.md`](../CHANGELOG.md), or the top entry on the [releases page](https://github.com/qodeca/erfana-skills/releases).

2. **The skills loaded.** In a new session, type `/erfana:`. Autocomplete lists the erfana skills and commands, such as `/erfana:draft-goal`.
3. **A skill starts from plain words.** Type a request such as "draft a goal for adding a --help flag to my script". `erfana:draft-goal` should start: Claude Code shows that it loaded the skill, Claude reads your files, may ask one to three questions, and ends with a block between the lines `===== GOAL – START (copy the /goal line below) =====` and `===== GOAL – END =====`. It needs no `gh`.
4. **The safety hooks are active.** Ask Claude to run `sudo -n true`. With the hooks active, the `bash-safety` hook blocks it, and Claude reports `BLOCKED: Privilege escalation (sudo/doas/pkexec) is not appropriate for an automated agent`. If the command runs instead, the hooks are off: see [safety hooks do not fire](#safety-hooks-do-not-fire). The hook runs before Claude Code asks you to allow the command (inferred from the hook order, not checked in a live session); if a permission prompt appears, approving it is safe, because the hook still blocks. On macOS and Linux, the usual cause of a hook that does nothing is a missing `jq`. Run `command -v jq` in a shell: no output means `jq` is missing.

### Install from a local clone

Use this when your network blocks GitHub for Claude Code, or when you want to try changes to erfana before they are released. Clone the repository, then register the folder as a marketplace:

```text
/plugin marketplace add /absolute/path/to/erfana-skills
/plugin install erfana@erfana-skills
```

To pick up new changes later, run `git pull` in the clone, then `/plugin marketplace update erfana-skills`. To propose your changes, follow [`CONTRIBUTING.md`](../CONTRIBUTING.md).

To go back to the published release, remove the local marketplace and add the public one. Removing a marketplace also uninstalls the plugins that came from it, so install again afterwards:

```text
/plugin marketplace remove erfana-skills
/plugin marketplace add qodeca/erfana-skills
/plugin install erfana@erfana-skills
```

Then restart Claude Code.

## Install on Qwen Code

erfana is tested against Qwen Code 0.22.3. Qwen Code converts the Claude Code plugin on your machine at install time, from the same release Claude Code users install – there is no second package, no second manifest, and no build step. The hooks need `jq` here too.

First check whether erfana is already installed. From a shell, run:

```bash
qwen extensions list
```

If the output has a line `✓ erfana (x.y.z)`, erfana is installed: skip to [update on Qwen Code](#update-on-qwen-code). Running `install` again refuses with `Extension "erfana" is already installed. Please uninstall it first.`

Otherwise, install it:

```bash
qwen extensions install qodeca/erfana-skills:erfana
```

The source is the repository followed by the plugin name inside its marketplace. Qwen Code shows a security prompt; accept it, and the extension is written to `~/.qwen/extensions/erfana/`. Do not add `--consent` to skip that prompt – [`SECURITY.md`](../SECURITY.md) explains why it is for CI only.

Then start a new `qwen` session, because skills, agents, and hooks load at session start.

Check the result with `qwen extensions list` again. On Qwen Code 0.26.2 the output starts like this, followed by the lists of commands and skills:

```text
✓ erfana (9.2.1)
 Path: /Users/you/.qwen/extensions/erfana
 Source: https://github.com/qodeca/erfana-skills (Type: github-release)
 Origin: Claude
 Release tag: v9.2.1
```

The version in the first line and the release tag should match the [latest GitHub release](https://github.com/qodeca/erfana-skills/releases/latest). This list is also the way to see the installed version; these docs name no version command inside a session.

To check from inside a session, type `/` in `qwen`. The skills, such as `/draft-goal` and `/issue`, and the five commands – `/doc-update`, `/project-status`, `/session-status`, `/lens-review`, and `/explain-issue` – should appear. On Qwen Code 0.26.2, skills register as bare slash commands; this has not been checked on 0.22.3. If `/issue` does not appear on your version, start the skill with a request in plain words that names it, such as "use the erfana issue skill to show issue #12".

A few things work differently on Qwen Code:

- Slash commands have no `erfana:` prefix: `/doc-update`, not `/erfana:doc-update`. Skills are started the same way, by a request in plain words or by the bare name, such as `/autopilot resume`.
- A slash command (not a skill) whose name clashes with a Qwen Code built-in command becomes `/erfana.<name>`. Checked against Qwen Code 0.26.2, no erfana command clashes.
- Skills are not renamed on a clash. Qwen Code ships its own bundled skill named `coordinate`. Which of the two `/coordinate` starts has not been verified in a session; if Qwen's starts, say what you want in plain words, such as "claim #12 with erfana coordinate".
- Qwen Code may be less reliable at picking a skill from your request. Naming the skill helps.
- Skills run without their tool limits, because Qwen Code does not read the `allowed-tools` field.
- No erfana skill has yet been run end to end inside a Qwen Code session. The automated checks prove the install and the conversion, not a full run.

The full list of differences is in [`docs/hosts.md`](hosts.md). Why one package serves both hosts is in [one package, two hosts](explanation.md#one-package-two-hosts).

## Update or remove erfana

### Update on Claude Code

Auto-update is off by default for third-party marketplaces such as this one; only Anthropic's own marketplaces update without asking ([Claude Code docs on auto-updates](https://code.claude.com/docs/en/discover-plugins#turn-auto-update-on-or-off-for-a-marketplace)). To update by hand, run:

```text
/plugin marketplace update erfana-skills
/plugin update erfana@erfana-skills
```

Then restart Claude Code to apply the update.

To get new releases at session start without asking, turn auto-update on once: run `/plugin`, open the **Marketplaces** tab, select `erfana-skills`, and choose **Enable auto-update**. An organisation admin can turn it on for everyone by setting `"autoUpdate": true` on the marketplace's `extraKnownMarketplaces` entry in managed settings.

If the old version still loads, see [an update does not show up](#an-update-does-not-show-up).

### Update on Qwen Code

```bash
qwen extensions update erfana
```

Or run `qwen extensions update --all`. Then start a new `qwen` session, because skills, agents, and hooks load at session start. What the update command prints on success has not been recorded here. To check that it worked, run `qwen extensions list`: the first line `✓ erfana (x.y.z)` and the `Release tag:` line should match the [latest release](https://github.com/qodeca/erfana-skills/releases/latest). If the update fails or the install looks broken, run `qwen extensions uninstall erfana`, then `qwen extensions install qodeca/erfana-skills:erfana`, accept the prompt, and start a new `qwen` session.

Qwen Code installs erfana from the latest GitHub release tag, not from a branch, so a change reaches you when it is released, not when it is merged. `qwen extensions list` shows the tag it installed. A way to go back to an older tag on Qwen Code has not been verified.

### Upgrade from 8.x to 9.x

Version 9.0 renamed skills and agents. Check these before you update:

- **Skills renamed.** `/erfana:managing-agents` is now `/erfana:agent`. Likewise `managing-skills` became `skill`, `managing-issues` became `issue`, `managing-specs` became `spec`, `managing-articles` became `article`, and `managing-reports` became `report`. The old names no longer exist, so update your scripts, `CLAUDE.md` files, and saved prompts.
- **Agents renamed, merged, or removed.** The shared agent pool went from 87 agents to 33. If a prompt or `CLAUDE.md` calls an agent by name, look it up in the migration table in [`CHANGELOG.md`](../CHANGELOG.md). Most removed agents' work now runs in the skill's own conversation, so call the skill instead.
- **Finish running issue work first.** `erfana:issue` does not save progress to the issue, so an Implement run cut off by the update starts over.
- **Restart after updating.** Skills, agents, and hooks load at session start.

No way to pin a version is documented here, because a per-version install syntax for Claude Code could not be confirmed. To stay on 8.x, do not run `/plugin update` and leave auto-update off until you are ready.

On Qwen Code the same changes apply, under bare names: `/managing-issues` becomes `/issue`, and so on. The agent pool changes the same way, and running issue work should finish first. To stay on 8.x, do not run `qwen extensions update` until you are ready. Whether Qwen Code can also update erfana on its own, and how to go back to an older tag, have not been verified.

### Turn erfana off or remove it

To turn erfana off for a while without removing it, run this from a shell, and `claude plugin enable erfana@erfana-skills` to turn it back on:

```bash
claude plugin disable erfana@erfana-skills
```

To remove it from Claude Code, run:

```text
/plugin uninstall erfana@erfana-skills
```

If you also want the marketplace gone, run `/plugin marketplace remove erfana-skills`. To remove it from Qwen Code, run:

```bash
qwen extensions uninstall erfana
```

Removing the plugin leaves alone the files its skills wrote into your projects, such as `.local/autopilot.md`, `specs/`, or report backups. Delete those yourself if you no longer need them.

## Pick the right skill

You rarely need to name a skill. Describe what you want ("create a spec for the export feature", "review the PR") and Claude starts the skill that fits. If you are unsure, ask "which erfana skill fits this?" – the `erfana:using-erfana` skill points you to one.

| You want to | Use |
|---|---|
| Create, review, or change a Claude Code agent | [`erfana:agent`](reference.md#erfanaagent) |
| Create, review, change, or modernize a Claude Code skill | [`erfana:skill`](reference.md#erfanaskill) |
| Create, implement, review, or show GitHub issues | [`erfana:issue`](reference.md#erfanaissue) |
| Write or check a requirements spec | [`erfana:spec`](reference.md#erfanaspec) |
| Create or review a consulting report | [`erfana:report`](reference.md#erfanareport) |
| Research and write an article | [`erfana:article`](reference.md#erfanaarticle) |
| Stress-test a plan through questions | [`erfana:grill-me`](reference.md#erfanagrill-me) |
| Write or improve a prompt | [`erfana:prompt`](reference.md#erfanaprompt) |
| Make a request more ambitious before you run it | [`erfana:raise-the-bar`](reference.md#erfanaraise-the-bar) |
| Turn an intention into a `/goal` condition | [`erfana:draft-goal`](reference.md#erfanadraft-goal) |
| Run work unattended, or resume it | [`erfana:autopilot`](reference.md#erfanaautopilot) |
| Pick the next issues to work on | [`erfana:next-batch`](reference.md#erfananext-batch) |
| Keep parallel sessions off each other's issues | [`erfana:coordinate`](reference.md#erfanacoordinate) |
| Have specialists review and improve a plan | [`erfana:expert-panel`](reference.md#erfanaexpert-panel) |

Three skills never start from a request, because they edit documents, push code, or end a session. You type their command yourself:

| You want to | Type |
|---|---|
| Check a document's facts against its sources | `/erfana:fact-checking <file>` |
| Commit, push, open, or merge a pull request | `/erfana:ship [commit \| push \| pr \| merge \| cleanup]` |
| Hand the work over to another session or person | `/erfana:handoff [what the next session is for]` |

The five slash commands, such as `/erfana:session-status`, are listed in the [slash commands reference](reference.md#slash-commands-5).

### Namespaced and bare names

On Claude Code, every skill answers to two names that start the same skill:

```text
/erfana:issue     # namespaced – use this one
/issue            # bare – also works
```

Use the namespaced form in shared docs, screenshots, and team conversations. The bare form is a Claude Code shortcut, but it can clash with your own skills or another plugin's skills of the same name; the `erfana:` prefix avoids the clash and says where the skill comes from. A request to let plugins turn off the bare form is open upstream as [anthropics/claude-code#43695](https://github.com/anthropics/claude-code/issues/43695); erfana will adopt it when it ships. On Qwen Code only the bare form exists.

### Stress-test a plan before you build it

Say "grill me on this plan" and `erfana:grill-me` interviews you one question at a time. It reads the code first, so it does not ask what the code already answers, and it sizes the interview to the plan: a small change you can undo gets a short pass, and anything hard to undo gets the full sweep. For facts and routine choices it offers a recommended answer; for questions that rest on your judgment – goals, priorities, trade-offs, risk – it gives neutral options and its own view only after you answer. When the plan is settled, move on to `erfana:spec` or `erfana:issue`.

## Write a requirements spec

Start Claude Code in your project's root folder, because the skill puts `specs/` in the folder you work from. git is not required. `erfana:spec` writes requirements at the depth the feature needs, in four tiers: T1 issue, T2 spec, T3 lite spec, and T4 standard spec. A small fix gets a short T1; a payment integration gets a T4.

1. Say "create a spec for the CSV export feature", or run `/erfana:spec create a spec for the CSV export feature`.
2. The skill looks at your project, recommends a tier with its reason, and lets you decide. It picks the tier from questions like these:

   | Question | T1 | T2 | T3 | T4 |
   |---|---|---|---|---|
   | How many requirements? | 1–5 | 5–15 | 15–30 | 30+ |
   | External integrations? | No | No | Maybe | Yes |
   | Security-critical? | No | No | Maybe | Yes |
   | Several user roles? | No | No | No | Yes |
   | Architectural impact? | No | No | Some | Yes |
   | Needs traceability? | No | No | Yes | Yes |

3. It asks what it cannot write the spec without – goals and users, what is in and out of scope, each requirement and how it will be tested, quality targets with numbers – one question at a time. For T3 and T4 it offers to research how similar products solve the problem (with the agent `spec-app-researcher`); you choose whether that runs.
4. It shows the tier, the scope, and the numbered requirements with their acceptance criteria. Nothing is written until you agree. A short example of what you approve (the exact layout varies):

   ```text
   Tier: T2 – one user concern, no integrations, no security impact
   In scope: export the visible table as CSV. Out of scope: Excel, scheduled exports.
   004-FR-001 The user can download the current table as a CSV file.
     004-AC-001 Given a table with 3 rows, when the user clicks Export, a file with a header and 3 rows downloads.
   ```

5. It writes the spec into its own folder in your project and records it in `specs/registry.json`. In a project with no specs yet, it creates `specs/registry.json` and tells you so, and the first spec gets ID `001`. The folder is `specs/spec-t<tier>-<NNN>-<slug>/`, for example `specs/spec-t2-004-csv-export/`. Each tier holds these files:

   | Tier | Files |
   |---|---|
   | T1, T2 | `manifest.json`, `spec.md` |
   | T3 | `manifest.json`, `requirements/01-overview.md`, `02-requirements.md`, `03-acceptance.md` |
   | T4 | `manifest.json`, `requirements/01-overview.md`, `02-requirements.md`, `03-use-cases.md`, `04-acceptance.md`, `05-notes.md` |

   T4 also creates the folders `architecture/`, `solution/`, `design/`, `ux/`, and `testing/` inside the spec folder; T3 creates them only when needed. The source is the skill's [tier table](../skills/spec/references/tiers.md).
6. A separate checker agent, `spec-validator`, reviews the spec seeing only the spec, the review checks, and the spec registry. For T1 and T2 it checks that the files exist, the format is valid, and every requirement can be tested. For T3 it also checks completeness, requirement quality, acceptance coverage, and consistency; T4 adds use-case quality and cross-references. Each finding has a severity:

   | Severity | Meaning | Example |
   |---|---|---|
   | High | The team could build or test the wrong thing | Two requirements contradict each other |
   | Medium | It can be built, but not verified or traced | A quality requirement with no number |
   | Low | Polish | Inconsistent formatting |

   A spec passes with no high-severity findings; a T4 spec also needs no more than two medium ones. The skill reports every finding and fixes the ones you agree to.

Even a T1 "issue" is a short spec file under `specs/`, not a GitHub issue. To put it on GitHub, use `erfana:issue` afterwards.

Spec IDs are global across tiers and have three digits, such as `004`. Requirement IDs inside a spec start with the spec ID, such as `004-FR-001` for a functional requirement, `004-NFR-002` for a non-functional (quality) requirement, and `004-AC-007` for an acceptance criterion. Each spec gets an ID that is never reused, even after the spec is archived or deleted.

Later, say "update the spec" to change it. If your request states the exact change, that is your approval; otherwise the skill shows a change list first. Outside version control it backs up each changed file as `<file>.bak-<YYYYMMDD-HHMMSS>`. Say "reconcile spec with code" to compare a T3 or T4 spec with the code; nothing changes until you have decided on each gap.

Say "archive a spec" when the work is built and done. The skill has no shell, so it shows a `mkdir -p specs/archived && mv …` command for you to run from the project root, then checks the result and updates the registry.

The skill does not commit or push. Review the new files under `specs/` and commit them yourself, for example with `/erfana:ship commit`.

In a headless run (`claude -p`, with nobody to answer questions), the skill stops before writing and says which tier it recommends and what it needs.

On Qwen Code, start it with the bare name, `/spec` (seen on releases newer than the tested one), or with a request in plain words, which works if `/spec` does not appear; `/erfana:spec` is the Claude Code form. `erfana:spec` has not been run end to end there, like every erfana skill; see [`known-caveats.md`](known-caveats.md).

When the spec is ready, [work the issue end to end](#work-a-github-issue-end-to-end).

## Work a GitHub issue end to end

`erfana:issue` needs `gh` logged in, a GitHub remote, and you at the keyboard: it asks you to accept the result and to confirm the git actions.

### Create the issue

Say "create an issue for the login timeout bug". The skill asks only what changes the issue (what happens, what should happen, who is affected), searches for duplicates, and shows you the exact title, body, and labels. It creates the issue only when you say yes.

### Implement it

Run `/erfana:issue implement #42` (or say "implement #42"). The working tree must be clean. The run detects the repository's default branch and starts a new branch from it.

The run goes through thirteen phases, each closed by a quality gate (QG-0 to QG-12), from pre-flight through requirements, design, build, architecture, security, quality, verification, and documentation to acceptance and finalize. Reviewer agents check the design and the changes; critical and high findings are fixed in place, and a separate judge decides the rest. Security (QG-7) and plan conformance (QG-9) are never skipped.

The run makes every technical decision itself. It asks you only:

1. about a real ambiguity in the requirements (what the change should do, never how);
2. to try the result and accept it (UAT, at QG-11);
3. to confirm the commit, and then the branch action – push, merge, or delete – at QG-12;
4. about a contradiction a reviewer cannot resolve, such as two acceptance criteria that cannot both hold;
5. about a gate that still fails after three attempts.

Nothing is committed before your final confirmation. A headless run cannot finish: it stops before creating a branch. In CI (when `CI` or `GITHUB_ACTIONS` is set), the run refuses at QG-0.

The run keeps its progress in the session, not on the issue. If the session ends partway, start the run again.

### Push and open the pull request

If you did not push at QG-12, type `/erfana:ship pr`. It commits anything left, pushes the branch, and opens or updates the pull request, linking the issue when the branch name or your request gives its number. `/erfana:ship merge` also waits up to 30 minutes for the checks, merges, deletes the branch, and closes the linked issue. It never force-pushes and never merges over a failing check.

To work several issues in a row without watching, see [run an unattended session](#run-an-unattended-session).

## Run an unattended session

An unattended run is work Claude keeps doing turn after turn while you are away. It runs on Claude Code's `/goal` command: a goal holds a completion condition, and after each turn a small evaluator model reads the conversation and decides whether the condition is met. `erfana:autopilot` writes that condition from your session and keeps the run's memory in one file.

Your Claude Code version must have the `/goal` command. To check, type `/goal` alone; if Claude Code does not know the command, update Claude Code.

Qwen Code has a `/goal` command of its own, but it works differently (its commands include `/goal pause` and `/goal resume`, and its turn limits are settings rather than words in the goal). Autopilot writes its goal for Claude Code's `/goal`, and a run with Qwen Code's has not been tried. On Qwen Code, the state file and the owner queue work as described below; whether the goal keeps the run going there is not verified.

Autopilot has golden test cases but has not yet had a live end-to-end run; see the v9.1.0 entry in [`known-caveats.md`](known-caveats.md). Keep that in mind before you leave a long run alone.

### 1. Pick the work (optional)

Run `/erfana:next-batch` to have the next issues picked for you. It skips issues other sessions have claimed, ranks the rest by impact on delivery, and groups them by theme. A number sets how many (default 10, at most 25); other words set a focus, such as `bugs` or a label:

```text
/erfana:next-batch 5 performance
```

It reads GitHub only, saves the batch to `.local/next-batch.md` (or `.local/next-batch-<YYYYMMDD-HHMM>.md` when that file exists), and prints two commands for you to run, such as:

```text
/erfana:coordinate claim #12 #15 #18
/erfana:autopilot start .local/next-batch.md
```

The start command names the timestamped file when `.local/next-batch.md` already existed.

### 2. Claim the issues (optional)

If other sessions work on the same repository, claim the issues so no two sessions take the same one:

```text
/erfana:coordinate claim #12 #15 #18
```

A claim adds a `claimed` label and a comment that shows your folder and machine names. On a public repository the skill asks before the first claim. `/erfana:coordinate board` shows who holds what.

Claim before you run `start`. The run claims further issues itself only when you ran the claim command, or said to claim, before it started.

### 3. Start the run

Run `/erfana:autopilot start` followed by what to work on: plain words ("fix the flaky login tests"), issue numbers (`#12 #15`), or the batch file from `erfana:next-batch`. The skill builds the Batch section of the state file from that and from the session so far:

```text
/erfana:autopilot start .local/next-batch.md
```

The skill works out the goal from the batch, your words, and the session so far, and finds the real test, lint, and build commands in your project. It writes the state file `.local/autopilot.md`: the goal, what you authorized (quoted from your messages), the batch, progress, and an owner queue – the list of decisions the run needs from you. It keeps the file out of git by adding `.local/` to your clone's local exclude file, never to `.gitignore`.

While `.local/autopilot.md` still starts with `Status: active`, `start` changes nothing: it shows the status and says to close the old run with `stop` first. When a new run starts after a finished one, the old run is kept in the same file under `## Previous run`.

"Unattended" means "do not stop to ask", not "do anything". Pushing, opening or merging pull requests, publishing, deleting, or messaging people is part of the run only if you said so; otherwise it goes to the owner queue. To grant an outward action, say it in plain words, in the start message or any earlier message in the session – for example:

```text
You may push the branches and open pull requests for this batch; do not merge.
```

The skill quotes your message, with its date, in the state file.

Your permission settings are the real limit: an action you have not allowed stops at a prompt, and one you allowed in advance runs whatever the goal says. The skill names the steps that will need a prompt. Before a long run, set [Claude Code permission rules](https://code.claude.com/docs/en/permissions#permission-rule-syntax): allow rules for your project's test, lint, and build commands, so the run does not stop at a prompt, and ask rules for `git push` and `gh pr merge` when you have not authorized them. For example, in `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": ["Bash(npm test)", "Bash(npm run lint)"],
    "ask": ["Bash(git push *)", "Bash(gh pr merge *)"]
  }
}
```

A goal does not change the permission mode. In the default mode, every file edit and every command you have not allowed stops at a prompt, and the run waits until you come back. For a run nobody watches, switch Claude Code to [auto mode](https://code.claude.com/docs/en/permission-modes#eliminate-prompts-with-auto-mode) before you paste the goal (where your session does not offer it, use accept-edits mode plus allow rules for the commands the run needs), and keep the ask rules for actions you have not authorized.

### 4. Paste the goal

The skill never starts the goal itself. When no goal is running, it prints one `/goal` line between two marker lines and ends its turn:

```text
===== GOAL – START (copy the /goal line below) =====

/goal Outcome: ... Done when: 1) ... Bound: ...

===== GOAL – END =====
```

The `Bound:` part says when the run ends by itself. The Bound of a goal autopilot writes always includes "or stop once only Owner queue items remain", so the run stops when only your decisions are left. Autopilot follows the draft-goal patterns, which usually add a turn limit after that phrase, for example: `Bound: or stop once only Owner queue items remain, or after 20 turns – either way listing each open item`. The skill picks the number for each run, so read the Bound before you paste. To change the limit, ask for one in the start message ("limit the run to 40 turns") or edit the number in the line before you paste it. The evaluator judges the limit from the conversation; it is not a timer.

In the real output the `/goal` line sits in its own code block between the markers. Copy it by typing `/copy` and picking the block, or select the one line – it may wrap on screen. The marker lines are not part of it. Paste it as your next message. Pasting a `/goal` line starts a turn at once, and after each turn the evaluator decides whether Claude goes on, so you send no further messages. Check that the `/goal` active indicator shows; if it does not, paste it again with `/goal` at the very start. The same line is stored under Goal in `.local/autopilot.md`.

The skill keeps the whole line at or under 3,500 characters and about 450 words, because Claude Code refuses a `/goal` over 4,000 characters and the counts are estimates. If the goal runs long, it first moves the run rules into the state file, then points to the batch instead of listing it, then merges checks. If it still does not fit, it writes no state file, prints nothing you could paste, and says roughly how far over it is and what to cut. If `/goal` refuses the line anyway, tell the skill: it rewrites the goal in place and prints it again.

### If a goal is already running

A new `/goal` replaces the running one, so autopilot never prints one over yours:

- **Your goal covers the work.** The skill writes no new goal. It records yours in the state file as set by you, shows the batch, what is authorized, and the run rules, and ends its turn. After this turn, your running goal's evaluator continues the work by itself; you do not need to send a message. Your goal has no exit for items that need you, so the run may keep looping once only those remain. If that happens, run `/erfana:autopilot status` to answer them, or end the run with `/goal clear` and then `/erfana:autopilot stop`. To avoid it, end your goal's condition with "or stop once only Owner queue items remain in .local/autopilot.md", or write the goal with `/erfana:draft-goal`.
- **Your goal is an earlier autopilot goal, or does not cover the work.** The skill starts nothing and writes nothing to `.local/autopilot.md`. It says which goal is running; keeping it or ending it with `/goal clear` is your call. To get an autopilot goal instead, run `/goal clear`, then run `/erfana:autopilot start` again.
- **It cannot tell.** When you run `start` after a compaction or in a resumed session, the skill asks once and recommends that you type `/goal` alone, which shows the running condition. In a normal session the question waits for your answer, so stay until you have answered it. Only in a non-interactive run (`claude -p`, CI) does it treat the goal as not running and adds a warning to the printed line: paste it only if no `/goal` is running, because a new one replaces it and restarts its turn count.

### 5. Check on it

Ask "do you need anything from me?" or run `/erfana:autopilot status`. You get what is done, in progress, and next, with evidence, and each owner-queue item as a question with a recommended answer. Your answers are recorded under Owner decisions. Running `/erfana:autopilot` with no argument shows the status when a state file exists, and starts a run when none does.

Checking and answering need you at the session, or reading `.local/autopilot.md`; erfana offers no remote channel. The question is an ordinary message in the same session: it runs the status check, asks your owner-queue questions one at a time, and the goal then carries on. Whether that turn counts toward a turn limit in the goal is up to Claude Code's goal evaluator and is not documented here.

The run also keeps Claude Code's built-in task list short: after each item it holds only open and in-progress items. Claude Code shows the list in the session; the state file is the lasting record.

### 6. Resume after a restart or compaction

After a compaction, a restart, or `/clear`, run `/erfana:autopilot resume` (on Qwen Code, `/autopilot resume`, or a plain-words request such as "resume the autopilot run" if the bare command does not appear on your version). erfana's `post-compact-reminder` hook prints a pointer to `.local/autopilot.md` after a compaction, but on both hosts that output does not reach the model, so do not wait for the run to carry on by itself. Compaction does not clear a goal: when the conversation shows the goal still running, resume carries on without asking. `/clear` does remove the goal. After it, resume prints a goal autopilot wrote again for you to paste, and for a goal you set yourself it asks whether it still runs.

### 7. When the run stops on its own

A run can stop without you in three ways. First type `/goal` alone: it shows whether a goal is still set. Then open `.local/autopilot.md` and read its first line.

- **The goal is still set.** Claude Code stopped the loop with a warning, because Claude answered the evaluator several turns in a row without using a tool – typical when only your decisions are left. Answer the queue with `/erfana:autopilot status` and the goal goes on. Do not paste a new `/goal`: it would replace the running one and restart its turn count.
- **The goal has ended and the file still says `Status: active`.** The evaluator gave its verdict after Claude's last turn, so Claude often had no turn left to close the file. A new `start` is refused. Answer the queue with `/erfana:autopilot status`, then run `/erfana:autopilot resume`: for a goal autopilot wrote, it prints the stored `/goal` line again for you to paste.
- **The file says `Status: finished`.** The run closed itself, because the goal was met, judged impossible, or cleared. `resume` only says the run is closed, and `status` only shows the final summary – it no longer asks the queue questions. Read the Owner queue section in `.local/autopilot.md` yourself, then start a new run with `/erfana:autopilot start` and give your answers in that message; the old run is kept under `## Previous run`.

To end the run instead, use the next step.

### 8. Stop the run

Run `/erfana:autopilot stop`. `/goal clear` on its own is not enough: it ends the goal, but the state file stays `Status: active` and the next `start` is refused, so always run `stop` too. To interrupt the turn that is running now, press `Esc` (a Claude Code control); `/goal clear` only stops the turns after it. With `stop`, the state file is marked `Status: finished` with a final summary; the file is never deleted. If autopilot wrote the goal and it still runs, it prints `/goal clear` for you to run; if it cannot tell, it prints the line with the note "only if a goal is running"; if the goal has already ended, it prints nothing. If the goal is yours, it says the goal is still set and that ending it with `/goal clear` is your call.

### Write a goal without a run

If you only want a well-formed goal, say "draft a goal" or run `/erfana:draft-goal` with what you want done. It asks one short round of questions, then prints the goal between the same START and END markers, under the same 3,500-character rule. If a success check is still unknown or the goal is too long, it prints the draft under **Needs clarification** with no `/goal` prefix, so nothing looks ready to paste. It never starts the work. Type `/goal` alone to see how a running goal is going, and `/goal clear` to stop it.

## Review code or a pull request

### Review with `erfana:issue`

Say "review src/auth", "review the PR", or "audit code against spec". The skill settles the scope – a file, component, module, feature, pull request, the codebase, or compliance with a spec – then sends the code to reviewer agents: `code-reviewer` and `security-auditor` always, others when the scope calls for them. You get every real defect ranked by severity, each with its file, line, quoted code, and a fix. A review changes no file.

### Review with `/erfana:lens-review`

For a review grounded in current best practice, type:

```text
/erfana:lens-review <path | "path path ..." | #PR | "description"> [--lens a,b,c] [--out file.md]
```

It chooses up to ten review angles, called lenses (architecture, security, performance, UI, and so on), from the target, has each reviewer research recent practice online, and returns one report ranked by severity, in plain language with the technical detail kept for engineers. `--lens` fixes the lenses yourself. `--out` also writes the report to a `.md` file inside the current folder. A pull-request target needs `gh` logged in. It is meant for you to start; erfana skills print it for you rather than run it.

### Review a plan or design instead of code

Say "have specialists review this plan" or run `/erfana:expert-panel <path> [review | improve | apply]`. It picks three to six specialist roles, has each review the target, merges the findings, and asks you the decisions that are yours. The default, `improve`, writes an improved version to a new file next to the target (`<name>-improved.md`); `review` stops at the findings; `apply` changes the original after backing it up.

## Write a report or an article

### Write a consulting report

Say "create report". `erfana:report` interviews you one decision at a time, then writes a requirements specification and an outline at paths you agree. The outline puts the main message first, followed by three to five supporting points.

- **Review.** Say "review report". Two checker agents run six house checks; the report passes only when all six pass. You get every finding with its line, the quoted text, and a fix.
- **Revise.** Say "fix report issues". The skill shows a change list and edits only after you approve it, after copying the report to `<name>.pre-modify-<YYYYMMDD-HHMMSS>.md`.
- **Version.** Say "version report" to snapshot, archive, restore, compare, or see the history of a report.

### Write an article

Say "write an article about managed Postgres providers". `erfana:article` handles medium-form articles of 2,000–3,000 words in English, Polish, or both.

1. **Brief.** It agrees the publication, audience, angle, languages, length, and deadline with you, then creates the project folder under `in-progress/<slug>/` in your article root.
2. **Research.** It researches through the `article-researcher` agent, or writes a prompt you can run in another deep-research tool and files what you paste back. Every claim gets a source in `sources.md`.
3. **Outline and draft.** It writes the outline, then `draft-v1.en.md` (or `.pl.md`). Each new draft is a new file; earlier drafts are never overwritten.
4. **Review and revise.** The `article-reviewer` agent judges the draft against the brief and sources, and revisions go to the next version file.
5. **Publish.** It checks the paths and prints the exact `mv` command that moves the folder to `published/`; you run it, and the skill confirms the result. It never moves folders itself. Archiving works the same way.

Ask "what's the status of my articles?" for each project's status, latest draft, and whether it was reviewed.

### Fact-check before it ships

Claude never starts fact-checking on its own, so asking "write an article, then fact-check it" in one request will not run it. When the draft is ready, type:

```text
/erfana:fact-checking in-progress/my-article/draft-v2.en.md
```

Add `--section N` to check one section. The skill proposes source folders and checks only against the sources you confirm. Those must be local files – such as the project's `research-results.md` or saved copies of the source pages – because its verifier agent reads files and cannot open URLs. It lists every claim with a quoted source passage or a finding ranked from Critical to Info, and changes the document only after you have seen and accepted each replacement text, backing it up first as `<file>.bak-<YYYYMMDD-HHMMSS>`.

## Report a security issue

Report security issues **privately**. Do not open a public issue, pull request, or discussion for an unfixed vulnerability. The full policy is in [`SECURITY.md`](../SECURITY.md).

1. **Preferred:** use GitHub's [private vulnerability reporting for erfana-skills](https://github.com/qodeca/erfana-skills/security/advisories/new) – the "Report a vulnerability" button under the repository's **Security** tab. The report stays between you and the maintainers until a fix ships.
2. **If private reporting is not available to you:** open a minimal public issue that contains **no exploit details** – only ask the maintainers to open a private channel – and they will follow up.

Private reporting counts as not available when the "Report a vulnerability" button is missing, or the link does not open a report form. The form needs a signed-in GitHub account, and so does the fallback issue: both routes go through GitHub, and the security policy names no other channel.

Blank issues are turned off in this repository, so open the fallback issue from the [new issue page](https://github.com/qodeca/erfana-skills/issues/new/choose) with the **Bug report** template. The same page has a **Report a security vulnerability** link, which opens the private form from the preferred route. Its note asks you not to report vulnerabilities there – that means the details. In each required text field, write only that you are asking for a private security channel and are holding back the details, and pick your host in the required **Host** list.

Include the affected files or component, steps to reproduce or a proof of concept, the impact, any fix you suggest, the erfana version (shown by `claude plugin list` or `qwen extensions list`), and the host – Claude Code or Qwen Code – with its version (`claude --version` or `qwen --version`). The maintainers aim to acknowledge a report within a few business days, and credit reporters who wish to be named once a fix is released.

Where to send what:

| Problem | Report to |
|---|---|
| erfana's own files – skills, agents, commands, hooks, manifests, docs, scripts, or the release pipeline | The erfana maintainers, as above |
| Something erfana ships that is unsafe because of how Claude Code and Qwen Code differ | The erfana maintainers, as above |
| Qwen Code dropping an agent, mangling frontmatter, or misreading a manifest during conversion | The Qwen Code project |
| Anthropic's Claude API | Anthropic, at `security@anthropic.com` |

Your own shell, operating system, or Claude Code setup is out of scope.

## Troubleshooting

### `/plugin marketplace add` fails or hangs

Claude Code needs to reach `api.github.com` and `raw.githubusercontent.com`. A corporate proxy that blocks either one makes marketplace commands fail, often without a clear error. Ask your IT team to allow both. Until then, [install from a local clone](#install-from-a-local-clone). The public marketplace needs no token.

### `/plugin install` reports "marketplace not found"

The marketplace registers as `erfana-skills`. Make sure `/plugin marketplace add qodeca/erfana-skills` finished without an error; `/plugin marketplace list` should show `erfana-skills`.

### An update does not show up

This covers both an update that has not arrived after two or more sessions and a plugin that still behaves like the old version. Run:

```text
/plugin marketplace update erfana-skills
/plugin update erfana@erfana-skills
```

Then restart Claude Code. If the old version still loads, clear the plugin cache and restart again:

```bash
rm -rf ~/.claude/plugins/cache/
```

Use the HTTPS form `qodeca/erfana-skills` for the marketplace; an SSH marketplace URL is not recommended because of a known Windows issue.

### `qwen extensions install` cannot find the extension

Check the spelling of the source: `qodeca/erfana-skills:erfana` – the repository, a colon, and the plugin name – not the repository alone. The install reaches GitHub over the network, so the proxy advice above applies too. Nothing is written to `~/.qwen/extensions/` until you accept Qwen Code's security prompt.

### A request does not start the skill you expected

Check that the plugin is enabled with `claude plugin list`. Then use a phrase close to the skill's trigger phrases in the [skills reference](reference.md#skills-18), or name what you are working on: "issue", "spec", "article", "report", "agent", or "skill". Typing the slash command, such as `/erfana:spec`, always works.

`erfana:fact-checking`, `erfana:ship`, and `erfana:handoff` never start from a phrase – type their slash command. On Qwen Code, skill choice from a request may be less reliable; name the skill.

### Both `/erfana:issue` and `/issue` appear in autocomplete

This is expected on Claude Code: plugin skills register under both names. Use the namespaced form, as described in [namespaced and bare names](#namespaced-and-bare-names).

### Your own skill has the same name as an erfana skill

If you have a personal or project skill named, for example, `issue`, the bare `/issue` may start yours instead of erfana's. The namespaced `/erfana:issue` always starts the plugin's skill, because plugin skills live under their plugin's name.

### Slash commands have no `erfana:` prefix on Qwen Code

This is expected: Qwen Code registers extension commands without the plugin name, so use `/doc-update` there. If a name clashes with a Qwen Code built-in command, the built-in keeps the bare name and the erfana command becomes `/erfana.<name>`; see [`docs/hosts.md`](hosts.md).

### Safety hooks do not fire

On either host:

1. **On macOS and Linux, check `jq`.** Run `command -v jq`. Five of the six hooks need it; without it, the hook launcher skips them and prints a note to stderr that you may never see. The hooks fail open – a hook that cannot run allows the action – so a missing `jq` looks like silence, not an error. On macOS, install it with `brew install jq`.
2. **Restart.** Hooks load at session start, so they are active only after a restart following an install or update. On Qwen Code, restart the session so the extension is read again; `hooks/hooks.json` needs nothing Qwen-specific.
3. **On Windows, check Git Bash.** The hooks start through Git Bash; with no Git Bash installed, no hook runs.

Each hook has five seconds to finish. A hook that runs longer is stopped and the action goes through. To allow more time, set the `ERFANA_HOOK_TIMEOUT` environment variable to a whole number of seconds from 1 to 60. Why the hooks fail open is explained in [safety hooks and why they fail open](explanation.md#safety-hooks-and-why-they-fail-open).

### A safety hook blocks a command you need

The `bash-safety` hook blocks shell commands that can destroy data or systems, and `secret-detector` blocks writing what looks like a secret to a file. The full list of what each hook does is in the [safety hooks reference](reference.md#safety-hooks-6). If you are sure a blocked command is safe, run it yourself in a terminal. To stop erfana's hooks and skills for a while, disable the plugin with `claude plugin disable erfana@erfana-skills`. The Claude Code setting `"disableAllHooks": true` turns off every hook, including your own.

### A skill stops partway in a headless run

In a headless run (`claude -p`) nobody can answer questions, so each skill stops at its first approval step and says what it needs: `erfana:spec` before writing, `erfana:report` before editing, `erfana:article` before moving a folder, `erfana:issue` Implement before creating a branch. Run these interactively.

### The compaction reminder mentions a time tool you do not have

After a compaction, the `post-compact-reminder` hook prints a line that asks Claude to call `mcp__time__get_current_time`. That tool exists only if you have a time MCP server installed. The line is harmless either way: Claude Code writes the reminder's output to its debug log, not to Claude's context, so Claude does not act on it.

### A `.local/` folder appears in your repository

`erfana:autopilot` writes `.local/autopilot.md`, and `erfana:next-batch` writes its batch files under `.local/`. Autopilot adds `.local/` to your clone's local exclude file so git ignores it; next-batch only warns when its file is not ignored. To ignore it for everyone, add `.local/` to your project's `.gitignore` yourself.
