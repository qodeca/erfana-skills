# T4: Standard Spec Template

Use this template for major features that need comprehensive documentation with use cases and constraints.

## When to Use T4

- Major features (15+ files affected)
- New subsystems or modules
- Multiple stakeholder concerns
- Need for use cases and constraints
- Estimated effort: 2+ weeks

## Directory Structure

```
specs/spec-t4-{id}-{slug}/
├── manifest.json
├── requirements/
│   ├── 01-overview.md
│   ├── 02-requirements.md
│   ├── 03-use-cases.md       # Optional
│   ├── 04-acceptance.md
│   └── 05-notes.md           # Optional
├── architecture/              # Created by default
│   └── 001-{slug}.md
├── solution/                  # Created by default
│   └── 001-{slug}.md
├── design/                    # Created by default
│   └── 001-{slug}.md
└── ux/                        # Created by default
    └── 001-{slug}.md
```

## Component Folders

T4 specs create all component folders by default, populated as the spec develops:

| Folder | Purpose | Contents |
|--------|---------|----------|
| `requirements/` | What to build | FR, NFR, use cases, acceptance criteria |
| `architecture/` | How to structure | ADRs, component design, integration patterns |
| `solution/` | Technical approach | Technology choices, data models, API contracts |
| `design/` | User interactions | User flows, wireframes, component specs |
| `ux/` | Visual experience | UI specs, visual design, accessibility |

**Registry entry: Yes**
**Manifest: Yes (full)**
**Validation threshold: 80%**

## Files

### manifest.json
See `manifest-schema.json` with `tier: "T4"`.

### requirements/01-overview.md
Scope, context, success criteria, and brief business objectives.

### requirements/02-requirements.md
Functional and non-functional requirements combined.

### requirements/03-use-cases.md (Optional)
User workflows and interaction patterns.

### requirements/04-acceptance.md
Test checklist with traceability to requirements.

### requirements/05-notes.md (Optional)
Constraints, assumptions, dependencies, and references.

## Allowed Requirement Types

| Type | Prefix | Section |
|------|--------|---------|
| Functional | FR | 02-requirements.md |
| Non-Functional | NFR | 02-requirements.md |
| Use Case | UC | 03-use-cases.md |
| Acceptance Criteria | AC | 04-acceptance.md |
| Constraint/Assumption | CA | 05-notes.md |
