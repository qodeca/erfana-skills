# Gate 7 – cross-references resolve

Check that every cross-reference in `skills/*/SKILL.md`, `skills/*/references/*.md`, or any brand prose `.md` under `skills/design-shared/brands/*/**/*.md` resolves to a real file. Sub-skills cite the shared bundle via paths like `../design-shared/assets/foo.jsx`; brand prose cites peer libraries via `./RULES.md` and brandbook screenshots via `../brandbook/screenshots/...`. This gate walks each source file and verifies every cited path exists from that file's perspective.

The algorithm runs in two passes to keep false positives at zero:

1. **SKILL.md structural sections** (`## References`, `## Scripts`, `## Examples`, `## Assets`, `## Demos`, plus the variants `## See also`, `## Related`, `## Related references`). Inside those sections only, extract the FIRST backtick-wrapped token from each `- ` bullet. Subsequent backticks describe the path; treating them as paths trips the regex on names like `` `<deck-stage>` `` or `` `c2-slides-pptx.html` ``. Code fences (```...```) inside the section are skipped.
2. **Markdown links anywhere** in any SKILL.md, `references/*.md`, brand prose `.md` (recursive glob over `skills/design-shared/brands/*/**/*.md` – covers brand-root `CLAUDE.md`, per-library `INDEX.md`, per-library `RULES.md`, and the `brandbook/CLAUDE.md`), or `agents/*.md` (the plugin-root agent prompts; v4.0.0+). `[text](path)` syntax is unambiguous, so descriptive prose like `` the `assets/animations.jsx` Stage component `` cannot trip it. This pass catches genuine broken links inside reference prose, inside brand bundles, and inside agent prompts without the false-positive risk of a bare-backtick walk. Bare backtick-wrapped paths inside brand prose (e.g. `` `../brandbook/screenshots/page-009.png` `` cited as audit-trail references in RULES.md) are NOT scanned – only `[text](path)` markdown links are.

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

brand_md = glob.glob('skills/design-shared/brands/*/**/*.md', recursive=True)
agents_md = glob.glob('agents/*.md')
for src in sorted(glob.glob('skills/*/SKILL.md') + glob.glob('skills/*/references/*.md') + brand_md + agents_md):
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

## Pass criteria

`PASS: <N> cross-references resolve` with `N` typically ≥ 80 against current content (the brand-prose glob added in v0.4.0 raised the count from ~69 to ~84). The first-backtick-only rule is a content-shape contract: when authoring SKILL.md, write each path as the leading backtick of its bullet; if you need two real paths in one line, split into two bullets.
