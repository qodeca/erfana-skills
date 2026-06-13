Generate a stakeholder-facing summary of the current Claude Code session in executive-brief format following the Pyramid Principle. The reader is a Product Owner / Project Manager / Business Analyst, not a developer. Translate technical artifacts (commits, branches, file diffs, hashes) into outcome language (milestones, capabilities, deliverables, queue items). Source content primarily from this conversation's context with a light read-only git probe for grounding.

# Audience and register

The reader drives the work but is less technical than Claude. They care about:

- What was accomplished – capabilities, deliverables, milestones.
- Where the work stands – stable / in-flight / blocked, with grounding facts.
- What is queued or recommended next – framed as a goal, not as a git mechanic.

They do NOT care about:

- Commit hashes (8-char or 40-char).
- Branch names appearing front-and-centre.
- File paths or function names in raw form.
- Dirty-file counts as bare numbers without context.

Identifiers that DO belong in the output: issue numbers (#17), pull request numbers (#21), phase labels (Phase 4.A, Stage-C-3), version strings (v3.2), document names (ROADMAP, CLAUDE.md), absolute dates from git log. Always pair each identifier with a plain-language description on its first appearance.

# Protocol

1. **Preflight.** No tool calls required. If the conversation has no user turns yet (i.e. the very first thing the user did was invoke this command), emit exactly one line and stop:
   > `/erfana:session-status` requires conversation history. Send at least one message first.

2. **Gather state.**

   **From conversation context (primary, no tool calls):**
   - The topic / goal the session has been working on.
   - The last 3-5 user prompts, paraphrased into intent (not verbatim).
   - The last 3-5 concrete assistant actions or decisions (files written, commits made, PRs opened, agents dispatched, design decisions locked).
   - Any unresolved question, pending choice, or open TODO that has not been answered or executed yet.

   **From git (light grounding, single tool-use block):**
   - `git rev-parse --is-inside-work-tree 2>/dev/null` – if not in a repo, skip the rest silently.
   - `git branch --show-current`
   - `git log --oneline -3 --format='%h %cs %s'`
   - `git status --short | wc -l`

3. **Apply hallucination guards (mandatory before drafting).**

   The following are HARD RULES. An incorrect status is worse than no status; any rule violated means the report must be rewritten before emit.

   - **Source attribution.** Every factual claim must trace to either (a) explicit user or assistant content from this conversation OR (b) the git probe output. If a fact has no source, OMIT IT. Never infer from training data, file names, common knowledge, or "what usually happens".
   - **No acronym expansion without evidence.** If a commit message, issue title, or conversation message uses an acronym (RBAC, FIC, MI, RU, PE, DNS, SDK, CRUD, etc.), keep the acronym verbatim unless the conversation or git output itself includes the expansion. "The MI work" beats "the managed identity work" when the expansion is a guess.
   - **No evaluative adverbs unsupported by evidence.** Banned without explicit confirmation in conversation: "successfully", "smoothly", "cleanly", "on schedule", "as planned", "without issue", "wrapped up nicely", "shipped successfully", "in good shape", "healthy". Default to neutral verbs: "merged", "completed", "saved", "closed", "shipped".
   - **Quantifiers must come from a tool call or explicit statement.** Numbers like "twelve checks", "fourteen files", "five niches" need a source – the git probe, an earlier tool output in this conversation, or a direct statement by user or assistant. If unsure, drop the number, not the bullet.
   - **Status labels need criteria:**
     - **stable** / **settled** = clean tree AND no in-flight task or pending question in the recent conversation.
     - **in-flight** = dirty tree OR explicit unfinished work mentioned by user or assistant in this session.
     - **blocked** = explicit blocker / unresolved question in conversation, or known failing verification.
     - If none apply cleanly, omit the label and describe what is actually known.
   - **Date discipline.** Relative dates ("today", "yesterday") must be computed against the actual current date from environment context. Absolute dates can be cited only when present in git log committer-date or conversation.
   - **Issue / PR translations must be grounded.** Translate an issue or PR into a plain-language description only if its title or body content appears in the conversation. If you only have a number, cite it as "issue #N" without invention.
   - **Banned narrative phrases.** "The team", "we successfully", "as planned", "on track", "moving forward", "wrapped up nicely", "shipped successfully", "smoothly", "without issues", "good shape", "healthy state". These hide unsupported claims behind warm-sounding prose.
   - **Inventory negation phrasing.** The bare token sequences "no issues" / "no errors" / "no problems" (with no word between "no" and the noun) are forbidden EVEN in inventory context. These token sequences collide with common Stop-hook success-claim heuristics and should be avoided regardless of inventory context – treat them as forbidden tokens in the rendered report, not just as bad style. When reporting that an inventory is empty:
     - **Reverse the word order**: "no assigned issues" beats "no issues assigned"; "no tracked errors" beats "no errors tracked".
     - **Interpolate a qualifier**: "no open issues" beats "no issues open"; "no remaining problems" beats "no problems remaining".
     - **Use "zero"**: "zero issues currently assigned", "zero open errors".
     - **Describe the state**: "issue queue is empty", "error list empty", "stash empty".
     - "no open PRs", "no stashed work", "no commits ahead" are fine because the matched noun is not `issues | errors | problems`.
   - **Confidence calibration.** If the gathered state cannot support a confident headline, the headline is exactly: "Session state unclear – limited context available." Bullets then describe only what is actually known. Never fabricate a narrative to fill the template.

4. **Synthesize using the Pyramid Principle.**

   **Governing thought** – one sentence, ≤30 words. The single load-bearing statement about what the session accomplished or where it stands. Lead with the OUTCOME or MILESTONE, not the git state. Append the next milestone or open question if one is clear.

   **Support** – exactly three bullets, in this order. Each bullet MUST land in 30-50 words; soft "~" qualifier removed in v4.2.10+.
   - **What we worked on** – the workstream's purpose in plain language. Why this session existed, in stakeholder terms. Phase labels, issue numbers, doc names belong here; pair each with a plain-language description.
   - **What we accomplished** – capabilities, deliverables, or decisions now in place. Cite identifiers (PR numbers, version bumps, agent dispatches) paired with what they enabled. Avoid commit hashes and raw file paths.
   - **Where we landed** – a single status label (stable / in-flight / blocked, only if its criteria above are met) plus the grounding facts: how many changes are unpublished, whether anything is queued for review, what verification passed.

   **Recommended next** – two mandatory layers (v4.2.10+; the prior "skip Layer 2 when caught up" carve-out is removed because the caught-up label too often hid a real follow-up):
   - Layer 1 (milestone sentence): "The next milestone is X" or "The outstanding question is Y" or "Session caught up – verify Z" / "Session caught up – pivot to BACKLOG.md head". One sentence, stakeholder language. Apply this priority order; the first applicable rung wins:
     1. Unanswered user question or pending choice from this session → cite the exact question.
     2. Latest user request implemented but not yet verified → recommend running that verification.
     3. Explicit TODO surfaced earlier in the session that has not been executed → recommend executing it.
     4. Open PR from this session awaiting merge or review → recommend the merge or review step in stakeholder terms.
     5. Last task shipped cleanly but a post-release / smoke / propagation / spec-compliance / MAINTAINER-checklist item remains → recommend that step.
     6. None of the above apply → "Session caught up – pivot to a new goal" naming a concrete pivot target if any exists in conversation context (BACKLOG.md, ROADMAP.md, an issue mentioned earlier), otherwise simply "Session caught up – save context and close the tab".
   - Layer 2 (italicised first-step hint): On a new line, italicised, prefixed with "Suggested first step:" – one concrete next-turn action for Claude. This line may use technical-enough language for Claude to act ("open a feature branch off main and scope issue #N", "run scripts/run-all-gates.sh", "open PR #21 in the browser", "run `/plugin marketplace update <name> && /plugin update <name>@<marketplace>` on a second machine"). **Always emit Layer 2.** On rung 6 with no pivot target, the concrete action is "save context and close the tab; resume from the new goal next session" – which is still a concrete instruction, not a skip.

5. **Length discipline (hard rule, v4.2.10+).**
   - Target ~175-220 words total. Hard cap 280. If approaching 280, consolidate within bullets rather than omit an axis.
   - Each of the three support bullets MUST land in 30-50 words. **Hard ceiling: 55 words per bullet.** If one bullet exceeds 55, redistribute facts to "What we worked on" (which usually has slack) or merge two facts into one clause before emit. Truncation is not a substitute for redistribution.
   - **Balanced density** – the three support bullets should fall within ±15 words of each other. A 30 / 80 / 30 distribution is a protocol violation even if the total stays under 280; rewrite for balance.
   - Self-check before emit: read each bullet, mentally count to 50; if a bullet feels long, count actual words. The v4.2.10 rewrite was prompted by an emitted session-status with bullets at 50 / 80 / 30 – the discipline must be active, not aspirational.

6. **Coverage gap handling.**
   - **Silent omission** when not in a git repo – the session may be pure conversation or design work with no repo behind it. Do NOT mention.
   - **No explicit footers.** Session-status is in-context only; tool failures degrade silently.
   - **Do NOT read the raw `.jsonl` transcript file.** Source from live conversation context. Transcripts are out-of-process; reading them is a privacy and latency anti-pattern.

# Output template

Emit exactly the shape below, nothing else. The template uses indented (4-space) markdown so the rendered output is a clean heading + bullets. The trailing `<!-- erfana:status-template -->` line is a mandatory invisible sentinel – it does not render in markdown but downstream Stop-hook guardrails use it to recognise this as a status report and not a generic completion claim. Emit it verbatim, including the leading 4-space indent for grid consistency with the rest of the template:

    ## Session status

    **<governing thought sentence>**

    - **What we worked on:** <workstream purpose in plain language>
    - **What we accomplished:** <capabilities and deliverables now in place>
    - **Where we landed:** <status label + grounded facts>

    **Recommended next:** <milestone sentence>
    *Suggested first step: <one concrete next-turn action for Claude>*

    <!-- erfana:status-template -->

Omit the *Suggested first step:* line only when no next action is meaningful. The sentinel line stays present in all cases.

# Rules

- This command is **read-only**. Do NOT modify any files. Do NOT commit, push, or trigger any side effects.
- Do NOT run `scripts/run-all-gates.sh`, `npm test`, `pytest`, `cargo test`, or any verification / build command – they are slow and may have side effects.
- Do NOT read the session transcript file at `~/.claude/projects/<...>/<session-id>.jsonl` – source from live conversation context only.
- Use sentence case, not Title Case.
- Use en dashes (–) not em dashes (—).
- No emojis.
- No filler phrases. Specifically banned: "comprehensive overview", "detailed analysis", "thoroughly examined", "in summary", "to summarize", "it's worth noting", "it's important to understand", "great question", "here's a...".
- After emitting the summary, do NOT add follow-up commentary, "let me know if...", or task suggestions. The recommendation IS the closer.
