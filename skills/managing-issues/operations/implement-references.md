# Implement Operation – Reference Index

Hoisted from `operations/implement.md` (W4 of v4.2.2 to keep that file under the 500-line cap). All cross-references for the Implement operation in one place.

---

## Phase Files

| Phase | File |
|-------|------|
| 0 | [phases/0-preflight.md](../phases/0-preflight.md) |
| 1 | [phases/1-agent-selection.md](../phases/1-agent-selection.md) |
| 2 | [phases/2-business-analysis.md](../phases/2-business-analysis.md) |
| 3 | [phases/3-discovery.md](../phases/3-discovery.md) |
| 4 | [phases/4-architecture.md](../phases/4-architecture.md) |
| 5 | [phases/5-implementation.md](../phases/5-implementation.md) |
| 6 | [phases/6-architectural-review.md](../phases/6-architectural-review.md) |
| 7 | [phases/7-security.md](../phases/7-security.md) |
| 8 | [phases/8-quality-review.md](../phases/8-quality-review.md) |
| 9 | [phases/9-verification.md](../phases/9-verification.md) |
| 10 | [phases/10-documentation.md](../phases/10-documentation.md) |
| 11 | [phases/11-uat.md](../phases/11-uat.md) |
| 12 | [phases/12-finalization.md](../phases/12-finalization.md) |

---

## Phase requirements

Per-operation phase requirement files (split from the legacy single `phase-requirements.md` in v4.2.1 F1). Shared vocabulary lives in its own dedicated file as of v4.2.2 (D5).

| File | Contents |
|------|----------|
| [reference/phase-requirements-shared.md](../reference/phase-requirements-shared.md) | Capability vocab, domain vocab, criticality levels, allow-direct policy (cross-cutting) |
| [reference/implement-phase-requirements.md](../reference/implement-phase-requirements.md) | Implement operation phases (0-12) capability requirements |
| [reference/create-phase-requirements.md](../reference/create-phase-requirements.md) | Create operation phases (1-5) capability requirements |
| [reference/review-phase-requirements.md](../reference/review-phase-requirements.md) | Review operation phases (0-4) capability requirements |
| [reference/conditional-phase-requirements.md](../reference/conditional-phase-requirements.md) | Conditional phases (bug-investigator, refactor-advisor, docs-fixer triggers) |

---

## Agents used by Implement

Selection is dynamic at Phase 1 — the discoverer + matcher agents resolve the active set per issue.

| Agent | Role |
|-------|------|
| `mi-agent-discoverer` | Discovers available builtin + shared agents |
| `mi-agent-matcher` | Scores discovered agents against per-phase capability requirements |
| `mi-requirements-analyzer` | Phase 2 (Business Analysis) |
| `mi-codebase-explorer` | Phase 3 (Discovery) |
| `mi-solution-designer` | Phase 4 (Architecture) + Phase 9 (Verification) |
| `software-developer` | Phase 5 (Implementation) |
| `test-writer` | Phase 5 (Implementation) |
| `architecture-reviewer` | Phase 6 (Architectural Review) |
| `security-auditor` | Phase 7 (Security) |
| `code-reviewer` | Phase 8 (Quality Review) |
| `ux-reviewer` | Phase 8 (Quality Review, UI files) |
| `mi-spec-compliance-checker` | Phase 9 (Verification, spec-ready mode) |
| `mi-docs-updater` | Phase 10 (Documentation) |
| `commit-writer` | Phase 12 (Finalization) |

Conditional agents (label-triggered): `bug-investigator` (`bug` label), `refactor-advisor` (`refactor` label), `mi-docs-fixer` (Tier 1 docs).

Full per-agent specs are split across three reference files (v4.2.2 hoist):
- [reference/agents-reference-detail.md](../reference/agents-reference-detail.md) – generic shared agents (code-reviewer, software-developer, security-auditor, etc.)
- [reference/agents-reference-mi.md](../reference/agents-reference-mi.md) – mi-* family (mi-issue-displayer, mi-issue-drafter, mi-requirements-analyzer, etc.)
- [reference/agents-reference-ux.md](../reference/agents-reference-ux.md) – UX agents (ux-designer, ux-reviewer, conditional on `has_ui_impact`)

---

## Related references

- [reference/code-review-standards-2025.md](../reference/code-review-standards-2025.md) – Phase 8 review dimensions
- [reference/post-review-tracking.md](../reference/post-review-tracking.md) – Phase 12 re-review enforcement
- [reference/parallel-review.md](../reference/parallel-review.md) – Multi-agent parallel review patterns
- [reference/delta-review.md](../reference/delta-review.md) – Lightweight re-review for small post-UAT changes
- [reference/design-system-checklist.md](../reference/design-system-checklist.md) – Phase 8 token compliance
- [reference/claude-code-friendly-issues.md](../reference/claude-code-friendly-issues.md) – Issue authoring principles (Create operation)
