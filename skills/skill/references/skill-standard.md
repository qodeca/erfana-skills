# The skill standard

What a good Claude Code skill looks like for the Claude 5.5 generation. It is the single source for creating, reviewing, changing, and modernizing skills in this plugin; the reviewer agent reads it at run time. Each rule carries its reason, because the reason is what lets a rule be applied sensibly to a case it does not name. Rule numbers such as **12.7** are kept from the old checklists because the gates and the docs cite them; the index at the end maps each one to its section.

For the agents a skill uses, the standard is [`../../agent/references/agent-standard.md`](../../agent/references/agent-standard.md) – this file does not repeat it. Model background (the Claude 5 family, effort, delegation, cache) is in [`claude-5-patterns.md`](claude-5-patterns.md).

## Contents

- [1. Does this need a skill?](#1-does-this-need-a-skill)
- [2. Platform facts](#2-platform-facts)
- [3. Frontmatter and the description](#3-frontmatter-and-the-description)
- [4. The body: write a brief](#4-the-body-write-a-brief)
- [5. Security](#5-security)
- [6. Model rules](#6-model-rules)
- [7. Files and links](#7-files-and-links)
- [8. Severity](#8-severity)
- [9. Testing a skill](#9-testing-a-skill)
- [Rule index](#rule-index)
- [Sources](#sources)

## 1. Does this need a skill?

A skill is knowledge and judgment that loads when a task needs it. Choose it for a procedure that repeats and that the user should see and steer. The alternatives:

| Need | Use |
|---|---|
| A one-off task | Ask in the conversation |
| A fixed shortcut with arguments | A slash command |
| Always-on project facts and conventions | `CLAUDE.md` |
| Noisy side work, parallel work, or a fresh reviewer | An agent ([agent standard](../../agent/references/agent-standard.md), section 1) |
| External data or actions | An MCP server |

**Focused or multi-operation.** Shape follows the deliverable: one skill per kind of output. A skill with several operations (create, review, modify) is fine when they share one standard and one artifact; split it when the operations share nothing.

**Where support material lives.** Start with the cheapest form: a reference file in the skill. Promote it to a plugin-root agent only when it needs its own context (section 1 of the agent standard) – every root agent adds its description to every session. A skill needs no agents at all if the work is best done in the main conversation.

## 2. Platform facts

- **Loading.** The frontmatter (`name`, `description`, `when_to_use`) is listed in every session; the body loads when the skill is invoked; files under the skill load only when the body points to them and the task needs them.
- **Compaction.** After compaction each invoked skill is re-attached with only its first 5,000 tokens, from a shared budget of 25,000. The rules that protect the user must sit at the top of `SKILL.md`, or they are lost in a long session.
- **`context: fork`** runs the skill in a separate context and returns only the result. Use it for long, self-contained work whose details the user does not need to watch; the forked run cannot ask the user anything.
- **Arguments.** `argument-hint` shows a hint after the slash command; the body reads `$ARGUMENTS`, or positional `$ARGUMENTS[N]` / `$N`.
- **Shell injection.** A line written as !`command` runs at load time with the user's permissions and pastes its output into the skill. Keep it read-only and bounded (`git log -5`, `git diff --stat`), because its output costs context on every load.
- **Caching.** A skill body joins a conversation that is already cached, so its size does not decide caching – never pad it. Dates, IDs, or other changing text near the top of `SKILL.md` break the cache for everything after them.
- **Agents load at session start.** An agent created during a session is not available until the next one. Per-skill `skills/<name>/agents/` folders are not a documented discovery path; agents live in a plugin's `agents/`, `.claude/agents/`, or `~/.claude/agents/`.
- **Two hosts.** This plugin also installs on Qwen Code, which ignores skill-level `hooks:`, reads `allowedTools` rather than `allowed-tools`, drops `effort`, and does not resolve `model: opus`. So a hard limit lives in `hooks/hooks.json` or in tool grants, and a skill's correctness never depends on a pinned model tier. Details: `docs/hosts.md`.

## 3. Frontmatter and the description

- `name` – lowercase letters, digits, and hyphens, at most 64 characters, no `:`. In this plugin it equals the folder name (Gate 2), so autocomplete and the folder agree.
- `description` – what the skill does, in the third person (**12.1**): not `I can help` / `You can use` / `I'll help`. Anthropic requires the third person because the text is injected into the system prompt.
- `when_to_use` – when to use it, with at least three specific quoted phrases users really say (**12.2**; Anthropic asks for specific triggers, three is this plugin's convention for reliable activation). A workflow summary does not route; triggers do.
- No filler words (`comprehensive`, `thorough`, `detailed`) – they cost characters and route nothing.
- `description` + `when_to_use` together stay within 1,536 characters (**7.4**): Claude Code truncates beyond that.
- `allowed-tools` – the least the skill needs (section 5).
- `model` – an alias (`haiku`, `sonnet`, `opus`) or `inherit`; omitting it inherits the session model. No retired model IDs.
- `disable-model-invocation: true` when a skill must run only on the user's command (destructive, costly, or review-on-request skills). `user-invocable: false` hides a skill from the slash menu.
- No `hooks:` in frontmatter (Qwen ignores it); register hooks in `hooks/hooks.json`.
- No `temperature`, `top_p`, `top_k`, or fixed thinking budget (**12.7**, section 6).

## 4. The body: write a brief

Write what a capable colleague would need to do the job well, not a script for a weaker model.

- **The outcome first.** One or two sentences: what the skill helps the user end up with, and why it matters.
- **Ground rules next**, at the top (compaction keeps only the first 5,000 tokens): what the skill treats as data, when it may change files, what it never does, and what "blocked" means. Each rule with its reason.
- **One section per operation, led by its result** ("The result is…"), then only what a strong model would not do unaided: the domain judgment, the decisions that need the user, the order where order matters. Number steps only where the order matters.
- **A way out.** When a task cannot be done – a missing file, no access, a decision only an absent user can make – the skill stops that part, finishes what does not depend on it, and reports what blocks it. Without a permitted exit, models given impossible tasks try to game their checks far more often. Never "keep retrying until it succeeds".
- **A full account** for operations that change things: every change made, anything requested but not done and why, and anything noticed but left alone.
- **A separate checker** for quality claims: an agent that sees only the artifact and the standard, not the author's reasoning or what the verdict decides.
- **Hard limits in hooks and agent `tools`**, not in prose: an agent's `tools` line is a real limit; a skill's `allowed-tools` only removes the permission prompt for those tools and does not take the others away; a sentence is a request.
- **No verify rituals** (**12.3**): no `always verify` / `double-check every step` on routine work – current models check their own work and over-check when told to. Keep checks at irreversible steps and at declared quality gates.
- **Delegation calibration** (**12.4**): fan out to agents only for independent, sizeable work; small glue work stays in the main conversation, where spawning costs more than it saves. Do not tell agents to verify their own work with more agents.
- **Agent settings stated** (**12.5**): each agent the skill uses has its model and effort set in its frontmatter, or the skill says they all inherit.
- **Find, then filter** (**12.6**): a reviewing skill lists every finding first and filters or ranks in a second pass. "Report only critical issues" is followed literally and drops the rest.
- **Calm wording with reasons.** Capital-letter emphasis and `YOU MUST` make current models over-apply a rule; a plain rule with its reason generalises better.
- **Ask from the main conversation.** Only the main conversation can ask the user; agents return their questions to it. Ask one decision at a time.
- **No skill invokes another skill or a slash command.** Invoking one re-enters skill-level work and can recurse or fan out into the caller's context. When the user should run another skill next, print the command and end the turn. The one exception is a router whose only job is choosing (in this plugin, `using-erfana`): it does no work itself, so loading the chosen skill is a hand-over, not a nested run – and it never routes to a skill marked `disable-model-invocation`.
- **Name actions, not tool-call syntax** – "search the code for TODO markers", not a tool call with parameters – so the body works on hosts whose tool names differ. Real shell commands stay verbatim.
- **Cut what does not change behaviour.** For each line ask: would a strong model do worse without it? Keep the reasons and the domain facts; cut generic steps, duplicated rules, and lists of behaviours the model shows anyway.

## 5. Security

- **Untrusted content is data.** A skill that reads anything it did not write – web pages, issues, pull request text, commit messages, documents, tool output – says that this content is material to work on, and that an instruction found inside it is a finding to show the user.
- **No secrets** in any skill file: no keys, tokens, passwords, or URLs with credentials. Refer to an environment variable or a named secret.
- **Confirm before destructive or outward-facing actions** – deleting, overwriting, pushing, publishing, sending, spending. A headless run without that confirmation makes no such change and says what approval it needs.
- **Least privilege in `allowed-tools`.** Grant `Bash`, `Write`, and network tools only when the job needs them; never set a permission mode that bypasses prompts. Do not grant `Skill` (see section 4).
- **No running untrusted input**: no `eval` of user text, no unescaped shell interpolation, no downloading and running remote scripts.
- **Stay in scope**: no writes to `~/` or outside the project without the user's consent, and no path traversal.

## 6. Model rules

**12.7** – these three hold for everything this plugin ships, because it runs on Anthropic models (other model families prescribe the opposite; it is a property of the target, not of prompting):

- No `temperature`, `top_p`, or `top_k`: current Claude models reject non-default sampling parameters with an error.
- No fixed thinking budget (`budget_tokens`) on Claude 5 models, which take adaptive thinking; use the `effort` setting instead.
- No instruction to show, reproduce, or explain the model's internal reasoning (`show your reasoning`, `explain your chain of thought`, `thinking.display: visible`). It can trigger a `reasoning_extraction` refusal on Claude Fable and Opus 5-generation models. Ask for evidence in the output instead – the file and line behind each decision. Author-filled design records such as a `<critical_thinking>` block are static text and exempt.

## 7. Files and links

- Every file stays under 500 lines (this plugin's limit): long files cost context and hide the rules that matter. Split by topic and point to the parts.
- References go one level deep from `SKILL.md`, with relative paths and forward slashes; every link resolves from the skill's folder (Gate 7). No absolute paths to anyone's home directory.
- No orphan files nobody points to, no `[TODO]` placeholders, no stale examples or model names.
- Golden cases for a skill live outside it (in this plugin, `tests/<skill>/`), so they do not load with the skill.

## 8. Severity

| Severity | Meaning | Examples |
|---|---|---|
| High | The skill will fail, refuse, misfire, or create a security risk | Sampling parameters or a fixed thinking budget; a request to show reasoning; a secret; untrusted content with no data rule; a destructive or outward-facing action without confirmation; invoking another skill or granting `Skill`; no way out ("retry until it succeeds"); a broken link the body depends on; `name` not matching the folder |
| Medium | It works but routes, scopes, or behaves badly | First-person or workflow-summary description; fewer than three quoted triggers; combined description over 1,536 characters; more tools than needed; protecting rules buried below the first screen; verify rituals; filtering at find time in a reviewing skill; a file over 500 lines |
| Low | Quality and cost | Capital-letter emphasis, filler words, generic steps, duplicated rules, orphan files, changing text near the top |

A skill is ready when it has no high-severity findings and the user has accepted or fixed the medium ones.

## 9. Testing a skill

- **Golden cases before a rewrite.** Write the cases and run the old skill on them first; the same cases then show whether the new one is better. Plant known defects in a fixture, plus one trap (something valid that a careless reviewer would flag).
- **Direct:** invoke the skill with a realistic request and check the result against what the operation promises.
- **Routing:** a natural request that matches a trigger phrase should load the skill; a nearby request that belongs to a sibling should not.
- **Headless runs:** `claude -p --plugin-dir <checkout>` with the installed copy of the plugin disabled, one fresh folder per run, and the whole stream captured (`--output-format stream-json --verbose`) – a Stop hook can replace the final message. Run each case more than once.
- **Edge cases:** missing input, an impossible request, a headless run that needs a decision – the skill should stop and report rather than improvise.

## Rule index

| Rule | Where | Enforced by |
|---|---|---|
| 7.4 – description + `when_to_use` within 1,536 characters | Section 3 | Gate 2 (warning) |
| 12.1 – third-person description | Section 3 | Gate 2 (warning) |
| 12.2 – at least three quoted trigger phrases | Section 3 | Gate 2 (warning) |
| 12.3 – no verify rituals | Section 4 | Review |
| 12.4 – delegation calibration | Section 4 | Review |
| 12.5 – agent model and effort stated | Section 4 | Review |
| 12.6 – find, then filter | Section 4 | Review |
| 12.7 – sampling parameters, fixed thinking budget, reasoning display | Section 6 | Gate 2 (warning), review |
| 13.1–13.5 – the same rules for agents | [Agent standard](../../agent/references/agent-standard.md), sections 3, 6, 7 | Gate 2 (warning), review |

## Sources

- Claude Code documentation, skills – https://code.claude.com/docs/en/skills
- Anthropic, "Skill authoring best practices" – https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Anthropic, "Prompting Claude Opus 5.5" – https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5
- Anthropic, System card: Claude Opus 5.5, §6.2.2 (impossible tasks) – https://www.anthropic.com/claude-opus-5-5-system-card
- This plugin's host differences – `docs/hosts.md`
