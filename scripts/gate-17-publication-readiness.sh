#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# gate-17-publication-readiness.sh — blocks accidental publication of proprietary
# or internal-only framing now that the project is public OSS (GPL-3.0-only).
#
# Checks (all hard):
#   1. LICENSE is the GNU GPL text and carries no proprietary "All rights reserved".
#   2. plugin.json / marketplace.json declare GPL-3.0-only, not Proprietary.
#   3. No internal `@qodeca.com` address in published files, except the one
#      public hi@qodeca.com alias used in CODE_OF_CONDUCT.md.
#   4. No proprietary / internal-only framing in published files.
#   5. ACTIVE_BRAND does not point at the removed proprietary `qodeca` brand.
#
# CHANGELOG.md (history), this script, and its gate doc are exempt — they legitimately
# reference the old literals.
#
# Run standalone:  bash scripts/gate-17-publication-readiness.sh
set -euo pipefail
cd "$(dirname "$0")/.."

fail=0
EXCLUDES='^(CHANGELOG\.md|scripts/gate-17-publication-readiness\.sh|docs/gates/17-publication-readiness\.md)$'

tracked() { git ls-files | grep -vE "$EXCLUDES"; }

scan() { # $1 = grep pattern (ERE), $2 = label
    local hits=""
    while IFS= read -r f; do
        [ -f "$f" ] || continue
        local h
        h=$(grep -nIHE "$1" "$f" 2>/dev/null || true)
        [ -n "$h" ] && hits="${hits}${h}"$'\n'
    done < <(tracked)
    if [ -n "$hits" ]; then
        echo "  FAIL: $2"
        printf '%s' "$hits" | sed 's/^/    /'
        fail=1
    fi
}

# 1. LICENSE
if ! grep -q 'GNU GENERAL PUBLIC LICENSE' LICENSE 2>/dev/null; then
    echo "  FAIL: LICENSE is not the GNU GPL text"; fail=1
fi
if grep -qi 'all rights reserved' LICENSE 2>/dev/null; then
    echo "  FAIL: LICENSE still contains a proprietary 'All rights reserved' notice"; fail=1
fi

# 2. Manifests
for m in .claude-plugin/plugin.json .claude-plugin/marketplace.json; do
    if grep -qiE '"license"[[:space:]]*:[[:space:]]*"Proprietary"' "$m" 2>/dev/null; then
        echo "  FAIL: $m still declares a Proprietary license"; fail=1
    fi
done
if ! grep -q '"license": "GPL-3.0-only"' .claude-plugin/plugin.json 2>/dev/null; then
    echo "  FAIL: plugin.json does not declare \"license\": \"GPL-3.0-only\""; fail=1
fi

# 3. Internal contact email. The public hi@qodeca.com alias (CODE_OF_CONDUCT.md)
#    is the one allowed exception; every other @qodeca.com address still fails.
email_hits=""
while IFS= read -r f; do
    [ -f "$f" ] || continue
    h=$(grep -nIHE '@qodeca\.com' "$f" 2>/dev/null | sed 's/hi@qodeca\.com//g' | grep -E '@qodeca\.com' || true)
    [ -n "$h" ] && email_hits="${email_hits}${h}"$'\n'
done < <(tracked)
if [ -n "$email_hits" ]; then
    echo "  FAIL: internal '@qodeca.com' address in published files (only the public hi@qodeca.com alias is allowed)"
    printf '%s' "$email_hits" | sed 's/^/    /'
    fail=1
fi

# 4. Proprietary / internal-only framing
scan 'Qodeca-internal|scoped to Qodeca|Qodeca employees|for Qodeca employees|employees only|Qodeca tools channel|internal use by Qodeca|employees and contractors only|private internal|internal-only license' \
     "proprietary/internal-only framing in published files"

# 5. Active brand
if [ "$(cat skills/design-shared/brands/ACTIVE_BRAND 2>/dev/null)" = "qodeca" ]; then
    echo "  FAIL: ACTIVE_BRAND still points at the removed 'qodeca' brand"; fail=1
fi

if [ "$fail" -ne 0 ]; then
    echo "  FAIL: publication-readiness checks failed"
    exit 1
fi
echo "  PASS: publication-readiness (license, contact, framing, active brand)"
