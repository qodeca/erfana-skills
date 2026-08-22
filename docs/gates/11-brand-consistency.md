# Gate 11 – brand consistency (no leftover qodesign)

The plugin must not leak its legacy brand. One documented exception: `CHANGELOG.md` (historical entries), which is filtered.

## Implementation

```bash
hits=$(grep -r -i 'qodesign' \
    skills/ .claude-plugin/ \
    README.md LICENSE CHANGELOG.md SECURITY.md \
    .github/ 2>/dev/null \
  | grep -v 'CHANGELOG.md')
if [ -z "$hits" ]; then
  echo 'PASS: no qodesign strings outside documented exceptions'
else
  echo 'FAIL: leftover qodesign strings:' && echo "$hits"
fi
```

## Pass criteria

`PASS: no qodesign strings outside documented exceptions`. Failures list every offending file:line.
