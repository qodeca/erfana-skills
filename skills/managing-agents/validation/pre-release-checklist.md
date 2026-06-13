# Agent Pre-Release Checklist

Complete this checklist before deploying any new or modified agent.

## 1. File Structure

- [ ] File located in `.claude/agents/` (project) or `~/.claude/agents/` (user)
- [ ] Filename matches `name` field exactly
- [ ] Filename uses kebab-case (e.g., `code-reviewer.md`)
- [ ] Filename ≤64 characters

## 2. YAML Frontmatter

### Required Fields
- [ ] `name` field present and matches filename
- [ ] `description` field present

### Description Quality
- [ ] Trigger-shaped: an action-oriented "Use proactively…/Use when…" clause OR an opening line + 2-4 `<example>` blocks (both forms valid)
- [ ] If using `<example>` blocks: each has Context, user, assistant, and `<commentary>`
- [ ] Specifies WHAT the agent does
- [ ] Specifies WHEN to use it (prose trigger clause or example scenarios)
- [ ] Third-person or imperative voice only (no "I can help...", no "You can use...")
- [ ] Shows different phrasings/scenarios (multiple examples, or distinct trigger phrases in prose)
- [ ] Front-loads the key use case and stays within the ~1,536-char listing budget (combined `description` + `when_to_use` for skills; `description` for agents)

### Optional Fields (if present)
- [ ] `tools` explicitly listed (not omitted)
- [ ] `model` is valid: `haiku`, `sonnet`, `opus`, or `inherit`
- [ ] `permissionMode` is valid: `default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions` (ignored for plugin-distributed agents)
- [ ] `skills` references existing skill names

## 3. System Prompt

### Prompt Structure (Required – XML or markdown)
- [ ] Has role/context section (`<context>` tag OR opening paragraph)
- [ ] Has mission section (`<task>` tag OR clear mission statement)
- [ ] Has workflow section (`<workflow>` tag OR `## Core Process` with numbered steps)
- [ ] Has constraints section (`<constraints>` tag OR `## Constraints`)
- [ ] Has output section (`<output_format>` tag OR `## Output Guidance`)

### Quality
- [ ] Token efficient (concise but complete)
- [ ] Role is specific (not generic "helpful assistant")
- [ ] Output format is exact and actionable
- [ ] Constraints prevent common mistakes
- [ ] No contradictory instructions

### Critical Thinking (REQUIRED)
- [ ] Uses `<critical_thinking>` tag with complete structure
- [ ] "Consider Alternatives" section (2-3 approaches before deciding)
- [ ] "Edge Cases" section with domain-appropriate questions
- [ ] "Adapt Based on Findings" section
- [ ] For implementation agents: completion checklist included
- [ ] Workflow includes "consider alternatives" step

### Claude Model Optimization
- [ ] Action-default or conservative behavior specified
- [ ] Parallel tool usage encouraged where applicable
- [ ] Anti-hallucination rules for code analysis
- [ ] File:line citation format specified

## 4. Tool Configuration

- [ ] Tools follow principle of least privilege
- [ ] Read-only agents don't have Write/Edit/Bash
- [ ] Research agents have WebFetch/WebSearch if needed
- [ ] Code writers have necessary execution tools
- [ ] No unnecessary tools granted

## 5. Model Selection

- [ ] Model matches task complexity:
  - [ ] `haiku` for fast, simple tasks
  - [ ] `sonnet` for balanced implementation
  - [ ] `opus` for critical/complex reasoning
- [ ] Cost-effectiveness considered

## 6. Testing

### Direct Invocation
- [ ] `@agent-<name> <prompt>` works correctly (e.g. `@agent-code-reviewer`)
- [ ] Output matches specified format
- [ ] Tools used appropriately

### Auto-Delegation
- [ ] Natural language triggers agent correctly (test with the description's trigger phrases – the prose "Use when…" clause or the `<example>` blocks)
- [ ] Example scenarios in description enable accurate discovery
- [ ] No false positives (over-triggering)
- [ ] No false negatives (under-triggering)

### Cross-Model Testing
- [ ] Tested with target model
- [ ] If using `sonnet`/`opus`, also tested with `haiku` for clarity
- [ ] Instructions clear enough for simpler models

**Note:** When using `model: haiku` for cost optimization, always test with Haiku before marking complete. Haiku requires clearer, more explicit instructions than Sonnet/Opus. If Haiku fails, the prompt may need simplification. Consider: Would this work without the context I have?

### Edge Cases
- [ ] Empty/minimal input handled
- [ ] Large input handled
- [ ] Error conditions documented
- [ ] Graceful degradation on tool failures

## 7. Documentation

- [ ] Purpose clear from description alone
- [ ] Usage examples available (if complex)
- [ ] Integration with other agents documented (if applicable)
- [ ] Known limitations noted

## 8. Collaboration and pairing

### Cross-reference validation (if agent references other agents)
- [ ] If `<collaboration>` references another agent, that agent exists in `agents/`
- [ ] If agent references another in collaboration, BIDIRECTIONAL reference exists in partner agent
- [ ] If `<scope_exclusions>` delegates to another agent, that agent exists

### Pairing consistency (if agent is part of a doer/reviewer pair)
- [ ] If agent is part of a pair, scope exclusions are complementary (doer excludes review, reviewer excludes creation)
- [ ] Vocabulary is consistent with partner agent (same artifact names, same framework acronyms)

### Color
- [ ] Color in frontmatter is unique across all agents in `agents/`
- [ ] If agent is part of a pair, color differs from partner's color

## Severity Weights

Each check has a severity that affects the weighted score:
- **Critical (4x)** – blocks agent usage entirely
- **High (2x)** – causes frequent failures
- **Medium (1x)** – degrades performance
- **Low (0.5x)** – nice-to-have improvement

**Critical items (auto-fail if missing):**
- `name` and `description` fields present
- `<critical_thinking>` section present
- Tools explicitly listed
- No secrets in prompt

## Checklist Summary

| Section | Items | Severity | Passed |
|---------|-------|----------|--------|
| File Structure | 4 | Medium | __ / 4 |
| YAML Frontmatter | 13 | High (required fields Critical) | __ / 13 |
| System Prompt – Structure | 5 | High | __ / 5 |
| System Prompt – Quality | 5 | Medium | __ / 5 |
| System Prompt – Critical Thinking | 6 | Critical | __ / 6 |
| System Prompt – Claude Optimization | 4 | Low | __ / 4 |
| Tool Configuration | 5 | High | __ / 5 |
| Model Selection | 2 | Low | __ / 2 |
| Testing | 14 | Medium | __ / 14 |
| Documentation | 4 | Low | __ / 4 |
| Collaboration and Pairing | 7 | Medium | __ / 7 |
| **Total** | **69** | | __ / 69 |

## Pass Criteria

**Weighted scoring formula:** `score = sum(weight * pass_rate_per_section) / sum(applicable_weights) * 100`

- **Agent ready:** Weighted score ≥ 70% with zero critical failures
- **Recommended:** Weighted score ≥ 85%
- **Production:** Weighted score ≥ 95% with all high/critical items passing

**Minimum (hard requirements):**
- All critical items must pass (description present, critical thinking section, tools explicit, no secrets)
- Description uses example-based triggers
- Zero critical failures overrides any weighted score

**Note:** Collaboration items are conditional – only scored when agent references other agents or is part of a pair.
