# Creating Skills Guide

Detailed workflow for creating new Claude Code skills (Steps 0-5).

---

## Validation discipline

Pre-Step / Post-Step Validation blocks are MANDATORY only on steps with irreversible side effects:
- Step 3 (file creation)
- Step 5 (final validation)

Exploratory steps (0 gather, 1 validate-requirements, 1.5 discover/match, 2 design) MAY skip Pre/Post-Step Validation if Opus 4.7 self-verifies. This mirrors SKILL.md Rule 9's carve-out per Anthropic's Opus 4.7 migration guide ("strip 'verify before returning' rituals on routine work").

If you choose to validate exploratory steps anyway, treat the validation as advisory rather than blocking — orchestrator decides retry on first-attempt failure.

---

## Overview

The Create operation follows 7 steps (including Step 1.5):

| Step | Agent | Purpose |
|------|-------|---------|
| 0 | `ms-requirements-gatherer` | Gather requirements via Q&A |
| 1 | `ms-requirements-validator` | Validate completeness |
| 1.5 | `ms-agent-discoverer` + `ms-agent-matcher` | Find and match agents |
| 2 | `ms-designer` | Design skill structure |
| 3 | `ms-creator` | Create files |
| 4 | `ms-example-adder` | Add usage examples |
| 5 | `ms-validator` | Validate against checklists |

---

## Step 0: Gather Requirements

### Input Conditions
- [ ] User has made skill creation request
- [ ] Request needs clarification (OR skip if complete)

### Pre-Step Validation
Skip to Step 1 if request is specific and complete.

### Execution (Part A - Generate Questions)
Delegate to: `ms-requirements-gatherer`
Task: Analyze request, generate questions for unclear items
Returns: `{questions: [...], extracted_requirements: {...}}`

### Execution (Part B - Ask User)
If questions returned:
- Orchestrator uses `AskUserQuestion` with returned questions
- Collect user answers
- Merge answers with extracted_requirements

### Post-Step Validation
- [ ] All required questions answered (or no questions needed)
- [ ] No conflicting requirements
- [ ] Complexity assessed

### Quality Gate
If incomplete: generate follow-up questions (max 3 rounds). Then escalate.

---

## Step 1: Validate Requirements

### Input Conditions
- [ ] Requirements gathered (Step 0) OR provided directly
- [ ] Operation type is "create"

### Pre-Step Validation
⛔ STOP if no requirements available.

### Execution
Delegate to: `ms-requirements-validator`
Task: Validate completeness and consistency

### Handle needs_user_input
If agent returns `status: "needs_user_input"`:
- Orchestrator uses `AskUserQuestion` with returned question
- Pass answer back and retry validation

### Post-Step Validation
- [ ] All required fields present
- [ ] No conflicts detected
- [ ] Complexity determined

### Quality Gate
If invalid: return to Step 0 for clarification.

---

## Step 1.5: Discover & Match Agents

### Input Conditions
- [ ] Step 1 completed successfully
- [ ] Requirements validated with workflow steps defined

### Pre-Step Validation
⛔ STOP if requirements not validated.

### Execution (Parts A and B - Parallel fan-out, added v4.2.0)

**REQUIRED: spawn ms-agent-discoverer and ms-agent-matcher as concurrent Task calls in the same turn.** Opus 4.7 defaults to sequential subagent delegation; explicit fan-out language is required to enable concurrency. The two agents have no inter-dependencies — discoverer scans available agents, matcher matches against requirements. Running them in series wastes ~50% of the wall time on Step 1.5.

Concrete orchestrator behavior:
1. Issue Task call to `ms-agent-discoverer` with discovery scope (builtin + shared sources).
2. Issue Task call to `ms-agent-matcher` with the matching requirements (it will use whatever discovery data it has, then merge with discoverer's output downstream).
3. Both calls go in the SAME orchestrator turn (parallel tool invocation in one message).
4. Wait on both; merge results.

If you find yourself writing "Step 1.5a (discoverer) → wait → Step 1.5b (matcher)" sequential prose, that's the implicit-fan-out anti-pattern Section 12.4 was added to catch. Don't ship that pattern in the skill that teaches the pattern.

### Execution (Part A - Discovery, run in parallel with Part B)
Delegate to: `ms-agent-discoverer`
Task: Discover available builtin and shared agents

### Execution (Part B - Matching, run in parallel with Part A)
Delegate to: `ms-agent-matcher`
Task: Match requirements against available agents, score matches ≥80%
Returns: Matches formatted for AskUserQuestion

### Execution (Part C - User Confirmation)
Orchestrator uses `AskUserQuestion` with matcher output:
- Present matched agents with scores
- Include "Create new shared agent" option
- User selects one agent per step

### Post-Step Validation
- [ ] All workflow steps have agent selection
- [ ] Each selection is valid (builtin/shared exists, or new to create)
- [ ] User has confirmed all selections

### Quality Gate
If user cancels or requirements change: return to Step 1.

> **Note:** Newly created shared agents require a session restart to become discoverable. If Step 1.5 creates new agents, the skill cannot be fully tested until the next session. Plan testing accordingly.

---

## Step 2: Design Skill

### Input Conditions
- [ ] Step 1.5 completed successfully
- [ ] Agent selections confirmed by user

### Pre-Step Validation
⛔ STOP if agent selections not confirmed.

### Execution
Delegate to: `ms-designer`
Task: Generate name, description, structure using confirmed agent selections

### Handle needs_user_input
If agent returns `status: "needs_user_input"` (complexity mismatch):
- Orchestrator uses `AskUserQuestion` with returned question
- Pass answer back and retry design

### Post-Step Validation
- [ ] Name follows gerund convention
- [ ] Description is third-person with what+when
- [ ] Structure matches complexity

### Quality Gate
If validation fails: retry with adjustments (max 3).

### CC 2.1 design considerations
When designing the skill, consider these CC 2.1 options:
- **`context: fork`** – use for long-running skills that might conflict with main context
- **`model` selection** – default to `sonnet`; use `opus` for complex reasoning, `haiku` for speed
- **`allowed-tools`** – restrict tool access if skill doesn't need full capabilities
- **Context budget** – aim for ≤2% of context window; see `guides/progressive-disclosure.md`

---

## Step 3: Create Files

### Input Conditions
- [ ] Step 2 completed successfully
- [ ] Design approved

### Pre-Step Validation
⛔ STOP if design not approved.

### CC 2.1 frontmatter
Ensure the creator includes relevant CC 2.1 frontmatter fields. See `templates/skill-md-template.md` for the full list of available fields.

### Execution
Delegate to: `ms-creator`
Task: Create SKILL.md, templates/ as needed

### Handle needs_user_input
If agent returns `status: "needs_user_input"` (directory conflict):
- Orchestrator uses `AskUserQuestion` with returned question
- Pass answer back (overwrite/rename/cancel)

### Post-Step Validation
- [ ] All planned files created
- [ ] SKILL.md under 500 lines
- [ ] All references valid

### Quality Gate
If creation fails: report error, attempt recovery.

---

## Step 4: Add Examples

### Input Conditions
- [ ] Step 3 completed successfully
- [ ] Skill files exist

### Pre-Step Validation
⛔ STOP if files not created.

### Execution
Delegate to: `ms-example-adder`
Task: Add 2-3 examples covering different use cases

### Post-Step Validation
- [ ] At least 2 examples added
- [ ] Each has input and output
- [ ] Different scenarios covered

### Quality Gate
If insufficient: generate additional examples.

---

## Step 5: Validate & Test

### Input Conditions
- [ ] Step 4 completed
- [ ] Examples added

### Pre-Step Validation
⛔ STOP if examples not added.

### Execution
Delegate to: `ms-validator`
Task: Run pre-release and security checklists

### Post-Step Validation
- [ ] Pre-release score ≥95% of applicable max (shape-aware per ms-validator Step 1a):
  - Orchestrator skill: ≥66/70
  - Focused-reviewer skill: ≥64/68
  - Focused skill: ≥63/66.5
- [ ] Security score ≥87/93
- [ ] No critical failures
- [ ] Section 12.7 (deprecated APIs) MUST pass (BLOCKING — runtime 400 error on Opus 4.7)

### Quality Gate
If validation fails: report issues, recommend fixes.

---

## Handling needs_user_input

When any agent returns `status: "needs_user_input"`:

1. Agent provides question in AskUserQuestion format
2. Orchestrator uses `AskUserQuestion` tool with the question
3. Orchestrator passes answer back to agent or next step
4. Workflow continues

This pattern is required because agents cannot use AskUserQuestion directly.

---

## Quick Reference

```
Step 0: Gather → ms-requirements-gatherer
        ↓ (orchestrator asks if questions)
Step 1: Validate → ms-requirements-validator
        ↓
Step 1.5: Discover → ms-agent-discoverer
          Match → ms-agent-matcher
          ↓ (orchestrator asks for confirmation)
Step 2: Design → ms-designer
        ↓
Step 3: Create → ms-creator
        ↓
Step 4: Examples → ms-example-adder
        ↓
Step 5: Validate → ms-validator
        ↓
        DONE
```
