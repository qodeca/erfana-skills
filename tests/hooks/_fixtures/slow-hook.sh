#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Test fixture, not a shipped hook. Gate 16 runs it through hooks/dispatch.sh
# to prove the launcher's timeout is a real bound rather than a string a gate
# greps for.
#
# It wedges the way a real hook would: a background child inherits stdout and
# outlives the foreground process. A watchdog that signals only the leaf leaves
# that child holding the pipe open, and a caller reading the launcher waits for
# the stream to close, not for the process to exit - so the "bound" would do
# nothing. Killing the process group is what actually ends it.
#
# Lives under tests/ rather than hooks/ on purpose: Gate 15 counts hooks/*.sh
# to check the "N safety hooks" prose claims, and a fixture in that directory
# would inflate the count.

sleep 30 &
echo "slow-hook: started, now wedging"
sleep 30
