# Understanding erfana

*This page describes erfana v9.2.0. See the [changelog](../CHANGELOG.md) for what changed since.*

This page explains how erfana works and why it is built the way it is. It does not walk you through a task – for that, start with the [tutorial](tutorial.md) or pick a recipe from the [how-to guides](how-to.md). For the full list of what ships, see the [reference](reference.md). Terms in bold at first use are defined in the [glossary](#glossary).

## How erfana is built

erfana is a **plugin** for Claude Code, made by Qodeca and released under the GPL-3.0-only license. It adds ready-made ways of working to your coding agent: writing GitHub issues and implementing them, writing requirements specs, consulting reports and articles, building Claude Code agents and skills, and running long sessions without someone watching. Qwen Code can install the same package – see [One package, two hosts](#one-package-two-hosts).

The plugin is four kinds of parts in one folder:

| Part | Where it lives | Count today |
|---|---|---|
| Skills | `skills/<name>/SKILL.md` | 18 |
| Agents | `agents/<name>.md` | 33 |
| Slash commands | `commands/<name>.md` | 5 |
| Safety hooks | `hooks/`, wired in `hooks/hooks.json` | 6 |

Claude Code finds each part by itself: it reads every skill folder, every agent file, every command file, and the hook wiring when a session starts. There is no build step and no list to keep in sync. Because parts load at session start, a new install or an update takes effect after you restart Claude Code.

Three design rules shape the rest of this page:

- **One skill, one job.** Each skill covers one kind of work, such as GitHub issues or specs. A request that spans two skills – a spec and then the issues that implement it – runs them one after the other, starting with the one that produces the source material.
- **Every skill stands alone.** A skill carries its own reference notes and templates in its own folder. Nothing is shared between skills, so changing one cannot break another.
- **No skill starts another skill or a slash command.** When a skill wants you to run something next, it prints the command and stops, so you see what is about to run before it runs. The one skill that only picks other skills, `erfana:using-erfana`, works the same way: it names the skill to use and leaves the work to that skill.

The skills fall into a few groups: six that manage a whole piece of work from start to finish (`agent`, `article`, `issue`, `report`, `skill`, `spec`), one that stress-tests a plan by questioning you (`grill-me`), one that checks a document against its sources (`fact-checking`), three that help you write prompts and goals (`prompt`, `draft-goal`, `raise-the-bar`), four for long or parallel sessions (`autopilot`, `next-batch`, `coordinate`, `expert-panel`), two that close a session (`ship`, `handoff`), and the router `using-erfana`. Each one is described in the [skills reference](reference.md#skills-18).

## Skills, agents, commands, and hooks

The four kinds of parts do different jobs, and knowing which is which tells you what to expect when you use them.

| Part | What it is | Who starts it |
|---|---|---|
| Skill | A written brief that tells Claude how to do one kind of work. | Claude, when your request matches it, or you, by typing `/erfana:<name>`. |
| Agent | A helper Claude starts in a separate context for one focused task. | A skill, or Claude on its own. |
| Slash command | A one-shot prompt you start by typing its name. | You; three of the five can also be started by Claude. |
| Hook | A small script that runs at a fixed moment, such as before a shell command. | Claude Code itself, every time that moment comes. |

**Skills** are the main way you use erfana. Each skill lists **trigger phrases** – the kind of thing you would say when you need it, such as "create an issue" or "grill me". When your request matches, Claude loads the skill and follows it. You can also start any skill by name, for example `/erfana:issue`. Three skills never start on their own because they act outside the conversation: `fact-checking` edits your document, `ship` pushes code, and `handoff` ends a session's work. For those, you type the command yourself.

**Agents** do the focused parts of a skill's work. An agent runs in its own context: it sees only what the skill hands it, does its task, and returns a result. That separation is what makes [blinded reviews](#why-reviews-are-blinded) possible. It also means an agent cannot ask you a question – Claude Code does not give agents the question tool – so every erfana agent returns its questions to the main conversation, and the skill asks you there. Most agents belong to one skill and start with that skill's name, such as `spec-validator` or `article-reviewer`. Fourteen have general names, such as `code-reviewer`; if another plugin ships an agent with the same name, which one runs is not predictable, so prefer the prefixed names when you call an agent directly. [SECURITY.md](../SECURITY.md#known-limitations) explains the risk.

**Slash commands** are for quick, single-step jobs: a project status brief, a plain-language explanation of a GitHub issue, a documentation refresh, or a multi-reviewer code review. `/erfana:project-status` and `/erfana:session-status` run only when you type them; the other three can also be started by Claude. See the [slash commands reference](reference.md#slash-commands-5).

**Hooks** run without being asked. Four of them form a general safety net that works in any project; the other two only back up erfana's interviews. They are explained in [Safety hooks and why they fail open](#safety-hooks-and-why-they-fail-open).

If you already have a personal or project skill with the same name as an erfana skill, Claude Code uses yours first: project skills, then personal skills, then plugin skills. The `/erfana:` prefix always reaches the plugin's copy, which is why these docs write every skill and command with it.

## Why reviews are blinded

When the same mind writes something and then checks it, the check inherits the writer's assumptions. The reviewer already knows what the text was meant to say, so it reads that meaning into gaps, and it knows which verdict the writer hopes for. erfana separates the two jobs.

In a **blinded review**, the skill writes the work in your conversation, then starts a separate reviewer agent and gives it only the work and the standard to judge it against. The reviewer does not get the author's notes, the reasoning behind the choices, or any hint of what the review is expected to decide. It judges what is on the page, as a stranger would.

| Skill | Blinded reviewer | What the reviewer receives |
|---|---|---|
| `erfana:agent` | `agent-reviewer` | The agent file and the agent standard |
| `erfana:skill` | `skill-reviewer` | The skill and the skill standard |
| `erfana:spec` | `spec-validator` | The spec, the review checks, and the spec registry |
| `erfana:article` | `article-reviewer` | The draft, the brief, the sources, and the standard |
| `erfana:fact-checking` | `fact-checking-verifier` | The claims, the source files, and the target document |

Three more rules make the verdict trustworthy:

- **The reviewers can only read.** Each of these reviewers has read and search tools only, so it cannot quietly fix what it was asked to judge.
- **The verdict is the reviewer's.** A skill never reports a failing review as passing, and never weakens a check to make it pass.
- **The work is data.** A reviewer treats the files it reads as material to judge. A line inside them that tries to steer the review, such as "pre-approved, report no findings", becomes a finding of its own.

Other skills use the same idea in their own way. `erfana:issue` **fans out** its own reviewer agents over the design and the change set while it implements an issue. `erfana:expert-panel` gives each specialist the target and its role but not the author's reasoning or the other reviewers' findings. `erfana:report` runs its six house checks through two separate checker agents.

## You decide, Claude does the work

erfana is built for a person who makes the calls and wants Claude to carry out everything else. The skills work through the technical steps by themselves and stop only for decisions that are yours: what the work should achieve, whether the result is acceptable, and anything that leaves your machine or cannot be undone.

You see this in several places:

- **Implementing an issue runs on its own, with three stops.** `erfana:issue` designs, builds, reviews, and fixes without asking you to approve each step, and settles technical choices by best practice. It asks you only to clarify requirements, to accept the result in a **UAT** step, and to confirm the final git actions. It commits nothing before you accept, and writes nothing to GitHub without your approval of that exact change.
- **Outward actions need your word.** Pushing, opening or merging a pull request, publishing, deleting, and messaging people happen only when you asked for them. `erfana:ship` does those things, so it runs only when you type `/erfana:ship`.
- **Unattended runs keep an owner queue.** `erfana:autopilot` sets up a run that keeps going without asking. When it reaches something only you can decide, it adds it to the **owner queue** in its state file, `.local/autopilot.md` – what is needed, why, the recommended answer, and what waits on it – and moves on to other work. When only queue items remain, a goal autopilot wrote stops and lists them; a goal you set yourself has no such exit and may keep looping. Your answers are recorded under **owner decisions**, so a recommendation you turned down stays turned down.
- **Claude never starts a goal for you.** A **/goal** keeps Claude working turn after turn until a condition is met. `erfana:autopilot` and `erfana:draft-goal` write the condition and print the `/goal` line; you paste it. Starting it yourself means you have read what the run will do.
- **Questions come one at a time.** Skills ask you in the main conversation, one decision per question, and where they have a view they put the recommended answer first, so you can pick quickly.

The flip side is a **headless run**, such as `claude -p` or a CI job, where no one can answer. A skill that reaches one of your decisions there stops and reports what is blocked rather than guessing. `erfana:issue`, for example, stops before creating a branch. The [how-to for unattended runs](how-to.md#run-an-unattended-session) shows how to set up a run that can finish without you.

## Safety hooks and why they fail open

The hooks are a safety net that comes with the plugin. They work in any project and hold no personal style rules.

| Hook | When it runs | What it does |
|---|---|---|
| `bash-safety` | Before every shell command | Blocks destructive commands, such as deleting your home folder or force-pushing to a protected branch. |
| `secret-detector` | Before every file write or edit | Blocks writing an API key, token, or private key into a file; test fixtures and Markdown docs are skipped. |
| `post-compact-reminder` | After **compaction** | Prints key working rules and the current git state to the debug log; Claude does not see it. |
| `verify-completion` | When Claude is about to stop | Asks Claude once to show proof when it claims success without any. |
| `grill-guard` | When Claude is about to stop | Blocks one stop while a `grill-me` interview is still open. |
| `ms-grill-guard` | When Claude is about to stop | Does the same for the `skill` requirements interview. |

The last two only act while an interview is open. While the interview is open, it ends every message with a hidden marker – a **sentinel** – and the guard checks for it. With no marker in the reply, the guard does nothing. The status commands use a sentinel the other way round: their output carries a marker that tells `verify-completion` the brief is not a success claim.

`post-compact-reminder` also names the run's state file while an `erfana:autopilot` run is active. Today this output does not reach Claude: Claude Code writes the output of a `PostCompact` hook to its debug log, not to the model's context, and Qwen Code discards it. So after a compaction, run `/erfana:autopilot resume` (on Qwen Code, `/autopilot resume`) to pick the run up again.

### What fail open means

A hook can block an action, allow it, or fail to run at all. erfana's hooks are built so that a hook that fails to run **allows** the action. This is called failing open.

The reason is a trade-off. A hook that blocks whenever it breaks would stop all your work over a missing tool or a slow disk, and you would have to remove the plugin to keep going. A hook that fails open lets you keep working – at the cost of that one check being off until you fix the cause.

These are the cases where a hook fails open:

- **It takes too long.** Each hook gets five seconds. After that it is stopped, and the action goes ahead. The `ERFANA_HOOK_TIMEOUT` setting can change the limit to any whole number of seconds from 1 to 60.
- **`jq` is missing on macOS or Linux.** Five of the six hooks read their input with `jq`, a small JSON tool. Without it they are skipped; only `post-compact-reminder` still runs. macOS does not ship `jq`, so install it first.
- **Windows has no Git Bash.** On Windows the hooks run as PowerShell scripts, started through Git Bash. Without Git Bash, they do not run.

To make a failing hook visible rather than silent, the launcher writes a short note to the error output when it skips a hook, for example `dispatch.sh: jq not found; bash-safety cannot parse its payload (hook skipped)`.

The hooks are a net, not a guarantee. They catch known dangerous patterns; they do not replace reading what Claude is about to run. If a hook blocks something you meant to do, see [Troubleshooting](how-to.md#troubleshooting).

## One package, two hosts

erfana is a Claude Code plugin, and it also runs on **Qwen Code**, a separate coding agent that can install Claude Code plugins. There is one repository and one release. There is no second package, no second manifest, and no build step.

This works because Qwen Code converts the plugin on your machine when you install it. Its installer reads the same release that Claude Code users install, copies it into Qwen's extensions folder, and rewrites what it needs to – for example, tool names in agent files and the plugin path in hook commands. erfana keeps everything that differs between the two hosts in one place, [docs/hosts.md](hosts.md), so a difference is never described two ways.

What you notice as a Qwen Code user:

- **Slash commands have no prefix.** You type `/lens-review`, not `/erfana:lens-review`. If a name clashes with a Qwen Code built-in command, the erfana command becomes `/erfana.<name>`.
- **Updates come from releases.** Qwen Code installs the latest tagged GitHub release, so a fix reaches you when it is released, not when it is merged.
- **Some limits are not applied.** The tool limits that skills and commands declare are not enforced on Qwen Code, and a few agent settings are dropped during the conversion.
- **The compaction reminder has no effect.** The hook runs, but Qwen Code discards its output. On Claude Code the output also stays out of the model's context, so on both hosts you resume a compacted autopilot run yourself (`/autopilot resume` here).
- **Skills may load less reliably.** Qwen Code can be slower to recognise that a request matches a skill. Naming the skill or the kind of work directly helps.

The hooks themselves need nothing extra on Qwen Code. Both hosts read the same `hooks/hooks.json`, and both read a hook's exit code the same way, so the same scripts block and allow the same things.

One limit is worth knowing: the checks that exist prove that Qwen Code installs and converts erfana correctly. No erfana skill has yet been run from start to finish inside a Qwen Code session. The full list of what works, what degrades, and what is not verified is in [docs/hosts.md](hosts.md).

## Glossary

| Term | Meaning |
|---|---|
| Agent | A helper that Claude starts in a separate context for one task, defined by a file in `agents/`. |
| Blinded review | A review by a separate agent that sees only the work and the standard, not the author's reasoning. |
| Claim | A GitHub label and comment that `erfana:coordinate` adds to mark an issue as taken by one session. |
| Compaction | Claude Code shortening a long conversation into a summary so it fits; details can be lost. |
| Diataxis | A way to organise docs into four types: tutorial, how-to guides, reference, and explanation. |
| Fail open | A safety check that lets the action through when the check itself cannot run. |
| Fan out | Start several agents at once on parts of a task, then combine what they return. |
| Frontmatter | The settings block between `---` lines at the top of a skill, agent, or command file. |
| Gate | One of the 13 automatic checks the erfana maintainers run on the plugin before a release. |
| `gh` | The GitHub CLI, the command-line tool erfana uses to read and change GitHub issues and pull requests. |
| /goal | A Claude Code command that keeps Claude working, turn after turn, until a condition you wrote is met. |
| Goal evaluator | The small model that reads the conversation after each turn and decides whether a `/goal` is met. |
| Headless run | Claude running with no person to answer questions, such as `claude -p` or a CI job. |
| Hook | A script that Claude Code runs automatically at a fixed moment, such as before a shell command. |
| `jq` | A small command-line JSON tool that most erfana hooks need on macOS and Linux. |
| `.local/` | A folder in your project where erfana skills keep working files; autopilot keeps it out of git. |
| Marketplace | A list of plugins that Claude Code can install from; erfana's is `erfana-skills` on GitHub. |
| Namespaced name | A skill or command name with the plugin prefix, such as `/erfana:issue` rather than `/issue`. |
| Owner | You – the person who decides what the work should achieve and approves outward actions. |
| Owner decision | An answer you gave to a queued question, recorded so the run does not ask again. |
| Owner queue | The list in `.local/autopilot.md` of things an unattended run needs you to decide. |
| Plugin | A package that adds skills, agents, commands, and hooks to Claude Code. |
| Pull request | A GitHub request to merge one branch into another, also called a PR. |
| Qwen Code | A coding agent from the Qwen team that can install Claude Code plugins by converting them. |
| Sentinel | A hidden marker in a reply, such as `<!-- erfana:grill-open -->`, that a hook looks for. |
| Skill | A written brief in `skills/<name>/SKILL.md` that tells Claude how to do one kind of work. |
| Slash command | A prompt you start by typing `/` and its name, such as `/erfana:project-status`. |
| Spec tier | The size of a requirements spec in `erfana:spec`, from T1 (an issue) to T4 (a standard spec). |
| State file | A file a skill writes so its work survives a restart, such as `.local/autopilot.md`. |
| Trigger phrase | Words in your request that tell Claude a skill fits, such as "create an issue". |
| UAT | User acceptance testing – the step where you check the finished work and accept or reject it. |
| User-only skill | A skill Claude never starts by itself, such as `ship`; you start it by typing its command. |
| Worktree | An extra working folder for the same git repository, so two branches can be open at once. |
