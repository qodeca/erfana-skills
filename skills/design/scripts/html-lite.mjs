// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// A small HTML reader for check-design.mjs: enough for its rules, with line
// numbers and ancestors. Node standard library only.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title'])

export const lineAt = (text, offset) => {
  let line = 1
  for (let i = 0; i < offset && i < text.length; i += 1) if (text.charCodeAt(i) === 10) line += 1
  return line
}

/** A small HTML reader: enough for rules, with line numbers and ancestors. */
export function parseHtml(text) {
  const nodes = []
  const comments = []
  const errors = []
  const stack = []
  let i = 0
  while (i < text.length) {
    const open = text.indexOf('<', i)
    if (open < 0) break
    if (text.startsWith('<!--', open)) {
      const end = text.indexOf('-->', open + 4)
      if (end < 0) {
        errors.push({ line: lineAt(text, open), message: 'unterminated comment' })
        break
      }
      comments.push({ raw: text.slice(open, end + 3), line: lineAt(text, open), end: end + 3 })
      i = end + 3
    } else if (text.startsWith('<!', open) || text.startsWith('<?', open)) {
      const end = text.indexOf('>', open)
      i = end < 0 ? text.length : end + 1
    } else if (text.startsWith('</', open)) {
      const end = text.indexOf('>', open)
      if (end < 0) break
      const tag = text.slice(open + 2, end).trim().toLowerCase()
      for (let s = stack.length - 1; s >= 0; s -= 1) {
        if (stack[s].tag === tag) {
          for (const n of stack.splice(s)) n.end = open
          break
        }
      }
      i = end + 1
    } else if (/[a-zA-Z]/.test(text[open + 1] ?? '')) {
      i = readTag(text, open, { nodes, errors, stack })
      if (i < 0) break
    } else {
      i = open + 1
    }
  }
  for (const n of stack) n.end = text.length
  return { nodes, comments, errors }
}

function readTag(text, open, { nodes, errors, stack }) {
  const nameMatch = /^[^\s/>]+/.exec(text.slice(open + 1, open + 80))
  const node = { tag: nameMatch[0].toLowerCase(), attrs: new Map(), line: lineAt(text, open), start: open, end: open, parent: stack[stack.length - 1] ?? null }
  let i = open + 1 + nameMatch[0].length
  for (;;) {
    while (/\s/.test(text[i] ?? '')) i += 1
    if (i >= text.length) {
      errors.push({ line: node.line, message: `unterminated <${node.tag}> tag` })
      return -1
    }
    if (text[i] === '>') { i += 1; break }
    if (text.startsWith('/>', i)) { i += 2; break }
    if (text[i] === '/') { i += 1; continue }
    const nameStart = i
    while (i < text.length && !/[\s=>/]/.test(text[i])) i += 1
    const name = text.slice(nameStart, i).toLowerCase()
    if (name === '') { i += 1; continue }
    while (/\s/.test(text[i] ?? '')) i += 1
    let value = ''
    if (text[i] === '=') {
      i += 1
      while (/\s/.test(text[i] ?? '')) i += 1
      const quote = text[i]
      if (quote === '"' || quote === "'") {
        const close = text.indexOf(quote, i + 1)
        if (close < 0) {
          errors.push({ line: node.line, message: `missing closing quote in <${node.tag} ${name}=` })
          return -1
        }
        value = text.slice(i + 1, close)
        i = close + 1
      } else {
        const start = i
        while (i < text.length && !/[\s>]/.test(text[i])) i += 1
        value = text.slice(start, i)
      }
    }
    if (/[<"']/.test(name)) errors.push({ line: node.line, message: `malformed attribute ${name.slice(0, 40)} – a quote is probably missing` })
    if (!node.attrs.has(name)) node.attrs.set(name, value)
  }
  nodes.push(node)
  if (RAW_TEXT.has(node.tag)) {
    const close = text.toLowerCase().indexOf(`</${node.tag}`, i)
    const end = close < 0 ? text.length : close
    node.text = text.slice(i, end)
    node.textLine = lineAt(text, i)
    node.end = end
    const gt = text.indexOf('>', end)
    return gt < 0 ? text.length : gt + 1
  }
  if (!VOID.has(node.tag)) stack.push(node)
  return i
}
