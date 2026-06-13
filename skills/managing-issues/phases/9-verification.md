# Phase 9: Implementation Verification

**Goal:** Verify implementation matches approved plan.
**Agent tool:** subagent_type: `<selected-agent>` (from Phase 1 selection plan, verify mode)
**Quality Gate:** QG-9 (Mandatory - Definition of Done)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-8 = PASS (Quality Review completed)
- [ ] All tests passing
- [ ] Typecheck passing
- [ ] Original implementation plan available
- [ ] All acceptance criteria documented

---

## PRE-STEP VALIDATION

VERIFY: QG-8 = PASS. STOP if quality review not complete. **This phase is MANDATORY – NEVER skip.**

---

## EXECUTION

**QG-9 scope:** Plan conformance and acceptance criteria exclusively. Code quality verification belongs to QG-8 and is NOT repeated here.

> QG-9 does NOT re-review code quality. That is QG-8's exclusive domain.
> QG-9 verifies WHAT was built matches WHAT was planned.

### Step 1: Invoke Architect for Verification

Use `mi-solution-designer` in verification mode. The agent spawns with no memory, so the dispatch **must include the QG-4 approved plan contents (or a path it can Read) and the acceptance criteria** — without the plan the agent cannot verify conformance and would return a false VERIFIED. Required payload: `{approved_plan, acceptance_criteria, changed_files}`.

1. Read implemented files
2. Compare against the approved plan (supplied in the dispatch)
3. Check acceptance criteria coverage
4. Confirm no unplanned scope introduced
5. Verify technical debt is documented
6. Report [VERIFIED | NEEDS CORRECTION]

### Step 2: Verification Criteria

| Criterion | Question |
|-----------|----------|
| Plan conformance | Does implementation match approved design? |
| Acceptance criteria | All requirements implemented? |
| No unplanned scope | Were changes limited to what was planned? |
| Tests pass | Detected test/typecheck commands still pass? |
| Technical debt | Any shortcuts or deviations documented? |

### Step 3: Correction Loop (if NEEDS CORRECTION)

```
IF architect reports NEEDS CORRECTION:
  1. Re-invoke software-developer to address specific issues
  2. Re-run the detected test command
  3. Re-run the detected typecheck command
  4. Re-invoke code-reviewer if substantial changes
  5. Re-invoke mi-solution-designer for verification
  6. Repeat until VERIFIED (max 3 iterations, then escalate)

ONLY proceed to Documentation after architect VERIFIED.
```

### Step 4: Document Deviations

If any deviations from plan:
- Document what changed
- Explain why deviation was necessary
- Confirm no acceptance criteria compromised

### Step 5: Spec compliance cross-reference (conditional)

**Condition:** Only when `spec_maturity >= complete` (detected by QG-0 pre-flight).

Use `mi-spec-compliance-checker` agent:

1. Pass the originating spec requirements path and project path
2. Agent reads spec FRs/NFRs, greps codebase for evidence
3. If naming contracts table exists in spec, validates those too
4. Returns compliance scorecard

**Handling results:**
- **All compliant:** Proceed to output artifacts
- **Partial/Non-compliant items found:**
  - Classify each item — single mi-spec-compliance-checker pass over the list, returning `{deviation_type: intentional | missed-requirement | ambiguous}` per item.
  - Intentional deviations: document justification, flag for spec update in Phase 10
  - Missed requirements: route back to Step 3 (correction loop)
  - Ambiguous items: the agent cannot call AskUserQuestion, so it returns these as `needs_user_input` (per SKILL.md rule 7); the orchestrator asks the user and routes per the answer — the checker never guesses the classification.

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Verification Report | VERIFIED or NEEDS CORRECTION |
| Plan Conformance | How well implementation matches plan |
| Deviations List | Any changes from original plan |
| Acceptance Verification | Per-criterion status |
| Spec Compliance Scorecard | Per-requirement compliance status (when spec linked) |

---

## POST-STEP VALIDATION

**ALL must be checked before proceeding to Phase 10.**

- [ ] Architect verification completed
- [ ] Verification status: VERIFIED (not NEEDS CORRECTION)
- [ ] All deviations documented and justified
- [ ] Implementation matches approved plan
- [ ] All acceptance criteria verified as met
- [ ] No unplanned changes introduced
- [ ] Spec compliance check completed (or skipped – no linked spec)
- [ ] All non-compliant items resolved or justified

---

## QUALITY GATE: QG-9

**Gate Type:** Mandatory (ALL tiers - Definition of Done)
**Gate ID:** QG-9

### Pass Criteria

| Criterion | Required |
|-----------|----------|
| Architect status | VERIFIED |
| Plan conformance | Full match or justified deviations |
| Acceptance criteria | ALL criteria met |
| Spec compliance | Zero non-compliant items without documented justification (when spec linked) |
| Can be overridden | **NO** |

### Verification Checkpoint

Present to user:

```markdown
## Implementation Verification

**Architect Status:** [VERIFIED | NEEDS CORRECTION]

### Plan Conformance
<assessment of how well implementation matches plan>

### Acceptance Criteria Verification
| Criterion | Status | Evidence |
|-----------|--------|----------|
| <criterion 1> | ✅/❌ | <where verified> |
| <criterion 2> | ✅/❌ | <where verified> |

### Deviations (if any)
| Planned | Actual | Justification |
|---------|--------|---------------|
| <original> | <changed> | <why> |

### Quick Validation (not a re-review – QG-8 owns code quality)
- Tests: detected test command passing
- Types: detected typecheck command passing

**Proceed to Documentation?** [Approve / Address Issues]
```

### Result

**QG-9 Result:** [PASS | FAIL]

### On FAIL (NEEDS CORRECTION)

1. Review architect feedback
2. Identify specific issues to address
3. Re-invoke software-developer for fixes
4. Re-run verification
5. Max 3 retries, then ESCALATE to user

### On ESCALATE

If cannot achieve VERIFIED after 3 attempts:
1. Present detailed findings to user
2. User must decide: [Retry | Accept with documented deviations | Abort]
3. If accepting deviations: Document in commit message

---

## NEXT PHASE

**QG-9 = PASS (VERIFIED) required to proceed to Phase 10: Documentation**

**STOP if QG-9 ≠ PASS. Do not proceed.**
