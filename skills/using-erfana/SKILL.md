---
name: using-erfana
description: Use at the start of any conversation that mentions an orchestration task – managing Claude Code agents or skills, writing articles, working GitHub issues, producing consulting reports, or writing specifications. Establishes the routing rules across erfana sub-skills.
when_to_use: |
  Trigger phrases: "create agent", "review agent", "create skill", "review skill", "modernize skill", "apply Claude 5 patterns", "create issue", "implement issue", "review code", "create spec", "write article", "create report", "grill me", "fact-check this".
  Invoke before responding when any of these appear in the user's message.
---

# Using erfana skills

This plugin is an open-source (GPL-3.0-only) Claude Code orchestration toolkit maintained by Qodeca sp. z o.o. It bundles the 87 shared agents the orchestration skills delegate to. This bootstrap skill is the entry point for every other skill in the plugin.

## Available skills

### Orchestration

| Skill | Use when |
|---|---|
| `erfana:managing-agents` | Creating, reviewing, modifying, or validating Claude Code agents (lifecycle management with research, design, validation phases) |
| `erfana:managing-articles` | Writing medium-form articles end-to-end – research, outline, draft, review, publish (bilingual Polish/English support) |
| `erfana:managing-issues` | Full lifecycle of GitHub issues – create, implement (multi-phase), review code, and display (read-only `show issue #N` / `list issues` / `find issues` modes). The Implement operation is **autonomous**: it designs, builds, reviews, and fixes the technical work without blocking on intermediate approvals, asking a human only to clarify requirements (business-analysis phase), to accept at UAT, and to confirm the final git actions; its reviews are **embedded** (its own reviewer agents fan out – no user-run `/erfana:lens-review`). It still refuses a detected headless run – do not route a `claude -p` / CI session into it |
| `erfana:managing-reports` | Creating, reviewing, and validating professional consulting reports (Pyramid Principle, SCQA, Five Cs framework) |
| `erfana:managing-skills` | Creating, reviewing, modifying, and **modernizing** (apply Claude 5 patterns) Claude Code skills following Anthropic best practices – opens with a coverage-map requirements interview (Create always; Modify/Review/Modernize when gated in) |
| `erfana:managing-specs` | 4-tier specification management (T1 issue, T2 spec, T3 lite spec, T4 standard spec) |

The orchestration skills delegate substantive work to agents shipped alongside them in `agents/` (87 shared agents) and per-skill `<skill>/agents/` (skill-internal agents). Discovery is automatic; no manual wiring needed.

### Process

| Skill | Use when |
|---|---|
| `erfana:grill-me` | Stress-testing a plan or design – walks the decision tree one question at a time, recommends an answer per branch, explores the codebase before asking when the answer is already encoded there. For skill-lifecycle requirements, `erfana:managing-skills` runs its own scoped interview – route general plan interrogation here, skill create/modify interviews there. |

### Verification

| Skill | Use when |
|---|---|
| `erfana:fact-checking` | Validating a markdown analysis document against source materials (interview transcripts, vendor docs, knowledge-base folders) before sharing with stakeholders – extracts atomic factual claims, traces each to its source passage, classifies findings by severity, and applies user-approved corrections. Manual-only via `/erfana:fact-checking <target-file>`; not auto-discovered. |

More skills will appear here as they ship. The list is canonical – if a skill is not listed, it is not part of this plugin.

## The 1% rule

If you think there is even a 1% chance one of these skills applies to what you are doing, **invoke the skill via the `Skill` tool before responding or acting.**

This is not negotiable. This is not optional.

| Rationalization | Reality |
|---|---|
| "This is just a quick issue, no skill needed." | The skill is calibrated for quick work too. Invoke it. |
| "I already know how to write a spec." | The skill enforces the plugin's conventions you may not remember. Invoke it. |
| "Let me explore the codebase first." | The skill tells you HOW to explore. Invoke it first. |
| "It's only a one-off." | One-offs become baselines. Invoke it. |

## Skill priority

When multiple instructions conflict, follow this order:

1. **User's explicit instructions** (CLAUDE.md, direct requests). Highest priority.
2. **This plugin's skills**. Override default Claude Code behavior where they conflict.
3. **Default system prompt and other plugins**. Lowest priority.

If the user explicitly says "do not use a skill," follow the user. The user is in control.

## Process-first ordering

When more than one sub-skill could apply, invoke **process skills before output skills**.

Orchestration skills are independent of each other – pick by domain. They internally enforce their own lifecycle phases (research → design → review → validate, etc.) by delegating to agents in `agents/` and `<skill>/agents/`. There is no top-level orchestration "process" skill – each skill owns its discipline.

When a request spans two domains (e.g. a spec and the issues that implement it), invoke the skills sequentially – the skill that locks the source material first, then the skill that consumes it.

## Red flags – stop and invoke the skill

These thoughts mean you should stop rationalizing and invoke the relevant skill:

| Thought | What to do |
|---|---|
| "This is just a simple question." | Questions are tasks. Invoke the matching sub-skill. |
| "I'll just draft this quickly." | The skill calibrates "quickly" too. Invoke it. |
| "I remember how this workflow goes." | Skills evolve. Invoke the current version. |
| "The skill is overkill for this." | If the user mentioned the domain, the skill applies. |
| "I'll just check the references first." | The skill tells you which references apply when. Invoke first. |

## Decision flow

```
User message arrives
    │
    ├─ Wants to stress-test a plan or be grilled on a design?
    │       └─ Yes → erfana:grill-me
    │
    ├─ Mentions an orchestration task (agents, articles, issues, reports, skills, specs)?
    │       ├─ Claude Code agent lifecycle? → erfana:managing-agents
    │       ├─ Medium-form article (research → publish)? → erfana:managing-articles
    │       ├─ GitHub issue (create / implement / review / display)? → erfana:managing-issues
    │       │     (Display sub-modes: "show issue #N", "list issues", "find issues with label X")
    │       │     (Implement runs autonomously but still needs a human at UAT + git confirm – refuses a headless session)
    │       ├─ Consulting report (Pyramid / SCQA)? → erfana:managing-reports
    │       ├─ Claude Code skill lifecycle? → erfana:managing-skills
    │       └─ Specification (T1-T4)? → erfana:managing-specs
    │
    ├─ Validating a markdown analysis document against sources?
    │       └─ Yes → erfana:fact-checking (manual invocation only)
    │
    ├─ User typed /erfana:<sub-skill> directly?
    │       └─ Yes → load that skill, execute
    │
    └─ None of the above → no skill in this plugin applies; proceed normally
```

Treat ambiguous matches by invoking the most specific sub-skill. The sub-skill itself can decline if it is the wrong fit and dispatch to a sibling.
