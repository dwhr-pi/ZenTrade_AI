let n = require('numbro')

let max_fc_width = 0

function normalizeAmount(amt) {
  if (amt === null || amt === undefined || amt === '') return null
  const value = Number(amt)
  return Number.isFinite(value) ? value : null
}

module.exports = {
  formatAsset: function formatAsset (amt, asset) {
    const value = normalizeAmount(amt)
    if (value === null) return 'n/a ' + asset
    return n(value).format('0.00000000') + ' ' + asset
  },
  formatPercent: function formatPercent (ratio) {
    const value = normalizeAmount(ratio)
    if (value === null) return 'n/a'
    return (value >= 0 ? '+' : '') + n(value).format('0.00%')
  },
  formatCurrency: function formatCurrency (amt, currency, omit_currency, color_trick, do_pad) {
    const value = normalizeAmount(amt)
    if (value === null) {
      let fallback = 'n/a'
      if (do_pad) {
        max_fc_width = Math.max(max_fc_width, fallback.length)
        fallback = ' '.repeat(max_fc_width - fallback.length) + fallback
      }
      return fallback + (omit_currency ? '' : ' ' + currency)
    }
    let str
    let fstr
    value > 999 ? fstr = '0.00' :
      value > 99 ? fstr = '0.000' :
        value > 9 ? fstr = '0.0000' :
          value > 0.9 ? fstr = '0.00000' :
            value > 0.09 ? fstr = '0.000000' :
              value > 0.009 ? fstr = '0.0000000' :
                fstr = '0.00000000'
    str = n(value).format(fstr)
    if (do_pad) {
      max_fc_width = Math.max(max_fc_width, str.length)
      str = ' '.repeat(max_fc_width - str.length) + str
    }
    if (color_trick) {
      str = str
        .replace(/^(.*\.)(.*?)(0*)$/, function (_, m1, m2, m3) {
          return m1.cyan + m2.yellow + m3.grey
        })
    }
    return str + (omit_currency ? '' : ' ' + currency)
  }
}
