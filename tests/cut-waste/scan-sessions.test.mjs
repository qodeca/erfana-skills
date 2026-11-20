// SPDX-FileCopyrightText: 2025-2026 Qodeca sp. z o.o.
// SPDX-License-Identifier: GPL-3.0-only
//
// Fixture tests for skills/cut-waste/scripts/scan-sessions.mjs, run by Gate 21.
// Each test builds made-up session logs with known waste in a temporary folder
// and runs the real script as a process. A canary string planted in message
// text, tool input, and tool output must never appear in anything it writes.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compare, slugFor, weightedTokens } from '../../skills/cut-waste/scripts/scan-sessions.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const SCRIPT = path.join(here, '../../skills/cut-waste/scripts/scan-sessions.mjs')
const CANARY = 'CANARY-7731-do-not-print'

const T0 = Date.parse('2026-11-01T10:00:00Z')
const at = sec => new Date(T0 + sec * 1000).toISOString()
const usage = (i, cw, cr, o) => ({ input_tokens: i, cache_creation_input_tokens: cw, cache_read_input_tokens: cr, output_tokens: o })

function assistant(sec, id, blocks, u = usage(10, 100, 1000, 20)) {
  // One line per content block, each repeating the usage, as Claude Code logs it.
  return blocks.map(b => ({ type: 'assistant', timestamp: at(sec), version: '9.9.9', message: { id, role: 'assistant', usage: u, content: [b] } }))
}
const toolUse = (id, name, input) => ({ type: 'tool_use', id, name, input })
const result = (sec, id, content, isError = false) => ({ type: 'user', timestamp: at(sec), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content, is_error: isError }] } })

function mainSession() {
  return [
    { type: 'user', timestamp: at(0), message: { role: 'user', content: `please fix ${CANARY}` } },
    ...assistant(1, 'm1', [{ type: 'text', text: `thinking about ${CANARY}` }, toolUse('t1', 'Bash', { command: `pnpm gate # ${CANARY}` })]),
    result(61, 't1', `gate output ${CANARY} `.repeat(10)),
    ...assistant(62, 'm2', [toolUse('t2', 'Bash', { command: `pnpm gate # ${CANARY}` })]),
    result(122, 't2', 'x'.repeat(400)),
    ...assistant(123, 'm3', [toolUse('t3', 'Read', { file_path: '/p/a.md' })]),
    result(124, 't3', 'y'.repeat(80)),
    ...assistant(125, 'm4', [toolUse('t4', 'Read', { file_path: '/p/a.md' })]),
    result(126, 't4', 'y'.repeat(80)),
    ...assistant(127, 'm5', [toolUse('t5', 'AskUserQuestion', { questions: [{ question: CANARY }] })]),
    result(427, 't5', `answer ${CANARY}`),
    ...assistant(428, 'm6', [toolUse('t6', 'Agent', { prompt: CANARY })]),
    result(500, 't6', 'done'),
    ...assistant(501, 'm7', [toolUse('t7', 'mcp__chrome-devtools__take_screenshot', {})]),
    result(503, 't7', [{ type: 'image', source: { type: 'base64', data: 'AAAA' } }]),
    ...assistant(504, 'm8', [toolUse('t8', 'Bash', { command: 'false' })]),
    result(505, 't8', 'boom', true),
    // The same failing call again: a repeated error and a rerun.
    ...assistant(506, 'm9', [toolUse('t9', 'Bash', { command: 'false' })]),
    result(507, 't9', 'boom', true),
    // After an edit, reading the file and running the suite again are not waste.
    ...assistant(508, 'm10', [toolUse('t10', 'Edit', { file_path: '/p/a.md', old_string: CANARY, new_string: CANARY })]),
    result(509, 't10', 'ok'),
    ...assistant(510, 'm11', [toolUse('t11', 'Read', { file_path: '/p/a.md' })]),
    result(511, 't11', 'y'.repeat(80)),
    ...assistant(512, 'm12', [toolUse('t12', 'Bash', { command: `pnpm gate # ${CANARY}` })]),
    result(572, 't12', 'ok'),
    { type: 'attachment', timestamp: at(573), attachment: { type: 'goal_status', met: false, condition: CANARY } },
    { type: 'attachment', timestamp: at(574), attachment: { type: 'goal_status', met: true, condition: CANARY } },
    { type: 'system', subtype: 'compact_boundary', timestamp: at(575) },
    // After a compaction the old read is gone, so this is not a repeat.
    ...assistant(576, 'm13', [toolUse('t13', 'Read', { file_path: '/p/a.md' })]),
    result(577, 't13', 'y'.repeat(80)),
    // Polling the same state is not a rerun.
    ...assistant(578, 'm14', [toolUse('t14', 'Bash', { command: 'git status' })]),
    result(579, 't14', 'clean'),
    ...assistant(580, 'm15', [toolUse('t15', 'Bash', { command: 'git status' })]),
    result(581, 't15', 'clean'),
    // A state change makes the next run of a command legitimate.
    ...assistant(582, 'm16', [toolUse('t16', 'Bash', { command: 'pnpm test' })]),
    result(583, 't16', 'ok'),
    ...assistant(584, 'm17', [toolUse('t17', 'Bash', { command: 'git pull' })]),
    result(585, 't17', 'ok'),
    ...assistant(586, 'm18', [toolUse('t18', 'Bash', { command: 'pnpm test' })]),
    result(587, 't18', 'ok'),
    { type: 'system', subtype: 'turn_duration', durationMs: 600000, timestamp: at(600) },
  ]
}

function subagent() {
  return [
    ...assistant(430, 's1', [toolUse('u1', 'Read', { file_path: '/p/b.md' })], usage(5, 50, 500, 10)),
    result(431, 'u1', 'z'.repeat(40)),
    ...assistant(432, 's2', [toolUse('u2', 'Bash', { command: 'pnpm lint' })], usage(5, 50, 500, 10)),
    result(433, 'u2', 'a'),
    ...assistant(434, 's3', [toolUse('u3', 'Bash', { command: 'pnpm lint' })], usage(5, 50, 500, 10)),
    result(435, 'u3', 'a'),
    ...assistant(436, 's4', [toolUse('u4', `odd ${CANARY}\n<b>`, {})], usage(5, 50, 500, 10)),
    result(437, 'u4', 'a'),
  ]
}

const made = []
process.on('exit', () => { for (const d of made) fs.rmSync(d, { recursive: true, force: true }) })

const write = (file, records) => fs.writeFileSync(file, records.map(r => JSON.stringify(r)).join('\n') + '\n')

function fixture({ withOld = false, bare = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cut-waste-'))
  made.push(dir)
  const projects = path.join(dir, 'projects')
  fs.mkdirSync(projects)
  write(path.join(projects, 'aaaa1111.jsonl'), mainSession())
  fs.mkdirSync(path.join(projects, 'aaaa1111', 'subagents'), { recursive: true })
  write(path.join(projects, 'aaaa1111', 'subagents', 'agent-x.jsonl'), subagent())
  fs.writeFileSync(path.join(projects, 'aaaa1111', 'subagents', 'agent-x.meta.json'), JSON.stringify({ agentType: 'Explore', description: CANARY }))
  if (withOld) {
    write(path.join(projects, 'bbbb2222.jsonl'), [{ type: 'user', timestamp: '2026-01-01T00:00:00Z', message: { role: 'user', content: 'old' } }])
  }
  if (bare) {
    fs.rmSync(projects, { recursive: true })
    fs.mkdirSync(projects)
    write(path.join(projects, 'cccc3333.jsonl'), [{ type: 'user', message: { role: 'user', content: CANARY } }])
    fs.appendFileSync(path.join(projects, 'cccc3333.jsonl'), `{"broken ${CANARY}\n`)
  }
  const patterns = path.join(dir, 'patterns.json')
  fs.writeFileSync(patterns, JSON.stringify({ commands: [{ label: 'full check suite', match: '\\bpnpm gate\\b' }], tools: [{ label: 'browser screenshot', match: 'take_screenshot' }] }))
  return { dir, projects, patterns, out: path.join(dir, 'r.json'), md: path.join(dir, 'r.md') }
}

function run(args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' })
  return { code: r.status, stdout: r.stdout, stderr: r.stderr }
}

function scanOk(f, extra = []) {
  const r = run(['--project-dir', f.projects, '--patterns', f.patterns, '--out', f.out, '--md', f.md, ...extra])
  assert.equal(r.code, 0, r.stderr)
  return { r, report: JSON.parse(fs.readFileSync(f.out, 'utf8')), md: fs.readFileSync(f.md, 'utf8') }
}

test('ranks tokens, minutes, and counts in separate tables', () => {
  const { md } = scanOk(fixture())
  assert.match(md, /## Ranked by weighted tokens/)
  assert.match(md, /## Ranked by minutes\n\n[^\n]+\n[^\n]+\n\| owner question rounds \(minutes include user time\) \| 5 \| 1 \|/)
  assert.match(md, /## Subagents by type[\s\S]*\| Explore \| 1 \|/)
  assert.match(md, /## Counts only/)
})

test('counts the planted waste', () => {
  const f = fixture()
  const { report } = scanOk(f)
  const s = report.sessions[0]
  assert.equal(report.sessionCount, 1)
  assert.equal(report.lowData, true)
  assert.deepEqual(report.missing, [])
  // Eighteen replies, each counted once although some are logged on two lines.
  assert.equal(s.tokens.input, 180)
  // 180 x 1 + 1800 x 1.25 + 18000 x 0.1 + 360 x 5
  assert.equal(s.mainWeightedTokens, 6030)
  assert.equal(weightedTokens(s.tokens), 6030)
  assert.equal(s.subagents.byType.Explore.toolCalls, 4)
  assert.equal(s.subagents.byType.Explore.editCalls, 0)
  // One image, priced at the cap. It came after reply 7, and 5 replies follow
  // before the compaction: the first writes it, 4 re-read it. 1,600 x (1.25 + 0.1 x 4).
  assert.equal(s.labels['browser screenshot'].weightedTokens, 2640)
  assert.equal(s.tools['mcp__chrome-devtools__take_screenshot'].weightedTokens, 2640)
  assert.equal(s.subagents.runs, 1)
  assert.equal(s.subagents.byType.Explore.runs, 1)
  assert.equal(s.subagents.tokens, 4 * 565)
  assert.equal(s.askRounds, 1)
  assert.equal(s.askMinutes, 5)
  assert.equal(s.agentCalls, 1)
  assert.equal(s.labels['full check suite'].count, 3)
  assert.equal(s.labels['full check suite'].minutes, 3)
  assert.equal(s.labels['browser screenshot'].images, 1)
  // Main: the second pnpm gate and the second false. Subagent: the second pnpm lint.
  assert.equal(s.repeatCommands, 3)
  // The rerun result (100 tokens) came after reply 2; 10 replies follow before
  // the compaction: 100 x (1.25 + 9 x 0.1) = 215. The repeated false (1 token,
  // 3 later replies) rounds to 1. The subagent lint (0 tokens) costs nothing.
  assert.equal(s.repeatCommandWeighted, 216)
  // Only the read before the edit repeats; the reads after the edit and after
  // the compaction do not.
  assert.equal(s.repeatReads, 1)
  assert.equal(s.repeatReadTokens, 20)
  assert.equal(s.goalChecks, 2)
  assert.equal(s.goalUnmet, 1)
  assert.equal(s.compactions, 1)
  assert.equal(s.toolErrors, 2)
  assert.equal(s.repeatErrors, 1)
  assert.equal(s.activeMinutes, 10)
  assert.equal(s.tools.other.count, 1)
  assert.equal(s.tools.Read.count, 5)
  const tokens = report.signals.map(x => x.weightedTokens)
  assert.deepEqual(tokens, [...tokens].sort((x, y) => y - x))
})

test('never writes content from the logs', () => {
  const f = fixture()
  const { r, md } = scanOk(f)
  for (const text of [r.stdout, r.stderr, fs.readFileSync(f.out, 'utf8'), md]) assert.ok(!text.includes(CANARY))
})

test('reports missing fields instead of zeros, and survives a broken line', () => {
  const f = fixture({ bare: true })
  const { report, md } = scanOk(f)
  assert.ok(report.missing.some(m => m.startsWith('message.usage')))
  assert.ok(report.missing.some(m => m.startsWith('timestamp')))
  assert.ok(report.missing.some(m => m.startsWith('system turn_duration')))
  assert.equal(report.sessions[0].unparsedLines, 1)
  assert.match(md, /Field not found/)
})

test('--since and --exclude filter sessions', () => {
  const f = fixture({ withOld: true })
  assert.equal(scanOk(f).report.sessionCount, 2)
  assert.equal(scanOk(f, ['--since', '2026-06-01']).report.sessionCount, 1)
  // A session that started before --since is left out, even if it ran past it.
  // Logs exist but none is left: exit 3, not "no logs".
  const r = run(['--project-dir', f.projects, '--since', '2026-11-01T10:05:00Z', '--exclude', 'bbbb2222'])
  assert.equal(r.code, 3)
  assert.match(r.stderr, /2 session logs found/)
  assert.equal(scanOk(f, ['--exclude', 'aaaa1111']).report.sessions[0].id, 'bbbb2222')
})

test('--compare shows the change per session', () => {
  const f = fixture()
  const prev = path.join(f.dir, 'prev.json')
  scanOk(f)
  fs.copyFileSync(f.out, prev)
  const { report, md } = scanOk(f, ['--compare', prev])
  const ask = report.comparison.rows.find(c => c.metric === 'askRounds per session')
  assert.deepEqual([ask.before, ask.after, ask.change], [1, 1, '0%'])
  const shot = report.comparison.rows.find(c => c.metric === 'pattern: browser screenshot weighted tokens per session')
  assert.equal(shot.before, 2640)
  const none = report.comparison.rows.find(c => c.metric === 'repeatReadWeighted per session')
  assert.ok(none)
  assert.deepEqual([report.comparison.sessionsBefore, report.comparison.sessionsAfter], [1, 1])
  assert.match(md, /Sessions: 1 before, 1 after/)
  // Both sides zero reads as no change, not as new.
  const prevZero = path.join(f.dir, 'zero.json')
  const z = JSON.parse(fs.readFileSync(prev, 'utf8'))
  z.sessions[0].compactions = 0
  fs.writeFileSync(prevZero, JSON.stringify(z))
  assert.equal(scanOk(f, ['--compare', prevZero]).report.comparison.rows.find(c => c.metric === 'compactions per session').change, 'new')
  const empty = { sessions: [{ subagents: { runs: 0, weightedTokens: 0 }, labels: {} }] }
  assert.ok(compare(empty, empty).rows.every(c => c.change === 'no change'))
})

test('exit codes: 1 with no logs, 2 on bad input', () => {
  const f = fixture()
  assert.equal(run(['--project-dir', path.join(f.dir, 'nothing-here')]).code, 1)
  assert.equal(run([]).code, 2)
  assert.equal(run(['--project-dir']).code, 2)
  assert.equal(run(['--project-dir', f.projects, '--bogus', 'x']).code, 2)
  assert.equal(run(['--project-dir', f.projects, '--since', 'not-a-date']).code, 2)
  const bad = path.join(f.dir, 'bad.json')
  fs.writeFileSync(bad, JSON.stringify({ commands: [{ label: `${CANARY}\n<script>`, match: 'x' }] }))
  const r = run(['--project-dir', f.projects, '--patterns', bad])
  assert.equal(r.code, 2)
  assert.ok(!r.stderr.includes(CANARY))
  const long = path.join(f.dir, 'long.json')
  fs.writeFileSync(long, JSON.stringify({ commands: [{ label: 'too long', match: 'a'.repeat(201) }] }))
  assert.equal(run(['--project-dir', f.projects, '--patterns', long]).code, 2)
  const nested = path.join(f.dir, 'nested.json')
  fs.writeFileSync(nested, JSON.stringify({ commands: [{ label: 'slow one', match: '(a+)+$' }] }))
  const n = run(['--project-dir', f.projects, '--patterns', nested])
  assert.equal(n.code, 2)
  assert.match(n.stderr, /slow one/)
})

test('--cwd finds the folder Claude Code uses for the project', () => {
  // Windows paths carry a drive letter, which Claude Code keeps in the folder name.
  if (process.platform === 'win32') assert.equal(slugFor('C:\\Users\\me\\my.app'), 'C--Users-me-my-app')
  else assert.equal(slugFor('/Users/me/Projects/my.app'), '-Users-me-Projects-my-app')
  const f = fixture()
  const config = path.join(f.dir, 'config')
  fs.mkdirSync(path.join(config, 'projects'), { recursive: true })
  fs.renameSync(f.projects, path.join(config, 'projects', slugFor('/work/demo')))
  const r = spawnSync(process.execPath, [SCRIPT, '--cwd', '/work/demo'], { encoding: 'utf8', env: { ...process.env, CLAUDE_CONFIG_DIR: config } })
  assert.equal(r.status, 0, r.stderr)
  assert.match(r.stdout, /sessions: 1/)
})

// A project folder with one main log made of the given records.
function single(records, name = 'eeee5555') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cut-waste-'))
  made.push(dir)
  const projects = path.join(dir, 'projects')
  fs.mkdirSync(projects)
  write(path.join(projects, `${name}.jsonl`), records)
  return { dir, projects, patterns: path.join(dir, 'none.json'), out: path.join(dir, 'out', 'r.json'), md: path.join(dir, 'out', 'r.md') }
}
const bash = (n, command, ok = true) => [...assistant(n, `b${n}`, [toolUse(`c${n}`, 'Bash', { command })]), result(n + 1, `c${n}`, 'ok', !ok)]

test('chained commands, failed edits, and odd names count as they should', () => {
  const f = single([
    ...bash(1, 'pnpm test'),
    ...bash(3, 'cd app && pnpm install'),
    ...bash(5, 'pnpm test'),
    // Not polling: the sleep only waits for the full suite.
    ...bash(7, 'sleep 5 && pnpm gate'),
    ...bash(9, 'sleep 5 && pnpm gate'),
    ...bash(11, 'git status | head -5'),
    ...bash(13, 'git status | head -5'),
    ...assistant(15, 'r1', [toolUse('r1', 'Read', { file_path: '/p/c.md' })]),
    result(16, 'r1', 'c'),
    // The edit failed, so the file did not change and the next read repeats.
    ...assistant(17, 'e1', [toolUse('e1', 'Edit', { file_path: '/p/c.md' })]),
    result(18, 'e1', 'no match', true),
    ...assistant(19, 'r2', [toolUse('r2', 'Read', { file_path: '/p/./c.md' })]),
    result(20, 'r2', 'c'),
    ...assistant(21, 'p1', [toolUse('p1', '__proto__', {})]),
    result(22, 'p1', 'x'),
    ...assistant(23, 'n1', [toolUse('n1', 'Note', { command: 'pnpm test' })]),
    result(24, 'n1', 'x'),
    ...assistant(25, 'l1', [toolUse('l1', `mcp__${'a'.repeat(60)}__one`, {})]),
    ...assistant(26, 'l2', [toolUse('l2', `mcp__${'a'.repeat(60)}__two`, {})]),
    { type: 'user', timestamp: at(27), version: `1.0.0 ${CANARY}`, message: { role: 'user', content: 'hi' } },
  ])
  fs.writeFileSync(f.patterns, '{}')
  const { report } = scanOk(f)
  const s = report.sessions[0]
  assert.equal(s.repeatCommands, 1)
  assert.equal(s.repeatReads, 1)
  assert.ok(Object.hasOwn(s.tools, '__proto__'))
  assert.equal(s.tools.__proto__.count, 1)
  // A tool that is not a shell is not matched as one.
  assert.equal(s.tools.Note.count, 1)
  assert.equal(Object.keys(s.tools).filter(k => k.startsWith('mcp__')).length, 2)
  assert.ok(Object.keys(s.tools).every(k => k.length <= 60))
  assert.equal(s.version, '9.9.9')
})

test('fields are judged on the kept sessions, and broken lines are counted everywhere', () => {
  const f = fixture()
  // An old session has active minutes; the kept new one does not.
  write(path.join(f.projects, 'aaaa1111.jsonl'), mainSession().filter(r => r.subtype !== 'turn_duration'))
  write(path.join(f.projects, 'bbbb2222.jsonl'), [{ type: 'system', subtype: 'turn_duration', durationMs: 1000, timestamp: '2026-01-01T00:00:00Z' }])
  fs.appendFileSync(path.join(f.projects, 'aaaa1111', 'subagents', 'agent-x.jsonl'), `{"broken ${CANARY}\n`)
  assert.deepEqual(scanOk(f).report.missing, [])
  const { report, md } = scanOk(f, ['--since', '2026-06-01'])
  assert.ok(report.missing.some(m => m.startsWith('system turn_duration')))
  assert.equal(report.sessions[0].unparsedLines, 1)
  assert.match(md, /Broken lines/)
})

test('an unreadable log is reported, not a crash', () => {
  const f = fixture()
  fs.mkdirSync(path.join(f.projects, 'dddd4444.jsonl'))
  const { report } = scanOk(f)
  assert.deepEqual(report.unreadable, ['dddd4444'])
  assert.equal(report.sessionCount, 1)
  const r = run(['--project-dir', f.projects, '--exclude', 'aaaa1111'])
  assert.equal(r.code, 4)
  assert.match(r.stderr, /could not be read/)
})

test('compare leaves out labels used in only one run', () => {
  const f = fixture()
  const prev = path.join(f.dir, 'prev.json')
  scanOk(f)
  const old = JSON.parse(fs.readFileSync(f.out, 'utf8'))
  old.patternLabels = ['full check suite', 'old name']
  fs.writeFileSync(prev, JSON.stringify(old))
  const c = scanOk(f, ['--compare', prev]).report.comparison
  assert.deepEqual(c.labelsNotCompared, ['browser screenshot', 'old name'])
  assert.ok(!c.rows.some(x => x.metric.includes('browser screenshot')))
  old.sessions[0].labels[`${CANARY}|`] = { count: 1 }
  fs.writeFileSync(prev, JSON.stringify(old))
  const r = run(['--project-dir', f.projects, '--compare', prev])
  assert.equal(r.code, 2)
  assert.ok(!r.stderr.includes(CANARY))
})

test('inputs: flags, times, pattern files, and output paths are checked', () => {
  const f = fixture()
  assert.equal(run(['--help']).code, 0)
  assert.equal(run(['--project-dir', f.projects, '--project-dir', f.projects]).code, 2)
  assert.equal(run(['--project-dir', f.projects, '--since', '2026-06-01T10:00']).code, 2)
  assert.equal(run(['--project-dir', f.projects, '--since', '2026-06-01T10:00Z']).code, 0)
  const pattern = (name, body) => {
    const file = path.join(f.dir, `${name}.json`)
    fs.writeFileSync(file, JSON.stringify(body))
    return run(['--project-dir', f.projects, '--patterns', file]).code
  }
  assert.equal(pattern('typo', { command: [] }), 2)
  assert.equal(pattern('extra', { commands: [{ label: 'x', match: 'x', flags: 'g' }] }), 2)
  for (const slow of ['((a+))+', '(a|aa)+', '.*a.*b.*c']) assert.equal(pattern('slow', { commands: [{ label: 'slow', match: slow }] }), 2, slow)
  for (const fine of ['\\(x+\\)+', '\\bpnpm (run )?gate\\b', '(foo|bar) baz']) assert.equal(pattern('fine', { commands: [{ label: 'fine', match: fine }] }), 0, fine)
  // The output folder is created; a link is refused.
  scanOk({ ...f, out: path.join(f.dir, 'new', 'r.json'), md: path.join(f.dir, 'new', 'r.md') })
  const link = path.join(f.dir, 'link.json')
  // Windows may refuse to make a link without extra rights; then skip this part.
  try { fs.symlinkSync(path.join(f.dir, 'elsewhere.json'), link) } catch { return }
  assert.equal(run(['--project-dir', f.projects, '--out', link]).code, 2)
  assert.ok(!fs.existsSync(path.join(f.dir, 'elsewhere.json')))
})
