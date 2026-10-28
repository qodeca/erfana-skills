# Agent Security Checklist

Security review for agents before deployment.

---

## 1. Secrets and Credentials

- [ ] No API keys in agent content
- [ ] No passwords or tokens hardcoded
- [ ] No internal URLs or endpoints exposed
- [ ] No PII or sensitive business data
- [ ] Environment variables referenced, not values
- [ ] Agent constrained from reading secret files:
  - [ ] `.env`, `.env.*`
  - [ ] `credentials.*`
  - [ ] `.npmrc`
  - [ ] `*.pem`, `*.key`

## 2. Tool Permissions

### Principle of Least Privilege
- [ ] Only necessary tools granted
- [ ] Read-only agents cannot write/edit
- [ ] Bash access justified and documented
- [ ] WebFetch/WebSearch limited to necessary domains
- [ ] **No Task tool** (agents cannot spawn agents)
- [ ] **No AskUserQuestion** (silently filtered)

### Required Constraint Sections
- [ ] If Bash in tools: `<bash_constraints>` section present with ALLOWED/NEVER lists
- [ ] If Write/Edit in tools: `<file_restrictions>` section present with allowed paths

### Dangerous Tool Combinations
- [ ] No unrestricted Bash + Write (can overwrite system files)
- [ ] No WebFetch + Write without validation (can download malware)
- [ ] File operations limited to project directory

### Tool Audit

| Tool | Risk Level | Justification Required |
|------|------------|----------------------|
| Read | Low | Minimal |
| Grep | Low | Minimal |
| Glob | Low | Minimal |
| WebSearch | Medium | Document use case |
| WebFetch | Medium | Document domains |
| Edit | Medium | Document scope |
| Write | High | Strong justification |
| Bash | High | Restrict commands |

## 3. Input Handling

- [ ] No dynamic content interpolation vulnerabilities
- [ ] User input properly isolated
- [ ] Prompt injection mitigations considered
- [ ] Input validation before processing

## 4. Output Handling

- [ ] Sensitive data filtered from output
- [ ] No credential echoing
- [ ] Error messages don't leak internals
- [ ] File paths don't expose system structure

## 5. Constraint Enforcement

- [ ] NEVER rules for dangerous actions
- [ ] Confirmation required for destructive operations
- [ ] Scope boundaries clearly defined
- [ ] Rate limiting considerations (for web agents)

## 6. HITL Rules

Identify operations requiring human approval:

### File Operations
- [ ] Deleting files requires confirmation
- [ ] Overwriting existing files flagged
- [ ] Creating files outside project blocked
- [ ] Modifying configuration files requires approval

### Execution Operations
- [ ] Running arbitrary shell commands restricted
- [ ] Installing packages requires approval
- [ ] Network operations documented
- [ ] Process management restricted

### Data Operations
- [ ] Accessing credentials blocked
- [ ] External API calls documented
- [ ] Database operations require approval
- [ ] Sending data externally flagged

## 7. Scope Restrictions

- [ ] Agent scope clearly defined in Purpose
- [ ] Cannot access files outside project
- [ ] Cannot modify system files
- [ ] Cannot install system packages
- [ ] Network access limited if possible

## 8. Error Handling

- [ ] Errors don't expose sensitive paths
- [ ] Failures don't leave partial state
- [ ] Rollback procedures documented (if applicable)
- [ ] Actions can be audited/reviewed

## 9. CC 2.1 agent security

- [ ] `permissionMode` is not `bypassPermissions` for user-facing agents
- [ ] `isolation` set for agents with destructive Bash commands
- [ ] `memory` scope: no credentials stored in `user` or `project` scope
- [ ] `mcpServers` connect to trusted sources only
- [ ] `hooks` commands validated for injection risks

---

## Checklist Summary

| Section | Items | Passed |
|---------|-------|--------|
| Secrets | 6 | __ / 6 |
| Tool Permissions | 10 | __ / 10 |
| Input Handling | 4 | __ / 4 |
| Output Handling | 4 | __ / 4 |
| Constraint Enforcement | 4 | __ / 4 |
| HITL Rules | 12 | __ / 12 |
| Scope Restrictions | 5 | __ / 5 |
| Error Handling | 4 | __ / 4 |
| CC 2.1 Agent Security | 5 | __ / 5 |
| **Total** | **54** | __ / 54 |

---

## Risk Assessment

### Risk Scoring System

```
Risk Score = Tool Risk + Scope Risk

Tool Risk:
- Read/Grep/Glob only: 0
- +WebSearch/WebFetch: +1
- +Edit: +1
- +Write: +2
- +Bash: +3

Scope Risk:
- Skill-internal only: 0
- Project-wide: +1
- User directory: +2
- System-wide: +4
```

### Risk Levels

| Score | Risk Level | Action Required |
|-------|------------|-----------------|
| 0-2 | Low | Self-review, deploy |
| 3-4 | Medium | Document risks |
| 5-6 | High | Require HITL rules |
| 7+ | Critical | Require explicit approval |

---

## Automatic Fail Conditions

These items cause automatic failure:

- [ ] **Task tool in agent** - agents cannot spawn agents
- [ ] **AskUserQuestion in agent** - silently filtered, won't work
- [ ] **Tools field omitted** - inherits ALL tools (security risk)
- [ ] API keys or secrets in agent content
- [ ] Bash + Write without HITL rules
- [ ] No scope restrictions documented
- [ ] Can access files outside project
- [ ] WebFetch to arbitrary domains without validation

---

## Security Red Flags

Stop and review if you see:

1. Agent can write to arbitrary paths
2. Agent executes user-provided commands
3. Agent fetches from unvalidated URLs
4. No constraints section in agent
5. Bash access without command restrictions
6. Agent handles credentials or tokens
7. Agent can modify configuration files
8. No input validation documented

---

## Review Questions

Before signing off, ask yourself:

1. What's the worst this agent could do if it malfunctions?
2. What sensitive data could this agent access?
3. What would happen if input was malicious?
4. Are there any paths to privilege escalation?
5. Can actions be reversed if something goes wrong?
