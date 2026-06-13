# Cinematic Patterns: best practices for workflow demo animations

> Five key patterns that take a workflow demo from "PowerPoint animation" to "keynote-grade cinematic".
> Distilled from the two cinematic demos in the April 2026 "let's talk about skills" deck (Nuwa workflow + Darwin workflow), tested and reproducible.

---

## 0 - What this document solves

When you need to animate "a demo of a workflow" (typical scenarios: skill workflow, product onboarding, API call flow, agent task execution), there are two common styles:

| Paradigm | What it looks like | Outcome |
|---|---|---|
| **PowerPoint animation** (bad) | step 1 fade in -> step 2 fade in -> step 3 fade in, with 4 boxes laid out on the same screen | The audience feels "this is just a PowerPoint with fade effects", no wow moment |
| **Cinematic** (good) | scene-based, focuses on one thing at a time, scenes connected by dissolve / focus pull / morph | The audience feels "this is a clip from a product keynote" and wants to screenshot and share |

The difference is **not animation technique** - it is **narrative paradigm**. This document explains how to upgrade from the former to the latter.

---

## 1 - The five core patterns

### Pattern A - Dashboard + cinematic overlay two-layer structure

**Problem**: a pure cinematic defaults to a black screen with a single ▶ button. If the user lands on the page and does not click, they see nothing.

**Solution**:
```
DEFAULT state (always visible): full static workflow dashboard
  └── At a glance, the audience can see how this skill / workflow runs

POINT ▶ trigger (overlay floats up): 22 second cinematic
  └── When it finishes, fade back to DEFAULT automatically

```

**Implementation notes**:
- `.dash` is visible by default; `.cinema` defaults to `opacity: 0; pointer-events: none`
- `.play-cta` is a small gold button in the bottom-right corner (not a giant centered overlay)
- On click: `cinema.classList.add('show')` + `dash.classList.add('hide')`
- Drive it with one `requestAnimationFrame` pass (not a loop). When done, `endCinematic()` reverses the state.

**Anti-pattern**: defaulting to a giant centered ▶ overlay that covers everything, leaving the page blank until clicked.

---

### Pattern B - Scene-based, NOT step-based

**Problem**: breaking the animation into "step 1 appears -> step 2 appears -> ..." is PowerPoint thinking.

**Solution**: break it into 5 scenes, where each scene is an **independent shot** that takes over the full screen and focuses on one thing:

| Scene type | Job | Duration |
|---|---|---|
| 1 - Invoke | User input triggers the flow (terminal typewriter) | 3-4s |
| 2 - Process | Visualize the core workflow (with its own visual language) | 5-6s |
| 3 - Result/Insight | The key insight extracted from the process (visualized) | 4-5s |
| 4 - Output | Show the actual deliverable (file / diff / numbers) | 3-4s |
| 5 - Hero Reveal | Closing hero moment (large type + value proposition) | 4-5s |

**Total ~22 seconds** - this is the tested golden length:
- Shorter than 18 seconds: the PM has not warmed up before it ends
- Longer than 25 seconds: they lose patience
- 22 seconds is just enough to "hook -> unfold -> close -> leave an impression"

**Implementation notes**:
- `T = { DURATION: 22.0, s1_in: [0, 0.7], s2_in: [3.8, 4.6], ... }` is the global timeline
- One `requestAnimationFrame(render)` drives every scene's opacity / transform calculation
- Do not chain setTimeouts (easy to break, hard to debug)
- Easing must use `expoOut` / `easeOut` / a cubic-bezier - **linear is forbidden**

---

### Pattern C - Each demo's visual language must be independent

**Problem**: after the first cinematic ships, you cut a corner on the second one by reusing the same template (same orbit + pentagon + typewriter + hero typography), only swapping the copy.

**Consequence**: the audience sees that the two skills "look identical", which effectively says "these two skills are the same".

**Solution**: every workflow has a different core metaphor, so the visual language must be different.

**Side-by-side example**:

| Dimension | Nuwa (distillation) | Darwin (skill optimization) |
|---|---|---|
| Core metaphor | Collect -> distill -> write | Loop -> evaluate -> ratchet |
| Visual motion | Float / radiate / pentagon | Loop / ascend / compare |
| Scene 2 | 3D Orbit - 8 archive cards floating along a perspective ellipse | Spin Loop - tokens running 5 laps along a 6-node ring |
| Scene 3 | Pentagon - 5 tokens radiating from the center | v1 vs v5 - side-by-side diff (red version vs gold version) |
| Scene 4 | SKILL.md typewriter | Hill-Climb - full-screen curve drawn in |
| Scene 5 hero | "21 minutes" big serif italic | Spinning gear ⚙ + gold "KEPT +1.1" tag |

**Test**: cover the copy. Looking at the visuals alone, can you tell which demo is which? If you cannot, you cut a corner.

---

### Pattern D - Use real AI-generated assets, not emoji or hand-drawn SVG

**Problem**: a 3D orbit or gallery needs floating asset fragments. Emoji (📚🎤) are ugly and off-brand; hand-drawn SVG book spines never feel like real books.

**Solution**: use `erfana-gpt-image` to generate one 4x2 grid image (8 thematic objects, white background, 60px breathing space, unified style), then use `extract_grid.py --mode bbox` to cut it into 8 separate transparent PNGs.

**Prompt notes** (detailed prompt patterns live in the `erfana-gpt-image` skill):
- IP anchoring ("1960s Caltech archive aesthetic" / "Hearthstone-style consistent treatment")
- White background (easier to cut out; gray backgrounds look great in atmosphere but are hard to make transparent)
- 4x2 not 5x5 (avoids the bug where the bottom row gets compressed)
- Persona finishing ("You are a Wired magazine curator preparing an exhibition photo")

**Anti-pattern**: using emoji as icons, or CSS silhouettes in place of product images.

---

### Pattern E - BGM + SFX two-track audio

**Problem**: animation alone, no sound, gives the audience a subconscious feeling of "this thing looks like a cheap demo".

**Solution**: a long BGM track plus 11 SFX cues.

**Generic SFX cue recipe** (suitable for workflow demos):

| Time | SFX | Trigger scene |
|---|---|---|
| 0.10s | whoosh | Terminal rises from below |
| 3.0s | enter | Typewriter completes, enter pressed |
| 4.0s | slide-in | Scene 2 elements enter |
| 5-9s x 5 | sparkle | Key process beats (each generation / each token / each data point) |
| 14s | click | Switch to the output scene |
| 17.8s | logo-reveal | Hero reveal moment |
| typewriter | type | Fired every 2 characters (do not let the density get too high) |

**Frequency separation**: BGM volume 0.32 (low-frequency floor), SFX volume 0.55 (mid-high frequency punch), sparkle 0.7 (must stand out), logo-reveal 0.85 (the strongest hero moment).

**User control**:
- A ▶ start overlay is mandatory (browser autoplay restrictions)
- A small mute button in the top-right corner (the user can mute at any time)
- Do not make the audio play forcibly the moment the page is opened

---

## 2 - Static dashboard design notes

The dashboard is Layer 1 of the two-layer structure. Even if the PM never clicks ▶, they should still understand the skill.

**Layout**: 3-column grid (or 1 large + 2 small), where each panel answers one question:

| Panel type | Question it answers | Example |
|---|---|---|
| **Pipeline / flow diagram** | "What is the workflow of this skill?" | Nuwa 4-stage pipeline - Darwin autoresearch loop |
| **Snapshot / state** | "What does the actual data look like?" | Darwin 8-dimension rubric snapshot |
| **Trajectory / evolution** | "How does it change across multiple runs?" | Darwin 5-generation hill-climb curve |
| **Examples / gallery** | "What has it produced already?" | Nuwa 21 personas gallery |
| **Strip - example I/O** | "What goes in -> what comes out" | Nuwa example strip: `> nuwa distill feynman -> feynman.skill (21 min)` |

**Key constraints**:
- Information density must be sufficient (every panel must carry distinctive information)
- But do not stuff in data slop (every number must mean something)
- The palette must match the cinematic (same family, so the transition does not jar)

---

## 3 - Debugging and dev tools

Any long animation must come with three dev tools, otherwise debugging will explode.

### Tool 1 - `?seek=N` to freeze at second N

```js
const seek = parseFloat(params.get('seek'));
if (!isNaN(seek)) {
  started = true; muted = true;
  frozenT = seek;  // render() uses this t instead of elapsed
  cinema.classList.add('show'); dash.classList.add('hide');
}

// Inside render():
let t = frozenT !== null ? frozenT : (elapsed % T.DURATION);
```

Usage: `http://.../slide.html?seek=12` jumps straight to second 12 without waiting for playback.

### Tool 2 - `?autoplay=1` to skip the ▶ overlay

Convenient for Playwright auto-screenshot tests, and for force-starting when embedded in an iframe.

### Tool 3 - Manual REPLAY button

A small button in the top-right corner. Users and debuggers can replay any number of times. CSS:

```css
.replay{position:absolute;top:18px;right:18px;background:rgba(212,165,116,0.1);
  border:1px solid rgba(212,165,116,0.3);color:#D4A574;
  font-family:monospace;font-size:10px;letter-spacing:.28em;text-transform:uppercase;
  padding:6px 12px;border-radius:1px;cursor:pointer;backdrop-filter:blur(6px);z-index:6}
```

---

## 4 - iframe embedding gotchas (if the cinematic lives in a deck)

### Pitfall 1 - The parent window's click zone intercepts iframe buttons

If the deck's index.html adds "left/right 22vw transparent click zones for paging", they **cover the ▶ play button inside the iframe** - the user clicks the button and it gets swallowed as "next slide".

**Fix**: give the click zones `top: 12vh; bottom: 25vh`, leaving the top and bottom 25% uncovered, so both the centered ▶ and the bottom-right ▶ inside the iframe are clickable.

### Pitfall 2 - iframe steals focus and the parent loses keyboard events

Once the user has clicked into the iframe, focus is inside it, and the parent window stops receiving ←/→ keyboard events.

**Fix**:
```js
iframe.addEventListener('load', () => {
  // Inject a keyboard forwarder
  const doc = iframe.contentDocument;
  doc.addEventListener('keydown', (e) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, ... }));
  });
  // Pull focus back to the parent on click
  doc.addEventListener('click', () => setTimeout(() => window.focus(), 0));
});
```

### Pitfall 3 - file:// vs https:// behavior differences

A cinematic that worked under file:// can break after deployment, because:
- Under file://, iframe contentDocument is same-origin
- Under https://, it is also same-origin (if same host), but audio autoplay restrictions are stricter

**Fix**:
- Before deployment, run `python3 -m http.server` locally and test once over HTTP
- BGM must call `bgm.play()` only after the user clicks ▶ - never on page load

---

## 5 - Anti-pattern quick reference

| ❌ Anti-pattern | ✓ Correct pattern |
|---|---|
| Default = black screen with a ▶ overlay | Default = static dashboard, with ▶ as a helper |
| 4 steps lined up across the screen, fade in | 5 scenes that take over the full screen, each focusing on one thing |
| Reuse the template and just swap copy across demos | Each demo gets its own visual language (you can tell them apart with the copy hidden) |
| Emoji or hand-drawn SVG as assets | gpt-image-2 grid + extract_grid cutout |
| No BGM, no SFX | BGM + 11 SFX cues two-track |
| Schedule with a setTimeout chain | requestAnimationFrame + a global timeline `T` object |
| linear animation | Expo / cubic-bezier easing |
| No dev tools | `?seek=N` + `?autoplay=1` + REPLAY button |
| iframe button swallowed by parent click zone | Add top/bottom margin to the click zone so buttons survive |

---

## 6 - Time budget

Following these patterns, a complete cinematic demo (with dashboard) costs roughly:

| Task | Time |
|---|---|
| Design the 5-scene narrative + visual language | 30 minutes (be deliberate - this decides independence) |
| Static dashboard layout + content | 1 hour |
| Cinematic 5 scenes implementation | 1.5 hours |
| Audio cue timing + replay button | 30 minutes |
| Playwright screenshot verification of 5 key moments | 15 minutes |
| **Total per demo** | **3-4 hours** |

The second demo can reuse the framework, but its **visual language must be independent** - around 2-3 hours.
