// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// The checker's rules for CSS text: what hides content, what runs, and what is
// a raw value. Node standard library only.

import { lineAt } from './html-lite.mjs'

const blank = match => match.replace(/[^\n]/g, ' ')

const HIDING_CSS = [
  [/display\s*:\s*none/gi, 'display: none'],
  [/visibility\s*:\s*(?:hidden|collapse)/gi, 'visibility: hidden'],
  [/content-visibility\s*:\s*hidden/gi, 'content-visibility: hidden'],
  [/(?:^|[;{\s])opacity\s*:\s*0(?:\.0*)?\s*(?:[;}!]|$)/gim, 'opacity: 0'],
  [/pointer-events\s*:\s*none/gi, 'pointer-events: none, which stops a comment from reaching the element'],
  [/:target\b/gi, ':target, which shows content only after a click'],
  [/:checked\s*[+~]/gi, 'a :checked trick'],
  [/:has\([^)]*:checked/gi, 'a :checked trick']
]
const ACTIVE_CSS = [
  [/expression\s*\(/gi, 'CSS expression()'],
  [/-moz-binding\s*:/gi, '-moz-binding'],
  [/(?:^|[;{\s])behavior\s*:/gi, 'behavior:'],
  [/url\(\s*['"]?\s*(?:javascript|vbscript):/gi, 'a script URL in url()']
]
const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\s*\(|\b(?:white|black|red|green|blue|gray|grey|orange|yellow|purple|pink)\b/i
const RAW_SIZE = /(?<![\w.#-])-?(?:\d*\.)?\d+(?:px|rem|em|pt|vh|vw|vmin|vmax|ch|ms|s)\b/i

/** Rule problems in a CSS text, as [{ line, rule, message }]. */
export function cssProblems(css, { baseLine = 1, allowRaw = false } = {}) {
  const problems = []
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, blank)
  const add = (offset, rule, message) => problems.push({ line: baseLine + lineAt(clean, offset) - 1, rule, message })
  for (const [re, what] of HIDING_CSS) for (const hit of clean.matchAll(re)) add(hit.index, 'no-hidden', `${what} is banned on review pages`)
  for (const [re, what] of ACTIVE_CSS) for (const hit of clean.matchAll(re)) add(hit.index, 'no-script', `${what} is banned`)
  if (!allowRaw) {
    for (const hit of clean.matchAll(/([^{};]+):([^;{}]+)(?=[;}]|$)/g)) {
      const prop = hit[1].trim()
      if (prop.startsWith('@')) continue
      const value = hit[2].replace(/url\([^)]*\)/gi, '').replace(/var\(\s*--[\w-]+/g, 'var(')
      const raw = RAW_COLOUR.exec(value) ?? RAW_SIZE.exec(value)
      if (raw) add(hit.index, 'no-raw-values', `raw value "${raw[0].trim()}" in ${prop} – use a token`)
    }
  }
  return problems
}

export const varsUsed = css => [...css.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1])
export const varsDefined = css => [...css.replace(/\/\*[\s\S]*?\*\//g, blank).matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1])
