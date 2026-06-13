# Design Philosophy Showcases – Sample Asset Index

> 8 scenarios x 3 styles = 24 prebuilt design samples
> Used during Phase 3 (Recommend Design Directions) to immediately show "what does this style actually look like in production?"

## Style key

| Code | School | Style name | Visual vibe |
|------|--------|------------|-------------|
| **Pentagram** | Information architecture | Pentagram / Michael Bierut | Black-and-white, restrained, Swiss grid, strong type hierarchy, #E63946 red accent |
| **Build** | Minimalism | Build Studio | Luxury-grade white space (70%+), subtle weight (200–600), #D4A574 warm gold, refined |
| **Takram** | Eastern philosophy | Takram | Soft tech feel, natural palette (beige / gray / green), rounded corners, charts as art |

## Scenario quick reference

### Content design scenarios

| # | Scenario | Spec | Pentagram | Build | Takram |
|---|----------|------|-----------|-------|--------|
| 1 | Article cover | 1200x510 | `cover/cover-pentagram` | `cover/cover-build` | `cover/cover-takram` |
| 2 | PPT data page | 1920x1080 | `ppt/ppt-pentagram` | `ppt/ppt-build` | `ppt/ppt-takram` |
| 3 | Vertical infographic | 1080x1920 | `infographic/infographic-pentagram` | `infographic/infographic-build` | `infographic/infographic-takram` |

### Website design scenarios

| # | Scenario | Spec | Pentagram | Build | Takram |
|---|----------|------|-----------|-------|--------|
| 4 | Personal homepage | 1440x900 | `website-homepage/homepage-pentagram` | `website-homepage/homepage-build` | `website-homepage/homepage-takram` |
| 5 | AI directory site | 1440x900 | `website-ai-nav/ainav-pentagram` | `website-ai-nav/ainav-build` | `website-ai-nav/ainav-takram` |
| 6 | AI writing tool | 1440x900 | `website-ai-writing/aiwriting-pentagram` | `website-ai-writing/aiwriting-build` | `website-ai-writing/aiwriting-takram` |
| 7 | SaaS landing page | 1440x900 | `website-saas/saas-pentagram` | `website-saas/saas-build` | `website-saas/saas-takram` |
| 8 | Developer docs | 1440x900 | `website-devdocs/devdocs-pentagram` | `website-devdocs/devdocs-build` | `website-devdocs/devdocs-takram` |

> Each entry has both `.html` (source) and `.png` (screenshot) versions.

## Usage

### Citing during Phase 3 recommendation
After recommending a design direction, show the prebuilt screenshot for the matching scenario:
```
"Here's what Pentagram looks like as an article cover -> [show cover/cover-pentagram.png]"
"Here's how Takram handles a PPT data page -> [show ppt/ppt-takram.png]"
```

### Scenario matching priority
1. The user's scenario has an exact match -> show that scenario directly
2. No exact match, but a close type -> show the nearest scenario (e.g. "product marketing site" -> show SaaS landing page)
3. No match at all -> skip the prebuilt sample and proceed to Phase 3.5 live generation

### Side-by-side comparison
The 3 styles for the same scenario lend themselves to a side-by-side comparison; helps the user feel the difference directly:
- "Here's the same article cover rendered in 3 different styles"
- Display order: Pentagram (rational, restrained) -> Build (luxury minimal) -> Takram (soft, warm)

## Content details

### Article cover (cover/)
- Topic: Claude Code Agent workflow – 8 parallel Agent architecture
- Pentagram: giant red "8" + Swiss grid lines + data bars
- Build: ultra-thin "Agent" floating in 70% white space + warm-gold thin lines
- Takram: 8-node radial flow chart treated as an art piece + beige background

### PPT data page (ppt/)
- Topic: GLM-4.7 open-source model coding capability breakthrough (AIME 95.7 / SWE-bench 73.8% / τ²-Bench 87.4)
- Pentagram: 260px "95.7" anchor + red/gray/light-gray contrast bar chart
- Build: three groups of 120px ultra-thin numbers floating + warm-gold gradient comparison bars
- Takram: SVG radar chart + 3-color overlay + rounded data cards

### Vertical infographic (infographic/)
- Topic: AI memory system CLAUDE.md, optimized from 93KB to 22KB
- Pentagram: giant "93->22" numerals + numbered blocks + CSS data bars
- Build: extreme white space + soft-shadow cards + warm-gold connecting lines
- Takram: SVG ring chart + organic-curve flow chart + frosted-glass cards

### Personal homepage (website-homepage/)
- Topic: independent developer Alex Chen portfolio home
- Pentagram: 112px name + Swiss grid columns + numbered editorial digits
- Build: glassmorphic nav + floating stat cards + ultra-thin weights
- Takram: paper texture + small circular avatar + hairline dividers + asymmetric layout

### AI directory site (website-ai-nav/)
- Topic: AI Compass – directory of 500+ AI tools
- Pentagram: square-cornered search box + numbered tool list + uppercase category tags
- Build: rounded search box + refined white tool cards + pill labels
- Takram: organic offset card layout + soft category tags + chart-style connectors

### AI writing tool (website-ai-writing/)
- Topic: Inkwell – AI writing assistant
- Pentagram: 86px headline + wireframed editor mock + grid of feature columns
- Build: floating editor card + warm-gold CTA + luxe writing experience
- Takram: poetic serif headline + organic editor + flow diagram

### SaaS landing page (website-saas/)
- Topic: Meridian – business intelligence analytics platform
- Pentagram: black-and-white columns + structured dashboard + 140px "3x" anchor
- Build: floating dashboard card + SVG area chart + warm-gold gradient
- Takram: rounded bar chart + flow nodes + soft earth tones

### Developer docs (website-devdocs/)
- Topic: Nexus API – unified AI model gateway
- Pentagram: left-side nav + square-cornered code blocks + red string highlights
- Build: centered floating code cards + soft shadow + warm-gold icons
- Takram: beige code blocks + flow-chart connectors + dashed feature cards

## File statistics

- HTML source files: 24
- PNG screenshots: 24
- Total assets: 48 files

---

**Version**: v1.0
**Created**: 2026-02-13
**Applies to**: the design-philosophy skill, Phase 3 recommendation step
