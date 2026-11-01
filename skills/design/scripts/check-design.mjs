#!/usr/bin/env node
// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// The design page checker. Node standard library only.
//
//   node check-design.mjs [options] <file-or-folder>...
//     --baseline-ref <git-ref>   compare with that commit (comments, ready)
//     --baseline-dir <folder>    compare one folder with a copy of it
//     --no-date                  skip the date test (fixtures, shipped samples)
//     --audit                    also list unused tokens and missing state classes
//   node check-design.mjs --snapshot <folder>    copy it to a temp folder, print the path
//
// Prints one "file:line [rule] message" per problem. Exit 1 on any problem.
// It reads files only: it cannot see text clipped on screen, so a browser look
// is still part of the review.

import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { buildCss } from './build-tokens.mjs'
import { lineAt, parseHtml } from './html-lite.mjs'

export const CSP = "script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; child-src 'none'"
export const TILE_LINE = 'Design, not a working product'
export const PROTOTYPE_LINE = 'Prototype – not for comments or sign-off'
const STATUS_TEXT = { draft: 'Draft', 'in-review': 'In review', ready: 'Ready for development' }
const PAGE_KINDS = new Set(['screen', 'doc', 'index'])
const MAX_BYTES = 25 * 1024 * 1024
const MAX_BLOCKS = 500

const ACTIVE_ELEMENTS = new Set(['script', 'object', 'embed', 'applet', 'frame', 'frameset'])
const HIDING_ELEMENTS = { template: 'its content never renders', dialog: 'it stays closed and sits above pins', iframe: 'nothing inside a frame can take a comment' }
const CONTROLS = new Set(['button', 'input', 'select', 'textarea', 'summary'])
const PAINT_ATTRS = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'])
const PAINT_OK = /^(?:none|currentColor|url\(\s*#[^)]*\)|var\(\s*--[\w-]+\s*(?:,[^)]*)?\))$/i

const blank = match => match.replace(/[^\n]/g, ' ')

const classesOf = node => (node.attrs.get('class') ?? '').split(/\s+/).filter(Boolean)
const hasClass = (node, name) => classesOf(node).includes(name)
const inside = (node, test) => {
  for (let n = node.parent; n; n = n.parent) if (test(n)) return true
  return false
}
const stripTags = html => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const decodeUrl = value => value
  .replace(/&#x([0-9a-f]+);?/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&#(\d+);?/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&colon;/gi, ':').replace(/&(?:tab|newline);/gi, '')
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000- ]+/g, '')

export function commentBlocks(comments, nodes = []) {
  return comments
    .filter(c => /^<!--\s*erfana:comment v\d/.test(c.raw))
    .map(c => {
      const next = nodes.find(n => n.start >= c.end)
      return { raw: c.raw, line: c.line, open: /^\s*status: open\s*$/m.test(c.raw), before: next ? `${next.tag}#${next.attrs.get('id') ?? ''}` : '' }
    })
}

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

const varsUsed = css => [...css.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1])
const varsDefined = css => [...css.replace(/\/\*[\s\S]*?\*\//g, blank).matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1])

class Run {
  constructor(options) {
    this.options = options
    this.problems = []
    this.cssCache = new Map()
    this.allCss = new Map()
    this.allUsed = new Set()
    this.compared = 0
    this.notices = []
  }

  add(file, line, rule, message) {
    const text = `${file}:${line} [${rule}] ${message}`
    if (!this.problems.includes(text)) this.problems.push(text)
  }

  /** Reads a stylesheet and its local imports. Returns { used, defined }. */
  readCss(file, from, line) {
    if (this.cssCache.has(file)) return this.cssCache.get(file)
    const info = { used: [], defined: [] }
    this.cssCache.set(file, info)
    if (!existsSync(file)) {
      this.add(from, line, 'links', `missing stylesheet ${file}`)
      return info
    }
    const css = readFileSync(file, 'utf8')
    this.allCss.set(file, css)
    const allowRaw = /tokens\.css$/.test(path.basename(file))
    for (const p of cssProblems(css, { allowRaw })) this.add(file, p.line, p.rule, p.message)
    info.used.push(...varsUsed(css))
    info.defined.push(...varsDefined(css))
    for (const hit of css.matchAll(/@import\s+(?:url\()?\s*['"]?([^'")\s;]+)/g)) {
      if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(hit[1])) {
        this.add(file, lineAt(css, hit.index), 'links', `remote import ${hit[1]} – the checker cannot read it and the page breaks offline`)
      } else {
        const sub = this.readCss(path.resolve(path.dirname(file), hit[1]), file, lineAt(css, hit.index))
        info.used.push(...sub.used)
        info.defined.push(...sub.defined)
      }
    }
    if (path.basename(file) === 'tokens.css') this.checkDrift(file, css)
    return info
  }

  checkDrift(file, css) {
    const json = path.join(path.dirname(file), 'tokens.json')
    if (!existsSync(json)) return
    let built
    try {
      built = buildCss(JSON.parse(readFileSync(json, 'utf8')))
    } catch (error) {
      this.add(json, 1, 'tokens', `cannot read: ${error.message}`)
      return
    }
    for (const e of built.errors) this.add(json, 1, 'tokens', e)
    if (built.errors.length === 0 && built.css !== css) this.add(file, 1, 'tokens', 'differs from tokens.json – run build-tokens.mjs')
  }

  checkNode(file, node, kind) {
    const { tag, line, attrs } = node
    const inScreen = inside(node, n => hasClass(n, 'design-frame'))
    if (ACTIVE_ELEMENTS.has(tag)) this.add(file, line, 'no-script', `<${tag}> is banned`)
    if (HIDING_ELEMENTS[tag]) this.add(file, line, 'no-hidden', `<${tag}> is banned – ${HIDING_ELEMENTS[tag]}`)
    if (tag === 'details' && !attrs.has('open')) this.add(file, line, 'no-hidden', '<details> must carry open, so its content stays visible')
    if (tag === 'form') this.add(file, line, 'no-fake-controls', '<form> is banned – nothing can submit')
    if (tag === 'link') {
      const rel = (attrs.get('rel') ?? '').toLowerCase().split(/\s+/)
      if (rel.includes('modulepreload') || (attrs.get('as') ?? '').toLowerCase() === 'script') this.add(file, line, 'no-script', 'a script preload is banned')
    }
    if (tag === 'meta' && (attrs.get('http-equiv') ?? '').toLowerCase() === 'refresh') this.add(file, line, 'no-script', 'meta refresh is banned')
    for (const [name, value] of attrs) {
      if (/^on/.test(name)) this.add(file, line, 'no-script', `event attribute ${name}= is banned`)
      if (/^(?:javascript|vbscript):/i.test(decodeUrl(value))) this.add(file, line, 'no-script', `a script URL in ${name}= is banned`)
      if (name === 'hidden') this.add(file, line, 'no-hidden', 'the hidden attribute is banned')
      if (name === 'inert') this.add(file, line, 'no-hidden', 'inert is banned – browsers skip it when Erfana picks a comment target; use aria-hidden on the frame')
      if (name === 'popover' || name === 'popovertarget') this.add(file, line, 'no-hidden', `${name} is banned – draw the open state as its own state`)
      if (name === 'style') for (const p of cssProblems(value, { baseLine: line })) this.add(file, p.line, p.rule, p.message)
      if (PAINT_ATTRS.has(name) && !PAINT_OK.test(value.trim())) this.add(file, line, 'no-raw-values', `${name}="${value}" – paint with currentColor or a token`)
    }
    if (tag === 'style') for (const p of cssProblems(node.text ?? '', { baseLine: node.textLine })) this.add(file, p.line, p.rule, p.message)
    if (kind === 'screen' && inScreen) {
      if (tag === 'a' && attrs.has('href')) this.add(file, line, 'no-fake-controls', 'a link inside a frame works – remove href')
      if (CONTROLS.has(tag) && attrs.get('tabindex') !== '-1') this.add(file, line, 'no-fake-controls', `<${tag}> in a frame needs tabindex="-1", because it is a picture of a control`)
    }
  }

  checkTile(file, text, nodes) {
    const tile = nodes.find(n => hasClass(n, 'design-tile'))
    if (!tile) return this.add(file, 1, 'tile', 'no .design-tile')
    const status = tile.attrs.get('data-design-status') ?? ''
    const updated = tile.attrs.get('data-updated') ?? ''
    const words = stripTags(text.slice(tile.start, tile.end))
    if (!STATUS_TEXT[status]) this.add(file, tile.line, 'tile', `data-design-status must be ${Object.keys(STATUS_TEXT).join(', ')}`)
    else if (!words.includes(STATUS_TEXT[status])) this.add(file, tile.line, 'tile', `the tile must say "${STATUS_TEXT[status]}"`)
    if (!words.includes(TILE_LINE)) this.add(file, tile.line, 'tile', `the tile must say "${TILE_LINE}"`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(updated) || !words.includes(updated)) this.add(file, tile.line, 'tile', 'data-updated must be YYYY-MM-DD and shown in the tile')
    if (status === 'ready' && !tile.attrs.get('data-approved-by')) this.add(file, tile.line, 'status', 'ready needs data-approved-by, the person who approved it')
    if (!this.options.noDate && updated) this.checkDate(file, tile.line, updated)
    return status
  }

  checkDate(file, line, updated) {
    const dir = path.dirname(file)
    const base = path.basename(file)
    const git = args => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    let changed = ''
    try {
      const dirty = git(['status', '--porcelain', '--', base]) !== ''
      if (!dirty) changed = git(['log', '-1', '--format=%cs', '--', base])
    } catch { /* not a git repository: fall through to the file time */ }
    if (changed === '') {
      const t = statSync(file).mtime
      changed = [t.getFullYear(), String(t.getMonth() + 1).padStart(2, '0'), String(t.getDate()).padStart(2, '0')].join('-')
    }
    if (updated < changed) this.add(file, line, 'tile', `date ${updated} is older than the last change ${changed}`)
  }

  baselineOf(file) {
    const { baselineRef, baselineDir, root } = this.options
    if (baselineDir) {
      const old = path.join(baselineDir, path.relative(root, file))
      return existsSync(old) ? readFileSync(old, 'utf8') : null
    }
    if (!baselineRef) return null
    const dir = path.dirname(file)
    const prefix = execFileSync('git', ['-C', dir, 'rev-parse', '--show-prefix'], { encoding: 'utf8' }).trim()
    try {
      return execFileSync('git', ['-C', dir, 'show', `${baselineRef}:${prefix}${path.basename(file)}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    } catch {
      return null // not in that commit, so a new page
    }
  }

  checkBaseline(file, text, blocks, status) {
    const old = this.baselineOf(file)
    if (old === null) return
    this.compared += 1
    const parsed = parseHtml(old)
    const left = [...blocks]
    for (const block of commentBlocks(parsed.comments, parsed.nodes)) {
      const name = /id=(\S+)/.exec(block.raw)?.[1] ?? ''
      const at = left.findIndex(b => b.raw === block.raw)
      if (at < 0) {
        this.add(file, block.line, 'comments', `comment block ${name} was changed or removed – restore it byte for byte`)
      } else {
        if (left[at].before !== block.before) this.add(file, left[at].line, 'comments', `comment block ${name} sat before ${block.before} and now sits before ${left[at].before} – put it back`)
        left.splice(at, 1)
      }
    }
    const oldTile = parsed.nodes.find(n => hasClass(n, 'design-tile'))
    if (oldTile?.attrs.get('data-design-status') === 'ready' && status === 'ready' && old !== text) {
      this.add(file, 1, 'status', 'a ready page changed – set it back to in-review')
    }
    if (oldTile && oldTile.attrs.get('data-design-status') !== 'ready' && status === 'ready') this.notices.push(`${file}: ready newly set – confirm the user asked for it`)
  }

  checkPage(file) {
    const size = statSync(file).size
    if (size > MAX_BYTES) return this.add(file, 1, 'limits', 'over 25 MB – Erfana will not show comments')
    const buffer = readFileSync(file)
    const text = buffer.toString('utf8')
    if (!buffer.equals(Buffer.from(text, 'utf8'))) return this.add(file, 1, 'limits', 'not valid UTF-8 – Erfana will not show comments')
    if (/^<{7} /m.test(text) && /^>{7} /m.test(text)) this.add(file, 1, 'limits', 'merge-conflict markers – Erfana will not write comments')
    const { nodes, comments, errors } = parseHtml(text)
    for (const e of errors) this.add(file, e.line, 'markup', e.message)

    const body = nodes.find(n => n.tag === 'body')
    const kind = body?.attrs.get('data-design-page') ?? ''
    if (!PAGE_KINDS.has(kind)) this.add(file, body?.line ?? 1, 'page', `<body> needs data-design-page: ${[...PAGE_KINDS].join(', ')}`)

    const head = nodes.find(n => n.tag === 'head')
    const first = head ? nodes.find(n => n.parent === head) : null
    const cspOk = first?.tag === 'meta' && (first.attrs.get('http-equiv') ?? '').toLowerCase() === 'content-security-policy' &&
      (first.attrs.get('content') ?? '').replace(/\s+/g, ' ').trim() === CSP
    if (!cspOk) this.add(file, first?.line ?? 1, 'csp', `the first element in <head> must be the CSP meta: ${CSP}`)
    if (!nodes.some(n => n.tag === 'meta' && (n.attrs.get('charset') ?? '').toLowerCase() === 'utf-8')) this.add(file, 1, 'page', '<meta charset="utf-8"> is missing')

    const used = []
    const defined = []
    for (const node of nodes) {
      this.checkNode(file, node, kind)
      const value = node.attrs.get('style') ?? (node.tag === 'style' ? node.text : '')
      if (value) { used.push(...varsUsed(value)); defined.push(...varsDefined(value)) }
      if (node.tag === 'link' && (node.attrs.get('rel') ?? '').toLowerCase().split(/\s+/).includes('stylesheet')) {
        const href = node.attrs.get('href') ?? ''
        if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(href)) {
          this.add(file, node.line, 'links', `remote stylesheet ${href} – the checker cannot read it and the page breaks offline`)
        } else if (path.basename(href) === 'responsive.css') {
          this.add(file, node.line, 'no-hidden', 'review pages never load responsive.css')
        } else {
          const info = this.readCss(path.resolve(path.dirname(file), href), file, node.line)
          used.push(...info.used)
          defined.push(...info.defined)
        }
      }
    }
    const known = new Set(defined)
    for (const name of new Set(used)) {
      this.allUsed.add(name)
      if (!known.has(name)) this.add(file, 1, 'tokens', `${name} is used but no linked stylesheet defines it`)
    }

    const status = this.checkTile(file, text, nodes)
    if (kind === 'screen') {
      const states = nodes.filter(n => hasClass(n, 'design-state'))
      if (states.length === 0) this.add(file, 1, 'states', 'a screen page needs at least one .design-state')
      for (const state of states) {
        const label = nodes.find(n => hasClass(n, 'design-state__label') && inside(n, p => p === state))
        if (!label || stripTags(text.slice(label.start, label.end)) === '') this.add(file, state.line, 'states', 'a state needs a .design-state__label with text')
        const frame = nodes.find(n => hasClass(n, 'design-frame') && inside(n, p => p === state))
        if (!frame) this.add(file, state.line, 'states', 'a state needs a .design-frame')
        else if (frame.attrs.get('aria-hidden') !== 'true') this.add(file, frame.line, 'states', 'a .design-frame is a picture: add aria-hidden="true"')
      }
      if (!nodes.some(n => hasClass(n, 'design-questions'))) this.add(file, 1, 'questions', 'a screen page needs a .design-questions block, even if it says none are open')
    }

    const blocks = commentBlocks(comments, nodes)
    if (blocks.length > MAX_BLOCKS) this.add(file, 1, 'limits', `${blocks.length} comment blocks – Erfana stops at ${MAX_BLOCKS}, so split the file`)
    if (status === 'ready' && blocks.some(b => b.open)) this.add(file, 1, 'status', 'ready with open comments – resolve them in Erfana first')
    this.checkBaseline(file, text, blocks, status)
    return undefined
  }

  checkPrototype(file) {
    if (!readFileSync(file, 'utf8').includes(PROTOTYPE_LINE)) this.add(file, 1, 'prototype', `a prototype page must say "${PROTOTYPE_LINE}"`)
  }

  audit() {
    const lines = []
    for (const [file, css] of this.allCss) {
      if (path.basename(file) === 'tokens.css') {
        const everyUse = new Set(this.allUsed)
        for (const other of this.allCss.values()) for (const name of varsUsed(other)) everyUse.add(name)
        for (const name of new Set(varsDefined(css))) if (!everyUse.has(name)) lines.push(`${file}: unused token ${name}`)
      }
      for (const hit of css.matchAll(/(\.[\w-]+):(hover|focus-visible|active)\b/g)) {
        const cls = hit[2] === 'focus-visible' ? 'is-focus' : `is-${hit[2]}`
        if (!css.includes(`${hit[1]}.${cls}`)) lines.push(`${file}: ${hit[1]}:${hit[2]} has no ${hit[1]}.${cls} rule, so the state cannot be drawn`)
      }
    }
    return [...new Set(lines)]
  }
}

function walk(target, out) {
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue
    const full = path.join(target, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
}

/** A page gone from the folder takes its comments with it, and no walk sees it. */
function checkRemoved(run, { baselineDir }, target) {
  const old = []
  walk(baselineDir, old)
  for (const file of old.filter(f => /\.html?$/i.test(f))) {
    const now = path.join(target, path.relative(baselineDir, file))
    if (!existsSync(now) && commentBlocks(parseHtml(readFileSync(file, 'utf8')).comments).length > 0) {
      run.add(now, 1, 'comments', 'this page held comment blocks and is gone – restore it')
    }
  }
}

export function checkPaths(targets, options = {}) {
  const run = new Run(options)
  for (const target of targets) {
    const files = []
    if (statSync(target).isDirectory()) walk(target, files)
    else files.push(target)
    run.options.root = statSync(target).isDirectory() ? target : path.dirname(target)
    for (const file of files) {
      const isPrototype = file.split(path.sep).includes('prototypes')
      if (/\.html?$/i.test(file)) {
        if (isPrototype) run.checkPrototype(file)
        else run.checkPage(file)
      } else if (path.basename(file) === 'responsive.css') {
        // Real product CSS: it may hide things, but its values are still tokens.
        for (const p of cssProblems(readFileSync(file, 'utf8'))) if (p.rule !== 'no-hidden') run.add(file, p.line, p.rule, p.message)
      } else if (/\.m?js$/i.test(file) && !isPrototype) {
        run.add(file, 1, 'no-script', 'a script file is banned outside prototypes/')
      }
    }
  }
  if (options.baselineDir) checkRemoved(run, options, targets[0])
  if ((options.baselineDir || options.baselineRef) && run.compared === 0) {
    run.add(targets[0], 1, 'comments', 'no page matched the baseline, so nothing was compared – check the baseline path')
  }
  return { problems: run.problems, audit: options.audit ? run.audit() : [], compared: run.compared, notices: run.notices }
}

function gitRefExists(ref, target) {
  try {
    const dir = statSync(target).isDirectory() ? target : path.dirname(target)
    execFileSync('git', ['-C', dir, 'rev-parse', '--verify', '--quiet', `${ref}^{commit}`], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function main(argv) {
  if (argv[0] === '--snapshot') {
    if (!argv[1] || !existsSync(argv[1])) {
      console.error('usage: node check-design.mjs --snapshot <folder>')
      return 2
    }
    const copy = mkdtempSync(path.join(tmpdir(), 'design-baseline-'))
    cpSync(argv[1], copy, { recursive: true })
    console.log(copy)
    return 0
  }
  const options = {}
  const targets = []
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--no-date') options.noDate = true
    else if (argv[i] === '--audit') options.audit = true
    else if (argv[i] === '--baseline-ref') options.baselineRef = String(argv[(i += 1)]).replace(/^-+/, '')
    else if (argv[i] === '--baseline-dir') options.baselineDir = argv[(i += 1)]
    else targets.push(argv[i])
  }
  const baselineBad = options.baselineDir && (targets.length !== 1 || !existsSync(options.baselineDir) || !statSync(targets[0]).isDirectory())
  const refBad = options.baselineRef && !gitRefExists(options.baselineRef, targets[0])
  if (targets.length === 0 || targets.some(t => !existsSync(t)) || baselineBad || refBad) {
    console.error('usage: node check-design.mjs [--baseline-ref <ref>] [--baseline-dir <folder> with one folder target] [--no-date] [--audit] <file-or-folder>...\nA baseline folder or ref that does not exist also stops here.')
    return 2
  }
  const { problems, audit, compared, notices } = checkPaths(targets, options)
  for (const line of problems) console.log(line)
  for (const line of audit) console.log(`audit: ${line}`)
  for (const line of notices) console.log(`notice: ${line}`)
  if (options.baselineDir || options.baselineRef) console.log(`baseline: ${compared} page(s) compared`)
  console.log(`design check: ${problems.length} problem(s)`)
  return problems.length > 0 ? 1 : 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2))
}
