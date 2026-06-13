# Phase 8: Implementation quality review

**Goal:** Code quality assessment using 2025 industry standards.
**Agents:** `code-reviewer`, `architecture-reviewer`
**Quality Gate:** QG-8 (Checkpoint for T2, Automated for T1)
**Reference:** `../reference/code-review-standards-2025.md`

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-7 = PASS (Security scan completed)
- [ ] No critical/high security vulnerabilities from QG-7
- [ ] All tests passing (`npm run test`)
- [ ] Typecheck passing (`npm run typecheck`)
- [ ] Lint passing (`npm run lint`)
- [ ] Files changed list available
- [ ] Tier classification known (from Phase 0)

---

## EXECUTION

**QG-8 scope:** Code quality exclusively. Plan conformance and acceptance criteria verification belong to QG-9.

### Step 1: Invoke review agent

**MANDATORY: Use `code-reviewer` agent for all reviews.**

```
Invoke code-reviewer with:
  files_changed: <list from git diff>
  tier: <from Phase 0>
  context: {
    issue_number: <from Phase 0>
  }
```

The agent will execute:
1. Categorize files by type (main/renderer/preload/shared)
2. Electron security review (MANDATORY for main/preload)
3. General security review (ALL files)
4. TypeScript safety review
5. SOLID principles review
6. Code smells detection
7. Complexity analysis
8. React patterns review (renderer files)
9. Node.js patterns review (main/shared files)
10. Test coverage review
11. Documentation review
12. Compile findings

### Step 2: Technology-specific reviews

**For Electron main process files:**
```
Verify using ../reference/code-review-standards-2025.md Section 2:
- webPreferences: nodeIntegration=false, contextIsolation=true
- IPC handlers validate sender
- No dangerous patterns (eval, shell.openExternal with user input)
```

**For React renderer files:**
```
Verify using ../reference/code-review-standards-2025.md Section 4:
- No conditional hook calls
- Proper dependency arrays in useEffect
- Memoization used appropriately
- No dangerouslySetInnerHTML without DOMPurify
```

**For Node.js files:**
```
Verify using ../reference/code-review-standards-2025.md Section 3:
- Async/await error handling
- No blocking operations on main thread
- Dependencies audited
```

### Step 3: SOLID principles verification

**Reference:** `../reference/code-review-standards-2025.md` Section 6

| Principle | Check | Tier 1 | Tier 2 |
|-----------|-------|--------|--------|
| SRP | Single responsibility per class/module | Basic | Full |
| OCP | Open for extension, closed for modification | Skip | Full |
| LSP | Subtypes substitutable for base types | Skip | Full |
| ISP | Focused interfaces | Skip | Full |
| DIP | Depend on abstractions | Basic | Full |

**Thresholds:**
- SRP violations (>300 line files): MEDIUM
- DIP violations (direct instantiation): MEDIUM
- Multiple SOLID violations in same file: HIGH

### Step 4: Code smell detection

**Reference:** `../reference/code-review-standards-2025.md` Section 7

| Smell | Detection | Threshold | Severity |
|-------|-----------|-----------|----------|
| God Class | Lines + methods | >500 lines OR >15 methods | CRITICAL |
| Large Class | Lines | >300 lines | HIGH |
| Long Method | Lines | >50 lines | HIGH |
| Long Parameter List | Params | >5 parameters | HIGH |
| Feature Envy | External refs | Uses other class more | MEDIUM |
| Data Clumps | Repeated groups | >2 occurrences | MEDIUM |
| Magic Numbers | Literals | Non-obvious values | MEDIUM |
| Dead Code | Unused exports | 0 references | MEDIUM |

### Step 5: Complexity analysis

**Reference:** `../reference/code-review-standards-2025.md` Section 8

**Cyclomatic complexity:**
| Score | Tier 1 | Tier 2 | Action |
|-------|--------|--------|--------|
| 1-10 | OK | OK | None |
| 11-15 | OK | Justify | Document reason |
| 16-20 | Justify | HIGH | Recommend split |
| 21+ | HIGH | CRITICAL | MUST refactor |

**Cognitive complexity:**
- Maximum 15 per function (both tiers)
- Penalizes nesting more than sequential code

**Coupling metrics:**
- Class coupling (CBO) ≤ 9
- Flag circular dependencies as CRITICAL

### Step 6: Test coverage verification

**Reference:** `../reference/code-review-standards-2025.md` Section 9

| Metric | Tier 1 | Tier 2 | Blocking |
|--------|--------|--------|----------|
| Line coverage | ≥70% | ≥80% | YES |
| Branch coverage | ≥60% | ≥70% | YES |
| Function coverage | ≥70% | ≥80% | NO |

**Quality checks:**
- [ ] Tests exist for all changed files
- [ ] Edge cases tested
- [ ] Error paths tested
- [ ] No flaky tests

### Step 7: Documentation check

**Reference:** `../reference/code-review-standards-2025.md` Section 10

**Required:**
- [ ] Public APIs have JSDoc/TSDoc
- [ ] Complex logic has "why" comments
- [ ] No outdated comments
- [ ] CHANGELOG updated for breaking changes

### Step 8: Design System Compliance (MANDATORY for UI/CSS changes)

When the implementation involves UI or CSS changes, verify design token usage:

| Token Category | Requirement | Check |
|---------------|-------------|-------|
| Colors | Use `var(--color-*)` tokens | [ ] No hardcoded hex values |
| Spacing | Use `var(--space-*)` tokens | [ ] No arbitrary px/em values |
| Typography | Use `var(--text-*)` and `var(--font-*)` | [ ] Font sizes from tokens |
| Border radius | Follow project rules | [ ] Typically `border-radius: 0` |
| Transitions | Use `var(--transition-*)` tokens | [ ] Consistent timing |
| Z-index | Use `var(--z-*)` tokens | [ ] Layering from tokens |
| Focus states | Visible focus indicators | [ ] Accessibility verified |

#### Common Violations to Check
- Hardcoded colors: `#ffffff`, `rgb(...)`, `rgba(...)`
- Arbitrary spacing: `padding: 10px`, `margin: 1.5em`
- Custom font sizes: `font-size: 14px`, `font-size: 0.9em`
- Rounded corners when project uses sharp corners

⛔ STOP if design token violations found → Fix before proceeding

### Step 8b: UX audit (conditional – MANDATORY when has_ui_impact = true)

**Condition:** `has_ui_impact = true` (from Phase 0/3)

**Skip condition:** If `has_ui_impact = false`, skip to Step 9.

Invoke `ux-reviewer` agent for UX audit:

1. **Input to ux-reviewer:**
   - Changed files (from git diff)
   - UX specification from Phase 4 Step 1a (if produced)
   - Platform context
   - Review depth: standard (Tier 1) or deep (Tier 2)

2. **ux-reviewer evaluates:**
   - **Heuristic evaluation** (Nielsen's 10 heuristics applied to changed UI code)
   - **Accessibility compliance** (WCAG 2.2 AA – semantic HTML, ARIA, keyboard nav, contrast, touch targets, focus order, screen reader support)
   - **Platform guideline compliance** (platform-specific patterns and conventions)
   - **Design system adherence** (beyond token usage checked in Step 8)
   - **Edge case coverage** (empty, error, loading, boundary states in UI)
   - **Interaction pattern review** (feedback timing, state transitions, animation)

3. **ux-reviewer output:** Structured audit report with:
   - Findings rated by severity (Nielsen's 0–4 scale, mapped to CRITICAL/HIGH/MEDIUM/LOW)
   - Confidence classification (definite violation / probable issue / possible concern)
   - Remediation guidance per finding
   - Accessibility scorecard
   - At least one strength noted

4. **Severity mapping to QG-8 resolution rules:**

   | UX Severity | QG-8 Severity | Tier 1 Action | Tier 2 Action |
   |-------------|---------------|---------------|---------------|
   | 4 (Catastrophe) | CRITICAL | MUST fix | MUST fix |
   | 3 (Major) | HIGH | Document | MUST fix |
   | 2 (Minor) | MEDIUM | Document | Should fix |
   | 1 (Cosmetic) | LOW | Optional | Optional |

**Note:** UX findings merge into the same severity resolution flow as code-reviewer findings (Step 9). No separate resolution path.

### Step 9: Address findings

**By severity (MANDATORY resolution rules):**

| Severity | Tier 1 | Tier 2 |
|----------|--------|--------|
| CRITICAL | MUST fix | MUST fix |
| HIGH | Document | MUST fix |
| MEDIUM | Document | Should fix or document |
| LOW | Optional | Optional |

**CRITICAL issues are BLOCKING - no override allowed.**

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Review Status | "approved" / "changes_requested" / "blocked" |
| Summary | Counts by severity |
| Findings | All findings with details |
| Blocking Issues | Issues that MUST be fixed |
| Recommendations | Non-blocking suggestions |
| Metrics | Complexity, coverage, coupling |

---

## Quality Gate

**Success criterion:** Code-reviewer status is `approved` or `changes_requested` (not `blocked`); 0 CRITICAL issues; HIGH issues addressed (T2) or documented (T1); coverage and complexity thresholds met. PRE/POST-STEP scaffolding stripped per v4.2.0 patterns — Phase 8 is read-only review; QG-8 below enforces the pass criteria.

---

## QUALITY GATE: QG-8

**Gate Type:** Checkpoint (T2) | Automated (T1)
**Gate ID:** QG-8

### Pass Criteria

| Criterion | Tier 1 | Tier 2 | Blocking |
|-----------|--------|--------|----------|
| CRITICAL issues | 0 | 0 | YES |
| HIGH issues | Document | Address | Tier 2 |
| Security checks | Pass | Pass | YES |
| TypeScript safety | Pass | Pass | YES |
| SOLID violations | ≤3 medium | 0 high | Tier 2 |
| Complexity max | <20 | <15 | YES |
| Line coverage | ≥70% | ≥80% | YES |
| Branch coverage | ≥60% | ≥70% | YES |
| UX audit (if UI) | Pass or N/A | Pass or N/A | If applicable |
| User checkpoint | Not required | Required | N/A |

### Tier 2 Checkpoint

Present to user:

```markdown
## Implementation Quality Review - 2025 Standards

**Review Status:** <approved|changes_requested|blocked>
**Tier:** 2 (Standard)

---

### Summary
| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | <n> | <must be 0> |
| HIGH | <n> | <addressed/documented> |
| MEDIUM | <n> | <addressed/documented> |
| LOW | <n> | <optional> |

---

### Security Assessment
| Check | Status |
|-------|--------|
| Electron webPreferences | ✅/❌ |
| IPC validation | ✅/❌ |
| No hardcoded secrets | ✅/❌ |
| Input validation | ✅/❌ |

---

### TypeScript Safety
| Check | Status |
|-------|--------|
| No unsafe `any` | ✅/❌ |
| No unsafe assertions | ✅/❌ |
| Strict mode enabled | ✅/❌ |

---

### SOLID Principles
| Principle | Status | Notes |
|-----------|--------|-------|
| SRP | ✅/⚠️/❌ | <details> |
| OCP | ✅/⚠️/❌ | <details> |
| LSP | ✅/⚠️/❌ | <details> |
| ISP | ✅/⚠️/❌ | <details> |
| DIP | ✅/⚠️/❌ | <details> |

---

### Code Quality Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Max Complexity | <n> | <15 | ✅/❌ |
| Avg Complexity | <n> | <10 | ✅/⚠️ |
| Line Coverage | <n>% | ≥80% | ✅/❌ |
| Branch Coverage | <n>% | ≥70% | ✅/❌ |
| Coupling | <low/med/high> | low | ✅/⚠️/❌ |

---

### Code Smells
| Smell | Location | Severity | Action |
|-------|----------|----------|--------|
| <smell> | <file:line> | <sev> | <fix/document> |

---

### Findings Requiring Action

<list of HIGH/CRITICAL findings>

---

### Recommendations
- <suggestion 1>
- <suggestion 2>

---

**Reference:** [Code Review Standards 2025](../reference/code-review-standards-2025.md)

**Proceed to Verification?** [Approve / Address Issues First]
```

### Result

**QG-8 Result:** [PASS | FAIL]

### On FAIL

1. Review findings in detail
2. Fix all CRITICAL issues (MANDATORY)
3. Fix HIGH issues (Tier 2) or document (Tier 1)
4. Re-run review
5. Max 3 retries, then ESCALATE to user

### Escalation Options

| Failure Reason | Action |
|----------------|--------|
| CRITICAL security issue | STOP - must fix, no override |
| Coverage below threshold | Justify or add tests |
| Complexity above limit | Refactor or justify |
| Multiple SOLID violations | Architectural review |

---

## NEXT PHASE

**QG-8 = PASS required to proceed to Phase 9: Verification**

**STOP if QG-8 ≠ PASS. Do not proceed.**
