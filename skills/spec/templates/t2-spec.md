# T2: Feature Spec Template

Use this template for simple features that need slightly more structure than a GitHub issue but don't warrant a full spec.

## When to Use T2

- Simple features (1-5 files affected)
- Clear scope and requirements
- Single component or module
- Estimated effort: 1-3 days

## File Location

```
specs/spec-t2-{id}-{slug}/
├── manifest.json
└── spec.md
```

**Registry entry: Yes. Manifest: Yes. Self-contained folder.**

## Template

```markdown
# Feature: [Name]

**Status:** Draft | In Progress | Complete
**Created:** YYYY-MM-DD
**Updated:** YYYY-MM-DD

## Overview

[2-3 sentences describing the problem and solution]

## Scope

| In Scope | Out of Scope |
|----------|--------------|
| ... | ... |
| ... | ... |

## Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| R-01 | [Requirement] | Must | |
| R-02 | [Requirement] | Should | |
| R-03 | [Requirement] | Could | |

## Design Notes

[Brief technical approach - which components, APIs, patterns]

## Acceptance Checklist

- [ ] R-01: [Test case]
- [ ] R-02: [Test case]
- [ ] R-03: [Test case]
- [ ] No regressions in existing functionality
- [ ] Performance acceptable

## References

- [Related docs or prior art]
```

## Example: Dark Mode Toggle

```markdown
# Feature: Dark Mode Toggle

**Status:** Draft
**Created:** 2025-12-21
**Updated:** 2025-12-21

## Overview

Users want to switch between light and dark themes. The toggle should persist across sessions and apply immediately without page reload.

## Scope

| In Scope | Out of Scope |
|----------|--------------|
| Toggle in settings | Custom themes |
| Light/dark presets | Theme editor |
| Persistence | System theme detection |
| Immediate application | Scheduled switching |

## Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| R-01 | Toggle in settings panel | Must | |
| R-02 | Immediate theme switch | Must | No reload |
| R-03 | Persist to localStorage | Must | |
| R-04 | Keyboard shortcut | Should | Cmd+Shift+D |
| R-05 | Smooth transition | Could | 0.2s fade |

## Design Notes

- Use CSS custom properties for theming
- Store preference in `localStorage.theme`
- Add `data-theme` attribute to root element
- Existing design tokens support both themes

## Acceptance Checklist

- [ ] R-01: Toggle visible in settings
- [ ] R-02: Theme changes instantly on toggle
- [ ] R-03: Preference survives browser restart
- [ ] R-04: Cmd+Shift+D toggles theme
- [ ] R-05: No flash on transition
- [ ] Existing UI elements render correctly in both themes

## References

- Design tokens: `src/renderer/styles/design-tokens.css`
- VS Code theme switching pattern
```

## Output

T2 creates a **folder** at `specs/spec-t2-{id}-{slug}/` containing:
- `manifest.json` – Metadata and tracking
- `spec.md` – Feature specification

**Registry entry: Yes. Manifest: Yes.**
