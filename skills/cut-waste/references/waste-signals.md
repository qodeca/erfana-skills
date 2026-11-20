# Waste signals

What the scan counts, how to tell waste from necessary cost, and the change that usually fixes each one. Read it at steps 1, 3, and 4 of the run.

## The patterns file

`.local/cut-waste/patterns.json` names the project's own costly work. `commands` patterns match the text of shell commands; `tools` patterns match tool names; `polling` patterns mark project commands that only look at state, so running them again is not a rerun. Common polling is built in: `git status`, `log`, `diff`, `show`, and `fetch`, `gh` `view` and `list` commands, and `cd`, `ls`, `cat`, `head`, `tail`, `wc`, `sleep`, and `echo`. Each `match` is a JavaScript regular expression, and each `label` is plain text – letters, digits, spaces, and `._:/()+-`, at most 60 characters – because only the label reaches the report. The script refuses any other key, at the top or in an entry, so a typo such as `command` stops the run with exit 2 instead of giving no patterns. After the run, check that each label you wrote appears in the report.

```json
{
  "commands": [
    { "label": "full check suite", "match": "\\bpnpm (run )?gate\\b" },
    { "label": "screenshot run", "match": "\\bpnpm (run )?(shots|screenshots)\\b" }
  ],
  "polling": [
    { "label": "deploy status", "match": "^az webapp show\\b" }
  ],
  "tools": [
    { "label": "browser screenshot", "match": "take_screenshot" }
  ]
}
```

Keep a pattern narrow enough that it does not match the cheap version of the same command – a check of one package is not a full suite run – or a command that only mentions the word, such as `grep screenshot`. A pattern is at most 200 characters, because each one runs on every logged command (on its first 4,096 characters). The script also refuses the shapes that can take minutes on one long line – a repeated group that holds a repeat or an alternative, such as `(a+)+` or `(a|aa)+`, and three wildcards such as `.*a.*b.*c`. That check is rough: it catches the common cases, not all of them, so keep patterns plain.

## How the numbers are built

- **Weighted tokens** price each token against one new input token: a cache read 0.1, a five-minute cache write 1.25 (a one-hour write costs more, so this is a floor), output 5. Raw totals are dominated by cache reads, which are cheap, so they rank the wrong things first.
- **Weighted tokens for a result** are an estimate. The size of what a tool brought into context, at about four characters per token, is priced as one cache write on the next reply plus one cache read for every reply after that, until the next compaction or the end of that log; each subagent log is priced on its own. A large result early in a long session costs far more than the same result near its end. An image counts as 1,600 tokens, the cost of a full-size one, because the log does not give its size – an upper bound. A result Claude Code moved to a `tool-results/` file is logged as a short preview, and only the preview reached the context, so its preview size is the right number.
- **Minutes for a pattern** run from the tool call to its result. Calls that ran in parallel overlap, so a sum can exceed the wall time. For owner questions the minutes include the user's thinking and away time, so judge them by the round count.
- **Three tables.** Weighted tokens, minutes, and counts are ranked separately, because they do not compare. A signal with only a count (goal checks, compactions, repeated errors) is judged by its size against the number of sessions.
- **Main and subagents together.** Re-reads, reruns, tool errors, and compactions add up across the main log and every subagent log; owner questions come from the main log only, since agents cannot ask. Repeats are found within one log, so a subagent's edit does not reset the main log's count, and the reverse.
- **Rows overlap.** Subagent tokens include everything the subagent did, and its results also count in the pattern and repeat rows. Compare rows; never add them.
- **Subagents** are read from `<session>/subagents/`, each with its type from the `.meta.json` beside it.
- A usage reply is logged once per content block with the same numbers; the script counts each reply once.

## What the scan does not measure

Say so in the report before calling a signal small:

- **Subagent minutes.** Subagent rows carry tokens, not minutes; only the main log's timing is ranked.
- **Results with no label.** The result-size cost is ranked only for pattern labels and repeats. A large result from a tool with no label shows in the JSON `tools` map, not in a ranking.
- **Goal checks** come from the main log only.
- **Other folders.** Only the log folder for the current path is read. Sessions opened from a subfolder or another clone of the repository are in other folders.
- **Near repeats.** Repeats are exact matches, so a rerun with one changed flag is missed.
- **Resumed sessions.** Replies are counted once per log file. A session resumed into a new file may count some replies twice.
- **Broken lines and unreadable logs.** They are skipped and counted in the report (`unparsedLines`, `unreadable`); a large count makes every number less certain.

## Signals, judgments, and usual fixes

| Signal (name in the report) | Waste when | Necessary when | Usual change |
|---|---|---|---|
| Subagent runs (`subagent runs`; compare: `subagentRuns`, `subagentWeightedTokens`) | The task fit in a few tool calls: a text edit, one known file, a check of the agent's own work | Wide search over many files, independent parallel work, a reviewer who must not see the author's reasoning | Rule: when to use an agent and when to do it yourself, with the measured numbers; for a review step, one reviewer, not a panel |
| Owner question rounds (`owner question rounds`; compare: `askRounds`) | Questions asked one at a time across a session, or asking about a choice with an obvious default | A consequential or irreversible call the owner must make | Rule: batch questions in one round; agents write a guess as decided and list it for the owner |
| Full check-suite reruns (`pattern: <your label>`) | The full suite runs after each small edit | Once at the end, and after a fix for a failure it found | Rule plus a script for the focused check (one package, changed files) |
| Screenshot or visual runs (`pattern: <your label>`) | Every figure or page is shot again when one changed | Only the changed output, plus one final full pass if the project asks | Script that shoots only what changed against the base branch, with a test |
| Re-reads with no edit between (`re-reads with no edit between`; compare: `repeatReads`) | The same file range is read again; the scan already skips reads after a successful edit to that file or after a compaction | A command changed the file (a formatter, a script, a `git checkout`), or another agent edited it – the scan resets on common state-changing commands but not on every one, so the count is an upper bound | A rule to keep what was read, or a smaller read (offset and limit) |
| Command reruns with no edit between (`command reruns with no edit between`; compare: `repeatCommands`) | A command is rerun with no successful file edit since its last run, hoping for a different result | A flaky step diagnosed on purpose, or a state change the scan does not recognise; polling and common state changes (`git pull`, `pnpm install`, also inside a chain such as `cd app && pnpm install`) are already left out. Only exact repeats count, so a rerun with one flag changed is missed and the count is low on that side | Hook that refuses the repeat with a message saying what to run instead, or a rule naming the flaky step. The hook keeps no command output: a stored output can hold secrets |
| Goal checks not met (`goal checks not met`; compare: `goalUnmet`) | The goal condition cannot be judged from the transcript, so the loop keeps going | Real remaining work | Advice: tighten the goal condition – suggest `/erfana:draft-goal` |
| Context compactions (`context compactions`; compare: `compactions`) | Huge tool output (logs, screenshots, full test reports) fills the context | Long sessions on large work | Script that prints a summary instead of the full output |
| Repeated tool errors (`repeated tool errors`; compare: `repeatErrors`) | The same call fails again with the same input | A one-off failure that was then fixed (not counted) | Rule or hook for the repeated mistake |

When a signal is high in one session only, look at what that session did before writing a rule for every session. A rule made from one bad day costs every later session its reading time.
