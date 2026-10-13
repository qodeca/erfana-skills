---
name: handoff
description: Compacts the current conversation into a handoff document that another agent, harness, directory, or colleague can pick up. Runs only when the user invokes it.
when_to_use: |
  The user invokes the skill directly, optionally describing what the next session is for. Trigger phrases: "/erfana:handoff", "write a handoff", "hand this off to another agent", "fork this into a new session".
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section in the document, naming which skills the next agent should load.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.

Tell the user the full path of the file you wrote, because temporary directories differ per OS and some environments clear them between sessions.

When it is unclear whether a handoff is the right move at all – rather than continuing, clearing, delegating to a subagent, or compacting – [references/phase-boundaries.md](references/phase-boundaries.md) has the decision tree, and [references/handoff-guide.md](references/handoff-guide.md) covers when a handoff pays off and its common failure modes.

Adapted from the `handoff` skill in [mattpocock/skills](https://github.com/mattpocock/skills) (MIT); provenance and changes are recorded in [references/UPSTREAM.md](references/UPSTREAM.md).
