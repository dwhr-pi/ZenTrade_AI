var products = require('./products.json')

module.exports = function stubExchange () {
  var interval = Math.max(parseInt(process.env.ZENBOT_STUB_INTERVAL || '60000', 10) || 60000, 1000)
  var batchSize = Math.max(parseInt(process.env.ZENBOT_STUB_BATCH_SIZE || '250', 10) || 250, 1)
  var baseTime = Date.UTC(2024, 0, 1, 0, 0, 0, 0)

  function alignForward(time) {
    if (time <= baseTime) return baseTime
    return Math.ceil((time - baseTime) / interval) * interval + baseTime
  }

  function alignBackward(time) {
    if (time <= baseTime) return baseTime
    return Math.floor((time - baseTime) / interval) * interval + baseTime
  }

  function indexFromTime(time) {
    return Math.max(0, Math.round((time - baseTime) / interval))
  }

  function priceAt(index) {
    var trend = index * 0.45
    var waveA = Math.sin(index / 14) * 110
    var waveB = Math.cos(index / 29) * 45
    return Number((20000 + trend + waveA + waveB).toFixed(8))
  }

  function sizeAt(index) {
    return Number((0.05 + ((index % 5) * 0.01)).toFixed(8))
  }

  function makeTrade(time) {
    var index = indexFromTime(time)
    return {
      trade_id: index + 1,
      time: time,
      size: sizeAt(index),
      price: priceAt(index),
      side: index % 2 === 0 ? 'buy' : 'sell'
    }
  }

  function getTradesForward(opts) {
    var firstTime

    if (typeof opts.from === 'number') {
      firstTime = alignForward(opts.from)
    }
    else {
      firstTime = alignForward(Date.now() - (batchSize * interval))
    }

    var trades = []
    for (var i = 0; i < batchSize; i++) {
      trades.push(makeTrade(firstTime + (i * interval)))
    }

    return trades
  }

  function getTradesBackward(opts) {
    var endTime

    if (typeof opts.to === 'number') {
      endTime = alignBackward(opts.to - interval)
    }
    else {
      endTime = alignBackward(Date.now())
    }

    var trades = []
    for (var i = 0; i < batchSize; i++) {
      trades.push(makeTrade(endTime - (i * interval)))
    }

    return trades
  }

  return {
    name: 'stub',
    historyScan: 'backward',
    historyScanUsesTime: true,
    makerFee: 0,
    takerFee: 0,
    dynamicFees: false,
    backfillRateLimit: 0,

    getProducts: function () {
      return products
    },

    getCursor: function (tradeOrTime) {
      if (typeof tradeOrTime === 'number') {
        return tradeOrTime
      }
      return tradeOrTime.time
    },

    getTrades: function (opts, cb) {
      opts = opts || {}
      if (typeof opts.from === 'number') {
        return cb(null, getTradesForward(opts))
      }
      return cb(null, getTradesBackward(opts))
    },

    getQuote: function (opts, cb) {
      var productId = opts && opts.product_id ? opts.product_id : products[0].product_id
      var nowTrade = makeTrade(alignForward(Date.now()))
      cb(null, {
        product_id: productId,
        bid: nowTrade.price,
        ask: nowTrade.price
      })
    }
  }
}
