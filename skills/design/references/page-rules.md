# Page rules

What every review page must be, and why. `scripts/check-design.mjs` enforces each rule marked with its name in brackets; the rest are for reviewers.

The reason behind all of them: a review page is a drawing for people to judge and comment on. Hidden content gets no comment pin, a script-built element is a poor comment target, and a page that responds to clicks tells a client the product is nearly done.

## Page kinds

Set `data-design-page` on `<body>` [page]: `screen` for designed screens, `doc` for documentation, `index` for lists of pages. A page under `docs/designs/` is `screen` or `index`. Start from the matching file in `templates/`. All kinds follow every rule here; only `screen` pages need states and open questions.

## One accepted form

A browser and this checker read HTML differently in many small ways, and each difference is a way past the rules. So a page takes one narrow form, and anything else fails, even where a browser would accept it.

- A page starts with exactly these lines, and nothing comes before them [page] [csp]: `<!doctype html>`, `<html lang="...">`, `<head>`, the CSP meta below, and `<meta charset="utf-8">`.
- A page has one `<html>`, one `<head>`, and one `<body>`, in that order, one charset, and one CSP meta. Only white space and comments sit outside them [page].
- Each element comes from a short list for where it sits: in `<head>`, in `<body>`, or in `<svg>` [elements]. Each attribute does too [attributes]. The element lists are in `scripts/page-form.mjs`. `<svg>` holds simple shapes and text, with no `<title>`, `<style>`, `<defs>`, or animation. `<math>` is not on the list.
- Tags are plain [markup]: double quotes around every value, HTML white space only, no attribute twice, no attributes on a closing tag, and no `<![CDATA[`, `<?`, or control characters. A comment does not use `<!-->`, `<!--->`, or `--!>`, because a browser ends those early.
- Entities belong in text. In an attribute they are allowed only in words: `alt`, `placeholder`, `value`, the `aria-` labels, and the `content` of a description or tasks meta [attributes]. Write the plain character anywhere else.
- A URL is a local path of letters, digits, and `. _ - /`, and does not start with `/` [links]. One check covers every URL-bearing attribute and CSS `url()`. Only an `href` on an `<a>` outside a frame may be an `https:` address. Stylesheets end in `.css` and stay inside `docs/`.
- CSS is plain too [css]: no backslash, no nested rules, and only `@media`, `@container`, `@font-face`, `@keyframes`, and, in a linked sheet, a local `@import`.

## Page anatomy [anatomy]

Every page has `<main>`. Screen and doc pages also need `nav.ds-crumbs`, an element with `id="decision"`, and `<meta name="description">`, which the index shows. A doc page also needs an element with `id="exceptions"`. The full shape is in [design-system.md](design-system.md).

## Balanced tags [balance]

Every non-void element has its closing tag, in the right order, and every closing tag has an element to close. A browser repairs a dropped tag without a word, so the page looks fine while its states nest inside each other. This is stricter than HTML itself: optional closing tags, such as `</li>` and `</p>`, are written too. `/>` counts only inside `<svg>` and `<math>`.

## No scripts [no-script]

- No `<script>`, `on*` attributes, `javascript:` or `vbscript:` URLs, `.js` files, `<object>`, `<embed>`, script preloads, meta refresh, or CSS `expression()`.
- The first element in `<head>` is this exact policy [csp], so a script that slips through still cannot run, and nothing loads from anywhere but the page's own folder tree:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; child-src 'none'">
```

## Nothing hidden [no-hidden]

Banned, on the page and in every stylesheet it links:

- Tabs, or any switch that swaps content.
- `<template>`, `<dialog>`, `popover`, and `iframe` of any kind.
- `<details>` and `<summary>`, because a click closes them, and elements whose content does not render: `<noscript>`, `<datalist>`, `<canvas>`, `<audio>`, and `<video>`.
- The `hidden` attribute, a hidden input, `display: none`, `visibility: hidden`, `opacity: 0`, and `:target`.
- `:checked` anywhere, a state such as `:hover` that changes another element, and a state inside `:has()`. A state alone on its own element is fine.
- `inert` and `pointer-events: none`. Browsers skip these when a comment tool asks which element sits under the pointer, so the comment lands on the wrong element.

Properties that can hide content take a literal value, never `var()`, because a token can hold anything: `display`, `visibility`, `content-visibility`, `pointer-events`, `opacity`, `scale`, `zoom`, `clip-path`, `mask`, and the scale in `transform`. `opacity` is a plain number of at least 0.1. A size of 0, a font size of 0, `color: transparent`, a negative `z-index`, and `filter: opacity()` also fail. These rules close the known routes; they cannot prove a thing is visible, so a browser look stays part of the review.

A menu, a modal, or a tooltip is drawn open, as its own labelled state. Rules that hide things on small screens are real product CSS, so they live in `responsive.css`, which review pages never load.

## Draw states, do not simulate them

- Each state is a `figure.ds-frame.design-state` inside `.ds-states`, with its own `id`, a `.design-frame`, and a `.design-state__label` in its caption [states]. A frame on a screen page always sits in a state.
- A frame on a screen page has a fixed width: `.design-frame--narrow` (320), `--phone` (375), `--phone-small` (320), `--tablet`, or `--desktop`. Use `--phone` and `--phone-small` for anything seen on a phone: `docs.css` draws a phone body around the screen in plain CSS, adds empty space at the top and bottom for the camera and home bar, and keeps the root element's `::after` for the side buttons, so a design must not use it. Use `--narrow` only for a narrow desktop window. Worked examples are in `examples/web-sample/` and `examples/mobile-sample/`. A fixed width makes the picture the same in any window. Never wrap a frame in a scrolling box: part of it would be out of sight. A wide frame makes the page itself wider.
- Figures in the `.ds-frames` grid show small parts on doc pages, and their frames have no fixed width. A frame with a fixed width sits in a `.design-state` with its rectangle, in `.ds-states`, outside that grid, because it is wider than a grid column [frames]. A doc page keeps its status in `p.ds-meta` [tile], so its states have no rectangle.
- Documentation styles stop at the frame, and at anything marked `aria-hidden`. Put the product's root class, and `data-theme` for a theme, on the first element inside it. `docs-tokens.css` sets `--frame-surface` and `--frame-text`, which a project may override in its own stylesheet, never in the copy [copies].
- A frame is a picture, on every kind of page: `aria-hidden="true"` [states], every control carries `tabindex="-1"`, every input and textarea is `readonly` or `disabled`, no link has `href`, no label has `for`, and there is no `<form>`, `<select>`, checkbox, radio, or `<details>` [no-fake-controls]. Draw those with plain elements.
- A frame does not react to the mouse. `docs.css` forces `cursor: default` and `transition: none` inside it, and every `:hover` and `:active` rule carries `:not(:where(.design-frame *))` [frames]. The guard is harmless in the product, so the file still ships as it is. `pointer-events: none` is not the answer, because a comment must land.
- Hover, focus, active, read-only, and disabled use `.is-hover`, `.is-focus`, `.is-active`, `.is-readonly`, and `.is-disabled`. Inside a frame `readonly` only stops typing, so `:read-only` carries the same guard as `:hover`, and a locked field is drawn with `.is-readonly`. The library writes each one beside the real selector. A touch product skips hover.
- A rectangle goes above each drawn state, and each theme is drawn as its own state, with an `id` ending `-dark` for the dark one. Themes need no `<style>` block: set `data-theme` on the first element in the frame.
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

## Status [tile] [meta] [date]

A page has no status tile at the top. On a `screen` page, each drawn state has its own `.design-tile` rectangle, inside the `.design-state` and directly above its frame [tile]. A `doc` or `index` page has one `p.ds-meta` line under its `h1` [meta]. Both carry `data-design-status`, `data-updated`, and these words:

| `data-design-status` | Words | Set by |
|---|---|---|
| `draft` | Draft | The agent |
| `in-review` | In review | The agent |
| `ready` | Ready for development | A person only, with `data-approved-by` [status] |

Each one also says "Design, not a working product", and shows the date as `YYYY-MM-DD`.

The date rule [date]: the newest date on a page must not be older than its last design change, so update the date of each state you change. A design change is a difference from the baseline or, with no baseline, from the last commit. A saved comment is not one, and a later commit is not one: commit dates are never read. Where a comment was saved since that copy, or a page has comments and no earlier copy, the file time cannot tell the two apart, so the page gets a `notice:` line instead. Against a baseline, a state that changed must itself carry a date at least as new as the file. A date cannot be more than a day ahead. A generated index takes its date from its pages, so this rule skips it. `--no-date` is for test fixtures and shipped samples only.

Ready is per state [status]: a state changed while ready goes back to `in-review`, and a change around the states moves every ready state back. States you did not touch keep their status. Any open comment on the page blocks ready, in whichever state it sits. A state newly set to ready, or a ready state removed, prints a `notice:` line to confirm with the user.

## Indexes [index]

`docs/design-system/index.html` and `docs/designs/index.html` are built by `scripts/build-index.mjs`. The checker fails an index that is missing, stale, or has lost its generated markers, a comment block inside a generated region, and a page the index cannot place. Never edit between the markers.

An area may have a journey page: `docs/designs/<area>/index.html` with `data-design-page="index"`. The designs index lists it as the area's overview, above the screens table, not as a screen. Like any index page it has a `p.ds-meta` line, and the builder also needs its `<meta name="description">`.

## Copied files [copies]

`docs/design-system/docs.css`, `docs-tokens.css`, and `fonts.css` must match the skill's `templates/` apart from line endings, so every project's pages read the same. A project made with an older version of the skill fails this rule after an update; the fix is to copy the three files again, unchanged.

## Open questions [questions]

A `screen` page has a `.design-questions` block near the top. List each unconfirmed guess and each decision still open; say "None open" if so. A client who sees the doubts comments on them. The page is the source: the area README adds options and who decides, and `docs/designs/open-questions.md` holds only questions that cross areas.

## Every value is a token [no-raw-values] [tokens]

- `<style>`, `style=`, and linked stylesheets use `var(--token)` for colours, sizes, and durations. Only files named `*tokens.css` hold raw values. Every named colour and every unit counts, and text in quotes does not. The one exception is the short list under "Nothing hidden", which is literal on purpose.
- SVG paints with `currentColor` or a token.
- Every `var()` resolves to a linked stylesheet.
- `tokens.css` always matches `tokens.json`.
- Stylesheets are local files, so pages work offline and the checker can read them [links].

## Real words

Write the product's real labels and realistic data. Agree the wording with the user, and record shared terms in `docs/designs/wording.md`.

## Erfana limits [limits]

Erfana stops showing or writing comments on a file over 25 MB, a file that is not UTF-8, a file with merge-conflict markers, or a file with more than 500 comment blocks. Split the page long before that.

## Prototypes [prototype]

A prototype is exactly `docs/designs/<area>/prototypes/<file>`; no other folder named `prototypes` is exempt. It shows `<p class="design-prototype">Prototype – not for comments or sign-off</p>` directly in `<body>`, with no other attribute, so a person sees it. Link `docs.css`, which keeps that line on screen. Comment blocks in a prototype stay protected like any others [comments].

## Links

A design page links to its own area's pages, the indexes in its crumbs, and the system pages it cites. An index page may link across areas.
