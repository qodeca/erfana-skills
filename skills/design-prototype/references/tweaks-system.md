# Tweaks: live parameter tuning for design variations

Tweaks is one of the core capabilities of this skill - it lets users switch variations and adjust parameters in real time without touching the source code.

**Cross agent-environment compatibility**: Some native design-agent environments (such as Claude.ai Artifacts) rely on the host's postMessage to write tweak values back into the source code for persistence. This skill uses a **pure front-end localStorage approach** - the experience is identical (state survives page refresh), but persistence happens in the browser's localStorage rather than in source files. This approach works in any agent environment (Claude Code / Codex / Cursor / Trae / etc.).

## When to add Tweaks

- The user explicitly asks for "adjustable parameters" or "switching between versions"
- The design has multiple variations that benefit from side-by-side comparison
- The user did not ask, but you judge that **a few well-chosen tweaks would help the user see the possibility space**

Default recommendation: **add 2-3 tweaks to every design** (color theme / font size / layout variants) even if the user did not ask for them - showing the possibility space is part of the design service.

## Implementation (pure front-end version)

### Basic structure

```jsx
const TWEAK_DEFAULTS = {
  "primaryColor": "#D97757",
  "fontSize": 16,
  "density": "comfortable",
  "dark": false
};

function useTweaks() {
  const [tweaks, setTweaks] = React.useState(() => {
    try {
      const stored = localStorage.getItem('design-tweaks');
      return stored ? { ...TWEAK_DEFAULTS, ...JSON.parse(stored) } : TWEAK_DEFAULTS;
    } catch {
      return TWEAK_DEFAULTS;
    }
  });

  const update = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    try {
      localStorage.setItem('design-tweaks', JSON.stringify(next));
    } catch {}
  };

  const reset = () => {
    setTweaks(TWEAK_DEFAULTS);
    try {
      localStorage.removeItem('design-tweaks');
    } catch {}
  };

  return { tweaks, update, reset };
}
```

### Tweaks panel UI

A floating panel docked to the bottom-right corner. Collapsible:

```jsx
function TweaksPanel() {
  const { tweaks, update, reset } = useTweaks();
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 9999,
    }}>
      {open ? (
        <div style={{
          background: 'white',
          border: '1px solid #e5e5e5',
          borderRadius: 12,
          padding: 20,
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          width: 280,
          fontFamily: 'system-ui',
          fontSize: 13,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <strong>Tweaks</strong>
            <button onClick={() => setOpen(false)} style={{
              border: 'none', background: 'none', cursor: 'pointer', fontSize: 16,
            }}>×</button>
          </div>

          {/* Color */}
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ marginBottom: 4, color: '#666' }}>Primary color</div>
            <input 
              type="color" 
              value={tweaks.primaryColor} 
              onChange={e => update({ primaryColor: e.target.value })}
              style={{ width: '100%', height: 32 }}
            />
          </label>

          {/* Font size slider */}
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ marginBottom: 4, color: '#666' }}>Font size ({tweaks.fontSize}px)</div>
            <input 
              type="range" 
              min={12} max={24} step={1}
              value={tweaks.fontSize}
              onChange={e => update({ fontSize: +e.target.value })}
              style={{ width: '100%' }}
            />
          </label>

          {/* Density options */}
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ marginBottom: 4, color: '#666' }}>Density</div>
            <select 
              value={tweaks.density}
              onChange={e => update({ density: e.target.value })}
              style={{ width: '100%', padding: 6 }}
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
              <option value="spacious">Spacious</option>
            </select>
          </label>

          {/* Dark mode toggle */}
          <label style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}>
            <input 
              type="checkbox" 
              checked={tweaks.dark}
              onChange={e => update({ dark: e.target.checked })}
            />
            <span>Dark mode</span>
          </label>

          <button onClick={reset} style={{
            width: '100%',
            padding: '8px 12px',
            background: '#f5f5f5',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
          }}>Reset</button>
        </div>
      ) : (
        <button 
          onClick={() => setOpen(true)}
          style={{
            background: '#1A1A1A',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: '10px 16px',
            fontSize: 12,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >⚙ Tweaks</button>
      )}
    </div>
  );
}
```

### Applying Tweaks

Use Tweaks inside the main component:

```jsx
function App() {
  const { tweaks } = useTweaks();

  return (
    <div style={{
      '--primary': tweaks.primaryColor,
      '--font-size': `${tweaks.fontSize}px`,
      background: tweaks.dark ? '#0A0A0A' : '#FAFAFA',
      color: tweaks.dark ? '#FAFAFA' : '#1A1A1A',
    }}>
      {/* Your content */}
      <TweaksPanel />
    </div>
  );
}
```

Use the variables in CSS:

```css
button.cta {
  background: var(--primary);
  color: white;
  font-size: var(--font-size);
}
```

## Typical Tweak options

What tweaks to add for different kinds of designs:

### Universal
- Primary color (color picker)
- Font size (slider 12-24px)
- Typeface (select: display font vs body font)
- Dark mode (toggle)

### Slide deck
- Theme (light/dark/brand)
- Background style (solid/gradient/image)
- Font contrast (more decorative vs more restrained)
- Information density (minimal/standard/dense)

### Product prototype
- Layout variant (layout A / B / C)
- Interaction speed (animation speed 0.5x-2x)
- Data volume (5 / 20 / 100 mock items)
- State (empty/loading/success/error)

### Animation
- Speed (0.5x-2x)
- Loop (once/loop/ping-pong)
- Easing (linear/easeOut/spring)

### Landing page
- Hero style (image/gradient/pattern/solid)
- CTA copy (a few variants)
- Structure (single column / two column / sidebar)

## Tweaks design principles

### 1. Meaningful options, not busywork

Every tweak must expose a **real design choice**. Do not add tweaks that nobody would actually toggle (for example, a border-radius slider from 0-50px - the user discovers all the in-between values are ugly).

A good tweak exposes **discrete, considered variations**:
- "Corner style": no rounding / subtle rounding / large rounding (three options)
- Not: "Corner radius": 0-50px slider

### 2. Less is more

A design's Tweaks panel should hold **at most 5-6 options**. Anything more turns it into a "settings page" and loses the point of fast variation exploration.

### 3. The defaults are the finished design

Tweaks are **icing on the cake**. The default values must, on their own, form a complete, ship-ready design. What the user sees with the Tweaks panel closed is the deliverable.

### 4. Group sensibly

When there are many options, group them visually:

```
---- Visual ----
Primary color | Font size | Dark mode

---- Layout ----
Density | Sidebar position

---- Content ----
Data volume | State
```

## Forward compatibility with source-level persistence hosts

If you later want to upload the design to an environment that supports source-level tweaks (such as Claude.ai Artifacts), keep the **EDITMODE marker block**:

```jsx
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "primaryColor": "#D97757",
  "fontSize": 16,
  "density": "comfortable",
  "dark": false
}/*EDITMODE-END*/;
```

The marker block has **no effect** under the localStorage approach (it is just an ordinary comment), but hosts that support source write-back will read it and produce source-level persistence. Adding it costs nothing in the current environment and preserves forward compatibility.

## Common questions

**The Tweaks panel covers the design content**
-> Make it closable. Closed by default - show a small button, expand only when the user clicks.

**The user has to reconfigure tweaks every time they switch**
-> localStorage is already in use. If state does not survive a refresh, check whether localStorage is available (private/incognito mode can fail - you need the catch block).

**I want to share tweaks across multiple HTML pages**
-> Add the project name to the localStorage key: `design-tweaks-[projectName]`.

**I want tweaks to react to one another**
-> Add the logic inside `update`:

```jsx
const update = (patch) => {
  let next = { ...tweaks, ...patch };
  // Linkage: when dark mode is enabled, switch the font color too
  if (patch.dark === true && !patch.textColor) {
    next.textColor = '#F0EEE6';
  }
  setTweaks(next);
  localStorage.setItem(...);
};
```
