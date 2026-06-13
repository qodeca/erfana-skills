Continuation of [code-review-standards-2025.md](code-review-standards-2025.md).

## Contents

- [7. Code smells detection](#7-code-smells-detection)
- [8. Complexity metrics](#8-complexity-metrics)
- [9. Test coverage requirements](#9-test-coverage-requirements)
- [10. Documentation requirements](#10-documentation-requirements)
- [11. Review severity matrix](#11-review-severity-matrix)
- [12. Automated checks](#12-automated-checks)
- [13. Review workflow](#13-review-workflow)

---

## 7. Code Smells Detection

### 7.1 Class-level smells

| Smell | Detection | Threshold | Severity |
|-------|-----------|-----------|----------|
| God Class | Lines + methods | >500 lines OR >15 methods | CRITICAL |
| Large Class | Lines | >300 lines | HIGH |
| Data Class | Only getters/setters | No behavior methods | MEDIUM |
| Lazy Class | Too little functionality | <50 lines, 1-2 methods | LOW |
| Refused Bequest | Unused inheritance | Override with empty | MEDIUM |

### 7.2 Method-level smells

| Smell | Detection | Threshold | Severity |
|-------|-----------|-----------|----------|
| Long Method | Line count | >50 lines | HIGH |
| Long Parameter List | Param count | >5 parameters | HIGH |
| Feature Envy | External references | Uses other class more than own | MEDIUM |
| Message Chains | Chained calls | a.b.c.d.method() | MEDIUM |

### 7.3 Code-level smells

| Smell | Detection | Threshold | Severity |
|-------|-----------|-----------|----------|
| Magic Numbers | Literals in logic | Non-obvious numbers | MEDIUM |
| Dead Code | Unused exports | 0 references | MEDIUM |
| Duplicate Code | Clone detection | >10 lines similar | HIGH |
| Speculative Generality | Unused abstractions | No implementations | LOW |

---

## 8. Complexity Metrics

### 8.1 Cyclomatic complexity

| Score | Rating | Action |
|-------|--------|--------|
| 1-5 | Simple | OK |
| 6-10 | Moderate | Review |
| 11-15 | Complex | Justify |
| 16-20 | High | Consider split |
| 21+ | Very High | MUST refactor |

**Threshold:** Maximum 15 per function (Tier 2), 20 (Tier 1)

### 8.2 Cognitive complexity

Measures human understandability. Penalizes nesting more than sequential code.

**Threshold:** Maximum 15 per function

### 8.3 Coupling metrics

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| Afferent coupling (incoming) | <10 | Review stability |
| Efferent coupling (outgoing) | <10 | Review dependencies |
| Class coupling (CBO) | ≤9 | Flag for refactor |

### 8.4 Cohesion metrics

| LCOM4 Score | Meaning | Action |
|-------------|---------|--------|
| 1 | High cohesion | OK |
| 2-3 | Moderate | Review |
| 4+ | Low cohesion | Split class |

---

## 9. Test Coverage Requirements

### 9.1 Coverage thresholds

| Metric | Tier 1 | Tier 2 | Blocking |
|--------|--------|--------|----------|
| Line coverage | ≥70% | ≥80% | YES |
| Branch coverage | ≥60% | ≥70% | YES |
| Function coverage | ≥70% | ≥80% | NO |

### 9.2 Test quality checks

| Check | Requirement | Severity |
|-------|-------------|----------|
| Acceptance criteria covered | 100% | HIGH |
| Edge cases tested | Critical paths | HIGH |
| Error paths tested | All catch blocks | MEDIUM |
| No flaky tests | Deterministic | HIGH |
| Mocks properly typed | Real types, not Partial | MEDIUM |

---

## 10. Documentation Requirements

### 10.1 Required documentation

| Item | When Required | Format |
|------|---------------|--------|
| Public API | Always | JSDoc/TSDoc |
| Complex logic | Cyclomatic > 10 | Inline comments |
| Non-obvious decisions | Always | "Why" comments |
| Breaking changes | API changes | CHANGELOG |

### 10.2 Comment quality

**GOOD comments explain WHY:**
```typescript
// Batch size of 100 chosen based on API rate limits
// and memory constraints on mobile devices
const BATCH_SIZE = 100;
```

**BAD comments explain WHAT:**
```typescript
// Set batch size to 100
const BATCH_SIZE = 100; // Redundant!
```

---

## 11. Review Severity Matrix

### 11.1 Severity definitions

| Severity | Definition | Response Time | Blocking |
|----------|------------|---------------|----------|
| CRITICAL | Security vulnerability, data loss risk | Immediate | YES |
| HIGH | Functionality broken, major quality issue | Same day | YES (Tier 2) |
| MEDIUM | Quality concern, should address | This sprint | NO |
| LOW | Improvement suggestion | Backlog | NO |

### 11.2 Severity by category

| Category | CRITICAL | HIGH | MEDIUM | LOW |
|----------|----------|------|--------|-----|
| Security | Injection, secrets exposed | Missing validation | Weak validation | Best practice |
| Performance | Memory leak, infinite loop | O(n²) on large data | Unnecessary renders | Minor optimization |
| Architecture | Circular dependency | SOLID violation | Coupling concern | Style preference |
| Testing | No tests for critical path | Coverage < threshold | Missing edge case | Test organization |
| TypeScript | Unsafe `any` with user data | `any` usage | Missing types | Type refinement |

---

## 12. Automated Checks

### 12.1 Pre-commit (MANDATORY)

```bash
# Must pass before commit
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run test        # Unit tests
```

### 12.2 CI pipeline (MANDATORY)

| Check | Tool | Threshold |
|-------|------|-----------|
| Lint | ESLint | 0 errors |
| Types | TypeScript | 0 errors |
| Tests | Vitest | 100% pass |
| Coverage | v8 | Per-tier thresholds |
| Security | npm audit | 0 high/critical |
| Bundle | size-limit | Project-specific |

### 12.3 Static analysis tools

| Tool | Purpose | Integration |
|------|---------|-------------|
| ESLint | Code quality | Pre-commit, CI |
| TypeScript | Type safety | Pre-commit, CI |
| SonarQube | Complexity, smells | CI |
| npm audit | Dependencies | CI |

---

## 13. Review Workflow

### 13.1 Before requesting review

**Author checklist:**
- [ ] Self-reviewed changes
- [ ] Tests pass locally
- [ ] Lint/typecheck clean
- [ ] Coverage meets threshold
- [ ] Documentation updated
- [ ] No `console.log` or debug code

### 13.2 During review

**Reviewer checklist:**
- [ ] Read context (issue, plan)
- [ ] Understand the change
- [ ] Check security concerns
- [ ] Verify tests adequate
- [ ] Review architecture
- [ ] Check documentation

### 13.3 After review

**Resolution requirements:**
- All CRITICAL/HIGH issues resolved
- MEDIUM issues addressed or documented
- LOW issues acknowledged
