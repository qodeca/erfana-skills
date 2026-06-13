# Gate 5 – SVG and HTML well-formedness + SVG content safety

Validates that `banner.svg`, every brand SVG under `skills/design-shared/brands/**/*.svg`, every demo HTML, and every showcase HTML parses successfully. Brand SVGs are additionally content-checked for known XSS / supply-chain vectors:

- No `<script>` element (XSS in browser-rendered SVG).
- No `<foreignObject>` element (HTML injection surface).
- No `href` (or `xlink:href`) attribute whose value starts with `http://`, `https://`, `data:`, or `javascript:` (external resource fetch / inline JS).
- No event-handler attribute (any attribute name starting with `on` and longer than 2 chars – `onload`, `onclick`, `onerror`, etc.).

**Templates exemption (schema v1.2+)** – SVGs whose path contains a segment named `templates` (e.g., `brands/<id>/templates/slides/covers/mockup.svg`) are filtered out before content checks run. Templates are reference material – slide masters, layout sketches – never loaded by `render-video.js`, so the runtime-injection threat model does not apply. Authors review template content out-of-band. The filter is folder-name based and survives subfolder restructures (a Google Slides export with inlined `data:image/png;base64,...` hrefs ships safely under `templates/` even though it would fail a runtime SVG content check). The default `erfana` brand ships no template library, so the exemption is currently dormant.

Brand SVGs that contain the literal `PLACEHOLDER` are surfaced as **WARN** (not FAIL). The placeholder logos shipped in v2.3.1 use this convention so a maintainer who forgets to swap real artwork sees a visible CI nag without breaking the build.

## Implementation

```bash
python3 <<'PYEOF'
import re, sys, glob
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

errors, warnings = [], []
EXTERNAL_HREF = re.compile(r'^(https?://|data:|javascript:)', re.IGNORECASE)

def check_svg(path):
    try:
        tree = ET.parse(path)
    except Exception as e:
        errors.append(f'{path}: SVG parse failed: {e}')
        return
    for el in tree.getroot().iter():
        tag = el.tag.split('}')[-1] if isinstance(el.tag, str) else str(el.tag)
        if tag in ('script', 'foreignObject'):
            errors.append(f'{path}: forbidden element <{tag}>')
        for k, v in el.attrib.items():
            local = k.split('}')[-1]
            if local == 'href' and EXTERNAL_HREF.match(v):
                errors.append(f'{path}: forbidden external href in <{tag}>')
            if local.startswith('on') and len(local) > 2:
                errors.append(f'{path}: forbidden event-handler {local} in <{tag}>')
    with open(path, encoding='utf-8') as fh:
        if 'PLACEHOLDER' in fh.read():
            warnings.append(f'{path}: PLACEHOLDER artwork')

check_svg('skills/design-shared/assets/banner.svg')
brand_svgs = sorted(glob.glob('skills/design-shared/brands/**/*.svg', recursive=True))
brand_svgs = [s for s in brand_svgs if 'templates' not in s.replace('\\', '/').split('/')]
for s in brand_svgs:
    check_svg(s)

class V(HTMLParser):
    def error(self, msg): raise Exception(msg)
html_files = sorted(set(glob.glob('skills/design-shared/demos/*.html')
    + glob.glob('skills/design-shared/assets/showcases/**/*.html', recursive=True)))
ok = bad = 0
for fp in html_files:
    try:
        V(convert_charrefs=True).feed(open(fp, encoding='utf-8').read()); ok += 1
    except Exception as e:
        errors.append(f'{fp}: HTML parse failed: {e}'); bad += 1

if errors:
    print(f'FAIL: {len(errors)}'); [print(' ', e) for e in errors]; sys.exit(1)
for w in warnings: print(f'WARN: {w}')
print(f'PASS: 1 banner + {len(brand_svgs)} brand SVG(s); {ok}/{ok+bad} HTML file(s)')
PYEOF
```

## Pass criteria

`PASS: 1 banner + <N> brand SVG(s); <ok>/<total> HTML file(s)`, with any WARN lines printed before the PASS.
