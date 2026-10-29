# Architecture – orchestration plugin layout

How the erfana plugin is organized internally, and the conventions a maintainer must follow when adding or modifying skills and agents. The `CLAUDE.md` "Repository layout" table answers WHAT lives where; this document answers WHY and HOW.

## One domain, one plugin (v7.0+)

The plugin shipped as a focused design toolkit through v3.2.0. v4.0.0 widened it into a design + orchestration toolkit by absorbing a pool of shared agents and 6 orchestrator skills from the maintainer's previously-global `~/.claude/` configuration. **v7.0.0 removed the design half entirely** – the six `design-*` skills, the `design-shared` asset bundle, the brand-system layer, and the six gates that guarded them. What remains is a single-domain orchestration toolkit: six orchestration skills plus single-skill branches (process – `grill-me`; verification – `fact-checking`; prompting – `prompt`, `raise-the-bar`, `draft-goal`; session closeout – `ship`, `handoff`) behind one bootstrap router, and 33 shared agents today. How the agent pool grew and shrank release by release is in [`../CHANGELOG.md`](../CHANGELOG.md).

Every skill is self-contained. There is no shared asset bundle and no brand data: skills produce code, prose, and repository artifacts for whatever project they run against.

### One package, two hosts

erfana ships as a Claude Code plugin and also runs on Qwen Code, which converts Claude Code plugins at install time. That conversion is the whole integration: **no second package, no second manifest, no build step, no second release train.** Qwen's installer reads `.claude-plugin/marketplace.json`, copies the same tree onto the user's machine, and rewrites what it needs to – after the release, from the same tag Claude Code users install. A `qwen-extension.json` must never be added to the repository root: finding a native manifest makes Qwen skip the plugin conversion entirely, so the repository would install worse, not better.

Everything host-specific lives in [`hosts.md`](hosts.md) – the tool-name vocabulary, the hook `timeout` mismatch, the list of what degrades on Qwen, and how to verify a host. That page is the single source of truth and this document deliberately does not restate it. Its machine-readable half is `scripts/_lib/host_matrix.py`, which Gates 2, 14 and 15 read directly, so a claim on that page and a rule in a gate cannot drift apart.

## Skill decomposition

Every skill follows the superpowers `writing-skills` rule "one skill, one well-defined behavior". Multi-skill requests route through the bootstrap rather than through a mega-skill; the v1 mega-skill pattern is a documented anti-pattern in `CLAUDE.md`.

### Orchestration skills (6, v4.0+)

| Sub-skill | Single concern |
|---|---|
| `erfana:agent` | Claude Code agent lifecycle – Create, Review, Modify, and Pairs (doer/reviewer agents) – written as a brief. Interviews, design, writing, and edits run in the main conversation against `references/agent-standard.md`; `agent-researcher` gathers sourced best practices and the blinded `agent-reviewer` judges readiness. |
| `erfana:article` | Medium-form article authoring (research → outline → draft → publish), bilingual Polish/English. Researches through `article-researcher` and reviews through the blinded `article-reviewer`; outlining, drafting, and revising run in the main conversation. |
| `erfana:issue` | GitHub-issue lifecycle (create / multi-phase implement / review code / display read-only `show issue` / `list issues` / `search issues`). The Implement operation is **autonomous** – it designs, builds, reviews, and fixes without blocking on intermediate approvals, resolving architecture/technical decisions by best practice plus judgment – and commits nothing before the user accepts the result at UAT; the brief rebuild retired the run-state comment and resume. It runs 13 phases with 13 phase gates plus 3 embedded review sub-gates (QG-4a design review, QG-4b judgment, QG-11a change-set review); the design (QG-4a) and the change set (QG-8, QG-11a) are reviewed by reviewer agents the operation fans out itself – no user-run `/erfana:lens-review` – with CRITICAL/HIGH findings fixed inline and MEDIUM/LOW routed to a judge. The only human touchpoints are requirements clarification in the business-analysis phase, UAT acceptance (QG-11), and the QG-12 git-action confirmation; a headless run stops before creating a branch, and a CI run is refused at QG-0. |
| `erfana:report` | Consulting reports with Pyramid Principle, SCQA, Five Cs. Written as a brief (ground rules, house standard, one section per operation); reviews run six checks through the shared `report-language-checker` and `report-structure-checker` agents. |
| `erfana:skill` | Claude Code skill lifecycle – Create, Review, Modify, and the **Modernize operation**, which reviews an existing skill with the blinded `skill-reviewer` against `references/skill-standard.md`, lets the user pick the changes, and applies them in the main conversation with backups and a focused re-review. Every operation opens with a **coverage-map requirements interview** run in the main conversation per `references/interview-protocol.md`: Create always interviews; Modify/Review/Modernize gate-then-grill, backstopped by the `ms-grill-guard` Stop hook (registered in plugin-root `hooks/hooks.json` since v7.1.0; scoped to a live interview by its open-marker sentinel, not by its registration). Audit-trail per skill: [`modernization-registry.md`](modernization-registry.md). |
| `erfana:spec` | 4-tier specification management (T1 issue → T4 standard) – Create, Change, Review, Reconcile, Archive and list – written as a brief. Requirements, creation, edits, and reconciliation run in the main conversation; `spec-app-researcher` researches similar applications, the blinded `spec-validator` reviews, and `spec-compliance-checker` compares a spec with the code. |

### Process skills (1, v4.2.3+)

| Sub-skill | Single concern |
|---|---|
| `erfana:grill-me` | Interview the user one question at a time until a 16-dimension coverage map is closed – every area done, or skipped with a stated reason. Originally imported from upstream `superpowers:grill-me` (v4.2.3); rewritten in v6.2.0 into a machine-checkable protocol: per-message coverage-map line, laddered follow-ups, decisions ledger, mandatory late rounds (since v9.0.0: reversibility, non-obvious edge cases, and the expert gap; the premortem was removed), prediction-test exit gate, rationalization table from observed baseline excuses, and a `grill-guard` Stop hook (registered in plugin-root `hooks/hooks.json` since v7.1.0, scripts under `hooks/` and fixtures under `tests/hooks/grill-guard/`, Gate 16; it evaluates every stop and the open-marker sentinel alone scopes it to a live interview). v6.6.0 makes the interview proportional: three depths (`short` / `standard` / `full`) the model selects from blast radius, reversibility, cost of being wrong, and consumers (any one-way door, external consumer, or money / legal / safety / data-loss exposure forces `full`; ambiguity resolves upward); skips batched into one mandatory sizing statement instead of one `AskUserQuestion` per waiver; the seven mandatory dimensions compressed rather than dropped at `short`; and a depth-relative question floor (5 / 10 / 16). The exit gate holds at every depth. Ships `references/question-stems.md`, which records per dimension what survives a short pass. Brand-agnostic. |

### Verification skills (1, v4.2.7+)

| Sub-skill | Single concern |
|---|---|
| `erfana:fact-checking` | Validate markdown analysis documents against source materials by extracting atomic factual claims, tracing each to its source passage, classifying findings by severity (Critical / Error / Warning / Info), and applying user-approved corrections. Written as a brief: source discovery, claim extraction, the interactive review, and approved fixes run in the main conversation; one blinded verifier, `fact-checking-verifier`, returns a verdict with quoted evidence per claim. Manual-only via `/erfana:fact-checking <target-file>` (`disable-model-invocation: true`); not auto-discovered. Up to about 50 claims go to one verifier; larger documents are split into batches of about 25 claims verified in parallel, reconciled by claim id, with missing or failed batches sent again. All ingested document/source text is treated as untrusted data, and fix application anchors on verbatim text. Migrated from a prior Qodeca consulting project, Modernize-passed in v4.2.7, and lens-review-hardened in v4.6.0. Brand-agnostic. |

### Prompting skills (3)

| Sub-skill | Single concern |
|---|---|
| `erfana:prompt` | Interview the user one decision at a time and write or improve a prompt for Claude Opus 5.5, Sonnet 5.5, or Fable 5.1. SKILL.md holds the question protocol and the Claude 5 wording principles; `references/` holds the interview ledger and branches, the composable templates, and model guidance with the official URLs and a review date to recheck against. Authors prompts only – never executes the task a prompt describes. |
| `erfana:raise-the-bar` | Rewrite a request the user is about to give Claude into a more ambitious one through three lenses – altitude (the outcome behind the task), depth (how a top practitioner would do it), range (other fields, as work rather than role-play) – keeping only raises the workspace supports and an outside judge can check, then print it for the user to run. `references/lenses.md` holds the lenses and the grounding test. Adapted from Felix Rieseberg's "How to be more ambitious: a tutorial for humans with models"; wording is new. Never does the work itself. |
| `erfana:draft-goal` | Turn an intention into a `/goal` completion condition the goal evaluator can judge from the transcript (one outcome, numbered checks with visible evidence, exclusions, owner-decisions clause, turn bound) and print it for the user to paste between fixed START and END marker lines, at or under about 3,500 characters (Claude Code refuses a `/goal` over 4,000) – never runs `/goal` itself. `references/` holds the goal mechanics (checked against the Claude Code docs, with Qwen Code differences) and weak-to-strong condition patterns. Step structure adapted from Qwen Code's bundled `goal-draft` skill (Apache-2.0); wording is new, so it carries the repository's default GPL-3.0-only licence with a credit paragraph in SKILL.md. |

### Work-session skills (4)

| Sub-skill | Single concern |
|---|---|
| `erfana:autopilot` | Unattended run setup and upkeep – goal condition from the session, `.local/autopilot.md` state file (progress, owner queue, decisions), resume after restart; the `post-compact-reminder` hook points to the state file while it says `Status: active`. Prints the `/goal` line between START and END marker lines; never runs it. When a `/goal` is already running, it writes no new one and sets the run up against it, keeping its run rules in a Run rules section of the state file. |
| `erfana:next-batch` | Rank free open issues by delivery impact, group the top N by theme, save `.local/next-batch.md`. Read-only on GitHub. |
| `erfana:coordinate` | Claims on GitHub (`claimed` label + `<!-- erfana:claim -->` comment) so parallel sessions and clones do not collide; board, release, and sibling-session status exchange. The claim rules (`references/claims.md`) are shared with `next-batch` and `autopilot`. |
| `erfana:expert-panel` | Fan out read-only top-practitioner reviewers over a plan, design, or documents; merge, ask the owner's decisions, write an improved version to a new file. |

### Session closeout skills (2)

| Sub-skill | Single concern |
|---|---|
| `erfana:ship` | Git closeout – commit, push, pull request, optional merge after the checks pass, and cleanup of merged branches and worktrees – stopping where the project's own rules forbid a step. `disable-model-invocation: true` because it pushes. |
| `erfana:handoff` | Write a portable handoff document to the OS temp directory for another agent or person. `disable-model-invocation: true`. Adapted from `mattpocock/skills` (MIT); upstream files are kept verbatim under `references/` and licensed MIT in `REUSE.toml`, provenance in `references/UPSTREAM.md`. |

### Bootstrap (1)

`erfana:using-erfana` – auto-loaded meta-router. Top-level decision (orchestration vs process vs verification vs prompting) before sub-skill dispatch.

Each sub-skill `SKILL.md` stays trigger-shaped (frontmatter `description:` is a "Use when..." statement, ≤500 chars per Gate 2 soft-warn). Adding a new skill repeats the pattern.

## Repository layout

```
erfana-skills/
├── .claude-plugin/
│   ├── plugin.json          ← name=erfana, version=X.Y.Z (live: see CLAUDE.md banner)
│   └── marketplace.json     ← marketplace catalog
├── agents/                  ← 33 shared agents; flat directory; Claude Code auto-discovers (history in CHANGELOG.md)
├── skills/
│   ├── agent/     ← orchestration skill; references/ (agent standard, pairs), templates/
│   ├── article/   ← references/, templates/ (research and review through 2 plugin-root article-* agents)
│   ├── issue/     ← references/ (one file per operation + embedded review + code-review standards), templates/create/, templates/implement/
│   ├── report/              ← brief-style SKILL.md (was managing-reports); references/, templates/, examples/
│   ├── skill/     ← references/ (skill standard, interview protocol, Claude 5 patterns), templates/; its ms-grill-guard lives in plugin-root hooks/ since v7.1.0
│   ├── spec/      ← references/ (tiers, registry, writing requirements, review checks, downstream links), templates/ (T1-T4, schemas)
│   ├── grill-me/            ← process skill (v4.2.3+); references/ only – its grill-guard lives in plugin-root hooks/ since v7.1.0
│   ├── fact-checking/       ← verification skill (v4.2.7+); references/ only
│   ├── prompt/              ← prompting skill; references/ (interview, templates, model guidance)
│   ├── draft-goal/          ← prompting skill; references/ (goal mechanics, condition patterns)
│   ├── raise-the-bar/       ← prompting skill; references/ (the three ambition lenses)
│   ├── ship/                ← session-closeout skill (user-invoked only)
│   ├── handoff/             ← session-closeout skill (user-invoked only); references/ holds MIT upstream files
│   └── using-erfana/        ← bootstrap meta-router
├── hooks/                   ← six safety hooks (.sh + .ps1 siblings) + dispatch.sh launcher + hooks.json wiring (v4.1+; cross-platform v4.2.20+; interview guards promoted to plugin root v7.1.0+)
├── commands/                ← slash commands (v4.1+: doc-update; v4.2.5+: project-status; v4.2.6+: session-status; v4.2.11+: lens-review; v4.2.14+: explain-issue)
├── scripts/                 ← run-all-gates.sh, gate-14-hooks.sh, gate-16-hook-fixtures.sh, gate-17-publication-readiness.sh, gate-18-skill-registry.sh, gen-skill-registry.sh (only generator)
├── tests/                   ← maintainer test fixtures (v4.2.9+ adds tests/hooks/verify-completion/*.json; v6.2.0+ tests/hooks/grill-guard/; v6.4.0 tests/hooks/ms-grill-guard/)
└── docs/
    ├── architecture.md      ← this document
    ├── verification-gates.md← index for the 12 gates
    ├── known-caveats.md     ← accepted risks, one section per release that added any
    ├── modernization-registry.md ← audit-trail of Modernize passes per skill
    ├── skill-registry.md    ← generated: every skill + when it last changed (Gate 18)
    ├── publish-runbook.md   ← executed 2026-06-13; only the main-protection ruleset recipe remains
    ├── oss-launch-checklist.md ← remaining post-publication and data-protection obligations
    ├── release-notes-v6.0.0.md ← historical snapshot of the OSS release
    └── gates/               ← 12 per-gate detail files; numbering is historical and non-contiguous (gates 5, 6, 8, 9, 12, 13 retired with the design skills in v7.0.0)
```

### Cross-cutting safety surface (v4.1+)

The plugin's hook bundle (`hooks/`) is the project-agnostic safety net that travels with the plugin install:

| Hook | Event | What it catches |
|---|---|---|
| `bash-safety.sh` | PreToolUse / Bash | Destructive shell patterns informed by 2025-2026 incident research – `rm -rf` self-deletion, force-push to protected branches, IMDS metadata exfiltration, `tar --absolute-names`, persistence backdoors, fork bombs, cloud teardown commands. Since v9.1.0 each `rm` target is judged on its own (paths at least two levels below home or in a temp folder pass, including `$VAR/…` when the variable was set to such a path in the same command), a download piped into `python3 -c`, `python3 -m json.tool`, or `jq` passes, and quoted heredoc bodies fed to `cat`, `tee`, or an interpreter are not scanned. |
| `secret-detector.sh` | PreToolUse / Write\|Edit\|MultiEdit | ~20 secret/token patterns from gitleaks v8.28+ canonical config (AWS, OpenAI, Anthropic, GitHub, GitLab, Hugging Face, Sentry, Postman, Slack, npm, Stripe, Google, Azure, database URIs, JWTs, PEM keys). Skips test fixtures, examples, markdown docs, and other `hooks/` scripts. |
| `post-compact-reminder.sh` | PostCompact | Re-injects load-bearing facts after context compaction + current git state snapshot; while `.local/autopilot.md` starts with `Status: active`, adds a pointer to it (never its content) so an `erfana:autopilot` run resumes. |
| `verify-completion.sh` | Stop | Blocks success-without-evidence claims using a regex Stop hook (per Anthropic's Apr 2026 guidance: deterministic regex for hard safety, not prompt-based). v4.2.9+ adds (a) a sentinel-comment allowlist – the literal `<!-- erfana:status-template -->` emitted by `/erfana:project-status` and `/erfana:session-status` bypasses the success-claim check, enforced for symmetry by Gate 16; (b) an unclosed-fence fallback that uses the unstripped body when the message has an odd number of code fences; (c) a `\bverified\b` word-boundary fix so "unverified" no longer satisfies the verification check. v4.2.14+ extends the allowlist to a second sentinel `<!-- erfana:explain-template -->` emitted by `/erfana:explain-issue` (reserved for future `explain-*` siblings); Gate 16 enforces symmetry for the new sentinel across `commands/explain-issue.md` and the hook in addition to the existing status family. |
| `grill-guard.sh` | Stop | Blocks one stop attempt per turn while a `grill-me` interview is still open – the trailing `<!-- erfana:grill-open -->` marker is present. Fence- and inline-code-aware, so a message merely quoting the marker does not re-trigger it. Backstop only; the protocol lives in the skill (v6.2.0+, promoted to plugin root v7.1.0). |
| `ms-grill-guard.sh` | Stop | The same one-stop block for a `skill` requirements interview, keyed on `<!-- erfana:ms-grill-open -->` (v6.4.0+, promoted to plugin root v7.1.0). |

**Cross-platform implementation (v4.2.20+).** Each of the six hooks ships in two forms: the `.sh` shown above (macOS/Linux) and a faithful `.ps1` port (Windows). `hooks.json` never names a `.sh`/`.ps1` directly – every command runs `bash "${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.sh" <hook>`, and `dispatch.sh` `exec`s the PowerShell sibling via `powershell.exe` on Windows (OS detected by `uname`; the script path is handed over in `cygpath -m` forward-slash form to dodge bash↔native quoting) or the bash sibling elsewhere. stdin/stdout/stderr/exit-code pass straight through, so exit 2 still blocks and stdout JSON is still honoured. This exists because Git Bash on Windows ships without `jq`, so the bash hooks parsed empty input and silently no-op'd there. The PowerShell ports use built-in `ConvertFrom-Json` (no `jq`), `-cmatch`/`-match` to mirror `grep -E`/`grep -iE` case sensitivity, and `(?m)` to preserve per-line `^`/`$` anchoring. A Windows host without Git Bash is uncovered (PowerShell can't launch `bash dispatch.sh`) – the same gap the prior `.sh`-only bundle had; see [`known-caveats.md`](known-caveats.md).

**Cross-host registration (v7.1.0+).** `hooks/hooks.json` is the only place a hook is declared. Both supported hosts read that file, so anything registered there runs on both; a hook declared in a skill's `hooks:` frontmatter runs on Claude Code alone, because Qwen Code's skill parser does not extract that field at all. That is why the two interview guards moved out of `skills/grill-me/` and `skills/skill/` into the plugin root in v7.1.0 – a skill-scoped guard was dead on one of the two hosts. As ordinary Stop hooks they now evaluate **every** stop, and the open-marker sentinel in the message – not the registration – is what scopes each one to a live interview. Two further wiring rules follow from the same split: `hooks.json` carries no `timeout` key, and every matcher names both hosts' tool vocabulary. Gate 14 enforces both; the reasoning behind them is in [`hosts.md`](hosts.md), and [`known-caveats.md`](known-caveats.md) records what stays unverified.

The bundle is project-agnostic by design – no hook reads any skill's content. Personal style preferences (worktree ban, en-dash policing, English-only, per-account budgets) live in user settings, not the plugin. Validated by Gate 14 (`scripts/gate-14-hooks.sh`), which now also asserts both siblings exist per dispatched hook and PowerShell-parses the `.ps1` files when a PowerShell interpreter is on PATH.

Slash commands (`commands/`) follow the same auto-discovery pattern as skills: drop a `.md` file with optional YAML frontmatter, Claude Code registers it as `/erfana:<name>`. Currently ships five: `doc-update` (v4.1+; v4.2.16+ safety/coverage/currency rewrite – live-change-set detection, full documentation-surface discovery, no git action by default; v5.1.0+ status/changelog eviction into home docs, whole-file necessity prune with `CHANGELOG`/ADR/`README` exempt, and `AskUserQuestion`-confirmed section/file removals), `project-status` (v4.2.5+; v4.2.8+ stakeholder rewrite; v4.2.9+ sentinel + dual-issue probe + DIP fix; v4.2.10+ hard length rule + mandatory Layer 2), `session-status` (v4.2.6+; v4.2.8+ stakeholder rewrite; v4.2.9+ sentinel + DIP fix; v4.2.10+ hard length rule + mandatory Layer 2), `lens-review` (v4.2.11+; v4.2.12+ PM-facing output redesign), and `explain-issue` (v4.2.14+). The two status commands and `explain-issue` share the same stakeholder register and hallucination guards but split on output shape and namespace:

- **Status family (`*-status`).** Both ship the same protocol shape: PO/PM/BA audience explicitly named, three outcome-shaped axes (**what we worked on / what we accomplished / where we landed**), two-layer recommended-next (stakeholder milestone sentence + italicised `Suggested first step:` hint for Claude), word budget ~175-220 / hard cap 280, and a hard hallucination-guards section (source attribution, no acronym expansion without evidence, no evaluative adverbs without evidence, quantifier grounding, status-label criteria, date discipline, grounded issue/PR translations, banned narrative phrases, an **abstract** inventory-negation rule that names no hook implementation in command prose per v4.2.9 DIP fix, confidence-calibration headline when state is partial). v4.2.10+ elevates two soft rules to hard ones: every support bullet has a hard 55-word ceiling with a ±15-word balance requirement across the three bullets, and Layer 2 is always emitted (the prior "skip when caught up" carve-out is removed; a new priority rung 5 in both commands covers post-release / smoke / MAINTAINER-checklist follow-ups so the caught-up rung becomes the genuine empty case, not the slip-prone default). Both templates end with a mandatory invisible `<!-- erfana:status-template -->` sentinel that `verify-completion.sh` keys on; Gate 16 enforces symmetry across the two status command files and the hook. `project-status` additionally fetches `gh issue view` / `gh pr view` for any issue or PR mentioned with a plain-language description so the translation is grounded, and (v4.2.9+) issues two `gh issue list` calls – one filtered to your assigned issues, one with no assignee filter – so the report covers both the personal todo and the full open-issue queue; `session-status` sources from in-context conversation with a light git probe.
- **Explain family (`explain-*`, v4.2.14+).** `explain-issue` takes one GitHub issue reference (bare number, `#N`, or full URL) and emits a single Pyramid-Principle brief pitched at the same PO/PM/BA audience. Deep input feeds translation (issue payload, last 3 comments, linked PRs, files and spec IDs referenced in the body, commits matching `#N`) but the rendered brief stays one PM/PO section with no engineering appendix – an explicit divergence from the dual-layer `lens-review` output. Classification chain (labels → Conventional-Commits title prefix → body heuristic → default `question`) adapts the three support axis labels per type; the family ships **without** a `Suggested next step` line because the stakeholder owns the action queue. Length is adaptive: at most 40% of the issue body word count, floor 120 words, hard cap 400; per-bullet ceiling 55 words with ±15-word balance (inherited from the v4.2.10 status-command lesson). Coverage is hybrid (silent on full data, `_Data note: …_` footer on material gaps, `Issue #N – state unclear, partial signals available` headline on ground-loss). Output ends with `<!-- erfana:explain-template -->`; Gate 16 enforces symmetry for the new sentinel across `commands/explain-issue.md` and the hook, reserving the literal for future `explain-*` siblings (a likely `explain-pr` mirrors the same shape). The namespace is hyphen-tagged – the `*-status` and `explain-*` suffixes group cleanly in autocomplete and stay open for additional siblings.

### Shared resources

- **`agents/` at plugin root** – 33 shared agents; flat directory of `*.md` files. Auto-discovered by Claude Code; orchestration skills delegate to them via the `Task` tool. Prefix breakdown (each skill-owned agent starts with its skill's name): `spec-` (3), `issue-` (1), `skill-` (1), `agent-` (2), `article-` (2), `fact-checking-` (1), `report-` (2), `lens-` (1), `e2e-` (4), `release-` (2), generic-name (14, including `solution-*`, UI/UX, and the general reviewers and developers). The generic-name agents (`code-reviewer`, `commit-writer`, `software-developer`, etc.) carry collision risk with built-ins or other plugins (last-loaded wins) – see `SECURITY.md > Known limitations`.
- **No shared content bundle.** Since v7.0.0 every skill owns its own references and templates. Content two skills both need is duplicated deliberately rather than hoisted – the skills are independent and a shared bundle would recouple them.

### Per-skill nested agents

No skill ships internal agents under `<skill>/agents/` any more: the published Claude Code plugin spec documents only plugin-root `agents/`, so every agent lives there. `article` hoisted its agents to `article-*` in v4.3.0, and `report` (then `managing-reports`) replaced its 11 nested agents with two plugin-root `report-*` checkers when it was rebuilt as a brief. No skill defines a nested `agents/` folder.

### Convention: subagents cannot call `AskUserQuestion`

`AskUserQuestion` is **not delivered to subagents spawned via the `Task`/Agent tool**, even when listed in the agent's `tools:` frontmatter (background subagents auto-deny the prompting call; foreground ones never receive it). An agent that calls it directly silently fails to gather input. The required pattern across every skill in this plugin:

- The **agent returns a structured set of proposed questions** (AskUserQuestion-shaped: `header`, `question`, `options`, one `recommended`, `multiSelect`) plus what it already extracted. It never calls `AskUserQuestion`.
- The **orchestrator** (the skill running in the main conversation) asks those questions via `AskUserQuestion`, batching at most 4 per call, then passes the answers back to the agent or carries them forward.
- A **skipped answer is valid** — record it and proceed; never loop re-asking the same question.

Canonical shape: the agent returns its question with the context and options the user needs, and the main conversation asks it and passes the answer back. The brief-style skills (`agent`, `skill`, `report`, `issue`) go further and keep questions in the main conversation altogether: their agents are checkers and researchers that never need the user mid-task.

### Where new content goes – the rule

- **Reference prose** (how-to depth a skill body cannot carry) → `skills/<name>/references/foo.md`.
- **Templates** → `skills/<name>/templates/`.
- **Agent prompts** → plugin-root `agents/<prefix-name>.md`; a skill-owned agent starts with its skill's name. No skill ships its own `agents/` folder.
- **Gate logic** → `scripts/`, with a matching detail file under `docs/gates/`.

Nothing is shared across skills. Gate 7 walks every cited path from each file's perspective and fails on broken links.

### File-size convention

When a skill file approaches the 500-line cap, hoist the single most cohesive section to a sibling file under `references/` rather than refactoring the whole file, and have the sibling cite its parent. Apply it at 480+ lines rather than waiting for the cap. The older split patterns – the per-operation `reference/*-phase-requirements.md` files and the `issue` `phases/` / `operations/` / `examples/` splits – went away when the skills were rebuilt as briefs; the history is in [`../CHANGELOG.md`](../CHANGELOG.md).

## Cross-skill flow

The bootstrap (`skills/using-erfana/SKILL.md`) routes between the orchestration track and single-skill branches: a process branch (`grill-me`, v4.2.3+), a verification branch (`fact-checking`, v4.2.7+), and a prompting branch (`prompt`, `draft-goal`, `raise-the-bar`). `ship` and `handoff` are listed there but run only when the user invokes them. Orchestration skills are independent of each other; the process branch is a leaf that may hand off to an orchestration skill when the user is ready to execute the locked plan.

### Orchestration flow

```
User intent → using-erfana (router)
                  │
                  └─ orchestration task?
                       │
                       ├─ agent lifecycle? → agent
                       ├─ article (research → publish)? → article
                       ├─ GitHub issue (create / implement / review)? → issue
                       ├─ consulting report? → report
                       ├─ skill lifecycle? → skill
                       └─ specification (T1-T4)? → spec
```

Orchestration skills are **independent** – they pick by domain, not by lifecycle stage of a shared deliverable. Each owns its own workflow and delegates to agents in the plugin-root `agents/` via the `Task` tool.

### Cross-skill composition

If a single conversation spans two skills (e.g. a spec and the issues that implement it), invoke them sequentially – the skill that locks the source material first, then the skill that consumes it. No skill invokes another; a skill that needs one prints the command and ends the turn.

## Adding a new sibling skill – checklist

1. **Pick the folder name**. Lowercase kebab-case, a short name for the domain (e.g. `skills/feedback/`). The folder name becomes the namespace suffix (`erfana:feedback`).
2. **Create `skills/<name>/SKILL.md`** with frontmatter:
   - `name: <name>` (must match folder name; Gate 2 enforces).
   - `description:` one trigger sentence ("Use when..." form, third-person voice, ≤500 chars; Gate 2 warns above threshold).
   - `when_to_use:` multi-line trigger phrases (specific triggers per Anthropic; ≥3 quoted activation phrases is the plugin-convention Gate 2 v4.2.0+ heuristic for activation reliability, refined v4.2.1).
   - `allowed-tools:` minimal set.
   - Combined `description` + `when_to_use` ≤1,536 chars (Anthropic-documented truncation limit, Gate 2 v4.2.0+).
   - `disable-model-invocation: true` ONLY if the skill is user-invoked-only (currently `fact-checking`, `ship`, and `handoff`).
   - `effort:` and `model:` (v4.2.0+, optional but recommended for orchestrator skills): per the model and effort table in `skills/agent/references/agent-standard.md` section 7.
3. **Body structure**: write the body as a brief – ground rules first, then one outcome-led section per operation – per section 4 of `skills/skill/references/skill-standard.md` ("The body: write a brief").
4. **References**: skill-internal docs go under `skills/<name>/references/` and `skills/<name>/templates/` (plus `examples/` where a skill needs worked examples). Cite nothing outside the skill's own folder except plugin-root `agents/`.
5. **Add agents (optional)**:
   - Plugin-root agents → `agents/<prefix-name>.md` (use a unique team prefix to avoid generic-name collisions; see `SECURITY.md > Known limitations`).
   - A skill-owned agent starts with its skill's name (`spec-validator`, `skill-reviewer`). No skill ships a nested `agents/` folder.
   - Choose `model:` and `effort:` per section 7 of `skills/agent/references/agent-standard.md`; omitting `effort` is valid and the agent then follows the session. Routine validators on `sonnet`+`low` are far cheaper than reviewers on `opus`+`high`; the savings compound across long workflows.
   - **Never** declare `temperature`, `top_p`, `top_k` (400 error on Claude Opus 4.7 and later per Anthropic's parameter-deprecation table) or fixed `thinking: {budget_tokens: N}` on Claude 5 models (Haiku 4.5 exempt) in agent code (Gate 2 + Section 13.3/13.4 BLOCKING).
6. **Update `skills/using-erfana/SKILL.md`** – add a row to the appropriate sub-table and to the Decision Flow.
7. **Update `README.md`** – add a row to the appropriate skills sub-table at the top.
8. **Update `CHANGELOG.md`** – entry under the next release describing the addition.
9. **Bump `version`** in `.claude-plugin/plugin.json` only – never add `version` to `marketplace.json` (see the release process).
9b. **Regenerate the skill registry** – `bash scripts/gen-skill-registry.sh` – and commit `docs/skill-registry.md`. Gate 18 hard-fails when the registry's skill list disagrees with `ls skills/`. The new skill's row reads `uncommitted` until its commit lands, after which Gate 18 warns (not blocks) until the next regeneration.
10. **Run `bash scripts/run-all-gates.sh`** – Gate 2 lists the new skill (and any added agents) and enforces frontmatter invariants; Gate 7 hard-fails on broken citations; Gate 15 hard-fails until every prose skills-count claim matches the filesystem.
11. **Open a PR** – CODEOWNERS auto-tags `@marcinobel`. Squash-merge via admin bypass per the documented release process.

## What this architecture deliberately does NOT include

- **MCP servers**. The plugin currently does not bundle MCP servers. If a future skill needs runtime tooling, document the MCP server in `.mcp.json` and update CI to validate it.
- **Project-level skills** (`.claude/skills/` in employee repos). The plugin is plugin-scope only. Personal/project skills override plugin skills per CC's scope precedence; that's documented in README troubleshooting, not enforced by this plugin.
- **Cross-skill coupling**. No skill depends on another. The single coupling point is the bootstrap router. A skill that would need a sibling's behaviour prints the sibling's command and ends the turn instead of invoking it.

Note on agents: v4.0.0 added `agents/` and per-skill nested agents; the nested agents are gone and the live count is the one stated at the top of this document. The architectural rule is that agents are an **implementation detail of orchestration skills** – they execute multi-phase work the orchestration skills break down via the `Task` tool. Adding a new agent does NOT require a `CLAUDE.md` update on its own; adding a new skill that delegates to agents does.

## See also

- [`CLAUDE.md`](../.claude/CLAUDE.md) – repository layout table, hard constraints; the release process lives in [`.claude/skills/releasing-erfana/SKILL.md`](../.claude/skills/releasing-erfana/SKILL.md)
- [`hosts.md`](hosts.md) – the single source of truth for host differences: which hosts are supported, how Qwen Code converts the plugin at install time, the tool-name vocabulary rules, what degrades there, and how to verify a host.
- [`skill-registry.md`](skill-registry.md) – generated inventory of every shipped skill and the last commit that touched it; regenerate with `scripts/gen-skill-registry.sh`, policed by Gate 18.
- [`verification-gates.md`](verification-gates.md) – index for the 12 gates (all hard); per-gate detail under [`gates/`](gates/), one file per gate. Includes Gate 2 (frontmatter for skills + agents + Claude 5 model patterns incl. the reasoning-display detector with committed fixtures, v4.0+ extended v4.2.0+ and v6.3.0), Gate 7 (cross-references across skills + agents), Gate 14 (hooks valid, v4.1+), Gate 15 (doc-claim sync, v4.1.2+, extended v4.1.3+ to cover skills / hooks / slash command counts; v4.2.2 extended `docs_to_scan` to include `skills/using-erfana/SKILL.md` and `docs/verification-gates.md`), Gate 16 (verify-completion fixture replay + sentinel symmetry, v4.2.9+), Gate 17 (publication readiness, v6.0.0+), Gate 18 (skill-registry sync against git history – list drift and impossible dates hard, lagging dates warn, v6.6.1+)
- [`modernization-registry.md`](modernization-registry.md) – audit-trail of every skill that has been through the Modernize operation (v4.2.0+) – first pass, last pass, scope, score. Convention-enforced (not gated). Updated atomically with each Modernize pass.
- [`known-caveats.md`](known-caveats.md) – accepted risks from the v4.0.0 scope widening, v4.1.0 hooks migration, the 2026-05-17 v4.2.8 → v4.2.10 same-day release chain, and every later release that added one (generic-name agent collisions, skipped rc soaks, `~/.claude/` duplication, etc.). The running tally of no-staged-rollout overrides lives in that file's newest section – the last one in the file – and is not restated here. Extracted from CLAUDE.md to keep that file under the 40 KB recommended ceiling.
- [`../CHANGELOG.md`](../CHANGELOG.md) – release narrative including v4.0.0 widening + accepted-risk audit trail
- [`../ROADMAP.md`](../ROADMAP.md) – sequenced upcoming work
- [`../BACKLOG.md`](../BACKLOG.md) – items intentionally NOT on the roadmap, with reasoning
- [`MAINTAINER.md`](../MAINTAINER.md) – succession plan, signed-commits setup
- [obra/superpowers writing-skills](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md) – the canonical reference for skill-authoring conventions this plugin follows
- [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) – current SKILL.md frontmatter spec (April 2026)
