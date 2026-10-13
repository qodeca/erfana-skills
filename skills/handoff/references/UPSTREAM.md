# Upstream source

This skill is adapted from the `handoff` skill in
[mattpocock/skills](https://github.com/mattpocock/skills), copyright (c) 2026
Matt Pocock, released under the MIT License. The upstream license text is kept
verbatim in [`LICENSE-upstream.txt`](LICENSE-upstream.txt); the repository's
`REUSE.toml` records which files are MIT and which also carry erfana's
GPL-3.0-only changes.

- Upstream commit: `0ab1b63a410a03d3627979a109c8695de27af954` (copied 2026-08-20)
- Imported into erfana: 2026-10-13

## File map

| File | Upstream path | Status |
| --- | --- | --- |
| `../SKILL.md` | `skills/productivity/handoff/SKILL.md` | Adapted (see below) |
| `handoff-guide.md` | `docs/productivity/handoff.md` | Verbatim – when to use it, FAQ, failure modes |
| `phase-boundaries.md` | `skills/engineering/ask-matt/PHASE-BOUNDARIES.md` | Verbatim – decision tree for continue / clear / handoff / subagent / compact |
| `claude-handoff-variant.md` | `skills/in-progress/claude-handoff/SKILL.md` | Verbatim – an upstream draft that launches a background agent instead of writing a file. Kept for reference only; erfana does not ship it as a skill |
| `LICENSE-upstream.txt` | `LICENSE` | Verbatim |

Not imported: `skills/productivity/handoff/agents/openai.yaml`. It holds
display metadata for OpenAI Codex (`display_name`, `allow_implicit_invocation`),
which neither host erfana supports reads; `disable-model-invocation: true` in
`SKILL.md` already expresses the "user-invoked only" policy.

## Changes in erfana

- Frontmatter: description rewritten in the third person, `when_to_use` added
  with activation phrases, per the plugin's skill conventions.
- "call the Skill tool for" became "load", because erfana skill bodies name
  actions rather than host-specific tool names.
- Added: report the written file's path to the user, and pointers to the two
  reference documents and to this provenance note.

## Updating

Re-clone upstream and diff `skills/productivity/handoff/` and
`docs/productivity/handoff.md` against the files here.
