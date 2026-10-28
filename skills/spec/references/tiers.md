# Tiers

Not every feature needs enterprise documentation. A spec's tier sets how much is written: enough for the team to build and test the right thing, and no more. Too high a tier buries a small change in ceremony; too low a tier leaves a risky change without traceability.

## The four tiers

| Tier | Name | Files | Typical words | Requirements | Use it for |
|---|---|---|---|---|---|
| T1 | Issue | `manifest.json` + `spec.md` | 50–150 | 1–5 | Bug fixes, trivial features, single-concern changes |
| T2 | Spec | `manifest.json` + `spec.md` | 200–500 | 5–15 | Simple features with a clear scope, one user concern, no integrations, no security impact |
| T3 | Lite spec | `manifest.json` + `requirements/01-overview.md`, `02-requirements.md`, `03-acceptance.md` | 500–1,500 | 15–30 | Complex features across several components that need traceability and quality requirements |
| T4 | Standard spec | `manifest.json` + `requirements/01-overview.md`, `02-requirements.md`, `03-use-cases.md`, `04-acceptance.md`, `05-notes.md` | 1,000–3,000 | 30+ | Major features: architectural impact, external integrations, security-critical, several user roles, regulated |

Every tier gets a registry entry and lives at `specs/spec-t{tier}-{id:03d}-{slug}/`. Use cases (`03-use-cases.md`) and notes (`05-notes.md`) exist only in T4; a T3 spec without them is complete.

Optional component folders sit inside the spec folder: `architecture/`, `solution/`, `design/`, `ux/`, `testing/`. T4 creates them by default; T3 creates them when needed.

## Choosing a tier

| Question | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| How many requirements? | 1–5 | 5–15 | 15–30 | 30+ |
| External integrations? | No | No | Maybe | Yes |
| Security-critical? | No | No | Maybe | Yes |
| Several user roles? | No | No | No | Yes |
| Architectural impact? | No | No | Some | Yes |
| Needs traceability? | No | No | Yes | Yes |

Recommend a tier with its reason, and let the user overrule it. Move up when hidden complexity, external dependencies, security impact, several teams, or compliance appear; move down when the scope was overestimated or a similar spec can serve as a template. A payment integration is never T1; a search box with ten clear requirements does not need T4.

## Validation depth by tier

- **T1–T2:** the files exist, the format is valid, and every requirement can be tested.
- **T3:** completeness, requirement quality, acceptance coverage, and consistency (`review-checks.md`).
- **T4:** everything in T3, plus use-case quality and cross-references.
