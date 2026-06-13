# Domain-Specific Edge Cases

Pre-built edge case question sets for different skill and agent types. Use these to populate the "Edge Cases" subsection in critical thinking sections.

---

## By Skill Type

### Orchestrator Skills

Skills that coordinate multiple agents through workflows.

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if agent N fails mid-workflow? | Checkpoint before each agent, retry or rollback |
| What if user cancels between steps? | Save partial state, allow resume |
| What if partial state exists from previous run? | Detect and offer: resume, restart, or abort |
| What if two steps need the same resource? | Lock resources, queue operations |
| What if step times out? | Configurable timeout, graceful degradation |
| What if output of step N doesn't match input contract of step N+1? | Validate at boundaries, fail fast |

### Code Manipulation Skills

Skills that read, modify, or generate code.

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if file is locked/read-only? | Check permissions first, report clearly |
| What if file encoding is non-UTF8? | Detect encoding, convert or warn |
| What if file exceeds size limits? | Stream processing or reject with size info |
| What if file has merge conflicts markers? | Detect and abort, or resolve conflicts first |
| What if target line numbers have shifted? | Use content matching, not line numbers |
| What if file was modified during operation? | Check hash before write, warn on conflict |

### Research/Analysis Skills

Skills that gather and synthesize information.

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if API rate limit hit? | Exponential backoff, cache results |
| What if data is stale/outdated? | Check timestamps, flag freshness |
| What if sources conflict? | Document all positions, note confidence |
| What if search returns no results? | Expand terms, try alternatives, report honestly |
| What if content is behind paywall? | Note limitation, suggest alternatives |
| What if URL redirects or is broken? | Follow redirects, report broken links |

### Validation Skills

Skills that check correctness or quality.

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if score is exactly at threshold? | Document behavior, prefer fail-safe |
| What about false positives? | Allow suppress/ignore with documentation |
| What about false negatives? | Err on side of caution for security |
| What if validation criteria conflict? | Priority order, document resolution |
| What if input is valid but unusual? | Warn but don't fail, note in output |
| What if validation takes too long? | Timeout per check, partial results |

### File Processing Skills

Skills that transform or process files.

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if input is empty file? | Valid state: return empty or skip |
| What if output would overwrite existing? | Prompt user, backup, or use unique name |
| What if disk space is insufficient? | Check before write, clean temp files |
| What if file path contains special characters? | Escape properly, use safe paths |
| What if file is a symlink? | Follow or resolve based on intent |
| What if processing creates circular references? | Detect cycles, report error |

---

## By Agent Type

### Requirements Gathering Agents

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if user provides conflicting requirements? | Flag conflict, ask for priority |
| What if user says "I don't know"? | Provide recommendation, explain trade-offs |
| What if user provides incomplete answers? | Note gaps, ask follow-up or proceed with defaults |
| What if user wants to change previous answer? | Allow revision, update all dependencies |
| What if requirements exceed skill complexity? | Suggest splitting into multiple skills |

### Design Agents

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if name conflicts with existing skill? | Check namespace, suggest alternatives |
| What if complexity assessment disagrees with user? | Explain reasoning, allow override |
| What if design requires unavailable tools? | Note dependency, suggest alternatives |
| What if design pattern doesn't fit use case? | Document deviation, explain trade-offs |

### Implementation Agents

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if target directory already exists? | Prompt: overwrite, merge, or abort |
| What if template references missing files? | Create stubs or abort with error |
| What if generated code exceeds line limits? | Split into modules, note in output |
| What if dependencies are unavailable? | Document requirement, provide install instructions |

### Review/Audit Agents

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if skill uses patterns not in checklist? | Note as "uncategorized", don't auto-fail |
| What if checklist criteria are contradictory? | Document conflict, escalate |
| What if skill is too complex for quick review? | Recommend standard/deep, explain why |
| What if previous review exists? | Compare with previous, note changes |

### Modification Agents

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if backup location is full? | Alternative location or warn user |
| What if modification breaks existing tests? | Report regression, suggest fixes |
| What if modification affects multiple files unexpectedly? | Show impact analysis before proceeding |
| What if rollback is requested after further changes? | Warn about cascade, confirm |

### Maintenance Agents

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if dependencies have security vulnerabilities? | Report urgently, suggest updates |
| What if linked resources are gone? | Flag as broken, suggest removal |
| What if skill hasn't been used recently? | Note inactivity, suggest review |
| What if skill version is incompatible with current Claude? | Document migration needs |

### Agent not discovered after creation

**Scenario:** A new shared agent was created in `agents/` during skill creation (Step 3), but Step 1.5 agent discovery does not find it when re-run.

**Cause:** Shared agents are loaded at session startup, not dynamically. The Agent tool's available types are fixed for the session lifetime.

**Resolution:** Restart the session. The new agent will be loaded and discoverable in the fresh session. This is expected behavior, not a bug.

---

## Generic Edge Cases (Apply to All)

These apply regardless of skill/agent type:

| Edge Case | Handling Strategy |
|-----------|-------------------|
| What if user input contains malicious content? | Sanitize input, never execute directly |
| What if operation would take very long? | Estimate time, offer progress updates |
| What if context window is nearly full? | Prioritize, summarize, or paginate |
| What if previous run left partial state? | Detect, offer cleanup |
| What if user has insufficient permissions? | Fail early, explain what's needed |
| What if network is unavailable? | Fail gracefully, cache when possible |

---

## Using This Library

### In Agent Critical Thinking Section

Select 4-6 edge cases most relevant to your agent type:

```markdown
### Edge Cases
- What if file encoding is non-UTF8? → Detect encoding, convert or warn
- What if file exceeds size limits? → Stream processing or reject with size
- What if target line numbers shifted? → Use content matching, not line numbers
- What if file was modified during operation? → Check hash before write
```

### In Skill Design Phase

When designing a skill, review relevant categories:
1. Check skill type section
2. Check agent type sections for each planned agent
3. Add generic edge cases that apply
4. Document handling strategies in agents

### Customizing for Your Domain

Add domain-specific edge cases as you discover them:

```markdown
### [Your Domain] Skills

| Edge Case | Handling Strategy |
|-----------|-------------------|
| [Your edge case] | [Your strategy] |
```

---

## Maintenance

This library should be updated when:
- New edge cases are discovered during skill creation
- Handling strategies prove ineffective
- New skill/agent types are added
- Claude capabilities change

Last updated: 2025-12-18
