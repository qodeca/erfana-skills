# Design System Compliance Checklist

Verification checklist for UI/CSS changes to ensure design token usage.

---

## Overview

Modern applications use design tokens (CSS custom properties) to maintain consistency. This checklist ensures all UI changes follow the project's design system.

**When to use this checklist:**
- Any change to `.css` files
- Any change to inline styles in React components
- Any change to styled-components or CSS-in-JS
- Any new UI component creation

---

## Token Categories

### Colors

| Token Pattern | Usage | Example |
|--------------|-------|---------|
| `--color-text-*` | Text colors | `color: var(--color-text-primary)` |
| `--color-bg-*` | Background colors | `background: var(--color-bg-secondary)` |
| `--color-border-*` | Border colors | `border-color: var(--color-border-default)` |
| `--color-accent-*` | Brand/accent colors | `color: var(--color-accent-primary)` |

**Violations to check:**
- [ ] No `#ffffff`, `#000000`, or other hex values
- [ ] No `rgb(...)` or `rgba(...)` values
- [ ] No `hsl(...)` or `hsla(...)` values
- [ ] No named colors (`red`, `blue`, `white`)

### Spacing

| Token Pattern | Values | Usage |
|--------------|--------|-------|
| `--space-1` | 2px | Minimal spacing |
| `--space-2` | 4px | Tight spacing |
| `--space-4` | 8px | Standard small |
| `--space-6` | 12px | Standard medium |
| `--space-8` | 16px | Standard large |
| `--space-12` | 24px | Section spacing |

**Violations to check:**
- [ ] No arbitrary `px` values (e.g., `padding: 10px`)
- [ ] No `em` or `rem` values for spacing
- [ ] No percentage values for padding/margin

### Typography

| Token Pattern | Usage | Example |
|--------------|-------|---------|
| `--text-xs` | 10px | Fine print |
| `--text-sm` | 11px | Small text |
| `--text-base` | 13px | Default body |
| `--text-md` | 14px | Emphasized |
| `--text-lg` | 16px | Headings |
| `--font-mono` | Monospace | Code blocks |

**Violations to check:**
- [ ] No `font-size: 14px` or similar
- [ ] No `font-size: 0.9em` or similar relative units
- [ ] No `font-family` declarations (use tokens)

### Borders

| Rule | Correct | Incorrect |
|------|---------|-----------|
| Border radius | `border-radius: 0` | `border-radius: 4px` |
| Exception | `border-radius: 50%` (circles only) | `border-radius: 8px` |

**Violations to check:**
- [ ] No rounded corners unless explicitly circles
- [ ] Border widths use tokens if available

### Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 0.1s | Quick feedback |
| `--transition-normal` | 0.15s | Standard |
| `--transition-slow` | 0.3s | Emphasis |

**Violations to check:**
- [ ] No `transition: 0.2s` or similar hardcoded values
- [ ] No `animation-duration` without tokens

### Z-Index

| Token | Usage |
|-------|-------|
| `--z-dropdown` | Dropdown menus |
| `--z-modal` | Modal dialogs |
| `--z-tooltip` | Tooltips |
| `--z-toast` | Toast notifications |

**Violations to check:**
- [ ] No `z-index: 9999` or arbitrary values
- [ ] No `z-index: 1` without token reference

---

## Quick Grep Commands

Find potential violations in the codebase:

```bash
# Find hardcoded colors
grep -r --include="*.css" --include="*.tsx" -E "#[0-9a-fA-F]{3,8}" src/

# Find hardcoded pixel values in padding/margin
grep -r --include="*.css" -E "(padding|margin):\s*[0-9]+px" src/

# Find hardcoded font sizes
grep -r --include="*.css" -E "font-size:\s*[0-9]+(px|em|rem)" src/

# Find hardcoded border-radius
grep -r --include="*.css" -E "border-radius:\s*[0-9]+px" src/

# Find hardcoded z-index
grep -r --include="*.css" -E "z-index:\s*[0-9]+" src/
```

---

## Accessibility Requirements

| Requirement | Check |
|-------------|-------|
| Focus visibility | [ ] `:focus-visible` states defined |
| Color contrast | [ ] Text meets WCAG AA (4.5:1 ratio) |
| Interactive elements | [ ] Hover, active, disabled states |
| Reduced motion | [ ] Respects `prefers-reduced-motion` |

---

## Review Process

1. **Identify CSS changes**
   ```bash
   git diff --name-only | grep -E "\.(css|tsx|ts)$"
   ```

2. **Run violation checks**
   - Use grep commands above
   - Manually review each flagged line

3. **Verify token availability**
   - Check if needed token exists in `design-tokens.css`
   - If token missing → Request token addition before using hardcoded value

4. **Test visual result**
   - Verify appearance matches design intent
   - Check dark/light mode if applicable
   - Verify responsive behavior

---

## Common Fixes

| Violation | Fix |
|-----------|-----|
| `color: #cccccc` | `color: var(--color-text-primary)` |
| `padding: 10px` | `padding: var(--space-4)` (8px) or `var(--space-6)` (12px) |
| `font-size: 14px` | `font-size: var(--text-md)` |
| `border-radius: 4px` | `border-radius: 0` |
| `z-index: 100` | `z-index: var(--z-dropdown)` |
