var z = require('zero-fill')
var n = require('numbro')
var ema = require('../../../lib/ema')
var rsi = require('../../../lib/rsi')
var Phenotypes = require('../../../lib/phenotype')
var bollinger = require('../../../lib/bollinger')
var vwap = require('../../../lib/vwap')

var MLModel = {
  predict: function (features) {
    var prediction = 0
    var weights = [0.3, 0.2, 0.15, 0.15, 0.1, 0.1]

    if (features.rsi < 30) prediction += weights[0]
    else if (features.rsi > 70) prediction -= weights[0]

    if (features.macd > 0) prediction += weights[1]
    else if (features.macd < 0) prediction -= weights[1]

    if (features.price > features.upperBand) prediction -= weights[2]
    else if (features.price < features.lowerBand) prediction += weights[2]

    if (features.emaShort > features.emaLong) prediction += weights[3]
    else if (features.emaShort < features.emaLong) prediction -= weights[3]

    if (features.volumeChange > 0) prediction += weights[4]
    else if (features.volumeChange < 0) prediction -= weights[4]

    if (features.priceChange > 0) prediction += weights[5]
    else if (features.priceChange < 0) prediction -= weights[5]

    return {
      signal: prediction > 0.2 ? 'buy' : (prediction < -0.2 ? 'sell' : 'hold'),
      confidence: Math.abs(prediction)
    }
  }
}

var PatternRecognition = {
  findPatterns: function (lookback) {
    if (!lookback || lookback.length < 5) return { pattern: 'none', confidence: 0 }

    var doubleBottom = this.checkDoubleBottom(lookback)
    if (doubleBottom.confidence > 0.5) return doubleBottom

    var doubleTop = this.checkDoubleTop(lookback)
    if (doubleTop.confidence > 0.5) return doubleTop

    var breakout = this.checkBreakout(lookback)
    if (breakout.confidence > 0.5) return breakout

    return { pattern: 'none', confidence: 0 }
  },

  checkDoubleBottom: function (lookback) {
    var prices = lookback.map(function (period) { return period.close })
    var lowestIdx = prices.indexOf(Math.min.apply(null, prices))
    var secondLowest = Infinity
    var secondLowestIdx = -1

    for (var i = 0; i < prices.length; i++) {
      if (i !== lowestIdx && prices[i] < secondLowest && Math.abs(i - lowestIdx) > 1) {
        secondLowest = prices[i]
        secondLowestIdx = i
      }
    }

    if (secondLowestIdx !== -1 && Math.abs(prices[lowestIdx] - secondLowest) / prices[lowestIdx] < 0.03) {
      var minIdx = Math.min(lowestIdx, secondLowestIdx)
      var maxIdx = Math.max(lowestIdx, secondLowestIdx)
      for (var j = minIdx + 1; j < maxIdx; j++) {
        if (prices[j] > prices[minIdx] * 1.02 && prices[j] > prices[maxIdx] * 1.02) {
          return { pattern: 'double_bottom', confidence: 0.7, signal: 'buy' }
        }
      }
    }

    return { pattern: 'none', confidence: 0 }
  },

  checkDoubleTop: function (lookback) {
    var prices = lookback.map(function (period) { return period.close })
    var highestIdx = prices.indexOf(Math.max.apply(null, prices))
    var secondHighest = -Infinity
    var secondHighestIdx = -1

    for (var i = 0; i < prices.length; i++) {
      if (i !== highestIdx && prices[i] > secondHighest && Math.abs(i - highestIdx) > 1) {
        secondHighest = prices[i]
        secondHighestIdx = i
      }
    }

    if (secondHighestIdx !== -1 && Math.abs(prices[highestIdx] - secondHighest) / prices[highestIdx] < 0.03) {
      var minIdx = Math.min(highestIdx, secondHighestIdx)
      var maxIdx = Math.max(highestIdx, secondHighestIdx)
      for (var j = minIdx + 1; j < maxIdx; j++) {
        if (prices[j] < prices[minIdx] * 0.98 && prices[j] < prices[maxIdx] * 0.98) {
          return { pattern: 'double_top', confidence: 0.7, signal: 'sell' }
        }
      }
    }

    return { pattern: 'none', confidence: 0 }
  },

  checkBreakout: function (lookback) {
    var prices = lookback.map(function (period) { return period.close })
    var volumes = lookback.map(function (period) { return period.volume })

    if (!volumes[1] || !prices[1]) return { pattern: 'none', confidence: 0 }

    var recentPriceChange = (prices[0] - prices[1]) / prices[1]
    var recentVolumeChange = (volumes[0] - volumes[1]) / volumes[1]

    if (Math.abs(recentPriceChange) > 0.03 && recentVolumeChange > 0.5) {
      return {
        pattern: recentPriceChange > 0 ? 'bullish_breakout' : 'bearish_breakout',
        confidence: 0.6,
        signal: recentPriceChange > 0 ? 'buy' : 'sell'
      }
    }

    return { pattern: 'none', confidence: 0 }
  }
}

module.exports = {
  name: 'bitcoin_ai_strategy',
  description: 'Hybrid BTC strategy using RSI, MACD, Bollinger Bands, VWAP, pattern checks, and simple AI scoring.',

  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '1h')
    this.option('period_length', 'period length, same as --period', String, '1h')
    this.option('min_periods', 'min. number of history periods', Number, 200)
    this.option('keep_lookback_periods', 'number of historical periods to keep for pattern recognition', Number, 500)
    this.option('rsi_periods', 'number of periods for RSI calculation', Number, 14)
    this.option('oversold_rsi', 'oversold RSI level', Number, 30)
    this.option('overbought_rsi', 'overbought RSI level', Number, 70)
    this.option('ema_short_period', 'number of periods for short EMA', Number, 12)
    this.option('ema_long_period', 'number of periods for long EMA', Number, 26)
    this.option('signal_period', 'number of periods for MACD signal', Number, 9)
    this.option('bollinger_time', 'bollinger size in standard deviations', Number, 2)
    this.option('bollinger_period', 'bollinger period', Number, 20)
    this.option('vwap_length', 'length of VWAP calculation', Number, 20)
    this.option('confidence_threshold', 'minimum confidence for trading signals', Number, 0.7)
    this.option('stop_loss_pct', 'stop loss percentage', Number, 2)
    this.option('profit_target_pct', 'profit target percentage', Number, 4)
    this.option('trailing_stop_pct', 'trailing stop percentage', Number, 1)
  },

  calculate: function (s) {
    rsi(s, 'rsi', s.options.rsi_periods)
    ema(s, 'ema_short', s.options.ema_short_period)
    ema(s, 'ema_long', s.options.ema_long_period)

    if (s.period.ema_short && s.period.ema_long) {
      s.period.macd = s.period.ema_short - s.period.ema_long
      ema(s, 'signal', s.options.signal_period, 'macd')
      if (s.period.signal) {
        s.period.macd_histogram = s.period.macd - s.period.signal
      }
    }

    bollinger(s, 'bollinger', s.options.bollinger_period)
    vwap(s, 'vwap', s.options.vwap_length)

    if (s.lookback[0] && s.lookback[0].volume && s.lookback[0].close) {
      s.period.volume_change = ((s.period.volume - s.lookback[0].volume) / s.lookback[0].volume) * 100
      s.period.price_change = ((s.period.close - s.lookback[0].close) / s.lookback[0].close) * 100
    } else {
      s.period.volume_change = 0
      s.period.price_change = 0
    }

    if (
      typeof s.period.rsi === 'number' &&
      typeof s.period.macd === 'number' &&
      s.period.bollinger &&
      typeof s.period.ema_short === 'number' &&
      typeof s.period.ema_long === 'number'
    ) {
      s.period.features = {
        rsi: s.period.rsi,
        macd: s.period.macd,
        price: s.period.close,
        upperBand: s.period.bollinger.upperBound,
        lowerBand: s.period.bollinger.lowerBound,
        emaShort: s.period.ema_short,
        emaLong: s.period.ema_long,
        volumeChange: s.period.volume_change,
        priceChange: s.period.price_change
      }
      s.period.ml_prediction = MLModel.predict(s.period.features)
    }

    s.period.pattern = s.lookback.length >= 5
      ? PatternRecognition.findPatterns(s.lookback.slice(0, 5))
      : { pattern: 'none', confidence: 0 }
  },

  onPeriod: function (s, cb) {
    if (
      typeof s.period.rsi !== 'number' ||
      typeof s.period.macd_histogram !== 'number' ||
      !s.period.bollinger ||
      !s.period.ml_prediction ||
      !s.lookback[0] ||
      typeof s.lookback[0].macd_histogram !== 'number'
    ) {
      return cb()
    }

    var signals = { buy: 0, sell: 0, hold: 0 }

    if (s.period.rsi <= s.options.oversold_rsi) signals.buy += 0.3
    else if (s.period.rsi >= s.options.overbought_rsi) signals.sell += 0.3
    else signals.hold += 0.3

    if (s.period.macd_histogram > 0 && s.period.macd_histogram > s.lookback[0].macd_histogram) signals.buy += 0.2
    else if (s.period.macd_histogram < 0 && s.period.macd_histogram < s.lookback[0].macd_histogram) signals.sell += 0.2
    else signals.hold += 0.2

    if (s.period.close < s.period.bollinger.lowerBound) signals.buy += 0.15
    else if (s.period.close > s.period.bollinger.upperBound) signals.sell += 0.15
    else signals.hold += 0.15

    if (s.period.close > s.period.vwap) signals.buy += 0.05
    else if (s.period.close < s.period.vwap) signals.sell += 0.05

    if (s.period.ml_prediction.signal === 'buy' && s.period.ml_prediction.confidence >= s.options.confidence_threshold) {
      signals.buy += 0.2
    } else if (s.period.ml_prediction.signal === 'sell' && s.period.ml_prediction.confidence >= s.options.confidence_threshold) {
      signals.sell += 0.2
    } else {
      signals.hold += 0.2
    }

    if (s.period.pattern.confidence >= 0.5) {
      if (s.period.pattern.signal === 'buy') signals.buy += 0.1
      else if (s.period.pattern.signal === 'sell') signals.sell += 0.1
    } else {
      signals.hold += 0.1
    }

    var nextSignal = null
    if (signals.buy > signals.sell && signals.buy > signals.hold) nextSignal = 'buy'
    else if (signals.sell > signals.buy && signals.sell > signals.hold) nextSignal = 'sell'

    if (s.bitcoin_ai_entry_price) {
      if (!s.bitcoin_ai_highest || s.period.close > s.bitcoin_ai_highest) {
        s.bitcoin_ai_highest = s.period.close
      }

      var currentProfit = (s.period.close - s.bitcoin_ai_entry_price) / s.bitcoin_ai_entry_price * 100
      var trailingFloor = s.bitcoin_ai_highest * (1 - s.options.trailing_stop_pct / 100)

      if (
        currentProfit <= -s.options.stop_loss_pct ||
        currentProfit >= s.options.profit_target_pct ||
        s.period.close <= trailingFloor
      ) {
        nextSignal = 'sell'
      }
    }

    if (nextSignal === 'buy') {
      if (!s.bitcoin_ai_entry_price) {
        s.bitcoin_ai_entry_price = s.period.close
        s.bitcoin_ai_highest = s.period.close
        s.signal = 'buy'
      } else {
        s.signal = null
      }
    } else if (nextSignal === 'sell') {
      if (s.bitcoin_ai_entry_price) {
        s.bitcoin_ai_entry_price = null
        s.bitcoin_ai_highest = null
        s.signal = 'sell'
      } else {
        s.signal = null
      }
    } else {
      s.signal = null
    }

    cb()
  },

  onReport: function (s) {
    var cols = []

    if (typeof s.period.rsi === 'number') {
      var rsiColor = 'grey'
      if (s.period.rsi <= s.options.oversold_rsi) rsiColor = 'green'
      else if (s.period.rsi >= s.options.overbought_rsi) rsiColor = 'red'
      cols.push(z(5, n(s.period.rsi).format('0.0'), ' ')[rsiColor] + ' RSI')
    }

    if (typeof s.period.macd === 'number') {
      var macdColor = 'grey'
      if (s.period.macd > 0) macdColor = 'green'
      else if (s.period.macd < 0) macdColor = 'red'
      cols.push(z(8, n(s.period.macd).format('0.000'), ' ')[macdColor] + ' MACD')
    }

    if (s.period.ml_prediction) {
      var mlColor = 'grey'
      if (s.period.ml_prediction.signal === 'buy') mlColor = 'green'
      else if (s.period.ml_prediction.signal === 'sell') mlColor = 'red'
      cols.push(z(8, n(s.period.ml_prediction.confidence).format('0.000'), ' ')[mlColor] + ' ML ' + s.period.ml_prediction.signal)
    }

    if (s.period.pattern && s.period.pattern.pattern !== 'none') {
      var patternColor = s.period.pattern.signal === 'buy' ? 'green' : 'red'
      cols.push(z(15, s.period.pattern.pattern, ' ')[patternColor] + ' ' + n(s.period.pattern.confidence).format('0.0'))
    }

    return cols
  },

  phenotypes: {
    period_length: Phenotypes.RangePeriod(1, 120, 'm'),
    min_periods: Phenotypes.Range(10, 300),
    markdown_buy_pct: Phenotypes.RangeFloat(-1, 5),
    markup_sell_pct: Phenotypes.RangeFloat(-1, 5),
    order_type: Phenotypes.ListOption(['maker', 'taker']),
    sell_stop_pct: Phenotypes.Range0(1, 50),
    buy_stop_pct: Phenotypes.Range0(1, 50),
    profit_stop_enable_pct: Phenotypes.Range0(1, 20),
    profit_stop_pct: Phenotypes.Range(1, 20),
    keep_lookback_periods: Phenotypes.Range(100, 1000),
    rsi_periods: Phenotypes.Range(10, 30),
    oversold_rsi: Phenotypes.Range(20, 40),
    overbought_rsi: Phenotypes.Range(60, 80),
    ema_short_period: Phenotypes.Range(8, 20),
    ema_long_period: Phenotypes.Range(20, 40),
    signal_period: Phenotypes.Range(6, 15),
    bollinger_time: Phenotypes.RangeFloat(1.5, 3.0),
    bollinger_period: Phenotypes.Range(10, 30),
    vwap_length: Phenotypes.Range(10, 50),
    confidence_threshold: Phenotypes.RangeFloat(0.5, 0.9),
    stop_loss_pct: Phenotypes.RangeFloat(0.5, 5),
    profit_target_pct: Phenotypes.RangeFloat(1, 10),
    trailing_stop_pct: Phenotypes.RangeFloat(0.5, 3)
  }
}
