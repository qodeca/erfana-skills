// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// Small rules the design scripts share, so each exists once: how a script knows
// it was run, what counts as the same text, a date, a safe echo of page text,
// the one check every URL goes through, and where a file sits in docs/. Node
// standard library only.

import { realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const INDEX_ROOTS = ['design-system', 'designs']
const ECHO_LIMIT = 40
// Letters, digits, and these marks mean the same as a path and as a URL. A ?, a %,
// a space, or a backslash can make a browser fetch a file the checker did not read.
const LOCAL_PATH = /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/
const FRAGMENT = /^[A-Za-z0-9._-]+$/
const WEB_LINK = /^https:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:[/?][A-Za-z0-9._~%/?+=,:@-]*)?(?:#[A-Za-z0-9._-]*)?$/
const NAMED_ENTITIES = { colon: ':', tab: '\t', newline: '\n', sol: '/', lpar: '(', rpar: ')', period: '.', num: '#', amp: '&' }
const MAX_CODE_POINT = 0x10FFFF
const REPLACEMENT = '�'

/**
 * True when this module is the script Node was asked to run. Both sides go
 * through the real path, because a link or a macOS /tmp makes them differ, and a
 * wrong false here means the script does nothing and exits 0.
 */
export function isMain(moduleUrl) {
  if (!process.argv[1]) return false
  try {
    return realpathSync.native(process.argv[1]) === realpathSync.native(fileURLToPath(moduleUrl))
  } catch {
    return false
  }
}

export const lf = text => text.replace(/\r\n/g, '\n')
/** Same text, whichever line endings a checkout gave it. */
export const sameText = (a, b) => lf(a) === lf(b)

export const localDate = (t = new Date()) => [t.getFullYear(), String(t.getMonth() + 1).padStart(2, '0'), String(t.getDate()).padStart(2, '0')].join('-')

/** Page text on a line of its own could pose as a checker result, so it never gets one. */
export const oneLine = text => String(text).replace(/[\p{Cc}\p{Zl}\p{Zp}]+/gu, ' ')

/** Page or file text for a message: on one line, quoted, and short. */
export function echo(value, limit = ECHO_LIMIT) {
  const text = oneLine(value)
  return JSON.stringify(text.length > limit ? `${text.slice(0, limit)}...` : text)
}

const fromCode = code => (code > MAX_CODE_POINT || code === 0 ? REPLACEMENT : String.fromCodePoint(code))

/** Decodes the entities that can spell a URL. An out-of-range number is U+FFFD, as in a browser. */
export const decodeEntities = value => value
  .replace(/&#x([0-9a-f]+);?/gi, (_, n) => fromCode(parseInt(n, 16)))
  .replace(/&#(\d+);?/g, (_, n) => fromCode(Number(n)))
  .replace(/&([a-z]+);/gi, (whole, name) => NAMED_ENTITIES[name.toLowerCase()] ?? whole)

// eslint-disable-next-line no-control-regex
export const isScriptUrl = value => /^(?:javascript|vbscript):/i.test(decodeEntities(value).replace(/[\u0000- ]+/g, ''))

/**
 * The one URL check, for every URL-bearing attribute and CSS url(). Returns what
 * is wrong, or null. `web` allows an https address; `fragment` allows a #name.
 */
export function urlProblem(value, { web = false, fragment = false } = {}) {
  if (web && WEB_LINK.test(value)) return null
  const hash = value.indexOf('#')
  const file = hash < 0 ? value : value.slice(0, hash)
  const name = hash < 0 ? null : value.slice(hash + 1)
  if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(value)) return 'it leaves this folder, and only a local file can be read and works offline'
  if (name !== null && (!fragment || !FRAGMENT.test(name))) return 'this address cannot carry that #fragment'
  if (file === '' && name !== null) return null
  if (!LOCAL_PATH.test(file)) return 'a local path uses only letters, digits, and . _ - /, and does not start with /'
  return null
}

const posix = file => path.resolve(file).split(path.sep).join('/')

/**
 * Where a file sits below the nearest design-system/ or designs/ folder: { name,
 * docs, parts }, or null. Only those folders count, and the nearest wins, so a
 * parent folder above the project cannot change what a page is.
 */
export function locate(file) {
  const parts = posix(file).split('/')
  const at = parts.findLastIndex(part => INDEX_ROOTS.includes(part))
  if (at < 0) return null
  return { name: parts[at], docs: parts.slice(0, at).join('/') || '/', parts: parts.slice(at + 1) }
}

/** Exactly docs/designs/<area>/prototypes/<file>, and nothing else. */
export function isPrototypePath(file) {
  const place = locate(file)
  return place?.name === 'designs' && place.parts.length === 3 && place.parts[1] === 'prototypes'
}
