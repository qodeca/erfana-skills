# Available Labels

Standard label catalog used across managing-issues operations (Create, Implement, Review, Display).

Use these standard labels. For custom labels defined per-project, run `gh label list` to discover the active label set in the target repository.

## Standard labels

| Label | When to Use |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature or improvement |
| `documentation` | Docs improvements |
| `good first issue` | Simple, newcomer-friendly |
| `help wanted` | Extra attention needed |
| `security` | Security-related issues |
| `breaking-change` | Breaking API changes |

## Conventions

- **Combine labels** when an issue spans multiple categories (e.g., `bug` + `security` for a security-relevant defect; `enhancement` + `breaking-change` for a backward-incompatible feature).
- **Discover project-specific labels** before creating any new label — duplicate or conflicting labels fragment filter views. Use `gh label list` first.
- **Display operation** filters by label via the `labels` input parameter (`gh issue list --label=<name>` or `gh search issues --label=<name>`). Match exact label names.

## Related

- Create operation Phase 4 (draft): apply labels at issue creation time.
- Implement operation Phase 0 (preflight): `bug` label triggers `bug-investigator` agent dispatch; `refactor` label triggers `refactor-advisor`.
- Display operation list/search modes: filter by label with the `labels` input parameter.
