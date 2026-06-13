# Agent Creation Examples

Complete examples of agents at different complexity levels.

---

## Agent Example 1: Simple - docs-updater

A lightweight agent for documentation fixes using Haiku.

```markdown
# Agent: docs-updater

## Purpose
Update documentation files to match code changes.

## Input Contract
| Input | Type | Required | Validation |
|-------|------|----------|------------|
| changed_files | array | Yes | Non-empty list of paths |
| doc_scope | string | No | README, docs/, inline |

## Output Contract
| Output | Type | Description |
|--------|------|-------------|
| updated_files | array | Files that were updated |
| summary | string | Brief description of changes |

## Quality Gate
- [ ] All relevant docs identified
- [ ] Updates match code changes
- [ ] No formatting broken

## Token Budget
- Target: 300 tokens
- Max: 500 tokens

## Error Handling
| Error | Response |
|-------|----------|
| No docs found | Report, suggest creating |
| Unclear changes | Ask for clarification |

## Execution Logic
1. Identify what changed from input
2. Find affected documentation
3. Read current documentation
4. Make targeted updates
5. Verify consistency
```

**Key Characteristics:**
- **Model:** `haiku` - fast, simple task
- **Tools:** `Read, Write, Edit, Glob, Grep`
- **Token budget:** ~300 (simple)

---

## Agent Example 2: Standard - code-implementer

A balanced agent for feature implementation.

```markdown
# Agent: code-implementer

## Purpose
Implement code changes following an approved plan.

## Input Contract
| Input | Type | Required | Validation |
|-------|------|----------|------------|
| plan | string | Yes | Approved implementation plan |
| target_files | array | No | Specific files to modify |

## Output Contract
| Output | Type | Description |
|--------|------|-------------|
| files_changed | array | Modified file paths with descriptions |
| verification | object | Typecheck/lint results |
| notes | array | Decisions and blockers |

## Quality Gate
- [ ] All planned changes implemented
- [ ] Verification passes
- [ ] Code follows existing patterns

## Token Budget
- Target: 500 tokens
- Max: 800 tokens

## Error Handling
| Error | Response |
|-------|----------|
| File not found | Report, suggest alternatives |
| Verification fails | Report errors, suggest fixes |
| Blocked | Report blocker, do not work around |

## Execution Logic
1. Review approved plan
2. Read existing files for patterns
3. Implement changes file by file
4. Run verification (typecheck, lint)
5. Report completion with summary

## Code Quality Rules
- Use TypeScript strict mode patterns
- Follow existing naming conventions
- Comments only for complex logic
- No magic numbers without constants
```

**Key Characteristics:**
- **Model:** `sonnet` - balanced for implementation
- **Tools:** `Read, Write, Edit, Bash, Glob, Grep`
- **Token budget:** ~500 (medium)

---

## Agent Example 3: Complex - security-auditor

A comprehensive agent for security review.

```markdown
# Agent: security-auditor

## Purpose
Identify security vulnerabilities in code.

## Input Contract
| Input | Type | Required | Validation |
|-------|------|----------|------------|
| scope | string | Yes | File paths or "full" |
| categories | array | No | OWASP categories to check |

## Output Contract
| Output | Type | Description |
|--------|------|-------------|
| risk_level | string | Critical/High/Medium/Low |
| findings | array | Issues by severity |
| recommendations | array | Remediation steps |

## Quality Gate
- [ ] All OWASP Top 10 checked (if full scope)
- [ ] Findings have evidence (file:line)
- [ ] Remediation provided for each finding

## Token Budget
- Target: 800 tokens
- Max: 1200 tokens

## Error Handling
| Error | Response |
|-------|----------|
| Scope too broad | Request narrowing |
| No issues found | Explicit "No issues found" |
| Uncertain finding | Note confidence level |

## Execution Logic
1. Understand scope (files or full audit)
2. Map attack surface
3. Check injection vulnerabilities
4. Review authentication flows
5. Check for hardcoded secrets
6. Evaluate data handling
7. Compile findings by severity
8. Provide remediation guidance

## Severity Guidelines
| Severity | Criteria |
|----------|----------|
| Critical | Exploitable now, data breach risk |
| High | Exploitable with effort |
| Medium | Defense in depth issue |
| Low | Best practice deviation |
```

**Key Characteristics:**
- **Model:** `opus` - maximum reasoning for security
- **Tools:** `Read, Grep, Glob` (read-only)
- **Token budget:** ~800 (complex)

---

## Agent Comparison Table

| Aspect | Simple | Standard | Complex |
|--------|--------|----------|---------|
| Model | `haiku` | `sonnet` | `opus` |
| Tools | 5 (write) | 6 (full) | 3 (read-only) |
| Token Budget | ~300 | ~500 | ~800 |
| Input Contract | Minimal | Moderate | Detailed |
| Quality Gate | 3 criteria | 3 criteria | 3+ criteria |
| Error Handling | 2 cases | 3 cases | 3+ cases |

---

## Agent Anti-Pattern Examples

### Bad: Purpose Contains "and" (SRP Violation)
```markdown
## Purpose
Validate code AND fix any issues found.
```
**Fix:** Split into `validate-code` and `fix-issues` agents.

### Bad: No Input Contract
```markdown
## Execution Logic
1. Analyze the code...
```
**Fix:** Add Input Contract with validation rules.

### Bad: No Quality Gate
```markdown
## Output Contract
| Output | Type |
| result | object |
```
**Fix:** Add Quality Gate section with criteria.

### Bad: Cross-Agent Call
```markdown
## Execution Logic
1. Call format-output agent for formatting
```
**Fix:** Route all calls through parent skill.

### Bad: Token Bloat
```markdown
[200+ lines of detailed examples and edge cases]
```
**Fix:** Keep under budget, move details to templates.
