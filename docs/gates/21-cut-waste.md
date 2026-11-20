# Gate 21 – cut-waste scanner

**Type**: hard. **Runner order**: last, after Gate 20.

## What it enforces

The `cut-waste` skill ranks waste from numbers that `skills/cut-waste/scripts/scan-sessions.mjs` (with `scan-log.mjs` beside it) reads out of Claude Code session logs, and promises that no log content leaves the logs. This gate runs `node --test tests/cut-waste/scan-sessions.test.mjs`, which builds made-up logs with known waste in a temporary folder and runs the real script as a process. It checks that:

- The planted waste is counted: subagent runs and their tokens by agent type, owner question rounds and their wait, pattern runs and their minutes, re-reads and reruns, repeated tool errors, goal checks not met, compactions, and active minutes. Reruns and errors inside subagent logs count too.
- A read or a command after a successful edit, a state-changing command such as `git pull` (also inside a chain such as `cd app && pnpm install`), or a compaction is not counted as a repeat; a failed edit does not reset; polling such as `git status` is never a rerun; only shell tools are matched as commands; and the estimated cost of a result, an image priced at 1,600 tokens, stops at the compaction.
- Weighted tokens, minutes, and counts are ranked in separate tables, with a subagents-by-type table, and the comparison shows the session count on each side, reads both-zero as "no change", and leaves out a pattern label used in only one run.
- Usage is counted once per reply, although Claude Code logs one line per content block, each repeating the same usage.
- A canary string planted in message text, tool input, tool output, a goal condition, and subagent metadata appears in nothing the script writes: stdout, stderr, the JSON report, or the Markdown report. A pattern label carrying the canary is refused with exit 2 and is not echoed, and a tool name that is not a plain label is written as `other`. A pattern over 200 characters, or with a slow shape such as `((a+))+`, `(a|aa)+`, or three wildcards, is refused with its label named, while an escaped group such as `\(x+\)+` passes. An unknown key in the patterns file, a compare file with an unchecked label, and an output path that is a link are refused with exit 2. A tool named `__proto__` is counted as an ordinary name, two long tool names stay apart, and a version string that is not a version is left out.
- A log with no usage, timestamps, or turn durations is reported as "field not found", not as zero, judged on the sessions kept after `--since`. A broken line, in a main or a subagent log, is counted rather than crashing the scan, and an unreadable log is listed as not read.
- `--since` (on session start), `--exclude`, and `--compare` work, and `--cwd` finds the folder Claude Code uses for a project, honouring `CLAUDE_CONFIG_DIR`.
- Exit codes hold: 0 scanned, 1 no logs, 2 bad input, 3 logs found but the filters left none, 4 a log or a report file could not be read or written. A repeated flag and a `--since` time with no zone are refused; `--help` exits 0; the report folder is created.

A pass does not prove the log format of a newer Claude Code release. The fixtures copy the format as of v10.1; when a field is renamed, the script reports it as not found, and the fixtures need the new name.

## Fix

Fix the script or update the fixture to the new log format. When a new signal ships, add a planted case for it.

## Run standalone

```bash
bash scripts/gate-21-cut-waste.sh
```
