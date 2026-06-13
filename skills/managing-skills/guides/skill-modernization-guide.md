# Skill modernization guide

Step-by-step playbook for applying Opus 4.7 patterns to an existing skill. Used by the Modernize operation in `managing-skills` (orchestrator routes via `ms-reviewer` deep mode → user approval → `ms-modifier change_type=modernize`).

**Audience:** anyone modernizing a skill from 4.6-era conventions to 4.7-era patterns. Handles single skills; for cascade modernization across siblings, this guide drives one sibling at a time.

---

## Pre-flight (before invoking Modernize)

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
| 12.4 | Explicit fan-out | Workflow steps that mention "all", "each", "every" | Apply if multi-item processing is described without explicit parallel mechanic |
| 12.5 | Per-subagent overrides | Agents table | Apply if Effort/Model columns absent and ≥2 agents in skill |
| 12.6 | Find-vs-filter decoupled | Output structure (reviewer skills) | Apply if "report only critical" / "filter to top N" found at find-time |
| 12.7 | No deprecated APIs | Search agent prompts referenced by skill | Apply (BLOCKING) if `temperature` / `top_p` / `top_k` / fixed `budget_tokens` found |

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
- Delegates ALL tasks to agents
- EVERY step has input conditions (BLOCKING)
- Validates where it matters — after irreversible work, not after exploratory steps
- Quality gates apply on irreversible steps (max 3 retries, then escalate)
- Todo lists ALWAYS created
```

---

### 12.4 — Explicit fan-out

**Find:** look for phrases that describe multi-item processing without parallel mechanic:
- "Review all files"
- "Validate each section"
- "Check every step"

**Anti-pattern:**
```markdown
### Step 4: Run validators
Delegate to: validate-precision, validate-formatting, validate-style, validate-structure (4 agents).
```
(implicit fan-out — 4.7 may run sequentially)

**Pattern:**
```markdown
### Step 4: Run validators (parallel fan-out)

Spawn all 4 validator subagents in the same turn — orchestrator issues 4 concurrent Task calls, then waits on all. Validators have no inter-dependencies; sequential execution wastes 3x the wall time.
```

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
| validator-a | Validate input | shared | medium | sonnet | Step 1 |
| processor-b | Process data | shared | xhigh | opus | Step 2 |
```

**Cost saving:** routine validators on sonnet+medium are ~10x cheaper than opus+xhigh. The savings compound across long workflows.

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
(4.7 may silently drop mid-severity findings before they're surfaced)

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

### 12.7 — Deprecated APIs (BLOCKING)

**Find:** search the skill AND every agent it references:
```bash
grep -nE "temperature|top_p|top_k|budget_tokens" skills/<name>/SKILL.md agents/<related-agents>.md
```

**Hard rule:** if found, FAIL the modernization until removed. These cause runtime 400 errors on Opus 4.7.

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

**Pattern:**
```yaml
# Remove temperature, top_p, top_k entirely
# Replace fixed thinking budget with adaptive + effort:
thinking:
  type: adaptive
effort: xhigh
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
