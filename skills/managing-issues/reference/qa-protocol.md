# Q&A protocol – managing-issues

Requirements gathering protocol for each operation. Defines when questions are mandatory, what to ask, and when to skip.

---

## General rules

1. Agents CANNOT ask questions directly – they return `needs_user_input` response
2. Orchestrator uses AskUserQuestion with the returned question
3. Batch 1-4 questions per round to balance efficiency and usability
4. Max 3 rounds of clarification before proceeding with best available info
5. NEVER repeat already-answered questions
6. Each question with options SHOULD have one marked as recommended
7. Accept non-recommended choices without judgment

---

## Create operation

**Q&A is MANDATORY** for all create operations.

| Phase | Questions | Skip condition |
|-------|-----------|----------------|
| Phase 1: Understand | 1-2 | User provided full description with type, scope, and expected behavior |
| Phase 2: Clarify | 2-4 (bugs), 2-3 (enhancements) | All essential details already provided |

### Bug questions (minimum 3 unless all answered upfront)
1. Which areas/features are affected?
2. Expected vs actual behavior?
3. Steps to reproduce?
4. Environment details? (optional if not relevant)

### Enhancement questions (minimum 2 unless all answered upfront)
1. What problem does this solve?
2. What are the acceptance criteria?
3. Any reference implementations? (optional)

---

## Implement operation

**Q&A is MANDATORY at Phase 2** (Business Analysis). Depth depends on tier.

| Tier | Questions | Focus |
|------|-----------|-------|
| Tier 1 (trivial) | 1-2 confirming | "Is this the file you mean?", "Confirm the fix?" |
| Tier 2 (standard) | 3-5 clarifying | Scope boundaries, edge cases, definition of done |

### Tier 2 required question categories
1. **Scope boundaries** – what is in/out of scope
2. **Edge cases** – known edge cases or constraints
3. **Definition of done** – how to verify the implementation is complete
4. **Reference implementations** – any existing patterns to follow (optional)

### User approval checkpoints (not Q&A but mandatory interaction)
- QG-4: Architecture plan approval
- QG-11: UAT approval
- QG-12: Finalization approval

---

## Review operation

**2 mandatory questions** – no skip conditions.

| Phase | Question | Type |
|-------|----------|------|
| Phase 0: Scope | "What would you like reviewed?" (file, component, module, feature, PR, codebase) | Selection |
| Phase 2: Level | "What review depth?" (quick, standard, deep) – recommend: standard | Selection |

---

## Skip conditions (applies to all operations)

Q&A MAY be skipped ONLY when ALL of these are true:
1. User's request is specific (names exact files, components, or issue numbers)
2. User's request is complete (includes all required information)
3. User's request is unambiguous (only one valid interpretation)

Example skip: "Fix typo in README.md line 42: 'teh' → 'the'" – no questions needed.
Example NO skip: "Fix the bug" – must ask what bug, where, what behavior.
