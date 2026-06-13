# Phase 10: Documentation

**Goal:** Update relevant documentation.
**Agent:** `mi-docs-updater`
**Quality Gate:** QG-10 (Automated)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-9 = PASS (Verification completed - VERIFIED)
- [ ] Implementation complete and verified
- [ ] All tests passing
- [ ] Typecheck passing

---

## EXECUTION

### Step 1: Determine Documentation Needs

| Change Type | Documentation Required |
|-------------|----------------------|
| Architectural | CLAUDE.md, docs/ |
| Feature | CLAUDE.md, feature docs |
| Bug fix | CLAUDE.md (if significant) |
| API change | JSDoc, CLAUDE.md |
| Config change | README, docs/ |

### Step 2: Update CLAUDE.md

Required sections to update:
- **Recent Changes**: Add change summary
- **Version**: Update if releasing
- **Test Count**: Update if tests added

Format:
```markdown
## Changes in v0.X.Y
- **Feature Name** (Date):
  - Description of changes
  - Key implementation details
  - Test count update
  - Closes #<number>
```

### Step 3: Update Test Count

Get current count:
```bash
npm run test 2>&1 | grep -E "Tests?:\s+\d+"
```

Update CLAUDE.md: `**Total: X tests passing (Y test files)**`

### Step 4: Add JSDoc/TSDoc

For new public APIs:
```typescript
/**
 * Description of function
 * @param paramName - Description
 * @returns Description of return value
 * @example
 * const result = myFunction(param);
 */
```

### Step 5: Add Inline Comments

For complex logic (the "why", not "what"):
```typescript
// Using debounce to prevent rapid re-renders during resize
// See: https://github.com/issue/123 for context
```

### Step 6: Update Feature Docs (if applicable)

Only for user-facing features:
- Create/update doc in `docs/` folder
- Follow existing doc patterns
- Include usage examples

### Step 7: Update originating spec (when spec linked)

**Condition:** Only when `spec_maturity >= partial` (detected by QG-0 pre-flight).

1. If Phase 9 spec compliance check found intentional deviations:
   - Use `spec-content-updater` agent to update spec text for each "update-spec" item
   - Document deviation justification in the spec
2. Update spec manifest status if implementation is complete:
   - `partial` → `implemented` (if all FRs addressed)
   - Offer to run spec ARCHIVE operation if feature is fully shipped
3. If spec has a naming contracts table, verify it matches final implementation

**Skip condition:** No linked spec, or spec already archived.

### Step 8: Update project documentation

Update documentation beyond CLAUDE.md to reflect implementation changes:

1. **CHANGELOG** (`docs/CHANGELOG.md`):
   - Add entry under current version for the implemented feature/fix
   - Follow existing format (Added/Changed/Fixed/Removed sections)

2. **Testing docs** (`docs/testing/README.md`):
   - Update test counts if tests were added
   - Add new test area row if a new testing domain was introduced

3. **API/feature docs** (`docs/api-services*.md`, `docs/ui-components.md`):
   - Update service documentation if APIs changed
   - Update component documentation if UI changed

4. **Development tasks** (`docs/development-tasks.md`):
   - Update how-to guides if new patterns were established

Use `mi-docs-updater` agent for the actual file modifications.

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| CLAUDE.md Updates | Recent changes entry |
| Test Count | Updated test statistics |
| JSDoc Comments | New API documentation |
| Feature Docs | Updated feature documentation |
| Spec Update Report | Spec deviations addressed (when spec linked) |
| Documentation Update | Files updated in docs/ folder |

---

## Quality Gate

**Success criterion:** CLAUDE.md updated with change summary, test count refreshed (if tests added), JSDoc on new public APIs, related project docs updated. PRE/POST-STEP scaffolding stripped per v4.2.0 patterns — `mi-docs-updater` writes happen inline; QG-10 below validates the result.

---

## QUALITY GATE: QG-10

**Gate Type:** Automated (ALL tiers)
**Gate ID:** QG-10

### Pass Criteria

| Criterion | Tier 1 | Tier 2 |
|-----------|--------|--------|
| CLAUDE.md updated | Required | Required |
| Test count updated | If changed | If changed |
| JSDoc for new APIs | Optional | Required |
| Feature docs | Not required | If user-facing |

### Automated Verification

Check that:
1. CLAUDE.md contains reference to issue number
2. Test count is current
3. No broken links in documentation

### Result

**QG-10 Result:** [PASS | FAIL]

### On FAIL

1. Identify missing documentation
2. Add required documentation
3. Re-verify
4. Max 3 retries, then ESCALATE to user

### Documentation Guidelines

**DO:**
- Update docs in same PR as code
- Keep docs close to code they describe
- Focus on "why" not "what"
- Use examples for complex features

**DO NOT:**
- Document obvious code
- Create separate doc PRs
- Over-document trivial changes

---

## NEXT PHASE

**QG-10 = PASS required to proceed to Phase 11: UAT**

**STOP if QG-10 ≠ PASS. Do not proceed.**
