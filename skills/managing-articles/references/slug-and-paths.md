# Slug and path safety

Single source of truth for safe, bilingual-aware slug generation and filesystem path containment in `managing-articles`. Read this as instructions: apply every rule verbatim.

## Purpose

Every article directory name, every article file name, and every move, rename, publish, or archive in `managing-articles` MUST pass through this module before touching the filesystem. Centralizing slug generation and path validation here closes two defect classes surfaced in review: path traversal (slugs or user input escaping the project root via `..`, absolute paths, or symlinks) and Polish-diacritic corruption (titles silently mangled because an `NFD`/`NFKD` "strip accents" shortcut does not decompose every Polish letter). No caller may build a slug or resolve an article path inline; callers invoke the pipeline and checklists defined below.

## Canonical slug pipeline

Apply the six steps in this exact order. Order is load-bearing: transliteration must run first, before lowercasing and before any character-class filtering, or Polish letters are dropped instead of mapped.

### Step 1 - transliterate (Polish to ASCII)

Apply this explicit map character-by-character before anything else. Do NOT rely on Unicode normalization to do this job.

| Input | Output | Input | Output |
|---|---|---|---|
| ą | a | Ą | A |
| ć | c | Ć | C |
| ę | e | Ę | E |
| ł | l | Ł | L |
| ń | n | Ń | N |
| ó | o | Ó | O |
| ś | s | Ś | S |
| ź | z | Ź | Z |
| ż | z | Ż | Z |

Rationale: `ł` / `Ł` (U+0142 / U+0141) has NO Unicode canonical decomposition. A "normalize to NFD/NFKD, then strip combining marks" approach silently passes `ł` through unchanged (it is a base letter, not base + combining accent), so the later `[a-z0-9-]` filter deletes it entirely - turning "Łódź" into "od" instead of "lodz". The other Polish letters decompose under NFD, but mixing two mechanisms invites partial coverage. Use ONE explicit map for all of them; never normalize-and-strip.

This table is the operative source of truth for Polish-to-ASCII transliteration across the skill. `references/bilingual.md` cites this map for language-aware handling; it does not redefine it.

### Step 2 - lowercase

Lowercase the whole string after transliteration (so `Ł` already became `L`, which now becomes `l`).

### Step 3 - collapse separators

Replace any run of whitespace or punctuation with a single hyphen.

### Step 4 - restrict character class

Strip every character that is not in `[a-z0-9-]`.

### Step 5 - tidy hyphens

Collapse repeated hyphens to one; trim leading and trailing hyphens.

### Step 6 - truncate

Truncate to at most 50 characters at a word (hyphen) boundary - cut at the last hyphen at or before position 50, then re-trim any trailing hyphen. Never cut mid-word.

### Worked examples

| Input title | Slug | Note |
|---|---|---|
| `Łódź w 2025` | `lodz-w-2025` | `Ł`->`L`->`l`, `ó`->`o`, `ź`->`z`; normalize-and-strip would have yielded `odz-w-2025` |
| `Trendy w pracy zdalnej 2025` | `trendy-w-pracy-zdalnej-2025` | no diacritics; straight collapse |
| `Pączki` | `paczki` | transliteration: `ą`->`a`, `ć`->`c` |
| `Paczki` (no diacritics) | `paczki` | identical surface form to the row above |

The last two rows show why transliteration is mandatory rather than accent-dropping: `Pączki` and `Paczki` both resolve to `paczki`. That collision is real and expected - two distinct titles legitimately share a slug, and the path-safety collision policy (below) handles it by escalating to the user. The danger that transliteration prevents is the OPPOSITE failure: dropping `ł` so that "Łódź" and a hypothetical "Ódź" silently diverge or corrupt, producing unusable directory names that no longer round-trip to the original title.

## Path safety

After building any path from a slug or from any user-supplied fragment, run this checklist BEFORE any create, move, or delete. Reject (do not sanitize-and-continue) on any failure; surface the reason to the orchestrator.

- [ ] Slug matches `^[a-z0-9-]+$` exactly (allowlist, not denylist).
- [ ] Slug is non-empty.
- [ ] Slug does not begin with `.` (no hidden entries, no leading-dot tricks).
- [ ] Slug does not begin or end with `-`.
- [ ] Slug contains no `..` sequence.
- [ ] The raw fragment is not an absolute path (no leading `/`, no drive prefix).
- [ ] Slug length is within the 50-character ceiling from Step 6.
- [ ] Canonicalize the final path with `realpath` (or equivalent normalize that resolves `.`, `..`, and symlinks) and assert the result is INSIDE the project root - the resolved absolute path must have the project root as a strict prefix.
- [ ] No path component is a symlink, and the target does not traverse a symlink out of the project root. Reject symlinked targets outright.

Because Step 4 already restricts the slug to `[a-z0-9-]`, a slug produced by the pipeline cannot contain `..`, `/`, or a leading dot. The checklist still re-validates: callers may pass fragments that did not originate from the pipeline (existing on-disk names, user overrides), and defense-in-depth means the allowlist runs again at the path boundary regardless of provenance.

## Atomic move primitive

Define every relocation as a single move primitive. Never implement the legacy copy-verify-delete sequence (it leaves duplicates on partial failure and races on verification).

Algorithm:

```
move(src, dst):
    assert path_safe(src) and path_safe(dst)        # checklist above
    require_approval(realpath(src), realpath(dst))  # approval hook below
    if same_filesystem(src, dst):
        rename(src, dst)                            # atomic
    else:
        tmp = sibling_temp_path(dst)               # same dir as dst
        copy(src, tmp)
        rename(tmp, dst)                           # atomic publish into place
        unlink(src)                                # only after dst is committed
```

On the same filesystem the move is a single atomic `rename`. Across devices, copy to a temporary sibling of the destination, atomically `rename` the temporary into the final name, and only then `unlink` the source - so an interruption never leaves a half-written destination or an orphaned partial.

### Collision policy (one policy, both flows)

Publish and archive share ONE collision policy. Before moving, detect whether the destination already exists. If it does, surface the collision and escalate to the user for a decision. NEVER silently append a timestamp, suffix, or counter to dodge the collision - silent renaming hides the duplicate-title condition the user needs to resolve.

## Irreversible-action approval hook

Move and delete are irreversible. Before executing either, the orchestrator MUST display the resolved absolute source and destination paths (post-`realpath`) and obtain explicit human approval. This is the human-in-the-loop gate for both publish and archive: no relocation or deletion proceeds without the user confirming the exact resolved paths. Show absolute paths, not slugs or relative fragments, so the human approves what will actually happen on disk.

## Consumers

The following all reference this module rather than reimplementing slug or path logic:

- Orchestrator init - validates and slugs the new article directory name.
- Versioning - derives version file names and validates their paths.
- Publish step - uses the atomic move primitive, collision policy, and approval hook.
- Archive step - same move primitive, collision policy, and approval hook.
- Any agent that writes article files - slugs file names and runs the path-safety checklist before writing.

## Boundary with content trust

This module owns slug generation, path containment, the move primitive, and the approval gate. It does NOT cover web-fetch safety, SSRF protection, or handling of untrusted fetched content - those rules live in `references/content-trust.md` and are not duplicated here. When a path or slug is derived from externally fetched content, apply the content-trust rules first, then this module's allowlist and containment checks at the filesystem boundary.
