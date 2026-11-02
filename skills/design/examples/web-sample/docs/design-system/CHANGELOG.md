# Changelog

## 4.3.0 – 2026-11-01

Changes from the third review.

- Product rule: a committing button ignores presses for 500 ms after its screen appears. The layout protects at the drawn height, and this rule protects at every height.
- Added `.book__aside--pin`, which pins the Booked stack and the cancel question's stack to the bottom of a phone screen in `responsive.css`.
- The month label keeps two lines' height beside the week, so the week buttons never shift.
- A status word in `.daylist` no longer breaks, and the column has a minimum width.

## 4.2.0 – 2026-11-01

Changes from the second review. Nothing was renamed, except that `.daypage__retry` is now the wrapper `.daypage__retrybar`.

- `.app` is now a named container, `app`, so a rule inside the day list's own pane can still read the window. The day list's phone and tablet rules use it.
- On a phone the retry joins the bar at the bottom, and pins with it in `responsive.css`.
- Added `.keyboard`, drawing only, with `--keyboard-height`, to show what stays in reach while typing.
- Added `.link.is-disabled` and `.slot.is-locked`, for what locks while saving.

## 4.1.0 – 2026-11-01

Changes from the UI and UX reviews. Nothing was renamed.

- A desktop `.book` now fills the page, and `--book-reading` caps only a lone field.
- A quiet button's hover takes the new `--color-hover`, so it no longer matches a disabled button.
- Added `.choice`, a large option with its duration inside, and `--choice-height` and `--choice-height-tall`.
- Added `.field__input--text`: a long name wraps instead of cutting off. A `.ticket--fold` card stays stacked under 22rem.
- Added `.ticket__label`, and bars for a day's count: `.day__free.skeleton`.
- Added `.daypage__retry`, so "Try again" no longer shifts the day buttons. On a phone `.daylist-nav` is three equal columns, and `.daypage__list` stops being a container.
- `.daylist__session` stays on one line.

## 4.0.0 – 2026-11-01

One web product now adapts across desktop, tablet, tablet landscape, and phone, with one set of component CSS. The drawing work is in `designs/README.md`.

- Breaking: `.book` now holds `.book__main` and `.book__aside`, and the time picker takes `.book--pick` with `.book__week`, `.book__times`, and `.times`. Actions sit in `.book__actions`. A two-column rail is now `.times`, so `.rail--wide` is gone.
- Breaking: the staff list sits in `.daypage`, with `.daypage__list`, `.daypage__next`, and `.daylist-nav`. The list pane is its own container, so `.daylist` reads the pane, not the window.
- Breaking: the breakpoints moved to 37.5rem, 52.5rem, and 75rem, from 40rem and 56rem, to follow the window size classes. Only the day list's pane rules keep 39.99rem, and they add 49.99rem for the Session column.
- Added `.pagehead`, `.fields`, `.day__free`, `.ticket--fold`, `.ticket--wide`, `.book--form`, `.book--start`, and `.book__aside--dock`.
- Added tokens for the panes: `--measure-pane-week`, `--measure-pane-card`, `--measure-pane-aside`, `--measure-reading`, `--measure-page`, `--measure-screen`, the `--book-*` and `--daypage-next` sizes, `--app-page-max`, `--app-min-height`, `--day-height-row`, and `--day-name-width`.
- `responsive.css` now also pins the bottom bars and fills the window. Both stay out of the drawings: a pinned bar would cover content in a frame, and a frame sets its own height.
- A long notice line now wraps inside its pane.

## 3.1.0 – 2026-11-01

Migrated to the current documentation shell and folder division. No token, class, or drawn state changed.

- Added foundation pages for colour, type, spacing, shape, focus, and motion.
- Added component pages for the app frame, icons, buttons, week and days, the appointment card, fields, notices, text links, loading, and the day list, and pattern pages for the time picker and for empty, loading, and error states.
- Split `components.css` into one file per part under `system/`. It is still the single entry point, so a page that links it needs no change. A product must ship `system/` beside it.
- `components/slot.html` moved to `system/components/slot/index.html`. Update any saved link.

## 3.0.0

Visible changes: a system font stack, week buttons on one line at wide sizes, a wider gap between `.rail--wide` columns, fields that keep their token height in a tall grid, and a 44 px minimum height on `.link` through the new `--link-height`. Nothing was renamed.

## 2.0.0

Renamed the coral colours from `--color-tape*` to `--color-marker*`, `--shape-tape` to `--shape-control`, and `.ticket.is-void` to `.ticket--void`. Buttons moved to `--color-action*`.
