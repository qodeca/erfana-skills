# Review Operation Examples

Detailed examples showing the Review operation workflow for different scopes and levels.

---

## Example 1: Component Review (Standard)

**User says:** "Review the EditorTab component"

**Workflow:**

```
1. Phase 0: Scope Selection (MANDATORY)
   → Detect "component" from request
   → AskUserQuestion: Confirm scope
   → User confirms: "Component"

2. Phase 1: Target Identification
   → Glob: **/*EditorTab*
   → Found:
     - src/.../EditorTab.tsx
     - src/.../EditorTab.css
     - src/.../EditorTab.test.tsx
   → 3 files identified

3. Phase 2: Level Selection (MANDATORY)
   → AskUserQuestion: "What level of review?"
   → User selects: "Standard"

4. Phase 3: Execute Review
   → Agent: code-reviewer (standard mode)
   → Dimensions: security, anti-patterns, code-quality, basic-solid, testing

   Security Check:
   → Grep for secrets: None found ✓
   → Grep for injection: None found ✓

   Code Quality:
   → File length: 180 lines ✓
   → Naming conventions: Follows codebase ✓
   → Complexity: Reasonable ✓

   SOLID (Basic):
   → SRP: Component handles rendering + context menu (minor concern)
   → DIP: Uses context for services ✓

   Testing:
   → Test coverage: 85% ✓
   → Edge cases: Missing keyboard nav test

5. Phase 4: Present Results

   ## Review Summary

   **Scope:** Component - EditorTab
   **Level:** Standard
   **Files Reviewed:** 3

   ### Findings by Severity
   - Critical: 0
   - High: 0
   - Medium: 2
   - Low: 1

   ### Medium Priority Issues
   1. [SOLID/SRP] Context menu logic could be extracted to hook
   2. [Performance] Menu items array recreated on each render

   ### Low Priority Issues
   1. [Testing] No test for keyboard navigation

   ### Recommendations
   1. Consider extracting context menu to useContextMenu hook
   2. Wrap menu items in useMemo
   3. Add keyboard navigation tests

   → AskUserQuestion: "Would you like me to fix any issues?"
   → User selects: "Done"
```

**Result:** Review complete, 3 findings reported

---

## Example 2: PR/Diff Review (Quick)

**User says:** "Quick review my changes"

**Workflow:**

```
1. Phase 0: Scope Selection (MANDATORY)
   → Detect "changes" from request
   → Detect "quick" from request
   → AskUserQuestion: Confirm scope
   → User confirms: "PR/Diff"

2. Phase 1: Target Identification
   → git diff --name-only main
   → Changed files:
     - src/.../TerminalPanel.tsx
     - src/.../useTerminalStore.ts
     - src/.../terminal.css
   → 3 files identified

3. Phase 2: Level Selection (MANDATORY)
   → Level already specified ("quick")
   → AskUserQuestion to confirm: "Quick"
   → User confirms

4. Phase 3: Execute Review
   → Agent: code-reviewer (quick mode)
   → Dimensions: security, anti-patterns

   Security Check:
   → Grep for secrets: None found ✓
   → Grep for injection: Found exec() usage ⚠️

   Anti-Patterns:
   → No God Objects ✓
   → No Feature Envy ✓

5. Phase 4: Present Results

   ## Review Summary

   **Scope:** PR/Diff
   **Level:** Quick
   **Files Reviewed:** 3

   ### Findings by Severity
   - Critical: 0
   - High: 1
   - Medium: 0
   - Low: 0

   ### High Priority Issues
   1. [Security] exec() usage in useTerminalStore.ts:45
      - Input appears to come from user
      - Ensure command is validated/sanitized

   ### Recommendations
   1. Add input validation before exec() call
   2. Consider using spawn() for safer subprocess control

   → AskUserQuestion: "Would you like me to fix any issues?"
   → User selects: "Fix critical/high"
   → Route to fix workflow
```

**Result:** Review complete, 1 high-priority issue found and fixed

---

## Example 3: Module Review (Deep)

**User says:** "I need a thorough review of the services folder"

**Workflow:**

```
1. Phase 0: Scope Selection (MANDATORY)
   → Detect "services folder" = module
   → Detect "thorough" = deep
   → AskUserQuestion: Confirm scope
   → User confirms: "Module"

2. Phase 1: Target Identification
   → AskUserQuestion: "Which module?"
   → User: "src/main/services/"
   → Glob: src/main/services/**/*.ts
   → Found 12 files

3. Phase 2: Level Selection (MANDATORY)
   → Level hint from "thorough"
   → AskUserQuestion: Confirm "Deep"
   → User confirms

4. Phase 3: Execute Review
   → Agent: code-reviewer (deep mode)
   → Agent: architecture-reviewer (full SOLID)
   → Agent: security-auditor (OWASP)
   → Agent: code-reviewer (quality metrics)

   All Dimensions Analyzed:
   - security ✓
   - anti-patterns ✓
   - code-quality ✓
   - all-solid ✓
   - coupling ✓
   - cohesion ✓
   - performance ✓
   - testing ✓
   - documentation ✓

5. Phase 4: Present Results

   ## Review Summary

   **Scope:** Module - src/main/services/
   **Level:** Deep
   **Files Reviewed:** 12

   ### Findings by Severity
   - Critical: 0
   - High: 2
   - Medium: 8
   - Low: 4

   ### SOLID Analysis
   - SRP: 10/12 files pass
   - OCP: 11/12 files pass
   - LSP: N/A (no inheritance)
   - ISP: 12/12 files pass
   - DIP: 8/12 files pass

   ### Coupling: Medium
   - Some services directly depend on others
   - Recommend interface abstraction

   ### Cohesion: High
   - Services are well-focused

   ### High Priority Issues
   1. [SOLID/DIP] FileService directly instantiates SettingsService
   2. [Security] Path traversal not validated in readFile()

   ### Medium Priority Issues
   1. [SRP] FileService handles both reading AND watching
   2. [Performance] Synchronous file operations in TerminalService
   ... (6 more)

   ### Documentation Gaps
   - 4 services missing JSDoc
   - No architecture overview

   ### Recommendations (Prioritized)
   1. Add path validation in FileService.readFile()
   2. Inject SettingsService via constructor
   3. Split FileService into FileReader and FileWatcher
   4. Add JSDoc to public methods
   5. Create services/README.md

   → AskUserQuestion: "Would you like me to fix any issues?"
   → User selects: "Create issues"
   → Route to Create operation for each high/medium finding
```

**Result:** Comprehensive review complete, 14 findings, 2 GitHub issues created

---

## Example 4: Compliance Review (audit code against spec)

**User says:** "Audit code against spec 021"

**Workflow:**

```
1. Phase 0: Scope Selection (MANDATORY)
   → Detect "audit ... against spec" → auto-select compliance scope
   → AskUserQuestion: confirm "Compliance" scope
   → User confirms

2. Phase 1: Target Identification (compliance variant)
   → Read spec manifest (specs/spec-t3-021-*/manifest.yaml)
   → Extract FR-* and NFR-* requirement IDs
   → Identify codebase paths referenced by spec (or all paths if not specified)
   → 47 requirements identified across 5 sections

3. Phase 2: Compliance Depth Selection (MANDATORY)
   → AskUserQuestion: "What compliance depth?"
   → Options: Quick (naming contracts only) / Standard (all FRs/NFRs) /
              Thorough (parallel domain scorecard)
   → User selects: "Standard"

4. Phase 3: Execute Compliance Audit
   → Agent: mi-spec-compliance-checker (standard mode)
   → Inputs:
       spec_id: "spec-t3-021"
       requirements: [FR-1, FR-2, ..., NFR-7]
       codebase_paths: ["src/", "tests/"]

   For each requirement:
     → Grep codebase for evidence (function names, comments, test descriptions)
     → Classify: matches-spec | intentional-deviation | missing
     → Cite file:line for evidence

   Result counts:
     → matches-spec: 38 / 47 (81%)
     → intentional-deviation: 4 / 47 (8.5%)
     → missing: 5 / 47 (10.6%)

5. Phase 4: Present Compliance Scorecard

   ## Compliance Audit – Spec 021 (LiteParse)

   **Coverage:** 38/47 requirements implemented (81%)
   **Deviations:** 4 intentional, 5 missing

   ### Must Fix (5 missing requirements)
   1. FR-3: Parser handles UTF-8 BOM – no implementation found
      Expected: src/lexer/encoding.ts:detectBOM()
   2. FR-7: Source map preservation – no test coverage
      Expected: tests/lexer/sourcemap.test.ts
   3. NFR-2: Parse time < 100ms for 10k LOC – no benchmark
   4. NFR-5: Memory cap 50MB per parse – no enforcement code
   5. FR-12: Error recovery resumes after invalid token – partial only

   ### Intentional Deviations (4)
   1. FR-9: Spec says "exception", code uses Result<T> pattern
      → Architectural decision in ADR-007; deviation is approved
   2. NFR-3: Spec says "100% test coverage", actual 94%
      → Edge cases marked as "deferred to v0.2" in CHANGELOG
   3-4. (similar)

   ### Naming Contract Audit (separate sub-section)
   - 23/24 named entities match spec contract
   - Mismatch: spec says `LexerResult`, code uses `ParseResult`

   → AskUserQuestion: "Next steps?"
   → Options: Create issues for missing FRs / Update spec to match code /
              Done
```

**Result:** Compliance scorecard with prioritized action list. The user can route findings into the Create operation to file follow-up issues for the 5 missing requirements.

---

## Checkpoint Summary (Review)

| Checkpoint | Review |
|------------|--------|
| Scope Selection | ✓ |
| Level Selection | ✓ |
| **Total** | **2** |
