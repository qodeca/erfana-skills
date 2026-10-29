#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# gen-reference.sh - regenerates docs/reference.md from the plugin's own files.
#
# The reference answers "what does erfana ship, and how do I start each part?"
# Every value is read from the source of truth, so the page cannot drift the
# way a hand-maintained catalogue does:
#
#   skills    skills/<name>/SKILL.md frontmatter (description, when_to_use,
#             argument-hint, disable-model-invocation)
#   agents    agents/<name>.md frontmatter (description, tools, model, effort)
#   commands  commands/<name>.md frontmatter (description, argument-hint,
#             disable-model-invocation)
#   hooks     hooks/hooks.json (event, matcher) + the `# Summary:` line of each
#             hooks/<name>.sh header (first header sentence as a fallback)
#
#   bash scripts/gen-reference.sh            write docs/reference.md
#   bash scripts/gen-reference.sh --stdout   print to stdout (used by Gate 19)
#
# Output depends only on the working tree - no git, no dates, no locale - so
# Gate 19 can compare the committed file byte for byte with a fresh run.

set -euo pipefail

cd "$(dirname "$0")/.."

mode=write
case "${1:-}" in
  "") ;;
  --stdout) mode=stdout ;;
  *) echo "usage: $0 [--stdout]" >&2; exit 2 ;;
esac

ERFANA_REF_MODE="$mode" python3 <<'PYEOF'
import json
import os
import re
import sys
from glob import glob

import yaml

TARGET = 'docs/reference.md'


def frontmatter(path):
    text = open(path, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n', text, re.S)
    if not m:
        sys.exit(f'{path}: no YAML frontmatter')
    data = yaml.safe_load(m.group(1)) or {}
    if not isinstance(data, dict):
        sys.exit(f'{path}: frontmatter is not a mapping')
    return data


def one_line(value):
    return ' '.join(str(value or '').split())


def prose(value):
    """One line of Markdown text: a `<placeholder>` is escaped so GitHub shows it
    instead of dropping it as an unknown HTML tag."""
    return one_line(value).replace('<', r'\<')


def cell(value):
    return prose(value).replace('|', r'\|')


def triggers(when_to_use):
    """Quoted phrases from when_to_use, in order, without duplicates."""
    seen = []
    for phrase in re.findall(r'"([^"]+)"', str(when_to_use or '')):
        if phrase not in seen:
            seen.append(phrase)
    return seen


def hook_summary(name):
    path = f'hooks/{name}.sh'
    lines = open(path, encoding='utf-8').read().splitlines()
    for line in lines:
        if line.startswith('# Summary:'):
            return line[len('# Summary:'):].strip()
    para = []
    for line in lines[1:]:
        if not line.startswith('#'):
            break
        body = line[1:].strip()
        if body.startswith('SPDX-'):
            continue
        if not body:
            if para:
                break
            continue
        para.append(body)
    text = ' '.join(para)
    m = re.match(r'(.+?\.)(\s|$)', text)
    return m.group(1) if m else text


out = [
    '# Reference',
    '',
    '<!-- GENERATED FILE - DO NOT EDIT BY HAND. -->',
    '<!-- Regenerate with: bash scripts/gen-reference.sh -->',
    '',
    'Everything erfana ships, read straight from the plugin files by',
    '[`scripts/gen-reference.sh`](../scripts/gen-reference.sh). Gate 19 fails the',
    'build when this page and the files disagree, so what you read here is what',
    'you get. For how to use these parts together, start with the',
    '[tutorial](tutorial.md) or the [how-to guides](how-to.md).',
    '',
    'On Claude Code, start a skill or command as `/erfana:<name>`. On Qwen Code,',
    'use the bare name, for example `/issue`. Claude also loads a skill on its own',
    'when your words match its trigger phrases, unless the skill is marked',
    '"you start it".',
    '',
]

# Skills ---------------------------------------------------------------------
skill_dirs = sorted(os.path.basename(os.path.normpath(d)) for d in glob('skills/*/'))
out += [f'## Skills ({len(skill_dirs)})', '']
out += ['| Skill | Started by | What it is for |', '|---|---|---|']
skills = []
for name in skill_dirs:
    fm = frontmatter(f'skills/{name}/SKILL.md')
    started = 'you start it' if fm.get('disable-model-invocation') else 'you or Claude'
    skills.append((name, fm, started))
    first = re.match(r'(.+?\.)(\s|$)', one_line(fm.get('description')))
    summary = first.group(1) if first else one_line(fm.get('description'))
    out.append(f'| [`erfana:{name}`](#erfana{name}) | {started} | {cell(summary)} |')
out.append('')

for name, fm, started in skills:
    out += [f'### `erfana:{name}`', '']
    out += [prose(fm.get('description')), '']
    out.append(f'- **Start:** `/erfana:{name}`' +
               (f' `{one_line(fm.get("argument-hint"))}`' if fm.get('argument-hint') else ''))
    out.append(f'- **Started by:** {started}')
    phrases = triggers(fm.get('when_to_use'))
    if phrases and not fm.get('disable-model-invocation'):
        out.append('- **Trigger phrases:** ' + ', '.join(f'"{prose(p)}"' for p in phrases))
    out.append(f'- **Source:** [`skills/{name}/SKILL.md`](../skills/{name}/SKILL.md)')
    out.append('')

# Agents ---------------------------------------------------------------------
agent_files = sorted(glob('agents/*.md'))
out += [f'## Agents ({len(agent_files)})', '']
out += [
    'Agents are helpers that skills start for a narrow job, such as a blinded',
    'review. You can also ask Claude to use one by name. Each runs with only the',
    'tools listed here.',
    '',
    '| Agent | What it does | Tools | Model | Effort |',
    '|---|---|---|---|---|',
]
for path in agent_files:
    fm = frontmatter(path)
    name = fm.get('name') or os.path.splitext(os.path.basename(path))[0]
    tools = fm.get('tools')
    if isinstance(tools, list):
        tools = ', '.join(tools)
    out.append(
        f'| [`{name}`](../{path}) | {cell(fm.get("description"))} | {cell(tools or "all")} '
        f'| {cell(fm.get("model") or "session default")} | {cell(fm.get("effort") or "session default")} |'
    )
out.append('')

# Commands -------------------------------------------------------------------
command_files = sorted(glob('commands/*.md'))
out += [f'## Slash commands ({len(command_files)})', '']
out += ['| Command | Arguments | Started by | What it does |', '|---|---|---|---|']
for path in command_files:
    fm = frontmatter(path)
    name = os.path.splitext(os.path.basename(path))[0]
    started = 'you start it' if fm.get('disable-model-invocation') else 'you or Claude'
    hint = f'`{one_line(fm.get("argument-hint"))}`' if fm.get('argument-hint') else 'none'
    out.append(f'| [`/erfana:{name}`](../{path}) | {cell(hint)} | {started} | {cell(fm.get("description"))} |')
out.append('')

# Hooks ----------------------------------------------------------------------
registry = json.load(open('hooks/hooks.json', encoding='utf-8'))['hooks']
hooks = []
for event in sorted(registry):
    for entry in registry[event]:
        matcher = entry.get('matcher') or 'every event'
        for h in entry.get('hooks', []):
            m = re.search(r'dispatch\.sh"?\s+([A-Za-z0-9_-]+)', h.get('command', ''))
            if m:
                hooks.append((m.group(1), event, matcher))
hooks.sort()
out += [f'## Safety hooks ({len(hooks)})', '']
out += [
    'Hooks run on their own at fixed points; you never start them. Each one runs',
    'through `hooks/dispatch.sh`, which picks the `.sh` file on macOS and Linux and',
    'the `.ps1` file on Windows.',
    '',
    '| Hook | Runs at | Tools it watches | What it does |',
    '|---|---|---|---|',
]
for name, event, matcher in hooks:
    watched = ', '.join(f'`{t}`' for t in matcher.split('|')) if matcher != 'every event' else 'all'
    out.append(f'| [`{name}`](../hooks/{name}.sh) | {event} | {watched} | {cell(hook_summary(name))} |')
out.append('')

text = '\n'.join(out)
if os.environ['ERFANA_REF_MODE'] == 'stdout':
    sys.stdout.write(text)
else:
    open(TARGET, 'w', encoding='utf-8').write(text)
    print(f'wrote {TARGET} ({len(skill_dirs)} skills, {len(agent_files)} agents, '
          f'{len(command_files)} commands, {len(hooks)} hooks)')
PYEOF
