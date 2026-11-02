// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// What the checker learns from git, and when a page last changed. Reads only.
// "Nothing to compare" must be proved, never assumed from a failure, because it
// turns comment protection off. Node standard library only.

import { execFileSync } from 'node:child_process'
import { statSync } from 'node:fs'
import path from 'node:path'
import { commentBlocks, parseHtml, stripBlocks } from './html-lite.mjs'
import { lf, localDate } from './shared.mjs'

// A page may be 25 MB, and git's output would overflow the 1 MB default.
const MAX_OUTPUT = 32 * 1024 * 1024
// A folder of pages can hold a planted bare repository: this stops git honouring
// it, and stops a repository's config starting a program through fsmonitor.
const SAFE_GIT = ['-c', 'safe.bareRepository=explicit', '-c', 'core.fsmonitor=false', '--literal-pathspecs']

const git = (cwd, args) => execFileSync('git', ['-C', cwd, ...SAFE_GIT, ...args], { encoding: 'utf8', maxBuffer: MAX_OUTPUT, stdio: ['ignore', 'pipe', 'ignore'] })

const memo = new Map()

/** The top folder of the repository holding `dir`, or null. Asked once per folder. */
export function repoTop(dir) {
  if (!memo.has(dir)) {
    let top = null
    try {
      top = git(dir, ['rev-parse', '--show-toplevel']).trim() || null
    } catch { /* not a repository: the caller falls back to the file time */ }
    memo.set(dir, top)
  }
  return memo.get(dir)
}

export function refExists(ref, dir) {
  try {
    git(dir, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])
    return true
  } catch {
    return false
  }
}

/**
 * A file's text at a ref, or null when the ref proves it is not there. Any other
 * failure throws: a page too big to read is not a new page.
 */
export function textAt(ref, file) {
  const dir = path.dirname(file)
  const name = path.basename(file)
  if (git(dir, ['ls-tree', '--name-only', ref, '--', name]).trim() === '') return null
  return git(dir, ['show', `${ref}:./${name}`])
}

const fileDate = file => localDate(statSync(file).mtime)
const blocksOf = text => commentBlocks(parseHtml(text).comments).map(b => b.raw).join('\n')

/**
 * The date of the last design change this page can prove, or null with a reason.
 * Commit dates are never used: a squash or a late commit moves them with no change
 * to the design. `reference` is the page's text in a baseline or at HEAD, or null.
 * A comment saved by Erfana is not a design change, but it does move the file time,
 * so where one was saved, the time says nothing about the design.
 */
export function designChange(file, text, reference) {
  const now = lf(text)
  if (reference === null) {
    return commentBlocks(parseHtml(now).comments).length > 0
      ? { date: null, reason: 'it holds comments and has no earlier copy to compare with' }
      : { date: fileDate(file) }
  }
  const old = lf(reference)
  if (stripBlocks(old) === stripBlocks(now)) return { date: null }
  if (blocksOf(old) !== blocksOf(now)) return { date: null, reason: 'a comment was saved since the earlier copy, so the file time may be the comment' }
  return { date: fileDate(file) }
}
