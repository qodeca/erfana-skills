# Bug Report Template

Use this template when creating bug reports. Copy and adapt the structure below.

## Template

```markdown
## Summary
[One clear sentence – what behavior is broken and what the user experiences (not where in the code)]

## Steps to Reproduce
1. [First step to trigger the bug]
2. [Second step]
3. [Continue until bug manifests]

## Expected Behavior
[What should happen when following the steps above]

## Actual Behavior
[What actually happens - the bug manifestation]

## Environment
- OS: [e.g., macOS 14.0, Windows 11, Ubuntu 22.04]
- App Version: [e.g., 0.4.1]
- Node Version: [if relevant, e.g., 18.x]

## Acceptance Criteria
<!-- 3-5 criteria for a bug; each independently testable in one action. Do not exceed 5. -->
- [ ] [Specific condition that must be true when fixed]
- [ ] [An edge case that must also hold]
- [ ] [No regression in related functionality]

## Implementation Notes for Claude Code
1. Research the affected area to understand current behavior
2. Identify the root cause through code analysis
3. Consider edge cases and related functionality
4. Ensure fix doesn't introduce regressions
5. Add tests if applicable

## Automation (optional)
<!-- If this repo auto-implements issues via Claude Code GitHub Actions, mention @claude in the body or a
     comment to trigger it. Omit entirely if you do not use that integration — it is harmless when unused. -->
- [ ] Ready for @claude to implement
```

## Guidelines for Using This Template

### Summary
- One sentence, clear and specific
- Bad: "It doesn't work"
- Good: "File save fails silently when filename contains special characters"

### Steps to Reproduce
- Numbered list, specific and reproducible
- Include any preconditions (e.g., "With a project open...")
- Mention if the bug is intermittent

### Expected vs Actual
- Be specific about the difference
- Include error messages if any (but not stack traces with line numbers)

### Environment
- Only include relevant details
- Version numbers help narrow down regressions

### Acceptance Criteria
- Write as testable checkboxes
- Focus on observable behavior
- Include "no regression" criteria if touching sensitive areas
- 3-5 criteria for a bug (fixed behavior + at least one edge case + a no-regression check); never exceed 5

### Labels
- Apply a type label (`bug`) plus `needs-triage` so the issue routes for prioritization
- Optionally add a priority label (`P1`/`P2`/`P3`) when severity is known

### Implementation Notes
- Guide research, don't prescribe solutions
- Never include file paths or line numbers
- Suggest areas to investigate, not specific fixes
- Let Claude Code analyze the current codebase fresh
