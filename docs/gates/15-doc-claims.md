# Gate 15 – doc-claim sync (v4.1.2+, extended v4.1.3+, v4.2.2+, and v6.0.0)

Verifies that prose claims in **6 docs** about plugin shape stay in sync with the actual filesystem. The `docs_to_scan` list lives at `scripts/gate-15-doc-claims.sh:44`:

1. `CLAUDE.md`
2. `README.md`
3. `docs/architecture.md`
4. `MAINTAINER.md`
5. `skills/using-erfana/SKILL.md` (added v4.2.2 V5c)
6. `docs/verification-gates.md` (added v4.2.2 V5c)

Catches **seven** classes of drift that manual review repeatedly missed (three landed in v4.1.2; three more in v4.1.3+; a seventh in v6.0.0):

1. **`CLAUDE.md` "Current version" banner.** The regex `Current version:\s*\*\*v(\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?)\*\*` must match exactly once and the captured version must equal `.claude-plugin/plugin.json` `version`. v4.1.1 release commit `c6a12a4` shipped with the banner still at `v4.1.0` and was caught only by manual sweep; this check makes that failure mode CI-blocking.
2. **Per-skill internal agent counts.** Walks every `skills/managing-*/agents/` directory, counts `*.md` files, then scans the docs for prose claims using the patterns `Ships <N> (internal|skill-internal|management) agents`, `<N> skill-internal agents`, `<N> internal agents`, and `<skill>/agents/` (<N>) inline references. Each prose claim must match the filesystem count. To avoid false positives, claims are checked only on lines that mention exactly one `managing-*` skill (aggregate / comparison lines are skipped).
3. **Plugin-root agents/ count.** Greps every doc for `(\d+) shared agents` and asserts the captured number equals `ls agents/*.md | wc -l`. Catches drift when the agent inventory grows or shrinks but the prose isn't updated.
4. **Top-level skills count (v4.1.3+).** Pattern `(\d+)\s+(?:auto-discovered\s+)?skills\b(?![/-])` matches claims like `14 skills` or `14 auto-discovered skills`. Compared to `ls skills/` minus the `design-shared` bundle (which is not a skill). Negative lookahead excludes path-like uses (`skills/foo`) and compounds (`skills-related`).
5. **Hooks count (v4.1.3+).** Pattern `(\d+)\s+(?:safety\s+hooks?|hook\s+scripts?)\b(?![/-])` matches claims like `4 safety hooks` or `4 hook scripts`. Compared to `ls hooks/*.sh` **excluding the `dispatch.sh` cross-platform launcher** (v4.2.20+) – the launcher is plumbing, not a safety hook, so the count stays at the 4 hooks that each ship a `.sh` + `.ps1` pair.
6. **Slash commands count (v4.1.3+).** Pattern `(\d+)\s+slash\s+commands?\b(?![/-])` matches claims like `1 slash command`. Compared to `ls commands/*.md`.
7. **Per-gate detail-file count (v6.0.0+).** Two narrowly-scoped patterns – `(\d+)\s+per-gate\s+detail\s+files?` and `gates/01[-–](\d+)` – match claims like `17 per-gate detail files` and the range `gates/01-17`. Compared to `ls docs/gates/*.md`. Deliberately narrow: it must **not** match generic `N gates` / `N hard gates` / `Seventeen static checks` phrasings, the Gate-15 `Seven classes ... (7)` self-reference, or the historical `01-cjk.md ... 15-doc-claims.md` enumeration (no digit immediately before the dash). Added after the v6.0.0 `16 -> 17` drift (Gate 17 publication-readiness) shipped because no check covered this class.

## Implementation

The gate is a standalone script:

```bash
bash scripts/gate-15-doc-claims.sh
```

## Pass criteria

Up to seven `PASS:` lines (one per check; checks 5, 6, and 7 are skipped if `hooks/`, `commands/`, or `docs/gates/` directories don't exist). Failures print `<file>:<line>: <quoted-claim> disagrees with filesystem (<actual>)` so the offending line is locatable in one click.

## Adding a new prose claim that should be checked

1. Write the claim in the natural prose style (e.g. `Ships 17 internal agents`, `5 hooks`, `2 slash commands`).
2. Verify the existing patterns cover it (Gate 15 accepts the count phrasings + the inline `<skill>/agents/` (N) form + `X skills` / `X (safety) hooks` / `X hook scripts` / `X slash commands`).
3. Run `bash scripts/gate-15-doc-claims.sh` to confirm green.
4. If a new pattern is needed (e.g. `<N> validation agents`), extend the relevant pattern list in `scripts/gate-15-doc-claims.sh` and re-run.

## Limitations

- Multi-skill lines are intentionally skipped (Check 2 only) to keep false-positive rate at zero. If a single line claims counts for two skills (e.g. comparison prose), Gate 15 will not check either claim. Author such lines with the count and skill on the same physical line, one skill per line.
- The Pattern regexes only match the natural English variants. Translations or rewrites that break the regex will fall through silently. Authors should re-grep the gate after any release-process documentation rewrite.
- **Phrasing-order blind spots.** Check 3 (`shared agents` count) requires the order `<N> shared agents`; phrasings like `Shared agents (<N> total under...)` (markdown-header style) are not matched. Similarly, the inline DIR_REF_PATTERN requires `<skill>/agents/(N)`; prefix-breakdown lines like `\`mi-\` (11)` are not matched. The post-v4.2.2 doc sweep added `76` and `11` to such phrasings manually; future drift in these forms will not be CI-blocked.
- **Historical-baseline phrasing trips Check 3.** The `(\d+) shared agents` regex matches any prose adjacency, including historical baselines. Phrasings like `absorbing 76 shared agents (later grown to 82...)` cause Check 3 to flag `76` as drift even though the prose is accurate as history. When writing about an earlier count, separate the historical number from the `shared agents` suffix — e.g. `absorbing 82 shared agents (76 at v4.0.0 + 4 fc-* in v4.2.7 + 2 in v4.2.13)`: here `82 shared agents` matches the live total and the historical `76 at v4.0.0` does not match the regex. This trip surfaced in the v4.2.13 post-release sweep on `docs/architecture.md:7`.
- Negative lookahead `(?![/-])` excludes `skills/`, `hooks/`, `commands/` path uses but does not catch every theoretical false positive — if an author writes `4 hooks_v2` or similar, the check passes. Acceptable trade-off vs. false-positive risk.
- `docs_to_scan` covers 6 files (above). Files outside this list — e.g. `SECURITY.md`, `skills/managing-skills/guides/embedded-prompts-guide.md` — carry plugin-shape claims that are NOT CI-blocked. v4.2.2 swept these manually; consider extending `docs_to_scan` if a class of plugin-shape claim drifts repeatedly outside the current 6-file scope.
