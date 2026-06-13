# erfana logo catalog

The default house brand ships a single, self-contained logo lockup. It is a
neutral geometric mark plus the `erfana` wordmark, drawn with plain SVG shapes
(no scripts, no external references) so it passes the brand-SVG safety gate and
renders during video export.

| File | Usage | Notes |
|---|---|---|
| `erfana-logo.svg` | light backgrounds, marketing, footer | Indigo mark + cyan accent + ink wordmark; 300x80 viewBox. |

Colours are drawn from `../tokens.tokens.json` (`erfana.color.indigo`,
`erfana.color.cyan`, `erfana.color.ink`, `erfana.color.paper`). To rebrand,
replace this file with your own mark and update the manifest's `logos[]` entry.
