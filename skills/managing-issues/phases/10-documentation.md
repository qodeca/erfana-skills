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
TEST_CMD='npm test -- --run'   # or: absent
: "${TEST_CMD:?not substituted}"
[ "$TEST_CMD" = absent ] || eval "$TEST_CMD" 2>&1 | grep -E "Tests?:[[:space:]]+[0-9]+"
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

Update documentation beyond CLAUDE.md to reflect implementation changes. **Detect what the project actually has – do not assume a fixed layout.** Enumerate candidate targets first:

```bash
# Documentation surfaces present in this repo (adapt globs to the project's conventions)
ls CHANGELOG.md docs/CHANGELOG.md 2>/dev/null            # changelog, if any
git ls-files 'docs/**/*.md' '*.md' 2>/dev/null | head -50 # other documentation pages
```

Then update only the surfaces that exist and that this change affects:

1. **Changelog** (wherever it lives – repo root or `docs/`; skip if the project keeps none):
   - Add an entry under the current version for the implemented feature/fix
   - Follow the file's existing format (Keep a Changelog, or whatever it uses)

2. **Testing docs** (if the project documents its test suite):
   - Update test counts if tests were added
   - Add a new test-area entry if a new testing domain was introduced

3. **API / component / feature docs** (whichever the project maintains):
   - Update service or API documentation if public interfaces changed
   - Update component documentation if UI changed

4. **Contributor / how-to guides** (if present):
   - Update them if new patterns or workflows were established

If none of these surfaces exist, record "no project documentation surfaces detected beyond CLAUDE.md" – that is a valid Step 8 result, not a skipped step.

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
| Changed File List | Every file `mi-docs-updater` reported writing, appended to `PLANNED_FILES` (files only, never a directory) – Phase 12 stages exactly this list |
| Documentation Decision | Which of the three predicate rows applied: surfaces affected, surfaces present but unaffected, or no surfaces detected |
| Task List Advance | Phase 10 and `QG-10 quality gate` marked `completed`; Phase 11 `in_progress` with `QG-11a quality gate (embedded implementation review)` appended **before** `QG-11 quality gate` when `review_level = full`, `QG-11 quality gate` alone otherwise – see [../reference/progress-tracking.md](../reference/progress-tracking.md) |

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
| Agent-instruction file updated | If the project keeps one and the change affects it | If the project keeps one and the change affects it |
| Test count updated | If changed | If changed |
| JSDoc for new APIs | Optional | Required |
| Feature docs | Not required | If user-facing |
| Project docs | Not required | Changelog entry (if the project keeps one) plus any affected documentation page detected in Step 8 |
| Spec update report | N/A when no spec linked | Required when `spec_maturity >= partial` (Step 7) |
| Documentation decision | Recorded (one of the three rows in the predicate below) | Recorded (one of the three rows in the predicate below) |
| Changed files recorded | Every file `mi-docs-updater` reported writing is in `PLANNED_FILES` – file paths only, no directories. Cross-check it against `CHANGED_MD` below: a markdown file this run changed that is absent from `PLANNED_FILES` was written but not reported, and Phase 12 stages exactly that list, so it would never be committed | Same |
| Task list advanced | `QG-10 quality gate` and `Phase 10: Documentation` `completed`, `Phase 11: UAT` `in_progress`, `QG-11a quality gate` (when `review_level = full`) then `QG-11 quality gate` appended as `pending` | Same |

**Spec update report** records each Phase 9 intentional deviation applied to the spec text and the manifest status change. When a spec is linked, an absent report fails QG-10 – the spec silently drifting from the implementation is the failure this row prevents.

### Automated Verification (QG-10 predicate)

QG-10 is an Automated gate, so it passes on a concrete command result – not on prose judgement. The checks are **conditional on what this project actually has**: a Go, Rust or Python repo with no agent-instruction file and no markdown is a legitimate pass, not a failure, and the "do not over-document trivial changes" guidance below would otherwise contradict a predicate demanding a markdown edit on every run.

`NUMBER` is a recorded run-state value carried into the snippet as a literal ([../operations/implement.md](../operations/implement.md) – "The substitution preamble"); the guard exists because an empty value fails **open** – `grep "#"` matches the first markdown heading in any file.

**The changed-markdown list comes from the working tree.** Nothing is committed before Phase 12, so `git diff <base>...HEAD -- '*.md'` is empty on every standard run: the file loop below would never execute, no `QG-10 FAIL` could ever be printed, and this gate would pass unconditionally – including for genuinely missing documentation ([../operations/implement.md](../operations/implement.md) – "The change set before the commit exists").

```bash
# Run-state value - the orchestrator replaces the right-hand side with this run's literal:
NUMBER=42
[[ "$NUMBER" =~ ^[0-9]+$ ]] || { echo "QG-10 FAIL: NUMBER unresolved"; exit 1; }
fail=0

# The markdown this run touched, read from the working tree.
CHANGED_MD=$({ git diff --name-only; git diff --cached --name-only;
               git ls-files --others --exclude-standard; } | sort -u | grep '\.md$')

# 1. Agent-instruction file, only if the project keeps one. Checked in preference order -
#    CLAUDE.md first: an alphabetical `ls | head -1` would pick AGENTS.md whenever both exist.
AGENT_DOC=
for cand in CLAUDE.md AGENTS.md .cursorrules; do
  [ -f "$cand" ] && { AGENT_DOC=$cand; break; }
done
if [ -n "$AGENT_DOC" ] && printf '%s\n' "$CHANGED_MD" | grep -qx "$AGENT_DOC"; then
  # `\b` is a GNU extension; this bracket form is portable to BSD/macOS grep.
  grep -qE "#${NUMBER}([^0-9]|\$)" "$AGENT_DOC" \
    || { echo "QG-10 FAIL: $AGENT_DOC was edited but does not reference #${NUMBER}"; fail=1; }
fi

# 2. Markdown edits are required only when the project has documentation to edit
#    and this change affects it - see the decision below; never a bare "must edit a .md".

# 3. Relative links added by this phase resolve on disk
for f in $CHANGED_MD; do
  [ -f "$f" ] || continue
  for link in $(grep -oE '\]\(([^)#:]+\.md)' "$f" 2>/dev/null | sed 's/](//'); do
    [ -e "$(dirname "$f")/$link" ] || { echo "QG-10 FAIL: dead link $link in $f"; fail=1; }
  done
done

exit "$fail"
```

The link loop runs in this shell (no pipe into `while`), so `fail` survives and the snippet's exit status is the gate result rather than a constant 0.

**Pass predicate:** the snippet exits 0 (no `QG-10 FAIL` output), **and** the documentation decision below is recorded.

**The documentation decision (check 2, recorded not guessed).** Step 8 enumerated the project's documentation surfaces. Exactly one of these must hold, and which one must be stated in the phase's artifacts:

| Situation | QG-10 |
|---|---|
| The project has documentation surfaces and this change affects one or more | PASS only when `CHANGED_MD` (the working-tree list above) is non-empty and names every affected surface. An affected surface with no edit in that list is a QG-10 **failure**, and is now reachable: the list reflects uncommitted edits |
| The project has documentation surfaces but none is affected (internal refactor, no behaviour or interface change) | PASS with the recorded statement "documentation surfaces present, none affected by this change" |
| The project keeps no documentation surfaces at all (no agent-instruction file, no `*.md` beyond an untouched README) | PASS with the recorded statement "no documentation surfaces detected" |

"Nothing needed changing" is a legitimate pass in the last two rows – but only as a recorded finding, never as an unstated default.

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

**Task list:** on PASS, mark `QG-10 quality gate` then `Phase 10: Documentation` `completed`, set `Phase 11: UAT` `in_progress`, and append the gate items for Phase 11 as `pending` – **when `review_level = full`, `QG-11a quality gate (embedded implementation review)` first, then `QG-11 quality gate`**; QG-11a is a pre-step and must sit above QG-11. At any other `review_level`, append `QG-11 quality gate` alone ([progress-tracking](../reference/progress-tracking.md)).

**Run state:** record `QG-10=PASS`, refresh `head_sha` / `updated_at` / the task-list snapshot, and PATCH the run-state comment ([post-review-tracking](../reference/post-review-tracking.md) – "Updating in place"). A failed write never fails the gate.

**STOP if QG-10 ≠ PASS. Do not proceed.**
