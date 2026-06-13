# erfana-skills roadmap

Beyond v2.3.1. Items are sequenced so each release closes a specific debt or proves a specific abstraction. Items NOT on this roadmap are either (a) journal notes in [`BACKLOG.md`](BACKLOG.md), (b) cross-team dependencies that aren't ours to schedule (e.g. "first real second brand"), or (c) explicitly out of scope (e.g. a public docs site not yet justified by demand).

> **v4.0.0 scope expansion (2026-05-06)**: The plugin widened from a focused design toolkit into a design + orchestration toolkit. Items below are the design / brand-system roadmap; orchestration roadmap items (lifecycle for `managing-*` skills and the 76 shared agents) accumulate separately as they emerge. The two roadmaps are independent – design roadmap items remain sequenced under their existing version numbers (v2.3.2 → v2.4.0 → v2.4.x → v2.5.0), while plugin-level releases continue to bump the marketplace version (v3.x.x → v4.x.x → ...). v4.1.0 (hooks + commands migration), v4.1.1 (docs sweep), v4.1.2 (Gate 15 doc-claim sync + release-process hardening), v4.1.3 (Gate 15 widening to 6 checks + verification-gates.md split into `docs/gates/`), v4.2.0 (Modernize operation + Opus 4.7 patterns for managing-skills, see "Shipped in v4.2.0" below), v4.2.1 (Lane-4 honesty + documentation patch on managing-skills, see "Shipped in v4.2.1"), v4.2.2 (managing-issues post-modernization cleanup + Display operation, see "Shipped in v4.2.2"), v4.2.3 (first process skill `grill-me`, see "Shipped in v4.2.3"), v4.2.4 (managing-agents Modernize + Opus 4.7 patterns + ma-* effort declarations, see "Shipped in v4.2.4"), v4.2.5 (`/erfana:project-status` read-only executive-brief slash command for context recovery on long-running tabs), v4.2.6 (sibling `/erfana:session-status` slash command sourced from in-context conversation history), v4.2.7 (first verification skill `fact-checking` migrated from a prior Qodeca consulting project + Modernize-passed in the same release; four-agent `fc-*` plugin-root quartet added), v4.2.8 (stakeholder rewrite of `/erfana:project-status` and `/erfana:session-status` for a PO/PM/BA audience – outcome-shaped three-axis structure, two-layer recommendation, and a hard hallucination-guards section against the previous developer-shaped reports), v4.2.9 (consolidated remediation of three independent code reviews on the v4.2.8 follow-up – sentinel-comment allowlist replaces the bypass-prone 3-label substring check, inventory-qualifier exemption dropped, AWK fence-strip robustness, `\bverified\b` word boundary, and a new Gate 16 with nine executable hook fixtures plus sentinel-symmetry verification across the two status commands and the Stop hook; `/erfana:project-status` also gains a dual-issue GitHub probe that queries both assigned-to-me and all-open issues), v4.2.10 (status-command protocol tightening – soft "~30-50 words each" support-bullet target elevated to a hard 55-word ceiling with a ±15-word balance requirement, and Layer 2 of "Recommended next" is now always emitted with a new priority rung covering post-release / smoke / MAINTAINER-checklist follow-ups so the previous "skip when caught up" carve-out no longer hides real next steps), v4.2.11 (researched multi-lens code review command `/erfana:lens-review` with cited current-best-practice research per lens, capped fan-out, trust-model propagation, and dynamic agent matching), and v4.2.12 (lens-review report re-pitched for a PM/PO audience – single plain-language findings table plus a technical subsection keyed by row, fixed-translation reader-facing severities, area naming as plain label + technical term in parentheses) shipped on the plugin track without touching design roadmap items. Same day three stale Dependabot PRs (#3, #4, #5 – open since 28 April) admin-merged to lift the CI workflow's `actions/checkout`, `actions/setup-python`, and `actions/setup-node` to v6 on Node 24 runtime. Future design-roadmap work batches into a later plugin release as items below land.

Three independent reviewers (strategic / engineering / risk) audited the original 25-item draft and converged on a 14-item plan. Their critiques are summarized in the v2.3.1 → v2.4 transition entry of `CHANGELOG.md`.

## v2.3.2 – close v2.3.1 testing gaps

Patch release; no behavior change for users. All three reviewers flagged these as the most urgent missing items.

| # | Task | Effort | Why now |
|---|---|---|---|
| 1 | `scripts/_lib/tests/test_json_schema_lite.py` – pytest suite (type, oneOf, anyOf, enum, pattern, minLength, required, additionalProperties) | S (~250 LOC) | Zero coverage on a critical-path validator |
| 2 | `scripts/test-gate-12.sh` – CI-wired golden-file harness for the 7 v2.3.1 negative manifests | S (~80 LOC) | Negative tests exist only in the v2.3.1 implementation transcript |
| 3 | `skills/design-shared/references/brand-context.md` – canonical "how skills read the active brand" doc | S (~120 LOC) | Prerequisite for v2.4.0 consumer work; without it, four SKILL.md prose blocks diverge |
| 3b | Promote Gate 13 (brandbook hex coverage) from soft to hard fail. Inventory-driven verifier (`scripts/check-brandbook-hex.sh` + `scripts/_lib/brandbook-hex-inventory.json`) lands in v0.4.0 brand integration as a soft check; promote once it has been stable for one release cycle with no false positives | XS (~2 LOC) | Soft state must have an exit condition or it stays advisory forever |

## v2.4.0 – prove the abstraction with a consumer

Ship one consumer skill that actually reads the brand manifest at generation time. Until this lands, v2.3.1 is data-with-no-readers.

| # | Task | Effort | Why now |
|---|---|---|---|
| 4 | First skill consumer: `design-slides` reads the active brand's `brand.json` (e.g. `brands/erfana/brand.json`) at generation time | M | Highest-leverage consumer; decks are most-frequent deliverable |
| 5 | Active-brand discoverability – surface active brand id + watermark in `using-erfana` bootstrap; optional `/erfana:brand-switch <id>` slash command | S | Layer is not surfaced to users today |
| 7 | Render-pipeline preflight: `render-video.js` reads `ACTIVE_BRAND` and asserts resolved watermark literal appears in the HTML; consume `voice.watermark` object form (placement / color / font) | M | Closes v2.3.1 advertising debt; catches missing watermarks before 90-second render |
| 8 | `scripts/scaffold-brand.sh <id> <displayName> <legalName>` – one-command brand skeleton generator | S (~120 LOC) | Reduces friction when brand #2 actually lands |

## v2.4.x – extend coverage to the other visual-output skills

Once the helper-doc and first consumer stabilize, the rest are mechanical.

| # | Task | Effort | Why now |
|---|---|---|---|
| 6 | _(Obsolete – the qodeca brand bundle and its brandbook were removed in v6.0.0.)_ Generate example pattern SVGs into a brand's `patterns/` library with `INDEX.md`, if a future brand ships a brandbook with a pattern grammar | S | Re-scope only when a brand with a documented pattern grammar ships |
| 9 | Second + third skill consumers: `design-prototype` and `design-infographic` read brand tokens | M | Completes the three visual-output skills |
| 10 | Schema migration tooling: `scripts/migrate-brand-manifest.py --from <a> --to <b>` | S | Blocks future schema bumps from being painless |

## v2.5.0 – explicit exit condition + bus-factor

Time-box the brand-#2 trigger. If no real second brand has materialized, the abstraction is officially overhead until decided.

| # | Task | Effort | Why now |
|---|---|---|---|
| 11 | **Brand-#2 trigger decision (deadline-driven).** By v2.5 cutoff, choose one: (a) real client engagement provides brand #2, (b) build a synthetic-but-real variant (e.g. `erfana-dark` or another sibling brand) that exercises the resolver, or (c) absorb the layer back into `using-erfana` and delete `example-acme/`. Explicit exit condition for the abstraction | dec | Otherwise abstraction accrues maintenance cost forever with no payback |
| 12 | MAINTAINER.md pre-release smoke checklist additions: `ACTIVE_BRAND` mid-session swap; drop-a-fake-brand validation | S | Only item that reduces bus-factor-1 risk |
| 13 | Generalize Gate 11 across `brands/**` – multi-brand banned-token scan (conditional on path 11.a) | M (~60–90 LOC) | Triggered by brand #2 reality, not speculation |

## v3.0.0 – shipped 2026-05-02

Erfana brand removal + qodeca v0.4.0 brandbook integration. Plugin package id `erfana` survives as a technical id only; active brand is `qodeca`; watermark literal flipped to `Created with Qodeca`. See `CHANGELOG.md` v3.0.0 for the full surface.

## Shipped in v4.0.0

| # | Task | Notes |
|---|---|---|
| 14 | Remove deprecated `erfana:design` meta-skill | SemVer-promised in v2.0; deferred through v3.0–v3.2; landed alongside the v4.0.0 plugin-widening release. See `CHANGELOG.md` v4.0.0 BREAKING CHANGES. |

## Shipped in v4.2.0

Bootstrap-first modernization of `managing-skills` for Opus 4.7 patterns. Non-roadmap-tracked work (the design / brand-system roadmap above is independent), bundled here for completeness:

| # | Task | Notes |
|---|---|---|
| O1 | Operation: Modernize in `managing-skills` | Applies Section 12 patterns to existing skills via ms-reviewer → user approval → ms-modifier (`change_type: modernize`) → ms-validator. Early-exit guard for skills with nested per-skill `agents/`. See `skills/managing-skills/SKILL.md` and `guides/skill-modernization-guide.md`. |
| O2 | 3 new skill-internal guides under `managing-skills/guides/` | `opus-4-7-patterns.md` (17 sections, all Anthropic-cited), `embedded-prompts-guide.md` (three-tier mental model), `skill-modernization-guide.md` (per-pattern playbook). |
| O3 | `focused-skill-template.md` for design-* parity | Single-purpose skills with one output type, references-heavy. Reference shapes: `design-prototype/SKILL.md` (65 lines), `design-review/SKILL.md` (64 lines). |
| O4 | Section 12 of pre-release-checklist (7 items, weight 8.0) | Skill-shape-aware applicable_max with N/A handling for focused skills. 12.7 (deprecated APIs) hard-blocking via Gate 2 + 13.3/13.4. |
| O5 | Per-agent effort/model overrides on all 10 ms-* agents | Per Model Selection Guide. Routine validators on sonnet+medium are ~10x cheaper than orchestrators on opus+xhigh. |
| O6 | Gate 2 extension for 4.7 patterns | First-person voice, 1,536-char combined, ≥3 quoted triggers, missing effort field on ms-* agents, deprecated APIs. Soft-blocking initially; hard-block in v4.3.0. |

Reviewed by 4 independent post-implementation lanes (Anthropic-spec, solution coherence, ms-reviewer self-audit meta-test 96/100, dogfood usability). See `CHANGELOG.md` v4.2.0 for the full surface.

## Shipped in v4.2.1

Two-round Modernize-operation pass on managing-skills, validated against external Anthropic documentation (skill-creator, agent-skills best-practices, agentskills.io spec, 4.7 migration guide, April 2026 4.7+CC blog). Honesty + documentation patch on top of v4.2.0; no behavior change for any current skill.

| # | Task | Notes |
|---|---|---|
| O7 | Lane-4 honesty fixes (F1, F2) | F1: ≥3-phrases rule reframed from Anthropic-required to plugin-convention. External research found NO Anthropic source mandates a phrase count. Cascaded across SKILL.md, pre-release-checklist.md, opus-4-7-patterns.md. F2: Rule #1 refined — bans Skill-tool invocation (recursion) only; permits prose terminal-state handoff matching design-* practice. |
| O8 | Multi-op argument-hint pattern doc (F3) | New subsection in `templates/skill-md-template.md` referencing Anthropic's `migrate-component $0 from $1 to $2` canonical example and `managing-specs` as in-plugin reference. |
| O9 | ALL-CAPS yellow-flag acknowledgment (F4) | Guardrails section softened per Anthropic skill-creator guidance ("If you find yourself writing ALWAYS or NEVER in all caps, that's a yellow flag"). Reserved absolute imperatives for runtime-blocking concerns. |
| O10 | Pushy descriptions + Skill granularity + Cache trade-off (F5/F6/F7) | F5: anti-undertrigger guidance in `opus-4-7-patterns.md`. F6: new Section 18 refutes "skills do one thing well" community myth with Anthropic first-party multi-op examples (pdf, docx, xlsx, pptx, claude-api). F7: `focused-skill-template.md` sub-4096-token cache-floor disclosure. |
| O11 | Round-1 scaffolding cleanup | Orphan `examples-new-capabilities.md` deleted; `skill-frontmatter-guide.md` added to SKILL.md Reference Files; TL;DR pass-threshold updated to include focused-reviewer (≥64/68); `creating-skills.md` Validation discipline section added. |

See `CHANGELOG.md` v4.2.1 for the full surface.

## Shipped in v4.2.2

Post-modernization cleanup of `managing-issues` driven by a 3-reviewer audit (orthodox checklist + adversarial regression + first-time-user UX) of the v4.2.1 Modernize-operation output. Two maintainer-directed scope expansions: a brand-new Display operation and a dedicated shared-vocabulary file for phase requirements.

| # | Task | Notes |
|---|---|---|
| O12 | Operation: Display in `managing-issues` | New 4th operation alongside Create/Implement/Review. Three modes: `single` (`show issue #N`), `list` (`list issues`), `search` (`find issues with label X`). Read-only — three phases, no quality gates. New `mi-issue-displayer` shared agent (model=opus, effort=medium, mode parameter). See `CHANGELOG.md` v4.2.2 Added section. |
| O13 | `phase-requirements-shared.md` extraction | D5 maximalist split — capability vocab, domain vocab, criticality levels, allow_direct policy moved out of `implement-phase-requirements.md` into a dedicated cross-cutting file. All 4 operation-specific phase-requirements files now cross-reference shared file equally. |
| O14 | Effort-field cascade across 20 plugin-root agents managing-issues uses | All 20 shared agents (10 mi-* + 10 generic) managing-issues uses now declare `effort:` in frontmatter; SKILL.md table now matches agent file ground truth. Validators on `medium`, classifiers on `low`, file-creators / deep reviewers on `xhigh`. Resolves the persistent 12.5 (effort/model consistency) finding from prior reviewer passes. (Note: `mi-release-preparer` exists but is owned by `releasing-erfana` skill, not counted here.) |
| O15 | Trigger-phrase tightening (3-reviewer C-F1, C-F3) | Drop bare `"review"` / `"check this"` (collide with sibling skills); tighten `"audit compliance"` → `"audit code against spec"` to disambiguate from managing-specs. Triggered by 3-reviewer audit + first-time-user UX lens. |
| O16 | Modernization scar cleanup | `POST-STEP scaffolding stripped per v4.2.0 patterns —` notes removed from operations/{create,review}.md + phases/{1,2,3}-*.md; replaced with single consolidated note at top of each operation/phase. |
| O17 | 75→76 doc-claim cascade + Gate-15 docs_to_scan extension | Plugin-root agent count cascaded across CLAUDE.md / README.md / docs/architecture.md / MAINTAINER.md (Gate 15 enforced) + `using-erfana/SKILL.md` and `docs/verification-gates.md`. Gate 15 `docs_to_scan` extended in V5c to include the latter two so future drift is CI-blocking (was previously a manual sweep concern). |
| O18 | Cross-skill ripple to managing-skills templates | `templates/phase-requirements-template.md` + `guides/orchestration-advanced.md` updated to teach v4.2.x split-file pattern; legacy single-file pattern marked deprecated. Without this, new authors using these templates would produce skills that violate the modernization guidance just applied to managing-issues. |
| O19 | Capabilities backfill on security-auditor + code-reviewer (V5a) | Closes the 5-agent gap originally documented in v4.2.2 first-pass Known limitations. Combined with V1a's 4 fixes (test-writer, commit-writer, bug-investigator, refactor-advisor), all 6 generic shared agents flagged under CLAUDE.md Rule #15 ("BLOCKING — required for discovery") now declare capabilities. |
| O20 | ms-validator Section 12.5 hardening (V5b) | New Step 2.5 added to `agents/ms-validator.md` workflow: for orchestrator + focused-reviewer skills with an Agents table, grep-confirms each agent file's `model:` + `effort:` against SKILL.md table claims; mismatches emit high-severity findings with file:line citations. Closes the meta-finding from v4.2.2's 3-reviewer pass (two reviewers caught the same drift ms-validator missed in v4.2.1). Self-test confirms operational: 20/20 agents drift-free against managing-issues. |
| O21 | File-cap fragility splits (V6) | Three near-cap files in `managing-issues/` split into siblings to gain Rule #16 headroom: `operations/review.md` (482→454, +46 buffer) hoisted Compliance review mode to `operations/review-compliance.md`; `operations/implement.md` (469→207, +293 buffer) hoisted Phases section to `operations/implement-phases-overview.md`; `reference/agents-reference-detail.md` (457→287, +213 buffer) hoisted mi-* agent details to `reference/agents-reference-mi.md`. Three new sibling files all well under cap. |

Reviewed by 3 independent reviewers in two passes (orthodox checklist / breaking-change hunt / release-engineering audit). First pass surfaced 25 findings (4 release-blocking + highs cleared in pre-tag V1+V2 remediation). Per maintainer override on 2026-05-10, **all 14 originally-deferred items also pulled into v4.2.2** (V5-V8 batch); no v4.2.3 deferrals from this round. Third reviewer pass on the post-V10 branch returned SHIP / NO_BREAKING_CHANGES / SHIP_WITH_FOLLOWUP verdicts; remaining doc-drift findings cleaned up in V12. See `CHANGELOG.md` v4.2.2 and `BACKLOG.md` "Completed in v4.2.2" for the full surface, plus the "Accepted risks (documented for the audit trail)" subsection.

## Shipped in v4.2.3

First process skill in the plugin: `erfana:grill-me`, imported verbatim from upstream `superpowers:grill-me` (Socratic one-at-a-time interrogation, walks the decision tree, recommends an answer per branch, explores the codebase before asking when the answer is already encoded there). Schema-adapted for plugin frontmatter (split `description` + `when_to_use`, added `allowed-tools: Read, Glob, Grep, AskUserQuestion`).

| # | Task | Notes |
|---|---|---|
| P1 | New `Process skills` taxon | One inhabitant (`grill-me`) added across CLAUDE.md, README.md, `skills/using-erfana/SKILL.md`, `docs/architecture.md`, `docs/verification-gates.md`. Taxon is descriptive (groups skills that shape *how* to approach a task rather than producing artifacts), not a new product domain — plugin elevator pitch stays "design + orchestration toolkit". |
| P2 | Bootstrap router Process branch | `skills/using-erfana/SKILL.md` decision flow now has three top-level branches: Process (new) → Orchestration → Design. Process check runs first so "stress-test"-style triggers do not get pre-empted by orchestration / design keyword overlap. |
| P3 | grill-me schema adaptation | Upstream source carried a single `description` field with the activation phrases folded in. Plugin convention requires split `description` + `when_to_use` with ≥3 quoted activation phrases. The adapted skill ships 10 quoted phrases (3.3× the convention floor); combined `description` + `when_to_use` ~496 chars (32 % of the 1,536 char Anthropic-documented truncation budget). |
| P4 | Doc-update sweep cascaded | 12-file PR touched manifests + 6 Gate-15-scanned docs + CHANGELOG + ROADMAP enumeration + `docs/gates/15-doc-claims.md` example. All 15 verification gates plus `claude plugin validate` PASS post-edit. |

Post-tag `erfana:managing-skills` review in standard mode returned HEALTHY 4.5/4.5 applicable (focused-skill shape; 0 P0/P1/P2/P3 findings; combined description+when_to_use ≈ 496 chars / 32 % of 1,536 budget; no deprecated APIs; no verify-scaffolding rituals). No Modernize follow-up needed — already 4.7-shaped at import. Tracked in `docs/modernization-registry.md` "Skills imported already-4.7-shaped" subsection.

Single-maintainer admin merge (PR #54) per CLAUDE.md "Release process" Step 7; no rc.N soak because the change is a verbatim upstream import with no behavior-sensitive logic and entirely new trigger phrases (no collision risk).

See `CHANGELOG.md` v4.2.3 for the full surface.

## Shipped in v4.2.4

Modernize-operation pass against `erfana:managing-agents` driven by `ms-reviewer` deep audit (Section 12 patterns from `pre-release-checklist.md`). Eight findings applied to the skill plus a cross-grounding follow-up that added `effort:` declarations to all 7 `ma-*` agent frontmatters — mirroring the `mi-*` precedent established in v4.2.2 (`ma-*` is the second agent family to declare `effort:` uniformly).

| # | Task | Notes |
|---|---|---|
| M1 | managing-agents Modernize | Eight findings applied to SKILL.md + 4 auxiliary files: F1 (third-person voice in `<example>` blocks), F2 (hybrid `description:` + `when_to_use:`), F3 (Rule #9 narrowed to irreversible-side-effect phases), F4 (explicit fan-out at L313), F5 (Effort + Model columns), F6 (filler-word strip), F10 (bulk-review fan-out hint), F11 (⛔ STOP language softened on Phase 0/1/2). Section 12: 5.5/8.0 → 8.0/8.0. |
| M2 | ma-* effort declarations | `effort:` field added to all 7 `agents/ma-*.md` frontmatters. Closes the asymmetric drift caught by `ms-validator` Step 2.5 (hardened in v4.2.2) — table claims must match agent-file ground truth. Pattern: `ma-{requirements-gatherer, researcher, validator}` on `medium`; `ma-designer` on `high`; `ma-{creator, reviewer, modifier}` on `xhigh`. |
| M3 | Hybrid `description:` + `when_to_use:` pattern | First production use in the plugin. managing-agents keeps three `<example>` blocks for worked dialogue + adds `when_to_use:` with 4 quoted activation phrases for discovery. Architectural precedent: both Anthropic-documented activation patterns can coexist (not mutually exclusive). |
| M4 | Modernization-registry sync | New row added to `docs/modernization-registry.md` Latest-pass table + per-pass detail section. `managing-agents` removed from the "Skills NOT yet modernized" routine-backlog list (7 routine-Modernize candidates remain). |

Post-validation by `ms-validator`: PASS 69/70 (98.6 %; orchestrator threshold 66/70). Section 12 score moved 5.5/8.0 → 8.0/8.0 (perfect, orchestrator max). Security: 93/93 unchanged. SKILL.md grew 472 → 477 lines (safe under the 500-line BLOCKING cap). `ms-validator` Step 2.5 (cross-skill grounding catch, hardened in v4.2.2) worked exactly as designed — surfaced the F5 asymmetric drift before merge, triggering the M2 follow-up that closed Section 12.5 from 0.0/1.0 to 1.0/1.0.

Single-maintainer admin merge (PR #56) per CLAUDE.md "Release process" Step 7; no rc.N soak because the change is intra-version polish with no trigger-phrase rewrites that affect downstream consumers (the new `when_to_use:` is purely additive; `<example>` blocks unchanged in number / overall structure).

See `CHANGELOG.md` v4.2.4 for the full surface.

## Shipped in v4.2.13

`managing-issues` Create operation hardening driven by a researched multi-lens code review (`/erfana:lens-review`). All 27 findings closed in one release; net agents 80 → 82 (`mi-` 11 → 13). Pulled out of the prose-only v4.2.5+ patch series because the change adds 2 plugin-root agents, rewrites a third, alters the create runtime flow, ships new GitHub Issue Forms, and fixes a systemic defect in a shared agent (`mi-requirements-analyzer`) used by every Implement Phase 2 run.

| # | Task | Notes |
|---|---|---|
| H1 | Injection-safe `gh issue create` | Phase 5 of `operations/create.md` rebuilt around `gh issue create --body-file <tempfile>` (body written via the Write tool, never inline). Eliminates the CWE-78 heredoc-terminator-collision present in v4.2.12 (a body line equal to the heredoc terminator would close the heredoc early and parse the remainder as shell commands). Labels validated against a fixed allowlist (`bug`, `enhancement`, `needs-triage`, `P1`/`P2`/`P3`) and passed as separate quoted arguments. |
| H2 | 3-way agent split | New `agents/mi-issue-questioner.md` (Read-only; proposes AskUserQuestion-ready questions with a "Not sure / skip" option each), new `agents/mi-duplicate-finder.md` (Read + scoped Bash, `gh issue list`/`view`/`search issues` only; sanitizes and variable-binds keywords before any shell use), rewritten `agents/mi-issue-drafter.md` (Read-only, draft-only; absolute `template_path`; `## Assumptions / unanswered` section surfaces every inferred field at approval time). Resolves the lens-review's single-responsibility + least-privilege + missing-mode findings together. |
| H3 | GitHub Issue Forms | New `skills/managing-issues/templates/create/{bug-report,enhancement}.yml` — structured YAML forms with `required: true` on critical fields, dropdowns (severity / priority / affected users), top-level auto-labels (`bug`/`enhancement` + `needs-triage`), and an optional `@claude` automation checkbox. Reference forms to copy into a consuming repo's `.github/ISSUE_TEMPLATE/`. The existing `.md` templates were also tightened (Principle 1/2 "where" nudge fixed, AC count rules 3-5 for bugs / 2-5 for enhancements, `@claude` Principle 8). |
| H4 | Systemic AskUserQuestion-in-subagent fix on `mi-requirements-analyzer` | The same defect that affected the old `mi-issue-drafter` (declares `AskUserQuestion` in `tools:` and calls it in workflow, but the tool is not delivered to subagents spawned via `Task`) also affected `agents/mi-requirements-analyzer.md`, used by Implement Phase 2. Fixed in lockstep: agent no longer declares `AskUserQuestion`, returns `proposed_questions` for the orchestrator to ask, coercive re-present-on-skip loop dropped; `phases/2-business-analysis.md` updated so the parent asks. Cross-skill remainder in `managing-articles` + `managing-reports` gather agents (4 files) tracked in `BACKLOG.md` with a concrete trigger — not fixed in v4.2.13 because each requires its consuming skill's orchestration changed in lockstep. |
| H5 | Convention section | New "Convention: subagents cannot call `AskUserQuestion`" subsection in `docs/architecture.md` with the canonical "agent proposes, orchestrator asks" pattern and `agents/ma-requirements-gatherer.md` as the reference implementation. Cross-references `managing-issues/SKILL.md` rule 7 (`needs_user_input` contract) and the Context-preservation table. |
| H6 | Doc-claim cascade | 80 → 82 shared agents and `mi-` 11 → 13 across all 6 Gate-15-scanned docs (`CLAUDE.md`, `README.md`, `MAINTAINER.md`, `docs/architecture.md`, `docs/verification-gates.md`, `skills/using-erfana/SKILL.md`). Version banner v4.2.12 → v4.2.13 plus both manifests' versions and agent-count descriptions. Architecture.md historical-baseline phrasing was reworked to keep Gate 15's `(\d+) shared agents` check matching only the current total (the "76 shared agents" trip is now documented in `docs/gates/15-doc-claims.md` Limitations as a preventive note for future authors). |

Single-maintainer admin merge (PR #71) per `CLAUDE.md ## Release process` Step 7; no rc.N soak — fifth admin-merge override of the staged-rollout policy in this lineage (v4.0.0, v4.1.0, v4.2.0, v4.2.8-2.10 chain, v4.2.13). Standing safety net: 16/16 static gates passed locally and on CI; `claude plugin validate` passed (pre-existing `metadata.*` warnings only); both new `.yml` issue forms parsed as valid YAML; no automated test suite exists for `managing-issues` so manual dogfood is the regression backstop.

See `CHANGELOG.md` v4.2.13 for the full surface, `BACKLOG.md` for the tracked cross-skill follow-up, and `docs/known-caveats.md` for the no-staged-rollout caveat entry.

## Forward-looking — v5.0.0 sibling cascade (no schedule yet)

Concrete trigger: after v4.2.0 stabilizes through 48-hour pilot soak + ≥1 week of production use without regressions, the Modernize operation becomes the cascade primitive for the remaining 9 sibling skills (14 total minus managing-skills modernized v4.2.0/v4.2.1, minus managing-issues modernized v4.2.1, minus managing-agents modernized v4.2.4, minus `grill-me` already-4.7-shaped on v4.2.3 import, minus `using-erfana` bootstrap exemption). Items intentionally deferred (separate plan, not on the design / brand-system roadmap):

- **Cascade managing-skills' Modernize op against design-* and other managing-* siblings.** v4.2.0 smoke-tests Modernize against `design-review` (small case, focused-reviewer). `managing-articles` was the harder architectural case; it was fully redesigned in v4.3.0 (23 nested agents consolidated to 5 plugin-root `article-*` shared agents) rather than Modernized in place, so `managing-reports` is now the remaining nested-agent case requiring a separate proof-of-concept before wholesale cascade.
- **Generic-named agent renames.** 8 unprefixed agents at risk of cross-plugin collision (`code-reviewer`, `commit-writer`, `software-developer`, etc.). Breaking change. Trigger: any reported mixed-plugin nondeterminism or maintainer policy decision.
- **`managing-reports` nested-agent migration.** 11 nested agents. Architectural decision per Lane 2 review of v4.2.0: hoist genuinely-reusable to plugin-root with prefix (`mr-*`), convert stage-specific to `prompts/` files invoked via Task with inline content (the obra/superpowers pattern), drop the nested `agents/` directory. (`managing-articles` completed its equivalent migration in v4.3.0 – 23 nested agents consolidated to 5 plugin-root `article-*` shared agents.)

Tracked in `BACKLOG.md` under "Deferred to v5.0.0 — concrete-trigger entries". v5.0.0 plan will be authored separately when the trigger materializes.

## Out of scope (not on this roadmap)

See [`BACKLOG.md`](BACKLOG.md) for the full deprioritized list. Highlights of what is **not** here and why:

- **First real second brand bundle** – sales event, not a roadmap item we can schedule.
- **Component-tier tokens / Style Dictionary export / sub-brand model** – speculative complexity; defer until 3rd skill needs role tokens beyond colors and font families.
- **Email / proposal / report skills** – different problem domain; belongs in a separate plugin or roadmap.
- **Brand-asset signing / public docs site** – not yet justified by demand; re-evaluate post-launch now that the project is public.
- **Vendor full `jsonschema`** – `json_schema_lite.py` was written specifically to avoid this; reverse only with a concrete trip-wire (e.g., `$ref` becomes necessary AND tests prove it).
