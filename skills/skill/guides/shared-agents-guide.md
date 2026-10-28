# Shared Agents Guide

How to use builtin and shared agents in skills.

---

## ⚠️ CRITICAL Limitations

**All agents (builtin and shared) have these hard constraints:**

### Agents Cannot Spawn Agents

The Task tool is **unavailable** to subagents. Only the main conversation can delegate.

- ❌ NEVER design agents that call other agents
- ❌ NEVER include `Task` in any agent's tools list
- ✅ Orchestrate multi-agent workflows in skills, not in agents

### Agents Cannot Use AskUserQuestion

The AskUserQuestion tool is **silently filtered** - it won't work in agents.

- ❌ NEVER design agents that need to ask clarifying questions
- ✅ Gather ALL requirements before delegating to agent

---

## Agent Sources

Skills can use agents from two sources:

| Source | Location | Created By | Reusable |
|--------|----------|------------|----------|
| **builtin** | Claude Code Task tool | Anthropic | Yes, system-wide |
| **shared** | `agents/` | User | Yes, across skills |

---

## Builtin Agents

Claude Code provides these built-in agents via the Task tool:

| Agent | Type | Best For |
|-------|------|----------|
| `Explore` | explorer | Codebase exploration, file search, pattern matching |
| `Plan` | planner | Implementation planning, architecture design |
| `technical-architect` | architect | Code architecture, engineering standards |
| `solution-architect` | architect | System design, integration architecture |
| `architecture-reviewer` | reviewer | Architecture reviews, quality assessment |
| `react-developer` | developer | React frontend development |
| `nest-developer` | developer | Nest.js backend development |
| `claude-code-guide` | documentation | Claude Code documentation queries |

### When to Use Builtin Agents

- **Explore:** When skill needs to search codebase, find files, or understand structure
- **Plan:** When skill needs to design implementation or break down tasks
- **technical-architect/solution-architect:** When skill needs architectural guidance
- **architecture-reviewer:** When skill needs to assess code quality
- **react-developer/nest-developer:** When skill needs framework-specific implementation
- **claude-code-guide:** When skill needs to reference Claude Code features

---

## Shared Agents

User-created agents stored in `agents/` that can be reused across multiple skills.

### Shared Agent Location

```
agents/
├── index.md              # Auto-maintained registry
├── research-agent.md     # Example shared agent
├── code-reviewer.md      # Example shared agent
└── ...
```

### Shared Agent Format

Every shared agent must have YAML frontmatter with capabilities:

```yaml
---
name: research-agent
type: research
capabilities:
  - web-search
  - documentation-lookup
  - information-synthesis
description: Research topics using web sources. Use when gathering information from the web.
tools: Read, WebSearch, WebFetch
model: sonnet
---

<context>
Research specialist for web-based information gathering.
...
</context>

...rest of agent using XML structure...
```

### Required Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Agent name (lowercase, hyphens) |
| `type` | Yes | Agent type for categorization |
| `capabilities` | Yes | List of capabilities for matching |
| `description` | Yes | What agent does + when to use |
| `tools` | Yes | Allowed tools |
| `model` | No | Model to use (default: sonnet) |
| `permissionMode` | No | Permission handling (`default`, `acceptEdits`, `plan`) |
| `skills` | No | Skills to auto-load into agent context |
| `memory` | No | Persistent memory config (scope: user/project/local) |
| `background` | No | Run asynchronously (boolean) |
| `isolation` | No | `worktree` for isolated copy |
| `hooks` | No | Lifecycle event hooks |
| `mcpServers` | No | MCP server integrations |
| `maxTurns` | No | Max conversation turns |
| `disallowedTools` | No | Tools to explicitly block |

### Capabilities Vocabulary

Use consistent capability names for matching:

| Category | Capabilities |
|----------|-------------|
| **Search** | `codebase-exploration`, `file-search`, `code-search`, `web-search`, `pattern-matching` |
| **Analysis** | `code-analysis`, `architecture-review`, `quality-assessment`, `documentation-lookup` |
| **Generation** | `code-generation`, `documentation-generation`, `text-generation`, `formatting` |
| **Validation** | `input-validation`, `schema-checking`, `type-checking`, `security-scanning` |
| **Planning** | `implementation-planning`, `architecture-design`, `task-breakdown` |
| **Development** | `frontend-development`, `backend-development`, `api-development`, `testing` |

---

## Agent Registry

The registry at `agents/index.md` is auto-maintained during skill creation.

### Registry Format

```markdown
# Shared Agents Registry

Last updated: 2025-12-18T20:30:00Z

## Available Agents

| Agent | Type | Capabilities | Description |
|-------|------|--------------|-------------|
| research-agent | research | web-search, documentation-lookup | Research topics using web sources |
| code-reviewer | reviewer | code-analysis, best-practices | Review code for quality issues |
```

---

## Referencing Agents in Skills

### Agents Table Format

Skills must include a Source column in the agents table:

```markdown
## Agents

| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| `Explore` | Codebase exploration | builtin | Step 1 |
| `research-agent` | Web research | shared | Step 2 |
```

### Workflow Step References

Reference agents differently based on source:

**Builtin agents:**
```markdown
#### Execution
Delegate to: `Explore` (builtin)
Task: Search codebase for relevant files
```

**Shared agents:**
```markdown
#### Execution
Delegate to: `research-agent` (shared: agents/research-agent.md)
Task: Research topic using web sources
```

---

## Agent Selection During Skill Creation

### Flow

1. **Requirements gathering** → Identify workflow steps
2. **Agent discovery** → List available builtin + shared agents
3. **Agent matching** → Score agents against requirements (≥80% match)
4. **User confirmation** → User chooses per step:
   - Use recommended builtin/shared agent
   - Create new shared agent

### Matching Algorithm

```
capability_score = (matched / required) * 100
tool_score = (matched_tools / required_tools) * 100
domain_score = domain_match ? 100 : 50

total_score = (capability_score * 0.5) + (tool_score * 0.3) + (domain_score * 0.2)
```

Agents with total_score ≥ 80% are recommended.

### User Choice

Users always have final say. For each workflow step:

```
For step "Research topic":
○ Use research-agent (shared) - 95% match
○ Use Explore (builtin) - 72% match
○ Create new shared agent "research-topic"
```

---

## When to Use Each Source

### Prefer Builtin When:
- Task matches builtin agent's specialty exactly
- No customization needed
- Standard Claude Code functionality suffices

### Prefer Shared When:
- Agent already exists for this capability
- Match score ≥80%
- Agent can be used across multiple skills

### Create New Shared Agent When:
- No existing agent matches well (<80%)
- The capability is reusable across skills
- Agent has no skill-specific dependencies

---

## Creating Shared Agents

To create a new shared agent:

1. Create file at `agents/{agent-name}.md`
2. Add required YAML frontmatter with capabilities
3. Use XML structure per `templates/agent-template.md`
4. Registry will auto-update on next skill creation

> **Session lifecycle caveat**
>
> Shared agents in `agents/` are loaded at **session startup**, not dynamically. If you create or modify a shared agent during the current session:
> - The agent file is written to disk immediately
> - But the agent is NOT available for the Agent tool until the session restarts
> - Agent discovery (Step 1.5) will not find newly created agents in the current session
>
> **Workaround:** Create agents in one session, test in the next. Using `general-purpose` agent type as fallback works but does not validate agent routing.

### Example Shared Agent

```markdown
# Agent: code-reviewer

---
name: code-reviewer
type: reviewer
capabilities:
  - code-analysis
  - best-practices
  - security-scanning
  - documentation-review
description: Review code for quality, security, and best practices. Use when code review is needed.
tools: Read, Grep, Glob
model: sonnet
---

<context>
Code review specialist for quality assurance.
Tools: Read, Grep, Glob.
Mission: Identify code quality issues, security vulnerabilities, and best practice violations.
</context>

<task>
Review code files for quality and security issues.
</task>

...
```

---

## Swapping Agent Sources

Existing skills can swap agent sources via the modify operation:

```json
{
  "skill_path": "skills/my-skill",
  "change_type": "agent-swap",
  "agent_changes": {
    "swaps": [
      {
        "step": "Step 1",
        "current_agent": "custom-explorer",
        "current_source": "shared",
        "new_agent": "Explore",
        "new_source": "builtin"
      }
    ]
  }
}
```

This will:
1. Update SKILL.md agents table
2. Update workflow step references

---

## Best Practices

1. **Start with builtin/shared** - Only create new agents when necessary
2. **Use consistent capabilities** - Follow vocabulary for better matching
3. **Document well** - Good descriptions improve auto-discovery
4. **Test shared agents** - Verify before using across skills
5. **Keep shared agents generic** - Avoid skill-specific logic
6. **Update registry** - Ensure index.md stays current

---

## CC 2.1 agent capabilities

Claude Code 2.1 introduces several capabilities for shared agents:

### Persistent memory

Agents can persist state across sessions using memory scopes:

```yaml
memory:
  scope: project  # user | project | local
```

Use `project` scope for project-specific conventions. Use `local` for machine-specific data (gitignored). Use `user` for cross-project preferences.

### Hooks

Lifecycle hooks let agents react to tool events:

```yaml
hooks:
  PreToolUse:
    - matcher: Bash
      command: "validate-command.sh"
```

### MCP integration

Agents can connect to MCP servers for external tool access:

```yaml
mcpServers:
  database:
    command: npx
    args: ["-y", "@my/db-mcp"]
```

### Permission modes

Control how agents handle permissions via `permissionMode` field. See `guides/agent-configuration.md` for full details.

### Agent management command

Use `/agents` in Claude Code to list, inspect, and manage available agents.

### Auto-compaction

Long-running agents automatically compact their context window when approaching limits, preserving key information while freeing space.

---

## Troubleshooting

### Agent Not Matching
- Check capabilities list matches requirements
- Verify frontmatter is valid YAML
- Ensure agent is in correct location

### Shared Agent Not Found
- Verify file exists at `agents/`
- Check file has `.md` extension
- Ensure frontmatter includes `name` field

**Agent just created but not found?**
Shared agents are loaded at session startup. If you created the agent in the current session, restart the session and try again. This is the most common cause of "agent not found" errors for newly created agents.

### Registry Outdated
- Delete `agents/index.md`
- Registry will regenerate on next skill creation
