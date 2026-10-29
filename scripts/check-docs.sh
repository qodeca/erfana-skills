#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# check-docs.sh - the three documentation checks, in one command.
#
#   lychee              every link in every tracked Markdown file resolves,
#                       including #fragments (config: lychee.toml)
#   vale                house style in the reader-facing docs: en dashes,
#                       sentence-case headings, plain words
#                       (config: .vale.ini + .vale/styles/Erfana)
#   markdownlint-cli2   Markdown structure: headings, lists, fences, tables
#                       (config: .markdownlint-cli2.jsonc)
#
#   bash scripts/check-docs.sh            all three; web links included
#   bash scripts/check-docs.sh --offline  local links and fragments only
#
# A missing tool is a failure, not a skip: a check that silently does not run
# reads as a pass. Install: lychee and vale from their release pages or a
# package manager; markdownlint-cli2 runs through npx (Node 20+).
set -uo pipefail
cd "$(dirname "$0")/.."

offline=()
case "${1:-}" in
  "") ;;
  --offline) offline=(--offline) ;;
  *) echo "usage: $0 [--offline]" >&2; exit 2 ;;
esac

MARKDOWNLINT_VERSION=0.18.1
status=0

# Reader-facing docs that follow the house style. History files (CHANGELOG,
# release notes, registries of past passes) keep the wording they shipped with.
VALE_FILES=(README.md CONTRIBUTING.md SECURITY.md SUPPORT.md GOVERNANCE.md docs/*.md docs/gates/*.md)
VALE_SKIP='^docs/(release-notes-v6\.0\.0|modernization-registry|known-caveats)\.md$'

need() {
  if ! command -v "$1" > /dev/null; then
    echo "  FAIL: $1 is not installed - see the header of scripts/check-docs.sh"
    status=1
    return 1
  fi
}

echo "=== Docs 1 - links (lychee) ==="
if need lychee; then
  md=()
  while IFS= read -r f; do md+=("$f"); done < <(git ls-files -- '*.md' ':!skills/article/templates/*' ':!tests/skill/fixtures/*')
  if lychee --no-progress --config lychee.toml ${offline[@]+"${offline[@]}"} -- "${md[@]}"; then
    echo "  PASS: every link resolves"
  else
    echo "  FAIL: broken links above"
    status=1
  fi
fi

echo "=== Docs 2 - house style (vale) ==="
if need vale; then
  files=()
  for f in "${VALE_FILES[@]}"; do
    [[ -f "$f" && ! "$f" =~ $VALE_SKIP ]] && files+=("$f")
  done
  if vale --config .vale.ini --no-wrap "${files[@]}"; then
    echo "  PASS: house style holds in ${#files[@]} files"
  else
    echo "  FAIL: style errors above"
    status=1
  fi
fi

echo "=== Docs 3 - Markdown structure (markdownlint-cli2) ==="
if need npx; then
  if npx --yes "markdownlint-cli2@${MARKDOWNLINT_VERSION}"; then
    echo "  PASS: Markdown structure is clean"
  else
    echo "  FAIL: Markdown errors above"
    status=1
  fi
fi

if [[ $status -eq 0 ]]; then
  echo "=== ALL DOC CHECKS PASSED ==="
fi
exit "$status"
