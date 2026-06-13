# Managing Agents Examples

## Contents
- Examples 1-4: Create, Review, Modify, Research-reveals-no-agent
- Examples 5-6: Validation failure with recovery; max retries exceeded
- Examples 7-8: Breaking change confirmation; review identifies outdated patterns
- Edge Case Examples
- Examples 11-12: Create a doer/reviewer pair; create companion reviewer
- Key Takeaways

Detailed examples showing the agent creation workflow, review process, modifications, and validation scenarios.

For production-ready agent templates, see `agent-templates.md`.

---

## Example 1: Create new agent

**User:** "Create an agent to review pull requests"

**Workflow:**
- Phase 0: `ma-requirements-gatherer` returns questionnaire → Orchestrator asks user
- Phase 1: `ma-researcher` validates need → No "When NOT to Create" scenario matches
- Phase 2: `ma-designer` designs agent → Returns model selection question → User chooses Sonnet
- Phase 3-4: `ma-creator` configures YAML + writes prompt
- Phase 5: `ma-validator` runs validation → PASS

**Result:** Agent created at `agents/pr-reviewer.md`

---

## Example 2: Review existing agent

**User:** "Review the code-analyzer agent"

**Workflow:**
- Orchestrator delegates to `ma-reviewer` with agent path
- Agent runs review checklist against current standards
- Agent returns report with 3 findings:
  1. Missing `<critical_thinking>` section
  2. No "consider alternatives" step in workflow
  3. Tools field omitted (inherits ALL tools)

**Result:** Review report with recommendations for fixes

---

## Example 3: Modify agent

**User:** "Update bug-investigator to include WebSearch"

**Workflow:**
- Orchestrator delegates to `ma-modifier` with changes
- Agent creates backup: `bug-investigator.md.backup.20251219-120000`
- Agent applies changes:
  - Adds `WebSearch` to tools list
  - Updates prompt to include web research step
- Agent validates post-change → PASS

**Result:** Agent updated successfully with backup available

---

## Example 4: Research reveals no agent needed

**User:** "Create agent to run npm test"

**Workflow:**
- Phase 0: Requirements gathered
- Phase 1: `ma-researcher` performs evaluation
  - Finds "Simple command with arguments" scenario matches
  - Agent returns `needs_user_input`:
    ```json
    {
      "status": "needs_user_input",
      "reason": "simple_command_detected",
      "question": {
        "header": "Agent may not be needed",
        "question": "This appears to be a simple command that could be run directly via slash command or Bash tool. Create agent anyway?",
        "options": [
          {"label": "Use slash command", "description": "Run 'npm test' directly when needed"},
          {"label": "Create agent", "description": "Wrap in agent for consistency"}
        ]
      },
      "context": {
        "scenario": "simple_command",
        "recommendation": "Use slash command instead of creating agent"
      }
    }
    ```
- Orchestrator uses `AskUserQuestion` with returned question
- User selects "Use slash command"
- Operation stops (no agent created)

**Result:** User instructed to use slash command instead. Context window saved.

---

## Example 5: Validation failure with recovery

**User:** "Create an agent to orchestrate multiple testing workflows"

**Phase 0-2:** Requirements gathered, research completed, agent designed

**Phase 3-4:** `ma-creator` generates agent configuration
```yaml
---
name: test-orchestrator
description: Orchestrate multiple testing workflows. Use PROACTIVELY for complex test scenarios.
tools:
  - Agent     # ❌ Violates rule: subagents cannot spawn further subagents
  - Read
  - Bash
---

<context>
You orchestrate testing workflows by delegating to specialized testing agents.
</context>

<workflow>
1. Analyze testing requirements
2. Use the Agent tool to delegate to specialized agents
3. Aggregate results
</workflow>
```

**Phase 5 - Attempt 1:** `ma-validator` runs validation
- Quality Gate: ❌ FAIL
- Issue: "Agent (formerly Task) spawn tool included (subagents cannot spawn further subagents - architectural rule #1)"
- Validation score: 60/100

**Phase 3-4 - Retry 1/3:** `ma-creator` re-generates agent
- Removes `Agent` (the spawn tool) from tools
- Updates prompt to return `needs_user_input` when orchestration needed
- Adds pattern: "If multiple specialized agents needed, return needs_user_input for orchestrator"

**Phase 5 - Attempt 2:** `ma-validator` re-validates
- Quality Gate: ✅ PASS
- All architectural rules satisfied
- Validation score: 95/100

**Result:** Agent created successfully without the spawn tool. When orchestration is needed, agent returns `needs_user_input` for the orchestrator to handle.

---

## Example 6: Validation failure - max retries exceeded

**User:** "Create an agent to automate code reviews"

**Phase 3-4 - Attempt 1:** `ma-creator` generates agent
```yaml
---
name: code-reviewer
description: Automate code reviews
tools:
  - AskUserQuestion  # ❌ Filtered out
  - Read
  - Grep
# ❌ Missing trigger phrase in description
---
```

**Phase 5 - Attempt 1:** `ma-validator` validation
- Issues: AskUserQuestion in tools, missing trigger phrase
- Validation score: 55/100
- Status: RETRY

**Phase 3-4 - Retry 1/3:** `ma-creator` re-generates
```yaml
---
name: code-reviewer
description: Automate code reviews
# ❌ Tools field omitted (inherits ALL)
---
```

**Phase 5 - Attempt 2:** `ma-validator` validation
- Issues: Tools field omitted (inherits ALL tools - architectural rule #3)
- Validation score: 60/100
- Status: RETRY

**Phase 3-4 - Retry 2/3:** `ma-creator` re-generates
```yaml
---
name: code-reviewer
description: Automate code reviews
tools:
  - Read
  - Grep
  - Glob
# ❌ Still missing trigger phrase (regression)
---
```

**Phase 5 - Attempt 3:** `ma-validator` validation
- Issues: Missing trigger phrase in description
- Validation score: 65/100
- Status: RETRY

**Phase 3-4 - Retry 3/3:** `ma-creator` re-generates
- Same issue persists
- Max retries (3) exceeded

**Agent returns:**
```json
{
  "status": "needs_user_input",
  "reason": "validation_failed_max_retries",
  "question": {
    "header": "Validation failed",
    "question": "Agent validation failed after 3 retries. Issues: missing trigger phrase, inconsistent fixes. How to proceed?",
    "options": [
      {"label": "Manual fix", "description": "Review and fix validation issues manually"},
      {"label": "Retry from Phase 2", "description": "Re-design agent with clearer requirements"},
      {"label": "Cancel", "description": "Abort agent creation"}
    ],
    "multiSelect": false
  },
  "context": {
    "phase": 5,
    "validation_issues": [
      "Missing trigger phrase in description",
      "Retries show inconsistent fixes (regression detected)"
    ],
    "retries_exhausted": true,
    "agent_draft_path": "agents/code-reviewer.md.draft"
  }
}
```

**Orchestrator uses AskUserQuestion** → User selects "Manual fix"

**Result:** User manually edits agent to add trigger phrase, then requests re-validation via `ma-validator`

---

## Example 7: Breaking change requires confirmation

**User:** "Update security-scanner to use Opus model"

**Workflow:**
- `ma-modifier` identifies change type: `breaking` (model change may affect behavior)
- Agent returns `needs_user_input`:
  ```json
  {
    "status": "needs_user_input",
    "reason": "breaking_change",
    "question": {
      "header": "Breaking change detected",
      "question": "Changing model from Sonnet to Opus may affect agent behavior and increase costs. Proceed?",
      "options": [
        {"label": "Proceed", "description": "Apply model change (backup created)"},
        {"label": "Cancel", "description": "Keep current model"}
      ]
    },
    "context": {
      "current_model": "claude-sonnet-4-5",
      "new_model": "claude-opus-4-5",
      "backup_path": "agents/security-scanner.md.backup.20251219-150000"
    }
  }
  ```
- Orchestrator uses `AskUserQuestion`
- User confirms "Proceed"
- Agent applies change and validates

**Result:** Model updated with backup available for rollback if needed

---

## Example 8: Review identifies outdated patterns

**User:** "Review all agents in my workspace"

**Workflow:**
- Orchestrator delegates to `ma-reviewer` for each agent
- `ma-reviewer` finds 5 agents with outdated patterns:
  1. `legacy-formatter` - Missing XML structure (uses plain text)
  2. `old-analyzer` - No `<critical_thinking>` section
  3. `data-processor` - Tools field omitted
  4. `quick-helper` - No trigger phrase in description
  5. `orchestrator-agent` - Has the Agent (formerly Task) spawn tool in frontmatter

**Agent returns:**
```json
{
  "status": "completed",
  "findings": {
    "total_agents": 12,
    "compliant": 7,
    "needs_update": 5,
    "critical_issues": 2
  },
  "recommendations": [
    {
      "agent": "orchestrator-agent",
      "severity": "critical",
      "issue": "Has the Agent (formerly Task) spawn tool (subagents cannot spawn further subagents)",
      "fix": "Remove the spawn tool, return needs_user_input for orchestration"
    },
    {
      "agent": "data-processor",
      "severity": "critical",
      "issue": "Tools field omitted (inherits ALL tools)",
      "fix": "Explicitly list required tools only"
    },
    {
      "agent": "legacy-formatter",
      "severity": "high",
      "issue": "Missing XML structure",
      "fix": "Migrate to XML template (see templates/agent-template-xml.md)"
    }
  ]
}
```

**Result:** Orchestrator presents findings to user with recommendations for batch update

---

## Edge Case Examples

### Example 9: Failed Validation with Manual Fix

**Scenario:** Agent validation fails, user manually intervenes.

**User input:** "Create an agent for generating SQL queries"

**Flow:**
1. Requirements gathering → collects query generation needs
2. Design → creates sql-query-generator agent
3. Validation → FAILS on security (SQL injection risk)
4. Orchestrator reports: "Validation failed: SQL injection risk detected"
5. User: "Add parameterized query requirement"
6. Resume modification with additional constraint
7. Re-validate → PASS

### Example 10: Bulk Agent Review

**Scenario:** User wants to review multiple agents at once.

**User input:** "Review all agents in agents/"

**Flow:**
1. List agents: ma-*, ms-*, ba-*, etc.
2. Create todo with each agent as item
3. Run quick review on each
4. Aggregate results into summary table
5. Identify common issues across agents

---

## Example 11: Create a doer/reviewer pair

**User:** "Create a pair of agents for database schema design and review"

**Workflow:**
- Phase 0: Requirements gathered for BOTH schema-designer (doer) and schema-reviewer (reviewer)
  - Shared vocabulary defined: "schema migration", "entity model", "constraint", "index"
- Phase 1: Research validates pair is warranted (schema design is complex enough for dedicated review)
- Phase 2: Designer produces:
  - Names: `schema-designer` + `schema-reviewer`
  - Colors: green (doer) + emerald (reviewer) – verified unique
  - Shared vocabulary documented
  - Complementary tools: doer has Write/Edit, reviewer is read-only
- Phase 3-4a: Creator builds schema-designer with `<collaboration>` referencing schema-reviewer
- Phase 3-4b: Creator builds schema-reviewer with `<collaboration>` referencing schema-designer
- Phase 5a-b: Both agents pass individual validation
- Phase 6: Cross-reference validation:
  - Bidirectional collaboration references present
  - Complementary scope exclusions present
  - Consistent vocabulary confirmed
  - Colors unique and different

**Result:** Both agents created at `agents/`. See `guides/pair-operations.md`.

---

## Example 12: Create companion reviewer for existing doer

**User:** "Add a reviewer agent for the existing solution-architect"

**Workflow:**
- Phase 0: Requirements gathered for reviewer role
- Phase R: `ma-reviewer` reviews solution-architect.md:
  - Has `<collaboration>` section: yes (but no reviewer reference yet)
  - Has `<scope_exclusions>`: yes
  - Artifacts produced: solution specs, ADRs, data models, API contracts
  - Color: orange
- Phase 2: Designer produces:
  - Name: `solution-reviewer`
  - Color: amber (warm family, verified unique)
  - Evaluation criteria: coherence, completeness, feasibility
  - Severity scale: 0–4 with confidence levels
- Phase 3-4: Creator builds solution-reviewer with collaboration referencing solution-architect
- Phase 5: Validator passes (pre-release 96.6%, security 98.1%)
- Phase 6: Cross-reference validation passes
- Phase 7: `ma-modifier` updates solution-architect.md:
  - Added `-> solution-reviewer` and `<- solution-reviewer` to `<collaboration>`
  - Added "Solution design review -> solution-reviewer" to "Not your domain"
  - Added `<scope_exclusions>` entry for design review

**Result:** Companion created. Existing agent updated with bidirectional references. See `guides/pair-operations.md`.

---

## Key Takeaways

1. **needs_user_input pattern works:** Agents can't ask questions directly, but can return structured questions for orchestrator
2. **Validation catches violations:** Phase 5 prevents non-compliant agents from being created
3. **Retry logic enables self-healing:** Agents can fix issues automatically (up to 3 attempts)
4. **Max retries escalation:** When auto-fix fails, escalate to user with context
5. **Breaking changes require confirmation:** Orchestrator uses AskUserQuestion for destructive changes
6. **Review enables bulk compliance:** Identify outdated patterns across multiple agents
7. **Context preservation:** Delegation keeps orchestrator context clean for user interaction
8. **Agent pairs enforce consistency:** Bidirectional collaboration + scope exclusions prevent overlap and ensure doer/reviewer handoffs work correctly
