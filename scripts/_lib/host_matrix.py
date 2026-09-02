# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
"""Host matrix - the one place that knows how erfana's two hosts differ.

erfana ships as a Claude Code plugin. Qwen Code converts Claude Code plugins at
install time (it reads .claude-plugin/marketplace.json, copies the tree into
~/.qwen/extensions/<name>/, rewrites agent frontmatter and writes its own
qwen-extension.json), so one package serves both hosts with no build step.

Three surfaces are NOT converted and therefore have to be written for both
hosts by hand. This module is what the gates, the generator and the smoke test
all read so those three surfaces cannot drift apart:

1. hook `matcher:` strings in hooks/hooks.json - matched against the host's own
   tool vocabulary, never remapped (TOOL_ALIASES, CLAUDE_TO_QWEN_TOOL);
2. the hook `timeout` field - seconds on Claude Code, milliseconds on Qwen, with
   different defaults, so no value is correct on both (HOSTS);
3. agent frontmatter - Qwen's converter re-serialises from a fixed allowlist and
   silently drops everything else (AGENT_FRONTMATTER_KEPT / _DROPPED).

Deliberately plain dicts, not JSON plus a schema plus a loader. The payload is
about fifteen facts for two hosts; a config layer would be more machinery than
data. Gate 4 already ast.parses everything under scripts/_lib, so this file is
syntax-checked without a self-test of its own.

Consumers:
  scripts/gen-hosts-table.sh   - generates the host table inside docs/hosts.md
  scripts/gate-14-hooks.sh     - matcher dual-naming and the timeout ban
  scripts/gate-02 (inline)     - agent name rules, frontmatter key allowlist
  scripts/qwen-smoke.sh        - version drift and the bundle checksum below

Every value here was read out of the installed Qwen bundle, not out of
documentation. Provenance for each block is recorded inline. When Qwen ships a
new version the bundle checksum stops matching and the smoke test says so -
that is the only thing standing between this file and silent rot.
"""

# --- Hosts -----------------------------------------------------------------
#
# `hook_timeout_unit` and `hook_timeout_default` are the reason hooks/hooks.json
# carries no `timeout` key at all. Claude Code reads the field as seconds and
# defaults command hooks to 600 (Claude Code hooks guide, "Limitations":
# "`command`, `http`, `mcp_tool`: 10 minutes"). Qwen reads the same field as
# milliseconds and defaults to 60000 (hookRunner.ts:
# `const timeout = hookConfig.timeout ?? DEFAULT_HOOK_TIMEOUT` with
# `DEFAULT_HOOK_TIMEOUT = 6e4`, used raw). So `5` means 5 s here and 5 ms there,
# and `5000` means 5 s there and 83 minutes here. The bound lives in
# hooks/dispatch.sh instead, where it means the same thing on both.

HOSTS = {
    "claude-code": {
        "display": "Claude Code",
        "consumes": "native plugin",
        "install": "/plugin marketplace add qodeca/erfana-skills",
        "hook_timeout_unit": "seconds",
        "hook_timeout_default": 600,
        "min_version": None,      # no floor established; the plugin API is stable
        "tested_version": None,   # tracks whatever the maintainer runs
    },
    "qwen-code": {
        "display": "Qwen Code",
        "consumes": "converted at install time",
        "install": "qwen extensions install qodeca/erfana-skills:erfana",
        "hook_timeout_unit": "milliseconds",
        "hook_timeout_default": 60000,
        # Only 0.22.3 has been read and exercised. The floor is set equal to the
        # tested version deliberately: claiming support for an older release we
        # never opened would be a guess, and Qwen is pre-1.0 with a two-day
        # release cadence.
        "min_version": "0.22.3",
        "tested_version": "0.22.3",
    },
}

# --- Bundle provenance -----------------------------------------------------
#
# esbuild content-hashes the chunk filenames, so the NAME changes on every Qwen
# release even when the tables inside do not. Locate the chunk by content (the
# file containing `ToolNames = {`), then compare its digest. A mismatch means
# the alias tables below may have moved and must be re-read - it is not by
# itself a failure of erfana, which is why the smoke test reports it rather than
# the gates.

QWEN_BUNDLE = {
    "locate_by": "ToolNames = {",
    "observed_file": "chunk-UTLCH2FK.js",
    "observed_sha256": "f6f993e6177d917a53c6523cb50e4f783c11728dca58ddda13d4f07d0fa83617",
    "observed_version": "0.22.3",
}

# --- Tool vocabulary -------------------------------------------------------
#
# Qwen builds a hook matcher's target set as
#   {canonical, displayName, displayName + "Tool"} + legacy migration names
# (tool-utils.ts, TOOL_ALIAS_MAP). `matchesToolName` splits an unanchored `|`
# matcher into alternatives and exact-matches each against that set, falling
# back to `new RegExp(matcher).test(canonicalName)`.
#
# Only the tools erfana actually names in a matcher or an allowed-tools list are
# listed. The PreToolUse payload carries the CANONICAL name, which is why
# hooks/secret-detector.sh has to accept `write_file` and `edit` in its body
# even where the matcher already fires.

TOOL_ALIASES = {
    "run_shell_command": ["run_shell_command", "Shell", "ShellTool"],
    "write_file": ["write_file", "WriteFile", "WriteFileTool"],
    "read_file": ["read_file", "ReadFile", "ReadFileTool"],
    "edit": ["edit", "Edit", "EditTool", "replace"],
    "grep_search": ["grep_search", "Grep", "GrepTool", "search_file_content", "SearchFiles"],
    "glob": ["glob", "Glob", "GlobTool", "FindFiles"],
    "agent": ["agent", "Agent", "AgentTool", "task", "Task"],
    "todo_write": ["todo_write", "TodoList", "TodoListTool", "TodoWrite"],
    "ask_user_question": ["ask_user_question", "AskUserQuestion", "AskUserQuestionTool"],
    "web_search": ["web_search", "WebSearch", "WebSearchTool"],
    "web_fetch": ["web_fetch", "WebFetch", "WebFetchTool"],
    "notebook_edit": ["notebook_edit", "NotebookEdit", "NotebookEditTool"],
    "skill": ["skill", "Skill", "SkillTool"],
    "exit_plan_mode": ["exit_plan_mode", "ExitPlanMode", "ExitPlanModeTool"],
    "list_directory": ["list_directory", "ListFiles", "ListFilesTool", "ReadFolder"],
}

# Claude tool name -> the Qwen canonical name a matcher must ALSO carry, or None
# when the Claude name already appears in the Qwen alias set (or has no Qwen
# counterpart at all). Gate 14 reads this: a matcher naming a key on the left
# must also name its value on the right.
#
# `Edit` is the case worth spelling out. It looks like it needs a partner and
# does not: `Edit` is Qwen's DISPLAY name for canonical `edit`, so a matcher
# saying `Edit` already fires on every Qwen edit. Adding a lowercase `edit`
# alternative would be actively harmful - it fails alias matching, then hits the
# regex fallback, where `new RegExp("...|edit").test("notebook_edit")` is a
# substring test that returns true and silently widens coverage.

CLAUDE_TO_QWEN_TOOL = {
    "Bash": "run_shell_command",
    "Write": "write_file",
    "Read": "read_file",
    "Edit": None,          # display-name alias of `edit`; already resolves
    "Grep": None,          # display-name alias of `grep_search`
    "Glob": None,          # display-name alias of `glob`
    "Task": None,          # legacy display name of `agent`
    "TodoWrite": None,     # legacy display name of `todo_write`
    "AskUserQuestion": None,
    "WebSearch": None,
    "WebFetch": None,
    "NotebookEdit": None,
    "Skill": None,
    "ExitPlanMode": None,
    "MultiEdit": None,     # no Qwen counterpart exists; nothing to name
    "SlashCommand": None,  # no Qwen counterpart exists
}

# Claude-only names with no Qwen tool behind them. Naming one in a matcher is
# not an error - it simply never fires on Qwen - but it must be a deliberate
# choice rather than an oversight, so the gate reports it.
NO_QWEN_COUNTERPART = ["MultiEdit", "SlashCommand"]

# --- Agent frontmatter -----------------------------------------------------
#
# convertClaudeAgentConfig re-serialises each agents/*.md from this allowlist and
# writes the result back into the installed copy. Anything absent is dropped
# without a warning. `tools:` values are remapped on the way through
# (CLAUDE_TOOLS_MAPPING: Bash->Shell, Read->ReadFile, Write->WriteFile,
# TodoWrite->TodoList, Task->Task; unmapped names pass through unchanged), which
# is why agent tools: lists keep Claude names and hook matchers do not.

AGENT_FRONTMATTER_KEPT = [
    "name", "description", "color", "tools", "model",
    "permissionMode", "hooks", "mcpServers", "skills", "disallowedTools",
]

# Dropped on Qwen but load-bearing on Claude Code, so they stay in the files.
# The value is the reason the loss is acceptable, quoted in docs/hosts.md.
AGENT_FRONTMATTER_DROPPED = {
    "effort": "Claude-only reasoning-effort override; Qwen has no equivalent field",
    "capabilities": "documentation for the agent matcher; never read at runtime",
    "type": "documentation only",
    "file_restrictions": "documentation only; not enforced on either host",
}

# Qwen drops an agent outright, with no warning, when its name is over 50
# characters, is not identifier-shaped, or collides with one of these.
QWEN_RESERVED_AGENT_NAMES = [
    "self", "system", "user", "model", "tool", "config", "default", "main",
]
QWEN_AGENT_NAME_MAX = 50

# --- Skill frontmatter -----------------------------------------------------
#
# Qwen's EXTENSION skill parser reads these keys and nothing else. Note
# `allowedTools` in camelCase: erfana writes `allowed-tools:`, so the field is
# never read and erfana's skills run unrestricted on Qwen. Keep the hyphenated
# Claude spelling anyway - Claude Code enforces it, and renaming would trade a
# real restriction for a cosmetic one.
#
# The separate STRICT validator (used for managed, not extension, skills) throws
# on a non-string allowed-tools and the caller then skips the whole skill. That
# is why skills/managing-specs/SKILL.md uses a comma string rather than a YAML
# flow sequence: latent today, one upstream change from silently deleting a
# skill.

SKILL_FRONTMATTER_READ_BY_QWEN = [
    "name", "description", "allowedTools", "argument-hint", "model",
    "when_to_use", "disable-model-invocation", "user-invocable", "paths", "priority",
]

# Not extracted on the extension path. The shipped source calls this an open
# alignment task and only speculates that it may be a security boundary, so it
# is a to-do rather than a settled design and could close in a later release -
# at which point the guards now in hooks/hooks.json would double-register.
SKILL_FRONTMATTER_IGNORED_BY_QWEN = ["hooks"]


def qwen() -> dict:
    """The Qwen host row. Shorthand for the consumers that only need this one."""
    return HOSTS["qwen-code"]


def matcher_partners(matcher: str) -> list:
    """Qwen canonical names a matcher string is missing.

    Splits an unanchored `|` matcher the way Qwen does and returns, for each
    alternative that names a Claude-only tool with a Qwen counterpart, the
    counterpart that is absent. An empty list means the matcher resolves the
    same set of tools on both hosts.
    """
    alternatives = [part.strip() for part in matcher.split("|") if part.strip()]
    missing = []
    for alternative in alternatives:
        partner = CLAUDE_TO_QWEN_TOOL.get(alternative)
        if partner and partner not in alternatives:
            missing.append(partner)
    return missing
