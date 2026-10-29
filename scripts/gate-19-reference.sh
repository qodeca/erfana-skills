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
#
# Second check: each user page carries "This page describes erfana vX.Y.Z.",
# and that line and the sample install output (`Version: X.Y.Z`,
# `erfana (X.Y.Z)`, `Release tag: vX.Y.Z`) show the version in
# .claude-plugin/plugin.json, so a reader always knows which release a page
# describes and is never sent looking for an old one.
#
# Run standalone: bash scripts/gate-19-reference.sh
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f docs/reference.md ]]; then
  echo "  FAIL: docs/reference.md is missing - run: bash scripts/gen-reference.sh"
  exit 1
fi

USER_PAGES=(README.md docs/README.md docs/tutorial.md docs/how-to.md docs/explanation.md docs/reference.md)

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

version=$(python3 -c 'import json; print(json.load(open(".claude-plugin/plugin.json"))["version"])')
stale=$(grep -nE 'Version: [0-9]+\.[0-9]+\.[0-9]+|erfana \([0-9]+\.[0-9]+\.[0-9]+\)|Release tag: v[0-9]+\.[0-9]+\.[0-9]+|describes erfana v[0-9]+\.[0-9]+\.[0-9]+' \
  "${USER_PAGES[@]}" docs/hosts.md \
  | grep -vF -e "Version: $version" -e "erfana ($version)" -e "Release tag: v$version" -e "describes erfana v$version" || true)
if [[ -n "$stale" ]]; then
  echo "  FAIL: these lines name a version other than $version (plugin.json) - update them:"
  echo "$stale"
  exit 1
fi
missing=()
for f in "${USER_PAGES[@]}"; do
  grep -qF "This page describes erfana v$version." "$f" || missing+=("$f")
done
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "  FAIL: no \"This page describes erfana v$version.\" line in: ${missing[*]}"
  exit 1
fi
echo "  PASS: user pages and sample install output show version $version"
