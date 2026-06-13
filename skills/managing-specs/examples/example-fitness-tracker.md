# Spec Example: Fitness Tracking Web App

Medium complexity example showing web app with third-party integrations.

---

## Overview

**Application Name:** FitTrack
**Domain:** Health & Fitness
**Complexity:** Medium
**Stakeholder Types:** 4 (User, Trainer, Admin, External API)
**Functional Requirements:** 42
**Use Cases:** 8
**Final Spec Score:** 85/100 (PASS)
**Total Time:** ~4 hours

---

## Step 0: Project Analysis (MANDATORY)

**User invokes skill from within a FitTrack project directory.**

**Discovered context:**
```json
{
  "application_name": "FitTrack",
  "description": "Fitness tracking web app with Strava integration",
  "tech_stack": ["React", "Node.js", "MongoDB", "GraphQL"],
  "existing_features": [
    "workout logging",
    "meal logging",
    "Strava OAuth integration",
    "progress charts",
    "trainer dashboard",
    "client management"
  ],
  "user_types": ["user", "trainer", "admin"],
  "domain": "Health & Fitness",
  "architecture_notes": "PWA with offline support, GraphQL API",
  "documentable_areas": [
    {"id": "full_app", "name": "Full application", "type": "full_app"},
    {"id": "workouts", "name": "Workout tracking", "type": "feature"},
    {"id": "nutrition", "name": "Meal/nutrition tracking", "type": "feature"},
    {"id": "analytics", "name": "Progress analytics", "type": "feature"},
    {"id": "trainer", "name": "Trainer platform", "type": "feature"},
    {"id": "integrations", "name": "External integrations", "type": "module"}
  ]
}
```

**Completeness score:** 60/100

**Gaps identified:**
- Specific analytics requirements
- Meal tracking detail level (calories, macros?)
- Data privacy requirements (sensitive health data)
- Mobile vs web platform decision

---

## Step 1.2: Requirements Gathering

### Scope Selection (First Question)
**"What would you like to document?"**
- ✓ **Full application** (recommended)
- Workout tracking feature
- Meal/nutrition tracking feature
- Progress analytics feature
- Trainer platform feature
- External integrations module

**User selected:** Full application

### Round 1: Core Business

**Q1: Primary business problem**
- **Answer:** A. Health and fitness tracking
- **Context:** Users want to monitor fitness progress, trainers want to support clients remotely

**Q2: Primary users**
- **Answer:** B. Individual users + trainers (two-sided platform)
- **Notes:** ~500 users expected in first year, ~50 trainers

**Q3: Primary business objective**
- **Answer:** B. Improve user health outcomes
- **Metric:** Users achieve fitness goals within 3 months

**Q4: Timeline**
- **Answer:** C. 6-12 months
- **Rationale:** Third-party integration adds complexity

### Round 2: Functional Requirements

**Q1: Workout tracking features**
- **Answer:** C. Log workouts manually + import from Strava
- **Details:** Support cardio (running, cycling, swimming) and strength training

**Q2: Meal tracking detail**
- **Answer:** B. Calories and macros (protein, carbs, fats)
- **Rationale:** Basic nutrition tracking without full ingredient database

**Q3: Analytics scope**
- **Answer:** B. Progress charts + goal tracking
- **Features:** Weight trends, workout volume, calorie balance

**Q4: Trainer features**
- **Answer:** A. View client data + provide feedback
- **Details:** Trainers assign workout plans, review logs, message clients

**Q5: Strava integration**
- **Answer:** A. One-way import (Strava → FitTrack)
- **Rationale:** Users continue using Strava for recording, import to FitTrack for unified view

**Q6: Client-trainer relationship**
- **Answer:** A. Clients send trainer invites, trainers approve
- **Model:** One user can have one trainer at a time

### Round 3: Non-Functional Requirements

**Q1: Platform**
- **Answer:** A. Responsive web app (mobile browser + desktop)
- **Rationale:** Faster development than native apps, still mobile-friendly

**Q2: Performance expectations**
- **Answer:** A. Standard web performance (2-3 sec loads)
- **Charts:** May take 3-5 seconds for complex data aggregation

**Q3: Data privacy/security**
- **Answer:** B. HIPAA-lite (strong security without full compliance)
- **Requirements:** Encrypted data, role-based access, audit logging
- **Note:** Not medical app, so HIPAA not required, but sensitive health data needs protection

**Q4: Scalability**
- **Answer:** B. 500-1,000 concurrent users
- **Planning:** Start with 100 users, scale to 1,000 in year one

**Q5: Integrations**
- **Answer:** A. Strava API only for MVP
- **Future:** MyFitnessPal, Apple Health, Google Fit in Phase 2

**Q6: Constraints**
- **Answer:** A. Budget and timeline
- **Details:** 6-month MVP timeline, moderate budget, Strava API rate limits (200 requests/15 min)

---

## Step 2.1: Application Research

**Applications researched:** 3

### 1. MyFitnessPal
**URL:** myfitnesspal.com
**Focus:** Nutrition tracking with exercise logging

**Core features:**
- Comprehensive food database
- Barcode scanning
- Calorie and macro tracking
- Exercise logging (manual + device sync)
- Goal setting (weight loss/gain)
- Progress charts

**Stakeholders:**
- Free users (limited features)
- Premium subscribers
- Content partners (food database)

**Integrations:**
- 50+ fitness apps/devices
- Under Armour ecosystem

**Key insight:** Food database is massive effort - we should use simpler manual entry for MVP

---

### 2. Strava
**URL:** strava.com
**Focus:** Social fitness for runners/cyclists

**Core features:**
- Activity tracking (GPS-based)
- Social feed (kudos, comments)
- Segments and leaderboards
- Training plans
- Route planning
- Clubs and challenges

**Stakeholders:**
- Athletes (free and premium)
- Coaches
- Clubs/organizations

**Integrations:**
- 100+ device and app connections
- Open API for third-party developers

**Key insight:** Social features drive engagement - consider adding social elements in Phase 2

---

### 3. Trainerize
**URL:** trainerize.com
**Focus:** Trainer-client workout management

**Core features:**
- Custom workout builder for trainers
- Assign workouts to clients
- Client progress tracking
- In-app messaging
- Video exercise library
- Nutrition planning (meal plans)

**Stakeholders:**
- Trainers/coaches (primary buyers)
- Clients (end users)
- Gym/studio owners

**Integrations:**
- MyFitnessPal
- Fitbit
- Apple Health
- Payment processing (subscriptions)

**Key insight:** Trainer-client communication is critical - need robust messaging

---

### Research Summary

**Common patterns (appeared in 3/3 apps):**
- Activity/workout logging (manual entry)
- Goal setting and tracking
- Progress visualization (charts)
- Integration with other fitness platforms
- Mobile-responsive or native apps

**Most apps (appeared in 2/3 apps):**
- Social features (feed, comments, kudos)
- Nutrition tracking
- Trainer-client relationships
- In-app messaging
- Custom workout plans
- Premium subscription model

**Research quality:**
- Applications count: 3
- Domain match: 90% (all fitness/health focused)
- Pattern confidence: High

---

## Step 2.2: Pattern Analysis

### Feature Patterns

| Pattern | Frequency | Category | Evidence |
|---------|-----------|----------|----------|
| Workout logging | 3/3 | Core | MyFitnessPal, Strava, Trainerize |
| Goal tracking | 3/3 | Core | MyFitnessPal, Strava, Trainerize |
| Progress charts | 3/3 | Core | MyFitnessPal, Strava, Trainerize |
| Device/app integrations | 3/3 | Core | MyFitnessPal, Strava, Trainerize |
| Nutrition tracking | 2/3 | Core | MyFitnessPal, Trainerize |
| Trainer features | 1/3 | Supporting | Trainerize |
| Messaging | 2/3 | Supporting | Strava, Trainerize |
| Social features | 2/3 | Nice-to-have | Strava, Trainerize |
| Custom workout plans | 1/3 | Nice-to-have | Trainerize |

### Gap Analysis

**Missing from user requirements vs patterns:**
- Messaging between trainer and client (appeared in 2/3)
- Goal setting framework (appeared in 3/3, user mentioned analytics but not goal structure)
- Mobile app (appeared in 3/3, user didn't specify platform)

### Recommendations

1. **Add in-app messaging** - Must-have
   - Priority: High
   - Rationale: Trainer feedback mentioned, but real-time messaging needed for effective coaching
   - Evidence: Strava (athletes comment), Trainerize (trainer-client chat)
   - Complexity: Medium
   - Implementation: Simple text messaging, file attachments in Phase 2

2. **Structured goal setting** - Must-have
   - Priority: High
   - Rationale: Analytics meaningless without baseline and targets
   - Evidence: All 3 apps have goal-setting frameworks
   - Complexity: Low
   - Implementation: Weight goals, workout frequency goals, calorie targets

3. **Plan for mobile app** - Should-have
   - Priority: Medium (Phase 2)
   - Rationale: Logging on-the-go is critical for adoption
   - Evidence: All 3 apps have mobile versions
   - Complexity: High
   - Recommendation: Start with responsive web, build native app in Phase 2 based on traction

4. **Consider workout library** - Nice-to-have
   - Priority: Low
   - Rationale: Trainers need pre-built exercises to assign
   - Evidence: Trainerize has extensive video library
   - Complexity: Very high (content creation)
   - Recommendation: Phase 2/3 feature, start with text descriptions only

---

## Spec Generation and Results

The detailed spec generation output, validation results, and lessons learned have been extracted to a separate document to keep this example concise.

**See:** [example-fitness-tracker-spec.md](./example-fitness-tracker-spec.md) for:
- Step 3.1: Spec Generation (Key Sections)
  - Functional Requirements Summary (42 requirements)
  - Non-Functional Requirements Summary (15 requirements)
  - Use Cases (001-UC-001: Import Workout from Strava, 001-UC-005: Trainer Views Client Progress)
- Step 3.2: Validation Results
  - Section Scores (86/100 overall - PASS)
  - Findings and Strengths
- Lessons Learned
  - What Worked Well
  - Challenges
  - Key Decisions
  - Recommendations for Similar Projects
- Files Generated

---

**Completion Date:** 2025-12-20
**Total Time:** ~4 hours (requirements gathering: 1 hour, research: 1.5 hours, generation: 1 hour, validation + refinement: 30 min)
