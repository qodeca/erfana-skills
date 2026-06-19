# Verification gates

Seventeen static checks (16 hard + 1 soft) that prove the zero-CJK invariant, plugin schema correctness, brand-manifest integrity, brandbook value fidelity, hook safety-net health, hook behavioural correctness via fixture replay, doc-claim sync against the filesystem, publication readiness (no proprietary / internal-only framing), and structural integrity hold across the v4.0+ skill layout. Gate 13 (brandbook hex coverage) is currently soft – it does not fail CI – pending the stabilisation period defined in `ROADMAP.md` v2.3.2 item #3b.

**Canonical command (use this – runs every gate below):**

```bash
bash scripts/run-all-gates.sh
```

CI (`.github/workflows/verify.yml`) invokes the same runner on every push and PR. Branch protection on `main` (the `main-protection` ruleset) requires signed commits, code-owner review, and the passing `verify.yml` status checks (`gates`, `secret-scan`) before merge.

**Layout reference (v4.0+)**:

- Skills: `skills/<name>/SKILL.md` (15 skills – 6 design + 6 orchestration + 1 process + 1 verification + 1 bootstrap).
- Shared agents: `agents/*.md` (87 shared agents at plugin root, scanned by Gate 2 + Gate 7 from v4.0.0).
- Per-skill nested agents: `skills/<name>/agents/*.md` (orchestration skills only – `managing-reports/` 11, others 0; `managing-articles` hoisted its agents to plugin-root `article-*` in v4.3.0).
- Shared bundle: `skills/design-shared/` holds `assets/` (jsx, sfx, bgm, showcases), `demos/`, `scripts/`, cross-cutting `references/`, `test-prompts.json`. Design-only; orchestration skills do NOT consume it.
- Brand bundles: `skills/design-shared/brands/<id>/` (manifest + DTCG tokens + per-library `INDEX.md` / `RULES.md`; validated by Gate 12).
- Hooks: `hooks/hooks.json` + 4 safety hooks, each a `.sh` (macOS/Linux) + `.ps1` (Windows) pair routed through the `dispatch.sh` launcher (cross-platform, v4.2.20+; validated by Gate 14, v4.1+).
- Skill-specific references: `skills/<name>/references/*.md` (only for sub-skills that own dedicated references).

## Gate index

Each gate is documented in its own file under `docs/gates/`. The verbatim implementation is preserved per gate so anyone can run a single gate independently of the runner.

| # | Title | Type | Doc |
|---|---|---|---|
| 1 | Zero CJK across the repo | hard | [`gates/01-cjk.md`](gates/01-cjk.md) |
| 2 | YAML frontmatter + Opus 4.7 patterns (skills + agents) | hard | [`gates/02-frontmatter.md`](gates/02-frontmatter.md) |
| 3 | JSON files parse | hard | [`gates/03-json.md`](gates/03-json.md) |
| 4 | Script syntax (Python + Node) | hard | [`gates/04-script-syntax.md`](gates/04-script-syntax.md) |
| 5 | SVG / HTML well-formedness + SVG content safety | hard | [`gates/05-svg-html.md`](gates/05-svg-html.md) |
| 6 | JSX brace / paren / bracket balance | hard | [`gates/06-jsx.md`](gates/06-jsx.md) |
| 7 | Cross-references resolve | hard | [`gates/07-cross-references.md`](gates/07-cross-references.md) |
| 8 | Trigger phrase coverage (across all sub-skills) | hard | [`gates/08-trigger-phrases.md`](gates/08-trigger-phrases.md) |
| 9 | Watermark consistency | hard | [`gates/09-watermark.md`](gates/09-watermark.md) |
| 10 | Git history is CJK-free | hard | [`gates/10-git-cjk.md`](gates/10-git-cjk.md) |
| 11 | Brand consistency (no leftover qodesign) | hard | [`gates/11-brand-consistency.md`](gates/11-brand-consistency.md) |
| 12 | Brand manifests valid (schema-driven) | hard | [`gates/12-brand-manifests.md`](gates/12-brand-manifests.md) |
| 13 | Brandbook hex coverage | **soft** | [`gates/13-brandbook-hex.md`](gates/13-brandbook-hex.md) |
| 14 | Hooks valid (v4.1+; cross-platform sibling + launcher checks v4.2.20+) | hard | [`gates/14-hooks.md`](gates/14-hooks.md) |
| 15 | Doc-claim sync (v4.1.2+, extended v4.1.3+ to 6 checks; v4.2.2 extended `docs_to_scan` to 6 files) | hard | [`gates/15-doc-claims.md`](gates/15-doc-claims.md) |
| 16 | verify-completion fixtures + sentinel symmetry (v4.2.9+; OS-native replay via dispatch.sh v4.2.20+) | hard | [`gates/16-hook-fixtures.md`](gates/16-hook-fixtures.md) |
| 17 | Publication readiness (GPL license; no proprietary / internal-only framing or internal contact email; active brand not the removed proprietary bundle) (v6.0.0+) | hard | [`gates/17-publication-readiness.md`](gates/17-publication-readiness.md) |

Runner order in `scripts/run-all-gates.sh`: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 15, 17, 13 (hard gates first; hook-related gates 14 and 16 run consecutively; the soft Gate 13 trails so a `WARN` lands at the end of the output rather than mid-stream).

## Run all gates

```bash
bash scripts/run-all-gates.sh
```

The runner executes all 17 gates (16 hard + 1 soft) plus `claude plugin validate` in sequence and exits non-zero on the first failure. It is the same script CI runs on every push and PR – keeping local and CI in sync.

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
grep -r -i 'qodesign' skills/ .claude-plugin/ README.md LICENSE SECURITY.md MAINTAINER.md .github/ 2>/dev/null | grep -v 'using-erfana/SKILL.md' && echo 'FAIL: leftover qodesign' || echo 'PASS'

# Hook health (Gate 14 standalone)
bash scripts/gate-14-hooks.sh
```

## What these gates do NOT cover

- Runtime correctness of the export scripts. The pre-release smoke checklist in `MAINTAINER.md` covers this – render a deck PDF, render a motion MP4, install the plugin on a second machine – once per release rather than per commit.
- Visual rendering of `demos/*.html` and showcases in a browser. HTML well-formedness is verified; visual fidelity is not.
- Skill-trigger behavior in a live Claude Code / Cursor / Codex session. Trigger-phrase coverage is checked at the regex level (Gate 8), not at runtime-discovery level.
- Auto-update propagation. To verify a release reaches end-users, push a cosmetic version bump and run `claude plugin marketplace update erfana-skills && claude plugin update erfana@erfana-skills` on a second machine – also captured in the MAINTAINER.md checklist.
