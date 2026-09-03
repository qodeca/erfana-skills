#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Gate 16 — hook fixtures + sentinel symmetry (verify-completion +
# grill-guard + ms-grill-guard).
#
# Five responsibilities:
#   1. For each tests/hooks/verify-completion/*.json fixture, pipe it through
#      hooks/verify-completion.sh and assert whether stdout carries the
#      `{"decision":"block"...}` payload (the Stop-hook block signal).
#      Exit code is always 0 per the Stop-hook protocol — the block decision
#      is communicated via stdout JSON, not exit status — so the gate
#      asserts on stdout shape rather than exit code.
#   2. Same replay for the two interview guards, both plugin-root Stop hooks
#      since v7.1.0: grill-guard against tests/hooks/grill-guard/*.json and
#      ms-grill-guard against tests/hooks/ms-grill-guard/*.json —
#      end-anchored open-marker blocking. They moved out of skill frontmatter
#      because Qwen Code's extension skill parser does not read hooks: there,
#      so a skill-scoped registration was dead on one of the two hosts.
#   3. Sentinel symmetry across four sentinel families:
#        - `<!-- erfana:status-template -->` must appear in
#          commands/project-status.md, commands/session-status.md, and
#          hooks/verify-completion.{sh,ps1}.
#        - `<!-- erfana:explain-template -->` must appear in
#          commands/explain-issue.md and hooks/verify-completion.{sh,ps1}.
#        - `<!-- erfana:grill-open -->` must appear in
#          skills/grill-me/SKILL.md and hooks/grill-guard.{sh,ps1}.
#        - `<!-- erfana:ms-grill-open -->` must appear in
#          skills/managing-skills/SKILL.md,
#          skills/managing-skills/references/interview-protocol.md, and
#          hooks/ms-grill-guard.{sh,ps1}.
#      If any one is missing, the corresponding hook behaviour would silently
#      break (a clean-data report would block, or the grill backstop would
#      never fire).
#   4. Guard-drift check: ms-grill-guard.sh must equal grill-guard.sh
#      modulo header comments, the sentinel literal, and the block-reason
#      JSON — a machinery fix must never land in one family only.
#   5. PreToolUse replay for secret-detector and bash-safety against
#      tests/hooks/secret-detector/*.json and tests/hooks/bash-safety/*.json.
#      Different protocol from the Stop hooks: these block with exit 2 plus a
#      `BLOCKED:` line on stderr, so the gate asserts on the exit code.
#      Each family carries the same payload in both host shapes, because the
#      PreToolUse payload names the tool differently on each host — Claude Code
#      sends the display name (`Write`, `Bash`), Qwen sends the canonical name
#      (`write_file`, `run_shell_command`). Before v7.1.0 there were no
#      PreToolUse fixtures at all, so a hook that silently stopped inspecting
#      one host's payloads would have failed nothing.
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
GRILL_HOOK_NAME="grill-guard"
GRILL_FIXTURE_DIR="tests/hooks/grill-guard"
MS_GRILL_HOOK_NAME="ms-grill-guard"
MS_GRILL_FIXTURE_DIR="tests/hooks/ms-grill-guard"
SECRET_HOOK_NAME="secret-detector"
SECRET_FIXTURE_DIR="tests/hooks/secret-detector"
BASH_SAFETY_HOOK_NAME="bash-safety"
BASH_SAFETY_FIXTURE_DIR="tests/hooks/bash-safety"
STATUS_SENTINEL='<!-- erfana:status-template -->'
EXPLAIN_SENTINEL='<!-- erfana:explain-template -->'
GRILL_SENTINEL='<!-- erfana:grill-open -->'
MS_GRILL_SENTINEL='<!-- erfana:ms-grill-open -->'

if [ ! -x "$DISPATCH" ]; then
  echo "  FAIL: $DISPATCH is missing or not executable"
  exit 1
fi
for impl in "hooks/${HOOK_NAME}.sh" "hooks/${HOOK_NAME}.ps1" \
            "hooks/grill-guard.sh" "hooks/grill-guard.ps1" \
            "hooks/ms-grill-guard.sh" "hooks/ms-grill-guard.ps1"; do
  if [ ! -f "$impl" ]; then
    echo "  FAIL: $impl is missing (cross-platform sibling required)"
    exit 1
  fi
done
for exec_impl in "hooks/grill-guard.sh" "hooks/ms-grill-guard.sh"; do
  if [ ! -x "$exec_impl" ]; then
    echo "  FAIL: $exec_impl is not executable"
    exit 1
  fi
done
for dir in "$FIXTURE_DIR" "$GRILL_FIXTURE_DIR" "$MS_GRILL_FIXTURE_DIR" \
           "$SECRET_FIXTURE_DIR" "$BASH_SAFETY_FIXTURE_DIR"; do
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

# Grill-guard fixtures (plugin-root Stop hook): end-anchored open-marker
# blocking. Same replay protocol as verify-completion. The guard evaluates
# every stop; the marker alone scopes it to an open interview.
declare -a GRILL_CASES=(
  "open-blocks|block|end-anchored open marker on a mid-interview message must block"
  "no-marker-passes|pass|wrap-up message without the marker passes (the close signal)"
  "open-quoted-mid-prose|pass|marker quoted mid-prose is not end-anchored and passes"
  "open-inside-trailing-code-fence|pass|marker inside a balanced trailing fence is stripped and passes"
  "open-inside-indented-code-fence|pass|marker inside a fence indented under a list item is stripped and passes"
  "open-inside-tilde-code-fence|pass|marker inside a balanced ~~~ fence is stripped and passes"
  "open-mentioned-in-inline-code|pass|backticked prose mention of the marker is not an open marker and passes"
  "stop-hook-active|pass|stop_hook_active true skips the check unconditionally"
)

# ms-grill-guard fixtures (managing-skills requirements interview): same
# end-anchored open-marker protocol with the ms-grill sentinel.
declare -a MS_GRILL_CASES=(
  "open-blocks|block|end-anchored open marker on a mid-interview message must block"
  "no-marker-passes|pass|wrap-up message without the marker passes (the close signal)"
  "open-quoted-mid-prose|pass|marker quoted mid-prose is not end-anchored and passes"
  "open-inside-trailing-code-fence|pass|marker inside a balanced trailing fence is stripped and passes"
  "open-inside-indented-code-fence|pass|marker inside a fence indented under a list item is stripped and passes"
  "open-inside-tilde-code-fence|pass|marker inside a balanced ~~~ fence is stripped and passes"
  "open-mentioned-in-inline-code|pass|backticked prose mention of the marker is not an open marker and passes"
  "stop-hook-active|pass|stop_hook_active true skips the check unconditionally"
)

# PreToolUse fixtures (secret-detector, bash-safety). A different protocol from
# the Stop hooks above: a PreToolUse hook blocks with exit 2 plus a message on
# stderr, and allows with exit 0 and no output. Both hosts read it that way -
# Claude Code natively, and Qwen via `exitCode === 2` -> parse stderr ->
# `{decision:"deny"}` when the text is not JSON.
#
# Each family carries the same payload in both host shapes, because the
# PreToolUse payload names the tool differently on each: Claude Code sends the
# display name (`Write`, `Bash`), Qwen sends the canonical name (`write_file`,
# `run_shell_command`). A hook that switches on that value therefore has to
# accept both, and until it does the Qwen-shaped payload silently sails past.
#
# What these fixtures CANNOT test is matcher dispatch - piping a payload
# straight into a hook bypasses the host's matcher entirely. That the matcher
# resolves on both hosts is Gate 14's job, via the dual-naming rule it reads
# from scripts/_lib/host_matrix.py. Bodies here, wiring there.
declare -a SECRET_CASES=(
  "claude-write-secret-blocks|deny|Claude-shaped Write carrying an AWS key must block"
  "claude-edit-secret-blocks|deny|Claude-shaped Edit carrying an AWS key must block"
  "claude-multiedit-secret-blocks|deny|Claude-shaped MultiEdit carrying an AWS key must block"
  "claude-write-clean-allows|allow|Claude-shaped Write with no secret passes"
  "qwen-write-file-secret-blocks|deny|Qwen-shaped write_file carrying the same key must block identically"
  "qwen-edit-secret-blocks|deny|Qwen-shaped edit carrying the same key must block identically"
  "qwen-write-file-clean-allows|allow|Qwen-shaped write_file with no secret passes"
  "skipped-path-allows|allow|a .md path is skipped by design; pinned so the skip cannot widen unnoticed"
  "unknown-tool-allows|allow|a tool the hook does not inspect passes without reading content"
)

declare -a BASH_SAFETY_CASES=(
  "claude-bash-destructive-blocks|deny|Claude-shaped Bash running a documented injection signature must block"
  "claude-bash-safe-allows|allow|an ordinary listing command passes"
  "qwen-shell-destructive-blocks|deny|Qwen-shaped run_shell_command with the same command must block identically"
  "qwen-shell-safe-allows|allow|Qwen-shaped safe command passes"
  "empty-command-allows|allow|a payload with no command fails open rather than blocking everything"
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

# PreToolUse replay: assert on the exit code, not on stdout. `set -e` is active,
# so the invocation is guarded - an exit 2 here is the expected outcome for half
# these cases, not a gate crash.
run_pre_cases() {
  local hook="$1" dir="$2"; shift 2
  local case_line name expect desc fixture err rc
  for case_line in "$@"; do
    IFS='|' read -r name expect desc <<< "$case_line"
    fixture="$dir/$name.json"
    if [ ! -f "$fixture" ]; then
      echo "  FAIL: missing fixture: $fixture"
      failures=$((failures + 1))
      continue
    fi

    set +e
    err=$(bash "$DISPATCH" "$hook" < "$fixture" 2>&1 >/dev/null)
    rc=$?
    set -e

    case "$expect" in
      deny)
        if [ "$rc" -eq 2 ] && printf '%s' "$err" | grep -q '^BLOCKED:'; then
          echo "  PASS: $name → deny (exit 2 + stderr): $desc"
        elif [ "$rc" -eq 2 ]; then
          echo "  FAIL: $name → exit 2 but no 'BLOCKED:' reason on stderr: $desc"
          failures=$((failures + 1))
        else
          echo "  FAIL: $name → expected exit 2, got $rc: $desc"
          failures=$((failures + 1))
        fi
        ;;
      allow)
        if [ "$rc" -eq 0 ]; then
          echo "  PASS: $name → allow (exit 0): $desc"
        else
          echo "  FAIL: $name → expected exit 0, got $rc: $desc"
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
run_pre_cases "$SECRET_HOOK_NAME" "$SECRET_FIXTURE_DIR" "${SECRET_CASES[@]}"
run_pre_cases "$BASH_SAFETY_HOOK_NAME" "$BASH_SAFETY_FIXTURE_DIR" "${BASH_SAFETY_CASES[@]}"

# --- 1b. Launcher guarantees ----------------------------------------------
# The timeout that used to live in hooks/hooks.json now lives in
# hooks/dispatch.sh, because the field means seconds on one host and
# milliseconds on the other. A grep for the watchdog would prove only that a
# string exists; these two checks prove the behaviour.

# Watchdog: a hook whose background child holds stdout open must still be cut
# off. Asserted as an upper bound, not an exact duration - a wall-clock
# equality check is flaky on a loaded CI runner.
SLOW_FIXTURE="tests/hooks/_fixtures/slow-hook.sh"
if [ ! -f "$SLOW_FIXTURE" ]; then
  echo "  FAIL: $SLOW_FIXTURE is missing (watchdog cannot be proven)"
  failures=$((failures + 1))
else
  wd_start=$(date +%s)
  set +e
  ERFANA_HOOK_TIMEOUT=2 bash "$DISPATCH" ../tests/hooks/_fixtures/slow-hook \
    < "$FIXTURE_DIR/stop-hook-active.json" >/dev/null 2>&1
  wd_rc=$?
  set -e
  wd_elapsed=$(( $(date +%s) - wd_start ))
  if [ "$wd_rc" -eq 0 ]; then
    echo "  FAIL: watchdog - slow hook exited 0; it was never killed"
    failures=$((failures + 1))
  elif [ "$wd_rc" -eq 127 ]; then
    # 127 is "command not found". Without this arm the test passes when the
    # fixture is missing - which is exactly what happened on the first Windows
    # CI run, before slow-hook.ps1 existed: nothing ran, the launcher exited
    # non-zero in 0s, and "non-zero inside ten seconds" accepted it.
    echo "  FAIL: watchdog - exit 127; the fixture did not run, so nothing was bounded"
    failures=$((failures + 1))
  elif [ "$wd_elapsed" -lt 1 ]; then
    echo "  FAIL: watchdog - returned in ${wd_elapsed}s; the hook cannot have started"
    failures=$((failures + 1))
  elif [ "$wd_elapsed" -gt 10 ]; then
    echo "  FAIL: watchdog - slow hook took ${wd_elapsed}s; the bound did not hold"
    failures=$((failures + 1))
  else
    echo "  PASS: watchdog - wedged hook killed in ${wd_elapsed}s (exit $wd_rc), stream closed"
  fi
fi

# The jq probe lives in dispatch.sh's non-Windows arm only: the .ps1 hooks parse
# with ConvertFrom-Json and need no jq, so asserting the probe on Windows would
# assert behaviour that is deliberately absent there.
case "$(uname -s 2>/dev/null || echo unknown)" in
  MINGW*|MSYS*|CYGWIN*) SKIP_JQ_PROBE=1 ;;
  *) SKIP_JQ_PROBE=0 ;;
esac

if [ "$SKIP_JQ_PROBE" -eq 1 ]; then
  echo "  SKIP: jq probe - Windows takes the PowerShell arm, which needs no jq"
else

# jq probe: every .sh hook parses its payload with jq, and without jq the parse
# yields an empty string and the hook takes its allow branch - the safety net
# off with no signal. stock macOS ships no jq. The launcher must say so.
jq_dir="$(mktemp -d)"
for tool in bash sed grep awk cat basename tr dirname date uname mktemp rm ps sleep kill; do
  tool_path="$(command -v "$tool" 2>/dev/null || true)"
  # command -v returns the bare name for a shell builtin (kill is a builtin on
  # Git Bash, with no binary anywhere), and ln on a non-path then fails and, under
  # set -e, takes the whole gate down. Only link real files.
  [ -n "$tool_path" ] && [ -f "$tool_path" ] && ln -sf "$tool_path" "$jq_dir/$tool"
done
set +e
jq_err=$(PATH="$jq_dir" bash "$DISPATCH" secret-detector \
  < "$SECRET_FIXTURE_DIR/claude-write-secret-blocks.json" 2>&1 >/dev/null)
jq_rc=$?
set -e
rm -rf "$jq_dir"
if [ "$jq_rc" -eq 0 ] && printf '%s' "$jq_err" | grep -q 'jq not found'; then
  echo "  PASS: jq probe - missing jq skips the hook with a visible diagnostic"
else
  echo "  FAIL: jq probe - expected exit 0 plus a 'jq not found' diagnostic, got exit $jq_rc: $jq_err"
  failures=$((failures + 1))
fi

# The probe must be per-hook, not blanket. post-compact-reminder reads no stdin
# and calls no jq (it is git plus a heredoc), so a blanket probe would replace a
# working hook with nothing on exactly the jq-less box it was written for.
jq_dir="$(mktemp -d)"
for tool in bash sed grep awk cat basename tr dirname date uname mktemp rm sleep kill git; do
  tool_path="$(command -v "$tool" 2>/dev/null || true)"
  # command -v returns the bare name for a shell builtin (kill is a builtin on
  # Git Bash, with no binary anywhere), and ln on a non-path then fails and, under
  # set -e, takes the whole gate down. Only link real files.
  [ -n "$tool_path" ] && [ -f "$tool_path" ] && ln -sf "$tool_path" "$jq_dir/$tool"
done
set +e
pcr_out=$(PATH="$jq_dir" bash "$DISPATCH" post-compact-reminder < /dev/null 2>/dev/null)
pcr_rc=$?
set -e
rm -rf "$jq_dir"
if [ "$pcr_rc" -eq 0 ] && printf '%s' "$pcr_out" | grep -q 'CRITICAL REMINDERS'; then
  echo "  PASS: jq probe - post-compact-reminder still runs on a jq-less PATH"
else
  echo "  FAIL: jq probe - post-compact-reminder was skipped without jq; it needs none"
  failures=$((failures + 1))
fi

fi

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
  "hooks/grill-guard.sh"
  "hooks/grill-guard.ps1"
)
# ms-grill family: the managing-skills orchestrator prose, the static
# interview protocol that governs the marker, and the skill-scoped Stop hook
# that end-anchors on it (both implementations).
MS_GRILL_SENTINEL_FILES=(
  "skills/managing-skills/SKILL.md"
  "skills/managing-skills/references/interview-protocol.md"
  "hooks/ms-grill-guard.sh"
  "hooks/ms-grill-guard.ps1"
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
if diff <(normalize_guard "hooks/grill-guard.sh") \
        <(normalize_guard "hooks/ms-grill-guard.sh") >/dev/null; then
  echo "  PASS: guard machinery identical across grill-guard.sh and ms-grill-guard.sh"
else
  echo "  FAIL: guard drift - grill-guard.sh and ms-grill-guard.sh differ beyond sentinel/reason/header"
  failures=$((failures + 1))
fi

SENTINEL_CHECK_COUNT=$((${#STATUS_SENTINEL_FILES[@]} + ${#EXPLAIN_SENTINEL_FILES[@]} + ${#GRILL_SENTINEL_FILES[@]} + ${#MS_GRILL_SENTINEL_FILES[@]}))
FIXTURE_COUNT=$((${#CASES[@]} + ${#GRILL_CASES[@]} + ${#MS_GRILL_CASES[@]} + ${#SECRET_CASES[@]} + ${#BASH_SAFETY_CASES[@]}))

if [ $failures -ne 0 ]; then
  echo "  FAIL: $failures failure(s) total"
  exit 1
fi
echo "  PASS: $FIXTURE_COUNT fixture(s) + $SENTINEL_CHECK_COUNT sentinel symmetry check(s)"
