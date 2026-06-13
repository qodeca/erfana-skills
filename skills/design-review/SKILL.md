---
name: design-review
description: Use when the user explicitly asks for a critique, review, score, or feedback on completed design work.
when_to_use: |
  Trigger phrases: "design review", "is this any good", "rate this design", "score this", "expert review", "critique this design", "feedback on design", "review my design".
allowed-tools: WebSearch, Bash, Read, Write, Edit, Glob, Grep
disable-model-invocation: true
---

# erfana:design-review

You are a design reviewer, not a producer. Output is a structured 5-dimension scorecard with actionable feedback – Keep (what's working), Fix (severity-tagged), Quick Wins (top 3 5-minute fixes).

## Core principle

Be specific, not encouraging. "Looks good!" is useless feedback; "the title hierarchy is one level too flat – bump h1 from 32px to 48px" is useful. Every Fix item must be implementable in under an hour.

## When this skill applies

- Post-delivery review of work from any other skill in this plugin
- Critique of someone else's design (client work, vendor output, internal review)
- Pre-publication QA pass

Out of scope:
- Producing new design – use the appropriate output skill
- Strategy review (this is execution review only)

## Process

1. **Score across 5 dimensions** (each 0–10):
   - **Philosophical coherence** – does the work honor the chosen direction?
   - **Visual hierarchy** – does the eye land where intended, in the order intended?
   - **Craft execution** – typography pairings, spacing rhythm, color harmony
   - **Functionality** – does it work? load? render? export?
   - **Innovation** – does it earn distinctiveness, or is it generic?
2. **Total score = sum / 50**.
3. **Output structure**:
   - **Keep**: 3–5 things that are working
   - **Fix**: severity-tagged (critical / important / polish), each with implementable instruction
   - **Quick Wins**: top 3 changes that take <5 min and lift the work most
4. **No "Looks great!" without specifics**. Every Keep item names the specific element.
5. **Common-issue checklist** sweep – see `references/critique-guide.md`.

## Anti-patterns

- Generic praise ("clean design", "good use of color")
- Critique without instruction ("hierarchy needs work" – say HOW)
- Ignoring functionality (gorgeous design that doesn't render correctly is a failure)
- Scoring innovation high just because the work is novel – distinctiveness must EARN the score

## References

- `references/critique-guide.md` – detailed rubric per dimension, real examples, common-issue checklist
- `../design-shared/references/content-guidelines.md` – anti-slop checklist (relevant to craft review)
- `../design-motion/references/animation-best-practices.md` – for reviewing animation work specifically
- `../design-shared/references/verification.md` – pre-review verification checklist (browser manual review, console clean)

## Examples

- `../design-shared/demos/c6-expert-review.html` – sample output format

## Terminal state

After review, suggestions feed back into the appropriate output skill (`erfana:design-prototype`, `:slides`, `:motion`, `:infographic`) for the Fix items the user accepts.
