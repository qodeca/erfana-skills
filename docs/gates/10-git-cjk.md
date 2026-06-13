# Gate 10 – git history is CJK-free

Only relevant when reviewing accumulated commits before pushing. Catches commit subjects that slipped past Gate 1 (which scans repo content but not commit metadata).

## Implementation

The runner uses inline `\u` escape form (see the runner's source for the exact pattern). The snippet below uses `chr()` construction for the same regex, so this documentation file itself contains no CJK literals.

```bash
git log --pretty=%s | python3 -c "
import sys, re
ranges = [(0x4e00, 0x9fff), (0x3000, 0x303f), (0xff00, 0xffef)]
CJK = re.compile('[' + ''.join(f'{chr(a)}-{chr(b)}' for a, b in ranges) + ']')
t = sys.stdin.read()
m = CJK.findall(t)
print(f'{\"PASS\" if not m else \"FAIL\"}: {len(m)} CJK chars in commit subjects')
"
```

## Pass criteria

`PASS: 0 CJK chars in commit subjects`.
