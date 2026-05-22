var fs = require('fs')
var path = require('path')

function resolveRiskFile(filePath) {
  if (!filePath) return null
  if (path.isAbsolute(filePath)) return filePath
  return path.resolve(process.cwd(), filePath)
}

function readPayload(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (err) {
    return { __error: err.message }
  }
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null

  var recommendation = payload.recommendation || payload.signal || payload.action || 'hold'
  recommendation = String(recommendation).toLowerCase()
  if (['buy', 'sell', 'hold'].indexOf(recommendation) === -1) recommendation = 'hold'

  var riskScore = Number(payload.risk_score)
  if (!isFinite(riskScore)) riskScore = Number(payload.confidence)
  if (!isFinite(riskScore)) riskScore = 1

  return {
    recommendation: recommendation,
    risk_score: riskScore,
    confidence: typeof payload.confidence === 'number' ? payload.confidence : null,
    source: payload.source || '',
    timestamp: payload.timestamp || null,
    expires_at: payload.expires_at || null,
    reasoning: payload.reasoning || '',
    tags: Array.isArray(payload.tags) ? payload.tags.filter(Boolean) : []
  }
}

function resolveRiskPayload(raw, referenceTime) {
  if (Array.isArray(raw)) {
    raw = { assessments: raw }
  }

  if (raw && Array.isArray(raw.assessments)) {
    var selected = null

    raw.assessments.forEach(function (entry) {
      var normalized = normalizePayload(entry)
      if (!normalized) return

      var entryTime = normalized.timestamp ? new Date(normalized.timestamp).getTime() : null
      if (!entryTime || isNaN(entryTime)) return
      if (entryTime > referenceTime) return
      if (isExpired(normalized.expires_at, referenceTime)) return

      if (!selected || entryTime > new Date(selected.timestamp).getTime()) {
        selected = normalized
      }
    })

    return selected
  }

  return normalizePayload(raw)
}

function getReferenceTime(period) {
  if (period && period.time) {
    var periodTime = new Date(period.time).getTime()
    if (!isNaN(periodTime)) return periodTime
  }
  return Date.now()
}

function signalAgeSeconds(timestamp, referenceTime) {
  if (!timestamp) return 0
  var signalTime = new Date(timestamp).getTime()
  if (isNaN(signalTime)) return 0
  return Math.max(0, Math.round(((referenceTime || Date.now()) - signalTime) / 1000))
}

function isExpired(expiresAt, referenceTime) {
  if (!expiresAt) return false
  var expires = new Date(expiresAt).getTime()
  if (isNaN(expires)) return false
  return (referenceTime || Date.now()) > expires
}

module.exports = {
  name: 'risk_analysis_file',
  description: 'File-based risk gating strategy for analysis, simulation, and paper trading workflows.',
  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '5m')
    this.option('period_length', 'period length, same as --period', String, '5m')
    this.option('min_periods', 'min. number of history periods', Number, 1)
    this.option('risk_file', 'path to a JSON risk analysis file', String, './data/risk/risk-analysis.example.json')
    this.option('risk_max_age_s', 'maximum accepted age of a risk payload in seconds', Number, 1800)
    this.option('max_buy_risk', 'maximum risk score accepted for buy recommendations', Number, 0.35)
    this.option('risk_exit_threshold', 'risk score that triggers a defensive sell signal', Number, 0.8)
    this.option('allow_buy', 'allow buy recommendations from the risk file', Boolean, true)
    this.option('allow_sell', 'allow sell recommendations from the risk file', Boolean, true)
  },
  calculate: function () {},
  onPeriod: function (s, cb) {
    var filePath = resolveRiskFile(s.options.risk_file)
    var referenceTime = getReferenceTime(s.period)
    s.period.risk_file = filePath

    if (!filePath || !fs.existsSync(filePath)) {
      s.period.risk_status = 'missing'
      return cb()
    }

    var raw = readPayload(filePath)
    if (raw && raw.__error) {
      s.period.risk_status = 'error'
      s.period.risk_error = raw.__error
      return cb()
    }

    var payload = resolveRiskPayload(raw, referenceTime)
    if (!payload) {
      s.period.risk_status = 'invalid'
      return cb()
    }

    var age = signalAgeSeconds(payload.timestamp, referenceTime)
    s.period.risk_status = 'loaded'
    s.period.risk_recommendation = payload.recommendation
    s.period.risk_score = payload.risk_score
    s.period.risk_source = payload.source
    s.period.risk_reasoning = payload.reasoning
    s.period.risk_age_s = age
    s.period.risk_expires_at = payload.expires_at || ''
    s.period.risk_tags = payload.tags.join(',')

    if (age > s.options.risk_max_age_s) {
      s.period.risk_status = 'stale'
      return cb()
    }

    if (isExpired(payload.expires_at, referenceTime)) {
      s.period.risk_status = 'expired'
      return cb()
    }

    if (payload.risk_score >= s.options.risk_exit_threshold && s.options.allow_sell) {
      s.period.risk_status = 'risk-exit'
      s.signal = 'sell'
      return cb()
    }

    if (payload.recommendation === 'buy' && payload.risk_score <= s.options.max_buy_risk && s.options.allow_buy) {
      s.signal = 'buy'
      return cb()
    }

    if (payload.recommendation === 'sell' && s.options.allow_sell) {
      s.signal = 'sell'
      return cb()
    }

    if (payload.recommendation === 'buy' && payload.risk_score > s.options.max_buy_risk) {
      s.period.risk_status = 'blocked-by-risk'
    }

    s.signal = null
    cb()
  },
  onReport: function () {
    return []
  },
  phenotypes: {}
}
