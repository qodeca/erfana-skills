# Skill modernization guide

Step-by-step playbook for applying Claude 5 patterns (`guides/claude-5-patterns.md`) to an existing skill. Used by the Modernize operation in `managing-skills` (orchestrator routes via `ms-reviewer` deep mode → user approval → `ms-modifier change_type=modernize`).

**Audience:** anyone modernizing a skill from prior-generation conventions (4.6/4.7-era) to Claude 5 patterns. Handles single skills; for cascade modernization across siblings, this guide drives one sibling at a time. For migrating a non-orchestrator skill to the orchestrator architecture, see the final section.

---

## Pre-flight (before invoking Modernize)

0. **Intent gate.** The orchestrator asks the Modernize gate question ("Do you have particular ideas or reasons behind this change?"). On yes, the grill-planner interview captures intent, scope, exclusions, and risk tolerance (see SKILL.md "Requirements interrogation"); the merged object reaches ms-reviewer deep mode as `modernization_intent`. On no, proceed with a whole-skill sweep.
1. **Confirm target.** The skill exists, has a SKILL.md, and you have read access.
2. **Read existing state:**
   - `skills/<name>/SKILL.md` (the orchestrator)
   - any `references/*.md`, `templates/*.md`, `validation/*.md`
   - any agents in `agents/` that the skill references
3. **Run baseline validation** with current pre-release-checklist.md before any edits. Document the baseline score — modernization should improve, never regress.

---

## Modernization checklist

Apply each pattern from `pre-release-checklist.md` Section 12. For each: locate, decide (apply / N/A / leave), and document the decision.

| # | Pattern | Locate by | Decision rule |
|---|---------|-----------|---------------|
| 12.1 | Description voice | `description:` and `when_to_use:` frontmatter blocks | Apply if first-person prose found |
| 12.2 | Description triggers | `when_to_use:` block | Apply if <3 quoted phrases |
| 12.3 | Verify scaffolding cleanup | Critical Rules block, Workflow steps | Apply if "always verify" or "double-check before returning" mandates appear on routine steps |
| 12.4 | Delegation calibration | Workflow steps with fan-out or delegation prose | Apply if fan-out is mandated on small/sequential work, or "spawn parallel subagents" appears as a blanket rule |
| 12.5 | Per-subagent overrides | Agents table | Apply if Effort/Model columns absent and ≥2 agents in skill |
| 12.6 | Find-vs-filter decoupled | Output structure (reviewer skills) | Apply if "report only critical" / "filter to top N" found at find-time |
| 12.7 | No deprecated APIs / reasoning-display | Search skill body AND agent prompts referenced by skill | Apply (BLOCKING) if `temperature` / `top_p` / `top_k` / fixed `budget_tokens` found, or reasoning-display prose found (`show your reasoning`-class; see 12.7) |

---

## Per-pattern remediation playbook

### 12.1 — Description voice

**Find:**
```bash
grep -n -E "I can help|I'll help|You can use" skills/<name>/SKILL.md
```

**Anti-pattern example:**
```yaml
description: I can help you create slide decks with high visual quality.
```

**Pattern (rewrite):**
```yaml
description: Use when the user wants a slide deck, pitch deck, keynote, or presentation in any format.
```

**Rule:** lead with "Use when" or third-person verb ("Creates", "Reviews", "Generates"). Reference the user as "the user," not "you."

---

### 12.2 — Description triggers

**Find:**
```bash
grep -A 3 "when_to_use:" skills/<name>/SKILL.md | grep -oE '"[^"]+"' | sort -u
```

**Pattern:** if fewer than 3 distinct quoted phrases, add more. Each should be a phrase a user might actually type.

**Anti-pattern (filler):**
```yaml
when_to_use: |
  Use when comprehensive presentation work is needed with thorough detailed slides.
```
(zero quoted triggers; fillers "comprehensive", "thorough", "detailed")

**Pattern:**
```yaml
when_to_use: |
  Trigger phrases: "design a deck", "design a slide deck", "pitch deck", "keynote", "presentation", "PPT", "editable PPTX", "speaker notes", "multi-page presentation".
```

---

### 12.3 — Strip verify scaffolding

**Find:** look for these phrases:
- "EVERY step has post-step validation"
- "Always verify before returning"
- "Double-check the output"
- "Step MUST repeat until validation passes"

**Decision tree:**
```
Is the step irreversible (file write, agent file creation, breaking change)?
├── YES → Keep verification
└── NO → Strip verification scaffolding
```

**Anti-pattern:**
```markdown
## Critical Rules
- Delegates ALL tasks to agents
- EVERY step has input conditions (BLOCKING)
- EVERY step has post-step validation         <-- strip this for routine steps
- Quality gates MUST pass on every step       <-- strip this for routine steps
- Todo lists ALWAYS created
```

**Pattern:**
```markdown
## Critical Rules
- Delegates substantial tasks to agents
- Steps consuming prior outputs verify input conditions (BLOCKING)
- Validates where it matters — after irreversible work, not after exploratory steps
- Quality gates apply on irreversible steps (max 3 retries, then escalate)
- Multi-phase operations track progress (todo list or equivalent)
```

---

### 12.4 — Delegation calibration

**Revised for Claude 5 (2026-08-02): this pattern inverted.** The 4.7-era rule required explicit fan-out language because 4.7 defaulted to sequential delegation. Claude 5 models delegate readily by default — the failure mode is now *over-prescribed* fan-out.

**Find:** look for delegation mandates disproportionate to the work:
- "ALWAYS spawn parallel subagents" as a blanket rule
- Mandated fan-out on small items (a rename, a one-file check) or inherently sequential steps
- "Delegate ALL tasks to agents" with no inline carve-out

**Anti-pattern:**
```markdown
### Step 4: Apply the three one-line fixes
Spawn parallel subagents — one per fix — in the same turn.
```
(three trivial edits; subagent overhead exceeds the work, and context fragments across agents)

**Pattern:**
```markdown
### Step 4: Run validators (parallel fan-out — genuinely independent, sizeable)

The 4 validators have no inter-dependencies and each reads the full deliverable. Spawn all 4 in the same turn. Small glue fixes from their findings are applied inline by the orchestrator.
```

**Keep** explicit fan-out prose where items are truly independent and each is substantial (per-file reviews, per-dimension audits) — the calibration is *when it pays*, not *whether to say it*.

---

### 12.5 — Per-subagent overrides

**Find:**
```bash
grep -A 10 "## Agents" skills/<name>/SKILL.md | head -15
```

**Anti-pattern:**
```markdown
| Agent | Purpose | Source | Used In |
|-------|---------|--------|---------|
| validator-a | Validate input | shared | Step 1 |
| processor-b | Process data | shared | Step 2 |
```
(no Effort/Model columns; everything inherits Opus + xhigh from session)

**Pattern (per Model Selection Guide in shared-agent-template.md):**
```markdown
| Agent | Purpose | Source | Effort | Model | Used In |
|-------|---------|--------|--------|-------|---------|
| validator-a | Validate input | shared | low | sonnet | Step 1 |
| processor-b | Process data | shared | high | opus | Step 2 |
```

**Cost saving:** routine validators on sonnet+low are far cheaper than opus+high. The savings compound across long workflows. Claude 5 effort targets run one step cooler than the 4.7-era table — see `claude-5-patterns.md` §4.

---

### 12.6 — Find-vs-filter decoupling

**Find:** look for output structures in reviewer skills:
- "report only critical issues"
- "output the top 3 most important findings"
- "filter to issues with severity ≥ X"

**Decision:** is the filter at FIND time (exclusionary) or at PRESENT time (additive)?

**Exclusionary anti-pattern:**
```markdown
### Step 3: Find critical issues only
Output: list of critical-severity findings.
```
(Opus 4.7+ and Claude 5 models follow this literally and silently drop mid-severity findings before they're surfaced)

**Pattern (decouple find from filter):**
```markdown
### Step 3: Enumerate ALL findings
Output: list of every finding, severity-tagged (critical / high / medium / low).

### Step 4: Bucket findings into actionable groups
- Critical / high → blocker list
- Medium → warning list
- Low → polish list (optional, additive)
```

**Acceptable additive variant (e.g. design-review):**
```markdown
### Step 3: Output structure
- Keep: 3-5 things working
- Fix: ALL findings, severity-tagged
- Quick Wins: top 3 from Fix list (additive — Fix list still complete)
```

**Detection caveat:** "Quick Wins: top 3" looks like filter language. ms-reviewer must read context (3 lines before/after) to confirm Fix list is complete BEFORE Quick Wins is curated.

---

### 12.7 — Deprecated APIs and reasoning-display (BLOCKING)

**Find:** search the skill AND every agent it references:
```bash
grep -nE "temperature|top_p|top_k|budget_tokens" skills/<name>/SKILL.md agents/<related-agents>.md
grep -nEi "show (your|the) (reasoning|thinking)|reproduce your (reasoning|thinking)|chain of thought|display: *visible" skills/<name>/*.md
```

**Hard rule:** if found, FAIL the modernization until removed. `temperature`/`top_p`/`top_k` cause runtime 400 errors on Claude Opus 4.7 and later; fixed `budget_tokens` is unsupported on Claude 5 models (Haiku 4.5 exempt); reasoning-display instructions trip the `reasoning_extraction` refusal classifier on Claude Fable 5 and Claude Opus 5, re-routing to Opus 4.8 where fallback is configured. (Skip matches that are rule definitions or detection regexes quoting the phrases in backticks; author-filled `<critical_thinking>` blocks are exempt.)

**Anti-patterns:**
```yaml
# in agent code or config
temperature: 0.7
top_p: 0.95
top_k: 40
thinking:
  type: enabled
  budget_tokens: 8000
```
```markdown
Show your reasoning for each decision before presenting the result.
```

**Pattern:**
```yaml
# Remove temperature, top_p, top_k entirely
# Replace fixed thinking budget with adaptive + effort:
thinking:
  type: adaptive
effort: medium
```
```markdown
For each decision, cite the file and line that drove it in the output.
```

---

## Safe-apply protocol

Modernize wraps ms-modifier with `change_type: modernize`. The safety contract:

1. **Backup created** before any edit (`cp -r skills/<name> skills/<name>.backup.YYYYMMDD-HHMMSS`)
2. **Per-pattern preview-diff** presented to user via AskUserQuestion before commit
3. **Re-validate** post-edit using updated checklist
4. **Auto-rollback** if Section 12 score drops or any architecture (Section 1) item regresses

**Failure modes and rollback:**

| Failure | Action |
|---------|--------|
| Section 1 item regresses | Auto-rollback. Modernization aborted; backup restored. |
| Section 12 score drops | Auto-rollback. Modernization aborted. |
| Non-Section 12 score drops by >5 points | Warn user; require explicit approval to commit. |
| All scores improve or stay same | Commit modernization. |

---

## After modernization

1. Run `bash scripts/run-all-gates.sh` to confirm CI gates still pass.
2. Run `claude plugin validate .` to confirm Anthropic-spec compliance.
3. If shipping, bump `plugin.json` version per atomic-merge constraint (Phases 1-6 must land together; see Phase Dependencies in v4.2.0 plan).
4. Stage rc tag for 48-hour pilot before promoting to release.

---

## Limits of Modernize

Modernize covers prose-pattern modernization only. It does NOT:

- Migrate per-skill nested `agents/` to plugin-root or `prompts/` (architectural — separate Refactor operation, deferred to v4.3)
- Rename agents (breaking change — separate work, v5.0.0)
- Split a broad orchestrator skill into focused siblings (architectural)
- Modify hooks, slash commands, or MCP server config (out of scope)

For architectural changes, use the dedicated path documented in v5.0.0 plan (separate plan).

---

## Architecture migration (orchestrator pattern)

Folded from the retired `migration-guide.md` (2026-08-02, v6.3.0) — that guide predated the 4.7 patterns and mandated per-step validation and todo rituals that contradict items 12.3/12.4 and Section 4; its scaffolding prescriptions are superseded by this guide and `claude-5-patterns.md` §6. What survives is the migration shape for converting a direct-execution skill to the orchestrator architecture:

1. **Assess.** Score the skill against the Critical Architectural Rules (SKILL.md rules block): skill references, agent sources, workflow clarity, validation on irreversible steps, quality gates. Low scores mean a rebuild is cheaper than a migration.
2. **Backup.** `cp -r skills/<name> skills/<name>.backup.YYYYMMDD-HHMMSS` before any edit.
3. **Identify agents.** Map each substantial workflow task to a builtin agent (≥80% match, user confirms) or a shared agent in `agents/`; create missing shared agents via managing-agents. Small glue work stays inline (rule 12.4).
4. **Restructure SKILL.md.** Critical-rules block at top (stated once), numbered workflow, Agents table with Source/Effort/Model columns, Q&A requirements gathering, input conditions on steps that consume prior outputs, validation + quality gates on irreversible steps only.
5. **Remove violations.** Cross-skill references out; agent references updated to valid sources.
6. **Validate.** Run pre-release-checklist.md end-to-end and test direct invocation + auto-discovery. Cross-model check if the skill pins smaller models.
