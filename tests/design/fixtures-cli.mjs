// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// The published commands, run as a person runs them: real processes, real exit
// codes, a real git repository. A check on the library alone would pass if main()
// always returned 0. Also the date rule, line endings, paths, frames on every kind
// of page, and prototypes. run-fixtures.mjs calls runCliFixtures.

import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { snapshot } from '../../skills/design/scripts/check-design.mjs'
import { pageFacts } from '../../skills/design/scripts/page-status.mjs'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const scripts = path.join(repo, 'skills/design/scripts')
const checker = path.join(scripts, 'check-design.mjs')
const builder = path.join(scripts, 'build-index.mjs')
const tokenBuilder = path.join(scripts, 'build-tokens.mjs')
const has = (list, rule, reason = '') => list.some(p => p.includes(`[${rule}]`) && p.includes(reason))
const node = (...args) => spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const check = (...args) => node(checker, ...args)
const BIG_PAGE_BYTES = 2 * 1024 * 1024
const OLD_DATE = '2020-01-01'
const block = '<!-- erfana:comment v1 id=c-dddddddddddddddd\nstatus: open\ncomment by A at 2026-10-25T14:03:00Z:\n  Change this.\n-->'

/** A link, or a logged skip where the system refuses one, as Windows can without rights. */
export function tryLink(target, link, what) {
  try {
    symlinkSync(target, link)
    return true
  } catch (error) {
    if (error.code !== 'EPERM') throw error
    console.log(`  SKIP: ${what}: this system refused a symbolic link (EPERM)`)
    return false
  }
}

const dated = (html, date) => html.replaceAll('data-updated="2026-11-01"', `data-updated="${date}"`).replaceAll('updated 2026-11-01', `updated ${date}`)
const ready = html => html.replaceAll('data-design-status="draft"', 'data-design-status="ready" data-approved-by="A"').replaceAll('>Draft<', '>Ready for development<')

function exitCodes({ root, system, file, page, fail, write }) {
  const docs = path.dirname(system)
  const expect = (name, result, code, text = '') => {
    if (result.status !== code) fail(`${name}: expected exit ${code}, got ${result.status}: ${(result.stdout + result.stderr).slice(0, 200)}`)
    if (text && !(result.stdout + result.stderr).includes(text)) fail(`${name}: no "${text}" in the output`)
    if (result.stderr.includes('    at ')) fail(`${name}: printed a stack trace`)
  }
  expect('a clean project', check('--no-date', docs), 0, 'design check: 0 problem(s)')
  write(file, page.replace('</main>', '<script>x()</script>\n</main>'))
  expect('a broken page', check('--no-date', docs), 1, '[no-script]')
  write(file, page)
  expect('no arguments', check(), 2, 'usage:')
  expect('a target that does not exist', check(path.join(root, 'nope')), 2, 'usage:')
  expect('an unknown flag', check('--nope', docs), 2, 'usage:')
  expect('T9 baseline folder with no value, at the end', check(docs, '--baseline-dir'), 2, 'usage:')
  expect('T9 baseline ref with no value, at the end', check(docs, '--baseline-ref'), 2, 'usage:')
  expect('T9 empty baseline folder', check('--baseline-dir', '', docs), 2, 'usage:')
  expect('T9 empty baseline ref', check('--baseline-ref', '', docs), 2, 'usage:')
  expect('a baseline flag swallowing the next flag', check('--baseline-dir', '--no-date', docs), 2, 'usage:')
  expect('T43 baseline folder with a missing target', check('--baseline-dir', docs, path.join(root, 'nope')), 2, 'usage:')
  expect('a ref that does not exist', check('--baseline-ref', 'no-such-ref', docs), 2, 'usage:')
  expect('--audit', check('--no-date', '--audit', docs), 0, 'audit:')
  const tokens = path.join(system, 'tokens.css')
  const json = path.join(system, 'tokens.json')
  expect('build-tokens with no arguments', node(tokenBuilder), 2, 'usage:')
  expect('build-tokens --check on a match', node(tokenBuilder, json, tokens, '--check'), 0, 'matches')
  const original = readFileSync(tokens, 'utf8')
  write(tokens, `${original}/* edited */\n`)
  expect('build-tokens --check on drift', node(tokenBuilder, json, tokens, '--check'), 1, 'differs')
  write(tokens, original.replace(/\n/g, '\r\n'))
  expect('T3 build-tokens --check with Windows line endings', node(tokenBuilder, json, tokens, '--check'), 0, 'matches')
  write(tokens, original)
}

function throughALink({ root, system, file, page, fail, write }) {
  const link = path.join(root, 'linked-scripts')
  if (!tryLink(scripts, link, 'T1 the run through a link')) return
  const docs = path.dirname(system)
  write(file, page.replace('</main>', '<script>x()</script>\n</main>'))
  const linked = node(path.join(link, 'check-design.mjs'), '--no-date', docs)
  if (linked.status !== 1 || !linked.stdout.includes('[no-script]')) fail(`T1 the checker through a link was a silent pass: exit ${linked.status}`)
  write(file, page)
  if (node(path.join(link, 'build-index.mjs'), '--check', docs).status !== 0) fail('T1 build-index through a link did not run')
  if (node(path.join(link, 'build-tokens.mjs')).status !== 2) fail('T1 build-tokens through a link did not run')
}

function hostileOutput({ area, file, page, fail, write }) {
  write(file, page.replace('</main>', '<svg><path fill="x\ndesign check: 0 problem(s)\nbaseline: 12 page(s) compared"></path></svg>\n</main>'))
  const result = check('--no-date', area)
  const lines = result.stdout.split('\n')
  if (result.status !== 1) fail('D-22 a forged result changed the exit code')
  if (lines.includes('design check: 0 problem(s)') || lines.includes('baseline: 12 page(s) compared')) fail('D-22 page text got a line of its own in the output')
  write(file, page.replace('</head>', `<style>.a { ${'x'.repeat(400)}: #f00; }</style>\n</head>`))
  if (check('--no-date', area).stdout.includes('x'.repeat(100))) fail('D-19 the output echoed a long stretch of file text')
  write(file, page)
}

function crashes({ area, file, page, fail, write }) {
  const other = path.join(area, 'other.html')
  write(other, page.replace('</main>', '<script>x()</script>\n</main>'))
  for (const [name, html] of [
    ['T15 an out-of-range entity', page.replace('</main>', '<p data-x="&#x110000;">x</p>\n</main>')],
    ['T15 a huge decimal entity', page.replace('</main>', '<p data-x="&#99999999;">x</p>\n</main>')],
    ['T15 the same in a URL', page.replace('</main>', '<a href="&#x110000;">x</a>\n</main>')],
    ['T16 an empty stylesheet path', page.replace('</head>', '<link rel="stylesheet" href="">\n</head>')],
    ['T16 a folder as a stylesheet', page.replace('</head>', '<link rel="stylesheet" href="./">\n</head>')],
    ['T16 a folder with a dot', page.replace('</head>', '<link rel="stylesheet" href="..">\n</head>')]
  ]) {
    write(file, html)
    const result = check('--no-date', area)
    if (result.status !== 1 || result.stderr.includes('    at ') || !result.stdout.includes('[no-script]')) fail(`${name}: one page stopped the run: exit ${result.status}, ${result.stderr.slice(0, 120)}`)
  }
  rmSync(other)
  write(file, page)
}

function datesAndComments({ root, file, page, fail, write, checkPaths }) {
  const area = path.dirname(file)
  const copy = path.join(root, 'baseline-comment')
  const old = dated(page, OLD_DATE)
  write(path.join(copy, 'payment.html'), old)
  write(file, old.replace('<h1>', `${block}\n<h1>`))
  if (has(checkPaths([area], { baselineDir: copy }).problems, 'date')) fail('O4 a saved comment failed the page date')
  rmSync(copy, { recursive: true })
  write(file, `${old.replace('<h1>', `${block}\n<h1>`)}`)
  const alone = checkPaths([area])
  if (has(alone.problems, 'date')) fail('O4 a comment on a page with no earlier copy failed the date')
  if (!alone.notices.some(n => n.includes('date not checked'))) fail('a skipped date test must say so')
  for (const [name, date, rule] of [
    ['D-37 a far-future date', '2999-12-31', 'date'],
    ['T37 an impossible date', '2026-13-45', 'tile'],
    ['T37 the last day of a short month', '2026-02-30', 'tile']
  ]) {
    write(file, dated(page, date))
    if (!has(checkPaths([area]).problems, rule)) fail(`${name} was not caught by [${rule}]`)
  }
  write(file, page)
}

function commentStatus({ area, file, page, fail, write, checkPaths }) {
  const problems = () => checkPaths([area], { noDate: true }).problems
  const resolved = '<!-- erfana:comment v1 id=c-e\nstatus: resolved by A at 2026-10-27T08:00:00Z\ncomment by B at 2026-10-25T14:03:00Z:\n  status: open\n-->'
  write(file, ready(page).replace('<h1>', `${resolved}\n<h1>`))
  if (has(problems(), 'status', 'ready with open')) fail('D-38 a line typed into a resolved comment blocked ready')
  write(file, ready(page).replace('<h1>', `${block}\n<h1>`))
  if (!has(problems(), 'status', 'ready with open')) fail('D-38 an open header did not block ready')
  write(file, ready(page).replace('<h1>', '<!-- erfana:comment v1 id=c-f\ncomment by B at 2026-10-25T14:03:00Z:\n  x\n-->\n<h1>'))
  if (!has(problems(), 'status', 'ready with open')) fail('T21 a block with no status header must count as open')
  // T34: a > in a comment on a heading must not reach the index.
  const title = pageFacts(page.replace('<h1>Payment</h1>', '<h1><!-- erfana:comment v1 id=c-a\nstatus: open\ncomment by A at x:\n  a > b\n--><span>Pay</span></h1>')).title
  if (title !== 'Pay') fail(`T34 comment text leaked into a title: ${title}`)
  write(file, page)
}

function lineEndings({ root, system, file, page, fail, write }) {
  const docs = path.dirname(system)
  const copy = path.join(root, 'crlf')
  cpSync(docs, path.join(copy, 'docs'), { recursive: true })
  const copied = path.join(copy, 'docs')
  const crlf = target => {
    for (const name of readdirSync(target, { recursive: true }).map(f => path.join(target, String(f)))) {
      if (statSync(name).isFile() && /\.(?:html|css|json)$/.test(name)) writeFileSync(name, readFileSync(name, 'utf8').replace(/\n/g, '\r\n'))
    }
  }
  crlf(copied)
  const result = check('--no-date', copied)
  if (result.status !== 0) fail(`T3 a Windows checkout failed: ${result.stdout.slice(0, 300)}`)
  if (node(builder, '--check', copied).status !== 0) fail('T3 a Windows index read as stale')
  const index = path.join(copied, 'designs/index.html')
  const page2 = path.join(copied, 'designs/checkout/payment.html')
  writeFileSync(page2, readFileSync(page2, 'utf8').replace('Payment</h1>', 'Pay now</h1>'))
  node(builder, copied)
  const built = readFileSync(index, 'utf8')
  if (/[^\r]\n/.test(built)) fail('T3 a rebuild mixed line endings')
  rmSync(copy, { recursive: true })
  write(file, page)
}

function git(cwd, ...args) {
  return execFileSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], env: { ...process.env, GIT_AUTHOR_DATE: '2030-01-01T12:00:00', GIT_COMMITTER_DATE: '2030-01-01T12:00:00' } })
}

function gitRepository({ root, system, page, fail, write }) {
  const project = path.join(root, 'git-project')
  cpSync(path.dirname(system), path.join(project, 'docs'), { recursive: true })
  const docs = path.join(project, 'docs')
  const area = path.join(docs, 'designs/checkout')
  const target = path.join(area, 'payment.html')
  const old = dated(page, OLD_DATE)
  write(target, old)
  git(project, 'init', '--quiet')
  git(project, 'add', '.')
  git(project, 'commit', '--quiet', '-m', 'pages')
  const pageProblems = (...args) => check(...args, area).stdout
  if (pageProblems().includes('[date]')) fail(`T4 a commit after the page date failed it: ${pageProblems().slice(0, 200)}`)
  write(target, old.replace('<h1>', `${block}\n<h1>`))
  if (pageProblems().includes('[date]')) fail('O4 a saved comment failed the date in git')
  write(target, old.replace('how a user gets here', 'how people get here'))
  if (!pageProblems().includes('[date]')) fail('the date rule no longer catches a real design change in git')
  write(target, old)

  // Ready work stays approved through a later commit.
  write(target, ready(old))
  git(project, 'add', '.')
  git(project, 'commit', '--quiet', '-m', 'ready')
  if (pageProblems().includes('[date]')) fail('O5 a later commit failed a ready page')

  // T2: a page over git's default buffer is compared, not treated as new.
  const big = page.replace('<h1>', `${block}\n<h1>`).replace('</main>', `<p>${'x'.repeat(BIG_PAGE_BYTES)}</p>\n</main>`)
  write(target, big)
  git(project, 'add', '.')
  git(project, 'commit', '--quiet', '-m', 'big')
  write(target, big.replace(`${block}\n`, ''))
  const lost = check('--no-date', '--baseline-ref', 'HEAD', area)
  if (lost.status !== 1 || !lost.stdout.includes('was changed or removed')) fail(`T2 a deleted comment on a large page was not caught: exit ${lost.status}`)

  // T2: a page git cannot read is not a new page. The run must fail, not skip it.
  const blob = git(project, 'rev-parse', 'HEAD:docs/designs/checkout/payment.html').trim()
  const stored = path.join(project, '.git/objects', blob.slice(0, 2), blob.slice(2))
  const bytes = readFileSync(stored)
  rmSync(stored, { force: true })
  const unread = check('--no-date', '--baseline-ref', 'HEAD', area)
  if (unread.status !== 1 || !unread.stdout.includes('[baseline]')) fail(`T2 a failed git read was treated as a new page: exit ${unread.status}`)
  writeFileSync(stored, bytes)

  // T10: git stores LF and a Windows copy has CRLF.
  write(target, old.replace('<h1>', `${block}\n<h1>`))
  git(project, 'add', '.')
  git(project, 'commit', '--quiet', '-m', 'lf')
  write(target, old.replace('<h1>', `${block}\n<h1>`).replace(/\n/g, '\r\n'))
  const windows = check('--no-date', '--baseline-ref', 'HEAD', area)
  if (windows.stdout.includes('[comments]')) fail(`T10 line endings alone failed the comments: ${windows.stdout.slice(0, 200)}`)
  write(target, old)

  // A page new since the ref has nothing to compare, and that is not a failure.
  write(target, old.replace('<h1>', `${block}\n<h1>`))
  write(path.join(area, 'new.html'), old)
  const added = check('--no-date', '--baseline-ref', 'HEAD', area)
  if (added.status !== 0 || !added.stdout.includes('baseline: 1 page(s) compared')) fail(`a new page failed the baseline: ${added.stdout.slice(0, 200)}`)
  rmSync(path.join(area, 'new.html'))
  plantedRepository({ project, area, fail, write })
}

/** D-21: a bare repository committed into a page folder must not run its config. */
function plantedRepository({ project, area, fail, write }) {
  const marker = path.join(project, 'ran')
  mkdirSync(path.join(area, 'objects'), { recursive: true })
  mkdirSync(path.join(area, 'refs'), { recursive: true })
  write(path.join(area, 'HEAD'), 'ref: refs/heads/main\n')
  write(path.join(area, 'config'), `[core]\n  bare = false\n  worktree = .\n  fsmonitor = ./x.sh\n`)
  writeFileSync(path.join(area, 'x.sh'), `#!/bin/sh\ntouch "${marker}"\n`, { mode: 0o755 })
  check(area)
  if (existsSync(marker)) fail('D-21 a config in a page folder ran a program')
}

function pathsAndPrototypes({ root, page, fail, write, checkPaths }) {
  // T6, D-23: a folder named prototypes above the project exempts nothing.
  const outer = path.join(root, 'prototypes/acme/docs/designs/area')
  const line = '<p class="design-prototype">Prototype – not for comments or sign-off</p>'
  write(path.join(outer, 'page.html'), `${line}<script>x()</script>`)
  if (checkPaths([outer], { noDate: true }).problems.every(p => !p.includes('[csp]') && !p.includes('[page]'))) fail('T6 a parent folder named prototypes exempted a page')

  const area = path.join(root, 'proto/docs/designs/area')
  const target = path.join(area, 'prototypes/flow.html')
  const problems = html => {
    write(target, html)
    return checkPaths([path.join(root, 'proto/docs/designs/area')], { noDate: true }).problems
  }
  if (problems(`${line}<script>x()</script>`).length > 0) fail('a real prototype must pass')
  for (const [name, html] of [
    ['O36 the line only in a comment', '<!-- Prototype – not for comments or sign-off --><p>x</p>'],
    ['O36 the line only in the title', '<title>Prototype – not for comments or sign-off</title><p>x</p>'],
    ['O36 the line with no class', '<p>Prototype – not for comments or sign-off</p>'],
    ['O36 the line nested in another element', `<div>${line}</div>`],
    ['O36 the line on an element that can hide', '<p class="design-prototype" hidden>Prototype – not for comments or sign-off</p>'],
    ['O36 other words in the class', '<p class="design-prototype">Prototype</p>']
  ]) {
    if (!has(problems(html), 'prototype')) fail(`${name} passed`)
  }
  rmSync(target)
  // Only <area>/prototypes/ is exempt: docs/prototypes and deeper folders are not.
  for (const place of ['proto/docs/prototypes/page.html', 'proto/docs/designs/prototypes/page.html', 'proto/docs/designs/area/prototypes/deep/page.html']) {
    write(path.join(root, place), `${line}<script>x()</script>`)
    if (!has(checkPaths([path.join(root, place)], { noDate: true }).problems, 'no-script')) fail(`T6 ${place} was exempt`)
    rmSync(path.join(root, place))
  }
  const copy = path.join(root, 'proto-baseline/prototypes')
  write(path.join(copy, 'flow.html'), `${block}\n${line}`)
  write(target, line)
  if (!has(checkPaths([area], { noDate: true, baselineDir: path.dirname(copy) }).problems, 'comments')) fail('D-23 a comment removed from a prototype was not caught')
}

function framesOnEveryKind({ system, page, fail, write, checkPaths }) {
  const target = path.join(system, 'system/components/button/index.html')
  const original = readFileSync(target, 'utf8')
  const frame = '<div class="design-frame" aria-hidden="true">'
  if (!original.includes(frame)) throw new Error('mutation target not found: doc page frame')
  const problems = html => {
    write(target, html)
    return checkPaths([path.join(system, 'system')], { noDate: true }).problems
  }
  for (const [name, inner, rule] of [
    ['a working link', '<a href="next.html">x</a>', 'no-fake-controls'],
    ['a control with no tabindex', '<button type="button">x</button>', 'no-fake-controls'],
    ['an input that takes typing', '<input type="text" tabindex="-1">', 'no-fake-controls'],
    ['a textarea that takes typing', '<textarea tabindex="-1"></textarea>', 'no-fake-controls'],
    ['a select', '<select tabindex="-1"><option>x</option></select>', 'no-fake-controls'],
    ['a checkbox', '<input type="checkbox" tabindex="-1" readonly>', 'no-fake-controls'],
    ['a radio', '<input type="radio" tabindex="-1" readonly>', 'no-fake-controls'],
    ['a details', '<details open>x</details>', 'no-fake-controls'],
    ['a label for', '<label for="x">x</label>', 'no-fake-controls'],
    ['a focusable div', '<div tabindex="0">x</div>', 'no-fake-controls'],
    ['pointer-events: none', '<p style="pointer-events: none">x</p>', 'no-hidden'],
    ['inert', '<p inert>x</p>', 'no-hidden']
  ]) {
    if (!has(problems(original.replace(frame, `${frame}\n${inner}`)), rule)) fail(`doc page: ${name} in a frame was not caught by [${rule}]`)
  }
  if (!has(problems(original.replace(frame, '<div class="design-frame">')), 'states', 'aria-hidden')) fail('T28 a doc page frame needs aria-hidden')
  write(target, original)
  const area = path.dirname(path.join(path.dirname(system), 'designs/checkout/x'))
  const screen = path.join(area, 'payment.html')
  write(screen, page.replace('data-design-page="screen"', 'data-design-page="doc"'))
  if (!has(checkPaths([area], { noDate: true }).problems, 'page', 'under designs/')) fail('D-24 a doc page in designs/ dropped the screen rules')
  write(screen, page)
}

function outsideStylesheet({ root, system, page, fail, write, checkPaths }) {
  // D-19: a link cannot reach a real file outside docs/ either.
  const outside = path.join(root, 'secret.css')
  write(outside, '.a { color: var(--color-text); }\n')
  const area = path.join(path.dirname(system), 'designs/checkout')
  const file = path.join(area, 'payment.html')
  write(file, page.replace('</head>', '<link rel="stylesheet" href="../../../secret.css">\n</head>'))
  if (!has(checkPaths([area], { noDate: true }).problems, 'links', 'outside the docs folder')) fail('D-19 a stylesheet outside docs/ was read')
  const link = path.join(area, 'linked.css')
  if (tryLink(outside, link, 'D-19 a link to a stylesheet outside docs/')) {
    write(file, page.replace('</head>', '<link rel="stylesheet" href="linked.css">\n</head>'))
    if (!has(checkPaths([area], { noDate: true }).problems, 'links', 'outside the docs folder')) fail('D-19 a linked stylesheet outside docs/ was read')
    rmSync(link)
  }
  rmSync(outside)
  write(file, page)
}

function snapshotLinks({ root, fail, write }) {
  // D-20: the destination is checked, not only the source.
  const project = path.join(root, 'snapshot-links')
  write(path.join(project, 'docs/page.html'), 'x')
  const precious = path.join(root, 'precious.txt')
  write(precious, 'keep\n')
  mkdirSync(path.join(project, '.local/design-snapshots'), { recursive: true })
  if (tryLink(precious, path.join(project, '.local/design-snapshots/.gitignore'), 'D-20 a planted .gitignore link')) {
    if (snapshot(path.join(project, 'docs'), project) !== null) fail('D-20 snapshot wrote through a planted .gitignore')
    if (readFileSync(precious, 'utf8') !== 'keep\n') fail('D-20 snapshot overwrote the file behind a link')
  }
  const moved = path.join(root, 'snapshot-moved')
  write(path.join(moved, 'docs/page.html'), 'x')
  const away = path.join(root, 'snapshot-away')
  mkdirSync(away)
  if (tryLink(away, path.join(moved, '.local'), 'D-20 a planted .local link')) {
    if (snapshot(path.join(moved, 'docs'), moved) !== null) fail('D-20 snapshot followed a .local link out of the project')
    if (readdirSync(away).length > 0) fail('D-20 client comments left the project')
  }
}

function generatedIndexDate({ system, fail, write, checkPaths }) {
  // T11: a generated index has no change of its own, so the checker cannot demand one.
  const docs = path.dirname(system)
  const index = path.join(docs, 'designs/index.html')
  const original = readFileSync(index, 'utf8')
  write(index, original.replace(/data-updated="\d{4}-\d{2}-\d{2}"/, `data-updated="${OLD_DATE}"`).replace(/updated \d{4}-\d{2}-\d{2}/, `updated ${OLD_DATE}`))
  if (has(checkPaths([docs]).problems.filter(p => p.includes('designs/index.html') || p.includes('designs\\index.html')), 'date')) fail('T11 a generated index failed the date with no legal fix')
  write(index, original)
}

export async function runCliFixtures(context) {
  const { system, page, file } = context
  context.write(file, page)
  node(builder, path.dirname(system))
  exitCodes(context)
  throughALink(context)
  hostileOutput(context)
  crashes(context)
  datesAndComments(context)
  commentStatus(context)
  lineEndings(context)
  gitRepository(context)
  pathsAndPrototypes(context)
  framesOnEveryKind(context)
  outsideStylesheet(context)
  snapshotLinks(context)
  generatedIndexDate(context)
}
