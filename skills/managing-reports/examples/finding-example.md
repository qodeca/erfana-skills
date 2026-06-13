# Finding Example

This example demonstrates how to write a finding using the Five C's framework.

---

## The Five C's Framework

Every finding must include all five elements:

1. **Criteria** - What should be (standard/policy/best practice)
2. **Condition** - What is (current state)
3. **Cause** - Why it happened (root cause)
4. **Consequence** - What's the impact (effect/risk)
5. **Corrective Action** - What to do (recommendation)

---

## Example 1: Critical Finding (Complete Five C's)

### Finding 1: System integration failures cause operational inefficiency

**Severity:** Critical
**Category:** Integration
**Systems affected:** GymSoft, HR Suite Fusion, Payroll Platform

#### Criteria

Per industry best practices and the organization's IT governance policy (Section 4.2),
core business systems should exchange data automatically through standardized
integrations, eliminating manual data entry and ensuring data consistency across
platforms.

#### Condition

Three critical systems operate in complete isolation:
- **GymSoft** (membership management) has no API connections to other systems
- **HR Suite Fusion** (finance) receives membership revenue data via weekly CSV exports
- **Payroll Platform** (HR) contains employee data not synchronized with access control

Data flows between these systems require manual intervention, creating a weekly
backlog of approximately 15 hours of administrative work across departments.

#### Cause

Root causes identified through stakeholder interviews:
1. Legacy system architecture predates integration requirements
2. No integration strategy or middleware platform in place
3. Vendor APIs not evaluated during system selection
4. IT department lacks resources for integration projects

#### Consequence

**Operational impact:**
- Staff spend 15+ hours weekly on manual data synchronization
- Revenue reconciliation delayed by 3-5 business days
- Member data inconsistencies affect 12% of active memberships
- Access control gaps create security vulnerabilities

**Financial impact:**
- Estimated USD 180,000 annual labor cost for manual processes
- Revenue leakage of approximately USD 45,000 due to reconciliation delays
- Total annual impact: USD 225,000

**Strategic impact:**
- Inability to generate real-time business intelligence
- Delayed decision-making due to data availability
- Competitive disadvantage in member experience

#### Corrective action

**Recommendation:** Implement integration middleware platform within 6 months.

**Specific actions:**
1. Evaluate middleware solutions (MuleSoft, Dell Boomi, Microsoft Power Automate)
2. Prioritize GymSoft ↔ HR Suite integration (highest impact)
3. Establish API-first policy for future system selections
4. Allocate dedicated integration resource (1 FTE)

**Timeline:** Q1-Q2 2026
**Owner:** IT Director
**Investment:** USD 150,000-250,000 (implementation + first year)
**Expected benefit:** USD 225,000 annual savings + strategic enablement

---

## Example 2: High-Priority Finding

### Finding 2: Excel-based processes create data quality risks

**Severity:** High
**Category:** Data Management
**Departments affected:** Finance, HR, Operations

#### Criteria

Critical business processes should be managed in purpose-built systems with
audit trails, access controls, and data validation. ISO 27001 Section A.12
requires information processing facilities to ensure integrity and availability.

#### Condition

Fourteen business-critical processes currently operate in Microsoft Excel:
- Budget tracking and variance analysis (Finance)
- Employee scheduling and attendance reconciliation (HR)
- Equipment maintenance tracking (Operations)
- Membership revenue forecasting (Finance)

These spreadsheets contain over 50,000 rows of operational data with no version
control, limited access restrictions, and no data validation rules.

#### Cause

1. Original systems lacked required functionality
2. Excel served as "quick fix" that became permanent
3. No formal process for system enhancement requests
4. Department autonomy in tool selection

#### Consequence

- Three documented instances of formula errors affecting financial reports
- No audit trail for data modifications
- Single points of failure (key employee absence = process halt)
- Estimated 8 hours weekly spent on spreadsheet maintenance

#### Corrective action

**Recommendation:** Migrate critical Excel processes to appropriate systems.

**Priority 1 (3 months):** Financial processes → HR Suite Fusion extensions
**Priority 2 (6 months):** HR processes → Payroll Platform workflow modules
**Priority 3 (9 months):** Operations processes → Purpose-built maintenance system

**Owner:** Department heads with IT support
**Investment:** USD 75,000 (configuration + training)

---

## Anti-Patterns to Avoid

### ❌ Incomplete Finding (Missing Five C's)

```markdown
### Finding: Systems don't integrate well

The organization has integration problems between its core systems.
This causes manual work and inefficiency. The IT team should fix this.
```

**Problems:**
- No criteria (what standard is violated?)
- Vague condition (what specifically?)
- No cause analysis (why?)
- Unquantified consequence (how much impact?)
- Vague corrective action (fix what, how, when?)

### ❌ Title Case Violation

```markdown
### Finding 1: System Integration Failures Cause Operational Inefficiency
```

**Problem:** Uses Title Case instead of sentence case.

**Correct:**
```markdown
### Finding 1: System integration failures cause operational inefficiency
```

### ❌ Passive Voice

```markdown
The systems were found to be not integrated by the assessment team.
```

**Correct (active):**
```markdown
The assessment identified three unintegrated systems.
```

---

## Finding Quality Checklist

- [ ] Title uses sentence case
- [ ] Severity assigned and justified
- [ ] Category appropriate
- [ ] Systems/areas affected listed
- [ ] Criteria cites policy/standard/best practice
- [ ] Condition is specific and factual
- [ ] Cause identifies root cause (not symptoms)
- [ ] Consequence is quantified (cost, time, risk)
- [ ] Corrective action is specific and actionable
- [ ] Owner identified
- [ ] Timeline specified
- [ ] Investment estimated
