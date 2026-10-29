# Security policy

`erfana` is an open-source Claude Code plugin (GPL-3.0-only). This policy covers how to report vulnerabilities and what is in scope.

## Supported versions

Only the latest release receives security fixes. Fixes are not backported to older versions, so update to the latest release to get them.

## Reporting a vulnerability

Please report security issues **privately** – do not open a public issue, pull request, or discussion for an unfixed vulnerability.

- **Preferred:** use GitHub's [private vulnerability reporting](https://github.com/qodeca/erfana-skills/security/advisories/new) (the "Report a vulnerability" button under the repository's **Security** tab). This keeps the report confidential between you and the maintainers until a fix ships.
- **If private reporting is unavailable to you:** open a minimal public issue that contains **no exploit details** – just ask the maintainers to open a private channel – and we will follow up.

Private reporting counts as unavailable when the "Report a vulnerability" button is missing, or the link does not open a report form. The form needs a signed-in GitHub account, and so does the fallback issue: both routes go through GitHub. GitHub is the only way to report, so you need a GitHub account.

Blank issues are turned off in this repository, so open the fallback issue from the [new issue page](https://github.com/qodeca/erfana-skills/issues/new/choose) with the **Bug report** template. The same page has a **Report a security vulnerability** link, which opens the private form from the preferred route. Its note asks you not to report vulnerabilities there – that means the details. In each required text field, write only that you are asking for a private security channel and are holding back the details, and pick your host in the required **Host** list.

Please include: the affected file(s) or component, reproduction steps or a proof of concept, the impact, any suggested remediation, the erfana version (shown by `claude plugin list` or `qwen extensions list`), and the host – Claude Code or Qwen Code – with its version (`claude --version` or `qwen --version`). We aim to acknowledge a report within a few business days and will credit reporters who wish to be named once a fix is released. No fixed timeline for a fix is promised: this is a small project, and each fix ships in a normal release when it is ready.

## Scope

In scope:

- The `erfana` plugin code in this repository (`.claude-plugin/`, `skills/`, `agents/`, `commands/`, `hooks/`, `docs/`, `scripts/`).
- Plugin configuration that ships to users (manifests, safety hooks – bash `.sh` + Windows `.ps1` siblings).
- The 33 shared agents in `agents/`. The orchestration skills (`issue`, `article`, etc.) delegate to these agents via the `Task` tool; depending on the user's configuration, agents may interact with GitHub (`gh` CLI), the Anthropic API, the local filesystem, and shell commands. Users running orchestration skills should review the relevant agent prompts before granting tool permissions in their session.
- The release pipeline (signed tags, GitHub Actions workflows).

Out of scope:

- Anthropic's Claude API (report directly to Anthropic at `security@anthropic.com`).
- A user's local environment configuration (shell, OS, Claude Code installation).

## Second host: Qwen Code

From v7.1.0 the same package also installs on Qwen Code, which converts Claude Code plugins at install time. That changes what this policy can and cannot cover.

**What is signed is the repository, not the installed bundle.** Release tags and commits are signed, and `git verify-tag` covers what this repo publishes. Qwen rewrites agent frontmatter and writes its own `qwen-extension.json` during conversion, so the tree in `~/.qwen/extensions/erfana/` is not byte-identical to the tag and carries no signature of ours. Verify the source, then verify the conversion did what you expect:

```bash
ls ~/.qwen/extensions/erfana/agents/*.md | wc -l   # expect 33
ls ~/.qwen/extensions/erfana/skills | wc -l        # expect 18 (the same as: ls skills | wc -l in the source)
diff hooks/hooks.json ~/.qwen/extensions/erfana/hooks/hooks.json   # expect no output
```

**Defects in the conversion itself belong upstream.** If Qwen drops an agent, mangles frontmatter, or mis-parses a manifest, report it to the Qwen Code project. What belongs here is anything erfana ships that is unsafe *because* of how the two hosts differ – a hook that fires on one host and not the other, or a block message that a host could be made to reinterpret. If a problem shows up only on Qwen Code and you cannot tell whether erfana or the conversion causes it, report it privately to erfana first; we pass it upstream if it belongs there.

**Reduced hook coverage on Qwen, and two fail-open directions on both hosts.** Read [`docs/hosts.md`](docs/hosts.md) for the full matrix; the security-relevant parts:

- Skill `allowed-tools` is **inert** on Qwen. Its extension parser reads a camelCase `allowedTools` key, so erfana's hyphenated key is never read and every erfana skill runs unrestricted there. On Claude Code the restriction applies as written.
- On macOS and Linux, every hook except `post-compact-reminder` parses its payload with `jq` (the Windows `.ps1` siblings do not need it). Without `jq` on `PATH` – the stock macOS default – `hooks/dispatch.sh` skips those hooks and exits 0, so both `PreToolUse` hooks and all three `Stop` hooks (`verify-completion`, `grill-guard`, `ms-grill-guard`) are off. `dispatch.sh` prints a diagnostic, but on exit 0 that diagnostic may not be shown. **Install `jq` if you rely on these hooks.**
- Hooks are bounded to five seconds inside `dispatch.sh`, and a killed hook exits 143 (SIGTERM) or dies by signal – never 2 – so neither host reads it as a block. A hook killed by the watchdog therefore **allows** the tool call. This is the same direction as the pre-v7.1.0 behaviour, but it is now the only bound.

**`--consent` is for CI only.** `scripts/qwen-smoke.sh` passes `--consent` to skip Qwen's install security prompt, which is appropriate for a job installing this repository's own working tree into a throwaway profile. Published install instructions deliberately omit it. Do not use it to install a fork or an untrusted marketplace – the prompt it skips is the one that tells you what you are about to trust.

## Known limitations

- The plugin does not encrypt prompts in transit beyond what Claude Code already does (TLS to Anthropic's API). Confidential data should not flow through the plugin – see [Your data in `README.md`](README.md#your-data).
- The plugin ships 14 agents with generic names (any agent in `agents/` whose name does not start with a skill or team prefix such as `agent-`, `skill-`, `issue-`, `spec-`, `article-`, `report-`, `fact-checking-`, `lens-`, `e2e-`, `release-`). These may collide with built-in Claude Code agents or agents shipped by other plugins; resolution is last-loaded-wins and non-deterministic. The highest-trust shadow target is `agents/security-auditor`, invoked precisely when a user asks for a security review – a malicious plugin shadowing this name could ship attacker-controlled prompts with `Bash` + `Read` tool access. Users running multiple plugins should audit their installed plugin list and prefer prefix-named agents (e.g. `spec-compliance-checker`) when invoking via the `Task` tool's `subagent_type` field. List the current collision-risk set with `ls agents/ | grep -vE '^(agent-|skill-|issue-|spec-|article-|report-|fact-checking-|lens-|e2e-|release-)'`.
