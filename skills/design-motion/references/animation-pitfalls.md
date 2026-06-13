# Animation Pitfalls: HTML animation incidents and rules

The bugs you hit most often when building animations, and how to avoid them. Every rule comes from a real failure case.

Read this before writing animation code – it will save you a round of iteration.

## 1. Stacking layout – `position: relative` is your default duty

**The incident**: a sentence-wrap element contained 3 bracket-layer children (`position: absolute`). Because `position: relative` was not set on sentence-wrap, the absolute brackets used `.canvas` as their coordinate system and drifted 200px below the bottom of the viewport.

**Rule**:
- Any container that holds `position: absolute` children **must** explicitly declare `position: relative`
- Even if you do not visually need any "offset", still write `position: relative` as a coordinate-system anchor
- When you write `.parent { ... }` and any of its children carry `.child { position: absolute }`, reflexively add `relative` to the parent

**Quick check**: for every `position: absolute`, walk up the ancestor chain and confirm the nearest positioned ancestor is the coordinate system you actually want.

## 2. Character traps – do not rely on rare Unicode

**The incident**: I wanted to use `␣` (U+2423 OPEN BOX) to visualize a "space token". Neither Noto Serif SC nor Cormorant Garamond ships that glyph, so it rendered as blank / a tofu box, and viewers could not see it at all.

**Rule**:
- **Every character that appears in the animation must exist in the font you have chosen**
- Common rare-character blacklist: `␣ ␀ ␐ ␋ ␨ ↩ ⏎ ⌘ ⌥ ⌃ ⇧ ␦ ␖ ␛`
- To express meta-characters like "space / return / tab", use a **CSS-constructed semantic box** instead:
  ```html
  <span class="space-key">Space</span>
  ```
  ```css
  .space-key {
    display: inline-flex;
    padding: 4px 14px;
    border: 1.5px solid var(--accent);
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.3em;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
  ```
- Verify emoji too: some emoji fall back to a grey square outside Noto Emoji, so prefer an `emoji` font-family or SVG

## 3. Data-driven Grid/Flex templates

**The incident**: the code declared `const N = 6` tokens, but the CSS hardcoded `grid-template-columns: 80px repeat(5, 1fr)`. The 6th token had no column, and the entire matrix shifted out of place.

**Rule**:
- When count comes from a JS array (`TOKENS.length`), the CSS template should be data-driven too
- Option A: inject a CSS variable from JS
  ```js
  el.style.setProperty('--cols', N);
  ```
  ```css
  .grid { grid-template-columns: 80px repeat(var(--cols), 1fr); }
  ```
- Option B: use `grid-auto-flow: column` and let the browser expand automatically
- **Forbid the "fixed number + JS constant" combination** – when N changes, the CSS will not stay in sync

## 4. Transition gaps – scene changes must be continuous

**The incident**: between zoom1 (13-19s) and zoom2 (19.2-23s), the main sentence was already hidden, zoom1 fade out (0.6s) + zoom2 fade in (0.6s) + stagger delay (0.2s+) = roughly 1 second of pure blank screen. Viewers thought the animation had frozen.

**Rule**:
- When chaining scene changes, fade out and fade in must **cross-overlap** rather than the previous one fully disappearing before the next begins
  ```js
  // Bad:
  if (t >= 19) hideZoom('zoom1');      // 19.0s out
  if (t >= 19.4) showZoom('zoom2');    // 19.4s in -> 0.4s of blank in between

  // Good:
  if (t >= 18.6) hideZoom('zoom1');    // start fade out 0.4s earlier
  if (t >= 18.6) showZoom('zoom2');    // fade in at the same time (cross-fade)
  ```
- Or use an "anchor element" (such as the main sentence) as the visual link between scenes – it briefly reappears during the zoom switch
- Calculate the CSS transition duration carefully so you do not trigger the next transition before the current one finishes

## 5. Pure-render principle – animation state must be seekable

**The incident**: I used `setTimeout` + `fireOnce(key, fn)` to chain animation state. Normal playback was fine, but when frame-by-frame recording or seeking to an arbitrary point in time, any setTimeout that had already fired could not "go back in time".

**Rule**:
- Ideally, `render(t)` is a **pure function**: given `t`, it produces a unique DOM state
- If you must use side effects (such as toggling classes), use a `fired` set together with an explicit reset:
  ```js
  const fired = new Set();
  function fireOnce(key, fn) { if (!fired.has(key)) { fired.add(key); fn(); } }
  function reset() { fired.clear(); /* clear all .show classes */ }
  ```
- Expose `window.__seek(t)` for Playwright / debugging:
  ```js
  window.__seek = (t) => { reset(); render(t); };
  ```
- Animation-related setTimeouts should not span >1 second, otherwise seeking backwards will produce a mess

## 6. Measuring before fonts load = measuring wrong

**The incident**: as soon as the page hit DOMContentLoaded, I called `charRect(idx)` to measure bracket positions. Fonts had not loaded yet, so each character had the width of the fallback font and every position was wrong. Once the fonts loaded (about 500ms later), the bracket's `left: Xpx` still held the old value – a permanent offset.

**Rule**:
- Any layout code that depends on DOM measurement (`getBoundingClientRect`, `offsetWidth`) **must** be wrapped inside `document.fonts.ready.then()`
  ```js
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => {
      buildBrackets(...);  // fonts are ready, measurements are accurate
      tick();              // animation starts
    });
  });
  ```
- The extra `requestAnimationFrame` gives the browser one frame to commit layout
- If you use the Google Fonts CDN, add `<link rel="preconnect">` to speed up first load

## 7. Recording prep – leave hooks for video export

**The incident**: Playwright's `recordVideo` defaults to 25fps and starts recording the moment the context is created. The first 2 seconds of page load and font load got captured. The delivered video had 2 seconds of blank/white-flash at the front.

**Rule**:
- Use the `render-video.js` helper: warmup navigate -> reload to restart the animation -> wait for duration -> ffmpeg trim head + transcode to H.264 MP4
- The animation's **frame 0** must be the complete initial state with final layout already in place (not blank or loading)
- Want 60fps? Use ffmpeg `minterpolate` post-processing – do not depend on the browser source frame rate
- Want a GIF? Two-pass palette (`palettegen` + `paletteuse`) compresses a 30s 1080p animation down to 3MB

See `video-export.md` for the full script invocation.

## 8. Batch export – tmp directories must include the PID to avoid concurrency conflicts

**The incident**: I ran `render-video.js` in 3 parallel processes to record 3 HTML files. Because TMP_DIR was named only with `Date.now()`, when 3 processes started in the same millisecond they all shared the same tmp directory. The first process to finish cleaned up tmp, the other two got `ENOENT` reading the directory, and everything crashed.

**Rule**:
- Any temporary directory that multiple processes might share must be named with **PID or a random suffix**:
  ```js
  const TMP_DIR = path.join(DIR, '.video-tmp-' + Date.now() + '-' + process.pid);
  ```
- If you really want multi-file parallelism, use shell `&` + `wait` rather than forking from inside one Node script
- For batch recording multiple HTMLs, the safe default is **serial** (up to 2 in parallel is fine; 3 or more, queue them up)

## 9. Progress bars / replay buttons in the recording – Chrome elements polluting the video

**The incident**: the animation HTML had a `.progress` bar, a `.replay` button, and a `.counter` timestamp to make playback easy for human debugging. When recorded as MP4 and delivered, those elements showed up at the bottom of the video, as if developer tools had been screenshot in.

**Rule**:
- Manage "chrome elements" that exist for humans (progress bar / replay button / footer / masthead / counter / phase labels) separately from the actual video content
- **Convention class name** `.no-record`: any element with this class is hidden automatically by the recording script
- The recording script (`render-video.js`) injects CSS by default to hide the common chrome class names:
  ```
  .progress .counter .phases .replay .masthead .footer .no-record [data-role="chrome"]
  ```
- Inject via Playwright's `addInitScript` (it takes effect before every navigate, including reloads)
- If you want to view the raw HTML (with chrome) add the `--keep-chrome` flag

## 10. Animation repeating in the first few seconds of the recording – warmup frame leak

**The incident**: the old `render-video.js` flow was `goto -> wait fonts 1.5s -> reload -> wait duration`. Recording started the moment the context was created, so the warmup phase already played part of the animation, then the reload restarted from 0. The result was the first few seconds of video showed "animation mid-section + cut + animation from 0", with a strong sense of repetition.

**Rule**:
- **Warmup and Record must use independent contexts**:
  - Warmup context (no `recordVideo` option): only loads the URL, waits for fonts, then closes
  - Record context (with `recordVideo`): starts in a fresh state, the animation records from t=0
- ffmpeg `-ss trim` can only chop a tiny bit of Playwright's startup latency (~0.3s); it **cannot** mask warmup frames – the source has to be clean
- Closing the record context = the WebM file is flushed to disk; that is a Playwright constraint
- The relevant code pattern:
  ```js
  // Phase 1: warmup (throwaway)
  const warmupCtx = await browser.newContext({ viewport });
  const warmupPage = await warmupCtx.newPage();
  await warmupPage.goto(url, { waitUntil: 'networkidle' });
  await warmupPage.waitForTimeout(1200);
  await warmupCtx.close();

  // Phase 2: record (fresh)
  const recordCtx = await browser.newContext({ viewport, recordVideo });
  const page = await recordCtx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(DURATION * 1000);
  await page.close();
  await recordCtx.close();
  ```

## 11. Do not draw "fake chrome" inside the canvas – decorative player UI clashes with real chrome

**The incident**: the animation used the `Stage` component, which already provides a scrubber + timecode + pause button (categorized as `.no-record` chrome and hidden automatically on export). I then drew a "magazine page-number style decorative progress bar" reading "`00:60 ──── CLAUDE-DESIGN / ANATOMY`" along the bottom and felt very pleased with myself. **Result**: the user saw two progress bars – one from the Stage controller and one I had drawn. They clashed visually and were flagged as a bug. "Why is there a second progress bar inside the video?"

**Rule**:

- The Stage already provides scrubber + timecode + pause/replay buttons. **Do not draw** progress indicators, current timecodes, copyright bylines, or chapter counters inside the canvas – they will either clash with chrome or be filler slop (violating the "earn its place" principle).
- "Page-number feel", "magazine feel", "bottom byline strip" – these **decorative urges** are high-frequency filler that AI adds automatically. Stay alert every time one shows up: does it actually communicate irreplaceable information, or just fill empty space?
- If you are convinced a bottom strip must exist (for instance, when the animation's subject is player UI itself), it must be **narratively necessary** and **visually distinct from the Stage scrubber** (different position, different form, different tone).

**Element ownership test** (every element drawn into the canvas must answer this):

| What does it belong to | Action |
|------------|------|
| Narrative content of a specific scene | OK, keep it |
| Global chrome (control / debug) | Add the `.no-record` class, hidden on export |
| **Belongs to no scene and is not chrome** | **Delete it.** This is an orphan and is necessarily filler slop |

**Self-check (3 seconds before delivery)**: take a static screenshot and ask –

- Is there anything in the frame that "looks like video player UI" (horizontal progress bar, timecode, control button shapes)?
- If yes, would deleting it harm the narrative? If no, delete.
- Has the same kind of information (progress / time / byline) appeared twice? Merge it into a single chrome location.

**Counter-examples**: drawing `00:42 ──── PROJECT NAME` along the bottom, drawing "CH 03 / 06" chapter counters in the bottom right, drawing a version number "v0.3.1" along the edge – all of these are fake-chrome filler.

## 12. Pre-recording blank + recording start offset – the `__ready` x tick x lastTick triple trap

**The incident (A · pre-recording blank)**: a 60-second animation exported to MP4 has 2-3 seconds of blank page at the front. `ffmpeg --trim=0.3` cannot remove it.

**The incident (B · start offset, real incident on 2026-04-20)**: a 24-second video export. The user perceived "the video does not start playing the first frame until second 19". What actually happened: the animation started recording at t=5, recorded until t=24, looped back to t=0, and recorded another 5 seconds to the end – so the last 5 seconds of video were the actual beginning of the animation.

**Root cause** (both incidents share one root cause):

Playwright's `recordVideo` starts writing WebM the moment `newContext()` is called. At that point Babel/React/font loading consume L seconds (2-6s). The recording script waits for `window.__ready = true` as the "animation begins here" anchor – it must be strictly paired with the animation's `time = 0`. Two common mistakes:

| Mistake | Symptom |
|------|------|
| `__ready` set in `useEffect` or in synchronous setup (before tick's first frame) | The recording script thinks the animation has begun, but WebM is still recording a blank page -> **leading blank** |
| Tick's `lastTick = performance.now()` initialized at the **top of the script** | The L seconds of font loading are counted into the first-frame `dt`, `time` jumps instantly to L -> the entire recording is L seconds late -> **start offset** |

**The full correct starter-tick template** (hand-written animations must use this skeleton):

```js
// ────── state ──────
let time = 0;
let playing = false;   // ! defaults to not playing, only start once fonts are ready
let lastTick = null;   // ! sentinel – on the first tick frame, dt is forced to 0 (do not use performance.now())
const fired = new Set();

// ────── tick ──────
function tick(now) {
  if (lastTick === null) {
    lastTick = now;
    window.__ready = true;   // pair: "recording start" with "animation t=0" on the same frame
    render(0);               // render once more to ensure DOM is ready (fonts are now ready)
    requestAnimationFrame(tick);
    return;
  }
  const dt = (now - lastTick) / 1000;   // dt only starts advancing after the first frame
  lastTick = now;

  if (playing) {
    let t = time + dt;
    if (t >= DURATION) {
      t = window.__recording ? DURATION - 0.001 : 0;  // do not loop while recording, leave 0.001s to keep the final frame
      if (!window.__recording) fired.clear();
    }
    time = t;
    render(time);
  }
  requestAnimationFrame(tick);
}

// ────── boot ──────
// Do not rAF immediately at the top level – wait for fonts to load
document.fonts.ready.then(() => {
  render(0);                 // paint the initial frame (fonts are ready)
  playing = true;
  requestAnimationFrame(tick);  // the first tick will pair __ready + t=0
});

// ────── seek interface (for render-video defensive correction) ──────
window.__seek = (t) => { fired.clear(); time = t; lastTick = null; render(t); };
```

**Why this template is correct**:

| Step | Why it must be this way |
|------|-------------|
| `lastTick = null` + first-frame `return` | Avoids charging the L seconds between "script load and tick first execution" against animation time |
| `playing = false` by default | While fonts load, even if `tick` runs, `time` does not advance, so render does not jump |
| `__ready` set on the first tick frame | The recording script starts its clock at this moment, and the corresponding frame is the animation's true t=0 |
| Tick is started inside `document.fonts.ready.then(...)` | Avoids font-fallback-width measurement and avoids first-frame font snap |
| `window.__seek` exists | Lets `render-video.js` actively correct – the second line of defense |

**Defenses on the recording script side**:
1. `addInitScript` to inject `window.__recording = true` (before page goto)
2. `waitForFunction(() => window.__ready === true)`, record this offset for ffmpeg trim
3. **Additionally**: after `__ready`, actively `page.evaluate(() => window.__seek && window.__seek(0))` to force any HTML time drift back to zero – the second line of defense, against HTML that does not strictly follow the starter template

**How to verify**: after exporting the MP4
```bash
ffmpeg -i video.mp4 -ss 0 -vframes 1 frame-0.png
ffmpeg -i video.mp4 -ss $DURATION-0.1 -vframes 1 frame-end.png
```
The first frame must be the animation's t=0 initial state (not the middle, not black), and the last frame must be the animation's final state (not some moment from a second loop).

**Reference implementation**: `assets/animations.jsx` Stage component and `scripts/render-video.js` are both implemented to this protocol. Hand-written HTML must apply the starter-tick template – every line in it defends against a specific bug.

## 13. Disable looping while recording – the `window.__recording` signal

**The incident**: the animation Stage defaults to `loop=true` (convenient for browser previewing). `render-video.js` waits an extra 300ms buffer after the duration before stopping, and those 300ms let Stage enter its next loop. When ffmpeg `-t DURATION` truncates, the last 0.5-1s falls into the next loop – the video's end suddenly snaps back to frame 1 (Scene 1) and viewers think the video has a bug.

**Root cause**: there is no "I am recording" handshake between the recording script and the HTML. The HTML does not know it is being recorded and keeps looping like a normal browser interaction.

**Rule**:

1. **Recording script**: inject `window.__recording = true` via `addInitScript` (before page goto):
   ```js
   await recordCtx.addInitScript(() => { window.__recording = true; });
   ```

2. **Stage component**: detect this signal and force loop=false:
   ```js
   const effectiveLoop = (typeof window !== 'undefined' && window.__recording) ? false : loop;
   // ...
   if (next >= duration) return effectiveLoop ? 0 : duration - 0.001;
   //                                                       ^ leave 0.001 so a Sprite with end=duration is not turned off
   ```

3. **The fadeOut on the final Sprite**: in recording mode, set `fadeOut={0}`, otherwise the video's final frame fades to transparent/dark – the user expects to land on a clear last frame, not a fade-out. For hand-written HTML, set the final Sprite to `fadeOut={0}`.

**Reference implementation**: `assets/animations.jsx` Stage / `scripts/render-video.js` ship the handshake. Hand-written Stages must implement `__recording` detection – otherwise this incident is guaranteed.

**Verification**: after exporting the MP4, `ffmpeg -ss 19.8 -i video.mp4 -frames:v 1 end.png` and check whether the last 0.2 seconds is still the expected final frame, with no abrupt switch to another scene.

## 14. 60fps video defaults to frame duplication – minterpolate compatibility is poor

**The incident**: `convert-formats.sh` produced a 60fps MP4 with `minterpolate=fps=60:mi_mode=mci...`, but on some versions of macOS QuickTime / Safari the file refused to open (black screen or hard refusal). VLC and Chrome could open it.

**Root cause**: minterpolate's H.264 elementary stream contains certain SEI / SPS fields that some players struggle to parse.

**Rule**:

- Default 60fps should use the simple `fps=60` filter (frame duplication) – broad compatibility (QuickTime/Safari/Chrome/VLC all open it)
- For high-quality interpolation use the `--minterpolate` flag explicitly – but you **must test it locally** against the target player before delivery
- The value of the 60fps tag is **the upload platform's algorithmic recognition** (Bilibili / YouTube prioritize 60fps-tagged uploads); the actual perceived smoothness improvement for CSS animation is tiny
- Add `-profile:v high -level 4.0` to improve general H.264 compatibility

**`convert-formats.sh` now defaults to compatibility mode**. If you need high-quality interpolation, add the `--minterpolate` flag:
```bash
bash convert-formats.sh input.mp4 --minterpolate
```

## 15. The `file://` + external `.jsx` CORS trap – single-file deliverables must inline the engine

**The incident**: the animation HTML used `<script type="text/babel" src="animations.jsx"></script>` to load the engine externally. Double-click to open locally (`file://` protocol) -> Babel Standalone fetches `.jsx` via XHR -> Chrome reports `Cross origin requests are only supported for protocol schemes: http, https, chrome, chrome-extension...` -> the page is fully black, no `pageerror` is thrown, only a console error – very easy to misdiagnose as "the animation did not trigger".

Starting an HTTP server may not save you either – if you have a global proxy configured, `localhost` may also route through the proxy and return 502 / connection failure.

**Rule**:

- **Single-file deliverable (an HTML you can double-click)** -> `animations.jsx` must be **inlined** inside a `<script type="text/babel">...</script>` tag, not loaded via `src="animations.jsx"`
- **Multi-file project (demoed via an HTTP server)** -> external loading is fine, but state the `python3 -m http.server 8000` command clearly in the deliverable
- The decision criterion: are you delivering an "HTML file" or "a project directory served by a server"? Inline for the former
- Stage component / animations.jsx is often 200+ lines – pasting it inside an HTML `<script>` block is perfectly acceptable; do not worry about size

**Minimal verification**: double-click the HTML you generated – do **not** open it through any server. If Stage shows the first frame of the animation correctly, you are good.

## 16. Cross-scene contrast contexts – do not hardcode colors on canvas elements

**The incident**: in a multi-scene animation, elements that **appear across every scene** like `ChapterLabel` / `SceneNumber` / `Watermark` had `color: '#1A1A1A'` (dark text) hardcoded inside their components. The first 4 light-background scenes were fine, but in the 5th black-background scene the "05" and the watermark vanished – no error, no check triggered, critical info became invisible.

**Rule**:

- **In-canvas elements reused across multiple scenes** (chapter label / scene number / timecode / watermark / copyright strip) **must not hardcode color values**
- Use one of three approaches:
  1. **`currentColor` inheritance**: the element only writes `color: currentColor`, and the parent scene container sets `color: <computed value>`
  2. **`invert` prop**: the component accepts `<ChapterLabel invert />` to manually toggle light/dark
  3. **Compute automatically from background**: `color: contrast-color(var(--scene-bg))` (CSS 4 API; or judge in JS)
- Before delivery, use Playwright to grab a representative frame from **every scene** and let a human eye verify cross-scene elements are visible everywhere

The trickiness of this incident is that **there is no bug alarm**. Only a human eye or OCR can catch it.

## Quick self-check (5 seconds before starting work)

- [ ] Does every parent of a `position: absolute` element have `position: relative`?
- [ ] Do the special characters in the animation (`␣` `⌘` `emoji`) all exist in the chosen font?
- [ ] Does the Grid/Flex template count match the JS data length?
- [ ] Are scene transitions cross-faded with no >0.3s of pure blank?
- [ ] Is the DOM-measurement code wrapped inside `document.fonts.ready.then()`?
- [ ] Is `render(t)` pure, or is there an explicit reset mechanism?
- [ ] Is frame 0 the complete initial state, not blank?
- [ ] Is there no "fake chrome" decoration on canvas (progress bar / timecode / bottom byline clashing with the Stage scrubber)?
- [ ] Does the animation tick set `window.__ready = true` synchronously on its first frame? (animations.jsx ships this; hand-written HTML must add it)
- [ ] Does Stage detect `window.__recording` and force loop=false? (mandatory for hand-written HTML)
- [ ] Is the final Sprite's `fadeOut` set to 0 (so the video stops on a clear final frame)?
- [ ] Does 60fps MP4 default to frame duplication (compatibility), with `--minterpolate` only for high-quality interpolation?
- [ ] After export, did you grab frame 0 + final frame to verify they are the animation's initial and final states?
- [ ] When working with a specific brand (Stripe/Anthropic/Lovart/...): did you complete the "brand-asset protocol" (SKILL.md §1.a five steps)? Did you write `brand-spec.md`?
- [ ] Single-file HTML deliverables: is `animations.jsx` inlined rather than `src="..."`? (under file://, external `.jsx` triggers a CORS black screen)
- [ ] Cross-scene elements (chapter label / watermark / scene number) have no hardcoded colors? Are they visible against every scene's background?
