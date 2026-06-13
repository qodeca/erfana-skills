# Delta Review Process

Quick review process for minor changes made after full review cycle.

---

## When to Use Delta Review

Use delta review when ALL of these conditions are met:

| Condition | Requirement |
|-----------|-------------|
| Change size | < 20 lines changed |
| Security impact | None (no auth, crypto, IPC, user input handling) |
| Architecture | No structural changes |
| Scope | Changes isolated to already-reviewed code areas |

If ANY condition is not met → Use full re-review instead.

---

## Delta Review Checklist

### Code Quality
- [ ] Changes are isolated to claimed scope
- [ ] No new code smells introduced
- [ ] Existing patterns followed consistently
- [ ] No copy-paste duplication

### Security
- [ ] No new security vulnerabilities introduced
- [ ] No hardcoded secrets or credentials
- [ ] Input validation unchanged or improved
- [ ] No dangerous API usage added

### Design System (for UI changes)
- [ ] All colors use design tokens
- [ ] All spacing uses design tokens
- [ ] All typography uses design tokens
- [ ] Border radius follows project rules

### Tests
- [ ] Existing tests still pass
- [ ] New code has test coverage (if applicable)
- [ ] No TODO/FIXME added without justification

---

## Delta Review Process

### Duration Target
- Should complete in < 5 minutes
- If taking longer → Escalate to appropriate review level

### Steps

1. **Identify changed lines**
   ```bash
   git diff --stat <last_review_commit>..HEAD
   git diff <last_review_commit>..HEAD
   ```

2. **Verify scope**
   - Are changes only in files that were already reviewed?
   - Are changes consistent with the original implementation plan?

3. **Run checklist**
   - Complete all items in Delta Review Checklist above
   - Any unchecked item → FAIL

4. **Verify tests**
   ```bash
   npm run test
   npm run typecheck
   npm run lint
   ```

5. **Record result**
   - PASS: Update `last_review_commit = HEAD`, proceed to commit
   - FAIL: Escalate to appropriate review level

---

## Escalation Paths

| Delta Review Outcome | Next Step |
|---------------------|-----------|
| PASS | Proceed to Phase 12 (Finalization) |
| FAIL - Minor issues | Fix issues, repeat delta review |
| FAIL - Security concern | Escalate to Phase 7 (Security) |
| FAIL - Quality concern | Escalate to Phase 8 (Quality Review) |
| FAIL - Architecture concern | Escalate to Phase 6 (Architectural Review) |

---

## Examples

### Example 1: CSS Fix (PASS)
- Change: Fixed `padding: 10px` → `padding: var(--space-4)`
- Lines changed: 3
- Security impact: None
- Result: Delta review PASS ✓

### Example 2: Error Message (PASS)
- Change: Improved error message text
- Lines changed: 5
- Security impact: None (no logic change)
- Result: Delta review PASS ✓

### Example 3: Input Validation (FAIL → Escalate)
- Change: Added new input validation rule
- Lines changed: 15
- Security impact: YES (user input handling)
- Result: Delta review FAIL → Escalate to Phase 7

### Example 4: New Component (FAIL → Escalate)
- Change: Added new React component for edge case
- Lines changed: 45
- Security impact: None
- Result: Delta review FAIL (> 20 lines) → Moderate Review
