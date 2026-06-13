# Changelog

All notable changes to the erfana plugin for Claude Code are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/), versions follow [Semantic Versioning](https://semver.org/).

## [6.0.0] - 2026-06-13

The **open-source release**. erfana moves from a private, proprietary, Qodeca-internal plugin to a public project licensed **GPL-3.0-only**, and replaces the proprietary qodeca brand bundle with a neutral default brand so the design skills work for everyone out of the box. This is a breaking, posture-changing release; it does not change skill, agent, hook, or command counts.

### Changed (BREAKING)

- **License: proprietary -> GPL-3.0-only.** `LICENSE` is now the verbatim GNU GPL v3.0 text; `plugin.json` / `marketplace.json` declare `GPL-3.0-only`. A `COPYRIGHT` file records the relicensing by the sole copyright holder. Per-file licensing follows the [REUSE](https://reuse.software) specification (`LICENSES/`, `REUSE.toml`, SPDX headers on scripts); `reuse lint` is wired into CI.
- **Default brand: `qodeca` -> `erfana`.** The proprietary qodeca brand bundle (trademark logos, internal brandbook PDFs, employee photos) is removed. A neutral, logo-only `erfana` house brand ships as the active/default brand (Inter + JetBrains Mono, indigo/cyan/ink/paper palette, watermark `Created with erfana`). The design skills no longer ship photo/shape/template libraries — bring your own brand assets. `example-acme` remains as the exempt placeholder.

### Changed

- **`marketplace.json` matches the documented Claude Code marketplace schema** ([docs](https://code.claude.com/docs/en/plugin-marketplaces)). `category`/`keywords` moved onto the plugin entry (where discovery reads them) from the inert top-level `metadata` block; added `displayName`, `homepage`, `repository`; dropped the unrecognized `metadata.supportUrl`/`metadata.docsUrl` and `owner.url` fields. Validates clean under `claude plugin validate . --strict`.
- **Single-source plugin version.** Removed `version` from the `marketplace.json` plugin entry so `plugin.json` is the sole source of truth (Claude Code resolves `plugin.json` `version` first; a duplicate only masks it). Release process bumps `plugin.json` only.
- **Update docs corrected to "auto-update is opt-in."** Third-party marketplaces have auto-update **off** by default (only Anthropic's own marketplaces auto-update) — the README "How updates work" and pinning sections document the manual `/plugin update` flow and how to opt in, instead of claiming releases are picked up automatically.
- **Git Flow branch model.** `main` is the default, protected, marketplace-served branch; `develop` is the CI-gated integration branch. Maintainer release/pre-commit docs, contributor setup + PR-target guidance, and the README fork flow now branch off and PR into `develop`.

### Added

- **Community & governance files** for the public project: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant), `GOVERNANCE.md`, `SUPPORT.md`, `TRADEMARKS.md` (GPLv3 section 7(e); the license grants no trademark rights), `CLA.md` (broad-grant contributor agreement — draft pending legal review), `CITATION.cff`, GitHub issue forms + PR template. `SECURITY.md` rewritten for public disclosure via GitHub private vulnerability reporting.
- **Gate 17 (publication readiness)** — a new hard gate blocking proprietary / internal-only framing, internal contact emails, a non-GPL license, or the removed brand from reappearing. The suite is now 17 gates (16 hard + 1 soft).
- **Strict manifest validation in CI, on both branches.** `.github/workflows/verify.yml` installs the Claude Code CLI and runs `claude plugin validate . --strict` (so misplaced manifest fields hard-fail), and runs the full suite on `develop` as well as `main`.
- **Publication tooling.** `docs/oss-launch-checklist.md` gains post-publication discoverability steps (Anthropic community marketplace via `clau.de/plugin-directory-submission`, a PR into `awesome-claude-plugins`), and `docs/publish-runbook.md` documents the fresh-repo publish sequence.

### Removed

- The qodeca brand bundle and the qodeca sales-deck test fixture (real client names). The private-repo install flow (GitHub PAT / token rotation) is gone — the public marketplace needs no token.

## [5.1.0] - 2026-06-05

Hardens the `doc-update` slash command so it actively keeps status and changelog content out of working-context files (`CLAUDE.md`, agent-instruction files) instead of letting them accrete. The command had no status-logging behaviour and already targeted a concise `CLAUDE.md`, but additions applied freely while only deletions were gated, and the "~200 lines" target was a soft aspiration with no enforcing pass. This release adds two always-on passes and tightens the deletion-confirmation contract. Command, skill, agent, hook, and slash-command counts are unchanged; this is a single-command behaviour change.

### Added (doc-update)

- **Status/changelog eviction.** A new phase-4 detection pass flags status content in `CLAUDE.md` and agent-instruction files (dated entries, "recently changed/migrated" notes, progress and blocker trackers, phase-status lines, migration logs) and phase 6 relocates it to its home doc – dated content to `CHANGELOG.md`, progress content to `ROADMAP.md` / `STATUS.md` / `docs/status*` – leaving a one-line reference behind. No home doc -> `AskUserQuestion` [Create / Delete / Keep]; status content is never dropped silently. The `Current version` banner and a stable "current state" summary are explicitly preserved.
- **Necessity audit.** A new whole-file phase-4 pass over `CLAUDE.md`, agent-instruction files, and `docs/` guides applies one test per section – would removing it cause a future session to make a mistake? Candidates that fail are proposed for removal. `CHANGELOG.md`, ADRs / decision records, and `README.md` are exempt (accuracy fixes only, never necessity-deletion).

### Changed (doc-update)

- **Removal-confirmation contract tightened.** Every section-level or file-level removal is confirmed via `AskUserQuestion` (batched as a `multiSelect` question, looping past the four-option limit). `--allow-delete` now covers only provably-obsolete file deletions and never suppresses a necessity-removal prompt.

## [5.0.0] - 2026-05-30

Hardens the `managing-specs` skill against a 30-finding multi-lens review, across the skill and its shared `spec-*` agents. The skill content landed in PR #89 but the manifest version bump and this changelog entry were missed there; this entry and the accompanying version bump correct that.

### Changed (BREAKING)

- **Registry schema v2.0.0 -> v3.0.0.** Existing `registry.json` files are auto-migrated on first touch (original saved as `registry.json.backup`); IDs and folders are never renumbered or moved. Migration contract + 8 verification fixtures: `skills/managing-specs/guides/migration-v2-to-v3.md`.
- Adds the `failed` tombstone status (a `reserved` claim whose file creation failed; ID never reused) and `metadata.version` (audit/drift write-counter, not a runtime lock). Adds `documents.ux` and `documents.e2e_test_designs` canonical keys; the legacy `solution_docs` alias maps to `solution_specs`.

### Added (managing-specs)

- **Trust-boundary hardening (security).** Parsed input and fetched web pages are wrapped as untrusted data with downstream NEVER-rules; `spec-input-parser` validates file paths (child-of-project) and URLs; `spec-app-researcher` enforces an https-only SSRF allowlist; `spec-claude-md-integrator` escapes registry-derived names, confines writes to markers, and requires user confirmation (instruction-file-poisoning fix); slug allowlist + child-of-`specs/` assertion; hardened (quoted) Bash in `spec-init`.
- **Transactional INIT saga.** `claim_id` reserves -> `confirm_claim` activates -> `fail_claim` tombstones; `spec-registry-manager` is the sole registry writer (`spec-reconciler` emits a delta applied via `apply_delta`); idempotent ARCHIVE; real on-disk `.backup` files in RECONCILE.
- **Fault-classified retry** (transient/validation/permanent) with evaluator-optimizer re-invocation; only-orchestrator-delegates contract rule.

### Fixed (managing-specs)

- Documentation single-source-of-truth: `tier-guide.md` canonical for tiers + thresholds; corrected T1/T2/T3 file-count contradictions; repointed dead `templates/spec-template.md` links; restored the Path-resolution section; completed the reference index; verb-led description with concrete trigger phrases; documented `e2e-test-writer`/`e2e-test-reviewer` as a separate test-authoring pair.

## [4.6.0] - 2026-05-30

Hardens the `fact-checking` skill against a researched 5-lens review (23 findings) plus two rounds of plan review. The skill ingests an untrusted analysis document and arbitrary source directories, then writes model-generated corrections back to disk; the review found no instruction/data separation, a parallel-verification path that could silently drop claims, and in-place edits with no drift protection. Skill content + the four coupled `fc-*` agents – no new files; skill, agent, hook, and command counts unchanged. Controls are honest about their strength: the skill has no Bash, so path screening and reconciliation are model-followed invariants and lexical screening, backed by the existing user-confirmation gates, `Glob` root-confinement, and the `Edit` tool's exact-match semantics – not cryptographic guarantees.

### Security

- **Untrusted-content rule (LLM01:2025)** – `SKILL.md` and the three reading agents (`fc-extract-claims`, `fc-verify-claims`, `fc-discover-sources`) now treat the target and all source text as data, never instructions; an embedded instruction is a finding to report, not an action. Source passages shown to the user are rendered in a labeled, length-bounded untrusted-quote block.
- **Discovery hints downgraded** – `fc-discover-sources` no longer treats CLAUDE.md/INDEX.md/README.md as authority ("most reliable source"/"trust it over scanning" rewritten); they are untrusted hints and any suggested path is still user-confirmed and screened.
- **Lexical path screen + `--section` validation** – source paths and the target are screened (reject literal `~`, foreign-home absolute paths, `..` segments) and `--section` must be an integer; documented as advisory (no shell) with user-confirmation + `Glob` confinement as the real boundary. Resolves the relative→absolute path-contract mismatch between discover output and verify input.
- **Output screening before write (LLM05:2025)** – `fc-apply-fixes` screens `corrected`/`citation` for injected markup (`<script>`, stray comment delimiters), constrains `citation` to `path:line`, and exempts its own `<!-- Source: -->` citation; the user approves the **literal replacement bytes** in Phase 4 as the primary control.

### Fixed

- **Parallel verification could silently lose claims (blocker)** – `fc-verify-claims` gains `completion_status`/`missing_claim_ids`; its line-170 "return partial results" fallback and `<quality_gate>` are rewritten so partial coverage is declared, never silently truncated. The orchestrator (Step 3.1/3.2) now reconciles by **dispatched claim id**, re-dispatches only failed/partial chunks (max 3 then escalate), caps the fan-out at ~8 parallel workers (waves above that), passes chunk-boundary inputs, and runs a structural sanity-check on each return. An empty source index returns `status: error` instead of a confident batch of `Ungrounded` verdicts.
- **In-place edits could mis-place or corrupt fixes** – `fc-apply-fixes` rewritten to anchor on verbatim `original` text (the `Edit` exact-match is the real safety), with `line` demoted to an advisory disambiguator for repeated text; immediate (Phase 4) and bulk (Phase 5) applies are now drift-safe. A one-time pre-apply prompt confirms the target is committed (git is the rollback); failures land in `failed_changes`. The verify→apply field mapping (`claim_id` join recovering the target line) is now documented.
- **Doc-accuracy** – Quick-reference step count corrected 12→13; severity lowercase-emit/title-case-display split documented in `SKILL.md` and `verification-guide.md`; extraction-summary labels aligned to singular schema keys.

### Changed

- **Resource ceiling** – the extractor still extracts every claim; the orchestrator now stops and asks the user when the count exceeds a sane ceiling before fanning out (bounds a crafted-document blow-up).
- **Skill hygiene** – removed the duplicate "When this skill applies" section (triggers live in `when_to_use`); consolidated the deprecated-sampling-params rule to one canonical mention; trimmed prior-step-only scaffolding on exploratory display steps (guarded steps 1.5/2.1/3.1/5.1 untouched); added tables of contents to `verification-guide.md` and `examples.md` and a parallel-verification example; new rows in `error-handling.md` and entries in `anti-patterns.md` for the new partial-chunk, error-status, path-screen, and output-screen paths.

### Verified locally

- `bash scripts/run-all-gates.sh` → ALL GATES PASSED; `claude plugin validate .` → Validation passed.

## [4.5.0] - 2026-05-30

Remediates a researched 5-lens review of the `managing-reports` skill (23 findings + 3 plan-review ship-blockers across feasibility, completeness, and gate compliance). The skill's central REVIEW feature could not run (a subagent was designed to spawn subagents), no agent treated ingested report content as untrusted, and `maintain-report` shelled out on unvalidated paths. Skill-content + all 11 internal agents – no new files; skill, hook, command, and agent counts unchanged. Decisions taken: parallel-then-consolidate review, right-sized models, all-six-validators-blocking, and shell removal.

### Changed (breaking)

- **REVIEW orchestration flattened** – the skill (main conversation) now issues the six validators as one parallel batch and passes their results inline to `review-report`, which becomes a consolidator with `tools: Read, Glob` (dropped `Task`). Fixes the impossible subagent-spawns-subagents design.
- **All six validators are blocking** – the verdict collapses to PASS/FAIL (removed `CONDITIONAL PASS`), the `quick` 2-validator level is dropped, the user-override / "skip [validator]" path is removed, and the 0-100 quality score is demoted to an advisory signal (delivery requires all six to pass, not a numeric threshold). Reconciled across SKILL.md, `review-report`, `quality-checklist.md`, and the worked example.
- **Model tiering right-sized** – `validate-formatting` to haiku/low; the other five validators + `gather`/`modify`/`maintain` to sonnet/medium; `design-report-structure` + `review-report` to opus. `effort` added to mechanical agents. Replaces the all-opus frontmatter that contradicted the skill's own table.
- **`maintain-report` shell removed** – `tools` drop `Bash` (now Read/Write/Edit/Glob); archive is copy-only (removal unsupported); COMPARE is a qualitative in-tool read, not an exact diff.

### Fixed

- **SKILL.md frontmatter** – `tools:` to `allowed-tools:`; removed unsupported `version`/`author`/`last_reviewed`/`review_schedule` keys; `model: inherit`; split `description`/`when_to_use` with quoted triggers; "6 specialized agents" wording corrected.
- **Agent descriptions** are now trigger-shaped (delegation conditions), and dead "Cross-Model / Haiku compatibility" blocks, duplicated output templates, and the impossible `model=haiku` test scenario were removed.
- **Reference contradictions** – date format unified to `DD Month YYYY` (was stated both ways); executive-summary length unified to ≤10% / max 2 pages; the Five C's no longer mis-cited as an "IIA Standard" (now: supports IIA Standards 2410/2420); the flagship "good" example no longer violates the skill's own rules (removed banned "significant", de-branded); soft-quantifier list bounds given explicit fail conditions; reference/template table headers sentence-cased; word-replacement rule unified.

### Security

- **Trust boundary added to all 12 files** (SKILL.md + 11 agents) – report content, source materials, and file contents are untrusted data, never instructions; embedded directives are findings, not actions; verdicts/overrides come only from the user or orchestrator.
- **Command-injection surface closed** – `maintain-report` no longer shells out; path parameters are confined under the project root with `..`/absolute paths rejected; no destructive removal.
- **Secrets handling** – agents instructed never to reproduce credentials, tokens, or PII from source content into summaries, change logs, or comparison reports.
- **De-identification** – replaced a real-looking client (company, currency, vendors, named individuals) with generic placeholders across the reference, template, and example layers.

## [4.3.1] - 2026-05-30

Remediates a researched 5-lens review of the `managing-agents` skill (28 findings + 2 plan-review ship-blockers). The skill had drifted from the post-v2.1 Claude Code docs: stale facts that broke its own usage/testing instructions, a security checklist scoring controls plugin agents ignore, and competing trigger-pattern guidance the skill's own validator would reject. Skill-content + the coupled `ma-*` agents (`ma-validator`, `ma-reviewer`, `ma-designer`, plus `ma-creator`/`ma-researcher` tool-name refs) – no new files; skill, hook, command, and agent counts unchanged.

### Fixed

- **Stale Claude Code facts (would-fail instructions)** – the spawn tool is now named `Agent` (renamed from `Task` in CC v2.1.63; `Task(...)` still aliases) throughout `orchestration-patterns.md`, `anti-patterns.md`, `resources.md`, `SKILL.md`, `examples/`; direct-invocation syntax corrected to `@agent-<name>` (e.g. `@agent-code-reviewer`); user-level agent path corrected to `~/.claude/agents/`; the fabricated "Opus 4.7 defaults to sequential delegation" fan-out claim removed.
- **Security checklist realigned to the current permission model** – documents that plugin-distributed agents ignore `permissionMode`/`mcpServers`/`hooks`; replaces the stale 4-mode table with the current 6 modes (`default`/`acceptEdits`/`plan`/`auto`/`dontAsk`/`bypassPermissions`); adds an `mcpServers` grant row and a `disallowedTools` denylist; upgrades indirect-prompt-injection from a soft "considered" line to a hard untrusted-data check; extends the secrets deny-list (`*.tfstate`, `~/.config/gcloud`, `~/.kube/config`, `~/.docker/config.json`, `.git-credentials`, `~/.netrc`); reframes unenforceable HITL items to `needs_user_input` + session rules.
- **Validator score contracts resynced (H2)** – `ma-validator`'s hardcoded section item-counts and `security_score.max` (43→57) / `pre_release_score.max` (55→69) now match the actual checklists, including the previously-unenumerated Collaboration section and pre-existing count drift.

### Changed

- **Both trigger forms are now valid (H1)** – the skill no longer labels prose "Use proactively…/Use when…" descriptions "legacy"; the Phase 2 gate, `system-prompt-design.md`, `anti-patterns.md`, `quick-start.md`, the pre-release checklist, and the runtime enforcers `ma-validator`/`ma-reviewer`/`ma-designer` all accept either an action-oriented prose trigger or 2-4 `<example>` blocks. Prevents the plugin's own validator from rejecting agents written to current Anthropic guidance.
- **SKILL.md description aligned to siblings** – removed the three `<example>` blocks from the skill `description` (it was the only skill embedding them, and one named the wrong agent), rewrote the opening line trigger-shaped, kept `when_to_use`.
- **Frontmatter reference modernized** – adds `effort` (`low`–`max`) and `disallowedTools`; notes `model` accepts full 4.x IDs (`claude-opus-4-8`) and that `tools`/`model` are plugin conventions, not Anthropic requirements; "Test with Haiku" noted as Haiku 4.5.
- **Structure & consistency** – XML template de-duplicated to a single source (`templates/agent-template-xml.md`); `guides/README.md` now lists all 7 guides and defers to the canonical SKILL.md index; broken `managing-agents.md` reference fixed to `../SKILL.md`; colour reference reconciled with `agent-pairing.md`; Phase 0/1 quality gates downgraded to lightweight self-checks (per Rule 9) keeping the escalation path; tables of contents added to long reference files.

### Verified locally

- `bash scripts/run-all-gates.sh` → ALL GATES PASSED; `claude plugin validate .` → Validation passed.
- **Version bump** – `4.3.0 → 4.3.1` in both plugin manifests + the `CLAUDE.md` banner (Gate 15).

## [4.3.0] - 2026-05-30

Redesigns the `managing-articles` skill end-to-end in response to a multi-lens review (38/100 baseline) and a deep re-review (91/100). Consolidates 23 nested, frontmatter-less prose agents into 5 real shared subagents and hardens security, reliability, and bilingual support. **Breaking:** the article agents moved to plugin root and the agent topology changed.

### Changed

- **`managing-articles` v2 (BREAKING).** The 23 nested prose agents – which carried no YAML frontmatter and were not loadable as subagents – are consolidated into 5 real shared subagents at plugin root: `article-researcher`, `article-outliner`, `article-drafter`, `article-reviewer`, `article-reviser`. Each has full frontmatter (name/description/tools/model/effort/capabilities) and least-privilege tools (reviewer is read-only; drafter on opus, the rest on sonnet). Shared-agent count 82 -> 87.
- **`managing-articles` SKILL.md rewritten** as a lean orchestrator: orchestrator-owned questionnaire (agents return `needs_user_input` and never call `AskUserQuestion`), disk-based versioning, move-first-then-status atomic publish/archive with human approval of resolved paths, artifact-based prerequisites, one canonical status enum, and quality gates only on irreversible steps.
- `language` is now an array; per-language draft and review files; metadata, brief, outline, and review-report templates updated.

### Added

- **Three `managing-articles` reference modules** as the orchestrator's single source of truth, injected into agent prompts at delegation: `content-trust.md` (untrusted research treated as data, SSRF/exfiltration controls, fact-corroboration, injection-relay guard), `slug-and-paths.md` (Polish transliteration, path-traversal/containment guard, atomic move), and `bilingual.md` (language-conditional Polish/English quality metrics, bilingual file layout).
- **First-class Polish support** – Polish-calibrated review metrics (impersonal `-no`/`-to`, nominalization, Polish readability index) replace the English active-voice and sentence-length targets for Polish drafts; diacritic transliteration in slugs.

### Removed

- The 23 superseded `managing-articles` agents and 9 obsolete workflow files.

### Security

- Closed the prompt-injection, indirect-injection, SSRF/exfiltration, path-traversal, fact-laundering, and non-atomic-move risks surfaced by the multi-lens review of `managing-articles`.

### Verified locally

- `bash scripts/run-all-gates.sh` -> ALL GATES PASSED; `claude plugin validate .` -> Validation passed. Deep re-review score 38 -> 91.

## [4.2.20] - 2026-05-30

Makes the four safety hooks work on native Windows. The hooks were bash-only and depended on `jq`/`grep`/`awk`; on Windows, Git Bash runs the `.sh` scripts but ships **without `jq`**, so every hook silently read empty input and no-op'd – the safety net (dangerous-command blocking, secret detection, post-compact reminders, verification nudge) was effectively off on Windows. Each hook now ships a PowerShell sibling, routed by a small launcher. No skill, agent, command, or count change (the launcher is excluded from the safety-hook count).

### Added

- **PowerShell hook siblings** – `bash-safety.ps1`, `secret-detector.ps1`, `post-compact-reminder.ps1`, `verify-completion.ps1`, each a faithful 1:1 port of its `.sh` counterpart (Windows PowerShell 5.1 `ConvertFrom-Json` replaces `jq`; `-cmatch`/`-match` mirror `grep -E`/`grep -iE` case semantics; `(?m)` preserves per-line `^`/`$` anchoring). Validated against the project's own verify-completion fixture set.
- **`hooks/dispatch.sh` launcher** – every `hooks.json` command now runs `bash "${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.sh" <hook>`; the launcher `exec`s the `.ps1` via `powershell.exe` on Windows (MSYS/Cygwin/MinGW detected via `uname`, path passed as `cygpath -m` forward-slash form) or the `.sh` elsewhere. stdin, stdout, stderr, and exit code pass straight through, preserving the hook protocol (exit 2 blocks; JSON on stdout honoured).

### Changed

- **`secret-detector.sh`** – the hook-script skip list now also covers `.ps1` (the PowerShell siblings legitimately contain secret-pattern strings).
- **Gate 14** – additionally asserts each dispatched `<hook>` has both a `.sh` and a `.ps1` sibling, and PowerShell-parses the `.ps1` files when `pwsh`/`powershell.exe` is on PATH (skipped on bare Linux CI).
- **Gate 15** – the safety-hook count (`ls hooks/*.sh`) now excludes the `dispatch.sh` launcher, so the "4 safety hooks" claims stay accurate.
- **Gate 16** – replays the verify-completion fixtures through `dispatch.sh` (the OS-native implementation) instead of the `.sh` directly, and extends sentinel-symmetry to `verify-completion.ps1`.

### Coverage note

A Windows host with **no** Git Bash (where Claude Code falls back to PowerShell for the hook command) cannot invoke `bash dispatch.sh` and remains uncovered – the same gap the pre-existing `.sh`-only hooks already had, so no regression. The mainstream Windows setup ships Git Bash alongside Claude Code, which this release targets. Documented in [`docs/known-caveats.md`](docs/known-caveats.md).

### Verified locally

- Full block/allow/skip/sentinel/stop-active matrix replayed through `dispatch.sh` against all four `.ps1` hooks on Windows PowerShell 5.1 – behaviour matches the bash versions.
- `bash scripts/gate-14-hooks.sh` → PASS (4 entries, both siblings present, PowerShell parse clean); `bash scripts/gate-16-hook-fixtures.sh` → PASS (10 fixtures + 7 sentinel checks, via the `.ps1` path).
- **Version bump** – `4.2.19 → 4.2.20` in both plugin manifests + the `CLAUDE.md` banner (Gate 15).

## [4.2.19] - 2026-05-30

Hardens the `managing-issues` skill from a researched 5-lens review (28 verified findings + 3 adversarial-review additions). The skill was previously unable to run on `main`-default repos (Implement hard-required a `develop` branch but diffed/merged against `main`), was tied to a Node/Electron toolchain, and had uneven injection controls. This release makes it stack-agnostic, resumable, and injection-resistant. Skill-content only – no agent, hook, command, or count change.

### Fixed

- **Base-branch model (blocker)** – `managing-issues` now auto-detects the repo's default branch as `BASE_BRANCH` at QG-0 (`git symbolic-ref refs/remotes/origin/HEAD`, fallback `main`) and uses it consistently for the start check, diff base, merge target, and abort cleanup. Removes the `develop`-only dead-end; the skill runs on `main`-default repos, including its own home repo.
- **Security hardening** – new SKILL.md rule-14 untrusted-data boundary propagated to operations and carried inline in `mi-issue-displayer` (subagents do not load SKILL.md); `mi-issue-displayer` now validates/sanitizes every `gh` input (digit-only ids, allowlisted `state`, `owner/repo` format, dash-stripping, `--` before operands); destructive git ops (incl. abort `git clean -fd`) echo + confirm the resolved ref; QG-7 secret scan is fail-closed across all text types gating on exit code; `gh issue comment` uses `--body-file`; report/scratch writes are path-traversal-guarded; fetched identifiers are re-validated before chained `gh` calls.
- **Stack-agnostic** – detects test/typecheck/lint/build commands and audit tooling instead of hardcoded `npm`; gates Electron/web review dimensions on detection; a single toolchain anchor binds every phase to the detected commands.
- **Workflow reliability** – run state persists to a GitHub issue comment (resumable; no in-repo state file to trip the clean-tree gate); subagent dispatch payloads are mandatory and self-contained; parallel-review fan-out is capped (3-5/batch) with per-agent timeout and partial-result handling; the re-review loop is capped at 3 iterations; fan-out reviewers escalate contradictions via `needs_user_input`; agent selection uses a qualitative rubric + `DEFAULT_AGENT_MAP` instead of a pseudo-numeric score; Automated gates use concrete exit-code predicates.
- **Consistency & structure** – validation ritual reserved for irreversible gates (QG-7 non-skip preserved); architectural vs enforcement rule sets disambiguated; review→issue handoff strips volatile line numbers; clock-time review labels replaced with effort tiers; agent-reference links flattened one level from SKILL.md; orphaned `qa-protocol.md` linked; broken `phases/8` reference paths fixed (`../reference/`); TOCs added to 100+ line references; version prose and non-standard `version`/`status` frontmatter keys removed.
- **Version bump** – `4.2.18 → 4.2.19` in both plugin manifests + the `CLAUDE.md` banner (Gate 15).

### Verified locally

- `bash scripts/run-all-gates.sh` → `=== ALL GATES PASSED ===`; Gate 15 confirms banner `v4.2.19` + all count claims sync to the filesystem.
- `claude plugin validate .` → passed.
- Manual link-resolution check on edited `phases/`/`operations/`/`reference/` files (Gate 7 does not scan those link origins); zero residual hardcoded `develop`; `BASE_BRANCH` adopted across 9 files.

## [4.2.18] - 2026-05-28

Syncs the user- and maintainer-facing documentation of `/erfana:doc-update` with the v4.2.16 rewrite. `README.md`, `CLAUDE.md`, and `docs/architecture.md` still described the pre-rewrite command ("based on the last 10 commits", `docs/` + `CLAUDE.md`-only discovery, a 14-step protocol, unconditional commit/push). Produced by running `/erfana:doc-update` over the repo. Documentation only – no skill, agent, hook, command, or count change.

### Fixed

- **`README.md`** (slash-command table) – replaced the stale `doc-update` cell with the current behavior: live working-tree + staged + base-branch (`git merge-base`) change-set detection, full documentation-surface discovery (README, CHANGELOG, `AGENTS.md`, OpenAPI/Swagger, `CONTRIBUTING.md` / `.github/`, ADRs), no git action by default, opt-in `--commit` / `--push`, and the `path-or-glob` / `--dry-run` / `--offline` flags.
- **`CLAUDE.md`** (command table) – `doc-update` row "from the last 10 commits" → "from the live change set; full-repo sweep, no git action by default".
- **`docs/architecture.md`** (commands paragraph) – added the `v4.2.16+` rewrite note so `doc-update` carries its version history alongside the sibling commands.
- **Version bump** – `4.2.17 → 4.2.18` in both plugin manifests + the `CLAUDE.md` banner (Gate 15).

### Verified locally

- `bash scripts/run-all-gates.sh` → `=== ALL GATES PASSED ===`; Gate 15 confirms banner `v4.2.18` + all count claims sync to the filesystem.
- `claude plugin validate .` → passed.

## [4.2.17] - 2026-05-28

Fixes invalid YAML in the `/erfana:doc-update` frontmatter introduced by the v4.2.16 rewrite. The `argument-hint` value began with `[`, which a strict YAML parser reads as the start of a flow sequence; it parsed `[path-or-glob]` as a one-item list and then errored on the next `[`. Quoting the value restores a valid string scalar. No behavior change to the command's protocol.

### Fixed

- **`commands/doc-update.md`** – quoted the `argument-hint` value (`"[path-or-glob] [--dry-run] ..."`) so the frontmatter parses as valid YAML; restored the en dash in the `description` (a hyphen had crept in).
- **Version bump** – `4.2.16 → 4.2.17` in both plugin manifests + the `CLAUDE.md` banner (Gate 15).

### Verified locally

- `bash scripts/run-all-gates.sh` → `=== ALL GATES PASSED ===`.
- `claude plugin validate .` → passed.

## [4.2.16] - 2026-05-28

Rewrites the `/erfana:doc-update` slash command. The prior version was the plugin's only command without frontmatter and the only one that mutated git state: it ran a fixed 14-step full-repo protocol that unconditionally committed all working-tree changes and pushed to the remote, scoped documentation to `docs/` + `CLAUDE.md` only, detected changes from "the last 10 commits", and embedded stale guidance (the retired `ultrathink` keyword, an arbitrary 500-line file cap). Driven by a `/erfana:lens-review` five-lens pass (command design, scope, safety/git, documentation guidance, usability) producing 20 cited findings. No change to other commands, skills, agents, hooks, or any count claim – command total stays 5.

### Changed

- **`commands/doc-update.md`** – full rewrite.
  - **Safety/git (was the must-fix):** default run now takes **no git action** – edits are left in the working tree for the user's normal flow. New opt-in `--commit` / `--push` flags stage only the doc files the run changed (explicit `git add -- <paths>`, never `commit -a`), refuse the default branch, and confirm before pushing. Aligns with the project's feature-branch / commit-when-asked norm.
  - **Coverage:** discovery extended beyond `docs/` + `CLAUDE.md` to the full surface – README (root + package), CHANGELOG, `AGENTS.md` (shim/symlink-aware, sibling agent files surfaced), OpenAPI/Swagger specs (generated docs flagged regenerate-don't-edit), `CONTRIBUTING.md` / `.github/`, and ADRs / decision logs.
  - **Change detection:** "last 10 commits" replaced with a live working-tree + staged + base-branch (`git merge-base ... HEAD`) diff; change set prioritises but does not limit the full sweep.
  - **Deletions** are proposed and confirmed via `AskUserQuestion` (or `--allow-delete`), mirroring the existing no-new-files-without-consent rule; scratch space moved from a fixed `temp/` to a collision-safe git-ignored run dir with run-scoped cleanup.
  - **Conventions:** added YAML frontmatter (`description`, `argument-hint`, scoped `allowed-tools` that deliberately omit `git add`/`commit`/`push` so opt-in git still prompts); a one-token `path-or-glob` scope plus `--dry-run` (preview, writes nothing) and `--offline`/`--quick` (skip research); linear steps restructured into conditional phases with early-exits.
  - **Guidance currency:** removed `ultrathink`; dropped the hard 500-line cap for logical-boundary splitting (CLAUDE.md target ~200 lines); added `@path` imports, load hierarchy/precedence, and `.claude/rules/` guidance; reframed the keep/cut test as adherence-first; demoted blanket MUST/ALWAYS to plain imperatives; fixed the `Prerequiste` typo and vague step wording.
- **Version bump** – `4.2.15 → 4.2.16` in both plugin manifests + the `CLAUDE.md` banner (Gate 15).

### Verified locally

- `bash scripts/run-all-gates.sh` → `=== ALL GATES PASSED ===`; Gate 15 confirms banner `v4.2.16` + all count claims (including `5 slash commands`) sync to the filesystem.
- `claude plugin validate .` → passed.

## [4.2.15] - 2026-05-28

Shrinks the maintainer-facing `CLAUDE.md` from 43.6k chars / 251 lines to 21.2k chars / 164 lines, clearing Claude Code's `Large CLAUDE.md will impact performance (>40k)` warning. Because the file loads into every session, the prior bloat diluted the load-bearing hard constraints. Driven by a `/erfana:lens-review` two-lens pass (content efficiency + information architecture) cited to `code.claude.com/docs/en/memory` + `/best-practices`. No behavior change to skills, agents, hooks, or commands; counts and rules unchanged.

### Changed

- **`CLAUDE.md`** – delete-most, relocate-gaps restructure: (1) the "What this is" catalog (per-skill + per-command changelog prose) collapsed to a compact skill list + 5-row command table + pointer to `docs/architecture.md` (which already carries the full catalog and version history); (2) "Repository layout" table trimmed from 44 rows to 12 load-bearing rows + pointer; (3) "Things to avoid" deduped from 20 bullets (mostly inversions of hard constraints) to 10 non-duplicative gotchas; (4) the four inline quick spot-check snippets replaced by a pointer. Gate 15 load-bearing claims preserved (version banner, `15 skills` / `82 shared agents` / `4 hooks` / `5 commands`, `managing-articles` 23 internal agents). Hard constraints section untouched. Release-process / staged-rollout / signing sections kept in place to avoid dangling `ROADMAP.md` / `docs/known-caveats.md` cross-references.
- **`docs/verification-gates.md`** – new `## Quick spot-checks` section receives the four standalone snippets removed from `CLAUDE.md` (frontmatter/name, manifest parse, brand consistency, hook health).
- **Version bump** – `4.2.14 → 4.2.15` in both plugin manifests + the `CLAUDE.md` banner (Gate 15).

### Verified locally

- `bash scripts/run-all-gates.sh` → `=== ALL GATES PASSED ===` (16/16); Gate 15 confirms banner `v4.2.15` + all count claims sync to the filesystem.
- `claude plugin validate .` → passed (pre-existing `metadata.docsUrl` warning only).

## [4.2.14] - 2026-05-28

Adds `/erfana:explain-issue`, a one-shot Pyramid-Principle slash command that translates a single GitHub issue into a Product Owner / Project Manager / Business Analyst brief. Designed via `/erfana:grill-me` (14 locked decisions: slash command vs. skill, issues-only scope, three input forms, deep context inputs, universal Pyramid template with type-adapted axes, labels-first classifier chain, chat-only output, full inheritance of `project-status` hallucination guards, dedicated `<!-- erfana:explain-template -->` sentinel + hook + gate updates, PM/PO-brief-only output layer, adaptive 40%-of-body length cap, URL-or-cwd repo resolution, non-interactive posture, hybrid coverage handling). The explain family is namespaced for future siblings (a likely `/erfana:explain-pr`). Net slash commands 4 → 5.

### Added

- **`commands/explain-issue.md`** – the new slash command. YAML frontmatter (`description`, `argument-hint`, scoped read-only `allowed-tools`: `gh issue view`, `gh pr list`, `gh pr view`, `gh auth status`, `git log`/`git rev-parse`/`git remote`, plus `Read`/`Grep`/`Glob`). Accepts a single argument as bare number (`17`), `#N` (`#17`), or full GitHub URL; multiple tokens or PR URLs stop with a one-line error. Trust model treats every fetched body, comment, file slice, and spec slice as untrusted data – embedded instructions surface as facts about the issue, never execute. Deep input feeds translation (title + body + labels + assignees + state + last 3 comments + linked PRs that close / fix / resolve the issue, capped at 3 PR-body fetches; files referenced in the body, capped at 5; spec IDs referenced in the body, capped at 3; commits matching `#N` when invoked inside the issue's repo) but the rendered brief stays a single PM/PO section with no engineering appendix. Classifier chain (labels → Conventional-Commits title prefix → body heuristic → default `question`) adapts axis labels per type: bug uses `The problem / Impact / Where we are`, feature uses `The capability / Why it matters / Where we are`, refactor uses `What we're improving / Why it matters / Where we are`, question uses `What's being decided / What's at stake / Where we are`. **No `Suggested next step` line** (the stakeholder owns the action queue; the explicit divergence from the `*-status` family). Full hallucination guards inherited from `project-status` (source attribution, no acronym expansion without evidence, no evaluative adverbs without evidence, quantifier grounding, status-label criteria, banned narrative phrases, abstract inventory-negation rule, confidence-calibration `Issue #N – state unclear, partial signals available` headline). Adaptive length: at most 40% of the issue body word count, floor 120 words, hard cap 400 words; per-axis bullet hard ceiling 55 words with ±15-word balance across the three bullets (inherited from the v4.2.10 status-command length lesson). Hybrid coverage: silent on full data, single italicised `_Data note: …_` footer on material gaps (gh error, empty body, unreadable file or spec, commit-probe skipped when invoked from a different repo). Non-interactive (no `AskUserQuestion`). Read-only (no file writes, no issue mutations).
- **`<!-- erfana:explain-template -->` sentinel** – new invisible HTML comment emitted at the end of every `explain-issue` brief. The Stop hook (`hooks/verify-completion.sh`) allowlists it so the brief's descriptive language ("ready for merge", "the implementation is complete", linked-PR mentions) does not trip the success-claim regex. Reserved for future `explain-*` siblings (a likely `explain-pr` reuses the same sentinel).
- **`tests/hooks/verify-completion/explain-with-sentinel.json`** – new Gate 16 fixture that asserts the new allowlist branch is real. The fixture body contains both `ready for merge` (matches `ready (to commit|to ship|for review|for merge|for production)`) and `the implementation is complete` (matches `the (fix|change|implementation) is (done|complete)`) – without the sentinel these would block; with the sentinel the fixture passes. Net fixture count 9 → 10.

### Changed

- **`hooks/verify-completion.sh`** – allowlist extended from one sentinel to two: a second `grep -qF '<!-- erfana:explain-template -->'` branch runs after the existing status-template check. Header comment block expanded to describe both families (`*-status` and `explain-*`) and explicitly notes Gate 16 enforces symmetry across all three command files plus this hook.
- **`scripts/gate-16-hook-fixtures.sh`** – `SENTINEL=` constant split into `STATUS_SENTINEL` and `EXPLAIN_SENTINEL`. Symmetry check refactored into a `check_sentinel` helper invoked once per family: status family covers `commands/project-status.md` + `commands/session-status.md` + `hooks/verify-completion.sh`; explain family covers `commands/explain-issue.md` + `hooks/verify-completion.sh`. The pass-line count is now the sum of both families (5 today). New fixture row added to the `CASES` array. Header comment block updated to describe the two-family structure.
- **`docs/gates/16-hook-fixtures.md`** – rewritten to document the two-family symmetry model, the new fixture, the new pass-criteria sum, and a per-family renaming procedure. Heading updated to mark the explain-family extension as a v4.2.14+ change.
- **Doc sync** – `4 → 5 slash commands` and the new `commands/explain-issue.md` entry added across `CLAUDE.md` (version banner `v4.2.13 → v4.2.14`, slash command count, slash-commands bullet section, Repository layout row, Gate 16 description row, verify-completion description), `README.md` (Slash commands table row), `docs/architecture.md` (commands/ banner line, verify-completion description, slash commands paragraph split into status-family and explain-family sub-bullets), `MAINTAINER.md` (Plugin scope line). Both plugin manifests' versions and description strings updated from `4.2.13` / `four slash commands` to `4.2.14` / `five slash commands` with the new command name appended.

### Verified locally

- `bash scripts/gate-16-hook-fixtures.sh` → 10 fixture pass + 5 sentinel symmetry pass (3 status family + 2 explain family).
- `bash scripts/run-all-gates.sh` → expect ALL GATES PASSED across all 16 gates (Gate 2 frontmatter on the new `commands/explain-issue.md` YAML; Gate 15 doc-claim sync at version banner `v4.2.14` + `5 slash commands`; Gate 16 fixture replay + dual-family sentinel symmetry).
- `claude plugin validate .` expected clean (pre-existing `metadata.docsUrl` warning only).
- Dogfood: ran the protocol from `commands/explain-issue.md` against a closed issue and an open issue from `qodeca/erfana-skills` to confirm the brief renders cleanly and the hallucination guards trip on real data.

### Accepted risks / follow-up

- `explain-issue` has no automated unit test for the protocol body itself; verification remains the Gate 16 fixture replay plus manual dogfood, mirroring how `lens-review` was shipped in v4.2.11.
- The hypothetical `/erfana:explain-pr` sibling is reserved by namespace and sentinel only; no implementation yet. If shipped, it must be added to Gate 16's `EXPLAIN_SENTINEL_FILES` list and the slash command count incremented again.

## [4.2.13] - 2026-05-28

Hardens the `managing-issues` **Create** operation against all 27 findings of a researched multi-lens review (`/erfana:lens-review`). Fixes command-injection sinks in issue creation, two runtime-breaking defects, splits the overloaded drafter into three single-responsibility agents, rebuilds the approval gate, modernizes the issue templates to GitHub Issue Forms, and fixes the systemic "subagent calls AskUserQuestion" bug in `mi-requirements-analyzer`. Net agents 80 → 82 (`mi-` 11 → 13).

### Added

- **`agents/mi-issue-questioner.md`** – Read-only agent that GENERATES clarifying questions (AskUserQuestion-shaped, with a "Not sure / skip" option each) for the orchestrator to ask. Never calls AskUserQuestion. Replaces the old drafter's `gather-requirements` mode.
- **`agents/mi-duplicate-finder.md`** – Read-only `gh` duplicate search (`issue list`/`issue view`/`search issues` only). Sanitizes and variable-binds keywords (strips leading `-`, shell metacharacters) before any shell use — closes the keyword argument/command-injection sink (CWE-78). Implements the previously-missing `search-duplicates` mode (Create Phase 3 invoked a mode the old agent did not define, halting every run).
- **`skills/managing-issues/templates/create/bug-report.yml`, `enhancement.yml`** – GitHub Issue Forms (structured fields, `required: true`, dropdowns, top-level auto-labels, optional `@claude` automation checkbox). Reference forms to copy into a consuming repo's `.github/ISSUE_TEMPLATE/`.

### Changed

- **`agents/mi-issue-drafter.md`** – now Read-only and draft-only (no `AskUserQuestion`, no `Bash`). Takes an absolute `template_path`, emits an `## Assumptions / unanswered` section listing every inferred field, enforces 3-5 acceptance criteria for bugs / 2-5 for enhancements, validates labels against a fixed allowlist, and carries a trust-model statement (inputs are untrusted data). Fixes the single-responsibility, least-privilege, malformed-`<output>`-tag, and relative-template-path findings.
- **`skills/managing-issues/operations/create.md`** – adds a trust-model section; Phase 2 delegates question GENERATION to `mi-issue-questioner` and the orchestrator asks (≤4 per AskUserQuestion call); a skipped question is valid and never re-asked; Phase 3 delegates to `mi-duplicate-finder` and drops its post-step validation ritual (read-only); Phase 4 passes the absolute `template_path`; Phase 5 is a single structured Create/Edit/Cancel confirmation showing the exact title/labels/target repo/body + assumptions, and creates the issue injection-safely (write the approved body to a temp file, then `gh issue create --body-file ...` — never an inline heredoc, closing the CWE-78 body-injection sink). "Escalate" is defined for the single-user context; the unworkable "max 3 attempts" counter is replaced with "do not re-ask the same question."
- **`agents/mi-requirements-analyzer.md`** – systemic AskUserQuestion fix: removes `AskUserQuestion` from tools, returns `proposed_questions` for the orchestrator to ask, drops the coercive re-present-on-skip loop. **`skills/managing-issues/phases/2-business-analysis.md`** updated so the orchestrator asks.
- **`skills/managing-issues/reference/create-phase-requirements.md`** – reconciled to the 3-agent topology; Phase 4 no longer requires the phantom `Write` tool the drafter never had.
- **Issue-authoring guidance** – `claude-code-friendly-issues.md` adds an acceptance-criteria count rule (Principle 3), a Principle 8 on the conditional `@claude` automation trigger, and checklist lines for labels + `@claude`; `bug-report.md`/`enhancement.md` fix the "where" summary nudge, add an "Affected users" field, label/triage guidance, and the AC count cap.
- **Convention** – `docs/architecture.md` gains a "subagents cannot call AskUserQuestion" section (canonical pattern: agent proposes, orchestrator asks; reference `ma-requirements-gatherer`). Lists the remaining cross-skill occurrences (managing-articles/reports gather agents) as a tracked follow-up requiring lockstep skill changes.
- **Doc sync** – `80 → 82 shared agents` and `mi- 11 → 13` across `CLAUDE.md`, `README.md`, `MAINTAINER.md`, `docs/architecture.md`, `docs/verification-gates.md`, `skills/using-erfana/SKILL.md`; `CLAUDE.md` version banner `4.2.12 → 4.2.13`; both manifests' versions and agent-count descriptions.

### Verified locally

- `bash scripts/run-all-gates.sh` → expect ALL GATES PASSED across all 16 gates (Gate 1 CJK; Gate 2 agent name/description + no deprecated APIs on the new agents; Gate 7 cross-references; Gate 15 doc-claim sync at 82 agents + version banner).
- `claude plugin validate .` expected clean (pre-existing `metadata.docsUrl` warning only).
- Both new `.yml` issue forms parse as valid YAML.

### Accepted risks / follow-up

- The cross-skill AskUserQuestion occurrences in `managing-articles`/`managing-reports` gather agents are documented but not fixed in this pass (each needs its consuming skill's orchestration changed in lockstep; out of the Create-operation scope).
- managing-issues still has no automated test suite; verification remains gates + manual dogfood.

## [4.2.12] - 2026-05-27

Re-pitches the `/erfana:lens-review` report for a Project Manager / Product Owner / semi-technical audience without losing any information a developer needs. The reader-facing output changes from the developer-shaped three-section report (top findings / by-lens / coverage, engineering severity labels) to a single plain-language findings table plus a technical subsection kept for engineers and Claude Code. Presentation and wording only – the findings logic, lens set, severity ranking, ~12-month cited-research bar, trust model, read-only guarantee, and hallucination / grounding guards are unchanged. Designed via `/erfana:grill-me`.

### Changed

- **`commands/lens-review.md` output template** – the reader-facing report is now: a count headline (`N findings across M review areas – a must-fix, b should-fix, c nice-to-fix, d cosmetic`) plus one plain bottom-line sentence; a single risk-only findings table with columns number / severity / area / "what it means"; a "Technical detail" subsection with one block per finding keyed to the table number, carrying the precise `file:line`, technical explanation, fix, and cited source; and a plain-language coverage section (areas covered, areas with no findings, could-not-be-assessed, reviewer problems, dropped-to-cap, what-was-read, reviewers-used).
- **Reader-facing severity labels** – Must-fix / Should-fix / Nice-to-fix / Cosmetic replace blocker / major / minor / nit in the table and technical-detail headers. Review subagents still return blocker / major / minor / nit (the finding contract is unchanged); the main aggregating context translates them in step 6, so internal severity ranking is untouched.
- **Area naming** – the Area column shows a plain label plus the technical lens name in parentheses when they differ (e.g. "Speed (performance)", "Monitoring (observability)", "Third-party code (supply-chain)"), shown once when they coincide (e.g. Security, Accessibility).
- **New grounding guards** – step 7 adds: headline counts must equal table rows and the bottom-line sentence must name an actual highest-severity finding (no editorializing); plain language pairs with, never replaces, the identifier; reader-facing labels are a fixed translation, not a fresh judgment. The empty-outcome rule now routes "ran, found nothing" and "could not be assessed" into the plain coverage section.
- **`commands/lens-review.md` frontmatter description** – notes the plain-language, PM/PO-friendly report with full technical detail kept for engineers.
- **Doc sync** – `CLAUDE.md` version banner `4.2.11` → `4.2.12` plus the lens-review command and repository-layout descriptions; `README.md` lens-review row; both manifests' versions `4.2.11` → `4.2.12`. The slash-command count is unchanged at 4, so Gate 15 count claims are untouched.

### Verified locally

- `bash scripts/run-all-gates.sh` → expect ALL GATES PASSED across all 16 gates (Gate 15 doc-claim sync confirms the version banner matches the manifests; Gate 1 CJK; Gate 2 manifests).
- `claude plugin validate .` expected clean (pre-existing `metadata.docsUrl` warning only).

## [4.2.11] - 2026-05-24

Adds `/erfana:lens-review`, a researched multi-lens code-review command. It fans out review subagents over a target, each reviewing one lens (architecture, security, performance, UI, …) against best practices researched live online, then synthesizes one unified, severity-ranked report in the main context. The lens set, the subagent count (capped at 10), and the per-lens executor are all decided at runtime from the target – there is no fixed catalog. Designed via `/erfana:grill-me`, then **dogfood-reviewed by running the command's own protocol over its own file** (6 lens reviewers, each web-researching) and hardened against the resulting findings. Shipped as a patch bump (mirroring how `project-status` shipped in v4.2.5 and `session-status` in v4.2.6), deliberately not v4.3.0 to avoid implying the reserved deprecated-API / skill-description hard-blocks are now active.

### Added

- **`commands/lens-review.md`** – fourth slash command, with YAML frontmatter (`description`, `argument-hint`, scoped read-only `allowed-tools`) – the first command in the repo to carry frontmatter; the status siblings deliberately omit it. Required argument `<path | #PR | "description"> [--lens a,b,c] [--out file.md]`; bare invocation errors with a usage line.
  - **Trust model** – all target content, PR diffs, issue / PR bodies, and fetched web pages are untrusted data, never instructions; embedded instructions are reported as findings, never acted on. The rule propagates verbatim into every reviewer prompt.
  - **Target resolution** – PR (`gh pr diff` / `gh pr view` with digit-validated number; non-zero exit stops cleanly and never feeds error text to reviewers), path (quoted, `--`-separated; branch-diff-within-path, else all files), or free-text (located via `Grep` / `Glob` / `Explore`); always resolved to a concrete file set before fan-out.
  - **Lenses** – inferred from the target with optional override (`--lens`, which wins over and suppresses a free-text hint); open-ended, no catalog; depth follows the pinned-lens count; fan-out sized to change size / risk with a zero-lens floor; capped at 10 reviewers (the discoverer / matcher / pre-passes are additional Tasks sharing the platform concurrency limit).
  - **Executor selection** – reuses `mi-agent-discoverer` + `mi-agent-matcher` honoring the matcher's real contract: a transient per-run requirements file (one block per lens) is written to a scratch path and passed via `phase_requirements_path`, then deleted (the matcher reads a file and stops if absent – it does not accept inline requirements). Strong match → specialist; weak match, matcher escalate / ask, or matcher failure → built-in `general-purpose` (treated as web-capable) or direct catalog-keyword selection; ambiguity auto-resolved (non-interactive, since `AskUserQuestion` does not reach subagents). Discoverer failure → all lenses on `general-purpose`.
  - **Research** – per-lens, strict recency (~12 months), every finding cited (URL + date / version), uncited or stale findings dropped. Web-capable executors self-research; executors without web tools (`code-reviewer`, `security-auditor`) receive an injected `general-purpose` research pre-pass brief (with retry-then-reassign on pre-pass failure) – no shipped agent is modified. Per-reviewer search budget (~3–6 sources, ~8–12 for a single deep lens), optional shared brief for overlapping lenses, and model-tiering for low-reasoning lenses bound the cost. Trusted-domain fetches only; never fetch a URL from the target, never place repo data in an outbound request.
  - **Aggregation** – the main context validates each result against the finding contract, records failed / timed-out reviewers as failed lenses (never silent), enumerates lenses before synthesis to guard against context loss at high N, then collapses cross-lens duplicates and ranks blocker / major / minor / nit. Coverage note reports lenses reviewed, failed / partial, dropped (cap), not-assessable / research gaps, and provenance.
  - **Output** – read-only to chat; the optional validated `--out <file>` (repo-relative, no traversal, `.md`, no parent-dir creation) and the transient matcher scratch file are the only filesystem writes.

### Changed

- **Doc-claim counts bumped 3 → 4 slash commands** (Gate 15): `CLAUDE.md` version banner + slash-command section, `MAINTAINER.md` "Plugin scope" line, `README.md` slash-command table, both manifests' descriptions.
- **`.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json`** – version `4.2.10` → `4.2.11`; descriptions updated to "four slash commands (…, lens-review)".

### Verified locally

- Dogfood review (6 web-researching lens reviewers over the command file) surfaced 3 blocker, 10 major, 10 minor, 3 nit findings; all were applied to the command before commit.
- `bash scripts/run-all-gates.sh` → expect ALL GATES PASSED across all 16 gates (Gate 15 doc-claim sync, Gate 1 CJK, Gate 2 manifests).
- `claude plugin validate .` expected clean (pre-existing `metadata.docsUrl` warning only).

### Accepted risks

- **Read-only for `general-purpose` reviewers is instruction + permission-prompt enforced, not tool-guaranteed.** The matcher prefers read+web specialists; when only `general-purpose` (which retains Write / Edit / Bash) fits a lens, the trust-model + read-only prose plus the user's permission prompts are the backstop. A host-level tool sandbox would close this fully but is outside a slash command's control.
- **Subagent budget** – the 10-reviewer cap excludes discovery, matching, and research pre-pass subagents, which share the platform's ~10-concurrent-Task limit, so a worst-case run may batch rather than run all reviewers at once.
- **`context7` reach** – only broad-tool executors (`general-purpose`) can use the `context7` MCP for library docs; specialist reviewers fall back to `WebSearch` / `WebFetch`. Treated as preferred-when-available, not required.

## [4.2.10] - 2026-05-17

Tightens both status-command protocols (`/erfana:project-status` and `/erfana:session-status`) after a real-world session emitted a session-status output that slipped on two protocol rules: the "What we accomplished" support bullet ran ~80 words (the prior "~30-50 words each" soft target let drift through) and the "Recommended next" section skipped Layer 2 by appealing to the rung-5 "session caught up" carve-out when a real follow-up (post-release auto-update propagation smoke check) existed. The slips were caught by self-comparison against a peer project's `project-status` output that landed cleanly. v4.2.10 hardens both rules so the discipline survives future runs.

### Changed

- **`commands/project-status.md` + `commands/session-status.md`** – Support-bullet length discipline elevated from soft target to hard rule:
  - Hard ceiling of 55 words per bullet (was: soft "~30-50").
  - Balanced-density requirement: the three support bullets must fall within ±15 words of each other; a 30 / 80 / 30 distribution is now an explicit protocol violation even if the total stays under the 280-word cap.
  - Self-check step added before emit; redistribute facts to "What we worked on" rather than truncate.
- **`commands/project-status.md` + `commands/session-status.md`** – "Recommended next" Layer 2 is now mandatory. The prior "Skip Layer 2 only when there is genuinely no next action" carve-out is removed entirely. New priority rungs:
  - **project-status** rung 5 added: "Recently shipped release exists and a MAINTAINER-checklist / smoke / propagation step remains → recommend that step." Rung 5 (ROADMAP head) renumbered to 6; rung 6 (no clear next move) renumbered to 7. Rung 7's Layer 2 is "open BACKLOG.md and pick the head item" – still concrete, not a skip.
  - **session-status** rung 5 added: "Last task shipped cleanly but a post-release / smoke / propagation / spec-compliance / MAINTAINER-checklist item remains → recommend that step." Rung 5 (caught up) renumbered to 6 and rewritten to require a concrete pivot target or an explicit "save context and close the tab" – not a Layer 2 skip.

### Verified locally

- Both command files re-read after edit; both now contain the v4.2.10+ markers (hard length rule + always-emit Layer 2).
- `bash scripts/run-all-gates.sh` → ALL GATES PASSED across all 16 gates.
- `claude plugin validate .` clean.
- Gate 15 sentinel check confirms `Current version: **v4.2.10**` matches `plugin.json`.

### Accepted risks

- **Rung 5/6/7 renumbering changes downstream cross-references** if anything else in the codebase points at "rung 5 of recommended next". Spot-checked: no other file references the rung numbers; the only consumer is the LLM reading the protocol body at runtime.
- **Hard ceiling at 55 words** trades some natural prose flow for tighter discipline. Worth it: the previous slip showed the soft "~30-50" target reads as suggestion, not rule, even to a model with strong instruction-following.
- **Mandatory Layer 2 increases output length by ~15-25 words** on caught-up runs that previously emitted only Layer 1. Still well within the 280-word hard cap.
- **Staged rollout skipped.** Prose-only change to two manually-invoked slash commands, no skill behaviour change, no agent change, no hook change. Mirrors the v4.2.8 / v4.2.9 pattern.

## [4.2.9] - 2026-05-17

Consolidated remediation of three independent code reviews on the initial v4.2.9 working tree (erfana:code-reviewer, erfana:security-auditor, erfana:architecture-reviewer). The first real-world `/erfana:project-status` invocation on a stable `develop` branch emitted "Settled state – develop is clean, no open pull requests, no issues currently assigned…" and was blocked by `verify-completion.sh` because the broad `\bno\s+(issues|errors|problems)\b` trigger fired on the inventory phrasing. The status commands are read-only and explicitly forbidden from running tests / lint / build, so they had no way to clear the gate – every clean-tree report on a stable repo would block. The first patch attempt added a 3-label substring allowlist plus an inventory-qualifier exemption; reviewers flagged the allowlist as trivially bypassed by any message paraphrasing the documented template (High severity, security review), the qualifier exemption as incomplete and as a fresh false-negative vector outside status reports, and the command prose as DIP-violating because it named the hook implementation. v4.2.9 ships the consolidated fix: a unique sentinel-comment allowlist in the hook + an executable test gate that codifies the corner cases.

### Added

- **`commands/project-status.md`** – new **`Inventory negation phrasing`** HARD RULE in the Apply hallucination guards section. Forbids bare `no issues / no errors / no problems` token sequences (with no word between `no` and the noun) even in inventory context. Provides four compliant alternatives: reverse word order, interpolate a qualifier, use "zero", or describe the state. Wording is **abstract** – it does not name `verify-completion.sh` (Reviewer 3 DIP fix). The protocol's GitHub-probe step now issues two `gh issue list` calls – one filtered to `--assignee @me` (your active todo), one with no assignee filter (full open-issue queue) – so the "Where we landed" axis reports both counts and "Recommended next" can fall back to unassigned items when your queue is empty. Output template ends with a mandatory invisible `<!-- erfana:status-template -->` sentinel that the hook keys on.
- **`commands/session-status.md`** – same abstract `Inventory negation phrasing` rule and same `<!-- erfana:status-template -->` sentinel at the end of the output template.
- **`hooks/verify-completion.sh`** – three layered changes:
  1. **Sentinel-comment allowlist.** The hook greps for the literal `<!-- erfana:status-template -->` in the scrubbed body via `grep -qF`. If present, exits 0 immediately. The sentinel is unique enough that organic completion summaries cannot accidentally produce it (Reviewer 2 fix for the High-severity 3-label bypass).
  2. **Unclosed-fence fallback.** A `FENCE_COUNT` pre-check counts opening fences. If the count is odd, the AWK strip is skipped and the raw body is used – preventing an unclosed code block from silently swallowing success claims that come after it (Reviewer 2 fence-strip robustness).
  3. **Word boundary on `\bverified\b`.** Verification regex anchored so "unverified", "unverifiable", etc. no longer falsely satisfy the verification check. Discovered while writing test fixtures.
- **`tests/hooks/verify-completion/`** – 9 JSON fixtures covering: sentinel-bearing status report, status without sentinel, paraphrased-template bypass attempt, unverified vs verified success claim, bare `no issues`, inventory `no issues currently assigned`, unclosed-fence hidden claim, `stop_hook_active` short-circuit. Each fixture is a Claude Code Stop-hook payload (`stop_hook_active` + `last_assistant_message`).
- **`scripts/gate-16-hook-fixtures.sh`** – new gate script with two responsibilities: (1) replay every fixture through the hook and assert the expected outcome (`block` if stdout must carry the block JSON; `pass` if stdout must be empty); (2) sentinel symmetry check – the literal `<!-- erfana:status-template -->` must appear in both command files and the hook, fails if any one is missing. Mirrors the shape of `scripts/gate-14-hooks.sh` (read-only validator, set -euo pipefail, prefix-tagged PASS/FAIL output).
- **`docs/gates/16-hook-fixtures.md`** – per-gate documentation following the shape of `docs/gates/14-hooks.md`.

### Changed

- **`hooks/verify-completion.sh`** – the v4.2.9 working tree's 3-label substring allowlist was replaced by the sentinel-comment check (Reviewer 2 High-severity fix). The v4.2.9 working tree's `\bno\s+(issues|errors|problems)\b` qualifier exemption was **dropped entirely**; the trigger now fires as it did pre-v4.2.9 outside status reports. Status reports avoid it via the command-level prose rule.
- **`scripts/run-all-gates.sh`** – Gate 16 inserted directly after Gate 14 (hook-related gates grouped consecutively).
- **`docs/verification-gates.md`** – count updated from 15 to 16 (15 hard + 1 soft). Gate 16 row added. Runner-order comment updated.
- **`CLAUDE.md`** – `hooks/verify-completion.sh` bullet rewritten to describe the sentinel allowlist + fence fallback + dropped exemption. Per-command rows for `project-status` and `session-status` updated to mention the sentinel, the dual-issue probe (project-status), and the abstract prose rule. Repository layout adds `scripts/gate-16-hook-fixtures.sh` and `tests/hooks/verify-completion/` rows. "All 16 gates (15 hard + 1 soft)" replaces "All 15 gates (14 hard + 1 soft)".
- **`README.md`** – verify-completion hook row mentions sentinel + fence fallback. Status-command rows updated.
- **`docs/architecture.md`** – hooks section + slash commands paragraph updated; gate count + folder enumeration synced.
- **Plugin manifest version** 4.2.8 → 4.2.9 in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.

### Verified locally

- `bash -n hooks/verify-completion.sh` clean.
- `bash scripts/gate-16-hook-fixtures.sh` – 9/9 fixtures + 3/3 sentinel symmetry checks pass.
- `bash scripts/run-all-gates.sh` – ALL GATES PASSED across all 16 gates.
- `claude plugin validate .` – Validation passed.

### Accepted risks

- **Sentinel may leak as raw text if a downstream consumer doesn't render markdown comments.** Claude Code's rendered output suppresses `<!-- ... -->`. A downstream non-rendering consumer (e.g. a CI log scraper that captures the assistant message verbatim) would see the literal sentinel line. Acceptable for the audience this command serves.
- **Sentinel symmetry is a build-time check, not a runtime check.** If a maintainer renames the sentinel in only one place between Gate 16 runs, the next run catches it. There is no runtime fingerprint exchange between the commands and the hook.
- **`verified` word boundary tightens the verification check.** Edge phrasings like "we verified-the-output" (hyphenated) no longer satisfy verification. Considered improvement, not regression.
- **Inventory rule is LLM-enforced.** As in v4.2.8, the HARD RULE lives in the protocol prose. The sentinel-allowlist and the dropped qualifier exemption mean any prose-rule slip falls through to the success-claim regex – which now correctly blocks bare `no issues` in non-status contexts.
- **Staged rollout skipped.** Behaviour change is scoped to two manually-invoked slash commands plus one Stop hook with executable test coverage. Mirrors the v4.1.0+ pattern for infrastructure-shaped releases.

## [4.2.8] - 2026-05-17

Stakeholder rewrite of the two existing status slash commands (`/erfana:project-status` and `/erfana:session-status`). The previous v4.2.5/v4.2.6 versions emitted developer-shaped reports – branch names, commit hashes, "X commits ahead of origin", unexpanded acronyms (RBAC, FIC, MI, RU, PE, DNS), and Phase-label / file-path jargon – which is the wrong register for the plugin's primary human consumer (Marcin, in his Product Owner / PM / BA role). v4.2.8 reframes both commands around outcome language while keeping technically-meaningful identifiers (issue numbers, PR numbers, phase labels, version strings, doc names, dates) paired with plain-language descriptions. The same release adds a hard hallucination-guards section to both protocols, because in a stakeholder context an incorrect status is materially worse than no status.

### Changed

- **`commands/project-status.md`** – fully rewritten body. New "Audience and register" section names the PO/PM/BA reader explicitly and enumerates which identifiers belong (issue numbers, PR numbers, phase labels, version strings, doc names, dates) versus which do not (commit hashes, raw branch names, file paths, bare dirty-file counts). Three Pyramid Principle support axes renamed from `where the work is / project signals / queue` to `what we worked on / what we accomplished / where we landed`. Step-2 gather phase now (a) requests last 5 commits with committer-date via `git log --oneline -5 --format='%h %cs %s'` and (b) adds an explicit translation-fetch step (`gh issue view <N> --json title,body --jq '{title, body: (.body | .[0:500])}'` plus the PR equivalent) so any issue or PR mentioned with a plain-language description is grounded in its real title and body. "Recommended next" is now two-layer: a stakeholder milestone sentence ("The next milestone is X") followed by an italicised "Suggested first step:" hint for Claude on the next turn. Word budget bumped from ≤120 target / 200 hard cap to ~175-220 target / 280 hard cap. New coverage-footer case added for translation-fetch failures.
- **`commands/session-status.md`** – same rewrite pattern as `project-status`. Identical "Audience and register" section. Three axes renamed (`topic / progress / state` → `what we worked on / what we accomplished / where we landed`). Step-2 git probe now also requests `--format='%h %cs %s'` on the last 3 commits so date grounding is available. Two-layer recommendation. Same word-budget bump and same hallucination guards.
- **Plugin manifest version** 4.2.7 → 4.2.8 in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
- **CLAUDE.md "Current version" banner** synced to v4.2.8. Per-command description rows in CLAUDE.md updated to reflect the new stakeholder framing, the three new outcome-shaped axes, the two-layer recommendation, the hallucination guards, and the new word budget.

### Added

- **Hallucination guards section (mandatory before drafting)** – identical in both command protocols. Hard rules: source attribution (every fact must trace to a tool call output or conversation content), no acronym expansion without evidence (RBAC, FIC, MI, RU, PE, DNS, SDK, CRUD stay verbatim unless the gathered state itself includes the expansion), no evaluative adverbs without evidence ("successfully", "smoothly", "cleanly", "on schedule" banned without explicit confirmation), quantifier grounding (every number ties to a tool output or explicit statement), status-label criteria (stable / in-flight / blocked each have explicit triggers; if none apply, drop the label), date discipline (relative dates computed against the actual current date), grounded issue/PR translations (translate only if title/body fetched), banned narrative phrases ("the team", "as planned", "on track", "moving forward", "good shape", "healthy state"), and a confidence-calibration headline ("Session state unclear – limited context available" / "<repo-name> state unclear – partial signals available") when the gathered state cannot support a confident narrative.

### Accepted risks

- **Staged rollout skipped.** Behavior change is prose-only, scoped to two manually-invoked slash commands. No trigger-phrase regression surface, no skill auto-discovery impact, no agent behavior change. Mirrors the v4.1.0+ pattern for routine prose-shape releases. If the new register misfires on real-world repos in the first 48h post-tag, tune in v4.2.9.
- **Word-budget bump is heuristic.** Target ~175-220 / hard cap 280 was chosen against three real status samples (workshop-tools session, hub project, octagon project) – the rewrites came in at 175-195 words. Margin is generous but not measured against high-variance projects (long phase lists, many open PRs, deep ROADMAP heads); first production runs may surface cases where 280 is too tight or too loose.
- **Translation-fetch step adds latency and quota cost.** `gh issue view` / `gh pr view` per mentioned issue or PR is 1-3 extra GitHub API calls on every `/erfana:project-status` invocation. Acceptable for a manual interactive command; would not be acceptable in a hot-loop or hook context. If the user invokes the command in a CI / batch context, the translation step can degrade silently via the new coverage footer.
- **Hallucination guards are LLM-enforced, not gate-enforced.** The hard rules live in the protocol prose; there is no Gate 16-style runtime check that the emitted report actually obeys them. Opus 4.7 is generally good at following structured "HARD RULE" sections in slash-command prose, but a future release could add a self-audit step that re-reads the draft against the gathered state before emit if false-positive cases surface.

## [4.2.7] - 2026-05-16

Adds `erfana:fact-checking` – a new verification skill migrated from the Qodeca-internal `sport-clubs-company` consulting project and immediately put through the `erfana:managing-skills` Modernize operation. The skill validates markdown analysis documents against source materials (interview transcripts, vendor docs, knowledge-base folders) by extracting atomic factual claims, tracing each to its source passage, classifying findings by severity (Critical / Error / Warning / Info), and applying user-approved corrections. It is a five-phase orchestrator: Setup → Extraction → Verification → Interactive review → Fix application. Four `fc-*` plugin-root agents handle the substantive work (source discovery, claim extraction, claim verification, fix application); the orchestrator handles all user interaction.

### Added

- **`skills/fact-checking/SKILL.md`** – new orchestrator skill (478 lines under the 500-line cap, `disable-model-invocation: true` so the skill is invoked manually via `/erfana:fact-checking <target-file>`). Frontmatter ships `model: opus`, `effort: xhigh`, `allowed-tools: Read, Glob, Grep, Edit, AskUserQuestion, TodoWrite, Task`, and `argument-hint: "<target-file> [--section N]"`. `when_to_use` carries five quoted activation phrases ("fact-check this document", "verify against sources", "validate analysis", "check for hallucinations", "verify document"). Iterative source-confirmation loop in Phase 1 (default-folder fast path → per-source confirmation → optional additional-sources branch → mandatory final-list approval) prevents accidental verification against the wrong corpus. Phase 3.1 implements adaptive fan-out: sequential single-call below 50 claims, orchestrator-side parallel batching at ≥50 claims (chunks of 25, same-turn multi-spawn) – Section 12.4 PASS. Phase 4 reviews findings by severity group with `AskUserQuestion`-driven Accept-all / Review individually / Dismiss / Skip choices; "Accept and fix" during individual review dispatches `fc-apply-fixes` immediately rather than batching.
- **`skills/fact-checking/examples.md`** – three end-to-end scenarios: full-document fact-check (142 claims, basic happy path), section-scoped check via `--section N`, interactive severity review flow showing the Critical / Error / Warning interaction detail.
- **`skills/fact-checking/references/`** – four reference docs: `verification-guide.md` (methodology, claim types, severity classification, source matching heuristics, cross-project portability), `error-handling.md` (per-phase error responses table), `anti-patterns.md` (DO NOT / ALWAYS checklist including the 4.7-pattern bans), `user-override.md` (override procedure for blocking quality gates).
- **`agents/fc-discover-sources.md`** – plugin-root agent (`sonnet`, `effort: medium`). Reads CLAUDE.md / README.md / INDEX.md hints, scans for source-material directories with keyword heuristics (interviews / vendor-docs / department-docs / financial-docs / technical-docs / knowledge-base / imported-docs), excludes target's parent directory, returns confidence-rated source list as structured JSON.
- **`agents/fc-extract-claims.md`** – plugin-root agent (`opus`, `effort: high`). Parses target document, breaks compound statements into atomic claims, classifies each as factual-claim / numeric-claim / attribution / process-description / inference, captures line references and section context.
- **`agents/fc-verify-claims.md`** – plugin-root agent (`opus`, `effort: xhigh`). Indexes source files via Glob, processes each claim with keyword extraction → broad Grep search → context Read → verdict assignment (Verified / Ungrounded / Inference / Contradicted) → severity classification → suggested fix composition. Single-chunk semantics: the agent processes the claims array it receives sequentially; per-claim parallelism is handled by the orchestrator splitting into chunks of 25 when claim count ≥ 50. Constraint `NEVER drop Verified claims from output` enforces find-before-filter discipline (12.6 PASS).
- **`agents/fc-apply-fixes.md`** – plugin-root agent (`sonnet`, `effort: medium`). Reads target file, sorts approved fixes by line number descending (to avoid line-shift drift), applies each Edit, optionally inserts `<!-- Source: ... -->` HTML comments for citations, returns per-fix outcome with failure-mode reporting.

### Changed

- **Plugin manifest version** 4.2.6 → 4.2.7 in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. Manifest description strings updated to enumerate the new verification skill plus the four-agent `fc-*` fact-checking quartet (76 → 80 shared agents).
- **CLAUDE.md "Current version" banner** synced to v4.2.7.
- **Doc-claim sync (Gate 15)** atomic across six canonical sites for the agent-count and skills-count bumps: `CLAUDE.md` (header banner + Repository layout table + agent-count breakdown adding `fc-` (4) prefix bucket + "fourteen → fifteen skills" tweak), `README.md` (orchestration paragraph + agents table prefix breakdown), `docs/architecture.md` (v4.0 absorption paragraph + repo-layout tree + plugin-root agents prose), `MAINTAINER.md` (Plugin scope line with v4.2.7 stamp), `skills/using-erfana/SKILL.md` (intro paragraph + final paragraph on agent delegation), `docs/verification-gates.md` (Layout reference adding "verification" track in skills enumeration).
- **`docs/modernization-registry.md`** – appended row + per-pass detail for `erfana:fact-checking` (post-migration Modernize, v4.2.7). Pre-modernize 68/70 → post-modernize 70/70 (perfect score). Three findings applied: ACT-001 adaptive parallel batching for ≥50 claims; ACT-002 ALL-CAPS scaffolding demotion (4 instances; load-bearing CAPS on user-trust gates preserved); ACT-003 anti-pattern phrasing tightened to remove false-positive grep surface. "Skills NOT yet modernized" header bumped to "as of v4.2.7".

### Accepted risks

- **Staged rollout skipped.** Additive new skill behind `disable-model-invocation: true` – not auto-discovered, only invoked manually via `/erfana:fact-checking`. No trigger-phrase regression surface to existing skills or commands. Mirrors the v4.1.0+ pattern for routine additive releases. If a user reports the skill misbehaving in the first 48h post-tag, hotfix on v4.2.8.
- **Parallel batching threshold of 50 claims is untested in production.** The Phase 3.1 adaptive fan-out branch (chunks of 25, same-turn multi-spawn at ≥50 claims) was added during the Modernize pass and has not been exercised against a real 100+ claim document. Chunk size and threshold are heuristics; first production run with a large analysis document may surface tuning gaps. Sequential single-call branch (<50 claims) is the migrated original and remains tested.
- **`examples.md` Example 1 not updated for the parallel path.** The 142-claim scenario predates the new fan-out behavior – `ms-validator` flagged updating it as optional. Deferred to keep release scope tight; the example still illustrates the skill's user-facing flow accurately even though the underlying batching is now parallel.
- **`fc-discover-sources` heuristic source detection is consulting-project-shaped.** Keyword heuristics (interviews / vendor-docs / contracts / SLA / etc.) were tuned for the `sport-clubs-company`-style projects where the skill originated. Cross-project portability is supported (via CLAUDE.md hints + INDEX.md preference + dynamic directory scanning), but adapting to substantively different project shapes – e.g., research-paper databases or audit-evidence repositories – may need additional keyword tuning. Listed adaptation patterns are heuristics, not hard rules.
- **`fc-apply-fixes` overwrites prose using inline Edit operations.** The agent sorts fixes by line number descending to avoid drift, but on heavily-edited documents (or after long source-material updates) line numbers may have shifted between extraction and fix application. Failure mode is documented and recoverable (failed fixes are reported per-line, not silently dropped); user re-runs after merge conflicts.

## [4.2.6] - 2026-05-16

Adds `/erfana:session-status` – a read-only slash command sibling to `/erfana:project-status` that produces a Pyramid-Principle executive brief of the current Claude Code conversation: what the session set out to do, what was decided / shipped, where things stand now, and the highest-leverage next move. Designed for the same long-running-tab context-recovery problem `/erfana:project-status` solves, but answered from in-context conversation history (with a light git probe for grounding) rather than from project files.

### Added

- **`commands/session-status.md`** – new slash command. Plain-markdown prompt (no frontmatter, mirroring `commands/doc-update.md` and `commands/project-status.md` precedent). Three-section Pyramid output: governing thought (1 sentence, ≤25 words), three support bullets covering the topic / progress / state axes (one bullet per axis), and a "Recommended next" line derived from a session-shaped heuristic priority order (unanswered question / pending choice → recommend answering; implemented-but-unverified request → recommend the verification step; surfaced-but-unexecuted TODO → recommend executing it; open PR awaiting merge → recommend the merge or review; else state "session caught up"). Target ≤120 words, hard cap 200; consolidate over omit. Read-only by design – no `Edit` / `Write` / verification-command tool calls. Sources primarily from in-context conversation; the only side-effect-free tool calls allowed are a four-line git probe (`git rev-parse --is-inside-work-tree`, `git branch --show-current`, `git log --oneline -3`, `git status --short | wc -l`). Silent degradation when not in a git repo (the session may be pure conversation work). Explicitly forbidden from reading `~/.claude/projects/<…>/<session-id>.jsonl` – sources only from the live context.

### Changed

- **Plugin manifest version** 4.2.5 → 4.2.6 in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. Manifest description strings updated to enumerate three slash commands (`doc-update`, `project-status`, `session-status`) instead of two.
- **Slash-command count claim** 2 → 3 atomically across `CLAUDE.md` (header banner + bulleted list + Repository layout table), `README.md` (slash commands table), `docs/architecture.md` (repo-layout tree + "Currently ships..." prose), and `MAINTAINER.md` (Plugin scope line) per Gate 15 Check 6.
- **CLAUDE.md "Current version" banner** synced to v4.2.6.
- **README.md `/erfana:project-status` row prose** trimmed of the forward-looking "future releases may add ..." aside now that the sibling command actually ships.

### Accepted risks

- **Staged rollout skipped.** Additive read-only slash command; no skill-behavior or trigger-phrase regression risk to downstream consumers. Mirrors the v4.1.0+ pattern for routine additive releases. If a user reports the command misbehaving in the first 48h post-tag, hotfix on v4.2.7.
- **Heuristic priority order is opinionated and session-shape-dependent.** The "implemented-but-unverified" rung (rung 2) is the most subjective – distinguishing genuine pending verification from a closed-out request requires reading the user's intent. If the recommendation feels off, the priority order is editable in `commands/session-status.md` without any API impact.
- **Pure-conversation sessions (no git repo, no tool calls) return a minimal output.** When the session has no concrete artifacts (e.g. design brainstorming in a non-repo directory), the State bullet has nothing to ground on and the recommendation typically falls to rung 1 (unanswered question) or rung 5 (caught-up). Working as intended, but worth flagging.

## [4.2.5] - 2026-05-16

Adds `/erfana:project-status` – a read-only slash command that produces a Pyramid-Principle executive brief covering the current project's state and the highest-leverage next move. Designed for context recovery when many Claude Code tabs are open in parallel and the maintainer forgets where each one sits. Adaptive scope (git + GitHub always; ROADMAP / BACKLOG / CLAUDE.md version banner / gate runner conditional) keeps it useful across erfana, lean Python repos, and orphan checkouts alike.

### Added

- **`commands/project-status.md`** – new slash command. Plain-markdown prompt (no frontmatter, mirroring the `commands/doc-update.md` precedent). Hyphenated `project-` prefix reserved deliberately to leave room for sibling status commands (`session-status` etc.) in future releases without flat-namespace collision. Three-section output: governing thought (1 sentence, ≤25 words), 3 support bullets covering the work-state / project-signals / queue axes (one bullet per axis), and a "Recommended next" line derived from a heuristic priority order (CI-green PR awaiting merge → recommend merging; manifest-vs-prose version drift → recommend syncing; dirty feature branch → recommend committing or stashing; assigned issue with no matching draft branch → recommend scoping; ROADMAP head item → recommend starting; else state "no clear next move – pick from BACKLOG.md"). Target ≤120 words, hard cap 200; if approaching 200, consolidate bullets rather than omit an axis. Read-only by design – no `Edit` / `Write` / verification-command tool calls. Hybrid coverage-gap handling: silent omission for missing project files, explicit one-line footer when `gh` is unauthed or the GitHub remote is missing despite a github.com origin. Hard-exits with one line if run outside a git repository.

### Changed

- **Plugin manifest version** 4.2.4 → 4.2.5 in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. Manifest description strings updated to enumerate two slash commands (`doc-update`, `project-status`) instead of one.
- **Slash-command count claim** 1 → 2 atomically across `CLAUDE.md` (header banner + bulleted list + Repository layout table), `README.md` (slash commands table), `docs/architecture.md` (repo-layout tree + "Currently ships..." prose), and `MAINTAINER.md` (Plugin scope line) per Gate 15 Check 6.
- **CLAUDE.md "Current version" banner** synced to v4.2.5.

### Accepted risks

- **Staged rollout skipped.** Additive read-only slash command; no skill-behavior or trigger-phrase regression risk to downstream consumers. Mirrors the v4.1.0+ pattern for routine additive releases. If a user reports the command misbehaving in the first 48h post-tag, hotfix on v4.2.6.
- **Heuristic priority order is opinionated and partially plugin-shaped.** The "manifest version drift" rung (rung 2) was tuned with plugin-shaped repos in mind; lean projects without a "Current version" prose claim simply skip the rung and fall through. If the recommendation feels off on a specific project shape, the priority order is editable in `commands/project-status.md` without any API impact.

## [4.2.4] - 2026-05-14

Modernize-operation pass against `erfana:managing-agents` driven by `ms-reviewer` deep audit (Section 12 patterns from `pre-release-checklist.md`). Eight findings applied to the skill plus a cross-grounding follow-up that added `effort:` declarations to all 7 ma-* agent frontmatters – mirroring the precedent established for `managing-issues` in v4.2.2.

### Added

- **`when_to_use:` block in `skills/managing-agents/SKILL.md` frontmatter** (F2 hybrid pattern). 4 quoted activation phrases: `"create an agent"`, `"build a new agent"`, `"make an agent that..."`, `"review the X agent"`, `"audit existing agents"`, `"modify the X agent"`. Combined `description` + `when_to_use` ≈980 chars (under 1,536 budget). Coexists with the existing 3 `<example>` blocks – first production use of this hybrid in the plugin (most skills use either pattern alone). Future skill authors can mix both freely.
- **Effort + Model columns in `skills/managing-agents/SKILL.md` Agents table** (F5). Per-subagent overrides per Opus 4.7 best practices: routine agents on `medium` effort, judgment-heavy agents on `xhigh`. Model column mirrors what each `agents/ma-*.md` declares.
- **`effort:` field on all 7 `agents/ma-*.md` frontmatters** (F5 follow-up): `ma-requirements-gatherer` / `ma-researcher` / `ma-validator` on `medium`; `ma-designer` on `high`; `ma-creator` / `ma-reviewer` / `ma-modifier` on `xhigh`. Placed above the `model:` line for consistency. Closes the asymmetric drift caught by ms-validator Step 2.5 (table claims must match agent-file ground truth).
- **Bulk-review fan-out hint at SKILL.md L329** (F10): explicit "spawn one ma-reviewer per agent file as concurrent Task calls in the same turn (cap at 8 per batch)" for the `review scope = all agents` pathway.
- **`docs/modernization-registry.md` row** for `erfana:managing-agents` – first-pass + last-pass = v4.2.4; PASS 69/70; before/after Section 12 scores + per-finding detail in per-pass section.

### Changed

- **First-person `<example>`-block dialogue rewritten to third-person trigger form** (F1) in three `<example>` blocks of the `description:` frontmatter. Pattern: `"I'll use the managing-agents skill to..."` → `"Delegating to managing-agents skill to..."`. Resolves Section 12.1 voice ambiguity – `<example>` blocks ARE rule-bound (not exempt from third-person voice requirement). Architectural precedent for future Modernize passes touching `<example>`-shaped skills.
- **CRITICAL ARCHITECTURAL RULE #9 narrowed** (F3) to mandate post-phase validation only on irreversible-side-effect phases (3 Create, 4 Modify, 5 Validate). Routine exploration phases (0 Requirements / 1 Research / 2 Design) MAY skip post-step validation if agent self-verification suffices, per Anthropic 4.7 migration guide.
- **Explicit fan-out at SKILL.md L317** (F4): the 4-reviewer audit pattern now reads "spawn 4 ma-reviewer invocations (with distinct review-focus lenses) as concurrent Task calls in the same turn" – removes the implicit-parallelism trap where 4.7 defaults to sequential delegation.
- **Filler words stripped** (F6) from SKILL.md + 4 auxiliary files (`guides/qa-protocol.md`, `guides/orchestration-patterns.md`, `templates/agent-template-markdown.md`, `examples/agent-templates.md`). `comprehensive` reduced 6 → 3 (remaining 3 are signal-bearing in named technical term "Pattern 3: Single Comprehensive Agent"); `detailed` reduced 5 → 2 (kept in anti-patterns diagram label + signal-bearing examples preamble); `thorough` kept at 2 (1 inside quoted bad-prompt example, 1 = Explore-tool `very thorough` API parameter name).
- **⛔ STOP language softened** on Phase 0 / 1 / 2 routine quality gates (F11). Preserved on Phase 3 / 4 (file write) + Phase 5 (validation) + Review / Modify operation gates – the load-bearing irreversible-side-effect cases.
- **Plugin manifest version** 4.2.3 → 4.2.4 in `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. CLAUDE.md "Current version" banner synced.

### Internal

- **Section 12 score improved** from 5.5/8.0 (audit baseline) to **8.0/8.0** (perfect; orchestrator max). Pre-release total: 78/100 → **69/70** (98.6%, above 66/70 orchestrator threshold). Security: 93/93 unchanged. ms-validator confirmed zero regressions.
- **Modernize backup-discipline lesson surfaced**. ms-modifier's initial backup at `skills/managing-agents.backup.<ts>` tripped Gate 15 (skills-count drift FAIL: 16 vs claimed 14, because Gate 15 counts any directory under `skills/` as a skill). Auto-relocated to `.backups-managing-agents.<ts>` outside `skills/`. The `**/.backups-*/` `.gitignore` pattern added in v4.2.2 catches the result. Useful precedent for any future skill-mutation tool that creates local backups – never write inside `skills/`.
- **F5 cross-skill grounding catch worked exactly as designed**. ms-validator Step 2.5 (introduced in v4.2.2 after the managing-issues meta-finding) detected the SKILL.md Agents-table claims of `effort:` values that no `ma-*.md` declared. Triggered the follow-up that closed Section 12.5 from 0.0/1.0 to 1.0/1.0. Pattern reinforced: orchestrating-skill tables MUST mirror agent-file frontmatter; aspirational claims without grounding fail validation.
- **AskUserQuestion batching protocol used as designed** (Step 2 of Modernize): 11 findings → 0 P0 (auto-apply) + 4 P1 (one question, multi-select) + 2 P2 (one question, single-select for the architectural choice) + 5 P3 (one question, multi-select after dropping 2 no-op findings F7/F8). 4 questions total, under the 4-question/16-option cap. User selected all options across all questions.
- **No version bump in skill bodies** – only the manifest version, CLAUDE.md banner, and CHANGELOG. SKILL.md grew 472 → 477 lines (safe under 500-line Rule #16 BLOCKING cap).

### Accepted risks

- **Staged rollout skipped.** Modernize pass is intra-version polish – no trigger-phrase rewrites that affect downstream consumers (the new `when_to_use:` is additive; `<example>` blocks unchanged in number / overall structure). Per v4.2.0–v4.2.3 admin-merge precedent for single-skill Modernize passes. Future audits should expect a regression report if any user reports a misroute in the first 48h post-tag.
- **Hybrid `description: <example>` + `when_to_use:` pattern is unprecedented in the plugin.** managing-agents is the first skill to ship both. If Anthropic's matcher prefers one over the other for activation scoring, the hybrid could behave differently than either pure pattern. No evidence either way today; no known matcher-precedence rules documented. Watch for trigger-phrase activation drift.

### Known limitations

- **`effort:` field is now declared on all 7 ma-* agents, but other agent families (`mi-*` is the only other family that has it, applied in v4.2.2) still lack uniform declarations**. `ms-*`, `ma-*`, `mi-*` now declare; `spec-*` (23 agents), `e2e-*` (4), `release-*` (2), UI/UX (4), tech-domain (6), generic (9) do NOT. Modernize passes against the orchestrating skills (managing-skills, managing-specs, etc.) will surface the same asymmetric-drift catch and trigger family-by-family cascades. Tracked as cumulative work, not a single deferred item.
- **Modernization registry rows for routine-Modernize skills still pending**: 7 skills remain (`using-erfana`, `managing-specs`, 5 design-* skills). Backlog ordering deferred to maintainer judgement; no automated trigger.

## [4.2.3] - 2026-05-13

Adds the first process skill to the plugin: `erfana:grill-me`, imported verbatim from the upstream `superpowers:grill-me` skill (Socratic one-at-a-time interrogation of a plan or design, walking the decision tree with a recommended answer per branch). Schema-adapted for plugin frontmatter (split `description` + `when_to_use`, added `allowed-tools`, added `AskUserQuestion` to the tool set so questions render as structured options rather than plain-text prompts).

### Added

- **`skills/grill-me/SKILL.md`** – new process skill. Frontmatter: third-person trigger sentence, ≥3 quoted activation phrases (`"grill me"`, `"stress-test this plan"`, `"stress test my design"`, `"interview me about this"`, `"get grilled on my design"`, `"ask me hard questions"`, `"challenge my plan"`, `"challenge my design"`, `"poke holes in this"`, `"walk the decision tree"`), `allowed-tools: Read, Glob, Grep, AskUserQuestion`. Brand-agnostic – does NOT consume `design-shared/`. No internal agents, no references folder.
- **New "Process skills" taxon** in CLAUDE.md, README.md, `skills/using-erfana/SKILL.md`, and `docs/architecture.md`. Grill-me is the first inhabitant. Taxon is descriptive (groups skills that shape *how* to approach a task rather than producing artifacts), not a new product domain – the plugin's elevator pitch stays "design + orchestration toolkit".
- **Process branch in the using-erfana decision flow** before the orchestration / design branches: explicit "stress-test a plan / be grilled on a design" recognition routes to `erfana:grill-me`.

### Changed

- **Plugin shape**: 13 → 14 auto-discovered skills. Plugin-root agents (76), per-skill internal agents (`managing-articles` 23, `managing-reports` 11), hooks (4), and slash commands (1) all unchanged.
- **CLAUDE.md / MAINTAINER.md / docs/verification-gates.md / docs/architecture.md / README.md / skills/using-erfana/SKILL.md** updated atomically with the new skill count to satisfy Gate 15 Check 4. Version banner bumped to v4.2.3.
- **Plugin and marketplace manifest descriptions** updated to enumerate the new process skill alongside the existing design + orchestration counts.

### Internal

- **Semver call**: v4.2.3 patch bump rather than v4.3.0 minor. Rationale: adding a 4-line generic utility skill aligns with project precedent (v4.2.2 added the Display operation as a patch-level bump despite being a new operation surface), and v4.3.0 is already informally reserved for the Gate 2 hard-block enforcement transition (deprecated Anthropic APIs in agents, Opus 4.7 description-pattern violations). Coupling those to grill-me's addition would have been incoherent.
- **No staged rollout**. The skill is a verbatim import of upstream content with adapted frontmatter; trigger phrases are new and do not collide with any existing skill (`grill-me`, `stress-test`, `interview me`, `challenge my plan`, `poke holes`, `walk the decision tree` are all unused elsewhere in the plugin). Single-maintainer admin merge applies per CLAUDE.md "Release process".
- **Post-release-prep review** via `erfana:managing-skills` review operation in standard mode returned HEALTHY 4.5/4.5 applicable (focused-skill shape; 0 P0/P1/P2/P3 findings; 10 quoted trigger phrases — 3.3× the ≥3 convention; combined `description` + `when_to_use` ≈ 496 chars, 32% of 1,536 budget; no deprecated APIs; no verify-scaffolding). Next routine review scheduled 2026-06-13.

### Accepted risks

- **Personal-scope `~/.claude/skills/grill-me/SKILL.md` shadows the plugin copy on Marcin's machine.** A personal copy created during initial import (before the plugin-install decision was reversed) still lives at `~/.claude/skills/grill-me/SKILL.md`. Claude Code resolves personal-scope skills before plugin-scope copies, so plugin updates to grill-me will NOT propagate to Marcin's sessions until that file is deleted. Other employees who install the plugin fresh are unaffected. To clean up: `rm ~/.claude/skills/grill-me/SKILL.md`.

## [4.2.2] - 2026-05-10

Post-modernization cleanup of `managing-issues` driven by a 3-reviewer audit (orthodox checklist + adversarial regression + first-time-user UX) of the v4.2.1 Modernize-operation output. 20 review findings addressed plus 2 maintainer-directed scope expansions: a brand-new Display operation (single / list / search modes) and a dedicated shared-vocabulary file for phase requirements.

### Added

- **`Operation: Display`** in `managing-issues` — read-side GitHub issue surface with three discrete modes:
  - **single** (`show issue #N`): fetch one issue by number.
  - **list** (`list issues`, `list open issues`, `recent issues`): list issues with state / labels / limit filters.
  - **search** (`find issues with label X`, `search issues for Y`): search by free-text query plus filters.
  Three-phase workflow with no quality gates (read-only). Chain-out follow-ups via `AskUserQuestion`: "Implement this issue", "Review related code", drill-down into list/search results. Implements the long-acknowledged `show issue #N` capability.
- **`agents/mi-issue-displayer.md`** — new shared agent for the Display operation. Single agent with `mode: single | list | search` parameter (shares auth + format pipeline). `model: opus`, `effort: medium`. Tools: `Read`, `Bash` (`gh` CLI). Pre-flight gates on `gh auth status`; surfaces `needs_user_input` on auth failure.
- **`reference/phase-requirements-shared.md`** — extracted shared vocabulary (capability vocab, domain vocab, criticality levels, allow_direct policy) from `implement-phase-requirements.md`. All 4 operation-specific phase-requirements files now cross-reference this shared file equally — no implicit "implement is canonical" hierarchy. Includes new Display capability category and Display domain.
- **`operations/implement-references.md`** — hoisted Phase Files Reference + Reference Files tables from `operations/implement.md` to gain Rule #16 headroom (495 → 469 lines, +26 line buffer).
- **`reference/labels.md`** — hoisted Available Labels table from SKILL.md.
- **`reference/agents-reference-ux.md`** — hoisted UX agents section (ux-designer + ux-reviewer details) from `agents-reference-detail.md` to keep parent under 500 lines.
- **`examples/display.md`** — three worked examples (single / list / search) plus ambiguous-input handling and unauthenticated-`gh` walkthrough.
- **Compliance Review Example 4** in `examples/review.md` — walks through spec FR/NFR enumeration, `mi-spec-compliance-checker` invocation, scorecard output, and routing missing requirements into the Create operation.

### Changed

- **All shared agents standardized on `model: opus`** (D1 maintainer decision). `mi-spec-compliance-checker` moved from sonnet → opus. `mi-docs-fixer`, `mi-agent-discoverer`, `mi-agent-matcher` had been claimed as sonnet in SKILL.md but actually declared opus in agent files; reconciled by updating SKILL.md to admit opus. `test-writer`, `commit-writer` similarly reconciled. The "10x cheaper validators" cost-savings narrative was dropped — single source of truth is now agent file frontmatter.
- **`effort:` field added to all 20 plugin-root agents** that managing-issues uses (10 mi-* including mi-issue-displayer + 10 generic shared agents). Validators on `effort: medium`, classifiers on `effort: low`, file-creators / deep reviewers on `effort: xhigh`. SKILL.md table now matches agent file ground truth. Note: `mi-release-preparer` exists but is consumed by the `releasing-erfana` skill, NOT by managing-issues — it is not counted here.
- **Trigger phrase tightening (C-F1, C-F3)** in `managing-issues` SKILL.md `when_to_use`:
  - Drop bare `"review"` / `"check this"` (collide with sibling skills like `managing-skills`, `managing-reports`). Note: `"analyze code"` is retained — it is already noun-bound and does not collide with sibling-skill triggers.
  - Replace with noun-bound `"review code"`, `"review file"`, `"review component"`, `"review module"`, `"review PR"`.
  - Tighten `"audit compliance"` → `"audit code against spec"`, `"audit implementation against spec"` to disambiguate from `managing-specs`' spec-validation domain.
- **`mi-agent-matcher` agent rewritten (B-F1, B-F6)**: default `phase_requirements_path` now resolves per-operation (`./reference/${operation}-phase-requirements.md`); Step 1 logic updated to read operation-specific file plus shared-vocab file; redundant phase-prefix filtering dropped (no longer needed with split files). Previously pointed at the deleted `phase-requirements.md`.
- **Modernization plumbing scars stripped (C-F2)**: `POST-STEP scaffolding stripped per v4.2.0 patterns —` notes removed from `operations/create.md` (3 phases), `operations/review.md` (5 phases), and `phases/{1,2,3}-*.md`. Replaced with single consolidated note at top of each operation/phase: "Phases without irreversible side effects skip post-step validation per v4.2.0".
- **`SKILL.md` hoisting**: Post-Review Change Tracking section (~50 lines) hoisted to existing `reference/post-review-tracking.md`; Available Labels table hoisted to new `reference/labels.md`. SKILL.md: 477 → 441 lines.
- **Em-dash → en-dash sweep** across `managing-issues` SKILL.md + operations + phases per project style convention.
- **`managing-skills/templates/phase-requirements-template.md`** + `guides/orchestration-advanced.md`: teach the v4.2.x split-file pattern; mark legacy single-file pattern as deprecated. Without this change, new authors using these templates would produce skills that violate the modernization guidance just applied to managing-issues (B-F3 cross-skill doc drift).
- **Orphan templates wired in (D3)**: `templates/implement/requirements-clarification.md` cited from Phase 2 (Business Analysis) Step 5; `templates/implement/research-summary.md` cited from new Phase 3 (Discovery) Step 6 as explicit deliverables.

### Fixed

- **B-F4: Backup directory accidental-commit risk** — `.backups-managing-issues.20260509-161717/` (44 stale .md files) deleted; `**/.backups-*/` pattern added to `.gitignore`. ms-modifier creates these per atomic-rollback contract; previously any `git add .` could commit them. **Partial closure of v4.2.1 Known-limitation #2**: backup-location leak resolved (gitignore + deletion landed in v4.2.2 W1). The convention codification piece (formal docs in `guides/skill-modernization-guide.md` for where ms-modifier should write backups) remains informal — the gitignore pattern enforces correctness without requiring code change to ms-modifier.
- **B-F2: `operations/implement.md` 5-line Rule #16 buffer** — hoisted Phase Files Reference + Reference Files tables to sibling file. Now 469 lines (was 495).
- **C-F4: Compliance review example missing** from `examples/review.md`. Added Example 4. (The "spec-ready implement" gap also flagged by C-F4 was a false alarm — `examples/implement.md` Example 7 already covers it.)
- **C-F5: `show issue #N → Not yet implemented` routing** — replaced with explicit Display operation routing per D4 maintainer decision.
- **C-F6: Phase/QG numbering ambiguity** — added "Each phase N ends with its same-numbered quality gate QG-N (so QG-7 is the gate at the end of Phase 7: Security)" to CRITICAL ARCHITECTURAL RULES.
- **B-F5: Default agent map missing UAT row** — added `| 11 | – (direct user interaction, no agent) |` to `phases/1-agent-selection.md`.
- **A-F4: SKILL.md heaviness** — hoisted Post-Review Change Tracking + Available Labels (now 441 lines, was 477).
- **A-F6: Em-dashes** — replaced with en-dashes per project style convention across managing-issues files.
- **A-F7: Review-op TodoWrite framing inconsistency** — explicit "At Review operation start, create the following todo list:" instruction added.
- **A-F8: Modernization comment scars** — same as C-F2 above; consolidated.
- **C-F2: Modernization plumbing leakage** — same; consolidated.
- **Doc-claim sync**: 75 → 76 shared agent count cascaded to `CLAUDE.md`, `README.md`, `docs/architecture.md`, `MAINTAINER.md`; `mi-` prefix count 10 → 11 in same files. Gate 15 enforces this; all 6 doc-claim checks now PASS.

### Internal

- **3-reviewer audit (3 parallel `ms-reviewer` dispatches with distinct lenses) of v4.2.1 Modernize output** surfaced 20 findings ms-validator missed in initial pass. Two reviewers independently caught the same SKILL.md model-claim divergence — meta-finding documenting that ms-validator's static rubric needs hardening to grep-confirm agent file declarations match orchestrating skill claims (closed in V5b by adding Step 2.5 to `agents/ms-validator.md`; runtime self-test against managing-issues confirms 20/20 agents drift-free).
- **~21 atomic per-workstream commits** on `feature/v4.2.2-managing-issues-cleanup` for clean review history (W1-W9 cleanup + V1-V2 release-readiness remediation + V5-V10 deferred-items batch — exact count finalized at tag time). ms-modifier was NOT used for this PR — direct execution with explicit per-file edits since most workstreams touched many small overlapping changes that benefit from human-readable diffs.
- **Section 12 score improved** from 6.5/8 → 8.0/8.0 (orchestrator max) after generic-agent effort additions. Pre-release total: 67/70 → 68.5/70 (above 66/70 threshold). Security: 88/93 unchanged.
- **No version bump in skill bodies** — only the manifest version, CLAUDE.md banner, and CHANGELOG. Per project conventions (CLAUDE.md "Things to avoid"), Gate 15 catches any drift between manifest version and CLAUDE.md banner.

### Accepted risks (documented for the audit trail)

- **Staged rollout skipped.** Per CLAUDE.md "Release cadence and staged rollout", v4.2.2 qualifies for `rc.N` soak (trigger-phrase rewrite + new operation surface). Maintainer override granted because: (a) a 3-reviewer pass against the cleanup branch surfaced the only behavior-sensitive findings (B-F1 audit-compliance phrase, B-F3 analyze-code drift) and both were resolved before tag, (b) Gate 15 + `claude plugin validate` are the only safety net, (c) follows v4.1.0 / v4.1.2 / v4.1.3 / v4.2.0 admin-merge precedent. Future audits should expect a regression report if any user reports a misroute in the first 48h post-tag.
- **No `gh` CLI smoke test recorded for the Display operation in CI.** A one-time manual smoke run (V2g of the release plan) verified `gh issue view`, `gh issue list`, and `gh search issues` JSON shapes against `agents/mi-issue-displayer.md` field expectations. No automated regression test exists; future `gh` CLI version bumps could break the agent silently.
- **`mi-spec-compliance-checker` runtime cost change unverified.** The sonnet → opus move has documented cost/latency implications (see Migration notes); no benchmark run was performed before tag. Consumers running large compliance audits (e.g., audit-spec passes against multi-FR specs) should monitor first-week token consumption.

### Known limitations

(All originally-deferred items from the 3-reviewer release-readiness audit landed in v4.2.2 per maintainer override on 2026-05-10. Items previously listed as "deferred to v4.2.3" — 2 generic-agent capabilities, ms-validator hardening, Gate 15 docs_to_scan extension, file-cap fragility splits, and 12 low-severity findings — are now addressed in workstreams V5-V10. See `BACKLOG.md` "Completed in v4.2.2" section for the full audit trail.)

The pre-existing dead reference `guides/requirements-gathering.md` cited from `skills/managing-skills/templates/skill-md-template.md:62` and `templates/multi-tool-skill-template.md:37` — file does not exist; **carried forward from v4.2.1 Known limitations**. v4.2.3 or later may either (a) create a stub at that path, or (b) remove the citations from the two templates that reference it. Not in scope for v4.2.2 because it is a pre-existing limitation independent of the v4.2.2 review findings.

### Migration notes for users

- **Display operation is opt-in via trigger phrases**; existing Implement / Create / Review flows unaffected. Use `show issue #N` / `list issues` / `find issues with label X` to access the new operation.
- **Trigger phrase tightening** may change which skill a phrase routes to. If you previously typed `review the design-prototype skill` and it dispatched to `managing-issues` Review, it will now correctly dispatch to `managing-skills` Review. To force `managing-issues` Review, use `review code` / `review file` / `review component`.
- **`audit compliance` phrase removed** in favour of `audit code against spec` (managing-issues) and `audit implementation against spec`. The old phrase **no longer routes to managing-issues** — it is intentionally yielded to `managing-specs` to disambiguate spec-validation intent from code-side compliance audit. If you previously typed `audit compliance against spec X`, switch to `audit code against spec X` or `audit implementation against spec X`.
- **`mi-spec-compliance-checker` now runs on opus** (was sonnet). Per-call latency increases ~3-5x and cost ~5x. Consumers running batch compliance audits (Phase 9 of every Implement, plus standalone Review-compliance scope) should size token budgets accordingly. The validator's accuracy improves as a tradeoff.

### Migration notes for skill authors

- **Split-file phase-requirements pattern is now canonical** as of v4.2.x. Legacy single-file `reference/phase-requirements.md` is deprecated. New skills should use the split shape: per-operation files (`<op>-phase-requirements.md`) + shared vocab (`phase-requirements-shared.md`). See `skills/managing-skills/templates/phase-requirements-template.md` for the canonical reference shape and `skills/managing-issues/reference/` for the implemented example.
- **Modernization scaffolding scars should be consolidated.** Per-step `POST-STEP scaffolding stripped per v4.2.0 patterns —` notes are anti-pattern; replace with single per-operation note ("Phases without irreversible side effects skip post-step validation per v4.2.0"). See `skills/managing-issues/operations/{create,review}.md` for reference.
- **Per-subagent effort/model overrides** in agent registry tables are now hard-checked against agent file ground truth by ms-validator's Section 12.5 Step 2.5 (added in v4.2.2 V5b). SKILL.md claims that don't match agent frontmatter trigger high-severity findings. Authors should declare `model:` and `effort:` in EACH agent's frontmatter, not just in the orchestrating skill's table.
- **File-cap fragility:** managing-skills' Rule #16 (≤500 lines per file) requires preemptive splits when files approach 480+ lines. See managing-issues' v4.2.2 split pattern: hoist a cohesive section (~30-100 lines) to a sibling reference file rather than refactoring the whole file. Examples: `operations/review-compliance.md`, `operations/implement-phases-overview.md`, `reference/agents-reference-mi.md`.
- **Gate 15 docs_to_scan extended (V5c).** `scripts/gate-15-doc-claims.sh` now scans 6 docs (was 4): added `skills/using-erfana/SKILL.md` and `docs/verification-gates.md`. Plugin-shape count claims in those files are now CI-blocking. Skill authors who add new doc files with plugin-shape claims should follow the same pattern: extend the `docs_to_scan` list when a new doc carries a count claim that could drift.

## [4.2.1] - 2026-05-09

Honesty + documentation patch on top of v4.2.0. External Anthropic-doc audit (skill-creator, agent-skills best-practices, agentskills.io spec, 4.7 migration guide, April 2026 4.7+CC blog) of `managing-skills` surfaced two false-authority attributions and five missing best-practice patterns. All seven fixes (F1–F7) are prose-only; no behavior change for any current skill in the plugin.

### Changed

- **F1: `≥3 quoted activation phrases` rule reframed** from Anthropic-required to plugin-convention. External research found NO Anthropic source mandates a phrase count — Anthropic mandates third-person voice and "specific triggers" only. Cascaded across `SKILL.md`, `validation/pre-release-checklist.md` (item 12.2), `guides/opus-4-7-patterns.md` (Section 12.2). Item 12.2 downgraded from hard-blocking to plugin-convention warn; no skill in the plugin currently fails it.
- **F2: Rule #1 (no skill-cross-reference) refined** to ban Skill-tool invocation only. Prose terminal-state handoff (e.g. "After delivery, dispatch to `<sibling-skill>`") is now explicitly permitted, matching design-* family practice and Anthropic's silence on prose handoff.
- **F4: Guardrails ALL-CAPS endorsement softened** per Anthropic skill-creator's "yellow flag" guidance ("If you find yourself writing ALWAYS or NEVER in all caps, that's a yellow flag"). Reserved absolute imperatives for runtime-blocking concerns.

### Added

- **F3: Multi-operation skills (argument-hint pattern) subsection** in `templates/skill-md-template.md` — references Anthropic's `migrate-component $0 from $1 to $2` canonical example and `managing-specs` as in-plugin reference.
- **F5: "Combat undertrigger with mildly pushy phrasing" paragraph** in `guides/opus-4-7-patterns.md` (Section 2 description shape) — Anthropic skill-creator citation.
- **F6: New Section 18 "Skill granularity (focused vs multi-operation)"** in `guides/opus-4-7-patterns.md` — refutes the "skills should do one thing well" community myth with Anthropic first-party multi-op skill examples (pdf, docx, xlsx, pptx, claude-api).
- **F7: "Cache trade-off" subsection** in `templates/focused-skill-template.md` — documents that focused skills' sub-4096-token bodies are an acceptable design choice for artifact-driven skills, not an oversight to penalize during review.

### Fixed (Round-1 scaffolding cleanup, bundled in this release)

- **Orphan `examples/examples-new-capabilities.md` deleted** — superseded by `examples-cc21-capabilities.md` (canonical, expanded version with Examples 8-12 + decision flowchart).
- **`guides/skill-frontmatter-guide.md` reference added** to `SKILL.md` Reference Files Guides row — file existed on disk but was unreferenced.
- **TL;DR pass-threshold line updated** to include focused-reviewer (≥64/68) tier — was the outlier vs `SKILL.md:179` and `creating-skills.md:233`.
- **`guides/creating-skills.md` Validation discipline section added** — explicit guidance mirroring SKILL.md Rule 9 carve-out for exploratory steps.

### Internal

- **Two-round Modernize-operation pass** on `managing-skills`. Round 1 (4 scaffolding fixes) and Round 2 (7 Lane-4 honesty/docs fixes) bundled into a single release commit.
- **Lane-4 audit pattern** demonstrated end-to-end: external Anthropic-doc research → `usage_feedback` payload to `ms-reviewer` → structured P0–P3 findings with line-precise fixes → `ms-modifier` (`change_type: modernize`) → `ms-validator` (skill-shape-aware threshold) → 14 hard gates + Gate 13 soft + `claude plugin validate` pass.
- **No version bump in skill bodies** — only the manifest version, CLAUDE.md banner, and CHANGELOG. Per project conventions (CLAUDE.md "Things to avoid"), Gate 15 catches any drift between manifest version and CLAUDE.md banner.

### Known limitations (deferred to v4.2.2)

- **Pre-existing dead reference** `guides/requirements-gathering.md` cited from `templates/skill-md-template.md:62` and `templates/multi-tool-skill-template.md:37` — file does not exist; pre-dates this release. Detected during Round-2 cross-reference audit but out of scope for this patch (additive content only).
- **Backup-location convention codification**: `ms-modifier` currently writes backups under `skills/managing-skills.backup.<ts>/` which causes Gate 15 false-positives (extra top-level skill count). Manual workaround is to relocate to repo root or `/tmp` before running gates. Codification in `guides/skill-modernization-guide.md` deferred.

### Migration notes for skill authors

- Skills failing previous Gate 2 / Section 12.2 on the `≥3 quoted activation phrases` count alone now pass with a soft warn instead of hard fail. Specific quoted triggers are still recommended for activation reliability — the count is no longer mandatory.
- Skills using prose terminal-state handoff to siblings (e.g. design-* family) no longer violate Rule #1. Skill-tool invocation of other skills remains forbidden (recursion risk).
- Author guidance: review `guides/opus-4-7-patterns.md` Section 2 (pushy descriptions) and Section 18 (skill granularity) before authoring new skills.

## [4.2.0] - 2026-05-09

Bootstrap-first modernization of `managing-skills` for Opus 4.7 patterns. Anthropic's published 4.7 best practices (effort scale, deprecated API removal, find-vs-filter decoupling, explicit fan-out, per-subagent overrides) are now codified into the meta-skill that authors all other skills in this plugin. Every new skill emitted by `ms-creator` and every refactored sibling skill now inherits 4.7 patterns by construction.

Non-breaking — existing skills continue to load. The new Section 12 of `pre-release-checklist.md` is soft-blocking initially (warns rather than fails) to give the v5.0.0 sibling cascade time to land. Section 12.7 (deprecated APIs) is hard-blocking because those cause runtime 400 errors on Opus 4.7.

### Added

- **`Operation: Modernize`** in `managing-skills` — applies Section 12 patterns to existing skills. Workflow: ms-reviewer (deep mode) → user approves via AskUserQuestion (with explicit batching protocol for >4 findings) → ms-modifier (`change_type: modernize`) → ms-validator (skill-shape-aware threshold) → report. Trigger phrases: "modernize \<skill\>", "apply 4.7 patterns to \<skill\>", "update \<skill\> for opus 4.7". Ships with an early-exit guard: skills with nested `<skill>/agents/` directories surface a v5.0.0-cascade caveat (managing-articles, managing-reports require architectural cascade, not prose modernization).
- **`templates/focused-skill-template.md`** — design-* parity template (~143 lines). For single-purpose skills with one output type, references-heavy, and no orchestrator ceremony. Reference shape: `skills/design-prototype/SKILL.md` (65 lines), `skills/design-review/SKILL.md` (64 lines).
- **Three new reference guides** under `skills/managing-skills/guides/`:
  - `opus-4-7-patterns.md` (17 sections, ~380 lines) — effort scale, description shape, scaffolding cleanup, fan-out, find-vs-filter, per-subagent overrides, deprecated APIs, adaptive thinking defaults, task budgets beta, background subagent pre-approval, cache-friendliness, tokenizer changes, memory tool, high-resolution image support, thinking display defaults, interleaved thinking. All claims tagged ✓ Anthropic-published or ◎ community-observed with URL citations.
  - `embedded-prompts-guide.md` (~154 lines) — three-tier mental model: when to use plugin-root agents vs skill-internal `prompts/` (the `obra/superpowers` pattern) vs reference docs.
  - `skill-modernization-guide.md` (~279 lines) — per-pattern remediation playbook used by the Modernize operation.
- **Section 12 of `pre-release-checklist.md`** (7 items, weight 8.0): description voice (no "I can help" / "You can use"), description triggers (≥3 quoted), verify scaffolding cleanup, explicit fan-out, per-subagent overrides, find-vs-filter decoupled, no deprecated APIs. Skill-shape-aware applicable_max with N/A handling for focused skills (12.4/12.5/12.6 may not apply).
- **Section 8 of `review-checklist.md`** — mirror of Section 12 for ongoing-health audits (40-point scale, was 33).
- **Section 13 of `agent-pre-release-checklist.md`** — per-agent 4.7 frontmatter requirements: 13.1 effort field present, 13.2 model field present, 13.3 no fixed `budget_tokens` (BLOCKING), 13.4 no `temperature`/`top_p`/`top_k` (BLOCKING), 13.5 no always-verify scaffolding on routine steps. New 95-point scale, was 90.
- **Per-agent `effort` and `model` overrides** on all 10 ms-* agents per Model Selection Guide: orchestrators (ms-creator, ms-reviewer, ms-modifier) → opus xhigh; ms-designer → opus high; validators/researchers → sonnet medium; scoped (ms-example-adder, ms-agent-discoverer) → sonnet low.
- **Skill-shape derivation in ms-validator** (Step 1a): no Agents table → focused; reviewer-shaped + has agents → focused-reviewer; otherwise → orchestrator. Drives applicable_max and threshold per shape.
- **Phase 0 pilot record** at `tests/managing-skills/v4.2.0-pilot.md` — hand-modernization of design-review documenting which Section 12 patterns apply vs N/A.
- **Cross-reference table** in all three checklists mapping Section 12 ↔ Section 8 ↔ Section 13 equivalents.

### Changed

- **Pass thresholds in `pre-release-checklist.md`** are now skill-shape-aware (orchestrator 66/70, focused-reviewer 64/68, focused 63/66.5 — all ~95% of applicable max). Was a single 59/62 threshold. Section 12.7 (deprecated APIs) hard-blocking regardless of total score.
- **`managing-skills/SKILL.md`** Critical Architectural Rules 9 and 10 modernized: validation now applies to irreversible-side-effect steps only (file writes, agent file creation, breaking changes), not every step. Strips the always-verify scaffolding Anthropic explicitly recommends removing for Opus 4.7.
- **`pre-release-checklist.md` item 7.4** corrected from "1024 chars" to "1,536 chars combined description+when_to_use" (Anthropic-documented limit per https://code.claude.com/docs/en/skills).
- **`pre-release-checklist.md` item 1.7** softened from "EVERY step has post-step validation" to "Post-step validation present where required (irreversible side effects)" — mirrors SKILL.md Rule 9 wording, eliminates Section 12.3 self-detection on the checklist itself.
- **All skill templates** (skill-md, simple-skill, multi-tool-skill, shared-agent, agent, code-writer, read-only, research) now ship the new patterns: effort/model fields documented, Model Selection Guide referenced, deprecated-API negative-test sections added, fan-out + find-vs-filter optional patterns templated.
- **Step 1.5 fan-out** explicit in both `managing-skills/SKILL.md` and `guides/creating-skills.md`: ms-agent-discoverer + ms-agent-matcher run as concurrent Task calls in the same orchestrator turn (Opus 4.7 defaults to sequential delegation).
- **Gate 2 in `scripts/run-all-gates.sh`** extended with first-person voice detection, 1,536-char combined-limit check, ≥3 quoted-trigger heuristic, missing `effort:` field warning on ms-* agents, and deprecated-API line-start regex.
- **`using-erfana/SKILL.md`** orchestration trigger phrases extended with "modernize skill", "apply 4.7 patterns", "update for opus 4.7" so the bootstrap router routes Modernize requests to managing-skills.

### Fixed

- **Description char limit** (`pre-release-checklist.md` 7.4 + Gate 2): was 1,024 chars; Anthropic's documented limit is 1,536 chars combined `description` + `when_to_use`.
- **`ms-designer` complexity enum** (`agents/ms-designer.md:151`): added `"focused"` value. Previously `ms-creator` workflow Step 4 read `design.complexity == "focused"` to load `focused-skill-template.md` but ms-designer never emitted it — focused-skill template branch was dead code.
- **`ms-validator` skill_shape derivation** (`agents/ms-validator.md`): added explicit Step 1a decision tree feeding `applicable_max` calc. Previously the workflow body never determined skill_shape despite the output schema declaring it.
- **Section 12 max math contradiction** in `pre-release-checklist.md:185` (was "focused max = 4.0" then "(4.5; round to 4.5)" on the same line). Standardized on 4.5/6.0/8.0.

### Internal

- **9-phase implementation** with explicit atomic-merge constraint per post-implementation review:
  - Phase 0: pilot hand-modernization of design-review (~30 min, captured findings, no skill edits)
  - Phases 1-3: validation infrastructure (Section 12 + Section 8 + Section 13), templates (8 modified + 1 new focused template), reference guides (3 new)
  - Phase 4: 10 ms-* agents updated with effort/model fields plus substantive workflow changes (find-vs-filter decoupling in ms-validator, Section 12 anti-pattern detection in ms-reviewer, change_type: modernize in ms-modifier)
  - Phase 5: Operation: Modernize added to managing-skills + Modernize trigger phrases in using-erfana
  - Phase 6: managing-skills SKILL.md self-modernized to apply the patterns it ships
  - Phase 7: Gate 2 extension
  - Phase 8: end-to-end verification (5 smoke tests + ms-reviewer self-audit meta-test scoring 96/100)
  - Phase 9: corrective fixes from 4-lane post-implementation review (Option B scope: 2 BLOCKING + 5 HIGH items including ms-designer focused enum, ms-validator skill_shape derivation, Section 12 max math, rule-21 reference, AskUserQuestion batching protocol, creating-skills.md fan-out, nested-agents early-exit guard)
- **4 independent post-implementation review lanes** verified the work:
  - Anthropic-spec accuracy (claude-code-guide via WebFetch): all 14 doc claims verified verbatim
  - Solution coherence (erfana:solution-reviewer): ship-ready after Phase 9 (was needs-revision)
  - ms-reviewer self-audit (the very meta-test the modernization needs to pass): 96/100 PASS
  - Dogfood usability (general-purpose devil's advocate): low risk after Phase 9 (was medium risk)

### Known limitations (deferred to later releases)

- **Sibling cascade** to design-* and other managing-* skills: v5.0.0 plan (separate). After v4.2.0 ships, `Modernize <sibling>` is the cascade primitive. Phase 8 smoke-tests Modernize against design-review (small case) but NOT against managing-articles (23 nested agents, the harder architectural case). v5.0.0 plan must include a separate proof-of-concept against managing-articles before committing to wholesale cascade.
- **Generic-named agent renames** (code-reviewer, software-developer, commit-writer, architecture-reviewer, security-auditor, solution-architect, technical-architect, ux-reviewer): v5.0.0 (breaking change — eight unprefixed agents at risk of cross-plugin collision per the documented "last-loaded wins" non-determinism).
- **`managing-articles` + `managing-reports` nested-agent migration** to plugin-root: v5.0.0 (architectural). Modernize op's Step 1a early-exit guard surfaces the v5.0.0-cascade caveat to users who try to modernize these skills today, preventing misleading green-light scenarios.
- **MEDIUM-priority polish** identified by Lane 2/4 reviews but deferred per Option B scope: ms-validator example outputs were already updated to 70-point shape in this release; remaining M-items (M9 partial, M10/M11/M12) addressed in this release. Two new cosmetic items (creating-skills.md threshold prose, SKILL.md Operation: Create threshold listing) also fixed before tag.

### Migration notes for skill authors

- New skills: ms-creator now offers a "focused" complexity option for design-* shape skills (single-purpose, references-heavy). Use it when the skill body IS the workflow.
- Existing skills: invoke `Modernize <skill-name>` to apply 4.7 patterns. Modernize covers prose patterns (Section 12 items); architectural changes (nested-agent migration, skill split) remain v5.0.0 scope.
- Agents: declare `effort:` and `model:` in frontmatter per Model Selection Guide in `templates/shared-agent-template.md`. Avoids inheriting `xhigh + opus` from the orchestrator session for routine validators.

## [4.1.3] - 2026-05-08

Doc-sync widening + structural cleanup. Extends Gate 15 from 3 to 6 check classes so the four count claims that v4.1.2 left out (top-level skills, plugin-root agents revalidation, hooks, slash commands) are now CI-enforced. Splits `docs/verification-gates.md` (was 494/500 lines) into an index plus 15 per-gate detail files under `docs/gates/`, clearing cap headroom for future gates. No skill behaviour change; no manifest schema change; no new hooks or commands.

### Added

- **`docs/gates/`** – 15 per-gate detail files (`01-cjk.md` through `15-doc-claims.md`), one per Gate 1–15. Each file carries the verbatim implementation block + pass criteria + (where applicable) "Adding a brand / hook / claim" how-to. Verbatim blocks are preserved unchanged so any single gate can be run independently of `scripts/run-all-gates.sh`. Gates 1 and 10 (CJK scans) reconstruct the literal CJK ranges via `chr()` instead of `\u` escapes – the source files themselves live under `docs/`, which is in scope for Gate 1, so embedding the ranges directly would cause the gate to flag its own documentation. Each affected file documents the divergence at the top.
- **Gate 15 extended coverage (3 → 6 checks).** The new check classes:
  4. **Top-level skills count.** Pattern `(\d+)\s+(?:auto-discovered\s+)?skills\b(?![/-])` matches claims like `13 skills` or `13 auto-discovered skills`. Compared to `ls skills/` minus the `design-shared` bundle (which is not a skill).
  5. **Hooks count.** Pattern `(\d+)\s+(?:safety\s+hooks?|hook\s+scripts?)\b(?![/-])` matches `4 safety hooks` or `4 hook scripts`. Compared to `ls hooks/*.sh`.
  6. **Slash commands count.** Pattern `(\d+)\s+slash\s+commands?\b(?![/-])` matches `1 slash command`. Compared to `ls commands/*.md`.
  All three patterns use `\b(?![/-])` negative lookahead to exclude path-like uses (`skills/foo`, `hooks/hooks.json`) and compounds (`skills-related`). `MAINTAINER.md` joins `CLAUDE.md` / `README.md` / `docs/architecture.md` in the doc-scan set – its "Plugin scope" line carries all four count claims on a single line. The `MAINTAINER.md` "Current state" header remains version-independent and exempt from check 1 only.

### Changed

- **`docs/verification-gates.md` 478 → 62 lines.** Now an index: intro, layout reference, gate index table linking to `docs/gates/<n>-<name>.md`, run-all command, "What these gates do NOT cover" outro. The 500-line cap was 6 lines away after v4.1.2's Gate 15 addition; the next gate would have forced a split anyway. Inbound references unchanged – no doc previously linked to specific section anchors in the canonical file (verified by grep across CLAUDE.md, README.md, all docs/, MAINTAINER.md, ROADMAP.md, BACKLOG.md, SECURITY.md, CHANGELOG.md, skills/).
- **`CLAUDE.md` Hard-constraints bullet for prose-claim sync** grew from 3 to 6 classes to mirror Gate 15's new coverage. Marker updated `(v4.1.2+)` → `(v4.1.2+, extended v4.1.3+)`.
- **`CLAUDE.md` repo-layout table** gained a `docs/gates/` row and updated the `verification-gates.md` row from "Canonical reference" to "Index".
- **`CLAUDE.md` Critical commands** Gate 15 description expanded from 2 enforcement classes to 6, and gained the `extended v4.1.3+` marker.
- **`CLAUDE.md` Things-to-avoid** gained a bullet covering Gate 15's check classes 4–6: adding/removing top-level skills, hooks, slash commands, or plugin-root agents without updating the prose count claims that mirror the change. Canonical claim sites listed (banner, `MAINTAINER.md` "Plugin scope", `README.md` "What's in this plugin").
- **`CLAUDE.md` Things-to-avoid existing bullet** for per-skill agent counts rewritten in sweep #4 to use content-anchored locators ("the orchestration skills bullet list near the top of this file", "the Repository layout table row for `skills/managing-articles/`", etc.) instead of fragile L23/L27/L89 line numbers. The L89 reference was already off-by-one when v4.1.2 landed; precise line numbers re-staled on every Hard-constraint or Things-to-avoid edit. Same authoring intent, immune to file restructures.
- **`docs/architecture.md` See-also** Gate 15 entry updated with `extended v4.1.3+` marker plus explicit pointer to `docs/gates/`.
- **`scripts/gate-15-doc-claims.sh`** grew from ~3-check implementation to 6 checks (+77 lines). Each check uses the same pattern-then-compare structure; `MAINTAINER.md` added to `docs_to_scan`.

### Verification

All 15 gates plus `claude plugin validate` pass on the post-fix tree. Gate 15 self-validates that all six prose-claim classes are synced with the filesystem post-edit:

```
PASS: CLAUDE.md "Current version" v4.1.3 matches plugin.json
PASS: per-skill agent-count claims align with filesystem (2 skill(s) with internal agents; 4 doc(s) scanned)
PASS: plugin-root agents/ count 75 aligns with all "X shared agents" claims
PASS: skills/ count 13 aligns with all "X (auto-discovered) skills" claims
PASS: hooks/*.sh count 4 aligns with all "X (safety) hook(s) / hook scripts" claims
PASS: commands/*.md count 1 aligns with all "X slash command(s)" claims
```

### Accepted risks (documented for the audit trail)

- **Direct merge to main, no rc.N soak.** Mirrors v4.1.2 precedent. Gate 15 changes CI behaviour – now blocks PRs that ship with skills / hooks / slash commands / plugin-root-agents count drift in addition to the three v4.1.2 check classes. An rc.1 soak per `CLAUDE.md` "Release cadence" arguably applies. Shipping direct per maintainer override given (a) all 15 gates pass, (b) the change is purely additive – no existing pass paths flip to fail without genuine drift, and (c) the 24-hour gap between marketplace update and Claude Code session restart provides a natural safety window for the maintainer to spot any false positives before the gate matters in practice. Gate 14 (hooks) shipped under the same rationale in v4.1.0.
- **Gate 7 does not yet walk `docs/gates/*.md` for cross-reference validation.** The 16 new files (15 detail + index) carry markdown links between each other and to top-level docs. Links were verified accurate at write time but no CI guard catches future drift if a gate file is renamed. Lift can be added if drift is observed; deferred.
- **Pattern coverage limited to natural English variants** (inherited from v4.1.2). Translations or rewrites that break the regex will fall through silently. Authors should re-grep the gate after any release-process documentation rewrite.

## [4.1.2] - 2026-05-08

Release-quality hardening. Adds Gate 15 (doc-claim sync) – a hard verification gate that catches three classes of doc drift that manual review repeatedly missed pre-v4.1.2: stale `CLAUDE.md` "Current version" banner, per-skill agent counts diverging from filesystem, and plugin-root agent count drift. Also tightens the release-process documentation to make the failure modes visible rather than tribal.

### Added

- **`scripts/gate-15-doc-claims.sh`** – new hard gate. Three checks:
  1. `CLAUDE.md` `Current version: **vX.Y.Z**` matches `.claude-plugin/plugin.json` `version`. v4.1.1 banner-miss now caught at PR time.
  2. Per-skill internal agent counts in `CLAUDE.md`, `README.md`, `docs/architecture.md` match `ls skills/managing-*/agents/`. Patterns covered: `Ships <N> internal agents`, `<N> skill-internal agents`, `<N> internal agents`, and inline `<skill>/agents/` (<N>). False-positive guard: only check lines that mention exactly one `managing-*` skill.
  3. Plugin-root `agents/` count matches every `<N> shared agents` claim.
  Wired into `scripts/run-all-gates.sh` between Gate 14 (hooks) and Gate 13 (brandbook hex). Standalone runnable. Gate count is now **15 (14 hard + 1 soft)**.
- **`docs/verification-gates.md` Gate 15 section** – documents the three checks, false-positive guard, pattern allowlist, limitations, and how to add a new prose-claim pattern.
- **`CLAUDE.md` Release process – step 3** ("Sync prose version markers") explicitly enforces the `CLAUDE.md` L9 banner update on every release. Subsequent steps renumbered 4–9.

### Changed

- **`CLAUDE.md` Release process – step 8 + 9 (post-merge tag + GH Release)** strengthened with "do NOT skip these steps" wording. v4.1.0 missed both, requiring back-fill in v4.1.1+.
- **`CLAUDE.md` "Critical commands"** updated: 14 → 15 gates; 13 → 14 hard.
- **`MAINTAINER.md` `## Current state (as of v4.0.0)`** → **`## Current state`**. Version-independent header eliminates the same drift class as `CLAUDE.md` L9. Body re-listed counts (13 skills, 75 shared agents, 4 hooks, 1 slash command) and points at Gate 15 for live enforcement.
- **`ROADMAP.md`** – dropped the obsolete prediction "the next plugin release covering design-only work will likely jump to v4.1.0"; v4.1.0 was hooks + commands, not design. Replaced with factual recap.
- **`docs/verification-gates.md` intro**: 14 → 15 checks; scope marker `v2.0+` → `v4.0+`.

### Fixed

- **`.gitignore`** – added `temp/` entry. The `/erfana:doc-update` protocol creates `temp/` for scratch files; the protocol's step-13 cleanup is the primary deletion path, this is belt-and-braces against accidental commits.

### Verification

All 15 gates plus `claude plugin validate` pass on the post-fix tree.

### Accepted risks (documented for the audit trail)

- **Direct merge to main, no rc.N soak.** Gate 15 changes CI behaviour – now blocks PRs that ship with banner drift or count drift. An rc.1 soak per `CLAUDE.md` "Release cadence" arguably applies. Shipping direct per maintainer override given (a) all 15 gates pass, (b) the change is purely additive – no existing pass paths flip to fail without genuine drift, and (c) the 24-hour gap between marketplace update and Claude Code session restart provides a natural safety window for the maintainer to spot any false positives before the gate matters in practice.
- **Pattern coverage limited to natural English variants.** Translations or rewrites that break the regex will fall through silently. Authors should re-grep the gate after any release-process documentation rewrite. Tracked as future work; not blocking.

## [4.1.1] - 2026-05-08

Documentation staleness sweep on top of v4.1.0. No behavioural change, no schema change, no new files. Brings every plugin-shape claim in `CLAUDE.md`, `README.md`, and `docs/verification-gates.md` back into sync with the actual repo state (75 agents at plugin root, 13 skills, 4 hooks). Squash-merged via PR #35; this release entry tags the version that picks the doc fixes up for marketplace auto-update.

### Changed

- **`CLAUDE.md` L23, L89** – `managing-articles` "Ships 22 internal agents" → "Ships 23 internal agents". Verified via `ls skills/managing-articles/agents/ | wc -l`. The v4.0.0-fixup commit corrected the same claim in README / CHANGELOG / `docs/architecture.md` but missed the CLAUDE.md instances.
- **`CLAUDE.md` L27** – `managing-specs` "Ships 22 management agents" → "Delegates to 23 plugin-root `spec-*` agents (no skill-internal agents)". `skills/managing-specs/agents/` is empty; the 23 spec-* agents live at plugin root so they stay reusable across any future managing-* skill that needs spec lifecycle. The fix documents the architectural distinction (true skill-internal agents vs. delegation pattern), not just the count.
- **`README.md` L6** – "12 orchestration skills" → "6 orchestration skills". Typo from the v4.0.0 docs commit; the orchestration table directly below the line lists exactly 6 (`managing-{agents,articles,issues,reports,skills,specs}`).
- **`docs/verification-gates.md` L12-19** – Layout reference block rewritten from `(v2.0+)` + "8 skills" to `(v4.0+)` + 13 skills, with new lines for plugin-root agents (75), per-skill nested agents (managing-articles 23, managing-reports 11, others 0), brand bundles, and the `hooks/` directory.
- **`docs/verification-gates.md` L282** – Dropped the obsolete parenthetical describing the deprecated `erfana:design` meta-skill as `disable-model-invocation`. The skill was removed in v4.0.0 (commit `8ef509f`); the parenthetical described a state that no longer existed. Reworded to clarify Gate 8's design-only scope.

### Verification

All 14 verification gates plus `claude plugin validate` continue to pass; cross-reference count stable at 91. Brand `CLAUDE.md` (`qodeca/CLAUDE.md` v1.4) and `brandbook/CLAUDE.md` deliberately untouched – design-domain-scoped, no v4.0/v4.1 ripple.

## [4.1.0] - 2026-05-08

Plugin gains a hooks + commands surface. Four safety hooks (`bash-safety`, `secret-detector`, `post-compact-reminder`, `verify-completion`) and one slash command (`doc-update`) migrate from the maintainer's previously-global `~/.claude/` configuration into the plugin so they auto-update across employee machines through the same marketplace channel that already serves skills and agents. Personal style preferences (worktree ban, en-dash style policing, Figma per-account budgets) were stripped during migration; what ships is project-agnostic safety net + AI-assistant-specific patterns informed by 2025-2026 incident research (Wolak/McAulay rm -rf incidents, Amazon Q supply-chain attack, CVE-2025-54794/-54795, EC2 IMDS exfiltration campaigns, Bitwarden CLI persistence backdoors).

### Added

- **`hooks/`** – four shell hooks plus `hooks.json` wiring. All commands route through `${CLAUDE_PLUGIN_ROOT}/hooks/<script>.sh` for portability; no absolute paths, no home-relative paths.
  - `hooks/bash-safety.sh` (PreToolUse / Bash, 5 s timeout) – blocks `rm -rf` on system/home dirs, `rm -rf .`, `rm -rf /`, `rm --no-preserve-root`, `rm -rf $UNSET_VAR/...`, force-push to protected branches, `git reset --hard`, `git clean -f`, broad `find ... -delete` / `find ... -exec rm`, `dd if=/dev/* of=/dev/sd*`, `mkfs.* /dev/...`, `chmod 777|000` on system paths, `sudo` / `doas` / `pkexec` / `su -`, IMDS metadata access (`169.254.169.254`, `metadata.google.internal`, `fd00:ec2::254`), DROP TABLE / TRUNCATE / DELETE FROM, broad `kill -9 -1` / `killall -9`, fork bombs (bash + python), `tar --absolute-names` / `tar -P`, `curl|bash` and process-substitution variants (`bash <(curl ...)`, `eval "$(curl ...)"`), AWS / GCP / Azure cloud-teardown commands (`aws s3 rm --recursive`, `aws ec2 terminate-instances`, `gcloud * delete --quiet`, `az group delete --yes`), and persistence backdoors (writes to `~/.bashrc`, `~/.zshrc`, `~/.ssh/authorized_keys`).
  - `hooks/secret-detector.sh` (PreToolUse / Write|Edit|MultiEdit, 5 s timeout) – pattern set informed by gitleaks v8.28+ canonical config and GitGuardian 2026 sprawl report. Detects: AWS access keys (AKIA…), generic `API_KEY/SECRET/TOKEN=` assignments, OpenAI / Stripe live keys (`sk-…`, `sk_live_…`), Anthropic API/admin/session keys (`sk-ant-(api|admin|sid)…`), GitHub tokens (`ghp_`, `github_pat_`, `gho_`, `ghs_`, `ghu_`), GitLab PATs (`glpat-…` legacy + dotted routable), Hugging Face user/org tokens (`hf_…`, `api_org_…`), Sentry user auth (`sntryu_…`), Postman API keys (`PMAK-…`), PEM-armoured private keys (requires `-----BEGIN…-----` dashes – tightens v4.0 user-level regex), hardcoded passwords (with placeholder allowlist), Slack tokens (`xox[bpas]`) and webhook URLs, npm publish tokens (`npm_…`), Stripe restricted (`rk_live_…`), Google API keys (`AIza…`), Azure storage connection strings, database URIs with embedded credentials, and JWT-shaped triplets. Skips test fixtures, examples, samples, markdown docs, and any file under a `hooks/` directory (those legitimately contain pattern strings).
  - `hooks/post-compact-reminder.sh` (PostCompact, 5 s timeout) – re-injects load-bearing facts after the context window has been compacted: re-establish temporal awareness, honesty discipline, verification before completion, agent/MCP delegation, recall verification. Adds dynamic context: current git branch + `git status -sb` head. No personal style rules; no per-account budgets.
  - `hooks/verify-completion.sh` (Stop, 5 s timeout) – nudges the agent back to verification when it claims success without citing evidence. Strips fenced code blocks and quoted blockquotes before regex matching to lower false positives on quoted test output. Success-claim coverage expanded for documented false negatives: "all done", "looks good", "LGTM", "works as expected", "should work", "implementation complete", "no issues / errors / problems", "task accomplished", "ready to ship / for review / for merge / for production". Verification-evidence coverage expanded: exit code 0, common test runners (playwright / vitest / jest / pytest / rspec / mocha / cypress / deno test / cargo test / go test), `claude plugin validate`, `run-all-gates.sh`, `ALL GATES PASSED`. Returns Stop-hook protocol JSON `{"decision":"block",…}`.
- **`commands/doc-update.md`** – slash command for refreshing project documentation based on recent commits. Discovers all `docs/` and `CLAUDE.md` files, surveys the last 10 git commits, and walks a 14-step protocol that splits root-level cross-cutting docs from nested subproject docs.
- **Verification Gate 14 — hooks valid.** New hard gate validates `hooks/hooks.json` shape (top-level `hooks` wrapper, recognised event names, well-formed `matcher` + `hooks` arrays), enforces `${CLAUDE_PLUGIN_ROOT}/hooks/<script>.<ext>` path discipline (no bare absolutes, no home-relatives), confirms every referenced script exists with the executable bit set and a recognised shebang (`#!/usr/bin/env bash`, `#!/bin/bash`, etc.), runs `bash -n` syntax check on every shell hook, and (when `shellcheck` is on PATH) runs shellcheck with project-relevant exclusions. Standalone runner under `scripts/gate-14-hooks.sh`; wired into `scripts/run-all-gates.sh` between Gate 12 and Gate 13. Gate count is now 14 (13 hard + 1 soft).

### Changed

- **`.claude-plugin/plugin.json`** – `description` extended to mention hooks and commands.
- **`.claude-plugin/marketplace.json`** – plugin-entry inline description mirrors plugin.json.
- **`scripts/run-all-gates.sh`** – Gate 14 inserted between Gate 12 (brand manifests) and Gate 13 (brandbook hex coverage) so the new hard check runs before the soft trailing gate.

### Removed

- **`~/.claude/hooks/*.sh`** and **`~/.claude/commands/doc-update.md`** removed from the maintainer's global config; the corresponding `hooks` block in `~/.claude/settings.json` is removed in the same commit. The plugin is the sole source going forward. `~/.claude/commands/nb-flash.md` and `~/.claude/commands/nb-pro.md` stay user-scope (they depend on the user-scope nanobanana MCP server and have no value to other consumers).

### Accepted risks (documented for the audit trail)

- **Direct merge to main, no rc.N soak.** `CLAUDE.md` mandates staged rollout for changes of this magnitude (hook additions are explicitly listed as a trigger for staged rollout). v4.1.0 ships through the routine direct-merge flow per maintainer override. Gate 14 verification + `claude plugin validate` plus the standalone hook self-tests in this PR are the safety net; pilot deployment to 1 employee (the maintainer's own dev machine) for 24h is the practical soak before the wider Qodeca team picks the new version up on auto-update.
- **Hook execution requires session restart.** Hooks load at session start; existing Claude Code sessions on employee machines pick up the new hooks only after the next `claude` restart. The release notes for v4.1.0 should call this out so employees do not see a 24-hour gap between marketplace update and hook activation.
- **`PostCompact` hook now reads `git status`** – introduces a per-compact subprocess. Failure modes are silent (`|| true`); worst case is the dynamic-state block is empty. Acceptable; alternative is a static reminder which loses 90% of the value.

## [4.0.0] - 2026-05-06

Plugin scope widens from a focused design toolkit into a design + orchestration toolkit. Marcin's previously-global Claude Code config (75 shared agents and 6 orchestrator skills under `~/.claude/`) lands in this plugin so it auto-updates across employee machines through the same marketplace channel that already serves the design skills. Major bump because the plugin's marketplace description, keywords, and consumer expectations all change – additive on the surface, but the product identity shifts.

### Added

- **`agents/`** – 75 shared agents migrated from `~/.claude/agents/`. Prefix breakdown: `spec-` (23), `mi-` (10), `ms-` (10), `ma-` (7), `e2e-` (4), `release-` (2), UI/UX (4), tech-domain (6), generic (9). Auto-discovered by Claude Code; orchestration skills delegate substantive work to these via the `Task` tool.
- **`skills/managing-agents/`** – Full lifecycle management of Claude Code agents (research → design → validation phases). Ships its own internal validation/review checklists.
- **`skills/managing-articles/`** – End-to-end medium-form article authoring (research, outline, draft, review, publish) with bilingual Polish / English support. Ships 23 skill-internal agents under `agents/`.
- **`skills/managing-issues/`** – Full GitHub-issue lifecycle: create, implement (multi-phase: business analysis → discovery → architecture → implementation → review → security → quality → verification → docs → UAT → finalization), and review code.
- **`skills/managing-reports/`** – Professional consulting-report production with Pyramid Principle, SCQA framework, Five C's findings format, sentence-case validation. Ships 11 skill-internal validation agents.
- **`skills/managing-skills/`** – Lifecycle management for Claude Code skills following Anthropic best practices.
- **`skills/managing-specs/`** – 4-tier specification management: T1 issue, T2 spec, T3 lite spec, T4 standard spec. Ships templates and validation checklists; delegates to the 23 plugin-root `spec-*` agents in `agents/` rather than carrying skill-internal agents of its own.
- **`skills/using-erfana/SKILL.md`** – Bootstrap router rewritten as a top-level meta-router for the entire plugin. New "Orchestration" sub-table alongside the existing "Design" sub-table; orchestration tier in the decision flow above the existing design tier; explicit "design-skills only" tag on the Brand context section.
- **Verification Gate 2 + Gate 7 widened scope** – `scripts/run-all-gates.sh` now also walks `agents/*.md`. Gate 2 enforces the agent-name-equals-basename invariant (mirror of the existing skill folder-name invariant). Gate 7 sweeps agent prompts for dead markdown links. Both blocks are guarded by `os.path.isdir('agents')` so the gate stayed a no-op on the design-only tree.

### Changed

- **`.claude-plugin/plugin.json`** – `description` and `keywords` widened from "design-only" to "design + orchestration toolkit". Adds `orchestration`, `agents`, `automation` keywords.
- **`.claude-plugin/marketplace.json`** – mirrors plugin.json description and tags. Plugin entry's inline description widened.
- **`scripts/run-all-gates.sh` Gate 9 (watermark consistency)** – allowlist extended to skip the literal `Created by default` in `managing-specs/templates/t4-standard-spec/README.md` (template prose describing filesystem-creation behavior, not brand watermarking). Gate 8 (trigger phrase coverage) intentionally stays scoped to `skills/design-*/SKILL.md` so orchestration skills don't trip its design-specific category checks.
- **`docs/verification-gates.md`** – mirrors the script changes (Gate 2 agent loop, Gate 7 agents/*.md sweep, Gate 9 allowlist row).
- **In-line corrections to migrated content needed to land cleanly:** `skills/managing-articles/SKILL.md` description quoted to keep the embedded colon from breaking strict YAML parsing; `skills/managing-reports/SKILL.md` uses `name:` instead of `skill_name:` to match the canonical frontmatter contract. Both fixes ported back to `~/.claude/skills/` so the global source stays consistent.

### Removed

- **`skills/design/`** – the deprecated `erfana:design` v1 meta-skill router. It had been `disable-model-invocation: true` since v2.0.0, kept purely for backward compatibility with v1.x invocations. Removal originally scheduled for v3.0; deferred through v3.1.0; landed with v4.0.0 alongside the broader scope expansion to reduce cumulative breakage. Consumers who still type `/erfana:design` should switch to the specific sub-skill they need.

### BREAKING CHANGES

- **`erfana:design` meta-skill removed.** Consumers who pinned that invocation path get "skill not found" responses; switch to `/erfana:design-prototype`, `/erfana:design-slides`, etc. directly.
- **Plugin description and category-adjacent expectations.** The plugin advertises itself as a design toolkit; consumers expecting design-only behavior will now see orchestration skills appear in the discovery surface and 75 generic-name agents enter the agent pool.

### Accepted risks (documented for the audit trail)

- **Generic-name agent collisions.** `agents/code-reviewer.md`, `agents/commit-writer.md`, `agents/software-developer.md`, `agents/architecture-reviewer.md`, `agents/security-auditor.md`, `agents/solution-architect.md`, `agents/technical-architect.md`, `agents/ux-reviewer.md` may collide with built-in Claude Code agents or agents shipped by other plugins (`superpowers:*`, `feature-dev:*`, etc.). Last-loaded wins; behavior is non-deterministic in mixed-plugin environments. To smoke-test the plugin's own copies specifically, prefer prefix-named agents (e.g. `mi-codebase-explorer`).
- **Per-skill nested agents/ discovery.** `managing-articles/`, `managing-issues/`, `managing-reports/`, and `managing-skills/` ship internal agents under `<skill>/agents/`. The official Claude Code plugin spec documents only plugin-root `agents/` discovery; per-skill nested discovery is unverified. If an orchestration skill silently fails to find its internal agents, follow-up will hoist them to plugin root with disambiguating prefixes.
- **Direct merge to main, no rc.N soak.** `CLAUDE.md` mandates staged rollout for changes of this magnitude; v4.0.0 ships through the routine direct-merge flow per maintainer override. Gate verification + `claude plugin validate` are the only safety net.
- **`~/.claude/` source kept duplicated indefinitely.** Marcin's global config remains under `~/.claude/agents/` and `~/.claude/skills/managing-*` as a redundant backup. The two copies are now mutable and can drift; mitigation is documentation-only.
- **Path-strip in agent and skill prose.** All `~/.claude/agents/` and `~/.claude/skills/` references in migrated content rewrite to plugin-relative `agents/` and `skills/`. Some agents (e.g., `ms-modifier`) describe creating new shared agents at the rewritten path; consumers running the plugin from a managed install location may see these instructions point to a read-only directory. Behavioral edge cases will surface during real use; not blocking for v4.0.0.

## [3.2.0] - 2026-05-06

Lessons-learned codification from the qodeca-sales-deck slide 01 redesign session (2026-05-04 to 2026-05-06). Three review passes (initial three-perspective audit + meta-review + canonical-inclusion validation) tightened the canon edits to a small, signal-dense set.

### Added

- **`skills/design-shared/brands/qodeca/backgrounds/gradient-7-{HD,4K}.png`** – dark/high-contrast captured composition. Near-black field dominates the upper-left two-thirds; a tilted violet bloom enters from the right edge centred around the right-third with a faint lime trace in the bottom-right corner. The composition has `scaleX(-1) rotate(-12deg) scale(1.4)` baked in (see backgrounds/INDEX.md WARNING). Use under cover slides and chapter dividers where headlines live in the upper-left dark field.
- **`skills/design-shared/brands/qodeca/backgrounds/gradient-7-source-{HD,4K}.png`** – the un-transformed source twin of gradient-7. Use this when you need to re-orient (mirror, rotate, scale) the composition for a different slide.
- **`skills/design-shared/brands/qodeca/backgrounds/INDEX.md` v1.2** – count bumped from 12 → 16 entries; `WARNING:` prefix on the gradient-7 row stating that the asset has a transform baked in and pointing to the reorientable source twin.
- **`skills/design-shared/brands/qodeca/CLAUDE.md` v1.3 § Colour usage rules / Bg-layer carve-out**. CSS gradient interpolation through `transparent` on brand colours (`linear-gradient(..., var(--qd-X), ..., transparent ...)` and the radial equivalent) is permitted **only on full-bleed background layers** (the `<body>` background, a dedicated `.bg` div, or an element that exists solely as a bleed surface). Forbidden on text, borders, surfaces, dividers, components, shapes, photo overlays, or any element that carries content. The carve-out exists so bg-layer CSS gradients are not held to a stricter standard than the raster bg assets they replace.
- **`skills/design-slides/references/slide-decks.md` § Common pitfalls #5 – export-pipeline failure modes (`html2pptx` + `export_deck_pdf.mjs` flattening)**. Three CSS techniques known to lose fidelity vs. the live HTML render: (a) `box-decoration-break: clone` on multi-line inline spans (marker-pen highlight collapses or disappears); (b) layered CSS `radial-gradient(...)` with multiple stops, especially when stacked via comma-separated `background:` (rasterised at low fidelity or replaced with a single fill); (c) compound `transform: scaleX/rotate/scale` on background-positioned elements (transform chain dropped). General rule + recommended workarounds (pre-bake to PNG, use `<br>`-separated single-line highlight spans, capture the rendered bg as a PNG and consume via `<img>`).
- **Project `CLAUDE.md` § Repository workflow / Pre-commit checklist**. Four-item checklist that must run before every commit touching brand or deck files: (1) `bash scripts/run-all-gates.sh` and `claude plugin validate .` pass; (2) `git branch --show-current` is not `main`; (3) every modified slide HTML's `<aside class="speaker-notes">` reflects current visible copy; (4) every file under each deck's `tests/design-slides/<deck>/assets/` is referenced by at least one slide HTML.
- **Project `CLAUDE.md` § Repository workflow / Atomic commits**. Each commit's diff must stay within one of `{deck-iteration, brand-bundle, infrastructure}`. A commit that touches both `skills/design-shared/brands/qodeca/...` and `tests/design-slides/<deck>/...` should be split.

### Changed

- **`tests/design-slides/2026-05-02-qodeca-sales-deck/slides/01-cover.html`** – cover redesigned end-to-end. Final state: brand-shipped headline lead-in weight (500), corrected speaker notes, custom layered radial-gradient bg (compliant with the new bg-layer carve-out), `Digital innovation / for leaders / in fitness` headline with marker-pen lime highlight on `fitness` matching qodeca.com hero technique (105deg slanted-edge gradient + box-decoration-break: clone), bleeding 80%-tall hero arrow, kicker pinned to bottom-left in `zone-bottom`, white logo on dark surface.
- **Deck local assets cleanup** – removed orphan `gradient-3-1920x1080.png`, `gradient-7-1920x1080.png` and `shape-2.svg` from `tests/design-slides/2026-05-02-qodeca-sales-deck/assets/`.

## [3.1.0] - 2026-05-03

Codification release. The 2026-05-02 qodeca sales-deck session generated five rounds of brand and process feedback plus one organic rule discovered mid-build. None were in the skill or brand reference files; every redesign re-derived them from chat. v3.1.0 propagates them into the canonical reference docs so future Claude Code sessions pick them up the first time. Two parallel reviewer agents audited the codification commit and three follow-up gaps were closed in a fix-up commit before this release.

The `tests/` scratch space (added in this release) is the empirical reference these rules describe; the v6 qodeca sales deck under `tests/design-slides/2026-05-02-qodeca-sales-deck/` is the working artefact that demonstrates compliance.

### Added

- **`tests/` scratch directory** for skill output verification (one subfolder per output-producing skill: `design-direction`, `design-prototype`, `design-slides`, `design-motion`, `design-infographic`, `design-review`). Per-deck `assets/` folders inside test outputs are local copies of brand assets, not references to `skills/design-shared/brands/...` (see Asset isolation rule below).
- **First end-to-end design-slides test artefact**: `tests/design-slides/2026-05-02-qodeca-sales-deck/` ships a 10-slide qodeca sales deck (cover + the-shift + who-we-are + what-we-deliver + where-we-go-deep + Bay Club case + MedSimples case + how-we-work + why-qodeca + lets-talk). Walked through six iteration rounds against user feedback; final v6 artefact passes the slide-fit walker on every slide (51 px headroom slides 2-10, 85 px slide 1) and complies with every rule codified in this release.
- **`skills/design-slides/SKILL.md` step 5b – per-slide independent review**. After each slide reaches first-pass completion, dispatch one fresh `general-purpose` Task subagent per slide. The frozen review prompt covers brand-token compliance, font floor (≥20 px), footer uniformity, logo presence on every slide, hierarchy contrast, opacity, letter-spacing, ALL-CAPS, 8 px grid alignment, and no-text-only-slides. Reviews run in parallel; orchestrator MUST apply Fix items before declaring the deck ready – this is a verification gate, not a feedback request.
- **`skills/design-slides/references/slide-decks.md` § 8 px grid (normative spacing scale)**. New subsection with the allowed scale `8/16/24/32/40/48/56/64/72/80/96/104/112`, two permitted exceptions (1 px hairline borders; 4 px optical-correction half-step for icon-to-text inline alignment), and the CSS custom-property template (`--s-1: 8px; --s-2: 16px; ...; --s-14: 112px`).
- **Per-deck `assets/` folder mandate** (slide-decks.md § Path A directory structure). design-slides MUST copy every brand asset it uses into the deck's own `assets/{logo,backgrounds,photos,shapes,...}/` subfolders. Slide HTML and CSS reference `../assets/...` exclusively – never the source brand-bundle path. The deck remains portable when zipped, opened on another machine, or detached from the plugin tree. Verification checklist gains an `Asset isolation check` item (`grep -r 'skills/design-shared/brands' .` from deck root must return zero).
- **Verification checklist items 7-9** (slide-decks.md): per-slide subagent review applied, screenshot cleanup before declaring done (`find . -name '_*.png' -delete`), asset-isolation grep check.
- **`skills/design-shared/references/verification.md` § Cleanup**. New section documents the `_*.png` naming convention and the safe cleanup glob. The convention exists so brand assets (which never start with `_`) are never accidentally deleted by the cleanup pass. Lists the canonical post-cleanup deck folder layout: `index.html`, `slides/`, `shared/`, `assets/`.
- **`skills/design-shared/brands/qodeca/CLAUDE.md` v1.2** – four new sections plus updates throughout:
  - **Typography rules**: Plus Jakarta Sans is the only typeface (with Material Symbols Outlined as the single iconography carve-out per brandbook page 18); sentence case everywhere, no ALL-CAPS in artwork; no `letter-spacing` adjustments anywhere (`line-height` IS permitted).
  - **Colour usage rules**: strict palette (violet / lime / brand black / brand white + supplementary palette for graphics-only contexts); never apply opacity to brand colours – zero exceptions.
  - **Hierarchy and contrast**: express text hierarchy by swapping brand colours, not by lowering opacity. On light surfaces, lead is violet, emphasis is brand black (darker). On dark surfaces, lead is violet, emphasis is brand white (brighter). Worked HTML example included; WCAG AA contrast (4.5:1 body, 3:1 large) enforced.
  - **Component surfaces**: card / panel surfaces use one of two recipes – Recipe A (transparent fill + 1 px solid brand-colour border, 16-24 px radius, exactly 1 px thickness) for content density on light or neutral surfaces; Recipe B (solid brand-black surface with full-opacity brand-colour text) to anchor a primary feature card. No tinted-rgba fills, no gradients, no half-step border weights.
  - **Footer + per-slide logo (slide-deck rules)**: slide 1 (cover) ships without a `<footer>` element; slides 2-N share identical footer markup, classes, and copy with only the page-number span varying; logo presence is mandatory on every slide (full lockup on cover/closing, symbol-only via `.qd-brand-mark` on content slides 2-N); use brand backgrounds and brand shapes frequently (qualitative, no fixed percentages).
  - **Brand-presence rule** added under "When to consult what" so motion / prototype / infographic outputs inherit the use-brand-shapes-and-backgrounds-frequently rule, not just slide decks.
- **`skills/design-shared/brands/qodeca/shapes/RULES.md` § Transformation rules**. New section: shapes may be MIRRORED but never ROTATED. Permitted: `scaleX(-1)`, `scaleY(-1)`, `scale(-1, -1)` (180° flip via mirror). Forbidden: any `rotate()` value or compound transform that includes a non-180° rotation. The two arrow shapes (`shape-arrow-left.svg`, `shape-arrow-right.svg`) ship as a mirror pair precisely because rotation is forbidden – use the appropriate variant instead of mirroring an arrow yourself.
- **`skills/design-shared/brands/qodeca/shapes/RULES.md` § Colour rule (sharpened)**. Explicit allowlist (brand black, brand white, violet, lime); no tinted variants, no gradients, no off-palette neutrals (`#666`, `#CCC`, `#EEE` forbidden); no opacity and no `rgba(brand-RGB, alpha<1)`; supplementary palette is for surrounding artwork only, NOT shape fills.
- **`skills/design-shared/brands/qodeca/logo/RULES.md` § Logo presence in slide decks**. New section with full-lockup-vs-mark-only zoning (full lockup in `zone-top` on cover and closing; symbol-only mark in top-right on content slides via `.qd-brand-mark`). Canonical `.qd-brand-mark` utility CSS shipped: 48 px sygnet width, top-right offset 96 px right / 56 px top, ~24 px optical clear space (preserves the 50 px screen-minimum from the existing minimum-size rule).

### Changed

- **`skills/design-slides/references/slide-decks.md` § Scale**: hard floor 20 px now applies to all text on a slide. Supersedes the previously-documented sub-floors (mono labels at 14 px, footer at 15 px, side-index at 16 px, metric meta-labels at 14 px). Bump every label, kicker, and footer to 20 px or larger.
- **Pre-flight checklist item 5** in `slide-decks.md` rewritten from "Mono labels ≥14px, footer ≥15px, side-index/agenda ≥16px" to the 20 px hard floor (with cross-link to § Scale). Path B mirror at the equivalent line in slide-decks.md updated to match.
- **`skills/design-slides/references/slide-decks.md` § Visual rhythm**: new "no text-only slides" anti-pattern at the top of the section. Every content slide must carry a non-typographic element (brand shape, photo, gradient, Material Symbol, chart, divider rule). Pure paragraphs read as a memo / draft / mockup.
- **`skills/design-slides/references/slide-decks.md`** publication-grammar diagram (line 134) updated from "uppercase label" to "sentence-case label" – the canonical case-rule home is now qodeca/CLAUDE.md § Typography rules.
- **`skills/design-slides/SKILL.md` anti-patterns**: the "Mono / meta labels under 14 px" warning replaced with the 20 px hard floor. Cross-references the slide-decks.md § Scale supersession.
- **`skills/design-shared/brands/qodeca/CLAUDE.md`** "Brand identity" typography line updated: Plus Jakarta Sans declared as the only typeface; JetBrains Mono removed from the line; Material Symbols carve-out documented inline. Forward-cross-references the new "Typography rules" section.

### Removed (limited breaking change)

- **`skills/design-shared/brands/qodeca/tokens.tokens.json` `typography.fontFamily.mono` token** – JetBrains Mono dropped entirely from the qodeca brand bundle. Code blocks render in Plus Jakarta Sans regular weight. Material Symbols Outlined remains for iconography (per brandbook page 18) and is the single carve-out from the brand-font-only rule. Consumers using `var(--qd-font-mono)` need to switch to `var(--qd-font-sans)`. The blast radius is limited – the mono token had no usage in any shipped skill output and was a "sensible technical default" added when the brandbook was silent on a code typeface.
- **`skills/design-shared/brands/qodeca/brand.json` `typography.mono` field** – removed from the manifest top-level typography object. The brand schema's default `tokensContract` requires `typography.fontFamily.mono`, so qodeca declares an explicit `tokensContract` override that excludes it. Gate 12 picks up the override correctly; no schema change needed.

### Fixed (audit follow-ups)

- **`skills/design-slides/references/slide-decks.md` pre-flight + Path B mirror** still endorsed the superseded 14/15/16 px sub-floors after the § Scale rewrite. Reviewer Agent B caught it; both lines rewritten to point at § Scale. Without this fix, an agent reading the checklist top-down would have seen the old floors first.
- **`skills/design-slides/SKILL.md` step 5b review prompt** missed enumerating "no text-only slides" as a violation class. Added to the prompt so the reviewer subagent flags pure-text slides; closes the gap before it became an unchecked regression vector.
- **B10 brand-presence rule discoverability** – the qualitative "use brand backgrounds and shapes frequently" rule was buried in the slide-deck section of `qodeca/CLAUDE.md`, invisible to the motion / prototype / infographic paths. Promoted to a cross-deliverable rule under "When to consult what" so all four sub-skills inherit it. Reviewer Agent A flagged.
- **Plan file (`~/.claude/plans/let-s-perform-first-test-fuzzy-iverson.md`) B13 spec drift** – plan originally specified `.qd-brand-mark` at 32 px width; codified at 48 px to preserve the existing 50 px screen-minimum from `logo/RULES.md`. Plan now documents the deviation with the rationale.

### Internal

- Two parallel reviewer agents audited the codification commit (`dbd748b`); their pass / warn / fail findings are summarized in commit `2539ab5`. All P1 findings closed before this release.
- Plan file `~/.claude/plans/let-s-perform-first-test-fuzzy-iverson.md` is the audit trace; Tables 1 (skill, S1-S7) and 2 (brand, B1-B13) are the full rule index.
- All 13 verification gates pass on every commit since v3.0.0; no gate output regressed.

## [3.0.0] - 2026-05-02

Major release. Two streams converged: the **erfana brand removal** (breaking) and the **qodeca v0.4.0 brandbook integration** (additive but substantial). The plugin package id `erfana` survives only as a technical id (plugin.json `name`, the `/erfana:` slash-command prefix, the `erfana-skills` repository name, and the `using-erfana` bootstrap skill). Active brand is now `qodeca`; the legacy `Created with Erfana` watermark literal is gone from every output surface. Gate 9 enforces a single watermark literal (`Created with Qodeca`); the `skills/design-shared/brands/erfana/` bundle and its 11 files are deleted.

The `/erfana:` slash-command prefix and the seven user-facing skill names (`erfana:design-direction`, `erfana:design-prototype`, `erfana:design-slides`, `erfana:design-motion`, `erfana:design-infographic`, `erfana:design-review`, `using-erfana`) are unchanged. The deprecated `erfana:design` meta-skill (`disable-model-invocation: true`) also remains in this release; its removal is rescheduled to a later v3.x.

### Removed (breaking)
- `skills/design-shared/brands/erfana/` bundle and its 11 files. Active brand is now `qodeca`. External consumers that pinned to `brands/erfana/` paths (or to the `Created with Erfana` watermark literal) must migrate to `brands/qodeca/` or their own brand bundle. The migration is a one-character edit to `skills/design-shared/brands/ACTIVE_BRAND` for in-tree readers.
- `Created with Erfana` watermark literal removed from `demos/hero-animation-v10.html` and every `voice.watermark` source-of-truth reference. Gate 9 allowlist now contains exactly one literal (`Created with Qodeca`).
- "Erfana" brand-noun scrubbed from skill prose, top-level docs, plugin manifests, brand-system internals, demo HTMLs (10 files: watermarks + wordmarks), `banner.svg` H1, motion-reference titles, the qodeca `tokens.tokens.json` description, and historical CHANGELOG entries.

### Added
- `skills/design-shared/brands/qodeca/brandbook/` – source brandbook subfolder. Ships `qodeca-brandbook-2025-pl.pdf` (5.9 MB, 20 pages, canonical source), `qodeca-brandbook-2025-en.pdf` (3.2 MB, English counterpart), `qodeca-brandbook-2025-pl.ocr.md` (706-line OCR derivative via liteparse, lossy on diacritics / diagrams – use for full-text search only), and `screenshots/qodeca-brandbook-2025-pl/page-001.png` … `page-020.png` per-page rasters (~29 MB total). Out-of-band provenance, NOT consumed by sub-skills – self-documented by `brandbook/CLAUDE.md` which formalises the convention (year-stamped naming, `*.ocr.md` infix, screenshots subdir layout, OCR caveats, when-to-consult guidance). Brandbook is in scope for Gate 1 (CJK ban) and Gate 7 (cross-references) but explicitly OUT of scope for Gate 12's INDEX.md cross-checks.
- `skills/design-shared/brands/qodeca/brand.json` v0.4.0 – brand bundle bumped from v0.3.0. Adds the supplementary palette (4 neutrals + 5 accents from brandbook page 14) on top of the page-13 primaries; switches typography to **Plus Jakarta Sans** (primary + display per brandbook page 15, replacing the prior choice; six numeric weights 200/300/400/500/700/800); embeds Pantone / CMYK print metadata under `$extensions."com.qodeca.print"` for downstream print pipelines; cross-links the new per-library `RULES.md` companions.
- Per-library `RULES.md` convention (v0.4.0+) – brandbook-derived deep prose co-located with `INDEX.md` for selected libraries. Three shipped under `qodeca/`: `logo/RULES.md` (construction grid, clear space, minimum 15 mm / 50 px width, the nine forbidden uses), `photos/RULES.md` (three compositional rules + four depictable subject categories), `shapes/RULES.md` (53° base / 37° apex isosceles triangle geometric module, pattern grammar). Optional per library – ship a RULES.md only when the brandbook has rules beyond what INDEX.md catalogues. RULES.md may cite brandbook screenshot paths inline as audit-trail references using bare backticks (NOT markdown links – Gate 7 only validates markdown-link syntax, so reorganising the brandbook subfolder does not break CI).
- **Gate 13 – brandbook hex coverage (soft)**. New verifier `scripts/check-brandbook-hex.sh` greps every brandbook hex listed in `scripts/_lib/brandbook-hex-inventory.json` (single source of truth keyed by brand id and brandbook page reference) against the named tokens file. Catches transcription typos that schema validation cannot see – a swatch rendering on screen looks plausible regardless of whether the source value is `#FF5F29` or `#FF3381`. Currently 13 hexes for qodeca (4 page-13 primaries + 4 page-14 neutrals + 5 page-14 accents). Wired in `run-all-gates.sh` with a trailing `|| echo` clause so a failure surfaces a `WARN` line without aborting CI; promotion to a hard fail tracked in `ROADMAP.md` v2.3.2 item #3b after a stabilisation cycle with no false positives.
- **Gate 12 – RULES.md ↔ CLAUDE.md symmetry check (v0.4.0+)**. Every `RULES.md` discovered inside any library directory must also be cited from the brand-root `CLAUDE.md` via substring match on its relative path. Mirrors the existing CLAUDE.md ↔ INDEX.md check; closes the orphan risk where a sub-skill that jumps from `brand.json` straight to a specific `INDEX.md` would otherwise skip the rules layer. The INDEX.md → RULES.md edge is enforced incidentally by the existing Direction B file→cite walk.
- **Gate 7 brand-prose glob expansion**. The cross-references walker now scans every `.md` under `skills/design-shared/brands/*/**/*.md` (brand-root `CLAUDE.md`, per-library `INDEX.md`, per-library `RULES.md`, brandbook `CLAUDE.md`) in addition to `skills/*/SKILL.md` and `skills/*/references/*.md`. Resolved-link count rises from ~69 to 84. Bare-backtick references inside brand prose are NOT scanned – only `[text](path)` markdown links – which is what allows RULES.md to cite brandbook screenshots informationally without coupling brand prose to the brandbook subfolder layout.
- `scripts/_lib/brandbook-hex-inventory.json` – Gate 13's data plane. Keyed by brand id; each brand entry names its tokens file, source PDF, and page-grouped hex arrays. Update in lockstep with `tokens.tokens.json` when a brandbook revision changes the palette; the verifier picks it up automatically.

### Changed
- `skills/design-shared/brands/ACTIVE_BRAND` flipped from `erfana` to `qodeca`.
- `scripts/gate-12-brand-manifests.sh` `PRODUCTION_BRANDS` allowlist now `['qodeca']` (previously `['erfana']`).
- `scripts/run-all-gates.sh` Gate 9 watermark allowlist tightened to a single literal: `Created with Qodeca`. The `Created with Erfana` allowlist entry was removed.
- The single `Created with Erfana` watermark literal in `demos/hero-animation-v10.html` (line 763) and all other `voice.watermark` source-of-truth references now read `Created with Qodeca`.
- `CLAUDE.md` repo-layout table, `docs/architecture.md` brand-system section, and `docs/verification-gates.md` Gate 12 description all updated to reflect the post-removal state (qodeca active, two brand bundles ship, no erfana entry).
- `skills/design-shared/brands/qodeca/CLAUDE.md` v1.1 – added Identity, Logo basics, and Iconography sections lifted from brandbook pages 4 / 9 / 18; switched typography prose to Plus Jakarta Sans; cross-linked the new per-library `RULES.md` deep-dives in the Asset libraries table.
- `skills/using-erfana/SKILL.md` – bootstrap read order now enumerates `<library>/RULES.md` in both the per-file priority list and the read-order line so the discovery chain is unbroken regardless of entry path.
- Em-to-en dash sweep on root docs (`README.md`, `MAINTAINER.md`, `ROADMAP.md`, `BACKLOG.md`, `SECURITY.md`) – em-dashes (`—`) replaced with en-dashes (`–`) per the global style rule. Also fixed a dead `erfana-dark` reference in `BACKLOG.md`.
- `docs/architecture.md` and `docs/verification-gates.md` – brand-system sections and Gate 7 / 12 / 13 documentation rewritten to reflect schema v1.3, per-brand `CLAUDE.md` and per-library `INDEX.md` / `RULES.md` conventions, and the brandbook subfolder being out of scope for INDEX.md cross-checks.
- `skills/design-shared/brands/README.md` – Layout block, "Per-library `RULES.md`" section, and Validation summary added; brandbook subfolder documented as optional, self-described, and intentionally outside the bootstrap read order.

## [2.3.1] - 2026-04-29

Hardening + correctness patch for the v2.3.0 brand-system layer. Closes 15 findings raised by an independent four-reviewer audit (architecture, security, code-review, design-system / DTCG spec). Strictly additive — every change is a fix, hardening, or non-breaking schema extension. Existing v2.3.0 manifests are forward-compatible and revalidate cleanly under the new schema.

### Fixed
- `skills/design-shared/brands/README.md` "Active brand" section rewritten. The previous text falsely claimed `render-video.js` honors a `BRAND=<id>` env var. The script never read it. Replaced with the real mechanism: a single-line `ACTIVE_BRAND` pointer file consumed by Claude at HTML-generation time. Runtime resolver is explicitly deferred to v2.4 (review finding A — three reviewers).
- `skills/design-motion/SKILL.md` Process step 7 (watermark) rewritten to make generation-time-vs-runtime resolution explicit. The instruction now says "copy the resolved literal into the HTML text content at generation time" and "do NOT modify `render-video.js`" (review finding S1).
- `skills/using-erfana/SKILL.md` red-flag-table row "Questions are tasks. Invoke `erfana:design`" pointed at the deprecated meta-skill (`disable-model-invocation: true`). Routed at `erfana:design-direction` for vague briefs, otherwise the deliverable-specific sub-skill (review finding J).
- `scripts/run-all-gates.sh` now sets `set -euo pipefail`. The `claude plugin validate ... | tail -3` pipeline previously could swallow validation failures; replaced with an exit-code-preserving form that fails the runner if `Validation passed` is absent (review finding I, latent in earlier versions).
- `scripts/gate-12-brand-manifests.sh` adds a path-traversal guard via `realpath` + `commonpath`. Manifests with absolute paths or `../` escapes that resolve outside the repo are rejected without ever printing the resolved host-filesystem path — closes the CWE-22 information-disclosure flavor (review finding E / Security M1).
- `scripts/gate-12-brand-manifests.sh` `walk_value_for_aliases` now recurses into composite `$value`s (numbers, dicts, arrays). Aliases inside DTCG composite shapes (gradient stops, typography composites, shadow color slots) are now validated; in v2.3.0 they were silently accepted (review finding G / Code-review M3).
- `skills/design-shared/brands/qodeca/tokens.tokens.json` and `example-acme/tokens.tokens.json` wrapped under top-level brand-id groups. Root-level `$description` was likely DTCG-non-conformant; moving it under a group eliminates the ambiguity and makes future cross-brand merges in tooling like Style Dictionary cleaner (review finding H / Solution-reviewer #1).
- `skills/design-shared/brands/example-acme/tokens.tokens.json` now declares `typography.fontFamily.{primary,display,mono}` matching qodeca's shape. Closes the LSP asymmetry where `example-acme` had no typography block while `erfana` did — Gate 12's new `tokensContract` enforcement requires it (review finding B / Solution-reviewer #2).
- `imagery.illustrationStyle` in both manifests now points at `./illustration.md` instead of `./voice.md`. Voice and illustration are separate concerns; the v2.3.0 schema enshrining the SRP smell is gone (review finding N / Architecture #5).

### Added
- `skills/design-shared/brands/ACTIVE_BRAND` — single-line text file naming the active brand id (defaults to `erfana`). Sub-skills read it at HTML-generation time. Becomes the convention-over-configuration declaration of the active brand without needing a runtime resolver in `render-video.js`.
- `skills/design-shared/brands/brand.schema.json` v1.1 — `tokensContract` field (optional; default applies when omitted) maps dotted token paths to expected DTCG `$type`s. Encodes the LSP contract every brand must satisfy (default: `color.brand.{primary,accent,surface-dark,text-light}` of `$type: color` plus `typography.fontFamily.{primary,display,mono}` of `$type: fontFamily`). Closes review finding B (Architecture #2).
- `brand.schema.json` v1.1 — `voice.watermark` accepts both bare-string form and an object form `{ text, position?, color?, font? }` (forward-compatible; consumers ship in v2.4). Closes review finding M (Solution-reviewer #4).
- `brand.schema.json` v1.1 — `logos[].usage` and `voice.attributes` items now use `anyOf: [enum, string]` so canonical values (e.g. `light-bg`, `confident`) get IDE autocomplete while arbitrary strings still validate (review finding L / Solution-reviewer #3).
- `scripts/_lib/json_schema_lite.py` — minimal stdlib JSON Schema 2020-12 validator (~125 lines). Covers the subset used by `brand.schema.json`: `type`, `required`, `properties`, `additionalProperties` (bool|schema), `items`, `pattern`, `minLength` / `maxLength`, `enum`, `const`, `oneOf`, `anyOf`, `minimum`, `maximum`. No `jsonschema` pip dependency. Eliminates the schema-vs-Gate-12 drift hazard (review finding D / Architecture #3).
- `scripts/gate-12-brand-manifests.sh` — `PRODUCTION_BRANDS` allowlist (currently `["erfana"]`). `ACTIVE_BRAND` must name a brand on this list. The `example-acme` placeholder cannot accidentally become the active brand. Adding a real second brand is a one-line append (review finding O / Security M3).
- `scripts/run-all-gates.sh` Gate 5 — brand SVG content checks. Every SVG under `skills/design-shared/brands/**/*.svg` is scanned for `<script>`, `<foreignObject>`, external / data: / javascript: hrefs, and event-handler attributes (`onload`, `onclick`, etc.). XSS / supply-chain hardening for browser-rendered SVGs (review finding F / Security M2).
- `scripts/run-all-gates.sh` Gate 5 — placeholder warning. SVGs containing the literal `PLACEHOLDER` surface as `WARN`, not `FAIL`. Visible CI nag for the maintainer to swap real artwork (review finding K / Solution-reviewer #5).
- `skills/design-shared/brands/qodeca/illustration.md` and `example-acme/illustration.md` — new files holding illustration-style content split out of `voice.md`. Closes the SRP smell (review finding N).
- `brand.schema.json` v1.1 — `voice` documents canonical optional fields (`attributes`, `doNotUse`, `watermark`, `guide`) and stays strict (`additionalProperties: false`) so typos like `voice.watermak` fail validation. Forward compatibility is via schema versioning — adding a new optional field bumps schema v1.1 → v1.2 with no breaking impact on existing brands. The earlier "permissive additionalProperties" approach was rejected during V2 testing because it disabled typo-detection on the most-typo-prone field in the manifest (review finding C / Code-review m1, addressed via versioning rather than permissive defaults).
- `brand.schema.json` v1.1 — `platforms` enum opened to a pattern (`^[a-z][a-z0-9-]*$`) so brands needing `tv`, `watch`, `embed` can declare them without editing the shared schema. Canonical values listed in description as conventions, not constraints (review finding C / Architecture #4).

### Changed
- `scripts/gate-12-brand-manifests.sh` rebuilt around `json_schema_lite`. Shape validation delegated to the schema; cross-file invariants (id == folder, path traversal, alias resolution, tokensContract enforcement, ACTIVE_BRAND pointer, production allowlist) remain in code. ~70% of duplicated validation logic between schema and gate is gone.
- `example-acme/logo/example-acme-primary.svg` replaced with a loud-failing placeholder — a bright red rectangle with literal `PLACEHOLDER` text. Renders fail visibly the moment a maintainer forgets to swap real artwork. Real artwork is a separate design task (review finding K).
- `skills/design-shared/brands/qodeca/voice.md` — illustration section removed (now in `illustration.md`); the voice file links to it.
- `skills/design-shared/brands/example-acme/voice.md` — same split.
- `docs/verification-gates.md` — Gate 5 section rewritten to document SVG content checks. Gate 12 section rewritten to describe the schema-driven flow, path-traversal guard, composite-`$value` recursion, `tokensContract` enforcement, and `ACTIVE_BRAND` allowlist.
- `CLAUDE.md` — brand-identity hard-constraint extended with `tokensContract` and `ACTIVE_BRAND` mentions. New SVG-safety hard constraint added. Repo-layout table gains `ACTIVE_BRAND` and `_lib/json_schema_lite.py` rows. Current-version pointer bumped to v2.3.1.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` — version bumped to 2.3.1.

### Deferred (intentionally out of scope, tracked for v2.4+)
- Runtime `BRAND=<id>` env-var resolver in `render-video.js`. The v2.3.0 README falsely advertised this; v2.3.1 removes the false claim and ships the static `ACTIVE_BRAND` pointer instead. The real resolver lands when a second production brand exists.
- `voice.watermark` object-form consumer code. The schema accepts the object form in v2.3.1; render-time consumers ship in v2.4 alongside the runtime resolver.
- Component-tier tokens (`button.color.background` etc.). Deferred from v2.3.0; same reasoning.
- Real logo artwork. Slots exist with loud-failing placeholders; replacement is a separate design task.
- Style Dictionary export pipeline (CSS / iOS / Android / Figma). Opt-in v2.5 work.

### Why this lands as 2.3.1, not 2.4.0
Every change is a fix or non-breaking schema extension. The schema's new `anyOf` / `oneOf` extensions for `voice.watermark`, `logos[].usage`, `voice.attributes` are non-breaking — existing string values continue to validate. The `tokensContract` field is optional with a sensible default. The `platforms` enum opens (broader, not narrower). No SKILL.md trigger phrases change. CI gates become stricter, but only catch real bugs that should have failed v2.3.0 too. Existing brand manifests authored against v2.3.0 schema remain valid against v2.3.1 schema.

## [2.3.0] - 2026-04-29

Multi-brand brand-system layer. Brand identity (colors, typography, voice / tone, watermark, logo files) is now sourced from versioned, validated manifest files under `skills/design-shared/brands/<id>/`, following the W3C Design Tokens Format Module 2025.10 plus a custom `brand.schema.json` for non-token brand data. Adding a new brand is a folder-copy operation; no skill code needs to change. SOLID-aligned: SRP (one brand per manifest), OCP (filesystem extension point), DIP (skills depend on the manifest contract instead of hardcoded Qodeca strings).

### Added
- `skills/design-shared/brands/brand.schema.json` — JSON Schema 2020-12 contract for brand manifests. Required: `id`, `displayName`, `legalName`, `version`, `voice.watermark`. Optional: `tokens` (DTCG file path), `logos[]`, `typography`, `voice.attributes` / `voice.doNotUse` / `voice.guide`, `imagery`, `platforms`.
- `skills/design-shared/brands/qodeca/` — canonical default brand. `brand.json` manifest, `tokens.tokens.json` (DTCG 2025.10 — primitive colors `violet`/`lime`/`black`/`white` plus brand-role aliases via `{qodeca.color.violet}` syntax, font-family roles), `voice.md` (long-form voice / tone), logo SVG variants (`primary` / `inverse` / `wordmark`), `photos/` slot.
- `skills/design-shared/brands/example-acme/` — placeholder example brand demonstrating the schema for future maintainers. Uses a different watermark verb (`Made by ACME Corp`) to show that brand swap really does change the output without colliding with Gate 9's `Created (by|with)` filter.
- `skills/design-shared/brands/README.md` — folder convention, "adding a new brand" walkthrough, validation summary.
- `scripts/gate-12-brand-manifests.sh` — Gate 12. Validates every `brand.json` against the schema (stdlib Python, no `jsonschema` dependency): JSON parse, required fields, `id == folder` invariant, semver shape on `version`, lowercase-ASCII pattern on `id`, path resolution for every relative reference, DTCG token shape (every leaf has `$value`, every `{alias.path}` resolves).
- `docs/verification-gates.md` — Gate 12 section.

### Changed
- `skills/using-erfana/SKILL.md` — "Brand context" section rewritten. The inline color list and hardcoded watermark literal are replaced with pointers to `brands/qodeca/brand.json` + `tokens.tokens.json` + `voice.md`. Documents how Claude reads the manifest as priority #4 in the `design-context.md` hierarchy and how to add additional brands (folder drop).
- `skills/design-motion/SKILL.md` — opening line and Process step 7 (watermark) updated. Watermark text is now sourced from `voice.watermark` in the active brand manifest instead of a hardcoded literal. References section adds `../design-shared/brands/README.md`.
- `scripts/run-all-gates.sh` — Gate 3 (JSON parse) extended to include `brand.schema.json`. Gate 12 invocation inserted after Gate 11 and before `claude plugin validate`.
- `docs/verification-gates.md` — header updated from "Eleven static checks" to "Twelve static checks."
- `CLAUDE.md` — Hard-constraints bullet list updated. Watermark literal rule now references the manifest. New bullet added stating that brand identity must be sourced from `brands/<id>/brand.json`. Repo-layout table adds `brands/` row and the new gate-12 script row. Current-version pointer bumped to v2.3.0.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` — version bumped to 2.3.0.

### Why this lands as 2.3.0 instead of 2.2.2
Net-new capability: multi-brand extensibility. Existing skills continue to work unchanged because the migrated `using-erfana` and `design-motion` SKILL.md instructions still resolve to `Created with Qodeca` for the default `erfana` brand. The schema and Gate 12 are additive. No downstream consumer needs to change anything to upgrade.

## [2.2.1] - 2026-04-28

CI gate hardening. End-user behavior is unchanged.

### Changed
- `scripts/run-all-gates.sh` — Gates 7 (cross-references resolve) and 8 (trigger-phrase coverage) wired into the runner. Both were previously documented as diagnostic snippets that did not run in CI. The runner now enforces all 11 gates plus `claude plugin validate`.
- Gate 7 algorithm rewritten. The previous regex matched any backtick-wrapped path-shaped string anywhere in any file, producing 20 false positives against descriptive prose like `` the `assets/foo.jsx` Stage component ``. The new algorithm runs in two passes: (a) inside SKILL.md structural sections (`## References`, `## Scripts`, `## Examples`, `## Assets`, `## Demos`, plus the `## See also` / `## Related` variants), it extracts the FIRST backtick-wrapped token from each `- ` bullet (subsequent backticks describe the path); (b) across every SKILL.md and `references/*.md`, it walks unambiguous `[text](path)` markdown links. Glob patterns and external URLs are skipped. Code fences inside structural sections are skipped.
- `docs/verification-gates.md` — Gate 7 documentation rewritten to match the new algorithm; "Run all gates" closing paragraph updated; "What these gates do NOT cover" section updated to point at the new MAINTAINER.md pre-release smoke checklist.

### Fixed
- `skills/design-motion/references/hero-animation-case-study.md` — broken markdown link `[demos/hero-animation-v10.html](../demos/hero-animation-v10.html)` corrected to `[design-shared/demos/hero-animation-v10.html](../../design-shared/demos/hero-animation-v10.html)`. The new Gate 7 algorithm caught this (first wired-in run found it). The link had been broken since the v2.0 decomposition moved demos under `design-shared/`.
- `README.md` Troubleshooting — entry "Trigger phrases don't activate `erfana:design`" rewritten as "Trigger phrases don't activate the right sub-skill". The previous wording described an impossible symptom: post-v2.0, `erfana:design` is `disable-model-invocation: true` and cannot be activated by trigger phrases.
- `README.md` version-pin example — bumped from `v1.1.0` to `v2.1.0` with "(for example)" annotation. The previous example was two majors behind current and could mislead readers scanning version markers.

### Added
- `MAINTAINER.md` — "Pre-release smoke checklist" section after the routine release authority block. Three manual checks: Path A deck export, motion MP4 render, second-machine plugin install. Replaces the runtime-correctness gap previously left to "for maximally rigorous review before a major release" prose in `docs/verification-gates.md`.

## [2.2.0] - 2026-04-28

Substantial improvements to `erfana:design-slides`: new live-presentation transition pattern, expanded production guardrails, and safe-DOM hardening of the deck infrastructure so it runs cleanly under hook-strict environments.

### Added
- `skills/design-slides/references/transitions.md` — new reference covering the two-iframe ping-pong curtain-wipe pattern for live in-browser presentation. Includes stale-load guard, `try / finally` lock recovery, first-paint guard, and direction-aware traveling rule with hand-tuned `cubic-bezier(0.7, 0, 0.2, 1)` easing.
- `skills/design-slides/references/slide-decks.md` — pre-flight checklist (5 items run before any slide HTML is written), class-name collision warning, mandatory 3-zone flex layout (`zone-top` / `zone-mid` / `zone-bot`), small-type minimums (mono labels >=14px, footer page numbers >=15px, side-index/agenda items >=16px), and Path B parity warnings translating each Path A guardrail to `<deck-stage>` shells.
- `skills/design-shared/references/verification.md` — mid-animation snapshots via the Web Animations API (pause at chosen `currentTime` for frame-perfect captures, replacing unreliable `Bash sleep` + screenshot), and a strict slide-fit overflow check that walks every element rather than relying on `scrollHeight === 1080` (which silently lies under `body { overflow: hidden }`).

### Changed
- `skills/design-shared/assets/deck_index.html` — counter and print-stack writes refactored from `innerHTML` template-literal assignment to safe-DOM construction (`createElement` + `replaceChildren`). Drops the inner-HTML setter so PreToolUse XSS-prevention hooks don't reject the script. Added empty-MANIFEST guard so the counter renders `0 / 0` instead of `1 / 0`. No behavior change for non-empty decks.
- `skills/design-shared/assets/deck_stage.js` — shadow-root template rebuilt with the same safe-DOM approach; CSS now lives as `textContent` on a `<style>` element. Hook-friendly without altering rendering.
- `skills/design-slides/SKILL.md` — Process section restructured around the new pre-flight checklist, 2-showcase requirement (cover + densest content page), 3-zone layout, and tag-qualified shared selectors. References section gains pointers to `transitions.md` and the new verification subsections.
- `skills/design-shared/demos/c2-slides-pptx.html` — header comment clarifies this demo is an animated single-file motion showcase, not a canonical Path A template. Use it as an export-pipeline reference; build a fresh deck for layout examples.

### Why this lands as 2.2.0 instead of 2.1.2
The new transitions.md reference and 3-zone layout guidance are net-new capabilities surfaced through skill content, not pure documentation polish. Existing Path A decks built against 2.1.x continue to work unchanged — the safe-DOM refactor is internally observable only to security hooks.

## [2.1.1] - 2026-04-28

Documentation-only patch standardizing on the namespaced `/erfana:` invocation form.

### Documentation
- `README.md` — added "Invocation forms — bare vs. namespaced" subsection after the verify step, explaining that `/erfana:design-prototype` is the canonical form and `/design-prototype` is the Claude Code built-in fallback. Both register simultaneously; the bare form cannot be disabled today.
- `README.md` — added Troubleshooting entry covering the same dual-form behavior so employees who notice both paths in autocomplete have an authoritative answer.
- `README.md` — verify step bumped from "v1.0.x" to "v2.1.x" so the install confirmation matches current released version.
- `CLAUDE.md` — clarified the skill-namespacing rule. The `/erfana:` prefix is derived from `plugin.json` `"name": "erfana"`, not from each SKILL.md `name:` field. The SKILL.md `name:` is a display field per the [skills frontmatter spec](https://code.claude.com/docs/en/skills#frontmatter-reference); we keep the folder-name-equivalence mandate so the autocomplete listing stays consistent.

### Tracked upstream
- [anthropics/claude-code#43695](https://github.com/anthropics/claude-code/issues/43695) — open feature request for a `require-namespace: true` frontmatter field that would remove the bare `/skill` form. When implemented, this plugin will adopt it and drop the dual-form documentation.

### Why no functional changes
The `/erfana:` prefix already works today — Claude Code derives it automatically from `plugin.json` `name`. Both `/erfana:design-prototype` and `/design-prototype` resolve to the same skill. This release tightens the documentation surface so the namespaced form is the canonical one shown to employees, matching the convention used by `obra/superpowers`.

## [2.1.0] - 2026-04-28

Closes the four-reviewer audit of v2.0.0. All findings (critical + high + polish) addressed.

### Changed (skill content quality)
- All six sub-skill `description:` fields rewritten as pure trigger statements (Reviewer 2 critical: writing-skills meta-rule violation). Workflow language moved out of frontmatter.
- `skills/using-erfana/SKILL.md`: added `when_to_use:` field with explicit trigger phrases so Opus 4.7's skill calibration invokes the bootstrap on design-related conversation start.
- `skills/design/SKILL.md` (deprecated meta-skill): added `disable-model-invocation: true` so Claude does not auto-invoke the deprecated v1 meta-skill on vague prompts. Removed the legacy-trigger `when_to_use:` block. Users can still invoke `/erfana:design` explicitly.
- `skills/design-review/SKILL.md`: added `disable-model-invocation: true` so Claude does not volunteer reviews unsolicited; the skill is now user-invoked only.

### Changed (README onboarding)
- Opening paragraph rewritten to pass the 30-second pitch test (concrete deliverable types instead of "extends Qodeca's design system"). Added Quick-start callout pointing to Path B.
- New "Typical workflows" section showing direction → output → review chains for 4 common scenarios.
- Path A: added shell-config creation note (`touch ~/.zshrc`) and Windows / WSL2 fallback callout.
- Path B: added multi-account `gh` warning (Qodeca org access requirement).
- Path C: rewrote with `pass` + libsecret options and explicit WSL2 caveat.
- Verify step: explained the deprecated `erfana:design` meta-skill behavior (no auto-invocation; explicit invocation routes correctly).
- Troubleshooting: added corporate-firewall section, skill scope precedence note, local-development workflow.

### Added
- `MAINTAINER.md` — succession plan, bus-factor handoff procedure, onboarding instructions for a backup maintainer (Reviewer 3 high finding).
- `.github/dependabot.yml` — weekly Dependabot updates for the github-actions ecosystem.
- `marketplace.json` `metadata` block — `category: design`, tags, `supportUrl`, `docsUrl` for marketplace discoverability (Reviewer 1).
- `plugin.json` keywords expanded to include `claude-code-plugin`, `design-system`, `prototyping`, `motion-design`.

### Infrastructure (GitHub side)
- Enabled secret scanning + push protection on the repo (Reviewer 3 critical).
- Updated `main-protection` ruleset to add `required_signatures` (signed commits / tags) and `pull_request` rule with `require_code_owner_review: true`. Repo-admin bypass actor configured so the solo maintainer can still push for routine releases. (Reviewer 3 critical + high.)
- Backfilled GitHub Releases for v1.0.1, v1.1.0, v1.2.0, v2.0.0 (Reviewer 3 high). v1.0.0 deliberately skipped (broken historical tag).

### Maintainer setup
- Configured local git for SSH commit + tag signing using the existing release signing key registered on GitHub. This release is the first signed release.

## [2.0.0] - 2026-04-28

### Breaking change

The single 800-line `erfana:design` skill is decomposed into six purpose-built sub-skills, each ~150 lines, each with trigger-shaped frontmatter following the superpowers convention. The legacy `erfana:design` invocation still works as a deprecated meta-skill that routes to the appropriate sub-skill — this preserves v1.x compatibility but new invocations should target the specific sub-skill directly.

### Added
- `skills/design-prototype/SKILL.md` — hi-fi clickable UI prototypes (iOS, Android, web, desktop).
- `skills/design-slides/SKILL.md` — 1920×1080 HTML / PDF / editable PPTX presentation decks.
- `skills/design-motion/SKILL.md` — timeline animations exported as MP4 / GIF with optional BGM + SFX.
- `skills/design-direction/SKILL.md` — vague-brief style advisor; recommends 3 differentiated philosophies and produces 3 demos to compare.
- `skills/design-infographic/SKILL.md` — vertical print-grade data visualizations.
- `skills/design-review/SKILL.md` — 5-dimension critique scoring with Keep / Fix / Quick Wins.
- `skills/design-shared/` — shared bundle holding `assets/` (jsx, sfx, bgm, showcases), `demos/`, `scripts/`, and cross-cutting `references/` (workflow, content-guidelines, design-context, verification).
- `scripts/run-all-gates.sh` — single-command runner that executes every verification gate; the canonical pre-commit + CI verifier.
- `.github/workflows/verify.yml` — GitHub Actions CI workflow runs `scripts/run-all-gates.sh` on every push and PR. Catches regressions before merge.

### Changed
- `skills/using-erfana/SKILL.md` — Available skills table, decision flow, and process-first ordering rules updated for the 6 sub-skills + deprecated meta-skill.
- `skills/design/SKILL.md` — rewritten as a thin (~50-line) deprecation router pointing each intent at the right sub-skill. Will be removed in v3.0.
- 20 reference files distributed from `skills/design/references/` into the appropriate sub-skill: 9 motion-related → `design-motion/`, 2 slide-related → `design-slides/`, 2 prototype-related → `design-prototype/`, 2 direction-related → `design-direction/`, 1 review-related → `design-review/`, 4 cross-cutting → `design-shared/`.
- `assets/`, `demos/`, `scripts/`, `test-prompts.json` moved from `skills/design/` to `skills/design-shared/` so all sub-skills share one canonical asset bundle without duplication.
- `docs/verification-gates.md` — updated paths for new directory layout; Gate 2 now walks every `skills/*/SKILL.md` automatically; Gate 7 cross-reference resolver supports `../design-shared/...` paths from sub-skills.
- `README.md` — skill table expanded from 2 rows to 8 (6 sub-skills + deprecated `design` + `using-erfana` bootstrap).

### Migration

| v1 invocation | v2 invocation |
|---|---|
| `/erfana:design` (prototype intent) | `/erfana:design-prototype` |
| `/erfana:design` (deck intent) | `/erfana:design-slides` |
| `/erfana:design` (animation intent) | `/erfana:design-motion` |
| `/erfana:design` (direction intent) | `/erfana:design-direction` |
| `/erfana:design` (infographic intent) | `/erfana:design-infographic` |
| `/erfana:design` (review intent) | `/erfana:design-review` |

The `/erfana:design` invocation continues to work via the deprecated meta-skill until v3.0.

## [1.2.0] - 2026-04-28

### Added
- `.github/CODEOWNERS` — `@marcinobel` is sole code owner until a backup maintainer joins.
- `SECURITY.md` — vulnerability disclosure path (private email + Slack DM), scope, known limitations.
- `README.md` — version-pinning section explaining `/plugin install erfana@erfana-skills@vX.Y.Z` for stability-conscious users.
- `CLAUDE.md` — staged-rollout strategy section using `-rc.N` tags + 48-hour pilot soak.
- `CLAUDE.md` — signed-commits + signed-tags one-time setup instructions for new maintainers.
- GitHub repo topics: `erfana`, `qodeca`, `claude-code`, `claude-code-plugin`, `design-skill` for org discoverability.
- GitHub branch ruleset `main-protection`: blocks deletion + non-fast-forward pushes on `main`. Required-signatures rule will be added in a follow-up commit once the maintainer's SSH signing key is wired into local git config.

### Changed
- `README.md` install section rewritten with three paths: Path A (fine-grained PAT scoped to `Contents: Read-only` on `qodeca/erfana-skills` only + macOS Keychain), Path B (`gh auth token` shortcut), Path C (Linux `pass` / envchain). Plaintext-PAT-in-shell-config is deprecated.
- `LICENSE` tightened with explicit "current employees and contractors of Qodeca sp. z o.o. for internal business purposes" scope clause; sub-processor notice naming Anthropic; pointer to README Confidentiality policy.
- GitHub repo settings: `deleteBranchOnMerge: true`, squash-only merge strategy.

### Deferred
- `engines` field in `plugin.json` — Claude Code plugin schema does not yet define this field as of April 2026; revisit when CC 2.2+ ships.
- Mega-skill decomposition — `erfana:design` remains a single 800-line skill in v1.2; v2.0 splits it into six sub-skills.

## [1.1.0] - 2026-04-28

### Changed
- `skills/design/SKILL.md` frontmatter: removed "Output types:" line from `when_to_use:` (was workflow language, violated superpowers writing-skills convention). Output types moved into body as a "Deliverable types this skill produces" subsection.
- `skills/design/SKILL.md` body: added v1 scope note after the H1 explaining the planned v2.0 split into 6 sub-skills (`erfana:design-prototype`, `:slides`, `:motion`, `:direction`, `:infographic`, `:review`).
- `skills/design/SKILL.md` watermark section: added a clarifying preamble distinguishing the brand mark (`erfana · DESIGN`) from the promotion watermark (`Created with Qodeca`).
- `skills/using-erfana/SKILL.md`: H1 lowercased to `# Using erfana skills` for case consistency. Added a Decision flow code block after the red-flags table.
- `skills/design/demos/hero-animation-v10.html`: watermark text fixed from `Created by erfana` to canonical `Created with Qodeca`.
- `README.md`: added Confidentiality section (Anthropic sub-processor disclosure, do-not-paste list, conservative defaults). Added `gh auth status` precondition before Path A. Simplified verify trigger to "design a slide deck". Added 2 new troubleshooting symptoms (marketplace add fails, auto-updates stale). Added note about uninstallable `v1.0.0` tag.

## [1.0.3] - 2026-04-28

### Changed
- README onboarding: document `gh auth token` shortcut as a faster alternative to manual PAT generation, and capture the verified end-to-end update behavior (v1.0.1 → v1.0.2 propagated via `/plugin marketplace update` + `/plugin update`).

## [1.0.2] - 2026-04-28

### Changed
- Cosmetic version bump used to verify the auto-update mechanism end-to-end against the private GitHub marketplace. No functional changes.

## [1.0.1] - 2026-04-28

### Fixed
- `marketplace.json` plugin source path bumped from `.` to `./` to satisfy the CC plugin schema (source paths must start with `./`). v1.0.0 failed `claude plugin validate`; v1.0.1 is the first installable release.

## [1.0.0] - 2026-04-28

Initial release of the erfana plugin for Claude Code.

### Added
- `erfana:design` skill — design work for hi-fi prototypes, slide decks, motion graphics, infographics, and design critique. Bundled scenes, references, audio assets, and showcases enable production-grade output without external tooling.
- `using-erfana` bootstrap skill — entry point that lists skills and establishes invocation conventions.
- Single-plugin private GitHub marketplace at `qodeca/erfana-skills`. Auto-update at session start when `GITHUB_TOKEN` is set in the shell environment.
