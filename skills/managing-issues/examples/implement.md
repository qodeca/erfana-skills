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
   → Tier 1 → review_level = none, not asked: QG-4a, QG-4b, QG-11a do not run
   → Private repo → run-state comment written, no consent prompt
   → Create branch: git checkout -b docs/42-fix-readme-typo
   → QG-0: PASS

Phase 1: Agent Selection (QG-1 Automated)
   → Discover agents: mi-docs-fixer available
   → Match: full coverage of the Phase 5 docs capabilities
   → Auto-select mi-docs-fixer
   → QG-1: PASS (automated)

Phase 2: Business Analysis (QG-2 Automated)
   → 1 search: Any style guide for docs?
   → BLOCKING: requirements questionnaire - 1 question, asked on both
     tiers (Step 3)  [stop 1]
   → Light validation (Tier 1)
   → QG-2: PASS (automated - the gate is a predicate; the questionnaire
     inside the phase is the stop)

Phase 3: Discovery (QG-3 Automated)
   → Quick file identification: README.md
   → Light validation (Tier 1)
   → QG-3: PASS (automated)

Phase 4: Architecture (QG-4 User-Approval)
   → Simple fix, no architecture needed
   → BLOCKING: user approves the one-line plan  [stop 2]
   → QG-4: PASS

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
   → Predicate: VERIFIED, criteria met, tests + typecheck exit 0
   → QG-9: PASS (no prompt - Tier 1 is predicate-only)

Phase 10: Documentation (QG-10 Automated)
   → No documentation surface this change affects; decision recorded
   → QG-10: PASS (recorded statement, no markdown edit forced)

Phase 11: UAT (QG-11 Automated)
   → Visual check of README
   → QG-11: PASS (automated for Tier 1)

Phase 12: Finalization (QG-12 User-Approval)
   → Every gate in scope recorded PASS; QG-4a/4b/11a recorded skipped
     (review_level = none) - a level-appropriate skip, not a STOP
   → Commit: "docs: fix typo in README - Closes #42" (explicit file list, never git add -A)
   → BLOCKING: user approves the commit message  [stop 3]
   → BLOCKING: branch handling - the Merge+Delete option names the branch
     it deletes, so this single answer authorises the delete  [stop 4]
   → QG-12: PASS
```

**Key Points:**
- ALL 13 phases execute (0-12) - tier determines depth, not skip
- **4 unconditional blocking stops end to end**: the Phase 2 requirements
  questionnaire, QG-4, the QG-12 commit approval, the QG-12 branch decision.
  Conditionals on top, one each: a public repo (run-state consent), labels that
  do not pin the task type, and any blocking test category with no harness
- Tier 1 gates are predicate-only where an honest exit-code check exists -
  including QG-9, which is Mandatory on both tiers but prompts on Tier 2 only
- Mandatory gates still enforced: QG-0, QG-7, QG-9
- User approval required for: QG-4 and QG-12 on every tier
- The three sub-gates (QG-4a, QG-4b, QG-11a) are **skipped here**: Tier 1 gets
  `review_level = none` and is not asked about it. To get them on a trivial
  issue, say so when starting the run ("implement #42 with the full review") -
  they then run exactly as Example 2 shows.

---

## Example 2: Standard Feature (Tier 2)

**Issue:** #11 - Add Chrome-style tabs

**Labels:** `enhancement`

**Workflow:**

```
Phase 0: Pre-flight (QG-0 Mandatory)
   → Issue open? ✓
   → Tests pass? ✓
   → BLOCKING: review level (Tier 2) → user picks "Both reviews"
     → review_level = full: QG-4a, QG-4b and QG-11a all run
     ("Design only" drops QG-11a; "Neither" drops all three)
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
   → BLOCKING: requirements questionnaire, 3-5 questions batched
     (Step 3): Reference=VS Code, Scope=defined
   → BLOCKING: user reviews research findings (QG-2 checkpoint)
   → QG-2: PASS

Phase 3: Discovery (QG-3 Checkpoint)
   → Agent: mi-codebase-explorer
   → Identify: DockviewReact tabs, HeaderComponent
   → User confirms understanding
   → QG-3: PASS

Phase 4: Architecture (QG-4 User-Approval, then QG-4a + QG-4b)
   → Agent: mi-solution-designer
   → Plan: EditorTab component, context menu, CSS
   → Missing-suite decision: no e2e harness → user picks "build"
   → Architect verification: Plan complete
   → User approves plan
   → QG-4: PASS

   QG-4a: Design lens review (User-Run Review)
   → Orchestrator prints the command and ENDS THE TURN:
     /erfana:lens-review <design path> --out .lens-reports/lens-qg4a-issue-11.md
   → User runs it, returns the report path
   → 2 MUST FIX findings → designer enhances the design → all resolved
   → QG-4a: PASS

   QG-4b: Architecture acceptance (User-Approval)
   → Reviewed design + finding resolutions presented
   → User: Accept
   → QG-4b: PASS

Phase 5: Implementation (QG-5 Automated)
   → Agent: software-developer → Create EditorTab.tsx
   → Agent: test-writer → Create EditorTab.test.tsx
   → Agent: e2e-test-writer → Build the e2e suite chosen at QG-4
   → Typecheck: PASS, Lint: PASS
   → Risk matrix (task_type = feature, has_ui_impact = true):
     unit + integration + e2e all exit 0
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

Phase 11: UAT (QG-11a pre-step, then QG-11 User-Approval)
   QG-11a: Implementation lens review (User-Run Review)
   → Runs after every other gate has passed, before a human touches the app
   → Orchestrator prints the command and ENDS THE TURN:
     /erfana:lens-review "<changed-file list>" --out .lens-reports/lens-qg11a-issue-11.md
   → User runs it, returns the report path
   → 1 MUST FIX finding → fixed → delta re-review of the fix → PASS
   → QG-11a: PASS

   → Detected BUILD_CMD && DEV_CMD
   → User tests acceptance criteria
   → QG-11: PASS

Phase 12: Finalization (QG-12 User-Approval)
   → Every gate in scope asserted PASS (QG-0..QG-12 + QG-4a, QG-4b, QG-11a)
   → Agent: commit-writer
   → Stage the explicit planned file list (never git add -A)
   → Commit: "feat(tabs): add Chrome-style dynamic tabs - Closes #11"
   → User approves commit
   → Merge to the detected BASE_BRANCH and delete branch
   → QG-12: PASS
```

**Key Points:**
- ALL 13 phases execute (0-12)
- 13 phase gates (QG-0 through QG-12) plus 3 sub-gates (QG-4a, QG-4b, QG-11a),
  which run at the Tier 2 default review level and add no phases
- **14 unconditional stops at `review_level = full`**: 12 blocking prompts plus
  the 2 turn-ending lens checkpoints. The 12 prompts are the QG-0 review level,
  the Phase 2 questionnaire, QG-2, QG-3, QG-4, QG-4b, QG-6, QG-8, QG-9's
  Definition-of-Done confirmation, QG-11, the QG-12 commit approval and the
  QG-12 branch decision. `design` drops the QG-11a checkpoint (13); `neither`
  drops QG-4b and both checkpoints (11)
- **17 on the realistic default** – an unlabeled issue on a public repo with no
  e2e harness adds the task-type question, the run-state consent prompt and one
  missing-harness decision. Phase 11 offers two further interactions (the
  optional multi-agent review, and the early-UAT choice when every criterion
  has an automated test), so a typical run lands at **18-19**. This walkthrough
  is labeled `enhancement` and shows the harness decision, so it sits at 15
- Tier 2 uses Checkpoint gates (user reviews findings)
- Mandatory gates enforced: QG-0, QG-7, QG-9
- The orchestrator never invokes `/erfana:lens-review` - it prints the command
  and ends the turn; the user runs it and returns the report path
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
| QG-4a: Design lens review | 4 | Skipped | User-Run Review (`full` / `design`) | **NO** (once in scope) |
| QG-4b: Architecture acceptance | 4 | Skipped | User-Approval (`full` / `design`) | **NO** (once in scope) |
| QG-5: Implementation | 5 | Automated | Automated | Yes |
| QG-6: Architectural Review | 6 | Automated | Checkpoint | Yes |
| QG-7: Security | 7 | Mandatory | Mandatory | **NO** |
| QG-8: Quality Review | 8 | Automated | Checkpoint | Yes |
| QG-9: Verification | 9 | Mandatory | Mandatory | **NO** |
| QG-10: Documentation | 10 | Automated | Automated | Yes |
| QG-11a: Implementation lens review | 11 | Skipped | User-Run Review (`full` only) | **NO** (once in scope) |
| QG-11: UAT | 11 | Automated | User-Approval | Yes |
| QG-12: Finalization | 12 | User-Approval | User-Approval | Yes |

13 phase gates plus 3 sub-gates. The sub-gates run inside Phases 4 and 11 per the
`review_level` chosen at QG-0 - Tier 2 is asked (default `full`), Tier 1 gets
`none` without being asked - and add no phases.

**Gate Types:**
- **Mandatory**: MUST pass, cannot be overridden (QG-0, QG-7, QG-9)
- **Checkpoint**: User reviews findings before proceeding (Tier 2 only)
- **User-Approval**: Requires explicit user consent (`AskUserQuestion`)
- **User-Run Review**: The *user* runs `/erfana:lens-review` and returns the report path; the gate prints the command and ends the turn
- **Automated**: Passes on a concrete exit-code predicate

---

## Edge case examples

Five further walkthroughs - agent-selection failure, retry exhaustion, post-UAT
re-review, aborted-run recovery, and spec-ready mode - live in
[implement-edge-cases.md](implement-edge-cases.md), split out of this file to
keep both under the 500-line cap.
