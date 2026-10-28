# Review phase requirements reference

Capability definitions for each phase of the **Review** operation. Used by dynamic agent selection.

For shared vocabulary (capabilities, domains, criticality, allow_direct policy) see [phase-requirements-shared.md](phase-requirements-shared.md).

---

## Review operation phases

### review_phase_0_scope

```yaml
capabilities:
  - user-interaction
tools:
  - AskUserQuestion
domain: analysis
criticality: high
allow_direct: true
notes: Determine review scope
```

### review_phase_1_identify

```yaml
capabilities:
  - file-search
  - codebase-exploration
tools:
  - Glob
  - Grep
  - Read
domain: exploration
criticality: high
allow_direct: false
notes: Find files to review
```

### review_phase_2_level

```yaml
capabilities:
  - user-interaction
tools:
  - AskUserQuestion
domain: analysis
criticality: high
allow_direct: true
notes: Select review depth
```

### review_phase_3_execute

```yaml
capabilities:
  - code-review
  - security-scanning
  - architecture-review
  - quality-assessment
tools:
  - Read
  - Grep
domain: review
criticality: high
allow_direct: false
notes: |
  Multiple agents may be needed:
  - Quick: security only
  - Standard: security + quality
  - Deep: all review dimensions
```

### review_phase_4_present

```yaml
capabilities:
  - user-interaction
tools:
  - AskUserQuestion
domain: acceptance
criticality: high
allow_direct: true
notes: Present findings to user
```
