#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Gate 16 — hook fixtures + sentinel symmetry (verify-completion +
# grill-guard + ms-grill-guard).
#
# Four responsibilities:
#   1. For each tests/hooks/verify-completion/*.json fixture, pipe it through
#      hooks/verify-completion.sh and assert whether stdout carries the
#      `{"decision":"block"...}` payload (the Stop-hook block signal).
#      Exit code is always 0 per the Stop-hook protocol — the block decision
#      is communicated via stdout JSON, not exit status — so the gate
#      asserts on stdout shape rather than exit code.
#   2. Same replay for the skill-scoped Stop hooks: grill-guard
#      (skills/grill-me/hooks/) against tests/hooks/grill-guard/*.json and
#      ms-grill-guard (skills/managing-skills/hooks/) against
#      tests/hooks/ms-grill-guard/*.json — end-anchored open-marker blocking.
#   3. Sentinel symmetry across four sentinel families:
#        - `<!-- erfana:status-template -->` must appear in
#          commands/project-status.md, commands/session-status.md, and
#          hooks/verify-completion.{sh,ps1}.
#        - `<!-- erfana:explain-template -->` must appear in
#          commands/explain-issue.md and hooks/verify-completion.{sh,ps1}.
#        - `<!-- erfana:grill-open -->` must appear in
#          skills/grill-me/SKILL.md and skills/grill-me/hooks/grill-guard.{sh,ps1}.
#        - `<!-- erfana:ms-grill-open -->` must appear in
#          skills/managing-skills/SKILL.md,
#          skills/managing-skills/references/interview-protocol.md, and
#          skills/managing-skills/hooks/ms-grill-guard.{sh,ps1}.
#      If any one is missing, the corresponding hook behaviour would silently
#      break (a clean-data report would block, or the grill backstop would
#      never fire).
#   4. Guard-drift check: ms-grill-guard.sh must equal grill-guard.sh
#      modulo header comments, the sentinel literal, and the block-reason
#      JSON — a machinery fix must never land in one family only.
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
GRILL_HOOK_NAME="../skills/grill-me/hooks/grill-guard"
GRILL_FIXTURE_DIR="tests/hooks/grill-guard"
MS_GRILL_HOOK_NAME="../skills/managing-skills/hooks/ms-grill-guard"
MS_GRILL_FIXTURE_DIR="tests/hooks/ms-grill-guard"
STATUS_SENTINEL='<!-- erfana:status-template -->'
EXPLAIN_SENTINEL='<!-- erfana:explain-template -->'
GRILL_SENTINEL='<!-- erfana:grill-open -->'
MS_GRILL_SENTINEL='<!-- erfana:ms-grill-open -->'

if [ ! -x "$DISPATCH" ]; then
  echo "  FAIL: $DISPATCH is missing or not executable"
  exit 1
fi
for impl in "hooks/${HOOK_NAME}.sh" "hooks/${HOOK_NAME}.ps1" \
            "skills/grill-me/hooks/grill-guard.sh" "skills/grill-me/hooks/grill-guard.ps1" \
            "skills/managing-skills/hooks/ms-grill-guard.sh" "skills/managing-skills/hooks/ms-grill-guard.ps1"; do
  if [ ! -f "$impl" ]; then
    echo "  FAIL: $impl is missing (cross-platform sibling required)"
    exit 1
  fi
done
for exec_impl in "skills/grill-me/hooks/grill-guard.sh" "skills/managing-skills/hooks/ms-grill-guard.sh"; do
  if [ ! -x "$exec_impl" ]; then
    echo "  FAIL: $exec_impl is not executable"
    exit 1
  fi
done
for dir in "$FIXTURE_DIR" "$GRILL_FIXTURE_DIR" "$MS_GRILL_FIXTURE_DIR"; do
  if [ ! -d "$dir" ]; then
    echo "  FAIL: $dir is missing"
    exit 1
  fi
done

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

# Grill-guard fixtures (skill-scoped Stop hook): end-anchored open-marker
# blocking. Same replay protocol as verify-completion.
declare -a GRILL_CASES=(
  "open-blocks|block|end-anchored open marker on a mid-interview message must block"
  "no-marker-passes|pass|wrap-up message without the marker passes (the close signal)"
  "open-quoted-mid-prose|pass|marker quoted mid-prose is not end-anchored and passes"
  "open-inside-trailing-code-fence|pass|marker inside a balanced trailing fence is stripped and passes"
  "stop-hook-active|pass|stop_hook_active true skips the check unconditionally"
)

# ms-grill-guard fixtures (managing-skills requirements interview): same
# end-anchored open-marker protocol with the ms-grill sentinel.
declare -a MS_GRILL_CASES=(
  "open-blocks|block|end-anchored open marker on a mid-interview message must block"
  "no-marker-passes|pass|wrap-up message without the marker passes (the close signal)"
  "open-quoted-mid-prose|pass|marker quoted mid-prose is not end-anchored and passes"
  "open-inside-trailing-code-fence|pass|marker inside a balanced trailing fence is stripped and passes"
  "stop-hook-active|pass|stop_hook_active true skips the check unconditionally"
)

failures=0

run_cases() {
  local hook="$1" dir="$2"; shift 2
  local case_line name expect desc fixture out has_block
  for case_line in "$@"; do
    IFS='|' read -r name expect desc <<< "$case_line"
    fixture="$dir/$name.json"
    if [ ! -f "$fixture" ]; then
      echo "  FAIL: missing fixture: $fixture"
      failures=$((failures + 1))
      continue
    fi

    # Hook always exits 0; we assert on stdout shape.
    out=$(bash "$DISPATCH" "$hook" < "$fixture")

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
}

run_cases "$HOOK_NAME" "$FIXTURE_DIR" "${CASES[@]}"
run_cases "$GRILL_HOOK_NAME" "$GRILL_FIXTURE_DIR" "${GRILL_CASES[@]}"
run_cases "$MS_GRILL_HOOK_NAME" "$MS_GRILL_FIXTURE_DIR" "${MS_GRILL_CASES[@]}"

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
# Grill family: the skill that emits the marker and the skill-scoped Stop hook
# that end-anchors on it (both implementations).
GRILL_SENTINEL_FILES=(
  "skills/grill-me/SKILL.md"
  "skills/grill-me/hooks/grill-guard.sh"
  "skills/grill-me/hooks/grill-guard.ps1"
)
# ms-grill family: the managing-skills orchestrator prose, the static
# interview protocol that governs the marker, and the skill-scoped Stop hook
# that end-anchors on it (both implementations).
MS_GRILL_SENTINEL_FILES=(
  "skills/managing-skills/SKILL.md"
  "skills/managing-skills/references/interview-protocol.md"
  "skills/managing-skills/hooks/ms-grill-guard.sh"
  "skills/managing-skills/hooks/ms-grill-guard.ps1"
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
check_sentinel "$GRILL_SENTINEL" "grill" "${GRILL_SENTINEL_FILES[@]}"
check_sentinel "$MS_GRILL_SENTINEL" "ms-grill" "${MS_GRILL_SENTINEL_FILES[@]}"

# --- 3. Guard-drift check -------------------------------------------------
# ms-grill-guard.sh is a copy of grill-guard.sh differing only in header
# comments, the sentinel literal, and the block-reason JSON. Any other
# difference means a machinery fix landed in one family only.
normalize_guard() {
  grep -v '^#' "$1" | grep -v '"decision":"block"' | sed 's/erfana:ms-grill-open/erfana:grill-open/'
}
if diff <(normalize_guard "skills/grill-me/hooks/grill-guard.sh") \
        <(normalize_guard "skills/managing-skills/hooks/ms-grill-guard.sh") >/dev/null; then
  echo "  PASS: guard machinery identical across grill-guard.sh and ms-grill-guard.sh"
else
  echo "  FAIL: guard drift - grill-guard.sh and ms-grill-guard.sh differ beyond sentinel/reason/header"
  failures=$((failures + 1))
fi

SENTINEL_CHECK_COUNT=$((${#STATUS_SENTINEL_FILES[@]} + ${#EXPLAIN_SENTINEL_FILES[@]} + ${#GRILL_SENTINEL_FILES[@]} + ${#MS_GRILL_SENTINEL_FILES[@]}))
FIXTURE_COUNT=$((${#CASES[@]} + ${#GRILL_CASES[@]} + ${#MS_GRILL_CASES[@]}))

if [ $failures -ne 0 ]; then
  echo "  FAIL: $failures failure(s) total"
  exit 1
fi
echo "  PASS: $FIXTURE_COUNT fixture(s) + $SENTINEL_CHECK_COUNT sentinel symmetry check(s)"
