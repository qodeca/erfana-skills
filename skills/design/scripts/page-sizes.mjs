// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// The target-size rule: what the project designs for, what each page names, and
// which size each drawn state has. Node standard library only.

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { hasClass, inside } from './html-lite.mjs'
import { statesOf } from './page-status.mjs'

const SIZE_OF_FRAME = {
  desktop: 'desktop',
  narrow: 'narrow',
  tablet: 'tablet',
  'tablet-landscape': 'tablet-landscape',
  phone: 'phone',
  'phone-small': 'phone'
}
const SIZES = new Set(Object.values(SIZE_OF_FRAME))
const PROJECT_LINE = /^Target sizes: (.+)$/m
const MIN_REASON = 20
const words = value => value.trim().split(/[\s,]+/).filter(Boolean)

/** The sizes in docs/designs/README.md, or null when the project names none. */
export function projectSizes(docs) {
  const readme = path.join(docs, 'designs', 'README.md')
  if (!existsSync(readme)) return null
  const line = PROJECT_LINE.exec(readFileSync(readme, 'utf8').replace(/\r\n/g, '\n'))
  return line ? words(line[1]) : null
}

const stateGroup = state => state.attrs.get('data-design-group') ?? state.attrs.get('id') ?? ''

const frameSize = frame => {
  const names = (frame.attrs.get('class') ?? '').split(/\s+/).filter(n => n.startsWith('design-frame--'))
  return names.map(n => SIZE_OF_FRAME[n.slice('design-frame--'.length)]).find(Boolean) ?? ''
}

/** Each exception needs a real reason, and must still be true. */
function readExceptions(text, nodes, targets, add) {
  const pageOut = new Set()
  const stateOut = new Map()
  for (const node of nodes.filter(n => hasClass(n, 'design-size-exception'))) {
    const size = node.attrs.get('data-design-size') ?? ''
    const group = node.attrs.get('data-design-group')
    const reason = text.slice(node.start, node.end).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!targets.includes(size)) add(node.line, 'sizes', `an exception needs data-design-size set to one of: ${targets.join(', ')}`)
    if (reason.length < MIN_REASON) add(node.line, 'sizes', 'an exception needs a written reason on the page')
    if (inside(node, p => hasClass(p, 'design-frame'))) add(node.line, 'sizes', 'an exception sits outside every frame, so a person reads it')
    if (group !== undefined && /\s/.test(group)) add(node.line, 'sizes', 'data-design-group is one word')
    if (group === undefined) pageOut.add(size)
    else if (stateOut.has(`${group} ${size}`)) add(node.line, 'sizes', `state ${group} has two exceptions for ${size}`)
    else stateOut.set(`${group} ${size}`, node)
  }
  return { pageOut, stateOut }
}

/** Fails a target size with no frame and no reason, and a frame size that is no target. */
export function checkSizes(text, nodes, project, add) {
  const metas = nodes.filter(n => n.tag === 'meta' && n.attrs.get('name') === 'design-sizes')
  if (metas.length !== 1) return add(1, 'sizes', 'a screen page needs one <meta name="design-sizes"> naming its target sizes')
  const named = words(metas[0].attrs.get('content') ?? '')
  for (const size of named) if (!SIZES.has(size)) add(metas[0].line, 'sizes', `unknown size: use ${[...SIZES].join(', ')}`)
  if (!project) add(metas[0].line, 'sizes', 'docs/designs/README.md needs a plain line starting "Target sizes: ", so a page cannot drop a size alone')
  for (const size of project ?? []) if (!SIZES.has(size)) add(metas[0].line, 'sizes', `unknown size in docs/designs/README.md: use ${[...SIZES].join(', ')}`)
  const targets = project ?? named
  const { pageOut, stateOut } = readExceptions(text, nodes, targets, add)
  for (const size of targets) {
    if (!named.includes(size) && !pageOut.has(size)) add(metas[0].line, 'sizes', `project target ${size} is missing: add it, or write a .design-size-exception with the reason`)
    if (named.includes(size) && pageOut.has(size)) add(metas[0].line, 'sizes', `size ${size} is named and excepted: keep one`)
  }
  for (const size of named) if (!targets.includes(size)) add(metas[0].line, 'sizes', `size ${size} is not a project target`)

  const groups = new Map()
  for (const state of statesOf(nodes)) {
    const group = stateGroup(state)
    if (/\s/.test(group)) add(state.line, 'sizes', 'data-design-group is one word')
    const seen = groups.get(group) ?? { line: state.line, sizes: new Set() }
    for (const frame of nodes.filter(n => hasClass(n, 'design-frame') && inside(n, p => p === state))) {
      const size = frameSize(frame)
      if (!size) add(frame.line, 'sizes', 'a frame on a screen page needs a size class')
      else if (!named.includes(size)) add(frame.line, 'sizes', `frame size ${size} is not a target of this page`)
      seen.sizes.add(size)
    }
    groups.set(group, seen)
  }
  for (const [group, { line, sizes }] of groups) {
    for (const size of named) {
      const excused = stateOut.has(`${group} ${size}`)
      if (!sizes.has(size) && !excused) add(line, 'sizes', `state ${group} has no ${size} frame: draw it, or write a .design-size-exception with the reason`)
      if (sizes.has(size) && excused) add(stateOut.get(`${group} ${size}`).line, 'sizes', `state ${group} has a ${size} frame, so its exception is out of date`)
    }
  }
  for (const [key, node] of stateOut) {
    const [group, size] = key.split(' ')
    if (!groups.has(group)) add(node.line, 'sizes', `the exception names state ${group}, which is not on this page`)
    if (!named.includes(size)) add(node.line, 'sizes', `the exception names size ${size}, which this page does not target`)
  }
}
