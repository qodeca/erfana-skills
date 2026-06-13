# Implement operation – enforcement rules

These rules are extracted from the main implement operation for reference. See [implement.md](implement.md) for the full workflow.

---

## CRITICAL ENFORCEMENT RULES

**These rules are NON-NEGOTIABLE. Violations are automatic failures.**

1. **NO PHASE SKIPPING** - ALL phases MUST execute (Tier determines depth, not skip)
2. **QUALITY GATES MANDATORY** - Every phase ends with a Quality Gate
3. **SEQUENTIAL EXECUTION** - Phase N cannot start until QG-(N-1) = PASS
4. **INPUT CONDITIONS REQUIRED** - Phase CANNOT start if any input condition unchecked
5. **OUTPUT CONDITIONS REQUIRED** - Phase CANNOT complete if any output condition unchecked
6. **3-RETRY LIMIT** - Max 3 retries per phase, then ESCALATE to user
7. **STOP ON FAIL** - If Quality Gate = FAIL after 3 retries, STOP workflow
8. **SOURCE BRANCH REQUIRED** - Implementation MUST start from the repo's default branch (`BASE_BRANCH`, detected at QG-0); the same branch is the diff base, merge target, and abort-cleanup target
9. **CODE REVIEW MANDATORY** - ALL file modifications MUST pass review (Phase 8)
10. **SPEC-READY MODE** - When `spec_maturity >= complete`, phases 1-4 execute in validation mode (reduced depth, same gates). Spec-maturity determines discovery vs validation; tier determines checkpoint frequency.
11. **QG-8/QG-9 SEPARATION** - QG-8 owns code quality exclusively. QG-9 owns plan conformance and acceptance criteria exclusively. Neither re-checks the other's domain.

---

## CODE REVIEW ENFORCEMENT (Rule 9)

**Reference:** `../reference/code-review-standards-2025.md`

**ALL file-modifying operations MUST complete Phase 8 (Quality Review) using agents with:**
- `code-reviewer` capability (primary)
- `architecture-reviewer` capability (Tier 2)
- `code-reviewer` capability (legacy support)

**Review Dimensions (MANDATORY):** stack-conditional dimensions apply only when the project uses that stack (detected at QG-0 / Phase 3); they are skipped, not failed, on other stacks.

| Dimension | Tier 1 | Tier 2 | Blocking | Applies when |
|-----------|:------:|:------:|:--------:|--------------|
| General Security | ✅ | ✅ | YES | always |
| Type Safety | ✅ | ✅ | YES | typed language detected (TypeScript, etc.) |
| Electron/desktop Security | ✅ | ✅ | YES | Electron/desktop project detected |
| Web/frontend Security (XSS, CSP) | ✅ | ✅ | YES | web frontend detected |
| SOLID Principles | Basic | Full | Tier 2 | always |
| Code Smells | Critical | All | Tier 2 | always |
| Complexity | <20 | <15 | YES | always |
| Test Coverage | ≥70% | ≥80% | YES | a test framework is present |

**NO file can be committed without passing Phase 8 review.**

**CRITICAL issues block all progress. No override allowed.**
