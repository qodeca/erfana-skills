# Agent Advanced Patterns

Advanced techniques for agent design: anti-patterns, system prompt writing, and resumption patterns.

**Related:** [Agent Design Guide](./agent-design-guide.md) - Core principles and structure

---

## Anti-Patterns

### Critical (Fail Immediately)

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Task tool in agent | Agents cannot spawn agents | Remove Task, orchestrate in skill |
| AskUserQuestion in agent | Silently filtered, won't work | Gather requirements before delegation |
| No trigger phrase in description | Won't auto-delegate | Add "MUST BE USED" or "Use PROACTIVELY" |
| Omitting `tools` field | Inherits ALL tools (security risk) | Explicitly list required tools |

### High Priority

| Category | Anti-Pattern | Problem | Fix |
|----------|--------------|---------|-----|
| Design | Multi-purpose agent | Violates SRP | Split into focused agents |
| Design | No input validation | Garbage in, garbage out | Add input contract |
| Design | No quality gate | Unreliable outputs | Add output validation |
| Design | Cross-agent calls | Breaks isolation | Route through skill |
| Design | Vague purpose | Hard to test/validate | Define single responsibility |
| Design | No `<critical_thinking>` | Rigid behavior | Add alternatives, edge cases, adapt |
| Performance | Token bloat | Slow, expensive | Optimize prompts |
| Naming | `helper`, `processor` | Too vague/generic | `validate-syntax`, `extract-metadata` |
| Naming | `agent1`, `doStuff` | Non-descriptive | `format-output`, `analyze-workflow` |

---

## System Prompt Writing

### Template Structure

```markdown
# Role
[ROLE] specialized in [DOMAIN]. Mission: [OUTCOME].

## Workflow
1. [step] 2. [step] 3. [verification]

## Output Contract
Return: [exact format specification]

## Constraints
- NEVER [anti-pattern]
- ALWAYS [required behavior]
```

### Optimizations

```markdown
# Action-default (for implementers)
By default, implement rather than suggest.

# Conservative (for explorers)
Provide recommendations, not implementations.

# Parallel tools
Make independent tool calls in parallel.

# Anti-hallucination
MUST read files before answering about code.
```

### Security Considerations

**Secrets:**
- NEVER include API keys, tokens, or passwords in prompts
- Use environment variable references: `$API_KEY` not actual values
- No internal URLs, endpoints, or connection strings
- Test: "Could this prompt be in a public GitHub repo?"

**Input Handling:**
- If agent processes user input, validate before use
- Separate instructions from user data clearly
- Use constraints to prevent command injection

**File Access:**
- Restrict to expected directories only
- Document any sensitive file access in HITL rules
- Prefer relative paths within project scope

### Prompt Engineering Principles

#### Core Principles

1. **Structure over length**
   - 50 well-structured tokens > 500 rambling tokens
   - Use sections, lists, and tables for clarity
   - Clear hierarchy helps model follow instructions

2. **Emphasis keywords**
   - `IMPORTANT`, `CRITICAL` - high attention
   - `NEVER`, `ALWAYS` - hard constraints
   - `MUST`, `MUST NOT` - non-negotiable rules
   - `PREFER`, `AVOID` - soft guidance

3. **Token efficiency**
   - Remove filler words ("please", "kindly", "make sure to")
   - Use shorthand when unambiguous
   - Reference patterns instead of repeating

4. **Tool-specific examples**
   - Show exact tool usage: `Read src/file.ts` → result
   - Include realistic outputs agents will see
   - Demonstrate tool chaining patterns

#### Emphasis Placement

| Position | Effect | Use For |
|----------|--------|---------|
| Start of prompt | Highest attention | Critical constraints |
| Section headers | High attention | Key behaviors |
| Before examples | Medium attention | Specific guidance |
| End of prompt | Recency effect | Final reminders |

#### Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Vague task | Model guesses intent | Single specific sentence |
| No output format | Inconsistent results | Exact structure specification |
| Missing constraints | Unwanted behaviors | NEVER/ALWAYS rules |
| Wall of text | Key points lost | Structured sections |
| Over-specification | Token waste | Trust model defaults |
| Contradictory rules | Confusion | Review for conflicts |

#### Good vs Bad Examples

**Bad:**
```
Please help the user by analyzing their code and providing helpful suggestions
for how they might improve it. Make sure to be thorough but also concise.
```

**Good:**
```
# Role
Code reviewer for [language] projects.

# Task
Analyze provided code for: bugs, performance, readability.

# Output
Return findings as:
- CRITICAL: [blocking issues]
- SUGGEST: [improvements]
- GOOD: [positive patterns found]

# Constraints
- NEVER suggest changes without reading the code first
- ALWAYS cite line numbers for findings
```

#### Effective Constraint Writing

**Format:** `[KEYWORD]: [specific behavior] [context]`

```markdown
# Effective constraints
NEVER modify files outside the project directory.
ALWAYS read existing code before suggesting changes.
MUST validate inputs before processing.
PREFER Edit tool over Write for existing files.

# Ineffective constraints
Don't do bad things.  (too vague)
Be careful.  (not actionable)
Try to avoid errors.  (not a constraint)
```

### Length Guidelines

- **Target:** Under 100 lines
- **Maximum:** 150 lines
- **If exceeding:** Split into focused sub-sections or move details to templates

### Quick Reference

**Core principles:**
1. Structure over length - use XML tags, tables, lists
2. Emphasis keywords - NEVER, ALWAYS, MUST for hard constraints
3. Token efficiency - remove filler, use shorthand
4. Tool-specific examples - show exact usage patterns

**Length targets:**
- Simple agents: <100 lines
- Complex agents: <150 lines
- If exceeding: Split into sub-sections or reference templates

---

## Agent Resumption

Agents can be resumed using their `agentId` for follow-up work or long-running workflows.

### How Resumption Works

When you launch an agent via the Task tool, it returns an `agentId` upon completion. This ID can be passed to the `resume` parameter in subsequent Task tool calls to continue the agent with its full context preserved.

```markdown
# First invocation
Task(prompt: "Analyze codebase structure", subagent_type: "Explore")
→ Returns: agentId: "abc123", result: {...}

# Follow-up using resumption
Task(resume: "abc123", prompt: "Now focus on the auth module you found")
→ Agent continues with full context from first invocation
```

### When to Design for Resumption

| Scenario | Use Resumption | Rationale |
|----------|----------------|-----------|
| Long-running validation | Yes | Can checkpoint progress, resume on failure |
| Multi-phase research | Yes | Build on findings across phases |
| Incremental code generation | Yes | Context accumulates across iterations |
| One-shot validation | No | Complete in single invocation |
| Stateless formatting | No | No context to preserve |

### Designing Resumable Workflows

#### 1. Checkpoint-Based Design

Structure workflows to produce checkpoints that can be resumed from:

```markdown
## Workflow with Checkpoints

Step 1: Gather (checkpoint: requirements_gathered)
  - Collect inputs
  - Output: requirements object
  - ✅ Checkpoint: Can resume from here with requirements

Step 2: Validate (checkpoint: validation_complete)
  - Validate requirements
  - Output: validated requirements
  - ✅ Checkpoint: Can resume from here with validated data

Step 3: Execute (checkpoint: execution_complete)
  - Perform main operation
  - Output: results
  - ✅ Checkpoint: Can resume for refinement
```

#### 2. Context Accumulation

For agents that build context over time:

```markdown
## Output Contract (Resumable)

| Output | Type | Description |
|--------|------|-------------|
| findings | array | Accumulated findings (append on resume) |
| context | object | Preserved context for resumption |
| checkpoint | string | Current checkpoint identifier |
| resume_hint | string | Suggested prompt for follow-up |
```

#### 3. Resume Hints

Include guidance for effective resumption:

```markdown
## Resume Hints

After completion, provide:
- What was accomplished
- What remains to explore
- Suggested follow-up prompt

Example output:
{
  "result": {...},
  "resume_hint": "Continue with: 'Deep dive into the auth module patterns found in src/auth/'"
}
```

### Skill-Level Resumption Patterns

For skills that orchestrate long workflows:

#### Pattern 1: Agent Chain with Checkpoints

```
Step 1 → Agent A (checkpoint) → Step 2 → Agent B (checkpoint) → Step 3
                 ↓                              ↓
           Can resume here              Can resume here
```

#### Pattern 2: Iterative Refinement

```
Agent invocation 1: Initial analysis
       ↓ (agentId preserved)
Agent invocation 2: Refine based on feedback
       ↓ (agentId preserved)
Agent invocation 3: Finalize
```

### When NOT to use resumption

- **Stateless operations**: Validation, formatting, simple transforms
- **Quick tasks**: <30 second execution time
- **Independent iterations**: Each run should be fresh
- **Security-sensitive**: When context shouldn't persist

### Best Practices

1. **Store agentId** when workflow may need continuation
2. **Document checkpoints** in workflow design
3. **Include resume hints** in agent output contracts
4. **Test resumption paths** for critical workflows
5. **Clean up** old agent contexts when workflow completes

### Quick Reference

**Use resumption for:**
- Multi-phase research and analysis
- Long-running validation with checkpoints
- Incremental code generation
- Iterative refinement workflows

**Skip resumption for:**
- Stateless operations (validation, formatting)
- Quick tasks (<30 seconds)
- Security-sensitive contexts

---

## See Also

- **[Agent Design Guide](./agent-design-guide.md)** - Core principles and structure
- **[Agent Configuration Guide](./agent-configuration.md)** - YAML frontmatter and tool configuration
- **[Agent Implementation Patterns](./agent-implementation-patterns.md)** - Tool patterns, optimization, testing, and migration
- **Agent Templates** (`templates/` directory) - Ready-to-use templates for common patterns
