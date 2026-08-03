# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
"""Gate 2 reasoning-display detector (Section 12.7 / 13.5, v6.3.0).

Prose instructing a model to surface its internal reasoning trips the
reasoning_extraction refusal classifier on Claude Fable 5 and Claude Opus 5
(stop_reason "refusal"; re-routes to Opus 4.8 where fallback is configured).

Shared by scripts/run-all-gates.sh (Gate 2) and the Gate 2 fixture runner so
both always execute the same code. Fixtures: tests/gate-02-fixtures/.

Detection escapes, in order per line:
1. fenced code blocks (``` / ~~~) are skipped entirely;
2. backtick spans are stripped (odd backtick count => whole line treated as
   prose, failing open toward detection);
3. rule-definition / negation context on the stripped text suppresses the line;
4. an explicit allow-comment on the same or preceding line suppresses the line:
   <!-- gate2-allow: reasoning-display -- <reason> -->
   Allow-comments that cover no match are reported as stale.
"""
import re

REASONING_DISPLAY = re.compile(
    r"\b(?:show|display|surface|reveal|expose|narrate|print|output|share|state|include|reproduce|explain|verbalize|articulate)\w*\s+(?:me\s+)?(?:your|its|internal)\s+(?:[\w-]+\s+){0,2}(?:reasoning|thinking|thought[- ]process|chain[- ]of[- ]thought|work|scratchpad)\b"
    r"|\bmake\s+your\s+(?:\w+\s+){0,2}(?:reasoning|thinking)\s+visible\b"
    r"|\bwalk\s+(?:me|us|the user)\s+through\s+your\s+(?:reasoning|thinking)\b"
    r"|\bdisplay:\s*visible\b",
    re.IGNORECASE)

NEGATION_CONTEXT = re.compile(
    r"❌|⚠"
    r"|\bMUST NOT\b|\bnever\b|\bnot\s+instruct\b|\bno\s+prose\b|\bdon't\b|\bdo not\b"
    r"|\breject(?:s|ed|ing)?\b|\bremov(?:e|es|ed|ing|al)\b|\bdrop(?:s|ped|ping)?\b|\bwithdrawn\b"
    r"|\bhazard\b|\btrips?\b|\bfallback\b|\brefusal\b|\bban(?:s|ned|ning)?\b|\bexempt\b|\bforbidden\b|\banti-pattern\b"
    r"|\bGrep\b|\bregexp?\b|\bdetect(?:s|or|ion|ed|ing)?\b",
    re.IGNORECASE)

ALLOW_RE = re.compile(r"<!--\s*gate2-allow:\s*reasoning-display\b.*?-->", re.IGNORECASE | re.DOTALL)
FENCE_RE = re.compile(r"^\s*(```|~~~)")


def _outside_code(line):
    """Text outside backtick code spans; odd backtick count => whole line (fail open)."""
    if line.count('`') % 2:
        return line
    return ' '.join(line.split('`')[0::2])


def scan(text):
    """Scan full file text. Returns (hits, stale_allows).

    hits: list of (line_number, snippet) - genuine reasoning-display instructions.
    stale_allows: list of line_numbers - allow-comments covering no match.
    Line numbers are 1-based absolute file lines.
    """
    lines = text.splitlines()
    in_fence = False
    fence_flags = []
    for line in lines:
        if FENCE_RE.match(line):
            in_fence = not in_fence
            fence_flags.append(True)  # the fence marker line itself is skipped
        else:
            fence_flags.append(in_fence)

    hits, stale = [], []
    for i, line in enumerate(lines):
        if fence_flags[i]:
            continue
        outside = _outside_code(line)
        if not REASONING_DISPLAY.search(outside):
            continue
        if NEGATION_CONTEXT.search(outside):
            continue
        allowed = ALLOW_RE.search(line) or (
            i > 0 and not fence_flags[i - 1] and ALLOW_RE.search(lines[i - 1]))
        if allowed:
            continue
        hits.append((i + 1, line.strip()[:100]))

    for i, line in enumerate(lines):
        if fence_flags[i] or not ALLOW_RE.search(line):
            continue
        covered = REASONING_DISPLAY.search(_outside_code(line))
        if not covered and i + 1 < len(lines) and not fence_flags[i + 1]:
            covered = REASONING_DISPLAY.search(_outside_code(lines[i + 1]))
        if not covered:
            stale.append(i + 1)
    return hits, stale
