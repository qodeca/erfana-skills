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
// is still part of the review. page-form.mjs holds the accepted form of a page,
// css-rules.mjs that of CSS, page-status.mjs status, and baseline.mjs git and dates.

import { parseArgs } from 'node:util'
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { designChange, refExists, repoTop, textAt } from './baseline.mjs'
import { indexProblem } from './build-index.mjs'
import { buildCss } from './build-tokens.mjs'
import { auditSheets, cssFacts, cssProblems } from './css-rules.mjs'
import { commentBlocks, hasClass, inside, parseHtml, stripBlocks, stripTags } from './html-lite.mjs'
import { checkForm, relOf } from './page-form.mjs'
import { checkSizes, projectSizes } from './page-sizes.mjs'
import { carriers, compareStatus, metaOf, newestDate, pageKind, statesOf, statusProblems, tileOf } from './page-status.mjs'
import { INDEX_ROOTS, echo, isMain, isPrototypePath, lf, localDate, locate, oneLine, sameText, urlProblem } from './shared.mjs'
import { snapshotCommand } from './snapshot.mjs'

export { TILE_LINE } from './page-status.mjs'
export { CSP } from './page-form.mjs'
export { snapshot, snapshotClean } from './snapshot.mjs'
export const PROTOTYPE_LINE = 'Prototype – not for comments or sign-off'
const PAGE_KINDS = new Set(['screen', 'doc', 'index'])
const MAX_BYTES = 25 * 1024 * 1024
const MAX_BLOCKS = 500
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const TEMPLATES = fileURLToPath(new URL('../templates/', import.meta.url))
const COPIED_SHEETS = new Set(['docs.css', 'docs-tokens.css', 'fonts.css'])
const SHEET_PATH = /\.css$/i
const PROTOTYPE_CLASS = 'design-prototype'

const isGeneratedIndex = file => path.basename(file) === 'index.html' && INDEX_ROOTS.includes(path.basename(path.dirname(path.resolve(file))))

class Run {
  constructor(options) {
    this.options = options
    this.problems = []
    this.cssCache = new Map()
    this.allCss = new Map()
    this.allUsed = new Set()
    this.compared = 0
    this.notices = []
    this.root = ''
    this.sheetRoot = ''
    this.baselines = new Map()
    this.designDates = new Map()
  }

  // One problem, one line: page text in a message must not be able to start a new
  // line that reads like a checker result.
  add(file, line, rule, message) {
    const text = oneLine(`${file}:${line} [${rule}] ${message}`)
    if (!this.problems.includes(text)) this.problems.push(text)
  }

  /** Reads a stylesheet and its local imports. Returns { used, defined }. */
  readCss(file, from, line) {
    const empty = { used: [], defined: [] }
    if (!statSync(file, { throwIfNoEntry: false })?.isFile()) {
      this.add(from, line, 'links', `missing stylesheet ${file}`)
      return empty
    }
    // A link or a run of ../ must not turn the checker into a way to read other files.
    const home = realpathSync(this.sheetRoot) + path.sep
    if (!realpathSync(file).startsWith(home)) {
      this.add(from, line, 'links', `stylesheet ${file} is outside the docs folder`)
      return empty
    }
    if (this.cssCache.has(file)) return this.cssCache.get(file)
    const info = { used: [], defined: [] }
    this.cssCache.set(file, info)
    const css = readFileSync(file, 'utf8')
    this.allCss.set(file, css)
    const facts = cssFacts(css, { allowRaw: /tokens\.css$/.test(path.basename(file)) })
    for (const p of facts.problems) this.add(file, p.line, p.rule, p.message)
    info.used.push(...facts.used)
    info.defined.push(...facts.defined)
    for (const { href, line: at } of facts.imports) {
      const sub = this.readCss(path.resolve(path.dirname(file), href), file, at)
      info.used.push(...sub.used)
      info.defined.push(...sub.defined)
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
    if (!sameText(readFileSync(file, 'utf8'), readFileSync(template, 'utf8'))) this.add(path.resolve(file), 1, 'copies', `differs from the skill's templates/${base} – copy it again, unchanged`)
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
    if (built.errors.length === 0 && !sameText(built.css, css)) this.add(file, 1, 'tokens', 'differs from tokens.json – run build-tokens.mjs')
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
    if (!this.options.noDate) this.checkDates(file, text, list)
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

  /** A date cannot be in the future, and the newest cannot be older than the design. */
  checkDates(file, text, list) {
    const limit = localDate(new Date(Date.now() + ONE_DAY_MS))
    for (const node of list) {
      const date = node.attrs.get('data-updated') ?? ''
      if (date > limit) this.add(file, node.line, 'date', `the date ${echo(date)} is in the future`)
    }
    const updated = newestDate(list)
    // A generated index takes its date from its pages, so it has no change of its own.
    if (!updated || isGeneratedIndex(file)) return
    const changed = this.designDate(file, text)
    if (changed && updated < changed) this.add(file, list[0].line, 'date', `the newest date on this page, ${updated}, is older than its last change ${changed}`)
  }

  /** The last design change this run can prove, or null. A reason goes out as a notice. */
  designDate(file, text) {
    if (!this.designDates.has(file)) {
      const { date, reason } = designChange(file, text, this.referenceOf(file))
      if (reason) this.notices.push(`${file}: date not checked – ${reason}`)
      this.designDates.set(file, date)
    }
    return this.designDates.get(file)
  }

  /** The baseline if there is one, then HEAD. A file git cannot give has no reference. */
  referenceOf(file) {
    if (this.baselines.has(file)) return this.baselines.get(file)
    if (!repoTop(path.dirname(path.resolve(file)))) return null
    try {
      return textAt('HEAD', path.resolve(file))
    } catch {
      return null // a repository with no commits yet
    }
  }

  /** A page's earlier text: null means proved absent. Any other failure throws. */
  baselineOf(file) {
    const { baselineRef, baselineDir } = this.options
    if (baselineDir) {
      const old = path.join(baselineDir, path.relative(this.root, file))
      return existsSync(old) ? readFileSync(old, 'utf8') : null
    }
    return baselineRef ? textAt(baselineRef, path.resolve(file)) : null
  }

  /** Comment blocks stay byte-identical and in place, here and in prototypes. */
  checkBlocks(file, blocks, parsed) {
    const left = [...blocks]
    for (const block of commentBlocks(parsed.comments, parsed.nodes)) {
      const name = /id=(\S+)/.exec(block.raw)?.[1] ?? ''
      const at = left.findIndex(b => b.raw === block.raw)
      if (at < 0) {
        this.add(file, block.line, 'comments', `comment block ${echo(name)} was changed or removed – restore it byte for byte`)
      } else {
        if (left[at].before !== block.before) this.add(file, left[at].line, 'comments', `comment block ${echo(name)} sat before ${echo(block.before)} and now sits before ${echo(left[at].before)} – put it back`)
        left.splice(at, 1)
      }
    }
  }

  /** The earlier text of a page for this run, or null. A failure to read it is a problem. */
  loadBaseline(file) {
    if (!this.options.baselineRef && !this.options.baselineDir) return null
    let old = null
    try {
      old = this.baselineOf(file)
    } catch (error) {
      this.add(file, 1, 'baseline', `cannot read this page's baseline, so nothing protects its comments: ${error.message}`)
      return null
    }
    if (this.options.baselineRef && old !== null) old = lf(old)
    this.baselines.set(file, old)
    return old
  }

  checkBaseline(file, pageText, pageNodes, pageBlocks) {
    const old = this.baselines.get(file) ?? null
    if (old === null) return
    this.compared += 1
    // Git stores LF while a Windows copy has CRLF. A baseline folder stays byte-exact.
    const fromRef = Boolean(this.options.baselineRef) && pageText.includes('\r\n')
    const text = fromRef ? lf(pageText) : pageText
    const again = fromRef ? parseHtml(text) : null
    const nodes = again?.nodes ?? pageNodes
    const blocks = again ? commentBlocks(again.comments, again.nodes) : pageBlocks
    const parsed = parseHtml(old)
    this.checkBlocks(file, blocks, parsed)
    const { problems, notices, changedStates } = compareStatus(old, parsed.nodes, text, nodes)
    for (const p of problems) this.add(file, p.line, 'status', p.message)
    for (const n of notices) this.notices.push(`${file}: ${n}`)
    if (this.options.noDate) return
    const changed = this.designDate(file, pageText)
    for (const { id, raw, oldRaw, oldDate, tile } of changedStates) {
      const date = tile?.attrs.get('data-updated') ?? ''
      const needed = changed ?? oldDate ?? ''
      // A saved comment is not a design change, so it asks for no new date.
      if (date && date < needed && stripBlocks(raw) !== stripBlocks(oldRaw)) {
        this.add(file, tile.line, 'date', `state #${id.slice(0, 40)} changed, so its date ${date} must be updated to ${needed} or later`)
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
    const parsed = parseHtml(text)
    const { nodes, comments, errors } = parsed
    for (const e of errors) this.add(file, e.line, e.rule ?? 'markup', e.message)
    checkForm(text, parsed, (line, rule, message) => this.add(file, line, rule, message))
    this.sheetRoot = locate(file)?.docs ?? this.root

    const body = nodes.find(n => n.tag === 'body')
    const kind = pageKind(nodes)
    if (!PAGE_KINDS.has(kind)) this.add(file, body?.line ?? 1, 'page', `<body> needs data-design-page: ${[...PAGE_KINDS].join(', ')}`)
    if (kind === 'doc' && locate(file)?.name === 'designs') this.add(file, body.line, 'page', 'a page under designs/ is a screen or an index, so it follows their rules')

    const used = []
    const defined = []
    for (const node of nodes) {
      // A <style> can carry a style attribute too, so each is read in its own right.
      const inlineCss = [
        ...(node.attrs.has('style') ? [{ css: node.attrs.get('style'), baseLine: node.line, attribute: true }] : []),
        ...(node.tag === 'style' ? [{ css: node.text ?? '', baseLine: node.textLine, attribute: false }] : [])
      ]
      for (const { css, ...where } of inlineCss) {
        const facts = cssFacts(css, { ...where, inline: true })
        for (const p of facts.problems) this.add(file, p.line, p.rule, p.message)
        used.push(...facts.used)
        defined.push(...facts.defined)
      }
      if (node.tag === 'link' && relOf(node).includes('stylesheet')) {
        const href = node.attrs.get('href') ?? ''
        if (urlProblem(href)) continue // already reported by the page form
        if (!SHEET_PATH.test(href)) {
          this.add(file, node.line, 'links', `stylesheet ${echo(href)} is not a .css file`)
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

    this.loadBaseline(file)
    const statuses = this.checkStatus(file, text, nodes, kind)
    this.checkAnatomy(file, nodes, kind)
    if (kind === 'screen') this.checkStates(file, text, nodes)
    if (kind === 'screen') checkSizes(text, nodes, projectSizes(this.sheetRoot), (line, rule, message) => this.add(file, line, rule, message))

    const blocks = commentBlocks(comments, nodes)
    if (blocks.length > MAX_BLOCKS) this.add(file, 1, 'limits', `${blocks.length} comment blocks – Erfana stops at ${MAX_BLOCKS}, so split the file`)
    // Any open comment on the page blocks ready, wherever it sits: the rule is
    // about the page a person approves, not the state the comment landed on.
    if (statuses.includes('ready') && blocks.some(b => b.open)) this.add(file, 1, 'status', 'ready with open comments – resolve them in Erfana first')
    this.checkBaseline(file, text, nodes, blocks)
    return undefined
  }

  /** A stale or unsafe index, and a page folder with no index at all. */
  checkIndex(start) {
    const target = path.resolve(start)
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

  /** A prototype says so in a visible element of its own, and keeps its comments. */
  checkPrototype(file) {
    const text = readFileSync(file, 'utf8')
    const parsed = parseHtml(text)
    const line = parsed.nodes.find(n => hasClass(n, PROTOTYPE_CLASS) && [...n.attrs.keys()].join() === 'class' && (n.parent === null || n.parent.tag === 'body'))
    if (!line || stripTags(text.slice(line.start, line.end)) !== PROTOTYPE_LINE) {
      this.add(file, 1, 'prototype', `a prototype page must show "${PROTOTYPE_LINE}" in a .${PROTOTYPE_CLASS} element directly in <body>`)
    }
    if (this.loadBaseline(file) === null) return
    this.compared += 1
    this.checkBlocks(file, commentBlocks(parsed.comments, parsed.nodes), parseHtml(this.baselines.get(file)))
  }

  /** What one file means, by its place and name. */
  checkFile(file) {
    const isPrototype = isPrototypePath(file)
    if (/\.html?$/i.test(file)) {
      if (isPrototype) this.checkPrototype(file)
      else this.checkPage(file)
    } else if (COPIED_SHEETS.has(path.basename(file))) {
      this.checkCopy(file)
    } else if (path.basename(file) === 'responsive.css') {
      // Real product CSS: it may hide things and hover, but its values are still tokens.
      for (const p of cssProblems(readFileSync(file, 'utf8'))) if (p.rule !== 'no-hidden' && p.rule !== 'frames') this.add(file, p.line, p.rule, p.message)
    } else if (/\.m?js$/i.test(file) && !isPrototype) {
      this.add(file, 1, 'no-script', 'a script file is banned outside prototypes/')
    }
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
    const folder = statSync(target).isDirectory()
    if (folder) walk(target, files)
    else files.push(target)
    run.root = folder ? target : path.dirname(target)
    for (const file of files) {
      try {
        run.checkFile(file)
      } catch (error) {
        // One bad file must not hide what the others would report.
        run.add(file, 1, 'markup', `could not be checked: ${error.message}`)
      }
    }
    if (folder) run.checkIndex(target)
    else if (isGeneratedIndex(target)) {
      const problem = indexProblem(target)
      if (problem) run.add(target, 1, 'index', problem)
    }
  }
  if (options.baselineDir) checkRemoved(run, options, targets[0])
  if ((options.baselineDir || options.baselineRef) && run.compared === 0) {
    run.add(targets[0], 1, 'comments', 'no page matched the baseline, so nothing was compared – check the baseline path')
  }
  return { problems: run.problems, audit: options.audit ? auditSheets(run.allCss, run.allUsed) : [], compared: run.compared, notices: run.notices }
}

const USAGE = `usage: node check-design.mjs [--baseline-ref <ref>] [--baseline-dir <folder> with one folder target] [--no-date] [--audit] <file-or-folder>...
A baseline flag with no value, or a baseline folder or ref that does not exist, also stops here, because a run without its baseline protects no comments.`
const CLI_OPTIONS = { 'baseline-ref': { type: 'string' }, 'baseline-dir': { type: 'string' }, 'no-date': { type: 'boolean' }, audit: { type: 'boolean' } }

const isFolder = target => statSync(target, { throwIfNoEntry: false })?.isDirectory() ?? false
const folderOf = target => (isFolder(target) ? target : path.dirname(target))

/** Reads the command line. Returns { options, targets }, or null when it cannot be honoured. */
function readArguments(argv) {
  let parsed
  try {
    parsed = parseArgs({ args: argv, options: CLI_OPTIONS, allowPositionals: true })
  } catch {
    return null
  }
  const { values, positionals: targets } = parsed
  const baselineRef = values['baseline-ref']
  const baselineDir = values['baseline-dir']
  if (targets.length === 0 || !targets.every(existsSync)) return null
  if (baselineDir !== undefined && (targets.length !== 1 || !isFolder(baselineDir) || !isFolder(targets[0]))) return null
  if (baselineRef !== undefined && (baselineRef === '' || baselineRef.startsWith('-') || !targets.every(t => refExists(baselineRef, folderOf(t))))) return null
  return { options: { noDate: values['no-date'], audit: values.audit, baselineRef, baselineDir }, targets }
}

function main(argv) {
  const snapshotCode = snapshotCommand(argv)
  if (snapshotCode !== null) return snapshotCode
  const request = readArguments(argv)
  if (!request) {
    console.error(USAGE)
    return 2
  }
  const { options, targets } = request
  const { problems, audit, compared, notices } = checkPaths(targets, options)
  for (const line of problems) console.log(line)
  for (const line of audit) console.log(`audit: ${oneLine(line)}`)
  for (const line of notices) console.log(`notice: ${oneLine(line)}`)
  if (options.baselineDir || options.baselineRef) console.log(`baseline: ${compared} page(s) compared`)
  console.log(`design check: ${problems.length} problem(s)`)
  return problems.length > 0 ? 1 : 0
}

if (isMain(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2))
}
