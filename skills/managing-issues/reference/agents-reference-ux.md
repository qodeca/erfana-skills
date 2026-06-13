# UX agents reference

UX-specific agent details for the managing-issues skill. Activated when `has_ui_impact = true` (Implement operation) or when the Review operation targets UI files.

Hoisted from `agents-reference-detail.md` in v4.2.2 to keep that file under the Rule #16 ≤500-line cap.

---

## ux-designer

| Attribute | Value |
|-----------|-------|
| **Path** | `agents/ux-designer.md` |
| **Phase** | 4 (Architecture) – Step 1a |
| **Trigger** | `has_ui_impact = true` |
| **Effort** | xhigh |
| **Model** | opus |
| **Tools** | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch |
| **Capabilities** | ux-design, accessibility-audit, platform-compliance, design-system-review |

**Input:** Issue details, affected files, existing design patterns, platform context
**Output:** UX specification (information architecture, interaction design, accessibility requirements, platform guidelines, design token requirements, edge case specs)

**Invocation pattern:**
```
Agent tool:
  subagent_type: "ux-designer"
  prompt: |
    Design UX specification for issue #<number>: <title>
    Affected files: <from Phase 3>
    Platform: <web/desktop/mobile>
    Acceptance criteria: <from Phase 2>
```

---

## ux-reviewer

| Attribute | Value |
|-----------|-------|
| **Path** | `agents/ux-reviewer.md` |
| **Phase** | 8 (Quality Review) – Step 8b; Review operation Phase 3 |
| **Trigger** | `has_ui_impact = true` (Implement) or UI files in scope (Review) |
| **Effort** | xhigh |
| **Model** | opus |
| **Tools** | Read, Glob, Grep, Bash, WebSearch, WebFetch (read-only) |
| **Capabilities** | heuristic-evaluation, accessibility-audit, platform-compliance, design-system-review |

**Input:** Changed files, UX spec from Phase 4 (if available), platform context, review depth
**Output:** Structured audit report with severity-rated findings (Nielsen 0–4), confidence levels, remediation guidance, accessibility scorecard

**Invocation pattern:**
```
Agent tool:
  subagent_type: "ux-reviewer"
  prompt: |
    UX audit for issue #<number>: <title>
    Changed files: <from git diff>
    UX specification: <from Phase 4 Step 1a, if available>
    Platform: <web/desktop/mobile>
    Depth: <standard|deep>
```

**Severity mapping to QG-8:**

| UX Severity | QG-8 Severity | Tier 1 | Tier 2 |
|-------------|---------------|--------|--------|
| 4 (Catastrophe) | CRITICAL | MUST fix | MUST fix |
| 3 (Major) | HIGH | Document | MUST fix |
| 2 (Minor) | MEDIUM | Document | Should fix |
| 1 (Cosmetic) | LOW | Optional | Optional |

---

## Related

- [agents-reference.md](agents-reference.md) – top-level agent reference index
- [agents-reference-detail.md](agents-reference-detail.md) – non-UX agent details
- [phase-requirements-ux.md](phase-requirements-ux.md) – UX-specific phase requirements
