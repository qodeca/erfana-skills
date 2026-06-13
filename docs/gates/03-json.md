# Gate 3 – JSON files parse

Every JSON config the plugin ships must parse cleanly. Catches typos and trailing-comma errors before they surface at runtime.

## Implementation

```bash
python3 -m json.tool .claude-plugin/plugin.json > /dev/null && echo "PASS: plugin.json"
python3 -m json.tool .claude-plugin/marketplace.json > /dev/null && echo "PASS: marketplace.json"
python3 -m json.tool skills/design-shared/test-prompts.json > /dev/null && echo "PASS: test-prompts.json"
python3 -m json.tool skills/design-shared/assets/personal-asset-index.example.json > /dev/null && echo "PASS: personal-asset-index.example.json"
```

## Pass criteria

One `PASS:` line per JSON file. The runner additionally validates `skills/design-shared/brands/brand.schema.json`.
