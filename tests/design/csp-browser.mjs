// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// Proves the page policy in a real browser: a local stylesheet, an imported
// stylesheet, a font, and an image load on file://, and a remote image does not.
// It also serves the page from a sandboxed local address, whose opaque origin is
// the closest stand-in for Erfana. That address is not erfana-preview://, which
// only the app can serve, so this says nothing direct about that scheme.
// Test-only, and Node standard library only. With no usable browser it reports a
// skip, because a gate must not depend on Chrome being installed.

import { spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYPj/HwADAgH/ZpZ7ZQAAAABJRU5ErkJggg==', 'base64')
const LAUNCH_MS = 15000
const STEP_MS = 10000
const SETTLE_MS = 300
const CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
].filter(Boolean)

const READ_PAGE = `JSON.stringify({
  sheet: getComputedStyle(document.body).getPropertyValue('--linked').trim(),
  imported: getComputedStyle(document.body).getPropertyValue('--imported').trim(),
  font: [...document.fonts].some(face => face.status === 'loaded'),
  image: document.getElementById('local').naturalWidth,
  inline: getComputedStyle(document.getElementById('inline')).getPropertyValue('--inline').trim(),
  remote: document.getElementById('remote').naturalWidth
})`

const pageHtml = (csp, remote) => `<!doctype html>
<html lang="en">
<head>
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta charset="utf-8">
<title>Policy test</title>
<link rel="stylesheet" href="sheet.css">
</head>
<body>
<p id="inline" style="--inline: yes; font-family: var(--test-font)">Text set in the test font.</p>
<img id="local" src="pixel.png" alt="">
<img id="remote" src="${remote}/remote.png" alt="">
</body>
</html>
`

function writePage(folder, csp, remote, fontFile) {
  mkdirSync(folder, { recursive: true })
  writeFileSync(path.join(folder, 'page.html'), pageHtml(csp, remote))
  writeFileSync(path.join(folder, 'pixel.png'), PIXEL)
  writeFileSync(path.join(folder, 'back.png'), PIXEL)
  writeFileSync(path.join(folder, 'imported.css'), ':root { --imported: yes; }\n')
  writeFileSync(path.join(folder, 'sheet.css'), `@import url('./imported.css');
@font-face { font-family: 'Test'; src: url('./font.woff2') format('woff2'); }
:root { --linked: yes; --test-font: 'Test'; }
body { background: url('./back.png'); }
`)
  copyFileSync(fontFile, path.join(folder, 'font.woff2'))
}

function launch(browser, profile) {
  return new Promise((resolve, reject) => {
    const child = spawn(browser, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check', '--disable-gpu', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
    const timer = setTimeout(() => reject(new Error('the browser did not start in time')), LAUNCH_MS)
    let log = ''
    child.on('error', reject)
    child.stderr.on('data', chunk => {
      log += chunk
      const hit = /DevTools listening on (ws:\S+)/.exec(log)
      if (hit) {
        clearTimeout(timer)
        resolve({ child, endpoint: hit[1] })
      }
    })
  })
}

/** One page target over the Chrome DevTools Protocol. */
async function openSession(endpoint) {
  const socket = new WebSocket(endpoint)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', () => reject(new Error('cannot reach the browser')), { once: true })
  })
  let id = 0
  const pending = new Map()
  const events = new Set()
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) reject(new Error(message.error.message))
      else resolve(message.result)
    } else {
      for (const listen of events) listen(message)
    }
  })
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    id += 1
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params, sessionId }))
  })
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send('Network.enable', {}, sessionId)
  const requested = new Map()
  const finished = new Set()
  events.add(message => {
    if (message.sessionId !== sessionId) return
    if (message.method === 'Network.requestWillBeSent') requested.set(message.params.requestId, message.params.request.url)
    if (message.method === 'Network.loadingFinished') finished.add(requested.get(message.params.requestId))
  })
  return {
    close: () => socket.close(),
    read: url => new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${url} did not finish loading`)), STEP_MS)
      const onEvent = message => {
        if (message.method !== 'Page.loadEventFired' || message.sessionId !== sessionId) return
        events.delete(onEvent)
        clearTimeout(timer)
        setTimeout(() => {
          send('Runtime.evaluate', { expression: READ_PAGE, returnByValue: true }, sessionId)
            .then(result => resolve({ ...JSON.parse(result.result.value), background: [...finished].some(name => name?.endsWith('back.png')) }))
            .catch(reject)
        }, SETTLE_MS)
      }
      events.add(onEvent)
      finished.clear()
      send('Page.navigate', { url }, sessionId).catch(reject)
    })
  }
}

function serve(folder) {
  const requests = []
  const types = { '.html': 'text/html', '.css': 'text/css', '.png': 'image/png', '.woff2': 'font/woff2' }
  const server = createServer((request, response) => {
    const name = new URL(request.url, 'http://local').pathname
    requests.push(name)
    const file = path.join(folder, path.basename(name))
    if (name === '/remote.png' || !existsSync(file)) {
      response.writeHead(name === '/remote.png' ? 200 : 404, { 'content-type': 'image/png' })
      response.end(name === '/remote.png' ? PIXEL : undefined)
      return
    }
    // The sandbox header gives the page an opaque origin, as Erfana's preview does.
    // A font fetch is cross-origin from an opaque origin, whatever the policy says.
    const headers = { 'content-type': types[path.extname(file)] ?? 'text/plain', 'access-control-allow-origin': '*' }
    if (file.endsWith('.html')) headers['content-security-policy'] = 'sandbox allow-scripts'
    response.writeHead(200, headers)
    response.end(readFileSync(file))
  })
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address()
      // Two host names, so the "remote" image is never the page's own origin.
      resolve({ server, requests, origin: `http://127.0.0.1:${port}`, remote: `http://localhost:${port}` })
    })
  })
}

const loaded = result => ['sheet', 'imported', 'inline'].filter(key => result[key] !== 'yes')
  .concat(result.font ? [] : ['font'], result.image > 0 ? [] : ['image'], result.background ? [] : ['background image'])

/**
 * Returns { skipped } when no browser could run, or { failures, results }.
 * `fontFile` is any real .woff2 file.
 */
export async function checkPolicy(csp, fontFile) {
  const browser = CANDIDATES.find(existsSync)
  if (!browser) return { skipped: 'no Chrome or Chromium found; set CHROME_PATH to run it' }
  if (typeof WebSocket === 'undefined') return { skipped: `Node ${process.version} has no built-in WebSocket` }
  const root = mkdtempSync(path.join(tmpdir(), 'design-csp-'))
  const { server, requests, origin, remote } = await serve(path.join(root, 'site'))
  let run
  try {
    writePage(path.join(root, 'site'), csp, remote, fontFile)
    try {
      run = await launch(browser, path.join(root, 'profile'))
    } catch (error) {
      return { skipped: `the browser would not start: ${error.message}` }
    }
    const session = await openSession(run.endpoint)
    const onFile = await session.read(pathToFileURL(path.join(root, 'site/page.html')).href)
    const fileHits = requests.length
    const sandboxed = await session.read(`${origin}/page.html`)
    session.close()
    const failures = []
    for (const part of loaded(onFile)) failures.push(`file://: the local ${part} did not load`)
    if (onFile.remote > 0 || fileHits > 0) failures.push('file://: the remote image loaded')
    if (sandboxed.remote > 0) failures.push('opaque origin: the remote image rendered')
    for (const part of loaded(sandboxed)) failures.push(`opaque origin: the local ${part} did not load`)
    return { failures, results: { onFile, sandboxed } }
  } finally {
    run?.child.kill()
    server.close()
    server.closeAllConnections()
    // Chrome can hold its profile for a moment after it is told to stop.
    rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
}
