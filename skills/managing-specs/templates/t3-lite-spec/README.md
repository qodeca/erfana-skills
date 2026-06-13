# T3: Lite Spec Template

Use this template for complex features that need structured requirements and traceability.

## When to Use T3

- Complex features (5-15 files affected)
- New UI components or services
- Multiple requirement types (FR + NFR)
- Need for acceptance criteria traceability
- Estimated effort: 1-2 weeks

## Directory Structure

```
specs/spec-t3-{id}-{slug}/
├── manifest.json
├── requirements/
│   ├── 01-overview.md
│   ├── 02-requirements.md
│   └── 03-acceptance.md
├── architecture/              # Optional: created when needed
│   └── 001-{slug}.md
├── solution/                  # Optional: created when needed
│   └── 001-{slug}.md
├── design/                    # Optional: created when needed
│   └── 001-{slug}.md
└── ux/                        # Optional: created when needed
    └── 001-{slug}.md
```

## Component Folders

T3 specs create component folders on-demand based on feature needs:

| Folder | Purpose | Created when |
|--------|---------|--------------|
| `requirements/` | FR, NFR, acceptance criteria | Always (mandatory) |
| `architecture/` | ADRs, component design, integration patterns | Technical decisions needed |
| `solution/` | Technology choices, data models, API contracts | Implementation approach defined |
| `design/` | User flows, wireframes, component specs | User-facing functionality exists |
| `ux/` | UI specs, visual design, accessibility | Polished UI required |

**Registry entry: Yes**
**Manifest: Yes (simplified)**
**Validation threshold: 50%**

## Files

### manifest.json
See `manifest-schema.json` with `tier: "T3"`.

### requirements/01-overview.md
Scope, context, and success criteria.

### requirements/02-requirements.md
Functional and non-functional requirements combined.

### requirements/03-acceptance.md
Test checklist with traceability to requirements.

## Allowed Requirement Types

| Type | Prefix | Section |
|------|--------|---------|
| Functional | FR | 02-requirements.md |
| Non-Functional | NFR | 02-requirements.md |
| Acceptance Criteria | AC | 03-acceptance.md |

**Not available in T3:** UC (Use Cases), CA (Constraints/Assumptions)
