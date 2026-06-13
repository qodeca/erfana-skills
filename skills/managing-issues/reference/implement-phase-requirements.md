# Implement phase requirements reference

Capability definitions for each phase of the **Implement** operation. Used by dynamic agent selection. **Key principle:** Define WHAT each phase needs, not WHICH agent.

For shared vocabulary (capabilities, domains, criticality levels, allow_direct policy), see [phase-requirements-shared.md](phase-requirements-shared.md).

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
  solution-reviewer validates design coherence before QG-4 user approval.
  Falls back to full Phase 4 design creation if validation finds critical issues.
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
