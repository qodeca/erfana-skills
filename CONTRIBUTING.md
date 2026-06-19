# Contributing to erfana

Thanks for your interest in contributing. erfana is a Claude Code plugin maintained by Qodeca sp. z o.o. and licensed under **GPL-3.0-only**. This guide covers how to propose changes.

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Licensing of contributions

- **Inbound = outbound.** Contributions are accepted under the project's license, **GPL-3.0-only**. You retain copyright in your contribution.
- **Contributor License Agreement (CLA).** Because the maintainer keeps the option to offer the project under additional terms (dual-licensing), contributions also require agreeing to the project CLA – see [`CLA.md`](CLA.md). The CLA is final; until a CLA-assistant check is wired, opening a pull request is your agreement to it (your Git author identity is your signature of record). Once the assistant is enabled, each pull request will prompt you to sign once, and PRs will require a signed CLA before merge.

## Before you start

- For anything non-trivial, **open an issue first** to discuss the approach – it avoids wasted work.
- If any issues are labelled `good first issue` or `help wanted`, those are good entry points.
- Security issues do **not** go through public issues or PRs – see [`SECURITY.md`](SECURITY.md).

## Development setup

This is a documentation- and shell/JS-heavy plugin; there is no build step.

```bash
git clone https://github.com/qodeca/erfana-skills
cd erfana-skills
git checkout develop          # the integration branch – branch off this, not main
git checkout -b feature/my-change
```

`main` is the stable branch the plugin marketplace serves; `develop` is the integration branch. Cut your `feature/...` branch from `develop` and open your PR against `develop`.

Before opening a PR, the full verification suite must pass:

```bash
bash scripts/run-all-gates.sh        # expect: === ALL GATES PASSED ===
claude plugin validate .             # expect: Validation passed
```

The gates enforce hard project invariants (valid manifests, no CJK characters, brand-manifest integrity, cross-references resolve, doc-claims match the filesystem, hook health, publication-readiness, and more). See [`docs/verification-gates.md`](docs/verification-gates.md).

### Secret scanning

CI runs two secret scanners (the `secret-scan` job in `verify.yml`) on every push and PR, and the build fails if either finds a secret: **gitleaks** over the full git history, and **trufflehog** failing on any *verified* secret. Run them locally before pushing:

```bash
gitleaks detect --source . --log-opts="--all" --redact -v
trufflehog git "file://$PWD" --results=verified,unknown --no-update
```

If a scanner flags a known false positive, add a narrow allowlist (gitleaks: an `[allowlist]` entry in a `.gitleaks.toml` with `[extend] useDefault = true`; trufflehog: a path in an `--exclude-paths` file) rather than disabling the scan. Never commit a real secret, even to history – rewrite it out and rotate the credential.

## Pull-request checklist

- [ ] Work is on a `feature/...` branch cut from `develop`, and the PR targets `develop` (not `main`).
- [ ] Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`).
- [ ] `bash scripts/run-all-gates.sh` passes locally.
- [ ] No secrets introduced – `gitleaks` and `trufflehog` are clean locally (CI's `secret-scan` job enforces both).
- [ ] Prose uses **sentence case**, en dashes (not em dashes), and contains **no CJK characters** (a hard gate).
- [ ] Per-file licensing is preserved: scripts carry an SPDX license header (`GPL-3.0-only`); new binary assets are covered by the `REUSE.toml` catch-all (add a `.license` sidecar only to *override* it, e.g. a CC0 or third-party asset – see [REUSE](https://reuse.software)). `reuse lint` should pass.
- [ ] Docs and counts updated if you changed plugin shape (Gate 15 enforces count claims).
- [ ] Once the CLA-assistant check is enabled, it is green.

## Code of style

- Skills and agents are Markdown with YAML frontmatter on line 1 – never prepend a comment above the frontmatter.
- Do not introduce deprecated Anthropic API parameters (`temperature`, `top_p`, `top_k`, fixed `thinking.budget_tokens`).
- Keep changes single-concern; split brand-bundle, skill, and infrastructure changes into separate commits.

## Governance

Decision-making, release authority, and how to become a maintainer are described in [`GOVERNANCE.md`](GOVERNANCE.md).
