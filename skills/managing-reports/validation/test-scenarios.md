# Manual Test Scenarios

Use these scenarios to verify skill functionality after modifications.

---

## Test 1: CREATE Operation

**Setup:** No existing report
**Input:** "Create a new audit report for IT security assessment"
**Expected:**
- [ ] Todo list created with CREATE steps
- [ ] gather-report-requirements spawned
- [ ] 5 requirement categories asked
- [ ] Requirements specification produced
- [ ] design-report-structure spawned
- [ ] Outline follows Pyramid Principle
- [ ] Templates presented

**Pass Criteria:** All checkboxes satisfied, user confirms structure

---

## Test 2: REVIEW Operation (PASS case)

**Setup:** Well-formatted report with sentence case
**Input:** "Review the report at [path]"
**Expected:**
- [ ] Todo list created with REVIEW steps
- [ ] All 6 validators executed
- [ ] All 6 validators PASS
- [ ] Verdict: PASS
- [ ] Quality score recorded (advisory)

**Pass Criteria:** PASS verdict (all six validators pass)

---

## Test 3: REVIEW Operation (FAIL case)

**Setup:** Report with Title Case headings
**Input:** "Review the report at [path]"
**Expected:**
- [ ] validate-capitalization fails
- [ ] All violations enumerated with line numbers
- [ ] Verdict: FAIL (capitalization validator failed; all validators are blocking)
- [ ] Specific fixes provided

**Pass Criteria:** FAIL verdict, all Title Case violations found

---

## Test 4: MODIFY Operation

**Setup:** Report with known issues from REVIEW
**Input:** "Fix all the capitalization issues"
**Expected:**
- [ ] Modifications parsed from review
- [ ] Each change applied
- [ ] Before/after logged
- [ ] Full six-validator review re-run
- [ ] No new issues introduced

**Pass Criteria:** All issues fixed, change log complete

---

## Test 5: MAINTAIN Operation (version)

**Setup:** Existing report with document control section
**Input:** "Create version 1.1 with description: Updated findings"
**Expected:**
- [ ] Version number updated in metadata
- [ ] Version history table entry added
- [ ] Last modified date updated
- [ ] Confirmation provided

**Pass Criteria:** Document control section properly updated

---

## Test 6: Quality Gate Retry

**Setup:** Intentionally fail a step
**Input:** Provide invalid path
**Expected:**
- [ ] Input validation fails
- [ ] STOP condition triggered
- [ ] Clear error message
- [ ] User asked to provide valid input

**Pass Criteria:** Graceful failure with actionable message

---

## Test Execution Log

| Test | Date | Result | Notes |
|------|------|--------|-------|
| | | | |

---

## Running Tests

1. Create test report with known characteristics
2. Execute each test scenario
3. Check all expected items
4. Record result in execution log
5. If any test fails, investigate and fix before release
