# Spec Best Practices

Guide for creating high-quality Specifications.

---

## 1. Requirements Elicitation

### 1.1 Progressive Disclosure Approach

**Why:** Prevents overwhelming stakeholders with too many questions upfront.

**How:**
- **Round 1:** Focus on core business (what, why, who)
- **Round 2:** Dive into functionality (how, features, workflows)
- **Round 3:** Address constraints and quality attributes (performance, security, integrations)

**Example:**
```
Round 1: "What problem does this application solve?"
Round 2: "What are the core features users need?"
Round 3: "What performance requirements must be met?"
```

### 1.2 Asking Effective Questions

**Good questions are:**
- **Open-ended for exploration:** "How do users currently handle this task?"
- **Specific for validation:** "Should users be able to assign tasks to multiple people?"
- **Prioritizing:** "What's the most critical feature for launch?"

**Avoid:**
- Leading questions: "You want email notifications, right?"
- Compound questions: "Should we have search and filters and sorting?"
- Vague questions: "What do you want the system to do?"

### 1.3 Stakeholder Analysis

**Identify:**
- **Primary stakeholders:** Direct users who interact with system daily
- **Secondary stakeholders:** Indirect beneficiaries (managers, admins)
- **Tertiary stakeholders:** Compliance, legal, security teams

**Document for each:**
- Role and responsibilities
- Needs and pain points
- Success criteria
- Interaction frequency

---

## 2. Writing Requirements

### 2.1 Characteristics of Good Requirements

**SMART Framework:**
- **S**pecific: Clearly defined, no ambiguity
- **M**easurable: Can be tested and validated
- **A**chievable: Technically and practically feasible
- **R**elevant: Supports business objectives
- **T**estable: Has verifiable acceptance criteria

### 2.2 Requirements Language

**Use:**
- "The system **shall**..." for mandatory requirements
- "The system **should**..." for desired but not critical requirements
- Active voice and present tense
- Precise, quantified terms

**Avoid:**
- Vague words: "fast", "user-friendly", "flexible", "robust"
- Implementation details: "using a database", "with React"
- Compound requirements: Break into separate requirements

**Examples:**

❌ **Bad:** "The system should be fast and user-friendly."
✅ **Good:** "The system shall load the dashboard within 2 seconds for 95% of requests."

❌ **Bad:** "Users can create, edit, and delete tasks and assign them to team members."
✅ **Good (separate requirements):**
- FR-001: Users shall create tasks with title, description, and due date.
- FR-002: Users shall edit task properties after creation.
- FR-003: Users shall delete tasks they created.
- FR-004: Users shall assign tasks to one or more team members.

### 2.3 Acceptance Criteria

**Format:** Given-When-Then or checklist

**Given-When-Then:**
```
Given: User is logged in and viewing task list
When: User clicks "Create Task" and fills required fields
Then: New task appears in task list and assignee receives notification
```

**Checklist:**
```
- [ ] Task creation form accepts title, description, due date
- [ ] Required fields are validated before submission
- [ ] New task appears in list immediately after creation
- [ ] Assignee receives email notification within 5 minutes
```

**Best practices:**
- At least 2-3 criteria per requirement
- Cover positive scenarios and edge cases
- Make criteria testable and specific
- Include error handling expectations

---

## 3. Use Case Development

### 3.1 Use Case Structure

**Essential elements:**
1. **Actors:** Who initiates and participates
2. **Preconditions:** What must be true before use case starts
3. **Trigger:** What initiates the use case
4. **Main Flow:** The happy path (5-10 steps)
5. **Alternate Flows:** Variations on happy path
6. **Exception Flows:** Error scenarios
7. **Postconditions:** State after completion

### 3.2 Writing Main Flow

**Best practices:**
- Number steps sequentially
- Alternate actor and system steps
- Use active voice
- Keep steps at consistent level of detail
- Each step is one action or response

**Example:**
```
Main Flow:
1. User navigates to task creation page
2. System displays task creation form
3. User enters task title, description, due date
4. User selects assignee from dropdown
5. User clicks "Create Task"
6. System validates input
7. System creates task and stores in database
8. System sends notification to assignee
9. System displays confirmation message
10. Use case ends successfully
```

### 3.3 Alternate and Exception Flows

**Alternate flows:** Different but valid paths
```
A1: User assigns to multiple people
- Step 4a: User clicks "Add another assignee"
- System adds assignee field
- User selects additional assignee
- Return to step 5
```

**Exception flows:** Error conditions
```
E1: Required field missing
- Step 6e: If required field is empty
- System highlights missing field in red
- System displays error message "Title is required"
- Return to step 3
```

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements

**Format:** [Action] shall [complete/respond] within [time] for [load]

**Examples:**
- Page load: "Dashboard shall load within 2 seconds for 95% of requests"
- Transaction: "Payment processing shall complete within 5 seconds"
- Concurrent users: "System shall support 1,000 concurrent users without degradation"

### 4.2 Security Requirements

**Categories:**
- Authentication: "Users shall authenticate with email and password"
- Authorization: "Only task creators and assignees shall edit task details"
- Data protection: "Passwords shall be hashed using bcrypt with salt"
- Audit: "System shall log all user authentication attempts"

### 4.3 Scalability Requirements

**Examples:**
- Data volume: "System shall handle 100,000 tasks without performance degradation"
- User growth: "System shall scale to support 10,000 users within 12 months"
- Storage: "System shall accommodate 1TB of file attachments"

### 4.4 Usability Requirements

**Format:** [User type] shall [accomplish task] within [time/attempts]

**Examples:**
- "New users shall complete task creation within 2 minutes without training"
- "95% of users shall successfully assign tasks on first attempt"
- "System shall be accessible via WCAG 2.1 Level AA standards"

---

## 5. Research and Competitive Analysis

### 5.1 Selecting Applications to Research

**Criteria:**
- Direct competitors (same domain, similar features)
- Adjacent solutions (similar workflows, different domain)
- Market leaders (established best practices)

**How many:** 2-3 applications provides pattern validation

### 5.2 What to Extract

**From each application:**
- Core features and capabilities
- User workflows and interaction patterns
- Stakeholder types served
- Non-functional aspects (performance, security, scalability)
- Unique differentiators
- Common pain points (from reviews, forums)

### 5.3 Pattern Identification

**Pattern validation:** Feature/workflow appearing in 2+ applications

**Analysis:**
- What do ALL apps have? (Must-have features)
- What do MOST apps have? (Should-have features)
- What's unique to one app? (Differentiators or niche features)
- What's missing from all? (Opportunity for innovation)

**Example:**
```
Researched: Trello, Asana, Todoist

Common patterns (3/3):
- Task CRUD operations
- Task assignment to users
- Status tracking (to-do, in-progress, done)
- Due dates

Most apps (2/3):
- Task comments/notes
- File attachments
- Email notifications
- Mobile apps

Unique features (1/3):
- Trello: Board/card metaphor
- Asana: Timeline/Gantt view
- Todoist: Karma/gamification
```

---

## 6. Validation and Quality Assurance

### 6.1 Self-Review Checklist

Before submitting spec for review:
- [ ] All required sections present
- [ ] Every requirement has acceptance criteria
- [ ] All use cases have main flow, alternates, exceptions
- [ ] Requirements are testable (no vague language)
- [ ] Stakeholders identified and needs documented
- [ ] Non-functional requirements quantified
- [ ] Traceability maintained (requirements → objectives → use cases)
- [ ] Glossary defines domain terms
- [ ] No spelling or grammar errors

### 6.2 Peer Review Focus

**Request reviewers to check:**
- Clarity: Can someone unfamiliar with the project understand?
- Completeness: Any obvious gaps or missing scenarios?
- Consistency: Any contradictory requirements?
- Feasibility: Are requirements realistic given constraints?
- Priority: Are priorities aligned with business objectives?

### 6.3 Stakeholder Review

**Present spec to stakeholders:**
- Walk through use cases to validate workflows
- Review requirements against their stated needs
- Confirm priorities align with business value
- Get sign-off on acceptance criteria

---

## 7. Common Pitfalls and How to Avoid Them

### 7.1 Solution Thinking Instead of Problem Thinking

❌ **Pitfall:** "We need a React app with a PostgreSQL database"
✅ **Fix:** "We need a task management system that supports 100 concurrent users with real-time updates"

**Why:** Spec should define WHAT (business needs), not HOW (implementation)

### 7.2 Scope Creep

❌ **Pitfall:** Adding features during requirements gathering without assessing impact
✅ **Fix:** Document new ideas as "Future Enhancements" in appendix, prioritize against current scope

### 7.3 Ambiguous Requirements

❌ **Pitfall:** "System should be fast and handle lots of users"
✅ **Fix:** "System shall respond within 2 seconds for 95% of requests under load of 1,000 concurrent users"

### 7.4 Missing Error Scenarios

❌ **Pitfall:** Only documenting happy path use cases
✅ **Fix:** Always include exception flows for: validation errors, network failures, authorization errors, data not found

### 7.5 No Traceability

❌ **Pitfall:** Requirements exist in isolation, can't explain why they're needed
✅ **Fix:** Every requirement traces to business objective; create traceability matrix

---

## 8. Templates and Tools

### 8.1 Requirement Template

```
FR-[ID]: [Requirement Title]

Description: [Detailed description of what system must do]
Priority: High | Medium | Low
Stakeholder: [Who needs this]
Business Objective: BO-[ID]
Related Use Cases: UC-[ID], UC-[ID]

Acceptance Criteria:
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
- [ ] [Testable criterion 3]

Business Rules:
- BR-[ID]: [Business rule description]

Dependencies:
- FR-[ID]: [Dependency description]
```

### 8.2 Use Case Template

See `templates/use-case-template.md` for complete template.

### 8.3 Recommended Tools

- **Requirements management:** JIRA, Azure DevOps, Confluence
- **Use case modeling:** Lucidchart, Draw.io, PlantUML
- **Wireframing:** Figma, Balsamiq (for UI context)
- **Collaboration:** Miro, Mural (for workshops)

---

## 9. Continuous Improvement

### 9.1 Post-Implementation Review

After project completion:
- Review requirements vs actual implementation
- Identify requirements that changed (why?)
- Assess what was over-specified or under-specified
- Document lessons learned

### 9.2 Metrics to Track

- **Requirements stability:** % of requirements that didn't change
- **Defect traceability:** % of defects linked to unclear requirements
- **Stakeholder satisfaction:** Feedback on spec clarity and completeness
- **Time to sign-off:** How long to get stakeholder approval

### 9.3 Building Reusable Assets

- Maintain library of common use cases (login, CRUD, search)
- Document domain-specific patterns (e-commerce, healthcare, finance)
- Create checklists for different project types
- Build glossary of standard terms

---

## 10. Domain-Specific Considerations

### 10.1 E-commerce

**Key concerns:**
- Payment processing security (PCI DSS compliance)
- Inventory management and real-time stock
- Shopping cart persistence
- Order fulfillment workflows
- Customer account management

### 10.2 Healthcare

**Key concerns:**
- HIPAA compliance for data protection
- Patient consent management
- Audit trails for all data access
- Integration with EMR/EHR systems
- Role-based access (doctor, nurse, admin, patient)

### 10.3 Financial Services

**Key concerns:**
- Transaction integrity and rollback
- Regulatory compliance (SOX, GDPR)
- Fraud detection and prevention
- Multi-factor authentication
- Real-time transaction processing

### 10.4 SaaS Applications

**Key concerns:**
- Multi-tenancy and data isolation
- Subscription and billing management
- API rate limiting
- Scalability for growth
- Self-service onboarding

---

## Resources

### Books
- "Software Requirements" by Karl Wiegers
- "User Stories Applied" by Mike Cohn
- "Writing Effective Use Cases" by Alistair Cockburn

### Standards
- IEEE 830-1998: Recommended Practice for Software Requirements Specifications
- BABOK (Business Analysis Body of Knowledge) by IIBA

### Online Resources
- IIBA (International Institute of Business Analysis): iiba.org
- Modern Analyst: modernanalyst.com
- BA Times: batimes.com

---

## See also

- `progressive-disclosure-guide.md` - 3-round Q&A framework for requirements gathering

---

**Last Updated:** 2025-12-19
**Version:** 1.0
