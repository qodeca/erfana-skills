# Report requirements interview questions

The canonical question catalog for the CREATE operation. The skill (main
conversation) asks these via AskUserQuestion – subagents cannot ask the user
anything. Answers are then passed inline to `gather-report-requirements`,
which compiles the requirements specification.

Ask one category per AskUserQuestion call (max 4 questions per call).
Open-ended questions (2.1) are asked as free-text prompts.

## Requirements Categories

### Category 1: Report Purpose

**Question 1.1:** What is the primary purpose of this report?

| Option | Description | Rec |
|--------|-------------|-----|
| Audit findings and recommendations | Identify issues and provide actionable fixes | **✓** |
| Strategic assessment | Evaluate strategic options and direction | |
| Technical evaluation | Deep-dive technical analysis | |
| Progress/status update | Report on project or initiative status | |
| Other | Custom purpose (specify) | |

**Question 1.2:** Who is the primary audience?

| Option | Description | Rec |
|--------|-------------|-----|
| C-suite executives | CEO, CFO, COO level decision makers | **✓** |
| Department heads | Functional leaders (IT Director, etc.) | |
| Technical teams | Engineers, developers, analysts | |
| Board of directors | Governance and oversight | |
| External stakeholders | Clients, regulators, partners | |
| Multiple audiences | Mixed (specify primary and secondary) | |

**Question 1.3:** What decision should this report enable?

| Option | Description | Rec |
|--------|-------------|-----|
| Budget approval | Secure funding for initiatives | |
| Strategic direction | Choose between strategic options | **✓** |
| Vendor selection | Select technology or service provider | |
| Process improvement | Authorize operational changes | |
| Risk mitigation | Approve risk response actions | |
| Other | Custom decision (specify) | |

### Category 2: Content Scope

**Question 2.1:** What subject areas must be covered? (Open-ended, list all required topics)

**Question 2.2:** What time period does this cover?

| Option | Description | Rec |
|--------|-------------|-----|
| Assessment period only | Focus on current state findings | **✓** |
| Implementation timeline | Include future roadmap (6-18 months) | |
| Historical context | Include trend analysis from past periods | |
| Full lifecycle | Past, present, and future state | |

**Question 2.3:** What source materials exist?

| Option | Description | Rec |
|--------|-------------|-----|
| Interview transcripts | Stakeholder interviews conducted | **✓** |
| Analysis documents | Prior analysis or working papers | |
| Data files | Quantitative data, exports, logs | |
| Previous reports | Earlier versions or related reports | |
| None | Starting from scratch | |

### Category 3: Structure Preferences

**Question 3.1:** Preferred report type?

| Option | Description | Rec |
|--------|-------------|-----|
| Comprehensive audit report | Full findings, recommendations, roadmap | **✓** |
| Executive briefing | High-level summary for leadership | |
| Technical assessment | Detailed technical analysis | |
| Strategic roadmap | Focus on future state and path | |
| Custom structure | Specify custom sections | |

**Question 3.2:** Approximate length target?

| Option | Description | Rec |
|--------|-------------|-----|
| Brief (10-20 pages) | Executive summary style | |
| Standard (30-50 pages) | Typical consulting deliverable | **✓** |
| Comprehensive (50-80 pages) | Detailed with extensive analysis | |
| Detailed (80+ pages) | Full documentation with appendices | |

**Question 3.3:** Appendix requirements? (Select all that apply)

| Option | Description | Rec |
|--------|-------------|-----|
| Methodology details | How assessment was conducted | **✓** |
| Raw data | Supporting data tables | |
| Supporting analysis | Detailed calculations, models | |
| Glossary | Terms and abbreviations | |
| Interview list | People consulted | |
| None | No appendices needed | |

### Category 4: Deliverable Format

**Question 4.1:** Primary output format?

| Option | Description | Rec |
|--------|-------------|-----|
| Markdown | For further processing, version control | **✓** |
| Word document | Standard business document | |
| PDF | Final locked format | |
| Presentation deck | PowerPoint/Slides format | |
| Multiple formats | Deliver in multiple formats | |

**Question 4.2:** Branding requirements?

| Option | Description | Rec |
|--------|-------------|-----|
| Client branding | Client logo, colors, fonts | |
| Firm branding | Consulting firm branding | **✓** |
| Co-branded | Both client and firm branding | |
| Neutral | No specific branding | |

**Question 4.3:** Version control needs?

| Option | Description | Rec |
|--------|-------------|-----|
| Single draft cycle | One review before final | |
| Multiple draft cycles | 2-3 review rounds expected | **✓** |
| Formal approval workflow | Requires sign-off chain | |
| Minimal | Direct to final with minor edits | |

### Category 5: Quality Standards

**Question 5.1:** Review process required?

| Option | Description | Rec |
|--------|-------------|-----|
| Internal review only | Team/manager review | |
| Client review required | Client stakeholders must approve | **✓** |
| Multiple stakeholder reviews | Several parties review | |
| Board presentation | Formal board-level review | |

**Question 5.2:** Special requirements? (Select all that apply)

| Option | Description | Rec |
|--------|-------------|-----|
| Regulatory compliance | Must meet regulatory standards | |
| Industry standards | IIA, ISO, or similar | **✓** |
| Client style guide | Follow client's documentation standards | |
| Translation needs | Multi-language delivery | |
| None | Standard quality only | |

**Question 5.3:** Confidentiality level?

| Option | Description | Rec |
|--------|-------------|-----|
| Public | No restrictions | |
| Internal | Organization internal only | **✓** |
| Confidential | Limited distribution, named recipients | |
| Restricted | Highly sensitive, strict controls | |

