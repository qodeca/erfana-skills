# Phase 5: Implementation

**Goal:** Write code and tests following the approved plan.
**Agents:** `software-developer`, `test-writer`
**Quality Gate:** QG-5 (Automated)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-4 = PASS (Architecture approved by user)
- [ ] Implementation plan available and APPROVED
- [ ] Test strategy defined
- [ ] Affected files list available
- [ ] Patterns inventory available
- [ ] UX specification available (if `has_ui_impact = true`, from Phase 4 Step 1a)

---

## PRE-STEP VALIDATION

VERIFY: QG-4 = PASS (User-Approved). STOP if architecture not approved.

---

## EXECUTION

### Step 1: Implementation with software-developer

Follow `software-developer` agent:

1. Review implementation plan
2. Read existing code patterns
3. Create new files using Write()
4. Modify existing files using Edit()
5. Verify with `npm run typecheck`

**Follow the plan sequence exactly.**

**When `has_ui_impact = true`:**
Implementation agent MUST reference UX specification from Phase 4 for:
- Accessibility requirements (ARIA attributes, semantic HTML, keyboard navigation)
- Platform-specific patterns (touch targets, navigation conventions)
- Design token usage (as specified in UX spec)
- Edge case handling (empty, error, loading states per UX spec)

### Step 2: Write Tests (TDD-friendly)

Use `test-writer` agent for:
- Unit tests for new functions
- Integration tests for components
- Edge case coverage

**Target:** >80% coverage for new code

### Step 3: Incremental Verification

After each major change:
```bash
npm run typecheck    # Must pass
npm run test         # Must pass
```

### Step 4: Modern Testing Approaches (Tier 2)

Consider where applicable:

| Approach | When to Use |
|----------|-------------|
| Property-based | Complex input domains |
| Contract testing | IPC handlers, APIs |
| AI-assisted generation | Edge case discovery |
| Mutation testing | Verify test quality |

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Code Changes | New/modified files per plan |
| Test Suite | Tests for all new code |
| Type Check Results | `npm run typecheck` output |
| Test Results | `npm run test` output |

---

## POST-STEP VALIDATION

**ALL must be checked before proceeding to Phase 6.**

- [ ] All planned files created/modified
- [ ] Implementation follows approved plan
- [ ] Code follows existing codebase patterns
- [ ] Detected typecheck command passes (or none detected)
- [ ] Detected test command passes (or none detected)
- [ ] Tests written for new code (>80% coverage target)
- [ ] No scope creep (only acceptance criteria addressed)

### Test file existence check (MANDATORY)

For every NEW file created during implementation:
- [ ] If file is a component (`*.tsx`) → corresponding `*.test.tsx` exists
- [ ] If file is a store (`use*.ts` in `stores/`) → corresponding `*.test.ts` exists
- [ ] If file is a hook (`use*.ts` in `hooks/`) → corresponding `*.test.ts` exists
- [ ] If file is a utility (`*.ts` in `utils/`) → corresponding `*.test.ts` exists

**Exceptions** (no test file required):
- `index.ts` barrel exports
- Type-only files (`*.types.ts`, `*.d.ts`)
- CSS files (`*.css`, `*.module.css`)
- Test files themselves

⛔ STOP if test files missing for any new component, store, hook, or utility.

### File size pre-check (MANDATORY)

- [ ] No modified or created file exceeds 500 lines
- [ ] Files approaching 400+ lines are flagged for proactive splitting consideration

⛔ STOP if any file exceeds 500 lines. Extract utilities, split components, or refactor before proceeding to review phases.

### Edge Case Verification (MANDATORY for Tier 2+)

Before proceeding to Phase 6, verify edge cases are documented:

| Category | Verification |
|----------|--------------|
| Empty/null input | [ ] Handling verified and tested |
| Large input | [ ] Size limits defined and enforced |
| Malformed input | [ ] Graceful error handling implemented |
| Boundary conditions | [ ] Edge values tested (0, max, negative) |
| Concurrent access | [ ] Race conditions considered (if applicable) |
| Error states | [ ] All error paths have proper handling |

#### Documentation Requirements
- [ ] List of handled edge cases documented in code comments or tests
- [ ] List of explicitly NOT handled cases with justification
- [ ] Security edge cases identified and addressed

⛔ STOP if edge cases not verified for Tier 2+ issues

---

## QUALITY GATE: QG-5

**Gate Type:** Automated (ALL tiers)
**Gate ID:** QG-5

### Pass Criteria

| Criterion | Check |
|-----------|-------|
| Typecheck | detected `TYPECHECK_CMD` exits 0 (or none detected) |
| Tests | detected `TEST_CMD` exits 0 (or none detected) |
| Coverage | New code >80% covered (if a coverage tool is present) |
| Plan conformance | All planned changes made |
| No scope creep | Only acceptance criteria addressed |

### Automated Verification

```bash
# Run the detected checks (npm shown as the Node example)
[ -n "$TYPECHECK_CMD" ] && eval "$TYPECHECK_CMD"
[ -n "$TEST_CMD" ] && eval "$TEST_CMD"
```

**Every detected check must pass.**

### Result

**QG-5 Result:** [PASS | FAIL]

### On FAIL

1. Identify specific failure (typecheck, test, coverage)
2. Fix the identified issue
3. Re-run verification
4. Max 3 retries, then ESCALATE to user

### Common Failures

| Failure | Resolution |
|---------|------------|
| Type error | Fix type annotations or implementation |
| Test failure | Debug and fix implementation or test |
| Low coverage | Add missing tests |
| Scope creep detected | Revert unplanned changes |

---

## Implementation Guidelines

**DO:**
- Follow existing patterns in codebase
- Keep changes focused on acceptance criteria
- Write tests alongside implementation
- Verify after each major change

**DO NOT:**
- Add unplanned features ("while I'm here...")
- Change unrelated code
- Skip test writing
- Ignore typecheck warnings

---

## NEXT PHASE

**QG-5 = PASS required to proceed to Phase 6: Architectural Review**

**STOP if QG-5 ≠ PASS. Do not proceed.**
