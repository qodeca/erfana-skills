# Erfana skills for Claude Code and Qwen Code

[![CI](https://github.com/qodeca/erfana-skills/actions/workflows/verify.yml/badge.svg)](https://github.com/qodeca/erfana-skills/actions/workflows/verify.yml)
[![License: GPL-3.0-only](https://img.shields.io/badge/license-GPL--3.0--only-blue.svg)](LICENSE)
[![Latest release](https://img.shields.io/github/v/release/qodeca/erfana-skills)](https://github.com/qodeca/erfana-skills/releases/latest)
![Claude Code plugin](https://img.shields.io/badge/Claude_Code-plugin-555)
![Qwen Code compatible](https://img.shields.io/badge/Qwen_Code-compatible-555)

*This page describes erfana v9.2.1. See the [changelog](CHANGELOG.md) for what changed since.*

**erfana** is an open-source plugin, by [Qodeca](https://github.com/qodeca), that adds ready-made ways of working to your coding agent: writing requirements specs, working GitHub issues end to end, reviewing code, writing reports and articles, drafting prompts and goals, and running long sessions without you watching every step.

It is for developers and the people who work with them – product owners, analysts, consultants – who use Claude Code or Qwen Code and want repeatable, reviewed results instead of one-off prompts. You decide; Claude does the work. Work you steer runs in your own conversation, and reviews go to separate checker agents (helper models that see only the work and the standard, not your conversation).

It ships as a Claude Code plugin and also runs on Qwen Code, which converts Claude Code plugins when you install them – one repository, one release, two hosts.

## Install

Before you start:

- **Claude Code** with the `/plugin` command. If Claude Code does not know `/plugin`, update it.
- Or **Qwen Code** 0.22.3 or later.
- **`jq`** on your `PATH` (macOS: `brew install jq`). Without it, five of the six safety hooks skip themselves and protect nothing. On Windows, the hooks need Git Bash and `powershell.exe` instead.
- **GitHub CLI (`gh`), signed in**, only for what reads or changes GitHub: the skills `issue`, `next-batch`, `coordinate`, and `ship`, and the slash commands `/erfana:explain-issue`, `/erfana:project-status`, `/erfana:cleanup`, and `/erfana:lens-review` on a pull request.

On **Claude Code**, run these inside a session:

```text
/plugin marketplace add qodeca/erfana-skills
/plugin install erfana@erfana-skills
```

Then restart Claude Code – type `/exit`, then run `claude` again – because skills, agents, and hooks load when a session starts. To check it worked, type `/erfana:` – autocomplete lists the erfana skills and commands. The full [install check](docs/how-to.md#check-the-install) also tests the safety hooks.

On **Qwen Code**, run this in a shell and accept the prompt Qwen shows. Already installed? Run `qwen extensions update erfana` instead, because `install` refuses when erfana is present.

```bash
qwen extensions install qodeca/erfana-skills:erfana
qwen extensions list
```

Then start a new `qwen` session, because skills, agents, and hooks load at session start. On Qwen Code, every skill and command uses its bare name: `/issue`, not `/erfana:issue`.

Updating, removing, proxies, and other install problems are covered in the [how-to guides](docs/how-to.md#install-on-claude-code).

## Where next

| You want to | Read |
|---|---|
| Try erfana for the first time | The [tutorial](docs/tutorial.md) – your first session, step by step |
| Get a specific job done | The [how-to guides](docs/how-to.md) |
| Look up a skill, agent, command, or hook | The [reference](docs/reference.md) |
| Understand how erfana works and why | The [explanation](docs/explanation.md) |
| See every page, including maintainer docs | The [docs home](docs/README.md) |

## What is inside

erfana ships 18 skills, 38 shared agents, 7 slash commands, and 6 safety hooks. A skill is a packaged way of doing one kind of task; Claude loads it when your words match its trigger phrases, or you start it with `/erfana:<name>`. Not sure which one fits? Ask Claude "which erfana skill should I use for this?" and the [`erfana:using-erfana`](docs/reference.md#erfanausing-erfana) router points you to one.

**Build and plan:**

- [`erfana:spec`](docs/reference.md#erfanaspec) – writes right-sized requirements specs in four tiers, from an issue-sized note to a full standard spec.
- [`erfana:issue`](docs/reference.md#erfanaissue) – drafts GitHub issues, implements an issue end to end with built-in reviews, reviews code or a pull request, and shows issues.
- [`erfana:grill-me`](docs/reference.md#erfanagrill-me) – questions you about a plan one question at a time, sized to the stakes; it recommends answers on facts and routine choices and asks about your judgment calls without leaning.
- [`erfana:expert-panel`](docs/reference.md#erfanaexpert-panel) – has a panel of specialist reviewers critique a plan or design, then writes an improved version.

**Write:**

- [`erfana:report`](docs/reference.md#erfanareport) – creates and reviews consulting reports to a house standard.
- [`erfana:article`](docs/reference.md#erfanaarticle) – researches, drafts, reviews, and publishes 2,000–3,000-word articles in English, Polish, or both.
- [`erfana:fact-checking`](docs/reference.md#erfanafact-checking) – traces each claim in a document to a passage in your local source files.

**Prompts and goals:**

- [`erfana:prompt`](docs/reference.md#erfanaprompt) – interviews you and writes or improves a prompt for a current Claude model.
- [`erfana:draft-goal`](docs/reference.md#erfanadraft-goal) – turns what you want done into a `/goal` condition, ready to paste.
- [`erfana:raise-the-bar`](docs/reference.md#erfanaraise-the-bar) – rewrites a request into a more ambitious one before you run it.

**Long and parallel sessions:**

- [`erfana:next-batch`](docs/reference.md#erfananext-batch) – picks the next GitHub issues to work on (10 by default, up to 25) and groups them by theme.
- [`erfana:coordinate`](docs/reference.md#erfanacoordinate) – keeps several sessions on one repository from taking the same issue.
- [`erfana:autopilot`](docs/reference.md#erfanaautopilot) – prepares an unattended run and picks it up again after a restart.

**Claude Code itself:**

- [`erfana:skill`](docs/reference.md#erfanaskill) and [`erfana:agent`](docs/reference.md#erfanaagent) – create, review, and change your own Claude Code skills and agents.

**Closing a session:**

- [`erfana:ship`](docs/reference.md#erfanaship) – commits, pushes, opens or merges the pull request, as far as you say.
- [`erfana:handoff`](docs/reference.md#erfanahandoff) – writes a handoff document so another session or colleague can continue.

Three skills never start from a phrase, because Claude may not start them on its own: `fact-checking`, `ship`, and `handoff`. Type their slash command. The same holds for the `/erfana:project-status`, `/erfana:session-status`, `/erfana:session-watch`, and `/erfana:cleanup` commands.

The [slash commands](docs/reference.md#slash-commands-7) cover status briefs, a task list timer, project cleanup, documentation refresh, issue explanations, and researched code review. The [safety hooks](docs/reference.md#safety-hooks-6) run on their own and block risky actions, such as deleting your home folder or writing an API key into a file. The [38 shared agents](docs/reference.md#agents-38) are the helpers the skills hand work to.

## Your data

Everything you send through a skill or agent goes to the model provider your host uses – for Claude Code, Anthropic's Claude API. Treat erfana like any other AI tool that runs on outside infrastructure:

- Do not paste client-confidential data, customer personal data, sensitive financial figures, unreleased product specs, credentials, or anything covered by an NDA.
- For sensitive work, read the agent prompts in [`agents/`](agents/) before you grant tools in your session.
- Read your provider's data-use and privacy terms before you send sensitive material.

## Help and contributing

- **Questions and bugs:** see [`SUPPORT.md`](SUPPORT.md).
- **Security issues:** report them privately, as [`SECURITY.md`](SECURITY.md) describes – not in a public issue.
- **Contributing:** see [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Contributions are accepted under the project [Contributor License Agreement](CLA.md); by opening a pull request you agree to its terms.
- **What is changing:** [`CHANGELOG.md`](CHANGELOG.md) and [`ROADMAP.md`](ROADMAP.md).

## License and trademarks

Copyright © 2025-2026 Qodeca sp. z o.o.

Licensed under the [GNU General Public License v3.0 only](LICENSE) (`GPL-3.0-only`). You are free to use, study, share, and change it; distributed derivatives must stay under the same license and ship their source. The license covers code, documentation, and bundled assets. Per-file licensing follows the [REUSE](https://reuse.software) specification; run `reuse lint` to check it.

The license does not grant rights to the "Erfana" or "Qodeca" names or logos, which are trademarks of Qodeca sp. z o.o. – see [`TRADEMARKS.md`](TRADEMARKS.md).

- "Claude" and "Claude Code" are trademarks of Anthropic. Erfana Skills is an independent, third-party plugin and is not affiliated with, sponsored by, or endorsed by Anthropic.
- "GitHub" and "GitHub Actions" are trademarks of GitHub, Inc. Erfana Skills works through their public API and is not affiliated with or endorsed by GitHub or Microsoft.
- "Playwright" is a trademark of Microsoft Corporation. Erfana Skills ships agents that write and review Playwright tests and is not affiliated with or endorsed by Microsoft.
- "Qwen" and "Qwen Code" are trademarks of their respective owners. Erfana Skills is an independent, third-party plugin that Qwen Code can convert and run, and is not affiliated with or endorsed by them.

## About

Erfana Skills is part of the Erfana family from Qodeca:

- **[Erfana](https://github.com/qodeca/erfana)** – the agent-native Markdown workspace (a desktop app). It is a separate project; this repository is the coding-agent plugin, not the app.
- **[8cli](https://github.com/qodeca/8cli)** – an AI-first, JSON-native command-line tool for managing n8n instances remotely.

Repository: `github.com/qodeca/erfana-skills`. Maintainer: Marcin Obel ([@marcinobel](https://github.com/marcinobel)). Governance: [`GOVERNANCE.md`](GOVERNANCE.md).

Built by [Qodeca](https://qodeca.com) – [LinkedIn](https://www.linkedin.com/company/qodecasoftwaredevelopment) · [hi@qodeca.com](mailto:hi@qodeca.com)
