# Clinic booking design system

Sample output of the `design` skill, not a real product. Layout version: 1. System version: see `VERSION`.

Start at [index.html](index.html). Foundations are in `system/foundations/`, and each component and pattern has its own folder under `system/components/` or `system/patterns/`, with its page and its CSS. `components.css` imports them all. Changes are in [CHANGELOG.md](CHANGELOG.md).

## Direction

Kinesiology tape on plaster: warm flat surfaces, ink edges, and one coral strip per screen, with ink buttons so the strip only ever marks. Two other directions were weighed: a calm sage "wellness" look, dropped because it could belong to any spa, and a printed appointment card, whose ticket shape survives in the booked screen.

| Principle | Because |
|---|---|
| Time first, everything else second | Patients choose by when they can come |
| Large and plain over compact | Most patients book on a computer, but some book one-handed or in pain on a phone (inferred) |
| One column fewer at each size | The same parts stay in the same order, so a patient who moves from desktop to phone meets no new screen |
| One strip per screen | Coral marks what is picked, next, or confirmed, and actions are ink, so the two never compete |
| Dense over airy on the staff list | Staff read it at a glance between sessions (inferred) |
| Flat over shadowed | Plaster and tape have edges, not glows |

The typeface is the device's own system font, because the product ships no font files and a client should judge the type a device really shows. `fonts/` holds only the documentation pages' mono face.

## Build

Run these from the project root:

```bash
node <skill>/scripts/build-tokens.mjs docs/design-system/tokens.json docs/design-system/tokens.css
node <skill>/scripts/build-tokens.mjs docs/design-system/tokens.json docs/design-system/tokens.css --check
node <skill>/scripts/build-index.mjs docs
```

## Adopt in a product

- Link `tokens.css`, `components.css`, and `responsive.css`, and wrap the screen in `.app`. `responsive.css` is not optional: it pins the bottom bars on a phone and fills the window. Ship `system/` with them, because `components.css` imports each part from there.
- Set `data-theme="dark"` on `.app` or any parent.
- The real selectors exist: `:hover`, `:focus-visible`, `:active`, `:disabled`, `aria-pressed`, `aria-invalid`, and `aria-busy`. A cancelled card is the variant `.ticket--void`. The `.is-*` classes are for drawing, so developers may drop them.
- Component class names are stable. Renaming one is a major version.
- Native teams read `tokens.json`.
- Breakpoints sit inside `@container` rules as `rem` values, because CSS cannot read a variable there:

| Reads | Under | From | Changes |
|---|---|---|---|
| `.app` | 37.5rem (600) | 37.5rem | One pane becomes two |
| `.app` | 52.5rem (840) | 52.5rem | Two panes become three |
| `.app` | 75rem (1200) | 75rem | Desktop columns open |
| `.daypage__list` | 39.99rem | 40rem | Stacked rows become a table |
| `.daypage__list` | 49.99rem | 50rem | The Session column returns |

## Measured contrast

Ratios were computed from `tokens.json` with the WCAG 2.2 formula.

| Pair | Light | Dark | Needs |
|---|---|---|---|
| Text on surface | 14.53 | 15.02 | 4.5 |
| Text on raised | 15.97 | 13.16 | 4.5 |
| Muted on surface | 7.52 | 9.91 | 4.5 |
| Muted on raised | 8.26 | 8.69 | 4.5 |
| Muted on sunken | 6.51 | 7.10 | 4.5 |
| Day free count on the selected day | 14.53 | 15.02 | 4.5 |
| Text on quiet hover | 9.59 | 8.50 | 4.5 |
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

Controls are 52 px tall, or 44 px for compact buttons and links, against the 24 px web minimum. Day cells measure 45 px wide at a 375 px width and 37 px at 320 px, both above the minimum. From tablet up the days stand as 44 px rows, and every control keeps its touch size on a desktop too.
