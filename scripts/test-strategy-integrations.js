#!/usr/bin/env node

var fs = require('fs')
var path = require('path')

var repoRoot = path.resolve(__dirname, '..')
var manifestPath = path.join(repoRoot, 'neue Strategien und Scripte', 'integration-manifest.json')

function exists(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.F_OK)
    return true
  }
  catch (err) {
    return false
  }
}

function readManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
}

function formatStatus(entry, sourceExists, targetExists) {
  var parts = ['[' + entry.status + ']', entry.id]
  parts.push('source=' + (sourceExists ? 'ok' : 'missing'))
  if (entry.targetPath) {
    parts.push('target=' + (targetExists ? 'ok' : 'missing'))
  }
  return parts.join(' ')
}

function main() {
  if (!exists(manifestPath)) {
    console.error('Integration manifest not found: ' + manifestPath)
    process.exit(1)
  }

  var manifest = readManifest()
  var entries = Array.isArray(manifest.entries) ? manifest.entries : []
  var failures = []

  console.log('Checking strategy integration manifest:')
  console.log('  ' + manifestPath)

  entries.forEach(function (entry) {
    var sourcePath = path.join(repoRoot, entry.sourcePath)
    var targetPath = entry.targetPath ? path.join(repoRoot, entry.targetPath) : ''
    var sourceExists = exists(sourcePath)
    var targetExists = targetPath ? exists(targetPath) : false

    console.log(formatStatus(entry, sourceExists, targetExists))

    if (!sourceExists) {
      failures.push('Missing source for ' + entry.id + ': ' + sourcePath)
    }

    if (entry.status === 'integrated' && !entry.targetPath) {
      failures.push('Integrated entry without targetPath: ' + entry.id)
    }

    if (entry.status === 'integrated' && entry.targetPath && !targetExists) {
      failures.push('Missing target for ' + entry.id + ': ' + targetPath)
    }
  })

  if (failures.length) {
    console.error('\nIntegration verification failed:')
    failures.forEach(function (failure) {
      console.error('- ' + failure)
    })
    process.exit(1)
  }

  console.log('\nStrategy integration manifest is consistent.')
}

main()
