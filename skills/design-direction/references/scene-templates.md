# Scene template library: organized by output type

> Use together with the "prompt DNA" entries in design-styles.md.
> Formula: `[style prompt DNA] + [scene template] + [specific content description]`

---

## 1. WeChat cover / article hero

**Specs**:
- Cover image: 2.35:1 (900x383 px or 1200x510 px)
- In-article illustration: 16:9 (1200x675 px) or 4:3 (1200x900 px)

**Key design considerations**:
- Visual impact first (users scroll past quickly in the feed)
- Minimal or no text (the WeChat title overlays the image)
- Moderate color saturation (WeChat's reading environment leans white)
- Avoid heavy detail (must remain recognizable as a thumbnail)

**Recommended styles**: 01 Pentagram / 11 Build / 12 Sagmeister / 18 Kenya Hara / 07 Field.io

**Scene prompt template**:
```
[style DNA goes here]
- Article cover image for WeChat subscription
- Landscape format, 2.35:1 aspect ratio
- Bold visual impact, minimal or no text
- Moderate color saturation for white reading environment
- Must remain recognizable as thumbnail
- Clean composition with clear focal point
```

---

## 2. In-article illustrations / concept art

**Specs**:
- 16:9 (1200x675 px) – most general purpose
- 1:1 (800x800 px) – for emphasis
- 4:3 (1200x900 px) – for information-dense compositions

**Key design considerations**:
- Serves the article's argument, not decoration
- Forms a visual rhythm with surrounding context
- Expresses one core concept simply
- AI-generated first; HTML screenshot only when you need a precise data table

**Recommended styles**: pick to match article tone – common picks are 01/04/10/17/18

**Scene prompt template**:
```
[style DNA goes here]
- Article illustration, concept visualization
- [16:9 / 1:1 / 4:3] aspect ratio
- Single clear concept: [describe the core concept]
- Serve the argument, not decoration
- [Light/Dark] background to match article tone
```

---

## 3. Infographic / data visualization

**Specs**:
- Vertical long image: 1080x1920 px (mobile reading)
- Horizontal: 1920x1080 px (embedded in articles)
- Square: 1080x1080 px (social media)

**Key design considerations**:
- Clear information hierarchy (title -> key data -> details)
- Accurate data, no fabrication
- Visual flow lines (the reader's eye path)
- Use icons / charts to aid comprehension where appropriate

**Recommended styles**: 04 Fathom / 10 Müller-Brockmann / 02 Stamen / 17 Takram

**Scene prompt template**:
```
[style DNA goes here]
- Infographic / data visualization
- [Vertical 1080x1920 / Horizontal 1920x1080 / Square 1080x1080]
- Clear information hierarchy: title -> key data -> details
- Visual flow guiding reader's eye path
- Icons and charts for comprehension
- Data-accurate, no decorative distortion
```

---

## 4. PPT / Keynote presentation

**Specs**:
- Standard: 16:9 (1920x1080 px)
- Widescreen: 16:10 (1920x1200 px)

**Key design considerations**:
- One core message per slide (no piling)
- Clear type hierarchy (title 40pt+ / body 24pt+ / annotation 16pt+)
- Generous whitespace – clearer when projected
- At least 60:40 image-to-text ratio
- Consistent visual system (color, type, spacing)

**Recommended styles**: 01 Pentagram / 10 Müller-Brockmann / 11 Build / 18 Kenya Hara / 04 Fathom

**Scene prompt template**:
```
[style DNA goes here]
- Presentation slide design, 16:9
- One core message per slide
- Clear type hierarchy (title 40pt+, body 24pt+)
- Generous whitespace for projection clarity
- Consistent visual system throughout
- [Light/Dark] theme
```

---

## 5. PDF white paper / technical report

**Specs**:
- A4 portrait (210x297 mm / 595x842 pt)
- Letter portrait (216x279 mm / 612x792 pt)

**Key design considerations**:
- Optimized for long-form reading (66-character line width, line-height 1.5-1.8)
- Clear chapter navigation system
- Consistent header / footer / page-number design
- Charts and body text coexist gracefully
- Citation / footnote system
- Refined cover page

**Recommended styles**: 10 Müller-Brockmann / 04 Fathom / 03 Information Architects / 17 Takram / 19 Irma Boom

**Scene prompt template**:
```
[style DNA goes here]
- PDF document / white paper design
- A4 portrait format (210x297mm)
- Long-form reading optimized (66 char line width, 1.5 line height)
- Clear chapter navigation system
- Elegant header/footer/page number design
- Charts integrated with body text
- Professional cover page
```

---

## 6. Landing page / product website

**Specs**:
- Desktop: design at 1440 px width (responsive down to 320 px)
- Hero height: 100vh

**Key design considerations**:
- Hero communicates the core value within 5 seconds
- Clear CTA (action button)
- Scroll narrative (problem -> solution -> proof -> action)
- Mobile responsiveness
- Loading speed

**Recommended styles**: 05 Locomotive / 01 Pentagram / 11 Build / 08 Resn / 06 Active Theory

**Scene prompt template**:
```
[style DNA goes here]
- Landing page / product website
- Desktop 1440px width, responsive
- Hero section 100vh, core value in 5 seconds
- Clear CTA button design
- Scroll narrative: problem → solution → proof → action
- Modern web aesthetic
```

---

## 7. App UI / prototype interface

**Specs**:
- iOS: 390x844 pt (iPhone 15)
- Android: 360x800 dp
- Tablet: 1024x1366 pt (iPad Pro)

**Key design considerations**:
- Touch-friendly (minimum 44x44 pt tap targets)
- Consistent with the platform's design language
- Standard treatment of status bar / navigation bar / tab bar
- Moderate information density (avoid cramming on mobile)

**Recommended styles**: 17 Takram / 11 Build / 03 Information Architects / 01 Pentagram

**Scene prompt template**:
```
[style DNA goes here]
- Mobile app UI design
- iOS [390×844pt] / Android [360×800dp]
- Touch-friendly (44pt minimum tap targets)
- Consistent design system
- Standard status bar / navigation / tab bar
- Moderate information density
```

---

## 8. Xiaohongshu (RED) image

**Specs**:
- Vertical: 3:4 (1080x1440 px) – best
- Square: 1:1 (1080x1080 px)
- Cover image determines click-through rate

**Key design considerations**:
- Visual appeal first (competing in the waterfall feed)
- A small amount of text is OK (but no more than 20% of the canvas)
- Vivid colors but not tacky
- Lifestyle / texture / atmosphere feel

**Recommended styles**: 12 Sagmeister / 11 Build / 20 Neo Shen / 09 Experimental Jetset

**Scene prompt template**:
```
[style DNA goes here]
- Social media image for Xiaohongshu (RED)
- Vertical 3:4 (1080×1440px)
- Eye-catching in waterfall feed
- Minimal text overlay (under 20% of area)
- Vivid but tasteful colors
- Lifestyle/texture/atmosphere feel
```

---

## Combined example

**Scenario**: WeChat cover for an article introducing an AI coding tool – should feel professional but warm

**Step 1**: pick a style -> 17 Takram (professional + warm)
**Step 2**: combine Takram's prompt DNA + the WeChat cover template

```
Takram Japanese speculative design:
- Elegant concept prototypes and diagrams
- Soft tech aesthetic (rounded corners, gentle shadows)
- Charts and diagrams as art pieces
- Modest sophistication
- Neutral natural colors (beige, soft gray, muted green)
- Design as philosophical inquiry

Article cover image for WeChat subscription
- Landscape format, 2.35:1 aspect ratio (1200×510px)
- Bold visual impact, minimal text
- Moderate color saturation for white reading environment
- Must remain recognizable as thumbnail
- Clean composition with clear focal point

Content: An AI coding assistant tool, showing the concept of human-AI collaboration
in software development, warm and professional atmosphere
```

---

**Version**: v1.0
**Updated**: 2026-02-13
