# Gate 7 – cross-references resolve

Check that every cross-reference in `skills/*/SKILL.md`, `skills/*/references/*.md`, or `agents/*.md` resolves to a real file. This gate walks each source file and verifies every cited path exists from that file's perspective.

The algorithm runs in two passes to keep false positives at zero:

1. **SKILL.md structural sections** (`## References`, `## Scripts`, `## Examples`, `## Assets`, `## Demos`, plus the variants `## See also`, `## Related`, `## Related references`). Inside those sections only, extract the FIRST backtick-wrapped token from each `- ` bullet. Subsequent backticks describe the path; treating them as paths trips the regex on names like `` `<deck-stage>` `` or `` `c2-slides-pptx.html` ``. Code fences (```...```) inside the section are skipped.
2. **Markdown links anywhere** in any SKILL.md, `references/*.md`, or `agents/*.md` (the plugin-root agent prompts; v4.0.0+). `[text](path)` syntax is unambiguous, so descriptive prose citing a filename in backticks cannot trip it. This pass catches genuine broken links inside reference prose and inside agent prompts without the false-positive risk of a bare-backtick walk.

Glob patterns (`*`, `?`, `[`) and externally-resolved targets (`http://`, `https://`, `#`, `mailto:`) are skipped in both passes.

## Implementation

```bash
python3 <<'PYEOF'
import os, re, glob, sys

HEADING = re.compile(r'^##\s+(References|Scripts|Examples|Assets|Demos|See also|Related|Related references)\s*:?\s*$', re.I)
ANY_HEADING = re.compile(r'^##\s+')
FENCE = re.compile(r'^```')
BULLET_FIRST_BACKTICK = re.compile(r'^\s*-\s+`([^`]+)`')
MD_LINK = re.compile(r'\[[^\]]*\]\(([^)]+)\)')

def is_internal_path(p):
    if any(p.startswith(x) for x in ('http://', 'https://', '#', 'mailto:')):
        return False
    if any(c in p for c in '*?['):
        return False
    if not re.search(r'\.(md|jsx|js|mjs|py|sh|html|json|svg|mp3|mp4|png)$', p):
        return False
    return True

issues, seen = [], set()

for src in sorted(glob.glob('skills/*/SKILL.md')):
    skill_dir = os.path.dirname(src)
    in_section = in_fence = False
    for line in open(src, encoding='utf-8'):
        if FENCE.match(line):
            in_fence = not in_fence; continue
        if in_fence: continue
        if HEADING.match(line):
            in_section = True; continue
        if ANY_HEADING.match(line):
            in_section = False; continue
        if not in_section: continue
        m = BULLET_FIRST_BACKTICK.match(line)
        if not m: continue
        p = m.group(1).strip()
        if not is_internal_path(p): continue
        key = (src, p)
        if key in seen: continue
        seen.add(key)
        if not os.path.exists(os.path.normpath(os.path.join(skill_dir, p))):
            issues.append((src, p))

agents_md = glob.glob('agents/*.md')
for src in sorted(glob.glob('skills/*/SKILL.md') + glob.glob('skills/*/references/*.md') + agents_md):
    base = os.path.dirname(src)
    for m in MD_LINK.finditer(open(src, encoding='utf-8').read()):
        p = m.group(1).split()[0]
        if not is_internal_path(p): continue
        key = (src, p)
        if key in seen: continue
        seen.add(key)
        if not os.path.exists(os.path.normpath(os.path.join(base, p))):
            issues.append((src, p))

if issues:
    print(f'FAIL: {len(issues)} broken cross-references')
    for src, p in issues: print(f'  {p}  (in {src})')
    sys.exit(1)
print(f'PASS: {len(seen)} cross-references resolve')
PYEOF
```

## Limitations

The pass-2 glob is `skills/*/references/*.md` – **plural**. Two skills spell the directory in the singular, `reference/`: `managing-issues` (22 files) and `managing-reports` (7 files). Every link inside those files is unchecked. The claim in the intro that pass 2 "catches genuine broken links inside reference prose" therefore holds for the plural spelling only.

The same glob list omits `skills/<name>/phases/*.md`, `operations/*.md` and `examples/*.md` entirely, so links **originating** in those files are unchecked no matter where they point. In `managing-issues` that is 13 phase files, 9 operation files and 5 example files – the bulk of the skill's prose. Only the handful of links in its `SKILL.md` are gate-checked.

The Implement hardening (PR #24) added two files inside that blind spot (`reference/run-state-resume.md`, `examples/implement-edge-cases.md`) and roughly forty new cross-links from `operations/` and `phases/`. A **manual link-resolution pass** is the substitute, and is what covered the equivalent gap at v4.2.19 – [`../known-caveats.md`](../known-caveats.md) records both that pass and the gap itself as an accepted risk.

Widening the glob is a code change to `scripts/run-all-gates.sh`, deliberately not made here: this file documents the limit so the gate doc does not contradict the accepted caveat.

## Pass criteria

`PASS: <N> cross-references resolve` with `N` around 25 against current content (v7.0.0 removed the design skills and the brand-prose glob, dropping the count from ~84). The first-backtick-only rule is a content-shape contract: when authoring SKILL.md, write each path as the leading backtick of its bullet; if you need two real paths in one line, split into two bullets.
