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
//   node check-design.mjs --snapshot-clean <copy>  delete a copy that --snapshot made
//   node check-design.mjs --snapshot <folder>    copy it under .local/design-snapshots, print the path
//
// Prints one "file:line [rule] message" per problem. Exit 1 on any problem.
// It reads files only: it cannot see text clipped on screen, so a browser look
// is still part of the review. Status and date rules live in page-status.mjs.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { INDEX_ROOTS, indexProblem } from './build-index.mjs'
import { buildCss } from './build-tokens.mjs'
import { cssProblems, varsDefined, varsUsed } from './css-rules.mjs'
import { hasClass, inside, lineAt, parseHtml, stripTags } from './html-lite.mjs'
import { snapshotCommand } from './snapshot.mjs'
import { carriers, compareStatus, metaOf, newestDate, statesOf, statusProblems, tileOf } from './page-status.mjs'

export { TILE_LINE } from './page-status.mjs'
export { snapshot, snapshotClean } from './snapshot.mjs'
export const CSP = "script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; child-src 'none'"
export const PROTOTYPE_LINE = 'Prototype – not for comments or sign-off'
const PAGE_KINDS = new Set(['screen', 'doc', 'index'])
const MAX_BYTES = 25 * 1024 * 1024
const MAX_BLOCKS = 500
const TEMPLATES = fileURLToPath(new URL('../templates/', import.meta.url))
const COPIED_SHEETS = new Set(['docs.css', 'docs-tokens.css', 'fonts.css'])

const ACTIVE_ELEMENTS = new Set(['script', 'object', 'embed', 'applet', 'frame', 'frameset'])
const HIDING_ELEMENTS = { template: 'its content never renders', dialog: 'it stays closed and sits above pins', iframe: 'nothing inside a frame can take a comment' }
const CONTROLS = new Set(['button', 'input', 'select', 'textarea', 'summary'])
const PAINT_ATTRS = new Set(['fill', 'stroke', 'stop-color', 'flood-color', 'lighting-color'])
const PAINT_OK = /^(?:none|currentColor|url\(\s*#[^)]*\)|var\(\s*--[\w-]+\s*(?:,[^)]*)?\))$/i

const isFixedFrame = node => /(?:^|\s)design-frame--/.test(node.attrs.get('class') ?? '')

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
    this.checkCopy(file)
    return info
  }

  /** The documentation sheets are copied unchanged, so every project reads the same. */
  checkCopy(file) {
    const base = path.basename(file)
    if (!COPIED_SHEETS.has(base) || path.basename(path.dirname(path.resolve(file))) !== 'design-system') return
    const template = path.join(TEMPLATES, base)
    if (!existsSync(template)) {
      this.add(path.resolve(file), 1, 'copies', `cannot compare: the skill's template ${template} is missing`)
      return
    }
    const lines = name => readFileSync(name, 'utf8').replace(/\r\n/g, '\n')
    if (lines(file) !== lines(template)) this.add(path.resolve(file), 1, 'copies', `differs from the skill's templates/${base} – copy it again, unchanged`)
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
    if (isFixedFrame(node) && inside(node, p => hasClass(p, 'ds-frames'))) {
      this.add(file, line, 'frames', 'a fixed-width frame sits in a .design-state in .ds-states, outside the .ds-frames grid, whose columns are narrower than it')
    }
    if (kind === 'screen' && inScreen) {
      if (tag === 'a' && attrs.has('href')) this.add(file, line, 'no-fake-controls', 'a link inside a frame works – remove href')
      if (CONTROLS.has(tag) && attrs.get('tabindex') !== '-1') this.add(file, line, 'no-fake-controls', `<${tag}> in a frame needs tabindex="-1", because it is a picture of a control`)
    }
  }

  /** Each state has its rectangle directly above its frame; a doc or index page has its line. */
  checkStatus(file, text, nodes, kind) {
    const inState = n => inside(n, p => hasClass(p, 'design-state'))
    for (const tile of nodes.filter(n => hasClass(n, 'design-tile'))) {
      if (kind !== 'screen' || !inState(tile)) this.add(file, tile.line, 'tile', 'a page has no status tile: the rectangle sits inside each .design-state, and a doc or index page uses p.ds-meta')
    }
    if (kind === 'screen') {
      for (const state of statesOf(nodes)) {
        if (!tileOf(nodes, state)) this.add(file, state.line, 'tile', 'a state needs a .design-tile rectangle directly above its frame')
      }
    } else if (PAGE_KINDS.has(kind) && !metaOf(nodes)) {
      this.add(file, 1, 'meta', 'a doc or index page needs a p.ds-meta status line under its h1')
    }
    const list = carriers(nodes, kind)
    for (const node of list) {
      for (const p of statusProblems(text, node, kind === 'screen' ? 'tile' : 'meta')) this.add(file, p.line, p.rule, p.message)
    }
    const newest = newestDate(list)
    if (!this.options.noDate && newest) this.checkDate(file, list[0].line, newest)
    return list.map(n => n.attrs.get('data-design-status') ?? '')
  }

  /** On a screen, every frame has its own rectangle as the element right before it. */
  checkStates(file, text, nodes) {
    const states = statesOf(nodes)
    if (states.length === 0) this.add(file, 1, 'states', 'a screen page needs at least one .design-state')
    const ids = new Set()
    for (const state of states) {
      const id = state.attrs.get('id') ?? ''
      if (!id || ids.has(id)) this.add(file, state.line, 'states', 'a state needs its own id, so status and comments can follow it')
      ids.add(id)
      const label = nodes.find(n => hasClass(n, 'design-state__label') && inside(n, p => p === state))
      if (!label || stripTags(text.slice(label.start, label.end)) === '') this.add(file, state.line, 'states', 'a state needs a .design-state__label with text')
      const frames = nodes.filter(n => hasClass(n, 'design-frame') && inside(n, p => p === state))
      if (frames.length === 0) this.add(file, state.line, 'states', 'a state needs a .design-frame')
      for (const frame of frames) {
        if (frame.attrs.get('aria-hidden') !== 'true') this.add(file, frame.line, 'states', 'a .design-frame is a picture: add aria-hidden="true"')
        const siblings = nodes.filter(n => n.parent === frame.parent && n.start < frame.start)
        if (tileOf(nodes, state) && !hasClass(siblings.at(-1) ?? frame, 'design-tile')) this.add(file, frame.line, 'tile', 'the .design-tile rectangle must sit directly above this frame')
      }
    }
    for (const frame of nodes.filter(n => hasClass(n, 'design-frame') && !inside(n, p => hasClass(p, 'design-state')))) {
      this.add(file, frame.line, 'states', 'a .design-frame on a screen page sits inside a .design-state')
    }
    if (!nodes.some(n => hasClass(n, 'design-questions'))) this.add(file, 1, 'questions', 'a screen page needs a .design-questions block, even if it says none are open')
  }

  /** The fixed parts of a page, so every page reads the same way. */
  checkAnatomy(file, nodes, kind) {
    if (!PAGE_KINDS.has(kind)) return
    const need = (found, what) => { if (!found) this.add(file, 1, 'anatomy', `${kind} page needs ${what}`) }
    need(nodes.some(n => n.tag === 'main'), '<main>')
    if (kind === 'index') return
    need(nodes.some(n => n.tag === 'nav' && hasClass(n, 'ds-crumbs')), 'nav.ds-crumbs')
    need(nodes.some(n => n.attrs.get('id') === 'decision'), 'an element with id="decision"')
    need(nodes.some(n => n.tag === 'meta' && n.attrs.get('name') === 'description' && (n.attrs.get('content') ?? '').trim()), '<meta name="description">, which the index shows')
    if (kind === 'doc') need(nodes.some(n => n.attrs.get('id') === 'exceptions'), 'an element with id="exceptions"')
  }

  checkDate(file, line, updated) {
    const changed = this.lastChange(file)
    if (updated < changed) this.add(file, line, 'date', `the newest date on this page, ${updated}, is older than its last change ${changed}`)
  }

  lastChange(file) {
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
    return changed
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

  checkBaseline(file, text, nodes, blocks) {
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
    const { problems, notices, changedStates } = compareStatus(old, parsed.nodes, text, nodes)
    for (const p of problems) this.add(file, p.line, 'status', p.message)
    for (const n of notices) this.notices.push(`${file}: ${n}`)
    if (this.options.noDate) return
    // A comment saved by Erfana is not a design change, so it asks for no new date.
    const withoutBlocks = html => html.replace(/<!--\s*erfana:comment[\s\S]*?-->\s*/g, '')
    const changed = this.lastChange(file)
    for (const { id, raw, oldRaw, tile } of changedStates) {
      const date = tile?.attrs.get('data-updated') ?? ''
      if (date && date < changed && withoutBlocks(raw) !== withoutBlocks(oldRaw)) {
        this.add(file, tile.line, 'date', `state #${id} changed, so its date ${date} must be updated to ${changed} or later`)
      }
    }
  }

  checkPage(file) {
    const size = statSync(file).size
    if (size > MAX_BYTES) return this.add(file, 1, 'limits', 'over 25 MB – Erfana will not show comments')
    const buffer = readFileSync(file)
    const text = buffer.toString('utf8')
    if (!buffer.equals(Buffer.from(text, 'utf8'))) return this.add(file, 1, 'limits', 'not valid UTF-8 – Erfana will not show comments')
    if (/^<{7} /m.test(text) && /^>{7} /m.test(text)) this.add(file, 1, 'limits', 'merge-conflict markers – Erfana will not write comments')
    const { nodes, comments, errors } = parseHtml(text)
    for (const e of errors) this.add(file, e.line, e.rule ?? 'markup', e.message)

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

    const statuses = this.checkStatus(file, text, nodes, kind)
    this.checkAnatomy(file, nodes, kind)
    if (kind === 'screen') this.checkStates(file, text, nodes)

    const blocks = commentBlocks(comments, nodes)
    if (blocks.length > MAX_BLOCKS) this.add(file, 1, 'limits', `${blocks.length} comment blocks – Erfana stops at ${MAX_BLOCKS}, so split the file`)
    // Any open comment on the page blocks ready, wherever it sits: the rule is
    // about the page a person approves, not the state the comment landed on.
    if (statuses.includes('ready') && blocks.some(b => b.open)) this.add(file, 1, 'status', 'ready with open comments – resolve them in Erfana first')
    this.checkBaseline(file, text, nodes, blocks)
    return undefined
  }

  /** A stale or unsafe index, and a page folder with no index at all. */
  checkIndex(target) {
    const candidates = [target, path.join(target, 'docs/design-system'), path.join(target, 'docs/designs'), path.join(target, 'design-system'), path.join(target, 'designs')]
    for (const root of new Set(candidates)) {
      if (!INDEX_ROOTS.includes(path.basename(root)) || !existsSync(root) || !statSync(root).isDirectory()) continue
      const file = path.join(root, 'index.html')
      if (!existsSync(file)) {
        const found = []
        walk(root, found)
        if (found.some(f => /\.html?$/i.test(f))) this.add(file, 1, 'index', 'this folder has pages but no index.html – copy it from the index template and run build-index.mjs')
        continue
      }
      const problem = indexProblem(file)
      if (problem) this.add(file, 1, 'index', problem)
    }
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
      } else if (COPIED_SHEETS.has(path.basename(file))) {
        run.checkCopy(file)
      } else if (path.basename(file) === 'responsive.css') {
        // Real product CSS: it may hide things, but its values are still tokens.
        for (const p of cssProblems(readFileSync(file, 'utf8'))) if (p.rule !== 'no-hidden') run.add(file, p.line, p.rule, p.message)
      } else if (/\.m?js$/i.test(file) && !isPrototype) {
        run.add(file, 1, 'no-script', 'a script file is banned outside prototypes/')
      }
    }
    if (statSync(target).isDirectory()) run.checkIndex(target)
    else if (path.basename(target) === 'index.html' && INDEX_ROOTS.includes(path.basename(path.dirname(target)))) {
      const problem = indexProblem(target)
      if (problem) run.add(target, 1, 'index', problem)
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
  const snapshotCode = snapshotCommand(argv)
  if (snapshotCode !== null) return snapshotCode
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
