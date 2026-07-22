# Gate 16 – hook fixtures + sentinel symmetry (v4.2.9+; explain family added v4.2.14+; grill family added v6.2.0+)

Validates the `verify-completion` Stop hook and the skill-scoped `grill-guard` Stop hook against a corpus of replay fixtures, and asserts that all three sentinel literals stay in sync across the files that emit them and the hook implementations that match them. v4.2.14+ extends the symmetry check from one family (status) to two (status plus explain). v4.2.20+ routes the fixtures through `dispatch.sh` so the gate exercises the OS-native implementation (`.sh` on macOS/Linux, `.ps1` on Windows) and adds `verify-completion.ps1` to the sentinel-symmetry lists. v6.2.0+ adds the `grill-guard` hook (declared in `skills/grill-me/SKILL.md` frontmatter, scripts under `skills/grill-me/hooks/`) with its own fixture family and the grill sentinel family.

## What it checks

1. **Fixture replays.** For each `tests/hooks/verify-completion/*.json` file, pipe the payload through `bash hooks/dispatch.sh verify-completion` (v4.2.20+) – the OS-native implementation – and assert whether stdout carries the `{"decision":"block"...}` payload (the Stop-hook block signal). Routing through the launcher means the gate validates the PowerShell port against the exact same behavioural corpus as the bash version. Exit code is always 0 per the Stop-hook protocol – the block decision is communicated via stdout JSON, not exit status – so the gate asserts on stdout shape.

   The verify-completion fixture catalogue covers ten scenarios:

   | Fixture | Expectation | What it proves |
   | --- | --- | --- |
   | `status-with-sentinel.json` | pass | status report carrying the sentinel bypasses the success-claim check |
   | `status-without-sentinel.json` | pass | status body that follows the prose rule has no triggers and passes |
   | `explain-with-sentinel.json` | pass | explain-issue brief carrying `<!-- erfana:explain-template -->` bypasses the success-claim check even when the body contains "ready for merge" + "the implementation is complete" (v4.2.14+) |
   | `paraphrased-template-bypass.json` | block | three bullet labels mid-prose + ready-to-ship without the sentinel must block (Reviewer 2's bypass scenario) |
   | `unverified-success.json` | block | implementation-complete + ready-to-ship without verification must block |
   | `verified-success.json` | pass | implementation-complete + ALL GATES PASSED is verified and passes |
   | `bare-no-issues.json` | block | bare `no issues.` is a success claim and must block |
   | `inventory-no-issues.json` | block | inventory `no issues currently assigned` must still block (the v4.2.9 working-tree exemption was removed) |
   | `unclosed-fence.json` | block | odd-count code fence cannot hide a success claim (fallback path) |
   | `stop-hook-active.json` | pass | `stop_hook_active: true` skips the check unconditionally |

2. **Grill-guard fixture replays** (v6.2.0+). Same protocol for each `tests/hooks/grill-guard/*.json` file, piped through `bash hooks/dispatch.sh ../skills/grill-me/hooks/grill-guard` (the launcher resolves hook names by path concatenation, so a relative name reaches the skill-local sibling pair). The catalogue covers five scenarios:

   | Fixture | Expectation | What it proves |
   | --- | --- | --- |
   | `open-blocks.json` | block | end-anchored open marker on a mid-interview message blocks the stop |
   | `no-marker-passes.json` | pass | wrap-up message without the marker passes – omission is the close signal |
   | `open-quoted-mid-prose.json` | pass | marker quoted mid-prose is not end-anchored and never misfires |
   | `open-inside-trailing-code-fence.json` | pass | marker inside a balanced trailing fence is stripped before matching |
   | `stop-hook-active.json` | pass | `stop_hook_active: true` skips the check unconditionally |

3. **Sentinel symmetry – three families** (v4.2.14+ two, v6.2.0+ three):
   - **Status family.** `<!-- erfana:status-template -->` must appear in `commands/project-status.md`, `commands/session-status.md`, `hooks/verify-completion.sh`, and `hooks/verify-completion.ps1` (v4.2.20+). If any one is missing, the status allowlist would silently break and every clean-tree status report would block.
   - **Explain family.** `<!-- erfana:explain-template -->` must appear in `commands/explain-issue.md`, `hooks/verify-completion.sh`, and `hooks/verify-completion.ps1` (v4.2.20+). Both implementations check the sentinel (bash `grep -qF`, PowerShell `.Contains`) – if either emitter or either implementation drifts, the corresponding family's reports block silently. Future `explain-*` siblings (e.g. `explain-pr`) reuse this sentinel and will be added to the explain family's symmetry list.
   - **Grill family** (v6.2.0+). `<!-- erfana:grill-open -->` must appear in `skills/grill-me/SKILL.md` (the emitter), `skills/grill-me/hooks/grill-guard.sh`, and `skills/grill-me/hooks/grill-guard.ps1` (the matchers). If the emitter drifts, the backstop never fires; if a matcher drifts, one platform silently loses the block.

   All checks use `grep -qF` (no regex escaping required).

   **Coverage note.** The fixture replay exercises only the OS-native implementation (`.sh` on macOS/Linux CI). The `.ps1` siblings are literal-checked here and PowerShell-parsed by Gate 14; behavioural `.ps1` replay requires a local `pwsh` run (documented in the release checklist) or a Windows runner.

## Implementation

The gate is a standalone script:

```bash
bash scripts/gate-16-hook-fixtures.sh
```

It is invoked from `scripts/run-all-gates.sh` directly after Gate 14 (`hooks valid`) so all hook-related gates run consecutively.

## Pass criteria

`PASS: <N> fixture(s) + <M> sentinel symmetry check(s)` where `<N>` is the sum of the script's `CASES` (10) and `GRILL_CASES` (5) arrays, currently 15, and `<M>` is the sum of status-family files (4), explain-family files (3), and grill-family files (3), currently 10. (Note: before v6.2.0 this section undercounted `<M>` as 5 – the v4.2.20 `.ps1` additions were never reflected here; the script itself always counted correctly.) Any per-fixture or per-symmetry failure tags the run as a failure and increments the failure counter; the script then exits non-zero with a summary line.

## Adding a new fixture

1. Drop a JSON file under `tests/hooks/verify-completion/<name>.json` (or `tests/hooks/grill-guard/<name>.json` for the grill hook) containing the Stop-hook payload (`stop_hook_active` and `last_assistant_message`).
2. Add a corresponding row to the `CASES` (or `GRILL_CASES`) array in `scripts/gate-16-hook-fixtures.sh`:

   ```bash
   "<name>|<block|pass>|<short description>"
   ```

   The pipe-separated columns are: fixture basename (no extension), expected outcome (`block` if stdout must carry the block JSON; `pass` if stdout must be empty), and a description used in the gate output line.
3. Run `bash scripts/gate-16-hook-fixtures.sh` to confirm the fixture asserts what you intended.

## Renaming a sentinel

If either sentinel literal ever changes:

**Status family** (`<!-- erfana:status-template -->`):

1. Update the `STATUS_SENTINEL=` constant at the top of `scripts/gate-16-hook-fixtures.sh`.
2. Update the line in `commands/project-status.md` output template.
3. Update the matching line in `commands/session-status.md`.
4. Update the corresponding `grep -qF` call in `hooks/verify-completion.sh`.
5. Re-run `bash scripts/run-all-gates.sh`. Gate 16 catches any of the four sites being missed.

**Explain family** (`<!-- erfana:explain-template -->`, v4.2.14+):

1. Update the `EXPLAIN_SENTINEL=` constant at the top of `scripts/gate-16-hook-fixtures.sh`.
2. Update the line in `commands/explain-issue.md` output template (and any future `explain-*` sibling).
3. Update the corresponding `grep -qF` call in `hooks/verify-completion.sh`.
4. Update `tests/hooks/verify-completion/explain-with-sentinel.json` so the fixture body still contains the (new) literal.
5. Re-run `bash scripts/run-all-gates.sh`. Gate 16 catches any of the sites being missed.

**Grill family** (`<!-- erfana:grill-open -->`, v6.2.0+):

1. Update the `GRILL_SENTINEL=` constant at the top of `scripts/gate-16-hook-fixtures.sh`.
2. Update the marker literal in `skills/grill-me/SKILL.md` (Sentinel section).
3. Update the match in `skills/grill-me/hooks/grill-guard.sh` (`grep -qF`) and `grill-guard.ps1` (`.Contains`).
4. Update the four `tests/hooks/grill-guard/*.json` fixtures that embed the literal.
5. Re-run `bash scripts/run-all-gates.sh`. Gate 16 catches any of the sites being missed.
