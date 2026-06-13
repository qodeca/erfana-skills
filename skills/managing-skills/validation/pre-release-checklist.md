# Pre-Release Checklist

Complete validation before releasing or deploying a skill.

**Scoring note:** This checklist uses a 70-point scale (62 base + Section 12 weighted at 8.0). Section 12 items support N/A scoring for shape-specific patterns (focused vs orchestrator skills). The security-checklist.md uses a 93-point weighted scale (sections have 1x-3x multipliers). The review-checklist.md uses a 40-point scale for audits. Different scales serve different purposes: pre-release validates completeness, security validates risk, review validates ongoing health.

**Last revised:** 2026-05-09 (v4.2.0 — Section 12 added for Opus 4.7 patterns; existing item 7.4 corrected to Anthropic-documented 1,536-char limit).

### Section equivalence across the three checklists

The same Opus 4.7 patterns are tracked in three places with intentionally-different numbering (each checklist serves a different audience and lifecycle stage). Cross-reference table:

| Concept | pre-release (this file, skills) | review (skills, ongoing health) | agent-pre-release (agents) |
|---------|---------------------------------|----------------------------------|------------------------------|
| Description voice (no first-person) | 12.1 | 8.1 | (skills only) |
| Description triggers (specific phrases; ≥3 = plugin convention) | 12.2 | 8.2 | (skills only) |
| Verify scaffolding cleanup | 12.3 | 8.3 | 13.5 |
| Explicit fan-out | 12.4 | 8.4 | (skills only) |
| Per-subagent overrides | 12.5 | 8.5 | (skills only) |
| Find-vs-filter decoupled | 12.6 | 8.6 | (skills only) |
| Deprecated APIs (4.7 400-error) | 12.7 (BLOCKING) | 8.7 (CRITICAL) | 13.3 + 13.4 (BLOCKING) |
| Effort field present | (n/a — skills inherit from agents) | (n/a) | 13.1 |
| Model field present | (n/a) | (n/a) | 13.2 |

---

## Section 1: Architectural Compliance (8 items) - CRITICAL

**ALL items MUST pass. Any failure blocks release.**

- [ ] **1.1 No skill references:** Skill does NOT reference other skills
- [ ] **1.2 Valid agent sources:** Skill only uses agents from valid sources:
  - **builtin:** Core agents (Explore, Plan, claude-code-guide, general-purpose) + any additional user-configured builtin agents
  - **shared:** Files in `agents/*.md` (e.g., `agents/research-agent.md`)
- [ ] **1.3 Agents table present:** Agents table exists with Source column
- [ ] **1.4 Orchestrator pattern:** Skill delegates ALL tasks to agents, does not execute directly
- [ ] **1.5 Input conditions per step:** EVERY step has input conditions section
- [ ] **1.6 Pre-step validation per step:** EVERY step verifies conditions before proceeding
- [ ] **1.7 Post-step validation where required:** Every step that produces irreversible side effects (file write, agent file creation, breaking change) has validation after execution. Exploratory steps (discovery, matching, design) MAY skip if Opus 4.7 self-verification suffices — mirrors SKILL.md Critical Architectural Rule 9 wording.
- [ ] **1.8 Quality gates per step:** EVERY step has quality gate with retry logic

**Section 1 Score:** ____ / 8 (ALL must pass)

---

## Section 2: Agent Design (6 items)

- [ ] **2.1 Single responsibility:** Each agent has exactly ONE clear purpose
- [ ] **2.2 Input contract:** Each agent has defined inputs with validation rules
- [ ] **2.3 Output contract:** Each agent has defined outputs with types
- [ ] **2.4 Agent quality gates:** Each agent has output validation criteria
- [ ] **2.5 Token efficiency:** Agents within budget (simple <500, medium <800, complex <1200)
- [ ] **2.6 Naming convention:** Agents follow verb-noun pattern (e.g., `validate-input.md`)

**Section 2 Score:** ____ / 6

---

## Section 3: Workflow Validation (6 items)

- [ ] **3.1 Clear workflow:** Workflow has logical, numbered steps
- [ ] **3.2 Step dependencies:** Each step references required previous steps
- [ ] **3.3 Blocking conditions:** Input conditions use "STOP if" language
- [ ] **3.4 Retry logic:** Quality gates specify max 3 retries
- [ ] **3.5 Escalation path:** After retries, escalation to user defined
- [ ] **3.6 Override option:** User can override with documented justification

**Section 3 Score:** ____ / 6

---

## Section 4: Todo List Compliance (4 items)

- [ ] **4.1 Todo requirement stated:** SKILL.md includes todo list requirements
- [ ] **4.2 Initial todo creation:** Workflow requires todo list at start
- [ ] **4.3 Step tracking:** Each step updates todo status
- [ ] **4.4 MANDATORY language:** Uses "ALWAYS", "MANDATORY", "No exceptions"

**Section 4 Score:** ____ / 4

---

## Section 5: Requirements Gathering (4 items) - BLOCKING

**ALL items MUST pass. Any failure blocks release.**

- [ ] **5.1 Trigger conditions defined:** Skill specifies when to gather requirements (BLOCKING)
- [ ] **5.2 Questionnaire format:** Questions use options table with Rec column
- [ ] **5.3 Recommendations present:** Every question has one **✓** recommended option
- [ ] **5.4 No skipping:** Skill requires explicit answers (no defaults accepted)

**Section 5 Score:** ____ / 4 (5.1 MUST pass)

---

## Section 6: Guardrails (5 items)

- [ ] **6.1 Critical rules section:** SKILL.md has critical rules at top
- [ ] **6.2 Blocking language:** Uses "MUST NOT", "CANNOT", "STOP if"
- [ ] **6.3 Numbered steps:** All workflow steps are numbered
- [ ] **6.4 Validation checkboxes:** Steps use checkbox format for conditions
- [ ] **6.5 Rules repeated:** Critical rules restated in relevant sections

**Section 6 Score:** ____ / 5

---

## Section 7: Metadata (6 items)

- [ ] **7.1 Name format:** Gerund form (verb+-ing), lowercase, hyphens only
- [ ] **7.2 Name length:** 64 characters or fewer
- [ ] **7.3 Description present:** Non-empty description in frontmatter
- [ ] **7.4 Description length:** Combined `description` + `when_to_use` ≤ 1,536 characters (Anthropic-documented truncation limit per https://code.claude.com/docs/en/skills)
- [ ] **7.5 Description voice:** Third person (NOT "I can help you...")
- [ ] **7.6 Description content:** Includes "what it does" AND "when to use it"

**Section 7 Score:** ____ / 6

---

## Section 8: Structure (6 items)

- [ ] **8.1 ALL files under 500 lines:** Every .md file in skill directory (BLOCKING)
- [ ] **8.2 File references:** One level deep only
- [ ] **8.3 Path separators:** Forward slashes only
- [ ] **8.4 Referenced files exist:** All files mentioned are present
- [ ] **8.5 No orphan files:** All files are referenced
- [ ] **8.6 Oversized files handled:** Files >500 lines split or compacted

**Section 8 Score:** ____ / 6

---

## Section 9: Content (6 items)

- [ ] **9.1 Workflow present:** Clear steps for Claude to follow
- [ ] **9.2 Steps numbered:** Workflow uses explicit numbered steps
- [ ] **9.3 Examples included:** At least 2 examples with input and output
- [ ] **9.4 Examples realistic:** Examples represent actual use cases
- [ ] **9.5 Anti-patterns documented:** Common mistakes listed
- [ ] **9.6 No placeholder content:** All [TODO] or [PLACEHOLDER] replaced

**Section 9 Score:** ____ / 6

---

## Section 10: Testing (5 items)

- [ ] **10.1 Direct invocation tested:** Skill works when explicitly called
- [ ] **10.2 Auto-discovery tested:** Skill triggers from relevant questions
- [ ] **10.3 Haiku compatible:** Instructions explicit enough for simplest model
- [ ] **10.4 Quality gates tested:** Intentionally failed steps to verify gates
- [ ] **10.5 Todo tracking tested:** Verified todos created and updated

**Section 10 Score:** ____ / 5

---

## Section 11: CC 2.1 frontmatter validation (6 items)

- [ ] **11.1 Frontmatter fields typed:** CC 2.1 frontmatter fields (if used) are correctly typed
- [ ] **11.2 Model field valid:** `model` field uses valid IDs: `opus`, `sonnet`, `haiku`, or `inherit`
- [ ] **11.3 Context field valid:** `context` field is `fork` or `shared` (not other values)
- [ ] **11.4 Allowed-tools valid:** `allowed-tools` lists only valid tool names
- [ ] **11.5 Progressive disclosure:** Progressive disclosure followed – SKILL.md ≤2% context budget
- [ ] **11.6 No legacy model IDs:** Correct model IDs used (no legacy `claude-3-*` or `claude-opus-4-0`)

**Section 11 Score:** ____ / 6

---

## Section 12: Opus 4.7 Patterns (7 items, weighted, sums to 8.0)

**Added 2026-05-09 (v4.2.0). Soft-blocking initially: Section 1 still ALL-required, but Section 12 single-item failures warn rather than block. Promote to hard-blocking in v4.3.0 once sibling cascade is complete.**

**Pattern source mix:** items 12.1-12.5, 12.7 are Anthropic-published guidance (cited inline). Item 12.6 is community-observed and labeled as such — verified against Opus 4.7 migration guide but not authoritatively documented as a pattern.

- [ ] **12.1 Description voice:** Third-person, no "I can help" / "You can use" / "I'll help" first-person prose [weight: 1.0, severity: High]
- [ ] **12.2 Description triggers:** Specific quoted activation phrases in `when_to_use` block (Anthropic requires "specific triggers" — see skill-creator/SKILL.md). **Plugin convention: ≥3 phrases** as an activation-reliability heuristic; failing the count alone is a soft warn, not a release blocker. No filler word repetition ("comprehensive", "detailed", "thorough"). [weight: 1.0, severity: High]
- [ ] **12.3 Verify scaffolding cleanup:** Skill body does NOT mandate "always verify/double-check before returning" on every step. Per Anthropic 4.7 migration guide: *"If existing prompts have mitigations in these areas, try removing that scaffolding and re-baselining."* [weight: 1.5, severity: High]
- [ ] **12.4 Explicit fan-out:** Where multiple agents could run in parallel, prose says so explicitly (e.g. "spawn parallel subagents for each item"). 4.7 defaults to sequential delegation; explicit fan-out language is required to enable concurrent Task calls. [weight: 1.0, severity: High]
- [ ] **12.5 Per-subagent overrides:** Agents table includes Effort and Model columns when overrides apply (or note explicitly that all inherit). [weight: 1.0, severity: Medium]
- [ ] **12.6 Find-vs-filter decoupled:** Any reviewer-shaped skill enumerates findings before filtering. *Community-observed pattern (not Anthropic-documented):* Opus 4.7 follows "report only critical" instructions literally; mid-severity findings may be silently dropped if filtered at find-time. Decoupling preserves the long tail. **Detection note:** semantic check required, not pure regex — additive curation ("Quick Wins: top 3" after a complete enumeration) PASSES; exclusionary filtering ("Output: top 3 critical only") FAILS. [weight: 1.5, severity: High]
- [ ] **12.7 No deprecated thinking config:** No `thinking: {type: "enabled", budget_tokens: N}` in agent prompts (use `{type: "adaptive"}` + effort). No `temperature`, `top_p`, `top_k` in agent code (Anthropic-documented 400 error on Opus 4.7 per migration-guide breaking changes). [weight: 1.0, severity: High]

### N/A handling (added per Phase 0 pilot finding 1)

Items 12.4 and 12.5 are valid-but-N/A for focused single-purpose skills (no parallel work, no agent delegation). Mark N/A in those cases — N/A items contribute 0 to numerator AND 0 to denominator (removed from the scoring set, not zero-scored).

| Item | Applicability rule |
|------|--------------------|
| 12.1 voice | Always applies |
| 12.2 triggers | Always applies (Anthropic requires specific triggers; ≥3-phrase count is plugin convention) |
| 12.3 scaffolding cleanup | Always applies |
| 12.4 fan-out | N/A if skill is single-threaded by design and has no parallel-eligible step |
| 12.5 per-subagent overrides | N/A if skill does not delegate to subagents (no Agents table) |
| 12.6 find-vs-filter | Required for any reviewer-shaped skill; N/A otherwise |
| 12.7 deprecated APIs | Always applies (negative test) |

**Effective Section 12 max** (sum of applicable items by shape):

- **Focused** (no fan-out, no agents, not a reviewer): 4.5 (items 12.1+12.2+12.3+12.7 = 1.0+1.0+1.5+1.0 = 4.5)
- **Focused-reviewer** (no fan-out, no agents, IS a reviewer): 6.0 (4.5 + 12.6 = 6.0)
- **Orchestrator** (full applicability — all 7 items): 8.0 (1.0+1.0+1.5+1.0+1.0+1.5+1.0 = 8.0)
- **Pass threshold:** ≥95% of applicable items, conservatively rounded down. Concrete: focused 63/66.5 (94.7%), focused-reviewer 64/68 (94.1%), orchestrator 66/70 (94.3%).

ms-validator determines `skill_shape` per its workflow Step 1a decision tree before evaluating Section 12.

**Section 12 Score:** ____ / ____ (numerator over applicable max)

---

## Scoring Summary

| Section | Score | Max | Weight |
|---------|-------|-----|--------|
| 1. Architectural Compliance | | 8 | CRITICAL |
| 2. Agent Design | | 6 | High |
| 3. Workflow Validation | | 6 | High |
| 4. Todo List Compliance | | 4 | High |
| 5. Requirements Gathering | | 4 | High |
| 6. Guardrails | | 5 | High |
| 7. Metadata | | 6 | Medium |
| 8. Structure | | 6 | Medium |
| 9. Content | | 6 | Medium |
| 10. Testing | | 5 | Medium |
| 11. CC 2.1 Frontmatter | | 6 | High |
| 12. Opus 4.7 Patterns | | 4.5/6.0/8.0 (shape-dependent) | High (soft-blocking) |
| **TOTAL** | | **66.5/68.0/70.0** | |

---

## Pass Criteria

**ALL skills MUST meet public-grade standards. No exceptions.**

| Skill shape | Total max | Pass threshold |
|-------------|-----------|----------------|
| Focused (no fan-out, no agents, not reviewer) | 66.5 | 63/66.5 (~94.7%) |
| Focused reviewer (no fan-out, no agents, IS reviewer) | 68.0 | 64/68.0 (~94.1%) |
| Orchestrator (full Section 12 applicability) | 70.0 | 66/70.0 (~94.3%) |

The original 59/62 ratio (95.16%) is approximately preserved across all shapes.

### Automatic Fail Conditions

Regardless of total score, **FAIL** if ANY of these:
- **ANY item in Section 1 (Architectural Compliance) fails**
- Item 2.1 (Single responsibility) fails
- Item 3.3 (Blocking conditions) fails
- Item 4.1 (Todo requirement) fails
- **Item 5.1 (Trigger conditions for Q&A) fails**
- **Item 12.7 (Deprecated APIs) fails** — using deprecated APIs causes runtime 400 errors on Opus 4.7

**Section 12 soft-blocking caveat (v4.2.0 only):** items 12.1-12.6 individual failures warn but do not block release. The total Section 12 score still contributes to the overall threshold. Promote to hard-blocking in v4.3.0.

---

## Required for Pass

These items MUST pass regardless of total score:

### Architectural (ALL required)
- 1.1 No skill references
- 1.2 Valid agent sources (builtin/shared)
- 1.3 Agents table present with Source column
- 1.4 Orchestrator pattern
- 1.5-1.8 All validation requirements

### Requirements Gathering (required)
- 5.1 Trigger conditions defined (when to gather requirements)

### Core
- 7.1 Name format
- 7.3 Description present
- 8.1 ALL files under 500 lines
- 9.1 Workflow present
- 9.3 Examples included

### Opus 4.7 (added 2026-05-09)
- 12.7 No deprecated APIs (causes runtime 400 error on Opus 4.7)

---

## Common Issues and Fixes

| Issue | Section | Fix |
|-------|---------|-----|
| No agents table | 1.3 | Add agents table with Source column |
| Direct execution | 1.4 | Delegate all tasks to agents |
| Missing input conditions | 1.5 | Add input conditions to every step |
| No post-step validation | 1.7 | Add validation after every step |
| No quality gates | 1.8 | Add retry logic to every step |
| Multi-purpose agents | 2.1 | Split into single-responsibility agents |
| No todo requirement | 4.1 | Add todo list requirements section |
| No requirements gathering | 5.1 | Add trigger conditions for requirements |
| Missing guardrails | 6.2 | Add blocking language (MUST NOT, STOP) |
| Skill references found | 1.1 | Remove all cross-skill references |
| First-person voice in description | 12.1 | Reword: "I can help" → third-person; "Use when the user..." pattern |
| <3 trigger phrases (plugin convention) | 12.2 | Add specific activation phrases to `when_to_use` block; aim for ≥3 for activation reliability |
| Always-verify scaffolding | 12.3 | Strip "verify before returning" rituals; keep only on irreversible steps |
| Implicit fan-out | 12.4 | Spell out parallel: "spawn parallel subagents — one per item — in same turn" |
| Filter at find-time | 12.6 | Enumerate ALL findings first, filter in second pass |
| `temperature` / `top_p` / `top_k` | 12.7 | Remove (causes 400 error on Opus 4.7) |
| Fixed `budget_tokens` | 12.7 | Replace with `{type: "adaptive"}` + `effort` field |

---

## Quality Standard

**Every skill is treated as public-grade.** Complete ALL sections with full rigor.

Requirements:
- Minimum passing score: 95% of applicable max (varies by skill shape — see Pass Criteria table above)
- ALL Section 1 (Architectural Compliance) items MUST pass
- ALL "Required for Pass" items MUST pass (including 12.7 deprecated APIs)
- No exceptions for "personal" or "team" use
