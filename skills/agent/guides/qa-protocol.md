# Q&A Protocol for AskUserQuestion

Standard protocol for conducting Q&A sessions using the `AskUserQuestion` tool throughout the agent creation/update workflow.

---

## Core Rules

1. **MANDATORY** — Q&A cannot be skipped, regardless of context clarity
2. **Batch questions** — Use 1-4 questions per `AskUserQuestion` call to minimize back-and-forth
3. **Analyze before follow-up** — After each response, ANALYZE answers before asking follow-up questions
4. **Contextual follow-ups** — Follow-up questions MUST be informed by previous answers; do not ask irrelevant or already-answered questions
5. **Full coverage** — Model MUST identify ALL questions worth asking based on context; do not limit to examples

---

## Question Format

Each question follows the `AskUserQuestion` tool structure:

```
**Header:** "<short label>" — "<question ending with ?>"
- Options: <option 1> / <option 2> / <option 3> / <option 4>
```

**Header requirements:**
- Max 12 characters
- Descriptive label (e.g., "Agent purpose", "Trigger type", "Tools")

**Question requirements:**
- Clear and specific
- Ends with question mark
- Single question per entry

**Options requirements:**
- 2-4 distinct, mutually exclusive choices
- User can always select "Other" for custom input (handled by tool)

---

## Q&A Flow

```
┌─────────────────────────────────────────┐
│  1. Identify questions worth asking     │
│     based on current context            │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  2. Batch 1-4 questions in single       │
│     AskUserQuestion call                │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  3. ANALYZE user's answers              │
│     - What was clarified?               │
│     - What remains ambiguous?           │
│     - What new questions emerged?       │
└─────────────────┬───────────────────────┘
                  ▼
┌─────────────────────────────────────────┐
│  4. If more questions needed:           │
│     → Return to step 1 with new context │
│     Otherwise: Proceed to next phase    │
└─────────────────────────────────────────┘
```

---

## Q&A Depth

Model decides question count based on context:

| Context Clarity | Questions |
|-----------------|-----------|
| Clear, specific requirements | Fewer questions (1-2) |
| Ambiguous or complex request | More questions (3-4) |
| UPDATE with clear issue | Focused questions on issue |
| CREATE with vague intent | Broad exploratory questions |

---

## Anti-Patterns

- ❌ Skipping Q&A because "requirements seem clear"
- ❌ Asking one question at a time when batching is possible
- ❌ Asking follow-up questions without analyzing previous answers
- ❌ Repeating questions already answered
- ❌ Limiting to example questions only
- ❌ Using open-ended questions without options

---

## Example Q&A Session

**First call (Phase 0 — Gather Intent):**
```
AskUserQuestion with 3 questions:
1. Header: "Purpose" — "What problem should this agent solve?"
   Options: Code quality / Documentation / Testing / Research

2. Header: "Trigger" — "When should this agent be invoked?"
   Options: Auto-delegation / Manual only / Both

3. Header: "Permissions" — "What file access level is needed?"
   Options: Read-only / Read + Edit / Full access
```

**Analysis of answers:**
- User selected: Research, Auto-delegation, Read-only
- Clarified: Agent is for research tasks, should auto-trigger, no file modifications
- New questions: What research domain? Web access needed?

**Follow-up call:**
```
AskUserQuestion with 2 questions:
1. Header: "Domain" — "What type of research will this agent perform?"
   Options: Codebase exploration / Web research / Documentation lookup

2. Header: "Web access" — "Does this agent need web search capabilities?"
   Options: Yes (WebSearch + WebFetch) / No (local only)
```

---

## Phase-Specific Notes

### Phase 0: Gather Intent
- Focus on understanding user's goal
- Distinguish CREATE vs UPDATE intent
- For UPDATE: identify what's wrong and what needs change

### Phase 1: Understand the Need (after research)
- Incorporate research findings into questions
- Present best practices and ask for confirmation
- Validate tool and permission requirements

### Phase 2: Design the Agent
- Confirm naming and description
- Validate trigger pattern selection
- Verify model choice

### Phase 4: Write System Prompt
- Validate workflow expectations
- Identify edge cases and constraints
- For UPDATE: confirm change addresses original issue
