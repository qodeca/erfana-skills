# Editable PPTX export: HTML hard constraints + sizing decisions + common errors

This document covers the path of using `scripts/html2pptx.js` + `pptxgenjs` to translate HTML element-by-element into truly editable PowerPoint text frames. It is also the only path supported by `export_deck_pptx.mjs`.

> **Core prerequisite**: to take this path, the HTML must be written from line one according to the 4 constraints below. **Not "write first, convert later"** - retroactive fixes will trigger 2-3 hours of rework (verified the hard way on the 2026-04-20 options private board project).
>
> If your scenario prioritizes visual freedom (animations / web components / CSS gradients / complex SVG), switch to the PDF path (`export_deck_pdf.mjs` / `export_deck_stage_pdf.mjs`). **Do not** expect pptx export to give you both visual fidelity and editability - that is a physical constraint of the PPTX file format itself (see "Why the 4 constraints are not bugs but physical constraints" at the end).

---

## Canvas size: use 960x540pt (LAYOUT_WIDE)

PPTX units are **inches** (physical sizing), not px. The decision principle: the body's computedStyle dimensions must **match the inch dimensions of the presentation layout** (+/-0.1", enforced by `validateDimensions` in `html2pptx.js`).

### 3 candidate sizes compared

| HTML body | Physical size | Corresponding PPT layout | When to choose |
|---|---|---|---|
| **`960pt x 540pt`** | **13.333" x 7.5"** | **pptxgenjs `LAYOUT_WIDE`** | v **Default recommendation** (modern PowerPoint 16:9 standard) |
| `720pt x 405pt` | 10" x 5.625" | Custom | Only when the user specifies an "old PowerPoint Widescreen" template |
| `1920px x 1080px` | 20" x 11.25" | Custom | X Non-standard size, fonts look unusually small when projected |

**Don't think of HTML size as resolution.** PPTX is a vector document; the body size determines **physical size**, not sharpness. An oversized body (20"x11.25") will not make text sharper - it just makes the pt size shrink relative to the canvas, and looks worse when projected or printed.

### Three equivalent ways to write body

```css
body { width: 960pt;  height: 540pt; }    /* clearest, recommended */
body { width: 1280px; height: 720px; }    /* equivalent, px convention */
body { width: 13.333in; height: 7.5in; }  /* equivalent, inch intuition */
```

Matching pptxgenjs code:

```js
const pptx = new pptxgen();
pptx.layout = 'LAYOUT_WIDE';  // 13.333 x 7.5 inch, no custom layout needed
```

---

## 4 hard constraints (violations error out immediately)

`html2pptx.js` translates the HTML DOM element-by-element into PowerPoint objects. PowerPoint's format constraints projected onto HTML = the 4 rules below.

### Rule 1: text cannot live directly in a DIV - it must be wrapped in `<p>` or `<h1>`-`<h6>`

```html
<!-- X Wrong: text directly inside a div -->
<div class="title">Q3 revenue grew 23%</div>

<!-- v Correct: text inside <p> or <h1>-<h6> -->
<div class="title"><h1>Q3 revenue grew 23%</h1></div>
<div class="body"><p>New users were the main driver</p></div>
```

**Why**: PowerPoint text must live inside a text frame; text frames correspond to paragraph-level HTML elements (p/h*/li). A bare `<div>` has no corresponding text container in PPTX.

**You also cannot use `<span>` to carry main text** - span is an inline element and cannot be aligned independently as a text frame. span can only **be nested inside p/h\*** for local styling (bold, color shifts).

### Rule 2: CSS gradients are not supported - solid colors only

```css
/* X Wrong */
background: linear-gradient(to right, #FF6B6B, #4ECDC4);

/* v Correct: solid color */
background: #FF6B6B;

/* v If you must have multi-color stripes, use flex children, each with a solid color */
.stripe-bar { display: flex; }
.stripe-bar div { flex: 1; }
.red   { background: #FF6B6B; }
.teal  { background: #4ECDC4; }
```

**Why**: PowerPoint shape fills support only solid/gradient-fill, but pptxgenjs's `fill: { color: ... }` only maps to solid. Going through native PowerPoint gradient requires a different structure that the toolchain currently does not support.

### Rule 3: backgrounds / borders / shadows can only go on DIVs, not on text tags

```html
<!-- X Wrong: <p> has a background color -->
<p style="background: #FFD700; border-radius: 4px;">Key content</p>

<!-- v Correct: outer div carries background/border, <p> only handles text -->
<div style="background: #FFD700; border-radius: 4px; padding: 8pt 12pt;">
  <p>Key content</p>
</div>
```

**Why**: in PowerPoint, shape (rectangle/rounded rectangle) and text frame are two separate objects. HTML's `<p>` only translates to a text frame - background/border/shadow belong to the shape and must be written on the **div wrapping the text**.

### Rule 4: DIVs cannot use `background-image` - use the `<img>` tag

```html
<!-- X Wrong -->
<div style="background-image: url('chart.png')"></div>

<!-- v Correct -->
<img src="chart.png" style="position: absolute; left: 50%; top: 20%; width: 300pt; height: 200pt;" />
```

**Why**: `html2pptx.js` extracts image paths only from `<img>` elements; it does not parse the `background-image` URL in CSS.

---

## Path A HTML template skeleton

Each slide is its own HTML file, scoped independently of the others (avoiding CSS pollution from a single-file deck).

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 960pt; height: 540pt;           /* must match LAYOUT_WIDE */
    font-family: system-ui, -apple-system, "PingFang SC", sans-serif;
    background: #FEFEF9;                    /* solid color, no gradient */
    overflow: hidden;
  }
  /* DIV handles layout/background/border */
  .card {
    position: absolute;
    background: #1A4A8A;                    /* background on DIV */
    border-radius: 4pt;
    padding: 12pt 16pt;
  }
  /* Text tags only handle font styling, no background/border */
  .card h2 { font-size: 24pt; color: #FFFFFF; font-weight: 700; }
  .card p  { font-size: 14pt; color: rgba(255,255,255,0.85); }
</style>
</head>
<body>

  <!-- Title block: outer div positions, inner text tags carry text -->
  <div style="position: absolute; top: 40pt; left: 60pt; right: 60pt;">
    <h1 style="font-size: 36pt; color: #1A1A1A; font-weight: 700;">Use an assertion as the title, not a topic word</h1>
    <p style="font-size: 16pt; color: #555555; margin-top: 10pt;">Subtitle clarification</p>
  </div>

  <!-- Content card: div carries the background, h2/p carry the text -->
  <div class="card" style="top: 130pt; left: 60pt; width: 240pt; height: 160pt;">
    <h2>Point one</h2>
    <p>Brief explanatory text</p>
  </div>

  <!-- List: use ul/li, not manual bullets -->
  <div style="position: absolute; top: 320pt; left: 60pt; width: 540pt;">
    <ul style="font-size: 16pt; color: #1A1A1A; padding-left: 24pt; list-style: disc;">
      <li>First point</li>
      <li>Second point</li>
      <li>Third point</li>
    </ul>
  </div>

  <!-- Illustration: use the <img> tag, not background-image -->
  <img src="illustration.png" style="position: absolute; right: 60pt; top: 110pt; width: 320pt; height: 240pt;" />

</body>
</html>
```

---

## Common error lookup

| Error message | Cause | Fix |
|---------|------|---------|
| `DIV element contains unwrapped text "XXX"` | Bare text inside a div | Wrap the text in `<p>` or `<h1>`-`<h6>` |
| `CSS gradients are not supported` | linear/radial-gradient was used | Switch to a solid color, or use flex children to segment |
| `Text element <p> has background` | Background color set on a `<p>` tag | Wrap with a `<div>` that carries the background; `<p>` should only carry text |
| `Background images on DIV elements are not supported` | div used background-image | Replace with an `<img>` tag |
| `HTML content overflows body by Xpt vertically` | Content exceeds 540pt | Reduce content or shrink font size, or use `overflow: hidden` to clip |
| `HTML dimensions don't match presentation layout` | body size does not match the pres layout | Use `960pt x 540pt` body with `LAYOUT_WIDE`, or define a custom size with defineLayout |
| `Text box "XXX" ends too close to bottom edge` | A large-font `<p>` is < 0.5 inch from the body bottom edge | Move it up and leave enough bottom margin; PPT itself partially clips the bottom |

---

## Basic workflow (3 steps to PPTX)

### Step 1: write each page's HTML separately, following the constraints

```
MyDeck/
+- slides/
|  +- 01-cover.html    # Each file is a complete 960x540pt HTML
|  +- 02-agenda.html
|  +- ...
+- illustration/        # All images referenced by <img>
   +- chart1.png
   +- ...
```

### Step 2: write build.js that calls `html2pptx.js`

```js
const pptxgen = require('pptxgenjs');
const html2pptx = require('../scripts/html2pptx.js');  // script bundled with this skill

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';  // 13.333 x 7.5 inch, matches the HTML's 960x540pt

  const slides = ['01-cover.html', '02-agenda.html', '03-content.html'];
  for (const file of slides) {
    await html2pptx(`./slides/${file}`, pres);
  }

  await pres.writeFile({ fileName: 'deck.pptx' });
})();
```

### Step 3: open and check

- Open the exported PPTX in PowerPoint/Keynote
- Double-click any text - it should be editable directly (if it shows up as an image, rule 1 was violated)
- Verify overflow: every page should fit within the body, with nothing clipped

---

## This path vs other options (which to pick when)

| Need | Pick this |
|------|------|
| Coworkers will edit PPTX text / hand off to non-technical people for further editing | **This path** (editable; HTML must be written from scratch following the 4 constraints) |
| Speaking only / archive only, not edited again | `export_deck_pdf.mjs` (multi-file) or `export_deck_stage_pdf.mjs` (single-file deck-stage), produces vector PDF |
| Visual freedom is the priority (animations, web components, CSS gradients, complex SVG); accept being non-editable | **PDF** (same as above) - PDF is both faithful and cross-platform, more appropriate than an "image PPTX" |

**Never force-run html2pptx on visually-freewheeling HTML** - empirically, visually-driven HTML has a < 30% pass rate, and rebuilding the failures page-by-page is slower than rewriting from scratch. In that scenario produce a PDF, not a forced PPTX.

---

## Fallback: existing visual draft, but the user insists on an editable PPTX

This case comes up occasionally: you/the user have already written a visually-driven HTML (gradients, web components, complex SVG, all in use). Producing a PDF would be the right call, but the user has explicitly said "no, it has to be an editable PPTX".

**Don't force-run `html2pptx` and hope for a pass** - empirically, visually-driven HTML passes html2pptx less than 30% of the time, and the remaining 70% errors out or breaks. The correct fallback:

### Step 1 - state the limits upfront (transparent communication)

In one breath, make three things clear to the user:

> "Your current HTML uses [list specifically: gradients / web components / complex SVG / ...]. Converting it directly to an editable PPTX will fail. I have two options:
> - A. **Produce a PDF** (recommended) - 100% visual fidelity preserved; recipients can view and print but cannot edit text
> - B. **Use the visual draft as a blueprint and rewrite an editable HTML** (preserving the design decisions of color/layout/copy, but reorganizing the HTML structure to follow the 4 hard constraints, **sacrificing** gradients, web components, complex SVG, and other visual capabilities) -> then export an editable PPTX
>
> Which do you prefer?"

Don't make option B sound effortless - say clearly **what will be lost**. Let the user make the trade-off.

### Step 2 - if the user picks B: the AI rewrites it, do not ask the user to rewrite

The doctrine here: **the user provides the design intent, you translate it into a compliant implementation**. Do not ask the user to learn the 4 hard constraints and rewrite it themselves.

Principles to follow when rewriting:
- **Preserve**: color system (primary/secondary/neutral), information hierarchy (title/subtitle/body/notes), core copy, layout skeleton (top/middle/bottom or left/right or grid), page rhythm
- **Downgrade**: CSS gradients -> solid colors or flex segmentation; web components -> paragraph-level HTML; complex SVG -> simplified `<img>` or solid-color geometry; shadows -> remove or weaken; custom fonts -> nearest system fonts
- **Rewrite**: bare text -> wrapped in `<p>` / `<h*>`; `background-image` -> `<img>` tag; backgrounds/borders on `<p>` -> moved onto an outer div

### Step 3 - produce a comparison list (transparent delivery)

After rewriting, give the user a before/after summary so they know which visual details were simplified:

```
Original design -> editable-version adjustments
- Title block purple gradient -> primary color #5B3DE8 solid background
- Data card shadow -> removed (replaced with 2pt outline)
- Complex SVG line chart -> simplified to <img> PNG (rendered from HTML screenshot)
- Hero web component animation -> static first frame (web component cannot be translated)
```

### Step 4 - export & deliver in two formats

- `editable` HTML version -> run `scripts/export_deck_pptx.mjs` to get the editable PPTX
- **Recommended: also keep** the original visual draft -> run `scripts/export_deck_pdf.mjs` to get a high-fidelity PDF
- Deliver both to the user: the visual PDF + the editable PPTX, each serving its own purpose

### When to refuse option B outright

In some cases the rewrite cost is too high and you should encourage the user to drop editable PPTX:
- The HTML's core value is animation or interaction (after rewriting, only a static first frame remains; >50% of the information is lost)
- More than 30 pages, rewrite cost exceeds 2 hours
- The visual design depends deeply on precise SVG / custom filters (the rewrite ends up nearly unrelated to the original)

In that case tell the user: "The rewrite cost on this deck is too high. I recommend producing a PDF instead of a PPTX. If the recipient really requires pptx format, accept that the visuals will be substantially simplified - would you rather switch to PDF?"

---

## Why the 4 constraints are not bugs but physical constraints

These 4 are not the `html2pptx.js` author cutting corners - they are constraints of the **PowerPoint file format (OOXML) itself** projected onto HTML:

- In PPTX, text must live in a text frame (`<a:txBody>`), corresponding to paragraph-level HTML elements
- In PPTX, shape and text frame are two separate objects; you cannot draw a background and write text on the same element
- PPTX shape fill has limited gradient support (only certain preset gradients; no support for arbitrary-angle CSS gradients)
- PPTX picture objects must reference real image files, not CSS properties

Once you understand this, **stop expecting the tool to get smarter** - the HTML has to adapt to the PPTX format, not the other way around.
