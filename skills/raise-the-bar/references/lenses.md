# The three lenses

Each lens turns a request into a more ambitious one in a different direction. Run all three, keep the candidates that the workspace can support, and drop the rest with a one-line reason. A candidate is a concrete change to the request, never a general exhortation such as "be more ambitious".

Source: Felix Rieseberg, "How to be more ambitious: a tutorial for humans with models" (https://felixrieseberg.com/how-to-be-more-ambitious-a-tutorial-for-humans-with-models/). The summaries below are in our own words. Speed – the same work, done faster – is the fourth kind of ambition in that article and is left out here, because it needs no change to the request.

## Altitude – the outcome behind the task

Ask what the task is for, and what should be true after it. Then ask the same question once more.

- "Fix this crash" becomes "keep these apps free of crashes": find, reproduce, fix, and confirm each one.
- "Build the quarterly review deck" becomes "find the three most urgent decisions in this quarter's data and draft the case for and against each".
- A recurring task is a strong signal. So is a meeting: it usually exists to move a decision, and the decision is the outcome.

A raised outcome often needs a setup change rather than a longer request: making the raw material easy to fetch, linking versions to commits, or giving Claude an environment where it can reproduce and verify. Name those changes under "Setup needed" in the hand-off instead of hiding them in the request.

Where altitude does not fit: creative work, where the task is the outcome, and open-ended commands such as "go make money", which have no checkable end state. Leave altitude unchanged there and say why.

## Depth – how a top practitioner would do it

Ask what the best person in the field would do that the request does not ask for, and push the work down to its raw material.

- **Real instruments.** Use the tools the field uses – a database, a statistical model, a profiler, a test harness – not prose that only borrows the field's vocabulary.
- **Raw material first.** Start from logs, exports, tickets, or source data rather than someone's summary of them.
- **A hard goal, stated as reachable.** Ask for the hard target ("load in 200 ms", not "make it faster") and say it can be reached with persistence. Specific hard goals outperform "do your best". Pair it with a way out: if the target proves out of reach, stop and report what blocks it. A hard goal with no permitted exit invites the model to game the check instead.
- **Test one assumption.** Pick the belief the request takes for granted ("churn comes from onboarding") and have the data confirm or reject it before building on it.
- **New knowledge.** Where it fits, ask for something that did not exist before: a model built from the logs, an early signal found, then validated on data it was not built from.
- **An outside judge.** Something other than Claude decides whether the result is right: tests, a benchmark, held-out data, a tool Claude can run for immediate feedback, or a named human reviewer. Claude's own review of its work does not count.

Depth makes the request deeper, not bigger. Keep the deliverable the user asked for; change how it is produced and proved.

## Range – fields the task does not usually draw on

- **Turn the noun into a verb.** "A deck" is really "getting busy people to believe a cause-and-effect story and decide under uncertainty in 30 minutes". The verb shows which fields apply: storytelling, editing, decision analysis.
- **Assemble a crew.** List the specialists whose work the task needs – for a business review, an analyst, a journalist, and an editor, plus a red team such as a short seller and a forensic accountant who try to break the story.
- **Ask for the work, not the role.** Write "check the numbers the way a forensic accountant would: reconcile each figure to its source and flag any that do not tie out", not "you are a forensic accountant". Role-play changes the voice of the transcript without improving the result.
- **Unfamiliar tools.** A field's own software (a 3D tool, a notebook, a simulator) is part of range. Include it only if Claude can reach it in this workspace.

## Grounding test for every candidate

Keep a candidate only if all three hold:

1. Claude can reach the raw material and tools it needs here, or the hand-off names the setup change that would give it access.
2. It names its outside judge.
3. It keeps the user's deliverable and permissions. A candidate that needs an irreversible or outward-facing action (publishing, sending, deploying, spending) keeps that action as the user's decision.
