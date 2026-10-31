# Verification gates

Thirteen static checks (all hard) that prove the zero-CJK invariant, plugin schema correctness, hook safety-net health, hook behavioural correctness via fixture replay, doc-claim sync against the filesystem, skill-registry sync against git history, reference sync against the plugin files, publication readiness (no proprietary / internal-only framing), and structural integrity hold across the skill layout. Gate numbers are historical and non-contiguous: gates 5, 6, 8, 9, 12 and 13 were retired in v7.0.0 with the design skills they guarded, and the surviving gates keep their original numbers so older commits, CI logs and caveat entries stay readable.

**Canonical command (use this – runs every gate below):**

```bash
bash scripts/run-all-gates.sh
```

CI (`.github/workflows/verify.yml`) invokes the same runner on every push and pull request to `main` or `develop`, and adds the CI-only checks listed under [Run all gates](#run-all-gates). Branch protection on `main` (the `main-protection` ruleset) requires signed commits, code-owner review, and the passing `verify.yml` status checks (`gates`, `secret-scan`) before merge.

**Layout reference**:

- Skills: `skills/<name>/SKILL.md` (18 skills – 6 orchestration + 1 process + 1 verification + 3 prompting + 4 work session + 2 session closeout + 1 bootstrap).
- Shared agents: `agents/*.md` (38 shared agents at plugin root, scanned by Gate 2 + Gate 7 from v4.0.0).
- Per-skill nested agents: none. `article` (v4.3.0) and `report` (then `managing-reports`) hoisted theirs to plugin-root `article-*` and `report-*`.
- Hooks: `hooks/hooks.json` + 6 safety hooks, each a `.sh` (macOS/Linux) + `.ps1` (Windows) pair routed through the `dispatch.sh` launcher, which also enforces the shared timeout (cross-platform, v4.2.20+; plugin-root interview guards and cross-host wiring, v7.1.0+; validated by Gate 14, v4.1+).
- Interview guards: `grill-guard` (v6.2.0+) and `ms-grill-guard` (v6.4.0+), both Stop hooks validated by Gate 16 (fixtures + sentinel symmetry + guard-drift). Declared in SKILL.md `hooks:` frontmatter until v7.1.0, when they moved into `hooks/hooks.json` – Qwen Code does not extract that frontmatter, so a skill-scoped registration ran on one host only.
- Skill-specific references: **two spellings exist and only one is gated.** Every skill uses plural `skills/<name>/references/*.md`, and every gate glob in this repo is written against that plural form; a singular `reference/` folder would sit inside no gate's scan surface at all, so do not introduce one. No skill uses `phases/` or `operations/` any more. Gate 7 does not check links in any `skills/*/templates/` folder (including the nested ones under `skills/issue/templates/` and `skills/spec/templates/`) or in `skills/report/examples/`. Check this line before choosing a glob for a new or edited gate (see [`gates/02-frontmatter.md`](gates/02-frontmatter.md) and [`gates/07-cross-references.md`](gates/07-cross-references.md) `## Limitations`).

## Gate index

Each gate is documented in its own file under `docs/gates/`. The verbatim implementation is preserved per gate so anyone can run a single gate independently of the runner.

| # | Title | Type | Doc |
|---|---|---|---|
| 1 | Zero CJK across the repo | hard | [`gates/01-cjk.md`](gates/01-cjk.md) |
| 2 | YAML frontmatter + Opus 4.7 patterns (skills + agents; cross-host frontmatter rules v7.1.0+) | hard | [`gates/02-frontmatter.md`](gates/02-frontmatter.md) |
| 3 | JSON files parse | hard | [`gates/03-json.md`](gates/03-json.md) |
| 4 | Script syntax (Python) | hard | [`gates/04-script-syntax.md`](gates/04-script-syntax.md) |
| 7 | Cross-references resolve | hard | [`gates/07-cross-references.md`](gates/07-cross-references.md) |
| 10 | Git history is CJK-free | hard | [`gates/10-git-cjk.md`](gates/10-git-cjk.md) |
| 11 | Brand consistency (no leftover qodesign) | hard | [`gates/11-brand-consistency.md`](gates/11-brand-consistency.md) |
| 14 | Hooks valid (v4.1+; cross-platform sibling + launcher checks v4.2.20+; cross-host contract + launcher-bound check v7.1.0+) | hard | [`gates/14-hooks.md`](gates/14-hooks.md) |
| 15 | Doc-claim sync (v4.1.2+, extended v4.1.3+; nine checks today; v4.2.2 extended `docs_to_scan` to 6 files, Gate 18 added `docs/skill-registry.md`, and v7.1.0 added `docs/hosts.md` + `CONTRIBUTING.md` for 9) | hard | [`gates/15-doc-claims.md`](gates/15-doc-claims.md) |
| 16 | hook fixtures + sentinel symmetry: verify-completion + grill-guard + ms-grill-guard + secret-detector + bash-safety (v4.2.9+; OS-native replay via dispatch.sh v4.2.20+; grill family v6.2.0+; ms-grill family + guard-drift check v6.4.0; PreToolUse families + launcher checks v7.1.0) | hard | [`gates/16-hook-fixtures.md`](gates/16-hook-fixtures.md) |
| 17 | Publication readiness (GPL license; no proprietary / internal-only framing or internal contact email) (v6.0.0+) | hard | [`gates/17-publication-readiness.md`](gates/17-publication-readiness.md) |
| 18 | Skill registry sync (`docs/skill-registry.md` vs `ls skills/` + `git log`; shallow clone, list drift, duplicate rows and values git contradicts are hard, lagging dates warn; v6.6.1+) | hard | [`gates/18-skill-registry.md`](gates/18-skill-registry.md) |
| 19 | Reference sync (`docs/reference.md` regenerated from skills, agents, commands, and hooks; whole-file diff; v9.3.0+) | hard | [`gates/19-reference.md`](gates/19-reference.md) |

Runner order in `scripts/run-all-gates.sh`: 1, 2, 3, 4, 7, 10, 11, 14, 16, 15, 17, 18, 19 (hook-related gates 14 and 16 run consecutively).

### Cross-host checks (v7.1.0+)

erfana runs on a second host, Qwen Code. The rules that keep one package working on both were prose promises until v7.1.0; they are now enforced inside three existing gates rather than a gate of their own. Why each rule exists – and everything else host-specific – is in [`hosts.md`](hosts.md); the machine-readable half those gates read is `scripts/_lib/host_matrix.py`.

| Gate | Added check | Severity |
|---|---|---|
| 14 | No `timeout` key anywhere in `hooks.json` (the field is seconds on one host and milliseconds on the other, so no value is correct on both; the bound lives in `dispatch.sh`) | hard |
| 14 | A matcher naming a Claude-only tool must also name its Qwen counterpart, read from `CLAUDE_TO_QWEN_TOOL` (`MultiEdit` and `SlashCommand` are exempt – they have no counterpart) | hard |
| 14 | Matchers are plain `\|`-separated tool names, never regex – an unresolvable matcher falls through to a substring test on Qwen and silently widens there | hard |
| 14 | Every stderr line preceding an `exit 2` is a literal, because Qwen parses exit-2 stderr as JSON and an interpolated value could rewrite the decision | hard |
| 14 | `dispatch.sh` carries the timeout bound and kills a process group, not a leaf | hard |
| 2 | Agent `name` at most 50 characters, identifier-shaped, and not a Qwen reserved word – otherwise the converter drops the agent silently | hard |
| 2 | Skill `allowed-tools` / `argument-hint` is a string, not a YAML flow sequence – Qwen's agent-plugin skill parser throws on the sequence form and skips the entire skill (latent for erfana today; see [`docs/gates/02-frontmatter.md`](gates/02-frontmatter.md)) | hard |
| 2 | `skills/fact-checking/SKILL.md` keeps `disable-model-invocation: true` (a `CLAUDE.md` hard constraint that nothing enforced before) | hard |
| 15 | Qwen version agreement across `host_matrix.py`, the CI npm pin, and any version stated in scanned prose | hard |
| 15 | `docs/hosts.md` and `CONTRIBUTING.md` joined `docs_to_scan`, so their plugin-shape counts are CI-blocked too | hard |

No gate checks agent description length, not even as a warning: the Qwen bundle only warns over 1,000 characters and never rejects. Descriptions are kept short by convention instead (≤300 characters user-facing, ≤160 skill-internal, no `<example>` blocks), because Claude Code loads every agent description into every session.

## Run all gates

```bash
bash scripts/run-all-gates.sh
```

The runner executes all 13 gates in sequence and exits non-zero on the first failure. It then runs `claude plugin validate .` when the `claude` CLI is on `PATH`. Without the CLI it prints `SKIP: claude CLI not available in this environment` and still ends with a pass, so a local run without Claude Code has not validated the manifests.

CI runs the same script, but a local pass is not a CI pass. These checks run only in `verify.yml`:

- **Strict manifest validation** – `claude plugin validate . --strict`. The `gates` job installs the `claude` CLI only after the runner, so inside the runner the validate step is skipped there too.
- **Host table sync** – reruns `scripts/gen-hosts-table.sh` and fails if `docs/hosts.md` changes.
- **Licensing** – `reuse lint`.
- **README agent count** – `README.md` must state the current `<N> shared agents`.
- **Docs checks** – `scripts/check-docs.sh --offline` (local links, vale, markdownlint-cli2) blocks; web links are checked in a separate step that does not block.
- **Qwen Code smoke test** – `scripts/qwen-smoke.sh --require` in the `qwen-compat` job.
- **PowerShell hooks** – the `powershell` job on `windows-latest` replays the Gate 16 fixtures through the `.ps1` hooks.
- **Secret scan** – gitleaks and trufflehog over the full git history.

If any gate fails, the commit is not ready. Fix, re-run, then commit.

## Quick spot-checks

Standalone checks for iterating on one concern without running the full suite:

```bash
# YAML frontmatter + name on every skill
python3 -c "import yaml, glob; [print(p, '->', yaml.safe_load(open(p).read().split('---')[1]).get('name')) for p in sorted(glob.glob('skills/*/SKILL.md'))]"

# JSON parse both manifests
python3 -m json.tool .claude-plugin/plugin.json > /dev/null && python3 -m json.tool .claude-plugin/marketplace.json > /dev/null && echo 'manifests OK'

# Plugin schema validation
claude plugin validate .

# Brand consistency (Gate 11 spot-check)
grep -r -i 'qodesign' skills/ .claude-plugin/ README.md LICENSE CHANGELOG.md SECURITY.md .github/ 2>/dev/null | grep -v 'CHANGELOG.md' && echo 'FAIL: leftover qodesign' || echo 'PASS'

# Hook health (Gate 14 standalone – includes the cross-host contract checks)
bash scripts/gate-14-hooks.sh

# Hook behaviour on real payloads (Gate 16 standalone, replays through dispatch.sh)
bash scripts/gate-16-hook-fixtures.sh

# Install + conversion on the second host (NOT part of run-all-gates.sh – needs the qwen CLI;
# skips cleanly when qwen is absent, CI runs it with --require)
bash scripts/qwen-smoke.sh
```

## What these gates do NOT cover

- Skill-trigger behavior in a live Claude Code / Cursor / Codex session. Frontmatter shape is checked statically (Gate 2); runtime discovery is not.
- **Runtime behavior on Qwen Code.** The cross-host checks above prove the wiring, and `scripts/qwen-smoke.sh` proves the install and the conversion, but neither proves the executor: no erfana skill has been run end to end inside a Qwen session, and `model:` values reach that host verbatim, where a silent fallback to the default model is indistinguishable from resolution. The standing list is [`hosts.md`](hosts.md) `## What is not verified`; the accepted risks are in [`known-caveats.md`](known-caveats.md).
- Auto-update propagation. To verify a release reaches end-users, push a cosmetic version bump and run `claude plugin marketplace update erfana-skills && claude plugin update erfana@erfana-skills` on a second machine – also captured in the MAINTAINER.md checklist.
