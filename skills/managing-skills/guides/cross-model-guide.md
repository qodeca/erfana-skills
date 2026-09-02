# Cross-Model Testing Guide

Skills should work across different Claude models. This guide explains the differences and how to design for compatibility.

**Scope.** "Cross-model" here means across Claude tiers - Haiku, Sonnet, Opus, Fable. It is not a cross-vendor guide. erfana also runs on Qwen Code, where the model behind the host is not an Anthropic one, and three rules below do not transfer: see "Non-Anthropic hosts" at the end of this file and [`../../../docs/hosts.md`](../../../docs/hosts.md).

**Last revised:** 2026-08-02 (v6.3.0 — Claude 5 family added; model table and effort guidance recalibrated. See `claude-5-patterns.md` for the full Claude 5 authoring pattern set.)

---

## Model Capabilities Overview

| Model | Model ID | Strengths | Considerations |
|-------|----------|-----------|----------------|
| **Haiku 4.5** | `claude-haiku-4-5-20251001` | Fast, economical | Needs explicit instructions, simpler reasoning |
| **Sonnet 5** | `claude-sonnet-5` | Balanced speed/capability | Good default for validators, researchers, format-appliers |
| **Opus 4.8** | `claude-opus-4-8` | Previous Opus generation, still Active (retirement not sooner than 2027-05-28) | Configured-fallback target for Claude 5 refusals (`claude-5-patterns.md` §3) |
| **Opus 5** | `claude-opus-5` | Current Opus; strong self-verification, first-shot correctness | **Primary target**; same pricing as Opus 4.8; runs the Claude 5 safety classifiers |
| **Fable 5** | `claude-fable-5` | Mythos-class tier above Opus; long-horizon autonomy | Session-level only — **never pin in frontmatter**; runs the Claude 5 safety classifiers (see reasoning-display hazard, `claude-5-patterns.md` §3) |

> **Note:** frontmatter `model:` aliases (`opus`, `sonnet`, `haiku`, or `inherit`) are Claude Code short names that resolve to the current generation automatically — prefer them over exact IDs. API model IDs are different: from the 4.6 generation on, a dateless ID is a pinned snapshot, not an evergreen pointer. `claude-3-*` models are Retired (no longer callable); `claude-opus-4-0`, `claude-sonnet-4-0`, `claude-opus-4-20250514`, `claude-sonnet-4-20250514` were retired 2026-06-15. Exact IDs above are for API-level work and docs.

---

## Design for the smallest model you pin

**The rule has two directions on Claude 5:**

- **Downward (haiku/sonnet-pinned subagents):** explicit numbered steps, concrete examples, and output format templates still pay. If a validator runs on Haiku, write for Haiku.
- **Upward (opus-tier and the session model):** the same explicitness becomes over-constraint. Claude 5 models follow prescriptive scaffolding literally — including steps wrong for the situation — and degrade when every behavior is enumerated. Give goal, rationale, boundaries, and a verification hook; skip the recipe. (See `claude-5-patterns.md` §6.)

Practical test: for each instruction block, ask *which agent reads this?* Haiku-pinned → keep it explicit. Opus-tier → apply the litmus test "would a strong model behave worse without this line?"

---

## Model-Specific Guidance

### Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)

**Characteristics:**
- Fastest response time, most economical
- Best for straightforward tasks (classification, routing, formatting)
- May struggle with ambiguous instructions

**Skill Design Tips:**
- Be explicit about each step; use numbered steps instead of prose
- Avoid complex conditional logic
- Provide concrete examples and exact output format

**Example - Too Vague for Haiku:**
```markdown
Process the document appropriately based on its type.
```

**Example - Haiku-Friendly:**
```markdown
1. Check file extension
2. If .pdf → use pdftotext
3. If .docx → use python-docx
4. If .xlsx → use openpyxl
5. If unknown → report "Unsupported format: [extension]"
```

### Claude Sonnet 5 (`claude-sonnet-5`)

**Characteristics:**
- Balanced speed and capability; handles moderate complexity and some ambiguity
- The plugin's default pin for validators, researchers, and format-appliers

**Skill Design Tips:**
- Benefits from examples but doesn't require many
- Can follow more complex workflows without per-step hand-holding

**Sonnet is the "goldilocks" model** – if your skill works well with Sonnet, you're in good shape.

### Claude 5 Opus tier (`claude-opus-5`; Fable 5 at session level)

**Characteristics:**
- Strong self-verification: builds its own checks, catches faults during planning — verification *mandates* cause over-verification
- **Literal instruction following** — does not silently generalize, and follows scaffolding exactly even when it's wrong for the situation
- Delegates to subagents readily by default (the 4.7-era "explicit fan-out required" rule is inverted — see `claude-5-patterns.md` §5)
- Both run the Claude 5 safety classifiers (`reasoning_extraction` among them) — no reasoning-display instructions, ever; a trip returns `stop_reason: "refusal"` and re-routes to Opus 4.8 where fallback is configured. Fable 5 additionally: thinking always on (cannot be disabled).

**Breaking API changes** (Messages API; Claude Code abstracts these):
- Fixed `thinking: {type: "enabled", budget_tokens: N}` → unsupported on Claude 5 models (Fable 5 / Opus 5 / Sonnet 5); Haiku 4.5 still supports it. Claude 5 is adaptive-thinking only.
- `temperature`, `top_p`, `top_k` non-default → **400 error** on Claude Opus 4.7 and later. Omit entirely.
- Fable 5: `thinking: {type: "disabled"}` not supported; use `effort: low` to reduce thinking depth.

**Effort scale**: `low → medium → high → xhigh → max`
- Claude 5 at `low`/`medium` often matches or exceeds prior-generation `xhigh`
- `high` for orchestrators, reviewers, ambiguous investigation
- `medium` for routine file creation, refactoring, research
- `low` for validators and scoped one-shot jobs
- `xhigh`/`max` reserved for genuinely frontier problems — can over-plan and refactor unrequested; pair with scope fences

**Skill Design Tips:**
- Prefer **positive examples** ("open with the decision") over pure prohibitions
- **List concrete triggers** rather than rely on implicit generalization — Claude 5 follows literally
- State intent ("because...") — it measurably improves edge-case micro-decisions
- Never instruct reasoning display; request evidence in structured output instead

**Migration guidance**: see the [Anthropic Fable 5 prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5) and `claude-5-patterns.md` §9 for the local checklist.

### When to target Opus specifically

- Skills requiring complex judgment or nuanced reasoning
- Agents performing multi-file refactoring or architectural analysis
- Tasks where output quality justifies higher cost
- Workflows needing large context windows (many reference files)

---

## Testing Strategy

### Level 1: Mental Simulation

Ask yourself for each instruction:
- "Which model reads this — and is it explicit enough for the smallest one pinned here?"
- "Is there any ambiguity?"
- "Would the strongest model behave worse without this line?"

### Level 2: Explicit Test Cases

Create test scenarios:

```markdown
## Test Scenarios

### Scenario 1: Basic Usage
Input: [typical user request]
Expected: [what should happen]

### Scenario 2: Edge Case
Input: [unusual request]
Expected: [appropriate handling]

### Scenario 3: Error Case
Input: [invalid request]
Expected: [graceful error handling]
```

### Level 3: Actual Testing

If possible, test with different models:
1. Run the skill with Haiku
2. Run the same task with Sonnet
3. Compare results
4. Adjust instructions if discrepancies found

---

## Common Cross-Model Issues

### Issue: Works on Opus, Fails on Haiku

**Symptom:** Skill produces good results with Opus but poor/wrong results with Haiku.

**Cause:** Instructions rely on inference rather than explicit guidance.

**Fix:** Add explicit steps, examples, and output format specifications *to the haiku-pinned agent's prompt* — not to the whole skill.

### Issue: Works on Sonnet, degrades on Opus 5 / Fable 5

**Symptom:** The strongest model over-verifies, over-plans, or follows a step that is wrong for the situation.

**Cause:** Prescriptive scaffolding written for weaker models — Claude 5 executes it literally.

**Fix:** Apply the `claude-5-patterns.md` §6 diet: keep goal, boundaries, and verification hooks; cut the recipe.

### Issue: Inconsistent Output Format

**Symptom:** Different models produce differently formatted output.

**Cause:** Output format not explicitly specified.

**Fix:** Add explicit output format template:
```markdown
## Output Format

Always respond with:
```
Status: [PASS/FAIL]
Result: [one-line summary]
Details: [if needed]
```
```

### Issue: Skipped Steps

**Symptom:** Some models skip steps in the workflow.

**Cause:** Steps not clearly numbered or dependencies not stated.

**Fix:** Use explicit numbering and checkpoints:
```markdown
### Step 1: Validate Input
[instructions]
✓ Must complete before Step 2

### Step 2: Process
[instructions]
```

---

## Quick Reference

| If Your Skill... | Add This |
|------------------|----------|
| Pins haiku/sonnet subagents | Explicit numbered steps + examples in those agents |
| Requires judgment | Intent ("because...") clauses, not more rules |
| Produces output | Output format template |
| Has multiple paths | Clear decision tree |
| Can fail | Explicit error handling |
| Runs on the session model | The §6 litmus test — cut lines a strong model doesn't need |

---

## Summary

1. **Write explicitness where the small models read it** — haiku/sonnet-pinned agent prompts
2. **Test with Sonnet** — your baseline for "good enough"
3. **Verify on Opus 5** — ensure the skill doesn't over-constrain a strong model
4. **When in doubt** — explicit guidance for pinned small models; goal + boundaries for the rest

---

## Non-Anthropic hosts

erfana runs on Qwen Code as well as Claude Code, so a skill authored here may
execute against a model this guide never mentions. Three rules stated elsewhere
as authoring law are constraints of the Anthropic target, not properties of
language models, and they do not transfer.

| Rule | Where it comes from | Off Anthropic |
|---|---|---|
| No `temperature` / `top_p` / `top_k` | A 400 error on Claude Opus 4.7 and later | The opposite advice. Qwen's own model card prescribes `temperature=1.0, top_p=0.95, top_k=20`. |
| No fixed `thinking: {budget_tokens: N}` | Unsupported on the Claude 5 family | A schema constraint of one API, meaningless elsewhere. |
| Never ask a model to surface its reasoning | The `reasoning_extraction` refusal classifier on Fable 5 and Opus 5 | No such classifier. DeepSeek returns reasoning as a first-class `reasoning_content` field; Qwen emits `<think>` blocks by default. |

All three stay binding for anything this plugin ships, because what it ships
runs on Anthropic models too. Keep them; just do not present them to a skill
author as universal truths, and do not carry them into advice about another
model family.

Two more differences worth knowing when a skill lands on a second host:

- **`effort` does not survive.** Qwen's converter re-serialises agent
  frontmatter from a fixed allowlist and drops `effort` along with
  `capabilities`. Design so that losing the effort hint degrades the agent
  rather than breaking it.
- **`model: opus` does not resolve.** The value reaches Qwen verbatim, where a
  silent fallback to the host default is indistinguishable from resolution. Do
  not build a skill whose correctness depends on a specific pinned tier.

Host differences in full: [`../../../docs/hosts.md`](../../../docs/hosts.md).
