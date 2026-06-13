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
- Plugin configuration that ships to users (manifests, brand artifacts, safety hooks — bash `.sh` + Windows `.ps1` siblings).
- Brand-system artifacts under `skills/design-shared/brands/` — manifests, DTCG token files, and SVG logos. Gate 5 scans every brand SVG for XSS / supply-chain vectors (no `<script>`, no `<foreignObject>`, no external / `data:` / `javascript:` hrefs, no event-handler attributes); brand SVGs render via Playwright during MP4 export, making them an active execution surface.
- The 87 shared agents in `agents/`. The orchestration skills (`managing-issues`, `managing-articles`, etc.) delegate to these agents via the `Task` tool; depending on the user's configuration, agents may interact with GitHub (`gh` CLI), the Anthropic API, the local filesystem, and shell commands. Users running orchestration skills should review the relevant agent prompts before granting tool permissions in their session.
- The release pipeline (signed tags, GitHub Actions workflows).

Out of scope:

- Anthropic's Claude API (report directly to Anthropic at `security@anthropic.com`).
- A user's local environment configuration (shell, OS, Claude Code installation).

## Known limitations

- The plugin does not encrypt prompts in transit beyond what Claude Code already does (TLS to Anthropic's API). Confidential data should not flow through the plugin — see [`README.md`](README.md#confidentiality).
- The plugin ships ~15 agents with generic names (any agent in `agents/` whose name does not start with a team prefix such as `mi-`, `ma-`, `ms-`, `spec-`, `e2e-`, `release-`, `nest-`, `react-`). These may collide with built-in Claude Code agents or agents shipped by other plugins; resolution is last-loaded-wins and non-deterministic. The highest-trust shadow target is `agents/security-auditor`, invoked precisely when a user asks for a security review — a malicious plugin shadowing this name could ship attacker-controlled prompts with `Bash` + `Read` tool access. Users running multiple plugins should audit their installed plugin list and prefer prefix-named agents (e.g. `mi-codebase-explorer`) when invoking via the `Task` tool's `subagent_type` field. List the current collision-risk set with `ls agents/ | grep -vE '^(mi-|ma-|ms-|spec-|e2e-|release-|nest-|react-)'`.
