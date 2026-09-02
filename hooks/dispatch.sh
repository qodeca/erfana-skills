#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Cross-platform, cross-host hook launcher.
#
# Claude Code runs hook commands under `sh -c` on macOS/Linux and Git Bash
# on Windows (PowerShell only when Git Bash is absent). Qwen Code runs them the
# same way. The safety hooks ship per-OS implementations because the Unix
# versions depend on jq/grep/awk, none of which are reliably present on
# Windows -- Git Bash itself ships without jq, so the .sh hooks silently no-op
# there.
#
# This launcher receives the hook's JSON payload on stdin plus one argument:
# the hook base name (e.g. "bash-safety"). On Windows it runs the PowerShell
# sibling (<name>.ps1) via powershell.exe; everywhere else it runs the bash
# sibling (<name>.sh). stdin, stdout, stderr, and the exit code pass straight
# through, so the dispatcher is transparent to the hook protocol both hosts
# share (exit 2 still blocks, JSON on stdout is still honoured).
#
# --- Why the timeout lives here, not in hooks.json -------------------------
#
# Both hosts read a `timeout` field on a hook definition, and they read it
# differently. Claude Code treats it as SECONDS and defaults command hooks to
# 600. Qwen Code treats the same field as MILLISECONDS and defaults to 60000.
# So `"timeout": 5` means five seconds on one host and five thousandths of a
# second on the other -- which is why every erfana hook was being killed before
# it ran under Qwen -- and no single number is correct on both. Omitting the
# field is not free either: it would hand Claude Code a ten-minute worst case.
#
# The bound therefore lives here, where five seconds means five seconds
# everywhere. hooks/hooks.json carries no `timeout` key at all, and Gate 14
# fails the build if one comes back.
#
# The kill targets the hook's whole PROCESS GROUP, not just the shell we
# started. Every hook spawns jq and grep children that inherit its stdout and
# stderr, and both hosts wait for those streams to CLOSE rather than for the
# hook process to exit -- so signalling the leaf alone would leave a wedged
# grandchild holding the pipe open and the bound would be fiction. `set -m`
# puts the child in its own process group so `kill -- -PGID` reaches all of it.
#
# A hook killed this way exits 143 (SIGTERM), never 2, so neither host reads a
# timeout as a block. The hooks fail OPEN: a hook that cannot finish does not
# protect you. That is the same direction as the previous host-enforced bound,
# and it is recorded in SECURITY.md rather than only in the caveats.
#
# --- Host-blind by design --------------------------------------------------
#
# This launcher branches on OS only. Claude Code and Qwen Code use the same
# stdin payload keys, the same exit-2-blocks contract and the same
# stdout-JSON decision contract, so no host branch is needed. Where the two
# differ in vocabulary (Qwen's PreToolUse payload carries the canonical
# snake_case tool name) the difference is absorbed by the hook that consumes
# the value; where they differ in configuration (matcher aliases, timeout
# units) it is absorbed by hooks/hooks.json and this file. Qwen does set
# QWEN_PROJECT_DIR in the hook environment if a probe is ever genuinely
# required -- do not add one speculatively. See docs/hosts.md.
#
# Coverage note: on a Windows host with no Git Bash, the host runs the hook
# command under PowerShell, which cannot invoke `bash dispatch.sh`. That host
# is uncovered (same as the pre-existing .sh-only hooks) -- documented in
# docs/known-caveats.md. The mainstream Windows setup ships Git Bash alongside
# the CLI, which this launcher targets.

set -euo pipefail

HOOK="${1:?dispatch.sh requires a hook base name argument}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Seconds. Means the same thing on every OS and every host, which is the whole
# point of bounding here instead of in hooks.json.
HOOK_TIMEOUT_SECONDS="${ERFANA_HOOK_TIMEOUT:-5}"

# Buffer the payload rather than letting the child inherit our stdin. Enabling
# job control below changes how a backgrounded job's stdin is set up, and a
# hook that reads an empty payload fails open silently -- exactly the failure
# this launcher exists to make visible.
PAYLOAD="$(mktemp "${TMPDIR:-/tmp}/erfana-hook.XXXXXX")"
cleanup() { rm -f "$PAYLOAD"; }
trap cleanup EXIT
cat > "$PAYLOAD"

# Run "$@" with stdin from the buffered payload, bounded to
# HOOK_TIMEOUT_SECONDS, killing the whole process group on expiry.
run_bounded() {
  local pid pgid watchdog rc=0

  set -m
  "$@" < "$PAYLOAD" &
  pid=$!
  set +m

  # With job control on, the child leads its own process group, so PGID == PID
  # by construction. Do NOT read it back from ps. Two reasons, both verified:
  # under "set -e" plus "pipefail" a failing ps aborts this function outright
  # (making any fallback below it dead code), and Git Bash ships an MSYS ps
  # with no -o format flag, so the readback fails on every Windows invocation
  # and takes the whole safety net down silently. A readback also creates the
  # only path by which a wrong PGID could reach the kill below -- a lying or
  # PID-reusing ps would aim the group kill at an unrelated group, possibly
  # our own caller's.
  pgid="$pid"

  # The watchdog's own stdout and stderr go to /dev/null. It must not inherit
  # ours: a caller reading this launcher through a pipe (a hook runner, or
  # Gate 16's command substitution) waits for every writer to close, so a
  # watchdog holding the pipe open would make each hook take the full timeout
  # even when it finished in milliseconds. That is the same wedged-writer
  # failure this function exists to prevent, one level up.
  #
  # The watchdog runs in its own process group too (set -m again), so the
  # teardown below can kill the group and take the pending sleep with it.
  # Killing only the subshell leaves its sleep orphaned to init, and with three
  # Stop hooks plus a PreToolUse hook on every Bash/Write/Edit that is a steady
  # trickle of stray sleeps for the whole session.
  set -m
  (
    sleep "$HOOK_TIMEOUT_SECONDS"
    kill -TERM "-$pgid" 2>/dev/null || true
    sleep 1
    kill -KILL "-$pgid" 2>/dev/null || true
  ) >/dev/null 2>&1 &
  watchdog=$!
  set +m

  wait "$pid" || rc=$?

  kill -TERM "-$watchdog" 2>/dev/null || true
  wait "$watchdog" 2>/dev/null || true

  return "$rc"
}

case "$(uname -s 2>/dev/null || echo unknown)" in
  MINGW*|MSYS*|CYGWIN*)
    # Mixed-mode path (C:/...) is accepted by PowerShell -File and avoids the
    # backslash-escaping pitfalls of passing an MSYS path to a native .exe.
    # cygpath ships with every Git Bash / MSYS2 / Cygwin; if it is somehow
    # absent we cannot build a valid Windows path, so emit a visible diagnostic
    # and skip rather than block the user's tool call on a launcher gap
    # (fail-open, matching the hooks' own behaviour on malformed input).
    if ! command -v cygpath > /dev/null 2>&1; then
      echo "dispatch.sh: cygpath not found; cannot locate ${HOOK}.ps1 (hook skipped)" >&2
      exit 0
    fi
    PS_SCRIPT="$(cygpath -m "$DIR")/${HOOK}.ps1"
    run_bounded powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS_SCRIPT"
    ;;
  *)
    # Most .sh hooks parse their payload with jq. Without jq the parse yields an
    # empty string, the hook takes its allow branch, and that control is off
    # with no signal at all -- on a stock macOS box, which ships no jq. Say so
    # rather than pretend the hook ran, matching the cygpath branch above.
    #
    # The probe is per-hook, not blanket: post-compact-reminder reads no stdin
    # and calls no jq (it is git plus a heredoc), so skipping it on a jq-less
    # box would replace a working hook with nothing.
    case "$HOOK" in
      post-compact-reminder) ;;
      *)
        if ! command -v jq > /dev/null 2>&1; then
          echo "dispatch.sh: jq not found; ${HOOK} cannot parse its payload (hook skipped)" >&2
          exit 0
        fi
        ;;
    esac
    run_bounded bash "${DIR}/${HOOK}.sh"
    ;;
esac
