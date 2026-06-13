# Code Writer Agent Template

For agents that create or modify code: implementers, test writers, documentation generators.

---

## When to Use This Template

- Feature implementers
- Bug fixers
- Test writers
- Refactoring agents
- Migration agents

---

## Template

```markdown
# Agent: [your-implementer-name]

## Purpose

[Single sentence describing what this agent implements - no "and"]

---

## Input Contract

| Input | Type | Required | Validation |
|-------|------|----------|------------|
| plan | string | Yes | Approved implementation plan |
| target_files | array | No | Specific files to modify |
| constraints | object | No | Additional constraints |

### Input Validation

BEFORE execution, verify:
- [ ] Plan is provided and approved
- [ ] Target files exist (if specified)
- [ ] Constraints are clear

**If ANY validation fails: STOP, return error with details.**

---

## Output Contract

| Output | Type | Description |
|--------|------|-------------|
| files_changed | array | List of modified files with descriptions |
| verification | object | Typecheck/lint/test results |
| notes | array | Decisions made, blockers encountered |

---

## Quality Gate

Before returning output, ALL must be true:

- [ ] All planned changes implemented
- [ ] Verification passes (typecheck, lint)
- [ ] No unintended side effects

---

## Token Budget

| Metric | Value |
|--------|-------|
| Target | 500 tokens |
| Maximum | 800 tokens |

---

## Error Handling

| Error Condition | Response |
|-----------------|----------|
| File not found | Report missing file, suggest alternatives |
| Verification fails | Report errors, suggest fixes |
| Blocked by dependency | Report blocker, do not work around |

---

## Execution Logic

1. Review the approved plan/requirements
2. Read existing files to understand patterns
3. Implement changes file by file
4. Run verification after each major change
5. Report completion with summary
```

---

## Tool Configuration

Code writers require write access:

| Agent Purpose | Tools | Notes |
|---------------|-------|-------|
| Feature implementation | `Read, Write, Edit, Bash, Glob, Grep` | Full toolkit |
| Bug fix | `Read, Edit, Bash, Glob, Grep` | Edit preferred over Write |
| Test writing | `Read, Write, Edit, Bash, Glob, Grep` | Need Bash for test runs |

---

## Model and effort selection (Opus 4.7)

Code writers are file-creators / refactorers. Per the Model Selection Guide in `shared-agent-template.md`:

| Complexity | Model | Effort |
|------------|-------|--------|
| Simple fixes, typos | `sonnet` | `medium` |
| Feature implementation | `opus` | `xhigh` |
| Complex refactoring with safety | `opus` | `high` (don't use `max` — overthinks structured output) |

**Frontmatter**: code writers SHOULD set both `model` and `effort` explicitly. Do not rely on session inheritance for irreversible-write agents.

**Deprecated APIs (cause 400 error on Opus 4.7)**: do not use `temperature`, `top_p`, `top_k`, or fixed `budget_tokens`.

---

## Output Format Example

```markdown
### Files Changed
- `path/to/file.ts` - [What was added/modified]
- `path/to/new-file.ts` - [New file purpose]

### Verification
- [ ] Typecheck: PASS/FAIL
- [ ] Lint: PASS/FAIL
- [ ] Tests: PASS/FAIL (if run)

### Notes
- [Any deviations from plan]
- [Decisions made during implementation]
- [Blockers encountered]
```

---

## Constraints Section Example

Include these in your agent:

```markdown
## Constraints

- NEVER deviate from approved plan without documenting it
- ALWAYS read a file before editing it
- ALWAYS run typecheck after implementation
- Follow existing code style exactly
- Keep changes focused - no "while I'm here" improvements
- If blocked, report instead of working around
```

---

## Code Quality Section Example

```markdown
## Code Quality

By default, implement changes rather than only suggesting them.

- Use TypeScript strict mode patterns
- Follow existing naming conventions
- Add comments only for complex logic
- No magic numbers without constants
- Prefer explicit over implicit
```

---

## HITL Rules Example

For sensitive operations, add human-in-the-loop rules:

```markdown
## HITL Rules

STOP and request approval before:
- Deleting any files: `Are you sure you want to delete {filename}?`
- Modifying configuration files: `.env`, `package.json`, `tsconfig.json`, `Dockerfile`
- Running destructive commands: `npm install` (changes lock file), database migrations
- Accessing files outside project scope: `~/.ssh/`, `/etc/`

If blocked, report: "Blocked by HITL rule: {reason}. Requesting approval for: {action}"
```

---

## Security Notes

Code writers have powerful tools. Consider:
- Adding HITL rules for sensitive areas
- Restricting Bash commands if possible
- Reviewing changes before commit
- Using `acceptEdits` permission mode for trusted automation

---

## Quick Reference

| Aspect | Requirement |
|--------|-------------|
| Location | `agents/` (shared agents) |
| Tools | `Read, Write, Edit, Bash, Glob, Grep` |
| Model | `sonnet` (balanced for implementation) |
| Permission | `acceptEdits` recommended |
| Purpose | Single implementation focus |
| Output | Files changed + verification status |
