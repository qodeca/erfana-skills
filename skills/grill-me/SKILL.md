---
name: grill-me
description: Use when the user wants to stress-test a plan or design through relentless one-at-a-time questioning until shared understanding is reached.
when_to_use: |
  Trigger phrases: "grill me", "stress-test this plan", "stress test my design", "interview me about this", "get grilled on my design", "ask me hard questions", "challenge my plan", "challenge my design", "poke holes in this", "walk the decision tree".
allowed-tools: Read, Glob, Grep, AskUserQuestion
---

# erfana:grill-me

Interview the user relentlessly about every aspect of the plan until shared understanding is reached. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one.

## Process

1. Ask the questions one at a time. Use `AskUserQuestion` so each decision is a structured choice the user can answer with one click rather than free-text.
2. For each question, provide a recommended answer alongside the options. The recommendation should be the first option labelled "(Recommended)".
3. If a question can be answered by exploring the codebase, explore the codebase instead. Use `Read`, `Glob`, `Grep` first; only ask the user when the codebase cannot answer.
4. Resolve dependencies between decisions in order. Do not ask question N+1 before question N is answered when N gates the branch.

## Terminal state

When every branch of the decision tree has been resolved, summarise the locked decisions back to the user as a numbered list. Hand off to the relevant output skill (`erfana:managing-issues`, `erfana:managing-specs`, an `erfana:design-*` skill, or no skill at all) once the plan is fully specified.
