# Spec Examples Index

Collection of example spec documents and workflows to illustrate best practices.

---

## Available Examples

### 1. Simple Blog Platform
**File:** `example-simple-blog.md`
**Domain:** Content publishing
**Complexity:** Simple
**Use Case:** Individual blogger with public readers
**Time:** ~1.5 hours

**What's included:**
- Minimal workflow for simple application
- Step 0: Auto-discovery of project context
- Scope selection + condensed 3-round requirements gathering
- Research from WordPress, Medium, Ghost
- Pattern-driven recommendations (search, SEO)
- Final spec: 15 requirements, 3 use cases
- Validation: 82/100 (PASS on first attempt)

**Key learning points:**
- Fast spec generation for simple applications
- Project analysis auto-discovers existing features
- Scope selection focuses documentation effort
- Maintaining scope discipline (avoiding feature creep)
- Public access model (no authentication for readers)
- Research validates "obvious" features (search is essential)

---

### 2. Task Management Application
**Files:**
- `example-task-app-overview.md` (Part 1: Overview & Requirements - 394 lines)
- `example-task-app-research.md` (Part 2: Research & Pattern Analysis - 201 lines)
- `example-task-app-spec.md` (Part 3: Spec Generation & Validation - 460 lines)

**Domain:** Team collaboration
**Complexity:** Medium
**Use Case:** Small team task tracking and assignment
**Time:** ~3 hours

**What's included:**
- Step 0: Auto-discovery of project context and documentable areas
- Scope selection (full app vs specific features)
- Complete 3-round requirements gathering flow
- Sample questionnaires with answers
- Research findings from 3 similar apps (Trello, Asana, Todoist)
- Pattern analysis
- Complete spec excerpt
- Validation results

**Key learning points:**
- Project analysis provides rich starting context
- Scope selection determines spec breadth
- How progressive disclosure works in practice
- Balancing feature scope with timeline constraints
- Research-informed requirements
- Quality validation process

**Note:** This example is split into three parts for readability:
1. Part 1 covers project analysis and requirements gathering (all 3 rounds)
2. Part 2 contains application research and pattern analysis
3. Part 3 shows spec generation and validation results

---

### 3. Fitness Tracking Web App
**Files:**
- `example-fitness-tracker.md` (main example - 330 lines)
- `example-fitness-tracker-spec.md` (detailed spec generation - 267 lines)

**Domain:** Health & Fitness
**Complexity:** Medium
**Use Case:** Users track workouts/meals, trainers coach clients
**Time:** ~4 hours

**What's included:**
- Step 0: Auto-discovery of project with integrations
- Scope selection with feature-level options
- Two-sided platform (users + trainers)
- Third-party integration (Strava API)
- Research from MyFitnessPal, Strava, Trainerize
- OAuth flow, rate limits, error handling
- 42 requirements, 8 use cases
- Validation: 86/100 (PASS)

**Key learning points:**
- Project analysis detects existing integrations
- Scope selection allows feature-specific spec
- API integration complexity (OAuth, rate limits)
- Trainer-client relationship modeling
- Sensitive health data privacy considerations
- Gap analysis identifies missing messaging feature

**Note:** This example is split into two files for readability:
1. Main file covers project analysis, requirements gathering, and research
2. Spec generation file contains detailed requirements, use cases, validation results

---

### 4. Complete Questionnaire Flow
**File:** `questionnaire-flow-example.md`
**Type:** Walkthrough
**Focus:** Progressive disclosure process
**Use Case:** Task management app with minimal initial context
**Time:** Example study ~15 minutes

**What's included:**
- Complete 3-round Q&A flow from start to finish
- Context building across rounds (how Round 1 informs Round 2, etc.)
- All questions with answers and recommended options
- Progressive context building demonstration
- Adaptations for different scenarios
- Cross-references to related spec examples

**Key learning points:**
- How progressive disclosure works in practice
- Context building across rounds
- Recommendation consistency
- Stakeholder guidance through rationale
- Handling edge cases (conflicts, non-recommended choices)

---

## Example Categories

### By Domain

**Content Publishing:**
- Simple Blog Platform (example-simple-blog.md)

**Team Collaboration:**
- Task Management Application (example-task-app-overview.md, example-task-app-research.md, example-task-app-spec.md)

**Health & Fitness:**
- Fitness Tracking Web App (example-fitness-tracker.md)

**Future examples to add:**
- CRM: Enterprise customer relationship management system
- E-commerce: Online marketplace with seller onboarding
- Healthcare: Patient appointment scheduling system
- Finance: Expense tracking and reporting application
- Education: Learning management system (LMS)
- SaaS: Multi-tenant project management platform

### By Complexity

**Simple (1-2 stakeholder types, <20 requirements):**
- Simple Blog Platform (example-simple-blog.md) - 15 FRs, 2 stakeholders, 1.5 hours

**Medium (2-4 stakeholder types, 20-50 requirements):**
- Task Management Application (example-task-app-*.md - 3 parts) - 25 FRs, 3 stakeholders, 3 hours
- Fitness Tracking Web App (example-fitness-tracker.md) - 42 FRs, 4 stakeholders, 4 hours

**Complex (5+ stakeholder types, 50+ requirements):**
- (No examples yet - future addition)

### By Input Type

**Text (single sentence):**
- Simple Blog Platform (example-simple-blog.md)

**Text (multi-sentence with details):**
- Task Management Application (example-task-app-*.md - 3 parts)
- Fitness Tracking Web App (example-fitness-tracker.md)

**File upload (document):**
- (No examples yet - future addition)

### By Special Features

**Third-party integrations:**
- Fitness Tracking Web App (Strava API, OAuth, rate limits)

**Two-sided platforms:**
- Fitness Tracking Web App (users + trainers)

**Validation retries:**
- (No examples yet - future addition)

**Data migration:**
- (No examples yet - future addition)

---

## How to Use These Examples

### For Learning

**If you're new to specs:**
1. Start with `example-simple-blog.md` for quick overview (1.5 hours)
2. Read `example-task-app-overview.md` → `example-task-app-research.md` → `example-task-app-spec.md` for complete workflow
3. Study `example-fitness-tracker.md` for integration complexity

**If you're validating your approach:**
1. Compare your questionnaires to examples (see Round 1-3 sections)
2. Check if your requirements are as specific and testable (see acceptance criteria)
3. Review use case structure for consistency (main flow, alternates, exceptions)
4. Compare validation scores (aim for 80%+ on first or second attempt)

**Learning path by experience level:**
- Beginner: example-simple-blog.md → example-task-app (3 parts)
- Intermediate: example-fitness-tracker.md (API integrations)

### For Templates

**Reusable elements from examples:**
- Questionnaire formats and question styles
- Requirements language and structure
- Use case templates with real data
- Non-functional requirement metrics
- Validation criteria

### For Clients/Stakeholders

**Show examples to:**
- Set expectations for what a spec looks like
- Demonstrate the value of thorough requirements gathering
- Illustrate different levels of detail
- Explain the Q&A process before starting

---

## Creating Your Own Examples

Want to contribute an example or create one for your domain?

### Minimum Requirements

1. **Complete requirements gathering:**
   - All 3 rounds documented
   - Actual questions and answers
   - Rationale for recommendations

2. **Research summary:**
   - At least 2 similar applications analyzed
   - Pattern identification
   - Recommendations with evidence

3. **Spec excerpt:**
   - At minimum: 1 section fully completed (e.g., Functional Requirements)
   - Shows proper structure and language

4. **Validation results:**
   - Quality score
   - Key findings
   - Any improvements made

### Template Structure

```markdown
# Spec Example: [Application Name]

## Overview
- Domain: [Domain/industry]
- Complexity: Simple | Medium | Complex
- Stakeholder types: [Count and types]
- Requirements count: [Functional + Non-functional]

## Initial Input
[User's original description]

## Round 1: Core Business
[Questions, answers, rationale]

## Round 2: Functional Requirements
[Questions, answers, rationale]

## Round 3: Non-Functional & Constraints
[Questions, answers, rationale]

## Research Phase
[Apps researched, findings, patterns]

## Pattern Analysis
[Gaps identified, recommendations]

## Spec Excerpt
[At least one complete section]

## Validation
[Quality score, findings, improvements]

## Lessons Learned
[Key takeaways from this example]
```

---

## Real-World Scenarios

### Scenario 1: Minimal Initial Context

**Challenge:** User provides very short description
**Example:** Shows how to extract domain and scope through Round 1
**See:** example-simple-blog.md (single sentence input), example-task-app-overview.md (1 paragraph)

### Scenario 2: Rich Initial Context

**Challenge:** User provides detailed document with requirements
**Example:** Shows how to parse document and identify gaps
**See:** (No examples yet - future addition)

### Scenario 3: Third-Party Integrations

**Challenge:** User needs API integration with external systems
**Example:** Shows OAuth flow, rate limits, error handling
**See:** example-fitness-tracker.md (Strava)

### Scenario 4: Validation Failure

**Challenge:** First spec validation scores below 80% threshold
**Example:** Shows regeneration workflow and quality improvements
**See:** (No examples yet - future addition)

### Scenario 5: Phased Implementation

**Challenge:** Scope too large for single release
**Example:** Shows how to recommend MVP + Phase 2/3
**See:** example-fitness-tracker.md (file attachments to Phase 2)

### Scenario 6: Data Migration Complexity

**Challenge:** User has fragmented existing data sources
**Example:** Shows migration planning and data quality strategy
**See:** (No examples yet - future addition)

---

## Anti-Pattern Examples

Learn what NOT to do:

### Bad Requirements
```
❌ 001-FR-001: The system should be user-friendly and fast
Problems:
- Not testable ("user-friendly", "fast" are vague)
- No acceptance criteria
- Multiple concerns in one requirement

✅ Better:
001-FR-001: New users shall complete task creation within 2 minutes
001-FR-002: Task list shall load within 2 seconds for lists with up to 1,000 tasks
```

### Bad Use Cases
```
❌ Main Flow:
1. User logs in
2. User creates task
3. System saves task

Problems:
- Too high-level, skips critical steps
- No validation or error handling
- No alternate or exception flows

✅ Better: See example-task-app-spec.md, Use Case 001-UC-001
```

### Bad Questions
```
❌ Q: What features do you want?
Problems:
- Too open-ended, overwhelming
- No guidance or recommendations
- Encourages feature dump

✅ Better:
Q: What are the core features needed for task management?
Options:
  A. Create, view, edit, delete tasks ✓ (Essential CRUD)
  B. Task creation only
  C. Full project management with dependencies
  D. Advanced automation
```

---

## FAQ

**Q: How long should a spec be?**
A: Varies by complexity. See examples:
- Simple: 10-15 pages / ~2,800 words (example: simple-blog)
- Medium: 20-30 pages / ~4,200-8,500 words (examples: task-app, fitness-tracker)

**Q: How many use cases should I include?**
A: Minimum 3 for primary workflows. See examples for coverage:
- Simple blog: 3 use cases (create post, comment, search)
- Task app: 5 use cases (create, assign, update, complete, search)
- Fitness tracker: 8 use cases (log workout, Strava import, trainer view client, messaging)

**Q: How detailed should acceptance criteria be?**
A: Specific enough to test. See example-task-app-spec.md for good examples.

**Q: Should I include UI mockups in spec?**
A: No, spec focuses on requirements, not design. Reference wireframes if needed, but don't embed.

**Q: How do I handle "nice to have" features?**
A: Document in Appendix as "Future Enhancements" with priority. See examples.

---

## Contributing

Have a spec example you'd like to share?

1. Follow the template structure above
2. Ensure all sensitive information is removed/anonymized
3. Validate it passes quality checklist (≥80%)
4. Submit for review

Contact: [Your contribution process here]

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-19 | Initial examples index created with task-app example |
| 1.1 | 2025-12-20 | Added 2 new examples (simple-blog, fitness-tracker), reorganized categories |

---

## Quick Start Guide

**New to specs?** Follow this path:
1. Read `example-simple-blog.md` (15 min) - understand basic workflow
2. Study `example-task-app-overview.md` (15 min) - see complete 3-round Q&A
3. Study `example-task-app-research.md` (8 min) - see research and pattern analysis
4. Study `example-task-app-spec.md` (20 min) - see spec generation and validation
5. Review `example-fitness-tracker.md` (20 min) - learn integration patterns

**Need specific guidance?**
- Input formats → See "By Input Type" category
- Integrations → See example-fitness-tracker.md

**Total reading time:** ~78 minutes for all examples

---

**Next:** Choose an example based on your project complexity and start reading.
