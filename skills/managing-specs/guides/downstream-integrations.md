# Downstream integrations

After spec creation and validation, the orchestrator offers next steps that connect specs to other project artifacts.

---

## Document binding

Spec ID serves as the universal binding key across all related documentation:

| Document type | Location | Naming pattern |
|---------------|----------|----------------|
| Spec (all tiers) | `specs/` | `spec-t{tier}-{id:03d}-{slug}/` |
| Technical ADR | `specs/spec-t{tier}-{id}-{slug}/architecture/` | `{seq:03d}-{slug}.md` |
| Solution doc | `specs/spec-t{tier}-{id}-{slug}/solution/` | `{seq:03d}-{slug}.md` |
| Design doc | `specs/spec-t{tier}-{id}-{slug}/design/` | `{seq:03d}-{slug}.md` |
| UX doc | `specs/spec-t{tier}-{id}-{slug}/ux/` | `{seq:03d}-{slug}.md` |
| E2E test design | `specs/spec-t{tier}-{id}-{slug}/testing/` | `{seq:03d}-e2e-design.md` |

**Registry tracks all linked documents** via the `documents` field. The canonical keys are defined in `templates/registry-schema.json` — use `solution_specs` (not the legacy `solution_docs`):
```json
{
  "documents": {
    "technical_adrs": ["specs/spec-t3-001-search/architecture/001-search-patterns.md"],
    "solution_adrs": ["specs/spec-t3-001-search/solution/adr-001-search-provider.md"],
    "solution_specs": ["specs/spec-t3-001-search/solution/001-search-provider.md"],
    "designs": ["specs/spec-t3-001-search/design/001-implementation.md"],
    "ux": [],
    "e2e_test_designs": ["specs/spec-t3-001-search/testing/001-e2e-design.md"],
    "issues": ["#71"]
  }
}
```

**Find all docs for a feature:** `find . -name "*spec-t*-001*" -type f`

---

## Available next steps

**Delegation rule:** the orchestrator (the managing-specs skill) issues every `Task` call below. Each "-> Delegates to: X agent" line is an orchestrator-issued, sequential delegation, NOT an agent-to-agent call (subagents cannot spawn subagents). The `e2e-test-writer -> e2e-test-reviewer` chain in the integration flow diagram likewise runs as separate orchestrator-issued steps.

After INIT + VALIDATE pass, offer these options:

### Architecture documentation

```
Create architecture documentation for Spec #001?
-> Delegates to: technical-architect agent
-> Creates: specs/spec-t{tier}-001-{slug}/architecture/001-{slug}.md
-> Registers: Links ADR to spec via spec-document-linker
```

### Solution design

```
Create solution design for Spec #001?
-> Delegates to: solution-architect or mi-solution-designer agent
-> Creates: specs/spec-t{tier}-001-{slug}/solution/001-implementation.md
-> Registers: Links design to spec via spec-document-linker
```

### GitHub issue

```
Create GitHub issue for implementation?
-> User creates GitHub issue separately (e.g., via gh CLI or GitHub UI)
-> Creates: Issue with acceptance criteria from spec
-> Registers: Links issue to spec via spec-document-linker
```

### Implementation

```
Start implementation?
-> User starts implementation separately
-> Uses: Spec as requirements source
-> Validates: Against acceptance criteria
```

### E2E test design (MANDATORY – handled in INIT steps 10a–10c)

**E2E test design is a MANDATORY step in the INIT workflow** (steps 10a–10c) when a web framework is detected. It is NOT a downstream option – it runs automatically before downstream offers are presented.

**Guard conditions (both must be true):**
- Spec tier is T2, T3, or T4
- `spec-project-analyzer` detected a web framework in `tech_stack` (React, Vue, Angular, Svelte, Next.js, Nuxt, Remix, Astro, SolidJS, etc.)

**Workflow (see SKILL.md steps 10a–10c):**
- 10a: `e2e-test-designer` creates test design from acceptance criteria
  - T2: reads `spec.md` Acceptance Checklist (R-ID format)
  - T3: reads `03-acceptance.md` (Given/When/Then with AC-IDs)
  - T4: reads `04-acceptance.md` + `03-use-cases.md`
- 10b: `e2e-test-design-reviewer` audits design. On MAJOR GAPS the orchestrator re-invokes `e2e-test-designer` **with the reviewer's gap findings injected** (evaluator-optimizer, not an identical re-send), max 2 retries; on exhaustion it escalates AND emits a manifest `warnings[]` entry `{"code": "E2E_MAJOR_GAPS", "reason": "major_gaps_unresolved", "phase": "10b"}`.
- 10c: `spec-document-linker` registers to `documents.e2e_test_designs`
- Output: `specs/spec-t{tier}-{id:03d}-{slug}/testing/001-e2e-design.md`

These are three sequential orchestrator-issued delegations (10a→10b→10c), not an agent-driven chain. When the guard is NOT met (T1, or no web framework), skip 10a–10c silently.

**tech_stack fallback (when `discovered_context.tech_stack` is empty/null at step 10a — silent skip is FORBIDDEN):** the orchestrator issues `AskUserQuestion` with three options:
1. **skip + warn** — proceed past 10a–10c and emit manifest `warnings[]` `{"code": "E2E_SKIPPED", "reason": "tech_stack unresolved", "phase": "10a"}`.
2. **assume framework** — the orchestrator sets `discovered_context.tech_stack = [user_framework]` directly (it owns the merged context) and continues 10a–10c. Do NOT re-run the full `spec-project-analyzer` for a single scalar.
3. **non-web** — proceed silently and record `{"e2e_applicability": "non-web"}` on the manifest.

**Staleness lifecycle:** E2E designs are flagged as stale when acceptance criteria change (UPDATE step 4) or when spec-implementation deviations are detected (RECONCILE-IMPL). The orchestrator offers regeneration in both cases.

---

## Integration flow

```
INIT (steps 0-10c, includes VALIDATE + E2E design)
                    |
          Downstream offers (step 11)
                    |
        +-----------+-----------+
        |           |           |
   Architecture  Design    Issue
        |           |           |
   ADR (bound)  SD (bound)  GitHub (bound)
                    |
              Implementation
                    |
              Code + Tests
                    |
        e2e-test-writer (from test design)
                    |
        e2e-test-reviewer (code review)
```
