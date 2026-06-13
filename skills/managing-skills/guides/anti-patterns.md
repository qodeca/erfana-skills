# Anti-Patterns Guide

Common mistakes to avoid when creating and managing skills.

---

## Architectural Anti-Patterns (CRITICAL)

These violations cause automatic failure in validation.

### 1. Referencing Other Skills

**Bad:**
```markdown
For advanced processing, see `processing-documents` skill.
Use capabilities from `utility-skill`.
```

**Good:**
```markdown
For advanced processing, delegate to `advanced-processor` (shared agent).
All functionality is handled by builtin or shared agents.
```

**Why:** Skills must be self-contained. External references create dependencies that break isolation.

---

### 2. Using Agents from Unknown Sources

**Bad:**
```markdown
Delegate to: `/random/path/agent.md`
Use: `other-skill/agents/helper.md`
Delegate to: `agents/validate-input.md`
```

**Good:**
```markdown
Delegate to: `Explore` (builtin)
Delegate to: `research-agent` (shared: agents/research-agent.md)
```

**Why:** Agents must come from known sources: builtin (Claude Code) or shared (agents/). Skills do not have their own `agents/` directories.

---

### 3. No agents (any source)

**Bad:** `## Agents` section with no agents defined.

**Good:** Agents table with at least one builtin or shared agent, including Source column.

**Why:** The orchestrator pattern requires delegation – skills need at least one agent.

---

### 4. Executing Directly Instead of Delegating

**Bad:**
```markdown
### Step 2: Validate Input

Check the input file:
1. Read the file
2. Parse the content
3. Validate structure
```

**Good:**
```markdown
### Step 2: Validate Input

#### Execution
Delegate to: `validate-input` (shared: agents/validate-input.md)
Task: Validate input file structure
```

**Why:** Skills orchestrate, agents execute. Direct execution violates separation of concerns.

---

### 5. Missing step structure

**Bad:** Workflow step with prose description only, no input conditions or validation.

**Good:** Every step has: Input Conditions (checkboxes), Pre-Step Validation (STOP if), Execution (delegate to agent), Post-Step Validation, Quality Gate (retry/escalate).

**Why:** Consistent structure ensures reliability and enables proper validation.

---

## Content Anti-Patterns

### 6. First-Person Descriptions

**Bad:**
```yaml
description: I can help you format JSON files and make them pretty.
```

**Good:**
```yaml
description: Format JSON files with consistent indentation. Use when formatting, pretty printing, or cleaning up JSON.
```

**Why:** Descriptions should be objective and include triggers for discovery.

---

### 7. Vague Triggers

**Bad:**
```markdown
## When This Skill Applies

Use this skill when you need help with files.
```

**Good:**
```markdown
## When This Skill Applies

Activate when user:
- Asks to "format JSON" or "pretty print"
- Mentions JSON formatting or cleanup
- Has malformed JSON that needs fixing
```

**Why:** Specific triggers enable auto-discovery and clear user expectations.

---

### 8. No Examples

**Bad:**
```markdown
## Examples

(See workflow above)
```

**Good:**
```markdown
## Examples

### Example 1: Format Inline JSON

**User says:** "Format this: {"a":1}"

**Skill does:**
1. Creates todo list
2. Validates JSON
3. Formats with indentation

**Output:**
{
  "a": 1
}
```

**Why:** Examples demonstrate expected behavior and help users understand the skill.

---

### 9. Missing Anti-Patterns Section

**Bad:**
```markdown
## Workflow
...
(end of file)
```

**Good:**
```markdown
## Anti-Patterns

- Do not use this skill for XML (use formatting-xml instead)
- Do not provide invalid JSON without error handling
- Do not expect schema validation (this is formatting only)
```

**Why:** Anti-patterns prevent misuse and clarify scope.

---

## Structural Anti-Patterns

### 10. SKILL.md Over 500 Lines

**Bad:**
```markdown
# Huge Skill

[520 lines of content...]
```

**Good:**
```markdown
# Focused Skill

[Under 500 lines]

For detailed reference, see `guides/detailed-guide.md`.
```

**Why:** Long files are hard to maintain and consume excessive tokens.

---

### 11. Nested References

**Bad:**
```markdown
SKILL.md → reference.md → deep-reference.md → another.md
```

**Good:**
```markdown
SKILL.md → reference.md (one level only)
```

**Why:** Nested references create complexity and loading issues.

---

### 12. Backslashes in Paths

**Bad:**
```markdown
See `templates\output-format.md`
```

**Good:**
```markdown
See `templates/output-format.md`
```

**Why:** Forward slashes work cross-platform.

---

## Process Anti-Patterns

### 13. Skipping Requirements Gathering

**Bad:**
```
User: Make me a skill
Assistant: [immediately starts creating]
```

**Good:**
```
User: Make me a skill
Assistant: I'll help you create a skill. Let me gather some requirements first...
[presents questionnaire]
```

**Why:** Skipping requirements leads to misaligned skills.

---

### 14. No Todo List

**Bad:**
```
[starts working without tracking]
```

**Good:**
```
TodoWrite([
  {content: "Gather requirements", status: "in_progress"},
  {content: "Design skill", status: "pending"},
  ...
])
```

**Why:** Todo lists ensure nothing is missed and provide visibility.

---

### 15. Skipping Validation

**Bad:**
```
Skill created! Here's your new skill.
[no validation]
```

**Good:**
```
Skill created. Running validation...
Pre-release: 53/55 - PASS
Security: 79/81 - PASS
```

**Why:** Validation catches issues before they cause problems.

---

## Security Anti-Patterns

### 16. Hardcoded Secrets

**Bad:**
```markdown
API_KEY = "sk-abc123..."
```

**Good:**
```markdown
API key should be set via environment variable: `SKILL_API_KEY`
```

**Why:** Secrets in code are security vulnerabilities.

---

### 17. Unsafe Commands

**Bad:**
```markdown
Run: `rm -rf /` to clean up
```

**Good:**
```markdown
Run: `rm -rf ./temp/` to clean temporary files
```

**Why:** Dangerous commands can cause data loss.

---

### 18. Missing Source Column in Agents Table

**Bad:**
```markdown
## Agents

| Agent | Purpose | Used In |
|-------|---------|---------|
| `Explore` | Codebase exploration | Step 1 |
```

**Good:**
```markdown
## Agents

| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| `Explore` | Codebase exploration | builtin | Step 1 |
| `research-agent` | Web research | shared | Step 2 |
```

**Why:** Source column is mandatory to identify where agents come from. Without it, skill cannot properly reference and invoke agents.

---

### 19. Skipping Agent Discovery/Matching

**Bad:**
```
User: Create a skill for researching topics
Assistant: [Immediately creates new agents without checking builtin/shared]
```

**Good:**
```
User: Create a skill for researching topics
Assistant: Let me check available agents first...
- Found: Explore (builtin) - 85% match for codebase research
- Found: research-agent (shared) - 95% match for web research
Which would you like to use, or should I create a new shared agent?
```

**Why:** Skipping agent discovery misses opportunities to reuse existing agents, leading to unnecessary duplication and maintenance burden.

---

### 20. Progressive disclosure violation

**Bad:** Skill loads all guides, templates, and examples into its SKILL.md body, consuming 10%+ of context window.

**Good:** SKILL.md contains only core workflow (~2% of context). Guides are loaded by agents on demand. Templates loaded only during creation.

**Why:** Context is a shared, limited resource. Loading everything upfront wastes tokens and reduces space for user interaction. See `guides/progressive-disclosure.md`.

---

### 21. Unused frontmatter fields

**Bad:**
```yaml
context: fork
memory:
  scope: project
hooks: {}
background: false
```
All CC 2.1 fields specified but none actually used by the skill or its agents.

**Good:** Only include frontmatter fields that affect behavior. Omit fields with default values.

**Why:** Unused fields add noise, increase token consumption, and suggest incomplete implementation.

---

### 22. Unrestricted tool access

**Bad:** Agent with `tools` omitted (inherits ALL tools) or with tools it doesn't need.

**Good:**
```yaml
tools: Read, Grep, Glob  # Only what this agent needs
```

**Why:** Principle of least privilege. Unrestricted access is a security risk – agents may modify files, run commands, or access data beyond their scope.

---

### 23. Missing isolation for destructive operations

**Bad:** Agent that runs `rm`, `git push --force`, or bulk file edits directly on the working tree without branch isolation.

**Good:**
```xml
<isolation-protocol>
1. Create branch: git checkout -b task/{id}
2. Perform destructive operations on branch
3. User reviews and merges manually
</isolation-protocol>
```

**Why:** Destructive operations without isolation can corrupt the user's working state. Branch isolation makes operations reversible.

---

## Quick Reference

| Anti-Pattern | Category | Severity |
|--------------|----------|----------|
| Reference other skills | Architecture | Critical |
| Unknown agent sources | Architecture | Critical |
| No agents (any source) | Architecture | Critical |
| Direct execution | Architecture | Critical |
| Missing Source column | Architecture | Critical |
| Missing step structure | Architecture | High |
| Skip agent discovery | Process | High |
| First-person description | Content | Medium |
| Vague triggers | Content | Medium |
| No examples | Content | Medium |
| Over 500 lines | Structure | High |
| Nested references | Structure | Medium |
| Hardcoded secrets | Security | Critical |
| Progressive disclosure violation | Architecture | High |
| Unused frontmatter fields | Content | Medium |
| Unrestricted tool access | Security | Critical |
| Missing isolation for destructive ops | Security | High |
