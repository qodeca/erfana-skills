# Claude 5 patterns for skill and agent authors

Practical guidance for designing Claude Code skills and agents targeting the Claude 5 family — Opus 5 (`claude-opus-5`) and Fable 5 (`claude-fable-5`). Supersedes `opus-4-7-patterns.md` (kept in place as the historical 4.7-era reference; several tools cite it by filename).

**Audience:** anyone authoring or modernizing skills and shared agents in this plugin.

**Source quality:** every claim below is tagged ✓ (Anthropic-published, with URL) or ◎ (community-observed). Don't conflate the two.

**The one-line summary:** Claude 5 models follow instructions *more* literally and verify their own work *more* reliably than any prior generation. The failure mode has flipped — a 4.7-era skill fails on Claude 5 not because the model ignores the scaffolding, but because it follows it exactly, including the parts that are wrong for the situation. Author skills as goal + rationale + boundaries + verification hooks, not step recipes.

---

## 1. The Claude 5 family ✓

Per https://www.anthropic.com/news/claude-opus-5 and https://www.anthropic.com/news/claude-fable-5-mythos-5:

| Model | ID | Position |
|-------|----|----------|
| Opus 5 | `claude-opus-5` | Current Opus; same pricing as Opus 4.8; default Opus in Claude Code v2.1.220+ |
| Fable 5 | `claude-fable-5` | Mythos-class tier above Opus; additional safety classifiers for dual-use capabilities |
| Opus 4.8 | `claude-opus-4-8` | Previous generation; the fallback target when Fable 5 classifiers trigger |

Frontmatter `model:` aliases remain `opus`, `sonnet`, `haiku` (plus `inherit`). **Never pin `fable`** — the alias is not universally available across harnesses, and Mythos-class access is gated; skills that need frontier capability should inherit the session model.

Migrating a 4.x skill requires **no compatibility changes** — the SKILL.md frontmatter spec is unchanged, and 4.x-era skills run on Claude 5 without breakage (◎ confirmed across community reports). Everything in this guide is optimization, not compatibility.

## 2. Adaptive thinking on Claude 5 ✓

Per https://platform.claude.com/docs/en/about-claude/models/introducing-claude-fable-5-and-claude-mythos-5:

- Fable 5 **always has thinking enabled** — `thinking: {"type": "disabled"}` is not supported, `MAX_THINKING_TOKENS=0` has no effect. Use `effort: low` to reduce thinking depth.
- Adaptive thinking only: fixed `budget_tokens` returns 400. Use `thinking: {type: "adaptive"}` + `effort`.
- Thinking output is summarized or omitted, never raw chain-of-thought. Do not toggle `thinking.display` — see §3.

## 3. The reasoning-display hazard (Fable 5) ✓

**Never instruct a model to surface its internal reasoning.** Prose like `show your reasoning`, `reproduce your thinking`, `explain your chain of thought step by step`, or config like `thinking.display: visible` trips the `reasoning_extraction` safety classifier on Fable 5 and **silently falls back to Opus 4.8** — the skill keeps running, on the wrong model, with no error. Per https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5, Anthropic explicitly recommends auditing existing skills for show-your-thinking instructions.

**Safe replacement:** request evidence and justification in the structured *output*, not the thinking:

- ❌ "Show your reasoning for each finding"
- ✅ "For each finding, cite the file and line that drove the decision, and describe the failure scenario"

**Exemption:** author-filled `<critical_thinking>` blocks in agent files are static design records written at authoring time (alternatives weighed, edge cases, adaptation criteria). They are content the model *reads*, not an instruction to externalize runtime reasoning — they are exempt from this ban and remain required by agent-pre-release-checklist Section 11.

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

Anthropic removed over 80% of Claude Code's system prompt for Claude 5 with no measurable eval loss (https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models), and states that skills written for prior models are *"often too prescriptive for Claude Fable 5 and can degrade output quality."* Claude 5 follows procedural scaffolding literally — including steps that are wrong for the situation (◎ documented worked examples) — and **over-verifies when told to verify** (◎, consistent with Anthropic's re-baselining advice).

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
- **Deprecated API bans** (12.7 / 13.3 / 13.4) — `temperature` / `top_p` / `top_k` / fixed `budget_tokens` still return 400 on Opus 4.7+ and Claude 5.
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

## 9. Migrating a 4.7-era skill

1. Grep for reasoning-display instructions (`show your reasoning`, `display: visible`, `explain your thinking`) — fix first; this is the only correctness item.
2. Re-read every "ALWAYS spawn parallel subagents" / "explicit fan-out required" line against §5.
3. Apply the §6 diet with the litmus test; keep the §6 keeper list intact.
4. Recalibrate `effort:` one step cooler per §4; sync the SKILL.md Agents table in the same change (checklist 12.5 cross-validation).
5. Run the Modernize operation (`guides/skill-modernization-guide.md`) and record the pass in `docs/modernization-registry.md`.
