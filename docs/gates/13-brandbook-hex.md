# Gate 13 – brandbook hex coverage (soft)

Verifies every brandbook-defined hex code is present in the corresponding brand's tokens file. Catches transcription typos that schema validation (Gate 12) cannot see because schemas validate shape, not values. Currently soft (non-blocking) – wired in `run-all-gates.sh` with a trailing `|| echo` clause so a failure surfaces a `WARN` line without aborting CI. Promotion to a hard fail is tracked in `ROADMAP.md` v2.3.2 item #3b.

The expected inventory lives in `scripts/_lib/brandbook-hex-inventory.json` (single source of truth keyed by brand id and brandbook page reference). The verifier (`scripts/check-brandbook-hex.sh`) loads the inventory and greps each hex against the named tokens file. When a brandbook revision changes the palette, update the inventory file in the same PR as the tokens edit and the verifier picks it up automatically.

## Implementation

```bash
bash scripts/check-brandbook-hex.sh
```

## Pass criteria

`PASS: all <N> brandbook hex code(s) present in tokens`. The default `erfana` brand ships no brandbook, so the inventory is empty and the gate passes with `N = 0` (nothing to verify). The gate becomes load-bearing again the moment a brand declares brandbook-sourced hex codes in the inventory.

The gate exists because hex transcription is the kind of error code review almost never catches – a swatch rendering on screen looks plausible regardless of whether the source value is `#FF5F29` or `#FF3381`. The literal-grep approach is the simplest possible safety net and locks the values to the brandbook in a way no schema can.

## Adding a brand to Gate 13

1. Append a new top-level key to `scripts/_lib/brandbook-hex-inventory.json`: `"<brand-id>": { "tokens": "<relative path>", "brandbook": "<source PDF path>", "page-N-...": ["#XXXXXX", ...] }`. Group hex codes by brandbook page reference for human auditability.
2. Run `bash scripts/check-brandbook-hex.sh` to confirm every listed hex appears in the named tokens file.
3. No schema or skill changes; the verifier iterates whatever brands the inventory declares.
