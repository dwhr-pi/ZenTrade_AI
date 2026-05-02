module.exports = {
  db: {
    type: 'csv',
    csv: {
      dataDir: './data/csv',
      syncInterval: 0
    }
  },
  selector: 'gdax.BTC-USD',
  strategy: 'trend_ema',
  order_type: 'maker',
  days: 1,
  poll_trades: 30000,
  currency_capital: 1000,
  asset_capital: 0,
  period: '1m',
  period_length: '1m',
  min_periods: 1,
  markdown_buy_pct: 0,
  markup_sell_pct: 0,
  avg_slippage_pct: 0.045,
  buy_pct: 99,
  sell_pct: 99,
  order_adjust_time: 5000,
  order_poll_time: 5000,
  sell_stop_pct: 0,
  buy_stop_pct: 0,
  profit_stop_enable_pct: 0,
  profit_stop_pct: 1,
  max_sell_loss_pct: 99,
  max_buy_loss_pct: 99,
  max_slippage_pct: 5,
  keep_lookback_periods: 500
}
