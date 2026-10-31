# Reference

<!-- GENERATED FILE - DO NOT EDIT BY HAND. -->
<!-- Regenerate with: bash scripts/gen-reference.sh -->

*This page describes erfana v9.3.0. See the [changelog](../CHANGELOG.md) for what changed since.*

Everything erfana ships, read straight from the plugin files by
[`scripts/gen-reference.sh`](../scripts/gen-reference.sh). Gate 19 fails the
build when this page and the files disagree, so what you read here is what
you get. For how to use these parts together, start with the
[tutorial](tutorial.md) or the [how-to guides](how-to.md).

On Claude Code, start a skill or command as `/erfana:<name>`. On Qwen Code,
use the bare name, for example `/issue`. Claude also loads a skill on its own
when your words match its trigger phrases, unless the skill is marked
"you start it".

## Skills (18)

| Skill | Started by | What it is for |
|---|---|---|
| [`erfana:agent`](#erfanaagent) | you or Claude | Creates, reviews, and changes Claude Code agents (subagents) to the current Anthropic standard for the Claude 5.5 generation – calm routing descriptions, least-privilege tools, a prompt that states the job, its limits, and its output – and builds doer/reviewer pairs. |
| [`erfana:article`](#erfanaarticle) | you or Claude | Researches, outlines, drafts, reviews, revises, and publishes medium-form articles (2,000–3,000 words) in English, Polish, or both, with every claim tied to a listed source, a blinded editorial review, and versioned drafts that are never overwritten. |
| [`erfana:autopilot`](#erfanaautopilot) | you or Claude | Sets up and keeps alive an unattended work run – writes the /goal condition from the session itself, keeps one state file with progress and a queue of what needs the owner, keeps the task list down to open work, and picks the run up again after a restart or compaction. |
| [`erfana:coordinate`](#erfanacoordinate) | you or Claude | Keeps parallel Claude sessions on the same repository out of each other's way – claims GitHub issues so no two sessions take the same one, shows who holds what, releases claims, and exchanges a short status with sibling sessions on the same machine. |
| [`erfana:draft-goal`](#erfanadraft-goal) | you or Claude | Turns a fuzzy intention into a /goal completion condition that the goal evaluator can judge from the transcript – one outcome, numbered checks with visible evidence, explicit exclusions, an owner-decisions clause, and a turn bound – and prints it ready to paste. |
| [`erfana:expert-panel`](#erfanaexpert-panel) | you or Claude | Runs a panel of top-practitioner reviewers over a plan, design, or set of documents – picks the roles the target needs, has each review it independently, merges what they find, puts the owner's decisions to the user, and ends with an improved version of the plan. |
| [`erfana:fact-checking`](#erfanafact-checking) | you start it | Checks a markdown analysis document against the source materials it was written from – interview transcripts, vendor documents, notes – to catch hallucinations. |
| [`erfana:grill-me`](#erfanagrill-me) | you or Claude | Use when the user wants to stress-test a plan or design through relentless one-at-a-time questioning until shared understanding is reached, sized to the stakes of the plan. |
| [`erfana:handoff`](#erfanahandoff) | you start it | Compacts the current conversation into a handoff document that another agent, harness, directory, or colleague can pick up. |
| [`erfana:issue`](#erfanaissue) | you or Claude | Works the GitHub issue lifecycle – drafts well-formed issues for approval, implements an existing issue end to end with embedded reviews and the user's acceptance at UAT, reviews source code from one file up to a pull request or a spec-compliance audit, and shows issues read-only. |
| [`erfana:next-batch`](#erfananext-batch) | you or Claude | Picks the next batch of GitHub issues for a working session – reads the open issues, skips the ones other sessions have claimed, ranks the rest by impact on delivery, groups the top ones by theme, and saves the batch for an unattended run. |
| [`erfana:prompt`](#erfanaprompt) | you or Claude | Interviews the user and writes or improves a prompt for a current Claude model (Opus 5.5, Sonnet 5.5, Fable 5.1), ending with a paste-ready prompt that follows Anthropic's guidance for Claude 5-generation models. |
| [`erfana:raise-the-bar`](#erfanaraise-the-bar) | you or Claude | Rewrites a request the user is about to give Claude into a more ambitious one – aimed at the outcome behind the task, done the way a top practitioner would, and drawing on other fields – grounded in what Claude can actually reach and checked by something other than Claude. |
| [`erfana:report`](#erfanareport) | you or Claude | Creates, reviews, revises, and versions professional consulting reports to a house standard – Pyramid Principle, SCQA, Five C's findings, a bottom-line-first executive summary, sentence case, and plain, precise prose. |
| [`erfana:ship`](#erfanaship) | you start it | Closes out the current work – commits, pushes, opens or updates the pull request, and on request waits for the checks, merges, deletes the branch, closes the linked issue, and tidies merged branches and worktrees. |
| [`erfana:skill`](#erfanaskill) | you or Claude | Creates, reviews, changes, and modernizes Claude Code skills to the current Anthropic standard for the Claude 5.5 generation – trigger-shaped descriptions, a body written as a brief with its ground rules first, least-privilege tools, and a way out when blocked – starting every create with a requirements interview. |
| [`erfana:spec`](#erfanaspec) | you or Claude | Creates, changes, reviews, reconciles, and archives right-sized requirements specifications in four tiers (T1 issue, T2 spec, T3 lite spec, T4 standard spec), with a project registry whose spec IDs are never reused and a separate checker that reviews each spec. |
| [`erfana:using-erfana`](#erfanausing-erfana) | you or Claude | Routes a request to the right erfana skill – agents, skills, GitHub issues, specifications, reports, articles, plan stress-tests, prompts, goals – and names the slash command for the skills only the user can start. |

### `erfana:agent`

Creates, reviews, and changes Claude Code agents (subagents) to the current Anthropic standard for the Claude 5.5 generation – calm routing descriptions, least-privilege tools, a prompt that states the job, its limits, and its output – and builds doer/reviewer pairs.

- **Start:** `/erfana:agent` `[what the agent should do, or the path of an agent to review or change]`
- **Started by:** you or Claude
- **Trigger phrases:** "create an agent", "build a new agent", "make an agent that…", "review the X agent", "audit our agents", "check agent quality", "modify the X agent", "update agent Y to do Z", "create a doer/reviewer pair", "how do I create a Claude Code agent?"
- **Source:** [`skills/agent/SKILL.md`](../skills/agent/SKILL.md)

### `erfana:article`

Researches, outlines, drafts, reviews, revises, and publishes medium-form articles (2,000–3,000 words) in English, Polish, or both, with every claim tied to a listed source, a blinded editorial review, and versioned drafts that are never overwritten.

- **Start:** `/erfana:article` `[topic of a new article, or the project folder to work on]`
- **Started by:** you or Claude
- **Trigger phrases:** "write an article", "draft a 2500-word article", "research and outline an article", "review my article draft", "revise the article based on the review", "publish article", "archive the article", "napisz artykuł", "zrecenzuj mój artykuł", "popraw szkic artykułu"
- **Source:** [`skills/article/SKILL.md`](../skills/article/SKILL.md)

### `erfana:autopilot`

Sets up and keeps alive an unattended work run – writes the /goal condition from the session itself, keeps one state file with progress and a queue of what needs the owner, keeps the task list down to open work, and picks the run up again after a restart or compaction.

- **Start:** `/erfana:autopilot` `[start [what to work on | .local/next-batch.md] | status | resume | stop]`
- **Started by:** you or Claude
- **Trigger phrases:** "work unattended", "run this autonomously", "prepare the unattended run for this session", "resume the work you were doing before the restart", "autopilot status", "do you need anything from me?", "did you finish everything?"
- **Source:** [`skills/autopilot/SKILL.md`](../skills/autopilot/SKILL.md)

### `erfana:coordinate`

Keeps parallel Claude sessions on the same repository out of each other's way – claims GitHub issues so no two sessions take the same one, shows who holds what, releases claims, and exchanges a short status with sibling sessions on the same machine.

- **Start:** `/erfana:coordinate` `[claim #N… | release #N… | board | sync]`
- **Started by:** you or Claude
- **Trigger phrases:** "claim #N", "which issues are taken", "check with the other sessions", "synchronize with the other \<project> sessions", "don't step on the other sessions", "release my claims"
- **Source:** [`skills/coordinate/SKILL.md`](../skills/coordinate/SKILL.md)

### `erfana:draft-goal`

Turns a fuzzy intention into a /goal completion condition that the goal evaluator can judge from the transcript – one outcome, numbered checks with visible evidence, explicit exclusions, an owner-decisions clause, and a turn bound – and prints it ready to paste. Use when someone wants to set or tighten a goal, asks whether a goal condition is good enough, or wants Claude to keep going until something is done. Writes the condition only; it does not start the work.

- **Start:** `/erfana:draft-goal` `[what you want done, or an existing /goal condition to tighten]`
- **Started by:** you or Claude
- **Trigger phrases:** "draft a goal", "help me write a /goal", "turn this into a goal", "is this goal condition good", "tighten my goal", "keep going until this is done", "why does my goal never finish", "set up a goal for this task"
- **Source:** [`skills/draft-goal/SKILL.md`](../skills/draft-goal/SKILL.md)

### `erfana:expert-panel`

Runs a panel of top-practitioner reviewers over a plan, design, or set of documents – picks the roles the target needs, has each review it independently, merges what they find, puts the owner's decisions to the user, and ends with an improved version of the plan.

- **Start:** `/erfana:expert-panel` `<path, folder, or plan> [review | improve (default) | apply]`
- **Started by:** you or Claude
- **Trigger phrases:** "fan out top 1% specialists", "get specialists to review this plan", "expert review of the design", "have experts look at the docs", "panel review", "critique this plan", "poke holes in this design", "prepare an enhancement plan based on the findings"
- **Source:** [`skills/expert-panel/SKILL.md`](../skills/expert-panel/SKILL.md)

### `erfana:fact-checking`

Checks a markdown analysis document against the source materials it was written from – interview transcripts, vendor documents, notes – to catch hallucinations. Breaks the document into atomic claims, traces each to a quoted source passage, ranks the problems by severity, and applies only the corrections the user approves.

- **Start:** `/erfana:fact-checking` `<target-file> [--section N]`
- **Started by:** you start it
- **Source:** [`skills/fact-checking/SKILL.md`](../skills/fact-checking/SKILL.md)

### `erfana:grill-me`

Use when the user wants to stress-test a plan or design through relentless one-at-a-time questioning until shared understanding is reached, sized to the stakes of the plan.

- **Start:** `/erfana:grill-me`
- **Started by:** you or Claude
- **Trigger phrases:** "grill me", "quick grill", "grill me lightly", "stress-test this plan", "stress test my design", "interview me about this", "get grilled on my design", "ask me hard questions", "challenge my plan", "challenge my design", "poke holes in this", "walk the decision tree"
- **Source:** [`skills/grill-me/SKILL.md`](../skills/grill-me/SKILL.md)

### `erfana:handoff`

Compacts the current conversation into a handoff document that another agent, harness, directory, or colleague can pick up. Runs only when the user invokes it.

- **Start:** `/erfana:handoff` `What will the next session be used for?`
- **Started by:** you start it
- **Source:** [`skills/handoff/SKILL.md`](../skills/handoff/SKILL.md)

### `erfana:issue`

Works the GitHub issue lifecycle – drafts well-formed issues for approval, implements an existing issue end to end with embedded reviews and the user's acceptance at UAT, reviews source code from one file up to a pull request or a spec-compliance audit, and shows issues read-only.

- **Start:** `/erfana:issue` `[create … | implement #N | review <scope> | show #N | list | search <query>]`
- **Started by:** you or Claude
- **Trigger phrases:** "create an issue", "file an issue", "report a bug", "request a feature", "implement #N", "fix #N", "work on issue #N", "review code", "review this file", "review the PR", "audit security", "audit code against spec", "check spec compliance", "show issue #N", "list issues", "search issues"
- **Source:** [`skills/issue/SKILL.md`](../skills/issue/SKILL.md)

### `erfana:next-batch`

Picks the next batch of GitHub issues for a working session – reads the open issues, skips the ones other sessions have claimed, ranks the rest by impact on delivery, groups the top ones by theme, and saves the batch for an unattended run.

- **Start:** `/erfana:next-batch` `[how many, default 10] [focus, e.g. bugs | performance | a label]`
- **Started by:** you or Claude
- **Trigger phrases:** "pick the next issues", "what should we work on next", "review all open issues and pick the 10 most important", "group them by theme and priority", "next batch", "pick free issues for the next batch"
- **Source:** [`skills/next-batch/SKILL.md`](../skills/next-batch/SKILL.md)

### `erfana:prompt`

Interviews the user and writes or improves a prompt for a current Claude model (Opus 5.5, Sonnet 5.5, Fable 5.1), ending with a paste-ready prompt that follows Anthropic's guidance for Claude 5-generation models. Use when someone wants a new prompt, a better prompt, or prompt-engineering help – not to carry out the task the prompt describes.

- **Start:** `/erfana:prompt` `[goal, or a draft prompt to improve]`
- **Started by:** you or Claude
- **Trigger phrases:** "write a prompt", "improve my prompt", "help me prompt Claude", "turn this into a prompt", "review this system prompt", "write a prompt for Opus", "write a prompt for Fable", "why does my prompt not work"
- **Source:** [`skills/prompt/SKILL.md`](../skills/prompt/SKILL.md)

### `erfana:raise-the-bar`

Rewrites a request the user is about to give Claude into a more ambitious one – aimed at the outcome behind the task, done the way a top practitioner would, and drawing on other fields – grounded in what Claude can actually reach and checked by something other than Claude. Use when someone wants to aim higher, go deeper, or get more out of a task before running it. Rewrites the request only; it does not do the work.

- **Start:** `/erfana:raise-the-bar` `[the request you are about to give Claude]`
- **Started by:** you or Claude
- **Trigger phrases:** "raise the bar", "be more ambitious with this", "aim higher", "think bigger about this task", "make this request more ambitious", "what would a top expert do here", "go deeper on this ask", "am I asking for too little"
- **Source:** [`skills/raise-the-bar/SKILL.md`](../skills/raise-the-bar/SKILL.md)

### `erfana:report`

Creates, reviews, revises, and versions professional consulting reports to a house standard – Pyramid Principle, SCQA, Five C's findings, a bottom-line-first executive summary, sentence case, and plain, precise prose. A report passes review only when all six house checks pass.

- **Start:** `/erfana:report`
- **Started by:** you or Claude
- **Trigger phrases:** "create report", "review report", "validate report", "fix report issues", "version report"
- **Source:** [`skills/report/SKILL.md`](../skills/report/SKILL.md)

### `erfana:ship`

Closes out the current work – commits, pushes, opens or updates the pull request, and on request waits for the checks, merges, deletes the branch, closes the linked issue, and tidies merged branches and worktrees. Runs only when the user invokes it, because it pushes to a shared remote.

- **Start:** `/erfana:ship` `[commit | push | pr | merge | cleanup] (default: pr)`
- **Started by:** you start it
- **Source:** [`skills/ship/SKILL.md`](../skills/ship/SKILL.md)

### `erfana:skill`

Creates, reviews, changes, and modernizes Claude Code skills to the current Anthropic standard for the Claude 5.5 generation – trigger-shaped descriptions, a body written as a brief with its ground rules first, least-privilege tools, and a way out when blocked – starting every create with a requirements interview.

- **Start:** `/erfana:skill` `[what the skill should do, or the path of a skill to review or change]`
- **Started by:** you or Claude
- **Trigger phrases:** "create a skill", "build a new skill", "make a skill that…", "review the X skill", "audit our skills", "modify skill X", "update the X skill", "modernize skill X", "apply Claude 5 patterns", "Claude 5 refresh", "how do I create a skill?"
- **Source:** [`skills/skill/SKILL.md`](../skills/skill/SKILL.md)

### `erfana:spec`

Creates, changes, reviews, reconciles, and archives right-sized requirements specifications in four tiers (T1 issue, T2 spec, T3 lite spec, T4 standard spec), with a project registry whose spec IDs are never reused and a separate checker that reviews each spec.

- **Start:** `/erfana:spec` `<what to do> [spec id]`
- **Started by:** you or Claude
- **Trigger phrases:** "create a spec", "write requirements", "spec out this feature", "add a requirement", "update the spec", "validate the spec", "spec status", "reconcile spec with code", "list specs", "archive a spec"
- **Source:** [`skills/spec/SKILL.md`](../skills/spec/SKILL.md)

### `erfana:using-erfana`

Routes a request to the right erfana skill – agents, skills, GitHub issues, specifications, reports, articles, plan stress-tests, prompts, goals – and names the slash command for the skills only the user can start.

- **Start:** `/erfana:using-erfana`
- **Started by:** you or Claude
- **Trigger phrases:** "which erfana skill", "what can erfana do", "help me pick a skill", "create an agent", "create a skill", "implement issue", "create a spec", "write an article", "create a report", "grill me", "write a prompt", "draft a goal", "pick the next issues", "claim issue", "fan out specialists", "have specialists review this plan", "run this unattended", "raise the bar", "review my skill", "stress-test this plan", "fact-check this", "commit and push", "open a pull request", "hand this off to another session"
- **Source:** [`skills/using-erfana/SKILL.md`](../skills/using-erfana/SKILL.md)

## Agents (38)

Agents are helpers that skills start for a narrow job, such as a blinded
review. You can also ask Claude to use one by name. Each runs with only the
tools listed here.

| Agent | What it does | Tools | Model | Effort |
|---|---|---|---|---|
| [`agent-researcher`](../agents/agent-researcher.md) | Used by erfana:agent to research a new agent's domain online – practices, pitfalls, and whether an agent is the right tool – and return a short sourced brief. | Read, Glob, Grep, WebSearch, WebFetch | sonnet | medium |
| [`agent-reviewer`](../agents/agent-reviewer.md) | Used by erfana:agent to review an agent file against the agent standard and return every finding with its evidence. | Read, Grep, Glob | sonnet | medium |
| [`architecture-reviewer`](../agents/architecture-reviewer.md) | Reviews code structure – SOLID, design patterns, anti-patterns, code smells, and technical debt – and recommends ordered, risk-rated refactorings without changing code. Use when judging a module's design or planning a refactor; for line-level code quality use code-reviewer. | Read, Grep, Glob, WebSearch, WebFetch | opus | medium |
| [`article-researcher`](../agents/article-researcher.md) | Used by erfana:article to research an article brief on the web and write a sourced research file and source list. | Read, Write, WebSearch, WebFetch, Grep, Glob | sonnet | medium |
| [`article-reviewer`](../agents/article-reviewer.md) | Used by erfana:article to review article drafts against the review standard and return every finding with its evidence. | Read, Grep, Glob | sonnet | medium |
| [`bug-investigator`](../agents/bug-investigator.md) | Finds the root cause of errors, crashes, and unexpected behavior through read-only investigation. Use when debugging a failure before deciding on a fix. | Read, Grep, Glob | opus | high |
| [`code-reviewer`](../agents/code-reviewer.md) | Reviews code for bugs, security, TypeScript safety, quality, and tests, with stack checks for React (hooks, accessibility, forms) and Nest.js (modules, guards, Zod, Prisma). Use for a code or PR review; for structure and refactoring use architecture-reviewer. | Read, Grep, Glob, Bash | opus | medium |
| [`commit-writer`](../agents/commit-writer.md) | Writes Conventional Commits messages and pull request descriptions from the current changes. Use when preparing a commit or a PR. Drafts text only; does not commit. | Bash | opus | medium |
| [`devops-reviewer`](../agents/devops-reviewer.md) | Reviews CI workflows, Dockerfiles, and deployment or infrastructure files for security, reliability, and safe rollback. Use when pipeline or deployment files change or before a first deploy; for a code security audit use security-auditor. | Read, Grep, Glob | opus | medium |
| [`documentation-reviewer`](../agents/documentation-reviewer.md) | Reviews project documentation against the code for accuracy, clarity, and how fast a reader can find a fact. Use after docs change or when docs seem stale; it reports findings only. To write or fix docs use documentation-writer. | Read, Grep, Glob | sonnet | medium |
| [`documentation-writer`](../agents/documentation-writer.md) | Writes and updates project documentation from the code – guides, READMEs, reference pages, and agent context files. Use when docs need writing or changing; to check docs use documentation-reviewer, and for a full repository refresh use /erfana:doc-update. | Read, Write, Edit, Glob, Grep | sonnet | medium |
| [`e2e-test-design-reviewer`](../agents/e2e-test-design-reviewer.md) | Reviews an e2e test design for completeness, traceability, and coverage against the requirements. Use after e2e-test-designer produces a test design. | Read, Glob, Grep, WebSearch | opus | medium |
| [`e2e-test-designer`](../agents/e2e-test-designer.md) | Designs framework-agnostic e2e test specifications from spec acceptance criteria or use cases. Use when planning e2e tests before any test code is written. | Read, Write, Glob, Grep, WebSearch, WebFetch | opus | session default |
| [`e2e-test-reviewer`](../agents/e2e-test-reviewer.md) | Reviews written e2e tests for flakiness, isolation, selector resilience, and best practices. Use after e2e tests are written or when they are flaky; for test design specs use e2e-test-design-reviewer. | Read, Glob, Grep, WebSearch | opus | session default |
| [`e2e-test-writer`](../agents/e2e-test-writer.md) | Writes end-to-end tests in Playwright, Cypress, or Selenium. Use when adding or extending e2e coverage for a user flow. | Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch | opus | medium |
| [`fact-checking-verifier`](../agents/fact-checking-verifier.md) | Used by erfana:fact-checking to verify a batch of extracted claims against confirmed source files and return a verdict with evidence for each. | Read, Grep, Glob | opus | high |
| [`issue-solution-designer`](../agents/issue-solution-designer.md) | Used by erfana:issue to plan an implementation, verify it against the plan and criteria, and judge embedded-review findings. | Read, Grep, Glob, Write | opus | high |
| [`lens-agent-discoverer`](../agents/lens-agent-discoverer.md) | Used by /erfana:lens-review to list the available builtin and shared agents with their capabilities and tools. | Read, Glob, Grep | opus | low |
| [`performance-reviewer`](../agents/performance-reviewer.md) | Reviews code for slow paths, wasteful queries, memory growth, and scaling limits, and separates measured problems from suspected ones. Use when code feels slow, before a load increase, or for hot-path changes; for general quality use code-reviewer. | Read, Grep, Glob | opus | medium |
| [`release-preparer`](../agents/release-preparer.md) | Prepares a release – user-focused notes from the commits between tags, version bump, checks, build, local tag – or only the notes when that is all that is wanted. Never pushes or publishes. Use when cutting a release or writing release notes; for Electron quality gates use release-quality-runner. | Read, Write, Edit, Bash, Glob, Grep | opus | medium |
| [`release-quality-runner`](../agents/release-quality-runner.md) | Runs release quality gates – lint, typecheck, tests, security audit – for Electron apps and reports the results. Use before building release artifacts; it does not prepare the release (release-preparer) or review code. | Bash, Read, Glob, Grep | sonnet | session default |
| [`report-language-checker`](../agents/report-language-checker.md) | Used by erfana:report to check a report's sentence case, style, formatting, and precision against the house rules, with line-level evidence. | Read, Grep, Glob | sonnet | medium |
| [`report-structure-checker`](../agents/report-structure-checker.md) | Used by erfana:report to check a report's structure and executive summary – Pyramid, SCQA, Five C's, linkage, bottom line first – with evidence. | Read, Grep, Glob | opus | medium |
| [`security-auditor`](../agents/security-auditor.md) | Audits code for security vulnerabilities, exposed secrets, and OWASP issues. Use for a security-focused review of code; for general code quality use code-reviewer. | Read, Bash, Grep, Glob | opus | high |
| [`skill-reviewer`](../agents/skill-reviewer.md) | Used by erfana:skill to review a skill against the skill standard and return every finding with its evidence. | Read, Grep, Glob | sonnet | medium |
| [`software-developer`](../agents/software-developer.md) | Implements or changes code in any language – TypeScript, Python, Go, Rust, shell – with tests, following React (hooks, accessible forms, Zod) and Nest.js (modules, Zod DTOs, Prisma repositories) conventions where used. Use for coding tasks; to review the result use code-reviewer. | Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch | opus | medium |
| [`solution-architect`](../agents/solution-architect.md) | Designs system-level solutions – integrations, data models, API contracts – and records decisions as ADRs. Use when a feature or integration needs a design before implementation; for code-level conventions use technical-architect. | Read, Glob, Grep, Edit, Write, WebSearch, WebFetch | opus | session default |
| [`solution-reviewer`](../agents/solution-reviewer.md) | Reviews solution designs, data models, API contracts, and ADRs for coherence before implementation. Use after solution-architect produces a design. | Read, Glob, Grep, WebSearch, WebFetch | opus | medium |
| [`spec-app-researcher`](../agents/spec-app-researcher.md) | Used by erfana:spec to research how similar products solve a feature and return sourced patterns for its requirements. | WebSearch, WebFetch, Read | sonnet | medium |
| [`spec-compliance-checker`](../agents/spec-compliance-checker.md) | Used by erfana:spec and erfana:issue to check code against a spec's requirements and report each gap with file evidence. | Read, Grep, Glob | opus | medium |
| [`spec-validator`](../agents/spec-validator.md) | Used by erfana:spec to review a spec against the review checks and return every finding with its evidence. | Read, Grep, Glob | sonnet | medium |
| [`technical-architect`](../agents/technical-architect.md) | Sets code-level architecture and engineering standards – conventions, code structure, code-level ADRs. Use when a coding pattern or convention needs deciding; for system-level design use solution-architect, for audits architecture-reviewer. | Read, Glob, Grep, Edit, Write, WebSearch, WebFetch, Bash | opus | session default |
| [`test-reviewer`](../agents/test-reviewer.md) | Reviews unit and integration tests for weak checks, heavy mocking, flakiness, and missing cases, and reports whether they would catch a real bug. Use after test-writer or when tests pass but bugs escape; for e2e tests use e2e-test-reviewer. | Read, Grep, Glob | sonnet | medium |
| [`test-writer`](../agents/test-writer.md) | Writes unit and integration tests for components, functions, or modules. Use when adding test coverage; for end-to-end tests use e2e-test-writer. | Read, Write, Edit, Bash, Glob, Grep | opus | medium |
| [`ui-designer`](../agents/ui-designer.md) | Designs visual craft – color palettes, typography, spacing, component states, motion, and visual identity. Use for how an interface looks; for flows, interaction, and accessibility use ux-designer. | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch | opus | session default |
| [`ui-reviewer`](../agents/ui-reviewer.md) | Reviews implemented visual design – color, typography, spacing, design tokens, animation, and visual fidelity. Use for visual quality audits; for usability and accessibility use ux-reviewer. | Read, Glob, Grep, Bash, WebSearch, WebFetch | opus | session default |
| [`ux-designer`](../agents/ux-designer.md) | Designs user flows, interaction patterns, information architecture, and accessibility requirements for web, desktop, and mobile. Use for how users navigate and interact; for visual design use ui-designer. | Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch | opus | medium |
| [`ux-reviewer`](../agents/ux-reviewer.md) | Reviews UI code against usability heuristics, accessibility standards, and platform guidelines. Use for UX and accessibility audits; for visual design quality use ui-reviewer. | Read, Glob, Grep, Bash, WebSearch, WebFetch | opus | medium |

## Slash commands (7)

| Command | Arguments | Started by | What it does |
|---|---|---|---|
| [`/erfana:cleanup`](../commands/cleanup.md) | none | you start it | Cleans up after a block of work – finds leftover files, worktrees, branches, closable GitHub issues, and needed follow-ups, then acts on each group only after the user approves it. Use when a large piece of development work is finished. |
| [`/erfana:doc-update`](../commands/doc-update.md) | `[path-or-glob] [--dry-run] [--offline] [--quick] [--commit] [--push] [--allow-delete]` | you or Claude | Refresh project documentation after recent work – reviews the session and recent commits, syncs docs/, README, CHANGELOG, AGENTS.md, CLAUDE.md, API specs and decision records with the code, adds docs that help future agent sessions, and passes specialist review. Use after finishing a task or as housekeeping. |
| [`/erfana:explain-issue`](../commands/explain-issue.md) | `\<issue-number \| #N \| issue-url>` | you or Claude | Translates a GitHub issue into a plain-language brief for a Product Owner / Project Manager / Business Analyst. |
| [`/erfana:lens-review`](../commands/lens-review.md) | `\<path \| "path path ..." \| #PR \| "description"> [--lens a,b,c] [--out file.md]` | you or Claude | Researched multi-lens code review – fans out lens reviewers over a target, each grounded in recent cited best practices, and synthesizes one plain-language, severity-ranked report (PM/PO-friendly, with full technical detail kept for engineers). |
| [`/erfana:project-status`](../commands/project-status.md) | none | you start it | One-shot Pyramid-Principle project-status brief for a Product Owner, PM or BA audience – three axes (what we worked on, what we accomplished, where we landed) plus a recommended next step, grounded in git and GitHub state. Read-only, no side effects. |
| [`/erfana:session-status`](../commands/session-status.md) | none | you start it | Produces a short Pyramid-Principle brief of the current session for a Product Owner, PM or BA audience – what was worked on, what was accomplished, where it landed, and a recommended next step – sourced from the conversation with a light read-only git probe. Use after a compaction or when returning to a long-running tab. |
| [`/erfana:session-watch`](../commands/session-watch.md) | none | you start it | Starts a 30-minute timer for this session that keeps the task list visible and current – it shows the session status and live progress and removes completed tasks. Use before leaving a long-running session so the list is right on return. |

## Safety hooks (6)

Hooks run on their own at fixed points; you never start them. Each one runs
through `hooks/dispatch.sh`, which picks the `.sh` file on macOS and Linux and
the `.ps1` file on Windows.

| Hook | Runs at | Tools it watches | What it does |
|---|---|---|---|
| [`bash-safety`](../hooks/bash-safety.sh) | PreToolUse | `Bash`, `run_shell_command` | Blocks shell commands that could destroy data or change your system, such as rm -rf on your home folder, a download piped into a shell, or sudo. |
| [`grill-guard`](../hooks/grill-guard.sh) | Stop | all | Keeps an erfana:grill-me interview from ending while a question is still open. |
| [`ms-grill-guard`](../hooks/ms-grill-guard.sh) | Stop | all | Keeps an erfana:skill requirements interview from ending while a question is still open. |
| [`post-compact-reminder`](../hooks/post-compact-reminder.sh) | PostCompact | all | After Claude Code compacts the conversation, prints the working rules, the current git state, and a pointer to an active autopilot run; Claude does not see this output, so run the autopilot resume command yourself. |
| [`secret-detector`](../hooks/secret-detector.sh) | PreToolUse | `Write`, `Edit`, `MultiEdit`, `write_file` | Blocks a file write that would put a credential, such as an API key or private key, into your code. |
| [`verify-completion`](../hooks/verify-completion.sh) | Stop | all | When Claude says work is done without showing proof, asks it once to show the check that proves it. |
