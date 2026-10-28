# Slugs, paths, and moving a project

How the article skill names project folders, where they live, and how a project moves to `published/` or `archived/`. Every project folder name comes from the slug rules below, and every publish or archive follows the move procedure at the end.

## The article root

The article root is the current working folder. Projects live directly under it, in `in-progress/<slug>/`, `published/<slug>/`, and `archived/<slug>/`.

If `in-progress/` does not exist under the working folder the first time the skill needs it, ask the user once where their articles live (offering the working folder as the default) and use the answer as the article root for the rest of the session. Never place projects outside the folder the user named, and never in the home folder unless the user chose it.

## Making a slug

Apply these steps in order. Transliteration comes first because the later character filter would otherwise delete accented letters instead of mapping them.

1. **Transliterate.** Replace each accented Latin letter with its base letter, using the Polish map below and the general rule after it. Do not rely on Unicode "strip the accents" normalization: `ł` / `Ł` has no Unicode decomposition, so normalization leaves it in place and the filter in step 4 then deletes it, turning "Łódź" into `odz` instead of `lodz`.

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

   Other Latin letters with diacritics map to their base letter in the same way: `é`, `è`, `ê` → `e`; `ü`, `ú` → `u`; `ö`, `ø` → `o`; `ä`, `å`, `á` → `a`; `ñ` → `n`; `ç` → `c`; `č` → `c`; `š` → `s`; `ž` → `z`. A few map to two letters: `ß` → `ss`, `æ` → `ae`, `œ` → `oe`, `þ` → `th`. If the title is mostly in a non-Latin script (Cyrillic, Greek, and so on), ask the user for a slug rather than producing an empty or meaningless one.
2. **Lowercase** the whole string.
3. **Collapse separators.** Replace each run of whitespace or punctuation with one hyphen.
4. **Filter.** Remove every character that is not in `[a-z0-9-]`.
5. **Tidy hyphens.** Collapse repeated hyphens to one; trim leading and trailing hyphens.
6. **Truncate** to at most 50 characters. If the slug is longer, cut at the last hyphen at or before position 50 so no word is split. If there is no hyphen within the first 50 characters (one very long word), cut at exactly 50 characters. Then trim any trailing hyphen.

| Input title | Slug | Note |
|---|---|---|
| `Łódź w 2025` | `lodz-w-2025` | `Ł` → `l`, `ó` → `o`, `ź` → `z` |
| `Trendy w pracy zdalnej 2025` | `trendy-w-pracy-zdalnej-2025` | no diacritics |
| `Pączki` | `paczki` | `ą` → `a` |
| `Café culture in Zürich` | `cafe-culture-in-zurich` | general rule: `é` → `e`, `ü` → `u` |
| `Straße` | `strasse` | `ß` → `ss` |

Two titles can share a slug (`Pączki` and `Paczki` both give `paczki`). That is expected: the existing-folder check below catches it and the user decides.

## Checking a slug and a path

Before creating a project folder or preparing a move, check the slug and reject it on any failure, telling the user why. Do not clean up a bad slug and carry on.

- It is non-empty and matches `^[a-z0-9-]+$`.
- It does not begin or end with `-`, and is at most 50 characters.
- It is used as a single folder name: the path is always `<article root>/<in-progress|published|archived>/<slug>`. Never build a path from any other text – a folder name found on disk, a user override, or anything from research – without running it through the same check, because a fragment such as `../` or an absolute path would place files outside the article root.

A slug that passes these checks cannot contain `/`, `..`, or a leading dot.

## Moving a project (publish or archive)

The skill does not move, copy, or delete project folders: it has no tool that can, and a move done by copying files and deleting the source can lose work if it stops halfway. The user runs the move; the skill prepares it and confirms the result.

1. **Check the paths.** Check the slug as above. Confirm that `in-progress/<slug>/` exists under the article root by listing its files, and that `published/<slug>/` (or `archived/<slug>/`) does not exist. For an archive of a published project, the source is `published/<slug>/`.
2. **Destination already exists.** Stop and ask the user what to do. Never add a date, suffix, or counter to get around it: a silent rename hides a duplicate the user needs to resolve.
3. **Show the command.** Show the absolute path of the article root and the exact command to run from it, with quoted paths relative to the root:

   ```bash
   mv "in-progress/<slug>" "published/<slug>"
   ```

   If the destination parent folder (`published/` or `archived/`) does not exist yet, show `mkdir -p "published" && mv "in-progress/<slug>" "published/<slug>"` instead. Ask the user to run it from the article root (in Claude Code they can prefix it with `!`) and to say when it is done. Running the command is the user's approval; do not treat anything else as approval.
4. **Confirm the result.** When the user says it is done, list the destination to confirm it exists with the project files, and confirm the source no longer exists. If either check fails, report exactly what is on disk and stop; do not try to finish the move yourself.
5. **Update the metadata** in the project's new location: the status, the `published_date` or `archived_date` (with `archive_reason` and `previous_status` for an archive), and `publication_path` for a publish.

In a headless run, nobody can run the command: do steps 1 and 2, print the command, make no changes, and report that the move is waiting for the user.

The skill never deletes a project or any file in it.
