# Implement operation – procedures

Workflow state diagram, escalation, and abort procedures for the implement operation. See [implement.md](implement.md) for the full workflow.

---

## Workflow State Diagram

```
START
  │
  ▼
┌─────────────┐     FAIL (3x)     ┌──────────┐
│   Phase 0   │──────────────────▶│ ESCALATE │
│  Pre-flight │                   └──────────┘
└─────┬───────┘
      │ QG-0 PASS
      ▼
┌─────────────┐     FAIL (3x)     ┌──────────┐
│   Phase 1   │──────────────────▶│ ESCALATE │
│Agent Select │                   └──────────┘
└─────┬───────┘
      │ QG-1 PASS (agents selected)
      ▼
┌─────────────┐     FAIL (3x)     ┌──────────┐
│   Phase 2   │──────────────────▶│ ESCALATE │
│  Business   │ (uses selected    └──────────┘
└─────┬───────┘  agent)
      │ QG-2 PASS
      ▼
     ...
      │
      ▼
┌─────────────┐     FAIL (3x)     ┌──────────┐
│  Phase 12   │──────────────────▶│ ESCALATE │
│ Finalization│ (uses selected    └──────────┘
└─────┬───────┘  agent)
      │ QG-12 PASS
      ▼
    DONE
```

---

## Escalation Procedure

When a phase fails after 3 retries:

1. **Present Issue Summary**
   ```markdown
   ## Phase <N> Failed

   **Phase:** <name>
   **Attempts:** 3/3
   **Failure Reason:** <specific reason>

   **Options:**
   - [Retry] - Try again with different approach
   - [Override] - Skip this check (if allowed)
   - [Abort] - Stop implementation
   ```

2. **Document Decision**
   - Record user's choice
   - If override: document justification in commit

3. **Non-Overridable Phases**
   - Phase 0 (Pre-flight) - NEVER skippable
   - Phase 7 (Security) - NEVER skippable
   - Phase 9 (Verification) - NEVER skippable
   - Phase 11 Quality Gates - NEVER skippable

---

## Abort Procedure

If implementation cannot continue:

1. **Document Reason** — `<reason>` is untrusted free text; never inline it into a shell command (a `"` or `$(…)` would break out). Write it to a file and post with `--body-file`, and confirm `<number>` is digit-only first:
   ```bash
   [[ "$NUMBER" =~ ^[0-9]+$ ]] || { echo "refusing: issue number not numeric"; exit 1; }
   # write <reason> to /tmp/abort-<numeric-ts>.md with the Write tool, then:
   gh issue comment -- "$NUMBER" --body-file /tmp/abort-<numeric-ts>.md
   ```

2. **Clean Up (destructive — confirm the resolved targets first).** `git clean -fd` permanently removes untracked files and `git branch -D` force-deletes the branch, so echo the exact targets and require explicit user confirmation before running them. Use the `BASE_BRANCH` captured at QG-0 and the actual branch created in Phase 0 (`RUN_BRANCH`), not hardcoded `main`/`fix/...`:
   ```bash
   echo "About to discard working-tree changes, delete untracked files, and force-delete branch:"
   echo "  base to return to : $BASE_BRANCH"
   echo "  branch to delete  : $RUN_BRANCH"
   git clean -nd          # dry-run: list exactly what -fd would remove
   # → require explicit user confirmation of the above before proceeding ↓
   git checkout .
   git clean -fd
   git checkout "$BASE_BRANCH"
   git branch -D "$RUN_BRANCH"
   ```

3. **Update Issue** - Remove self-assignment, add findings
