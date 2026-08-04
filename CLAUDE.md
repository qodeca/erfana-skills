# CLAUDE.md – erfana-skills

Maintainer-facing entry point for Claude Code (or any maintainer agent) working on this repo. End-user instructions live in `README.md`. Architectural conventions: [`docs/architecture.md`](docs/architecture.md). Gate definitions: [`docs/verification-gates.md`](docs/verification-gates.md) + [`docs/gates/`](docs/gates/). Caveats: [`docs/known-caveats.md`](docs/known-caveats.md).

## What this is

The **erfana** plugin for Claude Code – an open-source (GPL-3.0-only) design + orchestration toolkit, distributed via a single-plugin GitHub marketplace at `github.com/qodeca/erfana-skills`. Maintained by Qodeca sp. z o.o. End-user docs: `README.md`. Full catalog, per-command detail, and version history: [`docs/architecture.md`](docs/architecture.md).

Current version: **v6.4.0**. The plugin ships 15 auto-discovered skills + 87 shared agents + 4 safety hooks + 5 slash commands. Load-bearing summary below.

**Skills (15)** – all invoke as `/erfana:<name>`:

- Design (6): `design-direction`, `design-prototype`, `design-slides`, `design-motion`, `design-infographic`, `design-review` (user-invoked only – `disable-model-invocation: true`).
- Orchestration (6): `managing-agents`, `managing-issues`, `managing-skills`, `managing-specs`, `managing-reports`, `managing-articles` (per-skill agent notes below).
- `managing-articles` delegates to 5 plugin-root `article-*` shared agents; it ships no skill-internal agents.
- `managing-reports` ships 11 internal validation agents.
- `managing-skills` opens every operation with a coverage-map requirements interview: Create always interviews via the shared `grill-planner` agent + `references/interview-protocol.md`; Modify/Review/Modernize gate-then-grill. Backstopped by the skill-scoped `ms-grill-guard` Stop hook (sentinel `<!-- erfana:ms-grill-open -->`).
- Process (1): `grill-me`. Verification (1): `fact-checking` (user-invoked only). Bootstrap (1): `using-erfana` (auto-loaded).

**Safety hooks (4)** – project-agnostic safety net only (personal style preferences belong in user settings). Wired through `hooks/hooks.json` with `${CLAUDE_PLUGIN_ROOT}` paths, validated by Gate 14: `bash-safety` (PreToolUse/Bash – destructive commands, force-push, IMDS, `curl|bash`, …), `secret-detector` (PreToolUse/Write|Edit – cloud/API tokens + PEM keys), `post-compact-reminder` (PostCompact – re-injects load-bearing facts + git snapshot), `verify-completion` (Stop – blocks success-without-evidence claims; allowlists the `<!-- erfana:status-template -->` / `<!-- erfana:explain-template -->` sentinels per Gate 16). **Cross-platform (v4.2.20+):** each hook ships a `.sh` (macOS/Linux) **and** a `.ps1` (Windows) sibling, dispatched by `hooks/dispatch.sh`; Gate 14 enforces both siblings exist and Gate 16 replays the verify-completion fixtures through the OS-native implementation. Mechanism + behavioural detail: [`docs/architecture.md`](docs/architecture.md) + [`docs/gates/16-hook-fixtures.md`](docs/gates/16-hook-fixtures.md). Separately, two **skill-scoped** Stop hooks ship inside their skills, not through `hooks/hooks.json`: `skills/grill-me/hooks/grill-guard` (v6.2.0+) and `skills/managing-skills/hooks/ms-grill-guard` – declared in each SKILL.md `hooks:` frontmatter, dispatched as `dispatch.sh ../skills/<name>/hooks/<hook>`, validated by Gate 16 fixtures + sentinel symmetry + a guard-drift identity check.

**Slash commands (5)** under `commands/`, registered as `/erfana:<name>`. Per-command contracts live in each `commands/<name>.md`; the user-facing summary is in `README.md`.

The design asset bundle (`skills/design-shared/`) holds shared `assets/`, `demos/`, `scripts/`, and cross-cutting `references/` consumed by **design** sub-skills only via `../design-shared/...`. Orchestration skills are brand-agnostic. Adding a sibling skill = create `skills/<name>/SKILL.md` + optional references; auto-discovery handles the rest.

## Hard constraints (non-negotiable)

Rules below are enforced by gates (`scripts/run-all-gates.sh`); per-gate detail lives in [`docs/gates/`](docs/gates/).

- **Zero CJK characters anywhere** in `*.md`, `*.json`, `*.html`, `*.js`, `*.mjs`, `*.jsx`, `*.py`, `*.sh`, `*.svg`, `*.yml`, `*.yaml`, `.gitignore`. UTF-8 only. (Gate 1)
- **Default shipped brand is `erfana`**; the copyright holder / maintainer is `Qodeca sp. z o.o.` (`github.com/qodeca`). Plugin package id is `erfana`. Legacy brand `qodesign` is forbidden across `skills/`, `.claude-plugin/`, `README.md`, `LICENSE`, `SECURITY.md`, `MAINTAINER.md`, `.github/`. Two whitelisted exceptions: `skills/using-erfana/SKILL.md` (legacy-brand reminder), `CHANGELOG.md` (history). (Gate 11)
- **SKILL.md `name:` = folder name** for all fifteen skills. The `/erfana:` invocation prefix derives from `plugin.json` `name: erfana`, **not** from `SKILL.md name:` (per [skills frontmatter spec](https://code.claude.com/docs/en/skills#frontmatter-reference): lowercase, hyphens, max 64 chars, no `:`). Folder-name equivalence keeps autocomplete consistent. Both namespaced (`/erfana:design-prototype`) and bare (`/design-prototype`) register today – tracked upstream at [anthropics/claude-code#43695](https://github.com/anthropics/claude-code/issues/43695); document the namespaced form everywhere. (Gate 2)
- **Agent `name:` = filename basename** (no `.md`) for every `agents/*.md`. (Gate 2)
- **Skill descriptions are trigger-shaped**, not workflow summaries. Frontmatter `description:` answers "when to use this skill"; workflow goes in the body. Soft-warn over 500 chars. (Gate 2)
- **Watermark literal** for the active brand is `Created with erfana` (motion MP4/GIF only), sourced at runtime from `brand.json` → `voice.watermark`. Note: Gate 9 enforces it as a **hardcoded allowlist literal** in `scripts/run-all-gates.sh` (a brand-output check, not read from the manifest at gate time) – changing the active brand's watermark requires updating that allowlist in the same change. Never `Created by qodesign` or any other hardcoded phrasing. (Gate 9)
- **Brand identity is sourced from manifest, not inline literals.** Colors, typography, voice, watermark, illustration style, and logos live under `skills/design-shared/brands/<id>/`, never as literals in skill prose. Convention over configuration: `id` MUST equal the folder basename. Adding a brand = folder copy under `brands/` + one-line append to `PRODUCTION_BRANDS` in `scripts/gate-12-brand-manifests.sh`. Manifest + token schema, the per-brand `CLAUDE.md` / `INDEX.md` / `RULES.md` expectations, the active-brand pointer, and brandbook-hex fidelity: [`docs/gates/12-brand-manifests.md`](docs/gates/12-brand-manifests.md) + [`docs/architecture.md`](docs/architecture.md). (Gate 12, Gate 13)
- **Brand SVGs (logos, shapes) MUST contain no `<script>`, no `<foreignObject>`, no event-handler attributes (`onload`, `onclick`), no `href` / `xlink:href` starting with `http://`, `https://`, `data:`, `javascript:`.** Browsers execute SVG during Playwright recording (`render-video.js`) – script-bearing or external-fetching SVGs are a supply-chain attack surface. **Exception**: SVGs under any path segment named `templates` bypass content rules (templates are reference material `render-video.js` never loads). the default `erfana` brand ships a self-contained neutral logo (no placeholder warnings). (Gate 5)
- **Cross-references in `skills/*/SKILL.md` and `skills/*/references/*.md` must resolve** from the skill's directory. Sub-skills cite shared assets via `../design-shared/...`. No dead paths, no absolute paths to other home directories. (Gate 7)
- **Plugin manifests are valid JSON.** `plugin.json` keeps `name: erfana` + string `repository` field (not an object). `marketplace.json` plugin source starts with `./`. (Gate 2)
- **`hooks/hooks.json` is valid JSON**, plugin wrapper format (`{"hooks": {…}}`), every command path uses `${CLAUDE_PLUGIN_ROOT}/hooks/<script>.<ext>`. No bare absolute paths, no `~/`, no other env vars. Every referenced script must exist with executable bit, recognised shebang (`#!/usr/bin/env bash` or `#!/bin/bash`), and pass `bash -n`. Commands invoke `dispatch.sh <hook>` per the cross-platform contract described under "What this is" above; Gate 14 additionally verifies each dispatched `<hook>` has both siblings and PowerShell-parses the `.ps1` files when a PowerShell is on PATH (skipped on bare Linux CI). Hooks ship as the project-agnostic safety net only; personal style preferences belong in user settings. Skill-scoped hooks (`skills/<name>/hooks/`, declared in SKILL.md frontmatter with the `dispatch.sh ../skills/<name>/hooks/<hook>` relative form) are exempt from Gate 14's path rule and covered by Gate 16 instead. (Gate 14)
- **Prose claims about plugin shape MUST match the filesystem.** Seven classes enforced atomically by Gate 15: (1) `Current version: **vX.Y.Z**` banner = `plugin.json` version; (2) per-skill internal agent counts (CLAUDE.md / README.md / docs/architecture.md / MAINTAINER.md) = `ls skills/managing-*/agents/`; (3) "X shared agents" claims = `ls agents/*.md`; (4) top-level skills count claims = `ls skills/` minus design-shared; (5) hooks count claims = `ls hooks/*.sh` minus the `dispatch.sh` launcher; (6) slash command count claims = `ls commands/*.md`; (7) per-gate detail-file count claims (CLAUDE.md / docs/architecture.md) = `ls docs/gates/*.md`. `MAINTAINER.md` "Current state" header is exempt from (1) only; its "Plugin scope" line participates in (2)-(6). (Gate 15)
- **`erfana:design-review` must keep `disable-model-invocation: true`.** Reviews are user-requested only.
- **Brand-styled artwork follows the active brand's `CLAUDE.md` rules verbatim.** The default `erfana` brand (`skills/design-shared/brands/erfana/CLAUDE.md`) is a neutral logo-only bundle: Inter (body + display) + JetBrains Mono, the indigo/cyan/ink/paper palette from `tokens.tokens.json`, and one self-contained logo lockup in `logo/`. It declares no photo/shape/template libraries, so any artwork beyond the logo is the user's to supply (bring-your-own-brand). Sub-skills inherit via `using-erfana`; never hardcode brand specifics in skill prose.
- **`erfana:design-slides` deliverables follow the v3.1.0 contract**: 20 px text floor; 8 px grid (`8/16/24/.../112`); per-deck `assets/` local copy of brand assets (slide HTML/CSS reference `../assets/...`, never `skills/design-shared/brands/...`); per-slide independent subagent review before declaring done (step 5b in `skills/design-slides/SKILL.md`); delete `_*.png` verification screenshots before completion. Full rules in `skills/design-slides/references/slide-decks.md`.
- **No deprecated Anthropic APIs in skills/agents**: no `temperature`, `top_p`, `top_k` (400 error on Claude Opus 4.7 and later per Anthropic's parameter-deprecation table) and no fixed `thinking: {type: "enabled", budget_tokens: N}` on Claude 5 models (unsupported on Fable 5 / Opus 5 / Sonnet 5; Haiku 4.5 still supports it) in skill body, agent body, or templates. Use `{type: "adaptive"}` + `effort` field instead. Gate 2 warns at line-start YAML-key syntax; blocking at checklist level via Section 12.7 of `pre-release-checklist.md` + Section 13.3/13.4 of `agent-pre-release-checklist.md`. False-positive guard skips backtick'd code references and detection regexes.
- **No reasoning-display instructions in skills/agents**: no prose telling a model to surface its internal reasoning (`show your reasoning`, `reproduce your thinking`, `thinking.display: visible`) — trips the `reasoning_extraction` refusal classifier on Claude Fable 5 and Claude Opus 5 (`stop_reason: "refusal"`; where fallback is configured, requests re-route to Claude Opus 4.8). Request evidence in structured output instead; author-filled `<critical_thinking>` blocks are exempt. Gate 2 warns; blocking at checklist level (Section 12.7 / 13.5). Reference: `skills/managing-skills/guides/claude-5-patterns.md`.
- **Skill descriptions follow the Claude 5 model patterns**: third-person voice (no "I can help" / "You can use" / "I'll help") — **Anthropic-required** per skill-creator/SKILL.md (pre-release-checklist 12.1); ≥3 specific quoted activation phrases in `when_to_use` — Anthropic requires "specific triggers" without count, **≥3 is plugin convention** for activation reliability (12.2); no filler word repetition ("comprehensive" / "thorough" / "detailed"); combined `description` + `when_to_use` ≤1,536 chars (Anthropic-documented truncation limit, 7.4). Gate 2 warns.

## Repository layout

Detailed multi-domain architecture, shared-content layers, brand-system layer, cross-skill flow, adding-new-skills procedure: [`docs/architecture.md`](docs/architecture.md).

Full per-path layout: [`docs/architecture.md`](docs/architecture.md) `## Repository layout`.

## Critical commands

Pre-commit + CI verification – single command for all 17 gates (16 hard + 1 soft):

```bash
bash scripts/run-all-gates.sh
```

Pass condition: `=== ALL GATES PASSED ===` plus `claude plugin validate` returning `Validation passed`. Gate 13 (brandbook hex coverage) is soft. Gate 15 (doc-claim sync) is hard – seven checks blocking releases that ship with version banner, per-skill and shared agent counts, skills count, hooks count, slash command count, or per-gate detail-file count drifted from the filesystem.

REUSE/SPDX licensing is **not** part of `run-all-gates.sh`: `reuse lint` runs as a separate blocking step in `.github/workflows/verify.yml` (pinned `reuse==5.1.1`). To reproduce the licensing check locally, `pip install reuse && reuse lint` (expect exit 0).

Full gate definitions: [`docs/verification-gates.md`](docs/verification-gates.md) plus the 17 per-gate detail files under [`docs/gates/`](docs/gates/). Architectural conventions: [`docs/architecture.md`](docs/architecture.md).

Per-gate standalone spot-checks (frontmatter/name, manifest parse, brand consistency, hook health): [`docs/verification-gates.md`](docs/verification-gates.md) `## Quick spot-checks`.

## Release process

For every release:
1. Changes reach `develop` first via `feature/...` branches (CI-gated). Steps 2-5 (bump, markers, CHANGELOG) land on `develop`; the release itself is a PR from `develop` into `main`.
2. Bump `version` in `.claude-plugin/plugin.json` only (semver). `plugin.json` is the single source of truth – the marketplace entry carries no `version` (Claude Code resolves `plugin.json` `version` first per the [version-resolution order](https://code.claude.com/docs/en/plugin-marketplaces), so a duplicate in `marketplace.json` would only mask it).
3. **Sync prose version markers** – update `Current version: **vX.Y.Z**` at line ~9 of this file so it matches. Gate 15 enforces. Also bump `CITATION.cff` (`version` + `date-released`) – not Gate-enforced, sync by hand. `MAINTAINER.md` "Current state" header is version-independent.
4. Add an entry to `CHANGELOG.md` (Keep a Changelog format). If an `## [Unreleased]` section exists (feature branches may accumulate one), promote it to `## [vX.Y.Z] - <date>` as part of the release.
5. Commit (auto-signed via SSH) and let CI run.
6. Open the release PR (`develop` -> `main`). CODEOWNERS auto-requests review from `@marcinobel`. The `main-protection` ruleset requires signed commits, code-owner review, and the passing `verify.yml` status checks (`gates`, `secret-scan`).
7. **Solo-maintainer flow**: GitHub disallows self-approval; use `gh pr merge <num> --admin --squash --delete-branch` (ruleset has a RepositoryRole bypass actor for admin; `--admin` also overrides the required CI checks, so confirm CI is green first). Bypass becomes unnecessary when a backup maintainer joins.
8. **After merge** (do NOT skip): `git pull origin main && git tag -s vX.Y.Z -m "..." && git push origin vX.Y.Z`.
9. Create the GitHub Release: `gh release create vX.Y.Z --notes-file -`. Verify `gh release list` shows the new version with the `Latest` flag; if `--latest` was lost (e.g. back-filling), correct with `gh release edit vX.Y.Z --latest`.

Auto-update is **opt-in** for this third-party marketplace (only Anthropic's own marketplaces auto-update by default). Users who enabled it – per-marketplace in `/plugin`, or org-wide via `"autoUpdate": true` in managed settings – get the update on next session start. Manual fallback: `/plugin marketplace update erfana-skills && /plugin update erfana@erfana-skills`.

Succession + bus-factor: [`MAINTAINER.md`](MAINTAINER.md). Forward-looking work: [`ROADMAP.md`](ROADMAP.md) + GitHub issues under the [`brand-system`](https://github.com/qodeca/erfana-skills/labels/brand-system) label. De-scoped items + reasoning: [`BACKLOG.md`](BACKLOG.md).

### Staged rollout

Routine releases promote `develop` to `main` via PR. For releases that materially change skill behavior or could regress trigger phrases, use the staged path:

1. On a `feature/` branch off `develop`, edit + bump + CHANGELOG as usual, and land it on `develop`.
2. Push and tag with `-rc.N` suffix: `git tag -s vX.Y.Z-rc.1 -m "rc.1"`.
3. Pin 3–5 pilot employees to the rc tag: `/plugin install erfana@erfana-skills@vX.Y.Z-rc.1`.
4. After 48-hour soak with no reports, retag the same commit as the final version, push, merge feature branch via PR.
5. Pilot group reverts to auto-update with `/plugin install erfana@erfana-skills`.

The marketplace serves whatever the manifest's `version` field says; rc tags are opt-in (manifest unchanged, no propagation to non-pinned users). Use staged rollout for: skill-frontmatter rewrites changing trigger phrases, manifest schema migrations, hook additions, anything that could flip behavior for downstream consumers without warning.

### Signed commits + signed tags

The `main-protection` ruleset enforces `required_signatures`; unsigned pushes to `main` are rejected. Verify locally:

```bash
git config --global --get-regexp '^(commit|tag|gpg|user)\.'
# Expect commit.gpgsign=true, tag.gpgsign=true, gpg.format=ssh
git log --show-signature -1
```

A local pass is **necessary but not sufficient** for the green "Verified" badge on GitHub – the cryptographic check can pass while GitHub still returns `verified: false / reason: "no_user"`. The two-stage end-to-end check, the worked example of that failure mode, and new-maintainer key setup all live in [`MAINTAINER.md`](MAINTAINER.md) `## Onboarding a backup maintainer`.

## Things to avoid

Most rules here are the negative form of a Hard constraint above; only non-duplicative gotchas are listed.

- Hand-editing any skill's `description:` / `when_to_use:` without re-running the trigger-phrase gate (Gate 8) – the frontmatter is the discovery surface.
- Modifying code logic in `skills/design-shared/scripts/` during routine maintenance – touch comments/strings only.
- Reintroducing the v1 mega-skill pattern; each sub-skill stays single-concern, multi-skill requests route via `using-erfana`.
- Adding hooks, agents, commands, or MCP servers to `plugin.json` without first updating CLAUDE.md, the verification gates, and CI.
- Drifting a prose count claim from the filesystem when adding/removing skills, hooks, commands, plugin-root agents, or per-skill nested agents. Canonical count sites: the "What this is" summary above, `README.md`, `docs/architecture.md`, `MAINTAINER.md` "Plugin scope". Gate 15 catches drift.
- Using SSH-based marketplace add in onboarding instructions (known Windows breakage).
- Bypassing the admin-merge gate for routine releases without a one-line rationale in the PR (audit trail).
- Running the Modernize operation without appending its row to [`docs/modernization-registry.md`](docs/modernization-registry.md) – not Gate-enforced, discipline by convention.
- Mandating "validate after every step" rituals in skill bodies – Opus 4.7+ and Claude 5 models self-verify (and over-verify when told to); validate only irreversible-side-effect steps (file writes, agent-file creation, breaking changes). **Carve-out:** this bans per-micro-step ritual, not phase-boundary outputs – a skill's declared quality gates, the `AskUserQuestion` calls that satisfy them, the turn-ending handoffs that satisfy them (a gate that prints a command for the user to run and then ends the turn, waiting on the user's result), its declared output artifacts, and its progress-tracking advance are required deliverables, not ceremony.
- Letting a skill invoke another skill or a slash command. A skill that needs one prints the command and ends the turn so the user runs it: invoking it re-enters skill-level work, and `/erfana:lens-review` in particular fans out up to ten reviewers into the caller's context. Worked example: rule 15 of `skills/managing-issues/SKILL.md`, which drives the QG-4a / QG-11a checkpoints.
- Authoring soft-quantifier prose ("~30-50 words", "approximately", "aim for") in shipped command/skill bodies without a hard ceiling or measurable invariant – pair every soft target with a hard ceiling (the v4.2.10 status-command lesson).

## Repository workflow

- Two long-lived branches: **`main`** (default branch – what the marketplace serves; protected by the `main-protection` ruleset: signed commits, code-owner review, and passing `verify.yml` status checks) and **`develop`** (integration branch; CI-gated via `verify.yml`, no branch protection). `verify.yml` runs on push and PR to both branches. Feature work goes on `feature/...` branches cut from `develop` and PR'd back into `develop`; a release promotes `develop` into `main` via PR, then tags `main`. Conventional Commits: `feat(...)`, `fix(...)`, `docs(...)`, `chore(...)`. Remote: `github.com/qodeca/erfana-skills`.

### Pre-commit checklist (touches brand or deck files)

1. **Gates pass locally** – `bash scripts/run-all-gates.sh` and `claude plugin validate .` both report success.
2. **Feature branch in use** – `git branch --show-current` is neither `main` nor `develop`. Skill, brand, deck, infra changes go through `feature/...` cut from `develop` and merge into `develop` via PR; `main` receives only release PRs (`develop` -> `main`) and emergency fixes.
3. **Speaker notes coherent** – every modified slide HTML's `<aside class="speaker-notes">` reflects current visible copy. No stale references to removed copy.
4. **No orphan assets in deck folders** – every file under each deck's `tests/design-slides/<deck>/assets/` is referenced by at least one slide HTML; remove unreferenced gradients, shapes, photos, logos before commit.

### Atomic commits

Split brand-bundle changes from deck-iteration changes; each commit's diff stays within one of `{deck-iteration, brand-bundle, infrastructure}`. A commit touching both `skills/design-shared/brands/<id>/...` and `tests/design-slides/<deck>/...` should be split – brand-bundle changes are reusable across decks; deck-iteration is not.

## Known caveats

Accepted risks and their rationale live in [`docs/known-caveats.md`](docs/known-caveats.md) – the single running record, including every staged-rollout override. Read it before a release; do not restate or tally its entries here.
