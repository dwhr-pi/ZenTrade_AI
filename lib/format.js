let n = require('numbro')

let max_fc_width = 0

function normalizeNumber(value) {
  if (value === null || typeof value === 'undefined') return null
  var num = Number(value)
  return Number.isFinite(num) ? num : null
}

module.exports = {
  formatAsset: function formatAsset (amt, asset) {
    var value = normalizeNumber(amt)
    return (value === null ? 'n/a' : n(value).format('0.00000000')) + ' ' + asset
  },
  formatPercent: function formatPercent (ratio) {
    var value = normalizeNumber(ratio)
    if (value === null) return 'n/a'
    return (value >= 0 ? '+' : '') + n(value).format('0.00%')
  },
  formatCurrency: function formatCurrency (amt, currency, omit_currency, color_trick, do_pad) {
    amt = normalizeNumber(amt)
    if (amt === null) {
      return 'n/a' + (omit_currency ? '' : ' ' + currency)
    }
    let str
    let fstr
    amt > 999 ? fstr = '0.00' :
      amt > 99 ? fstr = '0.000' :
        amt > 9 ? fstr = '0.0000' :
          amt > 0.9 ? fstr = '0.00000' :
            amt > 0.09 ? fstr = '0.000000' :
              amt > 0.009 ? fstr = '0.0000000' :
                fstr = '0.00000000'
    str = n(amt).format(fstr)
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
