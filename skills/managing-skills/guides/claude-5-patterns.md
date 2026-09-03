# Claude 5 patterns for skill and agent authors

Practical guidance for designing Claude Code skills and agents targeting the Claude 5 family — Opus 5 (`claude-opus-5`) and Fable 5 (`claude-fable-5`). Supersedes the retired `opus-4-7-patterns.md` guide (deleted in v6.3.0; its two model-agnostic sections — cache-friendliness and skill granularity — are ported below as §10 and §11, and the rest is preserved in git history).

**Audience:** anyone authoring or modernizing skills and shared agents in this plugin.

**Source quality:** every claim below is tagged ✓ (Anthropic-published, with URL) or ◎ (community-observed). Don't conflate the two.

**The one-line summary:** Claude 5 models follow instructions *more* literally and verify their own work *more* reliably than any prior generation. The failure mode has flipped — a 4.7-era skill fails on Claude 5 not because the model ignores the scaffolding, but because it follows it exactly, including the parts that are wrong for the situation. Author skills as goal + rationale + boundaries + verification hooks, not step recipes.

---

## 1. The Claude 5 family ✓

Per https://www.anthropic.com/news/claude-opus-5 and https://www.anthropic.com/news/claude-fable-5-mythos-5:

| Model | ID | Position |
|-------|----|----------|
| Opus 5 | `claude-opus-5` | Current Opus; same pricing as Opus 4.8 ◎ (default Opus in Claude Code v2.1.219+ on Max/Team Premium/Enterprise/API; Pro and Team Standard default to Sonnet 5) |
| Fable 5 | `claude-fable-5` | Mythos-class tier above Opus; additional safety classifiers for dual-use capabilities |
| Opus 4.8 | `claude-opus-4-8` | Previous generation, still Active (retirement not sooner than 2027-05-28); the configured-fallback target for Claude 5 refusals (§3) |

Frontmatter `model:` aliases remain `opus`, `sonnet`, `haiku` (plus `inherit`). **Never pin `fable`** — the alias is not universally available across harnesses, and Mythos-class access is gated; skills that need frontier capability should inherit the session model.

Migrating a 4.x skill requires **no compatibility changes** — the SKILL.md frontmatter spec is unchanged, and 4.x-era skills run on Claude 5 without breakage (◎ confirmed across community reports). Everything in this guide is optimization, not compatibility.

## 2. Adaptive thinking on Claude 5 ✓

Per https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5:

- Fable 5 **always has thinking enabled** — `thinking: {"type": "disabled"}` is not supported. ◎ Community-observed: the Claude Code `MAX_THINKING_TOKENS=0` env var has no effect on Fable 5. Use `effort: low` to reduce thinking depth.
- Claude 5 models are adaptive-thinking only: use `thinking: {type: "adaptive"}` + `effort`. Fixed `budget_tokens` is unsupported on Fable 5 / Opus 5 / Sonnet 5; **Haiku 4.5 still supports** `thinking: {type: "enabled", budget_tokens: N}` (it predates the adaptive-only generation) — the budget ban applies to Claude 5 models, not to haiku-pinned subagents.
- Thinking output is summarized or omitted, never raw chain-of-thought. Do not toggle `thinking.display` — see §3.

## 3. The reasoning-display hazard (Claude 5 classifiers) ✓

**Never instruct a model to surface its internal reasoning.** This is an **Anthropic classifier constraint**, not a property of language models in general - other families expose reasoning as a first-class field and would simply comply. The ban still applies to everything this plugin ships, because what this plugin ships runs on Anthropic models too. Prose like `show your reasoning`, `reproduce your thinking`, `explain your chain of thought step by step`, or config like `thinking.display: visible` can trigger the `reasoning_extraction` refusal category on Claude Fable 5 and Claude Opus 5. The refusal is visible — a normal HTTP 200 with `stop_reason: "refusal"` naming the classifier — and **where fallback is configured** (server-side `fallbacks` param + beta header, SDK middleware, or manual retry), the request re-routes to Claude Opus 4.8: Anthropic's wording is "causing elevated fallbacks to Claude Opus 4.8". Either outcome breaks the skill — a refusal instead of a result, or a response from a different model than intended — so audit skills for these instructions (per https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5 and https://platform.claude.com/docs/en/build-with-claude/refusals-and-fallback).

**Safe replacement:** request evidence and justification in the structured *output*, not the thinking:

- ❌ "Show your reasoning for each finding"
- ✅ "For each finding, cite the file and line that drove the decision, and describe the failure scenario"

**Exemption:** author-filled `<critical_thinking>` blocks in agent files are static design records written at authoring time (alternatives weighed, edge cases, adaptation criteria). They are content the model *reads*, not an instruction to externalize runtime reasoning — they are exempt from this ban and remain required by agent-pre-release-checklist Section 11.

**Fallback dependency note:** whether a classifier trip surfaces as a refusal or as an Opus 4.8 response depends on harness configuration, not on the skill. Skills must not assume either outcome; they must simply never contain the triggering instructions.

Enforced as checklist items 12.7 / 8.7 / 13.5 (BLOCKING on the skill side) and a Gate 2 WARN.

## 4. Effort recalibration ✓

Per the Fable 5 prompting guide: *"lower effort settings on Claude Fable 5 still perform well and often exceed xhigh performance on prior models."* The same shift applies (less dramatically) to Opus 5. Practical consequences:

| Level | Claude 5 use |
|-------|--------------|
| `low` | Validators, format-appliers, classifiers, scoped one-shot jobs |
| `medium` | File creation, refactoring, research — the routine-work default |
| `high` | Orchestrators, reviewers, ambiguous investigation — the "hard problem" setting |
| `xhigh` / `max` | Genuinely frontier problems only. No longer the Claude Code default posture. Higher effort can produce over-planning and unrequested refactoring — pair with scope-fence constraints if used. |

- **Omitting `effort` is a valid choice** — the agent inherits the session effort and adaptive thinking self-calibrates. Plugin agents still declare it explicitly (checklist 13.1) so role intent is auditable.
- Rule of thumb: take the 4.7-era role table and go **one step cooler**. The current role→model/effort table lives in `templates/shared-agent-template.md` (Model Selection Guide) — that copy is canonical.
- Keep 4.x-style explicit rigor in skills aimed at *smaller* models (haiku-pinned subagents still benefit from checklists and examples — see `cross-model-guide.md`).

## 5. Delegation calibration (the 12.4 inversion) ✓

The 4.7-era rule said: *"4.7 defaults to sequential delegation; explicit fan-out language is required."* **This is inverted on Claude 5** — Opus 5 and Fable 5 dispatch subagents readily by default (per the Opus 5 announcement and Fable 5 prompting guide), and instructions pushing further delegation are counterproductive (◎ multiple community reports of delegation inflation).

- ❌ "ALWAYS spawn parallel subagents — one per item — in the same turn" (as a blanket mandate)
- ✅ "Reserve subagent fan-out for genuinely independent, sizeable items (per-file reviews, per-dimension audits); run small or sequential steps inline"

Explicit fan-out prose is still *correct* where items are truly independent and each is substantial — the change is that fan-out language is now a calibration ("when it pays"), not an enablement ("or it won't happen"). Enforced as checklist item 12.4 / 8.4.

A related keeper ✓: **fresh-context verifier subagents still beat self-critique** on long runs — keep doer/reviewer agent pairs even while thinning the doer's scaffolding.

## 6. The prescriptiveness diet ✓

Anthropic removed over 80% of Claude Code's system prompt for Claude 5 with no measurable eval loss (https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models), and — separately, in the Fable 5 prompting guide (https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5) — states that skills written for prior models are *"often too prescriptive for Claude Fable 5 and can degrade output quality."* Claude 5 follows procedural scaffolding literally — including steps that are wrong for the situation (◎ documented worked examples) — and **over-verifies when told to verify** (◎, consistent with Anthropic's re-baselining advice).

**Delete from skill bodies:**

- Per-step validation mandates on routine work ("verify before returning" — 12.3)
- Mandated todo/progress rituals on short operations (track progress on multi-phase operations; don't mandate it per micro-step)
- ALL-CAPS emphasis density ("CRITICAL", "NO EXCEPTIONS" — a yellow flag per Anthropic's skill-creator; reserve hard language for irreversible actions)
- Behavior enumerations (a brief intent-based instruction steers as well as a case list)
- Few-shot usage examples where an expressive output contract does the job
- Rules duplicated across files ("conflicting voices" — state once, reference elsewhere)

**Keep:**

- Hard constraints and irreversible-action gates (file writes, deletions, publishing — still gate, still retry, still escalate)
- Domain knowledge, operator opinions, surprising project facts (the core purpose of a skill)
- Verification *hooks* with evidence rules ("claim done only with passing gate output") — hooks, not exhortations
- Intent/"because" clauses — stating *why* a rule exists measurably improves edge-case decisions
- Progressive disclosure (reference files loaded on demand are still right; the anti-pattern is always-loaded bulk)

Litmus test for every line (◎): *"Would a strong model behave worse without this line?"* If not, cut it.

## 7. What carries over unchanged ✓

- **Third-person descriptions + specific quoted triggers** (12.1 / 12.2) — skill discovery is unchanged; the description remains the discovery surface. Combined `description` + `when_to_use` ≤ 1,536 chars.
- **Deprecated API bans** (12.7 / 13.3 / 13.4) — an **Anthropic-model constraint, not a universal authoring rule**: `temperature` / `top_p` / `top_k` return a 400 error when set to a non-default value on "Claude Opus 4.7 and later" per Anthropic's parameter-deprecation table (https://platform.claude.com/docs/en/about-claude/model-deprecations); fixed `budget_tokens` is unsupported on Claude 5 models (Haiku 4.5 excepted — see §2).
- **Find-vs-filter decoupling** (12.6) ◎ — confirmed on Opus 5: "report only critical issues" is followed literally and silently drops the long tail. Enumerate everything, filter in a second pass.
- **500-line file ceiling, orchestrator pattern, single-responsibility agents, Q&A requirements gathering** — architectural rules unaffected by the model generation.

## 8. Section 12 under Claude 5 (mapping) ✓

The pre-release-checklist Section 12 numbering is a stable contract (ms-validator emits it). Under Claude 5 the seven items read:

| Item | 4.7-era reading | Claude 5 reading |
|------|-----------------|------------------|
| 12.1 voice | unchanged | unchanged |
| 12.2 triggers | unchanged | unchanged |
| 12.3 verify cleanup | strip verify rituals | same, stronger rationale (over-verification) |
| 12.4 | explicit fan-out **required** | **delegation calibration** — flag over-prescribed fan-out |
| 12.5 overrides | unchanged | unchanged (values one step cooler, §4) |
| 12.6 find-vs-filter | community-observed | confirmed on Opus 5, unchanged |
| 12.7 deprecated APIs | API bans | + **reasoning-display ban** (§3) |

## 9. Migrating a prior-generation skill

1. Grep for reasoning-display instructions (`show your reasoning`, `display: visible`, `explain your thinking`) — fix first; this is the only correctness item.
2. Re-read every "ALWAYS spawn parallel subagents" / "explicit fan-out required" line against §5.
3. Apply the §6 diet with the litmus test; keep the §6 keeper list intact.
4. Recalibrate `effort:` one step cooler per §4; sync the SKILL.md Agents table in the same change (checklist 12.5 cross-validation).
5. Run the Modernize operation (`guides/skill-modernization-guide.md`) and record the pass in `docs/modernization-registry.md`.

## 10. Cache-friendliness ✓

Per https://platform.claude.com/docs/en/build-with-claude/prompt-caching (model-agnostic; ported from the retired 4.7 guide):

| Property | Value |
|----------|-------|
| Minimum cacheable | 4,096 tokens |
| Cache TTL options | 5 min (default) or 1 hour (beta) |
| Write cost (5min / 1h) | 1.25x / 2x base |
| Read cost | 0.1x base |
| Break-even (1h vs 5min) | 5+ reads within the hour |
| Lookback window | 20 blocks |

**Skill structural rules:**

- Skills below 4,096 tokens don't cache at all (silent fail) — acceptable for artifact-driven focused skills where the output is the value, not the prompt template
- Place `cache_control` on the **last stable block**, never on a mutating one
- Cache prefix order: `tools` → `system` → `messages`. Any change at level N invalidates N + everything after
- Don't inject dynamic content (current date, ticket id, timestamps) at the top of SKILL.md — invalidates cache every run; keep the body stable across turns

## 11. Skill granularity (focused vs multi-operation) ✓

**Both shapes are Anthropic-supported** (ported from the retired 4.7 guide). Community blogs sometimes claim "skills should do one thing well" without Anthropic citation; Anthropic's first-party skills contradict this — `pdf/` (extract + fill + merge), `docx/`/`xlsx/`/`pptx/` (parallel multi-op), `claude-api/` (build + debug + optimize + migrate). The canonical multi-op dispatch example is `migrate-component $0 from $1 to $2` (https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), enabled by `argument-hint` + `arguments` frontmatter.

**Choose by deliverable shape, not by ideology:**
- Focused (one output, one workflow) → `templates/focused-skill-template.md` (design-* family, ~65-200 lines)
- Multi-operation (verb-dispatched) → `templates/skill-md-template.md` + multi-op subsection (managing-* family)
