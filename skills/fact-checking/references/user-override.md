# User override

Any quality gate or blocking condition can be overridden by the user with explicit justification.

## When the user chooses to override

1. Orchestrator presents the override consequences via `AskUserQuestion`:
   - What protection is being skipped
   - What risk the override carries
   - Recommended option: keep the gate (default)
2. If user confirms override, record the decision and justification in the todo list as a comment on the affected step
3. Proceed with the overridden step

## Examples

| Gate | Override scenario | Risk |
|------|-------------------|------|
| "Zero sources discovered, must provide manual paths" | User insists no sources exist | Skill cannot verify – will mark all claims as Ungrounded |
| "All discovered sources rejected" | User declines all but wants to proceed | Same – no verification possible |
| "Verification agent failed 3 times" | User wants partial results | Some claims unverified; final report incomplete |
| "Fix application failed for a finding" (e.g. `original` text not uniquely locatable) | User wants to apply remaining fixes anyway | Target file partially corrected; that finding recorded in `failed_changes`, still wrong |

## What override does NOT do

Override does not change protection rules in the skill itself. The override applies to a single workflow run. Subsequent runs re-apply all gates.
