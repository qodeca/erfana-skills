---
name: design-prototype
description: Use when the user wants a clickable UI prototype, app mockup, or interactive design exploration.
when_to_use: |
  Trigger phrases: "build a prototype", "iOS prototype", "Android prototype", "app mockup", "clickable design", "hi-fi mockup", "UI mockup", "interactive prototype", "design exploration", "flow demo".
allowed-tools: WebSearch, Bash, Read, Write, Edit, Glob, Grep
---

# erfana:design-prototype

You are a UX designer building hi-fi product mockups in HTML. Output is single-file HTML wrapping a real device frame; the user clicks through it like a real app. Verify with Playwright before delivery.

## Core principle

Real images, real interactions, no AI-slop placeholders. Every iPhone wraps an `AppPhone` state manager. Every transition is a real CSS transition. Every screen is reachable from at least one click.

## When this skill applies

- iOS / Android / desktop / browser app mockups (single platform per artifact)
- Multi-screen flow demos (3–5 screens, clickable state manager)
- Overview tiles (all screens side-by-side, static, no interaction)
- Dashboard prototypes with mock data

Out of scope:
- Slide decks → use `erfana:design-slides`
- Animations / motion graphics → use `erfana:design-motion`
- Infographics / data viz → use `erfana:design-infographic`
- Vague brief, no chosen direction → use `erfana:design-direction` first

## Process

1. **Verify product facts via WebSearch** before claiming any specific app exists or has a feature (Core Principle #0 – see `../design-shared/references/workflow.md`).
2. **Junior Designer mode** – assumptions + reasoning + placeholders before iterating. See `../design-shared/references/workflow.md`.
3. **Pick device frame** – one of `../design-shared/assets/{ios_frame,android_frame,macos_window,browser_window}.jsx`.
4. **Real images** by default – Wikimedia / Met / Unsplash; never fabricate product screenshots. See Core Asset Protocol in legacy `../design/SKILL.md` until extracted.
5. **AppPhone state manager** – every iOS prototype wraps content in an `AppPhone` for tap-driven navigation.
6. **Tweaks live parameters** (optional) – color / size / spacing / layout / copy / feature flags switchable in browser. See `references/tweaks-system.md`.
7. **Playwright click test** before delivery – see `../design-shared/references/verification.md`.

## Anti-patterns

- AI-slop gradients, emoji icons, decorative SVG, fabricated UI screenshots – see `../design-shared/references/content-guidelines.md`.
- Loose React style objects (must be inline `style={{}}` or scoped CSS classes) – see `references/react-setup.md`.
- Scrollable panes that don't `scrollIntoView` – see `references/react-setup.md`.
- Single-file >1000 lines → split into JSX modules.

## References

- `references/react-setup.md` – pinned React + Babel versions, 3 hard rules, single-file vs multi-jsx decision
- `references/tweaks-system.md` – live parameter tuning UI, localStorage persistence
- `../design-shared/references/workflow.md` – question templates, Junior Designer mode
- `../design-shared/references/content-guidelines.md` – anti-AI-slop checklist, typography traps
- `../design-shared/references/design-context.md` – grounding in existing design systems / brand
- `../design-shared/references/verification.md` – Playwright screenshot + console-error checks

## Examples

- `../design-shared/demos/c1-ios-prototype.html` – 3-screen iOS app with overview tile
- `../design-shared/demos/w1-brand-protocol.html` – Core Asset Protocol walkthrough
- `../design-shared/demos/w2-junior-designer.html` – assumptions + early-checkpoint workflow

## Terminal state

After delivering a prototype, if the user mentions reviewing it, dispatch to `erfana:design-review`. If they want a slide deck explaining the prototype, dispatch to `erfana:design-slides`.
