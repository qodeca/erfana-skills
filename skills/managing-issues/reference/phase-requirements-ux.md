# Phase requirements – UX conditional phases

Conditional UX phases that activate when `has_ui_impact = true`. These extend the standard phase requirements from `implement-phase-requirements.md`.

---

### phase_4_ux_design (conditional)

```yaml
capabilities:
  - ux-design
  - accessibility-audit
  - platform-compliance
  - design-system-review
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebSearch
domain: ux
criticality: high
allow_direct: false
trigger: has_ui_impact = true
notes: |
  UX design specification for UI-impacting issues.
  Produces accessibility requirements, interaction specs, design tokens.
  Output feeds into mi-solution-designer (Phase 4 Step 1b).
```

### phase_8_ux_audit (conditional)

```yaml
capabilities:
  - heuristic-evaluation
  - accessibility-audit
  - platform-compliance
  - design-system-review
tools:
  - Read
  - Glob
  - Grep
  - Bash
  - WebSearch
domain: ux
criticality: high
allow_direct: false
trigger: has_ui_impact = true
notes: |
  UX audit for UI-impacting issues.
  Complements code-reviewer with usability and accessibility analysis.
  Findings merge into QG-8 severity resolution flow.
```
