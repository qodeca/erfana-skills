#!/usr/bin/env node
// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// Builds docs/design-system/index.html and docs/designs/index.html from each
// page. Node standard library only.
//
//   node build-index.mjs <docs-folder>           rewrite the generated regions
//   node build-index.mjs --check <docs-folder>   fail if either is stale
//
// It writes only between generated markers. It refuses, naming the file, if a
// marker is missing or a comment block sits inside a region, because
// regenerating must never lose a comment. The title and summary of a page come
// from its <h1> and <meta name="description">, the "Start here by task" table
// from its <meta name="design-tasks">, and the "Which card owns this token"
// table from its #tokens table.

import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { lineAt, parseHtml } from './html-lite.mjs'
import { STATUS_ORDER, STATUS_TEXT, TILE_LINE, isDate, pageFacts } from './page-status.mjs'

export const INDEX_ROOTS = ['design-system', 'designs']
const REGIONS = { 'design-system': ['status', 'summary', 'list'], designs: ['status', 'list'] }
const SYSTEM_GROUPS = [
  { folder: 'foundations', title: 'Foundations', empty: 'No foundation pages yet.' },
  { folder: 'components', title: 'Components', empty: 'No component pages yet.' },
  { folder: 'patterns', title: 'Patterns', empty: 'No pattern pages yet. A pattern combines components into a recurring flow.' }
]
const MARKER = /^<!-- design:generated (\S+) (start|end) -->$/
const COMMENT_BLOCK = /^<!--\s*erfana:comment/

const byPath = (a, b) => (a < b ? -1 : a > b ? 1 : 0)
/** Text from a page is already HTML, so an existing entity stays as it is. */
const safe = value => value
  .replace(/&(?!(?:#\d+|#x[\da-f]+|[a-z][a-z\d]*);)/gi, '&amp;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const href = rel => rel.split('/').map(encodeURIComponent).join('/')
const today = () => {
  const t = new Date()
  return [t.getFullYear(), String(t.getMonth() + 1).padStart(2, '0'), String(t.getDate()).padStart(2, '0')].join('-')
}

function listFiles(root, folder, out = []) {
  const entries = readdirSync(path.join(root, folder), { withFileTypes: true })
  for (const entry of entries) {
    const rel = folder ? `${folder}/${entry.name}` : entry.name
    if (entry.isDirectory() && !['prototypes', 'node_modules', '.git'].includes(entry.name)) listFiles(root, rel, out)
    else if (entry.isFile()) out.push(rel)
  }
  return out.sort(byPath)
}

/** Reads every page below root. Returns { pages, errors }. */
function readPages(root, files) {
  const errors = []
  const pages = files.map(rel => {
    const facts = pageFacts(readFileSync(path.join(root, rel), 'utf8'))
    if (facts.problems.length > 0) errors.push(`${path.join(root, rel)}: ${facts.problems.join(', ')}`)
    return { rel, ...facts }
  })
  return { pages, errors }
}

const link = page => `<a href="${href(page.rel)}">${safe(page.title)}</a>`
const pill = status => `<span class="ds-status" data-status="${status}">${STATUS_TEXT[status]}</span>`

function card(page) {
  return `    <a class="ix-card" href="${href(page.rel)}">
      <span class="ix-card__name">${safe(page.title)}</span>
      <span class="ix-card__sub">${safe(page.summary)}</span>
      <span class="ix-card__meta">${pill(page.status)} updated ${page.updated}</span>
    </a>`
}

function renderSystem(root) {
  const html = listFiles(root, '').filter(rel => /\.html?$/i.test(rel) && rel !== 'index.html')
  const { pages, errors } = readPages(root, html)
  for (const page of pages) {
    if (!SYSTEM_GROUPS.some(g => page.rel.startsWith(`system/${g.folder}/`))) errors.push(`${path.join(root, page.rel)}: it is outside system/foundations, system/components, and system/patterns`)
  }
  const sections = SYSTEM_GROUPS.map(group => {
    const list = pages.filter(p => p.rel.startsWith(`system/${group.folder}/`))
    const heading = `<h2 id="${group.folder}">${group.title} <span class="ix-count">${list.length}</span></h2>`
    return list.length > 0
      ? `${heading}\n<div class="ix-grid">\n${list.map(card).join('\n')}\n</div>`
      : `${heading}\n<p class="ds-muted">${group.empty}</p>`
  })
  const counts = STATUS_ORDER.map(s => `  <li>${pill(s)} ${pages.filter(p => p.status === s).length}</li>`).join('\n')
  const summary = `<ul class="ix-summary" aria-label="Pages by status">\n${counts}\n</ul>`
  return { pages, errors, list: [...sections, renderTasks(pages), renderOwners(pages)].join('\n\n'), summary }
}

/** One row per task: two pages that answer the same task share its row. */
function renderTasks(pages) {
  const heading = '<h2 id="start-here">Start here by task</h2>'
  const byTask = new Map()
  for (const page of pages) {
    for (const task of page.tasks) {
      const key = task.toLowerCase()
      if (!byTask.has(key)) byTask.set(key, { task, cards: new Set() })
      byTask.get(key).cards.add(page)
    }
  }
  if (byTask.size === 0) return `${heading}\n<p class="ds-muted">No page declares a task yet. A page lists its tasks in <code>&lt;meta name="design-tasks"&gt;</code>.</p>`
  const rows = [...byTask.keys()].sort(byPath).map(key => {
    const { task, cards } = byTask.get(key)
    return `  <tr><td>${safe(task)}</td><td>${[...cards].map(link).join(', ')}</td></tr>`
  })
  return `${heading}\n<table>\n<thead><tr><th>I need to…</th><th>Card</th></tr></thead>\n<tbody>\n${rows.join('\n')}\n</tbody>\n</table>`
}

const familyOf = token => /^--([a-z\d]+)/i.exec(token)?.[1].toLowerCase() ?? ''
const isWildcard = token => token.endsWith('*')
const groupRank = page => SYSTEM_GROUPS.findIndex(g => page.rel.startsWith(`system/${g.folder}/`))

/**
 * A family is the first word of a token's name. Its owner is the page that
 * claims all of it with a wildcard, then the highest group, because a foundation
 * defines what a component only uses, then the page that lists the most of it.
 */
function ownerOf(family, pages) {
  const ranked = pages
    .map(page => ({ page, names: page.tokens.filter(t => familyOf(t) === family) }))
    .filter(entry => entry.names.length > 0)
    .map(entry => ({ ...entry, claims: entry.names.some(isWildcard) ? 0 : 1, rank: groupRank(entry.page) }))
  return ranked.sort((a, b) => a.claims - b.claims || a.rank - b.rank || b.names.length - a.names.length || byPath(a.page.rel, b.page.rel))[0].page
}

function renderOwners(pages) {
  const heading = '<h2 id="token-owners">Which card owns this token</h2>'
  const families = [...new Set(pages.flatMap(p => p.tokens).map(familyOf).filter(Boolean))].sort(byPath)
  if (families.length === 0) return `${heading}\n<p class="ds-muted">No page has a <code>#tokens</code> table yet.</p>`
  const rows = families.map(family => {
    const names = new Set(pages.flatMap(p => p.tokens).filter(t => familyOf(t) === family))
    const count = [...names].some(isWildcard) ? 'all' : names.size
    return `  <tr><td><code>--${safe(family)}-*</code></td><td class="ds-num">${count}</td><td>${link(ownerOf(family, pages))}</td></tr>`
  })
  return `${heading}\n<p class="ds-muted">Each token family has one owner card, worked out from every page's <code>#tokens</code> table. A wildcard in that table counts as all of the family.</p>\n<table>\n<thead><tr><th>Family</th><th>Tokens</th><th>Owner</th></tr></thead>\n<tbody>\n${rows.join('\n')}\n</tbody>\n</table>`
}

/** An area's own journey page: its overview, never one of its screens. */
const isAreaIndex = (page, area) => page.rel === `${area}/index.html` && page.kind === 'index'

function renderDesigns(root) {
  const files = listFiles(root, '')
  const html = files.filter(rel => /\.html?$/i.test(rel) && rel !== 'index.html')
  const { pages, errors } = readPages(root, html)
  for (const page of pages) if (!page.rel.includes('/')) errors.push(`${path.join(root, page.rel)}: a screen belongs in an area folder`)
  const areas = [...new Set(files.filter(rel => rel.includes('/')).map(rel => rel.split('/')[0]))]
  const sections = []
  for (const area of areas) {
    const inArea = pages.filter(p => p.rel.startsWith(`${area}/`))
    const overview = inArea.find(p => isAreaIndex(p, area))
    const list = inArea.filter(p => p !== overview)
    const notes = files.filter(rel => rel.startsWith(`${area}/`) && /\.md$/i.test(rel))
    if (inArea.length === 0 && notes.length === 0) continue
    const parts = [`<h2 id="${safe(area)}">${safe(area)}</h2>`]
    if (overview) parts.push(`<p class="ds-muted">Overview: <a href="${href(overview.rel)}">${safe(overview.title)}</a> – ${safe(overview.summary)} ${pill(overview.status)} <span class="ds-mono">${overview.updated}</span></p>`)
    if (list.length > 0) {
      const rows = list.map(p => `  <tr><td><a href="${href(p.rel)}">${safe(p.title)}</a></td><td>${safe(p.summary)}</td><td>${pill(p.status)}</td><td class="ds-mono">${p.updated}</td></tr>`)
      parts.push(`<table>\n<thead><tr><th>Screen</th><th>What it shows</th><th>Status</th><th>Updated</th></tr></thead>\n<tbody>\n${rows.join('\n')}\n</tbody>\n</table>`)
    }
    if (notes.length > 0) {
      const items = notes.map(rel => `  <li><a href="${href(rel)}"><code>${safe(rel)}</code></a></li>`)
      parts.push(`<p class="ds-muted">Design notes</p>\n<ul>\n${items.join('\n')}\n</ul>`)
    }
    sections.push(parts.join('\n'))
  }
  return { pages, errors, list: sections.length > 0 ? sections.join('\n\n') : '<p class="ds-muted">No designs yet.</p>' }
}

/**
 * An index is never ready: only a person sets that, on a page. It reads Draft
 * while any page does, or while there are no pages, and In review otherwise.
 */
function renderStatus(pages, date) {
  const status = pages.length === 0 || pages.some(p => p.status !== 'ready' && p.status !== 'in-review') ? 'draft' : 'in-review'
  return `<p class="ds-meta" data-design-status="${status}" data-updated="${date}"><span class="ds-status">${STATUS_TEXT[status]}</span> updated ${date} · ${TILE_LINE}</p>`
}

const dateless = html => html.replace(/data-updated="[^"]*"/, '').replace(/updated \d{4}-\d{2}-\d{2}/, '')

/** The generated regions of an index, by name. Throws, naming the file, if unsafe. */
function locateRegions(file, text, names) {
  const { comments } = parseHtml(text)
  const marks = comments.map(c => ({ ...c, match: MARKER.exec(c.raw) })).filter(c => c.match)
  const regions = new Map()
  for (const name of names) {
    const starts = marks.filter(m => m.match[1] === name && m.match[2] === 'start')
    const ends = marks.filter(m => m.match[1] === name && m.match[2] === 'end')
    if (starts.length !== 1 || ends.length !== 1 || starts[0].end > ends[0].end) {
      throw new Error(`${file}: needs one pair of generated markers named "${name}", in order – copy them from the index template`)
    }
    regions.set(name, { from: starts[0].end, to: ends[0].end - ends[0].raw.length })
  }
  const spans = [...regions.values()].sort((a, b) => a.from - b.from)
  if (spans.some((span, i) => i > 0 && span.from < spans[i - 1].to)) throw new Error(`${file}: generated regions overlap`)
  for (const c of comments.filter(comment => COMMENT_BLOCK.test(comment.raw))) {
    const at = c.end - c.raw.length
    for (const [name, region] of regions) {
      if (at >= region.from && at < region.to) {
        throw new Error(`${file}:${lineAt(text, at)}: a comment block sits inside the generated region "${name}" – regenerating would lose it, so nothing was written`)
      }
    }
  }
  return regions
}

/** Compares an index with its pages. Throws, naming the file, on anything unsafe. */
export function plan(file) {
  const root = path.dirname(file)
  const name = path.basename(root)
  if (!INDEX_ROOTS.includes(name)) throw new Error(`${file}: an index sits directly in design-system/ or designs/`)
  const text = readFileSync(file, 'utf8')
  const regions = locateRegions(file, text, REGIONS[name])
  const { pages, errors, list, summary } = name === 'design-system' ? renderSystem(root) : renderDesigns(root)
  if (errors.length > 0) throw new Error(`cannot build ${file}: ${errors.join('; ')}`)

  const piece = n => text.slice(regions.get(n).from, regions.get(n).to)
  const current = /data-updated="([^"]*)"/.exec(piece('status'))?.[1] ?? ''
  const newest = pages.map(p => p.updated).sort().at(-1) ?? ''
  const generated = { list: `\n${list}\n`, summary: `\n${summary}\n` }
  const same = n => n === 'status' || piece(n) === generated[n]
  const known = [current, newest].filter(isDate).sort().at(-1) ?? ''
  const unchanged = date => REGIONS[name].every(same) && dateless(piece('status')) === dateless(`\n${renderStatus(pages, date)}\n`)
  const stale = !unchanged(known || today()) || (isDate(newest) && current < newest) || !isDate(current)
  const date = stale ? [known, today()].filter(isDate).sort().at(-1) : current
  generated.status = stale ? `\n${renderStatus(pages, date)}\n` : piece('status')
  const ordered = [...regions.entries()].sort((a, b) => b[1].from - a[1].from)
  let output = text
  for (const [regionName, region] of ordered) output = output.slice(0, region.from) + generated[regionName] + output.slice(region.to)
  return { stale, output }
}

/** The problem with an index, or null if it matches its pages. For the checker. */
export function indexProblem(file) {
  try {
    return plan(file).stale ? `${file} is stale – run build-index.mjs` : null
  } catch (error) {
    return error.message
  }
}

function write(file, output) {
  const temp = `${file}.tmp-${process.pid}`
  writeFileSync(temp, output)
  renameSync(temp, file)
}

function main(argv) {
  const check = argv.includes('--check')
  const targets = argv.filter(a => a !== '--check')
  if (targets.length !== 1 || !existsSync(targets[0])) {
    console.error('usage: node build-index.mjs [--check] <docs-folder>')
    return 2
  }
  const files = INDEX_ROOTS.map(root => path.join(targets[0], root)).filter(existsSync).map(root => path.join(root, 'index.html'))
  if (files.length === 0) {
    console.error(`${targets[0]} holds neither design-system/ nor designs/`)
    return 2
  }
  let failed = 0
  for (const file of files) {
    try {
      if (!existsSync(file)) throw new Error(`${file} is missing – copy it from the index template`)
      const { stale, output } = plan(file)
      if (stale && check) throw new Error(`${file} is stale – run build-index.mjs`)
      if (stale) write(file, output)
      console.log(`${file}: ${stale ? 'rebuilt' : 'up to date'}`)
    } catch (error) {
      console.error(error.message)
      failed += 1
    }
  }
  return failed > 0 ? 1 : 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2))
}
