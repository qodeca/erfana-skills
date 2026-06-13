# Example 2: Medium Skill - `reviewing-code`

A skill with multiple agents and phased workflow.

## Final Structure

```
reviewing-code/
├── SKILL.md
└── templates/
    └── review-report.md
```

**Note:** Skills do NOT contain `agents/` directories. All agents come from:
- **builtin:** Claude Code agents (Explore, Plan, etc.)
- **shared:** User agents at `agents/`

For this skill, we use two shared agents:
- `agents/analyze-code.md`
- `agents/format-report.md`

## SKILL.md Content

```markdown
---
name: reviewing-code
description: Review code for quality issues, bugs, and best practices. Analyzes code structure, identifies problems, and provides actionable feedback. Use when user asks for code review, quality check, or wants feedback on code.
---

# Reviewing Code

## Critical Rules

This skill follows orchestrator architecture:
- Delegates ALL tasks to agents (builtin or shared)
- EVERY step has input conditions (BLOCKING)
- EVERY step has post-step validation
- Quality gates MUST pass (max 3 retries, then escalate)
- Todo lists ALWAYS created and maintained
- MUST NOT reference other skills

## Agents

| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| `analyze-code` | Analyze code for issues | shared | Phase 1 |
| `format-report` | Format review as report | shared | Phase 2 |

## Todo List Requirements

**MANDATORY - No exceptions**

### At Workflow Start
```
1. Create todo list with ALL steps
2. Mark Phase 1, Step 1 as in_progress
```

### For EVERY Step
```
1. Mark step in_progress BEFORE starting
2. Execute with agent delegation
3. Validate output against quality gate
4. Mark complete IMMEDIATELY after gate passes
```

---

## When This Skill Applies

Activate when user:
- Asks to "review this code" or "check my code"
- Wants "feedback" on code quality
- Mentions "code review" or "quality check"

---

## Workflow

### Phase 1: Analysis

#### Step 1.1: Validate Input

##### Input Conditions
- [ ] Code provided (file path or content)
- [ ] Language identifiable

##### Pre-Step Validation
STOP if code not provided. Ask user for code.

##### Execution
Identify language, validate code is parseable.

##### Post-Step Validation
- [ ] Language identified
- [ ] Code accessible/readable

##### Quality Gate
If language unknown: ask user to specify.
If code unreadable: report error, STOP.

---

#### Step 1.2: Analyze Code

##### Input Conditions
- [ ] Step 1.1 completed
- [ ] Code validated
- [ ] Language known

##### Pre-Step Validation
STOP if ANY condition unchecked.

##### Execution
Delegate to: `analyze-code` (shared: agents/analyze-code.md)
Task: Identify issues, bugs, improvements

##### Post-Step Validation
- [ ] Issues list generated
- [ ] Each issue has: location, severity, description
- [ ] At least 1 finding (or explicit "no issues")

##### Quality Gate
If analysis incomplete: retry (max 3).
After 3 failures: escalate to user with partial results.

---

### Phase 2: Reporting

#### Step 2.1: Format Report

##### Input Conditions
- [ ] Phase 1 completed
- [ ] Issues list available

##### Pre-Step Validation
STOP if analysis not complete.

##### Execution
Delegate to: `format-report` (shared: agents/format-report.md)
Task: Format using `templates/review-report.md`

##### Post-Step Validation
- [ ] Report follows template structure
- [ ] All issues included
- [ ] Severity levels indicated

##### Quality Gate
If format incorrect: retry (max 3).

---

#### Step 2.2: Deliver Report

##### Input Conditions
- [ ] Step 2.1 completed
- [ ] Formatted report ready

##### Execution
Present report to user with:
- Summary of findings
- Issue count by severity
- Recommended actions

##### Post-Step Validation
- [ ] User received report
- [ ] Todo list shows all complete

##### Quality Gate
Final verification complete.

---

## Examples

### Example: Review Python Function

**User says:** "Review this code: def add(a, b): return a + b"

**Skill does:**
1. Creates todo [1.1 Validate, 1.2 Analyze, 2.1 Format, 2.2 Deliver]
2. Phase 1: Validates (Python), Analyzes (missing type hints, no docstring)
3. Phase 2: Formats report, Delivers

**Output:**
```
## Code Review Report

**Language:** Python
**Lines:** 1
**Issues Found:** 2

### Issues

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 1 | Low | Line 1 | Missing type hints |
| 2 | Low | Line 1 | Missing docstring |

### Recommendations
- Add type hints: `def add(a: int, b: int) -> int:`
- Add docstring describing function purpose
```

---

## Anti-Patterns

### Architectural (CRITICAL)
- Referencing other skills
- Using agents from unknown sources (not builtin/shared)
- Putting agents inside skill directories (`skill-name/agents/`)
- Executing analysis directly (not through agent)
- Skipping input validation
- No quality gates on analysis
- Missing Source column in agents table

### Workflow
- Reporting without analysis
- Missing severity levels
- No actionable recommendations
```

---

## Shared Agents

These agents must be created at `agents/`, not inside the skill directory.

### analyze-code.md

**Location:** `agents/analyze-code.md`

Analyzes code for quality issues, bugs, and best practice violations.

### format-report.md

**Location:** `agents/format-report.md`

Formats analysis results into structured review reports.

---

## Key Takeaways

1. **Multiple agents:** Medium skills often use 2+ shared agents
2. **Phased workflow:** Organize steps into logical phases
3. **Templates allowed:** Skills can have `templates/` directories for output formatting
4. **No local agents:** All agents come from builtin or shared sources
5. **Source column:** Every agents table must specify the source
