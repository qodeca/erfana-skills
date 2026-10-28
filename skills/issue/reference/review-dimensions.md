# Review dimensions by agent

Detailed review dimensions for the Review operation. Referenced from [../operations/review.md](../operations/review.md).

---

## From code-reviewer agent

- Security review (secrets, injection, XSS)
- Performance patterns (re-renders, memory leaks)
- TypeScript types (no unjustified `any`)
- Test coverage verification

## From architecture-reviewer agent

- SOLID principle analysis (SRP, OCP, LSP, ISP, DIP)
- Coupling/cohesion evaluation
- Anti-pattern detection (God Object, Feature Envy, etc.)
- Layer boundary enforcement

## From security-auditor agent

- npm audit for vulnerabilities
- OWASP Top 10 verification
- Path traversal prevention
- IPC security (Electron-specific)

## From ux-reviewer agent (conditional – UI files in scope)

*Activated at Standard and Deep review levels when target files include UI code (.tsx, .css, .scss, components/, renderer/, pages/).*

- Heuristic evaluation (Nielsen's 10 + Shneiderman's 8)
- Accessibility compliance (WCAG 2.2 AA)
- Platform guideline compliance (Apple HIG, Material Design 3, Fluent 2)
- Design system adherence (beyond tokens)
- Edge case verification (empty, error, loading states)
- Interaction pattern review (feedback timing, state transitions)
- Internationalization readiness (Deep level only)

### UI file detection criteria

For the Review operation, "UI files detected in target" means any of:
- File extensions: `.tsx`, `.css`, `.scss`, `.html`
- Path patterns: `components/`, `renderer/`, `pages/`, `views/`, `layouts/`
- Content patterns: JSX/TSX elements, CSS rules, accessibility attributes
