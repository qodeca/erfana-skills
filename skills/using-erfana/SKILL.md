---
name: using-erfana
description: Routes a request to the right erfana skill – agents, skills, GitHub issues, specifications, reports, articles, plan stress-tests, prompts, goals – and names the slash command for the skills only the user can start.
when_to_use: |
  Use when the user asks "which erfana skill", "what can erfana do", or "help me pick a skill", or mentions an orchestration task such as "create an agent", "create a skill", "implement issue", "create a spec", "write an article", "create a report", "grill me", "write a prompt", "draft a goal", "pick the next issues", "claim issue", "fan out specialists", "have specialists review this plan", "run this unattended", "raise the bar", "review my skill", "stress-test this plan", "fact-check this", "commit and push", "open a pull request", or "hand this off to another session".
---

# Using erfana skills

Pick the one erfana skill that fits the request, so the user gets the plugin's standard for that kind of work rather than an improvised version. This skill only chooses; the chosen skill does the work.

## Ground rules

- **The user decides.** An explicit instruction ("don't use a skill", "just answer") wins over any routing here.
- **Route only to skills Claude may start.** A skill marked `disable-model-invocation` runs only when the user starts it – the "Suggest" rows below – because they edit documents, push code, or end a session. For those, name the command – `/erfana:fact-checking <file>`, `/erfana:ship [commit | push | pr | merge | cleanup]`, `/erfana:handoff [purpose]` – and let the user run it.
- **Load a skill only when it clearly fits.** A plain question about a topic is not a request to run a lifecycle skill. When nothing fits, answer normally.
- **One skill at a time.** When a request spans two skills (a spec and the issues that implement it), name the order, start with the skill that produces the source material, and let the user move on to the next one.

## Which skill

| The user wants to… | Skill |
|---|---|
| Create, review, or change a Claude Code agent, or a doer/reviewer pair | `erfana:agent` |
| Create, review, change, or modernize a Claude Code skill | `erfana:skill` |
| Create, implement, review, or display GitHub issues | `erfana:issue` – its Implement operation needs a person at acceptance and before git actions, so not in a headless `claude -p` run |
| Write or validate a requirements specification | `erfana:spec` |
| Create, review, or revise a consulting report | `erfana:report` |
| Research, write, review, or revise a medium-form article | `erfana:article` |
| Stress-test a plan or design through questions | `erfana:grill-me` (skill requirements interviews belong to `erfana:skill`) |
| Write or improve a prompt for a Claude model | `erfana:prompt` |
| Make a request more ambitious before running it | `erfana:raise-the-bar` |
| Turn an intention into a `/goal` condition | `erfana:draft-goal` |
| Hand over a body of work to run unattended, or resume one after a restart | `erfana:autopilot` |
| Pick the next issues to work on | `erfana:next-batch` |
| Claim issues or check what parallel sessions are doing | `erfana:coordinate` |
| Have specialists review a plan, design, or documents and improve it | `erfana:expert-panel` |
| Check a document's facts against its sources | Suggest `/erfana:fact-checking <file>` |
| Commit, push, open, or merge a pull request | Suggest `/erfana:ship [commit \| push \| pr \| merge \| cleanup]` |
| Hand the work over to another session or person | Suggest `/erfana:handoff [purpose]` |

When two skills could fit, choose the more specific one; if it is still unclear, ask the user which outcome they want.
