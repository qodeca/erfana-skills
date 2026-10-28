# Spec Example: Simple Blog Platform

Quick example showing minimal workflow for a simple application.

---

## Overview

**Application Name:** SimpleBlog
**Domain:** Content publishing
**Complexity:** Simple
**Stakeholder Types:** 2 (Blogger, Reader)
**Functional Requirements:** 15
**Use Cases:** 3
**Final Spec Score:** 82/100 (PASS)
**Total Time:** ~1.5 hours

---

## Step 0: Project Analysis (MANDATORY)

**User invokes skill from within a blog project directory.**

### Agent: spec-project-analyzer

**Files Analyzed:**
```
Scanning project: /home/user/projects/SimpleBlog/
├── package.json          [FOUND] → Dependencies analyzed
├── README.md             [FOUND] → Description extracted
├── .env.example          [FOUND] → Configuration hints
├── src/
│   ├── routes/           [15 files] → API endpoints discovered
│   ├── models/           [4 files] → Data entities identified
│   ├── controllers/      [6 files] → Business logic examined
│   └── middleware/       [3 files] → Auth/validation detected
├── client/
│   ├── src/              [18 files] → React components scanned
│   └── package.json      [FOUND] → Frontend stack detected
└── docs/
    └── API.md            [FOUND] → Partial documentation exists

Total: 52 files analyzed, 3 directories
```

**Tech Stack Detected:**
| Layer | Technology | Confidence | Source |
|-------|------------|------------|--------|
| Backend Runtime | Node.js 18.x | 100% | package.json: "node": ">=18.0.0" |
| Web Framework | Express 4.x | 100% | package.json: "express": "^4.18.2" |
| Database | MongoDB | 95% | package.json: "mongoose": "^7.0.0" |
| Frontend | React 18.x | 100% | client/package.json: "react": "^18.2.0" |
| State Management | Redux Toolkit | 85% | client/package.json: "redux-toolkit" |
| Build Tool | Vite | 90% | client/vite.config.js present |

**Features Discovered (from code analysis):**

**Post Management** (routes/posts.js):
- `POST /api/posts` → Create post
- `GET /api/posts` → List posts
- `GET /api/posts/:id` → View single post
- `PUT /api/posts/:id` → Update post
- `DELETE /api/posts/:id` → Delete post

**Comments System** (routes/comments.js):
- `POST /api/posts/:id/comments` → Add comment
- `GET /api/posts/:id/comments` → List comments
- `DELETE /api/comments/:id` → Delete comment (admin only)

**Authentication** (middleware/auth.js):
- JWT-based authentication
- Role-based access control (admin, user)
- Protected routes for post management

**Data Models** (models/):
- Post: { title, content, author, publishedAt, status, tags }
- Comment: { postId, author, content, createdAt }
- User: { email, password, role }

**User Types Identified:**
- **Blogger** (admin role): Create, edit, delete posts
- **Reader** (public): View posts, add comments

**Completeness Score Calculation:**

| Category | Score | Reasoning |
|----------|-------|-----------|
| README present | 10/10 | Found with project description |
| Package.json complete | 15/15 | Dependencies + scripts defined |
| Source code structure | 20/25 | Good organization, -5 for missing tests |
| API documentation | 5/10 | Partial API.md, incomplete |
| Data models documented | 10/15 | Models exist, no schema docs |
| Environment config | 5/10 | .env.example present, not documented |
| Tests | 0/15 | No test files found |
| **Total** | **65/100** | **NEEDS IMPROVEMENT** |

**Gaps Identified:**
- ❌ **Business objectives**: Not in README or docs
- ❌ **Comment moderation requirements**: Unclear from code
- ❌ **Performance expectations**: No benchmarks or requirements
- ❌ **Testing strategy**: No test files found
- ⚠️ **Incomplete API docs**: Only 40% of endpoints documented

**Discovered Context (JSON):**
```json
{
  "application_name": "SimpleBlog",
  "description": "A simple blog platform for publishing articles",
  "tech_stack": ["Node.js", "Express", "MongoDB", "React"],
  "existing_features": ["post CRUD", "comments", "auth"],
  "user_types": ["blogger", "reader"],
  "domain": "Content publishing",
  "documentable_areas": [
    {"id": "full_app", "name": "Full application", "type": "full_app"},
    {"id": "posts", "name": "Post management", "type": "feature"},
    {"id": "comments", "name": "Comments system", "type": "feature"},
    {"id": "auth", "name": "Authentication", "type": "module"}
  ]
}
```

**Agent Recommendation:**
> Completeness score of 65/100 indicates moderate documentation gaps. Recommend full application spec to establish missing requirements before further development.

---

## Step 1.2: Requirements Gathering (Condensed)

### Scope Selection (First Question)
**"What would you like to document?"**
- ✓ **Full application** (recommended)
- Post management feature
- Comments system feature
- Authentication module

**User selected:** Full application

### Round 1: Core Business
- **Problem:** Content publishing and reader engagement
- **Users:** Individual blogger + public readers
- **Objective:** Establish online presence and build audience
- **Timeline:** 2-3 months

### Round 2: Functional Requirements
- **Core features:** Create, edit, publish posts; view posts; add comments
- **Post properties:** Title, content (rich text), publish date, status (draft/published)
- **Comments:** Public, no moderation for MVP
- **Organization:** Categories/tags for posts

### Round 3: Non-Functional Requirements
- **Performance:** Standard web (2-3 sec loads)
- **Security:** Admin login for blogger, public read access
- **Scalability:** 100 posts, 1,000 page views/day
- **Integrations:** None for MVP (RSS feed in Phase 2)

---

## Step 2.1: Application Research

**Applications researched:** 3

### 1. WordPress
- CRUD posts with rich editor
- Categories and tags
- Comments with moderation
- User roles (Admin, Editor, Author, Subscriber)

### 2. Medium
- Simple post creation with minimal formatting
- Claps (likes) instead of comments
- Reading time estimation
- Follow authors

### 3. Ghost
- Markdown-based editor
- Member subscriptions
- SEO optimization built-in
- Newsletter integration

**Common patterns (3/3):**
- Post CRUD operations
- Rich text editing
- Publishing workflow (draft → published)
- Reader engagement (comments or reactions)
- Post organization (tags/categories)
- Archive/search functionality

---

## Step 2.2: Pattern Analysis

**Key patterns identified:**

| Pattern | Frequency | Category |
|---------|-----------|----------|
| Post CRUD | 3/3 | Core |
| Rich text editor | 3/3 | Core |
| Draft/published status | 3/3 | Core |
| Comments or reactions | 3/3 | Core |
| Categories/tags | 3/3 | Core |
| Search | 3/3 | Supporting |
| SEO features | 2/3 | Nice-to-have |

**Recommendations:**
1. Add search functionality (not mentioned, but essential)
2. Include reading time estimate (user engagement)
3. Plan for SEO basics (meta descriptions, titles)

---

## Step 3.1: Spec Generation (Key Sections)

### Functional Requirements Summary

**Post Management (7 requirements):**
- 001-FR-001: Create post with title, content, category
- 001-FR-002: Save as draft or publish immediately
- 001-FR-003: Edit existing posts
- 001-FR-004: Delete posts (soft delete)
- 001-FR-005: Assign categories/tags
- 001-FR-006: View post preview before publishing
- 001-FR-007: Search posts by keyword or category

**Reader Features (5 requirements):**
- 001-FR-008: View published posts (list and detail)
- 001-FR-009: Add comments to posts
- 001-FR-010: View comments chronologically
- 001-FR-011: Search posts
- 001-FR-012: Filter by category/tag

**Content Display (3 requirements):**
- 001-FR-013: Display reading time estimate
- 001-FR-014: Show post metadata (date, category, author)
- 001-FR-015: Responsive layout (mobile-friendly)

### Non-Functional Requirements Summary

**Performance:**
- 001-NFR-001: Post list loads within 2 seconds
- 001-NFR-002: Individual post loads within 1.5 seconds

**Security:**
- 001-NFR-101: Admin authentication required for post management
- 001-NFR-102: Public read access (no login needed)
- 001-NFR-103: Basic SPAM protection for comments

**Scalability:**
- 001-NFR-201: Support 100 posts initially
- 001-NFR-202: Handle 1,000 page views/day

### Use Cases

**001-UC-001: Create and Publish Post**
- Main flow: Admin creates post → adds content → publishes
- Alternate: Save as draft for later
- Exception: Empty title/content validation

**001-UC-002: Reader Views and Comments**
- Main flow: Reader browses posts → reads post → adds comment
- Alternate: Reader searches for specific topic
- Exception: Comment SPAM detection

**001-UC-003: Search Posts**
- Main flow: User enters keyword → views results → clicks post
- Alternate: Filter by category
- Exception: No results found

---

## Step 3.2: Validation Results

**Validation against quality checklist:**

### Section Scores

| Section | Score | Percentage |
|---------|-------|------------|
| Requirements Quality | 20/25 | 80% |
| Use Case Quality | 17/20 | 85% |
| Stakeholder Coverage | 8/10 | 80% |
| Non-Functional Requirements | 8/10 | 80% |
| Business Objectives | 9/10 | 90% |
| Consistency | 8/10 | 80% |
| Completeness | 8/10 | 80% |
| Professional Quality | 4/5 | 80% |

**Overall Score:** 82/100 ✅ PASS (threshold: 80)

### Findings

**Low Priority:**
1. Could add more use cases (currently 3, recommended 5 for simple apps)
2. Some acceptance criteria could be more specific

### Strengths
- Clear and focused scope
- Well-defined MVP boundaries
- Appropriate simplicity for 2-3 month timeline
- Good separation of admin vs public features

---

## Lessons Learned

### What Worked Well

1. **Simplicity maintained:** Resisted feature creep, stayed focused on core blogging
2. **Public access model:** No authentication for readers simplified architecture
3. **Pattern validation:** Research confirmed all core features aligned with industry standards

### Key Decisions

1. **No comment moderation in MVP:** Reduces complexity, SPAM protection only
2. **Single author:** Multi-author blogging deferred to Phase 2
3. **No rich media:** Focus on text content, images in Phase 2

### Recommendations

- Start with Markdown editor (simpler than WYSIWYG)
- Use static site generation for performance (optional)
- Add RSS feed in Phase 2 for reader subscriptions

---

## Files Generated

1. **Spec Document:** `specs/spec-t3-001-simple-blog/` (T3 Lite spec)
   - manifest.json
   - requirements/
     - 01-overview.md
     - 02-requirements.md (15 FR, 6 NFR)
     - 03-acceptance.md (3 use cases)
2. **Validation Report:** 82/100 score

---

**Completion Date:** 2025-12-20
**Total Time:** ~1.5 hours
**Next Steps:** Begin development with post CRUD, add comments and search in sprint 2
