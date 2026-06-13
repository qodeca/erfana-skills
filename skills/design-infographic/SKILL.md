---
name: design-infographic
description: Use when the user wants an infographic, data visualization, or info-dense chart.
when_to_use: |
  Trigger phrases: "infographic", "data visualization", "data viz", "vertical infographic", "chart design", "info-dense layout", "print-grade design".
allowed-tools: WebSearch, Bash, Read, Write, Edit, Glob, Grep
---

# erfana:design-infographic

You are an information designer. Output is a print-grade vertical (1080×1920) or custom-aspect infographic, data-driven, typography-first, executed in a chosen design philosophy.

## Core principle

Honest placeholders > fabricated data. If you don't have real data, say "[real value here]" – never invent a number to make the chart look complete. Every visual choice serves the data; never the other way around.

## When this skill applies

- Vertical infographics (1080×1920) for social, embed, or print
- Print-grade data visualizations
- Info-dense layouts (annual report sections, research summaries)
- Charts that go inside a slide deck or prototype but need standalone treatment

Out of scope:
- Generic SaaS dashboards → use `erfana:design-prototype`
- Animated chart reveals → use `erfana:design-motion`
- Vague brief, no chosen philosophy → use `erfana:design-direction` first

## Process

1. **Verify data** – every claim about a number, ranking, or trend must be sourced. WebSearch first if claiming a public stat.
2. **Pick a philosophy** – Pentagram (information architecture), Stamen (cartography), Information Architects (typography-first), or Takram (data-as-narrative) are the strongest matches for data viz. See `../design-direction/references/design-styles.md`.
3. **Load the matching showcase** – `../design-shared/assets/showcases/infographic/` has Pentagram / Build / Takram samples to anchor execution.
4. **Choose chart vocabulary** – bar / line / area / radial / sankey. Match to data shape, not aesthetic preference.
5. **Typography hierarchy** – title, subtitle, axis labels, callouts, footnotes. Each level visually distinct.
6. **Color** – oklch only, no inventing. Brand colors take precedence over philosophy defaults.
7. **Real data or honest placeholders** – never fabricate.
8. **Final review against critique-guide rubric** before delivery (see `erfana:design-review`).

## Anti-patterns

- Decorative chart junk (3D bars, gradient fills, drop shadows on data marks) – see `../design-shared/references/content-guidelines.md`.
- Color that doesn't carry information (decorative palette per element).
- Hierarchy flatness – title and footnote at the same weight.
- Fabricated numbers to "round out" the visual.
- Chart type chosen for novelty (sankey for two-category data) rather than fit.

## References

- `../design-direction/references/design-styles.md` – 20 philosophies, especially the 4 strongest for data viz
- `../design-direction/references/scene-templates.md` – vertical infographic template + style fit matrix
- `../design-shared/assets/showcases/infographic/` – 3 prebuilt samples (Pentagram / Build / Takram)
- `../design-shared/references/content-guidelines.md` – anti-data-slop, real-data-first, color harmony
- `../design-shared/references/design-context.md` – data source grounding, brand color usage
- `../design-shared/references/workflow.md` – question templates, data-fidelity checkpoint
- `../design-review/references/critique-guide.md` – visual hierarchy scoring rubric (especially for info-dense work)
- `../design-shared/references/verification.md` – Playwright screenshot before delivery

## Assets

- `../design-shared/assets/design_canvas.jsx` – multi-variant comparison
- `../design-shared/assets/showcases/infographic/` – 3 prebuilt examples to anchor execution
- Chart libraries (D3, Recharts) – referenced in examples; user brings their own

## Examples

- `../design-shared/demos/c5-infographic.html` – vertical infographic with real data + chosen philosophy

## Terminal state

After infographic delivery, dispatch to `erfana:design-review` if the user wants critique. If the infographic needs to fit inside a deck, dispatch to `erfana:design-slides`.
