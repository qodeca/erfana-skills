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
#
# CLAMPED, not trusted. Moving the bound out of hooks.json also moved it from a
# file the host owns into a variable any parent process can set, and
# ERFANA_HOOK_TIMEOUT=0 made the watchdog SIGTERM every hook before it could
# decide - exit 143, which neither host reads as a block, so the write or the
# destructive command went through. An override is useful for testing, so keep
# it, but floor it at 1 second and cap it at 60 and ignore anything that is not
# a plain integer.
# Whether `set -m` reliably puts the hook in its own process group. Verified
# true on macOS bash 3.2 and Linux bash 5 (child pid == pgid, distinct from
# ours). Not relied on under MSYS/Cygwin, where it does not hold.
case "$(uname -s 2>/dev/null || echo unknown)" in
  MINGW*|MSYS*|CYGWIN*) JOB_CONTROL_ISOLATES=0 ;;
  *) JOB_CONTROL_ISOLATES=1 ;;
esac

HOOK_TIMEOUT_SECONDS=5
if [ -n "${ERFANA_HOOK_TIMEOUT:-}" ]; then
  case "$ERFANA_HOOK_TIMEOUT" in
    ''|*[!0-9]*)
      echo "dispatch.sh: ignoring non-integer ERFANA_HOOK_TIMEOUT=${ERFANA_HOOK_TIMEOUT}" >&2
      ;;
    *)
      if [ "$ERFANA_HOOK_TIMEOUT" -lt 1 ]; then
        echo "dispatch.sh: ERFANA_HOOK_TIMEOUT=${ERFANA_HOOK_TIMEOUT} would disarm the hook; using 1" >&2
        HOOK_TIMEOUT_SECONDS=1
      elif [ "$ERFANA_HOOK_TIMEOUT" -gt 60 ]; then
        echo "dispatch.sh: ERFANA_HOOK_TIMEOUT=${ERFANA_HOOK_TIMEOUT} exceeds the 60s cap; using 60" >&2
        HOOK_TIMEOUT_SECONDS=60
      else
        HOOK_TIMEOUT_SECONDS="$ERFANA_HOOK_TIMEOUT"
      fi
      ;;
  esac
fi

# Buffer the payload rather than letting the child inherit our stdin. Enabling
# job control below changes how a backgrounded job's stdin is set up, and a
# hook that reads an empty payload fails open silently -- exactly the failure
# this launcher exists to make visible.
#
# A launcher-internal failure must never resolve to "allow" for a hook whose job
# is to block, so mktemp failing is not fatal: an unwritable TMPDIR, a full disk
# or a read-only /tmp in a hardened container used to abort the launcher before
# the hook ever started, and exit 1 is a non-blocking error on both hosts. Try
# TMPDIR, then /tmp, and if neither works run the hook with stdin inherited -
# unbounded, but running.
PAYLOAD=""
for candidate_dir in "${TMPDIR:-/tmp}" /tmp; do
  PAYLOAD="$(mktemp "${candidate_dir%/}/erfana-hook.XXXXXX" 2>/dev/null || true)"
  [ -n "$PAYLOAD" ] && break
done

cleanup() { [ -n "$PAYLOAD" ] && rm -f "$PAYLOAD"; }
# SIGKILL cannot be trapped, but everything else can: without these the payload
# - which for secret-detector IS the candidate secret - survives in TMPDIR.
trap cleanup EXIT INT TERM HUP

if [ -n "$PAYLOAD" ]; then
  cat > "$PAYLOAD"
else
  echo "dispatch.sh: no writable temp dir; running ${HOOK} unbounded with inherited stdin" >&2
fi

# Run "$@" with stdin from the buffered payload, bounded to
# HOOK_TIMEOUT_SECONDS, killing the whole process group on expiry.
run_bounded() {
  local pid pgid watchdog rc=0

  # No temp file means no buffered payload to redirect from. Run the hook
  # directly on the inherited stdin: unbounded, but a running hook that can
  # still block beats a launcher that fails open.
  if [ -z "$PAYLOAD" ]; then
    "$@"
    return $?
  fi

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
    # kill -0 first: if the group is already gone its leader's pid can have been
    # recycled, and a blind signal would land on an unrelated group.
    kill -0 "-$pgid" 2>/dev/null || exit 0
    kill -TERM "-$pgid" 2>/dev/null || true
    sleep 1
    kill -0 "-$pgid" 2>/dev/null || exit 0
    kill -KILL "-$pgid" 2>/dev/null || true
  ) >/dev/null 2>&1 &
  watchdog=$!
  set +m

  # 2>/dev/null: with job control on, bash announces the reap on stderr
  # ("Terminated: 15   \"$@\" < \"$PAYLOAD\""). The exit code is 143 so neither
  # host reads it as a block, but Claude Code surfaces hook stderr, and showing
  # the user the launcher's internals on every timeout is noise.
  wait "$pid" 2>/dev/null || rc=$?

  # Tear down the child's group even on a clean exit, so a hook that backgrounds
  # work and returns cannot leave a grandchild holding stdout after the watchdog
  # is gone. No shipped hook forks that way, but the guarantee should hold.
  #
  # NOT on Windows. Git Bash's job control does not reliably give the child its
  # own process group, so "-$pgid" can name the group we are ourselves in - and
  # unlike the watchdog, which only fires on a timeout, this runs on EVERY
  # dispatch. It killed the whole Gate 16 run on windows-latest (exit 143, no
  # output). The watchdog's own group kill is left alone: it is rare, and it is
  # the only thing that bounds a wedged hook.
  if [ "$JOB_CONTROL_ISOLATES" -eq 1 ]; then
    kill -TERM "-$pgid" 2>/dev/null || true
  fi

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
