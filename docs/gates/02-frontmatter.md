# Gate 2 – YAML frontmatter + Claude 5 model patterns (skills + agents)

Walks every `skills/*/SKILL.md` and validates `name`, `description`, description length, and (added v4.2.0+, refined v4.2.1, revised v6.3.0 for the Claude 5 family) model patterns: third-person voice (Anthropic-required per skill-creator/SKILL.md), combined description+when_to_use ≤1,536 chars (Anthropic-documented truncation limit per https://code.claude.com/docs/en/skills), the plugin-convention ≥3 quoted activation phrases heuristic, and reasoning-display instructions.

From v4.0.0 onward also walks `agents/*.md` (when the directory exists) and enforces the agent-name invariant: `name` field must equal the filename basename minus `.md`. From v4.2.0 onward also warns when `ms-*` agents lack the `effort` field (Section 13.1) and when any agent body declares deprecated APIs (Section 13.3/13.4). From v6.3.0 onward also warns when `ms-*` agents lack the `model` field (Section 13.2) and when instructional prose tells a model to surface its internal reasoning (Section 12.7 / 13.5 — trips the `reasoning_extraction` refusal classifier on Claude Fable 5 and Claude Opus 5; `stop_reason: "refusal"`, re-routing to Opus 4.8 where fallback is configured).

## Implementation

The implementation lives in two places — this doc intentionally carries **no verbatim code copy** (the previous copy drifted twice; a pointer cannot drift):

- `scripts/run-all-gates.sh` — the `=== Gate 2 ===` block (frontmatter checks, scan orchestration) and the `=== Gate 2 — reasoning-display detector fixtures ===` block (fixture replay).
- `scripts/_lib/gate2_detector.py` — the shared reasoning-display detector (`REASONING_DISPLAY`, `NEGATION_CONTEXT`, `ALLOW_RE`, fence tracking, `scan()`), imported by both blocks so the gate and its fixtures always run identical code.

### Scan surface (v6.3.0)

Frontmatter checks: `skills/*/SKILL.md` and `agents/*.md` (unchanged scope).

Reasoning-display sweep additionally covers part of the instructional-prose surface: `skills/*/agents/*.md`, `skills/*/references/*.md`, `skills/*/templates/*.md`, `skills/*/guides/*.md`, `skills/*/validation/*.md`, `skills/*/examples/*.md`, and `commands/*.md`. Full file text is scanned, so reported line numbers are absolute.

**What the sweep excludes.** The list is a fixed glob set, not a walk of every `.md` under `skills/`. Outside it: the **singular** `skills/<name>/reference/*.md` spelling used by `managing-issues` (23 files) and `managing-reports` (7 files); `skills/<name>/phases/*.md` and `operations/*.md`, which have no glob at all – in `managing-issues` that is the 13 phase files and 9 operation files the PR #24 Implement hardening rewrote; and any file nested one level deeper than a listed glob, e.g. `skills/managing-issues/templates/{create,implement}/*.md`. Instructional prose in those files is not scanned for reasoning-display phrasings. The full singular/plural map is in the layout reference at the top of [`../verification-gates.md`](../verification-gates.md).

### File-handling hygiene (v6.3.0)

Files are read with explicit `encoding='utf-8'` inside try/except (unreadable file → FAIL line, gate continues — matches Gate 1's convention); frontmatter that parses to a non-mapping → FAIL.

## Pass criteria

Every sub-skill and (when present) every agent prints with its name; the fixture block prints its PASS line; no FAIL lines.

**WARN-only checks** (do not block CI; Section 12 stays soft-blocking except 12.7's checklist-level BLOCKING status — the gate emits WARN to allow incremental fix-up):

- Description >500 chars (legacy soft warn from v4.0+)
- Skill description uses first-person voice (`I can help`, `You can use`, `I'll help`) — rewrite to third-person (Section 12.1)
- Combined `description` + `when_to_use` >1,536 chars (Anthropic-documented truncation limit)
- `when_to_use` block has fewer than 3 quoted activation phrases (recommended ≥3, Section 12.2)
- Skill, agent, command, or reference prose instructs reasoning display — Section 12.7 / 13.5 (v6.3.0)
- Stale `gate2-allow` suppression comment covering no match (v6.3.0)
- ms-* agent missing `effort` (Section 13.1) or `model` (Section 13.2) — both should be declared per the Model Selection Guide in `skills/managing-skills/templates/shared-agent-template.md`
- Agent body contains a deprecated API reference at YAML-key syntax: `temperature:`, `top_p:`, `top_k:` (400 on Claude Opus 4.7 and later), `budget_tokens:` (unsupported on Claude 5 models; Haiku 4.5 exempt) — Section 13.3/13.4, hard-blocking semantically; gate emits WARN to allow incremental fix-up

**Hard FAILs** (block CI):

- Missing `name` or `description` frontmatter field; frontmatter absent or not a YAML mapping; unreadable file
- Agent `name` does not match filename basename minus `.md`
- **Any detector-fixture mismatch** — a false positive on `tests/gate-02-fixtures/valid/*.md`, a missed detection from `tests/gate-02-fixtures/invalid/expected.txt`, or an unexpected extra detection. The fixture contract is hard even while the production rule stays WARN.

## Detector design (guards against false positives and false negatives)

Per-line escapes, applied in order (see `gate2_detector.py` docstring):

1. **Fenced code blocks** (``` / ~~~) are skipped — sample content, not authored instruction.
2. **Backtick spans stripped** before matching; an odd backtick count treats the whole line as prose (fails open toward detection). Even-segment joining uses a space separator so text cannot be glued across a removed span.
3. **Negation context** evaluated on the stripped text: `\b`-anchored rule-definition markers (`MUST NOT`, `never`, `reject`, `Grep`, …) suppress the line. Anchoring prevents substring suppression ("never" no longer hides inside "whenever", "drop" inside "dropdown").
4. **Explicit suppression**: `<!-- gate2-allow: reasoning-display -- <reason> -->` on the same or preceding line. Allow-comments that cover no match are reported stale (Ruff `noqa`/RUF100 model: suppress narrowly, detect stale suppressions).

The phrase regex requires a self-referential determiner (`your`/`its`/`internal`) after a display-verb, so output-evidence prose ("Explain the reasoning behind each severity rating", "state the design rationale") does not match; author-filled `<critical_thinking>` blocks pass because their content does not use the imperative shape. The `DEPRECATED_API` regex matches YAML-key syntax at line start only, so backticked detection regexes (e.g. in `agents/ms-reviewer.md`) do not match.

## Fixtures

`tests/gate-02-fixtures/valid/*.md` — the false-positive regression suite (rule definitions, backticked mentions, fenced code, `<critical_thinking>` content, allow-comments, output-evidence prose): must produce zero findings. `tests/gate-02-fixtures/invalid/*.md` + `expected.txt` — every accepted violation phrasing plus escape-abuse lookalikes: detections must equal the manifest exactly. Regenerate `expected.txt` only after deliberately reviewing detector changes.

## Reference

- `skills/managing-skills/validation/pre-release-checklist.md` — Section 12 (Claude 5 model patterns) full definitions and weight system
- `skills/managing-skills/validation/agent-pre-release-checklist.md` — Section 13 (per-agent Claude 5 frontmatter requirements)
- `skills/managing-skills/templates/shared-agent-template.md` — Model Selection Guide (orchestrator → opus high, validator → sonnet low, etc.)
- `skills/managing-skills/guides/claude-5-patterns.md` — current pattern reference for what this gate detects

## Cross-host frontmatter rules (v7.1.0)

These are `FAIL`, not warnings, because each one makes a skill or an agent silently absent on Qwen Code – a missing capability, not a style nit.

| Rule | Failure mode on Qwen |
|---|---|
| Agent `name` at most 50 characters | The converter drops the agent with no error. |
| Agent `name` identifier-shaped (`[A-Za-z0-9_-]+`) | Same. |
| Agent `name` not a reserved word (`self`, `system`, `user`, `model`, `tool`, `config`, `default`, `main`) | Same. Read from `QWEN_RESERVED_AGENT_NAMES` in `scripts/_lib/host_matrix.py`. |
| Skill `allowed-tools` / `argument-hint` is a string, not a YAML flow sequence | Qwen's agent-plugin skill parser throws `"Agent Skills allowed-tools must be a string."` and the caller skips the **entire skill**. That parser is reached only for a manifest declaring format `agent-plugins-v1`; erfana installs as format `qwen`, so the flow shape is latent on **both** hosts today - one upstream change from silently deleting a skill. `argument-hint` is weaker still: Qwen ignores a non-string rather than throwing. Both stay `FAIL` because a string costs nothing. |
| `skills/fact-checking/SKILL.md` keeps `disable-model-invocation: true` | Not a host rule – a `CLAUDE.md` hard constraint that had no enforcement. Fact-check runs are user-requested only. |

Agent description length stays a **warning**: Qwen's `SubagentValidator` only *warns* over 1,000 characters ("consider shortening for better readability") and never rejects; the one hard cap is 1,024 characters for *skill* descriptions. The long agent descriptions are long because they carry `<example>` blocks, which are what drive agent selection on Claude Code.
