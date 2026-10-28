# Recommendation Template

All recommendations must follow this structure to be actionable.

---

## Template

```markdown
### Recommendation [N]: [Recommendation title in sentence case]

**Priority**: [Critical / High / Medium / Low]
**Related finding**: [Finding number(s)]
**Category**: [Category name]

#### Summary

[One sentence describing the recommended action]

#### Details

| Element | Content |
|---------|---------|
| **Action** | [Specific action verb + what to do] |
| **Owner** | [Role/name responsible for implementation] |
| **Timeline** | [Specific date or quarter] |
| **Expected benefit** | [Quantified outcome] |
| **Estimated cost** | [Implementation + ongoing costs] |
| **Dependencies** | [Prerequisites or related recommendations] |

#### Implementation steps

1. [First step]
2. [Second step]
3. [Third step]

#### Success metrics

- [Measurable outcome 1]
- [Measurable outcome 2]

---
```

---

## Example

```markdown
### Recommendation 1: Implement GymSoft-HR Suite integration

**Priority**: High
**Related finding**: Finding 3, Finding 7
**Category**: Integration

#### Summary

Deploy middleware integration between GymSoft and HR Suite to eliminate
manual data entry and reduce data discrepancies.

#### Details

| Element | Content |
|---------|---------|
| **Action** | Implement API-based integration using middleware platform |
| **Owner** | IT Director (Maria Santos) |
| **Timeline** | Q2 2026 |
| **Expected benefit** | Eliminate manual entry, reduce discrepancies from 12% to <1%, recover 160 staff-hours/month (USD 24,000/month savings) |
| **Estimated cost** | USD 75,000 implementation + USD 12,000/year maintenance |
| **Dependencies** | Vendor API documentation (Recommendation 2), IT staffing (Recommendation 5) |

#### Implementation steps

1. Obtain API documentation from GymSoft vendor (Q4 2025)
2. Select and procure middleware platform (Q1 2026)
3. Develop integration mappings and transformation rules (Q1 2026)
4. Implement and test in staging environment (Q2 2026)
5. Deploy to production with parallel processing validation (Q2 2026)
6. Decommission manual processes after 30-day stabilization (Q3 2026)

#### Success metrics

- Data discrepancy rate <1% (down from 12%)
- Manual data entry hours reduced by 90%
- Zero payroll processing delays due to data sync issues
- Staff satisfaction improvement in quarterly survey

---
```

---

## Formula

**Structure**: [Action verb] + [Specific action] + [Owner] + [Timeline] + [Expected benefit]

### Action Verb Examples

| Strength | Verbs |
|----------|-------|
| **Strong** | Implement, deploy, establish, create, develop |
| **Moderate** | Enhance, improve, update, revise, expand |
| **Advisory** | Consider, evaluate, explore, assess, review |

### Owner Specification

| ✅ Good | ❌ Bad |
|--------|-------|
| "IT Director (Maria Santos)" | "IT" |
| "Operations Director" | "Someone" |
| "COO" | "Management" |
| "HR Director" | "The team" |

### Timeline Specification

| ✅ Good | ❌ Bad |
|--------|-------|
| "Q2 2026" | "Soon" |
| "By March 2026" | "ASAP" |
| "Within 90 days" | "When possible" |
| "Phase 1: Q1, Phase 2: Q2" | "In phases" |

---

## Priority Guidelines

| Priority | Criteria | Timeline |
|----------|----------|----------|
| **Critical** | Compliance risk, safety issue, major financial impact | Within 30 days |
| **High** | Significant operational impact, >USD 100K annual value | Within 90 days |
| **Medium** | Moderate efficiency gain, <USD 100K annual value | Within 6 months |
| **Low** | Nice to have, best practice enhancement | Within 12 months |

---

## Recommendation Strength

### Mandatory Language

Use when compliance, safety, or critical risk:
- "must"
- "shall"
- "is required to"

### Strong Language

Use for high-priority operational improvements:
- "should"
- "we recommend"
- "we strongly recommend"

### Advisory Language

Use for optional enhancements:
- "consider"
- "may want to"
- "could explore"

---

## Validation Checklist

- [ ] Has specific action verb
- [ ] Owner assigned (name or role)
- [ ] Timeline specified (date or quarter)
- [ ] Expected benefit quantified
- [ ] Related finding referenced
- [ ] Priority assigned
- [ ] Implementation steps provided
- [ ] Success metrics defined
- [ ] Title in sentence case
- [ ] All headings in sentence case
