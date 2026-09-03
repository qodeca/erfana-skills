<!-- Thanks for contributing to erfana! Please fill this in. -->

## What this changes

<!-- A short description of the change and why. Link the issue it closes, e.g. "Closes #123". -->

## Type of change

- [ ] Bug fix
- [ ] New feature (skill / command / agent)
- [ ] Documentation
- [ ] Infrastructure / gates / CI

## Checklist

- [ ] Branch is `feature/...` cut from `develop`, and this PR targets `develop` (not `main`).
- [ ] Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- [ ] `bash scripts/run-all-gates.sh` passes locally (`=== ALL GATES PASSED ===`).
- [ ] `claude plugin validate .` passes.
- [ ] No CJK characters; prose is sentence case with en dashes.
- [ ] Per-file licensing preserved (SPDX header on scripts, `.license` sidecar for new binaries); `reuse lint` passes.
- [ ] Docs / count claims updated if plugin shape changed (Gate 15).
- [ ] If you added, removed, or renamed a skill: **do not** regenerate `docs/skill-registry.md` in this PR. The registry records each skill's latest commit subject, and a squash-merge rewrites that subject - so a regen bundled with skill edits captures the pre-squash text and Gate 18 hard-fails the moment the PR lands. A maintainer runs `bash scripts/gen-skill-registry.sh` as a separate registry-only PR afterwards.
- [ ] Cross-host rules respected: no `timeout` key in `hooks/hooks.json`; a matcher naming a Claude-only tool also names its Qwen counterpart; agent and skill **prose** names the action, not the tool (Gate 14, Gate 2 - see [`CONTRIBUTING.md`](../CONTRIBUTING.md#cross-host-check)).
- [ ] Any claim about how the two hosts differ links to [`docs/hosts.md`](../docs/hosts.md) rather than restating it.
- [ ] If you touched `scripts/_lib/host_matrix.py`: `bash scripts/gen-hosts-table.sh` re-run and the generated table in `docs/hosts.md` committed (CI fails on a diff).
- [ ] I have signed the [CLA](https://github.com/qodeca/erfana-skills/blob/main/CLA.md) (once the CLA-assistant check is enabled, it will confirm).

## Notes for reviewers

<!-- Anything that needs special attention, screenshots, or context. -->
