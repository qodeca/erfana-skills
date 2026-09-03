# Interview protocol – managing-skills requirements interrogation

Static, orchestrator-run loop. `grill-planner` returns the *data* (coverage map, seed requirements, question bank, budget); this file is the *protocol* the orchestrator follows with that data. It is deliberately fixed prose – the sentinel literal and closure rules must never depend on generated text.

The protocol starts after grill-planner returns `run_mode: "interview"` or `"confirmation"`. It never starts when the operation gate (see SKILL.md "Requirements interrogation") was answered "no", or in non-interactive mode.

## The loop

Repeat until the map is closed:

1. Print the coverage-map line at the top of the message: `Map: <area>[x|~| |w: reason] ...` – `[x]` closed, `[~]` in progress, `[ ]` open, `[w]` waived. The map may grow (new information spawns areas); it never silently shrinks.
2. Ask exactly one question per `AskUserQuestion` call, taken from the question bank, recommended option first. Dependency order: fundamentals before dependents.
3. Ladder each answer at least one rung before changing area – use the question's `ladder_stems` ("what breaks if that is wrong", the concrete example, the consequence).
4. Record each locked decision in a running ledger. An answer contradicting a ledger entry is re-asked quoting the user's earlier words verbatim.
5. Propose a waiver only for an area whose taxonomy `waiver_condition` actually holds, and only the user closes it. `validator_hard` areas are never waivable – `ms-requirements-validator` would bounce them as `missing`.

Budget is advisory; the map owns closure. Exceeding the budget requires naming the still-open required areas in the map line. If the question bank is exhausted while required areas remain open, re-engage grill-planner with `mode: "replan"` – never improvise unbanked questions and never close an area by rationalization.

`run_mode: "confirmation"` (complete request): the map arrives fully `seeded_closed`; ask only the 2–3 read-back questions in the bank. Never zero questions in an interactive session – "just do it" is a complete request, not a skip.

## Sentinel

While the interview is open, end every interview message with the open marker on its own final line:

```
<!-- erfana:ms-grill-open -->
```

From the wrap-up message onward – for the remainder of the operation – stop emitting the marker entirely; a quoted marker in the last lines of any later message would spuriously block a stop (the `ms-grill-guard` Stop hook end-anchors its check). The hook is a one-nudge backstop, not the protocol: it evaluates every stop, on any host, and only sentinel presence scopes it to the interview.

## Abort

"Stop", "skip this", "no more questions" – always honored, immediately. Acknowledge, drop the marker in that same message, report which required areas remain open, and STOP the operation. No downstream agent receives partial requirements without the user explicitly choosing "proceed anyway".

## Wrap-up and post-closure

Close the interview with a read-back: the map line, the ledger as a numbered list, waived areas with reasons, and the question "Does this match your intent?". On confirmation, merge `seed_requirements` with the answers by `maps_to` (append `coverage_map`, ledger, and waivers as extra audit fields – the validator ignores unknown keys) and hand the object to the operation's next step.

After wrap-up the interview is closed:

- Downstream `needs_user_input` questions (validator, matcher, modifier) are asked plainly – no map line, no marker.
- If `ms-requirements-validator` reports a missing required field, re-open once via grill-planner `mode: "replan"`: re-arm the marker, ask the delta questions, finish with a fresh wrap-up. Maximum one re-open; after that, follow the existing escalation path in `guides/qa-protocol.md`.
