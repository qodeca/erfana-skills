# Agent Configuration Guide

YAML frontmatter configuration for standalone agents in `agents/`.

**Related:** [Agent Design Guide](./agent-design-guide.md) - Core principles and structure

---

## YAML Frontmatter Configuration

When agents are used as standalone files (shared agents in agents/), they use YAML frontmatter for configuration.

### Property Reference

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| `name` | Yes | string | Unique identifier (lowercase, hyphens; max 64 chars); must match filename |
| `description` | Yes | string | Auto-delegation trigger (max 1024 chars); critical for when to invoke |
| `tools` | No | csv | Comma-separated tool list; **inherits ALL tools if omitted** (security risk) |
| `model` | No | enum | `haiku`, `sonnet`, `opus`, or `inherit`; defaults to `sonnet` |
| `permissionMode` | No | enum | Controls permission handling; see values below |
| `skills` | No | csv | Comma-separated skill names to auto-load into agent context |
| `memory` | No | object | Persistent memory configuration (see CC 2.1 section below) |
| `background` | No | boolean | Run agent in background; caller notified on completion |
| `isolation` | No | enum | `worktree` for isolated git worktree copy (prefer branches per workflow) |
| `hooks` | No | object | Lifecycle event hooks (`PreToolUse`, `PostToolUse`, `Stop`, etc.) |
| `mcpServers` | No | object | MCP server configuration for external integrations |
| `maxTurns` | No | integer | Maximum conversation turns before auto-stop |
| `disallowedTools` | No | csv | Tools to explicitly block (inverse of `tools`) |

### Description Patterns (Critical for Auto-Delegation)

**Pattern:** `<TRIGGER> <action> <domain>. <when to use>.`

```yaml
# Pattern 1: Mandatory trigger (high priority)
description: MUST BE USED for writing production code after architecture approval.

# Pattern 2: Proactive trigger (opportunistic)
description: Use PROACTIVELY when documentation becomes stale. Updates README and docs.

# Pattern 3: Combined triggers (both mandatory AND proactive)
description: MUST BE USED for security audits. Use PROACTIVELY before production releases.

# Bad examples
description: Helps with code.  # Too vague
description: Reviews code quality.  # No trigger
description: I can help you review code.  # First person
```

### Model Selection

| Task Type | Model | Rationale |
|-----------|-------|-----------|
| Fast exploration, simple analysis | `haiku` | 2x speed, 3x cheaper |
| Code implementation, testing | `sonnet` | Best price/performance (default) |
| Architecture, security, critical | `opus` | Maximum reasoning |
| Match parent conversation | `inherit` | Consistency with main session |

---

## Permission Modes

### Values

| Value | Behavior | Use Case |
|-------|----------|----------|
| `default` | Normal permission prompts | Standard agents |
| `acceptEdits` | Auto-accept Edit tool only | Trusted code writers |
| `bypassPermissions` | Skip all permission checks | Fully autonomous (dangerous) |
| `plan` | Plan-only mode (no execution) | Analysis/planning agents |

### Selection Criteria

| Mode | When to Use | When NOT to Use |
|------|-------------|------------------|
| `default` | Most agents, interactive workflows | Fully automated pipelines |
| `acceptEdits` | Trusted code writers, CI/CD agents | Agents accessing sensitive files |
| `bypassPermissions` | **NEVER for user-facing skills** | Always avoid unless sandboxed |
| `plan` | Architecture design, dry-run previews | Agents that need to write files |

### Security Implications

**default (Safest)**
- User confirms each sensitive operation
- Good audit trail
- Appropriate for: All shared agents

**acceptEdits**
- Auto-accepts Edit tool operations only
- Still prompts for: Write, Bash, file deletion
- Risk: May modify files user doesn't expect
- Appropriate for: High-trust code generators with limited scope

**bypassPermissions (Highest Risk)**
- ⚠️ **NEVER use for shared agents**
- Grants unrestricted file system access
- No user confirmation for any operation
- Risk: Could modify/delete critical files
- Only appropriate for: Sandboxed test environments, fully audited CI agents

**plan**
- Agent can read and analyze but not execute
- Good for: Architecture planning, impact analysis, dry-run modes
- Limitation: Cannot actually implement changes

### Risk Matrix

| Permission Mode | Tool Risk | Combined Risk Score Impact |
|-----------------|-----------|----------------------------|
| `default` | +0 | Neutral - standard safety |
| `acceptEdits` | +1 | Low increase |
| `bypassPermissions` | +5 | High increase |
| `plan` | -1 | Reduces risk |

### Best Practices

1. **Default to `default`**
   - Start with standard permission prompts
   - Only escalate if workflow requires it

2. **Document permission escalation**
   - If using `acceptEdits`, explain why in agent description
   - Never use `bypassPermissions` in production skills

3. **Test with restricted permissions first**
   - Verify agent works with `default` mode
   - Only add permissions if genuinely needed

4. **Audit permission usage**
   - Review which operations actually need auto-approval
   - Reduce permissions to minimum viable

### Example: Progressive Permission Escalation

```yaml
# Stage 1: Development (most restrictive)
permissionMode: default

# Stage 2: Testing (after audit)
permissionMode: acceptEdits

# Stage 3: Production (shared agents)
permissionMode: default  # Always revert for user-facing
```

**Security principle:** Start with `default`, escalate only when necessary, document the reason.

---

## Skills Auto-Loading

```yaml
skills: extracting-stakeholder-issues, project-housekeeping
```

Automatically loads skill content into the agent's context when it starts.

---

## Tool Configuration

### Principle of Least Privilege

Only grant tools the agent needs.

| Agent Type | Recommended Tools |
|------------|-------------------|
| Read-only (reviewers, auditors) | `Read, Grep, Glob` |
| Research (explorers, analysts) | `Read, Grep, Glob, WebFetch, WebSearch` |
| Code writers (implementers) | `Read, Write, Edit, Bash, Glob, Grep` |
| Documentation | `Read, Write, Edit, Glob, Grep` |

**Warning:** Omitting `tools` inherits ALL tools - security risk!

### Bash Constraints (Required When Bash Granted)

When an agent has Bash in its tools, add explicit `<bash_constraints>`:

```xml
<bash_constraints>
**ALLOWED:** npm run typecheck, npm test, git log, git diff, which, cp -r
**NEVER:** rm -rf, curl, wget, sudo, npm install, git push --force
</bash_constraints>
```

### File Restrictions (Required When Write/Edit Granted)

When an agent has Write or Edit in its tools, add explicit `<file_restrictions>`:

```xml
<file_restrictions>
**ALLOWED PATHS:**
- `agents/` - shared agent files
- `{skill_path}/` - skill directory only

**NEVER MODIFY:**
- Files outside allowed paths
- System configuration files
- `.env`, credentials, or secret files
</file_restrictions>
```

---

## Complete Example

```markdown
# Agent: code-reviewer

---
name: code-reviewer
description: MUST BE USED to review code changes for quality, security, and best practices. Use PROACTIVELY before merging pull requests.
tools: Read, Grep, Glob
model: sonnet
permissionMode: default
skills: code-quality-standards, security-patterns
---

<context>
Code reviewer specialized in quality assurance.
Tools: Read, Grep, Glob.
Mission: Identify bugs, security issues, and quality improvements.
</context>

<task>
Review code changes and provide actionable feedback.
</task>

<workflow>
1. Read target files
   `Read [file_path]` → file contents
2. Analyze code patterns
   `Grep [pattern]` → matching issues
3. Generate feedback report
   Return: structured findings
</workflow>

<constraints>
NEVER:
- Suggest changes without reading code first

ALWAYS:
- Cite specific line numbers for issues
- Provide rationale for recommendations
</constraints>

<output>
{
  "status": "success" | "error",
  "findings": {
    "critical": [],
    "suggestions": [],
    "positive": []
  }
}
</output>
```

---

## CC 2.1 agent fields

### Memory (persistent state)

Agents can persist information across sessions using the `memory` field:

```yaml
memory:
  scope: project  # user | project | local
```

| Scope | Persisted to | Use case |
|-------|-------------|----------|
| `user` | `~/.claude/memory/` | Cross-project preferences |
| `project` | `.claude/memory/` | Project-specific state |
| `local` | `.claude/local/memory/` | Machine-specific, gitignored |

**Guideline:** Match scope to data sensitivity. User preferences → `user`. Project conventions → `project`. Local paths or credentials → `local`.

### Background execution

```yaml
background: true
```

Agent runs asynchronously. The caller is notified on completion and can continue other work. Use for long-running tasks (large codebase scans, multi-file refactoring) where results aren't needed immediately.

### Isolation (worktree)

```yaml
isolation: worktree
```

Creates a temporary git worktree for the agent, giving it an isolated copy of the repository. The worktree is auto-cleaned if the agent makes no changes.

> **Note:** While `isolation: worktree` is a valid CC 2.1 feature, this project prefers branches over worktrees for simplicity (see CLAUDE.md). Document the feature but recommend `git checkout -b` for most workflows.

### Hooks

Lifecycle hooks let agents react to events:

```yaml
hooks:
  PreToolUse:
    - matcher: Write
      command: "echo 'About to write file'"
  PostToolUse:
    - matcher: Bash
      command: "echo 'Bash command completed'"
```

**Safety:** Ensure hook commands are non-destructive and do not expose secrets.

### MCP servers

```yaml
mcpServers:
  my-server:
    command: npx
    args: ["-y", "@my/mcp-server"]
```

Adds MCP tools to the agent's context. Use for external integrations (databases, APIs, cloud services).

### Task(agent_type) syntax

When spawning agents from skills, use the `subagent_type` parameter:

```
Agent tool → subagent_type: "my-agent-name"
```

**Restrictions:** Only agents registered as builtin or in `agents/` can be referenced. The orchestrator (skill) must confirm the agent exists before dispatching.

### Permission denial continuation

When a user denies a tool call, the agent does **not** terminate – it continues execution. Agents should be designed to handle denied permissions gracefully:
- Check for denial in tool results
- Have fallback strategies for denied operations
- Never retry the exact same denied call

---

## See Also

- **[Agent Design Guide](./agent-design-guide.md)** – Core principles and structure
- **[Agent Advanced Patterns](./agent-advanced-patterns.md)** – Resumption, anti-patterns, and prompt writing
