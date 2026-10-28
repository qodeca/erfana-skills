# Review checks

The six checks a report must pass before delivery. This file, `sentence-case-rules.md`, and `style-rules.md` are the single source of truth for the house standard; the checker agents read them at run time, and nothing else restates the thresholds.

## Contents

- [How findings are reported](#how-findings-are-reported)
- [1. Sentence case](#1-sentence-case)
- [2. Style](#2-style)
- [3. Formatting](#3-formatting)
- [4. Precision](#4-precision)
- [5. Structure](#5-structure)
- [6. Executive summary](#6-executive-summary)

## How findings are reported

Every finding names the check and rule, the line number, the exact text quoted from the report, and the correction. List every instance – an editor fixes from the list, so a summary such as "several headings" leaves work undone. A check is PASS only when it has no findings; when the report gives a check nothing to judge (no findings section, no tables), the check is "not applicable" with the reason, never PASS by default.

## 1. Sentence case

Rules, proper-noun exceptions, and edge cases: [sentence-case-rules.md](sentence-case-rules.md). Applies to every heading level, list item, table header, and caption.

## 2. Style

Rules A–E in [style-rules.md](style-rules.md): active voice in at least 90% of sentences; average sentence length at most 20 words per section; no sentence over 40 words; no nominalizations, jargon, vague quantifiers or time words, or redundant phrases from its lists. Rules F–H in that file are judgment calls for the author and the user, not pass/fail checks.

## 3. Formatting

- **Headings.** One H1, for the document title. No skipped levels (H2 straight to H4). No heading without content below it.
- **No stacked headings.** At least one line of text between a heading and the next heading.
- **Lists.** Three to seven items, in parallel grammatical form, with consistent end punctuation.
- **Tables.** A header row; referenced in the text before they appear; no empty cells (use "–" or "N/A").
- **Paragraphs.** At most five sentences.
- **Figures and tables.** A caption, referenced in the text before they appear.

## 4. Precision

- **Dates** in DD Month YYYY form: "15 November 2026", not "11/15/2026", "15/11/2026", "November 15, 2026", or "2026-11-15".
- **Numbers.** One to nine in words, 10 and above in digits; a number that starts a sentence in words; measurements, percentages, and currency always in digits ("5 GB", "45%", "USD 50,000").
- **Percentages** use the % symbol, carry a decimal only when it matters, say what they are a share of, and add up when they describe parts of a whole.
- **Abbreviations** are spelled out on first use with the abbreviation in parentheses, then used alone. Common ones need no definition: IT, API, ERP, CRM, HR, CEO, CFO, COO, PDF, URL, SQL, JSON, XML, USD, EUR, GBP.
- **Cross-references** point to sections, figures, and tables that exist, with the right numbers.
- **Data consistency.** A metric repeated in the report has the same value everywhere; totals match their parts.

## 5. Structure

Background: [pyramid-principle.md](pyramid-principle.md) and [five-cs-framework.md](five-cs-framework.md).

- **Pyramid.** The executive summary opens with the conclusion; key findings come before supporting detail; recommendations come before methodology.
- **Section lead.** Each major section opens with its key message, not with background.
- **SCQA.** Problem-solving sections establish situation, complication, the implied question, and the answer.
- **Five C's.** Every finding has criteria, condition, cause, consequence, and corrective action.
- **MECE.** Findings and recommendations do not overlap and leave no obvious gap.
- **Linkage.** Every finding has a recommendation, and every recommendation traces to a finding. A recommendation names an owner, a date, and the expected benefit.

## 6. Executive summary

- **Bottom line first.** The first one or two sentences state the overall conclusion. Openings such as "This report presents…", "The purpose of this audit was…", "We conducted…", or "Over the past six weeks…" fail.
- **Length.** 300–500 words, at most 10% of the report, four to seven paragraphs.
- **Contents.** Overall assessment, three to five key findings, three to five key recommendations, expected outcomes, and next steps.
- **Stands alone.** A reader who stops here knows the problem, the answer, the business impact in numbers, and what happens next.
- **Tone.** Confident rather than hedged ("will improve", not "might improve"), objective rather than promotional, specific rather than vague.
