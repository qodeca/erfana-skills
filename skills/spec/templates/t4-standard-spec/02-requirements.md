# Requirements

## Functional Requirements

| ID | Requirement | Priority | Traces To |
|----|-------------|----------|-----------|
| {spec_id}-FR-001 | [Requirement] | Must | UC-001 |
| {spec_id}-FR-002 | [Requirement] | Should | UC-001 |
| {spec_id}-FR-003 | [Requirement] | Could | UC-002 |

### {spec_id}-FR-001: [Title]

**Description:** [Detailed description]

**Priority:** Must

**Traces To:** {spec_id}-UC-001

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

**Dependencies:** [Other FRs or external dependencies]

---

## Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| {spec_id}-NFR-001 | Performance | [Requirement] | [Specific metric] |
| {spec_id}-NFR-002 | Accessibility | [Requirement] | [Specific metric] |
| {spec_id}-NFR-003 | Security | [Requirement] | [Specific metric] |

### {spec_id}-NFR-001: [Title]

**Category:** Performance

**Description:** [Detailed description]

**Metric:** [Specific, measurable target]

**Measurement Method:** [How to verify]

**Traces To:** [Related FRs or UCs]

---

## Naming contracts

> Optional – include when the feature defines IPC channels, API methods, types, store names, or schema fields that must be consistent between spec and implementation.

| Domain | Canonical name | Type | Referenced in |
|--------|---------------|------|--------------|
| IPC channel | `example:channelName` | string | FR-NNN |
| Preload method | `methodName` | function | FR-NNN |
| Schema type | `TypeName` | interface | FR-NNN |
| Store | `useStoreName` | hook | FR-NNN |
| Schema field | `fieldName` | property | FR-NNN |
