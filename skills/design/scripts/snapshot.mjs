// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// The copy of docs/ a review round compares against. Node standard library only.

import { closeSync, constants, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const isLink = target => lstatSync(target, { throwIfNoEntry: false })?.isSymbolicLink() ?? false

/** The folder the copy goes in. A planted link here would send client comments elsewhere. */
function safeBase(project) {
  const local = path.join(project, '.local')
  const base = path.join(local, 'design-snapshots')
  const ignore = path.join(base, '.gitignore')
  if ([local, base, ignore].some(isLink)) return null
  mkdirSync(base, { recursive: true })
  if (!realpathSync(base).startsWith(realpathSync(project) + path.sep)) return null
  // Windows has no O_NOFOLLOW, so the check above is what holds there.
  const flags = constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | (constants.O_NOFOLLOW ?? 0)
  const handle = openSync(ignore, flags, 0o644)
  try {
    writeFileSync(handle, '*\n')
  } finally {
    closeSync(handle)
  }
  return base
}

// The copy holds client comments, so it stays in the project, in a folder git ignores.
// Returns null when the folder is not inside the project or holds a link, so the run stops and leaves no copy.
export function snapshot(folder, project = process.cwd()) {
  const source = path.resolve(project, folder)
  if (!existsSync(source)) return null
  if (!realpathSync(source).startsWith(realpathSync(project) + path.sep)) return null
  let base
  try {
    base = safeBase(project)
  } catch {
    return null
  }
  if (!base) return null
  const copy = mkdtempSync(path.join(base, 'baseline-'))
  try {
    copyFiles(source, copy)
  } catch {
    rmSync(copy, { recursive: true, force: true })
    return null
  }
  return copy
}

// A link would make the copy follow a live file or a folder outside docs, so a link stops the copy.
function copyFiles(from, to) {
  mkdirSync(to, { recursive: true })
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`link in docs: ${source}`)
    if (entry.isDirectory()) copyFiles(source, path.join(to, entry.name))
    else writeFileSync(path.join(to, entry.name), readFileSync(source))
  }
}

// Deletes only a copy that snapshot() made, never any other folder.
export function snapshotClean(copy, project = process.cwd()) {
  const base = path.join(project, '.local', 'design-snapshots')
  const target = path.resolve(project, copy)
  if (path.dirname(target) !== base || !path.basename(target).startsWith('baseline-') || !existsSync(target)) return false
  rmSync(target, { recursive: true, force: true })
  return true
}

// Runs --snapshot or --snapshot-clean. Returns the exit code, or null for any other command.
export function snapshotCommand(argv) {
  if (argv[0] === '--snapshot') {
    const copy = argv[1] ? snapshot(argv[1]) : null
    if (!copy) {
      console.error('usage: node check-design.mjs --snapshot <folder>, from the project root, with a folder inside the project that holds no links')
      return 2
    }
    console.log(copy)
    return 0
  }
  if (argv[0] === '--snapshot-clean') {
    if (argv[1] && snapshotClean(argv[1])) return 0
    console.error('usage: node check-design.mjs --snapshot-clean <copy under .local/design-snapshots>')
    return 2
  }
  return null
}
