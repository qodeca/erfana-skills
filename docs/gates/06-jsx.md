# Gate 6 – JSX brace/paren/bracket balance

A cheap proxy for JSX syntax health (full JSX parsing requires Babel; this catches the most common edit-induced corruption).

## Implementation

```bash
for f in skills/design-shared/assets/*.jsx; do
  python3 -c "
content = open('$f').read()
assert content.count('{') == content.count('}'), 'brace mismatch in $f'
assert content.count('(') == content.count(')'), 'paren mismatch in $f'
assert content.count('[') == content.count(']'), 'bracket mismatch in $f'
print(f'PASS: $f')
"
done
```

## Pass criteria

One `PASS:` line per `.jsx` file. AssertionError surfaces the specific imbalance (brace, paren, or bracket).
