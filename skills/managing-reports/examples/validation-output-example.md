# Validation Output Example

This example shows typical output from the review-report agent consolidating
a standard validation (all 6 validators). All six validators are blocking, so
any validator with an issue fails and the overall verdict is FAIL.

---

## Input

```
report_path: /project/reports/digital-audit-report.md
validation_level: standard
```

---

## Example Output

# Report Review Results

**Report:** /project/reports/digital-audit-report.md
**Reviewed:** 27 November 2025 14:35
**Validation level:** standard

---

## Overall Verdict: FAIL

### Summary

| Validator | Status | Issues |
|-----------|--------|--------|
| Capitalization | ✗ | 8 |
| Structure | ✓ | 0 |
| Style | ✗ | 2 |
| Formatting | ✗ | 3 |
| Precision | ✗ | 1 |
| Executive summary | ✓ | 0 |

**Validators passed:** 2/6
**Total issues (all blocking):** 14

---

## Issues (all must fix)

Every validator failure blocks delivery. Two validators passed; four failed.

### From: capitalization validator

| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | Line 45 | H2 "Key Findings" | Change to "Key findings" |
| 2 | Line 67 | H3 "System Integration Gaps" | Change to "System integration gaps" |
| 3 | Line 89 | H3 "Data Quality Issues" | Change to "Data quality issues" |
| 4 | Line 112 | H2 "Strategic Recommendations" | Change to "Strategic recommendations" |
| 5 | Line 145 | List item "The Main Problem" | Change to "The main problem" |
| 6 | Line 178 | Table header "Risk Level" | Change to "Risk level" |
| 7 | Line 203 | H4 "Implementation Timeline" | Change to "Implementation timeline" |
| 8 | Line 256 | H3 "Expected Outcomes" | Change to "Expected outcomes" |

### From: style validator

| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | Line 78 | Passive: "The system was reviewed by" | "The team reviewed the system" |
| 2 | Line 156 | Long sentence (45 words) | Split into two sentences |

### From: formatting validator

| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | Line 92 | Stacked headings (H2→H3) | Add introductory text between |
| 2 | Line 134 | Single-item list | Convert to paragraph or add items |
| 3 | Line 189 | Table without reference | Add "Table X shows..." before table |

### From: precision validator

| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | Line 234 | Date "15/11/2025" | Change to "15 November 2025" |

---

## Quality score (advisory)

This score is an advisory quality signal. It does **not** gate delivery –
delivery requires all six validators to PASS regardless of the score.

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Capitalization | 60/100 | 20% | 12 |
| Structure | 100/100 | 20% | 20 |
| Style | 90/100 | 15% | 13.5 |
| Formatting | 85/100 | 15% | 12.75 |
| Precision | 95/100 | 15% | 14.25 |
| Executive summary | 100/100 | 15% | 15 |
| **Total** | | 100% | **87.5/100** |

### Score interpretation (advisory only)

| Score range | Rating |
|-------------|--------|
| 90-100 | Excellent |
| 80-89 | Good ← current |
| 70-79 | Acceptable |
| 60-69 | Needs work |
| <60 | Poor |

---

## Next steps

Based on the FAIL verdict:

1. [ ] Fix all 14 issues – every one is blocking
2. [ ] Re-run the full six-validator review
3. [ ] Review with stakeholder before delivery

---

## Notes

- All six validators must PASS for the report to pass review; here capitalization,
  style, formatting, and precision all failed
- The quality score of 87.5 is advisory only and does not gate delivery
- After fixing every issue, re-run the full six-validator review to confirm PASS
