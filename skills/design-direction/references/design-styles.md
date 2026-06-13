# Design philosophy style library: 20 systems

> A design style library for visual design (web / PPT / PDF / infographics / illustrations / apps, etc.).
> Each style provides: philosophical core + key characteristics + prompt DNA (used in combination with scene templates).

## Style x scene x execution-path quick lookup

| Style | Web | PPT | PDF | Infographic | Cover | AI generation | Best path |
|------|:---:|:---:|:---:|:-----:|:---:|:-----:|---------|
| 01 Pentagram | *** | *** | **o | **o | *** | *oo | HTML |
| 02 Stamen Design | **o | **o | **o | *** | **o | **o | Hybrid |
| 03 Information Architects | *** | *oo | *** | *oo | *oo | *oo | HTML |
| 04 Fathom | **o | *** | *** | *** | **o | *oo | HTML |
| 05 Locomotive | *** | **o | *oo | *oo | **o | **o | Hybrid |
| 06 Active Theory | *** | *oo | *oo | *oo | **o | *** | AI generation |
| 07 Field.io | **o | **o | *oo | **o | *** | *** | AI generation |
| 08 Resn | *** | *oo | *oo | *oo | **o | **o | AI generation |
| 09 Experimental Jetset | **o | **o | **o | **o | *** | **o | Hybrid |
| 10 Muller-Brockmann | **o | *** | *** | *** | **o | *oo | HTML |
| 11 Build | *** | *** | **o | *oo | *** | *oo | HTML |
| 12 Sagmeister & Walsh | **o | *** | *oo | **o | *** | *** | AI generation |
| 13 Zach Lieberman | *oo | *oo | *oo | **o | *** | *** | AI generation |
| 14 Raven Kwok | *oo | **o | *oo | **o | *** | *** | AI generation |
| 15 Ash Thorp | **o | **o | *oo | *oo | *** | *** | AI generation |
| 16 Territory Studio | **o | **o | *oo | **o | *** | *** | AI generation |
| 17 Takram | *** | *** | *** | **o | **o | *oo | HTML |
| 18 Kenya Hara | **o | *** | *** | *oo | *** | *oo | HTML |
| 19 Irma Boom | *oo | **o | *** | **o | *** | **o | Hybrid |
| 20 Neo Shen | **o | **o | **o | **o | *** | *** | AI generation |

> Scene fit: *** = strongly recommended / **o = suitable / *oo = needs adaptation
> AI generation: *** = direct output works well / **o = needs adjustment / *oo = HTML execution recommended
> Best path: AI generation (direct image output) / HTML (code-rendered, data-precise) / Hybrid (HTML layout + AI illustrations)

**Core rule of thumb**: styles built on explicit visual elements (illustration / particles / generative art) produce great direct AI output; styles that depend on precise typography and data (grids / information architecture / whitespace) are more controllable when rendered in HTML.

---

## I. Information architecture school (01-04)
> Philosophy: "Data is not decoration, it is building material."

### 01. Pentagram - Michael Bierut style
**Philosophy**: typography is language, the grid is thought
**Key characteristics**:
- Extremely restrained color (black/white + a single brand color)
- A modern reinterpretation of the Swiss grid system
- Typography as the primary visual language
- Strategic use of negative space (60%+ whitespace)

**Prompt DNA**:
```
Pentagram/Michael Bierut style:
- Extreme typographic hierarchy, Helvetica/Univers family
- Swiss grid with precise mathematical spacing
- Black/white + one accent color (#HEX)
- Information architecture as visual structure
- 60%+ whitespace ratio
- Data visualization as primary decoration
```

**Representative work**: Hillary Clinton 2016 campaign identity
**Search keywords**: pentagram hillary logo system

---

### 02. Stamen Design - data poetics
**Philosophy**: let data become a tangible landscape
**Key characteristics**:
- Cartographic thinking applied to information design
- Algorithmically generated organic graphics
- Warm data-visualization palette (ochre, sage green, deep blue)
- Interactive layered systems

**Prompt DNA**:
```
Stamen Design aesthetic:
- Cartographic approach to data visualization
- Organic, algorithm-generated patterns
- Warm palette (terracotta, sage green, deep blues)
- Layered information like topographic maps
- Hand-crafted feel despite digital precision
- Soft shadows and depth
```

**Representative work**: COVID-19 surge map
**Search keywords**: stamen covid map visualization

---

### 03. Information Architects - content-first principle
**Philosophy**: design is not decoration, it is the architecture of content
**Key characteristics**:
- Extreme clarity of content hierarchy
- System fonts only (optimized for reading)
- Adherence to the classic blue hyperlink tradition
- Performance as aesthetic

**Prompt DNA**:
```
Information Architects philosophy:
- Content-first hierarchy, zero decorative elements
- System fonts only (SF Pro/Roboto/Inter)
- Classic blue hyperlinks (#0000EE)
- Reading-optimized line length (66 characters)
- Progressive disclosure of depth
- Text-heavy, fast-loading design
```

**Representative work**: iA Writer app
**Search keywords**: information architects ia writer

---

### 04. Fathom Information Design - scientific narrative
**Philosophy**: every pixel must carry information
**Key characteristics**:
- The rigor of a scientific journal + the elegance of design
- Precise visualization of quantitative data
- A calm, professional palette (gray, navy)
- Designed annotation and citation systems

**Prompt DNA**:
```
Fathom Information Design style:
- Scientific journal aesthetic meets modern design
- Precise data visualization (charts, timelines, scatter plots)
- Neutral scheme (grays, navy, one highlight color)
- Footnote/citation design integrated into layout
- Clean sans-serif (GT America/Graphik)
- Information density without clutter
```

**Representative work**: Bill & Melinda Gates Foundation annual report
**Search keywords**: fathom information design gates foundation

---

## II. Motion poetics school (05-08)
> Philosophy: "Technology itself is a flowing poem."

### 05. Locomotive - master of scroll narrative
**Philosophy**: scrolling is not browsing, it is a journey
**Key characteristics**:
- Silky parallax scrolling
- Cinematic shot-by-shot narrative
- Bold spatial whitespace
- Precise choreography of dynamic elements

**Prompt DNA**:
```
Locomotive scroll narrative style:
- Film-like scene composition with parallax depth
- Generous vertical spacing between sections
- Bold typography emerging from darkness
- Smooth motion blur effects
- Dark mode (near-black backgrounds)
- Strategic glowing accents
- Hero sections 100vh tall
```

**Representative work**: Lusion.co website
**Search keywords**: locomotive scroll lusion

---

### 06. Active Theory - WebGL poets
**Philosophy**: making technology visible is making it understandable
**Key characteristics**:
- 3D particle systems as the core element
- Real-time rendered data visualization
- World-building driven by mouse interaction
- Neon-and-deep-space color palette

**Prompt DNA**:
```
Active Theory WebGL aesthetic:
- Particle systems representing data flow
- 3D visualization in depth space
- Neon gradients (cyan/magenta/electric blue) on dark
- Mouse-reactive environment
- Depth of field and bokeh effects
- Floating UI with glassmorphism
```

**Representative work**: NASA Prospect
**Search keywords**: active theory nasa webgl

---

### 07. Field.io - algorithmic aesthetics
**Philosophy**: code is the designer
**Key characteristics**:
- Generative art systems
- Dynamic graphics that differ on every visit
- Smart orchestration of abstract geometry
- Balance between technical feel and artistry

**Prompt DNA**:
```
Field.io generative design style:
- Abstract geometric patterns, algorithmically generated
- Dynamic composition that feels computational
- Monochromatic base with vibrant accent
- Mathematical precision in spacing
- Voronoi diagrams or Delaunay triangulation
- Clean code aesthetic
```

**Representative work**: British Council digital installations
**Search keywords**: field.io generative design

---

### 08. Resn - narrative-driven interaction
**Philosophy**: every click advances the story
**Key characteristics**:
- Gamified user journeys
- Strongly emotional design
- Deep integration of illustration and code
- Non-linear exploratory experience

**Prompt DNA**:
```
Resn interactive storytelling approach:
- Illustrative style mixed with UI elements
- Gamified exploration (progress indicators)
- Warm color palette despite tech subject
- Character-driven design
- Scroll-triggered animations
- Editorial illustration meets product design
```

**Representative work**: Resn.co.nz portfolio
**Search keywords**: resn interactive storytelling

---

## III. Minimalism school (09-12)
> Philosophy: "Pare it down until you cannot pare any further."

### 09. Experimental Jetset - conceptual minimalism
**Philosophy**: one idea = one form
**Key characteristics**:
- A single visual metaphor running through the whole design
- A Mondrian palette of blue/red/yellow + black/white
- Type as graphic
- Anti-commercial, honest design

**Prompt DNA**:
```
Experimental Jetset conceptual minimalism:
- Single visual metaphor for entire design
- Primary colors only (red/blue/yellow) + black/white
- Typography as main graphic element
- Grid-based with deliberate rule-breaking
- No photography, only type and geometry
- Anti-commercial, honest aesthetic
```

**Representative work**: Whitney Museum identity
**Search keywords**: experimental jetset whitney responsive w

---

### 10. Muller-Brockmann lineage - Swiss-grid purism
**Philosophy**: objectivity is beauty
**Key characteristics**:
- Mathematically precise grid system (8pt baseline)
- Strict left or center alignment
- Monochrome or two-color schemes
- Functionalism above all

**Prompt DNA**:
```
Josef Muller-Brockmann Swiss modernism:
- Mathematical grid system (8pt baseline)
- Strict alignment (flush left or centered)
- Two-color maximum (black + one accent)
- Akzidenz-Grotesk or similar rationalist typeface
- No decorative elements
- Timeless, objective aesthetic
```

**Representative work**: "Grid Systems in Graphic Design"
**Search keywords**: muller brockmann grid systems poster

---

### 11. Build - contemporary minimalist branding
**Philosophy**: refined simplicity is harder than complexity
**Key characteristics**:
- Luxury-grade whitespace (70%+)
- Subtle weight contrast (200-600)
- Strategic use of a single accent color
- A breathing rhythm

**Prompt DNA**:
```
Build studio luxury minimalism:
- Generous whitespace (70%+ of area)
- Subtle typography weight shifts (200 to 600)
- Single accent color used sparingly
- High-end product photography aesthetic
- Soft shadows and subtle gradients
- Golden ratio proportions
```

**Representative work**: Build studio portfolio
**Search keywords**: build studio london branding

---

### 12. Sagmeister & Walsh - joyful minimalism
**Philosophy**: beauty is the emotional dimension of function
**Key characteristics**:
- Unexpected bursts of color
- A blend of handmade and digital
- A positive, upbeat visual language
- Experimental yet legible

**Prompt DNA**:
```
Sagmeister & Walsh joyful philosophy:
- Unexpected color bursts on minimal base
- Handmade elements (physical objects in digital)
- Optimistic visual language
- Experimental typography that remains legible
- Human warmth through imperfection
- Mix of analog and digital aesthetics
```

**Representative work**: The Happy Show
**Search keywords**: sagmeister walsh happy show

---

## IV. Experimental avant-garde school (13-16)
> Philosophy: "Breaking the rules is creating new ones."

### 13. Zach Lieberman - poetics of code
**Philosophy**: programming is painting
**Key characteristics**:
- Algorithmic graphics with a hand-drawn feel
- Real-time generative art
- Pure black-and-white expression
- Visibility of the tool itself

**Prompt DNA**:
```
Zach Lieberman code-as-art style:
- Hand-drawn aesthetic generated by code
- Black and white only, no color
- Real-time generative patterns
- Sketch-like line quality
- Visible process/grid/construction lines
- Poetic interpretation of algorithms
```

**Representative work**: openFrameworks creative coding
**Search keywords**: zach lieberman openframeworks generative

---

### 14. Raven Kwok - parametric aesthetics
**Philosophy**: the beauty of a system surpasses the beauty of the individual
**Key characteristics**:
- Fractal and recursive graphics
- High-contrast black and white
- Architectural information structures
- Algorithmic interpretation of Eastern garden principles

**Prompt DNA**:
```
Raven Kwok parametric aesthetic:
- Fractal patterns and recursive structures
- High-contrast black and white
- Architectural visualization of data
- Chinese garden principles in algorithm form
- Intricate detail that rewards zooming
- Processing/Creative coding aesthetic
```

**Representative work**: Raven Kwok generative art exhibitions
**Search keywords**: raven kwok processing generative art

---

### 15. Ash Thorp - cyber poetics
**Philosophy**: the future is not cold; it is a lonely poem
**Key characteristics**:
- Cinematic light and shadow
- A warm flavor of cyberpunk (orange/teal, not cold blue)
- Narrative concept design
- Refined industrial aesthetics

**Prompt DNA**:
```
Ash Thorp cinematic concept art:
- Film-grade lighting and atmospheric effects
- Warm cyberpunk (orange/teal, NOT cold blue)
- Industrial design meets luxury
- Narrative concept art feel
- Volumetric lighting and god rays
- Blade Runner warmth over Tron coldness
```

**Representative work**: Ghost in the Shell concept art
**Search keywords**: ash thorp ghost shell concept art

---

### 16. Territory Studio - fictional screen interfaces
**Philosophy**: today's imagination of tomorrow's UI
**Key characteristics**:
- Screen design from sci-fi films (FUI)
- A holographic-projection feel
- Layered, overlapping data visualization
- Believable futurism

**Prompt DNA**:
```
Territory Studio FUI (Fantasy User Interface):
- Fantasy User Interface design
- Holographic projection aesthetics
- Orange/amber monochrome or cyan accents
- Multiple overlapping data layers
- Believable future technology
- Technical readouts and data streams
```

**Representative work**: Blade Runner 2049 screen graphics
**Search keywords**: territory studio blade runner interface

---

## V. Eastern philosophy school (17-20)
> Philosophy: "Whitespace is content."

### 17. Takram - Japanese speculative design
**Philosophy**: technology is a medium for thinking
**Key characteristics**:
- Elegance of conceptual prototypes
- Soft technological feel (rounded corners, gentle shadows)
- Diagrams as art
- Modest sophistication

**Prompt DNA**:
```
Takram Japanese speculative design:
- Elegant concept prototypes and diagrams
- Soft tech aesthetic (rounded corners, gentle shadows)
- Charts and diagrams as art pieces
- Modest sophistication
- Neutral natural colors (beige, soft gray, muted green)
- Design as philosophical inquiry
```

**Representative work**: NHK Fabricated City
**Search keywords**: takram nhk data visualization

---

### 18. Kenya Hara - the design of emptiness
**Philosophy**: design is not filling, it is emptying
**Key characteristics**:
- Extreme whitespace (80%+)
- Digital interpretation of paper texture
- Layers of white (warm white, cool white, off-white)
- Visualization of touch

**Prompt DNA**:
```
Kenya Hara "emptiness" design:
- Extreme whitespace (80%+)
- Paper texture and tactility in digital form
- Layers of white (warm white, cool white, off-white)
- Minimal color (if any, very desaturated)
- Design by subtraction not addition
- Zen simplicity
```

**Representative work**: Muji art direction, "Designing Design"
**Search keywords**: kenya hara designing design muji

---

### 19. Irma Boom - book architect
**Philosophy**: the physical poetics of information
**Key characteristics**:
- Non-linear information architecture
- Play with edges and boundaries
- Unexpected color combinations (pink+red, orange+brown)
- Digital translation of craft

**Prompt DNA**:
```
Irma Boom book architecture style:
- Non-linear information structure
- Play with edges, margins, boundaries
- Unexpected color combos (pink+red, orange+brown)
- Handcraft translated to digital
- Dense information inviting exploration
- Editorial design, unconventional grid
```

**Representative work**: SHV Think Book (2136 pages)
**Search keywords**: irma boom shv think book

---

### 20. Neo Shen - poetic Eastern light and shadow
**Philosophy**: technology needs human warmth
**Key characteristics**:
- Digital interpretation of ink wash
- Soft halo effects
- Poetic whitespace
- Emotional palette (deep blue, warm gray, soft gold)

**Prompt DNA**:
```
Neo Shen poetic Chinese aesthetic:
- Digital interpretation of ink wash painting
- Soft glow and light diffusion effects
- Poetic negative space
- Emotional palette (deep blues, warm grays, soft gold)
- Calligraphic influences in typography
- Atmospheric depth
```

**Representative work**: Neo Shen digital art series
**Search keywords**: neo shen digital ink wash art

---

## How to use the prompts

**Composition formula**: `[style prompt DNA] + [scene template (see scene-templates.md)] + [specific content]`

### Core principle: describe mood, not layout (Mood, Not Layout)

The key to AI image generation: short prompts beat long prompts. Three sentences describing mood and content work better than 30 lines of layout detail.

| Diversity-killing writing | Creativity-igniting writing |
|----------------|----------------|
| Specifying color ratios (60%/25%/15%) | Describing mood ("warm like Sunday morning") |
| Prescribing layout positions ("title centered, image on the right") | Citing a specific aesthetic ("Pentagram editorial feel") |
| Restricting character poses and expressions | Letting the AI interpret the style naturally |
| Listing every visual element to include | Describing what the audience should feel |

### Good / Bad examples

**Bad - over-constrained (AI output looks empty and flat):**
```
Professional presentation slide. Dark background, light text.
Title centered at top. Two columns below. Left column: bullet points.
Right column: bar chart. Colors: navy 60%, white 30%, gold 10%.
Font size: title 36pt, body 18pt. Margins: 40px all sides.
```

**Good - mood-driven (generates diverse, textured output):**
```
A data visualization that feels like a Bloomberg Businessweek
editorial spread. The key number "28.5%" should dominate the
composition like a headline. Warm cream tones with sharp black
typography. The data tells a story of dramatic channel shift.
```

### Choosing the execution path

Pick from the "Best path" column of the lookup table:
- **AI generation**: styles with explicit visual elements (06/07/12/13/14/15/16/20) - direct output via Gemini/Midjourney
- **HTML rendering**: styles dependent on precise typography (01/03/04/10/11/17/18) - control data and layout via code
- **Hybrid**: HTML for layout skeleton + AI-generated illustrations/backgrounds (02/05/08/09/19)

### Quality control

1. X Don't write "in the style of Pentagram" directly -> v Describe specific design characteristics
2. Text often comes out wrong in AI generation -> replace text after generation
3. Proportions distort easily -> specify aspect ratio explicitly
4. Generate 3-5 variants first, pick the best, then refine

**Default aesthetic no-go zones** (users can override per their brand):
- X Cyber-neon / dark navy backgrounds (#0D1117)
- X Personal signature/watermark on cover images

---

**Version**: v2.1
**Updated**: 2026-02-13
**Applies to**: web / PPT / PDF / infographics / covers / illustrations / apps and all other visual design
**Integration with image-to-slides**: PPT scenes can reference styles in this file directly and execute generation through the image-to-slides skill
