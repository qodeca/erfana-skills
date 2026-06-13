# erfana-skills backlog

Items that are NOT on the roadmap (`ROADMAP.md`). This file exists so future-Marcin can see what was considered and explicitly de-prioritized, with the reasoning intact.

Three independent reviewers (strategic / engineering / risk) audited the original 25-item v2.4+ roadmap draft. The 11 items below were either deleted, deferred indefinitely, or recategorized as journal notes rather than schedulable work.

## Deleted – already complete

- **Migrate hardcoded brand-color literals from demos and showcases.** A `grep` across `skills/` shows brand-color hex literals do not leak outside the active brand's `tokens.tokens.json`. The "organic decay" framing in earlier roadmap drafts was wrong – the work is already done. Verify on each new demo PR.

## Deleted – wrong abstraction or contradicts project posture

- **Public documentation site.** `README.md` is the canonical onboarding surface; a separate docs site is not yet justified by demand. Re-evaluate post-launch.
- **Brand-asset signing / provenance.** Signed release tags already provide provenance; per-bundle hashes solve a problem this plugin doesn't have.
- **Migrate `personal-asset-index.example.json` into the brand-system pattern.** That file is per-USER, not per-BRAND. Forcing it under `brands/` distorts the model. Document the boundary instead.

## Deferred indefinitely – no concrete trigger

- **Component-tier tokens** (`button.color.background` etc.). DTCG's third tier. Defer until a third skill genuinely needs role tokens beyond colors and font families. Pre-baking this is the anti-pattern v2.3.0 reviewers flagged.
- **Style Dictionary export pipeline** (CSS / iOS / Android / Figma). Adding a Node dep tree to a plugin with zero npm dependencies is a dependency-floor change, not a feature. Defer until component tokens land AND a real consumer requests platform export.
- **Sub-brand / variant model** (e.g. `parent` field for light/dark, summer/winter variants). Schema-breaking. Belongs in v3.0 if at all; today every variant is a separate `brands/<id>/` folder, which works fine for the foreseeable future.
- **Vendor full `jsonschema` library.** `scripts/_lib/json_schema_lite.py` was written specifically to avoid this. Reverse only when (a) a concrete schema feature requires `$ref` / `if-then-else` / `allOf` / `dependentSchemas`, AND (b) failing tests against `json_schema_lite.py` prove it can't be added stdlib-only.
- **Future schema bump – `voice.dialect`, `voice.locale`, `voice.tone` optional fields.** Speculative; add when a brand actually requests them. Strict-with-versioning is the schema policy (`additionalProperties: false`); new optional fields ship via schema bump on demand, not in advance. (When this BACKLOG entry was first authored the "next" bump was framed as v1.2; v1.2 has since shipped with asset-library fields, and v1.3 added `imagery.logoLibrary` – pin the concept, not a specific version.)
- **Schema v2.0.** "We will rewrite the schema" is not a roadmap item; it's an admission of unknown requirements. Let v1.x cruft accumulate; revisit if a major break becomes obviously cheaper than the alternative.
- **DTCG root-level `$description` revisit.** Already addressed in v2.3.1 by wrapping content under a brand-id group. Revisit only if the DTCG spec adds explicit document-root semantics that change the conformance picture.

## Out of domain – separate plugin or roadmap

- **Email / proposal / report skills.** These are new skill features that *use* the brand layer but are independent text-output skills. They don't belong on the brand-system roadmap. If they ship, they belong in a separate plugin or as their own first-class skill set.
- **Photo library content.** `brands/<id>/photos/` slot exists; population is a separate per-brand design task that's not ours to schedule. Document the affordance; populate when a consumer skill reads `imagery.photoLibrary`.

## Deferred – conditional schema bumps

- **Schema field for iconography.** _(Context predates v6.0.0, which removed the qodeca brand bundle.)_ An earlier brand bundle documented Material Symbols & Icons as the icon system in its `CLAUDE.md` (prose only, no `brand.json` field). Promote to a structured field via schema v1.4 only if a third brand bundle ships a proprietary icon library (not Material Symbols). Trigger condition: brand #3 with a non-Material-Symbols icon set. Until then, the prose pointer in each brand's `CLAUDE.md` is sufficient and avoids a schema bump that would force `example-acme` and any other brand to either declare or default the field.

## Completed in v4.0.0

- **Remove deprecated `erfana:design` meta-skill.** Deferred since v2.0.0 (originally targeted v3.0). Removed entirely as part of the v4.0.0 plugin-widening release alongside the orchestration migration; `using-erfana` table and decision flow no longer reference it. Backward compatibility break is acceptable in a major bump – consumers should already have migrated to the specific sub-skill invocations per the v2.0.0 deprecation notice.

## Completed in v4.2.2

Items below were originally deferred from v4.2.2's first pass (release-readiness review on 2026-05-10) to v4.2.3 follow-up issues. Per maintainer override (same day), all 14 items were pulled into v4.2.2 instead. Listed here for audit-trail completeness:

- **2 generic shared agents missing capabilities** (`security-auditor`, `code-reviewer`) — added in v4.2.2 V5a per CLAUDE.md Rule 15 ("BLOCKING — required for discovery"). Combined with V1a's 4 fixes (`test-writer`, `commit-writer`, `bug-investigator`, `refactor-advisor`), all 6 agents flagged in CHANGELOG.md `[4.2.1]` Known limitations now declare capabilities.
- **ms-validator hardening (Section 12.5 agent-file grep cross-check)** — added in v4.2.2 V5b. New Step 2.5 in `agents/ms-validator.md` reads each agent file's frontmatter and compares declared `model:` + `effort:` to SKILL.md table claims. Mismatches trigger high-severity findings with file:line citations on both sides. Closes the meta-finding from v4.2.2's 3-reviewer pass (two reviewers independently caught the same SKILL.md vs agent-file divergence that ms-validator missed in v4.2.1).
- **Gate 15 docs_to_scan extension** to include `skills/using-erfana/SKILL.md` and `docs/verification-gates.md` — landed in v4.2.2 V5c. `scripts/gate-15-doc-claims.sh` now scans 6 docs (was 4). Plugin-shape count claims in those files are now CI-blocking against drift on the next release.
- **File-cap fragility splits** (review.md, implement.md, agents-reference-detail.md) — landed in v4.2.2 V6. Three near-cap files split into siblings:
  - `operations/review.md` (482 → 454 lines): hoisted Compliance review mode to `operations/review-compliance.md`.
  - `operations/implement.md` (469 → 207 lines): hoisted Phases section to `operations/implement-phases-overview.md`.
  - `reference/agents-reference-detail.md` (457 → 287 lines): hoisted mi-* agent details to `reference/agents-reference-mi.md`.
- **12 low-severity findings from the 3-reviewer audit** — all landed in v4.2.2 V7 (Display + sibling-skill polish) and V8 (documentation tracking). Findings A-F3, A-F5, A-F7, A-F8, B-F5, B-F7, C-F5, C-F6, C-F7, C-F8 all addressed. One finding (A-F9 stray `</output>` tag) was verified as a false positive and skipped — `agents/mi-issue-displayer.md` ends cleanly at `</examples>` line 246.

No v4.2.3 deferrals from this round, and no v4.2.4 deferrals either — F5 (`ma-*` `effort:` declarations) was folded into the same release rather than deferred, closing Section 12.5 from 0.0/1.0 to 1.0/1.0 inside the v4.2.4 atomic commit. Future deferrals will accumulate organically as new findings emerge.

## Journal notes – opportunistic, not scheduled

- **First real second brand bundle.** This is a sales / client-engagement event, not a maintainer-schedulable roadmap item. When it happens, it triggers `ROADMAP.md` v2.4.x or v2.5.0 work – but it cannot be "planned" by us.

## Deferred to v5.0.0 — concrete-trigger entries (added v4.2.0)

These items are NOT scheduled but have explicit trigger conditions. v5.0.0 plan authoring begins when any of the triggers below materialize.

- **Sibling cascade for design-* and other managing-* skills.** Trigger: v4.2.0-rc.1 → v4.2.0 final ships, 48-hour pilot soak completes without regressions, ≥1 week of production use without reported regressions. The Modernize operation introduced in v4.2.0 becomes the cascade primitive (`/managing-skills modernize <sibling>`). v4.2.0 smoke-tested against `design-review` (focused-reviewer, small case); `managing-articles` was the harder architectural case and was fully redesigned in v4.3.0 (consolidated to 5 plugin-root `article-*` shared agents), so `managing-reports` is now the remaining case requiring a separate proof-of-concept before wholesale cascade. The "misleading green light" risk Lane 4 flagged is mitigated in v4.2.0 by the nested-agents early-exit guard, but the cascade itself remains future work.

- **Generic-named agent renames (8 unprefixed agents).** Trigger: any reported mixed-plugin nondeterminism (last-loaded-wins behavior on agents with the same name across plugins), OR a maintainer policy decision to systematically prevent the risk before incidents. Currently 8 agents are at risk: `code-reviewer`, `software-developer`, `commit-writer`, `architecture-reviewer`, `security-auditor`, `solution-architect`, `technical-architect`, `ux-reviewer`. Breaking change — proposed prefix scheme `er-*` (matches plugin id). v4.2.0 documented but did not act on this; the prefix scheme keeps Gate 2's name-equals-basename invariant intact and removes the cross-plugin collision risk.

- **`managing-reports` nested-agent architectural migration.** (`managing-articles` completed its equivalent migration in v4.3.0 – all 23 nested agents consolidated into 5 plugin-root `article-*` shared agents, nested `agents/` dropped. v4.3.0 chose a full redesign that hoisted all 5 to plugin-root rather than the Tier-1/Tier-2 split below; that split remains one option for managing-reports.) Trigger: same as cascade above (v4.2.0 stabilization), AND a v5.0.0 plan that explicitly resolves the three-tier mental model from `skills/managing-skills/guides/embedded-prompts-guide.md`:
  - **Tier 1 (plugin-root agent):** hoist genuinely-reusable agents to plugin-root with prefix (`mr-*` for managing-reports). Estimated: ~1-2 of 11.
  - **Tier 2 (skill-internal `prompts/`):** convert stage-specific agents to `prompts/<stage>.md` files invoked via Task with inline content (the obra/superpowers pattern). Estimated: ~9-10 of 11.
  - **Drop the nested `agents/` directory.** Per-skill nested-agent discovery is unverified against the published Claude Code plugin spec; the v5.0.0 cascade closes this accepted-risk item.
  Architectural reasoning documented in `skills/managing-skills/guides/embedded-prompts-guide.md` (added v4.2.0).

- **MEDIUM-priority polish from v4.2.0 review (M-series).** Trigger: any future v4.2.x patch release. Status: M9 ms-validator example outputs, M10 Section 12.1 self-detection guard, M11 ms-reviewer "top 5" parenthetical, and M12 pre-release-checklist §1.7 phrasing all shipped within the v4.2.0 same-release window (rolled into PR #46 squash before tag). Two cosmetic items also landed in v4.2.0: creating-skills.md threshold prose, SKILL.md Operation: Create threshold listing. Entry retained for audit-trail (which review-lane finding maps to which fix); no further work pending.

- **LOW-priority Anthropic-feature coverage in `opus-4-7-patterns.md` (L-series).** Trigger: any documentation refresh release. Items: memory tool, high-resolution image support, `display: "omitted"` thinking default, interleaved thinking automatic on Opus 4.7. All four Anthropic-published features shipped in v4.2.0 — sections 13-16 of the guide, total 17 sections.

## Deferred — concrete-trigger entries (added v4.2.13)

- **Cross-skill `AskUserQuestion`-in-subagent fix in `managing-reports`.** v4.2.13 closed the bug in `managing-issues`: `mi-issue-drafter` was Read-only-split (out of the create path) and `mi-requirements-analyzer` no longer declares `AskUserQuestion` — it now returns `proposed_questions` for the orchestrator to ask, copying the canonical pattern in `agents/ma-requirements-gatherer.md`. v4.3.0 closed it in `managing-articles`: the three gather/prompt agents (`gather-article-requirements`, `generate-gemini-prompt`, `generate-research-prompt`) were deleted in the v2 redesign and the questionnaire moved to the orchestrator. Convention codified in `docs/architecture.md` "Convention: subagents cannot call `AskUserQuestion`". One agent in `managing-reports` still carries the same defect:
  - `skills/managing-reports/agents/gather-report-requirements.md`

  **Trigger:** any maintenance touch on either skill's orchestration (or a dedicated cross-skill convention sweep). **Why deferred:** each fix is *symmetric* — the agent change (drop `AskUserQuestion` from `tools:`, return proposed-questions JSON instead of calling) is unsafe in isolation because the consuming skill's phase prose currently relies on the agent doing the asking. Editing only the agent creates the inverse mismatch (agent returns questions, skill never asks them). Each agent fix must land in lockstep with its skill's orchestration update, in the same commit, with that skill's own dogfood test. v4.2.13 scope (`/erfana:lens-review` of the create operation) does not cover the consuming skills. **Until fixed:** the remaining agent silently fails to gather user input when spawned via `Task` (background subagents auto-deny prompting calls; foreground ones never receive them, per `code.claude.com/docs/en/sub-agents#available-tools`). Report flows that hit that phase will draft on guesses without surfacing them. **Reference implementation to copy:** `agents/ma-requirements-gatherer.md`.
