# Rule placement

Where each kind of change goes, and how to keep the project's rule files short enough to be read. Read it at step 4 of the run.

## Pick the strongest form that fits

| Form | Use when | Where |
|---|---|---|
| Hook | The waste is a tool call that can be recognised from its name and input, such as a full screenshot run or a repeat of the full suite | `.claude/settings.local.json` for a trial, which only this user runs; the shared `.claude/settings.json` when the user approves it for the whole team. The script it runs goes in the project's tools folder |
| Script or check | The waste is work done the slow way when a narrower way exists, such as shooting every figure | The project's tools or scripts folder, with a test and a package or make command |
| Rule | The waste is a judgment call, such as when to use an agent | The project's own rules file or section, linked from `CLAUDE.md` |
| Advice | The fix lies outside the project, or in a file the project protects | The report only |

**Advice offered once, if not already set:** so that the file tools refuse to open session logs in every permission mode, the user can add `"deny": ["Read(~/.claude/projects/**)"]` under `permissions` in their own `~/.claude/settings.json`. When `CLAUDE_CONFIG_DIR` is set, use that folder in place of `~/.claude`, both in the rule and for the file. To see whether the rule is there, search that file for `projects/**` and use only whether it matched – never print the file, because its `env` blocks can hold keys. Claude Code also applies Read deny rules to simple shell reads it recognises, such as `cat`, but an interpreter one-liner (`node -e`) or a script still gets through, so the rule narrows the risk rather than closing it. It is advice because it changes the user's global setup, which this skill never edits; the scanner still works, because the rule binds Claude's tools, not the files a script opens.

A hook is the strongest form and the most dangerous one: a hook that blocks ordinary work stops every session in the project. Each hook gets a test that feeds it one call it must block and one ordinary call it must allow, and the block message says what to do instead. Keep a hook safe as well as narrow: run its script in exec form, with the arguments as a list, not a string handed to a shell; read the tool input with a real JSON parser; never log or store the tool input or its output; and print a fixed block message that does not echo the input.

## Where rules go

- Follow the project's layout. If it already has a rules folder (`.claude/rules/`, `docs/`, a process document), add the rule to the file whose topic it is, not to a new file.
- `CLAUDE.md` loads in every session, so it carries a one-line link to the rule, not the rule itself. If the project states a size limit for it, report the size before and after; if the edit would break the limit, shorten an existing line or move a section out rather than skip the link.
- Write each rule with its reason and its number: "Run the full suite once at the end – in the last audit it ran 173 times across 12 sessions, 311 minutes." A rule with its reason is applied sensibly to cases it does not name.
- Calm wording. Capital letters and "must always" make models over-apply a rule.

## The cap and the pruning

- At most five new rules per run, biggest waste first. Scripts and hooks count toward the five.
- A change is judged once at least five sessions started after it. If its signal's per-session average fell by less than a quarter from the number in `changes.md`, it gets one of: remove it, merge it with a stronger form (a rule turned into a script), or keep it with a reason. The user decides in the approval.
- Never remove a rule this skill did not add (it is not in `changes.md`) without the user naming it.
