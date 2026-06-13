#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
# SPDX-License-Identifier: GPL-3.0-only
# gate-12-brand-manifests.sh — validates brand manifests under skills/design-shared/brands/.
#
# Schema-driven: shape validation delegated to scripts/_lib/json_schema_lite.py
# (stdlib-only minimal JSON Schema 2020-12 validator). Cross-file invariants
# (id == folder, path traversal guard, alias resolution, tokensContract enforcement,
# production-brand allowlist, ACTIVE_BRAND pointer, CLAUDE.md presence, INDEX.md
# presence and bidirectional cross-checks) live in this script.
#
# Run independently:
#   bash scripts/gate-12-brand-manifests.sh
# Or as part of the full suite:
#   bash scripts/run-all-gates.sh
#
# Pass criteria:
#   1. ACTIVE_BRAND file exists, names a real brand folder, and that brand id is
#      on the PRODUCTION_BRANDS allowlist (production-readiness gate).
#   2. brand.schema.json parses and is loadable.
#   3. Each brands/<id>/brand.json (folders prefixed `_` are skipped as WIP;
#      example-acme is exempt from CLAUDE.md / INDEX.md checks as a documented
#      placeholder):
#      a. JSON parses and validates against brand.schema.json (catches typos,
#         missing required fields, additionalProperties violations, oneOf misses).
#      b. id equals parent folder basename.
#      c. Every relative path in the manifest resolves to a real file/directory
#         AND the resolved path stays inside the repository (path-traversal guard).
#      d. When `tokens` is set, the tokens file parses, every leaf token has
#         $value, every {alias.path} (in any string within any $value, including
#         composite gradient/typography/shadow values) resolves to a token (not
#         a group; DTCG forbids group aliases).
#      e. tokensContract entries (manifest field or default from brands/README.md)
#         each resolve to a token whose effective $type matches the declared type.
#      f. CLAUDE.md exists at brand root (prose Claude guidance per brand).
#      g. For each declared imagery.*Library directory plus the logo/ folder
#         (resolved from logos[].src), an INDEX.md exists at the library root.
#         Subfolders at any depth that contain their own INDEX.md are also
#         validated (catches templates/slides/INDEX.md without forcing a move;
#         dot-prefixed directories like .git are pruned during the walk).
#      h. Bidirectional cross-checks per library: every backtick-quoted file
#         path in INDEX.md resolves to a file in the library tree, and every
#         non-INDEX.md file in the library tree is mentioned by at least one
#         INDEX.md in the chain.
#      i. CLAUDE.md cites at least one INDEX.md per declared library (prevents
#         catalog drift between the brand's prose entry point and its assets).
set -euo pipefail

cd "$(dirname "$0")/.."

python3 <<'PYEOF'
import os, json, sys, glob, re, unicodedata

sys.path.insert(0, os.path.join(os.getcwd(), 'scripts', '_lib'))
from json_schema_lite import validate as schema_validate


def nfc(s):
    """Normalize Unicode to NFC. macOS / APFS sometimes returns NFD-encoded
    filenames from os.walk while Markdown source is NFC; normalising both sides
    avoids spurious 'file in folder but not cited' / 'cited but missing' errors
    on Polish diacritics like 'ń' (U+0144 vs 'n' + U+0303)."""
    return unicodedata.normalize('NFC', s)

ALIAS_RE = re.compile(r'\{([^}]+)\}')
BACKTICK_RE = re.compile(r'`([^`\n]+)`')
SCHEMA_PATH = 'skills/design-shared/brands/brand.schema.json'
BRANDS_DIR = 'skills/design-shared/brands'
ACTIVE_BRAND_FILE = os.path.join(BRANDS_DIR, 'ACTIVE_BRAND')
CLAUDE_MD = 'CLAUDE.md'
INDEX_MD = 'INDEX.md'

# File extensions that look like cite-able assets in INDEX.md backticks.
# Strings ending in any of these are treated as candidate file references
# during the bidirectional cross-check; everything else (hex colours like
# `#161312`, DTCG token paths like `voice.watermark`, Polish prose like
# `Aktywność`) is ignored.
INDEX_ASSET_EXTS = (
    '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp',
    '.mp4', '.webm', '.mov',
    '.json', '.md',
)

# Brands exempt from CLAUDE.md / INDEX.md checks. The example-acme brand is
# a documented placeholder showing the manifest pattern; requiring it to ship
# a fully-populated CLAUDE.md and per-library INDEX.md catalogs adds friction
# without value. It remains subject to schema validation, id-folder check, and
# path-traversal guards like every other brand.
BRAND_STRUCTURE_EXEMPT = {'example-acme'}

# Production-brand allowlist. To add a real second brand, append its id here in
# the same PR that introduces brands/<id>/. example-acme is intentionally absent
# so the placeholder cannot accidentally become the active brand.
PRODUCTION_BRANDS = ['erfana']

# Default token contract applied when a manifest does not declare `tokensContract`.
# Every brand's tokens MUST expose these paths (under its brand-id wrapping group)
# of the declared $type. Symmetry is the LSP guarantee that lets consumers swap
# brands at runtime without breaking.
DEFAULT_TOKENS_CONTRACT = {
    'color.brand.primary':         'color',
    'color.brand.accent':          'color',
    'color.brand.surface-dark':    'color',
    'color.brand.text-light':      'color',
    'typography.fontFamily.primary': 'fontFamily',
    'typography.fontFamily.display': 'fontFamily',
    'typography.fontFamily.mono':    'fontFamily',
}

errors = []


def err(msg):
    errors.append(msg)


repo_root = os.path.realpath(os.getcwd())


def safe_resolve(base_abs, rel_path):
    """Resolve rel_path relative to base_abs. Returns the absolute path if it
    stays inside the repo. Returns None for absolute paths or any traversal that
    escapes the repo. Error messages never echo the resolved path when it lies
    outside the repo (avoid CI-log info leak)."""
    if rel_path.startswith('/'):
        return None
    full = os.path.realpath(os.path.normpath(os.path.join(base_abs, rel_path)))
    if full == repo_root or full.startswith(repo_root + os.sep):
        return full
    return None


def find_alias_target(tokens_root, dotted_path):
    """Walk dotted path through tokens. Returns (node, kind) where kind is one
    of 'token' (leaf with $value), 'group' (no $value), or None (path missing
    or non-dict node hit)."""
    parts = dotted_path.split('.')
    cur = tokens_root
    for p in parts:
        if not isinstance(cur, dict) or p not in cur:
            return (None, None)
        cur = cur[p]
    if not isinstance(cur, dict):
        return (None, None)
    return (cur, 'token' if '$value' in cur else 'group')


def resolve_effective_type(tokens_root, dotted_path):
    """Walk dotted path; return the deepest declared $type encountered. DTCG
    inheritance: closest ancestor wins."""
    parts = dotted_path.split('.')
    cur = tokens_root
    inherited_type = None
    for p in parts:
        if not isinstance(cur, dict) or p not in cur:
            return None
        cur = cur[p]
        if isinstance(cur, dict) and '$type' in cur:
            inherited_type = cur['$type']
    return inherited_type


def walk_value_for_aliases(node, tokens_root, path_label, manifest_id):
    """Recursively descend into any $value structure (string, number, dict, list).
    For every string leaf, scan for {alias.path} references and verify each
    resolves to a token (not a group)."""
    if isinstance(node, str):
        for m in ALIAS_RE.finditer(node):
            target_path = m.group(1)
            _, kind = find_alias_target(tokens_root, target_path)
            if kind is None:
                err(f'{manifest_id}: token at "{path_label}" has unresolvable alias {{{target_path}}}')
            elif kind == 'group':
                err(f'{manifest_id}: token at "{path_label}" alias {{{target_path}}} resolves to a group; DTCG forbids aliasing groups')
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk_value_for_aliases(v, tokens_root, f'{path_label}[{i}]', manifest_id)
    elif isinstance(node, dict):
        for k, v in node.items():
            walk_value_for_aliases(v, tokens_root, f'{path_label}.{k}', manifest_id)


def walk_tokens_tree(node, tokens_root, path, manifest_id):
    """Recurse the tokens tree. Tokens (objects with $value) trigger alias-walk
    over their $value; groups (no $value) recurse into non-$-prefixed children."""
    if not isinstance(node, dict):
        return
    if '$value' in node:
        walk_value_for_aliases(node['$value'], tokens_root, f'{path}.$value', manifest_id)
        return
    for k, v in node.items():
        if k.startswith('$'):
            continue
        if isinstance(v, dict):
            walk_tokens_tree(v, tokens_root, f'{path}.{k}' if path else k, manifest_id)
        else:
            err(f'{manifest_id}: group "{path}" has non-object child "{k}" of type {type(v).__name__}')


# ── Brand-folder structural helpers (CLAUDE.md + INDEX.md) ─────────────────


def is_likely_asset_path(s):
    """A backtick cite in INDEX.md is treated as a file reference if it ends in a
    known asset extension. Everything else (hex colours, DTCG token paths,
    free-text Polish prose, code-style identifiers, glob patterns, prose
    fragments with whitespace) is filtered out so the cross-check only fires on
    real file references."""
    if not s or s.startswith('#') or s.startswith('$'):
        return False
    if '*' in s or '?' in s or '[' in s:
        # Glob patterns in prose like `*.svg` are not file cites.
        return False
    if any(c.isspace() for c in s):
        # Multi-word backticked phrases are prose, not file paths.
        return False
    s_lower = s.lower()
    return any(s_lower.endswith(ext) for ext in INDEX_ASSET_EXTS)


def collect_files_under(root_abs):
    """Walk root_abs recursively. Return (files, indexes) where files is a set
    of NFC-normalised POSIX-style paths relative to root_abs (excluding
    INDEX.md and dotfiles), and indexes is a list of (abs_index_path,
    rel_dir_posix) tuples for every INDEX.md found at any depth. NFC
    normalisation prevents NFD vs NFC mismatches on Polish diacritics; dotfile
    and dot-directory pruning prevents .git, .DS_Store-as-dir, or other hidden
    state from corrupting the cross-check. Symlinks are not followed
    (os.walk default), so a malicious symlink under a brand folder cannot
    expand the cross-check surface."""
    files = set()
    indexes = []
    if not os.path.isdir(root_abs):
        return files, indexes
    for dirpath, dirnames, filenames in os.walk(root_abs):
        # Prune hidden directories in-place so os.walk does not descend into
        # them on subsequent iterations.
        dirnames[:] = [d for d in dirnames if not d.startswith('.')]
        rel_dir = os.path.relpath(dirpath, root_abs)
        rel_dir_posix = '.' if rel_dir == '.' else nfc(rel_dir.replace(os.sep, '/'))
        for fn in filenames:
            if fn.startswith('.'):
                continue
            fn_nfc = nfc(fn)
            if fn_nfc == INDEX_MD:
                indexes.append((os.path.join(dirpath, fn), rel_dir_posix))
                continue
            rel = fn_nfc if rel_dir_posix == '.' else f'{rel_dir_posix}/{fn_nfc}'
            files.add(rel)
    return files, indexes


def parse_index_cites(index_abs):
    """Read INDEX.md and return the set of NFC-normalised backtick-quoted
    strings that look like asset paths. Returns an empty set on read failure
    (the caller has already confirmed the file exists)."""
    try:
        with open(index_abs) as f:
            content = f.read()
    except OSError:
        return set()
    cites = set()
    for m in BACKTICK_RE.finditer(content):
        s = nfc(m.group(1).strip())
        if is_likely_asset_path(s):
            cites.add(s)
    return cites


def normalize_cite(cite, index_rel_dir_posix):
    """Resolve a cite (relative to the INDEX.md's directory) into a path relative
    to the library root. The library root is the directory we are walking; the
    INDEX may sit at the root or one level deep."""
    if index_rel_dir_posix == '.':
        return cite
    joined = os.path.normpath(os.path.join(index_rel_dir_posix, cite))
    return joined.replace(os.sep, '/')


def derive_logo_dirs(manifest, base_abs):
    """Return the set of unique directories that hold logo files referenced by
    logos[].src. Each entry is an absolute path inside the brand folder."""
    dirs = set()
    for logo in manifest.get('logos', []):
        src = logo.get('src')
        if not src:
            continue
        full = safe_resolve(base_abs, src)
        if full:
            dirs.add(os.path.dirname(full))
    return dirs


def validate_brand_structure(folder, base_abs, manifest):
    """Per-brand CLAUDE.md + INDEX.md validation. Run after manifest schema and
    path checks pass. Skips example-acme (documented placeholder)."""
    if folder in BRAND_STRUCTURE_EXEMPT:
        return

    # 3f. CLAUDE.md presence at brand root
    claude_path = os.path.join(base_abs, CLAUDE_MD)
    if not os.path.isfile(claude_path):
        err(f'{folder}: missing required {CLAUDE_MD} at brand root')
        return  # downstream cross-checks would all fail; bail early

    try:
        with open(claude_path) as f:
            claude_content = f.read()
    except OSError as e:
        err(f'{folder}: cannot read {CLAUDE_MD}: {e}')
        return

    # 3g + 3h. Library roots: imagery.* directories + the logo/ folder(s)
    img = manifest.get('imagery', {})
    library_roots = []  # [(label, abs_path)]
    for key in (
        'photoLibrary', 'backgroundLibrary', 'shapeLibrary',
        'templateLibrary', 'logoLibrary',
    ):
        if key in img:
            full = safe_resolve(base_abs, img[key])
            if full and os.path.isdir(full):
                library_roots.append((f'imagery.{key}', full))

    # logo/ folder(s) derived from logos[].src — covers brands that have not
    # yet declared imagery.logoLibrary (schema v1.3) but still ship a logo
    # directory.
    seen_logo_dirs = {abs_path for _, abs_path in library_roots}
    for logo_dir in derive_logo_dirs(manifest, base_abs):
        if logo_dir not in seen_logo_dirs:
            library_roots.append(('logo (derived from logos[].src)', logo_dir))
            seen_logo_dirs.add(logo_dir)

    # 3g + 3h per library
    for label, root_abs in library_roots:
        files_in_tree, indexes_in_tree = collect_files_under(root_abs)

        # 3g. Root-level INDEX.md required
        root_has_index = any(rel_dir == '.' for _, rel_dir in indexes_in_tree)
        if not root_has_index:
            err(f'{folder}: {label} directory missing {INDEX_MD} at its root')
            continue

        # 3h. Cross-check both directions
        cited = set()  # files cited by any INDEX in this library
        library_index_rel_paths = []  # for CLAUDE.md cross-reference

        for index_abs, index_rel_dir in indexes_in_tree:
            # Path of this INDEX.md relative to the brand folder
            index_rel_to_brand = os.path.relpath(index_abs, base_abs).replace(
                os.sep, '/'
            )
            library_index_rel_paths.append(index_rel_to_brand)

            for cite in parse_index_cites(index_abs):
                normalized = normalize_cite(cite, index_rel_dir)
                # Route cite resolution through safe_resolve to keep the cite
                # check inside the repository. Cites with `..` segments that
                # would escape the library root resolve to None and emit a
                # sanitized error that does not echo the raw cite or the
                # resolved path (CWE-22 hardening, mirrors safe_resolve usage
                # for manifest paths). os.path.exists() is then bounded to
                # in-repo paths, so the gate cannot be turned into an
                # existence-disclosure oracle for arbitrary host filesystem
                # locations via a malicious INDEX.md.
                target_abs = safe_resolve(root_abs, normalized)
                if target_abs is None:
                    err(
                        f'{folder}: {index_rel_to_brand} contains a cite '
                        f'that escapes the repository or is absolute '
                        f'(input sanitized)'
                    )
                    continue
                if not os.path.exists(target_abs):
                    err(
                        f'{folder}: {index_rel_to_brand} cites '
                        f'{cite!r} but file does not exist (resolved to '
                        f'{normalized!r} within {label})'
                    )
                else:
                    cited.add(normalized)

        # Direction B: every non-INDEX file in tree must be cited
        uncited = files_in_tree - cited
        for uc in sorted(uncited):
            err(
                f'{folder}: {label} contains "{uc}" but no INDEX.md cites it '
                f'(add it to the catalog or remove it)'
            )

        # 3i. CLAUDE.md must cite at least one INDEX.md from this library
        if not any(idx in claude_content for idx in library_index_rel_paths):
            err(
                f'{folder}: {CLAUDE_MD} does not reference any INDEX.md in '
                f'{label} (looked for {sorted(library_index_rel_paths)})'
            )

        # 3j. Every RULES.md found in this library must also be cited from the
        # brand-root CLAUDE.md. The INDEX.md → RULES.md citation is already
        # enforced incidentally by Direction B above (every non-INDEX file in
        # the tree must be cited by some INDEX.md), so this check completes
        # the symmetry: RULES.md is discoverable from BOTH the per-library
        # catalogue AND the brand-root prose entry point. Mirrors the pattern
        # established for INDEX.md at 3i above.
        rules_in_tree = sorted(
            f for f in files_in_tree if os.path.basename(f) == 'RULES.md'
        )
        for rules_rel in rules_in_tree:
            # Path of this RULES.md relative to the brand folder
            rules_abs = os.path.join(root_abs, rules_rel)
            rules_rel_to_brand = os.path.relpath(
                rules_abs, base_abs
            ).replace(os.sep, '/')
            if rules_rel_to_brand not in claude_content:
                err(
                    f'{folder}: {CLAUDE_MD} does not reference '
                    f'{rules_rel_to_brand} (RULES.md present in {label} '
                    f'but the brand-root prose entry point does not link to it)'
                )


# ── Load schema ─────────────────────────────────────────────────────────────

try:
    with open(SCHEMA_PATH) as f:
        schema = json.load(f)
except (json.JSONDecodeError, OSError) as e:
    print(f'  FAIL: cannot load {SCHEMA_PATH}: {e}')
    sys.exit(1)


# ── ACTIVE_BRAND pointer + production allowlist ────────────────────────────

active_brand = None
if os.path.exists(ACTIVE_BRAND_FILE):
    try:
        active_brand = open(ACTIVE_BRAND_FILE).read().strip()
    except OSError as e:
        err(f'{ACTIVE_BRAND_FILE}: cannot read: {e}')
    if active_brand == '':
        err(f'{ACTIVE_BRAND_FILE}: empty (must contain a brand id)')
    elif active_brand and active_brand not in PRODUCTION_BRANDS:
        err(f'{ACTIVE_BRAND_FILE}: active brand "{active_brand}" is not on PRODUCTION_BRANDS allowlist {PRODUCTION_BRANDS}')
    elif active_brand:
        active_folder = os.path.join(BRANDS_DIR, active_brand)
        if not os.path.isdir(active_folder):
            err(f'{ACTIVE_BRAND_FILE}: active brand "{active_brand}" has no folder under {BRANDS_DIR}/')
else:
    err(f'{ACTIVE_BRAND_FILE}: missing (required pointer file)')


# ── Validate every manifest ────────────────────────────────────────────────

manifests = sorted(glob.glob(os.path.join(BRANDS_DIR, '*/brand.json')))
manifests = [p for p in manifests if not os.path.basename(os.path.dirname(p)).startswith('_')]


def validate_manifest(manifest_path):
    folder = os.path.basename(os.path.dirname(manifest_path))
    base = os.path.dirname(manifest_path)
    base_abs = os.path.realpath(base)

    try:
        with open(manifest_path) as f:
            manifest = json.load(f)
    except json.JSONDecodeError as e:
        err(f'{manifest_path}: JSON parse failed: {e}')
        return
    except OSError as e:
        err(f'{manifest_path}: cannot open: {e}')
        return

    # 1. Schema validation
    schema_errors = schema_validate(manifest, schema)
    for se in schema_errors:
        err(f'{manifest_path}: schema: {se}')

    # 2. id == folder
    if 'id' in manifest and manifest['id'] != folder:
        err(f'{manifest_path}: id="{manifest["id"]}" but folder is "{folder}"')

    brand_id = manifest.get('id', folder)

    # 3. Path resolution + traversal guard
    paths_to_check = []
    if 'tokens' in manifest:
        paths_to_check.append(('tokens', manifest['tokens']))
    for i, logo in enumerate(manifest.get('logos', [])):
        if 'src' in logo:
            paths_to_check.append((f'logos[{i}].src', logo['src']))
    voice = manifest.get('voice', {})
    if 'guide' in voice:
        paths_to_check.append(('voice.guide', voice['guide']))
    img = manifest.get('imagery', {})
    if 'photoLibrary' in img:
        paths_to_check.append(('imagery.photoLibrary', img['photoLibrary']))
    if 'illustrationStyle' in img:
        paths_to_check.append(('imagery.illustrationStyle', img['illustrationStyle']))
    if 'backgroundLibrary' in img:
        paths_to_check.append(('imagery.backgroundLibrary', img['backgroundLibrary']))
    if 'shapeLibrary' in img:
        paths_to_check.append(('imagery.shapeLibrary', img['shapeLibrary']))
    if 'templateLibrary' in img:
        paths_to_check.append(('imagery.templateLibrary', img['templateLibrary']))

    for label, p in paths_to_check:
        clean = p.split('#')[0]
        full = safe_resolve(base_abs, clean)
        if full is None:
            # Sanitize: do NOT echo the input path or any resolved path to
            # avoid leaking host filesystem layout via CI logs (CWE-22 hardening).
            err(f'{manifest_path}: {label} value escapes repository or is absolute (input sanitized)')
            continue
        if not os.path.exists(full):
            err(f'{manifest_path}: {label}="{p}" target does not exist')

    # 4. Tokens tree validation + tokensContract enforcement
    if 'tokens' in manifest:
        tokens_full = safe_resolve(base_abs, manifest['tokens'])
        if tokens_full and os.path.exists(tokens_full):
            try:
                with open(tokens_full) as f:
                    tokens = json.load(f)
            except json.JSONDecodeError as e:
                err(f'{tokens_full}: JSON parse failed: {e}')
                return

            # 4a. Walk tree; check $value composites and aliases.
            for k, v in tokens.items():
                if k.startswith('$'):
                    continue
                if isinstance(v, dict):
                    walk_tokens_tree(v, tokens, k, brand_id)

            # 4b. tokensContract enforcement.
            contract = manifest.get('tokensContract') or DEFAULT_TOKENS_CONTRACT
            for required_path, expected_type in contract.items():
                full_path = f'{brand_id}.{required_path}'
                _, kind = find_alias_target(tokens, full_path)
                if kind is None:
                    err(f'{brand_id}: tokensContract requires "{required_path}" but path "{full_path}" does not resolve in tokens')
                    continue
                if kind == 'group':
                    err(f'{brand_id}: tokensContract requires "{required_path}" as a token, but path "{full_path}" resolves to a group')
                    continue
                effective_type = resolve_effective_type(tokens, full_path)
                if effective_type != expected_type:
                    err(f'{brand_id}: tokensContract requires "{required_path}" of $type "{expected_type}" but token has effective $type "{effective_type}"')

    # 5. CLAUDE.md presence + INDEX.md presence + bidirectional cross-checks
    validate_brand_structure(folder, base_abs, manifest)


for mp in manifests:
    validate_manifest(mp)


# ── Report ─────────────────────────────────────────────────────────────────

if errors:
    print(f'  FAIL: {len(errors)} brand-manifest issue(s)')
    for e in errors:
        print(f'    {e}')
    sys.exit(1)

if not manifests:
    print('  WARN: no brand manifests found under skills/design-shared/brands/')
    if active_brand is None:
        print('  PASS: nothing to validate')
        sys.exit(0)

for mp in manifests:
    print(f'  PASS: {mp}')
print(f'  PASS: {len(manifests)} brand manifest(s) valid; ACTIVE_BRAND="{active_brand}" ok')
PYEOF
