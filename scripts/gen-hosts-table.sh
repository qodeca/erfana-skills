#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# gen-hosts-table.sh - regenerates the host table inside docs/hosts.md.
#
# docs/hosts.md is the single source of truth for host differences, and its
# table is the part a reader most often quotes: install command, tested version,
# how each host consumes the plugin. Hand-maintaining that next to
# scripts/_lib/host_matrix.py would create two places to change and one to
# forget, so the table is generated from the module and only the surrounding
# prose is written by hand.
#
#   bash scripts/gen-hosts-table.sh
#
# The generator replaces everything between the two markers in docs/hosts.md and
# touches nothing else, so prose above and below survives a regeneration:
#
#   <!-- BEGIN generated host table -->
#   <!-- END generated host table -->
#
# Verification is Gate 15, which reads the committed table and compares the
# stated Qwen version against host_matrix.py. Running this script must produce
# no diff; if it does, someone edited the table by hand.
#
# Deliberately NOT part of run-all-gates.sh: that runner must stay executable
# with only bash and Python, and a generator is not a check.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $# -gt 0 ]]; then
  echo "usage: $0   (no arguments; verification lives in Gate 15)" >&2
  exit 2
fi

python3 <<'PYEOF'
import sys

sys.path.insert(0, 'scripts')
from _lib.host_matrix import HOSTS, QWEN_BUNDLE  # noqa: E402

TARGET = 'docs/hosts.md'
BEGIN = '<!-- BEGIN generated host table -->'
END = '<!-- END generated host table -->'

try:
    with open(TARGET, encoding='utf-8') as fh:
        original = fh.read()
except FileNotFoundError:
    sys.exit(
        f'{TARGET} does not exist. This script regenerates a table inside that\n'
        f'file; it does not create the file. Write the prose first, including the\n'
        f'{BEGIN} / {END} markers.'
    )

if BEGIN not in original or END not in original:
    sys.exit(
        f'{TARGET} is missing the generated-region markers.\n'
        f'Add these two lines where the table belongs:\n  {BEGIN}\n  {END}'
    )

if original.index(BEGIN) > original.index(END):
    sys.exit(f'{TARGET}: the END marker appears before the BEGIN marker.')


def cell(value):
    """Render a missing value as an en dash rather than the word None."""
    return '–' if value in (None, '') else str(value)


rows = []
for key in sorted(HOSTS):
    host = HOSTS[key]
    rows.append(
        '| {display} | `{key}` | {consumes} | `{install}` | {tested} | {unit}, default {default} |'.format(
            display=host['display'],
            key=key,
            consumes=host['consumes'],
            install=host['install'],
            tested=cell(host['tested_version']),
            unit=host['hook_timeout_unit'],
            default=host['hook_timeout_default'],
        )
    )

lines = [
    BEGIN,
    '<!-- GENERATED - DO NOT EDIT BY HAND. Regenerate with: bash scripts/gen-hosts-table.sh -->',
    '',
    '| Host | Key | How it consumes erfana | Install | Version tested | Hook `timeout` |',
    '|---|---|---|---|---|---|',
    *rows,
    '',
    'Derived from `scripts/_lib/host_matrix.py`. The Qwen row was read from bundle',
    f"`{QWEN_BUNDLE['observed_file']}` at version {QWEN_BUNDLE['observed_version']}",
    f"(sha256 `{QWEN_BUNDLE['observed_sha256'][:16]}…`); `scripts/qwen-smoke.sh` re-reads that",
    'chunk from the installed Qwen and reports when the digest moves.',
    END,
]

start = original.index(BEGIN)
finish = original.index(END) + len(END)
updated = original[:start] + '\n'.join(lines) + original[finish:]

if updated == original:
    print('PASS: docs/hosts.md host table already current')
else:
    with open(TARGET, 'w', encoding='utf-8') as fh:
        fh.write(updated)
    print(f'WROTE: docs/hosts.md host table ({len(rows)} host(s))')
PYEOF
