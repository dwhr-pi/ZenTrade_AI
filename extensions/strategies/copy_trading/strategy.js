var fs = require('fs')
var path = require('path')
var z = require('zero-fill')
var Phenotypes = require('../../../lib/phenotype')

function normalizeSymbol(symbol) {
  return String(symbol || '')
    .trim()
    .toUpperCase()
    .replace(/[_/]/g, '-')
}

function parseClock(value) {
  var parts = String(value || '').split(':')
  if (parts.length !== 2) return null
  var hours = Number(parts[0])
  var minutes = Number(parts[1])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

module.exports = {
  name: 'copy_trading',
  description: 'File-based copy-trading adapter for Zenbot using external JSON signals.',

  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '1m')
    this.option('period_length', 'period length, same as --period', String, '1m')
    this.option('min_periods', 'min. number of history periods', Number, 1)
    this.option('signal_file', 'path to the JSON signal file', String, 'signals.json')
    this.option('signal_timeout', 'signal timeout in minutes, 0 disables timeout', Number, 60)
    this.option('enable_trading_hours', 'limit trading to a time window', Boolean, false)
    this.option('trading_hours_start', 'start of trading window (HH:MM)', String, '09:00')
    this.option('trading_hours_end', 'end of trading window (HH:MM)', String, '17:00')
    this.option('enable_signal_filter', 'reject signals below the quality threshold', Boolean, false)
    this.option('min_signal_quality', 'minimum signal quality from 0 to 100', Number, 50)
    this.option('allow_sell_without_position', 'allow raw sell signals even if no local entry was tracked', Boolean, false)
  },

  calculate: function (s) {
    if (!s.copy_trading) {
      s.copy_trading = {
        processed_ids: {},
        signal_queue: [],
        last_file_mtime: 0,
        last_signal_id: null,
        last_signal_action: null,
        last_signal_source: null,
        last_error: null,
        synthetic_position: false
      }
    }
  },

  onPeriod: function (s, cb) {
    this.calculate(s)
    this.loadSignalsFromFile(s)

    if (!this.isWithinTradingHours(s)) {
      s.signal = null
      return cb()
    }

    var signal = this.dequeueNextSignal(s)
    if (!signal) {
      s.signal = null
      return cb()
    }

    s.copy_trading.last_signal_id = signal.id
    s.copy_trading.last_signal_action = signal.action
    s.copy_trading.last_signal_source = signal.source || 'unknown'

    if (signal.action === 'buy') {
      if (!s.copy_trading.synthetic_position) {
        s.copy_trading.synthetic_position = true
        s.signal = 'buy'
      } else {
        s.signal = null
      }
    } else if (signal.action === 'sell') {
      if (s.copy_trading.synthetic_position || s.options.allow_sell_without_position) {
        s.copy_trading.synthetic_position = false
        s.signal = 'sell'
      } else {
        s.signal = null
      }
    } else {
      s.signal = null
    }

    cb()
  },

  loadSignalsFromFile: function (s) {
    var resolved = path.resolve(process.cwd(), s.options.signal_file)
    var stats
    try {
      stats = fs.statSync(resolved)
    } catch (err) {
      s.copy_trading.last_error = 'signal file not found: ' + resolved
      return
    }

    if (stats.mtimeMs <= s.copy_trading.last_file_mtime) {
      return
    }

    var raw
    try {
      raw = fs.readFileSync(resolved, 'utf8')
    } catch (err) {
      s.copy_trading.last_error = 'unable to read signal file: ' + err.message
      return
    }

    var parsed
    try {
      parsed = JSON.parse(raw)
    } catch (err) {
      s.copy_trading.last_error = 'invalid signal JSON: ' + err.message
      return
    }

    if (!Array.isArray(parsed)) {
      s.copy_trading.last_error = 'signal file must contain a JSON array'
      return
    }

    s.copy_trading.last_file_mtime = stats.mtimeMs
    s.copy_trading.last_error = null

    for (var i = 0; i < parsed.length; i++) {
      this.enqueueSignalIfValid(s, parsed[i])
    }
  },

  enqueueSignalIfValid: function (s, signal) {
    if (!signal || !signal.id || !signal.action) {
      return
    }

    if (s.copy_trading.processed_ids[signal.id]) {
      return
    }

    var action = String(signal.action).toLowerCase()
    if (action !== 'buy' && action !== 'sell') {
      return
    }

    var targetSymbol = normalizeSymbol(signal.symbol)
    var currentSymbol = normalizeSymbol(s.product_id)
    if (targetSymbol && currentSymbol && targetSymbol !== currentSymbol) {
      return
    }

    if (s.options.enable_signal_filter && Number(signal.quality || 0) < s.options.min_signal_quality) {
      return
    }

    if (s.options.signal_timeout > 0 && signal.timestamp) {
      var ts = Number(signal.timestamp)
      if (Number.isFinite(ts)) {
        if (ts < 1000000000000) ts = ts * 1000
        if (Date.now() - ts > s.options.signal_timeout * 60 * 1000) {
          return
        }
      }
    }

    s.copy_trading.processed_ids[signal.id] = true
    s.copy_trading.signal_queue.push({
      id: signal.id,
      action: action,
      source: signal.source || 'unknown',
      timestamp: signal.timestamp || null
    })
  },

  dequeueNextSignal: function (s) {
    if (!s.copy_trading.signal_queue.length) {
      return null
    }
    return s.copy_trading.signal_queue.shift()
  },

  isWithinTradingHours: function (s) {
    if (!s.options.enable_trading_hours) {
      return true
    }

    var start = parseClock(s.options.trading_hours_start)
    var finish = parseClock(s.options.trading_hours_end)
    if (start === null || finish === null) {
      return true
    }

    var now = new Date()
    var current = now.getHours() * 60 + now.getMinutes()

    if (start <= finish) {
      return current >= start && current <= finish
    }
    return current >= start || current <= finish
  },

  onReport: function (s) {
    var cols = []
    var queueSize = s.copy_trading ? s.copy_trading.signal_queue.length : 0
    var positionState = s.copy_trading && s.copy_trading.synthetic_position ? 'LONG' : 'FLAT'

    cols.push(z(7, positionState, ' ').cyan)
    cols.push(z(6, String(queueSize), ' ').grey)

    if (s.copy_trading && s.copy_trading.last_signal_action) {
      var color = s.copy_trading.last_signal_action === 'buy' ? 'green' : 'red'
      cols.push(z(10, s.copy_trading.last_signal_action.toUpperCase(), ' ')[color])
    }

    if (s.copy_trading && s.copy_trading.last_signal_source) {
      cols.push(z(10, s.copy_trading.last_signal_source, ' ').grey)
    }

    if (s.copy_trading && s.copy_trading.last_error) {
      cols.push(z(12, 'FILE_ERR', ' ').red)
    }

    return cols
  },

  phenotypes: {
    period_length: Phenotypes.RangePeriod(1, 120, 'm'),
    min_periods: Phenotypes.Range(1, 50),
    markdown_buy_pct: Phenotypes.RangeFloat(-1, 5),
    markup_sell_pct: Phenotypes.RangeFloat(-1, 5),
    order_type: Phenotypes.ListOption(['maker', 'taker']),
    sell_stop_pct: Phenotypes.Range0(1, 50),
    buy_stop_pct: Phenotypes.Range0(1, 50),
    profit_stop_enable_pct: Phenotypes.Range0(1, 20),
    profit_stop_pct: Phenotypes.Range(1, 20),
    signal_timeout: Phenotypes.Range(0, 240),
    min_signal_quality: Phenotypes.Range(0, 100)
  }
}
