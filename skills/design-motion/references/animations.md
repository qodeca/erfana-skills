# Animations: timeline animation engine

Read this when you build motion-design HTML. Covers the engine's principles, usage, and typical patterns.

## Core pattern: Stage + Sprite

Our animation system (`assets/animations.jsx`) provides a timeline-driven engine:

- **`<Stage>`**: the container for the whole animation. Provides auto-scale (fit viewport) + scrubber + play/pause/loop controls
- **`<Sprite start end>`**: a time slice. A Sprite is only visible between `start` and `end`. Inside, it can read its own local progress `t` (0->1) via the `useSprite()` hook
- **`useTime()`**: read the current global time (seconds)
- **`Easing.easeInOut` / `Easing.easeOut` / ...**: easing functions
- **`interpolate(t, from, to, easing?)`**: interpolate based on t

The pattern borrows from Remotion / After Effects but is lightweight and zero-dependency.

## Getting started

```html
<script type="text/babel" src="animations.jsx"></script>
<script type="text/babel">
  const { Stage, Sprite, useTime, useSprite, Easing, interpolate } = window.Animations;

  function Title() {
    const { t } = useSprite();  // local progress 0->1
    const opacity = interpolate(t, [0, 1], [0, 1], Easing.easeOut);
    const y = interpolate(t, [0, 1], [40, 0], Easing.easeOut);
    return (
      <h1 style={{ 
        opacity, 
        transform: `translateY(${y}px)`,
        fontSize: 120,
        fontWeight: 900,
      }}>
        Hello.
      </h1>
    );
  }

  function Scene() {
    return (
      <Stage duration={10}>  {/* 10-second animation */}
        <Sprite start={0} end={3}>
          <Title />
        </Sprite>
        <Sprite start={2} end={5}>
          <SubTitle />
        </Sprite>
        {/* ... */}
      </Stage>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<Scene />);
</script>
```

## Common animation patterns

### 1. Fade in / Fade out

```jsx
function FadeIn({ children }) {
  const { t } = useSprite();
  const opacity = interpolate(t, [0, 0.3], [0, 1], Easing.easeOut);
  return <div style={{ opacity }}>{children}</div>;
}
```

**About the range**: `[0, 0.3]` means the fade-in completes within the first 30% of the sprite, and opacity stays at 1 afterwards.

### 2. Slide in

```jsx
function SlideIn({ children, from = 'left' }) {
  const { t } = useSprite();
  const progress = interpolate(t, [0, 0.4], [0, 1], Easing.easeOut);
  const offset = (1 - progress) * 100;
  const directions = {
    left: `translateX(-${offset}px)`,
    right: `translateX(${offset}px)`,
    top: `translateY(-${offset}px)`,
    bottom: `translateY(${offset}px)`,
  };
  return (
    <div style={{
      transform: directions[from],
      opacity: progress,
    }}>
      {children}
    </div>
  );
}
```

### 3. Character-by-character typewriter

```jsx
function Typewriter({ text }) {
  const { t } = useSprite();
  const charCount = Math.floor(text.length * Math.min(t * 2, 1));
  return <span>{text.slice(0, charCount)}</span>;
}
```

### 4. Number counter

```jsx
function CountUp({ from = 0, to = 100, duration = 0.6 }) {
  const { t } = useSprite();
  const progress = interpolate(t, [0, duration], [0, 1], Easing.easeOut);
  const value = Math.floor(from + (to - from) * progress);
  return <span>{value.toLocaleString()}</span>;
}
```

### 5. Phased explainer (typical educational animation)

```jsx
function Scene() {
  return (
    <Stage duration={20}>
      {/* Phase 1: present the problem */}
      <Sprite start={0} end={4}>
        <Problem />
      </Sprite>

      {/* Phase 2: present the approach */}
      <Sprite start={4} end={10}>
        <Approach />
      </Sprite>

      {/* Phase 3: present the result */}
      <Sprite start={10} end={16}>
        <Result />
      </Sprite>

      {/* Caption that runs the whole way */}
      <Sprite start={0} end={20}>
        <Caption />
      </Sprite>
    </Stage>
  );
}
```

## Easing functions

Preset easing curves:

| Easing | Behavior | Use for |
|--------|------|------|
| `linear` | constant velocity | rolling subtitles, sustained motion |
| `easeIn` | slow -> fast | exits / disappearance |
| `easeOut` | fast -> slow | entrances / appearance |
| `easeInOut` | slow -> fast -> slow | position changes |
| **`expoOut`** ⭐ | **exponential ease-out** | **the Anthropic-grade primary easing** (a sense of physical weight) |
| **`overshoot`** ⭐ | **elastic snap-back** | **toggles / button pop / emphasized interactions** |
| `spring` | spring | interaction feedback, geometry settling into place |
| `anticipation` | reverses then proceeds | emphasized motions |

**Use `expoOut` as the default primary easing** (not `easeOut`) – see `animation-best-practices.md` §2.
Entrances use `expoOut`, exits use `easeIn`, toggles use `overshoot` – the foundational rule for Anthropic-grade animation.

## Pacing and duration guide

### Micro-interactions (0.1-0.3 seconds)
- Button hover
- Card expand
- Tooltip appearance

### UI transitions (0.3-0.8 seconds)
- Page changes
- Modal appearance
- List item insertion

### Narrative animation (2-10 seconds per segment)
- One phase of a concept explanation
- Data chart reveal
- Scene transition

### A single narrative animation segment should not exceed 10 seconds
Human attention is limited. Use 10 seconds to make one point, then move to the next.

## How to think about designing animations

### 1. Content / story first, animation second

**Wrong**: want to do a fancy animation first, then stuff content into it
**Right**: figure out what message you want to convey, then use animation to serve that message

Animation is **signal**, not **decoration**. A fade-in says "this matters, look here" – if everything fades in, the signal disappears.

### 2. Write the timeline by scenes

```
0:00 - 0:03   problem appears (fade in)
0:03 - 0:06   problem expands (zoom + pan)
0:06 - 0:09   solution arrives (slide in from right)
0:09 - 0:12   solution explained (typewriter)
0:12 - 0:15   result demonstrated (counter up + chart reveal)
0:15 - 0:18   one-line summary (static, 3 seconds to read)
0:18 - 0:20   CTA or fade out
```

Write the timeline first, components second.

### 3. Assets before motion

Images / icons / fonts that the animation needs should be ready **before** you start. Do not break your flow halfway through to hunt for assets.

## Common issues

**Animation stutters**
-> Usually layout thrashing. Use `transform` and `opacity`; do not animate `top`/`left`/`width`/`height`/`margin`. The browser GPU-accelerates `transform`.

**Animation too fast to read**
-> Reading one Chinese character takes 100-150ms, one word 300-500ms. If you are telling a story with text, leave each line on screen for at least 3 seconds.

**Animation too slow, viewers get bored**
-> Visual change should be dense. Static frames over 5 seconds get dull.

**Multiple animations interfering**
-> Use CSS `will-change: transform` to tell the browser the element will animate, reducing reflow.

**Recording to video**
-> Use the skill's bundled toolchain (one command produces three formats): see `video-export.md`
- `scripts/render-video.js` – HTML -> 25fps MP4 (Playwright + ffmpeg)
- `scripts/convert-formats.sh` – 25fps MP4 -> 60fps MP4 + optimized GIF
- Need more accurate frame rendering? Make `render(t)` a pure function – see `animation-pitfalls.md` rule 5

## How this combines with video tools

This skill produces **HTML animations** (run in the browser). If the final output is video material:

- **Short animations / concept demos**: build the HTML animation here -> screen record
- **Long videos / narratives**: this skill focuses on HTML animation; for long videos use an AI video-generation skill or professional video software
- **Motion graphics**: After Effects / Motion Canvas are more appropriate

## About Popmotion and similar libraries

If you really need physical animation (springs, decay, keyframes with precise timing) that our engine cannot handle, you can fall back to Popmotion:

```html
<script src="https://unpkg.com/popmotion@11.0.5/dist/popmotion.min.js"></script>
```

But **try our engine first**. It covers 90% of cases.
