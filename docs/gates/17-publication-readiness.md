# Gate 17 — publication readiness

**Type:** hard. **Script:** [`scripts/gate-17-publication-readiness.sh`](../../scripts/gate-17-publication-readiness.sh). **Added:** v6.0.0 (the open-source release).

## What it checks

The plugin shipped as a private, proprietary, Qodeca-internal tool before v6.0.0. This gate is the regression guard that keeps proprietary or internal-only framing from creeping back into the now-public (GPL-3.0-only) repository. Five hard checks:

1. **LICENSE is the GNU GPL** — the `LICENSE` file contains the GNU General Public License text and carries no proprietary "All rights reserved" notice.
2. **Manifests declare GPL-3.0-only** — `.claude-plugin/plugin.json` and `marketplace.json` do not declare a "Proprietary" license, and `plugin.json` declares `"license": "GPL-3.0-only"`.
3. **No internal contact address** — no `@qodeca.com` email appears in published files, with one allowed exception: the public `hi@qodeca.com` contact address in `CODE_OF_CONDUCT.md`. Every other `@qodeca.com` address still fails the gate. Security routing goes through GitHub private vulnerability reporting; see `SECURITY.md`.
4. **No proprietary / internal-only framing** — published files do not reintroduce phrases like "Qodeca-internal", "employees and contractors only", "For internal use by Qodeca", "private internal", or "internal-only license".
5. **Active brand is public** — `skills/design-shared/brands/ACTIVE_BRAND` does not point at the removed proprietary `qodeca` brand.

## Exemptions

Three files are exempt because they legitimately reference the old literals: `CHANGELOG.md` (release history), the gate script itself, and this document (both contain the forbidden strings as patterns / examples).

## Why

Going public is irreversible: once the repository is public, anything in it is forkable, cloneable, and cached. A stray "for Qodeca employees only" line or an internal email address would be a small but permanent leak of the project's pre-open-source posture and the maintainer's internal contact. Encoding the check as a gate means CI blocks any PR that reintroduces that framing.

## Known limitation

The text scans use `grep -nIHE`, where `-I` skips binary files. A proprietary string embedded in a binary asset (a PDF text layer, PNG metadata) would not be detected. This is acceptable under the current threat model — text source is the realistic leak vector, and the v6.0.0 release removed all proprietary binaries — but a future binary asset is a structural blind spot. Mitigation if needed: add a `git ls-files '*qodeca*'` filename check.

## Run standalone

```bash
bash scripts/gate-17-publication-readiness.sh
# expect: PASS: publication-readiness (license, contact, framing, active brand)
```

## Relationship to other gates

- **Gate 11** forbids the older legacy brand string `qodesign`; Gate 17 is the broader publication-posture check.
- **Gate 9** keeps the active brand's watermark literal consistent (now `Created with erfana`).
- **Gate 15** keeps prose counts in sync with the filesystem; Gate 17 keeps prose *framing* in sync with the open-source posture.
