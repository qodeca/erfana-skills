# Agent pairing guide

Patterns for creating and managing paired agents -- doer/reviewer relationships.

---

## What is an agent pair?

An agent pair consists of two complementary agents:
- **Doer:** Creates, implements, or designs artifacts (has Write/Edit tools)
- **Reviewer:** Validates, audits, or evaluates artifacts produced by the doer (read-only tools)

**Example:** `solution-architect` (doer) + `solution-reviewer` (reviewer)

The doer creates solution specs, ADRs, data models, and API contracts. The reviewer validates them for coherence, completeness, and feasibility before implementation begins.

---

## When to create pairs vs individual agents

### Create a pair when:
- The doer produces complex artifacts requiring expert validation
- Review quality matters enough to justify a dedicated reviewer with domain-specific criteria
- The doer and reviewer need different tool access (write vs read-only)
- Review findings should follow a structured format (severity-rated findings with confidence levels)

### Use a single agent when:
- The task is self-contained with internal quality gates
- The general `code-reviewer` agent suffices for validation
- The workflow is simple enough that review is trivial

---

## Structural requirements

### 1. Bidirectional collaboration references

Both agents MUST reference each other in their `<collaboration>` section.

**In the doer:**
```xml
<collaboration>
**-> [reviewer-name]:**
- Provide: [What artifacts are sent for review]
- They review: [What they validate]

**<- [reviewer-name]:**
- Receive: [Findings and recommendations]
- Apply: [How findings are incorporated]
</collaboration>
```

**In the reviewer:**
```xml
<collaboration>
**<- [doer-name]:**
- Receive: [Artifacts to review]
- Review: [Evaluation criteria]

**-> [doer-name]:**
- Provide: [Severity-rated findings with recommendations]
- They revise: [Expected response to findings]
</collaboration>
```

### 2. Complementary scope exclusions

Each agent MUST exclude the other's domain via `<scope_exclusions>`.

**In the doer:**
```
- Design review or validation (use [reviewer-name] for that)
```

**In the reviewer:**
```
- Implementing fixes or creating artifacts (use [doer-name] for that)
```

### 3. "Not your domain" delegation

In `<context>`, each agent MUST list what belongs to its partner:

**In the doer:**
```
**Not your domain (delegate to others):**
- [Review responsibility] -> [reviewer-name]
```

**In the reviewer:**
```
**Not your domain (delegate to others):**
- [Creation responsibility] -> [doer-name]
```

### 4. Shared vocabulary

Paired agents MUST use consistent terminology:
- Same names for artifact types (e.g., both say "solution spec", not one "design doc")
- Same severity scales if both rate findings
- Same file path conventions for shared artifact locations
- Same acronyms for shared frameworks (e.g., both use "SOLID (SRP, OCP, LSP, ISP, DIP)")

### 5. Complementary tools

| Agent type | Typical tools | Rationale |
|------------|---------------|-----------|
| Doer | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, Bash | Creates and modifies artifacts |
| Reviewer | Read, Glob, Grep, WebSearch, WebFetch | Read-only analysis; no Write/Edit/Bash |

---

## Color coordination strategy

### Rules
1. Doer and reviewer MUST use different colors (visual distinction)
2. Colors within a pair should be semantically related (same hue family)
3. Colors MUST be unique across all agents -- check before assigning

### Current color assignments

| Color | Agent(s) |
|-------|----------|
| cyan | ma-researcher, ma-requirements-gatherer, ma-reviewer |
| green | ma-creator, ma-designer |
| yellow | ma-validator |
| magenta | ma-modifier |
| blue | technical-architect |
| indigo | architecture-reviewer |
| orange | solution-architect |
| amber | solution-reviewer |
| purple | ux-designer |
| teal | ux-reviewer |
| sky | e2e-test-designer |
| zinc | e2e-test-design-reviewer |
| emerald | e2e-test-writer |
| slate | e2e-test-reviewer |
| fuchsia | ui-designer |
| rose | ui-reviewer |

### Suggested pair color families

| Family | Doer color | Reviewer color |
|--------|-----------|----------------|
| Warm | orange | amber |
| Cool | blue | indigo |
| Vivid | purple | teal |
| Earth | green | emerald |
| Neutral | slate | gray |
| Pink | fuchsia | rose |

**Before assigning colors**, run: `grep "color:" agents/*.md`

### Standard assessment criteria for reviewer agents

All reviewer agents in a doer/reviewer pair MUST use these deterministic assessment rules:

| Assessment | Condition | Orchestrator action |
|-----------|-----------|-------------------|
| **MAJOR GAPS** | ≥1 CRITICAL finding | Re-invoke doer (max 2 retries, then escalate) |
| **NEEDS REVISION** | ≥1 HIGH finding, no CRITICAL | Present findings, user decides to fix or accept |
| **PASS WITH NOTES** | MEDIUM or LOW findings only | Inform user, proceed |
| **PASS** | 0 findings | Proceed silently |

These rules are non-negotiable when skills use the assessment value as a workflow gate (e.g., managing-specs step 10b re-invokes on MAJOR GAPS).

### Deterministic output paths

When a doer agent produces files that a reviewer agent or skill orchestrator consumes:
- The output file path MUST be deterministic, derived from `<input_contract>` variables
- NEVER use "as agreed with user" or negotiated paths in automated pipelines
- Pattern: `{project_path}/{convention}/{filename}` where all variables come from declared inputs
- The doer MUST verify the file exists after writing and return the absolute path

### Reviewer STOP paths

Reviewer agents MUST have explicit STOP conditions for missing artifacts:

```
Step 1: Locate doer output
- Glob for expected artifact
- If 0 results: STOP → return clarification_required with searched paths
- If >1 ambiguous matches: STOP → return clarification_required listing all matches
```

Reviewers MUST NOT proceed with partial data – reviewing nothing produces fabricated findings.

---

## Cross-reference validation rules

When creating or reviewing paired agents, verify:

1. [ ] Doer's `<collaboration>` mentions reviewer by exact agent name
2. [ ] Reviewer's `<collaboration>` mentions doer by exact agent name
3. [ ] Doer's `<scope_exclusions>` delegates review tasks to reviewer
4. [ ] Reviewer's `<scope_exclusions>` delegates creation tasks to doer
5. [ ] Both agents' "Not your domain" references their partner
6. [ ] Vocabulary is consistent between both agents
7. [ ] Colors are different and unique across all agents

---

## Agent families

When 3+ doer/reviewer pairs serve related domains, they form an **agent family**.

### Architecture family

| Pair | Doer | Reviewer | Level |
|------|------|----------|-------|
| Solution architecture | solution-architect | solution-reviewer | System design |
| Code architecture | technical-architect | architecture-reviewer | Code structure |
| UX architecture | ux-designer | ux-reviewer | UX/interaction quality |
| UI architecture | ui-designer | ui-reviewer | Visual design quality |

Family members share cross-references in their `<collaboration>` sections. For example, `architecture-reviewer` references both `technical-architect` (primary partner) and `solution-reviewer` (receives design context).

### Developer family

| Pair | Developer | Reviewer | Domain |
|------|-----------|----------|--------|
| React | react-developer | react-code-reviewer | Frontend |
| Nest.js | nest-developer | nest-code-reviewer | Backend |
| General | software-developer | code-reviewer | Cross-domain |

### Testing family

| Pair | Doer | Reviewer | Domain |
|------|------|----------|--------|
| Unit/integration | test-writer | (uses code-reviewer) | Unit and integration tests |
| E2E test design | e2e-test-designer | e2e-test-design-reviewer | E2E test specifications and coverage design |
| E2E test code | e2e-test-writer | e2e-test-reviewer | End-to-end browser tests |

---

## See also

- `guides/pair-operations.md` -- Create pair and Create companion operations
- `guides/system-prompt-design.md` -- Prompt engineering for agents
- `templates/agent-template-xml.md` -- XML agent template with collaboration section
- `validation/pre-release-checklist.md` -- Includes collaboration validation items
