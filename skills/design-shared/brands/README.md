# Brands

Each subdirectory holds one brand's identity, design tokens, and voice / tone in a self-contained, drop-in-replaceable bundle. Discovery is by **convention**: the folder name is the brand id; a folder is a brand iff it contains a `brand.json` matching `brand.schema.json`.

## Layout

```
brands/
├── brand.schema.json           # JSON Schema 2020-12 – contract for brand.json
├── README.md                   # this file
├── ACTIVE_BRAND                # single-line file naming the active brand (default: erfana)
├── erfana/                     # default brand (neutral, logo-only – no photos/shapes/backgrounds/templates/brandbook)
│   ├── brand.json              # required – manifest (Inter + JetBrains Mono; indigo / cyan / ink / paper palette)
│   ├── tokens.tokens.json      # recommended – W3C DTCG 2025.10 design tokens
│   ├── CLAUDE.md               # required – prose Claude entry point (identity, logo basics, when-to-use guidance)
│   ├── voice.md                # long-form voice / tone prose
│   └── logo/INDEX.md           # the single logo SVG
├── example-acme/               # placeholder example showing the pattern
│   └── ...                     # see example-acme/README.md (DO NOT USE IN PRODUCTION). Exempt from CLAUDE.md / INDEX.md checks.
└── _wip-anything/              # OPTIONAL: leading-underscore folders are treated as WIP and skipped by Gate 12
```

## Adding a new brand

1. Create `brands/<brand-id>/` (lowercase, hyphen-separated id, 2–64 chars).
2. Copy `example-acme/brand.json` and edit. Set `"id"` to match the folder name (Gate 12 enforces).
3. Copy or write `tokens.tokens.json`. Wrap content under a top-level `<brand-id>` group (DTCG conformance). Use only the three-tier convention: primitives (raw values), brand semantics (aliases via `{<brand-id>.color.violet}` syntax), components (deferred). Avoid brand-name-leaking semantic tokens – use roles (`color.brand.primary`), not labels (`color-acme-teal`).
4. Add logo files under `logo/`. Reference them from `brand.json` `logos[].src`. SVGs MUST contain no `<script>`, no `<foreignObject>`, no external / data: / javascript: hrefs, and no event-handler attributes (Gate 5 enforces).
5. Write `voice.md` and `illustration.md`, reference them from `voice.guide` and `imagery.illustrationStyle` respectively.
6. Run `bash scripts/run-all-gates.sh`. Gate 12 validates the new brand against the schema and the default `tokensContract` (LSP guarantee – see Token contract section below).
7. **For production brands**: append the new id to `PRODUCTION_BRANDS` in `scripts/gate-12-brand-manifests.sh` in the same PR. Optionally edit `ACTIVE_BRAND` to point at the new brand for a one-off render.

No skill code changes are required to add a brand. The discovery loop globs `brands/*/brand.json`. The only file outside the new folder that ever needs editing is `gate-12-brand-manifests.sh` (allowlist append).

## Optional asset libraries (schema v1.3)

Brands MAY declare additional asset directories via these optional `imagery.*` fields:

- `backgroundLibrary` – directory of brand backgrounds (e.g. gradient PNGs for slide decks).
- `shapeLibrary` – directory of brand shape-vocabulary SVGs (decorative cuts, arrows, quote marks, accent geometry).
- `templateLibrary` – directory of brand templates (e.g. slide masters under `templates/slides/`).
- `logoLibrary` – directory of brand logos (schema v1.3+). Brings the `logo/` folder into the imagery vocabulary so per-library `INDEX.md` and Gate 12 cross-checks treat it uniformly with the other libraries. The top-level `logos[]` array remains the source of truth for tagged variants (light-bg, dark-bg, watermark, favicon) consumed by render scripts; `logoLibrary` is the catalog pointer, not a replacement.

All four follow the same `photoLibrary` pattern: a string path pointing at a directory; consumers list the directory at consumption time. Gate 12 validates each path exists and stays inside the repo.

**Templates are exempt from Gate 5.** SVGs under any path segment named `templates` bypass the script / foreignObject / external-href content rules. Templates are reference material – slide masters, layout sketches – never loaded by `render-video.js`, so the runtime-injection threat model does not apply. Authors review template content out-of-band. This boundary is folder-name based and auditable in PR diffs (see `scripts/run-all-gates.sh` Gate 5).

The default `erfana` brand ships no `templateLibrary`. A brand that declares one points `imagery.templateLibrary` at a directory of slide masters (e.g. `templates/slides/`) and ships an `INDEX.md` cataloguing each master (with a thin `templates/INDEX.md` pointer when the masters live one level deep).

## Per-brand `CLAUDE.md`

Every brand folder under `brands/<id>/` ships a `CLAUDE.md` at its root. This file is the single prose entry point for Claude when designing brand-styled artwork – it carries asset-library catalog pointers, hard caveats, and when-to-use guidance per deliverable type. Sub-skills do NOT reach into brand-specific knowledge directly; they read the active brand's `CLAUDE.md` and follow its pointers from there.

**What goes in `CLAUDE.md`** (see `erfana/CLAUDE.md` for the default worked example):

1. **Brand identity** recap – id, display name, legal entity, sectors, palette hexes, typography, voice attributes, watermark literal. Programmatic values are the manifest's job; this is the human-readable summary Claude needs at a glance.
2. **Asset library catalog** – a table pointing at every `INDEX.md` in the brand bundle (`shapes/INDEX.md`, `photos/INDEX.md`, `backgrounds/INDEX.md`, `logo/INDEX.md`, `templates/<category>/INDEX.md`, etc.) with one-line summaries of what each catalog covers.
3. **When to consult what** – per deliverable type (slide deck / prototype / motion / infographic), which catalogs are relevant and in what order. Lets Claude skip irrelevant libraries (e.g. backgrounds aren't UI-component-scale; skip on prototype tasks).
4. **Hard caveats** – constraints lifted from the per-library `INDEX.md` audits that the manifest cannot express: Polish placeholder strings on slide templates, AI-rendered photos masquerading as documentary, baked-in dark backdrops on group portraits despite transparent corners, brand-white discrepancies between logo SVGs and the surface-token, and so on.
5. **Manifest source-of-truth pointer** – a short paragraph telling Claude that programmatic values (palette tokens, typography roles, voice attributes, library paths) live in `brand.json` and `tokens.tokens.json`; this `CLAUDE.md` is the prose layer, not the structured layer. Do not duplicate hex codes or token names between them.

**Why this convention exists**: brand-specific knowledge belongs in the brand folder, never coupled into sub-skills. Adding a new brand or a new asset library should require zero edits to any `design-*` sub-skill – the bootstrap (`skills/using-erfana/SKILL.md`) tells Claude to read `brands/<active>/CLAUDE.md`, and that file points at everything else. Gate 12 validates that every non-WIP brand has a `CLAUDE.md` at its root and that `CLAUDE.md` cites at least one `INDEX.md` per declared library.

The `example-acme` placeholder brand is exempt from the `CLAUDE.md` and `INDEX.md` checks. WIP brands prefixed with `_` are also skipped.

## Per-library `RULES.md` (v0.4.0+, optional)

Selected libraries MAY ship a `RULES.md` companion next to `INDEX.md`. RULES.md carries brandbook-derived deep prose that governs on-brand use of the library's assets beyond what the catalogue can express:

- `logo/RULES.md` – construction grid, clear space, minimum size, the nine forbidden uses
- `photos/RULES.md` – compositional rules (high contrast / detail-focused / realistic situations) and the depictable subject categories
- `shapes/RULES.md` – the geometric module (e.g. a brand's signature isosceles-triangle angles) and the pattern grammar
- Add more as future brand bundles need them

A library ships a RULES.md only when the brandbook has rules that govern on-brand placement / composition / construction beyond what the asset catalogue already encodes. Libraries without authoritative rules (e.g. backgrounds, templates) ship INDEX.md only.

**Hard architectural invariants** (enforced by Gate 12 in v0.4.0+):

- Every `RULES.md` MUST be cited from its sibling `INDEX.md` (Direction B of the bidirectional check). A backtick-wrapped `RULES.md` reference inside a `### See also` subsection satisfies this.
- Every `RULES.md` MUST be cited from the brand-root `CLAUDE.md` (the new RULES.md ↔ CLAUDE.md symmetry check). A markdown link `[`RULES.md`](./<library>/RULES.md)` satisfies this.

These invariants close the orphan risk where a sub-skill that jumps from `brand.json` straight to a specific `INDEX.md` would otherwise skip the rules layer. The bootstrap (`skills/using-erfana/SKILL.md`) enumerates `<library>/RULES.md` in both its per-file priority list and its read-order line so the discovery chain is unbroken regardless of entry path.

**Authoring convention**:

- Cite the brandbook page numbers and screenshot paths in the file footer so a future reviewer can audit-trail every rule back to its source.
- Inline references to brandbook screenshots use bare backticks (`` `../brandbook/screenshots/<pdf>/page-NNN.png` ``), NOT markdown links – Gate 7 only scans markdown-link syntax, so backtick references are informational and don't fail when the brandbook subfolder is reorganised.
- Sentence case headings, en-dashes, ASCII / Latin Extended only (Polish diacritics OK; CJK forbidden) – inherited from the global style rules.

## Per-library `INDEX.md`

Every `imagery.*Library` directory and the `logo/` folder ships an `INDEX.md` at its root. The catalog format is a markdown table with three columns: `File | What's on it | When to use`. Subfolders one level deep MAY ship their own leaf catalog (e.g. `templates/slides/INDEX.md` while `templates/INDEX.md` is a thin pointer). Gate 12 validates both root and one-level-deep INDEX.md files.

**Required structure**:

- Top heading: `# <Brand display name> <library> index`.
- Prose intro: one paragraph naming the library size, palette anchors, and any global caveats (e.g. "all SVGs are pure geometry" or "all PNGs ship at HD and 4K resolutions").
- Sectioned tables grouping related files; each table uses the three-column format.
- Footer: `**Version**`, `**Created**`, `**Applies to**` lines for traceability.

**Hard constraints inherited from global style** (per the repo `CLAUDE.md`):

- ZERO CJK characters. Polish diacritics (`ł`, `ń`, `ę`, `ą`, `ó`, `ś`, `ż`, `ź`, `ć`) are allowed as Latin Extended.
- Sentence case for headings, not Title Case.
- En-dashes (–) for breaks in prose, never em-dashes (—).

**Bidirectional cross-checking** is enforced by Gate 12:

- Every backtick-quoted file path in `INDEX.md` must resolve to a real file in the library tree. Catches typos and stale references after asset removal.
- Every non-`INDEX.md` file in the library tree must be mentioned by at least one INDEX.md in the chain. Catches silent drift when a designer adds an asset without updating the catalog.

**Two-reviewer review protocol** (mandatory before merging a new or substantially-modified `INDEX.md`):

1. Author the INDEX.md file by reading every asset and writing a description per row.
2. Spawn TWO independent general-purpose reviewers IN PARALLEL (single message, two tool calls). Each is briefed with the full INDEX.md path plus the asset folder, told to verify each row against the actual asset, and asked for a `File | Verdict (PASS / MINOR / FAIL) | Issue note` table plus a "things I would change" list. **Both reviewers MUST work blind** — do NOT relay one reviewer's findings to the other; complementary independent passes catch more than two correlated passes.
3. Fold consensus corrections back into the file. Where reviewers disagree, verify the disputed claim against the asset **directly** (path data, pixel sample, image render) and choose evidence over majority.
4. Bump the file's `**Version**` line and append an "audited" timestamp to the `**Created**` line.

**Prompt template for each reviewer** (adapt the `[BRACKETED]` slots per audit; both reviewers receive the same template, only the reviewer-number changes):

```
You are reviewer #[N] of two independent reviewers, working blind from reviewer #[OTHER].

Context: [N-line description of the catalog under review, file count, palette anchors,
hard constraints from the global style rules].

Your task — for each [N] [asset] files in `[absolute path to the library]`:

1. Open the [asset] via the Read tool.
2. Form your independent description: [list of attributes to verify – dimensions,
   fill colour, composition, embedded text, AI-rendered flag, transparency, etc].
3. Compare against the matching row in [INDEX.md path]. Flag mismatches.

Specifically scrutinise: [3–5 high-priority items that single-author audits typically miss].

Hard constraint check: zero CJK characters in INDEX.md (Polish diacritics OK).

Output:
- One-paragraph executive verdict (PASS / MINOR / FAIL with N issues).
- A table: `File | Verdict | Issue note`.
- A bulleted "things I would change" list with concrete suggested replacement wording.

Under [400–800] words. Cite specific evidence (path command, embedded text, viewBox value,
pixel sample, rendered-image observation) for each verdict.
```

**Divergence-resolution rule – image rendering trumps source grep**: when reviewers disagree on whether content is present, the reviewer who actually rendered the asset (or sampled the pixels) wins over the reviewer who only inspected the source. A real worked case: a template `INDEX.md` backfill where one reviewer ran `qlmanage` over each SVG and saw rasterized text inside `<image>` blocks, while the other only ran `grep` over the SVG source and reported "no text exists". The SVGs used `<image href="data:image/png;base64,…">` rasters with zero `<text>` elements, so source-grep was structurally blind. The image-rendering reviewer was correct. The lesson: when an SVG embeds rasterized text, grep cannot see it – render before you trust a "not present" verdict.

The protocol exists because asset `INDEX.md` files authored without it have surfaced material errors – topology mismatches, mis-located gradient warm-spots, baked-in vs transparent background confusions, AI-rendered photo flags missed in the first pass. Single-author INDEX.md files are not trustworthy enough to ship without the second pair of eyes.

## Active brand

The active brand id is declared in the single-line file `ACTIVE_BRAND` (sibling of this README). Default content is `erfana`. The value MUST name a real folder under `brands/` and MUST be on the production-brand allowlist enforced by Gate 12.

**Resolution model** – sub-skills read `voice.watermark` (and other brand fields) from `brands/<active-brand-id>/brand.json` **at the moment they generate HTML**, NOT at MP4 / GIF render time. `scripts/render-video.js` is a Playwright capture pipeline and does not resolve the manifest itself; whatever the generated HTML displays is what the recording captures. This means the active-brand value is consumed by Claude at skill-execution time, not by Node at export time.

**To switch active brand for a one-off render** – edit `ACTIVE_BRAND`, generate the HTML via the relevant `erfana:design-*` sub-skill, export, then revert `ACTIVE_BRAND`. A runtime `BRAND=<id>` env-var resolver inside `render-video.js` is **deferred to v2.4** when a real second production brand exists; the v2.3.x layer is intentionally a static-pointer model so the abstraction is provable without runtime plumbing.

**Production-brand allowlist** – Gate 12 enforces that `ACTIVE_BRAND` names a brand on the `PRODUCTION_BRANDS` list (currently `["erfana"]`). The `example-acme` placeholder brand is intentionally excluded so it cannot accidentally be the active brand. When a real second brand lands, add its id to the list in `scripts/gate-12-brand-manifests.sh` in the same PR that introduces the brand folder.

## Token contract

Each brand's `brand.json` may declare a `tokensContract` mapping required token paths to expected `$type`s. When omitted, the **default contract** applies:

| Required path | Expected `$type` |
|---|---|
| `<brand-id>.color.brand.primary` | `color` |
| `<brand-id>.color.brand.accent` | `color` |
| `<brand-id>.color.brand.surface-dark` | `color` |
| `<brand-id>.color.brand.text-light` | `color` |
| `<brand-id>.typography.fontFamily.primary` | `fontFamily` |
| `<brand-id>.typography.fontFamily.display` | `fontFamily` |
| `<brand-id>.typography.fontFamily.mono` | `fontFamily` |

Gate 12 verifies every contract entry resolves to a token of the declared type. This makes the LSP-substitutability guarantee explicit: every brand exposes the same semantic role names, so consumers can swap brands at runtime without breaking. A brand with non-standard requirements may declare its own `tokensContract` (the schema accepts any path → `$type` mapping); doing so is an explicit production-readiness decision and surfaces in PR review.

## Validation

`scripts/gate-12-brand-manifests.sh` (invoked by `scripts/run-all-gates.sh`) enforces:

- **Schema validation** via the stdlib-only `scripts/_lib/json_schema_lite.py` validator. Every `brand.json` must parse and conform to `brand.schema.json` (required fields, type checks, `additionalProperties: false` on `voice` and `imagery` so typos like `voice.watermak` fail).
- **`id` equals folder basename** for every manifest.
- **Path-traversal guard**: every relative path in the manifest (`tokens`, `logos[].src`, `voice.guide`, `imagery.photoLibrary`, `imagery.illustrationStyle`) is resolved via `realpath` and asserted to lie inside the repo root. Absolute paths and escaping `../` are rejected without ever leaking the resolved path to CI logs.
- **Tokens DTCG invariants**: when `tokens` is set, the tokens file parses, every leaf token has `$value`, and every `{alias.path}` reference resolves to a token (not a group). Walk recurses into composite `$value`s (gradients, shadows, typography composites, arrays) so aliases inside DTCG composites are also validated.
- **`tokensContract` enforcement**: see Token contract section above. Every contract entry must resolve to a token whose effective `$type` (resolved via DTCG inheritance) matches the declared type.
- **`ACTIVE_BRAND` + production allowlist**: `ACTIVE_BRAND` must name a brand on `PRODUCTION_BRANDS` and that brand's folder must exist. `example-acme` is intentionally absent so it cannot become the active brand.
- **CLAUDE.md ↔ INDEX.md symmetry**: the brand-root `CLAUDE.md` cites at least one INDEX.md per declared library; every INDEX.md cite resolves; every non-INDEX.md file in a library tree (including any RULES.md) is cited.
- **CLAUDE.md ↔ RULES.md symmetry (v0.4.0+)**: every `RULES.md` discovered inside any library directory is also cited from the brand-root `CLAUDE.md` via substring match on its relative path. Closes the orphan risk where RULES.md exists but is invisible to sub-skills traversing from `brand.json` via `INDEX.md` only.

**Gate 13 – brandbook hex coverage (soft, v0.4.0+)**: `scripts/check-brandbook-hex.sh` loads `scripts/_lib/brandbook-hex-inventory.json` (single source of truth keyed by brand id and brandbook page reference) and greps every listed hex against the named tokens file. Catches transcription typos that schema validation cannot see. Currently soft (non-blocking); promotion to hard is tracked in `ROADMAP.md` v2.3.2.

WIP brands can be staged in `_<brand-id>/` (leading underscore) – the gate skips them.
