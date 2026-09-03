<div align="center">

# Erfana Skills

**An open-source orchestration toolkit for Claude Code and Qwen Code (GPL-3.0-only).**

by [Qodeca](https://github.com/qodeca)

[![CI](https://github.com/qodeca/erfana-skills/actions/workflows/verify.yml/badge.svg)](https://github.com/qodeca/erfana-skills/actions/workflows/verify.yml)
[![License: GPL-3.0-only](https://img.shields.io/badge/license-GPL--3.0--only-blue.svg)](LICENSE)
[![Latest release](https://img.shields.io/github/v/release/qodeca/erfana-skills)](https://github.com/qodeca/erfana-skills/releases/latest)
![Claude Code plugin](https://img.shields.io/badge/Claude_Code-plugin-555)
![Qwen Code compatible](https://img.shields.io/badge/Qwen_Code-compatible-555)
[![Made by Qodeca](https://img.shields.io/badge/made_by-Qodeca-1f2937)](https://github.com/qodeca)

</div>

Manage Claude Code agents and skills, GitHub issues, consulting reports, articles, and 4-tier specifications from inside your coding agent. 6 orchestration skills plus a process skill, a verification skill, and 87 shared agents, all delegating substantive work via the `Task` tool.

It ships as a Claude Code plugin and also runs on **Qwen Code**, which converts Claude Code plugins at install time – one repository, one release, two hosts. What differs between them is recorded in [`docs/hosts.md`](docs/hosts.md).

Free and open source under the [GNU General Public License v3.0 only](LICENSE). Contributions are welcome – see [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md); they require agreeing to the project [Contributor License Agreement](CLA.md) (by opening a PR you agree to its terms). To report a vulnerability, follow [`SECURITY.md`](SECURITY.md). "Erfana" and "Qodeca" names and logos are trademarks; the license does not grant rights to them – see [`TRADEMARKS.md`](TRADEMARKS.md). "Claude" and "Claude Code" are trademarks of Anthropic; Erfana Skills is an independent, third-party plugin and is not affiliated with, sponsored by, or endorsed by Anthropic. "GitHub" and "GitHub Actions" are trademarks of GitHub, Inc.; Erfana Skills integrates via their public API and is not affiliated with or endorsed by GitHub or Microsoft. "Playwright" is a trademark of Microsoft Corporation; Erfana Skills ships agents that author and review Playwright tests and is not affiliated with or endorsed by Microsoft. "Qwen" and "Qwen Code" are trademarks of their respective owners; Erfana Skills is an independent, third-party plugin that Qwen Code can convert and run, and is not affiliated with or endorsed by them.

---

## What's in this plugin

### Orchestration skills

| Skill | What it does | Triggers |
|---|---|---|
| `erfana:managing-agents` | Lifecycle management for Claude Code agents – research, design, validation phases. Ships its own validation/review checklists. | "create agent", "review agent", "modify agent" |
| `erfana:managing-articles` | End-to-end medium-form article authoring (research → outline → draft → review → publish), bilingual Polish/English. Delegates to 5 plugin-root `article-*` agents. | "write article", "research article", "publish article" |
| `erfana:managing-issues` | Full GitHub-issue lifecycle: create issues, implement them through phased quality gates, and review code or PRs. Runs on `main`-default repos, stack-agnostic, with a skill-wide untrusted-data boundary and confirm-before-destructive git ops. The Implement operation is **autonomous** – it designs, builds, reviews, and fixes the technical work without blocking on intermediate approvals, resolving every architecture/technical decision by best practice plus judgment. Its reviews are **embedded**: it fans out its own reviewer agents (no manual `/erfana:lens-review`), auto-fixes CRITICAL/HIGH findings inline, and routes MEDIUM/LOW to a judge. It asks a human only to clarify requirements (business-analysis phase), to accept at UAT, and to confirm the final git actions – and it still **refuses a detected headless run**, so it is not safe for a `claude -p` / CI session. It saves its progress to one comment on the issue (after asking, on a public repo; without a prompt but announced in one line, on a private one) so an interrupted run can resume. See [`docs/architecture.md`](docs/architecture.md). | "create issue", "implement issue", "review code", "review PR" |
| `erfana:managing-reports` | Professional consulting reports with Pyramid Principle, SCQA, Five Cs framework, sentence-case validation. 11 internal validation agents. | "create report", "review report", "validate report" |
| `erfana:managing-skills` | Lifecycle management for Claude Code skills following Anthropic best practices. Includes the **Modernize operation** (v4.2.0+) that applies Claude 5 patterns to existing skills. Every operation opens with a coverage-map requirements interview – Create always interviews; Modify/Review/Modernize gate first and interview on yes. | "create skill", "review skill", "modify skill", "modernize skill", "apply Claude 5 patterns" |
| `erfana:managing-specs` | 4-tier specification management: T1 issue, T2 spec, T3 lite, T4 standard. Delegates to plugin-root `spec-*` agents, with trust-boundary controls and a transactional single-writer registry (schema v3, auto-migrated on first touch). See [`docs/architecture.md`](docs/architecture.md). | "create spec", "validate spec", "T3 lite spec", "T4 standard" |

### Process skills

| Skill | What it does | Triggers |
|---|---|---|
| `erfana:grill-me` | One-at-a-time Socratic interrogation of a plan or design – walks the decision tree, recommends an answer per branch, explores the codebase first when the answer is already there. Since v6.6.0 the interview is sized to the plan – three depths selected from blast radius, reversibility, cost of being wrong, and consumers, with skips batched into one stated sizing statement rather than one question each. Imported from upstream `superpowers:grill-me` in v4.2.3. | "grill me", "quick grill", "grill me lightly", "stress-test this plan", "interview me about this", "challenge my plan", "poke holes in this", "walk the decision tree" |

### Verification skills

| Skill | What it does | Triggers |
|---|---|---|
| `erfana:fact-checking` | Validates markdown analysis documents against source materials (interviews, vendor docs, knowledge-base) to catch AI hallucinations – extracts atomic factual claims, traces each to its source passage, classifies findings by severity (Critical / Error / Warning / Info), and applies user-approved corrections. Five-phase orchestrator (Setup → Extraction → Verification → Interactive review → Fix application) backed by four `fc-*` plugin-root agents. Manual-only via `/erfana:fact-checking <target-file>`; not auto-discovered. Treats every ingested document as untrusted data, reconciles parallel verification by claim id, and anchors fixes on verbatim text. Migrated from a Qodeca consulting project, Modernize-passed in v4.2.7, lens-review-hardened in v4.6.0. | "fact-check this document", "verify against sources", "validate analysis", "check for hallucinations", "verify document" |

### Bootstrap and shared agents

| Component | What it does |
|---|---|
| `using-erfana` | Bootstrap. Lists available skills, establishes the 1% rule, routes to the right sub-skill. Loads automatically. |
| `agents/` (87 shared agents) | Shared agent pool the orchestration skills delegate to via the `Task` tool. Prefix breakdown: `spec-` (23), `mi-` (13), `ms-` (9), `ma-` (7), `article-` (5), `e2e-` (4), `fc-` (4), `release-` (2), `grill-` (1), UI/UX (4), tech-domain (6), generic (9). |

### Safety hooks (v4.1+)

Six hooks run silently in the background once the plugin is enabled, providing a project-agnostic safety net:

| Hook | When | What it does |
|---|---|---|
| `bash-safety` | Before any Bash tool call | Blocks destructive shell patterns – `rm -rf` of system/home dirs, force-push to protected branches, IMDS metadata exfiltration, privilege escalation (`sudo`/`doas`), `tar --absolute-names`, `curl|bash` and process-substitution variants, cloud teardown commands, persistence backdoors. Pattern set informed by 2025-2026 agent self-deletion incidents and CVE-2025-54794/-54795. |
| `secret-detector` | Before Write/Edit/MultiEdit | Blocks ~20 secret/token patterns before they hit disk – AWS, OpenAI, Anthropic, GitHub, GitLab, Hugging Face, Sentry, Postman, Slack, npm, Stripe, Google, Azure, database URIs, JWTs, PEM keys. Skips test fixtures, examples, markdown docs. |
| `post-compact-reminder` | After context compaction | Re-injects load-bearing facts (temporal awareness, honesty discipline, verification rules, agent delegation) plus the current git branch + status snapshot. |
| `verify-completion` | When the agent considers stopping | Asks the agent to keep working when it claims success without citing executed tests, exit codes, gate output, or screenshots. v4.2.9+ allowlist: messages carrying the `<!-- erfana:status-template -->` sentinel emitted by the status commands bypass the check; Gate 16 enforces sentinel symmetry across the two command files and the hook. Falls back to the unstripped body when the reply has an odd number of code fences so success claims after an unclosed fence stay visible. |
| `grill-guard` | When the agent considers stopping | Blocks one stop attempt while `grill-me`'s open-marker sentinel is still in the reply – a backstop for the coverage-map interview, not the protocol itself. |
| `ms-grill-guard` | When the agent considers stopping | The same, for `managing-skills`' requirements interview and its own sentinel. |

The first four are the project-agnostic safety net – no personal style preferences. The two interview guards are erfana-specific and fire only while an interview marker is open. They activate only after the next Claude Code session restart following plugin install or update.

**Cross-platform (v4.2.20+).** Each hook ships a `.sh` (macOS/Linux) and a `.ps1` (Windows) sibling, run through the `dispatch.sh` launcher so the safety net works on native Windows too (where Git Bash ships without `jq`). The mechanism and the one uncovered case (a Windows host with no Git Bash) are documented in [`docs/architecture.md`](docs/architecture.md).

**Interview guards.** Two of the six hooks belong to a skill rather than to the safety net: `grill-guard` (for `grill-me`, v6.2.0+) and `ms-grill-guard` (for `managing-skills`). Each nudges once when an interview is still open – that is, while the skill's open-marker sentinel is present in the reply. Since v7.1.0 both are registered in `hooks/hooks.json` like every other hook, not in the skill's SKILL.md `hooks:` frontmatter, because Qwen Code does not read that frontmatter and a skill-scoped registration would have been dead on one of the two supported hosts (see [`docs/hosts.md`](docs/hosts.md)). The sentinel alone scopes them to a live interview. Validated by Gate 16 fixtures plus a guard-drift check.

### Slash commands

| Command | What it does |
|---|---|
| `/erfana:doc-update` | Refreshes project documentation against the current state of the code – detects the change set from the working tree, sweeps the whole doc surface (`docs/`, `README`, `CHANGELOG`, `CLAUDE.md` / `AGENTS.md`, API specs, ADRs), and evicts status/changelog content into its home docs. Takes no git action by default; deletions and new files are confirmed via `AskUserQuestion`. Flags: `path-or-glob`, `--dry-run`, `--offline`, `--commit` / `--push`. Full contract: [`commands/doc-update.md`](commands/doc-update.md). |
| `/erfana:project-status` | One-shot Pyramid-Principle project-status brief for a Product Owner / PM / BA audience – three axes (what we worked on, what we accomplished, where we landed) plus a recommended next step, grounded in git and GitHub state. Read-only, no side effects. Useful when context-switching across many Claude Code tabs. Full contract: [`commands/project-status.md`](commands/project-status.md). |
| `/erfana:session-status` | The same Pyramid-Principle brief scoped to the current Claude Code session – same PO/PM/BA audience and three axes, sourced from the in-context conversation with a light git probe. Read-only; use it after a context compaction or when returning to a long-running tab. Full contract: [`commands/session-status.md`](commands/session-status.md). |
| `/erfana:explain-issue` | Translates a single GitHub issue into a Product Owner / PM / BA brief (accepts a bare number, `#N`, or full URL). Pulls the issue, comments, linked PRs, and referenced files/specs to ground the translation, but stays purely descriptive – no suggested next step. Non-interactive, read-only. Full contract: [`commands/explain-issue.md`](commands/explain-issue.md). |
| `/erfana:lens-review` | Researched multi-lens code review over any target – `/erfana:lens-review <path \| #PR \| "description"> [--lens a,b,c] [--out file.md]`. Fans out reviewers (up to 10, chosen at runtime), each grounded in cited best practices from the last ~12 months, then returns one severity-ranked, plain-language report (PM/PO-facing, with full technical detail kept for engineers). Manual trigger only; distinct from `/review` by its live research and any-target scope. Full contract: [`commands/lens-review.md`](commands/lens-review.md). |

Skills auto-discovered from `skills/*/SKILL.md`; agents from `agents/*.md` (plugin root) and `skills/<skill>/agents/*.md` (skill-internal); hooks from `hooks/hooks.json`; commands from `commands/*.md`. Every skill is self-contained – there is no shared content bundle.

> **Heads-up: generic-name agents.** The plugin ships ~15 agents with generic names – any agent in `agents/` whose name does not start with a team prefix (`mi-`, `ma-`, `ms-`, `spec-`, `e2e-`, `release-`, `nest-`, `react-`, `grill-`, `article-`, `fc-`). At the v4.0.0 release these include `architecture-reviewer`, `bug-investigator`, `code-reviewer`, `commit-writer`, `refactor-advisor`, `security-auditor`, `software-developer`, `solution-architect`, `solution-reviewer`, `technical-architect`, `test-writer`, `ui-designer`, `ui-reviewer`, `ux-designer`, `ux-reviewer`. They may collide with built-in Claude Code agents or with agents shipped by other plugins (`superpowers:*`, `feature-dev:*`, etc.). Last-loaded wins; behavior in mixed-plugin environments is non-deterministic. To target this plugin's copies specifically, prefer prefix-named agents in the `Task` tool (e.g. `mi-codebase-explorer`, `ma-designer`). Full security implications including the highest-trust shadow target are documented in `SECURITY.md`.

---

## Confidentiality

Prompts you send through any skill or agent in this plugin are forwarded to Anthropic's Claude API for processing. Anthropic acts as a sub-processor of any data contained in your prompts.

Treat the plugin like any other AI tool routed through external infrastructure:

- **Do not paste**: client-confidential data, customer PII, financial figures marked sensitive, unreleased product specs, internal credentials, or anything covered by an NDA you signed.
- **For sensitive work**, review the agent prompts before granting tool permissions in your session.

Review Anthropic's data-usage and privacy terms before routing sensitive material through any Claude-based tool, and treat the conservative defaults above as policy.

---

## Install

The same repository installs on both supported hosts. Nothing is host-specific in the package: Qwen Code converts the Claude Code plugin on your machine at install time, from the same tag Claude Code users install.

### Claude Code

Installing from a **public** marketplace needs no GitHub token or special access.

#### 1. Add the marketplace and install

Inside Claude Code:

```
/plugin marketplace add qodeca/erfana-skills
/plugin install erfana@erfana-skills
```

The marketplace registers under the name `erfana-skills` (matches `marketplace.json`). The install line uses `erfana@erfana-skills` – the plugin name `@` the marketplace name.

#### 2. Verify

```
/plugin list
```

You should see `erfana@erfana-skills` enabled. Then type a trigger phrase like:

> create an issue for the login bug

`erfana:managing-issues` should activate.

### Qwen Code

From a shell:

```bash
qwen extensions install qodeca/erfana-skills:erfana
```

Accept the install prompt Qwen shows, then verify with `qwen extensions list`. There is no second package, no second manifest and no build step – the installer reads this repository's `.claude-plugin/marketplace.json` and converts skills, agents and commands as it copies them.

Two things read differently there: slash commands register **unnamespaced** (`/lens-review`, not `/erfana:lens-review`), and a few frontmatter fields the converter does not carry over are simply ignored. Tested against Qwen Code 0.22.3. The full list of what works, what degrades, and what is not verified yet lives in [`docs/hosts.md`](docs/hosts.md) – including the honest caveat that no erfana skill has been run end to end inside a Qwen session, so the checks that exist prove the loader and the conversion, not the executor.

### Invocation forms – bare vs. namespaced

Both forms resolve to the same skill:

```
/erfana:managing-issues     # canonical, namespaced (use this)
/managing-issues            # bare form, also works
```

Use the **namespaced form** in shared docs, screenshots, and team conversations. The bare form is a built-in Claude Code convenience – it exists for autocomplete brevity but collides with personal or other-plugin skills of the same name. The `/erfana:` prefix prevents that collision and makes the source explicit.

Tracked upstream: [anthropics/claude-code#43695](https://github.com/anthropics/claude-code/issues/43695) requests a `require-namespace: true` flag to remove the bare form. When that ships, this plugin will adopt it.

On Qwen Code the choice does not exist – its converter registers only the bare form, so a slash command there is `/doc-update`, never `/erfana:doc-update`. See [`docs/hosts.md`](docs/hosts.md).

---

## How updates work

### Qwen Code

```
qwen extensions update erfana
```

Or `qwen extensions update --all`. Qwen installs erfana from the **latest GitHub release tag**, not from a branch – `qwen extensions list` shows the tag it resolved – so a change reaches you when it is released, not when it is merged.

### Claude Code

Third-party marketplaces like this one have **auto-update off by default** – only Anthropic's own marketplaces auto-update without asking ([docs](https://code.claude.com/docs/en/discover-plugins#configure-auto-updates)). So by default you pull new releases manually:

```
/plugin marketplace update erfana-skills
/plugin update erfana@erfana-skills
```

(After `/plugin update`, restart Claude Code to apply.)

To have releases picked up automatically at session start instead, opt in once: run `/plugin`, open the **Marketplaces** tab, select `erfana-skills`, and choose **Enable auto-update**. Org admins can set `"autoUpdate": true` on the marketplace's `extraKnownMarketplaces` entry in managed settings to enable it for everyone.

If still stale, clear the cache and restart Claude Code:

```bash
rm -rf ~/.claude/plugins/cache/
```

SSH-based marketplace URLs are not recommended (known Windows issue).

---

## Pin to a specific version (optional)

If you turned on auto-update and need stability for a critical project, pin to a specific version:

```
/plugin install erfana@erfana-skills@v6.4.0   # for example – pick the version you want
```

Replace `v6.4.0` with whichever release you want to lock to. A pinned version is never auto-updated. To upgrade later, run the same command with a newer tag and restart Claude Code.

Use case: you are mid-flight on an issue implementation, a new version drops, and you do not want trigger-phrase behavior to shift under you. Pin until you are done, then unpin (`/plugin install erfana@erfana-skills` without a `@vX.Y.Z` suffix).

---

## Typical workflows

Skills compose. The most common chains:

**Feature from idea to merged code**

1. `erfana:managing-specs` – right-size the requirements (T1 issue through T4 standard spec)
2. `erfana:managing-issues` create – file the issue against the spec
3. `erfana:managing-issues` implement – autonomous build through 13 phased quality gates, embedded reviews, human only at requirements, UAT and the final git confirm

Sample opener: *"Spec out the new export feature, then create and implement the issue."*

**Stress-test a plan before implementing** (process skill, v4.2.3+)

1. `erfana:grill-me` – Socratic walk through the decision tree; one question at a time, recommended answer per branch, explores the codebase before asking when the answer is already encoded there. Depth scales to the plan: a small reversible change gets a short pass, anything with a one-way door gets the full sweep
2. Downstream skill of choice – `erfana:managing-issues` create / `erfana:managing-specs` (T1–T4), depending on what the locked plan is meant to produce

Sample opener: *"Grill me on this rollout plan before we build it – I want to ship X by Friday, here's my draft approach."*

**Publish a researched article**

1. `erfana:managing-articles` – research, outline, draft, review, revise, publish (bilingual Polish/English supported)
2. `erfana:fact-checking` – trace every factual claim in the draft back to a source passage before it ships

Sample opener: *"Write a 2500-word article comparing managed Postgres providers, then fact-check it."*

**Why workflows matter**: each skill works alone, but locking requirements first and verifying claims last catches problems that are expensive to fix after delivery.

---

## Troubleshooting

**`/plugin marketplace add` fails or hangs**
Check network access to `api.github.com` and `raw.githubusercontent.com` (a corporate proxy may block them – see the proxy note below). The public marketplace needs no token.

**Auto-updates haven't appeared in 2+ sessions**
Force a refresh: `/plugin marketplace update erfana-skills`, then `/plugin update erfana@erfana-skills`, then restart Claude Code. If still stale, clear the cache: `rm -rf ~/.claude/plugins/cache/` and restart.

**`/plugin install` reports "marketplace not found"**
The registered marketplace name comes from `marketplace.json` (`erfana-skills`). Make sure step 3 ran successfully – `/plugin marketplace list` should show it.

**Trigger phrases don't activate the right sub-skill**
Confirm the plugin is enabled (`/plugin list`) and try a trigger phrase from the skill table above. Each sub-skill has its own keyword set – if your phrasing is far from the listed triggers, name the artifact explicitly ("issue", "spec", "article", "report", "agent", "skill").

**`/erfana:managing-issues` and `/managing-issues` both appear in autocomplete**
Expected behavior. Plugin skills are registered at both the bare path (`/managing-issues`) and the namespaced path (`/erfana:managing-issues`) – see [Invocation forms](#invocation-forms--bare-vs-namespaced). Use the namespaced form to avoid collisions with personal or other-plugin skills.

**Plugin updated but Claude Code still uses old behavior**
Force a refresh: `/plugin marketplace update erfana-skills`, then `/plugin update erfana@erfana-skills`, then restart Claude Code. If still stuck, clear the cache: `rm -rf ~/.claude/plugins/cache/` and restart Claude Code.

**Marketplace add hangs / silently fails behind a corporate proxy**
If your network blocks `api.github.com` or `raw.githubusercontent.com`, marketplace operations fail without a clear error. Ask IT to allowlist both. As a workaround, `git clone` the repo locally and register it as a local-path marketplace: `/plugin marketplace add /absolute/path/to/erfana-skills`. Pull updates manually with `git pull` + `/plugin marketplace update erfana-skills`.

**`qwen extensions install` reports the extension was not found**
Check the source spelling – it is `qodeca/erfana-skills:erfana`, the repository followed by the plugin name inside its marketplace, not the repository alone. The install is a network operation against GitHub, so the proxy note above applies here too, and Qwen shows a security prompt that has to be accepted before anything is written to `~/.qwen/extensions/`.

**Slash commands appear unnamespaced (`/doc-update`, not `/erfana:doc-update`)**
Expected on Qwen Code – its converter registers commands without the plugin namespace. Use the bare form there. If a name collides with a Qwen builtin, the builtin takes the bare name and the erfana command is renamed to `erfana.<name>` rather than dropped; see [`docs/hosts.md`](docs/hosts.md).

**Safety hooks do not fire on Qwen Code**
First check that [`jq`](https://jqlang.github.io/jq/) is installed and on `PATH` – most hooks parse their JSON payload with it, and the `dispatch.sh` launcher skips a hook it cannot run rather than blocking your work, printing a diagnostic to stderr. The hooks fail open by design, so a missing `jq` looks like silence, not an error. `hooks/hooks.json` needs no Qwen-specific declaration; if `jq` is present and hooks still do nothing, restart the Qwen session so the extension is re-read.

**Skill scope precedence**
If you have a personal or project skill that shares a name with one in this plugin (e.g. you also have `~/.claude/skills/managing-issues/SKILL.md`), Claude Code resolves in order: project (`.claude/skills/`) → personal (`~/.claude/skills/`) → plugin (`erfana@erfana-skills`). To force the plugin version, rename your personal copy or add it to a different namespace.

**Local development (testing changes before they hit main)**
Clone the repo locally, then register it as a local-path marketplace:
```
/plugin marketplace add /absolute/path/to/your/clone
/plugin install erfana@erfana-skills
```
Iterate on your fork. When ready, push a `feature/...` branch (cut from `develop`) and open a PR against `develop`. Once it ships in a release, switch back to the published marketplace: `/plugin marketplace remove erfana-skills` then `/plugin marketplace add qodeca/erfana-skills` and `/plugin update erfana@erfana-skills`.

---

## Security

To report a vulnerability, follow [`SECURITY.md`](SECURITY.md) – please use private disclosure, not a public issue. Supported versions and the disclosure process are documented there.

---

## License

Copyright © 2025-2026 Qodeca sp. z o.o.

Licensed under the [GNU General Public License v3.0 only](LICENSE) (`GPL-3.0-only`). You are free to use, study, share, and modify it; distributed derivatives must remain under the same license and ship their source. The license covers code, documentation, and bundled assets – it does **not** grant rights to the "Erfana" or "Qodeca" names or logos (see [`TRADEMARKS.md`](TRADEMARKS.md)). Per-file licensing follows the [REUSE](https://reuse.software) specification; run `reuse lint` to verify. Contributions are accepted under the project [Contributor License Agreement](CLA.md) (see [`CONTRIBUTING.md`](CONTRIBUTING.md)).

---

## Related projects

Erfana Skills is part of the **Erfana** family from Qodeca:

- **[Erfana](https://github.com/qodeca/erfana)** – the agent-native Markdown workspace (desktop app). It is a separate project; this repository is the coding-agent plugin, not the app.
- **[8cli](https://github.com/qodeca/8cli)** – an AI-first, JSON-native CLI for remotely managing n8n instances.

Built by **[Qodeca](https://qodeca.com)** – [qodeca.com](https://qodeca.com) · [LinkedIn](https://www.linkedin.com/company/qodecasoftwaredevelopment) · [hi@qodeca.com](mailto:hi@qodeca.com)

---

## Maintainer info

Repository: `github.com/qodeca/erfana-skills`
Maintainer: Marcin Obel ([@marcinobel](https://github.com/marcinobel)). Governance: [`GOVERNANCE.md`](GOVERNANCE.md). Support: [`SUPPORT.md`](SUPPORT.md).

> Note: the `v1.0.0` git tag exists but is not installable (it predates a `marketplace.json` schema fix shipped in `v1.0.1`). If you pin to an exact version, start from `v1.0.1` or later.
