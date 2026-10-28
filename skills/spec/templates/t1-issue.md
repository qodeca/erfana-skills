# T1: Issue Template

Use this template for simple features, bug fixes, and trivial changes that don't require formal spec documentation.

## When to Use T1

- Bug fixes
- Single-file changes
- Wrapping existing APIs
- Features with clear prior art (e.g., "like VS Code's X")
- Estimated effort: <1 day

## Template

```markdown
# [Feature/Fix Name]

## Why
[1-2 sentences explaining the problem or need]

## Scope
- **In:** [What's included]
- **Out:** [What's explicitly excluded]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Done When
[Clear success criteria - how we know it's complete]

## Notes
[Optional: Technical approach, dependencies, or constraints]
```

## Example: Editor In-File Search

```markdown
# Add in-file search (Cmd+F)

## Why
Users need to find text in the current document without leaving the editor.

## Scope
- **In:** Single-document search, basic matching
- **Out:** Multi-file search, regex, find-replace

## Requirements
- [ ] Open search with Cmd+F (macOS) / Ctrl+F (Windows/Linux)
- [ ] Live search as user types
- [ ] Case-sensitive toggle
- [ ] Whole-word toggle
- [ ] Highlight all matches
- [ ] Navigate with Enter/Shift+Enter
- [ ] Show match count (e.g., "3 of 15")
- [ ] Close with Escape

## Done When
Search works like VS Code's basic find-in-file. Response time <100ms.

## Notes
Use Monaco Editor's built-in search API.
```

## Output

T1 specs use the **simplified folder structure**:

```
specs/
├── registry.json                    # T1 is tracked here
└── spec-t1-{id}-{slug}/
    ├── manifest.json                # Simplified manifest (no components field)
    └── spec.md                      # Single file with all content
```

**Key points:**
- T1 specs ARE registered in `registry.json` with a unique global ID
- T1 specs DO have a folder (`spec-t1-{id}-{slug}/`)
- T1 manifests omit the `components` field (not applicable)
- The spec.md file contains everything (no separate requirements/ folder)

**Workflow:**
1. Claim unique ID via `spec-registry-manager`
2. Create folder structure with manifest.json and spec.md
3. Optionally create a GitHub issue using `gh issue create`
