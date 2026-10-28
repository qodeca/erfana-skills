# Skill registry

<!-- GENERATED FILE - DO NOT EDIT BY HAND. -->
<!-- Regenerate with: bash scripts/gen-skill-registry.sh -->

Every skill this plugin ships, and when it was last changed. Generated from
git history by [`scripts/gen-skill-registry.sh`](../scripts/gen-skill-registry.sh)
and checked by Gate 18, which hard-fails if this list stops matching
`ls skills/` or a row carries a value git cannot account for.

**Last updated** is the date of the most recent commit touching
`skills/<name>/`, and **Last change** is that commit's subject.

> Dates lag between releases – the commit that changes a skill is the same
> commit that dates its row, so a refresh is always one step behind. Gate 18
> warns rather than blocks on that, and the release process regenerates this
> file, so it is accurate as of every shipped version.

| Skill | Last updated | Last change |
|---|---|---|
| agent | 2026-10-28 | feat(agent)!: rebuild the agent skill as a brief |
| article | 2026-10-28 | refactor!: rename the orchestration skills and rebuild report as a br... |
| draft-goal | 2026-10-28 | feat(skills): add raise-the-bar and ambition patterns for Claude 5.5 ... |
| grill-me | 2026-10-28 | refactor!: rename the orchestration skills and rebuild report as a br... |
| issue | 2026-10-28 | refactor!: rename the orchestration skills and rebuild report as a br... |
| prompt | 2026-10-28 | feat(skills): add raise-the-bar and ambition patterns for Claude 5.5 ... |
| raise-the-bar | 2026-10-28 | feat(skills): add raise-the-bar and ambition patterns for Claude 5.5 ... |
| report | 2026-10-28 | refactor!: rename the orchestration skills and rebuild report as a br... |
| skill | 2026-10-28 | refactor!: rename the orchestration skills and rebuild report as a br... |
| spec | 2026-10-28 | refactor!: rename the orchestration skills and rebuild report as a br... |
| using-erfana | 2026-10-28 | docs: sync agent counts and references after the agent skill rebuild |
| handoff | 2026-10-13 | feat(skills): add prompt, ship, and handoff skills (#47) |
| ship | 2026-10-13 | feat(skills): add prompt, ship, and handoff skills (#47) |
| fact-checking | 2026-06-14 | erfana v6.0.0 — open-source release (GPL-3.0-only) |

14 skills, one row per folder under `skills/`.

## Reading the dates

A cluster of skills sharing one old date usually means "not touched since the
last flattening event", not "created that day". The v6.0.0 open-source release
was a fresh-repo publish, so everything that predates it collapsed into that
single commit; the granular history for those skills lives in the archived
private repository.
