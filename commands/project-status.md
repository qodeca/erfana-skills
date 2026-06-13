Generate a stakeholder-facing project status summary in executive-brief format following the Pyramid Principle. The reader is a Product Owner / Project Manager / Business Analyst, not a developer. Translate technical artifacts (commits, branches, file diffs, hashes) into outcome language (milestones, capabilities, deliverables, queue items).

# Audience and register

The reader drives the work but is less technical than Claude. They care about:

- Where the project stands – stable / in-flight / blocked, with grounding facts.
- What was recently accomplished – capabilities, deliverables, milestones.
- What is queued or recommended next – framed as a goal, not as a git mechanic.

They do NOT care about:

- Commit hashes (8-char or 40-char).
- Branch names appearing front-and-centre.
- File paths or function names in raw form.
- Dirty-file counts as bare numbers without context.

Identifiers that DO belong in the output: issue numbers (#17), pull request numbers (#21), phase labels (Phase 4.A, Stage-C-3), version strings (v3.2), document names (ROADMAP, CLAUDE.md), absolute dates from git log. Always pair each identifier with a plain-language description on its first appearance.

# Protocol

1. **Preflight.** Verify you are in a git repository (`git rev-parse --is-inside-work-tree`). If not, emit exactly one line and stop:
   > `/erfana:project-status` requires a git repository. Run from a project directory.

2. **Gather state in parallel.** Issue bash calls in a single tool-use block.

   **Always (git):**
   - Repo name: `basename "$(git rev-parse --show-toplevel)"`
   - Current branch: `git branch --show-current`
   - Working-tree dirty file count: `git status --short | wc -l`
   - Ahead/behind upstream: `git rev-list --left-right --count "@{u}...HEAD" 2>/dev/null` (omit if no upstream)
   - Last 5 commits with date: `git log --oneline -5 --format='%h %cs %s'`
   - Stash count: `git stash list | wc -l`

   **Always attempt (GitHub):**
   - Open PRs: `gh pr list --json number,title,statusCheckRollup --limit 5 2>&1`
   - Open issues assigned to you (your active todo): `gh issue list --assignee @me --json number,title,labels --limit 5 2>&1`
   - All open issues (full project picture, includes the assigned-to-you subset): `gh issue list --state open --json number,title,labels,assignees --limit 10 2>&1`
   - Both queries together let "Where we landed" report two numbers ("X assigned to me, Y open in total"). The full-picture query also surfaces unassigned items worth flagging in "Recommended next" when the assigned queue is empty.

   **Translation fetch (only if the report will mention an issue or PR by number with a plain-language description):**
   - For each issue you intend to translate: `gh issue view <N> --json title,body --jq '{title, body: (.body | .[0:500])}' 2>&1`
   - For each PR you intend to translate: `gh pr view <N> --json title,body --jq '{title, body: (.body | .[0:500])}' 2>&1`
   - If the fetch fails or the body is empty, do NOT invent a description – cite the number bare.

   **Conditional (only if the file exists – use Read):**
   - `ROADMAP.md` – extract the first roadmap item or "Next:" line.
   - `BACKLOG.md` – extract the first item.
   - `CLAUDE.md` – extract a `Current version: **vX.Y.Z**` line if present.
   - Note whether `scripts/run-all-gates.sh` (or equivalent gate runner) exists – do NOT run it.

3. **Apply hallucination guards (mandatory before drafting).**

   The following are HARD RULES. An incorrect status is worse than no status; any rule violated means the report must be rewritten before emit.

   - **Source attribution.** Every factual claim must trace to a specific tool output (git, gh, file read) or `CLAUDE.md` content gathered in step 2. If a fact has no source, OMIT IT. Never infer from training data, repo name, branch name, or "what usually happens".
   - **No acronym expansion without evidence.** If a commit message, issue title, or PR title uses an acronym (RBAC, FIC, MI, RU, PE, DNS, SDK, CRUD, etc.), keep the acronym verbatim unless the gathered state itself includes the expansion. "The MI work" beats "the managed identity work" when the expansion is a guess.
   - **No evaluative adverbs unsupported by evidence.** Banned without explicit confirmation: "successfully", "smoothly", "cleanly", "on schedule", "as planned", "without issue", "wrapped up nicely", "shipped successfully", "in good shape", "healthy". Default to neutral verbs: "merged", "completed", "saved", "closed", "shipped".
   - **Quantifiers must come from a tool call.** Numbers like "eleven changes", "ten open issues", "five niches" need a tool output as source. If a count cannot be verified, drop the number, not the bullet.
   - **Status labels need criteria:**
     - **stable** / **settled** = clean tree AND no open PR assigned to you AND no in-flight signal in the recent commit messages.
     - **in-flight** = dirty tree OR open PR assigned to you OR an explicit "wip" / "in progress" signal in recent commit messages.
     - **blocked** = open PR with failing CI OR an explicit blocker signal in CLAUDE.md / ROADMAP / BACKLOG.
     - If none apply cleanly, omit the label and describe what is actually known.
   - **Date discipline.** Use commit dates from `git log --format='%cs'` (committer-date short). Relative dates ("today", "yesterday") must be computed against the actual current date from environment context.
   - **Issue / PR translations must be grounded.** Translate an issue or PR into plain language ONLY if you fetched its title or body in step 2. If the fetch failed or returned empty, cite the number bare ("issue #N") and do not invent.
   - **Banned narrative phrases.** "The team", "we successfully", "as planned", "on track", "moving forward", "wrapped up nicely", "shipped successfully", "smoothly", "without issues", "good shape", "healthy state". These hide unsupported claims behind warm-sounding prose.
   - **Inventory negation phrasing.** The bare token sequences "no issues" / "no errors" / "no problems" (with no word between "no" and the noun) are forbidden EVEN in inventory context. These token sequences collide with common Stop-hook success-claim heuristics and should be avoided regardless of inventory context – treat them as forbidden tokens in the rendered report, not just as bad style. When reporting that an inventory is empty:
     - **Reverse the word order**: "no assigned issues" beats "no issues assigned"; "no tracked errors" beats "no errors tracked".
     - **Interpolate a qualifier**: "no open issues" beats "no issues open"; "no remaining problems" beats "no problems remaining".
     - **Use "zero"**: "zero issues currently assigned", "zero open errors".
     - **Describe the state**: "issue queue is empty", "error list empty", "stash empty".
     - "no open PRs", "no stashed work", "no commits ahead" are fine because the matched noun is not `issues | errors | problems`.
   - **Confidence calibration.** If the gathered state cannot support a confident headline, the headline is exactly: "<repo-name> state unclear – partial signals available." Bullets then describe only what is actually known. Never fabricate a narrative to fill the template.

4. **Synthesize using the Pyramid Principle.**

   **Governing thought** – one sentence, ≤30 words. The single load-bearing statement about where the project stands right now. Lead with the STATUS LABEL + the most important fact, then the next milestone or blocker if one is clear.

   **Support** – exactly three bullets, in this order. Each bullet MUST land in 30-50 words; soft "~" qualifier removed in v4.2.10+. Cover three different axes, one bullet per axis:
   - **What we worked on** – the recent workstream's purpose in plain language. What the latest commits, merged PRs, or closed issues add up to.
   - **What we accomplished** – capabilities, deliverables, or milestones now in place. Cite identifiers (PR numbers, phase labels, version bumps) paired with plain-language outcomes. Avoid commit hashes and raw file paths.
   - **Where we landed** – status label + grounded facts: unpublished change count, open PR list, both issue counts (assigned to you AND total open – the second number frames the broader queue), ROADMAP head if known.

   **Recommended next** – two mandatory layers (v4.2.10+; the prior "skip Layer 2 when no next action exists" carve-out is removed because it too often hid a real follow-up):
   - Layer 1 (milestone sentence): "The next milestone is X" or "The blocker to clear is Y". One sentence, stakeholder language. Apply this priority order; the first applicable rung wins:
     1. Open PR with green CI awaiting merge → recommend merging it.
     2. Manifest version (plugin.json / package.json / pyproject.toml / Cargo.toml) drifts from a "Current version" prose claim → recommend syncing.
     3. Dirty tree on a feature branch → recommend committing or stashing in stakeholder terms.
     4. Open issue assigned to you with no draft commit on a matching branch → recommend scoping it.
     5. Recently shipped release exists (newest tag in `git tag --sort=-creatordate` is from the current session or the last few days) and a MAINTAINER-checklist / smoke / propagation step from project conventions remains → recommend that step.
     6. ROADMAP.md head item → recommend starting on it.
     7. None of the above apply → "No clear next move – pick from BACKLOG.md" or closest equivalent (cite the file name if it exists in repo).
   - Layer 2 (italicised first-step hint): On a new line, italicised, prefixed with "Suggested first step:" – one concrete next-turn action for Claude. This line may use technical-enough language for Claude to act ("open a feature branch off develop and scope issue #N", "run scripts/run-all-gates.sh", "merge PR #21", "run `/plugin marketplace update <name> && /plugin update <name>@<marketplace>` on a second machine"). **Always emit Layer 2.** On rung 7 with no pivot target, the concrete action is "open BACKLOG.md and pick the head item" – which is still a concrete instruction, not a skip.

5. **Length discipline (hard rule, v4.2.10+).**
   - Target ~175-220 words total. Hard cap 280. If approaching 280, consolidate within bullets rather than omit an axis.
   - Each of the three support bullets MUST land in 30-50 words. **Hard ceiling: 55 words per bullet.** If one bullet exceeds 55, redistribute facts to "What we worked on" (which usually has slack) or merge two facts into one clause before emit. Truncation is not a substitute for redistribution.
   - **Balanced density** – the three support bullets should fall within ±15 words of each other. A 30 / 80 / 30 distribution is a protocol violation even if the total stays under 280; rewrite for balance.
   - Self-check before emit: read each bullet, mentally count to 50; if a bullet feels long, count actual words.

6. **Coverage gap handling.**
   - **Silent omission** when a project file is missing – no ROADMAP / BACKLOG / CLAUDE / gate runner is normal on lean projects; do NOT mention.
   - **Explicit one-line footer** ONLY when a tool fails unexpectedly:
     - `gh` not authed → `Coverage: GitHub skipped (gh not authed – run \`gh auth login\`)`
     - No GitHub remote configured even though the repo origin is on github.com → `Coverage: no GitHub remote configured`
     - `gh issue view` / `gh pr view` translation fetch failed for an issue or PR mentioned by number → `Coverage: issue #N description unavailable – cited by number only`

# Output template

Emit exactly the shape below, nothing else. The template uses indented (4-space) markdown so the rendered output is a clean heading + bullets. The trailing `<!-- erfana:status-template -->` line is a mandatory invisible sentinel – it does not render in markdown but downstream Stop-hook guardrails use it to recognise this as a status report and not a generic completion claim. Emit it verbatim, including the leading 4-space indent for grid consistency with the rest of the template:

    ## <repo-name> status

    **<governing thought sentence>**

    - **What we worked on:** <recent workstream purpose>
    - **What we accomplished:** <capabilities and milestones now in place>
    - **Where we landed:** <status label + grounded facts>

    **Recommended next:** <milestone sentence>
    *Suggested first step: <one concrete next-turn action for Claude>*

    <!-- erfana:status-template -->

Omit the *Suggested first step:* line only when no next action is meaningful. If a coverage footer is required, append one blank line then the footer. The sentinel line stays present in all cases.

# Rules

- This command is **read-only**. Do NOT modify any files. Do NOT commit, push, or trigger any side effects.
- Do NOT run `scripts/run-all-gates.sh`, `npm test`, `pytest`, `cargo test`, or any verification / build command – they are slow and may have side effects.
- Use sentence case, not Title Case.
- Use en dashes (–) not em dashes (—).
- No emojis.
- No filler phrases. Specifically banned: "comprehensive overview", "detailed analysis", "thoroughly examined", "in summary", "to summarize", "it's worth noting", "it's important to understand", "great question", "here's a...".
- After emitting the summary, do NOT add follow-up commentary, "let me know if...", or task suggestions. The recommendation IS the closer.
