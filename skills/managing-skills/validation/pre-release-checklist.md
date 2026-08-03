# Pre-Release Checklist

Complete validation before releasing or deploying a skill.

**Scoring note:** This checklist uses a 70-point scale (62 base + Section 12 weighted at 8.0). Section 12 items support N/A scoring for shape-specific patterns (focused vs orchestrator skills). The security-checklist.md uses a 93-point weighted scale (sections have 1x-3x multipliers). The review-checklist.md uses a 40-point scale for audits. Different scales serve different purposes: pre-release validates completeness, security validates risk, review validates ongoing health.

**Last revised:** 2026-08-02 (v6.3.0 — Section 12 revised for the Claude 5 family: 12.4 repurposed as delegation calibration, 12.7 extended with the reasoning-display ban; Section 4 reworded to proportionate progress tracking. Originally added 2026-05-09, v4.2.0).

### Section equivalence across the three checklists

The same model-pattern set is tracked in three places with intentionally-different numbering (each checklist serves a different audience and lifecycle stage). Cross-reference table:

| Concept | pre-release (this file, skills) | review (skills, ongoing health) | agent-pre-release (agents) |
|---------|---------------------------------|----------------------------------|------------------------------|
| Description voice (no first-person) | 12.1 | 8.1 | (skills only) |
| Description triggers (specific phrases; ≥3 = plugin convention) | 12.2 | 8.2 | (skills only) |
| Verify scaffolding cleanup | 12.3 | 8.3 | 13.5 |
| Delegation calibration | 12.4 | 8.4 | (skills only) |
| Per-subagent overrides | 12.5 | 8.5 | (skills only) |
| Find-vs-filter decoupled | 12.6 | 8.6 | (skills only) |
| Deprecated APIs + reasoning-display | 12.7 (BLOCKING) | 8.7 (CRITICAL) | 13.3 + 13.4 (BLOCKING); reasoning-display in 13.5 |
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
- [ ] **1.6 Pre-step validation where it matters:** Steps that consume prior-step outputs or precede irreversible side effects verify input conditions before proceeding; lightweight exploratory steps MAY proceed without ritual pre-checks — mirrors SKILL.md Critical Architectural Rule 8 wording
- [ ] **1.7 Post-step validation where required:** Every step that produces irreversible side effects (file write, agent file creation, breaking change) has validation after execution. Exploratory steps (discovery, matching, design) MAY skip if the model's self-verification suffices (default on Opus 4.7+ and the Claude 5 family) — mirrors SKILL.md Critical Architectural Rule 9 wording.
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

## Section 4: Progress Tracking (4 items)

- [ ] **4.1 Progress tracking stated:** SKILL.md states how multi-phase operations surface progress (todo list or equivalent)
- [ ] **4.2 Tracking for long operations:** Multi-phase operations create a task/todo list at start; short single-pass operations MAY skip
- [ ] **4.3 Phase-boundary updates:** Progress status is updated at phase boundaries (not mandated per micro-step)
- [ ] **4.4 Proportionate language:** Tracking guidance avoids blanket "ALWAYS"/"MANDATORY"/"No exceptions" rituals; hard language is reserved for irreversible or destructive steps

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
- [ ] **6.5 Rules stated once:** Critical rules live in one authoritative block at the top, referenced (not duplicated) elsewhere — repetition creates conflicting voices when copies drift

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
- [ ] **10.5 Progress tracking tested:** Verified multi-phase operations surface progress (todo list or equivalent); short operations verified not to over-track

**Section 10 Score:** ____ / 5

---

## Section 11: CC 2.1 frontmatter validation (6 items)

- [ ] **11.1 Frontmatter fields typed:** CC 2.1 frontmatter fields (if used) are correctly typed
- [ ] **11.2 Model field valid:** `model` field uses valid IDs: `opus`, `sonnet`, `haiku`, or `inherit`
- [ ] **11.3 Context field valid:** `context` field is `fork` or `shared` (not other values)
- [ ] **11.4 Allowed-tools valid:** `allowed-tools` lists only valid tool names
- [ ] **11.5 Progressive disclosure:** Progressive disclosure followed – SKILL.md ≤2% context budget
- [ ] **11.6 No retired model IDs:** Correct model IDs used — none of the retired `claude-3-*`, `claude-opus-4-0`, `claude-sonnet-4-0`, `claude-opus-4-20250514`, `claude-sonnet-4-20250514`; prefer the `opus`/`sonnet`/`haiku` aliases

**Section 11 Score:** ____ / 6

---

## Section 12: Claude 5 Model Patterns (7 items, weighted, sums to 8.0)

**Added 2026-05-09 (v4.2.0) as "Opus 4.7 Patterns"; revised 2026-08-02 (v6.3.0) for the Claude 5 family (Opus 5, Fable 5). Soft-blocking: Section 1 still ALL-required, but Section 12 single-item failures warn rather than block (12.7 excepted — see Automatic Fail Conditions).**

**Pattern source mix:** items 12.1-12.5, 12.7 are Anthropic-published guidance (Claude 5 prompting + context-engineering guides, cited inline). Item 12.6 is community-observed on Opus 4.7 and confirmed on Opus 5, but not authoritatively documented as a pattern.

- [ ] **12.1 Description voice:** Third-person, no "I can help" / "You can use" / "I'll help" first-person prose [weight: 1.0, severity: High]
- [ ] **12.2 Description triggers:** Specific quoted activation phrases in `when_to_use` block (Anthropic requires "specific triggers" — see skill-creator/SKILL.md). **Plugin convention: ≥3 phrases** as an activation-reliability heuristic; failing the count alone is a soft warn, not a release blocker. No filler word repetition ("comprehensive", "detailed", "thorough"). [weight: 1.0, severity: High]
- [ ] **12.3 Verify scaffolding cleanup:** Skill body does NOT mandate "always verify/double-check before returning" on every step. Per Anthropic migration guidance: *"If existing prompts have mitigations in these areas, try removing that scaffolding and re-baselining."* Claude 5 models over-verify when told to verify — the mandate now costs tokens without improving quality. [weight: 1.5, severity: High]
- [ ] **12.4 Delegation calibration:** Delegation prose is proportionate. Parallel fan-out is reserved for genuinely independent, sizeable work items; the skill does NOT mandate spawning subagents for small or inherently sequential steps. Claude 5 models delegate readily by default — over-prescribed fan-out ("always spawn parallel subagents") wastes tokens and fragments context. Explicit fan-out language remains appropriate where items are truly independent (e.g. per-file reviews, per-dimension audits). [weight: 1.0, severity: High]
- [ ] **12.5 Per-subagent overrides:** Agents table includes Effort and Model columns when overrides apply (or note explicitly that all inherit). [weight: 1.0, severity: Medium]
- [ ] **12.6 Find-vs-filter decoupled:** Any reviewer-shaped skill enumerates findings before filtering. *Community-observed pattern (not Anthropic-documented):* Opus 4.7+ and Claude 5 models follow "report only critical" instructions literally; mid-severity findings may be silently dropped if filtered at find-time. Decoupling preserves the long tail. **Detection note:** semantic check required, not pure regex — additive curation ("Quick Wins: top 3" after a complete enumeration) PASSES; exclusionary filtering ("Output: top 3 critical only") FAILS. [weight: 1.5, severity: High]
- [ ] **12.7 No deprecated config or reasoning-display instructions:** No fixed `thinking: {type: "enabled", budget_tokens: N}` in Claude-5-model agent prompts (unsupported on Fable 5 / Opus 5 / Sonnet 5; Haiku 4.5 still supports it — use `{type: "adaptive"}` + effort on Claude 5 models). No `temperature`, `top_p`, `top_k` in agent code (Anthropic-documented 400 error on Claude Opus 4.7 and later). No prose instructing a model to surface its internal reasoning — phrases like `show your reasoning`, `reproduce your thinking`, `explain your chain of thought`, or config like `thinking.display: visible` — because these trip the `reasoning_extraction` refusal classifier on Claude Fable 5 and Claude Opus 5 (`stop_reason: "refusal"`; where fallback is configured, requests re-route to Claude Opus 4.8). Safe alternative: request evidence and justification in the structured *output* ("cite the file and line that drove the decision"). Author-filled `<critical_thinking>` design blocks in agent files are exempt (static authored content, not runtime instructions). [weight: 1.0, severity: High]

### N/A handling (added per Phase 0 pilot finding 1)

Items 12.4 and 12.5 are valid-but-N/A for focused single-purpose skills (no parallel work, no agent delegation). Mark N/A in those cases — N/A items contribute 0 to numerator AND 0 to denominator (removed from the scoring set, not zero-scored).

| Item | Applicability rule |
|------|--------------------|
| 12.1 voice | Always applies |
| 12.2 triggers | Always applies (Anthropic requires specific triggers; ≥3-phrase count is plugin convention) |
| 12.3 scaffolding cleanup | Always applies |
| 12.4 delegation calibration | N/A if skill is single-threaded by design and has no parallel-eligible step (no delegation prose to calibrate) |
| 12.5 per-subagent overrides | N/A if skill does not delegate to subagents (no Agents table) |
| 12.6 find-vs-filter | Required for any reviewer-shaped skill; N/A otherwise |
| 12.7 deprecated APIs + reasoning-display | Always applies (negative test) |

**Effective Section 12 max** (sum of applicable items by shape):

- **Focused** (no fan-out, no agents, not a reviewer): 4.5 (items 12.1+12.2+12.3+12.7 = 1.0+1.0+1.5+1.0 = 4.5)
- **Focused-reviewer** (no fan-out, no agents, IS a reviewer): 6.0 (4.5 + 12.6 = 6.0)
- **Orchestrator** (full applicability — all 7 items): 8.0 (1.0+1.0+1.5+1.0+1.0+1.5+1.0 = 8.0). A reviewer-shaped skill that delegates to agents is scored as orchestrator — the shape is decided by delegation, not by reviewer-ness.
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
| 4. Progress Tracking | | 4 | High |
| 5. Requirements Gathering | | 4 | High |
| 6. Guardrails | | 5 | High |
| 7. Metadata | | 6 | Medium |
| 8. Structure | | 6 | Medium |
| 9. Content | | 6 | Medium |
| 10. Testing | | 5 | Medium |
| 11. CC 2.1 Frontmatter | | 6 | High |
| 12. Claude 5 Model Patterns | | 4.5/6.0/8.0 (shape-dependent) | High (soft-blocking) |
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
- Item 4.1 (Progress tracking stated) fails
- **Item 5.1 (Trigger conditions for Q&A) fails**
- **Item 12.7 (Deprecated APIs + reasoning-display) fails** — deprecated APIs cause runtime 400 errors on Opus 4.7 and later; reasoning-display instructions trip the Claude 5 `reasoning_extraction` refusal classifier

**Section 12 soft-blocking caveat:** items 12.1-12.6 individual failures warn but do not block release. The total Section 12 score still contributes to the overall threshold.

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

### Claude 5 model patterns (added 2026-05-09, revised 2026-08-02)
- 12.7 No deprecated APIs (runtime 400 error on Opus 4.7 and later) and no reasoning-display instructions (Claude 5 `reasoning_extraction` refusal classifier)

---

## Common Issues and Fixes

| Issue | Section | Fix |
|-------|---------|-----|
| No agents table | 1.3 | Add agents table with Source column |
| Direct execution | 1.4 | Delegate all tasks to agents |
| Missing input conditions | 1.5 | Add input conditions to every step |
| No post-step validation | 1.7 | Add validation after irreversible steps (file writes, breaking changes) |
| No quality gates | 1.8 | Add retry logic to every step |
| Multi-purpose agents | 2.1 | Split into single-responsibility agents |
| No progress tracking statement | 4.1 | State how multi-phase operations surface progress |
| No requirements gathering | 5.1 | Add trigger conditions for requirements |
| Missing guardrails | 6.2 | Add blocking language (MUST NOT, STOP) |
| Skill references found | 1.1 | Remove all cross-skill references |
| First-person voice in description | 12.1 | Reword: "I can help" → third-person; "Use when the user..." pattern |
| <3 trigger phrases (plugin convention) | 12.2 | Add specific activation phrases to `when_to_use` block; aim for ≥3 for activation reliability |
| Always-verify scaffolding | 12.3 | Strip "verify before returning" rituals; keep only on irreversible steps |
| Over-prescribed fan-out | 12.4 | Reserve parallel fan-out for genuinely independent, sizeable items; drop mandated spawning on small or sequential work |
| Filter at find-time | 12.6 | Enumerate ALL findings first, filter in second pass |
| `temperature` / `top_p` / `top_k` | 12.7 | Remove (causes 400 error on Opus 4.7 and later) |
| Fixed `budget_tokens` on a Claude 5 model | 12.7 | Replace with `{type: "adaptive"}` + `effort` field (Haiku 4.5 exempt) |
| Reasoning-display instruction | 12.7 | Remove `show your reasoning` / `display: visible` prose; request evidence in structured output instead |

---

## Quality Standard

**Every skill is treated as public-grade.** Complete ALL sections with full rigor.

Requirements:
- Minimum passing score: 95% of applicable max (varies by skill shape — see Pass Criteria table above)
- ALL Section 1 (Architectural Compliance) items MUST pass
- ALL "Required for Pass" items MUST pass (including 12.7 deprecated APIs)
- No exceptions for "personal" or "team" use
