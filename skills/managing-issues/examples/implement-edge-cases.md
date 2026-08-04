# Implement Operation Examples - Edge Cases

Edge-case walkthroughs for the Implement operation. The two tier walkthroughs and
the quality-gate summary table live in [implement.md](implement.md).

---

### Example 3: Agent Selection Failure

**Scenario:** No suitable agent found for Phase 2

```
Phase 1: Agent Selection (QG-1)
   → Discover agents: builtin, shared, dedicated
   → Match for Phase 2 (Business Analysis):
      - mi-requirements-analyzer: partial coverage (no web-search capability)
      - No other candidates

   → SELECTION FAILURE for Phase 2

   → Options presented to user:
     1. Use mi-requirements-analyzer anyway (partial coverage)
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
   → Snapshot the working tree, diff it against the last_review_tree
     snapshot recorded at QG-8 (no commits exist yet - a <sha>..HEAD
     range would be empty and the gate would pass blind)
   → Result: 15 lines changed after QG-8

   DECISION MATRIX:
   | Change: 15 lines | Security: No | → Delta Review |

   → TRIGGER: Delta Review (re-run Phase 8 only)

   Phase 8 (Re-run): Quality Review
   → Agent: code-reviewer
   → Review 15 changed lines
   → Design token usage: PASS
   → QG-8: PASS

   → Re-snapshot the working tree into last_review_tree
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

→ Read the persisted run-state comment on #99 (paginated fetch, filtered to
  the authenticated user in the query), accept it (branch, re-detected
  base branch, ancestry), validate the task-list snapshot item by item
  against the canonical strings, then rebuild the TodoWrite list from it
→ Check uncommitted changes: Present ✓ - recorded and reported, NOT a
  QG-0 failure; a mid-implementation interruption always has dirty paths

RECOVERY OPTIONS (confirmed with the user, never silent):
   1. Resume from Phase 4 (use existing discovery)
   2. Restart from Phase 0 (fresh start)

→ User selects: Resume from Phase 4
→ QG-0 re-runs unconditionally, as do QG-7 and QG-9 later

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
      then QG-4a (user-run lens review) + QG-4b (acceptance) - Tier 2 default
QG-5: Implementation --> software-developer + test-writer (+ e2e-test-writer)
QG-6-8: Reviews (standard depth)
QG-9: Verification --> acceptance criteria check
QG-10: Documentation; QG-11a (user-run lens review) --> QG-11 UAT; QG-12 finalize
```

Sub-gate mechanics are shown once, in Example 2 of [implement.md](implement.md) - not repeated here.

**Time saved:** ~2-3 hours on Phases 1-4 (validation vs discovery)
**Result:** Same quality gates, same mandatory checks, reduced overhead
