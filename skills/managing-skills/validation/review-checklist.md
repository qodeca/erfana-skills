# Skill Review Checklist

Use this checklist when auditing or evaluating existing skills.

**ALL skills are reviewed at public-grade standards. No exceptions.**

**Scoring note:** This checklist uses a 40-point scale for audits as of 2026-05-09 (quick: 10 points, full: 40 points). Section 8 (Claude 5 Model Patterns) was added in v4.2.0 as "Opus 4.7 Patterns". The pre-release-checklist.md uses a 70-point scale for completeness. The security-checklist.md uses a 93-point weighted scale for risk. Different scales serve different purposes: review validates ongoing health, pre-release validates completeness, security validates risk.

**Last revised:** 2026-08-02 (v6.3.0 — Section 8 revised for the Claude 5 family: 8.4 repurposed as delegation calibration, 8.7 extended with the reasoning-display ban. Originally added 2026-05-09, v4.2.0).

### Section equivalence across the three checklists

Same model-pattern set; different numbering by audience. Cross-reference:

| Concept | pre-release (skills) | review (this file, skills ongoing health) | agent-pre-release (agents) |
|---------|---------------------|---------------------------------------------|------------------------------|
| Description voice | 12.1 | 8.1 | (skills only) |
| Description triggers | 12.2 | 8.2 | (skills only) |
| Verify scaffolding cleanup | 12.3 | 8.3 | 13.5 |
| Delegation calibration | 12.4 | 8.4 | (skills only) |
| Per-subagent overrides | 12.5 | 8.5 | (skills only) |
| Find-vs-filter decoupled | 12.6 | 8.6 | (skills only) |
| Deprecated APIs + reasoning-display | 12.7 | 8.7 (CRITICAL) | 13.3 + 13.4; reasoning-display in 13.5 |
| Effort field present | (n/a) | (n/a) | 13.1 |
| Model field present | (n/a) | (n/a) | 13.2 |

---

## Quick Review (5 minutes)

Use for periodic health checks.

### Architectural Compliance (CRITICAL)

- [ ] No references to other skills
- [ ] Valid agent sources (only builtin or shared)
- [ ] Agents table present with Source column
- [ ] Skill acts as orchestrator
- [ ] Q&A requirements defined (when to gather requirements)

### Structure

- [ ] SKILL.md exists and has valid frontmatter
- [ ] Name follows convention (gerund, lowercase, hyphens)
- [ ] Description+when_to_use combined ≤ 1,536 characters (Anthropic-documented limit)
- [ ] ALL files under 500 lines (not just SKILL.md)

### Claude 5 model patterns (added 2026-05-09, revised 2026-08-02)

- [ ] No deprecated APIs (no `temperature`/`top_p`/`top_k`/fixed `budget_tokens` — runtime 400 error on Opus 4.7+) and no reasoning-display instructions (`show your reasoning`, `thinking.display: visible` — silent Fable 5 → Opus 4.8 fallback)

### Quick Score

Count checked items: ____ / 10

| Score | Status |
|-------|--------|
| 10 | Healthy |
| 8-9 | Minor issues |
| 5-7 | Needs attention |
| 0-4 | Critical review needed |

**If ANY architectural item or the deprecated-API/reasoning-display item fails: CRITICAL review needed regardless of score.**

---

## Full Review (30 minutes)

Use quarterly or when issues reported.

### 1. Architectural Compliance Audit (CRITICAL)

- [ ] **No skill references:** Does not reference other skills
- [ ] **Valid agent sources:** Only uses agents from valid sources:
  - **builtin:** Explore, Plan, technical-architect, solution-architect, architecture-reviewer, react-developer, nest-developer, claude-code-guide
  - **shared:** Files in `agents/*.md` (e.g., `agents/research-agent.md`)
- [ ] **Agents table present:** Agents table exists with Source column
- [ ] **Orchestrator pattern:** All tasks delegated to agents
- [ ] **Input conditions:** Every step has input conditions
- [ ] **Post-step validation:** Every irreversible step (file write, agent creation, breaking change) has validation; exploratory steps may rely on model self-verification
- [ ] **Quality gates:** Every irreversible step has retry/escalate logic
- [ ] **Progress tracking:** Multi-phase operations state how they surface progress
- [ ] **Q&A requirements:** Skill defines when/how to gather requirements (BLOCKING)

### 2. Agent Design Audit

- [ ] **Single responsibility:** Each agent has one clear purpose
- [ ] **Input contracts:** All agents have defined inputs
- [ ] **Output contracts:** All agents have defined outputs
- [ ] **Agent quality gates:** Each agent validates its output
- [ ] **Naming convention:** Agents follow verb-noun pattern

### 3. Metadata Audit

- [ ] **Name valid:** Gerund form, lowercase, hyphens, ≤64 chars
- [ ] **Description quality:** Third-person, what + when, ≤1,536 chars combined description+when_to_use (Anthropic-documented limit)
- [ ] **Triggers clear:** Description enables auto-discovery

### 4. Structure Audit

- [ ] **ALL files under 500 lines:** Every .md file (BLOCKING)
- [ ] **References valid:** One level deep only
- [ ] **Paths correct:** Forward slashes, relative paths
- [ ] **Files exist:** All referenced files present
- [ ] **No orphan files:** All files are referenced

### 5. Workflow Audit

- [ ] **Workflow complete:** All steps documented
- [ ] **Steps numbered:** Clear sequence
- [ ] **Blocking language:** Uses "STOP if", "MUST NOT"
- [ ] **Dependencies stated:** Steps reference prerequisites
- [ ] **Retry logic:** Max 3 retries per step
- [ ] **Escalation defined:** User escalation after retries

### 6. Content Audit

- [ ] **Examples adequate:** 2-3 with input/output
- [ ] **Examples current:** Match actual behavior
- [ ] **Anti-patterns present:** Includes architectural violations
- [ ] **No placeholder text:** No [TODO] remaining
- [ ] **Guardrails present:** Critical rules at top

### 7. Cross-Model Audit

- [ ] **Haiku-compatible:** Instructions explicit enough
- [ ] **Output format specified:** Not relying on inference
- [ ] **Checkboxes used:** Validation uses checkbox format

### 8. Claude 5 Model Patterns (added 2026-05-09; revised 2026-08-02)

Mirrors Section 12 of pre-release-checklist.md. N/A handling: items 8.4 and 8.5 are N/A for focused single-purpose skills (no parallel work, no agent delegation). Item 8.6 is N/A for non-reviewer skills.

- [ ] **8.1 Description voice:** Third-person, no "I can help" / "You can use" / "I'll help"
- [ ] **8.2 Description triggers:** ≥3 concrete activation phrases in `when_to_use` block
- [ ] **8.3 Verify scaffolding cleanup:** Skill body does NOT mandate "always verify before returning" on every step
- [ ] **8.4 Delegation calibration:** Fan-out reserved for genuinely independent, sizeable items; no mandated spawning on small or sequential work (or N/A for single-threaded skills)
- [ ] **8.5 Per-subagent overrides:** Agents table has Effort/Model columns when applicable (or N/A for skills with no agents)
- [ ] **8.6 Find-vs-filter decoupled:** Reviewer skills enumerate findings before filtering (or N/A for non-reviewers). **Detection note:** semantic check, not regex — additive curation passes; exclusionary filtering fails.
- [ ] **8.7 No deprecated APIs or reasoning-display:** No `temperature` / `top_p` / `top_k` / fixed `budget_tokens` (runtime 400 error on Opus 4.7+). No prose instructing the model to surface internal reasoning (`show your reasoning`, `thinking.display: visible`) — trips the `reasoning_extraction` classifier on Fable 5. Author-filled `<critical_thinking>` blocks exempt.

### Full Score

Count checked items: ____ / 40

| Score | Status | Action |
|-------|--------|--------|
| 38-40 | Excellent | No action needed |
| 32-37 | Good | Address minor issues |
| 24-31 | Fair | Schedule improvement |
| 12-23 | Poor | Immediate attention |
| 0-11 | Critical | Major rework required |

**If ANY item in Section 1 fails OR item 8.7 fails: Status is CRITICAL regardless of score.**

---

## Review Report Template

```markdown
## Skill Review Report

**Skill:** [skill-name]
**Review Date:** [YYYY-MM-DD]
**Reviewer:** [name]
**Review Type:** Quick / Full

### Scores

- Quick Score: ____ / 10
- Full Score: ____ / 40 (if applicable)

### Architectural Compliance

[ ] PASS - All 9 items checked
[ ] FAIL - Items failed: [list]

### Status

[ ] Healthy - No action needed
[ ] Minor Issues - Fix within 30 days
[ ] Needs Attention - Fix within 7 days
[ ] Critical - Immediate action required (architectural failures)

### Findings

#### Passed
- [Item that passed]

#### Failed
- [ ] [Item that failed] - [Fix needed]

### Action Items

1. [ ] [Specific action with owner]
2. [ ] [Specific action with owner]

### Next Review

Scheduled: [YYYY-MM-DD]
```

---

## Review Triggers

| Trigger | Review Type |
|---------|-------------|
| 30 days since last review | Quick |
| User reports issue | Full |
| New Claude model released | Cross-Model section + Section 8 semantics + model-pattern guides (guides/claude-5-patterns.md, guides/cross-model-guide.md, skill-frontmatter-guide.md model IDs, template effort tables) |
| Before any significant use | Full |
| Architectural concerns raised | Full (Section 1 focus) |

---

## Common Issues Found in Reviews

| Issue | Frequency | Fix |
|-------|-----------|-----|
| No agents table | High | Add agents table with Source column |
| Direct execution | High | Delegate all tasks to agents |
| Missing input conditions | High | Add to every step |
| No quality gates | Medium | Add retry logic |
| Skill references | Medium | Remove all cross-skill references |
| Missing progress tracking statement | Medium | State how multi-phase operations surface progress |
| Outdated examples | Medium | Update to match behavior |
| Haiku incompatible | Low | Add explicit steps |
