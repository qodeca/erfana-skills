# Opus 4.7 patterns for skill and agent authors

Practical guidance for designing Claude Code skills and agents targeting Opus 4.7 (`claude-opus-4-7`, default in Claude Code 2.1.111+, 1M token context, default effort `xhigh`).

**Audience:** anyone authoring or modernizing skills and shared agents in this plugin.

**Source quality:** every claim below is tagged ✓ (Anthropic-published, with URL) or ◎ (community-observed). Don't conflate the two.

---

## 1. Effort scale and skill structure ✓

Opus 4.7 supports five effort levels: `low / medium / high / xhigh / max`. The default for Claude Code is `xhigh`. Per https://platform.claude.com/docs/en/build-with-claude/effort:

| Level | Use for |
|-------|---------|
| `low` | Subagents with one-shot scoped jobs (classification, extraction, formatting). Pair with explicit checklist. |
| `medium` | Cost-sensitive agentic work; "drop-in for the average workflow." |
| `high` | Default; "sweet spot balancing quality and token efficiency." |
| `xhigh` | **Anthropic's recommended starting point** for coding/agentic skills, "repeated tool calling, detailed web search, knowledge-base search." |
| `max` | "Reserve for genuinely frontier problems" — overthinks structured output. |

**Per-subagent overrides matter.** Validators that just scan a checklist should run `sonnet` + `medium`, not inherit Opus + xhigh from the orchestrator. See `templates/shared-agent-template.md` Model Selection Guide.

---

## 2. Description shape (third-person, what + when, ≥3 triggers) ✓

Per https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices, Anthropic's pattern for skill descriptions:

> "Avoid: 'I can help you process Excel files' / 'You can use this to process Excel files'
> Good: 'Processes Excel files and generates reports.'"

**Documented limit:** combined `description` + `when_to_use` ≤ 1,536 characters (per https://code.claude.com/docs/en/skills, the truncation limit).

**Convention enforced by Section 12:**

**Anthropic-required:**
- Third-person voice (no "I can help" / "You can use" / "I'll help")
- Specific quoted activation phrases in `when_to_use` block (Anthropic skill-creator/SKILL.md mandates "specific triggers")

**Plugin convention (activation reliability heuristic):**
- ≥3 concrete activation phrases — empirical floor for reliable auto-discovery; below 3, undertriggering rises noticeably. Failing the count alone is a soft warn, not a release blocker.
- No filler ("comprehensive", "thorough", "detailed" repeated as adjectives without specific meaning)

**Why 4.7 amplifies this:** more literal instruction matching means vague descriptions degrade harder than on Sonnet 4.6. The trigger-shape best practice is unchanged in mechanics; sensitivity is heightened.

**Combat undertrigger with mildly pushy phrasing.** Per Anthropic skill-creator/SKILL.md: "Claude has a tendency to 'undertrigger' skills... please make the skill descriptions a little bit 'pushy'." Concretely: prefer assertive third-person verbs ("Generates", "Delegates", "Validates") over hedged phrasing ("Can help with", "May be used to"). Specific quoted triggers + assertive description > polite hedging. Pushy ≠ first-person — stay in third-person voice (Section 12.1).

---

## 3. Strip verify scaffolding ✓

Per Anthropic's Opus 4.7 migration guide (https://platform.claude.com/docs/en/about-claude/models/migration-guide), under Capability improvements / Knowledge work:

> "If existing prompts have mitigations in these areas (e.g. 'double-check the slide layout before returning'), try removing that scaffolding and re-baselining."

**What to remove from skill bodies:**

- "Always verify before returning" mandates on routine workflow steps
- "Double-check that the output matches the input" rituals
- "After every step, validate" blanket rules

**What to KEEP:**

- Verification on irreversible side effects (file writes, agent file creation, breaking changes)
- Hooks-level checks (e.g. the plugin's `verify-completion.sh` Stop hook — these run outside the model and remain load-bearing)
- Validation in agent tool calls (e.g. checking that Read returned a file before parsing it)

**Rule of thumb:** if Opus 4.7 can self-verify the step (it produced the output, it can check it), don't mandate verify scaffolding. If the step has external side effects the model can't observe, keep verification.

---

## 4. Explicit fan-out language ✓

Per Anthropic's coding-blog post on Opus 4.7 (https://claude.com/blog/best-practices-for-using-claude-opus-4-7-with-claude-code):

> "If your use case benefits from parallel subagents (for example, fanning out across files or independent items), it's recommended to spell that out explicitly."

> "Spawn multiple subagents in the same turn when fanning out across items or reading multiple files."

**4.7 spawns fewer subagents by default than Sonnet 4.6.** The "main thread orchestrates skills, skills invoke many small agents" pattern still works, but every skill that wants concurrency must say so in prose.

**Anti-pattern (implicit fan-out):**
> "Review all files in the directory."
*4.7 picks one file and goes deep.*

**Pattern (explicit fan-out):**
> "Spawn parallel subagents — one per file in the directory — in the same turn. Each returns findings; orchestrator synthesizes."

Insert the explicit-fan-out template from `skill-md-template.md` (the "Optional patterns" section) into any workflow step that processes independent items.

---

## 5. Find-vs-filter decoupling ◎

**Source caveat:** community-observed pattern. Anthropic's migration guide flags 4.7's "more literal instruction following" but does not explicitly describe this as a published pattern. Treat as empirical, not contract.

**The pattern:** when a reviewer-shaped skill says "report only critical issues," Opus 4.7 follows that literally and may silently drop mid-severity findings. On Sonnet 4.6, the model often hedged and surfaced borderline findings anyway.

**Fix:** decouple find from filter.

**Anti-pattern:**
```
Step 1: Find critical issues only
```
*4.7 may not surface mid-severity issues at all.*

**Pattern:**
```
Step 1: Enumerate ALL findings (every issue, every severity, every category)
Step 2: Categorize each finding (critical / high / medium / low)
Step 3: Output filtered set per documented thresholds; preserve mid-severity in long tail
```

**Acceptable variant — additive curation:** outputs that surface a curated subset *alongside* the full enumeration are fine. Example from `design-review`:

```
Output:
- Keep: 3-5 things working
- Fix: ALL findings, severity-tagged (critical/important/polish)
- Quick Wins: top 3 from Fix list (additive, not replacing Fix)
```

**Detection caveat for ms-reviewer:** semantic check, not regex. "Quick Wins: top 3" looks like filter language but is additive curation. ms-reviewer must read context to distinguish (3 lines before/after the phrase).

---

## 6. Per-subagent effort and model overrides ✓

Per https://code.claude.com/docs/en/agent-sdk/subagents, AgentDefinition fields:

| Field | What it controls |
|-------|-------|
| `model` | Per-subagent model override — use Sonnet for routine subagents, save Opus for hard ones |
| `effort` | Per-subagent effort level — set `low` for scoped subagents, keep `xhigh` only on the orchestrator |
| `tools` | Restrict to read-only or domain-specific tools — reduces context bloat |
| `skills` | **Preload skills into subagent's context at startup** — use this instead of having each subagent re-read SKILL.md |
| `maxTurns` | Hard ceiling — prevents runaway subagents |
| `background` | Non-blocking — useful for parallel fan-out |

**Cost implication:** community report (https://nimbalyst.com/blog/claude-code-subagents-guide/) puts multi-agent workflows at 4-7x more tokens than single-agent. ~90% are cache reads at $0.50/MTok for Opus, softening the multiplier — but rate-limit risk on Pro plan is real.

**Practical mapping** (also in `templates/shared-agent-template.md`):

| Agent role | model | effort |
|-----------|-------|--------|
| Orchestrator | opus | xhigh |
| File creator | opus | xhigh |
| Refactorer | opus | high |
| Reviewer / auditor | opus | xhigh |
| Validator | sonnet | medium |
| Format-applier | sonnet | low |
| Researcher | sonnet | high |
| Classifier | haiku | low |

---

## 7. Deprecated API list (returns 400 on Opus 4.7) ✓

Per https://platform.claude.com/docs/en/about-claude/models/migration-guide:

> "Starting with Claude Opus 4.7, setting `temperature`, `top_p`, or `top_k` to any non-default value will return a 400 error."

> "Extended thinking budgets are removed in Claude Opus 4.7. Setting `thinking: {'type': 'enabled', 'budget_tokens': N}` will return a 400 error... use `{type: 'adaptive'}` + effort."

**Hard rules:**

- ❌ `temperature` — remove from any agent code
- ❌ `top_p` — remove
- ❌ `top_k` — remove
- ❌ `thinking: {type: "enabled", budget_tokens: N}` — replace with `{type: "adaptive"}` + `effort` field

**Section 12.7 of pre-release-checklist.md is hard-blocking** for these — runtime 400 errors are not acceptable in shipped skills.

---

## 8. Adaptive thinking is OFF by default on Opus 4.7 ✓

Per https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking:

> "Adaptive thinking is **off by default** on Claude Opus 4.7."

To enable, explicitly set in agent config (not in skill frontmatter):

```python
thinking: {"type": "adaptive"}
```

Pair with `effort` field for tuning. Most skills don't need to enable adaptive thinking — Opus 4.7's default behavior is already extended-reasoning. Enable adaptive thinking only when:

- The skill drives a long agentic loop (managing-issues implementation phase)
- The skill's quality benefits from explicit reasoning surfacing

---

## 9. Task budgets beta ✓

Per https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7:

> "Claude Opus 4.7 introduces task budgets (beta)... set the beta header `task-budgets-2026-03-13` and add `task_budget` to output config."

**Use case:** runaway-prone agentic loops. The model sees a running countdown and prioritizes finishing gracefully.

**Minimum:** 20,000 tokens. Pair with `max_tokens` as a hard ceiling.

**Where it helps:**
- managing-issues implementation phase (long, multi-step coding)
- managing-reports drafting (multi-section synthesis)
- managing-articles full-workflow runs

**Where it doesn't help:**
- Single-turn skills (no agentic loop)
- Routine validators (already short)

---

## 10. Background subagent pre-approval workflow (Feb 2026) ✓

Per https://code.claude.com/docs/en/sub-agents:

> "Background subagents run concurrently... Permission prompts... are passed through to you. Once running, the subagent inherits these permissions and auto-denies anything not pre-approved."

**Affects orchestration-skill design** when using `background: true` on subagents:

1. Orchestrator must list ALL tools the background subagent will need at spawn time
2. Mid-execution permission requests fail (auto-denied)
3. Pre-approved tools are inherited; nothing else gets through

**Practical implication:** background subagents work well for predictable workflows (batch file processing, parallel research with known query patterns), poorly for exploratory work (where the subagent might want to escalate tools mid-run).

---

## 11. Cache-friendliness ✓

Per https://platform.claude.com/docs/en/build-with-claude/prompt-caching:

| Property | Opus 4.7 value |
|----------|----------------|
| Minimum cacheable | 4,096 tokens |
| Cache TTL options | 5 min (default) or 1 hour (beta) |
| Write cost (5min) | 1.25x base |
| Write cost (1h) | 2x base |
| Read cost | 0.1x base |
| Break-even (1h vs 5min) | 5+ reads within the hour |
| Lookback window | 20 blocks |
| Workspace isolation | Yes (since Feb 2026) |

**Skill structural rules:**

- Skills below 4,096 tokens don't cache at all (silent fail)
- Place `cache_control` on the **last stable block**, never on a mutating one
- Cache prefix order: `tools` → `system` → `messages`. Any change at level N invalidates N + everything after
- Long agent traces need explicit breakpoints every ~20 blocks

**Practical implication for skills:**

- Don't inject dynamic content (current date, ticket id, timestamps) at the top of SKILL.md — invalidates cache every run
- Keep SKILL.md body stable across turns (it already is, but watch out for substitution variables that change per-invocation)

---

## 12. Tokenizer change (1.0-1.35x more tokens) ✓

Per https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7:

> "The new tokenizer may use roughly 1x to 1.35x as many tokens when processing text compared to previous models (up to ~35% more)."

**Implications:**

- Re-baseline SKILL.md token counts with `count_tokens` if any skill is near a soft limit
- Raise `max_tokens` headroom on agent definitions (existing budgets effectively shrink)
- The 4,096-token cache minimum stays the same in absolute terms — but a previously 4,500-token skill might now register as 5,500-token

---

## 13. Memory tool (added v4.2.1) ✓

Per https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool, Anthropic ships a managed memory tool for cross-session scratchpads. Skills that produce reports across multiple sessions (managing-articles, managing-reports) or skills that benefit from learned project context (managing-issues) may opt in to memory.

**Activation:**

```yaml
# In agent frontmatter (per https://code.claude.com/docs/en/sub-agents):
memory:
  scope: project   # user | project | local
```

**Use cases for erfana-skills:**

- **managing-articles** — keep research findings between sessions during a multi-day article workflow (Op 1 INIT → Op 3 RESEARCH spans 1-3 days)
- **managing-issues** — remember spec maturity, accepted-deviation classifications across long implementations
- **managing-reports** — preserve Pyramid Principle outline iterations across reviewer rounds

**When NOT to use:** focused single-session skills (design-prototype, design-slides, design-review). Memory adds session-state surface that's pure overhead for one-shot deliverables.

**Caveat:** memory is per-agent, not shared across agents. Two agents in the same skill don't see each other's memory.

## 14. High-resolution image support (added v4.2.1) ✓

Per https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7, Opus 4.7 supports images up to 2576×2576px (3.75 MP) with 1:1 coordinate mapping (model output coordinates are pixel-accurate against the input image).

**Implication for vision-using skills:**

- **design-review** when shown a rendered prototype screenshot — can give pixel-precise feedback ("button at x=412, y=88 is 4px off the 8px grid")
- **design-prototype** when given a reference design — can match layout pixel-by-pixel rather than semantically

**Implication for non-vision skills (most of erfana-skills):** none. Skills authoring text artifacts don't benefit from image resolution improvements. Skip this section in skill design unless vision is a primary modality.

## 15. Adaptive thinking display defaults (added v4.2.1) ✓

Per https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking:

> "On Claude Opus 4.7, `thinking.display` defaults to `\"omitted\"`. Thinking blocks still appear in the response stream, but their `thinking` field is empty unless you explicitly opt in."

**Practical implication:** when adaptive thinking is enabled (`thinking: {type: "adaptive"}`), the model still reasons internally but does NOT emit the reasoning to consumers by default. To see the thinking, explicitly set:

```yaml
thinking:
  type: adaptive
  display: visible   # or "redacted" for partial display
```

**Why this matters for skills:**

- Reviewer-shaped skills (managing-issues code review, design-review) that surface "why" a finding was flagged may need `display: visible` to show reasoning to the user. Default behavior hides it.
- Orchestrator skills generally don't need visible thinking — adds noise without value.
- Cost: visible thinking IS billed; omitted thinking is cheaper.

## 16. Interleaved thinking automatic on Opus 4.7 (added v4.2.1) ✓

Per https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking:

> "Interleaved thinking is automatically enabled on Claude Opus 4.7 in adaptive mode. The model can think between tool calls, refining its approach based on tool results."

**What this changes for agentic skills:**

- 4.6 era: thinking happened up-front, then a sequence of tool calls executed
- 4.7 era: thinking can interleave between tool calls — model refines approach mid-loop

**Skill design implication:**

- Long agentic loops (managing-issues implementation phase, managing-reports authoring) get higher per-turn quality without code changes — model self-corrects between Read/Edit cycles
- But: cumulative tokens grow. Monitor with task budgets (Section 9 above) for runaway-prone agents
- Sequential skills with mostly one tool per turn (managing-articles drafting): minimal change

**No skill body changes required for this** — it's a model-level capability. But authors should be aware that 4.7 may issue MORE tool calls than 4.6 for the same task because it's iterating mid-loop.

## 17. Pattern applicability by skill shape

Section 12 of `pre-release-checklist.md` doesn't apply uniformly. Use this matrix:

| Pattern | Orchestrator | Focused | Reviewer | Notes |
|---------|------|------|------|-------|
| 12.1 voice | required | required | required | universal |
| 12.2 triggers | required | required | required | universal |
| 12.3 scaffolding cleanup | required | required | required | universal |
| 12.4 fan-out | required where parallel applies | N/A typically | sometimes | only when parallel-eligible |
| 12.5 per-subagent | required | N/A typically | required | only when delegating |
| 12.6 find-filter | sometimes | sometimes | required | applies to all reviewers |
| 12.7 deprecated APIs | required | required | required | universal (negative test) |

ms-validator's N/A handling means focused skills can score 4.5/4.5 (full applicable max) without artificial penalties.

---

## 18. Skill granularity (focused vs multi-operation) ✓

**Both shapes are Anthropic-supported.** Community blogs sometimes claim "skills should do one thing well" without Anthropic citation. Anthropic's first-party skills explicitly contradict this:

- `pdf/` skill: extract + fill + merge (multi-op)
- `docx/`, `xlsx/`, `pptx/` skills: parallel multi-op shapes
- `claude-api/` skill: build + debug + optimize + migrate (4 ops)

The canonical Anthropic example for multi-op dispatch is `migrate-component $0 from $1 to $2` (https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), enabled by the `argument-hint` and `arguments` frontmatter fields.

**Choose by deliverable shape, not by ideology:**
- Focused (one output, one workflow) → `templates/focused-skill-template.md` (design-* family, ~65-200 lines)
- Multi-operation (verb-dispatched) → `templates/skill-md-template.md` + multi-op subsection (managing-* family)

Neither is more "correct"; pick by skill shape.

---

## References (verified vs inferred)

**Anthropic-published (verified by direct fetch):**

- [What's new in Claude Opus 4.7](https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7) — migration breaking changes, behavior changes, capability claims
- [Migrating to Claude Opus 4.7](https://platform.claude.com/docs/en/about-claude/models/migration-guide) — full migration checklist with verbatim "remove double-check scaffolding" guidance
- [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) — description shape, progressive disclosure, 500-line limit
- [Effort parameter](https://platform.claude.com/docs/en/build-with-claude/effort) — per-level guidance for 4.7
- [Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) — TTL, breakpoints, minimum tokens, workspace isolation
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking) — adaptive thinking is OFF by default
- [Subagents in the SDK](https://code.claude.com/docs/en/agent-sdk/subagents) — AgentDefinition fields including effort
- [Best practices for using Claude Opus 4.7 with Claude Code](https://claude.com/blog/best-practices-for-using-claude-opus-4-7-with-claude-code) — default xhigh, fewer tool calls, fewer subagents
- [Claude Code skills docs](https://code.claude.com/docs/en/skills) — frontmatter schema, 1,536-char description+when_to_use limit
- [Claude Code plugins reference](https://code.claude.com/docs/en/plugins-reference) — plugin-root agents discovery (no nested per-skill agents)

**Community-observed (treat as empirical, not contract):**

- [Claude Opus 4.7 Best Practices: Detailed Plans Win](https://claudefa.st/blog/guide/development/opus-4-7-best-practices) — community guide; aligns with Anthropic's statements
- [Claude Opus 4.7 Isn't a Drop-in Replacement for 4.6](https://blog.dailydoseofds.com/p/claude-opus-47-isnt-a-drop-in-replacement) — find-vs-filter pattern, sub-agent spawning shift
- [Claude Code Subagents Practical 2026 Guide](https://nimbalyst.com/blog/claude-code-subagents-guide/) — 4-7x token multiplier, 90% cache reads
