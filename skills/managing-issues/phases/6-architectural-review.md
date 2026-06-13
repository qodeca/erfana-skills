# Phase 6: Architectural Review

**Goal:** Validate architectural quality of implemented code.
**Agent:** `architecture-reviewer`
**Quality Gate:** QG-6 (Checkpoint for T2, Automated for T1)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-5 = PASS (Implementation completed)
- [ ] All tests passing
- [ ] Typecheck passing
- [ ] Implementation plan available for comparison

---

## EXECUTION

### Step 1: Invoke Architecture Reviewer

Use `architecture-reviewer` agent:

1. Architecture-reviewer enumerates all changed files in a single pass (one Task call, no per-file fan-out)
2. Analyze component boundaries and responsibilities
3. Check SOLID principles adherence
4. Evaluate design pattern usage
5. Assess coupling and cohesion
6. Check dependency directions
7. Report findings by severity

### Step 2: SOLID Principles Check

| Principle | Question | Red Flags |
|-----------|----------|-----------|
| **S**ingle Responsibility | One reason to change? | >300 line components |
| **O**pen/Closed | Open for extension? | Switch on types |
| **L**iskov Substitution | Subtypes replaceable? | instanceof checks |
| **I**nterface Segregation | Interfaces minimal? | Large unused interfaces |
| **D**ependency Inversion | Depend on abstractions? | Direct concrete imports |

### Step 3: Coupling/Cohesion Analysis

**Good (Low Coupling):**
- Components via interfaces
- No circular dependencies
- Localized changes

**Bad (High Coupling):**
- Direct internal references
- Circular imports
- Cascading changes

### Step 4: Design Pattern Evaluation

Check:
- [ ] Pattern solves actual problem
- [ ] Pattern implemented completely
- [ ] Pattern follows conventions

**Anti-patterns to flag:**
- God objects
- Feature envy
- Shotgun surgery
- Parallel inheritance

### Step 5: Address Findings

| Severity | Definition | Action |
|----------|------------|--------|
| Critical | Architectural flaw | MUST fix |
| High | Significant deviation | Should fix |
| Medium | Minor concern | Document |
| Low | Suggestion | Optional |

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| SOLID Assessment | Per-principle evaluation |
| Coupling Analysis | Coupling/cohesion scores |
| Pattern Review | Design pattern usage evaluation |
| Issue List | All findings by severity |

---

## Quality Gate

**Success criterion:** No critical architectural issues; high-severity issues addressed or documented. PRE/POST-STEP scaffolding stripped per v4.2.0 patterns — Phase 6 reviews read-only; QG-6 itself enforces the pass criteria below.

---

## QUALITY GATE: QG-6

**Gate Type:** Checkpoint (T2) | Automated (T1)
**Gate ID:** QG-6

### Pass Criteria

| Criterion | Tier 1 | Tier 2 |
|-----------|--------|--------|
| SOLID check | Basic | Full analysis |
| Coupling analysis | Quick | Detailed |
| Pattern review | N/A | Required |
| Critical issues | 0 | 0 |
| High issues | Document | Address |
| User checkpoint | Not required | Required |

### Tier 2 Checkpoint

Present to user:

```markdown
## Architectural Review Results

**Overall Assessment:** [SOUND | NEEDS IMPROVEMENT | ARCHITECTURAL ISSUES]

### SOLID Analysis
| Principle | Status | Notes |
|-----------|--------|-------|
| Single Responsibility | ✅/⚠️/❌ | <assessment> |
| Open/Closed | ✅/⚠️/❌ | <assessment> |
| Liskov Substitution | ✅/⚠️/❌ | <assessment> |
| Interface Segregation | ✅/⚠️/❌ | <assessment> |
| Dependency Inversion | ✅/⚠️/❌ | <assessment> |

### Design Quality
- **Coupling:** [Low/Medium/High]
- **Cohesion:** [High/Medium/Low]
- **Patterns:** [Appropriate/Over-engineered/Missing]

### Issues Found
| Severity | Issue | Location | Recommendation |
|----------|-------|----------|----------------|
| <sev> | <issue> | <file:line> | <fix> |

### Recommendations
- <suggestion 1>
- <suggestion 2>

**Proceed to Security?** [Approve / Address Issues First]
```

### Result

**QG-6 Result:** [PASS | FAIL]

### On FAIL

1. Review architectural feedback
2. Re-invoke software-developer to address issues
3. Re-run architectural review
4. Max 3 retries, then ESCALATE to user

---

## NEXT PHASE

**QG-6 = PASS required to proceed to Phase 7: Security**

**STOP if QG-6 ≠ PASS. Do not proceed.**
