#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Gate 16 — verify-completion hook fixtures + sentinel symmetry.
#
# Two responsibilities:
#   1. For each tests/hooks/verify-completion/*.json fixture, pipe it through
#      hooks/verify-completion.sh and assert whether stdout carries the
#      `{"decision":"block"...}` payload (the Stop-hook block signal).
#      Exit code is always 0 per the Stop-hook protocol — the block decision
#      is communicated via stdout JSON, not exit status — so the gate
#      asserts on stdout shape rather than exit code.
#   2. Sentinel symmetry across two sentinel families:
#        - `<!-- erfana:status-template -->` must appear in
#          commands/project-status.md, commands/session-status.md, and
#          hooks/verify-completion.sh.
#        - `<!-- erfana:explain-template -->` must appear in
#          commands/explain-issue.md and hooks/verify-completion.sh.
#      If any one is missing, the allowlist would silently break and the
#      corresponding clean-data report would block.
#
# Standalone runner — invoked by scripts/run-all-gates.sh; can also be
# run directly while iterating on hook or fixture changes.

set -euo pipefail

cd "$(dirname "$0")/.."

# Fixtures run through the cross-platform launcher so Gate 16 exercises the
# implementation that actually executes on the current OS: verify-completion.sh
# on macOS/Linux, verify-completion.ps1 on Windows. This keeps the .ps1 sibling
# honest against the same behavioural fixtures as the .sh.
DISPATCH="hooks/dispatch.sh"
HOOK_NAME="verify-completion"
FIXTURE_DIR="tests/hooks/verify-completion"
STATUS_SENTINEL='<!-- erfana:status-template -->'
EXPLAIN_SENTINEL='<!-- erfana:explain-template -->'

if [ ! -x "$DISPATCH" ]; then
  echo "  FAIL: $DISPATCH is missing or not executable"
  exit 1
fi
for impl in "hooks/${HOOK_NAME}.sh" "hooks/${HOOK_NAME}.ps1"; do
  if [ ! -f "$impl" ]; then
    echo "  FAIL: $impl is missing (cross-platform sibling required)"
    exit 1
  fi
done
if [ ! -d "$FIXTURE_DIR" ]; then
  echo "  FAIL: $FIXTURE_DIR is missing"
  exit 1
fi

# --- 1. Fixture replays ---------------------------------------------------
# Format: name|expect|description
#   expect = "block" if stdout must contain {"decision":"block"...
#          = "pass"  if stdout must be empty (hook did not block)
declare -a CASES=(
  "status-with-sentinel|pass|status report carrying the sentinel passes through"
  "status-without-sentinel|pass|status body following the prose rule has no triggers and passes"
  "explain-with-sentinel|pass|explain-issue brief carrying the explain-template sentinel passes through"
  "paraphrased-template-bypass|block|three labels mid-prose + ready-to-ship without sentinel must block"
  "unverified-success|block|implementation-complete + ready-to-ship without verification must block"
  "verified-success|pass|implementation-complete + ALL GATES PASSED is verified and passes"
  "bare-no-issues|block|bare 'no issues.' is a success claim and must block"
  "inventory-no-issues|block|inventory 'no issues currently assigned' must still block (exemption removed in v4.2.9)"
  "unclosed-fence|block|odd-count code fence cannot hide a success claim (fallback path)"
  "stop-hook-active|pass|stop_hook_active true skips the check unconditionally"
)

failures=0
for case_line in "${CASES[@]}"; do
  IFS='|' read -r name expect desc <<< "$case_line"
  fixture="$FIXTURE_DIR/$name.json"
  if [ ! -f "$fixture" ]; then
    echo "  FAIL: missing fixture: $fixture"
    failures=$((failures + 1))
    continue
  fi

  # Hook always exits 0; we assert on stdout shape.
  out=$(bash "$DISPATCH" "$HOOK_NAME" < "$fixture")

  has_block=no
  if echo "$out" | grep -q '"decision":"block"'; then
    has_block=yes
  fi

  case "$expect" in
    block)
      if [ "$has_block" = "yes" ]; then
        echo "  PASS: $name → block (as expected): $desc"
      else
        echo "  FAIL: $name → expected block but stdout was empty: $desc"
        failures=$((failures + 1))
      fi
      ;;
    pass)
      if [ "$has_block" = "no" ]; then
        echo "  PASS: $name → pass (as expected): $desc"
      else
        echo "  FAIL: $name → expected pass but stdout had block JSON: $desc"
        failures=$((failures + 1))
      fi
      ;;
    *)
      echo "  FAIL: $name has unknown expected outcome '$expect'"
      failures=$((failures + 1))
      ;;
  esac
done

# --- 2. Sentinel symmetry -------------------------------------------------
# Status family: project-status, session-status, and the hook.
STATUS_SENTINEL_FILES=(
  "commands/project-status.md"
  "commands/session-status.md"
  "hooks/verify-completion.sh"
  "hooks/verify-completion.ps1"
)
# Explain family: explain-issue (and any future explain-* sibling), and the hook
# (both the Unix and Windows implementations must carry the sentinel).
EXPLAIN_SENTINEL_FILES=(
  "commands/explain-issue.md"
  "hooks/verify-completion.sh"
  "hooks/verify-completion.ps1"
)

check_sentinel() {
  local sentinel="$1"; shift
  local family="$1"; shift
  local files=("$@")
  for f in "${files[@]}"; do
    if [ ! -f "$f" ]; then
      echo "  FAIL: $family sentinel symmetry – file missing: $f"
      failures=$((failures + 1))
      continue
    fi
    if ! grep -qF "$sentinel" "$f"; then
      echo "  FAIL: $family sentinel '$sentinel' not found in $f"
      failures=$((failures + 1))
      continue
    fi
    echo "  PASS: $family sentinel present in $f"
  done
}

check_sentinel "$STATUS_SENTINEL" "status"  "${STATUS_SENTINEL_FILES[@]}"
check_sentinel "$EXPLAIN_SENTINEL" "explain" "${EXPLAIN_SENTINEL_FILES[@]}"

SENTINEL_CHECK_COUNT=$((${#STATUS_SENTINEL_FILES[@]} + ${#EXPLAIN_SENTINEL_FILES[@]}))

if [ $failures -ne 0 ]; then
  echo "  FAIL: $failures failure(s) total"
  exit 1
fi
echo "  PASS: ${#CASES[@]} fixture(s) + $SENTINEL_CHECK_COUNT sentinel symmetry check(s)"
