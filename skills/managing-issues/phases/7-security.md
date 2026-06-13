# Phase 7: Security Scan

**Goal:** Catch security issues early (shift-left security).
**Agent:** `security-auditor`
**Quality Gate:** QG-7 (Mandatory - NEVER skippable)

---

## INPUT CONDITIONS

**STOP if ANY condition is unchecked. Do not proceed.**

- [ ] QG-6 = PASS (Architectural Review completed)
- [ ] All tests passing
- [ ] Typecheck passing
- [ ] Implementation complete

---

## PRE-STEP VALIDATION

VERIFY: QG-6 = PASS. STOP if architectural review not complete. **This phase is MANDATORY – NEVER skip.**

---

## EXECUTION

### Step 1: Dependency Vulnerability Scan (stack-detected)

Run the audit tool the project actually uses, not a hardcoded `npm audit`:

| Stack | Audit command |
|---|---|
| Node (`package.json`) | `npm audit` (or `pnpm audit` / `yarn npm audit`) |
| Python | `pip-audit` if available |
| Go | `govulncheck ./...` if available |
| Rust | `cargo audit` if available |
| none detected | skip; record "no dependency auditor available" |

**Action by severity:**
| Severity | Action |
|----------|--------|
| Critical | STOP - Must fix before proceeding |
| High | STOP - Must fix before proceeding |
| Medium | Document, fix if possible |
| Low | Document, may defer |

### Step 2: Secret Detection (fail-closed, all text types)

This is a deterministic, machine-checkable gate – **any match fails QG-7**, regardless of the agent's judgement. Scan the changeset (or working tree) across **all** text file types, not just `.ts/.tsx`, using the same pattern set as `hooks/secret-detector.sh` (AWS, OpenAI/Stripe/Anthropic, GitHub/GitLab, Hugging Face, Slack, npm, Google, Azure/DB connection strings, PEM private keys, JWTs, and generic `API_KEY=`/`PASSWORD=` assignments). Exclude `.git/`, dependency dirs (`node_modules/`, `vendor/`, `dist/`, `build/`), and lockfiles.

```bash
# Fail-closed: prints any hit and exits non-zero (-> QG-7 FAIL) when a secret is found.
secret_hits=$(git diff --name-only "$BASE_BRANCH"...HEAD 2>/dev/null \
  | xargs -r grep -InEH \
      -e 'AKIA[0-9A-Z]{16}' \
      -e '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]{20,}|rk_live_[a-zA-Z0-9]{20,})' \
      -e 'sk-ant-(api|admin|sid)[0-9]{2}-[A-Za-z0-9_-]{32,}' \
      -e '(ghp_|gho_|ghs_|ghu_)[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}|glpat-[0-9A-Za-z_-]{20,}' \
      -e 'hf_[A-Za-z]{34}|api_org_[A-Za-z]{34}|npm_[a-zA-Z0-9]{36}|xox[bpas]-[0-9a-zA-Z-]{10,}|AIza[0-9A-Za-z_-]{35}' \
      -e -- '-----BEGIN[ A-Z]*PRIVATE KEY-----' \
      -e 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}' \
      -e '(API_KEY|API_SECRET|SECRET_KEY|ACCESS_TOKEN|AUTH_TOKEN|PRIVATE_KEY|PASSWORD)[[:space:]]*[=:][[:space:]]*["'"'"'][A-Za-z0-9_/.+-]{12,}' \
  || true)
if [ -n "$secret_hits" ]; then
  echo "QG-7 FAIL: potential secret(s) detected:"; echo "$secret_hits"
fi
```

The `security-auditor` agent then performs the deeper review (context, false-positive triage, remediation), but the gate predicate above is non-negotiable: a non-empty result is an automatic QG-7 failure.

### Step 3: Static Analysis (Tier 2)

Code patterns to check:
- [ ] Input validation completeness
- [ ] Output encoding for XSS
- [ ] Path traversal protection
- [ ] Injection vulnerabilities
- [ ] Unsafe eval/Function usage

### Step 4: OWASP Verification (Tier 2)

Verify against OWASP Top 10:
- [ ] A01: Broken Access Control
- [ ] A02: Cryptographic Failures
- [ ] A03: Injection
- [ ] A04: Insecure Design
- [ ] A05: Security Misconfiguration
- [ ] A06: Vulnerable Components
- [ ] A07: Authentication Failures
- [ ] A08: Data Integrity Failures
- [ ] A09: Logging Failures
- [ ] A10: Server-Side Request Forgery

---

## OUTPUT ARTIFACTS

| Artifact | Description |
|----------|-------------|
| npm audit Results | Dependency vulnerability report |
| Secret Scan Results | Any secrets found |
| Static Analysis | Code pattern findings |
| OWASP Checklist | Verification results (T2) |

---

## POST-STEP VALIDATION

**ALL must be checked before proceeding to Phase 8.**

- [ ] Detected dependency auditor reports no high/critical vulnerabilities (or none available)
- [ ] Secret scan (Step 2) returned no matches — **deterministic gate, fail-closed**
- [ ] No new dangerous dependencies added
- [ ] User input properly validated at entry points
- [ ] IPC handlers validate all input (Electron projects only)
- [ ] CSP not weakened (web/Electron projects only)
- [ ] OWASP verification complete (Tier 2)

---

## QUALITY GATE: QG-7

**Gate Type:** Mandatory (ALL tiers - NEVER skippable)
**Gate ID:** QG-7

### Pass Criteria

| Criterion | Tier 1 | Tier 2 | Predicate |
|-----------|--------|--------|-----------|
| Dependency audit | No high/critical | No high/critical | auditor exit code (or skipped if none) |
| Secrets scan | No matches | No matches | **Step 2 scan returns empty (exit-code gate)** |
| Input validation | Basic check | Full verification | agent review |
| OWASP check | N/A | All items verified | agent review |
| Can be overridden | **NO** | **NO** | — |

### Security Checklist

**Basic (ALL Tiers):**
- [ ] `npm audit` passes (no high/critical)
- [ ] No secrets in code
- [ ] No dangerous dependencies
- [ ] Input validation present

**Full (Tier 2):**
- [ ] Full `security-auditor` agent review
- [ ] OWASP Top 10 verification
- [ ] Path traversal protection
- [ ] IPC validation
- [ ] CSP maintained
- [ ] Dangerous protocols blocked

### Result

**QG-7 Result:** [PASS | FAIL]

### On FAIL

**Critical/High vulnerabilities:**
1. STOP immediately
2. Fix vulnerability before any other action
3. Re-run the detected dependency auditor
4. Do not proceed until resolved

**Medium vulnerabilities:**
1. Document the vulnerability
2. Fix in this PR if feasible
3. Create follow-up issue if deferring

**Secrets found:**
1. STOP immediately
2. Remove secrets
3. Rotate any exposed credentials
4. Add to .gitignore if needed
5. Re-scan

### On ESCALATE

Max 3 retries, then ESCALATE to user.

If cannot fix after 3 retries:
1. Present security findings to user
2. User must decide: [Fix | Abort]
3. **Override is NOT an option for security**

---

## NEXT PHASE

**QG-7 = PASS required to proceed to Phase 8: Quality Review**

**STOP if QG-7 ≠ PASS. Do not proceed. Security is mandatory.**
