<!-- Template: Feature. GitHub issue type: Feature (where the repository has issue types). Kind label: feature (or enhancement, whichever the repo has).
     Fill every <…>. Use markdown headings, not XML tags – GitHub hides unknown HTML tags. -->

## Summary

<2–4 plain sentences for a human reviewer: who needs this, what they will be able to do, and why it matters now. No jargon; explain any technical word in a few words.>

**Done when:** <one plain sentence – what a user can do when this ships.>

---

## For AI agents

### Goal
<Implement … – one sentence that starts with a verb and names the user-visible result.>

### Context
<Who uses this and why, and who else is affected – "all users of the export", "admins only". Constraints the solution must respect, each with its reason. Existing patterns to copy, for example "follow how `<similar feature>` is built in `<path>`".>

### Requirements
1. <behaviour the user can observe>
2. <…>
<State the scope of each rule explicitly – "applies to all list views", not "applies to the list view" when you mean all of them.>

### Acceptance criteria
1. <binary, testable statement with a concrete threshold where it matters – "loads in under 2 s with 1,000 rows", not "loads fast">
2. <…>
3. <edge case: empty state, error state, permission denied>

### Verification
- Run `<test / build / lint command>` and include the output in the PR.
- <end-to-end check as a user would do it – the steps, or the screen to screenshot>
Tests are evidence of correct behaviour, not the goal. Do not change, skip or special-case existing tests to make them pass; if a test looks wrong, report it in the PR instead.

### Out of scope
- <nearby features that are explicitly not part of this issue>
- Unrequested extras: no additional features, refactors, docs or test suites beyond what the criteria need. Mention ideas at the end of the PR instead.

### Stop and ask when
- The task cannot be done as written (missing file, access or information). Stop and report what is missing; do not work around it.
- A requirement can be read in two ways that lead to different work.
- The work needs a new dependency, a schema or public API change, or access you do not have.

### Report in the PR
- What was done, criterion by criterion, with the command output that proves each one.
- What was not done, stubbed or left as a TODO – or "nothing".
- Any code copied or reused from elsewhere in the repo, a library, or a prior fix.
- Every check you ran, and any check you could not run, with the reason.

### Starting points (verify before use – as of `<origin sha>`)
- `<path>` – <why it is relevant>
