# Manifest Validation Checklist

Validation criteria for spec manifest.json files.

---

## Required Fields (Critical)

| Field | Type | Validation |
|-------|------|------------|
| `version` | string | Semantic version format (x.y.z) |
| `created` | string | ISO 8601 datetime |
| `sections` | array | Non-empty, all standard sections for tier |
| `statistics` | object | Contains required counters |

**Score: 0 if any missing (blocking)**

---

## Section Entries (20 points)

For each section in `sections` array:

| Check | Points | Criteria |
|-------|--------|----------|
| ID present | 2 | Format: 01-05 (tier-dependent) |
| File present | 2 | Matches expected pattern |
| Title present | 1 | Non-empty string |
| File exists | 3 | Actual file at path |
| Word count accurate | 2 | Within ±10% of actual |

**Total: 10 points per section × sections = variable max**

---

## Statistics Accuracy (15 points)

| Check | Points | Criteria |
|-------|--------|----------|
| total_sections | 3 | Equals sections array length |
| total_words | 3 | Within ±10% of sum |
| total_requirements | 3 | Matches FR count in section 02 |
| total_use_cases | 3 | Matches UC count in section 03 (T4 only) |
| total_stakeholders | 3 | Matches types in section 01 |

---

## Optional Fields (14 points)

| Field | Points | Criteria |
|-------|--------|----------|
| updated | 2 | ISO 8601, >= created |
| application.name | 2 | Non-empty string |
| validation.overall_score | 2 | 0-100 range |
| history | 2 | Array with at least 1 entry |
| scope.type | 2 | Valid enum value |
| tags | 2 | Array of non-empty strings |
| related_specs | 2 | Array of valid spec IDs (integers) |

---

## History Entries (5 points)

If history present, for each entry:

| Check | Points |
|-------|--------|
| version present | 1 |
| date present | 1 |
| changes present | 1 |
| sections_affected valid | 2 |

---

## Scoring

| Score | Status |
|-------|--------|
| 100% | Excellent |
| 80-99% | Pass |
| 60-79% | Marginal (warnings) |
| <60% | Fail |

---

## Severity Categories

### Critical (Block)
- Missing required fields
- Invalid JSON syntax
- Section files missing

### High
- Statistics mismatch > 20%
- Missing section entries
- Invalid version format

### Medium
- Word count mismatch > 10%
- Missing optional fields
- Outdated timestamps

### Low
- Minor formatting issues
- Empty history
- Missing descriptions

---

## Validation Procedure

```
1. Parse JSON
   ⛔ STOP if invalid syntax

2. Check required fields
   ⛔ STOP if any missing

3. Validate each section entry
   - Check file exists
   - Compare word counts

4. Validate statistics
   - Compare counts to actual

5. Check optional fields
   - Add points if present and valid

6. Calculate final score
```

---

## Auto-fix Recommendations

| Issue | Auto-fix |
|-------|----------|
| Wrong word count | Recalculate from files |
| Missing updated | Set to now |
| Statistics mismatch | Recalculate from sections |
| Missing history | Add single "imported" entry |
