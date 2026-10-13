# How a /goal is judged

Background for `draft-goal`. Read when a user asks why a goal never finishes, or when a draft needs a reason behind one of its rules. Facts below were checked against the Claude Code documentation on 2026-10-13; the page is at https://code.claude.com/docs/en/goal.

## Claude Code

- `/goal <condition>` sets one goal per session; a new one replaces the old. Setting it starts a turn at once, with the condition as the directive.
- After every turn, the condition and the conversation so far go to the configured small, fast model. It returns **not yet met** (Claude keeps going, using the reason as guidance), **met** (the goal clears and an achieved entry is recorded), or **impossible** (the goal clears as failed, with the reason).
- The evaluator does not call tools. It judges only what Claude has already surfaced in the conversation. This is why every check in a draft names the proof to show.
- Under the hood `/goal` is a session-scoped, prompt-based Stop hook.
- The condition can be up to 4,000 characters.
- A turn or time clause, such as "or stop after 20 turns", is reported by Claude each turn and judged by the evaluator from the conversation. It is not a timer.
- `/goal` with no argument shows status: the condition, run time, turns evaluated, token spend, and the latest reason. `/goal clear` (aliases `stop`, `off`, `reset`, `none`, `cancel`) removes it; `/clear` also removes it.
- If Claude answers the evaluator several turns in a row without using a tool, Claude Code stops the loop with a warning and returns control, goal still set. The underlying Stop-hook block cap is eight consecutive blocks with no tool call in between (https://code.claude.com/docs/en/hooks-guide, section "Stop hook hits the block cap").
- A goal does not change the permission mode. Unattended goal turns need auto mode; in manual mode Claude still asks before tool calls not already allowed.
- Background subagents or shells defer evaluation until a turn ends with nothing running; check-ins start after 30 minutes by default.
- Errors the user must fix (authentication, credit balance, unrecoverable context overflow, unavailable model) clear the goal; other errors retry or pause it.
- `/goal` follows the same workspace-trust rule as hooks and is unavailable when all hooks are disabled or only managed hooks are allowed.

## Why owner decisions need a clause

The evaluator reads the user's messages along with Claude's. A broad condition such as "make the setup fully aligned with current best practices" keeps every recommendation in scope, including ones the owner has deliberately turned down. The evaluator then sees an unmet item on every turn and keeps the loop running until the user clears it. The owner-decisions clause in the draft tells the evaluator that a decline recorded in the conversation closes that item, and tells Claude not to apply it or ask again.

## Qwen Code, for comparison

Qwen Code's goals differ in ways that matter if the plugin runs there (https://github.com/QwenLM/qwen-code/blob/main/docs/users/features/goals.md):

- Commands: `/goal <objective>`, `/goal set`, `/goal edit`, `/goal pause`, `/goal resume`, `/goal clear`.
- The verifier judges only when the model proposes completion or a block, and reads the recent transcript tail. User messages count as evidence of what the user said or chose.
- Turn and active-time ceilings are runtime settings (`model.goalMaxTurns`, `model.goalMaxActiveMinutes`); a budget written into the objective is advice to the model only.
- Newlines in the objective collapse to spaces.
