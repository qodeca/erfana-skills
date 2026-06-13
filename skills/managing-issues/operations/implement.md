# Operation: Implement

Implement GitHub issues through strictly enforced phases with mandatory quality gates after each phase.

---

## Enforcement rules

See [implement-rules.md](implement-rules.md) for the Implement **enforcement rules** (the operation-level execution rules) and code review dimensions. These are distinct from the skill-wide **architectural rules** in SKILL.md.

**Key non-overridable rules:**
- ALL phases MUST execute (tier determines depth, not skipping)
- QG-0, QG-7, QG-9 are MANDATORY – cannot be overridden
- ALL file modifications MUST pass Phase 8 (Quality Review)
- Implementation MUST start from the repo's default branch (`BASE_BRANCH`, detected at QG-0)

---

## When NOT to Use

See SKILL.md "CRITICAL ARCHITECTURAL RULES" for the architectural NOTs that apply to all operations (rule 10 – Implementation MUST start from the repo's default branch – restated below for emphasis).

Operation-specific NOTs:
- Working directory is not clean – stash or commit first
- Not on the default branch – checkout the detected `BASE_BRANCH` first (mirrors SKILL.md rule 10)
- Issue is closed, blocked, or already assigned to someone else
- No acceptance criteria defined – request clarification on the issue first
- Baseline tests are failing – fix test suite before starting new work

---

## Overview

| Attribute | Value |
|-----------|-------|
| Phases | 13 (0-12) |
| Tiers | 2 (Trivial, Standard) |
| Quality Gates | 13 (one per phase) |
| Agents | Dynamic selection from builtin, shared, dedicated sources |

---

## Complexity Tiers

**Tiers determine DEPTH of validation, NOT phase skipping.**

### Tier 1: Trivial
**Labels:** `good first issue`, `documentation`, `typo`, `chore`
**Validation Depth:** Light (automated checks, minimal user checkpoints)
**Phases:** ALL phases execute with quick validation

### Tier 2: Standard (Default)
**Labels:** `bug`, `enhancement`, `breaking-change`, `architecture`, `security`, `major`, or unlabeled
**Validation Depth:** Full (multi-dimension checks, all user checkpoints)
**Phases:** ALL phases execute with deep validation

---

## Spec-ready mode

When QG-0 reports `spec_maturity` of `complete` or `complete_with_design`, phases 1–4 execute in **validation mode** instead of full **discovery mode**. This preserves the "all 13 phases execute" invariant while eliminating redundant discovery work for well-specified issues.

### Activation criteria

Spec-ready mode activates when ALL of the following are true:
- `spec_maturity >= complete` (from QG-0 Step 5b)
- Spec files are readable and non-empty
- No `stale-spec` label on the issue

### Phase behavior in spec-ready mode

| Phase | Discovery mode (default) | Validation mode (spec-ready) |
|-------|-------------------------|------------------------------|
| 1 – Agent selection | Full discovery + matching cycle | Use DEFAULT_AGENT_MAP (phase still executes) |
| 2 – Business analysis | Prior-art research, questionnaire, requirements gathering | Read spec, validate acceptance criteria, flag gaps |
| 3 – Discovery | Full codebase exploration, pattern catalogue | Spot-check key files, verify dependency map |
| 4 – Architecture | Design from scratch, architect creation | Validate existing design doc (requires `complete_with_design`) |

### Key invariants preserved

- ALL 13 phases still execute (depth changes, not skipping)
- ALL quality gates still apply (QG-0 through QG-12)
- ALL mandatory gates remain non-overridable (QG-0, QG-7, QG-9)
- QG-4 (User-Approval) still required in both modes
- Tier still determines checkpoint frequency (T1 = automated, T2 = manual)
- If validation fails at any phase, seamless fallback to full discovery mode

### Spec-maturity levels (from QG-0)

| Level | Meaning | Effect on phases 1–4 |
|-------|---------|---------------------|
| `none` | No spec exists | Standard discovery mode (current behavior) |
| `partial` | Some spec files exist | Reduced discovery – validate existing, fill gaps |
| `complete` | Full spec (overview + requirements + acceptance) | Validation mode for phases 2–4 |
| `complete_with_design` | Full spec + approved design doc | Validation mode for phases 1–4 |

---

## Phase Overview with Quality Gates

| Phase | Name | Agent(s) | Quality Gate | Gate Type |
|-------|------|----------|--------------|-----------|
| 0 | Pre-flight | - | QG-0 | Mandatory |
| 1 | Agent Selection | discover-agents, match-agents | QG-1 | Automated |
| 2 | Business Analysis | *selected at 1* | QG-2 | Checkpoint (T2) |
| 3 | Discovery | *selected at 1* | QG-3 | Checkpoint (T2) |
| 4 | Architecture | *selected at 1* | QG-4 | User-Approval |
| 5 | Implementation | *selected at 1* | QG-5 | Automated |
| 6 | Architectural Review | *selected at 1* | QG-6 | Checkpoint (T2) |
| 7 | Security | *selected at 1* | QG-7 | Mandatory |
| 8 | Quality Review | *selected at 1* | QG-8 | Checkpoint (T2) |
| 9 | Verification | *selected at 1* | QG-9 | Mandatory |
| 10 | Documentation | *selected at 1* | QG-10 | Automated |
| 11 | UAT | - | QG-11 | User-Approval (T2) |
| 12 | Finalization | *selected at 1* | QG-12 | User-Approval |

*Note: Agents for phases 2-12 are dynamically selected at Phase 1 based on capability matching. See [../reference/implement-phase-requirements.md](../reference/implement-phase-requirements.md) for phase requirements.*

---

## Quality Gate Types

| Type | Description | Retry Allowed | User Interaction |
|------|-------------|---------------|------------------|
| **Mandatory** | MUST pass, no override | Yes (3x) | Escalate on fail |
| **Checkpoint** | Requires acknowledgment (Tier 2) | Yes (3x) | Review findings |
| **User-Approval** | Requires explicit user consent | No | Must approve |
| **Automated** | Pass on a concrete exit-code predicate | Yes (3x) | None unless fail |

**Automated-gate predicates (machine-checkable, not a prose checkbox):** each Automated gate passes only on a concrete command result, so it cannot collapse into orchestrator self-judgement:
- **QG-1 (Agent Selection):** every phase has a resolved agent (default-map entry or a full-coverage match), else escalate.
- **QG-5 (Implementation):** detected test + typecheck commands exit 0 (or none detected).
- **QG-7 (Security):** the Phase 7 secret scan returns empty (fail-closed) and the dependency audit reports no high/critical.
- **QG-10 (Documentation):** the documentation agent reports the changed public surfaces are covered.

For **Tier 1** (trivial), the Automated gates reduce to a single combined predicate – run the detected `test && typecheck && lint` and the QG-7 secret scan; pass only on success.

---

## Toolchain commands (stack-detected — applies to every phase)

QG-0 detects the project's toolchain and captures `TEST_CMD`, `TYPECHECK_CMD`, `LINT_CMD`, and (for UAT) `BUILD_CMD` / `DEV_CMD`. **Every phase uses those variables, not a hardcoded `npm` invocation.** Where a phase guide shows a literal like `npm run test` or `npm run build`, read it as the Node example of the detected command for that step — substitute the project's actual command (e.g. `pytest`, `go test ./...`, `cargo build`), and skip a step gracefully when no command was detected for it. The same applies to stack-specific test-file conventions (e.g. `*.test.tsx`): apply the convention of the project's language.

## Phase Execution Pattern

Every phase follows this EXACT pattern:

```
┌─────────────────────────────────────────┐
│ PHASE N: <Name>                         │
├─────────────────────────────────────────┤
│ 1. CHECK INPUT CONDITIONS               │
│    - IF any unchecked → STOP            │
│    - IF previous QG ≠ PASS → STOP       │
├─────────────────────────────────────────┤
│ 2. EXECUTE PHASE                        │
│    - Run agent(s)                       │
│    - Produce artifacts                  │
├─────────────────────────────────────────┤
│ 3. VERIFY OUTPUT CONDITIONS             │
│    - IF any unchecked → RETRY (max 3)   │
├─────────────────────────────────────────┤
│ 4. QUALITY GATE                         │
│    - Evaluate pass criteria             │
│    - IF PASS → Proceed to Phase N+1     │
│    - IF FAIL → Retry or Escalate        │
└─────────────────────────────────────────┘
```

**Ritual scales with gate type (anti-ritual policy).** Mandatory and User-Approval phases (QG-0, QG-7, QG-9, QG-12) run the full input/output-condition checks above. **Automated** phases (QG-1, QG-5, QG-10) skip the per-step checklist ceremony and pass purely on their concrete exit-code predicate (see Quality Gate Types) — Opus self-verifies routine steps, so the heavyweight CHECK/VERIFY scaffolding is reserved for the irreversible gates.

---

## Phases

Per-phase quick-summary tables (input conditions, output artifacts, quality gate, summary) live in [implement-phases-overview.md](implement-phases-overview.md), kept separate to hold this file under the ≤500-line cap. Each phase's canonical detail (full execution sequence, agent dispatch, error handling, retry logic) lives in [phases/0-preflight.md](../phases/0-preflight.md) through [phases/12-finalization.md](../phases/12-finalization.md).

---

## Procedures

See [implement-procedures.md](implement-procedures.md) for the workflow state diagram, escalation procedure, and abort procedure.

**Key escalation rules:**
- Max 3 retries per phase, then escalate to user
- Non-overridable: Phase 0, Phase 7, Phase 9 QGs
- Abort: document reason, clean up branch, update issue

---

## Quality Gate Summary by Tier

| Quality Gate | Tier 1 | Tier 2 | Can Override |
|--------------|--------|--------|--------------|
| QG-0: Pre-flight | Mandatory | Mandatory | **NO** |
| QG-1: Agent Selection | Automated | Automated | Yes |
| QG-2: Business Analysis | Automated | Checkpoint | Yes |
| QG-3: Discovery | Automated | Checkpoint | Yes |
| QG-4: Architecture | User-Approval | User-Approval | Yes |
| QG-5: Implementation | Automated | Automated | Yes |
| QG-6: Architectural Review | Automated | Checkpoint | Yes |
| QG-7: Security | Mandatory | Mandatory | **NO** |
| QG-8: Quality Review | Automated | Checkpoint | Yes |
| QG-9: Verification | Mandatory | Mandatory | **NO** |
| QG-10: Documentation | Automated | Automated | Yes |
| QG-11: UAT | Automated | User-Approval | Yes |
| QG-12: Finalization | User-Approval | User-Approval | Yes |

**Gate Types:**
- **Mandatory**: MUST pass, cannot be overridden (QG-0, QG-7, QG-9)
- **Checkpoint**: User reviews findings before proceeding (Tier 2 only)
- **User-Approval**: Requires explicit user consent
- **Automated**: Passes if automated checks pass

**Note:** ALL phases execute for both tiers. Tier determines validation depth, not phase skipping.

---

## Reference Index

All cross-references for the Implement operation – phase files, per-operation phase requirements, agent registry – consolidated in [implement-references.md](implement-references.md), kept separate to hold this file under the ≤500-line cap.
