# Cross-Model Testing Guide

Skills should work across different Claude models. This guide explains the differences and how to design for compatibility.

---

## Model Capabilities Overview

| Model | Model ID | Strengths | Considerations |
|-------|----------|-----------|----------------|
| **Haiku 4.5** | `claude-haiku-4-5-20251001` | Fast, economical | Needs explicit instructions, simpler reasoning |
| **Sonnet 4.6** | `claude-sonnet-4-6` | Balanced speed/capability | Good default target |
| **Opus 4.6** | `claude-opus-4-6` | Advanced reasoning, agentic coding | Legacy; used by `/fast` |
| **Opus 4.7** | `claude-opus-4-7` | Most capable; calibrates verbosity; literal instruction following; adaptive thinking only (no `budget_tokens`); 1:1 image coords; new tokenizer (1.0–1.35× tokens) | **Primary target**; Claude Code defaults to `xhigh` effort |

> **Note:** Always use the exact model IDs above in frontmatter `model` fields. Legacy IDs (e.g., `claude-3-*`, `claude-opus-4-0`) are deprecated. Opus 4.6 remains supported (used by `/fast`); Opus 4.7 is the primary target.

---

## The "Haiku First" Strategy

**Recommended approach:** Design and test your skill with Haiku in mind first.

**Why?**
- If it works with Haiku, it will definitely work with Sonnet and Opus
- Forces you to write clear, explicit instructions
- Prevents over-reliance on complex reasoning

**How?**
1. Write your skill
2. Mentally simulate: "Would Haiku understand this?"
3. If uncertain, add more explicit guidance
4. Test with actual Haiku if available

---

## Model-Specific Guidance

### Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)

**Characteristics:**
- Fastest response time
- Most economical
- Best for straightforward tasks
- May struggle with ambiguous instructions

**Skill Design Tips:**
- Be explicit about each step
- Avoid complex conditional logic
- Use numbered steps instead of prose
- Provide concrete examples
- Specify exactly what output format to use

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

### Claude Sonnet 4.6 (`claude-sonnet-4-6`)

**Characteristics:**
- Balanced speed and capability
- Good for most tasks
- Handles moderate complexity well
- Default choice for many use cases

**Skill Design Tips:**
- Your default target
- Can handle some ambiguity
- Benefits from examples but doesn't require as many
- Can follow more complex workflows

**Sonnet is the "goldilocks" model** – if your skill works well with Sonnet, you're in good shape.

### Claude Opus 4.7 (`claude-opus-4-7`)

**Characteristics:**
- Most capable generally available model; primary target
- Calibrates response length to task complexity by default
- **More literal instruction following**, especially at low/medium effort – does not silently generalize
- Fewer tool calls and fewer subagents spawned by default (raise `effort` to increase)
- More direct tone; less validation-forward phrasing; fewer emoji than 4.6
- Built-in progress updates during long agentic traces – no scaffolding required

**Breaking API changes vs 4.6** (Messages API only; Claude Code abstracts these):
- `thinking: {type: "enabled", budget_tokens: N}` → **400 error**. Adaptive thinking only.
- Adaptive thinking is **off by default** – set `thinking: {type: "adaptive"}` explicitly.
- `temperature`, `top_p`, `top_k` non-default → **400 error**. Omit entirely.
- Thinking content `omitted` by default (was `summarized`); opt in via `thinking.display: "summarized"`.
- Assistant prefill returns 400 (carried from 4.6).

**Effort scale (4.7)**: `low → medium → high → xhigh → max`
- Default for Claude Code v2.1.111+: `xhigh` (recommended for most coding/agentic use)
- `high` for cost-sensitive intelligence-bound work
- `medium` for short lookups
- `max` reserved for hardest problems – prone to overthinking

**Skill Design Tips:**
- Prefer **positive examples** ("open with the decision") over pure prohibitions
- **List concrete triggers** rather than rely on implicit generalization – 4.7 follows literally
- Remove scaffolding for interim progress updates – 4.7 surfaces them automatically
- Explicitly request parallelism when fanning across independent items

**Migration guidance**: see [Anthropic Opus 4.7 migration guide](https://platform.claude.com/docs/en/about-claude/models/migration-guide#migrating-to-claude-opus-4-7) for the canonical checklist.

### When to target Opus specifically

- Skills requiring complex judgment or nuanced reasoning
- Agents performing multi-file refactoring or architectural analysis
- Tasks where output quality justifies higher cost
- Workflows needing large context windows (many reference files)

---

## Testing Strategy

### Level 1: Mental Simulation

Ask yourself for each instruction:
- "Would Haiku know what to do here?"
- "Is there any ambiguity?"
- "Are the steps explicit enough?"

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

**Fix:** Add more explicit steps, examples, and output format specifications.

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
| Has complex logic | Explicit numbered steps |
| Requires judgment | Concrete examples |
| Produces output | Output format template |
| Has multiple paths | Clear decision tree |
| Can fail | Explicit error handling |

---

## Summary

1. **Design for Haiku** - Explicit, step-by-step instructions
2. **Test with Sonnet** - Your baseline for "good enough"
3. **Verify with Opus** - Ensure it doesn't over-complicate
4. **When in doubt** - Add more examples and explicit guidance
