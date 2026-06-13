# Gate 9 – watermark consistency (across all sub-skills)

Allowlists the canonical watermark literal: `Created with erfana` (the active brand's `voice.watermark`). Any other `Created (by|with) X` string fails. Documented exceptions whitelisted by phrase-match: legacy `Created by qodesign` reminder line in `using-erfana/SKILL.md`; the literal `Created by default` in `managing-specs/templates/t4-standard-spec/README.md` (template prose describing filesystem-creation behavior, not brand watermarking).

## Implementation

```bash
hits=$(grep -rnE 'Created (by|with)' skills/ 2>/dev/null \
  | grep -v 'Created with erfana' \
  | grep -v 'Never `Created by qodesign`' \
  | grep -v 'legacy brand' \
  | grep -v 'Created by default')
if [ -z "$hits" ]; then
  echo 'PASS: all watermarks use Created with erfana'
else
  echo 'FAIL: non-canonical watermark:' && echo "$hits"
fi
```

## Pass criteria

`PASS: all watermarks use Created with erfana`. Failures print the offending lines.
