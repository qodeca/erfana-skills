# Spec Quality Checklist

Tier-aware quality assessment for spec documents.

---

## Scoring System

- **Pass:** Item fully meets criteria
- **Partial:** Item partially meets criteria (50% credit)
- **Fail:** Item does not meet criteria
- **N/A:** Not applicable (excluded from scoring)

**Thresholds:**
- T3 (Lite spec): ≥50%
- T4 (Standard spec): ≥80%

---

## T3 Checklist (Lite Spec - 4 Files)

### Section 1: Completeness (Weight: 35%)

#### 1.1 Required Files (15 points)

- [ ] **1.1.1** manifest.json exists and valid
- [ ] **1.1.2** 01-overview.md exists
- [ ] **1.1.3** 02-requirements.md exists
- [ ] **1.1.4** 03-acceptance.md exists
- [ ] **1.1.5** Tier field set to "T3" in manifest

**Score: ___/15**

#### 1.2 Content Completeness (20 points)

- [ ] **1.2.1** Overview has summary section
- [ ] **1.2.2** Overview has scope section
- [ ] **1.2.3** At least 3 functional requirements
- [ ] **1.2.4** At least 1 non-functional requirement
- [ ] **1.2.5** At least 3 acceptance criteria

**Score: ___/20**

**Section 1 Total: ___/35**

---

### Section 2: Requirements Quality (Weight: 35%)

#### 2.1 Functional Requirements (20 points)

- [ ] **2.1.1** Requirements are testable (no "should", "may", "approximately")
- [ ] **2.1.2** Each FR has unique ID format: {spec_id}-FR-XXX
- [ ] **2.1.3** Requirements have priority assigned
- [ ] **2.1.4** Requirements are atomic (one requirement per ID)

**Score: ___/20**

#### 2.2 Non-Functional Requirements (15 points)

- [ ] **2.2.1** NFRs are measurable
- [ ] **2.2.2** NFRs have category (Performance, Security, etc.)
- [ ] **2.2.3** NFRs have unique ID format: {spec_id}-NFR-XXX

**Score: ___/15**

**Section 2 Total: ___/35**

---

### Section 3: Acceptance Criteria (Weight: 20%)

- [ ] **3.1** Each FR has at least one AC
- [ ] **3.2** ACs use Given/When/Then or Steps format
- [ ] **3.3** ACs are verifiable
- [ ] **3.4** Definition of Done present

**Score: ___/20**

---

### Section 4: Consistency (Weight: 10%)

- [ ] **4.1** All FRs traced to ACs
- [ ] **4.2** AC references valid FR IDs
- [ ] **4.3** Manifest statistics match actual counts

**Score: ___/10**

---

### T3 Overall Score

| Section | Weight | Score | Weighted |
|---------|--------|-------|----------|
| 1. Completeness | 35% | ___/35 | ___ |
| 2. Requirements Quality | 35% | ___/35 | ___ |
| 3. Acceptance Criteria | 20% | ___/20 | ___ |
| 4. Consistency | 10% | ___/10 | ___ |
| **TOTAL** | **100%** | ___/100 | **___** |

**Result:**
- ✅ **PASS** (≥50%): Spec meets T3 (Lite spec) standards
- ❌ **FAIL** (<50%): Spec requires improvement

---

## T4 Checklist (Standard Spec - 6 Files)

### Section 1: Completeness (Weight: 25%)

#### 1.1 Required Files (15 points)

- [ ] **1.1.1** manifest.json exists and valid
- [ ] **1.1.2** 01-overview.md exists
- [ ] **1.1.3** 02-requirements.md exists
- [ ] **1.1.4** 03-use-cases.md exists
- [ ] **1.1.5** 04-acceptance.md exists
- [ ] **1.1.6** 05-notes.md exists (optional but scored)
- [ ] **1.1.7** Tier field set to "T4" in manifest

**Score: ___/15**

#### 1.2 Content Completeness (10 points)

- [ ] **1.2.1** Overview has summary, purpose, scope
- [ ] **1.2.2** At least 5 functional requirements
- [ ] **1.2.3** At least 2 non-functional requirements
- [ ] **1.2.4** At least 2 use cases
- [ ] **1.2.5** At least 5 acceptance criteria

**Score: ___/10**

**Section 1 Total: ___/25**

---

### Section 2: Requirements Quality (Weight: 30%)

#### 2.1 Functional Requirements (18 points)

- [ ] **2.1.1** Requirements are testable
- [ ] **2.1.2** Each FR has unique ID format
- [ ] **2.1.3** Requirements have priority assigned
- [ ] **2.1.4** Requirements are atomic
- [ ] **2.1.5** Requirements have acceptance criteria link
- [ ] **2.1.6** No ambiguous language

**Score: ___/18**

#### 2.2 Non-Functional Requirements (12 points)

- [ ] **2.2.1** NFRs are measurable with specific metrics
- [ ] **2.2.2** NFRs have category
- [ ] **2.2.3** NFRs have measurement method
- [ ] **2.2.4** Performance and Security categories covered

**Score: ___/12**

**Section 2 Total: ___/30**

---

### Section 3: Use Case Quality (Weight: 15%)

- [ ] **3.1** Use cases have Actor defined
- [ ] **3.2** Use cases have Preconditions
- [ ] **3.3** Use cases have Main Flow (numbered steps)
- [ ] **3.4** Use cases have Postconditions
- [ ] **3.5** Use cases trace to FRs

**Score: ___/15**

---

### Section 4: Acceptance Criteria (Weight: 20%)

- [ ] **4.1** Each FR has at least one AC
- [ ] **4.2** ACs use Given/When/Then or Steps format
- [ ] **4.3** ACs are verifiable
- [ ] **4.4** ACs reference valid FR/UC IDs
- [ ] **4.5** Definition of Done present

**Score: ___/20**

---

### Section 5: Consistency (Weight: 10%)

- [ ] **5.1** All FRs traced to ACs
- [ ] **5.2** All UCs trace to FRs
- [ ] **5.3** AC references valid requirement IDs
- [ ] **5.4** Manifest statistics match actual counts
- [ ] **5.5** No orphaned cross-references

**Score: ___/10**

---

### T4 Overall Score

| Section | Weight | Score | Weighted |
|---------|--------|-------|----------|
| 1. Completeness | 25% | ___/25 | ___ |
| 2. Requirements Quality | 30% | ___/30 | ___ |
| 3. Use Case Quality | 15% | ___/15 | ___ |
| 4. Acceptance Criteria | 20% | ___/20 | ___ |
| 5. Consistency | 10% | ___/10 | ___ |
| **TOTAL** | **100%** | ___/100 | **___** |

**Result:**
- ✅ **PASS** (≥80%): Spec meets T4 (Standard spec) standards
- ⚠️ **MARGINAL** (70-79%): Spec needs improvement
- ❌ **FAIL** (<70%): Spec requires revision

---

## Critical Issues (Auto-Fail)

If ANY of these are true, spec automatically fails:

### T3 Critical Issues
- [ ] No functional requirements documented
- [ ] No acceptance criteria for any FR
- [ ] Missing required file (01, 02, or 03)
- [ ] Tier mismatch in manifest

### T4 Critical Issues (includes T3 plus)
- [ ] No use cases documented
- [ ] Missing required file (01, 02, 03, or 04)
- [ ] Major cross-reference errors

**Critical Issues Found:** ___

---

## Improvement Recommendations

### High Priority (Blocking)
1. [Issue] - [Fix]

### Medium Priority
1. [Issue] - [Fix]

### Low Priority (Polish)
1. [Issue] - [Fix]

---

**Tier:** T3 / T4
**Validated By:** [Agent]
**Date:** [Date]
