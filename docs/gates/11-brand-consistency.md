# Gate 11 – brand consistency (no leftover qodesign)

The plugin must not leak its legacy brand. Documented exceptions: `skills/using-erfana/SKILL.md` (legacy-brand reminder) and `CHANGELOG.md` (historical entries). Both are filtered.

## Implementation

```bash
hits=$(grep -r -i 'qodesign' \
    skills/ .claude-plugin/ \
    README.md LICENSE SECURITY.md MAINTAINER.md \
    .github/ 2>/dev/null \
  | grep -v 'using-erfana/SKILL.md')
if [ -z "$hits" ]; then
  echo 'PASS: no qodesign strings outside documented exceptions'
else
  echo 'FAIL: leftover qodesign strings:' && echo "$hits"
fi
```

## Pass criteria

`PASS: no qodesign strings outside documented exceptions`. Failures list every offending file:line.
