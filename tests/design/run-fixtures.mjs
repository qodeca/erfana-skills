// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// Proves the design skill's checker: the template pages pass, every mutation
// below is caught by the named rule, and the shipped samples pass. Run by
// Gate 20. A rule without a mutation here is a rule nobody has proved. Status,
// date, index, and template fixtures are in fixtures-pages.mjs.

import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCss } from '../../skills/design/scripts/build-tokens.mjs'
import { CSP, checkPaths, snapshot, snapshotClean } from '../../skills/design/scripts/check-design.mjs'
import { checkPolicy } from './csp-browser.mjs'
import { runBypassFixtures } from './fixtures-bypass.mjs'
import { runCliFixtures, tryLink } from './fixtures-cli.mjs'
import { runPageFixtures } from './fixtures-pages.mjs'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const templates = path.join(repo, 'skills/design/templates')
const samples = ['web-sample', 'mobile-sample'].map(name => path.join(repo, 'skills/design/examples', name))
const page = readFileSync(path.join(templates, 'screen-page.html'), 'utf8')
const tokens = JSON.parse(readFileSync(path.join(templates, 'tokens.json'), 'utf8'))

const failures = []
const fail = message => failures.push(message)
let bypassCount = 0

const open = '<!-- erfana:comment v1 id=c-aaaaaaaaaaaaaaaa\nstatus: open\ncomment by A at 2026-10-25T14:03:00Z:\n  Change this.\n-->'
const before = (html, tag, block) => html.replace(tag, `${block}\n${tag}`)
const addBody = html => html.replace('</main>', m => `X${m}`)
const insert = snippet => html => addBody(html).replace('X</main>', `${snippet}\n</main>`)
const replace = (a, b) => html => {
  if (!html.includes(a)) throw new Error(`mutation target not found: ${a}`)
  return html.replace(a, b)
}
const swapTileAndFrame = html => {
  const out = html.replace(/( *<div class="design-tile"[\s\S]*?<\/div>\n)( *<div class="design-frame[\s\S]*?<\/div>\n)/, '$2$1')
  if (out === html) throw new Error('mutation target not found: tile and frame')
  return out
}
const dropSecondTile = html => {
  const out = html.replace(/(id="hover">\n) *<div class="design-tile"[\s\S]*?<\/div>\n/, '$1')
  if (out === html) throw new Error('mutation target not found: second tile')
  return out
}
const inFrame = snippet => replace('<button class="button" type="button" tabindex="-1">Pay 49 EUR</button>', snippet)
const onBody = attr => replace('data-design-page="screen"', `data-design-page="screen" ${attr}`)
const style = css => replace('</head>', `<style>${css}</style>\n</head>`)

const MUTATIONS = [
  ['script element', insert('<script>alert(1)</script>'), 'no-script'],
  ['external script', insert('<script src="a.js"></script>'), 'no-script'],
  ['event attribute', onBody('onload="x()"'), 'no-script'],
  ['javascript url', insert('<a href="javascript:x()">x</a>'), 'no-script'],
  ['encoded javascript url', insert('<a href="&#106;avascript:x()">x</a>'), 'no-script'],
  ['object element', insert('<object data="x"></object>'), 'no-script'],
  ['script preload', replace('</head>', '<link rel="modulepreload" href="a.mjs">\n</head>'), 'no-script'],
  ['meta refresh', replace('</head>', '<meta http-equiv="refresh" content="0">\n</head>'), 'no-script'],
  ['css expression', style('.a { width: expression(1); }'), 'no-script'],
  ['template element', insert('<template><p>x</p></template>'), 'no-hidden'],
  ['dialog element', insert('<dialog>x</dialog>'), 'no-hidden'],
  ['srcdoc frame', insert('<iframe srcdoc="x"></iframe>'), 'no-hidden'],
  ['remote frame', insert('<iframe src="https://example.com"></iframe>'), 'no-hidden'],
  ['hidden attribute', insert('<p hidden>x</p>'), 'no-hidden'],
  ['inert attribute', replace('design-frame--phone" aria-hidden="true"', 'design-frame--phone" aria-hidden="true" inert'), 'no-hidden'],
  ['popover', insert('<div popover>x</div>'), 'no-hidden'],
  ['closed details', insert('<details><summary>x</summary>y</details>'), 'no-hidden'],
  ['display none', style('.a { display: none; }'), 'no-hidden'],
  ['display none inline', insert('<p style="display: none">x</p>'), 'no-hidden'],
  ['visibility hidden', style('.a { visibility: hidden; }'), 'no-hidden'],
  ['opacity zero', style('.a { opacity: 0; }'), 'no-hidden'],
  ['pointer events', style('.a { pointer-events: none; }'), 'no-hidden'],
  ['checked trick', style('input:checked ~ .a { color: var(--color-text); }'), 'no-hidden'],
  ['target trick', style('.a:target { color: var(--color-text); }'), 'no-hidden'],
  ['responsive css', replace('</head>', '<link rel="stylesheet" href="../../design-system/responsive.css">\n</head>'), 'no-hidden'],
  ['raw colour', style('.a { color: #ff0000; }'), 'no-raw-values'],
  ['raw colour function', insert('<p style="color: rgb(1, 2, 3)">x</p>'), 'no-raw-values'],
  ['raw size', style('.a { margin: 12px; }'), 'no-raw-values'],
  ['raw svg paint', insert('<svg><path fill="#000"></path></svg>'), 'no-raw-values'],
  ['undefined token', style('.a { color: var(--nope); }'), 'tokens'],
  ['no csp', replace('<meta http-equiv="Content-Security-Policy"', '<meta name="x"'), 'csp'],
  ['csp not first', replace('<head>', '<head>\n<meta name="x" content="y">'), 'csp'],
  ['no tile', replace('class="design-tile"', 'class="other"'), 'tile'],
  ['bad status', replace('data-design-status="draft"', 'data-design-status="done"'), 'tile'],
  ['status text differs', replace('>Draft<', '>In review<'), 'tile'],
  ['no fixed line', replace('Design, not a working product', 'Prototype'), 'tile'],
  ['bad date', replace('data-updated="2026-11-01"', 'data-updated="soon"'), 'tile'],
  ['no state label', replace('<strong class="design-state__label">Default</strong>', '<strong>Default</strong>'), 'states'],
  ['frame not a picture', replace('design-frame--phone" aria-hidden="true"', 'design-frame--phone"'), 'states'],
  ['no questions', replace('class="ds-note design-questions"', 'class="ds-note"'), 'questions'],
  ['working link', inFrame('<a class="button" href="next.html">Pay</a>'), 'no-fake-controls'],
  ['live control', inFrame('<button class="button" type="button">Pay</button>'), 'no-fake-controls'],
  ['form', insert('<form><p>x</p></form>'), 'no-fake-controls'],
  ['no page kind', replace(' data-design-page="screen"', ''), 'page'],
  ['remote stylesheet', replace('</head>', '<link rel="stylesheet" href="https://example.com/a.css">\n</head>'), 'links'],
  ['missing stylesheet', replace('</head>', '<link rel="stylesheet" href="nope.css">\n</head>'), 'links'],
  ['broken quote', insert('<p class="a>x</p>'), 'markup'],
  ['too many comments', html => before(html, '<h1>', `<!-- erfana:comment v1 id=c-b\nstatus: resolved by A at 2026-10-27T08:00:00Z\n-->\n`.repeat(501)), 'limits'],
  ['ready without approver', replace('data-design-status="draft"', 'data-design-status="ready"'), 'status'],
  ['ready with open comment', html => before(html.replace('data-design-status="draft"', 'data-design-status="ready" data-approved-by="A"').replace('>Draft<', '>Ready for development<'), '<h1>', open), 'status'],
  ['rectangle missing in a state', dropSecondTile, 'tile', 'a state needs a .design-tile rectangle directly above its frame'],
  ['rectangle after the frame', swapTileAndFrame, 'tile', 'must sit directly above this frame'],
  ['page-level tile', insert('<div class="design-tile" data-design-status="draft" data-updated="2026-11-01">Draft 2026-11-01 Design, not a working product</div>'), 'tile', 'a page has no status tile'],
  ['frame outside a state', insert('<div class="design-frame" aria-hidden="true"></div>'), 'states', 'sits inside a .design-state'],
  ['state without an id', replace(' id="hover"', ''), 'states', 'needs its own id'],
  ['state id used twice', replace(' id="hover"', ' id="default"'), 'states', 'needs its own id'],
  ['no crumbs', replace('class="ds-crumbs"', 'class="other"'), 'anatomy', 'nav.ds-crumbs'],
  ['no decision', replace(' id="decision"', ''), 'anatomy', 'id="decision"'],
  ['no description', replace('<meta name="description" content="What this screen shows, in one line, for the designs index">\n', ''), 'anatomy', 'meta name="description"'],
  ['unclosed div', insert('<div><p>x</p>'), 'balance', '<div> is never closed'],
  ['tag dropped mid-page', replace('</figure>', ''), 'balance', '<figure> is never closed'],
  ['stray closing tag', insert('</div>'), 'balance', 'stray </div>'],
  ['div closed with a slash', insert('<div />'), 'balance', '<div> is never closed'],
  ['unclosed style', replace('</head>', '<style>.a { color: var(--gray-50); }\n</head>'), 'balance', '<style> is never closed'],
  ['fixed frame in the grid', replace('<div class="ds-states">', '<div class="ds-frames">'), 'frames', 'outside the .ds-frames grid']
]

const root = mkdtempSync(path.join(tmpdir(), 'design-fixtures-'))
const system = path.join(root, 'docs/design-system')
const area = path.join(root, 'docs/designs/checkout')
const file = path.join(area, 'payment.html')
// Mutations run on the area folder: index fixtures run on docs/ in fixtures-pages.mjs.
const run = (options = {}) => checkPaths([area], { noDate: true, ...options }).problems
const write = (target, text) => {
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, text)
}

try {
  mkdirSync(area, { recursive: true })
  mkdirSync(system, { recursive: true })
  for (const name of ['docs-tokens.css', 'docs.css', 'fonts.css', 'components.css', 'tokens.json']) copyFileSync(path.join(templates, name), path.join(system, name))
  cpSync(path.join(templates, 'fonts'), path.join(system, 'fonts'), { recursive: true })
  write(path.join(system, 'system/components/button/button.css'), readFileSync(path.join(templates, 'component.css'), 'utf8'))
  const built = buildCss(tokens)
  if (built.errors.length > 0) fail(`template tokens: ${built.errors.join('; ')}`)
  write(path.join(system, 'tokens.css'), built.css)
  write(path.join(system, 'responsive.css'), '.a { display: none; }\n')

  write(file, page)
  const clean = run()
  if (clean.length > 0) fail(`template page should pass:\n  ${clean.join('\n  ')}`)

  // A trap: a token named after a colour is a token, not a raw colour.
  write(file, style('.a { color: var(--gray-50); }')(page))
  if (run().length > 0) fail(`a colour-named token must pass: ${run().join(' | ')}`)

  // A trap: "/>" is a real close inside SVG, and a void element needs no close.
  write(file, insert('<svg><path d="M0 0" /></svg>\n<hr>')(page))
  if (run().length > 0) fail(`self-closed SVG and void elements must pass: ${run().join(' | ')}`)

  // Dark themes: a component token must re-resolve inside a theme root.
  if (!/\[data-theme\] \{[^}]*--button-bg/.test(built.css)) fail('component tokens are not declared on theme roots')

  for (const [name, mutate, rule, reason = ''] of MUTATIONS) {
    write(file, mutate(page))
    const found = run()
    if (!found.some(p => p.includes(`[${rule}]`) && p.includes(reason))) fail(`"${name}" was not caught by [${rule}] ${reason}; got: ${found.slice(0, 3).join(' | ') || 'nothing'}`)
  }

  // A .js file beside a page, and a prototype that is allowed one.
  write(file, page)
  write(path.join(area, 'app.js'), 'x()\n')
  if (!run().some(p => p.includes('[no-script]'))) fail('a .js file was not caught')
  rmSync(path.join(area, 'app.js'))
  write(path.join(area, 'prototypes/flow.html'), '<script>x()</script>')
  write(path.join(area, 'prototypes/flow.js'), 'x()\n')
  if (!run().some(p => p.includes('[prototype]'))) fail('an unmarked prototype was not caught')
  if (run().some(p => p.includes('[no-script]'))) fail('a marked folder of prototypes must not fail no-script')
  write(path.join(area, 'prototypes/flow.html'), '<p class="design-prototype">Prototype – not for comments or sign-off</p><script>x()</script>')
  if (run().length > 0) fail(`a marked prototype must pass: ${run().join(' | ')}`)
  rmSync(path.join(area, 'prototypes'), { recursive: true })

  // Token drift, and a linked sheet that hides content.
  write(path.join(system, 'tokens.css'), `${built.css}/* edited by hand */\n`)
  if (!run().some(p => p.includes('[tokens]'))) fail('token drift was not caught')
  write(path.join(system, 'tokens.css'), built.css)
  const library = readFileSync(path.join(system, 'components.css'), 'utf8')
  write(path.join(system, 'components.css'), `${library}.a { display: none; }\n`)
  if (!run().some(p => p.includes('[no-hidden]'))) fail('display: none in a linked sheet was not caught')
  write(path.join(system, 'components.css'), `${library}.a { margin: 3px; }\n`)
  if (!run().some(p => p.includes('[no-raw-values]'))) fail('a raw value in a linked sheet was not caught')
  write(path.join(system, 'components.css'), library)

  // Token levels.
  const bad = structuredClone(tokens)
  bad.component.button.bg.$value = '{base.brand.500}'
  if (buildCss(bad).errors.length === 0) fail('a component alias to base was not caught')
  const raw = structuredClone(tokens)
  raw.semantic.color.action.$value = '#000000'
  if (buildCss(raw).errors.length === 0) fail('a raw semantic value was not caught')

  // Composite DTCG types.
  const composite = structuredClone(tokens)
  composite.base.ease = { out: { $type: 'cubicBezier', $value: [0.2, 0, 0, 1] } }
  composite.base.lift = { $type: 'shadow', $value: { color: '#00000033', offsetX: { value: 0, unit: 'px' }, offsetY: { value: 2, unit: 'px' }, blur: { value: 8, unit: 'px' }, spread: { value: 0, unit: 'px' } } }
  const compositeCss = buildCss(composite)
  if (compositeCss.errors.length > 0 || !compositeCss.css.includes('cubic-bezier(0.2, 0, 0, 1)') || !compositeCss.css.includes('0px 2px 8px 0px #00000033')) fail(`composite tokens: ${compositeCss.errors.join('; ')}`)

  // Baselines: comments stay byte-identical, and a changed ready page drops.
  const baseline = path.join(root, 'baseline')
  const withComment = before(page, '<h1>', open)
  write(path.join(baseline, 'payment.html'), withComment)
  const options = { baselineDir: baseline }
  write(file, withComment.replace('Payment</h1>', 'Pay</h1>'))
  if (run(options).length > 0) fail(`an edit that keeps the block must pass: ${run(options).join(' | ')}`)
  write(file, withComment.replace('Change this.', 'Changed.'))
  if (!run(options).some(p => p.includes('[comments]'))) fail('an edited comment block was not caught')
  write(file, page)
  if (!run(options).some(p => p.includes('[comments]'))) fail('a removed comment block was not caught')
  const ready = page.replace('data-design-status="draft"', 'data-design-status="ready" data-approved-by="A"').replace('>Draft<', '>Ready for development<')
  write(path.join(baseline, 'payment.html'), ready)
  write(file, ready.replace('Payment</h1>', 'Pay</h1>'))
  if (!run(options).some(p => p.includes('[status]'))) fail('a changed ready page was not caught')
  write(file, ready)
  if (run(options).length > 0) fail('an unchanged ready page must pass')

  // A block moved to another element keeps its bytes but loses its target.
  const moved = before(page, '<h1>', open)
  write(path.join(baseline, 'payment.html'), moved)
  write(file, before(page, '<main>', open))
  if (!run(options).some(p => p.includes('now sits before'))) fail('a moved comment block was not caught')

  // The baseline fails closed: nothing compared, or a page gone, is a failure.
  write(path.join(baseline, 'payment.html'), withComment)
  write(file, withComment)
  const matched = checkPaths([area], { noDate: true, baselineDir: baseline })
  if (matched.compared !== 1 || matched.problems.length > 0) fail(`a matching baseline must compare one page: ${matched.problems.join(' | ')}`)
  const emptyCopy = path.join(root, 'empty')
  write(path.join(emptyCopy, 'other/page.html'), page)
  if (!checkPaths([area], { noDate: true, baselineDir: emptyCopy }).problems.some(p => p.includes('[comments]'))) fail('a baseline with no matching page passed')
  rmSync(file)
  write(path.join(area, 'renamed.html'), page)
  if (!checkPaths([area], { noDate: true, baselineDir: baseline }).problems.some(p => p.includes('is gone'))) fail('a removed page with comments was not caught')
  rmSync(path.join(area, 'renamed.html'))
  write(file, page)

  write(file, page)
  const context = { root, system, area, file, page, templates, fail, write, checkPaths, open, before }
  runPageFixtures(context)
  bypassCount = runBypassFixtures(context)
  await runCliFixtures(context)

  // The shipped samples.
  const shipped = samples.flatMap(sample => checkPaths([sample], { noDate: true }).problems)
  if (shipped.length > 0) fail(`shipped sample should pass:\n  ${shipped.join('\n  ')}`)
  // The comment safety copy stays inside the project, in a folder git ignores.
  const project = path.join(root, 'snapshot-project')
  write(path.join(project, 'docs', 'page.html'), 'x')
  const copy = snapshot(path.join(project, 'docs'), project)
  const base = path.join(project, '.local', 'design-snapshots')
  if (!copy.startsWith(base + path.sep)) fail(`snapshot left the project: ${copy}`)
  if (readFileSync(path.join(base, '.gitignore'), 'utf-8') !== '*\n') fail('snapshot folder does not ignore itself')
  if (readFileSync(path.join(copy, 'page.html'), 'utf-8') !== 'x') fail('snapshot did not copy the folder')
  if (snapshot(root, project) !== null) fail('snapshot accepted a folder outside the project')
  if (snapshot('missing', project) !== null) fail('snapshot accepted a folder that does not exist')
  if (snapshotClean(path.join(project, 'docs'), project)) fail('snapshot-clean accepted a folder that is not a copy')
  if (!snapshotClean(copy, project) || existsSync(copy)) fail('snapshot-clean did not remove the copy')
  if (snapshotClean(copy, project)) fail('snapshot-clean reported success for a missing copy')
  write(path.join(root, 'outside.html'), 'live')
  if (tryLink(path.join(root, 'outside.html'), path.join(project, 'docs', 'linked.html'), 'the snapshot link check')) {
    const copies = readdirSync(base).length
    if (snapshot(path.join(project, 'docs'), project) !== null) fail('snapshot accepted a folder with a link')
    if (readdirSync(base).length !== copies) fail('snapshot left a partial copy')
  }

  // The policy in a real browser, and a control: the old policy must fail the same test.
  const font = path.join(templates, 'fonts/CascadiaMono-Regular.woff2')
  const policy = await checkPolicy(CSP, font)
  if (policy.skipped) {
    console.log(`  SKIP: the browser test of the page policy: ${policy.skipped}`)
  } else {
    for (const problem of policy.failures) fail(`page policy: ${problem}`)
    const weak = await checkPolicy(CSP.replace(/^default-src 'none'; style-src [^;]*; font-src [^;]*; img-src [^;]*; /, ''), font)
    if (weak.failures?.length === 0) fail('the browser test passed a policy with no default-src, so it proves nothing')
    console.log(`  PASS: page policy in a real browser: local stylesheet, import, font, and images load on file://, and a remote image does not; the weaker policy fails, ${weak.failures?.length} problem(s)`)
  }
} catch (error) {
  fail(error.stack)
} finally {
  rmSync(root, { recursive: true, force: true })
}

if (failures.length > 0) {
  for (const f of failures) console.log(`  FAIL: ${f}`)
  process.exitCode = 1
} else {
  console.log(`  PASS: template pages, ${MUTATIONS.length} mutations, ${bypassCount} bypass payloads, command runs, git, baselines, token levels, status, dates, indexes, shipped samples`)
}
