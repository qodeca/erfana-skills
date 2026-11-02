# Migration

How to bring existing pages under the rules. Migrate comes before any new design in a project whose pages fail the checker, because one standard is what makes every comment visible.

## Size it, then ask

1. Run the checker over the design and system folders. Count pages, problems by rule, states built by scripts, and existing comment blocks. Count the frames each missing target size would add.
2. Show the user the count, the rough size of the job, and the plan, including any prototypes to create and files to delete. Ask which target sizes the product has, and name the new frames in the plan, because drawing them is design work: `ui-designer` draws them, with the comment-block rules in its prompt, and `ux-reviewer` and `ui-reviewer` review them. Ask for approval. Do only the listed items. A headless run makes no change and says what approval it needs.
3. After approval and before the first edit, follow "Protect comments" in [review-rounds.md](review-rounds.md).
4. If the user declines, stop. Explain the cost, make no new design, and leave every file as it was.

## Convert

Work area by area, so a stopped run leaves a clear line between done and not done. The target is the shape in [design-system.md](design-system.md) and the templates: keep each drawn screen's own look, and move everything around it to the documentation look.

| Old form | New form |
|---|---|
| Scripted or `?state=` states, `<template data-state>` | One visible `.design-state` per state |
| Tabs, or `:checked` switches | Each panel as its own state |
| Modal, menu, or popover opened by a click | A state drawn open |
| Shared script building the frame | Static HTML in each page |
| Raw values | Tokens: add missing ones through Change system |
| One-off styles in a page | The library, or a system change |
| A clickable flow someone still needs | A separate file in `prototypes/` |
| Any other start of file, or the older CSP meta | The fixed start of file in page-rules, with the current CSP meta |
| A `:hover` or `:active` rule | The same rule with `:not(:where(.design-frame *))` |
| `var()` on `opacity`, `display`, or the scale in `transform` | The literal value. For a value that differs by theme, a rule under `[data-theme]` |
| An input or textarea in a frame that accepts typing | The same control with `readonly` |
| A `<select>`, checkbox, radio, or `<details>` in a frame | Plain elements drawn to look the same |
| One status tile at the top of a page | A `.design-tile` rectangle directly above each frame, with the page's status and date. Doc and index pages use `p.ds-meta` |
| `.doc-crumbs`, `.doc-lede`, `.doc-note` | `.ds-crumbs`, `.ds-lede`, `.ds-note` |
| A `section.design-state` with its label above the frame | A `figure.ds-frame.design-state` in `.ds-states`, with the label in its `figcaption` |
| A fixed-width frame in `.ds-frames` | The same figure as a `.design-state` in `.ds-states`, outside that grid. A small part stays in `.ds-frames`, with no fixed width |
| A hand-written journey or overview page for an area | `<area>/index.html` with `data-design-page="index"`, a `p.ds-meta` line, and `<meta name="description">`. The designs index lists it as the area's overview, not as a screen |
| `foundations/`, `components/`, or `patterns/` at the top of the system | `system/foundations/<name>.html`, and a folder with `index.html` and its own CSS for each component and pattern |
| One `components.css` holding every part | Each part's CSS beside its page, and `components.css` importing them |
| A hand-written index | The index templates, then `build-index.mjs` |
| No `Target sizes:` line, no `design-sizes` meta, or a missing size | The line in `docs/designs/README.md`, the meta on each screen page, and a frame for each missing size with its own new `id`. An exception is only for a size with nothing new to show, never a way past the checker. See "Target sizes" in [page-rules.md](page-rules.md) |
| No `<meta name="description">`, `#decision`, or `#exceptions` | Add them: the index reads the first, and the checker needs all three |

- Keep each design page's URL and `id` values, because links and comments rely on them. A system page that moves into `system/` changes its URL: move it with its comment blocks intact, list each move in the plan, and update every link to it. Moving a file is on the approved list only if the plan named it. File-editing tools write text only, so copying the binary `fonts/` folder and removing old files need a shell or a small Node script. List every removed file to the user.
- Every state needs an `id`. Add one where it is missing, and never change an existing one.
- Keep every `erfana:comment` block byte-identical, directly before its element. A comment made on a script-built element sits at the nearest element in the file, and it stays there unless the user decides otherwise.
- A page that was ready has every state set to `in-review`, because a person must approve what it became. Give each state today's date.
- Delete an old script only after every page that used it is converted, and tell the user which files were removed.

## Finish

Run `node <skill>/scripts/build-index.mjs docs`, then the checker on `docs` against that copy. For a page that moved into `system/`, move the same file inside the copy first, so its blocks are compared at the new path. The checker fails a page with comments that is simply gone. Report pages converted, comments kept, pages left and why, and the files removed. Then return to the request that led here.
