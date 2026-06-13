# Slide Decks: HTML slide deck production spec

Slide decks are a high-frequency design task. This document covers how to do them well – from architecture choice and per-page design through to the full path for PDF / PPTX export.

**What this skill can produce**:
- **HTML presentation version (the base artifact, always done by default)** -> one HTML per slide + an `assets/deck_index.html` aggregator, keyboard navigation in the browser, fullscreen presenting
- HTML -> PDF export -> `scripts/export_deck_pdf.mjs` / `scripts/export_deck_stage_pdf.mjs`
- HTML -> editable PPTX export -> `references/editable-pptx.md` + `scripts/html2pptx.js` + `scripts/export_deck_pptx.mjs` (requires the HTML to be written under 4 hard constraints)

> **⚠️ HTML is the base; PDF/PPTX are derivatives.** Whatever the final delivery format, you **must** first build the HTML aggregator presentation (`index.html` + `slides/*.html`) – it is the "source" of the deck. PDF/PPTX are one-line snapshots exported from the HTML.
>
> **Why HTML first**:
> - Best for live presenting (projector / screen share goes fullscreen, keyboard navigation, no dependency on Keynote / PPT)
> - During development each page can be opened in the browser by double-clicking, no need to re-run the export
> - It is the only upstream for PDF / PPTX export (avoids the "exported, then realized HTML needs changing, re-export" loop)
> - The deliverable can be "HTML + PDF" or "HTML + PPTX" – the recipient picks whichever they prefer
>
> 2026-04-22 moxt brochure proof: after finishing 13 pages of HTML + an index.html aggregator, `export_deck_pdf.mjs` produced the PDF in one line with zero changes. The HTML version itself is a deliverable that presents directly in the browser.

---

## ✅ Pre-flight checklist (do these BEFORE writing any slide HTML)

These five items, checked up front, prevent ~80% of mid-build rework. Run through them every time:

1. [ ] **Delivery format decided?** HTML-only / +PDF / +editable PPTX. PPTX requires the 4 hard constraints from line 1 – see `editable-pptx.md`.
2. [ ] **Architecture decided?** Single-file `<deck-stage>` (≤10 pages with shared state) vs multi-file aggregator (default; required for parallel agent work). See "Lock the architecture first" section below for the side-by-side comparison and decision tree.
3. [ ] **Built 2 maximally different showcase pages?** Cover + densest content page is the standard pair. One showcase isn't enough – overflow, font-legibility, and empty-space failures only surface on the dense page. See "Before bulk production" section below for why.
4. [ ] **Stated the design system out loud and received user confirmation?** Palette, type scale, grid, component vocabulary. Don't start production before the user has said "yes".
5. [ ] **20 px hard floor confirmed?** No text element renders below 20 px – kickers, footers, page numbers, side-index, metric meta-labels, table cells, axis labels, and inline Material Symbol glyphs all sit at 20 px or larger. Slides are read from 8–10m; <20 px caption text is invisible from the third row. (See § Scale for the supersession of the older 14/15/16 px sub-floors.)

---

## 🛑 Confirm delivery format before starting (the hardest checkpoint)

**This decision comes before "single-file or multi-file".** Real test on the 2026-04-20 stock-options board project: **not confirming the format up front = 2-3 hours of rework.**

### Decision tree (HTML-first architecture)

Every deliverable starts from the same HTML aggregator (`index.html` + `slides/*.html`). The format choice only determines **how the HTML is written** and **which export command runs**:

```
[Always default · mandatory] HTML aggregator presentation (index.html + slides/*.html)
   │
   ├── Just want to present in the browser / archive locally     -> done here, max visual freedom
   │
   ├── Also want PDF (print / share / archive)                   -> run export_deck_pdf.mjs once
   │                                                                HTML is unconstrained, no visual restrictions
   │
   └── Also want editable PPTX (a colleague will edit text)      -> from line 1 of HTML, follow the 4 hard constraints
                                                                    run export_deck_pptx.mjs once
                                                                    sacrifices gradients / web components / complex SVG
```

### Kickoff script (copy-paste)

> Whatever the final delivery is – HTML, PDF, or PPTX – I will first build an HTML aggregator that you can switch between and present in the browser (`index.html` with keyboard navigation). That is the always-default base artifact. On top of it I will then ask whether you also want a PDF / PPTX snapshot.
>
> Which export format do you need?
> - **HTML only** (presenting / archiving) -> visuals are entirely unconstrained
> - **Also PDF** -> same as above, plus one export command
> - **Also editable PPTX** (a colleague will edit text in PPT) -> from line 1 of the HTML I must follow 4 hard constraints, which sacrifices some visual capabilities (no gradients, no web components, no complex SVG).

### Why "wanting PPTX means following the 4 hard constraints from the start"

Editable PPTX is only possible because `html2pptx.js` translates the DOM, element by element, into PowerPoint objects. It needs **4 hard constraints**:

1. body fixed at 960pt x 540pt (matches `LAYOUT_WIDE`, 13.333" x 7.5", not 1920x1080 px)
2. All text wrapped in `<p>` / `<h1>`-`<h6>` (no text directly inside a div, no `<span>` carrying the main text)
3. `<p>` / `<h*>` themselves cannot have background / border / shadow (put those on a wrapping div)
4. `<div>` cannot use `background-image` (use an `<img>` tag)
5. No CSS gradients, no web components, no decorative complex SVGs

**This skill defaults to high HTML visual freedom** – lots of spans, nested flex, complex SVGs, web components (such as `<deck-stage>`), CSS gradients – **almost none of which naturally pass html2pptx's constraints** (in practice, visual-driven HTML run through html2pptx unmodified passes < 30%).

### Cost comparison of two real paths (2026-04-20 real incident)

| Path | What you do | Result | Cost |
|------|-------------|--------|------|
| ❌ **Free-write HTML first, retrofit PPTX later** | single-file deck-stage + heavy SVG / span ornament | To get editable PPTX you have only two options:<br>A. Hand-write hundreds of lines of pptxgenjs with hardcoded coords<br>B. Rewrite all 17 pages of HTML in Path A format | 2-3 hours of rework, and the hand-written version has **permanent maintenance debt** (any HTML text change must be re-synced manually to PPTX) |
| ✅ **Follow Path A constraints from step 1** | one HTML per slide + 4 hard constraints + 960x540 pt | One command exports a 100% editable PPTX, and the HTML presents fullscreen in the browser (Path A HTML is standard browser-presentable HTML) | An extra 5 minutes per page thinking "how do I wrap this text in `<p>`", zero rework |

### What about mixed deliverables

User says "I want HTML presentation **and** editable PPTX" – **this is not mixed**, this is the PPTX requirement subsuming the HTML one. Path A HTML is itself browser-presentable fullscreen (just add a `deck_index.html` aggregator). **No extra cost.**

User says "I want PPTX **and** animations / web components" – **this is a real conflict**. Tell the user: editable PPTX requires sacrificing those visual capabilities. Make them choose; do not silently go with a hand-written pptxgenjs solution (it becomes permanent maintenance debt).

### What if PPTX is requested only after the fact (emergency rescue)

Rare case: HTML is already written and only then you find out PPTX is needed. Use the **fallback flow** (full description at the end of `references/editable-pptx.md`, "Fallback: existing visual deliverable but user insists on editable PPTX"):

1. **First choice: produce a PDF** (visuals 100% preserved, cross-platform, recipient can read and print) – if the recipient's actual need is "present / archive", PDF is the best deliverable
2. **Second choice: AI uses the visual draft as a blueprint and rewrites an editable HTML version** -> export editable PPTX – preserves color / layout / copy decisions, sacrifices gradients, web components, complex SVGs
3. **Not recommended: hand-rewrite via pptxgenjs** – positions, fonts, alignments must all be hand-tuned, maintenance cost is high, and any HTML text change has to be re-synced manually each time

Always present the choice to the user; let them decide. **Never make hand-written pptxgenjs your reflex first move** – it is the last-resort fallback.

---

## 🛑 Before bulk production: build a 2-page showcase to lock the grammar

**Whenever the deck is >= 5 pages, you must not write straight from page 1 to the end.** Verified on the 2026-04-22 moxt brochure, the correct order is:

1. Pick **the 2 page types with the largest visual difference** and build them as the showcase (e.g., "cover" + "emotion / quote page", or "cover" + "product showcase page")
2. Screenshot them and have the user confirm the grammar (masthead / type / color / spacing / structure / Chinese-English ratio)
3. Once the direction is approved, batch-produce the remaining N-2 pages, reusing the established grammar
4. After everything is finished, assemble the HTML aggregator + PDF / PPTX derivatives together

**Why**: writing 13 pages straight through and hearing "the direction is wrong" = 13 pages of rework. Doing 2 pages first as a showcase = 2 pages of rework. Once visual grammar is locked, subsequent decisions on the N pages narrow drastically – only "how do I fit the content in" remains.

**Showcase page selection rule**: pick the two pages with the most different visual structures. If those two pass, the in-between cases all pass.

| Deck type | Recommended showcase combo |
|-----------|----------------------------|
| B2B brochure / product launch | Cover + content page (philosophy / emotion page) |
| Brand launch | Cover + product feature page |
| Data report | Big-data page + analysis / conclusion page |
| Course material | Chapter cover + concrete knowledge-point page |

---

## 📐 Publication-style grammar template (proven reusable on moxt)

Suitable for B2B brochures / product launches / long-form reports. Reusing this skeleton across pages = 13 visually consistent pages, zero rework.

### Per-page skeleton

```
┌─ masthead (top strip + horizontal line) ────────┐
│  [logo 22-28px] · A Product Brochure                Issue · Date · URL │
├──────────────────────────────────────────┤
│                                          │
│  ── kicker (green short bar + sentence-case label) │
│  CHAPTER XX · SECTION NAME                 │
│                                          │
│  H1 (Chinese Noto Serif SC 900)             │
│  Key word in brand primary color          │
│                                          │
│  English subtitle (Lora italic, subhead)  │
│  ─────────── divider ─────────            │
│                                          │
│  [actual content: 60/40 two-column / 2x2 grid / list] │
│                                          │
├──────────────────────────────────────────┤
│ section name                     XX / total │
└──────────────────────────────────────────┘
```

### Style conventions (copy-paste)

- **H1**: Chinese Noto Serif SC 900, 80-140 px depending on info density, key word in brand primary color (do not color the whole line)
- **English subtitle**: Lora italic 26-46 px, brand signature term (e.g., "AI team") in bold + primary-color italic
- **Body**: Noto Serif SC 17-21 px, line-height 1.75-1.85
- **Accent highlights**: bold + primary color on key words inside body, no more than 3 per page (more than that and the accents lose their anchor function)
- **Background**: warm rice #FAFAFA + a faint radial-gradient noise (`rgba(33,33,33,0.015)`) for paper texture

### The visual lead must vary across pages

13 pages all "text + a screenshot" is too monotone. **Rotate the visual lead type per page**:

| Visual type | Suitable section |
|-------------|------------------|
| Cover layout (big type + masthead + pillar) | Front page / chapter cover |
| Single-character portrait (oversized single momo, etc.) | Introducing one concept / character |
| Multi-character group / avatar cards in a row | Team / user case |
| Timeline cards stepping forward | Showing "long-term relationship", "evolution" |
| Knowledge graph / connected node diagram | Showing "collaboration", "flow" |
| Before/After comparison cards + arrow between | Showing "change", "difference" |
| Product UI screenshot + outlined device frame | Showcasing a specific feature |
| Big-quote (half-page large type) | Emotion / problem / quote page |
| Real-person avatar + quote card (2x2 or 1x4) | User testimonials / use cases |
| Big-type back cover + URL pill button | CTA / closing |

---

## ⚠️ Common pitfalls (moxt postmortem)

### 1. Emoji do not render in Chromium / Playwright export

Chromium does not include color emoji fonts by default. During `page.pdf()` or `page.screenshot()`, emoji render as empty boxes.

**Workaround**: use Unicode glyphs (`✦` `✓` `✕` `→` `·` `–`) instead, or rewrite to plain text ("Email · 23" instead of "📧 23 emails").

### 2. `export_deck_pdf.mjs` errors with `Cannot find package 'playwright'`

Cause: ESM module resolution walks up from the script's location looking for `node_modules`. The script lives in `~/.claude/skills/erfana/scripts/`, which has no dependencies.

**Workaround**: copy the script into the deck project directory (e.g., `brochure/build-pdf.mjs`), run `npm install playwright pdf-lib` at the project root, then `node build-pdf.mjs --slides slides --out output/deck.pdf`.

### 3. Google Fonts not finished loading before screenshot -> Chinese renders in the system default Heiti

Wait at least `wait-for-timeout=3500` before screenshot / PDF so webfonts download and paint. Or self-host fonts under `shared/fonts/` to remove the network dependency.

### 4. Information-density imbalance: content pages stuffed with too much

The first version of the moxt philosophy page used 2x2 = 4 sections + 3 tenets at the bottom = 7 blocks of content – cramped and repetitive. Reducing to 1x3 = 3 sections immediately restored breathing room.

**Workaround**: keep each page to "1 core message + 3-4 supporting points + 1 visual lead"; spill anything more onto a new page. **Less is more** – the audience spends 10 seconds per page; 1 memory point lands more than 4.

### 5. Common export-pipeline pitfalls (`html2pptx` + `export_deck_pdf.mjs` flattening)

When a slide ships through the deck's PPTX or PDF exporter, three CSS techniques are known to lose fidelity vs. the live HTML render. Each one looks fine in the browser and in the chrome-devtools screenshot, but degrades or disappears once flattened by `html2pptx`. Pre-bake them to raster (PNG) or vector (SVG) assets before relying on them.

| Technique | Failure mode | Recommended workaround |
|-----------|--------------|------------------------|
| `box-decoration-break: clone` on a multi-line inline `<span>` (e.g. marker-pen highlight that wraps across lines) | The wrapping highlight collapses into a single rectangle behind the first line, or disappears entirely. Italic / weight on the inline element usually survives, but the band geometry does not. | If the highlight must span multiple lines, force the wrap manually with `<br>`-separated highlighted spans; or pre-bake the highlighted phrase as an inline SVG. Single-line highlights (one inline `<span>` on one visual line) are safe. |
| Layered CSS `radial-gradient(...)` with multiple stops, especially when stacked via comma-separated `background:` (e.g. `radial-gradient(ellipse 700px at 25% 95%, var(--qd-lime), transparent 70%), radial-gradient(ellipse 1600px at 0% 30%, var(--qd-violet), transparent 80%), var(--qd-black)`) | Rasterised at low fidelity, or replaced with a single PowerPoint gradient fill that supports only two stops in one axis. Multi-bloom compositions collapse to a flat colour or a simple linear ramp. | Capture the rendered bg as a PNG (use `mcp__chrome-devtools__emulate viewport=1920x1080x{1\|2}` + `take_screenshot(filePath=...)` with foreground hidden) and consume it via `<img src="../assets/backgrounds/...">` instead of inline CSS. The captured PNG round-trips through `html2pptx` cleanly. |
| Compound `transform: scaleX(-1) rotate(Ndeg) scale(K)` on background-positioned elements (typical recipe for "rotate / mirror / cover the canvas with `overflow: hidden`") | The transform chain is dropped or reduced; the element renders at its un-transformed orientation, or with only the last term applied. `transform-origin` is also frequently lost. | Bake the transform into the asset itself: capture the transformed bg as a PNG (the asset will have the orientation pre-applied). If you need the un-transformed source for downstream re-orientation, capture **both** versions and keep the source PNG alongside the rendered one. |

**General rule**: if an effect cannot be reproduced inside a single PowerPoint shape with a single fill (solid / gradient with ≤2 stops / picture / pattern), it will not survive `html2pptx`. The slide-decks-skill workflow's step 5b per-slide review SHOULD include an export round-trip for any slide that uses the techniques above; if the round-trip degrades, fall back to the pre-baked asset path.

---

## 🛑 Lock the architecture first: single file or multi-file?

**This is the first decision when building a deck. Get it wrong and you stumble repeatedly. Read this section before starting.**

### Side-by-side comparison

| Dimension | Single file + `deck_stage.js` | **Multi-file + `deck_index.html` aggregator** |
|-----------|-------------------------------|------------------------------------------------|
| Code structure | One HTML, every slide is a `<section>` | One HTML per slide, `index.html` aggregates via iframe |
| CSS scope | ❌ Global – one page's styles can affect all | ✅ Naturally isolated, each iframe is its own world |
| Verification granularity | ❌ Need JS goTo to switch to a page | ✅ Each slide file opens by double-click in the browser |
| Parallel development | ❌ One file, multiple agents conflict | ✅ Multiple agents can work on different pages, zero merge conflicts |
| Debugging difficulty | ❌ One CSS slip and the whole deck breaks | ✅ A broken page only affects itself |
| Embedded interaction | ✅ Sharing state across pages is simple | 🟡 Requires postMessage between iframes |
| Print to PDF | ✅ Built in | ✅ Aggregator's beforeprint walks through iframes |
| Keyboard navigation | ✅ Built in | ✅ Built into the aggregator |

### Which one? (decision tree)

```
│ Q: how many slides do you expect?
├── ≤ 10 pages, in-deck animations or cross-page interaction needed, pitch deck -> single file
└── ≥ 10 pages, lecture, course material, long deck, parallel agents -> multi-file (recommended)
```

**Default to the multi-file path.** It is not "the alternative" – it is the **main path for long decks and team collaboration**. Reason: every advantage of single-file (keyboard navigation, print, scale) is also covered by multi-file, while the scope isolation and verifiability of multi-file cannot be patched back into single-file.

### Why is this rule so hard? (real incident log)

Single-file architecture stumbled four times during the AI psychology lecture deck:

1. **CSS specificity overrides**: `.emotion-slide { display: grid }` (specificity 10) defeated `deck-stage > section { display: none }` (specificity 2), so all pages rendered overlaid simultaneously.
2. **Shadow DOM slot rules suppressed by outer CSS**: `::slotted(section) { display: none }` could not hold against an outer-rule override, so sections refused to hide.
3. **localStorage + hash navigation race**: after refresh, the page jumped not to the hash position but to the last localStorage-recorded position.
4. **High verification cost**: had to `page.evaluate(d => d.goTo(n))` to screenshot a specific page, twice as slow as `goto(file://.../slides/05-X.html)`, and frequently errored.

The root cause in every case is **a single global namespace** – the multi-file architecture eliminates these problems at the physical level.

---

## Path A (default): multi-file architecture

### Directory structure

```
MyDeck/
├── index.html              # copied from assets/deck_index.html, edit MANIFEST
├── shared/
│   ├── tokens.css          # shared design tokens (palette / type sizes / common chrome)
│   └── fonts.html          # <link> to Google Fonts (each page includes it)
├── slides/
│   ├── 01-cover.html       # each file is a complete 1920x1080 HTML
│   ├── 02-agenda.html
│   ├── 03-problem.html
│   └── ...
└── assets/                 # MANDATORY - per-deck local copy of every brand asset used
    ├── logo/               # cp from <brand-bundle>/logo/
    ├── backgrounds/        # cp the gradient PNGs the deck actually uses
    ├── photos/<sector>/    # cp only the photos the deck references
    └── shapes/             # cp the SVGs the deck references (or inline them)
```

### Per-deck `assets/` folder is mandatory

**design-slides MUST copy every brand asset it uses into the deck's own `assets/` folder.** Slide HTML and CSS reference `../assets/...` exclusively – never the source brand-bundle path (e.g. `../../skills/design-shared/brands/<brand-id>/...`). The deck must remain portable when zipped, opened on another machine, or detached from the plugin tree. The copy step happens during slide 1 setup, not as an afterthought; if a slide later needs a new asset, copy it into `assets/` at that point rather than reaching back into the bundle.

### Per-slide template skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>P05 · Chapter Title</title>
<link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
<link rel="stylesheet" href="../shared/tokens.css">
<style>
  /* Styles unique to this page. Any class name is safe – it cannot pollute other pages. */
  .my-thing { ... }
</style>
</head>
<body>
  <header class="masthead">...</header>
  <main class="body">
    <div class="zone zone-top">
      <div class="kicker">...</div>
      <h1 class="headline">...</h1>
      <p class="deck">...</p>
    </div>
    <div class="zone zone-mid">
      <!-- main content: metrics, cards, timeline, etc. -->
    </div>
    <div class="zone zone-bot">
      <!-- optional: closing line, summary prose -->
    </div>
  </main>
  <footer class="footer">...</footer>
</body>
</html>
```

**Key constraints**:
- `<body>` is the 1920x1080 canvas – its width/height are locked in `shared/tokens.css`.
- Use `<main class="body">` as the content region; tag-qualify selectors (`main.body`) so paragraph classes don't collide – see the class-name collision warning immediately below.
- Wrap content in **3 zones** (`zone-top` / `zone-mid` / `zone-bot`) so the slide fills the canvas evenly. The zone scaffold is provided in `shared/tokens.css` (see "Vertical distribution: 3-zone flex column" below).
- Pull in `shared/tokens.css` for shared design tokens (palette, type, page-header/footer, zone scaffold).
- Each page writes its own font `<link>` (importing fonts is cheap and keeps each page independently openable).

### ⚠️ Class-name collision warning (read once, save 30 minutes later)

Don't reuse `.body` (or any other short, generic word) as both the layout container class and an inner content class. The shared `tokens.css` is included in every iframe; any rule like:

```css
.body { display: grid; grid-template-columns: repeat(12, 1fr); }
```

will also match `<p class="body">` and `<div class="body">` inside your card components – crushing the paragraph into a 12-column grid with 8px-wide tracks. The visible symptom is text wrapping at 1–2 characters per line, which looks like a flex/grid sizing bug, not a selector collision.

**Fix**: tag-qualify (`main.body { ... }`) or use a namespaced class (`.slide-canvas`, `.deck-body`). The same caution applies to `.card`, `.title`, `.body`, `.header`, `.content` – generic single-word class names in shared CSS leak into per-slide content.

### Vertical distribution: 3-zone flex column (mandatory for content slides)

Without a vertical distribution pattern, content slides cluster at the top and leave 100–170px of dead space at the bottom – even when the agent thinks the slide "fits" because nothing overflows.

**Minimal HTML wrapper** (this is what the per-slide template skeleton above puts inside `<main class="body">`):

```html
<main class="body">
  <div class="zone zone-top"> <!-- kicker + headline + deck --> </div>
  <div class="zone zone-mid"> <!-- metrics / cards / timeline / etc. --> </div>
  <div class="zone zone-bot"> <!-- optional: summary prose, footnote --> </div>
</main>
```

**The CSS** (lives in `shared/tokens.css`):

```css
main.body {
  display: flex;
  flex-direction: column;
  padding-top: 60px;
  padding-bottom: 56px;
}
main.body > .zone {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  column-gap: 24px;
}
main.body > .zone-top { align-content: start; }
main.body > .zone-mid { flex: 1; min-height: 0; align-content: center; }
main.body > .zone-bot { /* auto-sized; pinned to bottom by zone-mid's flex: 1 */ }
```

**How the zones distribute**:
- **`zone-top`** auto-sizes to its content (kicker + headline + deck) and hugs the masthead.
- **`zone-mid`** takes all remaining vertical space (`flex: 1`) and centers its content. This is where metrics, cards, timelines, lessons live. As content density changes, the breathing room above and below stays equal. `min-height: 0` allows the flex child to shrink below its content size if needed (without it, oversized content can push past the masthead).
- **`zone-bot`** auto-sizes to its content. **The bottom-pinning comes from `zone-mid {flex: 1}` consuming all remaining space** – `zone-bot` itself doesn't need an `align-content` rule; setting one on an auto-sized track is a no-op. Use it for summary prose, footnote rows, status cards.

**Overflow caveat (silent failure mode)**: when `zone-mid` content is taller than the available flex space, `align-content: center` centers the overflow – meaning the top half intrudes upward into `zone-top` / under the masthead, NOT past the footer. The strict slide-fit verification snippet (see `../design-shared/references/verification.md` "Slide-fit verification") catches this only if you walk every element, not just the bottom edge of `main.body`. For content blocks that may exceed budget, also consider adding `overflow: hidden` on `zone-mid` so excess clips invisibly rather than escaping under the masthead.

Each zone is internally a 12-col grid, so `grid-column: 1 / span 12` placements on `.kicker`, `.headline`, `.deck`, `.metrics` etc. continue to work unchanged. Slides with only a top + content section can omit `zone-bot` entirely; slides with only a centered hero (cover, closing) can wrap the title in `zone-mid` alone.

**Anti-pattern**: setting `align-content: start` on a single-grid `main.body` and using magic `margin-top: 64–88px` spacers between content blocks. This always leaves dead space at the bottom and forces per-slide tweaking.

### The aggregator: `deck_index.html`

**Copy directly from `assets/deck_index.html`**. The only thing you change is the `window.DECK_MANIFEST` array – list every slide file in order with a human-readable label:

```js
window.DECK_MANIFEST = [
  { file: "slides/01-cover.html",    label: "Cover" },
  { file: "slides/02-agenda.html",   label: "Agenda" },
  { file: "slides/03-problem.html",  label: "Problem statement" },
  // ...
];
```

The aggregator already includes: keyboard navigation (←/→/Home/End/number keys/P print), scale + letterbox, bottom-right counter, localStorage memory, hash jump, print mode (walks iframes to print one page each).

### Per-page verification (the killer feature of multi-file)

Each slide is its own HTML. **Once you finish one, double-click it in the browser**:

```bash
open slides/05-personas.html
```

Playwright screenshots also `goto(file://.../slides/05-personas.html)` directly – no JS jump required, no interference from other pages' CSS. This brings the "change one thing, verify one thing" loop cost close to zero.

### Parallel development

Split each slide into a separate task and dispatch to different agents in parallel – HTML files are independent, merges have no conflicts. Long decks compress production time to 1/N this way.

### What goes in `shared/tokens.css`

Only **truly cross-page shared** things:

- CSS variables (palette, type scale, spacing scale)
- `body { width: 1920px; height: 1080px; }` and similar canvas locks
- `.page-header` / `.page-footer` chrome that is identical on every page

**Do not** dump per-page layout classes here – that regresses to the single-file architecture's global pollution problem.

### 8 px grid (normative spacing scale)

All paddings, margins, gaps, border-radii, and component dimensions must be multiples of 8 px. The allowed scale is `8 / 16 / 24 / 32 / 40 / 48 / 56 / 64 / 72 / 80 / 96 / 104 / 112`. Two permitted exceptions:

- 1 px hairline borders / dividers.
- 4 px optical-correction half-step ONLY for icon-to-text inline alignment (when an icon's optical centre needs a sub-step nudge to align with adjacent baseline text).

Arbitrary values like `15 px`, `22 px`, `37 px` are forbidden – they read as design noise. Express the scale as CSS custom properties in `tokens.css` and reference them by name:

```css
:root {
  --s-1: 8px;
  --s-2: 16px;
  --s-3: 24px;
  --s-4: 32px;
  --s-5: 40px;
  --s-6: 48px;
  --s-7: 56px;
  --s-8: 64px;
  --s-9: 72px;
  --s-10: 80px;
  --s-12: 96px;
  --s-14: 112px;
}
```

The `column-gap: 24px` already used in the 3-zone scaffold is a multiple of 8 and stays compliant.

---

## Path B (small decks): single file + `deck_stage.js`

For ≤ 10 pages, when state must be shared across slides (e.g., a single React tweaks panel controlling all pages), or for pitch deck demos that demand extreme compactness.

### ⚠️ Path B: same warnings, applied per `<section>`

The Path A warnings above all apply to Path B with one structural translation – `<section>` shells inside `<deck-stage>` replace `<main class="body">`:

- **Class-name collisions still apply.** Shadow DOM does NOT isolate slotted content (`<section>` is light-DOM that gets slotted into the shadow tree). Any `.body { ... }` rule in your outer CSS will still match `<p class="body">` inside a `<section>`. Tag-qualify (`section.active .card`) or namespace.
- **3-zone flex layout applies per-`<section>`, not on `main.body`.** Replace `main.body { display: flex; flex-direction: column }` with `deck-stage > section.active { display: flex; flex-direction: column }` (the `.active` qualifier is mandatory – see "The CSS pitfall of single-file architecture" below). The `.zone-top` / `.zone-mid` / `.zone-bot` children sit inside the `<section>`.
- **Font-size minimums are identical.** The 20 px hard floor (see § Scale) applies regardless of architecture – Path B `<section>` shells inherit the same readable-text floor as Path A `<main class="body">`. The 10m-from-projector reading distance doesn't change.
- **Pre-flight checklist applies identically.** The 5 items run before any HTML is written, regardless of architecture.
- **Path B inner-HTML setter limitation**: `deck_stage.js` currently uses the inner-HTML setter for its shadow-root template. Hook environments that block that setter (XSS-prevention pre-tool-use hooks) will reject the script. If you're working in such an environment, prefer Path A until `deck_stage.js` is ported to safe-DOM construction.

### Basic usage

1. Read the contents of `assets/deck_stage.js` and embed it in the HTML's `<script>` (or `<script src="deck_stage.js">`)
2. Wrap each slide in a `<section>` inside `<deck-stage>`
3. 🛑 **The script tag must be placed after `</deck-stage>`** (see the hard constraint below)

```html
<body>

  <deck-stage>
    <section>
      <h1>Slide 1</h1>
    </section>
    <section>
      <h1>Slide 2</h1>
    </section>
  </deck-stage>

  <!-- ✅ correct: script after deck-stage -->
  <script src="deck_stage.js"></script>

</body>
```

### 🛑 Script position hard constraint (2026-04-20 real incident)

**You cannot put `<script src="deck_stage.js">` in `<head>`.** Even if it defines `customElements` while in `<head>`, the parser will fire `connectedCallback` as soon as it encounters the `<deck-stage>` opening tag – at which point the child `<section>` elements have not been parsed, `_collectSlides()` returns an empty array, the counter shows `1 / 0`, and every page renders overlaid.

**Three compliant forms** (pick one):

```html
<!-- ✅ recommended: script after </deck-stage> -->
</deck-stage>
<script src="deck_stage.js"></script>

<!-- ✅ also fine: script in head with defer -->
<head><script src="deck_stage.js" defer></script></head>

<!-- ✅ also fine: module scripts are deferred by spec -->
<head><script src="deck_stage.js" type="module"></script></head>
```

`deck_stage.js` itself contains a `DOMContentLoaded` deferred-collection defense, so even if the script is in head it will not blow up entirely – but `defer` or placing the script at the end of body is still cleaner and avoids relying on the defense branch.

### ⚠️ The CSS pitfall of single-file architecture (must read)

The most common pitfall in single-file architecture: **the `display` property gets stolen by per-page styles.**

Common mistake 1 (writing `display: flex` directly on section):

```css
/* ❌ external CSS specificity 2 overrides shadow DOM's ::slotted(section){display:none} (also 2) */
deck-stage > section {
  display: flex;            /* every page renders overlaid! */
  flex-direction: column;
  padding: 80px;
  ...
}
```

Common mistake 2 (a higher-specificity class on section):

```css
.emotion-slide { display: grid; }   /* specificity 10, even worse */
```

Either makes **every slide render overlaid simultaneously** – the counter may show `1 / 10` as if it were fine, but visually slide 1 sits on top of slide 2 sits on top of slide 3.

### ✅ Starter CSS (copy-paste at kickoff, no pitfalls)

The **section itself** only manages "visible / invisible"; **layout (flex / grid, etc.) goes on `.active`**:

```css
/* section only defines non-display common styles */
deck-stage > section {
  background: var(--paper);
  padding: 80px 120px;
  overflow: hidden;
  position: relative;
  /* ⚠️ do not set display here! */
}

/* Lock "if not active, hidden" – specificity + weight, double safety */
deck-stage > section:not(.active) {
  display: none !important;
}

/* Only the active page sets the needed display + layout */
deck-stage > section.active {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* Print mode: every page must show, override :not(.active) */
@media print {
  deck-stage > section { display: flex !important; }
  deck-stage > section:not(.active) { display: flex !important; }
}
```

Alternative: **put the per-page flex/grid on an inner wrapper `<div>`**, leave the section forever as a `display: block / none` switch. This is the cleanest pattern:

```html
<deck-stage>
  <section>
    <div class="slide-content flex-layout">...</div>
  </section>
</deck-stage>
```

### Custom dimensions

```html
<deck-stage width="1080" height="1920">
  <!-- 9:16 vertical -->
</deck-stage>
```

---

## Slide labels

Both deck_stage and deck_index assign labels to each slide (shown in the counter). Give them **more meaningful** labels:

**Multi-file**: in `MANIFEST`, write `{ file, label: "04 Problem statement" }`
**Single-file**: on the section, add `<section data-screen-label="04 Problem Statement">`

**Important: slide numbers start from 1, not 0.**

When a user says "slide 5", they mean the fifth slide – never array position `[4]`. Humans do not speak 0-indexed.

---

## Speaker notes

**Default off.** Only add when the user explicitly asks.

With speaker notes you can pare slide text to the minimum and focus on impactful visuals – the notes carry the full script.

### Format

**Multi-file**: in the `<head>` of `index.html`, write:

```html
<script type="application/json" id="speaker-notes">
[
  "Script for slide 1...",
  "Script for slide 2...",
  "..."
]
</script>
```

**Single-file**: same place.

### Notes-writing principles

- **Complete**: not an outline – the actual words you would say
- **Conversational**: like you talk, not written prose
- **Aligned**: array index N corresponds to slide N
- **Length**: 200-400 characters is ideal
- **Emotional shape**: mark stresses, pauses, emphasis points

---

## Slide design patterns

### 1. Build a system (mandatory)

After you have explored the design context, **first say the system out loud**:

```markdown
Deck system:
- Background: at most 2 (90% white + 10% dark section divider)
- Type: display in Instrument Serif, body in Geist Sans
- Rhythm: section dividers full-bleed color + white type, regular slides white background
- Imagery: hero slides full-bleed photo, data slides chart
- Component vocabulary

I will work with this system – flag anything wrong.
```

Wait for confirmation, then proceed.

### 2. Common slide layouts

- **Title slide**: solid background + huge title + subtitle + author / date
- **Section divider**: colored background + section number + section title
- **Content slide**: white background + title + 1-3 bullet points
- **Data slide**: title + large chart / number + short note
- **Image slide**: full-bleed photo + small caption at the bottom
- **Quote slide**: whitespace + huge quote + attribution
- **Two-column**: left/right comparison (vs / before-after / problem-solution)

Use at most 4-5 layouts in a deck.

### 3. Scale (re-emphasized)

**Hard floor: 20 px.** No text element on any slide may render below 20 px – this includes captions, labels, footnotes, table cells, axis labels, kickers, footer chrome, side-index items, metric meta-labels, and Material Symbol glyphs used as inline icons. The 20 px floor applies regardless of which brand is active; it exists because a 1080p slide projected to a 4 m wall makes every <20 px label render below the legibility threshold for human vision past 3 m.

- **Body** minimum 24 px, ideal 28–36 px (well above the floor for normal prose).
- **Title** 60–120 px.
- **Hero type** 180–240 px.
- **All other "small text" categories** – kickers, footers, page numbers, side-index, metric meta-labels – minimum 20 px. The previously-documented sub-floors (14 px / 15 px / 16 px) are SUPERSEDED by this rule. Bump every label, kicker, and footer to 20 px or larger.

A slide is read from 10 meters away – type must be large enough. CSS pixels do not scale with audience distance.

### 4. Visual rhythm

A deck needs **intentional variety**:

- **No text-only slides.** Every content slide must carry at least one non-typographic element: a brand shape, a photo, a background gradient, a Material Symbol icon, a chart, a divider rule, or a structural mockup. A slide that is pure paragraphs + headings reads as a memo / draft / mockup. If you cannot justify a visual element on a slide, the content belongs in speaker notes – not on the slide.
- Color rhythm: mostly white background + occasional colored section divider + occasional dark stretch
- Density rhythm: a few text-heavy + a few image-heavy + a few quote / whitespace
- Type-size rhythm: standard titles + occasional huge hero text

**Do not make every slide look the same** – that is a PPT template, not a design.

### 5. Spatial breathing (mandatory for data-dense pages)

**The most common beginner pitfall**: cramming every available bit of information onto one page.

Information density ≠ effective communication. Lecture / academic decks especially must restrain:

- List / matrix pages: do not draw all N items at the same size. Use **primary / secondary layering** – make the 5 you will discuss today the lead and shrink the remaining 16 to background hints.
- Big-number pages: the number itself is the visual lead. Captions around it should not exceed 3 lines, or the audience's eyes ping-pong.
- Quote pages: leave whitespace between the quote and the attribution; do not glue them together.

Self-check against "is the data really the lead" and "is the text crammed", and adjust until the whitespace makes you slightly anxious.

---

## Print to PDF

**Multi-file**: `deck_index.html` already handles the `beforeprint` event and outputs PDF page-by-page.

**Single-file**: `deck_stage.js` does the same.

Print styles are already written; no extra `@media print` CSS required.

---

## Export to PPTX / PDF (helper scripts)

HTML-first is the first-class citizen, but users frequently need PPTX / PDF deliverables. Two general-purpose scripts work for **any multi-file deck**, located under `scripts/`:

### `export_deck_pdf.mjs` – vector PDF export (multi-file architecture)

```bash
node scripts/export_deck_pdf.mjs --slides <slides-dir> --out deck.pdf
```

**Features**:
- Text **stays vector** (selectable, searchable)
- 100% visual fidelity (Playwright's embedded Chromium renders, then prints)
- **Does not require any HTML edits**
- Each slide gets its own `page.pdf()`, then `pdf-lib` merges them

**Dependencies**: `npm install playwright pdf-lib`

**Limitation**: PDFs cannot be edited as text – go back to HTML to change.

### `export_deck_stage_pdf.mjs` – dedicated for single-file deck-stage architecture ⚠️

**When to use**: the deck is a single HTML file + `<deck-stage>` web component wrapping N `<section>`s (Path B). At that point the "one `page.pdf()` per HTML" approach used by `export_deck_pdf.mjs` does not work and you need this dedicated script.

```bash
node scripts/export_deck_stage_pdf.mjs --html deck.html --out deck.pdf
```

**Why `export_deck_pdf.mjs` cannot be reused** (2026-04-20 real incident log):

1. **Shadow DOM beats `!important`**: deck-stage's shadow CSS includes `::slotted(section) { display: none }` (only the active one is `display: block`). Even using `@media print { deck-stage > section { display: block !important } }` in the light DOM cannot defeat this – once `page.pdf()` triggers print media, Chromium's final render only contains the active slide, so **the entire PDF has 1 page** (a duplicate of whichever was active).

2. **Looping goto still produces 1 page**: the intuitive fix "navigate to each `#slide-N` and call `page.pdf({pageRanges:'1'})`" also fails – even with the print CSS rule `deck-stage > section { display: block }` in the light DOM, the final rendered output is always the first section (not the page you navigated to). Result: 17 loop iterations produce 17 copies of the P01 cover.

3. **Absolute-positioned children leak to the next page**: even if you do force every section to render, when the section itself is `position: static`, its absolutely-positioned `cover-footer`/`slide-footer` are positioned relative to the initial containing block – and when print forces section to 1080 px height, the absolute footer can be pushed onto the next page (manifesting as one extra orphan-footer page in the PDF).

**Fix strategy** (already implemented in the script):

```js
// After opening the HTML, use page.evaluate to lift the sections out of the deck-stage slot
// and attach them directly under a plain div in body, with inline styles ensuring
// position:relative + fixed dimensions
await page.evaluate(() => {
  const stage = document.querySelector('deck-stage');
  const sections = Array.from(stage.querySelectorAll(':scope > section'));
  document.head.appendChild(Object.assign(document.createElement('style'), {
    textContent: `
      @page { size: 1920px 1080px; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; }
      deck-stage { display: none !important; }
    `,
  }));
  const container = document.createElement('div');
  sections.forEach(s => {
    s.style.cssText = 'width:1920px!important;height:1080px!important;display:block!important;position:relative!important;overflow:hidden!important;page-break-after:always!important;break-after:page!important;background:#F7F4EF;margin:0!important;padding:0!important;';
    container.appendChild(s);
  });
  // Disable page-break on the last section to avoid a trailing blank page
  sections[sections.length - 1].style.pageBreakAfter = 'auto';
  sections[sections.length - 1].style.breakAfter = 'auto';
  document.body.appendChild(container);
});

await page.pdf({ width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true });
```

**Why this works**:
- Lifting sections out of the shadow DOM slot into a regular div in light DOM completely bypasses the `::slotted(section) { display: none }` rule
- Inline `position: relative` makes absolute children position relative to the section, so they cannot overflow
- `page-break-after: always` makes the browser print each section on its own page
- `:last-child` skipping the page break avoids a trailing blank page

**A note when verifying with `mdls -name kMDItemNumberOfPages`**: macOS Spotlight metadata is cached; after a PDF rewrite you must run `mdimport file.pdf` to force refresh, otherwise the old page count shows. Use `pdfinfo` or count files with `pdftoppm` for the real number.

---

### `export_deck_pptx.mjs` – export editable PPTX

```bash
# Only mode: text frames natively editable (fonts will fall back to system fonts)
node scripts/export_deck_pptx.mjs --slides <dir> --out deck.pptx
```

How it works: `html2pptx` reads computedStyle element by element and translates the DOM into PowerPoint objects (text frame / shape / picture). Text becomes real text frames – double-click to edit in PPT.

**Hard constraints** (HTML must comply, otherwise that page is skipped – full details in `references/editable-pptx.md`):
- All text must be inside `<p>` / `<h1>`-`<h6>` / `<ul>` / `<ol>` (no bare text in a div)
- `<p>` / `<h*>` themselves cannot have background / border / shadow (put those on a wrapping div)
- Do not use `::before` / `::after` to inject decorative text (pseudo-elements cannot be lifted)
- Inline elements (span / em / strong) cannot have margin
- No CSS gradients (cannot render)
- No `background-image` on a div (use `<img>`)

The script has a **built-in auto preprocessor** – it auto-wraps "bare text inside leaf divs" into `<p>` (preserving class). This handles the most common violation (bare text). Other violations (border on `<p>`, margin on a span, etc.) still require the source HTML to comply.

**Font fallback caveat**:
- Playwright uses webfonts to measure text-box dimensions; PowerPoint / Keynote use local fonts to render
- When they differ you get **overflow or misalignment** – eyeball every page
- Recommended: install the HTML's fonts on the target machine, or fall back to `system-ui`

**Do not take this path for visual-first scenarios** -> use `export_deck_pdf.mjs` for PDF instead. PDF is 100% visually faithful, vector, cross-platform, text-searchable – the true home of visual-first decks, not "the un-editable compromise".

### Make HTML export-friendly from day one

For the most stable deck performance: **write the HTML following the 4 hard editable constraints from line one**. Then `export_deck_pptx.mjs` can pass everything cleanly. The extra cost is small:

```html
<!-- ❌ bad -->
<div class="title">Key finding</div>

<!-- ✅ good (wrapped in p, class inherited) -->
<p class="title">Key finding</p>

<!-- ❌ bad (border on p) -->
<p class="stat" style="border-left: 3px solid red;">41%</p>

<!-- ✅ good (border on the wrapper div) -->
<div class="stat-wrap" style="border-left: 3px solid red;">
  <p class="stat">41%</p>
</div>
```

### When to pick which

| Scenario | Recommended |
|----------|-------------|
| Sharing with the host / archival | **PDF** (universal, high fidelity, searchable text) |
| Sending to a collaborator who will tweak text | **Editable PPTX** (accept font fallback) |
| Live presenting, not editing | **PDF** (vector fidelity, cross-platform) |
| HTML is the primary medium | Just present in the browser; export is only a backup |

## The deep path to editable PPTX (long-term projects only)

If your deck will be maintained long-term, repeatedly edited, and worked on in a team – **write the HTML to html2pptx constraints from the start**. Then `export_deck_pptx.mjs` passes everything cleanly. See `references/editable-pptx.md` (4 hard constraints + HTML template + common-error cheatsheet + fallback flow when there is an existing visual draft).

---

## Common questions

**Multi-file: a page in the iframe will not open / blank**
-> Check that `MANIFEST`'s `file` paths are correct relative to `index.html`. Use the browser DevTools to see if the iframe's src loads directly.

**Multi-file: one page's styles are conflicting with another**
-> Impossible (iframes are isolated). If it feels like a conflict, it is a cache – Cmd+Shift+R to hard-refresh.

**Single-file: multiple slides render overlaid**
-> CSS specificity issue. See "The CSS pitfall of single-file architecture" above.

**Single-file: scaling looks wrong**
-> Check that all slides are direct `<section>` children of `<deck-stage>`. Do not wrap them in a `<div>`.

**Single-file: jump to a specific slide**
-> Add a hash to the URL: `index.html#slide-5` jumps to slide 5.

**Both architectures: text positions inconsistent across screens**
-> Use fixed dimensions (1920x1080) and `px` units; do not use `vw` / `vh` or `%`. Scaling is handled uniformly.

---

## Verification checklist (must pass at deck completion)

1. [ ] Open `index.html` (or the main HTML) in the browser; check the cover has no broken images and fonts have loaded
2. [ ] Press → through every slide; no blank pages, no layout breaks
3. [ ] Press P for print preview; each page is exactly one A4 (or 1920x1080) with no clipping
4. [ ] Pick 3 random pages and Cmd+Shift+R; localStorage memory works correctly
5. [ ] Playwright batch screenshots (multi-page architecture: iterate `slides/*.html`; single-file: switch with goTo); eyeball them all
6. [ ] Search for stray `TODO` / `placeholder`; confirm everything is cleaned up
7. [ ] **Per-slide subagent review** complete (one fresh `general-purpose` subagent per slide, parallel dispatch). Every Fix item applied before declaring done. See `SKILL.md` step 5b.
8. [ ] **Delete every visual-verification screenshot before declaring done.** Verification PNGs follow the `_*.png` naming convention so a glob like `find . -name '_*.png' -delete` is unambiguous and never deletes brand assets (which live in `assets/<sector>/...`). The deliverable folder must contain only `index.html`, `slides/`, `shared/`, `assets/`, and any explicitly requested PDF / PPTX export. See `../design-shared/references/verification.md` § Cleanup.
9. [ ] **Asset isolation check**: `grep -r 'skills/design-shared/brands' .` from the deck root returns zero results. Every asset reference uses `../assets/...` only.
