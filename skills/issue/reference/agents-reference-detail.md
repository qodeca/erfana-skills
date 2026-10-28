Continuation of [agents-reference.md](agents-reference.md).

This file documents the generic shared agents (code-reviewer, software-developer, architecture-reviewer, security-auditor, test-writer, commit-writer, bug-investigator, refactor-advisor) plus the universal "When NOT to Use", "Agent Invocation Pattern", "Error Recovery", and "Quality Thresholds" sections. `mi-*` agent details are in [agents-reference-mi.md](agents-reference-mi.md); UX agent details (ux-designer, ux-reviewer) in [agents-reference-ux.md](agents-reference-ux.md). Both are linked directly from SKILL.md.

## Agent Details

### code-reviewer

**Operation:** Review, Implement (Phase 8) | **File:** `agents/code-reviewer.md` | **Effort/Model:** `xhigh` / `opus` (deep reviewer)

**Modes (by level):**
- `quick`: Security and anti-patterns only
- `standard`: + Code quality, basic SOLID, testing
- `deep`: + All SOLID, coupling, cohesion, performance, documentation

**Inputs:**
- scope (file, component, module, feature, pr, codebase)
- level (quick, standard, deep)
- target_files, dimensions

**Outputs:**
- review_status, scope, level, files_reviewed, findings, summary, recommendations

**Use When:**
- Standalone code review (not tied to issue)
- PR review before merge
- Component/module quality check
- Phase 8 quality review
- Comprehensive pre-commit review

**Key Features:**
- ALWAYS asks for scope and level
- Supports 6 review scopes
- 3 review levels with increasing depth
- 10 review dimensions
- Categorizes findings by severity (critical/high/medium/low)
- Coordinates architecture-reviewer and security-auditor for deep reviews

---

### software-developer

**Phase:** 5 (Implementation) | **File:** `agents/software-developer.md` | **Effort/Model:** `xhigh` / `opus` (file-creator: production code)

**Inputs:**
- issue_number, implementation_plan, step_number, patterns_to_follow

**Outputs:**
- files_created, files_modified, implementation_notes, typecheck_status

**Use When:**
- Writing new components
- Modifying existing code
- Following approved plan

**Constraints:**
- NEVER add features not in plan
- NEVER refactor surrounding code
- ALWAYS verify typecheck

---

### test-writer

**Phase:** 5 (Implementation) | **File:** `agents/test-writer.md` | **Effort/Model:** `medium` / `opus` (validator: pattern-driven test generation)

**Inputs:**
- issue_number, files_to_test, acceptance_criteria, test_strategy

**Outputs:**
- test_files_created, test_count, coverage_estimate, scenarios_covered

**Use When:**
- After implementation
- During TDD
- Improving coverage

**Target:** >80% coverage for new code

---

### architecture-reviewer

**Phase:** 6 (Architectural Review) | **File:** `agents/architecture-reviewer.md` | **Effort/Model:** `xhigh` / `opus` (deep reviewer)

**Inputs:**
- issue_number, files_changed, implementation_plan, tier, codebase_patterns

**Outputs:**
- assessment, solid_analysis, coupling_score, cohesion_score, findings, critical_issues, recommendations, technical_debt

**Use When:**
- After implementation complete (Tier 2)
- Validating SOLID principles
- Assessing coupling and cohesion
- Checking design pattern usage

**Key Evaluations:**
| Principle | Check |
|-----------|-------|
| Single Responsibility | ONE reason to change per component |
| Open/Closed | Extensible without modification |
| Liskov Substitution | Subtypes replaceable |
| Interface Segregation | Minimal, focused interfaces |
| Dependency Inversion | Depend on abstractions |

**Assessment Outcomes:**
- SOUND: No critical issues, max 2 high
- NEEDS_IMPROVEMENT: High issues or multiple medium
- ARCHITECTURAL_ISSUES: Has critical issues

---

### code-reviewer (Phase 8 mode)

**Phase:** 8 (Quality Review) | **File:** `agents/code-reviewer.md` | **Effort/Model:** `xhigh` / `opus` (deep reviewer)

**Description:**
Orchestrates multi-dimension code review by coordinating security scanning, architecture review, and code quality assessment into a single unified review.

**Inputs:**
- issue_number, files_changed, tier, acceptance_criteria

**Outputs:**
- review_status (APPROVED, NEEDS_CHANGES, BLOCKED)
- dimensions_evaluated (security, architecture, code_quality, testing)
- findings (by dimension and severity)
- critical_count, high_count, medium_count, low_count
- blocking_issues
- recommendations

**Review Dimensions:**
| Dimension | Tier 1 | Tier 2 |
|-----------|--------|--------|
| Electron Security | ✅ | ✅ |
| General Security | ✅ | ✅ |
| TypeScript Safety | ✅ | ✅ |
| SOLID Principles | Basic | Full |
| Code Smells | Critical | All |
| Complexity | <20 | <15 |
| Test Coverage | ≥70% | ≥80% |

**Use When:**
- Phase 8 (Quality Review) for all implementations
- Comprehensive pre-commit review needed
- Combining multiple review perspectives

**Key Features:**
- MANDATORY for all file modifications
- Coordinates architecture-reviewer, security-auditor
- Single unified report with all findings
- CRITICAL issues block all progress (no override)

**Assessment Outcomes:**
- APPROVED: No critical/high issues, tests pass
- NEEDS_CHANGES: Has high issues or gaps
- BLOCKED: Has critical issues (cannot proceed)

---

### security-auditor

**Phase:** 7 (Security) | **File:** `agents/security-auditor.md` | **Effort/Model:** `xhigh` / `opus` (deep auditor)

**Inputs:**
- issue_number, files_changed, issue_labels, tier, ipc_handlers_modified

**Outputs:**
- audit_status, vulnerabilities, npm_audit_result, owasp_checklist, blocking_issues

**Use When:**
- All tiers (basic scan for Tier 1, full audit for Tier 2)
- Security label present

---

### commit-writer

**Phase:** 12 (Finalization) | **File:** `agents/commit-writer.md` | **Effort/Model:** `medium` / `opus` (validator: commit-message generation from diff)

**Inputs:**
- issue_number, issue_summary, commit_type

**Outputs:**
- commit_message, commit_type, commit_scope, pr_description

**Use When:**
- Before commits
- Creating PRs
- Generating changelogs

---

### bug-investigator

**Conditional:** `bug` label | **File:** `agents/bug-investigator.md` | **Effort/Model:** `xhigh` / `opus` (deep root-cause analysis)

**Inputs:**
- issue_number, issue_body, symptoms, reproduction_steps

**Outputs:**
- root_cause, execution_trace, affected_files, fix_recommendations

**Use When:**
- Bug investigation
- Root cause analysis
- Diagnosing errors

---

### refactor-advisor

**Conditional:** `refactor` label | **File:** `agents/refactor-advisor.md` | **Effort/Model:** `xhigh` / `opus` (architectural reviewer for code smells)

**Inputs:**
- issue_number, target_files, refactor_goals, constraints

**Outputs:**
- code_smells, refactoring_steps, patterns_to_apply, risk_assessment

**Use When:**
- Code complexity high
- Technical debt cleanup
- SOLID improvements

---

## When NOT to Use Agents

Agents add overhead. Skip them for:

| Scenario | Action |
|----------|--------|
| <10 lines of code | Edit directly |
| Simple typo | Edit directly |
| Single file change | Edit directly |
| Obvious bug fix | Edit directly |

---

## Agent Invocation Pattern

All agents follow this pattern:

```markdown
1. Read agent file from shared location: `agents/<agent-name>.md`
2. Validate inputs against Input Contract
3. Execute steps using tools (Glob, Grep, Read, Write, Edit, Bash)
4. Validate outputs against Output Contract
5. Check Quality Gate
6. Return structured output
```

---

## Error Recovery

| Agent | Common Failure | Recovery |
|-------|----------------|----------|
| mi-codebase-explorer | No files found | Broaden search, retry |
| mi-solution-designer | Plan incomplete | Manual architecture |
| software-developer | Typecheck fails | Fix errors, retry |
| test-writer | Coverage low | Add more tests |
| architecture-reviewer | SOLID violations | Fix issues, re-review |
| code-reviewer | Critical issues | Fix issues, re-review |
| security-auditor | Vulnerabilities | STOP, fix security |
| ux-designer | Unclear requirements | Return with specific questions |
| ux-reviewer | No UI files in scope | Skip UX audit (expected) |

---

## Quality Thresholds

| Metric | Target |
|--------|--------|
| Test coverage (new code) | >80% |
| TypeScript strict | No errors |
| ESLint | No errors |
| Critical review issues | 0 before commit |
| Security vulnerabilities | 0 high/critical |
| UX critical issues (if UI) | 0 before commit |

---

## UX agents (conditional – `has_ui_impact = true`)

UX-specific agent details (ux-designer, ux-reviewer) hoisted to a sibling file in v4.2.2 to keep this file under the Rule #16 ≤500-line cap. See [agents-reference-ux.md](agents-reference-ux.md).
