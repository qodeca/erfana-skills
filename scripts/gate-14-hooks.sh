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

# Per-run scratch dir. Fixed /tmp paths race between concurrent runs, and a
# pre-planted symlink there would be a write primitive.
G14_TMP="$(mktemp -d)"
trap 'rm -rf "$G14_TMP"' EXIT

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
    if ! bash -n "$script" 2>"$G14_TMP/syntax.err"; then
        echo "  FAIL: $script has syntax error:"
        cat "$G14_TMP/syntax.err"
        :
        fail=1
    fi
done
:
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
            2>"$G14_TMP/ps.err"; then
            echo "  FAIL: $script has PowerShell syntax error:"
            cat "$G14_TMP/ps.err"
            fail=1
        fi
    done
    :
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
from _lib.host_matrix import (matcher_partners, NO_QWEN_COUNTERPART,
                              KNOWN_MATCHER_NAMES, WILDCARD_MATCHERS)

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
#
# Three earlier holes, each demonstrated by mutating hooks.json and watching the
# gate report success:
#   - "Bash|run_shell_command|" - a trailing EMPTY alternative. Every character
#     is in the allowed class and matcher_partners() strips it before checking,
#     but Claude Code treats the matcher as a regex, where an empty alternative
#     matches every tool name. bash-safety would have fired on every Read, Write
#     and Task call. That is exactly the silent widening 7c exists to stop,
#     spelled with only the characters 7c allows.
#   - "Bsah", "WRITE|EDIT", "mcp__github__create_issue" - the rule only ever
#     fired on a literal key of CLAUDE_TO_QWEN_TOOL, so a typo, a wrong case
#     (Claude matches case-sensitively, so WRITE fires on neither host) or any
#     tool absent from that 16-entry table was silently exempt.
#   - "*" was REJECTED, though it is the documented all-tools matcher on both
#     hosts, so a future hook that legitimately wants every tool was blocked.
PLAIN_MATCHER = re.compile(r'^[A-Za-z0-9_|-]+$')
matcher_ok = True
for event, entries in data.get("hooks", {}).items():
    for entry in entries:
        matcher = entry.get("matcher", "")
        if matcher in WILDCARD_MATCHERS:
            continue
        if not PLAIN_MATCHER.match(matcher):
            print(f"  FAIL: {event} matcher {matcher!r} is not a plain "
                  f"'|'-separated list of tool names. Qwen Code substring-matches "
                  f"a matcher it cannot resolve as an alias, so regex syntax "
                  f"widens coverage there without widening it here. "
                  f"({' or '.join(repr(w) for w in sorted(WILDCARD_MATCHERS))} "
                  f"means every tool and is allowed.)")
            matcher_ok = False
            continue
        alternatives = matcher.split("|")
        if not all(alt.strip() for alt in alternatives):
            print(f"  FAIL: {event} matcher {matcher!r} has an empty alternative. "
                  f"Claude Code compiles the matcher as a regex, where an empty "
                  f"alternative matches EVERY tool name - the hook would fire on "
                  f"every tool call. Remove the stray '|'.")
            matcher_ok = False
            continue
        unknown = [alt for alt in alternatives if alt not in KNOWN_MATCHER_NAMES]
        if unknown:
            print(f"  FAIL: {event} matcher {matcher!r} names {', '.join(repr(u) for u in unknown)}, "
                  f"which no host recognises as a tool. A typo or a wrong case "
                  f"(Claude Code matches case-sensitively) means the hook fires "
                  f"on neither host while looking correct. Add the name to "
                  f"KNOWN_MATCHER_NAMES in scripts/_lib/host_matrix.py if it is real.")
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
    print("  PASS: every matcher is plain, non-empty, known and dual-named")
ok = ok and matcher_ok

# 7d
#
# The first version walked back over `>&2` lines directly above a line that was
# exactly `exit 2`, and stopped at the first line that was not one. Five ways
# past it, every one demonstrated by mutating a hook and watching the gate pass:
#   - a blank line between the message and `exit 2` (the walk broke immediately);
#   - `echo "..." >&2; exit 2` on ONE line (the exit anchor never matched, so no
#     walk-back ran at all - the most likely form to be written by hand);
#   - a `cat >&2 <<EOF` heredoc;
#   - the three Stop hooks, which emit their block decision as a JSON heredoc on
#     STDOUT, not stderr - the decision surface the rule advertises protecting;
#   - hooks/*.ps1, never scanned, though it is what runs on Windows and Qwen.
# It also FAILED a genuine single-quoted literal that merely mentioned a dollar
# sign - a plausible edit for bash-safety, whose subject matter is expansion.
def expands(fragment):
    """True when a shell fragment can interpolate. Single-quoted runs cannot."""
    out, quote = [], None
    for ch in fragment:
        if quote is None and ch in "'\"":
            quote = ch
        elif quote == ch:
            quote = None
        elif quote != "'":
            out.append(ch)
    return "$" in "".join(out) or "`" in "".join(out)

literal_ok = True

def flag(path, lineno, what):
    global literal_ok
    print(f"  FAIL: {path}:{lineno} {what}. Qwen Code parses exit-2 stderr as "
          f"JSON when it parses, and both hosts read a Stop hook's stdout JSON "
          f"as the decision, so interpolated text can emit a JSON body and "
          f"change the hook's verdict. Keep block messages literal.")
    literal_ok = False

for name in sorted(os.listdir("hooks")):
    path = os.path.join("hooks", name)
    if name.endswith(".sh"):
        lines = open(path).read().split("\n")
        for i, line in enumerate(lines):
            # Same-line form: `... >&2; exit 2`
            if ">&2" in line and re.search(r';\s*exit\s+2\b', line):
                if expands(line):
                    flag(path, i + 1, "interpolates a value into a stderr block message")
                continue
            if not re.search(r'^\s*exit\s+2\s*$', line):
                continue
            for j in range(i - 1, max(i - 8, -1), -1):
                prev = lines[j]
                if not prev.strip():
                    continue          # blank lines are not the end of the message
                if ">&2" not in prev:
                    break
                if expands(prev):
                    flag(path, j + 1, "interpolates a value into a stderr block message")
        # Heredocs carrying a decision must use a QUOTED delimiter, or the shell
        # expands the body. Covers both the stderr and the stdout forms.
        for m in re.finditer(r'<<\s*(-?)\s*(["\']?)([A-Za-z_][A-Za-z0-9_]*)\2', open(path).read()):
            delim, quoted = m.group(3), bool(m.group(2))
            body = re.search(rf'<<\s*-?\s*["\']?{delim}["\']?\n(.*?)\n\s*{delim}\b',
                             open(path).read(), re.S)
            if body and ('"decision"' in body.group(1) or 'BLOCKED:' in body.group(1)) and not quoted:
                lineno = open(path).read()[:m.start()].count("\n") + 1
                flag(path, lineno, f"emits a decision through an UNQUOTED heredoc (<<{delim}), "
                                   f"whose body the shell expands")
    elif name.endswith(".ps1"):
        # PowerShell interpolates inside double quotes only. Flag a double-quoted
        # literal carrying a $ or a subexpression on any line that emits a block.
        for i, line in enumerate(open(path).read().split("\n")):
            if not re.search(r'(Block\s|Error\.WriteLine|Write-Output|Write-Error)', line):
                continue
            for lit in re.findall(r'"((?:[^"`]|`.)*)"', line):
                if "$" in lit:
                    flag(path, i + 1, "interpolates a value into a block message")

if literal_ok:
    print("  PASS: every block message is a literal, on both .sh and .ps1")
ok = ok and literal_ok

sys.exit(0 if ok else 1)
PYEOF

# 7e. Two CLAUDE.md constraints that lived only in prose: no hook may carry a
# `timeout` key ANYWHERE (7a covers hooks.json; a SKILL.md `hooks:` block is the
# other place one can appear), and skill-scoped hooks are no longer used at all
# because Qwen Code does not extract that frontmatter - a guard declared there
# runs on one of the two supported hosts.
skill_hook_fail=0
for skill_md in skills/*/SKILL.md; do
  [ -e "$skill_md" ] || continue
  frontmatter="$(awk 'NR==1 && /^---$/{f=1; next} f && /^---$/{exit} f' "$skill_md")"
  if printf '%s\n' "$frontmatter" | grep -qE '^hooks:'; then
    echo "  FAIL: $skill_md declares hooks: in SKILL.md frontmatter. Qwen Code's"
    echo "        extension skill parser does not extract that field, so the hook"
    echo "        would run on Claude Code only. Register it in hooks/hooks.json."
    skill_hook_fail=1
  fi
  if printf '%s\n' "$frontmatter" | grep -qE '^[[:space:]]*timeout:'; then
    echo "  FAIL: $skill_md frontmatter carries a timeout: key. The field is"
    echo "        seconds on Claude Code and milliseconds on Qwen Code."
    skill_hook_fail=1
  fi
done
if [ "$skill_hook_fail" -ne 0 ]; then
  exit 1
fi
echo "  PASS: no skill declares hooks: or timeout: in SKILL.md frontmatter"

# 8. The bound that replaced the timeout key must actually be in the launcher.
# A grep for the watchdog is weak on its own -- Gate 16 owns the wall-clock
# proof -- but it catches a silent revert of dispatch.sh to a plain exec.
DISPATCH_CODE="$(grep -v '^[[:space:]]*#' "$HOOKS_DIR/dispatch.sh")"
if ! printf '%s\n' "$DISPATCH_CODE" | grep -q 'HOOK_TIMEOUT_SECONDS'; then
  echo "  FAIL: hooks/dispatch.sh has no HOOK_TIMEOUT_SECONDS bound; removing"
  echo "        the hooks.json timeout key leaves the host default (600 s on"
  echo "        Claude Code) as the only limit"
  exit 1
fi
if ! printf '%s\n' "$DISPATCH_CODE" | grep -qE 'kill -(TERM|KILL) "-\$'; then
  echo "  FAIL: hooks/dispatch.sh does not kill a process group. Hooks spawn"
  echo "        jq and grep children that inherit stdout, and both hosts wait"
  echo "        for the stream to close rather than for the process to exit,"
  echo "        so a leaf-only kill bounds nothing."
  exit 1
fi
echo "  PASS: dispatch.sh carries the process-group watchdog"
