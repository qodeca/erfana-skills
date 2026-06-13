# SKILL.md Template

Copy and adapt this template when creating a new skill.

---

```markdown
---
# REQUIRED: Skill identifier
# Format: lowercase, hyphens only, gerund form (verb+-ing)
# Max: 64 characters
name: your-skill-name

# REQUIRED: Discovery description
# Max: 1024 characters
# Voice: Third person (NOT "I can help you...")
# Content: What it does + when to use it
description: |
  [What this skill does - be specific].
  Use when [specific triggers and scenarios].

# OPTIONAL: CC 2.1 frontmatter fields
# context: fork          # Execution context: fork (isolated) or shared (default)
# allowed-tools: Read, Grep, Glob  # Restrict available tools
# user-invocable: true    # Show as slash command (default: true)
# argument-hint: <file>   # Hint text for slash command arguments
# disable-model-invocation: false  # Prevent auto-triggering; slash only

# OPTIONAL: Opus 4.7 effort level (per https://platform.claude.com/docs/en/build-with-claude/effort)
# effort: xhigh           # Recommended for orchestrator skills (default for Claude Code)
# effort: high            # Cost-balanced for substantive workflows
# effort: medium          # Cost-sensitive routine work
# effort: low             # Scoped one-shot subagents

# OPTIONAL: Model override
# model: opus             # Recommended for orchestrators emitting fragile output
# model: sonnet           # Recommended for routine validators, scoped agents
# model: haiku            # Recommended for high-volume classification
---

# [Skill Name]

## Critical Rules

This skill follows orchestrator architecture:
- Delegates ALL tasks to agents (builtin or shared)
- EVERY step has input conditions (BLOCKING)
- Validates where it matters — after irreversible work (file writes, agent file creation, breaking changes), not after exploratory steps. Opus 4.7 self-verifies; over-validating wastes tokens.
- Quality gates apply on irreversible steps (max 3 retries, then escalate)
- Todo lists ALWAYS created and maintained
- MUST NOT reference other skills or external agents
- MUST NOT use `temperature` / `top_p` / `top_k` / fixed `budget_tokens` (Opus 4.7 returns 400 error)

## Requirements Gathering

If user request is unclear or missing key information, gather requirements FIRST:
- Present questionnaires with 2-4 options per question
- ALWAYS include a recommended option (marked with **✓**)
- Include rationale for recommendations
- NO skipping - all questions require explicit answers

See `guides/requirements-gathering.md` and `templates/questionnaire-template.md`.

## Agents

When per-subagent overrides apply, include Effort and Model columns. Drop them when all agents inherit defaults (note that explicitly).

| Agent | Purpose | Source | Effort | Model | Used In |
|-------|---------|--------|--------|-------|---------|
| `[agent-1]` | [Single responsibility] | builtin/shared | xhigh | opus | Step 1 |
| `[agent-2]` | [Single responsibility] | builtin/shared | medium | sonnet | Step 2 |

**Effort/Model selection** (per `templates/shared-agent-template.md` Model Selection Guide):
- Orchestrator/file-creator/refactorer/reviewer roles → `opus`, `xhigh`
- Validator/researcher → `sonnet`, `medium` or `high`
- Format-applier/classifier → `sonnet`/`haiku`, `low`

## Todo List Requirements

ALWAYS at workflow start:
1. Create todo list with ALL steps
2. Mark first step as in_progress

Update todo IMMEDIATELY after each step.

---

## Multi-operation skills (argument-hint pattern)

For skills that dispatch across N verb-style operations (e.g., create / review / modify / modernize), use the `argument-hint` + operation-table pattern:

```yaml
argument-hint: "<operation> [target]"
```

Then list operations in an Operations table:

| Operation | Trigger phrase | Workflow |
|-----------|----------------|----------|
| `create` | "create skill" | Steps 0→5 |
| `review` | "review skill" | Single-step delegation |
| `modify` | "modify skill" | Backup + apply + validate |

**Reference:** Anthropic's canonical example at https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices uses `migrate-component $0 from $1 to $2`. In-plugin example: `skills/managing-specs/SKILL.md` (11 operations).

**Argument substitution:** Use `$ARGUMENTS[0]` for the operation verb, `$ARGUMENTS[1]+` for targets. Each operation has its own todo-list checklist.

---

## When This Skill Applies

Activate when user:
- [Trigger 1 - specific action or keyword]
- [Trigger 2]
- [Trigger 3]

---

## Workflow

### Step 1: [Action Name]

#### Input Conditions
- [ ] [Condition 1] - REQUIRED
- [ ] [Condition 2] - REQUIRED

#### Pre-Step Validation
STOP if ANY condition unchecked. Report missing conditions.

#### Execution
Delegate to: `[agent-name]` (shared: agents/[agent-name].md)
Task: [Specific task description]

#### Post-Step Validation
- [ ] [Validation criterion 1]
- [ ] [Validation criterion 2]

#### Quality Gate
If ANY validation fails:
1. Retry (max 3 attempts)
2. After 3 failures, escalate to user
3. User may override with documented justification

---

### Step 2: [Action Name]

#### Input Conditions
- [ ] Step 1 completed successfully
- [ ] [Additional condition]

#### Pre-Step Validation
STOP if ANY condition unchecked.

#### Execution
Delegate to: `[agent-name]` (shared: agents/[agent-name].md)
Task: [Specific task description]

#### Post-Step Validation
- [ ] [Validation criterion 1]
- [ ] [Validation criterion 2]

#### Quality Gate
If ANY validation fails: retry (max 3) or escalate.

---

### Step 3: [Action Name]

[Follow same structure as above]

---

## Optional patterns (insert when applicable)

### Parallel fan-out (when applicable)

When a step processes independent items, **spawn parallel subagents — one per item — in the same turn**, not sequentially. Opus 4.7 defaults to sequential delegation; explicit fan-out language is required.

Example wording for the workflow step:

> **Step 1.5 fan-out:** ms-agent-discoverer and ms-agent-matcher run in parallel — orchestrator spawns both as concurrent Task calls in the same turn, then waits on both. They have no inter-dependencies.

### Find before filter (reviewer skills only)

If this skill is reviewer-shaped (audits, validates, scores existing artifacts):

1. **Enumerate all findings first** — every issue, every severity, every category. Do not apply severity filters at find-time.
2. **Filter into pass/warn/fail buckets in a second pass** using documented thresholds.

Why: community-observed pattern — Opus 4.7 follows "report only critical issues" instructions literally and may silently drop mid-severity findings if filtered at discovery. Decoupling preserves the long tail.

**Additive curation is OK** ("Quick Wins: top 3" presented alongside the full Fix list). **Exclusionary filtering is the anti-pattern** ("Output: only critical issues").

---

## Examples

### Example 1: [Scenario Name]

**User says:** "[Typical user request]"

**Skill does:**
1. Creates todo list
2. Step 1 → Agent A
3. Step 2 → Agent B
4. Validates outputs

**Output:**
```
[What the user receives]
```

### Example 2: [Different Scenario]

**User says:** "[Different request]"

**Skill does:**
1. [Step summary]
2. [Step summary]

**Output:**
```
[Result]
```

---

## Anti-Patterns

### Architectural (CRITICAL)
- ❌ Referencing other skills
- ❌ Using external agents
- ❌ Executing directly instead of delegating
- ❌ Skipping input condition validation on irreversible steps
- ❌ No quality gates on irreversible steps

### Opus 4.7 (CRITICAL)
- ❌ Using `temperature` / `top_p` / `top_k` (returns 400 error on Opus 4.7)
- ❌ Using fixed `thinking: {budget_tokens: N}` (removed; use `{type: adaptive}` + `effort`)
- ❌ "Always verify before returning" prose on routine steps (4.7 self-verifies)
- ❌ Implicit fan-out ("review all files") — spell out parallel explicitly
- ❌ Filter-at-find-time ("report only critical") in reviewer skills — enumerate first

### Workflow
- ❌ [Bad practice specific to this skill]
- ❌ [Bad practice specific to this skill]

---

## Quick Reference

| Aspect | Value |
|--------|-------|
| Agents | [List agent names] |
| Steps | [Number of steps] |
| Max retries | 3 per step |
| Quality gates | After every step |
```

---

## Template Usage Notes

### Required Sections
1. **Critical Rules** - Architectural compliance
2. **Dedicated Agents** - List all agents
3. **Todo List Requirements** - Progress tracking
4. **When This Skill Applies** - Discovery triggers
5. **Workflow** - Steps with validation
6. **Examples** - At least 2 with input/output

### Step Structure (apply per step type)

**Irreversible steps** (file writes, agent file creation, breaking changes — anything that can't be safely retried):
```
#### Input Conditions
[Checkboxes - BLOCKING]

#### Pre-Step Validation
STOP if conditions not met

#### Execution
Delegate to agent

#### Post-Step Validation
[Checkboxes]

#### Quality Gate
Retry (max 3) or escalate
```

**Exploratory steps** (discovery, matching, design, research — operations Opus 4.7 self-verifies and that produce findings, not state):
```
#### Input Conditions
[Checkboxes - BLOCKING]

#### Execution
Delegate to agent; agent returns findings

#### (No mandatory post-step validation)
Orchestrator decides whether to retry based on findings quality.
```

The split avoids token-wasting verify ceremony on steps that don't need it (per Anthropic's Opus 4.7 migration guide).

### File References
For skill templates and guides, use relative paths with forward slashes:
```markdown
See `templates/output-format.md` for output formatting.
```

For agents, reference by name with source:
```markdown
Delegate to: `validator` (shared: agents/validator.md)
```

**Never** nest references (file A → file B → file C).

### CC 2.1 features

**String substitution variables** – available in skill body:
- `$ARGUMENTS` – user-provided arguments after slash command
- `$ARGUMENTS[N]` – positional argument (e.g., `$ARGUMENTS[0]` for the first argument)
- `$N` – shorthand positional (e.g., `$1` for the first argument)
- `$SELECTION` – currently selected text in IDE
- `$FILE` – path of currently open file
- `${CLAUDE_SESSION_ID}` – unique session identifier

**Dynamic context injection** – use `` `!command` `` syntax in skill body to run a shell command and inject its output when the skill loads. Example: `` `!git branch --show-current` `` injects the current branch name.

**Context budget** – skills should aim to use ≤2% of context window. Use progressive disclosure (load details on demand, not upfront).
