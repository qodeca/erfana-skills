# Five C's Framework Reference

The Five C's (the five-attributes approach to audit findings) is the required
structure for all findings here. It supports IIA Standards 2410 and 2420 on
communicating results – it is a writing convention, not itself a named Standard.

---

## The Five C's

| # | Element | Question answered | Content |
|---|---------|-------------------|---------|
| 1 | **Criteria** | What should be? | Standard, policy, benchmark, best practice |
| 2 | **Condition** | What is? | Observed circumstances, evidence, data |
| 3 | **Cause** | Why does the gap exist? | Root cause analysis |
| 4 | **Consequence** | What is the impact? | Financial, operational, reputational risk |
| 5 | **Corrective Action** | What should be done? | Specific recommendation |

---

## Detailed Element Guidance

### 1. Criteria

**Purpose**: Establish the benchmark against which performance is measured.

**Sources**:
- Industry standards (ISO, COBIT, ITIL)
- Regulatory requirements (GDPR, local regulations)
- Company policies and procedures
- Contractual obligations
- Best practices

**Example**:
> "Industry best practice (COBIT 2019) requires automated data synchronization
> between enterprise systems with reconciliation occurring within 24 hours."

### 2. Condition

**Purpose**: Describe what was actually observed.

**Requirements**:
- Specific and factual
- Quantified where possible
- Based on evidence gathered
- Objective (no interpretation)

**Example**:
> "Member data is manually entered into three separate systems (GymSoft,
> HR Suite, Payroll Platform). Analysis of 200 records showed 24 (12%) contained
> discrepancies between systems."

### 3. Cause

**Purpose**: Identify the root cause of the gap.

**Root Cause Analysis Techniques**:
- 5 Whys
- Fishbone diagram (Ishikawa)
- Fault tree analysis

**Common Cause Categories**:
- Process gaps (no documented procedure)
- System limitations (technical constraints)
- Resource constraints (staffing, budget)
- Training gaps (skills deficit)
- Governance gaps (unclear ownership)

**Example**:
> "The root cause is the absence of API integration between GymSoft and
> HR Suite. Legacy system architecture and vendor limitations have prevented
> automated data exchange."

### 4. Consequence

**Purpose**: Quantify the impact on the organization.

**Impact Types**:
| Type | Examples |
|------|----------|
| Financial | Cost of rework, revenue loss, penalties |
| Operational | Efficiency loss, delays, errors |
| Compliance | Regulatory risk, audit findings |
| Reputational | Customer dissatisfaction, brand damage |
| Strategic | Missed opportunities, competitive disadvantage |

**Quantification Required**:
- Monetary value where possible
- Time/effort metrics
- Error rates/frequencies
- Risk exposure level

**Example**:
> "This results in approximately 180 staff-hours monthly spent on manual data
> entry (valued at USD 27,000/month). The 12% error rate has led to 3 member
> billing disputes per month and delays in payroll processing."

### 5. Corrective Action

**Purpose**: Provide actionable recommendation.

**Requirements**:
- Specific and measurable
- Assigned owner
- Timeline for completion
- Expected benefit quantified

**Formula**:
> [Action verb] + [specific action] + [owner] + [timeline] + [expected benefit]

**Example**:
> "Implement API-based integration between GymSoft and HR Suite (IT
> Director) by Q2 2026. This will eliminate manual data entry, reduce
> discrepancies to <1%, and recover approximately 160 staff-hours monthly
> (USD 24,000/month savings)."

---

## Complete Finding Example

```markdown
### Finding 3: Manual data entry creates errors and inefficiency

**Criteria**: Industry best practice requires automated data synchronization
between enterprise systems with reconciliation within 24 hours (COBIT DSS06.03).

**Condition**: Member data is manually entered into three separate systems
(GymSoft, HR Suite, Payroll Platform). Analysis of 200 records showed 24 (12%)
contained discrepancies between systems. Staff reported spending 6+ hours
daily on data re-entry tasks.

**Cause**: No API integration exists between GymSoft and HR Suite.
Legacy system architecture and vendor-imposed limitations have prevented
automated data exchange. No integration roadmap has been developed.

**Consequence**: Manual entry consumes approximately 180 staff-hours monthly
(USD 27,000). The 12% error rate generates 3+ member billing disputes monthly
and creates payroll processing delays of 2-3 days. Compliance risk exists for
data accuracy requirements.

**Corrective Action**: Implement API-based integration between GymSoft and
HR Suite by Q2 2026 (Owner: IT Director). Expected outcome: eliminate manual
entry, reduce discrepancies to <1%, recover 160 staff-hours monthly (USD
24,000 savings), and resolve billing dispute root cause.
```

---

## Validation Checklist

For each finding, verify:

### Criteria
- [ ] Source cited (standard, policy, regulation)
- [ ] Benchmark is appropriate and current
- [ ] Criteria is measurable

### Condition
- [ ] Specific and factual
- [ ] Quantified (numbers, percentages)
- [ ] Evidence-based
- [ ] No opinions or interpretations

### Cause
- [ ] Root cause identified (not just symptoms)
- [ ] Cause explains the gap
- [ ] Cause is within organization's control (or identified as external)

### Consequence
- [ ] Impact quantified (monetary, time, risk level)
- [ ] Impact is realistic (not exaggerated)
- [ ] Multiple impact types considered

### Corrective Action
- [ ] Specific and actionable
- [ ] Owner assigned
- [ ] Timeline specified
- [ ] Expected benefit quantified
- [ ] Recommendation addresses root cause

---

## Common Mistakes

| Mistake | Example | Correction |
|---------|---------|------------|
| Vague criteria | "Best practice requires..." | Cite specific standard |
| Opinion in condition | "The system is inadequate" | State observable facts |
| Symptom vs. cause | "Staff make errors" | Why do they make errors? |
| Unquantified consequence | "Significant impact" | USD X, Y hours, Z% |
| Vague recommendation | "Improve the process" | Specific action + owner + date |
| Missing owner | "Implement integration" | "IT Director should..." |
| Missing timeline | "Implement integration" | "...by Q2 2026" |
