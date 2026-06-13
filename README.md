# erfana toolkit for Claude Code

An open-source Claude Code toolkit (GPL-3.0-only). Two domains in one plugin:

- **Design.** Build production-grade design artifacts directly inside Claude Code: clickable UI prototypes, 1920×1080 slide decks (HTML / PDF / editable PPTX), MP4 / GIF motion graphics, vertical print-grade infographics, and 5-dimension design critiques.
- **Orchestration.** Manage Claude Code agents and skills, GitHub issues, consulting reports, articles, and 4-tier specifications. 6 orchestration skills plus 87 shared agents, all delegating substantive work via the `Task` tool.

Free and open source under the [GNU General Public License v3.0 only](LICENSE). Contributions are welcome — see [`CONTRIBUTING.md`](CONTRIBUTING.md), [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md), and [`SECURITY.md`](SECURITY.md). "erfana" and "Qodeca" names and logos are trademarks; the license does not grant rights to them — see [`TRADEMARKS.md`](TRADEMARKS.md).

---

## What's in this plugin

### Design skills

| Skill | What it does | Triggers |
|---|---|---|
| `erfana:design-direction` | The brief is vague – recommends 3 differentiated philosophies from a 20-school library, shows prebuilt samples, generates 3 visual demos to compare. **Run this first** when no visual direction is set. | "what style should I use", "recommend a style", "I don't know what style", "design advisor", "make it look good" |
| `erfana:design-prototype` | Hi-fi clickable UI prototypes – iOS, Android, web, desktop. Single-file HTML, real device frames, real images, Playwright-verified. | "build a prototype", "iOS prototype", "Android prototype", "app mockup", "clickable design", "hi-fi mockup" |
| `erfana:design-slides` | 1920×1080 HTML presentation decks with PDF + editable PPTX export. Multi-file aggregator for ≥10 pages, single-file deck for ≤10 pages. | "design a deck", "design a slide deck", "pitch deck", "keynote", "PPT", "editable PPTX" |
| `erfana:design-motion` | Timeline-driven animations exported as MP4 (25fps base, 60fps interpolated) or palette-optimized GIF. Optional BGM + SFX with frequency separation. Watermark: `Created with erfana`. | "animate this", "motion design", "export MP4", "export GIF", "60fps video", "motion graphics" |
| `erfana:design-infographic` | Vertical (1080×1920) print-grade data visualizations. Honest placeholders over fabricated numbers. | "infographic", "data visualization", "data viz", "vertical infographic", "chart design" |
| `erfana:design-review` | 5-dimension critique of completed design work – Keep / Fix / Quick Wins. Severity-tagged, implementable feedback. | "design review", "critique", "rate this design", "score this", "expert review" |

### Orchestration skills

| Skill | What it does | Triggers |
|---|---|---|
| `erfana:managing-agents` | Lifecycle management for Claude Code agents – research, design, validation phases. Ships its own validation/review checklists. | "create agent", "review agent", "modify agent" |
| `erfana:managing-articles` | End-to-end medium-form article authoring (research → outline → draft → review → publish), bilingual Polish/English. Delegates to 5 plugin-root `article-*` agents. | "write article", "research article", "publish article" |
| `erfana:managing-issues` | Full GitHub-issue lifecycle: create, multi-phase implement, review code. **Create operation hardened in v4.2.13** — 3 single-responsibility agents, injection-safe `gh issue create` (`--body-file` via temp-file, no inline heredoc), GitHub Issue Forms templates, structured approve/edit/cancel gate, systemic AskUserQuestion-in-subagent fix on `mi-requirements-analyzer`. **Whole-skill hardening in v4.2.19** — auto-detected base branch (runs on `main`-default repos, no longer `develop`-only), stack-agnostic toolchain detection (no longer npm/Electron-bound), skill-wide untrusted-data boundary plus a fully sanitized `mi-issue-displayer`, fail-closed QG-7 secret gate, confirm-before-destructive git ops, issue-comment-based resumable run state. | "create issue", "implement issue", "review code", "review PR" |
| `erfana:managing-reports` | Professional consulting reports with Pyramid Principle, SCQA, Five Cs framework, sentence-case validation. 11 internal validation agents. | "create report", "review report", "validate report" |
| `erfana:managing-skills` | Lifecycle management for Claude Code skills following Anthropic best practices. Includes the **Modernize operation** (v4.2.0+) that applies Opus 4.7 patterns to existing skills. | "create skill", "review skill", "modify skill", "modernize skill", "apply 4.7 patterns" |
| `erfana:managing-specs` | 4-tier specification management: T1 issue, T2 spec, T3 lite, T4 standard. Delegates to 23 plugin-root `spec-*` agents. **Hardened in v5.0.0** — trust-boundary controls, a transactional single-writer registry (reserve/confirm/fail saga), and registry schema v3; an existing `registry.json` is auto-migrated on first touch with the original saved as `registry.json.backup`. | "create spec", "validate spec", "T3 lite spec", "T4 standard" |

### Process skills

| Skill | What it does | Triggers |
|---|---|---|
| `erfana:grill-me` | One-at-a-time Socratic interrogation of a plan or design – walks the decision tree, recommends an answer per branch, explores the codebase first when the answer is already there. Imported from upstream `superpowers:grill-me` in v4.2.3. | "grill me", "stress-test this plan", "interview me about this", "challenge my plan", "poke holes in this", "walk the decision tree" |

### Verification skills

| Skill | What it does | Triggers |
|---|---|---|
| `erfana:fact-checking` | Validates markdown analysis documents against source materials (interviews, vendor docs, knowledge-base) to catch AI hallucinations – extracts atomic factual claims, traces each to its source passage, classifies findings by severity (Critical / Error / Warning / Info), and applies user-approved corrections. Five-phase orchestrator (Setup → Extraction → Verification → Interactive review → Fix application) backed by four `fc-*` plugin-root agents. Manual-only via `/erfana:fact-checking <target-file>`; not auto-discovered. Treats every ingested document as untrusted data, reconciles parallel verification by claim id, and anchors fixes on verbatim text. Migrated from a Qodeca consulting project, Modernize-passed in v4.2.7, lens-review-hardened in v4.6.0. | "fact-check this document", "verify against sources", "validate analysis", "check for hallucinations", "verify document" |

### Bootstrap and shared agents

| Component | What it does |
|---|---|
| `using-erfana` | Bootstrap. Lists available skills, establishes the 1% rule, dispatches design-vs-orchestration. Loads automatically. |
| `agents/` (87 shared agents) | Shared agent pool the orchestration skills delegate to via the `Task` tool. Prefix breakdown: `spec-` (23), `mi-` (13), `ms-` (10), `ma-` (7), `article-` (5), `e2e-` (4), `fc-` (4), `release-` (2), UI/UX (4), tech-domain (6), generic (9). |

### Safety hooks (v4.1+)

Four hooks run silently in the background once the plugin is enabled, providing a project-agnostic safety net:

| Hook | When | What it does |
|---|---|---|
| `bash-safety` | Before any Bash tool call | Blocks destructive shell patterns – `rm -rf` of system/home dirs, force-push to protected branches, IMDS metadata exfiltration, privilege escalation (`sudo`/`doas`), `tar --absolute-names`, `curl|bash` and process-substitution variants, cloud teardown commands, persistence backdoors. Pattern set informed by 2025-2026 agent self-deletion incidents and CVE-2025-54794/-54795. |
| `secret-detector` | Before Write/Edit/MultiEdit | Blocks ~20 secret/token patterns before they hit disk – AWS, OpenAI, Anthropic, GitHub, GitLab, Hugging Face, Sentry, Postman, Slack, npm, Stripe, Google, Azure, database URIs, JWTs, PEM keys. Skips test fixtures, examples, markdown docs. |
| `post-compact-reminder` | After context compaction | Re-injects load-bearing facts (temporal awareness, honesty discipline, verification rules, agent delegation) plus the current git branch + status snapshot. |
| `verify-completion` | When the agent considers stopping | Asks the agent to keep working when it claims success without citing executed tests, exit codes, gate output, or screenshots. v4.2.9+ allowlist: messages carrying the `<!-- erfana:status-template -->` sentinel emitted by the status commands bypass the check; Gate 16 enforces sentinel symmetry across the two command files and the hook. Falls back to the unstripped body when the reply has an odd number of code fences so success claims after an unclosed fence stay visible. |

All four are project-agnostic – no personal style preferences. They activate only after the next Claude Code session restart following plugin install or update.

**Cross-platform (v4.2.20+).** Each hook ships a `.sh` (macOS/Linux) and a `.ps1` (Windows) implementation. Every `hooks.json` command runs through `dispatch.sh`, a small launcher that executes the PowerShell sibling on Windows (via `powershell.exe`) or the bash sibling elsewhere – so the safety net works on native Windows, where Git Bash ships without `jq` and previously left the bash-only hooks silently inert. The one uncovered case is a Windows host with no Git Bash at all (Claude Code then runs hook commands under PowerShell, which cannot launch `bash dispatch.sh`); the mainstream Windows setup installs Git Bash alongside Claude Code.

### Slash commands

| Command | What it does |
|---|---|
| `/erfana:doc-update` | Refreshes project documentation against the current state of the code (v4.1+; v4.2.16+ safety/coverage/currency rewrite; v5.1.0+ status eviction + necessity prune). Detects the change set from the live working tree – uncommitted, staged, and base-branch (`git merge-base`) diffs, not a fixed commit window – then runs a full-repo sweep that the change set prioritises but does not limit. Discovers the whole documentation surface: `docs/` (root + nested), root and per-package `README`, `CHANGELOG`, `CLAUDE.md` / `AGENTS.md` (shim/symlink-aware), OpenAPI/Swagger specs (flagged regenerate-don't-edit), `CONTRIBUTING.md` / `.github/`, and ADRs. **Default run takes no git action** – edits are left in the working tree for your normal flow; opt-in `--commit` / `--push` stage only the doc files the run changed (never `commit -a`), refuse the default branch, and confirm before pushing. New files need consent and deletions are proposed via `AskUserQuestion`. From v5.1.0 it also evicts status/changelog content out of `CLAUDE.md` and agent files into their home docs (`CHANGELOG` / `ROADMAP` / `STATUS`, leaving a one-line reference) and runs a whole-file necessity audit over `CLAUDE.md`, agent files, and `docs/` guides (`CHANGELOG`, ADRs, and `README` exempt); every section/file removal is confirmed via `AskUserQuestion`, and `--allow-delete` auto-applies only provably-obsolete file deletions, never a necessity-removal. Flags: a `path-or-glob` scope, `--dry-run` (preview, writes nothing), and `--offline` / `--quick` (skip the online-research step). |
| `/erfana:project-status` | One-shot Pyramid-Principle project status executive brief, pitched at a Product Owner / PM / BA audience (v4.2.8+ stakeholder rewrite; v4.2.9+ adds dual-issue GH probe, sentinel, and DIP fix; v4.2.10+ adds hard length rule and mandatory Layer 2). Three axes – **what we worked on**, **what we accomplished**, **where we landed** – plus a two-layer recommendation (stakeholder milestone sentence + italicised `Suggested first step:` hint for Claude). v4.2.10+ tightens the discipline: every support bullet has a hard 55-word ceiling and the three bullets must stay within ±15 words of each other; Layer 2 is always emitted (no more "skip when caught up" carve-out – new rung 5 covers post-release / smoke / MAINTAINER-checklist follow-ups, rung 7 is the genuine empty case with Layer 2 still emitted as "open BACKLOG.md and pick the head item"). Adaptive scope (git + GitHub always; ROADMAP / BACKLOG / CLAUDE.md version banner / gate runner conditional) plus a `gh issue view` / `gh pr view` translation-fetch so any issue or PR mentioned in plain language is grounded in its real title/body. v4.2.9+ GitHub probe issues two `gh issue list` calls – one filtered to your assigned issues (your active todo), one with no assignee filter (full open-issue queue) – so "Where we landed" reports both counts and "Recommended next" can fall back to unassigned items when your queue is empty. Hard hallucination guards: source attribution, no acronym expansion without evidence, no evaluative adverbs without evidence, quantifier grounding, status-label criteria, date discipline, grounded issue/PR translations, banned narrative phrases, abstract inventory-negation rule (v4.2.9+; no hook implementation names in command prose per DIP), confidence-calibration headline when state is partial. Target ~175-220 words, hard cap 280. Output template ends with a mandatory invisible `<!-- erfana:status-template -->` sentinel that the Stop hook keys on. Read-only, no side effects. Useful when context-switching across many Claude Code tabs and you forget where each project sits. |
| `/erfana:session-status` | One-shot Pyramid-Principle summary of the current Claude Code session, same PO/PM/BA audience and structure as `project-status` (v4.2.8+ stakeholder rewrite; v4.2.9+ adds sentinel and abstract prose rule; v4.2.10+ adds hard length rule and mandatory Layer 2): three outcome-shaped axes (**what we worked on / what we accomplished / where we landed**), two-layer recommendation, identical hallucination guards including the abstract inventory-negation rule. v4.2.10+ enforces the same hard 55-word ceiling + ±15-word balance + always-emit Layer 2 rules; rung 5 covers post-release / smoke / spec-compliance follow-ups so the rung-6 caught-up case still emits a concrete pivot target or an explicit "save context and close the tab". Sources primarily from in-context conversation; light git probe (branch + last 3 commits with committer-date + dirty-file count) for grounding. Silent degradation when not in a repo. Target ~175-220 words, hard cap 280. Output template ends with the same `<!-- erfana:status-template -->` sentinel (Gate 16 verifies the literal matches across both command files and the hook). Read-only. Sibling to `/erfana:project-status` under the shared `*-status` namespace – use it after a context compaction or when returning to a long-running tab to refresh what was happening and what comes next. |
| `/erfana:explain-issue` | One-shot Pyramid-Principle brief that translates a single GitHub issue into Product Owner / Project Manager / Business Analyst language (v4.2.14+). Accepts the issue reference as a bare number, `#N`, or full GitHub URL; PR translation is reserved for a future sibling `/erfana:explain-pr` under the same `explain-*` namespace. Ships YAML frontmatter (`description`, `argument-hint`, scoped read-only `allowed-tools`) following the `lens-review` precedent and a trust model that treats every fetched body, comment, file slice, and spec slice as untrusted data – embedded instructions are surfaced as facts about the issue, never executed. **Deep input, narrow output:** pulls the issue payload + last 3 comments + linked PRs + files referenced in the body (capped) + spec IDs referenced in the body (capped) + commits matching `#N` when invoked inside the issue's repo, all feeding translation only; the brief itself stays a single PM/PO section with no engineering appendix. Classifier chain (labels → Conventional-Commits title prefix → body heuristic → default `question`) adapts the three support axis labels per type: bug uses `The problem / Impact / Where we are`, feature uses `The capability / Why it matters / Where we are`, refactor uses `What we're improving / Why it matters / Where we are`, question uses `What's being decided / What's at stake / Where we are`. **No `Suggested next step` line** – the stakeholder owns the action queue; the brief is purely descriptive (the explicit divergence from the `*-status` family). Hard hallucination guards inherited verbatim from `project-status` (source attribution, no acronym expansion without evidence, no evaluative adverbs without evidence, quantifier grounding, status-label criteria, banned narrative phrases, abstract inventory-negation rule, confidence-calibration headline when state is partial). Length is **adaptive**: at most 40% of the issue body word count, floor 120 words, hard cap 400 words; per-axis bullet hard ceiling 55 words with ±15-word balance (inherited from the v4.2.10 status-command length lesson). Coverage is hybrid: silent on full data, single italicised `_Data note: …_` footer on material gaps (gh error, empty body, unreadable file or spec, commit-probe skipped when invoked from a different repo); a catastrophic ground-loss case uses the `Issue #N – state unclear, partial signals available` headline variant. Non-interactive. Read-only (no file writes, no issue mutations). Output template ends with a mandatory invisible `<!-- erfana:explain-template -->` sentinel that the Stop hook keys on; Gate 16 enforces sentinel symmetry across this command file and the hook (and reserves the literal for future `explain-*` siblings). |
| `/erfana:lens-review` | Researched multi-lens code review (v4.2.11+). Fans out review subagents over a required target – `/erfana:lens-review <path \| #PR \| "description"> [--lens a,b,c] [--out file.md]` – each reviewing one lens (architecture, security, performance, UI, testing, …) against the newest best practices researched online, then collects every finding in the main context and presents one unified, severity-ranked report. The lens set, the subagent count (capped at 10), and the executor chosen per lens are decided at runtime from the target – no fixed catalog. It carries YAML frontmatter (`description`, `argument-hint`, scoped read-only `allowed-tools`) and a trust model that treats all target content, PR diffs, and fetched pages as untrusted data – embedded instructions are reported as findings, never acted on. Executor selection reuses `mi-agent-discoverer` + `mi-agent-matcher`, honoring the matcher's real contract by writing a transient per-run requirements file (one block per lens) and passing it via `phase_requirements_path` rather than inline: a strong match runs the specialist; a weak match, a matcher escalation, or a matcher / discoverer failure falls back to the built-in `general-purpose` agent (treated as web-capable) or direct catalog-keyword selection; ambiguity is auto-resolved (the command is non-interactive). Research is per-lens and strict: sources within ~12 months, every finding cited (URL + date or version), uncited or stale findings dropped, fetches limited to trusted domains. Web-capable executors self-research; executors without web tools (`code-reviewer`, `security-auditor`) get a `general-purpose` research pre-pass whose cited brief is injected (retry-then-reassign on failure) – no shipped agent is modified. A per-reviewer search budget, model-tiering for low-reasoning lenses, and an optional shared brief bound the cost. The main context validates each result against the finding contract, records failed or timed-out reviewers as failed lenses (never silently dropped), collapses cross-lens duplicates, and ranks findings blocker / major / minor / nit, then (v4.2.12) renders a PM / PO / semi-technical-facing plain-language report: a count headline plus a one-sentence bottom line, a single risk-only findings table (number, severity as Must-fix / Should-fix / Nice-to-fix / Cosmetic, area as a plain label plus the technical term in parentheses, plain "what it means"), and a technical subsection keyed by row number that keeps the full `file:line`, fix, and cited source for engineers and Claude Code – no finding-contract information dropped, only relocated. Output is read-only to chat – the validated `--out` file (repo-relative, no traversal, `.md`) and the transient matcher scratch file are the only writes; read-only for `general-purpose` reviewers is instruction + permission-prompt enforced, not tool-guaranteed. Manual trigger only. Distinct from the built-in `/review` and `/ultrareview`, and from `managing-issues` "review code", by its live best-practices research, runtime-decided lenses, and any-target scope. Was dogfood-reviewed by running its own protocol over its own file (3 blocker / 10 major findings applied before release). |

Skills auto-discovered from `skills/*/SKILL.md`; agents from `agents/*.md` (plugin root) and `skills/<skill>/agents/*.md` (skill-internal); hooks from `hooks/hooks.json`; commands from `commands/*.md`. Shared design content (workflow templates, content guidelines, asset bundle: 4 references / 37 SFX / 6 BGM / 24 showcases) lives in `skills/design-shared/`.

> **Heads-up: generic-name agents.** The plugin ships ~15 agents with generic names – any agent in `agents/` whose name does not start with a team prefix (`mi-`, `ma-`, `ms-`, `spec-`, `e2e-`, `release-`, `nest-`, `react-`). At the v4.0.0 release these include `architecture-reviewer`, `bug-investigator`, `code-reviewer`, `commit-writer`, `refactor-advisor`, `security-auditor`, `software-developer`, `solution-architect`, `solution-reviewer`, `technical-architect`, `test-writer`, `ui-designer`, `ui-reviewer`, `ux-designer`, `ux-reviewer`. They may collide with built-in Claude Code agents or with agents shipped by other plugins (`superpowers:*`, `feature-dev:*`, etc.). Last-loaded wins; behavior in mixed-plugin environments is non-deterministic. To target this plugin's copies specifically, prefer prefix-named agents in the `Task` tool (e.g. `mi-codebase-explorer`, `ma-designer`). Full security implications including the highest-trust shadow target are documented in `SECURITY.md`.

---

## Confidentiality

Prompts you send through any skill or agent in this plugin are forwarded to Anthropic's Claude API for processing. Anthropic acts as a sub-processor of any data contained in your prompts.

Treat the plugin like any other AI tool routed through external infrastructure:

- **Do not paste**: client-confidential data, customer PII, financial figures marked sensitive, unreleased product specs, internal credentials, or anything covered by an NDA you signed.
- **Default to public-grade brand context** when describing the design target (paste your published color palette, not a draft you have not shipped).
- **For sensitive design work**, work locally and skip this plugin.

Review Anthropic's data-usage and privacy terms before routing sensitive material through any Claude-based tool, and treat the conservative defaults above as policy.

---

## Install

Installing from a **public** marketplace needs no GitHub token or special access.

### 1. Add the marketplace and install

Inside Claude Code:

```
/plugin marketplace add qodeca/erfana-skills
/plugin install erfana@erfana-skills
```

The marketplace registers under the name `erfana-skills` (matches `marketplace.json`). The install line uses `erfana@erfana-skills` – the plugin name `@` the marketplace name.

### 2. Verify

```
/plugin list
```

You should see `erfana@erfana-skills` enabled. Then type a trigger phrase like:

> design a slide deck

`erfana:design-slides` should activate. (Or `erfana:design-direction` first if you want it to suggest a visual style – try `"what style should I use for a Q2 retrospective deck"` for that path.)

### Invocation forms – bare vs. namespaced

Both forms resolve to the same skill:

```
/erfana:design-prototype     # canonical, namespaced (use this)
/design-prototype            # bare form, also works
```

Use the **namespaced form** in shared docs, screenshots, and team conversations. The bare form is a built-in Claude Code convenience – it exists for autocomplete brevity but collides with personal or other-plugin skills of the same name. The `/erfana:` prefix prevents that collision and makes the source explicit.

Tracked upstream: [anthropics/claude-code#43695](https://github.com/anthropics/claude-code/issues/43695) requests a `require-namespace: true` flag to remove the bare form. When that ships, this plugin will adopt it.

---

## How updates work

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
/plugin install erfana@erfana-skills@v5.0.0   # for example – pick the version you want
```

Replace `v5.0.0` with whichever release you want to lock to. A pinned version is never auto-updated. To upgrade later, run the same command with a newer tag and restart Claude Code.

Use case: you are mid-flight on a deck, a new version drops, and you do not want trigger-phrase behavior to shift under you. Pin until you are done, then unpin (`/plugin install erfana@erfana-skills` without a `@vX.Y.Z` suffix).

---

## Typical workflows

Skills compose. The most common chains:

**Pitch deck for an investor or client (visual style not yet decided)**

1. `erfana:design-direction` – pick a visual philosophy from a 20-school library; see 3 demos compared
2. `erfana:design-slides` – build the deck in the chosen direction
3. `erfana:design-review` – score the result before sending

Sample opener: *"What style should I use for a Series B pitch deck? Help me decide, then build it."*

**Hi-fi app prototype (iOS / Android / web)**

1. `erfana:design-prototype` – build clickable single-file HTML mockup with real device frame
2. `erfana:design-review` – catch hierarchy / craft / functionality issues before delivery

Sample opener: *"Build me a clickable iOS prototype for a Pomodoro app, 4 screens."*

**Product-launch animation with audio**

1. `erfana:design-direction` (only if visual style is unclear)
2. `erfana:design-motion` – timeline-driven animation with BGM + SFX, MP4 / GIF export
3. `erfana:design-review` – pre-publish QA

Sample opener: *"Make me a 15-second product launch animation in the Field.io kinetic style."*

**Vertical infographic from real data**

1. `erfana:design-direction` (if no chosen philosophy)
2. `erfana:design-infographic` – print-grade vertical layout with honest placeholders
3. `erfana:design-review` – typography / hierarchy pass

Sample opener: *"Design an infographic comparing our Q2 vs Q3 numbers."*

**Stress-test a plan before implementing** (process skill, v4.2.3+)

1. `erfana:grill-me` – Socratic walk through the decision tree; one question at a time, recommended answer per branch, explores the codebase before asking when the answer is already encoded there
2. Downstream skill of choice – `erfana:managing-issues` create / `erfana:managing-specs` (T1–T4) / any `erfana:design-*` skill, depending on what the locked plan is meant to produce

Sample opener: *"Grill me on this rollout plan before we build it – I want to ship X by Friday, here's my draft approach."*

**Why workflows matter**: each output skill works alone, but `design-direction` first prevents generic AI-look outputs and `design-review` last catches issues humans miss. Skip neither for important deliverables.

---

## Troubleshooting

**`/plugin marketplace add` fails or hangs**
Check network access to `api.github.com` and `raw.githubusercontent.com` (a corporate proxy may block them — see the proxy note below). The public marketplace needs no token.

**Auto-updates haven't appeared in 2+ sessions**
Force a refresh: `/plugin marketplace update erfana-skills`, then `/plugin update erfana@erfana-skills`, then restart Claude Code. If still stale, clear the cache: `rm -rf ~/.claude/plugins/cache/` and restart.

**`/plugin install` reports "marketplace not found"**
The registered marketplace name comes from `marketplace.json` (`erfana-skills`). Make sure step 3 ran successfully – `/plugin marketplace list` should show it.

**Trigger phrases don't activate the right sub-skill**
Confirm the plugin is enabled (`/plugin list`) and try a trigger phrase from the skill table above. Each sub-skill (`design-direction`, `design-prototype`, `design-slides`, `design-motion`, `design-infographic`, `design-review`) has its own keyword set – if your phrasing is far from the listed triggers, mention the deliverable type explicitly ("prototype", "slide deck", "animation", "infographic").

**`/erfana:design-prototype` and `/design-prototype` both appear in autocomplete**
Expected behavior. Plugin skills are registered at both the bare path (`/design-prototype`) and the namespaced path (`/erfana:design-prototype`) – see [Invocation forms](#invocation-forms--bare-vs-namespaced). Use the namespaced form to avoid collisions with personal or other-plugin skills.

**Plugin updated but Claude Code still uses old behavior**
Force a refresh: `/plugin marketplace update erfana-skills`, then `/plugin update erfana@erfana-skills`, then restart Claude Code. If still stuck, clear the cache: `rm -rf ~/.claude/plugins/cache/` and restart Claude Code.

**Marketplace add hangs / silently fails behind a corporate proxy**
If your network blocks `api.github.com` or `raw.githubusercontent.com`, marketplace operations fail without a clear error. Ask IT to allowlist both. As a workaround, `git clone` the repo locally and register it as a local-path marketplace: `/plugin marketplace add /absolute/path/to/erfana-skills`. Pull updates manually with `git pull` + `/plugin marketplace update erfana-skills`.

**Skill scope precedence**
If you have a personal or project skill that shares a name with one in this plugin (e.g. you also have `~/.claude/skills/design-slides/SKILL.md`), Claude Code resolves in order: project (`.claude/skills/`) → personal (`~/.claude/skills/`) → plugin (`erfana@erfana-skills`). To force the plugin version, rename your personal copy or add it to a different namespace.

**Local development (testing changes before they hit main)**
Clone the repo locally, then register it as a local-path marketplace:
```
/plugin marketplace add /absolute/path/to/your/clone
/plugin install erfana@erfana-skills
```
Iterate on your fork. When ready, push a `feature/...` branch (cut from `develop`) and open a PR against `develop`. Once it ships in a release, switch back to the published marketplace: `/plugin marketplace remove erfana-skills` then `/plugin marketplace add qodeca/erfana-skills` and `/plugin update erfana@erfana-skills`.

---

## License

Copyright © 2025-2026 Qodeca sp. z o.o.

Licensed under the [GNU General Public License v3.0 only](LICENSE) (`GPL-3.0-only`). You are free to use, study, share, and modify it; distributed derivatives must remain under the same license and ship their source. The license covers code, documentation, and bundled assets — it does **not** grant rights to the "erfana" or "Qodeca" names or logos (see [`TRADEMARKS.md`](TRADEMARKS.md)). Per-file licensing follows the [REUSE](https://reuse.software) specification; run `reuse lint` to verify.

---

## Maintainer info

Repository: `github.com/qodeca/erfana-skills`
Maintainer: Marcin Obel ([@marcinobel](https://github.com/marcinobel)). Governance: [`GOVERNANCE.md`](GOVERNANCE.md). Support: [`SUPPORT.md`](SUPPORT.md).

> Note: the `v1.0.0` git tag exists but is not installable (it predates a `marketplace.json` schema fix shipped in `v1.0.1`). If you pin to an exact version, start from `v1.0.1` or later.
