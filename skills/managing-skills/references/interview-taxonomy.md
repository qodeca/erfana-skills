# Interview taxonomy – managing-skills operations

Consumed by the `grill-planner` shared agent via its `taxonomy_path` input. The agent reads this file, selects the section matching the requested `operation`, and builds the coverage map, seed requirements, and question bank from the rows. The orchestrator never parses this file – it runs the interview from the data grill-planner returns, following `references/interview-protocol.md`.

A sibling skill adopting the interrogation pattern ships its own taxonomy file (and its own sentinel + protocol copy); this file is managing-skills-owned and lists only the four managing-skills operations.

## Row schema

| Column | Meaning |
|---|---|
| Dimension | Coverage-map area name |
| maps_to | Key in the merged requirements object |
| Class | `validator_hard` / `default` / `optional` (below) |
| Source | `asked` (interview question) or `seeded` (resolved from request/repo, confirmed at read-back) |
| Waiver condition | When a waiver may be *proposed* – the user always decides |

Requirement classes:

- **validator_hard** – never waivable. `ms-requirements-validator` returns these keys in `missing` and bounces the operation; a waiver here would be a lie.
- **default** – asked unless fully seeded; closes only by answer + ladder or an explicit user waiver under the stated condition.
- **optional** – included when the request makes it relevant; freely waivable.

Question budget (advisory – the map owns closure): simple 3–5, medium 6–9, complex 10–15. Complexity follows the `ms-requirements-validator` bands: simple = 2–3 steps / 1–2 agents, medium = 4–6 / 2–4, complex = 7+ / 5+.

## Operation: create

Merged output feeds `ms-requirements-validator` (`operation: "create"`). The four `validator_hard` rows are exactly the validator's required CREATE keys.

| Dimension | maps_to | Class | Source | Waiver condition |
|---|---|---|---|---|
| problem-definition | `problem_definition` | validator_hard | asked | – |
| trigger-strategy | `trigger_strategy` | validator_hard | asked | – |
| complexity | `complexity_preference` | validator_hard | asked | – |
| tools | `tools` | validator_hard | asked | – |
| non-goals | `non_goals` | default | asked | Trivially scoped single-purpose skill |
| failure-modes | `failure_modes` | default | asked | Explicit user waiver only |

Question stems:

- problem-definition: "What task should this skill automate – and what is it explicitly *not* for?" / "What does the manual flow look like today, step by step?"
- trigger-strategy: "Explicit slash command, auto-detection, or both?" / "What is the cost when auto-detection fires on the wrong request?"
- complexity: "Single focused pass, or multi-step with validation and error recovery?" / "What breaks if the simple version turns out too small?"
- tools: "What is the least-privilege tool set the workflow genuinely needs?" / "Does anything require Bash or Write, or is read-only enough?"
- non-goals: "Which adjacent tasks are deliberately excluded?" / "What request should this skill refuse or route elsewhere?"
- failure-modes: "Months from now this skill misfires in daily use – what went wrong?" (require at least one *boring* failure mode, not an exotic one)

## Operation: modify

No validator call – the coverage map is the completeness gate. Merged output goes to `ms-modifier` as its change context.

| Dimension | maps_to | Class | Source | Waiver condition |
|---|---|---|---|---|
| target | `skill_path` | default | seeded | – (ambiguous glob → `needs_user_input`) |
| intent | `intent` | default | asked | Explicit user waiver only – intent capture is why this gate exists |
| change-description | `change_description` | default | asked | Fully stated in the request |
| change-type | `change_type` | default | asked | Named in the request (bug-fix / enhancement / refactor) |
| scope | `scope` | optional | asked | Request names the exact files or sections |
| risk | `risk` | optional | asked | Pure addition with no behavior change |

Question stems:

- intent: "What prompted this change – what were you doing when the gap appeared?" / "What outcome makes this modification worth it?"
- change-description: "Describe the change end to end – what is different after it lands?"
- change-type: "Is this fixing wrong behavior, adding capability, or restructuring without behavior change?"
- scope: "Which parts of the skill may this touch – and which must stay untouched?"
- risk: "What existing usage could this regress, and how would we notice?"

## Operation: review

No validator call – the map is the gate. `usage_feedback` feeds `ms-reviewer`'s existing parameter; `review_depth` feeds its mode selection.

| Dimension | maps_to | Class | Source | Waiver condition |
|---|---|---|---|---|
| target | `skill_path` | default | seeded | – (ambiguous glob → `needs_user_input`) |
| depth | `review_depth` | default | asked | Named in the request (quick / standard / deep) |
| friction | `usage_feedback` | default | asked | User states they have not used the skill |
| purpose | `purpose` | optional | asked | Gate answer already states it |
| focus-areas | `focus_areas` | optional | asked | Full-sweep review requested |

Question stems:

- depth: "Quick health check, standard checklist pass, or deep audit?" / "What decision does this review feed?"
- friction: "Where did the skill fight you in real sessions – wrong step order, missing step, unclear output?"
- focus-areas: "Any section or behavior to weight over the rest?"

## Operation: modernize

No validator call – the map is the gate. Merged output feeds `ms-reviewer` deep mode as `modernization_intent` (Modernize Step 1).

| Dimension | maps_to | Class | Source | Waiver condition |
|---|---|---|---|---|
| target | `skill_path` | default | seeded | – (ambiguous glob → `needs_user_input`) |
| intent | `intent` | default | asked | Gate answer already states it |
| scope | `scope` | default | asked | Whole-skill refresh explicitly confirmed |
| exclusions | `exclusions` | optional | asked | "Apply everything" stated |
| risk-tolerance | `risk_tolerance` | optional | asked | Default accepted: P0 findings auto-apply |

Question stems:

- intent: "What prompted the refresh – model change, observed drift, failed validation?"
- scope: "Whole skill, or named patterns/sections only?"
- exclusions: "Any pattern or file the modernization must leave alone?"
- risk-tolerance: "Comfortable with critical (P0) findings auto-applying, or should every change be previewed?"
