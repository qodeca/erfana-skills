# Phase 2: Business Analysis

**Goal:** Research prior art and clarify requirements before exploring codebase.
**Agent:** `mi-requirements-analyzer`
**Quality Gate:** QG-2 (Checkpoint for T2, Automated for T1)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-1 = PASS (Agent Selection completed)
- [ ] Feature branch checked out
- [ ] Issue metadata available (title, body, labels)
- [ ] Tier classification determined

---

## EXECUTION

### Spec-ready shortcut (if spec_maturity >= "complete")

When Phase 0 reports `spec_maturity` of `complete` or `complete_with_design`, execute this compressed path instead of full discovery:

1. Read existing spec files (`requirements/01-overview.md`, `02-requirements.md`, `03-acceptance.md`)
2. Validate acceptance criteria are testable, measurable, and bounded
3. Validate scope boundaries are explicit (what's in/out)
4. Flag any gaps, ambiguities, or stale references
5. IF gaps found → fall back to full Phase 2 execution below
6. IF no gaps → produce validation summary and proceed to QG-2

**Skipped in spec-ready mode:** Prior-art research, requirements questionnaire, stakeholder clarification
**Preserved in spec-ready mode:** Acceptance criteria validation, risk assessment, scope boundary check

### Step 1: Issue Classification

Determine issue type from labels and body:

| Type | Labels | Research Focus |
|------|--------|----------------|
| Bug | `bug`, `defect` | Root cause patterns, known issues |
| Enhancement | `enhancement`, `improvement` | Similar features, design patterns |
| Feature | `feature`, unlabeled | Libraries, prior art, references |
| Security | `security`, `vulnerability` | OWASP, CVE databases |
| Refactor | `refactor`, `cleanup` | Design patterns, SOLID |

### Step 2: Prior Art Research

**Tier 1:** 1-2 searches (quick)
**Tier 2:** 3-5 searches (focused)

Use WebSearch to find:
- Existing libraries/packages
- Similar implementations
- Best practices
- Known issues and solutions

### Step 3: Requirements Questionnaire

`mi-requirements-analyzer` returns a `proposed_questions` set — it does **not** ask the user (AskUserQuestion is not delivered to subagents; SKILL.md rule 7). The **orchestrator** asks those questions via AskUserQuestion, batching at most 4 per call, then passes the answers back to the analyzer (or carries them into the summary).

**Tier 1:** 1-2 questions
**Tier 2:** 3-5 questions (orchestrator batches ≤4 per AskUserQuestion call)

Categories:
1. Requirements clarification
2. Edge cases & boundaries
3. Reference implementations
4. Scope boundaries

A skipped question is a valid answer — record it as unanswered and proceed; never re-ask the same question.

### Step 4: Acceptance Criteria Validation

Verify all criteria are:
- [ ] Testable (observable behavior)
- [ ] Measurable (success metrics)
- [ ] Bounded (explicit scope)

If gaps found: Add suggested criteria for user approval.

### Step 5: Create Requirements Summary

Compile:
1. Issue classification
2. Prior art findings with recommendations
3. Clarified requirements
4. Validated acceptance criteria
5. Identified risks
6. Recommended approach

**Output deliverable:** fill in the Requirements Clarification template at [`templates/implement/requirements-clarification.md`](../templates/implement/requirements-clarification.md), capturing the clarifying questions and user answers from Step 3, the validated acceptance criteria from Step 4, and the risk register. The completed template carries forward as input to Phase 3 (Discovery) and Phase 4 (Architecture).

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Research Summary | Prior art findings, library recommendations |
| Requirements Document | Clarified requirements from questionnaire |
| Validated Criteria | Acceptance criteria with gaps addressed |
| Risk Assessment | Identified risks and mitigations |

---

## Quality Gate

**Success criterion:** Issue classified, requirements questionnaire complete, acceptance criteria validated, research summary produced. Phase 2 produces analysis artifacts only (no code mutations), so post-step validation is bounded by the Tier 2 user checkpoint at QG-2 below.

---

## QUALITY GATE: QG-2

**Gate Type:** Checkpoint (T2) | Automated (T1)
**Gate ID:** QG-2

### Pass Criteria

| Criterion | Tier 1 | Tier 2 |
|-----------|--------|--------|
| Research completed | 1-2 searches | 3-5 searches |
| Questions answered | 1-2 | 3-5 |
| Criteria validated | Basic check | Full validation |
| User checkpoint | Not required | Required |

### Tier 2 Checkpoint

Present to user:

```markdown
## Business Analysis Complete

**Issue:** #<number> - <title>
**Type:** <classification>
**Tier:** <tier>

### Prior Art Findings
- <finding 1>
- <finding 2>

### Requirements Clarification
| Question | Answer | Impact |
|----------|--------|--------|
| <Q1> | <A1> | <impact> |

### Validated Acceptance Criteria
- [ ] <criterion 1>
- [ ] <criterion 2>

### Scope Boundaries
**In Scope:** <items>
**Out of Scope:** <items>

### Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| <risk> | <L/M/H> | <L/M/H> | <action> |

**Proceed to Discovery?** [Approve / Revise / Add Questions]
```

### Result

**QG-2 Result:** [PASS | FAIL]

### On FAIL

1. Review specific failure reason
2. Address missing requirements or research
3. Re-run questionnaire if needed
4. Max 3 retries, then ESCALATE to user

---

## NEXT PHASE

**QG-2 = PASS required to proceed to Phase 3: Discovery**

**STOP if QG-2 ≠ PASS. Do not proceed.**
