# Questionnaire Template

Standard format for requirements gathering questionnaires.

---

## Single Question Format

```markdown
### [N]. [Topic Name]

**Question:** [Clear, specific question ending with ?]

| Option | Description | Rec |
|--------|-------------|-----|
| A) [Label] | [One sentence explaining this option] | |
| B) [Label] | [One sentence explaining this option] | **✓** |
| C) [Label] | [One sentence explaining this option] | |
| D) Other | [User provides custom input] | |

**Why [B] is recommended:** [One sentence with objective rationale]
```

---

## Multi-Select Question Format

```markdown
### [N]. [Topic Name]

**Question:** [Clear question] (Select all that apply)

| Option | Description | Common |
|--------|-------------|--------|
| [ ] [Label] | [What this means] | **✓** |
| [ ] [Label] | [What this means] | |
| [ ] [Label] | [What this means] | **✓** |
| [ ] [Label] | [What this means] | |

**Common selections:** [A] and [C] cover most use cases.
```

---

## Full Questionnaire Template

```markdown
## [Operation] Requirements Questionnaire

**Assessed Complexity:** [Simple/Medium/Complex]
**Questions:** [N]

---

### 1. [First Topic]

**Question:** [Question text]?

| Option | Description | Rec |
|--------|-------------|-----|
| A) [Option] | [Description] | |
| B) [Option] | [Description] | **✓** |
| C) [Option] | [Description] | |
| D) Other | [Custom input] | |

**Why [B] is recommended:** [Rationale]

**Your answer:** ___

---

### 2. [Second Topic]

**Question:** [Question text]?

| Option | Description | Rec |
|--------|-------------|-----|
| A) [Option] | [Description] | **✓** |
| B) [Option] | [Description] | |
| C) [Option] | [Description] | |
| D) Other | [Custom input] | |

**Why [A] is recommended:** [Rationale]

**Your answer:** ___

---

[Continue for all questions...]

---

## Requirements Summary

| Question | Your Answer | Recommended | Override? |
|----------|-------------|-------------|-----------|
| 1. [Topic] | [Answer] | [Rec] | Yes/No |
| 2. [Topic] | [Answer] | [Rec] | Yes/No |
| ... | ... | ... | ... |

### Custom Inputs

[If any "Other" answers, document details here]

### Confirmed Requirements

- [Key requirement 1]
- [Key requirement 2]
- [Key requirement 3]

**Ready to proceed:** Yes / No (reason)
```

---

## Example: Completed Skill Creation Questionnaire

```markdown
## Skill Creation Requirements Questionnaire

**Assessed Complexity:** Medium
**Questions:** 6

---

### 1. Problem Definition

**Question:** What problem does this skill solve?

| Option | Description | Rec |
|--------|-------------|-----|
| A) Repetitive task | Same steps repeated across conversations | **✓** |
| B) Complex workflow | Multi-step process needing standardization | |
| C) Knowledge capture | Documenting domain expertise | |
| D) Other | [Custom input] | |

**Why A is recommended:** Most successful skills automate frequently repeated tasks.

**Your answer:** A

---

### 2. Trigger Strategy

**Question:** How should this skill be activated?

| Option | Description | Rec |
|--------|-------------|-----|
| A) Explicit only | User must say "use [skill-name]" | |
| B) Auto-discovery | Triggers on keywords automatically | |
| C) Both | Can be invoked explicitly or discovered | **✓** |

**Why C is recommended:** Maximum flexibility - users can invoke directly or let it trigger naturally.

**Your answer:** C

---

### 3. Complexity Level

**Question:** How complex is the workflow?

| Option | Description | Structure | Rec |
|--------|-------------|-----------|-----|
| A) Simple | 2-3 steps, single output | SKILL.md + 1 agent | |
| B) Medium | 4-6 steps, templated output | + templates/ | **✓** |
| C) Complex | 7+ steps, validation needed | + validation/, guides/ | |

**Why B is recommended:** Start medium, scale up if needed. Avoids over-engineering.

**Your answer:** B

---

### 4. Tool Requirements

**Question:** What tools will this skill need? (Select all that apply)

| Tool | Use Case | Risk |
|------|----------|------|
| [x] Read | Reading files | Low |
| [x] Write | Creating files | Medium |
| [x] Edit | Modifying files | Medium |
| [ ] Bash | Running commands | High |
| [ ] WebFetch | HTTP requests | Medium |
| [ ] MCP tools | External integrations | Varies |

**Recommended:** Start with minimum required tools.

**Your answer:** Read, Write, Edit

---

### 5. Output Format

**Question:** What output format does this skill produce?

| Option | Description | Rec |
|--------|-------------|-----|
| A) Plain text | Simple text output | |
| B) Markdown | Formatted markdown document | **✓** |
| C) Code | Source code files | |
| D) Mixed | Combination of formats | |

**Why B is recommended:** Markdown provides good formatting with wide compatibility.

**Your answer:** B

---

### 6. Error Handling

**Question:** How should errors be handled?

| Option | Description | Rec |
|--------|-------------|-----|
| A) Fail fast | Stop immediately on error | |
| B) Graceful | Report error, continue if possible | **✓** |
| C) Retry | Automatic retry with backoff | |
| D) Ask user | Prompt user for decision | |

**Why B is recommended:** Graceful handling provides best user experience.

**Your answer:** B

---

## Requirements Summary

| Question | Your Answer | Recommended | Override? |
|----------|-------------|-------------|-----------|
| 1. Problem | A) Repetitive task | A | No |
| 2. Trigger | C) Both | B | Yes |
| 3. Complexity | B) Medium | B | No |
| 4. Tools | Read, Write, Edit | Minimum | No |
| 5. Output | B) Markdown | B | No |
| 6. Errors | B) Graceful | B | No |

### Custom Inputs

None

### Confirmed Requirements

- Automate repetitive task
- Support both explicit and auto-discovery triggers
- Medium complexity (4-6 steps)
- Tools: Read, Write, Edit
- Output format: Markdown
- Graceful error handling

**Ready to proceed:** Yes
```

---

## Writing Good Questions

### Do:
- End with question mark
- Use clear, simple language
- Provide 2-4 distinct options
- Include "Other" for custom input
- Give one-sentence descriptions
- Mark exactly one recommendation
- Explain rationale objectively

### Don't:
- Ask leading questions
- Use jargon without explanation
- Provide overlapping options
- Skip the recommendation
- Write multi-sentence descriptions
- Include more than 4 main options

---

## Writing Good Recommendations

### Good Rationale Examples:
- "Most skills are created to automate repetitive tasks."
- "Both explicit and auto-discovery provides maximum flexibility."
- "Smaller changes are safer and faster to validate."
- "Starting simple allows scaling up without rework."

### Bad Rationale Examples:
- "This is the best option." (no explanation)
- "I prefer this one." (subjective)
- "Trust me on this." (not helpful)
- "It depends." (not a recommendation)
