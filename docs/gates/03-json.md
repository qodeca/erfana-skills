# Gate 3 – JSON files parse

Every JSON config the plugin ships must parse cleanly. Catches typos and trailing-comma errors before they surface at runtime.

## Implementation

```bash
python3 -m json.tool .claude-plugin/plugin.json > /dev/null && echo "PASS: plugin.json"
python3 -m json.tool .claude-plugin/marketplace.json > /dev/null && echo "PASS: marketplace.json"
```

## Pass criteria

One `PASS:` line per JSON file.
