# Pair operations

Operations for creating and managing doer/reviewer agent pairs. These operations extend the standard Create workflow with pair-specific phases.

See `guides/agent-pairing.md` for the underlying patterns and structural requirements.

---

## Operation: Create pair

Creates a doer/reviewer agent pair following the patterns in `guides/agent-pairing.md`.

### Todo list template

```
TodoWrite([
  {content: "Phase 0: Gather pair requirements", status: "in_progress", activeForm: "Gathering pair requirements"},
  {content: "Phase 1: Research and validate pair need", status: "pending", activeForm: "Researching pair need"},
  {content: "Phase 2: Design both agents", status: "pending", activeForm: "Designing agent pair"},
  {content: "Phase 3-4a: Create doer agent", status: "pending", activeForm: "Creating doer agent"},
  {content: "Phase 3-4b: Create reviewer agent", status: "pending", activeForm: "Creating reviewer agent"},
  {content: "Phase 5a: Validate doer", status: "pending", activeForm: "Validating doer"},
  {content: "Phase 5b: Validate reviewer", status: "pending", activeForm: "Validating reviewer"},
  {content: "Phase 6: Cross-reference validation", status: "pending", activeForm: "Validating cross-references"},
])
```

### Phases

| Phase | Agent | Purpose |
|-------|-------|---------|
| 0 | `ma-requirements-gatherer` | Gather requirements for BOTH agents |
| 1 | `ma-researcher` | Research need, validate pair is warranted (not single agent) |
| 2 | `ma-designer` | Design both agents: names, descriptions, models, colors |
| 3-4a | `ma-creator` | Create doer agent |
| 3-4b | `ma-creator` | Create reviewer agent |
| 5a | `ma-validator` | Validate doer agent |
| 5b | `ma-validator` | Validate reviewer agent |
| 6 | `ma-validator` | Cross-reference validation |

### Phase 0: Gather pair requirements

Same as standard Create Phase 0, but requirements gathering MUST additionally include:
- [ ] Doer's purpose and artifacts it produces
- [ ] Reviewer's evaluation criteria and frameworks
- [ ] Shared vocabulary terms (artifact names, severity scales, framework acronyms)
- [ ] Whether this pair joins an existing agent family

### Phase 1: Research and validate pair need

Same as standard Create Phase 1, but research MUST also evaluate:
- [ ] Is a dedicated reviewer warranted, or would the general `code-reviewer` suffice?
- [ ] Does a similar pair already exist?
- [ ] If the domain has an existing doer, use "Create companion" instead

**If pair is not warranted:** Return `needs_user_input` recommending a single agent instead.

### Phase 2: Design both agents

Agent design MUST include pair-specific elements:
- [ ] Complementary names (e.g., X-architect + X-reviewer, Y-designer + Y-auditor)
- [ ] Different colors from the same family (see `guides/agent-pairing.md#color-coordination-strategy`)
- [ ] Color uniqueness verified against existing agents (`grep "color:" agents/*.md`)
- [ ] Shared vocabulary defined (artifact names, framework terms)
- [ ] Complementary tool sets (doer: Write/Edit, reviewer: read-only)

### Phase 3-4: Create both agents

**IMPORTANT:** Create the doer FIRST, then the reviewer.

**Phase 3-4a (Doer):**
- Standard Create Phase 3-4
- MUST include `<collaboration>` referencing the reviewer by planned name
- MUST include `<scope_exclusions>` delegating review to the reviewer
- MUST include "Not your domain" entry for reviewer's responsibilities
- MUST include security constraints from template defaults

**Phase 3-4b (Reviewer):**
- Standard Create Phase 3-4
- Read the doer's file to extract exact artifact names and output formats
- MUST include `<collaboration>` referencing the doer by exact name
- MUST include `<scope_exclusions>` delegating creation to the doer
- MUST include "Not your domain" entry for doer's responsibilities
- Tools MUST be read-only (no Write, Edit, or Bash)

### Phase 5: Validate both agents

Run standard validation (pre-release + security checklists) on each agent independently.

STOP if either agent fails validation. Fix before proceeding to Phase 6.

### Phase 6: Cross-reference validation (NEW)

This phase verifies structural consistency between the pair.

STOP if ANY unchecked:
- [ ] Doer's `<collaboration>` references reviewer by exact `name` field value
- [ ] Reviewer's `<collaboration>` references doer by exact `name` field value
- [ ] Doer's `<scope_exclusions>` delegates review tasks to reviewer
- [ ] Reviewer's `<scope_exclusions>` delegates creation tasks to doer
- [ ] Doer's "Not your domain" references reviewer
- [ ] Reviewer's "Not your domain" references doer
- [ ] Vocabulary is consistent between both agents (same artifact names, framework acronyms)
- [ ] Colors are different from each other
- [ ] Colors are unique across all agents in `agents/`

**Retry logic:** Max 3 retries. If cross-references fail, use `ma-modifier` to fix, then re-validate.

---

## Operation: Create companion

Adds a reviewer to an existing doer agent (or vice versa).

### Todo list template

```
TodoWrite([
  {content: "Phase 0: Gather companion requirements", status: "in_progress", activeForm: "Gathering companion requirements"},
  {content: "Phase R: Review existing agent", status: "pending", activeForm: "Reviewing existing agent"},
  {content: "Phase 2: Design companion agent", status: "pending", activeForm: "Designing companion"},
  {content: "Phase 3-4: Create companion agent", status: "pending", activeForm: "Creating companion"},
  {content: "Phase 5: Validate companion", status: "pending", activeForm: "Validating companion"},
  {content: "Phase 6: Cross-reference validation", status: "pending", activeForm: "Validating cross-references"},
  {content: "Phase 7: Update existing agent", status: "pending", activeForm: "Updating existing agent"},
])
```

### Phases

| Phase | Agent | Purpose |
|-------|-------|---------|
| 0 | `ma-requirements-gatherer` | Gather companion requirements |
| R | `ma-reviewer` | Review existing agent for pairing readiness |
| 2 | `ma-designer` | Design companion agent |
| 3-4 | `ma-creator` | Create companion agent |
| 5 | `ma-validator` | Validate companion agent |
| 6 | `ma-validator` | Cross-reference validation |
| 7 | `ma-modifier` | Update existing agent with collaboration references |

### Phase R: Review existing agent (NEW)

Before creating a companion, review the existing agent for pairing readiness:

- [ ] Does it have a `<collaboration>` section? (Will be added in Phase 7 if missing)
- [ ] Does it have `<scope_exclusions>`? (Will be added in Phase 7 if missing)
- [ ] Does it have security constraints? (Will be added in Phase 7 if missing)
- [ ] What artifacts does it produce? (Determines reviewer criteria)
- [ ] What vocabulary does it use? (Companion must match)
- [ ] What color does it use? (Companion needs a different one)

### Phase 2-6: Standard pair workflow

Follow the same phases as "Create pair" Phase 2-6, but for a single companion agent.

### Phase 7: Update existing agent (NEW)

After companion is validated, update the existing agent using `ma-modifier`:

- [ ] Add `<collaboration>` entries referencing new companion (both directions)
- [ ] Add `<scope_exclusions>` entry delegating companion's domain
- [ ] Add "Not your domain" entry in `<context>` for companion's responsibilities
- [ ] Add security constraints if missing from existing agent

**Change type:** `enhancement`

STOP if `ma-modifier` validation fails. Roll back companion creation if existing agent cannot be updated.

---

## See also

- `agent-pairing.md` -- Structural requirements for paired agents
- `../SKILL.md` -- Standard Create/Review/Modify operations
- `../validation/pre-release-checklist.md` -- Includes collaboration validation items
