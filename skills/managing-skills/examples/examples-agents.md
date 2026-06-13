# Shared Agent Workflow Examples

Examples demonstrating the new agent discovery and matching workflow (Step 1.5).

---

## Example 4: Skill Using Builtin Agents Only

A skill that uses only Claude Code builtin agents - no agents/ directory needed.

### User Request

"Create a skill for exploring codebase and planning feature implementation"

### Step 1.5: Discovery & Matching

**Discovery Results:**
```
Builtin agents found: 8
- Explore (explorer): codebase-exploration, file-search, code-search
- Plan (planner): implementation-planning, architecture-design, task-breakdown
- technical-architect, solution-architect, ...

Shared agents found: 0
```

**Matching Results:**
```
Step "Explore codebase":
- Explore (builtin): 100% match ✓
- Plan (builtin): 45% match

Step "Create implementation plan":
- Plan (builtin): 100% match ✓
- Explore (builtin): 30% match
```

**User Confirmation:**
```
For "Explore codebase": Use Explore (builtin) - 100% match? [Yes]
For "Create implementation plan": Use Plan (builtin) - 100% match? [Yes]
```

### Final Structure

```
planning-features/
└── SKILL.md          # No agents/ directory needed!
```

### SKILL.md Content

```markdown
---
name: planning-features
description: Explore codebase and plan feature implementation. Use when planning new features or understanding codebase structure.
---

# Planning Features

## Critical Rules

This skill uses builtin and shared agents:
- Delegates ALL tasks to agents (builtin or shared)
- Agents table MUST include Source column
- EVERY step has input conditions (BLOCKING)
- Quality gates MUST pass (max 3 retries)

## Agents

| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| `Explore` | Explore codebase structure | builtin | Step 1 |
| `Plan` | Create implementation plan | builtin | Step 2 |

## Workflow

### Step 1: Explore Codebase

#### Input Conditions
- [ ] Codebase path provided
- [ ] Feature requirements known

#### Execution
Delegate to: `Explore` (builtin)
Task: Explore codebase to understand structure

#### Post-Step Validation
- [ ] Key files identified
- [ ] Structure understood

### Step 2: Create Plan

#### Input Conditions
- [ ] Step 1 completed
- [ ] Codebase understood

#### Execution
Delegate to: `Plan` (builtin)
Task: Create implementation plan for feature

#### Post-Step Validation
- [ ] Plan created
- [ ] Steps are actionable
```

---

## Example 5: Skill with Mixed Agent Sources

A skill using builtin AND shared agents.

### User Request

"Create a skill for researching topics, validating sources, and generating reports"

### Step 1.5: Discovery & Matching

**Discovery Results:**
```
Builtin agents: 8
Shared agents: 2
- research-agent (research): web-search, documentation-lookup
- code-reviewer (reviewer): code-analysis, best-practices
```

**Matching Results:**
```
Step "Research topic":
- research-agent (shared): 95% match ✓
- Explore (builtin): 40% match

Step "Validate sources":
- No match ≥80% → Recommend creating new shared agent

Step "Generate report":
- No match ≥80% → Recommend creating new shared agent
```

**User Confirmation:**
```
For "Research topic": Use research-agent (shared) - 95% match? [Yes]
For "Validate sources": Create shared agent? [Yes]
For "Generate report": Create shared agent? [Yes]
```

### Final Structure

```
researching-topics/
└── SKILL.md

agents/
├── research-agent.md       # Existing shared
├── validate-sources.md     # New shared
└── generate-report.md      # New shared
```

### SKILL.md Content

```markdown
---
name: researching-topics
description: Research topics, validate sources, and generate reports. Use when creating research reports or gathering information.
---

# Researching Topics

## Critical Rules

This skill uses builtin and shared agents:
- Builtin: Claude Code Task tool agents
- Shared: agents/

## Agents

| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| `research-agent` | Research using web sources | shared | Step 1 |
| `validate-sources` | Validate research sources | shared | Step 2 |
| `generate-report` | Generate formatted report | shared | Step 3 |

## Workflow

### Step 1: Research Topic

#### Execution
Delegate to: `research-agent` (shared: agents/research-agent.md)
Task: Research topic using web sources

### Step 2: Validate Sources

#### Execution
Delegate to: `validate-sources` (shared: agents/validate-sources.md)
Task: Validate and score research sources

### Step 3: Generate Report

#### Execution
Delegate to: `generate-report` (shared: agents/generate-report.md)
Task: Generate formatted report from research
```

---

## Example 6: Swapping Agent Sources

Converting a skill from custom shared agents to builtin equivalents.

### Before (Custom Shared Agents)

```markdown
## Agents

| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| `explore-code` | Explore codebase | shared | Step 1 |
| `review-arch` | Review architecture | shared | Step 2 |
```

### User Request

"Replace my custom shared agents with builtin equivalents where possible"

### Agent Matching

```
explore-code (shared):
- Matches: Explore (builtin) at 92%
- Recommendation: Swap to builtin

review-arch (shared):
- Matches: architecture-reviewer (builtin) at 88%
- Recommendation: Swap to builtin
```

### After (All Builtin)

```markdown
## Agents

| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| `Explore` | Explore codebase | builtin | Step 1 |
| `architecture-reviewer` | Review architecture | builtin | Step 2 |
```

### Changes Made

1. Updated SKILL.md agents table
2. Updated workflow step references
3. Optionally removed unused shared agents from agents/

---

## Agent Source Selection Guide

| Scenario | Recommended Source |
|----------|-------------------|
| Task matches builtin agent exactly | builtin |
| Task matches shared agent ≥80% | shared |
| Task is unique, no match | Create new shared agent |
| Common utility across skills | shared |

### Decision Flow

```
1. Run discovery → list builtin + shared agents
2. Match against requirements → score each
3. If match ≥80%:
   → Present to user for confirmation
   → Use confirmed agent (builtin/shared)
4. If match <80%:
   → Recommend creating new shared agent
   → User confirms or overrides
5. Create skill with selected agents
```

---

## Example 7: Partial Match (60-79%)

When an agent partially matches but doesn't meet the 80% threshold.

### User Request

"Create a skill for code documentation generation"

### Step 1.5: Discovery & Matching

**Matching Results:**
```
Step "Generate documentation":
- Explore (builtin): 65% match (partial)
  - Matched: file-search, code-search
  - Missing: documentation-generation, template-application
- Plan (builtin): 40% match
```

**User Confirmation:**
```
For "Generate documentation":
⚠️ No agent matches ≥80%

Partial matches:
- Explore (builtin): 65% - can find code but cannot generate docs

Options:
1. Use Explore anyway (65% match) [Risk: Missing capabilities]
2. Create new shared agent "generate-docs" [Recommended]
3. Provide custom agent path

User choice: 2 (Create new shared agent)
```

### Outcome

```
Skill: skills/documenting-code/

| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| `Explore` | Find code to document | builtin | Step 1 |
| `generate-docs` | Generate documentation | shared | Step 2 |

New shared agent created at: agents/generate-docs.md
Note: Explore used for exploration (100% match), new shared agent for generation (no match)
```

### Key Takeaways

- Partial matches (60-79%) are flagged with warnings
- User always has choice: use partial match OR create new shared agent
- Recommended approach is to use builtin for matching capabilities, new shared agents for gaps
- Combining sources is valid and often optimal
