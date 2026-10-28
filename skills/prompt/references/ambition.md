# Ambition pass

An optional step between the opening sequence and the branches. Most prompts ask for less than current models can do; this pass checks the goal in three directions and offers a raised version as ordinary interview decisions. It never adds scope on its own: every raise is a decision the user accepts or declines.

Source: Felix Rieseberg, "How to be more ambitious: a tutorial for humans with models" (https://felixrieseberg.com/how-to-be-more-ambitious-a-tutorial-for-humans-with-models/), summarised in our own words.

## When to offer it

Offer it once the goal is concrete, as one question: "Check the goal for a more ambitious version" (recommended for task prompts with a measurable outcome) or "Keep the goal as stated". Skip the offer, and record why in the ledger, for creative writing where the task is the outcome, for extraction or classification prompts with a fixed schema, and for revisions whose job is to fix a known failure.

## The three checks

- **Altitude.** What is the outcome behind the task? "Summarise this incident" may really be "find the cause and the change that stops it recurring". A raised outcome often needs setup outside the prompt – access to the raw data, an environment to reproduce in – which goes into the setup notes, not the prompt text.
- **Depth.** What would the best practitioner do that the prompt does not ask for? Real instruments instead of prose (a database or statistical test, not a markdown table), raw material instead of summaries, a hard target stated as reachable, one assumption tested against data, and an outside judge.
- **Range.** Which other fields apply? Rewrite the deliverable as a verb ("a deck" → "get busy people to decide under uncertainty in 30 minutes") and list the specialist work it needs, including a red team that tries to break the result.

Each check yields at most one candidate. Ask it as its own question, with the raise and "keep as asked" as the options. A candidate the target destination cannot support – no data access, no tools, no way to check – is dropped with its reason rather than offered.

## How accepted raises enter the prompt

- The raised outcome replaces the original in `<task>`; the original deliverable stays required unless the user replaced it.
- Hard targets go into `<requirements>` with their reason and a line saying they are reachable with persistence, paired with the exit: if the target proves out of reach, stop and report what blocks it and how close the work got. A hard target with no permitted exit invites gaming the check.
- The outside judge goes into the completion checks: a command and its expected result, held-out data, a benchmark, or a named reviewer. The model's own review of its work is not an outside judge.
- Specialist work is written as tasks ("reconcile every figure to its source"), never as a role ("you are a forensic accountant") – role framing changes the voice of the output without improving it.
- The prompt asks for deeper work, not more work: scope and permissions stay as confirmed in the brief.
