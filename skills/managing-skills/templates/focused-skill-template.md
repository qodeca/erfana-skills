# Focused Skill Template

For single-purpose skills that do one thing well. Modeled after the `design-*` family in this plugin (each ~65-200 lines, no orchestrator ceremony, references-heavy).

**When to use this template** vs `simple-skill-template.md` or `skill-md-template.md`:

- ✅ Single, well-defined output (one mockup, one report, one chart)
- ✅ The skill's body IS the workflow — no multi-phase orchestration
- ✅ User invokes it explicitly for that one outcome
- ✅ Heavy reference docs (`references/*.md`) to keep SKILL.md terse
- ✅ Optional: `disable-model-invocation: true` for user-invocation-only skills

**Use `skill-md-template.md` instead** if your skill orchestrates multiple agents through a multi-step workflow with input conditions and quality gates per step. Use this template when there are no agents, or when there is one agent that does everything.

**Reference**: `skills/design-prototype/SKILL.md` (65 lines), `skills/design-review/SKILL.md` (64 lines).

---

## Template

```markdown
---
name: your-skill-name
description: Use when [primary trigger]. [One sentence describing the output.]
when_to_use: |
  Trigger phrases: "[trigger 1]", "[trigger 2]", "[trigger 3]", "[trigger 4]", "[trigger 5]".
allowed-tools: Read, Write, Edit, Glob, Grep, [WebSearch / Bash / etc as needed]

# OPTIONAL: Opus 4.7 effort/model overrides
# effort: high            # focused skills usually run high (not xhigh) — they're scoped
# model: sonnet           # opus only for complex creative work; sonnet handles most focused output

# OPTIONAL: user-invocation only
# disable-model-invocation: true   # set true for review/critique skills the user must explicitly invoke
---

# erfana:your-skill-name

You are a [role specialty]. Output is [exact deliverable shape — file format, key properties]. [One-sentence quality contract.]

## Core principle

[1-2 sentences: the single principle that should guide every output choice. Make it specific. Example: "Real images, real interactions, no AI-slop placeholders. Every iPhone wraps an `AppPhone` state manager. Every transition is a real CSS transition. Every screen is reachable from at least one click."]

## When this skill applies

- [Specific scenario 1]
- [Specific scenario 2]
- [Specific scenario 3]

Out of scope:
- [Adjacent task 1] → use `[other skill]`
- [Adjacent task 2] → use `[other skill]`

## Process

1. **[Step 1 with verification phrase]** — [one-line description with reference link if applicable].
2. **[Step 2]** — [description].
3. **[Step 3]** — [description].
4. **[Step 4]** — [description].
5. **[Final verification step]** — [description].

## Anti-patterns

- [Specific anti-pattern with concrete example]
- [Specific anti-pattern with concrete example]
- [Specific anti-pattern with concrete example]

## References

- `references/[name].md` — [one-line description of what's in there]
- `../design-shared/references/[name].md` — [shared resource description]

## Examples

- `[path to demo].html` — [what it shows]

## Terminal state

After delivering [output], if the user [follow-up trigger], dispatch to `[other skill]`. If they [other follow-up trigger], dispatch to `[other skill]`.
```

---

## Key differences from orchestrator templates

| Aspect | Focused (this template) | Orchestrator (`skill-md-template.md`) |
|--------|------------------------|----------------------------------------|
| Length | 60-200 lines | 200-500 lines |
| Sections | Process (5 steps) | Workflow with per-step Input Conditions, Pre/Post-Step Validation, Quality Gates |
| Agents | 0 or 1 | 3-10 |
| Todo list | Optional | Mandatory |
| References dir | Often heavy (`references/*.md`) | Optional |
| Quality gates | Implicit (the process is the gate) | Explicit per-step |
| Critical Rules block | Often omitted | Mandatory |

The focused template trades orchestrator ceremony for terseness. Both are valid; pick by skill shape.

---

## Opus 4.7 patterns for focused skills

Most Section 12 patterns from `pre-release-checklist.md` apply, but a few are N/A:

| Section 12 item | Applicability for focused skills |
|-----------------|----------------------------------|
| 12.1 Description voice | REQUIRED |
| 12.2 Description triggers | REQUIRED — focused skills depend heavily on description for activation |
| 12.3 Verify scaffolding cleanup | REQUIRED — focused skills should NOT mandate verify-after-every-step |
| 12.4 Explicit fan-out | N/A typically — focused skills are single-threaded |
| 12.5 Per-subagent overrides | N/A typically — focused skills have no agents table |
| 12.6 Find-vs-filter decoupled | REQUIRED if reviewer-shaped (e.g. `design-review`); N/A otherwise |
| 12.7 No deprecated APIs | REQUIRED |

ms-validator's N/A handling means focused skills can score 4.5/4.5 (full applicable max) without artificial penalties for inapplicable patterns.

---

## Cache trade-off

Focused skills typically run 60-200 lines (~1,000-3,000 tokens), which is **below the 4,096-token cache floor** (`guides/opus-4-7-patterns.md` §11). The SKILL.md body itself does not cache; reference content (under `references/`) can if it exceeds the floor.

**Acceptable for artifact-driven skills** — output is the value, not the prompt template. No action needed.

**Flag as design choice, not oversight.** When reviewing focused skills, ms-reviewer should not penalize sub-floor token counts. If the skill is invoked >5x within an hour, consider extending references/ to amortize the per-call cost via cache reads (0.1x base).

---

## Quick reference

| Aspect | Value |
|--------|-------|
| Lines | 60-200 |
| Frontmatter | name, description, when_to_use, allowed-tools (effort/model optional) |
| Sections | Core principle, When applies, Process (5 steps), Anti-patterns, References, Examples, Terminal state |
| Agents | 0 (most common) or 1 |
| Quality gate model | Process step 5 is the gate (verification step) |

---

## Example: Completed focused skill (design-review)

See `skills/design-review/SKILL.md` for the canonical example. Notable choices:

- 64 lines total
- `disable-model-invocation: true` (user-invoked only)
- 8 quoted trigger phrases in `when_to_use`
- 5-step Process: score 5 dimensions → total → output structure → ensure specifics → checklist sweep
- Anti-patterns section with 4 concrete bad patterns
- 4 reference doc links
- 1 example demo link

This shape — terse SKILL.md + heavy `references/critique-guide.md` (199 lines of detailed scoring rubrics) — is the focused-skill ideal.
