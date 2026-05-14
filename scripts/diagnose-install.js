#!/usr/bin/env node

var fs = require('fs')
var os = require('os')
var path = require('path')

var repoRoot = path.resolve(__dirname, '..')
var logsDir = path.join(repoRoot, 'logs')
var outputPath = path.join(logsDir, 'env-check.log')
var shouldWrite = process.argv.indexOf('--write') >= 0

function exists(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.F_OK)
    return true
  }
  catch (err) {
    return false
  }
}

function readPackageScripts() {
  var packagePath = path.join(repoRoot, 'package.json')
  if (!exists(packagePath)) return {}
  try {
    return JSON.parse(fs.readFileSync(packagePath, 'utf8')).scripts || {}
  }
  catch (err) {
    return { error: err.message }
  }
}

function collect() {
  return {
    timestamp: new Date().toISOString(),
    cwd: repoRoot,
    platform: process.platform,
    release: os.release(),
    arch: process.arch,
    nodeVersion: process.version,
    cpus: os.cpus() ? os.cpus().length : null,
    memoryGb: Math.round((os.totalmem() / (1024 * 1024 * 1024)) * 100) / 100,
    packageLock: exists(path.join(repoRoot, 'package-lock.json')),
    nodeModules: exists(path.join(repoRoot, 'node_modules')),
    logsDir: exists(logsDir),
    csvConf: exists(path.join(repoRoot, 'conf-examples', 'csv.conf.js')),
    sqlConf: exists(path.join(repoRoot, 'conf-examples', 'sql.conf.js')),
    mongoConf: exists(path.join(repoRoot, 'conf-examples', 'mongo.conf.js')),
    integrationManifest: exists(path.join(repoRoot, 'neue Strategien und Scripte', 'integration-manifest.json')),
    packageScripts: readPackageScripts()
  }
}

var report = collect()
var text = JSON.stringify(report, null, 2)

console.log(text)

if (shouldWrite) {
  if (!exists(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }
  fs.writeFileSync(outputPath, text + '\n')
  console.log('\nWritten to ' + outputPath)
}
