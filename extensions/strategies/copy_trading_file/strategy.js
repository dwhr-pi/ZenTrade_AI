var fs = require('fs')
var path = require('path')
var z = require('zero-fill')
var n = require('numbro')
var Phenotypes = require('../../../lib/phenotype')

function resolveSignalFile(signalFile) {
  if (!signalFile) return ''
  if (path.isAbsolute(signalFile)) return signalFile
  return path.resolve(process.cwd(), signalFile)
}

function readSignal(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  }
  catch (err) {
    return { __error: err.message }
  }
}

function normalizeSignal(payload) {
  if (!payload || typeof payload !== 'object') return null

  var signal = payload.signal
  var side = payload.side || signal
  var confidence = typeof payload.confidence === 'number' ? payload.confidence : 0
  var source = payload.source || 'file'
  var timestamp = payload.timestamp || payload.time || null
  var expiresAt = payload.expires_at || null
  var reasoning = payload.reasoning || payload.note || ''
  var symbol = payload.symbol || null
  var tags = Array.isArray(payload.tags) ? payload.tags : []

  if (signal !== 'buy' && signal !== 'sell' && signal !== 'hold') return null
  if (side !== 'buy' && side !== 'sell' && side !== 'hold') return null

  return {
    signal: signal,
    side: side,
    confidence: confidence,
    source: source,
    timestamp: timestamp,
    expires_at: expiresAt,
    reasoning: reasoning,
    symbol: symbol,
    tags: tags
  }
}

function signalAgeSeconds(timestamp) {
  if (!timestamp) return Number.POSITIVE_INFINITY
  var created = new Date(timestamp).getTime()
  if (!created || isNaN(created)) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.floor((Date.now() - created) / 1000))
}

function isExpired(expiresAt) {
  if (!expiresAt) return false
  var expires = new Date(expiresAt).getTime()
  if (!expires || isNaN(expires)) return false
  return Date.now() > expires
}

module.exports = {
  name: 'copy_trading_file',
  description: 'File-based signal strategy for analysis, simulation, and paper trading workflows.',
  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '5m')
    this.option('period_length', 'period length, same as --period', String, '5m')
    this.option('min_periods', 'min. number of history periods', Number, 1)
    this.option('signal_file', 'path to a JSON signal file', String, './data/signals/copy-trading-signal.json')
    this.option('signal_max_age_s', 'maximum accepted age of a signal in seconds', Number, 900)
    this.option('signal_threshold', 'minimum confidence required to act', Number, 0.7)
    this.option('allow_buy', 'allow buy signals from the file', Boolean, true)
    this.option('allow_sell', 'allow sell signals from the file', Boolean, true)
  },
  calculate: function () {},
  onPeriod: function (s, cb) {
    var filePath = resolveSignalFile(s.options.signal_file)
    s.period.signal_file = filePath

    if (!filePath || !fs.existsSync(filePath)) {
      s.period.copy_signal_status = 'missing'
      return cb()
    }

    var raw = readSignal(filePath)
    if (raw && raw.__error) {
      s.period.copy_signal_status = 'error'
      s.period.copy_signal_error = raw.__error
      return cb()
    }

    var signalData = normalizeSignal(raw)
    if (!signalData) {
      s.period.copy_signal_status = 'invalid'
      return cb()
    }

    var age = signalAgeSeconds(signalData.timestamp)
    s.period.copy_signal_status = 'loaded'
    s.period.copy_signal = signalData.signal
    s.period.copy_signal_confidence = signalData.confidence
    s.period.copy_signal_source = signalData.source
    s.period.copy_signal_reasoning = signalData.reasoning
    s.period.copy_signal_age_s = age
    s.period.copy_signal_side = signalData.side
    s.period.copy_signal_symbol = signalData.symbol
    s.period.copy_signal_tags = signalData.tags.join(',')
    s.period.copy_signal_expires_at = signalData.expires_at || ''

    if (age > s.options.signal_max_age_s) {
      s.period.copy_signal_status = 'stale'
      return cb()
    }

    if (isExpired(signalData.expires_at)) {
      s.period.copy_signal_status = 'expired'
      return cb()
    }

    if (signalData.confidence < s.options.signal_threshold) {
      s.period.copy_signal_status = 'below-threshold'
      return cb()
    }

    if (signalData.side === 'buy' && s.options.allow_buy) s.signal = 'buy'
    else if (signalData.side === 'sell' && s.options.allow_sell) s.signal = 'sell'
    else s.signal = null

    cb()
  },
  onReport: function (s) {
    var cols = []

    if (s.period.copy_signal_status) {
      cols.push(z(16, 'sig ' + s.period.copy_signal_status, ' ').grey)
    }

    if (s.period.copy_signal_side) {
      var color = s.period.copy_signal_side === 'buy' ? 'green' : (s.period.copy_signal_side === 'sell' ? 'red' : 'grey')
      cols.push(z(14, 'file ' + s.period.copy_signal_side, ' ')[color])
    }

    if (typeof s.period.copy_signal_confidence === 'number') {
      cols.push(z(8, n(s.period.copy_signal_confidence * 100).format('0.0') + '%', ' ').cyan)
    }

    if (typeof s.period.copy_signal_age_s === 'number' && isFinite(s.period.copy_signal_age_s)) {
      cols.push(z(10, s.period.copy_signal_age_s + 's', ' ').yellow)
    }

    if (s.period.copy_signal_symbol) {
      cols.push(z(14, s.period.copy_signal_symbol, ' ').white)
    }

    return cols
  },
  phenotypes: {
    period_length: Phenotypes.RangePeriod(1, 120, 'm'),
    min_periods: Phenotypes.Range(1, 20),
    markdown_buy_pct: Phenotypes.RangeFloat(-1, 5),
    markup_sell_pct: Phenotypes.RangeFloat(-1, 5),
    order_type: Phenotypes.ListOption(['maker', 'taker']),
    sell_stop_pct: Phenotypes.Range0(1, 50),
    buy_stop_pct: Phenotypes.Range0(1, 50),
    profit_stop_enable_pct: Phenotypes.Range0(1, 20),
    profit_stop_pct: Phenotypes.Range(1, 20),
    signal_max_age_s: Phenotypes.Range(60, 7200),
    signal_threshold: Phenotypes.RangeFloat(0.5, 0.99)
  }
}
