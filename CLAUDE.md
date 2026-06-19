# CLAUDE.md – erfana-skills

Maintainer-facing entry point for Claude Code (or any maintainer agent) working on this repo. End-user instructions live in `README.md`. Architectural conventions: [`docs/architecture.md`](docs/architecture.md). Gate definitions: [`docs/verification-gates.md`](docs/verification-gates.md) + [`docs/gates/`](docs/gates/). Caveats: [`docs/known-caveats.md`](docs/known-caveats.md).

## What this is

The **erfana** plugin for Claude Code – an open-source (GPL-3.0-only) design + orchestration toolkit, distributed via a single-plugin GitHub marketplace at `github.com/qodeca/erfana-skills`. Maintained by Qodeca sp. z o.o. End-user docs: `README.md`. Full catalog, per-command detail, and version history: [`docs/architecture.md`](docs/architecture.md).

Current version: **v6.0.1**. The plugin ships 15 auto-discovered skills + 87 shared agents + 4 safety hooks + 5 slash commands. Load-bearing summary below.

**Skills (15)** – all invoke as `/erfana:<name>`:

- Design (6): `design-direction`, `design-prototype`, `design-slides`, `design-motion`, `design-infographic`, `design-review` (user-invoked only – `disable-model-invocation: true`).
- Orchestration (6): `managing-agents`, `managing-issues`, `managing-skills`, `managing-specs`, `managing-reports`, `managing-articles` (per-skill agent notes below).
- `managing-articles` delegates to 5 plugin-root `article-*` shared agents (hoisted from nested in v4.3.0); it ships no skill-internal agents.
- `managing-reports` ships 11 internal validation agents.
- Process (1): `grill-me`. Verification (1): `fact-checking` (user-invoked only). Bootstrap (1): `using-erfana` (auto-loaded).

**Safety hooks (4)** – project-agnostic safety net only (personal style preferences belong in user settings). Wired through `hooks/hooks.json` with `${CLAUDE_PLUGIN_ROOT}` paths, validated by Gate 14: `bash-safety` (PreToolUse/Bash – destructive commands, force-push, IMDS, `curl|bash`, …), `secret-detector` (PreToolUse/Write|Edit – cloud/API tokens + PEM keys), `post-compact-reminder` (PostCompact – re-injects load-bearing facts + git snapshot), `verify-completion` (Stop – blocks success-without-evidence claims; allowlists the `<!-- erfana:status-template -->` / `<!-- erfana:explain-template -->` sentinels per Gate 16). **Cross-platform (v4.2.20+):** each hook ships a `.sh` (macOS/Linux) **and** a `.ps1` (Windows) sibling, dispatched by `hooks/dispatch.sh`; Gate 14 enforces both siblings exist and Gate 16 replays the verify-completion fixtures through the OS-native implementation. Mechanism + behavioural detail: [`docs/architecture.md`](docs/architecture.md) + [`docs/gates/16-hook-fixtures.md`](docs/gates/16-hook-fixtures.md).

**Slash commands (5)** under `commands/`, registered as `/erfana:<name>`:

| Command | Purpose |
|---|---|
| `doc-update` | Refresh project docs from the live change set; full-repo sweep, no git action by default |
| `project-status` | Pyramid-Principle project-status brief for a PO / PM / BA audience |
| `session-status` | Same brief scoped to the current Claude Code session |
| `lens-review` | Researched multi-lens code review, severity-ranked (PM-facing + technical detail) |
| `explain-issue` | Translate one GitHub issue into a PM / PO brief |

The design asset bundle (`skills/design-shared/`) holds shared `assets/`, `demos/`, `scripts/`, and cross-cutting `references/` consumed by **design** sub-skills only via `../design-shared/...`. Orchestration skills are brand-agnostic. Adding a sibling skill = create `skills/<name>/SKILL.md` + optional references; auto-discovery handles the rest.

## Hard constraints (non-negotiable)

Rules below are enforced by gates (`scripts/run-all-gates.sh`); per-gate detail lives in [`docs/gates/`](docs/gates/).

- **Zero CJK characters anywhere** in `*.md`, `*.json`, `*.html`, `*.js`, `*.mjs`, `*.jsx`, `*.py`, `*.sh`, `*.svg`, `*.yml`, `*.yaml`, `.gitignore`. UTF-8 only. (Gate 1)
- **Default shipped brand is `erfana`**; the copyright holder / maintainer is `Qodeca sp. z o.o.` (`github.com/qodeca`). Plugin package id is `erfana`. Legacy brand `qodesign` is forbidden across `skills/`, `.claude-plugin/`, `README.md`, `LICENSE`, `SECURITY.md`, `MAINTAINER.md`, `.github/`. Two whitelisted exceptions: `skills/using-erfana/SKILL.md` (legacy-brand reminder), `CHANGELOG.md` (history). (Gate 11)
- **SKILL.md `name:` = folder name** for all fifteen skills. The `/erfana:` invocation prefix derives from `plugin.json` `name: erfana`, **not** from `SKILL.md name:` (per [skills frontmatter spec](https://code.claude.com/docs/en/skills#frontmatter-reference): lowercase, hyphens, max 64 chars, no `:`). Folder-name equivalence keeps autocomplete consistent. Both namespaced (`/erfana:design-prototype`) and bare (`/design-prototype`) register today – tracked upstream at [anthropics/claude-code#43695](https://github.com/anthropics/claude-code/issues/43695); document the namespaced form everywhere. (Gate 2)
- **Agent `name:` = filename basename** (no `.md`) for every `agents/*.md`. (Gate 2)
- **Skill descriptions are trigger-shaped**, not workflow summaries. Frontmatter `description:` answers "when to use this skill"; workflow goes in the body. Soft-warn over 500 chars. (Gate 2)
- **Watermark literal** for the active brand is `Created with erfana` (motion MP4/GIF only), sourced at runtime from `brand.json` → `voice.watermark`. Note: Gate 9 enforces it as a **hardcoded allowlist literal** in `scripts/run-all-gates.sh` (a brand-output check, not read from the manifest at gate time) – changing the active brand's watermark requires updating that allowlist in the same change. Never `Created by qodesign` or any other hardcoded phrasing. (Gate 9)
- **Brand identity is sourced from manifest, not inline literals.** Colors, typography, voice, watermark, illustration style, logos live under `skills/design-shared/brands/<id>/` as `brand.json` (matching `brand.schema.json` v1.3) + sibling `tokens.tokens.json` (W3C DTCG 2025.10). Schema v1.3 adds optional `imagery.logoLibrary` (mirroring `backgroundLibrary` / `shapeLibrary` / `templateLibrary` from v1.2). Each brand folder ships a root `CLAUDE.md` (prose Claude entry point pointing at `INDEX.md` catalogs + caveats the manifest cannot express). Selected libraries MAY also ship `RULES.md` (brandbook-derived deep prose; v0.4.0+) – bidirectional Gate 12 check against INDEX.md (file → cite) and brand-root CLAUDE.md (symmetry). Optional `brandbook/` subfolder (source PDFs + OCR derivatives) is maintainer-only, NOT in bootstrap read order; RULES.md may cite brandbook screenshot paths as audit-trail. Active brand id in single-line `skills/design-shared/brands/ACTIVE_BRAND` (defaults to `erfana`). Adding a brand = folder copy under `brands/` + one-line append to `PRODUCTION_BRANDS` in `scripts/gate-12-brand-manifests.sh`. Convention-over-configuration: `id` MUST equal folder basename. Default `tokensContract` (`color.brand.{primary,accent,surface-dark,text-light}` + `typography.fontFamily.{primary,display,mono}`) unless overridden. Brandbook hex fidelity = Gate 13 (soft) via `scripts/check-brandbook-hex.sh` + `scripts/_lib/brandbook-hex-inventory.json`. Two brand bundles today: `erfana` (active, v1.0.0, neutral logo-only default brand), `example-acme` (placeholder; exempt from CLAUDE.md / INDEX.md / RULES.md checks). (Gate 12, Gate 13)
- **Brand SVGs (logos, shapes) MUST contain no `<script>`, no `<foreignObject>`, no event-handler attributes (`onload`, `onclick`), no `href` / `xlink:href` starting with `http://`, `https://`, `data:`, `javascript:`.** Browsers execute SVG during Playwright recording (`render-video.js`) – script-bearing or external-fetching SVGs are a supply-chain attack surface. **Exception**: SVGs under any path segment named `templates` bypass content rules (templates are reference material `render-video.js` never loads). the default `erfana` brand ships a self-contained neutral logo (no placeholder warnings). (Gate 5)
- **Cross-references in `skills/*/SKILL.md` and `skills/*/references/*.md` must resolve** from the skill's directory. Sub-skills cite shared assets via `../design-shared/...`. No dead paths, no absolute paths to other home directories. (Gate 7)
- **Plugin manifests are valid JSON.** `plugin.json` keeps `name: erfana` + string `repository` field (not an object). `marketplace.json` plugin source starts with `./`. (Gate 2)
- **`hooks/hooks.json` is valid JSON**, plugin wrapper format (`{"hooks": {…}}`), every command path uses `${CLAUDE_PLUGIN_ROOT}/hooks/<script>.<ext>`. No bare absolute paths, no `~/`, no other env vars. Every referenced script must exist with executable bit, recognised shebang (`#!/usr/bin/env bash` or `#!/bin/bash`), and pass `bash -n`. **Cross-platform (v4.2.20+):** commands invoke `dispatch.sh <hook>`; Gate 14 additionally verifies each dispatched `<hook>` has both a `.sh` and a `.ps1` sibling and PowerShell-parses the `.ps1` files when a PowerShell is on PATH (skipped on bare Linux CI). Hooks ship as the project-agnostic safety net only; personal style preferences belong in user settings. (Gate 14)
- **Prose claims about plugin shape MUST match the filesystem** (v4.1.2+, extended v4.1.3+). Seven classes enforced atomically by Gate 15: (1) `Current version: **vX.Y.Z**` banner = `plugin.json` version; (2) per-skill internal agent counts (CLAUDE.md / README.md / docs/architecture.md / MAINTAINER.md) = `ls skills/managing-*/agents/`; (3) "X shared agents" claims = `ls agents/*.md`; (4) top-level skills count claims = `ls skills/` minus design-shared; (5) hooks count claims = `ls hooks/*.sh` minus the `dispatch.sh` launcher; (6) slash command count claims = `ls commands/*.md`; (7) per-gate detail-file count claims (CLAUDE.md / docs/architecture.md) = `ls docs/gates/*.md`. `MAINTAINER.md` "Current state" header is exempt from (1) only; its "Plugin scope" line participates in (2)-(6). (Gate 15)
- **`erfana:design-review` must keep `disable-model-invocation: true`.** Reviews are user-requested only.
- **Brand-styled artwork follows the active brand's `CLAUDE.md` rules verbatim.** The default `erfana` brand (`skills/design-shared/brands/erfana/CLAUDE.md`) is a neutral logo-only bundle: Inter (body + display) + JetBrains Mono, the indigo/cyan/ink/paper palette from `tokens.tokens.json`, and one self-contained logo lockup in `logo/`. It declares no photo/shape/template libraries, so any artwork beyond the logo is the user's to supply (bring-your-own-brand). Sub-skills inherit via `using-erfana`; never hardcode brand specifics in skill prose.
- **`erfana:design-slides` deliverables follow the v3.1.0 contract**: 20 px text floor (supersedes prior 14/15/16 px sub-floors); 8 px grid (`8/16/24/.../112`); per-deck `assets/` local copy of brand assets (slide HTML/CSS reference `../assets/...`, never `skills/design-shared/brands/...`); per-slide independent subagent review before declaring done (step 5b in `skills/design-slides/SKILL.md`); delete `_*.png` verification screenshots before completion. Full rules in `skills/design-slides/references/slide-decks.md`.
- **No deprecated Anthropic APIs in skills/agents** (v4.2.0+): no `temperature`, `top_p`, `top_k`, or fixed `thinking: {type: "enabled", budget_tokens: N}` in skill body, agent body, or templates. Opus 4.7 returns 400 at runtime per Anthropic migration guide. Use `{type: "adaptive"}` + `effort` field instead. Gate 2 warns at line-start YAML-key syntax; soft-blocking now via Section 12.7 of `pre-release-checklist.md` + Section 13.3/13.4 of `agent-pre-release-checklist.md`; hard-blocking from v4.3.0. False-positive guard skips backtick'd code references and detection regexes.
- **Skill descriptions follow Opus 4.7 patterns** (v4.2.0+, refined v4.2.1): third-person voice (no "I can help" / "You can use" / "I'll help") — **Anthropic-required** per skill-creator/SKILL.md (pre-release-checklist 12.1); ≥3 specific quoted activation phrases in `when_to_use` — Anthropic requires "specific triggers" without count, **≥3 is plugin convention** for activation reliability (12.2); no filler word repetition ("comprehensive" / "thorough" / "detailed"); combined `description` + `when_to_use` ≤1,536 chars (Anthropic-documented truncation limit, 7.4). Gate 2 warns; hard-blocking from v4.3.0.

## Repository layout (v4.1+)

Detailed multi-domain architecture, shared-content layers, brand-system layer, cross-skill flow, adding-new-skills procedure: [`docs/architecture.md`](docs/architecture.md). Highlights only below.

| Path | Role |
|---|---|
| `.claude-plugin/plugin.json`, `marketplace.json` | Plugin + marketplace manifests (valid JSON; `name: erfana`) |
| `agents/` | 87 shared agents (`*.md`), flat, auto-discovered |
| `hooks/hooks.json` + `hooks/*.{sh,ps1}` | Hook wiring + 4 safety scripts (`bash-safety`, `secret-detector`, `post-compact-reminder`, `verify-completion`) each with a `.sh` + `.ps1` sibling, plus the `dispatch.sh` cross-platform launcher (Gate 14) |
| `commands/*.md` | 5 slash commands, auto-discovered as `/erfana:<name>` |
| `skills/<name>/SKILL.md` | 15 skills (design + orchestration + process + verification + bootstrap); `managing-reports` ships nested `agents/` (`managing-articles` delegates to 5 plugin-root `article-*` agents as of v4.3.0) |
| `skills/design-shared/` | Shared design `assets/`, `demos/`, `scripts/`, `references/`, `brands/<id>/` (design sub-skills only, via `../design-shared/...`) |
| `scripts/run-all-gates.sh` | Single-command verifier for gates 1–17 (per-gate `gate-NN-*.sh` scripts alongside) |
| `docs/` | `architecture.md`, `verification-gates.md` + `gates/01–17`, `modernization-registry.md`, `known-caveats.md` |
| `.github/workflows/verify.yml`, `CODEOWNERS` | CI gate runner; code-owner routing |
| `tests/` | Maintainer scratch; per-deck local `assets/` copies |
| `MAINTAINER.md`, `SECURITY.md` | Succession plan; vulnerability disclosure |

Full per-path layout: [`docs/architecture.md`](docs/architecture.md) `## Repository layout`.

## Critical commands

Pre-commit + CI verification – single command for all 17 gates (16 hard + 1 soft):

```bash
bash scripts/run-all-gates.sh
```

Pass condition: `=== ALL GATES PASSED ===` plus `claude plugin validate` returning `Validation passed`. Gate 13 (brandbook hex coverage) is soft. Gate 15 (doc-claim sync, v4.1.2+) is hard – six checks blocking releases that ship with version banner, agent counts, skills count, hooks count, or slash command count drifted from the filesystem.

REUSE/SPDX licensing is **not** part of `run-all-gates.sh`: `reuse lint` runs as a separate blocking step in `.github/workflows/verify.yml` (pinned `reuse==5.1.1`). To reproduce the licensing check locally, `pip install reuse && reuse lint` (expect exit 0).

Full gate definitions: [`docs/verification-gates.md`](docs/verification-gates.md). Architectural conventions: [`docs/architecture.md`](docs/architecture.md).

Per-gate standalone spot-checks (frontmatter/name, manifest parse, brand consistency, hook health): [`docs/verification-gates.md`](docs/verification-gates.md) `## Quick spot-checks`.

## Release process

For every release:
1. Changes reach `develop` first via `feature/...` branches (CI-gated). Steps 2-5 (bump, markers, CHANGELOG) land on `develop`; the release itself is a PR from `develop` into `main`.
2. Bump `version` in `.claude-plugin/plugin.json` only (semver). `plugin.json` is the single source of truth – the marketplace entry carries no `version` (Claude Code resolves `plugin.json` `version` first per the [version-resolution order](https://code.claude.com/docs/en/plugin-marketplaces), so a duplicate in `marketplace.json` would only mask it).
3. **Sync prose version markers** – update `Current version: **vX.Y.Z**` at line ~9 of this file so it matches. Gate 15 enforces. Also bump `CITATION.cff` (`version` + `date-released`) – not Gate-enforced, sync by hand. `MAINTAINER.md` "Current state" header is version-independent.
4. Add an entry to `CHANGELOG.md` (Keep a Changelog format).
5. Commit (auto-signed via SSH) and let CI run.
6. Open the release PR (`develop` -> `main`). CODEOWNERS auto-requests review from `@marcinobel`. The `main-protection` ruleset requires signed commits, code-owner review, and the passing `verify.yml` status checks (`gates`, `secret-scan`).
7. **Solo-maintainer flow**: GitHub disallows self-approval; use `gh pr merge <num> --admin --squash --delete-branch` (ruleset has a RepositoryRole bypass actor for admin; `--admin` also overrides the required CI checks, so confirm CI is green first). Bypass becomes unnecessary when a backup maintainer joins.
8. **After merge** (do NOT skip – v4.1.0 missed both, requiring back-fill in v4.1.1+): `git pull origin main && git tag -s vX.Y.Z -m "..." && git push origin vX.Y.Z`.
9. Create the GitHub Release: `gh release create vX.Y.Z --notes-file -`. Verify `gh release list` shows the new version with the `Latest` flag; if `--latest` was lost (e.g. back-filling), correct with `gh release edit vX.Y.Z --latest`.

Auto-update is **opt-in** for this third-party marketplace (only Anthropic's own marketplaces auto-update by default). Users who enabled it – per-marketplace in `/plugin`, or org-wide via `"autoUpdate": true` in managed settings – get the update on next session start (a `GITHUB_TOKEN` is needed for the background fetch while the repo is private). Manual fallback: `/plugin marketplace update erfana-skills && /plugin update erfana@erfana-skills`.

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

The `main-protection` ruleset enforces `required_signatures`. Unsigned pushes to `main` are rejected. Marcin's release signing key is registered on GitHub (signing-purpose, ed25519). Verify locally:

```bash
git config --global --get-regexp '^(commit|tag|gpg|user)\.'
# Expect commit.gpgsign=true, tag.gpgsign=true, gpg.format=ssh
git log --show-signature -1
```

Local-pass is **necessary but not sufficient** for the green "Verified" badge on GitHub – the cryptographic check can pass while GitHub still returns `verified: false / reason: "no_user"` if the commit's author email is not on the account's verified-emails list. For end-to-end confirmation use the two-stage check in [`MAINTAINER.md`](MAINTAINER.md) `## Onboarding a backup maintainer` step 3 stage (b) (`gh api repos/<owner>/<repo>/commits/<sha> --jq '.commit.verification'`); the 2026-05-15 `6fa70e5` incident in [`docs/known-caveats.md`](docs/known-caveats.md) is the canonical worked example of this gap.

New-maintainer one-time setup (after their public key is registered on GitHub with signing purpose): see [`MAINTAINER.md`](MAINTAINER.md) `## Onboarding a backup maintainer`.

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
- Mandating "validate after every step" rituals in skill bodies – Opus 4.7 self-verifies; validate only irreversible-side-effect steps (file writes, agent-file creation, breaking changes).
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

Accepted risks introduced by v4.0.0 scope widening, v4.1.0 hooks migration, and the 2026-05-17 v4.2.8 → v4.2.10 same-day release chain (generic-name agent collisions, unverified per-skill nested `agents/` discovery, skipped rc soaks – extended four times now, `~/.claude/` duplication, PostCompact subprocess cost, etc.): [`docs/known-caveats.md`](docs/known-caveats.md).
