---
name: design-direction
description: Use when the brief is vague, the visual style is unset, or the user asks which direction to pick.
when_to_use: |
  Trigger phrases: "I don't know what style", "recommend a style", "pick a philosophy", "give me directions", "design advisor", "which style should I use", "make it look good", "design something for me" (vague), "what style should I use".
allowed-tools: WebSearch, Bash, Read, Write, Edit, Glob, Grep
---

# erfana:design-direction

You are a design director, not a producer. Output is three differentiated visual philosophies the user picks from, plus three executed demos in those philosophies, so the user can compare apples-to-apples before committing.

## Core principle

The user does not know what they want until they see it. Three concrete options beat one consensus mush. Each option is a real philosophy with documented practitioners and a visual DNA – never a generic adjective.

## When this skill applies

- "Make it look good" / "design something for me" / "make it pretty" – no chosen direction
- "Which style works for X?" – explicit advisory request
- Before any major design task when no brand context exists

After this skill picks a direction, dispatch to the appropriate output skill:
- Prototype → `erfana:design-prototype`
- Slide deck → `erfana:design-slides`
- Animation → `erfana:design-motion`
- Infographic → `erfana:design-infographic`

## Process (8 phases)

1. **Understand the brief** – output type, audience, constraints, mood keywords.
2. **Restate** the brief in one paragraph so the user can correct.
3. **Recommend 3 differentiated philosophies** from `references/design-styles.md` (20 schools: Pentagram, Stamen, Information Architects, Kenya Hara, Sagmeister, Field.io, Takram, etc.). Pick three that span the design space (e.g., information-dense + minimal + experimental) so the comparison is meaningful.
4. **Show prebuilt samples** for each philosophy from `../design-shared/assets/showcases/` (8 scenarios × 3 styles = 24 prebuilt HTML+PNG samples).
5. **Generate 3 visual demos** in parallel – small, fast, real, side-by-side. Use `../design-shared/assets/design_canvas.jsx` for the comparison grid.
6. **User picks one**.
7. **AI prompts**: surface the philosophy DNA – fonts, colors, spacing rhythm, motion vocabulary – so the chosen philosophy can be applied consistently downstream.
8. **Lock direction**: hand off to the chosen output skill with the philosophy spec attached.

## Anti-patterns

- Generic adjectives ("modern", "clean", "professional") – meaningless without a school anchor.
- Three options that are minor variations of the same thing – defeats the comparison.
- Skipping the prebuilt sample step – the user picks better when they see real artifacts.
- Recommending a philosophy you can't execute. If your toolkit can't do Field.io kinetic poetics, don't offer it.

## References

- `references/design-styles.md` – 20 philosophies, school classifications, prompt DNA
- `references/scene-templates.md` – output-type templates (cover / PPT / infographic) mapped to style fit
- `../design-shared/assets/showcases/INDEX.md` – 24 prebuilt samples (8 scenarios × 3 styles)
- `../design-shared/references/design-context.md` – taste anchors when no context exists
- `../design-shared/references/content-guidelines.md` – anti-slop defaults if no brand exists
- `../design-shared/references/workflow.md` – Phase 1–8 advisor flow

## Assets

- `../design-shared/assets/showcases/` – 8 scenario directories (cover, ppt, infographic, website-*), each with 3 HTML + 3 PNG variants
- `../design-shared/assets/design_canvas.jsx` – 3-variant comparison grid

## Examples

- `../design-shared/demos/w3-fallback-advisor.html` – full 8-phase advisor flow
- `../design-shared/demos/c5-infographic.html` – direction → infographic execution

## Terminal state

Always dispatches to a specific output skill after the direction is locked. This skill never produces final deliverables – it produces a chosen direction.
