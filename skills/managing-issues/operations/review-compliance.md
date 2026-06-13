# Compliance review mode

Spec-compliance audit variant of the Review operation. Hoisted from `operations/review.md` in v4.2.2 to keep that file under the Rule #16 ≤500-line cap.

**Trigger:** User says `"audit code against spec X"`, `"audit implementation against spec X"`, or `"check spec compliance"`. (The legacy `"audit compliance"` phrase was retired in v4.2.2 to disambiguate from `managing-specs` spec-validation domain.)

When compliance scope is selected, the standard Phase 0–4 Review workflow adapts as follows:

- **Phase 0** auto-selects scope = `Compliance`
- **Phase 1** identifies the target spec (user provides ID or auto-detect from branch name)
- **Phase 2** selects compliance depth (replaces standard level selection):

| Depth | Focus | Agent(s) |
|-------|-------|----------|
| **Quick** | Naming contracts only | `mi-spec-compliance-checker` (single pass) |
| **Standard** | All FRs/NFRs coverage | `mi-spec-compliance-checker` (full pass) |
| **Thorough** | Parallel domain scorecard | 4x `feature-dev:code-explorer` + consolidation |

- **Phase 3** executes the audit:

| Step | Action | Agent |
|------|--------|-------|
| 0 | Read spec requirements, extract FRs/NFRs | `mi-spec-compliance-checker` |
| 1 | For quick/standard: run compliance check | `mi-spec-compliance-checker` |
| 1a | For thorough: dispatch 4 parallel domain agents (backend, frontend, IPC/preload, tests/infra) with full spec as reference | Orchestrator dispatches `feature-dev:code-explorer` x4 |
| 2 | Consolidate findings into scorecard | Orchestrator |

- **Phase 4** presents compliance scorecard with prioritized findings:
  - **Must fix** – FR/NFR violations, naming contract breaches
  - **Should fix** – partial implementations, missing edge cases
  - **Consider** – style or pattern deviations from spec intent

**Output format:** Domain totals per category + prioritized action list.

---

## Related

- [review.md](review.md) – parent Review operation (Phase 0–4 standard workflow)
- [agents-reference-mi.md#mi-spec-compliance-checker](../reference/agents-reference-mi.md#mi-spec-compliance-checker) – agent contract used in quick/standard depths
- [examples/review.md](../examples/review.md) – Example 4 walks through the full compliance flow with a real spec
