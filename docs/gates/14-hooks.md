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
