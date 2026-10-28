# Condition patterns

Weak-to-strong examples for `draft-goal`. Commands and paths in these examples are illustrations; a real draft uses the commands found in the user's workspace.

## Weak to strong

**"Make my setup fully aligned with the latest best practices."**
Why it fails: no finish line, and it keeps every recommendation in scope, including ones the owner turns down.
Stronger: first agree the list, then goal over the list.

```text
Outcome: every recommendation in docs/review-2026-10.md is applied or recorded as declined. Done when: 1) each row in that file's table has status "applied" or "declined" – read the file and show the table; 2) bash scripts/validate.sh exits 0 after the last change – show the final line. Owner decisions: an item the owner declines, defers, or reserves in a message in this conversation counts as closed once Claude names it as declined; Claude does not apply a declined item and does not ask again. Not in scope: adding new recommendations; editing the validator; pushing. Bound: or stop once only owner decisions remain, or after 20 turns – either way reporting each open item and the decision it needs.
```

**"Fix the flaky tests."**
Why it fails: "flaky" has no count and one green run proves little.
Stronger:

```text
Outcome: the suite in tests/integration passes reliably. Done when: 1) npm run test:integration passes three runs in a row after the final change – show each summary line. Owner decisions: an item the owner declines, defers, or reserves in a message in this conversation counts as closed once Claude names it as declined; Claude does not apply a declined item and does not ask again. Not in scope: deleting, skipping, or retrying tests to hide failures; raising timeouts above 10 s; touching src/ outside files a failing test exercises. Bound: or stop once only owner decisions remain, or after 25 turns – either way reporting each still-flaky test and its suspected cause.
```

**"Keep going until the PR is ready."**
Why it fails: "ready" means a reviewer's approval, which the loop cannot produce.
Stronger: aim at the state Claude can show, and leave approval to people.

```text
Outcome: PR #123 has no unanswered review threads and green CI. Done when: 1) the review-thread query shows zero unresolved threads – show the count; 2) the CI summary for the head commit shows every required check passing – show it. Owner decisions: an item the owner declines, defers, or reserves in a message in this conversation counts as closed once Claude names it as declined; Claude does not apply a declined item and does not ask again. Not in scope: force-pushing; resolving a thread without a reply; requesting or merging reviews. Bound: or stop once only owner decisions remain, or after 30 turns – either way listing threads that need a maintainer decision.
```

**"Ship the release."**
Why it fails: publishing is irreversible and is the owner's call.
Stronger: goal over the pre-release state; publishing stays with the user.

```text
Outcome: release v2.4.0 is ready to publish. Done when: 1) CHANGELOG.md has a v2.4.0 entry – show it; 2) npm run release:dry-run exits 0 – show the final line. Owner decisions: an item the owner declines, defers, or reserves in a message in this conversation counts as closed once Claude names it as declined; Claude does not apply a declined item and does not ask again. Not in scope: tagging, publishing, or pushing. Bound: or stop once only owner decisions remain, or after 15 turns – either way reporting what blocks the dry run.
```

## Shapes for special cases

- **Audit or exploration.** Agree the scenarios first. The condition requires a report that covers each agreed scenario with its evidence and, for each confirmed defect, reproduction steps. "No defects found" is a valid result; do not require a minimum number of findings, which would push Claude to invent one.
- **Many small items.** Put the items in a checklist file and make the goal "every row is ticked or marked declined", with a final validator run. The evaluator can read one table more reliably than recall twenty separate claims.
- **Work that needs the owner mid-way.** Make the bound's report the hand-off: "stop after N turns, or as soon as only owner decisions remain, listing them." The second clause lets the evaluator see the goal as met when nothing is left for Claude to do.
- **Tightening an existing goal.** Keep the user's outcome and explicit checks; add the missing proof, exclusions, owner clause, and bound. Show what changed in one line.
