# Gate 8 – trigger phrase coverage (across all sub-skills)

In v2.0+, trigger phrases are distributed across the 6 design sub-skills. The deprecated `erfana:design` meta-skill was removed in v4.0.0 (commit `8ef509f`); orchestration skills are excluded from this gate's glob (`skills/design-*/SKILL.md`) because they cover different categories. This gate confirms the union of all design sub-skill `description:` + `when_to_use:` text covers the original 6 categories.

## Implementation

```bash
python3 <<'PYEOF'
import yaml, glob
combined = ''
for fp in sorted(glob.glob('skills/design-*/SKILL.md')):
    if 'design-shared' in fp: continue
    m = yaml.safe_load(open(fp).read().split('---')[1])
    combined += ' ' + (m.get('description', '') or '') + ' ' + (m.get('when_to_use', '') or '')
text = combined.lower()
categories = {
    'prototype': ['prototype', 'mockup'],
    'animation': ['animation', 'motion', 'mp4', 'gif'],
    'slides': ['slide deck', 'deck', 'pitch deck', 'keynote'],
    'advisor': ['design direction', 'design philosophy', 'recommend a style', 'what style', 'pick a style'],
    'critique': ['design review', 'critique'],
    'infographic': ['infographic', 'data visualization', 'data viz'],
}
hit = sum(1 for cat, phrases in categories.items() if any(p in text for p in phrases))
print(f'{"PASS" if hit == 6 else "FAIL"}: {hit}/6 trigger categories present across sub-skills')
PYEOF
```

## Pass criteria

`PASS: 6/6 trigger categories present across sub-skills`. If a new design skill introduces a brand-new task type (e.g. `design-3d`), update the `categories` dict in the runner before opening the PR.
