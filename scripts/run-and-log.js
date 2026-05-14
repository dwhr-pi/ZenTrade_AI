#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn

var args = process.argv.slice(2)

if (args.length < 2) {
  console.error('Usage: node ./scripts/run-and-log.js <log-file-name> <command> [args...]')
  process.exit(1)
}

var logFileName = args.shift()
var command = args.shift()
var commandArgs = args
var repoRoot = path.resolve(__dirname, '..')
var logsDir = path.join(repoRoot, 'logs')
var logPath = path.join(logsDir, logFileName)

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

var child = spawn(command, commandArgs, {
  cwd: repoRoot,
  stdio: ['ignore', 'pipe', 'pipe']
})

child.stdout.on('data', function (chunk) {
  process.stdout.write(chunk)
  fs.appendFileSync(logPath, chunk)
})

child.stderr.on('data', function (chunk) {
  process.stderr.write(chunk)
  fs.appendFileSync(logPath, chunk)
})

child.on('close', function (code) {
  fs.appendFileSync(logPath, '\nExit code: ' + code + '\n\n')
  process.exit(code)
})

child.on('error', function (err) {
  fs.appendFileSync(logPath, '\nExecution error: ' + err.message + '\n\n')
  console.error(err.message)
  process.exit(1)
})
