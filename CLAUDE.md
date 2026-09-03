# CLAUDE.md – erfana-skills

Maintainer-facing entry point for Claude Code (or any maintainer agent) working on this repo. End-user instructions live in `README.md`. Architectural conventions: [`docs/architecture.md`](docs/architecture.md). Gate definitions: [`docs/verification-gates.md`](docs/verification-gates.md) + [`docs/gates/`](docs/gates/). Caveats: [`docs/known-caveats.md`](docs/known-caveats.md).

## What this is

The **erfana** plugin for Claude Code – an open-source (GPL-3.0-only) orchestration toolkit, distributed via a single-plugin GitHub marketplace at `github.com/qodeca/erfana-skills`. Since v7.1.0 the same package also installs on **Qwen Code** (0.22.3+), which converts Claude Code plugins at install time – one package, no second manifest, no build step, no second release train. Everything the two hosts do differently lives in [`docs/hosts.md`](docs/hosts.md), generated from `scripts/_lib/host_matrix.py`; read that before changing a hook matcher, a skill frontmatter key, or agent frontmatter. Maintained by Qodeca sp. z o.o. End-user docs: `README.md`. Full catalog, per-command detail, and version history: [`docs/architecture.md`](docs/architecture.md).

Current version: **v7.1.0**. The plugin ships 9 auto-discovered skills + 87 shared agents + 6 safety hooks + 5 slash commands. Load-bearing summary below.

**Skills (9)** – all invoke as `/erfana:<name>`:

- Orchestration (6): `managing-agents`, `managing-issues`, `managing-skills`, `managing-specs`, `managing-reports`, `managing-articles` (per-skill agent notes below).
- `managing-articles` delegates to 5 plugin-root `article-*` shared agents; it ships no skill-internal agents.
- `managing-reports` ships 11 internal validation agents.
- `managing-skills` opens every operation with a coverage-map requirements interview: Create always interviews via the shared `grill-planner` agent + `references/interview-protocol.md`; Modify/Review/Modernize gate-then-grill. Backstopped by the plugin-root `ms-grill-guard` Stop hook (sentinel `<!-- erfana:ms-grill-open -->`).
- Process (1): `grill-me`. Verification (1): `fact-checking` (user-invoked only). Bootstrap (1): `using-erfana` (auto-loaded).

**Safety hooks (6)** – project-agnostic safety net only (personal style preferences belong in user settings). Wired through `hooks/hooks.json` with `${CLAUDE_PLUGIN_ROOT}` paths, validated by Gate 14: `bash-safety` (PreToolUse/Bash – destructive commands, force-push, IMDS, `curl|bash`, …), `secret-detector` (PreToolUse/Write|Edit – cloud/API tokens + PEM keys), `post-compact-reminder` (PostCompact – re-injects load-bearing facts + git snapshot), `verify-completion` (Stop – blocks success-without-evidence claims; allowlists the `<!-- erfana:status-template -->` / `<!-- erfana:explain-template -->` sentinels per Gate 16). **Cross-platform (v4.2.20+):** each hook ships a `.sh` (macOS/Linux) **and** a `.ps1` (Windows) sibling, dispatched by `hooks/dispatch.sh`; Gate 14 enforces both siblings exist and Gate 16 replays the verify-completion fixtures through the OS-native implementation. Mechanism + behavioural detail: [`docs/architecture.md`](docs/architecture.md) + [`docs/gates/16-hook-fixtures.md`](docs/gates/16-hook-fixtures.md). The remaining two are the interview guards `grill-guard` (v6.2.0+) and `ms-grill-guard` (v6.4.0+), both Stop hooks that block one stop attempt while an open-marker sentinel is present. **They moved out of SKILL.md `hooks:` frontmatter into `hooks/hooks.json` in v7.1.0**, because Qwen Code does not extract that frontmatter and a skill-scoped registration was dead on one of the two supported hosts. They now evaluate every stop; the sentinel alone scopes them to a live interview. Validated by Gate 16 fixtures + sentinel symmetry + a guard-drift identity check. **No `timeout` key appears in `hooks.json`** – the field means seconds on Claude Code and milliseconds on Qwen, so the 5-second bound lives in `dispatch.sh`; see [`docs/hosts.md`](docs/hosts.md).

**Slash commands (5)** under `commands/`, registered as `/erfana:<name>`. Per-command contracts live in each `commands/<name>.md`; the user-facing summary is in `README.md`.

Every skill is self-contained: `skills/<name>/SKILL.md` plus its own `references/`, `guides/`, `templates/` and (for `managing-reports`) `agents/`. There is no shared asset bundle. Adding a sibling skill = create `skills/<name>/SKILL.md` + optional references; auto-discovery handles the rest.

## Hard constraints (non-negotiable)

Rules below are enforced by gates (`scripts/run-all-gates.sh`); per-gate detail lives in [`docs/gates/`](docs/gates/).

- **Zero CJK characters anywhere** in `*.md`, `*.json`, `*.html`, `*.js`, `*.mjs`, `*.jsx`, `*.py`, `*.sh`, `*.svg`, `*.yml`, `*.yaml`, `.gitignore`. UTF-8 only. (Gate 1)
- **Plugin package id is `erfana`**; the copyright holder / maintainer is `Qodeca sp. z o.o.` (`github.com/qodeca`). Legacy brand `qodesign` is forbidden across the paths Gate 11 scans – `skills/`, `.claude-plugin/`, `README.md`, `LICENSE`, `CHANGELOG.md`, `SECURITY.md`, `.github/`. One whitelisted exception: `CHANGELOG.md` (history). (Gate 11)
- **SKILL.md `name:` = folder name** for all nine skills. The `/erfana:` invocation prefix derives from `plugin.json` `name: erfana`, **not** from `SKILL.md name:` (per [skills frontmatter spec](https://code.claude.com/docs/en/skills#frontmatter-reference): lowercase, hyphens, max 64 chars, no `:`). Folder-name equivalence keeps autocomplete consistent. Both namespaced (`/erfana:managing-issues`) and bare (`/managing-issues`) register today – tracked upstream at [anthropics/claude-code#43695](https://github.com/anthropics/claude-code/issues/43695); document the namespaced form everywhere. (Gate 2)
- **Agent `name:` = filename basename** (no `.md`) for every `agents/*.md`. (Gate 2)
- **Skill descriptions are trigger-shaped**, not workflow summaries. Frontmatter `description:` answers "when to use this skill"; workflow goes in the body. Soft-warn over 500 chars. (Gate 2)
- **Cross-references in `skills/*/SKILL.md` and `skills/*/references/*.md` must resolve** from the skill's directory. No dead paths, no absolute paths to other home directories. (Gate 7)
- **Plugin manifests are valid JSON.** `plugin.json` keeps `name: erfana` + string `repository` field (not an object). `marketplace.json` plugin source starts with `./`. (Gate 2)
- **`hooks/hooks.json` is valid JSON**, plugin wrapper format (`{"hooks": {…}}`), every command path uses `${CLAUDE_PLUGIN_ROOT}/hooks/<script>.<ext>`. No bare absolute paths, no `~/`, no other env vars. Every referenced script must exist with executable bit, recognised shebang (`#!/usr/bin/env bash` or `#!/bin/bash`), and pass `bash -n`. Commands invoke `dispatch.sh <hook>` per the cross-platform contract described under "What this is" above; Gate 14 additionally verifies each dispatched `<hook>` has both siblings and PowerShell-parses the `.ps1` files when a PowerShell is on PATH (skipped on bare Linux CI). Hooks ship as the project-agnostic safety net only; personal style preferences belong in user settings. No hook definition may carry a `timeout` key: the field is seconds on Claude Code and milliseconds on Qwen Code, so no value is correct on both and the bound lives in `dispatch.sh` instead. A `PreToolUse` matcher naming a Claude-only tool name must also name its Qwen counterpart from `scripts/_lib/host_matrix.py`. Matchers are plain `|`-separated tool names, never regex: a matcher Qwen cannot resolve as an alias falls through to a substring test, so regex syntax widens coverage there without widening it here. Every stderr line preceding an `exit 2` stays a literal – Qwen parses exit-2 stderr as JSON when it parses, so interpolating a filename into a block message would let attacker-controlled text emit a JSON body and change the hook's decision. Skill-scoped hooks (SKILL.md `hooks:` frontmatter) are no longer used: Qwen ignores that field, so a guard declared there runs on one host only. (Gate 14)
- **Prose claims about plugin shape MUST match the filesystem.** Eight classes enforced atomically by Gate 15: (1) `Current version: **vX.Y.Z**` banner = `plugin.json` version; (2) per-skill internal agent counts (CLAUDE.md / README.md / docs/architecture.md / MAINTAINER.md) = `ls skills/managing-*/agents/`; (3) "X shared agents" claims = `ls agents/*.md`; (4) top-level skills count claims = `ls skills/`; (5) hooks count claims = `ls hooks/*.sh` minus the `dispatch.sh` launcher; (6) slash command count claims = `ls commands/*.md`; (7) per-gate detail-file count claims (CLAUDE.md / docs/architecture.md) = `ls docs/gates/*.md`. `MAINTAINER.md` "Current state" header is exempt from (1) only; its "Plugin scope" line participates in (2)-(6). (Gate 15)
- **Claude tool names are canonical everywhere except hook matchers.** Agent `tools:` lists stay Claude-named (Qwen's converter remaps them). Skill `allowed-tools` stays Claude-named because *Claude* is what enforces it – Qwen reads a camelCase `allowedTools` key, so erfana's hyphenated key is inert there. Hook `matcher:` strings are the one surface that must name both vocabularies. **Prose in skill and agent bodies names the action, not the tool**: `Grep(pattern="x", output_mode="files_with_matches")` becomes "search for x, listing only matching file paths", because the Claude tool names do not exist on Qwen. (Gate 14 for matchers; Gate 2 for frontmatter shape.)
- **`erfana:fact-checking` must keep `disable-model-invocation: true`.** Fact-check runs are user-requested only.
- **No deprecated Anthropic APIs in skills/agents**: no `temperature`, `top_p`, `top_k` (400 error on Claude Opus 4.7 and later per Anthropic's parameter-deprecation table) and no fixed `thinking: {type: "enabled", budget_tokens: N}` on Claude 5 models (unsupported on Fable 5 / Opus 5 / Sonnet 5; Haiku 4.5 still supports it) in skill body, agent body, or templates. Use `{type: "adaptive"}` + `effort` field instead. Gate 2 warns at line-start YAML-key syntax; blocking at checklist level via Section 12.7 of `pre-release-checklist.md` + Section 13.3/13.4 of `agent-pre-release-checklist.md`. False-positive guard skips backtick'd code references and detection regexes.
- **No reasoning-display instructions in skills/agents**: no prose telling a model to surface its internal reasoning (`show your reasoning`, `reproduce your thinking`, `thinking.display: visible`) — trips the `reasoning_extraction` refusal classifier on Claude Fable 5 and Claude Opus 5 (`stop_reason: "refusal"`; where fallback is configured, requests re-route to Claude Opus 4.8). Request evidence in structured output instead; author-filled `<critical_thinking>` blocks are exempt. Gate 2 warns; blocking at checklist level (Section 12.7 / 13.5). Reference: `skills/managing-skills/guides/claude-5-patterns.md`.
- **Skill descriptions follow the Claude 5 model patterns**: third-person voice (no "I can help" / "You can use" / "I'll help") — **Anthropic-required** per skill-creator/SKILL.md (pre-release-checklist 12.1); ≥3 specific quoted activation phrases in `when_to_use` — Anthropic requires "specific triggers" without count, **≥3 is plugin convention** for activation reliability (12.2); no filler word repetition ("comprehensive" / "thorough" / "detailed"); combined `description` + `when_to_use` ≤1,536 chars (Anthropic-documented truncation limit, 7.4). Gate 2 warns.

## Repository layout

Detailed architecture, full per-path layout, cross-skill flow, adding-new-skills procedure: [`docs/architecture.md`](docs/architecture.md).

## Critical commands

Pre-commit + CI verification – single command for all 12 gates (all hard):

```bash
bash scripts/run-all-gates.sh
```

Pass condition: `=== ALL GATES PASSED ===` plus `claude plugin validate` returning `Validation passed`. Gate numbers are historical and non-contiguous – gates 5, 6, 8, 9, 12 and 13 retired with the design skills in v7.0.0 and the survivors kept their numbers. Gate 15 (doc-claim sync) is hard – eight checks blocking releases that ship with version banner, per-skill and shared agent counts, skills count, hooks count, slash command count, or per-gate detail-file count drifted from the filesystem.

Cross-host verification is a separate command, deliberately outside `run-all-gates.sh`:

```bash
bash scripts/qwen-smoke.sh --require
```

It installs the working tree into a throwaway Qwen profile (hermetic – it exports its own `HOME` and never touches the real `~/.qwen`) and checks the conversion. It is not a gate because it needs Qwen Code on `PATH`; without `--require` it prints `SKIP:` and exits 0, so a maintainer without Qwen is not blocked. CI passes `--require` in the `qwen-compat` job. **A green run proves the loader and the conversion, never the executor** – no erfana skill has yet run end to end inside a Qwen session.

REUSE/SPDX licensing is **not** part of `run-all-gates.sh`: `reuse lint` runs as a separate blocking step in `.github/workflows/verify.yml` (pinned `reuse==5.1.1`). To reproduce the licensing check locally, `pip install reuse && reuse lint` (expect exit 0).

Full gate definitions: [`docs/verification-gates.md`](docs/verification-gates.md) plus the 12 per-gate detail files under [`docs/gates/`](docs/gates/). Architectural conventions: [`docs/architecture.md`](docs/architecture.md).

Per-gate standalone spot-checks (frontmatter/name, manifest parse, brand consistency, hook health): [`docs/verification-gates.md`](docs/verification-gates.md) `## Quick spot-checks`.

The skill registry ([`docs/skill-registry.md`](docs/skill-registry.md) – every shipped skill and when it was last changed) is **generated, never hand-written**. Any change that adds, removes, renames, or touches a skill must be followed by:

```bash
bash scripts/gen-skill-registry.sh
```

and the regenerated file committed alongside it. Gate 18 hard-fails when the registry's skill list drifts from `ls skills/`, a skill is listed twice, or a row carries a date or subject git contradicts, and warns (without blocking) when dates merely lag – dates go stale the moment a skill is committed, so blocking on that would red-light `develop` after every skill change. Step 3 of the release process regenerates the file, so every shipped version is accurate.

**Squash caveat.** Feature PRs are squash-merged into `develop`, so the squash commit's subject *becomes* the touched skill's latest-commit subject there. A registry regenerated **inside** a skill-touching PR records the pre-squash subject, and Gate 18 hard-fails the instant that PR is squashed. Fix: regenerate the registry in its own **registry-only** change (nothing under `skills/`) that lands *after* the skill-source PR is already on `develop`. A registry-only commit cannot rewrite any skill's latest-commit subject, so the row it records stays valid through its own squash. Do not bundle skill-source edits and the registry regen into one squash-merged PR. History: see `CHANGELOG.md`.

## Release process

For every release:
1. Changes reach `develop` first via `feature/...` branches (CI-gated). Steps 2-5 (bump, markers, registry, CHANGELOG) land on `develop`; the release itself is a PR from `develop` into `main`.
2. Bump `version` in `.claude-plugin/plugin.json` only (semver). `plugin.json` is the single source of truth – the marketplace entry carries no `version` (Claude Code resolves `plugin.json` `version` first per the [version-resolution order](https://code.claude.com/docs/en/plugin-marketplaces), so a duplicate in `marketplace.json` would only mask it).
3. **Sync prose version markers** – update `Current version: **vX.Y.Z**` at line ~9 of this file so it matches. Gate 15 enforces. Also bump `CITATION.cff` (`version` + `date-released`) – not Gate-enforced, sync by hand. `MAINTAINER.md` "Current state" header is version-independent. Then regenerate the skill registry – `bash scripts/gen-skill-registry.sh` – and commit it, so the shipped `docs/skill-registry.md` is accurate as of the release rather than lagging (Gate 18 warns between releases; this step is what clears the warning). Regenerate it **last**, after every skill-source PR has already squash-merged into `develop`, so each row's subject matches the final squash commit; if a skill lands after this regen, redo the regen as a registry-only change (see the squash caveat above).
4. Add an entry to `CHANGELOG.md` (Keep a Changelog format). If an `## [Unreleased]` section exists (feature branches may accumulate one), promote it to `## [vX.Y.Z] - <date>` as part of the release. **Re-stamp the date on release day.** An entry written during development carries the date it was drafted, and an rc soak puts days between drafting and shipping – so `CHANGELOG.md`'s heading and `CITATION.cff` `date-released` must both be corrected at step 3, not left at whatever the branch happened to say. Neither is Gate-enforced.
5. Commit (auto-signed via SSH) and let CI run.
6. Open the release PR (`develop` -> `main`). CODEOWNERS auto-requests review from `@marcinobel`. The `main-protection` ruleset requires signed commits, code-owner review, and the passing `verify.yml` status checks (`gates`, `secret-scan`). `verify.yml` also runs `qwen-compat` and `powershell` (v7.1.0+), which are **not** required checks: add either to the ruleset only after it has reported green on a PR into `main`, since a required check that has never reported blocks merges indefinitely.
7. **Solo-maintainer flow**: GitHub disallows self-approval, so the release PR merges with `gh pr merge <num> --admin --merge` (the ruleset has a RepositoryRole bypass actor for admin; `--admin` overrides both the required CI checks and the ruleset's squash-only `allowed_merge_methods`, so confirm CI is green first). Two flags that are correct on a feature PR are wrong here: **never `--delete-branch`** (the head branch is `develop`, long-lived), and **never `--squash`** (a squash commit is not a descendant of `develop`, so the two branches lose their shared history and every later release PR re-lists the whole backlog). Feature PRs into `develop` take the opposite form: `gh pr merge <num> --squash --delete-branch`. Bypass becomes unnecessary when a backup maintainer joins.
8. **After merge** (do NOT skip): `git pull origin main && git tag -s vX.Y.Z -m "..." && git push origin vX.Y.Z`.
9. Create the GitHub Release: `gh release create vX.Y.Z --notes-file -`. Verify `gh release list` shows the new version with the `Latest` flag; if `--latest` was lost (e.g. back-filling), correct with `gh release edit vX.Y.Z --latest`.
10. **Verify what a user actually gets.** Qwen resolves the **latest GitHub release tag**, so nothing published before step 9 is installable and every earlier check ran against a tree no user will see. Install the published release and confirm the shape: `qwen extensions install qodeca/erfana-skills:erfana` then `qwen extensions list` — expect the new version, the right `Release tag:`, 9 skills, 87 agents, 5 commands. Do **not** pass `--consent`; the prompt it skips is the one a user is meant to read. Then prove a hook still fires from the installed copy, which is the only check that exercises the shipped artifact rather than the repo:
    ```bash
    printf '%s' '{"tool_name":"write_file","tool_input":{"file_path":"/tmp/x.ts","content":"k=\"AKIA_EXAMPLE_KEY\""}}' \
      | bash ~/.qwen/extensions/erfana/hooks/dispatch.sh secret-detector
    ```
    This is still the loader, not the executor: it does not prove a skill behaves correctly inside a session. See [`docs/hosts.md`](docs/hosts.md).

Auto-update is **opt-in** for this third-party marketplace (only Anthropic's own marketplaces auto-update by default). Users who enabled it – per-marketplace in `/plugin`, or org-wide via `"autoUpdate": true` in managed settings – get the update on next session start. Manual fallback: `/plugin marketplace update erfana-skills && /plugin update erfana@erfana-skills`.

Succession + bus-factor: [`MAINTAINER.md`](MAINTAINER.md). Forward-looking work: [`ROADMAP.md`](ROADMAP.md) + open GitHub issues. De-scoped items + reasoning: [`BACKLOG.md`](BACKLOG.md).

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

- Hand-editing any skill's `description:` / `when_to_use:` without re-running Gate 2 – the frontmatter is the discovery surface.
- Reintroducing the v1 mega-skill pattern; each sub-skill stays single-concern, multi-skill requests route via `using-erfana`.
- Adding hooks, agents, commands, or MCP servers to `plugin.json` without first updating CLAUDE.md, the verification gates, and CI.
- Declaring a hook in SKILL.md `hooks:` frontmatter. Qwen Code's extension skill parser does not extract that field, so the hook runs on one of the two supported hosts and looks fine on the maintainer's machine. Register it in `hooks/hooks.json` instead.
- Writing Claude tool-call syntax into a skill or agent **body** (`Bash(command="...")`, `Read(file_path="...")`). Those names do not exist on Qwen, so the body instructs the model to call a tool that is not there. Name the action instead; keep real shell commands verbatim and drop only the wrapper.
- Drifting a prose count claim from the filesystem when adding/removing skills, hooks, commands, plugin-root agents, or per-skill nested agents. Canonical count sites: the "What this is" summary above, `README.md`, `docs/architecture.md`, `MAINTAINER.md` "Plugin scope". Gate 15 catches drift.
- Using SSH-based marketplace add in onboarding instructions (known Windows breakage).
- Bypassing the admin-merge gate for routine releases without a one-line rationale in the PR (audit trail).
- Running the Modernize operation without appending its row to [`docs/modernization-registry.md`](docs/modernization-registry.md) – not Gate-enforced, discipline by convention.
- Mandating "validate after every step" rituals in skill bodies – Opus 4.7+ and Claude 5 models self-verify (and over-verify when told to); validate only irreversible-side-effect steps (file writes, agent-file creation, breaking changes). **Carve-out:** this bans per-micro-step ritual, not phase-boundary outputs – a skill's declared quality gates, the `AskUserQuestion` calls that satisfy them, the turn-ending handoffs that satisfy them (a gate that prints a command for the user to run and then ends the turn, waiting on the user's result), its declared output artifacts, and its progress-tracking advance are required deliverables, not ceremony.
- Letting a skill invoke another skill or a slash command. A skill that needs one prints the command and ends the turn so the user runs it: invoking it re-enters skill-level work, and `/erfana:lens-review` in particular fans out up to ten reviewers into the caller's context. Worked example of *satisfying* this rule the other way: rule 15 of `skills/managing-issues/SKILL.md`, whose QG-4a / QG-11a checkpoints run their reviews as embedded agent fan-outs directly in-context (no turn boundary, no user hand-off) rather than by printing a command and ending the turn.
- Hand-editing [`docs/skill-registry.md`](docs/skill-registry.md) instead of regenerating it with `scripts/gen-skill-registry.sh` – it is a generated artifact, the next regeneration discards manual edits, and Gate 18 hard-fails any date written ahead of git.
- Ignoring a Gate 18 staleness warning through a release – Step 3 of the release process exists to clear it; shipping a lagging registry is the one case where the warning becomes a real defect.
- Authoring soft-quantifier prose ("~30-50 words", "approximately", "aim for") in shipped command/skill bodies without a hard ceiling or measurable invariant – pair every soft target with a hard ceiling (the v4.2.10 status-command lesson).

## Repository workflow

- Two long-lived branches: **`main`** (default branch – what the marketplace serves; protected by the `main-protection` ruleset: signed commits, code-owner review, and passing `verify.yml` status checks) and **`develop`** (integration branch; CI-gated via `verify.yml`, no branch protection). `verify.yml` runs on push and PR to both branches. Feature work goes on `feature/...` branches cut from `develop` and PR'd back into `develop`; a release promotes `develop` into `main` via PR, then tags `main`. Conventional Commits: `feat(...)`, `fix(...)`, `docs(...)`, `chore(...)`. Remote: `github.com/qodeca/erfana-skills`.

### Pre-commit checklist

1. **Gates pass locally** – `bash scripts/run-all-gates.sh` and `claude plugin validate .` both report success.
2. **Feature branch in use** – `git branch --show-current` is neither `main` nor `develop`. Skill, agent and infra changes go through `feature/...` cut from `develop` and merge into `develop` via PR; `main` receives only release PRs (`develop` -> `main`) and emergency fixes.
3. **Registry regenerated separately** – if the change touches anything under `skills/`, do NOT regenerate `docs/skill-registry.md` in the same PR (see the squash caveat above).

### Atomic commits

Each commit's diff stays within one of `{skill-content, agent-content, infrastructure}`. A commit touching both a skill body and the gate scripts that validate it should be split – infrastructure changes affect every skill, skill content does not.

Two rulings that come up:

- **A hook-registration move is one commit, not two.** Moving a hook out of SKILL.md frontmatter into `hooks/hooks.json` changes a skill body and the hook bundle together, and Gate 15 compares the hook count against prose – so splitting it leaves the branch red either way round. Strip the frontmatter in a skill-content commit first, then move the scripts, register them and update every count string in one infrastructure commit.
- **`commands/` is infrastructure.** A slash command is plugin wiring, not skill content, even though its body reads like prose.

## Known caveats

Accepted risks and their rationale live in [`docs/known-caveats.md`](docs/known-caveats.md) – the single running record, including every staged-rollout override. Read it before a release; do not restate or tally its entries here.
