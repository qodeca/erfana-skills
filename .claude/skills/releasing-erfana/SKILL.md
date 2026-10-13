---
name: releasing-erfana
description: Release procedure for the erfana plugin – version bump, prose markers, skill registry, CHANGELOG, the develop-to-main release PR, the admin merge, signed tag, GitHub Release, and post-release install check, plus the staged (rc) rollout path and signed-commit verification. Use when cutting, tagging, or verifying an erfana release, or when asked "how do we release" or "ship vX.Y.Z".
---

# Releasing erfana

Maintainer-only procedure. Hard rules that apply outside a release stay in [`.claude/CLAUDE.md`](../../CLAUDE.md).

## Release process

For every release:
1. Changes reach `develop` first via `feature/...` branches (CI-gated). Steps 2-5 (bump, markers, registry, CHANGELOG) land on `develop`; the release itself is a PR from `develop` into `main`.
2. Bump `version` in `.claude-plugin/plugin.json` only (semver). `plugin.json` is the single source of truth – the marketplace entry carries no `version` (Claude Code resolves `plugin.json` `version` first per the [version-resolution order](https://code.claude.com/docs/en/plugin-marketplaces), so a duplicate in `marketplace.json` would only mask it).
3. **Sync prose version markers** – update `Current version: **vX.Y.Z**` in `.claude/CLAUDE.md` ("What this is") so it matches. Gate 15 enforces. Also bump `CITATION.cff` (`version` + `date-released`) – not Gate-enforced, sync by hand. `MAINTAINER.md` "Current state" header is version-independent. Then regenerate the skill registry – `bash scripts/gen-skill-registry.sh` – and commit it, so the shipped `docs/skill-registry.md` is accurate as of the release rather than lagging (Gate 18 warns between releases; this step is what clears the warning). Regenerate it **last**, after every skill-source PR has already squash-merged into `develop`, so each row's subject matches the final squash commit; if a skill lands after this regen, redo the regen as a registry-only change (see the squash caveat in `.claude/CLAUDE.md` "Critical commands").
4. Add an entry to `CHANGELOG.md` (Keep a Changelog format). If an `## [Unreleased]` section exists (feature branches may accumulate one), promote it to `## [vX.Y.Z] - <date>` as part of the release. **Re-stamp the date on release day.** An entry written during development carries the date it was drafted, and an rc soak puts days between drafting and shipping – so `CHANGELOG.md`'s heading and `CITATION.cff` `date-released` must both be corrected at step 3, not left at whatever the branch happened to say. Neither is Gate-enforced.
5. Commit (auto-signed via SSH) and let CI run.
6. Open the release PR (`develop` -> `main`). CODEOWNERS auto-requests review from `@marcinobel`. The `main-protection` ruleset requires signed commits, code-owner review, and the passing `verify.yml` status checks (`gates`, `secret-scan`). `verify.yml` also runs `qwen-compat` and `powershell` (v7.1.0+), which are **not** required checks: add either to the ruleset only after it has reported green on a PR into `main`, since a required check that has never reported blocks merges indefinitely.
7. **Solo-maintainer flow**: GitHub disallows self-approval, so the release PR merges with `gh pr merge <num> --admin --merge` (the ruleset has a RepositoryRole bypass actor for admin; `--admin` overrides both the required CI checks and the ruleset's squash-only `allowed_merge_methods`, so confirm CI is green first). Two flags that are correct on a feature PR are wrong here: **never `--delete-branch`** (the head branch is `develop`, long-lived), and **never `--squash`** (a squash commit is not a descendant of `develop`, so the two branches lose their shared history and every later release PR re-lists the whole backlog). Feature PRs into `develop` take the opposite form: `gh pr merge <num> --squash --delete-branch`. Bypass becomes unnecessary when a backup maintainer joins.
8. **After merge** (do NOT skip): `git pull origin main && git tag -s vX.Y.Z -m "..." && git push origin vX.Y.Z`.
9. Create the GitHub Release: `gh release create vX.Y.Z --notes-file -`. Verify `gh release list` shows the new version with the `Latest` flag; if `--latest` was lost (e.g. back-filling), correct with `gh release edit vX.Y.Z --latest`.
10. **Verify what a user actually gets.** Qwen resolves the **latest GitHub release tag**, so nothing published before step 9 is installable and every earlier check ran against a tree no user will see. Install the published release and confirm the shape: `qwen extensions install qodeca/erfana-skills:erfana` then `qwen extensions list` — expect the new version, the right `Release tag:`, and the skill, agent, and command counts stated in `.claude/CLAUDE.md` "What this is" (Gate 15 keeps those in step with the filesystem). Do **not** pass `--consent`; the prompt it skips is the one a user is meant to read. Then prove a hook still fires from the installed copy, which is the only check that exercises the shipped artifact rather than the repo:
    ```bash
    printf '%s' '{"tool_name":"write_file","tool_input":{"file_path":"/tmp/x.ts","content":"k=\"AKIA_EXAMPLE_KEY\""}}' \
      | bash ~/.qwen/extensions/erfana/hooks/dispatch.sh secret-detector
    ```
    This is still the loader, not the executor: it does not prove a skill behaves correctly inside a session. See [`docs/hosts.md`](../../../docs/hosts.md).

Auto-update is **opt-in** for this third-party marketplace (only Anthropic's own marketplaces auto-update by default). Users who enabled it – per-marketplace in `/plugin`, or org-wide via `"autoUpdate": true` in managed settings – get the update on next session start. Manual fallback: `/plugin marketplace update erfana-skills && /plugin update erfana@erfana-skills`.

Succession + bus-factor: [`MAINTAINER.md`](../../../MAINTAINER.md). Forward-looking work: [`ROADMAP.md`](../../../ROADMAP.md) + open GitHub issues. De-scoped items + reasoning: [`BACKLOG.md`](../../../BACKLOG.md).

## Staged rollout

Routine releases promote `develop` to `main` via PR. For releases that materially change skill behavior or could regress trigger phrases, use the staged path:

1. On a `feature/` branch off `develop`, edit + bump + CHANGELOG as usual, and land it on `develop`.
2. Push and tag with `-rc.N` suffix: `git tag -s vX.Y.Z-rc.1 -m "rc.1"`.
3. Pin 3–5 pilot employees to the rc tag: `/plugin install erfana@erfana-skills@vX.Y.Z-rc.1`.
4. After 48-hour soak with no reports, retag the same commit as the final version, push, merge feature branch via PR.
5. Pilot group reverts to auto-update with `/plugin install erfana@erfana-skills`.

The marketplace serves whatever the manifest's `version` field says; rc tags are opt-in (manifest unchanged, no propagation to non-pinned users). Use staged rollout for: skill-frontmatter rewrites changing trigger phrases, manifest schema migrations, hook additions, anything that could flip behavior for downstream consumers without warning.

## Signed commits + signed tags

The `main-protection` ruleset enforces `required_signatures`; unsigned pushes to `main` are rejected. Verify locally:

```bash
git config --global --get-regexp '^(commit|tag|gpg|user)\.'
# Expect commit.gpgsign=true, tag.gpgsign=true, gpg.format=ssh
git log --show-signature -1
```

A local pass is **necessary but not sufficient** for the green "Verified" badge on GitHub – the cryptographic check can pass while GitHub still returns `verified: false / reason: "no_user"`. The two-stage end-to-end check, the worked example of that failure mode, and new-maintainer key setup all live in [`MAINTAINER.md`](../../../MAINTAINER.md) `## Onboarding a backup maintainer`.
