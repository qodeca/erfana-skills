<!-- Template: Task. GitHub issue type: Task (where the repository has issue types). Kind label: refactor, documentation, dependencies, design or security – add the
     matching section from kind-sections.md. Also used for checklist issues made by erfana:backlog (see the end).
     Fill every <…>. Use markdown headings, not XML tags – GitHub hides unknown HTML tags. -->

## Summary

<2–4 plain sentences for a human reviewer: what work this is, why it is worth doing, and what changes for the team or the product when it is done.>

**Done when:** <one plain sentence.>

---

## For AI agents

### Task
<Change / update / remove … – one sentence that starts with a verb.>

### Context
<Why this is needed now, and constraints with their reasons.>

<!-- kind section from kind-sections.md goes here -->

### Acceptance criteria
1. <binary, testable statement>
2. <…>

### Verification
Run `<test / build / lint command>` and include the output in the PR. If a check cannot run, say which one and why. Tests are evidence of correct behaviour, not the goal. Do not change, skip or special-case existing tests to make them pass; report a wrong test instead.

### Out of scope
- <what is explicitly not part of this task>
- Unrequested features, refactors or docs. Mention ideas at the end of the PR instead.

### Stop and ask when
- The task cannot be done as written (missing file, access or information). Stop and report what is missing; do not work around it.
- <the specific situation where the agent cannot decide alone>

### Report in the PR
- What was done, criterion by criterion, with the command output that proves each one.
- What was not done, stubbed or left as a TODO – or "nothing".
- Any code copied or reused from elsewhere in the repo, a library, or a prior fix.
- Every check you ran, and any check you could not run, with the reason.

### Starting points (verify before use – as of `<origin sha>`)
- `<path>` – <why it is relevant>

<!-- Checklist variant (used by erfana:backlog for grouped small issues). Replace "Acceptance criteria" with:

### Items
Work through the items in order. Tick each one in the PR description when its criteria pass.

- [ ] **<short item title>** (from #<n>)
  - Criteria: <binary, testable statement>; <…>
  - Starting points: `<path>`
- [ ] **<short item title>** (from #<n>)
  - Criteria: <…>

Done when every item is ticked and the verification command passes.
-->
