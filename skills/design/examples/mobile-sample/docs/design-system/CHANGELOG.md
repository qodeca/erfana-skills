# Changelog

## 3.2.0 – 2026-11-01

Minor: tokens and classes are added, and nothing is removed or renamed.

- The product now runs on phone and tablet. Added the Panes component, `.panes` and `.pane`, which puts one set of parts into one, two, or three panes with `@container` rules at 600 and 960. Three panes wait for 960 because at 840 the main pane would be narrower than the status beside it. `.screen` and `.sheet-screen` now set the container, so the rules also work in a web view.
- `.action-bar` becomes a row from 600: buttons share an equal height, and the longer label takes more width. `.sheet` stops at 480 from 600 and is centred, and on Android it stays at the bottom and stops at 640.
- `.ticket--compact` takes the full time back in a pane of 352 or wider, and folds to two lines in a list from 960. Added `.ticket--pick.is-selected`.
- Added `.group--across`, `.pane--list`, `.pane--lead`, `.pane--main`, `.pane--side`, `.panes--two`, `.panes--solo`, `.panes--detail-open`, and `.action-bar--even`, `.button--retry`, `.button--half`, `.sheet-screen__behind`, `.sheet-screen--keyboard`, and `.keyboard`, which marks what the system keyboard covers and is not a design for it.
- Added `component.pane`, `component.ticket.selected-edge`, `component.keyboard`, `component.sheet.centred-width`, `component.sheet.bottom-width`, `component.sheet.safe-bottom`, `semantic.space.none`, `semantic.color.skeleton-sunken`, and seven `semantic.shape` sizes.
- `responsive.css` now has rules: below 600 only one pane shows.
- `.icon` multiplies by `--type-scale`, so icons grow with 200% text.
- `.sheet` ends with the action bar's padding below 600, so its bottom button sits in the same slot as the bar's, and it runs to the bottom edge of the screen. From 600 the padding is unchanged. `.app-bar__back` has a disabled look. `.sheet-screen--keyboard` keeps the dimmed screen behind the sheet.
- `.pane > .empty` starts at the top of a pane from 600. `.panes--solo` is now for 200% text only.
- Phone frames in `swap` changed too: Try again moved to the action bar, Say no again keeps its slot, and request detail states use the Sun 15 Nov request, so the list and the detail agree.

On pages that use the system, name the three target sizes and draw each state at them. The `swap` area is updated.

## 3.1.0 – 2026-11-01

Minor: no token, class name, or drawn part changed.

- Moved to the folder division: `system/foundations/<name>.html`, and `system/components/<name>/` and `system/patterns/<name>/`, each with `index.html` and its own CSS. Old links to system pages need the new path.
- `components.css` is now the entry point and imports one file per part, so linking it works as before. `.row__time` has its own rule in `row.css`, with the same values.
- `.empty` moved to `saying-no.css`, and `.skeleton` and `.refresh` to `loading.css`.
- Added pages: Focus, Text, and Icon. Added `#related`, `#markup`, and `#exceptions` to the documentation pages.
- `docs.css` and `docs-tokens.css` are the new template copies, with `fonts.css` and `fonts/`. Status now sits in a rectangle above each frame.
- Each light and dark pair is two states: the light one keeps its `id`, and the dark one is `<id>-dark`.

On pages that use the system, update links to moved pages. The `swap` area is updated.

## 3.0.0 – 2026-11-01

Major, because the rules below change how pages look.

- Added `--color-skeleton`. `--skeleton-bg` now uses it, and dark skeletons are `base.sand.500`, 3.74:1 on a raised surface, up from 1.16:1. Light is unchanged.
- `base.font.ios` adds `BlinkMacSystemFont`, so iOS frames show the San Francisco system font on a Mac.
- `.field__input` sets `resize: none`.
- The warning look on `.check` is kept, but no swap rule uses it. Over weekly hours now stops a swap, like too little rest.
- The `.ticket--pick` disabled look is only for a ticket that leads nowhere.

On pages that use the system, re-read anything with a skeleton, a request row, or a too-close shift. The `swap` area is updated.

## 2.0.0 – 2026-11-01

Major, because tokens were removed and pages look different.

- Removed `--shape-screen-height` and the 640 canvas height. Frames now end where their content ends.
- Removed `--ticket-time` and `--ticket-time-compact`. Use `--text-style-time-*` and `--text-style-time-compact-*`.
- `base.text.*` is px, read as pt or sp. Every font-size multiplies by the new `--type-scale`. On pages, swap `font-size` on the root for `data-theme="large-text"` on the frame's first element.
- `--color-scrim` no longer carries alpha. `--opacity-scrim` holds it, and the dark scrim is lifted so it reads against the dark surface.
- Added component colours for every part, `component.text-style.*`, `--color-sheet`, `--color-on-success`, the `component.sheet` group, and platform fonts.
- Title is 22 at the strong weight, so it stays under the smallest time, 28.
- Ticket and row edges use `--color-line-strong`. Times break only after the dash.
- The current baton step is a ring, not filled marigold. A selected row no longer shifts by 1 px.
- Sheets put the safe action at the bottom, and Keep is a secondary button on every sheet.
- Added `.row__date`, `.row__time`, `.ticket__go`, `.sheet__grabber`, `.screen--ios`, `.screen--android`, `.sheet-screen--ios`, and `.sheet-screen--android`.
- Fixed `cubic-bezier(var(--motion-ease))`, which was invalid: `--motion-ease` already holds the whole curve. Transitions now run with the intended curve.

On pages that use the system, re-read anything with a sheet, a baton, or a request row. The `swap` area is updated.

## 1.0.0 – 2026-11-01

- First version: tokens in light and dark, nine components, two patterns, and five foundations, built for the `swap` area.
