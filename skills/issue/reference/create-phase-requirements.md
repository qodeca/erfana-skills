# Create phase requirements reference

Capability definitions for each phase of the **Create** operation. Used by dynamic agent selection (`mi-agent-matcher` reads this file at runtime; the `capabilities` blocks below are matched against each agent's `capabilities` frontmatter).

For shared vocabulary (capabilities, domains, criticality, allow_direct policy) see [phase-requirements-shared.md](phase-requirements-shared.md).

Phases 1 and 5 are orchestrator-direct (`allow_direct: true`): the orchestrator owns all `AskUserQuestion` interaction (SKILL.md rule 7). Phases 2-4 delegate to single-responsibility agents.

---

## Create operation phases

### create_phase_1_understand

```yaml
capabilities:
  - requirements-analysis
tools: []
domain: analysis
criticality: high
allow_direct: true
notes: Orchestrator listens to the user and classifies the issue type (bug vs enhancement). No agent.
```

### create_phase_2_clarify

```yaml
capabilities:
  - requirements-analysis
  - question-generation
tools:
  - Read
domain: analysis
criticality: high
allow_direct: false
notes: Delegate to mi-issue-questioner to GENERATE the clarifying questions; the orchestrator then asks them via AskUserQuestion and passes answers back. The agent never calls AskUserQuestion.
```

### create_phase_3_duplicate_check

```yaml
capabilities:
  - gh-cli
  - duplicate-detection
  - code-search
tools:
  - Read
  - Bash
domain: infrastructure
criticality: high
allow_direct: false
notes: Delegate to mi-duplicate-finder for a read-only gh search with sanitized keywords. Never skipped (SKILL.md rule 9).
```

### create_phase_4_draft

```yaml
capabilities:
  - issue-drafting
  - template-application
tools:
  - Read
domain: documentation
criticality: high
allow_direct: false
notes: Delegate to mi-issue-drafter, which fills the template from gathered requirements and returns a structured draft. Read-only — drafting needs no Write or Bash.
```

### create_phase_5_confirm

```yaml
capabilities:
  - user-interaction
tools: []
domain: acceptance
criticality: high
allow_direct: true
notes: Orchestrator presents the exact title/body/labels/target repo and obtains explicit approval via AskUserQuestion before running gh issue create. No agent.
```
