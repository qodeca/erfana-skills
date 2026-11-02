// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// Where a page keeps its status and date. A screen page has one rectangle
// (.design-tile) inside each .design-state, directly above its frame. A doc or
// index page has one p.ds-meta line. check-design.mjs and build-index.mjs both
// read a page through this file, so they cannot disagree. Node standard library
// only.

import { hasClass, inside, parseHtml, stripTags } from './html-lite.mjs'

export const TILE_LINE = 'Design, not a working product'
export const STATUS_TEXT = { draft: 'Draft', 'in-review': 'In review', ready: 'Ready for development' }
export const STATUS_ORDER = ['draft', 'in-review', 'ready']
const DATE = /^\d{4}-\d{2}-\d{2}$/
const TOKEN_NAME = /--[a-z][a-z\d-]*\*?/gi
// A ; that ends an HTML entity, as in &amp;, does not end a task.
const TASK_END = /(?<!&#?\w+);/

/** A real calendar date in YYYY-MM-DD: 2026-02-30 does not survive the round trip. */
export function isDate(value) {
  if (!DATE.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
}
export const statesOf = nodes => nodes.filter(n => hasClass(n, 'design-state'))
export const pageKind = nodes => nodes.find(n => n.tag === 'body')?.attrs.get('data-design-page') ?? ''

/** The .design-tile a state owns. */
export const tileOf = (nodes, state) => nodes.find(n => hasClass(n, 'design-tile') && inside(n, p => p === state))

/** The doc or index status line, which is a p.ds-meta carrying the status. */
export const metaOf = nodes => nodes.find(n => n.tag === 'p' && hasClass(n, 'ds-meta'))

/** The elements that carry a status on this page. */
export function carriers(nodes, kind) {
  if (kind === 'screen') return statesOf(nodes).map(state => tileOf(nodes, state)).filter(Boolean)
  const meta = metaOf(nodes)
  return meta ? [meta] : []
}

/** What is wrong with one status element, as messages. rule is 'tile' or 'meta'. */
export function statusProblems(text, node, rule) {
  const problems = []
  const add = (ruleName, message) => problems.push({ rule: ruleName, line: node.line, message })
  const status = node.attrs.get('data-design-status') ?? ''
  const updated = node.attrs.get('data-updated') ?? ''
  const words = stripTags(text.slice(node.start, node.end))
  const name = rule === 'tile' ? 'the rectangle' : 'the status line'
  if (!STATUS_TEXT[status]) add(rule, `data-design-status must be ${Object.keys(STATUS_TEXT).join(', ')}`)
  else if (!words.includes(STATUS_TEXT[status])) add(rule, `${name} must say "${STATUS_TEXT[status]}"`)
  if (!words.includes(TILE_LINE)) add(rule, `${name} must say "${TILE_LINE}"`)
  if (!isDate(updated) || !words.includes(updated)) add(rule, `data-updated must be YYYY-MM-DD and shown in ${name}`)
  if (status === 'ready' && !node.attrs.get('data-approved-by')) add('status', 'ready needs data-approved-by, the person who approved it')
  return problems
}

/** The newest valid date among a page's status elements, or ''. */
export function newestDate(list) {
  return list.map(n => n.attrs.get('data-updated') ?? '').filter(isDate).sort().at(-1) ?? ''
}

/** The token names in the first column of a page's #tokens table. */
function tokensOf(text, nodes) {
  const heading = nodes.find(n => n.attrs.get('id') === 'tokens')
  const table = heading && nodes.find(n => n.tag === 'table' && hasClass(n, 'ds-tokens') && n.start > heading.start)
  if (!table) return []
  const rows = nodes.filter(n => n.tag === 'tr' && inside(n, p => p === table) && inside(n, p => p.tag === 'tbody'))
  const cells = rows.map(row => nodes.find(n => n.tag === 'td' && n.parent === row)).filter(Boolean)
  return [...new Set(cells.flatMap(cell => stripTags(text.slice(cell.start, cell.end)).match(TOKEN_NAME) ?? []))]
}

/** What a page says it answers: its <meta name="design-tasks">, split on ;. */
function tasksOf(nodes) {
  const content = nodes.find(n => n.tag === 'meta' && n.attrs.get('name') === 'design-tasks')?.attrs.get('content') ?? ''
  return content.split(TASK_END).map(task => task.trim()).filter(Boolean)
}

/**
 * What an index shows for a page: its h1, its description, its least-finished
 * status, its newest date, its tasks, and its tokens. `problems` names anything
 * an index cannot show.
 */
export function pageFacts(text) {
  const { nodes } = parseHtml(text)
  const kind = pageKind(nodes)
  const h1 = nodes.find(n => n.tag === 'h1' && !inside(n, p => hasClass(p, 'design-frame')))
  const title = h1 ? stripTags(text.slice(h1.start, h1.end)) : ''
  const summary = (nodes.find(n => n.tag === 'meta' && n.attrs.get('name') === 'description')?.attrs.get('content') ?? '').trim()
  const list = carriers(nodes, kind)
  const statuses = list.map(n => n.attrs.get('data-design-status') ?? '')
  const status = STATUS_ORDER.find(s => statuses.includes(s)) ?? ''
  const updated = newestDate(list)
  const problems = []
  if (!title) problems.push('it has no <h1>')
  if (!summary) problems.push('it has no <meta name="description">')
  if (!status || !updated) problems.push('it has no readable status and date')
  return { kind, title, summary, status, updated, tasks: tasksOf(nodes), tokens: tokensOf(text, nodes), problems }
}

const outsideStates = (text, states) => {
  let out = ''
  let at = 0
  for (const s of [...states].sort((a, b) => a.start - b.start)) {
    if (s.start < at) continue
    out += text.slice(at, s.start)
    at = s.end
  }
  return (out + text.slice(at)).replace(/\s+/g, ' ')
}

/** A page-level status in an older page: a tile outside any state, or a ds-meta. */
const pageCarrier = (nodes, kind) => {
  const tile = nodes.find(n => hasClass(n, 'design-tile') && !inside(n, p => hasClass(p, 'design-state')))
  return tile ?? (kind === 'screen' ? undefined : metaOf(nodes))
}

/** Compares a page with its baseline. Returns { problems, notices, changedStates }. */
export function compareStatus(oldText, oldNodes, text, nodes) {
  const problems = []
  const notices = []
  const changedStates = []
  const kind = pageKind(nodes)
  const oldPage = pageCarrier(oldNodes, pageKind(oldNodes))
  const oldPageStatus = oldPage?.attrs.get('data-design-status')

  if (kind !== 'screen') {
    const status = metaOf(nodes)?.attrs.get('data-design-status')
    if (oldPageStatus === 'ready' && status === 'ready' && oldText !== text) problems.push({ line: 1, message: 'a ready page changed – set it back to in-review' })
    if (oldPage && oldPageStatus !== 'ready' && status === 'ready') notices.push('ready newly set – confirm the user asked for it')
    return { problems, notices, changedStates }
  }

  const oldStates = new Map()
  for (const state of statesOf(oldNodes)) {
    const oldTile = tileOf(oldNodes, state)
    oldStates.set(state.attrs.get('id') ?? '', { raw: oldText.slice(state.start, state.end), status: oldTile?.attrs.get('data-design-status'), date: oldTile?.attrs.get('data-updated') })
  }
  const newStates = statesOf(nodes)
  const aroundChanged = outsideStates(oldText, statesOf(oldNodes)) !== outsideStates(text, newStates)
  for (const state of newStates) {
    const id = state.attrs.get('id') ?? ''
    const old = oldStates.get(id)
    const raw = text.slice(state.start, state.end)
    const tile = tileOf(nodes, state)
    if (old && old.raw !== raw) changedStates.push({ id, raw, oldRaw: old.raw, oldDate: old.date, tile })
    if (tile?.attrs.get('data-design-status') !== 'ready') continue
    if (oldPageStatus === 'ready') {
      if (oldText !== text) problems.push({ line: tile.line, message: `state #${id}: a ready page changed – set it back to in-review` })
    } else if (old?.status !== 'ready') {
      notices.push(`state #${id}: ready newly set – confirm the user asked for it`)
    } else if (old.raw !== raw) {
      problems.push({ line: tile.line, message: `state #${id} was ready and changed – set it back to in-review` })
    } else if (aroundChanged) {
      problems.push({ line: tile.line, message: `the page around ready state #${id} changed – set it back to in-review` })
    }
  }
  const kept = new Set(newStates.map(s => s.attrs.get('id') ?? ''))
  for (const [id, old] of oldStates) if (old.status === 'ready' && !kept.has(id)) notices.push(`state #${id}: a ready state is gone – confirm the user asked for it`)
  return { problems, notices, changedStates }
}
