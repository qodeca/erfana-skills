# Gate 4 – script syntax (Python + Node)

Cheap parse-only check that all scripts in the plugin have valid syntax. Catches edit-induced corruption before runtime.

## Implementation

```bash
python3 -c "import ast; ast.parse(open('skills/design-shared/scripts/verify.py').read()); print('PASS: verify.py')"
for f in skills/design-shared/scripts/render-video.js skills/design-shared/scripts/html2pptx.js skills/design-shared/scripts/export_deck_pdf.mjs skills/design-shared/scripts/export_deck_pptx.mjs skills/design-shared/scripts/export_deck_stage_pdf.mjs skills/design-shared/assets/deck_stage.js; do
  node --check "$f" && echo "PASS: $f"
done
```

The runner also covers `scripts/_lib/json_schema_lite.py` via the same `ast.parse` route.

## Pass criteria

One `PASS:` line per script file. Parse failures surface as Python `SyntaxError` or Node `SyntaxError` traces with file + line.
