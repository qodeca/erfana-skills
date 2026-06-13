# Migration Guide

Comprehensive guide for migrating existing skills to the orchestrator architecture.

---

## Overview

This guide helps you migrate existing skills to comply with the 18 critical architectural rules. The migration transforms skills from direct-execution to orchestrator pattern using builtin and shared agents.

---

## Pre-Migration Assessment

### Assessment Checklist

Before migrating, evaluate the existing skill:

| Aspect | Question | Action Needed |
|--------|----------|---------------|
| Skill references | Does it reference other skills? | Remove all references |
| Agent sources | Does it use builtin/shared agents? | Identify or create shared agents |
| Workflow | Is workflow clearly defined? | Document all steps |
| Input conditions | Are pre-conditions per step? | Add input conditions |
| Validation | Is there post-step validation? | Add validation blocks |
| Quality gates | Are outputs validated? | Add quality gates |
| Todo lists | Does it create todos? | Add todo requirements |

### Compliance Score

Count compliant items (0-16):

| Score | Status | Effort |
|-------|--------|--------|
| 14-16 | Minor updates | Low (1-2 hours) |
| 10-13 | Moderate migration | Medium (3-5 hours) |
| 5-9 | Significant rewrite | High (6-10 hours) |
| 0-4 | Full rebuild | Very High (10+ hours) |

---

## Migration Workflow

### Phase 1: Preparation

#### Step 1.1: Backup Existing Skill

```bash
cp -r skills/skill-name skills/skill-name.backup.$(date +%Y%m%d)
```

#### Step 1.2: Document Current State

Create migration notes:
- Current workflow (even if implicit)
- All tasks performed
- External dependencies
- Known issues

#### Step 1.3: Identify Agent Candidates

List all distinct tasks the skill performs. Each becomes an agent candidate:

| Current Task | Agent Name | Responsibility |
|--------------|------------|----------------|
| [Task 1] | `validate-xxx` | [Single responsibility] |
| [Task 2] | `process-xxx` | [Single responsibility] |
| [Task 3] | `format-xxx` | [Single responsibility] |

---

### Phase 2: Identify or Create Shared Agents

#### Step 2.1: Check Existing Agents

Search for existing builtin and shared agents that match requirements:
```bash
ls agents/
```

#### Step 2.2: Create New Shared Agents (If Needed)

For each identified task without a matching agent, create a shared agent file in `agents/`:

**Before (in SKILL.md):**
```markdown
### Step 2: Validate the Input

Check that the input file:
- Exists and is readable
- Has valid YAML frontmatter
- Contains required fields
```

**After (agents/validate-input.md):**
```markdown
# Agent: validate-input

---
name: validate-input
description: MUST BE USED to validate input files. Checks existence, readability, and structure.
tools: Read, Glob
model: sonnet
---

<context>
Input validation specialist.
Tools: Read, Glob.
Mission: Validate input file exists, is readable, and has valid structure.
</context>

<task>
Validate input file meets requirements.
</task>

<workflow>
1. Check file exists
2. Verify readable
3. Validate structure
</workflow>

<output>
{
  "valid": boolean,
  "errors": [string]
}
</output>
```

---

### Phase 3: Restructure SKILL.md

#### Step 3.1: Add Critical Rules Section

Add at the very top of SKILL.md (after frontmatter):

```markdown
## Critical Rules

This skill follows the orchestrator architecture:
- Acts as orchestrator, delegates ALL tasks to builtin or shared agents
- Each step has input conditions that MUST be verified
- Post-step validation is REQUIRED after every step
- Quality gates MUST pass before proceeding
- Todo lists MUST be created and maintained
```

#### Step 3.2: Restructure Workflow Steps

Transform each step to include input conditions and validation:

**Before:**
```markdown
### Step 2: Process the File

Process the file according to the rules defined above.
```

**After:**
```markdown
### Step 2: Process the File

#### Input Conditions
- [ ] Step 1 completed successfully
- [ ] Input file validated (from Step 1)
- [ ] Processing rules defined

#### Pre-Step Validation
STOP if ANY condition unchecked. Report missing conditions.

#### Execution
Delegate to: `process-file` (shared: agents/process-file.md)
Task: Process file according to defined rules

#### Post-Step Validation
- [ ] Processing completed without errors
- [ ] Output file created/modified
- [ ] Output matches expected format

#### Quality Gate
If ANY validation fails:
1. Retry with corrections (max 3)
2. After 3 failures, escalate to user
3. User may override with documented justification
```

#### Step 3.3: Add Todo List Requirements

Add to SKILL.md:

```markdown
## Todo List Management

ALWAYS at workflow start:
1. Create todo list with all steps
2. Mark first step as in_progress

For EVERY step:
1. Mark step in_progress BEFORE starting
2. Mark step completed IMMEDIATELY after passing quality gate
3. Update todo list after each status change

This is MANDATORY - no exceptions.
```

---

### Phase 4: Add Validation

#### Step 4.1: Input Conditions Per Step

Every step MUST have explicit input conditions:

```markdown
#### Input Conditions
- [ ] [Previous step completed]
- [ ] [Required data available]
- [ ] [Dependencies met]
```

#### Step 4.2: Post-Step Validation

Every step MUST have post-execution validation:

```markdown
#### Post-Step Validation
- [ ] [Expected output exists]
- [ ] [Output is valid]
- [ ] [No errors occurred]
```

#### Step 4.3: Quality Gates

Every step MUST have quality gate logic:

```markdown
#### Quality Gate
If ANY validation fails:
1. Retry step (max 3 attempts)
2. If still failing, escalate to user
3. User can override with justification
```

---

### Phase 5: Remove Violations

#### Step 5.1: Remove Skill References

Search for and remove:
- References to other skills
- Cross-skill dependencies
- Shared agent references

**Before:**
```markdown
For advanced processing, see `processing-documents` skill.
Use the shared `validators/common-validator` agent.
```

**After:**
```markdown
For advanced processing, delegate to `advanced-processor` (shared agent).
Delegate to `validate-input` (shared agent) for validation.
```

#### Step 5.2: Update Agent References

Ensure all agents are referenced from builtin or shared sources:

| Old Reference | New Reference |
|--------------|---------------|
| `agents/xxx` | `xxx` (shared: agents/xxx.md) |
| `other-skill/agents/xxx` | Find matching builtin/shared or create new shared agent |

---

### Phase 6: Validate Migration

#### Step 6.1: Run Pre-Release Checklist

Complete `validation/pre-release-checklist.md` with focus on:
- Orchestrator Architecture section
- Agent Design section
- Input/Output Validation section
- Quality Gates section

#### Step 6.2: Test Workflow

1. **Direct invocation:** Invoke skill explicitly
2. **Auto-discovery:** Test trigger phrases
3. **Quality gates:** Intentionally fail steps to test gates
4. **Todo tracking:** Verify todos created and updated

#### Step 6.3: Cross-Model Test

Test with Haiku to ensure guardrails are effective.

---

## Common Migration Patterns

### Pattern: Inline Logic to Agent

**Before (inline in step):**
```markdown
### Step 3: Format Output

Format the results as JSON:
- Use 2-space indentation
- Sort keys alphabetically
- Include timestamp
```

**After (delegated to agent):**
```markdown
### Step 3: Format Output

#### Input Conditions
- [ ] Processing results available
- [ ] Format specification defined

#### Execution
Delegate to: `format-output` (shared: agents/format-output.md)
Task: Format results as JSON with specified options

#### Post-Step Validation
- [ ] Output is valid JSON
- [ ] Keys are sorted alphabetically
- [ ] Timestamp included
```

Plus create `agents/format-output.md` if it doesn't exist.

### Pattern: Implicit to Explicit Conditions

**Before (implicit):**
```markdown
### Step 2: Process Data

After validating the input, process the data.
```

**After (explicit):**
```markdown
### Step 2: Process Data

#### Input Conditions
- [ ] Step 1 (Validate Input) completed
- [ ] validation_result.valid == true
- [ ] Input data accessible

STOP if ANY condition is unchecked.
```

### Pattern: No Validation to Full Validation

**Before (no validation):**
```markdown
### Step 4: Generate Report

Generate the final report and save it.
```

**After (full validation):**
```markdown
### Step 4: Generate Report

#### Input Conditions
- [ ] All processing steps completed
- [ ] Report template available

#### Pre-Step Validation
STOP if ANY condition unchecked.

#### Execution
Delegate to: `generate-report` (shared: agents/generate-report.md)

#### Post-Step Validation
- [ ] Report file created
- [ ] Report contains all required sections
- [ ] No placeholder text remaining

#### Quality Gate
If validation fails: retry (max 3) or escalate.
```

---

## Before/After Example

For a complete before/after comparison, see `examples.md` which contains full skill examples at different complexity levels. Key transformation patterns:

| Before | After |
|--------|-------|
| `### Step 2: Validate` | Full step with Input Conditions, Pre-Step Validation, Execution, Post-Step Validation, Quality Gate |
| Inline processing logic | Delegated to builtin or shared agent |
| No prerequisites stated | Explicit `- [ ]` checkbox conditions |
| No validation | Post-step validation with criteria |
| No retry logic | Quality gate with "retry (max 3) or escalate" |

---

## Migration Checklist

### Pre-Migration
- [ ] Backed up existing skill
- [ ] Documented current state
- [ ] Identified agent candidates
- [ ] Estimated effort level

### During Migration
- [ ] Identified existing builtin/shared agents
- [ ] Created new shared agents as needed
- [ ] Added Critical Rules section
- [ ] Restructured all workflow steps
- [ ] Added input conditions to all steps
- [ ] Added post-step validation to all steps
- [ ] Added quality gates to all steps
- [ ] Added todo list requirements
- [ ] Removed all skill references
- [ ] Updated all agent references to builtin/shared sources

### Post-Migration
- [ ] Pre-release checklist passed
- [ ] Direct invocation tested
- [ ] Auto-discovery tested
- [ ] Quality gates tested
- [ ] Todo tracking verified
- [ ] Cross-model tested (Haiku)
- [ ] Backup removed (after confirming success)

---

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| Incomplete delegation | Some logic still inline | Move ALL tasks to agents |
| Missing input conditions | Steps run without validation | Add conditions to EVERY step |
| Weak quality gates | Gates don't catch failures | Define specific criteria |
| Forgotten todo updates | Progress not tracked | Add explicit todo instructions |
| Leftover references | Still references other skills | Search and remove all |
| Wrong agent paths | References `agents/` directory | Update to builtin or shared sources |
