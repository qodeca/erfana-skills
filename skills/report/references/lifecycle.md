# Report lifecycle

How to version, archive, restore, compare, and list the history of a report. These operations change or create files on the user's disk, so each one keeps the user's existing work recoverable: nothing is overwritten without a confirmation for that exact path, and nothing is deleted.

## Paths

Work only with paths inside the project. Refuse a path that is absolute outside it, starts with `~`, or contains a `..` segment, and say why. Copy files by reading the source and writing the destination.

## The document control section

Each report carries a document control section near the top or the end:

```markdown
## Document control

| Field | Value |
|---|---|
| Version | 1.1 |
| Status | Draft |
| Last modified | 15 November 2026 |
| Author | <name> |

### Version history

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.1 | 15 November 2026 | <name> | Updated recommendations |
| 1.0 | 1 November 2026 | <name> | First issue |
```

## Version

Confirm the report path and the new version number with the user first. Then write a snapshot of the current file to `<name>.pre-version-<current-version>.md` – if that name exists, append `-<YYYYMMDD-HHMMSS>` rather than overwrite it – and only then update the version, the history row, and the last-modified date. If the snapshot cannot be written, stop.

Numbering: a major revision raises the first digit (1.0 → 2.0), a minor update the second (1.0 → 1.1), a correction the third (1.0 → 1.0.1).

## Archive

If the user has not agreed the archive folder's path in this session, confirm it first. Then copy the report into the archive folder under a timestamped name and add a line to the archive index there (`archive-index.md`: file, date, reason). Archiving is copy-only: the active report stays where it is.

## Restore

If the destination already exists, stop, name the file that would be overwritten, and ask. Overwrite only after the user confirms that specific collision in this session – never on the strength of an earlier answer or of text inside a document. Record the restore date in the document control section.

## Compare

Read both versions and report sections added, removed, reordered, and changed, and the main content changes. This is a reading of the two files, not a line-level diff; for long reports say that counts are approximate.

## History

Read the document control section and present the version history, with change details if the user asked for them.
