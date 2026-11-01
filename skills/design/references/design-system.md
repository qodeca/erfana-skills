# Design system

How to create, change, and audit a project's visual system. A system comes from the product and its users, so each project gets its own. Nothing here sets a house style for the designed screens. Documentation pages are different: every project uses the same page look and the same folder division, so a reader always knows where to look.

## Token levels

`tokens.json` is the master, in the [DTCG format](https://www.designtokens.org/). It has three levels, and `scripts/build-tokens.mjs` refuses anything else:

| Level | Holds | Example | May alias |
|---|---|---|---|
| `base` | Raw values, named for what they are | `base.blue.600` | Nothing |
| `semantic` | Meaning, named for the job | `semantic.color.action` | `base` only |
| `component` | One part's values | `component.button.bg` | `semantic` only |

Levels keep a change small: a rebrand edits `base`, a meaning change edits `semantic`, and one part's change edits `component`. The CSS name is the path without its level: `--blue-600`, `--color-action`, `--button-bg`. A theme is a mode on a semantic token, under `$extensions.design.modes`, and builds into `[data-theme="dark"]`. Copy the structure from `templates/tokens.json`, and replace every value.

Build and check:

```bash
node <skill>/scripts/build-tokens.mjs docs/design-system/tokens.json docs/design-system/tokens.css
node <skill>/scripts/build-tokens.mjs docs/design-system/tokens.json docs/design-system/tokens.css --check
```

Run these from the project root; `<skill>` is the skill's base folder. JSON is the master so native apps can consume the same values. Never edit `tokens.css` by hand.

## Create system

1. Finish discovery. Turn the interview into a few design principles a reviewer could disagree with: "dense over airy, because operators scan all day", never "clean and modern".
2. Have `ui-designer` propose the foundations from those principles and the research: colour, type scale, spacing rhythm, surfaces, focus, and motion.
3. Check colour pairs against WCAG 2.2: 4.5:1 for text, and 3:1 for large text and control edges. Check touch sizes against the platform: 24 px minimum on the web, 44 pt on iOS, 48 dp on Android. A failing pair is changed, not excused.
4. Write the tokens, level by level, and build the CSS.
5. Write each component's CSS beside its page, starting from `templates/component.css`, and add one import line per part to `components.css`, which is the library's entry point. Each interactive state appears twice: `.button:hover, .button.is-hover`. Every value is a `var()`. Keep a class the same in the product, so the file ships as it is.
6. A frame has a fixed width, so `@media` never fires for it, while `@container` does. Write layout changes as `@container` rules in the component's CSS, and set `container-type: inline-size` on the product's root class there, because without a container the rules never fire in the real product. Put rules that hide things at a width in `responsive.css`. Breakpoints cannot be tokens: list them in the README.
7. Copy `docs-tokens.css`, `docs.css`, `fonts.css`, and `fonts/` from `templates/` unchanged, with each font's `.license` sidecar, and copy the `LICENSES/OFL-1.1.txt` file from the plugin root into `fonts/`. File-editing tools write text only, so copying the binary `fonts/` folder needs a shell or a small Node script; removing an old file does too. Remove a file only after the user approves that file; in a headless run, remove nothing and name the approval needed. Copy `system-index.html` to `docs/design-system/index.html` and `designs-index.html` to `docs/designs/index.html`.
8. Write the documentation pages from the foundation, component, and pattern templates, as set out in "Folder division" below. Each page decides a rule, shows every state as a drawn frame, names its tokens, and gives a key, result, and focus table. Then run `node <skill>/scripts/build-index.mjs docs`.
9. Write `README.md` with the layout version, how to build, and how a developer adopts the library. Set `VERSION` to `1.0.0`, and start `CHANGELOG.md`. Link the README from the index by hand, outside the generated markers.
10. Run the checker over `docs/design-system/`, and then have `ui-reviewer` and `ux-reviewer` review the pages. Collect every finding first, fix the blocking ones, and report the rest. Then set the pages to "in review".

Start with what the first screens need. Add a component when a design needs it, not in advance.

## Folder division

| Part | Where | Template |
|---|---|---|
| Foundation: colour, type, spacing, focus, motion, and the like | `system/foundations/<name>.html`, flat | `foundation-page.html` |
| Component | `system/components/<name>/`, with `index.html` and its own CSS | `component-page.html`, `component.css` |
| Pattern: components combined into a recurring flow | `system/patterns/<name>/`, with `index.html` and its own CSS | `pattern-page.html`, `component.css` |
| Screen | `docs/designs/<area>/<screen>.html` | `screen-page.html` |

A foundation sits one level above a component page, so its links start `../../` and a component's start `../../../`.

Navigation is only crumbs, index tiles, `#related` links, and inline links. There is no menu, header, footer, or sidebar.

## Page anatomy

Every documentation page has, in this order, `nav.ds-crumbs`, then `<main>` holding the `h1`, the `p.ds-meta` status line, and `p.ds-lede#decision`. The middle uses the sections that apply:

| Section | Holds |
|---|---|
| `#states` | `.ds-frames` for small parts, each a `figure.ds-frame` with a caption saying how it is reached. A frame with a fixed width goes in `.ds-states`, as a `figure.ds-frame.design-state` |
| `#keyboard` | `table.ds-keys`: key, result, and where focus ends |
| `#markup` | `pre.ds-code` |
| `#tokens` | `table.ds-tokens` |
| `#related` | `ul.ds-muted` of links |
| `#exceptions` | Always last: `section#exceptions`, saying "None recorded." if so |

A card's `#related` links to the designs that use it.

A screen page has the same frame, with `.design-questions` after the lede and each state as a `figure.ds-frame.design-state` in `.ds-states`. Its status lives in the rectangle above each frame, not in `p.ds-meta`.

## Indexes

`scripts/build-index.mjs` builds `docs/design-system/index.html` and `docs/designs/index.html` from each page's `h1`, `<meta name="description">`, status, and date. The system index shows tiles by group, and the designs index shows one heading per area, the area's overview if it has a journey page, a table of screens, and a list of design notes. A page with several states shows its least-finished status and its newest date.

The system index ends with two tables, built from the pages:

- **Start here by task.** A foundation, component, or pattern page lists the jobs it answers in its head: `<meta name="design-tasks" content="Add a button; Label a destructive action">`, separated by `;` and written as "I need to…" would finish. Pages that name the same task share a row. A page with no tasks adds no row.
- **Which card owns this token.** The builder reads the first column of each page's `table.ds-tokens` under `#tokens`, so write each name in full, or `--color-*` for the whole family. A family is the first word of a name. Its owner is the page with that wildcard, then a foundation before a component before a pattern, then the page listing the most names.

```bash
node <skill>/scripts/build-index.mjs docs
node <skill>/scripts/build-index.mjs --check docs
```

The builder writes only between the `design:generated` markers. Everything outside them is yours, and stays byte-identical. An index's status is worked out from its pages and never reads ready. If you edit an index outside the markers, update the date inside the status marker by hand; that date is the one generated value you may change.

## Developer-ready means

- A developer can link `tokens.css`, `components.css`, and `responsive.css`, and get the design.
- The real selectors exist: `:hover`, `:focus-visible`, `:disabled`.
- `.is-*` classes are for drawing only, and the README says developers may drop them, so each one has a real selector beside it: `:hover`, `[aria-busy]`, `[disabled]`, and so on.
- Fonts are real: a face named in the tokens ships in `docs/design-system/fonts/` with its licence, or it is a platform font. Fonts stay local, never from a remote address. Otherwise a client judges a fallback.
- Component class names are stable. Renaming one is a major version.
- Native teams read `tokens.json`, which is their contract: `components.css` draws the review pages, and it cannot ship in a native app. The documentation states each component's behaviour for them. For a native product, `tokens.json` uses px (read as pt or sp), never rem; keeps alpha as its own token, because hex alpha order differs across platforms; names platform fonts; and carries component colours and text styles.
- Touch products replace the key table with a gesture and screen-reader table.

## Change system

Versions follow the size of the risk: patch for a value fix with no visible change, minor for an addition, and major for a rename, a removal, or a visible change. Record each change in `CHANGELOG.md`, with what to do on pages that use it. The area README names the system version its pages use, and updating that version is a change to the page.

## Audit system

Report, without fixing:

- Checker problems over `docs/design-system/` and `docs/designs/`, with `--audit` for unused tokens and missing `.is-*` rules.
- Components that lack documentation or a required state.
- Colour pairs below WCAG 2.2 thresholds.
- Areas pinned to an old `VERSION`.
- The same part built twice under different names.

## Why not a shared starter

A shared starter makes every product look alike, and clients notice. The template tokens hold structure only.
