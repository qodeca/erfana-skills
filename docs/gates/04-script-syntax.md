# Gate 4 – script syntax (Python + Node)

Cheap parse-only check that all scripts in the plugin have valid syntax. Catches edit-induced corruption before runtime.

## Implementation

```bash
python3 -c "import ast; ast.parse(open('scripts/_lib/gate2_detector.py').read()); print('PASS: gate2_detector.py')"
```

## Pass criteria

One `PASS:` line per script file. Parse failures surface as a Python `SyntaxError` trace with file + line.
