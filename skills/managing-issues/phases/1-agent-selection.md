# Phase 1: Agent Selection

**Goal:** Dynamically select agents for all subsequent phases based on capability matching.
**Agents:** `mi-agent-discoverer`, `mi-agent-matcher`
**Quality Gate:** QG-1 (Automated)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-0 = PASS (Pre-flight completed)
- [ ] Feature branch checked out
- [ ] Issue metadata available (title, body, labels)
- [ ] Tier classification determined

---

## EXECUTION

### Default agent map (spec-ready fast-path)

When `spec_maturity >= complete` OR issue labels clearly indicate domain, skip the discovery/matching cycle and use default assignments:

| Phase | Default agent |
|-------|--------------|
| 2 | mi-requirements-analyzer |
| 3 | mi-codebase-explorer |
| 4 | mi-solution-designer |
| 5 | software-developer + test-writer |
| 6 | architecture-reviewer |
| 7 | security-auditor |
| 8 | code-reviewer |
| 9 | mi-solution-designer |
| 10 | mi-docs-updater |
| 11 | – (direct user interaction, no agent) |
| 12 | commit-writer |

**Label-based overrides:**
- `frontend` label --> boost react-developer, react-code-reviewer
- `backend` label --> boost nest-developer, nest-code-reviewer
- `bug` label --> add bug-investigator to Phase 2

Inform user: "Using default agent assignments (spec-ready mode)."
Skip Steps 1-4 (discovery/matching cycle). QG-1 validates all phases have assignments.

**Fallback:** If user disagrees with defaults --> fall back to full discovery below.

---

### Step 1: Discover available agents

**Agent tool:**
  subagent_type: `mi-agent-discoverer`

Scan all agent sources and extract capabilities:

```
Sources to scan:
- Builtin agents (Explore, Plan, architecture-reviewer, etc.)
- Shared agents (agents/*.md)
- Dedicated agents (./agents/*.md) - if exist

For each agent, extract from YAML frontmatter:
- name
- capabilities
- tools
- domain
- description
```

**Output:** Unified agent catalog with capability metadata

### Step 2: Match phase requirements

**Agent tool:**
  subagent_type: `mi-agent-matcher`

Score each available agent against each phase's requirements:

```
Load phase requirements from reference/implement-phase-requirements.md

For each phase in the current operation:
  For each available agent:
    capability_score = count(matching capabilities) / count(required capabilities)
    tool_score = count(matching tools) / count(required tools)
    domain_score = 1.0 if domain matches, else 0.0

    total_score = (capability_score * 0.5) + (tool_score * 0.3) + (domain_score * 0.2)
```

**Scoring thresholds:**
- ≥80% match → auto-select, inform user
- 60-79% match → present options, user picks
- <60% match → fallback to direct execution (if `allow_direct=true`) or escalate

### Step 3: Apply context-aware boosting

Adjust scores based on issue context:

| Issue Label | Boost Agents | Boost Amount |
|-------------|--------------|--------------|
| `frontend` | react-developer, react-code-reviewer | +10% |
| `backend` | nest-developer, nest-code-reviewer | +10% |
| `security` | security-auditor, security-related agents | +15% |
| `bug` | bug-investigator (Phase 2) | +10% |
| `frontend`, `ui`, `ux`, `design`, `accessibility` | ux-designer (Phase 4), ux-reviewer (Phase 8) | +15% |

### Step 4: Present selection plan

**If all phases have ≥80% matches:**
- Auto-select all agents
- Inform user: "Agent selection complete. Using [agent list]."

**If any phase has 60-79% match:**
- Present options using AskUserQuestion:
  ```
  Phase N requires [capabilities]. Select agent:
  Option 1: [agent name] (score%)
  Option 2: [agent name] (score%)
  Option 3: Direct execution (if allowed)
  ```

**If any phase has <60% match:**
- Check if phase allows direct execution (`allow_direct: true`)
- If yes: Fallback to orchestrator direct execution with warning
- If no: Escalate to user with options:
  - Skip phase (if non-mandatory)
  - Create custom agent
  - Approve direct execution with justification

### Step 5: Store selections

Cache agent selections for use in subsequent phases:

```
AGENT_SELECTIONS = {
  phase_0: null,  // Pre-flight runs directly
  phase_1: null,  // Agent selection runs directly
  phase_2: "mi-requirement-analyzer",
  phase_3: "Explore",
  phase_4: "Plan",
  // ... etc for all phases
}
```

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| Agent Catalog | All available agents with capabilities |
| Selection Plan | Phase-to-agent assignments with scores |
| User Confirmations | Decisions for edge cases (<80% matches) |
| Cached Selections | Stored for subsequent phase execution |

---

## Quality Gate

**Success criterion:** All phases have an agent assignment (or `allow_direct=true`); selection plan cached for downstream phases. Phase 1 has no irreversible side effects (no file writes, no agent file creation), so post-step validation is not needed beyond QG-1 below.

---

## QUALITY GATE: QG-1

**Gate Type:** Automated
**Gate ID:** QG-1

### Pass Criteria

| Criterion | Check |
|-----------|-------|
| Discovery complete | All agent sources scanned |
| Matching complete | All phases have scores calculated |
| High matches auto-selected | ≥80% matches assigned automatically |
| Edge cases resolved | <80% matches have user decision or fallback |
| Selections stored | Cache ready for phase execution |
| Mandatory phases covered | No mandatory phase without agent |

### Result

**QG-1 Result:** [PASS | FAIL]

### On FAIL

1. Identify specific failure reason
2. Present to user with options
3. Retry discovery/matching if needed
4. Max 3 retries, then ESCALATE to user

### Escalation Options

| Failure | Resolution |
|---------|------------|
| Agent discovery failed | Check filesystem permissions, retry |
| No agents match mandatory phase | Create custom agent or approve direct execution |
| User declined all options | Abort operation or allow direct execution |
| Selections not cached | Fix storage mechanism, retry |

---

## CONTEXT-AWARE MATCHING

Agent selection adapts to issue characteristics:

### Frontend Issues
If issue has `frontend` label:
- Boost react-developer for Phase 4 (Implementation)
- Boost react-code-reviewer for Phase 7 (Quality Review)

### Backend Issues
If issue has `backend` label:
- Boost nest-developer for Phase 4 (Implementation)
- Boost nest-code-reviewer for Phase 7 (Quality Review)

### Security Issues
If issue has `security` label:
- Boost security-auditor for Phase 7 (Security)
- Require security scanning agent (≥80% match mandatory)

### Bug Issues
If issue has `bug` label:
- Include bug-investigator in Phase 2 (Business Analysis)
- Boost debugging-focused agents

### UI/UX issues
If issue has `frontend`, `ui`, `ux`, `design`, or `accessibility` label (or `has_ui_impact = true`):
- Boost ux-designer for Phase 4 (Architecture – UX design specification)
- Boost ux-reviewer for Phase 8 (Quality Review – UX audit)
- Boost ux-reviewer for Review operation Phase 3 (Execute Review)

---

## FALLBACK BEHAVIOR

When no suitable agent matches a phase:

### If phase has `allow_direct: true`
1. Warn user: "No agent found for Phase N. Running directly (may consume context)."
2. Proceed with orchestrator direct execution
3. Log context cost warning

### If phase has `allow_direct: false`
1. Present options to user:
   - Create custom agent for this phase
   - Approve direct execution with justification
   - Skip phase (if non-mandatory)
   - Abort operation
2. Wait for user decision
3. Proceed based on user choice

### Context Preservation Priority

Even with `allow_direct: true`, agent delegation is PREFERRED:
- Agent runs in separate context window
- Orchestrator context reserved for user interaction
- Direct execution only when no viable alternative

---

## NEXT PHASE

**QG-1 = PASS required to proceed to Phase 2: Business Analysis**

**STOP if QG-1 ≠ PASS. Do not proceed.**
