#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# PostCompact hook: re-inject load-bearing facts after the context
# window has been compacted. Compaction loses awareness of rules and
# state that lived in the early turns; this restores the few that
# matter regardless of project.
#
# Best-practice from PostCompact community references (Pixelmojo,
# disler/claude-code-hooks-mastery): inject pointers and current state,
# not full document contents – over-injection re-triggers compaction.
# Keep payload terse, ordered, plain text.

set -euo pipefail

# Collect dynamic state (best-effort; failures are silent).
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "(not a git repo)")
GIT_STATUS=$(git status -sb 2>/dev/null | head -3 || true)

cat << EOF
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
- Branch: ${BRANCH}
${GIT_STATUS:+- Status:
${GIT_STATUS}}
EOF
