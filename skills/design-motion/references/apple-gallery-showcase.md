# Apple Gallery Showcase: gallery wall animation style

> Inspiration: Claude Design website hero video + Apple product page "gallery wall" presentation
> Field history: release hero v5
> Use cases: **product launch hero animations, skill capability demos, portfolio showcases** - any scene that needs to display "many high-quality outputs" simultaneously while guiding the audience's attention

---

## When to use this style

**Suited for**:
- 10+ real outputs to display on the same screen (slides, apps, web pages, infographics)
- A professional audience (developers, designers, product managers) sensitive to "craft"
- The mood you want to project is "restrained, exhibition-like, premium, with a sense of space"
- Both focus and overview need to coexist (see the detail without losing the whole)

**Not suited for**:
- Single-product focus (use the frontend-design product hero template)
- Emotional or strongly narrative animation (use the timeline-storytelling template)
- Small screens / portrait orientation (the tilted perspective gets muddy on a small canvas)

---

## Core visual tokens

```css
:root {
  /* Light gallery palette */
  --bg:         #F5F5F7;   /* Main canvas - Apple website grey */
  --bg-warm:    #FAF9F5;   /* Warm off-white variant */
  --ink:        #1D1D1F;   /* Primary text color */
  --ink-80:     #3A3A3D;
  --ink-60:     #545458;
  --muted:      #86868B;   /* Secondary text */
  --dim:        #C7C7CC;
  --hairline:   #E5E5EA;   /* 1px card border */
  --accent:     #D97757;   /* Terracotta orange - Claude brand */
  --accent-deep:#B85D3D;

  --serif-cn: "Noto Serif SC", "Songti SC", Georgia, serif;
  --serif-en: "Source Serif 4", "Tiempos Headline", Georgia, serif;
  --sans:     "Inter", -apple-system, "PingFang SC", system-ui;
  --mono:     "JetBrains Mono", "SF Mono", ui-monospace;
}
```

**Key principles**:
1. **Never use a pure black background**. Black makes the work look like a film, not "a deliverable that could be adopted".
2. **Terracotta orange is the only accent hue**, everything else is grayscale + white.
3. **Three-typeface stack** (serif EN + serif CN + sans + mono) projects "publication" rather than "internet product".

---

## Core layout patterns

### 1. Floating card (the basic unit of the entire style)

```css
.gallery-card {
  background: #FFFFFF;
  border-radius: 14px;
  padding: 6px;                          /* Inner padding is the "matting" */
  border: 1px solid var(--hairline);
  box-shadow:
    0 20px 60px -20px rgba(29, 29, 31, 0.12),   /* Main shadow - soft and long */
    0 6px 18px -6px rgba(29, 29, 31, 0.06);     /* Second-layer near-light, creates float */
  aspect-ratio: 16 / 9;                  /* Unified slide ratio */
  overflow: hidden;
}
.gallery-card img {
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 9px;                    /* Slightly smaller than the card's radius - visual nesting */
}
```

**Counter-example**: do not use edge-to-edge tiling (no padding, no border, no shadow) - that is the density expression of an infographic, not an exhibition.

### 2. 3D tilted gallery wall

```css
.gallery-viewport {
  position: absolute; inset: 0;
  overflow: hidden;
  perspective: 2400px;                   /* Deeper perspective, the tilt stays subtle */
  perspective-origin: 50% 45%;
}
.gallery-canvas {
  width: 4320px;                         /* Canvas = 2.25x viewport */
  height: 2520px;                        /* Leave room for pan */
  transform-origin: center center;
  transform: perspective(2400px)
             rotateX(14deg)              /* Tilt back */
             rotateY(-10deg)             /* Turn to the left */
             rotateZ(-2deg);             /* Slight tilt to break up the perfect grid */
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 40px;
  padding: 60px;
}
```

**Sweet spot parameters**:
- rotateX: 10-15deg (any more and it looks like a VIP backdrop at a gala)
- rotateY: ±8-12deg (left/right symmetry)
- rotateZ: ±2-3deg (the "this was not arranged by a machine" human touch)
- perspective: 2000-2800px (below 2000 fish-eyes; above 3000 approaches an orthographic projection)

### 3. 2x2 four-corner convergence (selection scene)

```css
.grid22 {
  display: grid;
  grid-template-columns: repeat(2, 800px);
  gap: 56px 64px;
  align-items: start;
}
```

Each card slides in from its corresponding corner (tl/tr/bl/br) toward the center, with a fade in. Matching `cornerEntry` vectors:

```js
const cornerEntry = {
  tl: { dx: -700, dy: -500 },
  tr: { dx:  700, dy: -500 },
  bl: { dx: -700, dy:  500 },
  br: { dx:  700, dy:  500 },
};
```

---

## Five core animation patterns

### Pattern A - Four-corner convergence (0.8-1.2s)

4 elements slide in from the four corners of the viewport while scaling 0.85->1.0, on ease-out. Suits an opening that "presents multi-direction options".

```js
const inP = easeOut(clampLerp(t, start, end));
card.style.transform = `translate3d(${(1-inP)*ce.dx}px, ${(1-inP)*ce.dy}px, 0) scale(${0.85 + 0.15*inP})`;
card.style.opacity = inP;
```

### Pattern B - Selection zoom + others slide out (0.8s)

The selected card scales from 1.0->1.28 while the rest fade out, blur, and drift back to the corners:

```js
// Selected
card.style.transform = `translate3d(${cellDx*outP}px, ${cellDy*outP}px, 0) scale(${1 + 0.28*easeOut(zoomP)})`;
// Unselected
card.style.opacity = 1 - outP;
card.style.filter = `blur(${outP * 1.5}px)`;
```

**Key point**: the unselected cards must blur, not just fade. Blur simulates depth of field and visually "pushes the selected one toward the camera".

### Pattern C - Ripple expansion (1.7s)

From the center outward, delay each card by distance, fading in one by one while scaling from 1.25x down to 0.94x ("camera pulls back"):

```js
const col = i % COLS, row = Math.floor(i / COLS);
const dc = col - (COLS-1)/2, dr = row - (ROWS-1)/2;
const dist = Math.sqrt(dc*dc + dr*dr);
const delay = (dist / maxDist) * 0.8;
const localT = Math.max(0, (t - rippleStart - delay) / 0.7);
card.style.opacity = easeOut(Math.min(1, localT));

// At the same time, the whole gallery scales 1.25 -> 0.94
const galleryScale = 1.25 - 0.31 * easeOut(rippleProgress);
```

### Pattern D - Sinusoidal pan (continuous drift)

Combine a sine wave with a linear drift to avoid the "has a start and an end" feel of a marquee loop:

```js
const panX = Math.sin(panT * 0.12) * 220 - panT * 8;    // Drift left horizontally
const panY = Math.cos(panT * 0.09) * 120 - panT * 5;    // Drift up vertically
const clampedX = Math.max(-900, Math.min(900, panX));   // Keep edges from showing
```

**Parameters**:
- Sine period `0.09-0.15 rad/s` (slow, roughly 30-50 seconds per swing)
- Linear drift `5-8 px/s` (slower than the audience blinks)
- Amplitude `120-220 px` (large enough to feel, small enough not to nauseate)

### Pattern E - Focus overlay (focus switch)

**Key design**: the focus overlay is a **flat element** (not tilted) floating above the tilted canvas. The selected slide scales from its tile size (about 400x225) to the screen center (960x540); the background canvas does not change tilt but **dims to 45%**:

```js
// Focus overlay (flat, centered)
focusOverlay.style.width = (startW + (endW - startW) * focusIntensity) + 'px';
focusOverlay.style.height = (startH + (endH - startH) * focusIntensity) + 'px';
focusOverlay.style.opacity = focusIntensity;

// Background cards dim but stay visible (key! do not 100% mask)
card.style.opacity = entryOp * (1 - 0.55 * focusIntensity);   // 1 -> 0.45
card.style.filter = `brightness(${1 - 0.3 * focusIntensity})`;
```

**Sharpness rules**:
- The focus overlay's `<img>` must point its `src` straight at the original image - **do not reuse the compressed thumbnail from the gallery**
- Preload all originals into a `new Image()[]` array up front
- Compute the overlay's own `width/height` per frame; the browser will resample the original image each frame

---

## Timeline architecture (reusable skeleton)

```js
const T = {
  DURATION: 25.0,
  s1_in: [0.0, 0.8],    s1_type: [1.0, 3.2],  s1_out: [3.5, 4.0],
  s2_in: [3.9, 5.1],    s2_hold: [5.1, 7.0],  s2_out: [7.0, 7.8],
  s3_hold: [7.8, 8.3],  s3_ripple: [8.3, 10.0],
  panStart: 8.6,
  focuses: [
    { start: 11.0, end: 12.7, idx: 2  },
    { start: 13.3, end: 15.0, idx: 3  },
    { start: 15.6, end: 17.3, idx: 10 },
    { start: 17.9, end: 19.6, idx: 16 },
  ],
  s4_walloff: [21.1, 21.8], s4_in: [21.8, 22.7], s4_hold: [23.7, 25.0],
};

// Core easing
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
function lerp(time, start, end, fromV, toV, easing) {
  if (time <= start) return fromV;
  if (time >= end) return toV;
  let p = (time - start) / (end - start);
  if (easing) p = easing(p);
  return fromV + (toV - fromV) * p;
}

// A single render(t) function reads the timestamp and writes every element
function render(t) { /* ... */ }
requestAnimationFrame(function tick(now) {
  const t = ((now - startMs) / 1000) % T.DURATION;
  render(t);
  requestAnimationFrame(tick);
});
```

**Architectural essence**: **every state derives from the timestamp t** - no state machines, no setTimeout. As a result:
- You can jump to any moment with `window.__setTime(12.3)` (handy for frame-by-frame Playwright capture)
- The loop is naturally seamless (t mod DURATION)
- During debugging, you can freeze any single frame

---

## Texture details (easy to overlook, but fatal)

### 1. SVG noise texture

A light background's worst enemy is "too flat". Layer in a very faint fractalNoise:

```html
<style>
.stage::before {
  content: '';
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.078  0 0 0 0 0.078  0 0 0 0 0.074  0 0 0 0.035 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0.5;
  pointer-events: none;
  z-index: 30;
}
</style>
```

It looks identical at first glance - remove it and you will know the difference.

### 2. Corner brand mark

```html
<div class="corner-brand">
  <div class="mark"></div>
  <div>ERFANA</div>
</div>
```

```css
.corner-brand {
  position: absolute; top: 48px; left: 72px;
  font-family: var(--mono);
  font-size: 12px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
}
```

Show it only during the gallery-wall scene; fade in and out. Like a museum exhibit label.

### 3. Brand closing wordmark

```css
.brand-wordmark {
  font-family: var(--sans);
  font-size: 148px;
  font-weight: 700;
  letter-spacing: -0.045em;   /* Negative tracking is key - tightens the type into a logotype */
}
.brand-wordmark .accent {
  color: var(--accent);
  font-weight: 500;           /* Accent characters are actually thinner - visual contrast */
}
```

`letter-spacing: -0.045em` is the standard treatment for the giant headline type on Apple's product pages.

---

## Common failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Looks like a PowerPoint template | Cards have no shadow / hairline | Add two-layer box-shadow + 1px border |
| Cheap-looking tilt | Only used rotateY without rotateZ | Add ±2-3deg rotateZ to break the rigid grid |
| Pan feels "jerky" | Used setTimeout or a CSS keyframes loop | Use rAF + a continuous sin/cos function |
| Type is unreadable in focus state | Reused the low-resolution gallery tile | A standalone overlay with the original image src |
| Background feels empty | Pure flat color `#F5F5F7` | Layer in the SVG fractalNoise at 0.5 opacity |
| Type feels "too SaaS" | Only Inter | Add Serif (one EN, one CN) + mono - three-stack |

---

## References

- Full implementation sample: `demos/hero-animation-v10.html` (in this skill bundle, the v10 distillation)
- Original inspiration: claude.ai/design hero video
- Aesthetic references: Apple product pages, Dribbble shot collection pages

When you face an animation requirement of the form "many high-quality outputs to display", copy the skeleton straight out of this file, swap in the content, and tweak the timing.
