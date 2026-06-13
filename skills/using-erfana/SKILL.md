---
name: using-erfana
description: Use at the start of any conversation that mentions design (prototypes, slide decks, animations, infographics, design critique) or orchestration tasks (managing agents, articles, GitHub issues, consulting reports, skills, or specifications). Establishes the routing rules across erfana sub-skills.
when_to_use: |
  Trigger phrases (design): "design", "prototype", "mockup", "slide deck", "presentation", "animation", "motion graphic", "infographic", "data visualization", "design review", "critique", "make me something", "I need help designing".
  Trigger phrases (orchestration): "create agent", "review agent", "create skill", "review skill", "modernize skill", "apply 4.7 patterns", "update for opus 4.7", "create issue", "implement issue", "review code", "create spec", "write article", "create report".
  Invoke before responding when any of these appear in the user's message.
---

# Using erfana skills

This plugin is an open-source (GPL-3.0-only) Claude Code toolkit maintained by Qodeca sp. z o.o. v4.0.0 widens the plugin from a focused design toolkit into a design + orchestration toolkit, and bundles the 87 shared agents the orchestration skills delegate to. This bootstrap skill is the entry point for every other skill in the plugin.

## Available skills

### Design

| Skill | Use when |
|---|---|
| `erfana:design-direction` | The brief is vague – recommends 3 differentiated philosophies from a 20-school library and produces 3 demos to compare. Run this FIRST when no visual direction is set. |
| `erfana:design-prototype` | Building hi-fi clickable UI prototypes – iOS, Android, web, desktop |
| `erfana:design-slides` | 1920×1080 HTML / PDF / editable PPTX presentation decks |
| `erfana:design-motion` | Timeline-driven animations – MP4 / GIF with optional BGM and SFX |
| `erfana:design-infographic` | Vertical print-grade data visualizations |
| `erfana:design-review` | Scoring completed design work – Keep / Fix / Quick Wins |

### Orchestration

| Skill | Use when |
|---|---|
| `erfana:managing-agents` | Creating, reviewing, modifying, or validating Claude Code agents (lifecycle management with research, design, validation phases) |
| `erfana:managing-articles` | Writing medium-form articles end-to-end – research, outline, draft, review, publish (bilingual Polish/English support) |
| `erfana:managing-issues` | Full lifecycle of GitHub issues – create, implement (multi-phase), review code, and display (read-only `show issue #N` / `list issues` / `find issues` modes added v4.2.2) |
| `erfana:managing-reports` | Creating, reviewing, and validating professional consulting reports (Pyramid Principle, SCQA, Five Cs framework) |
| `erfana:managing-skills` | Creating, reviewing, modifying, and **modernizing** (apply Opus 4.7 patterns) Claude Code skills following Anthropic best practices |
| `erfana:managing-specs` | 4-tier specification management (T1 issue, T2 spec, T3 lite spec, T4 standard spec) |

The orchestration skills delegate substantive work to agents shipped alongside them in `agents/` (87 shared agents) and per-skill `<skill>/agents/` (skill-internal agents). Discovery is automatic; no manual wiring needed.

### Process

| Skill | Use when |
|---|---|
| `erfana:grill-me` | Stress-testing a plan or design – walks the decision tree one question at a time, recommends an answer per branch, explores the codebase before asking when the answer is already encoded there. Added v4.2.3. |

### Verification

| Skill | Use when |
|---|---|
| `erfana:fact-checking` | Validating a markdown analysis document against source materials (interview transcripts, vendor docs, knowledge-base folders) before sharing with stakeholders – extracts atomic factual claims, traces each to its source passage, classifies findings by severity, and applies user-approved corrections. Manual-only via `/erfana:fact-checking <target-file>`; not auto-discovered. Added v4.2.7. |

More skills will appear here as they ship. The list is canonical – if a skill is not listed, it is not part of this plugin.

## The 1% rule

If you think there is even a 1% chance one of these skills applies to what you are doing, **invoke the skill via the `Skill` tool before responding or acting.**

This is not negotiable. This is not optional.

| Rationalization | Reality |
|---|---|
| "This is just a quick mockup, no skill needed." | The skill is calibrated for quick mockups too. Invoke it. |
| "I already know how to design a deck." | The skill enforces the plugin's design conventions you may not remember. Invoke it. |
| "Let me explore the design first." | The skill tells you HOW to explore. Invoke it first. |
| "It's only a one-off." | One-offs become baselines. Invoke it. |

## Skill priority

When multiple instructions conflict, follow this order:

1. **User's explicit instructions** (CLAUDE.md, direct requests). Highest priority.
2. **This plugin's skills**. Override default Claude Code behavior where they conflict.
3. **Default system prompt and other plugins**. Lowest priority.

If the user explicitly says "do not use a skill," follow the user. The user is in control.

## Process-first ordering

When more than one sub-skill could apply, invoke **process skills before output skills**, and **always pick a direction before producing**:

### Design flow

1. **`erfana:design-direction`** runs FIRST when the brief is vague (no chosen visual style, no brand context). Outputs a locked direction the output skills can execute against.
2. **Output skills** (`design-prototype` / `design-slides` / `design-motion` / `design-infographic`) execute the chosen direction. Pick by deliverable type – there is no overlap between them.
3. **`erfana:design-review`** runs AFTER any output skill, before declaring work done. Catches issues a producer's eye missed.

### Orchestration flow

Orchestration skills are independent of the design flow and of each other – pick by domain. They internally enforce their own lifecycle phases (research → design → review → validate, etc.) by delegating to agents in `agents/` and `<skill>/agents/`. There is no top-level orchestration "process" skill – each skill owns its discipline.

If a single conversation needs both a design deliverable and an orchestration task (e.g. a slide deck about a spec), invoke the skills sequentially – the orchestration skill first to lock the source material, then the design skill to render it.

## Brand context (design skills only)

This section governs the design sub-skills only. The orchestration skills are brand-agnostic – they produce code, prose, or artifacts for whatever project they run against and do not consult `../design-shared/brands/`.

The active brand id is declared in `../design-shared/brands/ACTIVE_BRAND` (single-line file, currently `erfana`). All brand identity – colors, typography, voice / tone, logo files, watermark – is sourced from a brand manifest under `../design-shared/brands/<active-brand-id>/`. The `erfana` brand is the default bundle (a neutral, logo-only house brand); do not duplicate its values inline in any skill.

When a sub-skill needs brand values, read the active brand pointer first, then these files (priority #4 in `../design-shared/references/design-context.md`):

- `../design-shared/brands/ACTIVE_BRAND` – single-line file naming the active brand id
- `../design-shared/brands/<id>/brand.json` – manifest (logos, typography, voice, watermark, platforms, tokensContract)
- `../design-shared/brands/<id>/CLAUDE.md` – brand-specific Claude guidance: asset catalogs, hard caveats, when-to-use guidance per deliverable type, pointers to the brand's `INDEX.md` library files. **Read this BEFORE generating brand-styled artwork** – it carries caveats that `brand.json` cannot express (Polish placeholder strings, AI-rendered photo flags, baked-in dark backdrops, etc.).
- `../design-shared/brands/<id>/tokens.tokens.json` – W3C DTCG 2025.10 tokens (color primitives + brand-role aliases, type-family roles), wrapped under a top-level brand-id group
- `../design-shared/brands/<id>/voice.md` – long-form voice / tone prose
- `../design-shared/brands/<id>/illustration.md` – illustration-style prose (separate from voice)
- `../design-shared/brands/<id>/<library>/INDEX.md` – per-library asset catalog (e.g. `<id>/logo/INDEX.md`; a brand may also ship `photos/`, `shapes/`, `backgrounds/`, or `templates/` libraries). Cited by the brand's `CLAUDE.md`; consult on demand when picking a specific asset.
- `../design-shared/brands/<id>/<library>/RULES.md` – brandbook-derived deep prose for that library (construction grids, compositional rules, geometric modules, forbidden uses). Co-located with `INDEX.md` for libraries that ship one. Read alongside `INDEX.md` whenever the deliverable touches that asset class – the catalog tells you what files exist; RULES.md tells you what counts as on-brand placement. The default `erfana` brand is logo-only and ships no RULES.md; brands that ship richer libraries (photos, shapes, …) provide one per library.

Watermark literal for animation / video outputs is `voice.watermark` from the active brand manifest (currently `Created with erfana` for `erfana`). Read it at HTML generation time and inline it into the document; `render-video.js` does not resolve manifests itself. Never `Created by qodesign` (legacy brand) and never any other hardcoded string in scripts or generated HTML.

**Read order for brand-styled artwork**: `ACTIVE_BRAND` → `brand.json` (programmatic values: palette, typography, watermark, library paths) → `CLAUDE.md` (prose guidance, asset catalogs, hard caveats) → `tokens.tokens.json` / `voice.md` / `illustration.md` (when a brand ships one; the default `erfana` brand does not) as needed → relevant `INDEX.md` + sibling `RULES.md` files cited by `CLAUDE.md` (specific assets and the brandbook rules that govern their on-brand use). Do not skip `CLAUDE.md` – it is the brand's single self-describing entry point and carries constraints the manifest cannot express.

To use a different brand, drop a folder under `../design-shared/brands/<brand-id>/` matching `../design-shared/brands/brand.schema.json`, then add the id to the `PRODUCTION_BRANDS` allowlist in `scripts/gate-12-brand-manifests.sh` and edit `ACTIVE_BRAND` to point at it. Discovery is by convention; no skill code needs to change. The new brand's `CLAUDE.md` is where its asset catalogs and caveats are documented – sub-skills find it automatically through this bootstrap. See `../design-shared/brands/README.md` for the full contract.

## Red flags – stop and invoke the skill

These thoughts mean you should stop rationalizing and invoke the relevant skill:

| Thought | What to do |
|---|---|
| "This is just a simple design question." | Questions are tasks. Invoke the matching sub-skill – `erfana:design-direction` for vague briefs, otherwise the deliverable-specific sub-skill. |
| "I'll just sketch this quickly." | The skill calibrates "quickly" too. Invoke it. |
| "I remember how to design a deck." | Skills evolve. Invoke the current version. |
| "The skill is overkill for this." | If the user mentioned design, the skill applies. |
| "I'll just check the references first." | The skill tells you which references apply when. Invoke first. |

## Decision flow

```
User message arrives
    │
    ├─ Wants to stress-test a plan or be grilled on a design?
    │       └─ Yes → erfana:grill-me
    │
    ├─ Mentions an orchestration task (agents, articles, issues, reports, skills, specs)?
    │       ├─ Claude Code agent lifecycle? → erfana:managing-agents
    │       ├─ Medium-form article (research → publish)? → erfana:managing-articles
    │       ├─ GitHub issue (create / implement / review / display)? → erfana:managing-issues
    │       │     (Display sub-modes: "show issue #N", "list issues", "find issues with label X")
    │       ├─ Consulting report (Pyramid / SCQA)? → erfana:managing-reports
    │       ├─ Claude Code skill lifecycle? → erfana:managing-skills
    │       └─ Specification (T1-T4)? → erfana:managing-specs
    │
    ├─ Brief is vague design work (no direction, no brand context)?
    │       └─ Yes → erfana:design-direction (then dispatches to output skill)
    │
    ├─ Mentions a design deliverable type?
    │       ├─ Prototype / app mockup / clickable UI? → erfana:design-prototype
    │       ├─ Slide deck / pitch / keynote / PPTX? → erfana:design-slides
    │       ├─ Animation / motion / MP4 / GIF? → erfana:design-motion
    │       ├─ Infographic / data viz? → erfana:design-infographic
    │       └─ Review / critique / score? → erfana:design-review
    │
    ├─ User typed /erfana:<sub-skill> directly?
    │       └─ Yes → load that skill, execute
    │
    └─ None of the above → no skill in this plugin applies; proceed normally
```

Treat ambiguous matches by invoking the most specific sub-skill. The sub-skill itself can decline if it is the wrong fit and dispatch to a sibling. When a request spans both flows (e.g., "create an issue and design a deck for it"), invoke the orchestration skill first to lock the source material, then the design skill to render it.
