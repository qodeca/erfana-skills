# Gate 14 – hooks valid (v4.1+)

Validates the `hooks/` directory shipped in v4.1.0:

1. **`hooks/hooks.json` parses** as JSON.
2. **Top-level shape** matches the documented plugin format `{"hooks": {EVENT: [{matcher, hooks: [...]}]}}`. The wrapper key (`"hooks"`) is required – this is what distinguishes plugin format from the direct settings format. Recognised events: `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop`, `SubagentStop`, `SessionStart`, `SessionEnd`, `PreCompact`, `PostCompact`, `Notification`. An unknown event name fails the gate.
3. **Path discipline** – every command string in a `type: "command"` hook references `${CLAUDE_PLUGIN_ROOT}/hooks/<basename>.<ext>`. Bare absolute paths (`/Users/`, `/home/`, `/tmp/`, `/opt/`) and home-relatives (`~/`) fail. The plugin install location is not under maintainer control – the cache path can change between Claude Code versions, and managed installations may use read-only paths.
4. **Script presence + executable + shebang** – every referenced script exists on disk, has the executable bit set, and starts with one of `#!/usr/bin/env bash`, `#!/bin/bash`, `#!/usr/bin/env sh`, `#!/bin/sh`. Missing or non-executable scripts surface as discrete errors so a typo in `hooks.json` is not silently ignored.
5. **`bash -n` syntax check** – every `hooks/*.sh` parses as valid bash. Catches unclosed quotes, mismatched `if/fi`, dangling heredocs.
6. **Optional `shellcheck`** – when on PATH, runs with project-relevant exclusions (`-e SC2155,SC1090,SC1091,SC2016`). Warnings count as failures; missing shellcheck is a `SKIP` (informational only).
7. **Cross-platform siblings (v4.2.20+)** – when a command runs the `dispatch.sh` launcher, the trailing argument is the hook base name; the gate asserts both `hooks/<name>.sh` **and** `hooks/<name>.ps1` exist. This is what keeps the Unix and Windows implementations from drifting out of existence.
8. **Optional PowerShell parse (v4.2.20+)** – when `pwsh` or `powershell.exe` is on PATH, every `hooks/*.ps1` is tokenised (parsed, not executed) via `[System.Management.Automation.PSParser]::Tokenize`; parse errors fail the gate. Missing PowerShell is a `SKIP` (e.g. most Linux CI runners).

## Implementation

The gate is a standalone script:

```bash
bash scripts/gate-14-hooks.sh
```

## Pass criteria

When `hooks/` does not exist, the gate is a no-op (`PASS: no hooks/ directory`). This keeps the gate quiet for any future fork that elects to drop hooks. Pass = `PASS: hooks.json shape, <N> entries, all paths use ${CLAUDE_PLUGIN_ROOT}` (this check also enforces the `.sh` + `.ps1` sibling pair per dispatched hook) followed by `PASS: bash -n clean on all hook scripts`, then either `PASS: shellcheck clean` / `SKIP: shellcheck not on PATH`, and either `PASS: PowerShell parse clean on all .ps1 hooks` / `SKIP: no PowerShell on PATH`.

## Adding a new hook

1. Write **both** implementations: `hooks/<name>.sh` (macOS/Linux) and `hooks/<name>.ps1` (Windows). Keep their pattern sets in lockstep – Gate 14 guarantees both files exist but cannot verify the logic matches.
2. `chmod +x hooks/<name>.sh` and start it with a recognised shebang. (`.ps1` files need neither an executable bit nor a shebang.)
3. Add the entry to `hooks/hooks.json` under the appropriate event – matcher pattern + `command: bash "${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.sh" <name>`. The `dispatch.sh` launcher selects the `.ps1` on Windows or the `.sh` elsewhere.
4. Add behavioural fixtures where practical so the `.ps1` is exercised on Windows (see Gate 16 for the verify-completion fixture pattern, which replays through `dispatch.sh`).
5. Run `bash scripts/gate-14-hooks.sh` to verify all eight checks pass (use `PYTHONUTF8=1` on Windows native Python).
6. If the hook adds a new behavioural surface (blocks a previously-allowed pattern, changes a Stop-protocol decision), trigger staged rollout per `CLAUDE.md` "Release cadence" – tag `vX.Y.Z-rc.1`, soak with the maintainer's pilot machine for 48 hours per the documented policy, then promote.

> The single bare `.sh`/`.py`/`.js`/`.mjs`/`.ts` form (no launcher) is still accepted for a hook that genuinely only ever runs on Unix, but the safety bundle standardises on the `dispatch.sh` + `.sh`/`.ps1` pair so it works on every maintainer's machine.

## Cross-host contract (check 7, v7.1.0)

Four rules that `hooks/dispatch.sh`, `CLAUDE.md`, `docs/hosts.md` and `scripts/_lib/host_matrix.py` all already stated as this gate's job, and that nothing enforced until v7.1.0. Re-adding a `timeout` key or dropping a Qwen alias passed the whole suite.

| Rule | Why it is not a style nit |
|---|---|
| **7a** No `timeout` key anywhere in `hooks.json` | The field is seconds on Claude Code (default 600) and milliseconds on Qwen Code (default 60000). `5` means five seconds here and five milliseconds there, so every hook died before reading its payload. The bound lives in `dispatch.sh`, where a second is a second on both. |
| **7b** A matcher naming a Claude-only tool must also name its Qwen canonical | Read from `CLAUDE_TO_QWEN_TOOL` in `scripts/_lib/host_matrix.py`. `Bash` does not resolve to `run_shell_command`, so `bash-safety` simply never fired on Qwen. `MultiEdit` and `SlashCommand` are exempt – they have no Qwen counterpart. |
| **7c** Matchers are plain `\|`-separated tool names | A matcher Qwen cannot resolve as an alias falls through to a substring test, so regex syntax widens coverage there without widening it here. |
| **7d** Every stderr line preceding an `exit 2` is a literal | Qwen parses exit-2 stderr as JSON when it parses. Interpolating a filename into a block message would let attacker-controlled text emit a JSON body and change the hook's decision. All messages are static single-quoted literals today; this keeps them that way. |

Known blind spot in 7d: the walk-back reads the `>&2` lines immediately above an `exit 2` and stops at the first line that is not one. A block message assembled some other way - a `cat >&2 <<EOF` heredoc, or a variable interpolated on a line the walk-back never reaches - would evade it. No shipped hook builds a message that way (`grep -n 'cat >&2' hooks/*.sh` is empty), and the rule is a tripwire against a plausible future edit rather than a proof. If a hook ever needs a multi-line block message, extend the walk-back first.

**Check 8** greps `dispatch.sh` for `HOOK_TIMEOUT_SECONDS` and for a process-group kill (`kill -TERM "-$…"`). A leaf-only kill bounds nothing: hooks spawn `jq` and `grep` children that inherit stdout, and both hosts wait for the stream to close rather than for the process to exit. The grep catches a silent revert to a plain `exec`; Gate 16's wall-clock fixture is what proves the bound actually holds.
