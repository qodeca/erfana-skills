# Shared phase-requirements vocabulary

Cross-cutting vocabulary used by all four operation-specific phase-requirements files in this skill (`implement-phase-requirements.md`, `create-phase-requirements.md`, `review-phase-requirements.md`, `conditional-phase-requirements.md`).

Extracted from `implement-phase-requirements.md` in v4.2.2 (D5) so each operation file cross-references the same source rather than implicitly making "implement" canonical.

---

## Capability vocabulary

| Category | Capabilities |
|----------|--------------|
| **Search** | codebase-exploration, file-search, code-search, web-search, pattern-matching |
| **Analysis** | requirements-analysis, prior-art-research, code-analysis, architecture-review, quality-assessment, complexity-analysis |
| **Development** | code-generation, file-editing, test-generation, refactoring |
| **Review** | code-review, security-scanning, vulnerability-detection, anti-pattern-detection, SOLID-principles, solution-design-review, design-validation, coherence-analysis |
| **UX** | ux-design, accessibility-audit, heuristic-evaluation, platform-compliance, design-system-review |
| **Documentation** | documentation-generation, issue-drafting, template-application, commit-message-generation |
| **Infrastructure** | git-operations, gh-cli, validation, test-execution |
| **Interaction** | user-interaction, demonstration, acceptance-criteria-verification |
| **Display** (added v4.2.2) | github-issue-read, github-issue-list, github-issue-search, format-markdown |

---

## Domain vocabulary

| Domain | Description | Domain | Description |
|--------|-------------|--------|-------------|
| infrastructure | Git, CLI, system ops | architecture | Design, planning, structure |
| analysis | Requirements, research | development | Code writing, implementation |
| exploration | Codebase discovery | review | Quality, security review |
| documentation | Docs, issues, comments | verification | Testing, acceptance criteria |
| acceptance | User validation, UAT | security | Vulnerability detection |
| ux | UX design, accessibility, usability | display | Read-only issue presentation (added v4.2.2) |

---

## Criticality levels

| Level | Auto-select threshold | Fallback allowed |
|-------|----------------------|------------------|
| mandatory | 80% | No – must have agent or escalate |
| high | 80% | Only with user justification (even if allow_direct=true) |
| low | 60% | Yes – but still prefer agent delegation |

---

## Allow_direct policy (CONTEXT PRESERVATION)

**The `allow_direct` flag is RESTRICTIVE, not permissive.** Direct execution is ONLY for trivial orchestration (<3 tool calls, no file reading/code analysis/content generation).

| Pattern | allow_direct | Examples |
|---------|:---:|---------|
| User interaction only | true | `AskUserQuestion` for confirmations, choices, clarifications |
| Trivial validation (no file reading) | true | `git status`, `gh issue view <num>` |
| Status reporting (no content generation) | true | `TodoWrite` phase completion, workflow transitions |
| Any file reading | false | Even a single config file loads into orchestrator context |
| Content generation | false | Documentation, commit messages, issue descriptions |
| Search/analysis/multi-step (>3 calls) | false | Compounds context cost rapidly |

### Policy enforcement

- **`allow_direct: false`** – agent delegation is MANDATORY. No matching agent (≥80%) → escalate to user.
- **`allow_direct: true`** – agent delegation is STILL preferred. Log context cost warning on direct execution.

**Context preservation rationale:** Orchestrator context is shared across ALL phases. File reading costs 500-2000 tokens per file; 5 files ≈ losing an entire phase's context.

---

## Used by

- [implement-phase-requirements.md](implement-phase-requirements.md) – Implement operation phase definitions (0-12)
- [create-phase-requirements.md](create-phase-requirements.md) – Create operation phase definitions (1-5)
- [review-phase-requirements.md](review-phase-requirements.md) – Review operation phase definitions (0-4)
- [conditional-phase-requirements.md](conditional-phase-requirements.md) – Conditional phases (bug-investigation, refactor-advisor, docs-fixer triggers)

Display operation has no phase-to-agent matching surface (read-only; static agent assignment to `mi-issue-displayer`), so it does not consume this vocabulary.
