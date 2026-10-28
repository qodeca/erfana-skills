# Phase 4: Architecture

**Goal:** Design implementation approach with architect verification.
**Agent tool:** subagent_type: `<selected-agent>` (from Phase 1 selection plan)
**Quality Gates:** QG-4 (Judgment – non-blocking, ALL tiers), then QG-4a (embedded design review) and QG-4b (internal judgment checkpoint) when `deep_review_gates = true`

**Autonomous phase.** Phase 4 issues no blocking `AskUserQuestion` (SKILL.md rule 16; implement-rules Rule 13). The plan is produced and recorded; the run does not wait for user approval.

**Gate order in this phase:** design produced → QG-4 (plan recorded) → QG-4a (embedded parallel review, findings aggregated) → QG-4b (judge triages; MUST-FIX auto-revised) → Phase 5. The order is monotonic: design, review, enhance, proceed.

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
3. IF validation passes --> record the design summary (QG-4, non-blocking) and proceed
4. IF validation fails (design stale, patterns changed) --> fall back to full Phase 4 design creation below, with the designer incorporating the validation findings

In design-doc mode, design creation from scratch and pattern research are **skipped**; architect verification and the QG-4 judgment gate are **preserved** (recorded, non-blocking).

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

Example: `spec_id=1`, `spec_slug="unified-search"` → design at `specs/spec-t3-001-unified-search/sd-001-implementation.md`, returned as `{"register_with_spec": {"spec_id": 1, "doc_type": "design", "doc_path": "<that path>"}}`.

### Step 2: Produce Implementation Plan

Use template: `templates/implement/implementation-plan.md`

Plan must include:
- Approach summary
- Files to modify/create
- Implementation sequence
- Test strategy
- Risks and mitigations

### Step 2a: Decide the missing test harnesses

QG-5 blocks on a per-category matrix driven by `task_type` (see [5-implementation.md](5-implementation.md)). Any **blocking** category whose Phase 0 command is `absent` is decided **here**, while the plan is still being written, and never at QG-5.

Deciding it at QG-5 would be wrong three ways: it would contradict that gate's own "no scope creep (only acceptance criteria addressed)" criterion, it would add work the plan never recorded at QG-4, and on any repo with no e2e harness it would fail, retry three times and escalate on every single run. The plan is the artifact that legitimately gains the work, so the plan is where the choice belongs.

**Which categories are in scope:** compute the blocking set from `task_type` and `has_ui_impact` using the matrix in Phase 5. Categories that are exempt or advisory for this `task_type` are never raised here.

**This decision is made autonomously – no `AskUserQuestion` (implement-rules Rule 13).** Like a developer who finds a missing test suite, the designer decides on the record, defaulting toward doing the work:

| Situation | Autonomous decision | Effect at QG-5 |
|---|---|---|
| The harness is feasible within this change's scope | `build` – the plan gains the harness plus the tests for the touched surface | Category is blocking: the suite must exist and exit 0 |
| Building the harness is genuinely out of proportion to the issue (large new infra, unrelated surface) | `accept` – gap accepted with a **written justification** | Category is not enforced; the justification is carried to Phase 12 / the PR |

**`build` is the default; `accept` requires a non-empty justification recorded in the plan; `descope` is never chosen silently** – dropping a test surface with nothing verifying it is not an autonomous call, so a category that is neither reasonably buildable nor acceptable-with-reason is surfaced in the phase summary for the user (it does not block the run). `build` decisions become concrete plan entries in Step 2 (files to create, sequence position, test strategy) before the plan is finalised – a decision with no corresponding plan work is not a decision. The chosen `test_harness_decisions` are surfaced in the QG-4 phase summary.

Categories whose command was detected need no decision. When no blocking category is `absent`, skip this step and record `test_harness_decisions = none required`.

**On a resume, this step re-runs on its own – `test_harness_decisions` is never read back.** It is the sole input to QG-5's per-category enforcement, and a resume into Phase 5 or later never re-runs the rest of Phase 4, so the persisted block would be its only source: `descope` would disarm the blocking test matrix, and an `accept` justification is carried verbatim into the pull-request description. So **any resume targeting Phase 5 or later re-decides this step alone** for each blocking category whose Phase 0 command came back `absent`. The recorded value is shown in the resume confirmation as advisory and used nowhere else ([../reference/run-state-resume.md](../reference/run-state-resume.md) – "Fields that decide nothing").

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
  4. Repeat until APPROVED (max 3 iterations, then escalate)

ONLY present to user after architect APPROVED.
```

**Retry cap:** the loop runs at most 3 iterations, matching the skill-wide "max 3 retries per phase, then escalate" invariant (Rule 6 in [implement-rules.md](../operations/implement-rules.md)). If the plan is still NEEDS REVISION after the third iteration, stop looping and escalate to the user with the outstanding verification failures and the options: revise scope, approve the plan with documented gaps, or abort.

### Step 5: Record and summarise – the architect-approved plan is recorded and surfaced as a one-line status summary (see QG-4). The run does not wait for user approval; it proceeds to QG-4a.

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Implementation Plan | Complete plan with sequence and tests |
| Architect Verification | APPROVED status |
| Risk Register | All risks with mitigations |
| Test Strategy | How changes will be tested |
| Planned File List | `PLANNED_FILES`: every **file** path (never a directory) the plan names as created or modified, plus the QG-4a design doc when one is written. Seeded here, extended by Phases 5, 10 and 11, consumed by Phase 12 staging |
| Test Harness Decisions | `test_harness_decisions`: per blocking category with an `absent` command, one of `build` / `descope` / `accept` (+ justification) – Step 2a; read by QG-5 and Phase 12 |
| UX Specification | Produced by `ux-designer` when `has_ui_impact = true` (Step 1a) – input to Phases 5 and 8 |
| Embedded Design-Review Findings | Aggregated severity-ranked findings from the QG-4a reviewer fan-out when `deep_review_gates = true` |
| Finding Resolution Record | Every QG-4a CRITICAL/HIGH finding with the design change that resolved it, plus the judge's verdict on each MED/LOW finding (QG-4b) |
| Architecture Judgment Record | The judge's triage of the review findings (QG-4b) when `deep_review_gates = true` – no user acceptance step |
| Task List Advance | Phase 4 and `QG-4 quality gate` (plus `QG-4a` / `QG-4b` when they ran) marked `completed`; Phase 5 `in_progress` with `QG-5 quality gate` appended – see [../reference/progress-tracking.md](../reference/progress-tracking.md) |

---

## Quality Gate

**Success criterion:** Architect-verified APPROVED implementation plan; recorded at QG-4 (non-blocking). **Note:** Phase 4 writes a design doc in two cases – `specs/.../sd-*.md` when a spec is linked, and the tracked `docs/design/design-issue-<number>.md` (or repo root) resolved at QG-4a Step 1 when one is not and QG-4a is in scope. Both are covered by the inline architect verification and the embedded QG-4a review, both land in `PLANNED_FILES`, and **both are committed with the change** at Phase 12; no separate POST-STEP block needed.

---

## QUALITY GATE: QG-4

**Gate Type:** Judgment (non-blocking, ALL tiers)
**Gate ID:** QG-4

### Pass Criteria

| Criterion | Required |
|-----------|----------|
| Plan completeness | All acceptance criteria covered |
| Architect verified | APPROVED (not NEEDS REVISION) |
| Test strategy defined | Every planned change has a stated test approach (consumed by Phase 5 Step 2 and QG-5 coverage) |
| Test harnesses decided | Every blocking test category whose Phase 0 command is `absent` has a recorded `build` / `descope` / `accept` decision (Step 2a), each `build` has matching plan work and each `accept` a non-empty justification; or `none required` when no blocking category was absent |
| Risk register present | Risks with mitigations, or an explicit "no risks identified" statement |
| UX specification | Present when `has_ui_impact = true` (Step 1a ran); N/A when the flag is false. An absent spec on a true flag is a QG-4 failure – Phase 5 and the Phase 8 UX audit both read it |
| Planned files listed | `PLANNED_FILES` seeded from the plan's file table – every entry a file path, no directories, no globs |
| Plan recorded | Plan recorded and one-line summary emitted (no user approval – non-blocking) |
| Task list advanced | `QG-4 quality gate` `completed`. The `QG-4a` / `QG-4b` items were already appended by Phase 3's advance when `deep_review_gates = true` – leave those existing items in place rather than appending them again. On the phase's last applicable gate, `Phase 4: Architecture` `completed`, `Phase 5: Implementation` `in_progress`, `QG-5 quality gate` appended |

### Phase summary (recorded, not a prompt)

Record the plan and emit a one-line status summary; the full plan is written to the design doc (see QG-4a Step 1) and surfaced for the record:

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
- E2E tests: <scope, or "not applicable - no UI impact">
- Missing suites: <category: build | descope | accept (reason), or "none required">
- Edge cases: <list>

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| <risk> | <impact> | <action> |

### Estimated Effort
<effort assessment>
```

### Gate evaluation (non-blocking, ALL tiers)

**QG-4 does NOT call `AskUserQuestion` (SKILL.md rule 16; implement-rules Rule 13).** It passes on the recorded predicate: the plan is architect-verified APPROVED, every pass-criteria row above holds, the plan is written to the design doc, and the one-line summary is emitted. Then proceed to QG-4a. The plan's own soundness is validated by the embedded QG-4a review that follows, not by a user checkpoint.

### Result

**QG-4 Result:** [PASS | FAIL]

### On FAIL

If the architect verification did not reach APPROVED (a pass-criteria row is unmet):
1. Address the outstanding verification failure
2. Re-invoke mi-solution-designer
3. Re-run architect verification
4. Re-evaluate the predicate
5. Max 3 retries, then ESCALATE to user (revise scope, proceed with documented gaps, or abort)

### Abort Criteria

- Issue is poorly scoped → Request issue refinement
- Breaking changes not labeled → Request label update
- Blocked by missing dependency → Document blocker

---

## QUALITY GATE: QG-4a (embedded design review)

**Gate Type:** Embedded Review-and-Fix (runs when `deep_review_gates = true` – `review_level` of `full` or `design`; skipped at `none`, which is the Tier 1 default)
**Gate ID:** QG-4a
**Entry condition:** QG-4 = PASS.

**Autonomous, no user hand-off.** The orchestrator **MUST NOT invoke `/erfana:lens-review` or any skill/slash command** (SKILL.md rule 15; implement-rules Rule 12). QG-4a runs the embedded review protocol in [../reference/embedded-review-and-fix.md](../reference/embedded-review-and-fix.md) over the **design**, not the implementation. It does not end the turn.

### Step 1: Resolve the design target

The design must sit on disk so the reviewers can read it. When a spec design doc exists (`spec_maturity` produced `specs/spec-t{tier}-{id}-{slug}/sd-*.md`), that path is the target. When no spec is linked, delegate the write of the approved plan to `mi-solution-designer` to a **tracked** destination and use that:

```bash
# Run-state value - the orchestrator replaces the right-hand side with this run's literal:
NUMBER=42
[[ "$NUMBER" =~ ^[0-9]+$ ]] || { echo "QG-4a: NUMBER unresolved"; exit 1; }

DESIGN_DIR=docs/design
[ -d docs ] || DESIGN_DIR=.
DESIGN_PATH="${DESIGN_DIR}/design-issue-${NUMBER}.md"
if git check-ignore -q "$DESIGN_PATH"; then
  DESIGN_PATH="./design-issue-${NUMBER}.md"   # repo root is tracked in every repo
fi
mkdir -p "$(dirname "$DESIGN_PATH")"
echo "QG-4a: design written to '$DESIGN_PATH'"
```

Record the resolved `design_path` and **add it to `PLANNED_FILES`** ([12-finalization.md](12-finalization.md)) so Phase 12 stages it with the change. It is committed with the run; state it in the QG-4b summary.

### Step 2: Fan out the reviewers over the design

Run the embedded review protocol ([../reference/embedded-review-and-fix.md](../reference/embedded-review-and-fix.md)): dispatch the relevant design-focused lenses **in parallel** (single message, multiple `Task` calls) – `architecture-reviewer`, `solution-reviewer`, `security-auditor`, and `ux-reviewer` when `has_ui_impact = true` – under the concurrency cap in [../reference/parallel-review.md](../reference/parallel-review.md). Each reviewer gets the self-contained payload (design doc, issue + acceptance criteria, its focus lens) and returns severity-ranked findings in the standard finding format. A reviewer runs a current-best-practices web lookup **only** when it hits a genuine unknown (Step 2b of the protocol), not by default.

### Step 3: Aggregate the findings

Consolidate per [../reference/parallel-review.md](../reference/parallel-review.md): deduplicate, renumber `F1-FN`, map onto the severity ladder, prioritise. The aggregated findings feed the QG-4b judgment step. A reviewer that hit a genuine contradiction returns `needs_user_input` (SKILL.md rule 7) – the one path that can reach the user, and only for a real ambiguity.

### Result

**QG-4a Result:** [PASS | FAIL]

PASS requires: the reviewers ran (or a stalled reviewer was timed out and flagged, proceeding on partial findings per the parallel-review protocol) and the findings were aggregated for QG-4b. QG-4a produces no user prompt.

---

## QUALITY GATE: QG-4b (internal judgment checkpoint)

**Gate Type:** Judgment (non-blocking; runs when `deep_review_gates = true`)
**Gate ID:** QG-4b
**Entry condition:** QG-4a = PASS.

**QG-4b is an internal judgment checkpoint, not a user gate (SKILL.md rule 16; implement-rules Rule 14).** It reads the aggregated QG-4a findings and applies the fix authority + judge from [../reference/embedded-review-and-fix.md](../reference/embedded-review-and-fix.md):

1. **CRITICAL/HIGH findings → automatic design revision.** Only unresolved MUST-FIX items trigger it: `mi-solution-designer` revises the design to address each, and the change is recorded against the finding ID. The revision loop is bounded by **`embedded_loop_iter`** (max 3 fix-application rounds; [../reference/embedded-review-and-fix.md](../reference/embedded-review-and-fix.md) Step 6) – a reworked design is re-reviewed at QG-4a, since a reworked design is an unreviewed design.
2. **MEDIUM/LOW findings → the judge.** Delegate to `mi-solution-designer` in its **JUDGE mode** (input `{findings[], diff}`; see [../../../agents/mi-solution-designer.md](../../../agents/mi-solution-designer.md)): it rules on each finding **fix / accept-as-tech-debt / not-worth-it**, reading the findings together with the design. CRITICAL/HIGH are never routed here – they are auto-revised in (1). `fix` verdicts on the design are applied (and re-reviewed if they touch architecture); `accept-as-tech-debt` items are recorded and carried forward; `not-worth-it` items are dropped with a one-line reason and not re-judged this run (sticky verdicts). This is what prevents the design from being gold-plated.

### Judgment record (recorded, not a prompt)

Record the triage and emit a one-line summary; no `AskUserQuestion`:

```markdown
## Architecture judgment (QG-4b)

**Issue:** #<number> - <title>
**Design:** <design-path> – committed with the change (in `PLANNED_FILES`)

### Review outcome
<N> findings – <a> critical, <b> high, <c> medium, <d> low.

### Auto-revised (CRITICAL/HIGH)
| # | Severity | Finding | Design change that resolved it |
|---|----------|---------|-------------------------------|

### Judge verdicts (MEDIUM/LOW)
| # | Severity | Finding | Verdict (fix / tech-debt / not-worth-it) |
|---|----------|---------|------------------------------------------|

### Design after review
<summary of the enhanced approach, or "unchanged - the review returned no actionable findings">
```

### Result

**QG-4b Result:** [PASS | FAIL]

PASS requires: every CRITICAL/HIGH finding is resolved by an auto-revision (or escalated after the cap), the judge ruled on every remaining finding, and any `fix` verdict was applied. QG-4b produces no user prompt.

### On FAIL

A CRITICAL/HIGH finding that cannot be resolved within `embedded_loop_iter`'s 3-round cap is the only failure mode. Re-invoke `mi-solution-designer`, re-run the architect verification (Step 3), and re-run QG-4a on the revised design; at the cap, unresolved CRITICAL/HIGH is **escalated to the user** with the outstanding items and the options (revise scope, proceed with documented gaps, or abort) — never recorded as tech debt. Unresolved MEDIUM/LOW is recorded as accepted tech debt.

---

## NEXT PHASE

**QG-4 = PASS (plan recorded) required to proceed.** When `deep_review_gates = true`, **QG-4a = PASS and QG-4b = PASS are additionally required** before Phase 5: Implementation. When `deep_review_gates = false` (`review_level = none`, the Tier 1 default), Phase 5 follows QG-4 directly. None of the three gates blocks on the user.

**Task list:** on PASS of the phase's last applicable gate, mark `QG-4 quality gate` (and `QG-4a` / `QG-4b` when they ran) then `Phase 4: Architecture` `completed`, set `Phase 5: Implementation` `in_progress`, and append `QG-5 quality gate` as `pending` ([progress-tracking](../reference/progress-tracking.md)).

**Run state:** record `QG-4=PASS`, `QG-4a` / `QG-4b` as `PASS` or `skipped`, `awaiting: none`, `design_path`, and `test_harness_decisions` from Step 2a, then PATCH the run-state comment ([post-review-tracking](../reference/post-review-tracking.md) – "Updating in place"). A failed write never fails the gate.

**STOP if QG-4 ≠ PASS, or if either applicable sub-gate ≠ PASS. Do not proceed.**
