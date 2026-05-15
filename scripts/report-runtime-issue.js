#!/usr/bin/env node

var fs = require('fs')
var path = require('path')

var repoRoot = path.resolve(__dirname, '..')
var logsDir = path.join(repoRoot, 'logs')
var jsonlPath = path.join(logsDir, 'runtime-issues.jsonl')
var mdPath = path.join(logsDir, 'runtime-issues.md')

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }
}

function parseArgs(argv) {
  var result = {}
  for (var i = 2; i < argv.length; i++) {
    var arg = argv[i]
    if (arg.indexOf('--') !== 0) continue
    var key = arg.slice(2)
    var next = argv[i + 1]
    if (!next || next.indexOf('--') === 0) {
      result[key] = true
      continue
    }
    result[key] = next
    i++
  }
  return result
}

function appendMarkdown(entry) {
  var lines = [
    '## ' + entry.timestamp + ' - ' + entry.category,
    '',
    '- Title: ' + entry.title,
    '- Severity: ' + entry.severity,
    '- Command: `' + entry.command + '`',
    '- Exit code: ' + entry.exitCode,
    '- Duration ms: ' + entry.durationMs,
    '- CWD: `' + entry.cwd + '`',
    '- Log file: `' + entry.logFile + '`',
    '- Notes: ' + entry.notes,
    ''
  ]
  fs.appendFileSync(mdPath, lines.join('\n'))
}

function main() {
  ensureLogsDir()
  var args = parseArgs(process.argv)
  var entry = {
    timestamp: new Date().toISOString(),
    category: args.category || 'runtime',
    severity: args.severity || 'medium',
    title: args.title || 'Runtime issue',
    command: args.command || '',
    exitCode: args.exitCode != null ? Number(args.exitCode) : -1,
    durationMs: args.durationMs != null ? Number(args.durationMs) : 0,
    cwd: args.cwd || repoRoot,
    logFile: args.logFile || '',
    notes: args.notes || ''
  }

  fs.appendFileSync(jsonlPath, JSON.stringify(entry) + '\n')
  appendMarkdown(entry)
  console.log('Runtime issue recorded in ' + jsonlPath)
}

main()
