# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# PreToolUse hook (Windows sibling of secret-detector.sh): detect hardcoded
# secrets in Write/Edit/MultiEdit content. Faithful 1:1 port of the bash
# version's pattern set.
#
# -cmatch is case-SENSITIVE (mirrors `grep -E`); -match is case-INSENSITIVE
# (mirrors `grep -iE`). Exit 2 blocks the write; exit 0 allows it. Test
# files, fixtures, examples, markdown, and hook scripts are skipped.

$ErrorActionPreference = 'Stop'

function Block([string]$message) {
    [Console]::Error.WriteLine($message)
    exit 2
}

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $obj = $raw | ConvertFrom-Json
} catch {
    exit 0
}

$tool = [string]$obj.tool_name
$content = ''
switch ($tool) {
    'Write'     { $content = [string]$obj.tool_input.content }
    'Edit'      { $content = [string]$obj.tool_input.new_string }
    'MultiEdit' { $content = (@($obj.tool_input.edits | ForEach-Object { [string]$_.new_string }) -join "`n") }
    default     { exit 0 }
}

if ([string]::IsNullOrEmpty($content)) { exit 0 }

# Skip test files, fixtures, mocks, examples, samples, markdown docs.
$filePath = [string]$obj.tool_input.file_path
$normPath = $filePath -replace '\\', '/'   # normalise Windows separators
$baseName = if ($normPath) { Split-Path -Leaf $normPath } else { '' }
if ($baseName -match '(test|spec|fixture|mock|example|sample|\.md$)') { exit 0 }

# Skip hook scripts themselves (they reference these patterns by name).
if ($normPath -cmatch '/hooks/[^/]+\.(sh|py|js|mjs|ts|ps1)$') { exit 0 }

# --- Cloud and SaaS provider keys ---

if ($content -cmatch 'AKIA[0-9A-Z]{16}') {
    Block 'BLOCKED: AWS access key detected (AKIA...)'
}
if ($content -cmatch '(API_KEY|API_SECRET|SECRET_KEY|ACCESS_TOKEN|AUTH_TOKEN|PRIVATE_KEY)\s*[=:]\s*["''][A-Za-z0-9_/.+-]{20,}') {
    Block 'BLOCKED: Hardcoded secret detected (API key/token pattern)'
}
if ($content -cmatch '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]{20,})') {
    Block 'BLOCKED: API key detected (OpenAI/Stripe live pattern)'
}
if ($content -cmatch 'sk-ant-(api|admin|sid)\d{2}-[A-Za-z0-9_-]{32,}') {
    Block 'BLOCKED: Anthropic API/admin/session key detected'
}
if ($content -cmatch '(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}|gho_[a-zA-Z0-9]{36}|ghs_[a-zA-Z0-9]{36}|ghu_[a-zA-Z0-9]{36})') {
    Block 'BLOCKED: GitHub token detected'
}
if ($content -cmatch 'glpat-[0-9A-Za-z_-]{20,}') {
    Block 'BLOCKED: GitLab personal access token detected'
}
if ($content -cmatch 'hf_[A-Za-z]{34}\b') {
    Block 'BLOCKED: Hugging Face user token detected'
}
if ($content -cmatch 'api_org_[A-Za-z]{34}\b') {
    Block 'BLOCKED: Hugging Face organization token detected'
}
if ($content -cmatch 'sntryu_[a-f0-9]{64}\b') {
    Block 'BLOCKED: Sentry user auth token detected'
}
if ($content -cmatch 'PMAK-[a-fA-F0-9]{24}-[a-fA-F0-9]{34}') {
    Block 'BLOCKED: Postman API key detected'
}
if ($content -cmatch '-----BEGIN[ A-Z]*PRIVATE KEY-----') {
    Block 'BLOCKED: PEM private key detected'
}

# Generic password assignment with hardcoded value (negative-guarded).
if ($content -cmatch 'PASSWORD\s*[=:]\s*["''][A-Za-z0-9!@#$%^&*]{8,}["'']') {
    if (-not ($content -cmatch 'PASSWORD.*(process\.env|os\.environ|\$\{|your.password|changeme|placeholder|<password>|REDACTED)')) {
        Block 'BLOCKED: Hardcoded password detected; use environment variables instead'
    }
}

if ($content -cmatch 'xox[bpas]-[0-9a-zA-Z-]{10,}') {
    Block 'BLOCKED: Slack token detected'
}
if ($content -cmatch 'https://hooks\.slack\.com/services/T[A-Z0-9]+/B[A-Z0-9]+/[a-zA-Z0-9]{20,}') {
    Block 'BLOCKED: Slack webhook URL detected'
}
if ($content -cmatch 'npm_[a-zA-Z0-9]{36}') {
    Block 'BLOCKED: npm token detected'
}
if ($content -cmatch 'rk_live_[a-zA-Z0-9]{20,}') {
    Block 'BLOCKED: Stripe restricted key detected'
}
if ($content -cmatch 'AIza[0-9A-Za-z_-]{35}') {
    Block 'BLOCKED: Google API key detected'
}

# Azure storage / SAS connection strings (case-insensitive, mirrors grep -iE).
if ($content -match 'DefaultEndpointsProtocol=https?;AccountName=[^;]+;AccountKey=[A-Za-z0-9+/=]{40,}') {
    Block 'BLOCKED: Azure storage connection string with embedded key detected'
}

# Database connection strings with embedded credentials (negative-guarded).
if ($content -cmatch '(postgres|postgresql|mysql|mongodb(\+srv)?|redis)://[^:/?]+:[^@/]+@') {
    if (-not ($content -cmatch '://(user|username|root):(\$\{|password|changeme|<)')) {
        Block 'BLOCKED: Database connection string with embedded credentials detected'
    }
}

if ($content -cmatch 'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}') {
    Block 'BLOCKED: JWT-shaped token detected; do not commit signed tokens'
}

exit 0
