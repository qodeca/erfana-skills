---
name: releasing-erfana
description: Release procedure for the erfana plugin – version bump, prose markers, skill registry, CHANGELOG, the develop-to-main release PR, the admin merge, signed tag, GitHub Release, and post-release install check, plus the staged (rc) rollout path and signed-commit verification. Use when cutting, tagging, or verifying an erfana release, or when asked "how do we release" or "ship vX.Y.Z".
---

# Releasing erfana

Maintainer-only procedure. Hard rules that apply outside a release stay in [`.claude/CLAUDE.md`](../../CLAUDE.md).

## Release process

For every release:

1. Changes reach `develop` first via `feature/...` branches (CI-gated). Steps 2–5 (bump, markers, registry and reference, CHANGELOG) land on `develop`; the release itself is a PR from `develop` into `main`.
2. Bump `version` in `.claude-plugin/plugin.json` only (semver). `plugin.json` is the single source of truth – the marketplace entry carries no `version` (Claude Code resolves `plugin.json` `version` first per the [version-resolution order](https://code.claude.com/docs/en/plugin-marketplaces), so a duplicate in `marketplace.json` would only mask it).
3. **Sync prose version markers** – update `Current version: **vX.Y.Z**` in `.claude/CLAUDE.md` ("What this is") so it matches. Gate 15 enforces. Also bump `CITATION.cff` (`version` + `date-released`) – not Gate-enforced, sync by hand. `MAINTAINER.md` "Current state" header is version-independent. Then regenerate the skill registry – `bash scripts/gen-skill-registry.sh` – and commit it, so the shipped `docs/skill-registry.md` is accurate as of the release rather than lagging (Gate 18 warns between releases; this step is what clears the warning). Regenerate it **last**, after every skill-source PR has already squash-merged into `develop`, so each row's subject matches the final squash commit; if a skill lands after this regen, redo the regen as a registry-only change (see the squash caveat in `.claude/CLAUDE.md` "Critical commands"). Also regenerate the user-facing reference – `bash scripts/gen-reference.sh` – and commit `docs/reference.md`; Gate 19 hard-fails when it differs from what the generator produces. Gate 19 also fails until the "This page describes erfana vX.Y.Z." line on each user page and the sample install output in `docs/how-to.md` and `docs/hosts.md` (`Version:`, `erfana (…)`, `Release tag:`) show the new version, so update those lines in the bump.
4. Add an entry to `CHANGELOG.md` (Keep a Changelog format). If an `## [Unreleased]` section exists (feature branches may accumulate one), promote it to `## [vX.Y.Z] - <date>` as part of the release. **Re-stamp the date on release day.** An entry written during development carries the date it was drafted, and an rc soak puts days between drafting and shipping – so `CHANGELOG.md`'s heading and `CITATION.cff` `date-released` must both be re-stamped on release day (`CITATION.cff` in step 3, the CHANGELOG heading here in step 4), not left at whatever the branch happened to say. Neither is Gate-enforced.
5. Run `bash scripts/run-all-gates.sh` (expect `=== ALL GATES PASSED ===`) and `bash scripts/check-docs.sh` (links, house style, Markdown structure – it needs `lychee`, `vale`, and Node 20+ for `npx`, and fails rather than skips when one is missing). Then commit (auto-signed via SSH) and let CI run. Both must pass before you tag in step 8.
6. Open the release PR (`develop` -> `main`). CODEOWNERS auto-requests review from `@marcinobel`. The `main-protection` ruleset requires signed commits, code-owner review, and the passing `verify.yml` status checks (`gates`, `secret-scan`). `verify.yml` also runs `qwen-compat` and `powershell` (v7.1.0+), which are **not** required checks: add either to the ruleset only after it has reported green on a PR into `main`, since a required check that has never reported blocks merges indefinitely.
7. **Solo-maintainer flow**: GitHub disallows self-approval, so the release PR merges with `gh pr merge <num> --admin --merge` (the ruleset has a RepositoryRole bypass actor for admin; `--admin` overrides both the required CI checks and the ruleset's squash-only `allowed_merge_methods`, so confirm CI is green first). Two flags that are correct on a feature PR are wrong here: **never `--delete-branch`** (the head branch is `develop`, long-lived), and **never `--squash`** (a squash commit is not a descendant of `develop`, so the two branches lose their shared history and every later release PR re-lists the whole backlog). Feature PRs into `develop` take the opposite form: `gh pr merge <num> --squash --delete-branch`. Bypass becomes unnecessary when a backup maintainer joins.
8. **After merge** (do NOT skip): `git pull origin main && git tag -s vX.Y.Z -m "..." && git push origin vX.Y.Z`.
9. Create the GitHub Release: `gh release create vX.Y.Z --notes-file -`. Verify `gh release list` shows the new version with the `Latest` flag; if `--latest` was lost (e.g. back-filling), correct with `gh release edit vX.Y.Z --latest`.
10. **Verify what a user actually gets.** Qwen resolves the **latest GitHub release tag**, so nothing published before step 9 is installable and every earlier check ran against a tree no user will see. Install the published release and confirm the shape: `qwen extensions install qodeca/erfana-skills:erfana` (on a machine that already has erfana, `install` refuses with "already installed" – use `qwen extensions update erfana`) then `qwen extensions list` – expect the new version, the right `Release tag:`, and the skill, agent, and command counts stated in `.claude/CLAUDE.md` "What this is" (Gate 15 keeps those in step with the filesystem). Do **not** pass `--consent`; the prompt it skips is the one a user is meant to read. Then prove a hook still fires from the installed copy, which is the only check that exercises the shipped artifact rather than the repo:

    ```bash
    bash ~/.qwen/extensions/erfana/hooks/dispatch.sh secret-detector \
      < tests/hooks/secret-detector/qwen-write-file-secret-blocks.json
    ```

    Expect `BLOCKED: AWS access key detected (AKIA...)` and exit code 2. Use the shipped fixture rather than a hand-typed key: the AWS rule matches `AKIA` plus 16 uppercase letters or digits, so a readable placeholder such as `AKIA_EXAMPLE_KEY` does not match and the hook rightly allows it – a silent pass that proves nothing.
    This is still the loader, not the executor: it does not prove a skill behaves correctly inside a session. See [`docs/hosts.md`](../../../docs/hosts.md).

Auto-update is **opt-in** for this third-party marketplace (only Anthropic's own marketplaces auto-update by default). Users who enabled it – per-marketplace in `/plugin`, or org-wide via `"autoUpdate": true` in managed settings – get the update on next session start. Manual fallback, as two separate in-session commands: `/plugin marketplace update erfana-skills`, then `/plugin update erfana@erfana-skills`. From a shell: `claude plugin marketplace update erfana-skills && claude plugin update erfana@erfana-skills`.

Succession + bus-factor: [`MAINTAINER.md`](../../../MAINTAINER.md). Forward-looking work: [`ROADMAP.md`](../../../ROADMAP.md) + open GitHub issues. De-scoped items + reasoning: [`BACKLOG.md`](../../../BACKLOG.md).

## Staged rollout

Routine releases promote `develop` to `main` via PR. For releases that materially change skill behavior or could regress trigger phrases, use the staged path:

1. Run release steps 1–5 as usual, so the bump, markers, registry, reference, and CHANGELOG are on `develop` and CI is green there.
2. Tag the head of `develop` with an `-rc.N` suffix and push the tag: `git tag -s vX.Y.Z-rc.1 -m "rc.1"`, then `git push origin vX.Y.Z-rc.1`.
3. Pin 3–5 pilot users to the rc tag: `/plugin install erfana@erfana-skills@vX.Y.Z-rc.1`.
4. After a 48-hour soak with no reports, continue with release steps 6–10: the release PR from `develop` into `main`, the admin merge, the signed final tag on `main`, the GitHub Release, and the install check. If the soak finds a problem, fix it on `develop` through a feature PR and tag the next `-rc.N`.
5. The pilot group goes back to the normal channel with `/plugin install erfana@erfana-skills`.

The marketplace serves whatever the manifest's `version` field says; rc tags are opt-in (manifest unchanged, no propagation to non-pinned users). Use staged rollout for: skill-frontmatter rewrites changing trigger phrases, manifest schema migrations, hook additions, anything that could flip behavior for downstream consumers without warning.

## Signed commits + signed tags

The `main-protection` ruleset enforces `required_signatures`; unsigned pushes to `main` are rejected. Verify locally:

```bash
git config --global --get-regexp '^(commit|tag|gpg|user)\.'
# Expect commit.gpgsign=true, tag.gpgsign=true, gpg.format=ssh
git log --show-signature -1
```

A local pass is **necessary but not sufficient** for the green "Verified" badge on GitHub – the cryptographic check can pass while GitHub still returns `verified: false / reason: "no_user"`. The two-stage end-to-end check, the worked example of that failure mode, and new-maintainer key setup all live in [`MAINTAINER.md`](../../../MAINTAINER.md) `## Onboarding a backup maintainer`.
