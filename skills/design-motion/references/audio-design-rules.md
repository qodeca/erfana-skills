# Audio design rules · erfana

> The recipe for applying audio to all animation demos. Use alongside `sfx-library.md` (asset catalog).
> Hardened in production: hero animation v1-v9 release iterations, deep Gemini analysis of three Anthropic official films, 8000+ A/B comparisons.

---

## Core principle · two-track audio (iron rule)

Animation audio **must be designed as two independent layers** – never just one:

| Layer | Function | Time scale | Relation to visuals | Frequency band |
|---|---|---|---|---|
| **SFX (beat layer)** | Marks every visual beat | 0.2-2s short | **Strong sync** (frame-aligned) | **High freq 800Hz+** |
| **BGM (ambient bed)** | Emotional bed, soundscape | Continuous 20-60s | Weak sync (paragraph-level) | **Mid-low freq <4kHz** |

**An animation with only BGM is broken** – the audience subconsciously perceives "the picture moves but nothing responds in sound", and that is the root cause of the cheap feel.

---

## Gold standard · golden ratios

These numbers are **engineering-grade hard parameters** derived from comparing the three Anthropic official films and our own v9 final cut. Use them directly:

### Volume
- **BGM volume**: `0.40-0.50` (relative to full scale 1.0)
- **SFX volume**: `1.00`
- **Loudness gap**: BGM peak is **-6 to -8 dB lower** than SFX peak (SFX prominence does not come from absolute loudness, it comes from the gap)
- **amix parameter**: `normalize=0` (never use normalize=1 – it crushes dynamic range)

### Frequency-band isolation (P1 hard optimization)
Anthropic's secret is not "loud SFX", it is **frequency-band layering**:

```bash
[bgm_raw]lowpass=f=4000[bgm]      # BGM constrained to <4kHz mid-low frequencies
[sfx_raw]highpass=f=800[sfx]      # SFX pushed to 800Hz+ mid-high frequencies
[bgm][sfx]amix=inputs=2:duration=first:normalize=0[a]
```

Why: human hearing is most sensitive in the 2-5kHz range (the "presence" band). If SFX is all in this band and BGM covers the full spectrum, **SFX gets masked by the high end of BGM**. Pushing SFX up with highpass + pulling BGM down with lowpass makes them occupy different parts of the spectrum, and SFX clarity goes up a full grade.

### Fade
- BGM in: `afade=in:st=0:d=0.3` (0.3s, avoids hard cut)
- BGM out: `afade=out:st=N-1.5:d=1.5` (1.5s long tail, sense of closure)
- SFX have their own envelope and need no extra fade

---

## SFX cue design rules

### Density (SFX per 10 seconds)
The SFX density of the three Anthropic films falls into three tiers:

| Film | SFX per 10s | Product personality | Scene |
|---|---|---|---|
| Artifacts (ref-1) | **~9 / 10s** | Feature-dense, info-heavy | Complex-tool demo |
| Code Desktop (ref-2) | **0** | Pure ambient, meditative | Dev-tool focus state |
| Word (ref-3) | **~4 / 10s** | Balanced, office rhythm | Productivity tool |

**Heuristics**:
- Calm / focused product personality -> low SFX density (0-3 per 10s), BGM-led
- Lively / info-heavy product personality -> high SFX density (6-9 per 10s), SFX-driven rhythm
- **Do not fill every visual beat** – emptiness is more refined than density. **Cutting 30-50% of cues makes the rest more dramatic.**

### Cue selection priority
Not every visual beat needs an SFX. Pick by this priority:

**P0 mandatory** (omitting feels wrong):
- Typing (terminal / input)
- Clicks / selection (user decision moments)
- Focus shifts (visual subject transfer)
- Logo reveal (brand closure)

**P1 recommended**:
- Element entrance / exit (modal / card)
- Completion / success feedback
- AI generation start / end
- Major transitions (scene change)

**P2 optional** (overdoing it gets messy):
- hover / focus-in
- progress tick
- decorative ambient

### Timestamp alignment precision
- **Same-frame alignment** (0ms tolerance): clicks / focus shift / logo landing
- **Lead by 1-2 frames** (-33ms): fast whoosh (gives the audience anticipation)
- **Lag by 1-2 frames** (+33ms): object landing / impact (matches real physics)

---

## BGM selection decision tree

The erfana skill ships 6 BGM tracks (`assets/bgm-*.mp3`):

```
What is the animation's personality?
├─ Product launch / tech demo -> bgm-tech.mp3 (minimal synth + piano)
├─ Tutorial / tool walkthrough -> bgm-tutorial.mp3 (warm, instructional)
├─ Education / principle explanation -> bgm-educational.mp3 (curious, thoughtful)
├─ Marketing / brand promotion -> bgm-ad.mp3 (upbeat, promotional)
└─ Variant of the same style -> bgm-*-alt.mp3 (alternate version of each)
```

### When to skip BGM (worth considering)
Reference Anthropic Code Desktop (ref-2): **0 SFX + pure lo-fi BGM** can also be very classy.

**When to choose no BGM**:
- Animation duration <10s (BGM cannot establish itself)
- Product personality is "focus / meditation"
- The scene already has ambient sound / a voiceover
- SFX density is very high (avoid auditory overload)

---

## Scene recipes (out of the box)

### Recipe A · product-launch hero (hero animation v9 same recipe)
```
Duration: 25 seconds
BGM: bgm-tech.mp3 · 45% · band <4kHz
SFX density: ~6 per 10s

Cues:
  Terminal typing -> type x 4 (0.6s spacing)
  Return         -> enter
  Card converge  -> card x 4 (staggered 0.2s)
  Selection      -> click
  Ripple         -> whoosh
  4x focus       -> focus x 4
  Logo           -> thud (1.5s)

Volume: BGM 0.45 / SFX 1.0 · amix normalize=0
```

### Recipe B · tool-feature demo (reference Anthropic Code Desktop)
```
Duration: 30-45 seconds
BGM: bgm-tutorial.mp3 · 50%
SFX density: 0-2 per 10s (very few)

Strategy: let BGM + voiceover drive; SFX only at **decisive moments** (file save / command execution complete)
```

### Recipe C · AI-generation demo
```
Duration: 15-20 seconds
BGM: bgm-tech.mp3 or no BGM
SFX density: ~8 per 10s (high density)

Cues:
  User input -> type + enter
  AI starts processing -> magic/ai-process (1.2s loop)
  Generation done -> feedback/complete-done
  Result reveals -> magic/sparkle
  
Highlight: ai-process can loop 2-3 times across the entire generation
```

### Recipe D · pure-ambient long shot (reference Artifacts)
```
Duration: 10-15 seconds
BGM: none
SFX: 3-5 carefully designed standalone cues

Strategy: each SFX is the lead, no BGM "smearing them together".
Suitable for: single-product slow shots, close-up showcases
```

---

## ffmpeg mux templates

### Template 1 · single SFX overlaid on video
```bash
ffmpeg -y -i video.mp4 -itsoffset 2.5 -i sfx.mp3 \
  -filter_complex "[0:a][1:a]amix=inputs=2:normalize=0[a]" \
  -map 0:v -map "[a]" output.mp4
```

### Template 2 · multi-SFX timeline mux (aligned to cue times)
```bash
ffmpeg -y \
  -i sfx-type.mp3 -i sfx-enter.mp3 -i sfx-click.mp3 -i sfx-thud.mp3 \
  -filter_complex "\
[0:a]adelay=1100|1100[a0];\
[1:a]adelay=3200|3200[a1];\
[2:a]adelay=7000|7000[a2];\
[3:a]adelay=21800|21800[a3];\
[a0][a1][a2][a3]amix=inputs=4:duration=longest:normalize=0[mixed]" \
  -map "[mixed]" -t 25 sfx-track.mp3
```
**Key parameters**:
- `adelay=N|N`: first value is left-channel delay (ms), second is right; write twice to keep stereo aligned
- `normalize=0`: preserve dynamic range – critical!
- `-t 25`: cut to the specified duration

### Template 3 · video + SFX track + BGM (with frequency isolation)
```bash
ffmpeg -y -i video.mp4 -i sfx-track.mp3 -i bgm.mp3 \
  -filter_complex "\
[2:a]atrim=0:25,afade=in:st=0:d=0.3,afade=out:st=23.5:d=1.5,\
     lowpass=f=4000,volume=0.45[bgm];\
[1:a]highpass=f=800,volume=1.0[sfx];\
[bgm][sfx]amix=inputs=2:duration=first:normalize=0[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k final.mp4
```

---

## Failure-mode quick reference

| Symptom | Root cause | Fix |
|---|---|---|
| SFX inaudible | High end of BGM is masking it | Add `lowpass=f=4000` to BGM + `highpass=f=800` to SFX |
| SFX too loud / harsh | SFX absolute level too high | Drop SFX volume to 0.7 and BGM to 0.3 to keep the gap |
| BGM and SFX rhythms clash | Wrong BGM (used music with a strong beat) | Switch to ambient / minimal-synth BGM |
| BGM ends abruptly when animation finishes | Missing fade-out | `afade=out:st=N-1.5:d=1.5` |
| SFX overlap into mush | Cues too dense + each SFX too long | Keep SFX duration under 0.5s, cue spacing >= 0.2s |
| WeChat Channels MP4 has no sound | WeChat sometimes mutes auto-play | Do not worry – when the user taps, sound plays; GIFs never had sound anyway |

---

## Coordination with visuals (advanced)

### SFX timbre should match visual style
- Warm rice-paper / paper-feel visuals -> use **wood / soft** timbres (Morse, paper snap, soft click)
- Cold dark-tech visuals -> use **metallic / digital** timbres (beep, pulse, glitch)
- Hand-drawn / playful visuals -> use **cartoon / exaggerated** timbres (boing, pop, zap)

Our current `apple-gallery-showcase.md` warm-rice background -> pairs with `keyboard/type.mp3` (mechanical) + `container/card-snap.mp3` (soft) + `impact/logo-reveal-v2.mp3` (cinematic bass)

### SFX can drive visual rhythm
Advanced technique: **design the SFX timeline first, then adjust the visual animation to align with the SFX** (not the other way around).
Because every SFX cue is a "clock tick", visual animation aligned to SFX rhythm is rock solid – conversely, SFX chasing visuals will be ±1 frame off and feel wrong.

---

## Quality checklist (pre-release self-check)

- [ ] Loudness gap: SFX peak - BGM peak = -6 to -8 dB?
- [ ] Bands: BGM lowpass 4kHz + SFX highpass 800Hz?
- [ ] amix normalize=0 (preserves dynamic range)?
- [ ] BGM fade-in 0.3s + fade-out 1.5s?
- [ ] SFX count appropriate (density chosen by scene personality)?
- [ ] Each SFX aligned with the visual beat at the same frame (within ±1 frame)?
- [ ] Logo-reveal SFX long enough (1.5s recommended)?
- [ ] Mute the BGM and listen: does SFX alone have rhythm?
- [ ] Mute the SFX and listen: does BGM alone have emotional arc?

Either layer alone should hold up. If they only sound good when stacked, the layering is not done right.

---

## References

- SFX asset catalog: `sfx-library.md`
- Visual style reference: `apple-gallery-showcase.md`
