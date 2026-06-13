# Spec Update Patterns

Best practices for updating existing spec documents.

---

## Update Types

| Type | When to Use | Sections Affected |
|------|-------------|-------------------|
| **Add** | New features, requirements, stakeholders | 04, 06, 03 primarily |
| **Modify** | Refine existing items, fix gaps | Any section |
| **Remove** | Obsolete requirements, outdated content | Any section |
| **Comprehensive** | Major revision, low validation score | All sections |

---

## Update Workflow

```
1. Review current spec (via spec-validator)
   └── Identify gaps, low-scoring sections

2. Gather update requirements (via spec-requirements-gatherer in update mode)
   └── User specifies what to change

3. Generate updates (via spec-updater)
   └── Create additions, modifications, removals

4. Merge changes (via spec-section-merger)
   └── Apply with backup, update manifest

5. Re-validate (via spec-validator)
   └── Ensure quality maintained
```

---

## Numbering Continuity

When adding new items, continue from the last ID:

| Item Type | Last ID | New ID |
|-----------|---------|--------|
| Functional Requirement | FR-025 | FR-026 |
| Non-Functional Requirement | NFR-012 | NFR-013 |
| Use Case | UC-005 | UC-006 |

**Never renumber existing items** - breaks traceability.

---

## Cross-Reference Management

When modifying or removing items, check for references:

```
Before removing FR-015:
1. Search: grep "FR-015" specs/spec-t3-001-*/*.md
2. Find: UC-003 references FR-015
3. Action: Update UC-003 or block removal
```

---

## Version History

Always update manifest history on changes:

```json
{
  "version": "1.1.0",
  "date": "2025-12-20T15:30:00Z",
  "changes": "Added export feature requirements (FR-026 to FR-030)",
  "sections_affected": ["04", "06"]
}
```

**Versioning rules:**
- Patch (1.0.x): Minor fixes, clarifications
- Minor (1.x.0): New requirements, use cases
- Major (x.0.0): Scope changes, major revisions

---

## Merge Strategies

| Strategy | Behavior | Use When |
|----------|----------|----------|
| `preserve-existing` | Skip conflicts, flag for review | Cautious updates |
| `prefer-new` | Overwrite with new content | Deliberate revision |
| `manual` | Add conflict markers | Complex merges |

---

## Backup and Rollback

Every update creates automatic backup:

```
1. Before merge: section files backed up in memory
2. If merge fails: automatic rollback
3. Manifest tracks: old_version for reference
```

---

## Common Patterns

### Pattern: Add Feature Requirements

```
1. Review: Load 04-functional-requirements.md
2. Find: Last FR number (e.g., FR-025)
3. Generate: New FRs (FR-026, FR-027...)
4. Each FR: Include acceptance criteria
5. Merge: Append to section
6. Update: manifest statistics
```

### Pattern: Update Stakeholder Needs

```
1. Review: Load 03-stakeholders.md
2. Locate: Target stakeholder entry
3. Generate: Updated needs description
4. Merge: Replace existing entry
5. Check: References in use cases still valid
```

### Pattern: Remove Obsolete Use Case

```
1. Search: Find all references to UC-XXX
2. Assess: Impact on other sections
3. Update: Dependent sections first
4. Remove: Use case entry
5. Note: In manifest history
6. Don't: Renumber remaining use cases
```

---

## Anti-patterns

| Anti-pattern | Problem | Solution |
|--------------|---------|----------|
| Renumbering IDs | Breaks references | Keep original IDs |
| No backup | Can't rollback | Always enable backup |
| Skip validation | Quality degradation | Re-validate after updates |
| Ignore references | Orphaned items | Check cross-references |
| Bulk changes | Hard to review | Small, focused updates |

---

## Quality Checklist

Before completing update:

- [ ] Backup created
- [ ] Numbering continues (no gaps, no renumber)
- [ ] Cross-references updated
- [ ] Manifest version incremented
- [ ] History entry added
- [ ] Validation score maintained or improved

---

## See also

- `tier-guide.md` - Spec tier selection and structure
- `operational-guide.md` - Quality gates and recovery procedures
