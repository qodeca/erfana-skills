# Focused Skill Template

For single-purpose skills that do one thing well: 60-200 lines, no orchestrator ceremony, references-heavy.

**When to use this template** vs `simple-skill-template.md` or `skill-md-template.md`:

- ✅ Single, well-defined output (one mockup, one report, one chart)
- ✅ The skill's body IS the workflow — no multi-phase orchestration
- ✅ User invokes it explicitly for that one outcome
- ✅ Heavy reference docs (`references/*.md`) to keep SKILL.md terse
- ✅ Optional: `disable-model-invocation: true` for user-invocation-only skills

**Use `skill-md-template.md` instead** if your skill orchestrates multiple agents through a multi-step workflow with input conditions and quality gates per step. Use this template when there are no agents, or when there is one agent that does everything.

**Reference**: `skills/grill-me/SKILL.md` (134 lines).

---

## Template

```markdown
---
name: your-skill-name
description: Use when [primary trigger]. [One sentence describing the output.]
when_to_use: |
  Trigger phrases: "[trigger 1]", "[trigger 2]", "[trigger 3]", "[trigger 4]", "[trigger 5]".
allowed-tools: Read, Write, Edit, Glob, Grep, [WebSearch / Bash / etc as needed]

# OPTIONAL: effort/model overrides (Claude 5 calibration)
# effort: medium          # focused skills usually run medium — they're scoped; omit to inherit session effort
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
| Progress tracking | Optional | Required (multi-phase) |
| References dir | Often heavy (`references/*.md`) | Optional |
| Quality gates | Implicit (the process is the gate) | Explicit per-step |
| Critical Rules block | Often omitted | Mandatory |

The focused template trades orchestrator ceremony for terseness. Both are valid; pick by skill shape.

---

## Claude 5 model patterns for focused skills

Most Section 12 patterns from `pre-release-checklist.md` apply, but a few are N/A:

| Section 12 item | Applicability for focused skills |
|-----------------|----------------------------------|
| 12.1 Description voice | REQUIRED |
| 12.2 Description triggers | REQUIRED — focused skills depend heavily on description for activation |
| 12.3 Verify scaffolding cleanup | REQUIRED — focused skills should NOT mandate verify-after-every-step |
| 12.4 Delegation calibration | N/A typically — focused skills are single-threaded |
| 12.5 Per-subagent overrides | N/A typically — focused skills have no agents table |
| 12.6 Find-vs-filter decoupled | REQUIRED if reviewer-shaped; N/A otherwise |
| 12.7 No deprecated APIs / reasoning-display | REQUIRED |

ms-validator's N/A handling means focused skills can score 4.5/4.5 (full applicable max) without artificial penalties for inapplicable patterns.

---

## Cache trade-off

Focused skills typically run 60-200 lines (~1,000-3,000 tokens), which is **below the 4,096-token cache floor** (`guides/claude-5-patterns.md` §10). The SKILL.md body itself does not cache; reference content (under `references/`) can if it exceeds the floor.

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

## Example: Completed focused skill (grill-me)

See `skills/grill-me/SKILL.md` for the canonical example. Notable choices:

- 134 lines total
- 12 quoted trigger phrases in `when_to_use`
- A narrow `allowed-tools` grant (`Read, Glob, Grep, AskUserQuestion`)
- The skill body IS the workflow: opening protocol → depth → coverage map → question loop → mandatory late rounds → exit gate
- A rationalization table naming the concrete ways the workflow gets cut short
- 1 reference doc (`references/question-stems.md`) carrying the reusable depth
- A Stop hook as the backstop – registered in the plugin-root `hooks/hooks.json`, not in SKILL.md `hooks:` frontmatter

This shape — terse SKILL.md + heavy `references/question-stems.md` (260 lines of reusable question stems) — is the focused-skill ideal.

**Where a skill's hook is registered.** Declare it in `hooks/hooks.json` at the plugin root, with the script under `hooks/`. Do **not** use SKILL.md `hooks:` frontmatter: Qwen Code's skill parser does not extract that field at all, so a guard declared there is dead on one of the two hosts erfana supports. The trade-off is that a plugin-root hook evaluates every stop rather than only the stops inside its own skill, so the hook has to scope itself – `grill-guard` keys on an open-marker sentinel the skill emits and does nothing when the marker is absent. Host differences are recorded in the repository's `docs/hosts.md`; the wiring rules (no `timeout` key, matchers naming both hosts' tool vocabulary, literal block messages) are enforced by Gate 14.
