#!/usr/bin/env node

var fs = require('fs')
var path = require('path')

var repoRoot = path.resolve(__dirname, '..')
var defaultSignalPath = path.join(repoRoot, 'data', 'signals', 'copy-trading-signal.example.json')
var signalArg = process.argv[2]
var signalPath = signalArg ? path.resolve(process.cwd(), signalArg) : defaultSignalPath

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !value.trim()) return false
  var time = Date.parse(value)
  return !isNaN(time)
}

function validateEntry(payload, label) {
  var errors = []
  var warnings = []
  var allowed = ['buy', 'sell', 'hold']
  var prefix = label ? label + ': ' : ''

  if (allowed.indexOf(payload.signal) === -1) {
    errors.push(prefix + '`signal` must be one of: buy, sell, hold.')
  }

  if (payload.side != null && allowed.indexOf(payload.side) === -1) {
    errors.push(prefix + '`side` must be one of: buy, sell, hold when provided.')
  }

  if (typeof payload.confidence !== 'number' || payload.confidence < 0 || payload.confidence > 1) {
    errors.push(prefix + '`confidence` must be a number between 0 and 1.')
  }

  if (payload.timestamp != null && !isIsoDate(payload.timestamp)) {
    errors.push(prefix + '`timestamp` must be a valid date-time string when provided.')
  }

  if (payload.expires_at != null && !isIsoDate(payload.expires_at)) {
    errors.push(prefix + '`expires_at` must be a valid date-time string when provided.')
  }

  if (payload.timestamp && payload.expires_at) {
    var start = Date.parse(payload.timestamp)
    var end = Date.parse(payload.expires_at)
    if (!isNaN(start) && !isNaN(end) && end < start) {
      errors.push(prefix + '`expires_at` must be later than or equal to `timestamp`.')
    }
  }

  if (payload.symbol != null && (typeof payload.symbol !== 'string' || !payload.symbol.trim())) {
    errors.push(prefix + '`symbol` must be a non-empty string when provided.')
  }

  if (payload.source != null && (typeof payload.source !== 'string' || !payload.source.trim())) {
    errors.push(prefix + '`source` must be a non-empty string when provided.')
  }

  if (payload.reasoning != null && typeof payload.reasoning !== 'string') {
    errors.push(prefix + '`reasoning` must be a string when provided.')
  }

  if (payload.tags != null) {
    if (!Array.isArray(payload.tags)) {
      errors.push(prefix + '`tags` must be an array of strings when provided.')
    }
    else if (payload.tags.some(function (tag) { return typeof tag !== 'string' || !tag.trim() })) {
      errors.push(prefix + '`tags` must contain only non-empty strings.')
    }
  }

  if (payload.side && payload.signal && payload.side !== payload.signal) {
    warnings.push(prefix + '`side` differs from `signal`; strategy execution uses `side` when present.')
  }

  return { errors: errors, warnings: warnings }
}

function validate(payload) {
  var errors = []
  var warnings = []

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    errors.push('Signal file must contain either a signal object or an object with a `signals` array.')
    return { errors: errors, warnings: warnings }
  }

  if (Array.isArray(payload.signals)) {
    if (!payload.signals.length) {
      errors.push('`signals` must contain at least one scenario entry.')
      return { errors: errors, warnings: warnings }
    }

    var previousTime = null
    payload.signals.forEach(function (entry, index) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push('signals[' + index + ']: each entry must be a JSON object.')
        return
      }

      var result = validateEntry(entry, 'signals[' + index + ']')
      errors = errors.concat(result.errors)
      warnings = warnings.concat(result.warnings)

      if (entry.timestamp && isIsoDate(entry.timestamp)) {
        var currentTime = Date.parse(entry.timestamp)
        if (previousTime != null && currentTime < previousTime) {
          warnings.push('signals[' + index + ']: timestamp is earlier than the previous scenario entry.')
        }
        previousTime = currentTime
      }
    })

    return { errors: errors, warnings: warnings }
  }

  return validateEntry(payload)
}

function main() {
  if (!fs.existsSync(signalPath)) {
    console.error('Signal file not found: ' + signalPath)
    process.exit(1)
  }

  var payload
  try {
    payload = readJson(signalPath)
  }
  catch (err) {
    console.error('Invalid JSON in signal file: ' + err.message)
    process.exit(1)
  }

  var result = validate(payload)

  console.log('Signal file: ' + signalPath)
  if (result.warnings.length) {
    console.log('\nWarnings:')
    result.warnings.forEach(function (warning) {
      console.log('- ' + warning)
    })
  }

  if (result.errors.length) {
    console.error('\nValidation failed:')
    result.errors.forEach(function (error) {
      console.error('- ' + error)
    })
    process.exit(1)
  }

  console.log('\nSignal format is valid.')
}

main()
