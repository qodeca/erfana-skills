# Operation: Display

Read-only surface for GitHub issue data. Three discrete modes – single issue lookup, listing with filters, search by query/label/state. No mutations, no commits, no quality gates.

---

## Overview

| Attribute | Value |
|-----------|-------|
| Phases | 3 (0, 1, 2) |
| Checkpoints | 0 (read-only) |
| Quality gates | 0 (no side effects) |
| Agents | `mi-issue-displayer` (single agent, three modes) |
| Autonomy | High (read-only) |

**Agent Selection:** static. The `mi-issue-displayer` agent (added v4.2.2) handles all three modes via its `mode` parameter. No dynamic discovery needed because the operation has no phase-to-agent matching surface.

---

## When to Use

Activate when user wants to:
- Look up a specific issue by number ("show #42", "view issue 42", "display #42")
- List issues with optional state/label/limit filters ("list issues", "list open issues", "recent issues")
- Search issues by free-text query, label, or state ("find issues with label bug", "search issues mentioning auth flow")

**Trigger phrases (mode-specific):**
- **Single:** "show issue #N", "view issue #N", "display #N"
- **List:** "list issues", "list open issues", "recent issues", "issues assigned to me"
- **Search:** "find issues with label X", "search issues for Y", "issues mentioning Z"

---

## When NOT to Use

See SKILL.md "CRITICAL ARCHITECTURAL RULES" for architectural NOTs that apply to all operations.

Operation-specific NOTs:
- Intent is to modify an issue (close, comment, add labels) – Display is read-only; surface a clear error and suggest the appropriate operation.
- User wants to create a new issue from search results – chain to Create operation explicitly; do not auto-route.
- Bulk operations across many issues (mass-edit, mass-close) – out of scope; surface the request and recommend `gh` CLI directly.

---

## Core Principle

**Display agents NEVER mutate state.** No `gh issue edit`, `gh issue close`, `gh issue comment`, `gh issue reopen`. If the user follows up with an action verb after a Display result, the orchestrator routes to the appropriate operation (Create, Implement, Review) – Display does not chain.

**Untrusted-data boundary (SKILL.md rule 14).** Every input (`issue_number`, `query`, `state`, `labels`, `repo`) and every value that comes *back* from a `gh` result (an issue number, an `owner/repo`) is untrusted data. The `mi-issue-displayer` agent validates/sanitizes inputs (digit-only numbers, allowlisted `state`, `owner/repo` format, dash-stripped queries/labels) before any shell use – the orchestrator must not bypass it by shelling out directly.

---

## Mode Selection

The orchestrator routes to a specific mode based on trigger phrase:

| Mode | Trigger surface | Required input | Optional input |
|------|-----------------|----------------|----------------|
| **single** | "show #N" / "view #N" / "display #N" | `issue_number` | `repo` |
| **list** | "list issues" / "recent issues" / "list open issues" | (none) | `state`, `labels`, `limit`, `repo` |
| **search** | "find issues with label X" / "search issues for Y" | `query` | `state`, `labels`, `limit`, `repo` |

If the user request is ambiguous (e.g., "show issue" without a number), use AskUserQuestion to disambiguate before invoking the agent.

---

## Workflow

The same 3-phase structure applies to all three modes – the only variance is the `mode` parameter passed to `mi-issue-displayer`.

### Phase 0: Pre-flight

#### Input Conditions
- [ ] Mode determined (single / list / search)
- [ ] Mode-specific required inputs present (issue_number for single; query for search)

#### Execution
1. Verify `gh` CLI is authenticated:
   ```bash
   gh auth status
   ```
   If not authenticated, surface `needs_user_input` to prompt the user to run `gh auth login`.
2. Detect the active repo from cwd unless `repo` was explicitly provided. The `gh` CLI infers from the current working directory's git remote – no extra step needed.

#### Quality Gate
None (read-only preflight). On auth failure, return error and stop.

---

### Phase 1: Fetch issue data

#### Input Conditions
- [ ] Phase 0 complete (gh auth verified)

#### Execution

Delegate to `mi-issue-displayer` (shared agent at agents/) with the appropriate mode parameter:

```
Agent tool:
  subagent_type: "mi-issue-displayer"
  prompt: |
    {
      "mode": "<single | list | search>",
      "issue_number": <N>,           // single mode only
      "query": "<query>",            // search mode only
      "state": "<open | closed | all>",  // optional, defaults to open
      "labels": ["<label1>", ...],   // optional
      "limit": <number>,             // optional, defaults to 30
      "repo": "<owner/repo>"         // optional, defaults to cwd repo
    }
```

The agent returns formatted markdown directly (not a JSON envelope – Display is a leaf operation; orchestrator passes through).

#### Quality Gate
None at the orchestrator level (Phase 1 is read-only — no irreversible side effects). The mi-issue-displayer agent's own `quality_gate` enforces output validity (table headers match column count; empty results return a "no issues match" block, never a malformed empty table).

---

### Phase 2: Present results

#### Input Conditions
- [ ] Phase 1 complete (markdown returned from agent)

#### Execution

1. Render the agent's markdown output directly to the user. No transformation, no truncation.
2. If the result is empty (mode=list or mode=search with no matches), the agent returns a "no issues match" block – render as-is.
3. **Optional follow-up:** for single-mode results, offer next-action options:
   ```
   AskUserQuestion({
     questions: [{
       question: "What would you like to do next?",
       header: "Next Steps",
       options: [
         { label: "Implement this issue", description: "Route to Implement operation with this issue number" },
         { label: "Review related code", description: "Route to Review operation" },
         { label: "List related issues", description: "Run a Display list with the same labels" },
         { label: "Done", description: "No further action" }
       ]
     }]
   })
   ```
4. For list/search results, offer drill-down:
   ```
   AskUserQuestion({
     questions: [{
       question: "Drill into one of these issues?",
       header: "Drill-down",
       options: [
         { label: "Show first issue", description: "Display single mode for issue #N (top result) — re-validate the number as digit-only and any owner/repo against the owner/repo format before seeding the follow-up call" },
         { label: "Refine filter", description: "Re-run with different state/labels/limit" },
         { label: "Done", description: "No drill-down" }
       ]
     }]
   })
   ```

#### Quality Gate
None (read-only output).

---

## Autonomy Reference

| Action | Autonomous? |
|--------|-------------|
| Run `gh issue view #N` | Yes |
| Run `gh issue list` | Yes |
| Run `gh search issues` | Yes |
| Read formatted markdown to user | Yes |
| Modify issue (close, comment, label) | **N/A – not in scope. Display never mutates.** |

---

## Error Handling

| Error | Response |
|-------|----------|
| `gh` CLI not installed | Inform user, provide install instructions |
| `gh auth status` returns nonzero | `needs_user_input` – ask user to run `gh auth login` |
| Issue #N not found (404) | Surface gh error verbatim; do not retry |
| Permission denied (private repo without access) | Surface gh error verbatim; suggest authentication scope |
| Empty list/search result | Render "no issues match" block (NOT an empty table) |
| Agent timeout | Retry once, then report partial/error |

---

## Example Flows

| Example | User says | Mode | Key flow |
|---------|-----------|------|----------|
| Single | "show issue #42" | single | Phase 0 (auth) → mi-issue-displayer mode=single → formatted markdown |
| List | "list open bugs" | list | Phase 0 → mi-issue-displayer mode=list, labels=[bug], state=open → markdown table |
| Search | "find issues mentioning auth flow" | search | Phase 0 → mi-issue-displayer mode=search, query="auth flow" → ranked table |

Walkthroughs: [examples/display.md](../examples/display.md).

---

## Best Practices Applied

- **Find-vs-filter discipline:** `mi-issue-displayer` always invokes the gh CLI with the explicit `--json` flag and explicit field list. The CLI's mutable default columns are never used.
- **No silent truncation:** issue body fields are returned full; comments are summarized only at the format step (last 3 with author + relative time), never at the fetch step.
- **Single agent, multiple modes:** shared scaffolding (auth + format pipeline) lives in one agent. Splitting into per-mode agents would triple-duplicate it.

---

## Related

- [operations/create.md](create.md) – chain-target if user wants to create an issue from search results
- [operations/implement.md](implement.md) – chain-target for "implement this issue" follow-up after single-mode display
- [operations/review.md](review.md) – chain-target for "review related code" follow-up
- [agents/mi-issue-displayer.md](../../../agents/mi-issue-displayer.md) – the leaf agent; full input/output contract there
- [reference/labels.md](../reference/labels.md) – label catalog used in list/search filters
