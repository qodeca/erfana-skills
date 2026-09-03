# OSS launch checklist (open items)

The open-source release was published on 2026-06-13 and shipped as v6.0.0: `qodeca/erfana-skills` is public with a single clean commit at its root, and the full private history was renamed to `qodeca/erfana-skills-archive` and kept private. The file-based prep (license, brand swap, scrub, community files, Gate 17, the version bump) landed on the `feature/oss-prep` branch, which merged at v6.0.0 and no longer exists.

**The publish, history-scan and visibility-flip sections have been removed** – they were executed once, were written as pending, and carried a repo-rename command that would now rename the live public repository. The reusable remainder of that procedure is the branch-protection recipe in [`publish-runbook.md`](publish-runbook.md). What follows is only what is still owed.

## After publishing (GitHub settings)

- [x] Enable **private vulnerability reporting** (Security tab) — `SECURITY.md` already points at it.
- [x] Enable **Dependabot alerts**, **secret scanning**, and **push protection** (free on public repos).
- [x] Add repo **description** + **topics** (`claude-code`, `claude-code-plugin`, `agents`, `design`, `automation`).
- [x] Enable **Discussions** (the issue-template `config.yml` already links to it).
- [ ] **Wire CLA-assistant** (GitHub App) to the repo and point it at `CLA.md`. `CLA.md` is counsel-reviewed and live; the agreement must be wired **before any external contribution is merged**.
- [ ] Harden Actions: require approval for **fork-PR workflows** (`GITHUB_TOKEN` is already read-only via `verify.yml` top-level `permissions: contents: read`). More urgent since v7.1.0: `qwen-compat` now installs a third-party CLI and runs it against the PR's own working tree, so a fork PR reaches more runner surface than it did at launch. The trigger is `pull_request`, not `pull_request_target`, and no secrets are exposed - but the exposure grew.
- [ ] Upload a **1280x640 social-preview image** — prepared at [`docs/assets/social-preview/erfana-social-preview.png`](assets/social-preview/erfana-social-preview.png) (source `card.html` alongside); upload via repo Settings → General → Social preview.
- [ ] Add **`good first issue`** and **`help wanted`** labels and tag a few starter issues.

## Discoverability (after publishing)

Self-hosting the `qodeca/erfana-skills` marketplace is the canonical install path and needs none of the below. These are optional reach.

- [ ] **Submit to Anthropic's community marketplace.** Use the web form at [clau.de/plugin-directory-submission](https://clau.de/plugin-directory-submission). On approval, the plugin is SHA-pinned into [`anthropics/claude-plugins-community`](https://github.com/anthropics/claude-plugins-community) and installable via `/plugin install erfana@claude-community`. Submission runs `claude plugin validate` + automated safety screening; passing the local gates is the gate. The official `claude-plugins-official` marketplace is curated at Anthropic's discretion with no application process — community is the route authors control.
- [ ] **PR into a community list** for extra reach, e.g. [ComposioHQ/awesome-claude-plugins](https://github.com/ComposioHQ/awesome-claude-plugins) (fork → add an entry → PR).
- [ ] **Confirm `claude plugin validate . --strict` is green** before either submission (CI already runs it on every push).

## Consumer continuity

- [ ] Existing internal users pinned to a `v5.x` version will break when old tags are gone. Either preserve a `v5.x` tag on the public commit, or notify pinned users to re-pin / clear `~/.claude/plugins/cache/`. Decide whether internal users migrate to the public repo or stay on the archive.

## Announce

- [ ] Announce the project outside the repo (release notes → Show HN / Reddit / social). The v6.0.0-rc.1 soak and the v6.0.0 tag are long done; only the announcement is outstanding.

## Data protection

- [ ] Update the repo **topics and description** on GitHub. Topics: drop `design` (the design skills were removed in v7.0.0) and consider adding `orchestration` and `qwen-code` (v7.1.0 made Qwen Code a supported host). The **description was corrected on 2026-09-03** and now names both hosts and drops "design". The completed checkbox above records the topics as set at launch; the live repo still carries `design`. GitHub settings actions, not file changes. The completed checkbox above records the topics as set at launch; the live repo still carries `design`. This is a GitHub settings action, not a file change.
- [ ] Document the lawful basis + retention + access restriction for the **archived private repo** `qodeca/erfana-skills-archive` (GitHub reports it at roughly 200 MB packed). Its history still holds employee headshots, the qodeca brandbook PDFs, and committer identities. **Moving data to an archive is not erasure under GDPR** – the obligation is live and unaffected by the public repo being clean.
