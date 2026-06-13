# Design context: start from what already exists

**This is the most important "one thing" of this skill.**

A great hi-fi design always grows out of existing design context. **Doing hi-fi from scratch is a last resort and will always produce generic work.** So at the start of every design task, ask: is there anything to reference?

## What design context is

In priority order, high to low:

### 1. The user's design system / UI kit
Their product's existing component library, color tokens, type spec, and icon system. **The ideal case.**

### 2. The user's codebase
If the user gives you a repo, it has live component implementations. Read those component files:
- `theme.ts` / `colors.ts` / `tokens.css` / `_variables.scss`
- Concrete components (Button.tsx, Card.tsx)
- Layout scaffold (App.tsx, MainLayout.tsx)
- Global stylesheets

**Read the code and copy exact values**: hex codes, spacing scale, font stack, border radius. Do not redraw from memory.

### 3. The user's shipped product
If the user has a live product but no code, use Playwright or ask the user for screenshots.

```bash
# Screenshot a public URL with Playwright
npx playwright screenshot https://example.com screenshot.png --viewport-size=1920,1080
```

This lets you see the real visual vocabulary.

### 4. Brand guidelines / logos / existing assets
Users may have: logo files, brand color specs, marketing collateral, slide templates. All of these are context.

**For brands shipped in this plugin** (e.g. `skills/design-shared/brands/erfana/`): brands may declare per-library prose rules at `<library>/RULES.md` next to `<library>/INDEX.md`. The INDEX is the catalogue; the RULES file is the brandbook-derived deep prose (construction grids, compositional rules, geometric modules, forbidden uses). Sub-skills consult **both** when picking from a library – the catalogue tells you what is available, the rules tell you what counts as on-brand.

### 5. Competitor reference
The user says "like XX site" – ask for a URL or screenshot. **Do not** rely on a fuzzy memory from training data.

### 6. Known design systems (fallback)
If none of the above exist, base on a recognized system:
- Apple HIG
- Material Design 3
- Radix Colors (palette)
- shadcn/ui (components)
- Tailwind default palette

State explicitly which one you are using so the user knows it is a starting point, not the final.

## Process for collecting context

### Step 1: ask the user

The mandatory question list at task start (from `workflow.md`):

```markdown
1. Do you have an existing design system / UI kit / component library? Where?
2. Brand guidelines, color/type specs?
3. Can you share screenshots or URLs of the existing product?
4. Is there a codebase I can read?
```

### Step 2: when the user says "no", help them find some

Do not give up. Try:

```markdown
Let me see if there are any leads:
- Have any of your previous projects produced relevant designs?
- What colors / type does the company marketing site use?
- What is the style of your product logo? Could you send me one?
- Are there any products you admire as references?
```

### Step 3: read everything you can find

If the user gives you a codebase path, read it:
1. **First, list the file structure** – find files related to style/theme/components
2. **Read theme/token files** – lift concrete hex/px values
3. **Read 2-3 representative components** – see the visual vocabulary (hover state, shadow, border, padding patterns)
4. **Read the global stylesheet** – base resets, font loading
5. **If there is a Figma link / screenshot** – look at it, but **trust the code more**

**Important**: **do not** glance once and design from impression. Only after lifting 30+ concrete values have you really internalized the context.

### Step 4: vocalize the system you intend to use

Once you have looked at the context, tell the user the system you will use:

```markdown
Based on your codebase and product screenshots, here is the design system I am extracting:

**Color**
- Primary: #C27558 (from tokens.css)
- Background: #FDF9F0
- Text: #1A1A1A
- Muted: #6B6B6B

**Type**
- Display: Instrument Serif (from @font-face in global.css)
- Body: Geist Sans
- Mono: JetBrains Mono

**Spacing** (from your scale)
- 4, 8, 12, 16, 24, 32, 48, 64

**Shadow patterns**
- `0 1px 2px rgba(0,0,0,0.04)` (subtle card)
- `0 10px 40px rgba(0,0,0,0.1)` (elevated modal)

**Border-radius**
- Small components 4px, cards 12px, buttons 8px

**Component vocabulary**
- Button: filled primary, outlined secondary, ghost tertiary, all 8px radius
- Card: white background, subtle shadow, no border

I will start working with this system. Confirm it looks right?
```

Wait for confirmation before proceeding.

## Designing from scratch (fallback when there is no context)

**Strong warning**: output quality drops markedly in this mode. Tell the user clearly.

```markdown
You do not have any design context, so I have to rely on general intuition.
The output will be the kind of "looks OK but lacks distinction" work.
Do you want to continue, or supply some reference material first?
```

If the user insists, make decisions in this order:

### 1. Pick an aesthetic direction
Do not produce a generic result. Pick a clear direction:
- brutally minimal
- editorial / magazine
- brutalist / raw
- organic / natural
- luxury / refined
- playful / toy
- retro-futuristic
- soft / pastel

Tell the user which one you picked.

### 2. Pick a known design system as the skeleton
- Use Radix Colors for the palette (https://www.radix-ui.com/colors)
- Use shadcn/ui for component vocabulary (https://ui.shadcn.com)
- Use Tailwind spacing scale (multiples of 4)

### 3. Pick a distinctive type pairing

Do not use Inter / Roboto. Suggested pairings (free from Google Fonts):
- Instrument Serif + Geist Sans
- Cormorant Garamond + Inter Tight
- Bricolage Grotesque + Söhne (paid)
- Fraunces + Work Sans (note: Fraunces is over-used by AI)
- JetBrains Mono + Geist Sans (technical feel)

### 4. Every key decision needs a reasoning

Do not pick silently. Note the rationale in HTML comments:

```html
<!--
Design decisions:
- Primary color: warm terracotta (oklch 0.65 0.18 25) – fits the "editorial" direction
- Display: Instrument Serif for humanist, literary feel
- Body: Geist Sans for cleanness contrast
- No gradients – committed to minimal, no AI slop
- Spacing: 8px base, golden ratio friendly (8/13/21/34)
-->
```

## Import strategy (user provides a codebase)

If the user says "import this codebase as reference":

### Small (<50 files)
Read all of it. Internalize the context.

### Medium (50-500 files)
Focus on:
- `src/components/` or `components/`
- All style / token / theme files
- 2-3 representative full-page components (Home.tsx, Dashboard.tsx)

### Large (>500 files)
Have the user point to the focus area:
- "I want a settings page" -> read existing settings code
- "I want a new feature" -> read the overall shell + the closest existing reference
- Aim for accuracy, not completeness.

## Working with Figma / mockups

If the user provides a Figma link:

- **Do not** expect to "convert Figma to HTML" directly – that needs extra tooling
- Figma links are usually not publicly accessible
- Have the user: export to **screenshots** and send them + tell you the specific color / spacing values

If only a Figma screenshot is provided, tell the user:
- I can see the visuals but cannot extract exact values
- Send me the key numbers (hex, px), or export as code (Figma supports that)

## Final reminder

**The quality ceiling of a project's design is set by the quality of context you receive.**

Spending 10 minutes collecting context is more valuable than spending 1 hour drawing hi-fi from scratch.

**When there is no context, your first move should be to ask the user – not to push through.**
