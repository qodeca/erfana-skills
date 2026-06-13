---
name: managing-skills
description: Create, review, modify, and modernize Claude Code skills following Anthropic best practices. Full lifecycle management including creation workflows, validation, updates, and Opus 4.7 pattern application. Use when creating new skills, reviewing existing skills, updating skill content, applying 4.7 patterns, or asking "how do I create/manage a skill".
when_to_use: |
  Trigger phrases: "create skill", "review skill", "modify skill", "modernize skill", "apply 4.7 patterns", "update for opus 4.7", "skill lifecycle".
model: opus
effort: xhigh
---

# Managing Skills

Comprehensive lifecycle management for Claude Code skills: creation, review, and modification.

---

## TL;DR (Quick Reference)

- **Create:** Run Steps 0→1→1.5→2→3→4→5 (see `guides/creating-skills.md`)
- **Review:** Delegate to `ms-reviewer` agent
- **Modify:** Delegate to `ms-modifier` agent
- **Modernize** (added v4.2.0): Apply Opus 4.7 patterns to existing skill — `ms-reviewer` (deep) → user approves → `ms-modifier` (`change_type: modernize`) → `ms-validator`. See `guides/skill-modernization-guide.md`.
- **Agents:** Only use builtin (Explore, Plan) or shared (agents/)
- **Key rules:** Orchestrate don't execute, validate where it matters, use todos
- **Pass threshold:** Pre-release ≥66/70 (orchestrator), ≥64/68 (focused-reviewer), or ≥63/66.5 (focused). Security ≥87/93

---

## CRITICAL ARCHITECTURAL RULES

**ALL skills managed by this skill MUST follow these rules. NO EXCEPTIONS.**

1. Skills MUST NOT invoke other skills via the Skill tool (prevents recursion / infinite loops). Prose terminal-state handoff is permitted — e.g. "After delivery, user may dispatch to <sibling-skill>" — matches design-* family practice and the superpowers router pattern.
2. Skills MAY use agents from two sources: **builtin** or **shared**
3. Skills SHOULD prefer builtin agents when match ≥80% (user confirms)
4. Skill MUST act as orchestrator, NOT executor
5. ALL tasks MUST be delegated to agents (any source)
6. Each agent MUST follow Single Responsibility Principle
7. Skill MUST have clearly defined workflow with logical steps
8. EVERY step MUST have input conditions verified BEFORE proceeding
9. EVERY step that produces irreversible side effects (file write, agent file creation, breaking change) MUST have post-step validation. Exploratory steps (discovery, matching, design) MAY skip validation if Opus 4.7 self-verification is sufficient — strip "verify before returning" rituals on routine work per Anthropic's 4.7 migration guide.
10. Steps with irreversible side effects retry up to 3 times on validation failure. Exploratory steps return findings on first attempt; orchestrator decides retry.
11. Outputs from irreversible steps go through quality gates
12. Skill MUST ALWAYS create todo lists for progress tracking
13. **ALL shared agents SHOULD prefer XML structure** (see `templates/agent-template.md`)
14. **Agents table MUST include Source column** (builtin/shared)
15. **ALL agents MUST declare `capabilities` in frontmatter** (⛔ BLOCKING - required for discovery)
16. **ALL files MUST be under 500 lines** (⛔ BLOCKING - split or compact if exceeded)
17. **Skills MUST define Q&A requirements gathering** (⛔ BLOCKING - see `guides/qa-protocol.md`)
18. **Spawned agents CANNOT spawn other agents** (Task tool unavailable to subagents – prevents infinite nesting)
19. **Skills SHOULD comply with the Agent Skills open standard** (agentskills.io) – advisory, not blocking. Key conventions: standard frontmatter schema (`name`, `description`, `context`, `model`, `allowed-tools`), `--add-dir` auto-loading, and portable skill definitions
20. **Skills MUST NOT use deprecated APIs** (added v4.2.0): no `temperature` / `top_p` / `top_k` / fixed `thinking: {budget_tokens: N}` — Opus 4.7 returns 400 error. Use `{type: "adaptive"}` + `effort` field instead. ⛔ BLOCKING (Section 12.7 of pre-release-checklist).
21. **Skill descriptions follow 4.7 patterns** (added v4.2.0): third-person voice (no "I can help" / "You can use") — **Anthropic-required** per skill-creator/SKILL.md (pre-release-checklist item 12.1); specific quoted activation phrases in `when_to_use` — Anthropic requires "specific triggers"; **≥3 phrases is plugin convention** for activation reliability (item 12.2); no filler word repetition ("comprehensive"/"thorough"/"detailed"); combined description+when_to_use ≤1,536 chars (Anthropic-documented Claude Code truncation, item 7.4).

---

## CC 2.1 skill capabilities

Claude Code 2.1 introduces new frontmatter fields and features for skills:

| Field | Type | Description |
|-------|------|-------------|
| `context` | `string` | Execution context: `fork` (isolated), `shared` (default) |
| `agent` | `object` | Agent configuration for skill-spawned agents |
| `hooks` | `object` | Lifecycle hooks: `PreToolUse`, `PostToolUse`, `Stop`, etc. |
| `model` | `string` | Model override: `opus`, `sonnet`, `haiku` |
| `allowed-tools` | `list` | Restrict which tools the skill can use |
| `user-invocable` | `boolean` | Whether the skill appears as a slash command (default: `true`) |
| `argument-hint` | `string` | Hint text for slash command arguments |
| `disable-model-invocation` | `boolean` | Prevent auto-triggering; slash command only |

**String substitution variables:** `$ARGUMENTS`, `$ARGUMENTS[N]` (positional), `$N` (shorthand positional), `$SELECTION`, `$FILE`, `${CLAUDE_SESSION_ID}`

**Dynamic context injection:** Use `` `!command` `` syntax in skill body to execute shell commands and inject output at load time.

**Auto-loading:** Skills placed in directories added via `--add-dir` are automatically loaded and available as slash commands – no manual registration required.

---

## CONTEXT PRESERVATION (HIGHEST PRIORITY)

**WHY THIS MATTERS:** The orchestrator's context window is LIMITED and SHARED with user conversation. Every task executed directly by the orchestrator consumes context that could be used for user interaction and decision-making. Agents run in SEPARATE context windows, preserving the main conversation.

### Mandatory delegation rules

| Action | Orchestrator | Agent |
|--------|--------------|-------|
| Code reading/analysis | ❌ NEVER | ✅ ALWAYS |
| File editing/writing | ❌ NEVER | ✅ ALWAYS |
| Code generation | ❌ NEVER | ✅ ALWAYS |
| Web search/research | ❌ NEVER | ✅ ALWAYS |
| Codebase exploration | ❌ NEVER | ✅ ALWAYS |
| User questions (AskUserQuestion) | ✅ ONLY | ❌ CANNOT |
| Todo management (TodoWrite) | ✅ OK | ❌ N/A |
| Routing decisions | ✅ OK | ❌ N/A |

### User input pattern (agents cannot ask directly)

When agents need user input, they return `needs_user_input`:
1. Agent detects need for user decision/clarification
2. Agent returns `{status: "needs_user_input", question: {...}, context: {...}}`
3. Orchestrator uses `AskUserQuestion` with returned question
4. Orchestrator passes answer back to agent (resume) or next step

### Direct execution policy

**Direct execution REQUIRES explicit user justification:**
- User must approve AND provide reason why agent delegation is not possible
- "No agent available" is NOT valid justification - escalate to create one

**Escalation path when no agent matches:**
1. First: Find ANY agent with partial capability match
2. Second: Ask user to create a new shared agent
3. Third: ONLY with explicit user approval + justification, allow direct execution

**For detailed policy, see `guides/orchestration-patterns.md#context-preservation`.**

**Agent Sources:**
- **builtin:** Claude Code Task tool agents (Explore, Plan, etc.)
- **shared:** User agents at `agents/`

**For detailed patterns, see:**
- `guides/agent-design-guide.md` - Core design principles (see also: agent-configuration.md, agent-advanced-patterns.md, agent-implementation-patterns.md)
- `guides/orchestration-patterns.md` - Skill-agent coordination
- `guides/shared-agents-guide.md` - Creating reusable agents

---

## Agents

Per-subagent Effort and Model overrides (added v4.2.0 per Opus 4.7 best practices). Routine validators on `sonnet`+`medium` are ~10x cheaper than orchestrators on `opus`+`xhigh`; the savings compound across long workflows.

| Agent | Purpose | Source | Effort | Model | Used In |
|-------|---------|--------|--------|-------|---------|
| `ms-requirements-gatherer` | Gather business requirements via questionnaire | shared | medium | sonnet | Create: Step 0 |
| `ms-requirements-validator` | Validate requirements completeness and consistency | shared | medium | sonnet | Create: Step 1 |
| `ms-agent-discoverer` | Discover available builtin/shared agents | shared | low | sonnet | Create: Step 1.5 |
| `ms-agent-matcher` | Match requirements to available agents | shared | medium | sonnet | Create: Step 1.5 |
| `ms-designer` | Design skill structure based on requirements | shared | high | opus | Create: Step 2 |
| `ms-creator` | Create skill files following templates | shared | xhigh | opus | Create: Step 3 |
| `ms-example-adder` | Add usage examples to skill | shared | low | sonnet | Create: Step 4 |
| `ms-validator` | Validate skill against checklists | shared | medium | sonnet | Create: Step 5, Modernize: Step 4 |
| `ms-reviewer` | Audit existing skill for quality | shared | xhigh | opus | Review, Modernize: Step 1 |
| `ms-modifier` | Apply modifications safely with backup | shared | xhigh | opus | Modify, Modernize: Step 3 |

---

## Todo List Requirements

**MANDATORY - No exceptions.**

### At Operation Start
```
TodoWrite([
  {content: "Step description", status: "in_progress", activeForm: "Doing step"},
  {content: "Next step", status: "pending", activeForm: "Doing next step"},
  ...
])
```

### For EVERY Step
1. Mark step `in_progress` BEFORE starting
2. Execute step with agent delegation
3. Mark step `completed` IMMEDIATELY after quality gate passes

---

## Operation: Create

**MANDATORY: Create todo list with Steps 0, 1, 1.5, 2, 3, 4, 5 before starting.**

| Step | Agent | Purpose |
|------|-------|---------|
| 0 | `ms-requirements-gatherer` | Gather requirements (orchestrator asks returned questions) |
| 1 | `ms-requirements-validator` | Validate completeness |
| 1.5 | `ms-agent-discoverer` + `ms-agent-matcher` | Find and match agents (parallel — see fan-out note below) |
| 2 | `ms-designer` | Design skill structure |
| 3 | `ms-creator` | Create files (handle conflicts via orchestrator) |
| 4 | `ms-example-adder` | Add usage examples |
| 5 | `ms-validator` | Validate against shape-aware threshold (orchestrator ≥66/70, focused-reviewer ≥64/68, focused ≥63/66.5; ms-validator Step 1a derives shape) + security ≥87/93 + Section 12.7 deprecated APIs MUST pass (BLOCKING) |

**Step 1.5 fan-out (added v4.2.0):** ms-agent-discoverer and ms-agent-matcher run in parallel — orchestrator spawns both as concurrent Task calls in the same turn, then waits on both. They have no inter-dependencies. Opus 4.7 defaults to sequential delegation; explicit fan-out is required to enable concurrency.

**Handle needs_user_input:** When any agent returns `status: "needs_user_input"`, orchestrator uses `AskUserQuestion` with the returned question, then passes the answer back.

**For detailed step-by-step workflow, see `guides/creating-skills.md`.**

---

## Operation: Review

**MANDATORY: Create todo list with Review steps before starting.**

### Optional: Usage feedback

Before delegating to `ms-reviewer`, the orchestrator asks:
> "Do you have session observations or friction points to incorporate?"

If feedback provided, pass it to `ms-reviewer` as `usage_feedback` parameter. The reviewer maps each point to:
- **Specific section/step** in the skill where the friction occurred
- **Classification:** missing-step | inadequate-step | missing-agent | missing-integration
- **Proposed modification** with effort estimate (Small/Medium/Large)

This captures real-world workflow gaps that checklist-based review alone cannot detect.

| Agent | Task | Quality Gate |
|-------|------|--------------|
| `ms-reviewer` | Run review checklist (quick/standard/deep) | Return report with score |

⛔ STOP if skill not found.

**For detailed review workflow, see `guides/reviewing-skills.md`.**

---

## Operation: Modify

**MANDATORY: Create todo list with Modify steps before starting.**

| Agent | Task | Quality Gate |
|-------|------|--------------|
| `ms-modifier` | Backup, apply changes, validate | Auto-rollback on failure |

⛔ STOP if skill not found or changes unclear.

**Handle needs_user_input:** For breaking changes, orchestrator confirms via `AskUserQuestion`.

**For detailed modification patterns, see `guides/modifying-skills.md`.**

---

## Operation: Modernize (added v4.2.0)

**MANDATORY: Create todo list with Modernize steps before starting.**

**When to use:** apply Opus 4.7 patterns to an existing skill written under earlier conventions. Trigger phrases: "modernize <skill>", "apply 4.7 patterns to <skill>", "update <skill> for opus 4.7".

| Step | Agent | Purpose |
|------|-------|---------|
| 1 | `ms-reviewer` (deep mode) | Audit skill against Section 12 patterns; emit P0-P3 modernization findings |
| 1a | Orchestrator | **Pre-flight: nested-agents check** (see below) |
| 2 | Orchestrator | Present findings to user via `AskUserQuestion` with **batching protocol** (see below) |
| 3 | `ms-modifier` (`change_type: modernize`) | Backup, apply selected changes per `guides/skill-modernization-guide.md`, validate |
| 4 | `ms-validator` | Re-validate against updated checklist (skill_shape-aware threshold per ms-validator Step 1a) |
| 5 | Orchestrator | Report before/after scores + diff summary |

⛔ STOP if skill not found.

### Step 1a: Nested-agents check (early-exit guard, added v4.2.0)

Modernize covers prose patterns only — it does NOT migrate nested per-skill agents to plugin-root. Before invoking ms-modifier, check the target skill structure:

```
Glob {skill_path}/agents/*.md
```

If the target skill ships nested agents under `<skill>/agents/`:
1. Return `needs_user_input` to user with caveat:
   > "This skill (`<name>`) has N nested agents under `skills/<name>/agents/` requiring v5.0.0 architectural cascade (hoist to plugin-root or convert to `prompts/`). Modernize covers prose patterns only and will leave nested agents in pre-modernization state.
   > 
   > Options:
   > - **Proceed with caveat** — modernize SKILL.md prose now; nested agents remain stale until v5.0.0 cascade
   > - **Wait for v5.0.0** — abort Modernize; track in v5.0.0 plan instead"
2. On "Proceed with caveat", continue to Step 2 with explicit warning recorded in output diff summary.
3. On "Wait for v5.0.0", abort Modernize; return `status: deferred_to_v5` with no edits applied.

Reason: Lane 4 review surfaced "misleading green light" risk where Modernize scores `improved` after touching SKILL.md prose only, while 23 nested agents remain stale. The caveat is non-negotiable for honesty.

### Step 2: AskUserQuestion batching protocol (added v4.2.0)

`AskUserQuestion` caps at 4 options per question and 4 questions per call (16 max). Typical Modernize audits return 6-12 findings × 4 priorities. Without explicit batching, the orchestrator silently truncates.

Batching algorithm:

```
findings = ms-reviewer output's data.modernization_findings array
if len(findings) <= 4:
    Single AskUserQuestion with one question, options = findings (multiSelect: true, label = section + fix preview)
else:
    Partition by priority:
      P0 (critical, e.g. deprecated APIs) → AUTO-APPLY (no user choice; 12.7 is hard-blocking)
      P1 (high, e.g. voice / scaffolding cleanup) → question 1 (max 4 options, multiSelect: true)
      P2 (medium, e.g. fan-out / find-filter) → question 2 (max 4 options, multiSelect: true)
      P3 (polish, e.g. filler words / per-subagent) → question 3 (max 4 options, multiSelect: true)
    If any priority bucket has >4 items: present top-4 by impact-weight (Section 12 weight × severity), list overflow in description text.
    If batch would exceed 4 questions: collapse P3 into "Apply all P3 polish items? (yes/no)" single choice.
```

Output to user must surface: "N total findings; X auto-applied (P0); Y surfaced for choice; Z deferred to overflow list."

**Handle needs_user_input:** ms-modifier returns confirmation request for any breaking change (e.g. removing mandatory verify step that downstream consumers depend on). Orchestrator presents per-pattern preview-diff via `AskUserQuestion` before commit.

**Acceptance:** Section 12 score IMPROVES (or stays same; never regresses). Section 12.7 (deprecated APIs) MUST pass after modernization (BLOCKING — runtime 400 error on Opus 4.7).

**For detailed modernization patterns, see `guides/skill-modernization-guide.md`.**

### Post-run discipline: update the modernization registry

Every successful Modernize pass MUST append (new skill) or update (existing row) the target skill's row in [`docs/modernization-registry.md`](../../docs/modernization-registry.md). The registry is the cross-skill audit-trail – it answers "when was skill X last modernized, what was the scope, what did it score?" without re-reading the CHANGELOG. Capture: skill name + link, first/last pass version, status (PASS / N/A / aborted), one-line findings summary. Skipping this step is a CLAUDE.md "Things to avoid" violation – not gated, enforced by convention.

---

## Examples

### Example 1: New shared agent created

**User:** "Create skill for formatting JSON"
→ Agents: `format-json` (shared, new) | Validation: PASS (66/70)

### Example 2: Builtin agents only (100% match)

**User:** "Create skill for exploring and planning features"
→ Agents: `Explore`, `Plan` (both builtin) | PASS (66/70)

### Example 3: Mixed builtin and shared

**User:** "Create skill for researching and validating"
→ Agents: `Explore` (builtin), `validate-sources` (shared, new) | PASS (66/70)

### Example 4: Validation failure

**User:** "Create skill that calls data-processor skill"
→ ⛔ STOPS: Skill references violate Rule #1

### Example 5: Modernize existing skill (added v4.2.0)

**User:** "Modernize design-review for Opus 4.7"
→ Step 1: ms-reviewer deep mode runs Section 12 sweep, finds: 12.4 N/A (single-threaded), 12.5 N/A (no agents), all others PASS
→ Step 2: orchestrator presents findings to user — only minor P3 polish items
→ Step 3: ms-modifier applies (or skips if N/A dominates)
→ Step 4: ms-validator confirms Section 12 score 6.0/6.0 (focused-reviewer max)
→ PASS (already 4.7-shaped; modernization minimal)

**For more examples, see `examples/examples.md`.**

---

## Guardrails for Opus Compliance

- **Blocking language for unambiguous safety/correctness constraints:** "MUST NOT", "STOP if...". Per Anthropic skill-creator: ALL-CAPS imperatives ("ALWAYS", "NEVER", "CANNOT") are a **yellow flag** — use sparingly. Prefer reasoned explanation when the *why* is non-obvious. Reserve absolute imperatives for runtime-blocking concerns (deprecated APIs, recursion, file overwrites).
- **Numbered steps:** Gate after every step, no skipping
- **Checkboxes:** ALL must be checked, "STOP" if unchecked
- **Repetition:** Critical rules at top, restated in operations

---

## Anti-Patterns Summary

**Critical (Automatic Fail):**
- Invoking other skills via the Skill tool (recursion risk)
- Using agents from unknown sources (not builtin/shared)
- Executing directly instead of delegating
- Missing input conditions on irreversible steps
- Missing Source column in agents table
- **Any file over 500 lines** (split or compact required)
- **Missing Q&A/requirements gathering** (must define when/how to gather)
- **Using deprecated APIs** (`temperature`/`top_p`/`top_k`/fixed `budget_tokens`) — runtime 400 error on Opus 4.7 (Section 12.7)

**High Priority:**
- First-person descriptions ("I can help" / "You can use")
- Vague triggers — at least one specific quoted activation phrase per operation (≥3 total is plugin convention for activation reliability)
- "Always verify before returning" mandates on routine steps (Anthropic 4.7 anti-pattern)
- Implicit fan-out ("review all files") — spell out parallel mechanic
- Filter-at-find-time in reviewer skills — enumerate first, filter in second pass
- No examples
- Skipping agent discovery/matching (Step 1.5)
- Skipping validation

**Note:** Skills use only builtin and shared agents. There is no `agents/` directory within skills - all agents are either builtin (Explore, Plan, etc.) or shared (`agents/`). The agents table must include the Source column to clearly indicate where each agent comes from.

**For complete anti-patterns guide, see `guides/anti-patterns.md`.**

---

## Reference Files

### Essential (Read First)
- `guides/quick-start.md` - Start here for rapid orientation
- `guides/creating-skills.md` - Step-by-step creation workflow
- `guides/agent-design-guide.md` - Agent architecture patterns (main guide)
  - `guides/agent-configuration.md` - YAML frontmatter and tool setup
  - `guides/agent-advanced-patterns.md` - Resumption, anti-patterns, prompt engineering
  - `guides/agent-implementation-patterns.md` - Tool patterns, optimization, testing

### Operations
- `guides/reviewing-skills.md` - Review workflow and criteria
- `guides/modifying-skills.md` - Modification patterns and safety
- `guides/skill-modernization-guide.md` - **Modernize operation playbook** (added v4.2.0): per-pattern remediation for Opus 4.7

### Opus 4.7 patterns (added v4.2.0)
- `guides/opus-4-7-patterns.md` - 13-section reference for Opus 4.7 best practices (effort scale, description shape, deprecated APIs, fan-out, find-vs-filter, cache-friendliness, more)
- `guides/embedded-prompts-guide.md` - Three-tier mental model: when to use plugin-root agents vs skill-internal prompts vs reference docs

### Reference (Consult As Needed)

| Category | Files |
|----------|-------|
| **Templates** | `templates/focused-skill-template.md` (NEW v4.2.0 — design-* parity), `templates/skill-md-template.md`, `templates/simple-skill-template.md`, `templates/multi-tool-skill-template.md`, `templates/agent-template.md`, `templates/questionnaire-template.md`, `templates/reference-template.md`, `templates/shared-agent-template.md`, `templates/phase-requirements-template.md` |
| **Agent Templates** | `templates/read-only-agent.md`, `templates/code-writer-agent.md`, `templates/research-agent.md` |
| **Guides** | `guides/orchestration-patterns.md`, `guides/cross-model-guide.md`, `guides/anti-patterns.md`, `guides/migration-guide.md`, `guides/edge-cases.md`, `guides/qa-protocol.md`, `guides/shared-agents-guide.md`, `guides/progressive-disclosure.md`, `guides/orchestration-advanced.md`, `guides/skill-frontmatter-guide.md` |
| **Validation** | `validation/pre-release-checklist.md`, `validation/security-checklist.md`, `validation/review-checklist.md`, `validation/agent-pre-release-checklist.md`, `validation/agent-security-checklist.md` |
| **Examples** | `examples/examples.md` (index), `examples/examples-simple.md`, `examples/examples-medium.md`, `examples/examples-complex.md`, `examples/examples-agents.md`, `examples/examples-creating-agents.md`, `examples/examples-cc21-capabilities.md` |
| **Resources** | `resources.md` |
