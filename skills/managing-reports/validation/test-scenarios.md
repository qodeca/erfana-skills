# Manual Test Scenarios

Use these scenarios to verify skill functionality after modifications.

---

## Test 1: CREATE Operation

**Setup:** No existing report
**Input:** "Create a new audit report for IT security assessment"
**Expected:**
- [ ] Todo list created with CREATE steps
- [ ] Skill interviews the user directly (AskUserQuestion, 5 categories); no subagent asks questions
- [ ] gather-report-requirements spawned with interview_answers, compiles the spec
- [ ] Requirements specification persisted to disk (direct Write)
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
- [ ] User approved the concrete change list via AskUserQuestion; STOP without approval
- [ ] Backup written next to the report as `<name>.pre-modify-<YYYYMMDD-HHMMSS>.md`; backup path recorded
- [ ] modify-report invoked with backup_path pointing at that copy and approved_by_user: true
- [ ] Each change applied
- [ ] Before/after logged
- [ ] Full six-validator review re-run
- [ ] No new issues introduced

**Pass Criteria:** All issues fixed, change log complete, backup file present alongside the report

---

## Test 5: MAINTAIN Operation (version)

**Setup:** Existing report with document control section
**Input:** "Create version 1.1 with description: Updated findings"
**Expected:**
- [ ] Target path confirmed with the user before delegating
- [ ] Pre-write snapshot copied to `<name>.pre-version-<current-version>.md` (or, if that path already exists, `<name>.pre-version-<current-version>-<YYYYMMDD-HHMMSS>.md`); never overwrites an existing snapshot; STOP on failure
- [ ] Version number updated in metadata
- [ ] Version history table entry added
- [ ] Last modified date updated
- [ ] Confirmation provided

**Pass Criteria:** Document control section properly updated, pre-version snapshot present

---

## Test 5b: MAINTAIN Operation (restore collision)

**Setup:** Archived report; a file already exists at the intended destination path
**Input:** "Restore [archive_file] to [destination]"
**Expected:**
- [ ] Target path confirmed with the user before delegating
- [ ] Destination collision detected; maintain-report STOPs with a collision error naming the existing file
- [ ] Skill confirms overwrite with the user
- [ ] Re-invoked with `overwrite: true`; copy proceeds to destination
- [ ] Metadata updated (restored date) and restoration logged

**Pass Criteria:** No overwrite without explicit user-confirmed `overwrite: true` re-invoke

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
