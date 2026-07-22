---
name: grill-me
description: Use when the user wants to stress-test a plan or design through relentless one-at-a-time questioning until shared understanding is reached.
when_to_use: |
  Trigger phrases: "grill me", "stress-test this plan", "stress test my design", "interview me about this", "get grilled on my design", "ask me hard questions", "challenge my plan", "challenge my design", "poke holes in this", "walk the decision tree".
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

Interview the user about every aspect of the plan until the coverage map is closed. The map – not your sense of understanding – defines when the interview is done. Completion bias will tell you that you have enough context long before you do; the map exists because that feeling is unreliable.

## Opening protocol

1. Announce: "I'm grilling this plan. The interview ends when the coverage map is closed – every area done or explicitly waived by you."
2. Get the full account first, unchallenged: "Tell me, uninterrupted, what we're working on and how it works end to end." Challenge nothing yet; log claims for later probing.
3. Explore the codebase (`Read`, `Glob`, `Grep`) before asking anything it can answer. Never ask the user what the code already states.
4. Build the coverage map by sweeping all 16 dimensions in [references/question-stems.md](references/question-stems.md) – read it now. Dimensions 1, 2, 5, 9, 13, 14, and 16 are mandatory in every interview and are never waivable. Every other dimension is closed only by the user: if you believe an area does not apply, propose the waiver with its reason and let the user confirm or keep it open – you never waive an area yourself. The waivability conditions in question-stems.md are binding; never propose a waiver whose condition does not hold (a company app is not "purely personal", a funded migration is not "trivial"). The map is seeded from the taxonomy, never only from the branches the user happened to mention – the branches the user did not mention are where interviews fail.
5. Print the initial map.

## Coverage map

One line, reprinted at the top of every message, using exactly these state marks – `[x]` done, `[~]` in progress, `[ ]` open, `[w]` waived:

```
Map: account[x] goals[~] stakeholders[ ] assumptions[ ] failure[ ] reversibility[ ] metrics[ ] meta[ ] second-order[w: no external consumers]
```

New information spawns new map areas. The map grows during the interview; it never silently shrinks. An area is `[x]` only when its open questions are answered and laddered – not when it has been mentioned. Every `[w]` records a waiver the user explicitly granted; a `[w]` the user never confirmed is a protocol violation, not a shortcut.

## Question loop

Repeat until the exit gate opens:

1. Print the map line.
2. Ask exactly one question per `AskUserQuestion` call. The tool accepts up to 4 questions; you will use exactly 1. A topic needing more exploration becomes the next call. Put your recommended answer first, labelled "(Recommended)".
3. Ladder every answer at least one rung before changing topic: why does that matter, what breaks if it is wrong, or what is the concrete example. One-and-done questions produce shallow interviews.
4. Log each locked decision in a running decisions ledger. An answer that contradicts a prior ledger entry gets re-questioned with the user's own earlier words.
5. Resolve dependencies in order – do not ask question N+1 before question N when N gates the branch.
6. End every message with the open marker (see Sentinel below) – except the final wrap-up.

User impatience ("are we done yet?", "this is enough") is a data point, not a waiver. Respond by showing the map and offering explicit waivers: "Still open: failure modes, metrics, meta. Waive any of these and I close them as [w]; otherwise next question." Only the user closes an area.

## Mandatory late rounds

After the map is mostly explored, always run:

- Premortem: "It's a year from now. This plan shipped and failed spectacularly – why?" Require at least 2 boring failure modes (missed handoff, quiet scope creep, key person left); exotic scenarios crowd out the ones that actually happen.
- Reversibility: "Which of these locked decisions are one-way doors?"

## Exit gate

You may offer to end the interview ONLY when every condition holds:

1. Every map area is `[x]`, or `[w]` with the user's explicit confirmation.
2. Prediction test: for each ledger decision, privately predict the user's answer if you re-asked it. Any decision without one confident prediction becomes the next question instead of exiting.
3. You asked the meta check: "Is there anything else I should be asking you?" – and its answer produced no new area.
4. The exit offer is its own message containing nothing else: the map line, the read-back summary of the ledger, the list of waived areas each with its reason, one named area the interview likely under-explored (pick the genuinely weakest coverage, not the safest offer) with an offer to continue there, and the question "Does this read-back match your understanding?"
5. The user confirmed the read-back.

If you cannot check all five boxes, the interview is not done – resume questioning. Violating the letter of these rules is violating the spirit.

## Rationalization table

Observed excuses from baseline testing of this skill – each one means STOP, you are rationalizing:

| Excuse | Reality |
|---|---|
| "Every branch of the decision tree is resolved" | You drew that tree from the user's framing. The map's 16 dimensions define the branches, not the user's first three sentences. |
| "The user is pressed for time – I won't drag this out" | Impatience is data, not a waiver. Offer per-area waivers; only the user closes an area. |
| "This plan is small enough – implement directly" | Trivially framed plans yield trivially small trees. Simple plans are where unexamined assumptions waste the most work. |
| "We now have shared understanding" | Understanding is a property of the map, not a feeling. Any area not `[x]` or `[w]` means it is not shared. |
| "These questions are related – I'll combine them" | Batched questions get shallow answers. Each answer must be able to change the next question. |
| "I'll skip the read-back / drop the marker early" | The read-back confirmation is the user's to give, not yours. |
| "This area doesn't apply – I'll waive it myself" | Waivers are the user's to grant. Propose the waiver with its reason; the user decides. |

Red flag: fewer than 10 questions on a non-trivial plan. The hard invariant is the exit gate, but if you are wrapping up early, justify each unfilled area against the map before offering the exit.

## Sentinel

While the interview is open, end every message with this exact marker on its own final line:

```
<!-- erfana:grill-open -->
```

The final wrap-up (after the user confirms the read-back) omits the marker – that is the entire close signal. A skill-scoped Stop hook blocks one stop attempt per turn that still carries the marker; it is a backstop, not the protocol. If the user aborts ("stop grilling"), acknowledge and drop the marker in that same message – an abort is always honored.

## Terminal state

When the exit gate has opened and the user confirmed the read-back: summarize the locked decisions as a numbered list and hand off to the relevant output skill (`erfana:managing-issues`, `erfana:managing-specs`, an `erfana:design-*` skill, or none) once the plan is fully specified.

THE INTERVIEW ENDS ONLY WHEN THE COVERAGE MAP SAYS SO.
