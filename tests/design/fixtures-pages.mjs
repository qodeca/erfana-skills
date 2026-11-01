// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// Fixtures for the parts of a page that changed shape: every template, the
// per-state status, the date rule, the generated indexes, and the copied sheets. run-fixtures.mjs
// builds the temporary project and calls runPageFixtures.

import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, statSync, utimesSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const builder = path.join(repo, 'skills/design/scripts/build-index.mjs')
const has = (list, rule, reason = '') => list.some(p => p.includes(`[${rule}]`) && p.includes(reason))
const today = () => {
  const t = new Date()
  return [t.getFullYear(), String(t.getMonth() + 1).padStart(2, '0'), String(t.getDate()).padStart(2, '0')].join('-')
}
const setReady = html => html.replace('data-design-status="draft"', 'data-design-status="ready" data-approved-by="A"').replace('>Draft<', '>Ready for development<')
const dateStates = (html, first, second) => html
  .replace('data-updated="2026-11-01"', `data-updated="${first}"`).replace('updated 2026-11-01', `updated ${first}`)
  .replace('data-updated="2026-11-01"', `data-updated="${second}"`).replace('updated 2026-11-01', `updated ${second}`)

function placeTemplates({ system, templates, write }) {
  const docs = path.dirname(system)
  const pages = [
    ['foundation-page.html', 'system/foundations/spacing.html'],
    ['component-page.html', 'system/components/button/index.html'],
    ['pattern-page.html', 'system/patterns/states/index.html'],
    ['system-index.html', 'index.html']
  ]
  for (const [from, to] of pages) copyFileSync(path.join(templates, from), ensure(write, path.join(system, to)))
  write(path.join(system, 'system/patterns/states/states.css'), '.state { color: var(--color-text); }\n')
  copyFileSync(path.join(templates, 'designs-index.html'), path.join(docs, 'designs/index.html'))
}

const ensure = (write, target) => {
  write(target, '')
  return target
}

function statusFixtures({ area, file, page, fail, write, checkPaths, open, before, root }) {
  const baseline = path.join(root, 'baseline-status')
  const options = { noDate: true, baselineDir: baseline }
  const check = (extra = {}) => checkPaths([area], { ...options, ...extra })
  const ready = setReady(page)
  write(path.join(baseline, 'payment.html'), ready)

  write(file, ready.replace('hover</strong>', 'pressed</strong>'))
  if (check().problems.length > 0) fail(`a change to another state must not touch a ready state: ${check().problems.join(' | ')}`)
  write(file, ready.replace('how a user gets here', 'how people get here'))
  if (!has(check().problems, 'status', 'state #default was ready and changed')) fail('a changed ready state was not caught')
  write(file, ready.replace('how a user gets here', 'how people get here').replace('data-design-status="ready" data-approved-by="A"', 'data-design-status="in-review"').replace('>Ready for development<', '>In review<'))
  if (check().problems.length > 0) fail(`a changed state set back to in-review must pass: ${check().problems.join(' | ')}`)

  write(path.join(baseline, 'payment.html'), page)
  write(file, ready)
  if (!check().notices.some(n => n.includes('state #default: ready newly set'))) fail('a newly ready state raised no notice')

  // An older page kept its status in one tile: a ready page still drops as a whole.
  const legacy = page.replace('<main>', '<header class="design-tile" data-design-status="ready" data-approved-by="A" data-updated="2026-11-01">Ready for development 2026-11-01 Design, not a working product</header>\n<main>')
  write(path.join(baseline, 'payment.html'), legacy)
  write(file, ready)
  if (!has(check().problems, 'status', 'a ready page changed')) fail('a ready older page that changed was not caught')

  // Strict on purpose: an open comment anywhere on the page blocks ready.
  write(file, before(ready, '<figure class="ds-frame design-state" id="hover">', open))
  if (!has(checkPaths([area], { noDate: true }).problems, 'status', 'ready with open comments')) fail('an open comment on another state did not block ready')
  rmSync(baseline, { recursive: true })
}

function dateFixtures({ area, file, page, fail, write, checkPaths, root }) {
  const check = (extra = {}) => checkPaths([area], extra).problems
  const now = today()
  write(file, dateStates(page, '2020-01-01', '2020-02-01'))
  if (!has(check(), 'date', 'the newest date on this page, 2020-02-01')) fail('a page whose newest date is stale was not caught')
  if (has(check({ noDate: true }), 'date')) fail('--no-date must skip the date rule')

  write(file, dateStates(page, '2020-01-01', now))
  if (has(check(), 'date')) fail(`one current date is enough for the page: ${check().join(' | ')}`)

  const baseline = path.join(root, 'baseline-date')
  write(path.join(baseline, 'payment.html'), dateStates(page, '2020-01-01', now))
  const withBaseline = { baselineDir: baseline }
  write(file, dateStates(page, '2020-01-01', now).replace('how a user gets here', 'how people get here'))
  if (!has(check(withBaseline), 'date', 'state #default changed')) fail('a changed state that kept its old date was not caught')
  write(file, dateStates(page, now, now).replace('how a user gets here', 'how people get here'))
  if (has(check(withBaseline), 'date')) fail('a changed state with a new date must pass')

  const comment = '<!-- erfana:comment v1 id=c-cccccccccccccccc\nstatus: resolved by A at 2026-10-27T08:00:00Z\n-->\n'
  write(file, dateStates(page, '2020-01-01', now).replace('<button class="button" type="button"', `${comment}<button class="button" type="button"`))
  if (has(check(withBaseline), 'date')) fail('a saved comment must not ask for a new state date')
  rmSync(baseline, { recursive: true })

  // Older files: the date compares with the file time outside git.
  write(file, dateStates(page, '2020-01-01', '2020-02-01'))
  utimesSync(file, new Date('2020-01-15T12:00:00'), new Date('2020-01-15T12:00:00'))
  if (has(check(), 'date')) fail('a date newer than the file time must pass')
}

function indexFixtures({ system, file, page, fail, write, checkPaths, open }) {
  const docs = path.dirname(system)
  const systemIndex = path.join(system, 'index.html')
  const designsIndex = path.join(docs, 'designs/index.html')
  const cli = (...args) => spawnSync(process.execPath, [builder, ...args], { encoding: 'utf8' })
  const problems = () => checkPaths([docs], { noDate: true }).problems
  write(file, page)
  write(path.join(path.dirname(file), 'README.md'), '# Checkout\n')

  const before = readFileSync(designsIndex, 'utf8')
  if (cli('--check', docs).status === 0) fail('an unbuilt index passed --check')
  if (!has(problems(), 'index', 'is stale')) fail('the checker did not call an unbuilt index stale')
  execFileSync(process.execPath, [builder, docs], { encoding: 'utf8' })
  const built = readFileSync(designsIndex, 'utf8')
  if (cli('--check', docs).status !== 0) fail(`a built index failed --check: ${cli('--check', docs).stderr}`)
  if (problems().length > 0) fail(`a built project should pass:\n  ${problems().join('\n  ')}`)
  const outside = html => html.replace(/(<!-- design:generated (\S+) start -->)[\s\S]*?(<!-- design:generated \2 end -->)/g, '$1$3')
  if (outside(built).replace(/\n/g, '') !== outside(before).replace(/\n/g, '')) fail('the builder changed text outside its markers')
  execFileSync(process.execPath, [builder, docs], { encoding: 'utf8' })
  if (readFileSync(designsIndex, 'utf8') !== built) fail('a second build changed the file')

  const systemHtml = readFileSync(systemIndex, 'utf8')
  for (const part of ['class="ix-card"', 'href="system/components/button/index.html"', 'class="ix-summary"', '<span class="ix-count">1</span>']) {
    if (!systemHtml.includes(part)) fail(`the system index lacks ${part}`)
  }
  for (const part of ['<h2 id="checkout">checkout</h2>', '<th>Screen</th><th>What it shows</th><th>Status</th><th>Updated</th>', 'href="checkout/payment.html"', 'Design notes', 'href="checkout/README.md"']) {
    if (!built.includes(part)) fail(`the designs index lacks ${part}`)
  }

  // An area's journey page is its overview, not one of its screens.
  const journey = path.join(path.dirname(file), 'index.html')
  write(journey, `${page.slice(0, page.indexOf('<body'))}<body data-design-page="index">\n<main>\n<h1>Checkout journey</h1>\n<p class="ds-meta" data-design-status="draft" data-updated="2026-11-01"><span class="ds-status">Draft</span> updated 2026-11-01 · Design, not a working product</p>\n</main>\n</body>\n</html>\n`)
  execFileSync(process.execPath, [builder, docs], { encoding: 'utf8' })
  const withJourney = readFileSync(designsIndex, 'utf8')
  if (!withJourney.includes('Overview: <a href="checkout/index.html">Checkout journey</a>')) fail('an area index is not listed as the overview')
  if (withJourney.includes('<td><a href="checkout/index.html">')) fail('an area index is listed as a screen')
  if (!withJourney.includes('<td><a href="checkout/payment.html">')) fail('a screen beside an area index lost its row')
  if (problems().length > 0) fail(`an area index should pass:\n  ${problems().join('\n  ')}`)
  rmSync(journey)
  execFileSync(process.execPath, [builder, docs], { encoding: 'utf8' })

  // A page that changes makes the index stale, for the checker and for --check.
  write(file, page.replace('Payment</h1>', 'Pay now</h1>'))
  if (!has(problems(), 'index', 'is stale')) fail('a stale index was not caught')
  if (cli('--check', docs).status === 0) fail('--check passed a stale index')
  write(file, page)

  // A page's own words cannot put markup into the index.
  write(file, page.replace('What this screen shows, in one line, for the designs index', 'A &lt;b&gt; tag &amp; a &quot;quote and a raw > sign'))
  execFileSync(process.execPath, [builder, docs], { encoding: 'utf8' })
  if (!readFileSync(designsIndex, 'utf8').includes('A &lt;b&gt; tag &amp; a &quot;quote and a raw &gt; sign')) fail('a description was not escaped once')
  write(file, page)
  execFileSync(process.execPath, [builder, docs], { encoding: 'utf8' })

  // An index never reads ready, whatever its pages say.
  write(file, page.replaceAll('data-design-status="draft"', 'data-design-status="ready" data-approved-by="A"').replaceAll('>Draft<', '>Ready for development<'))
  execFileSync(process.execPath, [builder, docs], { encoding: 'utf8' })
  if (!/class="ds-meta" data-design-status="in-review"/.test(readFileSync(designsIndex, 'utf8'))) fail('an index of ready pages must read in-review')
  write(file, page)
  execFileSync(process.execPath, [builder, docs], { encoding: 'utf8' })

  // A comment block inside a region stops the build, and nothing is written.
  const clean = readFileSync(designsIndex, 'utf8')
  const inside = clean.replace('<h2 id="checkout">', `${open}\n<h2 id="checkout">`)
  write(designsIndex, inside)
  const refused = cli(docs)
  if (refused.status === 0 || !refused.stderr.includes(designsIndex) || !refused.stderr.includes('a comment block sits inside the generated region "list"')) fail(`a comment in a region was not refused: ${refused.stderr}`)
  if (readFileSync(designsIndex, 'utf8') !== inside) fail('a refused build changed the file')
  if (!has(problems(), 'index', 'a comment block sits inside')) fail('the checker missed a comment in a region')

  // A block outside the regions is safe, and a rebuild keeps it byte for byte.
  const beside = clean.replace('<h1>', `${open}\n<h1>`)
  write(designsIndex, beside.replace('Payment<', 'Old name<'))
  execFileSync(process.execPath, [builder, docs], { encoding: 'utf8' })
  if (!readFileSync(designsIndex, 'utf8').includes(`${open}\n<h1>`)) fail('a rebuild lost or moved a comment outside the regions')
  write(designsIndex, clean)

  // Markers are the contract: without them the builder and the checker refuse.
  const noMarkers = clean.replace('<!-- design:generated list end -->', '')
  write(designsIndex, noMarkers)
  const missing = cli(docs)
  if (missing.status === 0 || !missing.stderr.includes(designsIndex)) fail('missing markers were not refused')
  if (!has(problems(), 'index', 'generated markers')) fail('the checker missed missing markers')
  write(designsIndex, clean)

  // A page folder with no index, and a page in the wrong place.
  rmSync(designsIndex)
  if (!has(problems(), 'index', 'no index.html')) fail('a missing index was not caught')
  write(designsIndex, clean)
  const stray = path.join(system, 'components/old.html')
  write(stray, readFileSync(path.join(system, 'system/foundations/spacing.html'), 'utf8'))
  if (!has(problems(), 'index', 'outside system/foundations')) fail('a page outside system/ was not caught')
  rmSync(path.join(system, 'components'), { recursive: true })
  rmSync(path.join(path.dirname(file), 'README.md'))
}

function tableFixtures({ system, fail, write, checkPaths, open }) {
  const docs = path.dirname(system)
  const index = path.join(system, 'index.html')
  const buttonPage = path.join(system, 'system/components/button/index.html')
  const spacingPage = path.join(system, 'system/foundations/spacing.html')
  const button = readFileSync(buttonPage, 'utf8')
  const spacing = readFileSync(spacingPage, 'utf8')
  const build = () => execFileSync(process.execPath, [builder, docs], { encoding: 'utf8' })
  const row = (html, text) => html.split('\n').find(line => line.includes(text)) ?? ''
  build()
  const clean = readFileSync(index, 'utf8')
  for (const part of ['<h2 id="start-here">Start here by task</h2>', '<td>Add a button</td><td><a href="system/components/button/index.html">Buttons</a></td>', '<h2 id="token-owners">Which card owns this token</h2>', '<th>Family</th><th>Tokens</th><th>Owner</th>']) {
    if (!clean.includes(part)) fail(`the system index lacks ${part}`)
  }

  // A shared task keeps one row, in any case. An entity's ; does not end a task.
  write(spacingPage, spacing.replace('content="Choose a padding or gap"', 'content="ADD A BUTTON; Space Q&amp;A rows; ; Space Q&amp;A rows"'))
  // A foundation owns a family a component only uses, even when it lists less.
  write(buttonPage, button.replace('<code>--button-bg</code>', '<code>--spacing-sm</code>, <code>--spacing-md</code>'))
  build()
  const shared = readFileSync(index, 'utf8')
  const task = row(shared, '<td>Add a button</td>')
  if (!task.includes('Buttons') || !task.includes('Spacing')) fail(`a shared task did not share its row: ${task}`)
  if (shared.split('<td>Space Q&amp;A rows</td>').length !== 2) fail('a task with an entity did not stay whole, once')
  if (!row(shared, '<code>--spacing-*</code>').includes('system/foundations/spacing.html')) fail('a foundation did not outrank a component as owner')

  // A wildcard claims the family from a page that lists more names, and reads as all.
  write(spacingPage, spacing)
  write(path.join(system, 'system/patterns/states/index.html'), readFileSync(path.join(system, 'system/patterns/states/index.html'), 'utf8').replace('<code>--color-surface</code>', '<code>--spacing-*</code>'))
  build()
  const wild = row(readFileSync(index, 'utf8'), '<code>--spacing-*</code>')
  if (!wild.includes('system/patterns/states/index.html') || !wild.includes('>all<')) fail(`a wildcard did not claim its family: ${wild}`)
  write(path.join(system, 'system/patterns/states/index.html'), readFileSync(path.join(system, 'system/patterns/states/index.html'), 'utf8').replace('<code>--spacing-*</code>', '<code>--color-surface</code>'))

  // With no tasks and no token tables, both tables say so.
  write(buttonPage, button.replace(/<meta name="design-tasks"[^>]*>\n/, '').replace('class="ds-tokens"', 'class="other"'))
  write(spacingPage, spacing.replace(/<meta name="design-tasks"[^>]*>\n/, '').replace('class="ds-tokens"', 'class="other"'))
  const states = path.join(system, 'system/patterns/states/index.html')
  const pattern = readFileSync(states, 'utf8')
  write(states, pattern.replace(/<meta name="design-tasks"[^>]*>\n/, '').replace('class="ds-tokens"', 'class="other"'))
  build()
  const empty = readFileSync(index, 'utf8')
  if (!empty.includes('No page declares a task yet') || !empty.includes('No page has a <code>#tokens</code> table yet')) fail('the empty tables do not say so')
  write(buttonPage, button)
  write(spacingPage, spacing)
  write(states, pattern)
  build()
  if (readFileSync(index, 'utf8') !== clean) fail('the system index did not return to its first build')

  // The tables sit in a generated region, so a comment there stops the build.
  const inside = clean.replace('<h2 id="start-here">', `${open}\n<h2 id="start-here">`)
  write(index, inside)
  const refused = spawnSync(process.execPath, [builder, docs], { encoding: 'utf8' })
  if (refused.status === 0 || !refused.stderr.includes('a comment block sits inside the generated region "list"')) fail(`a comment in the task table was not refused: ${refused.stderr}`)
  if (readFileSync(index, 'utf8') !== inside) fail('a refused build changed the system index')
  if (!has(checkPaths([system], { noDate: true }).problems, 'index', 'a comment block sits inside')) fail('the checker missed a comment in the task table')
  write(index, clean)
}

function copyFixtures({ system, area, fail, write, checkPaths }) {
  const problems = target => checkPaths([target], { noDate: true }).problems
  for (const name of ['docs.css', 'docs-tokens.css', 'fonts.css']) {
    const copy = path.join(system, name)
    const original = readFileSync(copy, 'utf8')
    write(copy, `${original}/* an older copy */\n`)
    if (!has(problems(system), 'copies', `templates/${name}`)) fail(`a changed ${name} was not caught in its folder`)
    if (!has(problems(area), 'copies', `templates/${name}`)) fail(`a changed ${name} was not caught through a page that links it`)
    write(copy, original.replace(/\n/g, '\r\n'))
    if (has(problems(system), 'copies')) fail(`${name} with Windows line endings must pass`)
    write(copy, original)
  }
  // Only the copies in design-system/ are compared.
  const other = path.join(area, 'docs.css')
  write(other, '.mine { color: var(--color-text); }\n')
  if (has(problems(area), 'copies')) fail('a docs.css outside design-system/ must not be compared')
  rmSync(other)
}

function docFixtures({ system, fail, write, checkPaths }) {
  const target = path.join(system, 'system/components/button/index.html')
  const original = readFileSync(target, 'utf8')
  const check = html => {
    write(target, html)
    return checkPaths([path.join(system, 'system')], { noDate: true }).problems
  }
  const cases = [
    ['no status line', html => html.replace('class="ds-meta" ', 'class="other" '), 'meta', 'needs a p.ds-meta'],
    ['status words differ', html => html.replace('>Draft<', '>In review<'), 'meta', 'must say "Draft"'],
    ['fixed line missing', html => html.replace('Design, not a working product', 'Docs'), 'meta', 'must say'],
    ['date not shown', html => html.replace('updated 2026-11-01', 'updated recently'), 'meta', 'data-updated'],
    ['ready without approver', html => html.replace('data-design-status="draft"', 'data-design-status="ready"').replace('>Draft<', '>Ready for development<'), 'status', 'data-approved-by'],
    ['no exceptions', html => html.replace('<section id="exceptions">', '<section>'), 'anatomy', 'id="exceptions"'],
    ['a tile on a doc page', html => html.replace('<h2 id="states">', '<div class="design-tile">x</div>\n<h2 id="states">'), 'tile', 'a page has no status tile'],
    ['fixed frame in the grid', html => html.replace('<div class="design-frame" aria-hidden="true">', '<div class="design-frame design-frame--phone" aria-hidden="true">'), 'frames', 'outside the .ds-frames grid']
  ]
  for (const [name, mutate, rule, reason] of cases) {
    if (!has(check(mutate(original)), rule, reason)) fail(`doc page: "${name}" was not caught by [${rule}]`)
  }
  write(target, original)
}

function shippingFixtures({ templates, fail }) {
  const banned = [/Erfana design system/, /Qodeca Violet/, /\berf-/, /ds-foreign-page--hidden/, /Qodeca(?! sp\. z o\.o\.)/, /tokens\.css[^\n]*Erfana/]
  const files = readdirSync(templates, { recursive: true }).map(f => path.join(templates, String(f)))
  for (const name of files.filter(f => statSync(f).isFile() && !f.endsWith('.woff2') && path.basename(f) !== 'doc-page.html')) {
    const text = readFileSync(name, 'utf8')
    for (const re of banned) if (re.test(text)) fail(`${name} holds what must not ship: ${re}`)
    if (text.split('\n').length > 500) fail(`${name} is over 500 lines`)
  }
  for (const face of ['CascadiaMono-Regular.woff2', 'CascadiaMono-Bold.woff2']) {
    if (!existsSync(path.join(templates, 'fonts', `${face}.license`))) fail(`${face} has no licence sidecar`)
  }
}

export function runPageFixtures(context) {
  placeTemplates(context)
  shippingFixtures(context)
  statusFixtures(context)
  dateFixtures(context)
  context.write(context.file, context.page)
  indexFixtures(context)
  tableFixtures(context)
  copyFixtures(context)
  docFixtures(context)
}
