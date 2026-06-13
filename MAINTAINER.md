# Maintainer succession plan

This document establishes the operational contract for keeping the `qodeca/erfana-skills` plugin running when the primary maintainer is unavailable, on leave, or no longer at Qodeca.

## Current state

This section is intentionally version-independent – treat it as the always-true description of the plugin's maintainership posture. The release cadence (CLAUDE.md `## Release process`) is what advances the version number; this section advances when the *people* or *scope shape* changes, not when a routine release ships.

- **Primary maintainer**: Marcin Obel (`@marcinobel` on GitHub).
- **Contact vs. commit identity**: the project's security/contact channel is GitHub private vulnerability reporting (see `SECURITY.md`), not a personal email. Commit author identity is independent and uses whichever email is registered + verified on the maintainer's GitHub account (currently `marcin.obel@gmail.com` for Marcin). GitHub's server-side verifier returns `verified: false / reason: "no_user"` if the commit's author email is not on the account's verified-emails list, even when the local SSH signature is valid. See `## Onboarding a backup maintainer` step 3 for the selection rule.
- **Backup maintainer**: TBD – the company has not yet onboarded a second maintainer for this plugin.
- **Repo administrators**: the Qodeca GitHub org owners group (`@qodeca` admins) retains break-glass access via repo settings even if the maintainer is unreachable.
- **Plugin scope**: design + orchestration toolkit (since v4.0.0; process skill `grill-me` added v4.2.3; verification skill `fact-checking` added v4.2.7; researched review command `lens-review` added v4.2.11; PM/PO issue-translation command `explain-issue` added v4.2.14). 15 skills + 87 shared agents + per-skill internal agents under `skills/managing-reports/agents/` + 4 safety hooks + 5 slash commands. Bus-factor risk doubled vs. the v3.x design-only era; backup-maintainer onboarding remains an active priority. Live counts are enforced by Gate 15 (`scripts/gate-15-doc-claims.sh`) – this paragraph is prose, the source of truth is the filesystem.

## Routine release authority

Until a backup maintainer is named:

- **Routine releases (patch + minor)**: only Marcin pushes to `main`. CI must pass before merge.
- **Hotfixes**: same path; no separate emergency channel — downtime is non-blocking for a developer tool.
- **Major releases (breaking changes)**: announce in the maintainers' release channel at least 48 hours before tagging.

## Pre-release smoke checklist

Run before tagging any release. CI's static gates (`scripts/run-all-gates.sh`) cover content invariants but not runtime correctness – Playwright/Chromium ABI breakage, script-CLI regression, and auto-update propagation surface only at runtime. Three manual checks, ~10 minutes total:

1. **Path A deck export end-to-end.** Pick a Path A multi-file deck (any aggregator under `skills/design-shared/demos/` that uses `deck_index.html`, NOT `c2-slides-pptx.html` which is single-file motion). Run `node skills/design-shared/scripts/export_deck_pdf.mjs --help` to confirm the CLI surface; then exercise the script against the chosen aggregator. Confirm the PDF opens in Preview / Acrobat and is non-trivial in size (≥50 KB per slide is a sanity floor).
2. **Motion MP4 render.** Pick the smallest motion demo. Run `node skills/design-shared/scripts/render-video.js` against it. Confirm the MP4 plays in QuickTime and the watermark `Created with erfana` is present and legible.
3. **Plugin install on a second machine.** On a clean machine (no token needed — public marketplace), run `/plugin marketplace update erfana-skills && /plugin install erfana@erfana-skills@<rc-or-final-tag>`. Confirm `/plugin list` shows the new version and any new sub-skill appears in autocomplete (`/erfana:<...>`).

If any item fails: do not tag. Fix the underlying issue, re-run CI, re-run the failing item. Successful checklist runs do not need to be recorded – failures should be triaged as a release-blocker bug.

## Bus-factor handoff procedure

If Marcin is unavailable for more than 5 business days and a release must ship:

1. **Qodeca org admins** elevate a designated engineer to repo admin via GitHub org settings.
2. The new admin configures their local git for SSH signing using a key registered to their account with signing purpose – see `## Onboarding a backup maintainer` step 3 below for the setup commands.
3. They open a PR from a `feature/...` branch – CODEOWNERS will request review from `@marcinobel` but, with admin override, the temporary maintainer can self-approve and merge after CI passes.
4. They tag the new release manually (`git tag -s vX.Y.Z`) and push.
5. They post a one-line note in the maintainers' coordination channel: "erfana-skills vX.Y.Z released by [name] on behalf of @marcinobel".

If Marcin departs Qodeca permanently:

1. Org admins reassign repo ownership and update `.github/CODEOWNERS` to the new primary maintainer.
2. The old release signing SSH key on GitHub is revoked. The new maintainer registers a new signing key under their own account.
3. `MAINTAINER.md` (this file) is updated to reflect the new primary contact.
4. SECURITY.md disclosure addresses are updated to point at the new maintainer.

## Onboarding a backup maintainer

Once a second maintainer is named:

1. Add their handle to `.github/CODEOWNERS`:
   ```
   * @marcinobel @backup-handle
   ```
2. Update the `main-protection` GitHub ruleset to require at least one approving review (`required_approving_review_count: 1`) instead of zero. This activates CODEOWNERS as a real review gate rather than a documentation hint.
3. Configure signed-commits + signed-tags on their machine (after their public SSH key is registered on GitHub with **signing purpose** – not just authentication; the two are separate panels in GitHub Settings → SSH and GPG keys):

   ```bash
   git config --global user.email <github-verified-email>
   git config --global gpg.format ssh
   git config --global user.signingkey ~/.ssh/<their-signing-key>
   git config --global commit.gpgsign true
   git config --global tag.gpgsign true
   mkdir -p ~/.config/git
   echo "<their-email> $(ssh-keygen -y -f ~/.ssh/<their-signing-key>)" \
     >> ~/.config/git/allowed_signers
   git config --global gpg.ssh.allowedSignersFile ~/.config/git/allowed_signers
   ```

   **Email constraints**:
   - `<github-verified-email>` MUST appear on the new maintainer's GitHub account under Settings → Emails with a green verified check. If their work email is not on the account, either add+verify it on GitHub first, or set `user.email` to an address that already is – git author identity is independent of the contact channel recorded in `## Current state`.
   - `<their-email>` in the `allowed_signers` line MUST equal the `user.email` set above. If the two diverge, GitHub returns `verified: false / reason: "no_user"` even when the local SSH signature is valid (the cryptographic check passes but GitHub cannot map the commit's author email to a registered account).

   The `main-protection` ruleset enforces `required_signatures` – unsigned pushes to `main` are rejected. **Verify after setup in two stages**:

   ```bash
   # Stage (a) – local SSH signature math
   git log --show-signature -1   # expect: Good "git" signature for <their-email>

   # Stage (b) – GitHub server-side verifier (catches the email-mismatch case stage (a) misses)
   git commit --allow-empty -m "chore: signing-verification probe"
   git push origin feature/<name>-signing-probe    # use a feature branch, not main
   gh api repos/qodeca/erfana-skills/commits/$(git rev-parse HEAD) \
     --jq '.commit.verification | {verified, reason}'
   # expect: {"verified": true, "reason": "valid"}
   ```

   If stage (b) returns `verified: false`, do NOT proceed – fix `user.email`, the GitHub email-verification state, or the `allowed_signers` principal until stage (b) is green. The active-maintainer verify-only commands live in `CLAUDE.md ## Signed commits + signed tags`.
4. Add them to the maintainers' release-notification channel.
5. Update this file to reflect the new state.

## Known risks during the single-maintainer period

- **Audit trail gap**: with `required_approving_review_count: 0`, Marcin can push directly to main without recorded review. Mitigated by signed commits (when SSH signing is wired) which provide cryptographic attribution.
- **Knowledge silo**: institutional knowledge about why specific design choices were made (e.g., the brand-consistency gate, the v1 → v2 decomposition, the v2.3 brand-system layer's deliberate static-pointer model) lives in commit history, `CLAUDE.md`, `docs/architecture.md`, and `ROADMAP.md` / `BACKLOG.md`. All are searchable; new maintainers should grep these before changing structural decisions.
- **Brand-system smoke checks not yet in checklist**: the v2.3 brand-system layer adds runtime concerns (mid-session `ACTIVE_BRAND` swap reflected in renders, broken-fixture rejection by Gate 12) that the pre-release smoke checklist above does not yet cover. Tracked as roadmap issue [#18](https://github.com/qodeca/erfana-skills/issues/18) for v2.5.0 – when that lands, this section can be deleted.
- **(Resolved by going public.)** Installing from the public marketplace needs no GitHub token, so the former 90-day PAT-rotation risk no longer applies.

## Escalation contacts

- Repo admin / org admin: see Qodeca's GitHub org settings for current owners.
- Plugin user issues: open a GitHub issue; for security matters, use private vulnerability reporting (see `SECURITY.md`).
- Anthropic-side concerns (Claude Code behavior, plugin schema changes): file in `anthropics/claude-code` GitHub issues.

## Review cadence

This document should be reviewed and updated:
- When a backup maintainer is added or removed.
- After any incident that triggered the bus-factor handoff procedure.
- At least annually, even if no changes have occurred.
