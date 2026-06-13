# Simple Skill Template

For focused skills with 2-3 steps. Even simple skills MUST follow orchestrator architecture.

---

```markdown
---
name: your-skill-name
description: |
  [What this skill does - be specific].
  Use when [specific triggers and scenarios].
---

# [Skill Name]

## Critical Rules

This skill follows orchestrator architecture:
- Delegates ALL tasks to agents (builtin or shared)
- EVERY step has input conditions (BLOCKING)
- Validates post-step on irreversible work only (file writes, breaking changes)
- Quality gates apply to irreversible steps (max 3 retries)
- Todo lists ALWAYS required
- MUST NOT use `temperature` / `top_p` / `top_k` / fixed `budget_tokens` (Opus 4.7 returns 400)

## Requirements Gathering

If user request is unclear, gather requirements FIRST using questionnaires with recommended options. See `templates/questionnaire-template.md` for format.

## Agents

Optional Effort and Model columns — include when overrides apply, omit if all inherit defaults.

| Agent | Purpose | Source | Effort | Model | Used In |
|-------|---------|--------|--------|-------|---------|
| `[agent-name]` | [Single responsibility] | builtin/shared | medium | sonnet | Step 1 |

## Todo List Requirements

ALWAYS at start: Create todo list, mark first step in_progress.
Update IMMEDIATELY after each step.

---

## When This Skill Applies

Activate when user:
- [Trigger 1]
- [Trigger 2]

---

## Workflow

### Step 1: [Action]

#### Input Conditions
- [ ] [Condition] - REQUIRED

#### Pre-Step Validation
STOP if ANY condition unchecked.

#### Execution
Delegate to: `[agent-name]` (shared: agents/[agent-name].md)

#### Post-Step Validation
- [ ] [Criterion]

#### Quality Gate
If fails: retry (max 3) or escalate.

---

### Step 2: [Action]

#### Input Conditions
- [ ] Step 1 completed

#### Execution
Delegate to: `[agent-name]` (shared: agents/[agent-name].md)

#### Post-Step Validation
- [ ] [Criterion]

#### Quality Gate
If fails: retry (max 3) or escalate.

---

## Examples

### Example 1: [Scenario]

**User says:** "[Request]"

**Skill does:**
1. Creates todo
2. Step 1 → Agent
3. Validates

**Output:**
```
[Result]
```

## Anti-Patterns

- ❌ Putting agents in skill directories (use builtin or shared)
- ❌ Missing input conditions
- ❌ No post-step validation
- ❌ Executing directly without agent delegation
- ❌ Missing Source column in agents table
```

---

## When to Use This Template

Use for skills that:
- Have 2-3 focused steps
- Require 1-2 agents
- Have straightforward workflow
- Total content under 200 lines

**Note:** Even simple skills MUST:
- Use agents from builtin or shared sources only
- Include input conditions per step
- Include post-step validation
- Use quality gates
- Create todo lists
- Include Source column in agents table

## Example: Completed Simple Skill

```markdown
---
name: formatting-json
description: Format JSON files with consistent indentation. Use when user asks to format, pretty print, or clean up JSON.
---

# Formatting JSON

## Critical Rules

This skill follows orchestrator architecture:
- Delegates to `format-json` (shared agent)
- Input conditions verified before each step
- Post-step validation required
- Quality gate with max 3 retries

## Agents

| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| `format-json` | Format JSON with consistent indentation | shared | Step 1, 2 |

## Todo List Requirements

ALWAYS create todo list at start. Update after each step.

---

## When This Skill Applies

Activate when user:
- Asks to "format JSON" or "pretty print"
- Wants to "clean up" JSON files
- Mentions JSON formatting

---

## Workflow

### Step 1: Validate Input

#### Input Conditions
- [ ] JSON content or file path provided
- [ ] Content is parseable as JSON

#### Pre-Step Validation
STOP if not valid JSON. Report parse error.

#### Execution
Delegate to: `format-json` (shared: agents/format-json.md)
Task: Validate JSON syntax

#### Post-Step Validation
- [ ] Valid JSON confirmed
- [ ] Parse errors reported if invalid

#### Quality Gate
If invalid JSON: report error, STOP.

---

### Step 2: Format Output

#### Input Conditions
- [ ] Step 1 passed (valid JSON)

#### Execution
Delegate to: `format-json` (shared: agents/format-json.md)
Task: Format with 2-space indent

#### Post-Step Validation
- [ ] Output is valid JSON
- [ ] Indentation consistent

#### Quality Gate
If fails: retry (max 3) or escalate.

---

## Examples

### Example 1: Format Inline JSON

**User says:** "Format this: {"a":1,"b":2}"

**Skill does:**
1. Creates todo [Step 1, Step 2]
2. Validates JSON syntax
3. Formats with indentation

**Output:**
```json
{
  "a": 1,
  "b": 2
}
```

## Anti-Patterns

- ❌ Putting agents in skill directories (use shared: agents/)
- ❌ Formatting without validation
- ❌ No quality gate on output
- ❌ Missing todo tracking
- ❌ Missing Source column in agents table
```
