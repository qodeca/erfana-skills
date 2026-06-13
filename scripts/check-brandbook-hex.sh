#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# check-brandbook-hex.sh — verify every brandbook-defined hex code is present
# in the corresponding brand's tokens file. Catches transcription typos that
# schema validation (Gate 12) cannot see because schemas validate shape, not
# values.
#
# The expected inventory lives in scripts/_lib/brandbook-hex-inventory.json
# (single source of truth keyed by brand id and brandbook page reference).
# This script is the consumer; it carries no inline hex list. When a brandbook
# revision changes the palette, update the inventory file in the same PR as
# the tokens edit and this script picks it up automatically.
#
# Exit 0 if every expected hex appears; exit 1 listing any that do not.
# Wired into scripts/run-all-gates.sh as a soft check (post-Gate-12 advisory).

set -euo pipefail

cd "$(dirname "$0")/.."

INVENTORY=scripts/_lib/brandbook-hex-inventory.json

if [ ! -f "$INVENTORY" ]; then
    echo "FAIL: $INVENTORY not found"
    exit 1
fi

# Drive the verification from Python so JSON parsing stays correct and the
# error reporting is structured.
python3 <<'PYEOF'
import json
import os
import re
import sys

INVENTORY_PATH = 'scripts/_lib/brandbook-hex-inventory.json'

try:
    with open(INVENTORY_PATH, encoding='utf-8') as f:
        inventory = json.load(f)
except (OSError, json.JSONDecodeError) as e:
    print(f'FAIL: cannot load {INVENTORY_PATH}: {e}')
    sys.exit(1)

issues = []
total_checked = 0

for brand_id, brand_block in inventory.items():
    if brand_id.startswith('$'):
        continue  # skip metadata keys like $description

    tokens_path = brand_block.get('tokens')
    if not tokens_path or not os.path.isfile(tokens_path):
        issues.append(f'{brand_id}: tokens file not found at {tokens_path!r}')
        continue

    try:
        with open(tokens_path, encoding='utf-8') as f:
            tokens_content = f.read()
    except OSError as e:
        issues.append(f'{brand_id}: cannot read {tokens_path}: {e}')
        continue

    # Collect every hex from every page-* key in the brand block.
    expected = []
    for key, value in brand_block.items():
        if key.startswith('page-') and isinstance(value, list):
            expected.extend(value)

    if not expected:
        issues.append(
            f'{brand_id}: inventory has no page-* hex lists; nothing to verify'
        )
        continue

    for hex_code in expected:
        total_checked += 1
        # Case-insensitive double-quoted match. Tokens use uppercase by
        # convention but be lenient. Matches the literal "#XXXXXX" string.
        pattern = re.compile(re.escape(f'"{hex_code}"'), re.IGNORECASE)
        if not pattern.search(tokens_content):
            issues.append(
                f'{brand_id}: hex {hex_code} from inventory not found in '
                f'{tokens_path}'
            )

if issues:
    print(f'FAIL: {len(issues)} brandbook hex coverage issue(s)')
    for issue in issues:
        print(f'  {issue}')
    sys.exit(1)

print(f'PASS: all {total_checked} brandbook hex code(s) present in tokens')
PYEOF
