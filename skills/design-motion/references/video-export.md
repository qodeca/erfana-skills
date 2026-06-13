# Video Export: exporting HTML animations to MP4 / GIF

Once an animation HTML is finished, users often ask "can it be exported as a video?". This guide gives the full workflow.

## When to export

**When to do it**:
- The animation runs end-to-end and has been visually verified (Playwright screenshots confirm correct state at each timestamp)
- The user has watched it at least once in the browser and confirmed it looks OK
- **Do not** export while animation bugs are still unfixed - fixing things after exporting to video is much more expensive

**Likely user trigger phrases**:
- "Can you export this as a video?"
- "Convert it to MP4"
- "Make it a GIF"
- "60fps"

## Output specs

By default, deliver three formats so the user can pick:

| Format | Specs | Best for | Typical size (30s) |
|---|---|---|---|
| MP4 25fps | 1920x1080 - H.264 - CRF 18 | WeChat articles, Video Account, YouTube | 1-2 MB |
| MP4 60fps | 1920x1080 - minterpolate frame interpolation - H.264 - CRF 18 | High-frame-rate showcases, Bilibili, portfolios | 1.5-3 MB |
| GIF | 960x540 - 15fps - palette-optimized | Twitter/X, README, Slack previews | 2-4 MB |

## Toolchain

Two scripts in `scripts/`:

### 1. `render-video.js` - HTML -> MP4

Records a 25fps MP4 base version. Depends on a global Playwright install.

```bash
NODE_PATH=$(npm root -g) node /path/to/claude-design/scripts/render-video.js <html-file>
```

Optional flags:
- `--duration=30` animation duration (seconds)
- `--width=1920 --height=1080` resolution
- `--trim=2.2` seconds to trim from the start (removes reload + font-loading time)
- `--fontwait=1.5` font-loading wait time (seconds); raise this when many fonts are used

Output: same directory as the HTML, `.mp4` with the same base name.

### 2. `add-music.sh` - MP4 + BGM -> MP4

Mixes background music into a silent MP4. Picks from the built-in BGM library by scene (mood) or accepts a custom audio file. Automatically matches duration and adds fade-in/fade-out.

```bash
bash add-music.sh <input.mp4> [--mood=<name>] [--music=<path>] [--out=<path>]
```

**Built-in BGM library** (in `assets/bgm-<mood>.mp3`):

| `--mood=` | Style | Best for |
|-----------|------|---------|
| `tech` (default) | Apple Silicon / Apple keynote, minimal synths + piano | Product launches, AI tools, skill promos |
| `ad` | Upbeat modern electronic with build + drop | Social-media ads, product teasers, promo videos |
| `educational` | Warm and bright, light guitar / electric piano, inviting | Pop science, tutorial intros, course teasers |
| `educational-alt` | Same category alternative, swap track | Same as above |
| `tutorial` | Lo-fi ambient, almost imperceptible | Software demos, programming tutorials, long demos |
| `tutorial-alt` | Same category alternative | Same as above |

**Behavior**:
- Music is trimmed to match the video duration
- 0.3s fade-in + 1s fade-out (avoids hard cuts)
- Video stream uses `-c:v copy` (no re-encoding); audio is AAC 192k
- `--music=<path>` takes priority over `--mood`; can point at any external audio
- Passing an unknown mood name lists all available options, never fails silently

**Typical pipeline** (animation export trio + music):
```bash
node render-video.js animation.html                        # screen recording
bash convert-formats.sh animation.mp4                      # derive 60fps + GIF
bash add-music.sh animation-60fps.mp4                      # add default tech BGM
# Or for different scenarios:
bash add-music.sh tutorial-demo.mp4 --mood=tutorial
bash add-music.sh product-promo.mp4 --mood=ad --out=promo-final.mp4
```

### 3. `convert-formats.sh` - MP4 -> 60fps MP4 + GIF

Generates a 60fps version and a GIF from an existing MP4.

```bash
bash /path/to/claude-design/scripts/convert-formats.sh <input.mp4> [gif_width] [--minterpolate]
```

Outputs (same directory as the input):
- `<name>-60fps.mp4` - by default uses `fps=60` frame duplication (broad compatibility); add `--minterpolate` to enable high-quality interpolation
- `<name>.gif` - palette-optimized GIF (default 960 wide, configurable)

**60fps mode selection**:

| Mode | Command | Compatibility | Use case |
|---|---|---|---|
| Frame duplication (default) | `convert-formats.sh in.mp4` | Plays everywhere: QuickTime/Safari/Chrome/VLC | General delivery, upload platforms, social media |
| minterpolate frame interpolation | `convert-formats.sh in.mp4 --minterpolate` | macOS QuickTime/Safari may refuse to open it | Showcases that need real interpolation (Bilibili, etc.); **always test the target player locally before delivery** |

Why is frame duplication the default? minterpolate's H.264 elementary stream output has a known compat bug - we kept hitting "macOS QuickTime won't open it" while minterpolate was the default. See `animation-pitfalls.md` paragraph 14.

`gif_width` parameter:
- 960 (default) - general-purpose for social platforms
- 1280 - sharper but larger file
- 600 - prioritized for Twitter/X loading

## Full workflow (standard recommendation)

After the user says "export the video":

```bash
cd <project-directory>

# Assume $SKILL points to the root of this skill (replace with your install path)

# 1. Record the 25fps base MP4
NODE_PATH=$(npm root -g) node "$SKILL/scripts/render-video.js" my-animation.html

# 2. Derive the 60fps MP4 and the GIF
bash "$SKILL/scripts/convert-formats.sh" my-animation.mp4

# Output:
# my-animation.mp4         (25fps - 1-2 MB)
# my-animation-60fps.mp4   (60fps - 1.5-3 MB)
# my-animation.gif         (15fps - 2-4 MB)
```

## Technical details (for troubleshooting)

### Playwright recordVideo gotchas

- Frame rate is locked to 25fps; 60fps cannot be recorded directly (Chromium headless compositor ceiling)
- Recording starts the moment the context is created; you must use `trim` to drop the loading time
- Default format is webm; ffmpeg conversion to H.264 MP4 is required for general playback

`render-video.js` already handles all of the above.

### ffmpeg minterpolate parameters

Current configuration: `minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`

- `mi_mode=mci` - motion compensation interpolation
- `mc_mode=aobmc` - adaptive overlapped block motion compensation
- `me_mode=bidir` - bidirectional motion estimation
- `vsbmc=1` - variable size block motion compensation

Works well for CSS **transform animations** (translate/scale/rotate).
For **pure fades** it can produce mild ghosting - if the user is bothered, fall back to simple frame duplication:

```bash
ffmpeg -i input.mp4 -r 60 -c:v libx264 ... output.mp4
```

### Why GIF palette is two-pass

GIF supports only 256 colors. A single-pass GIF squeezes the whole animation into a 256-color generic palette, which makes subtle palettes (cream background + orange accent) look muddy.

Two-pass:
1. `palettegen=stats_mode=diff` - first scans the whole clip and generates an **optimal palette tailored to this animation**
2. `paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle` - encodes with that palette; rectangle diff updates only the changed regions, drastically shrinking the file

For fade transitions, `dither=bayer` is smoother than `none`, at the cost of a slightly larger file.

## Pre-flight check (before exporting)

A 30-second self-check before exporting:

- [ ] HTML has been played end-to-end in the browser without console errors
- [ ] Frame 0 of the animation is the complete initial state (not a blank loading screen)
- [ ] The last frame is a stable closing state (not cut off mid-animation)
- [ ] Fonts / images / emoji all render correctly (see `animation-pitfalls.md`)
- [ ] The Duration parameter matches the actual animation duration in the HTML
- [ ] The HTML's Stage detects `window.__recording` and forces loop=false (mandatory for hand-written stages; bundled in `assets/animations.jsx`)
- [ ] The closing Sprite has `fadeOut={0}` (the final frame should not fade)
- [ ] Includes the "Created with erfana" watermark (mandatory for animation scenes only; for third-party brand work, prefix with "unofficial - ". See SKILL.md "Skill promotion watermark" section.)

## Notes to include with delivery

After exporting, the standard delivery note format:

```
**Full delivery**

| File | Format | Specs | Size |
|---|---|---|---|
| foo.mp4 | MP4 | 1920x1080 - 25fps - H.264 | X MB |
| foo-60fps.mp4 | MP4 | 1920x1080 - 60fps (motion interpolation) - H.264 | X MB |
| foo.gif | GIF | 960x540 - 15fps - palette-optimized | X MB |

**Notes**
- 60fps uses minterpolate motion-estimation interpolation; works well for transform animations
- GIF is palette-optimized; a 30s animation can be compressed to about 3MB

Let me know if you need a different size or frame rate.
```

## Common follow-up requests

| User says | Response |
|---|---|
| "Too big" | MP4: raise CRF to 23-28; GIF: drop resolution to 600 or fps to 10 |
| "GIF looks blurry" | Raise `gif_width` to 1280; or suggest using MP4 instead (WeChat Moments supports it too) |
| "I need portrait 9:16" | Change the HTML source to `--width=1080 --height=1920` and re-record |
| "Add a watermark" | Use ffmpeg `-vf "drawtext=..."` or `overlay=` with a PNG |
| "Transparent background" | MP4 does not support alpha; use WebM VP9 + alpha or APNG |
| "I want lossless" | Set CRF to 0 + preset veryslow (file will be ~10x larger) |
