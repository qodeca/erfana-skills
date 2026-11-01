# Clinic booking design system

Sample output of the `design` skill, not a real product. Layout version: 1. System version: see `VERSION`.

This sample is trimmed to stay small. A real project also has `CHANGELOG.md`, `index.html`, and one documentation page per foundation, component, and pattern; here `components/slot.html` stands for them all.

## Direction

Kinesiology tape on plaster: warm flat surfaces, ink edges, and one coral strip per screen, with ink buttons so the strip only ever marks. Two other directions were weighed: a calm sage "wellness" look, dropped because it could belong to any spa, and a printed appointment card, whose ticket shape survives in the booked screen.

| Principle | Because |
|---|---|
| Time first, everything else second | Patients choose by when they can come |
| Large and plain over compact | Many patients book one-handed, or in pain (inferred) |
| One strip per screen | Coral marks only what is picked or next, and actions are ink, so the two never compete |
| Dense over airy on the staff list | Staff read it at a glance between sessions (inferred) |
| Flat over shadowed | Plaster and tape have edges, not glows |

The typeface is the device's own system font, because a sample ships no font files and a client should judge the type a device really shows.

## Build

```bash
node <skill>/scripts/build-tokens.mjs tokens.json tokens.css
node <skill>/scripts/build-tokens.mjs tokens.json tokens.css --check
```

## Adopt in a product

- Link `tokens.css`, `components.css`, and `responsive.css`, and wrap the screen in `.app`.
- Set `data-theme="dark"` on `.app` or any parent.
- The real selectors exist: `:hover`, `:focus-visible`, `:active`, `:disabled`, `aria-pressed`, `aria-invalid`, and `aria-busy`. A cancelled card is the variant `.ticket--void`. The `.is-*` classes are for drawing, so developers may drop them.
- Component class names are stable. Renaming one is a major version.
- Native teams read `tokens.json`.
- Version 3.0.0 made visible changes: a system font stack, week buttons on one line at wide sizes, a wider gap between `.rail--wide` columns, fields that keep their token height in a tall grid, and a 44 px minimum height on `.link` through the new `--link-height`. Nothing was renamed.
- Version 2.0.0 renamed the coral colours from `--color-tape*` to `--color-marker*`, `--shape-tape` to `--shape-control`, and `.ticket.is-void` to `.ticket--void`. Buttons moved to `--color-action*`.
- Breakpoints sit inside `@container` rules as `rem` values, because CSS cannot read a variable there.

## Measured contrast

Ratios were computed from `tokens.json` with the WCAG 2.2 formula.

| Pair | Light | Dark | Needs |
|---|---|---|---|
| Text on surface | 14.53 | 15.02 | 4.5 |
| Text on raised | 15.97 | 13.16 | 4.5 |
| Muted on surface | 7.52 | 9.91 | 4.5 |
| Muted on sunken | 6.51 | 7.10 | 4.5 |
| Text on action button | 15.97 | 15.02 | 4.5 |
| Text on action button, hover | 8.26 | 16.50 | 4.5 |
| Text on action button, pressed | 12.20 | 13.00 | 4.5 |
| Ink on coral | 6.80 | 6.80 | 4.5 |
| Ink on coral, hover | 8.44 | 8.50 | 4.5 |
| Ink on coral, pressed | 5.62 | 5.74 | 4.5 |
| Control edge on surface | 4.59 | 5.45 | 3 |
| Marker edge on surface | 14.53 | 7.03 | 3 |
| Focus on surface | 14.53 | 16.50 | 3 |
| Error on tint | 6.32 | 7.91 | 4.5 |
| Success on tint | 5.71 | 7.05 | 4.5 |
| Text on danger button | 7.57 | 9.59 | 4.5 |
| Text on danger button, hover | 5.64 | 11.76 | 4.5 |
| Text on danger button, pressed | 10.16 | 7.66 | 4.5 |

Coral on plaster alone measures 2.14, so in the light theme coral never stands without its ink edge.

Controls are 52 px tall, or 44 px for compact buttons and links, against the 24 px web minimum. Day cells measure 45 px wide at a 375 px width and 37 px at 320 px, both above the minimum.
