# Pyramid Principle Reference

The Pyramid Principle (Barbara Minto, McKinsey) is the foundational structure for all consulting reports.

---

## Core Concept

**"Ideas in writing should always form a pyramid under a single thought."**

```
                    [Main Conclusion]
                          │
         ┌────────────────┼────────────────┐
         │                │                │
   [Key Point 1]    [Key Point 2]    [Key Point 3]
         │                │                │
    ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
[Support]  [Support] [Support] [Support] [Support] [Support]
```

**Golden rule**: "Think from the bottom up, present from the top down."

---

## SCQA Framework

Use SCQA to structure problem-solution sections:

| Element | Purpose | Content |
|---------|---------|---------|
| **S**ituation | Establish shared context | What the reader already knows; current state |
| **C**omplication | Introduce the problem | What changed; why action is needed |
| **Q**uestion | Frame the implied question | What the reader now wants to know |
| **A**nswer | Provide the solution | Your recommendation/conclusion |

### SCQA Example

```markdown
**Situation**: Acme Corp operates 13 fitness facilities with 50,000+ members
and relies on GymSoft as its member management system.

**Complication**: However, GymSoft does not integrate with HR Suite or Payroll Platform,
requiring staff to manually re-enter data across systems. This creates a 12%
data discrepancy rate and consumes 180 staff-hours monthly.

**Question**: How can Acme achieve unified operations and reduce manual data entry?

**Answer**: Implement API-based integration between GymSoft and HR Suite by
Q2 2026, which will eliminate manual entry and reduce discrepancies to <1%.
```

---

## Application to Report Sections

### Executive Summary Structure

```
1. Overall assessment (1-2 sentences) ← ANSWER FIRST
2. Key findings (3-5 bullets) ← SUPPORT
3. Key recommendations (3-5 bullets) ← SUPPORT
4. Expected outcomes/benefits ← IMPLICATIONS
```

### Section Structure

```
1. Section conclusion/key message ← ANSWER FIRST
2. Supporting point 1 + evidence
3. Supporting point 2 + evidence
4. Supporting point 3 + evidence
5. Transition to next section
```

### Finding Structure

```
1. Statement of finding ← ANSWER FIRST
2. Criteria (what should be)
3. Condition (what is)
4. Cause (why gap exists)
5. Consequence (impact)
6. Corrective action (recommendation)
```

---

## MECE Principle

Supporting points must be **Mutually Exclusive, Collectively Exhaustive**:

| Principle | Meaning | Test |
|-----------|---------|------|
| **Mutually Exclusive** | No overlap between points | Could any item fit in two buckets? |
| **Collectively Exhaustive** | No gaps in coverage | Is anything missing? |

### MECE Example

**Topic**: IT system issues

❌ **Not MECE** (overlapping):
- Integration problems
- Data synchronization issues
- System connectivity gaps

✅ **MECE**:
- Integration issues (system-to-system)
- Data quality issues (accuracy, completeness)
- Performance issues (speed, reliability)

---

## Grouping Strategies

### By Time (Chronological)

```
1. Phase 1: Foundation (Q1-Q2 2026)
2. Phase 2: Integration (Q3-Q4 2026)
3. Phase 3: Optimization (2027)
```

### By Structure (Organizational)

```
1. Executive leadership findings
2. IT department findings
3. Operations findings
4. Finance findings
```

### By Process

```
1. Input issues
2. Processing issues
3. Output issues
```

### By Priority (Importance)

```
1. Critical findings (immediate action)
2. High-priority findings (Q1 2026)
3. Medium-priority findings (Q2-Q3 2026)
```

---

## Validation Checklist

### For Executive Summary

- [ ] Overall conclusion stated in first 1-2 sentences
- [ ] Reader can understand main message without reading full report
- [ ] Key findings are MECE (no overlap, no gaps)
- [ ] Recommendations link directly to findings
- [ ] No new information in summary (all detailed in body)

### For Each Section

- [ ] Section starts with conclusion/key message
- [ ] Supporting points are numbered/bulleted
- [ ] Each supporting point has evidence
- [ ] Points are ordered logically (priority, time, or structure)
- [ ] Section ends with transition to next topic

### For Document Overall

- [ ] Document answers the implied question
- [ ] All sections support the main conclusion
- [ ] No section contradicts the main message
- [ ] Logical flow from problem to solution

---

## Anti-Patterns

| Anti-pattern | Problem | Correction |
|--------------|---------|------------|
| "Bottom-up" structure | Builds to conclusion at end | Flip: state conclusion first |
| "Mystery novel" approach | Reveals answer at end | Lead with the answer |
| Chronological narrative | "First we did X, then Y" | Group by theme, not sequence |
| Equal weighting | All points seem equally important | Prioritize: critical first |
| Missing "so what" | Data without interpretation | Add implications for each point |
