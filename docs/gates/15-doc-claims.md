# Gate 15 – doc-claim sync (v4.1.2+, extended v4.1.3+, v4.2.2+, and v6.0.0)

Verifies that prose claims in **9 docs** about plugin shape stay in sync with the actual filesystem. The `docs_to_scan` list lives in `scripts/gate-15-doc-claims.sh`:

1. `.claude/CLAUDE.md`
2. `README.md`
3. `docs/architecture.md`
4. `MAINTAINER.md`
5. `skills/using-erfana/SKILL.md` (added v4.2.2 V5c)
6. `docs/verification-gates.md` (added v4.2.2 V5c)
7. `docs/skill-registry.md` (added with Gate 18)
8. `docs/hosts.md` (added v7.1.0)
9. `CONTRIBUTING.md` (added v7.1.0)

Catches **nine** classes of drift that manual review repeatedly missed (three landed in v4.1.2; three more in v4.1.3+; a seventh in v6.0.0):

1. **`CLAUDE.md` "Current version" banner.** The regex `Current version:\s*\*\*v(\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?)\*\*` is searched for, and the version in its first match must equal `.claude-plugin/plugin.json` `version`. A second, stale banner further down the file is not detected – only the first match is compared. v4.1.1 release commit `c6a12a4` shipped with the banner still at `v4.1.0` and was caught only by manual sweep; this check makes that failure mode CI-blocking.
2. **Per-skill internal agent counts.** Walks every `skills/*/agents/` directory, counts `*.md` files, then scans the docs for prose claims using the patterns `Ships <N> (internal|skill-internal|management) agents`, `<N> skill-internal agents`, `<N> internal agents`, and `` `<skill>/agents/` (<N>) `` inline references. Each prose claim must match the filesystem count. To avoid false positives, claims are checked only on lines that mention exactly one skill explicitly – backticked (`` `report` ``), `erfana:`-namespaced (`erfana:report`), or as a `skills/<name>/` path – because the short skill names are common words; aggregate / comparison lines and plain-word mentions are skipped. No skill ships a nested `agents/` folder today, so every such count is 0.
3. **Plugin-root agents/ count.** Greps every doc for `(\d+) shared agents` and asserts the captured number equals `ls agents/*.md | wc -l`. Catches drift when the agent inventory grows or shrinks but the prose isn't updated.
4. **Top-level skills count (v4.1.3+).** Pattern `(\d+)\s+(?:auto-discovered\s+)?skills\b(?![/-])` matches claims like `14 skills` or `14 auto-discovered skills`. Compared to `ls skills/`. Negative lookahead excludes path-like uses (`skills/foo`) and compounds (`skills-related`).
5. **Hooks count (v4.1.3+).** Pattern `(\d+)\s+(?:safety\s+hooks?|hook\s+scripts?)\b(?![/-])` matches claims like `4 safety hooks` or `4 hook scripts`. Compared to `ls hooks/*.sh` **excluding the `dispatch.sh` cross-platform launcher** (v4.2.20+) – the launcher is plumbing, not a safety hook, so the count covers only the safety hooks (6 today), each shipping a `.sh` + `.ps1` pair.
6. **Slash commands count (v4.1.3+).** Pattern `(\d+)\s+slash\s+commands?\b(?![/-])` matches claims like `1 slash command`. Compared to `ls commands/*.md`.
7. **Per-gate detail-file count (v6.0.0+).** Two narrowly-scoped patterns – `(\d+)\s+per-gate\s+detail\s+files?` and `gates/01[-–](\d+)` – match claims like `12 per-gate detail files` and any `gates/01-NN` range. Compared to `ls docs/gates/*.md`. Deliberately narrow: it must **not** match generic `N gates` / `N hard gates` / `Twelve static checks` phrasings, the Gate-15 `Seven classes ... (7)` self-reference, or the historical `01-cjk.md ... 15-doc-claims.md` enumeration (no digit immediately before the dash). Added after the v6.0.0 `16 -> 17` drift (Gate 17 publication-readiness) shipped because no check covered this class.
8. **Qwen Code version agreement (v7.1.0).** See [Check 8](#check-8-qwen-code-version-agreement-v710).
9. **Total counts in words or digits (v9.3.1+).** Reads phrases that claim a total: `<N> shared agents`, `<N> slash commands`, `<N> safety hooks`, `the|all|has|ships <N> commands` or `hooks`, and `all|ships <N> skills`. `<N>` is digits or words such as "five" or "thirty-eight". It scans `docs_to_scan` plus `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `SECURITY.md`, `docs/README.md`, `docs/how-to.md`, and `docs/explanation.md`. Added after v9.3.0 shipped "33 shared agents" and "five slash commands" in both manifests while the digit checks passed. Most word counts name a subset, such as "three skills", so a plain `<word> skills` pattern is deliberately not checked.

## Implementation

The gate is a standalone script:

```bash
bash scripts/gate-15-doc-claims.sh
```

## Pass criteria

Up to nine `PASS:` lines (one per check; checks 5, 6, and 7 are skipped if `hooks/`, `commands/`, or `docs/gates/` directories don't exist). Failures use two formats. Check 2 prints ``<file>:<line>: "<claim>" near `<skill>` disagrees with filesystem (<actual>)``, so the offending line is locatable in one click. Checks 3–7 print `<file>: ... disagrees with ...` with no line number, and report only the first drift per doc – fix it, re-run, and the next one (if any) appears. Check 9 prints `<file>:<line>:` and reports every drift.

## Adding a new prose claim that should be checked

1. Write the claim in the natural prose style (e.g. `Ships 17 internal agents`, `5 hooks`, `2 slash commands`).
2. Verify the existing patterns cover it (Gate 15 accepts the count phrasings + the inline `<skill>/agents/` (N) form + `X skills` / `X (safety) hooks` / `X hook scripts` / `X slash commands`).
3. Run `bash scripts/gate-15-doc-claims.sh` to confirm green.
4. If a new pattern is needed (e.g. `<N> validation agents`), extend the relevant pattern list in `scripts/gate-15-doc-claims.sh` and re-run.

## When a count changes

A green Gate 15 does not prove every count is right. After adding or removing a skill, agent, command, or hook, also update what the gate cannot see:

- Counts in phrases check 9 does not read, such as "three of the seven" or "seven commands" with no word before it.
- The lists of names in the `description` fields of `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. Users see these in their plugin list. Check 9 reads the counts there, not the names.
- `docs/explanation.md` (its parts table and the line saying how many commands Claude can start) and `SECURITY.md` (the generic-agent count).
- Links to count-bearing headings, such as `reference.md#slash-commands-7` and `reference.md#agents-38`. `scripts/gen-reference.sh` renames the heading, so `scripts/check-docs.sh` reports each old link as a missing fragment.

To find them, search for each old number in digits and in words: `git grep -n -i -E "(7|seven) (slash )?commands|of the seven|agents-38|38 (shared )?agents"`, with the old values in place of these. Repeat for the old generic-agent count, which is a different number. Keep `\b` out of the pattern: with `git grep -E` on macOS it finds nothing and prints no error.

## Limitations

- Multi-skill lines are intentionally skipped (Check 2 only) to keep false-positive rate at zero. If a single line claims counts for two skills (e.g. comparison prose), Gate 15 will not check either claim. Author such lines with the count and skill on the same physical line, one skill per line.
- The Pattern regexes only match the natural English variants. Translations or rewrites that break the regex will fall through silently. Authors should re-grep the gate after any release-process documentation rewrite.
- **Phrasing-order blind spots.** Check 3 (`shared agents` count) requires the order `<N> shared agents`; phrasings like `Shared agents (<N> total under...)` (markdown-header style) are not matched. Similarly, the inline DIR_REF_PATTERN requires `<skill>/agents/(N)`; prefix-breakdown lines like `\`mi-\` (11)` are not matched. The post-v4.2.2 doc sweep added `76` and `11` to such phrasings manually; future drift in these forms will not be CI-blocked.
- **Historical-baseline phrasing trips Check 3.** The `(\d+) shared agents` regex matches any prose adjacency, including historical baselines. Phrasings like `absorbing 76 shared agents (later grown to 82...)` cause Check 3 to flag `76` as drift even though the prose is accurate as history. When writing about an earlier count, separate the historical number from the `shared agents` suffix – e.g. `absorbing 82 shared agents (76 at v4.0.0 + 4 fc-* in v4.2.7 + 2 in v4.2.13)`: here `82 shared agents` matches the live total and the historical `76 at v4.0.0` does not match the regex. This trip surfaced in the v4.2.13 post-release sweep on `docs/architecture.md:7`.
- Negative lookahead `(?![/-])` excludes `skills/`, `hooks/`, `commands/` path uses but does not catch every theoretical false positive – if an author writes `4 hooks_v2` or similar, the check passes. Acceptable trade-off vs. false-positive risk.
- `docs_to_scan` covers 9 files (above). Files outside this list – e.g. `SECURITY.md`, `docs/known-caveats.md` – carry plugin-shape claims that are NOT CI-blocked. v4.2.2 swept these manually; consider extending `docs_to_scan` if a class of plugin-shape claim drifts repeatedly outside the current 9-file scope.
- **Per-skill phase and gate counts are not a Gate-15 claim class at all.** The nine checks cover version, the Qwen Code version, per-skill nested agent counts, shared agents, skills, hooks, slash commands, per-gate detail files, and total counts – nothing else. The prominent current instance: `skills/issue/references/implement.md` states "Thirteen phases … plus three embedded review sub-gates", and the README and `docs/architecture.md` restate the same arithmetic. Nothing compares any of it to the phase table, and the skill's own files are outside `docs_to_scan` regardless. Adding or removing a phase or a sub-gate is therefore a manual sweep, not a gated one.

## Check 8: Qwen Code version agreement (v7.1.0)

Three places can name a Qwen version and drift apart: `scripts/_lib/host_matrix.py` (the source of truth, and what `docs/hosts.md` is generated from), the npm pin in `.github/workflows/verify.yml`, and any version stated in the scanned prose. The gate fails when any of them disagrees with `HOSTS['qwen-code']['tested_version']`.

The alias tables and the agent-frontmatter allowlist in `host_matrix.py` were transcribed out of one specific Qwen bundle, and the smoke test checksums that bundle. A stale pin means CI certifies a Qwen nobody read.

Because the pin and the transcription are enforced equal, this check can never fire from CI alone – that is what the weekly `qwen-canary` workflow is for. It runs the smoke test against `@latest`, never blocks, and opens or updates one `qwen-drift` issue when the two diverge.

`docs/hosts.md` and `CONTRIBUTING.md` joined `docs_to_scan` in the same release (7 docs to 9).
