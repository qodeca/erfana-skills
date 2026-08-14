# Implement phase requirements reference

Capability definitions for each phase of the **Implement** operation. Used by dynamic agent selection. **Key principle:** Define WHAT each phase needs, not WHICH agent.

For shared vocabulary (capabilities, domains, criticality levels, allow_direct policy), see [phase-requirements-shared.md](phase-requirements-shared.md).

**Phases vs sub-gates.** Blocks named `phase_*` are the 13 phases. Blocks named `gate_*` (`gate_4a_design_lens_review`, `gate_4b_architecture_acceptance`, `gate_11a_implementation_lens_review`) are **sub-gates inside Phases 4 and 11, not phases** – they exist here only so their requirements are stated once. Each carries `human_invoked: true` with `allow_direct: true`, so QG-1 resolves it without attempting an agent assignment (same resolution path as `phase_0_preflight` and `phase_11_uat`). QG-1's "all phases have agent selection" criterion is satisfied by `allow_direct: true`; assigning an agent to a checkpoint a human must perform is a selection error, not a fallback.

For other operations:
- Create operation phases: [create-phase-requirements.md](create-phase-requirements.md)
- Review operation phases: [review-phase-requirements.md](review-phase-requirements.md)
- Conditional phases (bug / refactor / docs): [conditional-phase-requirements.md](conditional-phase-requirements.md)

---

## Implement operation phases

### phase_0_preflight

```yaml
capabilities:
  - git-operations
  - gh-cli
  - validation
tools:
  - Bash
domain: infrastructure
criticality: mandatory
allow_direct: true
notes: Pre-flight checks can run without agent delegation
```

### phase_1_agent_selection

```yaml
capabilities:
  - codebase-exploration
  - file-search
  - pattern-matching
  - validation
tools:
  - Read
  - Glob
  - Grep
domain: infrastructure
criticality: high
allow_direct: false
notes: Dynamic agent discovery and matching for subsequent phases
```

### phase_2_business_analysis

```yaml
capabilities:
  - code-search
  - web-search
  - requirements-analysis
  - prior-art-research
tools:
  - Read
  - Grep
  - Glob
  - WebSearch
  - AskUserQuestion
domain: analysis
criticality: high
allow_direct: false
spec_ready_override: "Validation mode – validate existing spec instead of full discovery"
notes: Requires specialized analysis capabilities
```

### phase_3_discovery

```yaml
capabilities:
  - codebase-exploration
  - file-search
  - pattern-matching
tools:
  - Read
  - Glob
  - Grep
domain: exploration
criticality: high
allow_direct: false
notes: Builtin Explore agent is often best match
```

### phase_4_architecture

```yaml
capabilities:
  - architecture-design
  - implementation-planning
  - task-breakdown
tools:
  - Read
  - AskUserQuestion
domain: architecture
criticality: high
allow_direct: false
spec_ready_override: "Validation mode – validate existing spec instead of full discovery"
notes: Builtin Plan agent or solution-architect are good matches
```

### phase_4_architecture_validation

```yaml
capabilities:
  - solution-design-review
  - design-validation
  - coherence-analysis
tools:
  - Read
  - Glob
  - Grep
  - WebSearch
  - WebFetch
domain: review
criticality: high
allow_direct: false
trigger: spec_maturity >= complete_with_design
notes: |
  Used in spec-ready validation mode when design documents already exist.
  solution-reviewer validates design coherence before QG-4 is recorded (non-blocking).
  Falls back to full Phase 4 design creation if validation finds critical issues.
```

### gate_4a_design_review

```yaml
capabilities:
  - architecture-review
  - parallel-fan-out
tools:
  - Task
domain: review
criticality: high
allow_direct: true
trigger: deep_review_gates == true
notes: |
  Sub-gate inside Phase 4, not a phase. AUTONOMOUS EMBEDDED REVIEW: the
  orchestrator fans out its own reviewer agents (architecture-reviewer,
  solution-reviewer, security-auditor, ux-reviewer) in parallel over the
  design and MUST NOT invoke /erfana:lens-review (SKILL.md rule 15). No user
  hand-off. Findings feed the QG-4b judgment step. Protocol:
  reference/embedded-review-and-fix.md.
```

### gate_4b_architecture_judgment

```yaml
capabilities:
  - cost-benefit-triage
  - acceptance-criteria-verification
tools:
  - Read
domain: judgment
criticality: high
allow_direct: true
trigger: deep_review_gates == true
notes: |
  Sub-gate inside Phase 4, not a phase. INTERNAL JUDGMENT CHECKPOINT (no user
  gate): mi-solution-designer triages the QG-4a findings (fix / accept-as-tech-
  debt / not-worth-it); unresolved CRITICAL/HIGH trigger an automatic design
  revision bounded by embedded_loop_iter (3 rounds). Runs on every pass.
```

### gate_11a_implementation_review

```yaml
capabilities:
  - code-review
  - parallel-fan-out
  - cost-benefit-triage
tools:
  - Task
domain: review
criticality: high
allow_direct: true
trigger: review_level == full
notes: |
  Sub-gate inside Phase 11 (pre-step to QG-11), not a phase. AUTONOMOUS EMBEDDED
  REVIEW-AND-FIX with the same contract as gate_4a: parallel reviewer fan-out over
  the change set, CRITICAL/HIGH auto-fixed inline, MED/LOW to the mi-solution-
  designer JUDGE mode, bounded by embedded_loop_iter (3 rounds). No /erfana:lens-review, no user
  hand-off. Protocol: reference/embedded-review-and-fix.md.
```

### phase_5_implementation

```yaml
capabilities:
  - code-generation
  - file-editing
  - test-generation
tools:
  - Read
  - Write
  - Edit
  - Bash
domain: development
criticality: high
allow_direct: false
notes: |
  Consider domain-specific agents:
  - react-developer for frontend
  - nest-developer for backend
  - implement-code for general
```

### phase_6_architectural_review

```yaml
capabilities:
  - architecture-review
  - SOLID-principles
  - anti-pattern-detection
tools:
  - Read
  - Grep
domain: review
criticality: high
allow_direct: false
notes: architecture-reviewer (builtin) is often best match
```

### phase_7_security

```yaml
capabilities:
  - security-scanning
  - vulnerability-detection
tools:
  - Bash
  - Grep
  - Read
domain: security
criticality: mandatory
allow_direct: false
notes: NEVER skip - mandatory quality gate
```

### phase_8_quality_review

```yaml
capabilities:
  - code-review
  - quality-assessment
  - complexity-analysis
tools:
  - Read
  - Grep
domain: review
criticality: high
allow_direct: false
notes: |
  Consider domain-specific reviewers:
  - react-code-reviewer for frontend
  - nest-code-reviewer for backend
  - code-reviewer for general
```

### phase_9_verification

```yaml
capabilities:
  - acceptance-criteria-verification
  - test-execution
tools:
  - Read
  - Bash
domain: verification
criticality: mandatory
allow_direct: false
notes: Validates all acceptance criteria are met
```

### phase_10_documentation

```yaml
capabilities:
  - documentation-generation
  - file-editing
tools:
  - Read
  - Write
  - Edit
domain: documentation
criticality: low
allow_direct: false
notes: Delegate even for minimal changes
```

### phase_11_uat

```yaml
capabilities:
  - user-interaction
  - demonstration
tools:
  - AskUserQuestion
domain: acceptance
criticality: high
allow_direct: true
notes: User acceptance - direct interaction preferred
```

### phase_12_finalization

```yaml
capabilities:
  - git-operations
  - commit-message-generation
tools:
  - Bash
  - Read
domain: infrastructure
criticality: high
allow_direct: false
notes: Proper commit message generation required
```
