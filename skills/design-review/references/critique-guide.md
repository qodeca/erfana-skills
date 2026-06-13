# Design critique deep-dive

> Detailed reference for Phase 7. Provides scoring rubrics, scenario-specific emphases, and a common-issues checklist.

---

## Scoring rubric, in detail

### 1. Philosophy alignment

| Score | Standard |
|-------|----------|
| 9-10 | Design perfectly embodies the chosen philosophy's core spirit; every detail has a philosophical rationale |
| 7-8 | Direction is right, core characteristics are in place, only a few minor details drift |
| 5-6 | Intent is visible, but the execution mixes in other styles – not pure |
| 3-4 | Surface-level mimicry, the philosophy's core was not understood |
| 1-2 | Essentially unrelated to the chosen philosophy |

**Review notes**:
- Are the designer's / studio's signature techniques actually used?
- Do colors, type, and layout match this philosophical system?
- Are there self-contradicting elements? (e.g., picking Kenya Hara but cramming the layout with content)

### 2. Visual hierarchy

| Score | Standard |
|-------|----------|
| 9-10 | The viewer's eye flows along the designer's intended path; information acquisition is frictionless |
| 7-8 | Primary/secondary relationships are clear, with 1-2 spots of hierarchy ambiguity |
| 5-6 | Title and body separate, but mid-level hierarchy is muddled |
| 3-4 | Information is flat with no clear visual entry point |
| 1-2 | Chaotic – the viewer does not know where to look first |

**Review notes**:
- Is the type-size contrast between title and body sufficient? (at least 2.5x)
- Do color / weight / size establish 3-4 clear hierarchy levels?
- Is whitespace guiding the eye?
- "Squint test": squint at the design – is the hierarchy still clear?

### 3. Craft quality

| Score | Standard |
|-------|----------|
| 9-10 | Pixel-perfect – alignment, spacing, color have zero defects |
| 7-8 | Polished overall, with 1-2 tiny alignment / spacing issues |
| 5-6 | Mostly aligned, but spacing is inconsistent and color use lacks system |
| 3-4 | Obvious alignment errors, chaotic spacing, too many colors |
| 1-2 | Rough – looks like a draft |

**Review notes**:
- Is a unified spacing system used (e.g., 8pt grid)?
- Is spacing consistent across same-type elements?
- Is the color count under control? (typically no more than 3-4)
- Is the type family unified? (typically no more than 2)
- Is edge alignment precise?

### 4. Functionality

| Score | Standard |
|-------|----------|
| 9-10 | Every design element serves the goal; zero redundancy |
| 7-8 | Function-driven and clear, with a small amount of trimmable decoration |
| 5-6 | Usable, but obvious decorative elements distract |
| 3-4 | Form over function – the user has to work to find information |
| 1-2 | Drowned in decoration, has lost the ability to communicate information |

**Review notes**:
- If you remove any single element, does the design get worse? (If not, remove it.)
- Are CTAs / key information in the most prominent positions?
- Are there elements added "because it looks nice"?
- Does information density match the medium? (PPT should not be dense; PDF can be denser)

### 5. Originality

| Score | Standard |
|-------|----------|
| 9-10 | Refreshing – finds a unique expression within the philosophy's framework |
| 7-8 | Has its own ideas, not just template substitution |
| 5-6 | Conventional – looks like a template |
| 3-4 | Heavy use of cliche (e.g., gradient orbs to represent AI) |
| 1-2 | Pure template or asset-pack collage |

**Review notes**:
- Are common cliches avoided? (see "Common issues checklist" below)
- Is there personal expression while still respecting the design philosophy?
- Are there design decisions that feel "unexpected but correct"?

---

## Scenario-specific review emphasis

Different output types call for different review priorities:

| Scenario | Most important | Secondary | Can relax |
|----------|----------------|-----------|-----------|
| WeChat cover / article hero | Originality, visual hierarchy | Philosophy alignment | Functionality (single image, no interaction) |
| Infographic | Functionality, visual hierarchy | Craft quality | Originality (accuracy first) |
| PPT / Keynote | Visual hierarchy, functionality | Craft quality | Originality (clarity first) |
| PDF / white paper | Craft quality, functionality | Visual hierarchy | Originality (professionalism first) |
| Landing page / website | Functionality, visual hierarchy | Originality | – (all dimensions matter) |
| App UI | Functionality, craft quality | Visual hierarchy | Philosophy alignment (usability first) |
| Xiaohongshu image | Originality, visual hierarchy | Philosophy alignment | Craft quality (vibe first) |

---

## Top 10 common design issues

### 1. AI-tech cliche
**Problem**: gradient orbs, digital rain, blue circuit boards, robot faces
**Why it is a problem**: viewers are visually fatigued by these – you cannot be told apart from anyone else
**Fix**: replace literal symbols with abstract metaphor (e.g., the "conversation" metaphor instead of a chat-bubble icon)

### 2. Insufficient type-size hierarchy
**Problem**: title and body are too close in size (< 2.5x)
**Why it is a problem**: viewers cannot quickly locate key information
**Fix**: title should be at least 3x body (e.g., 16px body -> 48-64px title)

### 3. Too many colors
**Problem**: 5+ colors used with no primary/secondary relationship
**Why it is a problem**: visual chaos, weak brand identity
**Fix**: limit to 1 primary + 1 secondary + 1 accent + grayscale

### 4. Inconsistent spacing
**Problem**: spacing between elements is arbitrary, no system
**Why it is a problem**: looks unprofessional, visual rhythm is broken
**Fix**: build an 8pt grid system (use only 8 / 16 / 24 / 32 / 48 / 64 px)

### 5. Insufficient whitespace
**Problem**: every space is filled with content
**Why it is a problem**: cramped information leads to reading fatigue and reduces comprehension
**Fix**: whitespace should occupy at least 40% of the area (60%+ for minimal styles)

### 6. Too many fonts
**Problem**: 3+ typefaces used
**Why it is a problem**: visual noise, weakens unity
**Fix**: at most 2 typefaces (1 for titles + 1 for body); use weight and size for variety

### 7. Inconsistent alignment
**Problem**: some elements left-aligned, some centered, some right-aligned
**Why it is a problem**: breaks the sense of visual order
**Fix**: pick one alignment (left preferred) and apply globally

### 8. Decoration over content
**Problem**: background patterns / gradients / shadows steal attention from the main content
**Why it is a problem**: priorities are inverted – the viewer came for information, not ornament
**Fix**: ask "if I remove this decoration, does the design get worse?" If not, remove it

### 9. Cyber-neon overuse
**Problem**: deep-blue background (#0D1117) + neon glow effects
**Why it is a problem**: a default-taste no-go (this skill's taste baseline) and one of the largest cliches – users may override it with their own brand
**Fix**: choose a more distinctive color system (see the 20-style color references)

### 10. Information density mismatched to medium
**Problem**: a PPT page packed with text / a cover image stuffed with 10 elements
**Why it is a problem**: each medium has a different optimal information density
**Fix**:
- PPT: one core point per slide
- Cover: one visual focal point
- Infographic: layered presentation
- PDF: can be denser, but needs clear navigation

---

## Critique output template

```
## Design critique report

**Overall score**: X.X/10 [Excellent (8+) / Good (6-7.9) / Needs improvement (4-5.9) / Failing (<4)]

**Per-dimension scores**:
- Philosophy alignment: X/10 [one-line note]
- Visual hierarchy: X/10 [one-line note]
- Craft quality: X/10 [one-line note]
- Functionality: X/10 [one-line note]
- Originality: X/10 [one-line note]

### Strengths (Keep)
- [Identify what is done well, in design language]

### Issues (Fix)
[Sorted by severity]

**1. [Issue name]** – ⚠️ Critical / ⚡ Important / 💡 Polish
- Current: [describe the status quo]
- Problem: [why this is a problem]
- Fix: [concrete action with values]

### Quick wins
If you only have 5 minutes, do these 3 first:
- [ ] [Highest-impact fix]
- [ ] [Second-most important fix]
- [ ] [Third-most important fix]
```

---

**Version**: v1.0
**Updated**: 2026-02-13
