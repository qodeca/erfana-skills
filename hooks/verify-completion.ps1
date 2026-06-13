# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Stop hook (Windows sibling of verify-completion.sh): nudge the agent back to
# verification when it claims success without citing evidence. Faithful 1:1
# port of the bash version.
#
# Emits {"decision":"block"} on stdout (Stop-hook protocol) to ask the agent
# to keep working; exit 0 always. stop_hook_active is honoured to break
# infinite loops. Fenced code blocks and blockquotes are stripped before
# matching so quoted test output does not register as the agent's own claim.

$ErrorActionPreference = 'Stop'

try {
    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { exit 0 }
    $obj = $raw | ConvertFrom-Json
} catch {
    exit 0
}

if ([string]$obj.stop_hook_active -eq 'True') { exit 0 }

$lastMsg = [string]$obj.last_assistant_message
if ([string]::IsNullOrEmpty($lastMsg)) { exit 0 }

# Strip fenced code blocks and blockquotes before matching. If the message has
# an odd number of opening fences (an unclosed code block), fall back to the
# raw body so success claims after the unclosed fence are still seen.
$lines = $lastMsg -split "`r?`n"
$fenceCount = ($lines | Where-Object { $_ -match '^```' }).Count
if ($fenceCount % 2 -ne 0) {
    $scrubbed = $lastMsg
} else {
    $sb = New-Object System.Text.StringBuilder
    $inFence = $false
    foreach ($line in $lines) {
        if ($line -match '^```') { $inFence = -not $inFence; continue }
        if ($inFence) { continue }
        if ($line -match '^>') { continue }
        [void]$sb.AppendLine($line)
    }
    $scrubbed = $sb.ToString()
}

# Allowlist: status/explain command templates emit a sentinel comment and are
# treated as structured reports, not generic completion claims (Gate 16).
if ($scrubbed.Contains('<!-- erfana:status-template -->')) { exit 0 }
if ($scrubbed.Contains('<!-- erfana:explain-template -->')) { exit 0 }

$hasSuccessClaim = $false
$hasVerification = $false

# --- Success-claim phrases (case-insensitive, mirrors grep -iE) ---
if ($scrubbed -match '(all (tests|checks) pass|successfully (implemented|completed|fixed)|everything works|the (fix|change|implementation) is (done|complete)|ready (to commit|to ship|for review|for merge|for production))') { $hasSuccessClaim = $true }
if ($scrubbed -match '\b(all|we''?re|that''?s)\s+done\b') { $hasSuccessClaim = $true }
if ($scrubbed -match '\blooks?\s+good\b|\bLGTM\b') { $hasSuccessClaim = $true }
if ($scrubbed -match '\bworks?\s+as\s+(expected|intended)\b') { $hasSuccessClaim = $true }
if ($scrubbed -match '\bshould\s+(work|be\s+working)\b') { $hasSuccessClaim = $true }
if ($scrubbed -match '\b(implementation|feature|migration|refactor)\s+(is\s+)?complete\b') { $hasSuccessClaim = $true }
if ($scrubbed -match '\bno\s+(issues|errors|problems)\b') { $hasSuccessClaim = $true }
if ($scrubbed -match '\b(task|objective)\s+(accomplished|met|achieved)\b') { $hasSuccessClaim = $true }

# --- Verification-evidence phrases (case-insensitive, mirrors grep -iE) ---
if ($scrubbed -match '(test.*pass|lint.*pass|typecheck.*pass|\bverified\b|ran.*test|screenshot|confirmed.*works|output shows|gates? \d+(-\d+)? pass|gates? pass)') { $hasVerification = $true }
if ($scrubbed -match '\bexit\s+code\s+0\b|\bexit\s+0\b') { $hasVerification = $true }
if ($scrubbed -match '\b(playwright|vitest|jest|pytest|rspec|mocha|cypress|deno test|cargo test|go test)\b.*\b(pass|green|ok)\b') { $hasVerification = $true }
if ($scrubbed -match '\bclaude\s+plugin\s+validate\b.*\b(pass|valid|success)\b') { $hasVerification = $true }
if ($scrubbed -match '\brun-all-gates\.sh\b|\bALL\s+GATES\s+PASSED\b') { $hasVerification = $true }

if ($hasSuccessClaim -and -not $hasVerification) {
    Write-Output '{"decision":"block","reason":"Success claim without verification evidence. Per project conventions, never assert completion without citing executed tests, lint, typecheck, screenshots, gate output, exit code, or comparable proof. Run the verification commands and quote their result before stopping."}'
    exit 0
}

exit 0
