#!/usr/bin/env node
// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// scan-sessions.mjs - streams one project's Claude Code session logs and counts
// where tokens and time went. Each log is read by scan-log.mjs. Nothing from a
// message, a tool input, or a tool output is written anywhere: the output holds
// numbers, session ids, tool names, agent type names, the Claude Code version,
// session times, and the labels from the patterns file. Node standard library
// only.
//
// Exit codes: 0 scanned; 1 no session logs for this project; 2 bad input (an
// argument, the patterns file, the compare file, or an output path); 3 logs
// found, but --since or --exclude left none; 4 a log or an output file could
// not be read or written, or the scan failed. stdout carries a short summary,
// stderr one "cut-waste:" line on failure, and --out / --md the full report.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { InputError, PLAIN_LABEL, emptyStat, loadPatterns, newMap, scanFile, totalTokens, weightedTokens } from './scan-log.mjs'

export { loadPatterns, totalTokens, weightedTokens }

const LOW_DATA_SESSIONS = 5
const SESSION_ID = /^[A-Za-z0-9-]{1,64}$/
const SINCE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/
const USAGE = `Usage: node scan-sessions.mjs (--project-dir <dir> | --cwd <path>)
  [--patterns <file.json>] [--since <ISO date or time with Z>] [--exclude <session id>]...
  [--compare <previous.json>] [--out <file.json>] [--md <file.md>]
--since keeps sessions that started at or after the given time.
Exit codes: 0 scanned, 1 no logs, 2 bad input, 3 filters left no sessions, 4 read, write, or scan failure.
`

class ExitError extends Error {
  constructor(code, message) { super(message); this.code = code }
}

export function slugFor(cwd) {
  return path.resolve(cwd).replace(/[^A-Za-z0-9]/g, '-')
}

export function defaultProjectDir(cwd) {
  const root = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude')
  return path.join(root, 'projects', slugFor(cwd))
}

export function parseArgs(argv) {
  const opts = { exclude: [] }
  const takesValue = new Set(['--project-dir', '--cwd', '--patterns', '--since', '--exclude', '--compare', '--out', '--md'])
  const given = new Set()
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]
    if (flag === '--help' || flag === '-h') return { help: true }
    if (!takesValue.has(flag)) throw new InputError(`unknown argument: ${String(flag).slice(0, 40)}`)
    if (flag !== '--exclude' && given.has(flag)) throw new InputError(`${flag} was given twice`)
    given.add(flag)
    const value = argv[i + 1]
    if (value === undefined || value.startsWith('--')) throw new InputError(`${flag} needs a value`)
    i++
    if (flag === '--exclude') opts.exclude.push(value)
    else opts[flag.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value
  }
  if (!opts.projectDir && !opts.cwd) throw new InputError('pass --project-dir or --cwd')
  // A time with no zone would be read as local time and shift the cut-off.
  if (opts.since !== undefined && (!SINCE.test(opts.since) || Number.isNaN(Date.parse(opts.since)))) {
    throw new InputError('--since needs a date (2026-11-19) or a UTC time with Z or an offset (2026-11-19T14:30Z)')
  }
  return opts
}

function mergeMap(into, from) {
  for (const [k, v] of Object.entries(from)) {
    into[k] ??= emptyStat()
    for (const f of Object.keys(v)) into[k][f] += v[f]
  }
}

function round(n, d = 1) {
  const m = 10 ** d
  return Math.round(n * m) / m
}

// Counted across the main log and every subagent log of a session.
const SUMMED = ['toolErrors', 'repeatErrors', 'compactions', 'repeatReads', 'repeatReadTokens', 'repeatReadWeighted', 'repeatCommands', 'repeatCommandTokens', 'repeatCommandWeighted', 'unparsed']

async function scanSession(dir, id, patterns) {
  const main = await scanFile(path.join(dir, `${id}.jsonl`), patterns)
  const seen = { ...main.seen, agentType: false }
  const subDir = path.join(dir, id, 'subagents')
  const subagents = { runs: 0, tokens: 0, weightedTokens: 0, byType: newMap() }
  const tools = newMap()
  const labels = newMap()
  mergeMap(tools, main.tools)
  mergeMap(labels, main.labels)
  const sums = Object.fromEntries(SUMMED.map(k => [k, main[k]]))
  if (fs.existsSync(subDir)) {
    for (const f of fs.readdirSync(subDir).filter(n => n.endsWith('.jsonl')).sort()) {
      const sub = await scanFile(path.join(subDir, f), patterns)
      for (const [k, v] of Object.entries(sub.seen)) if (v) seen[k] = true
      let type = 'unknown'
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(subDir, f.replace(/\.jsonl$/, '.meta.json')), 'utf8'))
        if (typeof meta.agentType === 'string' && PLAIN_LABEL.test(meta.agentType)) { type = meta.agentType; seen.agentType = true }
      } catch { /* no meta file: type stays unknown */ }
      const t = totalTokens(sub.tokens)
      const w = weightedTokens(sub.tokens)
      subagents.runs++
      subagents.tokens += t
      subagents.weightedTokens += w
      const byType = (subagents.byType[type] ??= { runs: 0, tokens: 0, weightedTokens: 0, toolCalls: 0, editCalls: 0 })
      byType.runs++
      byType.tokens += t
      byType.weightedTokens += w
      byType.toolCalls += sub.toolCalls
      byType.editCalls += sub.editCalls
      mergeMap(tools, sub.tools)
      mergeMap(labels, sub.labels)
      for (const k of SUMMED) sums[k] += sub[k]
    }
  }
  const { unparsed, ...counted } = sums
  const session = {
    id,
    start: main.first ? new Date(main.first).toISOString() : null,
    end: main.last ? new Date(main.last).toISOString() : null,
    version: main.version,
    wallMinutes: main.first ? round((main.last - main.first) / 60000) : 0,
    activeMinutes: round(main.activeMs / 60000),
    turns: main.turns,
    tokens: main.tokens,
    mainTokens: totalTokens(main.tokens),
    mainWeightedTokens: weightedTokens(main.tokens),
    subagents,
    agentCalls: main.agentCalls,
    askRounds: main.askRounds,
    askMinutes: round(main.askMinutes),
    goalChecks: main.goalChecks,
    goalUnmet: main.goalUnmet,
    ...counted,
    unparsedLines: unparsed,
    tools,
    labels,
  }
  return { session, seen }
}

// Each signal carries weighted tokens, minutes, or only a count. The report
// ranks tokens and minutes in separate tables, because the units do not compare.
// The basis says whether its tokens come from billed usage or a size estimate.
function signalsFor(sessions) {
  const s = new Map()
  const add = (name, basis, weighted, minutes, count) => {
    const cur = s.get(name) || { signal: name, basis, weightedTokens: 0, minutes: 0, count: 0 }
    cur.weightedTokens += weighted; cur.minutes += minutes; cur.count += count
    s.set(name, cur)
  }
  for (const x of sessions) {
    add('subagent runs', 'usage', x.subagents.weightedTokens, 0, x.subagents.runs)
    add('re-reads with no edit between', 'estimate', x.repeatReadWeighted, 0, x.repeatReads)
    add('command reruns with no edit between', 'estimate', x.repeatCommandWeighted, 0, x.repeatCommands)
    add('owner question rounds (minutes include user time)', 'none', 0, x.askMinutes, x.askRounds)
    add('goal checks not met', 'none', 0, 0, x.goalUnmet)
    add('context compactions', 'none', 0, 0, x.compactions)
    add('repeated tool errors', 'none', 0, 0, x.repeatErrors)
    for (const [l, v] of Object.entries(x.labels)) add(`pattern: ${l}`, 'estimate', v.weightedTokens, v.minutes, v.count)
  }
  return [...s.values()]
    .map(v => ({ ...v, minutes: round(v.minutes) }))
    .sort((a, b) => b.weightedTokens - a.weightedTokens || b.minutes - a.minutes || b.count - a.count)
}

const PER_SESSION = ['mainWeightedTokens', 'askMinutes', 'activeMinutes', 'askRounds', 'compactions', 'goalUnmet', 'repeatReads', 'repeatReadWeighted', 'repeatCommands', 'repeatCommandWeighted', 'toolErrors', 'repeatErrors']
const LABEL_FIELDS = [['count', 'runs'], ['weightedTokens', 'weighted tokens'], ['minutes', 'minutes']]

const labelSet = report => new Set(report.patternLabels ?? report.sessions.flatMap(s => Object.keys(s.labels || {})))

function averages(report, shared) {
  const n = report.sessions.length || 1
  const avg = {}
  for (const k of PER_SESSION) avg[k] = report.sessions.reduce((a, s) => a + (s[k] || 0), 0) / n
  avg.subagentRuns = report.sessions.reduce((a, s) => a + s.subagents.runs, 0) / n
  avg.subagentWeightedTokens = report.sessions.reduce((a, s) => a + s.subagents.weightedTokens, 0) / n
  for (const l of shared) for (const [, suffix] of LABEL_FIELDS) avg[`pattern: ${l} ${suffix}`] = 0
  for (const s of report.sessions) {
    for (const [l, v] of Object.entries(s.labels || {})) {
      if (!shared.has(l)) continue
      for (const [field, suffix] of LABEL_FIELDS) avg[`pattern: ${l} ${suffix}`] += (v[field] || 0) / n
    }
  }
  return avg
}

// Averages per session, with the session count on each side: with few sessions
// on either side a change is noise, and the skill sets the bar for judging it.
// A pattern label is compared only when both runs used it, so a renamed or
// dropped label does not show as a measured drop.
export function compare(previous, current) {
  const before = labelSet(previous)
  const after = labelSet(current)
  const shared = new Set([...before].filter(l => after.has(l)))
  const a = averages(previous, shared)
  const b = averages(current, shared)
  return {
    sessionsBefore: previous.sessions.length,
    sessionsAfter: current.sessions.length,
    since: current.since ?? null,
    labelsNotCompared: [...new Set([...before, ...after])].filter(l => !shared.has(l)).sort(),
    rows: Object.keys(b).map(k => {
      const x = a[k] || 0
      const y = b[k] || 0
      const change = x === 0 && y === 0 ? 'no change' : x === 0 ? 'new' : `${round(((y - x) / x) * 100, 0)}%`
      return { metric: `${k} per session`, before: round(x), after: round(y), change }
    }),
  }
}

// The compare file is checked before use, because its labels and numbers go
// into the new report.
function readCompare(file) {
  let prev
  try { prev = JSON.parse(fs.readFileSync(file, 'utf8')) } catch (e) { throw new InputError(`could not read the compare file (${e.code || e.name})`) }
  const bad = new InputError('the compare file is not a report from this script')
  const finite = v => v === undefined || Number.isFinite(v)
  if (!prev || !Array.isArray(prev.sessions)) throw bad
  if (prev.patternLabels !== undefined && !(Array.isArray(prev.patternLabels) && prev.patternLabels.every(l => typeof l === 'string' && PLAIN_LABEL.test(l)))) throw bad
  for (const s of prev.sessions) {
    if (!s || typeof s !== 'object' || !s.subagents || !finite(s.subagents.runs) || !finite(s.subagents.weightedTokens)) throw bad
    if (!PER_SESSION.every(k => finite(s[k]))) throw bad
    for (const [l, v] of Object.entries(s.labels || {})) {
      if (!PLAIN_LABEL.test(l) || !v || !LABEL_FIELDS.every(([f]) => finite(v[f]))) throw bad
    }
  }
  return prev
}

export async function scan(opts) {
  const dir = opts.projectDir || defaultProjectDir(opts.cwd)
  // Inputs are checked first, so a bad one fails fast and is not blamed on a log.
  const patterns = loadPatterns(opts.patterns)
  const previous = opts.compare ? readCompare(opts.compare) : null
  if (!fs.existsSync(dir)) return { dir, total: 0, report: null }
  const ids = fs.readdirSync(dir).filter(n => n.endsWith('.jsonl')).map(n => n.slice(0, -6)).sort()
  const since = opts.since ? Date.parse(opts.since) : null
  const sessions = []
  const unreadable = []
  const seen = { usage: false, timestamp: false, turnDuration: false, agentType: false }
  let oddNames = 0
  for (const id of ids) {
    if (!SESSION_ID.test(id)) { oddNames++; continue }
    if (opts.exclude.includes(id)) continue
    const file = path.join(dir, `${id}.jsonl`)
    // A log last written before --since also started before it, so skip it unread.
    if (since !== null) {
      try { if (fs.statSync(file).mtimeMs < since) continue } catch { /* read below, and report it there */ }
    }
    let r
    try { r = await scanSession(dir, id, patterns) } catch { unreadable.push(id); continue }
    // A session that started before --since had work from before the change.
    if (since !== null && (!r.session.start || Date.parse(r.session.start) < since)) continue
    sessions.push(r.session)
    for (const [k, v] of Object.entries(r.seen)) if (v) seen[k] = true
  }
  // Fields are judged on the kept sessions only, so an old session that has a
  // field does not hide that the newer ones lack it.
  const missing = []
  if (!seen.usage) missing.push('message.usage (token counts)')
  if (!seen.timestamp) missing.push('timestamp (session and tool times)')
  if (!seen.turnDuration) missing.push('system turn_duration (active minutes)')
  if (!seen.agentType && sessions.some(s => s.subagents.runs)) missing.push('subagent meta agentType (agent names)')
  const report = {
    generatedAt: new Date().toISOString(),
    since: opts.since || null,
    sessionCount: sessions.length,
    lowData: sessions.length < LOW_DATA_SESSIONS,
    missing,
    unreadable,
    oddNames,
    unparsedLines: sessions.reduce((a, s) => a + s.unparsedLines, 0),
    patternLabels: [...patterns.commands, ...patterns.tools].map(p => p.label),
    signals: signalsFor(sessions),
    sessions,
  }
  if (previous) report.comparison = compare(previous, report)
  return { dir, total: ids.length, report }
}

const fmt = n => (typeof n === 'number' ? n.toLocaleString('en-US') : String(n))

export function toMarkdown(report) {
  const lines = [`# Session waste report`, '', `Generated ${report.generatedAt}. Sessions: ${report.sessionCount}${report.since ? ` since ${report.since}` : ''}.`]
  if (report.lowData) lines.push('', `**Low data:** fewer than ${LOW_DATA_SESSIONS} sessions, so the ranking is a hint, not a measurement.`)
  if (report.missing.length) lines.push('', `**Field not found:** ${report.missing.join('; ')}. The numbers that depend on it are not zero; they are unknown.`)
  if (report.unreadable.length) lines.push('', `**Not read:** ${report.unreadable.length} session logs could not be read and are left out: ${report.unreadable.join(', ')}.`)
  if (report.oddNames) lines.push('', `**Skipped:** ${report.oddNames} log files whose names are not session ids.`)
  if (report.unparsedLines) lines.push('', `**Broken lines:** ${report.unparsedLines} lines could not be parsed and were skipped.`)
  lines.push('', 'Weighted tokens price each token against one new input token (cache read 0.1, cache write 1.25, output 5). The basis "usage" means billed numbers from the log; "estimate" means a result-size estimate: written once into context, then re-read on each later reply until a compaction or the end of the log. Ranks across the two bases are a guide only. Minutes and counts do not compare with tokens, so each has its own table.')
  lines.push('', '## Ranked by weighted tokens', '', '| Signal | Basis | Weighted tokens | Count |', '|---|---|---:|---:|')
  for (const s of report.signals.filter(x => x.weightedTokens > 0)) lines.push(`| ${s.signal} | ${s.basis} | ${fmt(s.weightedTokens)} | ${fmt(s.count)} |`)
  lines.push('', '## Ranked by minutes', '', '| Signal | Minutes | Count |', '|---|---:|---:|')
  for (const s of report.signals.filter(x => x.minutes > 0).sort((a, b) => b.minutes - a.minutes)) lines.push(`| ${s.signal} | ${fmt(s.minutes)} | ${fmt(s.count)} |`)
  lines.push('', '## Counts only', '', '| Signal | Count |', '|---|---:|')
  for (const s of report.signals.filter(x => !x.weightedTokens && !x.minutes).sort((a, b) => b.count - a.count)) lines.push(`| ${s.signal} | ${fmt(s.count)} |`)
  const byType = newMap()
  for (const x of report.sessions) {
    for (const [t, v] of Object.entries(x.subagents.byType)) {
      byType[t] ??= { runs: 0, weightedTokens: 0, toolCalls: 0, editCalls: 0 }
      for (const f of Object.keys(byType[t])) byType[t][f] += v[f] || 0
    }
  }
  if (Object.keys(byType).length) {
    lines.push('', '## Subagents by type', '', 'A type with few tool calls and few edits per run did work the main conversation could have done. These tokens are already in "subagent runs" above, and subagent results also count in the pattern and repeat rows, so the rows overlap and do not add up.', '', '| Type | Runs | Weighted tokens | Tool calls per run | Edits per run |', '|---|---:|---:|---:|---:|')
    for (const [t, v] of Object.entries(byType).sort((a, b) => b[1].weightedTokens - a[1].weightedTokens)) {
      lines.push(`| ${t} | ${v.runs} | ${fmt(v.weightedTokens)} | ${fmt(round(v.toolCalls / v.runs))} | ${fmt(round(v.editCalls / v.runs))} |`)
    }
  }
  lines.push('', '## Per session', '', '| Session | Start | Active min | Main tokens (weighted) | Subagents | Subagent tokens (weighted) | Questions | Compactions | Goal not met | Re-reads | Reruns |', '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|')
  for (const s of report.sessions) {
    lines.push(`| ${s.id.slice(0, 8)} | ${(s.start || '').slice(0, 10)} | ${fmt(s.activeMinutes)} | ${fmt(s.mainWeightedTokens)} | ${s.subagents.runs} | ${fmt(s.subagents.weightedTokens)} | ${s.askRounds} | ${s.compactions} | ${s.goalUnmet} | ${s.repeatReads} | ${s.repeatCommands} |`)
  }
  if (report.comparison) {
    const c = report.comparison
    lines.push('', '## Compared with the last run', '', `Sessions: ${c.sessionsBefore} before, ${c.sessionsAfter} after${c.since ? ` (started since ${c.since})` : ''}.`)
    if (c.labelsNotCompared.length) lines.push('', `Pattern labels used in only one run, so not compared: ${c.labelsNotCompared.join(', ')}.`)
    lines.push('', '| Metric | Before | After | Change |', '|---|---:|---:|---:|')
    for (const r of c.rows) lines.push(`| ${r.metric} | ${fmt(r.before)} | ${fmt(r.after)} | ${r.change} |`)
  }
  return lines.join('\n') + '\n'
}

// Refuses to write through a link, which could send the report outside the
// project, and creates the folder the report goes into.
function writeOut(file, text) {
  const target = path.resolve(file)
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true })
  } catch (e) { throw new ExitError(4, `could not create the folder for ${file} (${e.code || e.name})`) }
  const linked = p => { try { return !fs.lstatSync(p).isFile() } catch { return false } }
  if (fs.lstatSync(path.dirname(target)).isSymbolicLink() || linked(target)) throw new InputError(`${file} is a link or not a plain file; pass a plain file path`)
  try { fs.writeFileSync(target, text) } catch (e) { throw new ExitError(4, `could not write ${file} (${e.code || e.name})`) }
}

async function main() {
  try {
    const opts = parseArgs(process.argv.slice(2))
    if (opts.help) { process.stdout.write(USAGE); return }
    const { dir, total, report } = await scan(opts)
    if (total === 0) throw new ExitError(1, `no Claude Code session logs found in ${dir}`)
    if (report.sessionCount === 0 && report.unreadable.length) throw new ExitError(4, `${report.unreadable.length} session logs in ${dir} could not be read, and no other session is left`)
    if (report.sessionCount === 0) throw new ExitError(3, `${total} session logs found in ${dir}, but --since or --exclude left none`)
    if (opts.out) writeOut(opts.out, JSON.stringify(report, null, 2) + '\n')
    if (opts.md) writeOut(opts.md, toMarkdown(report))
    const byTokens = report.signals.filter(s => s.weightedTokens > 0).slice(0, 5).map(s => `  ${s.signal}: ${fmt(s.weightedTokens)} weighted tokens (${s.basis}), ${fmt(s.count)}x`)
    const byMinutes = report.signals.filter(s => s.minutes > 0).sort((a, b) => b.minutes - a.minutes).slice(0, 5).map(s => `  ${s.signal}: ${fmt(s.minutes)} min, ${fmt(s.count)}x`)
    const notes = [`missing fields: ${report.missing.length ? report.missing.join('; ') : 'none'}`]
    if (report.unreadable.length) notes.push(`not read: ${report.unreadable.join(', ')}`)
    if (report.unparsedLines) notes.push(`broken lines skipped: ${report.unparsedLines}`)
    process.stdout.write([`sessions: ${report.sessionCount}${report.lowData ? ' (low data)' : ''}`, ...notes, 'top by weighted tokens:', ...byTokens, 'top by minutes:', ...byMinutes].join('\n') + '\n')
  } catch (e) {
    // Messages are fixed text, checked labels, and paths the caller passed;
    // an unexpected error names only its kind, so no log content is echoed.
    const known = e instanceof ExitError || e instanceof InputError
    process.stderr.write(`cut-waste: ${known ? e.message : `the scan failed (${e.name}); no report was written`}\n`)
    // exitCode, not exit(), so the message is not cut off when stderr is a pipe.
    process.exitCode = e instanceof ExitError ? e.code : e instanceof InputError ? 2 : 4
  }
}

const self = fileURLToPath(import.meta.url)
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(self)) main()
