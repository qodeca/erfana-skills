# Phase 5: Implementation

**Goal:** Write code and tests following the approved plan.
**Agents:** `software-developer`, `test-writer`, `e2e-test-writer` (when e2e work is in scope)
**Quality Gate:** QG-5 (Automated)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-4 = PASS (Architecture plan recorded – architect-verified, non-blocking)
- [ ] Implementation plan available and APPROVED
- [ ] Test strategy defined
- [ ] Affected files list available
- [ ] Patterns inventory available
- [ ] UX specification available (if `has_ui_impact = true`, from Phase 4 Step 1a)
- [ ] `task_type` and the three test-category commands available (from QG-0)
- [ ] `test_harness_decisions` available (from Phase 4 Step 2a)

---

## PRE-STEP VALIDATION

VERIFY: QG-4 = PASS (plan recorded, architect-verified). When `deep_review_gates = true`, QG-4a and QG-4b must also be PASS. STOP if not.

---

## EXECUTION

### Step 1: Implementation with software-developer

Follow `software-developer` agent:

1. Review implementation plan
2. Read existing code patterns
3. Create new files using Write()
4. Modify existing files using Edit()
5. Verify with the detected `TYPECHECK_CMD`

**Follow the plan sequence exactly.**

**When `has_ui_impact = true`:**
Implementation agent MUST reference UX specification from Phase 4 for:
- Accessibility requirements (ARIA attributes, semantic HTML, keyboard navigation)
- Platform-specific patterns (touch targets, navigation conventions)
- Design token usage (as specified in UX spec)
- Edge case handling (empty, error, loading states per UX spec)

### Step 2: Write Tests (TDD-friendly)

The categories to write are the ones the QG-5 matrix marks blocking for this `task_type`, plus any category Phase 4 Step 2a decided to `build`. Categories decided `descope` or `accept` are not written here.

| Category | Agent | Scope |
|---|---|---|
| Unit | `test-writer` | New and changed functions, branches, edge cases |
| Integration | `test-writer` | Cross-module and cross-boundary behaviour of the touched surface |
| E2E | `e2e-test-writer` | User-visible flows through the touched surface. `test-writer` explicitly defers e2e work, so dispatch `e2e-test-writer` – do not ask `test-writer` to cover it |

**If `e2e-test-writer` does not resolve** (it is absent from the Phase 1 discovery catalogue, or discovery could not read its capabilities), the e2e work item **surfaces the failure – it never falls through silently**. Report to the user that the e2e category cannot be dispatched and why, and take one of: assign the e2e work to another agent whose declared capabilities cover it, or return to Phase 4 Step 2a and record the category `descope` / `accept` with that reason. An enforced e2e category with no agent to write it stays a QG-5 failure; it is never quietly reassigned to `test-writer`.

Where Phase 4 chose `build`, the harness setup (runner config, fixtures, CI wiring) is part of this step, in the sequence position the approved plan gave it.

**Target:** >80% coverage for new code

### Step 3: Incremental Verification

After each major change, run the detected commands. Both arrive as literals in the snippet – the word `absent` where QG-0 detected nothing, never an empty string, so a missed substitution stops the snippet instead of silently skipping the check:

```bash
TYPECHECK_CMD='tsc --noEmit'   # or: absent
TEST_CMD='npm test -- --run'   # or: absent
: "${TYPECHECK_CMD:?not substituted}" "${TEST_CMD:?not substituted}"

[ "$TYPECHECK_CMD" = absent ] || eval "$TYPECHECK_CMD"   # Must pass
[ "$TEST_CMD" = absent ]      || eval "$TEST_CMD"        # Must pass
```

### Step 4: Modern Testing Approaches (Tier 2)

Consider where applicable:

| Approach | When to Use |
|----------|-------------|
| Property-based | Complex input domains |
| Contract testing | IPC handlers, APIs |
| AI-assisted generation | Edge case discovery |
| Mutation testing | Verify test quality |

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Code Changes | New/modified files per plan |
| Changed File List | Every file path the implementation and test agents reported creating or modifying, appended to `PLANNED_FILES` (files only, never a directory). Phase 12 stages exactly this list, so a path an agent wrote but did not report is a path that never gets committed |
| Test Suite | Tests for all new code, in every category the matrix marks blocking |
| Type Check Results | Detected `TYPECHECK_CMD` output |
| Test Results | Detected `TEST_CMD` output, plus per-category results for every enforced category |
| UX Spec Conformance | Accessibility, token, and edge-state work from the Phase 4 UX spec applied (when `has_ui_impact = true`) |
| Task List Advance | Phase 5 and `QG-5 quality gate` marked `completed`; Phase 6 `in_progress` with `QG-6 quality gate` appended – see [../reference/progress-tracking.md](../reference/progress-tracking.md) |

---

## POST-STEP VALIDATION

**ALL must be checked before proceeding to Phase 6.**

- [ ] All planned files created/modified
- [ ] Implementation follows approved plan
- [ ] Code follows existing codebase patterns
- [ ] Detected typecheck command passes (or none detected)
- [ ] Detected test command passes (or none detected)
- [ ] Tests written for new code (>80% coverage target)
- [ ] No scope creep (only acceptance criteria addressed)

### Test file existence check (MANDATORY)

Apply **the project's own test-file convention**, as inventoried by Phase 3 discovery – co-located sibling (`foo.test.ts`, `foo_test.go`, `foo.spec.rb`), parallel tree (`tests/test_foo.py`), or in-file (`#[cfg(test)]` in Rust). Do not impose another language's convention on the repo.

For every NEW file created during implementation that carries behaviour:
- [ ] A test file (or in-file test block) exists for it, in the project's convention and location
- [ ] Its tests cover the categories the matrix marks blocking for this `task_type`

**Exceptions** (no test file required) – the language-neutral classes:
- Pure re-export / barrel / module-index files
- Type-only or interface-only declarations
- Stylesheets and other non-executable assets
- Generated code committed from a generator
- Test files themselves

⛔ STOP if a behaviour-carrying new file has no corresponding tests **in a category this run still enforces**.

**Descoped and accepted categories are honoured here too.** A category Phase 4 Step 2a recorded as `descope` or `accept`, and a category the matrix marks `exempt` or `advisory` for this `task_type`, is not a gap this check may STOP on – the decision was made and approved at QG-4, and re-opening it here contradicts both QG-5's own "Absent commands" table and the "no scope creep" criterion. Record the missing coverage against the recorded decision and continue. Only a file with no test in an **enforced** category is a STOP.

### File size pre-check (MANDATORY)

- [ ] No modified or created file exceeds 500 lines
- [ ] Files approaching 400+ lines are flagged for proactive splitting consideration

⛔ STOP if any file exceeds 500 lines. Extract utilities, split components, or refactor before proceeding to review phases.

### Edge Case Verification (MANDATORY for Tier 2+)

Before proceeding to Phase 6, verify edge cases are documented:

| Category | Verification |
|----------|--------------|
| Empty/null input | [ ] Handling verified and tested |
| Large input | [ ] Size limits defined and enforced |
| Malformed input | [ ] Graceful error handling implemented |
| Boundary conditions | [ ] Edge values tested (0, max, negative) |
| Concurrent access | [ ] Race conditions considered (if applicable) |
| Error states | [ ] All error paths have proper handling |

#### Documentation Requirements
- [ ] List of handled edge cases documented in code comments or tests
- [ ] List of explicitly NOT handled cases with justification
- [ ] Security edge cases identified and addressed

⛔ STOP if edge cases not verified for Tier 2+ issues

---

## QUALITY GATE: QG-5

**Gate Type:** Automated (ALL tiers)
**Gate ID:** QG-5

### Pass Criteria

| Criterion | Check |
|-----------|-------|
| Typecheck | detected `TYPECHECK_CMD` exits 0 (or none detected) |
| Aggregate tests | detected `TEST_CMD` exits 0 (or none detected) |
| Test categories | every **enforced** category (matrix below) exits 0 – **and an enforced category with no command is a failure, not a pass** |
| Coverage | New code >80% covered (if a coverage tool is present) |
| Plan conformance | All planned changes made |
| No scope creep | Only acceptance criteria addressed |
| UX spec applied | When `has_ui_impact = true`: the Phase 4 UX spec's accessibility requirements, design tokens, and edge states are implemented. N/A when the flag is false |
| Changed files recorded | Every file the implementation and test agents reported writing is in `PLANNED_FILES` – file paths only, no directories |
| Task list advanced | `QG-5 quality gate` and `Phase 5: Implementation` `completed`, `Phase 6: Architectural Review` `in_progress`, `QG-6 quality gate` appended as `pending` |

### Test-category matrix (risk-scaled)

Rows are the categories detected at QG-0 Step 4a; columns are the `task_type` from QG-0 Step 5a.

| Category | docs | bug | feature | refactor |
|---|---|---|---|---|
| Unit | exempt | BLOCK | BLOCK | BLOCK |
| Integration | exempt | advisory | BLOCK | BLOCK |
| E2E | exempt | BLOCK iff `has_ui_impact` | BLOCK iff `has_ui_impact` | BLOCK iff `has_ui_impact` |

- **BLOCK** – the category's suite must exist, cover the touched surface, and exit 0. QG-5 fails otherwise.
- **advisory** – run it if it exists and record the result; a failure is reported, not blocking.
- **exempt** – not enforced. `docs` is the only task type that may pass a category with no command by default.
- **`has_ui_impact`** is the flag QG-0 Step 5c sets and Phase 3 may upgrade – the same flag the UX track uses. There is no separate e2e trigger.

**Absent commands.** A BLOCK category whose Phase 0 command is `absent` was already decided at QG-4 (Phase 4 Step 2a). Read `test_harness_decisions`:

| Decision | Enforced here? |
|---|---|
| `build` | Yes – the suite must now exist and exit 0. "No command detected" is a work item and QG-5 fails until it is done |
| `descope` | No – the category is skipped for this run |
| `accept` (with justification) | No – skipped, and the recorded justification travels to Phase 12 |

QG-5 never opens this decision itself: raising new harness work here would contradict the "no scope creep" criterion above and the plan recorded at QG-4.

### Automated Verification

**Derive the enforced set first, then iterate only over it.** The filter is the matrix above plus `test_harness_decisions` – not "is the command `absent`". Build `ENFORCED` by walking the three categories:

| Category | Enforced when |
|---|---|
| Unit | `task_type` ≠ `docs`, **and** its `test_harness_decisions` entry is not `descope` / `accept` |
| Integration | `task_type` ∈ {`feature`, `refactor`}, **and** not `descope` / `accept`. On `bug` it is advisory: run it if present, record the result, never fail on it |
| E2E | `task_type` ≠ `docs` **and** `has_ui_impact = true`, **and** not `descope` / `accept` |

`task_type = docs` yields an empty enforced set – every category is exempt, and a detected command does not resurrect it.

**The list is emitted, not dereferenced.** Each Bash call is a fresh process, so a category's command has to arrive **as text inside this snippet** ([../operations/implement.md](../operations/implement.md) – "The substitution preamble"). The orchestrator writes one `category|command` line per enforced category into the here-document below, using the literal word `absent` where QG-0 detected no command. Naming variables instead – `UNIT_TEST_CMD` – would dereference nothing in this process and pass every category without running a test.

```bash
fail=0

# Enforced categories: one `category|command` line each, `absent` where no command exists.
# Emit exactly the rows the table above derives - a category missing from this list is a
# category that never runs. `docs` (empty enforced set) emits the single line `none|exempt`.
while IFS='|' read -r cat cmd; do
  case "$cat" in ""|\#*) continue ;; none) echo "QG-5: enforced set empty (task_type = docs)"; continue ;; esac
  case "$cmd" in
    "")      echo "QG-5 FAIL: enforced category '$cat' carries no command line - the emitted list is malformed"; fail=1; continue ;;
    absent)  echo "QG-5 FAIL: '$cat' is enforced but no suite exists (Phase 4 decided 'build')"; fail=1; continue ;;
  esac
  eval "$cmd" || { echo "QG-5 FAIL: '$cat' suite failed"; fail=1; }
done <<'ENFORCED_LIST'
unit|npm test -- --run
e2e|absent
ENFORCED_LIST

# Advisory categories, same shape. A failure here is recorded, never blocking.
while IFS='|' read -r cat cmd; do
  case "$cat" in ""|\#*|none) continue ;; esac
  [ "$cmd" = absent ] || [ -z "$cmd" ] || eval "$cmd" \
    || echo "QG-5 advisory: '$cat' failed (recorded, not blocking)"
done <<'ADVISORY_LIST'
integration|npm run test:integration
ADVISORY_LIST

[ "$fail" -eq 0 ] || exit 1
```

The two here-documents are fed to the loops directly (not through a pipe), so `fail` is set in this shell and the final line is what makes the gate exit non-zero. The rows shown are placeholders: replace them wholesale with this run's derived set before running the snippet, and never run it with the example rows still in place.

**Every detected check must pass, every enforced category must have a command to run, and no exempt, advisory, descoped or accepted category can fail this gate.**

### Result

**QG-5 Result:** [PASS | FAIL]

### On FAIL

1. Identify specific failure (typecheck, test, coverage)
2. Fix the identified issue
3. Re-run verification
4. Max 3 retries, then ESCALATE to user

### Common Failures

| Failure | Resolution |
|---------|------------|
| Type error | Fix type annotations or implementation |
| Test failure | Debug and fix implementation or test |
| Low coverage | Add missing tests |
| Scope creep detected | Revert unplanned changes |
| Enforced category has no suite | Phase 4 decided `build` – finish the harness and its tests; this is a work item, never a pass |
| E2E failing on a UI change | Dispatch `e2e-test-writer`; `test-writer` does not cover e2e |

---

## Implementation Guidelines

**DO:**
- Follow existing patterns in codebase
- Keep changes focused on acceptance criteria
- Write tests alongside implementation
- Verify after each major change

**DO NOT:**
- Add unplanned features ("while I'm here...")
- Change unrelated code
- Skip test writing
- Ignore typecheck warnings

---

## NEXT PHASE

**QG-5 = PASS required to proceed to Phase 6: Architectural Review**

**Task list:** on PASS, mark `QG-5 quality gate` then `Phase 5: Implementation` `completed`, set `Phase 6: Architectural Review` `in_progress`, and append `QG-6 quality gate` as `pending` ([progress-tracking](../reference/progress-tracking.md)).

**Run state:** record `QG-5=PASS`, refresh `head_sha` / `updated_at` / the task-list snapshot, and PATCH the run-state comment ([post-review-tracking](../reference/post-review-tracking.md) – "Updating in place"). A failed write never fails the gate.

**STOP if QG-5 ≠ PASS. Do not proceed.**
