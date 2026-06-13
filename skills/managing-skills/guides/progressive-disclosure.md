# Progressive disclosure pattern

How to manage context budget in skills and agents.

---

## The 2% rule

Skills should aim to consume ≤2% of the model's context window when loaded. For a 200K context window, that's ~4,000 tokens. For 1M context (Opus 4.7), ~20,000 tokens – but assume the smaller window for portability.

**Why this matters:** A skill that consumes 10% of context at load time leaves less room for the actual task, user messages, and tool results. Lean skills produce better outcomes.

### Quick budget reference

| Context window | 2% budget | ~Lines (est.) |
|----------------|-----------|---------------|
| 200K tokens | 4,000 tokens | ~300 lines |
| 1M tokens | 20,000 tokens | ~1,500 lines |

Always design for the 200K budget. Larger windows are a bonus, not a baseline.

---

## The 4-layer pattern

### Layer 1: Metadata (always loaded)

YAML frontmatter – name, description, triggers. ~50–100 tokens.

```yaml
---
name: reviewing-code
description: Review code quality and generate reports. Use when user asks to review code.
---
```

This is the cheapest layer. Keep descriptions concise but specific enough for accurate triggering.

### Layer 2: Core instructions (always loaded)

Critical rules, workflow overview, agent table. The SKILL.md content. ~500–1,500 tokens.

This layer should be **self-contained** – a reader should understand the skill's purpose, agents, and workflow without loading any other file.

### Layer 3: Supplementary (loaded on demand)

Guides, templates, examples – loaded by agents when needed, NOT by the skill orchestrator.

```
skills/my-skill/
├── SKILL.md              ← Layer 1 + 2 (always loaded)
├── guides/               ← Layer 3 (loaded by agents)
│   ├── style-guide.md
│   └── edge-cases.md
├── templates/            ← Layer 3 (loaded during creation)
│   └── output-template.md
└── examples/             ← Layer 3 (loaded for validation/learning)
    └── examples.md
```

### Layer 4: Execution context (transient)

Agent tool results, user input, intermediate outputs. Exists only during execution. Not stored in skill files – generated at runtime.

---

## How CC 2.1 features interact with progressive disclosure

### `context: fork`

Runs the skill in a forked context. The skill's full content loads into a separate context, keeping the main conversation lean. Ideal for skills with many guides/templates that would otherwise bloat the primary context.

**Interaction with layers:** Fork effectively gives the skill its own context budget. Layer 3 content can be loaded more freely in a fork without impacting the main conversation.

### Skills preloading (`skills` field)

When an agent has `skills: my-skill`, that skill's content is loaded into the agent's context. This is Layer 3 – supplementary content loaded on demand.

**Budget implication:** Each preloaded skill adds to the agent's context. Keep preloaded skills minimal or use `context: fork` for heavy skills.

### Dynamic context injection

The `!command` syntax injects output at load time. Use sparingly – every injected line counts toward the 2% budget.

**Guideline:** Pipe through `head` or `--stat` flags to limit output. A `git diff` on a large changeset can consume the entire budget in one injection.

---

## Practical guidelines

1. **SKILL.md should be self-contained** – a reader should understand the skill's purpose and workflow without loading guides
2. **Guides are for agents, not users** – agents load guides via their prompts; the orchestrator just routes
3. **Examples are optional context** – only load when validation fails or user requests
4. **Templates are write-time context** – only needed during file creation, not during review or modification
5. **Reference files should be under 500 lines** – if a guide exceeds this, split it
6. **Measure, don't guess** – count lines in your SKILL.md; multiply by ~1.3 for token estimate
7. **Frontmatter is free** – it's tiny; invest in good descriptions for accurate triggering
8. **Cross-reference, don't duplicate** – say "see `guides/edge-cases.md`" instead of repeating content

---

## Anti-patterns

| Anti-pattern | Why it's bad | Fix |
|-------------|-------------|-----|
| Loading all guides at startup | Wastes ~80% of loaded context | Load per-step via agents |
| Embedding examples in SKILL.md | Bloats core document | Keep in separate `examples/` files |
| Duplicating content across files | Multiplies token usage | Cross-reference instead |
| No file size limit | Single file can consume entire budget | Enforce 500-line max |
| Large `!command` injections | Unbounded output eats context | Pipe through `head -N` or use `--stat` |
| Preloading many skills in one agent | Stacks Layer 3 costs | Load only what the agent needs |

---

## Checklist

Before finalizing a skill, verify:

- [ ] SKILL.md is under 500 lines
- [ ] SKILL.md is self-contained (readable without guides)
- [ ] No guide exceeds 500 lines
- [ ] No content is duplicated across files
- [ ] Dynamic injections are bounded (piped through `head` or limited by flags)
- [ ] Layer 3 content is loaded by agents, not the orchestrator
- [ ] Total skill directory stays under 2,000 lines across all files
