# Modernization registry

Audit-trail of every skill in this plugin that has been through the **Modernize operation** (shipped in v4.2.0 by `erfana:managing-skills`). The operation applies Anthropic's Opus 4.7 patterns – Section 12 of `pre-release-checklist.md` and Section 13 of `agent-pre-release-checklist.md` – to existing skills via `ms-reviewer` → user-approved finding set → `ms-modifier` (`change_type: modernize`) → `ms-validator` (skill-shape-aware threshold).

This page is provenance, not status. It answers "when was skill X last modernized, what was the scope, what was the score?" so a future maintainer can size the next pass without re-reading multiple CHANGELOG entries. The CHANGELOG remains authoritative for release narrative.

## Latest pass per skill

| Skill | First pass | Last pass | Status | Notes |
|---|---|---|---|---|
| [`erfana:design-review`](../skills/design-review/SKILL.md) | v4.2.0 (Phase 0 pilot, 2026-05-09) | v4.2.0 | PASS | 5 patterns PASS / 2 N/A. Hand-modernization audit, no edits required – design-review represents the target shape for focused-reviewer skills. |
| [`erfana:managing-skills`](../skills/managing-skills/SKILL.md) | v4.2.0 (Phase 6 self-modernization, 2026-05-09) | v4.2.1 (Lane-4 honesty round, 2026-05-09) | PASS | Round 1 (4 scaffolding fixes) + Round 2 (F1–F7 Lane-4 honesty + documentation fixes). Self-modernizes coherently against the patterns it ships. |
| [`erfana:managing-issues`](../skills/managing-issues/SKILL.md) | v4.2.1 (Modernize-operation output, 2026-05-09) | v4.2.2 (cleanup + Display op, 2026-05-10) | PASS (68.5/70) | F1–F10 Modernize findings carried forward + 20 review findings from 3-reviewer audit (orthodox + adversarial + first-time-user lenses). Section 12: 6.5/8 → 8.0/8.0. |
| [`erfana:managing-agents`](../skills/managing-agents/SKILL.md) | v4.2.4 (Modernize-operation output, 2026-05-14) | v4.3.1 (currency + security + trigger-contract refresh, 2026-05-30) | PASS | v4.2.4: 8 findings applied (F1 voice / F2 hybrid `when_to_use:` / F3 narrowed Rule #9 / F4 explicit fan-out / F5 Effort+Model columns / F6 filler strip / F10 bulk fan-out / F11 softened STOP) + `effort:` on all 7 ma-*.md. v4.3.1: 28-finding lens-review remediation (Task→Agent rename, `@agent-<name>`, `~/.claude/agents/`, 6 permission modes + plugin-ignored caveat, `mcpServers`/`disallowedTools`, both-trigger-forms contract, `<example>`-free description, checklist↔ma-validator count resync). |
| [`erfana:fact-checking`](../skills/fact-checking/SKILL.md) | v4.2.7 (post-migration Modernize, 2026-05-16) | v4.6.0 (lens-review hardening, 2026-05-30) | PASS | v4.2.7: 3 Modernize findings (ACT-001 adaptive parallel batching for ≥50 claims / ACT-002 CAPS scaffolding demotion / ACT-003 anti-pattern phrasing); Section 12 12.4 FAIL → PASS; 68/70 → 70/70. v4.6.0: 23-finding researched 5-lens review + 2-round plan review – untrusted-content rule across orchestrator + 3 reading agents, lexical path screen, output screening before write, parallel-verification reconciliation by claim id (`completion_status`/`missing_claim_ids`, re-dispatch only failed chunks), content-anchored fix application, resource ceiling, doc-accuracy + hygiene. No Modernize-operation invocation (direct lens-review remediation). |
| [`erfana:managing-reports`](../skills/managing-reports/SKILL.md) | v4.5.0 (lens-review hardening, 2026-05-30) | v4.5.0 | PASS | 23-finding researched 5-lens review + 3-blocker plan review. Flattened the impossible subagent-spawns-subagents REVIEW into a parallel-batch + inline `review-report` consolidator (dropped `Task`); all six validators blocking (PASS/FAIL; removed CONDITIONAL/quick/skip-override; score advisory); trust boundary across all 12 files; `maintain-report` shell removed (archive copy-only, path-safety); model/effort tiering; client de-identification; reference contradictions fixed. No Modernize-operation invocation (direct lens-review remediation); the v5.0.0 nested-agent cascade is still owed. |

## Per-pass detail

### `erfana:design-review` – v4.2.0 Phase 0 pilot

- **Operator:** Opus 4.7 hand-modernization (no `ms-modifier` invocation – pilot deliberately predates the operation it informed).
- **Source record:** [`tests/managing-skills/v4.2.0-pilot.md`](../tests/managing-skills/v4.2.0-pilot.md).
- **Time-box:** 2 hours allocated, ~30 min spent.
- **Scope:** Sections 12.1–12.7 evaluated against `skills/design-review/SKILL.md` (64 lines) + `references/critique-guide.md` (199 lines).
- **Outcome:** 5 PASS, 2 N/A, 0 FAIL. No edits applied. Decision: design-review represents the target shape; proceed to Phase 1 with the patterns the pilot validated.
- **Why it matters:** This pilot proved the Section 12 checklist could be applied without false positives on a healthy 4.7-shaped skill, unblocking the rest of v4.2.0.

### `erfana:managing-skills` – v4.2.0 Phase 6 + v4.2.1 Lane-4

- **Operator:** `ms-reviewer` (deep mode) → manual user approval → `ms-modifier` (`change_type: modernize`) → `ms-validator` (skill-shape-aware threshold).
- **Round 1 (v4.2.0 Phase 6, 2026-05-09):** managing-skills self-modernized to apply the patterns it ships – 4 scaffolding fixes (Critical Architectural Rules 9 + 10 modernized to apply validation only on irreversible-side-effect steps; item 1.7 softened; item 7.4 corrected from 1024 → 1,536 chars; Section 12 max math standardized on 4.5/6.0/8.0).
- **Round 2 (v4.2.1, 2026-05-09):** Lane-4 external Anthropic-doc audit (skill-creator + agent-skills best-practices + 4.7 migration guide + April 2026 4.7+CC blog) surfaced 7 findings (F1–F7):
  - F1: `≥3 quoted activation phrases` reframed from Anthropic-required to plugin-convention.
  - F2: Rule #1 (no skill-cross-reference) refined to ban Skill-tool invocation only; prose terminal-state handoff explicitly permitted.
  - F3: Multi-operation skills (argument-hint pattern) subsection added to `templates/skill-md-template.md`.
  - F4: Guardrails ALL-CAPS endorsement softened per Anthropic's "yellow flag" guidance.
  - F5: "Combat undertrigger with mildly pushy phrasing" paragraph added to `guides/opus-4-7-patterns.md`.
  - F6: New Section 18 "Skill granularity (focused vs multi-operation)" added.
  - F7: "Cache trade-off" subsection added to `templates/focused-skill-template.md`.
- **Outcome:** all 14 hard gates + Gate 13 soft + `claude plugin validate` pass on both rounds.
- **Why it matters:** This was the bootstrap modernization – every other Modernize pass inherits patterns validated here.

### `erfana:managing-issues` – v4.2.1 Modernize output + v4.2.2 cleanup

- **Operator:** `ms-reviewer` (deep mode) → user approval → `ms-modifier` (Modernize output, v4.2.1) → direct human edits (v4.2.2 cleanup – `ms-modifier` was deliberately NOT used for V5–V10 because workstreams touched many small overlapping changes that benefit from human-readable diffs).
- **Modernize findings carried forward to v4.2.2 (F1–F10):**
  - F1: Split `reference/phase-requirements.md` (523 lines) into 4 operation-scoped files + 1 shared-vocab file.
  - F2: Add `when_to_use` frontmatter with 24 quoted activation phrases.
  - F3: Add Effort + Model columns to agent registry tables.
  - F4: Strip PRE/POST-STEP VALIDATION rituals from 8 routine phases (1, 2, 3, 4, 6, 8, 10, 11) + 3 create.md phases + 5 review.md phases. Validation retained on irreversible-side-effect phases (0, 5, 7, 9, 12).
  - F5: Reword Quick review level to additive-curation (find-vs-filter).
  - F6: Resolve implicit fan-out in phases 6 and 9.
  - F7: Cap filler word repetition (comprehensive / thorough / detailed).
  - F8: Tighten SKILL.md description to single trigger-shaped sentence.
  - F9: Add cache-friendly layout comment.
  - F10: Dedupe cross-cutting NOTs across operation files.
- **3-reviewer audit findings applied in v4.2.2:** 20 additional findings from 3 parallel `ms-reviewer` dispatches with distinct lenses (orthodox checklist + adversarial regression + first-time-user UX). Two reviewers independently caught the SKILL.md model-claim divergence – meta-finding that hardened `ms-validator` Step 2.5 to grep-confirm agent-file declarations match orchestrating-skill claims.
- **Scope additions (maintainer-directed):** New `Operation: Display` (single / list / search modes) + dedicated `reference/phase-requirements-shared.md`.
- **Scores:** Section 12: 6.5/8 → 8.0/8.0. Overall pre-release: 67/70 → 68.5/70 (threshold 66/70). Security: 88/93 unchanged.
- **Why it matters:** First production Modernize pass against a multi-operation orchestration skill. Validated the file-cap fragility split pattern (Rule #16 ≤500 lines triggers preemptive section hoists at 480+ lines) and the phase-requirements split-file pattern (shared vocab + per-operation files).

### `erfana:managing-agents` – v4.2.4 Modernize pass

- **Operator:** `ms-reviewer` (deep mode) → user approval via 4-question batched `AskUserQuestion` (all options selected) → `ms-modifier` (`change_type: modernize`) → `ms-validator` (orchestrator threshold) → follow-up `software-developer` agent for F5 cross-skill grounding.
- **Audit before:** Section 12: 5.5/8.0; pre-release: 78/100 (minor-issues); SKILL.md 472 lines; no P0 blockers; 11 findings (4 P1 + 2 P2 + 5 P3).
- **Findings applied (F1–F11 except F7/F8/F9 which were no-op observations):**
  - F1 (12.1 voice): Rewrote 3 `<example>`-block assistant lines from first-person ("I'll use the managing-agents skill…") to third-person trigger form ("Delegating to managing-agents skill…"). Gray area resolved by user in favor of strict 12.1 compliance.
  - F2 (12.2 triggers): Hybrid pattern – added `when_to_use:` frontmatter with ≥3 quoted activation phrases ("create an agent", "review the X agent", "modify the X agent", "audit existing agents") while keeping the three `<example>` blocks as supplementary documentation. Architectural choice between the two valid Anthropic-documented activation patterns.
  - F3 (12.3 scaffolding): Narrowed Rule #9 to mandate post-phase validation only on irreversible-side-effect phases (3, 4, 5); Phase 0/1/2 routine exploration MAY skip per Anthropic 4.7 migration guide.
  - F4 (12.4 fan-out): Rewrote L313 4-reviewer pattern with explicit "spawn 4 ma-reviewer invocations as concurrent Task calls in the same turn".
  - F5 (12.5 per-subagent overrides): Added Effort + Model columns to Agents table. **Validator caught asymmetric drift**: SKILL.md table claimed effort values that no `agents/ma-*.md` file declared. Closed via follow-up: added `effort:` field to all 7 ma-* agent frontmatters (medium/medium/high/xhigh/medium/xhigh/xhigh). This is the same Lane-4 meta-pattern hardened in v4.2.2 (ms-validator Step 2.5 grep-confirms agent-file declarations match orchestrating-skill claims).
  - F6 (filler-words): Stripped "comprehensive"/"thorough"/"detailed" – reduced 'comprehensive' from 6 → 3 occurrences (kept 3 as named "Pattern 3: Single Comprehensive Agent" technical term); 'detailed' from 5 → 2 (kept 2 as signal-bearing); 'thorough' kept at 2 (1 inside quoted bad-prompt example, 1 = Explore-tool API parameter name).
  - F10 (implicit fan-out polish): Added bulk-review fan-out hint at L329 ("spawn one ma-reviewer per agent file as concurrent Task calls in the same turn, cap at 8 per batch").
  - F11 (verify-ritual softening): Removed ⛔ STOP language from Phase 0/1/2 routine quality gates; preserved on Phase 3/4 (file write) + Phase 5 (validation) + Review/Modify operation gates.
- **Backup discipline lesson:** ms-modifier's initial backup at `skills/managing-agents.backup.<ts>` tripped Gate 15 (skills-count drift FAIL: 16 vs claimed 14). Auto-relocated to `.backups-managing-agents.<ts>` outside `skills/` – useful pattern for any future skill modification using local backups.
- **Files edited:** `skills/managing-agents/SKILL.md` + `guides/qa-protocol.md` + `guides/orchestration-patterns.md` + `templates/agent-template-markdown.md` + `examples/agent-templates.md` (skill scope) + 7× `agents/ma-*.md` (F5 follow-up scope).
- **Scores:** Section 12: 5.5/8.0 → 8.0/8.0 (perfect); pre-release: 78/100 → 69/70 (98.6% – exceeds 66/70 orchestrator threshold); security: 93/93 unchanged. SKILL.md 472 → 477 lines (safe under 500-line BLOCKING cap).
- **Why it matters:** Second production Modernize pass against an orchestrator skill. Validated the **example-block voice rewrite** edge case (12.1 in `<example>` dialogue is rule-bound, not exempt) and the **hybrid `when_to_use:` + `<example>` blocks** activation pattern. Reinforced ms-validator's Step 2.5 cross-skill grounding catch (effort claims must match agent-file declarations) – Modernize now reliably surfaces aspirational-vs-grounded drift in skill tables.

### `erfana:fact-checking` – v4.2.7 post-migration Modernize pass

- **Operator:** `ms-reviewer` (deep mode) → user approval via 4-option `AskUserQuestion` (all options selected: "handle ALL of the findings") → `ms-modifier` (`change_type: modernize`) → `ms-validator` (orchestrator threshold).
- **Context:** Skill freshly migrated from `../sport-clubs-company/.claude/skills/fact-checking/` ~3 hours before the Modernize pass. Migration already applied light modernization (per-agent `effort` fields, `references/` folder rename, third-person voice, find-before-filter discipline in `fc-verify-claims`, post-step validation pruning on exploratory steps). Modernize closed remaining gaps.
- **Audit before:** Section 12 score 68/70 (orchestrator threshold ≥66/70). Section 12.4 (fan-out) was the only FAIL – skill declared the implicit-fan-out anti-pattern but didn't follow its own advice; `fc-verify-claims` processed N claims sequentially inside one invocation. 12.7 (deprecated APIs) clean. 0 P0 / 0 P1 / 1 P2 / 2 P3 findings.
- **Findings applied (ACT-001 / ACT-002 / ACT-003):**
  - **ACT-001 (P2, 12.4 fan-out):** Phase 3.1 rewritten with adaptive fan-out semantics – sequential single-call below 50 claims; orchestrator-side parallel batching (chunks of 25, same-turn multi-spawn) at ≥50 claims with rationale documented. `fc-verify-claims` workflow gained an explicit "single-chunk semantics" note (per-claim parallelism NOT used inside this agent; orchestrator handles fan-out) plus a `NEVER spawn additional Task invocations` constraint reinforcing the subagent Task-tool limitation.
  - **ACT-002 (P3, voice):** 4 ALL-CAPS scaffolding instances demoted in `SKILL.md` (lines ~30 / 61 / 192 / 199 – Todo-rules wording, "MANDATORY" headers, Step 1.5 header tag). Load-bearing CAPS preserved on user-trust gates (lines 55, 222, 369 – Phase 2 entry, fix-immediacy mandate, final-approval lock loop).
  - **ACT-003 (P3, anti-pattern phrasing):** Anti-pattern bullet rephrased from quoting the forbidden phrase to declarative rule form ("Verify-before-returning ritual on exploratory steps – 4.7 self-verifies; the scaffolding wastes tokens"), removing false-positive grep surface for future automated audits.
- **Files edited:** `skills/fact-checking/SKILL.md` (478 lines after edits, under 500-line cap) + `agents/fc-verify-claims.md` (single-chunk semantics + NEVER spawn constraint). `references/anti-patterns.md` had no matching target bullet – no change.
- **Backup discipline:** `ms-modifier`'s initial in-skills backup tripped Gate 15 transiently; auto-relocated to `fact-checking.backup.20260516-modernize/` at repo root + `agents/fc-verify-claims.md.backup.20260516-modernize` (file-level backup remained in agents/ but `.md` glob doesn't match the `-modernize` suffix, so Gate 15 agent-count remained clean). Backups deleted after validator PASS.
- **Validation:** `ms-validator` returned 70/70 (100%) – up from 68/70. Section 12: 12.4 FAIL → PASS; all other items PASS or N/A (12.6 N/A: skill is correction-pipeline, not reviewer). Security 93/93. All 15 gates + `claude plugin validate` PASS post-modify.
- **Caveats flagged:**
  1. New ≥50-claim parallel batch path is untested in production – first exercise against a real 100+ claim document will validate the chunk-size heuristic.
  2. Chunk size of 25 is a heuristic, no empirical tuning yet.
  3. `examples.md` Example 1 (142-claim document) was not updated to illustrate the parallel path – optional follow-up flagged by validator, deferred to keep Modernize scope tight.
- **Doc-claim sync (Gate 15):** Migration step already bumped `76 → 80 shared agents` and `14 → 15 skills` across 6 canonical sites (CLAUDE.md / README.md / docs/architecture.md / MAINTAINER.md / skills/using-erfana/SKILL.md / docs/verification-gates.md). Modernize added no new prose count claims.
- **Why it matters:** First Modernize pass on a freshly-migrated skill. Validated the workflow of running Modernize immediately after migration to absorb residual non-4.7 patterns. Also demonstrated that small migrations from external sources can ship 4.7-shaped with minimal additional work when migration is treated as half of the modernization budget.

### `erfana:fact-checking` – v4.6.0 lens-review hardening pass

- **Operator:** `/erfana:lens-review` (5 lenses: skill-design, orchestration-architecture, security, reliability, consistency) → main-context synthesis (23 findings) → 4-question batched `AskUserQuestion` for scope/fan-out/model/edit-safety decisions → 2 rounds of `Plan`-agent plan review (feasibility + completeness, then verification of closure) → direct human edits. **Not** a Modernize-operation run – recorded here by the same convention as the managing-agents v4.3.1 lens-review row.
- **Context:** the v4.2.7 Modernize pass flagged the ≥50-claim parallel path as untested (caveat 1) and the chunk-size as un-tuned (caveat 2). The lens review confirmed those caveats were real defects: the parallel merge had no per-chunk reconciliation and could silently drop claims, and the skill ingested untrusted documents with no instruction/data separation and wrote model output back unscreened.
- **Decisions taken:** all 23 findings in one release; harden the existing Task fan-out (not a workflow migration – conflicts with the skill's no-external-references rule and it has no `Workflow` tool); keep Opus/xhigh for verification (accuracy-first) with documented rationale; content-anchored edits + git as undo (no new tool grants).
- **Findings applied (grouped):**
  - **Security (blocker + 5):** untrusted-content rule in `SKILL.md` + `fc-extract-claims`/`fc-verify-claims`/`fc-discover-sources`; discovery-hint downgrade (CLAUDE.md/INDEX.md no longer "most reliable source"); lexical path screen + `--section` integer validation (advisory – no shell); output screening of `corrected`/`citation` before write with the agent's own `<!-- Source: -->` citation exempted; labeled untrusted-quote block for `source_passage`.
  - **Reliability + orchestration (blocker + majors):** `completion_status`/`missing_claim_ids` added to `fc-verify-claims`; line-170 fallback + `<quality_gate>` + `<output>` rewritten so partial coverage is declared not silently truncated; Step 3.1/3.2 reconcile by dispatched claim id, re-dispatch only failed/partial chunks (max 3 → escalate), cap ~8 parallel workers (waves above), chunk-boundary inputs, structural sanity-check; empty source index → `status: error` not an `Ungrounded` batch; content-anchored fix application with advisory `line` disambiguator; pre-apply commit confirmation; `claim_id` join documented; resource ceiling (orchestrator-enforced, extractor still extracts all).
  - **Consistency + hygiene:** step count 12 → 13; severity casing note in `SKILL.md` + `verification-guide.md`; singular schema-key labels; removed duplicate "When this skill applies"; consolidated deprecated-params rule; trimmed prior-step-only scaffolding on display steps; ToCs + Example 4; new `error-handling.md` rows + `anti-patterns.md` entries.
- **Files edited:** `skills/fact-checking/SKILL.md` + all four `agents/fc-*.md` + `references/{verification-guide,error-handling,anti-patterns,user-override}.md` + `examples.md`.
- **Honesty note (drove the framing):** the skill and its agents have no Bash, so path screening and reconciliation are model-followed invariants + lexical screening, backed by user-confirmation gates, `Glob` root-confinement, and `Edit` exact-match semantics – documented as such, not as cryptographic guarantees. The new prose-only controls are not deterministically Gate-enforceable; recorded as an accepted, fixture-covered caveat.
- **Why it matters:** first lens-review-driven hardening of a verification skill that both reads untrusted input and writes to disk. Confirmed that a Modernize PASS (70/70) does not imply security/reliability soundness – the Section 12 checklist scores 4.7-shape, not threat-model coverage; a researched multi-lens review is the complementary pass.

### `erfana:managing-reports` – v4.5.0 lens-review hardening pass

- **Operator:** `/erfana:lens-review` (5 lenses: skill-architecture, agent-authoring, security, consistency, documentation) → main-context synthesis (23 findings) → 4-question batched `AskUserQuestion` (review engine / models / strictness / file-safety) → 3 `Plan`-agent plan-review passes (feasibility, completeness, gate-compliance) → direct human edits. **Not** a Modernize-operation run – recorded by the same convention as the managing-agents v4.3.1 and fact-checking v4.6.0 lens-review rows.
- **Context:** the central REVIEW feature could not run – `review-report` (itself a subagent) was designed to spawn the six validator subagents, which Claude Code forbids; no agent treated ingested report content as untrusted; and `maintain-report` shelled out (`cp`/`mkdir`/`diff`) on unvalidated path parameters with prose-only guards.
- **Decisions taken:** parallel-then-consolidate review (the main conversation fans out the six validators, `review-report` consolidates their results inline, `Task` dropped); all six validators blocking (PASS/FAIL, no CONDITIONAL/quick/skip tier, score advisory); right-sized models (formatting → haiku; the other validators + gather/modify/maintain → sonnet; design + review consolidator → opus; capitalization kept on sonnet rather than haiku because it is now a hard gate); shell removed from `maintain-report` (archive copy-only).
- **Findings applied (grouped):**
  - **Blockers (3):** flattened the REVIEW orchestration; trust boundary across `SKILL.md` + all 11 agents; `maintain-report` Bash removed (path-traversal / command-injection surface closed).
  - **Verdict + strictness:** verdict collapsed to PASS/FAIL; `CONDITIONAL PASS`, the `quick` 2-validator level, the per-validator skip/override, and the numeric score gate removed; the 0-100 score demoted to advisory; the canonical validation-output example recast to FAIL.
  - **Frontmatter + authoring:** `allowed-tools` (was `tools`), unsupported keys dropped, `when_to_use` split with quoted triggers, trigger-shaped agent descriptions, model/effort tiering, dead Haiku / duplicate-template blocks + the `model=haiku` test scenario removed.
  - **Content:** date format unified (`DD Month YYYY`), executive-summary length unified (≤10% / max 2 pages), the Five C's de-attributed from "IIA Standard", the flagship example fixed (banned "significant" removed), soft-quantifier bounds, sentence-case table headers, word-rule unified, real-looking client de-identified across the reference/template/example layers.
- **Files edited:** `skills/managing-reports/SKILL.md` + all 11 `agents/*.md` + `reference/*.md` + `templates/*.md` + `examples/*.md` + `validation/test-scenarios.md`.
- **Honesty note:** the trust boundary across the 12 files and `maintain-report`'s path-safety are model-followed prompt invariants + lexical screening, not Gate-enforced – after this release the skill has no shell anywhere; recorded as an accepted caveat in [`known-caveats.md`](known-caveats.md). The nested-agent set is unchanged, so the v5.0.0 plugin-root cascade is still owed.
- **Why it matters:** second lens-review-driven hardening of an orchestration skill (after managing-agents). Confirmed a skill can pass all 16 gates while its headline feature is architecturally impossible – static gates score shape and counts, not runtime orchestration validity.

## When to consult this registry

- **Before running Modernize on a skill** – check the "Last pass" column to size the next pass. A skill modernized in the current release line probably only needs a smoke pass; one last modernized many releases ago likely accumulated drift.
- **When reviewing a skill in a CI failure** – check whether it has a Modernize history that explains current patterns (e.g., `managing-issues` operation-scoped phase-requirements files reflect F1 from v4.2.1).
- **When estimating the v5.0.0 sibling cascade** – every row in this table is a skill where cascade is unnecessary; every skill NOT in this table that is in scope for cascade still owes a Modernize pass.

## Skills NOT yet modernized (as of v4.2.7)

The Modernize operation has an early-exit guard for skills with nested `<skill>/agents/` directories (managing-articles, managing-reports). These require the v5.0.0 architectural cascade (nested-agent migration to plugin-root with disambiguating prefixes), not prose modernization. See `ROADMAP.md > Forward-looking — v5.0.0 sibling cascade` for the deferred work.

Skills in scope for routine (prose-only) Modernize:

- `erfana:design-direction`
- `erfana:design-prototype`
- `erfana:design-slides`
- `erfana:design-motion`
- `erfana:design-infographic`
- `erfana:managing-specs`
- `using-erfana`

Skills in scope for v5.0.0 architectural cascade (NOT routine Modernize):

- `erfana:managing-reports` (11 nested agents)

Resolved ahead of the v5.0.0 cascade:

- `erfana:managing-articles` – redesigned in v4.3.0; the 23 nested agents were consolidated into 5 plugin-root `article-*` shared agents and the nested `agents/` directory dropped.

Skills imported already-4.7-shaped (no Modernize pass required):

- `erfana:grill-me` (v4.2.3 import from upstream `superpowers:grill-me`; post-tag `erfana:managing-skills` standard-mode review returned HEALTHY 4.5/4.5 applicable, focused-skill shape, 0 P0/P1/P2/P3 findings). Audit-trail in `CHANGELOG.md` v4.2.3 Internal section.

## Maintenance rule

Every future Modernize pass MUST add or update a row here. Treat this as a Gate 15-adjacent invariant – if you bump the manifest version and the release CHANGELOG mentions Modernize, this file is part of the same atomic commit. Gate 15 does not enforce this today (the registry is prose, not a count claim); enforcement is by convention. Adding a CI check is a roadmap candidate.

## See also

- [`../skills/managing-skills/SKILL.md`](../skills/managing-skills/SKILL.md) – the Modernize operation that produces these audit-trail rows.
- [`../skills/managing-skills/guides/skill-modernization-guide.md`](../skills/managing-skills/guides/skill-modernization-guide.md) – per-pattern remediation playbook.
- [`../skills/managing-skills/guides/opus-4-7-patterns.md`](../skills/managing-skills/guides/opus-4-7-patterns.md) – 17-section reference for the patterns Modernize applies.
- [`../skills/managing-skills/validation/pre-release-checklist.md`](../skills/managing-skills/validation/pre-release-checklist.md) – Section 12 (skills) the Modernize operation scores against.
- [`../skills/managing-skills/validation/agent-pre-release-checklist.md`](../skills/managing-skills/validation/agent-pre-release-checklist.md) – Section 13 (agents) mirror.
- [`../tests/managing-skills/v4.2.0-pilot.md`](../tests/managing-skills/v4.2.0-pilot.md) – the design-review Phase 0 pilot record.
- [`../CHANGELOG.md`](../CHANGELOG.md) – authoritative release narrative (v4.2.0 / v4.2.1 / v4.2.2 entries for the full context behind each pass).
- [`../ROADMAP.md`](../ROADMAP.md) – v5.0.0 sibling-cascade plan for skills not yet modernized.
- [`architecture.md`](architecture.md) – `managing-skills` row + Modernize-operation summary.
| 2026-05-30 | managing-specs | 4.x -> 5.0.0 | registry schema v3 (failed-tombstone, metadata.version) + trust-boundary hardening + transactional reserve/confirm/fail saga + single-writer registry + fault-classified retry; auto-migration v2->v3 | claude-opus-4-8 | All 16 gates green |
