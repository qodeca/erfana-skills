# Orchestration patterns

How skills coordinate agent execution in Claude Code.

---

## The fundamental constraint

**Agents cannot spawn other agents.** Subagents do not have access to the Task tool.

When an agent is spawned as a subagent, it does not have access to the Task tool, even if Task is listed in its `tools` configuration. This prevents infinite nesting of agents.

**Impact:** Multi-agent workflows cannot use an "orchestrator agent". The orchestration pattern MUST be implemented at the skill level.

---

## Pattern 1: Skill-based orchestration (recommended)

### When to use

- Multi-step workflows requiring 3+ specialized agents
- Need retry logic or conditional branching between steps
- Want reusable specialized agents
- Complex workflows with error handling

### Architecture

```
skill-name/
├── SKILL.md                   ← Orchestrates (has Task tool)
├── templates/
└── validation/

Agents used by skill come from:
- Builtin agents (Claude Code)
- Shared agents (agents/)
```

### How it works

1. User activates skill
2. Skill spawns Agent A using Task tool
3. Skill evaluates result
4. Skill decides next action (retry, continue, abort)
5. Skill spawns Agent B
6. Repeat until complete

**Key insight:** Skills run in main conversation context with Task tool access. Spawned agents lack Task access.

### Implementation example

**Skill coordinates agents:**

```markdown
---
name: issue-extraction
description: Extract and validate issues from interviews.
---

## Workflow

1. **Validate:** Check interview exists, get Next ID
2. **Extract:** Spawn issue-extractor
   ```
   Task(subagent_type: "issue-extractor", prompt: "Extract from [path]. Next ID: ISS-####")
   ```
   Collect: log path, count, ID range
3. **Review:** Spawn issue-reviewer
   ```
   Task(subagent_type: "issue-reviewer", prompt: "Review [log] vs [interview]")
   ```
   Collect: PASS/FAIL, errors
4. **Handle:** If FAIL + attempt<2: retry. If FAIL + attempt=2: stop. If PASS: continue
5. **Index:** Spawn issue-indexer
6. **Report:** Show summary
```

**Agents remain specialized:** Each agent has clear input/output contracts and single responsibility.

### Benefits

- **Modular:** Each agent reusable independently
- **Transparent:** User sees each step real-time
- **Maintainable:** Workflow logic separate from agent logic
- **Flexible:** Easy to add steps, branches, retry logic
- **Testable:** Test agents individually or full workflow

### Drawbacks

- **Verbose:** User sees multiple spawns
- **Slower:** Context switching overhead
- **Complex:** More files to maintain

---

## Pattern 2: Main conversation orchestration

### When to use

- User wants to approve each step manually
- Exploratory workflows (uncertain path)
- One-time sequences
- Learning/debugging multi-step processes

### How it works

User drives each step:
```
User: "Analyze file X" → spawns analysis-agent → results
User: "Format it" → spawns formatter-agent → formatted output
User: "Commit" → spawns commit-agent → done
```

### Implementation

Create specialized agents, let user orchestrate:
```markdown
# Agent: code-analyzer
Tools: Read, Grep, Glob
Analyze code, return report.

# Agent: code-formatter
Tools: Read, Write, Edit
Format code per style guide.
```

Usage: `"Analyze auth module"` → analyzer | `"Format results"` → formatter

### Benefits

- **Maximum control:** Every step requires approval
- **Simple:** No orchestration infrastructure
- **Natural:** Conversational workflow
- **Educational:** User sees what each agent does

### Drawbacks

- **Manual:** User drives every step
- **Not repeatable:** No automation
- **Tedious:** For frequent workflows

---

## Pattern 3: Single comprehensive agent

### When to use

- Workflow steps are tightly coupled (can't be separated)
- No need for intermediate user approval
- Steps cannot be reused independently
- Simplicity preferred over modularity

### How it works

```
User: "Extract and index from interview X"
  → Spawns comprehensive-extractor → does everything → returns result
```

### Implementation

```markdown
# Agent: issue-extraction-full

## Purpose
Complete extraction workflow: extract, validate, index.

## Workflow
1. Validate: read interview, check INDEX, get Next ID
2. Extract: identify issues, create log, format per template
3. Self-validate: check quotes exist, verify severity, ensure format
4. Retry: if fails, revise (max 2x); if passes, continue
5. Index: update INDEX tables, update Next ID

## Output
Log path, count, ID range, INDEX status, validation status
```

### Benefits

- **Simple:** Single invocation
- **Fast:** No context switching
- **Atomic:** All-or-nothing workflow
- **Clean UX:** One agent, one result

### Drawbacks

- **Less modular:** Can't reuse steps separately
- **Larger agent:** More complex prompt
- **Less transparent:** No intermediate steps visible
- **Harder to debug:** Difficult to isolate failures

---

## Anti-pattern: Orchestrator agent

```yaml
---
name: orchestrator  # BROKEN - lacks Task tool when spawned
tools: Task         # Ignored for subagents
---
# Tries to spawn agents → FAILS - no Task tool
```

**Why it fails:** Spawned as subagent → Task unavailable → cannot spawn agents.

**Fix:** Move orchestration to skill (Pattern 1) or main conversation (Pattern 2).

---

## Decision matrix

| Requirement | Recommended Pattern |
|-------------|---------------------|
| 3+ reusable specialized agents | **Pattern 1:** Skill-based |
| Retry/branching logic needed | **Pattern 1:** Skill-based |
| User approval between steps | **Pattern 2:** Main conversation |
| Tightly coupled workflow | **Pattern 3:** Single agent |
| Simple one-off sequence | **Pattern 2:** Main conversation |
| Frequently repeated workflow | **Pattern 1:** Skill-based |
| Agent spawns agents | **Impossible** - rethink design |

---

## CC 2.1 orchestration patterns

### Pattern 4: Forked context execution

Use `context: fork` in skill frontmatter to run the entire skill in a separate context. The main conversation stays lean while the skill processes independently.

```yaml
---
name: heavy-analysis
context: fork
---
```

**When to use:** Skills that load many guides/templates, process large codebases, or run for many turns.

### Pattern 5: Skills preloading via agents

Agents can auto-load skills via the `skills` frontmatter field:

```yaml
---
name: code-writer
skills: code-quality-standards, security-patterns
---
```

The skill content is injected into the agent's context when spawned. Use for agents that need domain knowledge without manual context passing.

### Pattern 6: Background agent execution

```yaml
background: true
```

The agent runs asynchronously. The orchestrator continues other work and is notified on completion. Use for independent, long-running tasks.

### Pattern 7: Branch-based isolation

For agents performing destructive operations, use branch isolation:

```markdown
<isolation-protocol>
1. Create branch: `git checkout -b task/{id}`
2. Perform all modifications on the branch
3. Run tests to verify
4. Report results – user merges manually
</isolation-protocol>
```

> **Note:** This project prefers branches over worktrees for isolation (see CLAUDE.md). The CC 2.1 `isolation: worktree` field exists but branches are recommended for simplicity.

### Updated decision matrix

| Requirement | Recommended Pattern |
|-------------|---------------------|
| Long-running skill with many reference files | **Pattern 4:** Forked context |
| Agent needs domain knowledge from skills | **Pattern 5:** Skills preloading |
| Independent task, results not needed now | **Pattern 6:** Background execution |
| Destructive file operations | **Pattern 7:** Branch isolation |
| Task(agent_type) restrictions | Use registered agent names only |

---

## Migration: Fixing broken orchestrators

### Step 1: Identify the pattern

Files with these characteristics are broken:
- Located in `.claude/agents/` with `tools: Task`
- Contains "spawn" or "delegate to" instructions
- Named `*-orchestrator.md`

### Step 2: Choose new pattern

| Current setup | Recommended pattern |
|---------------|---------------------|
| Orchestrator + 3+ specialized agents | **Pattern 1:** Skill-based |
| Orchestrator + simple sequence | **Pattern 3:** Single comprehensive agent |
| Manual coordination working fine | **Pattern 2:** Keep manual |

### Step 3: Migrate to skill-based orchestration

**Delete:**
- `.claude/agents/workflow-orchestrator.md`

**Keep:**
- Specialized agent files (if in agents/)

**Create:**
- `.claude/skills/workflow-skill/SKILL.md`
- Reference agents from builtin or shared sources

**Move logic:**
1. Copy workflow from agent prompt
2. Paste into skill "Workflow" section
3. Add Task tool spawning for each agent
4. Add evaluation/retry logic between spawns
5. Test with real example

---

## Summary

**Core principle:** Only skills and main conversation have Task tool access. Subagents do not.

**Valid approaches:**
1. **Skill orchestrates agents** (complex workflows)
2. **Main conversation orchestrates agents** (user-driven)
3. **Single agent does everything** (simple workflows)

**Invalid:**
- Agent orchestrates other agents (impossible)

**Golden rule:** If writing "spawn X agent" in agent prompt, stop. Move logic to skill.

---

## Advanced patterns

For advanced orchestration techniques, see `guides/orchestration-advanced.md`:
- **Context preservation** – managing context budget and delegation policies
- **Phase 0.5: Dynamic agent selection** – runtime capability-based agent matching
