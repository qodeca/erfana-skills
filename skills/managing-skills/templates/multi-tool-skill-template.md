# Multi-Tool Skill Template

For complex skills with multiple phases, extensive validation, and multiple agents.

---

```markdown
---
name: your-skill-name
description: |
  [Comprehensive description of capabilities].
  [List main operations].
  Use when [specific triggers] or [scenarios].
---

# [Skill Name]

## Critical Rules

This skill follows orchestrator architecture:
- Delegates ALL tasks to agents (builtin or shared)
- EVERY step has input conditions (BLOCKING)
- Validates where it matters — after irreversible work, not after exploratory steps. Opus 4.7 self-verifies; over-validating wastes tokens.
- Quality gates apply on irreversible steps (max 3 retries, then escalate)
- Todo lists ALWAYS created and maintained
- MUST NOT reference other skills or external agents
- MUST NOT use `temperature` / `top_p` / `top_k` / fixed `budget_tokens` (Opus 4.7 returns 400 error)

## Requirements Gathering (Phase 0)

Before starting workflow, if request is unclear:
1. Assess complexity (simple: 3-5 questions, medium: 5-8, complex: 8-12)
2. Present questionnaires with options and **✓ recommended** choice
3. Collect ALL answers (no skipping)
4. Document requirements before proceeding

See `guides/requirements-gathering.md` and `templates/questionnaire-template.md`.

## Agents

Per-subagent Effort and Model overrides shown below. Per-subagent overrides reduce cost without sacrificing quality on routine validators.

| Agent | Purpose | Source | Effort | Model | Used In |
|-------|---------|--------|--------|-------|---------|
| `validate-input` | Validate input requirements | shared | medium | sonnet | Phase 1 |
| `process-data` | Process according to rules | shared | xhigh | opus | Phase 2 |
| `format-output` | Format final output | shared | low | sonnet | Phase 3 |
| `verify-result` | Verify completion quality | shared | medium | sonnet | Phase 3 |

## Todo List Requirements

**MANDATORY - No exceptions**

### At Workflow Start
```
1. Create todo list with ALL phases and steps
2. Mark Phase 1, Step 1 as in_progress
```

### For EVERY Step
```
1. Mark step in_progress BEFORE starting
2. Execute with agent delegation
3. Validate output against quality gate
4. Mark complete IMMEDIATELY after gate passes
```

---

## Prerequisites

Before using this skill, ensure:
- [ ] [Required tool 1] is available
- [ ] [Required tool 2] is installed
- [ ] [Access/permissions] configured

---

## When This Skill Applies

Activate when user:
- [Primary trigger]
- [Secondary trigger]
- [Related keyword mentions]

---

## Workflow

### Phase 1: Setup

#### Step 1.1: Validate Environment

##### Input Conditions
- [ ] Skill invoked
- [ ] User request received

##### Pre-Step Validation
STOP if ANY condition unchecked.

##### Execution
Delegate to: `validate-input` (shared: agents/validate-input.md)
Task: Check prerequisites and environment

##### Post-Step Validation
- [ ] All prerequisites verified
- [ ] Environment ready

##### Quality Gate
If prerequisites fail: report missing, STOP workflow.

---

#### Step 1.2: Gather Requirements

##### Input Conditions
- [ ] Step 1.1 completed
- [ ] Environment validated

##### Execution
Ask user for:
- [Required input 1]
- [Required input 2]
- [Optional preferences]

##### Post-Step Validation
- [ ] All required inputs received
- [ ] Inputs valid

##### Quality Gate
If missing required inputs: request again (max 3 times).

---

### Phase 2: Execution

#### Step 2.1: Process Data

##### Input Conditions
- [ ] Phase 1 completed
- [ ] All inputs available
- [ ] Processing rules defined

##### Pre-Step Validation
STOP if ANY condition unchecked.

##### Execution
Delegate to: `process-data` (shared: agents/process-data.md)
Task: [Specific processing task]

##### Post-Step Validation
- [ ] Processing completed without errors
- [ ] Output data generated
- [ ] Data matches expected format

##### Quality Gate
If ANY validation fails:
1. Retry with corrections (max 3)
2. After 3 failures, escalate to user
3. User may override with documented justification

---

#### Step 2.2: Validate Results

##### Input Conditions
- [ ] Step 2.1 completed
- [ ] Processed data available

##### Execution
Delegate to: `verify-result` (shared: agents/verify-result.md)
Task: Verify processing quality

##### Post-Step Validation
- [ ] Results meet quality standards
- [ ] No data corruption

##### Quality Gate
If quality fails: return to Step 2.1.

---

### Phase 3: Output

#### Step 3.1: Format Results

##### Input Conditions
- [ ] Phase 2 completed
- [ ] Results validated

##### Execution
Delegate to: `format-output` (shared: agents/format-output.md)
Task: Format results per specification

##### Post-Step Validation
- [ ] Output formatted correctly
- [ ] All sections present

##### Quality Gate
If fails: retry (max 3) or escalate.

---

#### Step 3.2: Deliver to User

##### Input Conditions
- [ ] Step 3.1 completed
- [ ] Formatted output ready

##### Execution
Return formatted results to user with:
- Summary of actions taken
- Output artifacts
- Any warnings

##### Post-Step Validation
- [ ] User received output
- [ ] Todo list complete

##### Quality Gate
Final verification complete.

---

## Examples

See `examples.md` for detailed examples including:
- [Example category 1]
- [Example category 2]
- [Edge cases]

### Quick Example

**User says:** "[Complex request]"

**Skill does:**
1. Creates todo list [Phase 1: 2 steps, Phase 2: 2 steps, Phase 3: 2 steps]
2. Phase 1 → Validates, gathers inputs
3. Phase 2 → Processes data
4. Phase 3 → Formats and delivers

**Output:**
```
[Example formatted output]
```

---

## Error Handling

| Error | Phase | Response |
|-------|-------|----------|
| Prerequisites missing | 1 | Report missing, STOP |
| Invalid input | 1 | Request correction (max 3) |
| Processing error | 2 | Retry (max 3), escalate |
| Format error | 3 | Retry (max 3), escalate |

---

## Anti-Patterns

### Architectural (CRITICAL)
- ❌ Referencing other skills
- ❌ Using external agents
- ❌ Executing directly instead of delegating
- ❌ Skipping input condition validation
- ❌ Missing post-step validation
- ❌ No quality gates
- ❌ No todo list tracking

### Workflow
- ❌ Skipping validation phases
- ❌ Processing without prerequisites
- ❌ Delivering without quality check

---

## Quick Reference

| Aspect | Value |
|--------|-------|
| Phases | 3 (Setup, Execution, Output) |
| Total Steps | 6 |
| Agents | 4 |
| Max retries | 3 per step |
| Quality gates | After every step |
```

---

## Directory Structure for Multi-Tool Skills

```
your-skill-name/
├── SKILL.md                 # Main orchestrator
├── agents/                  # REQUIRED
│   ├── validate-input.md
│   ├── process-data.md
│   ├── format-output.md
│   └── verify-result.md
├── templates/               # Output templates
│   └── output-format.md
├── validation/              # Quality checklists
│   └── checklist.md
└── examples.md              # Detailed examples
```

## When to Use This Template

Use for skills that:
- Have 3+ phases
- Require 3+ agents
- Need prerequisite validation
- Have complex error handling
- Require extensive quality gates
