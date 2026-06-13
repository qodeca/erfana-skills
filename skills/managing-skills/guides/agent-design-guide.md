# Agent Design Guide

Design principles for agents following Single Responsibility Principle.

---

## XML Structure (MANDATORY)

**All agents SHOULD use XML tags for structure.** XML tags help Claude parse and follow structured instructions more reliably by providing clear section boundaries.

### Why XML is mandatory

| Benefit | Description |
|---------|-------------|
| **Clarity** | Clear separation of prompt components |
| **Accuracy** | Reduces Claude misinterpreting parts of prompt |
| **Parseability** | Easier to extract and validate agent structure |
| **Performance** | Claude trained on XML, processes it more reliably |

### Required XML tags

Every agent MUST include these 5 tags:

| Tag | Purpose | Content |
|-----|---------|---------|
| `<context>` | Identity | Role, tools, mission statement |
| `<task>` | Objective | Single sentence - WHAT to accomplish |
| `<workflow>` | Process | Numbered steps with tool examples |
| `<constraints>` | Boundaries | NEVER/ALWAYS/MUST rules |
| `<output>` | Format | Exact output specification (JSON preferred) |

### Recommended Additional Tags

| Tag | Purpose | When to Include |
|-----|---------|-----------------|
| `<input_contract>` | Input validation | Always recommended |
| `<critical_thinking>` | Deliberation | Complex agents |
| `<quality_gate>` | Exit criteria | Agents producing outputs |
| `<examples>` | Few-shot patterns | When output format is critical |
| `<bash_constraints>` | Bash command restrictions | When Bash tool is granted |
| `<file_restrictions>` | File operation boundaries | When Write/Edit tools granted |

### Minimal Agent Structure

```xml
<context>
[Role] specialized in [domain].
Tools: [tool list].
Mission: [outcome statement].
</context>

<task>
[Single sentence - WHAT to accomplish]
</task>

<workflow>
1. [Step with tool example]
   `[Tool] [target]` → [result]
2. [Verification step]
   Check: [condition]
3. [Final step]
</workflow>

<constraints>
NEVER:
- [Anti-pattern]: [consequence]

ALWAYS:
- [Required behavior]: [rationale]
</constraints>

<output>
{
  "status": "success" | "error",
  "result": [type]
}
</output>
```

---

## Configuration

For detailed YAML frontmatter configuration (tools, permissions, model selection, etc.), see **[Agent Configuration Guide](./agent-configuration.md)**.

**Quick reference:**
- **Tools**: Explicitly list required tools (omitting inherits ALL - security risk)
- **Permissions**: Default to `default` mode; escalate only when necessary
- **Model**: Use `sonnet` for most cases; `haiku` for speed, `opus` for critical tasks

---

## ⚠️ CRITICAL Limitations

**Agents MUST understand these hard constraints:**

### Agents Cannot Spawn Agents

The Task tool is **unavailable** to subagents. Only the main conversation can delegate to agents.

- ❌ NEVER create "orchestrator" agents that delegate to other agents
- ❌ NEVER include `Task` in agent tools list
- ❌ NEVER design workflows that assume agent-to-agent communication
- ✅ All multi-agent orchestration happens in the main conversation or skill

### Agents Cannot Use AskUserQuestion

The AskUserQuestion tool is **silently filtered out** for agents - it simply won't work.

- ❌ NEVER design agents that ask clarifying questions mid-execution
- ❌ NEVER include `AskUserQuestion` in agent tools list
- ✅ Gather ALL requirements in main conversation BEFORE delegating to agent
- ✅ Pass complete context to agent via task prompt

**Implication:** Agents must be designed to work with the information provided. If an agent might need clarification, the skill's workflow should gather that information first.

### Task(agent_type) Restrictions

When spawning agents via the Agent tool, the `subagent_type` parameter must match either a builtin agent type or a shared agent filename (without `.md`). Only registered agents can be dispatched – arbitrary names will fail silently. Always verify agent existence before dispatching.

### Permission Denial Continuation

When a user denies a tool call, the agent continues execution rather than terminating. Design agents to:
- Handle denied operations gracefully (check for denial, provide fallback behavior)
- Never retry the exact same denied call
- Report what was skipped due to permission denial in the output

**Cross-reference:** See `guides/agent-configuration.md` for full CC 2.1 agent frontmatter fields (memory, background, isolation, hooks, MCP servers).

---

## Core Principles

### 1. Single Responsibility Principle (SRP)

Each agent MUST have exactly ONE clearly defined responsibility.

| Good | Bad |
|------|-----|
| "Validate YAML frontmatter syntax" | "Validate and fix files" |
| "Extract text from PDF" | "Process documents" |
| "Check naming conventions" | "Review skill quality" |

**Test:** Can you describe the agent's purpose in one sentence without using "and"?

### 2. Agent Isolation

Agents MUST be self-contained:
- MUST NOT reference other skills
- MUST NOT reference other agents
- MUST be stored in `agents/` (shared) or provided by Claude Code (builtin)

### 3. Token Efficiency

Agents MUST be optimized for minimal token usage:
- Concise prompts (target <500 tokens for simple agents)
- Clear input/output contracts
- No redundant instructions

---

## Agent Structure

### Directory Location

**Shared agents:**
```
agents/
├── index.md              # Registry
├── validator.md
├── formatter.md
└── reviewer.md
```

**Builtin agents:** Provided by Claude Code Task tool

### Agent File Template (XML Structure)

```markdown
# Agent: [agent-name]

---
name: [agent-name]
description: MUST BE USED to [action] when [condition].
tools: [tool1, tool2]
model: sonnet
---

<context>
[Role] specialized in [domain].
Tools: [explicit tool list].
Mission: [single outcome statement].
</context>

<task>
[Single sentence describing WHAT to accomplish - no "and"]
</task>

<input_contract>
| Input | Type | Required | Validation |
|-------|------|----------|------------|
| [name] | [type] | Yes/No | [validation rule] |

⛔ STOP if validation fails.
</input_contract>

<workflow>
1. [First step]
   `[Tool] [target]` → [result]
2. [Second step with check]
   Check: [condition] before proceeding
3. [Final step]
   Return: [output]
</workflow>

<constraints>
NEVER:
- [Anti-pattern]: [consequence]

ALWAYS:
- [Required behavior]: [rationale]
</constraints>

<critical_thinking>
Alternatives:
- [Approach A] vs [Approach B]: chose [A] because [reason]

Edge cases:
- [Edge case]: [handling]

Adapt:
- If [finding], then [pivot]
</critical_thinking>

<output>
{
  "status": "success" | "error",
  "result": [type],
  "details": {}
}
</output>

<quality_gate>
Before returning, ALL must be true:
- [ ] [Criterion 1]
- [ ] [Criterion 2]
</quality_gate>
```

---

## Contract Design

### Input Contract

Every input contract MUST specify: **Name**, **Type** (string/object/array/boolean), **Required** (Yes/No), **Validation** (how to verify).

**Pre-execution validation:** Agents MUST validate ALL inputs BEFORE executing. STOP if any condition fails.

| Input Type | Validation Example |
|------------|-------------------|
| File path | File exists, readable, correct extension |
| String | Non-empty, matches pattern, max length |
| Object | Required keys present, values valid |
| Array | Non-empty, items match expected type |

### Output Contract

Every output contract MUST specify: **Name**, **Type**, **Description** (what it contains and purpose).

**Post-execution validation:** All outputs MUST pass quality gates before returning. Verify output matches contract type, contains required data, and is well-formed.

### Quality Gates

Quality gates ensure agent outputs meet standards before being used by the orchestrating skill.

**Structure:** Define pass criteria (ALL must be true). On failure: log which criteria failed, return error with details, skill will retry (max 3 times), then escalate to user.

| Agent Type | Quality Criteria |
|------------|------------------|
| Validator | All checks pass, clear pass/fail result |
| Formatter | Output matches expected format exactly |
| Analyzer | Analysis complete, no missing sections |
| Generator | Output is syntactically valid, meets requirements |

### Self-defense: input rejection

Agents MUST reject unsupported inputs at the start of their workflow, not fail mid-execution. This is the "self-defense" principle.

**Pattern:**
```
Workflow step 1: Validate inputs
- If spec_tier not in [T2, T3, T4]: STOP → return error with supported values
- If project_path does not exist: STOP → return error with path checked
- If required file not found: STOP → return clarification_required
```

**Why:** When agents are invoked programmatically by skills, there is no human to catch mid-execution failures. An early STOP with a clear error is recoverable; a mid-execution failure with partial output is not.

**Anti-pattern:** Branching on input types without handling the "else" case. If your workflow has T2/T3/T4 branches, the T1 case MUST have an explicit STOP, not silent fallthrough.

---

## Token Efficiency & Naming

### Optimization Strategies

1. **Concise Prompts** - Remove redundant words, use tables instead of prose
2. **Focused Scope** - One responsibility per agent, minimal context loading
3. **Efficient Contracts** - Use shorthand where clear, structured data over prose

### Token Budgets

| Agent Complexity | Target | Max |
|------------------|--------|-----|
| Simple (validation, format) | 300 | 500 |
| Medium (analysis, review) | 500 | 800 |
| Complex (generation, multi-step) | 800 | 1200 |

### Naming Conventions

**Agent names:** lowercase, hyphens, descriptive verb-noun pattern `[action]-[target]`
**File names:** Same as agent name with `.md` extension in `agents/`

**Examples:** `validate-frontmatter`, `check-structure`, `format-output`, `analyze-workflow`

---

## Agent-Skill Relationship

**Orchestrator Pattern:** Skill acts as orchestrator, agents are workers.

**Communication Flow:**
1. Skill verifies input conditions → 2. Skill delegates to agent → 3. Agent validates inputs (BLOCKING) → 4. Agent executes single responsibility → 5. Agent validates output → 6. Agent returns to skill → 7. Skill applies quality gate → 8. Skill proceeds or retries

**Agent Independence:**
- MUST NOT: Call other agents, reference skills, skip quality gates, access resources outside contract
- MUST: Receive all inputs from caller, return all outputs to caller, report errors clearly, stay within token budget

---

## Common Agent Patterns

The `templates/` directory contains full agent templates for common patterns:

- **Validator Agent** (`templates/validator-agent.md`) - Validate content against rules
- **Formatter Agent** (`templates/formatter-agent.md`) - Transform content into target format
- **Analyzer Agent** (`templates/analyzer-agent.md`) - Extract structured insights
- **Code Writer Agent** (`templates/code-writer-agent.md`) - Implement code from specifications
- **Reviewer Agent** (`templates/reviewer-agent.md`) - Review code/content for quality

### Pattern Quick Reference

| Pattern | Tools | Key Features |
|---------|-------|--------------|
| Validator | Read, Grep, Glob | Input validation, clear pass/fail, error reporting |
| Formatter | Read, Write | Data preservation, format validation |
| Analyzer | Read, Grep, Glob | Evidence-based findings, structured output |
| Code Writer | Read, Write, Edit, Bash | Implementation focus, testing integration |
| Reviewer | Read, Grep, Glob | Feedback generation, severity classification |

**See individual template files for complete XML structures and implementation details.**

---

## Checklist

Before using an agent, verify:

### Critical Limitations (BLOCKING)
- [ ] **No Task tool:** Agent does NOT include Task in tools
- [ ] **No AskUserQuestion:** Agent does NOT include AskUserQuestion in tools
- [ ] **Tools explicitly listed:** Not omitted (would inherit ALL)

### XML Structure (Recommended)
- [ ] **Required tags present:** `<context>`, `<task>`, `<workflow>`, `<constraints>`, `<output>`
- [ ] **Tags properly closed:** No unclosed or incorrectly nested tags
- [ ] **No markdown headers for structure:** Use XML tags, not `##` sections

### Tag Content Quality
- [ ] **Context:** Defines specific role, tools, and mission
- [ ] **Task:** Single sentence without "and"
- [ ] **Workflow:** Numbered steps with tool examples
- [ ] **Constraints:** Uses NEVER/ALWAYS/MUST keywords with rationale
- [ ] **Output:** Exact JSON format specified

### Tool-Specific Requirements
- [ ] **If Bash:** Has `<bash_constraints>` with ALLOWED/NEVER lists
- [ ] **If Write/Edit:** Has `<file_restrictions>` with allowed paths
- [ ] **Critical thinking:** Has `<critical_thinking>` with alternatives, edge cases, adapt

### Core Requirements
- [ ] **SRP:** Agent has single, clear responsibility
- [ ] **Isolation:** No references to other skills/agents
- [ ] **Input Contract:** All inputs defined with validation (in `<input_contract>`)
- [ ] **Quality Gate:** Clear pass/fail criteria (in `<quality_gate>`)
- [ ] **Token Budget:** Within limits (300/500/800 by complexity)

### YAML Frontmatter (Standalone Agents)
- [ ] **Name:** Matches filename, lowercase with hyphens
- [ ] **Description:** Contains trigger phrase (MUST BE USED / PROACTIVELY)
- [ ] **Tools:** Explicitly listed (not omitted)

---

## See Also

- **[Agent Configuration Guide](./agent-configuration.md)** - YAML frontmatter, tools, permissions, model selection
- **[Agent Advanced Patterns](./agent-advanced-patterns.md)** - Resumption, anti-patterns, and system prompt writing
- **[Agent Implementation Patterns](./agent-implementation-patterns.md)** - Tool patterns, optimization, testing, and migration
- **Agent Templates** (`templates/` directory) - Ready-to-use templates for common patterns
