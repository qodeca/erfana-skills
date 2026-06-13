# Reviewing Skills Guide

Comprehensive guide for auditing and evaluating existing Claude Code skills.

---

## Why Review Skills?

Regular reviews ensure skills remain:
- **Effective:** Still solving the intended problem
- **Compatible:** Working with current Claude models
- **Secure:** No vulnerabilities introduced
- **Maintained:** Documentation accurate and current

---

## Review Types

### Quick Review (5-10 minutes)

**Purpose:** Periodic health check
**When:** Monthly or before minor changes
**Focus:** Structure and basic content

**Process:**
1. Open SKILL.md
2. Verify frontmatter is valid
3. Check file size (under 500 lines)
4. Confirm examples exist
5. Note any obvious issues

### Standard Review (30 minutes)

**Purpose:** Comprehensive evaluation
**When:** Quarterly or when issues reported
**Focus:** All aspects including testing

**Process:**
1. Complete `validation/review-checklist.md`
2. Test with a real scenario
3. Document findings
4. Create action items

### Deep Review (1-2 hours)

**Purpose:** Major audit or before significant changes
**When:** Annually or before major updates
**Focus:** Everything plus cross-model testing

**Process:**
1. Complete standard review
2. Test with Haiku, Sonnet, and Opus
3. Review all supporting files
4. Validate all external dependencies
5. Security audit with `validation/security-checklist.md`

---

## Review Workflow

### Step 1: Preparation

Before starting:
- [ ] Identify skill to review
- [ ] Determine review type needed
- [ ] Allocate appropriate time
- [ ] Have checklists ready

### Step 2: Metadata Review

Check the frontmatter:

```yaml
---
name: skill-name        # Gerund, lowercase, hyphens, ≤64 chars
description: ...        # Third-person, what+when, ≤1024 chars
---
```

**Questions to ask:**
- Does the name follow conventions?
- Is the description specific enough for discovery?
- Would a user's search terms match this description?

### Step 3: Structure Review

Examine file organization:

- [ ] SKILL.md is main entry point
- [ ] File is under 500 lines
- [ ] All referenced files exist
- [ ] No orphan files (unreferenced)
- [ ] Paths use forward slashes
- [ ] References are one level deep

### Step 4: Content Review

Evaluate the instructions:

- [ ] Workflow has clear, numbered steps
- [ ] Each step is actionable
- [ ] Examples demonstrate expected behavior
- [ ] Anti-patterns warn against mistakes
- [ ] No placeholder or TODO text remains

**Content Quality Questions:**
- Can Claude follow these instructions unambiguously?
- Are edge cases addressed?
- Is error handling documented?

### Step 5: Technical Review

Verify technical accuracy:

- [ ] Commands/code examples work
- [ ] Dependencies are available
- [ ] File paths are valid
- [ ] No hardcoded secrets
- [ ] External links work

### Step 6: Cross-Model Review

Test compatibility:

- [ ] Instructions explicit enough for Haiku
- [ ] Output format specified (not inferred)
- [ ] Steps numbered clearly
- [ ] No reliance on complex reasoning

**Test mentally:** "Would Haiku understand what to do?"

### Step 7: Testing

Actually test the skill:

1. **Direct test:** Invoke skill explicitly
2. **Discovery test:** Ask question that should trigger it
3. **Edge case test:** Try unusual inputs
4. **Error test:** Provide invalid input

### Step 8: Documentation

Record findings:

1. Fill out review checklist
2. Calculate scores
3. List passed/failed items
4. Create specific action items
5. Set next review date

---

## Evaluation Criteria

### Description Quality

| Quality | Characteristics |
|---------|-----------------|
| Excellent | Specific what + clear when + user terms |
| Good | Clear what + some triggers |
| Fair | Basic what, vague triggers |
| Poor | Vague or missing |

### Workflow Quality

| Quality | Characteristics |
|---------|-----------------|
| Excellent | Clear steps, checkpoints, error handling |
| Good | Clear steps, some validation |
| Fair | Steps present but vague |
| Poor | Missing or confusing workflow |

### Example Quality

| Quality | Characteristics |
|---------|-----------------|
| Excellent | 3+ examples, edge cases, clear I/O |
| Good | 2-3 examples with clear I/O |
| Fair | 1-2 basic examples |
| Poor | Missing or unclear examples |

---

## Common Problems and Solutions

### Problem: Skill Not Triggering

**Symptoms:** Users have to explicitly invoke skill
**Cause:** Description lacks trigger terms
**Solution:** Rewrite description with terms users actually say

### Problem: Inconsistent Results

**Symptoms:** Different outputs for similar inputs
**Cause:** Ambiguous instructions
**Solution:** Add explicit output format, more examples

### Problem: Fails on Haiku

**Symptoms:** Works on Opus/Sonnet but not Haiku
**Cause:** Instructions rely on inference
**Solution:** Add explicit steps, concrete examples

### Problem: Outdated Content

**Symptoms:** Examples don't match behavior
**Cause:** Skill not updated after changes
**Solution:** Update examples, re-test workflow

### Problem: Security Issues

**Symptoms:** Hardcoded secrets, unsafe commands
**Cause:** Security not considered during creation
**Solution:** Run security checklist, remediate findings

---

## Review Schedule Recommendations

**ALL skills are reviewed at public-grade standards.**

| Review Type | Frequency |
|-------------|-----------|
| Quick Review | Weekly |
| Standard Review | Monthly |
| Deep Review | Quarterly |

---

## Review Checklist Summary

Quick reference for what to check:

```
METADATA
[ ] Name: gerund, lowercase, hyphens, ≤64
[ ] Description: third-person, what+when, ≤1024

STRUCTURE
[ ] Under 500 lines
[ ] One-level references
[ ] Forward slashes
[ ] All files exist

CONTENT
[ ] Clear workflow
[ ] 2-3 examples
[ ] Anti-patterns
[ ] No placeholders

TECHNICAL
[ ] Commands work
[ ] Dependencies available
[ ] No secrets
[ ] Links valid

CROSS-MODEL
[ ] Haiku-compatible
[ ] Output specified
[ ] Steps numbered
```

---

## After the Review

### If Skill Passes

1. Update "last reviewed" metadata
2. Schedule next review
3. No other action needed

### If Issues Found

1. Prioritize by severity
2. Create specific action items
3. Assign owner for each item
4. Set fix deadlines
5. Re-review after fixes
