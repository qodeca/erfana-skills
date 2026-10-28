# Implement Operation – Phases Overview

Quick-summary tables for all 13 implement phases (0-12) and their gates – 13 phase gates (QG-0 through QG-12) plus 3 sub-gates that run inside Phases 4 and 11 per the run's `review_level` (QG-4a / QG-4b above `none`, QG-11a at `full` only). Hoisted from `operations/implement.md` in v4.2.2 to keep that file under the Rule #16 ≤500-line cap.

**Each phase's canonical detail** (full execution sequence, agent dispatch, error handling, retry logic) lives in the per-phase file under `phases/0-preflight.md` through `phases/12-finalization.md`. This file provides the quick-reference index used by Phase 1 agent selection and by orchestrator-level workflow decisions.

**Every phase additionally outputs a task-list advance** – its own item and its `QG-N quality gate` item closed, the successor phase opened with its gate item appended. It is a declared output artifact in each phase file, not an optional courtesy; definitions live in [../reference/progress-tracking.md](../reference/progress-tracking.md). The per-phase rows below omit it to stay scannable.

---

## Phases

### Phase 0: Pre-flight
**Details:** See [phases/0-preflight.md](../phases/0-preflight.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | Git repo exists, gh CLI authenticated |
| Output Artifacts | Feature branch, validated issue, `tier`, `spec_maturity`, `has_ui_impact`, stack commands |
| Quality Gate | QG-0 (Mandatory) |

**Quick Summary:**
- Validate issue exists and is OPEN
- Verify clean working directory
- Run baseline tests
- Create feature branch

---

### Phase 1: Agent selection

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-0 = PASS |
| Agents | discover-agents, match-agents |
| Output Artifacts | Agent selection plan |
| Quality Gate | QG-1 (Automated) |

**Purpose:**
Dynamically select agents for all subsequent phases based on capability matching instead of hardcoded mappings.

**Execution:**

1. **Discover available agents**
   ```
   Delegate to: mi-agent-discoverer (shared agent at agents/)
   ```
   - Scan builtin agents (Explore, Plan, architecture-reviewer, etc.)
   - Scan shared agents (agents/*.md)
   - Scan dedicated agents (./agents/*.md)
   - Extract capabilities from YAML frontmatter

2. **Match phase requirements**
   ```
   Delegate to: mi-agent-matcher (shared agent at agents/)
   ```
   - Load phase requirements from reference/implement-phase-requirements.md
   - Classify each available agent against each phase's requirements **qualitatively** (no numeric percentage – see SKILL.md "Selection algorithm"):
     ```
     full     – declared capabilities cover ALL required capabilities AND tools suffice
     partial  – some but not all required capabilities covered
     none     – no required capability covered
     ```
   - The `score` field `mi-agent-matcher` returns is an advisory ranking signal for ordering candidates within a coverage class; never a reported confidence figure or a gate threshold
   - Apply selection rules (autonomous, non-blocking – SKILL.md rule 16):
     - Full coverage → auto-select, record it
     - Partial coverage → auto-select the best-scoring candidate (or default-map agent), record the choice + rationale
     - No coverage → fall back to direct execution (if phase allows) or the best general-purpose / default agent, record the fallback

3. **Record the selection plan**
   No user prompt. Auto-decide every phase and record a one-line summary; escalate via `needs_user_input` only on a genuine rule-7 contradiction (a hard-required capability no agent can cover).

4. **Store selections**
   Cache agent selections for use in subsequent phases

**Quality Gate QG-1 (Automated, non-blocking):**
- [ ] All phases have agent selection (agent assigned or allow_direct=true)
- [ ] Auto-selections and any fallbacks recorded in the phase summary
- [ ] Selection plan stored for subsequent phases

**Context-aware matching:**
- If issue has `frontend` label → prefer agents with react-developer, react-code-reviewer capabilities
- If issue has `backend` label → prefer agents with nest-developer, nest-code-reviewer capabilities
- If issue has `security` label → prefer agents with security-auditor, security-related capabilities
- If issue has `bug` label → include agents with investigate-bug capability in Phase 1

---

### Phase 2: Business Analysis
**Details:** See [phases/2-business-analysis.md](../phases/2-business-analysis.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-1 = PASS |
| Agent | *selected at 1* |
| Output Artifacts | Research summary, requirements document, filled requirements-clarification template |
| Quality Gate | QG-2 (Judgment – non-blocking) |

**Quick Summary:**
- Research prior art
- Clarify requirements via questionnaire
- Validate acceptance criteria

---

### Phase 3: Discovery
**Details:** See [phases/3-discovery.md](../phases/3-discovery.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-2 = PASS |
| Agent | *selected at 1* |
| Output Artifacts | Affected files list, patterns found, complexity confirmation, re-evaluated `has_ui_impact`, filled research-summary template |
| Quality Gate | QG-3 (Judgment – non-blocking) |

**Quick Summary:**
- Identify affected code areas
- Map dependencies
- Review existing patterns

---

### Phase 4: Architecture
**Details:** See [phases/4-architecture.md](../phases/4-architecture.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-3 = PASS |
| Agent | *selected at 1* |
| Output Artifacts | Implementation plan, test strategy, risk register, UX specification (when `has_ui_impact = true`), embedded design-review findings + resolution record + judgment record (when `deep_review_gates = true`) |
| Quality Gates | QG-4 (Judgment – non-blocking), then QG-4a (Embedded Review) and QG-4b (Judgment) when `deep_review_gates = true` |

**Quick Summary:**
- Design implementation approach
- Architect verifies plan completeness
- Plan recorded (non-blocking) – the run does not wait for user approval
- QG-4a: embedded parallel reviewer fan-out over the design; CRITICAL/HIGH auto-fixed, MED/LOW judged
- QG-4b: internal judgment checkpoint – the judge triages findings; unresolved MUST-FIX trigger an automatic design revision (embedded_loop_iter, max 3 rounds). No user gate

---

### Phase 5: Implementation
**Details:** See [phases/5-implementation.md](../phases/5-implementation.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-4 = PASS, and QG-4a + QG-4b = PASS when `deep_review_gates = true` |
| Agents | *selected at 1* |
| Output Artifacts | Code changes, tests |
| Quality Gate | QG-5 (Automated) |

**Quick Summary:**
- Write code following approved plan
- Write tests for new code
- Verify typecheck and lint pass

---

### Phase 6: Architectural Review
**Details:** See [phases/6-architectural-review.md](../phases/6-architectural-review.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-5 = PASS |
| Agent | *selected at 1* |
| Output Artifacts | Architecture assessment |
| Quality Gate | QG-6 (Judgment – non-blocking) |

**Quick Summary:**
- Validate SOLID principles
- Check coupling/cohesion
- Verify design patterns

---

### Phase 7: Security
**Details:** See [phases/7-security.md](../phases/7-security.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-6 = PASS |
| Agent | *selected at 1* |
| Output Artifacts | Security scan results |
| Quality Gate | QG-7 (Mandatory - NEVER skippable) |

**Quick Summary:**
- Run the stack-detected dependency auditor
- Check for secrets
- Static analysis (T2)
- OWASP verification (T2)

---

### Phase 8: Quality Review
**Details:** See [phases/8-quality-review.md](../phases/8-quality-review.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-7 = PASS |
| Agent | *selected at 1* |
| Output Artifacts | Quality assessment, UX audit report (when `has_ui_impact = true`) |
| Quality Gate | QG-8 (Embedded Review-and-Fix – non-blocking) |

**Quick Summary:**
- Code smell detection
- Complexity analysis
- Maintainability scoring
- Test quality assessment

---

### Phase 9: Verification
**Details:** See [phases/9-verification.md](../phases/9-verification.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-8 = PASS |
| Agent | *selected at 1* |
| Output Artifacts | Verification report |
| Quality Gate | QG-9 (Mandatory) |

**Quick Summary:**
- Compare implementation vs approved plan
- Verify all acceptance criteria met
- Architect confirms VERIFIED

---

### Phase 10: Documentation
**Details:** See [phases/10-documentation.md](../phases/10-documentation.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-9 = PASS |
| Agent | *selected at 1* |
| Output Artifacts | Updated documentation, spec update report (when a spec is linked) |
| Quality Gate | QG-10 (Automated) |

**Quick Summary:**
- Update CLAUDE.md
- Update test counts
- Add JSDoc for new APIs

---

### Phase 11: UAT
**Details:** See [phases/11-uat.md](../phases/11-uat.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-10 = PASS |
| Agent | - (manual) |
| Output Artifacts | User confirmation, `uat_approved_tree` snapshot, embedded review-and-fix findings + resolution record (when `review_level = full`) |
| Quality Gates | QG-11a (Embedded Review-and-Fix, pre-step) when `review_level = full`, then QG-11 (User-Approval for T2, Automated for T1) – **QG-11 is the human acceptance gate; QG-12 then confirms the git actions** |

**Quick Summary:**
- QG-11a: embedded review-AND-fix fan-out over the whole change set, after every other gate has passed; CRITICAL/HIGH auto-fixed, MED/LOW judged, fixes go back through the re-review matrix
- Build project
- User manually tests
- Verify acceptance criteria

---

### Phase 12: Finalization
**Details:** See [phases/12-finalization.md](../phases/12-finalization.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-11 = PASS |
| Agent | *selected at 1* |
| Output Artifacts | Commit, branch management, pre-commit review record |
| Quality Gate | QG-12 (User-Approval) |

**Quick Summary:**
- Run all quality gates (test, typecheck, lint)
- Create commit with proper message
- Branch management (merge/push)

---

## Related

- [implement.md](implement.md) – parent Implement operation (overview, tier system, spec-ready mode)
- [implement-references.md](implement-references.md) – consolidated reference index (phase files + agent registry)
- [phases/0-preflight.md](../phases/0-preflight.md) through [phases/12-finalization.md](../phases/12-finalization.md) – canonical per-phase detail
- [implement-procedures.md](implement-procedures.md) – workflow state diagram, escalation, abort procedure
