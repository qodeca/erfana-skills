# Agent Anti-Patterns Guide

## Contents
- Severity Levels
- Critical Anti-Patterns
- High Priority Anti-Patterns
- Medium priority
- Quick Reference; See Also

Common mistakes when creating Claude Code agents and how to avoid them.

---

## Severity Levels

**Critical (Automatic Fail):**
- Violates architectural rules
- Creates security risks
- Prevents agent from working

**High Priority:**
- Reduces effectiveness
- Wastes context window
- Poor user experience

**Medium Priority:**
- Misses best practices
- Harder to maintain

---

## Critical Anti-Patterns

### Anti-pattern 1: Agent spawning other agents

**Why it fails:** the spawn tool (Agent, formerly Task) is filtered out for subagents. Only the main orchestrator (skill) can spawn agents.

**Wrong:**
```yaml
---
name: code-orchestrator
description: Orchestrate code analysis workflows
tools:
  - Agent  # ❌ Filtered out - subagents cannot spawn further subagents
  - Read
  - Grep
---

<context>
You are a code orchestrator. Use the Agent tool to delegate work to specialized agents for different types of analysis.
</context>

<workflow>
1. Analyze code structure
2. Use the Agent tool to spawn:
   - `security-analyzer` for security checks
   - `performance-analyzer` for performance review
   - `style-analyzer` for code style
3. Aggregate results
</workflow>
```

**What happens:**
- Agent tries to use the spawn tool → not available (filtered for subagents)
- Agent fails with "Unknown tool" error
- Workflow broken, user frustrated

**Correct approach:**
```yaml
---
name: code-analyzer
description: Analyze code for security, performance, and style issues
tools:
  - Read
  - Grep
  - Glob
  - Bash
---

<context>
You analyze code comprehensively. If multiple specialized agents are needed, request orchestration.
</context>

<workflow>
1. Analyze code structure
2. Perform available analyses (security patterns, performance patterns, style)
3. If task requires multiple specialized agents:
   - Return needs_user_input with orchestration request
   - Let orchestrator coordinate specialized agents
4. Otherwise, complete analysis and return results
</workflow>

<output>
If orchestration needed, return:
{
  "status": "needs_user_input",
  "reason": "requires_orchestration",
  "question": {
    "header": "Orchestration needed",
    "question": "This analysis requires multiple specialized agents. Coordinate them in main conversation?",
    "options": [
      {"label": "Orchestrate", "description": "Use main conversation to run specialized agents"},
      {"label": "Basic analysis", "description": "Complete basic analysis without specialization"}
    ]
  },
  "recommendation": "Use main conversation to coordinate: @security-analyzer, @performance-analyzer, @style-analyzer"
}
</output>
```

**Key difference:** Agent recognizes orchestration limits, returns `needs_user_input` for orchestrator to handle.

---

### Anti-pattern 2: Overly broad tool access

**Why it fails:** Violates principle of least privilege, creates security risk.

**Wrong:**
```yaml
---
name: file-counter
description: Count files by extension
# ❌ Tools field omitted = inherits ALL tools (security risk)
---
```

**What happens:**
- Agent inherits ALL available tools
- Agent can Write, Edit, Bash with full permissions
- Security risk: agent designed to "count files" can now modify codebase
- Violates architectural rule #5 (principle of least privilege)
- Validation fails with critical severity

**Correct:**
```yaml
---
name: file-counter
description: Count files by extension
tools:
  - Glob  # Find files by pattern
  - Read  # Verify file types if needed
# Only tools needed for counting files
---
```

**Tool selection checklist:**
- [ ] Only include tools actually needed for task
- [ ] Prefer read-only tools when possible (Glob, Grep, Read)
- [ ] If Bash needed, define constraints (see Anti-pattern 5)
- [ ] If Write/Edit needed, define file restrictions (see Anti-pattern 6)
- [ ] Never omit tools field (defaults to ALL)

---

### Anti-pattern 3: Description says what, not when (no trigger signal)

**Why it fails:** Auto-delegation cannot match user requests to an agent whose description never says *when* to use it.

**Wrong:**
```yaml
---
name: pr-reviewer
description: Reviews pull requests for code quality and style
# ❌ States WHAT it does but not WHEN to use it – no trigger signal (no "Use proactively…" clause, no <example> blocks)
---
```

**What happens:**
- User types: "Review this PR"
- Auto-delegation cannot determine if this agent matches
- Falls back to main conversation
- Agent not utilized despite being perfect fit

**Correct:**
```yaml
---
name: pr-reviewer
description: |
  Use this agent when the user asks to "review a PR", "check pull request", or requests code review feedback.

  <example>
  Context: User opened a pull request and wants feedback
  user: "Can you review my PR for the auth refactor?"
  assistant: "I'll use the pr-reviewer agent to review the pull request."
  <commentary>User mentions PR review – trigger pr-reviewer agent.</commentary>
  </example>

  <example>
  Context: User wants code quality feedback before merging
  user: "Check the pull request for any issues before I merge"
  assistant: "I'll use the pr-reviewer agent to analyze the changes."
  <commentary>User asks about pull request quality – trigger reviewer.</commentary>
  </example>
# ✅ Trigger signal present (opening line + example blocks)
---
```

**Trigger pattern (either form is valid):**
- **Prose form:** an action-oriented role plus an explicit trigger – `Expert PR reviewer. Use proactively when the user asks to "review a PR" / "check pull request".` Matches Anthropic's current subagents docs.
- **Example-block form:** opening line `Use this agent when the user asks to "<phrase>", "<synonym>", or <proactive condition>.` plus 2–4 `<example>` blocks with Context, user, assistant, and `<commentary>`; show different phrasings and both explicit + proactive scenarios.
- Either way: include a "when to use" signal, use third-person/imperative voice, and keep it concise (max ~2048 characters total).

---

### Anti-pattern 4: Missing critical_thinking section

**Why it fails:** Agent lacks structured reasoning, makes poor decisions.

**Wrong:** No `<critical_thinking>` section → Agent jumps straight to action without considering alternatives or edge cases.

**Correct:** Include `<critical_thinking>` with:
- [ ] **Alternatives** section (MANDATORY) - Consider 2-3 different approaches
- [ ] **Edge cases** section - Identify unusual inputs, performance implications
- [ ] **Adaptation logic** - Adjust behavior based on context (tests available, public API, etc.)

---

### Anti-pattern 5: Files exceeding 500-line limit

**Why it fails:** Large files are hard to read, maintain, and navigate. Creates context bloat.

**Wrong:**
```
agent-with-examples.md: 847 lines
├─ Frontmatter: 20 lines
├─ Context: 50 lines
├─ Workflow: 100 lines
├─ Examples: 500 lines  # ❌ Should be in separate file
├─ Critical thinking: 50 lines
└─ Output: 127 lines
```

**What happens:**
- File exceeds 500-line limit
- Hard to navigate and maintain
- Wastes context when examples aren't needed
- Validation fails (architectural rule #14)

**Correct:**
```
agent-name.md: 347 lines
├─ Frontmatter: 20 lines
├─ Context: 50 lines
├─ Workflow: 100 lines
├─ Examples: Brief 2-3 examples (50 lines)
├─ Critical thinking: 50 lines
├─ Output: 77 lines
└─ Reference: "See examples/agent-examples.md for more"

examples/agent-examples.md: 453 lines
├─ Full detailed examples
├─ Edge case scenarios
└─ Troubleshooting examples
```

**Split strategies:**
1. Extract examples to `examples/` directory
2. Extract guides/patterns to `guides/` directory
3. Keep only essential content in main agent file
4. Reference external files in main file

---

### Anti-pattern 6: Missing Q&A requirements gathering

**Why it fails:** Agent proceeds without clarifying requirements, produces wrong results.

**Wrong:** No Q&A protocol → Agent guesses requirements (REST vs GraphQL? JWT vs OAuth?) → Delivers wrong solution → Multiple iterations wasted.

**Correct:** Add `<qa_protocol>` section:
- Define when to ask (vague requests, critical decisions)
- List domain-specific questions
- Return `needs_user_input` with structured questionnaire
- See `guides/qa-protocol.md` for full pattern

---

## High Priority Anti-Patterns

### Anti-pattern 7: Verbose prompts
**Problem:** Wastes context window.
**Fix:** Remove filler words, use imperative voice, aim for 50% reduction.

### Anti-pattern 8: No output contract
**Problem:** Inconsistent return formats.
**Fix:** Define JSON structure in `<output>` section with status, findings, summary.

### Anti-pattern 9: Only tested with direct invocation
**Problem:** Fails auto-delegation.
**Fix:** Test with `@agent-<name>` (e.g. `@agent-code-reviewer`), natural language, cross-model (the current Haiku, 4.5), and resume (agentId).

---

## Medium priority

### Anti-pattern 10: Unidirectional collaboration references

**Problem:** Doer references reviewer in `<collaboration>`, but reviewer does not reference doer back (or vice versa).

**Why it fails:** Creates orphaned collaboration. One agent expects interaction that the other is unaware of. The reviewer won't know to send findings back to the doer.

**Fix:** Both agents MUST reference each other with matching arrow directions. See `guides/agent-pairing.md#bidirectional-collaboration-references`.

---

### Anti-pattern 11: Missing scope exclusions for paired agents

**Problem:** Paired agents lack `<scope_exclusions>` that delegate to their partner.

**Why it fails:** Without scope exclusions, paired agents may attempt work that belongs to their partner, causing duplication, inconsistency, and wasted context.

**Fix:** Each agent in a pair MUST have scope exclusions listing its partner's responsibilities. See `guides/agent-pairing.md#complementary-scope-exclusions`.

---

### Anti-pattern 12: Inconsistent vocabulary between paired agents

**Problem:** Doer says "design document" while reviewer says "solution spec" for the same artifact. Or doer uses "SOLID" while reviewer spells out "Single Responsibility, Open/Closed..."

**Why it fails:** Creates confusion in collaboration handoffs. Agents may fail to find or validate artifacts because names don't match.

**Fix:** Define shared vocabulary during Phase 2 (Design). Both agents MUST use identical terms for shared concepts. See `guides/agent-pairing.md#shared-vocabulary`.

---

## Quick Reference

| Anti-pattern | Severity | Fix |
|--------------|----------|-----|
| Spawn tool (Agent, formerly Task) in agent | Critical | Return needs_user_input for orchestration |
| Tools field omitted | Critical | Explicitly list required tools only |
| No trigger signal in description | Critical | Add a "Use proactively…/Use when…" clause or 2–4 `<example>` blocks |
| No critical_thinking | Critical | Add section with alternatives, edge cases, adapt |
| File over 500 lines | Critical | Split into main file + examples/guides |
| No Q&A protocol | Critical | Define when/how to gather requirements |
| Verbose prompt | High | Compact to 50%, imperative voice |
| No output contract | High | Define JSON structure in `<output>` |
| Untested auto-delegation | High | Test all three invocation methods |
| Unidirectional collaboration | Medium | Add bidirectional references to both agents |
| Missing pair scope exclusions | Medium | Add complementary exclusions delegating to partner |
| Inconsistent pair vocabulary | Medium | Align terms during design phase |

---

## See Also

- `guides/orchestration-patterns.md` — Valid multi-agent patterns
- `guides/qa-protocol.md` — Requirements gathering via needs_user_input
- `templates/agent-template-xml.md` — Compliant agent structure
- `validation/pre-release-checklist.md` — Validation requirements
