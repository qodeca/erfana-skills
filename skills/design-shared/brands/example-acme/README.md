# example-acme – DO NOT USE IN PRODUCTION

This is a placeholder brand bundle whose only purpose is to demonstrate the schema for future maintainers. ACME Corp is a fictitious entity. Do not ship anything that references this brand.

## Why it exists

Adding a new brand is meant to be a folder copy. This example is the thing you copy. It exercises every optional field of `brand.schema.json` so you can see the contract end-to-end without reading the schema.

## Adding a real second brand

1. Copy this whole folder to `brands/<your-brand-id>/`.
2. Rename `logo/example-acme-primary.svg` to match your id, replace the artwork.
3. Edit `brand.json` – set `id` to match the new folder name (Gate 12 enforces equality).
4. Edit `tokens.tokens.json` – replace primitive colors with your brand's actual values; keep the semantic-role layer (`color.brand.primary` etc.) since consumers depend on those names.
5. Rewrite `voice.md` for your brand's actual tone.
6. Run `bash scripts/run-all-gates.sh`.

## Why the watermark is `Made by ACME Corp`

To prove the abstraction works. Gate 9 in this repo enforces `Created with erfana` as the canonical watermark literal – but that gate scans for `Created (by|with)` patterns. Using a different verb (`Made by`) demonstrates that a brand swap really does change the watermark output without colliding with the canonical-brand gate.

When you copy this folder for a real brand, choose the watermark phrasing that matches that brand's style guide.
