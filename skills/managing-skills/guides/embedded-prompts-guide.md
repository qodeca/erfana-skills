# Embedded prompts guide

When a skill needs delegation logic but the "agent" isn't reusable, you have three places it can live. This guide tells you which to use when.

**Audience:** anyone designing a skill that needs to delegate work but isn't sure whether to put the delegation logic in `agents/`, in the skill's own `references/`, or in a new `prompts/` directory.

---

## The three-tier mental model

| Tier | Location | Auto-discovery | Reuse across skills | Use case |
|------|----------|----------------|---------------------|----------|
| **Plugin-root agent** | `agents/<name>.md` | Yes (Claude Code Task tool) | Genuinely reusable | A capability multiple skills will invoke |
| **Skill-internal prompt** | `skills/<name>/prompts/<stage>.md` | No (loaded inline via Task) | Skill-specific stage | A pipeline stage with its own private vocabulary, only used by this skill |
| **Reference doc** | `skills/<name>/references/<topic>.md` | No (read on demand by Claude) | Standing instructions | Background knowledge Claude consults during the skill body |

---

## Tier 1: Plugin-root agent

**Path:** `agents/<name>.md`

**Discovery:** auto-discovered by Claude Code at session start. Claude can invoke via `Agent({ subagent_type: "name" })` or via natural-language match on the agent's `description`.

**When to use:**
- The capability is genuinely reusable across 2+ skills
- The agent has a clean input/output contract (input_contract + output schema)
- Other skills should be able to invoke it without knowing this skill's internals

**Examples in this plugin:**
- `agents/code-reviewer.md` — used by `managing-issues`, could be used by `managing-articles` (review prose)
- `agents/spec-validator.md` — used by `managing-specs`
- `agents/ms-creator.md` — used by `managing-skills`

**Cost:** every plugin-root agent contributes to the auto-discovery surface. 76 agents in plugin-root is at the upper edge of viable; adding a new one means audit whether reuse justifies the surface-area cost.

---

## Tier 2: Skill-internal prompt (the obra/superpowers pattern)

**Path:** `skills/<name>/prompts/<stage>.md`

**Discovery:** NOT auto-discovered. The skill body explicitly loads the prompt and invokes via `Task` with inline content.

**When to use:**
- The "agent" is a stage-specific stage of one pipeline (research-then-outline, validate-precision-then-validate-formatting)
- It has private vocabulary that would pollute the plugin-root namespace
- It will never be called from another skill
- You want the workflow stages to live close to the skill that orchestrates them (legibility)

**Reference architecture:** `obra/superpowers` (the most-starred Claude Code plugin) ships zero plugin-root agents. Its `subagent-driven-development` skill instead ships `implementer-prompt.md`, `spec-reviewer-prompt.md`, `code-quality-reviewer-prompt.md` inside the skill folder. Skills load these inline via `Task` calls.

**Example wiring:**

```markdown
### Step 3: Validate capitalization

Delegate via Task:
```
content = Read('prompts/validate-capitalization.md')
Task({
  subagent_type: 'general-purpose',
  description: 'Validate capitalization',
  prompt: content + '\n\nInput: ' + skill_input
})
```

The prompt file owns the agent prose; the skill body owns the orchestration.
```

**Cost:** each prompt is loaded only when invoked (no auto-discovery overhead). Trade-off: less reusable, requires skill-author discipline to keep prompts coherent.

**When NOT to use:** if the prompt would be useful from another skill, hoist to Tier 1 (plugin-root agent) instead. Don't duplicate.

---

## Tier 3: Reference doc

**Path:** `skills/<name>/references/<topic>.md`

**Discovery:** NOT auto-discovered. Claude reads on demand when the skill body cites the file (e.g. "see `references/critique-guide.md` for detailed scoring rubrics").

**When to use:**
- Standing knowledge or rubric the skill body cites
- Detailed how-to that doesn't fit in SKILL.md without breaking the 500-line cap
- Examples, anti-pattern catalogs, decision trees

**Examples in this plugin:**
- `skills/design-prototype/references/react-setup.md` — pinned versions, hard rules
- `skills/design-review/references/critique-guide.md` — scoring rubrics
- `skills/managing-skills/guides/qa-protocol.md` — Q&A format

**Cost:** zero — Claude reads only when cited. Use freely for background material.

---

## Decision tree

```
Does the capability need to be invokable from another skill?
├── YES → Tier 1 (plugin-root agent)
│         Confirm by checking: would 2+ skills realistically call this?
│         If only this skill calls it but it's "agent-shaped," stay at Tier 1
│         only if the input/output contract is clean.
│
└── NO → Is it agent-shaped (delegation, distinct context, structured I/O)?
         ├── YES → Tier 2 (skill-internal prompt)
         │         Path: skills/<name>/prompts/<stage>.md
         │         Invocation: Read + Task with inline content
         │
         └── NO → Tier 3 (reference doc)
                   Path: skills/<name>/references/<topic>.md
                   Invocation: cited from skill body, read on demand
```

---

## What NOT to do (Pattern B: per-skill nested `agents/`)

Some plugins (and earlier versions of this plugin) ship `skills/<name>/agents/*.md` — nested agent directories inside skill folders. **Don't.**

**Why not:**

- Anthropic's plugin spec documents only plugin-root `agents/` discovery (https://code.claude.com/docs/en/plugins-reference). Per-skill nested discovery is **undocumented and unverified**.
- Behaviorally untested in mixed-plugin environments. May silently break on Claude Code version upgrades.
- This plugin's `CLAUDE.md` "Known caveats (v4.0.0+)" section explicitly flags this as risk.

**Migration path:** for any existing nested agent, decide:

- Genuinely reusable? → hoist to plugin-root with prefix (`mar-*`, `mr-*`)
- Skill-specific? → convert to Tier 2 (skill-internal prompt)
- Standing knowledge? → convert to Tier 3 (reference doc)

This is the v5.0.0 work for `managing-articles` (23 nested agents) and `managing-reports` (11 nested agents).

---

## Cost-and-overhead summary

| Tier | Discovery cost | Invocation cost | Reuse | Maintenance |
|------|----------------|------------------|-------|-------------|
| 1: plugin-root agent | High (auto-discovered, every session) | Low (Task call) | High | Owns its own quality contract |
| 2: skill-internal prompt | None | Medium (Read + Task with inline) | Skill-only | Lives with skill |
| 3: reference doc | None | None (read on demand) | Standing knowledge | Lives with skill |

**Rule of thumb:** start at Tier 3 (cheapest). Promote to Tier 2 if it gets agent-shaped (distinct context, structured I/O). Promote to Tier 1 only if a second skill needs it.

---

## When in doubt

If you're unsure whether something should be a plugin-root agent or a skill-internal prompt, **default to skill-internal prompt** (Tier 2). The cost of pulling it back to plugin-root later is small (move file, update one Read+Task call into a `subagent_type` reference). The cost of pulling a plugin-root agent back to skill-internal is larger (touch every skill that referenced it).

Premature plugin-root promotion bloats the auto-discovery surface, which costs context budget for every session.
