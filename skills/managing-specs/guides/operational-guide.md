# Operational Guide

This guide covers operational details: quality gate enforcement, error handling, concurrent modification, and registry recovery.

---

## Quality Gate Enforcement (ACT-001)

### How Quality Gates Work

1. **Pre-step validation:** Agent checks input conditions before executing
2. **Post-step validation:** Agent verifies output after executing
3. **Retry logic (fault-classified):** TRANSIENT (timeout/429) -> backoff + jitter, max 3; VALIDATION (gate failed) -> re-invoke WITH the validator's findings injected, max 2, then escalate (never re-send identical input); PERMANENT (missing project_path, invalid tier, SPEC_NOT_FOUND, PATH_ESCAPE, INVALID_SLUG) -> fail fast, no retry. Malformed/empty output -> one reformat attempt then escalate.
4. **Escalation:** After the class-appropriate cap, return to orchestrator with error

### Enforcement Mechanism

Each agent MUST:
```
1. Validate inputs → STOP if invalid (return error)
2. Execute operation
3. Validate outputs → if failed, retry per fault class (TRANSIENT backoff/max 3; VALIDATION re-invoke-with-findings/max 2; PERMANENT fail fast)
4. Return result or escalation status
```

### Escalation Path

When quality gate fails after 3 retries:
1. Agent returns `{status: "escalation_needed", reason: "...", attempts: 3}`
2. Orchestrator presents issue to user via `AskUserQuestion`
3. User decides: retry with different input, skip, or abort

---

## Error Handling (ACT-002)

### Common Failure Modes

| Error Type | Cause | Recovery |
|------------|-------|----------|
| Write failure | Permission denied, disk full | Check permissions, free disk space |
| Registry corruption | Partial write, concurrent access | Run RECONCILE or registry rebuild |
| File not found | Deleted externally, wrong path | Verify path, run STATUS |
| Invalid JSON | Manual edit errors | Run `spec-reconciler` in fix mode |
| Cross-reference broken | Deleted requirement | Run RECONCILE to clean orphans |

### Recovery Procedures

**Registry Corruption:**
1. Delegate to `spec-registry-manager` with operation: `rebuild`
2. Agent scans `specs/spec-t*/manifest.json` for all specs
3. Reconstructs registry.json from discovered manifests
4. Reports any orphaned or conflicting entries

**Manifest Corruption:**
1. Delegate to `spec-reconciler` in `fix` mode
2. Agent rebuilds manifest from section files
3. Recalculates statistics and indexes

**Backup Strategy:**
- Before UPDATE/REMOVE/MOVE operations, agents create `.backup` files
- Rollback: copy `.backup` back to original
- Cleanup: remove `.backup` after successful operation

---

## Concurrent Modification (ACT-007)

### Current Behavior

This skill does NOT support concurrent modification of the same spec. Operations are assumed to be sequential.

### Conflict Prevention

1. **Single-user assumption:** One orchestrator session per spec at a time
2. **File-level atomicity:** Each operation completes before next starts
3. **No explicit locking:** Rely on sequential execution

### If Conflicts Occur

Symptoms: Registry mismatch, duplicate IDs, missing requirements

Recovery:
1. Run `STATUS` to identify inconsistencies
2. Run `RECONCILE` in report mode to see issues
3. Run `RECONCILE` in fix mode to auto-repair
4. If unrecoverable, use registry rebuild

### Future Enhancement

For multi-user scenarios, consider:
- File locking (`.lock` files)
- Optimistic concurrency (version checks)
- Conflict resolution UI

---

## Registry Rebuild Operation (ACT-008)

The `spec-registry-manager` agent supports a `rebuild` operation for disaster recovery.

### When to Use

- Registry.json deleted or corrupted
- Out of sync with actual spec folders
- After manual file system changes

### How It Works

```
spec-registry-manager operation: rebuild
1. Scans specs/ for all directories matching pattern spec-t{tier}-{ID}-{slug}/
2. Reads manifest.json from each valid spec folder
3. Determines next_id from highest found ID + 1
4. Reconstructs registry.json with all discovered entries
5. Reports any issues (missing manifests, duplicate IDs)
```

### Limitations

- Cannot recover deleted spec content (only registry metadata)
- If two folders have same ID, first found wins
- Manual intervention needed for duplicate IDs

---

## Input Sanitization (ACT-003)

### Spec Name Validation

The `spec-registry-manager` agent MUST sanitize spec names:

**Allowed characters:** `a-z`, `0-9`, `-` (hyphen)

**Slug generation rules:**
1. Convert to lowercase
2. Replace spaces with hyphens
3. Remove special characters: `../`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`
4. Collapse multiple hyphens to single
5. Trim leading/trailing hyphens
6. Truncate to 50 characters max

**Example:**
- Input: `../../../etc/passwd`
- Output: `etcpasswd` (path traversal removed)

**Validation:**
- ⛔ REJECT if resulting slug is empty
- ⛔ REJECT if slug matches reserved names: `.`, `..`, `registry`

---

## File Size Limits (ACT-011)

### Recommended Limits

| File Type | Soft Limit | Hard Limit |
|-----------|------------|------------|
| Section file | 200 lines | 400 lines |
| Manifest.json | 100 lines | 200 lines |
| Total spec | 1000 lines | 2000 lines |

### Enforcement

- `spec-validator` warns when soft limit exceeded
- `spec-validator` fails when hard limit exceeded
- Recommendation: split large sections into sub-sections

---

## Schema Version Handling (ACT-009)

### Current Schema Versions

- `registry-schema.json`: version 2.0.0
- `manifest-schema.json`: version 1.0

### Migration Rules

When reading files with older schema versions:
1. Agent detects version from `schema_version` field
2. If missing, assume version 1.0
3. Apply forward migrations if needed
4. Write back in current schema version

### Future Versions

When schema changes:
1. Increment schema version in template files
2. Add migration logic to relevant agents
3. Document breaking changes in CHANGELOG

---

## See also

- `progressive-disclosure-guide.md` - Requirements gathering framework
- `tier-guide.md` - Spec tier selection and structure
- `update-patterns.md` - Best practices for updating specs
