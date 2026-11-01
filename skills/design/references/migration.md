# Migration

How to bring existing pages under the rules. Migrate comes before any new design in a project whose pages fail the checker, because one standard is what makes every comment visible.

## Size it, then ask

1. Run the checker over the design and system folders. Count pages, problems by rule, states built by scripts, and existing comment blocks.
2. Show the user the count, the rough size of the job, and the plan, including any prototypes to create and files to delete. Ask for approval. Do only the listed items. A headless run makes no change and says what approval it needs.
3. After approval and before the first edit, follow "Protect comments" in [review-rounds.md](review-rounds.md).
4. If the user declines, stop. Explain the cost, make no new design, and leave every file as it was.

## Convert

Work area by area, so a stopped run leaves a clear line between done and not done. Keep the page's look.

| Old form | New form |
|---|---|
| Scripted or `?state=` states, `<template data-state>` | One visible `.design-state` per state |
| Tabs, or `:checked` switches | Each panel as its own state |
| Modal, menu, or popover opened by a click | A state drawn open |
| Shared script building the frame | Static HTML in each page |
| Raw values | Tokens: add missing ones through Change system |
| One-off styles in a page | The library, or a system change |
| A clickable flow someone still needs | A separate file in `prototypes/` |

- Keep each page's URL and `id` values, because links and comments rely on them.
- Keep every `erfana:comment` block byte-identical, directly before its element. A comment made on a script-built element sits at the nearest element in the file, and it stays there unless the user decides otherwise.
- A page that was ready goes to `in-review`, because a person must approve what it became.
- Delete an old script only after every page that used it is converted, and tell the user which files were removed.

## Finish

Run the checker on `docs` against that copy. Report pages converted, comments kept, pages left and why, and the files removed. Then return to the request that led here.
