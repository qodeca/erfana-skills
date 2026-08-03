# Skill frontmatter guide

Detailed reference for all SKILL.md frontmatter fields available in Claude Code 2.1.

---

## Required fields

### `name`
- **Type:** string
- **Max:** 64 characters
- **Format:** Lowercase, hyphens only, gerund form (verb+-ing)
- **Example:** `name: managing-skills`

### `description`
- **Type:** string
- **Max:** 1024 characters
- **Voice:** Third person (NOT "I can help you...")
- **Content:** What it does + when to use it
- **Example:**
```yaml
description: |
  Create, review, and modify Claude Code skills following Anthropic best practices.
  Use when creating new skills, reviewing existing skills, or updating skill content.
```

---

## Context and execution fields

### `context`
- **Type:** enum
- **Values:** `fork` or omit
- **Default:** Shared context (not set)
- **When to use `fork`:**
  - Skill performs destructive or experimental operations
  - Skill should not pollute the main conversation context
  - Skill runs long tasks that shouldn't block the conversation
- **Example:** `context: fork`

### `agent`
- **Type:** string
- **Default:** Not set (skill runs in main conversation)
- **When to use:** When the skill has a single dedicated agent that handles all execution
- **Example:** `agent: my-dedicated-agent`

### `model`
- **Type:** enum
- **Values:** `opus`, `sonnet`, `haiku`
- **Default:** Inherits user's current model
- **When to use:** When skill requires specific capability level
- **Model IDs:** `claude-opus-5` (primary), `claude-fable-5` (session-level only — never pin), `claude-opus-4-8` (legacy), `claude-sonnet-5`, `claude-haiku-4-5-20251001`. Prefer the aliases above — they resolve to the current generation automatically.
- **Example:** `model: opus`

---

## Tool and permission fields

### `allowed-tools`
- **Type:** comma-separated string
- **Default:** All tools available
- **When to use:** When skill should restrict which tools are accessible
- **Example:** `allowed-tools: Read, Grep, Glob, Edit, Write`
- **Security note:** Use this to enforce least-privilege access

### `hooks`
- **Type:** object
- **Default:** No hooks
- **Hook types:**
  - `preToolCall` – runs before a tool is called
  - `postToolCall` – runs after a tool completes
  - `notification` – triggered on specific events
- **Example:**
```yaml
hooks:
  preToolCall:
    - matcher: { tool_name: "Write" }
      command: "echo 'Writing file: $TOOL_INPUT'"
```
- **Security note:** Hook commands run with user's shell permissions

---

## Invocation fields

### `user-invocable`
- **Type:** boolean
- **Default:** `true`
- **When to set `false`:** Skill should only be triggered by model auto-detection, not by user slash command
- **Example:** `user-invocable: false`

### `argument-hint`
- **Type:** string
- **Default:** Not set
- **Purpose:** Hint text shown to user when typing the slash command
- **Example:** `argument-hint: "<skill-name> [--deep]"`

### `disable-model-invocation`
- **Type:** boolean
- **Default:** `false`
- **When to set `true`:** Skill should only be triggered by user slash command, never by model auto-detection
- **Example:** `disable-model-invocation: true`

---

## String substitution patterns

These variables are automatically replaced in skill content at load time:

| Pattern | Value | Use case |
|---------|-------|----------|
| `$ARGUMENTS` | User-provided text after the slash command | Passing parameters to skill |
| `$SELECTION` | Currently selected code in IDE | Operating on selected code |
| `$FILE` | Current file path in IDE | Context-aware file operations |

**Example usage in SKILL.md:**
```markdown
## Task

Analyze the following code:
$SELECTION

From file: $FILE
User instructions: $ARGUMENTS
```

---

## Dynamic context injection

Prefix any line with `!` to execute it as a shell command. The command output replaces the line in the skill content.

### Syntax
```markdown
!git log --oneline -5
!cat package.json | jq '.name, .version'
!ls src/components/
```

### How it works
1. When the skill loads, lines starting with `!` are detected
2. The shell command is executed in the user's environment
3. Command output replaces the `!command` line in the loaded content
4. The model sees the output as if it were static content

### Use cases
- Inject current project state (git status, dependencies)
- List relevant files for context
- Include environment-specific configuration
- Show recent changes or activity

### Security considerations
- Commands run with the user's shell permissions
- Only use for read-only operations
- Avoid commands that modify state
- Be explicit about what commands will run

---

## Agent Skills open standard

Skills in Claude Code follow conventions compatible with the Agent Skills open standard (agentskills.io):

- **Frontmatter-based metadata** – YAML frontmatter defines skill identity and configuration
- **Progressive disclosure** – core instructions in SKILL.md, details in supplementary files
- **Portable structure** – skills can be shared across environments and users
- **Standard invocation** – slash commands provide consistent user experience

For more on progressive disclosure, see `guides/progressive-disclosure.md`.

---

## 2% context budget rule

A skill's core SKILL.md body should consume no more than ~2% of the model's available context window.

**Why this matters:**
- Context window is shared with user conversation and tool outputs
- Bloated skills crowd out space for actual work
- Agents have their own context windows – move detailed instructions there

**Guidelines:**
- Keep SKILL.md under 300 lines (~500 tokens for a typical skill)
- Move detailed guides to `guides/` directory
- Move templates to `templates/` directory
- Move validation checklists to `validation/` directory
- Use progressive disclosure – load details on demand

See `guides/progressive-disclosure.md` for the 4-layer model.

---

## Quick reference

| Field | Required | Type | Default |
|-------|----------|------|---------|
| `name` | Yes | string | – |
| `description` | Yes | string | – |
| `context` | No | enum | shared |
| `agent` | No | string | – |
| `hooks` | No | object | – |
| `model` | No | enum | inherit |
| `allowed-tools` | No | csv | all |
| `user-invocable` | No | boolean | true |
| `argument-hint` | No | string | – |
| `disable-model-invocation` | No | boolean | false |
