# Gate 19 – reference sync (v9.3.0+)

**Type**: hard. **Runner order**: last, after Gate 18.

## What it enforces

[`docs/reference.md`](../reference.md) is a **generated** file: every skill, agent, slash command, and safety hook the plugin ships, read from the files themselves by [`scripts/gen-reference.sh`](../../scripts/gen-reference.sh). This gate regenerates the page and fails when the result differs from the committed file by a single byte.

| Source | Fields read |
|---|---|
| `skills/<name>/SKILL.md` frontmatter | `description`, `when_to_use` (quoted trigger phrases), `argument-hint`, `disable-model-invocation` |
| `agents/<name>.md` frontmatter | `name`, `description`, `tools`, `model`, `effort` |
| `commands/<name>.md` frontmatter | `description`, `argument-hint`, `disable-model-invocation` |
| `hooks/hooks.json` | event and matcher for each `dispatch.sh <hook>` command |
| `hooks/<name>.sh` | the `# Summary:` header line (first header sentence as a fallback) |

It also checks versions. Each user page – `README.md`, `docs/README.md`, `docs/tutorial.md`, `docs/how-to.md`, `docs/explanation.md`, and the generated `docs/reference.md` – must carry the line `This page describes erfana vX.Y.Z.`, and that line, plus every `Version: X.Y.Z`, `erfana (X.Y.Z)`, and `Release tag: vX.Y.Z` in the sample install output there and in [`docs/hosts.md`](../hosts.md), must show the version in `.claude-plugin/plugin.json`. A newcomer compares their screen with these lines, so an old number would send them looking for a release they do not need. A version bump therefore updates these lines in the same change, and regenerates the reference.

## Why a whole-file diff is safe here

Gate 18 cannot diff the skill registry, because that page carries git dates that go stale by construction. The reference carries no dates and reads no git history, so its output depends only on the working tree. A difference therefore always means one of two things: a skill, agent, command, or hook changed without the page being regenerated, or someone edited the page by hand. Both mislead a reader, so both block.

## Fix

```bash
bash scripts/gen-reference.sh
```

Commit the regenerated `docs/reference.md` in the same change as the file that caused the drift. Unlike the skill registry, this page has no squash caveat: its content does not depend on commit subjects.

## Run standalone

```bash
bash scripts/gate-19-reference.sh
```
