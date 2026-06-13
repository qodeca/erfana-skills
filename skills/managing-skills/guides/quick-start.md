# Quick Start Guide

Fast reference for common skill operations.

---

## Design Philosophy

> **Let Claude design your skills.** LLMs are often better at writing prompts and structuring workflows than humans doing it manually.

### What This Means

1. **Describe, don't prescribe**: Tell the skill what outcome you want, not how to build it
2. **Iterate with Claude**: Start with a rough idea, refine through conversation
3. **Trust the templates**: The skill knows the patterns - focus on your domain expertise
4. **XML structure is recommended**: All agents use XML tags for clearer section boundaries

### Good vs Bad Approach

| ❌ Bad: Manual specification | ✅ Good: Collaborative design |
|------------------------------|-------------------------------|
| "Create SKILL.md with these exact 15 sections..." | "Create a skill for formatting JSON files" |
| "The agent should have these 7 constraints..." | "The skill should handle edge cases like empty arrays" |
| "Use this specific prompt structure..." | "Make it work with both single files and directories" |

### When Human Intervention Improves Results

- **Domain expertise**: You know your use case better than Claude
- **Organizational constraints**: Internal naming conventions, security requirements
- **Edge cases**: Specific scenarios you've encountered
- **Integration points**: How this connects to your existing tools

### The Iteration Pattern

```
1. User: High-level description of need
2. Claude: Generates complete skill structure
3. User: "Make it also handle [edge case]"
4. Claude: Refines skill with your feedback
5. User: "Perfect" or "Also add [feature]"
6. Claude: Final adjustments
7. Validation: Automatic quality checks
```

---

## XML Structure (Mandatory)

All agents **SHOULD** use XML tags. XML tags help Claude parse and follow structured instructions more reliably.

### Required Tags

| Tag | Purpose |
|-----|---------|
| `<context>` | Role, tools, mission |
| `<task>` | Single-sentence objective |
| `<workflow>` | Numbered steps with tool examples |
| `<constraints>` | NEVER/ALWAYS/MUST rules |
| `<output>` | Exact format specification |

### Agent Structure Example

```markdown
# Agent: validate-input

---
name: validate-input
description: MUST BE USED to validate input data. Use PROACTIVELY before processing.
tools: Read, Glob
model: sonnet
---

<context>
Input validator for data processing.
Tools: Read, Glob.
Mission: Ensure input meets requirements before processing.
</context>

<task>
Validate input data for completeness and format.
</task>

<workflow>
1. Read input file
   `Read {input_path}` → parse content

2. Validate structure
   Check: required fields present
   Check: format matches schema

3. Return result
</workflow>

<constraints>
NEVER:
- Proceed with invalid input: causes downstream failures

ALWAYS:
- Report specific validation errors
- Cite field:value for each issue
</constraints>

<output>
{
  "valid": boolean,
  "errors": [string]
}
</output>
```

See `templates/agent-template.md` for complete template with all optional tags.

---

## Operation: Create a New Skill

### When to Use

- Automating a repetitive task
- Standardizing a multi-step workflow
- Capturing domain expertise

### Quick Steps

1. **Invoke skill:** `use managing-skills` or describe your need
2. **Answer questionnaire:** Provide requirements (problem, triggers, tools)
3. **Review design:** Confirm name, structure, complexity
4. **Files created:** Skill directory with SKILL.md and agents
5. **Validate:** Automatic checklist validation

### Example

```
User: Create a skill for formatting JSON files

managing-skills:
1. Gathers requirements via questionnaire
2. Designs: name=formatting-json, complexity=simple
3. Creates: SKILL.md (uses shared agent at agents/)
4. Validates against checklists
5. Returns: Complete skill at skills/formatting-json/
```

---

## Operation: Review an Existing Skill

### When to Use

- Monthly health check
- Before major changes
- After user-reported issues

### Quick Steps

1. **Invoke:** `Review my [skill-name] skill`
2. **Choose depth:** quick (5min) / standard (30min) / deep (1-2hr)
3. **Get report:** Score, findings, action items
4. **Act on recommendations**

### Example

```
User: Review my code-review skill

managing-skills:
1. Runs standard review checklist
2. Evaluates architecture, agents, workflow
3. Returns: Score 87/100, status "minor-issues"
4. Action items: 2 medium priority fixes
```

---

## Operation: Modify an Existing Skill

### When to Use

- Bug fixes
- Feature enhancements
- Refactoring
- Updating dependencies

### Quick Steps

1. **Invoke:** `Modify my [skill-name] skill to [change]`
2. **Backup created:** Automatic (unless skipped)
3. **Changes applied:** Targeted modifications
4. **Validation:** Before/after comparison
5. **Rollback available:** If validation fails

### Example

```
User: Add a new agent to my testing skill

managing-skills:
1. Backs up current version
2. Creates new agent file
3. Updates SKILL.md agents table
4. Validates (score maintained)
5. Returns: Modification complete, rollback available
```

---

## Quick Reference

| Operation | Trigger Phrases | Output |
|-----------|-----------------|--------|
| Create | "create skill", "new skill for" | Skill directory |
| Review | "review skill", "audit skill", "check skill" | Score + action items |
| Modify | "modify skill", "update skill", "change skill", "fix skill" | Modified files |

---

## Common Questions

### How do I know which operation to use?

| Situation | Operation |
|-----------|-----------|
| Starting from scratch | Create |
| Checking if skill is healthy | Review |
| Fixing a bug | Modify (bug-fix) |
| Adding a feature | Modify (enhancement) |

### What if I'm not sure about requirements?

The skill will ask clarifying questions through a questionnaire. You don't need to know everything upfront.

### Can I skip the questionnaire?

If your request is specific and complete, the skill proceeds directly. Questionnaire only appears when clarification is needed.

### What happens if validation fails?

- For Create: Issues reported, skill saved as draft
- For Modify: Automatic rollback to backup
- For all: Specific recommendations provided
