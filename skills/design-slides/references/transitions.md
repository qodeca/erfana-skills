# Live-presentation transition pattern: curtain wipe

For decks presented live in the browser (not exported to MP4), in-aggregator transitions add narrative rhythm without requiring a separate motion pipeline. This document covers the **two-iframe ping-pong + traveling rule** pattern – the production-ready fallback when you don't need full motion-design treatment.

When to use this skill:
- Live in-browser presentation, not video export.
- Multi-file aggregator architecture (Path A from `slide-decks.md` – i.e., one HTML per slide plus a `deck_index.html` aggregator that scales/letterboxes them).
- You want transitions between slides to feel intentional, not "PowerPoint default."

For animation-heavy hero shots (counters that count up, big-type reveals, etc.), escalate selected slides to `erfana:design-motion` instead.

> **Aggregator integration**: this pattern *replaces* the single `<iframe id="frame">` element in `assets/deck_index.html`. The two `frameA` / `frameB` iframes become direct children of `<div id="stage">`, and the `wipe-rule` element sits as a sibling. Everything else in the aggregator (keyboard handlers, scale-fit, counter, print stack) is unchanged.

---

## Architecture: two-iframe ping-pong

Single-iframe `src` swap creates a flash because changing `src` reloads instantly while the new document parses asynchronously. The user briefly sees a blank/white iframe before the new slide paints.

Solution: keep **two iframes** in the aggregator. One is the visible "active" layer (z-index 2); the other is the hidden "standby" layer (z-index 1). On navigation:

1. Attach a `load` listener to the standby iframe BEFORE assigning `src` (use `addEventListener('load', handler, { once: true })`, NOT `iframe.onload = ...` – the latter races on rapid back-to-back navigations).
2. Pre-load the new slide into the standby layer (`bottom.src = newSlide`). Capture `expectedUrl = newSlide` so the handler can ignore stale loads from a previous nav.
3. Inside the handler, verify the iframe's current `src` matches `expectedUrl`; if not, return (a newer nav is already in flight).
4. Wait one extra `requestAnimationFrame` so webfonts paint.
5. Animate the active (top) layer's `clip-path` from full-cover to nothing, revealing the standby layer underneath.
6. Swap z-indexes so the bottom becomes the new "top".

**First-paint guard**: on the very first navigation (no `current` slide), there's nothing to wipe FROM – both iframes start at `about:blank`. Set the active layer's `src` directly and skip the wipe. Without this, the user sees a wipe-from-blank flash on initial slide load.

```html
<div id="stage">
  <iframe id="frameA" class="frame-layer" src="about:blank"></iframe>
  <iframe id="frameB" class="frame-layer" src="about:blank"></iframe>
  <div class="wipe-rule" id="wipeRule"></div>
</div>
```

```css
.frame-layer {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 100%;
  border: 0; background: var(--paper);
  will-change: clip-path;
}
#frameA { z-index: 1; }
#frameB { z-index: 2; }
.wipe-rule {
  position: absolute;
  top: 0; bottom: 0;
  width: 2px;
  background: #ff4d1f;          /* signal accent */
  z-index: 3;
  transform: translateX(-4px);
  opacity: 0;
  pointer-events: none;
  will-change: transform, opacity;
}
.wipe-rule.forward {
  box-shadow:
    -18px 0 36px rgba(255, 77, 31, 0.42),
    -36px 0 72px rgba(255, 77, 31, 0.18);
}
.wipe-rule.backward {
  box-shadow:
    18px 0 36px rgba(255, 77, 31, 0.42),
    36px 0 72px rgba(255, 77, 31, 0.18);
}
```

---

## The wipe motion

### Reveal animation
Animate `clip-path: inset(0 0 0 0)` → `inset(0 0 0 100%)` on the top layer. As the right inset grows from 0% to 100%, the right edge of the visible area sweeps left to right (forward direction), exposing the bottom layer.

### Visible anchor (the hairline rule)
A 2 px hairline rule travels in sync with the wipe edge from `translateX(-4px)` to `translateX(stageWidth + 4px)`. Without the rule, the wipe feels like a soft fade – with it, the eye has a physical anchor following the boundary. The trailing `box-shadow` glow gives the rule weight.

### Direction-aware
Forward navigation (→ key) sweeps L→R; backward navigation (← key) sweeps R→L. The shadow trails the rule on the side already wiped past – left-trailing when wiping forward (matching how a real moving object's motion-blur smears behind it), right-trailing when wiping backward. This costs one extra CSS class but makes the deck feel grammatical – the eye learns "rightward = next, leftward = previous."

### Hand-tuned easing
**Use `cubic-bezier(0.7, 0, 0.2, 1)`**, not `ease-in-out`. The first control point at (0.7, 0) holds the rule near the start line, then the second at (0.2, 1) snaps it through the middle, and the curve eases into x=1 softly. This feels "decisive" – generic ease-in-out feels mushy.

### Duration
650ms is the production sweet spot. Shorter (≤500ms) feels jumpy; longer (≥800ms) feels slow during a 30-slide deck where the audience presses → repeatedly.

---

## Locking and queuing

A user pressing → twice quickly should NOT overlap two wipes. Lock during transition and queue at most one pending navigation. Wrap the body in `try / finally` so a thrown wipe doesn't permanently lock navigation:

```js
let isTransitioning = false;
let pendingNav = null;
let current = null;          // null = no slide shown yet (first paint)
let topLayer = frameB;       // visible layer
let bottomLayer = frameA;    // standby layer

function loadIntoBottom(url) {
  return new Promise(resolve => {
    const expectedUrl = url;
    const handler = () => {
      // Stale-load guard: a newer nav may have replaced our src.
      if (!bottomLayer.src.endsWith(expectedUrl.split('/').pop())) return;
      // One extra rAF so webfonts paint before we animate.
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    };
    bottomLayer.addEventListener('load', handler, { once: true });
    bottomLayer.src = url;
  });
}

async function navigate(idx, direction) {
  if (idx === current) return;

  // First-paint guard: no current slide → set active layer's src directly,
  // skip the wipe entirely. Avoids "wipe from about:blank" flash.
  if (current === null) {
    topLayer.src = manifest[idx].file;
    current = idx;
    return;
  }

  if (isTransitioning) {
    pendingNav = { idx, direction };
    return;
  }
  isTransitioning = true;
  try {
    await loadIntoBottom(manifest[idx].file);
    await runWipe(direction);   // animate clip-path + traveling rule
    swapLayers();               // bottom becomes top
    current = idx;
  } finally {
    isTransitioning = false;
  }
  if (pendingNav) {
    const p = pendingNav;
    pendingNav = null;
    navigate(p.idx, p.direction);
  }
}
```

**Why each piece matters**:
- **`addEventListener('load', handler, { once: true })`** instead of `iframe.onload = ...`: the property assignment overwrites previous listeners, so a stale handler from a previous nav can fire on the new load. `addEventListener` + `once: true` self-removes after firing and never collides.
- **Stale-load guard** (`bottom.src.endsWith(...)`) covers the case where the user presses → twice and the second nav reassigns `bottom.src` while the first load is still in flight. Without the guard, the first handler fires for the wrong slide and the wipe reveals a slide that's already been replaced.
- **First-paint skip** (`current === null`): both iframes start at `about:blank`. The very first `navigate(0)` shouldn't wipe anything – it just paints slide 1.
- **`try / finally`**: an exception in the wipe (network failure on webfonts, animation API bug) leaves `isTransitioning = true` forever otherwise. The finally resets the lock so subsequent navigations still work.

Don't queue more than one pending navigation – the user pressed → quickly because they want the END, not every intermediate slide. After the in-flight wipe lands, the queued nav fires and skips ahead naturally.

---

## Verification

For mid-flight screenshots (proving the rule travels and clip-path animates), use the Web Animations API approach in `../../../design-shared/references/verification.md` – pause at chosen `currentTime` for frame-perfect captures. `Bash sleep` + screenshot is unreliable due to remote-browser tool latency.

---

## Print compatibility

The transition layer must not interfere with `P` (print) navigation. Hide the rule and disable clip-path in print mode:

```css
@media print {
  .wipe-rule { display: none !important; }
  .frame-layer { clip-path: none !important; }
  /* ... rest of print rules ... */
}
```

The print stack (one iframe per slide stacked vertically, see `assets/deck_index.html`) ignores the transition layer entirely.

---

## When NOT to use this pattern

- **Single-file `<deck-stage>` deck**: only one slide is in the DOM at a time; this pattern requires two iframes. Use a different transition (cross-fade between sections).
- **Video export**: if the deck is being recorded as MP4 / GIF, skip the transition layer and let `erfana:design-motion` orchestrate the recording. Live-aggregator transitions don't survive `page.pdf()` either – they're presentation-time only.
- **Editable PPTX**: PPTX has its own slide-transition primitives. The HTML transition layer is irrelevant there.
