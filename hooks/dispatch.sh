#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Cross-platform hook launcher.
#
# Claude Code runs hook commands under `sh -c` on macOS/Linux and Git Bash
# on Windows (PowerShell only when Git Bash is absent). The safety hooks ship
# per-OS implementations because the Unix versions depend on jq/grep/awk,
# none of which are reliably present on Windows -- Git Bash itself ships
# without jq, so the .sh hooks silently no-op there.
#
# This launcher receives the hook's JSON payload on stdin plus one argument:
# the hook base name (e.g. "bash-safety"). On Windows it execs the PowerShell
# sibling (<name>.ps1) via powershell.exe; everywhere else it execs the bash
# sibling (<name>.sh). stdin, stdout, stderr, and the exit code pass straight
# through, so the dispatcher is transparent to the Claude Code hook protocol
# (exit 2 still blocks, JSON on stdout is still honoured).
#
# Coverage note: on a Windows host with no Git Bash, Claude Code runs the hook
# command under PowerShell, which cannot invoke `bash dispatch.sh`. That host
# is uncovered (same as the pre-existing .sh-only hooks) -- documented in
# docs/known-caveats.md. The mainstream Windows setup ships Git Bash alongside
# Claude Code, which this launcher targets.

set -euo pipefail

HOOK="${1:?dispatch.sh requires a hook base name argument}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
    exec powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$PS_SCRIPT"
    ;;
  *)
    exec bash "${DIR}/${HOOK}.sh"
    ;;
esac
