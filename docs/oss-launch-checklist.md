# OSS launch checklist (manual / external steps)

The reversible, file-based prep for the open-source release is done on the `feature/oss-prep` branch (Phases A-E + version bump + CHANGELOG). The steps below are the **irreversible or human-only** actions that complete the launch. Do them in order; the visibility flip is the point of no return.

> The file-based prep (license, brand swap, scrub, community files, Gate 17, v6.0.0) is on the `feature/oss-prep` branch; the steps below are the human-only tail.

## Before publishing

- [x] **Counsel review of the CLA — done.** `CLA.md` has been reviewed by counsel and the DRAFT banner removed. The CLA must be live (CLA-assistant wired, below) before any external contribution is merged.
- [ ] **Wire CLA-assistant** (GitHub App) to the repo and point it at the finalised `CLA.md`.
- [x] **Accountable owner — resolved.** Marcin Obel ([@marcinobel](https://github.com/marcinobel)) is the sole accountable owner (no named backup). The conduct-report contact **hi@qodeca.com** is monitored.
- [ ] **Confirm zero forks** of the private repo: `gh api repos/qodeca/erfana-skills/forks --jq 'length'` returns `0`.
- [ ] **Scan git history (not just the tree)** for secrets — the working tree is clean, but history is what becomes public:
  - `gitleaks detect --source . --log-opts="--all"`
  - `trufflehog git file://$PWD --results=verified,unknown`
  - Rotate anything found **before** publishing.
- [ ] **Review old issue / PR / discussion bodies** for internal data (or rely on a fresh repo dropping them — see below).

## Publish (fresh repo, single clean commit)

- [ ] **Do NOT flip the existing private repo public** — its 423 MB history (brandbook PDFs, employee photos) would become reachable via the fork network even after a squash.
- [ ] Build the public tree as a **single squashed commit**, authored with the **gmail identity** (`git config user.email marcin.obel@gmail.com`; the qodeca.com address triggers `no_user`). Verify: `git log --format='%ae %ce' -1`.
- [ ] **Rename the existing private repo** to `erfana-skills-archive` (kept private as the full-history record).
- [ ] **Create a new public repo** at `qodeca/erfana-skills` and push the single clean commit. Verify: `git rev-list --all --count` is `1` and `git cat-file --batch-all-objects --batch-check | grep blob` shows no PDF/JPEG blobs.
- [ ] **Rehearse** all of the above on a throwaway scratch repo first.
- [ ] Tag **`v6.0.0-rc.1`** (signed), write release notes from the CHANGELOG.

## Final checkpoint (point of no return)

- [ ] Sign-off line confirming: history scan clean, single commit, gmail identity, zero forks, URL plan correct.
- [ ] **Flip visibility to public as the very last action.** Until then the repo stays private and the launch can be aborted.

## After publishing (GitHub settings)

- [x] Enable **private vulnerability reporting** (Security tab) — `SECURITY.md` already points at it.
- [x] Enable **Dependabot alerts**, **secret scanning**, and **push protection** (free on public repos).
- [ ] Harden Actions: require approval for **fork-PR workflows** (`GITHUB_TOKEN` is already read-only via `verify.yml` top-level `permissions: contents: read`).
- [x] Add repo **description** + **topics** (`claude-code`, `claude-code-plugin`, `agents`, `design`, `automation`).
- [ ] Upload a **1280x640 social-preview image** — prepared at [`docs/assets/social-preview/erfana-social-preview.png`](assets/social-preview/erfana-social-preview.png) (source `card.html` alongside); upload via repo Settings → General → Social preview.
- [x] Enable **Discussions** (the issue-template `config.yml` already links to it).
- [ ] Add **`good first issue`** and **`help wanted`** labels and tag a few starter issues.

## Discoverability (after publishing)

Self-hosting the `qodeca/erfana-skills` marketplace is the canonical install path and needs none of the below. These are optional reach, and all require the repo to be **public** first.

- [ ] **Submit to Anthropic's community marketplace.** Use the web form at [clau.de/plugin-directory-submission](https://clau.de/plugin-directory-submission). On approval, the plugin is SHA-pinned into [`anthropics/claude-plugins-community`](https://github.com/anthropics/claude-plugins-community) and installable via `/plugin install erfana@claude-community`. Submission runs `claude plugin validate` + automated safety screening; passing the local gates is the gate. The official `claude-plugins-official` marketplace is curated at Anthropic's discretion with no application process — community is the route authors control.
- [ ] **PR into a community list** for extra reach, e.g. [ComposioHQ/awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) (fork → add an entry → PR).
- [ ] **Confirm `claude plugin validate . --strict` is green** before either submission (CI already runs it on every push).

## Consumer continuity

- [ ] Existing internal users pinned to a `v5.x` version will break when old tags are gone. Either preserve a `v5.x` tag on the public commit, or notify pinned users to re-pin / clear `~/.claude/plugins/cache/`. Decide whether internal users migrate to the public repo or stay on the archive.

## Rollout & announce

- [ ] Soak the `v6.0.0-rc.1` tag (48h+, pilot installs). On no reports, retag the same commit as **`v6.0.0`** and bump the manifest if needed.
- [ ] Announce (release notes -> Show HN / Reddit / social).

## Data protection

- [ ] Document the lawful basis + retention + access restriction for the **archived private repo** (it still holds employee headshots and the committer identity in history). Moving data to an archive is not erasure under GDPR.
