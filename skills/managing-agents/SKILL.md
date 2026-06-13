---
name: managing-agents
description: |
  Create, review, and modify Claude Code agents following Anthropic best practices. Use when the user wants to "create an agent" (e.g. "create an agent that reviews database migrations"), "review the X agent" or "audit agent quality", "modify the X agent", or asks "how do I create a Claude Code agent?". Covers the full lifecycle – requirements, research, design, creation, validation – plus coupled doer/reviewer pairs.
when_to_use: |
  Use this skill when the user wants to:
  - "create an agent" / "build a new agent" / "make an agent that..."
  - "review the X agent" / "audit existing agents" / "check agent quality"
  - "modify the X agent" / "update agent Y to do Z"
  - Create coupled doer/reviewer pairs (orchestrator skills delegating to specialized agents)
  - Plan an agent before writing (research best practices, evaluate model selection, design tool grants)
---

# Managing Claude Code Agents

Full lifecycle management for Claude Code agents: creation, review, and modification.

---

## TL;DR (Quick Reference)

- **Create:** Run Phases 0→1→2→3→4→5 (see `guides/quick-start.md`)
- **Review:** Delegate to `ma-reviewer` agent
- **Modify:** Delegate to `ma-modifier` agent
- **Create pair:** See `guides/pair-operations.md` for doer/reviewer pair creation
- **Create companion:** See `guides/pair-operations.md` for adding a reviewer to an existing doer
- **Key rules:** Orchestrate don't execute, validate every phase, use todos
- **Pattern selection:** Evaluate Pattern 1 (main conversation), 2 (user-driven), 3 (single agent) before starting
- **Pass threshold:** Pre-release weighted ≥70% (zero critical failures), security weighted ≥70% (zero critical failures)
- **Audit trail:** All modifications tracked via TodoWrite. Major changes logged in CHANGELOG.md

---

## CRITICAL ARCHITECTURAL RULES

**ALL agents managed by this skill MUST follow these rules. NO EXCEPTIONS.**

1. Agents CANNOT spawn other agents (the spawn tool — Agent, formerly Task — is unavailable to subagents)
2. Agents CANNOT use AskUserQuestion (silently filtered, orchestrator handles Q&A)
3. Agents MUST explicitly list tools (omitting inherits ALL - security risk)
4. Agents MUST include `<critical_thinking>` section
5. Agents MUST follow principle of least privilege
6. Skill MUST act as orchestrator, NOT executor
7. ALL tasks MUST be delegated to agents
8. EVERY phase MUST have input conditions verified BEFORE proceeding
9. Phases with irreversible side-effects (file writes Phase 3 + Phase 4, agent creation, breaking modifications) MUST have post-phase validation. Routine exploration phases (Phase 0 requirements gathering, Phase 1 research) MAY skip post-step validation if agent self-verification suffices — strip "verify before returning" rituals on exploratory work per Anthropic 4.7 migration guide.
10. Phase MUST repeat until validation passes (max 3 retries, then escalate)
11. ALL outputs MUST go through quality gates
12. Skill MUST ALWAYS create todo lists for progress tracking
13. **ALL agents MUST use XML or structured markdown** (see `templates/agent-template-xml.md` for complex agents, `templates/agent-template-markdown.md` for simple-to-medium agents)
14. **ALL files MUST be under 500 lines** (⛔ BLOCKING - split or compact if exceeded)
15. **Skills MUST define Q&A requirements gathering** (⛔ BLOCKING - see `guides/qa-protocol.md`)

---

## CONTEXT PRESERVATION (HIGHEST PRIORITY)

**WHY THIS MATTERS:** The orchestrator's context window is LIMITED and SHARED with user conversation. Every task executed directly by the orchestrator consumes context that could be used for user interaction and decision-making. Agents run in SEPARATE context windows, preserving the main conversation.

### Mandatory delegation rules

| Action | Orchestrator | Agent |
|--------|--------------|-------|
| Code reading/analysis | ❌ NEVER | ✅ ALWAYS |
| File editing/writing | ❌ NEVER | ✅ ALWAYS |
| Agent creation | ❌ NEVER | ✅ ALWAYS |
| Web search/research | ❌ NEVER | ✅ ALWAYS |
| User questions (AskUserQuestion) | ✅ ONLY | ❌ CANNOT |
| Todo management (TodoWrite) | ✅ OK | ❌ N/A |
| Routing decisions | ✅ OK | ❌ N/A |

### User input pattern (agents cannot ask directly)

When agents need user input, they return `needs_user_input`:
1. Agent detects need for user decision/clarification
2. Agent returns `{status: "needs_user_input", question: {...}, context: {...}}`
3. Orchestrator uses `AskUserQuestion` with returned question
4. Orchestrator passes answer back to agent (resume) or next phase

**For patterns, see `guides/orchestration-patterns.md`.**

---

## Agents

| Agent | Purpose | Source | Effort | Model | Used In |
|-------|---------|--------|--------|-------|---------|
| `ma-requirements-gatherer` | Gather agent requirements (returns questions for orchestrator) | shared | medium | sonnet | Create: Phase 0 |
| `ma-researcher` | Online research, verify agent necessity | shared | medium | sonnet | Create: Phase 1 |
| `ma-designer` | Design name, description, model selection | shared | high | sonnet | Create: Phase 2 |
| `ma-creator` | Configure YAML frontmatter + write system prompt | shared | xhigh | opus | Create: Phase 3-4 |
| `ma-validator` | Pre-release checklist, security validation | shared | medium | sonnet | Create: Phase 5 |
| `ma-reviewer` | Audit existing agents | shared | xhigh | sonnet | Review |
| `ma-modifier` | Apply changes safely | shared | xhigh | sonnet | Modify |

---

## Todo List Requirements

**MANDATORY - No exceptions.**

### At Operation Start (CREATE)
```
TodoWrite([
  {content: "Phase 0: Gather requirements", status: "in_progress", activeForm: "Gathering requirements"},
  {content: "Phase 1: Research and validate need", status: "pending", activeForm: "Researching need"},
  {content: "Phase 2: Design agent", status: "pending", activeForm: "Designing agent"},
  {content: "Phase 3: Configure YAML", status: "pending", activeForm: "Configuring YAML"},
  {content: "Phase 4: Write system prompt", status: "pending", activeForm: "Writing prompt"},
  {content: "Phase 5: Validate and test", status: "pending", activeForm: "Validating agent"},
])
```

### At Operation Start (UPDATE)
```
TodoWrite([
  {content: "Read existing agent", status: "in_progress", activeForm: "Reading agent"},
  {content: "Identify changes needed", status: "pending", activeForm: "Identifying changes"},
  {content: "Apply modifications", status: "pending", activeForm: "Applying changes"},
  {content: "Validate updated agent", status: "pending", activeForm: "Validating agent"},
])
```

### For EVERY Phase
1. Mark phase `in_progress` BEFORE starting
2. Delegate to agent
3. Handle `needs_user_input` if returned
4. Mark phase `completed` IMMEDIATELY after quality gate passes

---

## Operation: Create

**MANDATORY: Create todo list with Phases 0-5 before starting.**

| Phase | Agent | Purpose |
|-------|-------|---------|
| 0 | `ma-requirements-gatherer` | Gather requirements (orchestrator asks returned questions) |
| 1 | `ma-researcher` | Research and validate need (orchestrator confirms findings) |
| 2 | `ma-designer` | Design agent (name, description, model) |
| 3-4 | `ma-creator` | Configure YAML + write system prompt |
| 5 | `ma-validator` | Validate against checklists |

**Handle needs_user_input:** When any agent returns `status: "needs_user_input"`, orchestrator uses `AskUserQuestion` with the returned question, then passes the answer back.

---

### Phase 0: Gather Requirements

**Input Conditions:**
- [ ] User requested agent creation
- [ ] Operation type clarified (CREATE or UPDATE)

**Delegation:**
1. Delegate to `ma-requirements-gatherer` agent
2. Agent returns `needs_user_input` with questionnaire
3. Orchestrator uses `AskUserQuestion` to ask each question
4. Pass collected answers back to agent

**Self-check (lightweight — this is an exploratory phase, no hard gate):**
- Agent purpose identified
- Trigger type determined (auto-delegation / manual only / both)
- Permission level decided (read-only / read + edit / full)
- For UPDATE: issue type and change scope identified

If a required detail is still missing, escalate to the user with the specific gap rather than looping.

---

### Phase 1: Research and Validate Need

**Input Conditions:**
- [ ] Requirements gathered from Phase 0
- [ ] Agent purpose is clear

**Delegation:**
1. Delegate to `ma-researcher` agent with requirements
2. Agent performs online research (WebSearch, WebFetch)
3. Agent evaluates "When NOT to Create" scenarios:
   - One-time task → Main conversation
   - Multi-agent orchestration → Main conversation
   - Simple command with args → Slash command
4. Agent returns research findings + recommendation

**Handle needs_user_input:**
- If agent finds scenario matches "When NOT to Create"
- Agent returns `needs_user_input` with confirmation question
- Orchestrator asks user whether to proceed

**Self-check (lightweight — this is an exploratory phase, no hard gate):**
- Online research completed
- "When NOT to Create" scenarios evaluated
- User confirmed agent is needed (if scenario matched)
- Tool requirements documented

If research is inconclusive or a "When NOT to Create" scenario matches, escalate to the user with the findings rather than looping.

---

### Phase 2: Design Agent

**Input Conditions:**
- [ ] Requirements and research from Phases 0-1 available
- [ ] Agent creation confirmed

**Delegation:**
1. Delegate to `ma-designer` agent with requirements + research
2. Agent designs:
   - Name (kebab-case, ≤64 chars)
   - Description that is trigger-shaped: action-oriented prose ("Use proactively…" / "Use when…") or an opening line + 2-4 `<example>` blocks (both forms are valid)
   - Model selection (returns `needs_user_input` for user choice)

**Handle needs_user_input:**
- Agent returns model selection question
- Orchestrator asks user to choose (haiku/sonnet/opus/inherit)

**Quality Gate (verify before passing to next phase):**
- [ ] Name follows kebab-case, ≤64 chars
- [ ] Description is trigger-shaped: action-oriented prose ("Use proactively…" / "Use when…") or 2-4 `<example>` blocks
- [ ] Model selected by user

**Retry Logic:**
- Max 3 retries if quality gate fails
- If still failing: escalate to user with design rationale

---

### Phase 3-4: Configure YAML + Write System Prompt

**Input Conditions:**
- [ ] Agent design from Phase 2 available
- [ ] Name, description, model determined

**Delegation:**
1. Delegate to `ma-creator` agent with design specs
2. Agent configures:
   - YAML frontmatter (name, description, tools/disallowedTools, model, effort; permissionMode is ignored for plugin-distributed agents)
   - System prompt using XML template
   - Tool constraints (if Bash in tools)
   - File operation restrictions (if Write/Edit in tools)
3. Agent creates agent file at correct location

**Quality Gate:**
⛔ STOP if ANY unchecked:
- [ ] Filename matches `name` field
- [ ] Tools explicitly listed (not omitted)
- [ ] No `Agent` (or the legacy `Task`) or `AskUserQuestion` in tools
- [ ] XML structure used in system prompt
- [ ] `<critical_thinking>` section present
- [ ] Workflow includes "consider alternatives" step
- [ ] No secrets in prompt
- [ ] If Bash: constraints defined
- [ ] If Write/Edit: file restrictions defined
- [ ] Agent file written to correct location

**Retry Logic:**
- Max 3 retries if quality gate fails
- If still failing: escalate to user with creation details

---

### Phase 5: Validate and Test

**Input Conditions:**
- [ ] Agent file created in Phase 3-4
- [ ] Agent file exists at expected location

**Delegation:**
1. Delegate to `ma-validator` agent with agent file path
2. Agent runs:
   - Pre-release checklist (see `validation/pre-release-checklist.md`)
   - Security checklist (see `validation/security-checklist.md`)
3. Agent returns validation report

**Quality Gate:**
⛔ STOP if ANY unchecked:
- [ ] Pre-release checklist passes
- [ ] Security checklist passes
- [ ] All three testing methods completed:
  - Direct invocation: `@agent-<name> <prompt>` (e.g. `@agent-code-reviewer`)
  - Auto-delegation: Natural language matching description
  - Cross-model: test with the current Haiku (4.5) to ensure prompt clarity

**Retry Logic:**
- Max 3 retries if quality gate fails
- If still failing: escalate to user with validation report

**Post-creation review (RECOMMENDED):**
After Phase 5 validation passes, orchestrator SHOULD offer: "Run quality review on the new agent? [yes/no]"
If yes: delegate to `ma-reviewer` for standard depth audit.

**Why:** ma-validator checks structural completeness but may miss operational quality issues (path handling, input contracts, behavioral correctness). ma-reviewer catches these. For complex agents, dispatch the 4-reviewer audit pattern: ask the main conversation to run 4 ma-reviewer invocations (with distinct review-focus lenses) in parallel — issue them as separate subagent calls in a single turn so they run concurrently rather than one after another. Keep the batch bounded: many concurrent reviewers each returning detailed findings consume the main context.

---

## Operation: Review

**MANDATORY: Create todo list with Review steps before starting.**

| Agent | Task | Quality Gate |
|-------|------|--------------|
| `ma-reviewer` | Run review checklist against existing agent | Return report with findings |

⛔ STOP if agent file not found.

**Input Conditions:**
- [ ] Agent file exists
- [ ] Review scope determined (single agent / all agents)
  - For bulk review (scope = all agents), spawn one ma-reviewer per agent file as concurrent subagent calls in the same turn (cap at 8 per batch to avoid context exhaustion).

**Delegation:**
1. Delegate to `ma-reviewer` agent with agent file path
2. Agent compares against current standards:
   - Has `<critical_thinking>`?
   - Has "consider alternatives"?
   - Tools explicitly listed?
   - No secrets?
3. Agent returns review report with findings

**Quality Gate:**
⛔ STOP if ANY unchecked:
- [ ] Review report received
- [ ] Findings documented
- [ ] Recommendations provided

**For review workflow, see `guides/quick-start.md#reviewing-agents`.**

---

## Operation: Modify

**MANDATORY: Create todo list with Modify steps before starting.**

| Agent | Task | Quality Gate |
|-------|------|--------------|
| `ma-modifier` | Backup, apply changes, validate | Auto-rollback on failure |

⛔ STOP if agent file not found or changes unclear.

**Input Conditions:**
- [ ] Agent file exists
- [ ] Changes clearly specified
- [ ] Change type determined (bug-fix/enhancement/refactor/breaking)

**Delegation:**
1. Delegate to `ma-modifier` agent with:
   - Agent file path
   - Changes to apply
   - Change type
2. Agent creates backup
3. Agent applies modifications
4. Agent validates post-change
5. Agent auto-rolls back if validation fails

**Handle needs_user_input:**
- For breaking changes, agent returns `needs_user_input`
- Orchestrator confirms via `AskUserQuestion`

**Quality Gate:**
⛔ STOP if ANY unchecked:
- [ ] Backup created
- [ ] Changes applied
- [ ] Post-modification validation passes
- [ ] No critical regressions

---

## Operation: Create pair

See [guides/pair-operations.md](guides/pair-operations.md#operation-create-pair) for the full workflow.

---

## Operation: Create companion

See [guides/pair-operations.md](guides/pair-operations.md#operation-create-companion) for the full workflow.

---

## Examples

**Quick examples (see `examples/examples.md` for full details):**

1. **Create new agent:** PR reviewer → Phases 0-5 → Validation PASS
2. **Review existing agent:** Code analyzer → 3 findings (missing critical thinking)
3. **Modify agent:** Add WebSearch to bug-investigator → Backup + apply + validate
4. **Research reveals no agent needed:** "npm test" → Simple command detected → Use slash command instead
5. **Validation failure with recovery:** Test orchestrator with the Agent (formerly Task) spawn tool → Validation fails → Auto-retry removes it → Success
6. **Max retries exceeded:** Agent validation fails 3x → Escalate to user with needs_user_input
7. **Breaking change:** Model update → Requires user confirmation via needs_user_input
8. **Review identifies outdated patterns:** Bulk review finds 5 agents needing updates

**See `examples/examples.md` for workflows and agent responses.**

---

## Guardrails for Opus Compliance

- **Blocking language:** "MUST NOT", "CANNOT", "STOP if..."
- **Numbered phases:** Gate after every phase, no skipping
- **Checkboxes:** ALL must be checked, "STOP" if unchecked
- **Repetition:** Critical rules at top, restated in operations

---

## Anti-Patterns Summary

**See `guides/anti-patterns.md` for common mistakes and fixes.**

---

## Built-in Agents Reference

| Agent | Model | Tools | Use Case |
|-------|-------|-------|----------|
| **General-purpose** | Sonnet | All | Complex research, multi-step |
| **Plan** | Sonnet | Read, Glob, Grep, Bash (read-only) | Codebase research |
| **Explore** | Haiku | Glob, Grep, Read, Bash (read-only) | Fast searching |

**Explore thoroughness:** `quick`, `medium`, `very thorough`

---

## File Locations

```
.claude/agents/          # Project-level (highest precedence)
~/.claude/agents/        # User-level (global, all projects)
```

(In this plugin repo, agents ship in a top-level `agents/` directory — that is the plugin's packaging convention, not the generic user-level path.)

---

## Reference Files

### Essential (Read First)
- `guides/quick-start.md` — Create your first agent in 5 minutes
- `guides/orchestration-patterns.md` — Valid patterns for multi-agent workflows
- `guides/system-prompt-design.md` — Prompt engineering best practices
- `guides/anti-patterns.md` — Common mistakes and how to avoid them
- `guides/agent-pairing.md` — Creating and managing doer/reviewer agent pairs

### Operations
- `guides/qa-protocol.md` — Requirements gathering via Q&A
- `guides/pair-operations.md` — Create-pair and create-companion workflows

### Reference (Consult As Needed)

| Category | Files |
|----------|-------|
| **Templates** | `templates/agent-template-xml.md` (complex), `templates/agent-template-markdown.md` (simple-to-medium) |
| **Validation** | `validation/pre-release-checklist.md`, `validation/security-checklist.md` |
| **Examples** | `examples/examples.md`, `examples/agent-templates.md` |
| **Resources** | `resources.md`, [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) |
