#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# Gate 14 — hooks/ directory health check.
#
# Validates the plugin's hook bundle:
#   1. hooks/hooks.json parses as JSON.
#   2. Top-level shape matches the documented plugin format
#      (`{"hooks": {EVENT: [{matcher, hooks: [...]}]}}`).
#   3. Every command string references "${CLAUDE_PLUGIN_ROOT}/hooks/..."
#      (no absolute paths, no relative paths, no other env vars).
#   4. Every referenced .sh script exists, is executable, and starts
#      with a recognised shebang (env bash | bash | sh).
#   5. bash -n syntax-checks every hook script. If shellcheck is on PATH,
#      additionally runs it (warnings non-fatal; errors fatal).
#
# Standalone runner — invoked by scripts/run-all-gates.sh; can also be
# run directly while iterating on hooks.

set -euo pipefail

cd "$(dirname "$0")/.."

HOOKS_DIR="hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "  PASS: no hooks/ directory (gate is no-op)"
  exit 0
fi

HOOKS_JSON="$HOOKS_DIR/hooks.json"

if [ ! -f "$HOOKS_JSON" ]; then
  echo "  FAIL: hooks/ exists but $HOOKS_JSON is missing"
  exit 1
fi

# 1. JSON parses
if ! python3 -m json.tool "$HOOKS_JSON" > /dev/null 2>&1; then
  echo "  FAIL: $HOOKS_JSON is not valid JSON"
  python3 -m json.tool "$HOOKS_JSON" || true
  exit 1
fi

# 2. Shape, 3. command-path discipline, 4. script presence + shebang
python3 <<'PYEOF'
import json, os, re, sys

HOOKS_JSON = "hooks/hooks.json"
HOOKS_DIR  = "hooks"
ALLOWED_EVENTS = {
    "PreToolUse", "PostToolUse", "UserPromptSubmit",
    "Stop", "SubagentStop", "SessionStart", "SessionEnd",
    "PreCompact", "PostCompact", "Notification",
}
SHEBANG_OK = re.compile(r'^#!\s*(/usr/bin/env\s+(bash|sh)|/bin/(bash|sh))\b')
PATH_RE = re.compile(r'\$\{CLAUDE_PLUGIN_ROOT\}/hooks/([A-Za-z0-9_-]+\.(sh|py|js|mjs|ts))')

with open(HOOKS_JSON) as fh:
    data = json.load(fh)

errors, warnings = [], []

if not isinstance(data, dict):
    errors.append("hooks.json root is not an object")
    sys.exit(0 if not errors else 1)

if "hooks" not in data:
    errors.append("hooks.json missing top-level 'hooks' wrapper key (plugin format)")
events = data.get("hooks", {}) if "hooks" in data else {}

if not isinstance(events, dict):
    errors.append("'hooks' field is not an object")
    events = {}

for event, entries in events.items():
    if event not in ALLOWED_EVENTS:
        errors.append(f"unknown event: {event}")
        continue
    if not isinstance(entries, list):
        errors.append(f"event '{event}': expected list, got {type(entries).__name__}")
        continue
    for i, entry in enumerate(entries):
        if not isinstance(entry, dict):
            errors.append(f"{event}[{i}] is not an object")
            continue
        if "hooks" not in entry or not isinstance(entry["hooks"], list):
            errors.append(f"{event}[{i}] missing 'hooks' list")
            continue
        for j, h in enumerate(entry["hooks"]):
            if not isinstance(h, dict):
                errors.append(f"{event}[{i}].hooks[{j}] is not an object")
                continue
            if h.get("type") != "command":
                # Prompt-based hooks are allowed in principle; we just have none today.
                # No further script checks for non-command hooks.
                continue
            cmd = h.get("command", "")
            if not isinstance(cmd, str) or not cmd:
                errors.append(f"{event}[{i}].hooks[{j}] missing 'command'")
                continue
            # Path discipline
            paths = PATH_RE.findall(cmd)
            if not paths:
                errors.append(f"{event}[{i}].hooks[{j}] command does not reference ${{CLAUDE_PLUGIN_ROOT}}/hooks/...: {cmd!r}")
                continue
            # Forbid bare absolute or home-relative paths
            if re.search(r'(?<!\$\{CLAUDE_PLUGIN_ROOT\})/(Users|home|tmp|opt)/', cmd):
                errors.append(f"{event}[{i}].hooks[{j}] command contains a bare absolute path: {cmd!r}")
            if "~/" in cmd:
                errors.append(f"{event}[{i}].hooks[{j}] command contains a home-relative path: {cmd!r}")
            for script_basename, _ in paths:
                script_path = os.path.join(HOOKS_DIR, script_basename)
                if not os.path.exists(script_path):
                    errors.append(f"referenced script does not exist: {script_path}")
                    continue
                if script_path.endswith('.sh'):
                    if not os.access(script_path, os.X_OK):
                        errors.append(f"script not executable: {script_path}")
                    with open(script_path, encoding='utf-8') as fh:
                        first = fh.readline().rstrip('\n')
                    if not SHEBANG_OK.match(first):
                        errors.append(f"{script_path}: unrecognised shebang {first!r}")

            # Cross-platform launcher: when the command runs dispatch.sh, the
            # trailing token is a hook base name that MUST resolve to BOTH a
            # .sh (Unix) and a .ps1 (Windows) sibling. Keeps the two
            # implementations from drifting out of existence.
            if any(b == 'dispatch.sh' for b, _ in paths):
                m = re.search(r'dispatch\.sh"?\s+([A-Za-z0-9_-]+)', cmd)
                if not m:
                    errors.append(f"{event}[{i}].hooks[{j}] runs dispatch.sh without a hook-name argument: {cmd!r}")
                else:
                    hook_name = m.group(1)
                    for ext in ('sh', 'ps1'):
                        sib = os.path.join(HOOKS_DIR, f"{hook_name}.{ext}")
                        if not os.path.exists(sib):
                            errors.append(f"dispatch.sh hook '{hook_name}' missing {ext.upper()} sibling: {sib}")

if errors:
    print(f'  FAIL: {len(errors)} hook configuration issue(s)')
    for e in errors: print(f'    - {e}')
    sys.exit(1)
for w in warnings:
    print(f'  WARN: {w}')
print(f'  PASS: hooks.json shape, {sum(len(e) for e in events.values())} entries, all paths use ${{CLAUDE_PLUGIN_ROOT}}')
PYEOF

# 5. bash -n on every hook script
fail=0
for script in "$HOOKS_DIR"/*.sh; do
    [ -e "$script" ] || continue
    if ! bash -n "$script" 2>/tmp/g14-syntax.err; then
        echo "  FAIL: $script has syntax error:"
        cat /tmp/g14-syntax.err
        rm -f /tmp/g14-syntax.err
        fail=1
    fi
done
rm -f /tmp/g14-syntax.err
if [ $fail -ne 0 ]; then
    exit 1
fi
echo "  PASS: bash -n clean on all hook scripts"

# Optional shellcheck (warnings non-fatal; errors fatal)
if command -v shellcheck > /dev/null 2>&1; then
    fail=0
    for script in "$HOOKS_DIR"/*.sh; do
        [ -e "$script" ] || continue
        # Project-wide exclusions for hooks:
        # SC2155 — declare-and-assign double evaluation; we intentionally use
        #          `VAR=$(...)` patterns where exit codes don't matter (best-effort).
        # SC1090/SC1091 — non-constant source/dot includes; not applicable here.
        # SC2016 — "expressions don't expand in single quotes". Fires on every
        #          grep regex pattern that mentions a literal $VAR (e.g.
        #          `grep -qE '\$HOME'`). For pattern-matching hooks like
        #          bash-safety the single quotes are correct: we want $HOME to
        #          be the literal string the user typed, not the runtime value
        #          of the maintainer's $HOME. Excluded globally because every
        #          new pattern that detects literal $VAR usage would otherwise
        #          require an inline `# shellcheck disable=SC2016`.
        if ! shellcheck -e SC2155,SC1090,SC1091,SC2016 "$script"; then
            fail=1
        fi
    done
    if [ $fail -ne 0 ]; then
        echo "  FAIL: shellcheck reported issues"
        exit 1
    fi
    echo "  PASS: shellcheck clean"
else
    echo "  SKIP: shellcheck not on PATH (install for richer linting)"
fi

# 6. Optional PowerShell parse check on .ps1 siblings (errors fatal).
# Tokenises each script without executing it. Skipped where neither pwsh nor
# Windows PowerShell is on PATH (e.g. most Linux CI runners).
PS_BIN=""
if command -v pwsh > /dev/null 2>&1; then
    PS_BIN="pwsh"
elif command -v powershell.exe > /dev/null 2>&1; then
    PS_BIN="powershell.exe"
fi
if [ -n "$PS_BIN" ]; then
    fail=0
    for script in "$HOOKS_DIR"/*.ps1; do
        [ -e "$script" ] || continue
        win_path=$(cygpath -m "$script" 2>/dev/null || echo "$script")
        if ! "$PS_BIN" -NoProfile -Command \
            "\$c = Get-Content -Raw '$win_path' -ErrorAction SilentlyContinue; if (-not \$c) { [Console]::Error.WriteLine('empty or unreadable .ps1'); exit 1 }; \$e=\$null; [void][System.Management.Automation.PSParser]::Tokenize(\$c, [ref]\$e); if (\$e.Count) { \$e | ForEach-Object { [Console]::Error.WriteLine(\$_.Message) }; exit 1 }" \
            2>/tmp/g14-ps.err; then
            echo "  FAIL: $script has PowerShell syntax error:"
            cat /tmp/g14-ps.err
            fail=1
        fi
    done
    rm -f /tmp/g14-ps.err
    if [ $fail -ne 0 ]; then
        exit 1
    fi
    echo "  PASS: PowerShell parse clean on all .ps1 hooks"
else
    echo "  SKIP: no PowerShell on PATH (.ps1 syntax check skipped)"
fi

# 7. Cross-host hook contract (v7.1.0). Four rules that four shipped files
# already state as Gate 14's job. They were prose-only until now; re-adding a
# timeout key or dropping a Qwen alias passed the whole suite.
#
#   7a. No `timeout` key anywhere in hooks.json. The field is seconds on
#       Claude Code (default 600) and milliseconds on Qwen (default 60000), so
#       no single value is correct on both. The bound lives in dispatch.sh.
#   7b. Every matcher that names a Claude-only tool also names its Qwen
#       canonical counterpart, read from scripts/_lib/host_matrix.py. Without
#       it the hook simply never fires on Qwen.
#   7c. Matchers are plain `|`-separated tool names. A real regex is matched
#       by substring on Qwen and would widen coverage silently.
#   7d. Every stderr line preceding an `exit 2` is a literal. Qwen parses
#       exit-2 stderr as JSON when it can, so interpolating a filename into a
#       block message would let attacker-controlled text emit a JSON body and
#       change the hook's decision.
python3 <<'PYEOF'
import json, os, re, sys

sys.path.insert(0, "scripts")
from _lib.host_matrix import matcher_partners, NO_QWEN_COUNTERPART

ok = True
data = json.load(open("hooks/hooks.json"))

# 7a
def find_timeout(node, path="hooks.json"):
    global ok
    if isinstance(node, dict):
        for k, v in node.items():
            if k == "timeout":
                print(f"  FAIL: {path} carries a 'timeout' key ({v!r}); the field "
                      f"is seconds on Claude Code and milliseconds on Qwen Code, "
                      f"so no value is correct on both. Bound the hook in "
                      f"hooks/dispatch.sh instead.")
                ok = False
            find_timeout(v, f"{path}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            find_timeout(v, f"{path}[{i}]")

find_timeout(data)
if ok:
    print("  PASS: no 'timeout' key in hooks.json (unit differs per host)")

# 7b + 7c
PLAIN_MATCHER = re.compile(r'^[A-Za-z0-9_|-]*$')
matcher_ok = True
for event, entries in data.get("hooks", {}).items():
    for entry in entries:
        matcher = entry.get("matcher", "")
        if not matcher:
            continue
        if not PLAIN_MATCHER.match(matcher):
            print(f"  FAIL: {event} matcher {matcher!r} is not a plain "
                  f"'|'-separated list of tool names. Qwen Code substring-matches "
                  f"a matcher it cannot resolve as an alias, so regex syntax "
                  f"widens coverage there without widening it here.")
            matcher_ok = False
            continue
        missing = matcher_partners(matcher)
        if missing:
            print(f"  FAIL: {event} matcher {matcher!r} names a Claude-only tool "
                  f"without its Qwen counterpart; add {'|'.join(missing)} "
                  f"(source: scripts/_lib/host_matrix.py CLAUDE_TO_QWEN_TOOL). "
                  f"Tools with no Qwen equivalent are exempt: "
                  f"{', '.join(NO_QWEN_COUNTERPART)}.")
            matcher_ok = False
if matcher_ok:
    print("  PASS: every matcher is plain and dual-named per host_matrix.py")
ok = ok and matcher_ok

# 7d
literal_ok = True
for name in sorted(os.listdir("hooks")):
    if not name.endswith(".sh"):
        continue
    lines = open(os.path.join("hooks", name)).read().split("\n")
    for i, line in enumerate(lines):
        if not re.search(r'^\s*exit\s+2\s*$', line):
            continue
        # Walk back over the stderr lines that produce this block's message.
        for j in range(i - 1, max(i - 6, -1), -1):
            prev = lines[j]
            if ">&2" not in prev:
                break
            if "$" in prev:
                print(f"  FAIL: hooks/{name}:{j+1} interpolates a value into a "
                      f"stderr line that precedes 'exit 2'. Qwen Code parses "
                      f"exit-2 stderr as JSON when it parses, so interpolated "
                      f"text can emit a JSON body and change the decision. "
                      f"Keep block messages literal.")
                literal_ok = False
if literal_ok:
    print("  PASS: every exit-2 block message is a literal (no $ expansion)")
ok = ok and literal_ok

sys.exit(0 if ok else 1)
PYEOF

# 8. The bound that replaced the timeout key must actually be in the launcher.
# A grep for the watchdog is weak on its own -- Gate 16 owns the wall-clock
# proof -- but it catches a silent revert of dispatch.sh to a plain exec.
if ! grep -q 'HOOK_TIMEOUT_SECONDS' "$HOOKS_DIR/dispatch.sh"; then
  echo "  FAIL: hooks/dispatch.sh has no HOOK_TIMEOUT_SECONDS bound; removing"
  echo "        the hooks.json timeout key leaves the host default (600 s on"
  echo "        Claude Code) as the only limit"
  exit 1
fi
if ! grep -qE 'kill -(TERM|KILL) "-\$' "$HOOKS_DIR/dispatch.sh"; then
  echo "  FAIL: hooks/dispatch.sh does not kill a process group. Hooks spawn"
  echo "        jq and grep children that inherit stdout, and both hosts wait"
  echo "        for the stream to close rather than for the process to exit,"
  echo "        so a leaf-only kill bounds nothing."
  exit 1
fi
echo "  PASS: dispatch.sh carries the process-group watchdog"
