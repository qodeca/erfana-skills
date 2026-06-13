# Modifying Skills Guide

Safe patterns for updating existing Claude Code skills.

---

## When to Modify

### Good Reasons to Modify

- **Bug fix:** Skill produces incorrect results
- **Enhancement:** Adding requested capability
- **Compatibility:** Updating for new Claude model
- **Clarity:** Improving confusing instructions
- **Feedback:** Addressing user-reported issues
- **Dependencies:** Updating for changed tools

### Consider Creating New Skill Instead

- Complete redesign needed
- Purpose has fundamentally changed
- Original skill should remain available
- Breaking changes affect many users

---

## Safe Modification Workflow

### Step 1: Backup

Always backup before modifying:

```bash
# Copy entire skill directory
cp -r skills/skill-name skills/skill-name.backup

# Or with timestamp
cp -r skills/skill-name skills/skill-name.backup.$(date +%Y%m%d)
```

### Step 2: Document Intent

Before making changes, write down:
- What you're changing
- Why you're changing it
- Expected outcome
- How you'll verify success

### Step 3: Make Focused Changes

**Do:**
- Change one thing at a time
- Keep changes minimal
- Preserve working functionality

**Don't:**
- Refactor while fixing bugs
- Add features while updating deps
- Change multiple unrelated things

### Step 4: Validate

Run through checklists:
1. `validation/pre-release-checklist.md`
2. `validation/security-checklist.md`
3. `validation/review-checklist.md`

### Step 5: Test

Test thoroughly:
1. **Direct invocation:** Does it work when explicitly called?
2. **Auto-discovery:** Does it trigger correctly?
3. **Cross-model:** Works on Haiku/Sonnet/Opus?
4. **Edge cases:** Handles unusual inputs?
5. **Regression:** Previous functionality still works?

### Step 6: Deploy

Replace the original:

```bash
# If tests pass, remove backup (optional)
rm -rf skills/skill-name.backup

# Or keep backup for a while
# Delete after confirming stability
```

### Step 7: Monitor

After deployment:
- Watch for user issues
- Verify discovery still works
- Check for unintended side effects

---

## Types of Modifications

### Type 1: Bug Fixes

**Scope:** Minimal, targeted fix
**Risk:** Low if isolated
**Validation:** Test specific bug + regression

**Process:**
1. Identify exact bug location
2. Make minimal fix
3. Test the specific scenario
4. Verify no regression
5. Deploy

### Type 2: Content Updates

**Scope:** Documentation, examples, anti-patterns
**Risk:** Low
**Validation:** Read through, verify accuracy

**Process:**
1. Identify outdated content
2. Update to match reality
3. Check for consistency
4. Deploy

### Type 3: Feature Addition

**Scope:** New capability
**Risk:** Medium
**Validation:** Full checklist + testing

**Process:**
1. Design the addition
2. Implement minimally
3. Add examples for new feature
4. Run full validation
5. Test extensively
6. Deploy

### Type 4: Dependency Update

**Scope:** External tool changes
**Risk:** Medium to High
**Validation:** Technical testing focus

**Process:**
1. Understand what changed
2. Update instructions
3. Test with new dependency
4. Verify backwards compatibility if possible
5. Update documentation
6. Deploy

### Type 5: Major Restructure

**Scope:** Significant changes
**Risk:** High
**Validation:** Complete review cycle

**Process:**
1. Consider if new skill is better
2. Plan changes thoroughly
3. Implement incrementally
4. Full validation + testing
5. Deploy with monitoring

---

## Version Management

For significant changes, consider versioning:

### Simple Versioning

Add to SKILL.md:
```markdown
## Version History

- v1.2 (2025-01-15): Added JSON output format
- v1.1 (2024-11-01): Fixed edge case with empty files
- v1.0 (2024-09-15): Initial release
```

### When to Version

| Change Type | Version Bump |
|-------------|--------------|
| Bug fix | Patch (1.0 → 1.0.1) |
| New feature | Minor (1.0 → 1.1) |
| Breaking change | Major (1.0 → 2.0) |

---

## Handling Breaking Changes

If your change breaks existing behavior:

### Option 1: Major Version

- Keep old behavior available
- New version in parallel
- Document migration path

### Option 2: Clean Break

- If few users affected
- Document the change
- Communicate before deploying

---

## Modification Checklist

Before modifying:
- [ ] Backed up current version
- [ ] Documented what and why
- [ ] Scope is focused (one thing)

After modifying:
- [ ] Pre-release checklist passed
- [ ] Security checklist passed
- [ ] Direct invocation tested
- [ ] Auto-discovery tested
- [ ] Cross-model tested (if applicable)
- [ ] Examples updated
- [ ] Documentation accurate

---

## Common Modification Mistakes

### Mistake: No Backup

**Problem:** Can't rollback if something breaks
**Solution:** Always backup first

### Mistake: Too Many Changes

**Problem:** Can't identify what broke
**Solution:** One change at a time

### Mistake: Skipping Validation

**Problem:** Introduce new bugs
**Solution:** Always run checklists

### Mistake: Forgetting Examples

**Problem:** Examples don't match behavior
**Solution:** Update examples with changes

### Mistake: Not Testing Cross-Model

**Problem:** Breaks on Haiku after working on Opus
**Solution:** Always test simpler models

### Mistake: Silent Deploy

**Problem:** Users confused by changes
**Solution:** Document changes, communicate if needed

---

## Rollback Procedure

If something goes wrong:

### Immediate Rollback

```bash
# Restore from backup
rm -rf skills/skill-name
mv skills/skill-name.backup skills/skill-name
```

### Partial Rollback

If only some changes need reverting:
1. Identify problem changes
2. Revert specific files
3. Re-test
4. Keep working changes

---

## Documentation Updates

When modifying skills, update:

1. **SKILL.md:** Main instructions
2. **Examples:** Input/output pairs
3. **Anti-patterns:** New mistakes discovered
4. **Version history:** What changed and when
5. **Related files:** Templates, references
