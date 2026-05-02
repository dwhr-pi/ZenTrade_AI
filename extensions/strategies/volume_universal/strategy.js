var n = require('numbro')
var rsi = require('../../../lib/rsi')
var ema = require('../../../lib/ema')
var vwap = require('../../../lib/vwap')
var Phenotypes = require('../../../lib/phenotype')

module.exports = {
  name: 'volume_universal',
  description: 'Volume-based strategy using RSI, EMA, VWAP, and price-volume divergence.',

  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '30m')
    this.option('period_length', 'period length, same as --period', String, '30m')
    this.option('min_periods', 'min. number of history periods', Number, 52)
    this.option('rsi_periods', 'number of RSI periods', Number, 14)
    this.option('oversold_rsi', 'buy when RSI reaches or drops below this value', Number, 30)
    this.option('overbought_rsi', 'sell when RSI reaches or goes above this value', Number, 70)
    this.option('ema_short', 'number of periods for the shorter EMA', Number, 5)
    this.option('ema_long', 'number of periods for the longer EMA', Number, 20)
    this.option('volume_threshold', 'minimum volume threshold as a multiplier of average volume', Number, 1.5)
    this.option('volume_persistence', 'number of periods to check for persistent volume', Number, 3)
    this.option('price_volume_threshold', 'threshold for price-volume divergence', Number, 0.3)
    this.option('vwap_length', 'length of VWAP calculation', Number, 20)
    this.option('profit_stop_enable', 'enable trailing profit stop', Boolean, true)
    this.option('profit_stop_percent', 'profit stop percentage', Number, 1.0)
  },

  calculate: function (s) {
    rsi(s, 'rsi', s.options.rsi_periods)
    ema(s, 'ema_short', s.options.ema_short)
    ema(s, 'ema_long', s.options.ema_long)
    vwap(s, 'vwap', s.options.vwap_length)

    if (s.lookback.length <= s.options.min_periods) {
      return
    }

    var periods = Math.min(20, s.lookback.length)
    var volumeSum = 0
    for (var i = 0; i < periods; i++) {
      volumeSum += s.lookback[i].volume
    }

    s.period.avg_volume = volumeSum / periods
    if (!s.period.avg_volume) {
      return
    }

    s.period.volume_ratio = s.period.volume / s.period.avg_volume

    var persistentVolume = true
    for (var j = 0; j < s.options.volume_persistence && j < s.lookback.length; j++) {
      if (s.lookback[j].volume < s.options.volume_threshold * s.period.avg_volume) {
        persistentVolume = false
        break
      }
    }
    s.period.persistent_volume = persistentVolume

    var basePeriod = s.lookback[0]
    if (!basePeriod.volume || !basePeriod.close) {
      return
    }

    var priceChange = (s.period.close - basePeriod.close) / basePeriod.close
    var volumeChange = (s.period.volume - basePeriod.volume) / basePeriod.volume
    s.period.price_volume_divergence = priceChange * -1 * volumeChange
    s.period.bullish_divergence = priceChange < 0 && volumeChange > 0 &&
      Math.abs(s.period.price_volume_divergence) > s.options.price_volume_threshold
    s.period.bearish_divergence = priceChange > 0 && volumeChange < 0 &&
      Math.abs(s.period.price_volume_divergence) > s.options.price_volume_threshold
  },

  onPeriod: function (s, cb) {
    if (!s.period.avg_volume || !s.period.vwap || typeof s.period.rsi !== 'number') {
      return cb()
    }

    var buySignal =
      s.period.rsi <= s.options.oversold_rsi &&
      s.period.ema_short > s.period.ema_long &&
      s.period.volume_ratio >= s.options.volume_threshold &&
      (s.period.persistent_volume || s.period.bullish_divergence) &&
      s.period.close > s.period.vwap

    var sellSignal =
      (
        s.period.rsi >= s.options.overbought_rsi ||
        s.period.ema_short < s.period.ema_long ||
        s.period.bearish_divergence
      ) &&
      s.period.close < s.period.vwap

    if (buySignal && !sellSignal) {
      s.signal = 'buy'
    } else if (sellSignal) {
      s.signal = 'sell'
    } else {
      s.signal = null
    }

    if (
      s.options.profit_stop_enable &&
      s.signal === null &&
      s.position &&
      s.position.price &&
      s.position.side
    ) {
      var profitPercentage = 0
      if (s.position.side === 'long') {
        profitPercentage = (s.period.close - s.position.price) / s.position.price * 100
      } else if (s.position.side === 'short') {
        profitPercentage = (s.position.price - s.period.close) / s.position.price * 100
      }

      if (profitPercentage >= s.options.profit_stop_percent) {
        s.signal = 'sell'
      }
    }

    if (typeof s.period.volume_ratio === 'number') {
      s.period.volume_ratio_text = n(s.period.volume_ratio).format('0.00')
    }
    if (typeof s.period.avg_volume === 'number') {
      s.period.avg_volume_text = n(s.period.avg_volume).format('0.00')
    }

    cb()
  },

  onReport: function (s) {
    var cols = []
    if (typeof s.period.volume_ratio === 'number') {
      cols.push(' Vol Ratio: ' + s.period.volume_ratio_text)
    }
    if (typeof s.period.avg_volume === 'number') {
      cols.push(' Avg Vol: ' + s.period.avg_volume_text)
    }
    if (typeof s.period.rsi === 'number') {
      cols.push(' RSI: ' + n(s.period.rsi).format('0.00'))
    }
    if (typeof s.period.vwap === 'number') {
      cols.push(' VWAP: ' + n(s.period.vwap).format('0.00'))
    }
    if (typeof s.period.price_volume_divergence === 'number') {
      cols.push(' P/V Div: ' + n(s.period.price_volume_divergence).format('0.000'))
    }
    return cols
  },

  phenotypes: {
    period_length: Phenotypes.RangePeriod(5, 120, 'm'),
    min_periods: Phenotypes.Range(10, 100),
    markdown_buy_pct: Phenotypes.RangeFloat(-1, 5),
    markup_sell_pct: Phenotypes.RangeFloat(-1, 5),
    order_type: Phenotypes.ListOption(['maker', 'taker']),
    sell_stop_pct: Phenotypes.Range0(1, 50),
    buy_stop_pct: Phenotypes.Range0(1, 50),
    profit_stop_enable_pct: Phenotypes.Range0(1, 20),
    profit_stop_pct: Phenotypes.Range(1, 20),
    rsi_periods: Phenotypes.Range(10, 30),
    oversold_rsi: Phenotypes.Range(20, 40),
    overbought_rsi: Phenotypes.Range(60, 80),
    ema_short: Phenotypes.Range(2, 12),
    ema_long: Phenotypes.Range(15, 40),
    volume_threshold: Phenotypes.RangeFloat(1, 5),
    volume_persistence: Phenotypes.Range(1, 10),
    price_volume_threshold: Phenotypes.RangeFloat(0.1, 1.0),
    vwap_length: Phenotypes.Range(10, 50)
  }
}
