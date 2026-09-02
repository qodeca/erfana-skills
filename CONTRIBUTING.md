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

The gates enforce hard project invariants (valid manifests, no CJK characters, cross-references resolve, doc-claims match the filesystem, skill-registry sync, hook health, publication-readiness, and more). See [`docs/verification-gates.md`](docs/verification-gates.md).

### Cross-host check

erfana runs on two hosts – Claude Code, which loads it as a plugin, and Qwen Code, which converts the same repository at install time. There is no second package and no build step, so a change that is fine on one host can silently break the other. The rules that keep the two in step are enforced by gates, and [`docs/hosts.md`](docs/hosts.md) is the single source of truth for how the hosts differ – read it before touching hooks, agent frontmatter, or slash-command arguments.

```bash
bash scripts/run-all-gates.sh        # Gates 2, 14 and 15 carry the cross-host rules
bash scripts/qwen-smoke.sh           # only if you have the qwen CLI installed
```

The smoke test installs the working tree into a throwaway Qwen profile and checks that the conversion produced something usable. It is deliberately not part of `run-all-gates.sh` – that runner has to stay executable with only bash and Python – and it skips cleanly when `qwen` is not on your `PATH`, so it is optional locally. CI runs it with `--require`, which turns the skip into a failure.

### Name the action, not the tool

Agent and skill bodies must not contain Claude Code tool-call syntax – no `Grep(pattern="x", output_mode="content")`, no `Read(file_path="...")`, no `Bash(command="npm test")`. Those tool names do not exist on Qwen Code, whose equivalents are named differently and take different arguments, so a body written that way instructs the model to call something that is not there.

Write the intent in plain prose instead: "search the codebase for `use[A-Z]\w+`, listing only the matching file paths". Real shell commands stay verbatim – it is only the fake tool-call wrapper that goes. Frontmatter `tools:` lists are the opposite case: keep the Claude names there, because that is the actual grant and Qwen's converter remaps them.

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
- [ ] Cross-host rules respected: no `timeout` key in `hooks/hooks.json`, and a hook matcher naming a Claude-only tool also names its Qwen counterpart (Gate 14 enforces both).
- [ ] Agent and skill prose names the action, not the tool – no Claude tool-call syntax in a body, and Claude tool names left untouched in frontmatter `tools:`.
- [ ] Any claim about how the two hosts differ links to [`docs/hosts.md`](docs/hosts.md) instead of restating it, and `bash scripts/qwen-smoke.sh` was run if you have the `qwen` CLI.
- [ ] If you added, removed, or renamed a skill: `bash scripts/gen-skill-registry.sh` re-run and `docs/skill-registry.md` committed (Gate 18 hard-fails on a drifted skill list).
- [ ] Once the CLA-assistant check is enabled, it is green.

## Code of style

- Skills and agents are Markdown with YAML frontmatter on line 1 – never prepend a comment above the frontmatter.
- Do not introduce deprecated Anthropic API parameters (`temperature`, `top_p`, `top_k`, fixed `thinking.budget_tokens`).
- Keep changes single-concern; split skill-content, agent-content, and infrastructure changes into separate commits.

## Governance

Decision-making, release authority, and how to become a maintainer are described in [`GOVERNANCE.md`](GOVERNANCE.md).
