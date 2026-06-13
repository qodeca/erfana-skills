# Conditional phase requirements reference

Capability definitions for **conditional phases** that activate based on issue labels or context. Used by dynamic agent selection.

For shared vocabulary (capabilities, domains, criticality, allow_direct policy) see [phase-requirements-shared.md](phase-requirements-shared.md).

---

## Conditional phases

### bug_investigation

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

### refactor_analysis

```yaml
capabilities:
  - code-analysis
  - anti-pattern-detection
  - architecture-review
tools:
  - Read
  - Grep
domain: review
criticality: high
allow_direct: false
trigger: issue has `refactor` label
notes: Code smell detection before refactoring
```

### docs_quick_fix

```yaml
capabilities:
  - file-editing
  - documentation-generation
tools:
  - Read
  - Write
  - Edit
domain: documentation
criticality: low
allow_direct: false
trigger: Tier 1 documentation issue
notes: Delegate even for simple fixes. UX phases: see reference/phase-requirements-ux.md
```
