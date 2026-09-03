#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# gate-15-doc-claims.sh – verifies that prose claims about plugin shape stay
# in sync with the actual filesystem. Catches seven classes of drift that
# manual review repeatedly missed pre-v4.1.2:
#
#   1. CLAUDE.md "Current version: **vX.Y.Z**" banner not bumped on release
#      (v4.1.1 release commit shipped with the banner still at v4.1.0).
#   2. Per-skill internal agent counts in CLAUDE.md / README.md /
#      docs/architecture.md / MAINTAINER.md ("Ships 23 internal agents",
#      "23 skill-internal agents") that diverge from
#      `ls skills/managing-<name>/agents/`.
#   3. Plugin-root agent count claims ("75 shared agents") that diverge
#      from `ls agents/*.md`.
#   4. Top-level skills count claims ("13 skills", "13 auto-discovered
#      skills") that diverge from `ls skills/` (added
#      v4.1.3+).
#   5. Hooks count claims ("4 safety hooks", "4 hook scripts") that
#      diverge from `ls hooks/*.sh` (added v4.1.3+).
#   6. Slash command count claims ("1 slash command") that diverge from
#      `ls commands/*.md` (added v4.1.3+).
#   7. Per-gate detail-file count claims ("16 per-gate detail files",
#      "gates/01-16") that diverge from `ls docs/gates/*.md` (added v6.0.0;
#      the v6.0.0 "16 -> 17" drift on Gate 17 shipped because no check
#      covered this class).
#
# Hard gate. Wired into scripts/run-all-gates.sh between Gate 14 (hooks)
# and Gate 17 (publication readiness).
#
# Standalone runner – `bash scripts/gate-15-doc-claims.sh`.

set -euo pipefail

cd "$(dirname "$0")/.."

python3 <<'PYEOF'
import json
import os
import re
import sys
from glob import glob

errors = []
passes = []

# Docs scanned for count claims. CLAUDE.md is also the home of the
# "Current version" banner (Check 1). MAINTAINER.md added v4.1.3+ for
# the skills/hooks/commands count claims on its "Plugin scope" line.
# Extended v4.2.2: skills/using-erfana/SKILL.md and docs/verification-gates.md
# carry plugin-shape claims that were drifting outside Gate 15's scope. Adding
# them here makes 75→76 (and similar) sweeps CI-blocking on the next release.
docs_to_scan = [
    'CLAUDE.md',
    'README.md',
    'docs/architecture.md',
    'MAINTAINER.md',
    'skills/using-erfana/SKILL.md',
    'docs/verification-gates.md',
    # Added with Gate 18: the generated registry states its own skill count in
    # prose, which Gate 18 does not parse (it reads table rows only).
    'docs/skill-registry.md',
    # Added v7.1.0 with the second host: both carry plugin-shape counts, and
    # docs/hosts.md is the single source of truth other docs link to, so a
    # stale count there propagates rather than sitting in one file.
    'docs/hosts.md',
    'CONTRIBUTING.md',
]

# === Check 1: CLAUDE.md "Current version: **vX.Y.Z**" matches plugin.json ===
plugin_version = json.load(open('.claude-plugin/plugin.json'))['version']
claude_md = open('CLAUDE.md').read()
banner = re.search(r'Current version:\s*\*\*v([0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.]+)?)\*\*', claude_md)
if not banner:
    errors.append('CLAUDE.md: no "Current version: **vX.Y.Z**" banner found (Gate 15 requires one near the top of the file)')
elif banner.group(1) != plugin_version:
    errors.append(f'CLAUDE.md "Current version: **v{banner.group(1)}**" disagrees with plugin.json version "{plugin_version}"')
else:
    passes.append(f'CLAUDE.md "Current version" v{plugin_version} matches plugin.json')

# === Check 2: per-skill internal agent counts ===
# Walk every skills/<name>/agents/ directory; count .md files. Then scan
# the docs for prose claims and compare.
fs_counts = {}
for skill_dir in sorted(glob('skills/*/')):
    # normpath handles both / and \ separators + trailing slash, so basename
    # resolves correctly on Windows (glob returns backslash paths there).
    skill = os.path.basename(os.path.normpath(skill_dir))
    agents_dir = os.path.join(skill_dir, 'agents')
    if os.path.isdir(agents_dir):
        fs_counts[skill] = sum(1 for f in os.listdir(agents_dir) if f.endswith('.md'))
    else:
        fs_counts[skill] = 0

# Patterns that claim a count for a specific skill in prose. Each pattern
# must contain a single numeric capture group; the regex matches a sentence
# / bullet that mentions the skill name.
COUNT_PATTERNS = [
    r'Ships\s+(\d+)\s+(?:internal|skill-internal|management)\s+agents',
    r'(\d+)\s+skill-internal\s+agents',
    r'(\d+)\s+internal\s+agents',
]

DIR_REF_PATTERN = re.compile(r'(managing-[a-z-]+)/agents/`?\s*\((\d+)\)')

prose_issues = []
for doc in docs_to_scan:
    if not os.path.isfile(doc):
        continue
    lines = open(doc).read().split('\n')
    for i, line in enumerate(lines, start=1):
        # Restrict to lines that mention exactly one managing-* skill, to
        # avoid false positives on aggregate / comparison sentences.
        skills_in_line = [s for s in fs_counts if s in line]
        if len(skills_in_line) == 1:
            skill = skills_in_line[0]
            expected = fs_counts[skill]
            for pat in COUNT_PATTERNS:
                m = re.search(pat, line)
                if not m:
                    continue
                claimed = int(m.group(1))
                if claimed != expected:
                    prose_issues.append(
                        f'{doc}:{i}: "{m.group(0)}" near `{skill}` disagrees with filesystem ({expected})'
                    )
                break  # only flag first matching pattern per line
        # Also handle inline directory references like `managing-articles/agents/` (23)
        for m in DIR_REF_PATTERN.finditer(line):
            skill, claimed = m.group(1), int(m.group(2))
            if skill not in fs_counts:
                continue
            expected = fs_counts[skill]
            if claimed != expected:
                prose_issues.append(
                    f'{doc}:{i}: "{m.group(0)}" disagrees with filesystem ({expected})'
                )

if prose_issues:
    errors.extend(prose_issues)
else:
    n = sum(1 for v in fs_counts.values() if v > 0)
    passes.append(f'per-skill agent-count claims align with filesystem ({n} skill(s) with internal agents; {len(docs_to_scan)} doc(s) scanned)')

# === Check 3: plugin-root agents/ count ===
if os.path.isdir('agents'):
    plugin_root_count = sum(1 for f in os.listdir('agents') if f.endswith('.md'))
    root_count_pattern = re.compile(r'(\d+)\s+shared\s+agents')
    for doc in docs_to_scan:
        if not os.path.isfile(doc):
            continue
        for m in root_count_pattern.finditer(open(doc).read()):
            claimed = int(m.group(1))
            if claimed != plugin_root_count:
                errors.append(
                    f'{doc}: claims "{claimed} shared agents" but agents/ has {plugin_root_count} files'
                )
                break  # one error per doc is enough
    passes.append(f'plugin-root agents/ count {plugin_root_count} aligns with all "X shared agents" claims')

# === Check 4 (v4.1.3+): top-level skills count ===
# `ls skills/`.
# Pattern: "13 skills" or "13 auto-discovered skills". Negative lookahead
# excludes path-like uses (skills/foo) and compounds (skills-related).
skills_count = sum(
    1 for d in os.listdir('skills')
    if os.path.isdir(os.path.join('skills', d))
)
skills_pattern = re.compile(r'(\d+)\s+(?:auto-discovered\s+)?skills\b(?![/-])')
for doc in docs_to_scan:
    if not os.path.isfile(doc):
        continue
    for m in skills_pattern.finditer(open(doc).read()):
        claimed = int(m.group(1))
        if claimed != skills_count:
            errors.append(
                f'{doc}: "{m.group(0)}" disagrees with skills/ count ({skills_count})'
            )
            break  # one error per doc
passes.append(f'skills/ count {skills_count} aligns with all "X (auto-discovered) skills" claims')

# === Check 5 (v4.1.3+): hooks count ===
# `ls hooks/*.sh`. Patterns: "4 safety hooks" or "4 hook scripts".
# dispatch.sh is the cross-platform launcher (plumbing), not a safety hook, so
# it is excluded from the count. Each safety hook has a .sh + .ps1 sibling; we
# count the .sh implementations only (.ps1 are the Windows mirror).
LAUNCHER_SCRIPTS = {'dispatch.sh'}
if os.path.isdir('hooks'):
    hooks_count = sum(1 for f in os.listdir('hooks')
                      if f.endswith('.sh') and f not in LAUNCHER_SCRIPTS)
    hooks_pattern = re.compile(r'(\d+)\s+(?:safety\s+hooks?|hook\s+scripts?)\b(?![/-])')
    for doc in docs_to_scan:
        if not os.path.isfile(doc):
            continue
        for m in hooks_pattern.finditer(open(doc).read()):
            claimed = int(m.group(1))
            if claimed != hooks_count:
                errors.append(
                    f'{doc}: "{m.group(0)}" disagrees with hooks/*.sh count ({hooks_count})'
                )
                break  # one error per doc
    passes.append(f'hooks/*.sh count {hooks_count} aligns with all "X (safety) hook(s) / hook scripts" claims')

# === Check 6 (v4.1.3+): slash commands count ===
# `ls commands/*.md`. Pattern: "1 slash command" / "X slash commands".
if os.path.isdir('commands'):
    commands_count = sum(1 for f in os.listdir('commands') if f.endswith('.md'))
    commands_pattern = re.compile(r'(\d+)\s+slash\s+commands?\b(?![/-])')
    for doc in docs_to_scan:
        if not os.path.isfile(doc):
            continue
        for m in commands_pattern.finditer(open(doc).read()):
            claimed = int(m.group(1))
            if claimed != commands_count:
                errors.append(
                    f'{doc}: "{m.group(0)}" disagrees with commands/*.md count ({commands_count})'
                )
                break  # one error per doc
    passes.append(f'commands/*.md count {commands_count} aligns with all "X slash command(s)" claims')

# === Check 7 (v6.0.0+): per-gate detail-file count ===
# `ls docs/gates/*.md`. Guards claims about the NUMBER of per-gate detail
# files ("N per-gate detail files") and the range enumeration ("gates/01-N").
# Narrowly scoped on purpose: it must NOT match generic "N gates" / "N hard
# gates" / "Eighteen static checks" phrasings, the Gate-15 "Seven classes
# ... (7)" self-reference, or the historical "01-cjk.md ... 15-doc-claims.md"
# prose (no digit immediately before the dash there).
if os.path.isdir('docs/gates'):
    gate_files_count = sum(1 for f in os.listdir('docs/gates') if f.endswith('.md'))
    gate_file_patterns = [
        re.compile(r'(\d+)\s+per-gate\s+detail\s+files?'),
        re.compile(r'gates/01[-–](\d+)'),
    ]
    for doc in docs_to_scan:
        if not os.path.isfile(doc):
            continue
        text = open(doc).read()
        flagged = False
        for pat in gate_file_patterns:
            for m in pat.finditer(text):
                if int(m.group(1)) != gate_files_count:
                    errors.append(
                        f'{doc}: "{m.group(0)}" disagrees with docs/gates/*.md count ({gate_files_count})'
                    )
                    flagged = True
                    break
            if flagged:
                break
    passes.append(f'docs/gates/*.md count {gate_files_count} aligns with all "X per-gate detail files" / "gates/01-X" claims')

# === Check 8: the Qwen Code version is stated once, in host_matrix.py ===
#
# The first version matched only `Qwen Code v?X.Y.Z` across docs_to_scan, which
# read three of eight sites: the bold form in CLAUDE.md, the table cell in
# docs/hosts.md, "Qwen 0.22.3" without "Code" in CHANGELOG.md and
# known-caveats.md, and ROADMAP.md (not scanned at all) all drifted freely while
# the gate reported agreement. It also never compared host_matrix.py's own three
# version fields to each other.
#
# It was simultaneously too strict: a legitimate historical sentence ("fixed
# upstream in Qwen Code 0.23.1", "0.21.0 and earlier are unsupported") would
# hard-fail a release. Lines carrying a historical marker are exempt.
sys.path.insert(0, 'scripts')
from _lib.host_matrix import HOSTS, QWEN_BUNDLE

tested = HOSTS['qwen-code']['tested_version']
if tested:
    # 8a: host_matrix.py must agree with itself first.
    observed = QWEN_BUNDLE.get('observed_version')
    if observed and observed != tested:
        errors.append(
            f'scripts/_lib/host_matrix.py: QWEN_BUNDLE observed_version {observed} '
            f'disagrees with HOSTS tested_version {tested}. The alias tables were '
            f'read out of the observed bundle; testing a different version certifies '
            f'a transcription nobody made.'
        )
    minimum = HOSTS['qwen-code'].get('min_version')
    if minimum and tuple(int(x) for x in minimum.split('.')) > tuple(int(x) for x in tested.split('.')):
        errors.append(
            f'scripts/_lib/host_matrix.py: min_version {minimum} is newer than '
            f'tested_version {tested}'
        )

    # 8b: every stated site.
    VERSION_FILES = sorted(set(docs_to_scan) | {
        'ROADMAP.md', 'CHANGELOG.md', 'docs/known-caveats.md',
    })
    HISTORICAL = re.compile(
        r'\b(and (?:earlier|older)|or earlier|before|upstream in|fixed in|'
        r'previously|used to|no longer|prior to)\b', re.I)
    QWEN_VERSION = re.compile(r'Qwen(?:\s+Code)?\b[^\n]{0,40}?\b(\d+\.\d+\.\d+)')

    version_sites = []
    for wf in sorted(glob(".github/workflows/*.yml")):
        for m in re.finditer(r'@qwen-code/qwen-code@(\d+\.\d+\.\d+)', open(wf).read()):
            version_sites.append((wf, m.group(1), m.group(0)))
    for doc in VERSION_FILES:
        if not os.path.isfile(doc):
            continue
        for line in open(doc).read().split('\n'):
            if HISTORICAL.search(line):
                continue
            for m in QWEN_VERSION.finditer(line):
                version_sites.append((doc, m.group(1), m.group(0).strip()))

    for where, found, snippet in version_sites:
        if found != tested:
            errors.append(
                f'{where}: "{snippet}" disagrees with scripts/_lib/host_matrix.py '
                f'tested_version ({tested}). The alias table and the frontmatter '
                f'rules were transcribed out of one Qwen bundle; bump both together '
                f'or CI certifies a version nobody read. (A sentence about a '
                f'different version that is deliberately historical needs a marker '
                f'word such as "and earlier" or "upstream in".)'
            )
    passes.append(
        f'Qwen Code version {tested} agrees across host_matrix.py and '
        f'{len(version_sites)} stated site(s)'
    )

# === Output ===
if errors:
    print('  FAIL: %d doc-claim issue(s):' % len(errors))
    for e in errors:
        print(f'    {e}')
    sys.exit(1)

for p in passes:
    print(f'  PASS: {p}')
PYEOF
