# Requirements

## Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| 001-FR-001 | The user can request a reset link by email; the link expires after 15 minutes. | Must | AC-001 |
| 001-FR-002 | The reset page should respond quickly. | Must | AC-002 |
| 001-FR-002 | The new password must meet the password policy. | Must | AC-002 |
| 001-FR-003 | The user is signed out of all other sessions after a reset. | Should | – |
| 001-FR-004 | The user can request a 6-digit reset code by SMS. | Could | – |

## Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| 001-NFR-001 | Security | The reset flow must be secure, user-friendly, etc. | TBD |
| 001-NFR-002 | Usability | Reset links stay valid for 24 hours so users on slow email can still use them. | 24 h |
