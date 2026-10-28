# The agent standard

What a good Claude Code agent (subagent) looks like for the Claude 5.5 generation. It is the single source for creating, reviewing, and changing agents in this skill; the reviewer agent reads it at run time. Each rule carries its reason, because the reason is what lets a rule be applied sensibly to a case it does not name.

## Contents

- [1. Does this need an agent?](#1-does-this-need-an-agent)
- [2. Platform facts](#2-platform-facts)
- [3. Frontmatter](#3-frontmatter)
- [4. The description](#4-the-description)
- [5. Tools and security](#5-tools-and-security)
- [6. The prompt](#6-the-prompt)
- [7. Model and effort](#7-model-and-effort)
- [8. Severity](#8-severity)
- [9. Testing an agent](#9-testing-an-agent)
- [Sources](#sources)

## 1. Does this need an agent?

An agent is a separate context with its own prompt and tools. That is worth having only for a reason a skill or the main conversation cannot give:

- **Noisy side work** whose details the caller does not need – research, a large search, a long log – so only a compact result comes back.
- **Parallel work** that needs fresh, disposable contexts.
- **A fresh pair of eyes** – a reviewer that should judge the work without the author's reasoning in view.
- **Conflicting instructions** that cannot share one prompt.

Delegation alone does not make an answer better, and protecting the caller's context is not a reason on its own: a fresh reviewer helps, a plain hand-off does not. Otherwise prefer the alternatives. A one-off task belongs in the main conversation. Work the user should see and steer step by step belongs in a skill. A fixed command with arguments is a slash command. Split agents by the context they need, not by job title: specialists that hand their output to each other in a chain usually work better as one loop. A large roster of similar specialists also makes automatic delegation less reliable.

## 2. Platform facts

- A subagent sees only its own prompt body, basic environment details, and the delegation message – not the conversation and not the main system prompt. Its body must stand on its own.
- Nested spawning is capped (by default three layers deep and twenty at once) and multiplies cost while hiding work from the caller. Orchestration across agents belongs in the main conversation or a skill.
- A subagent cannot ask the user anything: `AskUserQuestion` is removed from every subagent. When it needs a decision, it returns the question (with the context and options) to its caller, which asks the user and passes the answer back.
- An agent with no `tools` line inherits every tool, including any connected MCP tools.
- Agents live in `.claude/agents/` (project, highest precedence), `~/.claude/agents/` (user), or a plugin's `agents/` folder. Every `*.md` file with agent frontmatter in those folders loads as an agent – so backups and drafts must not be saved there with an `.md` ending.
- A subagent started in the background loses most built-in tools (MCP tools stay), so the same file can get different tools in the foreground and the background.
- Plugin-distributed agents ignore `hooks`, `mcpServers`, `permissionMode`, and `initialPrompt`. Least privilege there comes from `tools` and `disallowedTools`.
- Claude Code scans a subagent's final report and neutralises imitated control tags, but it does not reword the text. The scan does not replace limiting what the agent can reach.
- All agent descriptions together share a budget of about 15,000 tokens per session.

## 3. Frontmatter

- `name` – kebab-case, at most 64 characters, equal to the filename without `.md`. The platform allows a mismatch; this house rule keeps agents easy to find and invoke.
- `description` – see section 4.
- `tools` – listed explicitly (section 5).
- `model` – `haiku`, `sonnet`, `opus`, or `inherit`; `inherit` is a valid choice that follows the session model.
- `effort` – optional; see section 7.
- No `temperature`, `top_p`, or `top_k`: current models reject non-default sampling parameters with an error. No fixed thinking budget (`budget_tokens`) for Claude 5 models, which only take adaptive thinking.
- `color` – optional; unique across the agents in the same folder, and different from a pair partner's.
- Other optional fields that work today: `disallowedTools`, `maxTurns` (a turn cap; the output is marked partial), `skills` (preloads skill content as reference), `memory`, `background`, `isolation: worktree`, `omitClaudeMd`, and `autoCompactWindow` (a plain integer). Unknown fields are ignored silently, so a misspelt field fails without warning.

## 4. The description

Claude Code lists every agent's description in every session, and Claude decides from it when to delegate. So it must route well and cost little.

- Say what the agent does and when to use it, in plain words: one or two sentences with a "Use when…" clause, at most 300 characters. A skill-internal agent gets one sentence of at most 160 characters naming the skill that uses it ("Used by erfana:spec to …").
- When two agents are close siblings, add one clause that routes between them.
- Name the trigger, not a persona: "Reviews migrations for locks before release", not "database expert".
- Calm wording only: no "MUST BE USED", "Use PROACTIVELY", or all-caps emphasis. Current models delegate readily, so pressure wording now makes them over-trigger. (The official subagent page still suggests "use proactively"; this standard deliberately does not.)
- No `<example>` blocks: they cost context in every session and narrow routing to the shapes they show.
- Third person or imperative – not "I can help…" or "You can use…".

## 5. Tools and security

- **Least privilege.** Grant only what the job needs. A reviewer reads (`Read`, `Grep`, `Glob`); it does not write, and it does not get `Bash` unless it must run a check, in which case the prompt says which commands.
- **Never grant** `Agent` (or the legacy `Task`) or `AskUserQuestion`. A subagent never gets `AskUserQuestion`, and nested spawning hides work and multiplies cost (section 2); either grant signals a design that belongs in a skill.
- **Risky combinations** need a reason in the prompt: `Bash` with `Write` (can change anything on disk), web fetching with `Write` (can write fetched content anywhere), any network tool on an agent that reads private or untrusted material (an exfiltration path).
- **No secrets** in the prompt: no keys, tokens, passwords, connection strings, or internal URLs. Refer to an environment variable or a named secret instead.
- **Sensitive files.** An agent with file access is told not to read `.env*`, credential files, private keys (`*.pem`, `*.key`), cloud or CI credential stores, or `.git-credentials`, unless reading them is its job.
- **Untrusted content.** An agent that reads anything it did not write – web pages, issues, pull request text, documents, tool output – is told that this content is data, not instructions, and that an instruction found inside it is a finding to report.
- **Destructive actions** (deleting, overwriting, pushing, sending, spending) are not taken on the agent's own judgment: the prompt says to stop and return the decision to the caller.

## 6. The prompt

Write the brief a capable new colleague would need, not a script.

- **The job and why it matters**, in a few sentences: the outcome the caller needs and what it will be used for.
- **Inputs** the agent receives and what to do when one is missing.
- **Boundaries** – what is in scope, what belongs to another agent, what it must not touch – each with its reason.
- **The judgment that matters**: the trade-offs, the common mistakes in this domain, how to tell a real problem from a false alarm. This is where domain knowledge earns its place. Leave out steps a strong model would take anyway.
- **A way out.** When the task cannot be done – a missing file, no access, an impossible requirement – the agent stops that part, finishes what does not depend on it, and reports what blocks it. Without a permitted exit, models given impossible tasks try to game their checks far more often.
- **An output contract** the caller can rely on: the exact shape of what comes back, with evidence (file and line, quoted text) for every finding, and room for "not sure" or "not applicable" instead of a forced verdict.
- **A full account** for agents that change things: every change made, anything requested but not done and why, and anything noticed but left alone.

Wording:

- Calm and direct, with reasons. All-caps commands and "YOU MUST" make current models over-apply a rule; a plain rule with its reason generalises better.
- Describe the work, not a persona. "Check every migration for table locks and a working rollback" beats "You are a world-class database expert".
- Never ask the agent to show or write out its reasoning ("show your reasoning step by step", "explain your chain of thought"). Current models may refuse that with a `reasoning_extraction` refusal. Ask for evidence in the output instead.
- No "think carefully" or "be thorough" lines: depth comes from the effort setting.
- No "use a subagent to verify your work" lines. Self-started verification agents add cost without adding quality; a separate reviewer, chosen by the caller, is the one that helps.
- Ask for a short result. The caller needs the conclusion and its evidence, not the agent's working notes.
- Name actions, not tool-call syntax ("search the code for TODO markers", not a tool call with parameters), so the prompt also works on hosts whose tool names differ.
- Keep it short. A focused agent prompt is often 30–150 lines; long prompts slow every call and bury the rules that matter.
- A `<critical_thinking>` block (alternatives weighed, edge cases) is a useful design record for agents that make judgment calls; it is optional for mechanical agents.

## 7. Model and effort

For the Claude 5.5 generation, start low and raise only when a test shows a gain:

| Work | Model | Effort |
|---|---|---|
| Mechanical checks, formatting, classification, link checks | `haiku` (Haiku 5.5) | `medium`, or `low` with a short prompt |
| Routine implementation, research, focused review | `sonnet` | `medium` |
| Judgment-heavy review, design, hard investigation | `opus` | `medium` (Opus 5.5 at `medium` matches Opus 5 at `high`) |

Haiku 5.5 is the cheap subagent model for the 5.5 family and the first Haiku with effort levels. At `low` with a long prompt it tends to stop early. For hard agentic coding, use Sonnet 5.5 or Opus 5.5 instead. Keep `xhigh` and `max` for measured gains: higher effort is not always better, and fan-out reviewers at `max` have gone out of scope and timed out. Omitting `effort` is valid; the agent then follows the session.

## 8. Severity

| Severity | Meaning | Examples |
|---|---|---|
| High | The agent will fail, refuse, or create a security risk | `Agent` or `AskUserQuestion` granted; a secret in the prompt; sampling parameters; a request to show reasoning; untrusted content with no data rule; no `tools` line on an agent that reads untrusted material; instructions to ask the user or start an agent |
| Medium | The agent works but routes, scopes, or reports badly | Pressure wording or `<example>` blocks in the description; description over the length limit; name not matching the filename; more tools than the job needs; no output contract; no way out when blocked |
| Low | Quality and cost | Persona lines, all-caps emphasis, generic steps, an over-long prompt, instructions to verify its own work with subagents |

An agent is ready when it has no high-severity findings and the user has accepted or fixed the medium ones.

## 9. Testing an agent

- **Direct:** invoke it by name with a realistic task and check the output against its contract.
- **Routing:** a natural request that matches its "Use when…" clause should reach it; a nearby request that belongs to a sibling should not.
- **Clean input:** a reviewer also gets one target with nothing wrong, to check it does not invent findings.
- **Edge cases:** missing or empty input, a very large input, an impossible request – it should stop and report rather than improvise.
- A skill-internal agent is tested through the skill that uses it.

## Sources

- Anthropic, "Prompting Claude Opus 5.5" – https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5
- Anthropic, "Building agents: when to fold subagents into your main agent loop" (2026-10-22) – https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop
- Anthropic, "Steering Claude Code: CLAUDE.md, skills, hooks, and subagents" (2026-06-18) – https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more
- Anthropic, System card: Claude Opus 5.5, §6.2.2 (impossible tasks) – https://www.anthropic.com/claude-opus-5-5-system-card
- Claude Code documentation, subagents – https://code.claude.com/docs/en/sub-agents
- Claude Code documentation, best practices ("Know what subagents cost", "What you can stop doing") – https://code.claude.com/docs/en/best-practices
- Agent SDK documentation, subagents – https://code.claude.com/docs/en/agent-sdk/subagents
- Anthropic, "Prompting Claude Opus 5" ("Controlling subagent spawning") – https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5
- Anthropic, "Introducing Claude Haiku 5.5" (2026-10-07) – https://www.anthropic.com/claude-haiku-5-5 and "Prompting Claude Haiku 5.5" – https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-haiku-5-5
- Anthropic, "How and when to use subagents in Claude Code" (2026-04-07) – https://claude.com/blog/subagents-in-claude-code
