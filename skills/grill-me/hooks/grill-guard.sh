#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Skill-scoped Stop hook for erfana:grill-me. Declared in the skill's
# frontmatter (hooks: Stop:), so it runs only while the skill is active.
#
# Protocol: while the interview is open, the skill ends every message with
# the open marker; the wrap-up message simply omits it. This hook blocks a
# stop whose last assistant message still carries the marker END-ANCHORED
# (in the trailing lines after balanced code fences are stripped), which
# yields exactly one forced continuation per stop attempt - stop_hook_active
# short-circuits the retry, so this is a nudge, not a lock. Documents that
# merely quote the marker mid-prose or inside a balanced fence never match.
#
# Stop-hook protocol: exit 0 always; a block is signalled via stdout JSON.

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

# Strip balanced fenced code blocks so a fenced example of the marker never
# matches. An unclosed trailing fence falls back to the raw body (mirrors
# verify-completion.sh): a genuine marker after an odd fence still blocks.
FENCE_COUNT=$(printf '%s\n' "$LAST_MSG" | grep -c '^```' || true)
if [ $((FENCE_COUNT % 2)) -ne 0 ]; then
  SCRUBBED="$LAST_MSG"
else
  SCRUBBED=$(echo "$LAST_MSG" | awk '
    BEGIN { in_fence = 0 }
    /^```/ { in_fence = 1 - in_fence; next }
    in_fence == 1 { next }
    { print }
  ')
fi

# End-anchored: the marker counts only in the last 3 non-empty lines.
TAIL=$(printf '%s\n' "$SCRUBBED" | awk 'NF' | tail -n 3)

if echo "$TAIL" | grep -qF '<!-- erfana:grill-open -->'; then
  cat <<'JSON'
{"decision":"block","reason":"The grill interview's coverage map is not closed; the interview protocol expects continued questioning or a user-confirmed read-back (a wrap-up message without the open marker)."}
JSON
  exit 0
fi

exit 0
