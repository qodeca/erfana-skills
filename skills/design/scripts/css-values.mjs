// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// What one CSS selector or declaration may say. A static check cannot prove that
// text is visible: these rules close the known routes, and a browser look stays
// part of the review. Node standard library only.

import { echo } from './shared.mjs'

// The values below are literal because a token can hold anything: `display:
// var(--off)` with --off set to none hides content while the page reads clean.
const LITERAL_ONLY = {
  display: /^(?:block|inline|inline-block|flex|inline-flex|grid|inline-grid|flow-root|list-item|contents|table|table-row|table-cell|table-caption|table-header-group|table-row-group|table-footer-group|table-column|table-column-group|inherit)$/i,
  visibility: /^visible$/i,
  'content-visibility': /^visible$/i,
  'pointer-events': /^auto$/i,
  interactivity: /^auto$/i,
  zoom: /^(?:normal|1)$/i,
  clip: /^auto$/i,
  'clip-path': /^none$/i,
  mask: /^none$/i,
  'mask-image': /^none$/i
}
const HIDING_NAMES = {
  display: 'display: none',
  visibility: 'visibility: hidden',
  'content-visibility': 'content-visibility: hidden',
  'pointer-events': 'pointer-events: none, which stops a comment from reaching the element',
  interactivity: 'interactivity: inert, which stops a comment from reaching the element'
}
// Faint is allowed, gone is not. Below this an element cannot be read.
const LOWEST_OPACITY = 0.1
const NUMBER = /^(?:\d+\.?\d*|\.\d+)$/
const ZERO_SIZE = /^-?(?:0+\.?0*|\.0+)(?:[a-z]+|%)?$/i
const SIZE_PROPERTIES = new Set(['height', 'max-height', 'width', 'max-width', 'block-size', 'max-block-size', 'inline-size', 'max-inline-size'])
const FONT_ZERO = /(?:^|\s)0*\.?0+(?:[a-z]+|%)?(?:\s|\/|$)/i
const SCALE_CALLS = /\bscale(?:x|y|z|3d)?\(([^)]*)\)/gi

// A state on one element that changes another element swaps content with no
// script. A state alone on its own element is an ordinary hover or focus style.
const STATE = /:(?:hover|active|focus|focus-visible|focus-within|checked|target|visited|default|indeterminate|enabled|disabled|invalid|valid|open|popover-open|modal|fullscreen)(?![\w-])/gi
const ALWAYS_BANNED = [
  [/:target(?![\w-])/i, ':target, which shows content only after a click'],
  [/:checked(?![\w-])/i, 'a :checked trick'],
  [/:(?:popover-open|modal|open|fullscreen)(?![\w-])/i, 'a selector for content that opens']
]
const MOUSE_STATE = /:(?:hover|active|read-only)(?![\w-])/i
const FRAME_GUARD = /:not\(:where\(\.design-frame \*/
const COMBINATOR = /[\s>+~]/

// Every CSS named colour, so a name cannot slip past as a plain word.
const COLOUR_NAMES = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood
cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki
darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet
deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow
grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow
lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime
limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen
mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue
saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle
tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(/\s+/))
const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\s*\(/i
const WORD = /(?<![\w-])[a-z]+(?![\w-]|\s*\()/gi
// Words here are names of the author's own, not colours.
const NAMING_PROPERTIES = /^(?:font|font-family|animation|animation-name|grid|grid-area|grid-template|grid-template-areas|container|container-name|counter-reset|counter-increment|transition|transition-property|will-change|list-style|list-style-type)$/
const RAW_SIZE = /(?<![\w.#-])-?(?:\d*\.)?\d+([a-z]+)\b/gi
const UNITLESS_MARKS = new Set(['fr', 'deg', 'rad', 'grad', 'turn', 'x', 'dppx', 'e'])
const NO_RAW_CHECK = new Set(['unicode-range', 'src', 'font-feature-settings'])

const stripUrls = value => value.replace(/url\([^)]*\)/gi, '')

const isLiteralNumber = value => NUMBER.test(value)

function scaleProblem(value) {
  for (const hit of value.matchAll(SCALE_CALLS)) {
    const numbers = hit[1].split(/[\s,]+/).filter(Boolean)
    if (numbers.length === 0 || numbers.some(n => !isLiteralNumber(n) || Number(n) === 0)) return `${echo(hit[0])} can scale to nothing: scale takes literal numbers above 0`
  }
  return null
}

function transformProblem(value) {
  if (/(?:^|\s)var\(/i.test(value)) return 'transform takes literal functions, never a bare var(), because a token can hold scale(0)'
  if (/\bmatrix(?:3d)?\(/i.test(value)) return 'matrix() can scale to nothing: use named functions'
  return scaleProblem(value)
}

function opacityProblem(value) {
  if (/var\(/i.test(value)) return 'opacity takes a literal number, never var(), because a token can hold 0'
  if (!isLiteralNumber(value)) return `opacity ${echo(value)} must be a plain number`
  return Number(value) < LOWEST_OPACITY ? `opacity: 0 is banned on review pages: ${value} is below ${LOWEST_OPACITY}, so the text cannot be read` : null
}

function scalePropertyProblem(value) {
  if (/^none$/i.test(value)) return null
  const numbers = value.split(/\s+/)
  return numbers.every(n => isLiteralNumber(n) && Number(n) > 0) ? null : 'scale takes literal numbers above 0, because a token can hold 0'
}

const SPECIAL = {
  opacity: opacityProblem,
  transform: transformProblem,
  scale: scalePropertyProblem,
  filter: value => (/opacity\(|^var\(/i.test(value) ? 'filter: opacity() can hide content' : null),
  'backdrop-filter': value => (/opacity\(|^var\(/i.test(value) ? 'backdrop-filter: opacity() can hide content' : null),
  'font-size': value => (ZERO_SIZE.test(value) ? 'font-size: 0 hides text' : null),
  font: value => (FONT_ZERO.test(value) ? 'a font size of 0 hides text' : null),
  color: value => (/^transparent$/i.test(value) ? 'color: transparent hides text' : null),
  '-webkit-text-fill-color': value => (/^transparent$/i.test(value) ? 'a transparent text fill hides text' : null),
  'z-index': value => (/^-/.test(value) ? 'a negative z-index can put content behind the page' : null)
}

/** What hides content in one declaration, as a message, or null. */
export function hidingProblem(rawProp, value) {
  const prop = rawProp.replace(/^-webkit-(?=mask|clip-path|filter|transform)/, '')
  if (prop.startsWith('--')) return null
  const literal = LITERAL_ONLY[prop]
  if (literal) {
    if (literal.test(value)) return null
    if (/var\(/i.test(value)) return `${prop} takes a literal value, never var(), because a token can hide content`
    return HIDING_NAMES[prop] ? `${HIDING_NAMES[prop]} is banned on review pages` : `${prop}: ${echo(value)} can hide content`
  }
  if (SPECIAL[prop]) return SPECIAL[prop](value)
  if (SIZE_PROPERTIES.has(prop) && ZERO_SIZE.test(value)) return `${prop}: 0 hides what the element holds`
  return null
}

/** The first raw colour or size in one declaration, as a message, or null. */
export function rawProblem(prop, value) {
  if (NO_RAW_CHECK.has(prop)) return null
  const clean = stripUrls(value).replace(/var\(\s*--[\w-]+/g, 'var(')
  const named = NAMING_PROPERTIES.test(prop) ? null : [...clean.matchAll(WORD)].find(hit => COLOUR_NAMES.has(hit[0].toLowerCase()))
  const size = [...clean.matchAll(RAW_SIZE)].find(hit => !UNITLESS_MARKS.has(hit[1].toLowerCase()))
  const raw = RAW_COLOUR.exec(clean)?.[0] ?? named?.[0] ?? size?.[0]
  return raw ? `raw value ${echo(raw.trim())} in ${echo(prop)} – use a token` : null
}

/** The parts of a selector inside brackets, one level down. */
function innerGroups(selector) {
  const groups = []
  let depth = 0
  let start = 0
  for (let i = 0; i < selector.length; i += 1) {
    if (selector[i] === '(' && (depth += 1) === 1) start = i + 1
    if (selector[i] === ')' && (depth -= 1) === 0) groups.push(selector.slice(start, i))
  }
  return groups
}

function splitList(selectors) {
  const list = []
  let depth = 0
  let start = 0
  for (let i = 0; i < selectors.length; i += 1) {
    if (selectors[i] === '(' || selectors[i] === '[') depth += 1
    else if (selectors[i] === ')' || selectors[i] === ']') depth -= 1
    else if (selectors[i] === ',' && depth === 0) {
      list.push(selectors.slice(start, i))
      start = i + 1
    }
  }
  list.push(selectors.slice(start))
  return list.map(s => s.trim()).filter(Boolean)
}

/** True when a state on one compound carries on to another element. */
function stateReachesAnother(selector) {
  const first = selector.search(STATE)
  let depth = 0
  for (let i = 0; first >= 0 && i < selector.length; i += 1) {
    const c = selector[i]
    if (c === '(' || c === '[') depth += 1
    else if (c === ')' || c === ']') depth -= 1
    else if (depth === 0 && i > first && COMBINATOR.test(c) && selector.slice(i).trim() !== '') return true
  }
  return innerGroups(selector).some(group => splitList(group).some(stateReachesAnother))
}

const hasStateInHas = selector => {
  for (const hit of selector.matchAll(/:has\(/gi)) {
    const group = innerGroups(selector.slice(hit.index))[0] ?? ''
    if (group.search(STATE) >= 0) return true
  }
  return false
}

/** What is wrong with a selector list, as [{ rule, message }]. */
export function selectorProblems(selectors, { frameRule = true } = {}) {
  const problems = []
  for (const selector of splitList(selectors)) {
    const banned = ALWAYS_BANNED.find(([re]) => re.test(selector))
    if (banned) {
      problems.push({ rule: 'no-hidden', message: `${banned[1]} is banned on review pages` })
    } else if (stateReachesAnother(selector) || hasStateInHas(selector)) {
      problems.push({ rule: 'no-hidden', message: `${echo(selector)}: a state that changes another element is a switch, so it is banned` })
    }
    if (frameRule && MOUSE_STATE.test(selector) && !FRAME_GUARD.test(selector)) {
      problems.push({ rule: 'frames', message: `${echo(selector)} reacts to the mouse inside a frame: add :not(:where(.design-frame *))` })
    }
  }
  return problems
}
