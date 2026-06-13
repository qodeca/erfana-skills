# Q&A Protocol Guide

Standardized methodology for gathering requirements through questions, whether via questionnaire agents or direct `AskUserQuestion` tool usage.

---

## Core Principles

### 1. Q&A is Mandatory

**NEVER skip requirement gathering.** Even if a request seems clear, validate understanding before proceeding.

```
❌ "I'll create that skill for you right away"
✅ "Let me confirm a few details before creating the skill..."
```

### 2. Batch Questions Efficiently

Use **1-4 questions per interaction** to balance:
- Minimizing back-and-forth (efficiency)
- Not overwhelming the user (usability)
- Allowing follow-up based on answers (context)

### 3. Analyze Before Follow-Up

After receiving answers:
1. Process what was learned
2. Identify remaining gaps
3. Only ask questions that are contextually informed
4. Never repeat questions already answered

### 4. Context-Aware Depth

Adjust question depth based on request clarity:

| Request Clarity | Questions Needed | Example |
|-----------------|------------------|---------|
| Very clear | 2-3 confirming | "Create a skill to format JSON with 2-space indent" |
| Mostly clear | 4-5 clarifying | "Create a skill to format files" |
| Vague | 6-8 exploring | "I need help with files" |
| Unclear | Full questionnaire | "Make something useful" |


---

## Requirements Gathering Protocol

### When to Gather Requirements

**Trigger Conditions**

Gather requirements ONLY when:
- User request is ambiguous (multiple valid interpretations)
- Key information is missing (trigger, scope, tools, output)
- Complexity cannot be determined from request alone
- User explicitly asks for guidance or help deciding

**Skip Conditions**

Do NOT gather requirements when:
- Request is specific and complete
- User provides all necessary details upfront
- This is a well-defined, routine operation
- User says "just do it" or similar

### Question Depth by Complexity

| Complexity | Questions | When to Use |
|------------|-----------|-------------|
| Simple | 3-5 | Clear task, known tools, single output |
| Medium | 5-8 | Multi-step workflow, some unknowns |
| Complex | 8-12 | Major integration, many dependencies |

**Complexity Assessment Criteria**

*Simple:*
- Single primary task
- Obvious tool requirements
- Well-understood output format
- No external dependencies

*Medium:*
- Multi-step workflow
- Some design decisions needed
- Templates or formatting required
- Moderate scope

*Complex:*
- Multiple integrations
- Security considerations
- Validation/quality requirements
- Large scope or high impact

### Question Categories by Operation

**For Skill Creation**

| Category | Questions | Complexity Level |
|----------|-----------|------------------|
| Problem Definition | What task? How often? Who uses? | All |
| Trigger Strategy | Auto-discovery vs explicit? Keywords? | All |
| Complexity Level | Simple/Medium/Complex? | All |
| Tool Requirements | Which tools needed? | All |
| Output Format | What format? Structure? | Medium+ |
| Error Handling | How to handle failures? | Medium+ |
| Integration Needs | External systems? APIs? | Complex |
| Security | Sensitive data? Permissions? | Complex |

**For Skill Modification**

| Category | Questions | Complexity Level |
|----------|-----------|------------------|
| Change Type | Bug fix/Enhancement/Refactor? | All |
| Scope Assessment | How many files? | All |
| Affected Components | Which parts change? | All |
| Testing Strategy | How to verify? | Medium+ |
| Rollback Plan | How to revert? | Complex |

**For Skill Review**

| Category | Questions | Complexity Level |
|----------|-----------|------------------|
| Review Purpose | Why reviewing? | All |
| Review Depth | Quick/Standard/Deep? | All |
| Focus Areas | What to prioritize? | All |
| Success Criteria | How to know it passed? | Medium+ |

### Recommendation Guidelines

**When to Recommend an Option**

Base recommendations on:
- Anthropic best practices
- Most common use case
- Lowest risk option
- Industry standards

**How to Write Rationale**

Good rationale:
- "Most skills are created to automate repetitive tasks."
- "Both explicit and auto-discovery provides maximum flexibility."
- "Smaller changes are safer and faster to validate."

Bad rationale:
- "This is better." (no explanation)
- "Based on my experience..." (not objective)
- "Because I said so." (not helpful)

**Handling Recommendation Overrides**

When user chooses non-recommended option:
1. Accept the choice
2. Document the decision
3. Note it was a deliberate override
4. Continue without judgment

### Quality Checklist for Requirements

Before proceeding from requirements gathering:

- [ ] All required questions answered explicitly
- [ ] No conflicting requirements identified
- [ ] "Other" responses have sufficient detail
- [ ] User confirmed requirements summary
- [ ] Decisions documented with rationale
- [ ] Complexity level determined
- [ ] Ready to proceed to Phase 1

### Integration with Workflow

Requirements gathering is **Phase 0** in the skill lifecycle:

```
Phase 0: Requirements Gathering (when unclear)
    ↓
Phase 1: Understand the Need (validates requirements)
    ↓
Phase 2: Design the Skill
    ↓
Phase 3: Create Files
    ↓
...
```

Gathered requirements inform:
- Phase 1 validation (confirms understanding)
- Phase 2 design decisions (structure, complexity)
- Phase 3 file creation (templates, agents)

---

## When to Use Questionnaire Agent vs Direct Q&A

### Use Questionnaire Agent (`gather-requirements`)

- **New skill creation** - Full requirements needed
- **Major modifications** - Scope and impact unclear
- **Complex operations** - Multiple decisions required
- **User prefers guided process** - Step-by-step collection

### Use Direct AskUserQuestion

- **Quick clarifications** - 1-2 specific questions
- **Binary choices** - Yes/no decisions
- **Mid-workflow decisions** - Need immediate input
- **Simple operations** - Review, quick maintenance

---

## Question Format Standards

### For AskUserQuestion Tool

```markdown
Question: [Clear, specific question ending with ?]
Header: [≤12 chars, e.g., "Complexity"]
Options:
  - Label: [Option text]
    Description: [What this choice means]
  - Label: [Another option]
    Description: [What this choice means]
MultiSelect: false (unless choices aren't mutually exclusive)
```

### Good vs Bad Questions

| ❌ Bad | ✅ Good |
|--------|---------|
| What do you want? | What should the skill output? |
| How complex? | How many workflow steps are needed? |
| Any preferences? | Which output format do you prefer? |
| Anything else? | Should the skill handle error cases? |

### Recommended Option Pattern

When one option is clearly better for most cases:
- Put the recommended option **first**
- Add "(Recommended)" to the label
- Explain why in the description

```markdown
Options:
  - Label: "Both explicit and auto-discovery (Recommended)"
    Description: "Maximum flexibility - users can invoke directly or let it trigger naturally"
  - Label: "Explicit only"
    Description: "User must say 'use [skill-name]' to activate"
```

---

## Q&A Flow

```
┌──────────────────┐
│  Receive Request │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Assess Clarity   │
│ (clear/partial/  │
│  vague/unclear)  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Identify ALL     │
│ Needed Questions │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Batch 1-4        │◄──────┐
│ Most Important   │       │
└────────┬─────────┘       │
         │                 │
         ▼                 │
┌──────────────────┐       │
│ Wait for Answers │       │
└────────┬─────────┘       │
         │                 │
         ▼                 │
┌──────────────────┐       │
│ Analyze Answers  │       │
│ Update Context   │       │
└────────┬─────────┘       │
         │                 │
         ▼                 │
    ┌────────────┐         │
    │ Gaps       │─── Yes ─┘
    │ Remain?    │
    └─────┬──────┘
          │ No
          ▼
┌──────────────────┐
│ Proceed with     │
│ Complete Info    │
└──────────────────┘
```

---

## Batching Strategy

### Round 1: Core Requirements

First batch should establish the foundation:
- What problem to solve
- Who/what triggers it
- What output is expected

### Round 2: Implementation Details

Based on Round 1, ask about:
- Complexity level
- Tool requirements
- Error handling needs

### Round 3: Refinements (if needed)

Only if ambiguities remain:
- Edge cases
- Integration needs
- Performance requirements

---

## Handling Common Situations

### User Skips a Question

```markdown
"This question is required to proceed. [Reason why it matters]

Let me rephrase: [Simpler version of question]"
```

### Conflicting Answers

```markdown
"I noticed a potential conflict:
- You selected [Option A] for [Question 1]
- But also selected [Option B] for [Question 2]

These typically don't work well together because [reason].

Which approach would you prefer?"
```

### User is Unsure

```markdown
"For this question, here's what I'd recommend for your use case:

[Recommended option] because [specific reason based on their previous answers].

Would you like to go with this recommendation, or would you prefer to discuss the alternatives?"
```

### 3+ Clarification Rounds Needed

If after 3 rounds you still have gaps:

```markdown
"I want to make sure we get this right. Here's what I've gathered so far:

[Summary of requirements]

Remaining questions:
1. [Question]
2. [Question]

Should we continue with clarification, or would you prefer to:
- Proceed with defaults for the unknowns
- Start with a simpler version and iterate"
```

---

## Escalation Protocol

When Q&A cannot resolve requirements:

1. **Summarize what's known**
2. **List what's unclear**
3. **Offer alternatives:**
   - Proceed with documented assumptions
   - Start minimal and expand
   - Pause and gather more context

```markdown
## Current Understanding

**Clear:**
- [Requirement 1]
- [Requirement 2]

**Unclear:**
- [Gap 1]
- [Gap 2]

**Options:**
1. Proceed with defaults (I'll document assumptions)
2. Create minimal version first, then expand
3. Pause until you can provide more details

Which would you prefer?
```

---

## Integration with Skills

### In SKILL.md

When skill uses questionnaire:
- Reference `gather-requirements` agent
- Define which questions are mandatory
- Specify escalation to user if agent can't resolve

### In Agents

Agents should NOT ask questions directly. Instead:
- Return structured output indicating missing inputs
- Let skill orchestrator handle user interaction
- Use escalation patterns when blocked

---

## Checklist

Before proceeding from Q&A phase:

- [ ] All required questions answered
- [ ] No conflicting requirements detected
- [ ] Complexity assessed
- [ ] User expectations documented
- [ ] Assumptions explicitly stated (if any)
