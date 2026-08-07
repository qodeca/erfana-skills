---
name: grill-me
description: Use when the user wants to stress-test a plan or design through relentless one-at-a-time questioning until shared understanding is reached, sized to the stakes of the plan.
when_to_use: |
  Trigger phrases: "grill me", "quick grill", "grill me lightly", "stress-test this plan", "stress test my design", "interview me about this", "get grilled on my design", "ask me hard questions", "challenge my plan", "challenge my design", "poke holes in this", "walk the decision tree".
allowed-tools: Read, Glob, Grep, AskUserQuestion
hooks:
  Stop:
    - hooks:
        - type: command
          command: bash "${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.sh" ../skills/grill-me/hooks/grill-guard
          timeout: 5
---

# erfana:grill-me

THE INTERVIEW ENDS ONLY WHEN THE COVERAGE MAP SAYS SO.

Interview the user about every aspect of the plan until the coverage map is closed. The map – not your sense of understanding – defines when the interview is done. Completion bias will tell you that you have enough context long before you do; the map exists because that feeling is unreliable. The map's *size* scales with the plan's stakes; the rule that only the map closes the interview does not.

## Opening protocol

1. Announce: "I'm grilling this plan. The interview ends when the coverage map is closed – every area done or skipped with a stated reason."
2. Get the full account first, unchallenged: "Tell me, uninterrupted, what we're working on and how it works end to end." Challenge nothing yet; log claims for later probing.
3. Explore the codebase (`Read`, `Glob`, `Grep`) before asking anything it can answer. Never ask the user what the code already states.
4. Size the plan (see Depth) from the account and the code.
5. Build the coverage map by sweeping all 16 dimensions in [references/question-stems.md](references/question-stems.md) – read it now. Dimensions 1, 2, 5, 9, 13, 14, and 16 run at every depth; at `short` they run in the compressed form recorded per dimension in question-stems.md. Every other dimension closes only as `[x]` or as a stated, reasoned skip. The waivability conditions in question-stems.md are binding; never state a skip whose condition does not hold (a company app is not "purely personal", a funded migration is not "trivial"). The map is seeded from the taxonomy, never only from the branches the user happened to mention – the branches the user did not mention are where interviews fail.
6. Print the sizing statement, then the initial map.

## Depth

Three depths: `short`, `standard`, `full`. You select the depth yourself, from the plan's observable properties. Never select it from how well you feel you understand the plan, and never ask the user to pick – there is no depth-selection question.

The four observable properties: blast radius (what the change touches), reversibility (what undoing it costs), cost of being wrong (rework, money, breakage), consumers (who depends on it).

| Depth | Selection criteria – all must hold |
|---|---|
| `short` | One component or one file set; revert is a single step with no cleanup; being wrong costs under a work session of rework; no consumers outside the immediate team; no money, legal, safety, or data-loss exposure. |
| `standard` | Several components or one shipped surface; reversible, but the revert carries migration or cleanup; being wrong costs days of rework; consumers are internal. |
| `full` | Any one of: a one-way door (data migration, deletion, public API or schema change, contract, pricing, a hire); consumers outside the team; money, legal, safety, or data-loss exposure; being wrong costs weeks or reputation; scope crosses teams or systems. |

A single `full` trigger sets the depth to `full` regardless of the other properties. Ambiguity resolves upward, never down. Depth is re-sized mid-interview when new information warrants it: an answer revealing a one-way door or an external consumer raises the depth in the next message and reopens the areas that depth covers.

### Sizing statement

The opening message states, in this order and without asking for approval:

1. the selected depth;
2. the four plan properties that put it there, each in a few words drawn from the account and the code;
3. the batched list of areas skipped at that depth – one line each, with its reason.

This is a declaration, not a question: it does not stop for approval. If the user replies "go deeper" or any equivalent, raise the depth in the next message and reopen the areas it covers. The user may reopen any skipped area at any point in the interview, without justification.

```
Depth: short. Blast radius: one config file in one service. Reversibility: single-commit revert, no data touched. Cost of wrong: one rebuild. Consumers: internal only.
Skipping: stakeholders (no external users), problem definition (greenfield tweak), evidence (low stakes), alternatives (trivial change), trade-offs (one dominant quality attribute), second-order (self-contained), environment (internal only), extremes (low stakes), perspective shifts (trivial plan).
```

At `standard` and `full`, skips are rarer and follow the same rule – batched, each with the waivability condition that holds. At `full`, expect no skips.

## Coverage map

One line, reprinted at the top of every message, using exactly these state marks – `[x]` done, `[~]` in progress, `[ ]` open, `[w]` waived:

```
Map: account[x] goals[~] stakeholders[ ] assumptions[ ] failure[ ] reversibility[ ] metrics[ ] meta[ ] second-order[w: no external consumers]
```

New information spawns new map areas. The map grows during the interview; it never silently shrinks. An area is `[x]` only when its open questions are answered and laddered – not when it has been mentioned. Every `[w]` carries its reason inline: either a skip stated in the sizing statement and not objected to, or a waiver the user granted outright. A `[w]` with no stated reason is a protocol violation, not a shortcut.

## Question loop

Repeat until the exit gate opens:

1. Print the map line.
2. Ask exactly one question per `AskUserQuestion` call. The tool accepts up to 4 questions; you will use exactly 1. A topic needing more exploration becomes the next call. Put your recommended answer first, labelled "(Recommended)".
3. Ladder every answer at least one rung before changing topic: why does that matter, what breaks if it is wrong, or what is the concrete example. One-and-done questions produce shallow interviews. At `short`, ladder the mandatory seven once; do not stack further rungs on a correctly sized short pass.
4. Log each locked decision in a running decisions ledger. An answer that contradicts a prior ledger entry gets re-questioned with the user's own earlier words.
5. Resolve dependencies in order – do not ask question N+1 before question N when N gates the branch.
6. End every message with the open marker (see Sentinel below) – except the final wrap-up.

User impatience ("are we done yet?", "this is enough") is a data point, not a waiver. Respond by showing the map and offering explicit waivers: "Still open: failure modes, metrics, meta. Waive any of these and I close them as [w]; otherwise next question." Only the user closes an area that the sizing statement kept open.

## Mandatory late rounds

After the map is mostly explored, always run – at `short` as one question each, at `standard` and `full` as full rounds:

- Premortem: "It's a year from now. This plan shipped and failed spectacularly – why?" Require at least 2 boring failure modes (missed handoff, quiet scope creep, key person left); exotic scenarios crowd out the ones that actually happen. At `short`, one boring failure mode is the floor.
- Reversibility: "Which of these locked decisions are one-way doors?" A yes at `short` re-sizes the interview upward.

## Exit gate

All five conditions hold at every depth. You may offer to end the interview ONLY when every one holds:

1. Every map area is `[x]`, or `[w]` with its reason stated.
2. Prediction test: for each ledger decision, privately predict the user's answer if you re-asked it. Any decision without one confident prediction becomes the next question instead of exiting.
3. You asked the meta check: "Is there anything else I should be asking you?" – and its answer produced no new area.
4. The exit offer is its own message containing nothing else: the map line, the depth you ran at, the read-back summary of the ledger, the list of waived areas each with its reason, one named area the interview likely under-explored (pick the genuinely weakest coverage, not the safest offer) with an offer to continue there, and the question "Does this read-back match your understanding?"
5. The user confirmed the read-back.

If you cannot check all five boxes, the interview is not done – resume questioning. Depth scales the map and the question count, never the exit gate. Violating the letter of these rules is violating the spirit.

## Rationalization table

Observed excuses from baseline testing of this skill – each one means STOP, you are rationalizing:

| Excuse | Reality |
|---|---|
| "Every branch of the decision tree is resolved" | You drew that tree from the user's framing. The map's 16 dimensions define the branches, not the user's first three sentences. |
| "The user is pressed for time – I won't drag this out" | Impatience is data, not a waiver. Offer per-area waivers; only the user closes an open area. |
| "This plan is small enough – implement directly" | Sizing down is not skipping. A small plan earns a `short` pass with its sizing stated, not zero interview: the mandatory seven run at every depth. |
| "This sweep is dragging – I'll call it `short`" | Depth follows the four observable properties, not how tedious the sweep feels. Tedium is not a plan property, and neither is your confidence. |
| "We now have shared understanding" | Understanding is a property of the map, not a feeling. Any area not `[x]` or `[w]` means it is not shared. |
| "These questions are related – I'll combine them" | Batched questions get shallow answers. Each answer must be able to change the next question. Batching *skips* in the sizing statement is required; batching *questions* is not. |
| "I'll skip the read-back / drop the marker early" | The read-back confirmation is the user's to give, not yours. |
| "This area doesn't apply – I'll drop it quietly" | Skips are stated, never silent. Name the area, name the waivability condition that holds, and record it as `[w: reason]`. |

Red flag – question counts under the depth's floor: `short` under 5, `standard` under 10, `full` under 16. The floor is an anti-rush signal, not an exit condition: reaching it never ends the interview, and falling under it means justifying each unfilled area against the map before offering the exit.

## Sentinel

While the interview is open, end every message with this exact marker on its own final line:

```
<!-- erfana:grill-open -->
```

The final wrap-up (after the user confirms the read-back) omits the marker – that is the entire close signal. A skill-scoped Stop hook blocks one stop attempt per turn that still carries the marker; it is a backstop, not the protocol. If the user aborts ("stop grilling"), acknowledge and drop the marker in that same message – an abort is always honored.

## Terminal state

When the exit gate has opened and the user confirmed the read-back: summarize the locked decisions as a numbered list and hand off to the relevant output skill (`erfana:managing-issues`, `erfana:managing-specs`, an `erfana:design-*` skill, or none) once the plan is fully specified.

THE INTERVIEW ENDS ONLY WHEN THE COVERAGE MAP SAYS SO.
