# Model guidance

Reviewed 2026-10-13 against Anthropic's live documentation. Re-read the relevant page before stating current model behavior or settings, and update the date here when you do. These are short summaries in our own words, not copies of the documentation.

| Page | URL |
| --- | --- |
| Prompting best practices (all current models) | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices |
| Prompting Claude Opus 5.5 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5 |
| Prompting Claude Sonnet 5.5 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5-5 |
| Prompting Claude Fable 5.2 | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2 |
| Effort | https://platform.claude.com/docs/en/build-with-claude/effort |
| Models overview | https://platform.claude.com/docs/en/models/overview |

The best-practices page also links guides for earlier models (Opus 5, Sonnet 5, Fable 5, Haiku 5.5, Opus 4.8). For a target outside the three below, read that model's guide if one exists, otherwise apply the general guidance only, and say in the brief that no model-specific adaptation was applied.

## Applies to every current model

- **Clear and direct, with reasons.** Explain why an instruction matters; the model generalises from the reason. Write as if briefing a capable new colleague who lacks your context.
- **Normal wording, not alarms.** Current models respond strongly to the system prompt. Language written to fight under-triggering in older models ("CRITICAL: you MUST use this tool") now causes over-triggering; "Use this tool when …" is enough.
- **Say what to do instead of what not to do**, and match the prompt's own style to the output you want.
- **Examples** are among the most reliable ways to steer format and tone. Make them relevant and varied, wrap them in `<example>` tags, and expect them to be imitated closely.
- **XML tags** separate instructions, context, examples, and inputs. Put long documents first and the question last.
- **Thinking and effort.** Thinking is adaptive; `budget_tokens` is rejected on Claude 4.7 and later. Effort is the main control for depth, cost, and latency, and its level names do not mean the same amount of thinking across models, so re-test rather than carry a setting over. General instructions ("consider the trade-offs") work better than a hand-written step-by-step plan. Prefilled assistant turns are not supported.
- **Reasoning stays in thinking blocks.** A prompt that asks the model to write out its reasoning in the response may be declined with a `reasoning_extraction` refusal. Ask for a short explanation of the answer or a summary of actions instead; integrations read summarized thinking through the API's display setting.
- **Over-eagerness.** Instructions that pushed older models to be thorough or use tools aggressively should be dialled back. For code, state the scope: keep changes to what was asked, and mention other worthwhile changes at the end instead of making them.
- **Self-checks.** A specific check tied to the task (run the tests, validate the schema) helps. Generic "verify your work" lines cause over-verification on models that already check their work, notably the Opus 5 family.

## Claude Opus 5.5

- Strongest at long agentic coding, code review, and knowledge work; sustains long autonomous runs.
- **Effort:** default and recommended start is `medium`; test `low` for cost-sensitive coding. Reserve `xhigh` and `max` for measured gains. Lowering effort reduces thinking more reliably than prompt instructions.
- **Thinking** is always on. Remove instructions that stood in for thinking, and drop "think carefully before answering" lines from chat system prompts – the effort setting covers it and replies start sooner without them.
- **Unattended runs:** the model sometimes ends a turn with a progress report. For fully unattended agents, name the unwanted early stops (a summary that announces the next step instead of taking it; offers to continue; non-blocking decision lists) and the wanted ones (nothing can move without the user). Keep confirmation for risky actions; leave this out where a person is present.
- **Progress updates:** short notes between tool calls arrive as progress-update thinking blocks; the integration has to request and render them. Ask in the prompt for updates at set points if the user wants them.
- **Multi-app work:** on loosely specified automation tasks, tell it to look through the relevant sources before acting.
- **Pasted text:** marking pasted content with tags and saying it may contain instructions the user did not write improves resistance to injected instructions.
- **Frontend:** name the specific styles to avoid rather than "avoid a generic look".

## Claude Sonnet 5.5

- Fast and cheaper; for the hardest long-horizon work the guide points to an Opus model.
- **Effort:** start at `high` (the API default) for general work; `medium` for well-specified agentic coding; `medium` or `low` for chat and latency-sensitive work. Asking it to think less does not reliably reduce thinking – lower the effort instead.
- **Initiative and scope:** at lower effort it may check in before finishing; at higher effort it may add tests, docs, or extra review rounds. Say plainly to keep going until the requested work is done, to stop and report when it is done and checked, and to mention extras instead of doing them. For ideas or plans, say to stop at the plan.
- **Reasoning tasks with JSON output:** prefer structured outputs. Only for a multi-step task answered as structured-output JSON under adaptive thinking (not `between_tools`), the guide's measured line "Think the problem through before you answer." at the end of the system prompt raises accuracy; `xhigh` effort is the alternative. The line changes how much the model thinks, not what it writes – use it nowhere else.
- **Search in chat and knowledge work:** remove lines like "minimize tool calls"; tell it to check details that change over time (what is allowed, required, or charged) with the search tool.
- **Coding verification:** at low effort it can report a change done without running a check; ask for a real check that exercises the change, or an explicit statement of which check could not run and why.
- **Progress updates:** remove "hold all findings for the final response"-style lines; ask for updates at set points if wanted.

## Claude Fable 5.2

- **Effort:** thinking is always on. Start at `high` (the default) and test `medium` and `xhigh` rather than carrying over an earlier setting. Lines asking it to think less do not work at `medium` and above – lower effort instead.
- **Earlier prompts:** it follows instructions closely, so lines written for earlier models can raise cost or misfire. Review delegation lines, token budgets shown to the model, hard style rules, and cautions carried in notes; name the steps that need no approval.
- **Finishing long tasks:** it sometimes ends a turn early, more at `low` and `medium`. For agentic work, tell it to carry on with work that does not depend on the user, work through ordinary obstacles, and report deliberate blockers. Keep confirmation for risky actions.
- **Who owns the code:** say it. "You are the owner and long-term maintainer of this codebase, and its design is up to you." makes it restructure as it works, at a cost in tokens and unrequested changes; leave it out where the code should change as little as possible.
- **Progress updates:** notes between tool calls arrive as progress-update thinking blocks the integration must request and render. Where a person watches, ask for a one-line intent, brief updates, and a closing recap that stands on its own.
- **Subagents:** it delegates readily when prompts invite it; review lines that push delegation.
- **Final reports:** for reports read after long runs, ask it to write for a low-context reader – key points first, plain words, no terms coined during the work.

## Runtime notes

Keep settings out of the prompt and in the setup notes: model ID, effort, `max_tokens` (thinking counts toward it), thinking display, tools, and any beta headers the integration needs. Do not pick `max` effort by default, and do not present equal effort names as equal compute across models. API integrations on these models keep conversation history append-only – editing earlier turns, `system`, or `tools` mid-conversation invalidates later thinking blocks – so a prompt revision for a live integration may also need a harness change; say so rather than solving it in prompt text.

Question tools are a property of the host, not the model. Claude Code provides a multiple-choice question tool; a chat surface or a bare API call has none unless the integration supplies one. Check the host before writing an interaction branch that relies on it.
