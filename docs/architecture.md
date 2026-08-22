# Architecture – orchestration plugin layout

How the erfana plugin is organized internally, and the conventions a maintainer must follow when adding or modifying skills and agents. The `CLAUDE.md` "Repository layout" table answers WHAT lives where; this document answers WHY and HOW.

## One domain, one plugin (v7.0+)

The plugin shipped as a focused design toolkit through v3.2.0. v4.0.0 widened it into a design + orchestration toolkit by absorbing 87 shared agents (76 at v4.0.0 + 4 `fc-*` fact-checking quartet in v4.2.7 + 2 from the managing-issues Create-operation split in v4.2.13 + 5 `article-*` in v4.3.0; v6.4.0 swaps `ms-requirements-gatherer` for `grill-planner` – net zero) and 6 orchestrator skills from the maintainer's previously-global `~/.claude/` configuration. **v7.0.0 removed the design half entirely** – the six `design-*` skills, the `design-shared` asset bundle, the brand-system layer, and the six gates that guarded them. What remains is a single-domain orchestration toolkit: six orchestration skills plus two single-skill branches (a process branch added in v4.2.3, `grill-me`, and a verification branch added in v4.2.7, `fact-checking`) behind one bootstrap router.

Every skill is self-contained. There is no shared asset bundle and no brand data: skills produce code, prose, and repository artifacts for whatever project they run against.


## Skill decomposition

Every skill follows the superpowers `writing-skills` rule "one skill, one well-defined behavior". Multi-skill requests route through the bootstrap rather than through a mega-skill; the v1 mega-skill pattern is a documented anti-pattern in `CLAUDE.md`.

### Orchestration skills (6, v4.0+)

| Sub-skill | Single concern |
|---|---|
| `erfana:managing-agents` | Claude Code agent lifecycle (research → design → validation) |
| `erfana:managing-articles` | Medium-form article authoring (research → outline → draft → publish), bilingual Polish/English. Delegates to 5 plugin-root `article-*` agents. |
| `erfana:managing-issues` | GitHub-issue lifecycle (create / multi-phase implement / review code / display read-only `show issue` / `list issues` / `find issues with label X` modes added v4.2.2). The Implement operation is **autonomous** – it designs, builds, reviews, and fixes without blocking on intermediate approvals, resolving architecture/technical decisions by best practice plus judgment – and persists its run state to one comment on the issue (created after an opt-in prompt on a public repo; written without a prompt but announced in one line on a private repo) so an interrupted run can resume. It runs 13 phases with 13 phase gates plus 3 embedded autonomous review sub-gates: the operation fans out its own reviewer agents (QG-4a, QG-8, QG-11a – no user-run `/erfana:lens-review`), auto-fixes CRITICAL/HIGH inline, and routes MEDIUM/LOW to a judge. The only human touchpoints are requirements clarification in the business-analysis phase, UAT acceptance (QG-11), the QG-12 git-action confirmation, and the QG-0 public-repo run-state consent; it still refuses a detected headless run. |
| `erfana:managing-reports` | Consulting reports with Pyramid Principle, SCQA, Five Cs. Ships 11 internal validation agents. |
| `erfana:managing-skills` | Claude Code skill lifecycle including the **Modernize operation** (v4.2.0+) that applies Claude 5 patterns to existing skills via ms-reviewer → user approval → ms-modifier (`change_type: modernize`) → ms-validator, and (v6.4.0) **coverage-map requirements interviews**: Create always interviews via `grill-planner` + `references/interview-protocol.md`; Modify/Review/Modernize gate-then-grill, backstopped by the skill-scoped `ms-grill-guard` Stop hook. Audit-trail per skill: [`modernization-registry.md`](modernization-registry.md). |
| `erfana:managing-specs` | 4-tier specification management (T1 issue → T4 standard). Delegates to plugin-root `spec-*` agents. |

### Process skills (1, v4.2.3+)

| Sub-skill | Single concern |
|---|---|
| `erfana:grill-me` | Interview the user one question at a time until a 16-dimension coverage map is closed – every area done, or skipped with a stated reason. Originally imported from upstream `superpowers:grill-me` (v4.2.3); rewritten in v6.2.0 into a machine-checkable protocol: per-message coverage-map line, laddered follow-ups, decisions ledger, mandatory premortem and reversibility rounds, prediction-test exit gate, rationalization table from observed baseline excuses, and a skill-scoped `grill-guard` Stop hook (frontmatter `hooks:`, scripts + fixtures under `skills/grill-me/hooks/` and `tests/hooks/grill-guard/`, Gate 16). v6.6.0 makes the interview proportional: three depths (`short` / `standard` / `full`) the model selects from blast radius, reversibility, cost of being wrong, and consumers (any one-way door, external consumer, or money / legal / safety / data-loss exposure forces `full`; ambiguity resolves upward); skips batched into one mandatory sizing statement instead of one `AskUserQuestion` per waiver; the seven mandatory dimensions compressed rather than dropped at `short`; and a depth-relative question floor (5 / 10 / 16). The exit gate holds at every depth. Ships `references/question-stems.md`, which records per dimension what survives a short pass. Brand-agnostic. |

### Verification skills (1, v4.2.7+)

| Sub-skill | Single concern |
|---|---|
| `erfana:fact-checking` | Validate markdown analysis documents against source materials by extracting atomic factual claims, tracing each to its source passage, classifying findings by severity (Critical / Error / Warning / Info), and applying user-approved corrections. Five-phase orchestrator (Setup → Extraction → Verification → Interactive review → Fix application) backed by four `fc-*` plugin-root agents. Manual-only via `/erfana:fact-checking <target-file>` (`disable-model-invocation: true`); not auto-discovered. Phase 3.1 implements adaptive fan-out (sequential single-call below ~50 claims; orchestrator-side parallel batching of ~25-claim chunks capped at ~8 workers, run in waves, at ≥50 claims) that reconciles by dispatched claim id and re-dispatches only failed/partial chunks (v4.6.0). All ingested document/source text is treated as untrusted data, and fix application anchors on verbatim text. Migrated from a prior Qodeca consulting project, Modernize-passed in v4.2.7, and lens-review-hardened in v4.6.0. Brand-agnostic. |

### Bootstrap (1)

`erfana:using-erfana` – auto-loaded meta-router. Top-level decision (orchestration vs process vs verification) before sub-skill dispatch.

Each sub-skill `SKILL.md` stays trigger-shaped (frontmatter `description:` is a "Use when..." statement, ≤500 chars per Gate 2 soft-warn). Adding a new skill repeats the pattern.

## Repository layout

```
erfana-skills/
├── .claude-plugin/
│   ├── plugin.json          ← name=erfana, version=X.Y.Z (live: see CLAUDE.md banner)
│   └── marketplace.json     ← marketplace catalog
├── agents/                  ← 87 shared agents (v4.0+, +4 fc-* in v4.2.7, +2 Create-split in v4.2.13, +5 article-* in v4.3.0); flat directory; Claude Code auto-discovers
├── skills/
│   ├── managing-agents/     ← orchestration skill (v4.0+); guides/, templates/, validation/
│   ├── managing-articles/   ← references/, templates/ (delegates to 5 plugin-root article-* agents; no nested agents or workflows as of v4.3.0)
│   ├── managing-issues/     ← phases/, operations/, reference/ (singular), examples/, templates/, validation/
│   ├── managing-reports/    ← ships 11 internal validation agents; reference/, templates/
│   ├── managing-skills/     ← guides/, templates/, validation/, examples/, references/ (interview protocol + taxonomy), hooks/ (ms-grill-guard)
│   ├── managing-specs/      ← templates/ (T1-T4), validation/, examples/, guides/
│   ├── grill-me/            ← process skill (v4.2.3+); references/ + skill-scoped hooks/ (v6.2.0+)
│   ├── fact-checking/       ← verification skill (v4.2.7+); references/ + examples.md
│   └── using-erfana/        ← bootstrap meta-router
├── hooks/                   ← four safety hooks (.sh + .ps1 siblings) + dispatch.sh launcher + hooks.json wiring (v4.1+; cross-platform v4.2.20+)
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
| `bash-safety.sh` | PreToolUse / Bash | Destructive shell patterns informed by 2025-2026 incident research – `rm -rf` self-deletion, force-push to protected branches, IMDS metadata exfiltration, `tar --absolute-names`, persistence backdoors, fork bombs, cloud teardown commands. |
| `secret-detector.sh` | PreToolUse / Write\|Edit\|MultiEdit | ~20 secret/token patterns from gitleaks v8.28+ canonical config (AWS, OpenAI, Anthropic, GitHub, GitLab, Hugging Face, Sentry, Postman, Slack, npm, Stripe, Google, Azure, database URIs, JWTs, PEM keys). Skips test fixtures, examples, markdown docs, and other `hooks/` scripts. |
| `post-compact-reminder.sh` | PostCompact | Re-injects load-bearing facts after context compaction + current git state snapshot. |
| `verify-completion.sh` | Stop | Blocks success-without-evidence claims using a regex Stop hook (per Anthropic's Apr 2026 guidance: deterministic regex for hard safety, not prompt-based). v4.2.9+ adds (a) a sentinel-comment allowlist – the literal `<!-- erfana:status-template -->` emitted by `/erfana:project-status` and `/erfana:session-status` bypasses the success-claim check, enforced for symmetry by Gate 16; (b) an unclosed-fence fallback that uses the unstripped body when the message has an odd number of code fences; (c) a `\bverified\b` word-boundary fix so "unverified" no longer satisfies the verification check. v4.2.14+ extends the allowlist to a second sentinel `<!-- erfana:explain-template -->` emitted by `/erfana:explain-issue` (reserved for future `explain-*` siblings); Gate 16 enforces symmetry for the new sentinel across `commands/explain-issue.md` and the hook in addition to the existing status family. |

**Cross-platform implementation (v4.2.20+).** Each of the four hooks ships in two forms: the `.sh` shown above (macOS/Linux) and a faithful `.ps1` port (Windows). `hooks.json` never names a `.sh`/`.ps1` directly – every command runs `bash "${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.sh" <hook>`, and `dispatch.sh` `exec`s the PowerShell sibling via `powershell.exe` on Windows (OS detected by `uname`; the script path is handed over in `cygpath -m` forward-slash form to dodge bash↔native quoting) or the bash sibling elsewhere. stdin/stdout/stderr/exit-code pass straight through, so exit 2 still blocks and stdout JSON is still honoured. This exists because Git Bash on Windows ships without `jq`, so the bash hooks parsed empty input and silently no-op'd there. The PowerShell ports use built-in `ConvertFrom-Json` (no `jq`), `-cmatch`/`-match` to mirror `grep -E`/`grep -iE` case sensitivity, and `(?m)` to preserve per-line `^`/`$` anchoring. A Windows host without Git Bash is uncovered (PowerShell can't launch `bash dispatch.sh`) – the same gap the prior `.sh`-only bundle had; see [`known-caveats.md`](known-caveats.md).

The bundle is project-agnostic by design – no hook reads any skill's content. Personal style preferences (worktree ban, en-dash policing, English-only, per-account budgets) live in user settings, not the plugin. Validated by Gate 14 (`scripts/gate-14-hooks.sh`), which now also asserts both siblings exist per dispatched hook and PowerShell-parses the `.ps1` files when a PowerShell interpreter is on PATH.

Slash commands (`commands/`) follow the same auto-discovery pattern as skills: drop a `.md` file with optional YAML frontmatter, Claude Code registers it as `/erfana:<name>`. Currently ships five: `doc-update` (v4.1+; v4.2.16+ safety/coverage/currency rewrite – live-change-set detection, full documentation-surface discovery, no git action by default; v5.1.0+ status/changelog eviction into home docs, whole-file necessity prune with `CHANGELOG`/ADR/`README` exempt, and `AskUserQuestion`-confirmed section/file removals), `project-status` (v4.2.5+; v4.2.8+ stakeholder rewrite; v4.2.9+ sentinel + dual-issue probe + DIP fix; v4.2.10+ hard length rule + mandatory Layer 2), `session-status` (v4.2.6+; v4.2.8+ stakeholder rewrite; v4.2.9+ sentinel + DIP fix; v4.2.10+ hard length rule + mandatory Layer 2), `lens-review` (v4.2.11+; v4.2.12+ PM-facing output redesign), and `explain-issue` (v4.2.14+). The two status commands and `explain-issue` share the same stakeholder register and hallucination guards but split on output shape and namespace:

- **Status family (`*-status`).** Both ship the same protocol shape: PO/PM/BA audience explicitly named, three outcome-shaped axes (**what we worked on / what we accomplished / where we landed**), two-layer recommended-next (stakeholder milestone sentence + italicised `Suggested first step:` hint for Claude), word budget ~175-220 / hard cap 280, and a hard hallucination-guards section (source attribution, no acronym expansion without evidence, no evaluative adverbs without evidence, quantifier grounding, status-label criteria, date discipline, grounded issue/PR translations, banned narrative phrases, an **abstract** inventory-negation rule that names no hook implementation in command prose per v4.2.9 DIP fix, confidence-calibration headline when state is partial). v4.2.10+ elevates two soft rules to hard ones: every support bullet has a hard 55-word ceiling with a ±15-word balance requirement across the three bullets, and Layer 2 is always emitted (the prior "skip when caught up" carve-out is removed; a new priority rung 5 in both commands covers post-release / smoke / MAINTAINER-checklist follow-ups so the caught-up rung becomes the genuine empty case, not the slip-prone default). Both templates end with a mandatory invisible `<!-- erfana:status-template -->` sentinel that `verify-completion.sh` keys on; Gate 16 enforces symmetry across the two status command files and the hook. `project-status` additionally fetches `gh issue view` / `gh pr view` for any issue or PR mentioned with a plain-language description so the translation is grounded, and (v4.2.9+) issues two `gh issue list` calls – one filtered to your assigned issues, one with no assignee filter – so the report covers both the personal todo and the full open-issue queue; `session-status` sources from in-context conversation with a light git probe.
- **Explain family (`explain-*`, v4.2.14+).** `explain-issue` takes one GitHub issue reference (bare number, `#N`, or full URL) and emits a single Pyramid-Principle brief pitched at the same PO/PM/BA audience. Deep input feeds translation (issue payload, last 3 comments, linked PRs, files and spec IDs referenced in the body, commits matching `#N`) but the rendered brief stays one PM/PO section with no engineering appendix – an explicit divergence from the dual-layer `lens-review` output. Classification chain (labels → Conventional-Commits title prefix → body heuristic → default `question`) adapts the three support axis labels per type; the family ships **without** a `Suggested next step` line because the stakeholder owns the action queue. Length is adaptive: at most 40% of the issue body word count, floor 120 words, hard cap 400; per-bullet ceiling 55 words with ±15-word balance (inherited from the v4.2.10 status-command lesson). Coverage is hybrid (silent on full data, `_Data note: …_` footer on material gaps, `Issue #N – state unclear, partial signals available` headline on ground-loss). Output ends with `<!-- erfana:explain-template -->`; Gate 16 enforces symmetry for the new sentinel across `commands/explain-issue.md` and the hook, reserving the literal for future `explain-*` siblings (a likely `explain-pr` mirrors the same shape). The namespace is hyphen-tagged – the `*-status` and `explain-*` suffixes group cleanly in autocomplete and stay open for additional siblings.

### Shared resources

- **`agents/` at plugin root** – 87 shared agents; flat directory of `*.md` files. Auto-discovered by Claude Code; orchestration skills delegate to them via the `Task` tool. Prefix breakdown: `spec-` (23), `mi-` (13), `ms-` (9), `ma-` (7), `article-` (5), `e2e-` (4), `fc-` (4), `release-` (2), `grill-` (1), tech-domain (`nest-*`, `react-*`, `solution-*`, etc., 6), UI/UX (4), generic-name (9; 15 under the broader no-team-prefix definition used in `SECURITY.md`). The 9 generic-name agents (`code-reviewer`, `commit-writer`, `software-developer`, etc.) carry collision risk with built-ins or other plugins (last-loaded wins) – see `SECURITY.md > Known limitations`.
- **No shared content bundle.** Since v7.0.0 every skill owns its own references, guides and templates. Content two skills both need is duplicated deliberately rather than hoisted – the skills are independent and a shared bundle would recouple them.

### Per-skill nested agents

One orchestration skill ships internal agents under `<skill>/agents/` scoped to its own lifecycle: `managing-reports/agents/` (11 files – the only such directory on disk). `managing-issues` and `managing-skills` define `agents/` paths in prose only and ship no nested directory. Per-skill nested-agent discovery is unverified against the published Claude Code plugin spec (which documents only plugin-root `agents/`); accepted-risk per `CHANGELOG.md` v4.0.0 and [`known-caveats.md`](known-caveats.md). The previously-predicted follow-up is now done: `managing-articles`'s 5 internal agents were hoisted to plugin root with disambiguating `article-*` prefixes in v4.3.0. If a remaining orchestration skill silently fails to find its internal agents in production use, the same hoist applies.

### Convention: subagents cannot call `AskUserQuestion`

`AskUserQuestion` is **not delivered to subagents spawned via the `Task`/Agent tool**, even when listed in the agent's `tools:` frontmatter (background subagents auto-deny the prompting call; foreground ones never receive it). An agent that calls it directly silently fails to gather input. The required pattern across every skill in this plugin:

- The **agent returns a structured set of proposed questions** (AskUserQuestion-shaped: `header`, `question`, `options`, one `recommended`, `multiSelect`) plus what it already extracted. It never calls `AskUserQuestion`.
- The **orchestrator** (the skill running in the main conversation) asks those questions via `AskUserQuestion`, batching at most 4 per call, then passes the answers back to the agent or carries them forward.
- A **skipped answer is valid** — record it and proceed; never loop re-asking the same question.

Canonical reference implementation: [`agents/ma-requirements-gatherer.md`](../agents/ma-requirements-gatherer.md). In `managing-issues` this is also stated as SKILL.md rule 7 (the `needs_user_input` contract) and the Context-preservation table. Compliant create-operation agents: `mi-issue-questioner` (proposes), `mi-requirements-analyzer` (proposes; fixed v4.2.13), `grill-planner` (plans the whole interview, never asks; v6.4.0 – supersedes the retired `ms-requirements-gatherer`, whose four CREATE requirement keys it preserves via `references/interview-taxonomy.md`). **Known remaining occurrences to migrate** (each requires its consuming skill's orchestration to ask, fixed in lockstep): `managing-articles/agents/{gather-article-requirements,generate-gemini-prompt,generate-research-prompt}.md` and `managing-reports/agents/gather-report-requirements.md`.

### Where new content goes – the rule

- **Reference prose** (how-to depth a skill body cannot carry) → `skills/<name>/references/foo.md`, or the skill's own `guides/` / `reference/` folder where that spelling is already established.
- **Templates** → `skills/<name>/templates/`.
- **Agent prompts** → plugin-root `agents/<prefix-name>.md` by default; `skills/<name>/agents/` only when the agent is tightly coupled to one skill's lifecycle.
- **Gate logic** → `scripts/`, with a matching detail file under `docs/gates/`.

Nothing is shared across skills. Gate 7 walks every cited path from each file's perspective and fails on broken links.

### Phase-requirements split-file pattern (v4.2.x convention)

Orchestration skills with multiple operations should split phase-requirements references by operation rather than concatenating into one file. v4.2.1 introduced the pattern in `managing-issues` (motivated by Rule #16 fragility); v4.2.2 made it canonical by extracting shared vocabulary to its own file. Reference shape:

- `reference/phase-requirements-shared.md` — capability vocab, domain vocab, criticality levels, allow_direct policy. All operation files cross-reference this equally (no implicit "implement is canonical" hierarchy).
- `reference/<operation>-phase-requirements.md` — one file per operation (`implement-`, `create-`, `review-`, `conditional-`).

The legacy single-file pattern (`reference/phase-requirements.md` containing both shared vocab and all operation phases) is **deprecated** as of v4.2.x. New skills should use the split pattern; existing skills with the single-file shape may migrate during their next Modernize pass. Documented in `skills/managing-skills/templates/phase-requirements-template.md`.

### File-cap fragility split pattern (v4.2.2 convention)

When a skill file approaches the Rule #16 ≤500-line cap, hoist a single most-cohesive section to a sibling file rather than refactoring the whole file. v4.2.2 V6 demonstrated three reference splits in `managing-issues`:

- `operations/review-compliance.md` — Compliance review mode workflow hoisted from `review.md` (482 → 454 lines, +46 buffer).
- `operations/implement-phases-overview.md` — Phases section hoisted from `implement.md` (469 → 207 lines, +293 buffer; the canonical per-phase detail still lives in `phases/0-12.md`).
- `reference/agents-reference-mi.md` — `mi-*` family agent details hoisted from `agents-reference-detail.md` (457 → 287 lines, +213 buffer).

The convention has held since. The `managing-issues` Implement hardening applied it twice more, in the same skill:

- `reference/run-state-resume.md` (245 lines) – the **read** side of the run-state block (fetch-time authorship filter, parser contract, resume rules) hoisted out of `reference/post-review-tracking.md`, which keeps the write side at 283 lines. The split is by responsibility, which is what kept both halves under the cap as the hardening grew them.
- `examples/implement-edge-cases.md` (237 lines) – edge-case walkthroughs split out of `examples/implement.md` (286 lines), which keeps the happy path and the gate summary table.

Sibling files cite their parent for navigability; Gate 7 enforces both directions **only where its globs reach** – neither of the two files above is inside its scan surface (see [`gates/07-cross-references.md`](gates/07-cross-references.md) `## Limitations`). Apply preemptively at 480+ lines rather than waiting for the 500-line BLOCKING failure.

## Cross-skill flow

The bootstrap (`skills/using-erfana/SKILL.md`) routes between the orchestration track and two single-skill branches: a process branch (`grill-me`, v4.2.3+) and a verification branch (`fact-checking`, v4.2.7+). Orchestration skills are independent of each other; the process branch is a leaf that may hand off to an orchestration skill when the user is ready to execute the locked plan.

### Orchestration flow

```
User intent → using-erfana (router)
                  │
                  └─ orchestration task?
                       │
                       ├─ agent lifecycle? → managing-agents
                       ├─ article (research → publish)? → managing-articles
                       ├─ GitHub issue (create / implement / review)? → managing-issues
                       ├─ consulting report? → managing-reports
                       ├─ skill lifecycle? → managing-skills
                       └─ specification (T1-T4)? → managing-specs
```

Orchestration skills are **independent** – they pick by domain, not by lifecycle stage of a shared deliverable. Each owns its own multi-phase workflow internally and delegates to agents in `agents/` and `<skill>/agents/` via the `Task` tool.

### Cross-skill composition

If a single conversation spans two skills (e.g. a spec and the issues that implement it), invoke them sequentially – the skill that locks the source material first, then the skill that consumes it. No skill invokes another; a skill that needs one prints the command and ends the turn.

## Adding a new sibling skill – checklist

1. **Pick the folder name**. Lowercase kebab-case. Use `managing-` for a lifecycle-management vertical (e.g. `skills/managing-feedback/`), or a domain prefix otherwise (e.g. `skills/research-summary/`). The folder name becomes the namespace suffix (`erfana:managing-feedback`).
2. **Create `skills/<name>/SKILL.md`** with frontmatter:
   - `name: <name>` (must match folder name; Gate 2 enforces).
   - `description:` one trigger sentence ("Use when..." form, third-person voice, ≤500 chars; Gate 2 warns above threshold).
   - `when_to_use:` multi-line trigger phrases (specific triggers per Anthropic; ≥3 quoted activation phrases is the plugin-convention Gate 2 v4.2.0+ heuristic for activation reliability, refined v4.2.1).
   - `allowed-tools:` minimal set.
   - Combined `description` + `when_to_use` ≤1,536 chars (Anthropic-documented truncation limit, Gate 2 v4.2.0+).
   - `disable-model-invocation: true` ONLY if the skill is user-invoked-only (currently `fact-checking`).
   - `effort:` and `model:` (v4.2.0+, optional but recommended for orchestrator skills): per the Model Selection Guide in `skills/managing-skills/templates/shared-agent-template.md`.
3. **Body structure** (per superpowers canonical order):
   - Core principle (one sentence)
   - When this skill applies / Out of scope
   - Process (numbered steps)
   - Anti-patterns
   - References + Assets (relative paths)
   - Examples
4. **References**: skill-internal docs go under `skills/<name>/{references,guides,reference,templates,validation,examples,phases,operations,workflows}/`. Cite nothing outside the skill's own folder except plugin-root `agents/`.
5. **Add agents (optional)**:
   - Plugin-root agents → `agents/<prefix-name>.md` (use a unique team prefix to avoid generic-name collisions; see `SECURITY.md > Known limitations`).
   - Skill-internal agents → `skills/<name>/agents/<agent-name>.md`. Discovery is unverified for nested location; prefer plugin-root unless agents are tightly coupled to one skill's lifecycle.
   - Each agent declares `effort:` + `model:` per Model Selection Guide (v4.2.0+, recalibrated for Claude 5 in v6.3.0, in `skills/managing-skills/templates/shared-agent-template.md`). Routine validators on `sonnet`+`low` are far cheaper than reviewers on `opus`+`high`; the savings compound across long workflows.
   - **Never** declare `temperature`, `top_p`, `top_k` (400 error on Claude Opus 4.7 and later per Anthropic's parameter-deprecation table) or fixed `thinking: {budget_tokens: N}` on Claude 5 models (Haiku 4.5 exempt) in agent code (Gate 2 + Section 13.3/13.4 BLOCKING).
6. **Update `skills/using-erfana/SKILL.md`** – add a row to the appropriate sub-table and to the Decision Flow.
7. **Update `README.md`** – add a row to the appropriate skills sub-table at the top.
8. **Update `CHANGELOG.md`** – entry under the next release describing the addition.
9. **Bump `version`** in both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` (same number).
9b. **Regenerate the skill registry** – `bash scripts/gen-skill-registry.sh` – and commit `docs/skill-registry.md`. Gate 18 hard-fails when the registry's skill list disagrees with `ls skills/`. The new skill's row reads `uncommitted` until its commit lands, after which Gate 18 warns (not blocks) until the next regeneration.
10. **Run `bash scripts/run-all-gates.sh`** – Gate 2 lists the new skill (and any added agents) and enforces frontmatter invariants; Gate 7 hard-fails on broken citations; Gate 15 hard-fails until every prose skills-count claim matches the filesystem.
11. **Open a PR** – CODEOWNERS auto-tags `@marcinobel`. Squash-merge via admin bypass per the documented release process.

## What this architecture deliberately does NOT include

- **MCP servers**. The plugin currently does not bundle MCP servers. If a future skill needs runtime tooling, document the MCP server in `.mcp.json` and update CI to validate it.
- **Project-level skills** (`.claude/skills/` in employee repos). The plugin is plugin-scope only. Personal/project skills override plugin skills per CC's scope precedence; that's documented in README troubleshooting, not enforced by this plugin.
- **Cross-skill coupling**. No skill depends on another. The single coupling point is the bootstrap router. A skill that would need a sibling's behaviour prints the sibling's command and ends the turn instead of invoking it.

Note on agents: v4.0.0 added `agents/` (75 files at the time, rising to 76 when v4.2.2 added `mi-issue-displayer` – both historical figures; the live count is the one stated at the top of this document) and per-skill nested agents. The architectural rule is that agents are an **implementation detail of orchestration skills** – they execute multi-phase work the orchestration skills break down via the `Task` tool. Adding a new agent does NOT require a `CLAUDE.md` update on its own; adding a new skill that delegates to agents does.

## See also

- [`CLAUDE.md`](../CLAUDE.md) – repository layout table, hard constraints, release process
- [`skill-registry.md`](skill-registry.md) – generated inventory of every shipped skill and the last commit that touched it; regenerate with `scripts/gen-skill-registry.sh`, policed by Gate 18.
- [`verification-gates.md`](verification-gates.md) – index for the 12 gates (all hard); per-gate detail under [`gates/`](gates/), one file per gate. Includes Gate 2 (frontmatter for skills + agents + Claude 5 model patterns incl. the reasoning-display detector with committed fixtures, v4.0+ extended v4.2.0+ and v6.3.0), Gate 7 (cross-references across skills + agents), Gate 14 (hooks valid, v4.1+), Gate 15 (doc-claim sync, v4.1.2+, extended v4.1.3+ to cover skills / hooks / slash command counts; v4.2.2 extended `docs_to_scan` to include `skills/using-erfana/SKILL.md` and `docs/verification-gates.md`), Gate 16 (verify-completion fixture replay + sentinel symmetry, v4.2.9+), Gate 17 (publication readiness, v6.0.0+), Gate 18 (skill-registry sync against git history – list drift and impossible dates hard, lagging dates warn, v6.6.1+)
- [`modernization-registry.md`](modernization-registry.md) – audit-trail of every skill that has been through the Modernize operation (v4.2.0+) – first pass, last pass, scope, score. Convention-enforced (not gated). Updated atomically with each Modernize pass.
- [`known-caveats.md`](known-caveats.md) – accepted risks from the v4.0.0 scope widening, v4.1.0 hooks migration, the 2026-05-17 v4.2.8 → v4.2.10 same-day release chain, and every later release that added one (generic-name agent collisions, unverified per-skill nested `agents/` discovery, skipped rc soaks, `~/.claude/` duplication, etc.). The running tally of no-staged-rollout overrides lives in that file's newest section – the last one in the file – and is not restated here. Extracted from CLAUDE.md to keep that file under the 40 KB recommended ceiling.
- [`../CHANGELOG.md`](../CHANGELOG.md) – release narrative including v4.0.0 widening + accepted-risk audit trail
- [`../ROADMAP.md`](../ROADMAP.md) – sequenced upcoming work
- [`../BACKLOG.md`](../BACKLOG.md) – items intentionally NOT on the roadmap, with reasoning
- [`MAINTAINER.md`](../MAINTAINER.md) – succession plan, signed-commits setup
- [obra/superpowers writing-skills](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md) – the canonical reference for skill-authoring conventions this plugin follows
- [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) – current SKILL.md frontmatter spec (April 2026)
