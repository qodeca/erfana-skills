# Skill Creation Resources

Curated external references for learning more about Claude Code skills.

> **Last verified:** 2025-12-18
> External links are checked periodically. Report broken links via review.

---

## Quick Reference (Essential)

Start here for the authoritative sources.

| Resource | Description | Verified |
|----------|-------------|----------|
| [Agent Skills Documentation](https://code.claude.com/docs/en/skills) | Official specification for SKILL.md format, YAML fields, and directory structure | 2025-12 |
| [Equipping Agents with Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) | Comprehensive guide covering progressive disclosure, descriptions, cross-model testing, and anti-patterns | 2025-12 |
| [Official Skills Repository](https://github.com/anthropics/skills) | 18+ production skills from Anthropic demonstrating real-world patterns | 2025-12 |

---

## Decision Making

Use these when deciding whether to create a skill.

| Resource | Description | Verified |
|----------|-------------|----------|
| [Skills Explained Blog](https://www.claude.com/blog/skills-explained) | Clarifies how skills compare to prompts, Projects, MCP, and subagents | 2025-12 |
| [When to Use Skills vs Commands vs Agents](https://danielmiessler.com/blog/when-to-use-skills-vs-commands-vs-agents) | Decision framework for choosing the right tool | 2025-12 |

### Quick Decision Guide

| Use Case | Solution |
|----------|----------|
| One-time instruction | Just type it (prompt) |
| Repeated prompt across conversations | **Skill** |
| Quick shortcut you trigger manually | Slash Command |
| External data integration | MCP Server |
| Independent task execution | Subagent |

---

## Learning from Examples

Study existing skills to learn patterns.

| Resource | Description | Verified |
|----------|-------------|----------|
| [Official Skills Repository](https://github.com/anthropics/skills) | Anthropic's official examples: algorithmic-art, brand-guidelines, webapp-testing, etc. | 2025-12 |
| [Awesome Claude Skills](https://github.com/travisvn/awesome-claude-skills) | Community-curated list of skills, tools, and resources | 2025-12 |
| [obra/superpowers](https://github.com/obra/superpowers) | Battle-tested library with 20+ skills and command shortcuts | 2025-12 |

### Notable Official Skills to Study

| Skill | Why It's Instructive |
|-------|---------------------|
| `algorithmic-art` | Creative skill with clear outputs |
| `webapp-testing` | Technical skill using Playwright |
| `brand-guidelines` | Enterprise pattern with templates |
| `mcp-builder` | Complex skill for building MCP servers |

---

## Deep Understanding

For those who want to understand how skills work internally.

| Resource | Description | Verified |
|----------|-------------|----------|
| [Inside Claude Code Skills](https://mikhail.io/2025/10/claude-code-skills/) | Structure, prompts, and invocation mechanics | 2025-12 |
| [Claude Agent Skills: First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) | Technical analysis of skill architecture | 2025-12 |
| [Simon Willison's Analysis](https://simonwillison.net/2025/Oct/16/claude-skills/) | Practical perspective on skill value and impact | 2025-12 |

---

## Help Center Articles

Official support documentation.

| Resource | Description | Verified |
|----------|-------------|----------|
| [Using Skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude) | End-user guide for using skills | 2025-12 |
| [How to Create Custom Skills](https://support.claude.com/en/articles/12512198-how-to-create-custom-skills) | Step-by-step creation guide | 2025-12 |

---

## Related Topics

### Slash Commands (User-Invoked)
- [Slash Commands Documentation](https://code.claude.com/docs/en/slash-commands)
- Different from skills: explicitly triggered with `/command`

### MCP (Model Context Protocol)
- [MCP Documentation](https://modelcontextprotocol.io/)
- For external data integration, not instruction storage

### Claude Code General
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- General patterns for working with Claude Code

---

## Community

Connect with other skill creators.

| Resource | Description | Verified |
|----------|-------------|----------|
| [Claude Code GitHub Issues](https://github.com/anthropics/claude-code/issues) | Bug reports, feature requests, and community discussions | 2025-12 |
| [Anthropic Discord](https://discord.gg/anthropic) | Real-time community chat | 2025-12 |

---

## Staying Updated

Skills are an evolving feature. Stay current with:

1. **Official Documentation** - Check periodically for updates
2. **Anthropic Blog** - Announcements of new features
3. **GitHub Releases** - Claude Code release notes
4. **Community Resources** - awesome-claude-skills tracks new patterns

---

## Resource Categories Summary

| Category | When to Use |
|----------|-------------|
| **Quick Reference** | Creating your first skill |
| **Decision Making** | Unsure if skill is right solution |
| **Examples** | Learning patterns from real skills |
| **Deep Understanding** | Want to know how skills work |
| **Help Center** | Step-by-step guidance |
| **Community** | Questions and discussion |

---

# Agent Resources

Resources for creating agents.

---

## Agent Documentation

| Resource | Description | Verified |
|----------|-------------|----------|
| [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) | Anthropic's comprehensive guide to agent design | 2025-12 |
| [Tool Use Patterns](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) | How to configure and use tools effectively | 2025-12 |
| [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) | SDK for building agents programmatically | 2025-12 |

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
| `Task` | Spawn sub-agents (NOT available in subagents) | N/A |
| `NotebookEdit` | Edit Jupyter notebooks | Medium |

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
```

---

## Model Selection Guide

| Model | Speed | Cost | Best For |
|-------|-------|------|----------|
| `haiku` | Fastest | Lowest | Simple tasks, exploration |
| `sonnet` | Balanced | Medium | Most implementation work |
| `opus` | Slowest | Highest | Critical reasoning, security |
| `inherit` | Parent | Parent | Consistency with main session |

---

## YAML Frontmatter Reference

```yaml
---
name: agent-name                    # Required, must match filename
description: MUST BE USED to...     # Required, for auto-delegation
tools: Read, Grep, Glob             # Optional, defaults to all (risky!)
model: sonnet                       # Optional: haiku, sonnet, opus, inherit
permissionMode: default             # Optional: default, acceptEdits, bypassPermissions, plan
skills: skill-name                  # Optional: auto-load skills
---
```

### Description Patterns

```yaml
# Mandatory trigger
description: MUST BE USED for <action> when <condition>.

# Proactive trigger
description: Use PROACTIVELY when <situation>. <what it does>.

# Combined trigger
description: MUST BE USED for <action>. Use PROACTIVELY before <event>.
```

---

## Debugging Agents

| Problem | Solution |
|---------|----------|
| Not auto-delegating | Check description trigger, test `@agent-name` |
| Wrong output | Verify output contract, add examples |
| Wrong tools used | Explicit tools list, add constraints |
| Too slow | Check model choice, reduce token budget |

### Testing Checklist

1. Direct invocation: `@agent-name test prompt`
2. Auto-delegation: Natural language request
3. Output format: Matches contract exactly
4. Edge cases: Empty input, large input, errors

---

## Quick Links

| Resource | URL | Verified |
|----------|-----|----------|
| Claude Code Docs | https://code.claude.com/docs | 2025-12 |
| Building Effective Agents | https://www.anthropic.com/engineering/building-effective-agents | 2025-12 |
| Prompt Engineering | https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering | 2025-12 |
| Tool Use | https://docs.anthropic.com/en/docs/build-with-claude/tool-use | 2025-12 |
| GitHub Issues | https://github.com/anthropics/claude-code/issues | 2025-12 |
