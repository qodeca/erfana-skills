# Spec Example: Task Management Application
## Part 1 of 3: Overview & Requirements Gathering

> **Navigation:** [Part 1: Overview & Requirements] | [Part 2: Research →](example-task-app-research.md) | [Part 3: Spec & Validation →](example-task-app-spec.md)

Complete worked example showing the full spec generation process from initial input to validated document.

---

## Overview

**Application Name:** TeamTask
**Domain:** Team collaboration / Task management
**Complexity:** Medium
**Stakeholder Types:** 3 (Team Member, Team Lead, Administrator)
**Functional Requirements:** 25
**Use Cases:** 5
**Final Spec Score:** 87/100 (PASS)

---

## Step 0: Project Analysis (MANDATORY)

**User invokes skill from within a TeamTask project directory.**

### Agent: spec-project-analyzer

**Files Analyzed:**
```
Scanning project: /home/user/projects/TeamTask/
├── package.json          [FOUND] → Dependencies analyzed
├── README.md             [FOUND] → Description extracted
├── .env.example          [FOUND] → Configuration variables
├── docker-compose.yml    [FOUND] → Infrastructure setup
├── server/
│   ├── package.json      [FOUND] → Backend dependencies
│   ├── src/
│   │   ├── routes/       [8 files] → REST endpoints discovered
│   │   ├── models/       [5 files] → Database schema analyzed
│   │   ├── controllers/  [8 files] → Business logic examined
│   │   ├── middleware/   [4 files] → Auth/validation detected
│   │   └── services/     [6 files] → Service layer identified
│   └── tests/            [12 files] → Test coverage detected
├── client/
│   ├── package.json      [FOUND] → Frontend dependencies
│   ├── src/
│   │   ├── components/   [24 files] → UI components scanned
│   │   ├── pages/        [7 files] → Route structure analyzed
│   │   ├── hooks/        [5 files] → Custom hooks detected
│   │   └── api/          [3 files] → API client examined
│   └── tests/            [18 files] → UI tests found
└── docs/
    ├── API.md            [FOUND] → API documentation exists
    └── DEPLOYMENT.md     [FOUND] → Deployment guide exists

Total: 87 files analyzed, 5 directories
```

**Tech Stack Detected:**
| Layer | Technology | Confidence | Source |
|-------|------------|------------|--------|
| Backend Runtime | Node.js 20.x | 100% | server/package.json: "node": ">=20.0.0" |
| Web Framework | Express 4.x | 100% | server/package.json: "express": "^4.19.2" |
| Database | PostgreSQL 16 | 100% | docker-compose.yml: "postgres:16-alpine" |
| ORM | Prisma | 95% | server/package.json: "@prisma/client": "^5.8.0" |
| Frontend | React 18.x | 100% | client/package.json: "react": "^18.2.0" |
| State Management | React Query | 90% | client/package.json: "@tanstack/react-query" |
| UI Framework | Tailwind CSS | 100% | client/tailwind.config.js present |
| Build Tool | Vite | 100% | client/vite.config.ts present |
| Testing | Vitest + RTL | 95% | Both package.json files have vitest |

**Features Discovered (from code analysis):**

**Task Management** (server/src/routes/tasks.js):
- `POST /api/tasks` → Create task
- `GET /api/tasks` → List tasks (with filters)
- `GET /api/tasks/:id` → View task details
- `PUT /api/tasks/:id` → Update task
- `PATCH /api/tasks/:id/status` → Update status only
- `DELETE /api/tasks/:id` → Delete task
- `GET /api/tasks/assigned/:userId` → Tasks by assignee

**User Assignment** (server/src/services/assignment.js):
- Assign task to user
- Reassign task
- Unassign task
- Assignment history tracking

**Status Tracking** (server/src/models/Task.js):
- Status enum: TODO, IN_PROGRESS, IN_REVIEW, DONE
- Status transitions with validation
- Status change timestamps

**Team Management** (server/src/routes/teams.js):
- `POST /api/teams` → Create team
- `GET /api/teams` → List teams
- `PUT /api/teams/:id` → Update team
- `POST /api/teams/:id/members` → Add member
- `DELETE /api/teams/:id/members/:userId` → Remove member

**Authentication** (server/src/middleware/auth.js):
- JWT-based authentication
- Role-based access control (admin, team_lead, team_member)
- Protected routes with role checks

**Data Models** (server/src/models/):
- **Task**: { title, description, dueDate, status, assigneeId, teamId, priority, createdBy }
- **User**: { email, password, role, firstName, lastName, teamId }
- **Team**: { name, description, leadId, members[] }
- **Comment**: { taskId, userId, content, createdAt }
- **ActivityLog**: { taskId, userId, action, timestamp }

**User Types Identified:**
- **Team Member** (team_member role): View/create tasks, add comments
- **Team Lead** (team_lead role): All team member actions + assign tasks, manage team
- **Administrator** (admin role): Full access to all teams and tasks

**Architecture Analysis:**
- **Pattern**: REST API with SPA frontend
- **Separation**: Clean separation between routes → controllers → services → models
- **Testing**: 30 test files, ~65% coverage (server/tests/, client/tests/)
- **Docker**: Containerized PostgreSQL + Redis for caching
- **Caching**: Redis integration detected (server/src/services/cache.js)

**Completeness Score Calculation:**

| Category | Score | Reasoning |
|----------|-------|-----------|
| README present | 10/10 | Comprehensive with setup instructions |
| Package.json complete | 15/15 | Well-defined scripts and dependencies |
| Source code structure | 25/25 | Excellent organization with service layer |
| API documentation | 8/10 | Good API.md, missing some endpoints |
| Data models documented | 12/15 | Prisma schema exists, no business rules docs |
| Environment config | 10/10 | .env.example with comments |
| Tests | 10/15 | Good coverage (65%), missing E2E tests |
| Deployment docs | 5/5 | DEPLOYMENT.md present |
| **Total** | **70/100** | **GOOD** |

**Gaps Identified:**
- ❌ **Business objectives**: Not documented (WHY was this built?)
- ❌ **Performance requirements**: No SLA or response time targets
- ❌ **Security requirements**: Auth implemented, not documented
- ⚠️ **Integration needs**: Redis present, no integration strategy doc
- ⚠️ **Timeline/budget constraints**: No project planning docs
- ⚠️ **Non-functional requirements**: Performance, scalability undefined

**Discovered Context (JSON):**
```json
{
  "application_name": "TeamTask",
  "description": "Task management app for small teams",
  "tech_stack": ["React", "Node.js", "PostgreSQL", "Prisma", "Redis"],
  "existing_features": ["task CRUD", "user assignment", "status tracking", "team management", "activity logs", "caching"],
  "user_types": ["team_member", "team_lead", "admin"],
  "domain": "Team collaboration",
  "architecture_notes": "REST API backend, SPA frontend, service layer pattern, Redis caching",
  "test_coverage": "65% (30 test files)",
  "documentable_areas": [
    {"id": "full_app", "name": "Full application", "type": "full_app"},
    {"id": "tasks", "name": "Task management", "type": "feature"},
    {"id": "teams", "name": "Team management", "type": "feature"},
    {"id": "assignments", "name": "Task assignments", "type": "feature"},
    {"id": "auth", "name": "Authentication", "type": "module"}
  ]
}
```

**Agent Recommendation:**
> Completeness score of 70/100 indicates good technical implementation but missing business context. Recommend full application spec to document objectives, non-functional requirements, and integration strategy before scaling.

---

## Step 1.2: Requirements Gathering

### Scope Selection (First Question)
**"What would you like to document?"**
- ✓ **Full application** (recommended)
- Task management feature
- Team management feature
- Task assignments feature
- Authentication module

**User selected:** Full application

### Round 1: Core Business

**Round 1 Questionnaire:**

#### Q1: What is the primary business problem this application will solve?

**Maps to:** Spec Section 2 – Business Objectives
**Why this matters:** Understanding the core problem shapes all subsequent requirements.

**Options:**
- A. Task management and collaboration ✓ RECOMMENDED – Your description mentions tracking tasks and assignments.
- B. Data analysis and reporting – Choose if primary need is analyzing team performance data.
- C. Customer relationship management – Choose if tracking customer interactions is the focus.
- D. Content publishing and distribution – Choose if creating and sharing content is primary use.

**User's answer:** A

#### Q2: Who are the primary users of this application?

**Maps to:** Spec Section 3 – Stakeholders
**Why this matters:** User scale affects features, architecture, and complexity.

**Options:**
- A. Small teams (5-15 people) ✓ RECOMMENDED – You mentioned 12 people, which fits this range perfectly.
- B. Large organizations (100+ people) – Choose if you need department hierarchies, complex permissions.
- C. Individual users – Choose if primarily for personal productivity, not team collaboration.
- D. External customers/public – Choose if application is customer-facing, not internal tool.

**User's answer:** A

#### Q3: What is the primary business objective?

**Maps to:** Spec Section 2 – Business Objectives
**Why this matters:** Business objective drives prioritization of features.

**Options:**
- A. Improve team productivity ✓ RECOMMENDED – Preventing lost tasks and clarifying assignments directly improves productivity.
- B. Reduce operational costs – Choose if cost reduction is primary driver.
- C. Increase customer satisfaction – Choose if this is customer-facing and satisfaction is key metric.
- D. Generate revenue – Choose if this is a product to sell, not internal tool.

**User's answer:** A

#### Q4: What's your timeline for launching this application?

**Maps to:** Spec Section 8 – Constraints and Assumptions
**Why this matters:** Timeline affects scope decisions and phasing.

**Options:**
- A. 1-3 months (aggressive) – Choose if urgent need, but expect minimal feature set.
- B. 3-6 months ✓ RECOMMENDED – Allows solid MVP with core features and proper testing.
- C. 6-12 months – Choose if want comprehensive feature set and integrations.
- D. 12+ months – Choose for complex enterprise application with custom requirements.

**User's answer:** B (3-6 months)

**Round 1 Outcome:**
- Problem: Task management and collaboration
- Users: Small teams (12 people)
- Objective: Improve team productivity
- Timeline: 3-6 months

---

### Round 2: Functional Requirements

**Round 2 Questionnaire:**

#### Q1: What are the core task management features needed?

**Maps to:** Spec Section 4 – Functional Requirements
**Why this matters:** Defines the feature scope and complexity level.

**Options:**
- A. Create, view, edit, delete tasks ✓ RECOMMENDED – Essential CRUD operations cover 80% of needs. Foundation in Trello, Asana, and Todoist.
- B. Task creation only (minimal MVP) – Too limited; users need to edit mistakes and remove completed tasks.
- C. Full project management with dependencies and Gantt charts – Over-engineered for 12-person team and 3-6 month timeline.
- D. Advanced automation and AI-powered suggestions – Adds significant complexity without proven ROI for small teams.

**User's answer:** A

#### Q2: How should task assignment work?

**Maps to:** Spec Section 4 – Functional Requirements
**Why this matters:** Assignment model affects database design and UI complexity.

**Options:**
- A. Assign to single user ✓ RECOMMENDED – Simplest model, covers 80% of use cases. Clear accountability.
- B. Assign to multiple users – Choose if tasks regularly need multiple owners, but adds UI complexity.
- C. Assign to teams/groups – Overkill for 12 people; everyone can see all tasks anyway.
- D. No assignment (self-service task claiming) – Works for some teams, but you mentioned assigning is important.

**User's answer:** A

#### Q3: What task properties are essential?

**Maps to:** Spec Section 4 – Functional Requirements
**Why this matters:** Determines data model and form complexity.

**Options:**
- A. Title, description, due date, status ✓ RECOMMENDED – Industry standard; these 4 fields appear in 95% of task apps.
- B. Title and status only – Too minimal; users need context (description) and deadlines (due date).
- C. Include priority, tags, custom fields – Useful but adds complexity. Consider Phase 2.
- D. Full metadata with attachments and comments – Comprehensive but may overwhelm users and delay timeline.

**User's answer:** A

#### Q4: How should users view tasks?

**Maps to:** Spec Section 4 – Functional Requirements, Section 5.4 – Usability
**Why this matters:** View affects UI framework choice and user experience.

**Options:**
- A. List view with filters ✓ RECOMMENDED – Simple, intuitive, flexible. Allows sorting and filtering.
- B. Board view (Kanban-style) – Popular but adds UI complexity. Consider Phase 2.
- C. Calendar view – Good for due date visualization, but secondary to list view.
- D. All three views – Ideal but exceeds 3-6 month timeline. Start with list, add others later.

**User's answer:** A

#### Q5: What notifications are needed?

**Maps to:** Spec Section 4 – Functional Requirements, Section 5.5 – Integrations
**Why this matters:** Notifications affect user engagement and technical integrations.

**Options:**
- A. Email notifications for task assignment ✓ RECOMMENDED – Most important notification; requires email integration only.
- B. No notifications – Users would need to check app constantly. Reduces value proposition.
- C. Email + in-app notifications – Better UX but requires real-time infrastructure. Consider Phase 2.
- D. Email + in-app + SMS + push notifications – Adds significant technical complexity and cost.

**User's answer:** A

#### Q6: What collaboration features are needed?

**Maps to:** Spec Section 4 – Functional Requirements
**Why this matters:** Determines if this is individual task tracking or true collaboration.

**Options:**
- A. None – just task assignment – Minimal collaboration, may miss team communication opportunities.
- B. Task comments ✓ RECOMMENDED – Enables context sharing without leaving app. Appears in all researched apps.
- C. Task comments + file attachments – Useful but file storage adds complexity and cost. Consider Phase 2.
- D. Real-time chat integrated with tasks – Over-engineered; users likely have Slack/Teams for chat already.

**User's answer:** B

**Round 2 Outcome:**
- Features: Task CRUD operations
- Assignment: Single user per task
- Properties: Title, description, due date, status
- View: List with filters
- Notifications: Email for assignments
- Collaboration: Task comments

---

### Round 3: Non-Functional Requirements & Constraints

**Round 3 Questionnaire:**

#### Q1: What are the performance expectations?

**Maps to:** Spec Section 5.1 – Performance Requirements
**Why this matters:** Performance targets affect architecture decisions and costs.

**Options:**
- A. Standard web performance (2-3 sec page loads) ✓ RECOMMENDED – Good UX without premature optimization. Industry standard for internal tools.
- B. High performance (<1 sec everywhere) – Requires caching, CDN, optimization that may exceed timeline.
- C. No specific requirements – Risky; lack of targets makes testing difficult.
- D. Offline-first with instant response – Complex architecture overkill for 12-person team.

**User's answer:** A

#### Q2: What security level is required?

**Maps to:** Spec Section 5.2 – Security Requirements
**Why this matters:** Security affects architecture, compliance, and development effort.

**Options:**
- A. Standard authentication + role-based access ✓ RECOMMENDED – Sufficient for internal team tool. Email/password login with role separation.
- B. Basic authentication only – No role differentiation means all users have admin powers.
- C. Enterprise-grade with SSO, MFA, audit logs – Over-engineered for 12-person internal tool.
- D. Public access (no authentication) – Inappropriate for team tool.

**User's answer:** A

#### Q3: How many concurrent users should the system support?

**Maps to:** Spec Section 5.3 – Scalability Requirements
**Why this matters:** Informs infrastructure sizing and costs.

**Options:**
- A. 10-25 concurrent users – Conservative for 12-person team (assumes ~2x for growth).
- B. 50-100 concurrent users ✓ RECOMMENDED – Comfortable headroom for growth and peak usage.
- C. 100-500 concurrent users – Over-provisioned for current need, increases costs.
- D. 500+ concurrent users – Overkill unless planning rapid scale-up to entire company.

**User's answer:** B

#### Q4: What integrations are needed?

**Maps to:** Spec Section 5.5 – Integration Requirements
**Why this matters:** Integrations add complexity, dependencies, and ongoing maintenance.

**Options:**
- A. Email notifications only ✓ RECOMMENDED – Minimal external dependency, covers essential need. SMTP is standard.
- B. Calendar integration (Google Calendar, Outlook) – Useful for due dates, but secondary priority.
- C. Slack/Teams integration – Nice-to-have, but email covers the need for MVP.
- D. Full API for custom integrations – Future-proofing but adds development time. Consider Phase 2.

**User's answer:** A

#### Q5: What are the key constraints?

**Maps to:** Spec Section 8 – Constraints and Assumptions
**Why this matters:** Constraints shape realistic scope and expectations.

**Options:**
- A. Budget and timeline constraints ✓ RECOMMENDED – You mentioned 3-6 months, implying timeline is fixed.
- B. Technology stack constraints – Choose if you must use specific languages/frameworks.
- C. Regulatory/compliance constraints – Choose if handling sensitive data (HIPAA, GDPR, SOC2).
- D. No significant constraints – Rare; most projects have time or budget limits.

**User's answer:** A (noting 3-6 month timeline, moderate budget)

**Round 3 Outcome:**
- Performance: 2-3 second page loads
- Security: Standard auth + role-based access
- Scalability: 50-100 concurrent users
- Integrations: Email only
- Constraints: 3-6 month timeline, moderate budget

---

> **Next:** Continue to [Part 2: Research →](example-task-app-research.md) to see application research and pattern analysis.
