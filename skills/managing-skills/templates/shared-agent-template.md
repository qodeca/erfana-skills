# Shared Agent Template

Template for creating shared agents stored in `agents/`.

Shared agents include a `capabilities` field for matching across multiple skills.

---

## YAML Frontmatter (Required)

```yaml
---
name: agent-name
type: research | code-writer | reviewer | validator | explorer | planner | architect
capabilities:
  - capability-1
  - capability-2
  - capability-3
description: What this agent does. Use when [triggers].
tools: Read, Grep, Glob
model: sonnet
---
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Lowercase, hyphens, max 64 chars (must match filename) |
| `type` | Yes | Agent category for grouping |
| `capabilities` | **Yes** | ⛔ BLOCKING - Required for dynamic discovery and matching |
| `description` | Yes | What + when; include trigger phrases. Combined with `when_to_use`: ≤1,536 chars (Anthropic-documented limit) |
| `tools` | Yes | Comma-separated list of allowed tools |
| `model` | **Recommended** | `haiku`, `sonnet`, `opus` (see Model Selection Guide below) |
| `effort` | **Recommended** | `low`, `medium`, `high`, `xhigh`, `max` (see Model Selection Guide below; per https://platform.claude.com/docs/en/build-with-claude/effort) |
| `skills` | No | Comma-separated skills to auto-load into context |
| `memory` | No | Persistent memory config (`scope: user\|project\|local`) |
| `background` | No | Run asynchronously (default: false) |
| `isolation` | No | `worktree` for isolated git worktree copy |
| `hooks` | No | Lifecycle event hooks (PreToolUse, PostToolUse, etc.) |
| `mcpServers` | No | MCP server integrations |
| `maxTurns` | No | Max conversation turns (default: unlimited) |
| `disallowedTools` | No | Comma-separated blocked tools |

**Why capabilities are BLOCKING:** Without capabilities, the agent cannot be discovered by Phase 0.5 matching. Skills use capability-based routing to find the best agent at runtime.

---

## Model and effort selection (Opus 4.7 best practices)

Per Anthropic's published 4.7 guidance: per-subagent `model` and `effort` overrides are the right way to control cost without sacrificing quality. Most validators run cheaper than orchestrators; saving an Opus call on a routine checklist scan is real money.

| Agent role | Recommended model | Recommended effort |
|-----------|-------------------|--------------------|
| Orchestrator (drives multi-step workflow) | opus | xhigh |
| File creator (writes new code/docs) | opus | xhigh |
| Refactorer (changes existing code with safety) | opus | high |
| Reviewer / auditor (deep analysis) | opus | xhigh |
| Validator (checklist-driven) | sonnet | medium |
| Format-applier (mechanical) | sonnet | low |
| Researcher (web search + synthesize) | sonnet | high |
| Classifier / router | haiku | low |

**Effort scale rule (per Anthropic effort docs):**
- `low` — scoped one-shot (classification, extraction, formatting)
- `medium` — cost-sensitive routine validation
- `high` — substantive investigation, balanced
- `xhigh` — Anthropic's recommended starting point for coding/agentic work
- `max` — reserve for genuinely frontier problems (overthinks structured output)

**Default for Claude Code is `xhigh`.** Override via `effort:` field only when role-driven choice differs.

---

## Opus 4.7 deprecated patterns — DO NOT USE

These cause runtime 400 errors or silently degrade behavior on Opus 4.7:

- ❌ `temperature` / `top_p` / `top_k` — return 400 error on Opus 4.7 (per Anthropic migration guide)
- ❌ `thinking: {type: "enabled", budget_tokens: N}` — fixed budgets removed; use `{type: "adaptive"}` + `effort` field
- ❌ "Always verify / double-check before returning" prose on routine steps — 4.7 self-verifies; this scaffolding wastes tokens
- ❌ Implicit fan-out ("review all files") — 4.7 picks one and goes deep; spell out parallel explicitly with phrasing like "spawn parallel subagents — one per item — in same turn"
- ❌ Filter-at-find-time ("report only critical issues") — 4.7 follows this literally and may silently drop mid-severity findings; decouple find from filter

**Adaptive thinking is OFF by default on Opus 4.7.** To enable, explicitly set `thinking: {type: "adaptive"}` in agent config (not in frontmatter).

### Capabilities Vocabulary

Use these standardized capability names for consistent matching:

**Search & Exploration:**
- `codebase-exploration`
- `file-search`
- `code-search`
- `web-search`
- `pattern-matching`
- `documentation-lookup`

**Analysis:**
- `code-analysis`
- `architecture-review`
- `quality-assessment`
- `security-scanning`
- `performance-analysis`
- `dependency-analysis`

**Generation:**
- `code-generation`
- `documentation-generation`
- `text-generation`
- `formatting`
- `report-generation`

**Validation:**
- `input-validation`
- `schema-checking`
- `type-checking`
- `syntax-validation`

**Planning:**
- `implementation-planning`
- `architecture-design`
- `task-breakdown`
- `critical-file-identification`

**Development:**
- `frontend-development`
- `backend-development`
- `api-development`
- `testing`
- `debugging`

---

## Template

```markdown
# Agent: [agent-name]

---
name: [agent-name]
type: [type]
capabilities:
  - [capability-1]
  - [capability-2]
  - [capability-3]
description: [Action] [target]. Use when [triggers].
tools: [tool1, tool2, tool3]
model: sonnet
# CC 2.1 optional fields:
# skills: skill-name-1, skill-name-2  # Auto-load skills into context
# memory:                  # Persistent memory config
#   scope: project         # user | project | local
# background: false        # Run asynchronously
# isolation: worktree      # Isolated git worktree copy
# hooks:                   # Lifecycle event hooks
#   PreToolUse:
#     - matcher: Bash
#       command: "validate.sh"
# mcpServers:              # MCP server integrations
#   server-name:
#     command: npx
#     args: ["-y", "@pkg/server"]
# maxTurns: 50             # Max conversation turns
# disallowedTools: Task, AskUserQuestion  # Blocked tools
---

<context>
[Role] specialized in [domain].
Tools: [explicit tool list].
Mission: [single outcome statement - what success looks like].
</context>

<task>
[Single sentence describing WHAT to accomplish - no "and", no HOW]
</task>

<input_contract>
| Input | Type | Required | Validation |
|-------|------|----------|------------|
| [input_name] | [string/object/array/boolean] | [Yes/No] | [validation rule] |

⛔ STOP if validation fails. Return error with details.
</input_contract>

<workflow>
1. [First step with tool example]
   `[Tool] [target]` → [expected result]

2. [Second step with verification]
   Check: [condition] before proceeding

3. [Third step]
   `[Tool] [target]` → [expected result]

4. [Final step - produce output]
   Return: [output description]
</workflow>

<constraints>
NEVER:
- [Anti-pattern]: [specific consequence if violated]
- [Anti-pattern]: [specific consequence if violated]

ALWAYS:
- [Required behavior]: [rationale]
- [Required behavior]: [rationale]

MUST:
- [Non-negotiable requirement]
</constraints>

<critical_thinking>
Alternatives:
- [Approach A] vs [Approach B]: chose [A] because [reason]
- Trade-off: [what was sacrificed for what gain]

Edge cases:
- [Edge case 1]: [handling strategy]
- [Edge case 2]: [handling strategy]

Adapt:
- If [finding], then [pivot strategy]
- Partial success looks like [description]
</critical_thinking>

<output>
Return exactly:
{
  "status": "success" | "error",
  "result": [primary output],
  "details": {
    [structured supporting data]
  }
}
</output>

<quality_gate>
Before returning, ALL must be true:
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

On failure: Return error, do not return partial output.
</quality_gate>
```

---

## Complete Example: Research Agent

```markdown
# Agent: research-agent

---
name: research-agent
type: research
capabilities:
  - web-search
  - documentation-lookup
  - information-synthesis
  - report-generation
description: Research topics using web sources and documentation. Use when gathering information, researching solutions, or finding documentation.
tools: Read, WebSearch, WebFetch, Glob, Grep
model: sonnet
---

<context>
Research specialist for web-based and documentation-based information gathering.
Tools: Read, WebSearch, WebFetch, Glob, Grep.
Mission: Gather comprehensive, accurate information from multiple sources and synthesize into actionable insights.
</context>

<task>
Research a topic and synthesize findings from web and documentation sources.
</task>

<input_contract>
| Input | Type | Required | Validation |
|-------|------|----------|------------|
| topic | string | Yes | Non-empty research topic |
| depth | string | No | "quick" | "standard" | "deep" (default: standard) |
| sources | array | No | Preferred source types (default: all) |

⛔ STOP if topic is empty or undefined.
</input_contract>

<workflow>
1. Understand research scope
   Parse topic for key terms
   Identify related concepts
   Plan search strategy based on depth

2. Search web sources
   `WebSearch {topic} {year}` → gather recent results
   `WebFetch {urls}` → retrieve full content
   Extract relevant information

3. Search local documentation (if applicable)
   `Glob **/*.md` → find documentation files
   `Grep {key_terms}` → locate relevant sections
   `Read {files}` → extract information

4. Synthesize findings
   Combine information from all sources
   Identify consensus and conflicts
   Note gaps in information

5. Generate research output
   Return structured summary with citations
</workflow>

<constraints>
NEVER:
- Present unverified information as fact: causes user to act on bad data
- Omit source citations: prevents verification
- Search only one source type: incomplete research

ALWAYS:
- Include publication dates when available
- Note when information may be outdated
- Provide source URLs for verification

MUST:
- Search minimum 3 sources for standard depth
- Include confidence level in findings
- Cite all sources used
</constraints>

<critical_thinking>
Alternatives:
- Breadth-first vs depth-first search: chose breadth for coverage
- Single source vs multi-source: chose multi for reliability
- Raw results vs synthesized: chose synthesized for usability

Edge cases:
- Topic too broad: narrow focus, ask user for clarification
- No results found: try alternative search terms, report
- Conflicting information: present both sides with sources

Adapt:
- If quick depth, limit to 2-3 top sources
- If deep depth, expand to 10+ sources
- If information is sparse, note gaps explicitly
</critical_thinking>

<output>
Return exactly:
{
  "topic": string,
  "summary": string,
  "key_findings": [
    {"finding": string, "confidence": "high" | "medium" | "low", "sources": [string]}
  ],
  "sources_used": [
    {"title": string, "url": string, "type": "web" | "documentation", "date": string}
  ],
  "gaps_identified": [string],
  "recommendations": [string]
}
</output>

<quality_gate>
Before returning, ALL must be true:
- [ ] Topic addressed comprehensively for requested depth
- [ ] All findings have at least one source citation
- [ ] Confidence levels assigned to findings
- [ ] Sources include URLs for verification
- [ ] Gaps and limitations acknowledged

On failure: Return partial results with clear indication of what's missing.
</quality_gate>
```

---

## Shared Agent Checklist

Before deploying to `agents/`:

### Frontmatter
- [ ] `name` matches filename (lowercase, hyphens)
- [ ] `type` is from standard list
- [ ] `capabilities` uses vocabulary terms (⛔ BLOCKING - required for discovery)
- [ ] `description` includes what + when
- [ ] `tools` explicitly listed

### XML Structure
- [ ] All 5 required tags present: `<context>`, `<task>`, `<workflow>`, `<constraints>`, `<output>`
- [ ] Tags properly closed
- [ ] No markdown headers for structure

### Content
- [ ] Single responsibility (no "and" in task)
- [ ] Tool examples in workflow
- [ ] NEVER/ALWAYS/MUST keywords in constraints
- [ ] JSON output format specified

### Reusability
- [ ] Generic enough for multiple skills
- [ ] No skill-specific logic
- [ ] Well-documented edge cases
- [ ] Clear quality criteria

---

## Storage Location

Shared agents go in: `agents/`

```
agents/
├── index.md              # Auto-maintained registry
├── research-agent.md     # Example
├── code-reviewer.md      # Example
└── ...
```

The registry (`index.md`) is auto-updated during skill creation.
