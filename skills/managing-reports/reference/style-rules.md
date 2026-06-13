# Style Rules Reference

Complete style rules for consulting reports. 47 automatable rules + 18 judgment-based rules.

---

## Part 1: Automatable Rules (47 Total)

### A. Voice and Grammar (12 rules)

#### A1-A8: Active Voice

| # | Rule | Violation pattern | Correction |
|---|------|-------------------|------------|
| A1 | No "was [verb]ed by" | "was completed by the team" | "the team completed" |
| A2 | No "has been [verb]ed" | "has been reviewed" | "reviewed" / "we reviewed" |
| A3 | No "will be [verb]ed" | "will be implemented" | "will implement" |
| A4 | No "is being [verb]ed" | "is being processed" | "processes" |
| A5 | No "were [verb]ed" | "errors were found" | "we found errors" |
| A6 | No "had been [verb]ed" | "had been approved" | "had approved" |
| A7 | No agent-less passive | "it was decided" | "[who] decided" |
| A8 | No passive hedging | "it was found that" | state finding directly |

**Threshold**: Active voice required in ≥90% of sentences.

#### A9-A12: Sentence Structure

| # | Rule | Threshold | Action |
|---|------|-----------|--------|
| A9 | Sentence length average | ≤20 words | Flag sections with avg >20 |
| A10 | Sentence length maximum | ≤40 words | Flag every sentence >40 |
| A11 | Paragraph length | ≤5 sentences | Flag paragraphs with >5 |
| A12 | One idea per paragraph | Single topic | Flag multi-topic paragraphs |

---

### B. Nominalization Elimination (12 rules)

| # | Nominalization | Replace with |
|---|----------------|--------------|
| B1 | utilization | use |
| B2 | implementation | implement |
| B3 | establishment | establish |
| B4 | facilitation | help, enable |
| B5 | optimization | optimize |
| B6 | prioritization | prioritize |
| B7 | finalization | finalize |
| B8 | visualization | visualize / show |
| B9 | standardization | standardize |
| B10 | normalization | normalize |
| B11 | operationalization | operate |
| B12 | monetization | monetize |

**Detection pattern**: Words ending in -ization, -isation, -tion, -ment, -ance, -ence preceded by "made a", "gave", "performed", "conducted".

---

### C. Plain Language (10 rules)

| # | Forbidden | Alternative |
|---|-----------|-------------|
| C1 | leverage | use |
| C2 | utilize | use |
| C3 | facilitate | help, enable |
| C4 | synergy | cooperation, collaboration |
| C5 | paradigm | model, pattern, approach |
| C6 | bandwidth | capacity, time |
| C7 | circle back | follow up |
| C8 | low-hanging fruit | easy wins, quick wins |
| C9 | stakeholder alignment | agreement |
| C10 | operationalize | implement, put into practice |

---

### D. Precision (8 rules)

| # | Vague term | Required replacement |
|---|------------|---------------------|
| D1 | "several" | Exact number (e.g., "8") |
| D2 | "many" | Exact number or percentage |
| D3 | "few" | Exact number |
| D4 | "significant" | Quantified impact (e.g., "USD 450,000") |
| D5 | "recently" | Specific date (e.g., "October 2025") |
| D6 | "soon" | Specific date (e.g., "by Q1 2026") |
| D7 | "regularly" | Frequency (e.g., "weekly") |
| D8 | "sometimes" | Frequency (e.g., "in 4 of 10 cases") |

---

### E. Redundancy Elimination (5 rules)

| # | Redundant phrase | Concise form |
|---|------------------|--------------|
| E1 | advance planning | planning |
| E2 | end result | result |
| E3 | final outcome | outcome |
| E4 | past experience | experience |
| E5 | future plans | plans |

Additional patterns to flag: "brief summary", "basic fundamentals", "completely eliminate", "combine together", "return back".

---

## Part 2: Judgment-Based Rules (18 Total)

These require human review and cannot be fully automated.

### F. Structure and Logic (6 rules)

| # | Rule | Assessment criteria |
|---|------|---------------------|
| F1 | Pyramid Principle | Does conclusion come first? Are supporting points logical? |
| F2 | SCQA completeness | Is Situation-Complication-Question-Answer present? |
| F3 | Five C's for findings | Does each finding have Criteria, Condition, Cause, Consequence, Corrective Action? |
| F4 | Logical flow | Do paragraphs connect logically? |
| F5 | Evidence sufficiency | Are claims adequately supported? |
| F6 | Scope alignment | Does content match stated scope? |

### G. Content Quality (6 rules)

| # | Rule | Assessment criteria |
|---|------|---------------------|
| G1 | Root cause accuracy | Is root cause analysis correct? |
| G2 | Recommendation feasibility | Are recommendations realistic? |
| G3 | Priority appropriateness | Is prioritization justified? |
| G4 | Risk assessment accuracy | Are risk levels appropriate? |
| G5 | Timeline reasonableness | Are timelines achievable? |
| G6 | Cost/benefit accuracy | Are estimates reasonable? |

### H. Tone and Audience (6 rules)

| # | Rule | Assessment criteria |
|---|------|---------------------|
| H1 | Diplomatic phrasing | Are findings stated without blame? |
| H2 | Constructive tone | Is criticism balanced with solutions? |
| H3 | Audience alignment | Is technical depth appropriate? |
| H4 | Cultural sensitivity | Are cultural considerations respected? |
| H5 | Professional formality | Is tone appropriately formal? |
| H6 | Strategic implications | Are business implications clear? |

---

## Scoring Guide

### Automatable Rules

| Category | Rules | Max points | Weight |
|----------|-------|------------|--------|
| Voice/Grammar | A1-A12 | 12 | x2 |
| Nominalization | B1-B12 | 12 | x1 |
| Plain Language | C1-C10 | 10 | x1 |
| Precision | D1-D8 | 8 | x2 |
| Redundancy | E1-E5 | 5 | x1 |

**Scoring**: Each violation = -1 point in category. Calculate percentage compliance.

### Judgment-Based Rules

| Category | Rules | Max points | Weight |
|----------|-------|------------|--------|
| Structure/Logic | F1-F6 | 30 | x2 |
| Content Quality | G1-G6 | 30 | x1 |
| Tone/Audience | H1-H6 | 30 | x1 |

**Scoring**: Rate each rule 0-5 (0=missing, 5=excellent).

---

## Quick Reference Card

### Always Flag

```
- Sentences over 40 words
- Paragraphs over 5 sentences
- "was/were/been" passive constructions
- Words ending in -ization/-isation
- Vague quantifiers (several, many, few, significant)
- Vague time references (recently, soon, regularly)
- Redundant phrases (advance planning, end result, etc.)
- Jargon (leverage, utilize, synergy, etc.)
```

### Always Verify

```
- Conclusion comes before supporting points
- Each finding has all Five C's
- Numbers are specific and sourced
- Dates are complete (DD Month YYYY)
- Recommendations have owner + timeline
- Passive voice is <10% of sentences
```
