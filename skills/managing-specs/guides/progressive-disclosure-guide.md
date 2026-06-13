# Progressive Disclosure Guide

How to conduct multi-round requirements gathering with progressive disclosure for spec creation.

---

## What is Progressive Disclosure?

**Definition:** A requirements elicitation technique that presents information and questions gradually, moving from high-level to detailed, to avoid overwhelming stakeholders.

**Why use it:**
- Reduces cognitive load on stakeholders
- Allows stakeholders to build understanding progressively
- Enables more thoughtful, contextual answers
- Prevents premature focus on details before big picture is clear

**When to use it:**
- Stakeholder is not a domain expert
- Project scope is initially unclear
- Requirements are complex or numerous
- Risk of overwhelming stakeholder with too many questions

---

## The 3-Round Framework

### Round 1: Core Business (Foundation)

**Focus:** What, Why, Who
**Questions:** 4-6 questions
**Time:** 10-15 minutes

**Topics:**
- Business problem and objectives
- Target users and stakeholders
- Domain/industry context
- High-level scope boundaries

**Example Questions:**
```
Q1: What is the primary business problem this application will solve?
Options:
  A. Task management and collaboration ✓ (Most common for team apps)
  B. Data analysis and reporting
  C. Customer relationship management
  D. Content publishing and distribution
Rationale: Understanding the core problem shapes all subsequent requirements.

Q2: Who are the primary users of this application?
Options:
  A. Small teams (5-15 people) ✓ (Optimal for task management MVP)
  B. Large organizations (100+ people)
  C. Individual users
  D. External customers/public
Rationale: User scale affects features, architecture, and complexity.

Q3: What is the primary business objective?
Options:
  A. Improve team productivity ✓ (Aligns with task management)
  B. Reduce operational costs
  C. Increase customer satisfaction
  D. Generate revenue
Rationale: Business objective drives prioritization of features.
```

**Outcome:** Establish business context, objectives, and stakeholders.

---

### Round 2: Functional Requirements (Substance)

**Focus:** How, Features, Workflows
**Questions:** 5-6 questions
**Time:** 15-20 minutes

**Topics:**
- Core features and capabilities
- User workflows and processes
- Data and content to manage
- Integration points

**Example Questions:**
```
Q1: What are the core features needed for task management?
Options:
  A. Create, view, edit, delete tasks ✓ (Essential CRUD operations)
  B. Task creation only (minimal MVP)
  C. Full project management with dependencies and Gantt charts
  D. Advanced automation and AI-powered suggestions
Rationale: Defines feature scope - option A provides solid foundation without over-engineering.

Q2: How should task assignment work?
Options:
  A. Assign to single user ✓ (Simplest, covers 80% of use cases)
  B. Assign to multiple users
  C. Assign to teams/groups
  D. No assignment (self-service task claiming)
Rationale: Single assignment reduces complexity while meeting most needs.

Q3: What task properties are essential?
Options:
  A. Title, description, due date, status ✓ (Standard task attributes)
  B. Title and status only (minimal)
  C. Include priority, tags, custom fields
  D. Full metadata with attachments and comments
Rationale: Option A balances usability with implementation simplicity.

Q4: How should users view tasks?
Options:
  A. List view with filters ✓ (Simple, flexible)
  B. Board view (Kanban-style)
  C. Calendar view
  D. All three views
Rationale: List view is intuitive and covers primary use case.

Q5: What notifications are needed?
Options:
  A. Email notifications for task assignment ✓ (Most important)
  B. No notifications
  C. Email + in-app notifications
  D. Email + in-app + SMS + push notifications
Rationale: Email notifications provide essential awareness without system complexity.
```

**Outcome:** Define feature set, workflows, and functional scope.

---

### Round 3: Non-Functional & Constraints (Quality)

**Focus:** Constraints, Quality Attributes, Integrations
**Questions:** 4-5 questions
**Time:** 10-15 minutes

**Topics:**
- Performance and scalability requirements
- Security and compliance
- Technical constraints
- Integration needs
- Quality attributes

**Example Questions:**
```
Q1: What are the performance expectations?
Options:
  A. Standard web performance (2-3 sec page loads) ✓ (Realistic for most apps)
  B. High performance (<1 sec everywhere)
  C. No specific requirements
  D. Offline-first with instant response
Rationale: Option A provides good UX without premature optimization.

Q2: What security level is required?
Options:
  A. Standard authentication + role-based access ✓ (Sufficient for internal tools)
  B. Basic authentication only
  C. Enterprise-grade with SSO, MFA, audit logs
  D. Public access (no authentication)
Rationale: Balances security with development effort.

Q3: How many concurrent users should the system support?
Options:
  A. 50-100 concurrent users ✓ (Typical for small-medium teams)
  B. 10-50 concurrent users
  C. 100-500 concurrent users
  D. 500+ concurrent users
Rationale: Informs infrastructure and scalability decisions.

Q4: What integrations are needed?
Options:
  A. Email notifications only ✓ (Minimal external dependency)
  B. Calendar integration (Google Calendar, Outlook)
  C. Slack/Teams integration
  D. Full API for custom integrations
Rationale: Email is essential; other integrations can be phased.

Q5: What are the key constraints?
Options:
  A. Budget and timeline constraints ✓ (Most common)
  B. Technology stack constraints
  C. Regulatory/compliance constraints
  D. No significant constraints
Rationale: Understanding constraints shapes realistic scope.
```

**Outcome:** Define quality attributes, constraints, and integration requirements.

---

## Best Practices

### 1. Always Recommend an Option

**Why:** Stakeholders often lack technical context to make informed decisions.

**How:**
- Mark recommended option with ✓ or "Recommended"
- Provide clear rationale explaining why it's recommended
- Base recommendations on:
  - Industry best practices
  - Research findings (similar apps)
  - Balance of features vs. complexity
  - Business objectives alignment

**Example:**
```
Q: What task properties are essential?
Options:
  A. Title, description, due date, status ✓ RECOMMENDED
     Rationale: Research shows these 4 fields appear in 95% of task apps
     and cover fundamental task management needs without overwhelming users.

  B. Title and status only
     Rationale: Too minimal - users typically need context (description)
     and deadlines (due date) for effective task management.

  C. Include priority, tags, custom fields
     Rationale: Adds complexity; better as Phase 2 enhancement after
     validating core usage patterns.
```

### 2. Make All Questions Required

**Why:** Skipped questions create gaps in spec that require assumption or later clarification.

**How:**
- Don't provide "Skip" or "N/A" options
- If truly optional, provide "None" as an explicit choice
- Force explicit decision on every question

**Exception:** If a question is conditional (e.g., "If you selected integrations, which systems?"), clearly mark as conditional.

### 3. Limit Questions Per Round

**Guideline:** 3-6 questions per round

**Why:**
- 3 minimum: Provides meaningful progress per round
- 6 maximum: Prevents fatigue and maintains quality of responses

**Adjust based on:**
- Question complexity (complex questions → fewer per round)
- Stakeholder availability (limited time → minimum questions)
- Context completeness (high initial context → fewer rounds/questions needed)

### 4. Connect to Spec Sections

**Always show stakeholders:**
- Which spec section each question informs
- Why the question matters for documentation quality

**Example:**
```
Q: What are the primary business objectives?
Maps to: Spec Section 2 - Business Objectives
Why it matters: Ensures all requirements trace back to business value,
preventing scope creep and feature bloat.
```

### 5. Adapt Based on Previous Answers

**Round 2 questions should reference Round 1 answers:**
```
Round 1 answer: "Primary users are small teams (5-15 people)"

Round 2 question informed by this:
Q: Given your team size, what collaboration features are needed?
Options:
  A. Task assignment and status updates ✓ (Right for small teams)
  B. Advanced workflow automation (overkill for 15 people)
  C. Individual task lists only (missing collaboration)
```

**Round 3 questions should reference Round 1-2 answers:**
```
Round 2 answer: "Core features: Create, view, edit, delete tasks"

Round 3 question:
Q: Given CRUD operations on tasks, what's the expected data volume?
Options:
  A. 1,000-10,000 tasks ✓ (Typical for team of 15 over 1 year)
  B. <1,000 tasks
  C. 10,000-100,000 tasks
```

---

## Question Types and Formats

### 1. Single Choice (Most Common)

**Use for:** Mutually exclusive options

```
Q: What authentication method?
Options:
  A. Email/password ✓
  B. SSO (Single Sign-On)
  C. OAuth (Google, GitHub)
  D. Multi-factor authentication
```

### 2. Priority Ranking

**Use for:** Features that can coexist but need prioritization

```
Q: Rank these features by importance (1 = most important):
  ___ Task assignment
  ___ Due dates
  ___ Task comments
  ___ File attachments

Recommendation: 1. Task assignment, 2. Due dates (core workflow),
3. Comments (collaboration), 4. Attachments (nice-to-have)
```

### 3. Scale Questions

**Use for:** Quantifiable requirements

```
Q: How many concurrent users?
Options:
  A. 1-50
  B. 50-100 ✓ (Matches team growth projections)
  C. 100-500
  D. 500+
```

### 4. Yes/No with Elaboration

**Use for:** Binary decisions that may need follow-up

```
Q: Do you need mobile access?
Options:
  A. Yes, mobile app required
  B. Yes, mobile-responsive web ✓ (Faster to market, lower cost)
  C. No, desktop web only

If Yes: Follow-up in Round 3 with mobile-specific requirements
```

---

## Handling Edge Cases

### 1. Stakeholder Chooses Non-Recommended Option
**Response:** Accept and adapt. Note the choice, adjust Round 3 questions to address complexity implications, flag potential timeline/budget impact in spec, and proceed with stakeholder's decision.

### 2. Conflicting Answers Across Rounds
**Response:** Clarify and reconcile. Example: If Round 1 says "Small teams (5-15 people)" but Round 2 requests "Advanced workflow automation" (typically for large orgs), ask clarification to understand the specific automation needs for their team size, then adapt recommendations.

### 3. Round 3 Still Has Gaps
**Response:** Note gaps, don't extend beyond 3 rounds. Document gap in spec (e.g., "Integration requirements need technical review"), proceed with available data, and flag for stakeholder review during validation.

### 4. Stakeholder Wants to Change Round 1 Answer
**Response:** Allow change but note implications. Update Round 1 answer, ask if Round 2 decisions should be revisited given the change, and document change in spec revision history.

---

## Integration with Spec Workflow

### Before Round 1

**Input Parser provides:**
- Initial context from user's description
- Completeness score
- Missing elements

**Use this to:**
- Tailor Round 1 questions to fill specific gaps
- Skip questions where context is already clear
- Adjust question count based on completeness (high completeness = fewer questions)

### Between Rounds

**Consolidate answers:**
- Update requirements data structure
- Identify dependencies or conflicts
- Prepare context for next round

### After Round 3

**Requirements Gatherer outputs:**
- Consolidated requirements data
- Stakeholder profiles
- Business objectives
- Feature scope
- Constraints and assumptions

**This feeds:**
- Research phase (for competitive analysis)
- Pattern analysis (for validation against industry norms)
- Spec generation (for template population)

---

## Complete Example

For a detailed walkthrough of a complete 3-round questionnaire flow (from initial user input through all three rounds to final requirements profile), see:

**`examples/questionnaire-flow-example.md`**

The example demonstrates:
- Context building across rounds
- How Round 1 answers inform Round 2 questions
- How Round 2 answers inform Round 3 questions
- Recommendation consistency throughout all rounds
- Adaptations for different scenarios (non-recommended options, rich context, conflicts)

---

## Templates

### Questionnaire Header Template

```markdown
# Requirements Gathering - Round {N} of 3

## Progress
- Round 1: Core Business ✓ (if completed)
- Round 2: Functional Requirements ← (if current)
- Round 3: Non-Functional & Constraints

## Context So Far
{Summary of previous rounds' answers}

## This Round's Focus
{What this round will establish}

## Questions
{Questions below}
```

### Question Template

```markdown
### Q{N}: {Question text}

**Maps to Spec Section:** {Section name}
**Why this matters:** {Rationale for asking}

**Options:**
- A. {Option 1} ✓ RECOMMENDED
  - Rationale: {Why this is recommended}
- B. {Option 2}
  - Rationale: {When to choose this}
- C. {Option 3}
  - Rationale: {When to choose this}
- D. {Option 4}
  - Rationale: {When to choose this}

**Your choice:** ___
```

---

## Resources

- See `spec-best-practices.md` for requirements writing guidelines
- See `templates/t3-lite-spec/` and `templates/t4-standard-spec/` for section structure, and `guides/tier-guide.md` for the section-to-tier mapping
- See `examples/spec-examples.md` for complete Q&A flows
- See `examples/questionnaire-flow-example.md` for complete 3-round flow walkthrough

---

## See also

- `operational-guide.md` - Error handling and quality gates
- `spec-best-practices.md` - Requirements writing guidelines

---

**Last Updated:** 2025-12-20
**Version:** 1.1
