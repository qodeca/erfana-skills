#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# gate-20-design-checker.sh - proves the design skill's checker and token
# builder: the template page passes, every rule catches a page that breaks it,
# and the shipped sample still passes. A rule change that leaves the sample
# behind fails here.
#
# Run standalone: bash scripts/gate-20-design-checker.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v node > /dev/null; then
  echo "  FAIL: node is not on PATH; Gate 20 needs it"
  exit 1
fi
node tests/design/run-fixtures.mjs
