# Spec Completeness Checklist

Quick checklist to verify all required sections and elements are present in spec based on tier.

---

## Tier Selection Reference

| Tier | Files | Use Case |
|------|-------|----------|
| T1 | 0 | Issue (bug fixes, trivial tasks) |
| T2 | 2 | Spec (simple features, small enhancements) |
| T3 | 4 | Lite spec (complex features, integrations) |
| T4 | 6 | Standard spec (major features, cross-team work) |

---

## T3 Lite spec Checklist (4 files)

### Required Files

- [ ] `manifest.json` - Metadata and configuration
- [ ] `01-overview.md` - Project overview and objectives
- [ ] `02-requirements.md` - Functional and non-functional requirements
- [ ] `03-acceptance.md` - Acceptance criteria and constraints

### 01-overview.md

- [ ] **1.1 Purpose** - Why this application/feature is needed
- [ ] **1.2 Scope** - What's included and excluded
- [ ] **1.3 Business Objectives** - At least 2 objectives with measurable outcomes
- [ ] **1.4 Stakeholders** - Primary users identified

### 02-requirements.md

- [ ] **Functional Requirements** - At least 5 requirements with FR-xxx IDs
- [ ] **Non-Functional Requirements** - At least 3 requirements with NFR-xxx IDs
- [ ] Each requirement has: ID, Title, Description, Priority
- [ ] Requirements are testable (not vague)

### 03-acceptance.md

- [ ] **Acceptance Criteria** - At least 5 criteria with AC-xxx IDs
- [ ] **Constraints** - At least 2 documented constraints
- [ ] Criteria are testable and measurable

### T3 Pass Criteria

- [ ] All 4 files present (including manifest)
- [ ] At least 2 business objectives
- [ ] At least 5 functional requirements
- [ ] At least 3 non-functional requirements
- [ ] At least 5 acceptance criteria

**T3 Completeness Score:** ___/4 files = ___%

---

## T4 Standard spec Checklist (6 files)

### Required Files

- [ ] `manifest.json` - Metadata and configuration
- [ ] `01-overview.md` - Project overview and objectives
- [ ] `02-requirements.md` - Functional and non-functional requirements
- [ ] `03-use-cases.md` - Use case documentation
- [ ] `04-acceptance.md` - Acceptance criteria
- [ ] `05-notes.md` - Constraints, assumptions, appendices

### 01-overview.md

- [ ] **1.1 Purpose** - Why this application is needed
- [ ] **1.2 Scope** - What's included and excluded
- [ ] **1.3 Business Objectives** - At least 3 SMART objectives
- [ ] **1.4 Stakeholders** - All stakeholder types with needs and interactions
- [ ] Objectives table includes: ID, Objective, Measurable Outcome, Priority

### 02-requirements.md

- [ ] **Functional Requirements** - At least 10 requirements with FR-xxx IDs
- [ ] **Non-Functional Requirements** - At least 5 requirements covering:
  - [ ] Performance
  - [ ] Security
  - [ ] Scalability
  - [ ] Usability
- [ ] Each requirement has: ID, Title, Description, Priority, Acceptance Criteria
- [ ] Requirements are traceable to business objectives

### 03-use-cases.md

- [ ] At least 3 complete use cases with UC-xxx IDs
- [ ] Each use case includes:
  - [ ] Actors (primary and secondary)
  - [ ] Preconditions
  - [ ] Main Flow (5-10 steps)
  - [ ] Alternate Flows
  - [ ] Exception Flows
  - [ ] Postconditions
  - [ ] Acceptance Criteria

### 04-acceptance.md

- [ ] **Global Acceptance Criteria** - Project-wide requirements
- [ ] **Feature-Specific Criteria** - Organized by feature
- [ ] At least 10 acceptance criteria with AC-xxx IDs
- [ ] All criteria are testable and measurable

### 05-notes.md

- [ ] **Constraints** - At least 3 with impact and mitigation
- [ ] **Assumptions** - At least 3 with risk if invalid
- [ ] **Glossary** - At least 5 domain terms defined
- [ ] **References** - Sources and standards cited
- [ ] **Traceability Matrix** - Requirements to objectives mapping

### T4 Pass Criteria

- [ ] All 6 files present (including manifest)
- [ ] At least 3 SMART business objectives
- [ ] At least 2 stakeholder types
- [ ] At least 10 functional requirements
- [ ] At least 5 non-functional requirements
- [ ] At least 3 complete use cases
- [ ] At least 10 acceptance criteria
- [ ] Traceability matrix present

**T4 Completeness Score:** ___/6 files = ___%

---

## Validation Score Thresholds

| Tier | Minimum Score | Target Score |
|------|---------------|--------------|
| T3 | 50% | 80% |
| T4 | 80% | 95% |

---

## Post-ADD Validation (Mini-check after each ADD)

Run these checks after every ADD operation:

- [ ] Registry sections_count matches manifest sections count
- [ ] Registry requirements_count matches total requirements in manifest
- [ ] requirements_index has entry for each requirement ID
- [ ] No placeholder traces like "[FR-xxx]" or "[BO-xxx]"
- [ ] All traces_to references point to existing requirement IDs
- [ ] Section file word count updated in manifest

---

## Result Summary

**Tier:** [ ] T3 Lite spec / [ ] T4 Standard spec

**Files Present:** ___/___

**Overall Result:**
- [ ] **COMPLETE** - All required files and elements present
- [ ] **MOSTLY COMPLETE** - Missing 1-2 elements
- [ ] **INCOMPLETE** - Missing 3+ elements, revision needed

---

**Reviewed By:** [Reviewer Name/Agent]
**Review Date:** [Date]
**Next Review:** [Date]
