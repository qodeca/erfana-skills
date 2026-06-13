# Agent Template

XML-structured template for creating agents. XML is **recommended** - XML tags help Claude parse and follow structured instructions more reliably by providing clear section boundaries.

---

## YAML Frontmatter

All agents require YAML frontmatter for Claude Code integration:

```yaml
---
name: agent-name
description: MUST BE USED to <action> when <condition>. Use PROACTIVELY <trigger>.
tools: Read, Grep, Glob
model: sonnet
capabilities: [capability-1, capability-2]
---
```

### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Lowercase, hyphens, max 64 chars (must match filename) |
| `description` | Yes | Auto-delegation trigger; include "MUST BE USED" or "PROACTIVELY". Combined with `when_to_use`: ≤1,536 chars |
| `tools` | No | Comma-separated list; **omit = inherits ALL tools (security risk)** |
| `model` | **Recommended** | `haiku`, `sonnet`, `opus`, or `inherit` — see Model Selection Guide in `shared-agent-template.md` |
| `effort` | **Recommended** | `low`, `medium`, `high`, `xhigh`, `max` — per https://platform.claude.com/docs/en/build-with-claude/effort |
| `permissionMode` | No | `default`, `acceptEdits`, `bypassPermissions`, `plan` |
| `capabilities` | **Yes** | ⛔ BLOCKING - Required for dynamic agent discovery and matching |

### Capabilities Field (REQUIRED)

The `capabilities` field enables dynamic agent selection. Without it, the agent cannot be discovered by Phase 0.5 matching.

**Use standardized capability vocabulary:**

| Category | Capabilities |
|----------|--------------|
| Code | `code-search`, `code-generation`, `code-review`, `code-analysis` |
| Architecture | `architecture-design`, `architecture-review`, `anti-pattern-detection` |
| Files | `file-search`, `file-editing`, `codebase-exploration`, `pattern-matching` |
| Research | `web-search`, `prior-art-research`, `documentation-lookup` |
| Infrastructure | `git-operations`, `gh-cli`, `test-execution`, `validation` |
| Analysis | `requirements-analysis`, `security-scanning`, `quality-assessment` |
| Content | `documentation-generation`, `issue-drafting`, `template-application` |
| Interaction | `user-interaction`, `demonstration` |

**Example:**
```yaml
capabilities: [code-search, code-analysis, architecture-review]
```

### Model Selection

| Model | Use For |
|-------|---------|
| `haiku` | Fast exploration, simple analysis, low-latency tasks |
| `sonnet` | Code implementation, balanced tasks (default) |
| `opus` | Architecture, security, critical reasoning |
| `inherit` | Match parent conversation model |

### Tool Sets by Agent Type

| Type | Tools |
|------|-------|
| Read-only | `Read, Grep, Glob` |
| Research | `Read, Grep, Glob, WebFetch, WebSearch` |
| Code writer | `Read, Write, Edit, Bash, Glob, Grep` |
| Documentation | `Read, Write, Edit, Glob, Grep` |

---

## ⚠️ CRITICAL Limitations

**All agents have these hard constraints:**

- ❌ **No Task tool** - Agents cannot spawn other agents (Task is unavailable)
- ❌ **No AskUserQuestion** - Silently filtered; gather requirements before delegation
- ❌ **Never omit tools** - Omitting inherits ALL tools (security risk)

**Opus 4.7 deprecated APIs (return 400 error):**

- ❌ **`temperature` / `top_p` / `top_k`** - Per Anthropic migration guide, returns 400 on Opus 4.7
- ❌ **`thinking: {type: "enabled", budget_tokens: N}`** - Fixed budgets removed; use `{type: "adaptive"}` + `effort` field

**4.7 prose anti-patterns (silently degrade behavior):**

- ❌ "Always verify / double-check before returning" on routine steps — 4.7 self-verifies; scaffolding wastes tokens
- ❌ Implicit fan-out — 4.7 defaults to sequential; spell out parallel explicitly
- ❌ Filter-at-find-time in reviewer agents — enumerate findings first, filter in second pass

---

## Canonical XML tags

All agents SHOULD use these XML tags. Claude is trained to parse this structure.

| Tag | Required | Purpose |
|-----|----------|---------|
| `<context>` | **Yes** | Role, domain expertise, tools, mission |
| `<task>` | **Yes** | Single-sentence description of WHAT to accomplish |
| `<workflow>` | **Yes** | Numbered steps with tool examples |
| `<constraints>` | **Yes** | NEVER/ALWAYS rules - hard boundaries |
| `<output>` | **Yes** | Exact format specification (prefer JSON) |
| `<input_contract>` | **Yes** | Expected inputs with types and validation |
| `<critical_thinking>` | Recommended | Alternatives, edge cases, adaptation (advisory) |
| `<quality_gate>` | **Yes** | Testable pass/fail criteria before returning (blocking). Note: quality gate = testable pass/fail criteria (blocking); critical thinking = deliberation about approaches (advisory). |
| `<bash_constraints>` | **If Bash** | ALLOWED/NEVER lists for shell commands |
| `<file_restrictions>` | **If Write/Edit** | Allowed paths and forbidden paths |
| `<examples>` | Optional | Input/output pairs for pattern recognition |
| `<error_handling>` | Optional | Specific error conditions and responses |

---

## Template

```markdown
---
name: [agent-name]
description: MUST BE USED to [action] when [condition]. Use PROACTIVELY [trigger].
tools: [tool1, tool2, tool3]
model: sonnet
capabilities: [capability-1, capability-2, capability-3]
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

> **Note:** When spawning this agent via the Agent tool, use `subagent_type: "agent-name"`. Only registered agents (builtin or in `agents/`) can be dispatched.

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

**Rejection guards (REQUIRED):**
⛔ STOP and return error if:
- [Required input] is missing or empty
- [Enum input] has unsupported value (e.g., spec_tier == T1 when only T2+ supported)
- [Path input] does not exist or is not readable

Agents MUST reject unsupported inputs at workflow start, not fail mid-execution.

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

**PATH HANDLING (NON-NEGOTIABLE):**
- ALWAYS use absolute paths in tool calls – use `{project_path}/target` not `./target` or `target/`
- Agent CWD may reset between tool calls – relative paths cause silent failures
- All file paths in workflow MUST reference variables from `<input_contract>` (e.g., `{project_path}`)
</constraints>

<!-- Include if Bash in tools -->
<bash_constraints>
**ALLOWED:**
- [command1] - [purpose]
- [command2] - [purpose]

**NEVER:**
- rm -rf - no recursive deletion
- curl, wget - no network downloads
- sudo - no privilege escalation
</bash_constraints>

<!-- Include if Write or Edit in tools -->
<file_restrictions>
**ALLOWED PATHS:**
- `{skill_path}/` - skill directory
- `{skill_path}/agents/` - agent files

**NEVER MODIFY:**
- Files outside skill directory
- System configuration files
- `.env`, credentials, secrets
</file_restrictions>

<critical_thinking>
Alternatives:
- [Approach A] vs [Approach B]: chose [A] because [reason]
- Trade-off: [what was sacrificed for what gain]

Edge cases:
- [Edge case 1]: [handling strategy]
- [Edge case 2]: [handling strategy]
- [Edge case 3]: [handling strategy]

Adapt:
- If [finding], then [pivot strategy]
- Escalate to skill when [condition]
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

**For agents used in automated pipelines:** Declare the deterministic output path derived from input_contract variables. Example: `Write to {project_path}/specs/{spec_slug}/testing/001-design.md`. Skills need predictable paths to capture agent outputs.
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

## Tag Writing Guide

### `<context>` – WHO + resources + mission
```xml
<!-- Good --> <context>Skill validator specialized in QA for Claude Code skills.
Tools: Read, Grep, Glob. Mission: Ensure skills meet all requirements before release.</context>
<!-- Bad -->  <context>A helpful assistant that validates things.</context>
```

### `<task>` – Single sentence, no "and"
```xml
<!-- Good --> <task>Validate skill directory against pre-release and security checklists.</task>
<!-- Bad -->  <task>Validate skill files and fix any issues found and generate a report.</task>
```

### `<workflow>` – Numbered steps with tool examples
```xml
<workflow>
1. Load skill structure
   `Read {skill_path}/SKILL.md` → parse frontmatter
2. Validate architecture – ⛔ STOP if ANY fails
3. Run remaining validations (Sections 2-10)
4. Calculate final scores (weighted sums)
5. Return structured results
</workflow>
```

### `<constraints>` – NEVER / ALWAYS / MUST keywords
```xml
<constraints>
NEVER:
- Pass a skill with architectural failures: compromises ecosystem
- Skip isolation checks: security-critical
ALWAYS:
- Read files before judging: prevents hallucinated assessments
- Cite file:line for each finding: enables verification
MUST:
- Calculate scores accurately with correct weights
</constraints>
```

### `<critical_thinking>` – Alternatives, edge cases, adaptation
```xml
<critical_thinking>
Alternatives:
- Stop-early vs run-all: chose stop-early for efficiency
- Strict vs lenient scoring: chose strict to maintain quality bar
Edge cases:
- No agents/ dir but inline definitions: flag, don't auto-fail
- Valid YAML but missing fields: report as metadata failure
Adapt:
- If Section 1 fails, skip detailed validation and report critical issues
</critical_thinking>
```

### `<output>` – Exact format (JSON preferred)
```xml
<output>
Return exactly:
{"passed": bool, "pre_release_score": {"total": N, "max": 55, "percentage": N},
 "security_score": {"total": N, "max": 81, "percentage": N},
 "failures": [{"section": str, "item": str, "severity": "critical|high|medium", "fix": str}],
 "warnings": [str], "recommendations": [str]}
</output>
```

### `<quality_gate>` – All must be true before returning
```xml
<quality_gate>
Before returning, ALL must be true:
- [ ] All checklist sections evaluated (none skipped)
- [ ] Scores calculated with correct section weights
- [ ] Every failure includes actionable fix
- [ ] Output matches exact JSON schema
On failure: Log which criteria failed, return structured error.
</quality_gate>
```

---

## Complete Example

For a complete working example, see `agents/ms-requirements-validator.md`, which demonstrates all required tags, proper frontmatter, and quality gates.

---

## Template Checklist

Before using an agent, verify:

### Critical Limitations (BLOCKING)
- [ ] No Task tool in tools list (agents cannot spawn agents)
- [ ] No AskUserQuestion in tools list (silently filtered)
- [ ] Tools field explicitly listed (not omitted)

### XML Structure (Recommended)
- [ ] All 5 required tags present: `<context>`, `<task>`, `<workflow>`, `<constraints>`, `<output>`
- [ ] Tags are properly closed and not nested incorrectly
- [ ] No markdown headers (##) used for structure - use XML tags only

### Context Tag
- [ ] Defines specific role, not generic "assistant"
- [ ] Lists tools explicitly
- [ ] States clear mission/outcome

### Task Tag
- [ ] Single sentence without "and"
- [ ] Describes WHAT, not HOW
- [ ] Passes the "can I verify completion?" test

### Workflow Tag
- [ ] Numbered steps (not bullets)
- [ ] Each step includes tool example where applicable
- [ ] Verification checkpoints included
- [ ] ⛔ STOP markers for critical gates

### Constraints Tag
- [ ] Uses NEVER/ALWAYS/MUST keywords
- [ ] Each constraint includes rationale or consequence
- [ ] No vague language ("be careful", "try to")

### Output Tag
- [ ] Exact format specified (JSON preferred)
- [ ] All fields defined with types
- [ ] Matches what workflow produces

### Tool-Specific Tags
- [ ] If Bash in tools: `<bash_constraints>` with ALLOWED/NEVER lists
- [ ] If Write/Edit in tools: `<file_restrictions>` with allowed paths

### Required Tags (additional)
- [ ] `<input_contract>` with validation rules and rejection guards (⛔ BLOCKING)
- [ ] `<quality_gate>` with testable pass/fail criteria (⛔ BLOCKING)

### Recommended Tags
- [ ] `<critical_thinking>` with Alternatives, Edge cases, Adapt

### YAML Frontmatter
- [ ] name matches filename (lowercase, hyphens)
- [ ] description includes trigger phrase
- [ ] tools explicitly listed (not omitted)
- [ ] model specified
- [ ] capabilities listed using standardized vocabulary (⛔ BLOCKING)

### Isolation
- [ ] No references to other skills
- [ ] Only uses agents from valid sources (builtin or shared)
- [ ] Shared agents stored at `agents/`

---

## Quick Reference

| Aspect | Requirement |
|--------|-------------|
| Structure | XML tags (mandatory) |
| Location | `agents/` (shared agents) |
| Naming | lowercase, hyphens, verb-noun pattern |
| Required tags | `<context>`, `<task>`, `<workflow>`, `<constraints>`, `<output>`, `<input_contract>`, `<quality_gate>` |
| Capabilities | ⛔ BLOCKING - Required in frontmatter for discovery |
| Task | Single sentence, no "and" |
| Workflow | Numbered steps with tool examples |
| Constraints | NEVER/ALWAYS/MUST keywords |
| Output | JSON format preferred |
