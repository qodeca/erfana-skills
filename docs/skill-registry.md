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
| grill-me | 2026-08-22 | feat(skills)!: remove the six design skills and the design-shared bundle |
| managing-skills | 2026-08-22 | feat(skills)!: remove the six design skills and the design-shared bundle |
| using-erfana | 2026-08-22 | feat(skills)!: remove the six design skills and the design-shared bundle |
| managing-issues | 2026-08-14 | chore(release): v6.7.1 (#36) |
| managing-reports | 2026-07-22 | fix(managing-reports): lens-review remediation + v6.1.0 (#16) |
| fact-checking | 2026-06-14 | erfana v6.0.0 — open-source release (GPL-3.0-only) |
| managing-agents | 2026-06-14 | erfana v6.0.0 — open-source release (GPL-3.0-only) |
| managing-articles | 2026-06-14 | erfana v6.0.0 — open-source release (GPL-3.0-only) |
| managing-specs | 2026-06-14 | erfana v6.0.0 — open-source release (GPL-3.0-only) |

9 skills, one row per folder under `skills/`.

## Reading the dates

A cluster of skills sharing one old date usually means "not touched since the
last flattening event", not "created that day". The v6.0.0 open-source release
was a fresh-repo publish, so everything that predates it collapsed into that
single commit; the granular history for those skills lives in the archived
private repository.
