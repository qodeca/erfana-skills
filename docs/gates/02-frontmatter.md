# Gate 2 – YAML frontmatter + Opus 4.7 patterns (skills + agents)

Walks every `skills/*/SKILL.md` and validates `name`, `description`, description length, and (added v4.2.0+, refined v4.2.1) Opus 4.7 patterns: third-person voice (Anthropic-required per skill-creator/SKILL.md), combined description+when_to_use ≤1,536 chars (Anthropic-documented truncation limit per https://code.claude.com/docs/en/skills), plus the plugin-convention ≥3 quoted activation phrases heuristic for activation reliability.

From v4.0.0 onward also walks `agents/*.md` (when the directory exists) and additionally enforces the agent-name invariant: `name` field must equal the filename basename minus `.md`. From v4.2.0 onward also warns when `ms-*` agents lack the `effort` frontmatter field (Section 13.1 of `agent-pre-release-checklist.md`) and when any agent body declares deprecated APIs (`temperature:|top_p:|top_k:|budget_tokens:` at line-start in YAML-key syntax — Section 13.3/13.4 BLOCKING per Anthropic's Opus 4.7 migration guide).

The agent loop is guarded by `os.path.isdir('agents')` so the gate is a no-op on the design-only era of the plugin and becomes active automatically once the agent-migration commit lands files there.

## Implementation

```bash
python3 <<'PYEOF'
import yaml, glob, os, sys, re
ok = True

# Opus 4.7 first-person voice patterns (Section 12.1)
FIRST_PERSON = re.compile(r"\b(I can help|You can use|I'll help|I will help)\b", re.IGNORECASE)

# Quoted-phrase trigger detection (Section 12.2)
QUOTED_PHRASE = re.compile(r'"[^"]{3,}"')

# Skills: require name + description; description checks include 4.7 patterns (added v4.2.0).
for fp in sorted(glob.glob('skills/*/SKILL.md')):
    parts = open(fp).read().split('---')
    if len(parts) < 3:
        print(f'FAIL: {fp} has no YAML frontmatter')
        ok = False
        continue
    m = yaml.safe_load(parts[1])
    if 'name' not in m:
        print(f'FAIL: {fp} missing name field')
        ok = False
    if 'description' not in m:
        print(f'FAIL: {fp} missing description field')
        ok = False
    if 'description' in m and len(m['description']) > 500:
        print(f'WARN: {fp} description is {len(m["description"])} chars (>500); review for workflow language')

    # 4.7 patterns (added v4.2.0; soft warnings — promote to hard in v4.3.0)
    desc = m.get('description', '')
    when = m.get('when_to_use', '') or ''
    combined_len = len(desc) + len(when)

    # 12.1: first-person voice
    if FIRST_PERSON.search(desc) or FIRST_PERSON.search(when):
        print(f'WARN: {fp} description uses first-person voice ("I can help" / "You can use" / "I\'ll help"); rewrite to third-person (Section 12.1)')

    # 7.4 / 12.3 (corrected): combined limit per Anthropic docs
    if combined_len > 1536:
        print(f'WARN: {fp} description+when_to_use combined is {combined_len} chars (Anthropic limit 1,536, item 7.4)')

    # 12.2: ≥3 quoted activation phrases in when_to_use
    if when:
        triggers = QUOTED_PHRASE.findall(when)
        if len(triggers) < 3:
            print(f'WARN: {fp} when_to_use has {len(triggers)} quoted trigger phrases (recommended ≥3, Section 12.2)')

    print(f'  {fp} → name={m.get("name", "?")}')

# Agents: require name + description; invariant: name == filename basename.
# Plus 4.7 patterns: warn if effort field missing on ms-* agents; warn if deprecated APIs declared.
# Detection: deprecated APIs as YAML-style keys at start of line (with optional indent), NOT mentions
# inside backticks/code-references (e.g. "Grep -nE \"temperature:|...\"" in detection regexes).
DEPRECATED_API = re.compile(r'^\s{0,4}(temperature|top_p|top_k|budget_tokens)\s*:\s*\S', re.IGNORECASE | re.MULTILINE)

if os.path.isdir('agents'):
    for fp in sorted(glob.glob('agents/*.md')):
        parts = open(fp).read().split('---')
        if len(parts) < 3:
            print(f'FAIL: {fp} has no YAML frontmatter')
            ok = False
            continue
        m = yaml.safe_load(parts[1])
        if 'name' not in m:
            print(f'FAIL: {fp} missing name field')
            ok = False
        if 'description' not in m:
            print(f'FAIL: {fp} missing description field')
            ok = False
        expected = os.path.basename(fp)[:-3]
        if m.get('name') and m.get('name') != expected:
            print(f'FAIL: {fp} name "{m.get("name")}" does not match basename "{expected}"')
            ok = False

        # 4.7 patterns for agents (added v4.2.0; soft warnings)
        # Item 13.1: effort field on ms-* agents
        if expected.startswith('ms-') and 'effort' not in m:
            print(f'WARN: {fp} missing `effort` field (Section 13.1; ms-* agents should declare per Model Selection Guide)')

        # Item 13.4: deprecated APIs in agent body
        body = ''.join(parts[2:]) if len(parts) >= 3 else ''
        if DEPRECATED_API.search(body):
            match = DEPRECATED_API.search(body)
            print(f'WARN: {fp} body contains deprecated API reference "{match.group(0)}" — Opus 4.7 returns 400 error (Section 13.3/13.4)')

        print(f'  {fp} → name={m.get("name", "?")}')

if not ok: sys.exit(1)
print('PASS: all skill and agent frontmatters valid')
PYEOF
```

## Pass criteria

Every sub-skill and (when present) every agent prints with its name; no FAIL lines.

**WARN-only checks** (do not block CI; soft-blocking initially per Section 12 v4.2.0+ rollout, promote to hard in v4.3.0 once sibling cascade catches up):

- Description >500 chars (legacy soft warn from v4.0+)
- Skill description uses first-person voice (`I can help`, `You can use`, `I'll help`) — rewrite to third-person (Section 12.1)
- Combined `description` + `when_to_use` >1,536 chars (Anthropic-documented truncation limit per https://code.claude.com/docs/en/skills)
- `when_to_use` block has fewer than 3 quoted activation phrases (recommended ≥3, Section 12.2)
- ms-* agent missing `effort` field (Section 13.1; required per Model Selection Guide in `skills/managing-skills/templates/shared-agent-template.md`)
- Agent body contains deprecated API reference at YAML-key syntax: `temperature:`, `top_p:`, `top_k:`, `budget_tokens:` — Opus 4.7 returns 400 error (Section 13.3/13.4 hard-blocking semantically; gate emits WARN to allow incremental fix-up)

**Hard FAILs** (block CI):

- Missing `name` or `description` frontmatter field
- Agent `name` does not match filename basename minus `.md`

The agent name-equals-basename invariant mirrors the existing skill folder-name invariant – both keep the discovery surface coherent across the plugin.

## False-positive guard for deprecated-API regex

The regex `^\s{0,4}(temperature|top_p|top_k|budget_tokens)\s*:\s*\S` (with `MULTILINE`) matches deprecated keys at line-start in YAML or code-block syntax. It deliberately does NOT match mentions inside backticks or quotes.

Example NON-MATCH (intended): `Grep -nE "temperature:|top_p:|top_k:|budget_tokens:"` — this is a detection regex inside backticks in `agents/ms-reviewer.md`, not actual API usage. The regex requires a real value (`\S` after the colon-and-spaces), and the detection-regex string has `:|` (colon-pipe) which doesn't match `\S` for the second char.

Example MATCH (correct fail): a real `temperature: 0.7` line in a YAML config or code block — gets flagged.

## Reference

- `skills/managing-skills/validation/pre-release-checklist.md` — Section 12 (skill 4.7 patterns) full definitions and weight system
- `skills/managing-skills/validation/agent-pre-release-checklist.md` — Section 13 (per-agent 4.7 frontmatter requirements)
- `skills/managing-skills/templates/shared-agent-template.md` — Model Selection Guide (orchestrator → opus xhigh, validator → sonnet medium, etc.)
- `skills/managing-skills/guides/opus-4-7-patterns.md` — 17-section reference for the patterns this gate detects
