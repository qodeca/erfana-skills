#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# run-all-gates.sh — single-command runner for the verification gates in docs/verification-gates.md.
# Used both pre-commit and in CI (.github/workflows/verify.yml).
# Exit non-zero on the first failure.

set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Gate 1 — zero CJK ==="
python3 <<'PYEOF'
import os, re, sys
CJK = re.compile(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]')
EXTS = {'.md','.json','.html','.js','.mjs','.jsx','.py','.sh','.svg','.yml','.yaml'}
SKIP = {'.git','node_modules','_translation-scratch','temp'}
hits = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in SKIP]
    for f in files:
        if os.path.splitext(f)[1] not in EXTS and f != '.gitignore': continue
        p = os.path.join(root, f)
        try: c = open(p, encoding='utf-8', errors='replace').read()
        except: continue
        m = CJK.findall(c)
        if m: hits.append((p, len(m)))
if hits:
    print(f'FAIL: {len(hits)} files with CJK')
    for p, n in hits: print(f'  {p}: {n}')
    sys.exit(1)
print('PASS: no CJK')
PYEOF

echo "=== Gate 2 — YAML frontmatter (skills + agents) ==="
python3 <<'PYEOF'
import yaml, glob, os, sys, re
sys.path.insert(0, 'scripts/_lib')
from gate2_detector import scan as reasoning_display_scan
ok = True

# First-person voice patterns (Section 12.1)
FIRST_PERSON = re.compile(r"\b(I can help|You can use|I'll help|I will help)\b", re.IGNORECASE)

# Quoted-phrase trigger detection (Section 12.2)
QUOTED_PHRASE = re.compile(r'"[^"]{3,}"')

def read_text(fp):
    """utf-8 read with explicit failure reporting (matches Gate 1's convention)."""
    try:
        with open(fp, encoding='utf-8') as fh:
            return fh.read()
    except OSError as e:
        print(f'FAIL: {fp} unreadable: {e}')
        return None

def parse_frontmatter(fp, text):
    """Return the frontmatter mapping, or None (with FAIL printed) when absent/invalid."""
    parts = text.split('---')
    if len(parts) < 3:
        print(f'FAIL: {fp} has no YAML frontmatter')
        return None
    m = yaml.safe_load(parts[1])
    if not isinstance(m, dict):
        print(f'FAIL: {fp} frontmatter is not a YAML mapping')
        return None
    return m

def report_reasoning_display(fp, text, section):
    """Reasoning-display detection (Section 12.7 / 13.5, v6.3.0) via scripts/_lib/gate2_detector.py.
    Scans the FULL file text, so reported line numbers are absolute."""
    hits, stale = reasoning_display_scan(text)
    for ln, snippet in hits:
        print(f'WARN: {fp}:{ln} instructs reasoning display: "{snippet}" — trips the Claude 5 reasoning_extraction refusal classifier (Section {section})')
    for ln in stale:
        print(f'WARN: {fp}:{ln} stale gate2-allow comment (covers no reasoning-display match) — remove it')

# Skills: require name + description; description checks include model patterns (added v4.2.0).
for fp in sorted(glob.glob('skills/*/SKILL.md')):
    text = read_text(fp)
    if text is None:
        ok = False
        continue
    m = parse_frontmatter(fp, text)
    if m is None:
        ok = False
        continue
    if 'name' not in m:
        print(f'FAIL: {fp} missing name field')
        ok = False
    if 'description' not in m:
        print(f'FAIL: {fp} missing description field')
        ok = False
    if 'description' in m and len(m['description']) > 500:
        print(f'WARN: {fp} description is {len(m["description"])} chars (>500); review for workflow language')

    # Model patterns, Section 12 (added v4.2.0; soft warnings)
    desc = m.get('description', '')
    when = m.get('when_to_use', '') or ''
    combined_len = len(desc) + len(when)

    # 12.1: first-person voice
    if FIRST_PERSON.search(desc) or FIRST_PERSON.search(when):
        print(f'WARN: {fp} description uses first-person voice ("I can help" / "You can use" / "I\'ll help"); rewrite to third-person (Section 12.1)')

    # 7.4 / 12.3 (corrected): combined limit per Anthropic docs
    if combined_len > 1536:
        print(f'WARN: {fp} description+when_to_use combined is {combined_len} chars (Anthropic limit 1,536, item 7.4)')

    # 12.2: ≥3 quoted activation phrases in when_to_use
    if when:
        triggers = QUOTED_PHRASE.findall(when)
        if len(triggers) < 3:
            print(f'WARN: {fp} when_to_use has {len(triggers)} quoted trigger phrases (recommended ≥3, Section 12.2)')

    # 12.7 (v6.3.0): reasoning-display instructions
    report_reasoning_display(fp, text, '12.7')

    print(f'  {fp} → name={m.get("name", "?")}')

# Agents: require name + description; invariant: name == filename basename.
# Plus model patterns: warn if effort/model fields missing on ms-* agents; warn if deprecated APIs declared.
# Detection: deprecated APIs as YAML-style keys at start of line (with optional indent), NOT mentions
# inside backticks/code-references (e.g. "Grep -nE \"temperature:|...\"" in detection regexes).
# Match: `temperature: 0.7` (line-start, key:value)
# Skip: `... "temperature:" ...` (mention inside string)
DEPRECATED_API = re.compile(r'^\s{0,4}(temperature|top_p|top_k|budget_tokens)\s*:\s*\S', re.IGNORECASE | re.MULTILINE)

if os.path.isdir('agents'):
    for fp in sorted(glob.glob('agents/*.md')):
        text = read_text(fp)
        if text is None:
            ok = False
            continue
        m = parse_frontmatter(fp, text)
        if m is None:
            ok = False
            continue
        if 'name' not in m:
            print(f'FAIL: {fp} missing name field')
            ok = False
        if 'description' not in m:
            print(f'FAIL: {fp} missing description field')
            ok = False
        expected = os.path.basename(fp)[:-3]
        if m.get('name') and m.get('name') != expected:
            print(f'FAIL: {fp} name "{m.get("name")}" does not match basename "{expected}"')
            ok = False

        # Model patterns for agents (added v4.2.0; revised v6.3.0; soft warnings)
        # Item 13.1: effort field on ms-* agents
        if expected.startswith('ms-') and 'effort' not in m:
            print(f'WARN: {fp} missing `effort` field (Section 13.1; ms-* agents should declare per Model Selection Guide)')

        # Item 13.2: model field on ms-* agents
        if expected.startswith('ms-') and 'model' not in m:
            print(f'WARN: {fp} missing `model` field (Section 13.2; ms-* agents should declare per Model Selection Guide)')

        # Item 13.4: deprecated APIs in agent body
        body = text.split('---', 2)[2] if text.count('---') >= 2 else text
        if DEPRECATED_API.search(body):
            match = DEPRECATED_API.search(body)
            print(f'WARN: {fp} body contains deprecated API reference "{match.group(0)}" — deprecated on Opus 4.7 and later / Claude 5 models (Section 13.3/13.4)')

        # Item 13.5 (v6.3.0): reasoning-display instructions
        report_reasoning_display(fp, text, '13.5')

        print(f'  {fp} → name={m.get("name", "?")}')

# Widened reasoning-display sweep (v6.3.0): instructional prose beyond SKILL.md and plugin-root
# agents — nested agents, references, templates, guides, validation, examples, slash commands.
EXTRA_GLOBS = ['skills/*/agents/*.md', 'skills/*/references/*.md', 'skills/*/templates/*.md',
               'skills/*/guides/*.md', 'skills/*/validation/*.md', 'skills/*/examples/*.md',
               'commands/*.md']
extra_files = sorted(set(fp for g in EXTRA_GLOBS for fp in glob.glob(g)))
for fp in extra_files:
    text = read_text(fp)
    if text is None:
        ok = False
        continue
    report_reasoning_display(fp, text, '12.7')
print(f'  reasoning-display sweep covered {len(extra_files)} additional prose files')

if not ok: sys.exit(1)
print('PASS: all skill and agent frontmatters valid')
PYEOF

echo "=== Gate 2 — reasoning-display detector fixtures ==="
python3 <<'PYEOF'
import glob, os, sys
sys.path.insert(0, 'scripts/_lib')
from gate2_detector import scan

ok = True
FIXDIR = 'tests/gate-02-fixtures'
if not os.path.isdir(FIXDIR):
    print(f'FAIL: {FIXDIR} missing — detector fixtures are required')
    sys.exit(1)

# Valid fixtures: must produce zero hits and zero stale allows.
for fp in sorted(glob.glob(f'{FIXDIR}/valid/*.md')):
    with open(fp, encoding='utf-8') as fh:
        hits, stale = scan(fh.read())
    for ln, snippet in hits:
        print(f'FAIL: false positive in {fp}:{ln}: "{snippet}"')
        ok = False
    for ln in stale:
        print(f'FAIL: stale-allow misfire in {fp}:{ln}')
        ok = False

# Invalid fixtures: hits must equal the expected.txt manifest exactly (file:line per line).
expected = set()
with open(f'{FIXDIR}/invalid/expected.txt', encoding='utf-8') as fh:
    for raw in fh:
        raw = raw.strip()
        if raw and not raw.startswith('#'):
            expected.add(raw)
actual = set()
for fp in sorted(glob.glob(f'{FIXDIR}/invalid/*.md')):
    with open(fp, encoding='utf-8') as fh:
        hits, _stale = scan(fh.read())
    for ln, _snippet in hits:
        actual.add(f'{os.path.basename(fp)}:{ln}')
for miss in sorted(expected - actual):
    print(f'FAIL: expected detection missing (false negative): {miss}')
    ok = False
for extra in sorted(actual - expected):
    print(f'FAIL: unexpected detection (not in manifest): {extra}')
    ok = False

if not ok: sys.exit(1)
print(f'PASS: detector fixtures — {len(expected)} expected detections hit, no false positives')
PYEOF

echo "=== Gate 3 — JSON parse ==="
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json skills/design-shared/test-prompts.json skills/design-shared/assets/personal-asset-index.example.json skills/design-shared/brands/brand.schema.json; do
    python3 -m json.tool "$f" > /dev/null && echo "  PASS: $f"
done

echo "=== Gate 4 — script syntax ==="
python3 -c "import ast; ast.parse(open('skills/design-shared/scripts/verify.py').read())" && echo "  PASS: verify.py"
python3 -c "import ast; ast.parse(open('scripts/_lib/json_schema_lite.py').read())" && echo "  PASS: scripts/_lib/json_schema_lite.py"
for f in skills/design-shared/scripts/render-video.js skills/design-shared/scripts/html2pptx.js skills/design-shared/scripts/export_deck_pdf.mjs skills/design-shared/scripts/export_deck_pptx.mjs skills/design-shared/scripts/export_deck_stage_pdf.mjs skills/design-shared/assets/deck_stage.js; do
    [ -f "$f" ] && node --check "$f" 2>&1 && echo "  PASS: $f"
done

echo "=== Gate 5 — SVG + HTML ==="
python3 <<'PYEOF'
import re, sys, glob
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

errors = []
warnings = []
EXTERNAL_HREF = re.compile(r'^(https?://|data:|javascript:)', re.IGNORECASE)


def check_svg(path):
    try:
        tree = ET.parse(path)
    except Exception as e:
        errors.append(f'{path}: SVG parse failed: {e}')
        return
    root = tree.getroot()
    for el in root.iter():
        tag = el.tag.split('}')[-1] if isinstance(el.tag, str) else str(el.tag)
        if tag == 'script':
            errors.append(f'{path}: forbidden <script> element (XSS risk)')
        if tag == 'foreignObject':
            errors.append(f'{path}: forbidden <foreignObject> element (HTML-injection surface)')
        for attr_name, attr_val in el.attrib.items():
            local = attr_name.split('}')[-1]
            if local == 'href' and EXTERNAL_HREF.match(attr_val):
                errors.append(f'{path}: forbidden external href in <{tag}> (external/data/javascript)')
            if local.startswith('on') and len(local) > 2:
                errors.append(f'{path}: forbidden event-handler attribute "{local}" in <{tag}>')
    with open(path, encoding='utf-8') as fh:
        content = fh.read()
    if 'PLACEHOLDER' in content:
        warnings.append(f'{path}: PLACEHOLDER artwork — replace with real logo before shipping')


# 1. Banner SVG (existing single-file check, retained).
check_svg('skills/design-shared/assets/banner.svg')

# 2. Brand SVGs — runtime brand vocabulary (logos, shapes) is content-checked.
# Templates (slide masters under templates/ subfolders) are reference material,
# never loaded by render-video.js, so they bypass the script/foreignObject/
# external-href content rules. Authors review template content out-of-band
# when authoring skills that consume them. The exemption is folder-name based
# (any path segment named 'templates') so it is auditable in PR diffs.
brand_svgs = sorted(glob.glob('skills/design-shared/brands/**/*.svg', recursive=True))
brand_svgs = [s for s in brand_svgs if 'templates' not in s.replace('\\', '/').split('/')]
for s in brand_svgs:
    check_svg(s)

# 3. Demos and showcase HTML well-formedness (existing).
class V(HTMLParser):
    def error(self, msg):
        raise Exception(msg)


html_files = sorted(set(
    glob.glob('skills/design-shared/demos/*.html')
    + glob.glob('skills/design-shared/assets/showcases/**/*.html', recursive=True)
))
ok = bad = 0
for fp in html_files:
    try:
        with open(fp, encoding='utf-8') as fh:
            V(convert_charrefs=True).feed(fh.read())
        ok += 1
    except Exception as e:
        errors.append(f'{fp}: HTML parse failed: {e}')
        bad += 1

if errors:
    print(f'  FAIL: {len(errors)} SVG/HTML issue(s)')
    for e in errors:
        print(f'    {e}')
    sys.exit(1)

for w in warnings:
    print(f'  WARN: {w}')
print(f'  PASS: 1 banner + {len(brand_svgs)} brand SVG(s); {ok}/{ok+bad} HTML file(s)')
PYEOF

echo "=== Gate 6 — JSX braces ==="
for f in skills/design-shared/assets/*.jsx; do
    python3 -c "
content = open('$f').read()
assert content.count('{') == content.count('}'), 'brace mismatch'
assert content.count('(') == content.count(')'), 'paren mismatch'
assert content.count('[') == content.count(']'), 'bracket mismatch'
print('  PASS: $f')
"
done

echo "=== Gate 7 — cross-references resolve ==="
python3 <<'PYEOF'
import os, re, glob, sys

# Section heading allowlist. New variants surface as added false-negatives at
# review time; extend the allowlist when authoring conventions evolve.
HEADING = re.compile(r'^##\s+(References|Scripts|Examples|Assets|Demos|See also|Related|Related references)\s*:?\s*$', re.I)
ANY_HEADING = re.compile(r'^##\s+')
FENCE = re.compile(r'^```')
BULLET_FIRST_BACKTICK = re.compile(r'^\s*-\s+`([^`]+)`')
MD_LINK = re.compile(r'\[[^\]]*\]\(([^)]+)\)')

def is_internal_path(p):
    if any(p.startswith(x) for x in ('http://', 'https://', '#', 'mailto:')):
        return False
    if any(c in p for c in '*?['):  # glob pattern, documentation shorthand
        return False
    if not re.search(r'\.(md|jsx|js|mjs|py|sh|html|json|svg|mp3|mp4|png)$', p):
        return False
    return True

issues = []
seen = set()

# Pass 1: SKILL.md structural sections — first-backtick of each bullet only.
# Subsequent backticks on a bullet line describe the path, they are not new paths.
for src in sorted(glob.glob('skills/*/SKILL.md')):
    skill_dir = os.path.dirname(src)
    in_section = False
    in_fence = False
    for line in open(src, encoding='utf-8'):
        if FENCE.match(line):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if HEADING.match(line):
            in_section = True
            continue
        if ANY_HEADING.match(line):
            in_section = False
            continue
        if not in_section:
            continue
        m = BULLET_FIRST_BACKTICK.match(line)
        if not m:
            continue
        p = m.group(1).strip()
        if not is_internal_path(p):
            continue
        full = os.path.normpath(os.path.join(skill_dir, p))
        key = (src, p)
        if key in seen:
            continue
        seen.add(key)
        if not os.path.exists(full):
            issues.append((src, p))

# Pass 2: every SKILL.md, references/*.md, brand prose .md, and agents/*.md —
# markdown link syntax anywhere. This catches genuine broken links inside reference
# prose, inside brand bundles (CLAUDE.md, INDEX.md, RULES.md), and inside agent
# prompts without false positives; [text](path) markdown link syntax is unambiguous,
# unlike bare backticks. agents/*.md is empty until the agent-migration commit lands.
brand_md = glob.glob('skills/design-shared/brands/*/**/*.md', recursive=True)
agents_md = glob.glob('agents/*.md')
for src in sorted(glob.glob('skills/*/SKILL.md') + glob.glob('skills/*/references/*.md') + brand_md + agents_md):
    base_dir = os.path.dirname(src)
    content = open(src, encoding='utf-8').read()
    for m in MD_LINK.finditer(content):
        p = m.group(1).split()[0]  # ignore optional title
        if not is_internal_path(p):
            continue
        full = os.path.normpath(os.path.join(base_dir, p))
        key = (src, p)
        if key in seen:
            continue
        seen.add(key)
        if not os.path.exists(full):
            issues.append((src, p))

if issues:
    print(f'  FAIL: {len(issues)} broken cross-references')
    for src, p in issues:
        print(f'    {p}  (in {src})')
    sys.exit(1)
print(f'  PASS: {len(seen)} cross-references resolve')
PYEOF

echo "=== Gate 8 — trigger phrase coverage (across all sub-skills) ==="
python3 <<'PYEOF'
import yaml, glob, sys
combined = ''
for fp in sorted(glob.glob('skills/design-*/SKILL.md')):
    if 'design-shared' in fp:
        continue
    m = yaml.safe_load(open(fp).read().split('---')[1])
    combined += ' ' + (m.get('description', '') or '') + ' ' + (m.get('when_to_use', '') or '')
text = combined.lower()
categories = {
    'prototype': ['prototype', 'mockup'],
    'animation': ['animation', 'motion', 'mp4', 'gif'],
    'slides': ['slide deck', 'deck', 'pitch deck', 'keynote'],
    'advisor': ['design direction', 'design philosophy', 'recommend a style', 'what style', 'pick a style'],
    'critique': ['design review', 'critique'],
    'infographic': ['infographic', 'data visualization', 'data viz'],
}
hit = sum(1 for cat, phrases in categories.items() if any(p in text for p in phrases))
if hit != 6:
    missing = [cat for cat, phrases in categories.items() if not any(p in text for p in phrases)]
    print(f'  FAIL: {hit}/6 trigger categories present; missing: {missing}')
    sys.exit(1)
print(f'  PASS: {hit}/6 trigger categories present across sub-skills')
PYEOF

echo "=== Gate 9 — watermark consistency ==="
# Watermark literal is brand-output only ('Created with erfana', sourced from
# brand.json voice.watermark). Allowlist: legacy-brand reminder line in
# using-erfana, and template prose 'Created by default' in managing-specs which
# describes filesystem-creation behavior, not brand watermarking.
hits=$(grep -rnE 'Created (by|with)' skills/ 2>/dev/null | grep -v 'Created with erfana' | grep -v 'Never `Created by qodesign`' | grep -v 'legacy brand' | grep -v 'Created by default' || true)
if [ -n "$hits" ]; then
    echo "FAIL: non-canonical watermark (allowed: 'Created with erfana')"
    echo "$hits"
    exit 1
fi
echo "  PASS: all watermarks use 'Created with erfana'"

echo "=== Gate 10 — git history CJK-free ==="
git log --pretty=%s | python3 -c "
import sys, re
t = sys.stdin.read()
m = re.findall(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]', t)
if m:
    print(f'  FAIL: {len(m)} CJK chars in commit subjects')
    sys.exit(1)
print('  PASS')
"

echo "=== Gate 11 — brand consistency (no qodesign) ==="
hits=$(grep -r -i 'qodesign' skills/ .claude-plugin/ README.md LICENSE CHANGELOG.md SECURITY.md .github/ 2>/dev/null | grep -v 'using-erfana/SKILL.md' | grep -v 'CHANGELOG.md' || true)
# CHANGELOG retains historical mentions (renames, brand replacements). using-erfana retains legacy-brand reminder.
if [ -n "$hits" ]; then
    echo "FAIL: leftover qodesign strings:"
    echo "$hits"
    exit 1
fi
echo "  PASS: no qodesign strings outside the documented exceptions"

echo "=== Gate 12 — brand manifests valid ==="
bash scripts/gate-12-brand-manifests.sh

echo "=== Gate 14 — hooks valid ==="
# Validates hooks/hooks.json shape, ${CLAUDE_PLUGIN_ROOT} path discipline,
# script presence + executable + shebang, bash -n clean, and (if shellcheck
# is on PATH) shellcheck clean. Standalone runner under scripts/gate-14-hooks.sh.
bash scripts/gate-14-hooks.sh

echo "=== Gate 16 — verify-completion fixtures + sentinel symmetry ==="
# Replays tests/hooks/verify-completion/*.json through verify-completion.sh,
# asserts each fixture blocks or passes as expected. Also verifies the
# status-template sentinel string is present in both status command files and
# the hook so the allowlist cannot silently drift. Standalone runner under
# scripts/gate-16-hook-fixtures.sh.
bash scripts/gate-16-hook-fixtures.sh

echo "=== Gate 15 — doc-claim sync ==="
# Verifies prose claims about plugin shape stay in sync with the filesystem.
# Three checks: CLAUDE.md "Current version" matches plugin.json; per-skill
# agent counts in CLAUDE.md/README.md/docs/architecture.md match
# `ls skills/managing-*/agents/`; plugin-root agents/ count matches all
# "X shared agents" claims. Standalone runner under scripts/gate-15-doc-claims.sh.
bash scripts/gate-15-doc-claims.sh

echo "=== Gate 17 — publication readiness ==="
bash scripts/gate-17-publication-readiness.sh

echo "=== Gate 18 — skill registry sync ==="
# Reads the committed docs/skill-registry.md and checks it against `ls skills/`
# + `git log`. Hard-fails on a drifted skill list, a duplicate row, or a value
# git cannot account for; warns (without blocking) when dates merely lag, which
# they do by construction between releases. Deliberately NOT a whole-file diff -
# see docs/gates/18-skill-registry.md. Fix with: bash scripts/gen-skill-registry.sh.
# Standalone runner under scripts/gate-18-skill-registry.sh.
bash scripts/gate-18-skill-registry.sh

echo "=== Gate 13 — brandbook hex coverage (soft) ==="
# Verifies any brandbook-defined hex codes (scripts/_lib/brandbook-hex-inventory.json)
# are present in the matching brand tokens; the default erfana brand ships none.
# Catches transcription typos that schema validation cannot see.
# Currently soft (non-blocking) per ROADMAP integration plan – future hardening
# turns the trailing `|| ...` clause into a hard fail when the script stabilises.
bash scripts/check-brandbook-hex.sh || echo "  WARN: hex coverage check failed (soft – not blocking CI)"

echo "=== claude plugin validate ==="
if command -v claude > /dev/null; then
    cv_log=$(mktemp)
    if ! claude plugin validate . > "$cv_log" 2>&1; then
        tail -10 "$cv_log"
        rm -f "$cv_log"
        exit 1
    fi
    tail -3 "$cv_log"
    if ! grep -q "Validation passed" "$cv_log"; then
        echo "  FAIL: 'Validation passed' string not found in claude plugin validate output"
        rm -f "$cv_log"
        exit 1
    fi
    rm -f "$cv_log"
else
    echo "  SKIP: claude CLI not available in this environment"
fi

echo
echo "=== ALL GATES PASSED ==="
