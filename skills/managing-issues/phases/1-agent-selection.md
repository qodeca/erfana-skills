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
| 5 | software-developer + test-writer (+ e2e-test-writer when e2e is enforced) |
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

Match each available agent against each phase's requirements **qualitatively** – see [../SKILL.md](../SKILL.md) "Selection algorithm". Do not compute or report a numeric match percentage; an LLM cannot derive a reproducible weighted score, so the number would be fabricated.

```
Load phase requirements from reference/implement-phase-requirements.md

For each phase in the current operation:
  For each available agent, classify coverage as:
    full     – declared capabilities cover ALL required capabilities AND tools suffice
    partial  – some but not all required capabilities covered
    none     – no required capability covered
```

`mi-agent-matcher` returns a `score` field. Treat it as an **advisory ranking signal only** – useful for ordering candidates within the same coverage class. Never report it to the user as a confidence figure and never use it as a numeric gate threshold.

**Selection rules (coverage-based, autonomous – rule 16):**
- Full coverage → auto-select, record it
- Partial coverage → auto-select the best-scoring candidate (or default-map agent), record the choice + rationale
- No coverage → fall back to direct execution (if `allow_direct=true`) or the best general-purpose / default agent, record the fallback; `needs_user_input` only on a genuine rule-7 contradiction

### Step 3: Apply context-aware preferences

Adjust candidate ordering based on issue context. These are tie-breakers within a coverage class, not numeric bonuses:

| Issue Label | Prefer agents |
|-------------|---------------|
| `frontend` | react-developer, react-code-reviewer |
| `backend` | nest-developer, nest-code-reviewer |
| `security` | security-auditor, security-related agents |
| `bug` | bug-investigator (Phase 2) |
| `frontend`, `ui`, `ux`, `design`, `accessibility` | ux-designer (Phase 4), ux-reviewer (Phase 8) |

### Step 4: Record the selection plan (autonomous, non-blocking)

**Phase 1 issues no blocking `AskUserQuestion` (SKILL.md rule 16; implement-rules Rule 13).** Agent selection is decided autonomously and recorded in a one-line phase summary the user can watch; the run proceeds.

**If every phase has a full-coverage match:**
- Auto-select all agents (default-map entry, else the full-coverage match)
- Record: "Agent selection complete. Using [agent list]."

**If any phase has only partial coverage:**
- **Auto-select the best-scoring candidate** for that phase (or its default-map agent), the same qualitative ranking used above – prefer the most specific specialist, break ties toward the lower-effort agent.
- Record the choice and a one-line rationale (which required capabilities it covers, which it does not) in the phase summary, and proceed. **No user prompt.**

**If any phase has no coverage:**
- Check if phase allows direct execution (`allow_direct: true`) → fall back to orchestrator direct execution, record the fallback + rationale, proceed.
- Otherwise **fall back to the best available general-purpose / default agent** for that phase (e.g. the builtin `Explore` for read/analysis phases, `Plan` for design), record the fallback + rationale in the phase summary, and proceed.
- **Escalate via `needs_user_input` ONLY on a genuine rule-7 contradiction** – no agent can possibly cover a hard-required capability and proceeding would be unsafe (never a routine "pick one" approval).

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
| Selection Plan | Phase-to-agent assignments with coverage class and rationale |
| User Confirmations | Decisions for edge cases (partial or no coverage) |
| Cached Selections | Stored for subsequent phase execution |
| Task List Advance | Phase 1 and `QG-1 quality gate` marked `completed`; Phase 2 `in_progress` with `QG-2 quality gate` appended – see [../reference/progress-tracking.md](../reference/progress-tracking.md) |

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
| Matching complete | Every phase has a coverage classification (full / partial / none) |
| Full-coverage matches auto-selected | Full-coverage phases assigned automatically |
| Edge cases resolved | Partial- or no-coverage phases have an auto-selected agent or a declared fallback, each recorded with a rationale (no user prompt) |
| Selections stored | Cache ready for phase execution |
| Mandatory phases covered | No mandatory phase without agent |
| Task list advanced | `QG-1 quality gate` and `Phase 1: Agent Selection` `completed`, `Phase 2: Business Analysis` `in_progress`, `QG-2 quality gate` appended as `pending` |

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
- Prefer react-developer for Phase 4 (Implementation)
- Prefer react-code-reviewer for Phase 7 (Quality Review)

### Backend Issues
If issue has `backend` label:
- Prefer nest-developer for Phase 4 (Implementation)
- Prefer nest-code-reviewer for Phase 7 (Quality Review)

### Security Issues
If issue has `security` label:
- Prefer security-auditor for Phase 7 (Security)
- Require a security scanning agent with full coverage of the phase's required capabilities (mandatory – no partial-coverage substitute)

### Bug Issues
If issue has `bug` label:
- Include bug-investigator in Phase 2 (Business Analysis)
- Prefer debugging-focused agents

### UI/UX issues
If issue has `frontend`, `ui`, `ux`, `design`, or `accessibility` label (or `has_ui_impact = true`):
- Prefer ux-designer for Phase 4 (Architecture – UX design specification)
- Prefer ux-reviewer for Phase 8 (Quality Review – UX audit)
- Prefer ux-reviewer for Review operation Phase 3 (Execute Review)

---

## FALLBACK BEHAVIOR

When no suitable agent matches a phase (autonomous, non-blocking – rule 16):

### If phase has `allow_direct: true`
1. Record: "No agent found for Phase N. Running directly (may consume context)."
2. Proceed with orchestrator direct execution
3. Log context cost note in the phase summary

### If phase has `allow_direct: false`
1. **Fall back to the best available general-purpose / default agent** for that phase (e.g. builtin `Explore` for read/analysis, `Plan` for design), record the fallback + a one-line rationale, and proceed.
2. Escalate via `needs_user_input` **only** on a genuine rule-7 contradiction – a hard-required capability no agent can cover and proceeding would be unsafe. Never a routine "pick one" approval.

### Context Preservation Priority

Even with `allow_direct: true`, agent delegation is PREFERRED:
- Agent runs in separate context window
- Orchestrator context reserved for user interaction
- Direct execution only when no viable alternative

---

## NEXT PHASE

**QG-1 = PASS required to proceed to Phase 2: Business Analysis**

**Task list:** on PASS, mark `QG-1 quality gate` then `Phase 1: Agent Selection` `completed`, set `Phase 2: Business Analysis` `in_progress`, and append `QG-2 quality gate` as `pending` ([progress-tracking](../reference/progress-tracking.md)).

**Run state:** record `QG-1=PASS`, refresh `head_sha` / `updated_at` / the task-list snapshot, and PATCH the run-state comment ([post-review-tracking](../reference/post-review-tracking.md) – "Updating in place"). A failed write never fails the gate.

**STOP if QG-1 ≠ PASS. Do not proceed.**
