// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// A small HTML reader for the design scripts: enough for their rules, with line
// numbers and ancestors. Node standard library only.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title'])
const FOREIGN = new Set(['svg', 'math'])

export const lineAt = (text, offset) => {
  let line = 1
  for (let i = 0; i < offset && i < text.length; i += 1) if (text.charCodeAt(i) === 10) line += 1
  return line
}

const classesOf = node => (node.attrs.get('class') ?? '').split(/\s+/).filter(Boolean)
export const hasClass = (node, name) => classesOf(node).includes(name)
export const inside = (node, test) => {
  for (let n = node.parent; n; n = n.parent) if (test(n)) return true
  return false
}
export const stripTags = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

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
      const s = stack.findLastIndex(n => n.tag === tag)
      if (s < 0) {
        errors.push({ rule: 'balance', line: lineAt(text, open), message: `stray </${tag}> with no open tag to close` })
      } else {
        abandon(stack, s + 1, open, errors)
        stack.pop().end = open
      }
      i = end + 1
    } else if (/[a-zA-Z]/.test(text[open + 1] ?? '')) {
      i = readTag(text, open, { nodes, errors, stack })
      if (i < 0) break
    } else {
      i = open + 1
    }
  }
  abandon(stack, 0, text.length, errors)
  return { nodes, comments, errors }
}

/** Ends every element from this depth up: none of them got a closing tag. */
function abandon(stack, depth, end, errors) {
  for (const n of stack.splice(depth)) {
    n.end = end
    errors.push({ rule: 'balance', line: n.line, message: `<${n.tag}> is never closed` })
  }
}

function readTag(text, open, { nodes, errors, stack }) {
  const nameMatch = /^[^\s/>]+/.exec(text.slice(open + 1, open + 80))
  const node = { tag: nameMatch[0].toLowerCase(), attrs: new Map(), line: lineAt(text, open), start: open, end: open, parent: stack[stack.length - 1] ?? null }
  let i = open + 1 + nameMatch[0].length
  let selfClosed = false
  for (;;) {
    while (/\s/.test(text[i] ?? '')) i += 1
    if (i >= text.length) {
      errors.push({ line: node.line, message: `unterminated <${node.tag}> tag` })
      return -1
    }
    if (text[i] === '>') { i += 1; break }
    if (text.startsWith('/>', i)) { i += 2; selfClosed = true; break }
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
    if (close < 0) errors.push({ rule: 'balance', line: node.line, message: `<${node.tag}> is never closed` })
    const end = close < 0 ? text.length : close
    node.text = text.slice(i, end)
    node.textLine = lineAt(text, i)
    node.end = end
    const gt = text.indexOf('>', end)
    return gt < 0 ? text.length : gt + 1
  }
  // "/>" closes an element only inside SVG or MathML; a browser ignores it on <div />.
  const foreign = FOREIGN.has(node.tag) || stack.some(n => FOREIGN.has(n.tag))
  if (!VOID.has(node.tag) && !(selfClosed && foreign)) stack.push(node)
  return i
}
