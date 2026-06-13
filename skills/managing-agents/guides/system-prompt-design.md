# Designing effective agent prompts

## Contents
- Choosing a template: XML vs markdown
- Description as trigger engine
- The XML template; Core principles
- Examples: Bad vs Good; Common mistakes
- Scope exclusions; What NOT to focus on; Tone; See also

Best practices for writing agent system prompts based on Anthropic documentation, prompt engineering research, and analysis of 17+ Anthropic official plugin agents.

## Choosing a template: XML vs markdown

Two valid approaches, chosen based on agent complexity:

| Template | When to use | Token overhead | Reference |
|----------|-------------|----------------|-----------|
| **Markdown** | Simple-to-medium agents (<100 lines), straightforward workflows | Low | `templates/agent-template-markdown.md` |
| **XML** | Complex agents (100+ lines), nested constraints, bash whitelists, multi-stakeholder | Higher (+200-400 tokens) | `templates/agent-template-xml.md` |

Anthropic's own production agents prove markdown works well:
- feature-dev:code-reviewer – 47 lines, markdown, highly effective
- postman:readiness-analyzer – 226 lines, markdown, most sophisticated agent analyzed

**Rule of thumb:** Start with markdown. Move to XML only if you need nested sections or the agent exceeds 100 lines.

## Description as trigger engine

Agent descriptions drive auto-delegation routing. A description must be **trigger-shaped** – it has to say *when* to use the agent, not just what it does. Two forms are valid, and you may combine them:

```yaml
# Prose form (matches Anthropic's current subagents docs)
description: Expert code reviewer. Use proactively immediately after writing or modifying code to check quality, security, and maintainability.

# Example-block form (matches Anthropic plugin-dev, hookify, superpowers agents)
description: |
  Use this agent when the user asks to "review code", "check quality", or has completed an implementation.

  <example>
  Context: User finished implementing a feature
  user: "I've finished the auth module, can you review it?"
  assistant: "I'll use the code-reviewer agent to review the module."
  <commentary>User completed implementation – trigger review agent.</commentary>
  </example>
```

**Both work.** The prose form pairs an action-oriented role with an explicit "Use proactively…/Use when…" trigger – Anthropic's current subagent examples use exactly this. The example-block form lets the router match concrete scenarios semantically. What fails is a description with **no** trigger at all (just "what it does"), regardless of form.

Requirements (either form):
- A clear "when to use" signal: an action-oriented "Use proactively…/Use when…" clause, **or** 2-4 `<example>` blocks
- For the example form: each example has Context, user, assistant, `<commentary>`; show different phrasings and triggering scenarios
- Third-person or imperative voice (never "I can help…" / "You can use…")

## The XML template

Modern Claude models respond exceptionally well to XML-structured prompts. The canonical skeleton lives in the template files — copy from there rather than hand-rebuilding it:

- `../templates/agent-template-xml.md` — full `<context>` / `<task>` / `<workflow>` / `<constraints>` / `<output_format>` skeleton for complex agents
- `../templates/agent-template-markdown.md` — the markdown-first form for simple-to-medium agents

At a glance, the XML form nests five sections: `<context>` (who/domain/tools), `<task>` (single-sentence mission), `<workflow>` (numbered concrete steps with tool calls), `<constraints>` (NEVER/ALWAYS rules), and `<output_format>` (exact return structure).

## Core principles

### 1. Structure over length

A well-structured 50-word prompt beats a rambling 500-word one.

| Bad | Good |
|-----|------|
| "I want you to help me analyze code. It's a complex codebase with many files, so please be thorough but also concise. Look for bugs but also style issues. The code is TypeScript." | `<task>Analyze TypeScript code for bugs and style issues.</task>` |

### 2. Let Claude design your prompts

LLMs are better at writing prompts than humans. Start with:

> "Design an agent prompt for [task] using XML structure with context, task, workflow, constraints, and output_format sections."

Then refine the result.

### 3. Be specific with tools

```xml
<!-- Good: Concrete tool usage -->
<workflow>
1. Glob("**/*.{ts,tsx}") to find TypeScript files
2. Grep("TODO|FIXME", "-i") for action items
3. Read each flagged file for context
</workflow>

<!-- Bad: Vague instructions -->
<workflow>
1. Search for files
2. Look for issues
3. Read relevant code
</workflow>
```

### 4. Use emphasis keywords strategically

Per Anthropic, keywords like `IMPORTANT`, `YOU MUST`, `NEVER`, `ALWAYS` increase adherence:

```xml
<constraints>
- IMPORTANT: Never modify files without reading them first
- YOU MUST include file:line references in all findings
- NEVER skip the verification step
- ALWAYS ask if scope exceeds 50 files
</constraints>
```

### 5. Token efficiency

Agent definitions MUST be token efficient — concise but complete. Heavy agents (25k+ tokens) create bottlenecks in multi-agent workflows.

## Examples: Bad vs Good

### Example 1: Code reviewer

**Bad (vague, unstructured):**
```
You are a code reviewer. Your job is to review code.
Look for code quality, security issues, and style.
Give feedback.
```

**Good (XML-structured):**
```xml
<context>
You are a senior code reviewer with Read, Grep, Glob tools. You review for quality, security, and maintainability.
</context>

<task>
Review code changes and provide prioritized, actionable feedback.
</task>

<workflow>
1. Run git diff to see changes
2. Read modified files
3. Analyze each change for issues
4. Prioritize findings by severity
</workflow>

<constraints>
- NEVER modify files
- ALWAYS cite line numbers
- If >20 files, ask to prioritize
</constraints>

<output_format>
### Critical (must fix)
- `file:line` - [Issue]

### Warnings (should fix)
- `file:line` - [Issue]
</output_format>
```

### Example 2: Documentation updater

**Bad (vague, no structure):**
```
You update documentation. When files change, update the docs to match. Be helpful.
```

**Good (XML-structured):**
```xml
<context>
You are a documentation specialist with Read, Write, Edit, Glob tools. You maintain accurate, concise docs.
</context>

<task>
Update documentation to reflect recent code changes.
</task>

<workflow>
1. Glob("docs/**/*.md") to list docs
2. Read each doc and identify outdated sections
3. Check corresponding code for current behavior
4. Edit docs to match code
5. Verify no broken links
</workflow>

<constraints>
- NEVER remove content without replacement
- ALWAYS preserve existing doc structure
- If unsure about behavior, check tests
</constraints>

<output_format>
### Updated
- `docs/api.md` - Updated endpoint descriptions

### Needs Review
- `docs/setup.md` - Unclear what changed, flagged for human review
</output_format>
```

## Common mistakes

| Mistake | Fix |
|---------|-----|
| Vague task | Single, specific sentence in `<task>` |
| No output format | Exact structure in `<output_format>` |
| Missing constraints | Add NEVER/ALWAYS rules in `<constraints>` |
| Token inefficient | Keep concise, avoid verbose descriptions |
| No tool guidance | Concrete tool examples in `<workflow>` |

## Scope exclusions

For narrow-domain agents (reviewers, validators, analyzers), add a "What NOT to focus on" section to prevent scope creep:

```xml
<!-- XML format -->
<scope_exclusions>
**What NOT to focus on:**
- General code style preferences
- Issues outside this agent's domain
- Pre-existing issues not related to current changes
</scope_exclusions>
```

```markdown
## What NOT to focus on
- General code style preferences
- Issues outside this agent's domain
- Pre-existing issues not related to current changes
```

This pattern comes from Anthropic's agent-sdk-dev:agent-sdk-verifier agents which explicitly scope out general language preferences to focus on SDK-specific concerns.

## Tone

The agent's communication style significantly affects output quality. Choose based on purpose:

| Tone | Opening pattern | Best for |
|------|----------------|----------|
| `professional` | "You are a senior [role] specializing in..." | Most agents, code writers, researchers |
| `direct` | "You don't sugarcoat results. If it scores 45%, say so." | Validators, auditors, security reviewers |
| `opinionated` | "Make confident choices. Pick one approach and commit." | Architects, designers, planners |

The postman:readiness-analyzer (the most effective agent in Anthropic's plugin ecosystem) uses a direct tone. The feature-dev:code-architect uses opinionated. Most agents default to professional.

**Direct tone is not rude** – it's actionable. Compare:
- Professional: "There are some areas that could benefit from improvement in the error handling."
- Direct: "Error handling is missing on 3 endpoints. Here's what to add."

## See also

- `../templates/agent-template-xml.md` – Full XML template with customization guide
- `../templates/agent-template-markdown.md` – Markdown template for simpler agents
- `quick-start.md` – Create your first agent in 5 minutes
- [Anthropic XML tags guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/use-xml-tags)
- [Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices)
