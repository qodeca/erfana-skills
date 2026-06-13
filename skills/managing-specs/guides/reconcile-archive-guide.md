# RECONCILE and ARCHIVE operations guide

Detailed workflows for the RECONCILE and ARCHIVE operations. See SKILL.md for compact workflow tables.

---

## RECONCILE: Auto-fix categories

| Category | Auto-Fix | Manual |
|----------|----------|--------|
| Word count update | Auto | - |
| Sequence counts | Auto | - |
| requirements_index population | Auto | - |
| Registry sync | Auto | - |
| Missing test cases | - | Manual |
| Abstract requirements | - | Manual |
| Content improvements | - | Manual |

### Auto-fix process

1. **Word count**: `wc -w *.md` -> update `statistics.total_words`
2. **Sequence counts**: Parse files, count FR/NFR/AC -> update `requirement_sequences`
3. **Requirements index**: Parse requirement headers -> populate `requirements_index`
4. **Registry sync**: Compare manifest to registry -> update `sections_count`, `requirements_count`

### Example

```
RECONCILE Spec #001

Auto-fixes applied:
- Updated total_words: 1200 -> 1789
- Updated AC sequence: 18 -> 19
- Populated requirements_index (13 entries)
- Synced registry counts

Manual fixes needed (approval required):
- FR-008 is abstract – add concrete interface spec
- FR-006 missing dedicated test case

Apply manual fixes? [y/n]
```

---

## ARCHIVE: Detailed workflow

**Meaning:** Archive = "this feature is complete and implemented – keep for reference only"

**One-way:** Archived specs cannot be unarchived. Create new spec if needed.

**Physical location:** Archived specs are moved to `specs/archived/`

### Archive folder structure

```
specs/
├── registry.json
├── spec-t3-002-active-feature/
├── spec-t4-003-another-active/
└── archived/
    ├── spec-t4-001-user-auth/
    └── spec-t3-004-old-feature/
```

### Move operation

```bash
# Create archived folder if not exists
mkdir -p {project_path}/specs/archived/

# Move spec folder
mv {project_path}/specs/spec-t{tier}-{id}-{slug}/ \
   {project_path}/specs/archived/spec-t{tier}-{id}-{slug}/
```

Registry path update: `spec-t4-001-user-auth` -> `archived/spec-t4-001-user-auth`

### Error handling

| Scenario | Behavior |
|----------|----------|
| Spec not found | STOP: "Spec #{id} does not exist in registry" |
| Already archived | STOP: "Spec #{id} is already archived (on {date})" |
| Already deprecated | STOP: "Spec #{id} has been deprecated and cannot be archived" |
| Folder move fails | STOP: "Failed to move spec folder. Check permissions." |
| Target exists in archived/ | STOP: "Folder already exists in archived/. Manual cleanup needed." |
| No linked documents | WARN: "No linked documents found. Archive anyway?" (proceed on yes) |
| Validation not passed | WARN: "Spec has not passed validation. Archive anyway?" (proceed on yes) |

### Archive summary (presented to user)

```
## Archive Spec #{id}: {name}

This will mark the spec as complete and archived.

Current state:
- Status: active
- Sections: {count}
- Requirements: {count}
- Linked documents: {count}

What happens on archive:
- Spec folder moved to specs/archived/
- Status changes to `archived` in registry
- Spec remains readable for historical reference
- No further modifications allowed
- Excluded from active LIST results (use --all to include)

WARNING: This is a ONE-WAY operation. Archived specs cannot be unarchived.
```

### User confirmation

```
Archive Spec #{id}: {name}? Type 'yes' to confirm:
```

**User typing "yes" is the proof of completion.** No additional validation required.

**Cancellation:** If user types anything other than 'yes' (including 'y', 'Yes', or empty):
- Display: "Archive cancelled. Spec remains active."
- STOP workflow (do not proceed)

### Manifest update

After registry update, add to manifest.json:
```json
{
  "archived": "{current_timestamp}",
  "archived_by": "user",
  "change_history": [
    ...existing entries...,
    {
      "date": "{current_timestamp}",
      "operation": "ARCHIVE",
      "target": "manifest",
      "description": "Spec archived – marked as complete for historical reference",
      "by": "user"
    }
  ]
}
```

### Example

```
User: "Archive Spec #001"

-> spec-registry-manager: Verify Spec #001 exists, status=active
-> spec-status: Get summary (5 sections, 12 requirements, 3 linked docs)
-> Display archive summary

Archive Spec #001: User Authentication? Type 'yes' to confirm: yes

-> spec-registry-manager: Execute archive operation (manifest update + folder move + status change)

Spec #001 "User Authentication" archived successfully.
   Archived: 2025-12-27T15:30:00Z
   Location: specs/archived/spec-t4-001-user-auth/
   Status: archived (read-only, historical reference)
```
