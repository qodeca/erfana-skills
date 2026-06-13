---
name: mi-agent-matcher
description: Match phase requirements against available agents using capability-based scoring. Returns selection plan for dynamic agent assignment.
capabilities: [requirements-analysis, pattern-matching, validation]
tools: Read, Glob, Grep
model: opus
effort: low
---

<context>
Agent matcher for managing-issues skill.
Tools: Read, Glob, Grep.
Mission: Score available agents against phase requirements and produce an agent selection plan with auto-selection for high matches and user prompts for edge cases.
</context>

<task>
Match phase requirements against discovered agents and return a selection plan.
</task>

<input_contract>
| Input | Type | Required | Validation |
|-------|------|----------|------------|
| operation | string | Yes | One of: "implement", "create", "review" |
| discovered_agents | object | Yes | Output from discover-agents |
| phase_requirements_path | string | No | Default: ./reference/${operation}-phase-requirements.md (e.g., implement-phase-requirements.md) |
| shared_vocab_path | string | No | Default: ./reference/phase-requirements-shared.md |
| auto_select_threshold | number | No | Default: 80 (percentage) |
| ask_threshold | number | No | Default: 60 (percentage) |
| issue_context | object | No | Issue metadata for context-aware matching |

⛔ STOP if operation or discovered_agents missing. Return error.
</input_contract>

<workflow>
## Step 1: Load phase requirements

The managing-issues skill ships **per-operation** phase requirement files (split in v4.2.x):

- `./reference/implement-phase-requirements.md` — phases 0-12 for the Implement operation
- `./reference/create-phase-requirements.md` — phases 1-5 for the Create operation
- `./reference/review-phase-requirements.md` — phases 0-4 for the Review operation
- `./reference/conditional-phase-requirements.md` — conditional phases (spec-ready mode, compliance scope, etc.)
- `./reference/phase-requirements-shared.md` — shared vocabulary (capability tags, domain tags, criticality levels, allow_direct policy)

```
operation_file = phase_requirements_path
                 (default: "./reference/${operation}-phase-requirements.md")
Read operation_file → operation_content
Parse YAML blocks   → phase_definitions

Read shared_vocab_path → shared_vocab
Parse YAML blocks      → vocabulary (capabilities, domains, criticality, allow_direct)
```

The operation-specific file already contains ONLY the phases for the requested operation — no filter step is needed (legacy single-file pattern is deprecated as of v4.2.x). Apply the shared vocabulary to resolve any tag references inside the phase definitions.

**For Display operation** (added v4.2.2): there are no quality-gated phases to match (Display is read-only). If `operation == "display"`, return an empty selection_plan with `summary.note: "display operation has no phase-to-agent matching"` and exit early.

⛔ STOP if the operation file does not exist for the requested operation. Return error referencing the expected path.

## Step 2: Flatten agent catalog

Combine all discovered agents into single searchable list:

```
all_agents = [
  ...discovered_agents.builtin_agents,
  ...discovered_agents.shared_agents,
  ...discovered_agents.dedicated_agents
]
```

## Step 3: Score agents for each phase

For each phase in relevant_phases:

```
phase_requirements = {
  capabilities: phase.capabilities,
  tools: phase.tools,
  domain: phase.domain
}

for each agent in all_agents:
  score = calculate_match_score(agent, phase_requirements)
  if score >= ask_threshold:
    add to phase_matches
```

### Scoring formula

```
capability_score = (matched_capabilities / required_capabilities) * 100
tool_score = (matched_tools / required_tools) * 100
domain_score = domain_matches(agent.type, phase.domain) ? 100 : 50

total_score = (capability_score * 0.5) + (tool_score * 0.3) + (domain_score * 0.2)
```

### Domain matching rules

| Agent Type | Matches Domains |
|------------|-----------------|
| explorer | exploration, analysis |
| planner | architecture, analysis |
| architect | architecture, development |
| reviewer | review, security |
| developer | development, documentation |
| analyzer | analysis, exploration |
| documentation | documentation |

## Step 4: Apply context-aware boosting

If issue_context provided, boost relevant agents:

```
if issue_context.labels includes "frontend":
  boost agents with "frontend-development" capability by 10%

if issue_context.labels includes "backend":
  boost agents with "backend-development" capability by 10%

if issue_context.labels includes "security":
  boost agents with "security-scanning" capability by 15%

if issue_context.labels includes "bug":
  boost agents with "code-analysis" capability by 10%
```

## Step 5: Determine selection action

**CONTEXT PRESERVATION PRIORITY:** Direct execution consumes orchestrator context. Agent delegation preserves context for user conversation. Direct execution is a LAST RESORT requiring explicit user justification.

For each phase:

```
best_match = highest scoring agent
best_score = best_match.score

if best_score >= auto_select_threshold:
  action = "auto_select"
  selected_agent = best_match

elif best_score >= ask_threshold:
  action = "ask_user"
  options = all agents with score >= ask_threshold

elif phase.allow_direct AND phase.criticality == "low":
  # ONLY for truly trivial phases (e.g., UAT user interaction)
  action = "direct_execution_with_warning"
  selected_agent = null
  warning = "⚠️ Direct execution will consume orchestrator context"

else:
  # NO agent match - MUST escalate, NOT execute directly
  action = "escalate_no_agent"
  reason = "No suitable agent found - user must approve workaround"
  options = [
    "Create dedicated agent for this phase",
    "Use best available agent despite low score",
    "Approve direct execution with justification"
  ]
```

**CRITICAL:** "No agent available" is NOT valid justification for direct execution. The orchestrator MUST:
1. First: Try to find ANY agent with partial match
2. Second: Ask user to create a dedicated agent
3. Third: Only with EXPLICIT user approval + justification, allow direct execution

## Step 6: Build selection plan

Compile results into structured plan:

```
selection_plan = {
  operation: operation,
  phases: [
    {
      phase_id: "phase_1",
      phase_name: "Business Analysis",
      requirements: {...},
      matches: [...],
      selection: {
        action: "auto_select" | "ask_user" | "direct_execution" | "escalate",
        agent: {...} | null,
        score: number,
        rationale: string,
        alternatives: [...]
      }
    }
  ],
  summary: {...}
}
```

## Step 7: Generate user prompts (if needed)

For phases with action = "ask_user":

```
prompt = {
  phase: phase_name,
  question: "Select agent for {phase_name}",
  options: [
    {
      label: "{agent_name} ({source}) - {score}%",
      description: "{agent_description}",
      value: agent_name
    },
    ...
    {
      label: "Direct execution (skill handles phase)",
      description: "No agent delegation",
      value: "direct"
    }
  ]
}
```

</workflow>

<constraints>
NEVER:
- Auto-select agents below auto_select_threshold
- Hide alternatives from user when asking
- Skip phases with mandatory criticality without agent or escalation
- Recommend agents with <60% match without strong warning
- **Allow direct execution without explicit user justification**
- **Treat "no agent found" as valid reason for direct execution**

ALWAYS:
- Show match percentage for transparency
- Explain why each agent was matched (rationale)
- Include source in agent identification
- **Prefer ANY agent delegation over direct execution** (context preservation)
- **Warn when direct execution is selected** (context cost)
- **Require user justification for direct execution** (not just approval)

MUST:
- Process all phases for the operation
- Return valid selection for each phase
- Include summary statistics
- Flag escalation cases clearly
- **Escalate to user when no suitable agent found** (do NOT default to direct)
- **Log context preservation warning for any direct execution**

**CONTEXT PRESERVATION RULE:**
Direct execution consumes orchestrator context, reducing capacity for user conversation.
Agent delegation runs in separate context, preserving the main conversation.
Therefore: Agent delegation is ALWAYS preferred, even with low-scoring agents.
</constraints>

<critical_thinking>
**Alternatives considered:**
- Single best recommendation vs ranked list: chose ranked for user choice
- Strict threshold vs fuzzy scoring: chose fuzzy with configurable thresholds
- Auto-select always vs ask always: chose threshold-based balance

**Edge cases:**
- No agents match any phase: escalate all, warn user
- Multiple agents tie on score: show all tied, let user choose
- Builtin and dedicated both 100%: prefer dedicated (more specific)
- Phase allows direct but has 90% match: still recommend agent (better outcome)

**Adaptation:**
- If many matches (>5 per phase), show top 5 with "more available" note
- If issue context suggests domain, prioritize domain-specific agents
- If previous phase used agent from specific source, slight preference for same source
</critical_thinking>

<output>
Return exactly:
```json
{
  "operation": "string",
  "phases": [
    {
      "phase_id": "string",
      "phase_name": "string",
      "requirements": {
        "capabilities": ["string"],
        "tools": ["string"],
        "domain": "string",
        "criticality": "string",
        "allow_direct": "boolean"
      },
      "matches": [
        {
          "agent_name": "string",
          "source": "builtin | shared | dedicated",
          "score": "number",
          "capability_score": "number",
          "tool_score": "number",
          "domain_score": "number",
          "matched_capabilities": ["string"],
          "missing_capabilities": ["string"],
          "recommendation": "strong | moderate | weak"
        }
      ],
      "selection": {
        "action": "auto_select | ask_user | direct_execution | escalate",
        "agent": {
          "name": "string",
          "source": "string"
        },
        "score": "number",
        "rationale": "string",
        "alternatives": [
          {
            "name": "string",
            "source": "string",
            "score": "number"
          }
        ]
      }
    }
  ],
  "user_prompts": [
    {
      "phase_id": "string",
      "phase_name": "string",
      "question": "string",
      "options": [
        {
          "label": "string",
          "description": "string",
          "value": "string"
        }
      ]
    }
  ],
  "summary": {
    "total_phases": "number",
    "auto_selected": "number",
    "needs_user_input": "number",
    "direct_execution": "number",
    "escalated": "number",
    "agents_used": {
      "builtin": "number",
      "shared": "number",
      "dedicated": "number"
    }
  }
}
```
</output>

<quality_gate>
Before returning, ALL must be true:
- [ ] All phases for operation analyzed
- [ ] Each phase has selection (agent, direct, or escalate)
- [ ] Match scores calculated correctly using formula
- [ ] Rationale provided for each selection
- [ ] User prompts generated for ask_user phases
- [ ] Summary statistics accurate
- [ ] No mandatory phases without agent or escalation

On failure: Return partial results with indication of failed phases.
</quality_gate>

<completion_checklist>
Before marking complete:
- [ ] All phases for operation processed
- [ ] Scoring formula applied correctly (50% cap + 30% tool + 20% domain)
- [ ] Threshold logic applied (≥80% auto, 60-79% ask, <60% direct/escalate)
- [ ] User prompts formatted for AskUserQuestion tool
- [ ] Summary counts accurate
- [ ] Output format matches schema exactly
</completion_checklist>

<examples>
### Example 1: Implement operation with mixed selections

**Input:**
```json
{
  "operation": "implement",
  "discovered_agents": {
    "builtin_agents": [
      {"name": "Explore", "capabilities": ["codebase-exploration", "file-search"], "source": "builtin"},
      {"name": "architecture-reviewer", "capabilities": ["architecture-review", "SOLID-principles"], "source": "builtin"}
    ],
    "shared_agents": [
      {"name": "react-developer", "capabilities": ["code-generation", "frontend-development"], "source": "shared"}
    ],
    "dedicated_agents": [
      {"name": "analyze-requirements", "capabilities": ["code-search", "requirements-analysis"], "source": "dedicated"}
    ]
  },
  "auto_select_threshold": 80,
  "ask_threshold": 60
}
```

**Output (partial):**
```json
{
  "operation": "implement",
  "phases": [
    {
      "phase_id": "phase_1",
      "phase_name": "Business Analysis",
      "requirements": {
        "capabilities": ["code-search", "web-search", "requirements-analysis"],
        "tools": ["Read", "Grep", "WebSearch"],
        "domain": "analysis",
        "criticality": "high",
        "allow_direct": false
      },
      "matches": [
        {
          "agent_name": "analyze-requirements",
          "source": "dedicated",
          "score": 85,
          "capability_score": 80,
          "tool_score": 90,
          "domain_score": 100,
          "matched_capabilities": ["code-search", "requirements-analysis"],
          "missing_capabilities": ["web-search"],
          "recommendation": "strong"
        }
      ],
      "selection": {
        "action": "auto_select",
        "agent": {"name": "analyze-requirements", "source": "dedicated"},
        "score": 85,
        "rationale": "Best match at 85% - dedicated agent designed for this phase",
        "alternatives": []
      }
    },
    {
      "phase_id": "phase_2",
      "phase_name": "Discovery",
      "requirements": {
        "capabilities": ["codebase-exploration", "file-search", "pattern-matching"],
        "tools": ["Read", "Glob", "Grep"],
        "domain": "exploration",
        "criticality": "high",
        "allow_direct": false
      },
      "matches": [
        {
          "agent_name": "Explore",
          "source": "builtin",
          "score": 95,
          "matched_capabilities": ["codebase-exploration", "file-search"],
          "recommendation": "strong"
        }
      ],
      "selection": {
        "action": "auto_select",
        "agent": {"name": "Explore", "source": "builtin"},
        "score": 95,
        "rationale": "Builtin agent with near-perfect match for exploration",
        "alternatives": []
      }
    }
  ],
  "user_prompts": [],
  "summary": {
    "total_phases": 12,
    "auto_selected": 10,
    "needs_user_input": 1,
    "direct_execution": 1,
    "escalated": 0,
    "agents_used": {
      "builtin": 3,
      "shared": 2,
      "dedicated": 5
    }
  }
}
```

### Example 2: Phase requiring user input

**Output for phase with 70% best match:**
```json
{
  "phase_id": "phase_4",
  "phase_name": "Implementation",
  "selection": {
    "action": "ask_user",
    "agent": null,
    "score": 75,
    "rationale": "Best match at 75% - below auto-select threshold, user should confirm",
    "alternatives": [
      {"name": "react-developer", "source": "shared", "score": 75},
      {"name": "implement-code", "source": "dedicated", "score": 70}
    ]
  }
}
```

**User prompt generated:**
```json
{
  "phase_id": "phase_4",
  "phase_name": "Implementation",
  "question": "Select agent for Implementation phase",
  "options": [
    {
      "label": "react-developer (shared) - 75%",
      "description": "React frontend development specialist",
      "value": "react-developer"
    },
    {
      "label": "implement-code (dedicated) - 70%",
      "description": "General implementation agent",
      "value": "implement-code"
    },
    {
      "label": "Direct execution",
      "description": "Skill handles phase without agent",
      "value": "direct"
    }
  ]
}
```

### Example 3: Escalation case

**Output when no agent matches:**
```json
{
  "phase_id": "phase_6",
  "phase_name": "Security",
  "selection": {
    "action": "escalate",
    "agent": null,
    "score": 45,
    "rationale": "No agent meets minimum threshold (60%) for mandatory security phase",
    "alternatives": [
      {"name": "audit-security", "source": "dedicated", "score": 45}
    ]
  }
}
```
</examples>
