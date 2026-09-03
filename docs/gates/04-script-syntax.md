# Gate 4 – script syntax (Python)

Cheap parse-only check that all scripts in the plugin have valid syntax. Catches edit-induced corruption before runtime.

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

One `PASS:` line per script file. Parse failures surface as a Python `SyntaxError` trace with file + line.
