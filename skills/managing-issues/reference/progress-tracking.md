# Progress tracking (MANDATORY)

Canonical TodoWrite task-list definitions for every managing-issues operation (Create, Implement, Review, Display), plus the rules governing how phases are marked. Hoisted from `SKILL.md` to keep that file under the Rule #16 ≤500-line cap. The orchestrator owns TodoWrite; agents never touch it.

At operation start, create todo list with operation-specific phases.

---

## Create Operation Todos

```
TodoWrite([
  {content: "Phase 1: Understand the problem", status: "in_progress", activeForm: "Understanding problem"},
  {content: "Phase 2: Ask clarifying questions", status: "pending", activeForm: "Asking clarifying questions"},
  {content: "Phase 3: Check for duplicates", status: "pending", activeForm: "Checking for duplicates"},
  {content: "Phase 4: Draft the issue", status: "pending", activeForm: "Drafting issue"},
  {content: "Phase 5: Present and confirm", status: "pending", activeForm: "Presenting for approval"}
])
```

---

## Implement Operation Todos

```
TodoWrite([
  {content: "Phase 0: Pre-flight", status: "in_progress", activeForm: "Running pre-flight checks"},
  {content: "QG-0 quality gate", status: "pending", activeForm: "Evaluating QG-0"},
  {content: "Phase 1: Agent Selection", status: "pending", activeForm: "Selecting agents"},
  {content: "Phase 2: Business Analysis", status: "pending", activeForm: "Analyzing requirements"},
  {content: "Phase 3: Discovery", status: "pending", activeForm: "Discovering codebase"},
  {content: "Phase 4: Architecture", status: "pending", activeForm: "Designing architecture"},
  {content: "Phase 5: Implementation", status: "pending", activeForm: "Implementing code"},
  {content: "Phase 6: Architectural Review", status: "pending", activeForm: "Reviewing architecture"},
  {content: "Phase 7: Security", status: "pending", activeForm: "Scanning security"},
  {content: "Phase 8: Quality Review", status: "pending", activeForm: "Reviewing quality"},
  {content: "Phase 9: Verification", status: "pending", activeForm: "Verifying implementation"},
  {content: "Phase 10: Documentation", status: "pending", activeForm: "Updating documentation"},
  {content: "Phase 11: UAT", status: "pending", activeForm: "Running acceptance tests"},
  {content: "Phase 12: Finalization", status: "pending", activeForm: "Finalizing commit"}
])
```

The list opens with the 13 phase items plus the gate item for the phase that is starting. Phase labels carry **no** `(QG-N)` suffix – each gate is its own item, appended when its phase starts, so a suffix would duplicate it.

**Sub-gate items.** Per the `review_level` chosen at QG-0 Step 5d (Tier 2 is asked and defaults to `full`; Tier 1 gets `none`), the lettered gates in scope get their own items alongside their phase's `QG-N` item, appended when that phase starts:

```
{content: "QG-4 quality gate", ...},
{content: "QG-4a quality gate (lens review of design)", ...},
{content: "QG-4b quality gate (architecture acceptance)", ...},
...
{content: "QG-11a quality gate (lens review of implementation)", ...},
{content: "QG-11 quality gate", ...},
```

Order matters: in Phase 4 the order is QG-4 → QG-4a → QG-4b; in Phase 11 QG-11a comes **before** QG-11 because it is a pre-step. `Phase 4: Architecture` and `Phase 11: UAT` are marked `completed` only after **all** of their gate items are `completed`. The items are created only for the sub-gates the run's `review_level` puts in scope: QG-4a / QG-4b at `full` or `design`, QG-11a at `full` only.

---

## Per-phase advancement (Implement)

The task list is advanced at **every** phase boundary. Each phase file declares this three times: as a row in its `## OUTPUT ARTIFACTS` table, as a **`Task list advanced` row in its quality gate's Pass Criteria table**, and in its `## NEXT PHASE` block. The pass-criteria row is what makes it enforced rather than exhorted – a gate whose task-list row is unsatisfied does not pass, so the advance can no longer be silently skipped.

**Appending the sub-gate items is the previous phase's job.** Phase 3's handoff appends `QG-4a` / `QG-4b` alongside `QG-4`; Phase 10's appends `QG-11a` **before** `QG-11`. Phase 3's append is conditional on `deep_review_gates = true`; Phase 10's on `review_level = full`. Phase 12's terminal assertion reads this list, so an item that was never appended is a gate that was never tracked.

**At phase start (Phase N):**

1. Mark `Phase N: <name>` as `in_progress`.
2. Append `QG-N quality gate` as `pending`, immediately after its phase item.

```
TodoWrite([
  ...,
  {content: "Phase 3: Discovery", status: "in_progress", activeForm: "Discovering codebase"},
  {content: "QG-3 quality gate", status: "pending", activeForm: "Evaluating QG-3"},
  ...
])
```

**At gate evaluation:** mark `QG-N quality gate` as `in_progress`.

**On QG-N = PASS:**

1. Mark `QG-N quality gate` `completed`.
2. Mark `Phase N: <name>` `completed`.
3. Mark `Phase N+1: <name>` `in_progress` and append its `QG-N+1 quality gate` item as `pending`.

**On QG-N = FAIL:** the gate item returns to `pending` and its phase item stays `in_progress` for the retry. A failed gate is never marked `completed`; after 3 retries, STOP and escalate (see rules below). When a gate routes the run backwards (for example QG-11 `Found Issues` → Phase 5), reopen the target phase item and its gate item, and leave the intervening completed items in place so the loop stays visible.

Phase 12 has no successor: on QG-12 = PASS, mark `QG-12 quality gate` and `Phase 12: Finalization` `completed` and the list is done.

---

## Review Operation Todos

At Review operation start, create the following todo list:

```
TodoWrite([
  {content: "Phase 0: Select review scope", status: "in_progress", activeForm: "Selecting review scope"},
  {content: "Phase 1: Identify target files", status: "pending", activeForm: "Identifying target files"},
  {content: "Phase 2: Select review level", status: "pending", activeForm: "Selecting review level"},
  {content: "Phase 3: Execute review", status: "pending", activeForm: "Executing review"},
  {content: "Phase 4: Present results", status: "pending", activeForm: "Presenting results"}
])
```

All 5 phases execute sequentially. Mark each phase `in_progress` before starting and `completed` after its quality gate passes.

---

## Display Operation Todos

At Display operation start, create the following todo list (3 phases, no quality gates – read-only):

```
TodoWrite([
  {content: "Phase 0: Pre-flight (gh auth + repo context)", status: "in_progress", activeForm: "Checking gh auth"},
  {content: "Phase 1: Fetch issue data", status: "pending", activeForm: "Fetching issue data"},
  {content: "Phase 2: Format and present", status: "pending", activeForm: "Formatting output"}
])
```

Display has three modes (single / list / search) – the same 3-phase TodoWrite applies to all three.

---

**Rules:**
- Mark phase `in_progress` BEFORE starting
- Mark phase `completed` IMMEDIATELY after quality gate passes
- Only ONE **phase** item is `in_progress` at a time. Its own gate items are the single exception: `QG-N quality gate` (and Phase 4's `QG-4a` / `QG-4b`, Phase 11's `QG-11a`) belong to that phase and sit directly beneath it, so the pair may be open together. Two phase items open at once, or a gate item open under a different phase, is always an error. Only one gate item of a phase is `in_progress` at a time – the sub-gates are sequential, not parallel.
- Advance the list at every phase boundary – the phase files declare the update as an output artifact
- **STOP if quality gate fails after 3 retries**

---

## Related documentation

- [SKILL.md](../SKILL.md) – rule 12 (MUST create TodoWrite list at operation start) and the context-preservation table (TodoWrite is orchestrator-only)
- [reference/implement-phase-requirements.md](implement-phase-requirements.md) – per-phase capability definitions for the 13 Implement phases
