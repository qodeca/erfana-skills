# Question-stem library – 16 interrogation dimensions

Read this once at interview start, when building the coverage map. Each dimension lists: when it is mandatory, battle-tested question stems (verbatim where the source is battle-tested – rephrasing loses nuance, per Shostack's explicit warning), and the cognitive bias the dimension counters (UK MOD red-teaming pattern: naming the bias justifies and depersonalizes the question).

Dimensions 1, 2, 5, 9, 13, 14, and 16 are mandatory for every interview. The rest are waivable only by an explicit user waiver or a written justification in the coverage map ("waived: no external dependencies"), never silently.

## Contents

1. [Account first](#1-account-first)
2. [Goals and worth](#2-goals-and-worth)
3. [Stakeholders and customer](#3-stakeholders-and-customer)
4. [Problem definition (IS / IS NOT)](#4-problem-definition-is--is-not)
5. [Assumptions](#5-assumptions)
6. [Evidence and gaps](#6-evidence-and-gaps)
7. [Alternatives](#7-alternatives)
8. [Values and trade-offs](#8-values-and-trade-offs)
9. [Failure modes](#9-failure-modes)
10. [Second-order consequences](#10-second-order-consequences)
11. [External environment](#11-external-environment)
12. [Extremes and unlikelies](#12-extremes-and-unlikelies)
13. [Reversibility and commitment](#13-reversibility-and-commitment)
14. [Success metrics and verification](#14-success-metrics-and-verification)
15. [Perspective shifts](#15-perspective-shifts)
16. [Meta check](#16-meta-check)

## 1. Account first

Mandatory, always the opening move. Counters: anchoring on the interviewer's assumptions instead of the user's actual plan.

Get the full uninterrupted account before challenging anything (PEACE model; Shostack Q1 "What are we working on?"). Stems:

- "Tell me, uninterrupted, what we're working on and how it works end to end."
- "Explain what happens, step by step, from the user's first touch to the finished outcome."
- "Describe the current state before this plan, and the state after it succeeds."

Challenge nothing during the account. Contradictions noticed here go to the decisions ledger for later probing with the user's own words (the elenctic move).

## 2. Goals and worth

Mandatory. Counters: solution-first bias (building before knowing why).

Gause and Weinberg context-free questions, verbatim:

- "What is the real reason for wanting to solve this problem?"
- "What is a highly successful solution really worth to this client?"
- "How much time do we have for this project? What is your trade-off between time and value?"

Google design-doc practice adds the negative space:

- "What is explicitly a non-goal?"

## 3. Stakeholders and customer

Waivable only for purely personal projects. Counters: false-consensus bias (assuming the answerer speaks for everyone).

Amazon Working Backwards customer questions, verbatim:

- "Who is your customer?"
- "How do you know what your customer needs or wants?"
- "What will customers be most disappointed in?"
- "Who is the single threaded leader?"

Gause and Weinberg metaquestion, verbatim:

- "Are you the right person to answer these questions? Are your answers official?"

## 4. Problem definition (IS / IS NOT)

Mandatory when the plan responds to a problem; waivable for greenfield feature work. Counters: premature closure on the first plausible framing.

Kepner-Tregoe problem analysis – specify each dimension with an IS and an IS NOT column:

- "What is the problem – and what is it *not*?"
- "Where does it occur – and where does it *not* occur?"
- "When did it start – and when is it absent?"
- "What changed?"

The IS NOT column is the distinctive move: the negative space is where wrong framings die.

## 5. Assumptions

Mandatory. Counters: unexamined-assumption risk; optimism bias.

Hunt hedge words in the user's answers: "typically", "generally", "experience has shown", "should", "probably". Each one marks an implicit assumption. Then per assumption, UK MOD assumptions check, verbatim:

- "How valid is this assumption?"
- "What is the impact if it is invalid?"

Paul-Elder assumption stems:

- "What are you assuming here?"
- "What could we assume instead?"
- "How can you verify or disprove that assumption?"

## 6. Evidence and gaps

Waivable for low-stakes plans. Counters: confirmation bias.

UK MOD structured self-critique, verbatim headings:

- "What information is available to use as diagnostic evidence; how relevant or robust is this evidence; is there any anomalous information?"
- "What gaps in the information are there; how big or critical are these gaps?"

Paul-Elder evidence stems:

- "How do you know?"
- "What evidence supports that – and what would count as evidence against it?"

Annie Duke's probability discipline:

- "What odds would you put on that, and why?"

## 7. Alternatives

Mandatory for any plan that commits meaningful time or money; waivable for trivial changes. Counters: false-dichotomy framing; sunk-cost momentum.

- "What options did you consider and reject – and why did each lose?"
- "Can we copy something that already exists?" (Gause and Weinberg, verbatim)
- Include the three always-available alternatives: buy, copy, do nothing. "What happens if we do nothing?"

## 8. Values and trade-offs

Waivable when the plan has one dominant quality attribute. Counters: wishful "we'll have it all" planning.

Decision Quality (SDG) and ATAM:

- "Which of these qualities wins when two conflict – show me the tradeoff point."
- "Name your top three quality attributes, in priority order."
- "What will you give up to get this?"

## 9. Failure modes

Mandatory – this is the premortem round, run late in the interview, after the map is mostly explored. Counters: optimism bias, planning fallacy, plan-continuation bias.

Klein's premortem framing – assert failure as fact, never ask "what might go wrong":

- "It's a year from now. This plan shipped and failed spectacularly. Write down every reason why."
- Require at least 2 *boring* failure modes (missed handoff, quiet scope creep, key person left) – exotic scenarios crowd out the mundane ones that actually happen.

Inversion (Munger): "What would guarantee this fails?"

FMEA per component, with the chronically forgotten fourth question:

- "How does this part break? What is the effect? What causes it? Would we even notice before it hits users?" (detection)

## 10. Second-order consequences

Waivable for self-contained changes. Counters: single-loop thinking.

Gause and Weinberg product question, verbatim:

- "What problems could this product create?"

ADR consequences discipline:

- "Name a negative consequence you knowingly accept."

## 11. External environment

Waivable for internal-only changes. Counters: inside view / planning in a vacuum.

Gause and Weinberg, verbatim: "What environment is this product likely to encounter?"

UK MOD outside-in sweep – walk the PESTLE headings (political, economic, social, technological, legal, environmental) against the plan and ask about any that bite.

## 12. Extremes and unlikelies

Waivable for low-stakes plans. Counters: groupthink; probability neglect.

UK MOD high-impact low-probability analysis:

- "Take the main factor driving this plan. What does its expected development look like? Now the extreme negative? The extreme positive? What does each do to the plan?"

Tenth-man doctrine – argue the consensus's opposite as a duty, not a conviction:

- "Everyone agrees this is right. My job now is to argue it is wrong. Here is the strongest case against it – answer it."

## 13. Reversibility and commitment

Mandatory. Counters: one-way-door blindness.

Amazon, verbatim:

- "Are we stepping through any 'one-way doors'?"

NASA review-gate pattern:

- "What evidence says you're ready for the next irreversible step?"

Decision Quality commitment element:

- "Who is committed to executing this, with what resources?"

## 14. Success metrics and verification

Mandatory. Counters: unfalsifiable success ("we'll know it when we see it").

Shostack Q4, verbatim: "Did we do a good job?" – unpacked as "Were we effective? Were we efficient? Would you do it again?"

ATAM scenario discipline:

- "What does done-well look like, measurably?"
- "Give me one testable scenario per top quality attribute: stimulus, environment, measurable response."

## 15. Perspective shifts

Waivable for trivial plans. Counters: egocentric framing.

Cognitive interview mnemonics adapted:

- "Walk the plan backwards from launch day to today." (reverse order)
- "Describe this plan as your harshest competitor would. As the on-call engineer at 3 a.m. As your most disappointed customer." (change perspective)

Annie Duke's backcasting pairs with the premortem:

- "It's a year from now and this succeeded beyond expectations – what happened to get us here?"

## 16. Meta check

Mandatory, always the closing move before the read-back. Counters: interviewer tunnel vision – and doubles as the termination check.

Gause and Weinberg metaquestions, verbatim:

- "Is there anything else I should be asking you?"
- "Is there anyone else who can give me useful answers?"
- "Do my questions seem relevant?"

Negative answers to metaquestions "invariably reveal major misconceptions" (Gause and Weinberg) – treat any hesitation here as a new coverage-map area, not as permission to stop.
