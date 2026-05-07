module.exports = {
  name: 'engulfing_candlestick',
  description: 'Trades bullish and bearish engulfing candlestick patterns on completed periods.',

  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '1h')
    this.option('period_length', 'period length, same as --period', String, '1h')
    this.option('min_periods', 'min. number of history periods', Number, 2)
    this.option('buy_pct', 'buy with this % of capital', Number, 99)
    this.option('sell_pct', 'sell with this % of capital', Number, 99)
  },

  calculate: function () {},

  onPeriod: function (s, cb) {
    if (s.lookback.length < 1) {
      return cb()
    }

    var current = s.period
    var previous = s.lookback[0]

    var bullishEngulfing =
      current.close > current.open &&
      previous.close < previous.open &&
      current.low < previous.low &&
      current.high > previous.high

    var bearishEngulfing =
      current.close < current.open &&
      previous.close > previous.open &&
      current.low < previous.low &&
      current.high > previous.high

    if (bullishEngulfing) {
      s.signal = 'buy'
    } else if (bearishEngulfing) {
      s.signal = 'sell'
    } else {
      s.signal = null
    }

    cb()
  },

  onReport: function () {
    return []
  }
}
