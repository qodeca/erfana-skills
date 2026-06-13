# Implement Operation Examples

Detailed examples showing the Implement operation workflow for different tiers.

---

## Example 1: Trivial Issue (Tier 1)

**Issue:** #42 - Fix typo in README

**Labels:** `documentation`

**Workflow:**

```
Phase 0: Pre-flight (QG-0 Mandatory)
   → Issue open? ✓
   → Tests pass? ✓
   → Create branch: git checkout -b docs/42-fix-readme-typo
   → QG-0: PASS

Phase 1: Agent Selection (QG-1 Automated)
   → Discover agents: mi-docs-fixer available
   → Match: 95% for trivial docs
   → Auto-select mi-docs-fixer
   → QG-1: PASS (automated)

Phase 2: Business Analysis (QG-2 Automated)
   → 1 search: Any style guide for docs?
   → Light validation (Tier 1)
   → QG-2: PASS (automated)

Phase 3: Discovery (QG-3 Automated)
   → Quick file identification: README.md
   → Light validation (Tier 1)
   → QG-3: PASS (automated)

Phase 4: Architecture (QG-4 User-Approval)
   → Simple fix, no architecture needed
   → QG-4: PASS (trivial change)

Phase 5: Implementation (QG-5 Automated)
   → Fix typo directly in README.md
   → QG-5: PASS

Phase 6: Architectural Review (QG-6 Automated)
   → Light review (Tier 1)
   → QG-6: PASS (automated)

Phase 7: Security (QG-7 Mandatory)
   → npm audit: Pass
   → Secret check: Pass
   → QG-7: PASS

Phase 8: Quality Review (QG-8 Automated)
   → Light review (Tier 1)
   → QG-8: PASS (automated)

Phase 9: Verification (QG-9 Mandatory)
   → Typo fixed? ✓
   → QG-9: PASS

Phase 10: Documentation (QG-10 Automated)
   → No CLAUDE.md update needed (trivial)
   → QG-10: PASS

Phase 11: UAT (QG-11 Automated)
   → Visual check of README
   → QG-11: PASS (automated for Tier 1)

Phase 12: Finalization (QG-12 User-Approval)
   → All quality gates: PASS
   → Commit: "docs: fix typo in README - Closes #42"
   → User approves commit
   → Merge to main and delete branch
   → QG-12: PASS
```

**Key Points:**
- ALL 13 phases execute (0-12) - tier determines depth, not skip
- Tier 1 uses automated gates where possible (light validation)
- Mandatory gates still enforced: QG-0, QG-7, QG-9
- User approval required for: QG-4, QG-12

---

## Example 2: Standard Feature (Tier 2)

**Issue:** #11 - Add Chrome-style tabs

**Labels:** `enhancement`

**Workflow:**

```
Phase 0: Pre-flight (QG-0 Mandatory)
   → Issue open? ✓
   → Tests pass? ✓
   → Create branch: git checkout -b feat/11-chrome-style-tabs
   → QG-0: PASS

Phase 1: Agent Selection (QG-1 Automated)
   → Discover agents: builtin + shared + dedicated
   → Match phase requirements to agent capabilities
   → Auto-select: mi-requirements-analyzer, mi-codebase-explorer, etc.
   → QG-1: PASS

Phase 2: Business Analysis (QG-2 Checkpoint)
   → Agent: mi-requirements-analyzer
   → WebSearch: "chrome style tabs react", "dockview custom tabs"
   → Found: No suitable library, VS Code uses custom implementation
   → Questionnaire: Reference=VS Code, Scope=defined
   → User reviews research findings
   → QG-2: PASS

Phase 3: Discovery (QG-3 Checkpoint)
   → Agent: mi-codebase-explorer
   → Identify: DockviewReact tabs, HeaderComponent
   → User confirms understanding
   → QG-3: PASS

Phase 4: Architecture (QG-4 User-Approval)
   → Agent: mi-solution-designer
   → Plan: EditorTab component, context menu, CSS
   → Architect verification: Plan complete
   → User approves plan
   → QG-4: PASS

Phase 5: Implementation (QG-5 Automated)
   → Agent: software-developer → Create EditorTab.tsx
   → Agent: test-writer → Create EditorTab.test.tsx
   → Typecheck: PASS, Lint: PASS
   → QG-5: PASS

Phase 6: Architectural Review (QG-6 Checkpoint)
   → Agent: architecture-reviewer
   → SOLID analysis: Pass
   → User reviews assessment
   → QG-6: PASS

Phase 7: Security (QG-7 Mandatory)
   → Agent: security-auditor
   → npm audit: Pass
   → OWASP: Pass (Tier 2 full audit)
   → QG-7: PASS

Phase 8: Quality Review (QG-8 Checkpoint)
   → Agent: code-reviewer
   → Maintainability: 78/100
   → User reviews quality assessment
   → QG-8: PASS

Phase 9: Verification (QG-9 Mandatory)
   → Agent: mi-solution-designer (verify mode)
   → Implementation matches plan: VERIFIED
   → QG-9: PASS

Phase 10: Documentation (QG-10 Automated)
   → Agent: mi-docs-updater
   → CLAUDE.md updated with new feature
   → QG-10: PASS

Phase 11: UAT (QG-11 User-Approval)
   → npm run build && npm run dev
   → User tests acceptance criteria
   → QG-11: PASS

Phase 12: Finalization (QG-12 User-Approval)
   → All quality gates: PASS
   → Agent: commit-writer
   → Commit: "feat(tabs): add Chrome-style dynamic tabs - Closes #11"
   → User approves commit
   → Merge to main and delete branch
   → QG-12: PASS
```

**Key Points:**
- ALL 13 phases execute (0-12)
- 13 Quality Gates (one per phase)
- Tier 2 uses Checkpoint gates (user reviews findings)
- Mandatory gates enforced: QG-0, QG-7, QG-9
- Full OWASP security audit for Tier 2

---

## Quality Gate Summary (Implement)

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

**Gate Types:**
- **Mandatory**: MUST pass, cannot be overridden (QG-0, QG-7, QG-9)
- **Checkpoint**: User reviews findings before proceeding (Tier 2 only)
- **User-Approval**: Requires explicit user consent
- **Automated**: Passes if automated checks pass

---

## Edge Case Examples

### Example 3: Agent Selection Failure

**Scenario:** No suitable agent found for Phase 2

```
Phase 1: Agent Selection (QG-1)
   → Discover agents: builtin, shared, dedicated
   → Match for Phase 2 (Business Analysis):
      - mi-requirements-analyzer: 55% match (below 60% threshold)
      - No other candidates

   → SELECTION FAILURE for Phase 2

   → Options presented to user:
     1. Use mi-requirements-analyzer anyway (55% match)
     2. Allow direct execution (orchestrator handles Phase 2)
     3. Create new agent with required capabilities
     4. Abort implementation

   → User selects: "Allow direct execution"
   → Record justification: "No suitable agent, user approved workaround"
   → QG-1: PASS (with workaround)

Phase 2: Business Analysis (QG-2)
   → DIRECT EXECUTION (no agent delegation)
   → Orchestrator performs research directly
   → Context usage: higher than normal
   → QG-2: PASS
```

**Key Points:**
- Agent selection failure does NOT block progress
- User must explicitly approve workaround
- Justification recorded for audit trail
- Direct execution allowed when user approves

---

### Example 4: Quality Gate Retry Exhaustion

**Scenario:** QG-7 (Security) fails 3 times

```
Phase 7: Security (QG-7 Mandatory)

   ATTEMPT 1:
   → npm audit: FAIL (2 critical vulnerabilities)
   → QG-7: FAIL

   → Fix: npm update vulnerable-package@latest

   ATTEMPT 2:
   → npm audit: FAIL (1 critical in transitive dep)
   → QG-7: FAIL

   → Fix: npm audit fix --force

   ATTEMPT 3:
   → npm audit: FAIL (unfixable vulnerability in isomorphic-git)
   → QG-7: FAIL

   → RETRY EXHAUSTION (3/3 attempts)

   → ESCALATE TO USER:
     ┌────────────────────────────────────────┐
     │ Phase 7 (Security) FAILED              │
     │                                        │
     │ Attempts: 3/3                          │
     │ Reason: Unfixable npm vulnerability    │
     │                                        │
     │ Vulnerability: CVE-2024-XXXXX          │
     │ Package: isomorphic-git (transitive)   │
     │ Severity: Critical                     │
     │                                        │
     │ Options:                               │
     │ [Override] - Document and proceed      │
     │ [Abort] - Stop implementation          │
     └────────────────────────────────────────┘

   → QG-7 is MANDATORY → Cannot override

   → User must choose: [Abort]
   → Implementation STOPPED
   → Issue commented with findings
```

**Key Points:**
- Mandatory gates (QG-0, QG-7, QG-9) CANNOT be overridden
- Max 3 retries before escalation
- User informed with full context
- Issue documented with failure reason

---

### Example 5: Post-UAT Changes Trigger Re-Review

**Scenario:** User requests changes after QG-11 (UAT)

```
Phase 11: UAT (QG-11 User-Approval)
   → User tests feature
   → User: "Works, but button color doesn't match design system"
   → QG-11: PASS (with requested fix)

→ Implementation makes requested change:
   - Edit: ButtonColor.css (15 lines changed)

Phase 12: Finalization (QG-12)

   PRE-COMMIT REVIEW GATE:
   → Check: git diff <last_review_commit>..HEAD
   → Result: 15 lines changed after QG-8

   DECISION MATRIX:
   | Change: 15 lines | Security: No | → Delta Review |

   → TRIGGER: Delta Review (re-run Phase 8 only)

   Phase 8 (Re-run): Quality Review
   → Agent: code-reviewer
   → Review 15 changed lines
   → Design token usage: PASS
   → QG-8: PASS

   → Update last_review_commit = HEAD
   → Return to Phase 12

   PRE-COMMIT REVIEW GATE (re-check):
   → No changes since last review
   → Proceed to commit

   → QG-12: PASS
```

**Key Points:**
- Post-review changes detected automatically
- Re-review level based on change size and security impact
- Prevents Issue #68 scenario (unreviewed code committed)
- Loop continues until no unreviewed changes remain

---

### Example 6: Aborted Implementation Recovery

**Scenario:** User aborts at Phase 4, returns later

```
INITIAL SESSION:

Phase 0: Pre-flight (QG-0) → PASS
Phase 1: Agent Selection (QG-1) → PASS
Phase 2: Business Analysis (QG-2) → PASS
Phase 3: Discovery (QG-3) → PASS
Phase 4: Architecture (QG-4)
   → Agent: mi-solution-designer
   → Plan presented to user
   → User: "I need to think about this. Abort for now."
   → Implementation PAUSED

   → Cleanup:
     - Branch preserved: feat/99-new-feature
     - No commit (changes uncommitted)
     - Issue commented: "Implementation paused at Phase 4"

---

RECOVERY SESSION (next day):

User: "Continue implementing #99"

→ Check branch exists: feat/99-new-feature ✓
→ Check uncommitted changes: Present ✓

RECOVERY OPTIONS:
   1. Resume from Phase 4 (use existing discovery)
   2. Restart from Phase 0 (fresh start)

→ User selects: Resume from Phase 4

Phase 4: Architecture (QG-4)
   → Re-present previous plan
   → User reviews and approves
   → QG-4: PASS

→ Continue with Phase 5...
```

**Key Points:**
- Aborted implementations can be recovered
- Branch and uncommitted changes preserved
- User chooses resume vs restart
- Context from previous phases reused if resuming

---

### Example 7: Spec-ready implementation (Tier 2 + complete spec)

**User:** "Implement #134 -- LiteParse frontend UI"

**Issue characteristics:**
- Label: `enhancement` --> Tier 2
- Spec: T3 complete (01-overview.md, 02-requirements.md, 03-acceptance.md)
- Design doc: sd-001 exists --> `spec_maturity = complete_with_design`

**Flow (spec-ready mode):**

```
QG-0: Pre-flight --> Tier 2, spec_maturity = complete_with_design
QG-1: Agent selection --> DEFAULT_AGENT_MAP (skip discovery)
QG-2: Business analysis --> Validate spec requirements (skip research)
QG-3: Discovery --> Spot-check key files (skip full exploration)
QG-4: Architecture --> Validate design doc --> USER APPROVAL
QG-5: Implementation --> software-developer + test-writer
QG-6-8: Reviews (standard depth)
QG-9: Verification --> acceptance criteria check
QG-10-12: Documentation, UAT, finalization
```

**Time saved:** ~2-3 hours on Phases 1-4 (validation vs discovery)
**Result:** Same quality gates, same mandatory checks, reduced overhead
