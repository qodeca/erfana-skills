# Verification guide

Detailed methodology for fact-checking markdown analysis documents against source materials.

## Contents

- [Claim types and examples](#claim-types-and-examples)
- [Severity classification](#severity-classification)
- [Source matching heuristics](#source-matching-heuristics)
- [Cross-project portability](#cross-project-portability)
- [Verification workflow summary](#verification-workflow-summary)

---

## Claim types and examples

### Factual claims

Specific facts about people, organizations, roles, or structures.

| Claim example | Verification approach |
|---------------|----------------------|
| "The team has 9 people" | Check headcount against org charts or interview transcripts |
| "Jane is the IT Director" | Verify name and title against source documents |
| "The department reports to the CFO" | Check reporting structure in org documentation |

### Numeric claims

Numbers, dates, costs, quantities, percentages.

| Claim example | Verification approach |
|---------------|----------------------|
| "~800,000 USD/year for cloud services" | Verify exact figure and currency in financial sources |
| "The contract was signed in 2023" | Check dates against contracts or meeting notes |
| "5 support staff plus 4 technical" | Verify breakdown adds up and matches source |

### Attributions

Statements attributed to specific people.

| Claim example | Verification approach |
|---------------|----------------------|
| "Finance Director stated that..." | Find exact quote in interview transcript |
| "According to the IT Manager..." | Verify the person said this, not someone else |
| "The vendor confirmed..." | Check vendor communication records |

### Process descriptions

Descriptions of workflows, procedures, or system behaviors.

| Claim example | Verification approach |
|---------------|----------------------|
| "Monthly close takes 5 days" | Verify against process documentation or interviews |
| "Approvals go through 3 levels" | Check approval workflow descriptions |
| "Data is synced nightly" | Verify sync schedule in technical documentation |

### Inferences

Analyst conclusions, synthesis, or interpretation. Identified by language like "this means", "therefore", "indicates", "creates a risk", "suggests".

| Claim example | Verification approach |
|---------------|----------------------|
| "This creates a bottleneck" | Flag as analyst inference – not directly verifiable |
| "The current setup is inefficient" | Check if any source supports this conclusion |
| "This indicates a lack of governance" | Flag as inference, note supporting evidence if any |

---

## Severity classification

> Casing note: the tables below show severities title-case (Critical/Error/Warning/Info) for readability. The `fc-verify-claims` agent emits them lowercase in JSON (`critical`/`error`/`warning`/`info`); the orchestrator title-cases on display. Same values, two representations.

### Standard rules

| Verdict | Claim type | Severity |
|---------|-----------|----------|
| Contradicted | Any | Critical |
| Ungrounded | factual-claim | Error |
| Ungrounded | numeric-claim | Error |
| Ungrounded | attribution | Error |
| Ungrounded | process-description | Error |
| Inference | inference | Warning (expected) |
| Verified | Any | None (no finding) |

### Edge cases

| Scenario | Severity | Rationale |
|----------|----------|-----------|
| Rounded numbers (800K vs 795K) when source uses exact figure | Info | Minor precision loss, not factual error |
| Rounded numbers (800K vs 750K) | Critical | Difference exceeds reasonable rounding |
| Paraphrased quote – meaning preserved | Info | Stylistic choice, not factual error |
| Paraphrased quote – meaning shifted | Warning | Imprecise attribution |
| Aggregated data from multiple sources | Warning | Mark as synthesis, note sources |
| Approximate dates ("~2024" vs "launched Jan 2024") | Info | Approximate language acknowledged |
| Approximate dates ("2024" vs "2023") | Critical | Wrong year is a factual error |
| Role title slightly different ("IT Director" vs "Director of IT") | Info | Same role, different phrasing |
| Role title wrong ("IT Director" vs "IT Manager") | Critical | Different seniority level |
| Implicit attribution ("the team expressed...") | Warning | Vague attribution, verify who said it |

---

## Source matching heuristics

### Match categories

| Category | Description | Example |
|----------|-------------|---------|
| **Exact match** | Claim text appears verbatim in source | "9 staff members" in both |
| **Semantic match** | Claim captures same fact in different words | "team of nine" vs "9 staff members" |
| **Partial support** | Source supports part of the claim | Source confirms headcount but not breakdown |
| **No support** | No source contains relevant information | Claim about a topic no source covers |
| **Contradiction** | Source states the opposite | "750K" in source vs "800K" in claim |

### Search strategy

1. **Keyword extraction**: Pull key terms from the claim (names, numbers, technical terms)
2. **Broad search first**: Grep across ALL provided source files, not just the obvious one
3. **Context window**: Read surrounding paragraphs when a match is found
4. **Cross-reference**: A claim might be supported by multiple sources – check all
5. **Negative search**: If no match found, try synonyms and related terms before declaring ungrounded

### Common pitfalls

- **Single-source bias**: Do not only search the most obviously related source file
- **Keyword mismatch**: Source may use different terminology for the same concept
- **Context loss**: A number in isolation may match but mean something different in context
- **Transcript formatting**: Interview transcripts may use informal language or abbreviations

---

## Cross-project portability

This skill adapts to any project structure:

- **Source discovery** reads the project's CLAUDE.md for structure hints
- **No hardcoded paths** – all paths discovered dynamically
- **INDEX.md files** are preferred starting points for understanding source layout
- **Directory conventions** (interviews/, vendors/, departments/) are heuristics, not requirements
- **Any markdown-based project** with source materials can use this skill

### Adaptation patterns

| Project type | Typical sources | Discovery hints |
|--------------|----------------|-----------------|
| Consulting project | Interviews, vendor docs, org charts | knowledge-base/, source-materials/ |
| Technical documentation | Code, API specs, architecture docs | docs/, specs/, src/ |
| Research project | Papers, data files, literature | references/, data/, papers/ |
| Audit project | Policies, evidence, logs | evidence/, policies/, findings/ |

---

## Verification workflow summary

```
1. DISCOVER sources (fc-discover-sources)
   - Read project structure
   - Identify source directories
   - User confirms selection

2. EXTRACT claims (fc-extract-claims)
   - Parse target document
   - Identify every verifiable statement
   - Classify by type

3. VERIFY claims (fc-verify-claims)
   - Search sources for evidence
   - Assign verdict per claim
   - Classify severity
   - Suggest fixes for issues

4. REVIEW with user (orchestrator)
   - Present by severity
   - Collect approval/dismissal

5. FIX approved issues (fc-apply-fixes)
   - Apply corrections
   - Add source citations
```
