#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Stop hook: nudge the agent back to verification when it claims success
# without citing evidence.
#
# Returns exit 0 with `{"decision":"block"}` to ask the agent to keep
# working (Stop hook protocol). Hard exit 2 is reserved for PreToolUse.
# stop_hook_active is honoured to break infinite-loop scenarios when
# the agent has already retried once.
#
# False-negative coverage informed by Anthropic Stop-hook docs (Apr 2026)
# and the Superpowers verification-before-completion skill. Code blocks
# and quoted strings are stripped before regex matching to lower the
# false-positive rate when the agent quotes test output rather than
# claiming success itself.

set -euo pipefail

INPUT=$(cat)

STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null || echo "false")
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

LAST_MSG=$(echo "$INPUT" | jq -r '.last_assistant_message // empty' 2>/dev/null || true)

if [ -z "$LAST_MSG" ]; then
  exit 0
fi

# Strip fenced code blocks and indented blockquotes before matching, so
# quoted test output ("expected: tests pass") does not register as the
# agent's own claim. If the message has an odd number of opening fences
# (an unclosed code block), the AWK strip would silently swallow everything
# after the unclosed fence – including success claims. In that case fall
# back to the raw body so the heuristics still see the full text.
FENCE_COUNT=$(printf '%s\n' "$LAST_MSG" | grep -c '^```' || true)
if [ $((FENCE_COUNT % 2)) -ne 0 ]; then
  SCRUBBED="$LAST_MSG"
else
  SCRUBBED=$(echo "$LAST_MSG" | awk '
    BEGIN { in_fence = 0 }
    /^```/ { in_fence = 1 - in_fence; next }
    in_fence == 1 { next }
    /^>/ { next }
    { print }
  ')
fi

# Allowlist: two slash-command families emit a unique sentinel comment at the
# end of their output template, and the hook treats those messages as
# structured reports rather than generic completion claims:
#
#   - `*-status` family (project-status, session-status) → erfana:status-template
#   - `explain-*` family (explain-issue, future explain-pr) → erfana:explain-template
#
# Both sentinels are invisible in rendered markdown but visible to the hook;
# the literal strings must match exactly in every command file and this hook
# (Gate 16 enforces symmetry across all three command files plus this hook
# to prevent silent drift).
if echo "$SCRUBBED" | grep -qF '<!-- erfana:status-template -->'; then
  exit 0
fi
if echo "$SCRUBBED" | grep -qF '<!-- erfana:explain-template -->'; then
  exit 0
fi

HAS_SUCCESS_CLAIM=false
HAS_VERIFICATION=false

# --- Success-claim phrases (expanded for false-negative coverage) ---
if echo "$SCRUBBED" | grep -qiE '(all (tests|checks) pass|successfully (implemented|completed|fixed)|everything works|the (fix|change|implementation) is (done|complete)|ready (to commit|to ship|for review|for merge|for production))'; then
  HAS_SUCCESS_CLAIM=true
fi
if echo "$SCRUBBED" | grep -qiE '\b(all|we'"'"'?re|that'"'"'?s)\s+done\b'; then
  HAS_SUCCESS_CLAIM=true
fi
if echo "$SCRUBBED" | grep -qiE '\blooks?\s+good\b|\bLGTM\b'; then
  HAS_SUCCESS_CLAIM=true
fi
if echo "$SCRUBBED" | grep -qiE '\bworks?\s+as\s+(expected|intended)\b'; then
  HAS_SUCCESS_CLAIM=true
fi
if echo "$SCRUBBED" | grep -qiE '\bshould\s+(work|be\s+working)\b'; then
  HAS_SUCCESS_CLAIM=true
fi
if echo "$SCRUBBED" | grep -qiE '\b(implementation|feature|migration|refactor)\s+(is\s+)?complete\b'; then
  HAS_SUCCESS_CLAIM=true
fi
if echo "$SCRUBBED" | grep -qiE '\bno\s+(issues|errors|problems)\b'; then
  HAS_SUCCESS_CLAIM=true
fi
if echo "$SCRUBBED" | grep -qiE '\b(task|objective)\s+(accomplished|met|achieved)\b'; then
  HAS_SUCCESS_CLAIM=true
fi

# --- Verification-evidence phrases (expanded so real verification unblocks) ---
# Word boundary on \bverified\b prevents "unverified" / "unverifiable" / etc.
# from falsely satisfying the verification check.
if echo "$SCRUBBED" | grep -qiE '(test.*pass|lint.*pass|typecheck.*pass|\bverified\b|ran.*test|screenshot|confirmed.*works|output shows|gates? \d+(-\d+)? pass|gates? pass)'; then
  HAS_VERIFICATION=true
fi
if echo "$SCRUBBED" | grep -qiE '\bexit\s+code\s+0\b|\bexit\s+0\b'; then
  HAS_VERIFICATION=true
fi
if echo "$SCRUBBED" | grep -qiE '\b(playwright|vitest|jest|pytest|rspec|mocha|cypress|deno test|cargo test|go test)\b.*\b(pass|green|ok)\b'; then
  HAS_VERIFICATION=true
fi
if echo "$SCRUBBED" | grep -qiE '\bclaude\s+plugin\s+validate\b.*\b(pass|valid|success)\b'; then
  HAS_VERIFICATION=true
fi
if echo "$SCRUBBED" | grep -qiE '\brun-all-gates\.sh\b|\bALL\s+GATES\s+PASSED\b'; then
  HAS_VERIFICATION=true
fi

if [ "$HAS_SUCCESS_CLAIM" = "true" ] && [ "$HAS_VERIFICATION" = "false" ]; then
  cat <<'JSON'
{"decision":"block","reason":"Success claim without verification evidence. Per project conventions, never assert completion without citing executed tests, lint, typecheck, screenshots, gate output, exit code, or comparable proof. Run the verification commands and quote their result before stopping."}
JSON
  exit 0
fi

exit 0
