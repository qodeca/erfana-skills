#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# gen-skill-registry.sh - regenerates docs/skill-registry.md from git history.
#
# The registry answers one question: "when was each shipped skill last
# touched, and by what change?" Every value is derived - the date and the
# subject come from `git log -1` scoped to skills/<name>/, the skill list
# comes from `ls skills/` - so the file
# cannot drift from reality the way a hand-maintained table does.
#
#   bash scripts/gen-skill-registry.sh
#
# Verification lives in scripts/gate-18-skill-registry.sh, which reads the
# committed table rather than diffing whole files: a stale date is a warning
# (dates go stale the moment a skill is committed), while a drifted skill list
# or a value git cannot account for is a hard failure.
#
# Row rendering (subject truncation + pipe escaping) and the sort order are
# implemented here in Python and MIRRORED in the gate. Change one, change both,
# or the gate will read rows this script never emits. Python is deliberate: the
# bash equivalents of `${#s}` / `${s:0:69}` are byte-based under LC_ALL=C, which
# can cut a multi-byte character in half and write invalid UTF-8 into a .md file
# that Gate 1 is supposed to guarantee.
#
# Refuses to run in a shallow clone: `git log -1 -- <path>` there reports the
# grafted tip commit for EVERY path (the shallow boundary looks like a root
# commit that introduced the whole tree), which would silently stamp every skill
# with the same date and subject. CI checks out with fetch-depth: 0.

set -euo pipefail

cd "$(dirname "$0")/.."

if [[ $# -gt 0 ]]; then
  echo "usage: $0   (no arguments; verification lives in gate-18-skill-registry.sh)" >&2
  exit 2
fi

python3 <<'PYEOF'
import os
import subprocess
import sys
from glob import glob

TARGET = 'docs/skill-registry.md'

if subprocess.run(['git', 'rev-parse', '--is-shallow-repository'],
                  capture_output=True, text=True).stdout.strip() == 'true':
    sys.exit(
        'refusing to generate from a shallow clone: every skill would be stamped\n'
        'with the same tip commit. Deepen first: git fetch --unshallow'
    )

skills = sorted(
    os.path.basename(os.path.normpath(d))
    for d in glob('skills/*/')
)


def git_log(fmt, skill, extra=()):
    out = subprocess.run(
        ['git', 'log', '-1', f'--format={fmt}', *extra, '--', f'skills/{skill}/'],
        capture_output=True, text=True,
    )
    return out.stdout.strip()


def render_subject(subject):
    """Truncate first, escape second - MIRRORED in gate-18-skill-registry.sh.

    Escaping first would let the backslashes eat into the 72-char budget and
    let the cut land between a backslash and its pipe, leaving a dangling `\\`.
    """
    if len(subject) > 72:
        subject = subject[:69] + '...'
    return subject.replace('|', r'\|')


rows = []
for skill in skills:
    date = git_log('%ad', skill, ('--date=short',)) or 'uncommitted'
    subject = git_log('%s', skill) or 'not yet committed'
    rows.append((date, skill, subject))

# Newest first, ties broken by skill name, so output is stable across machines
# and re-runs. Uncommitted skills sort to the top - they are the ones a reader
# most needs to notice.
rows.sort(key=lambda r: r[1])                                          # name asc
rows.sort(key=lambda r: (r[0] == 'uncommitted', r[0]), reverse=True)  # then date desc

lines = [
    '# Skill registry',
    '',
    '<!-- GENERATED FILE - DO NOT EDIT BY HAND. -->',
    '<!-- Regenerate with: bash scripts/gen-skill-registry.sh -->',
    '',
    'Every skill this plugin ships, and when it was last changed. Generated from',
    'git history by [`scripts/gen-skill-registry.sh`](../scripts/gen-skill-registry.sh)',
    'and checked by Gate 18, which hard-fails if this list stops matching',
    '`ls skills/` or a row carries a value git cannot account for.',
    '',
    '**Last updated** is the date of the most recent commit touching',
    "`skills/<name>/`, and **Last change** is that commit's subject.",
    '',
    '> Dates lag between releases – the commit that changes a skill is the same',
    '> commit that dates its row, so a refresh is always one step behind. Gate 18',
    '> warns rather than blocks on that, and the release process regenerates this',
    '> file, so it is accurate as of every shipped version.',
    '',
    '| Skill | Last updated | Last change |',
    '|---|---|---|',
]
for date, skill, subject in rows:
    lines.append(f'| {skill} | {date} | {render_subject(subject)} |')

lines += [
    '',
    f'{len(rows)} skills, one row per folder under `skills/`.',
    '',
    '## Reading the dates',
    '',
    'A cluster of skills sharing one old date usually means "not touched since the',
    'last flattening event", not "created that day". The v6.0.0 open-source release',
    'was a fresh-repo publish, so everything that predates it collapsed into that',
    'single commit; the granular history for those skills lives in the archived',
    'private repository.',
    '',
]

open(TARGET, 'w').write('\n'.join(lines))
print(f'wrote {TARGET} ({len(rows)} skills)')
PYEOF
