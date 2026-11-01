// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// A small HTML reader for the design scripts, with line numbers and ancestors.
// It reads one narrow form of HTML, and reports anything a browser could read
// differently instead of trying to copy the browser. Node standard library only.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title'])
const NO_MARKUP_INSIDE = new Set(['textarea', 'title'])
const FOREIGN = new Set(['svg', 'math'])
const SPACE = new Set(['\t', '\n', '\f', '\r', ' '])
const DOCTYPE = '<!doctype html>'
const TAG_NAME = /[a-zA-Z][a-zA-Z0-9-]*/y
const ATTRIBUTE_NAME = /[a-zA-Z_:][a-zA-Z0-9_:.-]*/y
const CLOSING_TAG = /<\/([a-zA-Z][a-zA-Z0-9-]*)[\t\n\f\r ]*>/y
const COMMENT_END = /--!?>/g
const COMMENT_BLOCK = /^<!--\s*erfana:comment(?=\s)/
const COMMENT_BLOCKS = /<!--\s*erfana:comment\s[\s\S]*?-->\s*/g

export const lineAt = (text, offset) => {
  let line = 1
  for (let i = 0; i < offset && i < text.length; i += 1) if (text.charCodeAt(i) === 10) line += 1
  return line
}

const classesOf = node => (node.attrs.get('class') ?? '').split(/[\t\n\f\r ]+/).filter(Boolean)
export const hasClass = (node, name) => classesOf(node).includes(name)
export const inside = (node, test) => {
  for (let n = node.parent; n; n = n.parent) if (test(n)) return true
  return false
}
/** Text only: comments go first, so a > in a comment cannot leave words behind. */
export const stripTags = html => html
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<\/?[a-zA-Z](?:"[^"]*"|[^>"])*>/g, ' ')
  .replace(/\s+/g, ' ').trim()

export const isCommentBlock = raw => COMMENT_BLOCK.test(raw)
/** A page without its comment blocks: what a person designed, not what a client said. */
export const stripBlocks = html => html.replace(COMMENT_BLOCKS, '')

/**
 * Open unless the block's own header says resolved. The header is what comes
 * before the first "comment by", because everything after it is typed by people.
 */
function isOpen(raw) {
  const header = raw.split(/^\s*comment by /m)[0]
  const status = /^\s*status:\s*(.*?)\s*$/m.exec(header)?.[1] ?? ''
  return !status.startsWith('resolved')
}

export function commentBlocks(comments, nodes = []) {
  return comments
    .filter(c => isCommentBlock(c.raw))
    .map(c => {
      const next = nodes.find(n => n.start >= c.end)
      return { raw: c.raw, line: c.line, open: isOpen(c.raw), before: next ? `${next.tag}#${next.attrs.get('id') ?? ''}` : '' }
    })
}

/** Reads a page. Returns { nodes, comments, errors }. */
export function parseHtml(text) {
  const state = { text, nodes: [], comments: [], errors: [], stack: [] }
  let i = 0
  while (i >= 0 && i < text.length) {
    const open = text.indexOf('<', i)
    if (open < 0) break
    if (text.startsWith('<!--', open)) i = readComment(state, open)
    else if (open === 0 && text.startsWith(DOCTYPE)) i = DOCTYPE.length
    else if (text.startsWith('<!', open) || text.startsWith('<?', open)) i = readBogus(state, open)
    else if (text.startsWith('</', open)) i = readClosing(state, open)
    else if (/[a-zA-Z]/.test(text[open + 1] ?? '')) i = readTag(state, open)
    else i = open + 1
  }
  abandon(state.stack, 0, text.length, state.errors)
  return { nodes: state.nodes, comments: state.comments, errors: state.errors }
}

const markup = (state, offset, message) => state.errors.push({ line: lineAt(state.text, offset), message })

/** The three comment forms a browser ends early are errors, so one page has one meaning. */
function readComment(state, open) {
  const { text } = state
  const from = open + 4
  if (text.startsWith('>', from) || text.startsWith('->', from)) {
    markup(state, open, 'a comment written <!--> or <!---> ends at once in a browser, so what follows is live')
    return text.indexOf('>', open) + 1
  }
  COMMENT_END.lastIndex = from
  const hit = COMMENT_END.exec(text)
  if (!hit) {
    markup(state, open, 'unterminated comment')
    return -1
  }
  if (hit[0] === '--!>') markup(state, hit.index, 'a comment ended with --!> is read differently by a browser')
  const end = hit.index + hit[0].length
  state.comments.push({ raw: text.slice(open, end), line: lineAt(text, open), start: open, end })
  return end
}

function readBogus(state, open) {
  const { text } = state
  markup(state, open, text.startsWith('<![CDATA[', open) ? 'CDATA is banned: a browser reads it differently inside and outside SVG' : `only <!doctype html>, at the very start, may use this form: ${text.startsWith('<?', open) ? '<?' : '<!'}`)
  const end = text.indexOf('>', open)
  return end < 0 ? -1 : end + 1
}

function readClosing(state, open) {
  const { text, stack, errors } = state
  CLOSING_TAG.lastIndex = open
  const hit = CLOSING_TAG.exec(text)
  if (!hit) {
    markup(state, open, 'a closing tag holds only its name')
    const end = text.indexOf('>', open)
    return end < 0 ? -1 : end + 1
  }
  const tag = hit[1].toLowerCase()
  const end = open + hit[0].length
  const s = stack.findLastIndex(n => n.tag === tag)
  if (s < 0) {
    errors.push({ rule: 'balance', line: lineAt(text, open), message: `stray </${tag}> with no open tag to close` })
  } else {
    abandon(stack, s + 1, open, errors)
    const node = stack.pop()
    node.end = open
    node.close = end
  }
  return end
}

/** Ends every element from this depth up: none of them got a closing tag. */
function abandon(stack, depth, end, errors) {
  for (const n of stack.splice(depth)) {
    n.end = end
    n.close = end
    errors.push({ rule: 'balance', line: n.line, message: `<${n.tag}> is never closed` })
  }
}

const skipSpace = (text, from) => {
  let i = from
  while (SPACE.has(text[i])) i += 1
  return i
}

const matchAt = (re, text, at) => {
  re.lastIndex = at
  return re.exec(text)?.[0] ?? null
}

/** One attribute: name, or name="value". Returns the next offset, or -1 after an error. */
function readAttribute(state, node, from) {
  const { text } = state
  const name = matchAt(ATTRIBUTE_NAME, text, from)
  if (name === null) {
    markup(state, from, `malformed attribute in <${node.tag}> – a quote is probably missing, or a character that is not HTML white space sits in the tag`)
    return -1
  }
  const key = name.toLowerCase()
  if (node.attrs.has(key)) markup(state, from, `${key} appears twice in <${node.tag}>`)
  let i = from + name.length
  const after = skipSpace(text, i)
  let value = ''
  if (text[after] === '=') {
    i = skipSpace(text, after + 1)
    if (text[i] !== '"') {
      markup(state, i, `the value of ${key} in <${node.tag}> needs double quotes`)
      return -1
    }
    const close = text.indexOf('"', i + 1)
    if (close < 0) {
      markup(state, i, `missing closing quote in <${node.tag} ${key}=`)
      return -1
    }
    value = text.slice(i + 1, close)
    i = close + 1
    if (!SPACE.has(text[i]) && text[i] !== '>' && !text.startsWith('/>', i)) {
      markup(state, i, `malformed attribute after ${key} in <${node.tag}> – a quote is probably missing`)
      return -1
    }
  }
  if (!node.attrs.has(key)) node.attrs.set(key, value)
  return i
}

/** Everything after the tag name, up to the end of the tag. */
function readAttributes(state, node, from) {
  const { text } = state
  let i = from
  for (;;) {
    i = skipSpace(text, i)
    if (i >= text.length) {
      markup(state, node.start, `unterminated <${node.tag}> tag`)
      return null
    }
    if (text[i] === '>') return { after: i + 1, selfClosed: false }
    if (text.startsWith('/>', i)) return { after: i + 2, selfClosed: true }
    i = readAttribute(state, node, i)
    if (i < 0) return null
  }
}

/** Text elements end at their own closing tag, searched for in the original text. */
function readRawText(state, node, after) {
  const { text, errors } = state
  const closing = new RegExp(`</${node.tag}(?=[\\t\\n\\f\\r />])`, 'gi')
  closing.lastIndex = after
  const close = closing.exec(text)?.index ?? -1
  if (close < 0) errors.push({ rule: 'balance', line: node.line, message: `<${node.tag}> is never closed` })
  const end = close < 0 ? text.length : close
  node.text = text.slice(after, end)
  node.textLine = lineAt(text, after)
  node.end = end
  node.close = end
  if (NO_MARKUP_INSIDE.has(node.tag) && node.text.includes('<')) markup(state, after, `<${node.tag}> holds plain text with no <`)
  if (close < 0) return text.length
  CLOSING_TAG.lastIndex = close
  const hit = CLOSING_TAG.exec(text)
  if (!hit) {
    markup(state, close, 'a closing tag holds only its name')
    return close + 2
  }
  node.close = close + hit[0].length
  return node.close
}

function readTag(state, open) {
  const { text, nodes, stack } = state
  const name = matchAt(TAG_NAME, text, open + 1)
  const start = open + 1 + name.length
  const node = { tag: name.toLowerCase(), attrs: new Map(), line: lineAt(text, open), start: open, end: open, close: open, parent: stack[stack.length - 1] ?? null }
  if (!SPACE.has(text[start]) && text[start] !== '>' && !text.startsWith('/>', start) && start < text.length) {
    markup(state, open, `malformed tag name <${name}${text[start]}`)
    return -1
  }
  const tag = readAttributes(state, node, start)
  if (!tag) return -1
  nodes.push(node)
  node.close = tag.after
  // Inside SVG or MathML, title and style hold markup, and "/>" closes an element;
  // a browser ignores "/>" on <div />.
  const foreign = FOREIGN.has(node.tag) || stack.some(n => FOREIGN.has(n.tag))
  if (RAW_TEXT.has(node.tag) && !foreign) return readRawText(state, node, tag.after)
  if (!VOID.has(node.tag) && !(tag.selfClosed && foreign)) stack.push(node)
  return tag.after
}
