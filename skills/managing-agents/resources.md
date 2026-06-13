# Claude Code Agent Resources

## Contents
- Official Anthropic Documentation; Claude Agent SDK; Prompt Engineering; Community Resources
- Tool Reference
- Model Selection Guide; YAML Frontmatter Reference
- System Prompt Structure; Security Considerations; HITL Rules
- Version History; Quick Links

Official documentation, guides, and community resources for creating Claude Code agents.

> **Last Verified:** 2026-03-29
> URLs and information should be periodically verified as documentation evolves.

---

## Official Anthropic Documentation

### Claude Code Documentation
- **Claude Code Docs**: https://code.claude.com/docs (canonical URL)
- **Claude Code GitHub**: https://github.com/anthropics/claude-code
- **Claude Code Issues**: https://github.com/anthropics/claude-code/issues

### Agent Development
- **Building Effective Agents**: https://www.anthropic.com/engineering/building-effective-agents
- **Claude Character Research**: https://www.anthropic.com/engineering/claude-character (may have moved – now at https://www.anthropic.com/research/claude-character)
- **Prompt Engineering Guide**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering (redirects to platform.claude.com – content now at https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags)

### Claude API & Models
- **Claude API Documentation**: https://docs.anthropic.com/en/api (redirects to platform.claude.com – final destination returns 404)
- **Model Overview**: https://docs.anthropic.com/en/docs/about-claude/models (redirects to platform.claude.com – content loads OK)

---

## Claude Agent SDK

### Official Resources
- **Claude Agent SDK GitHub**: https://github.com/anthropics/claude-agent-sdk (redirects to claude-agent-sdk-typescript)
- **SDK README**: https://github.com/anthropics/claude-agent-sdk#readme (redirects to claude-agent-sdk-typescript)

### Architecture Patterns
- **Orchestrator-Worker Pattern**: Multi-agent coordination (see Building Effective Agents)
- **Tool Use Patterns**: https://docs.anthropic.com/en/docs/build-with-claude/tool-use (redirects to platform.claude.com – content loads OK)
- **Extended Thinking**: https://docs.anthropic.com/en/docs/build-with-claude/extended-thinking (redirects to platform.claude.com – content loads OK)

---

## Prompt Engineering

### Best Practices
- **Anthropic Prompt Engineering**: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering (redirects to platform.claude.com – content now at https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags)
- **Prompt Library**: https://docs.anthropic.com/en/prompt-library (redirects to platform.claude.com – content loads OK)

### Latest Claude Models
- **Claude Model Overview**: https://docs.anthropic.com/en/docs/about-claude/models (redirects to platform.claude.com – content loads OK)

### Techniques
- **Chain of Thought**: Break complex tasks into steps
- **Few-Shot Examples**: Provide concrete examples in prompts
- **Role Prompting**: Define specific expertise and constraints
- **Output Formatting**: Specify exact response structures

---

## Community Resources

### GitHub Discussions & Examples
- **Claude Code Discussions**: https://github.com/anthropics/claude-code/discussions (may have moved – returns 404)
- **Example Agents**: Community-contributed agent configurations

### Learning Resources
- **Anthropic Cookbook**: https://github.com/anthropics/anthropic-cookbook (repo renamed to claude-cookbooks, URL still redirects OK)
- **Claude Use Cases**: Real-world implementation examples

---

## Tool Reference

### Available Tools
| Tool | Purpose | Risk Level |
|------|---------|------------|
| `Read` | Read file contents | Low |
| `Grep` | Search file contents | Low |
| `Glob` | Find files by pattern | Low |
| `Write` | Create/overwrite files | High |
| `Edit` | Modify existing files | Medium |
| `Bash` | Execute shell commands | High |
| `WebSearch` | Search the web | Medium |
| `WebFetch` | Fetch URL contents | Medium |
| `Agent` (formerly `Task`) | Spawn sub-agents. Only available in main conversation & skills context; subagents cannot spawn further subagents (no spawn tool, even if listed). `Task(...)` still works as an alias. See `guides/orchestration-patterns.md` for valid orchestration patterns. | N/A (context-dependent) |
| `NotebookEdit` | Edit Jupyter notebooks | Medium |

**Note:** The spawn tool (named `Agent` since Claude Code v2.1.63; `Task(...)` still works as an alias) is only available in the main conversation and skills. Subagents cannot spawn further subagents — they do not have access to the spawn tool, even if it is listed in their `tools` field. See `guides/orchestration-patterns.md` for orchestration architecture details.

### Tool Combinations by Agent Type
```yaml
# Read-only analysis
tools: Read, Grep, Glob

# Documentation updates
tools: Read, Write, Edit, Glob, Grep

# Full implementation
tools: Read, Write, Edit, Bash, Glob, Grep

# Research with web access
tools: Read, Grep, Glob, WebFetch, WebSearch

# ❌ INVALID: Orchestrator agents (subagents cannot spawn further subagents)
# Subagents do NOT have the Agent (formerly Task) spawn tool when running as subagents
# Orchestration happens from main conversation (see guides/orchestration-patterns.md)
# tools: Read, Grep, Glob, Agent
```

---

## Model Selection Guide

**IMPORTANT:** User must explicitly select the model via `AskUserQuestion`. Do not assume or recommend a specific model.

### Available Models (Reference Only)

| Model alias | Speed | Cost |
|-------|-------|------|
| `haiku` | Fastest | Lowest |
| `sonnet` | Balanced | Medium |
| `opus` | Slowest | Highest |
| `inherit` | Matches parent | Matches parent |

Aliases resolve to the current Claude 4.x family (Opus 4.8, Sonnet 4.6, Haiku 4.5). The `model` field also accepts a full model ID (e.g. `claude-opus-4-8`, `claude-sonnet-4-6`) to pin a specific version; aliases are the default recommendation.

**`effort`** is a separate optional frontmatter field (`low`, `medium`, `high`, `xhigh`, `max`) that tunes reasoning depth independently of `model`; it overrides the session effort for that agent.

---

## YAML Frontmatter Reference

### All Fields
```yaml
---
name: agent-name                    # Required, must match filename
description: |                      # Required, example-based triggers
  Use this agent when...
  <example>...</example>
tools: Read, Grep, Glob             # Optional; plugin convention lists explicitly for least privilege
disallowedTools: Write, Edit        # Optional denylist ("inherit all except these"); applied before tools
model: sonnet                       # Optional (defaults to inherit); plugin convention has user select via Q&A
effort: medium                      # Optional: low, medium, high, xhigh, max
color: cyan                         # Optional, free-form (e.g. green, yellow, red, cyan, indigo, amber, teal); unique per agent
permissionMode: default             # Optional: default, acceptEdits, plan, auto, dontAsk, bypassPermissions (ignored for plugin-distributed agents)
allowed-tools: Read, Grep, Glob     # Optional: CC 2.1 hard system-level tool restriction
skills: skill-name                  # Optional: auto-load skills
---
```

**`tools` vs `allowed-tools`:** `tools` is a prompt-level hint – the agent sees it but the system doesn't enforce it. `allowed-tools` is a CC 2.1 system-level restriction that hard-blocks tool access. Use `allowed-tools` for security-sensitive agents (e.g., agents with MCP access).

**`tools` vs `disallowedTools`:** omitting `tools` inherits every tool; listing it is an allowlist. `disallowedTools` is a denylist – the cleanest way to express "inherit everything except X" (e.g. inherit all but `Write`, `Edit`). If both are set, `disallowedTools` is applied first, then `tools` is resolved. `tools` and `model` are optional in the spec (`model` defaults to `inherit`); explicit tool lists and user-selected models are a plugin convention for least privilege and predictability, not an Anthropic requirement.

### Description Patterns (example-based triggers)
```yaml
description: |
  Use this agent when the user asks to "<action>", "<synonym>", or describes <need>.

  <example>
  Context: <triggering situation>
  user: "<natural user message>"
  assistant: "<response>"
  <commentary><why trigger></commentary>
  </example>
```

### Color Reference

`color` is free-form – any color name is accepted. The table below is an illustrative semantic convention, not a closed list; doer/reviewer pairs and the wider palette (indigo, amber, orange, teal, sky, emerald, slate, etc.) are covered in `guides/agent-pairing.md` ("Current color assignments" and "Suggested pair color families"). The only hard rule is that each agent's color is unique across `agents/`.

| Color | Semantic | Use for |
|-------|----------|---------|
| `green` | Generation/creation | Code writers, generators, builders |
| `yellow` | Validation/caution | Validators, explorers, analyzers |
| `red` | Security/critical | Security auditors, critical reviewers |
| `cyan` | Analysis/review | Code reviewers, quality checkers |
| `magenta` | Transformation/creative | Refactoring, creative agents |
| `blue` | General-purpose | Default, multi-purpose agents |

---

## System Prompt Structure

Start with **structured markdown**; move to the **XML** form only for complex agents (nested sections or >100 lines). The skeleton is not reprinted here — use the canonical templates so there is a single source of truth:

- `templates/agent-template-markdown.md` — simple-to-medium agents (markdown-first)
- `templates/agent-template-xml.md` — complex agents (full `<context>` / `<task>` / `<workflow>` / `<constraints>` / `<output_format>` skeleton)

See `guides/system-prompt-design.md` for when to choose each form and the underlying prompt-engineering principles.

### Guidelines
- **Token efficiency:** Agent definitions MUST be token efficient — concise but complete

---

## Security Considerations

### Principle of Least Privilege
1. Grant only necessary tools
2. Restrict Bash where possible
3. Use read-only for analyzers
4. Document tool justifications

### HITL (Human-In-The-Loop) Patterns
```markdown
## HITL Rules
Request approval before:
- Deleting files
- Modifying configs
- Running destructive commands
- Accessing sensitive directories
```

### Permission Modes
| Mode | Description | Use Case |
|------|-------------|----------|
| `default` | Prompts for risky actions | Most agents |
| `acceptEdits` | Auto-accepts edits in working dir + listed FS commands | Trusted automation, narrow scope |
| `plan` | Planning only, no mutations | Architecture agents |
| `auto` | Classifier-gated autonomy with background safety checks | Lower-prompt autonomous runs |
| `dontAsk` | Auto-denies anything not pre-approved | Locked-down CI |
| `bypassPermissions` | No prompts, no protection (incl. none vs prompt injection) | Never in production |

**Note:** `permissionMode` (and `mcpServers`, `hooks`) are ignored for plugin-distributed agents. Enforce least privilege via `tools`/`disallowedTools` + session rules instead.

---

## Version History

### Claude Code Updates
- Check GitHub releases for features
- Review changelog for breaking changes
- Test agents after updates

### Agent Compatibility
- Agents are markdown files, version-control friendly
- Test agents after Claude Code updates
- Document any model-specific behavior differences

---

## Quick Links

| Resource | URL |
|----------|-----|
| Claude Code Docs | https://code.claude.com/docs |
| Agent Building Guide | https://www.anthropic.com/engineering/building-effective-agents |
| Claude Agent SDK | https://github.com/anthropics/claude-agent-sdk |
| Prompt Engineering | https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering |
| Tool Use | https://docs.anthropic.com/en/docs/build-with-claude/tool-use |
| GitHub Issues | https://github.com/anthropics/claude-code/issues |
| Anthropic Cookbook | https://github.com/anthropics/anthropic-cookbook |
