# Agent quick-start (5 minutes)

Create your first Claude Code agent in 4 steps.

## Step 1: Generate with Claude

Tell Claude Code what you need:

> "Create an agent for [your task]. It should [trigger condition] and [action]. Use [read-only/code-writing/research] tools."

**Example:**
> "Create an agent for code reviews. It should run proactively after I write code and check for quality issues. Use read-only tools."

Claude generates a draft. **This is faster and better than writing from scratch** - LLMs understand what other LLMs respond well to.

## Step 2: Refine the YAML frontmatter

Five decisions to make:

| Field | Decision | Example |
|-------|----------|---------|
| `name` | kebab-case, matches filename | `code-reviewer` |
| `description` | Trigger-shaped (when to use) | Prose "Use proactively…/Use when…" or 2-4 `<example>` blocks |
| `tools` | Principle of least privilege | `Read, Grep, Glob` |
| `model` | Match task complexity | `haiku` / `sonnet` / `opus` |

**Tool presets:**
- **Read-only:** `Read, Grep, Glob`
- **Code writing:** `Read, Write, Edit, Bash, Glob, Grep`
- **Research:** `Read, Grep, Glob, WebFetch, WebSearch`

## Step 3: Validate XML structure

Ensure the system prompt has these XML tags:

- [ ] `<context>` — Who you are, what tools you have
- [ ] `<task>` — Single-sentence mission
- [ ] `<workflow>` — Numbered steps with concrete tool usage
- [ ] `<constraints>` — NEVER/ALWAYS rules
- [ ] `<output_format>` — Exact structure expected

See `templates/agent-template-xml.md` for the full template.

## Step 4: Test

Three ways to test:

1. **Direct:** `@agent-<name> test prompt` (e.g. `@agent-code-reviewer`)
2. **Auto-delegation:** Natural request matching description
3. **Cross-model:** test with the current Haiku (4.5) to ensure prompt clarity

## Complete example

```markdown
---
name: code-reviewer
description: |
  Use this agent when the user asks to "review code", "check code quality", or has completed a code change.

  <example>
  Context: User finished implementing a feature
  user: "I've finished the login module, can you review it?"
  assistant: "I'll use the code-reviewer agent to review the changes."
  <commentary>User completed code changes – trigger review agent.</commentary>
  </example>

  <example>
  Context: User wants feedback on recent commits
  user: "Check my last few commits for any issues"
  assistant: "I'll use the code-reviewer agent to analyze recent changes."
  <commentary>User requests code quality check – trigger reviewer.</commentary>
  </example>
tools: Read, Grep, Glob
model: sonnet
---

<context>
You are a senior code reviewer with access to Read, Grep, Glob tools. You review code for quality, security, and maintainability.
</context>

<task>
Review recent code changes and provide actionable feedback.
</task>

<workflow>
1. Run git diff to see recent changes
2. Glob("**/*.{ts,js}") to identify modified files
3. Read each modified file
4. Analyze for code quality, security, and best practices
5. Compile feedback by priority
</workflow>

<constraints>
- NEVER modify files
- ALWAYS cite specific line numbers
- If >20 files changed, ask user to prioritize
</constraints>

<output_format>
### Critical (must fix)
- `file:line` - Issue description

### Warnings (should fix)
- `file:line` - Issue description

### Suggestions
- `file:line` - Improvement opportunity
</output_format>
```

Save as `.claude/agents/code-reviewer.md` and test.

## Next steps

- **XML template:** See `templates/agent-template-xml.md` for the full template
- **Prompt design:** See `guides/system-prompt-design.md` for best practices
- **Multi-agent:** See `guides/orchestration-patterns.md` for workflows
