#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn

var args = process.argv.slice(2)
if (args.length < 4) {
  console.error('Usage: node ./scripts/run-and-report.js <log-file> <category> <warn-ms> <command> [args...]')
  process.exit(1)
}

var logFileName = args.shift()
var category = args.shift()
var warnMs = Number(args.shift()) || 0
var command = args.shift()
var commandArgs = args
var repoRoot = path.resolve(__dirname, '..')
var logsDir = path.join(repoRoot, 'logs')
var logPath = path.join(logsDir, logFileName)
var start = Date.now()

if (process.platform === 'win32' && command === 'npm') {
  command = 'npm.cmd'
}

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

var header = [
  '============================================================',
  'Timestamp: ' + new Date().toISOString(),
  'CWD: ' + repoRoot,
  'Command: ' + [command].concat(commandArgs).join(' '),
  '============================================================',
  ''
].join('\n')
fs.appendFileSync(logPath, header)

var combinedOutput = ''
var child = spawn(command, commandArgs, {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe']
})

function handleChunk(chunk, writer) {
  var text = chunk.toString()
  combinedOutput += text
  writer.write(chunk)
  fs.appendFileSync(logPath, chunk)
}

function reportIssue(issueCategory, severity, title, exitCode, durationMs, notes) {
  var reporter = path.join(repoRoot, 'scripts', 'report-runtime-issue.js')
  spawn(process.execPath, [
    reporter,
    '--category', issueCategory,
    '--severity', severity,
    '--title', title,
    '--command', [command].concat(commandArgs).join(' '),
    '--exitCode', String(exitCode),
    '--durationMs', String(durationMs),
    '--cwd', repoRoot,
    '--logFile', logPath,
    '--notes', notes
  ], {
    cwd: repoRoot,
    stdio: 'ignore',
    detached: false
  })
}

child.stdout.on('data', function (chunk) {
  handleChunk(chunk, process.stdout)
})

child.stderr.on('data', function (chunk) {
  handleChunk(chunk, process.stderr)
})

child.on('close', function (code) {
  var durationMs = Date.now() - start
  fs.appendFileSync(logPath, '\nExit code: ' + code + '\nDuration ms: ' + durationMs + '\n\n')

  if (code !== 0) {
    var notes = combinedOutput.slice(-1500)
    reportIssue(category || 'crash', 'high', 'Command failed', code, durationMs, notes)
  }
  else if (warnMs > 0 && durationMs >= warnMs) {
    reportIssue('latency', 'medium', 'Command exceeded latency threshold', code, durationMs, 'Duration exceeded ' + warnMs + ' ms')
  }

  process.exit(code)
})

child.on('error', function (err) {
  var durationMs = Date.now() - start
  fs.appendFileSync(logPath, '\nExecution error: ' + err.message + '\nDuration ms: ' + durationMs + '\n\n')
  reportIssue(category || 'compatibility', 'high', 'Command execution error', 1, durationMs, err.message)
  console.error(err.message)
  process.exit(1)
})
