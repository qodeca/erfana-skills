// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// The one narrow form a review page may take: a fixed start of file, one head and
// one body, and an allowlist of elements and attributes for each context.
// Accepting one form closes whole families of bypass that a list of banned things
// never does. Node standard library only.

import { hasClass, inside, lineAt } from './html-lite.mjs'
import { echo, isScriptUrl, urlProblem } from './shared.mjs'

export const CSP = "default-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; child-src 'none'"
const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`
const CHARSET_META = '<meta charset="utf-8">'
const OPENING = /^<!doctype html>[\t\n\f\r ]*<html lang="[A-Za-z0-9-]+">[\t\n\f\r ]*<head>[\t\n\f\r ]*/
const HTML_SPACES = /^[\t\n\f\r ]*/
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTER = /[\u0000-\u0008\u000b\u000e-\u001f\u007f-\u009f]/
const words = list => new Set(list.split(/\s+/))

const STRUCTURE = words('html head body')
const HEAD_ELEMENTS = words('meta title link style')
const BODY_ELEMENTS = words(`a abbr address article aside b blockquote br button caption cite code col colgroup dd del dfn div dl dt em
  figcaption figure footer h1 h2 h3 h4 h5 h6 header hr i img input ins kbd label li main mark meter nav ol p pre progress q s samp section small
  span strong sub sup svg table tbody td textarea tfoot th thead time tr u ul var wbr`)
const SVG_ELEMENTS = words('svg g path circle ellipse line polygon polyline rect text tspan')

const META_NAMES = words('viewport description design-tasks design-sizes')
const GLOBAL_ATTRS = words('id class style lang dir role tabindex')
const ELEMENT_ATTRS = {
  a: words('href'),
  button: words('type disabled'),
  col: words('span'),
  colgroup: words('span'),
  img: words('src alt width height'),
  input: words('type value placeholder readonly disabled'),
  label: words('for'),
  link: words('rel href'),
  meta: words('name content charset http-equiv'),
  meter: words('value min max low high optimum'),
  ol: words('start reversed'),
  progress: words('value max'),
  td: words('colspan rowspan headers'),
  textarea: words('rows cols placeholder readonly disabled'),
  th: words('colspan rowspan headers scope'),
  time: words('datetime')
}
const SVG_ATTRS = words(`id class style role tabindex viewbox xmlns width height fill fill-rule clip-rule stroke stroke-width stroke-linecap
  stroke-linejoin stroke-dasharray stroke-dashoffset d cx cy r rx ry x y x1 y1 x2 y2 dx dy points preserveaspectratio focusable text-anchor`)
const TEXT_ATTRS = words('alt aria-label aria-description aria-roledescription aria-valuetext placeholder value')
const TEXT_METAS = words('description design-tasks')
const OPEN_ATTR = /^(?:aria|data)-[a-z0-9-]+$/

// Every attribute that can carry an address, so none skips the URL check. All but
// the first few are refused by the allowlist too: a second line of defence.
const URL_ATTRS = words('href src xlink:href srcset poster data action formaction background ping cite longdesc usemap manifest lowsrc to from values by')

const ACTIVE_ELEMENTS = words('script object embed applet frame frameset')
const NEVER_RENDERS = 'its content never renders'
const HIDING_ELEMENTS = {
  template: NEVER_RENDERS,
  noscript: NEVER_RENDERS,
  noembed: NEVER_RENDERS,
  noframes: NEVER_RENDERS,
  datalist: NEVER_RENDERS,
  xmp: 'a browser reads it as raw text',
  plaintext: 'a browser reads it as raw text',
  canvas: 'what it holds shows only as a fallback',
  audio: 'what it holds shows only as a fallback',
  video: 'what it holds shows only as a fallback',
  dialog: 'it stays closed and sits above pins',
  iframe: 'nothing inside a frame can take a comment',
  details: 'a click closes it: draw each state instead',
  summary: 'a click closes its <details>: draw each state instead'
}
const CONTROLS = words('button input textarea')
const PICTURE_ONLY = words('select details summary')
const INPUT_TYPES = words('text tel email search url password number date time')
const PAINT_ATTRS = words('fill stroke stop-color flood-color lighting-color')
const PAINT_OK = /^(?:none|currentColor|url\(\s*#[^)]*\)|var\(\s*--[\w-]+\s*(?:,[^)]*)?\))$/i

export const isFrame = node => hasClass(node, 'design-frame')
const isFixedFrame = node => /(?:^|\s)design-frame--/.test(node.attrs.get('class') ?? '')
const contextOf = node => {
  if (inside(node, p => p.tag === 'head')) return 'head'
  return node.tag === 'svg' || node.tag === 'math' || inside(node, p => p.tag === 'svg' || p.tag === 'math') ? 'svg' : 'body'
}
export const relOf = node => (node.attrs.get('rel') ?? '').toLowerCase().split(/[\t\n\f\r ]+/).filter(Boolean)

/** Only white space and comments may sit in this part of the page. */
function hasContent(text, comments, from, to) {
  let rest = text.slice(from, to)
  for (const c of comments) if (c.start >= from && c.end <= to) rest = rest.replace(c.raw, '')
  return rest.trim() !== ''
}

/** The fixed start of file: nothing can run or load before the policy. */
function checkStart(text, add) {
  const opening = OPENING.exec(text)
  if (!opening) {
    add(1, 'page', 'a page starts with exactly <!doctype html>, <html lang="...">, and <head>, with nothing before them')
    return
  }
  const afterHead = opening[0].length
  const line = lineAt(text, afterHead)
  if (!text.startsWith(CSP_META, afterHead)) {
    add(line, 'csp', `the first element in <head> must be this exact CSP meta: ${CSP}`)
    return
  }
  const afterPolicy = afterHead + CSP_META.length
  const next = afterPolicy + HTML_SPACES.exec(text.slice(afterPolicy))[0].length
  if (!text.startsWith(CHARSET_META, next)) add(line, 'page', `${CHARSET_META} is missing: it comes directly after the CSP meta`)
}

/** One html, one head, one body, in that order, with nothing around them. */
function checkShape(text, { nodes, comments }, add) {
  const count = tag => nodes.filter(n => n.tag === tag)
  const [html] = count('html')
  const [head] = count('head')
  const bodies = count('body')
  const body = bodies[0]
  for (const tag of ['html', 'head', 'body']) if (count(tag).length !== 1) add(1, 'page', `a page has exactly one <${tag}>, and this one has ${count(tag).length}`)
  if (!html || !head || !body) return
  if (head.parent !== html || body.parent !== html || nodes[0] !== html || nodes[1] !== head) {
    add(head.line, 'page', '<head> and <body> sit directly in <html>, with <head> first')
    return
  }
  if (hasContent(text, comments, head.close, body.start)) add(head.line, 'page', 'nothing but white space or a comment sits between </head> and <body>')
  if (hasContent(text, comments, body.close, html.end) || hasContent(text, comments, html.close, text.length)) add(body.line, 'page', 'nothing but white space or a comment sits after </body>')
  const inHead = nodes.filter(n => n.parent === head)
  let from = text.indexOf('>', head.start) + 1
  for (const node of inHead) {
    if (hasContent(text, comments, from, node.start)) add(node.line, 'page', 'text directly in <head> ends it early in a browser')
    from = node.close
  }
  if (hasContent(text, comments, from, head.end)) add(head.line, 'page', 'text directly in <head> ends it early in a browser')
}

function checkElement(node, context, add) {
  const { tag, line } = node
  if (ACTIVE_ELEMENTS.has(tag)) add(line, 'no-script', `<${tag}> is banned`)
  else if (HIDING_ELEMENTS[tag]) add(line, 'no-hidden', `<${tag}> is banned – ${HIDING_ELEMENTS[tag]}`)
  else if (tag === 'form') add(line, 'no-fake-controls', '<form> is banned – nothing can submit')
  else if (!STRUCTURE.has(tag)) {
    const allowed = { head: HEAD_ELEMENTS, body: BODY_ELEMENTS, svg: SVG_ELEMENTS }[context]
    if (!allowed.has(tag)) add(line, 'elements', `<${tag}> is not allowed in ${context === 'svg' ? '<svg>' : `<${context}>`}`)
  }
}

function checkMeta(node, add) {
  const { line, attrs } = node
  const equiv = (attrs.get('http-equiv') ?? '').toLowerCase()
  const isPolicy = equiv === 'content-security-policy'
  if (equiv === 'refresh') add(line, 'no-script', 'meta refresh is banned')
  else if (attrs.has('http-equiv') && !isPolicy) add(line, 'csp', `http-equiv ${echo(equiv)} is banned: only the CSP meta uses it`)
  if (!attrs.has('http-equiv') && !attrs.has('charset') && !META_NAMES.has(attrs.get('name') ?? '')) add(line, 'elements', `<meta name=${echo(attrs.get('name') ?? '')}> is not allowed`)
}

function checkLink(node, add) {
  const rel = relOf(node)
  if (rel.includes('modulepreload') || (node.attrs.get('as') ?? '').toLowerCase() === 'script') add(node.line, 'no-script', 'a script preload is banned')
  else if (rel.length !== 1 || rel[0] !== 'stylesheet') add(node.line, 'links', `<link rel=${echo(node.attrs.get('rel') ?? '')}> is not allowed: only rel="stylesheet" is`)
}

const allowsAttr = (node, name, context) => {
  if (context === 'svg') return SVG_ATTRS.has(name) || OPEN_ATTR.test(name)
  return GLOBAL_ATTRS.has(name) || OPEN_ATTR.test(name) || (ELEMENT_ATTRS[node.tag]?.has(name) ?? false)
}

const allowsEntity = (node, name) => TEXT_ATTRS.has(name) || (node.tag === 'meta' && name === 'content' && TEXT_METAS.has(node.attrs.get('name') ?? ''))

function checkAttribute(node, name, value, { context, inFrame, add }) {
  const { tag, line } = node
  if (/^on/.test(name)) return add(line, 'no-script', `event attribute ${echo(name)} is banned`)
  if (name === 'hidden') return add(line, 'no-hidden', 'the hidden attribute is banned')
  if (name === 'inert') return add(line, 'no-hidden', 'inert is banned – browsers skip it when Erfana picks a comment target; use aria-hidden on the frame')
  if (name === 'popover' || name === 'popovertarget') return add(line, 'no-hidden', `${name} is banned – draw the open state as its own state`)
  if (!allowsAttr(node, name, context)) add(line, 'attributes', `${echo(name)} is not allowed on <${tag}>`)
  if (value.includes('&') && !allowsEntity(node, name)) add(line, 'attributes', `${echo(name)} on <${tag}> holds an entity: write the plain character`)
  if (URL_ATTRS.has(name)) {
    if (isScriptUrl(value)) return add(line, 'no-script', `a script URL in ${echo(name)} is banned`)
    const web = tag === 'a' && name === 'href' && !inFrame
    const reason = urlProblem(value, { web, fragment: tag === 'a' })
    if (reason) add(line, 'links', `${name} ${echo(value)}: ${reason}`)
  }
  if (PAINT_ATTRS.has(name) && !PAINT_OK.test(value.trim())) add(line, 'no-raw-values', `${name}=${echo(value)} – paint with currentColor or a token`)
  return undefined
}

function checkInput(node, inFrame, add) {
  const type = (node.attrs.get('type') ?? 'text').toLowerCase()
  if (type === 'hidden') add(node.line, 'no-hidden', 'a hidden input is banned, because its value never shows')
  else if ((type === 'checkbox' || type === 'radio') && inFrame) add(node.line, 'no-fake-controls', `a ${type} in a frame changes when clicked: draw it with plain elements`)
  else if (!INPUT_TYPES.has(type)) add(node.line, 'attributes', `an input of type ${echo(type)} is not allowed`)
}

/** A frame is a picture: nothing in it may take a click, a key, or typing. */
function checkInFrame(node, add) {
  const { tag, line, attrs } = node
  if (tag === 'a' && attrs.has('href')) add(line, 'no-fake-controls', 'a link inside a frame works – remove href')
  if (PICTURE_ONLY.has(tag)) add(line, 'no-fake-controls', `<${tag}> in a frame reacts to a click: draw it with plain elements`)
  if (tag === 'label' && attrs.has('for')) add(line, 'no-fake-controls', 'a label with for in a frame moves focus when clicked')
  if ((tag === 'input' || tag === 'textarea') && !attrs.has('readonly') && !attrs.has('disabled')) add(line, 'no-fake-controls', `<${tag}> in a frame needs readonly or disabled, so nobody can type in the picture`)
  if (CONTROLS.has(tag) && attrs.get('tabindex') !== '-1') add(line, 'no-fake-controls', `<${tag}> in a frame needs tabindex="-1", because it is a picture of a control`)
  else if (attrs.has('tabindex') && attrs.get('tabindex') !== '-1') add(line, 'no-fake-controls', `tabindex in a frame is only ever "-1"`)
}

function checkNode(node, add) {
  const { tag, line, attrs } = node
  const context = contextOf(node)
  const inFrame = inside(node, isFrame)
  checkElement(node, context, add)
  if (tag === 'meta') checkMeta(node, add)
  if (tag === 'link') checkLink(node, add)
  if (tag === 'input') checkInput(node, inFrame, add)
  for (const [name, value] of attrs) checkAttribute(node, name, value, { context, inFrame, add })
  if (inFrame) checkInFrame(node, add)
  if (isFrame(node) && attrs.get('aria-hidden') !== 'true') add(line, 'states', 'a .design-frame is a picture: add aria-hidden="true"')
  if (isFixedFrame(node) && inside(node, p => hasClass(p, 'ds-frames'))) {
    add(line, 'frames', 'a fixed-width frame sits in a .design-state in .ds-states, outside the .ds-frames grid, whose columns are narrower than it')
  }
}

/** Everything wrong with the form of a page. `add` is (line, rule, message). */
export function checkForm(text, parsed, add) {
  const withoutComments = parsed.comments.reduce((rest, c) => rest.replace(c.raw, ''), text)
  const bad = CONTROL_CHARACTER.exec(withoutComments)
  if (bad) add(1, 'markup', 'a control character is banned: some encodings use one to change how a browser reads what follows')
  checkStart(text, add)
  checkShape(text, parsed, add)
  const metas = parsed.nodes.filter(n => n.tag === 'meta')
  if (metas.filter(n => n.attrs.has('charset')).length > 1) add(1, 'page', 'a page has one charset declaration: a browser may honour a different one')
  if (metas.filter(n => n.attrs.has('http-equiv')).length > 1) add(1, 'csp', 'a page has one CSP meta and no other http-equiv')
  for (const node of parsed.nodes) checkNode(node, add)
}
