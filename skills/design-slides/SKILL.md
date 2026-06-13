---
name: design-slides
description: Use when the user wants a slide deck, pitch deck, keynote, or presentation in any format.
when_to_use: |
  Trigger phrases: "design a deck", "design a slide deck", "pitch deck", "keynote", "presentation", "PPT", "editable PPTX", "speaker notes", "multi-page presentation".
allowed-tools: WebSearch, Bash, Read, Write, Edit, Glob, Grep
---

# erfana:design-slides

You are a slide designer working in HTML. Output is a 1920x1080 aggregator HTML usable as live presentation, exportable to PDF (via Playwright per-page) or editable PPTX (with 4 hard constraints preserved).

## Core principle

Showcase before scale: produce one beautiful slide at the chosen direction first; only after the user approves the visual style do you build the full deck. Generic decks are worse than no deck.

## When this skill applies

- Pitch decks (investor / client / internal)
- Keynote-style decks for talks
- Multi-page presentations (≥10 pages → multi-file aggregator; ≤10 pages → single-file deck)
- Editable PPTX delivery for clients who need to edit downstream

Out of scope:
- Interactive prototypes → use `erfana:design-prototype`
- Animated / motion-heavy decks → start here, escalate selected slides to `erfana:design-motion`
- Vague brief → use `erfana:design-direction` first

## Process

1. **Run the pre-flight checklist** – see `references/slide-decks.md` "Pre-flight checklist (do these BEFORE writing any slide HTML)". The checklist covers delivery format, architecture choice (with decision tree), 2 maximally different showcase pages, the design-system-out-loud step (dispatch to `erfana:design-direction` if no brand context), and small-font legibility. Don't paraphrase it inline anywhere – it's the single source of truth.
2. **Build 2 showcase pages** – full visual fidelity, not wireframes. Cover + densest content page surfaces overflow, font-legibility, and empty-space failures before scale. Get user approval before going further.
3. **Use the 3-zone flex layout** for content slides (`zone-top` / `zone-mid` / `zone-bot`). See `references/slide-decks.md` "Vertical distribution" section. Without it, content clusters at the top and leaves dead space at the bottom.
4. **Tag-qualify shared selectors.** `main.body` not `.body` – generic class names in shared CSS leak into per-slide content and crush paragraph text into 8 px columns. See "Class-name collision warning" in `slide-decks.md`.
5. **Scale to all pages** following the approved direction. Run the strict overflow check (see `../design-shared/references/verification.md` "Slide-fit verification") on every slide – `scrollHeight === 1080` is unreliable when `body { overflow: hidden }`.
5b. **Per-slide independent review.** After each slide reaches first-pass completion, dispatch one fresh `general-purpose` Task subagent per slide with a frozen review prompt. The reviewer reads only that slide's HTML + the active brand's `CLAUDE.md` and returns ranked Keep / Fix bullets covering: brand-token compliance, font floor (≥20 px), footer uniformity, logo presence on every slide, hierarchy contrast, opacity (forbidden on brand colours), letter-spacing (forbidden), ALL-CAPS (forbidden), 8 px grid alignment, **no text-only slides** (every content slide must carry a non-typographic element). Reviews run **in parallel** (one subagent per slide). The orchestrator MUST apply Fix items before declaring the deck ready – this is a verification gate, not a feedback request.
6. **Speaker notes** in the HTML (hidden in presentation mode, exported to PPTX notes pane).
7. **Editable PPTX**: enforce 4 hard constraints (see `references/editable-pptx.md`):
   - 960x540pt body (not 1920x1080 – PPTX uses points)
   - All text in `<p>` elements (no `<div>` text wrappers)
   - No backgrounds on text elements
   - No `background-image` (PPTX doesn't preserve)
8. **Playwright PDF export** for non-editable distribution.
9. **Optional: live-presentation transitions** – for in-browser presenting, see `references/transitions.md` (curtain-wipe pattern with two-iframe ping-pong).

## Anti-patterns

- Generic SaaS-deck aesthetic (rounded cards, gradient hero) → see `../design-shared/references/content-guidelines.md`.
- **Skipping showcase-before-scale, or building only one showcase.** Every "build me a 30-page deck" request that ships without a 2-page showcase ends up needing rework on overflow, fonts, or layout distribution.
- **`align-content: start` on the body grid with magic `margin-top` spacers between content blocks.** Always leaves dead space at the bottom. Use the 3-zone flex layout instead.
- **Reusing `.body` (or any short generic word) as both layout container class and inner content class.** Rules in shared CSS leak through every iframe.
- **Any text element under 20 px.** The hard floor is 20 px – no captions, labels, footnotes, table cells, axis labels, or inline icon glyphs may render below that. The previously-documented sub-floors (mono labels at 14 px, footer at 15 px, side-index at 16 px) are SUPERSEDED. See `references/slide-decks.md` § Scale.
- Backgrounds on text elements when PPTX export is requested. The constraint is brittle.
- Multi-file deck where each file embeds its own copy of the same CSS/JS. Use the aggregator pattern.
- **Path B (single-file `<deck-stage>`) currently uses the inner-HTML setter in its shadow-root template** – incompatible with security hooks that block that setter (e.g., XSS-prevention pre-tool-use hooks). Until ported, prefer Path A (multi-file aggregator) in hook-strict environments. The aggregator's own counter and print-stack writes are already safe-DOM.

## References

- `references/slide-decks.md` – HTML-first architecture, decision tree, **pre-flight checklist**, **class-name collision warning**, **3-zone flex layout**, font-size minimums, showcase-before-scale, multi-file aggregation
- `references/editable-pptx.md` – 4 hard constraints + retrofit fallback path
- `references/transitions.md` – live in-browser curtain-wipe transition pattern (two-iframe ping-pong + traveling rule)
- `../design-shared/references/workflow.md` – question templates, delivery-format checkpoint
- `../design-shared/references/content-guidelines.md` – anti-slop, typography, color rules
- `../design-shared/references/design-context.md` – brand grounding for slide tone
- `../design-shared/references/verification.md` – **slide-fit overflow check**, **mid-animation WAA snapshots**, Playwright PDF export verification
## Scripts

- `../design-shared/scripts/export_deck_pdf.mjs` – multi-file deck PDF export
- `../design-shared/scripts/export_deck_pptx.mjs` – multi-file deck PPTX export
- `../design-shared/scripts/export_deck_stage_pdf.mjs` – single-file deck PDF export
- `../design-shared/scripts/html2pptx.js` – direct HTML→PPTX bridge

## Examples

- `../design-shared/demos/c2-slides-pptx.html` – animated single-file showcase that demonstrates the PDF + PPTX export pipeline. **Note**: this demo is an animated motion-first showcase and does NOT use the canonical Path A template skeleton (`<main class="body">` + 3-zone scaffold). Treat it as an export-pipeline reference, not a layout template. For canonical Path A layout, follow `references/slide-decks.md` "Per-slide template skeleton" and build a fresh deck.

## Terminal state

After deck delivery, if the user wants critique, dispatch to `erfana:design-review`. If they want to animate selected slides, escalate those to `erfana:design-motion`.
