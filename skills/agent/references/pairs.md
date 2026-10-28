# Doer and reviewer pairs

A pair is two agents with complementary jobs: one produces an artifact (code, a design, a document), the other checks it. The split is worth having when the check benefits from fresh eyes – a reviewer that did not write the work judges it more honestly than the author reviewing itself.

## When a pair is right

- The artifact has a standard that can be checked, and mistakes are costly enough to justify a second pass.
- The reviewer's job is different enough from the doer's that one prompt would mix two mindsets.

Use a single agent when the "review" is a quick self-check the doer can run (tests, a schema), or when the user reviews the result anyway.

## What makes a pair work

- **Complementary scopes.** The doer's prompt excludes reviewing; the reviewer's prompt excludes producing or fixing. Each says which partner owns the other half.
- **A reviewer that cannot write.** Read-only tools for the reviewer, so a review never turns into an unrequested rewrite.
- **A blinded reviewer.** The reviewer gets the artifact and the standard it is judged against – not the doer's explanation of its choices, and not what the verdict will decide. A reviewer that reads the author's justification, or knows the stakes, judges less independently.
- **Evidence in every finding**: location and quoted text, so the doer (or the user) can act without re-deriving the problem.
- **Shared vocabulary.** Both agents use the same names for artifacts, severities, and frameworks.
- **Mutual references.** Each agent names its partner in its scope section, and the partner exists.
- **Distinct colors**, so the two are easy to tell apart in the interface.

## Creating a pair

Design both agents together, agree both designs with the user in one round, then write them. Review each against `agent-standard.md`, and check the pair-specific points above: complementary scopes, read-only reviewer, mutual references, shared vocabulary, distinct colors.

## Adding a reviewer to an existing doer

Review the existing doer first, so the new reviewer checks against what the doer really produces. Design the reviewer to match the doer's artifact and vocabulary, agree the design with the user, write it, and add the partner reference to the doer – which is an edit to an existing agent, so it follows the Modify rules (agreed change, backup first).
