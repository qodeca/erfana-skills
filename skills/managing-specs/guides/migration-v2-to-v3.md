# Registry migration: schema v2.0.0 -> v3.0.0

The registry schema moved to `3.0.0` in plugin v5.0.0. This guide is the canonical migration contract and the verification checklist the maintainer (or an executing agent) runs before relying on a migrated registry. It is the regression backstop for the direct-to-main release (no rc soak), so every fixture below MUST pass before merge.

## What changed (field-by-field)

| Field | v2.0.0 | v3.0.0 | Migration action |
|-------|--------|--------|------------------|
| `metadata.schema_version` | `"2.0.0"` | `"3.0.0"` | set to `"3.0.0"` |
| `metadata.version` | absent | integer write-counter | add, initialised to `0` |
| `registry[].status` enum | draft/active/deprecated/archived/reserved | + `failed` | no remap needed (v2 set is a subset) |
| `registry[].documents` keys | technical_adrs, solution_adrs, solution_specs, designs, issues | + `ux`, `e2e_test_designs` | none required; new keys are optional and default to `[]` when first written. The legacy alias `solution_docs` (if present from hand-edits) maps to `solution_specs`. |
| spec entries, IDs, `sequence` | — | unchanged | preserve verbatim — IDs are binding keys and must never change |

The migration is **additive and lossless**: no entry is dropped, no ID is renumbered, and `sequence` is untouched.

## Migration procedure (executed by `spec-registry-manager`)

Triggered on the first touch of any registry whose `metadata.schema_version` is `< 3.0.0` or absent.

1. **Guard a re-run:** if `registry.json.backup` already exists, STOP with `BACKUP_EXISTS` — a prior migration may be incomplete; require manual review rather than overwriting the backup.
2. **Backup:** write the unchanged registry to `registry.json.backup`.
3. **Transform:** set `schema_version: "3.0.0"`; add `metadata.version: 0`; map any legacy `solution_docs` arrays into `solution_specs`; leave all entries, IDs, and `sequence` unchanged.
4. **Write** `registry.json`.
5. **Validate (post-migration path-walk):** re-read the migrated registry and confirm every entry's `path` resolves to an existing directory under `specs/` (honouring the `archived/` prefix). On any failure, write `registry.json.migration-errors` listing the offenders and return `completed_with_errors` — **do not delete the backup**.
6. On success, the backup may be retained (recommended) or removed per the caller's preference.

`archived/` entries are migrated in place (only their schema metadata is touched; the folder is not moved).

## Verification fixtures (all must pass before merge)

Run each by hand-constructing the input registry, invoking `spec-registry-manager` MIGRATE, and checking the expected outcome.

| # | Fixture | Input | Expected outcome |
|---|---------|-------|------------------|
| 1 | Empty registry | `sequence {0,1}`, `registry: []`, schema_version 2.0.0 | schema_version 3.0.0, metadata.version 0, empty registry preserved, backup written |
| 2 | Small (1-3 specs, mixed tiers) | active T1/T2/T3 entries | all entries + IDs unchanged, status values preserved, path-walk passes |
| 3 | Archived-bearing | one `archived/` entry + active entries | archived path/prefix preserved, no folder moved, path-walk passes |
| 4 | Large (20+ specs) | many entries incl. deprecated/deleted | all preserved, sequence untouched, no renumbering |
| 5 | Legacy `solution_docs` | entry with a `documents.solution_docs` array | mapped into `solution_specs`; no data lost |
| 6 | Interrupted prior run | a pre-existing `registry.json.backup` | STOP with `BACKUP_EXISTS`; registry untouched |
| 7 | Orphaned path | entry whose `path` directory is missing | `completed_with_errors`, offender listed in `.migration-errors`, backup retained |
| 8 | Already v3 | schema_version already 3.0.0 | no-op (no backup churn, no version bump beyond normal writes) |

## Rollback

The user's original registry is preserved at `registry.json.backup`. To roll back: stop using v5.0.0, restore `registry.json` from `.backup`. Because the migration never renumbers IDs or moves folders, a rollback loses only the additive v3 metadata, not spec data.

## Security note

The migration touches only `registry.json` (canonicalize the path; assert it is `{project_path}/specs/registry.json`). It never reads or writes content derived from untrusted parsed/fetched input, and never executes any value from the registry.
