# Animation Best Practices: positive grammar for animation design

> "Anthropic-grade" animation design rules, distilled from a deep teardown of the three official Anthropic
> product animations (Claude Design / Claude Code Desktop / Claude for Word).
>
> Read alongside `animation-pitfalls.md` (the anti-pattern checklist) - this file is "**do this**",
> pitfalls is "**do not do this**". The two are orthogonal; read both.
>
> **Constraint declaration**: this file documents only **motion logic and expressive style**, and does **not introduce any specific brand color values**.
> Color decisions go through the §1.a core-asset protocol (extracted from the brand spec) or through the "design direction advisor"
> (each of the 20 philosophies has its own palette). What this reference discusses is "**how it moves**", not "**what color**".

---

## §0 - Who you are: identity and taste

> Read this section before you read any of the technical rules below. Rules **emerge from identity** -
> not the other way around.

### §0.1 Identity anchor

**You are a motion designer who has studied the motion archives of Anthropic / Apple / Pentagram / Field.io.**

When you make animation, you are not tweaking a CSS transition - you are using digital elements to **simulate a physical world**, so that the audience's subconscious believes "these are objects with mass, inertia, and overshoot".

You do not make PowerPoint-style animation. You do not make "fade in fade out" animation. You make animation that **convinces people the screen is a space they could reach into**.

### §0.2 Core beliefs (3)

1. **Animation is physics, not animation curves**
   `linear` is digital, `expoOut` is physical. You believe the pixels on screen deserve to be treated as "objects".
   Every choice of easing answers the physical question "how heavy is this element, how high is its friction?"

2. **Time allocation matters more than curve shape**
   Slow-Fast-Boom-Stop is your breath. **Animation with even rhythm is a tech demo; animation with rhythm is narrative.**
   Slowing down at the right moment matters more than picking the right easing at the wrong moment.

3. **Yielding to the audience is harder than showing off**
   Holding for 0.5 seconds before a key result is **technique**, not compromise. **Letting the human brain have time to react is the highest virtue of an animator.**
   By default an AI will produce an animation with no pauses and information density pegged at the maximum - that is a beginner. What you do is restraint.

### §0.3 Taste standards: what is beautiful

This is how you judge "good" vs "great". Each row has an **identification method** - when you see a candidate animation, use these questions to decide whether it qualifies, instead of mechanically checking the 14 rules.

| Beauty dimension | Identification method (audience reaction) |
|---|---|
| **Sense of physical weight** | When the animation ends, the element "**lands**" stably - it does not just "**stop**" there. The audience subconsciously feels "this has weight" |
| **Yielding to the audience** | Before a key piece of information appears, there is a perceptible pause (>=300ms) - the audience has time to "**see**" before the next thing arrives |
| **Negative space / breathing room** | The ending is an abrupt cut + hold, not a fade to black. The final frame is clear, decisive, and conclusive |
| **Restraint** | The whole piece has only one moment of "120% polish"; the other 80% is just enough - **showing off everywhere is a cheap signal** |
| **Hand feel** | Arcs (not straight lines), irregularity (not the mechanical rhythm of setInterval), a sense of breathing |
| **Respect** | Show the tweak process, show the bug being fixed - **do not hide the work, do not sell "magic"**. AI is a collaborator, not a magician |

### §0.4 Self-check: the audience-first-reaction method

After you finish an animation, **what is the audience's first reaction when they finish watching?** That is the only metric you optimize for.

| Audience reaction | Grade | Diagnosis |
|---|---|---|
| "Looks pretty smooth" | good | Passes but unremarkable - you are making PowerPoint |
| "This animation flows well" | good+ | The technique is right, but it is not stunning |
| "This thing actually looks like it is **floating up off the desk**" | great | You hit physical weight |
| "This does not look like AI made it" | great+ | You hit the Anthropic threshold |
| "I want to **screenshot** this and post it" | great++ | You made the audience want to share it on their own |

**The difference between great and good is not technical correctness, it is taste**. Technically correct + taste-on-point = great.
Technically correct + no taste = good. Technically wrong = not even started.

### §0.5 The relationship between identity and rules

The technical rules in §1-§8 below are the **execution path** of this identity in concrete situations - they are not a standalone rule list.

- When a scene is not covered by the rules -> go back to §0 and judge by **identity**, do not guess
- When two rules conflict -> go back to §0 and use **taste standards** to decide which matters more
- When you want to break a rule -> first answer: "Does breaking it satisfy one of the beauty dimensions in §0.3?" If yes, break it; if not, do not.

Good. Read on.

---

## Overview: animation-as-physics in three layers

Most AI-generated animation feels cheap because **it behaves like "digits" rather than "objects"**.
Real-world objects have mass, inertia, elasticity, and overshoot. The "premium" feel of Anthropic's three videos comes from
giving digital elements a set of **physical-world motion rules**.

These rules have 3 layers:

1. **Narrative rhythm layer**: the time allocation of Slow-Fast-Boom-Stop
2. **Motion curve layer**: Expo Out / Overshoot / Spring - reject linear
3. **Expressive language layer**: show the process, mouse arcs, logo morph closure

---

## 1. Narrative rhythm: Slow-Fast-Boom-Stop 5-segment structure

All three Anthropic videos follow this structure without exception:

| Segment | Share | Pace | Function |
|---|---|---|---|
| **S1 trigger** | ~15% | slow | Give humans reaction time, establish realism |
| **S2 generation** | ~15% | medium | The visual wow moment lands |
| **S3 process** | ~40% | fast | Show controllability / density / detail |
| **S4 burst** | ~20% | Boom | Camera pulls back / 3D pop-out / multi-panel surge |
| **S5 closing** | ~10% | static | Brand logo + abrupt cut |

**Concrete duration mapping** (15 second animation example):
S1 trigger 2s - S2 generation 2s - S3 process 6s - S4 burst 3s - S5 closing 2s

**Forbidden**:
- ❌ Even rhythm (the same information density every second) - audience fatigue
- ❌ Sustained high density - no peaks, no memory hooks
- ❌ Tapering ending (fade out to transparent) - it should be **an abrupt cut**

**Self-check**: sketch 5 thumbnails on paper, one for the climax of each segment. If the 5 sketches look similar, the rhythm has not landed.

---

## 2. Easing philosophy: reject linear, embrace physics

Every motion in the three Anthropic videos uses bezier curves with a "damped" feel. The default cubic easeOut
(`1-(1-t)³`) is **not crisp enough** - the start is not fast enough and the stop is not stable enough.

### Three core easings (built into animations.jsx)

```js
// 1. Expo Out - rapid start, slow brake (most common - the default primary easing)
// CSS equivalent: cubic-bezier(0.16, 1, 0.3, 1)
Easing.expoOut(t) // = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

// 2. Overshoot - elastic toggle/button pop
// CSS equivalent: cubic-bezier(0.34, 1.56, 0.64, 1)
Easing.overshoot(t)

// 3. Spring physics - geometry settling, natural landing
Easing.spring(t)
```

### Usage mapping

| Scene | Which easing |
|---|---|
| Card rise-in / panel entrance / Terminal fade / focus overlay | **`expoOut`** (primary easing, most common) |
| Toggle switch / button pop / emphatic interaction | `overshoot` |
| Preview geometry settling / physical landing / UI element bounce | `spring` |
| Continuous motion (such as mouse trajectory interpolation) | `easeInOut` (preserves symmetry) |

### Counter-intuitive insight

Most product launch videos animate **too fast and too hard**. `linear` makes digital elements feel like machinery, `easeOut` is the baseline grade,
`expoOut` is the technical root of "premium feel" - it gives digital elements the **weight of the physical world**.

---

## 3. Motion language: 8 universal principles

### 3.1 Do not use pure black or pure white as the base

Not one of the three Anthropic videos uses `#FFFFFF` or `#000000` as its main background. **Tinted neutrals**
(warm or cool) carry the material feel of "paper / canvas / desktop", which dulls the machine feel.

**Concrete color values** are decided by the §1.a core-asset protocol (extracted from the brand spec) or the "design direction advisor"
(each of the 20 philosophies has its own background scheme). This reference does not give specific color values - that is a **brand decision**, not a motion rule.

### 3.2 Easing is never linear

See §2.

### 3.3 Slow-Fast-Boom-Stop narrative

See §1.

### 3.4 Show the "process", not the "magic result"

- Claude Design shows the tweak parameters, dragging sliders (not "one click and a perfect result")
- Claude Code shows code errors + AI repair (not "first try succeeds")
- Claude for Word shows the Redline red-strike / green-add edit process (not handing over a final document directly)

**Shared subtext**: the product is a **collaborator, a pair-programmer, a senior editor** - not a one-click magician.
This precisely lands on the professional user's pain points around "controllability" and "authenticity".

**Anti AI-slop**: the AI default is "magical one-click success" animation (one click -> perfect result), which is a generic common denominator.
**Do the opposite** - show the process, show the tweaks, show bugs and fixes - this is where brand recognition comes from.

### 3.5 Hand-drawn mouse trajectories (arcs + Perlin Noise)

Real human mouse movement is not a straight line - it is "ramp-up acceleration -> arc -> deceleration with correction -> click".
A mouse trajectory that AI interpolates as a straight line **causes subconscious rejection**.

```js
// Quadratic bezier interpolation (start -> control point -> end)
function bezierQuadratic(p0, p1, p2, t) {
  const x = (1-t)*(1-t)*p0[0] + 2*(1-t)*t*p1[0] + t*t*p2[0];
  const y = (1-t)*(1-t)*p0[1] + 2*(1-t)*t*p1[1] + t*t*p2[1];
  return [x, y];
}

// Path: start -> offset midpoint -> end (creates an arc)
const path = [[100, 100], [targetX - 200, targetY + 80], [targetX, targetY]];

// Layer in tiny Perlin Noise (±2px) to simulate "hand jitter"
const jitterX = (simpleNoise(t * 10) - 0.5) * 4;
const jitterY = (simpleNoise(t * 10 + 100) - 0.5) * 4;
```

### 3.6 Logo "morph closure"

In all three Anthropic videos, the logo does **not** simply fade in - it **morphs from the previous visual element**.

**Shared pattern**: in the final 1-2 seconds, run a Morph / Rotate / Converge so the entire narrative "collapses" onto the brand point.

**Low-cost implementation** (without a real morph):
Have the previous visual element "collapse" into a color block (scale -> 0.1, translate toward center),
then have the block "expand" into the wordmark. Use a 150ms snap with motion blur for the transition
(`filter: blur(6px)` -> `0`).

```js
<Sprite start={13} end={14}>
  {/* Collapse: previous element scales to 0.1, opacity stays, blur filter increases */}
  const scale = interpolate(t, [0, 0.5], [1, 0.1], Easing.expoOut);
  const blur = interpolate(t, [0, 0.5], [0, 6]);
</Sprite>
<Sprite start={13.5} end={15}>
  {/* Expand: logo scales 0.1 -> 1 from the block's center, blur 6 -> 0 */}
  const scale = interpolate(t, [0, 0.6], [0.1, 1], Easing.overshoot);
  const blur = interpolate(t, [0, 0.6], [6, 0]);
</Sprite>
```

### 3.7 Serif + sans-serif twin typefaces

- **Brand / voiceover**: serif (carries "academic feel / publication feel / taste")
- **UI / code / data**: sans-serif + monospaced

**A single typeface is wrong**. Serif gives "taste", sans-serif gives "function".

The actual typeface choices come from the brand spec (the Display / Body / Mono trio in brand-spec.md) or the design direction
advisor's 20 philosophies. This reference does not name typefaces - that is a **brand decision**.

### 3.8 Focus switch = background dim + foreground sharpen + flash guide

A focus switch is **not just** lowering opacity. The full recipe is:

```js
// Filter combination for non-focus elements
tile.style.filter = `
  brightness(${1 - 0.5 * focusIntensity})
  saturate(${1 - 0.3 * focusIntensity})
  blur(${focusIntensity * 4}px)        // <- the key: blur is what really makes them "step back"
`;
tile.style.opacity = 0.4 + 0.6 * (1 - focusIntensity);

// After focus completes, run a 150ms flash highlight at the focus position to guide the eye back
focusOverlay.animate([
  { background: 'rgba(255,255,255,0.3)' },
  { background: 'rgba(255,255,255,0)' }
], { duration: 150, easing: 'ease-out' });
```

**Why blur is mandatory**: with only opacity + brightness, out-of-focus elements are still "sharp", and there is no real
"step back into the depth" effect. Blur(4-8px) actually pushes the non-focus elements back a layer.

---

## 4. Concrete motion techniques (code snippets you can copy directly)

### 4.1 FLIP / Shared element transition

A button "expands" into an input box - **not** the button disappearing while a new panel appears. The core idea is **the same DOM element**
transitioning between two states, not two elements cross-fading.

```jsx
// Using Framer Motion layoutId
<motion.div layoutId="design-button">Design</motion.div>
// After click, same layoutId
<motion.div layoutId="design-button">
  <input placeholder="Describe your design..." />
</motion.div>
```

Native implementation reference: https://aerotwist.com/blog/flip-your-animations/

### 4.2 "Breathing" expansion (width then height)

A panel does **not** expand width and height simultaneously. Instead:
- First 40% of the time: only stretch width (keep height small)
- Last 60% of the time: keep width, push height

This simulates the physical-world feeling of "first unfold, then fill with water".

```js
const widthT = interpolate(t, [0, 0.4], [0, 1], Easing.expoOut);
const heightT = interpolate(t, [0.3, 1], [0, 1], Easing.expoOut);
style.width = `${widthT * targetW}px`;
style.height = `${heightT * targetH}px`;
```

### 4.3 Staggered fade-up (30ms stagger)

When a row of cells, a column of cards, or a list of items enters, **delay each element by 30ms**, with `translateY` from 10px back to 0.

```js
rows.forEach((row, i) => {
  const localT = Math.max(0, t - i * 0.03);  // 30ms stagger
  row.style.opacity = interpolate(localT, [0, 0.3], [0, 1], Easing.expoOut);
  row.style.transform = `translateY(${
    interpolate(localT, [0, 0.3], [10, 0], Easing.expoOut)
  }px)`;
});
```

### 4.4 Non-linear breathing - hold 0.5s before the key result

The machine executes fast and continuously, but **hold for 0.5 seconds before the key result appears**, so the audience's brain has time to react.

```jsx
// Typical scene: AI finishes generating -> hold 0.5s -> result floats in
<Sprite start={8} end={8.5}>
  {/* 0.5s pause - nothing animates, let the audience stare at the loading state */}
  <LoadingState />
</Sprite>
<Sprite start={8.5} end={10}>
  <ResultAppear />
</Sprite>
```

**Counter-example**: cutting seamlessly from "AI finished generating" straight to the result - the audience has no reaction time, the information is lost.

### 4.5 Chunk reveal: simulate streaming tokens

For AI-generated text, **do not use `setInterval` to drop one character at a time** (that is old-movie subtitling). Use **chunk reveal**
- emit 2-5 characters at a time, with irregular intervals, simulating a real token stream.

```js
// Split into chunks, not characters
const chunks = text.split(/(\s+|,\s*|\.\s*|;\s*)/);  // Split on word + punctuation boundaries
let i = 0;
function reveal() {
  if (i >= chunks.length) return;
  element.textContent += chunks[i++];
  const delay = 40 + Math.random() * 80;  // Irregular 40-120ms
  setTimeout(reveal, delay);
}
reveal();
```

### 4.6 Anticipation -> Action -> Follow-through

Three of Disney's 12 principles. Anthropic uses them very explicitly:

- **Anticipation**: a small reverse motion before the main action begins (button shrinks slightly before popping)
- **Action**: the main action itself
- **Follow-through**: a residual motion after the action ends (a card lands, then a faint bounce)

```js
// Full three-stage card entrance
const anticip = interpolate(t, [0, 0.2], [1, 0.95], Easing.easeIn);     // Anticipation
const action  = interpolate(t, [0.2, 0.7], [0.95, 1.05], Easing.expoOut); // Action
const settle  = interpolate(t, [0.7, 1], [1.05, 1], Easing.spring);       // Settle
// Final scale = product of the three, or applied piecewise
```

**Counter-example**: animation that has Action without Anticipation + Follow-through looks like "PowerPoint animation".

### 4.7 3D perspective + translateZ layering

For the "tilted 3D + floating cards" mood, give the container a perspective and give individual elements different translateZ values:

```css
.stage-wrap {
  perspective: 2400px;
  perspective-origin: 50% 30%;  /* Eye line tilted slightly down */
}
.card-grid {
  transform-style: preserve-3d;
  transform: rotateX(8deg) rotateY(-4deg);  /* The golden ratio */
}
.card:nth-child(3n) { transform: translateZ(30px); }
.card:nth-child(5n) { transform: translateZ(-20px); }
.card:nth-child(7n) { transform: translateZ(60px); }
```

**Why rotateX 8° / rotateY -4° is the golden ratio**:
- More than 10° -> the elements feel too distorted, looks like they are "falling over"
- Less than 5° -> looks like a "skew" rather than "perspective"
- The 8° x -4° asymmetric ratio simulates a "camera looking down at the desk from the upper-left corner" - a natural angle

### 4.8 Diagonal pan: move XY simultaneously

Camera motion is not pure up/down or pure left/right - **drive XY at the same time** to simulate diagonal movement:

```js
const panX = Math.sin(flowT * 0.22) * 40;
const panY = Math.sin(flowT * 0.35) * 30;
stage.style.transform = `
  translate(-50%, -50%)
  rotateX(8deg) rotateY(-4deg)
  translate3d(${panX}px, ${panY}px, 0)
`;
```

**Key**: the X and Y frequencies are different (0.22 vs 0.35) to avoid the regular Lissajous loop.

---

## 5. Scene recipes (three narrative templates)

The three reference videos correspond to three product personalities. **Pick the one that fits your product best** - do not mix.

### Recipe A - Apple Keynote dramatic (Claude Design family)

**Suited for**: major version launches, hero animation, visual wow first
**Rhythm**: Slow-Fast-Boom-Stop with a strong arc
**Easing**: `expoOut` throughout + a bit of `overshoot`
**SFX density**: high (~0.4/s), tune SFX pitch to the BGM scale
**BGM**: IDM / minimalist tech-electronic, calm + precise
**Closing**: rapid camera pull-back -> drop -> Logo morph -> ethereal single tone -> abrupt cut

### Recipe B - One-take tool (Claude Code family)

**Suited for**: developer tools, productivity apps, flow-state scenes
**Rhythm**: continuous steady flow, no obvious peaks
**Easing**: `spring` physics + `expoOut`
**SFX density**: **0** (rhythm of the cut is driven by BGM alone)
**BGM**: Lo-fi Hip-hop / Boom-bap, 85-90 BPM
**Core technique**: land key UI actions on the BGM kick/snare transients - "**musical groove as interaction SFX**"

### Recipe C - Office productivity narrative (Claude for Word family)

**Suited for**: enterprise software, document/spreadsheet/calendar categories, professionalism first
**Rhythm**: multi-scene hard cuts + Dolly In/Out
**Easing**: `overshoot` (toggle) + `expoOut` (panel)
**SFX density**: medium (~0.3/s), UI click is dominant
**BGM**: Jazzy Instrumental, minor key, BPM 90-95
**Core highlight**: one scene must contain "the highlight of the whole piece" - 3D pop-out / lifting off the plane

---

## 6. Counter-examples: doing this is AI slop

| Anti-pattern | Why it is wrong | Correct approach |
|---|---|---|
| `transition: all 0.3s ease` | `ease` is a cousin of linear, all elements move at the same pace | Use `expoOut` + per-element stagger |
| All entrances are `opacity 0->1` | No sense of motion direction | Pair with `translateY 10->0` + Anticipation |
| Logo fades in | No narrative closure | Morph / Converge / collapse-then-expand |
| Mouse moves in a straight line | Subconscious machine feel | Bezier arc + Perlin Noise |
| Typing one character at a time (setInterval) | Like old-movie subtitles | Chunk reveal, with random intervals |
| No hold before the key result | Audience has no reaction time | 0.5s hold before the result |
| Focus switch only changes opacity | Out-of-focus elements still sharp | opacity + brightness + **blur** |
| Pure black or pure white background | Cyber feel / glare fatigue | Tinted neutrals (drive from brand spec) |
| All animations move at the same speed | No rhythm | Slow-Fast-Boom-Stop |
| Fade-out closing | No sense of decision | Abrupt cut (hold the final frame) |

---

## 7. Self-check list (60 seconds before delivering an animation)

- [ ] Is the narrative structure Slow-Fast-Boom-Stop, not even rhythm?
- [ ] Is the default easing `expoOut`, not `easeOut` or `linear`?
- [ ] Are toggles / button pops using `overshoot`?
- [ ] Do card / list entrances have a 30ms stagger?
- [ ] Is there a 0.5s hold before the key result?
- [ ] Is typing using chunk reveal, not setInterval one-char?
- [ ] Does the focus switch include blur (not just opacity)?
- [ ] Is the logo a morph closure, not a fade-in?
- [ ] Is the background neither pure black nor pure white (tinted)?
- [ ] Does the type have a serif + sans-serif hierarchy?
- [ ] Is the closing an abrupt cut, not a fade out?
- [ ] (If there is a mouse) is the mouse trajectory an arc, not a straight line?
- [ ] Does the SFX density match the product personality (see recipes A/B/C)?
- [ ] Is there a 6-8dB loudness gap between BGM and SFX? (See `audio-design-rules.md`)

---

## 8. Relationship with other references

| Reference | Position | Relationship |
|---|---|---|
| `animation-pitfalls.md` | Technical pitfalls (16 entries) | "**Do not do this**" - the inverse of this file |
| `animations.md` | Stage/Sprite engine usage | The basics of **how to write** the animation |
| `audio-design-rules.md` | Two-track audio rules | Rules for **adding audio** to animation |
| `sfx-library.md` | 37 SFX inventory | The SFX **asset library** |
| `apple-gallery-showcase.md` | Apple gallery showcase style | A specific motion style, in depth |
| **This file** | Positive grammar for motion design | "**Do this**" |

**Calling order**:
1. Start with the four position questions in SKILL.md workflow Step 3 (decide narrative role and visual temperature)
2. Once a direction is chosen, read this file to lock in **motion language** (recipes A/B/C)
3. While writing code, refer to `animations.md` and `animation-pitfalls.md`
4. When exporting video, follow `audio-design-rules.md` + `sfx-library.md`

---

## Appendix: source materials for this file

- Anthropic official animation teardown: `reference-animations/BEST-PRACTICES.md` in the erfana project directory
- Anthropic audio teardown: `AUDIO-BEST-PRACTICES.md` in the same directory
- 3 reference videos: `ref-{1,2,3}.mp4` + the matching `gemini-ref-*.md` / `audio-ref-*.md`
- **Strict filtering**: this reference does not include any specific brand color values, typeface names, or product names.
  Color and typeface decisions go through the §1.a core-asset protocol or the 20 design philosophies.
