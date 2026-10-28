# Security Checklist

Security validation for Claude Code skills. Complete before release.

**Scoring note:** This checklist uses a 93-point weighted scale (sections have 1x-3x multipliers based on risk). The pre-release-checklist.md uses a 62-point unweighted scale. The review-checklist.md uses a 33-point scale for audits. Different scales serve different purposes: security validates risk, pre-release validates completeness, review validates ongoing health.

---

## Risk Scoring

Each section has a risk weight. Higher weight = more critical.

| Risk Level | Weight | Meaning |
|------------|--------|---------|
| Critical | x3 | Must pass, blocks release |
| High | x2 | Should pass, exceptions need justification |
| Medium | x1 | Recommended, may skip with documentation |

---

## Section 0: Isolation & Architecture (Critical x3)

**ALL items MUST pass. Any failure blocks release.**

- [ ] **0.1 No skill references:** Skill does NOT reference other skills
- [ ] **0.2 Valid agent sources:** Only uses agents from valid sources (builtin/shared)
- [ ] **0.3 Agent isolation:** Agents do not call other agents directly
- [ ] **0.4 No shared state:** Skill does not access shared/global state
- [ ] **0.5 Contained scope:** Skill operates only within its directory

**Section 0 Score:** ____ / 5 (× 3 = ____ / 15)

---

## Section 1: Secrets & Credentials (Critical x3)

- [ ] **1.1 No hardcoded API keys:** API keys use environment variables
  - `api_key = os.environ.get("API_KEY")`
  - NOT: `api_key = "sk-abc123..."`

- [ ] **1.2 No hardcoded passwords:** Passwords never appear in skill files

- [ ] **1.3 No tokens in examples:** Example code uses placeholders
  - `Authorization: Bearer $TOKEN`
  - NOT: `Authorization: Bearer eyJhbG...`

- [ ] **1.4 No sensitive paths:** No user-specific paths with personal information
  - `~/.config/your-app/`
  - NOT: `/Users/john.smith/secrets/`

- [ ] **1.5 No private data in examples:** Examples use generic/fake data

**Section 1 Score:** ____ / 5 (× 3 = ____ / 15)

---

## Section 2: Code Execution (Critical x3)

- [ ] **2.1 No arbitrary code execution:** Scripts don't execute user input as code
  - NOT: `eval(user_input)`
  - NOT: `exec(user_input)`

- [ ] **2.2 No shell injection:** Commands properly escape user input
  - NOT: `os.system(f"rm {user_input}")`

- [ ] **2.3 No remote code execution:** Don't download and run external scripts blindly

- [ ] **2.4 Sandboxed destructive operations:** Confirm before delete/overwrite

**Section 2 Score:** ____ / 4 (× 3 = ____ / 12)

---

## Section 3: File Handling (High x2)

- [ ] **3.1 Forward slashes:** All paths use `/`, not `\`

- [ ] **3.2 Relative paths:** Use relative paths within the skill

- [ ] **3.3 No path traversal:** Instructions don't encourage `../../../` patterns

- [ ] **3.4 Safe file operations:** Read/write to expected locations only

- [ ] **3.5 No home directory overwrite:** Don't write to `~/` without explicit user consent

**Section 3 Score:** ____ / 5 (× 2 = ____ / 10)

---

## Section 4: External Resources (High x2)

- [ ] **4.1 Trusted sources only:** External links point to reputable sources
  - Official documentation
  - Well-known repositories

- [ ] **4.2 HTTPS required:** All URLs use HTTPS, not HTTP

- [ ] **4.3 Stable links:** Links to stable resources, not temporary content

- [ ] **4.4 No tracking/analytics:** Don't include external tracking pixels or analytics

**Section 4 Score:** ____ / 4 (× 2 = ____ / 8)

---

## Section 5: Dependencies (High x2)

- [ ] **5.1 Dependencies documented:** Required packages/tools are listed

- [ ] **5.2 Version constraints:** Specific versions noted if required

- [ ] **5.3 Trusted sources:** Dependencies from official/trusted sources

- [ ] **5.4 No malicious packages:** Dependencies verified as legitimate

- [ ] **5.5 Minimal dependencies:** Only necessary dependencies included

**Section 5 Score:** ____ / 5 (× 2 = ____ / 10)

---

## Section 6: Data Handling (Medium x1)

- [ ] **6.1 No data collection:** Skill doesn't send user data externally (unless documented)

- [ ] **6.2 Privacy respected:** User file contents aren't logged unnecessarily

- [ ] **6.3 Minimal permissions:** Skill requests only needed permissions

- [ ] **6.4 Temporary files cleaned:** Any temp files are removed after use

**Section 6 Score:** ____ / 4 (× 1 = ____ / 4)

---

## Section 7: Input Validation (Medium x1)

- [ ] **7.1 Input validation present:** User input validated before use

- [ ] **7.2 Type checking:** Input types verified

- [ ] **7.3 Length limits:** Input length constrained where appropriate

- [ ] **7.4 Sanitization:** Special characters handled appropriately

**Section 7 Score:** ____ / 4 (× 1 = ____ / 4)

---

## Section 8: Error Handling (Medium x1)

- [ ] **8.1 Graceful failures:** Scripts fail with helpful messages

- [ ] **8.2 No sensitive data in errors:** Error messages don't expose secrets

- [ ] **8.3 Secure defaults:** Failures default to secure state

**Section 8 Score:** ____ / 3 (× 1 = ____ / 3)

---

## Section 9: CC 2.1 security checks (High x2)

- [ ] **9.1 Tool restrictions appropriate:** `allowed-tools` / `disallowedTools` are appropriate for agent scope
- [ ] **9.2 No bypass for shared:** `permissionMode` is NOT `bypassPermissions` for shared agents
- [ ] **9.3 Memory scope matches sensitivity:** `memory` scope matches data sensitivity (local for credentials, project for conventions)
- [ ] **9.4 Isolation for destructive ops:** `isolation` set for agents performing destructive file operations
- [ ] **9.5 Hooks safety:** `hooks` commands do not expose secrets or run dangerous operations
- [ ] **9.6 Trusted MCP servers:** `mcpServers` connect only to trusted, documented servers

**Section 9 Score:** ____ / 6 (× 2 = ____ / 12)

---

## Scoring Summary

| Section | Raw | Weight | Weighted |
|---------|-----|--------|----------|
| 0. Isolation & Architecture | /5 | ×3 | /15 |
| 1. Secrets & Credentials | /5 | ×3 | /15 |
| 2. Code Execution | /4 | ×3 | /12 |
| 3. File Handling | /5 | ×2 | /10 |
| 4. External Resources | /4 | ×2 | /8 |
| 5. Dependencies | /5 | ×2 | /10 |
| 6. Data Handling | /4 | ×1 | /4 |
| 7. Input Validation | /4 | ×1 | /4 |
| 8. Error Handling | /3 | ×1 | /3 |
| 9. CC 2.1 Security | /6 | ×2 | /12 |
| **TOTAL** | **/45** | | **/93** |

---

## Pass Criteria

| Weighted Score | Status | Action |
|----------------|--------|--------|
| 87-93 | **PASS** | Ready for release |
| 75-86 | **CONDITIONAL** | Review failures, may release with documentation |
| 58-74 | **NEEDS WORK** | Address critical/high issues |
| 0-57 | **FAIL** | Significant security work needed |

### Automatic Fail Conditions

Regardless of score, FAIL if any of these:
- **Any item in Section 0 (Isolation & Architecture) fails**
- Any item in Section 1 (Secrets) fails
- Any item in Section 2 (Code Execution) fails
- Items 3.3 (Path traversal) or 3.5 (Home overwrite) fail

---

## Red Flags

Stop and reconsider if your skill:

| Red Flag | Risk | Severity |
|----------|------|----------|
| References other skills | Isolation violation | Critical |
| Uses agents from unknown sources | Isolation violation | Critical |
| Executes arbitrary shell commands from user input | Command injection | Critical |
| Downloads and runs external scripts | Malware execution | Critical |
| Uses `eval()` or `exec()` on user input | Code injection | Critical |
| Accesses files outside project directory | Data exfiltration | High |
| Sends data to external servers | Privacy violation | High |
| Requires excessive permissions | Privilege escalation | High |
| Ignores SSL certificate errors | Man-in-the-middle | High |
| Logs sensitive information | Data exposure | Medium |

---

## Review Questions

Before signing off, ask yourself:

1. **Would I run this skill on my personal machine with sensitive data?**

2. **Could a malicious user exploit this skill to cause harm?**

3. **Are there any "escape hatches" that bypass intended restrictions?**

4. **Is all sensitive information (mine and users') protected?**

5. **What's the worst case if this skill is misused?**

---

## Tool Permissions Audit

Document which tools the skill uses and why:

| Tool | Used For | Necessary? | Risk |
|------|----------|------------|------|
| Read | | Yes/No | Low |
| Write | | Yes/No | Medium |
| Edit | | Yes/No | Medium |
| Bash | | Yes/No | High |
| WebFetch | | Yes/No | Medium |
| [MCP tool] | | Yes/No | Varies |

---

## Quick Risk Score Algorithm

For rapid risk assessment, calculate: **Risk Score = Tool Risk + Permission Risk + Scope Risk**

### Tool Risk

| Tool Configuration | Score |
|-------------------|-------|
| Read, Grep, Glob only | 0 |
| + WebSearch, WebFetch | +1 |
| + Edit | +1 |
| + Write | +2 |
| + Bash | +3 |

### Permission Risk

| Permission Mode | Score |
|-----------------|-------|
| default (standard prompts) | 0 |
| acceptEdits (auto-accept edits) | +1 |
| bypassPermissions (skip all prompts) | +5 |

### Scope Risk

| Scope | Score |
|-------|-------|
| Project directory only | 0 |
| User home directory (~/) | +1 |
| System-wide access | +3 |

### Interpreting the Score

| Score | Risk Level | Action Required |
|-------|------------|-----------------|
| 0-2 | ✅ Low | Deploy normally |
| 3-4 | 📝 Medium | Document risks in skill |
| 5-7 | ⚠️ High | Require human-in-the-loop approval |
| 8+ | 🛑 Critical | Requires explicit user approval before use |

### Example Calculations

**Example 1: Read-only analyzer**
- Tools: Read, Grep, Glob (0) + WebSearch (+1) = 1
- Permission: default (0)
- Scope: project only (0)
- **Total: 1** → Low risk, deploy normally

**Example 2: Code generator with file write**
- Tools: Read, Glob (0) + Edit (+1) + Write (+2) = 3
- Permission: acceptEdits (+1)
- Scope: project only (0)
- **Total: 4** → Medium risk, document risks

**Example 3: System utility with Bash**
- Tools: Read (0) + Bash (+3) = 3
- Permission: bypassPermissions (+5)
- Scope: system-wide (+3)
- **Total: 11** → Critical risk, requires explicit approval

---
