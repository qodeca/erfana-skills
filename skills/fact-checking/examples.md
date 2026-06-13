# Fact-checking skill – usage examples

These examples use a fictional project as context:
- Target: `analysis/operations-as-is-analysis.md`
- Sources: `sources/interviews/`, `sources/vendor-docs/`, `sources/departments/operations/`

## Contents

- [Example 1: Full document fact-check (basic)](#example-1-full-document-fact-check-basic)
- [Example 2: Section-scoped check (alternative)](#example-2-section-scoped-check-alternative)
- [Example 3: Interactive severity review flow (detailed)](#example-3-interactive-severity-review-flow-detailed)
- [Example 4: Large document with parallel verification](#example-4-large-document-with-parallel-verification)

---

## Example 1: Full document fact-check (basic)

**User says:**
`/erfana:fact-checking analysis/operations-as-is-analysis.md`

**Skill does:**

1. Validates target file exists, creates todo list with all 5 phases
2. Delegates to `fc-discover-sources` – discovers 3 source directories

**Step 1.3 – per-path source confirmation:**

Source 1 of 3:
```
Source validation

Should `sources/interviews/` (interviews, 17 files) be used as a verification source?

Discovery notes: High confidence – contains INDEX.md with interview summaries

  > Yes, include as source
    No, exclude
```
User selects "Yes, include as source".

Source 2 of 3:
```
Source validation

Should `sources/vendor-docs/` (vendor-docs, 4 files) be used as a verification source?

Discovery notes: High confidence – contracts, proposals, and SLA documents

  > Yes, include as source
    No, exclude
```
User selects "Yes, include as source".

Source 3 of 3:
```
Source validation

Should `sources/departments/operations/` (department-docs, 6 files) be used as a verification source?

Discovery notes: Medium confidence – organizational structure files

    Yes, include as source
  > No, exclude
```
User selects "No, exclude".

**Step 1.4 – additional sources:**
```
Additional sources

All discovered sources have been reviewed. Would you like to add more sources?

    Search for more sources
    Provide paths manually
  > No, proceed with current list
```
User selects "No, proceed with current list".

**Step 1.5 – final source list approval:**
```
Final verification sources:
1. sources/interviews/ (interviews, 17 files)
2. sources/vendor-docs/ (vendor-docs, 4 files)
```

```
Final approval

This is the final list of sources for fact-checking. Do you approve?

  > Approve and proceed
    Remove sources
    Add more sources
```
User selects "Approve and proceed". Sources locked.

3. Delegates to `fc-extract-claims` – extracts 142 claims
4. Shows summary: "Found 142 claims (58 factual, 31 numeric, 24 attributions, 18 process descriptions, 11 inferences)"
5. Delegates to `fc-verify-claims` – produces verdicts for all 142 claims
6. Presents: "Verification complete: 142 verified. 1 Critical, 5 Error, 12 Warning, 3 Info findings require review"
7. Reviews each severity group with user (see Example 3 for detail)
8. Applies 14 accepted corrections via `fc-apply-fixes`

**Output:**
"Applied 14 corrections to `analysis/operations-as-is-analysis.md`"

---

## Example 2: Section-scoped check (alternative)

**User says:**
`/erfana:fact-checking analysis/operations-as-is-analysis.md --section 2`

**Skill does:**

1. Parses target path and `--section 2` flag (Section 2: "Systems and tools in use")
2. Discovers and confirms sources (same flow as Example 1)
3. Delegates to `fc-extract-claims` with section filter – extracts 38 claims from Section 2 only (system names, license counts, integration details)
4. Shows summary: "Found 38 claims (15 factual, 12 numeric, 6 process descriptions, 5 attributions)"
5. Delegates to `fc-verify-claims` – compares against source documents
6. Presents: "Verification complete: 31 verified. 0 Critical, 2 Error, 4 Warning, 1 Info findings require review"

**Sample findings:**

| # | Severity | Claim (line) | Issue |
|---|----------|--------------|-------|
| 1 | Error | "200 ERP licenses active" (L68) | No source mentions license count |
| 2 | Warning | "integration is fully automated" (L82) | Operations manager interview says "mostly manual reconciliation" |

7. User reviews – accepts Error #1, dismisses Warning as analyst inference
8. Applies 1 correction

**Output:**
"Applied 1 correction to `analysis/operations-as-is-analysis.md` (Section 2)"

---

## Example 3: Interactive severity review flow (detailed)

This example shows the `AskUserQuestion` interaction during Phase 4 – the part where the user reviews findings by severity group.

**Context:** Verification found 1 Critical, 3 Error, 2 Warning findings (130 claims verified).

**Step 1 – Critical findings (presented first):**

```
CRITICAL findings (1)

#1  Line 25: "Total operations staff: 9 people"
    Verdict: CONTRADICTS SOURCE
    Source: ops-manager-interview-260131.md, line 84
    Source says: "we have 10 people in operations including myself"
    Suggested fix: Change "9 people" to "10 people"

How would you like to handle Critical findings?

  > Accept all – mark for fix
    Review individually
    Dismiss all – false positives
    Skip this severity level
```

User selects "Accept all – mark for fix". Finding queued for Phase 5 bulk apply.

**Step 2 – Error findings (presented next):**

```
ERROR findings (3)

#2  Line 47: "SLA guarantees 99.9% uptime"
    No source document mentions this SLA percentage.

#3  Line 112: "Data team has 4 members"
    Source: department-head-interview-260131.md says 3 + 1 vacant position.

#4  Line 130: "Monthly reconciliation takes 5 business days"
    No source mentions reconciliation duration.

How would you like to handle Error findings?

  > Review individually
    Accept all – mark for fix
    Dismiss all – false positives
    Skip this severity level
```

User selects "Review individually". Each finding shown one by one:

```
Error #2 (Line 47): "SLA guarantees 99.9% uptime"
  Verdict: UNGROUNDED – no source mentions this figure
  Suggested fix: Remove specific percentage or add "[unverified]" marker

  > Accept and fix
    Dismiss
    Label as analyst inference
    Skip
```

User selects:
- "Accept and fix" for #2 → `fc-apply-fixes` dispatched IMMEDIATELY for finding #2
- "Label as analyst inference" for #3 → adds footnote in place
- "Dismiss" for #4 → user knows source from a meeting not yet transcribed

**Step 3 – Warning findings:** User selects "Skip this severity level".

**Result:** Phase 5 applies the queued Critical #1 (bulk). Error #2 already applied during review. Error #3 labeled as inference. Final summary: 2 fixes applied + 1 inference label.

> Before any fix is written, the skill asks once (Phase 4 preamble) to confirm the target is committed to git – the rollback path, since edits are applied in place. When the user accepts a fix, the **literal replacement text** is shown for approval, and `fc-apply-fixes` locates it by that verbatim text (not by line number), so immediate and bulk applies are both drift-safe.

---

## Example 4: Large document with parallel verification

**Context:** A 320-claim analysis document. Phase 3.1 fans out verification across parallel workers.

**Skill does:**

1. Phases 1-2 as usual; `fc-extract-claims` returns 320 claims (under the ~400 ceiling, so no stop-and-ask).
2. Phase 3.1 chooses ~25-claim chunks capped at ~8 parallel workers: 320 / 8 ≈ 40 claims per worker, so it runs 8 workers carrying `chunk_index`, `chunk_count`, and a `claim_id_range` each.
3. Seven workers return `completion_status: "full"`; one returns `completion_status: "partial"` with `missing_claim_ids: ["C198","C199","C200"]`.
4. **Reconciliation:** the orchestrator confirms every claim id from Phase 2 is either in the merged results or in a `missing_claim_ids` list, then **re-dispatches only the 3 missing claims** (not the whole batch). The retry returns them full.
5. Step 3.2 checks `findings + verified = 320` by claim id (not summed counters), discards the raw Verified objects, and keeps the flagged findings for review.

**If the retry had failed 3 times:** the skill escalates with the unresolved `missing_claim_ids` rather than proceeding on incomplete data – it never silently reports a clean result over a dropped chunk.
