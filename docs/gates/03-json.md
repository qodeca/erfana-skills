# Gate 3 – JSON files parse

Every JSON config the plugin ships must parse cleanly. Catches typos and trailing-comma errors before they surface at runtime.

## Implementation

```bash
for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json; do
    if python3 -m json.tool "$f" > /dev/null; then
        echo "  PASS: $f"
    else
        echo "  FAIL: $f is not valid JSON"
        exit 1
    fi
done
```

## Pass criteria

One `PASS:` line per JSON file.
