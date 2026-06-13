# Phase 4: Architecture

**Goal:** Design implementation approach with architect verification.
**Agent tool:** subagent_type: `<selected-agent>` (from Phase 1 selection plan)
**Quality Gate:** QG-4 (User-Approval - ALL tiers)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-3 = PASS (Discovery completed)
- [ ] Affected files list available
- [ ] Patterns inventory available
- [ ] Complexity assessment available
- [ ] Acceptance criteria validated

---

## EXECUTION

### Design-doc shortcut (if spec_maturity == "complete_with_design")

When Phase 0 reports `spec_maturity` of `complete_with_design`, an approved design document already exists. Execute validation mode instead of design creation:

1. Read the existing design document from the spec directory (`design/sd-*.md`)
2. Invoke mi-solution-designer in **VALIDATION mode** (not creation mode):
   - Verify plan completeness against acceptance criteria
   - Verify pattern alignment with current codebase
   - Verify risk coverage and mitigation strategies
   - Verify file paths and component structure still valid
3. IF validation passes --> present design summary to user for approval (QG-4)
4. IF validation fails (design stale, patterns changed) --> fall back to full Phase 4 design creation below

**Skipped in design-doc mode:** Design creation from scratch, pattern research
**Preserved in design-doc mode:** Architect verification, user approval gate (QG-4 still required)

Note: The fallback to full Phase 4 is seamless -- the designer creates a new design incorporating findings from the failed validation.

### Step 1: Invoke Architect Agent

#### Step 1a: UX design specification (conditional)

**Condition:** `has_ui_impact = true` (from Phase 0 or upgraded by Phase 3)

**Skip condition:** If `has_ui_impact = false`, skip directly to Step 1b.

Invoke `ux-designer` agent to produce UX specification BEFORE implementation planning:

1. **Input to ux-designer:**
   - Issue title, body, acceptance criteria
   - Affected files (from Phase 3)
   - Existing design patterns (from Phase 3)
   - Platform context (web/desktop/mobile – from project analysis)

2. **ux-designer produces:**
   - Information architecture (navigation, content hierarchy)
   - Interaction design (states, transitions, feedback patterns)
   - Accessibility requirements (relevant WCAG 2.2 AA criteria)
   - Platform guideline notes (Apple HIG / Material Design 3 / Fluent 2)
   - Design token requirements (new tokens needed, existing tokens to use)
   - Edge case specifications (empty, error, loading, boundary states)

3. **Feed UX spec into Step 1b:** The implementation plan MUST reference and incorporate the UX specification. The mi-solution-designer receives the UX spec as additional input.

**Design-doc shortcut interaction:** If `spec_maturity == "complete_with_design"` AND the existing design doc already includes UX specifications, ux-designer validates existing UX spec instead of creating new one (same pattern as mi-solution-designer validation mode).

#### Step 1b: Invoke solution designer

Use `mi-solution-designer` agent to:
1. Read acceptance criteria
2. Review affected files
3. Consider existing patterns
4. Design component structure
5. Plan implementation steps
6. Define test strategy
7. Identify risks
8. **If spec exists:** Persist design to `specs/spec-t{tier}-{id}-{slug}/`

**Spec Integration:**
When implementing a feature with an existing spec (T3/T4):
- Pass `spec_id`, `spec_slug`, and `project_path` to mi-solution-designer
- Agent persists design to `specs/spec-t{tier}-{id:03d}-{slug}/sd-{seq:03d}-{slug}.md`
- Agent returns `register_with_spec` for orchestrator to link design in registry
- **Design-doc validation mode:** The existing design document is NOT overwritten. Validation results are added as annotations.

Example:
```
Input: spec_id=1, spec_slug="unified-search", project_path="/home/user/project"
Output path: specs/spec-t3-001-unified-search/sd-001-implementation.md
Registry link: {"register_with_spec": {"spec_id": 1, "doc_type": "design", "doc_path": "specs/spec-t3-001-unified-search/sd-001-implementation.md"}}
```

### Step 2: Produce Implementation Plan

Use template: `templates/implement/implementation-plan.md`

Plan must include:
- Approach summary
- Files to modify/create
- Implementation sequence
- Test strategy
- Risks and mitigations

### Step 3: Architect Verification Gate

**BEFORE presenting to user**, verify plan internally:

```
Verification criteria:
- [ ] All acceptance criteria addressed
- [ ] Aligns with existing patterns
- [ ] All risks identified with mitigations
- [ ] Test strategy covers all changes
- [ ] All affected files/modules identified
```

**Report:** [APPROVED | NEEDS REVISION]

### Step 4: Correction Loop (if NEEDS REVISION)

```
IF architect reports NEEDS REVISION:
  1. Address each identified issue
  2. Update the implementation plan
  3. Re-invoke mi-solution-designer for verification
  4. Repeat until APPROVED

ONLY present to user after architect APPROVED.
```

### Step 5: Present to User

Present architect-approved plan for user approval.

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Implementation Plan | Complete plan with sequence and tests |
| Architect Verification | APPROVED status |
| Risk Register | All risks with mitigations |
| Test Strategy | How changes will be tested |

---

## Quality Gate

**Success criterion:** Architect-verified APPROVED implementation plan; user-approved at QG-4. **Note:** Phase 4 may write a design doc (`specs/.../sd-*.md`) when a spec is linked — that single write is gated by user approval at QG-4 and the architect verification step inline; no separate POST-STEP block needed.

---

## QUALITY GATE: QG-4

**Gate Type:** User-Approval (ALL tiers)
**Gate ID:** QG-4

### Pass Criteria

| Criterion | Required |
|-----------|----------|
| Plan completeness | All acceptance criteria covered |
| Architect verified | APPROVED (not NEEDS REVISION) |
| User approved | Explicit approval received |

### User Checkpoint

Present to user:

```markdown
## Implementation Plan

**Issue:** #<number> - <title>
**Architect Verification:** APPROVED

### Approach
<summary of approach>

### Changes
| File | Action | Description |
|------|--------|-------------|
| <file1> | Modify | <what changes> |
| <file2> | Create | <purpose> |

### Implementation Sequence
1. <step 1>
2. <step 2>
3. <step 3>

### Test Strategy
- Unit tests: <coverage>
- Integration tests: <scope>
- Edge cases: <list>

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| <risk> | <impact> | <action> |

### Estimated Effort
<effort assessment>

**Approve plan?** [Approve / Revise / Abort]
```

### Result

**QG-4 Result:** [PASS | FAIL]

### On FAIL

If user requests revision:
1. Gather specific feedback
2. Re-invoke mi-solution-designer with feedback
3. Re-run architect verification
4. Present revised plan
5. Max 3 retries, then ESCALATE to user

### Abort Criteria

- Issue is poorly scoped → Request issue refinement
- Breaking changes not labeled → Request label update
- Blocked by missing dependency → Document blocker

---

## NEXT PHASE

**QG-4 = PASS (user approved) required to proceed to Phase 5: Implementation**

**STOP if QG-4 ≠ PASS. Do not proceed.**
