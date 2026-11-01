# Design system

How to create, change, and audit a project's visual system. A system comes from the product and its users, so each project gets its own. Nothing here sets a house style.

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
5. Write `components.css`. Each interactive state appears twice: `.button:hover, .button.is-hover`. Every value is a `var()`. Keep a class the same in the product, so the file ships as it is.
6. A frame has a fixed width, so `@media` never fires for it, while `@container` does. Write layout changes as `@container` rules in `components.css`, and set `container-type: inline-size` on the product's root class in that file, because without a container the rules never fire in the real product. Put rules that hide things at a width in `responsive.css`. Breakpoints cannot be tokens: list them in the README.
7. Copy `docs-tokens.css` and `docs.css` from `templates/` unchanged.
8. Write the documentation pages from `templates/doc-page.html`: one page per component and pattern. A small system may keep its foundations on one page. Each page decides a rule, shows every state as a drawn frame, names its tokens, and gives a key, result, and focus table. Index pages use the same template with `data-design-page="index"` and a table of links.
9. Write `README.md` with the layout version, how to build, and how a developer adopts the library. Set `VERSION` to `1.0.0`, and start `CHANGELOG.md`.
10. Run the checker over `docs/design-system/`, and then have `ui-reviewer` and `ux-reviewer` review the pages. Collect every finding first, fix the blocking ones, and report the rest. Then set the pages to "in review".

Start with what the first screens need. Add a component when a design needs it, not in advance.

## Developer-ready means

- A developer can link `tokens.css`, `components.css`, and `responsive.css`, and get the design.
- The real selectors exist: `:hover`, `:focus-visible`, `:disabled`.
- `.is-*` classes are for drawing only, and the README says developers may drop them, so each one has a real selector beside it: `:hover`, `[aria-busy]`, `[disabled]`, and so on.
- Fonts are real: a face named in the tokens ships in `docs/design-system/fonts/` with its licence, or it is a platform font. Otherwise a client judges a fallback.
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
