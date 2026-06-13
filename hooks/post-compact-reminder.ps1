# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# PostCompact hook (Windows sibling of post-compact-reminder.sh): re-inject
# load-bearing facts after the context window has been compacted. Keep the
# payload terse, ordered, plain text -- over-injection re-triggers compaction.

$ErrorActionPreference = 'Continue'

# Collect dynamic state (best-effort; failures are silent).
$branch = (& git rev-parse --abbrev-ref HEAD 2>$null)
if ([string]::IsNullOrWhiteSpace($branch)) { $branch = '(not a git repo)' }
$gitStatus = ((& git status -sb 2>$null) | Select-Object -First 3) -join "`n"

$out = @"
CRITICAL REMINDERS AFTER CONTEXT COMPACTION:

1. Re-establish temporal awareness: call mcp__time__get_current_time before
   any time-sensitive task (web search, deadline math, recency checks).
2. Honesty discipline: "I don't know" and "I need to verify this" are valid.
   Never claim code works without executing tests or verification commands.
   Wrong is worse than blank.
3. Verification before completion: tests, lint, typecheck, screenshots, gate
   output, or exit codes must be cited before declaring a task done.
4. Delegation: review available agents (Task tool subagent types) and MCP
   servers. Hand off complex multi-step work to save context window space.
5. Verify recall: if memory or earlier conversation says a file or function
   exists, confirm with Read or grep before recommending it.

CURRENT GIT STATE:
- Branch: $branch
"@

if (-not [string]::IsNullOrWhiteSpace($gitStatus)) {
    $out += "`n- Status:`n$gitStatus"
}

Write-Output $out
