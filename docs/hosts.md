# Supported hosts

erfana ships as a Claude Code plugin. It also runs on Qwen Code, which converts
Claude Code plugins at install time rather than requiring a package of its own.

This page is the single source of truth for how the two hosts differ. Other
documents link here instead of restating any of it. The table below is
generated from [`scripts/_lib/host_matrix.py`](../scripts/_lib/host_matrix.py)
by [`scripts/gen-hosts-table.sh`](../scripts/gen-hosts-table.sh); everything
around it is written by hand.

<!-- BEGIN generated host table -->
<!-- GENERATED - DO NOT EDIT BY HAND. Regenerate with: bash scripts/gen-hosts-table.sh -->

| Host | Key | How it consumes erfana | Install | Version tested | Hook `timeout` |
|---|---|---|---|---|---|
| Claude Code | `claude-code` | native plugin | `/plugin marketplace add qodeca/erfana-skills` | – | seconds, default 600 |
| Qwen Code | `qwen-code` | converted at install time | `qwen extensions install qodeca/erfana-skills:erfana` | 0.22.3 | milliseconds, default 60000 |

Derived from `scripts/_lib/host_matrix.py`. The Qwen row was read from bundle
`chunk-UTLCH2FK.js` at version 0.22.3
(sha256 `f6f993e6177d917a…`); `scripts/qwen-smoke.sh` re-reads that
chunk from the installed Qwen and reports when the digest moves.
<!-- END generated host table -->

## One package, two hosts

There is no second package, no second manifest, no build step and no second
release train. Qwen Code's installer runs a manifest cascade, finds
`.claude-plugin/marketplace.json`, copies the tree into
`~/.qwen/extensions/erfana/`, rewrites each `agents/*.md` frontmatter through
its own allowlist, and writes a `qwen-extension.json` beside it. The conversion
happens on the user's machine, after the release, from the same tag Claude Code
users install.

Do **not** add a `qwen-extension.json` to the repository root. Qwen checks for a
native manifest first, and finding one would make it skip the Claude-plugin
conversion entirely – the repository would install worse, not better.

## What the host matrix owns

`scripts/_lib/host_matrix.py` holds the machine-readable half of this page: the
host rows, the tool alias tables, the agent-frontmatter allowlist, and a
checksum of the Qwen bundle chunk the tables were read from. Gates 2, 14 and 15
read that module, so a claim on this page and a rule in a gate cannot drift
apart. `scripts/qwen-smoke.sh` re-reads the bundle from the installed Qwen and
reports when the checksum moves.

## Tool-name vocabulary

Claude Code tool names are canonical everywhere in this repository. Qwen names
appear in exactly one place: hook `matcher:` strings in `hooks/hooks.json`.

| Where a tool is named | Converted by Qwen? | Rule |
|---|---|---|
| Agent `tools:` frontmatter | Yes | Write Claude names. The converter remaps them (`Bash` to `Shell`, `Read` to `ReadFile`, `Write` to `WriteFile`, `TodoWrite` to `TodoList`). Writing Qwen names here would break Claude Code. |
| Skill `allowed-tools:` | Read, but under a different key | Write Claude names, because Claude Code enforces them. See the degradation list below. |
| Hook `matcher:` | **No** | Name both hosts' tools. Gate 14 enforces this. |
| Prose inside skill and agent bodies | No | Name the action, not the tool. |

Qwen resolves a matcher alternative against `{canonical name, display name,
display name + "Tool"}` plus legacy migration names. That means several Claude
names already work there unchanged – `Edit`, `Grep`, `Glob`, `Task`,
`TodoWrite`, `AskUserQuestion`, `WebSearch`, `WebFetch`, `NotebookEdit`,
`Skill`, `ExitPlanMode`. Four do not: `Bash`, `Read`, `Write` and `MultiEdit`.
The first three have Qwen counterparts a matcher must also name; `MultiEdit` and
`SlashCommand` have none at all, so naming them is harmless and simply never
fires there.

One trap worth stating explicitly: do not add a lowercase `edit` alternative to
a matcher. It fails alias matching, falls through to Qwen's regex fallback, and
`new RegExp("...|edit").test("notebook_edit")` is a substring test that returns
true – silently widening the hook to notebook edits.

## Hook execution differences

The safety hooks in `hooks/hooks.json` run on both hosts. Qwen finds the file
without any declaration in `plugin.json`, unwraps the `{"hooks": {...}}` plugin
wrapper, and substitutes `${CLAUDE_PLUGIN_ROOT}` to the extension path. Only the
braced form is substituted, and only by both hosts – `$CLAUDE_PLUGIN_ROOT`
without braces reaches the shell as a literal string.

**The `timeout` field means different things on each host, so `hooks.json`
carries none.** Claude Code reads it as seconds and defaults command hooks to
600. Qwen reads the same field as milliseconds and defaults to 60000. So `5`
means five seconds on one host and five thousandths of a second on the other,
and no single number is correct on both. The five-second bound lives in
[`hooks/dispatch.sh`](../hooks/dispatch.sh) instead, where it means the same
thing everywhere. Gate 14 fails the build if a `timeout` key comes back.

Both hosts share the same blocking contract, which is why the hook scripts
themselves need no host branch:

| Signal | Meaning on both hosts |
|---|---|
| Exit 2 plus a message on stderr | Block the tool call |
| Exit 0 plus `{"decision":"block","reason":"..."}` on stdout | Block the stop |
| Exit 0, no output | Allow |
| Killed by the watchdog | **Allow.** A killed hook exits 142 or dies by signal, and neither is read as a block |

That last row is the one to remember: the hooks fail open. A hook that cannot
run does not protect you. `hooks/dispatch.sh` emits a diagnostic to stderr when
it has to skip a hook, so a silent failure is at least a loud one.

## What degrades on Qwen Code

Everything here is accepted and documented rather than fixed, because the fix
would live upstream or would cost Claude Code users something.

- **The two interview guards are ordinary Stop hooks now, not skill-scoped
  ones.** Qwen's extension skill parser does not extract `hooks:` frontmatter.
  Its own source calls that an open alignment task and only speculates that it
  may be a security boundary, so it may change. erfana therefore registers both
  guards in `hooks/hooks.json`, where both hosts see them. If Qwen later starts
  reading skill `hooks:`, the guards would register twice.
- **Skill `allowed-tools:` is inert.** Qwen's extension parser reads
  `allowedTools` in camelCase; erfana writes the hyphenated Claude spelling. The
  field is never read, so erfana's skills run unrestricted there. The spelling
  stays as it is because Claude Code does enforce it.
- **Command `allowed-tools:` is not enforced either**, so the scoped
  `Bash(git status:*)` grants in three commands become approval prompts.
- **Agent `effort:` and `capabilities:` are dropped** by the converter, along
  with `type:` and `file_restrictions:`. They stay in the files because Claude
  Code uses them.
- **The post-compaction reminder runs but its output is discarded.**
- **Commands register unnamespaced** – `/doc-update`, not `/erfana:doc-update` –
  so a name collision with a Qwen builtin would shadow them silently.
- **`$ARGUMENTS` is not substituted.** Qwen uses `{{args}}` and otherwise
  appends the raw invocation to the end of the prompt. Each argument-taking
  command carries both tokens and a rule for telling which one the host filled
  in.
- **Skill activation may be less reliable.** A field report on Claude-authored
  skills under Qwen found the host worse at deciding to load a skill at all, and
  the workaround that helped was a `UserPromptSubmit` hook re-injecting the
  trigger rules. That is a user-side settings change, not something this
  repository ships.

## Verifying a host

| Check | Command |
|---|---|
| Cross-host wiring rules | `bash scripts/run-all-gates.sh` (Gates 2, 14, 15) |
| Hook behaviour on real payloads | `bash scripts/gate-16-hook-fixtures.sh` |
| Install and conversion on Qwen | `bash scripts/qwen-smoke.sh` |
| The generated table above | `bash scripts/gen-hosts-table.sh` produces no diff |

The smoke test is deliberately not part of `run-all-gates.sh`. That runner has
to stay executable with only bash and Python, and the smoke test needs a Node
CLI installed. It skips cleanly when `qwen` is not on the path; CI runs it with
`--require`, which turns the skip into a failure.

## What is not verified

The gates and the smoke test prove the loader and the wiring. They do not prove
the executor. In particular: no erfana skill has been run end to end inside a
Qwen session, and `model: opus` on most agents reaches Qwen verbatim, where a
silent fallback to the default model is indistinguishable from resolution.

Accepted risks are recorded in [`known-caveats.md`](known-caveats.md).

## Adding a third host

1. Add a row to `HOSTS` in `scripts/_lib/host_matrix.py`, and its tool aliases
   to `TOOL_ALIASES` if they differ.
2. Run `bash scripts/gen-hosts-table.sh` and commit the regenerated table.
3. Extend `CLAUDE_TO_QWEN_TOOL` – or generalise it – so Gate 14's matcher rule
   covers the new vocabulary.
4. Add a smoke test alongside `scripts/qwen-smoke.sh` and a CI job that runs it,
   plus a weekly canary against that host's latest release.
5. Write the degradation list here before claiming support anywhere else.

Support is revocable. `MAINTAINER.md` carries the demotion rule: a host whose
canary is red across two consecutive releases drops back to documented
best-effort.
