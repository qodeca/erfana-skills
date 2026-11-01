# Changelog

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
