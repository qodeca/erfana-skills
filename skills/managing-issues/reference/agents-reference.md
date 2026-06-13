# Agent Reference Guide

Quick reference for selecting and using embedded agents during issue management.

---

## Agent Overview

All agents are plugin-root shared agents (the plugin's top-level `agents/` directory), resolved by `subagent_type`, with full input/output contracts. SKILL.md's "Quick reference" table is the canonical phase/effort/model roster; the tables below are purpose-oriented overviews.

### Create Operation Agents

| Agent | Purpose |
|-------|---------|
| mi-issue-questioner | Propose clarifying questions for the orchestrator to ask (Phase 2) |
| mi-duplicate-finder | Read-only `gh` duplicate search with sanitized keywords (Phase 3) |
| mi-issue-drafter | Draft GitHub issues following templates, Read-only (Phase 4) |

### Review Operation Agents

| Agent | Purpose |
|-------|---------|
| code-reviewer | Orchestrate standalone code reviews by scope and level |

*Note: Review operation also reuses Implement agents (architecture-reviewer, security-auditor) for deep analysis.*

### Implement Operation Agents (Core Workflow)

| Agent | Phase | Purpose |
|-------|-------|---------|
| mi-requirements-analyzer | 2 | Prior art research + requirements |
| mi-codebase-explorer | 3 | Find files and patterns |
| mi-solution-designer | 4, 9 | Plan + verify implementation |
| software-developer | 5 | Write production code |
| test-writer | 5 | Generate tests across new code paths |
| architecture-reviewer | 6 | SOLID principles, coupling, patterns |
| security-auditor | 7 | Security scanning |
| code-reviewer | 8 | Comprehensive quality review |
| mi-docs-updater | 10 | Update documentation |
| commit-writer | 12 | Generate commit messages |

### Release Agents (Used by releasing-erfana skill)

| Agent | Purpose |
|-------|---------|
| mi-release-preparer | Prepare releases (not part of Implement operation) |

### Conditional Agents

| Agent | Trigger | Purpose |
|-------|---------|---------|
| bug-investigator | `bug` label | Root cause analysis |
| refactor-advisor | `refactor` label | Code smell detection |
| mi-docs-fixer | Tier 1 doc issues | Quick doc fixes |
| ux-designer | `has_ui_impact = true` | UX design specifications for UI features |
| ux-reviewer | `has_ui_impact = true` | UX audit: heuristics, accessibility, platform compliance |
| mi-spec-compliance-checker | `spec_maturity >= complete` | FR/NFR compliance scorecard against originating spec |

---

## Agent Selection Decision Tree

```
Start: What operation are you in?
│
├── Create Operation
│   ├── Phase 2: mi-issue-questioner (proposes questions; orchestrator asks)
│   ├── Phase 3: mi-duplicate-finder (read-only gh search)
│   └── Phase 4: mi-issue-drafter (fills template)
│
├── Review Operation
│   │
│   ├── Quick Level
│   │   └── code-reviewer (security, anti-patterns)
│   │
│   ├── Standard Level
│   │   ├── code-reviewer (orchestrator)
│   │   ├── security-auditor (security)
│   │   └── ux-reviewer (if UI files in scope)
│   │
│   └── Deep Level
│       ├── code-reviewer (orchestrator)
│       ├── architecture-reviewer (SOLID)
│       ├── security-auditor (OWASP)
│       └── ux-reviewer (if UI files in scope)
│
└── Implement Operation: What phase are you in?
    │
    ├── Phase 1: Agent Selection
    │   └── (dynamic agent discovery and matching)
    │
    ├── Phase 2: Business Analysis
    │   └── mi-requirements-analyzer
    │
    ├── Phase 3: Discovery
    │   └── mi-codebase-explorer
    │
    ├── Phase 4: Architecture
    │   └── mi-solution-designer
    │
    ├── Phase 5: Implementation
    │   ├── Code → software-developer
    │   └── Tests → test-writer
    │
    ├── Phase 6: Architectural Review
    │   └── architecture-reviewer
    │
    ├── Phase 7: Security
    │   └── security-auditor
    │
    ├── Phase 8: Quality Review
    │   └── code-reviewer
    │
    ├── Phase 9: Verification
    │   ├── mi-solution-designer (verify mode)
    │   └── mi-spec-compliance-checker (when spec linked)
    │
    ├── Phase 10: Documentation
    │   └── mi-docs-updater
    │
    ├── Phase 11: UAT
    │   └── (manual user testing)
    │
    └── Phase 12: Finalization
        └── commit-writer
```

*Note: Release functionality is handled by the separate `releasing-erfana` skill.*

### By Issue Label

| Label | Primary Agent | Supporting |
|-------|---------------|------------|
| `bug` | bug-investigator | software-developer, test-writer |
| `enhancement` | mi-requirements-analyzer | mi-solution-designer, software-developer |
| `documentation` | mi-docs-fixer or mi-docs-updater | - |
| `refactor` | refactor-advisor | software-developer, code-reviewer |
| `security` | security-auditor | software-developer |
| `frontend`, `ui`, `ux` | ux-designer, ux-reviewer | react-developer, software-developer |

---

Detailed specifications live in sibling files, each linked directly from SKILL.md (one level deep): [agents-reference-detail.md](agents-reference-detail.md) (generic shared agents, invocation patterns, error recovery, quality thresholds), [agents-reference-mi.md](agents-reference-mi.md) (`mi-*` family), and [agents-reference-ux.md](agents-reference-ux.md) (UX agents).
