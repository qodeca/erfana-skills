#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# gate-19-reference.sh - keeps docs/reference.md identical to what
# scripts/gen-reference.sh produces from the current tree.
#
# Unlike the skill registry (Gate 18), the reference reads no git history and
# no dates, so a whole-file comparison is safe: any difference means a skill,
# agent, command, or hook changed without the page being regenerated, or the
# page was edited by hand.
#
# Fix with: bash scripts/gen-reference.sh
# Run standalone: bash scripts/gate-19-reference.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f docs/reference.md ]]; then
  echo "  FAIL: docs/reference.md is missing - run: bash scripts/gen-reference.sh"
  exit 1
fi

fresh=$(mktemp)
trap 'rm -f "$fresh"' EXIT
bash scripts/gen-reference.sh --stdout > "$fresh"

if cmp -s "$fresh" docs/reference.md; then
  echo "  PASS: docs/reference.md matches the skills, agents, commands, and hooks"
else
  echo "  FAIL: docs/reference.md is out of sync with the plugin files - run: bash scripts/gen-reference.sh"
  diff -u docs/reference.md "$fresh" | head -40 || true
  exit 1
fi
