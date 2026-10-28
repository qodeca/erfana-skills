# Writing requirements

What makes a spec worth building from. The reviewer checks these; the main conversation applies them while drafting.

## Requirements

- **Specific and testable.** "The dashboard loads within 2 seconds for 95% of requests", not "the dashboard is fast". Vague words – fast, quickly, user-friendly, flexible, robust, secure, "etc.", "and so on" – are defects unless a measurable target follows.
- **One requirement per ID.** "Create, edit, and delete tasks and assign them" is four requirements.
- **What, not how.** A requirement states the need ("stores the reset token so it can be used once"), not the implementation ("uses Redis SETEX"), unless the technology is itself a constraint the user stated.
- **Language.** "Shall" or "must" for mandatory, "should" for desired; priority uses MoSCoW (Must, Should, Could, Won't). A "should" on a Must-priority requirement is a contradiction to resolve.
- **Every NFR has a category, a metric, and a way to measure it.** A metric of `TBD` is an open question, not a requirement.
- **Error paths count.** Validation failures, network failures, missing data, and permission errors are requirements too.
- **Naming contracts.** When a feature defines API methods, IPC channels, types, stores, or schema fields that code must match, T3 and T4 specs list them in a naming-contracts table in `02-requirements.md`.

## Acceptance criteria

- Every FR has at least one acceptance criterion, and every criterion names the requirement it tests by a real ID.
- Use Given/When/Then or concrete steps, and cover the edge and error cases, not only the happy path.
- A Definition of Done closes the acceptance file.

## Use cases (T4)

Each has an actor, preconditions, a numbered main flow, alternate and exception flows, postconditions, and the FRs it traces to.

## Consistency

- No two requirements contradict each other (a 15-minute expiry in one, 24 hours in another).
- Nothing in the requirements falls outside the overview's scope, and nothing in scope is missing.
- IDs are unique, and the manifest's statistics and index match the files.

## Common mistakes

- Solution thinking: "a React app with PostgreSQL" instead of "100 concurrent users with live updates".
- Scope creep: new ideas go to a "Future enhancements" note and are prioritized against the current scope.
- Requirements nobody can trace to a goal: every requirement should answer "why do we need this?".
