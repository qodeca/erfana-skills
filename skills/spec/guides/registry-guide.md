# Registry System Guide

This guide explains the global registry system for managing unique sequential spec IDs.

---

## Directory Structure

Global registry tracks all spec documents with unique sequential IDs:

```
specs/
├── registry.json                       # Global registry (sequence + index)
├── spec-t2-001-user-preferences/       # Spec #001 (Tier 2)
│   ├── manifest.json
│   └── spec.md
├── spec-t3-002-user-authentication/    # Spec #002 (Tier 3)
│   ├── manifest.json
│   └── requirements/
│       ├── 01-overview.md
│       ├── 02-requirements.md
│       └── 03-acceptance.md
└── spec-t4-005-shopping-cart/          # Spec #005 (003-004 deleted)
    ├── manifest.json
    └── requirements/
        ├── 01-overview.md
        ├── 02-requirements.md
        ├── 03-use-cases.md
        ├── 04-acceptance.md
        └── 05-notes.md
```

---

## ID Rules

**Format:** `spec-t{tier}-{ID:03d}-{slug}`

**Rules:**
- IDs are 3-digit zero-padded with spec-t{tier} prefix (spec-t3-001, spec-t4-002, ...)
- IDs NEVER repeat, even after deletion
- Sequence only increments, never decrements
- Gaps in sequence are normal (from deletions)

**Examples:**
- Valid: `spec-t2-001-user-prefs`, `spec-t3-002-payment`, `spec-t4-015-shopping-cart`
- Invalid: `001-auth` (no prefix), `spec-t3-1-auth` (not zero-padded), `user-auth` (no ID)

---

## Registry Schema

See `templates/registry-schema.json` for complete schema.

**`documents` placement (v2.0.0):** As of registry schema v2.0.0, the `documents` field (containing `technical_adrs`, `solution_adrs`, `solution_specs`, `designs`, `issues` arrays) is stored on each registry entry in `specs/registry.json`, not on the per-spec `manifest.json`. This colocates ADR/design/issue cross-links with the registry's at-a-glance view. Manifests should NOT carry a `documents` field; if they do (e.g., from migrated v1.0.0 specs), move it to the matching registry entry.

**Key fields (v2.0):**
```json
{
  "schema_version": "2.0.0",
  "sequence": {
    "current": 5,
    "next": 6
  },
  "registry": [
    {
      "id": 1,
      "tier": "T3",
      "slug": "user-authentication",
      "path": "spec-t3-001-user-authentication",
      "created": "2025-12-20T10:00:00Z",
      "status": "active",
      "sections_count": 3,
      "requirements_count": 15,
      "documents": {
        "technical_adrs": [
          "docs/architecture/adrs/adr-spec-001-001-auth-patterns.md"
        ],
        "solution_adrs": [
          "specs/solution/adrs/adr-spec-001-001-oauth-provider.md"
        ],
        "solution_specs": [
          "specs/solution/spec-001-auth-data-model.md"
        ],
        "designs": [
          "specs/designs/spec-001-user-authentication/sd-001-implementation.md"
        ],
        "issues": ["#42"]
      }
    }
  ]
}
```

---

## Document Binding (Unified Structure)

Spec ID serves as the universal binding key for all related documents:

| Document Type | Location | Naming Pattern |
|---------------|----------|----------------|
| **Spec (T2-T4)** | `specs/` | `spec-t{tier}-{id}-{slug}/` |
| **Technical ADR** | `docs/architecture/adrs/` | `adr-spec-{id}-{seq}-{slug}.md` |
| **Solution ADR** | `specs/solution/adrs/` | `adr-spec-{id}-{seq}-{slug}.md` |
| **Solution Spec** | `specs/solution/` | `spec-{id}-{slug}.md` |
| **Design** | `specs/designs/spec-{id}-{slug}/` | `sd-{seq}-{slug}.md` |

**Find all docs for a feature:**
```bash
find . -name "*spec-001*" -type f

# Or via registry
jq '.registry[] | select(.id == 1) | .documents' specs/registry.json
```

---

## Registry Operations

### Claim ID (INIT)

When creating new spec:
1. Registry manager reads `registry.json`
2. Assigns current `next_id` to new spec
3. Increments `next_id` by 1
4. Adds entry to registry
5. Creates directory: `specs/spec-t{tier}-{id:03d}-{slug}/`

### List (LIST)

Displays all specs in registry with metadata.

### Delete/Archive

Marks entry as deleted but **never reuses ID**.

### Link Document (link_document)

Links a document (ADR, spec, design, issue) to a spec entry:
1. Validates spec_id exists in registry
2. Validates doc_type is valid (technical_adr, solution_adr, solution_spec, design, issue)
3. Adds doc_path to appropriate array in documents field
4. Idempotent: skips if already linked

### List Documents (list_documents)

Lists all documents linked to a spec entry:
```json
{
  "spec_id": 1,
  "documents": {
    "technical_adrs": [...],
    "solution_adrs": [...],
    "solution_specs": [...],
    "designs": [...],
    "issues": [...]
  },
  "summary": {
    "total": 5,
    "by_type": {...}
  }
}
```

### Rebuild (Recovery)

Scans `specs/` and reconstructs registry from discovered manifests.

---

## Registry Recovery

See `guides/operational-guide.md` for detailed registry rebuild procedures.

---

## See also

- `guides/operational-guide.md` for registry rebuild and error handling
- `guides/tier-guide.md` for spec tier selection and structure
- `templates/registry-schema.json` for schema reference

---

## Components shape: legacy vs v2.0

`registry-schema.json` accepts **two shapes** for the per-spec `components` block under `anyOf` (schema lines 97-121):

| Shape | When | Required fields | Format |
|-------|------|-----------------|--------|
| **Legacy boolean flags** | Specs created before schema 2.0.0 | `requirements`, `architecture`, `solution`, `design`, `ux` | `{ "requirements": true, "architecture": false, "solution": true, "design": true, "ux": false }` |
| **v2.0 aggregate counters** | Specs created or migrated under schema 2.0.0+ | `total`, `implemented`, `list` | `{ "total": 5, "implemented": 3, "list": ["requirements", "solution", "design"] }` |

**Migration policy:**
- New entries written by `spec-registry-manager` MUST use the v2.0 aggregate shape.
- Existing legacy entries are read-only-compatible — `spec-validator` and `spec-reconciler` accept both via the `anyOf` branch.
- To migrate a legacy entry: planned but not yet implemented in `spec-reconciler`. Until then, legacy entries remain valid (the `anyOf` branch keeps them passing schema validation). When implemented, the reconciler will compute `total`, `implemented`, and `list` from the boolean flags (any `true` flag joins `list`; counts derive from there).
- The `anyOf` branch will remain in the schema until all known registries are migrated; do not remove it.

**Detection:** A registry entry is "legacy-shaped" if its `components` object contains the 5 named boolean fields (`requirements`/`architecture`/`solution`/`design`/`ux`). A v2.0-shaped entry contains numeric `total` + `implemented` and a string-array `list`.

---

**Last Updated:** 2026-04-25
**Version:** 2.0.0
