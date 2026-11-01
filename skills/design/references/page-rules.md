# Page rules

What every review page must be, and why. `scripts/check-design.mjs` enforces each rule marked with its name in brackets; the rest are for reviewers.

The reason behind all of them: a review page is a drawing for people to judge and comment on. Hidden content gets no comment pin, a script-built element is a poor comment target, and a page that responds to clicks tells a client the product is nearly done.

## Page kinds

Set `data-design-page` on `<body>` [page]: `screen` for designed screens, `doc` for documentation, `index` for lists of pages. Start from `templates/screen-page.html` or `templates/doc-page.html`. All kinds follow every rule here; only `screen` pages need states and open questions.

## No scripts [no-script]

- No `<script>`, `on*` attributes, `javascript:` or `vbscript:` URLs, `.js` files, `<object>`, `<embed>`, script preloads, meta refresh, or CSS `expression()`.
- The first element in `<head>` is this exact policy [csp], so a script that slips through still cannot run:

```html
<meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; child-src 'none'">
```

## Nothing hidden [no-hidden]

Banned, on the page and in every stylesheet it links:

- Tabs, or any switch that swaps content.
- `<template>`, `<dialog>`, `popover`, and `iframe` of any kind.
- The `hidden` attribute, `display: none`, `visibility: hidden`, `opacity: 0`, and `:target`.
- `:checked` with a sibling selector or `:has()`.
- `<details>` without `open`.
- `inert` and `pointer-events: none`. Browsers skip these when a comment tool asks which element sits under the pointer, so the comment lands on the wrong element.

A menu, a modal, or a tooltip is drawn open, as its own labelled state. Rules that hide things on small screens are real product CSS, so they live in `responsive.css`, which review pages never load.

## Draw states, do not simulate them

- Each state is a `.design-state` with a `.design-state__label` and a `.design-frame` [states].
- A frame has a fixed width: `.design-frame--narrow` (320), `--phone` (375), `--tablet`, or `--desktop`. A fixed width makes the picture the same in any window. Never wrap a frame in a scrolling box: part of it would be out of sight. A wide frame makes the page itself wider.
- Documentation styles stop at the frame. Put the product's root class, and `data-theme` for a theme, on the first element inside it. `docs-tokens.css` sets `--frame-surface` and `--frame-text`, which a project may override.
- A frame is a picture: `aria-hidden="true"` [states], every control carries `tabindex="-1"`, no link has `href`, and there is no `<form>` [no-fake-controls].
- Hover, focus, active, and disabled use `.is-hover`, `.is-focus`, `.is-active`, and `.is-disabled`. The library writes each one beside the real selector. A touch product skips hover.
- Light and dark side by side need no `<style>` block: set `data-theme` on the first element in each frame.
- Where iOS and Android really differ, draw each as its own labelled state. Do not draw one and describe the other.

A note never promises what is not drawn. If a note says "the week stays on screen", the week is in the frame. Every action a state offers leads to a drawn state, including its failure. `responsive.css` and the small frame must show the same thing.

Cover these states for each screen, and list any that cannot happen, with the reason:

| State | Must show |
|---|---|
| Default | Real data at its worst: the longest list and the longest name |
| Empty | First use, and a search with no match |
| Loading | First load, and what stays on screen during a reload |
| Error | What failed, what to do next, and what the person keeps |
| Refused | Why it is not allowed, and how to get access |
| Smallest size | The narrow frame, or a desktop app's narrowest window: what moves, what folds away, and that nothing scrolls sideways |

## Status tile [tile]

The first thing on every page. It carries `data-design-status`, `data-updated`, and these words:

| `data-design-status` | Words | Set by |
|---|---|---|
| `draft` | Draft | The agent |
| `in-review` | In review | The agent |
| `ready` | Ready for development | A person only, with `data-approved-by` [status] |

Every tile also says "Design, not a working product", and shows the date as `YYYY-MM-DD`. The checker fails a date older than the file's last change, so update it with every edit. A date marks the page, not the commit, so `--no-date` is for test fixtures and shipped samples only.

## Open questions [questions]

A `screen` page has a `.design-questions` block near the top. List each unconfirmed guess and each decision still open; say "None open" if so. A client who sees the doubts comments on them. The page is the source: the area README adds options and who decides, and `docs/designs/open-questions.md` holds only questions that cross areas.

## Every value is a token [no-raw-values] [tokens]

- `<style>`, `style=`, and linked stylesheets use `var(--token)` for colours, sizes, and durations. Only files named `*tokens.css` hold raw values.
- SVG paints with `currentColor` or a token.
- Every `var()` resolves to a linked stylesheet.
- `tokens.css` always matches `tokens.json`.
- Stylesheets are local files, so pages work offline and the checker can read them [links].

## Real words

Write the product's real labels and realistic data. Agree the wording with the user, and record shared terms in `docs/designs/wording.md`.

## Erfana limits [limits]

Erfana stops showing or writing comments on a file over 25 MB, a file that is not UTF-8, a file with merge-conflict markers, or a file with more than 500 comment blocks. Split the page long before that.

## Links

A design page links only to its own area's pages. An index page may link across areas.
