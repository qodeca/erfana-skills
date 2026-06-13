# Skill Creation Examples

Complete examples demonstrating orchestrator architecture with agents from builtin and shared sources, input conditions, post-step validation, and quality gates.

## Overview

This directory contains detailed examples of skills at different complexity levels, plus agent-focused examples showing how to work with builtin and shared agents.

## Quick Reference

| Example | Type | Phases | Agents | Key Features |
|---------|------|--------|--------|--------------|
| [Example 1](examples-simple.md) | Simple | 1 | 1 | Minimal viable skill structure |
| [Example 2](examples-medium.md) | Medium | 2 | 2 | Multi-phase workflow |
| [Example 3](examples-complex.md) | Complex | 3 | 4 | Full-featured implementation |
| [Agent Creation](examples-creating-agents.md) | Agents | - | 3 | Simple/standard/complex agents |
| [Examples 4-7](examples-agents.md) | Agent Sources | - | - | Builtin/shared mixing |
| [CC 2.1 Capabilities](examples-cc21-capabilities.md) | CC 2.1 | - | - | context:fork, memory, hooks, injection |

## Detailed Examples

### [Simple Skill Example](examples-simple.md)
**Skill:** `formatting-json`
- **Purpose:** Format JSON with validation
- **Structure:** 1 phase, 2 steps, 1 agent
- **Best For:** Learning minimal architectural patterns
- **Highlights:**
  - Input conditions with blocking validation
  - Post-step validation checkboxes
  - Quality gates with retry logic
  - Mandatory todo list tracking

### [Medium Skill Example](examples-medium.md)
**Skill:** `reviewing-code`
- **Purpose:** Review code quality and generate reports
- **Structure:** 2 phases, 4 steps, 2 agents
- **Best For:** Understanding multi-phase workflows
- **Highlights:**
  - Phase-based organization
  - Multiple agents with distinct purposes
  - Template-based output formatting
  - Error escalation patterns

### [Complex Skill Example](examples-complex.md)
**Skill:** `generating-tests`
- **Purpose:** Generate and validate unit tests
- **Structure:** 3 phases, 6 steps, 4 agents
- **Best For:** Full-featured skill implementation
- **Highlights:**
  - Three-phase architecture
  - Four specialized agents
  - Validation feedback loops
  - Comprehensive error handling

### [Agent Creation Examples](examples-creating-agents.md)
**Focus:** Creating shared agents
- **Purpose:** Show how to create agents at different complexity levels
- **Examples:** Simple (haiku), Standard (sonnet), Complex (opus)
- **Best For:** Understanding agent design patterns
- **Highlights:**
  - Complete agent specifications
  - Input/output contracts
  - Token budgets by complexity
  - Agent comparison table
  - Anti-pattern examples

### [Agent Source Examples](examples-agents.md)
**Examples 4-7:** Working with different agent sources
- **Purpose:** Demonstrate agent discovery, matching, and source selection
- **Best For:** Understanding when to use builtin vs shared agents
- **Highlights:**
  - Example 4: Using only builtin agents
  - Example 5: Mixed sources (builtin + shared)
  - Example 6: Converting to builtin/shared
  - Example 7: Handling partial matches (60-79%)
  - Agent source selection guide
  - Decision flow for agent selection

### [CC 2.1 Capabilities](examples-cc21-capabilities.md)
**Examples 8-12:** Using Claude Code 2.1 features
- **Purpose:** Demonstrate new CC 2.1 patterns in skill and agent design
- **Best For:** Understanding context: fork, memory, hooks, dynamic injection, background execution
- **Highlights:**
  - Example 8: Skill using `context: fork`
  - Example 9: Agent with persistent memory
  - Example 10: Hook-enabled agent
  - Example 11: Dynamic context injection skill
  - Example 12: Background execution with isolation

## Common Patterns Across All Examples

Every compliant skill demonstrates these architectural patterns:

1. **Critical Rules** section at the top
2. **Agents** table with clear purposes and sources (builtin/shared)
3. **Todo List Requirements** (MANDATORY)
4. **Input Conditions** with checkbox format
5. **Pre-Step Validation** using "STOP if" language
6. **Post-Step Validation** with verification criteria
7. **Quality Gates** with retry logic (max 3) and escalation
8. **Anti-Patterns** section highlighting violations

## Key Differences: Non-Compliant vs Compliant

| Aspect | Non-Compliant | Compliant |
|--------|---------------|-----------|
| Architecture | Skill executes directly | Skill delegates to agents |
| Agents | None or external | Builtin or shared |
| Input Conditions | None or implicit | Explicit with STOP |
| Validation | Post-execution only | Pre AND post-step |
| Quality Gates | None | Every step with retry |
| Todo Lists | Optional | MANDATORY |
| Guardrails | Suggestions | BLOCKING language |
| Agent Sources | Single source | Builtin/shared as needed |

## Using These Examples

1. **Starting Out?** → Read [Example 1 (Simple)](examples-simple.md) first
2. **Need Multi-Phase?** → See [Example 2 (Medium)](examples-medium.md)
3. **Building Complex?** → Study [Example 3 (Complex)](examples-complex.md)
4. **Creating Agents?** → Review [Agent Creation Examples](examples-creating-agents.md)
5. **Working with Agents?** → Check [Examples 4-7 (Agent Sources)](examples-agents.md)
6. **CC 2.1 Features?** → Check [Examples 8-12 (CC 2.1)](examples-cc21-capabilities.md)

## Anti-Patterns to Avoid

### Architectural Violations (CRITICAL)
- Referencing other skills
- Using external agents without proper source tracking
- Executing tasks directly without agent delegation
- Skipping input condition checks
- Missing post-step validation
- No quality gates
- No todo list tracking
- Missing "Source" column in agent tables

### Workflow Issues
- Proceeding without validation
- No error handling
- Missing retry logic
- Unclear escalation paths
- Incomplete output contracts
