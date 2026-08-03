# Agent Pre-Release Checklist

Complete this checklist before deploying any new or modified agent.

**Last revised:** 2026-08-02 (v6.3.0 — Section 13 recalibrated for the Claude 5 family: effort one step cooler, 13.5 extended with the reasoning-display ban; Section 11 consolidated to a single end-of-work gate. Section 13 originally added 2026-05-09, v4.2.0; 13.3 + 13.4 remain BLOCKING).

### Section equivalence across the three checklists

Section 13 is agent-specific (effort/model frontmatter, deprecated-API negative tests). Sections 8 and 12 (skills) cover overlapping anti-patterns; cross-reference:

| Concept | pre-release (skills) | review (skills ongoing) | agent-pre-release (this file, agents) |
|---------|---------------------|-------------------------|----------------------------------------|
| Description voice | 12.1 | 8.1 | (skills only) |
| Description triggers | 12.2 | 8.2 | (skills only) |
| Verify scaffolding cleanup | 12.3 | 8.3 | 13.5 |
| Delegation calibration | 12.4 | 8.4 | (skills only) |
| Per-subagent overrides | 12.5 | 8.5 | (skills only) |
| Find-vs-filter decoupled | 12.6 | 8.6 | (skills only) |
| Deprecated APIs + reasoning-display | 12.7 | 8.7 | 13.3 + 13.4 (BLOCKING); reasoning-display in 13.5 |
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

**Section 0 Score:** __ / 28 (ALL must pass)

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

`<critical_thinking>` blocks are *author-filled design records* (alternatives weighed, edge cases, adaptation criteria) written when the agent file is created. They are static content, not runtime instructions to the model — they are explicitly **exempt** from the reasoning-display ban in item 13.5 / skill checklist item 12.7.

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

### End-of-work gate (Write-Capable Agents Only)

Agents ship a **single** `<quality_gate>` as their end-of-work gate — do not add a separate `<completion_checklist>` duplicating it (consolidated 2026-08-02, v6.3.0).

- [ ] Single end-of-work `<quality_gate>` present if agent has Write/Edit/Bash tools (no duplicate second gate)
- [ ] At least 5 gate items
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

## 13. Claude 5 frontmatter and prose (added 2026-05-09 in v4.2.0; recalibrated 2026-08-02 in v6.3.0)

Per Anthropic Claude 5 guidance (https://platform.claude.com/docs/en/build-with-claude/effort, https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5). Claude 5 models at `low`/`medium` effort often match or exceed prior-generation `xhigh` output — the role targets below are one step cooler than the 4.x-era table.

### Effort and model fields

- [ ] **13.1 `effort` field present** and matches role per Model Selection Guide (templates/shared-agent-template.md):
  - Orchestrator/reviewer roles → `high`
  - File-creator/architect-designer/refactorer/researcher roles → `medium`
  - Validator/format-applier/classifier/scoped one-shot → `low`
  - `xhigh`/`max` are reserved for genuinely frontier problems, no longer role defaults
- [ ] **13.2 `model` field present** and matches role:
  - Orchestrator/file-creator/architect-designer/refactorer/reviewer → `opus`
  - Validator/researcher/format-applier → `sonnet`
  - Classifier/router → `haiku`
  - Never pin `fable` (alias not universally available; inherit the session model instead)

### Deprecated API negative tests (BLOCKING)

- [ ] **13.3 No fixed `budget_tokens`** in Claude-5-model agent prompts (unsupported on Fable 5 / Opus 5 / Sonnet 5; Haiku 4.5 still supports it). Use `thinking: {type: "adaptive"}` + `effort` field on Claude 5 models.
- [ ] **13.4 No `temperature` / `top_p` / `top_k`** in agent code references (returns 400 error on Claude Opus 4.7 and later, per Anthropic's parameter-deprecation table).

### Prose hygiene

- [ ] **13.5 No verify rituals and no reasoning-display instructions:** No "always verify/double-check before returning" scaffolding on routine workflow steps (keep verify steps only on irreversible actions — file writes, breaking changes). No prose instructing the model to surface internal reasoning (`show your reasoning`, `explain your chain of thought`, `thinking.display: visible`) — trips the `reasoning_extraction` refusal classifier on Claude Fable 5 and Claude Opus 5 (`stop_reason: "refusal"`; re-routes to Claude Opus 4.8 where fallback is configured). Author-filled `<critical_thinking>` blocks are exempt (static authored content). Requesting evidence in structured output ("cite the file:line that drove the decision") is the safe replacement.

**Section 13 Score:** ____ / 5

---

## Checklist Summary

| Section | Items | Passed |
|---------|-------|--------|
| **0. XML Structure** | **28** | __ / 28 (Recommended) |
| 1. File Structure | 5 | __ / 5 |
| 2. Agent Identity | 6 | __ / 6 |
| 3. Input Contract | 6 | __ / 6 |
| 4. Output Contract | 4 | __ / 4 |
| 5. Quality Gate | 5 | __ / 5 |
| 6. Token Efficiency | 7 | __ / 7 |
| 7. Error Handling | 4 | __ / 4 |
| 8. Isolation | 5 | __ / 5 |
| 9. Execution Logic | 4 | __ / 4 |
| 10. Testing | 6 | __ / 6 |
| 11. Critical Thinking | 16 | __ / 16 |
| 12. CC 2.1 Agent Fields | 6 | __ / 6 |
| **13. Claude 5** | **5** | __ / 5 (BLOCKING for 13.3 + 13.4) |
| **Total** | **107** | __ / 107 |

---

## Pass Criteria

- **Minimum:** All isolation items, SRP verified, critical thinking present, items 13.3 + 13.4 PASS (no deprecated APIs)
- **Recommended:** 102/107 items passed (~95%), including XML structure and Claude 5 patterns
- **Production:** 107/107 items passed

---

## Automatic Fail Conditions

These items cause automatic failure regardless of total score:
- [ ] Constraints section absent, or constraints so vague they cannot be verified (no concrete boundaries)

### Other Automatic Fails
- [ ] Purpose contains "and" (SRP violation)
- [ ] References to other skills
- [ ] References to agents outside parent skill
- [ ] No input validation section
- [ ] No quality gate section
- [ ] Agent attempts to spawn other agents
- [ ] **No critical thinking section**
- [ ] Write-capable agent's quality gate lacks "no partial state" verification
- [ ] **`temperature`, `top_p`, `top_k` declared** (item 13.4 — runtime 400 error on Claude Opus 4.7 and later)
- [ ] **Fixed `thinking: {budget_tokens: N}` declared on a Claude 5 model** (item 13.3 — unsupported on Fable 5 / Opus 5 / Sonnet 5; use adaptive thinking + effort)

---

## Common Issues and Fixes

| Issue | Fix |
|-------|-----|
| Purpose too broad | Split into multiple focused agents |
| No input validation | Add Input Contract with validation rules |
| Vague quality gate | Make criteria specific and testable |
| Token budget exceeded | Remove redundant instructions, use tables |
| Cross-agent references | Route all communication through skill |
