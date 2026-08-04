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

**Classify, do not silence.** A bare exit-code check over-fails here: `npm audit` (and most auditors) exit non-zero on **any** severity, including low. Read the auditor's machine-readable output and bucket findings by severity instead of gating on the exit code. Node example – adapt the parse to whichever auditor the stack detection resolved:

```bash
# Node example. HIGH+CRITICAL block QG-7; MODERATE/LOW are recorded, non-blocking.
audit_json=$(npm audit --json 2>/dev/null || true)
blocking=$(printf '%s' "$audit_json" | jq '[.metadata.vulnerabilities.high, .metadata.vulnerabilities.critical] | add // 0')
reported=$(printf '%s' "$audit_json" | jq '[.metadata.vulnerabilities.moderate, .metadata.vulnerabilities.low] | add // 0')
if [ "${blocking:-0}" -gt 0 ]; then
  echo "QG-7 FAIL: $blocking high/critical dependency vulnerabilities"
fi
echo "Reported (non-blocking): $reported moderate/low"
```

If the auditor's output cannot be parsed (no `jq`, unknown format), fall back to reading its human-readable severity summary – **never** to treating the raw exit code as the verdict, and never to skipping the step.

**Action by severity:**
| Severity | QG-7 effect | Action |
|----------|-------------|--------|
| Critical | **Blocking** | STOP - Must fix before proceeding |
| High | **Blocking** | STOP - Must fix before proceeding |
| Moderate | Non-blocking, reported | Document, fix if possible |
| Low | Non-blocking, reported | Document, may defer |

QG-7 remains **Mandatory on all tiers and non-overridable**; this change narrows what counts as a failure, not who may waive it.

### Step 2: Secret Detection (fail-closed, all text types)

This is a deterministic, machine-checkable gate – **any match fails QG-7**, regardless of the agent's judgement. Scan the changeset (or working tree) across **all** text file types, not just `.ts/.tsx`, using the same pattern set as `hooks/secret-detector.sh` (AWS, OpenAI/Stripe/Anthropic, GitHub/GitLab, Hugging Face, Slack, npm, Google, Azure/DB connection strings, PEM private keys, JWTs, and generic `API_KEY=`/`PASSWORD=` assignments). Exclude `.git/`, dependency dirs (`node_modules/`, `vendor/`, `dist/`, `build/`), and lockfiles.

**Scan the working tree, not a commit range.** Phase 7 runs seven phases before the only `git commit` in the operation, so `git diff --name-only <base>...HEAD` returns nothing here and `xargs` would scan **no files at all** – the scan would report clean on every run, which is the worst possible failure for a fail-closed gate ([../operations/implement.md](../operations/implement.md) – "The change set before the commit exists").

```bash
# Fail-closed: prints any hit and exits non-zero (-> QG-7 FAIL) when a secret is found.
# `-r` keeps xargs from running grep with no files (which would scan stdin and hang).
secret_hits=$({ git diff --name-only; git diff --cached --name-only;
                git ls-files --others --exclude-standard; } 2>/dev/null | sort -u \
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
  echo "QG-7 FAIL: potential secret(s) detected:"; echo "$secret_hits"; exit 1
fi
```

**An empty file list is a failure, not a clean scan.** Phase 7 runs after implementation, so a change set of zero files means the list was resolved wrongly, not that the run wrote no code. Check it before trusting the result: if the `sort -u` above prints nothing, report `QG-7 FAIL: empty change set - the secret scan examined no files` and stop rather than record a pass.

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
| Dependency Audit Results | Report from the stack-detected auditor (Step 1) split into blocking (high/critical) and reported (moderate/low) findings, or "no dependency auditor available" |
| Secret Scan Results | Any secrets found |
| Static Analysis | Code pattern findings |
| OWASP Checklist | Verification results (T2) |
| Task List Advance | Phase 7 and `QG-7 quality gate` marked `completed`; Phase 8 `in_progress` with `QG-8 quality gate` appended – see [../reference/progress-tracking.md](../reference/progress-tracking.md) |

---

## POST-STEP VALIDATION

**ALL must be checked before proceeding to Phase 8.**

- [ ] Detected dependency auditor reports no high/critical vulnerabilities (or none available); moderate/low findings recorded as non-blocking
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
| Dependency audit | No high/critical | No high/critical | high+critical count from the auditor's parsed output = 0 (or skipped if no auditor); moderate/low recorded, non-blocking |
| Secrets scan | No matches | No matches | **Step 2 scan returns empty (exit-code gate)** |
| Input validation | Basic check | Full verification | agent review |
| OWASP check | N/A | All items verified | agent review |
| Task list advanced | Required | Required | `QG-7 quality gate` and `Phase 7: Security` `completed`, `Phase 8: Quality Review` `in_progress`, `QG-8 quality gate` appended as `pending` |
| Can be overridden | **NO** | **NO** | — |

### Security Checklist

**Basic (ALL Tiers):**
- [ ] Detected dependency auditor reports 0 high/critical (moderate/low recorded, non-blocking)
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

**Moderate/low vulnerabilities (reported, non-blocking):**
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

**Task list:** on PASS, mark `QG-7 quality gate` then `Phase 7: Security` `completed`, set `Phase 8: Quality Review` `in_progress`, and append `QG-8 quality gate` as `pending` ([progress-tracking](../reference/progress-tracking.md)).

**Run state:** record `QG-7=PASS`, refresh `head_sha` / `updated_at` / the task-list snapshot, and PATCH the run-state comment ([post-review-tracking](../reference/post-review-tracking.md) – "Updating in place"). A failed write never fails the gate.

**STOP if QG-7 ≠ PASS. Do not proceed. Security is mandatory.**
