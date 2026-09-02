#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Plugin-root Stop hook backing erfana:grill-me. Registered in
# hooks/hooks.json rather than in the skill's frontmatter, because Qwen Code's
# extension skill parser does not extract hooks: and a skill-scoped
# registration would be dead on one of the two supported hosts. It therefore
# evaluates EVERY stop, in every session; the open marker - not the
# registration - is what scopes it to a live interview.
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
#
# Fences are recognised with up to three leading spaces and in both CommonMark
# flavours (backtick and tilde), because a marker quoted inside a list item is
# indented and a marker inside a ~~~ block is not a backtick fence at all -
# anchoring on a bare ^``` blocked both. The two flavours are counted as one
# family, which is an approximation CommonMark does not make; over-stripping
# only costs a missed block on a message that mixes them, while under-stripping
# blocks a stop on prose that merely quotes the marker.
FENCE_COUNT=$(printf '%s\n' "$LAST_MSG" | grep -cE '^ ?[ ]?[ ]?(```|~~~)' || true)
if [ $((FENCE_COUNT % 2)) -ne 0 ]; then
  SCRUBBED="$LAST_MSG"
else
  SCRUBBED=$(echo "$LAST_MSG" | awk '
    BEGIN { in_fence = 0 }
    /^ ?[ ]?[ ]?(```|~~~)/ { in_fence = 1 - in_fence; next }
    in_fence == 1 { next }
    { print }
  ')
fi

# Drop inline code spans. The block reason below literally tells the model to
# "remove the trailing <!-- erfana:grill-open --> marker", so a model that
# complies and says so in backticks would re-trigger this guard on its own
# report. A backticked mention is prose about the marker, not an open marker.
SCRUBBED=$(printf '%s\n' "$SCRUBBED" | sed 's/`[^`]*`//g')

# End-anchored: the marker counts only in the last 3 non-empty lines.
TAIL=$(printf '%s\n' "$SCRUBBED" | awk 'NF' | tail -n 3)

if echo "$TAIL" | grep -qF '<!-- erfana:grill-open -->'; then
  cat <<'JSON'
{"decision":"block","reason":"An erfana grill-interview marker is still open on the last message. If an interview is running, the coverage map is not closed - continue questioning or finish with a user-confirmed read-back. If you are not in an interview, remove the trailing <!-- erfana:grill-open --> marker and stop again."}
JSON
  exit 0
fi

exit 0
