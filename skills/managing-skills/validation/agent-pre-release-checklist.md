# Agent Pre-Release Checklist

Complete this checklist before deploying any new or modified agent.

**Last revised:** 2026-05-09 (v4.2.0 — Section 13 added for Opus 4.7 per-agent frontmatter; 13.3 + 13.4 BLOCKING for deprecated APIs).

### Section equivalence across the three checklists

Section 13 is agent-specific (effort/model frontmatter, deprecated-API negative tests). Sections 8 and 12 (skills) cover overlapping anti-patterns; cross-reference:

| Concept | pre-release (skills) | review (skills ongoing) | agent-pre-release (this file, agents) |
|---------|---------------------|-------------------------|----------------------------------------|
| Description voice | 12.1 | 8.1 | (skills only) |
| Description triggers | 12.2 | 8.2 | (skills only) |
| Verify scaffolding cleanup | 12.3 | 8.3 | 13.5 |
| Explicit fan-out | 12.4 | 8.4 | (skills only) |
| Per-subagent overrides | 12.5 | 8.5 | (skills only) |
| Find-vs-filter decoupled | 12.6 | 8.6 | (skills only) |
| Deprecated APIs (4.7 400-error) | 12.7 | 8.7 | 13.3 + 13.4 (BLOCKING) |
| Effort field present | (n/a) | (n/a) | 13.1 |
| Model field present | (n/a) | (n/a) | 13.2 |

---

## 0. XML Structure (Recommended)

**XML structure is strongly recommended for all agents. XML tags help Claude parse and follow structured instructions more reliably.**

### Required Tags Present
- [ ] `<context>` tag present with role, tools, mission
- [ ] `<task>` tag present with single-sentence objective
- [ ] `<workflow>` tag present with numbered steps
- [ ] `<constraints>` tag present with NEVER/ALWAYS/MUST rules
- [ ] `<output>` tag present with exact format specification
- [ ] Agent has `<input_contract>` section with >=1 declared input (BLOCKING)
- [ ] Agent has standalone `<quality_gate>` section (not embedded in critical_thinking) (BLOCKING)

### Tag Structure Quality
- [ ] All tags properly closed (no unclosed tags)
- [ ] Tags not incorrectly nested
- [ ] No markdown headers (`##`) used for agent structure - XML tags only

### Context Tag Content
- [ ] Defines specific role (not generic "assistant")
- [ ] Lists tools explicitly
- [ ] States clear mission/outcome

### Task Tag Content
- [ ] Single sentence without "and"
- [ ] Describes WHAT to accomplish, not HOW
- [ ] Is verifiable (can determine if completed)

### Workflow Tag Content
- [ ] Uses numbered steps (not bullets)
- [ ] Each step includes tool example where applicable
- [ ] Includes verification checkpoints
- [ ] Uses ⛔ STOP markers for critical gates
- [ ] All Glob/Grep/Read paths are absolute or rooted at a declared input_contract variable

### Constraints Tag Content
- [ ] Uses NEVER/ALWAYS/MUST keywords (not vague language)
- [ ] Each constraint includes rationale or consequence
- [ ] No "be careful", "try to", or other weak phrasing

### Output Tag Content
- [ ] Exact format specified
- [ ] JSON format preferred (structured, parseable)
- [ ] All fields defined with types
- [ ] Matches what workflow produces

**Section 0 Score:** __ / 20 (ALL must pass)

---

## 1. File Structure

- [ ] File located in `agents/` directory (shared agents)
- [ ] Filename uses kebab-case (e.g., `validate-frontmatter.md`)
- [ ] Filename matches agent name exactly
- [ ] Filename ≤64 characters
- [ ] Color is unique across all agents (verify: `grep 'color:' agents/*.md`)

## 2. Agent Identity

### Purpose
- [ ] Purpose is single sentence
- [ ] Purpose does NOT contain "and" (SRP violation)
- [ ] Purpose clearly describes what agent does

### Naming
- [ ] Name follows verb-noun pattern (e.g., `validate-syntax`, `format-output`)
- [ ] Name is lowercase with hyphens only
- [ ] Name is descriptive (not `helper`, `processor`, `agent1`)

## 3. Input Contract

- [ ] All inputs listed in table format
- [ ] Each input has: name, type, required, validation
- [ ] Required inputs are marked clearly
- [ ] Validation rules are specific and testable
- [ ] Pre-execution validation section present
- [ ] "STOP if validation fails" instruction included

## 4. Output Contract

- [ ] All outputs listed in table format
- [ ] Each output has: name, type, description
- [ ] Output types match agent purpose
- [ ] Descriptions are clear and actionable

## 5. Quality Gate

- [ ] Quality gate section present
- [ ] Specific, testable criteria listed
- [ ] All criteria must pass
- [ ] Failure response defined
- [ ] "Skill will retry (max 3 times)" noted

## 6. Token Efficiency

- [ ] Token budget specified (target and max)
- [ ] Budget appropriate for complexity:
  - [ ] Simple: Target 300, Max 500
  - [ ] Medium: Target 500, Max 800
  - [ ] Complex: Target 800, Max 1200
- [ ] No redundant instructions
- [ ] Tables used instead of prose where possible

## 7. Error Handling

- [ ] Error conditions identified
- [ ] Clear responses defined for each error
- [ ] Errors are informative (include details)
- [ ] Graceful degradation on failures

## 8. Isolation

- [ ] No references to other skills
- [ ] No references to agents outside parent skill
- [ ] No direct calls to other agents
- [ ] Agent receives all inputs from skill
- [ ] Agent returns all outputs to skill

## 9. Execution Logic

- [ ] Step-by-step logic documented
- [ ] Logic focused on single responsibility
- [ ] No multiple unrelated tasks
- [ ] No orchestration of other agents

## 10. Testing

### Functional Testing
- [ ] Agent produces expected output for standard input
- [ ] Agent handles edge cases (empty input, large input)
- [ ] Agent handles error conditions correctly

### Quality Gate Testing
- [ ] Quality gate criteria are verifiable
- [ ] Agent fails correctly when output doesn't meet criteria
- [ ] Error messages are informative

## 11. Critical Thinking (REQUIRED)

This section is **MANDATORY** for all agents. Agents without critical thinking sections automatically fail.

### Structure
- [ ] Critical thinking section present in agent
- [ ] Section appears after Execution Logic, before Constraints
- [ ] Uses standard three-subsection format

### Alternatives Subsection
- [ ] Lists 2-3 different approaches to the task
- [ ] Explains why chosen approach is optimal
- [ ] Documents trade-offs considered

### Edge Cases Subsection
- [ ] Contains domain-specific edge case questions
- [ ] At least 3-4 edge cases identified
- [ ] Edge cases are relevant to agent's purpose

### Adapt Subsection
- [ ] Describes when to pivot approach
- [ ] Specifies escalation criteria
- [ ] Documents partial success handling

### Completion Checklist (Write-Capable Agents Only)
- [ ] Completion checklist present if agent has Write/Edit/Bash tools
- [ ] At least 5 checklist items
- [ ] Includes "no partial state" verification
- [ ] Includes output contract verification

---

## 12. CC 2.1 agent fields

- [ ] `skills` field (if used) references valid, existing skills
- [ ] `memory` scope is appropriate (user/project/local)
- [ ] `background` flag documented in agent description if true
- [ ] `hooks` configuration is syntactically valid
- [ ] `mcpServers` configuration includes required command/args
- [ ] `maxTurns` set to reasonable value (not 0, not >200)

---

## 13. Opus 4.7 frontmatter and prose (added 2026-05-09 in v4.2.0)

Per Anthropic Claude Code 4.7 best practices (https://platform.claude.com/docs/en/build-with-claude/effort, https://platform.claude.com/docs/en/about-claude/models/migration-guide).

### Effort and model fields

- [ ] **13.1 `effort` field present** and matches role per Model Selection Guide (templates/shared-agent-template.md):
  - Orchestrator/file-creator/reviewer roles → `xhigh`
  - Validator/researcher roles → `medium` or `high`
  - Format-applier/classifier/scoped one-shot → `low`
- [ ] **13.2 `model` field present** and matches role:
  - Orchestrator/file-creator/refactorer/reviewer → `opus`
  - Validator/researcher/format-applier → `sonnet`
  - Classifier/router → `haiku`

### Deprecated API negative tests (BLOCKING — runtime 400 errors on Opus 4.7)

- [ ] **13.3 No fixed `budget_tokens`** in agent prompts. Use `thinking: {type: "adaptive"}` + `effort` field.
- [ ] **13.4 No `temperature` / `top_p` / `top_k`** in agent code references (returns 400 error on Opus 4.7).

### Prose hygiene

- [ ] **13.5 No "always verify/double-check before returning"** scaffolding on routine workflow steps. Keep verify steps only on irreversible actions (file writes, breaking changes).

**Section 13 Score:** ____ / 5

---

## Checklist Summary

| Section | Items | Passed |
|---------|-------|--------|
| **0. XML Structure** | **23** | __ / 23 (Recommended) |
| 1. File Structure | 5 | __ / 5 |
| 2. Agent Identity | 6 | __ / 6 |
| 3. Input Contract | 6 | __ / 6 |
| 4. Output Contract | 4 | __ / 4 |
| 5. Quality Gate | 5 | __ / 5 |
| 6. Token Efficiency | 4 | __ / 4 |
| 7. Error Handling | 4 | __ / 4 |
| 8. Isolation | 5 | __ / 5 |
| 9. Execution Logic | 4 | __ / 4 |
| 10. Testing | 5 | __ / 5 |
| 11. Critical Thinking | 13 | __ / 13 |
| 12. CC 2.1 Agent Fields | 6 | __ / 6 |
| **13. Opus 4.7** | **5** | __ / 5 (BLOCKING for 13.3 + 13.4) |
| **Total** | **95** | __ / 95 |

---

## Pass Criteria

- **Minimum:** All isolation items, SRP verified, critical thinking present, items 13.3 + 13.4 PASS (no deprecated APIs)
- **Recommended:** 90/95 items passed (~95%), including XML structure and 4.7 patterns
- **Production:** 95/95 items passed

---

## Automatic Fail Conditions

These items cause automatic failure regardless of total score:
- [ ] Vague constraints without NEVER/ALWAYS/MUST keywords

### Other Automatic Fails
- [ ] Purpose contains "and" (SRP violation)
- [ ] References to other skills
- [ ] References to agents outside parent skill
- [ ] No input validation section
- [ ] No quality gate section
- [ ] Agent attempts to spawn other agents
- [ ] **No critical thinking section**
- [ ] Write-capable agent missing completion checklist
- [ ] **`temperature`, `top_p`, `top_k` declared** (item 13.4 — runtime 400 error on Opus 4.7)
- [ ] **Fixed `thinking: {budget_tokens: N}` declared** (item 13.3 — removed in Opus 4.7; use adaptive thinking + effort)

---

## Common Issues and Fixes

| Issue | Fix |
|-------|-----|
| Purpose too broad | Split into multiple focused agents |
| No input validation | Add Input Contract with validation rules |
| Vague quality gate | Make criteria specific and testable |
| Token budget exceeded | Remove redundant instructions, use tables |
| Cross-agent references | Route all communication through skill |
