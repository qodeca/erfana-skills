# Skill Review Checklist

Use this checklist when auditing or evaluating existing skills.

**ALL skills are reviewed at public-grade standards. No exceptions.**

**Scoring note:** This checklist uses a 40-point scale for audits as of 2026-05-09 (quick: 10 points, full: 40 points). Section 8 (Opus 4.7 Patterns) was added in v4.2.0. The pre-release-checklist.md uses a 70-point scale for completeness. The security-checklist.md uses a 93-point weighted scale for risk. Different scales serve different purposes: review validates ongoing health, pre-release validates completeness, security validates risk.

**Last revised:** 2026-05-09 (v4.2.0 — Section 8 Opus 4.7 patterns added; 1024 → 1,536-char limit corrected).

### Section equivalence across the three checklists

Same Opus 4.7 patterns; different numbering by audience. Cross-reference:

| Concept | pre-release (skills) | review (this file, skills ongoing health) | agent-pre-release (agents) |
|---------|---------------------|---------------------------------------------|------------------------------|
| Description voice | 12.1 | 8.1 | (skills only) |
| Description triggers | 12.2 | 8.2 | (skills only) |
| Verify scaffolding cleanup | 12.3 | 8.3 | 13.5 |
| Explicit fan-out | 12.4 | 8.4 | (skills only) |
| Per-subagent overrides | 12.5 | 8.5 | (skills only) |
| Find-vs-filter decoupled | 12.6 | 8.6 | (skills only) |
| Deprecated APIs (4.7 400-error) | 12.7 | 8.7 (CRITICAL) | 13.3 + 13.4 |
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

### Opus 4.7 (added 2026-05-09)

- [ ] No deprecated APIs (no `temperature`/`top_p`/`top_k`/fixed `budget_tokens`) — runtime 400 error on Opus 4.7

### Quick Score

Count checked items: ____ / 10

| Score | Status |
|-------|--------|
| 10 | Healthy |
| 8-9 | Minor issues |
| 5-7 | Needs attention |
| 0-4 | Critical review needed |

**If ANY architectural item or 4.7 deprecated-API item fails: CRITICAL review needed regardless of score.**

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
- [ ] **Post-step validation:** Every step has validation
- [ ] **Quality gates:** Every step has retry/escalate logic
- [ ] **Todo requirements:** Todo list usage is mandatory
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

### 8. Opus 4.7 Patterns (added 2026-05-09)

Mirrors Section 12 of pre-release-checklist.md. N/A handling: items 8.4 and 8.5 are N/A for focused single-purpose skills (no parallel work, no agent delegation). Item 8.6 is N/A for non-reviewer skills.

- [ ] **8.1 Description voice:** Third-person, no "I can help" / "You can use" / "I'll help"
- [ ] **8.2 Description triggers:** ≥3 concrete activation phrases in `when_to_use` block
- [ ] **8.3 Verify scaffolding cleanup:** Skill body does NOT mandate "always verify before returning" on every step
- [ ] **8.4 Explicit fan-out:** Where parallel work applies, prose says so (or N/A for single-threaded skills)
- [ ] **8.5 Per-subagent overrides:** Agents table has Effort/Model columns when applicable (or N/A for skills with no agents)
- [ ] **8.6 Find-vs-filter decoupled:** Reviewer skills enumerate findings before filtering (or N/A for non-reviewers). **Detection note:** semantic check, not regex — additive curation passes; exclusionary filtering fails.
- [ ] **8.7 No deprecated APIs:** No `temperature` / `top_p` / `top_k` / fixed `budget_tokens` (causes runtime 400 error on Opus 4.7)

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

- Quick Score: ____ / 8
- Full Score: ____ / 32 (if applicable)

### Architectural Compliance

[ ] PASS - All 8 items checked
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
| New Claude model released | Cross-Model section |
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
| Missing todo requirements | Medium | Add mandatory todo section |
| Outdated examples | Medium | Update to match behavior |
| Haiku incompatible | Low | Add explicit steps |
