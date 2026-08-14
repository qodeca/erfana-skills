# Gate 18 — skill registry sync (v6.6.1+)

**Type**: hard (with one soft sub-check). **Runner order**: after Gate 17, before the soft Gate 13.

## What it enforces

[`docs/skill-registry.md`](../skill-registry.md) is a **generated** file – every shipped skill with the date and subject of the last commit that touched `skills/<name>/`. This gate keeps it honest.

| # | Check | Type |
|---|---|---|
| 0 | The repository is not a shallow clone | hard |
| 1 | The registry exists, its table parses, and no skill is listed twice | hard |
| 2 | Its skill list equals `ls skills/` minus `design-shared` | hard |
| 3 | No row claims something git cannot account for: a date ahead of history, or – on a row whose date git confirms – a commit subject that is not that commit's subject | hard |
| 4 | Rows behind git are reported with the fix command | **soft** (warn) |

Check 3 is precise about *when* the subject is verifiable: if the date matches, git pins the exact commit, so a wrong subject is a hand edit rather than lag. If the date is behind, the row is stale and the subject is expected to be stale with it – that is check 4's business, and it warns.

## Why it is not a whole-file diff

The obvious implementation – regenerate and fail on any difference – is wrong here, and the reason is worth recording so nobody "fixes" it back.

Dates go stale **by construction**: the commit that changes a skill is the same commit that invalidates that skill's row, so a registry regenerated before committing is already wrong the instant the commit lands. The workaround is a follow-up commit touching only the registry – and this repo squash-merges feature PRs, which collapses that follow-up back into the skill-touching commit **when both live in the same PR**, reproducing the problem on `develop`. A strict gate would therefore red-light the integration branch after every skill change while catching nothing a reader would actually be misled by.

There is a sharper edge on **same-day releases**: squash-merging a skill PR rewrites that skill's latest-commit subject to the squash subject (e.g. `chore(release): vX.Y.Z (#NN)`), while the row still carries the pre-squash subject *and the same date*. Because the date matches, check 3 verifies the subject and **hard-fails** – it reads a legitimate squash rewrite as a hand edit. This bit the v6.7.1 release twice. The resolution is not to weaken the gate but to regenerate the registry in a **dedicated registry-only PR that lands after the skill PRs** – it touches nothing under `skills/`, so its own squash cannot collapse into or rewrite any skill's latest commit, and the row it records stays valid. The release process in [`CLAUDE.md`](../../CLAUDE.md) records this as the squash caveat.

So the checks are split by **what misleads**. A registry that lists a skill which no longer exists, omits one that does, lists one twice, or carries a value git contradicts is actively wrong and blocks. A registry whose dates are a commit or two behind is merely lagging, says so loudly, and is force-refreshed at release (see the release process in [`CLAUDE.md`](../../CLAUDE.md)).

A new skill exercises the lag path deliberately: regenerating before the skill is committed writes `uncommitted` in its date cell, and once the commit lands that row is behind git. Check 4 warns; it does not block. Getting this backwards is easy – a naive string comparison ranks `uncommitted` *above* any ISO date and hard-fails the documented add-a-skill workflow with an accusation of hand-editing.

## Implementation

```bash
bash scripts/gate-18-skill-registry.sh
```

Fix a warning or failure by regenerating:

```bash
bash scripts/gen-skill-registry.sh
```

Never hand-edit the table – the next regeneration discards manual edits, and check 3 treats a fabricated date or subject as a hard failure.

## Shallow clones are refused, not tolerated

`git log -1 -- <path>` in a shallow clone reports the **tip commit for every path**: the shallow boundary looks like a root commit that introduced the entire tree. The failure is silent and convincing – regenerating in a `--depth 1` checkout stamps every skill with the same date and subject, and a gate that resolved dates the same way would agree with the garbage it just produced.

So both scripts call `git rev-parse --is-shallow-repository` and refuse to run, pointing at `git fetch --unshallow`. `.github/workflows/verify.yml` checks out with `fetch-depth: 0`, so CI never hits this; the guard exists for local clones and for any future workflow edit that drops the setting.

## Rendering rule is mirrored, not shared

The generator truncates a commit subject to 72 characters (`[:69] + "..."`) and *then* escapes `|` as `\|`; the gate applies the identical transform before comparing. The order matters – escaping first lets backslashes consume the character budget and lets the cut land between a backslash and its pipe. Both scripts implement this in Python rather than bash on purpose: `${#s}` and `${s:0:69}` are byte-based under `LC_ALL=C`, which can slice a multi-byte character in half and write invalid UTF-8 into a Markdown file that Gate 1 is supposed to guarantee.

**If you change the rule in one script, change it in the other**, or the gate will reject rows the generator legitimately emits.

## Limitations

- The gate proves the registry matches git, not that a skill's *content* is current. A skill can be stale in substance while its row is accurate.
- Dates reflect commits touching `skills/<name>/`, so a change made elsewhere that affects a skill (a shared agent under `agents/`, a hook, a brand bundle) does not move that skill's date. `managing-articles` is the standing example: its five `article-*` agents live at plugin root, so work on them never dates its row.
- A row that is behind git can carry any subject at all – the subject is only verified when the date matches. Hand-editing a date *backwards* is therefore indistinguishable from ordinary lag, and warns rather than blocks.
- Squash-merge and fresh-repo publishes flatten history: a cluster of skills sharing one old date means "not touched since that flattening event", not "created then". The registry says so in prose.
- The gate parses the first Markdown table in the file. Prose lines beginning with `|` added after the table would be read as rows.
- The registry's prose skill count is covered by Gate 15 (`docs/skill-registry.md` is in its `docs_to_scan`), not by this gate, which reads table rows only.
