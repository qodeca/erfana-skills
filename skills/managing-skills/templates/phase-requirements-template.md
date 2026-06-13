# Phase Requirements Template

Define WHAT each phase needs (capabilities) separately from WHICH agent executes it. This enables dynamic agent selection at runtime.

---

## Overview

Phase requirements describe the abstract needs of each workflow phase without hardcoding agent assignments. This decoupling enables:

- **Dynamic selection**: Match best available agent at runtime
- **Source flexibility**: Use builtin or shared agents interchangeably
- **Future-proofing**: New agents automatically become candidates
- **Context preservation**: Clear rules on when to delegate vs execute directly

---

## Template Structure

**Recommended (v4.2.x split-file pattern):** create one file per operation plus a shared-vocab file. This keeps each file under the Rule #16 ≤500-line cap and lets per-operation consumers cross-reference shared vocab equally:

```
reference/
├── phase-requirements-shared.md       # Capability vocab, domain vocab, criticality, allow_direct policy
├── implement-phase-requirements.md    # Implement operation phase definitions
├── create-phase-requirements.md       # Create operation phase definitions
├── review-phase-requirements.md       # Review operation phase definitions
└── conditional-phase-requirements.md  # Conditional phases (label-triggered)
```

See `managing-issues` for the canonical implementation of the split-file pattern.

**Deprecated (single-file pattern, pre-v4.2.x):** the original template put everything in one `reference/phase-requirements.md`. This pattern is deprecated as of v4.2.x because it (a) tends to violate the 500-line cap once shared vocab + multi-operation phase definitions accumulate, and (b) makes one operation implicitly canonical (other operation files cross-reference it for shared vocab). Use the split pattern above for new skills. Existing single-file consumers continue to work but should migrate during the next Modernize pass.

The single-file shape below remains in this template for reference; new skills should split it across the files listed above.

---

Create `reference/phase-requirements.md` in your skill directory (legacy single-file shape – split per the structure above for new skills):

```markdown
# Phase Requirements

Abstract capability definitions for [skill-name] phases.

---

## Capability vocabulary

Use standardized capability names for consistent matching:

| Category | Capabilities |
|----------|--------------|
| **Code operations** | code-search, code-generation, code-review, code-analysis |
| **Architecture** | architecture-design, architecture-review, anti-pattern-detection |
| **File operations** | file-search, file-editing, codebase-exploration, pattern-matching |
| **Research** | web-search, prior-art-research, documentation-lookup |
| **Infrastructure** | git-operations, gh-cli, test-execution, validation |
| **Analysis** | requirements-analysis, security-scanning, quality-assessment |
| **Content** | documentation-generation, issue-drafting, template-application |
| **Interaction** | user-interaction, demonstration, acceptance-criteria-verification |

---

## Domain vocabulary

| Domain | Description |
|--------|-------------|
| analysis | Understanding problems, gathering requirements |
| exploration | Finding files, understanding codebase structure |
| architecture | System design, planning, patterns |
| development | Code generation, implementation |
| review | Code review, security audit, quality check |
| documentation | Creating/updating docs, comments, READMEs |
| infrastructure | Git, CI/CD, deployment, tooling |
| verification | Testing, validation, acceptance |
| acceptance | User approval, demonstrations |

---

## Allow_direct policy (CONTEXT PRESERVATION)

**The `allow_direct` flag is RESTRICTIVE, not permissive.**

`allow_direct: true` is ONLY appropriate when ALL conditions are met:
- Phase is PURELY user interaction (AskUserQuestion only)
- No file reading, code analysis, or content generation
- Consumes minimal orchestrator context (<3 tool calls)

**WHY:** Orchestrator context is LIMITED and SHARED with user conversation. Every task executed directly consumes context. Agents run in SEPARATE context windows.

**Default to `allow_direct: false`** unless phase is purely conversational.

---

## Phase definition template

### [phase_name]

```yaml
capabilities:
  - [capability-1]
  - [capability-2]
tools:
  - [Tool1]
  - [Tool2]
domain: [domain]
criticality: [mandatory|high|medium|low]
allow_direct: [true|false]
notes: |
  [Why this phase exists, special considerations]
```

---

## Example phase definitions

### phase_analyze_requirements

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
notes: Requires specialized analysis capabilities - always delegate
```

### phase_user_confirmation

```yaml
capabilities:
  - user-interaction
tools:
  - AskUserQuestion
domain: acceptance
criticality: high
allow_direct: true
notes: PURELY user interaction - direct execution appropriate
```

### phase_implementation

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
  - general-purpose for other
```

### phase_documentation

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
notes: File editing consumes context - delegate even for minimal changes
```

---

## Conditional phases

Define phases that only activate under certain conditions:

### [conditional_phase_name]

```yaml
capabilities:
  - [capability]
tools:
  - [Tool]
domain: [domain]
criticality: [level]
allow_direct: false
trigger: [condition that activates this phase]
notes: [why this conditional phase exists]
```

### Example: bug_investigation

```yaml
capabilities:
  - code-analysis
  - codebase-exploration
  - prior-art-research
tools:
  - Read
  - Grep
  - Glob
  - WebSearch
domain: analysis
criticality: high
allow_direct: false
trigger: issue has `bug` label
notes: Root cause analysis before implementation
```
```

---

## Usage in SKILL.md

Reference phase requirements in your workflow:

```markdown
### Phase 2: Analysis

#### Capability Requirements
See `reference/<operation>-phase-requirements.md#phase_analyze_requirements` (v4.2.x split pattern) or `reference/phase-requirements.md#phase_analyze_requirements` (legacy single-file pattern, deprecated).

#### Agent Selection
Use Phase 0.5 pattern to match agents dynamically.

#### Execution
Delegate to: [selected agent from matching]
```

---

## Validation checklist

Before using phase requirements:

- [ ] All phases have capabilities defined (not just agent names)
- [ ] Capability names use standardized vocabulary
- [ ] `allow_direct` is `false` unless phase is PURELY AskUserQuestion
- [ ] Conditional phases have clear triggers
- [ ] Each phase has criticality level set
- [ ] Notes explain special considerations

---

## Anti-patterns

**WRONG - Hardcoded agent assignment:**
```yaml
phase_analysis:
  agent: analyze-requirements  # Hardcodes the agent!
```

**RIGHT - Capability-based:**
```yaml
phase_analysis:
  capabilities:
    - requirements-analysis
    - code-search
  # Agent selected at runtime based on capabilities
```

**WRONG - Permissive allow_direct:**
```yaml
phase_documentation:
  allow_direct: true  # File editing should NEVER be direct!
  tools:
    - Write
    - Edit
```

**RIGHT - Restrictive allow_direct:**
```yaml
phase_documentation:
  allow_direct: false
  tools:
    - Write
    - Edit
  notes: File editing consumes context - always delegate
```
