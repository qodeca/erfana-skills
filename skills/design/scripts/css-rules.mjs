// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// The checker's rules for CSS text: what hides content, what runs, what leaves
// the folder, and what is a raw value. It reads one narrow form of CSS, and
// reports what a browser could read differently: no backslashes, no nesting, a
// short list of at-rules, and literal values on properties that can hide
// content. Node standard library only.

import path from 'node:path'
import { lineAt } from './html-lite.mjs'
import { hidingProblem, rawProblem, selectorProblems } from './css-values.mjs'
import { echo, isScriptUrl, urlProblem } from './shared.mjs'

const BLOCK_RULES = new Set(['media', 'container'])
const SHEET_PATH = /\.css$/
const URL_FUNCTION = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*?))\s*\)/gi
const URL_LIKE_FUNCTIONS = /(?:^|[^\w-])((?:-webkit-)?image-set|cross-fade|image|element|paint)\(/i
const IMPORT_PRELUDE = /^@import\s*(?:url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)|"([^"]*)"|'([^']*)')\s*$/i
const ACTIVE_PROPERTIES = new Set(['behavior', '-ms-behavior', '-moz-binding'])

const spaces = text => text.replace(/[^\n]/g, ' ')
const isBlank = text => text.trim() === ''

/**
 * Splits CSS into `code`, with comments blanked, and `bare`, with string contents
 * blanked too, at the same offsets. Strings and url() are skipped as units, so a
 * comment mark inside a string cannot hide a live rule.
 */
function lex(css, onError) {
  let code = ''
  let bare = ''
  let i = 0
  const copy = (end, blankBare = false) => {
    const piece = css.slice(i, end)
    code += piece
    bare += blankBare ? spaces(piece) : piece
    i = end
  }
  while (i < css.length) {
    if (css.startsWith('/*', i)) {
      const close = css.indexOf('*/', i + 2)
      if (close < 0) onError(i, 'an unclosed comment hides the rest of the sheet')
      const end = close < 0 ? css.length : close + 2
      const blank = spaces(css.slice(i, end))
      code += blank
      bare += blank
      i = end
    } else if (css[i] === '"' || css[i] === "'") {
      const close = css.indexOf(css[i], i + 1)
      const newline = css.indexOf('\n', i + 1)
      if (close < 0 || (newline >= 0 && newline < close)) onError(i, 'an unclosed string')
      const end = close < 0 ? css.length : close
      copy(i + 1)
      copy(end, true)
      if (close >= 0) copy(end + 1)
    } else if (/^url\(\s*[^\s"']/i.test(css.slice(i, i + 40))) {
      const close = css.indexOf(')', i)
      if (close < 0) onError(i, 'an unclosed url()')
      copy(close < 0 ? css.length : close + 1)
    } else {
      copy(i + 1)
    }
  }
  return { code, bare }
}

/** Where a piece of CSS stops: the first of `stops` outside brackets, or the end. */
function findStop(bare, from, stops) {
  let depth = 0
  for (let i = from; i < bare.length; i += 1) {
    const c = bare[i]
    if (c === '(' || c === '[') depth += 1
    else if (c === ')' || c === ']') depth = Math.max(0, depth - 1)
    else if (depth === 0 && stops.includes(c)) return i
  }
  return bare.length
}

const closeOf = (bare, open) => {
  let depth = 0
  for (let i = open; i < bare.length; i += 1) {
    if (bare[i] === '{') depth += 1
    else if (bare[i] === '}' && (depth -= 1) === 0) return i
  }
  return bare.length
}

class Sheet {
  constructor(css, options) {
    this.options = options
    this.problems = []
    this.used = []
    this.defined = []
    this.imports = []
    const lexErrors = []
    const { code, bare } = lex(css, (offset, message) => lexErrors.push({ offset, message }))
    this.code = code
    this.bare = bare
    for (const { offset, message } of lexErrors) this.add(offset, 'css', message)
  }

  add(offset, rule, message) {
    const line = this.options.baseLine + lineAt(this.bare, offset) - 1
    this.problems.push({ line, rule, message })
  }

  /** Style rules and at-rules from `from` to `to`. Returns nothing: it records. */
  readRules(from, to) {
    let i = from
    while (i < to) {
      const stop = findStop(this.bare, i, '{;}')
      const end = Math.min(stop, to)
      const prelude = this.bare.slice(i, end)
      const start = i + prelude.search(/\S|$/)
      if (end === to) {
        if (!isBlank(prelude)) this.add(start, 'css', 'an unclosed rule')
        return
      }
      if (this.bare[end] === '}') this.add(end, 'css', 'a stray }')
      if (prelude.trimStart().startsWith('@')) {
        i = this.readAtRule(start, end)
      } else if (this.bare[end] === '{') {
        const close = Math.min(closeOf(this.bare, end), to)
        if (close === to && this.bare[close] !== '}') this.add(end, 'css', 'an unclosed rule')
        for (const p of selectorProblems(prelude, this.options)) this.add(start, p.rule, p.message)
        this.readDeclarations(end + 1, close)
        i = close + 1
      } else {
        i = end + 1
      }
    }
  }

  readAtRule(start, end) {
    const prelude = this.bare.slice(start, end).trim()
    const name = /^@([a-zA-Z-]*)/.exec(prelude)[1].toLowerCase()
    const close = this.bare[end] === '{' ? closeOf(this.bare, end) : end
    if (name === 'import') this.readImport(start, end)
    else if (this.bare[end] !== '{') this.add(start, 'css', `the at-rule ${echo(`@${name}`)} is not allowed`)
    else if (BLOCK_RULES.has(name)) this.readRules(end + 1, close)
    else if (name === 'font-face') this.readDeclarations(end + 1, close)
    else if (name === 'keyframes') this.readKeyframes(end + 1, close)
    else this.add(start, 'css', `the at-rule ${echo(`@${name}`)} is not allowed: use @media, @container, @font-face, or @keyframes`)
    return close + 1
  }

  readImport(start, end) {
    if (this.options.inline) {
      this.add(start, 'links', '@import is banned in inline CSS, because its sheet is never read: link the sheet instead')
      return
    }
    const hit = IMPORT_PRELUDE.exec(this.code.slice(start, end).trim())
    if (!hit) {
      this.add(start, 'css', 'an @import is one local file, in quotes or in url(), with no media list')
      return
    }
    const href = hit.slice(1).find(part => part !== undefined) ?? ''
    if (isScriptUrl(href)) this.add(start, 'no-script', 'a script URL in @import is banned')
    const reason = urlProblem(href)
    if (reason) this.add(start, 'links', `@import ${echo(href)}: ${reason}`)
    else if (!SHEET_PATH.test(href)) this.add(start, 'links', `@import ${echo(href)} is not a .css file`)
    else this.imports.push({ href, line: this.options.baseLine + lineAt(this.bare, start) - 1 })
  }

  readKeyframes(from, to) {
    let i = from
    while (i < to) {
      const open = findStop(this.bare, i, '{')
      if (open >= to) return
      const close = closeOf(this.bare, open)
      this.readDeclarations(open + 1, Math.min(close, to))
      i = close + 1
    }
  }

  readDeclarations(from, to) {
    let i = from
    while (i < to) {
      const end = Math.min(findStop(this.bare, i, ';{}'), to)
      if (this.bare[end] === '{' && end < to) {
        this.add(end, 'css', 'nested rules are not allowed: write each selector in full')
        i = closeOf(this.bare, end) + 1
        continue
      }
      if (this.bare[end] === '}' && end < to) this.add(end, 'css', 'a stray }')
      this.readDeclaration(i, end)
      i = end + 1
    }
  }

  readDeclaration(from, to) {
    const text = this.bare.slice(from, to)
    const colon = text.indexOf(':')
    if (colon < 0) return
    const offset = from + text.search(/\S/)
    const prop = text.slice(0, colon).trim().toLowerCase()
    const value = text.slice(colon + 1).replace(/!\s*important\s*$/i, '').trim()
    const raw = this.code.slice(from + colon + 1, to)
    for (const hit of this.bare.slice(from, to).matchAll(/var\(\s*(--[\w-]+)/g)) this.used.push(hit[1])
    if (prop.startsWith('--')) this.defined.push(text.slice(0, colon).trim())
    this.checkUrls(raw, offset)
    if (ACTIVE_PROPERTIES.has(prop)) this.add(offset, 'no-script', `${prop} is banned`)
    if (/(?:^|[^\w-])expression\(/i.test(value)) this.add(offset, 'no-script', 'CSS expression() is banned')
    const hiding = hidingProblem(prop, value)
    if (hiding) this.add(offset, 'no-hidden', hiding)
    if (!this.options.allowRaw) {
      const message = rawProblem(prop, value)
      if (message) this.add(offset, 'no-raw-values', message)
    }
  }

  checkUrls(raw, offset) {
    for (const hit of raw.matchAll(URL_FUNCTION)) {
      const url = hit[1] ?? hit[2] ?? hit[3] ?? ''
      if (isScriptUrl(url)) {
        this.add(offset, 'no-script', 'a script URL in url() is banned')
        continue
      }
      const reason = urlProblem(url, { fragment: true })
      if (reason) this.add(offset, 'links', `url(${echo(url)}): ${reason}`)
    }
    const stringUrl = URL_LIKE_FUNCTIONS.exec(raw)
    if (stringUrl) this.add(offset, 'links', `${stringUrl[1]}() can name a file the checker never sees: use url()`)
  }
}

/**
 * Everything the checker needs from a CSS text: { problems, used, defined, imports }.
 * `inline` is a <style> block or a style attribute; `attribute` is the attribute,
 * which holds declarations only. `allowRaw` is for *tokens.css.
 */
export function cssFacts(css, { baseLine = 1, allowRaw = false, inline = false, attribute = false } = {}) {
  const sheet = new Sheet(css, { baseLine, allowRaw, inline: inline || attribute })
  if (css.includes('\\')) {
    const at = sheet.code.indexOf('\\')
    if (at >= 0) sheet.add(at, 'css', 'a backslash can spell any property or selector, so it is banned in CSS')
  }
  if (attribute) sheet.readDeclarations(0, sheet.bare.length)
  else sheet.readRules(0, sheet.bare.length)
  return { problems: sheet.problems, used: sheet.used, defined: sheet.defined, imports: sheet.imports }
}

export const cssProblems = (css, options) => cssFacts(css, options).problems

/** Unused tokens and missing state classes, as lines for --audit. */
export function auditSheets(sheets, pageUses) {
  const lines = []
  const everyUse = new Set(pageUses)
  for (const css of sheets.values()) for (const name of cssFacts(css).used) everyUse.add(name)
  for (const [file, css] of sheets) {
    if (path.basename(file) === 'tokens.css') {
      for (const name of new Set(cssFacts(css).defined)) if (!everyUse.has(name)) lines.push(`${file}: unused token ${name}`)
    }
    for (const hit of css.matchAll(/(\.[\w-]+):(hover|focus-visible|active)\b/g)) {
      const cls = hit[2] === 'focus-visible' ? 'is-focus' : `is-${hit[2]}`
      if (!css.includes(`${hit[1]}.${cls}`)) lines.push(`${file}: ${hit[1]}:${hit[2]} has no ${hit[1]}.${cls} rule, so the state cannot be drawn`)
    }
  }
  return [...new Set(lines)]
}
