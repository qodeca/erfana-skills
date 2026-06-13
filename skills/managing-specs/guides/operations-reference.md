# Spec operations reference

> Detailed operation tables for the `managing-specs` skill. SKILL.md links here for the simpler operations (ADD, UPDATE, REMOVE, MOVE, LIST). INIT and RECONCILE-IMPL remain in SKILL.md because they include orchestration-critical Q&A flow.

This file is loaded on demand by orchestrators executing one of the 5 operations below. The original `## Operation:` headings are preserved as `## ` so deep-links from SKILL.md (e.g. `#operation-add`) still work.

---

## Operation: ADD

Adds requirement to existing spec.

| Step | Agent | Purpose | Quality gate |
|------|-------|---------|--------------|
| 0 | Orchestrator | **Capture project context** | CWD valid |
| 0b | `spec-registry-manager` | Verify spec status is `active` | Status == active |
| 1 | Orchestrator | Identify target spec and tier | Spec exists |
| 2 | `spec-requirement-adder` | Add to appropriate file | Returns requirement ID |
| 3 | Orchestrator | Confirm with ID | — |

**STOP at Step 0b if status != active.** ID format: `{spec_id}-{type}-{sequence}`

---

## Operation: UPDATE

Modifies existing requirement or content.

| Step | Agent | Purpose | Quality gate |
|------|-------|---------|--------------|
| 0 | Orchestrator | **Capture project context** | CWD valid |
| 0b | `spec-registry-manager` | Verify spec status is `active` | Status == active |
| 1 | `spec-updater` | Generate updated content | Returns update package |
| 2 | `spec-section-merger` | Merge changes with existing content | Files updated |
| 3 | Orchestrator | Confirm diff | — |
| 4 | Orchestrator | **Check e2e design staleness** | — |

**STOP at Step 0b if status != active.**

**E2E staleness (Step 4 – conditional):**
After UPDATE completes: (1) did the update modify acceptance criteria (AC-* or R-* IDs)? (2) does the spec have `e2e_test_designs` in `documents`? If BOTH true, warn user: "Acceptance criteria changed. Linked e2e test design is stale. Regenerate? [yes/no]" If yes: re-invoke e2e-test-designer → e2e-test-design-reviewer → spec-document-linker. If no: note staleness in spec manifest or skip – design remains linked but may not reflect current ACs.

---

## Operation: REMOVE

Deprecates or deletes requirements (T3-T4 only).

| Step | Agent | Purpose | Quality gate |
|------|-------|---------|--------------|
| 0 | Orchestrator | **Capture project context** | CWD valid |
| 0b | `spec-registry-manager` | Verify spec status is `active` | Status == active |
| 1 | `spec-content-remover` | Check references | Returns ref analysis |
| 2 | Orchestrator | Confirm if refs exist | User approves |
| 3 | `spec-content-remover` | Apply removal | Requirement removed |
| 4 | Orchestrator | **Check e2e design staleness** (if removed requirement traced in e2e design) | — |

**Modes:** `deprecate` (default) or `delete`.

**E2E staleness (Step 4 – conditional):** Same pattern as UPDATE step 4. If the removed requirement is traced in linked `e2e_test_designs`, warn user and offer regeneration.

---

## Operation: MOVE

Relocates requirements between sections (T4 only).

| Step | Agent | Purpose | Quality gate |
|------|-------|---------|--------------|
| 0 | Orchestrator | **Capture project context** | CWD valid |
| 0b | `spec-registry-manager` | Verify spec status is `active` | Status == active |
| 1 | `spec-content-mover` | Validate move | Returns impact analysis |
| 2 | Orchestrator | Confirm cross-reference updates | User approves |
| 3 | `spec-content-mover` | Execute move with ref updates | Requirement relocated |

---

## Operation: LIST

Shows specs in registry.

| Step | Agent | Purpose | Quality gate |
|------|-------|---------|--------------|
| 0 | Orchestrator | **Capture project context** | CWD valid |
| 1 | `spec-registry-manager` | List entries **(pass project_path!)** | Returns entries |
| 2 | Orchestrator | Format and display table | — |

**Options:** `--all` (include archived), `--status archived`, `--status deprecated`
