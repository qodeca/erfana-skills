# Example 1: Simple Skill - `formatting-json`

A minimal skill showing ALL required architectural patterns.

## Final Structure

```
formatting-json/
├── SKILL.md
└── templates/           # Optional: for output formatting
    └── (none needed for this simple skill)
```

**Note:** Skills do NOT contain `agents/` directories. All agents come from:
- **builtin:** Claude Code agents (Explore, Plan, etc.)
- **shared:** User agents at `agents/`

For this skill, we use a shared agent: `agents/format-json.md`

## SKILL.md Content

```markdown
---
name: formatting-json
description: Format JSON files with consistent indentation. Validates syntax and applies standard formatting. Use when user asks to format, pretty print, or clean up JSON.
---

# Formatting JSON

## Critical Rules

This skill follows orchestrator architecture:
- Delegates ALL tasks to `format-json` (shared agent)
- EVERY step has input conditions (BLOCKING)
- EVERY step has post-step validation
- Quality gates MUST pass (max 3 retries)
- Todo lists ALWAYS required

## Agents

| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| `format-json` | Validate and format JSON content | shared | Step 1, 2 |

## Todo List Requirements

**MANDATORY - No exceptions**

At start: Create todo list with all steps, mark Step 1 in_progress.
After each step: Mark complete IMMEDIATELY after quality gate passes.

---

## When This Skill Applies

Activate when user:
- Asks to "format JSON" or "pretty print"
- Wants to "clean up" or "beautify" JSON
- Mentions JSON formatting

---

## Workflow

### Step 1: Validate Input

#### Input Conditions
- [ ] JSON content or file path provided
- [ ] Content received (not empty)

#### Pre-Step Validation
STOP if ANY condition unchecked. Ask user for missing input.

#### Execution
Delegate to: `format-json` (shared: agents/format-json.md)
Task: Validate JSON syntax

#### Post-Step Validation
- [ ] Valid JSON confirmed OR parse error identified
- [ ] Error location reported if invalid

#### Quality Gate
If invalid JSON: report error with line/position, STOP workflow.
No retry - user must provide valid JSON.

---

### Step 2: Format Output

#### Input Conditions
- [ ] Step 1 completed (valid JSON)
- [ ] Indentation preference known (default: 2 spaces)

#### Pre-Step Validation
STOP if Step 1 not completed. Return to Step 1.

#### Execution
Delegate to: `format-json` (shared: agents/format-json.md)
Task: Format with specified indentation

#### Post-Step Validation
- [ ] Output is valid JSON
- [ ] Indentation consistent throughout
- [ ] No data lost (keys/values preserved)

#### Quality Gate
If fails: retry (max 3) with corrections.
After 3 failures: escalate to user.
User may override with documented justification.

---

## Examples

### Example: Format Inline JSON

**User says:** "Format this: {"a":1,"b":2}"

**Skill does:**
1. Creates todo [Step 1: Validate, Step 2: Format]
2. Marks Step 1 in_progress
3. Delegates validation to format-json agent
4. Validates: JSON syntax OK
5. Marks Step 1 complete, Step 2 in_progress
6. Delegates formatting to format-json agent
7. Validates: Output correct
8. Marks Step 2 complete

**Output:**
```json
{
  "a": 1,
  "b": 2
}
```

---

## Anti-Patterns

### Architectural (CRITICAL)
- Referencing other skills
- Using agents from unknown sources (not builtin/shared)
- Putting agents inside skill directories (`skill-name/agents/`)
- Executing directly without agent delegation
- Skipping input condition checks
- No post-step validation
- Missing quality gates
- No todo list tracking
- Missing Source column in agents table

### Workflow
- Formatting without syntax validation
- No error reporting for invalid JSON
```

---

## Shared Agent: format-json.md

**Location:** `agents/format-json.md`

This agent must be created as a shared agent, not inside the skill directory.

```markdown
---
name: format-json
description: MUST BE USED to validate and format JSON content. Use PROACTIVELY when JSON formatting is needed.
tools: Read, Write
model: haiku
capabilities: [validation, formatting, json-processing]
---

<context>
JSON formatter specialized in syntax validation and pretty-printing.
Tools: Read, Write.
Mission: Validate JSON syntax and format with consistent indentation.
</context>

<task>
Validate JSON syntax and format with specified indentation.
</task>

<input_contract>
| Input | Type | Required | Validation |
|-------|------|----------|------------|
| content | string | Yes | Non-empty JSON string or file path |
| indent | number | No | Default: 2, range: 1-8 |
| task_type | string | Yes | One of: "validate", "format" |

⛔ STOP if validation fails.
</input_contract>

<workflow>
1. Receive input
   Parse task_type to determine operation

2. For validation task:
   Attempt to parse JSON
   If parse fails: extract error position
   Return validity status

3. For format task:
   Parse JSON (already validated)
   Stringify with specified indent
   Return formatted output
</workflow>

<constraints>
NEVER:
- Modify JSON data values: only format structure
- Return malformed JSON: always validate output

ALWAYS:
- Report specific line/column for parse errors
- Preserve all original data
</constraints>

<output>
{
  "status": "success" | "error",
  "valid": boolean,
  "formatted": string | null,
  "error": {
    "line": number,
    "column": number,
    "message": string
  } | null
}
</output>

<quality_gate>
Before returning, ALL must be true:
- [ ] Output is parseable JSON (if formatting)
- [ ] Indentation is consistent throughout
- [ ] No data lost from input

On failure: Return error with details.
</quality_gate>
```

---

## Key Takeaways

1. **No local agents:** Skills don't have `agents/` directories
2. **Source column required:** Always specify builtin or shared
3. **Shared agent path:** Reference as `agents/agent-name.md`
4. **Delegation format:** `Delegate to: agent-name (shared: agents/agent-name.md)`
