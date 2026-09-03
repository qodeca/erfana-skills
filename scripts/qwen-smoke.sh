#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# qwen-smoke.sh - install erfana into a throwaway Qwen Code profile and check
# that the conversion produced something usable.
#
#   bash scripts/qwen-smoke.sh                  # skips cleanly without qwen
#   bash scripts/qwen-smoke.sh --require        # missing qwen is a failure (CI)
#   bash scripts/qwen-smoke.sh --from-marketplace   # install the published tag
#
# HERMETIC BY CONSTRUCTION. Everything runs under a temporary HOME, so the
# maintainer's real ~/.qwen is never touched. That is not a nicety: this repo's
# maintainer runs Qwen daily on the same machine, and a smoke test that
# uninstalled or replaced their working extension would be worse than no smoke
# test at all.
#
# WHAT THIS PROVES, and what it does not. It proves the loader: that Qwen finds
# the plugin, converts every skill, agent and command, leaves hooks/hooks.json
# untouched, and registers the result. It does NOT prove the executor - no hook
# is fired by a real Qwen session here, because that needs model credentials
# this test deliberately does not have. Section "What is not verified" in
# docs/hosts.md says so out loud; do not let a green run here be read as
# "erfana works on Qwen".
#
# Deliberately NOT part of scripts/run-all-gates.sh. That runner has to stay
# executable with only bash and Python; this needs a Node CLI on PATH.

set -euo pipefail

cd "$(dirname "$0")/.."
REPO_ROOT="$PWD"

REQUIRE=0
FROM_MARKETPLACE=0
for arg in "$@"; do
  case "$arg" in
    --require) REQUIRE=1 ;;
    --from-marketplace) FROM_MARKETPLACE=1 ;;
    *) echo "usage: $0 [--require] [--from-marketplace]" >&2; exit 2 ;;
  esac
done
if [ "${QWEN_SMOKE_REQUIRED:-0}" = "1" ]; then
  REQUIRE=1
fi

failures=0
note_fail() { echo "  FAIL: $1"; failures=$((failures + 1)); }
note_pass() { echo "  PASS: $1"; }

# --- Preconditions ---------------------------------------------------------

if ! command -v qwen > /dev/null 2>&1; then
  if [ "$REQUIRE" -eq 1 ]; then
    echo "  FAIL: qwen not on PATH and --require was given"
    exit 1
  fi
  echo "  SKIP: qwen not on PATH (npm install -g @qwen-code/qwen-code to run the cross-host smoke test)"
  exit 0
fi

OBSERVED_VERSION="$(qwen --version 2>/dev/null | tr -d '[:space:]')"
TESTED_VERSION="$(python3 -c "
import sys
sys.path.insert(0, 'scripts')
from _lib.host_matrix import qwen
print(qwen()['tested_version'])
")"

if [ "$OBSERVED_VERSION" = "$TESTED_VERSION" ]; then
  note_pass "qwen v$OBSERVED_VERSION matches the tested version in scripts/_lib/host_matrix.py"
else
  # Never a failure. Qwen is pre-1.0 and ships every few days; failing here
  # would red-light develop on somebody else's release schedule. The weekly
  # qwen-canary job is what turns a real upstream break into a tracked issue.
  echo "  WARN: qwen v$OBSERVED_VERSION differs from the tested v$TESTED_VERSION."
  echo "        Re-read the alias tables and bump tested_version in scripts/_lib/host_matrix.py."
fi

# --- Throwaway profile -----------------------------------------------------

TMPHOME="$(mktemp -d "${TMPDIR:-/tmp}/erfana-qwen-smoke.XXXXXX")"
cleanup() { rm -rf "$TMPHOME"; }
trap cleanup EXIT
# Python resolves its per-user site-packages under $HOME, so switching HOME
# hides everything the maintainer pip-installed with --user - including PyYAML,
# which the converted-agent frontmatter check needs. Capture the real path
# first and put it on PYTHONPATH, otherwise that check reports "pyyaml not
# installed" on a machine where it plainly is. Same class of bug as the bundle
# lookup below: the hermetic HOME breaking the script's own tooling.
REAL_USER_SITE="$(python3 -c 'import site; print(site.getusersitepackages())' 2>/dev/null || true)"
if [ -n "$REAL_USER_SITE" ] && [ -d "$REAL_USER_SITE" ]; then
  export PYTHONPATH="${REAL_USER_SITE}${PYTHONPATH:+:$PYTHONPATH}"
fi

export HOME="$TMPHOME"
export XDG_CONFIG_HOME="$TMPHOME/.config"

EXT="$TMPHOME/.qwen/extensions/erfana"

# --- Install ---------------------------------------------------------------
#
# `--consent` skips the security confirmation but NOT the plugin picker: a
# Claude marketplace can carry several plugins, so Qwen asks which one even
# when there is exactly one. Feeding it a newline accepts the highlighted
# entry. The `<path>:<plugin>` shorthand does NOT work for a local path - Qwen
# mis-parses it and reports "Install source not found" - so the picker is the
# only non-interactive route for a working-tree install.
if [ "$FROM_MARKETPLACE" -eq 1 ]; then
  INSTALL_SOURCE="qodeca/erfana-skills:erfana"
else
  INSTALL_SOURCE="$REPO_ROOT"
fi

if ! printf '\n' | qwen extensions install "$INSTALL_SOURCE" --consent --scope user > "$TMPHOME/install.log" 2>&1; then
  note_fail "qwen extensions install failed; log follows"
  sed 's/^/    /' "$TMPHOME/install.log"
  exit 1
fi

if [ ! -d "$EXT" ]; then
  note_fail "install reported success but $EXT does not exist"
  sed 's/^/    /' "$TMPHOME/install.log"
  exit 1
fi
note_pass "installed from ${INSTALL_SOURCE} into a throwaway profile"

# --- Conversion fidelity ---------------------------------------------------

check_count() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    note_pass "$label: $actual (matches the repo)"
  else
    note_fail "$label: repo has $expected, converted tree has $actual"
  fi
}

check_count "skills" \
  "$(find skills -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')" \
  "$(find "$EXT/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')"
check_count "agents" \
  "$(find agents -maxdepth 1 -name '*.md' | wc -l | tr -d ' ')" \
  "$(find "$EXT/agents" -maxdepth 1 -name '*.md' 2>/dev/null | wc -l | tr -d ' ')"
check_count "commands" \
  "$(find commands -maxdepth 1 -name '*.md' | wc -l | tr -d ' ')" \
  "$(find "$EXT/commands" -maxdepth 1 -name '*.md' 2>/dev/null | wc -l | tr -d ' ')"

# Every skill present BY NAME, not just by count.
missing_skills=""
for d in skills/*/; do
  name="$(basename "$d")"
  [ -f "$EXT/skills/$name/SKILL.md" ] || missing_skills="$missing_skills $name"
done
if [ -z "$missing_skills" ]; then
  note_pass "every skill present by name in the converted tree"
else
  note_fail "skills missing after conversion:$missing_skills"
fi

# Qwen rewrites all 87 agent frontmatter blocks. A YAML failure there drops an
# agent silently, so check each converted file still parses with a name and a
# description rather than trusting the count alone.
ERFANA_SMOKE_REQUIRE="$REQUIRE" python3 - "$EXT" <<'PYEOF' || note_fail "converted-agent frontmatter check failed"
import glob
import os
import sys

try:
    import yaml
except ImportError:
    # Same reasoning as the alias-table check further down: this is the only
    # thing proving Qwen did not silently drop an agent's frontmatter - the
    # count check above passes on file count alone - so under --require a
    # missing parser is a failure, not a shrug. It passed in CI only because
    # the runner image happens to ship PyYAML in system python.
    if os.environ.get('ERFANA_SMOKE_REQUIRE') == '1':
        print("  FAIL: pyyaml not installed, so no converted agent was parsed.")
        print("        Under --require that is a failure: pip install pyyaml.")
        sys.exit(1)
    print("  SKIP: pyyaml not installed; converted-agent frontmatter not parsed")
    sys.exit(0)

ext = sys.argv[1]
bad = []
for path in sorted(glob.glob(os.path.join(ext, 'agents', '*.md'))):
    with open(path, encoding='utf-8') as fh:
        text = fh.read()
    if not text.startswith('---\n'):
        bad.append((os.path.basename(path), 'no frontmatter after conversion'))
        continue
    block = text.split('\n---\n', 1)[0][4:]
    try:
        meta = yaml.safe_load(block) or {}
    except yaml.YAMLError as exc:
        bad.append((os.path.basename(path), f'unparseable YAML: {exc}'))
        continue
    if not meta.get('name'):
        bad.append((os.path.basename(path), 'lost its name'))
    elif not meta.get('description'):
        bad.append((os.path.basename(path), 'lost its description'))

if bad:
    for name, why in bad:
        print(f"  FAIL: converted agent {name} {why}")
    sys.exit(1)
print("  PASS: every converted agent still parses with a name and a description")
PYEOF

# hooks.json must survive untouched: Qwen substitutes ${CLAUDE_PLUGIN_ROOT} in
# memory when it loads the file, never on disk. A byte difference here means
# the converter rewrote our hook wiring.
if cmp -s "$EXT/hooks/hooks.json" "$REPO_ROOT/hooks/hooks.json"; then
  note_pass "hooks/hooks.json survived conversion byte-identical"
else
  note_fail "hooks/hooks.json was rewritten by the converter"
  diff "$REPO_ROOT/hooks/hooks.json" "$EXT/hooks/hooks.json" | sed 's/^/    /' | head -20
fi

# The launcher and every hook must still be executable after copyDirectory.
non_exec=""
for f in "$EXT"/hooks/*.sh; do
  [ -x "$f" ] || non_exec="$non_exec $(basename "$f")"
done
if [ -z "$non_exec" ]; then
  note_pass "every hook script kept its executable bit"
else
  note_fail "hook scripts lost the executable bit:$non_exec"
fi

# The four sentinels are load-bearing: verify-completion and the two interview
# guards match on them, and the converter rewrites every *.md it copies.
for sentinel in 'erfana:status-template' 'erfana:explain-template' \
                'erfana:grill-open' 'erfana:ms-grill-open'; do
  repo_n="$(grep -rlF "$sentinel" --exclude-dir=.git "$REPO_ROOT" 2>/dev/null | wc -l | tr -d ' ')"
  ext_n="$(grep -rlF "$sentinel" "$EXT" 2>/dev/null | wc -l | tr -d ' ')"
  if [ "$repo_n" = "$ext_n" ]; then
    note_pass "sentinel $sentinel survived in $ext_n file(s)"
  else
    note_fail "sentinel $sentinel: $repo_n file(s) in the repo, $ext_n after conversion"
  fi
done

# --- Registration ----------------------------------------------------------

LIST="$(qwen extensions list 2>&1 || true)"
if printf '%s' "$LIST" | grep -q 'erfana'; then
  note_pass "qwen extensions list reports erfana"
else
  note_fail "qwen extensions list does not report erfana"
fi

for skill in skills/*/; do
  name="$(basename "$skill")"
  printf '%s' "$LIST" | grep -qF "$name" || note_fail "skill $name is not registered"
done

# --- Alias-table provenance ------------------------------------------------
#
# scripts/_lib/host_matrix.py transcribes Qwen's internal tool alias tables.
# A transcription rots silently, so pin it to the chunk it came from. esbuild
# content-hashes chunk filenames, so locate the file by content rather than by
# name.
ERFANA_SMOKE_REQUIRE="$REQUIRE" python3 - <<'PYEOF' || note_fail "alias-table provenance check failed"
import glob
import hashlib
import os
import re
import shutil
import subprocess
import sys

sys.path.insert(0, 'scripts')
from _lib.host_matrix import QWEN_BUNDLE

# Resolve the bundle from the qwen executable itself, never from $HOME. This
# script deliberately runs under a throwaway HOME so it cannot touch the
# maintainer's real ~/.qwen, and an expanduser('~') here resolved into that
# empty temp home -- so the check skipped itself on the one machine where the
# bundle was actually present, and said "not found" while it sat on disk.
def bundle_roots():
    exe = shutil.which('qwen')
    if exe:
        exe = os.path.realpath(exe)
        # The npm/global shim is a two-line sh wrapper around the real entry.
        try:
            with open(exe, encoding='utf-8', errors='replace') as fh:
                head = fh.read(512)
            m = re.search(r"exec\s+'([^']+)'", head) or re.search(r'exec\s+"([^"]+)"', head)
            if m:
                exe = os.path.realpath(m.group(1))
        except (OSError, UnicodeDecodeError):
            pass
        # <prefix>/bin/qwen -> <prefix>/lib/chunks
        yield os.path.join(os.path.dirname(os.path.dirname(exe)), 'lib', 'chunks')
        # Walk up from the entry point looking for a chunks/ dir. npm lays a
        # global install out differently per platform and per Node manager, and
        # the CI runner's hostedtoolcache path matches none of the fixed roots
        # below - which is how this check silently skipped itself in CI while
        # passing locally.
        probe = os.path.dirname(exe)
        for _ in range(4):
            yield os.path.join(probe, 'lib', 'chunks')
            yield os.path.join(probe, 'chunks')
            probe = os.path.dirname(probe)
    npm_root = shutil.which('npm')
    if npm_root:
        try:
            out = subprocess.run([npm_root, 'root', '-g'], capture_output=True,
                                 text=True, timeout=30)
            if out.returncode == 0 and out.stdout.strip():
                yield os.path.join(out.stdout.strip(), '@qwen-code', 'qwen-code',
                                   'lib', 'chunks')
        except (OSError, subprocess.SubprocessError):
            pass
    for root in ('/usr/local/lib/node_modules/@qwen-code/qwen-code/lib/chunks',
                 '/opt/homebrew/lib/node_modules/@qwen-code/qwen-code/lib/chunks'):
        yield root

qwen_bin = next((r for r in bundle_roots() if os.path.isdir(r)), None)

if qwen_bin is None:
    # A skip here is invisible failure: the checksum is the only thing that makes
    # a stale transcription in host_matrix.py announce itself, and the weekly
    # canary is built on top of it. Under --require - which is what CI passes -
    # not finding the bundle is a failure, not a shrug.
    if os.environ.get('ERFANA_SMOKE_REQUIRE') == '1':
        print("  FAIL: Qwen bundle chunks not found, so the alias tables in")
        print("        scripts/_lib/host_matrix.py were not checked against")
        print("        anything. Under --require that is a failure: add this")
        print("        install layout to bundle_roots() in scripts/qwen-smoke.sh.")
        sys.exit(1)
    print("  SKIP: Qwen bundle chunks not found; alias-table provenance unchecked")
    sys.exit(0)

marker = QWEN_BUNDLE['locate_by']
match = None
for path in glob.glob(os.path.join(qwen_bin, '*.js')):
    with open(path, encoding='utf-8', errors='replace') as fh:
        if marker in fh.read():
            match = path
            break

if match is None:
    print(f"  WARN: no bundle chunk contains {marker!r}; the alias tables may have moved")
    sys.exit(0)

digest = hashlib.sha256(open(match, 'rb').read()).hexdigest()
if digest == QWEN_BUNDLE['observed_sha256']:
    print(f"  PASS: alias tables still match the transcribed bundle ({os.path.basename(match)})")
else:
    print(f"  WARN: {os.path.basename(match)} has changed since the tables were transcribed")
    print(f"        expected {QWEN_BUNDLE['observed_sha256'][:16]}..., found {digest[:16]}...")
    print("        Re-read the tool alias tables and update scripts/_lib/host_matrix.py.")
PYEOF

# --- Uninstall -------------------------------------------------------------

if qwen extensions uninstall erfana > "$TMPHOME/uninstall.log" 2>&1; then
  if [ -d "$EXT" ]; then
    note_fail "uninstall reported success but $EXT still exists"
  else
    note_pass "uninstalled cleanly"
  fi
else
  note_fail "qwen extensions uninstall failed"
  sed 's/^/    /' "$TMPHOME/uninstall.log"
fi

if [ "$failures" -ne 0 ]; then
  echo "  FAIL: $failures failure(s) total"
  exit 1
fi
echo "=== ALL QWEN SMOKE CHECKS PASSED ==="
