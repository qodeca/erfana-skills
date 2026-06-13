# Gate 1 – zero CJK across the repo

Catches any Han ideograph, CJK punctuation, or fullwidth Latin that slipped through translation.

## Implementation

The runner (`scripts/run-all-gates.sh`) uses the inline `\u` escape form (see the runner's source for the exact pattern). The snippet below uses `chr()` construction for the same regex, so this documentation file itself contains no CJK literals (would otherwise fail Gate 1 on its own check).

```bash
python3 <<'PYEOF'
import os, re
# CJK ranges: Han ideographs, CJK symbols/punctuation, fullwidth Latin / halfwidth katakana
ranges = [(0x4e00, 0x9fff), (0x3000, 0x303f), (0xff00, 0xffef)]
CJK = re.compile('[' + ''.join(f'{chr(a)}-{chr(b)}' for a, b in ranges) + ']')
EXTS = {'.md','.json','.html','.js','.mjs','.jsx','.py','.sh','.svg'}
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
print('PASS: no CJK' if not hits else f'FAIL: {len(hits)} files with CJK\n' + '\n'.join(f'  {p}: {n}' for p,n in hits))
PYEOF
```

## Pass criteria

`PASS: no CJK`. The character ranges cover Han ideographs (U+4E00..U+9FFF), CJK symbols and punctuation (U+3000..U+303F), and fullwidth Latin / halfwidth katakana (U+FF00..U+FFEF).
