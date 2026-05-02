var https = require('https')
var z = require('zero-fill')
var n = require('numbro')
var Phenotypes = require('../../../lib/phenotype')

function parseJsonFromText(text) {
  try {
    return JSON.parse(text)
  } catch (e) {
    var match = text && text.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw e
  }
}

function requestAnalysis(payload, apiKey, apiHost, cb) {
  var body = JSON.stringify(payload)
  var req = https.request({
    hostname: apiHost,
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    },
    timeout: 30000
  }, function (res) {
    var chunks = ''
    res.on('data', function (chunk) {
      chunks += chunk
    })
    res.on('end', function () {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return cb(new Error('OpenAI API HTTP ' + res.statusCode + ': ' + chunks))
      }

      try {
        var response = JSON.parse(chunks)
        var content = response.choices &&
          response.choices[0] &&
          response.choices[0].message &&
          response.choices[0].message.content

        if (!content) {
          return cb(new Error('OpenAI API returned no message content'))
        }

        cb(null, parseJsonFromText(content))
      } catch (err) {
        cb(err)
      }
    })
  })

  req.on('error', function (err) {
    cb(err)
  })

  req.on('timeout', function () {
    req.destroy(new Error('OpenAI API request timed out'))
  })

  req.write(body)
  req.end()
}

module.exports = {
  name: 'chatgpt_strategy',
  description: 'Strategy using an OpenAI-compatible chat completion endpoint for trading signals.',

  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '5m')
    this.option('period_length', 'period length, same as --period', String, '5m')
    this.option('min_periods', 'min. number of history periods', Number, 50)
    this.option('openai_api_key', 'OpenAI API key', String, process.env.OPENAI_API_KEY || '')
    this.option('openai_model', 'OpenAI model to use for analysis', String, process.env.OPENAI_MODEL || '')
    this.option('openai_api_host', 'OpenAI-compatible API host', String, process.env.OPENAI_API_HOST || 'api.openai.com')
    this.option('signal_threshold', 'minimum confidence required to trade', Number, 0.7)
    this.option('history_points', 'number of candles sent to the model', Number, 10)
  },

  calculate: function () {},

  onPeriod: function (s, cb) {
    if (!s.options.openai_api_key) {
      return cb()
    }
    if (!s.options.openai_model) {
      return cb()
    }
    if (s.lookback.length < s.options.min_periods) {
      return cb()
    }
    if (s.chatgpt_request_pending) {
      return cb()
    }

    var history = s.lookback
      .slice(0, s.options.min_periods)
      .map(function (period) {
        return {
          open: period.open,
          high: period.high,
          low: period.low,
          close: period.close,
          volume: period.volume,
          timestamp: period.time
        }
      })
      .reverse()
      .slice(-s.options.history_points)

    var payload = {
      model: s.options.openai_model,
      messages: [
        {
          role: 'system',
          content: 'You are a trading assistant. Return only JSON with keys signal, confidence, reasoning. signal must be buy, sell, or hold.'
        },
        {
          role: 'user',
          content:
            'Analyze the following crypto candles and return JSON only. ' +
            'Use confidence from 0 to 1.\n\n' +
            'Candles:\n' + JSON.stringify(history, null, 2) + '\n\n' +
            'Current candle:\n' + JSON.stringify({
              close: s.period.close,
              volume: s.period.volume,
              high: s.period.high,
              low: s.period.low
            }, null, 2)
        }
      ],
      max_tokens: 200,
      temperature: 0.2
    }

    s.chatgpt_request_pending = true

    requestAnalysis(payload, s.options.openai_api_key, s.options.openai_api_host, function (err, analysis) {
      s.chatgpt_request_pending = false

      if (err) {
        s.period.ai_error = err.message
        return cb()
      }

      if (!analysis || typeof analysis.confidence !== 'number' || !analysis.signal) {
        s.period.ai_error = 'Invalid AI analysis payload'
        return cb()
      }

      s.period.ai_signal = analysis.signal
      s.period.ai_confidence = analysis.confidence
      s.period.ai_reasoning = analysis.reasoning || ''

      if (analysis.confidence >= s.options.signal_threshold) {
        if (analysis.signal === 'buy' || analysis.signal === 'sell') {
          s.signal = analysis.signal
        } else {
          s.signal = null
        }
      } else {
        s.signal = null
      }

      cb()
    })
  },

  onReport: function (s) {
    var cols = []
    if (s.chatgpt_request_pending) {
      cols.push(' AI pending'.grey)
    }
    if (s.period.ai_signal && typeof s.period.ai_confidence === 'number') {
      var color = 'grey'
      if (s.period.ai_signal === 'buy') color = 'green'
      else if (s.period.ai_signal === 'sell') color = 'red'
      cols.push(z(18, 'AI ' + s.period.ai_signal, ' ')[color])
      cols.push(z(8, n(s.period.ai_confidence * 100).format('0.0') + '%', ' ')[color])
    }
    return cols
  },

  phenotypes: {
    period_length: Phenotypes.RangePeriod(1, 120, 'm'),
    min_periods: Phenotypes.Range(20, 200),
    markdown_buy_pct: Phenotypes.RangeFloat(-1, 5),
    markup_sell_pct: Phenotypes.RangeFloat(-1, 5),
    order_type: Phenotypes.ListOption(['maker', 'taker']),
    sell_stop_pct: Phenotypes.Range0(1, 50),
    buy_stop_pct: Phenotypes.Range0(1, 50),
    profit_stop_enable_pct: Phenotypes.Range0(1, 20),
    profit_stop_pct: Phenotypes.Range(1, 20),
    signal_threshold: Phenotypes.RangeFloat(0.5, 0.95),
    history_points: Phenotypes.Range(5, 30)
  }
}
