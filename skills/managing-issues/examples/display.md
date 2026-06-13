# Display Operation Examples

Walkthroughs for the three Display sub-modes added in v4.2.2: single, list, search.

---

## Example 1: Single mode – view one issue

**User says:** "show issue #&lt;N&gt;" (replace &lt;N&gt; with the issue number, e.g. `show issue #42`)

**Workflow:**

```
1. Phase 0: Pre-flight
   → Bash: gh auth status (exit 0) ✓
   → Detect repo from cwd: qodeca/erfana-skills

2. Phase 1: Fetch issue data
   → Agent tool:
       subagent_type: "mi-issue-displayer"
       prompt: |
         {
           "mode": "single",
           "issue_number": <N>,
           "repo": "<owner>/<repo>"
         }
   → Agent invokes: gh issue view <N> --json number,title,state,author,
     assignees,labels,createdAt,updatedAt,url,body,comments

3. Phase 2: Format and present
   → Agent returns formatted markdown
   → Orchestrator passes through to user
   → Optional follow-up via AskUserQuestion:
       "What would you like to do next?"
       Options: Implement this issue / Review related code /
                List related issues / Done
```

**Sample output (illustrative — actual content depends on the live issue):**

```markdown
# Issue #<N>: <issue title>

**State:** open  **Author:** @<login>  **Created:** <date>
**Assignees:** @<login1>, @<login2>  **Labels:** <label1>, <label2>
**URL:** https://github.com/<owner>/<repo>/issues/<N>

---

<issue body content rendered as-is>

---

## Comments (<count>)

- @<commenter1> (<relative time>): <last 3 comments summarized>
- @<commenter2> (<relative time>): <continued>
```

**Duration:** ~3 seconds (single gh CLI call + markdown format).

---

## Example 2: List mode – list open bugs

**User says:** "list open issues with label &lt;label&gt;" (e.g. `list open issues with label bug`)

**Workflow:**

```
1. Phase 0: Pre-flight (gh auth verified) ✓

2. Phase 1: Fetch issue data
   → Agent tool:
       subagent_type: "mi-issue-displayer"
       prompt: |
         {
           "mode": "list",
           "state": "open",
           "labels": ["bug"],
           "limit": 30
         }
   → Agent invokes: gh issue list --state=open --label=bug --limit=30
     --json number,title,state,author,labels,createdAt,url

3. Phase 2: Format and present
   → Agent returns markdown table
   → Orchestrator passes through
   → Optional drill-down via AskUserQuestion:
       "Drill into one of these issues?"
       Options: Show first issue / Refine filter / Done
```

**Sample output (illustrative — placeholder rows; actual content depends on live issues):**

```markdown
| # | Title | State | Author | Labels | Created |
|---|---|---|---|---|---|
| #&lt;N&gt; | <title> | open | @<login> | bug, <label> | <relative time> |
| #&lt;N&gt; | <title> | open | @<login> | bug, <label> | <relative time> |
| #&lt;N&gt; | <title> | open | @<login> | bug, <label> | <relative time> |
```

**Duration:** ~3 seconds (single gh CLI call + table format).

---

## Example 3: Search mode – search by free-text query

**User says:** "find issues mentioning &lt;free-text query&gt;" (e.g. `find issues mentioning auth flow`)

**Workflow:**

```
1. Phase 0: Pre-flight (gh auth verified) ✓

2. Phase 1: Fetch issue data
   → Agent tool:
       subagent_type: "mi-issue-displayer"
       prompt: |
         {
           "mode": "search",
           "query": "<free-text query>",
           "state": "all",
           "limit": 10
         }
   → Agent invokes: gh search issues "<free-text query>"
     --limit=10 --json number,title,state,author,labels,createdAt,
     repository,url
   (Note: state="all" is translated by the agent to no --state flag,
    because gh search issues only accepts --state=open or --state=closed.)

3. Phase 2: Format and present
   → Agent returns markdown table ordered by relevance
   → Orchestrator passes through
   → Optional drill-down via AskUserQuestion
```

**Sample output (illustrative — placeholder rows; actual content depends on live search):**

```markdown
| Rank | # | Title | Repo | State | Labels | Created |
|---|---|---|---|---|---|---|
| 1 | #&lt;N&gt; | <title relevant to query> | <owner>/<repo> | open | bug, <label> | <relative time> |
| 2 | #&lt;N&gt; | <title relevant to query> | <owner>/<repo> | closed | enhancement | <relative time> |
| 3 | #&lt;N&gt; | <title relevant to query> | <owner>/<repo> | closed | bug | <relative time> |
```

**Duration:** ~3 seconds (single gh search call + table format).

---

## When the request is ambiguous

**User says:** "show issue"  (no number specified)

**Orchestrator behaviour:**

```
1. Phase 0: Pre-flight (gh auth verified) ✓

2. Disambiguation (BEFORE Phase 1)
   → AskUserQuestion: "Which issue would you like to display?"
       Options:
         - Provide an issue number (e.g., #<N>)
         - List recent open issues instead (Display list mode)
         - List issues with a specific label (Display list mode)
   → User picks based on intent
   → Re-route to appropriate Display mode (single or list) with
     correct inputs
```

This pattern keeps Display strict – the agent never guesses an issue number on the user's behalf.

---

## When `gh` CLI is not authenticated

**User says:** "show issue #&lt;N&gt;" (replace &lt;N&gt; with the issue number, e.g. `show issue #42`)  (without prior `gh auth login`)

**Orchestrator behaviour:**

```
1. Phase 0: Pre-flight
   → Bash: gh auth status → exit 1 (not authenticated)
   → mi-issue-displayer returns:
       {
         status: "needs_user_input",
         question: { text: "GitHub CLI not authenticated.
                            Run `gh auth login` and retry." }
       }

2. Orchestrator surfaces the auth prompt via AskUserQuestion
3. User runs `gh auth login` in a separate terminal and confirms
4. Orchestrator retries Phase 0 → Phase 1 → Phase 2
```

---

## Quick reference

| Example | Mode | Trigger phrase | Underlying gh call |
|---------|------|----------------|---------------------|
| 1 | single | "show issue #&lt;N&gt;" | `gh issue view <N> --json ...` |
| 2 | list | "list open issues with label bug" | `gh issue list --state=open --label=bug --limit=30 --json ...` |
| 3 | search | "find issues mentioning X" | `gh search issues "X" --limit=10 --json ...` (omit --state for "all"; pass `--state=open` or `--state=closed` for narrower scope) |

---

## Related

- [operations/display.md](../operations/display.md) – the operation flow
- [agents/mi-issue-displayer.md](../../../agents/mi-issue-displayer.md) – the leaf agent contract
- [reference/labels.md](../reference/labels.md) – label catalog used in list/search filters
