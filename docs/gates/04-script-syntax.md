# Gate 4 – script syntax (Python)

Parse-only check of every Python module under `scripts/_lib/`. Catches edit-induced corruption before runtime. Shell scripts are not checked here: the hook `.sh` files get `bash -n` in Gate 14.

## Implementation

```bash
# Every module under scripts/_lib/, not one hard-coded file. An empty glob is
# itself a failure - it would mean the gate silently checked nothing.
python3 - <<'EOF'
import ast, glob, sys
files = sorted(glob.glob('scripts/_lib/*.py'))
if not files:
    print('FAIL: no scripts/_lib/*.py found'); sys.exit(1)
for f in files:
    ast.parse(open(f).read())
print(f'PASS: {len(files)} module(s) parse')
EOF
```

## Pass criteria

The runner prints one `PASS: scripts/_lib/<module>.py` line per module and stops at the first failure with `FAIL: <path>: <error>`, which names the file and line. The standalone snippet above prints a single summary line instead, and a parse failure there surfaces as a Python `SyntaxError` trace.
