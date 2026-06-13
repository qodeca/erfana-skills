# Sentence Case Rules

> **CRITICAL**: This is the highest-priority validation rule. All headings, labels, and captions MUST use sentence case.

## Definition

**Sentence case**: Capitalize only the first word and proper nouns.
**Title Case**: Capitalize All Major Words Like This.

## Why Sentence Case?

1. **Readability**: Easier to scan and read quickly
2. **European standard**: EU institutions mandate sentence case
3. **Consistency**: Eliminates ambiguity about which words to capitalize
4. **Translation-friendly**: Reduces errors when translating
5. **Modern practice**: APA, Google, Microsoft style guides prefer sentence case

---

## Rules by Element Type

### Headings (H1-H4)

| Level | Rule | Example |
|-------|------|---------|
| H1 | Sentence case (document title exception: Title Case permitted on cover only) | "Executive summary" |
| H2 | Sentence case always | "Key findings and recommendations" |
| H3 | Sentence case always | "Integration gap analysis" |
| H4 | Sentence case always | "GymSoft-HR Suite connection" |

### Lists

| Element | Rule | Example |
|---------|------|---------|
| Bullet items | Sentence case | "Implement API integration by Q2" |
| Numbered items | Sentence case | "1. Review current architecture" |
| Nested items | Sentence case | "- Secondary consideration" |

### Tables

| Element | Rule | Example |
|---------|------|---------|
| Column headers | Sentence case | "Risk level", "Recommended action" |
| Row headers | Sentence case | "Current state", "Target state" |
| Cell content | Normal prose rules | Follow sentence structure |

### Figures and Captions

| Element | Rule | Example |
|---------|------|---------|
| Figure captions | Sentence case | "Figure 3: System dependency map" |
| Table captions | Sentence case | "Table 2: Risk assessment summary" |
| Chart titles | Sentence case | "Member growth by quarter" |

---

## Proper Noun Exceptions

**Always capitalize** (even in sentence case):

| Category | Examples |
|----------|----------|
| Company names | Acme Corp, GymSoft, HR Suite |
| Product names | Microsoft Excel, Payroll Platform |
| Geographic names | Capital City, Northland, Port City |
| Personal names | Maria Santos, John Carter |
| Acronyms | IT, API, ERP, CRM, GDPR, KPI |
| Official titles (when naming specific person) | "IT Director Maria Santos" |
| Regulatory/legal references | National Vision 2030, GDPR |
| Trademarked terms | Follow official branding |

---

## Title Case Exceptions (When Permitted)

Title Case is permitted ONLY for:

1. **Document title on cover page**: "Digital Ecosystem Audit Report"
2. **Proper nouns within headings**: "GymSoft integration issues"
3. **Official document names when cited**: "National Vision 2030"
4. **Trademarked product names**: "Microsoft Power BI"

---

## Common Violations

| ❌ Incorrect | ✅ Correct | Rule violated |
|-------------|-----------|---------------|
| "Executive Summary" | "Executive summary" | Generic heading |
| "Key Findings And Recommendations" | "Key findings and recommendations" | Conjunctions |
| "Risk Assessment Matrix" | "Risk assessment matrix" | Generic terms |
| "The IT Department" | "The IT department" | Generic reference |
| "System Performance Metrics" | "System performance metrics" | Multi-word heading |
| "Analysis Of Current State" | "Analysis of current state" | Prepositions |
| "Best Practices For Integration" | "Best practices for integration" | Prepositions |

---

## Edge Cases

### When to Capitalize "IT"

| Context | Capitalization | Example |
|---------|----------------|---------|
| Acronym for Information Technology | Always caps | "IT infrastructure" |
| Generic "it" pronoun | Lowercase | "Verify it works" |

### Department Names

| Context | Capitalization | Example |
|---------|----------------|---------|
| Generic reference | Lowercase | "the finance department" |
| Official name | Title Case | "Finance Department" (if official name) |
| In heading | Sentence case | "Finance department assessment" |

### System Names

| Context | Capitalization | Example |
|---------|----------------|---------|
| Branded product | Match branding | "GymSoft", "HR Suite" |
| Generic system type | Lowercase | "the ERP system", "the CRM" |
| In heading | Product caps only | "GymSoft integration issues" |

---

## Validation Checklist

For EVERY text element, verify:

- [ ] First word is capitalized
- [ ] Subsequent words are lowercase (except proper nouns)
- [ ] Acronyms remain in ALL CAPS
- [ ] Product names match official branding
- [ ] No "Title Case" on generic terms
- [ ] Prepositions and conjunctions are lowercase
- [ ] Articles (a, an, the) are lowercase (unless first word)

---

## Automated Detection Patterns

### Violation Indicators

```
Pattern: [A-Z][a-z]+ [A-Z][a-z]+
Meaning: Two consecutive capitalized words (potential Title Case)
Action: Flag for review unless second word is proper noun

Pattern: \b(And|Or|The|A|An|In|On|At|To|For|Of|With)\b (mid-sentence, capitalized)
Meaning: Capitalized article/preposition/conjunction
Action: Flag as violation (unless start of heading)
```

### Words That Should Be Lowercase (Unless First Word)

```
Articles: a, an, the
Conjunctions: and, but, or, nor, for, yet, so
Prepositions: in, on, at, to, for, of, with, by, from, into, onto, upon
```
