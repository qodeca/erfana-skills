# Error handling

Error responses by phase for the fact-checking skill.

| Error | Phase | Response |
|-------|-------|----------|
| Target file not found | 1 | Report error, STOP |
| No sources discovered | 1 | Ask user for manual paths |
| Zero claims extracted | 2 | Report to user, STOP |
| Verification agent fails | 3 | Retry (max 3), escalate |
| Fix application fails | 5 | Report failures, apply remaining fixes |
| All discovered sources rejected | 1 | Proceed to manual path entry (Step 1.4) |
| No sources after full discovery | 1 | Ask user for manual paths, STOP if none provided |
| Default source folder empty | 1 | Skip fast path, fall through to full discovery |
| User removes all sources during final approval | 1.5 | STOP workflow; user must restart with different paths |
| User provides invalid manual paths | 1.4 | Re-ask (max 3 retries), then STOP |
| Agent returns malformed JSON | Any | Retry (max 3), then escalate with raw output |
| Edit fails for accepted fix | 4/5 | Record in `failed_changes`, continue with remaining |
| Verify worker returns `completion_status: partial` | 3 | Reconcile by claim id; re-dispatch only the missing chunk (max 3), then escalate with unresolved `missing_claim_ids` |
| Verify worker returns `status: error` (e.g. empty source index) | 3 | Do not accept Ungrounded batch; retry (max 3), then escalate |
| Source/target path fails the lexical screen | 1 | Reject the path, report it, re-ask (max 3 retries) |
| `--section` value is non-numeric | 1 | Reject, re-ask for a valid integer |
| `corrected`/`citation` fails output screening | 4/5 | Route that fix to `failed_changes` (reason `unsafe_content`), continue with remaining |
| Extracted claim count exceeds the resource ceiling | 2 | STOP and ask the user to proceed / narrow with `--section` / trim sources |
