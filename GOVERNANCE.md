# Governance

erfana is an open-source project (GPL-3.0-only) backed and maintained by **Qodeca sp. z o.o.**

## Model

The project currently follows a **single-maintainer, company-backed** model. The maintainer sets technical direction, reviews and merges contributions, and authorises releases. Qodeca provides continuity (repository ownership, trademark stewardship, and break-glass administrative access).

- **Primary maintainer:** Marcin Obel ([@marcinobel](https://github.com/marcinobel)).
- **Repository administration:** Qodeca GitHub organisation owners.

This is a deliberately lightweight model appropriate to the project's size. It is expected to evolve toward a small maintainer team as the contributor base grows.

## How decisions are made

- **Routine changes** (bug fixes, docs, small features) are decided by maintainer review on the pull request.
- **Significant changes** (new skills, breaking changes, schema migrations, anything that changes trigger phrases or plugin shape) should start as a GitHub issue for discussion before implementation.
- **Disagreements** are resolved by the maintainer, who will explain the reasoning. The aim is rough consensus, with the maintainer as the final decision-maker.

## Releases

Release authority, the pre-release checklist, signing, and the bus-factor / succession procedure are documented in [`MAINTAINER.md`](MAINTAINER.md). Releases use semantic versioning and [Keep a Changelog](https://keepachangelog.com/); behaviour-changing releases go through a staged (`-rc.N`) rollout.

## Becoming a maintainer

Contributors who show sustained, high-quality involvement (reviewed PRs, issue triage, helping others) may be invited to become maintainers. There is no fixed quota; the bar is trust and demonstrated judgement. Onboarding steps (signing keys, review rights) are in [`MAINTAINER.md`](MAINTAINER.md).

## Code of conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). Enforcement is handled by the maintainer via the confidential channel described there.

## Trademarks

Open-sourcing the code does not open the project's name or logo — see [`TRADEMARKS.md`](TRADEMARKS.md).
