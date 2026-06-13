# Complete 3-Round Questionnaire Flow Example

A complete walkthrough of the progressive disclosure questionnaire process, from initial user input through all three rounds to final requirements profile.

---

## Context

**User input:** "I need a task management app for my small team"

**Input completeness:** Low (single sentence)

**Strategy:** Use full 3-round progressive disclosure to gather comprehensive requirements

---

## Round 1: Core Business

**Focus:** What, Why, Who (Foundation)

**Q1:** What is the primary business problem?
**Answer:** A. Task management and collaboration ✓

**Q2:** Who are the primary users?
**Answer:** A. Small teams (5-15 people) ✓

**Q3:** What is the primary business objective?
**Answer:** A. Improve team productivity ✓

**Q4:** What's your timeline for launch?
**Answer:** B. 3-6 months ✓

**Outcome:** Small team task app, 3-6 month timeline, productivity focus

---

## Round 2: Functional Requirements

**Focus:** How, Features, Workflows (Substance)

**Q1:** What are the core features?
**Answer:** A. Create, view, edit, delete tasks ✓

**Q2:** Task assignment approach?
**Answer:** A. Assign to single user ✓

**Q3:** Essential task properties?
**Answer:** A. Title, description, due date, status ✓

**Q4:** How should users view tasks?
**Answer:** A. List view with filters ✓

**Q5:** What notifications are needed?
**Answer:** A. Email notifications for task assignment ✓

**Q6:** Collaboration features needed?
**Answer:** B. Task comments ✓ (supports teamwork without complexity)

**Outcome:** CRUD tasks, single assignment, list view, email notifications, comments

---

## Round 3: Non-Functional & Constraints

**Focus:** Constraints, Quality Attributes, Integrations (Quality)

**Q1:** Performance expectations?
**Answer:** A. Standard web performance (2-3 sec) ✓

**Q2:** Security level required?
**Answer:** A. Standard authentication + role-based access ✓

**Q3:** Concurrent users to support?
**Answer:** A. 50-100 concurrent users ✓

**Q4:** Integrations needed?
**Answer:** A. Email notifications only ✓

**Q5:** Key constraints?
**Answer:** A. Budget and timeline constraints ✓

**Outcome:** Standard performance/security, 50-100 users, minimal integrations, budget-conscious

---

## Result

**Complete requirements profile for spec generation:**
- Domain: Task management
- Users: Small teams (5-15 people)
- Features: Task CRUD, single assignment, list view, comments
- Notifications: Email
- Performance: 2-3 sec page loads
- Security: Standard auth + RBAC
- Scale: 50-100 concurrent users
- Timeline: 3-6 months
- Constraints: Budget and timeline

**Ready for:** Research phase (find 2-3 similar apps) → Pattern analysis → Spec generation

---

## Key Observations

### Progressive Context Building

**Round 1 → Round 2:**
- Small team size (R1) informed collaboration features (R2)
- 3-6 month timeline (R1) led to simpler feature set recommendations (R2)
- Productivity objective (R1) prioritized essential features over nice-to-haves (R2)

**Round 2 → Round 3:**
- CRUD features (R2) determined appropriate scale (R3: 50-100 users)
- List view + filters (R2) influenced performance expectations (R3: 2-3 sec)
- Email notifications only (R2) aligned with minimal integrations (R3)

### Recommendation Consistency

All recommended options (marked ✓) align with:
- Small team context (5-15 people)
- 3-6 month timeline constraint
- Productivity-focused business objective
- Budget consciousness

**Example:**
- Single assignment vs. multiple assignment: Simpler implementation, faster delivery
- List view vs. board/calendar/all: Core functionality, less development time
- Standard auth vs. enterprise SSO: Sufficient for small teams, reduces complexity

### Stakeholder Guidance

**Every question included:**
- Clear rationale for recommended option
- Context for when other options make sense
- Connection to business objectives

**This approach:**
- Builds stakeholder confidence in recommendations
- Educates stakeholder on trade-offs
- Enables informed decision-making
- Reduces back-and-forth clarification

---

## Adaptations for Different Scenarios

### If User Chose Non-Recommended Options

**Scenario:** User selects "Full project management with Gantt charts" instead of "CRUD tasks"

**Adaptation:**
- Round 3 questions shift to address complexity:
  - Q1 Performance: "High performance (<1 sec)" becomes recommended
  - Q3 Scale: "100-500 concurrent users" becomes recommended
  - Q5 Constraints: Flag timeline/budget implications

### If Initial Context Was Rich

**Scenario:** User provided detailed description with technology stack, features list, target audience

**Adaptation:**
- Round 1: Reduce to 2-3 questions, focus on validation and gaps
- Round 2: Skip questions where features are already clear, focus on workflows
- Round 3: More time on constraints and quality attributes
- Total questions: ~8-10 instead of 15

### If Conflicts Emerge

**Scenario:** Round 2 answer (advanced features) conflicts with Round 1 (small team)

**Action:**
- Pause and clarify: "Advanced automation is typically for larger organizations. Can you describe your automation needs for 15 people?"
- Update recommendations based on clarification
- Document rationale in spec

---

## Cross-References

**For full questionnaire guidelines:**
- See `progressive-disclosure-guide.md` for question design best practices

**For question templates:**
- See `progressive-disclosure-guide.md` - Templates section

**For spec mapping:**
- See `templates/t3-lite-spec/` and `templates/t4-standard-spec/` for how these answers populate spec sections

**For real spec output:**
- See `examples/example-task-app-overview.md` (with `example-task-app-research.md` and `example-task-app-spec.md`) for a complete spec based on similar requirements

---

**Last Updated:** 2025-12-20
**Version:** 1.0
