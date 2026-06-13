# Managing Issues Examples

Detailed examples showing workflows for each operation.

---

## Examples by Operation

| Operation | Examples | File |
|-----------|----------|------|
| **Create** | Bug report, Feature request | [examples/create.md](examples/create.md) |
| **Implement** | Tier 1 trivial, Tier 2 standard, Spec-ready (Tier 2 + complete spec) | [examples/implement.md](examples/implement.md) |
| **Review** | Component, PR/Diff, Module, Compliance (spec audit) | [examples/review.md](examples/review.md) |
| **Display** | Single (`show #N`), List (`list issues`), Search (`find issues with label X`) | [examples/display.md](examples/display.md) |

---

## Quality Gate Summary (All Operations)

### Implement Operation Quality Gates

| Quality Gate | Phase | Tier 1 | Tier 2 | Can Override |
|--------------|-------|--------|--------|--------------|
| QG-0: Pre-flight | 0 | Mandatory | Mandatory | **NO** |
| QG-1: Agent Selection | 1 | Automated | Automated | Yes |
| QG-2: Business Analysis | 2 | Automated | Checkpoint | Yes |
| QG-3: Discovery | 3 | Automated | Checkpoint | Yes |
| QG-4: Architecture | 4 | User-Approval | User-Approval | Yes |
| QG-5: Implementation | 5 | Automated | Automated | Yes |
| QG-6: Architectural Review | 6 | Automated | Checkpoint | Yes |
| QG-7: Security | 7 | Mandatory | Mandatory | **NO** |
| QG-8: Quality Review | 8 | Automated | Checkpoint | Yes |
| QG-9: Verification | 9 | Mandatory | Mandatory | **NO** |
| QG-10: Documentation | 10 | Automated | Automated | Yes |
| QG-11: UAT | 11 | Automated | User-Approval | Yes |
| QG-12: Finalization | 12 | User-Approval | User-Approval | Yes |

**Note:** ALL phases execute for both tiers. Tier determines validation depth, not phase skipping.

### Create Operation Checkpoints

| Checkpoint | Required |
|------------|----------|
| Duplicate Check | ✓ |
| Draft Approval | ✓ |

### Review Operation Checkpoints

| Checkpoint | Required |
|------------|----------|
| Scope Selection | ✓ |
| Level Selection | ✓ |

---

## Quick Reference

| Scenario | Operation | Tier/Level |
|----------|-----------|------------|
| User reports bug | Create | - |
| User wants feature | Create | - |
| Fix typo in docs | Implement | Tier 1 |
| Update test count | Implement | Tier 1 |
| Add new component | Implement | Tier 2 |
| Fix complex bug | Implement | Tier 2 |
| Security fix | Implement | Tier 2 |
| Architecture refactor | Implement | Tier 2 |
| Quick code check | Review | Quick |
| Component quality | Review | Standard |
| Full architecture audit | Review | Deep |
| PR before merge | Review | Quick/Standard |
| Module assessment | Review | Standard/Deep |

---

## Inline Quick Examples

### Create: Bug Report

**User:** "The resize handle on the sidebar doesn't work on Mac"

**Flow:**
1. **Understand** → Extract: resize handle, sidebar, Mac
2. **Clarify** → Ask: browser, version, expected behavior
3. **Duplicate check** → `gh issue list --search "resize sidebar"`
4. **Draft** → Bug template with reproduction steps
5. **Confirm** → User approves before creation

**Result:** Issue with `bug` + `macos` labels

---

### Create: Feature Request

**User:** "I want dark mode for the editor"

**Flow:**
1. **Understand** → Extract: dark mode, editor, UI preference
2. **Clarify** → Ask: toggle location, system preference sync, scope
3. **Duplicate check** → `gh issue list --search "dark mode"`
4. **Draft** → Enhancement template with acceptance criteria
5. **Confirm** → User approves before creation

**Result:** Issue with `enhancement` label

---

### Implement: Tier 1 (Trivial)

**Issue:** "Fix typo in README.md"

**Key phases:**
- QG-0: Pre-flight (branch, clean state) → ✅
- QG-5: Implementation (mi-docs-fixer) → Single edit
- QG-7: Security → Quick scan (no IPC/preload) → ✅
- QG-9: Verification → Read file, confirm fix → ✅
- QG-12: Finalization → `docs: fix typo in README`

**Duration:** ~5 minutes

---

### Implement: Tier 2 (Standard)

**Issue:** "#42 - Add dark mode toggle"

**Key phases:**
- QG-0: Pre-flight → Tier 2 (3 acceptance criteria)
- QG-1: Agent Selection → Dynamic capability matching
- QG-2-3: Analyze + Discover → Theme patterns, affected files
- QG-4: Architecture → Design toggle + context → **USER APPROVAL**
- QG-5: Implementation → Code + tests (software-developer, test-writer)
- QG-6: Architecture Review → SOLID check (architecture-reviewer)
- QG-7: Security → Scan (security-auditor) → **MANDATORY**
- QG-8: Quality Review → Comprehensive (code-reviewer)
- QG-9: Verification → All criteria met → **MANDATORY**
- QG-11: UAT → **USER TESTS**
- QG-12: Finalization → `feat(ui): add dark mode toggle`

**Duration:** 30-60 minutes

---

### Review: Quick

**User:** "Quick check on EditorTab.tsx"

**Scope:** Single file
**Dimensions:** Security, anti-patterns only
**Duration:** 2-3 minutes
**Output:** Critical issues only

---

### Review: Standard

**User:** "Review the EditorTab component"

**Scope:** Component (EditorTab.tsx + test + styles)
**Dimensions:** Security, quality, basic SOLID, testing
**Duration:** 5-10 minutes
**Output:** All issues by severity

---

### Review: Deep

**User:** "Full audit of the terminal module"

**Scope:** Module (all terminal-related files)
**Dimensions:** All 10 review dimensions
**Duration:** 15-30 minutes
**Output:** Comprehensive report with architecture assessment
