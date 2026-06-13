# Gallery Ripple + Multi-Focus - the philosophy of scene composition

> **A reusable visual composition structure** distilled from the hero animation v9 (25 seconds, 8 scenes).
> This is not an animation production pipeline - it is **the kinds of scenes for which this composition is "the right one"**.
> Practical reference: source HTML at [`design-shared/demos/hero-animation-v10.html`](../../design-shared/demos/hero-animation-v10.html) (the v10 evolution of the v9 study).

## One-line takeaway

> **When you have 20+ visually homogeneous assets and the scene needs to "convey scale and depth", reach for Gallery Ripple + Multi-Focus before piling up layouts.**

Generic SaaS feature animations, product launches, skill promotions, series portfolios - whenever there are enough assets and the style is consistent, this structure almost always works.

---

## What this technique actually expresses

It is not "show off the assets" - it tells a narrative through **two rhythm shifts**:

**Beat one - Ripple expansion (~1.5s)**: 48 cards burst outward from the center, and the audience is hit by "volume" - "wow, there is this much output."

**Beat two - Multi-Focus (~8s, 4 cycles)**: while the camera slowly pans, the background dims and desaturates four times, and a single card is enlarged to the center of the screen - the audience switches from "the impact of quantity" to "the gaze on quality", with a steady 1.7s rhythm each time.

**The core narrative structure**: **scale (Ripple) -> gaze (Focus x 4) -> fade out (walloff)**. Stitched together, these three beats express "Breadth x Depth" - not just "we can do many things", but "every one of them deserves a pause to look closer".

Compare with the counter-examples:

| Approach | Audience perception |
|------|---------|
| 48 cards laid out statically (no Ripple) | Pretty but no narrative, like a grid screenshot |
| One-by-one quick cuts (no gallery context) | Feels like a slideshow, the sense of "scale" is lost |
| Ripple only, no Focus | Stunned by volume but does not remember any specific card |
| **Ripple + Focus x 4 (this recipe)** | **First the awe of quantity, then the gaze on quality, then a calm fade-out - a complete emotional arc** |

---

## Prerequisites (must all be satisfied)

This composition **is not a one-size-fits-all**. The 4 conditions below are all required:

1. **Asset count >= 20, ideally 30+**
   With fewer than 20, the Ripple feels "empty" - density only emerges when every cell of the 48 grid is animating. v9 used 48 cells x 32 images (looped fill).

2. **Visually consistent assets**
   All 16:9 slide previews, all app screenshots, all cover designs - aspect ratio, tone, and layout must look like "one set". Mixing styles makes the gallery look like a clipboard.

3. **Each asset still carries readable info when enlarged**
   Focus enlarges a card to 960px wide; if the original is blurry or thin on info at that size, the Focus beat is wasted. Reverse check: can you pick 4 of the 48 as "the most representative"? If not, asset quality is inconsistent.

4. **The scene is landscape or square, not portrait**
   The gallery's 3D tilt (`rotateX(14deg) rotateY(-10deg)`) needs horizontal extension - portrait makes the tilt look narrow and awkward.

**Fallback paths when prerequisites are missing**:

| What's missing | Fall back to |
|-------|-----------|
| Fewer than 20 assets | "3-5 static side-by-side + focus one by one" |
| Inconsistent style | "Cover + 3 chapter hero shots" keynote-style |
| Thin info | "Data-driven dashboard" or "key sentence + big text" |
| Portrait scene | "Vertical scroll + sticky cards" |

---

## Technical recipe (v9 production parameters)

### 4-layer structure

```
viewport (1920x1080, perspective: 2400px)
  L canvas (4320x2520, oversized overflow) -> 3D tilt + pan
      L 8x6 grid = 48 cards (gap 40px, padding 60px)
          L img (16:9, border-radius 9px)
      L focus-overlay (absolute center, z-index 40)
          L img (matches selected slide)
```

**Key**: the canvas is 2.25x the viewport, which gives the pan a "peeking into a larger world" quality.

### Ripple expansion (distance-delay algorithm)

```js
// Each card's entrance time = distance from center x 0.8s delay
const col = i % 8, row = Math.floor(i / 8);
const dc = col - 3.5, dr = row - 2.5;       // offset to center
const dist = Math.hypot(dc, dr);
const maxDist = Math.hypot(3.5, 2.5);
const delay = (dist / maxDist) * 0.8;       // 0 -> 0.8s
const localT = Math.max(0, (t - rippleStart - delay) / 0.7);
const opacity = expoOut(Math.min(1, localT));
```

**Core parameters**:
- Total duration 1.7s (`T.s3_ripple: [8.3, 10.0]`)
- Max delay 0.8s (center first, corners last)
- Each card's entrance lasts 0.7s
- Easing: `expoOut` (burst feel, not smooth)

**Concurrent action**: canvas scale animates from 1.25 -> 0.94 (zoom out to reveal) - synchronized push-back as the cards appear.

### Multi-Focus (4-beat rhythm)

```js
T.focuses = [
  { start: 11.0, end: 12.7, idx: 2  },  // 1.7s
  { start: 13.3, end: 15.0, idx: 3  },  // 1.7s
  { start: 15.6, end: 17.3, idx: 10 },  // 1.7s
  { start: 17.9, end: 19.6, idx: 16 },  // 1.7s
];
```

**Rhythm rule**: each focus 1.7s, 0.6s breath in between. Total 8s (11.0-19.6s).

**Inside each focus**:
- In ramp: 0.4s (`expoOut`)
- Hold: middle 0.9s (`focusIntensity = 1`)
- Out ramp: 0.4s (`easeOut`)

**Background change (this is the key)**:

```js
if (focusIntensity > 0) {
  const dimOp = entryOp * (1 - 0.6 * focusIntensity);  // dim to 40%
  const brt = 1 - 0.32 * focusIntensity;                // brightness 68%
  const sat = 1 - 0.35 * focusIntensity;                // saturate 65%
  card.style.filter = `brightness(${brt}) saturate(${sat})`;
}
```

**Not just opacity - simultaneously desaturate + darken**. This makes the foreground overlay's color "pop" instead of merely "getting brighter".

**Focus overlay size animation**:
- 400x225 (entrance) -> 960x540 (hold)
- Surrounded by 3 layers of shadow + 3px accent-color outline ring, giving a "framed" feeling

### Pan (continuous motion keeps stillness from getting boring)

```js
const panT = Math.max(0, t - 8.6);
const panX = Math.sin(panT * 0.12) * 220 - panT * 8;
const panY = Math.cos(panT * 0.09) * 120 - panT * 5;
```

- Sine wave + linear drift, two layers of motion - not a pure loop; every moment the position is different
- X/Y frequencies differ (0.12 vs 0.09) to avoid a visible "regular cycle"
- Clamped at +/-900/500px to prevent drifting off

**Why not a pure linear pan**: with linear motion, the audience can "predict" the next second; sine + drift makes every second feel new, and the 3D tilt produces a slight "seasickness" (the good kind) that holds attention.

---

## 5 reusable patterns (distilled from the v6 -> v9 iteration)

### 1. **expoOut as the main easing, not cubicOut**

`easeOut = 1 - (1-t)^3` (smooth) vs `expoOut = 1 - 2^(-10t)` (bursts then converges quickly).

**Reason for choice**: expoOut reaches 90% in the first 30%, more like physical damping, matching the "heavy thing landing" intuition. Especially good for:
- Card entrance (sense of weight)
- Ripple expansion (shock wave)
- Brand float-up (settling)

**When to still use cubicOut**: focus out ramp, symmetric micro-motions.

### 2. **Paper background + terracotta orange accent (Anthropic lineage)**

```css
--bg: #F7F4EE;        /* warm paper */
--ink: #1D1D1F;       /* near-black */
--accent: #D97757;    /* terracotta orange */
--hairline: #E4DED2;  /* warm hairlines */
```

**Why**: warm backgrounds keep their "breathing room" even after GIF compression, unlike pure white which feels "screen-y". Terracotta orange is the single accent threading through the terminal prompt, dir-card selection, cursor, brand hyphen, focus ring - every visual anchor is tied together by this one color.

**v5 lesson**: a noise overlay was added to mimic "paper grain", and GIF frame compression destroyed it (every frame was different). v6 switched to "background color only + warm shadows" - 90% of the paper feel is preserved and the GIF size shrank by 60%.

### 3. **Two-tier shadows simulate depth - no real 3D**

```css
.gallery-card.depth-near { box-shadow: 0 32px 80px -22px rgba(60,40,20,0.22), ... }
.gallery-card.depth-far  { box-shadow: 0 14px 40px -16px rgba(60,40,20,0.10), ... }
```

A deterministic algorithm `sin(i x 1.7) + cos(i x 0.73)` assigns near/mid/far shadow tiers to each card - **the visual gives a "3D stack" feel, but the per-frame transform is constant, so GPU cost is zero**.

**Cost of real 3D**: each card with its own `translateZ`, GPU computing 48 transforms + shadow blurs every frame. v4 tried this; even Playwright recording at 25fps struggled. v6's two-tier shadow has < 5% visual difference but 10x lower cost.

### 4. **Weight variation (font-variation-settings) is more cinematic than size variation**

```js
const wght = 100 + (700 - 100) * morphP;  // 100 -> 700 over 0.9s
wordmark.style.fontVariationSettings = `"wght" ${wght.toFixed(0)}`;
```

The brand wordmark transitions from Thin -> Bold over 0.9s, paired with a small letter-spacing adjustment (-0.045 -> -0.048em).

**Why this beats scaling up/down**:
- Scaling is something audiences have seen too many times; expectations are fixed
- Weight variation is "internal fullness", like a balloon being inflated, rather than "being pushed closer"
- Variable fonts only became widespread after 2020, so audiences subconsciously feel "modern"

**Constraint**: requires a font that supports variable weight (Inter / Roboto Flex / Recursive, etc.). With ordinary static fonts you can only fake it (toggling between fixed weights produces visible jumps).

### 5. **Corner brand - low-intensity persistent signature**

A small `ERFANA` mark sits in the top-left during the gallery phase: 16% opacity, 12px font, wide letter-spacing.

**Why include this**:
- After the Ripple burst, audiences can "lose focus" and forget what they are looking at; a soft top-left mark anchors them
- More elegant than a giant fullscreen logo - branding people know that signature does not need to shout
- Leaves an attribution signal even when the GIF is screenshot and shared

**Rule**: only present mid-section (when the frame is busy); off during opening (don't obscure the terminal); off at the end (the brand reveal is the protagonist).

---

## Counter-examples: when not to use this composition

**X Product demos (where features are the point)**: the Gallery makes every card flash by; the audience cannot retain any feature. Use "single-screen focus + tooltip annotation".

**X Data-driven content**: viewers need to read numbers; the Gallery's fast rhythm does not give them time. Use "data charts + step-by-step reveal".

**X Storytelling**: the Gallery is a "parallel" structure; stories need cause and effect. Use keynote-style chapter transitions.

**X Only 3-5 assets**: Ripple density is insufficient and looks like "a patch". Use "static layout + highlight one by one".

**X Portrait (9:16)**: the 3D tilt needs horizontal extension; in portrait the tilt feels "tilted" rather than "expanding".

---

## How to judge whether your task fits this composition

A three-step quick check:

**Step 1 - asset count**: count the homogeneous visual assets you have. < 15 -> stop; 15-25 -> stretch; 25+ -> use it directly.

**Step 2 - consistency test**: place 4 random assets side by side - do they look like "one set"? If not -> unify the style first, or change the approach.

**Step 3 - narrative match**: are you trying to express "Breadth x Depth" (quantity x quality)? Or "process", "features", "story"? If it is not the first one, do not force-fit.

If all three are yes, fork the v6 HTML, swap the `SLIDE_FILES` array and the timeline, and you can reuse it. Re-skin via `--bg / --accent / --ink` - re-skin without changing the bones.

---

## Related references

- Full technical workflow: [references/animations.md](animations.md) - [references/animation-best-practices.md](animation-best-practices.md)
- Animation export pipeline: [references/video-export.md](video-export.md)
- Audio configuration (BGM + SFX dual track): [references/audio-design-rules.md](audio-design-rules.md)
- Apple gallery style horizontal reference: [references/apple-gallery-showcase.md](apple-gallery-showcase.md)
- Source HTML (v6 + audio integration version): `demos/hero-animation-v10.html`
