# Architecture – multi-domain plugin layout

How the erfana plugin is organized internally, and the conventions a maintainer must follow when adding or modifying skills and agents. The `CLAUDE.md` "Repository layout" table answers WHAT lives where; this document answers WHY and HOW.

## Two domains, one plugin (v4.0+)

The plugin shipped as a focused design toolkit through v3.2.0. v4.0.0 widened it into a **design + orchestration toolkit** by absorbing 87 shared agents (76 at v4.0.0 + 4 `fc-*` fact-checking quartet in v4.2.7 + 2 from the managing-issues Create-operation split in v4.2.13 + 5 `article-*` in v4.3.0) and 6 orchestrator skills from the maintainer's previously-global `~/.claude/` configuration. The marketplace identity stays primarily design (`category: design`), but the discovery surface now spans two flow-bearing tracks (design, orchestration) plus two single-skill branches: a process branch added in v4.2.3 (`grill-me`) and a verification branch added in v4.2.7 (`fact-checking`).

| Domain | Concern | Brand-system layer |
|---|---|---|
| **Design** | Visual deliverables (prototypes, slides, motion, infographics, direction-setting, critique) | Reads `skills/design-shared/brands/<active>/` at generation time |
| **Orchestration** | Lifecycle management for Claude Code artifacts (agents, articles, GitHub issues, consulting reports, skills, specs) | Brand-agnostic – does NOT read `design-shared/` |

The split is enforced at the bootstrap (`skills/using-erfana/SKILL.md`) – a top-level decision tier routes orchestration tasks before the design vague-brief check.

## Skill decomposition (v4.0+)

The v1 plugin shipped a single 800-line `erfana:design` skill that bundled six unrelated concerns (prototyping, slide decks, motion graphics, infographics, design direction, critique). v2.0 split that monolith into six purpose-built design sub-skills following the superpowers `writing-skills` rule "one skill, one well-defined behavior". v4.0 adds the orchestration tier alongside.

### Design skills (6)

| Sub-skill | Single concern |
|---|---|
| `erfana:design-direction` | Pick a visual style when none is set (vague-brief advisor) |
| `erfana:design-prototype` | Clickable UI mockup |
| `erfana:design-slides` | Presentation deck (HTML / PDF / PPTX) |
| `erfana:design-motion` | Timeline animation (MP4 / GIF + audio) |
| `erfana:design-infographic` | Print-grade data visualization |
| `erfana:design-review` | Post-delivery 5-dimension critique |

### Orchestration skills (6, v4.0+)

| Sub-skill | Single concern |
|---|---|
| `erfana:managing-agents` | Claude Code agent lifecycle (research → design → validation) |
| `erfana:managing-articles` | Medium-form article authoring (research → outline → draft → publish), bilingual Polish/English. Delegates to 5 plugin-root `article-*` agents. |
| `erfana:managing-issues` | GitHub-issue lifecycle (create / multi-phase implement / review code / display read-only `show issue` / `list issues` / `find issues with label X` modes added v4.2.2) |
| `erfana:managing-reports` | Consulting reports with Pyramid Principle, SCQA, Five Cs. Ships 11 internal validation agents. |
| `erfana:managing-skills` | Claude Code skill lifecycle including the **Modernize operation** (v4.2.0+) that applies Opus 4.7 patterns to existing skills via ms-reviewer → user approval → ms-modifier (`change_type: modernize`) → ms-validator. Audit-trail per skill: [`modernization-registry.md`](modernization-registry.md). |
| `erfana:managing-specs` | 4-tier specification management (T1 issue → T4 standard). Delegates to plugin-root `spec-*` agents. |

### Process skills (1, v4.2.3+)

| Sub-skill | Single concern |
|---|---|
| `erfana:grill-me` | Interview the user one question at a time, walking the decision tree with a recommended answer per branch; reads the codebase when the answer is encoded there. Imported verbatim from upstream `superpowers:grill-me`, schema-adapted for plugin frontmatter (split `description` + `when_to_use`, added `allowed-tools`). Brand-agnostic. |

### Verification skills (1, v4.2.7+)

| Sub-skill | Single concern |
|---|---|
| `erfana:fact-checking` | Validate markdown analysis documents against source materials by extracting atomic factual claims, tracing each to its source passage, classifying findings by severity (Critical / Error / Warning / Info), and applying user-approved corrections. Five-phase orchestrator (Setup → Extraction → Verification → Interactive review → Fix application) backed by four `fc-*` plugin-root agents. Manual-only via `/erfana:fact-checking <target-file>` (`disable-model-invocation: true`); not auto-discovered. Phase 3.1 implements adaptive fan-out (sequential single-call below ~50 claims; orchestrator-side parallel batching of ~25-claim chunks capped at ~8 workers, run in waves, at ≥50 claims) that reconciles by dispatched claim id and re-dispatches only failed/partial chunks (v4.6.0). All ingested document/source text is treated as untrusted data, and fix application anchors on verbatim text. Migrated from a prior Qodeca consulting project, Modernize-passed in v4.2.7, and lens-review-hardened in v4.6.0. Brand-agnostic. |

### Bootstrap (1)

`erfana:using-erfana` – auto-loaded meta-router. Top-level decision (orchestration vs design vs process vs verification) before sub-skill dispatch. Brand-context section is design-only.

Each sub-skill `SKILL.md` stays trigger-shaped (frontmatter `description:` is a "Use when..." statement, ≤500 chars per Gate 2 soft-warn). Adding a new skill in either domain repeats the pattern.

## Repository layout (v4.0+)

```
erfana-skills/
├── .claude-plugin/
│   ├── plugin.json          ← name=erfana, version=X.Y.Z (live: see CLAUDE.md banner)
│   └── marketplace.json     ← marketplace catalog
├── agents/                  ← 87 shared agents (v4.0+, +4 fc-* in v4.2.7, +2 Create-split in v4.2.13, +5 article-* in v4.3.0); flat directory; Claude Code auto-discovers
├── skills/
│   ├── design-direction/    ← own SKILL.md + references/
│   ├── design-prototype/
│   ├── design-slides/
│   ├── design-motion/
│   ├── design-infographic/  ← no own references; pulls from design-shared + design-direction
│   ├── design-review/
│   ├── managing-agents/     ← orchestration skill (v4.0+); guides/, templates/, validation/
│   ├── managing-articles/   ← references/, templates/ (delegates to 5 plugin-root article-* agents; no nested agents or workflows as of v4.3.0)
│   ├── managing-issues/     ← phases/, operations/, reference/, templates/, validation/
│   ├── managing-reports/    ← ships 11 internal validation agents; reference/, templates/
│   ├── managing-skills/     ← guides/, templates/, validation/, examples/
│   ├── managing-specs/      ← templates/ (T1-T4), validation/, examples/, guides/
│   ├── grill-me/            ← process skill (v4.2.3+); SKILL.md only, no references
│   ├── using-erfana/        ← bootstrap meta-router
│   └── design-shared/       ← design-only shared bundle
│       ├── assets/          ← jsx, sfx, bgm, showcases, banner.svg
│       ├── demos/           ← 10 capability demo HTMLs
│       ├── scripts/         ← export pipeline (render-video.js, export_deck_*.mjs)
│       ├── references/      ← workflow, content-guidelines, design-context, verification
│       ├── brands/          ← multi-brand manifests + DTCG tokens (v2.3+, see below)
│       └── test-prompts.json
├── hooks/                   ← four safety hooks (.sh + .ps1 siblings) + dispatch.sh launcher + hooks.json wiring (v4.1+; cross-platform v4.2.20+)
├── commands/                ← slash commands (v4.1+: doc-update; v4.2.5+: project-status; v4.2.6+: session-status; v4.2.11+: lens-review; v4.2.14+: explain-issue)
├── scripts/                 ← run-all-gates.sh, gate-12-brand-manifests.sh, gate-14-hooks.sh, gate-16-hook-fixtures.sh, ...
├── tests/                   ← maintainer test fixtures (v4.2.9+ adds tests/hooks/verify-completion/*.json)
└── docs/
    ├── architecture.md      ← this document
    ├── verification-gates.md← index for the 17 gates
    └── gates/               ← 16 per-gate detail files (v4.1.3+: 01-cjk.md … 15-doc-claims.md; v4.2.9+ adds 16-hook-fixtures.md)
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

The bundle is **brand-agnostic** by design – no hook reads `design-shared/` or any brand manifest. Personal style preferences (worktree ban, en-dash policing, English-only, per-account budgets) live in user settings, not the plugin. Validated by Gate 14 (`scripts/gate-14-hooks.sh`), which now also asserts both siblings exist per dispatched hook and PowerShell-parses the `.ps1` files when a PowerShell interpreter is on PATH.

Slash commands (`commands/`) follow the same auto-discovery pattern as skills: drop a `.md` file with optional YAML frontmatter, Claude Code registers it as `/erfana:<name>`. Currently ships five: `doc-update` (v4.1+; v4.2.16+ safety/coverage/currency rewrite – live-change-set detection, full documentation-surface discovery, no git action by default; v5.1.0+ status/changelog eviction into home docs, whole-file necessity prune with `CHANGELOG`/ADR/`README` exempt, and `AskUserQuestion`-confirmed section/file removals), `project-status` (v4.2.5+; v4.2.8+ stakeholder rewrite; v4.2.9+ sentinel + dual-issue probe + DIP fix; v4.2.10+ hard length rule + mandatory Layer 2), `session-status` (v4.2.6+; v4.2.8+ stakeholder rewrite; v4.2.9+ sentinel + DIP fix; v4.2.10+ hard length rule + mandatory Layer 2), `lens-review` (v4.2.11+; v4.2.12+ PM-facing output redesign), and `explain-issue` (v4.2.14+). The two status commands and `explain-issue` share the same stakeholder register and hallucination guards but split on output shape and namespace:

- **Status family (`*-status`).** Both ship the same protocol shape: PO/PM/BA audience explicitly named, three outcome-shaped axes (**what we worked on / what we accomplished / where we landed**), two-layer recommended-next (stakeholder milestone sentence + italicised `Suggested first step:` hint for Claude), word budget ~175-220 / hard cap 280, and a hard hallucination-guards section (source attribution, no acronym expansion without evidence, no evaluative adverbs without evidence, quantifier grounding, status-label criteria, date discipline, grounded issue/PR translations, banned narrative phrases, an **abstract** inventory-negation rule that names no hook implementation in command prose per v4.2.9 DIP fix, confidence-calibration headline when state is partial). v4.2.10+ elevates two soft rules to hard ones: every support bullet has a hard 55-word ceiling with a ±15-word balance requirement across the three bullets, and Layer 2 is always emitted (the prior "skip when caught up" carve-out is removed; a new priority rung 5 in both commands covers post-release / smoke / MAINTAINER-checklist follow-ups so the caught-up rung becomes the genuine empty case, not the slip-prone default). Both templates end with a mandatory invisible `<!-- erfana:status-template -->` sentinel that `verify-completion.sh` keys on; Gate 16 enforces symmetry across the two status command files and the hook. `project-status` additionally fetches `gh issue view` / `gh pr view` for any issue or PR mentioned with a plain-language description so the translation is grounded, and (v4.2.9+) issues two `gh issue list` calls – one filtered to your assigned issues, one with no assignee filter – so the report covers both the personal todo and the full open-issue queue; `session-status` sources from in-context conversation with a light git probe.
- **Explain family (`explain-*`, v4.2.14+).** `explain-issue` takes one GitHub issue reference (bare number, `#N`, or full URL) and emits a single Pyramid-Principle brief pitched at the same PO/PM/BA audience. Deep input feeds translation (issue payload, last 3 comments, linked PRs, files and spec IDs referenced in the body, commits matching `#N`) but the rendered brief stays one PM/PO section with no engineering appendix – an explicit divergence from the dual-layer `lens-review` output. Classification chain (labels → Conventional-Commits title prefix → body heuristic → default `question`) adapts the three support axis labels per type; the family ships **without** a `Suggested next step` line because the stakeholder owns the action queue. Length is adaptive: at most 40% of the issue body word count, floor 120 words, hard cap 400; per-bullet ceiling 55 words with ±15-word balance (inherited from the v4.2.10 status-command lesson). Coverage is hybrid (silent on full data, `_Data note: …_` footer on material gaps, `Issue #N – state unclear, partial signals available` headline on ground-loss). Output ends with `<!-- erfana:explain-template -->`; Gate 16 enforces symmetry for the new sentinel across `commands/explain-issue.md` and the hook, reserving the literal for future `explain-*` siblings (a likely `explain-pr` mirrors the same shape). The namespace is hyphen-tagged – the `*-status` and `explain-*` suffixes group cleanly in autocomplete and stay open for additional siblings.

### Two layered shared resources

- **`agents/` at plugin root** – 87 shared agents; flat directory of `*.md` files. Auto-discovered by Claude Code; orchestration skills delegate to them via the `Task` tool. Prefix breakdown: `spec-` (23), `mi-` (13), `ms-` (10), `ma-` (7), `article-` (5), `e2e-` (4), `fc-` (4), `release-` (2), tech-domain (`nest-*`, `react-*`, `solution-*`, etc., 6), UI/UX (4), generic-name (9). The 9 generic-name agents (`code-reviewer`, `commit-writer`, `software-developer`, etc.) carry collision risk with built-ins or other plugins (last-loaded wins) – see `SECURITY.md > Known limitations`.
- **`skills/design-shared/` bundle** – design-only shared content. Not a skill (no SKILL.md). Invisible to auto-discovery. Deduplicates content design sub-skills would otherwise copy. Orchestration skills do NOT consume `design-shared/`.

### Per-skill nested agents

Three orchestration skills ship internal agents under `<skill>/agents/` that are scoped to that skill's lifecycle: `managing-reports/agents/` (11), `managing-issues/agents/` (0 today; the skill defines `agents/` paths in prose only), `managing-skills/agents/` (0 today). Per-skill nested-agent discovery is unverified against the published Claude Code plugin spec (which documents only plugin-root `agents/`); accepted-risk per `CHANGELOG.md` v4.0.0 and [`known-caveats.md`](known-caveats.md). The previously-predicted follow-up is now done: `managing-articles`'s 5 internal agents were hoisted to plugin root with disambiguating `article-*` prefixes in v4.3.0. If a remaining orchestration skill silently fails to find its internal agents in production use, the same hoist applies.

### Convention: subagents cannot call `AskUserQuestion`

`AskUserQuestion` is **not delivered to subagents spawned via the `Task`/Agent tool**, even when listed in the agent's `tools:` frontmatter (background subagents auto-deny the prompting call; foreground ones never receive it). An agent that calls it directly silently fails to gather input. The required pattern across every skill in this plugin:

- The **agent returns a structured set of proposed questions** (AskUserQuestion-shaped: `header`, `question`, `options`, one `recommended`, `multiSelect`) plus what it already extracted. It never calls `AskUserQuestion`.
- The **orchestrator** (the skill running in the main conversation) asks those questions via `AskUserQuestion`, batching at most 4 per call, then passes the answers back to the agent or carries them forward.
- A **skipped answer is valid** — record it and proceed; never loop re-asking the same question.

Canonical reference implementation: [`agents/ma-requirements-gatherer.md`](../agents/ma-requirements-gatherer.md). In `managing-issues` this is also stated as SKILL.md rule 7 (the `needs_user_input` contract) and the Context-preservation table. Compliant create-operation agents: `mi-issue-questioner` (proposes), `mi-requirements-analyzer` (proposes; fixed v4.2.13). **Known remaining occurrences to migrate** (each requires its consuming skill's orchestration to ask, fixed in lockstep): `managing-articles/agents/{gather-article-requirements,generate-gemini-prompt,generate-research-prompt}.md` and `managing-reports/agents/gather-report-requirements.md`.

### Where new content goes – the rule

- **Skill-specific reference** (only one sub-skill reads it) → `skills/<sub-skill>/references/foo.md`. Examples: `slide-decks.md` and `transitions.md` live only under `design-slides/references/` because no other sub-skill ships slide decks or live in-browser transitions.
- **Cross-cutting reference** (≥2 sub-skills read it, OR every output skill needs it) → `skills/design-shared/references/foo.md`. Example: `workflow.md` (Junior Designer mode, question templates) is invoked by every output skill.
- **Skill-specific asset** → `skills/<sub-skill>/assets/`. Currently no sub-skill has its own assets – everything lives in `design-shared/assets/`. If a future skill needs proprietary assets (e.g., a 3D model only `erfana:design-3d` uses), put them in that skill's folder.
- **Cross-cutting asset** → `skills/design-shared/assets/`. Default for the v2.0 audit-trail.
- **Demo HTML** → `skills/design-shared/demos/`. All demos live in one place, indexed by which skill they illustrate (c1=prototype, c2=slides, c3=motion, c5=infographic, c6=review, w1–w3=workflow).
- **Script** → `skills/design-shared/scripts/`. Even motion-only scripts (`render-video.js`) live here; co-locating them keeps the export pipeline navigable as one unit.

When a sub-skill references shared content, the path is relative to the skill's directory: `../design-shared/assets/animations.jsx`. Gate 7 walks every cited path from each skill's perspective and fails on broken links.

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

Sibling files cite their parent for navigability; Gate 7 enforces both directions. Apply preemptively at 480+ lines rather than waiting for the 500-line BLOCKING failure.

## The brand-system layer (v2.3+)

`skills/design-shared/brands/` is a **data layer**, not a skill. It holds one folder per brand, where each folder is a self-contained, drop-in-replaceable bundle (manifest + DTCG tokens + voice / illustration prose + logo SVGs + photo slot). Discovery is by **convention**: a folder is a brand iff it contains `brand.json` matching `brand.schema.json`. The same convention as skill auto-discovery, applied to brand data.

### Why a layer, not inline literals

Pre-v2.3, brand colors / watermark / typography were referenced inline in skill prose (`Created with <brand>` literals in `design-motion`, hex codes in `using-erfana`). That made adding a second brand a cross-cutting edit. v2.3 introduced a single source of truth so adding brand #2 is a folder copy plus a one-line allowlist append – no skill code changes.

### The contract

- **`brand.json`** – manifest covering legal name, version, logos, typography, voice / tone, watermark, imagery refs, optional `tokensContract`. Schema is `brand.schema.json` v1.3 (JSON Schema 2020-12). v1.2 added three optional `imagery.*` directory pointers (`backgroundLibrary`, `shapeLibrary`, `templateLibrary`) mirroring the existing `photoLibrary` pattern; v1.3 adds optional `imagery.logoLibrary` so logos join the same vocabulary and Gate 12's per-library `INDEX.md` cross-checks treat all asset libraries uniformly. Backward-compatible with v1.2 manifests. Validated by Gate 12.
- **`tokens.tokens.json`** – W3C DTCG Format Module 2025.10. Wrapped under a top-level brand-id group (DTCG conformance for root-level `$description`). Three-tier model: primitives → semantic-role aliases → component (deferred). Aliases use `{erfana.color.indigo}` syntax; Gate 12 walks composite `$value`s and resolves every alias.
- **`ACTIVE_BRAND`** – single-line text file naming the active brand id. Default content: `erfana`. Sub-skills read this at HTML-generation time; `render-video.js` does not – the watermark literal is inlined into the HTML before recording. Runtime resolver in the export pipeline is deferred to v2.4.
- **`PRODUCTION_BRANDS`** – Python list inside `scripts/gate-12-brand-manifests.sh`. Currently `["erfana"]`. `example-acme` is intentionally absent (placeholder).
- **Default tokens contract** – every brand MUST expose `<id>.color.brand.{primary,accent,surface-dark,text-light}` and `<id>.typography.fontFamily.{primary,display,mono}` (encoded in Gate 12; brands may override via the `tokensContract` field). This is the LSP-substitutability guarantee.
- **Templates exemption (v1.2)** – SVGs under any path segment named `templates` (e.g., `<id>/templates/slides/covers/mockup.svg`) bypass Gate 5's script / foreignObject / external-href content rules. Templates are reference material – slide masters, layout sketches – never loaded by `render-video.js`, so the runtime-injection threat model does not apply. The exemption is folder-name based and auditable in PR diffs. The default `erfana` brand ships no template library, so the exemption is currently dormant.
- **Per-brand `CLAUDE.md`** – every non-exempt brand ships a `CLAUDE.md` at its folder root. This is the prose Claude entry point: brand-identity recap, asset-library catalog with `INDEX.md` pointers, when-to-consult-what guidance per deliverable type (slide deck / prototype / motion / infographic), hard caveats the manifest cannot express (Polish placeholder strings, AI-rendered photo flags, baked-in dark backdrops, etc.), and a manifest source-of-truth pointer. Sub-skills do NOT couple to brand specifics; they read the active brand's `CLAUDE.md` through the bootstrap (`skills/using-erfana/SKILL.md`) and follow its `INDEX.md` pointers from there. Adding a new brand or asset library requires zero edits to any `design-*` sub-skill. The `erfana/CLAUDE.md` is the default worked example.
- **Per-library `INDEX.md`** – every `imagery.*Library` root plus the `logo/` folder ships an `INDEX.md` catalog at its root. Three-column markdown tables (`File | What's on it | When to use`) plus a prose intro and a footer with `Version` / `Created` / `Applies to` lines. Subfolders one level deep MAY ship their own leaf catalog (e.g. `templates/slides/INDEX.md` while `templates/INDEX.md` is a thin pointer). New or substantially-modified `INDEX.md` files MUST go through the **two-reviewer review protocol** (parallel independent reviewers, blind from each other; image rendering trumps source grep when the SVGs use rasterized text inside `<image>` blocks – see `brands/README.md` for the prompt template and divergence-resolution rule). Gate 12 validates presence + bidirectional cross-checks (every cite resolves; every file in tree is mentioned) + the brand's `CLAUDE.md` references at least one `INDEX.md` per library.
- **Per-library `RULES.md` (v0.4.0+)** – brandbook-derived deep prose for selected asset libraries (logo construction grids, photography compositional rules, shape geometric modules, forbidden uses). Co-located with `INDEX.md` at the library root. Optional: a library ships one only when the brandbook has rules that govern on-brand use of those assets beyond what `INDEX.md` already catalogues. The default `erfana` brand is logo-only with no brandbook, so it ships no `RULES.md`; the mechanism stays in the schema for brands that bring brandbook-derived rules. Symmetric architectural invariants enforced by Gate 12: every `RULES.md` MUST be cited by its sibling `INDEX.md` (Direction B of the bidirectional check) AND by the brand-root `CLAUDE.md` (closes the third edge so RULES.md cannot be silently orphaned regardless of which path a sub-skill takes). Discoverable through the bootstrap (`skills/using-erfana/SKILL.md`), which enumerates `<library>/RULES.md` in both the per-file priority list and the read-order line.

### The validator

`scripts/_lib/json_schema_lite.py` is a stdlib-only minimal JSON Schema 2020-12 validator (~125 lines, supports `type` / `required` / `properties` / `additionalProperties` / `items` / `pattern` / `minLength` / `maxLength` / `enum` / `const` / `oneOf` / `anyOf` / `minimum` / `maximum`). It exists to avoid a `jsonschema` pip dependency that would fight the zero-dependency posture of every other gate. Gate 12 delegates shape validation to it; cross-file invariants (id == folder, path-traversal guard, alias resolution, tokensContract enforcement, ACTIVE_BRAND check, PRODUCTION_BRANDS allowlist) live in the gate script.

### Where new brand data goes – the rule

- **New brand** → `skills/design-shared/brands/<id>/` (folder copy from `example-acme/` for the minimal scaffold, or `erfana/` for the default logo-only worked example). Author `<id>/CLAUDE.md` and one `INDEX.md` per declared `imagery.*Library` and the `logo/` folder; audit each `INDEX.md` with the two-reviewer protocol. Add the id to `PRODUCTION_BRANDS` in the gate script if it's a production brand.
- **New brand-shaped contract field** (e.g., schema v1.3 adds `imagery.logoLibrary`) → bump `brand.schema.json` `$comment` version, document in the schema's description, optionally add a migration script under `scripts/migrate-brand-manifest.py` (tracked as roadmap item).
- **New asset library inside an existing brand** (e.g. a brand wants to ship `iconLibrary` someday) → add the field to `brand.schema.json`, declare it in the brand's `brand.json`, ship an `INDEX.md` at the new directory's root, and add a pointer row to that brand's `CLAUDE.md` table. Gate 12 then enforces presence + cross-checks automatically.
- **New `RULES.md` for an existing library** → drop a `RULES.md` next to that library's `INDEX.md`. Cite it from `INDEX.md` (a `### See also` subsection with a backtick-wrapped path satisfies the Gate 12 file→cite check) AND from the brand-root `CLAUDE.md` (a markdown link to the relative path satisfies the new RULES.md ↔ CLAUDE.md symmetry check added in v0.4.0). Footer should cite the brandbook page numbers + screenshot paths so a reviewer can audit-trail the source.
- **New consumer** (a skill that reads brand data) → cite `../design-shared/brands/<id>/CLAUDE.md` (NOT direct asset paths) from the skill's References section. Gate 7 verifies the cited path exists. Sub-skills should reach brand specifics only through the brand's `CLAUDE.md`, never by hardcoding asset paths.
- **New brandbook revision** (source PDFs, OCR markdown, page screenshots) → drop into `brands/<id>/brandbook/` following the conventions in that folder's `CLAUDE.md` (`<brand>-brandbook-<year>-<lang>.pdf`, `*.ocr.md` infix for OCR derivatives, `screenshots/<pdf-basename>/page-NNN.png` for rasters). The brandbook is provenance only – maintainers consult it when authoring or revising brand prose; sub-skills do NOT read it. The folder is exempt from `INDEX.md` cross-checks (Gate 12) because it is not an asset library, but `*.md` files inside it are still in scope for Gate 1 (CJK ban).

### Architectural decoupling

The brand-system layer enforces a strict decoupling: sub-skills (`design-prototype`, `design-slides`, `design-motion`, `design-infographic`) contain ZERO references to specific brands, asset paths, or `INDEX.md` files. The single coupling point is the bootstrap (`skills/using-erfana/SKILL.md`), which generically tells Claude to read `brands/<active>/CLAUDE.md` before generating brand-styled artwork. Read order at generation time: `ACTIVE_BRAND` → `brand.json` (programmatic values) → `CLAUDE.md` (prose guidance, asset catalogs) → `tokens.tokens.json` / `voice.md` / `illustration.md` (when the brand ships one) as needed → relevant `INDEX.md` files cited by `CLAUDE.md` (specific assets). This is what allows a new brand to land via folder-copy with no sub-skill edits, and what keeps the per-brand caveat surface (Polish UI strings, AI-rendered photos, baked-in backdrops, etc.) localised to the brand's own `CLAUDE.md` rather than leaking into every sub-skill.

The brand-system pattern is documented end-to-end in `skills/design-shared/brands/README.md`. The architectural reasoning (above) belongs here; the contract details belong there. The optional `brandbook/` subfolder (source PDFs + OCR + screenshots) is explicitly OUT of the bootstrap read order – it is provenance for maintainers, not runtime brand data; documented per-folder by `brands/<id>/brandbook/CLAUDE.md` where present.

## Per-deliverable folder convention (v3.1.0+)

Output skills produce a deliverable folder. Two conventions hold across the design-* family:

- **Local asset isolation**. The deliverable folder owns its assets. For `design-slides` this is the per-deck `assets/{logo,backgrounds,photos,shapes}/` subtree, populated by copying from the active brand bundle at deliverable-setup time. Slide HTML and CSS reference `../assets/...` exclusively – never `skills/design-shared/brands/<brand-id>/...`. This makes the deliverable portable when zipped, opened on another machine, or detached from the plugin tree. Other output skills should adopt the same pattern; the rule is documented in `skills/design-slides/references/slide-decks.md` § "Per-deck `assets/` folder is mandatory".
- **Verification-screenshot cleanup**. Visual-verification PNGs use a leading underscore (`_v3-NN.png`, `_review-NN.png`, `_preflight-NN.png`) so the cleanup glob `find . -name '_*.png' -delete` is unambiguous and never deletes brand assets (which never start with underscore). Run before declaring the deliverable done. Documented in `skills/design-shared/references/verification.md` § Cleanup.

The `tests/` directory at the repo root is the maintainer's scratch space for these deliverables – one subfolder per output-producing skill, holding sample decks that demonstrate compliance with the v3.1.0 brand+skill rules. Tests are not loaded by CI; the gates only scan `skills/`, `.claude-plugin/`, and the top-level docs.

## Per-slide independent review (design-slides v3.1.0+)

`design-slides` step 5b dispatches one fresh `general-purpose` Task subagent per slide in parallel. The reviewer reads only that slide's HTML and the active brand's `CLAUDE.md` and returns ranked Keep / Fix bullets covering: brand-token compliance, font floor (≥20 px), footer uniformity, logo presence, hierarchy contrast, opacity rules, letter-spacing, ALL-CAPS, 8 px grid alignment, and no-text-only-slides. The orchestrator MUST apply Fix items before declaring the deck ready – this is a verification gate, not a feedback request. Other output skills (motion, prototype, infographic) may adopt the same pattern; the canonical implementation is `skills/design-slides/SKILL.md` step 5b.

## Cross-skill flow

The bootstrap (`skills/using-erfana/SKILL.md`) routes between two flow-bearing tracks (design and orchestration) plus a single-skill process branch (`grill-me`, v4.2.3+). Within design, sub-skills hand off to siblings explicitly via "Terminal state" sections; orchestration skills are independent of each other; the process branch is a leaf that may hand off to either flow when the user is ready to execute the locked plan.

### Design flow

```
User intent → using-erfana (router)
                  │
                  ├─ vague? → design-direction
                  │              ↓ (after style locked)
                  │           design-prototype | -slides | -motion | -infographic
                  │              ↓ (after delivery, if user asks)
                  │           design-review
                  │
                  └─ specific? → design-{prototype,slides,motion,infographic} directly
                                    ↓
                                 design-review (user-invoked)
```

Each design sub-skill's body ends with a "Terminal state" section naming the next skill. Example from `design-prototype/SKILL.md`:

> After delivering a prototype, if the user mentions reviewing it, dispatch to `erfana:design-review`. If they want a slide deck explaining the prototype, dispatch to `erfana:design-slides`.

`erfana:design-review` is `disable-model-invocation: true` – it never auto-fires. The user must explicitly request it. This prevents Claude from volunteering critiques unsolicited.

`erfana:design-direction` is the inverse – it auto-fires on vague briefs. It always dispatches forward to a specific output skill once a direction is locked.

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

### Cross-flow composition

If a single conversation needs both a design deliverable and an orchestration task (e.g. a slide deck about a spec), invoke the skills sequentially – the orchestration skill first to lock the source material, then the design skill to render it. The bootstrap's decision tier surfaces orchestration triggers before design triggers, so an explicit orchestration mention gets priority.

## Adding a new sibling skill – checklist

The shared skeleton applies to both domains; the differences (which references to cite, which gates to update, whether the skill consumes the brand-system layer) are flagged inline.

1. **Pick the folder name**. Lowercase kebab-case. Prefix by domain: `design-` for a design vertical (e.g. `skills/design-3d/`), `managing-` for an orchestration vertical (e.g. `skills/managing-feedback/`), or domain-prefixed otherwise (e.g. `skills/research-summary/`). The folder name becomes the namespace suffix (`erfana:design-3d`, `erfana:managing-feedback`).
2. **Create `skills/<name>/SKILL.md`** with frontmatter:
   - `name: <name>` (must match folder name; Gate 2 enforces).
   - `description:` one trigger sentence ("Use when..." form, third-person voice, ≤500 chars; Gate 2 warns above threshold).
   - `when_to_use:` multi-line trigger phrases (specific triggers per Anthropic; ≥3 quoted activation phrases is the plugin-convention Gate 2 v4.2.0+ heuristic for activation reliability, refined v4.2.1).
   - `allowed-tools:` minimal set.
   - Combined `description` + `when_to_use` ≤1,536 chars (Anthropic-documented truncation limit, Gate 2 v4.2.0+).
   - `disable-model-invocation: true` ONLY if the skill is user-invoked-only (currently `design-review`).
   - `effort:` and `model:` (v4.2.0+, optional but recommended for orchestrator skills): per the Model Selection Guide in `skills/managing-skills/templates/shared-agent-template.md`.
3. **Body structure** (per superpowers canonical order):
   - Core principle (one sentence)
   - When this skill applies / Out of scope
   - Process (numbered steps)
   - Anti-patterns
   - References + Assets (relative paths)
   - Examples
   - **Terminal state** (design only) – name which sibling to invoke next. Orchestration skills typically don't dispatch forward; they own their full lifecycle.
4. **References**:
   - **Design skill** – skill-specific → `skills/<name>/references/foo.md`; cross-cutting → reuse `skills/design-shared/references/`. Cite the active brand's `CLAUDE.md` for brand-styled artwork.
   - **Orchestration skill** – skill-internal docs go under `skills/<name>/{guides,reference,templates,validation,examples,phases,operations,workflows}/`. Brand-agnostic – do NOT cite `design-shared/`.
5. **Add agents (orchestration only, optional)**:
   - Plugin-root agents → `agents/<prefix-name>.md` (use a unique team prefix to avoid generic-name collisions; see `SECURITY.md > Known limitations`).
   - Skill-internal agents → `skills/<name>/agents/<agent-name>.md`. Discovery is unverified for nested location; prefer plugin-root unless agents are tightly coupled to one skill's lifecycle.
   - Each agent declares `effort:` + `model:` per Model Selection Guide (v4.2.0+, in `skills/managing-skills/templates/shared-agent-template.md`). Routine validators on `sonnet`+`medium` are ~10x cheaper than orchestrators on `opus`+`xhigh`.
   - **Never** declare `temperature`, `top_p`, `top_k`, or fixed `thinking: {budget_tokens: N}` in agent code (Gate 2 + Section 13.3/13.4 BLOCKING — Opus 4.7 returns 400 error per Anthropic migration guide).
6. **Update `skills/using-erfana/SKILL.md`** – add a row to the appropriate sub-table (Design or Orchestration) and to the Decision Flow.
7. **Update `README.md`** – add a row to the appropriate skills sub-table at the top.
8. **Update `CHANGELOG.md`** – entry under the next release describing the addition.
9. **Bump `version`** in both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` (same number).
10. **Run `bash scripts/run-all-gates.sh`** – Gate 2 lists the new skill (and any added agents) and enforces invariants; Gate 7 hard-fails on broken citations; Gate 8 (design-only, `skills/design-*/SKILL.md` glob) hard-fails if a new design skill's `description:` + `when_to_use:` text doesn't keep all 6 design categories covered. Orchestration skills do NOT trip Gate 8. If a new design skill introduces a brand-new task type (e.g. `design-3d`), update Gate 8's `categories` dict in the runner before opening the PR.
11. **Open a PR** – CODEOWNERS auto-tags `@marcinobel`. Squash-merge via admin bypass per the documented release process.

## What this architecture deliberately does NOT include

- **MCP servers**. The plugin currently does not bundle MCP servers. If a future skill needs runtime tooling (e.g., a Figma fetcher), document the MCP server in `.mcp.json` and update CI to validate it.
- **Project-level skills** (`.claude/skills/` in employee repos). The plugin is plugin-scope only. Personal/project skills override plugin skills per CC's scope precedence; that's documented in README troubleshooting, not enforced by this plugin.
- **Cross-domain coupling**. Design skills do not depend on orchestration skills, and vice versa. The single coupling point is the bootstrap router. A future skill that genuinely spans both domains should be split into a design half and an orchestration half rather than centralised – this keeps the brand-system carve-out clean and prevents orchestration logic from leaking into the design path or vice versa.

Note on agents: v4.0.0 added `agents/` (75 shared at the time; 76 since v4.2.2 added `mi-issue-displayer`) and per-skill nested agents. The architectural rule is that agents are an **implementation detail of orchestration skills** – they execute multi-phase work the orchestration skills break down via the `Task` tool. Adding a new agent does NOT require a `CLAUDE.md` update on its own; adding a new skill that delegates to agents does.

## See also

- [`CLAUDE.md`](../CLAUDE.md) – repository layout table, hard constraints, release process
- [`verification-gates.md`](verification-gates.md) – index for the 17 gates (16 hard + 1 soft); per-gate detail under [`gates/`](gates/), one file per gate. Includes Gate 2 (frontmatter for skills + agents + Opus 4.7 patterns, v4.0+ extended v4.2.0+), Gate 7 (cross-references across skills + agents + brand prose), Gate 12 (brand-manifest validation incl. RULES.md ↔ CLAUDE.md symmetry), Gate 13 (brandbook hex coverage), Gate 14 (hooks valid, v4.1+), Gate 15 (doc-claim sync, v4.1.2+, extended v4.1.3+ to cover skills / hooks / slash command counts; v4.2.2 extended `docs_to_scan` to include `skills/using-erfana/SKILL.md` and `docs/verification-gates.md`), Gate 16 (verify-completion fixture replay + sentinel symmetry, v4.2.9+), Gate 17 (publication readiness, v6.0.0+)
- [`modernization-registry.md`](modernization-registry.md) – audit-trail of every skill that has been through the Modernize operation (v4.2.0+) – first pass, last pass, scope, score. Convention-enforced (not gated). Updated atomically with each Modernize pass.
- [`known-caveats.md`](known-caveats.md) – accepted risks from the v4.0.0 scope widening, v4.1.0 hooks migration, and the 2026-05-17 v4.2.8 → v4.2.10 same-day release chain (generic-name agent collisions, unverified per-skill nested `agents/` discovery, skipped rc soaks – extended four times now, `~/.claude/` duplication, etc.). Extracted from CLAUDE.md to keep that file under the 40 KB recommended ceiling.
- [`../skills/design-shared/brands/README.md`](../skills/design-shared/brands/README.md) – brand-system contract details, "adding a new brand" walkthrough
- [`../skills/design-shared/brands/erfana/CLAUDE.md`](../skills/design-shared/brands/erfana/CLAUDE.md) – worked example of the per-brand prose entry point
- [`../CHANGELOG.md`](../CHANGELOG.md) – release narrative including v4.0.0 widening + accepted-risk audit trail
- [`../ROADMAP.md`](../ROADMAP.md) – sequenced upcoming work (design-roadmap; orchestration accumulates separately)
- [`../BACKLOG.md`](../BACKLOG.md) – items intentionally NOT on the roadmap, with reasoning
- [`MAINTAINER.md`](../MAINTAINER.md) – succession plan, signed-commits setup
- [obra/superpowers writing-skills](https://github.com/obra/superpowers/blob/main/skills/writing-skills/SKILL.md) – the canonical reference for skill-authoring conventions this plugin follows
- [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills) – current SKILL.md frontmatter spec (April 2026)
- [W3C DTCG Format Module 2025.10](https://www.designtokens.org/tr/drafts/format/) – design-tokens spec the brand-system layer conforms to
