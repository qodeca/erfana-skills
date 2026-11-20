// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// scan-log.mjs - reads one Claude Code log file (a main session log or one
// subagent log) and counts where its tokens and time went. It reads usage, tool
// names, tool inputs (to match patterns and spot repeats), result sizes, and
// timing. Inputs stay in memory only, hashed where they are kept, and nothing
// from them is returned: the result holds numbers, tool names that pass the
// label check, and the labels from the patterns file. Used by scan-sessions.mjs.

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

const CHARS_PER_TOKEN = 4
// An image costs about width x height / 750 tokens, capped near 1,600 for a
// full-size one. The log does not give the size, so each image counts as the
// cap: an upper bound, which keeps screenshot runs from ranking as free.
const IMAGE_TOKENS = 1600
// Patterns run on at most this much of each command, so one huge command line
// cannot stall the scan.
const MAX_COMMAND = 4096
const MAX_PATTERN = 200
// Commands that only look at state. Running one again is polling, not waste.
const POLLING = /^\s*(git (status|log|diff|show|branch|fetch|rev-parse)|gh (run|pr|issue) (view|list|checks|status|watch)|cd|ls|pwd|cat|head|tail|wc|date|sleep|ps|which|echo)\b/
// Commands that change files or state, so a later rerun can rightly differ.
const STATE_CHANGE = /^\s*(git (checkout|switch|pull|merge|rebase|reset|stash|cherry-pick|commit|apply|restore)|(npm|pnpm|yarn|bun) (install|i|add|remove|update)|pip install|rm|mv|cp|mkdir|sed -i)\b/
// Price ratios against one new input token, as Anthropic's list prices set
// them for current Claude models: a cache read costs a tenth, a five-minute
// cache write a quarter more (a one-hour write costs more), and output five
// times as much. Ranking by raw totals lets cheap cache reads win.
const WEIGHTS = { input: 1, cacheWrite: 1.25, cacheRead: 0.1, output: 5 }
// Plain characters only. It checks the shape of a name, not whether it holds
// a secret: labels are written by the skill, and tool names are product names.
export const PLAIN_LABEL = /^[A-Za-z0-9 _.:/()+-]{1,60}$/
const PLAIN_CHARS = /^[A-Za-z0-9 _.:/()+-]+$/
const VERSION = /^\d{1,4}\.\d{1,4}\.\d{1,6}[A-Za-z0-9.+-]{0,20}$/
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const SHELL_TOOLS = new Set(['Bash', 'PowerShell'])
const PATTERN_KINDS = ['commands', 'tools', 'polling']

// A problem with what the caller passed: an argument, the patterns file, or the
// compare file. Its message holds fixed text and checked labels only.
export class InputError extends Error {}

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const hash = s => crypto.createHash('sha256').update(s).digest('base64')
// Maps keyed by names from the logs have no prototype, so a tool named
// __proto__ is an ordinary key and cannot change every other object.
export const newMap = () => Object.create(null)
export const emptyStat = () => ({ count: 0, resultTokens: 0, weightedTokens: 0, images: 0, minutes: 0 })

// A rough check for the shapes that backtrack badly: a repeated group that
// holds a repeat or an alternative, such as (a+)+ or (a|aa)+, and three
// unbounded wildcards in a row. It catches the common cases, not all of them.
export function slowShape(src) {
  const groups = []
  let inClass = false
  let wildcards = 0
  const repeats = c => c === '+' || c === '*' || c === '{'
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (c === '\\') { i++; continue }
    if (inClass) { if (c === ']') inClass = false; continue }
    if (c === '[') { inClass = true; continue }
    if (c === '(') { groups.push(false); continue }
    if (c === ')') {
      const risky = groups.pop()
      const repeated = repeats(src[i + 1])
      if (risky && repeated) return true
      if ((risky || repeated) && groups.length) groups[groups.length - 1] = true
      continue
    }
    if ((repeats(c) || c === '|') && groups.length) groups[groups.length - 1] = true
    if ((c === '*' || c === '+') && src[i - 1] === '.' && src[i - 2] !== '\\' && ++wildcards >= 3) return true
  }
  return false
}

export function loadPatterns(file) {
  const out = { commands: [], tools: [], polling: [] }
  if (!file) return out
  let raw
  try { raw = JSON.parse(fs.readFileSync(file, 'utf8')) } catch (e) { throw new InputError(`could not read the patterns file (${e.code || e.name})`) }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new InputError('the patterns file is not a JSON object')
  // A mistyped key would otherwise give no patterns and no error.
  if (Object.keys(raw).some(k => !PATTERN_KINDS.includes(k))) throw new InputError(`the patterns file has an unknown key; use only ${PATTERN_KINDS.join(', ')}`)
  for (const kind of PATTERN_KINDS) {
    if (raw[kind] === undefined) continue
    if (!Array.isArray(raw[kind])) throw new InputError(`"${kind}" in the patterns file is not a list`)
    for (const p of raw[kind]) {
      if (!p || typeof p.label !== 'string' || !PLAIN_LABEL.test(p.label)) throw new InputError(`bad label in ${kind}: use letters, digits, spaces, and ._:/()+- only, at most 60 characters`)
      if (Object.keys(p).some(k => k !== 'label' && k !== 'match')) throw new InputError(`pattern "${p.label}" has a key other than label and match`)
      if (typeof p.match !== 'string' || !p.match || p.match.length > MAX_PATTERN) throw new InputError(`pattern "${p.label}" is missing or over ${MAX_PATTERN} characters`)
      if (slowShape(p.match)) throw new InputError(`pattern "${p.label}" repeats a group that holds a repeat or an alternative, or has three wildcards; write it without one`)
      try { out[kind].push({ label: p.label, re: new RegExp(p.match) }) } catch { throw new InputError(`pattern "${p.label}" is not a valid regular expression`) }
    }
  }
  return out
}

export function emptyTokens() {
  return { input: 0, cacheWrite: 0, cacheRead: 0, output: 0 }
}

export function totalTokens(t) {
  return t.input + t.cacheWrite + t.cacheRead + t.output
}

export function weightedTokens(t) {
  return Math.round(t.input * WEIGHTS.input + t.cacheWrite * WEIGHTS.cacheWrite + t.cacheRead * WEIGHTS.cacheRead + t.output * WEIGHTS.output)
}

// A tool result enters the context on the next reply (a cache write) and is
// re-read on every reply after that until a compaction or the end of the log.
// This estimates that cost in weighted tokens, so result sizes rank on the
// same scale as subagent runs.
function contextCost(tokens, laterReplies) {
  if (laterReplies <= 0) return 0
  return Math.round(tokens * (WEIGHTS.cacheWrite + WEIGHTS.cacheRead * (laterReplies - 1)))
}

// The size of a tool result as numbers only. A result Claude Code moved to a
// tool-results/ file is logged as a short preview, and only that preview
// reaches the context, so its size is the right one to count.
function resultTokens(content) {
  if (typeof content === 'string') return { tokens: Math.round(content.length / CHARS_PER_TOKEN), images: 0 }
  let chars = 0
  let images = 0
  for (const block of Array.isArray(content) ? content : []) {
    if (block?.type === 'text' && typeof block.text === 'string') chars += block.text.length
    else if (block?.type === 'image') images++
  }
  return { tokens: Math.round(chars / CHARS_PER_TOKEN) + images * IMAGE_TOKENS, images }
}

// A tool name that fails the label check becomes "other". A long one keeps
// its first 52 characters plus a short hash, so two long names stay apart.
function toolName(raw) {
  if (!PLAIN_CHARS.test(raw)) return 'other'
  return raw.length <= 60 ? raw : `${raw.slice(0, 52)}+${hash(raw).replace(/[^A-Za-z0-9]/g, '').slice(0, 7)}`
}

function bump(map, key, field, n = 1) {
  map[key] ??= emptyStat()
  map[key][field] += n
}

// The parts of a chained command, such as `cd app && pnpm install`. Quotes are
// not parsed, so this is a rough split.
const shellParts = cmd => cmd.split(/&&|\|\||;|\|/).map(s => s.trim()).filter(Boolean)
const normPath = p => (typeof p === 'string' && p ? path.resolve(p) : null)

// Streams the lines of a file and rejects on a read error, so an unreadable
// log is reported instead of crashing the scan.
function readLines(file, onLine) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(file)
    input.on('error', reject)
    const rl = readline.createInterface({ input, crlfDelay: Infinity })
    // readline passes the stream's error on as its own, so both need a listener.
    rl.on('error', reject)
    rl.on('line', line => {
      try { onLine(line) } catch (e) { rl.close(); input.destroy(); reject(e) }
    })
    rl.on('close', resolve)
  })
}

export async function scanFile(file, patterns) {
  const acc = {
    tokens: emptyTokens(), first: null, last: null, version: null,
    activeMs: 0, turns: 0, compactions: 0, goalChecks: 0, goalUnmet: 0,
    askRounds: 0, askMinutes: 0, agentCalls: 0, toolCalls: 0, editCalls: 0, toolErrors: 0, repeatErrors: 0, unparsed: 0,
    tools: newMap(), labels: newMap(), repeatReads: 0, repeatReadTokens: 0, repeatReadWeighted: 0,
    repeatCommands: 0, repeatCommandTokens: 0, repeatCommandWeighted: 0,
    // Which fields exist at all, so a renamed field shows as "not found", not as zero.
    seen: { usage: false, timestamp: false, turnDuration: false },
  }
  const messageIds = new Set()
  const pending = new Map() // tool_use id -> the call, until its result arrives
  const readKeys = new Map() // file path -> read ranges since its last edit
  const commandKeys = new Set() // hashed commands since the last edit or compaction
  const errorKeys = new Set() // hashed failing calls
  let open = [] // results still in context
  const forget = () => { readKeys.clear(); commandKeys.clear() }
  const settle = () => {
    for (const r of open) {
      const w = contextCost(r.tokens, messageIds.size - r.replyAt)
      bump(acc.tools, r.name, 'weightedTokens', w)
      for (const l of r.labels) bump(acc.labels, l, 'weightedTokens', w)
      if (r.repeat === 'read') acc.repeatReadWeighted += w
      if (r.repeat === 'command') acc.repeatCommandWeighted += w
    }
    open = []
  }

  const onToolUse = (block, ts) => {
    const raw = typeof block.name === 'string' ? block.name : 'unknown'
    const name = toolName(raw)
    const input = block.input && typeof block.input === 'object' ? block.input : {}
    acc.toolCalls++
    bump(acc.tools, name, 'count')
    if (name === 'AskUserQuestion') acc.askRounds++
    if (name === 'Agent' || name === 'Task') acc.agentCalls++
    const labels = []
    let repeat = null
    // An edit resets the repeat tracking once its result shows it worked.
    let edited = null
    if (EDIT_TOOLS.has(name)) {
      acc.editCalls++
      edited = normPath(input.file_path ?? input.notebook_path) ?? ''
    }
    if (SHELL_TOOLS.has(name) && typeof input.command === 'string') {
      const cmd = input.command.slice(0, MAX_COMMAND)
      for (const p of patterns.commands) if (p.re.test(cmd)) labels.push(p.label)
      const parts = shellParts(cmd)
      if (parts.some(p => STATE_CHANGE.test(p))) forget()
      else if (!parts.every(p => POLLING.test(p) || patterns.polling.some(x => x.re.test(p)))) {
        const key = hash(cmd)
        if (commandKeys.has(key)) { repeat = 'command'; acc.repeatCommands++ } else commandKeys.add(key)
      }
    }
    for (const p of patterns.tools) if (p.re.test(raw.slice(0, MAX_COMMAND))) labels.push(p.label)
    if (name === 'Read') {
      const target = normPath(input.file_path)
      if (target) {
        const key = JSON.stringify([input.offset ?? null, input.limit ?? null, input.pages ?? null])
        let keys = readKeys.get(target)
        if (!keys) readKeys.set(target, (keys = new Set()))
        if (keys.has(key)) { repeat = 'read'; acc.repeatReads++ } else keys.add(key)
      }
    }
    for (const l of labels) bump(acc.labels, l, 'count')
    if (typeof block.id === 'string') pending.set(block.id, { name, raw, input, labels, ts, repeat, edited })
  }

  const onToolResult = (block, ts) => {
    const use = pending.get(block.tool_use_id)
    const failed = block.is_error === true
    if (failed) acc.toolErrors++
    if (!use) return
    pending.delete(block.tool_use_id)
    if (failed) {
      // The key is built only for a failed call, and only its hash is kept.
      const key = hash(`${use.raw}\u0000${JSON.stringify(use.input)}`)
      if (errorKeys.has(key)) acc.repeatErrors++
      else errorKeys.add(key)
    } else if (use.edited !== null) {
      // A changed file makes a later read or test run legitimate.
      if (use.edited) readKeys.delete(use.edited)
      else readKeys.clear()
      commandKeys.clear()
    }
    const { tokens, images } = resultTokens(block.content)
    const minutes = !Number.isNaN(ts) && !Number.isNaN(use.ts) ? Math.max(0, ts - use.ts) / 60000 : 0
    bump(acc.tools, use.name, 'resultTokens', tokens)
    bump(acc.tools, use.name, 'images', images)
    bump(acc.tools, use.name, 'minutes', minutes)
    for (const l of use.labels) {
      bump(acc.labels, l, 'resultTokens', tokens)
      bump(acc.labels, l, 'images', images)
      bump(acc.labels, l, 'minutes', minutes)
    }
    if (use.name === 'AskUserQuestion') acc.askMinutes += minutes
    if (use.repeat === 'read') acc.repeatReadTokens += tokens
    if (use.repeat === 'command') acc.repeatCommandTokens += tokens
    open.push({ tokens, replyAt: messageIds.size, name: use.name, labels: use.labels, repeat: use.repeat })
  }

  const onRecord = r => {
    const ts = typeof r.timestamp === 'string' ? Date.parse(r.timestamp) : NaN
    if (!Number.isNaN(ts)) {
      acc.seen.timestamp = true
      if (acc.first === null || ts < acc.first) acc.first = ts
      if (acc.last === null || ts > acc.last) acc.last = ts
    }
    if (typeof r.version === 'string' && VERSION.test(r.version)) acc.version = r.version
    if (r.type === 'system' && r.subtype === 'turn_duration' && typeof r.durationMs === 'number') {
      acc.seen.turnDuration = true
      acc.activeMs += num(r.durationMs)
      acc.turns++
    }
    if (r.type === 'system' && r.subtype === 'compact_boundary') {
      // After a compaction the old results are gone, so a read or a command
      // after it is not a repeat, and earlier results stop costing tokens.
      acc.compactions++
      settle()
      forget()
    }
    if (r.type === 'attachment' && r.attachment?.type === 'goal_status') {
      acc.goalChecks++
      if (r.attachment.met === false) acc.goalUnmet++
    }
    const msg = r.message
    if (!msg || typeof msg !== 'object') return
    if (r.type === 'assistant') {
      // One API reply is logged once per content block, each line repeating
      // the same usage, so count usage once per message id.
      if (msg.usage && msg.id && !messageIds.has(msg.id)) {
        acc.seen.usage = true
        messageIds.add(msg.id)
        const u = msg.usage
        acc.tokens.input += num(u.input_tokens)
        acc.tokens.cacheWrite += num(u.cache_creation_input_tokens)
        acc.tokens.cacheRead += num(u.cache_read_input_tokens)
        acc.tokens.output += num(u.output_tokens)
      }
      for (const block of Array.isArray(msg.content) ? msg.content : []) if (block?.type === 'tool_use') onToolUse(block, ts)
    } else if (r.type === 'user' && Array.isArray(msg.content)) {
      for (const block of msg.content) if (block?.type === 'tool_result') onToolResult(block, ts)
    }
  }

  await readLines(file, line => {
    if (!line) return
    let r
    try { r = JSON.parse(line) } catch { acc.unparsed++; return }
    if (r && typeof r === 'object') onRecord(r)
  })
  settle()
  return acc
}
