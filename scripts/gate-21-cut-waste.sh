#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# gate-21-cut-waste.sh - proves the cut-waste skill's session-log scanner on
# made-up logs: it counts the planted waste, never writes log content, reports
# missing fields instead of zeros, filters and compares runs, and keeps its exit
# codes.
#
# Run standalone: bash scripts/gate-21-cut-waste.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v node > /dev/null; then
  echo "  FAIL: node is not on PATH; Gate 21 needs it"
  exit 1
fi
node --test tests/cut-waste/scan-sessions.test.mjs
