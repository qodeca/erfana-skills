# Security policy

`erfana` is an open-source Claude Code plugin (GPL-3.0-only). This policy covers how to report vulnerabilities and what is in scope.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue, pull request, or discussion for an unfixed vulnerability.

- **Preferred:** use GitHub's [private vulnerability reporting](https://github.com/qodeca/erfana-skills/security/advisories/new) (the "Report a vulnerability" button under the repository's **Security** tab). This keeps the report confidential between you and the maintainers until a fix ships.
- **If private reporting is unavailable to you:** open a minimal public issue that contains **no exploit details** — just ask the maintainers to open a private channel — and we will follow up.

Please include: the affected file(s) or component, reproduction steps or a proof of concept, the impact, and any suggested remediation. We aim to acknowledge a report within a few business days and will credit reporters who wish to be named once a fix is released.

## Scope

In scope:

- The `erfana` plugin code in this repository (`.claude-plugin/`, `skills/`, `agents/`, `commands/`, `hooks/`, `docs/`, `scripts/`).
- Plugin configuration that ships to users (manifests, safety hooks — bash `.sh` + Windows `.ps1` siblings).
- The 87 shared agents in `agents/`. The orchestration skills (`managing-issues`, `managing-articles`, etc.) delegate to these agents via the `Task` tool; depending on the user's configuration, agents may interact with GitHub (`gh` CLI), the Anthropic API, the local filesystem, and shell commands. Users running orchestration skills should review the relevant agent prompts before granting tool permissions in their session.
- The release pipeline (signed tags, GitHub Actions workflows).

Out of scope:

- Anthropic's Claude API (report directly to Anthropic at `security@anthropic.com`).
- A user's local environment configuration (shell, OS, Claude Code installation).

## Second host: Qwen Code

From v7.1.0 the same package also installs on Qwen Code, which converts Claude Code plugins at install time. That changes what this policy can and cannot cover.

**What is signed is the repository, not the installed bundle.** Release tags and commits are signed, and `git verify-tag` covers what this repo publishes. Qwen rewrites agent frontmatter and writes its own `qwen-extension.json` during conversion, so the tree in `~/.qwen/extensions/erfana/` is not byte-identical to the tag and carries no signature of ours. Verify the source, then verify the conversion did what you expect:

```bash
ls ~/.qwen/extensions/erfana/agents/*.md | wc -l   # expect 87
ls ~/.qwen/extensions/erfana/skills | wc -l        # expect 9
diff hooks/hooks.json ~/.qwen/extensions/erfana/hooks/hooks.json   # expect no output
```

**Defects in the conversion itself belong upstream.** If Qwen drops an agent, mangles frontmatter, or mis-parses a manifest, report it to the Qwen Code project. What belongs here is anything erfana ships that is unsafe *because* of how the two hosts differ – a hook that fires on one host and not the other, or a block message that a host could be made to reinterpret.

**Reduced hook coverage on Qwen, and two fail-open directions on both hosts.** Read [`docs/hosts.md`](docs/hosts.md) for the full matrix; the security-relevant parts:

- Skill `allowed-tools` is **inert** on Qwen. Its extension parser reads a camelCase `allowedTools` key, so erfana's hyphenated key is never read and every erfana skill runs unrestricted there. On Claude Code the restriction applies as written.
- Both `PreToolUse` hooks parse their payload with `jq` and reach their allow branch when the parse yields nothing. Without `jq` on `PATH` – the stock macOS default – they inspect nothing. `hooks/dispatch.sh` emits a diagnostic, but on exit 0 that diagnostic may not be surfaced. **Install `jq` if you rely on these hooks.**
- Hooks are bounded to five seconds inside `dispatch.sh`, and a killed hook exits 143 (SIGTERM) or dies by signal – never 2 – so neither host reads it as a block. A hook killed by the watchdog therefore **allows** the tool call. This is the same direction as the pre-v7.1.0 behaviour, but it is now the only bound.

**`--consent` is for CI only.** `scripts/qwen-smoke.sh` passes `--consent` to skip Qwen's install security prompt, which is appropriate for a job installing this repository's own working tree into a throwaway profile. Published install instructions deliberately omit it. Do not use it to install a fork or an untrusted marketplace – the prompt it skips is the one that tells you what you are about to trust.

## Known limitations

- The plugin does not encrypt prompts in transit beyond what Claude Code already does (TLS to Anthropic's API). Confidential data should not flow through the plugin — see [`README.md`](README.md#confidentiality).
- The plugin ships ~15 agents with generic names (any agent in `agents/` whose name does not start with a team prefix such as `mi-`, `ma-`, `ms-`, `spec-`, `e2e-`, `release-`, `nest-`, `react-`, `grill-`, `article-`, `fc-`). These may collide with built-in Claude Code agents or agents shipped by other plugins; resolution is last-loaded-wins and non-deterministic. The highest-trust shadow target is `agents/security-auditor`, invoked precisely when a user asks for a security review — a malicious plugin shadowing this name could ship attacker-controlled prompts with `Bash` + `Read` tool access. Users running multiple plugins should audit their installed plugin list and prefer prefix-named agents (e.g. `mi-codebase-explorer`) when invoking via the `Task` tool's `subagent_type` field. List the current collision-risk set with `ls agents/ | grep -vE '^(mi-|ma-|ms-|spec-|e2e-|release-|nest-|react-|grill-|article-|fc-)'`.
