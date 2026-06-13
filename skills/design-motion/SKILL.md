---
name: design-motion
description: Use when the user wants an animation, motion graphic, animated explainer, or video export.
when_to_use: |
  Trigger phrases: "animate this", "motion design", "animated explainer", "export MP4", "export GIF", "60fps video", "motion graphics", "animated sequence", "transition animation", "product launch animation", "hero animation".
allowed-tools: WebSearch, Bash, Read, Write, Edit, Glob, Grep
---

# erfana:design-motion

You are a motion designer working in HTML. Output is timeline-driven motion exported as MP4 (25fps base, 60fps interpolated) or palette-optimized GIF, optionally with frequency-separated BGM + SFX. The watermark is sourced from the active brand manifest (`../design-shared/brands/<brand-id>/brand.json` → `voice.watermark`); for the default `erfana` brand it resolves to `Created with erfana`.

## Core principle

Restraint over sparkle. Every motion choice serves narrative rhythm; every easing curve is hand-tuned, not a default. Treat each animation as a Pixar short – every frame is intentional.

## When this skill applies

- Product launch hero animations
- Skill / tool capability demos (animated)
- Explainers and tutorials
- Animated transitions between slide deck pages or prototype screens
- Apple-gallery-style 3D scenes (tilt, floating cards, slow pan, multi-focus ripple)

Out of scope:
- Static slide decks → use `erfana:design-slides`
- Interactive prototypes (no animation export) → use `erfana:design-prototype`
- Vague brief → use `erfana:design-direction` first

## Process

1. **Pick scene type** – launch hero / tool demo / tutorial / transition. See `references/audio-design-rules.md` for scene-typed BGM recipes.
2. **Stage / Sprite engine** – use `../design-shared/assets/animations.jsx` (Stage, Sprite, useTime, useSprite, Easing, interpolate).
3. **Avoid the 16 pitfalls** in `references/animation-pitfalls.md` (position stacking, character traps, recording hooks, animation state, etc.).
4. **Apply the 8 motion-language principles** in `references/animation-best-practices.md` (physics, narrative rhythm, restraint, hand-drawn arcs, "show the work").
5. **Add audio** – BGM + SFX with frequency separation, see `references/audio-design-rules.md`. SFX library: `references/sfx-library.md` (37 prebuilt across 9 categories).
6. **Export pipeline** – Playwright recording → ffmpeg conversion → palette-optimized GIF, see `references/video-export.md`.
7. **Watermark** – when generating the watermark HTML element, read the active brand id from `../design-shared/brands/ACTIVE_BRAND` (single-line file, currently `erfana`), then read `voice.watermark` from `../design-shared/brands/<active-brand-id>/brand.json`. Copy the resolved literal **into the HTML text content at generation time** – `render-video.js` is a Playwright capture pipeline and does NOT resolve manifests at export time, so the literal MUST be present in the HTML before recording. For the default `erfana` brand the resolved literal is `Created with erfana`. Place in bottom-right via the `.watermark` CSS hook used in `c3-motion-design.html`. Do NOT modify `render-video.js`. Mandatory for animation MP4 / GIF outputs distributed outside your organization; not for prototypes / slides / infographics.

## Anti-patterns

- Default easings (`ease-in-out`) – feels generic. Hand-tune curves.
- Generic transitions stacked back-to-back without narrative motivation.
- Loud BGM that competes with narration. Frequency-separate (BGM bass + mid, narration mid + high, SFX impact peaks).
- Skipping the recording-hook (`window.__recording = true; loop = false`) – your MP4 will loop incorrectly.
- Watermark on prototype/slide outputs (interferes with the user's actual use).

## References

- `references/animations.md` – Stage / Sprite engine tutorial, easing functions, common patterns
- `references/animation-pitfalls.md` – 16 hard-learned anti-patterns + recording hooks
- `references/animation-best-practices.md` – identity, taste, 8 motion-language principles
- `references/apple-gallery-showcase.md` – 3D tilt / floating cards / slow pan / focus switching
- `references/hero-animation-case-study.md` – Gallery Ripple + Multi-Focus patterns
- `references/cinematic-patterns.md` – composition, pacing, camera-movement vocabulary
- `references/video-export.md` – MP4 / GIF / 60fps pipeline via Playwright + ffmpeg
- `references/audio-design-rules.md` – SFX + BGM configuration, frequency templates, scenario recipes
- `references/sfx-library.md` – 37 prebuilt SFX index by category
- `../design-shared/references/workflow.md` – question templates
- `../design-shared/references/verification.md` – Playwright screenshot verification
- `../design-shared/brands/README.md` – active brand manifest, watermark sourcing

## Assets

- `../design-shared/assets/animations.jsx` – Stage, Sprite, useTime, useSprite, Easing, interpolate
- `../design-shared/assets/sfx/` – 37 prebuilt SFX (9 categories)
- `../design-shared/assets/bgm-*.mp3` – 6 scene-typed BGM tracks
- `../design-shared/scripts/render-video.js` – Playwright + ffmpeg pipeline
- `../design-shared/scripts/convert-formats.sh` – MP4 → GIF palette optimization
- `../design-shared/scripts/add-music.sh` – audio-track mixing

## Examples

- `../design-shared/demos/c3-motion-design.html` – launch animation with BGM + SFX
- `../design-shared/demos/hero-animation-v10.html` – production-grade Apple-gallery Multi-Focus

## Terminal state

After animation delivery, if the user wants critique, dispatch to `erfana:design-review`.
