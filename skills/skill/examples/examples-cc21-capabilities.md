# CC 2.1 Capability examples

Examples demonstrating Claude Code 2.1 features in skill and agent design.

---

## Example 8: Skill using `context: fork`

When a skill triggers a long-running task – such as a full codebase audit or multi-file refactoring – it can conflict with the user's main conversation context. The `context: fork` directive runs the skill in a separate context fork, keeping the main conversation lean.

### When to use fork

- Skill involves reading/processing many files (>20)
- Task may take several minutes
- User wants to continue chatting while the skill works
- Skill loads large guides or templates that would bloat main context

### Complete mini-skill

```yaml
---
name: auditing-dependencies
description: Audit project dependencies for security vulnerabilities and outdated packages. Use when user asks to check, scan, or audit dependencies.
context: fork
model: sonnet
---
```

```xml
<skill>
  <critical-rules>
    - Delegates ALL work to `audit-deps` (shared agent)
    - Runs in forked context – results returned to main conversation on completion
    - EVERY step has input conditions and post-step validation
  </critical-rules>

  <agents>
    | Agent | Purpose | Source | Used In |
    |-------|---------|--------|---------|
    | `audit-deps` | Scan and report dependency issues | shared | Step 1, 2 |
  </agents>

  <workflow>
    <step name="scan">
      <input-conditions>
        - [ ] Project has package manifest (package.json, requirements.txt, etc.)
      </input-conditions>
      <execution>Delegate to `audit-deps`: scan all dependency files</execution>
      <post-validation>
        - [ ] All manifests discovered and scanned
        - [ ] Results structured as JSON
      </post-validation>
    </step>

    <step name="report">
      <execution>Delegate to `audit-deps`: generate summary report</execution>
      <post-validation>
        - [ ] Report includes severity counts
        - [ ] Actionable recommendations provided
      </post-validation>
    </step>
  </workflow>
</skill>
```

The forked context loads the full skill, processes all files, and returns only the final report to the main conversation – saving ~90% of token usage in the primary context.

---

## Example 9: Agent with persistent memory (project scope)

Agents can persist learning across sessions using the `memory` field. This is useful for project conventions that the agent discovers during execution.

### When to use memory

- Agent learns project-specific patterns (naming conventions, file structure)
- Repeated tasks benefit from accumulated knowledge
- Style preferences should persist without re-discovery

### Agent frontmatter + body

```yaml
---
name: code-style-checker
description: Check code against project conventions. Learns and remembers project-specific patterns across sessions.
model: sonnet
memory:
  scope: project
  path: .claude/memory/code-style.md
allowed-tools:
  - Read
  - Grep
  - Glob
---
```

```xml
<agent>
  <purpose>
    Analyze code files for style consistency. When you discover project conventions
    (naming patterns, import ordering, comment styles), persist them to memory
    so future runs are faster and more accurate.
  </purpose>

  <memory-protocol>
    1. On startup: read memory file if it exists
    2. During analysis: compare findings against known conventions
    3. On new discovery: append to memory with evidence (file path + line)
    4. On conflict: flag for user resolution, do not overwrite
  </memory-protocol>

  <output-format>
    Return JSON: {status, violations: [{file, line, rule, suggestion}], new_conventions: [...]}
  </output-format>
</agent>
```

The memory file accumulates entries like:

```markdown
## Discovered conventions
- **Import ordering**: stdlib → third-party → local (evidence: src/main.py:1-15)
- **Naming**: snake_case for functions, PascalCase for classes (evidence: src/models/*.py)
```

---

## Example 10: Hook-enabled agent with lifecycle events

Hooks allow agents to intercept tool calls for safety validation, audit logging, or policy enforcement. They run before (`PreToolUse`) or after (`PostToolUse`) tool execution.

### When to use hooks

- Preventing dangerous operations (force push, file deletion)
- Audit logging for compliance
- Enforcing tool-specific policies (e.g., no writes to production config)

### Agent with hooks

```yaml
---
name: safe-refactorer
description: Refactor code with safety guardrails. Blocks dangerous operations via hooks.
model: sonnet
hooks:
  PreToolUse:
    - tool: Bash
      prompt: |
        Review this bash command for safety. BLOCK if it contains any of:
        - git push --force or git push -f
        - rm -rf with path outside project directory
        - Commands modifying /etc, /usr, or system directories
        - DROP TABLE or DELETE FROM without WHERE clause
        Respond BLOCK with reason, or ALLOW.
    - tool: Edit
      prompt: |
        Review this file edit. BLOCK if it modifies:
        - .env or credentials files
        - CI/CD pipeline configuration
        - Production database connection strings
        Respond BLOCK with reason, or ALLOW.
  PostToolUse:
    - tool: Bash
      prompt: |
        Check the command output for errors or warnings that indicate
        data loss or corruption. If detected, emit a WARNING.
---
```

```xml
<agent>
  <purpose>
    Perform code refactoring with automatic safety validation.
    All tool calls pass through hooks before execution.
  </purpose>

  <workflow>
    1. Analyze target code for refactoring opportunities
    2. Plan changes (read-only – no hooks triggered)
    3. Execute changes (Edit hook validates each modification)
    4. Run tests (Bash hook validates commands)
    5. Report results
  </workflow>
</agent>
```

If a hook blocks an operation, the agent receives the block reason and must find an alternative approach or escalate to the user.

---

## Example 11: Dynamic context injection skill

The `!command` syntax in skill files injects command output at load time. Combined with `$ARGUMENTS` and `$FILE` substitution, this creates skills that adapt to the current project state.

### When to use dynamic injection

- Skill needs current git state (branch, diff, status)
- File-specific operations where the target is known at invocation
- Project metadata that changes between sessions

### Code review skill with dynamic context

```yaml
---
name: reviewing-changes
description: Review staged git changes for quality and consistency. Use when user asks to review changes, check diff, or pre-commit review.
---
```

```xml
<skill>
  <dynamic-context>
    Current branch and staged changes:
    !git branch --show-current
    !git diff --cached --stat

    Full diff for review:
    !git diff --cached
  </dynamic-context>

  <critical-rules>
    - Review ONLY the staged changes shown above
    - Do not modify files – this is a read-only review
    - Delegate analysis to `review-diff` (shared agent)
  </critical-rules>

  <agents>
    | Agent | Purpose | Source | Used In |
    |-------|---------|--------|---------|
    | `review-diff` | Analyze diff for issues | shared | Step 1 |
  </agents>

  <workflow>
    <step name="review">
      <input-conditions>
        - [ ] Staged changes exist (diff is non-empty)
      </input-conditions>
      <execution>Delegate to `review-diff` with the injected diff context</execution>
      <post-validation>
        - [ ] All changed files reviewed
        - [ ] Issues categorized by severity
      </post-validation>
    </step>
  </workflow>
</skill>
```

### Using `$ARGUMENTS` and `$FILE`

For skills invoked with arguments (e.g., `/review src/main.py`):

```xml
<dynamic-context>
  File contents for review:
  !cat $FILE

  Git blame for context:
  !git blame $FILE

  Arguments passed: $ARGUMENTS
</dynamic-context>
```

**Budget warning:** Every line of injected output counts toward context. Use `--stat` instead of full diffs when possible, and pipe through `head -100` for large outputs.

---

## Example 12: Background execution with isolation

For large tasks that don't need immediate results, agents can run in the background. Combined with branch-based isolation, this allows destructive operations without affecting the user's working directory.

### When to use background execution

- Large refactoring across many files
- Long-running test suites
- Tasks where the user wants to continue other work

### Agent with background execution

```yaml
---
name: bulk-migrator
description: Migrate codebase patterns in bulk. Runs in background on a separate branch.
model: sonnet
background: true
allowed-tools:
  - Read
  - Edit
  - Glob
  - Grep
  - Bash
---
```

```xml
<agent>
  <purpose>
    Perform bulk code migrations (e.g., API version upgrades, pattern replacements)
    on a dedicated branch. Creates a branch, makes changes, runs tests, and reports.
  </purpose>

  <isolation-protocol>
    1. Create branch: `git checkout -b migration/{task-id}`
    2. Perform all modifications on the branch
    3. Run test suite to verify changes
    4. Report results – do NOT merge automatically
    5. User reviews and merges manually
  </isolation-protocol>

  <important>
    Per project conventions, use git branches for isolation – never worktrees.
    Always create a new branch before making destructive changes.
  </important>
</agent>
```

**Note:** Per this project's git workflow conventions, isolation uses branches (`git checkout -b`), not worktrees. The agent creates a dedicated branch, performs all work there, and the user merges when satisfied.

---

## When to use CC 2.1 features

| Feature | Use when | Avoid when |
|---------|----------|------------|
| `context: fork` | Long-running tasks, potential context conflicts | Simple, fast operations |
| `memory` | State needs to persist across sessions | Ephemeral task data |
| `hooks` | Safety validation, audit logging | No tool-specific rules needed |
| Dynamic injection | Real-time project state needed | Static reference data |
| `background` | Results not needed immediately | Sequential workflow dependencies |
| Branch isolation | Destructive file operations | Simple read-only analysis |

### Decision flowchart

```
Task duration > 30 seconds?
  ├─ Yes → Consider context: fork
  │        └─ Results needed immediately?
  │             ├─ Yes → Use fork (blocks, returns result)
  │             └─ No  → Use background: true
  └─ No  → Run inline (default)

State persists across sessions?
  ├─ Yes → Add memory: scope: project
  └─ No  → No memory needed

Tool calls need guardrails?
  ├─ Yes → Add hooks (PreToolUse/PostToolUse)
  └─ No  → No hooks needed

Skill needs current project state?
  ├─ Yes → Use !command dynamic injection
  └─ No  → Static content is fine
```
