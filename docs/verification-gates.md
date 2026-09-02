# Verification gates

Twelve static checks (all hard) that prove the zero-CJK invariant, plugin schema correctness, hook safety-net health, hook behavioural correctness via fixture replay, doc-claim sync against the filesystem, skill-registry sync against git history, publication readiness (no proprietary / internal-only framing), and structural integrity hold across the skill layout. Gate numbers are historical and non-contiguous: gates 5, 6, 8, 9, 12 and 13 were retired in v7.0.0 with the design skills they guarded, and the surviving gates keep their original numbers so older commits, CI logs and caveat entries stay readable.

**Canonical command (use this – runs every gate below):**

```bash
bash scripts/run-all-gates.sh
```

CI (`.github/workflows/verify.yml`) invokes the same runner on every push and PR. Branch protection on `main` (the `main-protection` ruleset) requires signed commits, code-owner review, and the passing `verify.yml` status checks (`gates`, `secret-scan`) before merge.

**Layout reference**:

- Skills: `skills/<name>/SKILL.md` (9 skills – 6 orchestration + 1 process + 1 verification + 1 bootstrap).
- Shared agents: `agents/*.md` (87 shared agents at plugin root, scanned by Gate 2 + Gate 7 from v4.0.0).
- Per-skill nested agents: `skills/<name>/agents/*.md` (orchestration skills only – `managing-reports/` 11, others 0; `managing-articles` hoisted its agents to plugin-root `article-*` in v4.3.0).
- Hooks: `hooks/hooks.json` + 6 safety hooks, each a `.sh` (macOS/Linux) + `.ps1` (Windows) pair routed through the `dispatch.sh` launcher, which also enforces the shared timeout (cross-platform, v4.2.20+; plugin-root interview guards and cross-host wiring, v7.1.0+; validated by Gate 14, v4.1+).
- Interview guards: `grill-guard` (v6.2.0+) and `ms-grill-guard` (v6.4.0+), both Stop hooks validated by Gate 16 (fixtures + sentinel symmetry + guard-drift). Declared in SKILL.md `hooks:` frontmatter until v7.1.0, when they moved into `hooks/hooks.json` – Qwen Code does not extract that frontmatter, so a skill-scoped registration ran on one host only.
- Skill-specific references: **two spellings exist and only one is gated.** Most skills use plural `skills/<name>/references/*.md`; `managing-issues` (22 files) and `managing-reports` (7 files) use **singular** `skills/<name>/reference/*.md`. Every gate glob in this repo is written against the **plural** form, so the singular directories sit inside no gate's scan surface at all. `managing-issues` additionally owns `phases/` (13), `operations/` (9), `examples/` (5), `validation/` (2) and `templates/` (8 files, all one level deeper under `templates/create/` and `templates/implement/`): of those, only `examples/*.md` and `validation/*.md` are reached by any gate – Gate 2's prose sweep – and `phases/`, `operations/` and the nested `templates/` subfolders are reached by none. Check this line before choosing a glob for a new or edited gate; the mismatch is why Gate 2's reasoning-display sweep and Gate 7's link check silently skip much of the largest skill in the plugin (see [`gates/02-frontmatter.md`](gates/02-frontmatter.md) and [`gates/07-cross-references.md`](gates/07-cross-references.md) `## Limitations`).

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
| 15 | Doc-claim sync (v4.1.2+, extended v4.1.3+; eight checks today; v4.2.2 extended `docs_to_scan` to 6 files, Gate 18 added `docs/skill-registry.md`, and v7.1.0 added `docs/hosts.md` + `CONTRIBUTING.md` for 9) | hard | [`gates/15-doc-claims.md`](gates/15-doc-claims.md) |
| 16 | hook fixtures + sentinel symmetry: verify-completion + grill-guard + ms-grill-guard (v4.2.9+; OS-native replay via dispatch.sh v4.2.20+; grill family v6.2.0+; ms-grill family + guard-drift check v6.4.0) | hard | [`gates/16-hook-fixtures.md`](gates/16-hook-fixtures.md) |
| 17 | Publication readiness (GPL license; no proprietary / internal-only framing or internal contact email) (v6.0.0+) | hard | [`gates/17-publication-readiness.md`](gates/17-publication-readiness.md) |
| 18 | Skill registry sync (`docs/skill-registry.md` vs `ls skills/` + `git log`; shallow clone, list drift, duplicate rows and values git contradicts are hard, lagging dates warn; v6.6.1+) | hard | [`gates/18-skill-registry.md`](gates/18-skill-registry.md) |

Runner order in `scripts/run-all-gates.sh`: 1, 2, 3, 4, 7, 10, 11, 14, 16, 15, 17, 18 (hook-related gates 14 and 16 run consecutively).

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
| 2 | Skill `allowed-tools` / `argument-hint` is a string, not a YAML flow sequence – Qwen's strict validator throws on the sequence form and skips the entire skill | hard |
| 2 | `skills/fact-checking/SKILL.md` keeps `disable-model-invocation: true` (a `CLAUDE.md` hard constraint that nothing enforced before) | hard |
| 15 | Qwen version agreement across `host_matrix.py`, the CI npm pin, and any version stated in scanned prose | hard |
| 15 | `docs/hosts.md` and `CONTRIBUTING.md` joined `docs_to_scan`, so their plugin-shape counts are CI-blocked too | hard |

Agent description length stays a **warning** on Gate 2: no agent-description limit exists in the Qwen bundle, and the long descriptions carry the `<example>` blocks that drive agent selection on Claude Code.

## Run all gates

```bash
bash scripts/run-all-gates.sh
```

The runner executes all 12 gates plus `claude plugin validate` in sequence and exits non-zero on the first failure. It is the same script CI runs on every push and PR – keeping local and CI in sync.

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
