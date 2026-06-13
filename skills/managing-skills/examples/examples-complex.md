# Example 3: Complex Skill - `generating-tests`

A full-featured skill with 3 phases and 4 agents.

## Final Structure

```
generating-tests/
├── SKILL.md
├── templates/
│   └── test-file.md
└── validation/
    └── test-checklist.md
```

**Note:** Skills do NOT contain `agents/` directories. All agents come from:
- **builtin:** Claude Code agents (Explore, Plan, etc.)
- **shared:** User agents at `agents/`

For this skill, we use four shared agents:
- `agents/analyze-code.md`
- `agents/generate-tests.md`
- `agents/validate-tests.md`
- `agents/format-output.md`

## SKILL.md Content

```markdown
---
name: generating-tests
description: Generate unit tests for code. Analyzes functions, creates test cases, and validates test quality. Use when user asks to generate tests, create test cases, or wants test coverage for code.
---

# Generating Tests

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
| `analyze-code` | Analyze code structure | shared | Phase 1 |
| `generate-tests` | Generate test cases | shared | Phase 2 |
| `validate-tests` | Validate test quality | shared | Phase 2 |
| `format-output` | Format final test file | shared | Phase 3 |

## Todo List Requirements

**MANDATORY - No exceptions**

### At Workflow Start
```
1. Create todo list with ALL phases and steps
2. Include: P1.1, P1.2, P2.1, P2.2, P3.1, P3.2
3. Mark P1.1 as in_progress
```

### For EVERY Step
```
1. Mark step in_progress BEFORE starting
2. Execute with agent delegation
3. Validate output against quality gate
4. Mark complete IMMEDIATELY after gate passes
```

---

## Prerequisites

Before using this skill, ensure:
- [ ] Target code is accessible
- [ ] Testing framework preference known (or default to language standard)

---

## When This Skill Applies

Activate when user:
- Asks to "generate tests" or "create tests"
- Wants "unit tests" or "test cases"
- Mentions "test coverage" for specific code

---

## Workflow

### Phase 1: Analysis

#### Step 1.1: Validate Input

##### Input Conditions
- [ ] Code provided (file or content)
- [ ] Code is parseable

##### Pre-Step Validation
STOP if code not provided. Ask user.

##### Execution
Read code, identify language and structure.

##### Post-Step Validation
- [ ] Language identified
- [ ] Code readable

##### Quality Gate
If unparseable: report error, STOP.

---

#### Step 1.2: Analyze Structure

##### Input Conditions
- [ ] Step 1.1 completed
- [ ] Language known

##### Pre-Step Validation
STOP if language unknown.

##### Execution
Delegate to: `analyze-code` (shared: agents/analyze-code.md)
Task: Extract functions, parameters, return types

##### Post-Step Validation
- [ ] Functions identified
- [ ] Parameters documented
- [ ] Return types known (or inferred)

##### Quality Gate
If no functions found: report, STOP.
If analysis incomplete: retry (max 3).

---

### Phase 2: Generation

#### Step 2.1: Generate Tests

##### Input Conditions
- [ ] Phase 1 completed
- [ ] Function list available
- [ ] Testing framework known

##### Pre-Step Validation
STOP if analysis not complete.

##### Execution
Delegate to: `generate-tests` (shared: agents/generate-tests.md)
Task: Create test cases for each function

##### Post-Step Validation
- [ ] Tests generated for each function
- [ ] Edge cases included
- [ ] Assertions present

##### Quality Gate
If tests missing for functions: retry (max 3).
After 3 failures: escalate to user.

---

#### Step 2.2: Validate Tests

##### Input Conditions
- [ ] Step 2.1 completed
- [ ] Generated tests available

##### Pre-Step Validation
STOP if tests not generated.

##### Execution
Delegate to: `validate-tests` (shared: agents/validate-tests.md)
Task: Check test quality against `validation/test-checklist.md`

##### Post-Step Validation
- [ ] All tests syntactically valid
- [ ] Coverage criteria met
- [ ] No duplicate tests

##### Quality Gate
If validation fails: return to Step 2.1 with feedback.
Max 3 cycles, then escalate.

---

### Phase 3: Output

#### Step 3.1: Format Tests

##### Input Conditions
- [ ] Phase 2 completed
- [ ] Tests validated

##### Pre-Step Validation
STOP if validation incomplete.

##### Execution
Delegate to: `format-output` (shared: agents/format-output.md)
Task: Format using `templates/test-file.md`

##### Post-Step Validation
- [ ] Output follows template
- [ ] Imports included
- [ ] File structure correct

##### Quality Gate
If format wrong: retry (max 3).

---

#### Step 3.2: Deliver Tests

##### Input Conditions
- [ ] Step 3.1 completed
- [ ] Formatted file ready

##### Execution
Present to user with:
- Test file content
- Coverage summary
- Run instructions

##### Post-Step Validation
- [ ] User received tests
- [ ] Todo list complete

##### Quality Gate
Final verification complete.

---

## Examples

### Example: Generate Tests for Calculator

**User says:** "Generate tests for my calculator.py"

**Skill does:**
1. Creates todo [P1.1, P1.2, P2.1, P2.2, P3.1, P3.2]
2. Phase 1: Validates, Analyzes (finds add, subtract, multiply, divide)
3. Phase 2: Generates tests, Validates quality
4. Phase 3: Formats, Delivers

**Output:**
```python
import pytest
from calculator import add, subtract, multiply, divide

class TestAdd:
    def test_positive_numbers(self):
        assert add(2, 3) == 5

    def test_negative_numbers(self):
        assert add(-1, -1) == -2

    def test_zero(self):
        assert add(0, 5) == 5

class TestDivide:
    def test_normal_division(self):
        assert divide(10, 2) == 5

    def test_division_by_zero(self):
        with pytest.raises(ZeroDivisionError):
            divide(10, 0)
```

---

## Error Handling

| Error | Phase | Response |
|-------|-------|----------|
| Code not provided | 1 | Ask for code, STOP |
| Unparseable code | 1 | Report error, STOP |
| No functions found | 1 | Report, STOP |
| Tests incomplete | 2 | Retry (max 3), escalate |
| Format error | 3 | Retry (max 3), escalate |

---

## Anti-Patterns

### Architectural (CRITICAL)
- Referencing other skills
- Using agents from unknown sources (not builtin/shared)
- Putting agents inside skill directories (`skill-name/agents/`)
- Generating tests directly without agent delegation
- Skipping code analysis
- No quality validation of tests
- Missing todo tracking
- Missing Source column in agents table

### Workflow
- Generating tests without understanding code
- No edge case coverage
- Missing assertions
- Untested error handling
```

---

## Key Differences: Non-Compliant vs Compliant

| Aspect | Non-Compliant | Compliant |
|--------|---------------|-----------|
| Architecture | Skill executes directly | Skill delegates to agents |
| Agents | None or local to skill | Builtin or shared (`agents/`) |
| Input Conditions | None or implicit | Explicit with STOP |
| Validation | Post-execution only | Pre AND post-step |
| Quality Gates | None | Every step with retry |
| Todo Lists | Optional | MANDATORY |
| Guardrails | Suggestions | BLOCKING language |
| Agent Source | Not specified | Source column required |

## Common Patterns in All Examples

1. **Critical Rules section** - At top, states architectural requirements
2. **Agents table with Source** - Lists all agents with source (builtin/shared)
3. **Todo List Requirements** - MANDATORY section with explicit rules
4. **Input Conditions** - Every step with checkbox format
5. **Pre-Step Validation** - "STOP if" language
6. **Post-Step Validation** - Checkbox criteria
7. **Quality Gate** - Retry logic (max 3) and escalation
8. **Anti-Patterns** - Architectural violations listed first

---

## Shared Agents

These agents must be created at `agents/`, not inside the skill directory.

| Agent | Location | Purpose |
|-------|----------|---------|
| `analyze-code` | `agents/analyze-code.md` | Analyze code structure |
| `generate-tests` | `agents/generate-tests.md` | Generate test cases |
| `validate-tests` | `agents/validate-tests.md` | Validate test quality |
| `format-output` | `agents/format-output.md` | Format output files |

---

## See Also

- [Agent Creation Examples](examples-creating-agents.md) - Detailed examples of creating simple, standard, and complex agents
