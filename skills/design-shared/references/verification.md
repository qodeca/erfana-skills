# Verification: output verification workflow

Some design-agent native environments (such as Claude.ai Artifacts) ship with a built-in `fork_verifier_agent` that spawns a subagent to inspect screenshots through an iframe. Most agent environments (Claude Code / Codex / Cursor / Trae / etc.) do not have this capability built in – running Playwright manually covers the same verification scenarios.

## Verification checklist

After every HTML output, run through this checklist:

### 1. Browser rendering check (mandatory)

The most basic question: **does the HTML even open**? On macOS:

```bash
open -a "Google Chrome" "/path/to/your/design.html"
```

Or take a screenshot with Playwright (next section).

### 2. Console error check

The most common problem with HTML files is a JS error producing a white screen. Run a quick Playwright pass:

```bash
python ~/.claude/skills/claude-design/scripts/verify.py path/to/design.html
```

This script will:
1. Open the HTML in headless Chromium
2. Save a screenshot to the project directory
3. Capture console errors
4. Report status

See `scripts/verify.py` for details.

### 3. Multi-viewport check

For responsive designs, capture multiple viewports:

```bash
python verify.py design.html --viewports 1920x1080,1440x900,768x1024,375x667
```

### 4. Interaction check

Tweaks, animations, button toggles – none of these show up in a default static screenshot. **Recommendation: have the user click through it themselves in a real browser**, or record a Playwright session:

```python
page.video.record('interaction.mp4')
```

### 5. Slide-by-slide check

For deck-style HTML, capture each slide:

```bash
python verify.py deck.html --slides 10  # capture the first 10 slides
```

This produces `deck-slide-01.png`, `deck-slide-02.png`, ... so you can scan quickly.

## Playwright setup

First-time setup:

```bash
# If not yet installed
npm install -g playwright
npx playwright install chromium

# Or the Python version
pip install playwright
playwright install chromium
```

If the user already has Playwright installed globally, just use it.

## Screenshot best practices

### Capture the full page

```python
page.screenshot(path='full.png', full_page=True)
```

### Capture the viewport

```python
page.screenshot(path='viewport.png')  # by default captures only the visible region
```

### Capture a specific element

```python
element = page.query_selector('.hero-section')
element.screenshot(path='hero.png')
```

### High-DPI screenshots

```python
page = browser.new_page(device_scale_factor=2)  # retina
```

### Wait for animations to finish before capturing

```python
page.wait_for_timeout(2000)  # wait 2 seconds for animations to settle
page.screenshot(...)
```

### Mid-animation snapshots (frame-perfect)

CSS transitions can't be paused programmatically, and `Bash sleep` + screenshot is unreliable due to MCP / remote-browser tool latency – by the time the screenshot lands, the animation has often finished. For frame-perfect mid-flight captures, replay the same keyframes through the **Web Animations API** and pause at the desired `currentTime`:

```js
// Run inside the page via evaluate / DevTools.
const anim = el.animate(
  [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 0 100%)' }],
  { duration: 4000, easing: 'cubic-bezier(0.7, 0, 0.2, 1)', fill: 'both' }
);
anim.currentTime = 1200;  // 30% of 4000ms – element locked at this frame
anim.pause();
// Now take the screenshot – the element holds its mid-flight pose indefinitely.
```

To capture at multiple progress points (30% / 60% / 90%), keep the `Animation` reference and reset `currentTime` between screenshots – no need to re-run keyframes. Use `document.getAnimations()` to find existing animations on a page if you didn't create them in the same script.

**Caveats** (read before relying on a single mid-flight capture):

- **Force a layout read after `pause()`.** Some Chromium versions commit one extra frame after pause if the animation was just started in the same task. Add `void el.getBoundingClientRect();` after `anim.pause()` to flush layout before signaling ready for screenshot.
- **Iframe-contained elements need iframe-window scope.** `el.animate()` runs in the document that owns `el`. If you're driving an iframe's content from the parent, `el = iframe.contentWindow.document.querySelector(...)` and `el.animate(...)` is fine – but `document.getAnimations()` from the parent will NOT find them; query through `iframe.contentWindow.document.getAnimations()` instead.
- **Easing IS applied during `currentTime` seeking.** With `easing: 'cubic-bezier(0.7, 0, 0.2, 1)'`, the pose at `currentTime = duration * 0.30` is NOT 30% spatial progress – it's whatever spatial progress that easing curve dictates at t=0.30. This is the correct behavior for matching a real mid-flight frame. If you want linear interpolation (e.g., for measuring properties at exact 10% intervals), pass `easing: 'linear'` to `el.animate()`.

## Slide-fit verification (does the slide fit 1920x1080?)

The naive check – `document.documentElement.scrollHeight === 1080` – is unreliable. Slide HTML typically sets `body { overflow: hidden }` so any vertical overflow is silently clipped: content renders below the visible bottom edge while `scrollHeight` still reports 1080. The agent thinks the slide fits; the user sees a cropped slide.

Use a strict check that walks all elements (not just leaves – see below) and compares the deepest rendered bottom against the footer's top.

**Selector defaults** (the snippet below assumes Path A multi-file aggregator):
- `main.body *` – the content region of a Path A slide.
- `.footer` – the page footer element. The snippet handles slides without a footer (cover, closing pages where `zone-bot` is omitted) by falling back to `1080` as the bottom edge.

**For Path B (`<deck-stage>`)**: substitute `section.active *` for `main.body *`, and use the section's bottom edge as the footer reference (since Path B slides typically don't have a separate `.footer` – the section itself is the canvas).

**Why walk all elements, not just leaves**: an absolutely-positioned overlay container (e.g., a hero card with deep children) may be taller than any individual leaf inside it. A leaf-only walk misses the container's bottom edge. Walking every element is the safe default.

```js
// Run inside the slide page.
// Path A defaults; for Path B substitute `section.active *` and read
// the section's bottom rather than `.footer`.
const contentRoot = document.querySelector('main.body') || document.body;
let deepest = 0;
contentRoot.querySelectorAll('*').forEach(el => {
  // Walk every element, not just leaves. An absolutely-positioned overlay
  // container can extend past its leaves' bottom edges.
  deepest = Math.max(deepest, el.getBoundingClientRect().bottom);
});
const footerEl = document.querySelector('.footer');
const footerTop = footerEl ? footerEl.getBoundingClientRect().top : 1080;
console.log({
  deepest: Math.round(deepest),
  footerTop: Math.round(footerTop),
  overflows: deepest > footerTop + 1,
  headroom: Math.round(footerTop - deepest),
});
```

**Anti-pattern**: relying on `scrollHeight === 1080` as a fit-check. It only catches overflow when `body { overflow }` is `visible` or `auto` – which slide HTML never uses, because slides need a fixed canvas.

Run this snippet against every slide before declaring the deck done. A healthy content slide should report `overflows: false` with `headroom` ≥ 30 px (positive headroom indicates breathing room before the footer; zero or negative means clipping).

## Sharing screenshots with the user

### Open the local screenshot directly

```bash
open screenshot.png
```

The user views it in their own Preview / Figma / VSCode / browser.

### Upload to an image host and share a link

If you need to share with remote collaborators (Slack / Feishu / WeChat), have the user upload via their own image-host tool or MCP:

```bash
python ~/Documents/writing/tools/upload_image.py screenshot.png
```

Returns a permanent ImgBB link you can paste anywhere.

## When verification fails

### Blank page

There is definitely a console error. Check, in order:

1. Whether the React + Babel script tag's integrity hash is correct (see `react-setup.md`)
2. Whether `const styles = {...}` collides with another name
3. Whether components shared across files are exported to `window`
4. JSX syntax errors (babel.min.js does not report them – switch to the unminified babel.js)

### Animation stutter

- Use the Chrome DevTools Performance tab to record a session
- Look for layout thrashing (frequent reflows)
- Prefer `transform` and `opacity` for animations (GPU-accelerated)

### Wrong fonts

- Check whether `@font-face` URLs are reachable
- Check fallback fonts
- CJK fonts load slowly – show a fallback first, then swap when the webfont is ready

### Layout misalignment

- Check that `box-sizing: border-box` is applied globally
- Check the `* { margin: 0; padding: 0 }` reset
- Open Chrome DevTools gridlines to inspect the actual layout

## Verification = the designer's second pair of eyes

**Always go over the output yourself.** When AI writes code, common bugs include:

- Looks correct but interactions are broken
- Static screenshot looks fine but layout breaks on scroll
- Looks great wide but collapses on narrow viewports
- Dark mode was never tested
- Some components stop responding after tweaks toggle

**One minute of verification at the end can save an hour of rework.**

## Handy verification script commands

```bash
# Basic: open + screenshot + capture errors
python verify.py design.html

# Multi-viewport
python verify.py design.html --viewports 1920x1080,375x667

# Multi-slide
python verify.py deck.html --slides 10

# Output to a specific directory
python verify.py design.html --output ./screenshots/

# headless=false, show a real browser window
python verify.py design.html --show
```

## Cleanup (mandatory before declaring done)

**After visual verification, delete every screenshot.** The deliverable folder must contain only the artefacts the user asked for – HTML, CSS, assets, and any requested PDF / PPTX exports. Verification PNGs are scratch output and pollute the deliverable.

**Naming convention.** Verification screenshots produced by this workflow MUST start with an underscore: `_preflight-NN.png`, `_review-NN.png`, `_v3-NN.png`, `_aggregator.png`, etc. The leading underscore is what makes the cleanup glob safe – brand assets (logos, photos, backgrounds) never start with `_`, so a glob targeted at `_*.png` cannot accidentally delete a deliverable.

**Cleanup command** (run from the deliverable root):

```bash
# Delete every verification PNG; safe because no deliverable starts with `_`
find . -name '_*.png' -delete

# Sanity check: only brand assets and explicitly requested files should remain
find . -name '*.png' -not -path './assets/*'
# This second command should produce zero results.
```

**For design-slides specifically**, the deliverable folder after cleanup is:

```
<deck>/
├── index.html
├── slides/
├── shared/
└── assets/
   ├── logo/
   ├── backgrounds/
   ├── photos/<sector>/
   └── shapes/
```

Any other file at the deck root is verification debris and must be removed before completion. See `design-slides/references/slide-decks.md` § Verification checklist item 8.
