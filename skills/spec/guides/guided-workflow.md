# GUIDED Workflow

Interactive step-by-step spec creation with tier-aware section ordering.

---

## When to Use

- User asks "guide me step by step"
- User wants structured walkthrough
- User is new to spec creation

---

## Workflow Overview

**Authority:** this guided walkthrough is a UX overlay on the canonical INIT workflow in `SKILL.md`. It adds clarification prompts and per-section pacing; it does NOT re-create sections already produced by `spec-init`. Where the two differ, `SKILL.md` is authoritative. The RECONCILE-before-VALIDATE order below matches SKILL.md (validation scores must reflect reconciled statistics).

### Step 0: Project Context & Tier Detection

| Step | Agent | Purpose |
|------|-------|---------|
| 0a | Orchestrator | **Capture project_path (CWD)** |
| 0b | `spec-project-analyzer` | Auto-detect project context |
| 0c | `spec-tier-detector` | Recommend appropriate tier |
| 0d | Orchestrator | **Clarify if ambiguous** (see below) |
| 0e | User | Confirm or override tier |

**Clarification Loop (Step 0d):**

If `spec-tier-detector` returns `needs_clarification: true` or `confidence < 0.8`:
```
The description contains ambiguous terms. Please clarify:
- Will this feature span multiple views/components?
- Does it require new state management?
- Are there accessibility/performance requirements?
```

### T3 Workflow (Lite Spec - 4 Files)

| Step | Operation | Section | Rationale |
|------|-----------|---------|-----------|
| 1 | INIT | - | Create spec with unique ID **(pass project_path!)** |
| 2 | ADD | 01-overview | High-level overview first |
| 3 | ADD | 02-requirements | FR and NFR combined |
| 4 | ADD | 03-acceptance | Test cases for FRs |
| 5 | RECONCILE | - | **Auto-fix statistics** |
| 6 | VALIDATE | - | Check quality (50% threshold) |
| 7 | UPDATE_CLAUDE_MD | - | Sync spec docs |
| 8 | DOWNSTREAM | - | **Offer integrations** (architecture, issue, implementation) |

### T4 Workflow (Standard Spec - 6 Files)

| Step | Operation | Section | Rationale |
|------|-----------|---------|-----------|
| 1 | INIT | - | Create spec with unique ID **(pass project_path!)** |
| 2 | ADD | 01-overview | High-level overview first |
| 3 | ADD | 02-requirements | FR and NFR combined |
| 4 | ADD | 03-use-cases | User flows with actors |
| 5 | ADD | 04-acceptance | Test cases for FRs and UCs |
| 6 | ADD | 05-notes | Constraints, assumptions, dependencies |
| 7 | RECONCILE | - | **Auto-fix statistics** |
| 8 | VALIDATE | - | Check quality (80% threshold) |
| 9 | UPDATE_CLAUDE_MD | - | Final sync of spec docs |
| 10 | DOWNSTREAM | - | **Offer integrations** (architecture, issue, implementation) |

---

## Section Ordering Rationale

### Why Requirements before Use Cases?

- Use Cases trace to Functional Requirements
- Creating FR first enables valid traces in UC
- Avoids placeholder text like "[FR-xxx]"

### Why Acceptance after Use Cases?

- Acceptance Criteria trace to both FR and UC
- Having both ready enables complete test coverage

---

## Step Details

### Step 0: Detect Tier and Context

1. Delegate to `spec-project-analyzer`
   - Extracts: application_name, tech_stack, features, domain
   - ⛔ BLOCKING: Must complete before tier detection

2. Delegate to `spec-tier-detector`
   - Analyzes feature complexity
   - Counts expected requirements
   - Recommends tier (T1-T4)

3. Present to user:
   ```
   Recommended: T3 (Lite spec)
   Reason: ~15 requirements, single concern, no external integrations

   Options:
   - T2: Spec (simpler, single file)
   - T3: Lite spec (recommended)
   - T4: Standard spec (more comprehensive)
   ```

### Step 1: Initialize Spec

- Delegate to INIT operation
- Claims unique ID from registry (T2-T4)
- Creates manifest with tier-appropriate sections
- Updates CLAUDE.md (initial)

### T3 Steps 2-4: Add Sections

| Step | Section | Content |
|------|---------|---------|
| 2 | 01-overview | Summary, purpose, scope |
| 3 | 02-requirements | FR + NFR combined |
| 4 | 03-acceptance | Test cases, definition of done |

### T4 Steps 2-6: Add Sections

| Step | Section | Content |
|------|---------|---------|
| 2 | 01-overview | Summary, purpose, scope |
| 3 | 02-requirements | FR + NFR combined |
| 4 | 03-use-cases | User flows with actors |
| 5 | 04-acceptance | Test cases, definition of done |
| 6 | 05-notes | Constraints, assumptions, dependencies |

### Validate

- Delegate to `spec-validator`
- Apply tier-appropriate threshold:
  - T3: 50% to pass
  - T4: 80% to pass

### Reconcile (T4 only)

- Delegate to `spec-reconciler`
- Auto-fix any inconsistencies
- Skip if no issues

### Final CLAUDE.md Sync

- Delegate to `spec-claude-md-integrator`
- Updates project CLAUDE.md with complete spec information

---

## Quality Gates

Each section validated after creation:

- [ ] Registry counts synced (T2-T4)
- [ ] Manifest statistics accurate
- [ ] No placeholder traces
- [ ] All cross-references valid

---

## Todo Templates

### T3 Template

```javascript
TodoWrite([
  {content: "Analyze project context", status: "in_progress", activeForm: "Analyzing project"},
  {content: "Detect tier", status: "pending", activeForm: "Detecting tier"},
  {content: "Initialize spec", status: "pending", activeForm: "Initializing"},
  {content: "Add overview", status: "pending", activeForm: "Adding overview"},
  {content: "Add requirements", status: "pending", activeForm: "Adding requirements"},
  {content: "Add acceptance criteria", status: "pending", activeForm: "Adding acceptance"},
  {content: "Validate spec", status: "pending", activeForm: "Validating"},
  {content: "Update CLAUDE.md", status: "pending", activeForm: "Documenting"}
])
```

### T4 Template

```javascript
TodoWrite([
  {content: "Analyze project context", status: "in_progress", activeForm: "Analyzing project"},
  {content: "Detect tier", status: "pending", activeForm: "Detecting tier"},
  {content: "Initialize spec", status: "pending", activeForm: "Initializing"},
  {content: "Add overview", status: "pending", activeForm: "Adding overview"},
  {content: "Add requirements", status: "pending", activeForm: "Adding requirements"},
  {content: "Add use cases", status: "pending", activeForm: "Adding use cases"},
  {content: "Add acceptance criteria", status: "pending", activeForm: "Adding acceptance"},
  {content: "Add notes", status: "pending", activeForm: "Adding notes"},
  {content: "Validate spec", status: "pending", activeForm: "Validating"},
  {content: "Reconcile if needed", status: "pending", activeForm: "Reconciling"},
  {content: "Update CLAUDE.md", status: "pending", activeForm: "Documenting"}
])
```

---

## Example Session

### T3 Example

```
User: "Guide me step by step to create a spec for search feature"

→ Step 0a: ANALYZE
  Detected: Electron app with React, Monaco Editor
  Tech: TypeScript, Electron 39, React 18

→ Step 0b: TIER DETECTION
  Recommended: T3 (Lite spec)
  Reason: ~12 requirements, single concern

→ Step 0c: User confirms T3

→ Step 1: INIT
  Created: Spec #002 "editor-search"
  Path: specs/spec-t3-002-editor-search/
  Tier: T3

→ Step 2: ADD 01-overview
  Summary, purpose, scope defined
  Created: 01-overview.md

→ Step 3: ADD 02-requirements
  FR-001 through FR-008 defined
  NFR-001 through NFR-003 defined
  Created: 02-requirements.md

→ Step 4: ADD 03-acceptance
  Test cases for all FRs
  Definition of done
  Created: 03-acceptance.md

→ Step 5: VALIDATE
  Score: 68% (PASS - threshold 50%)

→ Step 6: UPDATE_CLAUDE_MD
  Updated: CLAUDE.md with Spec #002
  Ready for implementation!
```

### T4 Example

```
User: "Guide me to create a spec for payment integration"

→ Step 0b: TIER DETECTION
  Recommended: T4 (Standard spec)
  Reason: 35+ requirements, external integrations, security-critical

→ Step 0c: User confirms T4

→ Step 1: INIT
  Created: Spec #003 "payment-integration"
  Tier: T4

→ Steps 2-6: ADD all 5 sections
  ...

→ Step 7: VALIDATE
  Score: 84% (PASS - threshold 80%)

→ Step 8: RECONCILE
  No issues found, skipped

→ Step 9: UPDATE_CLAUDE_MD
  Updated: CLAUDE.md with Spec #003
```
