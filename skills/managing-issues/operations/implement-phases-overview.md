# Implement Operation – Phases Overview

Quick-summary tables for all 13 implement phases (0-12). Hoisted from `operations/implement.md` in v4.2.2 to keep that file under the Rule #16 ≤500-line cap.

**Each phase's canonical detail** (full execution sequence, agent dispatch, error handling, retry logic) lives in the per-phase file under `phases/0-preflight.md` through `phases/12-finalization.md`. This file provides the quick-reference index used by Phase 1 agent selection and by orchestrator-level workflow decisions.

---

## Phases

### Phase 0: Pre-flight
**Details:** See [phases/0-preflight.md](../phases/0-preflight.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | Git repo exists, gh CLI authenticated |
| Output Artifacts | Feature branch, validated issue |
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
   - Score each available agent against each phase's requirements:
     ```
     total_score = (capability_score * 0.5) + (tool_score * 0.3) + (domain_score * 0.2)
     ```
   - Apply selection rules:
     - ≥80% match → auto-select, inform user
     - 60-79% match → present options, user picks
     - <60% match → fallback to direct execution (if phase allows) or escalate

3. **Present selection plan**
   If any phase has <80% match:
   ```
   Use AskUserQuestion to let user pick from options
   ```

4. **Store selections**
   Cache agent selections for use in subsequent phases

**Quality Gate QG-1:**
- [ ] All phases have agent selection (agent assigned or allow_direct=true)
- [ ] User informed of auto-selections (≥80% matches)
- [ ] User confirmed edge cases (<80% matches)
- [ ] Selection plan stored for subsequent phases

**Context-aware matching:**
- If issue has `frontend` label → boost agents with react-developer, react-code-reviewer capabilities
- If issue has `backend` label → boost agents with nest-developer, nest-code-reviewer capabilities
- If issue has `security` label → boost agents with security-auditor, security-related capabilities
- If issue has `bug` label → include agents with investigate-bug capability in Phase 1

---

### Phase 2: Business Analysis
**Details:** See [phases/2-business-analysis.md](../phases/2-business-analysis.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-1 = PASS |
| Agent | *selected at 1* |
| Output Artifacts | Research summary, requirements document |
| Quality Gate | QG-2 (Checkpoint for T2, Automated for T1) |

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
| Output Artifacts | Affected files list, patterns found |
| Quality Gate | QG-3 (Checkpoint for T2, Automated for T1) |

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
| Output Artifacts | Implementation plan |
| Quality Gate | QG-4 (User-Approval) |

**Quick Summary:**
- Design implementation approach
- Architect verifies plan completeness
- User approves plan before implementation

---

### Phase 5: Implementation
**Details:** See [phases/5-implementation.md](../phases/5-implementation.md)

| Attribute | Value |
|-----------|-------|
| Input Conditions | QG-4 = PASS |
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
| Quality Gate | QG-6 (Checkpoint for T2, Automated for T1) |

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
- Run npm audit
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
| Output Artifacts | Quality assessment |
| Quality Gate | QG-8 (Checkpoint for T2, Automated for T1) |

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
| Output Artifacts | Updated documentation |
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
| Output Artifacts | User confirmation |
| Quality Gate | QG-11 (User-Approval for T2, Automated for T1) |

**Quick Summary:**
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
| Output Artifacts | Commit, branch management |
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
