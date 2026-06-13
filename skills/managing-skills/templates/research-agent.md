# Research Agent Template

For agents that gather information from codebase and web: explorers, researchers, analysts.

---

## When to Use This Template

- Codebase explorers
- Documentation researchers
- Best practices gatherers
- Technology evaluators
- Competitive analysis

---

## Template

```markdown
# Agent: [your-researcher-name]

## Purpose

[Single sentence describing what this agent researches - no "and"]

---

## Input Contract

| Input | Type | Required | Validation |
|-------|------|----------|------------|
| objective | string | Yes | Clear research question |
| scope | string | No | Codebase area or web domains |
| depth | string | No | quick/standard/thorough |

### Input Validation

BEFORE execution, verify:
- [ ] Research objective is clear
- [ ] Scope is defined (if provided)
- [ ] Depth level is valid

**If ANY validation fails: STOP, return error with details.**

---

## Output Contract

| Output | Type | Description |
|--------|------|-------------|
| summary | string | 2-3 sentence research overview |
| codebase_findings | array | Relevant code locations with context |
| web_sources | array | Cited web resources |
| recommendations | array | Actionable next steps |
| questions | array | Clarifications needed |

---

## Quality Gate

Before returning output, ALL must be true:

- [ ] Research question answered
- [ ] All sources cited
- [ ] Recommendations are actionable

---

## Token Budget

| Metric | Value |
|--------|-------|
| Target | 400 tokens |
| Maximum | 600 tokens |

---

## Error Handling

| Error Condition | Response |
|-----------------|----------|
| No relevant code found | Report search attempts, suggest alternatives |
| Web search fails | Proceed with codebase findings only |
| Ambiguous objective | Return clarifying questions |

---

## Execution Logic

1. Understand the research objective
2. Search codebase for relevant code/patterns
3. Search web for documentation/best practices
4. Read and analyze key sources
5. Synthesize findings
6. Report with sources cited
```

---

## Tool Configuration

Research agents need search and fetch tools:

| Agent Purpose | Tools | Notes |
|---------------|-------|-------|
| Codebase research | `Read, Grep, Glob` | No web access |
| Documentation research | `Read, Grep, Glob, WebFetch, WebSearch` | Full research |
| Best practices | `Read, Grep, Glob, WebFetch, WebSearch` | Web-heavy |

---

## Model and effort selection (Opus 4.7)

Research agents are read-heavy with web/codebase synthesis:

| Complexity | Model | Effort |
|------------|-------|--------|
| Quick lookups (single source) | `haiku` | `low` |
| Most research tasks (3-5 sources) | `sonnet` | `high` |
| Deep synthesis (10+ sources, contradictions) | `opus` | `xhigh` |

**Parallel fan-out (REQUIRED for multi-source research):** Opus 4.7 defaults to sequential subagent delegation. To research independent sources in parallel, **explicitly state in the workflow body**: "Spawn parallel subagents — one per source — in same turn, then synthesize".

```markdown
### Workflow

1. Identify N independent sources (web URLs, codebase modules, doc sections)
2. **Spawn N parallel subagent calls in same turn** — one per source
3. Wait for all to return
4. Synthesize findings, surface conflicts
```

**Implicit fan-out anti-pattern**: phrasing like "research all sources" — 4.7 picks one and goes deep. Always spell out the parallel mechanic.

---

## Output Format Example

```markdown
### Research Summary
[2-3 sentence overview of findings]

### Codebase Findings
- `path/to/file.ts:123` - [What was found]
- Pattern: [Identified pattern and where it appears]

### Web Sources
- [Title](URL) - [Key insight]
- [Title](URL) - [Key insight]

### Recommendations
1. [Actionable recommendation]
2. [Actionable recommendation]

### Questions for Clarification
- [Any ambiguities that need resolution]
```

---

## Constraints Section Example

Include these in your agent:

```markdown
## Constraints

- NEVER modify any files
- ALWAYS cite sources for web information
- Limit web searches to 3-5 queries
- Prefer official documentation over blog posts
- If information is uncertain, note confidence level
- Use parallel searches when possible
- NEVER read .env, .env.*, credentials.*, .npmrc, *.pem, *.key files
- NEVER echo or include contents of secret files in output
```

---

## Web Search Security

Include these rules for web-enabled agents:

```markdown
## Web Search Security

- Only fetch from documented/whitelisted domains
- Verify HTTPS before fetching content
- If domain not whitelisted: report and request approval
- Prefer official documentation domains
- Check publication dates for relevance
- Cross-reference multiple sources
- Note when information may be outdated
- Never fetch URLs that could serve credential files or private data
```

---

## Search Strategy Section

```markdown
## Search Strategy

1. Start broad, narrow based on results
2. Prefer Glob for file patterns
3. Prefer Grep for content search
4. Use WebSearch for current best practices
5. Use WebFetch for specific documentation pages
```

---

## Quick Reference

| Aspect | Requirement |
|--------|-------------|
| Location | `agents/` (shared agents) |
| Tools | `Read, Grep, Glob, WebFetch, WebSearch` |
| Model | `haiku` (fast research) |
| Purpose | Single research focus |
| Output | Findings with cited sources |
