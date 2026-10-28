# Interview protocol – skill requirements

How the skill interviews the user before it creates, changes, reviews, or modernizes a skill. The interview runs in the main conversation, because only the main conversation can ask the user anything. The sentinel and closure rules below are fixed prose on purpose: the `ms-grill-guard` Stop hook depends on them, so they must never come from generated text.

## When it runs

- **Create** always interviews.
- **Modify** and **Modernize** first ask one gate question: "Do you have particular ideas or reasons behind this change?" Yes → interview. No → proceed with what the request says.
- **Review** first asks: "Any session observations, friction points, or particular ideas to focus this review?" Any yes (a friction point alone counts) → interview. The friction answer reaches the reviewer either way.
- **Headless runs** (no user to answer – the question tool is missing or denied, as in `claude -p`): do not interview and never print the open marker. Say which areas below are still open and stop that part.

A complete request ("create a read-only skill that…, triggered by…, for…") still gets a short read-back of two or three questions, never zero: "just do it" is a complete request, not a skip.

## What to cover

Build a coverage map from the areas for the operation. Mark an area closed when the request already answers it, and confirm it at the read-back.

| Operation | Required areas | Optional areas |
|---|---|---|
| Create | purpose (what the skill achieves, and what it is not for), triggers (slash command, auto-detection, or both, and the cost of a false trigger), what it may change (the least-privilege tool set; whether anything needs Bash or Write), shape (one focused pass or several operations), failure modes (how it will misfire in daily use – at least one boring one) | non-goals, where it lives (project, user, or a plugin) |
| Modify | target, intent (what prompted the change), the change end to end | change type (fix, addition, restructure), scope (what must stay untouched), risk (what could regress and how we would notice) |
| Review | target, depth (quick check or full review), friction (where the skill fought the user in real sessions) | purpose, focus areas |
| Modernize | target, intent (model change, observed drift, failed check), scope (whole skill or named parts) | exclusions, risk tolerance (preview every change, or apply the high-severity fixes directly) |

Required areas are never waived. An optional area may be waived only by the user.

## The loop

Repeat until the map is closed:

1. Print the coverage-map line at the top of the message: `Map: <area>[x|~| |w: reason] ...` – `[x]` closed, `[~]` in progress, `[ ]` open, `[w]` waived. The map may grow when new information opens an area; it never silently shrinks.
2. Ask exactly one question per message, through the question tool so the user answers in a picker and the turn waits for them; if the tool is missing or denied, treat the run as headless and drop the marker. Put the recommended option first, fundamentals before the decisions that depend on them. Questions that rest on the user's judgment (goals, priorities, trade-offs) ask for the user's view first and give the recommendation afterwards.
3. Follow each answer one step further before changing area – what breaks if it is wrong, a concrete example, the consequence.
4. Record each decision in a running ledger. An answer that contradicts an earlier one is asked again, quoting the user's earlier words.

The map owns closure; there is no fixed question count. Never close an area by assuming its answer.

## Sentinel

While the interview is open, end every interview message with the open marker on its own final line:

```
<!-- erfana:ms-grill-open -->
```

From the wrap-up message onward – for the remainder of the operation – stop emitting the marker entirely; a quoted marker in the last lines of any later message would spuriously block a stop (the `ms-grill-guard` Stop hook end-anchors its check). The hook is a one-nudge backstop, not the protocol: it evaluates every stop, on any host, and only sentinel presence scopes it to the interview.

## Abort

"Stop", "skip this", "no more questions" – always honored, immediately. Acknowledge, drop the marker in that same message, report which required areas remain open, and stop the operation. Nothing is written from partial requirements unless the user explicitly chooses "proceed anyway".

## Wrap-up and after

Close the interview with a read-back: the map line, the ledger as a numbered list, waived areas with reasons, and the question "Does this match your intent?". On confirmation the interview is closed and the operation continues with the agreed requirements.

After wrap-up, later questions are asked plainly – no map line, no marker. If a gap appears later (the design needs a decision nobody made), re-open once: re-arm the marker, ask only the missing questions, and finish with a fresh wrap-up.
