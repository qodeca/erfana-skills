# Orchestration advanced patterns

Advanced orchestration techniques for context preservation and dynamic agent selection.

**Prerequisite:** Read `guides/orchestration-patterns.md` for core patterns.

---

## Context preservation

### Why context matters

The orchestrator (skill or main conversation) has a **limited, shared context window**. Every operation the orchestrator performs directly:
- Consumes tokens from the conversation budget
- Reduces space available for user interaction
- May cause context truncation in long sessions

Agents run in **separate context windows**, preserving the main conversation.

### The allow_direct policy

When defining phase requirements (see `templates/phase-requirements-template.md`), each phase has an `allow_direct` flag:

```yaml
phase_documentation:
  capabilities: [documentation-generation, file-editing]
  allow_direct: false  # Delegate to agent

phase_user_confirmation:
  capabilities: [user-interaction]
  allow_direct: true   # Orchestrator can handle
```

### When allow_direct: true is appropriate

`allow_direct: true` is ONLY valid when ALL conditions are met:

| Condition | Rationale |
|-----------|-----------|
| PURELY user interaction | Only AskUserQuestion tool |
| No file operations | No Read, Write, Edit, Glob, Grep |
| No code analysis | No examining or generating code |
| Minimal context usage | <3 tool calls total |

### Examples

**CORRECT – allow_direct: true:**
```yaml
phase_user_confirmation:
  tools: [AskUserQuestion]
  allow_direct: true
  # Only asks user a question, no file operations
```

**WRONG – allow_direct: true:**
```yaml
phase_documentation:
  tools: [Read, Write, Edit]
  allow_direct: true  # WRONG! File operations consume context
```

**CORRECT – allow_direct: false:**
```yaml
phase_documentation:
  tools: [Read, Write, Edit]
  allow_direct: false  # Delegate even for "simple" edits
  notes: File editing consumes context - always delegate
```

### Fallback escalation pattern

When no agent matches the required capabilities:

1. **Partial match first**: Accept any agent with ≥50% capability overlap
2. **User creates agent**: Ask user if they want to create a new shared agent
3. **Explicit justification**: ONLY with user approval AND documented reason, allow direct execution

```markdown
### No agent available – escalation

⚠️ No agent matched capabilities: [list]

Options:
1. Use partial-match agent: [name] (matches: [X]%, missing: [capabilities])
2. Create new shared agent for this phase
3. Allow direct execution (requires justification: _______________)

User selected: [option]
Justification (if option 3): [reason]
```

**"No agent available" is NOT valid justification.** The escalation path exists to ensure context preservation is a conscious trade-off, not a default behavior.

---

## Phase 0.5: Dynamic agent selection

### Pattern overview

Insert an agent selection phase (Phase 0.5) after preflight validation but before substantive work. This pattern enables dynamic capability-based matching at runtime.

### When to use

- Skill has 3+ workflow phases requiring agents
- Agents may come from multiple sources (builtin, shared)
- Agent availability may change over time
- Skill should adapt to user's agent ecosystem

### Architecture

```
Phase 0: Preflight validation
    ↓
Phase 0.5: Agent Selection
    ├── Discover: Scan builtin/shared agents
    ├── Match: Score agents against phase capabilities
    └── Confirm: User approves selections
    ↓
Phase 1+: Execute with selected agents
```

### Implementation

#### Step 1: Define phase requirements

**Recommended (v4.2.x split-file pattern):** create one file per operation under `reference/`, plus a shared-vocab file:

```
reference/
├── phase-requirements-shared.md       # Capability vocab, domain vocab, criticality, allow_direct policy
├── <operation>-phase-requirements.md  # One file per operation
└── conditional-phase-requirements.md  # Conditional phases (label-triggered)
```

Each operation file holds capability definitions for that operation's phases:

```yaml
phase_1_analysis:
  capabilities: [code-search, requirements-analysis]
  tools: [Read, Grep, Glob]
  domain: analysis
  allow_direct: false
```

The shared file holds vocab tables (capabilities by category, domains, criticality levels, allow_direct policy) that all operation files cross-reference.

**Legacy (deprecated as of v4.2.x):** older skills used a single `reference/phase-requirements.md` containing both shared vocab and all operation phases. That pattern is deprecated because it (a) tends to violate the 500-line file cap once shared vocab + multi-operation phase definitions accumulate, and (b) makes one operation implicitly canonical. New skills should use the split pattern. See `managing-issues` for the canonical implementation.

#### Step 2: Create discovery agent

Agent that scans available agents and extracts capabilities:

```markdown
# Agent: ms-agent-discoverer

<task>
Discover all available agents from builtin and shared sources.
</task>

<workflow>
1. List builtin agents (Explore, Plan, general-purpose, etc.)
2. Scan agents/ for shared agents
3. Extract capabilities from each agent's frontmatter
4. Return unified catalog
</workflow>
```

#### Step 3: Create matching agent

Agent that scores agents against phase requirements:

```markdown
# Agent: ms-agent-matcher

<task>
Match discovered agents against phase capability requirements.
</task>

<workflow>
1. Load phase requirements
2. For each phase, score all agents:
   - Capability match: 50% weight
   - Tool match: 30% weight
   - Domain match: 20% weight
3. Rank by total score
4. Return matches ≥60% with recommendations
</workflow>
```

#### Step 4: Add to skill workflow

```markdown
### Phase 0.5: Agent selection

#### Input conditions
- [ ] Phase 0 (preflight) completed
- [ ] Workflow phases defined with capability requirements

#### Execution (Part A – Discovery)
Delegate to: ms-agent-discoverer (shared: agents/ms-agent-discoverer.md)
Task: Scan all agent sources

#### Execution (Part B – Matching)
Delegate to: ms-agent-matcher (shared: agents/ms-agent-matcher.md)
Task: Score agents against requirements

#### Execution (Part C – Confirmation)
Use AskUserQuestion for each phase:
- Present top matches with scores
- Include "Create new shared agent" option
- User selects one per phase

#### Post-step validation
- [ ] All phases have agent selection
- [ ] User confirmed all selections
```

### Benefits

- **Future-proof**: New agents automatically become candidates
- **Flexible**: Adapts to user's agent ecosystem
- **Explicit**: User sees and approves selections
- **Context-aware**: Capability matching ensures good fit

### Anti-pattern: Hardcoded agent names

```markdown
# WRONG – Hardcoded
Delegate to: analyze-requirements  # Fixed agent name

# RIGHT – Dynamic
Delegate to: [selected agent for analysis phase]
```

The Phase 0.5 pattern replaces hardcoded agent names with runtime selection based on capabilities.
