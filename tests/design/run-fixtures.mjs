// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// Proves the design skill's checker: the template page passes, every mutation
// below is caught by the named rule, and the shipped sample passes. Run by
// Gate 20. A rule without a mutation here is a rule nobody has proved.

import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCss } from '../../skills/design/scripts/build-tokens.mjs'
import { checkPaths } from '../../skills/design/scripts/check-design.mjs'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const templates = path.join(repo, 'skills/design/templates')
const sample = path.join(repo, 'skills/design/examples/web-sample')
const page = readFileSync(path.join(templates, 'screen-page.html'), 'utf8')
const tokens = JSON.parse(readFileSync(path.join(templates, 'tokens.json'), 'utf8'))

const failures = []
const fail = message => failures.push(message)

const open = '<!-- erfana:comment v1 id=c-aaaaaaaaaaaaaaaa\nstatus: open\ncomment by A at 2026-10-25T14:03:00Z:\n  Change this.\n-->'
const before = (html, tag, block) => html.replace(tag, `${block}\n${tag}`)
const addBody = html => html.replace('</main>', m => `X${m}`)
const insert = snippet => html => addBody(html).replace('X</main>', `${snippet}\n</main>`)
const replace = (a, b) => html => {
  if (!html.includes(a)) throw new Error(`mutation target not found: ${a}`)
  return html.replace(a, b)
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
  ['no state label', replace('<h2 class="design-state__label">Default</h2>', ''), 'states'],
  ['frame not a picture', replace('design-frame--phone" aria-hidden="true"', 'design-frame--phone"'), 'states'],
  ['no questions', replace('class="design-questions"', 'class="other"'), 'questions'],
  ['working link', inFrame('<a class="button" href="next.html">Pay</a>'), 'no-fake-controls'],
  ['live control', inFrame('<button class="button" type="button">Pay</button>'), 'no-fake-controls'],
  ['form', insert('<form><p>x</p></form>'), 'no-fake-controls'],
  ['no page kind', replace(' data-design-page="screen"', ''), 'page'],
  ['remote stylesheet', replace('</head>', '<link rel="stylesheet" href="https://example.com/a.css">\n</head>'), 'links'],
  ['missing stylesheet', replace('</head>', '<link rel="stylesheet" href="nope.css">\n</head>'), 'links'],
  ['broken quote', insert('<p class="a>x</p>'), 'markup'],
  ['too many comments', html => before(html, '<h1>', `<!-- erfana:comment v1 id=c-b\nstatus: resolved by A at 2026-10-27T08:00:00Z\n-->\n`.repeat(501)), 'limits'],
  ['ready without approver', replace('data-design-status="draft"', 'data-design-status="ready"'), 'status'],
  ['ready with open comment', html => before(html.replace('data-design-status="draft"', 'data-design-status="ready" data-approved-by="A"').replace('>Draft<', '>Ready for development<'), '<h1>', open), 'status']
]

const root = mkdtempSync(path.join(tmpdir(), 'design-fixtures-'))
const system = path.join(root, 'docs/design-system')
const area = path.join(root, 'docs/designs/checkout')
const file = path.join(area, 'payment.html')
const run = (options = {}) => checkPaths([path.join(root, 'docs/designs')], { noDate: true, ...options }).problems
const write = (target, text) => {
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, text)
}

try {
  mkdirSync(area, { recursive: true })
  mkdirSync(system, { recursive: true })
  for (const name of ['docs-tokens.css', 'docs.css', 'components.css', 'tokens.json']) copyFileSync(path.join(templates, name), path.join(system, name))
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

  // Dark themes: a component token must re-resolve inside a theme root.
  if (!/\[data-theme\] \{[^}]*--button-bg/.test(built.css)) fail('component tokens are not declared on theme roots')

  for (const [name, mutate, rule] of MUTATIONS) {
    write(file, mutate(page))
    const found = run()
    if (!found.some(p => p.includes(`[${rule}]`))) fail(`"${name}" was not caught by [${rule}]; got: ${found.slice(0, 3).join(' | ') || 'nothing'}`)
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
  write(path.join(area, 'prototypes/flow.html'), '<p>Prototype – not for comments or sign-off</p><script>x()</script>')
  if (run().length > 0) fail('a marked prototype must pass')
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
  write(path.join(baseline, 'checkout/payment.html'), withComment)
  const options = { baselineDir: baseline }
  write(file, withComment.replace('Payment</h1>', 'Pay</h1>'))
  if (run(options).length > 0) fail(`an edit that keeps the block must pass: ${run(options).join(' | ')}`)
  write(file, withComment.replace('Change this.', 'Changed.'))
  if (!run(options).some(p => p.includes('[comments]'))) fail('an edited comment block was not caught')
  write(file, page)
  if (!run(options).some(p => p.includes('[comments]'))) fail('a removed comment block was not caught')
  const ready = page.replace('data-design-status="draft"', 'data-design-status="ready" data-approved-by="A"').replace('>Draft<', '>Ready for development<')
  write(path.join(baseline, 'checkout/payment.html'), ready)
  write(file, ready.replace('Payment</h1>', 'Pay</h1>'))
  if (!run(options).some(p => p.includes('[status]'))) fail('a changed ready page was not caught')
  write(file, ready)
  if (run(options).length > 0) fail('an unchanged ready page must pass')

  // A block moved to another element keeps its bytes but loses its target.
  const moved = before(page, '<h1>', open)
  write(path.join(baseline, 'checkout/payment.html'), moved)
  write(file, before(page, '<main>', open))
  if (!run(options).some(p => p.includes('now sits before'))) fail('a moved comment block was not caught')

  // The baseline fails closed: nothing compared, or a page gone, is a failure.
  const designs = path.join(root, 'docs/designs')
  write(path.join(baseline, 'checkout/payment.html'), withComment)
  write(file, withComment)
  const matched = checkPaths([designs], { noDate: true, baselineDir: baseline })
  if (matched.compared !== 1 || matched.problems.length > 0) fail(`a matching baseline must compare one page: ${matched.problems.join(' | ')}`)
  const emptyCopy = path.join(root, 'empty')
  write(path.join(emptyCopy, 'other/page.html'), page)
  if (!checkPaths([designs], { noDate: true, baselineDir: emptyCopy }).problems.some(p => p.includes('[comments]'))) fail('a baseline with no matching page passed')
  rmSync(file)
  write(path.join(area, 'renamed.html'), page)
  if (!checkPaths([designs], { noDate: true, baselineDir: baseline }).problems.some(p => p.includes('is gone'))) fail('a removed page with comments was not caught')
  rmSync(path.join(area, 'renamed.html'))
  write(file, page)

  // The shipped sample.
  const shipped = checkPaths([sample], { noDate: true }).problems
  if (shipped.length > 0) fail(`shipped sample should pass:\n  ${shipped.join('\n  ')}`)
} catch (error) {
  fail(error.stack)
} finally {
  rmSync(root, { recursive: true, force: true })
}

if (failures.length > 0) {
  for (const f of failures) console.log(`  FAIL: ${f}`)
  process.exitCode = 1
} else {
  console.log(`  PASS: template page, ${MUTATIONS.length} mutations, baselines, token levels, shipped sample`)
}
