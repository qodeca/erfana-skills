# The registry

`specs/registry.json` in the user's project is the index of every spec. A spec's ID is the key that binds it to its ADRs, solution docs, designs, test designs, and issues, so an ID is assigned once and never changes or returns. The schema is [../templates/registry-schema.json](../templates/registry-schema.json) (version `3.0.0`).

## Where it lives

The registry and every spec live under the project's `specs/` folder, resolved from the working directory – never from the skill's own folder, and never from a path found inside a spec, a document, or a web page. An early version of this skill wrote the registry into the skill folder; specs then disappeared from the project.

## IDs

- Folder name: `spec-t{tier}-{id:03d}-{slug}`, e.g. `spec-t3-002-payment`. The slug is lowercase letters, digits, and hyphens only (`^[a-z0-9-]+$`), never `.`, `..`, or `registry`.
- IDs are global across tiers, 3-digit zero-padded, and taken from `sequence.next`. The sequence only goes up; gaps from deleted or failed specs are normal.
- Requirement IDs inside a spec are `{spec_id:03d}-{TYPE}-{seq:03d}` – `001-FR-004`, `001-NFR-002`, `001-AC-007`, `001-UC-001`. A removed requirement's ID is not reused either.

## Starting a registry

A project's first spec has no registry to write into. When `specs/registry.json` does not exist and no `manifest.json` exists anywhere under `specs/`, create `specs/registry.json` from the schema with `sequence: {"current": 0, "next": 1}`, an empty `registry` array, and `metadata` holding `schema_version: "3.0.0"`, `version: 0`, and `created` and `last_updated` set to now. Tell the user the file was created. If manifests exist but the registry does not, the registry was lost: rebuild it as "Rebuilding" says instead, because starting at 1 would reuse IDs.

## Creating an entry safely

A new spec is a small transaction, so a failure never leaves a half-made spec that looks real:

1. **Reserve:** add an entry with `status: "reserved"` and the next ID, and bump `sequence`.
2. **Create** the spec folder and files.
3. **Confirm:** set the entry to `active` once the files exist.
4. **On failure** between 1 and 3, set the entry to `failed`. It stays as a tombstone so the ID is never reused; reconcile may later remove the empty folder.

Never leave an entry `reserved`. Write the registry one change at a time – there is no lock, so two writers at once can lose an entry. Increment `metadata.version` on every write; it is an audit counter, not a lock.

## Statuses

`draft`, `active`, `reserved`, `failed`, `deprecated`, `archived`. Only `active` specs are edited or reconciled. Archived and deprecated specs are read-only history.

## Archive

Archiving means "built and done – keep for reference". It is one way. The skill has no shell, so the user runs the move: show `mkdir -p specs/archived && mv "specs/<folder>" "specs/archived/<folder>"`, ask the user to run it from the project root (in Claude Code they can prefix it with `!`) and to say when it is done, and check that the folder is now under `specs/archived/`. Then set the entry's `status` to `archived` and its `path` to `archived/<folder>`, and stamp `archived` in the manifest. If either half of that already happened in an earlier run, finish the other half instead of failing. Stop and report if the target folder already exists in `archived/`.

## Linked documents

Each entry's `documents` object lists related files by kind: `technical_adrs`, `solution_adrs`, `solution_specs`, `designs`, `ux`, `e2e_test_designs`, `issues`. Linking is idempotent – a path already listed is not added again – and every linked path must exist and stay inside the project. Use `solution_specs`, not the legacy `solution_docs`.

## Older registries

A registry with `metadata.schema_version` below `3.0.0`, or none, is migrated on first touch: write `registry.json.backup` first (stop if one already exists – an earlier migration may be unfinished), set `schema_version` to `3.0.0`, add `metadata.version: 0`, map `solution_docs` into `solution_specs`, and keep every entry, ID, and the sequence unchanged. Then check that every entry's `path` exists, and report any that do not.

## Rebuilding

If the registry is lost, rebuild it from the manifests under `specs/` (including `specs/archived/`), set `sequence.next` above the highest ID found, and show the user what was rebuilt before writing.
