# Tier Selection Guide

How to choose the right documentation tier for your feature.

---

## Quick Reference

| Tier | Name | Files | Registry | Words | Validation |
|------|------|-------|----------|-------|------------|
| T1 | Issue | 2 | Yes | 50-150 | None |
| T2 | Spec | 2 | Yes | 200-500 | Exists |
| T3 | Lite spec | 4 | Yes | 500-1500 | 50% |
| T4 | Standard spec | 6 | Yes | 1000-3000 | 80% |

---

## Tier 1: Issue

**Output:** `specs/spec-t1-{id}-{slug}/`
**Files:** manifest.json, spec.md

### When to Use

- Bug fixes
- Trivial features (1-5 requirements)
- Quick enhancements
- Single-concern changes
- No cross-component impact

### Examples

- Add keyboard shortcut for existing action
- Fix CSS alignment issue
- Add tooltip to button
- Update error message text

### Format

```markdown
# [Feature Name]

## Why
[1-2 sentences]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Done When
[Success criteria]
```

---

## Tier 2: Spec

**Output:** `specs/spec-t2-{id}-{slug}/`
**Files:** manifest.json, spec.md

### When to Use

- Simple features (5-15 requirements)
- Clear, well-defined scope
- Single user concern
- No external integrations
- No security implications

### Examples

- Export to PDF feature
- Dark mode toggle
- Search within file
- Auto-save functionality

### Structure

1. **Overview** - Summary, purpose, scope
2. **Requirements** - FR and NFR combined
3. **Acceptance Criteria** - Test cases

---

## Tier 3: Lite spec

**Output:** `specs/spec-t3-{id}-{slug}/`
**Files:** manifest.json, requirements/ (01-overview.md, 02-requirements.md, 03-acceptance.md)

### When to Use

- Complex features (15-30 requirements)
- Multiple related concerns
- Touches multiple components
- Needs traceability
- Has quality requirements

### Examples

- User authentication system
- Project settings management
- Terminal integration
- File watcher system

### Structure

| File | Content |
|------|---------|
| manifest.json | Metadata, tier: "T3", sections |
| requirements/01-overview.md | Summary, purpose, scope |
| requirements/02-requirements.md | FR + NFR combined |
| requirements/03-acceptance.md | Test cases, definition of done |

### Validation

- Threshold: 50%
- Checks: Completeness, requirements quality, consistency

---

## Tier 4: Standard spec

**Output:** `specs/spec-t4-{id}-{slug}/`
**Files:** manifest.json, requirements/ (01-05 sections)

### When to Use

- Major features (30+ requirements)
- Architectural impact
- External integrations
- Security-critical
- Multiple user roles
- Complex workflows
- Regulatory requirements

### Examples

- Payment integration
- Multi-tenant architecture
- Role-based access control
- API gateway implementation

### Structure

| File | Content |
|------|---------|
| manifest.json | Metadata, tier: "T4", sections |
| requirements/01-overview.md | Summary, purpose, scope |
| requirements/02-requirements.md | FR + NFR combined |
| requirements/03-use-cases.md | User flows with actors |
| requirements/04-acceptance.md | Test cases, definition of done |
| requirements/05-notes.md | Constraints, assumptions, dependencies |

### Validation

- Threshold: 80%
- Checks: All T3 checks plus use case quality, cross-references

---

## Decision Matrix

| Question | T1 | T2 | T3 | T4 |
|----------|----|----|----|----|
| Requirements count? | 1-5 | 5-15 | 15-30 | 30+ |
| External integrations? | No | No | Maybe | Yes |
| Security-critical? | No | No | Maybe | Yes |
| Multiple user roles? | No | No | No | Yes |
| Architectural impact? | No | No | Some | Yes |
| Needs traceability? | No | No | Yes | Yes |
| Registry entry needed? | Yes | Yes | Yes | Yes |

---

## Tier Override Reasons

### Upgrade to Higher Tier

- Feature has hidden complexity
- External dependencies discovered
- Security implications found
- Multiple teams involved
- Compliance requirements

### Downgrade to Lower Tier

- Scope was overestimated
- Feature is well-understood
- Similar feature exists as template
- Time constraints require simplicity

---

## Common Mistakes

### Over-engineering (Using Higher Tier Than Needed)

❌ T4 for a simple search feature
✅ T2 is sufficient for 10 requirements with clear scope

### Under-engineering (Using Lower Tier Than Needed)

❌ T1 for payment integration
✅ T4 is necessary for security, compliance, and multiple flows

### Wrong Location

❌ Spec in wrong directory
✅ All specs (T1-T4) go in `specs/spec-t{tier}-{id}-{slug}/`

❌ Missing registry entries
✅ All tiers (T1-T4) require registry entries

---

## Comparison: Old vs New

| Old (9 sections) | New Location | Tiers |
|------------------|--------------|-------|
| 01 Executive Summary | 01-overview.md | T2-T4 |
| 02 Business Objectives | Removed (in overview briefly) | - |
| 03 Stakeholders | Removed | - |
| 04 Functional Requirements | 02-requirements.md | T2-T4 |
| 05 Non-Functional Requirements | 02-requirements.md | T2-T4 |
| 06 Use Cases | 03-use-cases.md | T4 only |
| 07 Acceptance Criteria | 03-acceptance.md (T3) / 04-acceptance.md (T4) | T2-T4 |
| 08 Constraints & Assumptions | 05-notes.md | T4 only |
| 09 Appendices | 05-notes.md | T4 only |

---

## Word Count Guidelines

| Tier | Min | Max | Sweet Spot |
|------|-----|-----|------------|
| T1 | 50 | 150 | 100 |
| T2 | 200 | 500 | 350 |
| T3 | 500 | 1500 | 1000 |
| T4 | 1000 | 3000 | 2000 |

If your documentation significantly exceeds these ranges, consider:
- Splitting into multiple features
- Upgrading to higher tier
- Removing redundant content
