# Agent Security Checklist

Security review for Claude Code agents before deployment.

## 1. Secrets and Credentials

- [ ] No API keys in system prompt
- [ ] No passwords or tokens hardcoded
- [ ] No internal URLs or endpoints exposed
- [ ] No PII or sensitive business data
- [ ] Environment variables referenced, not values
- [ ] Agent constrained from reading `.env`, `.env.*`, `credentials.*` files
- [ ] Secret file patterns excluded (`.npmrc`, `*.pem`, `*.key`)
- [ ] Cloud/CI credential files excluded (`*.tfstate`, `~/.config/gcloud`, `~/.kube/config`, `~/.docker/config.json`, `.git-credentials`, `~/.netrc`)
- [ ] Security constraints subsection present in `<constraints>` tag (NEVER read .env, etc.)
- [ ] Security constraints match template defaults (not custom-weakened or omitted)

## 2. Tool Permissions

### Principle of Least Privilege
- [ ] Only necessary tools granted
- [ ] Read-only agents cannot write/edit
- [ ] Bash access justified and restricted
- [ ] WebFetch/WebSearch limited to necessary domains
- [ ] `mcpServers` entries justified; inline server definitions (arbitrary command/URL) flagged High risk; sources pinned/allowlisted
- [ ] `tools` and `disallowedTools` are not mutually contradictory (denylist is applied first, then the allowlist resolves)

### Dangerous Tool Combinations
- [ ] No unrestricted Bash + Write (can overwrite system files)
- [ ] No WebFetch + Write without validation (can download malware)
- [ ] File operations limited to project directory

### Tool Audit Table

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
| `mcpServers` grant | High | Justify each; pin/allowlist sources; flag inline definitions |

## 3. System Prompt Security

### Input Handling
- [ ] No dynamic content interpolation vulnerabilities
- [ ] User input properly isolated
- [ ] Untrusted-data constraint present (High): tool output, fetched web content, and file content are treated as DATA, not instructions — an embedded instruction is reported as a finding, never executed

### Output Handling
- [ ] Sensitive data filtered from output
- [ ] No credential echoing
- [ ] Error messages don't leak internals

### Constraint Enforcement
- [ ] NEVER rules for dangerous actions
- [ ] Confirmation required for destructive operations
- [ ] Rate limiting considerations

## 4. Permission Mode Review

| Mode | Behavior | When to Use |
|------|----------|-------------|
| `default` | Prompts for risky actions | Most agents |
| `acceptEdits` | Auto-accepts edits in working dir + listed FS commands | Trusted automation, narrow scope |
| `plan` | Read/plan only, no mutations | Planning-only agents |
| `auto` | Classifier-gated autonomy with background safety checks | Lower-prompt autonomous runs |
| `dontAsk` | Auto-denies anything not pre-approved | Locked-down CI |
| `bypassPermissions` | No prompts and no protection (including none against prompt injection) | Never in production |

**Plugin-distributed agents ignore `permissionMode`, `mcpServers`, and `hooks`** (and `permissionMode` is also ignored under a parent `auto` mode). For agents shipped inside a plugin, enforce least privilege via `tools`/`disallowedTools` plus session-level `permissions.deny` / managed settings — not `permissionMode`.

- [ ] `permissionMode` appropriate for agent risk level (project/user-level agents only — ignored for plugin agents)
- [ ] `bypassPermissions` NOT used without explicit approval
- [ ] HITL (Human-In-The-Loop) rules for sensitive operations
- [ ] For plugin agents: least privilege enforced via `tools`/`disallowedTools` + session rules (not `permissionMode`)

## 5. HITL Rules

Identify operations requiring human approval. Subagents cannot prompt the user directly (no `AskUserQuestion`), so HITL for an agent means one of two mechanisms that actually work: (a) the agent returns `needs_user_input` before the irreversible action so the orchestrator confirms, or (b) the session/managed permission layer (`permissions.deny`, `dontAsk`) blocks it. In-prompt wording alone ("ask before deleting") is not a control. For each operation below, confirm one of those mechanisms covers it:

### File Operations
- [ ] Deleting files (confirmation required)
- [ ] Overwriting existing files
- [ ] Creating files outside project directory
- [ ] Modifying configuration files

### Execution Operations
- [ ] Running arbitrary shell commands
- [ ] Installing packages
- [ ] Network operations
- [ ] Process management

### Data Operations
- [ ] Accessing credentials/secrets
- [ ] External API calls
- [ ] Database operations
- [ ] Sending data externally

## 6. Scope Restrictions

- [ ] Agent scope clearly defined
- [ ] Cannot access files outside project
- [ ] Cannot modify system files
- [ ] Cannot install system packages
- [ ] Network access limited if possible

## 7. Error Handling

- [ ] Errors don't expose sensitive paths
- [ ] Failures don't leave partial state
- [ ] Rollback procedures documented
- [ ] Audit trail for actions taken

## 8. Audit Trail

For high-risk agents, ensure:
- [ ] Actions logged
- [ ] Changes can be reviewed
- [ ] Rollback possible
- [ ] User notified of significant actions

## Security Risk Assessment

### Risk Levels

| Level | Criteria | Review Required |
|-------|----------|-----------------|
| Low | Read-only, no network | Self-review |
| Medium | Write access OR network | Peer review |
| High | Bash + Write, external APIs | Security review |
| Critical | `bypassPermissions`, credentials | Team lead approval |

### Agent Risk Classification

```
Risk Score = Tool Risk + Permission Risk + Scope Risk

Tool Risk:
- Read/Grep/Glob only: 0
- +WebSearch/WebFetch: +1
- +Edit: +1
- +Write: +2
- +Bash: +3

Permission Risk (project/user-level agents only — inert for plugin agents, which ignore `permissionMode`; score tool/MCP grants instead):
- default / plan: 0
- acceptEdits / auto / dontAsk: +1
- bypassPermissions: +5

Scope Risk:
- Project-only: 0
- User directory: +1
- System-wide: +3
```

| Score | Risk Level | Action |
|-------|------------|--------|
| 0-2 | Low | Deploy |
| 3-4 | Medium | Document risks |
| 5-7 | High | Require HITL |
| 8+ | Critical | Require approval |

## Severity Weights

Each check has a severity that affects the weighted score:
- **Critical (4x)** – Secrets & credentials exposure, hardcoded tokens
- **High (2x)** – Tool permissions violations, missing HITL for destructive ops
- **Medium (1x)** – Scope restrictions, error handling
- **Low (0.5x)** – Audit trail items

**Critical items (auto-fail if any fail):**
- No API keys, passwords, or tokens hardcoded
- No secrets or PII in system prompt
- Environment variables referenced, not values
- `bypassPermissions` NOT used without explicit approval

## Checklist Summary

| Section | Items | Severity | Passed |
|---------|-------|----------|--------|
| Secrets | 10 | Critical | __ / 10 |
| Tool Permissions | 9 | High | __ / 9 |
| System Prompt Security | 9 | High | __ / 9 |
| Permission Mode | 4 | High | __ / 4 |
| HITL Rules | 12 | High | __ / 12 |
| Scope Restrictions | 5 | Medium | __ / 5 |
| Error Handling | 4 | Medium | __ / 4 |
| Audit Trail | 4 | Low | __ / 4 |
| **Total** | **57** | | __ / 57 |

## Pass Criteria

**Weighted scoring formula:** `score = sum(weight * pass_rate_per_section) / sum(applicable_weights) * 100`

- **Acceptable:** Weighted score ≥ 70% with zero critical failures
- **Recommended:** Weighted score ≥ 85%
- **Production:** Weighted score ≥ 95% with all high/critical items passing

**Minimum (hard requirements):**
- All critical items must pass (zero tolerance for secrets/credentials exposure)
- Security risk score ≤ 4 (medium or below)
