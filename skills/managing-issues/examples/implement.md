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

Phase 2: Business Analysis (QG-2 non-blocking)
   → 1 search: Any style guide for docs?
   → Requirements clarification (Step 3): a typo fix has no requirement
     ambiguity → no question asked. (Phase 2 asks ONLY when a genuine
     product/scope/acceptance-criteria ambiguity remains - never technical.)
   → Light validation (Tier 1)
   → QG-2: PASS (predicate; no prompt)

Phase 3: Discovery (QG-3 non-blocking)
   → Quick file identification: README.md
   → Light validation (Tier 1)
   → QG-3: PASS (predicate; no prompt)

Phase 4: Architecture (QG-4 non-blocking)
   → Simple fix, no architecture needed
   → Plan recorded + one-line summary (no user approval - technical decision)
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
   → BLOCKING: user confirms the commit message  [stop 1]
   → BLOCKING: branch handling - the Merge+Delete option names the branch
     it deletes, so this single answer authorises the delete  [stop 2]
   → QG-12: PASS
```

**Key Points:**
- ALL 13 phases execute (0-12) - tier determines depth, not skip
- **2 unconditional blocking stops end to end on this clean Tier 1 run**: the
  QG-12 commit confirmation and the QG-12 branch decision. No technical gate
  prompts. QG-0 does not ask for task-type or review-level (both auto-inferred).
- **Conditional stops that did NOT fire here**: a Phase 2 requirements question
  (this typo has no requirement ambiguity), and a public-repo run-state consent
  (this repo is private). Either would add one stop when it applies.
- Tier 1 technical gates are predicate-only (QG-2, QG-3, QG-4, QG-6, QG-8, QG-9,
  QG-11) - recorded, no prompt. QG-9 stays Mandatory on both tiers.
- Mandatory gates still enforced: QG-0, QG-7, QG-9
- User interaction is only: (Phase 2 requirements, when ambiguous), UAT (QG-11,
  automated on Tier 1), and the QG-12 git-action confirmations
- The three sub-gates (QG-4a, QG-4b, QG-11a) are **skipped here**: Tier 1 gets
  `review_level = none`. To get them on a trivial issue, say so when starting the
  run ("implement #42 with the full review") - they then run as Example 2 shows.

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

Phase 2: Business Analysis (QG-2 non-blocking gate; requirements Q&A in Step 3)
   → Agent: mi-requirements-analyzer
   → WebSearch: "chrome style tabs react", "dockview custom tabs"
   → Found: No suitable library, VS Code uses custom implementation
   → Requirements clarification (Step 3): one genuine product ambiguity -
     "should middle-click close a tab?" - BLOCKING requirements question  [stop 1]
     (technical choices like the tab component structure are NOT asked)
   → Recorded + one-line summary
   → QG-2: PASS (predicate; the Step 3 requirements question was the interaction)

Phase 3: Discovery (QG-3 non-blocking)
   → Agent: mi-codebase-explorer
   → Identify: DockviewReact tabs, HeaderComponent
   → Recorded + one-line summary (no user prompt)
   → QG-3: PASS

Phase 4: Architecture (QG-4 non-blocking, then QG-4a + QG-4b)
   → Agent: mi-solution-designer
   → Plan: EditorTab component, context menu, CSS
   → Missing-suite decision: no e2e harness → autonomous "build" (recorded)
   → Architect verification: Plan complete
   → Plan recorded + one-line summary (no user approval)
   → QG-4: PASS

   QG-4a: Design review (Embedded Review – autonomous)
   → Orchestrator fans out architecture-reviewer + solution-reviewer +
     security-auditor in parallel over the design (no /erfana:lens-review)
   → 2 CRITICAL/HIGH findings → mi-solution-designer revises the design → resolved
   → QG-4a: PASS

   QG-4b: Architecture judgment (Judgment – autonomous)
   → Judge (mi-solution-designer) triages MED/LOW: 1 fix, 1 tech-debt, 1 dropped
   → QG-4b: PASS

Phase 5: Implementation (QG-5 Automated)
   → Agent: software-developer → Create EditorTab.tsx
   → Agent: test-writer → Create EditorTab.test.tsx
   → Agent: e2e-test-writer → Build the e2e suite chosen at QG-4
   → Typecheck: PASS, Lint: PASS
   → Risk matrix (task_type = feature, has_ui_impact = true):
     unit + integration + e2e all exit 0
   → QG-5: PASS

Phase 6: Architectural Review (QG-6 non-blocking)
   → Agent: architecture-reviewer
   → SOLID analysis: Pass
   → Recorded + one-line summary (no user prompt)
   → QG-6: PASS

Phase 7: Security (QG-7 Mandatory)
   → Agent: security-auditor
   → npm audit: Pass
   → OWASP: Pass (Tier 2 full audit)
   → QG-7: PASS

Phase 8: Quality Review-and-Fix (QG-8 Embedded Review – autonomous)
   → Parallel fan-out: code-reviewer + architecture-reviewer + security-auditor + test-writer
   → Maintainability: 78/100; 1 HIGH auto-fixed and re-verified inline
   → MED/LOW → judge: 2 tech-debt, 1 dropped
   → QG-8: PASS

Phase 9: Verification (QG-9 Mandatory)
   → Agent: mi-solution-designer (verify mode)
   → Implementation matches plan: VERIFIED
   → QG-9: PASS

Phase 10: Documentation (QG-10 Automated)
   → Agent: mi-docs-updater
   → CLAUDE.md updated with new feature
   → QG-10: PASS

Phase 11: UAT (QG-11a pre-step, then QG-11 User-Approval – UAT acceptance gate)
   QG-11a: Implementation review-and-fix (Embedded Review – autonomous)
   → Runs after every other gate has passed, before a human touches the app
   → Orchestrator fans out code-reviewer + architecture-reviewer +
     security-auditor + test-writer in parallel over the change set
   → 1 CRITICAL/HIGH finding → auto-fixed → delta re-review of the fix → PASS
   → MED/LOW → judge; loop bounded by embedded_loop_iter (3 rounds)
   → QG-11a: PASS

   → Detected BUILD_CMD && DEV_CMD
   → User tests acceptance criteria  ← the run's one human decision gate
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
- 13 phase gates (QG-0 through QG-12) plus 3 embedded review sub-gates (QG-4a,
  QG-4b, QG-11a), which run at the Tier 2 default review level and add no phases
- **No architecture/technical decision is made by asking.** The design, build,
  review and fix loop resolves every technical choice by best practice + web
  research + judgment - no user approval. The interactions on this run: the
  Phase 2 **requirements** question (middle-click behaviour), UAT (QG-11), and
  the two QG-12 git-action confirmations - plus a public-repo run-state consent
  when the repo is public. QG-0 asks for neither task-type nor review-level
  (both auto-inferred).
- Requirements (what to build) may be asked in Phase 2; technical/architecture
  choices (how to build it) never are
- Pre-UAT technical gates are non-blocking Judgment / Embedded Review gates: each
  records its result and emits a one-line status summary the user can watch
- Mandatory gates enforced: QG-0, QG-7, QG-9
- The orchestrator never invokes `/erfana:lens-review` - QG-4a, QG-8 and QG-11a
  fan out its own reviewer agents in parallel and the mi-solution-designer JUDGE
  mode triages MEDIUM/LOW findings (CRITICAL/HIGH auto-fixed); the loop is capped
  at 3 fix rounds by embedded_loop_iter
- Full OWASP security audit for Tier 2

---

## Quality Gate Summary (Implement)

| Quality Gate | Phase | Tier 1 | Tier 2 | Can Override |
|--------------|-------|--------|--------|--------------|
| QG-0: Pre-flight | 0 | Mandatory | Mandatory | No |
| QG-1: Agent Selection | 1 | Automated | Automated | No |
| QG-2: Business Analysis | 2 | Automated | Judgment (non-blocking) | No |
| QG-3: Discovery | 3 | Automated | Judgment (non-blocking) | No |
| QG-4: Architecture | 4 | Judgment (non-blocking) | Judgment (non-blocking) | No |
| QG-4a: Design review | 4 | Skipped | Embedded Review (`full` / `design`) | No |
| QG-4b: Architecture judgment | 4 | Skipped | Judgment (`full` / `design`) | No |
| QG-5: Implementation | 5 | Automated | Automated | No |
| QG-6: Architectural Review | 6 | Automated | Judgment (non-blocking) | No |
| QG-7: Security | 7 | Mandatory | Mandatory | No |
| QG-8: Quality Review | 8 | Automated | Embedded Review-and-Fix | No |
| QG-9: Verification | 9 | Mandatory | Mandatory | No |
| QG-10: Documentation | 10 | Automated | Automated | No |
| QG-11a: Implementation review | 11 | Skipped | Embedded Review-and-Fix (`full` only) | No |
| QG-11: UAT | 11 | Automated | **User-Approval** | **YES – UAT acceptance** |
| QG-12: Finalization | 12 | User-Approval | User-Approval | YES (git actions) |

13 phase gates plus 3 sub-gates. The sub-gates run inside Phases 4 and 11 per the
`review_level` auto-defaulted at QG-0 (Tier 2 → `full`, Tier 1 → `none`; no prompt)
and add no phases. No technical gate blocks on the user: QG-11 (UAT) is the only
*gate* that does, and QG-12 confirms the irreversible git actions. Separately, the
Phase 2 business-analysis phase may ask a **requirements** question in its Step 3
(product/scope only, never technical) - that is an in-phase interaction, not a gate.

**Gate Types:**
- **Mandatory**: MUST pass, cannot be overridden (QG-0, QG-7, QG-9)
- **Judgment (non-blocking)**: pre-UAT gate decided on agent output; recorded + summarised, no `AskUserQuestion`
- **Embedded Review(-and-Fix)**: autonomous reviewer fan-out + judge (QG-4a, QG-8, QG-11a); never `/erfana:lens-review`
- **User-Approval**: requires explicit user consent (QG-11 UAT; QG-12 finalization)
- **Automated**: Passes on a concrete exit-code predicate

---

## Edge case examples

Five further walkthroughs - agent-selection failure, retry exhaustion, post-UAT
re-review, aborted-run recovery, and spec-ready mode - live in
[implement-edge-cases.md](implement-edge-cases.md), split out of this file to
keep both under the 500-line cap.
