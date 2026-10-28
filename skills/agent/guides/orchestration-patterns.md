# Orchestration Patterns in Claude Code

## Contents
- The Fundamental Constraint; Impact on Design
- Pattern 1: Main Conversation Orchestration
- Pattern 2: User-Driven Step-by-Step
- Pattern 3: Single Comprehensive Agent
- Pattern 4: Parallel domain audit with consolidated scorecard
- Anti-Pattern: Orchestrator Agent; Migration: Fixing Broken Orchestrators
- Decision Matrix; Examples from Real Projects; Summary

## The Fundamental Constraint

**Agents cannot spawn other agents.** Subagents cannot spawn further subagents.

**Architecture limitation:** Multi-agent workflows are driven from the main conversation, which has the spawn tool (named `Agent` since Claude Code v2.1.63; `Task(...)` still works as an alias). When an agent runs as a subagent, the spawn tool is unavailable to it even if listed in its `tools` configuration — so a subagent cannot spawn further subagents. This prevents infinite nesting of agents.

*Source: Claude Code agent architecture (code.claude.com/docs/en/sub-agents)*

## Impact on Design

Multi-agent workflows cannot use an "orchestrator agent". The orchestration pattern must be implemented at a higher level.

---

## Pattern 1: Main Conversation Orchestration

### When to Use

- Multi-step workflows requiring 2+ specialized agents
- Need retry logic or conditional branching between steps
- Want reusable specialized agents
- Complex workflows with error handling

### Architecture

```
.claude/agents/
├── step-one-agent.md                  ← Specialized worker
├── step-two-agent.md                  ← Specialized worker
└── step-three-agent.md                ← Specialized worker
```

### How It Works

**Main conversation** coordinates agent execution:
1. User requests workflow (or Claude recognizes the need)
2. Main conversation spawns Agent A using the Agent (formerly Task) tool
3. Main conversation evaluates result
4. Decides next action (retry, continue, abort)
5. Spawns Agent B
6. Repeat until complete

**Key insight:** the spawn tool is available in the main conversation; subagents cannot spawn further subagents.

### Implementation Example

**Main conversation orchestrates agents:**

```
User: "Extract and validate issues from interviews/user-research-01.md"

Claude (main conversation):
1. Validates interview exists
2. Spawns issue-extractor agent: Agent("Extract from interviews/user-research-01.md. Next ID: ISS-042")
3. Evaluates result - 8 issues extracted
4. Spawns issue-reviewer agent: Agent("Review extraction against original interview")
5. Review passes
6. Spawns issue-indexer agent: Agent("Update INDEX with new issues")
7. Reports summary to user
```

**Agents remain specialized:**

```yaml
---
name: issue-extractor
tools: Read, Write, Glob, Grep
model: sonnet
skills: domain-specific-skill  # Hypothetical example skill
---

# Role
Extract issues from interviews into structured logs.

## Input/Output
Input: interview path, Next ID (ISS-####)
Output: log path, count, ID range

## Constraints
- NEVER duplicate IDs
- NEVER extract positives
- ALWAYS include verbatim quotes
```

### Benefits

✅ **Modular:** Each agent reusable independently
✅ **Transparent:** User sees each step real-time
✅ **Maintainable:** Workflow logic separate from agent logic
✅ **Flexible:** Easy to add steps, branches, retry logic
✅ **Testable:** Test agents individually or full workflow

### Drawbacks

⚠️ **Verbose:** User sees multiple spawns
⚠️ **Slower:** Context switching overhead
⚠️ **Complex:** More files to maintain

---

## Pattern 2: User-Driven Step-by-Step

### When to Use

- User wants to approve each step manually
- Exploratory workflows (uncertain path)
- One-time sequences
- Learning/debugging multi-step processes

### How It Works

User explicitly drives each step:
```
User: "Analyze file X" → spawns analysis-agent → results
User: "Now format it" → spawns formatter-agent → formatted output
User: "Commit the changes" → spawns commit-agent → done
```

### Implementation

Create specialized agents, user orchestrates manually:
```yaml
---
name: code-analyzer
tools: Read, Grep, Glob
---
Analyze code, return report.

---
name: code-formatter
tools: Read, Write, Edit
---
Format code per style guide.
```

### Benefits

✅ **Maximum control:** Every step requires explicit user approval
✅ **Simple:** No automation needed
✅ **Natural:** Conversational workflow
✅ **Educational:** User sees what each agent does

### Drawbacks

⚠️ **Manual:** User drives every step
⚠️ **Not repeatable:** No automation
⚠️ **Tedious:** For frequent workflows

---

## Pattern 3: Single Comprehensive Agent

### When to Use

- Workflow steps are tightly coupled (can't be separated)
- No need for intermediate user approval
- Steps cannot be reused independently
- Simplicity preferred over modularity

### How It Works

```
User: "Extract and index from interview X"
  → Spawns full-context-extractor → does everything → returns result
```

### Implementation

```yaml
---
name: issue-extraction-full
tools: Read, Write, Edit, Grep, Glob
model: sonnet
skills: domain-specific-skill  # Hypothetical example skill
---

# Role
Complete extraction workflow: extract, validate, index.

## Workflow
1. Validate: read interview, check INDEX, get Next ID
2. Extract: identify issues, create log, format per template
3. Self-validate: check quotes exist, verify severity, ensure format
4. Retry: if fails, revise (max 2x); if passes, continue
5. Index: update INDEX tables, update Next ID

## Output
Log path, count, ID range, INDEX status, validation status

## Constraints
- NEVER skip validation
- NEVER index if validation fails 2x
- ALWAYS use verbatim quotes
```

### Benefits

✅ **Simple:** Single invocation
✅ **Fast:** No context switching
✅ **Atomic:** All-or-nothing workflow
✅ **Clean UX:** One agent, one result

### Drawbacks

⚠️ **Less modular:** Can't reuse steps separately
⚠️ **Larger agent:** More complex prompt
⚠️ **Less transparent:** No intermediate steps visible
⚠️ **Harder to debug:** Difficult to isolate failures

---

## Pattern 4: Parallel domain audit with consolidated scorecard

### When to use

- Compliance audits against a spec or coding standard
- Codebase reviews across orthogonal domains (backend, frontend, IPC, tests)
- Any review where domains can be audited independently without cross-domain dependencies

### Architecture

1. **Partition scope** into N non-overlapping domains (typically 3–5)
2. **Create N audit agents**, each with:
   - Clear domain boundary (e.g., "backend services and IPC handlers only")
   - Reference document (spec, standard, or checklist)
   - Structured output format (requirement ID, status, file:line, note)
3. **Dispatch all N in parallel** using a single message with multiple Agent tool calls
4. **Consolidate** N reports into a single scorecard (orchestrator or coordinator agent)
5. **Present** scorecard with domain totals and prioritized findings

### Domain partition guidance

For Electron/React applications:

| Domain | Scope | Agent focus |
|--------|-------|------------|
| Backend | `src/main/`, services, handlers | Business logic, error handling, resource cleanup |
| Frontend | `src/renderer/`, components, stores, hooks | UI contracts, state management, user flows |
| IPC bridge | `src/shared/`, `src/preload/`, schemas | Channel names, Zod schemas, type consistency |
| Tests & infra | `*.test.*`, `e2e/`, build config, docs | Coverage, CI guards, documentation accuracy |

### Output format

Each audit agent MUST return findings in a consistent structure:

| Req ID | Status | File:line | Note |
|--------|--------|-----------|------|
| FR-001 | compliant | `src/main/services/Foo.ts:42` | Implements interface correctly |
| FR-002 | partial | `src/renderer/components/Bar.tsx:88` | Missing error state |
| FR-003 | non-compliant | – | No evidence found |

Status values: `compliant`, `partial`, `non-compliant`

### Consolidation

The orchestrator merges N domain reports into a single scorecard:

| Domain | Compliant | Partial | Non-compliant |
|--------|-----------|---------|---------------|
| Backend | 13 | 4 | 0 |
| Frontend | 7 | 5 | 0 |
| IPC bridge | 13 | 1 | 4 |
| Tests & infra | 18 | 0 | 2 |
| **Total** | **51** | **10** | **6** |

Then prioritize findings: Must fix → Should fix → Consider.

### Key success factors

- **Orthogonal domains** – agents must not overlap or they'll produce duplicate findings
- **Structured output** – consistent table format enables mechanical consolidation
- **File:line precision** – every finding must cite exact locations for mechanical fixes
- **Effort estimates** – tag each finding as Small/Medium/Large for prioritization

---

## Anti-Pattern: Orchestrator Agent ❌

```yaml
---
name: orchestrator  # ❌ BROKEN - cannot spawn subagents when spawned
tools: Agent  # ❌ Ignored for subagents (Agent, formerly Task)
---
# Tries to spawn agents → FAILS - subagents cannot spawn further subagents
```

**Why it fails:** spawned as subagent → spawn tool unavailable → cannot spawn agents.

**Fix:** Orchestrate from main conversation (Pattern 1) or let user drive (Pattern 2).

---

## Migration: Fixing Broken Orchestrators

### Step 1: Identify the Pattern

Files like:
- `.claude/agents/workflow-orchestrator.md`
- `.claude/agents/extraction-orchestrator.md`
- `.claude/agents/housekeeping-orchestrator.md`

If an agent has `tools: Agent` (or the legacy `tools: Task`) or "spawn" instructions, it's broken.

### Step 2: Choose New Pattern

| Current Setup | Recommended Pattern |
|---------------|---------------------|
| Orchestrator + 2+ specialized agents | **Pattern 1:** Main conversation orchestration |
| Orchestrator + simple sequence | **Pattern 3:** Single comprehensive agent |
| Manual coordination working fine | **Pattern 2:** Keep user-driven (no change needed) |

### Step 3: Remove the Orchestrator Agent

**Delete:**
- `.claude/agents/workflow-orchestrator.md`

**Keep:**
- `.claude/agents/specialized-agent-*.md` (still works as independent agents)

**No new files needed** - Main conversation handles orchestration automatically when you describe the workflow.

### Step 4: Update References

Search for orchestrator references:
```bash
grep -r "workflow-orchestrator" .
```

Update documentation and files mentioning the orchestrator.

---

## Decision Matrix

| Requirement | Recommended Pattern |
|-------------|---------------------|
| 2+ specialized agents with automation | **Pattern 1:** Main conversation orchestration |
| Retry/branching logic needed | **Pattern 1:** Main conversation orchestration |
| User approval between steps | **Pattern 2:** User-driven step-by-step |
| Tightly coupled workflow | **Pattern 3:** Single comprehensive agent |
| Simple one-off sequence | **Pattern 2:** User-driven step-by-step |
| Compliance audit across orthogonal domains | **Pattern 4:** Parallel domain audit |
| Agent spawns agents | ❌ **Impossible** - subagents cannot spawn further subagents |

---

## Examples from Real Projects

### Example 1: Issue Extraction (Pattern 1 - Main Conversation)

**Before (broken):**
```
issue-extraction-orchestrator.md (tools: Agent)
  ├─ spawn extractor (fails)
  ├─ spawn reviewer (fails)
  └─ spawn indexer (fails)
```

**After (working):**
```
.claude/agents/issue-extractor.md (specialized)
.claude/agents/issue-reviewer.md (specialized)
.claude/agents/issue-indexer.md (specialized)
```

Main conversation spawns agents sequentially, evaluates results, implements retry.

### Example 2: Code Review Pipeline (Pattern 1 - Main Conversation)

**Before (broken):**
```
review-orchestrator.md (tools: Agent)
  ├─ spawn analyzer (fails)
  └─ spawn reviewer (fails)
```

**After (working):**
```
.claude/agents/code-analyzer.md (specialized)
.claude/agents/code-reviewer.md (specialized)
```

User says "Review my changes" → main conversation orchestrates both agents.

---

## Summary

**Core principle:** only the main conversation can spawn agents; subagents cannot spawn further subagents.

**Valid approaches:**
1. **Main conversation orchestrates agents** (automated multi-agent workflows)
2. **User drives each step** (manual step-by-step)
3. **Single agent does everything** (no orchestration needed)
4. **Parallel domain audit** (compliance review across orthogonal domains)

**Invalid:**
- ❌ Agent orchestrates other agents (impossible - subagents cannot spawn further subagents)

**Golden rule:** If writing "spawn X agent" in an agent prompt, stop. That agent cannot spawn anything. Orchestration happens from main conversation.
