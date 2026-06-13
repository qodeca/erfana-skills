# erfana brand - Claude entry point

This is the **default house brand** for the erfana toolkit: a neutral, restrained
identity shipped so the design skills work out of the box. It is deliberately
minimal (logo only, no photo/shape/template libraries) and is meant to be
replaced with your own brand bundle.

## What ships

- **Manifest** - `brand.json` (matches `../brand.schema.json`, v1.3).
- **Tokens** - `tokens.tokens.json` (DTCG 2025.10), wrapped under the `erfana`
  group. Default token contract: `color.brand.{primary,accent,surface-dark,text-light}`
  + `typography.fontFamily.{primary,display,mono}`.
- **Logo** - one self-contained SVG lockup. Catalog: `logo/INDEX.md`.
- **Voice** - `voice.md` (confident, direct, matter-of-fact).

## Palette

| Role | Token | Hex |
|---|---|---|
| Primary | `erfana.color.indigo` | `#4338CA` |
| Accent | `erfana.color.cyan` | `#06B6D4` |
| Dark surface | `erfana.color.ink` | `#0B1020` |
| Light text/surface | `erfana.color.paper` | `#F5F7FA` |

Typography is Inter (body + display) and JetBrains Mono (code) - both open
fonts (SIL OFL).

## Watermark

Motion/video outputs use `Created with erfana` (sourced from `brand.json`
`voice.watermark`). Never hardcode a different watermark string in scripts.

## Rebranding

Copy this folder, rename it to your brand id (folder name must equal `id`),
replace the logo and tokens, and point `skills/design-shared/brands/ACTIVE_BRAND`
at your id. See `../README.md` for the full contract.
