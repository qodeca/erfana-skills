# Finding Template

Use the Five C's Framework for all audit findings.

---

## Template

```markdown
### Finding [N]: [Finding title in sentence case]

**Severity**: [Critical / High / Medium / Low]
**Category**: [Category name]
**Systems affected**: [System names]

#### Criteria

[What should be? Cite the standard, policy, or benchmark.]

#### Condition

[What is? Describe what was observed with specific data and evidence.]

#### Cause

[Why? Identify the root cause of the gap.]

#### Consequence

[Impact? Quantify the effect on the organization.]

#### Corrective action

[Recommendation? Provide specific action with owner and timeline.]

---
```

---

## Example

```markdown
### Finding 3: Manual data entry creates errors and inefficiency

**Severity**: High
**Category**: Integration
**Systems affected**: GymSoft, HR Suite, Payroll Platform

#### Criteria

Industry best practice (COBIT DSS06.03) requires automated data synchronization
between enterprise systems with reconciliation occurring within 24 hours.
Manual data entry between systems should be eliminated where technically feasible.

#### Condition

Member data is manually entered into three separate systems: GymSoft (member
management), HR Suite (payroll), and Payroll Platform (HR). Analysis of 200 randomly
selected records identified 24 (12%) containing discrepancies between systems.
Staff interviews confirmed 6+ hours daily are spent on data re-entry tasks
across the organization.

#### Cause

No API integration exists between GymSoft and HR Suite. The root causes are:
1. Legacy architecture in GymSoft (pre-2020 version) lacks modern API endpoints
2. Vendor has not provided integration documentation despite requests
3. No internal integration roadmap has been developed
4. IT resources have been allocated to maintenance rather than integration projects

#### Consequence

- **Financial**: Manual entry consumes approximately 180 staff-hours monthly,
  valued at USD 27,000/month (USD 324,000 annually)
- **Operational**: 12% error rate generates 3+ member billing disputes monthly
- **Compliance**: Payroll processing delayed 2-3 days due to manual verification
- **Risk**: Data inconsistencies create audit and regulatory exposure

#### Corrective action

Implement API-based integration between GymSoft and HR Suite.

| Element | Detail |
|---------|--------|
| **Action** | Deploy middleware integration layer using GymSoft API |
| **Owner** | IT Director (Maria Santos) |
| **Timeline** | Q2 2026 |
| **Expected benefit** | Eliminate manual entry, reduce discrepancies to <1%, recover 160 staff-hours monthly (USD 24,000/month) |
| **Estimated cost** | USD 75,000 implementation + USD 12,000/year maintenance |
| **ROI** | 4-month payback period |

---
```

---

## Severity Guidelines

| Level | Criteria | Response required |
|-------|----------|-------------------|
| **Critical** | Immediate risk to operations, compliance, or safety | Within 30 days |
| **High** | Significant impact on efficiency, cost, or quality | Within 90 days |
| **Medium** | Moderate impact; improvement opportunity | Within 6 months |
| **Low** | Minor impact; best practice enhancement | Within 12 months |

---

## Category Reference

| Category | Description |
|----------|-------------|
| Integration | System connectivity and data exchange |
| Process | Workflow and procedure issues |
| Data | Data quality, accuracy, or governance |
| Vendor | Third-party relationship issues |
| Resource | Staffing or capacity constraints |
| Performance | Speed, reliability, or availability |
| Security | Access control or data protection |
| Governance | Oversight, accountability, or policy |
| Strategic | Alignment with business objectives |

---

## Validation Checklist

### Five C's Completeness

- [ ] **Criteria**: Source cited (standard, regulation, policy)
- [ ] **Condition**: Specific and quantified (numbers, percentages)
- [ ] **Cause**: Root cause identified (not just symptoms)
- [ ] **Consequence**: Impact quantified (monetary, time, risk)
- [ ] **Corrective action**: Has owner + timeline + expected benefit

### Formatting

- [ ] Finding title in sentence case
- [ ] Severity assigned
- [ ] Category assigned
- [ ] All headings in sentence case
- [ ] No Title Case violations

### Content Quality

- [ ] Evidence-based (no unsupported claims)
- [ ] Objective tone (no blame language)
- [ ] Quantified where possible
- [ ] Recommendation addresses root cause
