# Shift swap design system

Version 3.1.0. Layout version 1. Open `index.html` for every foundation, component, and pattern.

## Design principles

1. **Time beats everything.** The shift time is the largest thing on a screen, because "which shift?" comes before any other thought.
2. **One marigold thing per screen.** If it is filled marigold, it is the next tap. A hurried person should not have to choose where to look.
3. **Every no explains itself.** No disabled control appears without a reason in words and a way forward.
4. **The night ward is a normal place.** Dark is a full theme, not an afterthought, and no surface is pure white or pure black.
5. **Words first, colour second.** Red and green only repeat what a word and an icon already say, because hospitals already use those colours for alarms.

## Directions considered

| Direction | Idea | Decision |
|---|---|---|
| Handover ticket | Warm paper neutrals, huge times, one marigold action | Chosen: the time reads at arm's length, and marigold means no clinical alarm |
| Night ward | Dark only, amber on near-black | Rejected as the only look: day shifts and bright corridors need a light theme. It lives on as the dark theme |
| Clinical calm | Teal and white, soft cards | Rejected: looks like every hospital tool, and gives a tired eye nothing to hold on to |

The deliberate choice: **the shift ticket**. Times are set at 44 on a full ticket and 28 in lists and compact tickets, heavier than any heading, with equal-width numerals. These are numbers read as pt on iOS and sp on Android, and no title goes above 22, so the time stays the largest thing. Most scheduling apps lead with a name or a calendar; this one leads with the hours of a person's life.

## Build

```bash
node <skill>/scripts/build-tokens.mjs docs/design-system/tokens.json docs/design-system/tokens.css
node <skill>/scripts/build-tokens.mjs docs/design-system/tokens.json docs/design-system/tokens.css --check
```

Run these from the project root. `tokens.json` is the master, and `tokens.css` is never edited by hand. `docs.css`, `docs-tokens.css`, `fonts.css`, and `fonts/` are template copies, and they style documentation only.

After a page is added, renamed, removed, or changed, rebuild both indexes:

```bash
node <skill>/scripts/build-index.mjs docs
node <skill>/scripts/build-index.mjs --check docs
```

## Folders

| Part | Where |
|---|---|
| Foundations | `system/foundations/<name>.html` |
| Components | `system/components/<name>/`, with `index.html` and its own CSS |
| Patterns | `system/patterns/<name>/`, with `index.html` and its own CSS |

`components.css` imports each part's CSS, in a fixed order, and is the one file to link.

## Adopting the library

- **iOS and Android teams** read `tokens.json`. The app is native, so `components.css` does not ship in it; treat the CSS and the component pages as the exact specification of each part.
- **A web view or web team** links `tokens.css`, `components.css`, and `responsive.css`, and sets `data-theme="dark"` on `.screen` or any parent.
- `.is-*` classes exist only to draw a state on a review page. Developers may drop them.
- Component class names are stable. Renaming one is a major version.
- Sizes in px are numbers: read them as pt on iOS, dp on Android, and sp for text. `tokens.json` holds no rem.
- `--motion-ease` already holds the whole `cubic-bezier()`, so write `transition: background-color var(--motion-fast) var(--motion-ease)`, never `cubic-bezier(var(--motion-ease))`. Native teams read the four numbers from `base.curve.settle`.
- Colour and alpha are separate tokens, because hex alpha order differs across platforms. The scrim is `component.sheet.scrim` at `component.sheet.scrim-opacity`, and on the web it is its own layer.
- Each part has component tokens for its colours, and `component.text-style.*` gives size, weight, and leading for each text style.
- Fonts: `semantic.typeface.ios` is SF Pro, `semantic.typeface.android` is Roboto, and `semantic.typeface.body` is the web stack.

## Modes

A token's `$value` is its default, light value. `$extensions.design.modes` holds the same token in another mode, and only semantic tokens have modes. Component tokens alias semantic ones, so they follow.

| Mode | Changes | Native teams |
|---|---|---|
| `dark` | Surfaces, text, lines, the sheet, and the scrim | Read it as the dark theme |
| `large-text` | `semantic.type.scale`, from 1 to 2 | Ignore it, and use Dynamic Type and the Android text size. It exists so review pages can draw 200% text |

The two are separate on the web because `data-theme` holds one value. A web view that needs both sets `--type-scale` directly.

## Sizes

| Item | Value | Why |
|---|---|---|
| Minimum target | 48 | Android's 48 dp rule, which also clears iOS's 44 pt |
| Main action | 56 | A hurried thumb, possibly gloved |
| Body text | 17 | iOS default, kept on Android for tired eyes |
| Title | 22 | Stays below the smallest shift time, 28 |
| Shift time | 44, or 28 in lists and compact tickets | Always the largest text on a screen |

## Breakpoints

None. The product is phone-only, so `responsive.css` is deliberately empty and there are no `@container` rules. Tablet layouts are out of scope.

## Status

Contrast is measured on `system/foundations/colour.html`: every text and control pair passes in both themes. Two pairs sit under 3:1, both in the light theme. The day band on a raised surface, 1.78:1, is decoration, because the word Day and the sun icon say the same thing. Marigold on sand, 1.66:1, never stands alone, because the button keeps its dark edge.
