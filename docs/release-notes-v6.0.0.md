# erfana v6.0.0

The first public release. **erfana** is an open-source Claude Code plugin — a design and orchestration toolkit: 15 skills, 87 shared agents, 5 slash commands, and 4 safety hooks, licensed **GPL-3.0-only**.

## Install

Inside Claude Code:

```
/plugin marketplace add qodeca/erfana-skills
/plugin install erfana@erfana-skills
```

Then type a trigger phrase — e.g. *"design a slide deck"* activates `erfana:design-slides`. See the [README](https://github.com/qodeca/erfana-skills/blob/main/README.md) for the full skill catalog and usage.

## What's in it

- **Design (6 skills):** `design-direction`, `design-prototype`, `design-slides`, `design-motion`, `design-infographic`, `design-review`.
- **Orchestration (6 skills):** `managing-agents`, `managing-articles`, `managing-issues`, `managing-reports`, `managing-skills`, `managing-specs` — backed by 87 shared agents.
- **Process + verification:** `grill-me` (plan stress-testing), `fact-checking`, and the `using-erfana` router.
- **5 slash commands:** `doc-update`, `project-status`, `session-status`, `lens-review`, `explain-issue`.
- **4 safety hooks:** bash-safety, secret-detection, post-compaction reminders, and completion verification.

## Highlights of this release

- **Open source under GPL-3.0-only.** Verbatim GPLv3 text, [REUSE](https://reuse.software)-compliant per-file licensing, and a full set of community and governance files (`CONTRIBUTING`, `CODE_OF_CONDUCT`, `GOVERNANCE`, `SECURITY`, `TRADEMARKS`).
- **Neutral default brand.** The design skills ship with a neutral, logo-only `erfana` house brand (Inter + JetBrains Mono) so they work out of the box — bring your own brand assets to customize.
- **Hardened for distribution.** Manifests conform to the documented Claude Code marketplace schema and are CI-validated with `claude plugin validate --strict`; a 17-gate verification suite guards every change.

## Notes

- **Auto-update is opt-in** for third-party marketplaces like this one. Pull updates with `/plugin update erfana@erfana-skills`, or enable auto-update per-marketplace in `/plugin`.
- **Bring-your-own-brand:** no photo / shape / template libraries ship by default; the design skills consume whatever brand assets you supply.

Full detail: [CHANGELOG](https://github.com/qodeca/erfana-skills/blob/main/CHANGELOG.md#600---2026-06-13). License: [GPL-3.0-only](https://github.com/qodeca/erfana-skills/blob/main/LICENSE).
